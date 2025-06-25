/**
 * エラーハンドリングモジュール
 * jQuery依存を削除し、より洗練された通知システムを実装
 */
const ErrorHandler = {
  /**
   * エラーレベルの定義
   */
  Level: {
    INFO: "info",
    WARNING: "warning",
    ERROR: "error",
    CRITICAL: "critical",
  },

  /**
   * ユーザーへの通知方法
   */
  NotificationType: {
    NONE: "none",
    CONSOLE: "console",
    ALERT: "alert",
    TOAST: "toast",
    INLINE: "inline",
  },

  /**
   * トースト通知のコンテナ
   */
  toastContainer: null,

  /**
   * 初期化
   */
  init() {
    // トーストコンテナを作成
    if (!this.toastContainer) {
      this.toastContainer = document.createElement("div");
      this.toastContainer.id = "toast-container";
      this.container.className = "error-toast-container";
      document.body.appendChild(this.toastContainer);
    }

    // グローバルエラーハンドラーを設定
    this.setupGlobalHandlers();
  },

  /**
   * グローバルエラーハンドラーの設定
   */
  setupGlobalHandlers() {
    // 未処理のPromiseエラー
    window.addEventListener("unhandledrejection", (event) => {
      this.log("Unhandled promise rejection", event.reason, this.Level.ERROR);
    });

    // 通常のエラー
    window.addEventListener("error", (event) => {
      this.log("Global error", event.error, this.Level.ERROR);
    });
  },

  /**
   * エラーをログに記録
   * @param {string} message - エラーメッセージ
   * @param {Error} [error] - エラーオブジェクト
   * @param {string} [level] - エラーレベル
   */
  log(message, error = null, level = this.Level.ERROR) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
          }
        : null,
    };

    // コンソールへの出力（カラー付き）
    const logStyles = {
      [this.Level.INFO]: "color: #2196F3; font-weight: bold;",
      [this.Level.WARNING]: "color: #FF9800; font-weight: bold;",
      [this.Level.ERROR]: "color: #f44336; font-weight: bold;",
      [this.Level.CRITICAL]:
        "color: #d32f2f; font-weight: bold; font-size: 1.1em;",
    };

    console.log(
      `%c[${timestamp}] ${level.toUpperCase()}: ${message}`,
      logStyles[level] || "",
      error
    );

    // ローカルストレージに保存
    this.saveToLocalStorage(logEntry);
  },

  /**
   * エラーログをローカルストレージに保存
   * @param {Object} logEntry - ログエントリ
   */
  saveToLocalStorage(logEntry) {
    try {
      const logs = JSON.parse(localStorage.getItem("errorLogs") || "[]");
      logs.push(logEntry);

      // 最新100件のみ保持
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }

      localStorage.setItem("errorLogs", JSON.stringify(logs));
    } catch (e) {
      // ストレージが満杯の場合は古いログを削除
      localStorage.removeItem("errorLogs");
    }
  },

  /**
   * ユーザーにエラーを通知
   * @param {string} message - ユーザー向けメッセージ
   * @param {Object} [options] - 通知オプション
   */
  notify(message, options = {}) {
    const {
      type = this.NotificationType.ALERT,
      duration = 3000,
      elementId = null,
      messageType = "error",
      position = "bottom-right",
    } = options;

    switch (type) {
      case this.NotificationType.ALERT:
        window.alert(message);
        break;

      case this.NotificationType.TOAST:
        this.showToast(message, duration, messageType, position);
        break;

      case this.NotificationType.INLINE:
        if (elementId) {
          this.showInlineError(elementId, message);
        }
        break;

      case this.NotificationType.CONSOLE:
        console.log("User notification:", message);
        break;
    }
  },

  /**
   * トースト通知を表示
   * @param {string} message - メッセージ
   * @param {number} duration - 表示時間（ミリ秒）
   * @param {string} [type='error'] - メッセージタイプ
   * @param {string} [position='bottom-right'] - 表示位置
   */
  showToast(message, duration, type = "error", position = "bottom-right") {
    // 初期化チェック
    if (!this.toastContainer) {
      this.init();
    }

    // トースト要素を作成
    const toast = document.createElement("div");
    toast.className = `error-toast toast-${type}`;

    // アイコンを追加
    const icons = {
      success: "✓",
      error: "✕",
      info: "ℹ",
      warning: "⚠",
    };

    // スタイルを設定
    const colors = {
      success: "#4CAF50",
      error: "#f44336",
      info: "#2196F3",
      warning: "#FF9800",
    };

    toast.className = `error-toast toast-${type}`;

    // コンテンツを設定
    toast.innerHTML = `
      <span style="font-size: 20px; margin-right: 10px;">${
        icons[type] || icons.error
      }</span>
      <span style="flex: 1;">${this.escapeHtml(message)}</span>
    `;

    // クリックで閉じる
    toast.addEventListener("click", () => {
      this.dismissToast(toast);
    });

    // コンテナに追加
    this.toastContainer.appendChild(toast);

    // アニメーション開始
    requestAnimationFrame(() => {
      toast.style.transform = "translateX(0)";
    });

    // 自動削除タイマー
    const timer = setTimeout(() => {
      this.dismissToast(toast);
    }, duration);

    // ホバー時はタイマーを停止
    toast.addEventListener("mouseenter", () => clearTimeout(timer));
    toast.addEventListener("mouseleave", () => {
      setTimeout(() => this.dismissToast(toast), 1000);
    });
  },

  /**
   * トーストを削除
   * @param {HTMLElement} toast - トースト要素
   */
  dismissToast(toast) {
    toast.style.transform = "translateX(400px)";
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  },

  /**
   * インラインエラーを表示
   * @param {string} elementId - 要素のID
   * @param {string} message - エラーメッセージ
   */
  showInlineError(elementId, message) {
    const element = document.querySelector(elementId);
    if (!element) return;

    // 既存のエラーメッセージを削除
    const existingError = element.parentNode.querySelector(".error-message");
    if (existingError) {
      existingError.remove();
    }

    // エラーメッセージを作成
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      color: #f44336;
      font-size: 12px;
      margin-top: 4px;
      animation: fadeIn 0.3s ease-in;
    `;

    // 要素の後に挿入
    element.parentNode.insertBefore(errorDiv, element.nextSibling);

    // 一定時間後に自動削除
    setTimeout(() => {
      errorDiv.style.animation = "fadeOut 0.3s ease-out";
      setTimeout(() => errorDiv.remove(), 300);
    }, 5000);
  },

  /**
   * HTMLエスケープ
   * @param {string} text - エスケープするテキスト
   * @returns {string}
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * 非同期処理のエラーハンドリングラッパー
   * @param {Function} asyncFunc - 非同期関数
   * @param {string} context - エラーコンテキスト
   * @param {Object} [options] - オプション
   * @returns {Promise}
   */
  async handleAsync(asyncFunc, context, options = {}) {
    const {
      showLoading = false,
      notifyOnError = true,
      defaultValue = null,
      loadingMessage = "読み込み中...",
    } = options;

    let loadingElement = null;

    try {
      if (showLoading) {
        loadingElement = this.showLoading(true, loadingMessage);
      }

      const result = await asyncFunc();

      if (showLoading && loadingElement) {
        this.showLoading(false, "", loadingElement);
      }

      return result;
    } catch (error) {
      this.log(`Error in ${context}`, error);

      if (notifyOnError) {
        const userMessage = this.getUserFriendlyMessage(error, context);
        this.notify(userMessage, {
          type: this.NotificationType.TOAST,
          messageType: "error",
        });
      }

      if (showLoading && loadingElement) {
        this.showLoading(false, "", loadingElement);
      }

      return defaultValue;
    }
  },

  /**
   * ユーザーフレンドリーなエラーメッセージを生成
   * @param {Error} error - エラーオブジェクト
   * @param {string} context - エラーコンテキスト
   * @returns {string}
   */
  getUserFriendlyMessage(error, context) {
    // エラーメッセージのマッピング
    const messageMap = {
      "chrome.runtime.lastError":
        "拡張機能との通信でエラーが発生しました。ページを再読み込みしてください。",
      fetch:
        "ネットワークエラーが発生しました。インターネット接続を確認してください。",
      storage: "データの保存中にエラーが発生しました。",
      load: "データの読み込み中にエラーが発生しました。",
      permission: "必要な権限がありません。",
      timeout: "処理がタイムアウトしました。",
    };

    // エラーメッセージから適切なメッセージを検索
    for (const [key, message] of Object.entries(messageMap)) {
      if (error.message?.includes(key) || context.includes(key)) {
        return message;
      }
    }

    // デフォルトメッセージ
    return `処理中にエラーが発生しました: ${context}`;
  },

  /**
   * ローディング表示の制御
   * @param {boolean} show - 表示/非表示
   * @param {string} [message] - ローディングメッセージ
   * @param {HTMLElement} [existingElement] - 既存のローディング要素
   * @returns {HTMLElement|null}
   */
  showLoading(show, message = "読み込み中...", existingElement = null) {
    if (show) {
      // 既存の要素があれば再利用
      let overlay =
        existingElement || document.getElementById("loading-overlay");

      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "loading-overlay";
        overlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
        `;

        const spinner = document.createElement("div");
        spinner.style.cssText = `
          color: #fff;
          font-size: 18px;
          background: rgba(0, 0, 0, 0.8);
          padding: 20px 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 15px;
        `;

        // スピナーアニメーション
        spinner.innerHTML = `
          <div class="spinner" style="
            width: 24px;
            height: 24px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top-color: #fff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          "></div>
          <span>${this.escapeHtml(message)}</span>
        `;

        overlay.appendChild(spinner);
        document.body.appendChild(overlay);

        // CSSアニメーション
        const style = document.createElement("style");
        style.textContent = `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }
        `;
        document.head.appendChild(style);

        // フェードイン
        requestAnimationFrame(() => {
          overlay.style.opacity = "1";
        });
      }

      return overlay;
    } else {
      const overlay =
        existingElement || document.getElementById("loading-overlay");
      if (overlay) {
        overlay.style.opacity = "0";
        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        }, 300);
      }
      return null;
    }
  },

  /**
   * 入力検証エラーのハンドリング
   * @param {Object} validationResult - 検証結果
   * @param {Object} fieldMapping - フィールドとIDのマッピング
   */
  handleValidationErrors(validationResult, fieldMapping) {
    // 既存のエラーをクリア
    document.querySelectorAll(".error-message").forEach((el) => el.remove());
    document.querySelectorAll(".error-highlight").forEach((el) => {
      el.classList.remove("error-highlight");
      el.style.borderColor = "";
    });

    if (!validationResult.isValid) {
      validationResult.errors.forEach((error) => {
        const elementId = fieldMapping[error.field];
        if (elementId) {
          const element = document.querySelector(elementId);
          if (element) {
            element.classList.add("error-highlight");
            element.style.borderColor = "#f44336";
            this.showInlineError(elementId, error.message);
          }
        }
      });
    }
  },

  /**
   * デバッグモードの設定
   * @param {boolean} enabled - デバッグモードの有効/無効
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    if (enabled) {
      this.notify("デバッグモードが有効になりました", {
        type: this.NotificationType.TOAST,
        messageType: "info",
        duration: 2000,
      });
    }
  },

  /**
   * エラーログをエクスポート
   * @returns {string} エラーログのJSON文字列
   */
  exportLogs() {
    try {
      const logs = localStorage.getItem("errorLogs") || "[]";
      return logs;
    } catch (error) {
      return "[]";
    }
  },

  /**
   * エラーログをクリア
   */
  clearLogs() {
    localStorage.removeItem("errorLogs");
    this.notify("エラーログをクリアしました", {
      type: this.NotificationType.TOAST,
      messageType: "success",
      duration: 2000,
    });
  },

  /**
   * エラー統計を取得
   * @returns {Object} エラー統計
   */
  getErrorStats() {
    try {
      const logs = JSON.parse(localStorage.getItem("errorLogs") || "[]");
      const stats = {
        total: logs.length,
        byLevel: {},
        recent: logs.slice(-10),
      };

      // レベル別集計
      logs.forEach((log) => {
        stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      });

      return stats;
    } catch (error) {
      return { total: 0, byLevel: {}, recent: [] };
    }
  },
};

// 初期化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => ErrorHandler.init());
} else {
  ErrorHandler.init();
}

// グローバルに公開
if (typeof window !== "undefined") {
  window.ErrorHandler = ErrorHandler;
}
