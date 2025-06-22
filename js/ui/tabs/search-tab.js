/**
 * search-tab.js - 検索タブモジュール
 * Phase 8.5: 検索、カテゴリーフィルター、翻訳機能
 */

// TabManagerが利用可能になるまで待つ
(function () {
  "use strict";

  // TabManagerが定義されるまで待機
  function defineSearchTab() {
    if (typeof TabManager === "undefined") {
      setTimeout(defineSearchTab, 10);
      return;
    }

    // SearchTabクラスの定義
    class SearchTab extends TabManager {
      constructor(app) {
        super(app, {
          tabId: "searchTabBody",
          tabButtonId: null, // 検索タブは常に表示なのでボタンIDなし
          tabIndex: 0, // CONSTANTS.TABS.SEARCH
        });

        // SearchHandlerへの参照
        this.searchHandler = null;

        // 検索結果のキャッシュ（パフォーマンス向上）
        this.searchCache = new Map();
        this.cacheTimeout = 300000; // 5分
      }

      /**
       * 初期化処理
       */
      async onInit() {
        // SearchHandlerの参照を取得
        this.searchHandler = this.app.searchHandler;
        if (!this.searchHandler) {
          throw new Error("SearchHandler not found");
        }

        // イベントリスナーを設定
        this.setupEventListeners();

        // カテゴリードロップダウンを初期化
        this.initializeCategoryDropdowns();

        // 保存された検索カテゴリーを復元
        this.restoreSearchCategories();

        console.log("SearchTab initialized");
      }

      /**
       * タブ表示時の処理
       */
      async onShow() {
        // 検索フィールドにフォーカス
        const searchInput = this.getElement("#search");
        if (searchInput) {
          searchInput.focus();
        }

        // 前回の検索状態を復元
        if (
          AppState.data.searchCategory?.[0] ||
          AppState.data.searchCategory?.[1]
        ) {
          // カテゴリーが設定されている場合は自動検索
          await this.performSearch({ showLoading: false });
        }
      }

      /**
       * イベントリスナーの設定
       */
      setupEventListeners() {
        // キーワード検索
        const searchButton = this.getElement("#searchButton");
        if (searchButton) {
          this.addEventListener(searchButton, "click", () => {
            this.performSearch({ showLoading: true });
          });
        }

        const searchInput = this.getElement("#search");
        if (searchInput) {
          // Enterキーで検索
          this.addEventListener(searchInput, "keypress", (e) => {
            if (e.key === "Enter") {
              this.performSearch({ showLoading: true });
            }
          });

          // 入力内容が変更されたらキャッシュをクリア
          this.addEventListener(searchInput, "input", () => {
            this.clearSearchCache();
          });
        }

        // カテゴリー検索
        this.setupCategoryEventListeners();
      }

      /**
       * カテゴリー検索のイベントリスナー設定
       */
      setupCategoryEventListeners() {
        const searchCat0 = this.getElement("#search-cat0");
        if (searchCat0) {
          this.addEventListener(searchCat0, "change", (e) => {
            const value = e.target.value;
            this.updateCategoryDropdown(1, value);
            // ドロップダウン変更時はローディングを表示しない
            this.performSearch({ showLoading: false });
          });
        }

        const searchCat1 = this.getElement("#search-cat1");
        if (searchCat1) {
          this.addEventListener(searchCat1, "change", () => {
            // ドロップダウン変更時はローディングを表示しない
            this.performSearch({ showLoading: false });
          });
        }

        const searchCatReset = this.getElement("#search-cat-reset");
        if (searchCatReset) {
          this.addEventListener(searchCatReset, "click", () => {
            this.resetCategorySearch();
          });
        }
      }

      /**
       * カテゴリードロップダウンを初期化
       */
      initializeCategoryDropdowns() {
        // 大カテゴリーを設定
        setCategoryList("#search-cat0", 0);

        // 初期状態では中カテゴリーは無効
        const searchCat1 = this.getElement("#search-cat1");
        if (searchCat1) {
          searchCat1.disabled = true;
        }
      }

      /**
       * 保存された検索カテゴリーを復元
       */
      restoreSearchCategories() {
        if (AppState.data.searchCategory?.[0]) {
          const searchCat0 = this.getElement("#search-cat0");
          if (searchCat0) {
            searchCat0.value = AppState.data.searchCategory[0];
            this.updateCategoryDropdown(1, AppState.data.searchCategory[0]);

            if (AppState.data.searchCategory[1]) {
              const searchCat1 = this.getElement("#search-cat1");
              if (searchCat1) {
                searchCat1.value = AppState.data.searchCategory[1];
              }
            }
          }
        }
      }

      /**
       * カテゴリードロップダウンを更新
       * @param {number} level - カテゴリーレベル（1=中カテゴリー）
       * @param {string} parentValue - 親カテゴリーの値
       */
      updateCategoryDropdown(level, parentValue) {
        const targetId = level === 1 ? "#search-cat1" : null;
        if (!targetId) return;

        const selectElement = this.getElement(targetId);
        if (!selectElement) return;

        // 既存のオプションをクリア
        selectElement.innerHTML = "";

        // 空のオプションを追加
        const emptyOption = document.createElement("option");
        emptyOption.value = "";
        emptyOption.textContent = "";
        selectElement.appendChild(emptyOption);

        // カテゴリーアイテムを追加
        const categoryItems = categoryData.data[level].filter(
          (item) => item.parent === parentValue
        );

        categoryItems.forEach((item) => {
          const option = document.createElement("option");
          option.value = item.value;
          option.textContent = item.value;
          selectElement.appendChild(option);
        });

        selectElement.disabled = false;
      }

      /**
       * 検索を実行
       * @param {Object} options - 検索オプション
       */
      async performSearch(options = {}) {
        if (AppState.ui.isSearching) return;

        const keyword = this.getElement("#search").value;
        const searchCat0 = this.getElement("#search-cat0").value;
        const searchCat1 = this.getElement("#search-cat1").value;
        const categories = [searchCat0, searchCat1];

        // キャッシュキーを生成
        const cacheKey = JSON.stringify({ keyword, categories });

        // キャッシュをチェック
        if (!options.forceRefresh && this.searchCache.has(cacheKey)) {
          const cached = this.searchCache.get(cacheKey);
          if (Date.now() - cached.timestamp < this.cacheTimeout) {
            this.displaySearchResults(cached.results);
            return;
          }
        }

        AppState.data.searchCategory = categories;
        await saveCategory();

        // SearchHandlerに処理を委譲
        await this.searchHandler.performSearch(options);

        // 結果をキャッシュ（SearchHandlerが結果を表示した後）
        // 注: 実際の結果はSearchHandlerが管理するため、ここではタイムスタンプのみ
        this.searchCache.set(cacheKey, {
          timestamp: Date.now(),
          results: null, // 将来的に結果もキャッシュする場合用
        });
      }

      /**
       * カテゴリー検索をリセット
       */
      resetCategorySearch() {
        const searchCat0 = this.getElement("#search-cat0");
        const searchCat1 = this.getElement("#search-cat1");

        if (searchCat0) {
          searchCat0.value = "";
          // changeイベントを手動で発火
          searchCat0.dispatchEvent(new Event("change"));
        }

        if (searchCat1) {
          searchCat1.value = "";
          searchCat1.disabled = true;
        }

        AppState.data.searchCategory = [,];
        saveCategory();

        const searchInput = this.getElement("#search");
        if (searchInput && searchInput.value) {
          // リセット時はローディングを表示しない
          this.performSearch({ showLoading: false });
        }

        // キャッシュもクリア
        this.clearSearchCache();
      }

      /**
       * 検索結果を表示（将来の拡張用）
       * @param {Array} results - 検索結果
       */
      displaySearchResults(results) {
        // 現在はSearchHandlerが処理しているが、
        // 将来的にタブ内で完結させる場合用
      }

      /**
       * 検索キャッシュをクリア
       */
      clearSearchCache() {
        this.searchCache.clear();
      }

      /**
       * 検索履歴を取得（将来の拡張用）
       * @returns {Array} 検索履歴
       */
      getSearchHistory() {
        // 将来的に検索履歴機能を追加する場合用
        return [];
      }

      /**
       * 高度な検索オプションを表示（将来の拡張用）
       */
      showAdvancedSearch() {
        // 将来的に高度な検索機能を追加する場合用
      }

      /**
       * タブのリフレッシュ
       */
      async onRefresh() {
        // 検索結果をリフレッシュ
        if (
          this.getElement("#search").value ||
          AppState.data.searchCategory?.[0] ||
          AppState.data.searchCategory?.[1]
        ) {
          await this.performSearch({ showLoading: false, forceRefresh: true });
        }
      }

      /**
       * キーボードショートカット設定（将来の拡張用）
       */
      setupKeyboardShortcuts() {
        // Ctrl+K: 検索フォーカス（main.jsで実装済み）
        // 将来的に追加のショートカットを実装
      }

      /**
       * デバッグ情報を出力（オーバーライド）
       */
      debug() {
        super.debug();
        console.log("SearchHandler:", this.searchHandler);
        console.log("Cache size:", this.searchCache.size);
        console.log("Current categories:", AppState.data.searchCategory);
      }
    }

    // グローバルに公開
    if (typeof window !== "undefined") {
      window.SearchTab = SearchTab;
    }
  }

  // 初期実行
  defineSearchTab();
})();
