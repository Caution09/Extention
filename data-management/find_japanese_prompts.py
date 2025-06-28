#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re

def is_mostly_japanese(text):
    """テキストが主に日本語（ひらがな、カタカナ、漢字）かどうかを判定"""
    if not text:
        return False
    
    # 日本語文字（ひらがな、カタカナ、漢字）をカウント
    japanese_chars = re.findall(r'[ひらがなカタカナ一-龯]', text)
    # 全体の文字数（スペースを除く）
    total_chars = re.sub(r'\s', '', text)
    
    if len(total_chars) == 0:
        return False
    
    # 日本語の文字が50%以上で、かつ2文字以上の場合
    return len(japanese_chars) / len(total_chars) > 0.5 and len(total_chars) >= 2

def main():
    try:
        # マスターデータを読み込み
        with open('マスターデータ.tsv', 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        japanese_prompt_items = []
        
        for line_num, line in enumerate(lines, 1):
            line = line.strip()
            if not line:
                continue
                
            parts = line.split('\t')
            if len(parts) >= 4:
                大項目 = parts[0]
                中項目 = parts[1]
                小項目 = parts[2]
                prompt = parts[3]
                
                # 小項目とPromptが両方とも日本語の場合
                if is_mostly_japanese(小項目) and is_mostly_japanese(prompt):
                    japanese_prompt_items.append({
                        'line_num': line_num,
                        '大項目': 大項目,
                        '中項目': 中項目,
                        '小項目': 小項目,
                        'prompt': prompt,
                        'full_line': line
                    })
        
        print(f"小項目とPromptが両方とも日本語の項目: {len(japanese_prompt_items)}個")
        print()
        
        if japanese_prompt_items:
            print("Promptを英語に修正が必要な項目:")
            for i, item in enumerate(japanese_prompt_items[:50]):  # 最初の50個を表示
                print(f"{i+1:3d}. {item['大項目']}\t{item['中項目']}\t{item['小項目']}\t{item['prompt']}")
            
            if len(japanese_prompt_items) > 50:
                print(f"... および他{len(japanese_prompt_items) - 50}個")
        
        # Prompt修正が必要な項目をファイルに出力
        if japanese_prompt_items:
            with open('japanese_prompt_items_to_fix.tsv', 'w', encoding='utf-8') as f:
                for item in japanese_prompt_items:
                    f.write(item['full_line'] + '\n')
            print(f"\nPrompt修正対象項目をjapanese_prompt_items_to_fix.tsvに出力しました")
        
    except Exception as e:
        print(f"エラーが発生しました: {e}")

if __name__ == "__main__":
    main()