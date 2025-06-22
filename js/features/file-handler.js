/**
 * file-handler.js - ファイル処理モジュール
 * Phase 5: main.jsから分離 + Phase 7: CSV機能追加
 */

// ============================================
// ファイルハンドラークラス
// ============================================
class FileHandler {
  constructor() {
    this.allowedTypes = {
      dictionary: ["application/json", "text/plain"],
      image: ["image/png"],
      csv: ["text/csv", "application/vnd.ms-excel", "text/plain"], // CSV追加
    };
  }

  async handleFile(file) {
    let fileCategory = this.getFileCategory(file.type);

    // MIMEタイプで判定できない場合は拡張子で判定
    if (!fileCategory && file.name.toLowerCase().endsWith(".csv")) {
      fileCategory = "csv";
    }

    if (!fileCategory) {
      ErrorHandler.notify("対応していないファイル形式です");
      return;
    }

    const sizeValidation = Validators.validateFileSize(file, 10);
    if (!sizeValidation.isValid) {
      ErrorHandler.notify(sizeValidation.message);
      return;
    }

    await ErrorHandler.handleAsync(
      async () => {
        switch (fileCategory) {
          case "dictionary":
            await this.readDictionaryFile(file);
            break;
          case "image":
            await this.readImageFile(file);
            break;
          case "csv":
            await this.readCSVFile(file);
            break;
        }
      },
      "ファイルの読み込み",
      { showLoading: true }
    );
  }

  getFileCategory(mimeType) {
    for (const [category, types] of Object.entries(this.allowedTypes)) {
      if (types.includes(mimeType)) {
        return category;
      }
    }
    return null;
  }

  async readDictionaryFile(file) {
    $("#incluedText").text("読み込み中...");

    const content = await this.readFileAsText(file);
    const data = JSON.parse(content);

    await this.processDictionaryData(data);

    $("#incluedText").text(
      "辞書（JSON）、画像（PNG）、CSVファイルを読み込む (クリックして選択かドラッグドロップ)"
    );
  }

  async processDictionaryData(data) {
    let addCount = 0;

    switch (data.dicType) {
      case "Elements":
        // すべての要素を追加（保存はスキップ）
        for (const item of data.data) {
          if (RegistDic(item, true)) {
            // skipSave = true
            addCount++;
          }
        }

        // 最後に一度だけ保存
        if (addCount > 0) {
          await saveLocalList(); // 一度だけ実行

          ErrorHandler.notify(`${addCount}件の要素辞書を読み込みました`, {
            type: ErrorHandler.NotificationType.TOAST,
            messageType: "success",
          });
        }
        break;

      case "Prompts":
        for (const item of data.data) {
          if (this.addPromptDic(item)) {
            addCount++;
          }
        }
        if (addCount > 0) {
          await saveArchivesList();
          if (window.app) {
            window.app.refreshArchiveList();
          }
          ErrorHandler.notify(`${addCount}件のプロンプト辞書を読み込みました`, {
            type: ErrorHandler.NotificationType.TOAST,
            messageType: "success",
          });
        }
        break;

      case "Master":
        AppState.data.masterPrompts = [];
        data.data.forEach((item) => {
          AppState.data.masterPrompts.push({
            prompt: item[3],
            data: { 0: item[0], 1: item[1], 2: item[2] },
            url: item[4],
          });
        });
        await saveMasterPrompt();
        categoryData.update();
        break;
    }
  }

  addPromptDic(item) {
    const duplicate = AppState.data.archivesList.find(
      (archive) => archive.prompt === item.prompt
    );
    if (!duplicate) {
      AppState.data.archivesList.push(item);
      return true;
    }
    return false;
  }

  async readImageFile(file) {
    const arrayBuffer = await this.readFileAsArrayBuffer(file);
    const pngInfo = getPngInfo(arrayBuffer);

    const output = {
      ...pngInfo.textChunks,
      width: pngInfo.width,
      height: pngInfo.height,
    };

    createPngInfo(output);
    createPngPreview(URL.createObjectURL(file));
  }

  /**
   * CSVファイルを読み込み
   * @param {File} file - CSVファイル
   */
  async readCSVFile(file) {
    $("#incluedText").text("CSV読み込み中...");

    try {
      const text = await this.readFileAsText(file);
      const csvData = await this.parseCSV(text);

      // インポートモードの確認
      const mergeMode = document.getElementById("importMergeMode").checked;
      const mergeResult = this.mergeCSVData(
        AppState.data.localPromptList,
        csvData,
        mergeMode
      );

      // データを更新
      AppState.data.localPromptList = mergeResult.data;
      await saveLocalList();

      // リストを更新
      if (window.app) {
        window.app.refreshAddList();
      }

      // 結果通知
      const message = mergeMode
        ? `CSVをインポートしました（追加: ${mergeResult.added}件, スキップ: ${mergeResult.skipped}件）`
        : `CSVをインポートしました（${mergeResult.total}件）`;

      ErrorHandler.notify(message, {
        type: ErrorHandler.NotificationType.TOAST,
        messageType: "success",
        duration: 3000,
      });
    } catch (error) {
      ErrorHandler.notify(`CSVインポートに失敗しました: ${error.message}`, {
        type: ErrorHandler.NotificationType.TOAST,
        messageType: "error",
      });
    } finally {
      $("#incluedText").text(
        "辞書（JSON）、画像（PNG）、CSVファイルを読み込む (クリックして選択かドラッグドロップ)"
      );
    }
  }

  /**
   * CSVを解析
   * @param {string} text - CSVテキスト
   * @returns {Promise<Array>} パース済みデータ
   */
  async parseCSV(text) {
    // Papa Parseが使える場合
    if (window.Papa) {
      const results = window.Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        delimitersToGuess: [",", "\t", "|", ";"],
      });
      return this.processCSVData(results.data);
    }

    // フォールバックパーサー
    const csvData = this.parseCSVFallback(text);
    return this.processCSVData(csvData);
  }

  /**
   * フォールバックCSVパーサー
   * @param {string} text - CSVテキスト
   * @returns {Array} パース済みデータ
   */
  parseCSVFallback(text) {
    const rows = [];
    const lines = text.split(/\r?\n/);

    if (lines.length === 0) return rows;

    // ヘッダー行を解析
    const headers = this.parseCSVLine(lines[0]);

    // データ行を解析
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = this.parseCSVLine(lines[i]);
      const row = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      rows.push(row);
    }

    return rows;
  }

  /**
   * CSV行を解析（クォート対応）
   * @param {string} line - CSV行
   * @returns {Array} 値の配列
   */
  parseCSVLine(line) {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // エスケープされた引用符
          current += '"';
          i++; // 次の引用符をスキップ
        } else {
          // 引用符の開始/終了
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        // フィールドの区切り
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    // 最後のフィールド
    values.push(current.trim());
    return values;
  }

  /**
   * CSVデータを処理してアプリケーション形式に変換
   * @param {Array} csvData - パース済みCSVデータ
   * @returns {Array} 変換済みデータ
   */
  processCSVData(csvData) {
    const processedData = [];
    const requiredHeaders = ["大項目", "中項目", "小項目", "プロンプト"];

    // ヘッダーチェック
    if (csvData.length > 0) {
      const headers = Object.keys(csvData[0]);
      const missingHeaders = requiredHeaders.filter(
        (h) => !headers.some((header) => header.trim() === h)
      );

      if (missingHeaders.length > 0) {
        throw new Error(`必須列が不足しています: ${missingHeaders.join(", ")}`);
      }
    }

    // データ変換
    csvData.forEach((row, index) => {
      if (!row["プロンプト"] || row["プロンプト"].toString().trim() === "") {
        return;
      }

      const item = {
        prompt: row["プロンプト"].toString().trim(),
        data: {
          0: (row["大項目"] || "").toString().trim(),
          1: (row["中項目"] || "").toString().trim(),
          2: (row["小項目"] || "").toString().trim(),
        },
      };

      // URLがある場合は追加
      if (row["URL"]) {
        item.url = row["URL"].toString().trim();
      }

      // バリデーション
      const validation = Validators.validatePrompt(item.prompt);
      if (!validation.isValid) {
        console.warn(`行 ${index + 2}: ${validation.errors[0].message}`);
      }

      processedData.push(item);
    });

    return processedData;
  }

  /**
   * CSVデータのマージ
   * @param {Array} existingData - 既存データ
   * @param {Array} importData - インポートデータ
   * @param {boolean} merge - マージモード
   * @returns {Object} マージ結果
   */
  mergeCSVData(existingData, importData, merge = false) {
    if (!merge) {
      // 上書きモード
      return {
        data: importData,
        added: importData.length,
        skipped: 0,
        total: importData.length,
      };
    }

    // マージモード
    const result = [...existingData];
    let added = 0;
    let skipped = 0;

    importData.forEach((item) => {
      const validation = Validators.checkDuplicatePrompt(item, result);
      if (validation.isValid) {
        result.push(item);
        added++;
      } else {
        skipped++;
      }
    });

    return {
      data: result,
      added,
      skipped,
      total: importData.length,
    };
  }

  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
}

// グローバルに公開
if (typeof window !== "undefined") {
  window.FileHandler = FileHandler;
}

// その他タブの説明文を更新
document.addEventListener("DOMContentLoaded", () => {
  const incluedText = document.getElementById("incluedText");
  if (incluedText) {
    incluedText.textContent =
      "辞書（JSON）、画像（PNG）、CSVファイルを読み込む (クリックして選択かドラッグドロップ)";
  }
});
