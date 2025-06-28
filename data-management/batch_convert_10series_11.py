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
    'ボイスロイド': '女性',  # 大部分が女性
    'ボーカロイド': '混合',
    'ポケモン': '混合',
    'マリオブラザーズ': '混合',
    'メイドインアビス': '混合',
    'ラブライブ！': '女性',
    'ラブライブ！サンシャイン！！': '女性',
    'ラブライブ！スーパースター!!': '女性'
}

# 混合作品の個別性別判定
mixed_characters = {
    # ボーカロイド
    '初音ミク': '女性',
    '鏡音リン': '女性',
    '鏡音レン': '男性',
    '巡音ルカ': '女性',
    'MEIKO': '女性',
    'KAITO': '男性',
    'がくぽ': '男性',
    
    # ポケモン
    'エリカ': '女性',
    'カスミ': '女性',
    'サトシ': '男性',
    'ピカチュウ': '人外',
    'イーブイ': '人外',
    
    # マリオブラザーズ
    'ピーチ姫': '女性',
    'デイジー姫': '女性',
    'ロゼッタ': '女性',
    'マリオ': '男性',
    'ルイージ': '男性',
    'クッパ': '男性',
    'ヨッシー': '人外',
    
    # メイドインアビス
    'リコ': '女性',
    'ナナチ': '人外',  # 性別不明の元人間
    'レグ': '男性'
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