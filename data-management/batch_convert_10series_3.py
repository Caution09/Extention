#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('マスターデータ.tsv', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
converted_count = 0

# 次の10作品の性別振り分け設定
series_gender = {
    'その他': 'スキップ',  # その他はスキップ
    'ひぐらしのなく頃に': '混合',
    'ひだまりスケッチ': '女性',
    'ふしぎの海のナディア': '女性',
    'ぼっち・ざ・ろっく！': '女性',
    'まちカドまぞく': '女性',
    'ゆるゆり': '女性',
    'ゆるキャン': '女性',
    'よつばと！': '女性',
    'らき☆すた': '女性'
}

# ひぐらしのなく頃にの個別性別判定
higurashi_characters = {
    '北条沙都子': '女性',
    '古手梨花': '女性',
    '園崎詩音': '女性',
    '園崎魅音': '女性',
    '竜宮レナ': '女性',
    '前原圭一': '男性'
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
            elif series_gender[series] == '混合':
                # ひぐらしは個別判定
                if character in higurashi_characters:
                    gender = higurashi_characters[character]
                    new_line = line.replace('キャラクター\t', f'キャラクター({gender})\t')
                    new_lines.append(new_line)
                    converted_count += 1
                    print(f"変換: {character} ({gender})")
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