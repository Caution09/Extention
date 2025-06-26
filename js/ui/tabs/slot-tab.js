/**
 * slot-tab.js - スロットタブモジュール
 * Phase 8.5: 複数プロンプトスロット管理
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
          tabIndex: 4, // CONSTANTS.TABS.SLOT
        });

        // スロットマネージャーへの参照
        this.slotManager = null;

        // DOM要素のキャッシュ
        this.elements = {
          container: null,
          clearAllBtn: null,
          exportBtn: null,
          importBtn: null,
        };
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

        // DOM要素をキャッシュ
        this.cacheElements();

        // イベントリスナーを設定
        this.setupEventListeners();

        // 固定ボタンのイベントリスナーを設定（追加）
        this.setupFixedButtonListeners();

        // 初期表示を更新
        this.updateDisplay();

        // 抽出完了イベントのリスナーを設定
        this.setupExtractionListeners();
      }

      /**
       * 固定ボタンのイベントリスナーを設定
       */
      setupFixedButtonListeners() {
        // スロット追加ボタン
        const addBtn = document.getElementById("add-slot-btn");
        if (addBtn) {
          addBtn.addEventListener("click", () => {
            this.slotManager.addNewSlot();
            this.updateDisplay();
          });
        }

        // 結合プレビューボタン（IDを修正）
        const previewBtn = document.getElementById("combine-preview-btn");
        if (previewBtn) {
          previewBtn.addEventListener("click", () => {
            this.showCombinePreview();
          });
        }

        // すべてクリアボタン
        const clearAllBtn = document.getElementById("clear-all-slots-tab");
        if (clearAllBtn) {
          clearAllBtn.addEventListener("click", () => {
            this.handleClearAll();
          });
        }

        // エクスポートボタン
        const exportBtn = document.getElementById("export-slots");
        if (exportBtn) {
          exportBtn.addEventListener("click", () => {
            this.handleExport();
          });
        }

        // インポートボタン
        const importBtn = document.getElementById("import-slots");
        if (importBtn) {
          importBtn.addEventListener("click", () => {
            this.handleImport();
          });
        }
      }

      /**
       * 抽出イベントのリスナー設定
       */
      setupExtractionListeners() {
        // 個別のスロット抽出完了
        window.addEventListener("slotExtractionComplete", (event) => {
          this.updateSlotExtraction(
            event.detail.slotId,
            event.detail.extraction
          );
        });

        // 全体の抽出完了（Generate後）
        window.addEventListener("allExtractionsComplete", () => {
          if (this.isCurrentTab()) {
            // 現在スロットタブが表示されている場合のみ更新
            this.refreshExtractionDisplays();
          }
        });
      }

      /**
       * 現在のタブかどうかを確認
       */
      isCurrentTab() {
        const slotTab = document.getElementById("slotTab");
        return slotTab && slotTab.classList.contains("is-active");
      }

      /**
       * DOM要素をキャッシュ
       */
      cacheElements() {
        this.elements.container = this.getElement("#slot-container");
        this.elements.clearAllBtn = this.getElement("#clear-all-slots-tab");
        this.elements.exportBtn = this.getElement("#export-slots");
        this.elements.importBtn = this.getElement("#import-slots");
      }

      /**
       * スロット情報を更新
       */
      updateDisplay() {
        const container = this.elements.container;
        if (!container) return;

        console.log(
          "Updating slot display with slots:",
          this.slotManager.slots
        );

        container.innerHTML = "";

        // 使用中のスロット数を更新
        const usedCount = this.slotManager.getUsedSlotsCount();
        const totalCount = this.slotManager.slots.length;
        const countSpan = document.getElementById("used-slots-count");
        if (countSpan) {
          countSpan.textContent = `${usedCount}/${totalCount}`;
        }

        // 各スロットのカードを作成
        this.slotManager.slots.forEach((slot, index) => {
          console.log(`Creating card for slot ${slot.id}:`, {
            mode: slot.mode,
            category: slot.category,
          });

          const info = this.slotManager.getSlotInfo(slot.id);
          // 表示番号を現在の順序に基づいて上書き
          info.displayNumber = index + 1;
          const slotCard = this.createSlotCard(info);
          container.appendChild(slotCard);
        });

        // ソート機能を設定
        this.setupSortable();
      }

      /**
       * スロットカードを作成
       */
      createSlotCard(info) {
        const card = document.createElement("div");
        card.dataset.slotId = info.id;

        // 現在のスロットの設定を取得
        const slot = this.slotManager.slots.find((s) => s.id === info.id);
        const isExtractionMode =
          slot?.mode === "random" || slot?.mode === "sequential";

        // カードのクラスを設定
        card.className = `slot-card ${
          info.isCurrent ? "slot-card-current" : ""
        } ${isExtractionMode ? "slot-card-extraction" : ""} ${
          info.isUsed ? "slot-card-used" : ""
        }`;

        // 削除ボタンの無効化判定
        const canDelete =
          this.slotManager.slots.length > this.slotManager.minSlots &&
          !info.isCurrent;

        card.innerHTML = `
    <div class="slot-drag-handle">☰</div>

    <div class="slot-header">
      <div class="slot-header-left">
        <span class="slot-number ${
          info.isCurrent ? "slot-number-current" : ""
        }">
          ${info.displayNumber}
        </span>
        <input type="text"
               class="slot-name-edit"
               data-slot-id="${info.id}"
               value="${info.name || ""}"
               placeholder="スロット名を入力">
      </div>
      <div class="slot-actions">
        <button class="slot-select-btn" data-slot-id="${info.id}"
                ${isExtractionMode ? "disabled" : ""}>選択</button>
        <button class="slot-clear-btn" data-slot-id="${info.id}">クリア</button>
        <button class="slot-delete-btn" data-slot-id="${info.id}"
                ${!canDelete ? "disabled" : ""}>削除</button>
      </div>
    </div>

    <!-- モード選択ラジオボタン -->
    <div class="slot-mode-container">
      <label class="slot-mode-label">
        <input type="radio" name="slot-mode-${info.id}" value="normal"
               class="slot-mode-radio" data-slot-id="${info.id}"
               ${!slot?.mode || slot.mode === "normal" ? "checked" : ""}>
        通常
      </label>
      <label class="slot-mode-label">
        <input type="radio" name="slot-mode-${info.id}" value="random"
               class="slot-mode-radio" data-slot-id="${info.id}"
               ${slot?.mode === "random" ? "checked" : ""}>
        ランダム抽出
      </label>
      <label class="slot-mode-label">
        <input type="radio" name="slot-mode-${info.id}" value="sequential"
               class="slot-mode-radio" data-slot-id="${info.id}"
               ${slot?.mode === "sequential" ? "checked" : ""}>
        連続抽出
      </label>
    </div>

    <!-- 通常モード用テキストエリア -->
    <div class="normal-mode-content" style="display: ${
      !isExtractionMode ? "block" : "none"
    };">
      <div class="slot-prompt-container">
        <textarea class="slot-prompt-edit"
                  data-slot-id="${info.id}"
                  placeholder="${
                    info.isUsed ? "プロンプト内容" : "このスロットは空です"
                  }"
                  ${!info.isUsed ? "disabled" : ""}>${
          info.isUsed
            ? this.slotManager.slots.find((s) => s.id === info.id)?.prompt || ""
            : ""
        }</textarea>
        ${
          info.isUsed
            ? `<div class="slot-char-count">${
                this.slotManager.slots.find((s) => s.id === info.id)?.prompt
                  ?.length || 0
              } 文字</div>`
            : ""
        }
      </div>
    </div>

    <!-- 抽出モード用カテゴリー選択 -->
    <div class="extraction-mode-content" style="display: ${
      isExtractionMode ? "block" : "none"
    };">
      <div class="category-filters">
        <div class="category-filter-item">
          <label class="category-filter-label">大項目:</label>
          <select class="category-big-select" data-slot-id="${info.id}">
            <option value="">すべて</option>
          </select>
        </div>
        <div class="category-filter-item">
          <label class="category-filter-label">中項目:</label>
          <select class="category-middle-select" data-slot-id="${info.id}"
                  ${!slot?.category?.big ? "disabled" : ""}>
            <option value="">すべて</option>
          </select>
        </div>
      </div>
      ${
        slot?.mode === "sequential"
          ? `<div class="sequential-info">
              現在のインデックス: <span class="sequential-index">${
                slot.sequentialIndex || 0
              }</span>
            </div>`
          : ""
      }
      <div class="current-extraction-display">
        ${
          slot?.currentExtraction
            ? `<div class="extraction-display-content">
                <strong>現在:</strong> ${slot.currentExtraction}
                <span class="extraction-timestamp">${
                  slot.lastExtractionTime
                    ? new Date(slot.lastExtractionTime).toLocaleTimeString()
                    : ""
                }</span>
              </div>`
            : ""
        }
      </div>
    </div>
  `;

        // カテゴリー選択肢を設定
        if (isExtractionMode) {
          this.setupCategorySelectors(card, slot);
        }

        return card;
      }

      /**
       * カテゴリーセレクターを設定
       */
      setupCategorySelectors(card, slot) {
        const bigSelect = card.querySelector(".category-big-select");
        const middleSelect = card.querySelector(".category-middle-select");

        if (!bigSelect) return;

        // オプションを追加
        bigSelect.innerHTML = '<option value="">すべて</option>';
        const bigCategories = this.getCategoryOptions("big");
        bigCategories.forEach((cat) => {
          const option = document.createElement("option");
          option.value = cat;
          option.textContent = cat;
          bigSelect.appendChild(option);
        });

        // DOMが更新された後に値を設定
        requestAnimationFrame(() => {
          if (slot.category && slot.category.big) {
            bigSelect.value = slot.category.big;
            this.updateMiddleCategories(middleSelect, slot.category.big);
            middleSelect.disabled = false;

            if (slot.category.middle) {
              requestAnimationFrame(() => {
                middleSelect.value = slot.category.middle;
              });
            }
          }
        });

        middleSelect.addEventListener("change", async (e) => {
          if (!slot.category) {
            slot.category = {};
          }
          slot.category.middle = e.target.value;

          // 連続抽出モードの場合はインデックスをリセット
          if (slot.mode === "sequential") {
            slot.sequentialIndex = 0;
            const indexSpan = card.querySelector(".sequential-index");
            if (indexSpan) {
              indexSpan.textContent = "0";
            }
          }

          await this.slotManager.saveToStorage();
        });
      }

      /**
       * カテゴリーオプションを取得
       */
      getCategoryOptions(type) {
        const categories = new Set();

        if (type === "big") {
          AppState.data.localPromptList.forEach((item) => {
            if (item.data && item.data[0]) {
              categories.add(item.data[0]);
            }
          });
          AppState.data.masterPrompts.forEach((item) => {
            if (item.data && item.data[0]) {
              categories.add(item.data[0]);
            }
          });
        }

        return Array.from(categories).sort();
      }

      /**
       * 中項目カテゴリーを更新
       */
      updateMiddleCategories(select, bigCategory) {
        const categories = new Set();

        AppState.data.localPromptList.forEach((item) => {
          if (item.data && item.data[0] === bigCategory && item.data[1]) {
            categories.add(item.data[1]);
          }
        });
        AppState.data.masterPrompts.forEach((item) => {
          if (item.data && item.data[0] === bigCategory && item.data[1]) {
            categories.add(item.data[1]);
          }
        });

        // まずクリアしてから追加
        select.innerHTML = '<option value="">すべて</option>';

        Array.from(categories)
          .sort()
          .forEach((cat) => {
            const option = document.createElement("option");
            option.value = cat;
            option.textContent = cat;
            select.appendChild(option);
          });
      }

      /**
       * ソート機能を設定
       */
      setupSortable() {
        const container = this.elements.container;
        if (!container) return;

        $(container).sortable({
          handle: ".slot-drag-handle",
          axis: "y",
          containment: "parent",
          cursor: "move",
          opacity: 0.7,
          tolerance: "pointer",
          placeholder: "slot-card-placeholder",

          // ソート開始時
          start: (event, ui) => {
            this.isSorting = true;
            // プレースホルダーの高さを設定
            ui.placeholder.height(ui.item.height());
          },

          // ソート終了時
          stop: (event, ui) => {
            this.isSorting = false;
          },

          // 更新時
          update: async (event, ui) => {
            // 新しい順序を取得
            const newOrder = Array.from(container.children).map(
              (card) => parseInt(card.dataset.slotId) || 0
            );

            console.log("New slot order:", newOrder);

            // スロットマネージャーの順序を更新
            this.slotManager.reorderSlots(newOrder);

            // ストレージに保存
            await this.slotManager.saveToStorage();

            // 番号表示を更新（カード全体を再作成せずに番号だけ更新）
            this.updateSlotNumbers();
          },
        });
      }

      /**
       * スロット番号のみを更新（新規メソッド）
       */
      updateSlotNumbers() {
        const container = this.elements.container;
        if (!container) return;

        // 各カードの番号を更新
        Array.from(container.children).forEach((card, index) => {
          const numberSpan = card.querySelector(".slot-number");
          if (numberSpan) {
            const displayNumber = index + 1;
            numberSpan.textContent = displayNumber;

            // 現在のスロットかどうかチェック
            const slotId = parseInt(card.dataset.slotId);
            const isCurrentSlot =
              this.slotManager.slots[this.slotManager.currentSlot]?.id ===
              slotId;

            if (isCurrentSlot) {
              numberSpan.classList.add("slot-number-current");
              card.classList.add("slot-card-current");
            } else {
              numberSpan.classList.remove("slot-number-current");
              card.classList.remove("slot-card-current");
            }
          }
        });

        // 使用中スロット数も更新
        const usedCount = this.slotManager.getUsedSlotsCount();
        const totalCount = this.slotManager.slots.length;
        const countSpan = document.getElementById("used-slots-count");
        if (countSpan) {
          countSpan.textContent = `${usedCount}/${totalCount}`;
        }
      }

      /**
       * 結合プレビューを表示（モーダルダイアログ版）
       */
      showCombinePreview() {
        const modal = document.getElementById("combine-preview-modal");
        if (!modal) return;

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

        // スロット数を更新
        document.getElementById("used-slots-count-preview").textContent =
          usedSlots.length;

        // スロット情報のテーブルを更新
        const slotTable = document.getElementById("slot-info-table");
        slotTable.innerHTML = usedSlots
          .map((slot) => {
            let description = slot.name || "(名前なし)";

            if (slot.mode === "random" || slot.mode === "sequential") {
              description += ` <span class="extraction-mode-label">[${
                slot.mode === "random" ? "ランダム" : "連続"
              }抽出]</span>`;
              if (slot.category?.big) {
                description += ` ${slot.category.big}`;
                if (slot.category.middle) {
                  description += ` > ${slot.category.middle}`;
                }
              }
              if (slot.currentExtraction) {
                description += `<br><small class="current-extraction-info">現在: ${slot.currentExtraction}</small>`;
              }
            }

            return `
        <tr>
          <td class="slot-info-label">スロット${slot.id}:</td>
          <td class="slot-info-content">${description}</td>
        </tr>
      `;
          })
          .join("");

        // 結合結果を更新
        const resultDiv = document.getElementById("combine-preview-result");
        const formattedPrompt = combined
          .split(",")
          .map((part) => part.trim())
          .filter((part) => part.length > 0)
          .join(",<br>");
        resultDiv.innerHTML = formattedPrompt;

        // 文字数を更新
        document.getElementById("combined-char-count").textContent =
          combined.length;

        // モーダルを表示
        modal.style.display = "flex";

        // イベントリスナー設定（既存のリスナーを削除してから追加）
        const oldModal = modal.cloneNode(true);
        modal.parentNode.replaceChild(oldModal, modal);

        // 新しい参照を取得
        const newModal = document.getElementById("combine-preview-modal");

        // 背景クリックで閉じる
        newModal.addEventListener("click", (e) => {
          if (e.target === newModal) {
            newModal.style.display = "none";
          }
        });

        // 閉じるボタン
        document
          .getElementById("close-preview")
          .addEventListener("click", () => {
            newModal.style.display = "none";
          });

        // コピーボタン
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
            newModal.style.display = "none";
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
       * コンテナ内のクリックイベントを処理
       */
      async handleContainerClick(e) {
        // ソート中はクリックイベントを無視
        if (this.isSorting) return;

        const target = e.target;

        // 選択ボタン
        if (target.classList.contains("slot-select-btn")) {
          const slotId = parseInt(target.dataset.slotId);
          console.log("Selecting slot:", slotId); // デバッグ用

          // switchSlotメソッドを使用（selectSlotではない）
          await this.slotManager.switchSlot(slotId);
          this.updateDisplay();
        }

        // クリアボタン
        else if (target.classList.contains("slot-clear-btn")) {
          const slotId = parseInt(target.dataset.slotId);
          const shouldConfirm =
            AppState.userSettings.optionData?.isDeleteCheck !== false;

          if (
            !shouldConfirm ||
            confirm("このスロットの内容をクリアしますか？")
          ) {
            await this.slotManager.clearSlot(slotId);
            this.updateDisplay();
          }
        }

        // 削除ボタン
        else if (target.classList.contains("slot-delete-btn")) {
          const slotId = parseInt(target.dataset.slotId);
          const shouldConfirm =
            AppState.userSettings.optionData?.isDeleteCheck !== false;

          if (!shouldConfirm || confirm("このスロットを削除しますか？")) {
            await this.slotManager.deleteSlot(slotId);
            this.updateDisplay();
          }
        }
      }

      /**
       * スロットのエクスポート
       */
      async handleExport() {
        const exportData = this.slotManager.exportSlots();
        const jsonStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `prompt_slots_${
          new Date().toISOString().split("T")[0]
        }.json`;
        a.click();

        URL.revokeObjectURL(url);

        ErrorHandler.notify("スロットをエクスポートしました", {
          type: ErrorHandler.NotificationType.TOAST,
          messageType: "success",
          duration: 2000,
        });
      }

      /**
       * スロットのインポート
       */
      async handleImport() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";

        input.addEventListener("change", async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (this.slotManager.validateImportData(data)) {
              await this.slotManager.importSlots(data);
              this.updateDisplay();

              ErrorHandler.notify("スロットをインポートしました", {
                type: ErrorHandler.NotificationType.TOAST,
                messageType: "success",
                duration: 2000,
              });
            } else {
              throw new Error("無効なデータ形式");
            }
          } catch (error) {
            ErrorHandler.handle(error, "インポートエラー");
          }
        });

        input.click();
      }

      /**
       * コンテナ内の変更イベントを処理
       */
      async handleContainerChange(e) {
        const target = e.target;

        // モード変更
        if (target.classList.contains("slot-mode-radio")) {
          const slotId = parseInt(target.dataset.slotId);
          const newMode = target.value;
          const slot = this.slotManager.slots.find((s) => s.id === slotId);

          if (slot) {
            slot.mode = newMode;

            // カテゴリー情報を初期化（まだ存在しない場合）
            if (!slot.category) {
              slot.category = { big: "", middle: "" };
            }

            // 連続抽出の場合はインデックスを初期化
            if (newMode === "sequential") {
              slot.sequentialIndex = 0;
            }

            await this.slotManager.saveToStorage();

            // カードを再描画して表示を更新
            const card = target.closest(".slot-card");
            if (card) {
              const updatedInfo = this.slotManager.getSlotInfo(slotId);
              const slotIndex = this.slotManager.slots.findIndex(
                (s) => s.id === slotId
              );
              updatedInfo.displayNumber = slotIndex + 1;

              const newCard = this.createSlotCard(updatedInfo);
              card.replaceWith(newCard);
            }
          }
        }

        // 名前の変更
        else if (target.classList.contains("slot-name-edit")) {
          const slotId = parseInt(target.dataset.slotId);
          const newName = target.value;
          await this.slotManager.setSlotName(slotId, newName);
        }

        // プロンプトの変更
        else if (target.classList.contains("slot-prompt-edit")) {
          await this.handlePromptEdit(target);
        }
      }

      // 新規：スロットの抽出表示を更新
      updateSlotExtraction(slotId, extraction) {
        const slotCard = document.querySelector(
          `.slot-card[data-slot-id="${slotId}"]`
        );
        if (!slotCard) return;

        // インジケーターを表示
        let indicator = slotCard.querySelector(".update-indicator");
        if (!indicator) {
          indicator = this.createUpdateIndicator(slotCard);
        }

        indicator.style.display = "inline-block";

        // 抽出表示を更新
        const extractionDisplay = slotCard.querySelector(
          ".current-extraction-display"
        );
        if (extractionDisplay) {
          extractionDisplay.innerHTML = `
      <div class="extraction-display-content">
        <strong>現在:</strong> ${extraction}
        <span class="extraction-timestamp">${new Date().toLocaleTimeString()}</span>
      </div>
    `;
        }

        // インジケーターを隠す
        setTimeout(() => {
          indicator.style.display = "none";
        }, 500);
      }

      createUpdateIndicator(slotCard) {
        const indicator = document.createElement("span");
        indicator.className = "update-indicator";
        indicator.innerHTML = "🔄";
        slotCard.appendChild(indicator);
        return indicator;
      }

      // 新規：すべての抽出表示を更新
      refreshExtractionDisplays() {
        this.slotManager.slots.forEach((slot) => {
          if (
            slot.currentExtraction &&
            (slot.mode === "random" || slot.mode === "sequential")
          ) {
            this.updateSlotExtraction(slot.id, slot.currentExtraction);
          }
        });
      }

      /**
       * タブ表示時の処理
       */
      async onShow() {
        console.log("Switching to slot tab, updating display...");

        // 現在のスロットを保存
        await this.slotManager.saveCurrentSlot();

        // ストレージから最新データを再読み込み
        await this.slotManager.loadFromStorage();

        // 表示を更新
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
          await this.handleContainerChange(e);
        });

        // プロンプトの入力（リアルタイム保存）
        this.addEventListener(container, "input", async (e) => {
          if (e.target.classList.contains("slot-prompt-edit")) {
            await this.handleContainerChange(e);
          }
        });

        // その他のボタン
        if (this.elements.clearAllBtn) {
          this.addEventListener(this.elements.clearAllBtn, "click", () =>
            this.handleClearAll()
          );
        }

        if (this.elements.exportBtn) {
          this.addEventListener(this.elements.exportBtn, "click", () =>
            this.handleExport()
          );
        }

        if (this.elements.importBtn) {
          this.addEventListener(this.elements.importBtn, "click", () =>
            this.handleImport()
          );
        }
      }

      /**
       * タブのリフレッシュ
       */
      async onRefresh() {
        await this.slotManager.loadFromStorage();
        this.updateDisplay();
      }

      /**
       * デバッグ情報を出力（オーバーライド）
       */
      debug() {
        super.debug();
        console.log("SlotManager:", this.slotManager);
        console.log("Current slots:", this.slotManager?.slots);
        console.log("Used slots count:", this.slotManager?.getUsedSlotsCount());
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
