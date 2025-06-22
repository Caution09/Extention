/**
 * main.js - Prompt Generator メインスクリプト
 * Phase 2: コード品質改善版 + Phase 4: jQuery削除版 + Phase 5: モジュール分離版
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

    // Phase 5: 外部モジュールのインスタンス化
    this.listManager = new PromptListManager();
    this.fileHandler = new FileHandler();
    this.searchHandler = new SearchHandler(this);
    this.editHandler = new EditHandler(this);
    this.dictionaryHandler = new DictionaryHandler(this);

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
      this.editHandler.initializeEditMode();
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
  // 検索機能（SearchHandlerに委譲）
  // ============================================

  setupSearchHandlers() {
    // カテゴリー検索
    const searchCat0 = document.getElementById("search-cat0");
    if (searchCat0) {
      searchCat0.addEventListener("change", (e) => {
        const value = e.target.value;
        this.searchHandler.updateCategoryDropdown("#search-cat1", 1, value);
        // ドロップダウン変更時はローディングを表示しない
        this.searchHandler.performSearch({ showLoading: false });
      });
    }

    const searchCat1 = document.getElementById("search-cat1");
    if (searchCat1) {
      searchCat1.addEventListener("change", () => {
        // ドロップダウン変更時はローディングを表示しない
        this.searchHandler.performSearch({ showLoading: false });
      });
    }

    const searchCatReset = document.getElementById("search-cat-reset");
    if (searchCatReset) {
      searchCatReset.addEventListener("click", () => {
        this.searchHandler.resetCategorySearch();
      });
    }

    // キーワード検索
    const searchButton = document.getElementById("searchButton");
    if (searchButton) {
      searchButton.addEventListener("click", () => {
        // ボタンクリック時はローディングを表示
        this.searchHandler.performSearch({ showLoading: true });
      });
    }

    const searchInput = document.getElementById("search");
    if (searchInput) {
      searchInput.addEventListener("keypress", (e) => {
        if (e.keyCode === 13) {
          // Enter key
          // Enterキー押下時はローディングを表示
          this.searchHandler.performSearch({ showLoading: true });
        }
      });
    }
  }

  // ============================================
  // 編集機能（EditHandlerに委譲）
  // ============================================

  setupEditHandlers() {
    // UIタイプ変更
    const uiTypeRadios = document.querySelectorAll('[name="UIType"]');
    uiTypeRadios.forEach((radio) => {
      radio.addEventListener("change", (e) =>
        this.editHandler.handleUITypeChange(e)
      );
    });

    // 編集タイプ変更
    const editTypeRadios = document.querySelectorAll('[name="EditType"]');
    editTypeRadios.forEach((radio) => {
      radio.addEventListener("change", (e) =>
        this.editHandler.handleEditTypeChange(e)
      );
    });
  }

  // 編集リストの更新（EditHandlerのメソッドを呼び出し）
  async refreshEditList() {
    return this.editHandler.refreshEditList();
  }

  // ============================================
  // 辞書機能（DictionaryHandlerに委譲）
  // ============================================

  setupDictionaryHandlers() {
    // 辞書の開閉
    const promptDicText = document.getElementById("promptDicText");
    if (promptDicText) {
      promptDicText.addEventListener("click", () =>
        this.dictionaryHandler.toggleDictionary("prompt")
      );
    }

    const elementDicText = document.getElementById("elementDicText");
    if (elementDicText) {
      elementDicText.addEventListener("click", () =>
        this.dictionaryHandler.toggleDictionary("element")
      );
    }

    const masterDicText = document.getElementById("masterDicText");
    if (masterDicText) {
      masterDicText.addEventListener("click", () =>
        this.dictionaryHandler.toggleDictionary("master")
      );
    }

    // 要素の追加
    const resistButton = document.getElementById("resist");
    if (resistButton) {
      resistButton.addEventListener("click", () =>
        this.dictionaryHandler.handleElementRegistration()
      );
    }

    // カテゴリー連動
    this.dictionaryHandler.setupCategoryInputs();
  }

  // アーカイブリストの更新（DictionaryHandlerのメソッドを呼び出し）
  async refreshArchiveList() {
    return this.dictionaryHandler.refreshArchiveList();
  }

  // 追加リストの更新（DictionaryHandlerのメソッドを呼び出し）
  async refreshAddList() {
    return this.dictionaryHandler.refreshAddList();
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
          this.editHandler.refreshEditList();
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

    // 設定エクスポート
    const exportSettingsBtn = document.getElementById("exportSettings");
    if (exportSettingsBtn) {
      exportSettingsBtn.addEventListener("click", () => {
        settingsManager.downloadExport();
      });
    }

    // 設定インポート
    const importSettingsBtn = document.getElementById("importSettings");
    if (importSettingsBtn) {
      importSettingsBtn.addEventListener("click", () => {
        const mergeMode = document.getElementById("importMergeMode").checked;

        settingsManager.selectAndImport({
          includeSettings: true,
          includeLocalDict: true,
          includeArchives: true,
          includeCategories: true,
          includeMaster: false, // マスターデータは通常除外
          merge: mergeMode,
        });
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
        this.searchHandler.updateCategoryDropdown(
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
