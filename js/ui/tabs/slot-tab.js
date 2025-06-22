/**
 * slot-tab.js - スロットタブモジュール
 * Phase 8.5: プロンプトスロット管理タブ
 */

// TabManagerが利用可能になるまで待つ
(function () {
  "use strict";

  // TabManagerが定義されるまで待機
  function defineSlotTab() {
    if (typeof TabManager === "undefined") {
      // まだTabManagerが利用できない場合は、少し待ってリトライ
      setTimeout(defineSlotTab, 10);
      return;
    }

    // SlotTabクラスの定義
    class SlotTab extends TabManager {
      constructor(app) {
        super(app, {
          tabId: "slotTabBody",
          tabButtonId: "slotTab",
          tabIndex: 3, // CONSTANTS.TABS.SLOT の値を直接使用
        });

        // スロット管理への参照は後で取得
        this.slotManager = null;
      }

      /**
       * 初期化処理
       */
      async onInit() {
        // スロットマネージャーの参照を取得
        this.slotManager = window.promptSlotManager;
        if (!this.slotManager) {
          throw new Error("PromptSlotManager not found");
        }

        // 初回読み込み時にスロット情報を確実に取得
        if (!this.slotManager.slots || this.slotManager.slots.length === 0) {
          console.log("Slots not loaded, loading from storage...");
          await this.slotManager.loadFromStorage();
        }

        // イベントリスナーを設定
        this.setupEventListeners();

        // 初期表示を更新
        this.updateDisplay();
      }

      /**
       * タブ表示時の処理
       */
      async onShow() {
        console.log("Switching to slot tab, updating display...");

        // 現在のスロットを保存してから表示を更新
        await this.slotManager.saveCurrentSlot();
        this.updateDisplay();
      }

      /**
       * イベントリスナーの設定
       */
      setupEventListeners() {
        const container = this.getElement("#slot-container");
        if (!container) return;

        // イベントデリゲーション for クリックイベント
        this.addEventListener(container, "click", async (e) => {
          await this.handleContainerClick(e);
        });

        // 名前の編集
        this.addEventListener(container, "change", async (e) => {
          if (e.target.classList.contains("slot-name-edit")) {
            const slotId = parseInt(e.target.dataset.slotId);
            await this.slotManager.setSlotName(slotId, e.target.value);
            this.slotManager.updateUI();
          }
        });

        // プロンプトの編集（リアルタイム保存）
        let saveTimer;
        this.addEventListener(container, "input", async (e) => {
          if (e.target.classList.contains("slot-prompt-edit")) {
            const slotId = parseInt(e.target.dataset.slotId);
            const newPrompt = e.target.value;

            // デバウンス処理
            clearTimeout(saveTimer);
            saveTimer = setTimeout(async () => {
              await this.handlePromptEdit(slotId, newPrompt);
            }, 500);
          }
        });

        // その他のボタンイベント
        this.setupButtonEvents();
      }

      /**
       * ボタンイベントの設定
       */
      setupButtonEvents() {
        // 結合プレビューボタン
        const previewBtn = this.getElement("#combine-preview");
        if (previewBtn) {
          this.addEventListener(previewBtn, "click", () => {
            this.showCombinePreview();
          });
        }

        // すべてクリアボタン
        const clearAllBtn = this.getElement("#clear-all-slots-tab");
        if (clearAllBtn) {
          this.addEventListener(clearAllBtn, "click", async () => {
            await this.handleClearAll();
          });
        }

        // エクスポートボタン
        const exportBtn = this.getElement("#export-slots");
        if (exportBtn) {
          this.addEventListener(exportBtn, "click", () => {
            this.exportSlots();
          });
        }

        // インポートボタン
        const importBtn = this.getElement("#import-slots");
        if (importBtn) {
          this.addEventListener(importBtn, "click", () => {
            this.importSlots();
          });
        }
      }

      /**
       * コンテナ内のクリックイベント処理
       */
      async handleContainerClick(e) {
        const slotId = parseInt(e.target.dataset.slotId);

        if (e.target.classList.contains("slot-select-btn")) {
          // スロット選択
          await this.slotManager.switchSlot(slotId);
          this.updateDisplay();
        } else if (e.target.classList.contains("slot-clear-btn")) {
          // クリア
          const shouldConfirm =
            AppState.userSettings.optionData?.isDeleteCheck !== false;

          if (
            !shouldConfirm ||
            confirm(`スロット${slotId + 1}をクリアしますか？`)
          ) {
            if (slotId === this.slotManager.currentSlot) {
              await this.slotManager.clearCurrentSlot();
            } else {
              await this.slotManager.clearSlot(slotId);
            }
            this.updateDisplay();
          }
        }
      }

      /**
       * プロンプト編集の処理
       */
      async handlePromptEdit(slotId, newPrompt) {
        // 直接スロットを更新
        if (slotId === this.slotManager.currentSlot) {
          // 現在のスロットの場合
          promptEditor.init(newPrompt);
          const generatePrompt = document.getElementById("generatePrompt");
          if (generatePrompt) {
            generatePrompt.value = newPrompt;
          }
          await this.slotManager.saveCurrentSlot();
        } else {
          // 他のスロットの場合
          this.slotManager.slots[slotId].prompt = newPrompt;
          this.slotManager.slots[slotId].isUsed = newPrompt.length > 0;
          this.slotManager.slots[slotId].lastModified =
            newPrompt.length > 0 ? Date.now() : null;
          await this.slotManager.saveToStorage();
        }

        // UI更新
        this.slotManager.updateUI();
        this.updateDisplay();
      }

      /**
       * 結合プレビューを表示
       */
      showCombinePreview() {
        const combined = this.slotManager.getCombinedPrompt();
        const usedSlots = this.slotManager.getUsedSlots();

        if (usedSlots.length === 0) {
          alert("使用中のスロットがありません");
          return;
        }

        const preview =
          `【結合プレビュー】\n\n` +
          `使用スロット: ${usedSlots.map((s) => s.name).join(", ")}\n\n` +
          `結合結果:\n${combined}\n\n` +
          `文字数: ${combined.length}`;

        alert(preview);
      }

      /**
       * すべてのスロットをクリア
       */
      async handleClearAll() {
        const shouldConfirm =
          AppState.userSettings.optionData?.isDeleteCheck !== false;

        if (!shouldConfirm || confirm("すべてのスロットをクリアしますか？")) {
          await this.slotManager.clearAllSlots();
          this.updateDisplay();
        }
      }

      /**
       * スロット表示を更新
       */
      updateDisplay() {
        const container = this.getElement("#slot-container");
        if (!container) return;

        // 現在のスロット情報をログ出力（デバッグ用）
        console.log("Updating slot tab display:", {
          currentSlot: this.slotManager.currentSlot,
          slots: this.slotManager.slots.map((s) => ({
            id: s.id,
            isUsed: s.isUsed,
            prompt: s.prompt?.substring(0, 20) + "...",
          })),
        });

        container.innerHTML = "";

        // 使用中のスロット数を更新
        const usedCount = this.slotManager.getUsedSlotsCount();
        const countSpan = document.getElementById("used-slots-count");
        if (countSpan) {
          countSpan.textContent = usedCount;
        }

        // 各スロットのカードを作成
        this.slotManager.getAllSlotInfo().forEach((info) => {
          const slotCard = this.createSlotCard(info);
          container.appendChild(slotCard);
        });
      }

      /**
       * スロットカードを作成
       */
      createSlotCard(info) {
        const card = document.createElement("div");
        card.className = "slot-card";
        card.dataset.slotId = info.id;

        // カードのスタイル
        card.style.cssText = `
          border: 2px solid ${info.isCurrent ? "#2196F3" : "#ddd"};
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 10px;
          background: ${info.isUsed ? "#fff" : "#f5f5f5"};
          ${info.isCurrent ? "box-shadow: 0 2px 8px rgba(33,150,243,0.3);" : ""}
          transition: all 0.3s ease;
        `;

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="display: flex; align-items: center;">
              <span style="font-size: 18px; font-weight: bold; margin-right: 10px; color: ${
                info.isCurrent ? "#2196F3" : "#666"
              };">
                ${info.id + 1}
              </span>
              <input type="text"
                     class="slot-name-edit"
                     data-slot-id="${info.id}"
                     value="${info.name || ""}"
                     placeholder="スロット名を入力"
                     style="border: none; background: transparent; font-size: 16px; font-weight: ${
                       info.isUsed ? "bold" : "normal"
                     }; color: ${info.isUsed ? "#333" : "#999"};"
                     ${!info.isUsed ? "disabled" : ""}>
            </div>
            <div>
              <button class="slot-select-btn" data-slot-id="${
                info.id
              }">選択</button>
              <button class="slot-clear-btn" data-slot-id="${info.id}" ${
          !info.isUsed ? "disabled" : ""
        }>クリア</button>
            </div>
          </div>

          <div style="position: relative;">
            <textarea class="slot-prompt-edit"
                      data-slot-id="${info.id}"
                      placeholder="${
                        info.isUsed ? "プロンプト内容" : "このスロットは空です"
                      }"
                      style="width: 95%; min-height: 30px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical; font-family: monospace; font-size: 12px;"
                      ${!info.isUsed ? "disabled" : ""}>${
          info.isUsed && this.slotManager.slots[info.id]
            ? this.slotManager.slots[info.id].prompt
            : ""
        }</textarea>

            ${
              info.isUsed
                ? `
              <div style="position: absolute; bottom: 5px; right: 5px; font-size: 11px; color: #999;">
                ${this.slotManager.slots[info.id].prompt.length} 文字
              </div>
            `
                : ""
            }
          </div>

          ${
            info.isCurrent
              ? '<div style="margin-top: 5px; color: #2196F3; font-size: 12px;">現在選択中</div>'
              : ""
          }
        `;

        // ホバー効果
        if (!info.isCurrent) {
          card.addEventListener("mouseenter", () => {
            card.style.borderColor = "#90CAF9";
            card.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
          });

          card.addEventListener("mouseleave", () => {
            card.style.borderColor = "#ddd";
            card.style.boxShadow = "none";
          });
        }

        return card;
      }

      /**
       * スロットをエクスポート
       */
      exportSlots() {
        const exportData = {
          version: "1.0",
          exportDate: new Date().toISOString(),
          slots: this.slotManager.slots,
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `PromptSlots_${
          new Date().toISOString().split("T")[0]
        }.json`;
        link.click();

        URL.revokeObjectURL(url);

        ErrorHandler.notify("スロットをエクスポートしました", {
          type: ErrorHandler.NotificationType.TOAST,
          messageType: "success",
        });
      }

      /**
       * スロットをインポート
       */
      importSlots() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";

        input.addEventListener("change", async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (!data.slots || !Array.isArray(data.slots)) {
              throw new Error("無効なスロットファイル");
            }

            // インポート確認
            if (confirm("現在のスロットを上書きしますか？")) {
              this.slotManager.slots = data.slots;
              await this.slotManager.saveToStorage();
              this.updateDisplay();

              ErrorHandler.notify("スロットをインポートしました", {
                type: ErrorHandler.NotificationType.TOAST,
                messageType: "success",
              });
            }
          } catch (error) {
            ErrorHandler.notify("インポートに失敗しました", {
              type: ErrorHandler.NotificationType.TOAST,
              messageType: "error",
            });
          }
        });

        input.click();
      }
    }

    // グローバルに公開
    if (typeof window !== "undefined") {
      window.SlotTab = SlotTab;
    }
  }

  // 初期実行
  defineSlotTab();
})();
