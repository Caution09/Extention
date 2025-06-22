let promptTabele = [];

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
    default:
      // プロンプトを挿入
      console.log("Inserting prompt:", info.menuItemId);

      // IDからプロンプトテキストを取得
      const menuItem = promptTabele.find((item) => item.id === info.menuItemId);
      const promptText = menuItem ? menuItem.prompt : info.menuItemId;

      // まずポップアップへの送信を試みる
      chrome.runtime.sendMessage(
        {
          type: "insertPrompt",
          text: promptText,
        },
        (response) => {
          // ポップアップが応答しない場合は、通常のページへの挿入を試みる
          if (!response || !response.success) {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              function: (text) => {
                document.execCommand("insertText", false, text);
              },
              args: [promptText],
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

  chrome.storage.local.get(["archivesList"], function (items) {
    let archivesList = items.archivesList || [];
    const matchedIndex = archivesList.findIndex(
      (obj) => obj.prompt === selectedText
    );

    if (matchedIndex !== -1) {
      // 既に存在する場合は通知を表示
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        sendNotificationToTab(
          tabs[0].id,
          "このプロンプトは既に保存されています",
          "warning"
        );
      });
    } else {
      // 新規追加（ポップアップなしで即座に保存）
      archivesList.push({
        title: "", // タイトルは後で編集可能
        prompt: selectedText,
      });

      chrome.storage.local.set({ archivesList: archivesList }, () => {
        // プロンプトリストを更新
        UpdatePromptList();

        // 成功通知
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          sendNotificationToTab(
            tabs[0].id,
            "プロンプトを辞書に保存しました",
            "success"
          );
        });
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

// プロンプトリストの更新
async function UpdatePromptList() {
  try {
    console.log("UpdatePromptList called");

    // 既存のプロンプト関連メニューを削除
    const removePromises = promptTabele.map(
      (item) =>
        new Promise((resolve) => {
          chrome.contextMenus.remove(item.id, () => {
            // item.idを使用
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

      for (let index = 0; index < items.archivesList.length; index++) {
        const item = items.archivesList[index];

        try {
          // インデックスベースの一意なIDを使用
          const menuId = `archive_${index}_${Date.now()}`;

          await new Promise((resolve, reject) => {
            chrome.contextMenus.create(
              {
                parentId: "LoadPrompt",
                id: menuId, // 一意なIDを使用
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
                  // プロンプトテキストとIDの対応を保存
                  promptTabele.push({
                    id: menuId,
                    prompt: item.prompt,
                  });
                  resolve();
                }
              }
            );
          });
          count++;
        } catch (error) {
          console.error(
            `Failed to create menu item for index ${index}:`,
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

// ショートカットキーのリスナーを修正
chrome.commands.onCommand.addListener(async (command) => {
  console.log("Command received:", command);

  switch (command) {
    case "_execute_action": // Alt+G でこれが呼ばれる
      // サイドパネルを開く
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        await chrome.sidePanel.open({ tabId: tabs[0].id });
      });
      break;
    case "save-prompt":
      // アクティブタブから選択テキストを取得
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        try {
          // コンテンツスクリプトを実行して選択テキストを取得
          const [result] = await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => window.getSelection().toString().trim(),
          });

          const selectedText = result.result;

          if (!selectedText) {
            // 選択テキストがない場合は、従来の動作（ストレージから取得）
            const { generatePrompt } = await chrome.storage.local.get(
              "generatePrompt"
            );
            if (generatePrompt) {
              await saveToArchive(generatePrompt, tabs[0].id);
            } else {
              sendNotificationToTab(
                tabs[0].id,
                "保存するテキストを選択してください",
                "warning"
              );
            }
          } else {
            // 選択テキストを辞書に保存
            await saveToArchive(selectedText, tabs[0].id);
          }
        } catch (error) {
          console.error("Failed to get selection:", error);
          sendNotificationToTab(
            tabs[0].id,
            "このページでは使用できません",
            "error"
          );
        }
      });
      break;
  }
});

// アーカイブに保存する関数
async function saveToArchive(text, tabId) {
  const { archivesList } = await chrome.storage.local.get("archivesList");
  const archives = archivesList || [];

  // 重複チェック
  const isDuplicate = archives.some((item) => item.prompt === text);

  if (isDuplicate) {
    sendNotificationToTab(
      tabId,
      "このテキストは既に保存されています",
      "warning"
    );
  } else {
    // 新規保存
    archives.push({
      title: "", // タイトルは後で編集可能
      prompt: text,
    });

    await chrome.storage.local.set({ archivesList: archives });

    // プロンプトリストを更新
    UpdatePromptList();

    sendNotificationToTab(tabId, "選択テキストを辞書に保存しました", "success");
  }
}

// タブに通知を送信する関数
function sendNotificationToTab(tabId, message, type) {
  chrome.tabs
    .sendMessage(tabId, {
      type: "showNotification",
      message: message,
      messageType: type,
    })
    .catch((error) => {
      // content-scriptが注入されていない場合は、簡易的なアラート
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (msg) => alert(msg),
        args: [message],
      });
    });
}

// コンテンツスクリプトを注入する関数
async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["js/content-script.js"],
    });
  } catch (error) {
    console.log("Content script already injected or not injectable");
  }
}

// タブがアクティブになったときにコンテンツスクリプトを注入
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await injectContentScript(activeInfo.tabId);
});

// 拡張機能アイコンクリック時の動作も変更可能
chrome.action.onClicked.addListener(async (tab) => {
  // サイドパネルを開く
  await chrome.sidePanel.open({ tabId: tab.id });
});
