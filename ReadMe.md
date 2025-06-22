# Prompt Generator

画像生成 AI（Stable Diffusion、NovelAI）用のプロンプトを効率的に管理・生成する Chrome 拡張機能です。

## 🌟 主な機能

### 1. プロンプト管理

- **複数プロンプトスロット**: 最大 10 個のプロンプトを切り替えて管理
- プロンプトの保存・読み込み
- カテゴリー別の整理（大・中・小カテゴリー）
- アーカイブ機能でよく使うプロンプトを保存

### 2. 検索機能

- キーワード検索
- カテゴリーフィルター検索
- Google 翻訳/DeepL API による自動翻訳

### 3. 編集機能

- ドラッグ&ドロップで要素の並び替え
- 重み付け編集（SD/NAI 形式対応）
- テキスト編集モード/選択編集モード

### 4. 辞書機能

- ローカル要素辞書
- マスター辞書
- プロンプト辞書

### 5. スロット管理（NEW）

- 10 個のプロンプトスロットで複数の作業を並行管理
- 専用タブで一覧表示・編集
- Ctrl+1〜9 でクイック切り替え
- 全スロット結合で Generate

### 6. その他

- JSON/CSV ファイルのインポート/エクスポート
- PNG 画像からのプロンプト情報抽出
- コンテキストメニューからの素早いアクセス
- 自動 Generate 機能（NovelAI 専用）
- 設定のバックアップ/リストア

## 📦 インストール方法

### 初回インストール

1. **リポジトリをダウンロード**

   ```bash
   git clone https://github.com/yourusername/PromptGenerator.git
   ```

   または [Releases](https://github.com/yourusername/PromptGenerator/releases) から最新版の ZIP ファイルをダウンロード

2. **Chrome の拡張機能ページを開く**

   - Chrome のアドレスバーに `chrome://extensions/` を入力
   - または、メニュー → その他のツール → 拡張機能

3. **デベロッパーモードを有効化**

   - 右上の「デベロッパーモード」を ON にする

4. **拡張機能を読み込む**

   - 「パッケージ化されていない拡張機能を読み込む」をクリック
   - ダウンロードしたフォルダを選択

5. **インストール完了**
   - ツールバーに拡張機能のアイコンが表示されます
   - ピン留めしておくと便利です

## 🔄 更新方法

### 方法 1: Git を使用（推奨）

```bash
# プロジェクトフォルダに移動
cd PromptGenerator

# 最新版を取得
git pull origin main

# Chrome拡張機能ページで「更新」ボタンをクリック
```

### 方法 2: 手動更新

1. [Releases](https://github.com/yourusername/PromptGenerator/releases) から最新版をダウンロード
2. 既存のフォルダに上書き（設定は `chrome.storage` に保存されているので消えません）
3. Chrome 拡張機能ページで「更新」ボタンをクリック

### 更新の確認

1. `chrome://extensions/` を開く
2. 「Prompt Generator」を探す
3. 「更新」ボタンをクリック
4. バージョン番号が更新されていることを確認

## 🚀 使い方

### 基本的な使い方

1. **拡張機能アイコンをクリック**してポップアップを開く（または Alt+G でサイドパネル）

2. **検索タブ**

   - キーワードを入力して検索
   - カテゴリーで絞り込み
   - 「Set」で現在のプロンプトに追加、「Copy」でクリップボードにコピー

3. **辞書タブ**

   - プロンプトを「Save」ボタンで保存
   - 要素を追加して独自の辞書を作成
   - ドラッグ&ドロップで並び替え

4. **編集タブ**

   - 現在のプロンプトの要素を個別に編集
   - 重み付けを調整
   - ドラッグ&ドロップで順序変更

5. **スロットタブ**（NEW）
   - 10 個のプロンプトスロットを管理
   - 各スロットに名前を付けて整理
   - 直接編集可能なテキストエリア

### ショートカット

**ポップアップ内**

- **Ctrl+S**: 現在のプロンプトを辞書に保存
- **Ctrl+C**: プロンプトをコピー
- **Ctrl+K**: 検索ボックスにフォーカス
- **Ctrl+1〜9**: プロンプトスロット切り替え
- **Tab**: タブ間の移動

**グローバル**

- **Alt+G**: サイドパネルを開く
- **Ctrl+Shift+S**: 選択テキストを辞書に保存

### コンテキストメニュー

1. テキストを選択して右クリック → 「プロンプトを記録する」
2. 入力欄で右クリック → 「記録済みプロンプト」から選択

## 📁 フォルダ構成

```
PromptGenerator/
├── manifest.json          # 拡張機能の設定
├── popup.html            # メインUI
├── popup.css             # スタイル
├── README.md             # このファイル
│
├── js/
│   ├── background.js     # バックグラウンド処理
│   ├── main.js          # メインアプリケーション
│   │
│   ├── core/            # コア機能
│   │   ├── storage.js         # Chrome Storage APIラッパー
│   │   ├── app-state.js       # グローバル状態管理
│   │   ├── error-handler.js   # エラー処理・通知
│   │   └── validators.js      # 入力検証
│   │
│   ├── data/            # データ管理
│   │   ├── data-manager.js    # データ永続化
│   │   ├── category-manager.js # カテゴリー管理
│   │   ├── prompt-editor.js   # プロンプト編集エンジン
│   │   └── prompt-slots.js    # 複数スロット管理
│   │
│   ├── ui/              # UI関連
│   │   ├── components/        # UI部品
│   │   │   ├── ui-factory.js      # UI要素生成
│   │   │   ├── ui-utilities.js    # UIユーティリティ
│   │   │   └── list-manager.js    # リスト表示管理
│   │   │
│   │   └── tabs/              # タブ別モジュール（Phase 8.5で追加予定）
│   │       ├── search-tab.js      # 検索タブ（予定）
│   │       ├── dictionary-tab.js  # 辞書タブ（予定）
│   │       ├── edit-tab.js        # 編集タブ（予定）
│   │       ├── slot-tab.js        # スロットタブ（予定）
│   │       └── other-tab.js       # その他タブ（予定）
│   │
│   ├── features/        # 個別機能
│   │   ├── file-handler.js        # ファイル処理
│   │   ├── csv-handler.js         # CSV入出力
│   │   ├── auto-generate-handler.js # 自動生成
│   │   ├── shortcut-manager.js    # ショートカット
│   │   ├── settings-manager.js    # 設定管理
│   │   ├── search-handler.js      # 検索処理（※）
│   │   ├── edit-handler.js        # 編集処理（※）
│   │   └── dictionary-handler.js  # 辞書処理（※）
│   │                             # ※ Phase 8.5でtabsに統合予定
│   │
│   └── external/        # 外部連携
│       ├── api-client.js          # API通信
│       ├── content-script.js      # コンテンツスクリプト
│       └── global-utilities.js    # 後方互換用
│
├── lib/                 # 外部ライブラリ
│   ├── jquery-3.5.1.js
│   ├── jquery-ui.js
│   └── papaparse.min.js
│
└── assets/
    ├── icon/           # アイコンファイル
    └── master/         # マスターデータ
```

## 🔧 トラブルシューティング

### 拡張機能が表示されない

1. `chrome://extensions/` で有効になっているか確認
2. エラーが表示されている場合は「エラー」をクリックして詳細を確認

### データが消えた

- データは Chrome の同期ストレージに保存されています
- Chrome にログインしていることを確認
- 開発者ツール → Application → Storage → Local Storage で確認

### 翻訳が動作しない

1. インターネット接続を確認
2. DeepL API を使用する場合は、Option → DeepL API キーを設定

### 更新後に動作しない

1. Chrome 拡張機能ページで「更新」ボタンをクリック
2. それでも動作しない場合は、一度無効化してから再度有効化
3. ブラウザを再起動

## 👨‍💻 開発者向け情報

### アーキテクチャ

- **モジュール設計**: 機能ごとに独立したモジュール
- **イベント駆動**: Chrome Extension API のイベントベース
- **状態管理**: AppState による一元管理
- **非同期処理**: async/await による統一的な処理

### デバッグ方法

1. ポップアップで右クリック → 「検証」
2. バックグラウンドページ: 拡張機能ページから「Service Worker」をクリック
3. コンソールでデバッグ情報を確認：
   ```javascript
   AppState.debug(); // アプリケーション状態
   categoryData.debug(); // カテゴリーデータ
   promptSlotManager.getAllSlotInfo(); // スロット情報
   showGlobalUtilitiesInfo(); // ユーティリティ情報
   ```

### データのバックアップ

```javascript
// コンソールで実行
chrome.storage.local.get(null, (data) => {
  const json = JSON.stringify(data, null, 2);
  console.log(json); // これをコピーして保存
});
```

### カスタマイズ

- `popup.css` でスタイルを変更
- `assets/master/default-master.js` でデフォルトの辞書を編集
- 新しいタブを追加する場合は `js/ui/tabs/` に追加

## 📝 更新履歴

### v2.0.0 (2024-12-XX)

- Phase 8: 複数プロンプト管理機能
- Phase 7: CSV 入出力、自動 Generate 機能
- フォルダ構造の大幅改善

### v1.0.0 (2024-XX-XX)

- 初回リリース

## 📄 ライセンス

[MIT ライセンス](LICENSE)

## 🤝 貢献

バグ報告や機能提案は [Issues](https://github.com/yourusername/PromptGenerator/issues) へ

## 📧 連絡先

- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

---

⭐ このプロジェクトが役に立ったら、スターをお願いします！
