/**
 * other-tab.js - その他タブモジュール
 * Phase 8.5: お知らせ、ファイルインポート機能
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
      }

      /**
       * イベントリスナーの設定
       */
      setupEventListeners() {
        // ドラッグ&ドロップエリアの設定
        this.setupDragDrop();
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
          e.dataTransfer.dropEffect = "copy";
          dropArea.classList.add("drag-over");
        });

        // ドラッグリーブ
        this.addEventListener(dropArea, "dragleave", (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropArea.classList.remove("drag-over");
        });

        // ドロップ
        this.addEventListener(dropArea, "drop", (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropArea.classList.remove("drag-over");

          const file = e.dataTransfer.files[0];
          if (file) {
            this.handleFile(file);
          }
        });

        // クリックでファイル選択
        this.addEventListener(dropArea, "click", () => {
          this.selectFile();
        });
      }

      /**
       * ファイル選択ダイアログを開く
       */
      selectFile() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json,.png,.csv";
        input.style.display = "none";

        document.body.appendChild(input);

        input.addEventListener("change", (e) => {
          const file = e.target.files[0];
          if (file) {
            this.handleFile(file);
          }
          document.body.removeChild(input);
        });

        input.click();
      }

      /**
       ファイルを処理
       * @param {File} file - 処理するファイル
       */
      async handleFile(file) {
        // インジケーターを更新
        const incluedText = this.getElement("#incluedText");
        if (incluedText) {
          incluedText.textContent = "読み込み中...";
        }

        try {
          // FileHandlerに処理を委譲
          await this.fileHandler.handleFile(file);

          // 成功時の処理はFileHandler内で完結
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
