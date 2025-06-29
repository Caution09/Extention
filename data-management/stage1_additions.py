#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pandas as pd
import sys

def main():
    try:
        # 追加希望.tsvを読み込み
        df_wish = pd.read_csv('追加希望.tsv', sep='\t', encoding='utf-8', names=['大項目', '中項目', '小項目', 'Prompt'])
        
        # マスターデータを読み込み
        df_master = pd.read_csv('マスターデータ.tsv', sep='\t', encoding='utf-8', names=['大項目', '中項目', '小項目', 'Prompt'])
        
        # 第1段階: 動作・ポーズ系の項目を分類
        stage1_items = []
        
        # 動作・ポーズ関連キーワードのマッピング
        action_keywords = {
            # 基本動作
            'バランス': ('動作', 'ポーズ'),
            '立つ': ('動作', 'ポーズ'),
            '立ち上がる': ('動作', 'ポーズ'),
            '座る': ('動作', '座る'),
            '立ちバック': ('成人向け', '体位'),
            '仰向け': ('動作', 'ポーズ'),
            'あおむけ': ('動作', 'ポーズ'),
            'あお向け': ('動作', 'ポーズ'),
            'うつぶせ': ('動作', 'ポーズ'),
            '俯瞰': ('カメラワーク', '角度'),
            'アオリ': ('カメラワーク', '角度'),
            'あおり': ('カメラワーク', '角度'),
            '仰望': ('カメラワーク', '角度'),
            
            # 手・腕の動作
            '揉む': ('動作', '手・腕の動作'),
            'ハンド逆': ('動作', '手・腕の動作'),
            'ハンドギャグ': ('動作', '手・腕の動作'),
            '口ふさぎ': ('動作', '手・腕の動作'),
            '押し倒す': ('動作', '手・腕の動作'),
            '手で目を覆う': ('動作', '手・腕の動作'),
            '手を組む': ('動作', '手・腕の動作'),
            '手を組': ('動作', '手・腕の動作'),
            '腕を組む': ('動作', '手・腕の動作'),
            '腕を組': ('動作', '手・腕の動作'),
            '腕を伸ばす': ('動作', '手・腕の動作'),
            '腕を掴む': ('動作', '手・腕の動作'),
            '腕をつかむ': ('動作', '手・腕の動作'),
            '腕をつく': ('動作', '手・腕の動作'),
            '腕を広げて、': ('動作', '手・腕の動作'),
            '肘をつく': ('動作', '手・腕の動作'),
            '肘をかける': ('動作', '手・腕の動作'),
            '手を縛る': ('成人向け', 'SM'),
            '後ろ手に': ('動作', '手・腕の動作'),
            '手を降る': ('動作', '手・腕の動作'),
            '手を頭の後ろ': ('動作', '手・腕の動作'),
            '差し出す': ('動作', '手・腕の動作'),
            '伸ばした': ('動作', '手・腕の動作'),
            '握手': ('動作', '手・腕の動作'),
            '抱きしめる': ('動作', 'しぐさ'),
            '抱える': ('動作', '手・腕の動作'),
            'つかむ': ('動作', '手・腕の動作'),
            'にぎる': ('動作', '手・腕の動作'),
            'つまむ': ('動作', '手・腕の動作'),
            'つねる': ('動作', '手・腕の動作'),
            '指す': ('動作', '指さし'),
            '指さす': ('動作', '指さし'),
            '中指を立てる': ('動作', '指さし'),
            '指をしゃぶる': ('動作', 'しぐさ'),
            
            # 脚・足の動作
            '片足': ('動作', '脚の動作'),
            '片膝を上げる': ('動作', '脚の動作'),
            '脚を組む': ('動作', '脚の動作'),
            '脚を広げて立つ': ('動作', '脚の動作'),
            '脚を伸ばす': ('動作', '脚の動作'),
            '脚を開く': ('動作', '脚の動作'),
            '脚を閉じる': ('動作', '脚の動作'),
            '脚を抱える': ('動作', '脚の動作'),
            '足を伸ばす': ('動作', '脚の動作'),
            '膝を立てる': ('動作', '脚の動作'),
            '膝を抱える': ('動作', '脚の動作'),
            '膝を曲げる': ('動作', '脚の動作'),
            '踏': ('動作', '脚の動作'),
            '踏む': ('動作', '脚の動作'),
            '踏みつけ': ('動作', '脚の動作'),
            '大股': ('動作', '脚の動作'),
            '内また': ('動作', '脚の動作'),
            '歩行': ('動作', '移動'),
            
            # 視線・目線
            '見られている': ('動作', '視線'),
            '衆人環視': ('動作', '視線'),
            '注目を浴びる': ('動作', '視線'),
            '見ている': ('動作', '視線'),
            '見': ('動作', '視線'),
            'こちら': ('動作', '視線'),
            '目線': ('動作', '視線'),
            '睨む': ('動作', '視線'),
            '睨みつける': ('動作', '視線'),
            'にらむ': ('動作', '視線'),
            '見せつけ': ('動作', '視線'),
            '横目': ('動作', '視線'),
            'にら': ('動作', '視線'),
            
            # 体位・ポーズ
            '振り向': ('動作', 'ポーズ'),
            '振りむく': ('動作', 'ポーズ'),
            '半開き': ('動作', 'ポーズ'),
            '正面': ('動作', 'ポーズ'),
            '見開き': ('動作', 'ポーズ'),
            '振る': ('動作', 'ポーズ'),
            'かがむ': ('動作', 'ポーズ'),
            '傾ける': ('動作', 'ポーズ'),
            '傾': ('動作', 'ポーズ'),
            '傾げる': ('動作', 'ポーズ'),
            '首を傾げる': ('動作', 'ポーズ'),
            'うずくまる': ('動作', 'ポーズ'),
            '背中を曲げる': ('動作', 'ポーズ'),
            'うつむく': ('動作', 'ポーズ'),
            '下を向く': ('動作', 'ポーズ'),
            '頭を下げて': ('動作', 'ポーズ'),
            '頭を上げる': ('動作', 'ポーズ'),
            '体をひねる': ('動作', 'ポーズ'),
            'でんぐり返し': ('動作', 'ポーズ'),
            '海老反り': ('動作', 'ポーズ'),
            '反る': ('動作', 'ポーズ'),
            '反らす': ('動作', 'ポーズ'),
            '仰け反る': ('動作', 'ポーズ'),
            'のけぞる': ('動作', 'ポーズ'),
            'のけ反る': ('動作', 'ポーズ'),
            '猫背': ('動作', 'ポーズ'),
            '女の子座り': ('動作', '座る'),
            '座': ('動作', '座る'),
            '椅子に座る': ('動作', '座る'),
            '整列する': ('動作', 'ポーズ'),
            '直立': ('動作', 'ポーズ'),
            '直立不動': ('動作', 'ポーズ'),
            '気を付け': ('動作', 'ポーズ'),
            
            # その他の動作
            '脱ぐ': ('動作', '衣服'),
            '脱がす': ('動作', '衣服'),
            '着替え': ('動作', '衣服'),
            '着替': ('動作', '衣服'),
            '服を脱ぐ': ('動作', '衣服'),
            '服を脱がす': ('動作', '衣服'),
            '服を引っ張る': ('動作', '衣服'),
            '相手の服を脱がす': ('動作', '衣服'),
            '半脱ぎ': ('動作', '衣服'),
            '脱ぎ': ('動作', '衣服'),
            '脱いだ': ('動作', '衣服'),
            'ずらす': ('動作', '衣服'),
            '置換': ('動作', '一般'),
            '締め付け': ('動作', '一般'),
            '食いしばる': ('動作', 'しぐさ'),
            '開く': ('動作', '一般'),
            '開': ('動作', '一般'),
            '閉じる': ('動作', '一般'),
            'leaning': ('動作', 'ポーズ'),
            'spread': ('動作', 'ポーズ'),
            'stand': ('動作', 'ポーズ'),
            'sit': ('動作', '座る'),
            'lying': ('動作', 'ポーズ'),
            'bend': ('動作', 'ポーズ'),
            'turn': ('動作', 'ポーズ'),
            'tilt': ('動作', 'ポーズ'),
        }
        
        # 各項目をチェックして分類
        for index, row in df_wish.iterrows():
            小項目 = str(row['小項目']) if pd.notna(row['小項目']) else ''
            prompt = str(row['Prompt']) if pd.notna(row['Prompt']) else ''
            
            # キーワードマッチング
            for keyword, (大項目, 中項目) in action_keywords.items():
                if keyword in 小項目 or keyword in prompt:
                    stage1_items.append({
                        '大項目': 大項目,
                        '中項目': 中項目,
                        '小項目': 小項目,
                        'Prompt': prompt
                    })
                    break
        
        print(f"第1段階: {len(stage1_items)}個の項目を抽出しました")
        
        # マスターデータに追加
        if stage1_items:
            df_new = pd.DataFrame(stage1_items)
            df_combined = pd.concat([df_master, df_new], ignore_index=True)
            df_combined.to_csv('マスターデータ.tsv', sep='\t', index=False, header=False, encoding='utf-8')
            print(f"マスターデータに{len(stage1_items)}個の項目を追加しました")
        
        # 処理済み項目を追加希望.tsvから削除
        processed_items = set()
        for item in stage1_items:
            processed_items.add(item['小項目'])
        
        df_remaining = df_wish[~df_wish['小項目'].isin(processed_items)]
        df_remaining.to_csv('追加希望.tsv', sep='\t', index=False, header=False, encoding='utf-8')
        
        print(f"残り項目数: {len(df_remaining)}")
        
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()