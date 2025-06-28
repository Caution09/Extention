#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re

def is_mostly_english(text):
    """テキストが主に英語かどうかを判定"""
    if not text:
        return False
    
    # 英語以外の文字（日本語、記号など）を除去
    english_chars = re.sub(r'[^a-zA-Z\s]', '', text)
    # 全体の文字数
    total_chars = re.sub(r'\s', '', text)
    
    if len(total_chars) == 0:
        return False
    
    # 英語の文字が50%以上で、かつ3文字以上の場合
    return len(english_chars.replace(' ', '')) / len(total_chars) > 0.5 and len(total_chars) >= 3

def main():
    try:
        # マスターデータを読み込み
        with open('マスターデータ.tsv', 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        english_items = []
        
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
                
                # 小項目とPromptが両方とも英語の場合
                if is_mostly_english(小項目) and is_mostly_english(prompt):
                    english_items.append({
                        'line_num': line_num,
                        '大項目': 大項目,
                        '中項目': 中項目,
                        '小項目': 小項目,
                        'prompt': prompt,
                        'full_line': line
                    })
        
        print(f"小項目とPromptが両方とも英語の項目: {len(english_items)}個")
        print()
        
        if english_items:
            print("翻訳が必要な項目:")
            for i, item in enumerate(english_items[:50]):  # 最初の50個を表示
                print(f"{i+1:3d}. {item['大項目']}\t{item['中項目']}\t{item['小項目']}\t{item['prompt']}")
            
            if len(english_items) > 50:
                print(f"... および他{len(english_items) - 50}個")
        
        # 翻訳が必要な項目をファイルに出力
        if english_items:
            with open('english_items_to_translate.tsv', 'w', encoding='utf-8') as f:
                for item in english_items:
                    f.write(item['full_line'] + '\n')
            print(f"\n翻訳対象項目をenglish_items_to_translate.tsvに出力しました")
        
    except Exception as e:
        print(f"エラーが発生しました: {e}")

if __name__ == "__main__":
    main()