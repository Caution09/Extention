/**
 * main.js - Prompt Generator メインスクリプト
 * Phase 2: コード品質改善版 + Phase 4: jQuery削除版 + Phase 5: モジュール分離版
 * Phase 8.5: タブモジュール化完了！
 */

// ============================================
// グローバル定数
// ============================================
const CONSTANTS = {
  TABS: {
    SEARCH: 0,
    DICTIONARY: 1,
    EDIT: 2,
    SLOT: 3,
    OTHER: 4,
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

// グローバルに公開（他のモジュールからアクセス可能にする）
if (typeof window !== "undefined") {
  window.CONSTANTS = CONSTANTS;
}

// ============================================
// アプリケーションクラス
// ============================================
class PromptGeneratorApp {
  constructor() {
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
    this.searchHandler = new SearchHandler(this);
    this.editHandler = new EditHandler(this);
    this.dictionaryHandler = new DictionaryHandler(this);
    this.shortcutManager = new ShortcutManager();

    // Phase 8.5: タブモジュール
    this.tabs = {};

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

      // Phase 8.5: タブの初期化
      if (typeof SearchTab !== "undefined") {
        this.tabs.search = new SearchTab(this);
        await this.tabs.search.init();
      }

      if (typeof DictionaryTab !== "undefined") {
        this.tabs.dictionary = new DictionaryTab(this);
        await this.tabs.dictionary.init();
      }

      if (typeof EditTab !== "undefined") {
        this.tabs.edit = new EditTab(this);
        await this.tabs.edit.init();
      }

      if (typeof SlotTab !== "undefined") {
        this.tabs.slot = new SlotTab(this);
        await this.tabs.slot.init();
      }

      if (typeof OtherTab !== "undefined") {
        this.tabs.other = new OtherTab(this);
        await this.tabs.other.init();
      }

      // 終了時の処理を設定
      this.setupCloseHandlers();

      // ショートカットキーの初期化
      this.shortcutManager.setupEventListeners();

      // プロンプトスロットの初期化（改善版）
      console.log("Initializing prompt slots...");
      const loaded = await promptSlotManager.loadFromStorage();

      if (loaded) {
        // 保存されているスロットから復元
        const currentSlot =
          promptSlotManager.slots[promptSlotManager.currentSlot];
        if (currentSlot && currentSlot.isUsed) {
          // 保存されているスロットのプロンプトを設定
          promptEditor.init(currentSlot.prompt);
          this.generateInput.val(currentSlot.prompt);
        } else {
          // 現在のスロットが空の場合
          promptEditor.init("");
          this.generateInput.val("");
        }
      } else {
        // 初回起動時：現在のプロンプトをスロット0に保存
        const currentPrompt = this.generateInput.val() || "";
        promptEditor.init(currentPrompt);
        if (currentPrompt) {
          promptSlotManager.slots[0].prompt = currentPrompt;
          promptSlotManager.slots[0].isUsed = true;
          await promptSlotManager.saveCurrentSlot();
        }
      }

      promptSlotManager.updateUI();

      // 自動Generate機能の初期化（NAIチェックを削除）
      setTimeout(() => {
        if (window.autoGenerateHandler) {
          console.log("Initializing Auto Generate feature...");
          autoGenerateHandler.init();
        }
      }, 1000);

      // 現在のタブのサービスを検出してセレクターを設定（統合版）
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs[0]) {
          const service = this.detectService(tabs[0].url);

          // まずストレージから読み込み（これは既にinitializeDataManagerで実行済みのはず）
          // 念のため再確認
          const hasStoredSelectors =
            AppState.selector.positiveSelector &&
            AppState.selector.generateSelector;

          // ストレージに保存された値がある場合はそれを優先
          if (hasStoredSelectors) {
            const generateButton = document.getElementById("GeneratoButton");
            if (generateButton) {
              generateButton.style.display = "block";
              console.log("Using saved selectors from storage");
            }
          }
          // ストレージに値がない場合のみ、サービス固有のセレクターを使用
          else if (service && AppState.selector.serviceSets[service]) {
            const serviceSelectors = AppState.selector.serviceSets[service];
            if (
              serviceSelectors.positiveSelector &&
              serviceSelectors.generateSelector
            ) {
              AppState.selector.positiveSelector =
                serviceSelectors.positiveSelector;
              AppState.selector.generateSelector =
                serviceSelectors.generateSelector;
              AppState.selector.currentService = service;

              const generateButton = document.getElementById("GeneratoButton");
              if (generateButton) {
                generateButton.style.display = "block";
                console.log(`Using default selectors for ${service}`);
              }
            }
          }
        }
      });

      const uiTypeRadios = document.querySelectorAll('[name="UIType"]');
      uiTypeRadios.forEach((radio) => {
        radio.addEventListener("change", (event) => {
          console.log("UIType changed to:", event.target.value);

          // EditHandlerに処理を委譲
          if (this.editHandler) {
            this.editHandler.handleUITypeChange(event);
          }

          // 編集タブがアクティブな場合、タブにも通知
          if (
            AppState.ui.currentTab === CONSTANTS.TABS.EDIT &&
            this.tabs.edit
          ) {
            this.tabs.edit.currentShapingMode = event.target.value;
          }
        });
      });

      const editTypeRadios = document.querySelectorAll('[name="EditType"]');
      editTypeRadios.forEach((radio) => {
        radio.addEventListener("change", (event) => {
          console.log("EditType changed to:", event.target.value);

          if (this.editHandler) {
            this.editHandler.handleEditTypeChange(event);
          }

          if (
            AppState.ui.currentTab === CONSTANTS.TABS.EDIT &&
            this.tabs.edit
          ) {
            this.tabs.edit.currentEditMode = event.target.value;
          }
        });
      });

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
      throw error;
    }
  }

  // サービス検出メソッドを追加
  detectService(url) {
    if (!url) return null;

    if (url.includes("novelai.net")) return "novelai";
    if (url.includes("127.0.0.1:7860") || url.includes("localhost:7860"))
      return "stable_diffusion";
    if (url.includes("comfyui")) return "comfyui";

    return "custom";
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

    // 初期表示の設定
    this.updateUIState();
  }

  /**
   * イベントハンドラーを設定
   */
  setupEventHandlers() {
    // ウィンドウ操作
    this.setupWindowHandlers();

    // タブ操作
    this.setupTabs();

    // オプション設定
    this.setupOptionHandlers();

    // プロンプト入力
    this.setupPromptInputHandlers();

    // ボタン操作
    this.setupButtonHandlers();

    // プロンプトスロット機能を追加
    this.setupPromptSlotHandlers();
  }

  // ============================================

  // ============================================

  setupTabs() {
    const tabs = document.querySelectorAll(".tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", (e) => this.handleTabSwitch(e));
    });
  }

  async handleTabSwitch(event) {
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

    // 検索タブの処理
    if (
      tabIndex === CONSTANTS.TABS.SEARCH &&
      previousTab !== CONSTANTS.TABS.SEARCH
    ) {
      console.log("Switching to search tab...");
      if (this.tabs.search) {
        await this.tabs.search.show();
      }
    }

    // 辞書タブの処理
    if (
      tabIndex === CONSTANTS.TABS.DICTIONARY &&
      previousTab !== CONSTANTS.TABS.DICTIONARY
    ) {
      console.log("Switching to dictionary tab...");
      if (this.tabs.dictionary) {
        await this.tabs.dictionary.show();
      }
    }

    // 編集タブの処理
    if (
      tabIndex === CONSTANTS.TABS.EDIT &&
      previousTab !== CONSTANTS.TABS.EDIT
    ) {
      console.log("Switching to edit tab...");
      if (this.tabs.edit) {
        await this.tabs.edit.show();
      }
    }

    // スロットタブの処理
    if (
      tabIndex === CONSTANTS.TABS.SLOT &&
      previousTab !== CONSTANTS.TABS.SLOT
    ) {
      console.log("Switching to slot tab...");
      if (this.tabs.slot) {
        await this.tabs.slot.show();
      }
    }

    // その他タブの処理
    if (
      tabIndex === CONSTANTS.TABS.OTHER &&
      previousTab !== CONSTANTS.TABS.OTHER
    ) {
      console.log("Switching to other tab...");
      if (this.tabs.other) {
        await this.tabs.other.show();
      }
    }

    // ポップアップを閉じる
    this.closePopup();
  }

  // ============================================

  // ============================================

  setupWindowHandlers() {
    const showPanelBtn = document.getElementById("show-panel");
    if (showPanelBtn) {
      showPanelBtn.addEventListener("click", () => {
        const optionPanel = document.getElementById("optionPanel");
        if (optionPanel) {
          optionPanel.classList.toggle("active");
        }
      });
    }

    const popupImage = document.getElementById("popup-image");
    if (popupImage) {
      popupImage.addEventListener("click", () => this.closePopup());
    }

    // ショートカットヘルプボタン
    const showShortcutsBtn = document.getElementById("show-shortcuts");
    if (showShortcutsBtn) {
      showShortcutsBtn.addEventListener("click", () => {
        this.shortcutManager.showHelp();
      });
    }
  }

  closePopup() {
    const popup = document.getElementById("popup");
    if (popup) {
      popup.style.display = "none";
    }
  }

  // ============================================

  // ============================================

  setupPromptInputHandlers() {
    let debounceTimer;

    const handlePromptChange = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        const value = this.generateInput.val();
        console.log("Prompt changed:", value);

        editPrompt.init(value);
        this.updatePromptDisplay();

        // 現在のスロットに自動保存
        await promptSlotManager.saveCurrentSlot();

        // ドロップダウンも更新
        promptSlotManager.updateUI();
      }, 100);
    };

    const promptInput = document.getElementById("generatePrompt");
    if (promptInput) {
      promptInput.addEventListener("input", handlePromptChange);
    }
  }

  setupPromptSlotHandlers() {
    // スロットセレクター
    const slotSelector = document.getElementById("prompt-slot-selector");
    if (slotSelector) {
      slotSelector.addEventListener("change", async (e) => {
        const slotId = parseInt(e.target.value);
        await promptSlotManager.switchSlot(slotId);
      });
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

        // スロットにも保存（追加）
        promptSlotManager.saveCurrentSlot();
      }
    }
  }

  // ============================================

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

    // ヘルプボタン
    const helpButton = document.getElementById("helpButton");
    if (helpButton) {
      helpButton.addEventListener("click", () =>
        this.shortcutManager.showHelp()
      );
    }

    // Generate ボタン
    const generateButton = document.getElementById("GeneratoButton");
    if (generateButton) {
      // マウスオーバーで結合プレビューを表示
      generateButton.addEventListener("mouseenter", () => {
        const combined = promptSlotManager.getCombinedPrompt();
        const usedSlots = promptSlotManager.getUsedSlots();

        if (usedSlots.length > 1) {
          generateButton.title = `結合プロンプト (${
            usedSlots.length
          }個):\n${combined.substring(0, 100)}...`;
        } else if (usedSlots.length === 1) {
          generateButton.title = "現在のプロンプトで生成";
        } else {
          generateButton.title = "使用中のプロンプトがありません";
        }
      });

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
      messageType: "success",
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
    }, 200);

    // 成功通知
    ErrorHandler.notify("プロンプトを辞書に追加しました", {
      type: ErrorHandler.NotificationType.TOAST,
      duration: 1500,
      messageType: "success",
    });
  }

  generatePrompt() {
    // 使用中のスロットを結合
    const combinedPrompt = promptSlotManager.getCombinedPrompt();

    if (!combinedPrompt) {
      ErrorHandler.notify("使用中のプロンプトがありません", {
        type: ErrorHandler.NotificationType.TOAST,
        messageType: "warning",
      });
      return;
    }

    // 使用中のスロット情報を表示（デバッグ用）
    const usedSlots = promptSlotManager.getUsedSlots();
    console.log("Generating with combined prompt from slots:", usedSlots);

    // 結合されたプロンプトで生成
    sendBackground(
      "DOM",
      "Generate",
      combinedPrompt,
      AppState.selector.positiveSelector,
      AppState.selector.generateSelector
    );

    // 通知（オプション）
    ErrorHandler.notify(`${usedSlots.length}個のスロットを結合して生成します`, {
      type: ErrorHandler.NotificationType.TOAST,
      messageType: "info",
      duration: 2000,
    });

    // 追加：スロットタブが開いている場合、表示を更新
    if (AppState.ui.currentTab === CONSTANTS.TABS.SLOT && this.tabs.slot) {
      // 少し遅延を入れて、抽出処理が完了してから更新
      setTimeout(() => {
        this.tabs.slot.refreshExtractionDisplays();
      }, 100);
    }
  }

  // ============================================

  // ============================================

  setupOptionHandlers() {
    const isDeleteCheck = document.getElementById("isDeleteCheck");
    if (isDeleteCheck) {
      isDeleteCheck.addEventListener("change", (e) => {
        AppState.userSettings.optionData.isDeleteCheck = e.target.checked;
        saveOptionData();
      });
    }

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
  // ソート可能なリスト
  // ============================================
  setupSortableLists() {
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

  // ============================================

  updateUIState() {
    // GenerateボタンON表示の更新（UIタイプ制限を削除）
    if (
      AppState.selector.positiveSelector != null &&
      AppState.selector.generateSelector != null
    ) {
      const generateButton = document.getElementById("GeneratoButton");
      if (generateButton) {
        generateButton.style.display = "block";
      }
    }
  }

  // ============================================
  // 終了時の処理
  // ============================================
  setupCloseHandlers() {
    // ページを閉じる/リロードする前に現在のスロットを保存
    window.addEventListener("beforeunload", async () => {
      console.log("Saving current slot before close...");
      await promptSlotManager.saveCurrentSlot();
    });

    // 拡張機能のポップアップが閉じられる時
    window.addEventListener("unload", async () => {
      console.log("Extension closing, saving state...");
      await promptSlotManager.saveCurrentSlot();
    });

    // visibility change でも保存（念のため）
    document.addEventListener("visibilitychange", async () => {
      if (document.hidden) {
        console.log("Page hidden, saving current slot...");
        await promptSlotManager.saveCurrentSlot();
      }
    });
  }
}

// ============================================

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
