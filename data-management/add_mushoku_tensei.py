#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# 無職転生キャラクターを追加
new_characters = [
    "キャラクター(女性)\t無職転生\tシルフィエット\tsilfiette (mushoku tensei)",
    "キャラクター(女性)\t無職転生\tエリス\teris greyrat (mushoku tensei)", 
    "キャラクター(男性)\t無職転生\tルーデウス\trudeus greyrat (mushoku tensei)",
    "キャラクター(男性)\t無職転生\tルイジェルド\truijerd superdia (mushoku tensei)",
    "キャラクター(女性)\t無職転生\tギレーヌ\tghislaine dedoldia (mushoku tensei)",
    "キャラクター(女性)\t無職転生\tゼニス\tzenith greyrat (mushoku tensei)",
    "キャラクター(女性)\t無職転生\tリーリャ\tlilia greyrat (mushoku tensei)",
    "キャラクター(男性)\t無職転生\tパウロ\tpaul greyrat (mushoku tensei)",
    "キャラクター(女性)\t無職転生\tアイシャ\taisha greyrat (mushoku tensei)"
]

with open('マスターデータ.tsv', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 無職転生の最後の行を見つける
insert_position = -1
for i, line in enumerate(lines):
    if line.startswith('キャラクター(女性)\t無職転生\t'):
        insert_position = i + 1

if insert_position == -1:
    # 無職転生の項目が見つからない場合は最後に追加
    insert_position = len(lines)

# 新しいキャラクターを挿入
for i, new_char in enumerate(new_characters):
    lines.insert(insert_position + i, new_char + '\n')

with open('マスターデータ.tsv', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print(f"無職転生に{len(new_characters)}名のキャラクターを追加しました")
for char in new_characters:
    parts = char.split('\t')
    print(f"追加: {parts[2]} ({parts[0].replace('キャラクター(', '').replace(')', '')})")