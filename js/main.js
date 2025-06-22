/**
 * main.js - Prompt Generator メインスクリプト
 * Phase 2: コード品質改善版 + Phase 4: jQuery削除版
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
    // jQuery削除: this.generateInput = $("#generatePrompt");
    this.generateInput = {
      val: function (value) {
        const element = document.getElementById("generatePrompt");
        if (element) {
          if (arguments.length === 0) {
            return element.value;
          } else {
            element.value = value;
            return this;
          }
        }
        return arguments.length === 0 ? "" : this;
      },
      trigger: function (eventName) {
        const element = document.getElementById("generatePrompt");
        if (element) {
          element.dispatchEvent(new Event(eventName));
        }
        return this;
      },
      focus: function () {
        const element = document.getElementById("generatePrompt");
        if (element) {
          element.focus();
        }
        return this;
      },
    };

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

      // PromptEditorのイベントリスナーを設定
      this.setupPromptEditorListeners();

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
   * PromptEditorのイベントリスナーを設定
   * Phase 3: イベント駆動の実装例
   */
  setupPromptEditorListeners() {
    // プロンプト変更時の処理
    promptEditor.on("change", (data) => {
      console.log("PromptEditor changed:", data.prompt);
      // 将来的には、ここで自動保存やUI更新を行う
      // 現在は既存のsavePrompt()が各所で呼ばれているので、段階的に移行
    });

    // 要素更新時の処理
    promptEditor.on("elementUpdated", (data) => {
      console.log("Element updated:", data.index, data.element);
      // 将来的には、ここで特定の要素のUI更新を行う
    });

    // 要素削除時の処理
    promptEditor.on("elementRemoved", (data) => {
      console.log("Element removed:", data.index);
      // 将来的には、ここでUIからの要素削除を行う
    });
  }

  /**
   * コンテキストメニューからのメッセージリスナーを設定（jQuery削除版）
   */
  setupContextMenuListener() {
    // フォーカストラッキングを追加
    document.addEventListener(
      "focus",
      (e) => {
        if (
          e.target &&
          (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        ) {
          this.lastFocusedInput = e.target;
        }
      },
      true
    ); // useCapture: true でキャプチャフェーズで処理

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
          targetElement.dispatchEvent(new Event("input"));
          targetElement.dispatchEvent(new Event("change"));

          sendResponse({ success: true });
        } else {
          // メインのプロンプト入力フィールドに挿入
          const generatePrompt = document.getElementById("generatePrompt");
          if (generatePrompt) {
            const currentValue = generatePrompt.value || "";
            generatePrompt.value = currentValue + message.text;
            generatePrompt.dispatchEvent(new Event("input"));
            generatePrompt.dispatchEvent(new Event("change"));
            generatePrompt.focus();
          }

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
  // タブ管理（jQuery削除版）
  // ============================================

  setupTabs() {
    const tabs = document.querySelectorAll(".tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", (e) => this.handleTabSwitch(e));
    });
  }

  handleTabSwitch(event) {
    const clickedTab = event.currentTarget;

    // すでにアクティブなタブをクリックした場合は何もしない
    if (clickedTab.classList.contains("is-active")) {
      return;
    }

    // アクティブタブの切り替え
    const activeTabs = document.querySelectorAll(".tab.is-active");
    activeTabs.forEach((tab) => tab.classList.remove("is-active"));
    clickedTab.classList.add("is-active");

    // パネルの切り替え
    const activePanels = document.querySelectorAll(".panel.is-show");
    activePanels.forEach((panel) => panel.classList.remove("is-show"));

    const tabs = Array.from(document.querySelectorAll(".tab"));
    const tabIndex = tabs.indexOf(clickedTab);

    const panels = document.querySelectorAll(".panel");
    if (panels[tabIndex]) {
      panels[tabIndex].classList.add("is-show");
    }

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
  // ウィンドウ操作（jQuery削除版）
  // ============================================

  setupWindowHandlers() {
    // jQuery削除: $("#openWindow").on("click", ...)
    const openWindowBtn = document.getElementById("openWindow");
    if (openWindowBtn) {
      openWindowBtn.addEventListener("click", () => {
        const displayType = document.getElementById("displayType").value;
        const message =
          displayType === "page"
            ? { type: "openPage" }
            : { type: "openWindow", windowType: displayType };

        chrome.runtime.sendMessage(message);
      });
    }

    // jQuery削除: $("#show-panel").on("click", ...)
    const showPanelBtn = document.getElementById("show-panel");
    if (showPanelBtn) {
      showPanelBtn.addEventListener("click", () => {
        const optionPanel = document.getElementById("optionPanel");
        if (optionPanel) {
          optionPanel.classList.toggle("active");
        }
      });
    }

    // jQuery削除: $("#popup-image").on("click", ...)
    const popupImage = document.getElementById("popup-image");
    if (popupImage) {
      popupImage.addEventListener("click", () => this.closePopup());
    }
  }

  closePopup() {
    // jQuery削除: $("#popup").hide()
    const popup = document.getElementById("popup");
    if (popup) {
      popup.style.display = "none";
    }
  }

  // ============================================
  // 検索機能（jQuery削除版）
  // ============================================

  setupSearchHandlers() {
    // カテゴリー検索
    const searchCat0 = document.getElementById("search-cat0");
    if (searchCat0) {
      searchCat0.addEventListener("change", (e) => {
        const value = e.target.value;
        this.updateCategoryDropdown("#search-cat1", 1, value);
        // ドロップダウン変更時はローディングを表示しない
        this.performSearch({ showLoading: false });
      });
    }

    const searchCat1 = document.getElementById("search-cat1");
    if (searchCat1) {
      searchCat1.addEventListener("change", () => {
        // ドロップダウン変更時はローディングを表示しない
        this.performSearch({ showLoading: false });
      });
    }

    const searchCatReset = document.getElementById("search-cat-reset");
    if (searchCatReset) {
      searchCatReset.addEventListener("click", () => {
        this.resetCategorySearch();
      });
    }

    // キーワード検索
    const searchButton = document.getElementById("searchButton");
    if (searchButton) {
      searchButton.addEventListener("click", () => {
        // ボタンクリック時はローディングを表示
        this.performSearch({ showLoading: true });
      });
    }

    const searchInput = document.getElementById("search");
    if (searchInput) {
      searchInput.addEventListener("keypress", (e) => {
        if (e.keyCode === 13) {
          // Enter key
          // Enterキー押下時はローディングを表示
          this.performSearch({ showLoading: true });
        }
      });
    }
  }

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

  async doSearch(keyword, categories) {
    ListBuilder.clearList("#promptList");

    const results = Search(keyword, categories);

    if (results.length > 0) {
      await this.listManager.createList("search", results, "#promptList", {
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

  // ============================================
  // 編集機能（jQuery削除版）
  // ============================================

  setupEditHandlers() {
    // UIタイプ変更
    const uiTypeRadios = document.querySelectorAll('[name="UIType"]');
    uiTypeRadios.forEach((radio) => {
      radio.addEventListener("change", (e) => this.handleUITypeChange(e));
    });

    // 編集タイプ変更
    const editTypeRadios = document.querySelectorAll('[name="EditType"]');
    editTypeRadios.forEach((radio) => {
      radio.addEventListener("change", (e) => this.handleEditTypeChange(e));
    });
  }

  handleUITypeChange(event) {
    const selectedValue = event.target.value;
    AppState.userSettings.optionData.shaping = selectedValue;

    // プロンプトを再生成
    editPrompt.generate();
    this.updatePromptDisplay();

    this.initializeEditMode();
    saveOptionData();
  }

  handleEditTypeChange(event) {
    const selectedValue = event.target.value;
    AppState.userSettings.optionData.editType = selectedValue;

    saveOptionData();

    // プロンプトを再生成して記法を更新
    editPrompt.generate();
    this.updatePromptDisplay();

    this.initializeEditMode();
  }

  initializeEditMode() {
    const generatePrompt = document.getElementById("generatePrompt");
    const currentPrompt = generatePrompt ? generatePrompt.value : "";

    if (currentPrompt && currentPrompt !== promptEditor.prompt) {
      console.log("Initializing edit mode with:", currentPrompt);
      promptEditor.init(currentPrompt);
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

    // sortableを破棄
    if ($("#editList").hasClass("ui-sortable")) {
      $("#editList").sortable("destroy");
    }

    // sort プロパティで並び替えた要素を渡す
    const sortedElements = [...editPrompt.elements].sort(
      (a, b) => (a.sort || 0) - (b.sort || 0)
    );

    await this.listManager.createList(
      listType,
      sortedElements, // ソート済みの要素を渡す
      "#editList"
    );

    // sortableを再初期化
    // refreshEditList メソッド内の sortable 再初期化部分
    EventHandlers.setupSortableList("#editList", (sortedIds) => {
      // sortedIdsは表示順のインデックス（0, 1, 2...）
      // でも実際のelementsの順番はsortプロパティでソートされている

      const sortedElements = [...editPrompt.elements].sort(
        (a, b) => (a.sort || 0) - (b.sort || 0)
      );

      let baseIndex = 0;
      sortedIds.forEach((displayIndex) => {
        if (!displayIndex) return;
        // 表示順のインデックスから実際の要素を取得
        const element = sortedElements[displayIndex];
        if (element) {
          element.sort = baseIndex++;
        }
      });

      editPrompt.generate();
      this.updatePromptDisplay();
    });
  }

  // ============================================
  // 辞書機能（jQuery削除版）
  // ============================================

  setupDictionaryHandlers() {
    // 辞書の開閉
    const promptDicText = document.getElementById("promptDicText");
    if (promptDicText) {
      promptDicText.addEventListener("click", () =>
        this.toggleDictionary("prompt")
      );
    }

    const elementDicText = document.getElementById("elementDicText");
    if (elementDicText) {
      elementDicText.addEventListener("click", () =>
        this.toggleDictionary("element")
      );
    }

    const masterDicText = document.getElementById("masterDicText");
    if (masterDicText) {
      masterDicText.addEventListener("click", () =>
        this.toggleDictionary("master")
      );
    }

    // 要素の追加
    const resistButton = document.getElementById("resist");
    if (resistButton) {
      resistButton.addEventListener("click", () =>
        this.handleElementRegistration()
      );
    }

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
      // toggleDictionary メソッドの element の場合
      element: {
        listId: "#addPromptList",
        textId: "#elementDicText",
        openText: "▼要素辞書(ローカル)　※ここをクリックで開閉",
        closeText: "▶要素辞書(ローカル)　※ここをクリックで開閉",
        createFunc: async () => {
          const sorted = [...AppState.data.localPromptList].sort(
            (a, b) => (a.sort || 0) - (b.sort || 0)
          );
          await this.listManager.createList("add", sorted, "#addPromptList");

          // リスト作成後にsortableを初期化
          setTimeout(() => {
            EventHandlers.setupSortableList(
              "#addPromptList",
              async (sortedIds) => {
                let baseIndex = 0;
                sortedIds.forEach((id) => {
                  if (!id) return;
                  AppState.data.localPromptList[id].sort = baseIndex++;
                });
                await saveLocalList();
              }
            );
          }, 100);
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
    const bigInput = document.getElementById("big");
    const middleInput = document.getElementById("middle");
    const smallInput = document.getElementById("small");
    const promptInput = document.getElementById("prompt");

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
    const bigInput = document.getElementById("big");
    const middleInput = document.getElementById("middle");
    const smallInput = document.getElementById("small");

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

  // ============================================
  // プロンプト入力（jQuery削除版）
  // ============================================

  setupPromptInputHandlers() {
    // デバウンス処理を追加して、連続した呼び出しを防ぐ
    let debounceTimer;

    const handlePromptChange = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const value = this.generateInput.val(); // これはまだjQueryオブジェクト
        console.log("Prompt changed:", value);

        editPrompt.init(value);
        this.updatePromptDisplay();

        if (AppState.ui.currentTab === CONSTANTS.TABS.EDIT) {
          this.refreshEditList();
        }
      }, 100); // 100ms のデバウンス
    };

    // this.generateInputはjQueryオブジェクトなので、ネイティブ要素を取得
    const promptInput = document.getElementById("generatePrompt");
    if (promptInput) {
      promptInput.addEventListener("input", handlePromptChange);
    }
  }

  updatePromptDisplay() {
    const newPrompt = editPrompt.prompt;
    const generatePrompt = document.getElementById("generatePrompt");

    if (generatePrompt) {
      const currentValue = generatePrompt.value;

      // 値が変わった場合のみ更新
      if (newPrompt !== currentValue) {
        generatePrompt.value = newPrompt;
        savePrompt();
      }
    }
  }

  // ============================================
  // ボタン操作（jQuery削除版）
  // ============================================

  setupButtonHandlers() {
    // プロンプト操作
    const copyButton = document.getElementById("copyButton");
    if (copyButton) {
      copyButton.addEventListener("click", () => this.copyPrompt());
    }

    const clearButton = document.getElementById("clearButton");
    if (clearButton) {
      clearButton.addEventListener("click", () => this.clearPrompt());
    }

    const saveButton = document.getElementById("saveButton");
    if (saveButton) {
      saveButton.addEventListener("click", () => this.archivePrompt());
    }

    // Generate ボタン
    const generateButton = document.getElementById("GeneratoButton");
    if (generateButton) {
      generateButton.addEventListener("click", () => this.generatePrompt());
    }

    // プレビューコピー
    const previewPositiveCopy = document.getElementById(
      "preview-positive-copy"
    );
    if (previewPositiveCopy) {
      previewPositiveCopy.addEventListener("click", () => {
        const previewPrompt = document.getElementById("preview-prompt");
        if (previewPrompt) {
          navigator.clipboard.writeText(previewPrompt.value);
        }
      });
    }

    const previewNegativeCopy = document.getElementById(
      "preview-negative-copy"
    );
    if (previewNegativeCopy) {
      previewNegativeCopy.addEventListener("click", () => {
        const negativePrompt = document.getElementById("negative-prompt");
        if (negativePrompt) {
          navigator.clipboard.writeText(negativePrompt.value);
        }
      });
    }

    // ダウンロード
    const localDicDownload = document.getElementById("localDicDownload");
    if (localDicDownload) {
      localDicDownload.addEventListener("click", () => {
        jsonDownload(AppState.data.localPromptList, "Elements");
      });
    }

    const promptDownload = document.getElementById("PromptDownload");
    if (promptDownload) {
      promptDownload.addEventListener("click", () => {
        jsonDownload(AppState.data.archivesList, "Prompts");
      });
    }

    const masterDownload = document.getElementById("MasterDownload");
    if (masterDownload) {
      masterDownload.addEventListener("click", () => {
        jsonDownload(AppState.data.masterPrompts, "Elements");
      });
    }

    // リセット
    const resetButton = document.getElementById("resetButton");
    if (resetButton) {
      resetButton.addEventListener("click", () => {
        if (
          confirm(
            "すべてのデータをリセットしますか？この操作は取り消せません。"
          )
        ) {
          chrome.storage.local.clear(() => {
            location.reload();
          });
        }
      });
    }
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
    const generatePrompt = document.getElementById("generatePrompt");
    if (generatePrompt) {
      generatePrompt.value = "";
    }
    savePrompt();
  }

  async archivePrompt() {
    const generatePrompt = document.getElementById("generatePrompt");
    const prompt = generatePrompt ? generatePrompt.value : "";

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
    const archiveList = document.getElementById("archiveList");
    if (archiveList && archiveList.children.length > 0) {
      await this.listManager.createList(
        "archive",
        AppState.data.archivesList,
        "#archiveList"
      );
    }

    // 明示的にバックグラウンドに通知（念のため）
    setTimeout(() => {
      chrome.runtime.sendMessage({ type: "UpdatePromptList" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Failed to notify background:",
            chrome.runtime.lastError
          );
        } else {
          console.log("Background notified of archive update");
        }
      });
    }, 200); // ストレージ書き込みが確実に完了するよう遅延

    // 成功通知
    ErrorHandler.notify("プロンプトを辞書に追加しました", {
      type: ErrorHandler.NotificationType.TOAST,
      duration: 1500,
      messageType: "success",
    });
  }

  generatePrompt() {
    const generatePrompt = document.getElementById("generatePrompt");
    if (generatePrompt) {
      sendBackground(
        "DOM",
        "Generate",
        generatePrompt.value,
        PositivePromptTextSelector,
        GenerateButtonSelector
      );
    }
  }

  // ============================================
  // オプション設定（jQuery削除版）
  // ============================================

  setupOptionHandlers() {
    // jQuery削除: $("#isDeleteCheck").on("change", ...)
    const isDeleteCheck = document.getElementById("isDeleteCheck");
    if (isDeleteCheck) {
      isDeleteCheck.addEventListener("change", (e) => {
        AppState.userSettings.optionData.isDeleteCheck = e.target.checked;
        saveOptionData();
      });
    }

    // jQuery削除: $("#DeeplAuth").on("change", ...)
    const deeplAuth = document.getElementById("DeeplAuth");
    if (deeplAuth) {
      deeplAuth.addEventListener("change", (e) => {
        const apiKey = e.target.value;
        const validation = Validators.validateApiKey(apiKey, "DeepL");

        if (!validation.isValid) {
          ErrorHandler.showInlineError("#DeeplAuth", validation.message);
          return;
        }

        AppState.userSettings.optionData.deeplAuthKey = apiKey;
        saveOptionData();
      });
    }
  }

  // ============================================
  // ドラッグ&ドロップ（jQuery削除版）
  // ============================================

  setupDragDrop() {
    const dropZone = document.getElementById("inclued");
    if (!dropZone) return;

    dropZone.addEventListener("dragover", (e) => this.handleDragOver(e));
    dropZone.addEventListener("drop", (e) => this.handleFileDrop(e));

    dropZone.addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "file";
      input.style.display = "none";

      document.body.appendChild(input);

      input.addEventListener("change", (e) => {
        this.handleFileSelect(e);
        document.body.removeChild(input);
      });

      input.click();
    });
  }

  handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
  }

  handleFileDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files[0];
    if (file) {
      this.fileHandler.handleFile(file);
    }
  }

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
      this.fileHandler.handleFile(file);
    }
  }

  // ============================================
  // ソート可能なリスト
  // ============================================
  setupSortableLists() {
    // 追加リストのソート
    // 初回のみ設定（refreshAddListで再設定されるため）
    if (!$("#addPromptList").hasClass("ui-sortable")) {
      EventHandlers.setupSortableList("#addPromptList", async (sortedIds) => {
        let baseIndex = 0;
        sortedIds.forEach((id) => {
          if (!id) return;
          AppState.data.localPromptList[id].sort = baseIndex++;
        });
        await saveLocalList();
      });
    }

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
  // UI状態の更新（jQuery削除版）
  // ============================================

  updateUIState() {
    // 検索カテゴリーの復元
    if (AppState.data.searchCategory?.[0]) {
      const searchCat0 = document.getElementById("search-cat0");
      if (searchCat0) {
        searchCat0.value = AppState.data.searchCategory[0];
        this.updateCategoryDropdown(
          "#search-cat1",
          1,
          AppState.data.searchCategory[0]
        );

        if (AppState.data.searchCategory[1]) {
          const searchCat1 = document.getElementById("search-cat1");
          if (searchCat1) {
            searchCat1.value = AppState.data.searchCategory[1];
          }
        }
      }
    }

    // GenerateボタンON表示の更新
    if (
      AppState.userSettings.optionData?.shaping === "NAI" &&
      PositivePromptTextSelector &&
      GenerateButtonSelector
    ) {
      const generateButton = document.getElementById("GeneratoButton");
      if (generateButton) {
        generateButton.style.display = "block";
      }
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

    // リスト作成完了後、sortableを再初期化
    if (config.sortable && type === "edit") {
      setTimeout(() => {
        EventHandlers.setupSortableList(listId, (sortedIds) => {
          let baseIndex = 0;
          sortedIds.forEach((id) => {
            if (!id) return;
            editPrompt.elements[id].sort = baseIndex++;
          });
          editPrompt.generate();
          window.app.updatePromptDisplay();
        });
      }, 100); // DOMが完全に更新されるのを待つ
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
        const actualIndex = getLocalElementIndex(item);
        if (actualIndex !== -1) {
          AppState.data.localPromptList.splice(actualIndex, 1);

          $li.fadeOut(200, async () => {
            $li.remove();

            // インデックスを再割り当て（軽量化）
            $("#addPromptList li").each((newIndex, element) => {
              if (element.id !== String(newIndex)) {
                element.id = newIndex;
              }
            });

            // データを保存（カテゴリー更新なし）
            await Storage.set({
              localPromptList: AppState.data.localPromptList,
            });

            // デバウンス付きでカテゴリー更新
            debouncedCategoryUpdate();
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
    const value = item.Value;

    // プロンプト入力（テキスト編集用）
    const $valueInput = UIFactory.createInput({
      value: value,
      index: index,
      style: { width: "400px" },
      onInput: (newValue) => {
        editPrompt.editingValue(newValue, index);
        window.app.updatePromptDisplay();
      },
    });

    // 重み入力
    const $weightInput = UIFactory.createInput({
      value: weight !== null && weight !== undefined ? weight : "0",
      index: index,
      style: { width: "50px" },
      onInput: (newWeight) => {
        const cleanWeight = newWeight.replace(/[^-0-9.]/g, "");
        editPrompt.editingWeight(cleanWeight, index);
        window.app.updatePromptDisplay();
      },
    });

    $li.append($valueInput);

    // 重みがある場合のみ表示
    if (weight !== null && weight !== undefined) {
      $li.append($weightInput);
    }

    // 重み調整ボタン
    const weightDelta = shaping === "SD" ? 0.1 : shaping === "NAI" ? 1 : 0;
    if (weightDelta > 0) {
      // UIFactoryを使わずに直接ボタンを作成
      const weightPlusBtn = document.createElement("button");
      weightPlusBtn.textContent = "+";
      weightPlusBtn.type = "submit";
      weightPlusBtn.addEventListener("click", () => {
        editPrompt.addWeight(weightDelta, index);
        window.app.updatePromptDisplay();

        // 重み入力フィールドの値を更新
        const newWeight = editPrompt.elements[index][shaping].weight;
        $weightInput.val(newWeight);
      });

      const weightMinusBtn = document.createElement("button");
      weightMinusBtn.textContent = "-";
      weightMinusBtn.type = "submit";
      weightMinusBtn.addEventListener("click", () => {
        editPrompt.addWeight(-weightDelta, index);
        window.app.updatePromptDisplay();

        // 重み入力フィールドの値を更新
        const newWeight = editPrompt.elements[index][shaping].weight;
        $weightInput.val(newWeight);
      });

      $li.append(weightPlusBtn, weightMinusBtn);
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

    // ドラッグアイコン
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

    // 要素のIDを使って実際のインデックスを見つける関数
    const findRealIndex = () => {
      return editPrompt.elements.findIndex((el) => el.id === item.id);
    };

    // プロンプト入力
    const $valueInput = UIFactory.createInput({
      value: prompt,
      index: index,
      onInput: (value) => {
        const realIndex = findRealIndex();
        if (realIndex !== -1) {
          editPrompt.editingValue(value, realIndex);
          $weightInput.val(editPrompt.elements[realIndex][shaping].weight);
          window.app.updatePromptDisplay();
        }
      },
    });

    // 重み入力
    const $weightInput = UIFactory.createInput({
      value: weight !== null && weight !== undefined ? weight : "0",
      index: index,
      onInput: (value) => {
        const cleanWeight = value.replace(/[^-0-9.]/g, "");
        const realIndex = findRealIndex();
        if (realIndex !== -1) {
          editPrompt.editingWeight(cleanWeight, realIndex);
          window.app.updatePromptDisplay();
        }
      },
    });

    $li.append($valueInput);
    if (weight !== null && weight !== undefined) {
      $li.append($weightInput);
    }

    // 重み調整ボタン
    const weightDelta = shaping === "SD" ? 0.1 : shaping === "NAI" ? 1 : 0;
    if (weightDelta > 0) {
      // UIFactoryを使わずに直接ボタンを作成
      const weightPlusBtn = document.createElement("button");
      weightPlusBtn.textContent = "+";
      weightPlusBtn.type = "submit";
      weightPlusBtn.addEventListener("click", () => {
        const realIndex = findRealIndex();
        if (realIndex !== -1) {
          editPrompt.addWeight(weightDelta, realIndex);
          window.app.updatePromptDisplay();

          // 重み入力フィールドの値を更新
          const newWeight = editPrompt.elements[realIndex][shaping].weight;
          $weightInput.val(newWeight);
        }
      });

      const weightMinusBtn = document.createElement("button");
      weightMinusBtn.textContent = "-";
      weightMinusBtn.type = "submit";
      weightMinusBtn.addEventListener("click", () => {
        const realIndex = findRealIndex();
        if (realIndex !== -1) {
          editPrompt.addWeight(-weightDelta, realIndex);
          window.app.updatePromptDisplay();

          // 重み入力フィールドの値を更新
          const newWeight = editPrompt.elements[realIndex][shaping].weight;
          $weightInput.val(newWeight);
        }
      });

      $li.append(weightPlusBtn, weightMinusBtn);
    }

    // 削除ボタン
    const deleteButton = UIFactory.createButtonSet({
      includeDelete: true,
      onDelete: () => {
        const realIndex = findRealIndex();
        if (realIndex !== -1) {
          editPrompt.removeElement(realIndex);
          window.app.updatePromptDisplay();
          window.app.refreshEditList();
        }
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
      // マスターとローカル両方から検索（修正済み）
      const masterElement = AppState.data.masterPrompts.find(
        (e) => e.prompt === prompt
      );
      const localElement = AppState.data.localPromptList.find(
        (e) => e.prompt === prompt
      );

      // ローカルを優先
      const element = localElement || masterElement;

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

      // マスターとローカル両方から検索（修正済み）
      const masterPrompt = AppState.data.masterPrompts.find(
        (p) => p.data[2] === inputValue
      );
      const localPrompt = AppState.data.localPromptList.find(
        (p) => p.data[2] === inputValue
      );

      // ローカルを優先、なければマスター、それでもなければ現在の値
      const foundPrompt = localPrompt || masterPrompt;
      const newPrompt = foundPrompt?.prompt || $valueInput.val();

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
        // すべての要素を追加（保存はスキップ）
        for (const item of data.data) {
          if (RegistDic(item, true)) {
            // skipSave = true
            addCount++;
          }
        }

        // 最後に一度だけ保存
        if (addCount > 0) {
          await saveLocalList(); // 一度だけ実行

          ErrorHandler.notify(`${addCount}件の要素辞書を読み込みました`, {
            type: ErrorHandler.NotificationType.TOAST,
            messageType: "success",
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
// アプリケーション初期化（jQuery削除版）
// ============================================

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", async () => {
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
} else {
  // 既にDOMが読み込まれている場合
  (async () => {
    try {
      window.app = new PromptGeneratorApp();
      await window.app.init();

      console.log("Prompt Generator initialized successfully");
    } catch (error) {
      console.error("Failed to initialize application:", error);
      alert(
        "アプリケーションの初期化に失敗しました。ページを再読み込みしてください。"
      );
    }
  })();
}
