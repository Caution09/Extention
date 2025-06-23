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
    this._nextId = 0; // スロットIDカウンター

    // 初期化（最初は3個のスロットから開始）
    this.initializeSlots(3);
  }

  /**
   * スロットを初期化（通知なし）
   * @param {number} count - 初期スロット数
   */
  initializeSlots(count = 3) {
    this.slots = [];
    this._nextId = 0;

    // 指定数のスロットを作成（通知なしで）
    for (let i = 0; i < count; i++) {
      const newSlot = {
        id: this._nextId++,
        name: "",
        prompt: "",
        elements: [],
        isUsed: false,
        lastModified: null,
      };
      this.slots.push(newSlot);
    }
  }

  /**
   * 新しいスロットを追加
   * @returns {Object|null} 追加されたスロット
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
   * スロットを切り替え
   * @param {number} slotId - 切り替え先のスロットID
   */
  async switchSlot(slotId) {
    const slotIndex = this.slots.findIndex((slot) => slot.id === slotId);
    if (slotIndex === -1) {
      console.error("Invalid slot ID:", slotId);
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

    // イベントを発火
    this.onSlotChanged(slotIndex);

    // 切り替え後に再度保存
    await this.saveToStorage();

    return true;
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
   * スロット情報を取得
   */
  getSlotInfo(slotId) {
    const slot = this.slots.find((s) => s.id === slotId);
    if (!slot) return null;

    const slotIndex = this.slots.findIndex((s) => s.id === slotId);
    const displayNumber = slotIndex + 1;

    return {
      id: slot.id,
      displayNumber: displayNumber,
      name: slot.name || `プロンプト${displayNumber}`,
      isUsed: slot.isUsed,
      isCurrent: slotIndex === this.currentSlot,
      preview: slot.prompt ? slot.prompt.substring(0, 20) + "..." : "(空)",
      lastModified: slot.lastModified,
    };
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
   * ストレージから読み込み
   */
  async loadFromStorage() {
    try {
      const result = await Storage.get("promptSlots");
      if (result.promptSlots) {
        this.currentSlot = result.promptSlots.currentSlot || 0;
        this.slots = result.promptSlots.slots || [];
        this._nextId = result.promptSlots.nextId || this.slots.length;

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
          usedSlots: this.slots.filter((s) => s.isUsed).map((s) => s.id),
        });

        return true;
      }
    } catch (error) {
      ErrorHandler.log("Failed to load prompt slots", error);
    }
    return false;
  }

  /**
   * UIを更新
   */
  updateUI() {
    const selector = document.getElementById("prompt-slot-selector");
    if (!selector) return;

    // オプションを再作成
    selector.innerHTML = "";

    this.getAllSlotInfo().forEach((info, index) => {
      const option = document.createElement("option");
      option.value = info.id;
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
   * すべての使用中スロットのプロンプトを結合
   * @returns {string} 結合されたプロンプト
   */
  getCombinedPrompt() {
    const usedSlots = this.slots
      .filter((slot) => slot.isUsed && slot.prompt)
      .sort((a, b) => {
        // スロットの順番（配列内の位置）でソート
        const indexA = this.slots.indexOf(a);
        const indexB = this.slots.indexOf(b);
        return indexA - indexB;
      });

    if (usedSlots.length === 0) {
      return "";
    }

    // プロンプトを結合
    const combined = usedSlots
      .map((slot) => slot.prompt.trim())
      .filter((prompt) => prompt.length > 0)
      .join(",");

    // 連続するカンマを1つに正規化
    const normalized = combined
      .replace(/,\s*,+/g, ",")
      .replace(/^\s*,\s*/, "")
      .replace(/\s*,\s*$/, "")
      .replace(/\s*,\s*/g, ", ");

    console.log(
      `Combining ${usedSlots.length} slots:`,
      usedSlots.map((s, i) => `Slot ${i + 1}: ${s.prompt.substring(0, 20)}...`)
    );

    return normalized;
  }

  /**
   * 使用中のスロット情報を取得
   * @returns {Array} 使用中スロットの情報
   */
  getUsedSlots() {
    return this.slots
      .map((slot, index) => ({
        slot: slot,
        index: index,
      }))
      .filter((item) => item.slot.isUsed)
      .map((item) => ({
        id: item.index + 1,
        name: item.slot.name || `スロット${item.index + 1}`,
        prompt: item.slot.prompt,
      }));
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
