#!/bin/bash

# マスターデータソート・クリーニングバッチ
# 使用法: ./sort_and_clean.sh

TSV_FILE="マスターデータ.tsv"
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "マスターデータソート・クリーニング開始..."

# バックアップディレクトリ作成
mkdir -p "$BACKUP_DIR"

# バックアップ作成
echo "バックアップ作成中..."
cp "$TSV_FILE" "$BACKUP_DIR/マスターデータ_backup_$TIMESTAMP.tsv"

# 末尾カンマ削除
echo "末尾カンマ削除中..."
sed -i 's/,\s*$//' "$TSV_FILE"

# ソートと重複削除
echo "ソート・重複削除中..."
sort "$TSV_FILE" | uniq > "${TSV_FILE}_temp"

# 同じ大項目・中項目・Promptの小項目統合
echo "同一プロンプト項目統合中..."
python3 - << 'EOF'
import sys
from collections import OrderedDict

input_file = sys.argv[1] if len(sys.argv) > 1 else "マスターデータ.tsv_temp"
output_file = sys.argv[2] if len(sys.argv) > 2 else "マスターデータ.tsv_consolidated"

seen_keys = OrderedDict()

with open(input_file, 'r', encoding='utf-8') as f:
    for line in f:
        line = line.rstrip('\r\n')
        if line:
            parts = line.split('\t')
            if len(parts) == 4:
                大項目, 中項目, 小項目, prompt = parts
                key = (大項目, 中項目, prompt)
                
                if key in seen_keys:
                    existing_小項目 = seen_keys[key][2]
                    小項目_list = existing_小項目.split(',')
                    if 小項目 not in 小項目_list:
                        seen_keys[key] = (大項目, 中項目, existing_小項目 + ',' + 小項目, prompt)
                else:
                    seen_keys[key] = (大項目, 中項目, 小項目, prompt)

with open(output_file, 'w', encoding='utf-8', newline='') as f:
    for 大項目, 中項目, 小項目, prompt in seen_keys.values():
        f.write(f"{大項目}\t{中項目}\t{小項目}\t{prompt}\n")
EOF

mv "${TSV_FILE}_consolidated" "$TSV_FILE"

# 行数確認
LINE_COUNT=$(wc -l < "$TSV_FILE")
echo "処理完了: $LINE_COUNT 行"

echo "バックアップ: $BACKUP_DIR/マスターデータ_backup_$TIMESTAMP.tsv"
echo "ソート・クリーニング完了!"