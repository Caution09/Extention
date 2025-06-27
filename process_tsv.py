#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import csv
import re
import sys

def determine_gender(title, prompt):
    """キャラクターの性別を判定"""
    # 女性キャラクターのパターン
    female_patterns = [
        r'girl', r'female', r'woman', r'lady', r'loli', r'waifu',
        r'breasts', r'dress', r'skirt', r'bikini', r'maid',
        r'プリキュア', r'少女', r'女性', r'魔法少女', r'姫',
        r'アカメ', r'観鈴', r'友利奈緒', r'イシュタル', r'イリヤ',
        r'マシュ', r'凛', r'清姫', r'ミカヤ', r'キュア'
    ]
    
    # 男性キャラクターのパターン
    male_patterns = [
        r'boy', r'male', r'man', r'guy', r'masculine',
        r'少年', r'男性', r'男の子',
        r'アストルフォ', r'tomboy'  # アストルフォは男性キャラクター
    ]
    
    # 人外のパターン
    non_human_patterns = [
        r'no humans', r'robot', r'machine', r'android', r'crewmate',
        r'人外', r'ロボット', r'機械'
    ]
    
    combined_text = (title + " " + prompt).lower()
    
    # まず人外かチェック
    for pattern in non_human_patterns:
        if re.search(pattern, combined_text):
            return "人外"
    
    # 男性パターンチェック
    for pattern in male_patterns:
        if re.search(pattern, combined_text):
            # アストルフォは例外的に男性として扱う
            if 'アストルフォ' in title or 'astolfo' in combined_text:
                return "男性"
            # tomboyは女性
            if 'tomboy' in combined_text and not 'アストルフォ' in title:
                return "女性"
            return "男性"
    
    # 女性パターンチェック
    for pattern in female_patterns:
        if re.search(pattern, combined_text):
            return "女性"
    
    # デフォルトは無性
    return "無性"

def extract_character_name(prompt):
    """プロンプトからキャラクター名を抽出して簡略化"""
    # {{{{}}}} で囲まれた部分を探す
    match = re.search(r'\{\{+([^}]+)\}\}+', prompt)
    if match:
        # 括弧内の情報を削除
        char_name = re.sub(r'\s*\([^)]+\)\s*', '', match.group(1))
        return char_name.strip()
    
    # なければ最初のカンマまでの部分
    parts = prompt.split(',')
    if parts:
        return parts[0].strip()
    
    return prompt

def process_tsv(input_file, output_file):
    """TSVファイルを処理"""
    non_character_rows = []
    character_rows = []
    
    # ファイルを読み込む
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter='\t')
        for row in reader:
            if len(row) >= 4:
                category = row[0]
                title = row[1]
                subtitle = row[2]
                prompt = row[3]
                
                if category == 'キャラクター':
                    # キャラクター再現版（オリジナル）
                    character_rows.append(['キャラクター再現', title, subtitle, prompt])
                    
                    # 通常版（簡略化）
                    simplified_name = extract_character_name(prompt)
                    character_rows.append(['キャラクター', title, subtitle, simplified_name])
                else:
                    # キャラクター以外はそのまま
                    non_character_rows.append(row)
            else:
                # 4列未満の行もそのまま保持
                non_character_rows.append(row)
    
    # キャラクター行のみソート（再現版→通常版の順、その後タイトルとサブタイトルでソート）
    def sort_key(row):
        category = row[0]
        order = 0 if category == 'キャラクター再現' else 1
        return (order, row[1], row[2])
    
    character_rows.sort(key=sort_key)
    
    # 非キャラクター行 → キャラクター行の順で結合
    all_rows = non_character_rows + character_rows
    
    # ファイルに書き込む
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f, delimiter='\t')
        writer.writerows(all_rows)

if __name__ == '__main__':
    input_file = '/mnt/e/Project/Extension/Prompt/非整形マスター.tsv'
    output_file = '/mnt/e/Project/Extension/Prompt/非整形マスター_編集済み.tsv'
    
    process_tsv(input_file, output_file)
    print(f"処理完了: {output_file}")