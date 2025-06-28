#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# 遊戯王の可愛い女の子モンスターを追加
new_yugioh_girls = [
    "キャラクター(女性)\t遊戯王\tブラック・マジシャン・ガール\tdark magician girl (yu-gi-oh!)",
    "キャラクター(女性)\t遊戯王\tサイレント・マジシャン\tsilent magician (yu-gi-oh!)",
    "キャラクター(女性)\t遊戯王\tハーピィ・レディ\tharpie lady (yu-gi-oh!)",
    "キャラクター(女性)\t遊戯王\t天使族\tangel (yu-gi-oh!)",
    "キャラクター(女性)\t遊戯王\tエレキッズ\telekids (yu-gi-oh!)",
    "キャラクター(女性)\t遊戯王\tマジシャンズ・ヴァルキリア\tmagician's valkyria (yu-gi-oh!)",
    "キャラクター(女性)\t遊戯王\tアマゾネス\tamazoness (yu-gi-oh!)",
    "キャラクター(女性)\t遊戯王\tヴァルキリア\tvalkyria (yu-gi-oh!)",
    "キャラクター(女性)\t遊戯王\tアレクシス・ローズ\talexis rhodes (yu-gi-oh!)",
    "キャラクター(男性)\t遊戯王\t十代\tjaden yuki (yu-gi-oh!)",
    "キャラクター(女性)\t遊戯王\tアスカ\tasuka (yu-gi-oh!)",
    "キャラクター(女性)\t遊戯王\tエレメンタルヒーロー\telemental hero (yu-gi-oh!)",
    "キャラクター(女性)\t遊戯王\tローズ・ウィッチ\trose witch (yu-gi-oh!)",
    "キャラクター(女性)\t遊戯王\tマジック・シリンダー\tmagic cylinder (yu-gi-oh!)",
    "キャラクター(女性)\t遊戯王\tドラゴンメイド\tdragonmaid (yu-gi-oh!)",
    "キャラクター(女性)\t遊戯王\tトリックスター\ttrickstar (yu-gi-oh!)",
    "キャラクター(女性)\t遊戯王\tスカイストライカー\tsky striker (yu-gi-oh!)",
    "キャラクター(女性)\t遊戯王\t閃刀姫\tsky striker ace (yu-gi-oh!)",
    "キャラクター(女性)\t遊戯王\t閃刀姫レイ\tsky striker ace - raye (yu-gi-oh!)",
    "キャラクター(女性)\t遊戯王\t閃刀姫カガリ\tsky striker ace - kagari (yu-gi-oh!)",
    "キャラクター(女性)\t遊戯王\t閃刀姫ロゼ\tsky striker ace - roze (yu-gi-oh!)",
    "キャラクター(女性)\t遊戯王\tアルカナフォース\tarcana force (yu-gi-oh!)",
    "キャラクター(女性)\t遊戯王\tリリカル・ルスキニア\tlyrical luscinia (yu-gi-oh!)",
    "キャラクター(女性)\t遊戯王\tガガガ・ガール\tgagaga girl (yu-gi-oh!)",
    "キャラクター(女性)\t遊戯王\tマドルチェ\tmadolche (yu-gi-oh!)",
    "キャラクター(女性)\t遊戯王\tマドルチェ・プディンセス\tmadolche puddingcess (yu-gi-oh!)",
    "キャラクター(女性)\t遊戯王\tマドルチェ・アンジェリー\tmadolche anjelly (yu-gi-oh!)",
    "キャラクター(女性)\t遊戯王\t森の聖獣\tforest sacred beast (yu-gi-oh!)",
    "キャラクター(女性)\t遊戯王\t予言者\tprophecy (yu-gi-oh!)"
]

with open('マスターデータ.tsv', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 遊戯王の最後の行を見つける
insert_position = -1
for i, line in enumerate(lines):
    if line.startswith('キャラクター(女性)\t遊戯王\t') or line.startswith('キャラクター(男性)\t遊戯王\t'):
        insert_position = i + 1

if insert_position == -1:
    # 遊戯王の項目が見つからない場合は適切な位置に挿入
    # キャラクター(女性)セクションの最後に追加
    for i, line in enumerate(lines):
        if line.startswith('キャラクター(女性)\t'):
            insert_position = i

# 新しいキャラクターを挿入
for i, new_char in enumerate(new_yugioh_girls):
    lines.insert(insert_position + i, new_char + '\n')

with open('マスターデータ.tsv', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print(f"遊戯王に{len(new_yugioh_girls)}名の女の子モンスターを追加しました")
for char in new_yugioh_girls:
    parts = char.split('\t')
    print(f"追加: {parts[2]}")