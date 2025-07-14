// 拡張推奨システム
class EnhancedRecommendationSystem {
    // 信頼度レベルの定義（より現実的な閾値）
    static confidenceLevels = {
        highest: { symbol: '◎◎◎', name: '最有力', threshold: 75, color: '#d32f2f', bgColor: '#ffebee' },
        high:    { symbol: '◎◎',  name: '有力',   threshold: 60, color: '#f57c00', bgColor: '#fff3e0' },
        medium:  { symbol: '◎',   name: '注目',   threshold: 45, color: '#fbc02d', bgColor: '#fffde7' },
        watch:   { symbol: '△',   name: '警戒',   threshold: 30, color: '#689f38', bgColor: '#f1f8e9' },
        dark:    { symbol: '?',   name: '穴',     threshold: 0,  color: '#616161', bgColor: '#fafafa' }
    };

    // 買い目戦略の定義
    static strategies = {
        conservative: {
            name: '🛡️ 安定型',
            description: '5-6頭ボックス',
            targetHorses: 5,
            expectedHitRate: 55,
            baseInvestment: 1000,
            riskLevel: 'low'
        },
        balanced: {
            name: '⚖️ バランス型',
            description: '3-4頭選抜',
            targetHorses: 4,
            expectedHitRate: 22,
            baseInvestment: 400,
            riskLevel: 'medium'
        },
        aggressive: {
            name: '🚀 攻撃型',
            description: '軸1頭+相手2頭',
            targetHorses: 3,
            expectedHitRate: 8,
            baseInvestment: 200,
            riskLevel: 'high'
        }
    };

    // 馬の信頼度計算（学習機能統合版）
    static calculateHorseConfidence(horse) {
        let confidence = 0;
        
        // 基礎点: 勝率を重視（的中の可能性）
        confidence += Math.min(horse.winProbability * 2.5, 50);
        
        // 複勝率による安定性（重要度UP）
        if (horse.placeProbability > 70) confidence += 15;
        else if (horse.placeProbability > 50) confidence += 10;
        else if (horse.placeProbability > 30) confidence += 5;
        
        // オッズによる現実的な調整
        if (horse.odds <= 2) confidence += 20;        // 大本命
        else if (horse.odds <= 3) confidence += 15;   // 本命
        else if (horse.odds <= 5) confidence += 10;   // 人気馬
        else if (horse.odds <= 8) confidence += 5;    // 中人気
        else if (horse.odds <= 15) confidence += 0;   // 中穴
        else if (horse.odds <= 30) confidence -= 5;   // 穴馬
        else confidence -= 10;                        // 大穴
        
        // 期待値による補正（控えめに）
        if (horse.winExpectedValue > 1.2) confidence += 10;
        else if (horse.winExpectedValue > 1.0) confidence += 5;
        else if (horse.winExpectedValue < 0.8) confidence -= 5;
        
        // 投資効率による補正（控えめに）
        if (horse.efficiencyScore && horse.efficiencyScore > 85) confidence += 8;
        else if (horse.efficiencyScore && horse.efficiencyScore > 70) confidence += 5;
        else if (horse.efficiencyScore && horse.efficiencyScore < 50) confidence -= 3;
        
        // スコアによる補正
        if (horse.score > 80) confidence += 10;
        else if (horse.score > 70) confidence += 5;
        else if (horse.score < 50) confidence -= 5;
        
        // 🆕 アンサンブルスコア統合（Phase 3改善）
        if (horse.enhancedScore && horse.ensembleConfidence) {
            const ensembleBonus = (horse.enhancedScore * horse.ensembleConfidence) * 0.15;
            confidence += ensembleBonus;
            console.log(`🧠 ${horse.name}: アンサンブルボーナス +${ensembleBonus.toFixed(1)}`);
        }
        
        // 🆕 学習データ統合（BettingRecommenderと同等）
        if (typeof LearningSystem !== 'undefined') {
            const learningData = LearningSystem.getLearningData();
            if (learningData.adjustments) {
                const adj = learningData.adjustments;
                
                // 学習による信頼度補正
                if (horse.winProbability > 15) confidence *= adj.winProbabilityWeight || 1;
                if (horse.placeProbability > 50) confidence *= adj.placeProbabilityWeight || 1;
                if (horse.odds <= 5) confidence *= adj.oddsWeight || 1;
            }
        }
        
        console.log(`🎯 ${horse.name}: 勝率${horse.winProbability}%, オッズ${horse.odds}倍, 複勝率${horse.placeProbability}%, スコア${horse.score} → 信頼度${confidence.toFixed(1)}`);
        
        return Math.min(Math.max(confidence, 0), 100);
    }

    // 信頼度レベルの判定
    static getConfidenceLevel(confidence) {
        if (confidence >= this.confidenceLevels.highest.threshold) return 'highest';
        if (confidence >= this.confidenceLevels.high.threshold) return 'high';
        if (confidence >= this.confidenceLevels.medium.threshold) return 'medium';
        if (confidence >= this.confidenceLevels.watch.threshold) return 'watch';
        return 'dark';
    }

    // 注目馬リストの生成
    static generateWatchList(predictions) {
        const horsesWithConfidence = predictions.map(horse => ({
            ...horse,
            confidence: this.calculateHorseConfidence(horse),
            confidenceLevel: null
        }));

        // 信頼度でソート
        horsesWithConfidence.sort((a, b) => b.confidence - a.confidence);

        // 動的閾値調整
        const adjustedThresholds = this.adjustThresholdsDynamically(horsesWithConfidence);
        
        // 信頼度レベルを設定
        horsesWithConfidence.forEach(horse => {
            horse.confidenceLevel = this.getConfidenceLevelDynamic(horse.confidence, adjustedThresholds);
        });

        // レベル別に分類
        const watchList = {};
        Object.keys(this.confidenceLevels).forEach(level => {
            watchList[level] = horsesWithConfidence.filter(h => h.confidenceLevel === level);
        });

        console.log('🎯 注目馬分類結果:', {
            thresholds: adjustedThresholds,
            distribution: Object.fromEntries(
                Object.entries(watchList).map(([level, horses]) => [level, horses.length])
            )
        });

        return {
            all: horsesWithConfidence,
            byLevel: watchList,
            summary: this.generateWatchListSummary(watchList),
            adjustedThresholds: adjustedThresholds
        };
    }

    // 動的閾値調整
    static adjustThresholdsDynamically(horses) {
        if (horses.length === 0) return this.confidenceLevels;

        const confidenceValues = horses.map(h => h.confidence).sort((a, b) => b - a);
        const horseCount = horses.length;
        
        // 馬数に応じた分布調整
        let adjustedThresholds = { ...this.confidenceLevels };
        
        if (horseCount <= 8) {
            // 少頭数: より厳格に
            adjustedThresholds.highest.threshold = Math.max(confidenceValues[0] - 5, 70);
            adjustedThresholds.high.threshold = Math.max(confidenceValues[Math.min(1, horseCount - 1)] - 5, 55);
            adjustedThresholds.medium.threshold = Math.max(confidenceValues[Math.min(2, horseCount - 1)] - 5, 40);
            adjustedThresholds.watch.threshold = Math.max(confidenceValues[Math.min(3, horseCount - 1)] - 5, 25);
        } else if (horseCount >= 16) {
            // 大頭数: より緩く
            adjustedThresholds.highest.threshold = Math.max(confidenceValues[0] - 10, 65);
            adjustedThresholds.high.threshold = Math.max(confidenceValues[2] - 5, 50);
            adjustedThresholds.medium.threshold = Math.max(confidenceValues[4] - 5, 35);
            adjustedThresholds.watch.threshold = Math.max(confidenceValues[7] - 5, 20);
        } else {
            // 標準頭数: 相対的に調整
            const topConfidence = confidenceValues[0];
            const range = topConfidence - confidenceValues[horseCount - 1];
            
            if (range < 20) {
                // 信頼度の差が小さい場合、固定閾値を下げる
                adjustedThresholds.highest.threshold = topConfidence - 5;
                adjustedThresholds.high.threshold = topConfidence - 10;
                adjustedThresholds.medium.threshold = topConfidence - 15;
                adjustedThresholds.watch.threshold = topConfidence - 20;
            }
        }

        return adjustedThresholds;
    }

    // 動的閾値による信頼度レベル判定
    static getConfidenceLevelDynamic(confidence, adjustedThresholds) {
        if (confidence >= adjustedThresholds.highest.threshold) return 'highest';
        if (confidence >= adjustedThresholds.high.threshold) return 'high';
        if (confidence >= adjustedThresholds.medium.threshold) return 'medium';
        if (confidence >= adjustedThresholds.watch.threshold) return 'watch';
        return 'dark';
    }

    // 注目馬リストのサマリー生成
    static generateWatchListSummary(watchList) {
        const summary = {};
        Object.entries(this.confidenceLevels).forEach(([level, config]) => {
            const horses = watchList[level] || [];
            summary[level] = {
                count: horses.length,
                horses: horses.map(h => h.name),
                avgConfidence: horses.length > 0 ? 
                    horses.reduce((sum, h) => sum + h.confidence, 0) / horses.length : 0
            };
        });
        return summary;
    }

    // 買い目戦略の生成
    static generateBettingStrategies(watchList, userProfile = 'balanced') {
        const strategies = {};
        const allWatchedHorses = watchList.all;

        Object.entries(this.strategies).forEach(([strategyKey, strategyConfig]) => {
            const selectedHorses = this.selectHorsesForStrategy(allWatchedHorses, strategyConfig);
            
            strategies[strategyKey] = {
                ...strategyConfig,
                horses: selectedHorses,
                combinations: this.calculateCombinations(selectedHorses.length, 'tripleBox'),
                totalInvestment: this.calculateTotalInvestment(selectedHorses.length, strategyConfig.baseInvestment),
                expectedValue: this.calculateStrategyExpectedValue(selectedHorses, strategyConfig),
                recommended: strategyKey === userProfile
            };
        });

        return strategies;
    }

    // 戦略用馬選定
    static selectHorsesForStrategy(horses, strategyConfig) {
        const targetCount = strategyConfig.targetHorses;
        
        // 戦略に応じた選定ロジック
        if (strategyConfig.riskLevel === 'low') {
            // 安定型: 上位馬を多めに選択
            return horses.slice(0, Math.min(targetCount + 1, horses.length));
        } else if (strategyConfig.riskLevel === 'high') {
            // 攻撃型: 最有力馬中心
            const topHorses = horses.filter(h => h.confidenceLevel === 'highest');
            const highHorses = horses.filter(h => h.confidenceLevel === 'high');
            
            return [...topHorses, ...highHorses].slice(0, targetCount);
        } else {
            // バランス型: 標準的な選択
            return horses.slice(0, targetCount);
        }
    }

    // 組み合わせ数計算
    static calculateCombinations(horseCount, type = 'tripleBox') {
        if (type === 'tripleBox') {
            return horseCount >= 3 ? (horseCount * (horseCount - 1) * (horseCount - 2)) / 6 : 0;
        } else if (type === 'tripleExact') {
            return horseCount >= 3 ? horseCount * (horseCount - 1) * (horseCount - 2) : 0;
        }
        return 0;
    }

    // 総投資額計算
    static calculateTotalInvestment(horseCount, baseInvestment) {
        const combinations = this.calculateCombinations(horseCount, 'tripleBox');
        return combinations * (baseInvestment / 10); // 基準額を調整
    }

    // 戦略期待値計算
    static calculateStrategyExpectedValue(horses, strategyConfig) {
        if (horses.length === 0) return 0;
        
        const avgWinProb = horses.reduce((sum, h) => sum + h.winProbability, 0) / horses.length;
        const avgExpectedValue = horses.reduce((sum, h) => sum + (h.winExpectedValue || 1.0), 0) / horses.length;
        
        // 戦略のリスクレベルに応じた期待値調整
        const riskMultiplier = {
            'low': 0.8,    // 安定型は保守的
            'medium': 1.0, // バランス型は標準
            'high': 1.2    // 攻撃型は積極的
        };
        
        return avgExpectedValue * (riskMultiplier[strategyConfig.riskLevel] || 1.0);
    }

    // 拡張推奨の表示
    static displayEnhancedRecommendations(predictions, containerId = 'enhancedRecommendations') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Enhanced recommendations container not found');
            return;
        }

        const watchList = this.generateWatchList(predictions);
        const strategies = this.generateBettingStrategies(watchList);

        let html = `
            <div class="enhanced-recommendations">
                <h3 style="color: #1976d2; margin-bottom: 20px;">🎯 拡張推奨システム</h3>
                
                <!-- 注目馬リスト -->
                <div class="watch-list-section" style="margin-bottom: 30px;">
                    <h4 style="color: #424242; margin-bottom: 15px;">🏇 注目馬リスト（信頼度別）</h4>
                    <div class="confidence-levels">
        `;

        // 信頼度レベル別表示
        Object.entries(this.confidenceLevels).forEach(([level, config]) => {
            const horses = watchList.byLevel[level] || [];
            if (horses.length > 0) {
                html += `
                    <div class="confidence-level" style="margin: 10px 0; padding: 12px; border-radius: 8px; background: ${config.bgColor}; border-left: 4px solid ${config.color};">
                        <div style="display: flex; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 1.2em; font-weight: bold; color: ${config.color}; margin-right: 10px;">${config.symbol}</span>
                            <span style="font-weight: bold; color: ${config.color};">${config.name} (${config.threshold}%+)</span>
                            <span style="margin-left: auto; font-size: 0.9em; color: #666;">${horses.length}頭</span>
                        </div>
                        <div class="horses-list">
                `;
                
                horses.forEach((horse, index) => {
                    html += `
                        <span style="display: inline-block; margin: 2px 8px 2px 0; padding: 4px 8px; background: white; border-radius: 4px; font-size: 0.9em;">
                            ${horse.name} (${horse.confidence.toFixed(0)}%)
                        </span>
                    `;
                });
                
                html += `
                        </div>
                    </div>
                `;
            }
        });

        html += `
                    </div>
                </div>
                
                <!-- 買い目戦略 -->
                <div class="betting-strategies-section">
                    <h4 style="color: #424242; margin-bottom: 15px;">💡 買い目戦略推奨</h4>
                    <div class="strategies-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">
        `;

        // 戦略別表示
        Object.entries(strategies).forEach(([strategyKey, strategy]) => {
            const isRecommended = strategy.recommended;
            html += `
                <div class="strategy-card" style="padding: 15px; border-radius: 8px; border: 2px solid ${isRecommended ? '#4caf50' : '#e0e0e0'}; background: ${isRecommended ? '#f1f8e9' : '#fafafa'};">
                    <h5 style="color: ${isRecommended ? '#2e7d32' : '#424242'}; margin: 0 0 10px 0;">
                        ${strategy.name} ${isRecommended ? '(推奨)' : ''}
                    </h5>
                    <p style="color: #666; margin: 0 0 10px 0; font-size: 0.9em;">${strategy.description}</p>
                    <div style="margin-bottom: 10px;">
                        <div style="font-size: 0.85em; color: #555;">
                            <div>📊 的中率: ${strategy.expectedHitRate}%</div>
                            <div>💰 投資額: ${strategy.totalInvestment}円 (${strategy.combinations}通り)</div>
                            <div>📈 期待値: ${strategy.expectedValue.toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="strategy-horses" style="font-size: 0.85em;">
                        <strong>選定馬:</strong><br>
            `;
            
            strategy.horses.forEach(horse => {
                const level = this.confidenceLevels[horse.confidenceLevel];
                html += `<span style="color: ${level.color};">${level.symbol}${horse.name}</span> `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });

        html += `
                    </div>
                </div>
                
                <!-- 学習用のグローバル変数設定 -->
                <script>
                    window.currentWatchList = ${JSON.stringify(watchList)};
                    window.currentStrategies = ${JSON.stringify(strategies)};
                </script>
            </div>
        `;

        container.innerHTML = html;
        
        // 学習入力フィールドも更新
        this.updateLearningInputFields(watchList, strategies);
    }

    // 学習入力フィールドの更新
    static updateLearningInputFields(watchList, strategies) {
        // 既存の3連複・3連単入力を拡張学習入力に置き換える処理
        // この部分は次のステップで実装
    }

    // 拡張学習処理
    static processEnhancedLearning(actualResult, watchList, strategies) {
        const learningResult = {
            watchListAccuracy: this.analyzeWatchListAccuracy(actualResult, watchList),
            strategyEffectiveness: this.analyzeStrategyEffectiveness(actualResult, strategies),
            oversights: this.findOversights(actualResult, watchList),
            adjustments: {}
        };

        // 学習データの保存
        this.saveLearningAdjustments(learningResult);

        return learningResult;
    }

    // 注目馬精度分析
    static analyzeWatchListAccuracy(actualResult, watchList) {
        const actualTop3 = actualResult.slice(0, 3);
        const analysis = {};

        Object.entries(watchList.byLevel).forEach(([level, horses]) => {
            const levelHorses = horses.map(h => h.name);
            const hits = actualTop3.filter(winner => levelHorses.includes(winner.name));
            
            analysis[level] = {
                totalHorses: horses.length,
                hits: hits.length,
                hitRate: horses.length > 0 ? (hits.length / horses.length) * 100 : 0,
                hitHorses: hits.map(h => h.name)
            };
        });

        return analysis;
    }

    // 戦略効果分析
    static analyzeStrategyEffectiveness(actualResult, strategies) {
        const actualTop3Names = actualResult.slice(0, 3).map(h => h.name);
        const analysis = {};

        Object.entries(strategies).forEach(([strategyKey, strategy]) => {
            const strategyHorseNames = strategy.horses.map(h => h.name);
            const hit = this.checkTripleBoxHit(strategyHorseNames, actualTop3Names);
            
            analysis[strategyKey] = {
                hit: hit,
                horses: strategyHorseNames,
                hitHorses: actualTop3Names.filter(name => strategyHorseNames.includes(name)),
                efficiency: hit ? strategy.expectedValue : -1
            };
        });

        return analysis;
    }

    // 3連複的中判定
    static checkTripleBoxHit(selectedHorses, actualTop3) {
        return actualTop3.every(actual => selectedHorses.includes(actual));
    }

    // 見逃し分析
    static findOversights(actualResult, watchList) {
        const allWatchedNames = watchList.all.map(h => h.name);
        const actualTop3 = actualResult.slice(0, 3);
        
        return actualTop3.filter(winner => !allWatchedNames.includes(winner.name));
    }

    // 学習調整の保存
    static saveLearningAdjustments(learningResult) {
        // LearningSystemとの連携
        if (typeof LearningSystem !== 'undefined') {
            // 既存の学習システムに拡張データを保存
            if (!LearningSystem.learningData.enhancedRecommendations) {
                LearningSystem.learningData.enhancedRecommendations = {
                    watchListHistory: [],
                    strategyHistory: [],
                    confidenceAdjustments: {}
                };
            }

            const enhanced = LearningSystem.learningData.enhancedRecommendations;
            enhanced.watchListHistory.push({
                date: new Date().toLocaleDateString(),
                analysis: learningResult.watchListAccuracy
            });
            enhanced.strategyHistory.push({
                date: new Date().toLocaleDateString(),
                analysis: learningResult.strategyEffectiveness
            });

            // 履歴制限
            if (enhanced.watchListHistory.length > 50) {
                enhanced.watchListHistory = enhanced.watchListHistory.slice(-50);
            }
            if (enhanced.strategyHistory.length > 50) {
                enhanced.strategyHistory = enhanced.strategyHistory.slice(-50);
            }

            LearningSystem.saveLearningData();
        }
    }
}

// グローバル公開
window.EnhancedRecommendationSystem = EnhancedRecommendationSystem;