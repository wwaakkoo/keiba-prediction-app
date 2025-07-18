/**
 * Phase 7: パフォーマンス分析モジュール
 * パフォーマンス改善ポイントの抽出と具体的提案生成
 */

class PerformanceAnalyzer extends AnalysisModule {
    constructor() {
        super('パフォーマンス分析');
        
        this.analysisThresholds = {
            winRateDeclineThreshold: 5,      // 勝率低下閾値 (%)
            roiDeclineThreshold: 3,          // ROI低下閾値 (%)
            consistencyThreshold: 0.3,       // 一貫性閾値
            trendAnalysisPeriod: 10,         // トレンド分析期間
            comparisonPeriod: 5              // 比較期間
        };
        
        this.improvementPatterns = {
            scoreOptimization: {
                description: 'スコア閾値の最適化',
                triggers: ['low_accuracy', 'false_positives'],
                actions: ['increase_threshold', 'refine_criteria']
            },
            expectationAdjustment: {
                description: '期待値基準の調整',
                triggers: ['poor_roi', 'low_profitability'],
                actions: ['increase_expectation', 'filter_candidates']
            },
            popularityRebalancing: {
                description: '人気層バランスの調整',
                triggers: ['popularity_bias', 'low_dividend'],
                actions: ['adjust_popularity_weight', 'diversify_selections']
            }
        };
    }

    /**
     * パフォーマンス分析の実行
     */
    async performAnalysis() {
        console.log('📊 パフォーマンス分析開始');
        
        const insights = [];
        
        // 履歴データの取得
        const performanceHistory = this.getPerformanceHistory();
        const portfolioHistory = this.getPortfolioHistory();
        
        if (!performanceHistory || performanceHistory.length < 5) {
            console.log('⚠️ 分析に十分なデータがありません');
            return insights;
        }
        
        // 1. 勝率低下分析
        const winRateInsights = this.analyzeWinRateDecline(performanceHistory);
        insights.push(...winRateInsights);
        
        // 2. ROI低下分析
        const roiInsights = this.analyzeROIDecline(performanceHistory);
        insights.push(...roiInsights);
        
        // 3. 一貫性分析
        const consistencyInsights = this.analyzeConsistency(performanceHistory);
        insights.push(...consistencyInsights);
        
        // 4. スコア効率性分析
        const scoreEfficiencyInsights = this.analyzeScoreEfficiency(performanceHistory);
        insights.push(...scoreEfficiencyInsights);
        
        // 5. 人気層バランス分析
        const popularityInsights = this.analyzePopularityBalance(performanceHistory);
        insights.push(...popularityInsights);
        
        // 6. 期待値実績乖離分析
        const expectationInsights = this.analyzeExpectationDeviation(performanceHistory);
        insights.push(...expectationInsights);
        
        console.log(`✅ パフォーマンス分析完了: ${insights.length}件のインサイト`);
        return insights;
    }

    /**
     * 勝率低下分析
     */
    analyzeWinRateDecline(history) {
        const insights = [];
        
        const recentPeriod = history.slice(-this.analysisThresholds.comparisonPeriod);
        const previousPeriod = history.slice(
            -(this.analysisThresholds.comparisonPeriod * 2), 
            -this.analysisThresholds.comparisonPeriod
        );
        
        const recentWinRate = this.calculateWinRate(recentPeriod);
        const previousWinRate = this.calculateWinRate(previousPeriod);
        const winRateChange = recentWinRate - previousWinRate;
        
        if (winRateChange < -this.analysisThresholds.winRateDeclineThreshold) {
            const rootCause = this.identifyWinRateDeclineCause(recentPeriod, previousPeriod);
            
            const actions = this.generateWinRateImprovementActions(rootCause, recentWinRate, previousWinRate);
            
            const insight = this.generateInsight(
                'performance',
                'warning',
                '勝率低下傾向を検出',
                `直近${this.analysisThresholds.comparisonPeriod}レースの勝率が${Math.abs(winRateChange).toFixed(1)}%低下しています（${previousWinRate.toFixed(1)}% → ${recentWinRate.toFixed(1)}%）`,
                actions,
                {
                    subType: 'win_rate_decline',
                    confidence: 80,
                    prediction: `提案実行により勝率${Math.min(Math.abs(winRateChange) * 0.7, 8).toFixed(1)}%の改善が期待されます`,
                    rationale: `根本原因: ${rootCause.description}。${rootCause.evidence}`,
                    currentMetrics: {
                        winRate: recentWinRate,
                        previousWinRate: previousWinRate,
                        change: winRateChange
                    }
                }
            );
            
            insights.push(insight);
        }
        
        return insights;
    }

    /**
     * ROI低下分析
     */
    analyzeROIDecline(history) {
        const insights = [];
        
        const recentPeriod = history.slice(-this.analysisThresholds.comparisonPeriod);
        const previousPeriod = history.slice(
            -(this.analysisThresholds.comparisonPeriod * 2), 
            -this.analysisThresholds.comparisonPeriod
        );
        
        const recentROI = this.calculateROI(recentPeriod);
        const previousROI = this.calculateROI(previousPeriod);
        const roiChange = recentROI - previousROI;
        
        if (roiChange < -this.analysisThresholds.roiDeclineThreshold) {
            const rootCause = this.identifyROIDeclineCause(recentPeriod, previousPeriod);
            
            const actions = this.generateROIImprovementActions(rootCause, recentROI, previousROI);
            
            const insight = this.generateInsight(
                'performance',
                roiChange < -10 ? 'critical' : 'warning',
                'ROI低下傾向を検出',
                `直近${this.analysisThresholds.comparisonPeriod}レースのROIが${Math.abs(roiChange).toFixed(1)}%低下しています（${previousROI.toFixed(1)}% → ${recentROI.toFixed(1)}%）`,
                actions,
                {
                    subType: 'roi_decline',
                    confidence: 85,
                    prediction: `提案実行によりROI${Math.min(Math.abs(roiChange) * 0.6, 12).toFixed(1)}%の改善が期待されます`,
                    rationale: `根本原因: ${rootCause.description}。${rootCause.evidence}`,
                    currentMetrics: {
                        roi: recentROI,
                        previousROI: previousROI,
                        change: roiChange
                    }
                }
            );
            
            insights.push(insight);
        }
        
        return insights;
    }

    /**
     * 一貫性分析
     */
    analyzeConsistency(history) {
        const insights = [];
        
        const recentPeriod = history.slice(-this.analysisThresholds.trendAnalysisPeriod);
        const variance = this.calculateVariance(recentPeriod.map(r => r.roi || 0));
        const standardDeviation = Math.sqrt(variance);
        
        if (standardDeviation > this.analysisThresholds.consistencyThreshold) {
            const volatilityCause = this.identifyVolatilityCause(recentPeriod);
            
            const actions = this.generateConsistencyImprovementActions(volatilityCause, standardDeviation);
            
            const insight = this.generateInsight(
                'performance',
                'info',
                '成績の一貫性向上提案',
                `直近${this.analysisThresholds.trendAnalysisPeriod}レースの成績にばらつきが見られます（標準偏差: ${standardDeviation.toFixed(2)}）`,
                actions,
                {
                    subType: 'consistency_improvement',
                    confidence: 70,
                    prediction: `提案実行により成績の安定性が${Math.min(30, standardDeviation * 100).toFixed(0)}%改善されます`,
                    rationale: `変動原因: ${volatilityCause.description}。${volatilityCause.evidence}`,
                    currentMetrics: {
                        standardDeviation: standardDeviation,
                        variance: variance,
                        consistencyScore: Math.max(0, 1 - standardDeviation)
                    }
                }
            );
            
            insights.push(insight);
        }
        
        return insights;
    }

    /**
     * スコア効率性分析
     */
    analyzeScoreEfficiency(history) {
        const insights = [];
        
        const recentPeriod = history.slice(-this.analysisThresholds.trendAnalysisPeriod);
        const scoreEfficiency = this.calculateScoreEfficiency(recentPeriod);
        
        if (scoreEfficiency.accuracy < 0.7) {
            const actions = this.generateScoreOptimizationActions(scoreEfficiency);
            
            const insight = this.generateInsight(
                'performance',
                'warning',
                'スコア精度向上提案',
                `現在のスコア基準の精度が${(scoreEfficiency.accuracy * 100).toFixed(1)}%と低下しています`,
                actions,
                {
                    subType: 'score_efficiency',
                    confidence: 75,
                    prediction: `スコア閾値調整により精度${((0.8 - scoreEfficiency.accuracy) * 100).toFixed(1)}%の改善が期待されます`,
                    rationale: `分析結果: ${scoreEfficiency.analysis}`,
                    currentMetrics: {
                        accuracy: scoreEfficiency.accuracy,
                        precision: scoreEfficiency.precision,
                        recall: scoreEfficiency.recall,
                        f1Score: scoreEfficiency.f1Score
                    }
                }
            );
            
            insights.push(insight);
        }
        
        return insights;
    }

    /**
     * 人気層バランス分析
     */
    analyzePopularityBalance(history) {
        const insights = [];
        
        const recentPeriod = history.slice(-this.analysisThresholds.trendAnalysisPeriod);
        const popularityAnalysis = this.analyzePopularityDistribution(recentPeriod);
        
        if (popularityAnalysis.imbalance > 0.3) {
            const actions = this.generatePopularityRebalancingActions(popularityAnalysis);
            
            const insight = this.generateInsight(
                'performance',
                'info',
                '人気層バランス最適化提案',
                `${popularityAnalysis.dominantLayer}への偏重が見られます（偏重度: ${(popularityAnalysis.imbalance * 100).toFixed(1)}%）`,
                actions,
                {
                    subType: 'popularity_balance',
                    confidence: 70,
                    prediction: `バランス調整により配当効率${(popularityAnalysis.improvementPotential * 100).toFixed(1)}%の改善が期待されます`,
                    rationale: `人気層分析: ${popularityAnalysis.description}`,
                    currentMetrics: {
                        imbalance: popularityAnalysis.imbalance,
                        dominantLayer: popularityAnalysis.dominantLayer,
                        distribution: popularityAnalysis.distribution
                    }
                }
            );
            
            insights.push(insight);
        }
        
        return insights;
    }

    /**
     * 期待値実績乖離分析
     */
    analyzeExpectationDeviation(history) {
        const insights = [];
        
        const recentPeriod = history.slice(-this.analysisThresholds.trendAnalysisPeriod);
        const deviationAnalysis = this.calculateExpectationDeviation(recentPeriod);
        
        if (Math.abs(deviationAnalysis.deviation) > 0.15) {
            const actions = this.generateExpectationAdjustmentActions(deviationAnalysis);
            
            const insight = this.generateInsight(
                'performance',
                'warning',
                '期待値実績乖離の調整提案',
                `期待値と実績の乖離が${(Math.abs(deviationAnalysis.deviation) * 100).toFixed(1)}%発生しています`,
                actions,
                {
                    subType: 'expectation_deviation',
                    confidence: 80,
                    prediction: `期待値基準調整により乖離${(Math.abs(deviationAnalysis.deviation) * 50).toFixed(1)}%の改善が期待されます`,
                    rationale: `乖離原因: ${deviationAnalysis.cause}。${deviationAnalysis.evidence}`,
                    currentMetrics: {
                        expectedValue: deviationAnalysis.expectedValue,
                        actualValue: deviationAnalysis.actualValue,
                        deviation: deviationAnalysis.deviation,
                        deviationRate: Math.abs(deviationAnalysis.deviation)
                    }
                }
            );
            
            insights.push(insight);
        }
        
        return insights;
    }

    /**
     * 勝率低下原因の特定
     */
    identifyWinRateDeclineCause(recent, previous) {
        const recentAvgScore = this.calculateAverageScore(recent);
        const previousAvgScore = this.calculateAverageScore(previous);
        
        const recentPopularity = this.calculateAveragePopularity(recent);
        const previousPopularity = this.calculateAveragePopularity(previous);
        
        if (recentAvgScore < previousAvgScore - 5) {
            return {
                type: 'score_decline',
                description: 'スコア基準の低下',
                evidence: `平均スコア ${previousAvgScore.toFixed(1)} → ${recentAvgScore.toFixed(1)}`,
                recommendation: 'score_threshold_increase'
            };
        }
        
        if (recentPopularity < previousPopularity - 1) {
            return {
                type: 'popularity_shift',
                description: '人気層の変化',
                evidence: `平均人気順位 ${previousPopularity.toFixed(1)} → ${recentPopularity.toFixed(1)}`,
                recommendation: 'popularity_weight_adjustment'
            };
        }
        
        return {
            type: 'market_condition',
            description: '市場環境の変化',
            evidence: '明確な内部要因が特定できません',
            recommendation: 'comprehensive_review'
        };
    }

    /**
     * ROI低下原因の特定
     */
    identifyROIDeclineCause(recent, previous) {
        const recentAvgOdds = this.calculateAverageOdds(recent);
        const previousAvgOdds = this.calculateAverageOdds(previous);
        
        const recentWinRate = this.calculateWinRate(recent);
        const recentAvgReturn = this.calculateAverageReturn(recent);
        
        if (recentAvgOdds < previousAvgOdds - 0.5) {
            return {
                type: 'low_odds',
                description: 'オッズの低下',
                evidence: `平均オッズ ${previousAvgOdds.toFixed(2)} → ${recentAvgOdds.toFixed(2)}`,
                recommendation: 'odds_threshold_increase'
            };
        }
        
        if (recentWinRate > 0.6 && recentAvgReturn < 1.2) {
            return {
                type: 'low_dividend',
                description: '配当効率の低下',
                evidence: `勝率${recentWinRate.toFixed(1)}%だが平均配当${recentAvgReturn.toFixed(2)}倍`,
                recommendation: 'dividend_efficiency_improvement'
            };
        }
        
        return {
            type: 'expectation_deviation',
            description: '期待値と実績の乖離',
            evidence: '期待値計算の見直しが必要',
            recommendation: 'expectation_recalibration'
        };
    }

    /**
     * 変動原因の特定
     */
    identifyVolatilityCause(recent) {
        const winLossPattern = this.analyzeWinLossPattern(recent);
        const scoreVariance = this.calculateScoreVariance(recent);
        
        if (winLossPattern.streakiness > 0.6) {
            return {
                type: 'streak_pattern',
                description: '連勝・連敗パターン',
                evidence: `連勝/連敗傾向が${(winLossPattern.streakiness * 100).toFixed(0)}%`,
                recommendation: 'risk_management_adjustment'
            };
        }
        
        if (scoreVariance > 200) {
            return {
                type: 'score_inconsistency',
                description: 'スコア基準の不安定性',
                evidence: `スコア分散値 ${scoreVariance.toFixed(1)}`,
                recommendation: 'score_standardization'
            };
        }
        
        return {
            type: 'external_factors',
            description: '外部要因による変動',
            evidence: '内部要因では説明できない変動',
            recommendation: 'adaptive_strategy'
        };
    }

    /**
     * 勝率改善アクションの生成
     */
    generateWinRateImprovementActions(rootCause, currentWinRate, previousWinRate) {
        const actions = [];
        
        switch (rootCause.type) {
            case 'score_decline':
                actions.push({
                    type: 'scoreThreshold',
                    title: 'スコア閾値の引き上げ',
                    description: `現在の閾値を70から75に引き上げ`,
                    value: 75,
                    expectedEffect: `勝率 +${Math.min(8, (previousWinRate - currentWinRate) * 0.7).toFixed(1)}%`
                });
                break;
                
            case 'popularity_shift':
                actions.push({
                    type: 'popularityWeight',
                    title: '人気層重視度の調整',
                    description: '4-6番人気の重み付けを強化',
                    value: { layer: 'middle', weight: 1.2 },
                    expectedEffect: `勝率 +${Math.min(6, (previousWinRate - currentWinRate) * 0.5).toFixed(1)}%`
                });
                break;
                
            default:
                actions.push({
                    type: 'comprehensiveReview',
                    title: '包括的な基準見直し',
                    description: 'スコア・期待値・人気層の総合的な調整',
                    value: 'comprehensive',
                    expectedEffect: `勝率 +${Math.min(5, (previousWinRate - currentWinRate) * 0.4).toFixed(1)}%`
                });
        }
        
        return actions;
    }

    /**
     * ROI改善アクションの生成
     */
    generateROIImprovementActions(rootCause, currentROI, previousROI) {
        const actions = [];
        
        switch (rootCause.type) {
            case 'low_odds':
                actions.push({
                    type: 'expectedValueThreshold',
                    title: '期待値基準の引き上げ',
                    description: '最小期待値を1.1から1.2に引き上げ',
                    value: 1.2,
                    expectedEffect: `ROI +${Math.min(10, (previousROI - currentROI) * 0.6).toFixed(1)}%`
                });
                break;
                
            case 'low_dividend':
                actions.push({
                    type: 'dividendEfficiency',
                    title: '配当効率の改善',
                    description: '低配当候補の除外基準を厳格化',
                    value: { minDividend: 2.5, maxPopularity: 3 },
                    expectedEffect: `ROI +${Math.min(8, (previousROI - currentROI) * 0.5).toFixed(1)}%`
                });
                break;
                
            default:
                actions.push({
                    type: 'expectationRecalibration',
                    title: '期待値計算の再校正',
                    description: '市場効率性パラメータの調整',
                    value: 'recalibrate',
                    expectedEffect: `ROI +${Math.min(6, (previousROI - currentROI) * 0.4).toFixed(1)}%`
                });
        }
        
        return actions;
    }

    /**
     * 一貫性改善アクションの生成
     */
    generateConsistencyImprovementActions(volatilityCause, standardDeviation) {
        const actions = [];
        
        switch (volatilityCause.type) {
            case 'streak_pattern':
                actions.push({
                    type: 'riskManagement',
                    title: 'リスク管理の強化',
                    description: '連勝/連敗時の投資比率調整',
                    value: { streakLimit: 3, adjustmentRatio: 0.8 },
                    expectedEffect: `変動幅 -${Math.min(30, standardDeviation * 100).toFixed(0)}%`
                });
                break;
                
            case 'score_inconsistency':
                actions.push({
                    type: 'scoreStandardization',
                    title: 'スコア基準の標準化',
                    description: 'スコア計算の一貫性向上',
                    value: 'standardize',
                    expectedEffect: `変動幅 -${Math.min(25, standardDeviation * 80).toFixed(0)}%`
                });
                break;
                
            default:
                actions.push({
                    type: 'adaptiveStrategy',
                    title: '適応的戦略の導入',
                    description: '市場環境に応じた動的調整',
                    value: 'adaptive',
                    expectedEffect: `変動幅 -${Math.min(20, standardDeviation * 60).toFixed(0)}%`
                });
        }
        
        return actions;
    }

    /**
     * スコア最適化アクションの生成
     */
    generateScoreOptimizationActions(scoreEfficiency) {
        const actions = [];
        
        if (scoreEfficiency.precision < 0.7) {
            actions.push({
                type: 'scoreThreshold',
                title: 'スコア閾値の最適化',
                description: '精度向上のため閾値を調整',
                value: 80,
                expectedEffect: `精度 +${((0.8 - scoreEfficiency.precision) * 100).toFixed(1)}%`
            });
        }
        
        if (scoreEfficiency.recall < 0.6) {
            actions.push({
                type: 'scoreCriteria',
                title: 'スコア基準の見直し',
                description: '見逃し削減のため基準を調整',
                value: 'optimize_criteria',
                expectedEffect: `再現率 +${((0.7 - scoreEfficiency.recall) * 100).toFixed(1)}%`
            });
        }
        
        return actions;
    }

    /**
     * 人気層リバランスアクションの生成
     */
    generatePopularityRebalancingActions(popularityAnalysis) {
        const actions = [];
        
        if (popularityAnalysis.dominantLayer === 'popular') {
            actions.push({
                type: 'popularityWeight',
                title: '中人気層の重視',
                description: '4-6番人気の重み付けを強化',
                value: { layer: 'middle', weight: 1.3 },
                expectedEffect: `配当効率 +${(popularityAnalysis.improvementPotential * 100).toFixed(1)}%`
            });
        } else if (popularityAnalysis.dominantLayer === 'unpopular') {
            actions.push({
                type: 'popularityWeight',
                title: '人気層バランスの調整',
                description: '1-3番人気の比重を増加',
                value: { layer: 'popular', weight: 1.2 },
                expectedEffect: `安定性 +${(popularityAnalysis.improvementPotential * 80).toFixed(1)}%`
            });
        }
        
        return actions;
    }

    /**
     * 期待値調整アクションの生成
     */
    generateExpectationAdjustmentActions(deviationAnalysis) {
        const actions = [];
        
        if (deviationAnalysis.deviation > 0.15) {
            actions.push({
                type: 'expectedValueThreshold',
                title: '期待値基準の厳格化',
                description: '最小期待値を引き上げ',
                value: 1.3,
                expectedEffect: `乖離 -${(Math.abs(deviationAnalysis.deviation) * 50).toFixed(1)}%`
            });
        } else if (deviationAnalysis.deviation < -0.15) {
            actions.push({
                type: 'expectedValueThreshold',
                title: '期待値基準の緩和',
                description: '最小期待値を引き下げ',
                value: 1.05,
                expectedEffect: `乖離 -${(Math.abs(deviationAnalysis.deviation) * 50).toFixed(1)}%`
            });
        }
        
        return actions;
    }

    /**
     * 各種計算メソッド
     */
    calculateWinRate(history) {
        if (!history || history.length === 0) return 0;
        const wins = history.filter(h => h.result === 'win' || h.won === true).length;
        return (wins / history.length) * 100;
    }

    calculateROI(history) {
        if (!history || history.length === 0) return 0;
        const totalInvestment = history.reduce((sum, h) => sum + (h.investment || h.amount || 0), 0);
        const totalReturn = history.reduce((sum, h) => sum + (h.return || h.payout || 0), 0);
        return totalInvestment > 0 ? ((totalReturn - totalInvestment) / totalInvestment) * 100 : 0;
    }

    calculateVariance(values) {
        if (!values || values.length === 0) return 0;
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    }

    calculateAverageScore(history) {
        if (!history || history.length === 0) return 0;
        const scores = history.map(h => h.score || 0).filter(s => s > 0);
        return scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
    }

    calculateAveragePopularity(history) {
        if (!history || history.length === 0) return 0;
        const popularities = history.map(h => h.popularity || 0).filter(p => p > 0);
        return popularities.length > 0 ? popularities.reduce((sum, p) => sum + p, 0) / popularities.length : 0;
    }

    calculateAverageOdds(history) {
        if (!history || history.length === 0) return 0;
        const odds = history.map(h => h.odds || 0).filter(o => o > 0);
        return odds.length > 0 ? odds.reduce((sum, o) => sum + o, 0) / odds.length : 0;
    }

    calculateAverageReturn(history) {
        if (!history || history.length === 0) return 0;
        const returns = history.map(h => (h.return || h.payout || 0) / (h.investment || h.amount || 1));
        return returns.length > 0 ? returns.reduce((sum, r) => sum + r, 0) / returns.length : 0;
    }

    calculateScoreEfficiency(history) {
        if (!history || history.length === 0) {
            return { accuracy: 0, precision: 0, recall: 0, f1Score: 0, analysis: 'データ不足' };
        }
        
        let truePositives = 0;
        let falsePositives = 0;
        let falseNegatives = 0;
        let trueNegatives = 0;
        
        history.forEach(h => {
            const predicted = (h.score || 0) >= 70; // 仮の閾値
            const actual = h.result === 'win' || h.won === true;
            
            if (predicted && actual) truePositives++;
            else if (predicted && !actual) falsePositives++;
            else if (!predicted && actual) falseNegatives++;
            else trueNegatives++;
        });
        
        const accuracy = (truePositives + trueNegatives) / history.length;
        const precision = truePositives / (truePositives + falsePositives) || 0;
        const recall = truePositives / (truePositives + falseNegatives) || 0;
        const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
        
        return {
            accuracy,
            precision,
            recall,
            f1Score,
            analysis: `TP:${truePositives}, FP:${falsePositives}, FN:${falseNegatives}, TN:${trueNegatives}`
        };
    }

    analyzePopularityDistribution(history) {
        if (!history || history.length === 0) {
            return { imbalance: 0, dominantLayer: 'unknown', distribution: {}, improvementPotential: 0 };
        }
        
        const distribution = { popular: 0, middle: 0, unpopular: 0 };
        
        history.forEach(h => {
            const popularity = h.popularity || 0;
            if (popularity <= 3) distribution.popular++;
            else if (popularity <= 6) distribution.middle++;
            else distribution.unpopular++;
        });
        
        const total = history.length;
        const popularRatio = distribution.popular / total;
        const middleRatio = distribution.middle / total;
        const unpopularRatio = distribution.unpopular / total;
        
        const maxRatio = Math.max(popularRatio, middleRatio, unpopularRatio);
        const dominantLayer = maxRatio === popularRatio ? 'popular' : 
                            maxRatio === middleRatio ? 'middle' : 'unpopular';
        
        const imbalance = maxRatio - (1/3); // 理想的には1/3ずつ
        const improvementPotential = Math.min(0.3, imbalance * 0.5);
        
        return {
            imbalance,
            dominantLayer,
            distribution: { popular: popularRatio, middle: middleRatio, unpopular: unpopularRatio },
            improvementPotential,
            description: `${dominantLayer}層が${(maxRatio * 100).toFixed(1)}%を占める`
        };
    }

    calculateExpectationDeviation(history) {
        if (!history || history.length === 0) {
            return { expectedValue: 0, actualValue: 0, deviation: 0, cause: 'データ不足' };
        }
        
        const expectedValue = history.reduce((sum, h) => sum + (h.expectedValue || 1.0), 0) / history.length;
        const actualValue = history.reduce((sum, h) => {
            const investment = h.investment || h.amount || 0;
            const return_ = h.return || h.payout || 0;
            return sum + (investment > 0 ? return_ / investment : 0);
        }, 0) / history.length;
        
        const deviation = actualValue - expectedValue;
        
        let cause = '';
        if (deviation > 0.1) {
            cause = '期待値が保守的すぎる';
        } else if (deviation < -0.1) {
            cause = '期待値が楽観的すぎる';
        } else {
            cause = '期待値は適切な範囲内';
        }
        
        return {
            expectedValue,
            actualValue,
            deviation,
            cause,
            evidence: `期待値${expectedValue.toFixed(3)} vs 実績${actualValue.toFixed(3)}`
        };
    }

    analyzeWinLossPattern(history) {
        if (!history || history.length === 0) {
            return { streakiness: 0, maxWinStreak: 0, maxLossStreak: 0 };
        }
        
        let currentStreak = 0;
        let maxWinStreak = 0;
        let maxLossStreak = 0;
        let streakChanges = 0;
        let lastResult = null;
        
        history.forEach(h => {
            const won = h.result === 'win' || h.won === true;
            
            if (lastResult !== null && lastResult !== won) {
                streakChanges++;
                currentStreak = 1;
            } else {
                currentStreak++;
            }
            
            if (won) {
                maxWinStreak = Math.max(maxWinStreak, currentStreak);
            } else {
                maxLossStreak = Math.max(maxLossStreak, currentStreak);
            }
            
            lastResult = won;
        });
        
        const streakiness = 1 - (streakChanges / history.length);
        
        return { streakiness, maxWinStreak, maxLossStreak };
    }

    calculateScoreVariance(history) {
        if (!history || history.length === 0) return 0;
        const scores = history.map(h => h.score || 0).filter(s => s > 0);
        return this.calculateVariance(scores);
    }

    /**
     * パフォーマンス履歴の取得
     */
    getPerformanceHistory() {
        const data = localStorage.getItem('performanceHistory');
        return data ? JSON.parse(data) : null;
    }

    /**
     * ポートフォリオ履歴の取得
     */
    getPortfolioHistory() {
        const data = localStorage.getItem('portfolioHistory');
        return data ? JSON.parse(data) : null;
    }
}

// グローバル公開
window.PerformanceAnalyzer = PerformanceAnalyzer;