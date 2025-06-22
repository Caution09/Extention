/**
 * content-script.js - ページ内でのクリップボード操作用
 */

// バックグラウンドからのメッセージを受信
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "copyToClipboard") {
    // クリップボードにコピー
    navigator.clipboard
      .writeText(message.text)
      .then(() => {
        console.log("Copied to clipboard:", message.text);
        // トースト通知を表示
        showToast("プロンプトをコピーしました");
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error("Failed to copy:", error);
        sendResponse({ success: false, error: error.message });
      });

    // 非同期レスポンスのため true を返す
    return true;
  }
});

// シンプルなトースト通知
function showToast(message) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 12px 24px;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;

  // アニメーション用のスタイル
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(toast);

  // 3秒後に削除
  setTimeout(() => {
    toast.style.animation = "slideIn 0.3s ease-out reverse";
    setTimeout(() => {
      toast.remove();
      style.remove();
    }, 300);
  }, 3000);
}
