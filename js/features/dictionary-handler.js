/**
 * dictionary-handler.js - 辞書機能モジュール
 * Phase 5: main.jsから分離
 */

// ============================================
// 辞書ハンドラークラス
// ============================================
class DictionaryHandler {
  constructor(app) {
    this.app = app; // PromptGeneratorAppインスタンスへの参照
  }

  /**
   * 辞書の表示/非表示を切り替え
   * @param {string} type - 辞書タイプ（prompt/element/master）
   */
  toggleDictionary(type) {
    const configs = {
      prompt: {
        listId: "#archiveList",
        textId: "#promptDicText",
        openText: "▼プロンプト辞書　※ここをクリックで開閉",
        closeText: "▶プロンプト辞書　※ここをクリックで開閉",
        createFunc: () =>
          this.app.listManager.createList(
            "archive",
            AppState.data.archivesList,
            "#archiveList"
          ),
      },
      element: {
        listId: "#addPromptList",
        textId: "#elementDicText",
        openText: "▼要素辞書(ローカル)　※ここをクリックで開閉",
        closeText: "▶要素辞書(ローカル)　※ここをクリックで開閉",
        createFunc: async () => {
          const sorted = [...AppState.data.localPromptList].sort(
            (a, b) => (a.sort || 0) - (b.sort || 0)
          );
          await this.app.listManager.createList(
            "add",
            sorted,
            "#addPromptList"
          );

          // リスト作成後にsortableを初期化
          setTimeout(() => {
            // ここで大項目・中項目のIDを持つ要素への参照をクリア
            const bigInput = document.getElementById("big");
            const middleInput = document.getElementById("middle");

            if (bigInput && middleInput) {
              // カテゴリー連動を再設定
              bigInput.setAttribute("list", "category");
              const currentBigValue = bigInput.value;
              if (currentBigValue) {
                middleInput.setAttribute("list", "category" + currentBigValue);
              }
            }

            EventHandlers.setupSortableList(
              "#addPromptList",
              async (sortedIds) => {
                let baseIndex = 0;
                sortedIds.forEach((id) => {
                  if (!id) return;
                  AppState.data.localPromptList[id].sort = baseIndex++;
                });
                await saveLocalList();
              }
            );
          }, 100);
        },
      },
      master: {
        listId: "#masterDicList",
        textId: "#masterDicText",
        openText: "▼要素辞書(マスタ)　※ここをクリックで開閉",
        closeText: "▶要素辞書(マスタ)　※ここをクリックで開閉",
        createFunc: () =>
          this.app.listManager.createList(
            "master",
            AppState.data.masterPrompts,
            "#masterDicList"
          ),
      },
    };

    const config = configs[type];
    const $list = $(config.listId);
    const $text = $(config.textId);

    if ($list.children().length > 0) {
      ListBuilder.clearList(config.listId);
      $text.text(config.closeText);
    } else {
      config.createFunc();
      $text.text(config.openText);
    }
  }

  /**
   * 要素の登録処理
   */
  async handleElementRegistration() {
    const bigInput = document.getElementById("big");
    const middleInput = document.getElementById("middle");
    const smallInput = document.getElementById("small");
    const promptInput = document.getElementById("prompt");

    const data = {
      big: bigInput ? bigInput.value : "",
      middle: middleInput ? middleInput.value : "",
      small: smallInput ? smallInput.value : "",
      prompt: promptInput ? promptInput.value : "",
    };

    // バリデーション
    const promptValidation = Validators.validatePrompt(data.prompt);
    if (!promptValidation.isValid) {
      ErrorHandler.notify(promptValidation.errors[0].message);
      return;
    }

    const categoryValidation = Validators.validateCategories(data);
    if (!categoryValidation.isValid) {
      ErrorHandler.notify(categoryValidation.errors[0].message);
      return;
    }

    // 登録
    const success = Regist(data.big, data.middle, data.small, data.prompt);
    if (success) {
      // 入力フィールドをクリア
      if (bigInput) bigInput.value = "";
      if (middleInput) middleInput.value = "";
      if (smallInput) smallInput.value = "";
      if (promptInput) promptInput.value = "";
      this.refreshAddList();
    }
  }

  /**
   * アーカイブリストを更新
   */
  async refreshArchiveList() {
    if ($("#archiveList").children().length > 0) {
      await this.app.listManager.createList(
        "archive",
        AppState.data.archivesList,
        "#archiveList"
      );
    }
  }

  /**
   * 追加リストを更新
   */
  async refreshAddList() {
    if ($("#addPromptList").children().length > 0) {
      // sortableを破棄
      if ($("#addPromptList").hasClass("ui-sortable")) {
        $("#addPromptList").sortable("destroy");
      }

      const sorted = [...AppState.data.localPromptList].sort(
        (a, b) => (a.sort || 0) - (b.sort || 0)
      );
      await this.app.listManager.createList("add", sorted, "#addPromptList");

      // sortableを再初期化
      EventHandlers.setupSortableList("#addPromptList", async (sortedIds) => {
        let baseIndex = 0;
        sortedIds.forEach((id) => {
          if (!id) return;
          AppState.data.localPromptList[id].sort = baseIndex++;
        });
        await saveLocalList();
      });
    }
  }

  /**
   * カテゴリー入力フィールドの設定
   */
  setupCategoryInputs() {
    const bigInput = document.getElementById("big");
    const middleInput = document.getElementById("middle");
    const smallInput = document.getElementById("small");

    if (bigInput && middleInput) {
      // 大項目と中項目のみ連動
      EventHandlers.setupCategoryChain([bigInput, middleInput]);

      // クリア動作を追加
      EventHandlers.addInputClearBehavior(bigInput);
      EventHandlers.addInputClearBehavior(middleInput);

      // 小項目は単純な入力フィールドとして扱う
      if (smallInput) {
        EventHandlers.addInputClearBehavior(smallInput);
      }
    }
  }
}

// グローバルに公開
if (typeof window !== "undefined") {
  window.DictionaryHandler = DictionaryHandler;
}
