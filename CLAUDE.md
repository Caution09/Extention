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

- **Category Consolidation**: ライティング→照明, 身体/顔→身体
- **English Fixes**: bara→rose, hanabi→fireworks, gram→pentagram, digt→digit/finger
- **Logical Reorganization**: Move items to appropriate parent categories
- **Quality Standards**: Remove test entries, fix inconsistencies

#### Success Metrics:
- Zero duplicate categories
- Zero English spelling errors
- Logical category hierarchy
- Clean data structure
- Successful JavaScript generation

### Current Development Focus

- Migrating away from jQuery to vanilla JavaScript
- Implementing dark theme support (CSS variables already in place)
- Adding prompt history tracking
- Improving slot management with grouping features