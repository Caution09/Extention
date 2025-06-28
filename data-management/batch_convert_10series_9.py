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
    'ゼルダの伝説シリーズ': '混合',
    'ゼロの使い魔': '女性',
    'ソウルキャリパー': '混合',
    'ソードアート・オンライン': '混合',
    'ダンガンロンパ': '混合',
    'チェンソーマン': '混合',
    'ディノクライシス': '女性',
    'トゥハート': '女性'
}

# 混合作品の個別性別判定
mixed_characters = {
    # ゼルダの伝説シリーズ
    'インパ': '女性',
    'ウルボサ': '女性',
    'コロク': '人外',  # 森の精霊的存在
    'ゼルダ': '女性',
    'ミドナ': '女性',
    'リンク': '男性',
    'ガノンドロフ': '男性',
    
    # ソウルキャリパー
    'タキ': '女性',
    'ソフィーティア': '女性',
    'カサンドラ': '女性',
    'セルヴァンテス': '男性',
    'ナイトメア': '人外',  # 魔剣
    
    # ソードアート・オンライン
    'アスナ': '女性',
    'シノン': '女性',
    'リーファ': '女性',
    'シリカ': '女性',
    'リズベット': '女性',
    'キリト': '男性',
    'クライン': '男性',
    'ユウキ': '女性',
    
    # ダンガンロンパ
    '江ノ島盾子': '女性',
    '霧切響子': '女性',
    '舞園さやか': '女性',
    '苗木誠': '男性',
    '十神白夜': '男性',
    'モノクマ': '人外',  # ロボット
    
    # チェンソーマン
    'マキマ': '女性',
    'パワー': '女性',
    'レゼ': '女性',
    'コベニ': '女性',
    'デンジ': '男性',
    'アキ': '男性',
    'ポチタ': '人外'  # 悪魔
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
                    if classification == '人外':
                        # 人外は大項目を変更
                        new_line = line.replace('キャラクター\t', '人外\t')
                        new_lines.append(new_line)
                        converted_count += 1
                        print(f"変換: {character} (人外)")
                    else:
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