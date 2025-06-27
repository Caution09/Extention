#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TSVファイルからdefault-master.jsを生成するスクリプト
"""

import csv
import json
import os
from datetime import datetime

def tsv_to_js(tsv_file, js_file):
    """TSVファイルをJavaScriptファイルに変換"""
    
    data_objects = []
    
    # TSVファイルを読み込み
    with open(tsv_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter='\t')
        
        for row in reader:
            if len(row) >= 4:
                # 各行をJavaScriptオブジェクト形式に変換
                obj = {
                    "0": row[0],  # 大項目
                    "1": row[1],  # 中項目
                    "2": row[2],  # 小項目
                    "3": row[3],  # Prompt
                    "4": ""       # 空の5番目のフィールド
                }
                data_objects.append(obj)
    
    # JavaScriptファイルとして出力
    with open(js_file, 'w', encoding='utf-8') as f:
        f.write('let defaultMaster = {\n')
        f.write('  version: 2,\n')
        f.write('  data: [\n')
        
        for i, obj in enumerate(data_objects):
            f.write('  {\n')
            f.write(f'    "0": {json.dumps(obj["0"], ensure_ascii=False)},\n')
            f.write(f'    "1": {json.dumps(obj["1"], ensure_ascii=False)},\n')
            f.write(f'    "2": {json.dumps(obj["2"], ensure_ascii=False)},\n')
            f.write(f'    "3": {json.dumps(obj["3"], ensure_ascii=False)},\n')
            f.write(f'    "4": {json.dumps(obj["4"], ensure_ascii=False)}\n')
            
            if i < len(data_objects) - 1:
                f.write('  },\n')
            else:
                f.write('  }\n')
        
        f.write('  ]\n')
        f.write('};\n')
        f.write('\n')
        f.write('// 互換性のためのエクスポート\n')
        f.write('if (typeof module !== "undefined" && module.exports) {\n')
        f.write('  module.exports = defaultMaster;\n')
        f.write('}\n')

def main():
    """メイン処理"""
    input_file = '/mnt/e/Project/Extension/Prompt/data-management/マスターデータ.tsv'
    output_file = '/mnt/e/Project/Extension/Prompt/assets/master/default-master.js'
    
    # バックアップファイル名を生成
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = f'/mnt/e/Project/Extension/Prompt/assets/master/default-master_backup_{timestamp}.js'
    
    # 既存ファイルのバックアップ
    if os.path.exists(output_file):
        print(f"既存ファイルをバックアップ: {backup_file}")
        with open(output_file, 'r', encoding='utf-8') as src:
            with open(backup_file, 'w', encoding='utf-8') as dst:
                dst.write(src.read())
    
    # TSVからJSファイルを生成
    print(f"TSVファイルを読み込み: {input_file}")
    tsv_to_js(input_file, output_file)
    print(f"default-master.jsを生成: {output_file}")
    
    # 統計情報を表示
    with open(input_file, 'r', encoding='utf-8') as f:
        line_count = sum(1 for line in f)
    
    print(f"処理完了: {line_count} 行のデータを変換しました")

if __name__ == '__main__':
    main()