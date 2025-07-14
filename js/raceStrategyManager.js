/**
 * レース特性に応じた戦略変更システム
 * レース条件・出走馬の特徴・市場状況を分析して最適戦略を選択
 */
class RaceStrategyManager {
    constructor() {
        this.strategyRules = this.initializeStrategyRules();
        this.raceTypes = this.defineRaceTypes();
    }

    /**
     * レース特性分析と戦略決定
     */
    determineOptimalStrategy(raceData, horseAnalysis, marketData = {}) {
        // レース特性分析
        const raceCharacteristics = this.analyzeRaceCharacteristics(raceData, horseAnalysis);
        
        // 市場状況分析
        const marketConditions = this.analyzeMarketConditions(marketData, horseAnalysis);
        
        // 戦略決定
        const strategy = this.selectStrategy(raceCharacteristics, marketConditions);
        
        // 戦略調整
        const adjustedStrategy = this.adjustStrategy(strategy, raceCharacteristics, marketConditions);
        
        return {
            raceType: raceCharacteristics.type,
            strategy: adjustedStrategy,
            confidence: this.calculateStrategyConfidence(raceCharacteristics, marketConditions),
            reasoning: this.generateStrategyReasoning(raceCharacteristics, marketConditions, adjustedStrategy)
        };
    }

    /**
     * レース特性分析
     */
    analyzeRaceCharacteristics(raceData, horseAnalysis) {
        const horses = horseAnalysis.analyzedHorses || [];
        
        // 基本情報
        const fieldSize = horses.length;
        const course = raceData.course || 'unknown';
        const distance = raceData.distance || 1600;
        const grade = raceData.grade || 'maiden';
        
        // 実力分析
        const powerAnalysis = this.analyzePowerDistribution(horses);
        
        // 人気分析
        const popularityAnalysis = this.analyzePopularityStructure(horses);
        
        // オッズ分析
        const oddsAnalysis = this.analyzeOddsStructure(horses);
        
        // レースタイプ判定
        const raceType = this.classifyRaceType(powerAnalysis, popularityAnalysis, oddsAnalysis, {
            fieldSize, course, distance, grade
        });

        return {
            type: raceType,
            fieldSize,
            course,
            distance,
            grade,
            powerAnalysis,
            popularityAnalysis,
            oddsAnalysis,
            competitiveness: this.calculateCompetitiveness(powerAnalysis, popularityAnalysis)
        };
    }

    /**
     * 実力分析
     */
    analyzePowerDistribution(horses) {
        const scores = horses.map(h => h.score || 0);
        const rawConfidences = horses.map(h => h.confidence || 0);
        
        // confidence値のスケール統一（0-1スケールを0-100スケールに変換）
        const confidences = rawConfidences.map(c => {
            // 0-1スケールの場合は100倍、すでに0-100スケールの場合はそのまま
            return c <= 1.0 ? c * 100 : c;
        });
        
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);
        const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        const scoreVariance = this.calculateVariance(scores);
        
        const maxConfidence = Math.max(...confidences);
        const avgConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
        
        // 実力層分析
        const strongHorses = horses.filter(h => h.score >= 80).length;
        const mediumHorses = horses.filter(h => h.score >= 60 && h.score < 80).length;
        const weakHorses = horses.filter(h => h.score < 60).length;

        return {
            maxScore,
            minScore,
            avgScore,
            scoreVariance,
            maxConfidence,
            avgConfidence,
            strongHorses,
            mediumHorses,
            weakHorses,
            powerGap: maxScore - avgScore,
            certainty: maxConfidence > 85 && scoreVariance < 200
        };
    }

    /**
     * 人気構造分析
     */
    analyzePopularityStructure(horses) {
        const popularities = horses.map(h => h.popularity || 10);
        
        const favorites = horses.filter(h => h.popularity <= 3).length;
        const midRange = horses.filter(h => h.popularity >= 4 && h.popularity <= 6).length;
        const outsiders = horses.filter(h => h.popularity >= 7).length;
        
        const topFavoriteScore = horses.find(h => h.popularity === 1)?.score || 0;
        const favoriteConcentration = favorites / horses.length;

        return {
            favorites,
            midRange,
            outsiders,
            topFavoriteScore,
            favoriteConcentration,
            structure: this.classifyPopularityStructure(favoriteConcentration, topFavoriteScore)
        };
    }

    /**
     * オッズ構造分析
     */
    analyzeOddsStructure(horses) {
        const odds = horses.map(h => h.estimatedOdds || 5.0);
        
        const minOdds = Math.min(...odds);
        const maxOdds = Math.max(...odds);
        const avgOdds = odds.reduce((sum, o) => sum + o, 0) / odds.length;
        
        const lowOddsHorses = horses.filter(h => h.estimatedOdds <= 3.0).length;
        const highOddsHorses = horses.filter(h => h.estimatedOdds >= 10.0).length;

        return {
            minOdds,
            maxOdds,
            avgOdds,
            oddsSpread: maxOdds - minOdds,
            lowOddsHorses,
            highOddsHorses,
            favoriteStrength: minOdds < 2.0 ? 'strong' : minOdds < 4.0 ? 'medium' : 'weak'
        };
    }

    /**
     * レースタイプ分類
     */
    classifyRaceType(powerAnalysis, popularityAnalysis, oddsAnalysis, raceInfo) {
        // 実力型（実力差明確）
        if (powerAnalysis.certainty && powerAnalysis.powerGap > 15 && oddsAnalysis.favoriteStrength === 'strong') {
            return 'power_race';
        }
        
        // 混戦型（実力接近）
        if (powerAnalysis.scoreVariance < 100 && popularityAnalysis.favoriteConcentration < 0.4) {
            return 'competitive_race';
        }
        
        // 荒れ型（人気薄有力）
        if (popularityAnalysis.topFavoriteScore < 70 && powerAnalysis.strongHorses >= 2) {
            return 'upset_prone';
        }
        
        // 堅実型（人気馬中心）
        if (popularityAnalysis.favoriteConcentration > 0.5 && powerAnalysis.certainty) {
            return 'solid_race';
        }
        
        // 難解型（予想困難）
        if (powerAnalysis.avgConfidence < 60 || powerAnalysis.scoreVariance > 300) {
            return 'difficult_race';
        }

        return 'standard_race';
    }

    /**
     * 市場状況分析
     */
    analyzeMarketConditions(marketData, horseAnalysis) {
        const horses = horseAnalysis.analyzedHorses || [];
        
        // 期待値分析
        const expectedValues = horses.map(h => h.expectedValue || 1.0);
        const maxExpectedValue = Math.max(...expectedValues);
        const goodValueHorses = horses.filter(h => h.expectedValue >= 1.3).length;
        
        // 投資機会評価
        const investmentOpportunity = this.evaluateInvestmentOpportunity(horses);
        
        return {
            maxExpectedValue,
            goodValueHorses,
            investmentOpportunity,
            marketEfficiency: maxExpectedValue < 1.2 ? 'high' : maxExpectedValue < 1.5 ? 'medium' : 'low',
            recommendation: goodValueHorses >= 2 ? 'active' : goodValueHorses === 1 ? 'selective' : 'conservative'
        };
    }

    /**
     * 戦略選択
     */
    selectStrategy(raceCharacteristics, marketConditions) {
        const raceType = raceCharacteristics.type;
        const marketRec = marketConditions.recommendation;
        
        // レースタイプ別基本戦略
        const baseStrategy = this.strategyRules[raceType] || this.strategyRules.standard_race;
        
        // 市場状況による調整
        if (marketRec === 'conservative' || marketConditions.maxExpectedValue < 1.1) {
            return this.getConservativeStrategy();
        } else if (marketRec === 'active' && raceType !== 'difficult_race') {
            return this.getActiveStrategy(baseStrategy);
        }
        
        return baseStrategy;
    }

    /**
     * 戦略調整
     */
    adjustStrategy(strategy, raceCharacteristics, marketConditions) {
        const adjusted = { ...strategy };
        
        // フィールドサイズ調整
        if (raceCharacteristics.fieldSize <= 8) {
            adjusted.maxBets = Math.min(adjusted.maxBets, 2);
            adjusted.riskLevel = 'low';
        } else if (raceCharacteristics.fieldSize >= 16) {
            adjusted.maxBets = Math.min(adjusted.maxBets + 1, 4);
        }
        
        // 競争度調整
        if (raceCharacteristics.competitiveness > 0.8) {
            adjusted.budget_allocation.place *= 0.8;
            adjusted.budget_allocation.wide *= 1.2;
        }
        
        // 期待値調整
        if (marketConditions.maxExpectedValue >= 1.5) {
            adjusted.budget_allocation.aggressive = true;
            adjusted.maxBetPerHorse *= 1.3;
        }

        return adjusted;
    }

    /**
     * 戦略ルール初期化
     */
    initializeStrategyRules() {
        return {
            power_race: {
                focus: 'favorite',
                betTypes: ['place', 'wide'],
                maxBets: 2,
                budget_allocation: { place: 0.7, wide: 0.3 },
                riskLevel: 'low',
                maxBetPerHorse: 0.3
            },
            competitive_race: {
                focus: 'multiple',
                betTypes: ['place', 'wide', 'exacta'],
                maxBets: 3,
                budget_allocation: { place: 0.5, wide: 0.4, exacta: 0.1 },
                riskLevel: 'medium',
                maxBetPerHorse: 0.25
            },
            upset_prone: {
                focus: 'value',
                betTypes: ['place', 'wide'],
                maxBets: 3,
                budget_allocation: { place: 0.6, wide: 0.4 },
                riskLevel: 'medium',
                maxBetPerHorse: 0.2
            },
            solid_race: {
                focus: 'favorite_combo',
                betTypes: ['place', 'wide', 'trifecta'],
                maxBets: 2,
                budget_allocation: { place: 0.6, wide: 0.3, trifecta: 0.1 },
                riskLevel: 'low',
                maxBetPerHorse: 0.35
            },
            difficult_race: {
                focus: 'minimal',
                betTypes: ['place'],
                maxBets: 1,
                budget_allocation: { place: 1.0 },
                riskLevel: 'very_low',
                maxBetPerHorse: 0.15
            },
            standard_race: {
                focus: 'balanced',
                betTypes: ['place', 'wide'],
                maxBets: 2,
                budget_allocation: { place: 0.65, wide: 0.35 },
                riskLevel: 'medium',
                maxBetPerHorse: 0.25
            }
        };
    }

    /**
     * 保守的戦略
     */
    getConservativeStrategy() {
        return {
            focus: 'safety',
            betTypes: ['place'],
            maxBets: 1,
            budget_allocation: { place: 1.0 },
            riskLevel: 'very_low',
            maxBetPerHorse: 0.2
        };
    }

    /**
     * 積極的戦略
     */
    getActiveStrategy(baseStrategy) {
        return {
            ...baseStrategy,
            maxBets: Math.min(baseStrategy.maxBets + 1, 4),
            maxBetPerHorse: Math.min(baseStrategy.maxBetPerHorse * 1.2, 0.4),
            riskLevel: baseStrategy.riskLevel === 'low' ? 'medium' : 'high'
        };
    }

    /**
     * 戦略信頼度計算
     */
    calculateStrategyConfidence(raceCharacteristics, marketConditions) {
        let confidence = 50; // ベース信頼度
        
        // レースタイプ別信頼度
        const typeConfidence = {
            power_race: 85,
            solid_race: 80,
            competitive_race: 60,
            upset_prone: 55,
            difficult_race: 30,
            standard_race: 70
        };
        
        confidence = typeConfidence[raceCharacteristics.type] || 50;
        
        // 実力分析による調整
        if (raceCharacteristics.powerAnalysis.certainty) confidence += 10;
        if (raceCharacteristics.powerAnalysis.avgConfidence > 80) confidence += 5;
        
        // 市場状況による調整
        if (marketConditions.maxExpectedValue > 1.3) confidence += 5;
        if (marketConditions.goodValueHorses >= 2) confidence += 5;
        
        return Math.min(95, Math.max(20, confidence));
    }

    /**
     * 戦略根拠生成（強化版）
     */
    generateStrategyReasoning(raceCharacteristics, marketConditions, strategy) {
        const reasons = [];
        
        // レースタイプ別根拠
        const typeReasons = {
            power_race: '実力差が明確なため本命重視戦略',
            competitive_race: '実力が接近しているため分散投資戦略',
            upset_prone: '人気薄に妙味があるため価値重視戦略',
            solid_race: '人気馬が安定しているため堅実戦略',
            difficult_race: '予想が困難なため最小リスク戦略',
            standard_race: '標準的なレースのためバランス戦略'
        };
        
        reasons.push(typeReasons[raceCharacteristics.type] || '標準戦略を適用');
        
        // 強化された見送り判定理由
        const skipAnalysis = this.analyzeSkipReasons(marketConditions, raceCharacteristics);
        if (skipAnalysis.shouldSkip) {
            reasons.push(...skipAnalysis.detailedReasons);
        } else {
            // 市場状況根拠（従来通り）
            if (marketConditions.maxExpectedValue >= 1.4) {
                reasons.push('高期待値馬券が存在するため積極投資');
            } else if (marketConditions.maxExpectedValue >= 1.1) {
                reasons.push(`最高期待値${marketConditions.maxExpectedValue.toFixed(2)}で投資価値あり`);
            }
        }
        
        // フィールドサイズ根拠
        if (raceCharacteristics.fieldSize <= 8) {
            reasons.push('少頭数のため絞り込み戦略');
        } else if (raceCharacteristics.fieldSize >= 16) {
            reasons.push('多頭数のため幅広い投資機会');
        }
        
        return reasons;
    }

    /**
     * 強化された見送り分析
     */
    analyzeSkipReasons(marketConditions, raceCharacteristics) {
        const analysis = {
            shouldSkip: false,
            detailedReasons: []
        };
        
        // 期待値分析の詳細化
        if (marketConditions.maxExpectedValue < 1.1) {
            analysis.shouldSkip = true;
            
            // 期待値分布の詳細分析
            const expectedValues = this.getExpectedValueDistribution(marketConditions);
            
            if (expectedValues.length > 0) {
                const distribution = expectedValues
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 3)
                    .map(ev => `${ev.horse}:${ev.value.toFixed(2)}`)
                    .join('／');
                
                if (expectedValues.every(ev => ev.value < 1.0)) {
                    analysis.detailedReasons.push(`全馬期待値1.0未満（${distribution}）のため見送り推奨`);
                } else {
                    const range = expectedValues[0].value - expectedValues[expectedValues.length - 1].value;
                    if (range < 0.1) {
                        analysis.detailedReasons.push(`期待値が誤差範囲内で拮抗（${distribution}）のため判断困難`);
                    } else {
                        analysis.detailedReasons.push(`最高期待値${marketConditions.maxExpectedValue.toFixed(2)}で投資効率が低い`);
                    }
                }
            } else {
                analysis.detailedReasons.push('期待値が低いため消極投資または見送り');
            }
        }
        
        // 競争度による見送り判定
        if (raceCharacteristics.competitiveness > 0.9) {
            analysis.shouldSkip = true;
            analysis.detailedReasons.push('実力が極めて拮抗しており予想困難のため見送り');
        }
        
        // 信頼度による見送り判定
        if (raceCharacteristics.powerAnalysis.avgConfidence < 50) {
            analysis.shouldSkip = true;
            analysis.detailedReasons.push(`平均信頼度${raceCharacteristics.powerAnalysis.avgConfidence.toFixed(1)}%で予想精度が低い`);
        }
        
        return analysis;
    }

    /**
     * 期待値分布取得（仮想的な実装）
     */
    getExpectedValueDistribution(marketConditions) {
        // 実際の実装では、analyzeRaceExpectedValueから詳細データを取得
        // ここでは仮想的なデータを返す
        if (marketConditions.analyzedHorses) {
            return marketConditions.analyzedHorses
                .filter(horse => horse.expectedValue)
                .map(horse => ({
                    horse: horse.horse.name.substring(0, 3),
                    value: horse.expectedValue
                }))
                .sort((a, b) => b.value - a.value);
        }
        
        return [];
    }

    /**
     * ユーティリティメソッド
     */
    calculateVariance(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    }

    calculateCompetitiveness(powerAnalysis, popularityAnalysis) {
        const powerCompetitiveness = 1 - (powerAnalysis.powerGap / 100);
        const popularityCompetitiveness = 1 - popularityAnalysis.favoriteConcentration;
        return (powerCompetitiveness + popularityCompetitiveness) / 2;
    }

    classifyPopularityStructure(concentration, topScore) {
        if (concentration > 0.5 && topScore > 80) return 'favorite_dominated';
        if (concentration < 0.3) return 'wide_open';
        if (topScore < 70) return 'weak_favorite';
        return 'balanced';
    }

    evaluateInvestmentOpportunity(horses) {
        const opportunities = horses.filter(h => 
            h.expectedValue >= 1.2 && h.confidence >= 70
        ).length;
        
        if (opportunities >= 3) return 'excellent';
        if (opportunities === 2) return 'good';
        if (opportunities === 1) return 'limited';
        return 'poor';
    }

    defineRaceTypes() {
        return {
            power_race: '実力型',
            competitive_race: '混戦型', 
            upset_prone: '荒れ型',
            solid_race: '堅実型',
            difficult_race: '難解型',
            standard_race: '標準型'
        };
    }

    /**
     * 戦略実行プラン生成
     */
    generateExecutionPlan(strategyResult, horseAnalysis, budget = 1000) {
        const strategy = strategyResult.strategy;
        const horses = horseAnalysis.analyzedHorses || [];
        
        const plan = {
            strategy: strategyResult,
            budget: budget,
            allocations: {},
            recommendations: [],
            totalAllocation: 0
        };

        // 予算配分計算
        Object.keys(strategy.budget_allocation).forEach(betType => {
            if (betType !== 'aggressive') {
                plan.allocations[betType] = Math.floor(budget * strategy.budget_allocation[betType]);
            }
        });

        // 具体的推奨生成
        const targetHorses = this.selectTargetHorses(horses, strategy);
        
        targetHorses.forEach((horse, index) => {
            if (index >= strategy.maxBets) return;
            
            const betAmount = Math.min(
                plan.allocations.place || 0,
                Math.floor(budget * strategy.maxBetPerHorse)
            );
            
            if (betAmount >= 100) {
                plan.recommendations.push({
                    type: 'place',
                    horse: horse.horse,
                    amount: betAmount,
                    expectedValue: horse.expectedValue,
                    confidence: horse.confidence,
                    reason: `${strategyResult.raceType}戦略による推奨`,
                    strategy: strategy.focus
                });
                
                plan.totalAllocation += betAmount;
            }
        });

        return plan;
    }

    /**
     * 対象馬選択
     */
    selectTargetHorses(horses, strategy) {
        let targets = [];
        
        switch (strategy.focus) {
            case 'favorite':
                targets = horses.filter(h => h.popularity <= 3)
                               .sort((a, b) => a.popularity - b.popularity);
                break;
            case 'value':
                targets = horses.filter(h => h.expectedValue >= 1.2)
                               .sort((a, b) => b.expectedValue - a.expectedValue);
                break;
            case 'multiple':
                targets = horses.filter(h => h.expectedValue >= 1.1)
                               .sort((a, b) => b.confidence - a.confidence);
                break;
            default:
                targets = horses.sort((a, b) => b.expectedValue - a.expectedValue);
        }
        
        return targets.slice(0, strategy.maxBets);
    }
}

// グローバル変数として公開
window.RaceStrategyManager = RaceStrategyManager;