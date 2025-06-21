/**
 * UI要素生成ファクトリー
 * 重複するUI生成コードを統一し、保守性を向上
 */
const UIFactory = {
  /**
   * 汎用ボタンを作成
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
    button.onclick = config.onClick;

    if (config.className) {
      button.className = config.className;
    }

    if (config.title) {
      button.title = config.title;
    }

    return button;
  },

  /**
   * jQuery ボタンを作成（jQuery依存の部分用）
   * @param {Object} config - ボタン設定
   * @returns {jQuery}
   */
  createJQueryButton(config) {
    const $button = $("<button>").attr("type", "submit").html(config.text);

    if (config.onClick) {
      $button.on("click", config.onClick);
    }

    if (config.className) {
      $button.addClass(config.className);
    }

    return $button;
  },

  /**
   * 入力フィールドを作成
   * @param {Object} config - 入力フィールド設定
   * @returns {jQuery}
   */
  createInput(config) {
    const $input = $("<input>")
      .attr("type", "text")
      .val(
        config.value !== null && config.value !== undefined ? config.value : ""
      )
      .addClass(config.className || "promptData");

    if (config.readonly) {
      $input.prop("readonly", true);
    }

    if (config.style) {
      $input.css(config.style);
    }

    if (config.onInput) {
      $input.on("input", () => config.onInput($input.val(), config.index));
    }

    if (config.onBlur) {
      $input.on("blur", config.onBlur);
    }

    if (config.placeholder) {
      $input.attr("placeholder", config.placeholder);
    }

    return $input;
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
   * リストアイテムを作成
   * @param {Object} config - リストアイテム設定
   * @returns {jQuery}
   */
  createListItem(config) {
    const $li = $("<li>");

    if (config.id !== undefined) {
      $li.attr("id", config.id);
    }

    if (config.sortable) {
      $li.addClass("ui-sortable-handle");
    }

    return $li;
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
            const $input = $("#generatePrompt");
            if ($input.length > 0) {
              const currentValue = $input.val() || "";
              editPrompt.init(currentValue + config.setValue);
              $input.val(editPrompt.prompt);
              savePrompt();
            } else {
              console.error("generatePrompt input not found");
            }
          }
        },
      });
    }

    // Copyボタンも同様に修正
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
            // 削除処理を実行（DOM更新は個別に行う）
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
    return this.createJQueryButton({
      text: "P",
      onClick: () => previewPromptImage(item),
    });
  },

  /**
   * ドラッグ可能なアイコンを作成
   * @param {number} index - インデックス
   * @param {string} [icon='◆'] - アイコン文字
   * @returns {Text}
   */
  createDragIcon(index, icon = "◆") {
    const textNode = document.createTextNode(icon);
    textNode.value = index;
    return textNode;
  },
};

/**
 * リスト生成ヘルパー
 */
const ListBuilder = {
  /**
   * リストをクリア
   * @param {string} listId - リストのID
   */
  clearList(listId) {
    // イベントリスナーをクリーンアップ
    $(listId).find("*").off();

    // sortableを破棄
    if ($(listId).hasClass("ui-sortable")) {
      $(listId).sortable("destroy");
    }

    // リストをクリア
    $(listId).empty();
  },

  /**
   * ヘッダー行を作成
   * @param {string} listId - リストのID
   * @param {string[]} headers - ヘッダーテキストの配列
   */
  createHeaders(listId, headers) {
    const $headerRow = $("<ui>");
    headers.forEach((header) => {
      $headerRow.append(UIFactory.createHeaderInput(header));
    });
    $(listId).append($headerRow);
  },

  /**
   * 列幅を設定
   * @param {string} listId - リストのID
   * @param {number} columnIndex - 列インデックス（1から開始）
   * @param {string} width - 幅（例: '100px'）
   */
  setColumnWidth(listId, columnIndex, width) {
    $(`${listId} li input:nth-of-type(${columnIndex})`).css("width", width);
    $(`${listId} ui input:nth-of-type(${columnIndex})`).css("width", width);
  },

  /**
   * 複数の列幅を一括設定
   * @param {string} listId - リストのID
   * @param {Object} widths - { columnIndex: width } のオブジェクト
   */
  setColumnWidths(listId, widths) {
    Object.entries(widths).forEach(([index, width]) => {
      this.setColumnWidth(listId, parseInt(index), width);
    });
  },
};

/**
 * イベントハンドラーヘルパー
 */
const EventHandlers = {
  /**
   * 入力フィールドのクリア機能を追加
   * @param {jQuery} $input - 入力フィールド
   */
  addInputClearBehavior($input) {
    let originalValue = "";

    $input.on("mouseenter", function () {
      originalValue = $(this).val();
      $(this).val("");
    });

    $input.on("mouseleave", function () {
      if ($(this).val() === "") {
        $(this).val(originalValue);
      }
    });
  },

  /**
   * 複数の入力フィールドにクリア機能を追加
   * @param {jQuery[]} $inputs - 入力フィールドの配列
   */
  addInputClearBehaviorToMany($inputs) {
    $inputs.forEach(($input) => this.addInputClearBehavior($input));
  },

  /**
   * カテゴリー連動の設定
   * @param {jQuery[]} $inputs - [大カテゴリー, 中カテゴリー, 小カテゴリー]の入力フィールド
   */
  setupCategoryChain($inputs) {
    const [$big, $middle, $small] = $inputs;

    $big.attr("list", "category");

    $big.on("change", function () {
      const bigValue = $(this).val();
      $middle.attr("list", "category" + bigValue);
      $small.attr("list", ""); // リセット
    });

    if ($middle && $small) {
      $middle.on("change", function () {
        const bigValue = $big.val();
        const middleValue = $(this).val();
        $small.attr("list", "category" + bigValue + middleValue);
      });
    }
  },

  /**
   * 並び替え可能なリストを設定
   * @param {string} listId - リストのID
   * @param {Function} onUpdate - 更新時のコールバック
   */
  setupSortableList(listId, onUpdate) {
    // 既にsortableが初期化されている場合は再初期化
    if ($(listId).hasClass("ui-sortable")) {
      $(listId).sortable("destroy");
    }

    $(listId).sortable({
      revert: 50,
      distance: 5,
      tolerance: "pointer",
      cursor: "move", // カーソルを明示的に設定
      update: function (event, ui) {
        const sortedIds = $(listId).sortable("toArray");
        onUpdate(sortedIds);
      },
    });
  },
};

// グローバルに公開（ES6モジュールをサポートしない環境用）
if (typeof window !== "undefined") {
  window.UIFactory = UIFactory;
  window.ListBuilder = ListBuilder;
  window.EventHandlers = EventHandlers;
}
