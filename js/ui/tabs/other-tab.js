/**
 * other-tab.js - その他タブモジュール
 * Phase 8.5: お知らせ、ファイルインポート、セレクター管理機能
 */

// TabManagerが利用可能になるまで待つ
(function () {
  "use strict";

  // TabManagerが定義されるまで待機
  function defineOtherTab() {
    if (typeof TabManager === "undefined") {
      // まだTabManagerが利用できない場合は、少し待ってリトライ
      setTimeout(defineOtherTab, 10);
      return;
    }

    // OtherTabクラスの定義
    class OtherTab extends TabManager {
      constructor(app) {
        super(app, {
          tabId: "noticeBody",
          tabButtonId: "noticeTab",
          tabIndex: 4, // CONSTANTS.TABS.OTHER
        });

        // FileHandlerへの参照（遅延取得）
        this.fileHandler = null;
      }

      /**
       * 初期化処理
       */
      async onInit() {
        // FileHandlerの参照を取得
        this.fileHandler = this.app.fileHandler || new FileHandler();

        // イベントリスナーを設定
        this.setupEventListeners();

        // お知らせを読み込み
        await this.loadNotice();

        // セレクター設定を読み込み
        await this.loadSelectors();

        console.log("OtherTab initialized");
      }

      /**
       * タブ表示時の処理
       */
      async onShow() {
        // アラート状態をクリア
        const tabButton = document.getElementById(this.tabButtonId);
        if (tabButton && tabButton.classList.contains("is-alert")) {
          tabButton.classList.remove("is-alert");
        }

        // 現在のサービスに応じたセレクターを読み込み
        await this.loadSelectors();

        // サービス名を表示
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        const currentService = this.detectService(tab.url) || "custom";
        this.showMessage(`現在のサービス: ${currentService}`, "info");
      }

      /**
       * イベントリスナーの設定
       */
      setupEventListeners() {
        // ドラッグ&ドロップエリアの設定
        this.setupDragDrop();

        // セレクター管理のイベントリスナー
        this.setupSelectorEvents();
      }

      /**
       * セレクター管理のイベントリスナー設定
       */
      setupSelectorEvents() {
        // 検証ボタン
        const validateBtn = document.getElementById("validateSelectors");
        if (validateBtn) {
          validateBtn.addEventListener("click", () => this.validateSelectors());
        }

        // 保存ボタン
        const saveBtn = document.getElementById("saveSelectors");
        if (saveBtn) {
          saveBtn.addEventListener("click", () => this.saveSelectors());
        }

        // クリアボタン
        const clearBtn = document.getElementById("clearSelectors");
        if (clearBtn) {
          clearBtn.addEventListener("click", () => this.clearSelectors());
        }

        // セレクター入力フィールドの変更監視
        const promptSelector = document.getElementById("promptSelector");
        const generateSelector = document.getElementById("generateSelector");

        if (promptSelector) {
          promptSelector.addEventListener("input", () => {
            this.clearSelectorStatus("promptSelectorStatus");
          });
        }

        if (generateSelector) {
          generateSelector.addEventListener("input", () => {
            this.clearSelectorStatus("generateSelectorStatus");
          });
        }
      }

      /**
       * セレクター設定を読み込み
       */
      async loadSelectors() {
        try {
          // 現在のタブURLからサービスを判定
          const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          const currentService = this.detectService(tab.url);

          // サービスごとのセレクターを読み込み
          const stored = await Storage.get([
            "selectorSets",
            "positivePromptText",
            "generateButton",
          ]);

          // 保存されたセレクターセットがあれば適用
          if (stored.selectorSets) {
            Object.assign(AppState.selector.serviceSets, stored.selectorSets);
          }

          // 現在のサービスに応じてセレクターを設定
          if (currentService && AppState.selector.serviceSets[currentService]) {
            const serviceSelectors =
              AppState.selector.serviceSets[currentService];

            AppState.selector.positivePromptText =
              serviceSelectors.positivePromptText;
            AppState.selector.generateButton = serviceSelectors.generateButton;
            AppState.selector.currentService = currentService;

            // UIに反映
            const promptInput = document.getElementById("promptSelector");
            const generateInput = document.getElementById("generateSelector");
            const presetSelect = document.getElementById("selectorPreset");

            if (promptInput)
              promptInput.value = serviceSelectors.positivePromptText || "";
            if (generateInput)
              generateInput.value = serviceSelectors.generateButton || "";
            if (presetSelect)
              presetSelect.value =
                currentService === "stable_diffusion"
                  ? "automatic1111"
                  : currentService;

            console.log(
              `Loaded selectors for ${currentService}:`,
              serviceSelectors
            );
          } else {
            // 後方互換性のため、従来の単一セレクターも読み込み
            if (stored.positivePromptText) {
              document.getElementById("promptSelector").value =
                stored.positivePromptText;
            }
            if (stored.generateButton) {
              document.getElementById("generateSelector").value =
                stored.generateButton;
            }
          }
        } catch (error) {
          console.error("Failed to load selectors:", error);
        }
      }

      /**
       * URLからサービスを検出
       */
      detectService(url) {
        if (!url) return null;

        if (url.includes("novelai.net")) return "novelai";
        if (url.includes("127.0.0.1:7860") || url.includes("localhost:7860"))
          return "stable_diffusion";
        if (url.includes("comfyui")) return "comfyui";

        return "custom";
      }

      /**
       * セレクターを検証
       */
      async validateSelectors() {
        const promptSelector = document
          .getElementById("promptSelector")
          .value.trim();
        const generateSelector = document
          .getElementById("generateSelector")
          .value.trim();

        if (!promptSelector || !generateSelector) {
          this.showMessage("両方のセレクターを入力してください", "warning");
          return;
        }

        // 現在のタブで検証
        try {
          const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });

          if (!tab.url.includes("novelai.net")) {
            this.showMessage("NovelAIのページで検証してください", "warning");
            return;
          }

          // プロンプトセレクターを検証
          const promptCheck = await this.checkSelectorOnPage(
            tab.id,
            promptSelector
          );
          this.updateSelectorStatus(
            "promptSelectorStatus",
            promptCheck.exists,
            promptSelector
          );

          // Generateボタンセレクターを検証
          const buttonCheck = await this.checkSelectorOnPage(
            tab.id,
            generateSelector
          );
          this.updateSelectorStatus(
            "generateSelectorStatus",
            buttonCheck.exists,
            generateSelector
          );

          if (promptCheck.exists && buttonCheck.exists) {
            this.showMessage("両方のセレクターが有効です！", "success");
          } else {
            this.showMessage("無効なセレクターがあります", "error");
          }
        } catch (error) {
          console.error("Validation error:", error);
          this.showMessage("検証中にエラーが発生しました", "error");
        }
      }

      /**
       * セレクターをページで検証
       */
      checkSelectorOnPage(tabId, selector) {
        return new Promise((resolve) => {
          chrome.tabs.sendMessage(
            tabId,
            { action: "checkSelector", selector: selector },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error(
                  "Selector check error:",
                  chrome.runtime.lastError
                );
                resolve({
                  exists: false,
                  error: chrome.runtime.lastError.message,
                });
              } else {
                resolve(response || { exists: false });
              }
            }
          );
        });
      }

      /**
       * セレクターを保存
       */
      async saveSelectors() {
        const promptSelector = document
          .getElementById("promptSelector")
          .value.trim();
        const generateSelector = document
          .getElementById("generateSelector")
          .value.trim();

        if (!promptSelector || !generateSelector) {
          this.showMessage("両方のセレクターを入力してください", "warning");
          return;
        }

        try {
          // AppStateに保存
          AppState.selector.positivePromptText = promptSelector;
          AppState.selector.generateButton = generateSelector;

          // Storageに保存
          await Storage.set({
            positivePromptText: promptSelector,
            generateButton: generateSelector,
          });

          this.showMessage("セレクターを保存しました", "success");

          // 現在のタブがNovelAIの場合、Generateボタンを活性化
          const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          if (tab.url.includes("novelai.net")) {
            // validateAndActivateGenerateButton を呼び出す
            if (typeof validateAndActivateGenerateButton === "function") {
              await validateAndActivateGenerateButton();
            }
          }
        } catch (error) {
          console.error("Save error:", error);
          this.showMessage("保存中にエラーが発生しました", "error");
        }
      }

      /**
       * セレクターをクリア
       */
      async clearSelectors() {
        try {
          const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          const currentService = this.detectService(tab.url) || "custom";

          // 確認ダイアログ
          if (!confirm(`${currentService}のセレクター設定をクリアしますか？`)) {
            return;
          }

          // 入力フィールドをクリア
          document.getElementById("promptSelector").value = "";
          document.getElementById("generateSelector").value = "";

          // ステータス表示をクリア
          this.clearSelectorStatus("promptSelectorStatus");
          this.clearSelectorStatus("generateSelectorStatus");

          // 現在のサービスのセレクターをクリア
          AppState.selector.serviceSets[currentService] = {
            positivePromptText: null,
            generateButton: null,
          };

          // 現在のセレクターもクリア
          AppState.selector.positivePromptText = null;
          AppState.selector.generateButton = null;

          // Storageを更新
          await Storage.set({
            selectorSets: AppState.selector.serviceSets,
          });

          // Generateボタンを非表示
          const generateButton = document.getElementById("GeneratoButton");
          if (generateButton) {
            generateButton.style.display = "none";
          }

          this.showMessage(
            `${currentService}のセレクターをクリアしました`,
            "info"
          );
        } catch (error) {
          console.error("Clear error:", error);
          this.showMessage("クリア中にエラーが発生しました", "error");
        }
      }

      /**
       * セレクターのステータスを更新
       */
      updateSelectorStatus(elementId, isValid, selector) {
        const statusElement = document.getElementById(elementId);
        if (!statusElement) return;

        if (isValid) {
          statusElement.innerHTML = `<span style="color: green;">✓ 有効: ${selector}</span>`;
        } else {
          statusElement.innerHTML = `<span style="color: red;">✗ 無効: ${selector}</span>`;
        }
      }

      /**
       * セレクターのステータスをクリア
       */
      clearSelectorStatus(elementId) {
        const statusElement = document.getElementById(elementId);
        if (statusElement) {
          statusElement.innerHTML = "";
        }
      }

      /**
       * メッセージを表示
       */
      showMessage(message, type = "info") {
        const messageElement = document.getElementById("selectorMessage");
        if (!messageElement) return;

        const colors = {
          success: "green",
          error: "red",
          warning: "orange",
          info: "#666",
        };

        messageElement.style.color = colors[type] || colors.info;
        messageElement.textContent = message;

        // 3秒後に消去
        setTimeout(() => {
          messageElement.textContent = "";
        }, 3000);
      }

      /**
       * お知らせを読み込み
       */
      async loadNotice() {
        // お知らせはloadMessage()（api-client.js）で既に読み込まれているので、
        // ここでは特に何もしない（将来的に追加の処理が必要な場合用）
      }

      /**
       * ドラッグ&ドロップの設定
       */
      setupDragDrop() {
        const dropArea = this.getElement("#inclued");
        if (!dropArea) return;

        // ドラッグオーバー
        this.addEventListener(dropArea, "dragover", (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropArea.classList.add("dragover");
        });

        // ドラッグリーブ
        this.addEventListener(dropArea, "dragleave", (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropArea.classList.remove("dragover");
        });

        // ドロップ
        this.addEventListener(dropArea, "drop", (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropArea.classList.remove("dragover");

          const files = e.dataTransfer.files;
          if (files.length > 0) {
            this.handleFileSelect(files[0]);
          }
        });

        // クリックでファイル選択
        this.addEventListener(dropArea, "click", () => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".json,.png,.csv";
          input.onchange = (e) => {
            if (e.target.files.length > 0) {
              this.handleFileSelect(e.target.files[0]);
            }
          };
          input.click();
        });
      }

      /**
       * ファイル選択処理
       */
      async handleFileSelect(file) {
        const incluedText = document.getElementById("incluedText");

        try {
          // インジケーターを更新
          if (incluedText) {
            incluedText.textContent = `処理中: ${file.name}`;
          }

          // PNGプレビューをクリア
          this.clearPngPreview();

          // ファイル処理はFileHandler内で完結
          await this.fileHandler.handleFile(file);

          // 処理完了後、FileHandler内で適切なメッセージが表示される
          // 追加の処理はFileHandler内で完結
        } catch (error) {
          ErrorHandler.log("File handling failed", error);
          ErrorHandler.notify("ファイルの読み込みに失敗しました", {
            type: ErrorHandler.NotificationType.TOAST,
            messageType: "error",
          });
        } finally {
          // インジケーターを元に戻す
          if (incluedText) {
            incluedText.textContent =
              "辞書（JSON）、画像（PNG）、CSVファイルを読み込む (クリックして選択かドラッグドロップ)";
          }
        }
      }

      /**
       * PNGプレビューをクリア
       */
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

      /**
       * タブのリフレッシュ（将来の拡張用）
       */
      async onRefresh() {
        // 必要に応じて実装
      }

      /**
       * お知らせタブにアラートを設定
       * @param {boolean} showAlert - アラート表示の有無
       * @param {string} [message] - お知らせメッセージ
       */
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

      /**
       * デバッグ情報を出力（オーバーライド）
       */
      debug() {
        super.debug();
        console.log("FileHandler:", this.fileHandler);
        console.log("Drop area exists:", !!this.getElement("#inclued"));
        console.log("Current service:", AppState.selector.currentService);
        console.log("Current selectors:", {
          prompt: AppState.selector.positivePromptText,
          button: AppState.selector.generateButton,
        });
        console.log("Service sets:", AppState.selector.serviceSets);
      }
    }

    // グローバルに公開
    if (typeof window !== "undefined") {
      window.OtherTab = OtherTab;
    }
  }

  // 初期実行
  defineOtherTab();
})();
