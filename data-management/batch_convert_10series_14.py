#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('マスターデータ.tsv', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
converted_count = 0

# 次の10作品の性別振り分け設定
series_gender = {
    'その他': 'スキップ',  # その他はスキップ
    'キボウノチカラ～オトナプリキュア\'23～': '女性',
    '宇崎ちゃんは遊びたい！': '女性',
    '小林さんちのメイドラゴン': '女性',
    '怪談': '混合',
    '推しの子': '混合',
    '新世紀エヴァンゲリオン': '混合',
    '日常': '女性',
    '星のカービィ': '人外',
    '月姫': '混合'
}

# 混合作品の個別性別判定
mixed_characters = {
    # 推しの子
    '星野アイ': '女性',
    '有馬かな': '女性',
    'MEMちょ': '女性',
    '黒川あかね': '女性',
    '星野アクア': '男性',
    '星野ルビー': '女性',
    
    # 新世紀エヴァンゲリオン
    '綾波レイ': '女性',
    '惣流・アスカ・ラングレー': '女性',
    '葛城ミサト': '女性',
    '赤木リツコ': '女性',
    '碇シンジ': '男性',
    '碇ゲンドウ': '男性',
    '渚カヲル': '男性',
    
    # 月姫
    'アルクェイド': '女性',
    '翡翠': '女性',
    '琥珀': '女性',
    '遠野秋葉': '女性',
    'シエル': '女性',
    '遠野志貴': '男性'
}

for line in lines:
    parts = line.strip().split('\t')
    
    if len(parts) >= 3 and line.startswith('キャラクター\t'):
        series = parts[1]
        character = parts[2]
        
        if series in series_gender:
            if series_gender[series] == 'スキップ':
                # その他はスキップ
                new_lines.append(line)
            elif series_gender[series] == '人外':
                # 星のカービィは人外
                new_line = line.replace('キャラクター\t', f'キャラクター(人外)\t')
                new_lines.append(new_line)
                converted_count += 1
                print(f"変換: {character} (人外)")
            elif series_gender[series] == '混合':
                # 混合作品は個別判定
                if character in mixed_characters:
                    classification = mixed_characters[character]
                    new_line = line.replace('キャラクター\t', f'キャラクター({classification})\t')
                    new_lines.append(new_line)
                    converted_count += 1
                    print(f"変換: {character} ({classification})")
                else:
                    # 個別設定がない場合はデフォルト女性
                    gender = '女性'
                    new_line = line.replace('キャラクター\t', f'キャラクター({gender})\t')
                    new_lines.append(new_line)
                    converted_count += 1
                    print(f"変換: {character} ({gender}) [デフォルト]")
            else:
                # 一律性別設定
                gender = series_gender[series]
                new_line = line.replace('キャラクター\t', f'キャラクター({gender})\t')
                new_lines.append(new_line)
                converted_count += 1
                print(f"変換: {character} ({gender})")
        else:
            new_lines.append(line)
    else:
        new_lines.append(line)

with open('マスターデータ.tsv', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"\n次の10作品一括変換完了: {converted_count}名")