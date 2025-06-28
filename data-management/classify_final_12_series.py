#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# 最終12作品の性別分類
with open('マスターデータ.tsv', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
converted_count = 0

# 12作品の性別設定
series_classifications = {
    'キボウノチカラ～オトナプリキュア\'23～': '女性',
    '艦隊これくしょん': '女性',
    '苺ましまろ': '女性',
    '蒼の彼方のフォーリズム': '混合',
    '藍より青し': '女性',
    '謎の彼女X': '混合',
    '進撃の巨人': '混合',
    '遊戯王': '混合',
    '電波女と青春男': '混合',
    '青の祓魔師': '混合',
    '鬼滅の刃': '混合',
    '魔法少女まどか☆マギカ': '女性'
}

# 混合作品の個別キャラクター設定
mixed_characters = {
    # 蒼の彼方のフォーリズム
    '倉科明日香': '女性',
    '有坂真白': '女性',
    '市ノ瀬莉佳': '女性',
    '鳶沢みさき': '女性',
    '日向晶也': '男性',
    
    # 謎の彼女X
    '卜部美琴': '女性',
    '椿亮': '男性',
    
    # 進撃の巨人
    'ミカサ・アッカーマン': '女性',
    'アニ・レオンハート': '女性',
    'サシャ・ブラウス': '女性',
    'ヒストリア・レイス': '女性',
    'エレン・イェーガー': '男性',
    'アルミン・アルレルト': '男性',
    'リヴァイ': '男性',
    'エルヴィン': '男性',
    
    # 遊戯王
    'ブラック・マジシャン・ガール': '女性',
    'サイレント・マジシャン': '女性',
    'ハーピィ・レディ': '女性',
    '天使族': '女性',
    'エレキッズ': '女性',
    'マジシャンズ・ヴァルキリア': '女性',
    'アマゾネス': '女性',
    'ヴァルキリア': '女性',
    'アレクシス・ローズ': '女性',
    'アスカ': '女性',
    'エレメンタルヒーロー': '女性',
    'ローズ・ウィッチ': '女性',
    'マジック・シリンダー': '女性',
    'ドラゴンメイド': '女性',
    'トリックスター': '女性',
    'スカイストライカー': '女性',
    '閃刀姫': '女性',
    '閃刀姫レイ': '女性',
    '閃刀姫カガリ': '女性',
    '閃刀姫ロゼ': '女性',
    'アルカナフォース': '女性',
    'リリカル・ルスキニア': '女性',
    'ガガガ・ガール': '女性',
    'マドルチェ': '女性',
    'マドルチェ・プディンセス': '女性',
    'マドルチェ・アンジェリー': '女性',
    '森の聖獣': '女性',
    '予言者': '女性',
    '十代': '男性',
    '遊戯': '男性',
    '海馬': '男性',
    
    # 電波女と青春男
    '藤和エリオ': '女性',
    '前川さん': '女性',
    '丹羽真': '男性',
    
    # 青の祓魔師
    '杜山しえみ': '女性',
    '神木出雲': '女性',
    '奥村燐': '男性',
    '奥村雪男': '男性',
    
    # 鬼滅の刃
    '竈門禰豆子': '女性',
    '胡蝶しのぶ': '女性',
    '甘露寺蜜璃': '女性',
    '珠世': '女性',
    '栗花落カナヲ': '女性',
    '竈門炭治郎': '男性',
    '我妻善逸': '男性',
    '嘴平伊之助': '男性',
    '冨岡義勇': '男性',
    '煉獄杏寿郎': '男性'
}

for line in lines:
    parts = line.strip().split('\t')
    
    if len(parts) >= 3 and line.startswith('キャラクター\t'):
        series = parts[1]
        character = parts[2]
        
        if series in series_classifications:
            classification_type = series_classifications[series]
            
            if classification_type == '混合':
                # 個別設定チェック
                if character in mixed_characters:
                    gender = mixed_characters[character]
                else:
                    gender = '女性'  # デフォルト
                    
                new_line = line.replace('キャラクター\t', f'キャラクター({gender})\t')
                new_lines.append(new_line)
                converted_count += 1
                print(f"変換: {character} ({gender})")
                
            else:
                # 一律分類
                new_line = line.replace('キャラクター\t', f'キャラクター({classification_type})\t')
                new_lines.append(new_line)
                converted_count += 1
                print(f"変換: {character} ({classification_type})")
        else:
            new_lines.append(line)
    else:
        new_lines.append(line)

with open('マスターデータ.tsv', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"\n最終12作品性別分類完了: {converted_count}名")