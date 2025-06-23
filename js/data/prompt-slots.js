/**
 * prompt-slots.js - 動的プロンプト管理モジュール
 * Phase 8: 可変スロット数対応版
 *
 * 使用方法:
 * 1. スロットの追加・削除が可能
 * 2. 最小1個、最大20個まで
 * 3. ショートカットキー機能は削除
 */

class PromptSlotManager {
  constructor() {
    this.minSlots = 1;
    this.maxSlots = 100;
    this.currentSlot = 0;
    this.slots = [];
    this._nextId = 0;

    // 初期化（最初は3個のスロットから開始）
    this.initializeSlots(3);
  }

  /**
   * スロットを初期化（拡張版）
   */
  initializeSlots(count = 3) {
    this.slots = [];
    this._nextId = 0;

    for (let i = 0; i < count; i++) {
      const newSlot = {
        id: this._nextId++,
        name: "",
        prompt: "",
        elements: [],
        isUsed: false,
        lastModified: null,
        // 新規追加フィールド
        mode: "normal", // 'normal' | 'random' | 'sequential'
        extractionCategory: { big: "", middle: "" },
        extractionIndex: 0,
        currentExtraction: null,
      };
      this.slots.push(newSlot);
    }
  }

  /**
   * 新しいスロットを追加（拡張版）
   */
  addNewSlot() {
    if (this.slots.length >= this.maxSlots) {
      ErrorHandler.notify(`スロットは最大${this.maxSlots}個までです`, {
        type: ErrorHandler.NotificationType.TOAST,
        messageType: "warning",
      });
      return null;
    }

    const newSlot = {
      id: this._nextId++,
      name: "",
      prompt: "",
      elements: [],
      isUsed: false,
      lastModified: null,
      // 新規追加フィールド
      mode: "normal",
      extractionCategory: { big: "", middle: "" },
      extractionIndex: 0,
      currentExtraction: null,
    };

    this.slots.push(newSlot);
    this.updateUI();
    this.saveToStorage();

    ErrorHandler.notify(`スロット${this.slots.length}を追加しました`, {
      type: ErrorHandler.NotificationType.TOAST,
      messageType: "success",
      duration: 1500,
    });

    return newSlot;
  }

  /**
   * スロットを削除
   * @param {number} slotId - 削除するスロットID
   * @returns {boolean} 削除成功の可否
   */
  deleteSlot(slotId) {
    // 最小スロット数チェック
    if (this.slots.length <= this.minSlots) {
      ErrorHandler.notify(`スロットは最低${this.minSlots}個必要です`, {
        type: ErrorHandler.NotificationType.TOAST,
        messageType: "warning",
      });
      return false;
    }

    // 現在選択中のスロットは削除不可
    if (slotId === this.currentSlot) {
      ErrorHandler.notify("選択中のスロットは削除できません", {
        type: ErrorHandler.NotificationType.TOAST,
        messageType: "warning",
      });
      return false;
    }

    // スロットのインデックスを検索
    const slotIndex = this.slots.findIndex((slot) => slot.id === slotId);
    if (slotIndex === -1) {
      console.error("Slot not found:", slotId);
      return false;
    }

    // スロットを削除
    this.slots.splice(slotIndex, 1);

    // 現在のスロットインデックスを調整
    if (this.currentSlot > slotIndex) {
      this.currentSlot--;
    }

    // UIを更新
    this.updateUI();
    this.saveToStorage();

    ErrorHandler.notify("スロットを削除しました", {
      type: ErrorHandler.NotificationType.TOAST,
      messageType: "success",
      duration: 1500,
    });

    return true;
  }

  /**
   * スロットを切り替え（拡張版 - 抽出モードは選択不可）
   */
  async switchSlot(slotId) {
    const slotIndex = this.slots.findIndex((slot) => slot.id === slotId);
    if (slotIndex === -1) {
      console.error("Invalid slot ID:", slotId);
      return false;
    }

    const targetSlot = this.slots[slotIndex];

    // 抽出モードのスロットは選択できない
    if (targetSlot.mode === "random" || targetSlot.mode === "sequential") {
      ErrorHandler.notify("抽出モードのスロットは選択できません", {
        type: ErrorHandler.NotificationType.TOAST,
        messageType: "warning",
        duration: 2000,
      });
      return false;
    }

    // 同じスロットへの切り替えは無視
    if (slotIndex === this.currentSlot) {
      console.log("Already on slot:", slotId);
      return false;
    }

    console.log(
      `Switching from slot index ${this.currentSlot} to ${slotIndex}`
    );

    // 現在のスロットを保存
    await this.saveCurrentSlot();

    // 新しいスロットに切り替え
    this.currentSlot = slotIndex;
    const slot = this.slots[slotIndex];

    // プロンプトエディタに反映
    if (slot.isUsed) {
      promptEditor.init(slot.prompt);
      if (slot.elements && slot.elements.length > 0) {
        promptEditor.elements = [...slot.elements];
        promptEditor.generate();
      }
    } else {
      promptEditor.init("");
    }

    // UIを更新
    this.updateUI();
    this.onSlotChanged(slotIndex);
    await this.saveToStorage();

    return true;
  }

  /**
   * 要素を抽出
   * @param {Object} slot - 対象スロット
   * @returns {string} 抽出された要素のプロンプト
   */
  extractElement(slot) {
    if (slot.mode !== "random" && slot.mode !== "sequential") {
      return slot.prompt || "";
    }

    // カテゴリーに該当する要素を検索
    const allPrompts = [
      ...AppState.data.localPromptList,
      ...AppState.data.masterPrompts,
    ];

    let filtered = allPrompts;

    // カテゴリーフィルター
    if (slot.extractionCategory.big) {
      filtered = filtered.filter(
        (item) => item.data[0] === slot.extractionCategory.big
      );

      if (slot.extractionCategory.middle) {
        filtered = filtered.filter(
          (item) => item.data[1] === slot.extractionCategory.middle
        );
      }
    }

    if (filtered.length === 0) {
      console.log("No elements found for extraction");
      slot.currentExtraction = null;
      return "";
    }

    let selectedElement;

    if (slot.mode === "random") {
      // ランダム抽出
      const randomIndex = Math.floor(Math.random() * filtered.length);
      selectedElement = filtered[randomIndex];
    } else {
      // 連続抽出
      slot.extractionIndex = (slot.extractionIndex || 0) % filtered.length;
      selectedElement = filtered[slot.extractionIndex];
      slot.extractionIndex++;
    }

    // 現在の抽出を記録
    slot.currentExtraction = selectedElement.prompt;

    // 追加：抽出イベントを発火
    this.onExtractionComplete(slot);

    // UIに反映するため保存（既存のコード）
    this.saveToStorage();

    console.log(`Extracted element: ${selectedElement.prompt}`);
    return selectedElement.prompt;
  }

  // 新規：抽出完了時のコールバック
  onExtractionComplete(slot) {
    // カスタムイベントを発火
    window.dispatchEvent(
      new CustomEvent("slotExtractionComplete", {
        detail: { slotId: slot.id, extraction: slot.currentExtraction },
      })
    );
  }

  /**
   * 現在のスロットを保存
   */
  async saveCurrentSlot() {
    const currentSlot = this.slots[this.currentSlot];
    if (!currentSlot) return;

    // 現在の状態を保存
    currentSlot.prompt = promptEditor.prompt || "";
    currentSlot.elements = [...promptEditor.elements];
    currentSlot.isUsed = currentSlot.prompt.length > 0;
    currentSlot.lastModified = currentSlot.isUsed ? Date.now() : null;

    // ストレージに保存
    await this.saveToStorage();
  }

  /**
   * スロットに名前を設定
   * @param {number} slotId - スロットID
   * @param {string} name - スロット名
   */
  async setSlotName(slotId, name) {
    const slot = this.slots.find((s) => s.id === slotId);
    if (slot) {
      slot.name = name;
      await this.saveToStorage();
      this.updateUI();
    }
  }

  /**
   * 使用中のスロット数を取得
   */
  getUsedSlotsCount() {
    return this.slots.filter((slot) => slot.isUsed).length;
  }

  /**
   * スロット情報を取得（拡張版）
   */
  getSlotInfo(slotId) {
    const slot = this.slots.find((s) => s.id === slotId);
    if (!slot) return null;

    const slotIndex = this.slots.findIndex((s) => s.id === slotId);
    const displayNumber = slotIndex + 1;

    const info = {
      id: slot.id,
      displayNumber: displayNumber,
      name: slot.name || `プロンプト${displayNumber}`,
      isUsed: slot.isUsed || slot.mode !== "normal",
      isCurrent: slotIndex === this.currentSlot,
      preview: slot.prompt ? slot.prompt.substring(0, 20) + "..." : "(空)",
      lastModified: slot.lastModified,
      mode: slot.mode,
    };

    if (slot.mode === "random" || slot.mode === "sequential") {
      info.preview = `[${slot.mode === "random" ? "ランダム" : "連続"}抽出]`;
      if (slot.extractionCategory.big) {
        info.preview += ` ${slot.extractionCategory.big}`;
        if (slot.extractionCategory.middle) {
          info.preview += ` > ${slot.extractionCategory.middle}`;
        }
      }
    }

    return info;
  }

  /**
   * すべてのスロット情報を取得
   */
  getAllSlotInfo() {
    return this.slots.map((slot) => this.getSlotInfo(slot.id));
  }

  /**
   * ストレージに保存
   */
  async saveToStorage() {
    try {
      await Storage.set({
        promptSlots: {
          currentSlot: this.currentSlot,
          slots: this.slots,
          nextId: this._nextId,
        },
      });
    } catch (error) {
      ErrorHandler.log("Failed to save prompt slots", error);
    }
  }

  /**
   * ストレージから読み込み（修正版）
   */
  async loadFromStorage() {
    try {
      const result = await Storage.get("promptSlots");
      if (result.promptSlots) {
        this.currentSlot = result.promptSlots.currentSlot || 0;
        this.slots = result.promptSlots.slots || [];
        this._nextId = result.promptSlots.nextId || this.slots.length;

        // 既存のスロットにデフォルト値を設定
        this.slots = this.slots.map((slot) => ({
          ...slot,
          mode: slot.mode || "normal",
          extractionCategory: slot.extractionCategory || {
            big: "",
            middle: "",
          },
          extractionIndex: slot.extractionIndex || 0,
          currentExtraction: slot.currentExtraction || null,
        }));

        // スロットが空の場合は初期化
        if (this.slots.length === 0) {
          this.initializeSlots(3);
        }

        // currentSlotが範囲外の場合は調整
        if (this.currentSlot >= this.slots.length) {
          this.currentSlot = 0;
        }

        console.log("Loaded slots from storage:", {
          currentSlot: this.currentSlot,
          slotCount: this.slots.length,
          usedSlots: this.slots
            .filter((s) => s.isUsed || s.mode !== "normal")
            .map((s) => s.id),
        });

        return true;
      }
    } catch (error) {
      ErrorHandler.log("Failed to load prompt slots", error);
    }
    return false;
  }
  /**
   * UIを更新（拡張版）
   */
  updateUI() {
    const selector = document.getElementById("prompt-slot-selector");
    if (!selector) return;

    // オプションを再作成
    selector.innerHTML = "";

    this.getAllSlotInfo().forEach((info, index) => {
      const option = document.createElement("option");
      option.value = info.id;

      // 抽出モードのスロットは選択不可を明示
      if (this.slots[index].mode !== "normal") {
        option.disabled = true;
        option.style.color = "#999";
      }

      option.textContent = info.isUsed
        ? `${info.displayNumber}: ${info.name || info.preview}`
        : `${info.displayNumber}: (空)`;

      if (info.isCurrent) {
        option.style.fontWeight = "bold";
      }

      selector.appendChild(option);
    });

    // 現在のスロットを選択
    const currentSlotId = this.slots[this.currentSlot]?.id;
    if (currentSlotId !== undefined) {
      selector.value = currentSlotId;
    }
  }

  /**
   * スロット変更時のコールバック
   */
  onSlotChanged(slotIndex) {
    console.log("Switched to slot index:", slotIndex);

    // プロンプト入力欄を更新
    const promptInput = document.getElementById("generatePrompt");
    if (promptInput && this.slots[slotIndex]) {
      promptInput.value = this.slots[slotIndex].prompt || "";
      promptInput.dispatchEvent(new Event("input"));
    }
  }

  /**
   * 現在のスロットをクリア
   */
  async clearCurrentSlot() {
    const currentSlot = this.slots[this.currentSlot];
    currentSlot.prompt = "";
    currentSlot.elements = [];
    currentSlot.isUsed = false;
    currentSlot.lastModified = null;
    currentSlot.name = "";

    // エディタもクリア
    promptEditor.init("");

    await this.saveToStorage();
    this.updateUI();
  }

  /**
   * 指定したスロットをクリア（切り替えなし）
   * @param {number} slotId - クリアするスロットID
   */
  async clearSlot(slotId) {
    const slot = this.slots.find((s) => s.id === slotId);
    if (!slot) {
      console.error("Slot not found:", slotId);
      return false;
    }

    slot.prompt = "";
    slot.elements = [];
    slot.isUsed = false;
    slot.lastModified = null;
    slot.name = "";

    await this.saveToStorage();
    this.updateUI();
    return true;
  }

  /**
   * すべての使用中スロットのプロンプトを結合（修正版）
   */
  getCombinedPrompt() {
    const usedSlots = this.slots.filter((slot) => {
      // modeがない場合は'normal'として扱う
      const slotMode = slot.mode || "normal";

      // 通常モードは従来通り
      if (slotMode === "normal") {
        return slot.isUsed && slot.prompt;
      }
      // 抽出モードは常に含める
      return slotMode === "random" || slotMode === "sequential";
    });

    if (usedSlots.length === 0) {
      return "";
    }

    // Generate時に抽出を実行
    const prompts = usedSlots.map((slot) => {
      const slotMode = slot.mode || "normal";

      if (slotMode === "random" || slotMode === "sequential") {
        return this.extractElement(slot);
      }
      // 通常モードのスロット
      return slot.prompt ? slot.prompt.trim() : "";
    });

    // 空の要素を除外
    const validPrompts = prompts.filter(
      (prompt) => prompt && prompt.length > 0
    );

    if (validPrompts.length === 0) {
      return "";
    }

    // プロンプトを結合
    const combined = validPrompts.join(",");

    // 連続するカンマを1つに正規化
    const normalized = combined
      .replace(/,\s*,+/g, ",")
      .replace(/^\s*,\s*$/, "")
      .replace(/\s*,\s*/g, ", ");

    console.log(`Combined ${validPrompts.length} prompts:`, validPrompts);

    // 追加：全体の抽出完了イベント
    window.dispatchEvent(new CustomEvent("allExtractionsComplete"));

    return normalized;
  }

  /**
   * 使用中のスロット情報を取得（拡張版）
   */
  getUsedSlots() {
    return this.slots
      .map((slot, currentIndex) => {
        if (
          slot.isUsed ||
          slot.mode === "random" ||
          slot.mode === "sequential"
        ) {
          const info = {
            id: currentIndex + 1,
            name: slot.name || `スロット${currentIndex + 1}`,
            prompt: slot.prompt,
          };

          if (slot.mode === "random" || slot.mode === "sequential") {
            info.mode = slot.mode;
            info.category = slot.extractionCategory;
            info.currentExtraction = slot.currentExtraction;
          }

          return info;
        }
        return null;
      })
      .filter((item) => item !== null);
  }

  /**
   * すべてのスロットをクリア
   */
  async clearAllSlots() {
    // 3個の空スロットで初期化（通知なし）
    this.initializeSlots(3);
    this.currentSlot = 0;
    promptEditor.init("");

    const promptInput = document.getElementById("generatePrompt");
    if (promptInput) {
      promptInput.value = "";
    }

    await this.saveToStorage();
    this.updateUI();
  }
}

// グローバルに公開
if (typeof window !== "undefined") {
  window.PromptSlotManager = PromptSlotManager;
  window.promptSlotManager = new PromptSlotManager();
}
