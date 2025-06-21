/**
 * Chrome Storage APIのラッパーモジュール
 * 非同期処理を統一し、エラーハンドリングを一元化
 */
const Storage = {
  /**
   * ストレージから値を取得
   * @param {string|string[]} keys - 取得するキー（文字列または配列）
   * @returns {Promise<Object>} - 取得した値のオブジェクト
   */
  async get(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
  },

  /**
   * ストレージに値を保存
   * @param {Object} items - 保存するキーと値のオブジェクト
   * @returns {Promise<void>}
   */
  async set(items) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(items, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * ストレージから値を削除
   * @param {string|string[]} keys - 削除するキー（文字列または配列）
   * @returns {Promise<void>}
   */
  async remove(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(keys, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * ストレージをクリア
   * @returns {Promise<void>}
   */
  async clear() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * 特定のキーが存在するかチェック
   * @param {string} key - チェックするキー
   * @returns {Promise<boolean>}
   */
  async has(key) {
    const result = await this.get(key);
    return result.hasOwnProperty(key);
  },

  /**
   * ストレージの使用量を取得
   * @returns {Promise<{bytesInUse: number}>}
   */
  async getBytesInUse(keys = null) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.getBytesInUse(keys, (bytesInUse) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve({ bytesInUse });
        }
      });
    });
  }
};

// エクスポート（ES6モジュールをサポートしない環境用）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Storage;
}