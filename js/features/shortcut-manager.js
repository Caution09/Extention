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
    const modal = document.getElementById("shortcut-help-modal");
    if (!modal) return;

    // モーダルの表示/非表示を切り替え
    if (modal.style.display === "none" || !modal.style.display) {
      modal.style.display = "flex";

      // 閉じるボタンのイベントリスナー
      const closeBtn = document.getElementById("close-help");
      if (closeBtn) {
        closeBtn.onclick = () => {
          modal.style.display = "none";
        };
      }

      // 背景クリックで閉じる
      modal.onclick = (e) => {
        if (e.target === modal) {
          modal.style.display = "none";
        }
      };
    } else {
      modal.style.display = "none";
    }
  }
}

// グローバルに公開
if (typeof window !== "undefined") {
  window.ShortcutManager = ShortcutManager;
}
