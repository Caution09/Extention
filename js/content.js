/**
 * content.js - コンテンツスクリプト
 * セレクター検証とビジュアルセレクター機能を統合
 */

(function () {
  "use strict";

  // ============================================
  // ビジュアルセレクター機能
  // ============================================

  const VisualSelector = {
    isActive: false,
    currentElement: null,
    highlightOverlay: null,
    tooltip: null,
    candidatePanel: null,
    selectedSelector: null,

    excludeSelectors: [
      'input[type="password"]',
      "[data-sensitive]",
      ".credit-card",
      ".payment-info",
      ".password-field",
    ],

    styles: {
      overlay: `
        position: fixed;
        background: rgba(0, 123, 255, 0.2);
        border: 2px solid #007bff;
        pointer-events: none;
        z-index: 99999;
        transition: all 0.2s ease;
        box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.1);
      `,
      tooltip: `
        position: fixed;
        background: #333;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        font-family: monospace;
        z-index: 100000;
        pointer-events: none;
        max-width: 300px;
        word-break: break-all;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      `,
      candidatePanel: `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 15px;
        z-index: 100001;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 350px;
        max-height: 400px;
        overflow-y: auto;
      `,
      excludedOverlay: `
        position: fixed;
        background: rgba(220, 53, 69, 0.2);
        border: 2px solid #dc3545;
        pointer-events: none;
        z-index: 99999;
      `,
    },
  };

  // ビジュアルセレクターを初期化
  function initializeVisualSelector() {
    if (VisualSelector.isActive) return;

    VisualSelector.isActive = true;
    createUIElements();
    attachEventListeners();
    showInstructions();
  }

  // UI要素を作成
  function createUIElements() {
    // ハイライトオーバーレイ
    VisualSelector.highlightOverlay = document.createElement("div");
    VisualSelector.highlightOverlay.style.cssText =
      VisualSelector.styles.overlay;
    VisualSelector.highlightOverlay.style.display = "none";
    document.body.appendChild(VisualSelector.highlightOverlay);

    // ツールチップ
    VisualSelector.tooltip = document.createElement("div");
    VisualSelector.tooltip.style.cssText = VisualSelector.styles.tooltip;
    VisualSelector.tooltip.style.display = "none";
    document.body.appendChild(VisualSelector.tooltip);

    // 候補パネル
    VisualSelector.candidatePanel = document.createElement("div");
    VisualSelector.candidatePanel.style.cssText =
      VisualSelector.styles.candidatePanel;
    VisualSelector.candidatePanel.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 8px;">
        🎯 ビジュアルセレクター
      </div>
      <div style="margin-bottom: 10px; color: #666; font-size: 13px;">
        要素をクリックして選択 (ESCで終了)
      </div>
      <div id="selector-candidates" style="margin-top: 15px;"></div>
    `;
    document.body.appendChild(VisualSelector.candidatePanel);
  }

  // イベントリスナーを設定
  function attachEventListeners() {
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("scroll", updateOverlayPosition, true);
    window.addEventListener("resize", updateOverlayPosition);
  }

  // イベントリスナーを削除
  function removeEventListeners() {
    document.removeEventListener("mousemove", handleMouseMove, true);
    document.removeEventListener("click", handleClick, true);
    document.removeEventListener("keydown", handleKeyDown, true);
    document.removeEventListener("scroll", updateOverlayPosition, true);
    window.removeEventListener("resize", updateOverlayPosition);
  }

  // マウス移動ハンドラー（スロットリング付き）
  let mouseMoveThrottle = null;
  function handleMouseMove(e) {
    if (!VisualSelector.isActive) return;

    if (mouseMoveThrottle) return;
    mouseMoveThrottle = setTimeout(() => {
      mouseMoveThrottle = null;
    }, 50);

    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (!element || element === VisualSelector.currentElement) return;

    // UI要素自体は除外
    if (isUIElement(element)) return;

    VisualSelector.currentElement = element;

    // 除外要素かチェック
    const isExcluded = isExcludedElement(element);

    updateHighlight(element, isExcluded);
    updateTooltip(element, e.clientX, e.clientY, isExcluded);

    if (!isExcluded) {
      updateCandidates(element);
    }
  }

  // クリックハンドラー
  function handleClick(e) {
    if (!VisualSelector.isActive) return;

    e.preventDefault();
    e.stopPropagation();

    const element = e.target;

    // UI要素のクリックは無視
    if (isUIElement(element)) return;

    // 除外要素のクリックは警告
    if (isExcludedElement(element)) {
      showWarning("この要素は選択できません（セキュリティ保護）");
      return;
    }

    // セレクター候補のクリック処理
    if (element.closest("#selector-candidates")) {
      const candidateEl = element.closest(".selector-candidate");
      if (candidateEl) {
        selectCandidate(candidateEl.dataset.selector);
      }
      return;
    }

    // 要素を選択
    const selectors = generateSelectors(VisualSelector.currentElement);
    if (selectors.length > 0) {
      selectCandidate(selectors[0].selector);
    }
  }

  // キーボードハンドラー
  function handleKeyDown(e) {
    if (!VisualSelector.isActive) return;

    if (e.key === "Escape") {
      e.preventDefault();
      cancelSelection();
    }
  }

  // UI要素かチェック
  function isUIElement(element) {
    return (
      element === VisualSelector.highlightOverlay ||
      element === VisualSelector.tooltip ||
      element === VisualSelector.candidatePanel ||
      element.closest("#selector-candidates")
    );
  }

  // 除外要素かチェック
  function isExcludedElement(element) {
    return VisualSelector.excludeSelectors.some((selector) => {
      try {
        return element.matches(selector);
      } catch (e) {
        return false;
      }
    });
  }

  // ハイライトを更新
  function updateHighlight(element, isExcluded = false) {
    const rect = element.getBoundingClientRect();

    VisualSelector.highlightOverlay.style.cssText = isExcluded
      ? VisualSelector.styles.excludedOverlay
      : VisualSelector.styles.overlay;

    VisualSelector.highlightOverlay.style.top = `${rect.top}px`;
    VisualSelector.highlightOverlay.style.left = `${rect.left}px`;
    VisualSelector.highlightOverlay.style.width = `${rect.width}px`;
    VisualSelector.highlightOverlay.style.height = `${rect.height}px`;
    VisualSelector.highlightOverlay.style.display = "block";
  }

  // ツールチップを更新
  function updateTooltip(element, x, y, isExcluded = false) {
    const tagInfo = `<${element.tagName.toLowerCase()}>`;
    const classInfo = element.className
      ? `.${element.className.split(" ").join(".")}`
      : "";
    const idInfo = element.id ? `#${element.id}` : "";

    let content = `${tagInfo}${idInfo}${classInfo}`;

    if (isExcluded) {
      content = "⚠️ 保護された要素";
    }

    VisualSelector.tooltip.textContent = content;
    VisualSelector.tooltip.style.display = "block";

    // 位置調整
    const tooltipRect = VisualSelector.tooltip.getBoundingClientRect();
    let left = x + 10;
    let top = y + 10;

    if (left + tooltipRect.width > window.innerWidth) {
      left = x - tooltipRect.width - 10;
    }

    if (top + tooltipRect.height > window.innerHeight) {
      top = y - tooltipRect.height - 10;
    }

    VisualSelector.tooltip.style.left = `${left}px`;
    VisualSelector.tooltip.style.top = `${top}px`;
  }

  // オーバーレイの位置を更新
  function updateOverlayPosition() {
    if (
      VisualSelector.currentElement &&
      VisualSelector.highlightOverlay.style.display !== "none"
    ) {
      updateHighlight(VisualSelector.currentElement);
    }
  }

  // セレクター候補を更新
  function updateCandidates(element) {
    const selectors = generateSelectors(element);
    const candidatesContainer = document.getElementById("selector-candidates");

    candidatesContainer.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold; color: #555;">
        セレクター候補:
      </div>
      ${selectors
        .map(
          (item, index) => `
        <div class="selector-candidate" data-selector="${escapeHtml(
          item.selector
        )}"
             style="margin-bottom: 8px; padding: 8px; border: 1px solid #ddd;
                    border-radius: 4px; cursor: pointer; transition: all 0.2s;
                    ${
                      index === 0
                        ? "background: #e3f2fd; border-color: #2196f3;"
                        : ""
                    }">
          <div style="font-family: monospace; font-size: 12px; word-break: break-all;">
            ${escapeHtml(item.selector)}
          </div>
          <div style="margin-top: 4px; font-size: 11px; color: #666;">
            ${item.type} | スコア: ${item.score} | 要素数: ${item.count}
          </div>
        </div>
      `
        )
        .join("")}
    `;

    // ホバー効果
    candidatesContainer
      .querySelectorAll(".selector-candidate")
      .forEach((el) => {
        el.addEventListener("mouseenter", function () {
          this.style.background = "#f5f5f5";
          this.style.borderColor = "#666";
        });

        el.addEventListener("mouseleave", function () {
          const isFirst =
            this === candidatesContainer.querySelector(".selector-candidate");
          this.style.background = isFirst ? "#e3f2fd" : "white";
          this.style.borderColor = isFirst ? "#2196f3" : "#ddd";
        });
      });
  }

  // セレクターを生成
  function generateSelectors(element) {
    const selectors = [];

    // 1. ID セレクター
    if (element.id && isValidId(element.id)) {
      const selector = `#${CSS.escape(element.id)}`;
      selectors.push({
        selector: selector,
        type: "ID",
        score: evaluateSelector(selector, element),
        count: document.querySelectorAll(selector).length,
      });
    }

    // 2. 固有のクラスセレクター
    if (element.className && typeof element.className === "string") {
      const classes = element.className.trim().split(/\s+/);
      const uniqueClasses = classes.filter((cls) => isValidClass(cls));

      if (uniqueClasses.length > 0) {
        // 単一クラス
        uniqueClasses.forEach((cls) => {
          const selector = `.${CSS.escape(cls)}`;
          const count = document.querySelectorAll(selector).length;
          if (count <= 5) {
            selectors.push({
              selector: selector,
              type: "クラス",
              score: evaluateSelector(selector, element),
              count: count,
            });
          }
        });

        // 複数クラスの組み合わせ
        if (uniqueClasses.length > 1) {
          const combinedSelector = uniqueClasses
            .map((cls) => `.${CSS.escape(cls)}`)
            .join("");
          const count = document.querySelectorAll(combinedSelector).length;
          if (count === 1) {
            selectors.push({
              selector: combinedSelector,
              type: "複合クラス",
              score: evaluateSelector(combinedSelector, element),
              count: count,
            });
          }
        }
      }
    }

    // 3. データ属性セレクター
    Array.from(element.attributes).forEach((attr) => {
      if (attr.name.startsWith("data-") && attr.value) {
        const selector = `[${attr.name}="${CSS.escape(attr.value)}"]`;
        const count = document.querySelectorAll(selector).length;
        if (count <= 3) {
          selectors.push({
            selector: selector,
            type: "データ属性",
            score: evaluateSelector(selector, element),
            count: count,
          });
        }
      }
    });

    // 4. タグ + 属性の組み合わせ
    const tagName = element.tagName.toLowerCase();
    ["placeholder", "name", "aria-label"].forEach((attrName) => {
      if (element.hasAttribute(attrName)) {
        const attrValue = element.getAttribute(attrName);
        if (attrValue) {
          const selector = `${tagName}[${attrName}="${CSS.escape(attrValue)}"]`;
          const count = document.querySelectorAll(selector).length;
          if (count <= 2) {
            selectors.push({
              selector: selector,
              type: "タグ+属性",
              score: evaluateSelector(selector, element),
              count: count,
            });
          }
        }
      }
    });

    // 5. 階層セレクター（最後の手段）
    if (selectors.length === 0) {
      const hierarchicalSelector = generateHierarchicalSelector(element);
      selectors.push({
        selector: hierarchicalSelector,
        type: "階層",
        score: evaluateSelector(hierarchicalSelector, element),
        count: document.querySelectorAll(hierarchicalSelector).length,
      });
    }

    // スコアでソート
    selectors.sort((a, b) => b.score - a.score);

    return selectors.slice(0, 5); // 上位5個まで
  }

  // 階層的セレクターを生成
  function generateHierarchicalSelector(element) {
    const path = [];
    let current = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      if (current.id && isValidId(current.id)) {
        selector = `#${CSS.escape(current.id)}`;
        path.unshift(selector);
        break;
      }

      if (current.className && typeof current.className === "string") {
        const classes = current.className
          .trim()
          .split(/\s+/)
          .filter(isValidClass);
        if (classes.length > 0) {
          selector += `.${classes.map((cls) => CSS.escape(cls)).join(".")}`;
        }
      }

      // 同じ要素の順番を取得
      const siblings = Array.from(current.parentNode?.children || []);
      const sameTagSiblings = siblings.filter(
        (el) => el.tagName === current.tagName
      );

      if (sameTagSiblings.length > 1) {
        const index = sameTagSiblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }

      path.unshift(selector);
      current = current.parentElement;

      if (path.length > 4) break; // 深すぎる階層は避ける
    }

    return path.join(" > ");
  }

  // セレクターを評価
  function evaluateSelector(selector, targetElement) {
    let score = 0;

    try {
      const matches = document.querySelectorAll(selector);

      // 一意性
      if (matches.length === 1 && matches[0] === targetElement) {
        score += 40;
      } else if (matches.length <= 3) {
        score += 20;
      }

      // シンプルさ
      if (selector.length < 30) score += 30;
      else if (selector.length < 50) score += 20;
      else if (selector.length < 80) score += 10;

      // 安定性
      if (selector.includes("#")) score += 20;
      if (selector.includes("[data-")) score += 15;
      if (!selector.includes(":nth-")) score += 10;

      // 可読性
      const depth = selector.split(">").length;
      if (depth === 1) score += 10;
      else if (depth <= 3) score += 5;
    } catch (e) {
      score = 0;
    }

    return score;
  }

  // 有効なIDかチェック
  function isValidId(id) {
    return (
      id &&
      !id.match(/^[0-9]/) && // 数字で始まらない
      !id.match(/[^\w-]/) && // 英数字とハイフンのみ
      id.length < 50
    ); // 長すぎない
  }

  // 有効なクラスかチェック
  function isValidClass(className) {
    return (
      className &&
      !className.match(/^[0-9]/) &&
      !className.match(/[^\w-]/) &&
      className.length < 50
    );
  }

  // HTMLエスケープ
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // 候補を選択
  function selectCandidate(selector) {
    VisualSelector.selectedSelector = selector;

    // 拡張機能にメッセージを送信
    chrome.runtime.sendMessage({
      action: "selectorSelected",
      selector: selector,
    });

    // UI要素をクリーンアップ
    cleanup();
  }

  // 選択をキャンセル
  function cancelSelection() {
    chrome.runtime.sendMessage({
      action: "visualSelectionCanceled",
    });

    cleanup();
  }

  // クリーンアップ
  function cleanup() {
    VisualSelector.isActive = false;

    removeEventListeners();

    if (VisualSelector.highlightOverlay) {
      VisualSelector.highlightOverlay.remove();
      VisualSelector.highlightOverlay = null;
    }

    if (VisualSelector.tooltip) {
      VisualSelector.tooltip.remove();
      VisualSelector.tooltip = null;
    }

    if (VisualSelector.candidatePanel) {
      VisualSelector.candidatePanel.remove();
      VisualSelector.candidatePanel = null;
    }

    VisualSelector.currentElement = null;
  }

  // 使用方法の表示
  function showInstructions() {
    const toast = document.createElement("div");
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #333;
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 100002;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: fadeIn 0.3s ease;
    `;
    toast.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 18px; margin-bottom: 8px;">🎯 ビジュアルセレクターモード</div>
        <div>要素にマウスを合わせてクリックで選択</div>
        <div style="margin-top: 5px; opacity: 0.8;">ESCキーで終了</div>
      </div>
    `;

    // アニメーション用のスタイル
    const style = document.createElement("style");
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translate(-50%, -20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
      @keyframes fadeOut {
        from { opacity: 1; transform: translate(-50%, 0); }
        to { opacity: 0; transform: translate(-50%, -20px); }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(toast);

    // 3秒後にフェードアウト
    setTimeout(() => {
      toast.style.animation = "fadeOut 0.3s ease forwards";
      setTimeout(() => {
        toast.remove();
        style.remove();
      }, 300);
    }, 3000);
  }

  // 警告表示
  function showWarning(message) {
    const warning = document.createElement("div");
    warning.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #dc3545;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 100002;
      box-shadow: 0 2px 8px rgba(220,53,69,0.3);
      animation: shake 0.5s ease;
    `;
    warning.textContent = message;

    const style = document.createElement("style");
    style.textContent = `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(warning);

    setTimeout(() => {
      warning.remove();
      style.remove();
    }, 3000);
  }

  // コピー完了トースト（content-script.jsから統合）
  function showCopyToast(message) {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;

    // アニメーション用のスタイル
    const style = document.createElement("style");
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(toast);

    // 3秒後に削除
    setTimeout(() => {
      toast.style.animation = "slideIn 0.3s ease-out reverse";
      setTimeout(() => {
        toast.remove();
        style.remove();
      }, 300);
    }, 3000);
  }

  // 通知トースト（background.jsから）
  function showNotificationToast(message, type = "info") {
    const colors = {
      success: "#4CAF50",
      error: "#dc3545",
      warning: "#ffc107",
      info: "#17a2b8",
    };

    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${colors[type] || colors.info};
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;

    // アニメーション用のスタイル（既に存在しない場合のみ追加）
    if (!document.querySelector("style[data-toast-animation]")) {
      const style = document.createElement("style");
      style.setAttribute("data-toast-animation", "true");
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // 3秒後に削除
    setTimeout(() => {
      toast.style.animation = "slideIn 0.3s ease-out reverse";
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  // ============================================
  // メッセージリスナー（既存機能との統合）
  // ============================================

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // クリップボード操作（content-script.jsから統合）
    if (message.type === "copyToClipboard") {
      // クリップボードにコピー
      navigator.clipboard
        .writeText(message.text)
        .then(() => {
          console.log("Copied to clipboard:", message.text);
          // トースト通知を表示
          showCopyToast("プロンプトをコピーしました");
          sendResponse({ success: true });
        })
        .catch((error) => {
          console.error("Failed to copy:", error);
          sendResponse({ success: false, error: error.message });
        });

      // 非同期レスポンスのため true を返す
      return true;
    }

    // 通知表示（background.jsから）
    else if (message.type === "showNotification") {
      showNotificationToast(message.message, message.messageType);
      sendResponse({ success: true });
    }
    // 既存のセレクター検証機能
    if (message.action === "checkSelector") {
      try {
        const element = document.querySelector(message.selector);
        const exists = element !== null;

        sendResponse({
          exists: exists,
          selector: message.selector,
          elementType: exists ? element.tagName : null,
        });
      } catch (error) {
        // セレクターが無効な場合
        sendResponse({
          exists: false,
          selector: message.selector,
          error: error.message,
        });
      }
    }

    // ビジュアルセレクター機能
    else if (message.action === "startVisualSelection") {
      initializeVisualSelector();
      sendResponse({ success: true });
    } else if (message.action === "endVisualSelection") {
      cleanup();
      sendResponse({ success: true });
    } else if (message.action === "validateSelector") {
      try {
        const elements = document.querySelectorAll(message.selector);
        sendResponse({
          valid: elements.length > 0,
          count: elements.length,
        });
      } catch (e) {
        sendResponse({
          valid: false,
          error: e.message,
        });
      }
    } else if (message.action === "testSelectors") {
      try {
        const positiveEl = document.querySelector(message.selectors.positive);
        const generateEl = document.querySelector(message.selectors.generate);

        if (positiveEl && generateEl) {
          // プロンプトを入力
          if (
            positiveEl.tagName === "TEXTAREA" ||
            positiveEl.tagName === "INPUT"
          ) {
            positiveEl.value = message.testPrompt;
            positiveEl.dispatchEvent(new Event("input", { bubbles: true }));
          } else if (positiveEl.contentEditable === "true") {
            positiveEl.textContent = message.testPrompt;
            positiveEl.dispatchEvent(new Event("input", { bubbles: true }));
          }

          // ボタンをハイライト（クリックはしない）
          generateEl.style.outline = "3px solid #28a745";
          generateEl.style.outlineOffset = "2px";

          setTimeout(() => {
            generateEl.style.outline = "";
            generateEl.style.outlineOffset = "";
          }, 2000);

          sendResponse({ success: true });
        } else {
          sendResponse({
            success: false,
            error: "Elements not found",
          });
        }
      } catch (e) {
        sendResponse({
          success: false,
          error: e.message,
        });
      }
    }

    return true; // 非同期レスポンスのため
  });

  // 初期化チェック
  if (!window.__contentScriptInitialized) {
    window.__contentScriptInitialized = true;
    console.log("Prompt Generator content script initialized");
  }
})();
