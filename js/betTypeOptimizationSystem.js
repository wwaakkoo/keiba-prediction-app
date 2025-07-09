// 券種別最適化戦略システム
class BetTypeOptimizationSystem {
    
    // 券種設定
    static betTypeConfig = {
        // 券種定義
        betTypes: {
            win: {
                name: '単勝',
                description: '1着予想',
                difficulty: 1.0,
                baseHitRate: 0.1,       // 10頭立て想定
                averageOdds: 8.0,
                riskLevel: 'medium',
                minConfidenceRequired: 0.6
            },
            place: {
                name: '複勝',
                description: '3着以内予想',
                difficulty: 0.4,
                baseHitRate: 0.3,       // 3/10の確率
                averageOdds: 2.5,
                riskLevel: 'low',
                minConfidenceRequired: 0.4
            },
            exacta: {
                name: '馬連',
                description: '1-2着の組み合わせ',
                difficulty: 2.5,
                baseHitRate: 0.022,     // 2/(10*9)の確率
                averageOdds: 25.0,
                riskLevel: 'high',
                minConfidenceRequired: 0.7
            },
            trifecta: {
                name: '3連複',
                description: '1-3着の組み合わせ',
                difficulty: 4.0,
                baseHitRate: 0.008,     // 1/120の確率
                averageOdds: 80.0,
                riskLevel: 'very_high',
                minConfidenceRequired: 0.75
            },
            superfecta: {
                name: '3連単',
                description: '1-3着の順序予想',
                difficulty: 6.0,
                baseHitRate: 0.0017,    // 1/600の確率
                averageOdds: 300.0,
                riskLevel: 'extreme',
                minConfidenceRequired: 0.85
            }
        },
        
        // 戦略タイプ
        strategies: {
            conservative: {
                name: '保守的戦略',
                description: '安定した小さな利益を重視',
                preferredBetTypes: ['place', 'win'],
                riskTolerance: 0.15,
                targetHitRate: 0.4
            },
            balanced: {
                name: 'バランス戦略',
                description: 'リスクとリターンのバランス',
                preferredBetTypes: ['win', 'place', 'exacta'],
                riskTolerance: 0.25,
                targetHitRate: 0.25
            },
            aggressive: {
                name: '積極戦略',
                description: '高リターンを狙う戦略',
                preferredBetTypes: ['exacta', 'trifecta'],
                riskTolerance: 0.4,
                targetHitRate: 0.15
            },
            speculative: {
                name: '投機戦略',
                description: '超高配当を狙う戦略',
                preferredBetTypes: ['trifecta', 'superfecta'],
                riskTolerance: 0.6,
                targetHitRate: 0.08
            }
        }
    };
    
    // 現在の設定
    static currentStrategy = 'balanced';
    
    // 券種別期待値・リスクの動的計算
    static calculateBetTypeMetrics(predictions, marketConditions) {
        console.log('🎯 券種別期待値・リスク計算開始');
        
        const betTypeMetrics = {};
        
        Object.entries(this.betTypeConfig.betTypes).forEach(([betType, config]) => {
            const metrics = this.calculateIndividualBetTypeMetrics(
                betType, 
                config, 
                predictions, 
                marketConditions
            );
            
            betTypeMetrics[betType] = metrics;
        });
        
        console.log('📊 券種別計算完了:', {
            計算券種数: Object.keys(betTypeMetrics).length,
            最高期待値: this.findBestExpectedValue(betTypeMetrics),
            最低リスク: this.findLowestRisk(betTypeMetrics)
        });
        
        return betTypeMetrics;
    }
    
    // 最高期待値特定
    static findBestExpectedValue(betTypeMetrics) {
        let bestBetType = null;
        let bestEV = -Infinity;
        
        Object.entries(betTypeMetrics).forEach(([betType, metrics]) => {
            if (metrics.expectedValue > bestEV) {
                bestEV = metrics.expectedValue;
                bestBetType = {
                    betType: betType,
                    expectedValue: bestEV,
                    name: this.betTypeConfig.betTypes[betType]?.name || betType
                };
            }
        });
        
        return bestBetType;
    }
    
    // 最低リスク特定
    static findLowestRisk(betTypeMetrics) {
        let lowestRiskType = null;
        let lowestRisk = Infinity;
        
        Object.entries(betTypeMetrics).forEach(([betType, metrics]) => {
            if (metrics.risk < lowestRisk) {
                lowestRisk = metrics.risk;
                lowestRiskType = {
                    betType: betType,
                    risk: lowestRisk,
                    name: this.betTypeConfig.betTypes[betType]?.name || betType
                };
            }
        });
        
        return lowestRiskType;
    }
    
    // 個別券種メトリクス計算
    static calculateIndividualBetTypeMetrics(betType, config, predictions, marketConditions) {
        // 1. 的中確率計算
        const hitProbability = this.calculateHitProbability(betType, predictions, marketConditions);
        
        // 2. 期待配当計算
        const expectedPayout = this.calculateExpectedPayout(betType, predictions, marketConditions);
        
        // 3. 期待値計算
        const expectedValue = hitProbability * expectedPayout - 1;
        
        // 4. リスク計算
        const risk = this.calculateBetTypeRisk(betType, predictions, marketConditions);
        
        // 5. シャープレシオ計算
        const sharpeRatio = risk > 0 ? expectedValue / risk : 0;
        
        // 6. 推奨度計算
        const recommendationScore = this.calculateRecommendationScore(
            betType, 
            expectedValue, 
            hitProbability, 
            risk
        );
        
        return {
            betType: betType,
            hitProbability: hitProbability,
            expectedPayout: expectedPayout,
            expectedValue: expectedValue,
            risk: risk,
            sharpeRatio: sharpeRatio,
            recommendationScore: recommendationScore,
            confidence: this.calculateConfidence(predictions, config.minConfidenceRequired),
            marketAdjustment: this.calculateMarketAdjustment(marketConditions)
        };
    }
    
    // 券種別的中確率計算
    static calculateHitProbability(betType, predictions, marketConditions) {
        const config = this.betTypeConfig.betTypes[betType];
        let baseProbability = config.baseHitRate;
        
        // 予測精度による調整
        const avgConfidence = predictions.reduce((sum, p) => sum + (p.reliability?.total || 0.5), 0) / predictions.length;
        const confidenceMultiplier = 0.5 + avgConfidence;
        
        // 券種別調整
        switch (betType) {
            case 'win':
                // 単勝：1位予想の信頼度
                const topHorse = predictions[0];
                baseProbability = topHorse?.reliability?.total || config.baseHitRate;
                break;
                
            case 'place':
                // 複勝：上位3頭の総合信頼度
                const top3 = predictions.slice(0, 3);
                const combinedConfidence = top3.reduce((sum, h) => sum + (h.reliability?.total || 0.5), 0) / 3;
                baseProbability = Math.min(0.5, combinedConfidence * 0.6);
                break;
                
            case 'exacta':
                // 馬連：上位2頭の組み合わせ信頼度
                const top2 = predictions.slice(0, 2);
                const top2Confidence = top2.reduce((sum, h) => sum + (h.reliability?.total || 0.5), 0) / 2;
                baseProbability = config.baseHitRate * (top2Confidence * 2);
                break;
                
            case 'trifecta':
                // 3連複：上位3頭の組み合わせ信頼度
                const trifectaTop3 = predictions.slice(0, 3);
                const trifectaConfidence = trifectaTop3.reduce((sum, h) => sum + (h.reliability?.total || 0.5), 0) / 3;
                baseProbability = config.baseHitRate * (trifectaConfidence * 3);
                break;
                
            case 'superfecta':
                // 3連単：上位3頭の順序予想信頼度
                const superfectaTop3 = predictions.slice(0, 3);
                const superfectaConfidence = superfectaTop3.reduce((sum, h) => sum + (h.reliability?.total || 0.5), 0) / 3;
                baseProbability = config.baseHitRate * (superfectaConfidence * 4);
                break;
        }
        
        // 市場環境調整
        const marketMultiplier = this.getMarketMultiplier(marketConditions, betType);
        
        return Math.max(0.001, Math.min(0.8, baseProbability * confidenceMultiplier * marketMultiplier));
    }
    
    // 市場環境による倍率計算
    static getMarketMultiplier(marketConditions, betType) {
        let multiplier = 1.0;
        
        // レースクラス調整
        if (marketConditions?.raceClass) {
            const classMultipliers = {
                'G1': 1.2,      // G1は信頼度高
                'G2': 1.1,      // G2は少し高
                'G3': 1.05,     // G3は標準+
                '重賞': 1.0,    // 重賞は標準
                '特別': 0.95,   // 特別戦は少し低
                '条件': 0.9     // 条件戦は低
            };
            multiplier *= classMultipliers[marketConditions.raceClass] || 1.0;
        }
        
        // 天候調整
        if (marketConditions?.weather) {
            const weatherMultipliers = {
                '晴': 1.0,      // 晴れは標準
                '曇': 0.95,     // 曇りは少し低
                '雨': 0.85      // 雨は低
            };
            multiplier *= weatherMultipliers[marketConditions.weather] || 1.0;
        }
        
        // 券種別の市場環境感度
        const betTypeSensitivity = {
            'win': 1.0,         // 単勝は標準
            'place': 1.1,       // 複勝は市場環境に強い
            'exacta': 0.9,      // 馬連は市場環境に弱い
            'trifecta': 0.8,    // 3連複はより弱い
            'superfecta': 0.7   // 3連単は最も弱い
        };
        multiplier *= betTypeSensitivity[betType] || 1.0;
        
        return Math.max(0.5, Math.min(1.5, multiplier));
    }
    
    // 期待配当計算
    static calculateExpectedPayout(betType, predictions, marketConditions) {
        const config = this.betTypeConfig.betTypes[betType];
        
        // オッズベース基本配当
        const avgOdds = predictions.reduce((sum, p) => sum + parseFloat(p.odds), 0) / predictions.length;
        
        // 券種別配当率
        const payoutMultipliers = {
            win: avgOdds * 0.85,        // 単勝：オッズ×85%
            place: avgOdds * 0.25,      // 複勝：オッズ×25%
            exacta: avgOdds * 3.5,      // 馬連：オッズ×3.5倍
            trifecta: avgOdds * 12.0,   // 3連複：オッズ×12倍
            superfecta: avgOdds * 35.0  // 3連単：オッズ×35倍
        };
        
        let expectedPayout = payoutMultipliers[betType] || config.averageOdds;
        
        // 市場環境による配当調整
        const volatilityAdjustment = this.calculateVolatilityAdjustment(marketConditions);
        expectedPayout *= volatilityAdjustment;
        
        return Math.max(1.1, expectedPayout);
    }
    
    // ボラティリティ調整計算
    static calculateVolatilityAdjustment(marketConditions) {
        let adjustment = 1.0;
        
        // 天候による調整
        if (marketConditions?.weather === '雨') {
            adjustment *= 1.1; // 雨の日は配当が荒れやすい
        }
        
        // レースクラスによる調整
        if (marketConditions?.raceClass) {
            const volatilityMultipliers = {
                'G1': 0.9,      // G1は安定
                'G2': 0.95,     // G2は少し安定
                'G3': 1.0,      // G3は標準
                '重賞': 1.05,   // 重賞は少し荒れる
                '特別': 1.1,    // 特別戦は荒れやすい
                '条件': 1.15    // 条件戦は最も荒れやすい
            };
            adjustment *= volatilityMultipliers[marketConditions.raceClass] || 1.0;
        }
        
        return Math.max(0.8, Math.min(1.3, adjustment));
    }
    
    // 券種別リスク計算
    static calculateBetTypeRisk(betType, predictions, marketConditions) {
        const config = this.betTypeConfig.betTypes[betType];
        
        // 基本リスクレベル
        const riskLevels = {
            low: 0.2,
            medium: 0.35,
            high: 0.55,
            very_high: 0.75,
            extreme: 0.9
        };
        
        let baseRisk = riskLevels[config.riskLevel] || 0.35;
        
        // 予測信頼度による調整（信頼度が低いほどリスク高）
        const avgConfidence = predictions.reduce((sum, p) => sum + (p.reliability?.total || 0.5), 0) / predictions.length;
        const confidenceAdjustment = 1.5 - avgConfidence;
        
        // 市場環境による調整
        const marketRiskAdjustment = this.calculateMarketRiskAdjustment(marketConditions);
        
        return Math.max(0.1, Math.min(0.95, baseRisk * confidenceAdjustment * marketRiskAdjustment));
    }
    
    // 市場環境リスク調整
    static calculateMarketRiskAdjustment(marketConditions) {
        let adjustment = 1.0;
        
        // 天候リスク
        if (marketConditions?.weather === '雨') {
            adjustment *= 1.2; // 雨の日はリスク増
        }
        
        // レースクラスリスク
        if (marketConditions?.raceClass) {
            const riskMultipliers = {
                'G1': 0.9,      // G1はリスク低
                'G2': 0.95,     // G2は少しリスク低
                'G3': 1.0,      // G3は標準
                '重賞': 1.05,   // 重賞は少しリスク高
                '特別': 1.1,    // 特別戦はリスク高
                '条件': 1.15    // 条件戦は最もリスク高
            };
            adjustment *= riskMultipliers[marketConditions.raceClass] || 1.0;
        }
        
        return Math.max(0.8, Math.min(1.3, adjustment));
    }
    
    // 推奨度スコア計算
    static calculateRecommendationScore(betType, expectedValue, hitProbability, risk) {
        // 複数要素を統合したスコア
        const valueScore = Math.max(0, expectedValue) * 0.4;          // 期待値40%
        const hitRateScore = hitProbability * 0.3;                    // 的中率30%
        const riskAdjustedScore = Math.max(0, (1 - risk)) * 0.2;     // リスク調整20%
        const strategyFitScore = this.calculateStrategyFit(betType) * 0.1; // 戦略適合10%
        
        return valueScore + hitRateScore + riskAdjustedScore + strategyFitScore;
    }
    
    // 信頼度計算
    static calculateConfidence(predictions, minRequired) {
        // 予測の平均信頼度を計算
        const avgConfidence = predictions.reduce((sum, p) => sum + (p.reliability?.total || 0.5), 0) / predictions.length;
        
        // 最小要件との比較
        const confidenceRatio = avgConfidence / minRequired;
        
        // 信頼度レベルを判定
        if (confidenceRatio >= 1.2) return 'very_high';
        if (confidenceRatio >= 1.0) return 'high';
        if (confidenceRatio >= 0.8) return 'medium';
        if (confidenceRatio >= 0.6) return 'low';
        return 'very_low';
    }
    
    // 市場調整計算
    static calculateMarketAdjustment(marketConditions) {
        let adjustment = {
            overall: 1.0,
            factors: {}
        };
        
        // レースクラス調整
        if (marketConditions?.raceClass) {
            const classAdjustment = {
                'G1': 1.1,
                'G2': 1.05,
                'G3': 1.0,
                '重賞': 0.95,
                '特別': 0.9,
                '条件': 0.85
            };
            adjustment.factors.raceClass = classAdjustment[marketConditions.raceClass] || 1.0;
            adjustment.overall *= adjustment.factors.raceClass;
        }
        
        // 天候調整
        if (marketConditions?.weather) {
            const weatherAdjustment = {
                '晴': 1.0,
                '曇': 0.95,
                '雨': 0.85
            };
            adjustment.factors.weather = weatherAdjustment[marketConditions.weather] || 1.0;
            adjustment.overall *= adjustment.factors.weather;
        }
        
        // 距離調整
        if (marketConditions?.distance) {
            const distanceAdjustment = {
                '短距離': 1.05,
                '中距離': 1.0,
                '長距離': 0.95,
                '障害': 0.8
            };
            adjustment.factors.distance = distanceAdjustment[marketConditions.distance] || 1.0;
            adjustment.overall *= adjustment.factors.distance;
        }
        
        // コース調整
        if (marketConditions?.track) {
            const trackAdjustment = {
                '芝': 1.0,
                'ダート': 0.95
            };
            adjustment.factors.track = trackAdjustment[marketConditions.track] || 1.0;
            adjustment.overall *= adjustment.factors.track;
        }
        
        return adjustment;
    }
    
    // 戦略適合度計算
    static calculateStrategyFit(betType) {
        const strategy = this.betTypeConfig.strategies[this.currentStrategy];
        const isPreferred = strategy.preferredBetTypes.includes(betType);
        
        return isPreferred ? 1.0 : 0.3;
    }
    
    // 最適券種組み合わせ決定
    static determineOptimalBetTypeCombination(betTypeMetrics, availableBudget) {
        console.log('💰 最適券種組み合わせ決定開始');
        
        const strategy = this.betTypeConfig.strategies[this.currentStrategy];
        
        // 1. 戦略に適合する券種フィルタリング
        const strategicBetTypes = this.filterByStrategy(betTypeMetrics, strategy);
        
        // 2. 期待値・リスクベース最適化
        const optimizedCombination = this.optimizeBetTypeCombination(strategicBetTypes, strategy, availableBudget);
        
        // 3. 資金配分計算
        const budgetAllocation = this.calculateBetTypeBudgetAllocation(optimizedCombination, availableBudget);
        
        const result = {
            strategy: this.currentStrategy,
            selectedBetTypes: optimizedCombination,
            budgetAllocation: budgetAllocation,
            totalExpectedValue: this.calculateCombinationExpectedValue(optimizedCombination),
            totalRisk: this.calculateCombinationRisk(optimizedCombination),
            diversificationScore: this.calculateDiversificationScore(optimizedCombination)
        };
        
        console.log('🎯 最適組み合わせ決定完了:', {
            選択券種数: optimizedCombination.length,
            総期待値: `${(result.totalExpectedValue * 100).toFixed(1)}%`,
            総リスク: `${(result.totalRisk * 100).toFixed(1)}%`,
            予算配分: Object.keys(budgetAllocation).length + '券種'
        });
        
        return result;
    }
    
    // 組み合わせ期待値計算
    static calculateCombinationExpectedValue(combination) {
        if (combination.length === 0) return 0;
        return combination.reduce((sum, metrics) => sum + metrics.expectedValue, 0) / combination.length;
    }
    
    // 組み合わせリスク計算
    static calculateCombinationRisk(combination) {
        if (combination.length === 0) return 0;
        return combination.reduce((sum, metrics) => sum + metrics.risk, 0) / combination.length;
    }
    
    // 分散スコア計算
    static calculateDiversificationScore(combination) {
        if (combination.length <= 1) return 0;
        return Math.min(1, combination.length / 5); // 5券種で最大スコア
    }
    
    // 戦略ベースフィルタリング
    static filterByStrategy(betTypeMetrics, strategy) {
        const filtered = {};
        
        strategy.preferredBetTypes.forEach(betType => {
            if (betTypeMetrics[betType]) {
                const metrics = betTypeMetrics[betType];
                
                // 最小信頼度チェック
                const config = this.betTypeConfig.betTypes[betType];
                if (metrics.confidence >= config.minConfidenceRequired * 0.8) {
                    
                    // 期待値チェック
                    if (metrics.expectedValue > -0.2) { // 最大20%までの損失許容
                        filtered[betType] = metrics;
                    }
                }
            }
        });
        
        return filtered;
    }
    
    // 券種組み合わせ最適化
    static optimizeBetTypeCombination(strategicBetTypes, strategy, budget) {
        const combinations = [];
        const betTypes = Object.keys(strategicBetTypes);
        
        // 可能な組み合わせ生成（最大3券種）
        const maxCombinations = Math.min(3, betTypes.length);
        
        for (let i = 1; i <= maxCombinations; i++) {
            const combos = this.generateCombinations(betTypes, i);
            combos.forEach(combo => {
                const metrics = combo.map(betType => strategicBetTypes[betType]);
                const score = this.evaluateCombinationScore(metrics, strategy);
                combinations.push({ betTypes: combo, metrics: metrics, score: score });
            });
        }
        
        // 最高スコア組み合わせ選択
        combinations.sort((a, b) => b.score - a.score);
        
        return combinations[0]?.metrics || [];
    }
    
    // 組み合わせ生成
    static generateCombinations(array, size) {
        if (size === 1) return array.map(item => [item]);
        
        const combinations = [];
        array.forEach((item, index) => {
            const remaining = array.slice(index + 1);
            const smallerCombinations = this.generateCombinations(remaining, size - 1);
            smallerCombinations.forEach(combo => {
                combinations.push([item, ...combo]);
            });
        });
        
        return combinations;
    }
    
    // 組み合わせスコア評価
    static evaluateCombinationScore(metrics, strategy) {
        const avgExpectedValue = metrics.reduce((sum, m) => sum + m.expectedValue, 0) / metrics.length;
        const avgRisk = metrics.reduce((sum, m) => sum + m.risk, 0) / metrics.length;
        const diversification = metrics.length > 1 ? 0.2 : 0; // 分散ボーナス
        
        // 戦略リスク許容度チェック
        const riskPenalty = avgRisk > strategy.riskTolerance ? (avgRisk - strategy.riskTolerance) * 0.5 : 0;
        
        return avgExpectedValue + diversification - riskPenalty - avgRisk * 0.3;
    }
    
    // 券種別予算配分計算
    static calculateBetTypeBudgetAllocation(selectedBetTypes, totalBudget) {
        const allocation = {};
        
        if (selectedBetTypes.length === 0) return allocation;
        
        // リスク調整後の重み計算
        const weights = selectedBetTypes.map(metrics => {
            const riskAdjustedValue = metrics.expectedValue / (1 + metrics.risk);
            return Math.max(0.1, riskAdjustedValue + 0.5); // 最小10%保証
        });
        
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        
        selectedBetTypes.forEach((metrics, index) => {
            const proportion = weights[index] / totalWeight;
            const amount = Math.floor(totalBudget * proportion / 1000) * 1000; // 1,000円単位
            
            if (amount >= 1000) {
                allocation[metrics.betType] = {
                    amount: amount,
                    proportion: proportion,
                    expectedValue: metrics.expectedValue,
                    risk: metrics.risk,
                    reasoning: this.generateAllocationReasoning(metrics)
                };
            }
        });
        
        return allocation;
    }
    
    // 配分理由生成
    static generateAllocationReasoning(metrics) {
        const reasons = [];
        
        if (metrics.expectedValue > 0.1) reasons.push('高期待値');
        if (metrics.hitProbability > 0.25) reasons.push('高的中率');
        if (metrics.risk < 0.3) reasons.push('低リスク');
        if (metrics.sharpeRatio > 0.3) reasons.push('良好シャープレシオ');
        
        return reasons.length > 0 ? reasons.join('・') : '戦略適合';
    }
    
    // 券種別推奨強度の自動調整
    static adjustBetTypeRecommendationStrength(performanceHistory, currentMetrics) {
        console.log('🔧 券種別推奨強度自動調整開始');
        
        const adjustments = {};
        
        Object.entries(this.betTypeConfig.betTypes).forEach(([betType, config]) => {
            // 過去パフォーマンス分析
            const typeHistory = performanceHistory.filter(bet => bet.betType === betType);
            
            if (typeHistory.length >= 5) {
                const performance = this.analyzeBetTypePerformance(typeHistory);
                const adjustment = this.calculateStrengthAdjustment(performance, currentMetrics[betType]);
                
                adjustments[betType] = {
                    currentStrength: currentMetrics[betType]?.recommendationScore || 0,
                    adjustment: adjustment,
                    newStrength: Math.max(0, Math.min(1, 
                        (currentMetrics[betType]?.recommendationScore || 0) + adjustment
                    )),
                    reason: this.generateAdjustmentReason(performance)
                };
            }
        });
        
        console.log('📊 推奨強度調整完了:', {
            調整券種数: Object.keys(adjustments).length,
            平均調整値: this.calculateAverageAdjustment(adjustments)
        });
        
        return adjustments;
    }
    
    // 券種パフォーマンス分析
    static analyzeBetTypePerformance(typeHistory) {
        const totalBets = typeHistory.length;
        const wins = typeHistory.filter(bet => bet.isWin).length;
        const totalInvested = typeHistory.reduce((sum, bet) => sum + bet.betAmount, 0);
        const totalReturned = typeHistory.reduce((sum, bet) => sum + (bet.returnAmount || 0), 0);
        
        return {
            hitRate: wins / totalBets,
            roi: (totalReturned - totalInvested) / totalInvested,
            averageReturn: totalReturned / totalInvested,
            consistency: this.calculateTypeConsistency(typeHistory)
        };
    }
    
    // 強度調整値計算
    static calculateStrengthAdjustment(performance, currentMetrics) {
        let adjustment = 0;
        
        // ROIベース調整
        if (performance.roi > 0.1) {
            adjustment += 0.1; // 良好なROIの場合強化
        } else if (performance.roi < -0.2) {
            adjustment -= 0.15; // 悪いROIの場合弱化
        }
        
        // 的中率ベース調整
        if (performance.hitRate > currentMetrics?.hitProbability * 1.2) {
            adjustment += 0.05; // 予想以上の的中率
        } else if (performance.hitRate < currentMetrics?.hitProbability * 0.8) {
            adjustment -= 0.05; // 予想以下の的中率
        }
        
        return Math.max(-0.3, Math.min(0.3, adjustment));
    }
    
    // 設定変更
    static setStrategy(strategyName) {
        if (this.betTypeConfig.strategies[strategyName]) {
            this.currentStrategy = strategyName;
            this.saveConfiguration();
            return true;
        }
        return false;
    }
    
    // 設定保存・読み込み
    static saveConfiguration() {
        try {
            localStorage.setItem('betTypeOptimizationConfig', JSON.stringify({
                strategy: this.currentStrategy,
                lastUpdated: new Date().toISOString()
            }));
        } catch (error) {
            console.error('券種最適化設定保存エラー:', error);
        }
    }
    
    static loadConfiguration() {
        try {
            const saved = localStorage.getItem('betTypeOptimizationConfig');
            if (saved) {
                const config = JSON.parse(saved);
                this.currentStrategy = config.strategy || 'balanced';
            }
        } catch (error) {
            console.error('券種最適化設定読み込みエラー:', error);
        }
    }
    
    // 初期化
    static initialize() {
        this.loadConfiguration();
        console.log('🎯 券種別最適化戦略システム初期化完了:', {
            現在戦略: this.currentStrategy,
            利用可能券種: Object.keys(this.betTypeConfig.betTypes).length,
            戦略数: Object.keys(this.betTypeConfig.strategies).length
        });
    }
}

// グローバル公開
window.BetTypeOptimizationSystem = BetTypeOptimizationSystem;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    BetTypeOptimizationSystem.initialize();
});