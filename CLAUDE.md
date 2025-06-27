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

### Master Data Maintenance and Quality Assurance

When the user requests "マスターデータ整理" or "マスターデータ更新", Claude should perform a comprehensive data quality analysis and cleanup following this workflow:

#### Phase 1: Analysis and Editing (Auto-execute)

1. **Create Backup**: Always backup `マスターデータ.tsv` before making changes
2. **Comprehensive Analysis**: Analyze all non-character categories for:

   - Duplicate categories (e.g., ライティング/照明, 身体/顔/身体)
   - English prompt errors (typos like "bara"→"rose", "hanabi"→"fireworks", "gram"→"pentagram", "digt"→"digit")
   - Misplaced subcategories (e.g., エフェクト>オブジェクト → オブジェクト>オブジェクト)
   - Test/invalid entries (お気に, 大項目, etc.)
   - Inconsistent naming patterns

3. **Execute Fixes in Parallel**:

   - Merge duplicate categories logically
   - Fix English spelling/grammar errors
   - Reorganize misplaced subcategories
   - Remove or relocate test entries
   - Standardize category naming conventions

4. **Data Integrity Validation**:
   - Verify no empty lines remain
   - Check total entry count
   - Confirm no error patterns remain
   - Validate category distribution

#### Phase 2: JavaScript Generation (User Permission Required)

**IMPORTANT**: After completing Phase 1, Claude must:

1. Present a summary of changes made
2. Ask for explicit user permission before proceeding
3. Only after user approval, run: `cd data-management && python3 generate_master.py`

#### Common Issues to Address:

- **Category Consolidation**: ライティング → 照明, 身体/顔 → 身体
- **English Fixes**: bara→rose, hanabi→fireworks, gram→pentagram, digt→digit/finger
- **Logical Reorganization**: Move items to appropriate parent categories
- **Quality Standards**: Remove test entries, fix inconsistencies

#### Success Metrics:

- Zero duplicate categories
- Zero English spelling errors
- Logical category hierarchy
- Clean data structure
- Successful JavaScript generation

## マスターデータ追加・管理標準プロセス

### プロセス概要

新規プロンプトデータの追加や既存データの大規模更新を行う際の標準作業手順です。

### 作業フロー

```
事前分析 → 品質改善 → 段階的追加 → 既存データ再編成 → 最終調整 → 生成・検証
```

### 1. 事前分析フェーズ

**目的**: 現状把握と作業計画策定

**実行手順**:

- マスターデータ.tsv、categories.txt、categories.json の確認
- 総データ行数・大項目数・中項目数の把握
- 重複データ・誤字・不適切な分類の特定

**確認項目**:

- [ ] データ品質状況の把握
- [ ] 重複・エラーパターンの特定
- [ ] 作業範囲の明確化

### 2. 品質改善フェーズ

**目的**: 既存データの品質向上

**実行項目**:

- 英語・日本語の誤字修正
- 重複エントリ・空行の削除
- 不適切な分類の修正
- カテゴリ命名の統一

### 3. 段階的追加フェーズ

**目的**: 新規データの体系的追加

#### 作業分割原則

- **1 段階あたり 50-80 アイテム**を目安
- **論理的関連性**でグループ化
- **重要度順**で段階設定

#### 標準段階構成

```
第1段階: 基本分類（場所、オブジェクトなど）
第2段階: 詳細表現（表情、感情など）
第3段階: 属性系（色、材質など）
第4段階: 特殊・専門項目
```

#### 各段階の実行手順

1. データ追加実行
2. 追加件数確認
3. 品質チェック
4. 次段階への移行判断

### 4. 既存データ再編成フェーズ

**目的**: 新カテゴリとの整合性確保

**実行項目**:

- 重複カテゴリの統合
- 既存項目の適切なカテゴリへの移動
- カテゴリ階層の論理性改善

### 5. 最終調整フェーズ

**目的**: ユーザー要求への対応

**調整例**:

- 性別・年齢別分類
- 詳細度レベルの調整
- 使用頻度による優先度調整

### 6. 生成・検証フェーズ

**目的**: 最終成果物の生成と品質確認

#### 生成前チェック

- データ整合性確認
- バックアップファイル確認

#### 生成実行（要ユーザー許可）

```bash
python3 generate_master.py
```

#### 生成後検証

- データ行数・カテゴリ数の確認
- 各生成ファイルの更新確認
- バックアップ作成確認

### ToDo 管理テンプレート

```json
[
  { "id": "analysis", "content": "事前分析完了", "priority": "high" },
  { "id": "quality", "content": "品質改善完了", "priority": "high" },
  { "id": "stage-N", "content": "第N段階追加完了", "priority": "medium" },
  {
    "id": "reorganize",
    "content": "既存データ再編成完了",
    "priority": "medium"
  },
  { "id": "adjustment", "content": "最終調整完了", "priority": "low" },
  {
    "id": "generation",
    "content": "JavaScript生成（要許可）",
    "priority": "high"
  }
]
```

### 品質保証原則

- **必須**: 作業前の自動バックアップ
- **推奨**: 段階的実行によるリスク分散
- **禁止**: ユーザー許可なしの JavaScript 生成

### 成果物定義

1. **default-master.js** - メイン JavaScript ファイル
2. **categories.json** - カテゴリ構造データ
3. **categories.txt** - 人間可読カテゴリ一覧
4. **backup files** - 作業前状態の保存

### 適用トリガー

ユーザーが以下のような要求をした場合、この標準プロセスを自動適用：

- 「マスターデータに ○○ を追加して」
- 「新しいプロンプトカテゴリを追加したい」
- 「データを整理・更新して」
- 大量のプロンプト候補データの提供

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

2. **自動処理の実行**

   - フォーマット検証
   - 重複チェック
   - マスターデータへの追加
   - JavaScript 生成（ユーザー許可後）

3. **追加後の処理**
   - 追加完了後、`追加希望.tsv`の内容をクリア
   - 必要に応じて`追加済み/追加希望_YYYYMMDD.tsv`として保存

#### メリット

- 作業の明確化と効率化
- エラー防止（事前フォーマット確認）
- 履歴管理（何を追加したか記録が残る）
- 大量項目の一括処理が可能

### Current Development Focus

- Migrating away from jQuery to vanilla JavaScript
- Implementing dark theme support (CSS variables already in place)
- Adding prompt history tracking
- Improving slot management with grouping features
