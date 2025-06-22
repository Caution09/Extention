/**
 * ui-utilities.js - UI関連ユーティリティモジュール
 * Phase 5: main.jsから分離
 */

// ============================================
// UIユーティリティ
// ============================================
const UIUtilities = {
  /**
   * プロンプト画像のプレビューを表示
   * @param {Object} value - プレビューするアイテム
   */
  previewPromptImage(value) {
    const imageUrl = `https://ul.h3z.jp/${value.url}.jpg`;

    fetch(imageUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const arrayBuffer = reader.result;
          const binary = atob(arrayBuffer.split(",")[1]);

          $("#popup-image").attr({
            src: `data:image/png;base64,${binary}`,
            width: "256",
            height: "256",
          });

          $("#preview-element").text(
            `${value.data[0]}:${value.data[1]}:${value.data[2]}`
          );
          $("#preview-prompt").val(value.prompt);
          $("#popup").css({ display: "flex" }).show();
        };
        reader.readAsDataURL(blob);
      })
      .catch((error) => {
        console.log("Preview image not available:", value.url);

        // デフォルト画像を表示するか、プレビューなしで表示
        $("#popup-image").attr({
          src: "assets/icon/Icon128.png", // デフォルト画像
          width: "256",
          height: "256",
        });

        $("#preview-element").text(
          `${value.data[0]}:${value.data[1]}:${value.data[2]} (画像なし)`
        );
        $("#preview-prompt").val(value.prompt);
        $("#popup").css({ display: "flex" }).show();
      });
  },

  /**
   * PNG情報を表示
   * @param {Object} data - PNG情報データ
   */
  createPngInfo(data) {
    const $div = $("<div>").addClass("item");

    Object.entries(data).forEach(([key, value]) => {
      const $label = $("<label>").text(`${key}: `).css({
        display: "inline-block",
        width: "200px",
        margin: "5px 10px 5px 0",
      });

      const $input = $("<input>")
        .attr({
          type: "text",
          value: value,
          readonly: true,
        })
        .css({
          display: "inline-block",
          width: "200px",
        });

      $div.append($label, $input, "<br>");
    });

    $("#pngInfo").empty().append($div);
  },

  /**
   * PNGプレビューを作成
   * @param {string} url - 画像URL
   */
  createPngPreview(url) {
    const img = new Image();

    img.onload = function () {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const maxSize = 540;

      let width = img.width;
      let height = img.height;

      if (width > height && width > maxSize) {
        height *= maxSize / width;
        width = maxSize;
      } else if (height > width && height > maxSize) {
        width *= maxSize / height;
        height = maxSize;
      }

      canvas.width = maxSize;
      canvas.height = height;

      const x = (canvas.width - width) / 2;
      ctx.drawImage(img, x, 0, width, height);

      $("#preview").attr("src", canvas.toDataURL());
    };

    img.src = url;
  },

  /**
   * PNG情報を取得
   * @param {ArrayBuffer} arrayBuffer - PNGデータ
   * @returns {Object} PNG情報
   */
  getPngInfo(arrayBuffer) {
    const dataView = new DataView(arrayBuffer);
    const info = {
      width: dataView.getUint32(16, false),
      height: dataView.getUint32(20, false),
      bitDepth: dataView.getUint8(24),
      colorType: dataView.getUint8(25),
      compressionMethod: dataView.getUint8(26),
      filterMethod: dataView.getUint8(27),
      interlaceMethod: dataView.getUint8(28),
      textChunks: this.getTextChunk(arrayBuffer),
    };
    return info;
  },

  /**
   * テキストチャンクを取得
   * @param {ArrayBuffer} arrayBuffer - PNGデータ
   * @returns {Object} テキストチャンク
   */
  getTextChunk(arrayBuffer) {
    let data = {};
    let chunkOffset = 33;

    while (chunkOffset < arrayBuffer.byteLength) {
      const chunkLength = new DataView(arrayBuffer, chunkOffset, 4).getUint32(
        0,
        false
      );
      const chunkType = new TextDecoder().decode(
        new Uint8Array(arrayBuffer, chunkOffset + 4, 4)
      );

      if (chunkType === "tEXt") {
        const keywordEnd = new Uint8Array(arrayBuffer, chunkOffset + 8).indexOf(
          0
        );
        const keyword = new TextDecoder().decode(
          new Uint8Array(arrayBuffer, chunkOffset + 8, keywordEnd)
        );
        const textData = new TextDecoder().decode(
          new Uint8Array(
            arrayBuffer,
            chunkOffset + 8 + keywordEnd + 1,
            chunkLength - (keywordEnd + 1)
          )
        );

        if (keyword === "Comment") {
          data = JSON.parse(textData);
          data.metadata = textData;
        } else if (keyword === "parameters") {
          data = this.parseSDPng(`prompt: ${textData}`);
          data.metadata = `prompt: ${textData}`;
        }
      }

      chunkOffset += chunkLength + 12;
    }

    return data;
  },

  /**
   * StableDiffusion PNG情報を解析
   * @param {string} text - 解析するテキスト
   * @returns {Object} 解析結果
   */
  parseSDPng(text) {
    const data = {};

    // Extract steps and other parameters
    let matches = text.match(/(.*)(steps:.*)/i);
    if (matches) {
      const paramsMatch = [
        ...matches[0].matchAll(/([A-Za-z\s]+):\s*([^,\n]*)/g),
      ];
      for (const match of paramsMatch) {
        const key = match[1].trim();
        const value = match[2].trim();

        if (key !== "prompt" && key !== "Negative prompt") {
          data[key] = value;
        }
      }
    }

    // Extract prompt and negative prompt
    const allMatches = [
      ...text.matchAll(/([A-Za-z\s]+):\s*((?:[^,\n]+,)*[^,\n]+)/g),
    ];
    for (const match of allMatches) {
      const key = match[1].trim();
      const value = match[2].trim();

      if (key === "prompt" || key === "Negative prompt") {
        data[key] = value;
      }
    }

    return data;
  },
};

// グローバルに公開（互換性のため関数も個別に公開）
if (typeof window !== "undefined") {
  window.UIUtilities = UIUtilities;

  // 後方互換性のため、個別の関数としても公開
  window.previewPromptImage = UIUtilities.previewPromptImage.bind(UIUtilities);
  window.createPngInfo = UIUtilities.createPngInfo.bind(UIUtilities);
  window.createPngPreview = UIUtilities.createPngPreview.bind(UIUtilities);
  window.getPngInfo = UIUtilities.getPngInfo.bind(UIUtilities);
  window.getTextChunk = UIUtilities.getTextChunk.bind(UIUtilities);
  window.parseSDPng = UIUtilities.parseSDPng.bind(UIUtilities);
}
