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
    positivePromptText: null,
    generateButton: null,
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
    this.selector.positivePromptText = false;
    this.selector.generateButton = false;
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
