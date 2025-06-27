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

def extract_character_name(prompt, subtitle=""):
    """プロンプトからキャラクター名を抽出して簡略化"""
    
    # 除外すべきパターンのリスト（身体的特徴、表情、作品名等）
    exclude_patterns = [
        # 目の形状・表情
        r'^(tareme|tsurime|jitome|wide-eyed)$',
        # 体型・髪型
        r'^(slender|active|blur|messy|twintail)$',
        # 色・素材
        r'^(whitesmokehair|leopard|black\s+corset)$',
        # 作品名
        r'^(idolmaster|cinderella\s+girls|shiny\s+colors|million\s+live).*',
        r'^(no\s+game\s+no\s+life|mahou\s+shoujo\s+madoka\s+magica).*',
        r'^(styles\s+of\s+idolmaster|super\s+sailor).*',
        # 色の名前
        r'^(dark\s+blue\s+hair|green\s+hair|yellow\s+horn\s+hair).*',
        # その他の特徴
        r'^(yadokari|frizzy\s+long\s+hair|spiked\s+hair).*',
        # 組み合わせパターン
        r'.*v-shaped.*eyebrows.*',
        r'.*bald\s+hair.*',
        r'.*,.*2010s.*'
    ]
    
    def is_excluded(text):
        """テキストが除外パターンに該当するかチェック"""
        for pattern in exclude_patterns:
            if re.search(pattern, text.lower().strip()):
                return True
        return False
    
    # まず {{{}}} で囲まれた部分を抽出
    matches = re.findall(r'\{\{+([^}]+)\}\}+', prompt)
    
    # {{{}}} がない場合、{} で囲まれた部分を確認
    if not matches:
        single_brace_matches = re.findall(r'\{([^}]+)\}', prompt)
        if single_brace_matches:
            character_candidates = []
            
            for brace_content in single_brace_matches:
                elements = [elem.strip() for elem in brace_content.split(',')]
                
                for elem in elements:
                    if not is_excluded(elem):
                        # 作品名っぽいものを除外
                        if not re.search(r'(hololive|live!|precure|fate|evangelion|gundam|touhou|kancolle|azur lane|fire emblem|final fantasy)', elem.lower()):
                            # 色や身体的特徴を除外
                            if not re.search(r'(hair|eyes|breasts|head|butterfly|short|small|green|red|blue|yellow|bun|purple|twintails|long|demon|tail|white|black|jacket|shorts|cap|navel)', elem.lower()):
                                if ' ' in elem:
                                    character_candidates.insert(0, elem)
                                else:
                                    character_candidates.append(elem)
            
            if character_candidates:
                return character_candidates[0]
    
    if matches:
        character_candidates = []
        
        for match in matches:
            candidate = match.strip()
            
            # 除外パターンチェック
            if is_excluded(candidate):
                continue
                
            # スペースで区切られた括弧のみ削除（アンダースコア+括弧は保持）
            if not re.search(r'_\([^)]+\)$', candidate):
                candidate = re.sub(r'\s+\([^)]+\)', '', candidate)
            candidate = candidate.strip()
            
            # 作品名っぽいものを除外
            if not re.search(r'(hololive|live!|precure|fate|evangelion|gundam|touhou|kancolle|azur lane|fire emblem|final fantasy|idolmaster|cinderella|genshin|impact)', candidate.lower()):
                # キャラクター名らしいパターンを優先
                if re.search(r'^[a-zA-Z\s_]+$', candidate) and ' ' in candidate:
                    # スペースを含む英語名（人名らしい）
                    character_candidates.insert(0, candidate)
                elif re.search(r'^[a-zA-Z_]+$', candidate) and '_' in candidate:
                    # アンダースコア区切りの英語名
                    character_candidates.insert(0, candidate)
                elif not re.search(r'(hair|eyes|breasts|head|butterfly|short|small|green|red|blue|yellow|bun|purple|twintails|long|demon|tail|white|black|jacket|shorts|cap|navel)', candidate.lower()):
                    character_candidates.append(candidate)
        
        if character_candidates:
            return character_candidates[0]
        
        # フィルター後に候補がない場合、元のプロンプトからsubtitleを使用
        if subtitle and not is_excluded(subtitle):
            # subtitleからローマ字名を生成（簡易版）
            subtitle_lower = subtitle.lower()
            if any(char in subtitle_lower for char in 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん'):
                # ひらがな・カタカナが含まれる場合は元のマッチから最も適切なものを選択
                for match in matches:
                    candidate = match.strip()
                    if not is_excluded(candidate):
                        if not re.search(r'_\([^)]+\)$', candidate):
                            candidate = re.sub(r'\s+\([^)]+\)', '', candidate)
                        return candidate.strip()
    
    # 波括弧がない場合、最初のカンマまでの部分
    parts = prompt.split(',')
    if parts:
        first_part = parts[0].strip()
        if not is_excluded(first_part):
            if not re.search(r'_\([^)]+\)$', first_part):
                first_part = re.sub(r'\s+\([^)]+\)', '', first_part)
            return first_part.strip()
    
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
                    simplified_name = extract_character_name(prompt, subtitle)
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