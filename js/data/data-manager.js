/**
 * データ管理モジュール（完全リファクタリング版）
 * Storage APIラッパーとAppStateを使用した非同期処理の統一
 */

// ============================================
// プロンプト管理
// ============================================

/**
 * 現在のプロンプトを保存
 */
async function savePrompt() {
  try {
    console.log("Saving prompt:", editPrompt.prompt);
    await Storage.set({ generatePrompt: editPrompt.prompt });
  } catch (error) {
    console.error("Failed to save prompt:", error);
    throw error;
  }
}

/**
 * 保存されたプロンプトを読み込み
 */
async function loadPrompt() {
  try {
    const result = await Storage.get("generatePrompt");
    if (result.generatePrompt && result.generatePrompt !== editPrompt.prompt) {
      console.log("Loading saved prompt:", result.generatePrompt);
      InitGenaretePrompt(result.generatePrompt);
    }
  } catch (error) {
    console.error("Failed to load prompt:", error);
  }
}

// ============================================
// カテゴリー管理
// ============================================

/**
 * 検索カテゴリーを保存
 */
async function saveCategory() {
  try {
    await Storage.set({ searchCategory: AppState.data.searchCategory });
    console.log("Category saved:", AppState.data.searchCategory);
  } catch (error) {
    console.error("Failed to save category:", error);
    throw error;
  }
}

/**
 * 検索カテゴリーを読み込み
 */
async function loadCategory() {
  try {
    const result = await Storage.get("searchCategory");
    if (result.searchCategory) {
      AppState.data.searchCategory = result.searchCategory;
      setSeachCategory();
    }
  } catch (error) {
    console.error("Failed to load category:", error);
  }
}

// ============================================
// マスタープロンプト管理
// ============================================

/**
 * マスタープロンプトとバージョンを保存
 */
async function saveMasterPrompt() {
  try {
    await Storage.set({
      masterPrompts: AppState.data.masterPrompts,
      masterVersion: AppState.config.masterVersion,
    });
  } catch (error) {
    console.error("Failed to save master prompts:", error);
    throw error;
  }
}

/**
 * マスタープロンプトとバージョンを読み込み
 */
async function loadMasterPrompt() {
  try {
    const result = await Storage.get(["masterPrompts", "masterVersion"]);

    if (result.masterPrompts) {
      AppState.data.masterPrompts = result.masterPrompts;
    }

    if (result.masterVersion != null) {
      AppState.config.masterVersion = result.masterVersion;
    }
  } catch (error) {
    console.error("Failed to load master prompts:", error);
  }
}

// ============================================
// ツール情報管理
// ============================================

/**
 * ツール情報を保存
 */
async function saveToolInfo() {
  try {
    await Storage.set({ toolInfo: AppState.data.toolInfo });
  } catch (error) {
    console.error("Failed to save tool info:", error);
    throw error;
  }
}

/**
 * ツール情報を読み込みし、メッセージをロード
 */
async function loadToolInfo() {
  try {
    const result = await Storage.get("toolInfo");
    if (result.toolInfo) {
      AppState.data.toolInfo = result.toolInfo;
    }
    loadMessage(); // API通信を開始
  } catch (error) {
    console.error("Failed to load tool info:", error);
  }
}

// ============================================
// ローカルリスト管理
// ============================================

/**
 * ローカルプロンプトリストを保存し、カテゴリーを更新
 */
async function saveLocalList(updateCategories = true) {
  try {
    await Storage.set({ localPromptList: AppState.data.localPromptList });

    if (updateCategories) {
      debouncedCategoryUpdate();
    }
  } catch (error) {
    console.error("Failed to save local list:", error);
    throw error;
  }
}

/**
 * ローカルプロンプトリストを読み込み
 */
async function loadLocalList() {
  try {
    const result = await Storage.get("localPromptList");
    if (result.localPromptList) {
      AppState.data.localPromptList = result.localPromptList;
    }
  } catch (error) {
    console.error("Failed to load local list:", error);
  }
}

// ============================================
// アーカイブリスト管理
// ============================================

/**
 * アーカイブリストを読み込み
 */
async function loadArchivesList() {
  try {
    const result = await Storage.get("archivesList");
    if (result.archivesList) {
      AppState.data.archivesList = result.archivesList;
    }
  } catch (error) {
    console.error("Failed to load archives list:", error);
  }
}

/**
 * アーカイブリストを保存し、プロンプトリストを更新
 */
async function saveArchivesList() {
  try {
    await Storage.set({ archivesList: AppState.data.archivesList });
    UpdatePromptList();
  } catch (error) {
    console.error("Failed to save archives list:", error);
    throw error;
  }
}

// ============================================
// オプション管理
// ============================================

/**
 * オプションデータを保存
 */
async function saveOptionData() {
  try {
    await Storage.set({ optionData: AppState.userSettings.optionData });
  } catch (error) {
    console.error("Failed to save option data:", error);
    throw error;
  }
}

/**
 * オプションデータを読み込みし、UIを更新（jQuery削除版）
 */
async function loadOptionData() {
  try {
    const result = await Storage.get("optionData");

    if (result.optionData) {
      AppState.userSettings.optionData = result.optionData;

      const deleteCheck = document.getElementById("isDeleteCheck");
      if (deleteCheck) {
        deleteCheck.checked = AppState.userSettings.optionData.isDeleteCheck;
      }

      const deeplAuth = document.getElementById("DeeplAuth");
      if (deeplAuth) {
        deeplAuth.value = AppState.userSettings.optionData.deeplAuthKey || "";
      }
    } else {
      // デフォルト値を設定
      AppState.userSettings.optionData = {
        shaping: "SD",
        editType: "SELECT",
        isDeleteCheck: true,
        deeplAuthKey: "",
      };
    }

    console.log("Option data loaded:", AppState.userSettings.optionData);

    // UI更新ロジック
    await updateUIBasedOnCurrentTab();
  } catch (error) {
    console.error("Failed to load option data:", error);
  }
}

/**
 * 現在のタブに基づいてUIを更新（jQuery削除版）
 */
async function updateUIBasedOnCurrentTab() {
  return new Promise((resolve) => {
    const uiTypeButtons = document.querySelectorAll('[name="UIType"]');
    const editTypeButtons = document.querySelectorAll('[name="EditType"]');

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentUrl = tabs[0].url;

      // URLに基づいて整形タイプを設定
      if (currentUrl === "http://127.0.0.1:7860/") {
        AppState.userSettings.optionData.shaping = "SD";
      } else if (currentUrl === "https://novelai.net/image") {
        AppState.userSettings.optionData.shaping = "NAI";
      }

      editPrompt.generate();
      UpdateGenaretePrompt();
      console.log("Current URL:", currentUrl);

      switch (AppState.userSettings.optionData.shaping) {
        case "SD":
          if (uiTypeButtons[0]) uiTypeButtons[0].checked = true;
          break;
        case "NAI":
          if (uiTypeButtons[1]) uiTypeButtons[1].checked = true;
          break;
        case "None":
          if (uiTypeButtons[2]) uiTypeButtons[2].checked = true;
          break;
      }

      switch (AppState.userSettings.optionData.editType) {
        case "SELECT":
          if (editTypeButtons[0]) editTypeButtons[0].checked = true;
          break;
        case "TEXT":
          if (editTypeButtons[1]) editTypeButtons[1].checked = true;
          break;
      }

      resolve();
    });
  });
}
// ============================================
// ユーティリティ関数
// ============================================

/**
 * JSONファイルをダウンロード
 * @param {Object} json - ダウンロードするデータ
 * @param {string} fileName - ファイル名（拡張子なし）
 */
function jsonDownload(json, fileName) {
  const outJson = {
    dicType: fileName,
    data: json,
  };

  const jsonString = JSON.stringify(outJson, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.json`;
  link.click();

  // メモリリークを防ぐためにURLを解放
  URL.revokeObjectURL(url);
}

/**
 * バックグラウンドスクリプトにプロンプトリスト更新を通知
 */
function UpdatePromptList() {
  // コンテキストが無効な場合はスキップ
  if (!chrome.runtime || !chrome.runtime.id) {
    console.warn("Extension context is invalid. Skipping UpdatePromptList.");
    return;
  }

  // メッセージを送信してコールバックで結果を確認
  try {
    chrome.runtime.sendMessage(
      { type: "UpdatePromptList" },
      function (response) {
        if (chrome.runtime.lastError) {
          // コンテキスト無効化エラーは警告のみ
          if (
            chrome.runtime.lastError.message.includes("context invalidated")
          ) {
            console.warn("Context invalidated during UpdatePromptList");
          } else {
            console.error(
              "Failed to update prompt list:",
              chrome.runtime.lastError.message
            );
          }
        } else if (response && response.success) {
          console.log("Prompt list updated successfully");
        }
      }
    );
  } catch (error) {
    console.warn("UpdatePromptList failed:", error);
  }
}

/**
 * バックグラウンドスクリプトにメッセージを送信
 * @param {string} execType - 実行タイプ
 * @param {*} value - 送信する値
 */
function sendBackground(execType, value) {
  // メッセージ形式を統一
  const message = { type: execType };

  // 必要に応じてargsを追加
  if (value !== null && value !== undefined) {
    message.args = Array.isArray(value) ? value : [value];
  }

  chrome.runtime.sendMessage(message, function (response) {
    if (chrome.runtime.lastError) {
      // エラーが発生してもアプリケーションは継続
      console.error("Runtime error:", chrome.runtime.lastError.message);
    } else if (response && response.success) {
      console.log("Background operation successful:", execType);
      if (response.text) {
        console.log("Response:", response.text);
      }
    } else if (response && !response.success) {
      console.error("Background operation failed:", response.error);
    }
  });
}

// ============================================
// 要素の登録・管理
// ============================================

/**
 * 新しいプロンプト要素を登録
 * @param {string} big - 大カテゴリー
 * @param {string} middle - 中カテゴリー
 * @param {string} small - 小カテゴリー
 * @param {string} prompt - プロンプト文字列
 * @param {string} [url] - 画像URL（オプション）
 * @returns {boolean} 登録成功の可否
 */
function Regist(big, middle, small, prompt, url) {
  const inputData = prompt + big + middle + small;
  const isDuplicate = AppState.data.localPromptList.some((item) => {
    const itemData = item.prompt + item.data[0] + item.data[1] + item.data[2];
    return inputData === itemData;
  });

  if (isDuplicate) {
    window.alert("既に同じ要素が追加されています。");
    return false;
  }

  const newItem = {
    prompt: prompt,
    data: { 0: big, 1: middle, 2: small },
  };

  if (url) {
    newItem.url = url;
  }

  AppState.data.localPromptList.push(newItem);
  saveLocalList();

  // APIに登録を通知
  RegistAPI(big, middle, small, prompt);

  return true;
}

/**
 * 辞書から要素を登録
 * @param {Object} item - 登録する要素
 * @returns {boolean} 登録成功の可否
 */
function RegistDic(item, skipSave = false) {
  const inputData = item.prompt + item.data[0] + item.data[1] + item.data[2];
  const isDuplicate = AppState.data.localPromptList.some((listItem) => {
    const listItemData =
      listItem.prompt + listItem.data[0] + listItem.data[1] + listItem.data[2];
    return inputData === listItemData;
  });

  if (!isDuplicate) {
    const newItem = {
      prompt: item.prompt,
      data: item.data,
    };

    if (item.url) {
      newItem.url = item.url;
    }

    AppState.data.localPromptList.push(newItem);

    if (!skipSave) {
      saveLocalList();
    }

    return true;
  }

  return false;
}

// ============================================
// 検索機能
// ============================================

/**
 * プロンプトを検索
 * @param {string} search - 検索キーワード
 * @param {Array} data - カテゴリーフィルター
 * @returns {Array} 検索結果
 */
function Search(search, data) {
  // ローカルとマスターのプロンプトを結合
  const prompts = [
    ...AppState.data.localPromptList,
    ...AppState.data.masterPrompts,
  ];
  let filtered = prompts;

  // カテゴリーでフィルタリング
  if (data[0] !== "") {
    data
      .filter((value) => value !== null && value !== "") // 空文字も除外
      .forEach((value, index) => {
        filtered = filtered.filter((item) => item.data[index] === value);
      });
  }

  // キーワード検索
  const searchResults = filtered.filter((item) => {
    const searchTarget = (
      item.data[0] +
      item.data[1] +
      item.data[2] +
      item.prompt
    ).toLowerCase();
    return searchTarget.includes(search.toLowerCase());
  });

  return searchResults;
}

/**
 * ローカル要素のインデックスを取得
 * @param {Object} searchItem - 検索する要素
 * @returns {number} インデックス（見つからない場合は-1）
 */
function getLocalElementIndex(searchItem) {
  const searchData =
    searchItem.prompt +
    searchItem.data[0] +
    searchItem.data[1] +
    searchItem.data[2];

  return AppState.data.localPromptList.findIndex((item) => {
    const itemData = item.prompt + item.data[0] + item.data[1] + item.data[2];
    return searchData === itemData;
  });
}

// ============================================
// 初期化
// ============================================

/**
 * データマネージャーを初期化（すべてのデータを非同期で読み込み）
 * @returns {Promise<void>}
 */
async function initializeDataManager() {
  console.log("Initializing data manager...");

  try {
    // 並列で読み込みを実行
    const loadPromises = [
      loadMasterPrompt(),
      loadPrompt(),
      loadLocalList(),
      loadArchivesList(),
      loadOptionData(),
      loadToolInfo(),
      loadCategory(),
    ];

    await Promise.all(loadPromises);

    console.log("Data manager initialized successfully");
    console.log("AppState:", AppState);
  } catch (error) {
    console.error("Failed to initialize data manager:", error);

    // 部分的な初期化失敗でも続行できるようにする
    if (!AppState.userSettings.optionData) {
      AppState.userSettings.optionData = {
        shaping: "SD",
        editType: "SELECT",
        isDeleteCheck: true,
        deeplAuthKey: "",
      };
    }
  }
}

// ============================================
// グローバル変数の互換性維持（段階的な移行のため）
// ============================================

// Getter/Setterでグローバル変数へのアクセスをAppStateにリダイレクト
Object.defineProperty(window, "localPromptList", {
  get() {
    return AppState.data.localPromptList;
  },
  set(value) {
    AppState.data.localPromptList = value;
  },
});

Object.defineProperty(window, "archivesList", {
  get() {
    return AppState.data.archivesList;
  },
  set(value) {
    AppState.data.archivesList = value;
  },
});

Object.defineProperty(window, "masterPrompts", {
  get() {
    return AppState.data.masterPrompts;
  },
  set(value) {
    AppState.data.masterPrompts = value;
  },
});

Object.defineProperty(window, "optionData", {
  get() {
    return AppState.userSettings.optionData;
  },
  set(value) {
    AppState.userSettings.optionData = value;
  },
});

Object.defineProperty(window, "toolInfo", {
  get() {
    return AppState.data.toolInfo;
  },
  set(value) {
    AppState.data.toolInfo = value;
  },
});

Object.defineProperty(window, "searchCategory", {
  get() {
    return AppState.data.searchCategory;
  },
  set(value) {
    AppState.data.searchCategory = value;
  },
});

Object.defineProperty(window, "masterVersion", {
  get() {
    return AppState.config.masterVersion;
  },
  set(value) {
    AppState.config.masterVersion = value;
  },
});

Object.defineProperty(window, "toolVersion", {
  get() {
    return AppState.config.toolVersion;
  },
  set(value) {
    AppState.config.toolVersion = value;
  },
});
