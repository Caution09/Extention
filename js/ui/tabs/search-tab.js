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

        // 要素追加機能の設定
        this.setupElementRegistration();

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
       * 検索結果を表示し直す
       */
      async refreshSearchResults() {
        // 現在の検索条件を確認
        const keyword = this.getElement("#search")?.value || "";
        const hasActiveSearch = keyword || 
                               AppState.data.searchCategory?.[0] || 
                               AppState.data.searchCategory?.[1];
        
        // 何らかの検索条件がある場合のみ再検索
        if (hasActiveSearch) {
          console.log("Refreshing search results after element addition");
          console.log("Current search conditions:", {
            keyword,
            category0: AppState.data.searchCategory?.[0],
            category1: AppState.data.searchCategory?.[1]
          });
          
          // 現在の検索条件で再検索
          await this.performSearch({ showLoading: false, forceRefresh: true });
        } else {
          console.log("No active search conditions, skipping refresh");
        }
      }

      /**
       * 要素登録の設定
       */
      setupElementRegistration() {
        const resistButton = this.getElement("#resist");
        if (resistButton) {
          this.addEventListener(resistButton, "click", async () => {
            await this.handleElementRegistration();
          });
        }

        // Enterキーでも登録できるように
        const promptInput = this.getElement("#prompt");
        if (promptInput) {
          this.addEventListener(promptInput, "keypress", async (e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              await this.handleElementRegistration();
            }
          });
        }

        // カテゴリー入力フィールドの設定
        this.setupCategoryInputs();
      }

      /**
       * カテゴリー入力フィールドの設定
       */
      setupCategoryInputs() {
        const bigInput = this.getElement("#big");
        const middleInput = this.getElement("#middle");
        const smallInput = this.getElement("#small");

        if (bigInput && middleInput) {
          // 大項目と中項目のみ連動
          EventHandlers.setupCategoryChain([bigInput, middleInput]);

          // クリア動作を追加
          EventHandlers.addInputClearBehavior(bigInput);
          EventHandlers.addInputClearBehavior(middleInput);

          // 小項目は単純な入力フィールドとして扱う
          if (smallInput) {
            EventHandlers.addInputClearBehavior(smallInput);
          }
        }
      }

      /**
       * 要素の登録処理
       */
      async handleElementRegistration() {
        const bigInput = this.getElement("#big");
        const middleInput = this.getElement("#middle");
        const smallInput = this.getElement("#small");
        const promptInput = this.getElement("#prompt");

        const data = {
          big: bigInput ? bigInput.value : "",
          middle: middleInput ? middleInput.value : "",
          small: smallInput ? smallInput.value : "",
          prompt: promptInput ? promptInput.value : "",
        };

        // バリデーション
        const promptValidation = Validators.validatePrompt(data.prompt);
        if (!promptValidation.isValid) {
          ErrorHandler.notify(promptValidation.errors[0].message);
          return;
        }

        const categoryValidation = Validators.validateCategories(data);
        if (!categoryValidation.isValid) {
          ErrorHandler.notify(categoryValidation.errors[0].message);
          return;
        }

        // 登録
        const success = Regist(data.big, data.middle, data.small, data.prompt);
        if (success) {
          // 入力フィールドをクリア
          if (bigInput) bigInput.value = "";
          if (middleInput) middleInput.value = "";
          if (smallInput) smallInput.value = "";
          if (promptInput) promptInput.value = "";

          // 成功通知
          ErrorHandler.notify("要素を追加しました", {
            type: ErrorHandler.NotificationType.TOAST,
            messageType: "success",
            duration: 1500,
          });

          // プロンプト入力にフォーカスを戻す
          if (promptInput) {
            promptInput.focus();
          }

          // 新しい要素がカテゴリーに追加された場合のみドロップダウンを更新
          if (data.big || data.middle) {
            console.log("New category added, updating dropdowns:", { big: data.big, middle: data.middle });
            // ドロップダウンの更新は自動的にsetCategoryListで選択値が保持される
          } else {
            console.log("No new categories, skipping dropdown update");
          }

          // 検索結果を更新（現在の検索条件で再検索）
          setTimeout(async () => {
            await this.refreshSearchResults();
          }, 300);
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
