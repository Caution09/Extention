#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import csv
import re
from collections import defaultdict

def load_existing_categories(categories_file):
    """Load existing category structure from categories.txt"""
    categories = {}
    current_major = None
    
    with open(categories_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line.startswith('##') and '(' in line:
                current_major = line.split('##')[1].split('(')[0].strip()
                categories[current_major] = []
            elif line.startswith('  -') and current_major:
                minor = line.replace('  -', '').strip()
                categories[current_major].append(minor)
    
    return categories

def categorize_entry(major, minor, subcategory, prompt, existing_categories):
    """Categorize a single entry based on comprehensive content analysis"""
    
    # List of invalid categories to be replaced
    invalid_majors = ['お気に', 'お気に入り', '未分類', 'Google翻訳', '翻訳中', '', 'テスト']
    invalid_minors = ['未分類', 'Google翻訳', '翻訳中', 'お気に', '', 'テスト']
    
    prompt_lower = prompt.lower()
    
    # If current categories are valid, keep them (unless they're in the invalid list)
    if (major not in invalid_majors and minor not in invalid_minors and 
        major in existing_categories and minor in existing_categories[major]):
        return major, minor, subcategory, False
    
    # ===== CHARACTER DETECTION =====
    character_series = {
        'hololive': 'Hololive',
        'blue_archive': 'ブルーアーカイブ',
        'fate': 'Fate',
        'umamusume': 'ウマ娘',
        'kancolle': '艦隊これくしょん',
        'kantai': '艦隊これくしょん',
        'nijisanji': 'にじさんじ',
        'vtuber': 'VTuber',
        'granblue': 'グランブルーファンタジー',
        'arknights': 'アークナイツ',
        'azur_lane': 'アズールレーン',
        'genshin': '原神',
        'touhou': '東方',
        'idolmaster': 'アイドルマスター',
        'love_live': 'ラブライブ！',
        'precure': 'Go! プリンセスプリキュア',
        'pokemon': 'ポケモン'
    }
    
    for keyword, series in character_series.items():
        if keyword in prompt_lower:
            if 'キャラクター' in existing_categories and series in existing_categories['キャラクター']:
                if not subcategory.strip():
                    subcategory = extract_character_name(prompt)
                return 'キャラクター', series, subcategory, True
    
    # ===== ADULT CONTENT DETECTION =====
    adult_keywords = ['nsfw', 'sex', 'cum', 'penis', 'pussy', 'breast', 'nipple', 'nude', 'naked', 
                     'fellatio', 'paizuri', 'handjob', 'masturbation', 'orgasm', 'erotic', 'ahegao',
                     'vagina', 'clitoris', 'testicles', 'blowjob', 'deepthroat', 'missionary',
                     'doggystyle', 'cowgirl', 'creampie', 'bukkake', 'facial', 'anal']
    
    if any(keyword in prompt_lower for keyword in adult_keywords):
        # Determine specific adult subcategory
        if any(word in prompt_lower for word in ['fellatio', 'oral', 'blowjob', 'sucking', 'deepthroat', 'irrumatio']):
            return '成人向け', '口淫', subcategory or 'フェラ', True
        elif any(word in prompt_lower for word in ['sex', 'missionary', 'doggystyle', 'cowgirl', 'mating_press']):
            return '成人向け', '性交', subcategory or 'セックス', True
        elif any(word in prompt_lower for word in ['handjob', 'masturbation', 'fingering', 'self_pleasure']):
            return '成人向け', '手淫', subcategory or '手コキ', True
        elif any(word in prompt_lower for word in ['paizuri', 'breast_job', 'titjob']):
            return '成人向け', 'プレイ', subcategory or 'パイズリ', True
        elif any(word in prompt_lower for word in ['penis', 'cock', 'testicles', 'dick']):
            return '成人向け', '性器', subcategory or '男性器', True
        elif any(word in prompt_lower for word in ['pussy', 'vagina', 'clitoris', 'vulva']):
            return '成人向け', '性器', subcategory or '女性器', True
        elif any(word in prompt_lower for word in ['cum', 'creampie', 'bukkake', 'facial', 'orgasm']):
            return '成人向け', '射精', subcategory or '射精', True
        else:
            return '成人向け', 'その他', subcategory or 'エロ', True
    
    # ===== CLOTHING DETECTION =====
    clothing_keywords = {
        'thighhighs': ('服装', '靴下'),
        'stockings': ('服装', '靴下'),
        'socks': ('服装', '靴下'),
        'panties': ('服装', '下着'),
        'bra': ('服装', '下着'),
        'underwear': ('服装', '下着'),
        'lingerie': ('服装', '下着'),
        'shirt': ('服装', 'トップス'),
        'blouse': ('服装', 'トップス'),
        'top': ('服装', 'トップス'),
        'dress': ('服装', 'ドレス'),
        'gown': ('服装', 'ドレス'),
        'skirt': ('服装', 'スカート'),
        'miniskirt': ('服装', 'スカート'),
        'swimsuit': ('服装', '一式'),
        'bikini': ('服装', '一式'),
        'school_uniform': ('服装', '一式'),
        'uniform': ('服装', '一式'),
        'kimono': ('服装', '和装'),
        'yukata': ('服装', '和装'),
        'boots': ('服装', '靴'),
        'shoes': ('服装', '靴'),
        'heels': ('服装', '靴'),
        'hat': ('服装・衣類', '頭部'),
        'cap': ('服装・衣類', '頭部'),
        'helmet': ('服装・衣類', '頭部'),
        'hood': ('服装・衣類', '頭部')
    }
    
    for keyword, (maj, min_cat) in clothing_keywords.items():
        if keyword in prompt_lower:
            if maj in existing_categories and min_cat in existing_categories[maj]:
                return maj, min_cat, subcategory or keyword.replace('_', ' '), True
    
    # ===== BODY PARTS DETECTION =====
    body_keywords = {
        'breasts': ('身体', '胸'),
        'bust': ('身体', '胸'),
        'boobs': ('身体', '胸'),
        'cleavage': ('身体', '胸'),
        'nipples': ('身体', '胸'),
        'hair': ('髪', '髪色'),
        'blonde': ('髪', '髪色'),
        'brown_hair': ('髪', '髪色'),
        'black_hair': ('髪', '髪色'),
        'eyes': ('顔', '目'),
        'pupils': ('顔', '目'),
        'face': ('顔', '顔'),
        'mouth': ('顔', '口'),
        'lips': ('顔', '口'),
        'tongue': ('顔', '口'),
        'skin': ('身体', '肌'),
        'tan': ('身体', '肌'),
        'pale': ('身体', '肌'),
        'dark_skin': ('身体', '肌'),
        'legs': ('身体', '脚'),
        'thighs': ('身体', '脚'),
        'arms': ('身体', '腕'),
        'hands': ('身体', '手'),
        'fingers': ('身体', '手'),
        'butt': ('身体', '尻'),
        'ass': ('身体', '尻'),
        'hips': ('身体', '尻'),
        'body': ('身体', '身体')
    }
    
    for keyword, (maj, min_cat) in body_keywords.items():
        if keyword in prompt_lower:
            if maj in existing_categories and min_cat in existing_categories[maj]:
                return maj, min_cat, subcategory or keyword, True
    
    # ===== EXPRESSION/EMOTION DETECTION =====
    expression_keywords = {
        'smile': ('表情・感情', '明るい表情'),
        'happy': ('表情・感情', '明るい表情'),
        'cheerful': ('表情・感情', '明るい表情'),
        'blush': ('表情・感情', '性的な表情'),
        'ahegao': ('表情・感情', '性的な表情'),
        'seductive': ('表情・感情', '性的な表情'),
        'wink': ('表情・感情', '視線'),
        'looking_at_viewer': ('表情・感情', '視線'),
        'eye_contact': ('表情・感情', '視線'),
        'angry': ('表情・感情', '不機嫌な表情'),
        'mad': ('表情・感情', '不機嫌な表情'),
        'sad': ('表情・感情', '暗い表情'),
        'crying': ('表情・感情', '暗い表情'),
        'worried': ('表情・感情', '困惑した表情'),
        'confused': ('表情・感情', '困惑した表情')
    }
    
    for keyword, (maj, min_cat) in expression_keywords.items():
        if keyword in prompt_lower:
            if maj in existing_categories and min_cat in existing_categories[maj]:
                return maj, min_cat, subcategory or keyword, True
    
    # ===== ACTION/POSE DETECTION =====
    action_keywords = {
        'sitting': ('動作', 'ポーズ'),
        'standing': ('動作', 'ポーズ'),
        'lying': ('動作', 'ポーズ'),
        'kneeling': ('動作', 'ポーズ'),
        'squatting': ('動作', 'ポーズ'),
        'crouching': ('動作', 'ポーズ'),
        'pointing': ('動作', '手'),
        'waving': ('動作', '手'),
        'peace_sign': ('動作', '手'),
        'grabbing': ('動作', '腕の動作'),
        'holding': ('動作', '腕の動作'),
        'hugging': ('動作', '腕の動作'),
        'crossed_arms': ('動作', '腕の動作'),
        'arms_up': ('動作', '腕の動作'),
        'spread_legs': ('動作', '脚の動作'),
        'cross_legs': ('動作', '脚の動作')
    }
    
    for keyword, (maj, min_cat) in action_keywords.items():
        if keyword in prompt_lower:
            if maj in existing_categories and min_cat in existing_categories[maj]:
                return maj, min_cat, subcategory or keyword, True
    
    # ===== LOCATION DETECTION =====
    location_keywords = {
        'room': ('場所', '屋内'),
        'bedroom': ('場所', '屋内'),
        'bathroom': ('場所', '屋内'),
        'kitchen': ('場所', '屋内'),
        'living_room': ('場所', '屋内'),
        'school': ('場所', '学校'),
        'classroom': ('場所', '学校'),
        'library': ('場所', '学校'),
        'gym': ('場所', '学校'),
        'park': ('場所', '屋外'),
        'beach': ('場所', '屋外'),
        'street': ('場所', '屋外'),
        'garden': ('場所', '屋外'),
        'forest': ('場所', '自然'),
        'mountain': ('場所', '自然'),
        'sea': ('場所', '海'),
        'ocean': ('場所', '海')
    }
    
    for keyword, (maj, min_cat) in location_keywords.items():
        if keyword in prompt_lower:
            if maj in existing_categories and min_cat in existing_categories[maj]:
                return maj, min_cat, subcategory or keyword, True
    
    # ===== CAMERA/TECHNICAL DETECTION =====
    camera_keywords = {
        'pov': ('カメラワーク', '視点'),
        'first_person': ('カメラワーク', '視点'),
        'close-up': ('カメラワーク', '構図'),
        'full_body': ('カメラワーク', '構図'),
        'upper_body': ('カメラワーク', '構図'),
        'portrait': ('カメラワーク', '構図'),
        'from_above': ('カメラワーク', 'アングル'),
        'from_below': ('カメラワーク', 'アングル'),
        'side_view': ('カメラワーク', 'アングル')
    }
    
    for keyword, (maj, min_cat) in camera_keywords.items():
        if keyword in prompt_lower:
            if maj in existing_categories and min_cat in existing_categories[maj]:
                return maj, min_cat, subcategory or keyword, True
    
    # ===== QUALITY/TECHNICAL TERMS =====
    if any(word in prompt_lower for word in ['best_quality', 'masterpiece', 'detailed', 'high_resolution', 'intricate', 'aesthetic']):
        return '品質', '高品質', subcategory or '品質向上', True
    
    # ===== OBJECTS DETECTION =====
    object_keywords = {
        'bed': ('オブジェクト', '家具'),
        'chair': ('オブジェクト', '家具'),
        'table': ('オブジェクト', '家具'),
        'sofa': ('オブジェクト', '家具'),
        'book': ('オブジェクト', '小物'),
        'phone': ('オブジェクト', '電子機器'),
        'bag': ('オブジェクト', '小物'),
        'car': ('オブジェクト', '乗り物'),
        'flower': ('オブジェクト', '花'),
        'rose': ('オブジェクト', '花')
    }
    
    for keyword, (maj, min_cat) in object_keywords.items():
        if keyword in prompt_lower:
            if maj in existing_categories and min_cat in existing_categories[maj]:
                return maj, min_cat, subcategory or keyword, True
    
    # ===== EFFECTS DETECTION =====
    effect_keywords = {
        'light': ('エフェクト', '光'),
        'glow': ('エフェクト', '光'),
        'sparkle': ('エフェクト', '光'),
        'shine': ('エフェクト', '光'),
        'water': ('エフェクト', '水系'),
        'wet': ('エフェクト', '水系'),
        'splash': ('エフェクト', '水系'),
        'fire': ('エフェクト', '炎'),
        'flame': ('エフェクト', '炎'),
        'smoke': ('エフェクト', '煙'),
        'steam': ('エフェクト', '煙')
    }
    
    for keyword, (maj, min_cat) in effect_keywords.items():
        if keyword in prompt_lower:
            if maj in existing_categories and min_cat in existing_categories[maj]:
                return maj, min_cat, subcategory or keyword, True
    
    # Default fallback to "その他"
    if 'その他' in existing_categories:
        available_minors = existing_categories['その他']
        default_minor = 'その他' if 'その他' in available_minors else available_minors[0] if available_minors else 'その他'
        return 'その他', default_minor, subcategory or '分類困難', True
    
    # If no fallback possible, return as unregistered
    return None, None, None, True

def extract_character_name(prompt):
    """Extract character name from prompt"""
    # Try to find character name patterns
    prompt_clean = prompt.replace('_', ' ').replace(',', ' ')
    words = prompt_clean.split()
    
    # Look for character name patterns
    for word in words:
        word_clean = word.strip('{}()')
        if len(word_clean) > 2 and word_clean.isalpha():
            return word_clean
    
    return 'キャラクター'

def process_tsv_file(input_file, output_file, unregistered_file, existing_categories):
    """Process the TSV file and clean categorization"""
    cleaned_entries = []
    unregistered_entries = []
    
    stats = {
        'total_entries': 0,
        'cleaned_entries': 0,
        'unregistered_entries': 0,
        'category_changes': defaultdict(int)
    }
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter='\t')
        
        for row in reader:
            if len(row) < 4:
                continue
                
            major, minor, subcategory, prompt = row[:4]
            stats['total_entries'] += 1
            
            # Process the entry
            new_major, new_minor, new_subcategory, was_changed = categorize_entry(
                major, minor, subcategory, prompt, existing_categories
            )
            
            if new_major and new_minor:
                # Valid categorization found
                cleaned_entries.append([new_major, new_minor, new_subcategory or subcategory, prompt])
                
                if was_changed:
                    stats['cleaned_entries'] += 1
                    stats['category_changes'][new_major] += 1
            else:
                # No valid categorization found - goes to unregistered
                unregistered_entries.append([major, minor, subcategory, prompt])
                stats['unregistered_entries'] += 1
    
    # Write cleaned entries
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f, delimiter='\t')
        for entry in cleaned_entries:
            writer.writerow(entry)
    
    # Write unregistered entries
    if unregistered_entries:
        with open(unregistered_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f, delimiter='\t')
            for entry in unregistered_entries:
                writer.writerow(entry)
    
    return stats

def main():
    print("開始: 追加希望.tsvファイルのクリーニング処理 (Version 3 - Enhanced)")
    
    # Load existing categories
    categories = load_existing_categories('categories.txt')
    print(f"既存カテゴリ読み込み完了: {len(categories)}個の大項目")
    
    # Process the file
    stats = process_tsv_file(
        '追加希望.tsv',
        '追加希望_cleaned_v3.tsv', 
        '未登録項目_v3.tsv',
        categories
    )
    
    print("\n=== クリーニング結果 ===")
    print(f"総エントリ数: {stats['total_entries']}")
    print(f"クリーニング済み: {stats['cleaned_entries']}")
    print(f"未登録項目: {stats['unregistered_entries']}")
    print(f"処理済み項目: {len(stats['category_changes'])}")
    
    print("\n=== カテゴリ別分類結果 ===")
    for category, count in sorted(stats['category_changes'].items(), key=lambda x: x[1], reverse=True):
        print(f"  - {category}: {count}件")
    
    print(f"\n出力ファイル:")
    print(f"  - クリーニング済み: 追加希望_cleaned_v3.tsv ({stats['total_entries'] - stats['unregistered_entries']}件)")
    print(f"  - 未登録項目: 未登録項目_v3.tsv ({stats['unregistered_entries']}件)")

if __name__ == "__main__":
    main()