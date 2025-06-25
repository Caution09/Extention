/**
 * data-manager.js - データ管理モジュール
 * Chrome Storageを使用したデータの永続化と管理
 */

// ============================================
// content script注入関数
// ============================================

/**
 * content scriptを注入する関数
 */
async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["js/content.js"],
    });
    console.log("Content script injected successfully");
    return true;
  } catch (error) {
    console.log("Content script injection failed:", error.message);
    return false;
  }
}

// ============================================
// プロンプト管理
// ============================================

/**
 * 現在のプロンプトを保存
 */
async function savePrompt() {
  try {
    const prompt = editPrompt.prompt;
    await Storage.set({ generatePrompt: prompt });
    await promptSlotManager.saveCurrentSlot();
  } catch (error) {
    console.error("Failed to save prompt:", error);
    throw error;
  }
}

/**
 * プロンプトを読み込み
 */
async function loadPrompt() {
  try {
    const result = await Storage.get("generatePrompt");
    if (result.generatePrompt != null) {
      editPrompt.init(result.generatePrompt);
      UpdateGenaretePrompt();
    }
  } catch (error) {
    console.error("Failed to load prompt:", error);
  }
}

// ============================================
// カテゴリー管理
// ============================================

/**
 * カテゴリーデータを保存
 */
async function saveCategory() {
  try {
    await Storage.set({ searchCategory: AppState.data.searchCategory });
  } catch (error) {
    console.error("Failed to save category:", error);
    throw error;
  }
}

/**
 * カテゴリーデータを読み込み
 */
async function loadCategory() {
  try {
    const result = await Storage.get("searchCategory");
    if (result.searchCategory != null) {
      AppState.data.searchCategory = result.searchCategory;
      setSeachCategory();
    }
  } catch (error) {
    console.error("Failed to load category:", error);
  }
}

// ============================================
// セレクター管理
// ============================================

/**
 * セレクター情報を保存
 */
async function saveSelectors() {
  try {
    await Storage.set({
      positiveSelector: AppState.selector.positiveSelector, // ← 修正
      generateSelector: AppState.selector.generateSelector, // ← 修正
    });
  } catch (error) {
    console.error("Failed to save selectors:", error);
    throw error;
  }
}

/**
 * セレクター情報を読み込み
 */
async function loadSelectors() {
  try {
    const result = await Storage.get(["positiveSelector", "generateSelector"]);

    if (result.positiveSelector) {
      AppState.selector.positiveSelector = result.positiveSelector;
    }
    if (result.generateSelector) {
      // ← ここを修正（generateButton → generateSelector）
      AppState.selector.generateSelector = result.generateSelector;
    }

    // 読み込み後の検証
    if (AppState.userSettings.optionData?.shaping === "NAI") {
      validateAndActivateGenerateButton();
    }
  } catch (error) {
    console.error("Failed to load selectors:", error);
  }
}

/**
 * プロンプトセレクターを読み込み（content script注入機能付き）
 */
async function loadPromptSelector() {
  try {
    const result = await Storage.get("positivePromptText");
    if (result.positivePromptText) {
      const selector = result.positivePromptText;

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab) return;

      // content scriptを注入してから通信
      await injectContentScript(tab.id);

      setTimeout(async () => {
        try {
          const response = await chrome.tabs.sendMessage(tab.id, {
            action: "checkSelector",
            selector,
          });
          console.log("応答：", response);
        } catch (error) {
          console.log("Selector check failed:", error.message);
          // エラーでも値は保持
          AppState.selector.positiveSelector = result.positiveSelector;
        }
      }, 100);
    }
  } catch (error) {
    console.error("Failed to load prompt selector:", error);
  }
}

/**
 * Generateボタンセレクターを読み込み（content script注入機能付き）
 */
async function loadgenerateButtonSelector() {
  try {
    const result = await Storage.get("generateButton");
    if (result.generateButton) {
      const selector = result.generateButton;

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab) return;

      // content scriptを注入してから通信
      await injectContentScript(tab.id);

      setTimeout(async () => {
        try {
          const response = await chrome.tabs.sendMessage(tab.id, {
            action: "checkSelector",
            selector,
          });
          console.log("応答：", response);
        } catch (error) {
          console.log("Selector check failed:", error.message);
          AppState.selector.generateSelector = result.generateSelector;
        }
      }, 100);
    }
  } catch (error) {
    console.error("Failed to load generate button selector:", error);
  }
}

/**
 * セレクターを検証してGenerateボタンを有効化（content script注入機能付き）
 */
async function validateAndActivateGenerateButton() {
  console.log("Validating selectors on:", window.location.href);

  const validateSelector = async (selector, selectorType) => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab) return false;

      // content scriptを注入
      await injectContentScript(tab.id);

      try {
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: "checkSelector",
          selector: selector,
        });

        if (response && response.exists) {
          console.log(`✓ ${selectorType} セレクター有効`);
          return true;
        } else {
          console.log(`✗ ${selectorType} セレクター無効`);
          return false;
        }
      } catch (error) {
        console.log(`セレクター検証エラー:`, error);
        return false;
      }
    } catch (error) {
      console.log(`セレクター検証スキップ (${selectorType}):`, error.message);
      return false;
    }
  };

  // 両方のセレクターを並列で検証
  const [isPositiveValid, isGenerateValid] = await Promise.all([
    validateSelector(AppState.selector.positiveSelector, "プロンプト"),
    validateSelector(AppState.selector.generateSelector, "Generate"),
  ]);

  // 結果に基づいてGenerateボタンを表示/非表示
  const generateButton = document.getElementById("GeneratoButton");
  if (generateButton) {
    if (isPositiveValid && isGenerateValid) {
      generateButton.style.display = "block";
      console.log("✅ Generateボタンを有効化しました");
    } else {
      generateButton.style.display = "none";
      console.log(
        "❌ セレクターが無効なため、Generateボタンを非表示にしました"
      );
    }
  }
}

// ============================================
// マスタープロンプト管理
// ============================================

/**
 * マスタープロンプトを保存
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
 * マスタープロンプトを読み込み
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
 * オプションデータを読み込みし、UIを更新
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
 * 現在のタブに基づいてUIを更新
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
// 要素登録
// ============================================

/**
 * 要素を登録
 * @param {string} big - 大カテゴリー
 * @param {string} middle - 中カテゴリー
 * @param {string} small - 小カテゴリー
 * @param {string} prompt - プロンプト
 * @returns {boolean} 成功/失敗
 */
function Regist(big, middle, small, prompt) {
  const item = {
    prompt: prompt,
    data: [big, middle, small],
  };
  return RegistItem(item);
}

/**
 * アイテムを登録
 * @param {Object} item - 登録するアイテム
 * @param {boolean} skipSave - 保存をスキップするか
 * @returns {boolean} 成功/失敗
 */
function RegistItem(item, skipSave = false) {
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
      loadSelectors(),
      loadLocalList(),
      loadArchivesList(),
      loadOptionData(),
      loadToolInfo(),
      loadCategory(),
      loadPromptSelector(),
      loadgenerateButtonSelector(),
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

Object.defineProperty(window, "positiveSelector", {
  get() {
    return AppState.selector.positiveSelector;
  },
  set(value) {
    AppState.selector.positiveSelector = value;
  },
});

Object.defineProperty(window, "generateSelector", {
  get() {
    return AppState.selector.generateSelector;
  },
  set(value) {
    AppState.selector.generateSelector = value;
  },
});
