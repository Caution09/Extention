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
  async init() {
    // NovelAIモードの場合のみ表示
    const isNovelAI = AppState.userSettings.optionData?.shaping === "NAI";
    const generateButton = document.getElementById("GeneratoButton");

    // オプションの表示/非表示
    const optionDiv = document.getElementById("autoGenerateOption");
    if (optionDiv) {
      optionDiv.style.display = isNovelAI && generateButton ? "block" : "none";
    }

    if (!isNovelAI || !generateButton) {
      console.log(
        "Auto Generate: Not in NovelAI mode or Generate button not found"
      );
      return;
    }

    // 設定を読み込み
    await this.loadSettings();

    // 進行状況UIを設定（これは動的でOK）
    this.setupProgressUI();

    // イベントリスナーを設定
    this.attachEventListeners();
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
    // 回数入力
    const generateCountInput = document.getElementById("generateCount");
    if (generateCountInput) {
      generateCountInput.addEventListener("change", (e) => {
        const value = parseInt(e.target.value) || 0;
        console.log("=== COUNT CHANGED ===");
        console.log("New value:", value);
        console.log("Old targetCount:", this.targetCount);

        this.targetCount = value;
        this.isInfiniteMode = value === 0;

        console.log("New targetCount:", this.targetCount);
        console.log("Calling saveSettings...");
        this.saveSettings();

        // 実行中なら表示を更新
        if (this.isRunning) {
          this.updateProgress();
        }
      });
    } else {
      console.log("generateCount input not found in attachEventListeners!");
    }

    // 生成間隔
    const intervalInput = document.getElementById("generateInterval");
    if (intervalInput) {
      intervalInput.addEventListener("change", (e) => {
        const value = parseInt(e.target.value) || 5;
        console.log("=== INTERVAL CHANGED ===");
        console.log("New value:", value);
        console.log("Old generateInterval (ms):", this.generateInterval);

        this.generateInterval = Math.max(3, value) * 1000; // 最低3秒

        console.log("New generateInterval (ms):", this.generateInterval);
        console.log("Calling saveSettings...");
        this.saveSettings();
      });
    }

    // 自動生成チェックボックス
    const autoGenerateCheckbox = document.getElementById("autoGenerate");
    if (autoGenerateCheckbox) {
      autoGenerateCheckbox.addEventListener("change", async (e) => {
        console.log("Auto generate checkbox changed:", e.target.checked);
        if (e.target.checked) {
          await this.start();
        } else {
          this.stop();
        }
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
  async saveSettings() {
    try {
      const settings = {
        generateCount: this.targetCount,
        generateInterval: Math.floor(this.generateInterval / 1000),
      };

      // chrome.storage.localを使用
      await new Promise((resolve) => {
        chrome.storage.local.set({ autoGenerateSettings: settings }, resolve);
      });

      console.log("Auto generate settings saved:", settings);
    } catch (error) {
      console.error("Failed to save auto generate settings:", error);
    }
  }

  /**
   * 設定を読み込み
   */
  // auto-generate-handler.js の loadSettings() メソッドを修正

  async loadSettings() {
    try {
      // localStorageではなくchrome.storage.localを使用
      const result = await new Promise((resolve) => {
        chrome.storage.local.get(["autoGenerateSettings"], resolve);
      });

      const settings = result.autoGenerateSettings;

      if (settings) {
        this.targetCount = settings.generateCount ?? 10;
        this.isInfiniteMode = this.targetCount === 0;
        this.generateInterval = (settings.generateInterval || 5) * 1000;

        // DOM要素に反映
        const countInput = document.getElementById("generateCount");
        if (countInput) {
          countInput.value = this.targetCount;
        }

        const intervalInput = document.getElementById("generateInterval");
        if (intervalInput) {
          intervalInput.value = Math.floor(this.generateInterval / 1000);
        }
      }
    } catch (error) {
      console.error("Failed to load auto generate settings:", error);
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
