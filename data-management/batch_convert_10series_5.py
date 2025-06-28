#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('マスターデータ.tsv', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
converted_count = 0

# 次の10作品の性別振り分け設定
series_gender = {
    'その他': 'スキップ',  # その他はスキップ
    'アクセルワールド': '混合',
    'アサルトリリィ': '女性',
    'アスタロッテのおもちゃ!': '女性',
    'アズールレーン': '女性',
    'アトリエ': '女性',
    'アトリエシリーズ': '女性',
    'アマガミ': '女性',
    'アークナイツ': '混合',
    'イジらないで、長瀞さん': '女性'
}

# 混合作品の個別性別判定
mixed_characters = {
    # アクセルワールド
    '黒雪姫': '女性',
    '倉嶋千百合': '女性',
    '上月由仁子': '女性',
    '有田春雪': '男性',
    
    # アークナイツ
    'アーミヤ': '女性',
    'チェン': '女性',
    'エクシア': '女性',
    'テキサス': '女性',
    'シルバーアッシュ': '男性',
    'ドクター': '混合'  # 性別不明なのでデフォルト女性
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
                    if mixed_characters[character] == '混合':
                        # 性別不明の場合はデフォルト女性
                        gender = '女性'
                        new_line = line.replace('キャラクター\t', f'キャラクター({gender})\t')
                        new_lines.append(new_line)
                        converted_count += 1
                        print(f"変換: {character} ({gender}) [性別不明・デフォルト]")
                    else:
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