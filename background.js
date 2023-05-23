// background.js

let promptTabele = []
chrome.contextMenus.create({
    id: "PromptArchive",
    title: "プロンプトを記録する",
    contexts: ["selection"],
});

chrome.contextMenus.create({
    id: "LoadPrompt",
    title: "記録済みプロンプト",
    contexts: ["editable"]
});

chrome.contextMenus.create({
    parentId: "LoadPrompt",
    id: "UpdateList",
    title: "一覧の更新",
    contexts: ["all"],
});

CreateArchiveList();

function CreateArchiveList(){
    chrome.storage.local.get(["archivesList"], function(items) {
        if (items.archivesList) {
            let count = 1
            items.archivesList.forEach(item=>{
                console.log(item)
                if(promptTabele.includes(item.prompt)){
                    return   
                }
                let context = chrome.contextMenus.create({
                    parentId: "LoadPrompt",
                    id: item.prompt,
                    title: count.toString()+":"+item.title,
                    contexts: ["all"],
                });
                promptTabele.push(context)
                count++
            })
        }
    });
}

chrome.contextMenus.onClicked.addListener(function(info, tab) {
    switch (info.menuItemId) {
        case "LoadPrompt":
            break
        case "PromptArchive":
            const selectedText = info.selectionText;
            console.log(info);
            chrome.windows.create({
                url: "prompt.html",
                type: "popup",
                width: 300,
                height: 50,
            }, (popupWindow) => {
                    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                    if (message.type === "promptResponse" && message.text) {
                        chrome.storage.local.get(["archivesList"], function(items) {
                            let archivesList = [];
                            let pushData = {title: message.text, prompt: selectedText};
                            if (items.archivesList) {
                                archivesList = items.archivesList;
                                archivesList.push(pushData);
                            } else {
                                archivesList = [pushData];
                            }
                            chrome.storage.local.set({archivesList: archivesList}, function() {
                            });
                        });
                    }
                });
            });
            break
        case "UpdateList":
            promptTabele.forEach(element => {
                chrome.contextMenus.remove(element, function() {});
            })
            promptTabele = []
            CreateArchiveList();
            break;
        default:
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              function: (text) => {
                document.execCommand("insertText", false, text);
              },
              args: [info.menuItemId],
            });
            break;
    }
  }
);