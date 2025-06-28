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
    'キラッとプリ☆チャン': '女性',
    'キルミーベイベー': '女性',
    'ギャラクシーエンジェル': '女性',
    'ギルティギア': '混合',
    'グランブルーファンタジー': '混合',
    'ゲゲゲの鬼太郎': '混合',
    'コードギアス': '混合',
    'サクラ大戦': '女性'
}

# 混合作品の個別性別判定
mixed_characters = {
    # ギルティギア
    'ディズィー': '女性',
    'ジャック・オー': '女性',
    'ミリア': '女性',
    'メイ': '女性',
    'ソル': '男性',
    'カイ': '男性',
    
    # グランブルーファンタジー
    'ジータ': '女性',
    'カタリナ': '女性',
    'ルリア': '女性',
    'イオ': '女性',
    'ロゼッタ': '女性',
    'ヴィーラ': '女性',
    'ナルメア': '女性',
    'グラン': '男性',
    'ランスロット': '男性',
    'パーシヴァル': '男性',
    
    # ゲゲゲの鬼太郎
    '鬼太郎': '男性',
    '目玉おやじ': '男性',
    'ねずみ男': '男性',
    'ねこ娘': '女性',
    '砂かけばばあ': '女性',
    
    # コードギアス
    'C.C.': '女性',
    'ユーフェミア': '女性',
    'コーネリア': '女性',
    'カレン': '女性',
    'シャーリー': '女性',
    'ミレイ': '女性',
    'ルルーシュ': '男性',
    'スザク': '男性',
    'ロロ': '男性'
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