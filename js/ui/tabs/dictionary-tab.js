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

        // 統計情報を更新
        this.updateStats();

        // 文字数カウントを設定
        this.setupCharacterCount();

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
        // 新しいUI用のヘッダークリックイベント - より具体的なセレクターを使用
        const sections = [
          { containerId: '#promptDicContainer', type: 'prompt' },
          { containerId: '#elementDicContainer', type: 'element' },
          { containerId: '#masterDicContainer', type: 'master' }
        ];

        sections.forEach(({ containerId, type }) => {
          // コンテナの親要素（.dictionary-section）からヘッダーを取得
          const container = document.querySelector(containerId);
          if (container) {
            const section = container.closest('.dictionary-section');
            if (section) {
              const header = section.querySelector('.dictionary-section-header');
              if (header) {
                this.addEventListener(header, "click", () => {
                  console.log(`Clicked ${type} dictionary header`);
                  this.toggleDictionary(type);
                });
              }
            }
          }
        });

        // 従来のUI互換性（隠し要素）
        const promptDicText = this.getElement("#promptDicText");
        if (promptDicText) {
          this.addEventListener(promptDicText, "click", () => {
            this.toggleDictionary("prompt");
          });
        }

        const elementDicText = this.getElement("#elementDicText");
        if (elementDicText) {
          this.addEventListener(elementDicText, "click", () => {
            this.toggleDictionary("element");
          });
        }

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
            containerId: "#promptDicContainer",
            textId: "#promptDicText",
            openText: "▼プロンプト辞書　※ここをクリックで開閉",
            closeText: "▶プロンプト辞書　※ここをクリックで開閉",
            createFunc: async () => {
              console.log('Creating archive list with data:', AppState.data.archivesList);
              
              // ソート順でソート
              const sorted = [...AppState.data.archivesList].sort(
                (a, b) => (a.sort || 0) - (b.sort || 0)
              );
              
              await this.listManager.createList(
                "archive",
                sorted,
                "#archiveList"
              );
            },
          },
          element: {
            listId: "#addPromptList",
            containerId: "#elementDicContainer",
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
            containerId: "#masterDicContainer", 
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
        const $container = $(config.containerId);
        
        // コンテナから親のセクションとヘッダーを取得
        const container = document.querySelector(config.containerId);
        const section = container ? container.closest('.dictionary-section') : null;
        const header = section ? section.querySelector('.dictionary-section-header') : null;
        const toggleIcon = header ? header.querySelector('.dictionary-toggle-icon') : null;

        const isExpanded = this.dictionaryStates[type];

        console.log(`Toggle ${type}: isExpanded=${isExpanded}, container=${!!container}, section=${!!section}, header=${!!header}`);

        if (isExpanded) {
          // 閉じる
          ListBuilder.clearList(config.listId);
          $container.removeClass('expanded');
          if (header) header.setAttribute('data-expanded', 'false');
          if (toggleIcon) toggleIcon.textContent = '▶';
          if ($text.length) $text.text(config.closeText);
          this.dictionaryStates[type] = false;
        } else {
          // 開く
          console.log(`Opening ${type} dictionary...`);
          await config.createFunc();
          $container.addClass('expanded');
          if (header) header.setAttribute('data-expanded', 'true');
          if (toggleIcon) toggleIcon.textContent = '▼';
          if ($text.length) $text.text(config.openText);
          this.dictionaryStates[type] = true;
          
          // 開いた後に統計を更新
          setTimeout(() => {
            this.updateStats();
          }, 100);
        }

        // 統計情報を更新
        this.updateStats();
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
          // ソート順でソート
          const sorted = [...AppState.data.archivesList].sort(
            (a, b) => (a.sort || 0) - (b.sort || 0)
          );
          
          await this.listManager.createList(
            "archive",
            sorted,
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
        // デバウンス用のタイマー
        let saveTimer = null;
        
        // 共通化されたEventHandlers.setupSortableListを使用
        EventHandlers.setupSortableList("#addPromptList", async (sortedIds) => {
          // 即座にソート順を更新（UI応答性のため）
          let baseIndex = 0;
          sortedIds.forEach((id) => {
            if (!id) return;
            if (AppState.data.localPromptList[id]) {
              AppState.data.localPromptList[id].sort = baseIndex++;
            }
          });
          
          // 保存処理をデバウンス（500ms後に実行）
          if (saveTimer) {
            clearTimeout(saveTimer);
          }
          saveTimer = setTimeout(async () => {
            try {
              await saveLocalList();
              console.log('Local list saved after sort');
            } catch (error) {
              console.error('Error saving local list:', error);
            }
          }, 500);
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
       * 統計情報を更新
       */
      updateStats() {
        const stats = this.getDictionaryStats();
        
        const archiveCountEl = document.getElementById('archive-count');
        const localCountEl = document.getElementById('local-count');
        const masterCountEl = document.getElementById('master-count');
        
        if (archiveCountEl) {
          archiveCountEl.textContent = stats.archives;
          // 大きな数の場合は省略表示
          if (stats.archives > 999) {
            archiveCountEl.textContent = (stats.archives / 1000).toFixed(1) + 'k';
          }
        }
        if (localCountEl) {
          localCountEl.textContent = stats.localElements;
          if (stats.localElements > 999) {
            localCountEl.textContent = (stats.localElements / 1000).toFixed(1) + 'k';
          }
        }
        if (masterCountEl) {
          masterCountEl.textContent = stats.masterElements;
          if (stats.masterElements > 999) {
            masterCountEl.textContent = (stats.masterElements / 1000).toFixed(1) + 'k';
          }
        }
        
        console.log('Dictionary stats updated:', stats);
      }

      /**
       * 文字数カウントを設定
       */
      setupCharacterCount() {
        const promptTextarea = document.getElementById('prompt');
        const charCountEl = document.getElementById('prompt-char-count');
        
        if (promptTextarea && charCountEl) {
          const updateCharCount = () => {
            const count = promptTextarea.value.length;
            charCountEl.textContent = `${count}文字`;
            
            // 文字数に応じて色を変更
            if (count > 500) {
              charCountEl.style.color = 'var(--accent-danger)';
            } else if (count > 300) {
              charCountEl.style.color = 'var(--accent-warning)';
            } else {
              charCountEl.style.color = 'var(--text-muted)';
            }
          };
          
          // 初期値を設定
          updateCharCount();
          
          // リアルタイム更新
          this.addEventListener(promptTextarea, 'input', updateCharCount);
          this.addEventListener(promptTextarea, 'keyup', updateCharCount);
        }
      }

      /**
       * タブ表示時に統計情報を更新
       */
      async onShow() {
        console.log('Dictionary tab shown, updating stats...');
        
        // 統計情報を更新
        this.updateStats();
        
        // 必要に応じて辞書リストを更新
        if (this.dictionaryStates.prompt) {
          await this.refreshArchiveList();
        }
        if (this.dictionaryStates.element) {
          await this.refreshAddList();
        }
      }

      /**
       * 要素登録後の処理を拡張
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
          if (promptInput) {
            promptInput.value = "";
            // 文字数カウントもリセット
            const charCountEl = document.getElementById('prompt-char-count');
            if (charCountEl) charCountEl.textContent = '0文字';
          }

          // リストを更新
          await this.refreshAddList();

          // 統計情報を更新
          this.updateStats();

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
