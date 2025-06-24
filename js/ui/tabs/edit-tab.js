/**
 * edit-tab.js - 編集タブモジュール
 * Phase 8.5: プロンプト編集機能
 */

// TabManagerが利用可能になるまで待つ
(function () {
  "use strict";

  // TabManagerが定義されるまで待機
  function defineEditTab() {
    if (typeof TabManager === "undefined") {
      setTimeout(defineEditTab, 10);
      return;
    }

    // EditTabクラスの定義
    class EditTab extends TabManager {
      constructor(app) {
        super(app, {
          tabId: "editTabBody",
          tabButtonId: "editTab",
          tabIndex: 2, // CONSTANTS.TABS.EDIT
        });

        // EditHandlerへの参照
        this.editHandler = null;

        // 現在の編集モード
        this.currentEditMode = null;
        this.currentShapingMode = null;
      }

      /**
       * 初期化処理
       */
      async onInit() {
        // EditHandlerの参照を取得
        this.editHandler = this.app.editHandler;
        if (!this.editHandler) {
          throw new Error("EditHandler not found");
        }

        // イベントリスナーを設定
        this.setupEventListeners();

        // 初期状態を設定
        this.updateCurrentModes();

        console.log("EditTab initialized");
      }

      /**
       * タブ表示時の処理
       */
      async onShow() {
        console.log("Showing edit tab, initializing edit mode...");

        // 編集モードを初期化
        this.editHandler.initializeEditMode();

        // 現在のモードを更新
        this.updateCurrentModes();
      }

      /**
       * イベントリスナーの設定
       */
      setupEventListeners() {
        // UIタイプ（整形モード）の変更
        this.setupUITypeHandlers();

        // 編集タイプの変更
        this.setupEditTypeHandlers();

        // プロンプト入力の監視（編集タブがアクティブな時のみリフレッシュ）
        this.setupPromptChangeListener();
      }

      /**
       * UIタイプ（整形モード）のハンドラー設定
       */
      setupUITypeHandlers() {
        const uiTypeRadios = document.querySelectorAll('[name="UIType"]');

        console.log("Found UIType radios:", uiTypeRadios.length); // デバッグログ

        uiTypeRadios.forEach((radio) => {
          this.addEventListener(radio, "change", async (e) => {
            console.log("UIType changed via EditTab:", e.target.value); // デバッグログ
            await this.handleUITypeChange(e);
          });
        });
      }

      /**
       * 編集タイプのハンドラー設定
       */
      setupEditTypeHandlers() {
        const editTypeRadios = this.getElements('[name="EditType"]');
        editTypeRadios.forEach((radio) => {
          this.addEventListener(radio, "change", async (e) => {
            await this.handleEditTypeChange(e);
          });
        });
      }

      /**
       * プロンプト変更リスナーの設定
       */
      setupPromptChangeListener() {
        // PromptEditorのイベントを監視
        promptEditor.on("change", () => {
          if (this.isCurrentTab()) {
            // 編集タブがアクティブな場合のみリフレッシュ
            this.refreshEditList();
          }
        });
      }

      /**
       * UIタイプ変更時の処理
       */
      async handleUITypeChange(event) {
        const selectedValue = event.target.value;
        const previousValue = this.currentShapingMode;

        // EditHandlerに処理を委譲
        this.editHandler.handleUITypeChange(event);

        // モードを更新
        this.currentShapingMode = selectedValue;

        // 変更通知を表示
        if (previousValue && previousValue !== selectedValue) {
          const modeNames = {
            SD: "StableDiffusion",
            NAI: "NovelAI",
            None: "自動整形無し",
          };

          ErrorHandler.notify(
            `整形モードを「${modeNames[selectedValue]}」に変更しました`,
            {
              type: ErrorHandler.NotificationType.TOAST,
              messageType: "info",
              duration: 2000,
            }
          );
        }

        // 自動Generate機能の再初期化（NAIモードの場合）
        if (selectedValue === "NAI" && window.autoGenerateHandler) {
          autoGenerateHandler.init();
        }
      }

      /**
       * 編集タイプ変更時の処理
       */
      async handleEditTypeChange(event) {
        const selectedValue = event.target.value;
        const previousValue = this.currentEditMode;

        // EditHandlerに処理を委譲
        this.editHandler.handleEditTypeChange(event);

        // モードを更新
        this.currentEditMode = selectedValue;

        // 変更通知を表示
        if (previousValue && previousValue !== selectedValue) {
          const modeNames = {
            SELECT: "選択編集モード",
            TEXT: "テキスト編集モード",
          };

          ErrorHandler.notify(
            `編集モードを「${modeNames[selectedValue]}」に変更しました`,
            {
              type: ErrorHandler.NotificationType.TOAST,
              messageType: "info",
              duration: 1500,
            }
          );
        }
      }

      /**
       * 編集リストをリフレッシュ
       */
      async refreshEditList() {
        if (this.editHandler) {
          await this.editHandler.refreshEditList();
        }
      }

      /**
       * 現在のモードを更新
       */
      updateCurrentModes() {
        // 整形モード
        const checkedUIType = document.querySelector('[name="UIType"]:checked');
        if (checkedUIType) {
          this.currentShapingMode = checkedUIType.value;
        }

        // 編集モード
        const checkedEditType = document.querySelector(
          '[name="EditType"]:checked'
        );
        if (checkedEditType) {
          this.currentEditMode = checkedEditType.value;
        }
      }

      /**
       * 編集操作のショートカットキー設定（将来の拡張用）
       */
      setupEditShortcuts() {
        // 将来的に編集専用のショートカットキーを実装
        // 例：
        // - Ctrl+Up/Down: 要素の順序変更
        // - Ctrl+Del: 要素の削除
        // - Ctrl+W: 重み調整モード
      }

      /**
       * 重み調整のプリセット機能（将来の拡張用）
       */
      applyWeightPreset(presetName) {
        const presets = {
          emphasis: 1.5,
          strong: 2.0,
          weak: 0.5,
          neutral: 1.0,
        };

        const weight = presets[presetName];
        if (weight !== undefined) {
          // 選択された要素に重みを適用
          console.log(`Applying weight preset: ${presetName} (${weight})`);
        }
      }

      /**
       * 編集履歴機能（将来の拡張用）
       */
      setupEditHistory() {
        // 編集操作の履歴を管理
        this.editHistory = [];
        this.historyIndex = -1;
      }

      /**
       * 元に戻す（将来の拡張用）
       */
      undo() {
        if (this.historyIndex > 0) {
          this.historyIndex--;
          // 履歴から状態を復元
          console.log("Undo operation");
        }
      }

      /**
       * やり直す（将来の拡張用）
       */
      redo() {
        if (this.historyIndex < this.editHistory.length - 1) {
          this.historyIndex++;
          // 履歴から状態を復元
          console.log("Redo operation");
        }
      }

      /**
       * バッチ編集機能（将来の拡張用）
       */
      batchEdit(operation, targetIndices) {
        // 複数の要素に対して一括編集
        console.log(`Batch ${operation} on indices:`, targetIndices);
      }

      /**
       * 編集ヘルプを表示（将来の拡張用）
       */
      showEditHelp() {
        const helpContent = `
          【編集モードの使い方】

          ■ 選択編集モード
          - ドロップダウンから要素を選択
          - カテゴリーから素早く入力
          - プレビュー機能付き

          ■ テキスト編集モード
          - 直接テキストを編集
          - 重みを数値で調整
          - より細かい制御が可能

          ■ 共通操作
          - ドラッグ&ドロップで並び替え
          - +/- ボタンで重み調整
          - Xボタンで要素削除
        `;

        // ヘルプダイアログを表示
        console.log(helpContent);
      }

      /**
       * 編集内容の統計情報を取得
       */
      getEditStats() {
        const elements = editPrompt.elements || [];
        const weights = elements.map((el) => {
          const shaping = AppState.userSettings.optionData?.shaping || "SD";
          return el[shaping]?.weight || 0;
        });

        return {
          totalElements: elements.length,
          averageWeight:
            weights.length > 0
              ? (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(2)
              : 0,
          maxWeight: weights.length > 0 ? Math.max(...weights) : 0,
          minWeight: weights.length > 0 ? Math.min(...weights) : 0,
          currentMode: this.currentEditMode,
          shapingMode: this.currentShapingMode,
        };
      }

      /**
       * タブのリフレッシュ
       */
      async onRefresh() {
        // 編集モードを再初期化
        this.editHandler.initializeEditMode();
      }

      /**
       * デバッグ情報を出力（オーバーライド）
       */
      debug() {
        super.debug();
        console.log("Edit modes:", {
          shaping: this.currentShapingMode,
          edit: this.currentEditMode,
        });
        console.log("Edit stats:", this.getEditStats());
        console.log("EditHandler:", this.editHandler);
      }
    }

    // グローバルに公開
    if (typeof window !== "undefined") {
      window.EditTab = EditTab;
    }
  }

  // 初期実行
  defineEditTab();
})();
