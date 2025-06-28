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
    'サクラ大戦3': '女性',
    'サノバウィッチ': '女性',
    'シャニマス': '女性',
    'シュタインズゲート': '混合',
    'ジャヒー様はくじけない！': '女性',
    'スプラトゥーン': '混合',
    'セーラームーン': '女性',
    'ゼノブレイド': '混合'
}

# 混合作品の個別性別判定
mixed_characters = {
    # シュタインズゲート
    '牧瀬紅莉栖': '女性',
    '椎名まゆり': '女性',
    '阿万音鈴羽': '女性',
    '漆原るか': '女性',
    '桐生萌郁': '女性',
    'フェイリス': '女性',
    '岡部倫太郎': '男性',
    '橋田至': '男性',
    
    # スプラトゥーン
    'イカちゃん': '女性',
    'アオリ': '女性',
    'ホタル': '女性',
    'フウカ': '女性',
    'ウツホ': '女性',
    'マンタロー': '男性',
    
    # ゼノブレイド
    'ホムラ': '女性',
    'ヒカリ': '女性',
    'ニア': '女性',
    'パイラ': '女性',
    'レックス': '男性',
    'ジーク': '男性'
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
                # 混合作品は個別判定
                if character in mixed_characters:
                    gender = mixed_characters[character]
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