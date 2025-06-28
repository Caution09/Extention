#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('マスターデータ.tsv', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 既存のキャラクター()系エントリを収集
existing_characters = set()
reproduction_characters = []
other_lines = []

for line in lines:
    parts = line.strip().split('\t')
    if len(parts) >= 3:
        if parts[0].startswith('キャラクター('):
            # 既存のキャラクター()系エントリ
            key = (parts[1], parts[2])  # (作品名, キャラ名)
            existing_characters.add(key)
            other_lines.append(line)
        elif parts[0] == 'キャラクター再現':
            # 再現エントリを収集
            reproduction_characters.append((parts[1], parts[2]))
        else:
            other_lines.append(line)
    else:
        other_lines.append(line)

# 再現エントリから移行すべきキャラクターを特定
to_migrate = []
for series, character in reproduction_characters:
    key = (series, character)
    if key not in existing_characters:
        to_migrate.append(key)

print(f"移行対象キャラクター: {len(to_migrate)}名")

# 性別推定（簡易版）
def estimate_gender(series, character):
    # 明らかに男性のキャラクター
    male_characters = [
        'アストルフォ', 'ルーデウス', 'サトシ', 'マリオ', 'ルイージ', 'キリト', 'ソラ', 
        'リンク', '上条当麻', '阿良々木暦', '犬夜叉', '弥勒', '殺生丸', 'クラフト・ロレンス',
        '景元', '刃', 'ダン・ヘン', 'ヴェルト', 'サンポ', 'ゲパルト', 'アーラン', 'ルカ',
        '羅刹', 'アベンチュリン', 'ガラガー', 'ブートヒル', '日曜', '穹', 'ルパン三世',
        '次元大介', '石川五ェ門', '銭形警部', 'ルフィ', 'ゾロ', 'サンジ', 'ウソップ',
        '渚カヲル', '碇シンジ', '五条悟', '虎杖悠仁', '伏黒恵', 'レグ', '鏡音レン'
    ]
    
    # 人外キャラクター
    non_human = [
        'コロク', 'モノクマ', 'ポチタ', 'サーナイト', 'キノピオ', 'ヨッシー', 'ナナチ',
        'カービィ', 'デデデ大王', 'チョッパー'
    ]
    
    if character in male_characters:
        return '男性'
    elif character in non_human:
        return '人外'
    else:
        return '女性'  # デフォルト

# 移行エントリを生成
migrated_lines = []
migrated_count = 0

for series, character in to_migrate:
    gender = estimate_gender(series, character)
    # シンプルなプロンプト形式に変換
    if '(' in character:
        # 既に作品名が含まれている場合
        prompt = f"{character.lower().replace(' ', '_')}"
    else:
        # 作品名を追加
        series_short = series.lower().replace(' ', '_').replace('！', '').replace('!', '')
        char_name = character.lower().replace(' ', '_')
        prompt = f"{char_name} ({series_short})"
    
    migrated_line = f"キャラクター({gender})\t{series}\t{character}\t{prompt}\n"
    migrated_lines.append(migrated_line)
    migrated_count += 1
    print(f"移行: {character} ({gender}) - {series}")

# 新しいファイルを作成（キャラクター再現を除外し、移行分を追加）
final_lines = other_lines + migrated_lines

with open('マスターデータ.tsv', 'w', encoding='utf-8') as f:
    f.writelines(final_lines)

print(f"\n処理完了:")
print(f"- キャラクター再現項目を全削除")
print(f"- {migrated_count}名をキャラクター()系に移行")