# データ管理フォルダ

このフォルダには、プロンプトマスターデータの管理に関連するファイルが格納されています。

## ファイル構成

### メインデータ
- **マスターデータ.tsv** - メインのプロンプトデータファイル
- **非整形マスター_*.tsv** - バックアップファイル
- **categories.json** - カテゴリ一覧（JSON形式、プログラム用）
- **categories.txt** - カテゴリ一覧（テキスト形式、人間用）

### スクリプト
- **generate_master.py** - TSVからdefault-master.jsを生成するPythonスクリプト
- **generate_master.bat** - Windows用バッチファイル（ダブルクリックで実行）
- **character_mapping.py** - キャラクター名マッピング付きTSV処理スクリプト
- **process_characters_clean.py** - キャラクター整理用スクリプト
- **process_tsv.py** - 基本的なTSV処理スクリプト
- **analyze_characters.py** - キャラクターデータ分析スクリプト

## 使用方法

### default-master.js生成
1. **Windows**: `generate_master.bat` をダブルクリック
2. **Linux/Mac**: `python3 generate_master.py` を実行

### データ編集後の手順
1. `マスターデータ.tsv` を編集
2. `generate_master.py` または `generate_master.bat` を実行
3. 生成される以下のファイルを確認：
   - `assets/master/default-master.js` - 拡張機能用データ
   - `categories.json` - カテゴリ一覧（プログラム用）
   - `categories.txt` - カテゴリ一覧（確認用）

## 注意事項
- 編集前に必ずバックアップを作成してください
- TSVファイルの形式（タブ区切り、UTF-8エンコーディング）を維持してください
- キャラクターデータの編集時は、キャラクター再現版と通常版の両方が正しく生成されることを確認してください

## ファイル形式
TSVファイルの列構成：
1. 大項目（カテゴリ）
2. 中項目（サブカテゴリ）
3. 小項目（タイトル）
4. Prompt（プロンプト内容）