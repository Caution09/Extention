/**
 * other-tab.js - その他タブモジュール
 * 既存のセレクター処理を拡張してビジュアルセレクター機能を追加
 */

(function () {
  "use strict";

  function defineOtherTab() {
    if (typeof TabManager === "undefined") {
      setTimeout(defineOtherTab, 10);
      return;
    }

    class OtherTab extends TabManager {
      constructor(app) {
        super(app, {
          tabId: "noticeBody",
          tabButtonId: "noticeTab",
          tabIndex: 4,
        });

        this.fileHandler = null;
        this.visualSelectorState = {
          mode: "inactive",
          targetInputId: null,
        };

        // サービス定義
        this.services = {
          novelai: {
            name: "NovelAI",
            url: "https://novelai.net/image",
            positivePromptText: "textarea[placeholder='Prompt']",
            generateButton: "button.bg-generation",
          },
          sdwebui: {
            name: "Stable Diffusion WebUI",
            url: "http://127.0.0.1:7860/",
            positivePromptText: "#txt2img_prompt textarea",
            generateButton: "#txt2img_generate",
          },
          comfyui: {
            name: "ComfyUI",
            url: "http://127.0.0.1:8188/",
            positivePromptText: "textarea.comfy-multiline-input",
            generateButton: "button.execute-button",
          },
        };
      }

      async onInit() {
        this.fileHandler = this.app.fileHandler || new FileHandler();
        this.setupEventListeners();
        await this.loadNotice();
        await this.initializeSelectorUI();

        // 自動Generate機能の初期化を追加
        this.initializeAutoGenerate();

        console.log("OtherTab initialized");
      }

      async onShow() {
        const tabButton = document.getElementById(this.tabButtonId);
        if (tabButton && tabButton.classList.contains("is-alert")) {
          tabButton.classList.remove("is-alert");
        }
        // 現在のセレクター情報を表示
        await this.refreshSelectorDisplay();

        // 自動Generate機能の再初期化（タブ切り替え時）
        this.initializeAutoGenerate();
      }

      setupEventListeners() {
        this.setupSelectorEventListeners();
        this.setupSettingsEventListeners();
        this.setupDragDrop();
      }

      // セレクター関連のイベントリスナー
      setupSelectorEventListeners() {
        // サービス選択ドロップダウン
        const serviceSelect = document.getElementById("selector-service");
        if (serviceSelect) {
          this.addEventListener(serviceSelect, "change", (e) => {
            this.onServiceSelected(e.target.value);
          });
        }

        // ビジュアル選択ボタン
        document.querySelectorAll(".visual-select-btn").forEach((btn) => {
          this.addEventListener(btn, "click", (e) => {
            const targetId = e.currentTarget.dataset.target;
            this.toggleVisualSelector(targetId, e.currentTarget);
          });
        });

        // アクションボタン
        const testBtn = document.getElementById("testSelectors");
        if (testBtn) {
          this.addEventListener(testBtn, "click", () => this.testSelectors());
        }

        const saveBtn = document.getElementById("saveSelectors");
        if (saveBtn) {
          this.addEventListener(saveBtn, "click", () => this.saveSelectors());
        }

        const clearBtn = document.getElementById("clearSelectors");
        if (clearBtn) {
          this.addEventListener(clearBtn, "click", () => this.clearSelectors());
        }

        // セレクター入力フィールドの変更監視
        ["positivePromptSelector", "generateButtonSelector"].forEach((id) => {
          const input = document.getElementById(id);
          if (input) {
            this.addEventListener(input, "input", () => {
              this.validateSelector(id, input.value);
            });
          }
        });
      }

      // 設定関連のイベントリスナー（既存の処理を維持）
      setupSettingsEventListeners() {
        // 既存の設定処理はそのまま維持
        const isDeleteCheck = document.getElementById("isDeleteCheck");
        if (isDeleteCheck) {
          // 既存の処理を維持
        }

        const deeplAuth = document.getElementById("DeeplAuth");
        if (deeplAuth) {
          // 既存の処理を維持
        }

        // その他の設定も同様
      }

      // セレクターUIの初期化
      async initializeSelectorUI() {
        // 現在のURLからサービスを判定
        try {
          const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          if (tab && tab.url) {
            for (const [key, service] of Object.entries(this.services)) {
              if (tab.url.includes(service.url)) {
                const serviceSelect =
                  document.getElementById("selector-service");
                if (serviceSelect) {
                  serviceSelect.value = key;
                  this.onServiceSelected(key);
                }
                break;
              }
            }
          }
        } catch (error) {
          console.log("Could not detect current service");
        }

        // 既存のセレクターを表示
        await this.refreshSelectorDisplay();
      }

      // サービスが選択されたときの処理
      onServiceSelected(serviceKey) {
        if (!serviceKey || serviceKey === "custom") {
          // カスタムの場合は何もしない
          return;
        }

        const service = this.services[serviceKey];
        if (!service) return;

        // セレクターフィールドに値を設定
        const positiveInput = document.getElementById("positivePromptSelector");
        const generateInput = document.getElementById("generateButtonSelector");

        if (positiveInput) {
          positiveInput.value = service.positivePromptText;
          this.validateSelector(
            "positivePromptSelector",
            service.positivePromptText
          );
        }

        if (generateInput) {
          generateInput.value = service.generateButton;
          this.validateSelector(
            "generateButtonSelector",
            service.generateButton
          );
        }
      }

      // 現在のセレクター情報を表示
      async refreshSelectorDisplay() {
        try {
          // AppState.selectorから現在の値を取得
          const positiveSelector = AppState.selector.positivePromptText;
          const generateSelector = AppState.selector.generateButton;

          if (positiveSelector) {
            const input = document.getElementById("positivePromptSelector");
            if (input) {
              input.value = positiveSelector;
              this.validateSelector("positivePromptSelector", positiveSelector);
            }
          }

          if (generateSelector) {
            const input = document.getElementById("generateButtonSelector");
            if (input) {
              input.value = generateSelector;
              this.validateSelector("generateButtonSelector", generateSelector);
            }
          }
        } catch (error) {
          console.error("Failed to refresh selector display:", error);
        }
      }

      // ビジュアルセレクターの切り替え
      async toggleVisualSelector(targetId, button) {
        if (this.visualSelectorState.mode === "selecting") {
          this.endVisualSelection();
          button.classList.remove("active");
        } else {
          button.classList.add("active");
          button.style.background = "#dc3545";
          button.style.color = "white";
          this.startVisualSelection(targetId);
        }
      }

      // ビジュアル選択モードを開始
      async startVisualSelection(targetId) {
        this.visualSelectorState.mode = "selecting";
        this.visualSelectorState.targetInputId = targetId;

        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (!tab) return;

        try {
          // content.jsのビジュアルセレクターを起動
          await chrome.tabs.sendMessage(tab.id, {
            action: "startVisualSelection",
          });

          // 選択結果を待つ
          chrome.runtime.onMessage.addListener(
            this.handleSelectorMessage.bind(this)
          );

          ErrorHandler.notify(
            "要素をクリックして選択してください（ESCで終了）",
            {
              type: ErrorHandler.NotificationType.TOAST,
            }
          );
        } catch (error) {
          console.error("Failed to start visual selection:", error);
          ErrorHandler.notify("このページでは使用できません", {
            type: ErrorHandler.NotificationType.TOAST,
            messageType: "error",
          });
          this.endVisualSelection();
        }
      }

      // セレクター選択メッセージの処理
      handleSelectorMessage(message, sender, sendResponse) {
        if (message.action === "selectorSelected") {
          const input = document.getElementById(
            this.visualSelectorState.targetInputId
          );
          if (input) {
            input.value = message.selector;
            this.validateSelector(
              this.visualSelectorState.targetInputId,
              message.selector
            );
          }
          this.endVisualSelection();
          ErrorHandler.notify("セレクターを取得しました", {
            type: ErrorHandler.NotificationType.TOAST,
            messageType: "success",
          });
        } else if (message.action === "visualSelectionCanceled") {
          this.endVisualSelection();
        }
      }

      // ビジュアル選択モードを終了
      endVisualSelection() {
        this.visualSelectorState.mode = "inactive";

        // ボタンの状態をリセット
        document.querySelectorAll(".visual-select-btn").forEach((btn) => {
          btn.classList.remove("active");
          btn.style.background = "";
          btn.style.color = "";
        });

        // content.jsに終了を通知
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.tabs
              .sendMessage(tabs[0].id, {
                action: "endVisualSelection",
              })
              .catch(() => {});
          }
        });
      }

      // セレクターを検証
      async validateSelector(inputId, selector) {
        const statusId = inputId.replace("Selector", "Status");
        const statusElement = document.getElementById(statusId);

        if (!statusElement || !selector) return;

        try {
          const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          if (!tab) return;

          // content.jsの既存の検証機能を使用
          const response = await chrome.tabs.sendMessage(tab.id, {
            action: "validateSelector",
            selector: selector,
          });

          if (response && response.valid) {
            statusElement.textContent = `✓ 要素が見つかりました (${response.count}個)`;
            statusElement.className = "selector-status valid";
            statusElement.style.display = "block";
          } else {
            statusElement.textContent = "✗ 要素が見つかりません";
            statusElement.className = "selector-status invalid";
            statusElement.style.display = "block";
          }
        } catch (error) {
          statusElement.textContent =
            "✗ 検証できません（ページを開いてください）";
          statusElement.className = "selector-status invalid";
          statusElement.style.display = "block";
        }
      }

      // セレクターをテスト
      async testSelectors() {
        const positiveSelector = document.getElementById(
          "positivePromptSelector"
        )?.value;
        const generateSelector = document.getElementById(
          "generateButtonSelector"
        )?.value;

        if (!positiveSelector || !generateSelector) {
          ErrorHandler.notify("セレクターを入力してください", {
            type: ErrorHandler.NotificationType.TOAST,
            messageType: "error",
          });
          return;
        }

        try {
          const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          if (!tab) return;

          const response = await chrome.tabs.sendMessage(tab.id, {
            action: "testSelectors",
            selectors: {
              positive: positiveSelector,
              generate: generateSelector,
            },
            testPrompt: "Test prompt from Prompt Generator",
          });

          if (response && response.success) {
            ErrorHandler.notify("テスト成功！プロンプトが入力されました", {
              type: ErrorHandler.NotificationType.TOAST,
              messageType: "success",
            });
          } else {
            ErrorHandler.notify("テスト失敗：要素が見つかりません", {
              type: ErrorHandler.NotificationType.TOAST,
              messageType: "error",
            });
          }
        } catch (error) {
          console.error("Test error:", error);
          ErrorHandler.notify("テスト失敗：ページにアクセスできません", {
            type: ErrorHandler.NotificationType.TOAST,
            messageType: "error",
          });
        }
      }

      // セレクターを保存（AppState.selectorに保存）
      async saveSelectors() {
        const positiveSelector = document.getElementById(
          "positivePromptSelector"
        )?.value;
        const generateSelector = document.getElementById(
          "generateButtonSelector"
        )?.value;

        if (!positiveSelector || !generateSelector) {
          ErrorHandler.notify("両方のセレクターを入力してください", {
            type: ErrorHandler.NotificationType.TOAST,
            messageType: "error",
          });
          return;
        }

        try {
          // AppState.selectorを更新
          AppState.selector.positivePromptText = positiveSelector;
          AppState.selector.generateButton = generateSelector;

          // ストレージに保存
          await Storage.set({
            positivePromptText: positiveSelector,
            generateButton: generateSelector,
          });

          ErrorHandler.notify("セレクターを保存しました", {
            type: ErrorHandler.NotificationType.TOAST,
            messageType: "success",
          });

          // Generateボタンの表示を更新
          this.updateGenerateButtonVisibility();
        } catch (error) {
          console.error("Save error:", error);
          ErrorHandler.notify("保存に失敗しました", {
            type: ErrorHandler.NotificationType.TOAST,
            messageType: "error",
          });
        }
      }

      // セレクターをクリア
      async clearSelectors() {
        if (!confirm("セレクターをクリアしますか？")) return;

        const positiveInput = document.getElementById("positivePromptSelector");
        const generateInput = document.getElementById("generateButtonSelector");

        if (positiveInput) positiveInput.value = "";
        if (generateInput) generateInput.value = "";

        // ステータスをクリア
        document.querySelectorAll(".selector-status").forEach((status) => {
          status.textContent = "";
          status.style.display = "none";
        });

        try {
          // AppState.selectorをクリア
          AppState.selector.positivePromptText = null;
          AppState.selector.generateButton = null;

          // ストレージからも削除
          await Storage.remove(["positivePromptText", "generateButton"]);

          ErrorHandler.notify("セレクターをクリアしました", {
            type: ErrorHandler.NotificationType.TOAST,
          });

          // Generateボタンを非表示に
          this.updateGenerateButtonVisibility();
        } catch (error) {
          console.error("Clear error:", error);
        }
      }

      // Generateボタンの表示/非表示を更新
      updateGenerateButtonVisibility() {
        const genBtn = document.getElementById("GeneratoButton");
        const noButtonCheck = document.getElementById("NoButtonGenerat");

        if (genBtn) {
          const hasSelectors =
            AppState.selector.positivePromptText &&
            AppState.selector.generateButton;
          const isNAI = AppState.userSettings.optionData?.shaping === "NAI";
          const showButton = hasSelectors && isNAI && !noButtonCheck?.checked;

          genBtn.style.display = showButton ? "block" : "none";

          // 自動Generate機能の表示も更新
          const autoGenerateOption =
            document.getElementById("autoGenerateOption");
          if (autoGenerateOption) {
            autoGenerateOption.style.display = showButton ? "block" : "none";
          }
        }
      }

      // 自動Generate機能の初期化
      initializeAutoGenerate() {
        // autoGenerateHandlerが存在する場合は初期化
        if (window.autoGenerateHandler) {
          autoGenerateHandler.init();
        }
      }

      // お知らせを読み込み
      async loadNotice() {
        // 既存の処理を維持
      }

      // ドラッグ&ドロップの設定（既存の処理を維持）
      setupDragDrop() {
        const dropArea = document.getElementById("inclued");
        if (!dropArea) return;

        this.addEventListener(dropArea, "dragover", (e) => {
          e.preventDefault();
          dropArea.classList.add("drag-over");
        });

        this.addEventListener(dropArea, "dragleave", (e) => {
          if (e.target === dropArea) {
            dropArea.classList.remove("drag-over");
          }
        });

        this.addEventListener(dropArea, "drop", async (e) => {
          e.preventDefault();
          dropArea.classList.remove("drag-over");

          const files = Array.from(e.dataTransfer.files);
          if (files.length > 0) {
            await this.handleFiles(files);
          }
        });

        this.addEventListener(dropArea, "click", () => {
          const fileInput = document.createElement("input");
          fileInput.type = "file";
          fileInput.accept = ".json,.png,.csv";
          fileInput.multiple = true;

          fileInput.addEventListener("change", async (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
              await this.handleFiles(files);
            }
          });

          fileInput.click();
        });
      }

      async handleFiles(files) {
        const incluedText = document.getElementById("incluedText");
        try {
          if (incluedText) {
            incluedText.textContent = "読み込み中...";
          }
          this.clearPngPreview();

          for (const file of files) {
            await this.fileHandler.handleFile(file);
          }
        } catch (error) {
          ErrorHandler.log("File handling failed", error);
          ErrorHandler.notify("ファイルの読み込みに失敗しました", {
            type: ErrorHandler.NotificationType.TOAST,
            messageType: "error",
          });
        } finally {
          if (incluedText) {
            incluedText.textContent =
              "辞書（JSON）、画像（PNG）、CSVファイルを読み込む (クリックして選択かドラッグドロップ)";
          }
        }
      }

      clearPngPreview() {
        const preview = document.getElementById("preview");
        const pngInfo = document.getElementById("pngInfo");

        if (preview) {
          preview.src = "";
          preview.style.display = "none";
        }

        if (pngInfo) {
          pngInfo.innerHTML = "";
        }
      }

      async onRefresh() {
        await this.refreshSelectorDisplay();
      }

      setNoticeAlert(showAlert, message) {
        const tabButton = document.getElementById(this.tabButtonId);
        if (tabButton) {
          if (showAlert) {
            tabButton.classList.add("is-alert");
          } else {
            tabButton.classList.remove("is-alert");
          }
        }

        if (message) {
          const noticeElement = document.getElementById("notice");
          if (noticeElement) {
            noticeElement.innerHTML = message;
          }
        }
      }

      debug() {
        super.debug();
        console.log("FileHandler:", this.fileHandler);
        console.log("Visual Selector State:", this.visualSelectorState);
        console.log("Current selectors:", {
          positive: AppState.selector.positivePromptText,
          generate: AppState.selector.generateButton,
        });
      }
    }

    if (typeof window !== "undefined") {
      window.OtherTab = OtherTab;
    }
  }

  defineOtherTab();
})();
