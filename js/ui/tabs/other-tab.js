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

        // セレクターの現在の状態を更新
        await this.loadSelectors();
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
          const stored = await Storage.get([
            "positivePromptText",
            "generateButton",
          ]);

          const promptInput = document.getElementById("promptSelector");
          const generateInput = document.getElementById("generateSelector");

          if (promptInput && stored.positivePromptText) {
            promptInput.value = stored.positivePromptText;
          }

          if (generateInput && stored.generateButton) {
            generateInput.value = stored.generateButton;
          }

          // AppStateの値も表示（デバッグ用）
          console.log("Current selectors in AppState:", {
            prompt: AppState.selector.positivePromptText,
            button: AppState.selector.generateButton,
          });
        } catch (error) {
          console.error("Failed to load selectors:", error);
        }
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
          // 入力フィールドをクリア
          document.getElementById("promptSelector").value = "";
          document.getElementById("generateSelector").value = "";

          // ステータス表示をクリア
          this.clearSelectorStatus("promptSelectorStatus");
          this.clearSelectorStatus("generateSelectorStatus");

          // AppStateをクリア
          AppState.selector.positivePromptText = null;
          AppState.selector.generateButton = null;

          // Storageからも削除
          await Storage.remove(["positivePromptText", "generateButton"]);

          // Generateボタンを非表示
          const generateButton = document.getElementById("GeneratoButton");
          if (generateButton) {
            generateButton.style.display = "none";
          }

          this.showMessage("セレクターをクリアしました", "info");
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
        console.log("Current selectors:", {
          prompt: AppState.selector.positivePromptText,
          button: AppState.selector.generateButton,
        });
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
