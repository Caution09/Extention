/**
 * slot-tab.js - スロットタブモジュール
 * Phase 8.5: 動的スロット管理UI対応版
 */

// TabManagerが利用可能になるまで待つ
(function () {
  "use strict";

  // TabManagerが定義されるまで待機
  function defineSlotTab() {
    if (typeof TabManager === "undefined") {
      setTimeout(defineSlotTab, 10);
      return;
    }

    // SlotTabクラスの定義
    class SlotTab extends TabManager {
      constructor(app) {
        super(app, {
          tabId: "slotTabBody",
          tabButtonId: "slotTab",
          tabIndex: 3,
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
        // スロット追加ボタン
        const addSlotBtn = this.getElement("#add-slot-btn");
        if (addSlotBtn) {
          this.addEventListener(addSlotBtn, "click", () => {
            this.slotManager.addNewSlot();
            this.updateDisplay();
          });
        }

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

          if (!shouldConfirm || confirm(`スロットの内容をクリアしますか？`)) {
            const slotIndex = this.slotManager.slots.findIndex(
              (s) => s.id === slotId
            );
            if (slotIndex === this.slotManager.currentSlot) {
              await this.slotManager.clearCurrentSlot();
            } else {
              await this.slotManager.clearSlot(slotId);
            }
            this.updateDisplay();
          }
        } else if (e.target.classList.contains("slot-delete-btn")) {
          // 削除
          const shouldConfirm =
            AppState.userSettings.optionData?.isDeleteCheck !== false;

          const slot = this.slotManager.slots.find((s) => s.id === slotId);
          const slotInfo = this.slotManager.getSlotInfo(slotId);
          const confirmMessage = slot.isUsed
            ? `使用中のスロット${
                slotInfo.displayNumber
              }を削除しますか？\n内容: ${slot.prompt.substring(0, 30)}...`
            : `スロット${slotInfo.displayNumber}を削除しますか？`;

          if (!shouldConfirm || confirm(confirmMessage)) {
            this.slotManager.deleteSlot(slotId);
            this.updateDisplay();
          }
        }
      }

      /**
       * プロンプト編集の処理
       */
      async handlePromptEdit(slotId, newPrompt) {
        const slotIndex = this.slotManager.slots.findIndex(
          (s) => s.id === slotId
        );

        if (slotIndex === this.slotManager.currentSlot) {
          // 現在のスロットの場合
          promptEditor.init(newPrompt);
          const generatePrompt = document.getElementById("generatePrompt");
          if (generatePrompt) {
            generatePrompt.value = newPrompt;
          }
          await this.slotManager.saveCurrentSlot();
        } else {
          // 他のスロットの場合
          const slot = this.slotManager.slots.find((s) => s.id === slotId);
          if (slot) {
            slot.prompt = newPrompt;
            slot.isUsed = newPrompt.length > 0;
            slot.lastModified = newPrompt.length > 0 ? Date.now() : null;
            await this.slotManager.saveToStorage();
          }
        }

        // UI更新
        this.slotManager.updateUI();
        this.updateDisplay();
      }

      /**
       * 結合プレビューを表示（モーダルダイアログ版）
       */
      showCombinePreview() {
        const combined = this.slotManager.getCombinedPrompt();
        const usedSlots = this.slotManager.getUsedSlots();

        if (usedSlots.length === 0) {
          ErrorHandler.notify("使用中のスロットがありません", {
            type: ErrorHandler.NotificationType.TOAST,
            messageType: "warning",
            duration: 2000,
          });
          return;
        }

        // 既存のモーダルがあれば削除
        const existingModal = document.getElementById("combine-preview-modal");
        if (existingModal) {
          existingModal.remove();
          return;
        }

        // モーダルを作成
        const modal = document.createElement("div");
        modal.id = "combine-preview-modal";
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
        `;

        // コンテンツ部分
        const content = document.createElement("div");
        content.style.cssText = `
          background: white;
          padding: 25px;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
          position: relative;
        `;

        // スロット情報のHTML生成
        const slotListHTML = usedSlots
          .map(
            (slot) => `
            <tr>
              <td style="padding: 5px 15px 5px 5px; font-weight: bold;">スロット${
                slot.id
              }:</td>
              <td style="padding: 5px;">${slot.name || "(名前なし)"}</td>
            </tr>
          `
          )
          .join("");

        // 結合結果を見やすく表示（長い場合は折り返し）
        const formattedPrompt = combined
          .split(",")
          .map((part) => part.trim())
          .filter((part) => part.length > 0)
          .join(",<br>");

        content.innerHTML = `
          <h3 style="margin-top: 0; margin-bottom: 20px;">結合プレビュー</h3>

          <div style="margin-bottom: 20px;">
            <h4 style="margin-bottom: 10px; color: #666;">使用中のスロット (${usedSlots.length}個)</h4>
            <table style="width: 100%; border-collapse: collapse;">
              ${slotListHTML}
            </table>
          </div>

          <div style="margin-bottom: 20px;">
            <h4 style="margin-bottom: 10px; color: #666;">結合結果</h4>
            <div style="
              background: #f5f5f5;
              padding: 15px;
              border-radius: 4px;
              font-family: monospace;
              font-size: 13px;
              line-height: 1.5;
              max-height: 300px;
              overflow-y: auto;
              word-break: break-word;
            ">
              ${formattedPrompt}
            </div>
          </div>

          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
          ">
            <div style="color: #666; font-size: 14px;">
              文字数: <strong>${combined.length}</strong>
            </div>
            <div>
              <button id="copy-combined" style="
                margin-right: 10px;
                padding: 8px 16px;
                background: #2196F3;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
              ">コピー</button>
              <button id="close-preview" style="
                padding: 8px 16px;
                background: #666;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
              ">閉じる</button>
            </div>
          </div>
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        // イベントリスナー設定
        modal.addEventListener("click", (e) => {
          if (e.target === modal) {
            modal.remove();
          }
        });

        document
          .getElementById("close-preview")
          .addEventListener("click", () => {
            modal.remove();
          });

        document
          .getElementById("copy-combined")
          .addEventListener("click", () => {
            navigator.clipboard.writeText(combined).then(() => {
              ErrorHandler.notify("結合プロンプトをコピーしました", {
                type: ErrorHandler.NotificationType.TOAST,
                messageType: "success",
                duration: 2000,
              });
            });
          });

        // ESCキーで閉じる
        const handleEsc = (e) => {
          if (e.key === "Escape") {
            modal.remove();
            document.removeEventListener("keydown", handleEsc);
          }
        };
        document.addEventListener("keydown", handleEsc);
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

        container.innerHTML = "";

        // 使用中のスロット数を更新
        const usedCount = this.slotManager.getUsedSlotsCount();
        const totalCount = this.slotManager.slots.length;
        const infoSpan = document.getElementById("slot-info");
        if (infoSpan) {
          infoSpan.innerHTML = `
            使用中: <span id="used-slots-count">${usedCount}</span>/${totalCount}
            <button id="add-slot-btn" style="margin-left: 20px;">+ スロット追加</button>
            <button id="combine-preview" style="float: right;">結合プレビュー</button>
          `;
        }

        // 追加ボタンのイベントリスナーを再設定
        const addBtn = document.getElementById("add-slot-btn");
        if (addBtn) {
          addBtn.addEventListener("click", () => {
            this.slotManager.addNewSlot();
            this.updateDisplay();
          });
        }

        const previewBtn = document.getElementById("combine-preview");
        if (previewBtn) {
          previewBtn.addEventListener("click", () => {
            this.showCombinePreview();
          });
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

        // 削除ボタンの無効化判定
        const canDelete =
          this.slotManager.slots.length > this.slotManager.minSlots &&
          !info.isCurrent;

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="display: flex; align-items: center;">
              <span style="font-size: 18px; font-weight: bold; margin-right: 10px; color: ${
                info.isCurrent ? "#2196F3" : "#666"
              };">
                ${info.displayNumber}
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
              <button class="slot-delete-btn" data-slot-id="${info.id}" ${
          !canDelete ? "disabled" : ""
        } style="${
          !canDelete ? "opacity: 0.5; cursor: not-allowed;" : ""
        }">削除</button>
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
          info.isUsed
            ? this.slotManager.slots.find((s) => s.id === info.id)?.prompt || ""
            : ""
        }</textarea>

            ${
              info.isUsed
                ? `
              <div style="position: absolute; bottom: 5px; right: 5px; font-size: 11px; color: #999;">
                ${
                  this.slotManager.slots.find((s) => s.id === info.id)?.prompt
                    ?.length || 0
                } 文字
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
          version: "2.0", // バージョンアップ
          exportDate: new Date().toISOString(),
          slots: this.slotManager.slots,
          currentSlot: this.slotManager.currentSlot,
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
              this.slotManager.currentSlot = data.currentSlot || 0;
              this.slotManager._nextId =
                Math.max(...data.slots.map((s) => s.id || 0)) + 1;

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
