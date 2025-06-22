/**
 * csv-handler.js - CSV入出力機能モジュール（エクスポート専用）
 * Phase 7: データ連携強化
 */

class CSVHandler {
  constructor() {
    // Papa Parseはpopup.htmlで読み込み済み
    this.Papa = window.Papa || null;

    // Papa Parseが見つからない場合は簡易パーサーを使用
    if (!this.Papa) {
      console.warn("Papa Parse not found, using fallback CSV parser");
    }
  }

  /**
   * ローカル辞書をCSVにエクスポート
   * @param {Array} localPromptList - エクスポートするデータ
   */
  async exportToCSV(localPromptList) {
    try {
      // データが空の場合の確認
      if (!localPromptList || localPromptList.length === 0) {
        throw new Error("エクスポートするデータがありません");
      }

      // CSVデータを準備
      const csvData = localPromptList.map((item) => {
        // データ構造の確認（配列またはオブジェクト）
        const data0 = item.data?.[0] || item.data?.["0"] || "";
        const data1 = item.data?.[1] || item.data?.["1"] || "";
        const data2 = item.data?.[2] || item.data?.["2"] || "";

        return {
          大項目: data0,
          中項目: data1,
          小項目: data2,
          プロンプト: item.prompt || "",
          URL: item.url || "",
        };
      });

      // CSVに変換
      let csv;
      if (this.Papa) {
        // Papa Parseを使用
        csv = this.Papa.unparse(csvData, {
          header: true,
          delimiter: ",",
          encoding: "utf-8",
        });
      } else {
        // フォールバックパーサーを使用
        csv = this.unparseCSV(csvData);
      }

      // BOMを追加（Excelで文字化けを防ぐ）
      const bom = "\uFEFF";
      const csvWithBom = bom + csv;

      // ダウンロード
      this.downloadCSV(csvWithBom, "PromptGenerator_LocalDictionary.csv");

      ErrorHandler.notify("ローカル辞書をCSVでエクスポートしました", {
        type: ErrorHandler.NotificationType.TOAST,
        messageType: "success",
        duration: 2000,
      });
    } catch (error) {
      ErrorHandler.log("CSV export failed", error);
      ErrorHandler.notify("CSVエクスポートに失敗しました", {
        type: ErrorHandler.NotificationType.TOAST,
        messageType: "error",
      });
    }
  }

  /**
   * 簡易CSV生成（Papa Parseが使えない場合のフォールバック）
   */
  unparseCSV(data, options = {}) {
    if (data.length === 0) return "";

    // ヘッダー行
    const headers = Object.keys(data[0]);
    const csvLines = [headers.map((h) => this.escapeCSVValue(h)).join(",")];

    // データ行
    data.forEach((row) => {
      const values = headers.map((header) => {
        const value = row[header] || "";
        return this.escapeCSVValue(value);
      });
      csvLines.push(values.join(","));
    });

    return csvLines.join("\n");
  }

  /**
   * CSV値をエスケープ
   */
  escapeCSVValue(value) {
    const strValue = value.toString();

    // カンマ、改行、引用符を含む場合はクォートで囲む
    if (
      strValue.includes(",") ||
      strValue.includes("\n") ||
      strValue.includes('"')
    ) {
      return `"${strValue.replace(/"/g, '""')}"`;
    }

    return strValue;
  }

  /**
   * CSVをダウンロード
   * @param {string} csvContent - CSV内容
   * @param {string} filename - ファイル名
   */
  downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    const finalFilename = filename.replace(".csv", `_${timestamp}.csv`);

    const link = document.createElement("a");
    link.href = url;
    link.download = finalFilename;
    link.click();

    URL.revokeObjectURL(url);
  }
}

// ============================================
// UIへの統合（オプションパネルに配置）
// ============================================

// グローバルに公開
window.CSVHandler = CSVHandler;
window.csvHandler = new CSVHandler();

// CSVエクスポートボタンの追加
function setupCSVExportButton() {
  // CSVエクスポートボタン
  const csvExportBtn = document.createElement("input");
  csvExportBtn.type = "button";
  csvExportBtn.id = "csvExport";
  csvExportBtn.value = "ローカル辞書CSVダウンロード";
  csvExportBtn.addEventListener("click", async () => {
    await csvHandler.exportToCSV(AppState.data.localPromptList);
  });

  // 既存のボタンの後に追加
  const localDicDownload = document.getElementById("localDicDownload");
  if (localDicDownload && localDicDownload.parentNode) {
    // 改行を追加
    const br = document.createElement("br");
    localDicDownload.parentNode.insertBefore(br, localDicDownload.nextSibling);
    localDicDownload.parentNode.insertBefore(csvExportBtn, br.nextSibling);
  }
}

// DOMContentLoadedで実行
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupCSVExportButton);
} else {
  setupCSVExportButton();
}
