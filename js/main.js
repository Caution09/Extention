/**
 * main.js - Prompt Generator メインスクリプト
 * Phase 2: コード品質改善版
 */

// ============================================
// グローバル定数
// ============================================
const CONSTANTS = {
  TABS: {
    SEARCH: 0,
    DICTIONARY: 1,
    EDIT: 2,
    OTHER: 3,
  },
  UI_TYPES: {
    SD: "SD",
    NAI: "NAI",
    NONE: "None",
  },
  EDIT_TYPES: {
    SELECT: "SELECT",
    TEXT: "TEXT",
  },
};

// ============================================
// アプリケーションクラス
// ============================================
class PromptGeneratorApp {
  constructor() {
    this.generateInput = $("#generatePrompt");
    this.listManager = new PromptListManager();
    this.fileHandler = new FileHandler();
    this.initialized = false;
    this.lastFocusedInput = null; // 最後にフォーカスされた入力フィールドを記憶
  }

  /**
   * アプリケーションを初期化
   */
  async init() {
    try {
      // データの初期化
      await initializeDataManager();

      // カテゴリーデータの初期化
      categoryData.init();

      // UIの初期化
      this.initializeUI();

      // イベントハンドラーの設定
      this.setupEventHandlers();

      // コンテキストメニューからのメッセージを受信
      this.setupContextMenuListener();

      this.initialized = true;
      console.log("Application initialized successfully");
    } catch (error) {
      ErrorHandler.log(
        "Application initialization failed",
        error,
        ErrorHandler.Level.CRITICAL
      );
      ErrorHandler.notify(
        "アプリケーションの初期化に失敗しました。ページを再読み込みしてください。"
      );
      // エラーを再スローして呼び出し元でキャッチできるようにする
      throw error;
    }
  }

  /**
   * コンテキストメニューからのメッセージリスナーを設定
   */
  setupContextMenuListener() {
    // フォーカストラッキングを追加
    $(document).on("focus", 'input[type="text"], textarea', (e) => {
      this.lastFocusedInput = e.target;
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "insertPrompt") {
        console.log("Received prompt to insert:", message.text);

        // 現在フォーカスされている要素、または最後にフォーカスされた要素を取得
        const activeElement = document.activeElement;
        const targetElement =
          activeElement &&
          (activeElement.tagName === "INPUT" ||
            activeElement.tagName === "TEXTAREA")
            ? activeElement
            : this.lastFocusedInput;

        if (
          targetElement &&
          (targetElement.tagName === "INPUT" ||
            targetElement.tagName === "TEXTAREA")
        ) {
          // 現在のカーソル位置にテキストを挿入
          const start = targetElement.selectionStart || 0;
          const end = targetElement.selectionEnd || 0;
          const currentValue = targetElement.value || "";

          targetElement.value =
            currentValue.substring(0, start) +
            message.text +
            currentValue.substring(end);
          targetElement.selectionStart = targetElement.selectionEnd =
            start + message.text.length;

          // フォーカスを戻す
          targetElement.focus();

          // イベントを発火
          $(targetElement).trigger("input").trigger("change");

          sendResponse({ success: true });
        } else {
          // メインのプロンプト入力フィールドに挿入
          const currentValue = this.generateInput.val() || "";
          this.generateInput.val(currentValue + message.text);
          this.generateInput.trigger("input").trigger("change");
          this.generateInput.focus();

          sendResponse({ success: true });
        }
      }

      return true; // 非同期レスポンスのため
    });
  }

  /**
   * UIを初期化
   */
  initializeUI() {
    // タブの初期設定
    this.setupTabs();

    // ソート可能なリストの設定
    this.setupSortableLists();

    // ドラッグ&ドロップエリアの設定
    this.setupDragDrop();

    // 初期表示の設定
    this.updateUIState();
  }

  /**
   * イベントハンドラーを設定
   */
  setupEventHandlers() {
    // ウィンドウ操作
    this.setupWindowHandlers();

    // タブ操作（メソッド名を修正）
    this.setupTabs();

    // 検索機能
    this.setupSearchHandlers();

    // 編集機能
    this.setupEditHandlers();

    // 辞書機能
    this.setupDictionaryHandlers();

    // オプション設定
    this.setupOptionHandlers();

    // プロンプト入力
    this.setupPromptInputHandlers();

    // ボタン操作
    this.setupButtonHandlers();
  }

  // ============================================
  // タブ管理
  // ============================================

  setupTabs() {
    const tabs = $(".tab");
    tabs.on("click", (e) => this.handleTabSwitch(e));
  }

  handleTabSwitch(event) {
    const $clickedTab = $(event.currentTarget);

    // すでにアクティブなタブをクリックした場合は何もしない
    if ($clickedTab.hasClass("is-active")) {
      return;
    }

    // アクティブタブの切り替え
    $(".tab.is-active").removeClass("is-active");
    $clickedTab.addClass("is-active");

    // パネルの切り替え
    $(".panel.is-show").removeClass("is-show");
    const tabIndex = $(".tab").index($clickedTab);
    $(".panel").eq(tabIndex).addClass("is-show");

    // タブ別の処理
    const previousTab = AppState.ui.currentTab;
    AppState.ui.currentTab = tabIndex;

    console.log("Tab switched from", previousTab, "to", tabIndex);

    if (
      tabIndex === CONSTANTS.TABS.EDIT &&
      previousTab !== CONSTANTS.TABS.EDIT
    ) {
      this.initializeEditMode();
    }

    // ポップアップを閉じる
    this.closePopup();
  }

  // ============================================
  // ウィンドウ操作
  // ============================================

  setupWindowHandlers() {
    $("#openWindow").on("click", () => {
      const displayType = $("#displayType").val();
      const message =
        displayType === "page"
          ? { type: "openPage" }
          : { type: "openWindow", windowType: displayType };

      chrome.runtime.sendMessage(message);
    });

    $("#show-panel").on("click", () => {
      $("#optionPanel").toggleClass("active");
    });

    $("#popup-image").on("click", () => this.closePopup());
  }

  closePopup() {
    $("#popup").hide();
  }

  // ============================================
  // 検索機能
  // ============================================

  setupSearchHandlers() {
    // カテゴリー検索
    $("#search-cat0").on("change", (e) => {
      const value = $(e.target).val();
      this.updateCategoryDropdown("#search-cat1", 1, value);
      // ドロップダウン変更時はローディングを表示しない
      this.performSearch({ showLoading: false });
    });

    $("#search-cat1").on("change", () => {
      // ドロップダウン変更時はローディングを表示しない
      this.performSearch({ showLoading: false });
    });

    $("#search-cat-reset").on("click", () => {
      this.resetCategorySearch();
    });

    // キーワード検索
    $("#searchButton").on("click", () => {
      // ボタンクリック時はローディングを表示
      this.performSearch({ showLoading: true });
    });

    $("#search").on("keypress", (e) => {
      if (e.keyCode === 13) {
        // Enter key
        // Enterキー押下時はローディングを表示
        this.performSearch({ showLoading: true });
      }
    });
  }

  async performSearch(options = {}) {
    if (AppState.ui.isSearching) return;

    const keyword = $("#search").val();
    const categories = [$("#search-cat0").val(), $("#search-cat1").val()];

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

  async doSearch(keyword, categories) {
    ListBuilder.clearList("#promptList");

    const results = Search(keyword, categories);

    if (results.length > 0) {
      await this.listManager.createList("search", results, "#promptList", {
        isSave: false,
      });
      $("#isSearch").html("");
    } else if (keyword) {
      await this.handleNoSearchResults(keyword);
    } else {
      $("#isSearch").html("何も見つかりませんでした");
    }
  }

  async handleNoSearchResults(keyword) {
    SearchLogAPI(keyword);
    $("#isSearch").html("辞書内に存在しないため翻訳中");

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

    $("#isSearch").html("");
    await this.listManager.createList("search", results, "#promptList", {
      isSave: true,
    });
  }

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

  resetCategorySearch() {
    $("#search-cat0").val("").trigger("change");
    $("#search-cat1").val("").prop("disabled", true);

    AppState.data.searchCategory = [,];
    saveCategory();

    if ($("#search").val()) {
      // リセット時はローディングを表示しない
      this.performSearch({ showLoading: false });
    }
  }

  updateCategoryDropdown(targetId, categoryLevel, parentValue) {
    $(targetId).empty();

    const categoryItems = categoryData.data[categoryLevel].filter(
      (item) => item.parent === parentValue
    );

    categoryItems.forEach((item) => {
      $(targetId).append(
        $("<option>", {
          value: item.value,
          text: item.value,
        })
      );
    });

    $(targetId).prop("disabled", false).val("");
  }

  // ============================================
  // 編集機能
  // ============================================

  setupEditHandlers() {
    $('[name="UIType"]').on("change", (e) => this.handleUITypeChange(e));
    $('[name="EditType"]').on("change", (e) => this.handleEditTypeChange(e));

    // この行を削除（タブ切り替えはsetupTabsで処理される）
    // $('#editTab').on('click', () => this.initializeEditMode());
  }

  handleUITypeChange(event) {
    const selectedValue = event.target.value;
    AppState.userSettings.optionData.shaping = selectedValue;

    this.updatePromptDisplay();
    this.initializeEditMode();
    saveOptionData();
  }

  handleEditTypeChange(event) {
    const selectedValue = event.target.value;
    AppState.userSettings.optionData.editType = selectedValue;

    saveOptionData();
    this.initializeEditMode();
  }

  initializeEditMode() {
    const currentPrompt = this.generateInput.val();

    // 現在のプロンプトとeditPrompt.promptが異なる場合のみ初期化
    if (currentPrompt && currentPrompt !== editPrompt.prompt) {
      console.log("Initializing edit mode with:", currentPrompt);
      editPrompt.init(currentPrompt);
    }

    this.refreshEditList();
  }

  async refreshEditList() {
    console.log(
      "refreshEditList called, elements count:",
      editPrompt.elements.length
    );

    const editType = AppState.userSettings.optionData.editType;
    const listType =
      editType === CONSTANTS.EDIT_TYPES.SELECT ? "editDropdown" : "edit";

    // デバッグ: リストクリア前の状態を確認
    console.log(
      "Before clear - list children:",
      $("#editList").children().length
    );

    await this.listManager.createList(
      listType,
      editPrompt.elements,
      "#editList"
    );

    // デバッグ: リスト作成後の状態を確認
    console.log(
      "After create - list children:",
      $("#editList").children().length
    );
  }

  // ============================================
  // 辞書機能
  // ============================================

  setupDictionaryHandlers() {
    // 辞書の開閉
    $("#promptDicText").on("click", () => this.toggleDictionary("prompt"));
    $("#elementDicText").on("click", () => this.toggleDictionary("element"));
    $("#masterDicText").on("click", () => this.toggleDictionary("master"));

    // 要素の追加
    $("#resist").on("click", () => this.handleElementRegistration());

    // カテゴリー連動
    this.setupCategoryInputs();
  }

  toggleDictionary(type) {
    const configs = {
      prompt: {
        listId: "#archiveList",
        textId: "#promptDicText",
        openText: "▼プロンプト辞書　※ここをクリックで開閉",
        closeText: "▶プロンプト辞書　※ここをクリックで開閉",
        createFunc: () =>
          this.listManager.createList(
            "archive",
            AppState.data.archivesList,
            "#archiveList"
          ),
      },
      element: {
        listId: "#addPromptList",
        textId: "#elementDicText",
        openText: "▼要素辞書(ローカル)　※ここをクリックで開閉",
        closeText: "▶要素辞書(ローカル)　※ここをクリックで開閉",
        createFunc: () => {
          const sorted = [...AppState.data.localPromptList].sort(
            (a, b) => (a.sort || 0) - (b.sort || 0)
          );
          return this.listManager.createList("add", sorted, "#addPromptList");
        },
      },
      master: {
        listId: "#masterDicList",
        textId: "#masterDicText",
        openText: "▼要素辞書(マスタ)　※ここをクリックで開閉",
        closeText: "▶要素辞書(マスタ)　※ここをクリックで開閉",
        createFunc: () =>
          this.listManager.createList(
            "master",
            AppState.data.masterPrompts,
            "#masterDicList"
          ),
      },
    };

    const config = configs[type];
    const $list = $(config.listId);
    const $text = $(config.textId);

    if ($list.children().length > 0) {
      ListBuilder.clearList(config.listId);
      $text.text(config.closeText);
    } else {
      config.createFunc();
      $text.text(config.openText);
    }
  }

  async handleElementRegistration() {
    const data = {
      big: $("#big").val(),
      middle: $("#middle").val(),
      small: $("#small").val(),
      prompt: $("#prompt").val(),
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
      $("#big, #middle, #small, #prompt").val("");
      this.refreshAddList();
    }
  }

  /**
   * アーカイブリストを更新
   */
  async refreshArchiveList() {
    if ($("#archiveList").children().length > 0) {
      await this.listManager.createList(
        "archive",
        AppState.data.archivesList,
        "#archiveList"
      );
    }
  }

  async refreshAddList() {
    if ($("#addPromptList").children().length > 0) {
      // sortableを破棄
      if ($("#addPromptList").hasClass("ui-sortable")) {
        $("#addPromptList").sortable("destroy");
      }

      const sorted = [...AppState.data.localPromptList].sort(
        (a, b) => (a.sort || 0) - (b.sort || 0)
      );
      await this.listManager.createList("add", sorted, "#addPromptList");

      // sortableを再初期化
      EventHandlers.setupSortableList("#addPromptList", async (sortedIds) => {
        let baseIndex = 0;
        sortedIds.forEach((id) => {
          if (!id) return;
          AppState.data.localPromptList[id].sort = baseIndex++;
        });
        await saveLocalList();
      });
    }
  }

  setupCategoryInputs() {
    const $big = $("#big");
    const $middle = $("#middle");

    $big.attr("list", "category");
    $big.on("change", function () {
      $middle.attr("list", "category" + $(this).val());
    });

    EventHandlers.addInputClearBehavior($big);
    EventHandlers.addInputClearBehavior($middle);
  }

  // ============================================
  // プロンプト入力
  // ============================================

  setupPromptInputHandlers() {
    // デバウンス処理を追加して、連続した呼び出しを防ぐ
    let debounceTimer;

    const handlePromptChange = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const value = this.generateInput.val();
        console.log("Prompt changed:", value);

        editPrompt.init(value);
        this.updatePromptDisplay();

        if (AppState.ui.currentTab === CONSTANTS.TABS.EDIT) {
          this.refreshEditList();
        }
      }, 100); // 100ms のデバウンス
    };

    // inputイベントのみ使用（changeイベントは削除）
    this.generateInput.on("input", handlePromptChange);
  }

  updatePromptDisplay() {
    const newPrompt = editPrompt.prompt;
    const currentValue = this.generateInput.val();

    // 値が変わった場合のみ更新
    if (newPrompt !== currentValue) {
      this.generateInput.val(newPrompt);
      savePrompt();
    }
  }

  // ============================================
  // ボタン操作
  // ============================================

  setupButtonHandlers() {
    // プロンプト操作
    $("#copyButton").on("click", () => this.copyPrompt());
    $("#clearButton").on("click", () => this.clearPrompt());
    $("#saveButton").on("click", () => this.archivePrompt());

    // Generate ボタン
    $("#GeneratoButton").on("click", () => this.generatePrompt());

    // プレビューコピー
    $("#preview-positive-copy").on("click", () => {
      navigator.clipboard.writeText($("#preview-prompt").val());
    });

    $("#preview-negative-copy").on("click", () => {
      navigator.clipboard.writeText($("#negative-prompt").val());
    });

    // ダウンロード
    $("#localDicDownload").on("click", () => {
      jsonDownload(AppState.data.localPromptList, "Elements");
    });

    $("#PromptDownload").on("click", () => {
      jsonDownload(AppState.data.archivesList, "Prompts");
    });

    $("#MasterDownload").on("click", () => {
      jsonDownload(AppState.data.masterPrompts, "Elements");
    });

    // リセット
    $("#resetButton").on("click", () => {
      if (
        confirm("すべてのデータをリセットしますか？この操作は取り消せません。")
      ) {
        chrome.storage.local.clear(() => {
          location.reload();
        });
      }
    });
  }

  copyPrompt() {
    navigator.clipboard.writeText(editPrompt.prompt);

    ErrorHandler.notify("プロンプトをコピーしました", {
      type: ErrorHandler.NotificationType.TOAST,
      duration: 1500,
      messageType: "success", // 追加
    });
  }

  clearPrompt() {
    editPrompt.prompt = "";
    this.generateInput.val("");
    savePrompt();
  }

  async archivePrompt() {
    const prompt = this.generateInput.val();
    if (!prompt) {
      ErrorHandler.notify("プロンプトが入力されていません");
      return;
    }

    const validation = Validators.checkDuplicateArchive(
      prompt,
      AppState.data.archivesList
    );
    if (!validation.isValid) {
      ErrorHandler.notify(validation.message);
      return;
    }

    AppState.data.archivesList.push({ title: "", prompt: prompt });
    await saveArchivesList();

    // リストが開いている場合は更新
    if ($("#archiveList").children().length > 0) {
      await this.listManager.createList(
        "archive",
        AppState.data.archivesList,
        "#archiveList"
      );
    }
  }

  generatePrompt() {
    sendBackground(
      "DOM",
      "Generate",
      this.generateInput.val(),
      PositivePromptTextSelector,
      GenerateButtonSelector
    );
  }

  // ============================================
  // オプション設定
  // ============================================

  setupOptionHandlers() {
    $("#isDeleteCheck").on("change", (e) => {
      AppState.userSettings.optionData.isDeleteCheck = $(e.target).prop(
        "checked"
      );
      saveOptionData();
    });

    $("#DeeplAuth").on("change", (e) => {
      const apiKey = $(e.target).val();
      const validation = Validators.validateApiKey(apiKey, "DeepL");

      if (!validation.isValid) {
        ErrorHandler.showInlineError("#DeeplAuth", validation.message);
        return;
      }

      AppState.userSettings.optionData.deeplAuthKey = apiKey;
      saveOptionData();
    });
  }

  // ============================================
  // ドラッグ&ドロップ
  // ============================================

  setupDragDrop() {
    const $dropZone = $("#inclued");

    $dropZone.on("dragover", (e) => this.handleDragOver(e));
    $dropZone.on("drop", (e) => this.handleFileDrop(e));

    $dropZone.on("click", () => {
      const $input = $('<input type="file" style="display:none;">');
      $("body").append($input);
      $input.on("change", (e) => this.handleFileSelect(e));
      $input.click();
    });
  }

  handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    event.originalEvent.dataTransfer.dropEffect = "copy";
  }

  handleFileDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    const file = event.originalEvent.dataTransfer.files[0];
    if (file) {
      this.fileHandler.handleFile(file);
    }
  }

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
      this.fileHandler.handleFile(file);
    }
    $(event.target).remove();
  }

  // ============================================
  // ソート可能なリスト
  // ============================================

  setupSortableLists() {
    // 追加リストのソート
    EventHandlers.setupSortableList("#addPromptList", async (sortedIds) => {
      let baseIndex = 0;
      sortedIds.forEach((id) => {
        if (!id) return;
        AppState.data.localPromptList[id].sort = baseIndex++;
      });
      await saveLocalList();
    });

    // 編集リストのソート
    EventHandlers.setupSortableList("#editList", (sortedIds) => {
      let baseIndex = 0;
      sortedIds.forEach((id) => {
        if (!id) return;
        editPrompt.elements[id].sort = baseIndex++;
      });
      editPrompt.generate();
      this.updatePromptDisplay();
    });
  }

  // ============================================
  // UI状態の更新
  // ============================================

  updateUIState() {
    // 検索カテゴリーの復元
    if (AppState.data.searchCategory?.[0]) {
      $("#search-cat0").val(AppState.data.searchCategory[0]);
      this.updateCategoryDropdown(
        "#search-cat1",
        1,
        AppState.data.searchCategory[0]
      );

      if (AppState.data.searchCategory[1]) {
        $("#search-cat1").val(AppState.data.searchCategory[1]);
      }
    }

    // GenerateボタンON表示の更新
    if (
      AppState.userSettings.optionData?.shaping === "NAI" &&
      PositivePromptTextSelector &&
      GenerateButtonSelector
    ) {
      $("#GeneratoButton").show();
    }
  }
}

// ============================================
// リスト管理クラス
// ============================================
class PromptListManager {
  constructor() {
    this.listConfigs = {
      search: {
        headers: ["大項目", "中項目", "小項目", "Prompt"],
        createItem: async ($li, item, index, options) =>
          await this.createSearchItem($li, item, index, options),
      },
      add: {
        headers: ["大項目", "中項目", "小項目", "Prompt"],
        createItem: async ($li, item, index, options) =>
          await this.createAddItem($li, item, index, options),
        sortable: true,
      },
      master: {
        headers: ["大項目", "中項目", "小項目", "Prompt"],
        createItem: async ($li, item, index, options) =>
          await this.createMasterItem($li, item, index, options),
      },
      archive: {
        headers: ["名前", "Prompt"],
        createItem: async ($li, item, index, options) =>
          await this.createArchiveItem($li, item, index, options),
        columnWidths: { 1: "150px" },
      },
      edit: {
        headers: ["Prompt", "重み"],
        createItem: async ($li, item, index, options) =>
          await this.createEditItem($li, item, index, options),
        sortable: true,
        columnWidths: { 1: "400px", 2: "30px" },
      },
      editDropdown: {
        headers: ["大項目", "中項目", "小項目", "Prompt", "重み"],
        createItem: async ($li, item, index, options) =>
          await this.createEditDropdownItem($li, item, index, options),
        sortable: true,
        columnWidths: {
          1: "80px",
          2: "80px",
          3: "80px",
          4: "130px",
          5: "30px",
        },
      },
    };
  }

  async createList(type, data, listId, options = {}) {
    const config = this.listConfigs[type];
    if (!config) {
      throw new Error(`Unknown list type: ${type}`);
    }

    console.log(
      `Creating ${type} list with ${data.length} items for ${listId}`
    );

    ListBuilder.clearList(listId);
    ListBuilder.createHeaders(listId, config.headers);

    // optionsにlistIdを追加
    const itemOptions = { ...options, listId, type };

    for (let i = 0; i < data.length; i++) {
      console.log(`Creating item ${i}:`, data[i]);

      const $li = UIFactory.createListItem({
        id: config.sortable ? i : undefined,
        sortable: config.sortable,
      });

      await config.createItem.call(this, $li, data[i], i, itemOptions);
      $(listId).append($li);
    }

    if (config.columnWidths) {
      ListBuilder.setColumnWidths(listId, config.columnWidths);
    }

    console.log(
      `List ${type} created, final children count:`,
      $(listId).children().length
    );
  }

  // 各リストアイテムの作成メソッド
  async createSearchItem($li, item, index, options) {
    const inputs = [];

    // カテゴリー入力
    for (let i = 0; i < 3; i++) {
      const $input = UIFactory.createInput({ value: item.data[i] });
      inputs.push($input);
      $li.append($input);
    }

    // プロンプト入力
    $li.append(UIFactory.createInput({ value: item.prompt }));

    // ボタン
    const buttons = UIFactory.createButtonSet({
      includeSet: true,
      includeCopy: true,
      setValue: item.prompt + ",",
      copyValue: item.prompt,
      // onSetを削除
    });

    $li.append(buttons.set, buttons.copy);

    // 登録ボタン（翻訳結果の場合）
    if (options.isSave) {
      const $registButton = this.createRegistButton(inputs, item.prompt);
      $li.append($registButton);
    }

    // プレビューボタン
    if (item.url) {
      $li.append(UIFactory.createPreviewButton(item));
    }
  }

  async createAddItem($li, item, index, options = {}) {
    // カテゴリー入力
    for (let i = 0; i < 3; i++) {
      $li.append(
        UIFactory.createInput({
          value: item.data[i],
          index: index,
          onInput: (value) => {
            AppState.data.localPromptList[index].data[i] = value;
          },
          onBlur: () => saveLocalList(),
        })
      );
    }

    // プロンプト入力
    $li.append(
      UIFactory.createInput({
        value: item.prompt,
        index: index,
        onInput: (value) => {
          AppState.data.localPromptList[index].prompt = value;
        },
        onBlur: () => saveLocalList(),
      })
    );

    // ボタン - ローカル辞書（type='add'）の場合のみ削除ボタンを表示
    const isLocalDictionary = options.type === "add";

    const buttons = UIFactory.createButtonSet({
      includeSet: true,
      includeCopy: true,
      includeDelete: isLocalDictionary,
      setValue: item.prompt + ",",
      copyValue: item.prompt,
      onDelete: async () => {
        // リストから削除
        const actualIndex = getLocalElementIndex(item);
        if (actualIndex !== -1) {
          AppState.data.localPromptList.splice(actualIndex, 1);

          // DOM要素を削除（リスト全体の再生成はしない）
          $li.fadeOut(200, async () => {
            $li.remove();

            // インデックスを再割り当て
            $("#addPromptList li").each((newIndex, element) => {
              $(element).attr("id", newIndex);
              if (newIndex < AppState.data.localPromptList.length) {
                AppState.data.localPromptList[newIndex].sort = newIndex;
              }
            });

            // データを保存（categoryData.updateは遅延実行）
            await Storage.set({
              localPromptList: AppState.data.localPromptList,
            });

            // カテゴリー更新は非同期で実行
            setTimeout(() => {
              categoryData.update();
            }, 100);
          });
        }
      },
    });

    $li.append(buttons.set, buttons.copy);

    if (item.url) {
      $li.append(UIFactory.createPreviewButton(item));
    }

    if (isLocalDictionary && buttons.delete) {
      $li.append(buttons.delete);
      AppState.data.localPromptList[index].sort = index;
      $li.append(UIFactory.createDragIcon(index));
    }
  }

  async createMasterItem($li, item, index, options = {}) {
    // カテゴリー入力（読み取り専用）
    for (let i = 0; i < 3; i++) {
      $li.append(
        UIFactory.createInput({
          value: item.data[i],
          readonly: true,
        })
      );
    }

    // プロンプト入力（読み取り専用）
    $li.append(
      UIFactory.createInput({
        value: item.prompt,
        readonly: true,
      })
    );

    // ボタン（SetとCopyのみ）
    const buttons = UIFactory.createButtonSet({
      includeSet: true,
      includeCopy: true,
      setValue: item.prompt + ",",
      copyValue: item.prompt,
    });

    $li.append(buttons.set, buttons.copy);

    // プレビューボタン
    if (item.url) {
      $li.append(UIFactory.createPreviewButton(item));
    }
  }

  async createArchiveItem($li, item, index, options = {}) {
    // タイトル入力
    $li.append(
      UIFactory.createInput({
        value: item.title,
        index: index,
        onInput: async (value) => {
          AppState.data.archivesList[index].title = value;
          await saveArchivesList();
        },
      })
    );

    // プロンプト入力
    $li.append(
      UIFactory.createInput({
        value: item.prompt,
        index: index,
        onInput: async (value) => {
          AppState.data.archivesList[index].prompt = value;
          await saveArchivesList();
        },
      })
    );

    // ボタン
    const buttons = UIFactory.createButtonSet({
      includeLoad: true,
      includeCopy: true,
      includeDelete: true,
      loadValue: item.prompt,
      copyValue: item.prompt,
      onDelete: async () => {
        AppState.data.archivesList.splice(index, 1);
        await saveArchivesList();
        window.app.refreshArchiveList();
      },
    });

    $li.append(buttons.load, buttons.copy, buttons.delete);
  }

  async createEditItem($li, item, index, options = {}) {
    const shaping = AppState.userSettings.optionData.shaping;
    const weight = item[shaping].weight;
    const prompt = item[shaping].value;

    // プロンプト入力
    const $valueInput = UIFactory.createInput({
      value: prompt,
      index: index,
      onInput: (value) => {
        editPrompt.editingValue(value, index);
        $weightInput.val(editPrompt.elements[index][shaping].weight);
        window.app.updatePromptDisplay();
      },
    });

    // 重み入力
    const $weightInput = UIFactory.createInput({
      value: weight,
      index: index,
      onInput: (value) => {
        const cleanWeight = value.replace(/[^-0-9.]/g, "");
        editPrompt.editingWeight(cleanWeight, index);
        $valueInput.val(editPrompt.elements[index][shaping].value);
        window.app.updatePromptDisplay();
      },
    });

    $li.append($valueInput);
    if (weight) {
      $li.append($weightInput);
    }

    // ボタン
    const buttons = UIFactory.createButtonSet({
      includeDelete: true,
      onDelete: () => {
        editPrompt.removeElement(index);
        window.app.updatePromptDisplay();
        window.app.refreshEditList();
      },
    });

    $li.append(buttons.delete);
    $li.append(UIFactory.createDragIcon(index));
  }

  async createEditDropdownItem($li, item, index, options = {}) {
    const shaping = AppState.userSettings.optionData.shaping;
    const weight = item[shaping].weight;
    const prompt = item.Value.toLowerCase().trim();

    // カテゴリー検索
    let category = null;
    const findCategory = (dataList) => {
      return (
        dataList.find((dicData) => dicData.prompt === prompt)?.data || null
      );
    };

    category =
      findCategory(AppState.data.masterPrompts) ||
      findCategory(AppState.data.localPromptList);

    // カテゴリー入力フィールド
    const categoryInputs = [];
    for (let i = 0; i < 3; i++) {
      const $input = UIFactory.createInput({
        value: category ? category[i] : "翻訳中",
        readonly: false,
      });

      if (!category) {
        $input.prop("disabled", true);
      } else {
        EventHandlers.addInputClearBehavior($input);
      }

      categoryInputs.push($input);
      $li.append($input);
    }

    // プロンプト入力
    const $valueInput = UIFactory.createInput({
      value: prompt,
      index: index,
      onInput: (value) => {
        editPrompt.editingValue(value, index);
        $weightInput.val(editPrompt.elements[index][shaping].weight);
        window.app.updatePromptDisplay();
      },
    });

    // 重み入力
    const $weightInput = UIFactory.createInput({
      value: weight,
      index: index,
      onInput: (value) => {
        const cleanWeight = value.replace(/[^-0-9.]/g, "");
        editPrompt.editingWeight(cleanWeight, index);
        window.app.updatePromptDisplay();
      },
    });

    $li.append($valueInput);
    if (weight) {
      $li.append($weightInput);
    }

    // 重み調整ボタン
    const weightDelta = shaping === "SD" ? 0.1 : shaping === "NAI" ? 1 : 0;
    if (weightDelta > 0) {
      const buttons = UIFactory.createButtonSet({
        includeWeight: true,
        weightDelta: weightDelta,
        index: index,
      });
      $li.append(buttons.weightPlus, buttons.weightMinus);
    }

    // 削除ボタン
    const deleteButton = UIFactory.createButtonSet({
      includeDelete: true,
      onDelete: () => {
        editPrompt.removeElement(index);
        window.app.updatePromptDisplay();
        window.app.refreshEditList();
      },
    });
    $li.append(deleteButton.delete);

    // 追加ボタンまたはプレビューボタン
    if (!category) {
      const $registButton = this.createRegistButton(categoryInputs, prompt);
      $li.append($registButton);

      // 翻訳処理をキューに追加
      this.queueTranslation(prompt, categoryInputs);
    } else {
      const element = AppState.data.masterPrompts.find(
        (e) => e.prompt === prompt
      );
      if (element?.url) {
        $li.append(UIFactory.createPreviewButton(element));
      }
    }

    // カテゴリー連動設定
    this.setupCategoryDropdownChain(
      categoryInputs,
      $valueInput,
      $weightInput,
      index
    );

    $li.append(UIFactory.createDragIcon(index));
  }

  createRegistButton(inputFields, prompt) {
    const $button = UIFactory.createJQueryButton({
      text: "N",
      onClick: () => {
        const data = {
          big: inputFields[0].val(),
          middle: inputFields[1].val(),
          small: inputFields[2].val(),
        };

        Regist(data.big, data.middle, data.small, prompt);
        $button.remove();
        window.app.refreshAddList();
      },
    });

    EventHandlers.setupCategoryChain(inputFields);
    EventHandlers.addInputClearBehaviorToMany(inputFields);

    return $button;
  }

  setupCategoryDropdownChain(categoryInputs, $valueInput, $weightInput, index) {
    let categoryValue = categoryInputs[0].val();

    categoryInputs[0].attr("list", "category");
    categoryInputs[1].attr("list", "category" + categoryValue);
    categoryInputs[2].attr(
      "list",
      "category" + categoryValue + categoryInputs[1].val()
    );

    categoryInputs[0].on("change", function () {
      categoryValue = $(this).val();
      categoryInputs[1].attr("list", "category" + categoryValue);
      categoryInputs[2].attr(
        "list",
        "category" + categoryValue + categoryInputs[1].val()
      );
    });

    categoryInputs[1].on("change", function () {
      categoryInputs[2].attr(
        "list",
        "category" + categoryValue + $(this).val()
      );
    });

    categoryInputs[2].on("change", function () {
      const inputValue = $(this).val();
      const masterPrompt = AppState.data.masterPrompts.find(
        (p) => p.data[2] === inputValue
      );
      const newPrompt = masterPrompt?.prompt || $valueInput.val();

      $valueInput.val(newPrompt);
      editPrompt.editingValue(
        editPrompt.getValue(
          AppState.userSettings.optionData.shaping,
          newPrompt,
          $weightInput.val()
        ),
        index
      );
      window.app.updatePromptDisplay();
    });
  }

  // 翻訳キュー管理
  translationQueue = [];
  translationTimer = null;
  translatedCache = new Map(); // 翻訳結果のキャッシュ

  queueTranslation(keyword, inputFields) {
    // すでに翻訳済みの場合はキャッシュから取得
    if (this.translatedCache.has(keyword)) {
      const cached = this.translatedCache.get(keyword);
      this.applyTranslationResult(inputFields, cached);
      return;
    }

    // 既にキューに存在する場合は追加しない
    const existing = this.translationQueue.find(
      (item) => item.keyword === keyword
    );
    if (existing) {
      return;
    }

    this.translationQueue.push({ keyword, inputFields });

    // バッチ処理のタイマーがまだない場合は開始
    if (!this.translationTimer) {
      this.translationTimer = setTimeout(
        () => this.processTranslationQueue(),
        100
      );
    }
  }

  applyTranslationResult(inputFields, translation) {
    inputFields.forEach(($input) => $input.prop("disabled", false));
    inputFields[0].val("");
    inputFields[1].val("Google翻訳");
    inputFields[2].val(translation);
  }

  async processTranslationQueue() {
    if (this.translationQueue.length === 0) {
      this.translationTimer = null;
      return;
    }

    // 重複を除去
    const uniqueQueue = this.translationQueue.filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.keyword === item.keyword)
    );

    const batch = uniqueQueue.splice(0, 10); // 最大10件ずつ処理
    this.translationQueue = this.translationQueue.filter(
      (item) => !batch.some((b) => b.keyword === item.keyword)
    );

    const keywords = batch.map((item) => item.keyword).join(",");

    try {
      const translations = await new Promise((resolve) => {
        translateGoogle(keywords, resolve);
      });

      // 結果が配列でない場合の処理
      const translationArray = Array.isArray(translations)
        ? translations
        : [translations];

      translationArray.forEach((translation, index) => {
        if (batch[index]) {
          const { keyword, inputFields } = batch[index];
          // キャッシュに保存
          this.translatedCache.set(keyword, translation);
          this.applyTranslationResult(inputFields, translation);
        }
      });
    } catch (error) {
      ErrorHandler.log("Translation batch failed", error);
    }

    // まだキューに残りがある場合は続行
    if (this.translationQueue.length > 0) {
      this.translationTimer = setTimeout(
        () => this.processTranslationQueue(),
        100
      );
    } else {
      this.translationTimer = null;
    }
  }
}

// ============================================
// ファイルハンドラークラス
// ============================================
class FileHandler {
  constructor() {
    this.allowedTypes = {
      dictionary: ["application/json", "text/plain"],
      image: ["image/png"],
    };
  }

  async handleFile(file) {
    const fileCategory = this.getFileCategory(file.type);

    if (!fileCategory) {
      ErrorHandler.notify("対応していないファイル形式です");
      return;
    }

    const sizeValidation = Validators.validateFileSize(file, 10);
    if (!sizeValidation.isValid) {
      ErrorHandler.notify(sizeValidation.message);
      return;
    }

    await ErrorHandler.handleAsync(
      async () => {
        switch (fileCategory) {
          case "dictionary":
            await this.readDictionaryFile(file);
            break;
          case "image":
            await this.readImageFile(file);
            break;
        }
      },
      "ファイルの読み込み",
      { showLoading: true }
    );
  }

  getFileCategory(mimeType) {
    for (const [category, types] of Object.entries(this.allowedTypes)) {
      if (types.includes(mimeType)) {
        return category;
      }
    }
    return null;
  }

  async readDictionaryFile(file) {
    $("#incluedText").text("読み込み中...");

    const content = await this.readFileAsText(file);
    const data = JSON.parse(content);

    await this.processDictionaryData(data);

    $("#incluedText").text(
      "辞書か画像を読みこむ (クリックして選択かドラッグドロップ)"
    );
  }

  async processDictionaryData(data) {
    let addCount = 0;

    switch (data.dicType) {
      case "Elements":
        for (const item of data.data) {
          if (RegistDic(item)) {
            addCount++;
          }
        }
        if (addCount > 0) {
          ErrorHandler.notify(`${addCount}件の要素辞書を読み込みました`, {
            type: ErrorHandler.NotificationType.TOAST,
            messageType: "success", // 追加
          });
        }
        break;

      case "Prompts":
        for (const item of data.data) {
          if (this.addPromptDic(item)) {
            addCount++;
          }
        }
        if (addCount > 0) {
          await saveArchivesList();
          if (window.app) {
            window.app.refreshArchiveList();
          }
          ErrorHandler.notify(`${addCount}件のプロンプト辞書を読み込みました`, {
            type: ErrorHandler.NotificationType.TOAST,
            messageType: "success", // 追加
          });
        }
        break;

      case "Master":
        AppState.data.masterPrompts = [];
        data.data.forEach((item) => {
          AppState.data.masterPrompts.push({
            prompt: item[3],
            data: { 0: item[0], 1: item[1], 2: item[2] },
            url: item[4],
          });
        });
        await saveMasterPrompt();
        categoryData.update();
        break;
    }
  }

  addPromptDic(item) {
    const duplicate = AppState.data.archivesList.find(
      (archive) => archive.prompt === item.prompt
    );
    if (!duplicate) {
      AppState.data.archivesList.push(item);
      return true;
    }
    return false;
  }

  async readImageFile(file) {
    const arrayBuffer = await this.readFileAsArrayBuffer(file);
    const pngInfo = getPngInfo(arrayBuffer);

    const output = {
      ...pngInfo.textChunks,
      width: pngInfo.width,
      height: pngInfo.height,
    };

    createPngInfo(output);
    createPngPreview(URL.createObjectURL(file));
  }

  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
}

// ============================================
// ユーティリティ関数（グローバル互換性のため残す）
// ============================================

function UpdateGenaretePrompt() {
  if (window.app) {
    window.app.updatePromptDisplay();
  }
}

function InitGenaretePrompt(str) {
  // 重複した初期化を防ぐ
  if (str !== editPrompt.prompt) {
    editPrompt.init(str);
    if (window.app) {
      window.app.generateInput.val(editPrompt.prompt);
    }
  }
}

function editInit() {
  if (window.app) {
    window.app.refreshEditList();
  }
}

function archivesInit() {
  if (window.app && $("#archiveList").children().length > 0) {
    window.app.listManager.createList(
      "archive",
      AppState.data.archivesList,
      "#archiveList"
    );
  }
}

function addInit() {
  if (window.app) {
    window.app.refreshAddList();
  }
}

function sendBackground(service, execType, value1, value2, value3) {
  const message = {
    type: "DOM",
    args: [service, execType, value1, value2, value3],
  };

  chrome.runtime.sendMessage(message, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Runtime error:", chrome.runtime.lastError.message);
    }
  });
}

function setCategoryList(id, category) {
  $(id + " option").remove();
  categoryData.data[category].forEach((item) => {
    $(id).append(
      $("<option>", {
        value: item.value,
        text: item.value,
      })
    );
  });
  $(id).prop("disabled", false).val("");
}

function setSeachCategory() {
  if (window.app) {
    window.app.updateUIState();
    if (AppState.data.searchCategory?.[0]) {
      // 初期表示時はローディングを表示しない
      window.app.performSearch({ showLoading: false });
    }
  }
}

function previewPromptImage(value) {
  const imageUrl = `https://ul.h3z.jp/${value.url}.jpg`;

  fetch(imageUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.blob();
    })
    .then((blob) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const arrayBuffer = reader.result;
        const binary = atob(arrayBuffer.split(",")[1]);

        $("#popup-image").attr({
          src: `data:image/png;base64,${binary}`,
          width: "256",
          height: "256",
        });

        $("#preview-element").text(
          `${value.data[0]}:${value.data[1]}:${value.data[2]}`
        );
        $("#preview-prompt").val(value.prompt);
        $("#popup").css({ display: "flex" }).show();
      };
      reader.readAsDataURL(blob);
    })
    .catch((error) => {
      console.log("Preview image not available:", value.url);

      // デフォルト画像を表示するか、プレビューなしで表示
      $("#popup-image").attr({
        src: "assets/icon/Icon128.png", // デフォルト画像
        width: "256",
        height: "256",
      });

      $("#preview-element").text(
        `${value.data[0]}:${value.data[1]}:${value.data[2]} (画像なし)`
      );
      $("#preview-prompt").val(value.prompt);
      $("#popup").css({ display: "flex" }).show();
    });
}

function createPngInfo(data) {
  const $div = $("<div>").addClass("item");

  Object.entries(data).forEach(([key, value]) => {
    const $label = $("<label>").text(`${key}: `).css({
      display: "inline-block",
      width: "200px",
      margin: "5px 10px 5px 0",
    });

    const $input = $("<input>")
      .attr({
        type: "text",
        value: value,
        readonly: true,
      })
      .css({
        display: "inline-block",
        width: "200px",
      });

    $div.append($label, $input, "<br>");
  });

  $("#pngInfo").empty().append($div);
}

function createPngPreview(url) {
  const img = new Image();

  img.onload = function () {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const maxSize = 540;

    let width = img.width;
    let height = img.height;

    if (width > height && width > maxSize) {
      height *= maxSize / width;
      width = maxSize;
    } else if (height > width && height > maxSize) {
      width *= maxSize / height;
      height = maxSize;
    }

    canvas.width = maxSize;
    canvas.height = height;

    const x = (canvas.width - width) / 2;
    ctx.drawImage(img, x, 0, width, height);

    $("#preview").attr("src", canvas.toDataURL());
  };

  img.src = url;
}

function getPngInfo(arrayBuffer) {
  const dataView = new DataView(arrayBuffer);
  const info = {
    width: dataView.getUint32(16, false),
    height: dataView.getUint32(20, false),
    bitDepth: dataView.getUint8(24),
    colorType: dataView.getUint8(25),
    compressionMethod: dataView.getUint8(26),
    filterMethod: dataView.getUint8(27),
    interlaceMethod: dataView.getUint8(28),
    textChunks: getTextChunk(arrayBuffer),
  };
  return info;
}

function getTextChunk(arrayBuffer) {
  let data = {};
  let chunkOffset = 33;

  while (chunkOffset < arrayBuffer.byteLength) {
    const chunkLength = new DataView(arrayBuffer, chunkOffset, 4).getUint32(
      0,
      false
    );
    const chunkType = new TextDecoder().decode(
      new Uint8Array(arrayBuffer, chunkOffset + 4, 4)
    );

    if (chunkType === "tEXt") {
      const keywordEnd = new Uint8Array(arrayBuffer, chunkOffset + 8).indexOf(
        0
      );
      const keyword = new TextDecoder().decode(
        new Uint8Array(arrayBuffer, chunkOffset + 8, keywordEnd)
      );
      const textData = new TextDecoder().decode(
        new Uint8Array(
          arrayBuffer,
          chunkOffset + 8 + keywordEnd + 1,
          chunkLength - (keywordEnd + 1)
        )
      );

      if (keyword === "Comment") {
        data = JSON.parse(textData);
        data.metadata = textData;
      } else if (keyword === "parameters") {
        data = parseSDPng(`prompt: ${textData}`);
        data.metadata = `prompt: ${textData}`;
      }
    }

    chunkOffset += chunkLength + 12;
  }

  return data;
}

function parseSDPng(text) {
  const data = {};

  // Extract steps and other parameters
  let matches = text.match(/(.*)(steps:.*)/i);
  if (matches) {
    const paramsMatch = [...matches[0].matchAll(/([A-Za-z\s]+):\s*([^,\n]*)/g)];
    for (const match of paramsMatch) {
      const key = match[1].trim();
      const value = match[2].trim();

      if (key !== "prompt" && key !== "Negative prompt") {
        data[key] = value;
      }
    }
  }

  // Extract prompt and negative prompt
  const allMatches = [
    ...text.matchAll(/([A-Za-z\s]+):\s*((?:[^,\n]+,)*[^,\n]+)/g),
  ];
  for (const match of allMatches) {
    const key = match[1].trim();
    const value = match[2].trim();

    if (key === "prompt" || key === "Negative prompt") {
      data[key] = value;
    }
  }

  return data;
}

function jsonLoop(json, callback) {
  if (!json) return;

  const length = Array.isArray(json) ? json.length : Object.keys(json).length;
  for (let i = 0; i < length; i++) {
    callback(json[i], i);
  }
}

function Generate() {
  if (window.app) {
    window.app.generatePrompt();
  }
}

// ============================================
// アプリケーション初期化
// ============================================
$(document).ready(async () => {
  try {
    // グローバルアプリケーションインスタンス
    window.app = new PromptGeneratorApp();
    await window.app.init();

    console.log("Prompt Generator initialized successfully");
  } catch (error) {
    console.error("Failed to initialize application:", error);
    alert(
      "アプリケーションの初期化に失敗しました。ページを再読み込みしてください。"
    );
  }
});
