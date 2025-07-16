# Phase 7: 可視化・分析ツール 設計書

## 🎯 Phase 7 概要
Phase 6で完成したKelly Criterion資金管理システムの豊富なデータを活用し、包括的な可視化・分析ダッシュボードを構築する。

## 📊 設計コンセプト

### 核心価値
- **透明性**: Kelly計算プロセスの完全可視化
- **追跡性**: パフォーマンス推移の詳細分析
- **学習性**: 改善ポイントの自動発見
- **実用性**: 実戦で役立つリアルタイム情報

## 🏗 Phase 7 アーキテクチャ

### 1. 📈 ポートフォリオ結果ダッシュボード
```javascript
class PortfolioDashboard {
    // リアルタイム投資状況
    - currentPortfolio: メイン候補 + オプショナル候補
    - totalInvestment: 総投資額（Kelly配分）
    - expectedReturn: 期待回収額
    - riskMultiplier: 現在のリスク倍率
    
    // 当日の投資サマリー
    - raceCount: 投資対象レース数
    - avgKellyRatio: 平均Kelly比率
    - portfolioSpread: 投資分散度
    - conflictResolutions: 競合解決履歴
}
```

### 2. 📉 パフォーマンス時系列分析
```javascript
class PerformanceTimeSeriesAnalysis {
    // 成績推移（過去30レース）
    - winRate: 的中率推移
    - roi: ROI推移
    - cumulativeReturn: 累積回収額
    - drawdownPeriods: ドローダウン期間
    
    // リスク調整履歴
    - riskMultiplierHistory: リスク倍率変化ログ
    - adjustmentTriggers: 調整理由の詳細
    - performanceCorrelation: 成績とリスク調整の相関
}
```

### 3. 🔍 候補評価プロセス可視化
```javascript
class CandidateEvaluationVisualization {
    // Kelly選考プロセス
    - scoringBreakdown: 各候補のスコア詳細
    - kellyCalculationSteps: Kelly比率計算過程
    - selectionReason: 採用・落選理由
    - conflictResolutionLog: 競合解決プロセス
    
    // 2段階ポートフォリオ分析
    - mainCandidates: メイン候補選定理由
    - optionalCandidates: オプショナル候補選定理由
    - portfolioBalance: ポートフォリオバランス分析
}
```

## 🎨 UI/UX デザインコンセプト

### メインダッシュボード画面構成
```
┌─────────────────────────────────────────────────────────┐
│ 🏇 Phase 7: Kelly Criterion ダッシュボード              │
├─────────────────────────────────────────────────────────┤
│ 📊 リアルタイム投資状況                                   │
│ ┌─────────────┬─────────────┬─────────────┬──────────┐  │
│ │総投資額: 3,850円│期待回収: 4,400円│ROI: +14.3%│リスク: 0.8x│  │
│ └─────────────┴─────────────┴─────────────┴──────────┘  │
│                                                         │
│ 📈 パフォーマンス推移 (過去20レース)                      │
│ ┌─────────────────────────────────────────────────────┐  │
│ │     勝率%    ROI%    累積収益    リスク倍率           │  │
│ │ 60 ┤   ╭─╮                                          │  │
│ │ 40 ┤ ╭─╯ ╰─╮     ╭──╮                               │  │
│ │ 20 ┤ ╯      ╰─────╯  ╰─                             │  │
│ │  0 └────────────────────────────────────────────────┤  │
│ └─────────────────────────────────────────────────────┘  │
│                                                         │
│ 🎯 今回のポートフォリオ分析                               │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ メイン候補:    オプショナル候補:   競合解決:          │  │
│ │ ◎A馬 Kelly8%   △C馬 Kelly3%      1R-2候補統合        │  │
│ │ ○B馬 Kelly5%   △D馬 Kelly2%      5R-スキップ判定      │  │
│ └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 🛠 技術仕様

### データソース統合
```javascript
// Phase 6システムからのデータ取得
const dataIntegration = {
    kellyManager: window.KellyCapitalManager,
    portfolioData: window.portfolioOptimizationResults,
    riskAdjustments: window.dynamicRiskAdjustments,
    performanceStats: window.performanceStatistics
};
```

### Chart.js 活用グラフ構成
1. **時系列ライングラフ**: 勝率・ROI・累積収益推移
2. **リスク調整ドーナツチャート**: リスク要因別分析
3. **ポートフォリオバーチャート**: Kelly比率分布
4. **散布図**: 期待値 vs Kelly比率

### リアルタイム更新機能
```javascript
class RealTimeUpdater {
    updateInterval: 5000, // 5秒間隔
    watchedMetrics: ['roi', 'winRate', 'riskMultiplier'],
    autoRefresh: true,
    dataValidation: true
};
```

## 📱 レスポンシブ設計

### デスクトップ (1200px+)
- 3列レイアウト: サマリー│グラフ│詳細
- 大型チャート表示
- 詳細ツールチップ

### タブレット (768px-1199px)
- 2列レイアウト: メイン│サブ
- 中型チャート
- スワイプ操作対応

### モバイル (767px以下)
- 1列縦積みレイアウト
- コンパクトチャート
- タッチ操作最適化

## 🔄 データフロー設計

### 入力データ
```
Phase 6 Kelly System Output
├── portfolioResults: ポートフォリオ最適化結果
├── riskAdjustments: 動的リスク調整データ
├── performanceHistory: 過去成績データ
├── conflictResolutions: 競合解決ログ
└── realTimeMetrics: リアルタイム指標
```

### 出力ビジュアライゼーション
```
Dashboard Visualization
├── PortfolioOverview: ポートフォリオ概要
├── PerformanceCharts: パフォーマンスグラフ
├── RiskAnalysis: リスク分析
├── CandidateBreakdown: 候補詳細分析
└── ActionableInsights: 改善提案
```

## 🎯 実装優先順位

### 🥇 Priority 1: Core Dashboard
1. **ポートフォリオ結果表示**: 基本サマリーと投資状況
2. **Kelly計算プロセス可視化**: 候補選定から最終配分まで

### 🥈 Priority 2: Performance Analytics
3. **時系列パフォーマンスグラフ**: 勝率・ROI・累積収益
4. **リスク調整履歴**: 動的調整の詳細分析

### 🥉 Priority 3: Advanced Features
5. **リアルタイム更新**: 自動データ更新機能
6. **予測インサイト**: 将来成績予測とアドバイス

## 📊 成功指標（Phase 7 KPI）

- **視認性**: 重要指標が5秒以内に把握可能
- **理解性**: Kelly計算プロセスが完全に追跡可能
- **実用性**: 投資判断に直接活用できる洞察提供
- **応答性**: モバイルでも快適な操作感

---

**Phase 7は「完全な透明性」と「実用的な洞察」を両立させた理想的な可視化システムを目指します** ✨