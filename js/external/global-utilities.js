/**
 * global-utilities.js - グローバルユーティリティ関数モジュール
 * Phase 5 Step 5: 後方互換性のために残されているグローバル関数群
 */

// ============================================
// プロンプト更新関連
// ============================================

/**
 * プロンプトの表示を更新
 * @deprecated 将来的にはapp.updatePromptDisplay()を直接使用
 */
function UpdateGenaretePrompt() {
  if (window.app) {
    window.app.updatePromptDisplay();
  }
}

/**
 * プロンプトを初期化
 * @param {string} str - プロンプト文字列
 * @deprecated 将来的にはpromptEditor.init()を直接使用
 */
function InitGenaretePrompt(str) {
  // 重複した初期化を防ぐ
  if (str !== editPrompt.prompt) {
    editPrompt.init(str);
    if (window.app) {
      window.app.generateInput.val(editPrompt.prompt);
    }
  }
}

// ============================================
// リスト更新関連
// ============================================

/**
 * 編集リストを初期化
 * @deprecated 将来的にはapp.refreshEditList()を直接使用
 */
function editInit() {
  if (window.app) {
    window.app.refreshEditList();
  }
}

/**
 * アーカイブリストを初期化
 * @deprecated 将来的にはapp.refreshArchiveList()を直接使用
 */
function archivesInit() {
  if (window.app && $("#archiveList").children().length > 0) {
    window.app.listManager.createList(
      "archive",
      AppState.data.archivesList,
      "#archiveList"
    );
  }
}

/**
 * 追加リストを初期化
 * @deprecated 将来的にはapp.refreshAddList()を直接使用
 */
function addInit() {
  if (window.app) {
    window.app.refreshAddList();
  }
}

// ============================================
// バックグラウンド通信
// ============================================

/**
 * バックグラウンドスクリプトにメッセージを送信
 * @param {string} service - サービス名
 * @param {string} execType - 実行タイプ
 * @param {*} value1 - パラメータ1
 * @param {*} value2 - パラメータ2
 * @param {*} value3 - パラメータ3
 * @deprecated DOM操作用の特殊なメッセージ送信
 */
function sendBackground(service, execType, value1, value2, value3) {
  const message = {
    type: "DOM",
    args: [service, execType, value1, value2, value3],
  };

  chrome.runtime.sendMessage(message, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Runtime error:", chrome.runtime.lastError.message);
    }
  });
}

// ============================================
// カテゴリー関連
// ============================================

/**
 * カテゴリーリストを設定
 * @param {string} id - セレクト要素のID（jQueryセレクタ形式）
 * @param {number} category - カテゴリーレベル
 * @deprecated 将来的にはcategoryData.getCategoriesByParent()を使用
 */
function setCategoryList(id, category) {
  $(id + " option").remove();
  categoryData.data[category].forEach((item) => {
    $(id).append(
      $("<option>", {
        value: item.value,
        text: item.value,
      })
    );
  });
  $(id).prop("disabled", false).val("");
}

/**
 * 検索カテゴリーを設定
 * @deprecated 将来的にはapp.updateUIState()を直接使用
 */
function setSeachCategory() {
  if (window.app) {
    window.app.updateUIState();
    if (AppState.data.searchCategory?.[0]) {
      // 初期表示時はローディングを表示しない
      window.app.searchHandler.performSearch({ showLoading: false });
    }
  }
}

// ============================================
// ユーティリティ
// ============================================

/**
 * JSONオブジェクトをループ処理
 * @param {Object|Array} json - 処理対象のJSON
 * @param {Function} callback - 各要素に対するコールバック
 * @deprecated 標準のforEachやfor...ofループを使用推奨
 */
function jsonLoop(json, callback) {
  if (!json) return;

  const length = Array.isArray(json) ? json.length : Object.keys(json).length;
  for (let i = 0; i < length; i++) {
    callback(json[i], i);
  }
}

/**
 * プロンプトを生成（NovelAI用）
 * @deprecated 将来的にはapp.generatePrompt()を直接使用
 */
function Generate() {
  if (window.app) {
    window.app.generatePrompt();
  }
}

// ============================================
// モジュール情報
// ============================================

/**
 * このモジュールの情報を表示（デバッグ用）
 */
function showGlobalUtilitiesInfo() {
  console.group("Global Utilities Module");

  console.groupEnd();
}

// グローバルに公開（後方互換性のため）
if (typeof window !== "undefined") {
  window.UpdateGenaretePrompt = UpdateGenaretePrompt;
  window.InitGenaretePrompt = InitGenaretePrompt;
  window.editInit = editInit;
  window.archivesInit = archivesInit;
  window.addInit = addInit;
  window.sendBackground = sendBackground;
  window.setCategoryList = setCategoryList;
  window.setSeachCategory = setSeachCategory;
  window.jsonLoop = jsonLoop;
  window.Generate = Generate;
  window.showGlobalUtilitiesInfo = showGlobalUtilitiesInfo;
}
