/**
 * プロンプト編集クラス
 * Phase 3: クラスベースの実装
 */
class PromptEditor {
  constructor() {
    this.prompt = "";
    this.elements = [];
    this.isOldSD = false;
    this._elementIdCounter = 0; // 一意のID用カウンター

    // イベントリスナー管理
    this._listeners = {
      change: [],
      elementAdded: [],
      elementRemoved: [],
      elementUpdated: [],
    };
  }

  /**
   * プロンプトを初期化
   * @param {string} str - プロンプト文字列
   */
  init(str) {
    console.log("PromptEditor.init:", str);
    this.isOldSD = /\(\(/.test(str);
    this.elements = [];
    this._elementIdCounter = 0; // カウンターをリセット

    const tempList = str
      .split(",")
      .map((item) => item.trim().replace(/\s{2,}/g, " "))
      .filter((item) => item !== "");

    tempList.forEach((prompt, index) => {
      const element = this.createElement(prompt);
      element.sort = index;
      element.id = this._elementIdCounter++; // 一意のIDを付与
      this.elements.push(element);
    });

    this.generate();
  }
  /**
   * プロンプトを生成
   */
  generate() {
    const sortedElements = [...this.elements].sort((a, b) => a.sort - b.sort);

    const shaping = this._getShaping();
    this.prompt =
      sortedElements.map((item) => item[shaping].value).join(",") + ",";

    // 変更イベントを発火
    this._emit("change", { prompt: this.prompt, elements: this.elements });
  }

  /**
   * 要素の値を編集
   * @param {string} value - 新しい値
   * @param {number} index - 要素のインデックス
   */
  editingValue(value, index) {
    if (index >= 0 && index < this.elements.length) {
      const oldSort = this.elements[index].sort;
      const oldId = this.elements[index].id; // IDを保持
      this.elements[index] = this.createElement(value);
      this.elements[index].sort = oldSort;
      this.elements[index].id = oldId; // IDを復元
      this.generate();
      this._emit("elementUpdated", { index, element: this.elements[index] });
    }
  }

  /**
   * 要素の重みを編集
   * @param {string} weight - 新しい重み
   * @param {number} index - 要素のインデックス
   */
  editingWeight(weight, index) {
    if (index >= 0 && index < this.elements.length) {
      const shaping = this._getShaping();
      const oldSort = this.elements[index].sort;
      const oldId = this.elements[index].id; // IDを保持
      this.elements[index] = this.createElement(
        this.elements[index][shaping].value,
        weight
      );
      this.elements[index].sort = oldSort;
      this.elements[index].id = oldId; // IDを復元
      this.generate();
      this._emit("elementUpdated", { index, element: this.elements[index] });
    }
  }

  /**
   * 要素に重みを追加
   * @param {number} weight - 追加する重み
   * @param {number} index - 要素のインデックス
   */
  addWeight(weight, index) {
    if (index >= 0 && index < this.elements.length) {
      const shaping = this._getShaping();
      let newWeight = parseFloat(this.elements[index][shaping].weight) + weight;

      // 浮動小数点の精度問題を修正
      newWeight = Math.round(newWeight * 100) / 100;

      // 形式に応じて重みの範囲を制限
      if (shaping === "SD") {
        newWeight = Math.max(0.1, Math.min(10, newWeight)); // 0.1～10の範囲に制限
      } else if (shaping === "NAI") {
        newWeight = Math.max(-10, Math.min(10, newWeight)); // -10～10の範囲に制限
      }

      const oldSort = this.elements[index].sort;
      const oldId = this.elements[index].id;
      this.elements[index] = this.createElement(
        this.elements[index][shaping].value,
        newWeight
      );
      this.elements[index].sort = oldSort;
      this.elements[index].id = oldId;
      this.generate();
      this._emit("elementUpdated", { index, element: this.elements[index] });
    }
  }

  /**
   * 要素を削除
   * @param {number} index - 削除する要素のインデックス
   */
  removeElement(index) {
    if (index >= 0 && index < this.elements.length) {
      const removed = this.elements.splice(index, 1)[0];
      this.generate();
      this._emit("elementRemoved", { index, element: removed });
    }
  }

  /**
   * 要素を移動
   * @param {number} index - 移動元のインデックス
   * @param {number} offset - 移動量
   */
  moveElement(index, offset) {
    const newIndex = index + offset;
    if (
      index >= 0 &&
      index < this.elements.length &&
      newIndex >= 0 &&
      newIndex < this.elements.length
    ) {
      const temp = this.elements[index];
      this.elements[index] = this.elements[newIndex];
      this.elements[newIndex] = temp;
      this.generate();
    }
  }

  /**
   * 要素を挿入位置に移動
   * @param {number} index - 移動元のインデックス
   * @param {number} newIndex - 移動先のインデックス
   */
  moveInsertElement(index, newIndex) {
    if (
      index >= 0 &&
      index < this.elements.length &&
      newIndex >= 0 &&
      newIndex <= this.elements.length
    ) {
      const element = this.elements[index];
      this.elements.splice(index, 1);
      this.elements.splice(newIndex, 0, element);
      this.generate();
    }
  }

  /**
   * プロンプト要素を作成
   * @param {string} prompt - プロンプト文字列
   * @param {number} [weight] - 重み（オプション）
   * @returns {Object} 作成された要素
   */
  createElement(prompt, weight) {
    const element = {};
    const shaping = this._getShaping();

    // 重みの設定
    if (weight === undefined) {
      element.Weight = this.getWeight(prompt);
    } else {
      switch (shaping) {
        case "SD":
        case "None":
          element.Weight = weight;
          break;
        case "NAI":
          element.Weight = this.convertSDWeight(weight);
          break;
      }
    }

    element.Value = this.getbaseValue(prompt);

    // 各形式用の値を設定
    // createElement メソッド内の修正
    element["SD"] = {
      weight: element.Weight || 0, // 0の場合も明示的に0を設定
      value: this.getValue("SD", element.Value, element.Weight),
    };

    element["NAI"] = {
      weight: this.convertNAIWeight(element.Weight),
      value: this.getValue(
        "NAI",
        element.Value,
        this.convertNAIWeight(element.Weight)
      ),
    };

    element["None"] = {
      weight: null,
      value: prompt,
    };

    return element;
  }

  /**
   * 形式に応じた値を取得
   * @param {string} type - 形式（SD/NAI/None）
   * @param {string} str - 基本文字列
   * @param {number} weight - 重み
   * @returns {string} フォーマットされた値
   */
  getValue(type, str, weight) {
    switch (type) {
      case "SD":
        if (weight <= 0 || weight === 1) return str;
        return `(${str}:${weight})`;
      case "NAI":
        if (weight === 0 || !isFinite(weight)) return str; // 無限大チェックを追加
        const brackets = weight > 0 ? "{}" : "[]";
        const absWeight = Math.min(Math.abs(weight), 10); // 最大10に制限
        return (
          brackets[0].repeat(absWeight) + str + brackets[1].repeat(absWeight)
        );
      case "None":
        return str;
      default:
        return str;
    }
  }

  /**
   * プロンプトから重みを取得
   * @param {string} str - プロンプト文字列
   * @returns {number} 重み
   */
  getWeight(str) {
    if (this.isSpecialPrompt(str)) {
      return 1;
    }

    const match = this.getSDTypeWeight(str);
    if (match) {
      return parseFloat(match[2]);
    } else {
      const splitChar = this.isOldSD ? "(" : "{";
      const aiWeight = this.isOldSD ? 1.1 : 1.05;
      let weight = str.split(splitChar).length - 1;
      if (weight === 0) {
        weight = (str.split("[").length - 1) * -1;
      }
      return parseFloat((aiWeight ** weight).toFixed(2));
    }
  }

  /**
   * プロンプトから基本値を取得
   * @param {string} str - プロンプト文字列
   * @returns {string} 基本値
   */
  getbaseValue(str) {
    if (this.isSpecialPrompt(str)) {
      return str;
    }

    if (this.isOldSD) {
      return str.replace(/[\(\)]/g, "");
    }

    const match = this.getSDTypeWeight(str);
    if (match) {
      return match[1].trim(); // 基本値を返す（trimで余分な空白を除去）
    } else {
      return str.replace(/[{}\[\]]/g, "");
    }
  }

  /**
   * 特殊なプロンプトかチェック
   * @param {string} str - プロンプト文字列
   * @returns {boolean}
   */
  isSpecialPrompt(str) {
    const regex = /^\[.*:.*:.*\]$/;
    return regex.test(str);
  }

  /**
   * NAI形式の重みに変換
   * @param {number} weight - SD形式の重み
   * @returns {number} NAI形式の重み
   */
  convertNAIWeight(weight) {
    // 重みが0または1の場合は特別処理
    if (weight === 0 || weight === 1) {
      return 0;
    }

    // 重みが0に非常に近い場合も0として扱う
    if (Math.abs(weight) < 0.01) {
      return 0;
    }

    // 通常の変換
    return Math.round(Math.log(weight) / Math.log(1.05));
  }

  /**
   * SD形式の重みに変換
   * @param {number} weight - NAI形式の重み
   * @returns {number} SD形式の重み
   */
  convertSDWeight(weight) {
    return parseFloat((1.05 ** weight).toFixed(2));
  }

  /**
   * SD形式の重みを取得
   * @param {string} str - プロンプト文字列
   * @returns {Array|null} マッチ結果
   */
  getSDTypeWeight(str) {
    // まず括弧ありの形式をチェック: (text:weight)
    let match = str.match(/\(([^:]+):([\d.]+)\)/);
    if (match) return match;

    // 括弧なしの形式をチェック: text:weight
    match = str.match(/^([^:]+):([\d.]+)$/);
    return match;
  }

  /**
   * 現在の整形タイプを取得
   * @returns {string} 整形タイプ
   * @private
   */
  _getShaping() {
    // AppStateが利用可能な場合はそれを使用
    if (
      typeof AppState !== "undefined" &&
      AppState.userSettings?.optionData?.shaping
    ) {
      return AppState.userSettings.optionData.shaping;
    }
    // レガシー互換性
    if (typeof optionData !== "undefined" && optionData?.shaping) {
      return optionData.shaping;
    }
    return "None";
  }

  // ============================================
  // イベントシステム
  // ============================================

  /**
   * イベントリスナーを追加
   * @param {string} event - イベント名
   * @param {Function} callback - コールバック関数
   */
  on(event, callback) {
    if (this._listeners[event]) {
      this._listeners[event].push(callback);
    }
  }

  /**
   * イベントリスナーを削除
   * @param {string} event - イベント名
   * @param {Function} callback - コールバック関数
   */
  off(event, callback) {
    if (this._listeners[event]) {
      this._listeners[event] = this._listeners[event].filter(
        (cb) => cb !== callback
      );
    }
  }

  /**
   * イベントを発火
   * @param {string} event - イベント名
   * @param {*} data - イベントデータ
   * @private
   */
  _emit(event, data) {
    if (this._listeners[event]) {
      this._listeners[event].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
}

// ============================================
// グローバル互換性レイヤー（段階的移行用）
// ============================================

// デフォルトのインスタンスを作成
const promptEditor = new PromptEditor();

// レガシーコードとの互換性のため、editPromptとして公開
// 段階的に promptEditor への参照に置き換えていく
let editPrompt = {
  get prompt() {
    return promptEditor.prompt;
  },
  set prompt(value) {
    promptEditor.prompt = value;
  },
  get elements() {
    return promptEditor.elements;
  },
  set elements(value) {
    promptEditor.elements = value;
  },
  get isOldSD() {
    return promptEditor.isOldSD;
  },
  set isOldSD(value) {
    promptEditor.isOldSD = value;
  },

  // メソッドをプロキシ
  init: (str) => promptEditor.init(str),
  generate: () => promptEditor.generate(),
  editingValue: (value, index) => promptEditor.editingValue(value, index),
  editingWeight: (weight, index) => promptEditor.editingWeight(weight, index),
  addWeight: (weight, index) => promptEditor.addWeight(weight, index),
  removeElement: (index) => promptEditor.removeElement(index),
  moveElement: (index, offset) => promptEditor.moveElement(index, offset),
  moveInsertElement: (index, newIndex) =>
    promptEditor.moveInsertElement(index, newIndex),
  createElement: (prompt, weight) => promptEditor.createElement(prompt, weight),
  getValue: (type, str, weight) => promptEditor.getValue(type, str, weight),
  getWeight: (str) => promptEditor.getWeight(str),
  getbaseValue: (str) => promptEditor.getbaseValue(str),
  isSpecialPrompt: (str) => promptEditor.isSpecialPrompt(str),
  convertNAIWeight: (weight) => promptEditor.convertNAIWeight(weight),
  convertSDWeight: (weight) => promptEditor.convertSDWeight(weight),
  getSDTypeWeight: (str) => promptEditor.getSDTypeWeight(str),
};

// グローバルに公開
if (typeof window !== "undefined") {
  window.PromptEditor = PromptEditor;
  window.promptEditor = promptEditor;
  window.editPrompt = editPrompt;
}
