#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('マスターデータ.tsv', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
converted_count = 0

# 次の10作品の性別振り分け設定
series_gender = {
    'その他': 'スキップ',  # その他はスキップ
    'イレーナ魔女の旅立ち': '女性',
    'ウマ娘': '女性',
    'ウルトラマン': '混合',
    'エロマンガ先生': '女性',
    'オーディンスフィア': '女性',
    'オーバーウォッチ': '混合',
    'カードキャプターさくら': '女性',
    'ガールズ＆パンツァー': '女性',
    'キボウノチカラ～オトナプリキュア\'23～': '女性'
}

# 混合作品の個別性別判定
mixed_characters = {
    # ウルトラマン
    'ウルトラマン': '男性',
    'ウルトラセブン': '男性',
    'ウルトラマンティガ': '男性',
    
    # オーバーウォッチ
    'トレーサー': '女性',
    'ウィドウメーカー': '女性',
    'メルシー': '女性',
    'D.Va': '女性',
    'ファラ': '女性',
    'ソンブラ': '女性',
    'アッシュ': '女性',
    'ゲンジ': '男性',
    'マクリー': '男性',
    'ハンゾー': '男性',
    'リーパー': '男性',
    'ソルジャー76': '男性'
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