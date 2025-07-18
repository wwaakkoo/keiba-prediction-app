/**
 * Phase 7: 未来予測・シナリオ分析システム
 * 現在の成績継続・改善・悪化シナリオでの将来予測と意思決定支援
 */

class ScenarioAnalyzer extends AnalysisModule {
    constructor() {
        super('シナリオ分析');
        
        // シナリオ設定
        this.scenarios = {
            pessimistic: {
                name: '悲観的シナリオ',
                performanceMultiplier: 0.7,
                riskMultiplier: 1.3,
                description: '成績30%悪化、リスク30%増加'
            },
            realistic: {
                name: '現実的シナリオ',
                performanceMultiplier: 1.0,
                riskMultiplier: 1.0,
                description: '現在の成績水準維持'
            },
            optimistic: {
                name: '楽観的シナリオ',
                performanceMultiplier: 1.3,
                riskMultiplier: 0.8,
                description: '成績30%改善、リスク20%減少'
            }
        };
        
        // 予測設定
        this.predictionSettings = {
            shortTermPeriod: 10,              // 短期予測期間（10レース）
            mediumTermPeriod: 30,             // 中期予測期間（30レース）
            longTermPeriod: 100,              // 長期予測期間（100レース）
            simulationRuns: 1000,             // シミュレーション回数
            confidenceLevel: 0.8,             // 信頼水準
            riskThreshold: 0.2,               // リスク閾値
            targetROI: 0.15                   // 目標ROI
        };
        
        // 分析メトリクス
        this.analysisMetrics = {
            expectedReturn: '期待収益',
            riskProbability: 'リスク確率',
            breakEvenProbability: '損益分岐点到達確率',
            maxDrawdown: '最大ドローダウン',
            timeToTarget: '目標達成時間',
            volatility: '変動率'
        };
        
        // 改善提案パターン
        this.improvementPatterns = {
            scoreThreshold: {
                description: 'スコア閾値調整',
                impact: { winRate: 0.05, roi: 0.03, risk: -0.02 }
            },
            riskMultiplier: {
                description: 'リスク倍率調整',
                impact: { winRate: 0.02, roi: 0.02, risk: -0.05 }
            },
            candidateSelection: {
                description: '候補選択厳格化',
                impact: { winRate: 0.08, roi: 0.06, risk: -0.03 }
            }
        };
    }

    /**
     * シナリオ分析の実行
     */
    async performAnalysis() {
        console.log('🔮 シナリオ分析開始');
        
        const insights = [];
        
        // 履歴データの取得
        const performanceHistory = this.getPerformanceHistory();
        const portfolioData = this.getPortfolioData();
        
        if (!performanceHistory || performanceHistory.length < 5) {
            console.log('⚠️ シナリオ分析に十分なデータがありません');
            return insights;
        }
        
        // 1. 短期予測分析
        const shortTermInsights = this.analyzeShortTermScenarios(performanceHistory, portfolioData);
        insights.push(...shortTermInsights);
        
        // 2. 中期予測分析
        const mediumTermInsights = this.analyzeMediumTermScenarios(performanceHistory, portfolioData);
        insights.push(...mediumTermInsights);
        
        // 3. 長期予測分析
        const longTermInsights = this.analyzeLongTermScenarios(performanceHistory, portfolioData);
        insights.push(...longTermInsights);
        
        // 4. リスク分析
        const riskInsights = this.analyzeRiskScenarios(performanceHistory, portfolioData);
        insights.push(...riskInsights);
        
        // 5. 目標達成分析
        const targetInsights = this.analyzeTargetAchievement(performanceHistory, portfolioData);
        insights.push(...targetInsights);
        
        // 6. 改善シミュレーション
        const improvementInsights = this.analyzeImprovementScenarios(performanceHistory, portfolioData);
        insights.push(...improvementInsights);
        
        console.log(`✅ シナリオ分析完了: ${insights.length}件のインサイト`);
        return insights;
    }

    /**
     * 短期予測分析
     */
    analyzeShortTermScenarios(history, portfolio) {
        const insights = [];
        
        const shortTermPrediction = this.generateShortTermPrediction(history, portfolio);
        
        if (shortTermPrediction.riskLevel > 0.3) {
            const actions = this.generateShortTermActions(shortTermPrediction);
            
            const insight = this.generateInsight(
                'scenario',
                'warning',
                `短期予測(${this.predictionSettings.shortTermPeriod}レース)での注意喚起`,
                `現在の成績継続で${shortTermPrediction.expectedReturn > 0 ? '+' : ''}${shortTermPrediction.expectedReturn.toFixed(0)}円の期待収益ですが、リスクレベルが高くなっています。`,
                actions,
                {
                    subType: 'short_term_prediction',
                    confidence: 80,
                    prediction: `期待収益: ${shortTermPrediction.expectedReturn.toFixed(0)}円 (${(shortTermPrediction.confidence * 100).toFixed(0)}%信頼区間)`,
                    rationale: `短期分析: ${shortTermPrediction.analysis}`,
                    currentMetrics: {
                        expectedReturn: shortTermPrediction.expectedReturn,
                        riskLevel: shortTermPrediction.riskLevel,
                        winProbability: shortTermPrediction.winProbability,
                        scenarios: shortTermPrediction.scenarios
                    }
                }
            );
            
            insights.push(insight);
        }
        
        return insights;
    }

    /**
     * 中期予測分析
     */
    analyzeMediumTermScenarios(history, portfolio) {
        const insights = [];
        
        const mediumTermPrediction = this.generateMediumTermPrediction(history, portfolio);
        
        if (mediumTermPrediction.targetAchievementProbability < 0.6) {
            const actions = this.generateMediumTermActions(mediumTermPrediction);
            
            const insight = this.generateInsight(
                'scenario',
                'info',
                `中期予測(${this.predictionSettings.mediumTermPeriod}レース)での戦略調整提案`,
                `現在のペースでは目標達成確率が${(mediumTermPrediction.targetAchievementProbability * 100).toFixed(1)}%です。戦略調整により改善できます。`,
                actions,
                {
                    subType: 'medium_term_prediction',
                    confidence: 75,
                    prediction: `目標達成確率: ${(mediumTermPrediction.targetAchievementProbability * 100).toFixed(1)}%`,
                    rationale: `中期分析: ${mediumTermPrediction.analysis}`,
                    currentMetrics: {
                        expectedReturn: mediumTermPrediction.expectedReturn,
                        targetAchievementProbability: mediumTermPrediction.targetAchievementProbability,
                        breakEvenProbability: mediumTermPrediction.breakEvenProbability,
                        scenarios: mediumTermPrediction.scenarios
                    }
                }
            );
            
            insights.push(insight);
        }
        
        return insights;
    }

    /**
     * 長期予測分析
     */
    analyzeLongTermScenarios(history, portfolio) {
        const insights = [];
        
        const longTermPrediction = this.generateLongTermPrediction(history, portfolio);
        
        if (longTermPrediction.sustainabilityScore < 0.7) {
            const actions = this.generateLongTermActions(longTermPrediction);
            
            const insight = this.generateInsight(
                'scenario',
                'info',
                `長期予測(${this.predictionSettings.longTermPeriod}レース)での持続性分析`,
                `現在の戦略の長期持続性スコアが${(longTermPrediction.sustainabilityScore * 100).toFixed(1)}%です。長期安定性の向上を推奨します。`,
                actions,
                {
                    subType: 'long_term_prediction',
                    confidence: 70,
                    prediction: `長期持続性: ${(longTermPrediction.sustainabilityScore * 100).toFixed(1)}%`,
                    rationale: `長期分析: ${longTermPrediction.analysis}`,
                    currentMetrics: {
                        sustainabilityScore: longTermPrediction.sustainabilityScore,
                        expectedReturn: longTermPrediction.expectedReturn,
                        riskStability: longTermPrediction.riskStability,
                        scenarios: longTermPrediction.scenarios
                    }
                }
            );
            
            insights.push(insight);
        }
        
        return insights;
    }

    /**
     * リスク分析
     */
    analyzeRiskScenarios(history, portfolio) {
        const insights = [];
        
        const riskAnalysis = this.generateRiskScenarios(history, portfolio);
        
        if (riskAnalysis.highRiskProbability > 0.25) {
            const actions = this.generateRiskActions(riskAnalysis);
            
            const insight = this.generateInsight(
                'scenario',
                'warning',
                '高リスクシナリオ警告',
                `${(riskAnalysis.highRiskProbability * 100).toFixed(1)}%の確率で大幅ドローダウンが発生する可能性があります。リスク対策を推奨します。`,
                actions,
                {
                    subType: 'risk_scenario',
                    confidence: 85,
                    prediction: `大幅ドローダウン確率: ${(riskAnalysis.highRiskProbability * 100).toFixed(1)}%`,
                    rationale: `リスク分析: ${riskAnalysis.analysis}`,
                    currentMetrics: {
                        highRiskProbability: riskAnalysis.highRiskProbability,
                        expectedMaxDrawdown: riskAnalysis.expectedMaxDrawdown,
                        riskMitigationPotential: riskAnalysis.riskMitigationPotential,
                        scenarios: riskAnalysis.scenarios
                    }
                }
            );
            
            insights.push(insight);
        }
        
        return insights;
    }

    /**
     * 目標達成分析
     */
    analyzeTargetAchievement(history, portfolio) {
        const insights = [];
        
        const targetAnalysis = this.generateTargetAchievementAnalysis(history, portfolio);
        
        if (targetAnalysis.currentPaceScore < 0.8) {
            const actions = this.generateTargetActions(targetAnalysis);
            
            const insight = this.generateInsight(
                'scenario',
                'info',
                '目標達成ペース分析',
                `現在のペースでは目標達成まで${targetAnalysis.estimatedTimeToTarget}レースが必要です。ペース向上のための調整を提案します。`,
                actions,
                {
                    subType: 'target_achievement',
                    confidence: 75,
                    prediction: `目標達成まで${targetAnalysis.estimatedTimeToTarget}レース`,
                    rationale: `目標分析: ${targetAnalysis.analysis}`,
                    currentMetrics: {
                        currentPaceScore: targetAnalysis.currentPaceScore,
                        estimatedTimeToTarget: targetAnalysis.estimatedTimeToTarget,
                        accelerationPotential: targetAnalysis.accelerationPotential,
                        scenarios: targetAnalysis.scenarios
                    }
                }
            );
            
            insights.push(insight);
        }
        
        return insights;
    }

    /**
     * 改善シミュレーション
     */
    analyzeImprovementScenarios(history, portfolio) {
        const insights = [];
        
        const improvementAnalysis = this.generateImprovementScenarios(history, portfolio);
        
        if (improvementAnalysis.bestImprovement.impact > 0.1) {
            const actions = this.generateImprovementActions(improvementAnalysis);
            
            const insight = this.generateInsight(
                'scenario',
                'info',
                '改善シミュレーション結果',
                `${improvementAnalysis.bestImprovement.description}により、期待収益が${(improvementAnalysis.bestImprovement.impact * 100).toFixed(1)}%向上する見込みです。`,
                actions,
                {
                    subType: 'improvement_simulation',
                    confidence: 80,
                    prediction: `最大改善効果: +${(improvementAnalysis.bestImprovement.impact * 100).toFixed(1)}%`,
                    rationale: `改善分析: ${improvementAnalysis.analysis}`,
                    currentMetrics: {
                        bestImprovement: improvementAnalysis.bestImprovement,
                        allImprovements: improvementAnalysis.allImprovements,
                        combinedEffect: improvementAnalysis.combinedEffect,
                        scenarios: improvementAnalysis.scenarios
                    }
                }
            );
            
            insights.push(insight);
        }
        
        return insights;
    }

    /**
     * 短期予測生成
     */
    generateShortTermPrediction(history, portfolio) {
        const baseMetrics = this.calculateBaseMetrics(history);
        const scenarios = {};
        
        Object.keys(this.scenarios).forEach(scenarioKey => {
            const scenario = this.scenarios[scenarioKey];
            scenarios[scenarioKey] = this.simulateScenario(
                baseMetrics,
                scenario,
                this.predictionSettings.shortTermPeriod
            );
        });
        
        const expectedReturn = scenarios.realistic.expectedReturn;
        const riskLevel = this.calculateRiskLevel(scenarios);
        const winProbability = scenarios.realistic.winProbability;
        
        return {
            scenarios,
            expectedReturn,
            riskLevel,
            winProbability,
            confidence: 0.8,
            analysis: `短期${this.predictionSettings.shortTermPeriod}レース予測: 期待収益${expectedReturn.toFixed(0)}円`
        };
    }

    /**
     * 中期予測生成
     */
    generateMediumTermPrediction(history, portfolio) {
        const baseMetrics = this.calculateBaseMetrics(history);
        const scenarios = {};
        
        Object.keys(this.scenarios).forEach(scenarioKey => {
            const scenario = this.scenarios[scenarioKey];
            scenarios[scenarioKey] = this.simulateScenario(
                baseMetrics,
                scenario,
                this.predictionSettings.mediumTermPeriod
            );
        });
        
        const expectedReturn = scenarios.realistic.expectedReturn;
        const targetAchievementProbability = this.calculateTargetAchievementProbability(scenarios);
        const breakEvenProbability = this.calculateBreakEvenProbability(scenarios);
        
        return {
            scenarios,
            expectedReturn,
            targetAchievementProbability,
            breakEvenProbability,
            analysis: `中期${this.predictionSettings.mediumTermPeriod}レース予測: 目標達成確率${(targetAchievementProbability * 100).toFixed(1)}%`
        };
    }

    /**
     * 長期予測生成
     */
    generateLongTermPrediction(history, portfolio) {
        const baseMetrics = this.calculateBaseMetrics(history);
        const scenarios = {};
        
        Object.keys(this.scenarios).forEach(scenarioKey => {
            const scenario = this.scenarios[scenarioKey];
            scenarios[scenarioKey] = this.simulateScenario(
                baseMetrics,
                scenario,
                this.predictionSettings.longTermPeriod
            );
        });
        
        const sustainabilityScore = this.calculateSustainabilityScore(scenarios);
        const expectedReturn = scenarios.realistic.expectedReturn;
        const riskStability = this.calculateRiskStability(scenarios);
        
        return {
            scenarios,
            sustainabilityScore,
            expectedReturn,
            riskStability,
            analysis: `長期${this.predictionSettings.longTermPeriod}レース予測: 持続性スコア${(sustainabilityScore * 100).toFixed(1)}%`
        };
    }

    /**
     * リスクシナリオ生成
     */
    generateRiskScenarios(history, portfolio) {
        const baseMetrics = this.calculateBaseMetrics(history);
        const scenarios = {};
        
        // 高リスクシナリオを追加
        const highRiskScenario = {
            name: '高リスクシナリオ',
            performanceMultiplier: 0.5,
            riskMultiplier: 2.0,
            description: '成績50%悪化、リスク100%増加'
        };
        
        scenarios.highRisk = this.simulateScenario(
            baseMetrics,
            highRiskScenario,
            this.predictionSettings.shortTermPeriod
        );
        
        scenarios.pessimistic = this.simulateScenario(
            baseMetrics,
            this.scenarios.pessimistic,
            this.predictionSettings.shortTermPeriod
        );
        
        const highRiskProbability = this.calculateHighRiskProbability(scenarios);
        const expectedMaxDrawdown = scenarios.highRisk.maxDrawdown;
        const riskMitigationPotential = this.calculateRiskMitigationPotential(scenarios);
        
        return {
            scenarios,
            highRiskProbability,
            expectedMaxDrawdown,
            riskMitigationPotential,
            analysis: `高リスク確率${(highRiskProbability * 100).toFixed(1)}%, 最大DD${(expectedMaxDrawdown * 100).toFixed(1)}%`
        };
    }

    /**
     * 目標達成分析生成
     */
    generateTargetAchievementAnalysis(history, portfolio) {
        const baseMetrics = this.calculateBaseMetrics(history);
        const currentROI = baseMetrics.roi;
        const targetROI = this.predictionSettings.targetROI;
        
        const currentPaceScore = Math.min(1, currentROI / targetROI);
        const estimatedTimeToTarget = this.calculateTimeToTarget(currentROI, targetROI);
        const accelerationPotential = this.calculateAccelerationPotential(baseMetrics);
        
        const scenarios = {};
        Object.keys(this.scenarios).forEach(scenarioKey => {
            const scenario = this.scenarios[scenarioKey];
            scenarios[scenarioKey] = this.simulateScenario(
                baseMetrics,
                scenario,
                estimatedTimeToTarget
            );
        });
        
        return {
            scenarios,
            currentPaceScore,
            estimatedTimeToTarget,
            accelerationPotential,
            analysis: `現在ペース${(currentPaceScore * 100).toFixed(1)}%, 目標まで${estimatedTimeToTarget}レース`
        };
    }

    /**
     * 改善シミュレーション生成
     */
    generateImprovementScenarios(history, portfolio) {
        const baseMetrics = this.calculateBaseMetrics(history);
        const allImprovements = [];
        
        Object.keys(this.improvementPatterns).forEach(patternKey => {
            const pattern = this.improvementPatterns[patternKey];
            const improvedMetrics = this.applyImprovement(baseMetrics, pattern);
            
            const currentScenario = this.simulateScenario(
                baseMetrics,
                this.scenarios.realistic,
                this.predictionSettings.mediumTermPeriod
            );
            
            const improvedScenario = this.simulateScenario(
                improvedMetrics,
                this.scenarios.realistic,
                this.predictionSettings.mediumTermPeriod
            );
            
            const impact = (improvedScenario.expectedReturn - currentScenario.expectedReturn) / 
                          Math.max(Math.abs(currentScenario.expectedReturn), 1);
            
            allImprovements.push({
                pattern: patternKey,
                description: pattern.description,
                impact,
                beforeScenario: currentScenario,
                afterScenario: improvedScenario
            });
        });
        
        const bestImprovement = allImprovements.reduce((best, current) => 
            current.impact > best.impact ? current : best
        );
        
        const combinedEffect = this.calculateCombinedEffect(allImprovements);
        
        return {
            allImprovements,
            bestImprovement,
            combinedEffect,
            scenarios: { current: bestImprovement.beforeScenario, improved: bestImprovement.afterScenario },
            analysis: `最大改善効果: ${bestImprovement.description}で+${(bestImprovement.impact * 100).toFixed(1)}%`
        };
    }

    /**
     * シナリオシミュレーション
     */
    simulateScenario(baseMetrics, scenario, periods) {
        const winRate = baseMetrics.winRate * scenario.performanceMultiplier;
        const averageReturn = baseMetrics.averageReturn * scenario.performanceMultiplier;
        const volatility = baseMetrics.volatility * scenario.riskMultiplier;
        
        const expectedReturn = periods * averageReturn;
        const expectedVolatility = volatility * Math.sqrt(periods);
        
        const winProbability = Math.min(1, winRate);
        const maxDrawdown = this.calculateExpectedDrawdown(winRate, averageReturn, volatility, periods);
        
        return {
            scenario: scenario.name,
            expectedReturn,
            expectedVolatility,
            winProbability,
            maxDrawdown,
            periods
        };
    }

    /**
     * 基本メトリクス計算
     */
    calculateBaseMetrics(history) {
        if (!history || history.length === 0) {
            return { winRate: 0, averageReturn: 0, volatility: 0, roi: 0 };
        }
        
        const wins = history.filter(h => h.result === 'win' || h.won === true).length;
        const winRate = wins / history.length;
        
        const returns = history.map(h => {
            const investment = h.investment || h.amount || 0;
            const return_ = h.return || h.payout || 0;
            return investment > 0 ? (return_ - investment) / investment : 0;
        });
        
        const averageReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const volatility = this.calculateStandardDeviation(returns);
        
        const totalInvestment = history.reduce((sum, h) => sum + (h.investment || h.amount || 0), 0);
        const totalReturn = history.reduce((sum, h) => sum + (h.return || h.payout || 0), 0);
        const roi = totalInvestment > 0 ? (totalReturn - totalInvestment) / totalInvestment : 0;
        
        return { winRate, averageReturn, volatility, roi };
    }

    /**
     * 各種計算メソッド
     */
    calculateRiskLevel(scenarios) {
        const pessimisticReturn = scenarios.pessimistic.expectedReturn;
        const realisticReturn = scenarios.realistic.expectedReturn;
        
        if (pessimisticReturn < 0 && Math.abs(pessimisticReturn) > realisticReturn) {
            return 0.8;
        } else if (pessimisticReturn < 0) {
            return 0.5;
        } else {
            return 0.2;
        }
    }

    calculateTargetAchievementProbability(scenarios) {
        const optimisticReturn = scenarios.optimistic.expectedReturn;
        const realisticReturn = scenarios.realistic.expectedReturn;
        const target = this.predictionSettings.targetROI * 10000; // 仮の目標額
        
        if (optimisticReturn >= target) {
            return 0.8;
        } else if (realisticReturn >= target) {
            return 0.6;
        } else {
            return 0.3;
        }
    }

    calculateBreakEvenProbability(scenarios) {
        const pessimisticReturn = scenarios.pessimistic.expectedReturn;
        const realisticReturn = scenarios.realistic.expectedReturn;
        
        if (pessimisticReturn >= 0) {
            return 0.9;
        } else if (realisticReturn >= 0) {
            return 0.7;
        } else {
            return 0.4;
        }
    }

    calculateSustainabilityScore(scenarios) {
        const optimisticReturn = scenarios.optimistic.expectedReturn;
        const pessimisticReturn = scenarios.pessimistic.expectedReturn;
        const realisticReturn = scenarios.realistic.expectedReturn;
        
        const stability = 1 - (Math.abs(optimisticReturn - pessimisticReturn) / Math.max(Math.abs(realisticReturn), 1));
        const profitability = realisticReturn > 0 ? 1 : 0.5;
        
        return Math.min(1, stability * 0.6 + profitability * 0.4);
    }

    calculateRiskStability(scenarios) {
        const maxDrawdown = scenarios.pessimistic.maxDrawdown;
        return Math.max(0, 1 - maxDrawdown);
    }

    calculateHighRiskProbability(scenarios) {
        const highRiskDrawdown = scenarios.highRisk.maxDrawdown;
        return Math.min(1, highRiskDrawdown);
    }

    calculateRiskMitigationPotential(scenarios) {
        const pessimisticDrawdown = scenarios.pessimistic.maxDrawdown;
        const highRiskDrawdown = scenarios.highRisk.maxDrawdown;
        
        return Math.max(0, (highRiskDrawdown - pessimisticDrawdown) / Math.max(highRiskDrawdown, 0.1));
    }

    calculateTimeToTarget(currentROI, targetROI) {
        if (currentROI <= 0) return 100;
        return Math.max(10, Math.ceil(targetROI / currentROI * 10));
    }

    calculateAccelerationPotential(baseMetrics) {
        const currentEfficiency = baseMetrics.winRate * baseMetrics.averageReturn;
        const theoreticalMax = 0.6 * 0.2; // 仮の理論最大値
        
        return Math.max(0, (theoreticalMax - currentEfficiency) / Math.max(currentEfficiency, 0.01));
    }

    calculateExpectedDrawdown(winRate, averageReturn, volatility, periods) {
        const expectedLossStreak = Math.max(1, Math.log(0.05) / Math.log(1 - winRate));
        const maxLoss = volatility * Math.sqrt(expectedLossStreak);
        
        return Math.min(0.5, maxLoss);
    }

    applyImprovement(baseMetrics, pattern) {
        return {
            winRate: baseMetrics.winRate + pattern.impact.winRate,
            averageReturn: baseMetrics.averageReturn + pattern.impact.roi,
            volatility: baseMetrics.volatility + pattern.impact.risk,
            roi: baseMetrics.roi + pattern.impact.roi
        };
    }

    calculateCombinedEffect(improvements) {
        const totalImpact = improvements.reduce((sum, imp) => sum + imp.impact, 0);
        const averageImpact = totalImpact / improvements.length;
        
        // 組み合わせ効果は単純合計より小さくなる
        return averageImpact * 0.7;
    }

    calculateStandardDeviation(values) {
        if (!values || values.length === 0) return 0;
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    /**
     * アクション生成メソッド群
     */
    generateShortTermActions(prediction) {
        const actions = [];
        
        if (prediction.riskLevel > 0.5) {
            actions.push({
                type: 'riskReduction',
                title: '短期リスク軽減',
                description: 'リスク倍率を0.8xに調整',
                value: 0.8,
                expectedEffect: `リスク軽減 -${((prediction.riskLevel - 0.3) * 100).toFixed(0)}%`
            });
        }
        
        if (prediction.winProbability < 0.5) {
            actions.push({
                type: 'criteriaStrictening',
                title: '選択基準厳格化',
                description: 'スコア閾値を+5引き上げ',
                value: 5,
                expectedEffect: `勝率改善 +${((0.6 - prediction.winProbability) * 100).toFixed(0)}%`
            });
        }
        
        return actions;
    }

    generateMediumTermActions(prediction) {
        const actions = [];
        
        actions.push({
            type: 'strategyOptimization',
            title: '中期戦略最適化',
            description: '期待値・リスク・選択基準の包括調整',
            value: 'comprehensive',
            expectedEffect: `目標達成確率 +${((0.8 - prediction.targetAchievementProbability) * 100).toFixed(0)}%`
        });
        
        if (prediction.breakEvenProbability < 0.7) {
            actions.push({
                type: 'conservativeMode',
                title: '保守的モード',
                description: '安全重視の戦略に切り替え',
                value: 'conservative',
                expectedEffect: '安定性向上'
            });
        }
        
        return actions;
    }

    generateLongTermActions(prediction) {
        const actions = [];
        
        actions.push({
            type: 'sustainabilityImprovement',
            title: '持続性向上施策',
            description: '長期安定性を重視した調整',
            value: 'sustainability_focused',
            expectedEffect: `持続性 +${((0.9 - prediction.sustainabilityScore) * 100).toFixed(0)}%`
        });
        
        actions.push({
            type: 'adaptiveStrategy',
            title: '適応的戦略',
            description: '市場変化に対応する動的調整',
            value: 'adaptive',
            expectedEffect: '長期適応性向上'
        });
        
        return actions;
    }

    generateRiskActions(riskAnalysis) {
        const actions = [];
        
        actions.push({
            type: 'riskMitigation',
            title: '高リスク対策',
            description: '防御的投資配分への調整',
            value: 'defensive',
            expectedEffect: `高リスク確率 -${(riskAnalysis.riskMitigationPotential * 100).toFixed(0)}%`
        });
        
        actions.push({
            type: 'emergencyProtocol',
            title: '緊急プロトコル',
            description: '大幅DD時の自動投資停止',
            value: 'emergency_stop',
            expectedEffect: '最大損失保護'
        });
        
        return actions;
    }

    generateTargetActions(targetAnalysis) {
        const actions = [];
        
        actions.push({
            type: 'paceAcceleration',
            title: 'ペース向上',
            description: '目標達成ペースの加速',
            value: 'accelerate',
            expectedEffect: `達成時間 -${Math.max(0, targetAnalysis.estimatedTimeToTarget * 0.3).toFixed(0)}レース`
        });
        
        if (targetAnalysis.accelerationPotential > 0.2) {
            actions.push({
                type: 'efficiencyOptimization',
                title: '効率最適化',
                description: '投資効率の向上',
                value: 'efficiency',
                expectedEffect: `効率 +${(targetAnalysis.accelerationPotential * 100).toFixed(0)}%`
            });
        }
        
        return actions;
    }

    generateImprovementActions(improvementAnalysis) {
        const actions = [];
        
        const bestImprovement = improvementAnalysis.bestImprovement;
        
        actions.push({
            type: 'applyBestImprovement',
            title: bestImprovement.description,
            description: '最も効果的な改善策を適用',
            value: bestImprovement.pattern,
            expectedEffect: `期待収益 +${(bestImprovement.impact * 100).toFixed(1)}%`
        });
        
        if (improvementAnalysis.combinedEffect > bestImprovement.impact) {
            actions.push({
                type: 'combinedImprovement',
                title: '総合改善プログラム',
                description: '複数の改善策を組み合わせ',
                value: 'combined',
                expectedEffect: `期待収益 +${(improvementAnalysis.combinedEffect * 100).toFixed(1)}%`
            });
        }
        
        return actions;
    }

    /**
     * データ取得メソッド
     */
    getPerformanceHistory() {
        const data = localStorage.getItem('performanceHistory');
        return data ? JSON.parse(data) : null;
    }

    getPortfolioData() {
        const data = localStorage.getItem('kellyPortfolioResults');
        return data ? JSON.parse(data) : null;
    }
}

// グローバル公開
window.ScenarioAnalyzer = ScenarioAnalyzer;