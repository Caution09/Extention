#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
未登録項目.tsvの処理スクリプト
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

def categorize_prompt_content(prompt, minor):
    """プロンプトの内容に基づいて適切なカテゴリを推定"""
    prompt_lower = prompt.lower()
    minor_lower = minor.lower()
    
    # キャラクター関連
    if any(keyword in prompt_lower for keyword in ['hololive', 'nijisanji', 'vtuber', 'umamusume', 'blue archive', 'granblue fantasy', 'fate', 'arknights']):
        if 'hololive' in prompt_lower or 'vtuber' in prompt_lower:
            return ('キャラクター', 'Hololive')
        elif 'nijisanji' in prompt_lower:
            return ('キャラクター', 'にじさんじ')
        elif 'umamusume' in prompt_lower:
            return ('キャラクター', 'ウマ娘')
        elif 'blue archive' in prompt_lower:
            return ('キャラクター', 'ブルーアーカイブ')
        elif 'granblue fantasy' in prompt_lower:
            return ('キャラクター', 'グランブルーファンタジー')
        elif 'fate' in prompt_lower:
            return ('キャラクター', 'Fate')
        elif 'arknights' in prompt_lower:
            return ('キャラクター', 'アークナイツ')
    
    # 成人向け関連
    if any(keyword in prompt_lower for keyword in ['nsfw', 'sex', 'penis', 'pussy', 'breast', 'nipple', 'cum', 'rape', 'naked', 'nude']):
        if any(keyword in prompt_lower for keyword in ['milking machine', 'vibrator', 'dildo']):
            return ('成人向け', 'アイテム')
        elif any(keyword in prompt_lower for keyword in ['sex', 'mating', 'missionary', 'doggystyle']):
            return ('成人向け', '性交')
        elif any(keyword in prompt_lower for keyword in ['handjob', 'masturbation', 'self-pleasuring']):
            return ('成人向け', '手淫')
        elif any(keyword in prompt_lower for keyword in ['oral', 'blowjob', 'irrumatio']):
            return ('成人向け', '口淫')
        else:
            return ('成人向け', 'オプション')
    
    # 服装関連
    if any(keyword in prompt_lower for keyword in ['panties', 'thighhighs', 'leotard', 'swimsuit', 'bunnysuit', 'shirt', 'kimono', 'yukata']):
        if 'panties' in prompt_lower:
            return ('服装', '下着')
        elif 'thighhighs' in prompt_lower:
            return ('服装', '靴下')
        elif 'leotard' in prompt_lower:
            return ('服装', '一式')
        elif 'swimsuit' in prompt_lower:
            return ('服装', '一式')
        elif 'bunnysuit' in prompt_lower:
            return ('コスチューム', 'ファンタジー')
        elif any(keyword in prompt_lower for keyword in ['shirt', 'coat', 'skirt']):
            if 'shirt' in prompt_lower:
                return ('服装', 'トップス')
            elif 'coat' in prompt_lower:
                return ('服装', 'アウター')
            elif 'skirt' in prompt_lower:
                return ('服装', 'スカート')
        elif any(keyword in prompt_lower for keyword in ['kimono', 'yukata']):
            return ('服装', '和装')
    
    # 身体関連
    if any(keyword in prompt_lower for keyword in ['breasts', 'chest', 'body', 'skin', 'hair', 'eyes', 'face']):
        if any(keyword in prompt_lower for keyword in ['breasts', 'nipple', 'chest']):
            return ('身体', '胸')
        elif any(keyword in prompt_lower for keyword in ['skin', 'tan', 'dark skin']):
            return ('身体', '肌')
        elif 'hair' in prompt_lower:
            return ('髪', '色')
        elif 'eyes' in prompt_lower:
            return ('顔', '目')
        elif 'face' in prompt_lower:
            return ('顔', '輪郭')
        else:
            return ('身体', '特徴')
    
    # 動作関連
    if any(keyword in prompt_lower for keyword in ['pose', 'standing', 'sitting', 'lying', 'carrying', 'holding', 'grabbing']):
        if any(keyword in prompt_lower for keyword in ['hand', 'arm', 'grabbing']):
            return ('動作', '手・腕の動作')
        elif any(keyword in prompt_lower for keyword in ['leg', 'standing', 'sitting']):
            return ('動作', '脚の動作')
        else:
            return ('動作', '一般')
    
    # 表情・感情関連
    if any(keyword in prompt_lower for keyword in ['smile', 'happy', 'sad', 'angry', 'expression', 'emotion']):
        if any(keyword in prompt_lower for keyword in ['smile', 'seductive']):
            return ('表情・感情', 'ポジティブな感情')
        elif any(keyword in prompt_lower for keyword in ['sad', 'crying']):
            return ('表情・感情', 'ネガティブな感情')
        else:
            return ('表情・感情', 'その他')
    
    # 装飾・アクセサリー関連
    if any(keyword in prompt_lower for keyword in ['mask', 'glasses', 'accessory', 'jewelry', 'pacifier', 'rattle']):
        if any(keyword in prompt_lower for keyword in ['mask', 'fox mask', 'gas mask']):
            return ('装飾', 'その他')
        elif 'glasses' in prompt_lower:
            return ('装飾', '眼鏡')
        else:
            return ('装飾', 'アクセサリー')
    
    # 場所関連
    if any(keyword in prompt_lower for keyword in ['room', 'outdoor', 'school', 'bed', 'toilet']):
        if 'art room' in prompt_lower:
            return ('場所', '学校（室内）')
        elif 'toilet' in prompt_lower:
            return ('場所', '屋内')
        elif 'bed' in prompt_lower:
            return ('場所', '家（室内）')
        else:
            return ('場所', '屋内')
    
    # 品質関連
    if any(keyword in prompt_lower for keyword in ['best quality', 'aesthetic', 'detailed', 'realistic']):
        return ('品質', '高品質')
    
    # カメラワーク関連
    if any(keyword in prompt_lower for keyword in ['pov', 'focus', 'angle', 'view']):
        if 'pov' in prompt_lower:
            return ('カメラワーク', '視点')
        elif 'focus' in prompt_lower:
            return ('カメラワーク', 'フォーカス')
        else:
            return ('カメラワーク', 'その他')
    
    # その他・効果関連
    if any(keyword in prompt_lower for keyword in ['effect', 'light', 'shadow', 'particle']):
        return ('エフェクト', 'エフェクト')
    
    # デフォルト（内容から判定できない場合）
    return None

def reclassify_entry(entry, valid_categories):
    """エントリを適切なカテゴリに再分類"""
    major, middle, minor, prompt = entry['major'], entry['middle'], entry['minor'], entry['prompt']
    
    # 無効なカテゴリを修正
    invalid_categories = ['お気に', 'お気に入り', '未分類', 'Google翻訳', '翻訳中']
    
    if major in invalid_categories or middle in invalid_categories:
        # プロンプトの内容から適切なカテゴリを推定
        suggested_category = categorize_prompt_content(prompt, minor)
        
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
    print("未登録項目の処理を開始します...")
    
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
    with open('cleaned_valid.tsv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f, delimiter='\t')
        for entry in valid_entries:
            writer.writerow([entry['major'], entry['middle'], entry['minor'], entry['prompt']])
    
    # 無効なエントリをTSVファイルに保存
    print("無効なエントリを保存中...")
    with open('未登録項目_filtered.tsv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f, delimiter='\t')
        for entry in invalid_entries:
            writer.writerow([entry['major'], entry['middle'], entry['minor'], entry['prompt']])
    
    # 再分類の詳細レポート
    print("\n再分類の詳細:")
    category_changes = defaultdict(int)
    for entry in valid_entries:
        if entry.get('recategorized', False):
            original = f"{entry.get('original_major', '?')} > {entry.get('original_middle', '?')}"
            new = f"{entry['major']} > {entry['middle']}"
            category_changes[f"{original} → {new}"] += 1
    
    if category_changes:
        print("カテゴリ変更の統計:")
        for change, count in sorted(category_changes.items(), key=lambda x: x[1], reverse=True):
            print(f"  {change}: {count} 件")
    
    # カテゴリ別統計
    print("\n有効エントリのカテゴリ別統計:")
    category_stats = defaultdict(int)
    for entry in valid_entries:
        category_stats[f"{entry['major']} > {entry['middle']}"] += 1
    
    for category, count in sorted(category_stats.items(), key=lambda x: x[1], reverse=True)[:20]:
        print(f"  {category}: {count} 件")
    
    print(f"\n処理完了！")
    print(f"有効なエントリ: cleaned_valid.tsv ({len(valid_entries)} 件)")
    print(f"無効なエントリ: 未登録項目_filtered.tsv ({len(invalid_entries)} 件)")

if __name__ == "__main__":
    main()