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

def categorize_by_prompt(prompt_text, existing_categories):
    """Categorize based on prompt content analysis"""
    prompt_lower = prompt_text.lower()
    
    # Character name patterns
    character_patterns = [
        r'[a-z_]+\s*\([^)]*\)',  # character (series) format
        r'[a-z_]+_[a-z_]+',      # character_name format
    ]
    
    # Content-based categorization rules
    categorization_rules = {
        # Adult content
        ('成人向け', '性器'): ['penis', 'vagina', 'clitoris', 'testicles', 'pussy', 'cock', 'cum', 'creampie'],
        ('成人向け', 'プレイ'): ['sex', 'fellatio', 'paizuri', 'handjob', 'footjob', 'masturbation', 'vibrator', 'milking'],
        ('成人向け', 'ポーズ'): ['doggystyle', 'missionary', 'cowgirl', 'mating_press', 'standing', 'sitting position'],
        ('成人向け', 'エッチな構図'): ['stomach_bulge', 'deep_penetration', 'imminent_penetration'],
        
        # Clothing
        ('服装・衣類', 'トップス'): ['shirt', 'blouse', 'top', 'bra', 'tube_top'],
        ('服装・衣類', '頭部'): ['hat', 'cap', 'hood', 'helmet', 'headband', 'tiara'],
        ('服装', '下着'): ['panties', 'underwear', 'lingerie', 'bra'],
        ('服装', 'スカート'): ['skirt', 'miniskirt', 'long_skirt'],
        ('服装', '靴下'): ['thighhighs', 'stockings', 'socks'],
        ('服装', '靴'): ['boots', 'shoes', 'heels'],
        ('服装', '一式'): ['school_uniform', 'swimsuit', 'dress', 'kimono', 'yukata'],
        
        # Body parts and poses
        ('身体', '胸'): ['breasts', 'nipples', 'cleavage', 'bust'],
        ('身体', '尻'): ['ass', 'butt', 'buttocks', 'anus'],
        ('身体', '脚'): ['legs', 'thighs', 'calves'],
        ('身体', '手'): ['hands', 'fingers', 'palm'],
        ('身体', '体型'): ['slim', 'curvy', 'thick', 'chubby'],
        ('身体', '肌'): ['skin', 'tan', 'pale', 'dark_skin'],
        
        # Face and expressions
        ('顔', '目'): ['eyes', 'pupils', 'eyelashes', 'eyebrows'],
        ('顔', '口'): ['mouth', 'lips', 'tongue', 'teeth'],
        ('表情・感情', '性的な表情'): ['ahegao', 'blush', 'aroused', 'seductive'],
        ('表情・感情', '明るい表情'): ['smile', 'happy', 'cheerful', 'excited'],
        ('表情・感情', '視線'): ['looking_at_viewer', 'eye_contact', 'wink'],
        
        # Hair
        ('髪', '髪色'): ['blonde', 'brown_hair', 'black_hair', 'red_hair', 'blue_hair'],
        ('髪', '髪の長さ'): ['long_hair', 'short_hair', 'medium_hair'],
        ('髪', '女性向けの髪型'): ['twintails', 'ponytail', 'braids', 'pigtails'],
        
        # Actions and poses
        ('動作', 'ポーズ'): ['sitting', 'standing', 'lying', 'kneeling', 'squatting'],
        ('動作', '手'): ['pointing', 'waving', 'grabbing', 'holding'],
        ('動作', '腕の動作'): ['arms_up', 'arms_behind_back', 'crossed_arms'],
        
        # Effects
        ('エフェクト', '光'): ['light', 'glow', 'shine', 'sparkle'],
        ('エフェクト', '水系'): ['water', 'wet', 'splash'],
        ('エフェクト', '炎'): ['fire', 'flame', 'burn'],
        
        # Objects
        ('オブジェクト', '家具'): ['bed', 'chair', 'table', 'sofa'],
        ('オブジェクト', '小物'): ['book', 'phone', 'bag', 'toy'],
        
        # Locations
        ('場所', '屋内'): ['room', 'bedroom', 'bathroom', 'kitchen', 'classroom'],
        ('場所', '屋外'): ['park', 'beach', 'street', 'garden'],
        ('場所', '学校'): ['school', 'classroom', 'library', 'gym'],
        
        # Camera work
        ('カメラワーク', '視点'): ['pov', 'first_person', 'third_person'],
        ('カメラワーク', '構図'): ['close-up', 'full_body', 'upper_body', 'portrait'],
        ('カメラワーク', 'アングル'): ['from_above', 'from_below', 'side_view'],
        
        # Quality and style
        ('品質', '高品質'): ['best_quality', 'masterpiece', 'high_resolution', 'detailed'],
        ('テイスト', '画風'): ['anime', 'realistic', 'cartoon', 'sketch'],
        
        # Accessories
        ('装飾', 'アクセサリー'): ['necklace', 'earrings', 'bracelet', 'ring'],
        ('装飾', '眼鏡'): ['glasses', 'sunglasses'],
        ('装飾', '帽子'): ['hat', 'cap', 'beret'],
    }
    
    # Check for character names first
    for pattern in character_patterns:
        if re.search(pattern, prompt_lower):
            return ('キャラクター', None)  # Will need manual subcategory assignment
    
    # Check content-based rules
    for (major, minor), keywords in categorization_rules.items():
        for keyword in keywords:
            if keyword in prompt_lower:
                return (major, minor)
    
    # Default fallback
    return (None, None)

def clean_invalid_categories(major, minor, prompt, existing_categories):
    """Clean invalid categories and suggest proper ones"""
    invalid_majors = ['お気に', 'お気に入り', '未分類', 'Google翻訳', '翻訳中', '', 'テスト']
    invalid_minors = ['未分類', 'Google翻訳', '翻訳中', 'お気に', '', 'テスト']
    
    needs_cleaning = major in invalid_majors or minor in invalid_minors
    original_major = major
    original_minor = minor
    
    if needs_cleaning:
        # Try to categorize based on prompt content
        suggested_major, suggested_minor = categorize_by_prompt(prompt, existing_categories)
        
        if suggested_major and suggested_major in existing_categories:
            if suggested_minor and suggested_minor in existing_categories[suggested_major]:
                return suggested_major, suggested_minor, True
            else:
                # Use first available minor category or create reasonable default
                available_minors = existing_categories[suggested_major]
                if available_minors:
                    # Try to find most appropriate minor category
                    if 'その他' in available_minors:
                        return suggested_major, 'その他', True
                    elif '一般' in available_minors:
                        return suggested_major, '一般', True
                    else:
                        return suggested_major, available_minors[0], True
        
        # If no automatic categorization worked, try common fallbacks
        fallback_major, fallback_minor = get_fallback_category(prompt, existing_categories)
        return fallback_major, fallback_minor, True
    
    # Check if existing categories are valid
    if major in existing_categories and minor in existing_categories[major]:
        return major, minor, False
    
    # If current categories are invalid, try to fix them
    suggested_major, suggested_minor = categorize_by_prompt(prompt, existing_categories)
    if suggested_major and suggested_major in existing_categories:
        if suggested_minor and suggested_minor in existing_categories[suggested_major]:
            return suggested_major, suggested_minor, True
        else:
            available_minors = existing_categories[suggested_major]
            if 'その他' in available_minors:
                return suggested_major, 'その他', True
            elif available_minors:
                return suggested_major, available_minors[0], True
    
    fallback_major, fallback_minor = get_fallback_category(prompt, existing_categories)
    return fallback_major, fallback_minor, True

def get_fallback_category(prompt, existing_categories):
    """Get fallback category for difficult cases"""
    prompt_lower = prompt.lower()
    
    # Adult content fallback
    adult_keywords = ['nsfw', 'sex', 'cum', 'penis', 'pussy', 'breast', 'nipple', 'erotic', 'nude']
    if any(keyword in prompt_lower for keyword in adult_keywords):
        if '成人向け' in existing_categories:
            minors = existing_categories['成人向け']
            if 'その他' in minors:
                return '成人向け', 'その他'
            elif minors:
                return '成人向け', minors[0]
    
    # Character fallback
    if any(char in prompt_lower for char in ['hololive', 'vtuber', 'fate', 'blue_archive', 'umamusume']):
        if 'キャラクター' in existing_categories:
            minors = existing_categories['キャラクター']
            if 'その他' in minors:
                return 'キャラクター', 'その他'
            elif minors:
                return 'キャラクター', minors[0]
    
    # Clothing fallback  
    clothing_keywords = ['shirt', 'dress', 'skirt', 'panties', 'bra', 'thighhighs', 'stockings']
    if any(keyword in prompt_lower for keyword in clothing_keywords):
        if '服装' in existing_categories:
            minors = existing_categories['服装']
            if 'その他' in minors:
                return '服装', 'その他'
            elif minors:
                return '服装', minors[0]
    
    # Body parts fallback
    body_keywords = ['body', 'skin', 'hair', 'face', 'eyes', 'mouth', 'breasts', 'legs']
    if any(keyword in prompt_lower for keyword in body_keywords):
        if '身体' in existing_categories:
            minors = existing_categories['身体']
            if 'その他' in minors:
                return '身体', 'その他' 
            elif minors:
                return '身体', minors[0]
    
    # Default fallback
    if 'その他' in existing_categories:
        minors = existing_categories['その他']
        if 'その他' in minors:
            return 'その他', 'その他'
        elif minors:
            return 'その他', minors[0]
    
    return None, None

def process_tsv_file(input_file, output_file, unregistered_file, existing_categories):
    """Process the TSV file and clean categorization"""
    cleaned_entries = []
    unregistered_entries = []
    cleaning_stats = {
        'total_entries': 0,
        'cleaned_entries': 0,
        'unregistered_entries': 0,
        'character_entries': 0,
        'adult_content_entries': 0,
        'clothing_entries': 0,
        'body_entries': 0,
        'action_entries': 0,
        'other_entries': 0
    }
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter='\t')
        
        for row in reader:
            if len(row) < 4:
                continue
                
            major, minor, subcategory, prompt = row[:4]
            cleaning_stats['total_entries'] += 1
            
            # Clean the entry
            cleaned_major, cleaned_minor, was_cleaned = clean_invalid_categories(
                major, minor, prompt, existing_categories
            )
            
            if was_cleaned:
                cleaning_stats['cleaned_entries'] += 1
            
            # Check if it's a valid existing category combination
            if (cleaned_major and cleaned_major in existing_categories and 
                cleaned_minor and cleaned_minor in existing_categories[cleaned_major]):
                
                # Auto-generate subcategory if empty
                if not subcategory.strip():
                    # Extract meaningful subcategory from prompt
                    subcategory = generate_subcategory(prompt)
                
                cleaned_entries.append([cleaned_major, cleaned_minor, subcategory, prompt])
                
                # Update statistics
                if cleaned_major == 'キャラクター':
                    cleaning_stats['character_entries'] += 1
                elif cleaned_major == '成人向け':
                    cleaning_stats['adult_content_entries'] += 1
                elif cleaned_major in ['服装', '服装・衣類']:
                    cleaning_stats['clothing_entries'] += 1
                elif cleaned_major == '身体':
                    cleaning_stats['body_entries'] += 1
                elif cleaned_major == '動作':
                    cleaning_stats['action_entries'] += 1
                else:
                    cleaning_stats['other_entries'] += 1
                    
            else:
                # Entry has new/unregistered categories
                unregistered_entries.append([major, minor, subcategory, prompt])
                cleaning_stats['unregistered_entries'] += 1
    
    # Write cleaned entries
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f, delimiter='\t')
        for entry in cleaned_entries:
            writer.writerow(entry)
    
    # Write unregistered entries
    with open(unregistered_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f, delimiter='\t')
        for entry in unregistered_entries:
            writer.writerow(entry)
    
    return cleaning_stats

def generate_subcategory(prompt):
    """Generate appropriate subcategory name from prompt content"""
    prompt_clean = prompt.replace('_', ' ').replace(',', ' ').strip()
    
    # Extract first meaningful term
    words = prompt_clean.split()
    if words:
        first_word = words[0].strip('{}()')
        if len(first_word) > 2 and first_word.isalpha():
            return first_word
    
    return '一般'

def main():
    print("開始: 追加希望.tsvファイルのクリーニング処理")
    
    # Load existing categories
    categories = load_existing_categories('categories.txt')
    print(f"既存カテゴリ読み込み完了: {len(categories)}個の大項目")
    
    # Process the file
    stats = process_tsv_file(
        '追加希望.tsv',
        '追加希望_cleaned.tsv', 
        '未登録項目.tsv',
        categories
    )
    
    print("\n=== クリーニング結果 ===")
    print(f"総エントリ数: {stats['total_entries']}")
    print(f"クリーニング済み: {stats['cleaned_entries']}")
    print(f"未登録項目: {stats['unregistered_entries']}")
    print(f"  - キャラクター: {stats['character_entries']}")
    print(f"  - 成人向け: {stats['adult_content_entries']}")
    print(f"  - 服装関連: {stats['clothing_entries']}")
    print(f"  - 身体関連: {stats['body_entries']}")
    print(f"  - 動作関連: {stats['action_entries']}")
    print(f"  - その他: {stats['other_entries']}")
    
    print(f"\n出力ファイル:")
    print(f"  - クリーニング済み: 追加希望_cleaned.tsv")
    print(f"  - 未登録項目: 未登録項目.tsv")

if __name__ == "__main__":
    main()