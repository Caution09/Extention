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
    'ラブライブ！虹ヶ咲学園スクールアイドル同好会': '女性',
    'リコリスリコイル': '女性',
    'リトルバスターズ!': '混合',
    'ルパン三世': '混合',
    'ワンピース': '混合',
    'ヴァイオレット・エヴァーガーデン': '女性',
    'ヴァンパイア': '混合',
    'ヴァンパイア(格ゲー)': '混合'
}

# 混合作品の個別性別判定
mixed_characters = {
    # リトルバスターズ!
    '棗鈴': '女性',
    '三枝葉留佳': '女性',
    '能美クドリャフカ': '女性',
    '西園美魚': '女性',
    '来ヶ谷唯湖': '女性',
    '直枝理樹': '男性',
    '井ノ原真人': '男性',
    '宮沢謙吾': '男性',
    
    # ルパン三世
    '峰不二子': '女性',
    'ルパン三世': '男性',
    '次元大介': '男性',
    '石川五ェ門': '男性',
    '銭形警部': '男性',
    
    # ワンピース
    'ナミ': '女性',
    'ロビン': '女性',
    'ハンコック': '女性',
    'ペローナ': '女性',
    'たしぎ': '女性',
    'ルフィ': '男性',
    'ゾロ': '男性',
    'サンジ': '男性',
    'ウソップ': '男性',
    'チョッパー': '人外',
    
    # ヴァンパイア(格ゲー)
    'モリガン': '女性',
    'リリス': '女性',
    'フェリシア': '女性',
    'レイレイ': '女性',
    'デミトリ': '男性',
    'ビシャモン': '男性'
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
                        new_line = line.replace('キャラクター\t', f'キャラクター({classification})\t')
                        new_lines.append(new_line)
                        converted_count += 1
                        print(f"変換: {character} ({classification})")
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