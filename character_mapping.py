#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import csv
import re

# 手動でキャラクター名をマッピング
character_name_mapping = {
    # アイドルマスター
    ('アイドルマスター', '三浦あずさ（ロングヘア）'): 'miura azusa',
    ('アイドルマスター', '我那覇響'): 'ganaha hibiki',
    ('アイドルマスター', '水瀬伊織'): 'minase iori',
    ('アイドルマスター', '秋月律子'): 'akizuki ritsuko',
    ('アイドルマスター', '萩原雪歩'): 'hagiwara yukiho',
    
    # アイドルマスター シャイニーカラーズ
    ('アイドルマスター シャイニーカラーズ', '八宮めぐる'): 'hachimiya meguru',
    ('アイドルマスター シャイニーカラーズ', '樋口円香'): 'higuchi madoka',
    ('アイドルマスター シャイニーカラーズ', '浅倉透'): 'asakura toru',
    ('アイドルマスター シャイニーカラーズ', '西城樹里'): 'saijou juri',
    ('アイドルマスター シャイニーカラーズ', '黛冬優子'): 'mayuzumi fuyuko',
    
    # アイドルマスターシンデレラガールズ
    ('アイドルマスターシンデレラガールズ', 'アナスタシア'): 'anastasia',
    ('アイドルマスターシンデレラガールズ', 'エミリー'): 'emily stewart',
    ('アイドルマスターシンデレラガールズ', 'ナターリア'): 'natalia',
    ('アイドルマスターシンデレラガールズ', '中谷育'): 'nakatani iku',
    ('アイドルマスターシンデレラガールズ', '伊吹翼'): 'ibuki tsubasa',
    ('アイドルマスターシンデレラガールズ', '佐城雪美'): 'sajo yukimi',
    ('アイドルマスターシンデレラガールズ', '佐藤心'): 'satou shin',
    ('アイドルマスターシンデレラガールズ', '北条加蓮'): 'houjou karen',
    ('アイドルマスターシンデレラガールズ', '千川ちひろ'): 'senkawa chihiro',
    ('アイドルマスターシンデレラガールズ', '双葉杏'): 'futaba anzu',
    ('アイドルマスターシンデレラガールズ', '向井拓海'): 'mukai takumi',
    ('アイドルマスターシンデレラガールズ', '周防桃子'): 'suou momoko',
    ('アイドルマスターシンデレラガールズ', '新田美波'): 'nitta minami',
    ('アイドルマスターシンデレラガールズ', '本田未央'): 'honda mio',
    ('アイドルマスターシンデレラガールズ', '的場梨沙'): 'matoba risa',
    ('アイドルマスターシンデレラガールズ', '神谷奈緒'): 'kamiya nao',
    ('アイドルマスターシンデレラガールズ', '福山舞'): 'fukuyama mai',
    ('アイドルマスターシンデレラガールズ', '遊佐こずえ'): 'yusa kozue',
    ('アイドルマスターシンデレラガールズ', '龍崎薫'): 'ryuzaki kaoru',
    
    # To LOVEる
    ('To LOVEる -とらぶる', 'ティアーユ・ルナティーク'): 'teayu lunatique',
    ('To LOVEる -とらぶる', 'ララ・サタリン・デビルーク'): 'lala satalin deviluke',
    ('To LOVEる -とらぶる', '天条院沙姫'): 'tenjouin saki',
    ('To LOVEる -とらぶる', '小手川唯'): 'kotegawa yui',
    ('To LOVEる -とらぶる', '金色の闇（ヤミ）'): 'konjiki no yami',
    
    # ぼっち・ざ・ろっく！
    ('ぼっち・ざ・ろっく！', '伊地知虹夏'): 'ijichi nijika',
    ('ぼっち・ざ・ろっく！', '後藤ひとり'): 'gotou hitori',
    
    # VOICE BOX
    ('VOICE BOX', 'ずんだもん'): 'zundamon',
    
    # ポケモン
    ('ポケモン', 'ヒカリ'): 'hikari (pokemon)',
    
    # ラブライブ！サンシャイン！！
    ('ラブライブ！サンシャイン！！', '鹿角理亞'): 'kazuno ria',
    
    # ラブライブ！スーパースター!!
    ('ラブライブ！スーパースター!!', 'ウィーン・マルガレーテ'): 'wien margarete',
    ('ラブライブ！スーパースター!!', '嵐 千砂都'): 'arashi chisato',
    ('ラブライブ！スーパースター!!', '平安名 すみれ'): 'heanna sumire',
    ('ラブライブ！スーパースター!!', '葉月 恋'): 'hazuki ren',
    
    # ラブライブ！虹ヶ咲学園スクールアイドル同好会
    ('ラブライブ！虹ヶ咲学園スクールアイドル同好会', 'ショウ・ランジュ'): 'zhong lanzhu',
    
    # 中二病でも恋がしたい！
    ('中二病でも恋がしたい！', '小鳥遊六花'): 'takanashi rikka',
    
    # 原神
    ('原神', '胡桃'): 'hu tao',
    
    # 物語シリーズ
    ('物語シリーズ', '忍野忍'): 'oshino shinobu',
    
    # 艦隊これくしょん
    ('艦隊これくしょん', '望月'): 'mochizuki (kancolle)',
    ('艦隊これくしょん', '霧島'): 'kirishima (kancolle)',
    
    # 魔法少女まどか☆マギカ
    ('魔法少女まどか☆マギカ', '佐倉杏子'): 'sakura kyouko',
    ('魔法少女まどか☆マギカ', '巴マミ'): 'tomoe mami',
    ('魔法少女まどか☆マギカ', '暁美ほむら'): 'akemi homura',
    ('魔法少女まどか☆マギカ', '美樹さやか'): 'miki sayaka',
    
    # セーラームーン
    ('セーラームーン', 'ちびうさ'): 'chibiusa',
    
    # ゼロの使い魔
    ('ゼロの使い魔', 'ルイズ'): 'louise francoise le blanc de la valliere',
    
    # ノーゲーム・ノーライフ
    ('ノーゲーム・ノーライフ', 'ジブリール'): 'jibril',
    ('ノーゲーム・ノーライフ', '白'): 'shiro',
    
    # ボーカロイド
    ('ボーカロイド', '鏡音レン'): 'kagamine ren',
    
    # GTA V
    ('GTA V', 'トレバー・フィリップス'): 'trevor philips',
    
    # けものフレンズ
    ('けものフレンズ', 'フェネック'): 'fennec (kemono friends)',
    ('けものフレンズ', 'コウテイペンギン'): 'emperor penguin (kemono friends)',
    ('けものフレンズ', 'サーバル'): 'serval (kemono friends)',
    ('けものフレンズ', 'かばん'): 'kaban (kemono friends)',
    
    # アカメが斬る！
    ('アカメが斬る！', 'アカメ'): 'akame (akame ga kill!)',
    
    # ラブライブ！サンシャイン！！
    ('ラブライブ！サンシャイン！！', '小原鞠莉'): 'ohara mari',
}

def remove_emphasis(text):
    """強調表現を削除する"""
    # {{{}}}、{}、[]などの強調記号を削除
    # ただし、作品名が括弧に含まれる場合は保持
    result = text
    
    # {{}} や {{{{}}}} を削除
    result = re.sub(r'\{\{+([^}]+)\}\}+', r'\1', result)
    
    # 単一の {} を削除
    result = re.sub(r'\{([^}]+)\}', r'\1', result)
    
    # [] を削除
    result = re.sub(r'\[+([^\]]+)\]+', r'\1', result)
    
    # 余分なスペースを削除
    result = re.sub(r'\s+', ' ', result).strip()
    
    return result

def get_character_name(title, subtitle, original_prompt):
    """キャラクター名を取得（マッピングまたは元の抽出ロジック）"""
    # マッピングを最初にチェック
    key = (title, subtitle)
    if key in character_name_mapping:
        return character_name_mapping[key]
    
    # マッピングにない場合は元のロジックを使用
    extracted = extract_character_name_fallback(original_prompt, subtitle)
    
    # 強調表現を削除
    return remove_emphasis(extracted)

def extract_character_name_fallback(prompt, subtitle=""):
    """フォールバック用のキャラクター名抽出ロジック"""
    # 最初に {} で囲まれた部分を探す（単一の波括弧）
    single_brace_match = re.search(r'^\{([^}]+)\}', prompt.strip())
    if single_brace_match:
        candidate = single_brace_match.group(1).strip()
        # 作品名が括弧で含まれている場合はそのまま保持
        # 例: fennec (kemono friends) -> そのまま
        return candidate
    
    # {{{}}} で囲まれた最初の適切な候補を探す
    matches = re.findall(r'\{\{+([^}]+)\}\}+', prompt)
    
    if matches:
        for match in matches:
            candidate = match.strip()
            # 明らかにキャラクター名でない場合をスキップ
            if re.search(r'(tareme|tsurime|hair|eyes|breasts|idolmaster|cinderella|fate|series)', candidate.lower()):
                continue
            # アンダースコア+括弧の場合は保持、スペース+括弧の場合のみ削除
            if not re.search(r'_\([^)]+\)$', candidate) and not re.search(r'\s+\([^)]+\)$', candidate):
                candidate = re.sub(r'\s+\([^)]+\)', '', candidate)
            return candidate.strip()
    
    # 波括弧がない場合、最初のカンマまでの部分
    parts = prompt.split(',')
    if parts:
        first_part = parts[0].strip()
        if not re.search(r'_\([^)]+\)$', first_part) and not re.search(r'\s+\([^)]+\)$', first_part):
            first_part = re.sub(r'\s+\([^)]+\)', '', first_part)
        return first_part.strip()
    
    return prompt

def process_tsv_with_mapping(input_file, output_file):
    """TSVファイルをマッピング付きで処理"""
    non_character_rows = []
    character_rows = []
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter='\t')
        for row in reader:
            if len(row) >= 4:
                category = row[0]
                title = row[1]
                subtitle = row[2]
                prompt = row[3]
                
                if category == 'キャラクター':
                    # キャラクター再現版（オリジナル）
                    character_rows.append(['キャラクター再現', title, subtitle, prompt])
                    
                    # 通常版（マッピングまたは抽出）
                    simplified_name = get_character_name(title, subtitle, prompt)
                    character_rows.append(['キャラクター', title, subtitle, simplified_name])
                else:
                    non_character_rows.append(row)
            else:
                non_character_rows.append(row)
    
    # キャラクター行のみソート
    def sort_key(row):
        category = row[0]
        order = 0 if category == 'キャラクター再現' else 1
        return (order, row[1], row[2])
    
    character_rows.sort(key=sort_key)
    
    # 非キャラクター行 → キャラクター行の順で結合
    all_rows = non_character_rows + character_rows
    
    # ファイルに書き込む
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f, delimiter='\t')
        writer.writerows(all_rows)

if __name__ == '__main__':
    input_file = '/mnt/e/Project/Extension/Prompt/非整形マスター.tsv'
    output_file = '/mnt/e/Project/Extension/Prompt/非整形マスター_編集済み.tsv'
    
    process_tsv_with_mapping(input_file, output_file)
    print(f"処理完了: {output_file}")