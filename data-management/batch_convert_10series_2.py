#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('マスターデータ.tsv', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
converted_count = 0

# 次の10作品の性別振り分け設定
series_gender = {
    'けものの★': '女性',
    'けものフレンズ': '女性',
    'この素晴らしい世界に祝福を': '混合',
    'ごちうさ': '女性',
    'すーぱーそに子': '女性',
    'その他': 'スキップ',  # その他はスキップ
    'とあるシリーズ': '混合',
    'とある科学の超電磁砲': '女性',
    'にじさんじ': '混合',
    'のんのんびより': '女性'
}

# 混合作品の個別性別判定
mixed_characters = {
    # この素晴らしい世界に祝福を
    'アクア（この素晴らしい世界に祝福を）': '女性',
    'めぐみん': '女性',
    'ダクネス': '女性',
    'カズマ': '男性',
    'サトウカズマ': '男性',
    
    # とあるシリーズ
    '御坂美琴': '女性',
    '食蜂操祈': '女性',
    '上条当麻': '男性',
    '一方通行': '男性',
    
    # にじさんじ（VTuber - 個別判定が必要）
    '月ノ美兎': '女性',
    '樋口楓': '女性',
    '静凛': '女性',
    '鈴谷アキ': '女性',
    'モイラ': '女性',
    '家長むぎ': '女性',
    'える': '女性',
    '本間ひまわり': '女性',
    '叶': '男性',
    '葛葉': '男性'
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