#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import csv
import re

def analyze_character_extraction():
    """キャラクター項目で問題のあるケースを分析"""
    problematic_cases = []
    
    with open('/mnt/e/Project/Extension/Prompt/非整形マスター.tsv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter='\t')
        for row in reader:
            if len(row) >= 4:
                category = row[0]
                title = row[1]
                subtitle = row[2]
                prompt = row[3]
                
                if category == 'キャラクター':
                    # キャラクター名らしくない場合を検出
                    if re.search(r'^(tareme|tsurime|slender|active|blur|wide-eyed|jitome|whitesmokehair|leopard|messy|twintail|black corset)$', prompt):
                        problematic_cases.append({
                            'title': title,
                            'subtitle': subtitle,
                            'extracted': prompt,
                            'needs_fix': True
                        })
                    elif len(prompt.split()) > 3:  # 長すぎる抽出結果
                        problematic_cases.append({
                            'title': title,
                            'subtitle': subtitle,
                            'extracted': prompt,
                            'needs_fix': True
                        })
    
    print(f"問題のあるケース数: {len(problematic_cases)}")
    for case in problematic_cases:
        print(f"{case['title']} - {case['subtitle']}: {case['extracted']}")

if __name__ == '__main__':
    analyze_character_extraction()