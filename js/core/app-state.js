/**
 * アプリケーション全体の状態を管理する名前空間
 * グローバル変数を一元管理し、モジュール間で共有
 */
const AppState = {
  // アプリケーション設定
  config: {
    toolVersion: 5,
    masterVersion: 0,
  },

  // データ
  data: {
    localPromptList: [],
    archivesList: [],
    masterPrompts: [],
    searchCategory: {},
    toolInfo: {},
  },

  // ユーザー設定
  userSettings: {
    optionData: null,
  },

  // UI状態
  ui: {
    currentTab: 0,
    isSearching: false,
    mouseCursorValue: "",
  },

  // 一時的なデータ
  temp: {
    translateQueue: [],
    searchResults: [],
  },

  selector: {
    positiveSelector: null,
    generateSelector: null,

    // サービスごとのセレクターセット
    serviceSets: {
      novelai: {
        name: "NovelAI",
        url: "https://novelai.net/image",
        positiveSelector:
          "#__next > div.sc-5de027f2-0.IhKLm.image-gen-page > div.image-gen-body > div.image-gen-main > div:nth-child(1) > div.sc-bfaa0c12-0.llxfFb.settings-panel > div:nth-child(3) > div:nth-child(2) > div > div.prompt-input-box-プロンプト > div.relative > div > div",
        generateSelector:
          "#__next > div.sc-5de027f2-0.IhKLm.image-gen-page > div.image-gen-body > div.image-gen-main > div:nth-child(1) > div.sc-bfaa0c12-0.llxfFb.settings-panel > div:nth-child(5) > button",
      },
      stable_diffusion: {
        name: "Stable Diffusion WebUI",
        url: "http://127.0.0.1:7860/",
        positiveSelector: "#txt2img_prompt textarea",
        generateSelector: "#txt2img_generate",
      },
      comfyui: {
        name: "ComfyUI",
        url: "http://127.0.0.1:8188/",
        positiveSelector: "textarea.comfy-multiline-input",
        generateSelector: "#button.execute-button",
      },
      custom: {
        name: "custom",
        url: "",
        positiveSelector: null,
        generateSelector: null,
      },
    },

    // 現在のサービス
    currentService: null,
  },

  /**
   * 状態を初期化
   */
  reset() {
    this.data.localPromptList = [];
    this.data.archivesList = [];
    this.data.masterPrompts = [];
    this.data.searchCategory = {};
    this.data.toolInfo = {};
    this.userSettings.optionData = null;
    this.ui.currentTab = 0;
    this.ui.isSearching = false;
    this.selector.positiveSelector = "";
    this.selector.generateSelector = "";
  },

  /**
   * デバッグ用：現在の状態をコンソールに出力
   */
  debug() {
    console.log("AppState:", {
      config: this.config,
      data: this.data,
      userSettings: this.userSettings,
      ui: this.ui,
    });
  },
};

// グローバルスコープでアクセス可能にする（移行期間中）
window.AppState = AppState;
