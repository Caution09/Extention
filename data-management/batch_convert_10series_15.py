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
    '東方': '女性',  # 大部分が女性
    '涼宮ハルヒの憂鬱': '混合',
    '灼眼のシャナ': '混合',
    '無職転生': '混合',
    '物語シリーズ': '混合',
    '犬夜叉': '混合',
    '狼と香辛料': '混合',
    '私に天使が舞い降りた！': '女性'
}

# 混合作品の個別性別判定
mixed_characters = {
    # 涼宮ハルヒの憂鬱
    '涼宮ハルヒ': '女性',
    '長門有希': '女性',
    '朝比奈みくる': '女性',
    'キョン': '男性',
    '古泉一樹': '男性',
    
    # 灼眼のシャナ
    'シャナ': '女性',
    '吉田一美': '女性',
    '坂井悠二': '男性',
    
    # 無職転生
    'ロキシー': '女性',
    'シルフィエット': '女性',
    'エリス': '女性',
    'ルーデウス': '男性',
    
    # 物語シリーズ
    '戦場ヶ原ひたぎ': '女性',
    '八九寺真宵': '女性',
    '神原駿河': '女性',
    '千石撫子': '女性',
    '羽川翼': '女性',
    '忍野忍': '女性',
    '阿良々木暦': '男性',
    
    # 犬夜叉
    '日暮かごめ': '女性',
    '桔梗': '女性',
    'サンゴ': '女性',
    '犬夜叉': '男性',
    '弥勒': '男性',
    '殺生丸': '男性',
    
    # 狼と香辛料
    'ホロ': '女性',
    'クラフト・ロレンス': '男性'
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