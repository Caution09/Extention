#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import csv
import re
from collections import defaultdict

def analyze_character_gender():
    """
    マスターデータからキャラクターを読み取り、性別・種別を分析する
    """
    
    # 性別・種別分類用の辞書
    female_keywords = {
        # 明確な女性キーワード
        'girl', 'woman', 'female', 'lady', 'maiden', 'princess', 'queen', 'goddess', 'witch', 'maid', 'nun', 'sister',
        # 日本語名前の特徴的な終わりや要素
        'chan', 'ko', 'mi', 'na', 'ka', 'ra', 'sa', 'ri', 'ki', 'yu', 'ai', 'ei', 'rei', 'mei',
        # 作品固有の女性キャラクター
        'saber', 'rin', 'sakura', 'illya', 'nero', 'artoria', 'jeanne', 'mash', 'nitocris', 'bb',
        'reimu', 'marisa', 'cirno', 'remilia', 'flandre', 'patchouli', 'youmu', 'yuyuko', 'yukari',
        'aqua', 'megumin', 'darkness', 'wiz', 'eris', 'yunyun',
        'mikasa', 'historia', 'annie', 'sasha', 'pieck', 'ymir',
        'ochako', 'tsuyu', 'momo', 'kyoka', 'mina', 'toru', 'nejire',
        'nezuko', 'shinobu', 'mitsuri', 'kanao',
        'zero_two', 'ichigo', 'kokoro',
        'violet', 'cattleya', 'iris', 'erica',
        'chika', 'kaguya', 'hayasaka', 'iino',
        'raphtalia', 'filo', 'melty',
        'emilia', 'rem', 'ram', 'beatrice', 'felt', 'priscilla', 'crusch', 'anastasia',
        'albedo', 'shalltear', 'aura', 'mare', 'narberal', 'solution', 'lupusregina', 'yuri', 'entoma', 'cz',
        'tanya', 'visha', 'mary',
        'tohru', 'kanna', 'lucoa', 'elma', 'ilulu',
        'chizuru', 'ruka', 'sumi', 'mami',
        'nagatoro', 'gamo', 'yoshi', 'sakura',
        'komi', 'tadano', 'najimi', 'yamai', 'agari',
        'uzaki', 'hana', 'ami',
        'maple', 'sally', 'kaede', 'risa', 'may', 'yui', 'chrome', 'izu',
        'senku', 'kohaku', 'ruri', 'suika', 'minami', 'nikki',
        'emma', 'norman', 'ray', 'gilda', 'anna', 'nat', 'lannion', 'thoma', 'conny',
        'akane', 'kana', 'ruby', 'ai'
    }
    
    male_keywords = {
        # 明確な男性キーワード
        'boy', 'man', 'male', 'king', 'prince', 'knight', 'warrior', 'hero', 'master', 'father', 'brother',
        # 明確な男性キャラクター
        'astolfo', 'gilgamesh', 'archer', 'lancer', 'berserker', 'rider', 'caster', 'assassin',
        'shirou', 'kiritsugu', 'kirei', 'tokiomi',
        'kazuma', 'subaru', 'ainz', 'momonga', 'naofumi', 'motoyasu', 'ren', 'itsuki',
        'tanjiro', 'zenitsu', 'inosuke', 'giyu', 'rengoku', 'tengen', 'muichiro', 'gyomei', 'sanemi', 'obanai',
        'deku', 'bakugo', 'todoroki', 'iida', 'kirishima', 'kaminari', 'sero', 'tokoyami', 'shoji', 'ojiro', 'sato', 'koda', 'aoyama', 'mineta',
        'eren', 'armin', 'levi', 'erwin', 'jean', 'connie', 'reiner', 'bertholdt', 'zeke',
        'gon', 'killua', 'kurapika', 'leorio',
        'natsu', 'gray', 'erza', 'wendy', 'gajeel', 'levy', 'juvia',
        'luffy', 'zoro', 'sanji', 'usopp', 'chopper', 'robin', 'franky', 'brook', 'jinbe',
        'naruto', 'sasuke', 'kakashi', 'iruka', 'jiraiya', 'tsunade', 'orochimaru',
        'ichigo', 'rukia', 'orihime', 'chad', 'ishida', 'renji', 'byakuya',
        'goku', 'vegeta', 'gohan', 'piccolo', 'krillin', 'yamcha', 'tien', 'chiaotzu',
        'yusuke', 'kuwabara', 'hiei', 'kurama',
        'inuyasha', 'kagome', 'miroku', 'sango', 'shippo', 'sesshomaru',
        'alucard', 'integra', 'seras',
        'vash', 'wolfwood', 'meryl', 'milly',
        'spike', 'jet', 'faye', 'ed', 'ein',
        'shinji', 'rei', 'asuka', 'gendo', 'misato', 'ritsuko',
        'kenshin', 'kaoru', 'yahiko', 'sanosuke', 'megumi',
        'light', 'l', 'misa', 'near', 'mello', 'ryuk',
        'edward', 'alphonse', 'winry', 'roy', 'riza', 'hughes',
        'senku', 'chrome', 'gen', 'ukyo', 'tsukasa'
    }
    
    neutral_keywords = {
        # 無性・ロボット・AI
        'robot', 'android', 'ai', 'machine', 'cyborg', 'automaton', 'golem', 'construct',
        'pokemon', 'digimon', 'monster', 'creature', 'being', 'entity',
        # ポケモン系
        'pikachu', 'charizard', 'blastoise', 'venusaur', 'mewtwo', 'mew', 'lucario', 'gardevoir', 'lopunny',
        'eevee', 'vaporeon', 'jolteon', 'flareon', 'espeon', 'umbreon', 'leafeon', 'glaceon', 'sylveon'
    }
    
    non_human_keywords = {
        # 人外・動物・妖怪・モンスター
        'dragon', 'demon', 'devil', 'angel', 'spirit', 'ghost', 'zombie', 'vampire', 'werewolf',
        'cat', 'dog', 'fox', 'wolf', 'bear', 'lion', 'tiger', 'rabbit', 'mouse', 'bird',
        'youkai', 'oni', 'kitsune', 'tengu', 'kappa', 'yokai',
        'slime', 'goblin', 'orc', 'elf', 'dwarf', 'fairy', 'pixie',
        'anthro', 'furry', 'kemono', 'animal_ears', 'tail'
    }
    
    # 結果格納用辞書
    characters = {
        'female': defaultdict(list),
        'male': defaultdict(list),
        'neutral': defaultdict(list),
        'non_human': defaultdict(list),
        'unknown': defaultdict(list)
    }
    
    # TSVファイルを読み込み
    try:
        with open('/mnt/e/Project/Extension/Prompt/data-management/マスターデータ.tsv', 'r', encoding='utf-8') as file:
            reader = csv.reader(file, delimiter='\t')
            for row in reader:
                if len(row) >= 4:
                    category, subcategory, character_name, prompt = row[0], row[1], row[2], row[3]
                    
                    # キャラクター関連のカテゴリのみ処理
                    if category in ['キャラクター', 'キャラクター再現']:
                        # 分析用テキスト（小文字に変換して分析）
                        text_to_analyze = f"{character_name} {prompt}".lower()
                        
                        # 性別・種別判定
                        category_assigned = False
                        
                        # 1. 無性・ロボット判定（最優先）
                        if any(keyword in text_to_analyze for keyword in neutral_keywords):
                            characters['neutral'][subcategory].append({
                                'name': character_name,
                                'prompt': prompt,
                                'category': category
                            })
                            category_assigned = True
                        
                        # 2. 人外判定
                        elif any(keyword in text_to_analyze for keyword in non_human_keywords):
                            characters['non_human'][subcategory].append({
                                'name': character_name,
                                'prompt': prompt,
                                'category': category
                            })
                            category_assigned = True
                        
                        # 3. 男性判定
                        elif any(keyword in text_to_analyze for keyword in male_keywords):
                            characters['male'][subcategory].append({
                                'name': character_name,
                                'prompt': prompt,
                                'category': category
                            })
                            category_assigned = True
                        
                        # 4. 女性判定（デフォルト的に最後に判定）
                        elif any(keyword in text_to_analyze for keyword in female_keywords):
                            characters['female'][subcategory].append({
                                'name': character_name,
                                'prompt': prompt,
                                'category': category
                            })
                            category_assigned = True
                        
                        # 5. 判定不能
                        if not category_assigned:
                            characters['unknown'][subcategory].append({
                                'name': character_name,
                                'prompt': prompt,
                                'category': category
                            })
    
    except FileNotFoundError:
        print("マスターデータファイルが見つかりません")
        return None
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        return None
    
    return characters

def print_results(characters):
    """結果を整形して出力"""
    if not characters:
        return
    
    for gender_type, type_name in [
        ('female', '女性キャラクター'),
        ('male', '男性キャラクター'),
        ('neutral', '無性キャラクター（ロボット・AI・ポケモンなど）'),
        ('non_human', '人外キャラクター（動物・妖怪・モンスターなど）'),
        ('unknown', '判定不能キャラクター')
    ]:
        print(f"\n## {type_name}")
        print(f"総数: {sum(len(chars) for chars in characters[gender_type].values())}件")
        print("-" * 50)
        
        for subcategory in sorted(characters[gender_type].keys()):
            chars = characters[gender_type][subcategory]
            print(f"\n### {subcategory} ({len(chars)}件)")
            for char in sorted(chars, key=lambda x: x['name']):
                print(f"  - {char['name']} ({char['category']})")
                if char['prompt'] != char['name']:
                    print(f"    Prompt: {char['prompt'][:100]}...")

if __name__ == "__main__":
    print("キャラクター性別・種別分析を開始します...")
    characters = analyze_character_gender()
    print_results(characters)