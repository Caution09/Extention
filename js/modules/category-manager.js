/**
 * カテゴリー管理モジュール（最適化版）
 * メモリ効率とパフォーマンスを重視した実装
 */
const categoryData = {
  // カテゴリーデータ
  data: [[], [], []],

  // datalistの参照を保持（メモリリーク対策）
  _datalistRefs: new Map(),

  // 更新中フラグ
  _isUpdating: false,

  /**
   * 初期化
   */
  init: function () {
    Storage.get(["categoryData"])
      .then((items) => {
        if (items.categoryData != null) {
          this.data = items.categoryData;
          this.createDatalist();
        }
      })
      .catch((error) => {
        ErrorHandler.log("カテゴリーデータの読み込みに失敗", error);
      });
  },

  /**
   * カテゴリーデータを更新（最適化版）
   */
  update: function () {
    // 更新中の場合はスキップ
    if (this._isUpdating) {
      console.log("Category update already in progress, skipping");
      return;
    }

    this._isUpdating = true;

    // パフォーマンス測定開始
    if (window.PerformanceMonitor) {
      PerformanceMonitor.start("categoryUpdate");
    }

    try {
      // データをリセット
      this.data = [[], [], []];

      // 重複チェック用のMapを使用（高速化）
      const uniqueKeys = [new Map(), new Map(), new Map()];

      // データソースを結合
      const allItems = [
        ...AppState.data.localPromptList,
        ...AppState.data.masterPrompts,
      ];

      // バッチ処理で効率化
      allItems.forEach((item) => {
        if (item && item.data) {
          this.addItem(item, uniqueKeys);
        }
      });

      // ストレージに保存（非同期）
      Storage.set({ categoryData: this.data })
        .then(() => {
          console.log("Category data saved successfully");
        })
        .catch((error) => {
          ErrorHandler.log("カテゴリーデータの保存に失敗", error);
        });

      // datalistを再作成
      this.createDatalist();
    } finally {
      this._isUpdating = false;

      if (window.PerformanceMonitor) {
        PerformanceMonitor.end("categoryUpdate");
      }
    }
  },

  /**
   * カテゴリーアイテムを追加（最適化版）
   * @param {Object} item - 追加するアイテム
   * @param {Map[]} uniqueKeys - 重複チェック用のMap配列
   */
  addItem: function (item, uniqueKeys) {
    for (let i = 0; i < 3; i++) {
      const value = item.data[i];
      if (!value) continue;

      // 親要素のキーを構築
      let parentKey = "";
      for (let j = 0; j < i; j++) {
        parentKey += (item.data[j] || "").replace(/[!\/]/g, "");
      }

      // ユニークキーを生成
      const uniqueKey = `${value}|${parentKey}`;

      // 重複チェック（Map使用で高速化）
      if (!uniqueKeys[i].has(uniqueKey)) {
        uniqueKeys[i].set(uniqueKey, true);

        const pushData = { value: value };

        // parentは i > 0 の場合のみ設定（元のコードと同じ構造）
        if (i > 0) {
          pushData.parent = parentKey;
        }

        this.data[i].push(pushData);
      }
    }
  },

  /**
   * datalistを作成（メモリリーク対策版）
   */
  createDatalist: function () {
    if (window.PerformanceMonitor) {
      PerformanceMonitor.start("createDatalist");
    }

    // 古いdatalistの参照をクリア（メモリリーク対策）
    this.cleanupDatalistRefs();

    // メインのdatalist要素を取得
    const bigCategory = document.getElementById("category");
    if (!bigCategory) {
      console.error("Category datalist not found");
      return;
    }

    // DocumentFragmentを使用してDOM操作を最適化
    const fragment = document.createDocumentFragment();

    // 大カテゴリーのオプションを作成
    this.data[0].forEach((item) => {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.value;
      fragment.appendChild(option);
    });

    // 一度にDOMに追加
    bigCategory.innerHTML = "";
    bigCategory.appendChild(fragment);

    // 中・小カテゴリーのdatalistを作成
    this.createSubDatalistsBatch();

    // 検索カテゴリーの初期化
    setCategoryList("#search-cat0", 0);

    if (window.PerformanceMonitor) {
      PerformanceMonitor.end("createDatalist");
    }
  },

  /**
   * サブカテゴリーのdatalistをバッチ作成
   */
  createSubDatalistsBatch: function () {
    // 一時的なコンテナを作成
    const tempContainer = document.createDocumentFragment();

    // 中カテゴリーのdatalistを作成
    const middleDatalistMap = new Map();

    // 大カテゴリーごとにdatalistを作成
    this.data[0].forEach((item) => {
      const datalistId = "category" + item.value;
      const datalist = document.createElement("datalist");
      datalist.id = datalistId;

      middleDatalistMap.set(item.value, datalist);
      this._datalistRefs.set(datalistId, datalist);
      tempContainer.appendChild(datalist);
    });

    // 中カテゴリーのオプションを追加
    this.data[1].forEach((item) => {
      const parentDatalist = middleDatalistMap.get(item.parent);
      if (parentDatalist) {
        const option = document.createElement("option");
        option.value = item.value;
        option.textContent = item.value;
        parentDatalist.appendChild(option);

        // 小カテゴリーのdatalistも作成
        // 注意: parentには大カテゴリーのみが入っているので、大カテゴリー + 中カテゴリーでIDを構成
        const smallDatalistId = "category" + item.parent + item.value;
        const smallDatalist = document.createElement("datalist");
        smallDatalist.id = smallDatalistId;

        this._datalistRefs.set(smallDatalistId, smallDatalist);
        tempContainer.appendChild(smallDatalist);
      }
    });

    // 小カテゴリーのオプションを追加
    this.data[2].forEach((item) => {
      // parentには「大カテゴリー中カテゴリー」が連結されている
      const datalistId = "category" + item.parent;
      const datalist = this._datalistRefs.get(datalistId);

      if (datalist) {
        const option = document.createElement("option");
        option.value = item.value;
        option.textContent = item.value;
        datalist.appendChild(option);
      }
    });

    // 一度にDOMに追加
    document.body.appendChild(tempContainer);
  },

  /**
   * 古いdatalistの参照をクリーンアップ
   */
  cleanupDatalistRefs: function () {
    // 既存のdatalistを削除（メインのcategory以外）
    const existingDataLists = document.querySelectorAll(
      'datalist[id^="category"]:not(#category)'
    );

    existingDataLists.forEach((datalist) => {
      // イベントリスナーのクリーンアップ
      datalist.replaceWith(datalist.cloneNode(false));
      datalist.remove();
    });

    // 参照をクリア
    this._datalistRefs.clear();
  },

  /**
   * カテゴリーを検索（最適化版）
   * @param {number} level - カテゴリーレベル（0-2）
   * @param {string} parentValue - 親カテゴリーの値
   * @returns {Array} マッチするカテゴリーの配列
   */
  getCategoriesByParent: function (level, parentValue = null) {
    if (level < 0 || level > 2) return [];

    if (level === 0 || !parentValue) {
      return this.data[level].map((item) => item.value);
    }

    return this.data[level]
      .filter((item) => item.parent === parentValue)
      .map((item) => item.value);
  },

  /**
   * カテゴリーの存在確認（高速版）
   * @param {string} value - 確認する値
   * @param {number} level - カテゴリーレベル
   * @param {string} [parent] - 親カテゴリー
   * @returns {boolean}
   */
  exists: function (value, level, parent = null) {
    return this.data[level].some(
      (item) =>
        item.value === value && (parent === null || item.parent === parent)
    );
  },

  /**
   * カテゴリーデータの統計情報を取得
   * @returns {Object} 統計情報
   */
  getStats: function () {
    return {
      bigCategories: this.data[0].length,
      middleCategories: this.data[1].length,
      smallCategories: this.data[2].length,
      totalDataLists: this._datalistRefs.size,
      memoryEstimate: this.estimateMemoryUsage(),
    };
  },

  /**
   * メモリ使用量の推定
   * @returns {string} 推定メモリ使用量
   */
  estimateMemoryUsage: function () {
    let totalChars = 0;

    this.data.forEach((level) => {
      level.forEach((item) => {
        totalChars += (item.value || "").length;
        totalChars += (item.parent || "").length;
      });
    });

    // 文字数から大まかなメモリ使用量を推定（1文字約2バイト）
    const estimatedBytes = totalChars * 2;

    if (estimatedBytes < 1024) {
      return `${estimatedBytes} B`;
    } else if (estimatedBytes < 1024 * 1024) {
      return `${(estimatedBytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(estimatedBytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  },

  /**
   * デバッグ情報を出力
   */
  debug: function () {
    const stats = this.getStats();
    console.group("CategoryData Debug Info");
    console.log("Statistics:", stats);
    console.log("Data structure:", this.data);
    console.log("DataList references:", this._datalistRefs.size);
    console.groupEnd();
  },
};

/**
 * カテゴリー選択ヘルパー関数（最適化版）
 */
function setCategoryList(selectorId, categoryLevel) {
  const selectElement = document.querySelector(selectorId);
  if (!selectElement) return;

  // 既存のオプションをクリア
  selectElement.innerHTML = "";

  // 空のオプションを追加
  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "";
  selectElement.appendChild(emptyOption);

  // DocumentFragmentを使用
  const fragment = document.createDocumentFragment();

  categoryData.data[categoryLevel].forEach((item) => {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.value;
    fragment.appendChild(option);
  });

  selectElement.appendChild(fragment);
  selectElement.disabled = false;
  selectElement.value = "";
}

/**
 * デバウンス付きカテゴリー更新
 * カテゴリー管理の一部として、このモジュール内で管理
 */
let categoryUpdateTimer = null;

function debouncedCategoryUpdate() {
  // 既存のタイマーをクリア
  if (categoryUpdateTimer) {
    clearTimeout(categoryUpdateTimer);
  }

  // 500ms後に実行
  categoryUpdateTimer = setTimeout(() => {
    categoryData.update();
    categoryUpdateTimer = null;
  }, 500);
}

// グローバルに公開
if (typeof window !== "undefined") {
  window.categoryData = categoryData;
  window.setCategoryList = setCategoryList;
  window.debouncedCategoryUpdate = debouncedCategoryUpdate;
}
