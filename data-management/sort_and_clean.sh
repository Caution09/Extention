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
mv "${TSV_FILE}_temp" "$TSV_FILE"

# 行数確認
LINE_COUNT=$(wc -l < "$TSV_FILE")
echo "処理完了: $LINE_COUNT 行"

echo "バックアップ: $BACKUP_DIR/マスターデータ_backup_$TIMESTAMP.tsv"
echo "ソート・クリーニング完了!"