/**
 * エラーハンドリングモジュール
 * アプリケーション全体のエラー処理を統一
 */
const ErrorHandler = {
  /**
   * エラーレベルの定義
   */
  Level: {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical'
  },

  /**
   * ユーザーへの通知方法
   */
  NotificationType: {
    NONE: 'none',
    CONSOLE: 'console',
    ALERT: 'alert',
    TOAST: 'toast',
    INLINE: 'inline'
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
      error: error ? {
        message: error.message,
        stack: error.stack
      } : null
    };

    switch (level) {
      case this.Level.INFO:
        console.log(`[${timestamp}] INFO:`, message);
        break;
      case this.Level.WARNING:
        console.warn(`[${timestamp}] WARNING:`, message);
        break;
      case this.Level.ERROR:
      case this.Level.CRITICAL:
        console.error(`[${timestamp}] ${level.toUpperCase()}:`, message, error);
        break;
    }

    // 将来的にはリモートロギングサービスに送信することも可能
    this.saveToLocalStorage(logEntry);
  },

  /**
   * エラーログをローカルストレージに保存
   * @param {Object} logEntry - ログエントリ
   */
  saveToLocalStorage(logEntry) {
    try {
      const logs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      logs.push(logEntry);
      
      // 最新の100件のみ保持
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem('errorLogs', JSON.stringify(logs));
    } catch (e) {
      // ローカルストレージが満杯の場合は古いログを削除
      localStorage.removeItem('errorLogs');
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
      elementId = null
    } = options;

    switch (type) {
      case this.NotificationType.ALERT:
        window.alert(message);
        break;
        
      case this.NotificationType.TOAST:
        this.showToast(message, duration);
        break;
        
      case this.NotificationType.INLINE:
        if (elementId) {
          this.showInlineError(elementId, message);
        }
        break;
        
      case this.NotificationType.CONSOLE:
        console.log('User notification:', message);
        break;
    }
  },

  /**
   * トースト通知を表示
   * @param {string} message - メッセージ
   * @param {number} duration - 表示時間（ミリ秒）
   */
  showToast(message, duration) {
    // 既存のトーストを削除
    $('.error-toast').remove();
    
    const $toast = $('<div>')
      .addClass('error-toast')
      .text(message)
      .css({
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: '#f44336',
        color: 'white',
        padding: '16px',
        borderRadius: '4px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        zIndex: 10000,
        maxWidth: '300px'
      });
    
    $('body').append($toast);
    
    setTimeout(() => {
      $toast.fadeOut(300, () => $toast.remove());
    }, duration);
  },

  /**
   * インラインエラーを表示
   * @param {string} elementId - 要素のID
   * @param {string} message - エラーメッセージ
   */
  showInlineError(elementId, message) {
    const $element = $(elementId);
    
    // 既存のエラーメッセージを削除
    $element.siblings('.error-message').remove();
    
    const $error = $('<div>')
      .addClass('error-message')
      .text(message)
      .css({
        color: '#f44336',
        fontSize: '12px',
        marginTop: '4px'
      });
    
    $element.after($error);
    
    // 一定時間後に自動的に削除
    setTimeout(() => {
      $error.fadeOut(300, () => $error.remove());
    }, 5000);
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
      defaultValue = null
    } = options;

    try {
      if (showLoading) {
        this.showLoading(true);
      }
      
      const result = await asyncFunc();
      
      if (showLoading) {
        this.showLoading(false);
      }
      
      return result;
    } catch (error) {
      this.log(`Error in ${context}`, error);
      
      if (notifyOnError) {
        const userMessage = this.getUserFriendlyMessage(error, context);
        this.notify(userMessage, { type: this.NotificationType.TOAST });
      }
      
      if (showLoading) {
        this.showLoading(false);
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
    // Chrome拡張機能特有のエラー
    if (error.message?.includes('chrome.runtime.lastError')) {
      return '拡張機能との通信でエラーが発生しました。ページを再読み込みしてください。';
    }
    
    // ネットワークエラー
    if (error.message?.includes('fetch')) {
      return 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
    }
    
    // ストレージエラー
    if (context.includes('storage') || context.includes('save')) {
      return 'データの保存中にエラーが発生しました。';
    }
    
    if (context.includes('load')) {
      return 'データの読み込み中にエラーが発生しました。';
    }
    
    // デフォルトメッセージ
    return `処理中にエラーが発生しました: ${context}`;
  },

  /**
   * ローディング表示の制御
   * @param {boolean} show - 表示/非表示
   */
  showLoading(show) {
    if (show) {
      if ($('#loading-overlay').length === 0) {
        const $overlay = $('<div id="loading-overlay">')
          .css({
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          });
        
        const $spinner = $('<div>')
          .css({
            color: '#fff',
            fontSize: '24px'
          })
          .text('読み込み中...');
        
        $overlay.append($spinner);
        $('body').append($overlay);
      }
    } else {
      $('#loading-overlay').fadeOut(200, function() {
        $(this).remove();
      });
    }
  },

  /**
   * 入力検証エラーのハンドリング
   * @param {Object} validationResult - 検証結果
   * @param {Object} fieldMapping - フィールドとIDのマッピング
   */
  handleValidationErrors(validationResult, fieldMapping) {
    // 既存のエラーをクリア
    $('.error-message').remove();
    $('.error-highlight').removeClass('error-highlight');
    
    if (!validationResult.isValid) {
      validationResult.errors.forEach(error => {
        const elementId = fieldMapping[error.field];
        if (elementId) {
          $(elementId)
            .addClass('error-highlight')
            .css('border-color', '#f44336');
          
          this.showInlineError(elementId, error.message);
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
      console.log('Debug mode enabled - verbose logging active');
    }
  },

  /**
   * エラーログをエクスポート
   * @returns {string} エラーログのJSON文字列
   */
  exportLogs() {
    try {
      const logs = localStorage.getItem('errorLogs') || '[]';
      return logs;
    } catch (error) {
      return '[]';
    }
  },

  /**
   * エラーログをクリア
   */
  clearLogs() {
    localStorage.removeItem('errorLogs');
    console.log('Error logs cleared');
  }
};

// デフォルトのエラーハンドラーを設定
window.addEventListener('unhandledrejection', event => {
  ErrorHandler.log('Unhandled promise rejection', event.reason, ErrorHandler.Level.ERROR);
});

// グローバルに公開
if (typeof window !== 'undefined') {
  window.ErrorHandler = ErrorHandler;
}