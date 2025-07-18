# Phase 7: アクショナブルインサイト機能 設計書

## 🎯 **機能概要**

Kelly Criterion投資システムの過去データとリアルタイム状況から、**ユーザーが次に取るべき具体的アクションを自動提案**するインテリジェンスシステム。

### **設計コンセプト**
- **予測的**: 問題発生前に改善提案
- **具体的**: 抽象的でなく実行可能な提案
- **学習的**: 提案効果を検証し改善
- **非侵入的**: 判断を強制せず支援に徹する

---

## 🧠 **コア機能設計**

### **1. パフォーマンス改善ポイント抽出**

#### **機能仕様**
```javascript
class PerformanceAnalyzer {
    // 成績低下パターン検出
    detectPerformanceDecline(performanceHistory) {
        const recentPerformance = performanceHistory.slice(-10);
        const previousPerformance = performanceHistory.slice(-20, -10);
        
        return {
            winRateDecline: calculateDecline(recentPerformance, previousPerformance, 'winRate'),
            roiDecline: calculateDecline(recentPerformance, previousPerformance, 'roi'),
            consistencyDecline: calculateVariance(recentPerformance),
            rootCauses: identifyRootCauses(recentPerformance)
        };
    }
}
```

#### **提案例**
- 📉 **勝率低下検出**: "直近5レースの勝率が20%低下 → スコア閾値を75→80に引き上げ推奨"
- 📊 **ROI悪化検出**: "期待値1.1-1.2の候補で収益悪化 → 期待値1.3以上に絞り込み推奨"
- 🎯 **的中パターン変化**: "人気馬での的中率が向上 → 人気層重視戦略への切り替え提案"

#### **UI設計**
```
┌─────────────────────────────────┐
│ ⚠️ パフォーマンス改善提案         │
├─────────────────────────────────┤
│ 📉 勝率低下傾向を検出           │
│ 28.5% → 22.1% (直近5レース)     │
│                                 │
│ 💡 推奨アクション:              │
│ • スコア閾値: 70→75に引き上げ    │
│ • 期待値基準: 1.1→1.2に厳格化   │
│ • 人気層: 4-6番人気を重視       │
│                                 │
│ [提案を適用] [詳細分析] [却下]   │
└─────────────────────────────────┘
```

### **2. リスク調整推奨システム**

#### **機能仕様**
```javascript
class RiskAdjustmentAdvisor {
    analyzeRiskPattern(performanceData, currentRiskMultiplier) {
        const riskMetrics = {
            consecutiveLosses: calculateConsecutiveLosses(performanceData),
            drawdownPeriod: getCurrentDrawdownPeriod(performanceData),
            volatility: calculateVolatility(performanceData),
            kellyOptimality: assessKellyOptimality(performanceData)
        };
        
        return this.generateRiskRecommendation(riskMetrics, currentRiskMultiplier);
    }
}
```

#### **提案ロジック**
- **連敗時**: 3連敗 → リスク倍率0.7x推奨
- **高ボラティリティ**: 分散が高い → 0.8x推奨
- **好調時**: 5連勝 → リスク倍率1.2x推奨
- **Kelly乖離**: 実績がKelly理論から乖離 → 再調整推奨

#### **UI設計**
```
┌─────────────────────────────────┐
│ ⚖️ リスク調整推奨               │
├─────────────────────────────────┤
│ 📊 現在のリスク倍率: 1.0x       │
│ 📈 直近成績: 3連敗              │
│                                 │
│ 💡 推奨リスク調整:              │
│ 1.0x → 0.7x (-30%)              │
│                                 │
│ 📝 調整理由:                    │
│ • 連続損失によるドローダウン防止 │
│ • 資金保護を優先               │
│ • 成績回復後に段階的復帰       │
│                                 │
│ [0.7xに調整] [0.8xに調整] [維持] │
└─────────────────────────────────┘
```

### **3. ポートフォリオ最適化提案**

#### **機能仕様**
```javascript
class PortfolioOptimizer {
    analyzePortfolioEfficiency(currentPortfolio, performanceHistory) {
        return {
            diversificationScore: calculateDiversification(currentPortfolio),
            expectedValueOptimality: assessExpectedValueBalance(currentPortfolio),
            kellyAllocationEfficiency: assessKellyAllocation(currentPortfolio),
            redundantCandidates: identifyRedundantCandidates(currentPortfolio),
            missingOpportunities: identifyMissingOpportunities(currentPortfolio)
        };
    }
}
```

#### **提案例**
- 🎯 **候補削減**: "候補C（Kelly 1.5%）は期待値1.08で効率低 → 除外推奨"
- 📈 **注力強化**: "候補A（Kelly 8%）は高効率 → 投資配分+20%推奨"
- 🔄 **バランス調整**: "メイン候補に偏重 → オプショナル候補を2つ追加推奨"

#### **UI設計**
```
┌─────────────────────────────────┐
│ 📊 ポートフォリオ最適化提案       │
├─────────────────────────────────┤
│ 現在の効率性: 82%               │
│ 改善ポテンシャル: +15%           │
│                                 │
│ 💡 最適化提案:                  │
│                                 │
│ 🔴 除外推奨:                    │
│ • 候補C: Kelly1.5%, 期待値1.08  │
│ • 候補E: Kelly1.2%, 期待値1.06  │
│                                 │
│ 🟢 強化推奨:                    │
│ • 候補A: Kelly8% → 10%に増額    │
│ • 候補B: 新規オプショナル候補   │
│                                 │
│ [提案を適用] [部分適用] [カスタム] │
└─────────────────────────────────┘
```

### **4. 未来予測・シナリオ分析**

#### **機能仕様**
```javascript
class ScenarioAnalyzer {
    generateFutureScenarios(currentPerformance, portfolioConfiguration) {
        const scenarios = {
            conservative: this.simulateScenario(currentPerformance, 0.8),
            realistic: this.simulateScenario(currentPerformance, 1.0),
            optimistic: this.simulateScenario(currentPerformance, 1.2)
        };
        
        return {
            tenRaceProjection: this.projectNRaces(scenarios, 10),
            monthlyProjection: this.projectNRaces(scenarios, 40),
            breakEvenAnalysis: this.calculateBreakEvenPoint(scenarios),
            riskAnalysis: this.assessRiskProbabilities(scenarios)
        };
    }
}
```

#### **提案例**
- 📊 **10レース予測**: "現在の成績継続で10R後の期待収益: +2,500円 (80%信頼区間)"
- 📈 **月間予測**: "今月の目標ROI 15%達成確率: 65%"
- ⚠️ **リスク分析**: "20%ドローダウン到達確率: 15%"

#### **UI設計**
```
┌─────────────────────────────────┐
│ 🔮 未来予測・シナリオ分析        │
├─────────────────────────────────┤
│ 📊 10レース予測 (現在成績ベース)  │
│                                 │
│ 🎯 楽観的: +4,200円 (25%確率)    │
│ 📈 現実的: +2,500円 (50%確率)    │
│ 📉 悲観的: +800円 (25%確率)      │
│                                 │
│ 💡 改善提案:                    │
│ • スコア閾値+5で悲観的→+1,500円  │
│ • リスク倍率0.8xで安全性+20%    │
│                                 │
│ [月間予測] [改善シミュレート] [詳細] │
└─────────────────────────────────┘
```

---

## 🏗️ **システム設計**

### **アーキテクチャ構成**
```
ActionableInsightsManager
├── PerformanceAnalyzer (成績分析)
├── RiskAdjustmentAdvisor (リスク調整)
├── PortfolioOptimizer (ポートフォリオ最適化)
├── ScenarioAnalyzer (シナリオ分析)
├── InsightRenderer (UI表示)
└── ActionHandler (提案実行)
```

### **データフロー**
```
Phase 6 Kelly Data → リアルタイム分析 → インサイト生成 → UI表示 → ユーザーアクション
```

### **提案優先度ルール**
1. **緊急度**: 連敗・大幅損失 → 即座表示
2. **重要度**: ROI改善 → 次回レース前に表示
3. **最適化**: 効率改善 → 定期的に表示

---

## 🎨 **UI/UX設計**

### **メインインサイトパネル**
```
┌─────────────────────────────────┐
│ 💡 アクショナブルインサイト       │
├─────────────────────────────────┤
│ 🔴 緊急: 3連敗でリスク調整推奨   │
│ 🟡 重要: スコア閾値の見直し推奨  │
│ 🟢 最適化: ポートフォリオ改善    │
│                                 │
│ [全提案表示] [設定] [履歴]       │
└─────────────────────────────────┘
```

### **提案詳細モーダル**
```
┌─────────────────────────────────┐
│ 💡 具体的改善提案               │
├─────────────────────────────────┤
│ 📊 現在の問題:                  │
│ • 勝率: 28.5% → 22.1%           │
│ • ROI: 15.2% → 8.7%             │
│                                 │
│ 🎯 推奨アクション:              │
│ • スコア閾値: 70 → 75           │
│ • 期待値基準: 1.1 → 1.2         │
│                                 │
│ 📈 期待効果:                    │
│ • 勝率改善: +5-8%予測           │
│ • ROI改善: +3-5%予測            │
│                                 │
│ [適用] [試算] [保存] [却下]     │
└─────────────────────────────────┘
```

---

## 🔧 **実装仕様**

### **メインクラス構造**
```javascript
class ActionableInsightsManager {
    constructor() {
        this.performanceAnalyzer = new PerformanceAnalyzer();
        this.riskAdvisor = new RiskAdjustmentAdvisor();
        this.portfolioOptimizer = new PortfolioOptimizer();
        this.scenarioAnalyzer = new ScenarioAnalyzer();
        this.insights = [];
        this.insightHistory = [];
    }
}
```

### **提案生成フロー**
1. **データ分析** → 現在の成績・リスク・ポートフォリオ状況
2. **問題検出** → パフォーマンス低下・リスク上昇の兆候
3. **提案生成** → 具体的改善アクション
4. **効果予測** → 提案実行時の期待効果
5. **UI表示** → 優先度順に提案表示

### **学習機能**
- **提案効果測定**: 提案実行前後の成績比較
- **提案精度改善**: 有効な提案パターンの学習
- **個人化**: ユーザー行動パターンに応じた提案調整

---

## 📊 **成功指標**

### **定量指標**
- **提案採用率**: 60%以上
- **提案効果**: 採用提案のROI改善平均+3%
- **警告精度**: 問題発生予測精度80%以上

### **定性指標**
- **納得感**: 提案理由の明確性
- **実行可能性**: 提案の具体性・実現性
- **学習効果**: ユーザーの投資判断スキル向上

---

## 🚀 **開発ロードマップ**

### **Phase 1: 基盤構築**
- ActionableInsightsManager基本実装
- PerformanceAnalyzer実装
- 基本UI作成

### **Phase 2: 機能拡張**
- RiskAdjustmentAdvisor実装
- PortfolioOptimizer実装
- 詳細UI実装

### **Phase 3: 高度機能**
- ScenarioAnalyzer実装
- 学習機能実装
- 統合テスト

### **Phase 4: 最適化**
- パフォーマンス最適化
- UI/UX改善
- 実運用テスト

---

**この設計により、Kelly Criterion投資システムが「データ表示」から「知的判断支援」へと進化し、ユーザーの投資成績向上を積極的に支援するシステムとなります。** 🎯

この設計書を基に、実装を開始しますか？