/**
 * dictionary-tab.js - 辞書タブモジュール
 * Phase 8.5: 辞書管理機能
 */

// TabManagerが利用可能になるまで待つ
(function () {
  "use strict";

  // TabManagerが定義されるまで待機
  function defineDictionaryTab() {
    if (typeof TabManager === "undefined") {
      setTimeout(defineDictionaryTab, 10);
      return;
    }

    // DictionaryTabクラスの定義
    class DictionaryTab extends TabManager {
      constructor(app) {
        super(app, {
          tabId: "addTabBody",
          tabButtonId: "addTab",
          tabIndex: 1, // CONSTANTS.TABS.DICTIONARY
        });

        // 依存モジュールへの参照
        this.dictionaryHandler = null;
        this.listManager = null;

        // 辞書の表示状態
        this.dictionaryStates = {
          prompt: false,
          element: false,
          master: false,
        };
      }

      /**
       * 初期化処理
       */
      async onInit() {
        // 依存モジュールの参照を取得
        this.dictionaryHandler = this.app.dictionaryHandler;
        this.listManager = this.app.listManager;

        if (!this.dictionaryHandler || !this.listManager) {
          throw new Error("Required dependencies not found");
        }

        // イベントリスナーを設定
        this.setupEventListeners();

        console.log("DictionaryTab initialized");
      }

      /**
       * タブ表示時の処理
       */
      async onShow() {
        // 必要に応じて辞書リストを更新
        // 現在開いている辞書のみ更新（パフォーマンス考慮）
        if (this.dictionaryStates.prompt) {
          await this.refreshArchiveList();
        }
        if (this.dictionaryStates.element) {
          await this.refreshAddList();
        }
      }

      /**
       * イベントリスナーの設定
       */
      setupEventListeners() {
        // 辞書の開閉
        this.setupDictionaryToggles();

        // 要素の追加
        this.setupElementRegistration();

        // カテゴリー入力の連動
        this.setupCategoryInputs();
      }

      /**
       * 辞書の開閉トグル設定
       */
      setupDictionaryToggles() {
        // プロンプト辞書
        const promptDicText = this.getElement("#promptDicText");
        if (promptDicText) {
          this.addEventListener(promptDicText, "click", () => {
            this.toggleDictionary("prompt");
          });
        }

        // 要素辞書（ローカル）
        const elementDicText = this.getElement("#elementDicText");
        if (elementDicText) {
          this.addEventListener(elementDicText, "click", () => {
            this.toggleDictionary("element");
          });
        }

        // 要素辞書（マスター）
        const masterDicText = this.getElement("#masterDicText");
        if (masterDicText) {
          this.addEventListener(masterDicText, "click", () => {
            this.toggleDictionary("master");
          });
        }
      }

      /**
       * 要素登録の設定
       */
      setupElementRegistration() {
        const resistButton = this.getElement("#resist");
        if (resistButton) {
          this.addEventListener(resistButton, "click", async () => {
            await this.handleElementRegistration();
          });
        }

        // Enterキーでも登録できるように
        const promptInput = this.getElement("#prompt");
        if (promptInput) {
          this.addEventListener(promptInput, "keypress", async (e) => {
            if (e.key === "Enter") {
              await this.handleElementRegistration();
            }
          });
        }
      }

      /**
       * カテゴリー入力フィールドの設定
       */
      setupCategoryInputs() {
        const bigInput = this.getElement("#big");
        const middleInput = this.getElement("#middle");
        const smallInput = this.getElement("#small");

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

      /**
       * 辞書の表示/非表示を切り替え
       * @param {string} type - 辞書タイプ（prompt/element/master）
       */
      async toggleDictionary(type) {
        const configs = {
          prompt: {
            listId: "#archiveList",
            textId: "#promptDicText",
            openText: "▼プロンプト辞書　※ここをクリックで開閉",
            closeText: "▶プロンプト辞書　※ここをクリックで開閉",
            createFunc: () =>
              this.listManager.createList(
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
              await this.listManager.createList(
                "add",
                sorted,
                "#addPromptList"
              );

              // リスト作成後にsortableを初期化
              setTimeout(() => {
                this.setupSortableForAddList();
              }, 100);
            },
          },
          master: {
            listId: "#masterDicList",
            textId: "#masterDicText",
            openText: "▼要素辞書(マスタ)　※ここをクリックで開閉",
            closeText: "▶要素辞書(マスタ)　※ここをクリックで開閉",
            createFunc: () =>
              this.listManager.createList(
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
          // 閉じる
          ListBuilder.clearList(config.listId);
          $text.text(config.closeText);
          this.dictionaryStates[type] = false;
        } else {
          // 開く
          await config.createFunc();
          $text.text(config.openText);
          this.dictionaryStates[type] = true;
        }
      }

      /**
       * 要素の登録処理
       */
      async handleElementRegistration() {
        const bigInput = this.getElement("#big");
        const middleInput = this.getElement("#middle");
        const smallInput = this.getElement("#small");
        const promptInput = this.getElement("#prompt");

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

          // リストを更新
          await this.refreshAddList();

          // 成功通知
          ErrorHandler.notify("要素を追加しました", {
            type: ErrorHandler.NotificationType.TOAST,
            messageType: "success",
            duration: 1500,
          });

          // プロンプト入力にフォーカスを戻す
          if (promptInput) {
            promptInput.focus();
          }
        }
      }

      /**
       * アーカイブリストを更新
       */
      async refreshArchiveList() {
        const archiveList = this.getElement("#archiveList");
        if (archiveList && archiveList.children.length > 0) {
          await this.listManager.createList(
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
        const addPromptList = this.getElement("#addPromptList");
        if (addPromptList && addPromptList.children.length > 0) {
          // sortableを破棄
          if ($("#addPromptList").hasClass("ui-sortable")) {
            $("#addPromptList").sortable("destroy");
          }

          const sorted = [...AppState.data.localPromptList].sort(
            (a, b) => (a.sort || 0) - (b.sort || 0)
          );
          await this.listManager.createList("add", sorted, "#addPromptList");

          // sortableを再初期化
          this.setupSortableForAddList();
        }
      }

      /**
       * 追加リストのソート機能を設定
       */
      setupSortableForAddList() {
        EventHandlers.setupSortableList("#addPromptList", async (sortedIds) => {
          let baseIndex = 0;
          sortedIds.forEach((id) => {
            if (!id) return;
            AppState.data.localPromptList[id].sort = baseIndex++;
          });
          await saveLocalList();
        });

        // カテゴリー連動を再設定
        const bigInput = document.getElementById("big");
        const middleInput = document.getElementById("middle");

        if (bigInput && middleInput) {
          bigInput.setAttribute("list", "category");
          const currentBigValue = bigInput.value;
          if (currentBigValue) {
            middleInput.setAttribute("list", "category" + currentBigValue);
          }
        }
      }

      /**
       * 辞書データの統計情報を取得
       * @returns {Object} 統計情報
       */
      getDictionaryStats() {
        return {
          archives: AppState.data.archivesList.length,
          localElements: AppState.data.localPromptList.length,
          masterElements: AppState.data.masterPrompts.length,
          openDictionaries: Object.values(this.dictionaryStates).filter(
            (state) => state
          ).length,
        };
      }

      /**
       * クイック検索機能（将来の拡張用）
       * @param {string} keyword - 検索キーワード
       */
      quickSearch(keyword) {
        // 将来的に辞書内のクイック検索を実装
        console.log("Quick search not implemented yet:", keyword);
      }

      /**
       * タブのリフレッシュ
       */
      async onRefresh() {
        // 開いている辞書のみリフレッシュ
        if (this.dictionaryStates.prompt) {
          await this.refreshArchiveList();
        }
        if (this.dictionaryStates.element) {
          await this.refreshAddList();
        }
      }

      /**
       * デバッグ情報を出力（オーバーライド）
       */
      debug() {
        super.debug();
        console.log("Dictionary states:", this.dictionaryStates);
        console.log("Dictionary stats:", this.getDictionaryStats());
      }
    }

    // グローバルに公開
    if (typeof window !== "undefined") {
      window.DictionaryTab = DictionaryTab;
    }
  }

  // 初期実行
  defineDictionaryTab();
})();
