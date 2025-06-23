class AutoGenerateHandler {
  constructor() {
    this.isRunning = false;
    this.currentCount = 0;
    this.targetCount = 10;
    this.checkInterval = null;
    this.generateInterval = 5000; // 生成間隔（ミリ秒）
    this.lastGenerateTime = null;
    this.waitingForComplete = false;
    this.isInfiniteMode = false;
  }

  /**
   * 初期化
   */
  init() {
    // NovelAIモードでGenerateボタンが表示されている場合のみ初期化
    const generateButton = document.getElementById("GeneratoButton");
    if (
      AppState.userSettings.optionData?.shaping !== "NAI" ||
      !generateButton
    ) {
      console.log(
        "Auto Generate: Not in NovelAI mode or Generate button not found"
      );
      return;
    }

    this.setupOptionUI();
    this.setupProgressUI();
    this.loadSettings();
    this.attachEventListeners();
  }

  /**
   * オプションパネルにUIを設定
   */
  setupOptionUI() {
    // 既に追加済みの場合はスキップ
    if (document.getElementById("autoGenerateOption")) {
      return;
    }

    // オプションパネルを探す
    const optionPanel = document.getElementById("optionPanel");
    if (!optionPanel) {
      console.error("Option panel not found");
      return;
    }

    // 自動Generate設定のセクションを作成
    const section = document.createElement("div");
    section.id = "autoGenerateOption";
    section.innerHTML = `
      <h3>自動Generate設定（NovelAI専用）</h3>
      <label>
        <input type="checkbox" id="autoGenerate"> 自動Generateを有効にする
      </label><br>
      <label>
        生成回数:
        <input type="number" id="generateCount" value="10" min="0" max="1000" style="width: 60px;">
        <span style="font-size: 12px; color: #666;">（0で無限）</span>
      </label><br>
      <label>
        生成間隔:
        <input type="number" id="generateInterval" value="5" min="3" max="60" style="width: 50px;">
        <span>秒</span>
      </label><br>
      <br>
    `;

    // リセットボタンの前に挿入
    const resetButton = document.getElementById("resetButton");
    if (resetButton && resetButton.parentNode) {
      resetButton.parentNode.insertBefore(section, resetButton);
    } else {
      optionPanel.appendChild(section);
    }
  }

  /**
   * 進行状況UIを設定（タイトル横）
   */
  setupProgressUI() {
    // 既に追加済みの場合はスキップ
    if (document.getElementById("autoGenerateProgress")) {
      return;
    }

    // タイトル要素を探す
    const h1 = document.querySelector("h1");
    if (!h1) {
      console.error("Title element not found");
      return;
    }

    // 進行状況を表示する要素を作成
    const progress = document.createElement("span");
    progress.id = "autoGenerateProgress";
    progress.style.cssText = `
      display: none;
      margin-left: 20px;
      font-size: 14px;
      color: #666;
      font-weight: normal;
    `;

    h1.appendChild(progress);
  }

  /**
   * イベントリスナーを設定
   */
  attachEventListeners() {
    // 自動Generate チェックボックス
    const autoGenerateCheckbox = document.getElementById("autoGenerate");
    if (autoGenerateCheckbox) {
      autoGenerateCheckbox.addEventListener("change", (e) => {
        if (e.target.checked) {
          this.start();
        } else {
          this.stop();
        }
      });
    }

    // 回数入力
    const generateCountInput = document.getElementById("generateCount");
    if (generateCountInput) {
      generateCountInput.addEventListener("change", (e) => {
        const value = parseInt(e.target.value) || 0;
        this.targetCount = value;
        this.isInfiniteMode = value === 0;
        this.saveSettings();

        // 実行中なら表示を更新
        if (this.isRunning) {
          this.updateProgress();
        }
      });
    }

    // 生成間隔
    const intervalInput = document.getElementById("generateInterval");
    if (intervalInput) {
      intervalInput.addEventListener("change", (e) => {
        const value = parseInt(e.target.value) || 5;
        this.generateInterval = Math.max(3, value) * 1000; // 最低3秒
        this.saveSettings();
      });
    }
  }

  /**
   * 自動生成を開始
   */
  async start() {
    if (this.isRunning) return;

    // NovelAIモードとGenerateボタンの確認
    const generateButton = document.getElementById("GeneratoButton");
    if (
      AppState.userSettings.optionData?.shaping !== "NAI" ||
      !generateButton
    ) {
      ErrorHandler.notify("NovelAIモードでのみ使用できます", {
        type: ErrorHandler.NotificationType.TOAST,
        messageType: "warning",
      });
      document.getElementById("autoGenerate").checked = false;
      return;
    }

    console.log("Auto Generate: Starting...");
    this.isRunning = true;
    this.currentCount = 0;
    this.waitingForComplete = false;

    // 設定値を取得
    const countValue =
      parseInt(document.getElementById("generateCount").value) || 0;
    this.targetCount = countValue;
    this.isInfiniteMode = countValue === 0;

    // UI更新
    document.getElementById("autoGenerate").checked = true;
    this.showProgress();
    this.updateProgress();

    // 最初の生成を実行
    await this.generate();

    // 定期的なチェックを開始
    this.checkInterval = setInterval(() => {
      this.checkGenerateStatus();
    }, 1000);
  }

  /**
   * 自動生成を停止
   */
  stop() {
    if (!this.isRunning) return;

    console.log("Auto Generate: Stopping...");
    this.isRunning = false;
    this.waitingForComplete = false;

    // インターバルをクリア
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // UI更新
    document.getElementById("autoGenerate").checked = false;
    this.hideProgress();

    // 完了通知
    const message = this.isInfiniteMode
      ? `自動生成を停止しました（${this.currentCount}回生成）`
      : `自動生成を停止しました（${this.currentCount}/${this.targetCount}回完了）`;

    ErrorHandler.notify(message, {
      type: ErrorHandler.NotificationType.TOAST,
      messageType: "info",
      duration: 3000,
    });
  }

  /**
   * 生成を実行
   */
  async generate() {
    const generateButton = document.getElementById("GeneratoButton");
    if (!generateButton || generateButton.disabled) {
      console.log("Auto Generate: Generate button not available");
      this.stop();
      return false;
    }

    const displayCount = this.isInfiniteMode
      ? `${this.currentCount + 1}回目`
      : `${this.currentCount + 1}/${this.targetCount}`;

    console.log(`Auto Generate: Generating ${displayCount}`);
    this.updateProgress(`生成中... ${displayCount}`);

    // 実際の生成処理を実行
    this.lastGenerateTime = Date.now();
    this.waitingForComplete = true;

    // 既存のGenerateボタンをクリック
    generateButton.click();

    return true;
  }

  /**
   * 生成状態をチェック
   */
  checkGenerateStatus() {
    if (!this.isRunning || !this.waitingForComplete) return;

    const elapsed = Date.now() - this.lastGenerateTime;

    // 生成に時間がかかりすぎている場合（30秒以上）
    if (elapsed > 30000) {
      console.log("Auto Generate: Timeout detected");
      this.updateProgress("タイムアウト - 次の生成を開始します");
      this.onGenerateComplete();
      return;
    }

    // 生成完了の簡易判定（5秒以上経過）
    if (elapsed > 5000) {
      this.onGenerateComplete();
    }
  }

  /**
   * 生成完了時の処理
   */
  onGenerateComplete() {
    if (!this.waitingForComplete) return;

    this.waitingForComplete = false;
    this.currentCount++;

    console.log(`Auto Generate: Completed ${this.currentCount} generations`);

    // 無限モードでない場合、目標回数に達したかチェック
    if (!this.isInfiniteMode && this.currentCount >= this.targetCount) {
      this.complete();
      return;
    }

    // 次の生成までの待機
    const nextCount = this.isInfiniteMode
      ? `${this.currentCount + 1}回目`
      : `${this.currentCount + 1}/${this.targetCount}`;

    this.updateProgress(`待機中... (次: ${nextCount})`);

    setTimeout(() => {
      if (this.isRunning) {
        this.generate();
      }
    }, this.generateInterval);
  }

  /**
   * 進行状況を更新
   */
  updateProgress(status = null) {
    const progressElement = document.getElementById("autoGenerateProgress");
    if (!progressElement) return;

    let text = "";
    if (this.isInfiniteMode) {
      text = `自動生成中: ${this.currentCount}回`;
    } else {
      text = `自動生成中: ${this.currentCount}/${this.targetCount}`;
    }

    if (status) {
      text = status;
    }

    progressElement.textContent = text;
  }

  /**
   * 進行状況を表示
   */
  showProgress() {
    const progressElement = document.getElementById("autoGenerateProgress");
    if (progressElement) {
      progressElement.style.display = "inline";
    }
  }

  /**
   * 進行状況を非表示
   */
  hideProgress() {
    const progressElement = document.getElementById("autoGenerateProgress");
    if (progressElement) {
      progressElement.style.display = "none";
    }
  }

  /**
   * 自動生成完了
   */
  complete() {
    console.log("Auto Generate: All generations completed!");

    // 停止処理
    this.isRunning = false;
    this.waitingForComplete = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // UI更新
    document.getElementById("autoGenerate").checked = false;
    this.updateProgress("完了しました！");

    // 2秒後に進行状況を非表示
    setTimeout(() => {
      this.hideProgress();
    }, 2000);

    // 完了通知
    ErrorHandler.notify(`自動生成が完了しました（${this.currentCount}回）`, {
      type: ErrorHandler.NotificationType.TOAST,
      messageType: "success",
      duration: 5000,
    });

    // 完了音を鳴らす
    this.playCompletionSound();
  }

  /**
   * 完了音を再生
   */
  playCompletionSound() {
    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log("Could not play completion sound:", error);
    }
  }

  /**
   * 設定を保存
   */
  saveSettings() {
    const settings = {
      generateCount: this.targetCount,
      generateInterval: this.generateInterval / 1000, // 秒単位で保存
      autoGenerate: document.getElementById("autoGenerate")?.checked || false,
    };

    Storage.set({ autoGenerateSettings: settings });
  }

  /**
   * 設定を読み込み
   */
  async loadSettings() {
    try {
      const result = await Storage.get("autoGenerateSettings");
      if (result.autoGenerateSettings) {
        const settings = result.autoGenerateSettings;

        // 回数
        const countInput = document.getElementById("generateCount");
        if (countInput) {
          countInput.value = settings.generateCount || 10;
          this.targetCount = settings.generateCount || 10;
          this.isInfiniteMode = this.targetCount === 0;
        }

        // 間隔
        const intervalInput = document.getElementById("generateInterval");
        if (intervalInput) {
          intervalInput.value = settings.generateInterval || 5;
          this.generateInterval = (settings.generateInterval || 5) * 1000;
        }

        // 自動開始（保存されていた場合）
        const autoCheckbox = document.getElementById("autoGenerate");
        if (autoCheckbox && settings.autoGenerate) {
          // 少し遅延してから開始
          setTimeout(() => {
            autoCheckbox.checked = true;
            this.start();
          }, 2000);
        }
      }
    } catch (error) {
      console.log("Failed to load auto generate settings:", error);
    }
  }

  /**
   * クリーンアップ
   */
  cleanup() {
    this.stop();
  }
}

// ============================================
// 統合とエクスポート
// ============================================

// グローバルに公開
window.AutoGenerateHandler = AutoGenerateHandler;
window.autoGenerateHandler = new AutoGenerateHandler();

// ページ遷移時のクリーンアップ
window.addEventListener("beforeunload", () => {
  if (window.autoGenerateHandler) {
    autoGenerateHandler.cleanup();
  }
});
