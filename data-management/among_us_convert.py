#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('マスターデータ.tsv', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
converted_count = 0

for line in lines:
    if line.startswith('キャラクター\tamong us\t'):
        new_line = line.replace('キャラクター\t', 'キャラクター(男性)\t')
        new_lines.append(new_line)
        converted_count += 1
        parts = line.strip().split('\t')
        print(f"変換: {parts[2] if len(parts) > 2 else ''}")
    else:
        new_lines.append(line)

with open('マスターデータ.tsv', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"\namong us変換完了: {converted_count}名")