# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome Extension (Manifest V3) for managing AI image generation prompts. It's written in vanilla JavaScript with jQuery and uses Chrome Storage API for persistence.

## Development Commands

This is a pure JavaScript project with no build system:

- **Run the extension**: Load unpacked extension in Chrome Extensions page (Developer mode)
- **Test changes**: Edit files → Click "Reload" in Chrome Extensions page
- **Debug**: Open DevTools in extension popup or inspect background service worker
- **No compilation/build required** - Direct file editing

## Architecture Overview

The extension follows a modular architecture with clear separation of concerns:

### Core Module Loading Order (from popup.html)

1. **Libraries**: jQuery, jQuery UI, PapaParse
2. **Core**: storage.js → app-state.js → error-handler.js → validators.js
3. **Data**: data-manager.js → category-manager.js → prompt-editor.js → prompt-slots.js
4. **UI Components**: ui-factory.js → ui-utilities.js → list-manager.js
5. **Tab System**: tab-manager.js → [search, dictionary, edit, slot, other]-tab.js
6. **Features**: file-handler.js → csv-handler.js → auto-generate-handler.js → shortcut-manager.js → settings-manager.js → [search, edit, dictionary]-handler.js
7. **External**: api-client.js → global-utilities.js
8. **Entry**: main.js

### Key Architectural Patterns

1. **State Management**:

   - Global state managed by `app-state.js`
   - All modules access state through AppState object
   - Chrome Storage API for persistence

2. **Tab System**:

   - Each tab extends TabManager base class
   - Tabs handle their own initialization and event binding
   - Tab switching managed centrally

3. **Event Communication**:

   - Custom events for module communication
   - jQuery event system for UI interactions
   - Chrome runtime messaging for background/content script communication

4. **Module Dependencies**:
   - Modules expose global objects (e.g., window.AppState, window.UIFactory)
   - Strict loading order defined in popup.html
   - Each module checks for its dependencies

### Important Implementation Details

1. **Prompt Slots**: Supports up to 100 slots for prompt management
2. **Storage**: Uses Chrome Storage Sync API with 8KB limit per item
3. **UI State**: Tab state and search filters preserved across sessions
4. **Error Handling**: Centralized error handler with user notifications
5. **File Operations**: Import/export via JSON and CSV formats
6. **API Integration**: Supports NovelAI and local Stable Diffusion WebUI

### Data Management

The extension uses a master data system for prompt templates:

1. **Master Data Source**: `data-management/マスターデータ.tsv`

   - TSV format with columns: 大項目, 中項目, 小項目, Prompt
   - Contains all prompt templates organized by category
   - Character entries have both reproduction (full prompt) and simplified (character name only) versions

2. **Data Generation**:

   - `data-management/generate_master.py` converts TSV to JavaScript
   - Generates `assets/master/default-master.js` for the extension
   - Also generates category reference files: `categories.json` and `categories.txt`
   - Automatic backup of existing files
   - Run via `generate_master.bat` (Windows) or `python3 generate_master.py`

3. **Data Management Tools**:

   - `character_mapping.py`: Handles character name extraction and mapping
   - `process_characters_clean.py`: Clean character data processing
   - `analyze_characters.py`: Character data analysis
   - All tools located in `data-management/` folder

4. **Workflow**:
   - Edit `マスターデータ.tsv` → Run generation script → Updated files
   - Generated files: `default-master.js`, `categories.json`, `categories.txt`
   - Character entries automatically split into reproduction and simplified versions
   - Manual mapping available for problematic character extractions
   - Use `categories.txt` for quick category overview and data verification

5. **Character Data Classification Rules**:
   - **キャラクター**: Character name only (e.g., "cirno", "remilia scarlet")
   - **キャラクター再現**: Character with additional elements (e.g., "cirno, ice wings, blue dress")
   - **Prompt完全一致統合**: When multiple entries have identical 大項目・中項目・Prompt, consolidate into single entry with combined 小項目 (e.g., "チルノ,⑨" for cirno entries). This is automatically handled by `sort_and_clean.sh`
   - **Character Entry Auto-Generation Rule**: When processing complex character entries with multiple elements (styles, attributes, etc.), apply the dual-entry system:
     - **Step 1**: Move complex entries to キャラクター再現 category
     - **Step 2**: Create simplified キャラクター entry with character name only
     - **Application**: All character entries with prompts containing multiple elements, style tags, or detailed descriptions
     - Example: 
       - Original: キャラクター → アイカツ! → 大空あかり → "{1girl, oozora akari, aikatsu!}, styles, details..."
       - Result: キャラクター再現 → アイカツ! → 大空あかり → "{1girl, oozora akari, aikatsu!}, styles, details..."
       - Result: キャラクター → アイカツ! → 大空あかり → "oozora akari (aikatsu!)"
     - **CRITICAL WARNING**: Character name extraction must be done carefully and individually
       - Do NOT assume the first element is always the character name - it could be a work name, description, or other element
       - ALWAYS analyze each character reproduction entry individually to identify the actual character name
       - Look for character names in these patterns:
         - Within brackets: `{{{character_name}}}` or `{{character_name}}`
         - After work names: `bocchi the rock!, {{{ijichi nijika}}}` → "ijichi nijika"
         - Sometimes in the middle: `game cg, {{{character_name}}}, attributes...`
       - Common misleading first elements: work names, "game cg", "hyper detailed", style descriptors
       - When in doubt, manually check the context and surrounding elements
       - Each entry requires individual analysis - no bulk assumptions
   - **Duplicate Character Entry Resolution**: When multiple character entries exist for the same 大項目/中項目/小項目:
     - Prioritize entries with more detailed information (e.g., with work/series name in parentheses)
     - Remove simpler/shorter versions
     - Example: Keep "tomori nao(Charlotte)" over "tomori nao"
     - This ensures consistency and prevents confusion in character selection
   - **Character Entry Bracket Removal**: Character entries (大項目: キャラクター) should not have curly brackets
     - Remove all wrapping brackets from character names
     - Example: "{{{tedeza_rize (gochiusa)}}}" → "tedeza_rize (gochiusa)"
     - This rule applies ONLY to キャラクター entries, NOT to キャラクター再現
     - Clean format improves readability and consistency
   - **Series Name Addition for Character Disambiguation**: Add series/work names in parentheses to character entries
     - Purpose: Prevent confusion when multiple characters share the same name across different works
     - Format: "character_name (series_name)"
     - Examples:
       - "Flayn" → "Flayn (fire emblem)"
       - "jeanne d'arc" → "jeanne d'arc (fate)"
       - "sakura miko" → "sakura miko (hololive)"
     - Apply to all character entries where the category represents a specific work/series
     - This improves prompt accuracy and prevents AI from generating wrong characters

6. **Data Correction Policy**:
   - **Individual Processing**: All corrections must be handled individually unless explicitly stated otherwise
   - **Element-by-Element**: Process each specified item separately, avoid bulk operations
   - **User Specification**: When user wants bulk changes, they will specify at item level (not element level)
   - **Explicit Instructions Only**: Only perform the exact corrections specified, no additional assumptions

7. **Data Sorting and Cleaning**:
   - **Sorting Script**: Use `data-management/sort_and_clean.sh` for all sorting operations
   - **Script Functions**: Removes trailing commas, sorts data, removes duplicates, creates backups
   - **Usage**: Always use this script instead of manual sort commands
   - **Automatic Backup**: Script automatically creates timestamped backups before processing

### Master Data Maintenance and Quality Assurance

#### 概要・適用トリガー

以下のユーザー要求時に自動適用：
- 「マスターデータ整理」「マスターデータ更新」
- 「マスターデータに○○を追加して」
- 「新しいプロンプトカテゴリを追加したい」  
- 「データを整理・更新して」
- 大量のプロンプト候補データの提供

#### 標準作業フロー

```
事前分析 → 品質改善 → 段階的追加 → 既存データ再編成 → 最終調整 → 生成・検証
```

#### Phase 1: 事前分析・品質改善 (自動実行)

**1.1 バックアップ作成**
- `マスターデータ.tsv`の自動バックアップ
- タイムスタンプ付きファイル作成

**1.2 品質分析項目**
- 重複カテゴリ検出 (例: ライティング/照明, 身体/顔/身体)
- 英語誤字検出 (例: "bara"→"rose", "hanabi"→"fireworks", "gram"→"pentagram", "digt"→"digit")
- 誤配置サブカテゴリ検出 (例: エフェクト>オブジェクト → オブジェクト>オブジェクト)
- 無効エントリ検出 (お気に, 大項目, etc.)
- 命名不統一パターン検出

**1.3 データクリーニング実行**
- 重複カテゴリの論理的統合
- 英語スペル・文法エラー修正
- サブカテゴリの適切な再配置
- テストエントリの削除・移動
- カテゴリ命名規則の統一

**1.4 既存カテゴリ統合チェック**
- `categories.txt`を参照して既存の全大項目・中項目を確認
- 新規項目より適切な既存カテゴリが存在する場合は既存カテゴリを使用
- 統合例: `行動・ポーズ`→`動作`, `表現手法`→`テイスト`, `表情`→`表情・感情`, `服装・衣類`→`服装`

**1.5 データ整合性検証**
- 空行の除去確認
- 総エントリ数チェック
- エラーパターン残存確認
- カテゴリ分布検証

#### Phase 2: JavaScript生成 (要ユーザー許可)

**重要**: Phase 1完了後、必須手順：

1. **変更内容サマリー提示**
2. **ユーザー明示許可の取得**
3. **許可後のみ実行**: `python3 generate_master.py`

#### 品質保証基準

**成功指標**:
- 重複カテゴリ: 0件
- 英語スペルエラー: 0件
- 論理的カテゴリ階層
- クリーンなデータ構造
- JavaScript生成成功

**共通問題と対処法**:
- **カテゴリ統合**: ライティング → 照明, 身体/顔 → 身体
- **英語修正**: bara→rose, hanabi→fireworks, gram→pentagram, digt→digit/finger
- **論理的再編成**: 適切な親カテゴリへの移動
- **品質基準**: テストエントリ削除、不整合修正

## マスターデータ新規追加の標準プロセス

### 段階的追加の作業原則

**作業分割ガイドライン**:
- 1段階あたり50-80アイテムを目安
- 論理的関連性でグループ化
- 重要度順で段階設定

**標準段階構成**:
```
第1段階: 基本分類（場所、オブジェクトなど）
第2段階: 詳細表現（表情、感情など）  
第3段階: 属性系（色、材質など）
第4段階: 特殊・専門項目
```

**各段階の実行手順**:
1. データ追加実行
2. 追加件数確認
3. 品質チェック
4. 次段階への移行判断

### ToDo管理テンプレート

```json
[
  { "id": "analysis", "content": "事前分析完了", "priority": "high" },
  { "id": "quality", "content": "品質改善完了", "priority": "high" },
  { "id": "stage-N", "content": "第N段階追加完了", "priority": "medium" },
  { "id": "reorganize", "content": "既存データ再編成完了", "priority": "medium" },
  { "id": "adjustment", "content": "最終調整完了", "priority": "low" },
  { "id": "generation", "content": "JavaScript生成（要許可）", "priority": "high" }
]
```

### データソート・クリーニング（必須処理）

**目的**: データ品質の統一と順序の一貫性確保

**実行方法**: 
```bash
./sort_and_clean.sh
```

**処理内容**:
- 完全重複行の削除（4列すべてが一致）
- データ順序の統一（アルファベット順ソート）
- 末尾カンマ削除
- **同一プロンプト項目の統合**: 大項目・中項目・Promptが同じ場合、小項目をカンマ区切りで統合
- 自動バックアップ作成

### 最終成果物

1. **default-master.js** - メインJavaScriptファイル
2. **categories.json** - カテゴリ構造データ
3. **categories.txt** - 人間可読カテゴリ一覧
4. **backup files** - 作業前状態の自動保存

### マスターデータ追加の効率的な運用方法

#### 追加希望.tsv を使用した運用フロー

ユーザーが「マスターに追加希望」と言った場合、以下の手順で作業を実行：

1. **追加希望.tsv の確認**

   - `data-management/追加希望.tsv`ファイルを確認
   - TSV フォーマット: `大項目\t中項目\t小項目\tPrompt`
   - 例:
     ```
     服装・衣類	頭部	フード	hood up
     カメラワーク	構図	脇にフォーカス	armpit focus
     ```

2. **品質管理・データクリーニング**

   **2.1 無効カテゴリの修正**
   以下の無効なカテゴリ項目を適切な既存カテゴリに自動修正：
   - 空欄（大項目・中項目） → 適切な既存カテゴリに再分類
   - `お気に` → 適切な既存カテゴリに再分類
   - `お気に入り` → 適切な既存カテゴリに再分類  
   - `未分類` → 適切な既存カテゴリに再分類
   - `Google翻訳` → 適切な既存カテゴリに再分類
   - `翻訳中` → 適切な既存カテゴリに再分類

   **2.2 カテゴリ最適化・既存項目確認**
   **重要**: 新規要素追加時は必ず既存の大項目・中項目を確認し、適切なものがあれば統合する
   - **確認対象**: categories.txt を参照して既存の全大項目・中項目を確認
   - **統合ルール**: 新規項目より適切な既存カテゴリが存在する場合は既存カテゴリを使用
   - **例**: 
     - `行動・ポーズ` → 既存の `動作` を使用
     - `表現手法` → 既存の `テイスト` を使用
     - `表情` → 既存の `表情・感情` を使用
     - `服装・衣類` → 既存の `服装` を使用
   - **プロセス**: Promptの内容を分析し、既存のマスターデータから最も適切なカテゴリを特定
   - **報告**: 変更内容をユーザーに報告

   **2.3 空欄小項目の自動補完**
   小項目が空欄の場合、Promptの内容に基づいて適切な小項目名を自動設定

   **2.4 未登録カテゴリの分離**
   既存のマスターデータに存在しない大項目・中項目の組み合わせについて：
   - `未登録項目.tsv`ファイルに移動
   - `追加希望.tsv`から削除
   - 後日個別検討のため保留

3. **自動処理の実行**

   - フォーマット検証
   - 品質管理・データクリーニング（上記2.1〜2.4）
   - 重複チェック
   - マスターデータへの段階的追加
   - JavaScript 生成（ユーザー許可後）

4. **追加後の処理**
   - 追加完了後、`追加希望.tsv`の中身をクリア（ファイル自体は削除しない）
   - 処理済みデータは`追加済み/追加希望_YYYYMMDD.tsv`として履歴保存

#### メリット

- 作業の明確化と効率化
- エラー防止（事前フォーマット確認）
- 履歴管理（何を追加したか記録が残る）
- 大量項目の一括処理が可能

### キャラクター性別振り分け作業の標準プロセス

#### 概要・適用トリガー

以下のユーザー要求時に自動適用：
- 「キャラクターの性別振り分けを続けて」
- 「性別分類を進めて」
- 「キャラクターを性別ごとに整理して」
- 「キャラクター(女性)・キャラクター(男性)・キャラクター(人外)に分けて」

#### 標準作業フロー

```
1. 分析準備 → 2. 作品選定 → 3. 性別判定 → 4. 一括変換 → 5. 検証・修正 → 6. 継続判断
```

#### Phase 1: 分析準備

**1.1 バックアップ作成**
```bash
cp "マスターデータ.tsv" "backups/マスターデータ_backup_$(date '+%Y%m%d_%H%M%S').tsv"
```

**1.2 未分類キャラクターの確認**
- `grep "^キャラクター\t" マスターデータ.tsv | head -20` で対象確認
- 10作品程度を1バッチとして選定

**1.3 ToDo更新**
- 性別振り分け進行状況をToDoListで管理
- バッチ単位での進捗追跡

#### Phase 2: 作品選定と性別判定設定

**2.1 作品分類**
作品を以下の3パターンに分類：

1. **女性のみ作品**: `'女性'`
   - 例: 東方, 私に天使が舞い降りた！, 咲
   
2. **混合作品**: `'混合'`
   - 例: 無職転生, 物語シリーズ, 犬夜叉
   
3. **人外作品**: `'人外'`
   - 例: 星のカービィ

**2.2 スクリプトテンプレート作成**
```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# バッチ変換スクリプトのテンプレート
series_gender = {
    'その他': 'スキップ',  # その他はスキップ
    '作品名1': '女性',      # 女性のみ作品
    '作品名2': '混合',      # 混合作品
    '作品名3': '人外'       # 人外作品
}

# 混合作品の個別性別判定
mixed_characters = {
    'キャラクター名1': '女性',
    'キャラクター名2': '男性',
    'キャラクター名3': '人外'
}
```

#### Phase 3: 一括変換実行

**3.1 変換ロジック**
- `キャラクター\t作品名\t` → `キャラクター(性別)\t作品名\t`
- 変換対象: 10作品程度/バッチ
- ファイル名: `batch_convert_10series_[N].py`

**3.2 実行手順**
```bash
python3 batch_convert_10series_[N].py
```

**3.3 変換カウント確認**
- スクリプトで変換数を自動表示
- 個別変換とデフォルト変換の内訳確認

#### Phase 4: 検証・修正

**4.1 性別修正**
ユーザーからの指摘に基づき即座修正：
```bash
sed -i 's/キャラクター(誤った性別)/キャラクター(正しい性別)/g' マスターデータ.tsv
```

**4.2 追加キャラクター対応**
- ユーザーリクエストに基づく追加キャラクター
- 個別追加スクリプト作成・実行

**4.3 名前・表記修正**
- 英語表記統一 (例: ボイスロイド → VOICE ROID)
- カテゴリ統合 (例: ホロライブ → Hololive)

#### Phase 5: 継続判断

**5.1 残作業確認**
```bash
grep "^キャラクター\t" マスターデータ.tsv | wc -l
```

**5.2 次バッチ準備**
- 次の10作品を選定
- 新しい変換スクリプト作成

**5.3 完了判定**
- 全ての`キャラクター\t`エントリが変換完了時点で終了
- 最終データクリーニング実行

#### 共通パターンと対処法

**性別判定の基本原則**:
- **女性**: 明確に女性キャラクター
- **男性**: 明確に男性キャラクター  
- **人外**: 性別が不明確、または非人間的存在
- **デフォルト**: 混合作品で個別設定がない場合は女性

**よくある修正パターン**:
- トラップキャラ: 見た目と性別の相違 (例: 漆原るか → 男性)
- 機械・非生物: 人外分類 (例: サーナイト → 人外)
- 特殊設定: 作品内設定に基づく判定

**作業効率化のコツ**:
- 10作品/バッチで効率的処理
- ユーザーフィードバック即座反映
- 段階的進行でミス削減

#### 最終成果物

1. **変換完了**: 全キャラクターが`キャラクター(性別)`形式
2. **バックアップ**: 各段階での自動バックアップ
3. **変換履歴**: バッチ別変換スクリプト保存
4. **品質確保**: 性別判定の一貫性確保

### Current Development Focus

- Migrating away from jQuery to vanilla JavaScript
- Implementing dark theme support (CSS variables already in place)
- Adding prompt history tracking
- Improving slot management with grouping features
