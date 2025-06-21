/**
 * バリデーションモジュール
 * 入力値の検証ロジックを統一
 */
const Validators = {
  /**
   * 空文字チェック
   * @param {string} value - 検証する値
   * @param {string} [fieldName] - フィールド名
   * @returns {Object} 検証結果
   */
  required(value, fieldName = 'フィールド') {
    const isValid = value && value.trim().length > 0;
    return {
      isValid,
      message: isValid ? '' : `${fieldName}は必須です`
    };
  },

  /**
   * 最大長チェック
   * @param {string} value - 検証する値
   * @param {number} maxLength - 最大長
   * @param {string} [fieldName] - フィールド名
   * @returns {Object} 検証結果
   */
  maxLength(value, maxLength, fieldName = 'フィールド') {
    const isValid = !value || value.length <= maxLength;
    return {
      isValid,
      message: isValid ? '' : `${fieldName}は${maxLength}文字以内で入力してください`
    };
  },

  /**
   * パターンマッチング
   * @param {string} value - 検証する値
   * @param {RegExp} pattern - 正規表現パターン
   * @param {string} [message] - エラーメッセージ
   * @returns {Object} 検証結果
   */
  pattern(value, pattern, message = '入力形式が正しくありません') {
    const isValid = !value || pattern.test(value);
    return {
      isValid,
      message: isValid ? '' : message
    };
  },

  /**
   * プロンプトの重複チェック
   * @param {Object} newItem - 新しいアイテム
   * @param {Array} existingList - 既存のリスト
   * @returns {Object} 検証結果
   */
  checkDuplicatePrompt(newItem, existingList) {
    const newKey = newItem.prompt + newItem.data[0] + newItem.data[1] + newItem.data[2];
    
    const duplicate = existingList.find(item => {
      const existingKey = item.prompt + item.data[0] + item.data[1] + item.data[2];
      return newKey === existingKey;
    });
    
    return {
      isValid: !duplicate,
      message: duplicate ? '既に同じ要素が追加されています' : '',
      duplicate
    };
  },

  /**
   * アーカイブの重複チェック
   * @param {string} prompt - プロンプト
   * @param {Array} archivesList - アーカイブリスト
   * @returns {Object} 検証結果
   */
  checkDuplicateArchive(prompt, archivesList) {
    const duplicate = archivesList.find(item => item.prompt === prompt);
    
    return {
      isValid: !duplicate,
      message: duplicate ? `既に同じプロンプトが追加されています。名前：${duplicate.title}` : '',
      duplicate
    };
  },

  /**
   * カテゴリー入力の検証
   * @param {Object} categories - { big, middle, small }
   * @returns {Object} 検証結果
   */
  validateCategories(categories) {
    const errors = [];
    
    // 大カテゴリーは任意
    if (categories.big && categories.big.length > 50) {
      errors.push({
        field: 'big',
        message: '大カテゴリーは50文字以内で入力してください'
      });
    }
    
    // 中カテゴリーは任意
    if (categories.middle && categories.middle.length > 50) {
      errors.push({
        field: 'middle',
        message: '中カテゴリーは50文字以内で入力してください'
      });
    }
    
    // 小カテゴリーは任意
    if (categories.small && categories.small.length > 50) {
      errors.push({
        field: 'small',
        message: '小カテゴリーは50文字以内で入力してください'
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * プロンプト文字列の検証
   * @param {string} prompt - プロンプト
   * @returns {Object} 検証結果
   */
  validatePrompt(prompt) {
    const errors = [];
    
    if (!prompt || prompt.trim().length === 0) {
      errors.push({
        field: 'prompt',
        message: 'プロンプトは必須です'
      });
    }
    
    if (prompt && prompt.length > 500) {
      errors.push({
        field: 'prompt',
        message: 'プロンプトは500文字以内で入力してください'
      });
    }
    
    // 不正な文字のチェック
    const invalidChars = /[\x00-\x1F\x7F]/;
    if (prompt && invalidChars.test(prompt)) {
      errors.push({
        field: 'prompt',
        message: '使用できない文字が含まれています'
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * 重み値の検証
   * @param {string} weight - 重み値
   * @returns {Object} 検証結果
   */
  validateWeight(weight) {
    if (!weight) {
      return { isValid: true };
    }
    
    const numWeight = parseFloat(weight);
    
    if (isNaN(numWeight)) {
      return {
        isValid: false,
        message: '重みは数値で入力してください'
      };
    }
    
    if (numWeight < -10 || numWeight > 10) {
      return {
        isValid: false,
        message: '重みは-10から10の範囲で入力してください'
      };
    }
    
    return { isValid: true };
  },

  /**
   * APIキーの検証
   * @param {string} apiKey - APIキー
   * @param {string} [keyType='API'] - キーの種類
   * @returns {Object} 検証結果
   */
  validateApiKey(apiKey, keyType = 'API') {
    if (!apiKey) {
      return { isValid: true }; // 任意項目
    }
    
    // DeepL APIキーの形式チェック
    if (keyType === 'DeepL') {
      const pattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
      if (!pattern.test(apiKey)) {
        return {
          isValid: false,
          message: 'DeepL APIキーの形式が正しくありません'
        };
      }
    }
    
    return { isValid: true };
  },

  /**
   * ファイルタイプの検証
   * @param {File} file - ファイルオブジェクト
   * @param {string[]} allowedTypes - 許可するMIMEタイプ
   * @returns {Object} 検証結果
   */
  validateFileType(file, allowedTypes) {
    const isValid = allowedTypes.includes(file.type);
    return {
      isValid,
      message: isValid ? '' : `対応していないファイル形式です。対応形式: ${allowedTypes.join(', ')}`
    };
  },

  /**
   * ファイルサイズの検証
   * @param {File} file - ファイルオブジェクト
   * @param {number} maxSizeMB - 最大サイズ（MB）
   * @returns {Object} 検証結果
   */
  validateFileSize(file, maxSizeMB) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const isValid = file.size <= maxSizeBytes;
    return {
      isValid,
      message: isValid ? '' : `ファイルサイズは${maxSizeMB}MB以下にしてください`
    };
  },

  /**
   * 複合検証の実行
   * @param {Object} data - 検証データ
   * @param {Object} rules - 検証ルール
   * @returns {Object} 検証結果
   */
  validate(data, rules) {
    const errors = [];
    
    Object.entries(rules).forEach(([field, fieldRules]) => {
      const value = data[field];
      
      fieldRules.forEach(rule => {
        let result;
        
        switch (rule.type) {
          case 'required':
            result = this.required(value, rule.fieldName || field);
            break;
          case 'maxLength':
            result = this.maxLength(value, rule.max, rule.fieldName || field);
            break;
          case 'pattern':
            result = this.pattern(value, rule.pattern, rule.message);
            break;
          case 'custom':
            result = rule.validator(value, data);
            break;
          default:
            result = { isValid: true };
        }
        
        if (!result.isValid) {
          errors.push({
            field,
            message: result.message
          });
        }
      });
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// 便利な検証ルールのプリセット
Validators.Rules = {
  /**
   * プロンプト要素の検証ルール
   */
  promptElement: {
    prompt: [
      { type: 'required', fieldName: 'プロンプト' },
      { type: 'maxLength', max: 500, fieldName: 'プロンプト' }
    ]
  },

  /**
   * アーカイブの検証ルール
   */
  archive: {
    title: [
      { type: 'maxLength', max: 100, fieldName: 'タイトル' }
    ],
    prompt: [
      { type: 'required', fieldName: 'プロンプト' }
    ]
  },

  /**
   * 設定の検証ルール
   */
  settings: {
    deeplAuthKey: [
      { 
        type: 'custom', 
        validator: (value) => Validators.validateApiKey(value, 'DeepL')
      }
    ]
  }
};

// グローバルに公開
if (typeof window !== 'undefined') {
  window.Validators = Validators;
}