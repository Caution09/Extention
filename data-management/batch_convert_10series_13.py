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
    '三國無双': '混合',
    '不思議の国のアリス': '女性',
    '中二病でも恋がしたい！': '混合',
    '侵略！イカ娘': '女性',
    '俺の妹がこんなに可愛いわけがない': '女性',
    '同級生シリーズ': '女性',
    '呪術廻戦': '混合',
    '咲': '女性'
}

# 混合作品の個別性別判定
mixed_characters = {
    # 三國無双
    '甄姫': '女性',
    '王元姫': '女性',
    '大喬': '女性',
    '小喬': '女性',
    '貂蝉': '女性',
    '孫尚香': '女性',
    '呂布': '男性',
    '関羽': '男性',
    '張飛': '男性',
    '趙雲': '男性',
    '劉備': '男性',
    '曹操': '男性',
    
    # 中二病でも恋がしたい！
    '小鳥遊六花': '女性',
    '丹生谷森夏': '女性',
    '五月七日くみん': '女性',
    '富樫勇太': '男性',
    
    # 呪術廻戦
    '釘崎野薔薇': '女性',
    '禪院真希': '女性',
    '家入硝子': '女性',
    '五条悟': '男性',
    '虎杖悠仁': '男性',
    '伏黒恵': '男性',
    '両面宿儺': '男性'
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