#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('マスターデータ.tsv', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
converted_count = 0

# 10作品の性別振り分け設定
series_gender = {
    'あずまんが大王': '女性',
    'あの日見た花の名前を僕達はまだ知らない。': '女性',
    'うたわれるもの': '女性',
    'おしえて! ギャル子ちゃん': '女性',
    'おジャ魔女どれみ': '女性',
    'お兄ちゃんはおしまい!': '女性',
    'かぐや様は告らせたい': '混合',  # 混合なので個別判定
    'からかい上手の高木さん': '女性',
    'きんいろモザイク': '女性',
    'けいおん！': '女性'
}

# かぐや様キャラクターの個別性別判定
kaguya_characters = {
    '四宮かぐや': '女性',
    '藤原千花': '女性',
    '早坂愛': '女性',
    '白銀御行': '男性'
}

for line in lines:
    parts = line.strip().split('\t')
    
    if len(parts) >= 3 and line.startswith('キャラクター\t'):
        series = parts[1]
        character = parts[2]
        
        if series in series_gender:
            if series == 'かぐや様は告らせたい':
                # かぐや様は個別判定
                if character in kaguya_characters:
                    gender = kaguya_characters[character]
                    new_line = line.replace('キャラクター\t', f'キャラクター({gender})\t')
                    new_lines.append(new_line)
                    converted_count += 1
                    print(f"変換: {character} ({gender})")
                else:
                    new_lines.append(line)
            else:
                # その他は一律女性
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

print(f"\n10作品一括変換完了: {converted_count}名")