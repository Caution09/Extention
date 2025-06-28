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
    'トゥハート2': '女性',
    'ドラゴンズドグマ': '混合',
    'ナースウィッチ小麦ちゃんマジカルて': '女性',
    'ノーゲーム・ノーライフ': '混合',
    'ハヤテのごとく！': '混合',
    'ブルーアーカイブ': '女性',
    'プリコネ': '女性',
    'ホロライブ': '女性'
}

# 混合作品の個別性別判定
mixed_characters = {
    # ドラゴンズドグマ
    'ポーン': '混合',  # プレイヤーが作成するキャラ
    
    # ノーゲーム・ノーライフ
    '白': '女性',
    'ステファニー': '女性',
    'ジブリール': '女性',
    '空': '男性',
    
    # ハヤテのごとく！
    '三千院ナギ': '女性',
    '桂ヒナギク': '女性',
    'マリア': '女性',
    '愛沢咲夜': '女性',
    'ハヤテ': '男性'
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
                    if classification == '混合':
                        # 性別不明・可変の場合はデフォルト女性
                        gender = '女性'
                        new_line = line.replace('キャラクター\t', f'キャラクター({gender})\t')
                        new_lines.append(new_line)
                        converted_count += 1
                        print(f"変換: {character} ({gender}) [性別可変・デフォルト]")
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