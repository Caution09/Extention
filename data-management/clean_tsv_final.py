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
    """Categorize entry with intelligent analysis"""
    
    invalid_majors = ['お気に', 'お気に入り', '未分類', 'Google翻訳', '翻訳中', '', 'テスト']
    invalid_minors = ['未分類', 'Google翻訳', '翻訳中', 'お気に', '', 'テスト']
    
    prompt_lower = prompt.lower()
    subcategory_lower = subcategory.lower()
    
    # Keep valid existing categories
    if (major not in invalid_majors and minor not in invalid_minors and 
        major in existing_categories and minor in existing_categories[major]):
        return major, minor, subcategory, False
    
    # === CHARACTER ANALYSIS ===
    # Check for character-specific patterns
    character_indicators = {
        'hololive': 'Hololive',
        'blue_archive': 'ブルーアーカイブ', 
        'fate': 'Fate',
        'umamusume': 'ウマ娘',
        'kancolle': '艦隊これくしょん',
        'kantai_collection': '艦隊これくしょん',
        'nijisanji': 'にじさんじ',
        'granblue': 'グランブルーファンタジー',
        'arknights': 'アークナイツ',
        'idolmaster': 'アイドルマスター',
        'azur_lane': 'アズールレーン'
    }
    
    # Character name patterns in prompt
    character_patterns = [
        r'[a-zA-Z_]+\s*\([^)]*\)',  # name (series)
        r'[a-zA-Z_]+\s*\[[^\]]*\]',  # name [series]
    ]
    
    for pattern in character_patterns:
        if re.search(pattern, prompt):
            # Try to identify series
            for keyword, series in character_indicators.items():
                if keyword.replace('_', ' ') in prompt_lower or keyword in prompt_lower:
                    if 'キャラクター' in existing_categories and series in existing_categories['キャラクター']:
                        char_name = extract_character_name(prompt)
                        return 'キャラクター', series, char_name, True
            
            # Generic character if series not found
            if 'キャラクター' in existing_categories:
                available_minors = existing_categories['キャラクター']
                if 'その他' in available_minors:
                    return 'キャラクター', 'その他', extract_character_name(prompt), True
    
    # === ADULT CONTENT ANALYSIS ===
    adult_indicators = {
        'nsfw': '！必須',
        'sex': '性交',
        'cum': '射精', 
        'orgasm': '絶頂',
        'penis': '性器',
        'pussy': '性器',
        'vagina': '性器',
        'clitoris': '性器',
        'testicles': '性器',
        'fellatio': '口淫',
        'oral': '口淫',
        'blowjob': '口淫',
        'handjob': '手淫',
        'masturbation': '自慰',
        'paizuri': 'プレイ',
        'missionary': '体位',
        'doggystyle': '体位',
        'cowgirl': '体位',
        'breast': '性器',
        'nipple': '性器',
        'nude': 'ポーズ',
        'naked': 'ポーズ'
    }
    
    for keyword, category in adult_indicators.items():
        if keyword in prompt_lower:
            if '成人向け' in existing_categories and category in existing_categories['成人向け']:
                return '成人向け', category, subcategory or keyword, True
    
    # === CLOTHING ANALYSIS ===
    clothing_indicators = {
        'thighhighs': ('服装', '靴下'),
        'stockings': ('服装', '靴下'),
        'panties': ('服装', '下着'),
        'bra': ('服装', '下着'),
        'shirt': ('服装', 'トップス'),
        'dress': ('服装', 'ドレス'),
        'skirt': ('服装', 'スカート'),
        'swimsuit': ('服装', '一式'),
        'school_uniform': ('服装', '一式'),
        'kimono': ('服装', '和装'),
        'boots': ('服装', '靴'),
        'hat': ('装飾', '帽子'),
        'glasses': ('装飾', '眼鏡')
    }
    
    # Check subcategory for clothing hints
    clothing_subcategory_hints = {
        'ニーソ': ('服装', '靴下'),
        'パンツ': ('服装', '下着'),
        'ブラ': ('服装', '下着'),
        'シャツ': ('服装', 'トップス'),
        'スカート': ('服装', 'スカート'),
        'スク水': ('服装', '一式'),
        'バニー': ('服装', '一式'),
        '制服': ('服装', '一式'),
        '着物': ('服装', '和装'),
        '浴衣': ('服装', '和装'),
        '靴': ('服装', '靴'),
        '帽子': ('装飾', '帽子'),
        '眼鏡': ('装飾', '眼鏡'),
        'レオタード': ('服装', '一式')
    }
    
    # Check subcategory first (Japanese terms)
    for hint, (maj, min_cat) in clothing_subcategory_hints.items():
        if hint in subcategory:
            if maj in existing_categories and min_cat in existing_categories[maj]:
                return maj, min_cat, subcategory, True
    
    # Check prompt for English terms
    for keyword, (maj, min_cat) in clothing_indicators.items():
        if keyword in prompt_lower:
            if maj in existing_categories and min_cat in existing_categories[maj]:
                return maj, min_cat, subcategory or keyword, True
    
    # === BODY PARTS ANALYSIS ===
    body_indicators = {
        'hair': ('髪', '髪色'),
        'blonde': ('髪', '髪色'),
        'eyes': ('顔', '目'),
        'face': ('顔', '顔'),
        'skin': ('身体', '肌'),
        'breasts': ('身体', '胸'),
        'legs': ('身体', '脚'),
        'arms': ('身体', '腕'),
        'hands': ('身体', '手'),
        'body': ('身体', '身体')
    }
    
    # Japanese body part hints in subcategory
    body_subcategory_hints = {
        '髪': ('髪', '髪色'),
        '目': ('顔', '目'),
        '顔': ('顔', '顔'),
        '肌': ('身体', '肌'),
        '胸': ('身体', '胸'),
        '乳': ('身体', '胸'),
        '脚': ('身体', '脚'),
        '腕': ('身体', '腕'),
        '手': ('身体', '手'),
        '体': ('身体', '身体'),
        '身体': ('身体', '身体')
    }
    
    for hint, (maj, min_cat) in body_subcategory_hints.items():
        if hint in subcategory:
            if maj in existing_categories and min_cat in existing_categories[maj]:
                return maj, min_cat, subcategory, True
    
    for keyword, (maj, min_cat) in body_indicators.items():
        if keyword in prompt_lower:
            if maj in existing_categories and min_cat in existing_categories[maj]:
                return maj, min_cat, subcategory or keyword, True
    
    # === EXPRESSION ANALYSIS ===
    expression_hints = {
        '表情': ('表情・感情', 'その他'),
        '笑顔': ('表情・感情', '明るい表情'),
        'スマイル': ('表情・感情', '明るい表情'),
        '目線': ('表情・感情', '視線'),
        '視線': ('表情・感情', '視線'),
        '感情': ('表情・感情', 'その他')
    }
    
    for hint, (maj, min_cat) in expression_hints.items():
        if hint in subcategory:
            if maj in existing_categories and min_cat in existing_categories[maj]:
                return maj, min_cat, subcategory, True
    
    # === POSE/ACTION ANALYSIS ===
    pose_hints = {
        'ポーズ': ('動作', 'ポーズ'),
        '動作': ('動作', '動作'),
        '座る': ('動作', '座る'),
        '立つ': ('動作', 'ポーズ'),
        '手': ('動作', '手'),
        '腕': ('動作', '腕の動作'),
        '脚': ('動作', '脚の動作')
    }
    
    for hint, (maj, min_cat) in pose_hints.items():
        if hint in subcategory:
            if maj in existing_categories and min_cat in existing_categories[maj]:
                return maj, min_cat, subcategory, True
    
    # === QUALITY/TECHNICAL ===
    if any(word in prompt_lower for word in ['best_quality', 'masterpiece', 'detailed', 'quality', 'aesthetic', 'intricate']):
        return '品質', '高品質', subcategory or '品質向上', True
    
    # === TEIST/ARTIST ===
    if any(hint in subcategory for hint in ['絵柄', '画風', '作家', 'デザイナー', 'アーティスト']):
        # Try to find appropriate テイスト subcategory
        if 'テイスト' in existing_categories:
            if 'デザイナー' in existing_categories['テイスト']:
                return 'テイスト', 'デザイナー', subcategory, True
            elif '画風' in existing_categories['テイスト']:
                return 'テイスト', '画風', subcategory, True
            elif 'その他' in existing_categories['テイスト']:
                return 'テイスト', 'その他', subcategory, True
    
    # === LOCATION ANALYSIS ===
    location_hints = {
        '部屋': ('場所', '屋内'),
        'ルーム': ('場所', '屋内'),
        '学校': ('場所', '学校'),
        '教室': ('場所', '学校'),
        '公園': ('場所', '屋外'),
        '海': ('場所', '海'),
        '背景': ('背景', '背景')
    }
    
    for hint, (maj, min_cat) in location_hints.items():
        if hint in subcategory:
            if maj in existing_categories and min_cat in existing_categories[maj]:
                return maj, min_cat, subcategory, True
    
    # === FALLBACK CATEGORIZATION ===
    # Default to その他 with appropriate minor category
    if 'その他' in existing_categories:
        available_minors = existing_categories['その他']
        default_minor = 'その他' if 'その他' in available_minors else available_minors[0] if available_minors else 'その他'
        return 'その他', default_minor, subcategory or '分類困難', True
    
    return None, None, None, True

def extract_character_name(prompt):
    """Extract character name from prompt"""
    # Look for character name patterns
    match = re.search(r'([a-zA-Z_]+)\s*[\(\[]', prompt)
    if match:
        return match.group(1).replace('_', ' ')
    
    # Fallback to first meaningful word
    words = prompt.replace('_', ' ').replace(',', ' ').split()
    for word in words:
        word_clean = word.strip('{}()[]')
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
        'category_changes': defaultdict(int),
        'detailed_changes': defaultdict(lambda: defaultdict(int))
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
                    stats['detailed_changes'][new_major][new_minor] += 1
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
    print("開始: 追加希望.tsvファイルの最終クリーニング処理")
    
    # Load existing categories
    categories = load_existing_categories('categories.txt')
    print(f"既存カテゴリ読み込み完了: {len(categories)}個の大項目")
    
    # Process the file
    stats = process_tsv_file(
        '追加希望.tsv',
        '追加希望_cleaned_final.tsv', 
        '未登録項目_final.tsv',
        categories
    )
    
    print("\n=== 最終クリーニング結果 ===")
    print(f"総エントリ数: {stats['total_entries']}")
    print(f"クリーニング済み: {stats['cleaned_entries']}")
    print(f"未登録項目: {stats['unregistered_entries']}")
    print(f"処理済みカテゴリ数: {len(stats['category_changes'])}")
    
    print("\n=== カテゴリ別詳細分類結果 ===")
    for major_cat, count in sorted(stats['category_changes'].items(), key=lambda x: x[1], reverse=True):
        print(f"{major_cat}: {count}件")
        for minor_cat, minor_count in sorted(stats['detailed_changes'][major_cat].items(), key=lambda x: x[1], reverse=True):
            print(f"  └─ {minor_cat}: {minor_count}件")
    
    print(f"\n出力ファイル:")
    print(f"  - クリーニング済み: 追加希望_cleaned_final.tsv ({stats['total_entries'] - stats['unregistered_entries']}件)")
    if stats['unregistered_entries'] > 0:
        print(f"  - 未登録項目: 未登録項目_final.tsv ({stats['unregistered_entries']}件)")
    else:
        print("  - 未登録項目: なし (全件処理完了)")

if __name__ == "__main__":
    main()