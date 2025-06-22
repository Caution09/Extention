/**
 * file-handler.js - ファイル処理モジュール
 * Phase 5: main.jsから分離
 */

// ============================================
// ファイルハンドラークラス
// ============================================
class FileHandler {
  constructor() {
    this.allowedTypes = {
      dictionary: ["application/json", "text/plain"],
      image: ["image/png"],
    };
  }

  async handleFile(file) {
    const fileCategory = this.getFileCategory(file.type);

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
      "辞書か画像を読みこむ (クリックして選択かドラッグドロップ)"
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
            messageType: "success", // 追加
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
