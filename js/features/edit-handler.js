// ============================================
// 編集ハンドラークラス
// ============================================
class EditHandler {
  constructor(app) {
    this.app = app; // PromptGeneratorAppインスタンスへの参照
  }

  /**
   * UIタイプ変更時の処理
   * @param {Event} event - 変更イベント
   */
  handleUITypeChange(event) {
    const selectedValue = event.target.value;
    AppState.userSettings.optionData.shaping = selectedValue;

    // プロンプトを再生成
    editPrompt.generate();
    this.app.updatePromptDisplay();

    this.initializeEditMode();
    saveOptionData();
  }

  /**
   * 編集タイプ変更時の処理
   * @param {Event} event - 変更イベント
   */
  handleEditTypeChange(event) {
    const selectedValue = event.target.value;
    AppState.userSettings.optionData.editType = selectedValue;

    saveOptionData();

    // プロンプトを再生成して記法を更新
    editPrompt.generate();
    this.app.updatePromptDisplay();

    this.initializeEditMode();
  }

  /**
   * 編集モードを初期化
   */
  initializeEditMode() {
    const generatePrompt = document.getElementById("generatePrompt");
    const currentPrompt = generatePrompt ? generatePrompt.value : "";

    if (currentPrompt && currentPrompt !== promptEditor.prompt) {
      console.log("Initializing edit mode with:", currentPrompt);
      promptEditor.init(currentPrompt);
    }

    this.refreshEditList();
  }

  /**
   * 編集リストを更新
   */
  async refreshEditList() {
    console.log(
      "refreshEditList called, elements count:",
      editPrompt.elements.length
    );

    const editType = AppState.userSettings.optionData.editType;
    const listType =
      editType === CONSTANTS.EDIT_TYPES.SELECT ? "editDropdown" : "edit";

    // sortableを破棄
    if ($("#editList").hasClass("ui-sortable")) {
      $("#editList").sortable("destroy");
    }

    // sort プロパティで並び替えた要素を渡す
    const sortedElements = [...editPrompt.elements].sort(
      (a, b) => (a.sort || 0) - (b.sort || 0)
    );

    await this.app.listManager.createList(
      listType,
      sortedElements, // ソート済みの要素を渡す
      "#editList"
    );

    // sortableを再初期化
    EventHandlers.setupSortableList("#editList", (sortedIds) => {
      // sortedIdsは表示順のインデックス（0, 1, 2...）
      // でも実際のelementsの順番はsortプロパティでソートされている

      const sortedElements = [...editPrompt.elements].sort(
        (a, b) => (a.sort || 0) - (b.sort || 0)
      );

      let baseIndex = 0;
      sortedIds.forEach((displayIndex) => {
        if (!displayIndex) return;
        // 表示順のインデックスから実際の要素を取得
        const element = sortedElements[displayIndex];
        if (element) {
          element.sort = baseIndex++;
        }
      });

      editPrompt.generate();
      this.app.updatePromptDisplay();
    });
  }
}

// グローバルに公開
if (typeof window !== "undefined") {
  window.EditHandler = EditHandler;
}
