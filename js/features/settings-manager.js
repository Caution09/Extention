/**
 * settings-manager.js - 設定のインポート/エクスポート管理
 * Phase 6: 基本機能強化
 */

class SettingsManager {
  constructor() {
    this.version = "1.1.0";
  }

  /**
   * 現在の設定をエクスポート
   * @returns {Object} エクスポートデータ
   */
  async exportSettings() {
    try {
      // すべてのデータを取得
      const allData = await Storage.get(null);

      const exportData = {
        version: this.version,
        exportDate: new Date().toISOString(),
        appVersion: AppState.config.toolVersion,
        settings: {
          optionData: allData.optionData || {},
          searchCategory: allData.searchCategory || {},
        },
        data: {
          localPromptList: allData.localPromptList || [],
          archivesList: allData.archivesList || [],
          categoryData: allData.categoryData || [[], [], []],
          masterPrompts: allData.masterPrompts || [],
          masterVersion: allData.masterVersion || 0,
        },
        ui: {
          currentPrompt: allData.generatePrompt || "",
        },
      };

      return exportData;
    } catch (error) {
      ErrorHandler.log("Failed to export settings", error);
      throw error;
    }
  }

  /**
   * 設定をインポート
   * @param {Object} importData - インポートするデータ
   * @param {Object} options - インポートオプション
   */
  async importSettings(importData, options = {}) {
    try {
      // バージョンチェック
      if (!this.isCompatibleVersion(importData.version)) {
        throw new Error(`互換性のないバージョンです: ${importData.version}`);
      }

      // インポートオプション
      const {
        includeSettings = true,
        includeLocalDict = true,
        includeArchives = true,
        includeCategories = true,
        includeMaster = false,
        merge = false, // true: マージ, false: 上書き
      } = options;

      const dataToImport = {};

      // 設定
      if (includeSettings && importData.settings) {
        dataToImport.optionData = importData.settings.optionData;
        dataToImport.searchCategory = importData.settings.searchCategory;
      }

      // ローカル辞書
      if (includeLocalDict && importData.data?.localPromptList) {
        if (merge) {
          // マージモード：重複チェックして追加
          const currentList = AppState.data.localPromptList || [];
          const mergedList = this.mergePromptLists(
            currentList,
            importData.data.localPromptList
          );
          dataToImport.localPromptList = mergedList;
        } else {
          dataToImport.localPromptList = importData.data.localPromptList;
        }
      }

      // アーカイブ
      if (includeArchives && importData.data?.archivesList) {
        if (merge) {
          const currentArchives = AppState.data.archivesList || [];
          const mergedArchives = this.mergeArchiveLists(
            currentArchives,
            importData.data.archivesList
          );
          dataToImport.archivesList = mergedArchives;
        } else {
          dataToImport.archivesList = importData.data.archivesList;
        }
      }

      // カテゴリーデータ
      if (includeCategories && importData.data?.categoryData) {
        dataToImport.categoryData = importData.data.categoryData;
      }

      // マスターデータ（オプション）
      if (includeMaster && importData.data?.masterPrompts) {
        dataToImport.masterPrompts = importData.data.masterPrompts;
        dataToImport.masterVersion = importData.data.masterVersion;
      }

      // 現在のプロンプト
      if (importData.ui?.currentPrompt) {
        dataToImport.generatePrompt = importData.ui.currentPrompt;
      }

      // ストレージに保存
      await Storage.set(dataToImport);

      // AppStateを更新
      await this.reloadAppState();

      return {
        success: true,
        imported: Object.keys(dataToImport),
        itemCount: this.countImportedItems(dataToImport),
      };
    } catch (error) {
      ErrorHandler.log("Failed to import settings", error);
      throw error;
    }
  }

  /**
   * バージョン互換性チェック
   */
  isCompatibleVersion(version) {
    if (!version) return false;

    const [major] = version.split(".");
    const [currentMajor] = this.version.split(".");

    // メジャーバージョンが同じなら互換性あり
    return major === currentMajor;
  }

  /**
   * プロンプトリストをマージ
   */
  mergePromptLists(currentList, importList) {
    const merged = [...currentList];
    const existingKeys = new Set(
      currentList.map((item) => this.getPromptKey(item))
    );

    for (const item of importList) {
      const key = this.getPromptKey(item);
      if (!existingKeys.has(key)) {
        merged.push(item);
      }
    }

    return merged;
  }

  /**
   * アーカイブリストをマージ
   */
  mergeArchiveLists(currentList, importList) {
    const merged = [...currentList];
    const existingPrompts = new Set(currentList.map((item) => item.prompt));

    for (const item of importList) {
      if (!existingPrompts.has(item.prompt)) {
        merged.push(item);
      }
    }

    return merged;
  }

  /**
   * プロンプトのユニークキーを生成
   */
  getPromptKey(item) {
    return `${item.prompt}|${item.data?.[0]}|${item.data?.[1]}|${item.data?.[2]}`;
  }

  /**
   * インポートしたアイテム数をカウント
   */
  countImportedItems(data) {
    let count = 0;
    if (data.localPromptList) count += data.localPromptList.length;
    if (data.archivesList) count += data.archivesList.length;
    if (data.masterPrompts) count += data.masterPrompts.length;
    return count;
  }

  /**
   * AppStateをリロード
   */
  async reloadAppState() {
    await initializeDataManager();
    categoryData.update();

    // UIを更新
    if (window.app) {
      window.app.updateUIState();
      window.app.refreshEditList();
      window.app.refreshArchiveList();
      window.app.refreshAddList();
    }
  }

  /**
   * エクスポートファイルをダウンロード
   */
  async downloadExport() {
    try {
      const exportData = await this.exportSettings();
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, -5);
      const filename = `PromptGenerator_settings_${timestamp}.json`;

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();

      URL.revokeObjectURL(url);

      ErrorHandler.notify("設定をエクスポートしました", {
        type: ErrorHandler.NotificationType.TOAST,
        messageType: "success",
        duration: 2000,
      });
    } catch (error) {
      ErrorHandler.notify("エクスポートに失敗しました", {
        type: ErrorHandler.NotificationType.TOAST,
        messageType: "error",
      });
    }
  }

  /**
   * インポートファイルを選択して読み込み
   */
  async selectAndImport(options = {}) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await this.readFileAsText(file);
        const importData = JSON.parse(text);

        // バリデーション
        if (!importData.version || !importData.exportDate) {
          throw new Error("無効な設定ファイルです");
        }

        // インポート実行
        const result = await this.importSettings(importData, options);

        ErrorHandler.notify(
          `設定をインポートしました (${result.itemCount}件)`,
          {
            type: ErrorHandler.NotificationType.TOAST,
            messageType: "success",
            duration: 3000,
          }
        );
      } catch (error) {
        ErrorHandler.notify(`インポートに失敗しました: ${error.message}`, {
          type: ErrorHandler.NotificationType.TOAST,
          messageType: "error",
        });
      }

      document.body.removeChild(input);
    });

    document.body.appendChild(input);
    input.click();
  }

  /**
   * ファイルをテキストとして読み込み
   */
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
}

// グローバルに公開
if (typeof window !== "undefined") {
  window.SettingsManager = SettingsManager;
  window.settingsManager = new SettingsManager();
}
