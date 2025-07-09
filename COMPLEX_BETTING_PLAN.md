# 🎪 複雑馬券種対応 作業計画書

## 📋 プロジェクト概要
**ブランチ**: `feature/complex-betting-types`  
**開始日**: 2025-07-06  
**ベースブランチ**: `main` (ペース分析機能統合済み)  
**目標**: 3連複・3連単・WIN5等の複雑馬券種に対応した推奨システムを実装

## 🎯 対象馬券種

### 1. **3連複（トリプル）**
- **特徴**: 1-2-3着を順位関係なく当てる馬券
- **組み合わせ数**: nC3 = n×(n-1)×(n-2)/6
- **的中率**: 比較的高い（順位不問）
- **期待配当**: 中程度（数十倍〜数百倍）

### 2. **3連単（トリプレット）**
- **特徴**: 1-2-3着を着順通りに当てる馬券
- **組み合わせ数**: nP3 = n×(n-1)×(n-2)
- **的中率**: 低い（順位固定）
- **期待配当**: 高い（数百倍〜数万倍）

### 3. **WIN5（5重勝）**
- **特徴**: 指定5レースの1着を全て当てる馬券
- **組み合わせ数**: 膨大（各レース出走頭数の積）
- **的中率**: 極低（数万分の1〜数百万分の1）
- **期待配当**: 超高配当（数十万円〜数億円）

## 🔧 現状分析

### 既存システム（`js/bettingRecommender.js` 438行）
✅ **実装済み機能**:
- 単勝・複勝推奨
- ワイド推奨（2頭組み合わせ）
- 馬の印分類（◎○▲△）
- 期待値計算（単純馬券）
- 学習機能（的中率追跡）

❌ **未実装機能**:
- 3頭以上の組み合わせ馬券
- 複雑な組み合わせ計算
- 3連複・3連単の期待値計算
- WIN5等の特殊馬券
- 大量組み合わせの効率的処理

## 📊 実装フェーズ

### Phase 1: 3連複推奨機能実装 🎯
**対象ファイル**: `js/bettingRecommender.js`  
**作業内容**:
- [ ] 3連複組み合わせ生成アルゴリズム
- [ ] 3連複期待値計算システム
- [ ] 上位馬3頭ベースの推奨ロジック
- [ ] 人気・穴狙い別の戦略設定
- [ ] 的中確率計算と配当予想

**期待効果**:
- 手堅い3連複推奨で回収率向上
- 単勝・ワイドより高配当を狙える
- ボックス・流し等の買い方提案

### Phase 2: 3連単推奨機能実装 🚀
**対象ファイル**: `js/bettingRecommender.js`（拡張）  
**作業内容**:
- [ ] 3連単組み合わせ生成（順位考慮）
- [ ] 着順予測精度向上アルゴリズム
- [ ] 軸馬設定による効率化
- [ ] フォーメーション買い戦略
- [ ] 高配当期待値計算システム

**期待効果**:
- 一発逆転の高配当狙い
- 軸馬戦略による投資効率化
- 予測精度に応じた買い方調整

### Phase 3: 組み合わせ最適化システム 🧮
**対象ファイル**: `js/combinationOptimizer.js`（新規作成）  
**作業内容**:
- [ ] 大量組み合わせの効率的生成
- [ ] 期待値順ソートアルゴリズム
- [ ] 投資額配分最適化
- [ ] リスク・リターン分析
- [ ] 買い目点数制限機能

**期待効果**:
- 計算効率の大幅向上
- 科学的な投資戦略立案
- 過度な投資の防止

### Phase 4: WIN5対応（オプション） 🎰
**対象ファイル**: `js/win5Calculator.js`（新規作成）  
**作業内容**:
- [ ] 複数レース連携システム
- [ ] 超大量組み合わせ計算
- [ ] 現実的な買い目絞り込み
- [ ] 的中シミュレーション
- [ ] 夢馬券戦略提案

**期待効果**:
- 一攫千金の夢馬券対応
- データドリブンなWIN5戦略
- 現実的な投資額での参加支援

## 🎲 技術仕様

### 組み合わせ計算アルゴリズム
```javascript
// 3連複組み合わせ生成
generateTripleBoxCombinations(horses) {
    const combinations = [];
    for (let i = 0; i < horses.length - 2; i++) {
        for (let j = i + 1; j < horses.length - 1; j++) {
            for (let k = j + 1; k < horses.length; k++) {
                combinations.push([horses[i], horses[j], horses[k]]);
            }
        }
    }
    return combinations;
}

// 3連単組み合わせ生成
generateTripleExactCombinations(horses) {
    const combinations = [];
    for (let i = 0; i < horses.length; i++) {
        for (let j = 0; j < horses.length; j++) {
            if (j !== i) {
                for (let k = 0; k < horses.length; k++) {
                    if (k !== i && k !== j) {
                        combinations.push([horses[i], horses[j], horses[k]]);
                    }
                }
            }
        }
    }
    return combinations;
}
```

### 期待値計算システム
```javascript
// 3連複期待値計算
calculateTripleBoxExpectedValue(combination) {
    const [horse1, horse2, horse3] = combination;
    
    // 各馬の3着以内確率
    const place1 = horse1.placeProbability;
    const place2 = horse2.placeProbability;
    const place3 = horse3.placeProbability;
    
    // 3連複的中確率（順列組み合わせ考慮）
    const hitProbability = this.calculateTripleBoxHitRate(place1, place2, place3);
    
    // 予想配当（オッズから推定）
    const estimatedDividend = this.estimateTripleBoxDividend(horse1, horse2, horse3);
    
    // 期待値計算
    const expectedValue = hitProbability * estimatedDividend;
    
    return {
        combination: [horse1.name, horse2.name, horse3.name],
        hitProbability: hitProbability * 100, // %表示
        estimatedDividend,
        expectedValue,
        efficiency: expectedValue / 100 // 100円投資あたり
    };
}
```

## 📈 成功基準

### 量的指標
- [ ] 3連複推奨機能の動作確認
- [ ] 3連単推奨機能の動作確認
- [ ] 組み合わせ計算の処理速度（1秒以内）
- [ ] 期待値計算の精度検証
- [ ] 既存機能との統合動作

### 質的指標
- [ ] ユーザビリティの向上
- [ ] 投資戦略の多様化
- [ ] 回収率向上の期待
- [ ] システムの安定性維持
- [ ] 予測精度の活用度向上

## 🚨 リスク要因と対策

### 技術的リスク
1. **計算量爆発**: 大量組み合わせによる処理遅延
   - 対策: 効率的アルゴリズム・事前絞り込み
   
2. **精度低下**: 複雑馬券での予測精度悪化
   - 対策: 段階的精度向上・保守的推奨
   
3. **メモリ不足**: 大量データによるブラウザ負荷
   - 対策: ストリーミング処理・分割計算

### 運用的リスク
1. **過度な投資**: 高配当期待による投資額増加
   - 対策: 推奨投資額上限設定・警告表示
   
2. **複雑化**: 機能増加による操作性悪化
   - 対策: シンプルなUI・段階的公開

## 🎯 今後の展開

### 短期目標（1-2週間）
- Phase 1-2の実装完了
- 基本的な3連複・3連単推奨
- 既存システムとの統合

### 中期目標（1ヶ月）
- Phase 3の組み合わせ最適化
- 実データでの精度検証
- ユーザー体験の改善

### 長期目標（2-3ヶ月）
- WIN5等特殊馬券対応
- 機械学習による戦略最適化
- 大規模データ処理の高速化

---

**最終更新**: 2025-07-06  
**策定者**: Claude Code  
**プロジェクト**: 複雑馬券種対応システム実装