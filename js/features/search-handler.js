/**
 * search-handler.js - 検索機能モジュール
 * Phase 5: main.jsから分離
 */

// ============================================
// 検索ハンドラークラス
// ============================================
class SearchHandler {
  constructor(app) {
    this.app = app; // PromptGeneratorAppインスタンスへの参照
  }

  /**
   * 検索を実行
   * @param {Object} options - 検索オプション
   */
  async performSearch(options = {}) {
    if (AppState.ui.isSearching) return;

    const keyword = document.getElementById("search").value;
    const searchCat0 = document.getElementById("search-cat0").value;
    const searchCat1 = document.getElementById("search-cat1").value;
    const categories = [searchCat0, searchCat1];

    AppState.data.searchCategory = categories;
    await saveCategory();

    // ローディング表示の制御（翻訳が必要な場合のみ表示）
    const needsTranslation =
      keyword && Search(keyword, categories).length === 0;
    const showLoading = options.showLoading !== false && needsTranslation;

    if (showLoading) {
      // ローディングが必要な場合のみErrorHandler.handleAsyncを使用
      await ErrorHandler.handleAsync(
        async () => {
          AppState.ui.isSearching = true;
          await this.doSearch(keyword, categories);
          AppState.ui.isSearching = false;
        },
        "検索処理",
        { showLoading: true }
      );
    } else {
      // ローディング不要な場合は直接実行
      AppState.ui.isSearching = true;
      await this.doSearch(keyword, categories);
      AppState.ui.isSearching = false;
    }
  }

  /**
   * 検索処理の実行
   * @param {string} keyword - 検索キーワード
   * @param {Array} categories - カテゴリーフィルター
   */
  async doSearch(keyword, categories) {
    ListBuilder.clearList("#promptList");

    const results = Search(keyword, categories);

    if (results.length > 0) {
      await this.app.listManager.createList("search", results, "#promptList", {
        isSave: false,
      });
      const isSearchElement = document.getElementById("isSearch");
      if (isSearchElement) {
        isSearchElement.innerHTML = "";
      }
    } else if (keyword) {
      await this.handleNoSearchResults(keyword);
    } else {
      const isSearchElement = document.getElementById("isSearch");
      if (isSearchElement) {
        isSearchElement.innerHTML = "何も見つかりませんでした";
      }
    }
  }

  /**
   * 検索結果が0件の場合の処理
   * @param {string} keyword - 検索キーワード
   */
  async handleNoSearchResults(keyword) {
    SearchLogAPI(keyword);

    const isSearchElement = document.getElementById("isSearch");
    if (isSearchElement) {
      isSearchElement.innerHTML = "辞書内に存在しないため翻訳中";
    }

    const translationPromises = [];
    const results = [];

    // Google翻訳
    translationPromises.push(
      this.translateWithService(keyword, "Google", translateGoogle).then(
        (data) => results.push(data)
      )
    );

    // DeepL翻訳（APIキーがある場合）
    if (AppState.userSettings.optionData?.deeplAuthKey) {
      translationPromises.push(
        this.translateWithService(keyword, "DeepL", translateDeepl).then(
          (data) => results.push(data)
        )
      );
    }

    await Promise.all(translationPromises);

    if (isSearchElement) {
      isSearchElement.innerHTML = "";
    }

    await this.app.listManager.createList("search", results, "#promptList", {
      isSave: true,
    });
  }

  /**
   * 翻訳サービスを使用した翻訳
   * @param {string} keyword - 翻訳するキーワード
   * @param {string} serviceName - サービス名
   * @param {Function} translateFunc - 翻訳関数
   * @returns {Promise<Object>} 翻訳結果
   */
  async translateWithService(keyword, serviceName, translateFunc) {
    return new Promise((resolve) => {
      translateFunc(keyword, (translatedText) => {
        const isAlphanumeric = /^[a-zA-Z0-9\s:]+$/.test(keyword);
        const data = isAlphanumeric
          ? {
              prompt: keyword,
              data: { 0: "", 1: `${serviceName}翻訳`, 2: translatedText },
            }
          : {
              prompt: translatedText,
              data: { 0: "", 1: `${serviceName}翻訳`, 2: keyword },
            };
        resolve(data);
      });
    });
  }

  /**
   * カテゴリー検索をリセット
   */
  resetCategorySearch() {
    const searchCat0 = document.getElementById("search-cat0");
    const searchCat1 = document.getElementById("search-cat1");

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

    const searchInput = document.getElementById("search");
    if (searchInput && searchInput.value) {
      // リセット時はローディングを表示しない
      this.performSearch({ showLoading: false });
    }
  }

  /**
   * カテゴリードロップダウンを更新
   * @param {string} targetId - 対象要素のID
   * @param {number} categoryLevel - カテゴリーレベル
   * @param {string} parentValue - 親カテゴリーの値
   */
  updateCategoryDropdown(targetId, categoryLevel, parentValue) {
    // targetIdがセレクタ形式（#で始まる）の場合は、IDのみを抽出
    const elementId = targetId.startsWith("#")
      ? targetId.substring(1)
      : targetId;
    const selectElement = document.getElementById(elementId);

    if (!selectElement) return;

    // 既存のオプションをクリア
    selectElement.innerHTML = "";

    const categoryItems = categoryData.data[categoryLevel].filter(
      (item) => item.parent === parentValue
    );

    categoryItems.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.value;
      selectElement.appendChild(option);
    });

    selectElement.disabled = false;
    selectElement.value = "";
  }
}

// グローバルに公開
if (typeof window !== "undefined") {
  window.SearchHandler = SearchHandler;
}
