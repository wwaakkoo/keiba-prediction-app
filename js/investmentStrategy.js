// 投資戦略アドバイザー
class InvestmentStrategy {
    // 投資戦略の提案
    static suggestStrategy(predictions, userProfile = 'balanced') {
        const strategies = {
            conservative: {
                name: '安定型',
                description: '的中率重視、リスク最小',
                tripleBox: { horses: 5, investment: 1000, expectedHitRate: 55 },
                tripleExact: { horses: 0, investment: 0, expectedHitRate: 0 }, // 推奨しない
                risk: 'low'
            },
            balanced: {
                name: 'バランス型',
                description: '的中率と配当のバランス',
                tripleBox: { horses: 4, investment: 400, expectedHitRate: 22 },
                tripleExact: { horses: 3, investment: 600, expectedHitRate: 1.8 },
                risk: 'medium'
            },
            aggressive: {
                name: '攻撃型',
                description: '高配当狙い、リスク高',
                tripleBox: { horses: 3, investment: 100, expectedHitRate: 5.5 },
                tripleExact: { horses: 3, investment: 600, expectedHitRate: 1.8 },
                risk: 'high'
            }
        };

        const strategy = strategies[userProfile] || strategies.balanced;
        
        // 予測データに基づく調整
        const topHorses = this.getTopHorses(predictions, strategy.tripleBox.horses);
        const confidence = this.calculateConfidence(topHorses);
        
        return {
            ...strategy,
            horses: topHorses,
            confidence: confidence,
            expectedReturn: this.calculateExpectedReturn(strategy, confidence),
            recommendation: this.generateRecommendation(strategy, confidence)
        };
    }

    // 上位馬の選出
    static getTopHorses(predictions, count) {
        return predictions
            .sort((a, b) => b.winProbability - a.winProbability)
            .slice(0, count)
            .map(horse => ({
                name: horse.name,
                winProbability: horse.winProbability,
                odds: horse.odds,
                confidence: this.getHorseConfidence(horse)
            }));
    }

    // 馬の信頼度計算
    static getHorseConfidence(horse) {
        const factors = [
            horse.winProbability > 15 ? 'high-prob' : horse.winProbability > 8 ? 'medium-prob' : 'low-prob',
            horse.odds < 5 ? 'low-odds' : horse.odds < 15 ? 'medium-odds' : 'high-odds',
            horse.winExpectedValue > 1.0 ? 'positive-ev' : 'negative-ev'
        ];
        
        const score = factors.reduce((sum, factor) => {
            const scores = {
                'high-prob': 30, 'medium-prob': 20, 'low-prob': 10,
                'low-odds': 25, 'medium-odds': 20, 'high-odds': 10,
                'positive-ev': 25, 'negative-ev': 5
            };
            return sum + (scores[factor] || 0);
        }, 0);
        
        return score > 70 ? 'high' : score > 50 ? 'medium' : 'low';
    }

    // 全体の信頼度計算
    static calculateConfidence(horses) {
        const highConfidence = horses.filter(h => h.confidence === 'high').length;
        const mediumConfidence = horses.filter(h => h.confidence === 'medium').length;
        
        if (highConfidence >= 2) return 'high';
        if (highConfidence >= 1 && mediumConfidence >= 1) return 'medium';
        return 'low';
    }

    // 期待リターン計算
    static calculateExpectedReturn(strategy, confidence) {
        const baseReturns = {
            conservative: { high: 280, medium: 240, low: 200 },
            balanced: { high: 320, medium: 280, low: 220 },
            aggressive: { high: 400, medium: 300, low: 180 }
        };
        
        const strategyKey = Object.keys(baseReturns).find(key => 
            strategy.name.includes(key === 'conservative' ? '安定' : 
                                 key === 'balanced' ? 'バランス' : '攻撃')
        ) || 'balanced';
        
        return baseReturns[strategyKey][confidence] || 250;
    }

    // 推奨メッセージ生成
    static generateRecommendation(strategy, confidence) {
        const messages = {
            high: {
                conservative: '📈 上位馬の信頼度が高いです。安定戦略で着実な利益を狙えます。',
                balanced: '🎯 バランス良い予測です。適度なリスクで良いリターンを期待できます。',
                aggressive: '🚀 高信頼度の予測です。攻撃的戦略で大きな配当を狙うチャンスです。'
            },
            medium: {
                conservative: '⚖️ 中程度の信頼度です。安定戦略でリスクを抑えましょう。',
                balanced: '📊 標準的な予測精度です。バランス戦略が適しています。',
                aggressive: '⚠️ 中程度の信頼度です。攻撃戦略はリスクが高めです。'
            },
            low: {
                conservative: '🛡️ 信頼度が低めです。安定戦略でリスクを最小化しましょう。',
                balanced: '📉 予測の信頼度が低いです。投資額を控えめに。',
                aggressive: '🚨 信頼度が低いです。攻撃戦略は推奨しません。'
            }
        };
        
        const strategyKey = strategy.name.includes('安定') ? 'conservative' :
                          strategy.name.includes('バランス') ? 'balanced' : 'aggressive';
        
        return messages[confidence][strategyKey] || messages.medium.balanced;
    }

    // 頭数別組み合わせ数計算
    static getCombinations(horses, type = 'tripleBox') {
        const n = horses;
        if (type === 'tripleBox') {
            // 3連複: nC3
            return n >= 3 ? (n * (n - 1) * (n - 2)) / 6 : 0;
        } else if (type === 'tripleExact') {
            // 3連単: nP3
            return n >= 3 ? n * (n - 1) * (n - 2) : 0;
        }
        return 0;
    }

    // 投資効率分析
    static analyzeEfficiency(horseCount, hitRate, avgDividend, unitCost = 100) {
        const combinations = this.getCombinations(horseCount, 'tripleBox');
        const totalInvestment = combinations * unitCost;
        const expectedReturn = (hitRate / 100) * avgDividend;
        const roi = ((expectedReturn - totalInvestment) / totalInvestment) * 100;
        
        return {
            combinations,
            totalInvestment,
            expectedReturn,
            roi,
            recommendation: roi > 20 ? 'excellent' : roi > 0 ? 'good' : 'poor'
        };
    }

    // 戦略比較表示
    static displayStrategyComparison() {
        const strategies = ['conservative', 'balanced', 'aggressive'];
        let html = `
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #495057; margin-bottom: 15px;">📊 投資戦略比較</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
        `;
        
        strategies.forEach(strategy => {
            const config = this.suggestStrategy([], strategy);
            html += `
                <div style="background: white; border-radius: 6px; padding: 15px; border-left: 4px solid ${strategy === 'conservative' ? '#28a745' : strategy === 'balanced' ? '#007bff' : '#dc3545'};">
                    <h4 style="margin: 0 0 10px 0; color: #495057;">${config.name}</h4>
                    <p style="font-size: 0.9em; color: #6c757d; margin: 0 0 10px 0;">${config.description}</p>
                    <div style="font-size: 0.85em;">
                        <div>🎯 3連複: ${config.tripleBox.horses}頭 (${config.tripleBox.expectedHitRate}%)</div>
                        <div>💰 投資額: ${config.tripleBox.investment}円</div>
                        <div>📈 リスク: ${config.risk === 'low' ? '低' : config.risk === 'medium' ? '中' : '高'}</div>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
                <p style="margin: 15px 0 0 0; font-size: 0.85em; color: #6c757d;">
                    💡 投資は余剰資金の範囲内で行い、ギャンブル依存症にご注意ください
                </p>
            </div>
        `;
        
        return html;
    }

    // リアルタイム的中率分析
    static analyzeRealHitRate(learningData) {
        if (!learningData.complexBetting || !learningData.complexBetting.history.length) {
            return {
                message: '学習データが不足しています。レース結果を入力して蓄積してください。',
                recommendation: 'データ蓄積期間中は保守的な戦略を推奨します。'
            };
        }
        
        const history = learningData.complexBetting.history;
        const recentData = history.slice(-20); // 直近20レース
        
        const tripleBoxHits = recentData.filter(h => h.tripleBox.result === 'hit').length;
        const tripleExactHits = recentData.filter(h => h.tripleExact.result === 'hit').length;
        const totalTripleBox = recentData.filter(h => h.tripleBox.result && h.tripleBox.result !== 'no-bet').length;
        const totalTripleExact = recentData.filter(h => h.tripleExact.result && h.tripleExact.result !== 'no-bet').length;
        
        const realTripleBoxRate = totalTripleBox > 0 ? (tripleBoxHits / totalTripleBox) * 100 : 0;
        const realTripleExactRate = totalTripleExact > 0 ? (tripleExactHits / totalTripleExact) * 100 : 0;
        
        return {
            message: `直近の実際の的中率: 3連複 ${realTripleBoxRate.toFixed(1)}%, 3連単 ${realTripleExactRate.toFixed(1)}%`,
            recommendation: this.getRecommendationFromRealData(realTripleBoxRate, realTripleExactRate),
            adjustedStrategy: this.adjustStrategyFromRealData(realTripleBoxRate, realTripleExactRate)
        };
    }

    // 実データからの推奨
    static getRecommendationFromRealData(tripleBoxRate, tripleExactRate) {
        if (tripleBoxRate > 30) {
            return '🎯 3連複の的中率が高いです。積極的な投資を検討できます。';
        } else if (tripleBoxRate > 15) {
            return '📊 3連複の的中率は標準的です。バランス戦略が適しています。';
        } else if (tripleBoxRate > 0) {
            return '⚠️ 3連複の的中率が低めです。戦略の見直しを推奨します。';
        } else {
            return '🔍 まだデータが不足しています。保守的にスタートしましょう。';
        }
    }

    // 実データからの戦略調整
    static adjustStrategyFromRealData(tripleBoxRate, tripleExactRate) {
        if (tripleBoxRate > 25) {
            return 'balanced'; // 攻撃的に
        } else if (tripleBoxRate > 10) {
            return 'balanced'; // 現状維持
        } else {
            return 'conservative'; // 保守的に
        }
    }
}

// グローバル公開
window.InvestmentStrategy = InvestmentStrategy;