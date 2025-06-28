#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
未登録項目.tsvの処理スクリプト（改良版）
既存のマスターデータカテゴリと照合し、有効なエントリと無効なエントリに分離する
"""

import csv
import re
from collections import defaultdict

def parse_categories_txt(file_path):
    """categories.txtを解析して有効なカテゴリの組み合わせを取得"""
    valid_categories = set()
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 大項目の抽出
    sections = re.split(r'## (.+?) \(\d+個\)', content)
    
    current_major = None
    for i, section in enumerate(sections):
        if i % 2 == 1:  # 奇数インデックスは大項目名
            current_major = section.strip()
        elif i % 2 == 0 and current_major:  # 偶数インデックスは中項目リスト
            # 中項目の抽出
            lines = section.strip().split('\n')
            for line in lines:
                if line.strip().startswith('- '):
                    middle = line.strip()[2:].strip()
                    if middle:
                        valid_categories.add((current_major, middle))
    
    return valid_categories

def load_unregistered_data(file_path):
    """未登録項目.tsvを読み込む"""
    entries = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter='\t')
        for row in reader:
            if len(row) >= 4:
                major, middle, minor, prompt = row[:4]
                entries.append({
                    'major': major.strip(),
                    'middle': middle.strip(),
                    'minor': minor.strip(),
                    'prompt': prompt.strip()
                })
    
    return entries

def categorize_prompt_content(prompt, minor, major, middle):
    """プロンプトの内容に基づいて適切なカテゴリを推定"""
    prompt_lower = prompt.lower()
    minor_lower = minor.lower()
    
    # キャラクター関連の詳細判定
    character_mappings = {
        'hololive': ('キャラクター', 'Hololive'),
        'nijisanji': ('キャラクター', 'にじさんじ'),
        'umamusume': ('キャラクター', 'ウマ娘'),
        'blue archive': ('キャラクター', 'ブルーアーカイブ'),
        'granblue fantasy': ('キャラクター', 'グランブルーファンタジー'),
        'fate': ('キャラクター', 'Fate'),
        'arknights': ('キャラクター', 'アークナイツ'),
        'arkknights': ('キャラクター', 'アークナイツ'),
        'touhou': ('キャラクター', '東方'),
        'kantai collection': ('キャラクター', '艦隊これくしょん'),
        'kancolle': ('キャラクター', '艦隊これくしょん'),
        'vocaloid': ('キャラクター', 'ボーカロイド'),
        'miku': ('キャラクター', 'ボーカロイド'),
        'pokemon': ('キャラクター', 'ポケモン'),
        'pokemon': ('キャラクター', 'ポケモン'),
        'love live': ('キャラクター', 'ラブライブ！'),
        'idolmaster': ('キャラクター', 'アイドルマスター'),
        'im@s': ('キャラクター', 'アイドルマスター'),
        'cinderella girls': ('キャラクター', 'アイドルマスターシンデレラガールズ'),
        'princess connect': ('キャラクター', 'プリコネ'),
        'priconne': ('キャラクター', 'プリコネ'),
        'genshin': ('キャラクター', '原神'),
        'genshin impact': ('キャラクター', '原神'),
        'evangelion': ('キャラクター', '新世紀エヴァンゲリオン'),
        'eva': ('キャラクター', '新世紀エヴァンゲリオン'),
        'one piece': ('キャラクター', 'ワンピース'),
        'naruto': ('キャラクター', 'NARUTO'),
        'dragon ball': ('キャラクター', 'ドラゴンボール'),
        'sailor moon': ('キャラクター', 'セーラームーン'),
        'precure': ('キャラクター', 'ふたりはプリキュア'),
        'pretty cure': ('キャラクター', 'ふたりはプリキュア')
    }
    
    for keyword, category in character_mappings.items():
        if keyword in prompt_lower:
            return category
    
    # 具体的なキャラクター名での判定
    if any(name in prompt_lower for name in ['remilia', 'reimu', 'marisa', 'sakuya']):
        return ('キャラクター', '東方')
    
    # 成人向けコンテンツの詳細分類
    nsfw_keywords = ['nsfw', 'sex', 'penis', 'pussy', 'breast', 'nipple', 'cum', 'rape', 'naked', 'nude', 'orgasm', 'climax']
    if any(keyword in prompt_lower for keyword in nsfw_keywords):
        if any(keyword in prompt_lower for keyword in ['milking machine', 'vibrator', 'dildo', 'toy']):
            return ('成人向け', 'アイテム')
        elif any(keyword in prompt_lower for keyword in ['sex', 'mating', 'missionary', 'doggystyle', 'cowgirl']):
            return ('成人向け', '性交')
        elif any(keyword in prompt_lower for keyword in ['handjob', 'masturbation', 'self-pleasuring']):
            return ('成人向け', '手淫')
        elif any(keyword in prompt_lower for keyword in ['oral', 'blowjob', 'irrumatio', 'fellatio']):
            return ('成人向け', '口淫')
        elif any(keyword in prompt_lower for keyword in ['paizuri', 'titjob']):
            return ('成人向け', '前戯')
        elif any(keyword in prompt_lower for keyword in ['bondage', 'bdsm', 'rope']):
            return ('成人向け', 'SM')
        elif any(keyword in prompt_lower for keyword in ['template', 'quality']):
            return ('成人向け', 'テンプレ')
        else:
            return ('成人向け', 'オプション')
    
    # 服装関連の詳細分類
    clothing_keywords = {
        'panties': ('服装', '下着'),
        'bra': ('服装', '下着'),
        'underwear': ('服装', '下着'),
        'thighhighs': ('服装', '靴下'),
        'stockings': ('服装', '靴下'),
        'socks': ('服装', '靴下'),
        'leotard': ('服装', '一式'),
        'swimsuit': ('服装', '一式'),
        'bikini': ('服装', '一式'),
        'bunnysuit': ('コスチューム', 'ファンタジー'),
        'shirt': ('服装', 'トップス'),
        'blouse': ('服装', 'トップス'),
        'coat': ('服装', 'アウター'),
        'jacket': ('服装', 'アウター'),
        'skirt': ('服装', 'スカート'),
        'dress': ('服装', 'ドレス'),
        'kimono': ('服装', '和装'),
        'yukata': ('服装', '和装'),
        'uniform': ('コスチューム', 'ユニフォーム'),
        'school_swimsuit': ('服装', '一式'),
        'gloves': ('服装', '手袋'),
        'shoes': ('服装', '靴'),
        'boots': ('服装', '靴')
    }
    
    for keyword, category in clothing_keywords.items():
        if keyword in prompt_lower:
            return category
    
    # 身体部位関連
    body_keywords = {
        'breasts': ('身体', '胸'),
        'chest': ('身体', '胸'),
        'nipple': ('身体', '胸'),
        'boobs': ('身体', '胸'),
        'skin': ('身体', '肌'),
        'tan': ('身体', '肌'),
        'dark_skin': ('身体', '肌'),
        'hair': ('髪', '色'),
        'blonde': ('髪', '色'),
        'brunette': ('髪', '色'),
        'eyes': ('顔', '目'),
        'face': ('顔', '輪郭'),
        'mouth': ('顔', '口'),
        'nose': ('顔', '鼻'),
        'body': ('身体', '特徴'),
        'muscle': ('身体', '筋肉'),
        'abs': ('身体', '筋肉'),
        'thighs': ('身体', '脚'),
        'legs': ('身体', '脚'),
        'arms': ('身体', '腕'),
        'hands': ('身体', '手'),
        'feet': ('身体', '足'),
        'butt': ('身体', '尻'),
        'hips': ('身体', '尻')
    }
    
    for keyword, category in body_keywords.items():
        if keyword in prompt_lower:
            return category
    
    # 動作・ポーズ関連
    action_keywords = {
        'pose': ('動作', 'ポーズ'),
        'standing': ('動作', '脚の動作'),
        'sitting': ('動作', '脚の動作'),
        'lying': ('動作', 'ポーズ'),
        'carrying': ('動作', '手・腕の動作'),
        'holding': ('動作', '手・腕の動作'),
        'grabbing': ('動作', '手・腕の動作'),
        'pointing': ('動作', '指さし'),
        'waving': ('動作', '手・腕の動作'),
        'dancing': ('動作', '一般'),
        'running': ('動作', '移動'),
        'walking': ('動作', '移動'),
        'jumping': ('動作', '移動')
    }
    
    for keyword, category in action_keywords.items():
        if keyword in prompt_lower:
            return category
    
    # 表情・感情関連
    expression_keywords = {
        'smile': ('表情・感情', 'ポジティブな感情'),
        'happy': ('表情・感情', 'ポジティブな感情'),
        'joy': ('表情・感情', 'ポジティブな感情'),
        'seductive': ('表情・感情', '性的な表情'),
        'sad': ('表情・感情', 'ネガティブな感情'),
        'crying': ('表情・感情', 'ネガティブな感情'),
        'angry': ('表情・感情', 'ネガティブな感情'),
        'surprised': ('表情・感情', 'その他'),
        'confused': ('表情・感情', '困惑した表情・感情'),
        'blush': ('表情・感情', '恥ずかしい表情・感情'),
        'embarrassed': ('表情・感情', '恥ずかしい表情・感情')
    }
    
    for keyword, category in expression_keywords.items():
        if keyword in prompt_lower:
            return category
    
    # 装飾・アクセサリー関連
    accessory_keywords = {
        'mask': ('装飾', 'その他'),
        'glasses': ('装飾', '眼鏡'),
        'earrings': ('装飾', '耳'),
        'necklace': ('装飾', '首'),
        'bracelet': ('装飾', '手'),
        'ring': ('装飾', '手'),
        'hat': ('装飾', '帽子'),
        'cap': ('装飾', '帽子'),
        'headband': ('装飾', 'ヘアアクセサリー'),
        'ribbon': ('装飾', 'ヘアアクセサリー'),
        'bow': ('装飾', 'ヘアアクセサリー'),
        'pacifier': ('装飾', 'アクセサリー'),
        'rattle': ('装飾', 'アクセサリー'),
        'weapon': ('装飾', '武器'),
        'sword': ('装飾', '武器'),
        'gun': ('装飾', '武器')
    }
    
    for keyword, category in accessory_keywords.items():
        if keyword in prompt_lower:
            return category
    
    # 場所関連
    location_keywords = {
        'room': ('場所', '屋内'),
        'bedroom': ('場所', '家（室内）'),
        'bathroom': ('場所', '家（室内）'),
        'kitchen': ('場所', '家（室内）'),
        'school': ('場所', '学校（室内）'),
        'classroom': ('場所', '学校（室内）'),
        'art_room': ('場所', '学校（室内）'),
        'office': ('場所', '会社'),
        'hospital': ('場所', '屋内'),
        'library': ('場所', '図書室'),
        'park': ('場所', '公園'),
        'beach': ('場所', '海'),
        'forest': ('場所', '自然'),
        'mountain': ('場所', '自然'),
        'city': ('場所', '街中'),
        'street': ('場所', '歩道'),
        'outdoor': ('場所', '屋外'),
        'indoor': ('場所', '屋内'),
        'bed': ('場所', '家（室内）'),
        'toilet': ('場所', '屋内'),
        'public_toilet': ('場所', '屋内')
    }
    
    for keyword, category in location_keywords.items():
        if keyword in prompt_lower:
            return category
    
    # 品質・技術関連
    quality_keywords = {
        'best_quality': ('品質', '高品質'),
        'high_quality': ('品質', '高品質'),
        'masterpiece': ('品質', '高品質'),
        'aesthetic': ('品質', 'aesthetic'),
        'detailed': ('品質', '高品質'),
        'realistic': ('品質', '高品質'),
        'intricate': ('品質', '高品質'),
        'official_art': ('品質', '高品質'),
        'illustration': ('品質', '高品質')
    }
    
    for keyword, category in quality_keywords.items():
        if keyword in prompt_lower:
            return category
    
    # カメラワーク関連
    camera_keywords = {
        'pov': ('カメラワーク', '視点'),
        'close-up': ('カメラワーク', '距離'),
        'wide_shot': ('カメラワーク', '距離'),
        'focus': ('カメラワーク', 'フォーカス'),
        'angle': ('カメラワーク', '角度'),
        'perspective': ('カメラワーク', '視点'),
        'from_above': ('カメラワーク', 'アングル'),
        'from_below': ('カメラワーク', 'アングル'),
        'side_view': ('カメラワーク', 'アングル')
    }
    
    for keyword, category in camera_keywords.items():
        if keyword in prompt_lower:
            return category
    
    # エフェクト関連
    effect_keywords = {
        'light': ('エフェクト', '光'),
        'shadow': ('照明', '陰影'),
        'particle': ('エフェクト', '粒子'),
        'magic': ('エフェクト', '魔法'),
        'fire': ('エフェクト', '炎'),
        'water': ('エフェクト', '水系'),
        'smoke': ('エフェクト', '煙'),
        'electricity': ('エフェクト', '電気'),
        'explosion': ('エフェクト', 'エフェクト')
    }
    
    for keyword, category in effect_keywords.items():
        if keyword in prompt_lower:
            return category
    
    # 食べ物関連
    food_keywords = {
        'food': ('食べ物', '食べ物'),
        'fruit': ('食べ物', '果物'),
        'cake': ('食べ物', 'お菓子'),
        'candy': ('食べ物', 'お菓子'),
        'drink': ('食べ物', '飲み物'),
        'coffee': ('食べ物', '飲み物'),
        'tea': ('食べ物', '飲み物')
    }
    
    for keyword, category in food_keywords.items():
        if keyword in prompt_lower:
            return category
    
    # オブジェクト関連
    object_keywords = {
        'car': ('オブジェクト', '乗り物'),
        'train': ('オブジェクト', '乗り物'),
        'plane': ('オブジェクト', '乗り物'),
        'bike': ('オブジェクト', '乗り物'),
        'flower': ('オブジェクト', '花'),
        'rose': ('オブジェクト', '花'),
        'tree': ('オブジェクト', '自然物'),
        'building': ('オブジェクト', '建造物'),
        'house': ('オブジェクト', '建造物'),
        'computer': ('オブジェクト', '電子機器'),
        'phone': ('オブジェクト', '電子機器'),
        'book': ('オブジェクト', '日用品'),
        'chair': ('オブジェクト', '家具'),
        'table': ('オブジェクト', '家具'),
        'bed': ('オブジェクト', '家具')
    }
    
    for keyword, category in object_keywords.items():
        if keyword in prompt_lower:
            return category
    
    # 動物関連
    animal_keywords = {
        'cat': ('オブジェクト', '動物'),
        'dog': ('オブジェクト', '動物'),
        'bird': ('生物', '鳥'),
        'fish': ('生物', '魚'),
        'rabbit': ('オブジェクト', '動物'),
        'horse': ('オブジェクト', '動物'),
        'dragon': ('オブジェクト', '動物'),
        'wolf': ('オブジェクト', '動物')
    }
    
    for keyword, category in animal_keywords.items():
        if keyword in prompt_lower:
            return category
    
    # テイスト・デザイナー関連
    if 'illustrated by' in prompt_lower or 'artist:' in prompt_lower or any(name in prompt_lower for name in ['bunbun', 'nana kagura', 'onono imoko']):
        return ('テイスト', 'デザイナー')
    
    # 年齢・属性関連
    age_keywords = {
        'loli': ('年齢', '女性'),
        'shota': ('年齢', '男性'),
        'child': ('年齢', '男女共通'),
        'adult': ('年齢', '男女共通'),
        'old': ('年齢', '男女共通'),
        'teenager': ('年齢', '男女共通'),
        'young': ('年齢', '男女共通')
    }
    
    for keyword, category in age_keywords.items():
        if keyword in prompt_lower:
            return category
    
    # デフォルト（内容から判定できない場合）
    return None

def reclassify_entry(entry, valid_categories):
    """エントリを適切なカテゴリに再分類"""
    major, middle, minor, prompt = entry['major'], entry['middle'], entry['minor'], entry['prompt']
    
    # 無効なカテゴリを修正
    invalid_categories = ['お気に', 'お気に入り', '未分類', 'Google翻訳', '翻訳中']
    
    # 空の大項目・中項目も無効として扱う
    is_invalid = (major in invalid_categories or middle in invalid_categories or 
                  major.strip() == '' or middle.strip() == '')
    
    if is_invalid:
        # プロンプトの内容から適切なカテゴリを推定
        suggested_category = categorize_prompt_content(prompt, minor, major, middle)
        
        if suggested_category and suggested_category in valid_categories:
            return {
                'major': suggested_category[0],
                'middle': suggested_category[1],
                'minor': minor if minor else suggested_category[1],
                'prompt': prompt,
                'original_major': major,
                'original_middle': middle,
                'recategorized': True
            }
    
    # 既存のカテゴリが有効かチェック
    if (major, middle) in valid_categories:
        return {
            'major': major,
            'middle': middle,
            'minor': minor,
            'prompt': prompt,
            'recategorized': False
        }
    
    # カテゴリ名の類似性チェック（部分マッチ）
    for valid_major, valid_middle in valid_categories:
        if (major.lower() in valid_major.lower() or valid_major.lower() in major.lower()) and \
           (middle.lower() in valid_middle.lower() or valid_middle.lower() in middle.lower()):
            return {
                'major': valid_major,
                'middle': valid_middle,
                'minor': minor,
                'prompt': prompt,
                'original_major': major,
                'original_middle': middle,
                'recategorized': True
            }
    
    return None

def main():
    print("未登録項目の処理を開始します（改良版）...")
    
    # 有効なカテゴリを読み込み
    print("有効なカテゴリを読み込み中...")
    valid_categories = parse_categories_txt('categories.txt')
    print(f"有効なカテゴリ組み合わせ数: {len(valid_categories)}")
    
    # 未登録項目を読み込み
    print("未登録項目を読み込み中...")
    entries = load_unregistered_data('未登録項目.tsv')
    print(f"総エントリ数: {len(entries)}")
    
    # エントリを分類
    valid_entries = []
    invalid_entries = []
    recategorized_count = 0
    
    print("エントリを分類中...")
    for entry in entries:
        result = reclassify_entry(entry, valid_categories)
        
        if result:
            valid_entries.append(result)
            if result.get('recategorized', False):
                recategorized_count += 1
        else:
            invalid_entries.append(entry)
    
    print(f"\n処理結果:")
    print(f"有効なエントリ: {len(valid_entries)} 個")
    print(f"  - 再分類されたエントリ: {recategorized_count} 個")
    print(f"  - 元々有効だったエントリ: {len(valid_entries) - recategorized_count} 個")
    print(f"無効なエントリ: {len(invalid_entries)} 個")
    
    # 有効なエントリをTSVファイルに保存
    print("\n有効なエントリを保存中...")
    with open('cleaned_valid_v2.tsv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f, delimiter='\t')
        for entry in valid_entries:
            writer.writerow([entry['major'], entry['middle'], entry['minor'], entry['prompt']])
    
    # 無効なエントリをTSVファイルに保存
    print("無効なエントリを保存中...")
    with open('未登録項目_filtered_v2.tsv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f, delimiter='\t')
        for entry in invalid_entries:
            writer.writerow([entry['major'], entry['middle'], entry['minor'], entry['prompt']])
    
    # カテゴリ別統計
    print("\n有効エントリのカテゴリ別統計（上位20位）:")
    category_stats = defaultdict(int)
    for entry in valid_entries:
        category_stats[f"{entry['major']} > {entry['middle']}"] += 1
    
    for category, count in sorted(category_stats.items(), key=lambda x: x[1], reverse=True)[:20]:
        print(f"  {category}: {count} 件")
    
    # 無効エントリの分析
    print("\n無効エントリの原因分析（上位10位）:")
    invalid_reasons = defaultdict(int)
    for entry in invalid_entries:
        reason = f"{entry['major']} > {entry['middle']}"
        invalid_reasons[reason] += 1
    
    for reason, count in sorted(invalid_reasons.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {reason}: {count} 件")
    
    print(f"\n処理完了！")
    print(f"有効なエントリ: cleaned_valid_v2.tsv ({len(valid_entries)} 件)")
    print(f"無効なエントリ: 未登録項目_filtered_v2.tsv ({len(invalid_entries)} 件)")

if __name__ == "__main__":
    main()