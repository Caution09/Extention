/**
 * shortcut-manager.js - ポップアップ内のショートカットキー管理
 * Phase 6: 基本機能強化
 */

class ShortcutManager {
  constructor() {
    this.shortcuts = new Map();
    this.setupDefaultShortcuts();
  }

  /**
   * デフォルトのショートカットを設定
   */
  setupDefaultShortcuts() {
    // Ctrl+C: コピー（ブラウザのデフォルトと競合するため、フォーカス時のみ）
    this.register("c", { ctrl: true }, () => {
      const activeElement = document.activeElement;
      if (
        activeElement.tagName !== "INPUT" &&
        activeElement.tagName !== "TEXTAREA"
      ) {
        document.getElementById("copyButton")?.click();
      }
    });

    // Ctrl+S: 保存
    this.register("s", { ctrl: true }, (e) => {
      e.preventDefault(); // ブラウザの保存ダイアログを防ぐ
      document.getElementById("saveButton")?.click();
    });

    // Ctrl+K: 検索フォーカス
    this.register("k", { ctrl: true }, (e) => {
      e.preventDefault();
      const searchInput = document.getElementById("search");
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    });

    // Ctrl+E: 編集タブへ
    this.register("e", { ctrl: true }, (e) => {
      e.preventDefault();
      document.getElementById("editTab")?.click();
    });

    // Ctrl+D: 辞書タブへ
    this.register("d", { ctrl: true }, (e) => {
      e.preventDefault();
      document.getElementById("addTab")?.click();
    });

    // Escape: ポップアップを閉じる
    this.register("Escape", {}, () => {
      const popup = document.getElementById("popup");
      if (popup && popup.style.display !== "none") {
        popup.style.display = "none";
      }
    });

    // Escape: ポップアップを閉じる
    this.register("Escape", {}, () => {
      const popup = document.getElementById("popup");
      if (popup && popup.style.display !== "none") {
        popup.style.display = "none";
      }
    });

    // Tab: タブ間の移動
    this.register("Tab", {}, (e) => {
      if (e.shiftKey) return; // Shift+Tabは通常の動作

      const activeElement = document.activeElement;
      if (
        activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA"
      ) {
        return; // 入力中は通常のTab動作
      }

      e.preventDefault();
      const tabs = Array.from(document.querySelectorAll(".tab"));
      const currentIndex = tabs.findIndex((tab) =>
        tab.classList.contains("is-active")
      );
      const nextIndex = (currentIndex + 1) % tabs.length;
      tabs[nextIndex]?.click();
    });
  }

  /**
   * ショートカットを登録
   */
  register(key, modifiers, handler) {
    const shortcutKey = this.createShortcutKey(key, modifiers);
    this.shortcuts.set(shortcutKey, handler);
  }

  /**
   * ショートカットキーの文字列を生成
   */
  createShortcutKey(key, modifiers) {
    const parts = [];
    if (modifiers.ctrl) parts.push("Ctrl");
    if (modifiers.alt) parts.push("Alt");
    if (modifiers.shift) parts.push("Shift");
    parts.push(key);
    return parts.join("+");
  }

  /**
   * キーボードイベントからショートカットキーを生成
   */
  getShortcutFromEvent(event) {
    const modifiers = {
      ctrl: event.ctrlKey || event.metaKey, // MacのCommandキーも含む
      alt: event.altKey,
      shift: event.shiftKey,
    };
    return this.createShortcutKey(event.key, modifiers);
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
    document.addEventListener("keydown", (event) => {
      const shortcutKey = this.getShortcutFromEvent(event);
      const handler = this.shortcuts.get(shortcutKey);

      if (handler) {
        handler(event);
      }
    });

    // バックグラウンドからのショートカット実行メッセージ
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "executeShortcut") {
        switch (message.action) {
          case "save":
            document.getElementById("saveButton")?.click();
            break;
          case "copy":
            document.getElementById("copyButton")?.click();
            break;
        }
        sendResponse({ success: true });
      }
    });
  }

  /**
   * ショートカットヘルプを表示
   */
  showHelp() {
    // 既存のヘルプダイアログがあれば削除
    const existingHelp = document.getElementById("shortcut-help-modal");
    if (existingHelp) {
      existingHelp.remove();
      return;
    }

    const modal = document.createElement("div");
    modal.id = "shortcut-help-modal";
    modal.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10001;
      max-width: 400px;
    ">
      <h3 style="margin-top: 0;">ショートカットキー一覧</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 5px;"><kbd>Ctrl+S</kbd></td><td>プロンプトを保存</td></tr>
        <tr><td style="padding: 5px;"><kbd>Ctrl+C</kbd></td><td>プロンプトをコピー</td></tr>
        <tr><td style="padding: 5px;"><kbd>Ctrl+K</kbd></td><td>検索ボックスにフォーカス</td></tr>
        <tr><td style="padding: 5px;"><kbd>Ctrl+E</kbd></td><td>編集タブへ移動</td></tr>
        <tr><td style="padding: 5px;"><kbd>Ctrl+D</kbd></td><td>辞書タブへ移動</td></tr>
        <tr><td style="padding: 5px;"><kbd>Tab</kbd></td><td>次のタブへ移動</td></tr>
        <tr><td style="padding: 5px;"><kbd>Esc</kbd></td><td>ポップアップを閉じる</td></tr>
      </table>
    <h4>グローバルショートカット</h4>
    <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 5px;"><kbd>Alt+G</kbd></td><td>サイドパネルを開く</td></tr>
        <tr><td style="padding: 5px;"><kbd>Ctrl+Shift+S</kbd></td><td>選択テキストを辞書に保存</td></tr>
    </table>
      <button id="close-help" style="margin-top: 15px; width: 100%;">閉じる</button>
    </div>
  `;

    // 背景をクリックで閉じる
    modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 10000;
  `;

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    document.body.appendChild(modal);

    // 閉じるボタン
    document.getElementById("close-help").addEventListener("click", () => {
      modal.remove();
    });
  }
}

// グローバルに公開
if (typeof window !== "undefined") {
  window.ShortcutManager = ShortcutManager;
}
