# 🎯 拡張推奨システム設計案

## 現在の問題点

### 1. 固定的な印システム
```
現在: ◎○▲△ の4段階固定
問題: 
- 5頭推奨したくても4頭しか印がない
- 信頼度の細かい差を表現できない
- 買い目戦略が印に依存しすぎ
```

### 2. 学習機会の制限
```
現在: 印のついた馬のみ学習対象
問題:
- 穴馬の見逃しを学習できない
- 注目度の段階的調整ができない
- 買い目戦略と馬選定が混在
```

## 新システム設計

### 1. 注目馬リスト（信頼度ベース）

#### A. 信頼度分類
```javascript
const confidenceLevels = {
    highest: { symbol: '◎◎◎', name: '最有力', threshold: 90, color: '#ff1744' },
    high:    { symbol: '◎◎',  name: '有力',   threshold: 70, color: '#ff5722' },
    medium:  { symbol: '◎',   name: '注目',   threshold: 50, color: '#ff9800' },
    watch:   { symbol: '△',   name: '警戒',   threshold: 30, color: '#ffc107' },
    dark:    { symbol: '?',   name: '穴',     threshold: 10, color: '#9e9e9e' }
};
```

#### B. 動的な注目馬選定
```javascript
// 全馬を信頼度でランキング
static generateWatchList(predictions) {
    const watchList = predictions.map(horse => ({
        ...horse,
        confidence: this.calculateConfidence(horse),
        watchLevel: this.getWatchLevel(horse)
    })).sort((a, b) => b.confidence - a.confidence);
    
    return {
        highest: watchList.filter(h => h.confidence >= 90),
        high: watchList.filter(h => h.confidence >= 70 && h.confidence < 90),
        medium: watchList.filter(h => h.confidence >= 50 && h.confidence < 70),
        watch: watchList.filter(h => h.confidence >= 30 && h.confidence < 50),
        dark: watchList.filter(h => h.confidence >= 10 && h.confidence < 30)
    };
}
```

### 2. 買い目推奨システム（戦略ベース）

#### A. 複数戦略の並行表示
```javascript
static generateBettingStrategies(watchList, userProfile = 'balanced') {
    return {
        conservative: {
            name: '🛡️ 安定型',
            strategy: '5-6頭ボックス',
            horses: [...watchList.highest, ...watchList.high].slice(0, 5),
            expectedHitRate: 55,
            investment: 1000
        },
        balanced: {
            name: '⚖️ バランス型', 
            strategy: '3-4頭選抜',
            horses: [...watchList.highest, ...watchList.high].slice(0, 4),
            expectedHitRate: 22,
            investment: 400
        },
        aggressive: {
            name: '🚀 攻撃型',
            strategy: '軸1頭+相手2頭',
            horses: watchList.highest.slice(0, 3),
            expectedHitRate: 8,
            investment: 200
        }
    };
}
```

### 3. 拡張学習システム

#### A. 注目馬の学習
```javascript
static learnWatchListAccuracy(actualResult, watchList) {
    const actualTop3 = actualResult.slice(0, 3);
    
    // 各信頼度レベルの的中状況
    const analysis = {
        highest: this.analyzeConfidenceLevel(watchList.highest, actualTop3),
        high: this.analyzeConfidenceLevel(watchList.high, actualTop3),
        medium: this.analyzeConfidenceLevel(watchList.medium, actualTop3),
        watch: this.analyzeConfidenceLevel(watchList.watch, actualTop3),
        oversights: this.findOversights(watchList, actualTop3) // 見逃し分析
    };
    
    // 信頼度閾値の調整
    this.adjustConfidenceThresholds(analysis);
    
    return analysis;
}
```

#### B. 見逃し学習
```javascript
static findOversights(watchList, actualTop3) {
    const allWatchedHorses = Object.values(watchList).flat();
    const oversights = actualTop3.filter(winner => 
        !allWatchedHorses.find(watched => watched.name === winner.name)
    );
    
    // 見逃した馬の特徴分析
    return oversights.map(horse => ({
        name: horse.name,
        actualPosition: actualTop3.findIndex(h => h.name === horse.name) + 1,
        missedFactors: this.analyzeMissedFactors(horse),
        shouldHaveBeenLevel: this.calculateRetroactiveConfidence(horse)
    }));
}
```

#### C. 戦略別学習
```javascript
static learnStrategyEffectiveness(strategies, actualResult) {
    return Object.entries(strategies).map(([strategyName, strategy]) => {
        const strategyHorses = strategy.horses.map(h => h.name);
        const actualNames = actualResult.map(h => h.name);
        
        // 3連複的中判定
        const tripleBoxHit = this.checkTripleBoxHit(strategyHorses, actualNames);
        
        return {
            strategy: strategyName,
            hit: tripleBoxHit,
            efficiency: this.calculateStrategyEfficiency(strategy, tripleBoxHit),
            adjustment: this.getStrategyAdjustment(strategyName, tripleBoxHit)
        };
    });
}
```

## UI設計

### 1. 注目馬表示
```html
<div class="watch-list-section">
    <h3>🎯 注目馬リスト</h3>
    <div class="confidence-levels">
        <div class="level highest">
            <span class="symbol">◎◎◎</span>
            <span class="label">最有力 (90%+)</span>
            <div class="horses">サンライズホープ, ミラクルスター</div>
        </div>
        <div class="level high">
            <span class="symbol">◎◎</span>
            <span class="label">有力 (70-89%)</span>
            <div class="horses">ゴールデンボルト</div>
        </div>
        <!-- 他の信頼度レベル -->
    </div>
</div>
```

### 2. 戦略別推奨
```html
<div class="betting-strategies">
    <h3>💡 買い目戦略推奨</h3>
    <div class="strategy-grid">
        <div class="strategy conservative">
            <h4>🛡️ 安定型</h4>
            <p>5頭ボックス (的中率55%)</p>
            <div class="horses">◎◎◎サンライズホープ, ◎◎ミラクルスター, ◎ゴールデンボルト, △シルバーアロー, △クリムゾンフレーム</div>
            <div class="investment">投資額: 1,000円</div>
        </div>
        <div class="strategy balanced recommended">
            <h4>⚖️ バランス型 (推奨)</h4>
            <p>4頭選抜 (的中率22%)</p>
            <div class="horses">◎◎◎サンライズホープ, ◎◎ミラクルスター, ◎ゴールデンボルト, △シルバーアロー</div>
            <div class="investment">投資額: 400円</div>
        </div>
        <div class="strategy aggressive">
            <h4>🚀 攻撃型</h4>
            <p>軸流し (的中率8%)</p>
            <div class="horses">軸:◎◎◎サンライズホープ, 相手:◎◎ミラクルスター,◎ゴールデンボルト</div>
            <div class="investment">投資額: 200円</div>
        </div>
    </div>
</div>
```

### 3. 学習入力フィールド
```html
<div class="learning-input-enhanced">
    <h4>🎯 学習データ入力</h4>
    
    <!-- 注目馬の的中状況 -->
    <div class="watch-list-results">
        <h5>注目馬の結果</h5>
        <div class="confidence-results">
            <label>◎◎◎最有力馬の的中状況:</label>
            <select id="highestConfidenceResult">
                <option value="">選択</option>
                <option value="hit_1st">1着的中</option>
                <option value="hit_2nd">2着的中</option>
                <option value="hit_3rd">3着的中</option>
                <option value="miss">3着圏外</option>
            </select>
        </div>
        <!-- 他の信頼度レベル -->
    </div>
    
    <!-- 戦略別結果 -->
    <div class="strategy-results">
        <h5>買い目戦略の結果</h5>
        <div class="strategy-result">
            <label>🛡️安定型5頭ボックス:</label>
            <select id="conservativeStrategyResult">
                <option value="">選択</option>
                <option value="hit">的中</option>
                <option value="miss">外れ</option>
                <option value="not-used">使用せず</option>
            </select>
        </div>
        <!-- 他の戦略 -->
    </div>
    
    <!-- 見逃し分析 -->
    <div class="oversight-analysis">
        <h5>見逃し分析</h5>
        <label>注目度が低すぎた好走馬:</label>
        <input type="text" id="oversightHorses" placeholder="馬名を入力（複数可）">
    </div>
</div>
```

## 実装優先度

### フェーズ1: 基本システム
1. 信頼度ベースの注目馬リスト生成
2. 複数戦略の並行表示
3. 基本的な学習入力

### フェーズ2: 学習強化
1. 注目馬的中率の学習
2. 戦略効率の学習  
3. 見逃し分析の実装

### フェーズ3: 高度化
1. 個人最適化
2. 動的戦略調整
3. 詳細分析レポート

## 期待効果

### 1. 柔軟性向上
- 任意頭数の推奨が可能
- 信頼度の細かい表現
- 複数戦略の同時提示

### 2. 学習精度向上
- 見逃し馬の分析
- 信頼度評価の改善
- 戦略効率の最適化

### 3. ユーザビリティ向上
- 明確な戦略選択
- 理解しやすい信頼度表示
- 継続しやすい学習システム