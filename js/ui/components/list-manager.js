// ============================================
// リスト管理クラス
// ============================================
class PromptListManager {
  constructor() {
    this.listConfigs = {
      search: {
        headers: ["大項目", "中項目", "小項目", "Prompt"],
        createItem: async ($li, item, index, options) =>
          await this.createSearchItem($li, item, index, options),
      },
      add: {
        headers: ["大項目", "中項目", "小項目", "Prompt"],
        createItem: async ($li, item, index, options) =>
          await this.createAddItem($li, item, index, options),
        sortable: true,
      },
      master: {
        headers: ["大項目", "中項目", "小項目", "Prompt"],
        createItem: async ($li, item, index, options) =>
          await this.createMasterItem($li, item, index, options),
      },
      archive: {
        headers: ["名前", "Prompt"],
        createItem: async ($li, item, index, options) =>
          await this.createArchiveItem($li, item, index, options),
        columnWidths: { 1: "150px" },
      },
      edit: {
        headers: ["Prompt", "重み"],
        createItem: async ($li, item, index, options) =>
          await this.createEditItem($li, item, index, options),
        sortable: true,
        columnWidths: { 1: "400px", 2: "30px" },
      },
      editDropdown: {
        headers: ["大項目", "中項目", "小項目", "Prompt", "重み"],
        createItem: async ($li, item, index, options) =>
          await this.createEditDropdownItem($li, item, index, options),
        sortable: true,
        columnWidths: {
          1: "80px",
          2: "80px",
          3: "80px",
          4: "130px",
          5: "30px",
        },
      },
    };
  }

  async createList(type, data, listId, options = {}) {
    const config = this.listConfigs[type];
    if (!config) {
      throw new Error(`Unknown list type: ${type}`);
    }

    console.log(
      `Creating ${type} list with ${data.length} items for ${listId}`
    );

    ListBuilder.clearList(listId);
    ListBuilder.createHeaders(listId, config.headers);

    // optionsにlistIdを追加
    const itemOptions = { ...options, listId, type };

    for (let i = 0; i < data.length; i++) {
      console.log(`Creating item ${i}:`, data[i]);

      const $li = UIFactory.createListItem({
        id: config.sortable ? i : undefined,
        sortable: config.sortable,
      });

      await config.createItem.call(this, $li, data[i], i, itemOptions);
      $(listId).append($li);
    }

    if (config.columnWidths) {
      ListBuilder.setColumnWidths(listId, config.columnWidths);
    }

    // リスト作成完了後、sortableを再初期化
    if (config.sortable && type === "edit") {
      setTimeout(() => {
        EventHandlers.setupSortableList(listId, (sortedIds) => {
          let baseIndex = 0;
          sortedIds.forEach((id) => {
            if (!id) return;
            editPrompt.elements[id].sort = baseIndex++;
          });
          editPrompt.generate();
          window.app.updatePromptDisplay();
        });
      }, 100); // DOMが完全に更新されるのを待つ
    }

    console.log(
      `List ${type} created, final children count:`,
      $(listId).children().length
    );
  }

  // 各リストアイテムの作成メソッド
  async createSearchItem($li, item, index, options) {
    const inputs = [];

    // カテゴリー入力
    for (let i = 0; i < 3; i++) {
      const $input = UIFactory.createInput({ value: item.data[i] });
      inputs.push($input);
      $li.append($input);
    }

    // プロンプト入力
    $li.append(UIFactory.createInput({ value: item.prompt }));

    // ボタン
    const buttons = UIFactory.createButtonSet({
      includeSet: true,
      includeCopy: true,
      setValue: item.prompt + ",",
      copyValue: item.prompt,
      // onSetを削除
    });

    $li.append(buttons.set, buttons.copy);

    // 登録ボタン（翻訳結果の場合）
    if (options.isSave) {
      const $registButton = this.createRegistButton(inputs, item.prompt);
      $li.append($registButton);
    }

    // プレビューボタン
    if (item.url) {
      $li.append(UIFactory.createPreviewButton(item));
    }
  }

  // list-manager.js - createAddItem メソッドの修正（見た目は一切変えない）
  // createAddItem メソッドの修正
  async createAddItem($li, item, index, options = {}) {
    // カテゴリー入力
    const categoryInputs = [];

    for (let i = 0; i < 3; i++) {
      const $input = UIFactory.createInput({
        value: item.data[i],
        index: index,
        onInput: (value) => {
          AppState.data.localPromptList[index].data[i] = value;
        },
        onBlur: () => saveLocalList(),
      });

      // datalist属性を追加（見た目は変えない）
      if (i === 0) {
        $input.attr("list", "category");
      } else if (i === 1 && item.data[0]) {
        $input.attr("list", "category" + item.data[0]);
      } else if (i === 2 && item.data[0] && item.data[1]) {
        $input.attr("list", "category" + item.data[0] + item.data[1]);
      }

      // マウスオーバーでクリアする機能を追加
      EventHandlers.addInputClearBehavior($input);

      categoryInputs.push($input);
      $li.append($input);
    }

    // 大項目変更時に中項目・小項目のdatalistを更新
    categoryInputs[0].on("change", function () {
      const newValue = $(this).val();
      if (newValue) {
        categoryInputs[1].attr("list", "category" + newValue);
      } else {
        categoryInputs[1].removeAttr("list");
      }
      categoryInputs[2].removeAttr("list");
    });

    // 中項目変更時に小項目のdatalistを更新
    categoryInputs[1].on("change", function () {
      const bigValue = categoryInputs[0].val();
      const middleValue = $(this).val();
      if (bigValue && middleValue) {
        categoryInputs[2].attr("list", "category" + bigValue + middleValue);
      } else {
        categoryInputs[2].removeAttr("list");
      }
    });

    // プロンプト入力（既存のコードそのまま）
    $li.append(
      UIFactory.createInput({
        value: item.prompt,
        index: index,
        onInput: (value) => {
          AppState.data.localPromptList[index].prompt = value;
        },
        onBlur: () => saveLocalList(),
      })
    );

    // 以下、既存のボタン処理はそのまま...
    const isLocalDictionary = options.type === "add";

    const buttons = UIFactory.createButtonSet({
      includeSet: true,
      includeCopy: true,
      includeDelete: isLocalDictionary,
      setValue: item.prompt + ",",
      copyValue: item.prompt,
      onDelete: async () => {
        const actualIndex = getLocalElementIndex(item);
        if (actualIndex !== -1) {
          AppState.data.localPromptList.splice(actualIndex, 1);

          $li.fadeOut(200, async () => {
            $li.remove();

            $("#addPromptList li").each((newIndex, element) => {
              if (element.id !== String(newIndex)) {
                element.id = newIndex;
              }
            });

            await Storage.set({
              localPromptList: AppState.data.localPromptList,
            });

            debouncedCategoryUpdate();
          });
        }
      },
    });

    $li.append(buttons.set, buttons.copy);

    if (item.url) {
      $li.append(UIFactory.createPreviewButton(item));
    }

    if (isLocalDictionary && buttons.delete) {
      $li.append(buttons.delete);
      AppState.data.localPromptList[index].sort = index;
      $li.append(UIFactory.createDragIcon(index));
    }
  }

  // 新規メソッド：中項目のdatalistを更新
  updateMiddleCategoryDatalist($li, bigValue) {
    const middleInput = $li.find("input").eq(1);
    const smallInput = $li.find("input").eq(2);

    if (bigValue) {
      middleInput.attr("list", "category" + bigValue);
      // 大項目が変わったら中項目・小項目をクリア
      middleInput.val("");
      smallInput.val("");
      smallInput.attr("list", "");
    } else {
      middleInput.attr("list", "");
      smallInput.attr("list", "");
    }
  }

  // 新規メソッド：小項目のdatalistを更新
  updateSmallCategoryDatalist($li, bigValue, middleValue) {
    const smallInput = $li.find("input").eq(2);

    if (bigValue && middleValue) {
      smallInput.attr("list", "category" + bigValue + middleValue);
    } else {
      smallInput.attr("list", "");
    }
  }

  async createMasterItem($li, item, index, options = {}) {
    // カテゴリー入力（読み取り専用）
    for (let i = 0; i < 3; i++) {
      $li.append(
        UIFactory.createInput({
          value: item.data[i],
          readonly: true,
        })
      );
    }

    // プロンプト入力（読み取り専用）
    $li.append(
      UIFactory.createInput({
        value: item.prompt,
        readonly: true,
      })
    );

    // ボタン（SetとCopyのみ）
    const buttons = UIFactory.createButtonSet({
      includeSet: true,
      includeCopy: true,
      setValue: item.prompt + ",",
      copyValue: item.prompt,
    });

    $li.append(buttons.set, buttons.copy);

    // プレビューボタン
    if (item.url) {
      $li.append(UIFactory.createPreviewButton(item));
    }
  }

  async createArchiveItem($li, item, index, options = {}) {
    // タイトル入力
    $li.append(
      UIFactory.createInput({
        value: item.title,
        index: index,
        onInput: async (value) => {
          AppState.data.archivesList[index].title = value;
          await saveArchivesList();
        },
      })
    );

    // プロンプト入力
    $li.append(
      UIFactory.createInput({
        value: item.prompt,
        index: index,
        onInput: async (value) => {
          AppState.data.archivesList[index].prompt = value;
          await saveArchivesList();
        },
      })
    );

    // ボタン
    const buttons = UIFactory.createButtonSet({
      includeLoad: true,
      includeCopy: true,
      includeDelete: true,
      loadValue: item.prompt,
      copyValue: item.prompt,
      onDelete: async () => {
        AppState.data.archivesList.splice(index, 1);
        await saveArchivesList();
        window.app.refreshArchiveList();
      },
    });

    $li.append(buttons.load, buttons.copy, buttons.delete);
  }

  async createEditItem($li, item, index, options = {}) {
    const shaping = AppState.userSettings.optionData.shaping;
    const weight = item[shaping].weight;
    const value = item.Value;

    // プロンプト入力（テキスト編集用）
    const $valueInput = UIFactory.createInput({
      value: value,
      index: index,
      style: { width: "400px" },
      onInput: (newValue) => {
        editPrompt.editingValue(newValue, index);
        window.app.updatePromptDisplay();
        promptSlotManager.saveCurrentSlot();
      },
    });

    // 重み入力
    const $weightInput = UIFactory.createInput({
      value: weight !== null && weight !== undefined ? weight : "0",
      index: index,
      style: { width: "50px" },
      onInput: (newWeight) => {
        const cleanWeight = newWeight.replace(/[^-0-9.]/g, "");
        editPrompt.editingWeight(cleanWeight, index);
        window.app.updatePromptDisplay();
      },
    });

    $li.append($valueInput);

    // 重みがある場合のみ表示
    if (weight !== null && weight !== undefined) {
      $li.append($weightInput);
    }

    // 重み調整ボタン
    const weightDelta = shaping === "SD" ? 0.1 : shaping === "NAI" ? 1 : 0;
    if (weightDelta > 0) {
      // UIFactoryを使わずに直接ボタンを作成
      const weightPlusBtn = document.createElement("button");
      weightPlusBtn.textContent = "+";
      weightPlusBtn.type = "submit";
      weightPlusBtn.addEventListener("click", () => {
        editPrompt.addWeight(weightDelta, index);
        window.app.updatePromptDisplay();

        // 重み入力フィールドの値を更新
        const newWeight = editPrompt.elements[index][shaping].weight;
        $weightInput.val(newWeight);
      });

      const weightMinusBtn = document.createElement("button");
      weightMinusBtn.textContent = "-";
      weightMinusBtn.type = "submit";
      weightMinusBtn.addEventListener("click", () => {
        editPrompt.addWeight(-weightDelta, index);
        window.app.updatePromptDisplay();

        // 重み入力フィールドの値を更新
        const newWeight = editPrompt.elements[index][shaping].weight;
        $weightInput.val(newWeight);
      });

      $li.append(weightPlusBtn, weightMinusBtn);
    }

    // 削除ボタン
    const deleteButton = UIFactory.createButtonSet({
      includeDelete: true,
      onDelete: () => {
        editPrompt.removeElement(index);
        window.app.updatePromptDisplay();
        window.app.refreshEditList();
      },
    });
    $li.append(deleteButton.delete);

    // ドラッグアイコン
    $li.append(UIFactory.createDragIcon(index));
  }

  async createEditDropdownItem($li, item, index, options = {}) {
    const shaping = AppState.userSettings.optionData.shaping;
    const weight = item[shaping].weight;
    const prompt = item.Value.toLowerCase().trim();

    // カテゴリー検索
    let category = null;
    const findCategory = (dataList) => {
      return (
        dataList.find((dicData) => dicData.prompt === prompt)?.data || null
      );
    };

    category =
      findCategory(AppState.data.masterPrompts) ||
      findCategory(AppState.data.localPromptList);

    // カテゴリー入力フィールド
    const categoryInputs = [];
    for (let i = 0; i < 3; i++) {
      const $input = UIFactory.createInput({
        value: category ? category[i] : "翻訳中",
        readonly: false,
      });

      if (!category) {
        $input.prop("disabled", true);
      } else {
        EventHandlers.addInputClearBehavior($input);
      }

      categoryInputs.push($input);
      $li.append($input);
    }

    // 要素のIDを使って実際のインデックスを見つける関数
    const findRealIndex = () => {
      return editPrompt.elements.findIndex((el) => el.id === item.id);
    };

    // プロンプト入力
    const $valueInput = UIFactory.createInput({
      value: prompt,
      index: index,
      onInput: (value) => {
        const realIndex = findRealIndex();
        if (realIndex !== -1) {
          editPrompt.editingValue(value, realIndex);
          $weightInput.val(editPrompt.elements[realIndex][shaping].weight);
          window.app.updatePromptDisplay();
        }
      },
    });

    // 重み入力
    const $weightInput = UIFactory.createInput({
      value: weight !== null && weight !== undefined ? weight : "0",
      index: index,
      onInput: (value) => {
        const cleanWeight = value.replace(/[^-0-9.]/g, "");
        const realIndex = findRealIndex();
        if (realIndex !== -1) {
          editPrompt.editingWeight(cleanWeight, realIndex);
          window.app.updatePromptDisplay();
        }
      },
    });

    $li.append($valueInput);
    if (weight !== null && weight !== undefined) {
      $li.append($weightInput);
    }

    // 重み調整ボタン
    const weightDelta = shaping === "SD" ? 0.1 : shaping === "NAI" ? 1 : 0;
    if (weightDelta > 0) {
      // UIFactoryを使わずに直接ボタンを作成
      const weightPlusBtn = document.createElement("button");
      weightPlusBtn.textContent = "+";
      weightPlusBtn.type = "submit";
      weightPlusBtn.addEventListener("click", () => {
        const realIndex = findRealIndex();
        if (realIndex !== -1) {
          editPrompt.addWeight(weightDelta, realIndex);
          window.app.updatePromptDisplay();

          // 重み入力フィールドの値を更新
          const newWeight = editPrompt.elements[realIndex][shaping].weight;
          $weightInput.val(newWeight);
        }
      });

      const weightMinusBtn = document.createElement("button");
      weightMinusBtn.textContent = "-";
      weightMinusBtn.type = "submit";
      weightMinusBtn.addEventListener("click", () => {
        const realIndex = findRealIndex();
        if (realIndex !== -1) {
          editPrompt.addWeight(-weightDelta, realIndex);
          window.app.updatePromptDisplay();

          // 重み入力フィールドの値を更新
          const newWeight = editPrompt.elements[realIndex][shaping].weight;
          $weightInput.val(newWeight);
        }
      });

      $li.append(weightPlusBtn, weightMinusBtn);
    }

    // 削除ボタン
    const deleteButton = UIFactory.createButtonSet({
      includeDelete: true,
      onDelete: () => {
        const realIndex = findRealIndex();
        if (realIndex !== -1) {
          editPrompt.removeElement(realIndex);
          window.app.updatePromptDisplay();
          window.app.refreshEditList();
        }
      },
    });
    $li.append(deleteButton.delete);

    // 追加ボタンまたはプレビューボタン
    if (!category) {
      const $registButton = this.createRegistButton(categoryInputs, prompt);
      $li.append($registButton);

      // 翻訳処理をキューに追加
      this.queueTranslation(prompt, categoryInputs);
    } else {
      // マスターとローカル両方から検索（修正済み）
      const masterElement = AppState.data.masterPrompts.find(
        (e) => e.prompt === prompt
      );
      const localElement = AppState.data.localPromptList.find(
        (e) => e.prompt === prompt
      );

      // ローカルを優先
      const element = localElement || masterElement;

      if (element?.url) {
        $li.append(UIFactory.createPreviewButton(element));
      }
    }

    // カテゴリー連動設定
    this.setupCategoryDropdownChain(
      categoryInputs,
      $valueInput,
      $weightInput,
      index
    );

    $li.append(UIFactory.createDragIcon(index));
  }

  createRegistButton(inputFields, prompt) {
    const $button = UIFactory.createJQueryButton({
      text: "N",
      onClick: () => {
        const data = {
          big: inputFields[0].val(),
          middle: inputFields[1].val(),
          small: inputFields[2].val(),
        };

        Regist(data.big, data.middle, data.small, prompt);
        $button.remove();
        window.app.refreshAddList();
      },
    });

    // 新しく作成された入力フィールドに対してのみカテゴリー連動を設定
    EventHandlers.setupCategoryChain(inputFields);
    EventHandlers.addInputClearBehaviorToMany(inputFields);

    return $button;
  }

  setupCategoryDropdownChain(categoryInputs, $valueInput, $weightInput, index) {
    let categoryValue = categoryInputs[0].val();

    categoryInputs[0].attr("list", "category");
    categoryInputs[1].attr("list", "category" + categoryValue);
    categoryInputs[2].attr(
      "list",
      "category" + categoryValue + categoryInputs[1].val()
    );

    categoryInputs[0].on("change", function () {
      categoryValue = $(this).val();
      categoryInputs[1].attr("list", "category" + categoryValue);
      categoryInputs[2].attr(
        "list",
        "category" + categoryValue + categoryInputs[1].val()
      );
    });

    categoryInputs[1].on("change", function () {
      categoryInputs[2].attr(
        "list",
        "category" + categoryValue + $(this).val()
      );
    });

    categoryInputs[2].on("change", function () {
      const inputValue = $(this).val();

      // マスターとローカル両方から検索（修正済み）
      const masterPrompt = AppState.data.masterPrompts.find(
        (p) => p.data[2] === inputValue
      );
      const localPrompt = AppState.data.localPromptList.find(
        (p) => p.data[2] === inputValue
      );

      // ローカルを優先、なければマスター、それでもなければ現在の値
      const foundPrompt = localPrompt || masterPrompt;
      const newPrompt = foundPrompt?.prompt || $valueInput.val();

      $valueInput.val(newPrompt);
      editPrompt.editingValue(
        editPrompt.getValue(
          AppState.userSettings.optionData.shaping,
          newPrompt,
          $weightInput.val()
        ),
        index
      );
      window.app.updatePromptDisplay();
    });
  }

  // 翻訳キュー管理
  translationQueue = [];
  translationTimer = null;
  translatedCache = new Map(); // 翻訳結果のキャッシュ

  queueTranslation(keyword, inputFields) {
    // すでに翻訳済みの場合はキャッシュから取得
    if (this.translatedCache.has(keyword)) {
      const cached = this.translatedCache.get(keyword);
      this.applyTranslationResult(inputFields, cached);
      return;
    }

    // 既にキューに存在する場合は追加しない
    const existing = this.translationQueue.find(
      (item) => item.keyword === keyword
    );
    if (existing) {
      return;
    }

    this.translationQueue.push({ keyword, inputFields });

    // バッチ処理のタイマーがまだない場合は開始
    if (!this.translationTimer) {
      this.translationTimer = setTimeout(
        () => this.processTranslationQueue(),
        100
      );
    }
  }

  applyTranslationResult(inputFields, translation) {
    inputFields.forEach(($input) => $input.prop("disabled", false));
    inputFields[0].val("");
    inputFields[1].val("Google翻訳");
    inputFields[2].val(translation);
  }

  async processTranslationQueue() {
    if (this.translationQueue.length === 0) {
      this.translationTimer = null;
      return;
    }

    // 重複を除去
    const uniqueQueue = this.translationQueue.filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.keyword === item.keyword)
    );

    const batch = uniqueQueue.splice(0, 10); // 最大10件ずつ処理
    this.translationQueue = this.translationQueue.filter(
      (item) => !batch.some((b) => b.keyword === item.keyword)
    );

    const keywords = batch.map((item) => item.keyword).join(",");

    try {
      const translations = await new Promise((resolve) => {
        translateGoogle(keywords, resolve);
      });

      // 結果が配列でない場合の処理
      const translationArray = Array.isArray(translations)
        ? translations
        : [translations];

      translationArray.forEach((translation, index) => {
        if (batch[index]) {
          const { keyword, inputFields } = batch[index];
          // キャッシュに保存
          this.translatedCache.set(keyword, translation);
          this.applyTranslationResult(inputFields, translation);
        }
      });
    } catch (error) {
      ErrorHandler.log("Translation batch failed", error);
    }

    // まだキューに残りがある場合は続行
    if (this.translationQueue.length > 0) {
      this.translationTimer = setTimeout(
        () => this.processTranslationQueue(),
        100
      );
    } else {
      this.translationTimer = null;
    }
  }

  showCategoryHint($input, level) {
    const hints = [
      "既存のカテゴリーから選択するか、新規入力できます",
      "大項目に応じた中項目が候補に表示されます",
      "大項目と中項目に応じた小項目が候補に表示されます",
    ];

    $input.attr("placeholder", hints[level]);
    $input.attr("title", hints[level]);
  }
}

// グローバルに公開
if (typeof window !== "undefined") {
  window.PromptListManager = PromptListManager;
}
