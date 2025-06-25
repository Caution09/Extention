/**
 * content.js - コンテンツスクリプト
 * セレクター検証とビジュアルセレクター機能を統合
 */

(function () {
  "use strict";

  // ============================================
  // ビジュアルセレクター機能
  // ============================================

  // VisualSelectorオブジェクトの定義（グローバルスコープに配置）
  const VisualSelector = {
    isActive: false,
    currentElement: null,
    highlightOverlay: null,
    tooltip: null,
    candidatePanel: null,
    excludeSelectors: [
      'input[type="password"]',
      'input[type="email"]',
      'input[type="tel"]',
      "[data-sensitive]",
      "[data-private]",
    ],
    panelPosition: "top-right",
    autoMoveEnabled: true,
    moveTimeout: null,
  };

  const styles = {
    overlay: "prompt-generator-visual-selector-overlay",
    excludedOverlay:
      "prompt-generator-visual-selector-overlay prompt-generator-visual-selector-overlay-excluded",
    tooltip: "prompt-generator-visual-selector-tooltip",
    candidatePanel: "", // IDで管理されているのでクラス不要
  };

  // ビジュアルセレクターを初期化
  function initializeVisualSelector() {
    // 既存のビジュアルセレクター要素を全て削除
    document
      .querySelectorAll("#prompt-generator-visual-selector-panel")
      .forEach((el) => el.remove());
    document
      .querySelectorAll(".prompt-generator-visual-selector-overlay")
      .forEach((el) => el.remove());
    document
      .querySelectorAll(".prompt-generator-visual-selector-tooltip")
      .forEach((el) => el.remove());

    // 既存のUI要素があれば削除
    cleanup();

    VisualSelector.isActive = true;
    createUIElements();
    attachEventListeners();
    showInstructions();
  }

  // UI要素を作成
  function createUIElements() {
    // 既存の要素があれば削除
    if (VisualSelector.highlightOverlay) {
      VisualSelector.highlightOverlay.remove();
    }
    if (VisualSelector.tooltip) {
      VisualSelector.tooltip.remove();
    }
    if (VisualSelector.candidatePanel) {
      VisualSelector.candidatePanel.remove();
    }

    // ハイライトオーバーレイ
    VisualSelector.highlightOverlay = document.createElement("div");
    VisualSelector.highlightOverlay.className = VisualSelector.styles.overlay;
    VisualSelector.highlightOverlay.style.display = "none";
    document.body.appendChild(VisualSelector.highlightOverlay);

    // ツールチップ
    VisualSelector.tooltip = document.createElement("div");
    VisualSelector.tooltip.className = VisualSelector.styles.tooltip;
    VisualSelector.tooltip.style.display = "none";
    document.body.appendChild(VisualSelector.tooltip);

    // 候補パネル
    VisualSelector.candidatePanel = document.createElement("div");
    VisualSelector.candidatePanel.id = "prompt-generator-visual-selector-panel"; // 一意のIDを追加
    VisualSelector.candidatePanel.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 8px;">
        <span>🎯 ビジュアルセレクター</span>
      </div>
      <div style="margin-bottom: 10px; color: #666; font-size: 13px;">
        要素をクリックして選択 (ESCで終了)
      </div>
      <div style="margin-bottom: 5px; color: #999; font-size: 11px;">
        💡 パネルにマウスを乗せると自動で移動します
      </div>
      <div id="selector-candidates" style="margin-top: 15px;"></div>
    `;
    document.body.appendChild(VisualSelector.candidatePanel);

    // マウスオーバーイベントを追加
    VisualSelector.candidatePanel.addEventListener(
      "mouseenter",
      handlePanelMouseEnter
    );
    VisualSelector.candidatePanel.addEventListener(
      "mouseleave",
      handlePanelMouseLeave
    );
  }

  // パネルにマウスが入った時の処理
  function handlePanelMouseEnter() {
    if (!VisualSelector.autoMoveEnabled) return;

    // 既存のタイムアウトをクリア
    if (VisualSelector.moveTimeout) {
      clearTimeout(VisualSelector.moveTimeout);
    }

    // 少し遅延を入れて移動（誤操作防止）
    VisualSelector.moveTimeout = setTimeout(() => {
      autoMovePanel();
    }, 300);
  }

  // パネルからマウスが出た時の処理
  function handlePanelMouseLeave() {
    // タイムアウトをクリア
    if (VisualSelector.moveTimeout) {
      clearTimeout(VisualSelector.moveTimeout);
      VisualSelector.moveTimeout = null;
    }
  }

  // パネルを自動的に移動
  function autoMovePanel() {
    const panel = VisualSelector.candidatePanel;

    // スムーズなアニメーション
    panel.style.transition = "all 0.3s ease";

    switch (VisualSelector.panelPosition) {
      case "top-right":
        // 左下に移動
        panel.style.right = "auto";
        panel.style.top = "auto";
        panel.style.left = "20px";
        panel.style.bottom = "20px";
        VisualSelector.panelPosition = "bottom-left";
        break;

      case "bottom-left":
        // 右上に戻る
        panel.style.left = "auto";
        panel.style.bottom = "auto";
        panel.style.right = "20px";
        panel.style.top = "20px";
        VisualSelector.panelPosition = "top-right";
        break;
    }
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

  // マウス移動ハンドラー
  function handleMouseMove(e) {
    if (!VisualSelector.isActive) return;

    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (!element || isUIElement(element)) {
      if (VisualSelector.currentElement) {
        VisualSelector.highlightOverlay.style.display = "none";
        VisualSelector.tooltip.style.display = "none";
        VisualSelector.currentElement = null;
      }
      return;
    }

    if (element !== VisualSelector.currentElement) {
      VisualSelector.currentElement = element;
      const isExcluded = isExcludedElement(element);
      updateHighlight(element, isExcluded);
      updateTooltip(element, e.clientX, e.clientY, isExcluded);
      if (!isExcluded) {
        updateCandidates(element);
      }
    } else {
      // ツールチップの位置だけ更新
      updateTooltipPosition(e.clientX, e.clientY);
    }
  }

  // ツールチップの位置を更新
  function updateTooltipPosition(x, y) {
    if (
      !VisualSelector.tooltip ||
      VisualSelector.tooltip.style.display === "none"
    )
      return;

    const tooltip = VisualSelector.tooltip;
    const tooltipRect = tooltip.getBoundingClientRect();
    const margin = 15;

    // デフォルトは右下
    let left = x + margin;
    let top = y + margin;

    // 画面端での調整
    if (left + tooltipRect.width > window.innerWidth - margin) {
      left = x - tooltipRect.width - margin;
    }

    if (top + tooltipRect.height > window.innerHeight - margin) {
      top = y - tooltipRect.height - margin;
    }

    // 最小マージンを確保
    left = Math.max(
      margin,
      Math.min(left, window.innerWidth - tooltipRect.width - margin)
    );
    top = Math.max(
      margin,
      Math.min(top, window.innerHeight - tooltipRect.height - margin)
    );

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
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
      VisualSelector.candidatePanel?.contains(element) || // パネル内のすべての要素を含む
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
    const classInfo =
      element.className && typeof element.className === "string"
        ? `.${element.className.split(" ").join(".")}`
        : "";
    const idInfo = element.id ? `#${element.id}` : "";

    let content = `${tagInfo}${idInfo}${classInfo}`;

    if (isExcluded) {
      content = "⚠️ 保護された要素";
    }

    VisualSelector.tooltip.textContent = content;
    VisualSelector.tooltip.style.display = "block";

    // 初期位置を設定
    updateTooltipPosition(x, y);
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

  // セレクターを生成（改善版）
  function generateSelectors(element) {
    const selectors = [];

    // 1. ID がある場合（最優先）
    if (element.id && !element.id.match(/^[0-9]/)) {
      const idSelector = `#${CSS.escape(element.id)}`;
      selectors.push({
        selector: idSelector,
        type: "ID",
        score: 100,
        count: document.querySelectorAll(idSelector).length,
      });
    }

    // 2. CSS Path（ルートから要素までの完全なパス）
    const cssPath = getCSSPath(element);
    if (cssPath) {
      selectors.push({
        selector: cssPath,
        type: "CSS Path",
        score: 95,
        count: 1, // CSS Pathは常に一意
      });
    }

    // 3. 親要素のIDまたはクラスを含むセレクター
    const contextualSelector = getContextualSelector(element);
    if (contextualSelector) {
      const count = document.querySelectorAll(contextualSelector).length;
      selectors.push({
        selector: contextualSelector,
        type: "Contextual",
        score: 90 - (count - 1) * 5,
        count: count,
      });
    }

    // 4. データ属性を使用したセレクター
    const dataSelector = getDataAttributeSelector(element);
    if (dataSelector) {
      const count = document.querySelectorAll(dataSelector).length;
      selectors.push({
        selector: dataSelector,
        type: "Data Attribute",
        score: 85 - (count - 1) * 5,
        count: count,
      });
    }

    // 5. クラスの組み合わせ（複数クラスを使用）
    if (element.className && typeof element.className === "string") {
      const classes = element.className.trim().split(/\s+/);
      if (classes.length > 0) {
        // 全クラスを使用
        const fullClassSelector = classes
          .map((c) => `.${CSS.escape(c)}`)
          .join("");
        const fullCount = document.querySelectorAll(fullClassSelector).length;

        if (fullCount === 1) {
          selectors.push({
            selector: fullClassSelector,
            type: "Full Classes",
            score: 80,
            count: fullCount,
          });
        } else if (fullCount < 5) {
          // 親要素と組み合わせて一意性を高める
          const parentTag = element.parentElement
            ? element.parentElement.tagName.toLowerCase()
            : null;
          if (parentTag) {
            const parentClassSelector = `${parentTag} > ${fullClassSelector}`;
            const parentCount =
              document.querySelectorAll(parentClassSelector).length;
            selectors.push({
              selector: parentClassSelector,
              type: "Parent + Classes",
              score: 75 - (parentCount - 1) * 5,
              count: parentCount,
            });
          }
        }

        // 主要なクラスのみを使用（短いセレクター）
        const primaryClass = getPrimaryClass(classes);
        if (primaryClass) {
          const primarySelector = `.${CSS.escape(primaryClass)}`;
          const primaryCount =
            document.querySelectorAll(primarySelector).length;
          if (primaryCount < 10) {
            selectors.push({
              selector: primarySelector,
              type: "Primary Class",
              score: 60 - (primaryCount - 1) * 2,
              count: primaryCount,
            });
          }
        }
      }
    }

    // 6. タグ名 + nth-child/nth-of-type
    const nthSelector = getNthSelector(element);
    if (nthSelector) {
      selectors.push({
        selector: nthSelector,
        type: "Nth Selector",
        score: 70,
        count: 1,
      });
    }

    // スコアでソート（高い順）
    return selectors.sort((a, b) => b.score - a.score);
  }

  // CSS Path を生成
  function getCSSPath(element) {
    const path = [];
    let current = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      // IDがある場合は使用
      if (
        current.id &&
        !current.id.match(/^[0-9]/) &&
        !current.id.includes(":")
      ) {
        selector = `#${CSS.escape(current.id)}`;
        path.unshift(selector);
        break; // IDは一意なのでここで終了
      }

      // クラスがある場合は追加
      if (current.className && typeof current.className === "string") {
        const classes = current.className.trim().split(/\s+/);
        const validClasses = classes.filter(
          (c) => c && !c.match(/^[0-9]/) && !c.includes(":")
        );
        if (validClasses.length > 0) {
          // 最も特徴的なクラスを選択
          const primaryClass = getPrimaryClass(validClasses);
          if (primaryClass) {
            selector += `.${CSS.escape(primaryClass)}`;
          }
        }
      }

      // 兄弟要素の中での位置を特定
      const siblings = current.parentElement
        ? Array.from(current.parentElement.children)
        : [];
      const sameTagSiblings = siblings.filter(
        (s) => s.tagName === current.tagName
      );

      if (sameTagSiblings.length > 1) {
        const index = sameTagSiblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(" > ");
  }

  // コンテキストを考慮したセレクターを生成
  function getContextualSelector(element) {
    let contextSelector = "";
    let current = element;
    let depth = 0;

    // 親要素を遡って、IDまたは特徴的なクラスを持つ要素を探す
    while (current && depth < 5) {
      if (
        current.id &&
        !current.id.match(/^[0-9]/) &&
        !current.id.includes(":")
      ) {
        contextSelector = `#${CSS.escape(current.id)} ${contextSelector}`;
        break;
      }

      if (current.className && typeof current.className === "string") {
        const classes = current.className.trim().split(/\s+/);
        const meaningfulClass = classes.find(
          (c) => c && !c.match(/^(sc-|css-|js-|_)/) && c.length > 3
        );

        if (meaningfulClass) {
          contextSelector = `.${CSS.escape(
            meaningfulClass
          )} ${contextSelector}`;
          break;
        }
      }

      current = current.parentElement;
      depth++;
    }

    // 元の要素のセレクターを追加
    if (contextSelector) {
      let elementSelector = element.tagName.toLowerCase();
      if (element.className && typeof element.className === "string") {
        const classes = element.className.trim().split(/\s+/);
        if (classes.length > 0) {
          elementSelector = classes.map((c) => `.${CSS.escape(c)}`).join("");
        }
      }
      return (contextSelector + elementSelector).trim();
    }

    return null;
  }

  // データ属性を使用したセレクターを生成
  function getDataAttributeSelector(element) {
    const dataAttrs = Array.from(element.attributes)
      .filter(
        (attr) => attr.name.startsWith("data-") || attr.name.startsWith("aria-")
      )
      .filter((attr) => attr.value && attr.value.length < 50);

    if (dataAttrs.length > 0) {
      const primaryAttr = dataAttrs.find(
        (attr) => !attr.value.match(/^[0-9]+$/) && !attr.value.includes("{")
      );

      if (primaryAttr) {
        return `[${primaryAttr.name}="${CSS.escape(primaryAttr.value)}"]`;
      }
    }

    return null;
  }

  // nth-child/nth-of-type セレクターを生成
  function getNthSelector(element) {
    if (!element.parentElement) return null;

    const siblings = Array.from(element.parentElement.children);
    const index = siblings.indexOf(element) + 1;
    const tagName = element.tagName.toLowerCase();

    // 親要素の識別子を取得
    let parentSelector = "";
    if (element.parentElement.id && !element.parentElement.id.match(/^[0-9]/)) {
      parentSelector = `#${CSS.escape(element.parentElement.id)} > `;
    } else if (
      element.parentElement.className &&
      typeof element.parentElement.className === "string"
    ) {
      const parentClasses = element.parentElement.className.trim().split(/\s+/);
      const primaryParentClass = getPrimaryClass(parentClasses);
      if (primaryParentClass) {
        parentSelector = `.${CSS.escape(primaryParentClass)} > `;
      }
    }

    // nth-childとnth-of-typeの両方を試す
    const nthChildSelector = `${parentSelector}${tagName}:nth-child(${index})`;
    const sameTagSiblings = siblings.filter(
      (s) => s.tagName === element.tagName
    );

    if (sameTagSiblings.length > 1) {
      const typeIndex = sameTagSiblings.indexOf(element) + 1;
      return `${parentSelector}${tagName}:nth-of-type(${typeIndex})`;
    }

    return nthChildSelector;
  }

  // 最も特徴的なクラスを選択
  function getPrimaryClass(classes) {
    // 優先順位：
    // 1. 意味のある名前（button、prompt、generate など）
    // 2. 長いクラス名
    // 3. ハイフンを含むクラス名

    const meaningful = classes.find((c) =>
      /^(btn|button|prompt|input|generate|submit|text|field|box|panel|settings)/.test(
        c.toLowerCase()
      )
    );
    if (meaningful) return meaningful;

    // sc- で始まるクラスでも、他に選択肢がない場合は使用
    const sorted = classes.sort((a, b) => {
      // sc- で始まるクラスは優先度を下げる
      const aIsStyled = a.startsWith("sc-");
      const bIsStyled = b.startsWith("sc-");
      if (aIsStyled && !bIsStyled) return 1;
      if (!aIsStyled && bIsStyled) return -1;

      // 長さで比較
      return b.length - a.length;
    });

    return sorted[0] || null;
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

    // タイムアウトをクリア
    if (VisualSelector.moveTimeout) {
      clearTimeout(VisualSelector.moveTimeout);
      VisualSelector.moveTimeout = null;
    }

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

    // 位置をリセット
    VisualSelector.panelPosition = "top-right";
  }

  // 操作説明を表示
  function showInstructions() {
    const overlay = document.createElement("div");
    overlay.className = "visual-selector-instructions";

    overlay.innerHTML = `
      <h3 style="margin: 0 0 15px 0;">ビジュアルセレクター</h3>
      <p>要素にカーソルを合わせてクリックで選択</p>
      <p style="margin: 10px 0;">右上のパネルで候補を確認できます</p>
      <p style="margin: 10px 0; font-size: 14px; color: #aaa;">パネルが邪魔な場合はマウスを乗せると自動で移動します</p>
      <p><kbd>ESC</kbd> キーで終了</p>
    `;

    // CSSアニメーションを追加
    const style = document.createElement("style");
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(overlay);

    // 3秒後に自動的に消える
    setTimeout(() => {
      overlay.style.opacity = "0";
      overlay.style.transition = "opacity 0.3s ease";
      setTimeout(() => {
        overlay.remove();
        style.remove();
      }, 300);
    }, 3000);
  }

  // 警告表示
  function showWarning(message) {
    const warning = document.createElement("div");
    warning.className = "visual-selector-warning";
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

  // コピー完了トースト
  function showCopyToast(message) {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.className = "copy-toast";

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

  // 通知トースト
  function showNotificationToast(message, type = "info") {
    const colors = {
      success: "#4CAF50",
      error: "#dc3545",
      warning: "#ffc107",
      info: "#17a2b8",
    };

    const toast = document.createElement("div");
    toast.textContent = message;
    toast.className = `notification-toast ${type}`;

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
    // クリップボード操作
    if (message.type === "copyToClipboard") {
      navigator.clipboard
        .writeText(message.text)
        .then(() => {
          console.log("Copied to clipboard:", message.text);
          showCopyToast("プロンプトをコピーしました");
          sendResponse({ success: true });
        })
        .catch((error) => {
          console.error("Failed to copy:", error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }

    // 通知表示
    else if (message.type === "showNotification") {
      showNotificationToast(message.message, message.messageType);
      sendResponse({ success: true });
    }

    // セレクター検証
    else if (message.action === "checkSelector") {
      try {
        const element = document.querySelector(message.selector);
        const exists = element !== null;

        sendResponse({
          exists: exists,
          selector: message.selector,
          elementType: exists ? element.tagName : null,
        });
      } catch (error) {
        sendResponse({
          exists: false,
          selector: message.selector,
          error: error.message,
        });
      }
    }

    // ビジュアルセレクター機能
    else if (message.action === "startVisualSelection") {
      // 既に起動している場合は一度クリーンアップ
      if (VisualSelector.isActive) {
        cleanup();
      }
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
