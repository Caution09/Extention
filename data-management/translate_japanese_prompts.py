#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re

def translate_japanese_to_english(prompt):
    """日本語プロンプトを英語に翻訳"""
    
    # 翻訳辞書
    translation_dict = {
        # 視覚・技術効果
        '見える空気': 'visible air',
        '鏡張りの床': 'mirror floor',
        '様式便器': 'western toilet',
        '画面外': 'off screen',
        '断面図': 'cross section',
        '仰望': 'looking up',
        
        # キャラクター
        '織姫': 'orihime',
        
        # シチュエーション
        '結婚': 'wedding',
        '寝取': 'netori',
        '寝取られ': 'netorare',
        '浮気': 'cheating',
        '覗き見': 'peeking',
        '陰毛剃り跡': 'pubic stubble',
        '名刺': 'business card',
        '保健': 'health',
        '日本語教育': 'japanese education',
        
        # デザイナー・テイスト
        '朝凪': 'asanagi',
        '和風': 'japanese style',
        '東洋': 'oriental',
        '空想': 'fantasy',
        
        # 位置・方向
        '右向き': 'facing right',
        '周囲': 'around',
        '横向け枕': 'sideways pillow',
        '横向け': 'sideways',
        '遠近': 'perspective',
        '顔が近い': 'close face',
        
        # 形容詞・状態
        '伝説': 'legendary',
        '一枚': 'single sheet',
        '小顔': 'small face',
        
        # 動作・ポーズ
        '猫背': 'hunched back',
        '直立不動': 'standing at attention',
        '穴開き': 'hole opening',
        '大股': 'wide stride',
        '脱いだ下着': 'removed underwear',
        
        # 視線
        '横目': 'sideways glance',
        '見せ槍': 'showing spear',
        '見切': 'cut off',
        '見切れ': 'partially visible',
        '見開き': 'wide open',
        
        # 品質・テンプレート
        'しゃがみ騎乗位': 'squatting cowgirl position',
        '傑作': 'masterpiece',
        '別衣装': 'alternate costume',
        '刺激': 'stimulation',
        '口に手': 'hand on mouth',
        '女王様': 'dominatrix',
        '相手の手首を掴む': 'holding another\'s wrist',
        '腕組み': 'arms crossed',
        
        # メタ
        '同人誌表紙': 'doujin cover',
        '著作権': 'copyright',
        
        # 場所
        '下駄箱': 'shoe locker',
        '理科室': 'science room',
        '体育倉庫': 'gym storage',
        '美術室': 'art room',
        '音楽室': 'music room',
        '屋上': 'rooftop',
        '温泉': 'hot spring',
        '公衆浴場': 'public bath',
        '銭湯': 'sento',
        '脱衣所': 'changing room',
        
        # 属性・身体
        '種族': 'race',
        '男女共通': 'unisex',
        '筋肉質': 'muscular',
        '体格': 'physique',
        '細身': 'slender',
        '巨乳': 'large breasts',
        '貧乳': 'small breasts',
        
        # 成人向け
        '必須タグ': 'required tag',
        'イマラチオ': 'deepthroat',
        '騎乗位': 'cowgirl position',
        '正常位': 'missionary position',
        '後背位': 'doggy style',
        '立位': 'standing position',
        '挿入': 'insertion',
        '射精': 'ejaculation',
        '絶頂': 'climax',
        '前戯': 'foreplay',
        '愛撫': 'caressing',
        '手コキ': 'handjob',
        '乳首': 'nipple',
        '乳輪': 'areola',
        '陰部': 'genitals',
        
        # 服装
        '制服': 'uniform',
        '水着': 'swimsuit',
        '下着': 'underwear',
        'パンツ': 'panties',
        'ブラジャー': 'bra',
        '靴下': 'socks',
        '靴': 'shoes',
        '帽子': 'hat',
        '眼鏡': 'glasses',
        
        # 髪・顔
        '髪色': 'hair color',
        '髪型': 'hairstyle',
        'ツインテール': 'twintails',
        'ポニーテール': 'ponytail',
        'おさげ': 'braids',
        '前髪': 'bangs',
        '瞳の色': 'eye color',
        '表情': 'expression',
        '笑顔': 'smile',
        '困った顔': 'troubled expression',
        '怒り顔': 'angry expression',
        
        # エフェクト
        '光': 'light',
        '影': 'shadow',
        '炎': 'fire',
        '水': 'water',
        '雷': 'lightning',
        '風': 'wind',
        '雪': 'snow',
        '雨': 'rain',
        '桜': 'cherry blossoms',
        '花びら': 'petals',
        
        # 動物・生物
        '猫': 'cat',
        '犬': 'dog',
        '鳥': 'bird',
        '魚': 'fish',
        '蝶': 'butterfly',
        '花': 'flower',
        '植物': 'plant',
        '木': 'tree',
        
        # オブジェクト
        '机': 'desk',
        '椅子': 'chair',
        'ベッド': 'bed',
        '本': 'book',
        '鞄': 'bag',
        '傘': 'umbrella',
        '時計': 'clock',
        '鏡': 'mirror',
        '窓': 'window',
        'ドア': 'door',
        
        # 背景・場所
        '教室': 'classroom',
        '図書館': 'library',
        '廊下': 'hallway',
        '階段': 'stairs',
        '公園': 'park',
        '海': 'ocean',
        '山': 'mountain',
        '空': 'sky',
        '雲': 'clouds',
        '星': 'stars',
        '月': 'moon',
        '太陽': 'sun',
        
        # 時間・季節
        '朝': 'morning',
        '昼': 'noon',
        '夕方': 'evening',
        '夜': 'night',
        '春': 'spring',
        '夏': 'summer',
        '秋': 'autumn',
        '冬': 'winter',
        
        # 修飾語
        '美しい': 'beautiful',
        '可愛い': 'cute',
        '綺麗': 'pretty',
        '格好いい': 'cool',
        '大きい': 'big',
        '小さい': 'small',
        '高い': 'tall',
        '低い': 'short',
        '明るい': 'bright',
        '暗い': 'dark',
        '温かい': 'warm',
        '冷たい': 'cold',
        '新しい': 'new',
        '古い': 'old',
        
        # 場所関連
        '便所': 'toilet',
        '地下室': 'basement',
        '旅籠': 'inn',
        '部分的に水中': 'partially underwater',
        
        # 時間・天候
        '夕焼': 'sunset',
        '夕焼け': 'sunset',
        
        # 属性・性質
        '悪党': 'villain',
        '年の差': 'age gap',
        '年齢': 'age',
        '大人大人': 'adult',
        
        # 成人向け - SM
        '手錠': 'handcuffs',
        '拘束': 'restraint',
        
        # 成人向け - スカトロ
        '失禁': 'incontinence',
        '糞尿': 'scat',
        
        # 成人向け - 前戯
        '舌出し': 'tongue out',
        
        # 成人向け - 射精
        '中出し': 'creampie',
        '帽子内射精': 'cum in hat',
        '精液': 'semen',
        '顔に精液': 'cum on face',
        
        # 成人向け - 性器
        '勃起': 'erection',
        '包皮': 'foreskin',
        '子宮口': 'cervix',
        '陰嚢': 'scrotum',
        
        # 成人向け - 挿入
        '壁越し': 'through wall',
        '深い挿入': 'deep penetration',
        
        # 成人向け - 肌・胸
        '唾液の筋': 'saliva trail',
        '胸の影': 'breast shadow',
        '胸元': 'cleavage',
        
        # 服装
        '勝負服': 'competition outfit',
        '部族衣装': 'tribal outfit',
        '着衣女性': 'clothed female',
        '学校の体操着': 'school gym uniform',
        '甲冑': 'armor',
        
        # 照明
        '逆光': 'backlight',
        
        # 表情・感情
        '嫌がる': 'reluctant',
        '疲労': 'exhausted',
        '勝利': 'victory',
        '興奮': 'excited',
        '泥酔': 'drunk',
        '失神': 'unconscious',
        '我慢の表情': 'enduring expression',
        '集中': 'focused',
        
        # 装飾・身体
        '口紅': 'lipstick',
        '泥汚れ': 'muddy',
        '薄目': 'half-closed eyes',
        
        # その他
        '上半身': 'upper body',
        '下半身': 'lower body',
        '全身': 'full body',
        '顔': 'face',
        '手': 'hand',
        '足': 'foot',
        '腕': 'arm',
        '脚': 'leg',
        '肩': 'shoulder',
        '首': 'neck',
        '胸': 'chest',
        '背中': 'back',
        '腰': 'waist',
        '尻': 'butt',
    }
    
    # 辞書にあれば翻訳
    if prompt in translation_dict:
        return translation_dict[prompt]
    
    # 辞書にない場合はそのまま返す（手動確認が必要）
    return prompt

def main():
    try:
        # 現在のマスターデータをバックアップ
        import shutil
        from datetime import datetime
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = f"backups/マスターデータ_before_prompt_translation_{timestamp}.tsv"
        shutil.copy('マスターデータ.tsv', backup_path)
        print(f"バックアップを作成しました: {backup_path}")
        
        # 修正対象ファイルを読み込み
        with open('japanese_prompt_items_to_fix.tsv', 'r', encoding='utf-8') as f:
            fix_lines = f.readlines()
        
        # マスターデータを読み込み
        with open('マスターデータ.tsv', 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # 修正対象を辞書に変換（検索用）
        fix_dict = {}
        for line in fix_lines:
            line = line.strip()
            if line:
                parts = line.split('\t')
                if len(parts) >= 4:
                    key = f"{parts[0]}\t{parts[1]}\t{parts[2]}\t{parts[3]}"
                    fix_dict[key] = True
        
        # 修正カウンター
        translated_count = 0
        updated_lines = []
        
        # マスターデータの各行をチェック・翻訳
        for line in lines:
            line = line.strip()
            if not line:
                updated_lines.append(line)
                continue
                
            parts = line.split('\t')
            if len(parts) >= 4:
                大項目 = parts[0]
                中項目 = parts[1]
                小項目 = parts[2]
                prompt = parts[3]
                
                # 修正対象かチェック
                key = f"{大項目}\t{中項目}\t{小項目}\t{prompt}"
                if key in fix_dict:
                    # 翻訳実行
                    new_prompt = translate_japanese_to_english(prompt)
                    if new_prompt != prompt:
                        translated_count += 1
                        print(f"翻訳: {prompt} → {new_prompt}")
                        # 新しい行を作成
                        new_line = f"{大項目}\t{中項目}\t{小項目}\t{new_prompt}"
                        updated_lines.append(new_line)
                    else:
                        print(f"翻訳辞書なし（要手動確認）: {prompt}")
                        updated_lines.append(line)
                else:
                    updated_lines.append(line)
            else:
                updated_lines.append(line)
        
        # 更新されたデータを書き込み
        with open('マスターデータ.tsv', 'w', encoding='utf-8') as f:
            for line in updated_lines:
                f.write(line + '\n')
        
        print(f"\n翻訳完了: {translated_count}個の項目を翻訳しました")
        print(f"マスターデータ.tsvを更新しました")
        
    except Exception as e:
        print(f"エラーが発生しました: {e}")

if __name__ == "__main__":
    main()