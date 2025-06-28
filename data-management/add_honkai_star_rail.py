#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# 崩壊スターレイルの人気キャラクターを追加
honkai_star_rail_characters = [
    # 女性キャラクター
    "キャラクター(女性)\t崩壊スターレイル\t銀狼\tsilver wolf (honkai: star rail)",
    "キャラクター(女性)\t崩壊スターレイル\tカフカ\tkafka (honkai: star rail)",
    "キャラクター(女性)\t崩壊スターレイル\t三月なのか\tmarch 7th (honkai: star rail)",
    "キャラクター(女性)\t崩壊スターレイル\t星\tstelle (honkai: star rail)",
    "キャラクター(女性)\t崩壊スターレイル\tヒメコ\thimeko (honkai: star rail)",
    "キャラクター(女性)\t崩壊スターレイル\tブローニャ\tbronya rand (honkai: star rail)",
    "キャラクター(女性)\t崩壊スターレイル\tゼーレ\tseele (honkai: star rail)",
    "キャラクター(女性)\t崩壊スターレイル\tクララ\tclara (honkai: star rail)",
    "キャラクター(女性)\t崩壊スターレイル\tナターシャ\tnatasha (honkai: star rail)",
    "キャラクター(女性)\t崩壊スターレイル\tペラ\tpela (honkai: star rail)",
    "キャラクター(女性)\t崩壊スターレイル\tセルバル\tserval (honkai: star rail)",
    "キャラクター(女性)\t崩壊スターレイル\tアスタ\tasta (honkai: star rail)",
    "キャラクター(女性)\t崩壊スターレイル\tヘルタ\therta (honkai: star rail)",
    "キャラクター(女性)\t崩壊スターレイル\t白露\tbailu (honkai: star rail)",
    "キャラクター(女性)\t崩壊スターレイル\t符玄\tfu xuan (honkai: star rail)",
    "キャラクター(女性)\t崩壊スターレイル\t銀枝\tyin zhi (honkai: star rail)",
    "キャラクター(女性)\t崩壊スターレイル\t停雲\ttingyun (honkai: star rail)",
    "キャラクター(女性)\t崩壊スターレイル\t青雀\tqingque (honkai: star rail)",
    "キャラクター(女性)\t崩壊スターレイル\t素裳\tsu shang (honkai: star rail)",
    "キャラクター(女性)\t崩壊スターレイル\t桂乃芬\tguinaifen (honkai: star rail)",
    "キャラクター(女性)\t崩壊スターレイル\tトパーズ\ttopaz (honkai: star rail)",
    "キャラクター(女性)\t崩壊スターレイル\tルアン・メェイ\truan mei (honkai: star rail)",
    "キャラクター(女性)\t崩壊スターレイル\tスパークル\tsparkle (honkai: star rail)",
    "キャラクター(女性)\t崩壊スターレイル\tブラックスワン\tblack swan (honkai: star rail)",
    "キャラクター(女性)\t崩壊スターレイル\tアケロン\tacheron (honkai: star rail)",
    
    # 男性キャラクター
    "キャラクター(男性)\t崩壊スターレイル\t穹\tcaelus (honkai: star rail)",
    "キャラクター(男性)\t崩壊スターレイル\tダン・ヘン\tdan heng (honkai: star rail)",
    "キャラクター(男性)\t崩壊スターレイル\tヴェルト\twelt (honkai: star rail)",
    "キャラクター(男性)\t崩壊スターレイル\tサンポ\tsampo (honkai: star rail)",
    "キャラクター(男性)\t崩壊スターレイル\tフック\thook (honkai: star rail)",
    "キャラクター(男性)\t崩壊スターレイル\tゲパルト\tgepard (honkai: star rail)",
    "キャラクター(男性)\t崩壊スターレイル\tアーラン\tarlan (honkai: star rail)",
    "キャラクター(男性)\t崩壊スターレイル\t景元\tjing yuan (honkai: star rail)",
    "キャラクター(男性)\t崩壊スターレイル\t刃\tblade (honkai: star rail)",
    "キャラクター(男性)\t崩壊スターレイル\tルカ\tluka (honkai: star rail)",
    "キャラクター(男性)\t崩壊スターレイル\t羅刹\tluocha (honkai: star rail)",
    "キャラクター(男性)\t崩壊スターレイル\tダン・ヘン・飲月\tdan heng imbibitor lunae (honkai: star rail)",
    "キャラクター(男性)\t崩壊スターレイル\tアベンチュリン\tadventurine (honkai: star rail)",
    "キャラクター(男性)\t崩壊スターレイル\tガラガー\tgallagher (honkai: star rail)",
    "キャラクター(男性)\t崩壊スターレイル\tブートヒル\tboothill (honkai: star rail)",
    "キャラクター(男性)\t崩壊スターレイル\t日曜\tsunday (honkai: star rail)"
]

with open('マスターデータ.tsv', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 適切な位置に挿入（キャラクター(女性)セクションの最後）
insert_position = len(lines)

# 新しいキャラクターを追加
for char in honkai_star_rail_characters:
    lines.append(char + '\n')

with open('マスターデータ.tsv', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print(f"崩壊スターレイルに{len(honkai_star_rail_characters)}名のキャラクターを追加しました")

# 性別別カウント
female_count = len([c for c in honkai_star_rail_characters if 'キャラクター(女性)' in c])
male_count = len([c for c in honkai_star_rail_characters if 'キャラクター(男性)' in c])

print(f"女性キャラクター: {female_count}名")
print(f"男性キャラクター: {male_count}名")

print("\n追加されたキャラクター:")
for char in honkai_star_rail_characters:
    parts = char.split('\t')
    gender = parts[0].replace('キャラクター(', '').replace(')', '')
    print(f"{parts[2]} ({gender})")