// content.js に追加
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "checkSelector") {
    try {
      const element = document.querySelector(message.selector);
      const exists = element !== null;

      sendResponse({
        exists: exists,
        selector: message.selector,
        elementType: exists ? element.tagName : null,
      });
    } catch (error) {
      // セレクターが無効な場合
      sendResponse({
        exists: false,
        selector: message.selector,
        error: error.message,
      });
    }
    return true; // 非同期レスポンスのため
  }
});
