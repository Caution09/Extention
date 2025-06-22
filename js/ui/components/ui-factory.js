/**
 * UI要素生成ファクトリー（最適化版）
 * jQuery依存を最小限に削減し、パフォーマンスを向上
 */
const UIFactory = {
  /**
   * 汎用ボタンを作成（Vanilla JS）
   * @param {Object} config - ボタン設定
   * @param {string} config.text - ボタンテキスト
   * @param {Function} config.onClick - クリックハンドラー
   * @param {string} [config.className] - CSSクラス名
   * @param {string} [config.title] - ツールチップ
   * @returns {HTMLButtonElement}
   */
  createButton(config) {
    const button = document.createElement("button");
    button.type = "submit";
    button.innerHTML = config.text;

    if (config.onClick) {
      button.addEventListener("click", config.onClick);
    }

    if (config.className) {
      button.className = config.className;
    }

    if (config.title) {
      button.title = config.title;
    }

    return button;
  },

  /**
   * jQuery ボタンを作成（移行期間用）
   * @deprecated 将来的に削除予定
   * @param {Object} config - ボタン設定
   * @returns {jQuery}
   */
  createJQueryButton(config) {
    const button = this.createButton(config);
    return $(button);
  },

  /**
   * 入力フィールドを作成（Vanilla JS版）
   * @param {Object} config - 入力フィールド設定
   * @returns {HTMLInputElement|jQuery}
   */
  createInput(config) {
    const input = document.createElement("input");
    input.type = "text";
    input.value =
      config.value !== null && config.value !== undefined ? config.value : "";
    input.className = config.className || "promptData";

    if (config.readonly) {
      input.readOnly = true;
    }

    if (config.style) {
      Object.assign(input.style, config.style);
    }

    if (config.onInput) {
      input.addEventListener("input", () =>
        config.onInput(input.value, config.index)
      );
    }

    if (config.onBlur) {
      input.addEventListener("blur", config.onBlur);
    }

    if (config.placeholder) {
      input.placeholder = config.placeholder;
    }

    // 互換性のため、必要に応じてjQueryオブジェクトとして返す
    // 呼び出し元が段階的に移行できるように
    if (config.returnAsJQuery !== false) {
      return $(input);
    }

    return input;
  },

  /**
   * ヘッダー入力フィールドを作成
   * @param {string} value - 表示する値
   * @returns {jQuery}
   */
  createHeaderInput(value) {
    return this.createInput({
      value: value,
      readonly: true,
      style: {
        backgroundColor: "black",
        color: "white",
      },
    });
  },

  /**
   * リストアイテムを作成（Vanilla JS版）
   * @param {Object} config - リストアイテム設定
   * @returns {jQuery}
   */
  createListItem(config) {
    const li = document.createElement("li");

    if (config.id !== undefined) {
      li.id = config.id;
    }

    if (config.sortable) {
      li.className = "ui-sortable-handle";
    }

    // 現状のコードとの互換性のため、jQueryオブジェクトとして返す
    return $(li);
  },

  /**
   * 標準的なボタンセットを作成
   * @param {Object} config - ボタンセット設定
   * @returns {Object} ボタンのオブジェクト
   */
  createButtonSet(config) {
    const buttons = {};

    // Setボタン
    if (config.includeSet) {
      buttons.set = this.createButton({
        text: "Set",
        onClick: () => {
          if (config.onSet) {
            config.onSet(config.setValue);
          } else {
            // デフォルト動作
            const input = document.getElementById("generatePrompt");
            if (input) {
              const currentValue = input.value || "";
              editPrompt.init(currentValue + config.setValue);
              input.value = editPrompt.prompt;
              savePrompt();
            } else {
              console.error("generatePrompt input not found");
            }
          }
        },
      });
    }

    // Copyボタン
    if (config.includeCopy) {
      buttons.copy = this.createButton({
        text: "Copy",
        onClick: () => {
          if (config.onCopy) {
            config.onCopy(config.copyValue);
          } else {
            // デフォルト動作
            const temp = editPrompt.prompt;
            editPrompt.init(config.copyValue);
            navigator.clipboard.writeText(editPrompt.prompt);
            editPrompt.init(temp);
          }
        },
      });
    }

    // Deleteボタン
    if (config.includeDelete) {
      buttons.delete = this.createButton({
        text: "X",
        onClick: async () => {
          const shouldDelete =
            !AppState.userSettings.optionData?.isDeleteCheck ||
            window.confirm("本当に削除しますか？");

          if (shouldDelete && config.onDelete) {
            await config.onDelete();
          }
        },
      });
    }

    // Loadボタン
    if (config.includeLoad) {
      buttons.load = this.createButton({
        text: "↑",
        onClick: () => {
          editPrompt.init(config.loadValue);
          UpdateGenaretePrompt();
          savePrompt();
        },
      });
    }

    // 重み調整ボタン
    if (config.includeWeight) {
      buttons.weightPlus = this.createButton({
        text: "+",
        onClick: () => {
          editPrompt.addWeight(config.weightDelta, config.index);
          UpdateGenaretePrompt();
          editInit();
        },
      });

      buttons.weightMinus = this.createButton({
        text: "-",
        onClick: () => {
          editPrompt.addWeight(-config.weightDelta, config.index);
          UpdateGenaretePrompt();
          editInit();
        },
      });
    }

    return buttons;
  },

  /**
   * プレビューボタンを作成
   * @param {Object} item - プレビューするアイテム
   * @returns {jQuery}
   */
  createPreviewButton(item) {
    const button = this.createButton({
      text: "P",
      onClick: () => previewPromptImage(item),
    });
    return $(button);
  },

  /**
   * ドラッグ可能なアイコンを作成
   * @param {number} index - インデックス
   * @param {string} [icon='☰'] - アイコン文字
   * @returns {Text}
   */
  createDragIcon(index, icon = "☰") {
    const textNode = document.createTextNode(icon);
    textNode.value = index;
    return textNode;
  },
};

/**
 * リスト生成ヘルパー（最適化版）
 */
const ListBuilder = {
  /**
   * リストをクリア（最適化版）
   * @param {string} listId - リストのID
   */
  clearList(listId) {
    const list = document.querySelector(listId);
    if (!list) return;

    // イベントリスナーをクリーンアップ（jQueryイベントも含む）
    $(list).find("*").off();

    // sortableを破棄
    if ($(list).hasClass("ui-sortable")) {
      $(list).sortable("destroy");
    }

    // より高速な方法でリストをクリア
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }
  },

  /**
   * ヘッダー行を作成（最適化版）
   * @param {string} listId - リストのID
   * @param {string[]} headers - ヘッダーテキストの配列
   */
  createHeaders(listId, headers) {
    const list = document.querySelector(listId);
    if (!list) return;

    const headerRow = document.createElement("ui");

    headers.forEach((header) => {
      const headerInput = UIFactory.createHeaderInput(header);
      headerRow.appendChild(headerInput[0] || headerInput);
    });

    list.appendChild(headerRow);
  },

  /**
   * 列幅を設定（CSS変数を使用した最適化版）
   * @param {string} listId - リストのID
   * @param {number} columnIndex - 列インデックス（1から開始）
   * @param {string} width - 幅（例: '100px'）
   */
  setColumnWidth(listId, columnIndex, width) {
    // CSSカスタムプロパティを使用してパフォーマンスを向上
    const list = document.querySelector(listId);
    if (list) {
      list.style.setProperty(`--column-${columnIndex}-width`, width);

      // 既存の要素に適用
      const selector = `${listId} li input:nth-of-type(${columnIndex}), ${listId} ui input:nth-of-type(${columnIndex})`;
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        el.style.width = width;
      });
    }
  },

  /**
   * 複数の列幅を一括設定
   * @param {string} listId - リストのID
   * @param {Object} widths - { columnIndex: width } のオブジェクト
   */
  setColumnWidths(listId, widths) {
    // バッチ処理でDOMアクセスを最小化
    const list = document.querySelector(listId);
    if (!list) return;

    const style = list.style;
    Object.entries(widths).forEach(([index, width]) => {
      style.setProperty(`--column-${index}-width`, width);
    });

    // 一度にすべての要素を更新
    requestAnimationFrame(() => {
      Object.entries(widths).forEach(([index, width]) => {
        this.setColumnWidth(listId, parseInt(index), width);
      });
    });
  },
};

/**
 * イベントハンドラーヘルパー（最適化版）
 */
const EventHandlers = {
  /**
   * 入力フィールドのクリア機能を追加（Vanilla JS版）
   * @param {jQuery|HTMLElement} input - 入力フィールド
   */
  addInputClearBehavior(input) {
    // jQueryオブジェクトの場合は、DOM要素を取得
    const element = input.jquery ? input[0] : input;
    let originalValue = "";

    element.addEventListener("mouseenter", function () {
      originalValue = this.value;
      this.value = "";
    });

    element.addEventListener("mouseleave", function () {
      if (this.value === "") {
        this.value = originalValue;
      }
    });
  },

  /**
   * 複数の入力フィールドにクリア機能を追加
   * @param {Array} inputs - 入力フィールドの配列
   */
  addInputClearBehaviorToMany(inputs) {
    inputs.forEach((input) => this.addInputClearBehavior(input));
  },

  /**
   * カテゴリー連動の設定（最適化版）
   * @param {Array} inputs - [大カテゴリー, 中カテゴリー, 小カテゴリー]の入力フィールド
   */
  setupCategoryChain(inputs) {
    const [bigInput, middleInput, smallInput] = inputs.map((input) =>
      input.jquery ? input[0] : input
    );

    bigInput.setAttribute("list", "category");

    bigInput.addEventListener("change", function () {
      const bigValue = this.value;
      if (middleInput) {
        middleInput.setAttribute("list", "category" + bigValue);
        // 中項目の値をクリア（検索タブと同じ動作）
        middleInput.value = "";
      }
      if (smallInput) {
        smallInput.setAttribute("list", "");
        // 小項目の値もクリア
        smallInput.value = "";
      }
    });

    if (middleInput && smallInput) {
      middleInput.addEventListener("change", function () {
        const bigValue = bigInput.value;
        const middleValue = this.value;
        smallInput.setAttribute("list", "category" + bigValue + middleValue);
        // 小項目の値をクリア
        smallInput.value = "";
      });
    }
  },
  /**
   * 並び替え可能なリストを設定
   * @param {string} listId - リストのID
   * @param {Function} onUpdate - 更新時のコールバック
   */
  setupSortableList(listId, onUpdate) {
    // jQuery UIのsortableは現状維持（Phase 4の後半で対応）
    const $list = $(listId);

    if ($list.hasClass("ui-sortable")) {
      $list.sortable("destroy");
    }

    $list.sortable({
      revert: 50,
      distance: 5,
      tolerance: "pointer",
      cursor: "move",
      // パフォーマンス改善：helper関数を最適化
      helper: "clone",
      update: function (event, ui) {
        const sortedIds = $list.sortable("toArray");
        onUpdate(sortedIds);
      },
    });
  },

  /**
   * イベントデリゲーションを設定（新規追加）
   * @param {string} parentSelector - 親要素のセレクタ
   * @param {string} childSelector - 子要素のセレクタ
   * @param {string} eventType - イベントタイプ
   * @param {Function} handler - イベントハンドラ
   */
  delegate(parentSelector, childSelector, eventType, handler) {
    const parent = document.querySelector(parentSelector);
    if (!parent) return;

    parent.addEventListener(eventType, (e) => {
      const target = e.target.closest(childSelector);
      if (target && parent.contains(target)) {
        handler.call(target, e);
      }
    });
  },
};

// パフォーマンス測定ユーティリティ（デバッグ用）
const PerformanceMonitor = {
  marks: new Map(),

  start(label) {
    if (typeof performance !== "undefined") {
      performance.mark(`${label}-start`);
      this.marks.set(label, performance.now());
    }
  },

  end(label) {
    if (typeof performance !== "undefined" && this.marks.has(label)) {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);

      const duration = performance.now() - this.marks.get(label);
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);

      this.marks.delete(label);
    }
  },
};

// グローバルに公開
if (typeof window !== "undefined") {
  window.UIFactory = UIFactory;
  window.ListBuilder = ListBuilder;
  window.EventHandlers = EventHandlers;
  window.PerformanceMonitor = PerformanceMonitor;
}
