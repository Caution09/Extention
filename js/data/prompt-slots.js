/**
 * prompt-slots.js - 複数プロンプト管理モジュール
 * Phase 8: 最大10個のプロンプトを切り替え可能にする
 *
 * 使用方法:
 * 1. js/modules/prompt-slots.js として保存
 * 2. popup.htmlでshortcut-manager.jsの後に読み込み
 * 3. プロンプト入力欄の左にドロップダウンを配置
 */

class PromptSlotManager {
  constructor() {
    this.maxSlots = 10;
    this.currentSlot = 0;
    this.slots = [];

    // 初期化
    this.initializeSlots();
  }

  /**
   * スロットを初期化
   */
  initializeSlots() {
    // 配列を空にしてから初期化
    this.slots = [];

    // 空のスロットを作成
    for (let i = 0; i < this.maxSlots; i++) {
      this.slots.push({
        id: i,
        name: "",
        prompt: "",
        elements: [],
        isUsed: false,
        lastModified: null,
      });
    }
  }

  /**
   * スロットを切り替え
   * @param {number} slotId - 切り替え先のスロットID
   */
  async switchSlot(slotId) {
    if (slotId < 0 || slotId >= this.maxSlots) {
      console.error("Invalid slot ID:", slotId);
      return false;
    }

    // 同じスロットへの切り替えは無視
    if (slotId === this.currentSlot) {
      console.log("Already on slot:", slotId);
      return false;
    }

    console.log(`Switching from slot ${this.currentSlot} to slot ${slotId}`);

    // 現在のスロットを保存（重要：切り替え前に実行）
    await this.saveCurrentSlot();

    // 新しいスロットに切り替え
    this.currentSlot = slotId;
    const slot = this.slots[slotId];

    // プロンプトエディタに反映
    if (slot.isUsed) {
      promptEditor.init(slot.prompt);
      // 要素も復元（必要に応じて）
      if (slot.elements && slot.elements.length > 0) {
        promptEditor.elements = [...slot.elements];
        promptEditor.generate();
      }
    } else {
      // 空のスロットの場合
      promptEditor.init("");
    }

    // UIを更新
    this.updateUI();

    // イベントを発火
    this.onSlotChanged(slotId);

    // 切り替え後に再度保存（念のため）
    await this.saveToStorage();

    return true;
  }

  /**
   * 現在のスロットを保存
   */
  async saveCurrentSlot() {
    const currentSlot = this.slots[this.currentSlot];

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
    if (slotId >= 0 && slotId < this.maxSlots) {
      this.slots[slotId].name = name;
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
    const slot = this.slots[slotId];
    if (!slot) return null;

    return {
      id: slot.id,
      name: slot.name || `プロンプト${slotId + 1}`,
      isUsed: slot.isUsed,
      isCurrent: slotId === this.currentSlot,
      preview: slot.prompt ? slot.prompt.substring(0, 20) + "..." : "(空)",
      lastModified: slot.lastModified,
    };
  }

  /**
   * すべてのスロット情報を取得
   */
  getAllSlotInfo() {
    return this.slots.map((_, index) => this.getSlotInfo(index));
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

        // スロット数が足りない場合は追加
        while (this.slots.length < this.maxSlots) {
          this.slots.push({
            id: this.slots.length,
            name: "",
            prompt: "",
            elements: [],
            isUsed: false,
            lastModified: null,
          });
        }

        // スロット数が多すぎる場合は切り詰め
        if (this.slots.length > this.maxSlots) {
          this.slots = this.slots.slice(0, this.maxSlots);
        }

        // IDの整合性チェック（念のため）
        this.slots.forEach((slot, index) => {
          slot.id = index;
        });

        console.log("Loaded slots from storage:", {
          currentSlot: this.currentSlot,
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

    this.getAllSlotInfo().forEach((info) => {
      const option = document.createElement("option");
      option.value = info.id;
      option.textContent = info.isUsed
        ? `${info.id + 1}: ${info.name || info.preview}`
        : `${info.id + 1}: (空)`;

      if (info.isCurrent) {
        option.style.fontWeight = "bold";
      }

      selector.appendChild(option);
    });

    // オプションを作成した後に選択値を設定
    selector.value = this.currentSlot;
  }

  /**
   * スロット変更時のコールバック
   */
  onSlotChanged(slotId) {
    // 必要に応じて外部に通知
    console.log("Switched to slot:", slotId);

    // プロンプト入力欄を更新
    const promptInput = document.getElementById("generatePrompt");
    if (promptInput) {
      promptInput.value = this.slots[slotId].prompt || "";
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
    if (slotId < 0 || slotId >= this.maxSlots) {
      console.error("Invalid slot ID:", slotId);
      return false;
    }

    this.slots[slotId] = {
      id: slotId,
      name: "",
      prompt: "",
      elements: [],
      isUsed: false,
      lastModified: null,
    };

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
      .sort((a, b) => a.id - b.id); // ID順（1番から順番に）

    if (usedSlots.length === 0) {
      return "";
    }

    // プロンプトを結合（カンマ区切り）
    const combined = usedSlots
      .map((slot) => slot.prompt.trim())
      .filter((prompt) => prompt.length > 0)
      .join(",");

    // 連続するカンマを1つに正規化
    const normalized = combined
      .replace(/,\s*,+/g, ",") // ,, や , , を , に
      .replace(/^\s*,\s*/, "") // 先頭のカンマを削除
      .replace(/\s*,\s*$/, "") // 末尾のカンマを削除
      .replace(/\s*,\s*/g, ", "); // カンマの後にスペースを統一

    console.log(
      `Combining ${usedSlots.length} slots:`,
      usedSlots.map((s) => `Slot ${s.id + 1}: ${s.prompt.substring(0, 20)}...`)
    );

    return normalized;
  }

  /**
   * 使用中のスロット情報を取得
   * @returns {Array} 使用中スロットの情報
   */
  getUsedSlots() {
    return this.slots
      .filter((slot) => slot.isUsed)
      .sort((a, b) => a.id - b.id)
      .map((slot) => ({
        id: slot.id + 1,
        name: slot.name || `スロット${slot.id + 1}`,
        prompt: slot.prompt,
      }));
  }

  /**
   * すべてのスロットをクリア
   */
  async clearAllSlots() {
    this.initializeSlots();
    this.currentSlot = 0;
    promptEditor.init("");

    await this.saveToStorage();
    this.updateUI();
  }
}

// グローバルに公開
if (typeof window !== "undefined") {
  window.PromptSlotManager = PromptSlotManager;
  window.promptSlotManager = new PromptSlotManager();
}
