#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import csv
import re

# 手動マッピング - 問題のあるキャラクター名を修正
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
    ('アイドルマスターシンデレラガールズ', '春日未来'): 'kasuga mirai',
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
    
    # この素晴らしい世界に祝福を
    ('この素晴らしい世界に祝福を', 'ウィズ'): 'wiz (konosuba)',
    ('この素晴らしい世界に祝福を', 'ダクネス'): 'darkness (konosuba)',
    
    # Hololive
    ('Hololive', 'トワ様'): 'tokoyami towa',
    ('Hololive', 'るーちゃん'): 'uruha rushia',
    
    # けものフレンズ
    ('けものフレンズ', 'フェネック'): 'fennec (kemono friends)',
    ('けものフレンズ', 'コウテイペンギン'): 'emperor penguin (kemono friends)',
    
    # 原神
    ('原神', '胡桃'): 'hu tao',
    ('原神', '刻晴'): 'keqing (genshin impact)',
    
    # アトリエ
    ('アトリエ', 'ライザ'): 'reisalin stout',
    
    # その他
    ('VOICE BOX', 'ずんだもん'): 'zundamon',
    ('ポケモン', 'ヒカリ'): 'hikari (pokemon)',
    ('ラブライブ！サンシャイン！！', '鹿角理亞'): 'kazuno ria',
    ('ラブライブ！サンシャイン！！', '小原鞠莉'): 'ohara mari',
    ('ラブライブ！スーパースター!!', 'ウィーン・マルガレーテ'): 'wien margarete',
    ('ラブライブ！スーパースター!!', '嵐 千砂都'): 'arashi chisato',
    ('ラブライブ！スーパースター!!', '平安名 すみれ'): 'heanna sumire',
    ('ラブライブ！スーパースター!!', '葉月 恋'): 'hazuki ren',
    ('ラブライブ！虹ヶ咲学園スクールアイドル同好会', 'ショウ・ランジュ'): 'zhong lanzhu',
    ('ラブライブ！虹ヶ咲学園スクールアイドル同好会', '中須かすみ'): 'nakasu kasumi',
    ('中二病でも恋がしたい！', '小鳥遊六花'): 'takanashi rikka',
    ('物語シリーズ', '忍野忍'): 'oshino shinobu',
    ('艦隊これくしょん', '望月'): 'mochizuki (kancolle)',
    ('艦隊これくしょん', '霧島'): 'kirishima (kancolle)',
    ('艦隊これくしょん', '武蔵'): 'musashi (kancolle)',
    ('艦隊これくしょん', 'z1 レーベレヒト・マース'): 'z1 leberecht maass (kancolle)',
    ('艦隊これくしょん', 'コンテ・ディ・カブール'): 'conte di cavour (kancolle)',
    ('艦隊これくしょん', '荒潮'): 'arashio (kancolle)',
    ('艦隊これくしょん', '初春'): 'hatsuharu (kancolle)',
    ('艦隊これくしょん', '雷'): 'ikazuchi (kancolle)',
    ('艦隊これくしょん', '霞'): 'kasumi (kancolle)',
    ('艦隊これくしょん', '雪風'): 'yukikaze (kancolle)',
    ('魔法少女まどか☆マギカ', '佐倉杏子'): 'sakura kyouko',
    ('魔法少女まどか☆マギカ', '巴マミ'): 'tomoe mami',
    ('魔法少女まどか☆マギカ', '暁美ほむら'): 'akemi homura',
    ('魔法少女まどか☆マギカ', '美樹さやか'): 'miki sayaka',
    ('魔法少女まどか☆マギカ', '環いろは'): 'tamaki iroha',
    ('セーラームーン', 'ちびうさ'): 'chibiusa',
    ('ゼロの使い魔', 'ルイズ'): 'louise francoise le blanc de la valliere',
    ('ノーゲーム・ノーライフ', 'ジブリール'): 'jibril',
    ('ノーゲーム・ノーライフ', '白'): 'shiro',
    ('ボーカロイド', '鏡音レン'): 'kagamine ren',
    ('GTA V', 'トレバー・フィリップス'): 'trevor philips',
    ('アカメが斬る！', 'アカメ'): 'akame (akame ga kill!)',
    ('ゼルダの伝説シリーズ', 'リンク'): 'link (zelda)',
    ('マリオブラザーズ', 'ルイージ'): 'luigi',
    ('メイドインアビス', 'リコ'): 'riko (made in abyss)',
    ('メイドインアビス', 'レグ'): 'reg (made in abyss)',
    ('わんだふるぷりきゅあ！', '犬飼こむぎ（犬）'): 'inukai komugi',
    ('わんだふるぷりきゅあ！', '猫屋敷ユキ（猫）'): 'nekoyashiki yuki',
    ('怪談', '八尺様風'): 'hachishaku-sama',
    ('東方', 'ルーミア'): 'rumia (touhou)',
    ('東方', '橙（チェン）'): 'chen (touhou)',
    ('サノバウィッチ', '因幡めぐる'): 'inaba meguru',
    ('ダンガンロンパ', '朝日奈葵'): 'asahina aoi',
    ('ダンガンロンパ', '朝日奈葵(水着)'): 'asahina aoi',
    ('俺の妹がこんなに可愛いわけがない', '高坂桐乃'): 'kousaka kirino',
}

def remove_emphasis(text):
    """強調表現を削除する"""
    # {{{}}}、{}、[]などの強調記号を削除
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

def extract_character_name(prompt, subtitle=""):
    """プロンプトからキャラクター名を抽出"""
    # 最初に {} で囲まれた部分を探す（単一の波括弧）
    single_brace_match = re.search(r'^\{([^}]+)\}', prompt.strip())
    if single_brace_match:
        candidate = single_brace_match.group(1).strip()
        # 作品名が括弧で含まれている場合はそのまま保持
        return candidate
    
    # {{{}}} で囲まれた最初の適切な候補を探す
    matches = re.findall(r'\{\{+([^}]+)\}\}+', prompt)
    
    if matches:
        for match in matches:
            candidate = match.strip()
            # 明らかにキャラクター名でない場合をスキップ
            if re.search(r'(tareme|tsurime|hair|eyes|breasts|idolmaster|cinderella|fate|series)', candidate.lower()):
                continue
            # アンダースコア+括弧、スペース+括弧の場合は保持
            return candidate
    
    # 波括弧がない場合、最初のカンマまでの部分
    parts = prompt.split(',')
    if parts:
        return parts[0].strip()
    
    return prompt

def get_character_name(title, subtitle, original_prompt):
    """キャラクター名を取得（マッピングまたは抽出）"""
    # マッピングを最初にチェック
    key = (title, subtitle)
    if key in character_name_mapping:
        return character_name_mapping[key]
    
    # マッピングにない場合は抽出ロジックを使用
    extracted = extract_character_name(original_prompt, subtitle)
    
    # 強調表現を削除
    return remove_emphasis(extracted)

def process_tsv(input_file, output_file):
    """TSVファイルを処理"""
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
                    
                    # 通常版（簡略化）
                    simplified_name = get_character_name(title, subtitle, prompt)
                    character_rows.append(['キャラクター', title, subtitle, simplified_name])
                else:
                    # キャラクター以外はそのまま保持
                    non_character_rows.append(row)
            else:
                # 4列未満の行もそのまま保持
                non_character_rows.append(row)
    
    # キャラクター行のみソート（再現版→通常版の順）
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
    
    process_tsv(input_file, output_file)
    print(f"処理完了: {output_file}")