let promptTabele = [];
let selectedTextForArchive = ""; // 選択されたテキストを一時保存

// 初期化時にコンテキストメニューを作成
chrome.runtime.onInstalled.addListener(() => {
  createBaseMenuItems();
});

// ベースとなるメニュー項目を作成
function createBaseMenuItems() {
  // 既存のメニューをすべてクリア
  chrome.contextMenus.removeAll(() => {
    // プロンプトを記録するメニュー
    chrome.contextMenus.create({
      id: "PromptArchive",
      title: "プロンプトを記録する",
      contexts: ["selection"],
    });

    // 記録済みプロンプトの親メニュー
    chrome.contextMenus.create({
      id: "LoadPrompt",
      title: "記録済みプロンプト",
      contexts: ["editable"],
    });

    // 初期のアーカイブリストを作成
    CreateArchiveList();
  });
}

// コンテキストメニューのクリックイベント
chrome.contextMenus.onClicked.addListener(async function (info, tab) {
  console.log("Context menu clicked:", info.menuItemId);

  switch (info.menuItemId) {
    case "LoadPrompt":
      // 読み込みプロンプトの親なだけなので特に処理はしない
      break;
    case "PromptArchive":
      handlePromptArchive(info);
      break;
    // コンテキストメニューのクリックイベント（該当部分のみ）
    default:
      // プロンプトを挿入
      console.log("Inserting prompt:", info.menuItemId);

      // まずポップアップへの送信を試みる
      chrome.runtime.sendMessage(
        {
          type: "insertPrompt",
          text: info.menuItemId,
        },
        (response) => {
          // ポップアップが応答しない場合は、通常のページへの挿入を試みる
          if (!response || !response.success) {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              function: (text) => {
                document.execCommand("insertText", false, text);
              },
              args: [info.menuItemId],
            });
          }
        }
      );
      break;
  }
});

// プロンプトアーカイブ処理
function handlePromptArchive(info) {
  const selectedText = info.selectionText;
  selectedTextForArchive = selectedText; // 選択テキストを保存

  chrome.storage.local.get(["archivesList"], function (items) {
    let archivesList = items.archivesList || [];
    const matchedIndex = archivesList.findIndex(
      (obj) => obj.prompt === selectedText
    );

    if (matchedIndex !== -1) {
      // 既に存在する場合はエラー表示
      chrome.windows.create({
        url: "error.html",
        type: "popup",
        width: 300,
        height: 50,
      });
    } else {
      // 新規追加用のポップアップを表示
      chrome.windows.create({
        url: "prompt.html",
        type: "popup",
        width: 300,
        height: 50,
      });
    }
  });
}

// メッセージリスナー（一つに統合）
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message.type);

  // promptResponse の処理を async/await で修正
  if (message.type === "promptResponse") {
    handlePromptResponse(message.text)
      .then(() => {
        console.log("Prompt response handled successfully");
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error("Error in promptResponse:", error);
        sendResponse({ success: false, error: error.message });
      });

    // 非同期レスポンスのためにtrueを返す
    return true;
  }

  // 他のメッセージタイプの処理
  switch (message.type) {
    case "openWindow":
      chrome.windows.create({
        url: chrome.runtime.getURL("popup.html"),
        type: message.windowType === "normal" ? "popup" : message.windowType,
        width: 400,
        height: 800,
      });
      sendResponse({ success: true });
      break;

    case "openPage":
      chrome.tabs.create({
        url: chrome.runtime.getURL("popup.html"),
      });
      sendResponse({ success: true });
      break;

    case "UpdatePromptList":
      UpdatePromptList().then(() => {
        sendResponse({ text: "バックグラウンド処理の終了", success: true });
      });
      return true; // 非同期レスポンス

    case "DOM":
      handleDOMOperation(message.args);
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ success: false, error: "Unknown message type" });
      break;
  }
});

// プロンプトレスポンス処理
async function handlePromptResponse(promptName) {
  try {
    console.log("handlePromptResponse called with:", promptName);
    console.log("Saved selected text:", selectedTextForArchive);

    const items = await chrome.storage.local.get(["archivesList"]);
    let archivesList = items.archivesList || [];

    // 保存された選択テキストを使用
    const selectedText = selectedTextForArchive;

    if (selectedText && promptName) {
      archivesList.push({ title: promptName, prompt: selectedText });
      await chrome.storage.local.set({ archivesList: archivesList });

      // テキストをクリア
      selectedTextForArchive = "";

      // プロンプトリストを更新
      await UpdatePromptList();

      console.log("Archive saved successfully");
    }
  } catch (error) {
    console.error("Error handling prompt response:", error);
  }
}

// プロンプトリストの更新
async function UpdatePromptList() {
  try {
    console.log("UpdatePromptList called");

    // 既存のプロンプト関連メニューを削除
    const removePromises = promptTabele.map(
      (id) =>
        new Promise((resolve) => {
          chrome.contextMenus.remove(id, () => {
            // エラーを無視（アイテムが既に存在しない場合）
            chrome.runtime.lastError;
            resolve();
          });
        })
    );

    await Promise.all(removePromises);
    promptTabele = [];

    // 少し待機してから新しいリストを作成（ストレージの読み込みを確実にするため）
    setTimeout(async () => {
      await CreateArchiveList();
      console.log("Archive list recreated with", promptTabele.length, "items");
    }, 100);
  } catch (error) {
    console.error("Error updating prompt list:", error);
  }
}

// アーカイブリストからコンテキストメニューを作成
async function CreateArchiveList() {
  try {
    const items = await chrome.storage.local.get(["archivesList"]);

    if (items.archivesList && items.archivesList.length > 0) {
      let count = 1;
      const existingIds = new Set();

      for (const item of items.archivesList) {
        // 重複チェック
        if (existingIds.has(item.prompt)) {
          console.warn(`Duplicate prompt id: ${item.prompt}`);
          continue;
        }

        existingIds.add(item.prompt);

        try {
          await new Promise((resolve, reject) => {
            chrome.contextMenus.create(
              {
                parentId: "LoadPrompt",
                id: item.prompt,
                title: `${count}: ${item.title || "無題"}`,
                contexts: ["editable"],
              },
              () => {
                if (chrome.runtime.lastError) {
                  console.error(
                    "Menu creation error:",
                    chrome.runtime.lastError
                  );
                  reject(chrome.runtime.lastError);
                } else {
                  promptTabele.push(item.prompt);
                  resolve();
                }
              }
            );
          });
          count++;
        } catch (error) {
          console.error(
            `Failed to create menu item for: ${item.prompt}`,
            error
          );
        }
      }
    }
  } catch (error) {
    console.error("Error creating archive list:", error);
  }
}

// DOM操作処理
function handleDOMOperation(args) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab) return;

    console.log("Current tab:", tab.url);

    switch (tab.url) {
      case "http://127.0.0.1:7860/":
        console.log("StableDiffusionRequest");
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: StableDiffusion,
          args: [args],
        });
        break;

      case "https://novelai.net/image":
        console.log("NovelAIRequest");
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: NovelAI,
          args: [args],
        });
        break;

      default:
        console.log("No matching site for DOM operation");
        break;
    }
  });
}

// DOM処理関数
function StableDiffusion(args) {
  // StableDiffusion用の処理
  console.log("StableDiffusion DOM operation", args);
}

function NovelAI(args) {
  console.log("NovelAI DOM operation", args);

  const [
    service,
    method,
    value,
    positivePromptSelector,
    generateButtonSelector,
  ] = args;

  switch (method) {
    case "Generate":
      const positivePromptText = document.querySelector(positivePromptSelector);
      const generateButton = document.querySelector(generateButtonSelector);

      if (positivePromptText && generateButton) {
        // デバッグ情報
        console.log("Setting prompt to:", value);
        console.log("Element type:", positivePromptText.tagName);

        // 元のコードを維持
        positivePromptText.value = value;
        positivePromptText.innerHTML = value;
        const event = new Event("change", { bubbles: true });
        positivePromptText.dispatchEvent(event);

        // 100～200msのランダムな遅延
        const randomDelay = Math.floor(Math.random() * 101) + 100; // 100-200の範囲
        console.log(`Waiting ${randomDelay}ms before clicking generate...`);

        setTimeout(() => {
          generateButton.click();
        }, randomDelay);
      }
      break;
  }
}
