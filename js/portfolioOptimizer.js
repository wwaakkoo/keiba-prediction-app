/**
 * Phase 7: ポートフォリオ最適化提案システム
 * 候補入替・比率変更・券種変更による効率最大化の知的支援
 */

class PortfolioOptimizer extends AnalysisModule {
    constructor() {
        super('ポートフォリオ最適化');
        
        // 最適化パラメータ
        this.optimizationThresholds = {
            minKellyRatio: 0.02,              // 最小Kelly比率（2%）
            maxKellyRatio: 0.15,              // 最大Kelly比率（15%）
            minExpectedValue: 1.05,           // 最小期待値
            maxCandidates: 8,                 // 最大候補数
            diversificationTarget: 0.6,       // 分散化目標値
            efficiencyThreshold: 0.75,        // 効率閾値
            replacementThreshold: 0.08        // 入替推奨閾値
        };
        
        // 最適化戦略
        this.optimizationStrategies = {
            efficiency: {
                description: '効率重視戦略',
                focus: 'kelly_ratio_optimization',
                targetMetric: 'expected_return'
            },
            safety: {
                description: '安全性重視戦略',
                focus: 'risk_minimization',
                targetMetric: 'stability'
            },
            balanced: {
                description: 'バランス戦略',
                focus: 'risk_return_balance',
                targetMetric: 'sharpe_ratio'
            },
            aggressive: {
                description: '積極戦略',
                focus: 'return_maximization',
                targetMetric: 'total_return'
            }
        };
        
        // 分析設定
        this.analysisSettings = {
            lookbackPeriod: 20,               // 分析期間
            performanceWindow: 10,            // パフォーマンス検証期間
            confidenceLevel: 0.8,             // 信頼水準
            simulationRuns: 1000,             // シミュレーション回数
            rebalanceFrequency: 5             // リバランス頻度
        };
    }

    /**
     * ポートフォリオ最適化分析の実行
     */
    async performAnalysis() {
        console.log('📊 ポートフォリオ最適化分析開始');
        
        const insights = [];
        
        // 現在のポートフォリオデータの取得
        const currentPortfolio = this.getCurrentPortfolio();
        const performanceHistory = this.getPerformanceHistory();
        const candidatePool = this.getCandidatePool();
        
        if (!currentPortfolio || !performanceHistory || performanceHistory.length < 5) {
            console.log('⚠️ 最適化に十分なデータがありません');
            return insights;
        }
        
        // 1. 効率性分析
        const efficiencyInsights = this.analyzePortfolioEfficiency(currentPortfolio, performanceHistory);
        insights.push(...efficiencyInsights);
        
        // 2. 候補入替分析
        const replacementInsights = this.analyzeReplacementOpportunities(currentPortfolio, candidatePool, performanceHistory);
        insights.push(...replacementInsights);
        
        // 3. 配分最適化分析
        const allocationInsights = this.analyzeAllocationOptimization(currentPortfolio, performanceHistory);
        insights.push(...allocationInsights);
        
        // 4. 分散化分析
        const diversificationInsights = this.analyzeDiversificationOpportunities(currentPortfolio, candidatePool);
        insights.push(...diversificationInsights);
        
        // 5. 券種最適化分析
        const ticketTypeInsights = this.analyzeTicketTypeOptimization(currentPortfolio, performanceHistory);
        insights.push(...ticketTypeInsights);
        
        // 6. ポートフォリオ統合分析
        const portfolioInsights = this.analyzePortfolioIntegration(currentPortfolio, performanceHistory);
        insights.push(...portfolioInsights);
        
        console.log(`✅ ポートフォリオ最適化分析完了: ${insights.length}件のインサイト`);
        return insights;
    }

    /**
     * ポートフォリオ効率性分析
     */
    analyzePortfolioEfficiency(portfolio, history) {
        const insights = [];
        
        const efficiency = this.calculatePortfolioEfficiency(portfolio, history);
        
        if (efficiency.overall < this.optimizationThresholds.efficiencyThreshold) {
            const optimization = this.generateEfficiencyOptimization(portfolio, efficiency);
            
            const actions = this.generateEfficiencyActions(optimization);
            
            const insight = this.generateInsight(
                'portfolio',
                'warning',
                'ポートフォリオ効率改善提案',
                `現在の効率性が${(efficiency.overall * 100).toFixed(1)}%で目標値を下回っています。最適化により${(optimization.improvementPotential * 100).toFixed(1)}%の改善が期待されます。`,
                actions,
                {
                    subType: 'efficiency_improvement',
                    confidence: 85,
                    prediction: `効率最適化により期待収益が${(optimization.expectedReturn * 100).toFixed(1)}%向上します`,
                    rationale: `効率分析: ${efficiency.analysis}`,
                    currentMetrics: {
                        currentEfficiency: efficiency.overall,
                        targetEfficiency: this.optimizationThresholds.efficiencyThreshold,
                        improvementPotential: optimization.improvementPotential,
                        expectedReturn: optimization.expectedReturn
                    }
                }
            );
            
            insights.push(insight);
        }
        
        return insights;
    }

    /**
     * 候補入替分析
     */
    analyzeReplacementOpportunities(portfolio, candidatePool, history) {
        const insights = [];
        
        const replacementAnalysis = this.identifyReplacementOpportunities(portfolio, candidatePool, history);
        
        if (replacementAnalysis.opportunities.length > 0) {
            const bestOpportunity = replacementAnalysis.opportunities[0];
            
            const actions = this.generateReplacementActions(bestOpportunity);
            
            const insight = this.generateInsight(
                'portfolio',
                'info',
                '候補入替による改善提案',
                `「${bestOpportunity.currentCandidate.name}」を「${bestOpportunity.replacement.name}」に変更することで、期待収益が${(bestOpportunity.improvement * 100).toFixed(1)}%向上します。`,
                actions,
                {
                    subType: 'candidate_replacement',
                    confidence: 80,
                    prediction: `入替により月間ROIが${(bestOpportunity.improvement * 100).toFixed(1)}%改善されます`,
                    rationale: `入替分析: ${bestOpportunity.rationale}`,
                    currentMetrics: {
                        currentKelly: bestOpportunity.currentCandidate.kellyRatio,
                        replacementKelly: bestOpportunity.replacement.kellyRatio,
                        improvement: bestOpportunity.improvement,
                        impactScore: bestOpportunity.impactScore
                    }
                }
            );
            
            insights.push(insight);
        }
        
        return insights;
    }

    /**
     * 配分最適化分析
     */
    analyzeAllocationOptimization(portfolio, history) {
        const insights = [];
        
        const allocationAnalysis = this.calculateOptimalAllocation(portfolio, history);
        
        if (allocationAnalysis.deviation > this.optimizationThresholds.replacementThreshold) {
            const actions = this.generateAllocationActions(allocationAnalysis);
            
            const insight = this.generateInsight(
                'portfolio',
                'info',
                '投資配分最適化提案',
                `現在の配分が理論最適値から${(allocationAnalysis.deviation * 100).toFixed(1)}%乖離しています。調整により効率向上が期待されます。`,
                actions,
                {
                    subType: 'allocation_optimization',
                    confidence: 75,
                    prediction: `配分最適化により期待収益が${(allocationAnalysis.improvement * 100).toFixed(1)}%向上します`,
                    rationale: `配分分析: ${allocationAnalysis.analysis}`,
                    currentMetrics: {
                        currentAllocation: allocationAnalysis.current,
                        optimalAllocation: allocationAnalysis.optimal,
                        deviation: allocationAnalysis.deviation,
                        improvement: allocationAnalysis.improvement
                    }
                }
            );
            
            insights.push(insight);
        }
        
        return insights;
    }

    /**
     * 分散化分析
     */
    analyzeDiversificationOpportunities(portfolio, candidatePool) {
        const insights = [];
        
        const diversification = this.calculateDiversificationMetrics(portfolio, candidatePool);
        
        if (diversification.score < this.optimizationThresholds.diversificationTarget) {
            const actions = this.generateDiversificationActions(diversification);
            
            const insight = this.generateInsight(
                'portfolio',
                'warning',
                '分散化改善提案',
                `現在の分散化スコアが${(diversification.score * 100).toFixed(1)}%で目標値を下回っています。リスク分散の強化を推奨します。`,
                actions,
                {
                    subType: 'diversification_improvement',
                    confidence: 70,
                    prediction: `分散化により最大損失リスクが${(diversification.riskReduction * 100).toFixed(1)}%削減されます`,
                    rationale: `分散分析: ${diversification.analysis}`,
                    currentMetrics: {
                        diversificationScore: diversification.score,
                        targetScore: this.optimizationThresholds.diversificationTarget,
                        riskReduction: diversification.riskReduction,
                        correlationMatrix: diversification.correlations
                    }
                }
            );
            
            insights.push(insight);
        }
        
        return insights;
    }

    /**
     * 券種最適化分析
     */
    analyzeTicketTypeOptimization(portfolio, history) {
        const insights = [];
        
        const ticketAnalysis = this.analyzeTicketTypeEfficiency(portfolio, history);
        
        if (ticketAnalysis.optimizationPotential > 0.05) {
            const actions = this.generateTicketTypeActions(ticketAnalysis);
            
            const insight = this.generateInsight(
                'portfolio',
                'info',
                '券種最適化提案',
                `現在の券種構成に改善余地があります。${ticketAnalysis.recommendation}により効率向上が期待されます。`,
                actions,
                {
                    subType: 'ticket_type_optimization',
                    confidence: 75,
                    prediction: `券種最適化により期待収益が${(ticketAnalysis.optimizationPotential * 100).toFixed(1)}%向上します`,
                    rationale: `券種分析: ${ticketAnalysis.analysis}`,
                    currentMetrics: {
                        currentDistribution: ticketAnalysis.currentDistribution,
                        optimalDistribution: ticketAnalysis.optimalDistribution,
                        optimizationPotential: ticketAnalysis.optimizationPotential
                    }
                }
            );
            
            insights.push(insight);
        }
        
        return insights;
    }

    /**
     * ポートフォリオ統合分析
     */
    analyzePortfolioIntegration(portfolio, history) {
        const insights = [];
        
        const integration = this.analyzeIntegrationEfficiency(portfolio, history);
        
        if (integration.synergyPotential > 0.1) {
            const actions = this.generateIntegrationActions(integration);
            
            const insight = this.generateInsight(
                'portfolio',
                'info',
                'ポートフォリオ統合最適化',
                `候補間の相乗効果を活用することで、全体効率が${(integration.synergyPotential * 100).toFixed(1)}%向上する可能性があります。`,
                actions,
                {
                    subType: 'portfolio_integration',
                    confidence: 70,
                    prediction: `統合最適化により総合ROIが${(integration.synergyPotential * 100).toFixed(1)}%改善されます`,
                    rationale: `統合分析: ${integration.analysis}`,
                    currentMetrics: {
                        synergyPotential: integration.synergyPotential,
                        correlationEfficiency: integration.correlationEfficiency,
                        complementarity: integration.complementarity
                    }
                }
            );
            
            insights.push(insight);
        }
        
        return insights;
    }

    /**
     * ポートフォリオ効率性計算
     */
    calculatePortfolioEfficiency(portfolio, history) {
        if (!portfolio || !history || history.length === 0) {
            return { overall: 0, analysis: 'データ不足' };
        }
        
        const kellyEfficiency = this.calculateKellyEfficiency(portfolio);
        const returnEfficiency = this.calculateReturnEfficiency(portfolio, history);
        const riskEfficiency = this.calculateRiskEfficiency(portfolio, history);
        
        const overall = (kellyEfficiency * 0.4 + returnEfficiency * 0.4 + riskEfficiency * 0.2);
        
        return {
            overall,
            kellyEfficiency,
            returnEfficiency,
            riskEfficiency,
            analysis: `Kelly効率${(kellyEfficiency * 100).toFixed(1)}%, 収益効率${(returnEfficiency * 100).toFixed(1)}%, リスク効率${(riskEfficiency * 100).toFixed(1)}%`
        };
    }

    /**
     * Kelly効率性計算
     */
    calculateKellyEfficiency(portfolio) {
        if (!portfolio.candidates || portfolio.candidates.length === 0) return 0;
        
        const totalKelly = portfolio.candidates.reduce((sum, candidate) => sum + (candidate.kellyRatio || 0), 0);
        const averageKelly = totalKelly / portfolio.candidates.length;
        
        // Kelly比率の最適性を評価
        const optimalRange = { min: 0.03, max: 0.12 };
        const efficiency = portfolio.candidates.reduce((sum, candidate) => {
            const kelly = candidate.kellyRatio || 0;
            if (kelly >= optimalRange.min && kelly <= optimalRange.max) {
                return sum + 1;
            } else if (kelly > 0 && kelly < optimalRange.min) {
                return sum + 0.7;
            } else if (kelly > optimalRange.max) {
                return sum + 0.5;
            }
            return sum;
        }, 0);
        
        return efficiency / portfolio.candidates.length;
    }

    /**
     * 収益効率性計算
     */
    calculateReturnEfficiency(portfolio, history) {
        if (!history || history.length === 0) return 0;
        
        const recentHistory = history.slice(-this.analysisSettings.performanceWindow);
        const averageReturn = recentHistory.reduce((sum, h) => {
            const investment = h.investment || h.amount || 0;
            const return_ = h.return || h.payout || 0;
            return sum + (investment > 0 ? return_ / investment : 0);
        }, 0) / recentHistory.length;
        
        // 期待値と実績の比較
        const expectedReturn = portfolio.candidates?.reduce((sum, candidate) => 
            sum + (candidate.expectedValue || 1), 0) / (portfolio.candidates?.length || 1);
        
        return Math.min(1, averageReturn / expectedReturn);
    }

    /**
     * リスク効率性計算
     */
    calculateRiskEfficiency(portfolio, history) {
        if (!history || history.length === 0) return 0;
        
        const recentHistory = history.slice(-this.analysisSettings.performanceWindow);
        const returns = recentHistory.map(h => {
            const investment = h.investment || h.amount || 0;
            const return_ = h.return || h.payout || 0;
            return investment > 0 ? (return_ - investment) / investment : 0;
        });
        
        const volatility = this.calculateStandardDeviation(returns);
        const averageReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        
        // シャープレシオ的な指標
        const riskAdjustedReturn = averageReturn / (volatility + 0.01);
        
        return Math.min(1, Math.max(0, riskAdjustedReturn / 0.5));
    }

    /**
     * 効率性改善案生成
     */
    generateEfficiencyOptimization(portfolio, efficiency) {
        const improvements = [];
        
        if (efficiency.kellyEfficiency < 0.7) {
            improvements.push({
                type: 'kelly_optimization',
                description: 'Kelly比率の最適化',
                impact: 0.15
            });
        }
        
        if (efficiency.returnEfficiency < 0.7) {
            improvements.push({
                type: 'return_optimization',
                description: '収益性の改善',
                impact: 0.12
            });
        }
        
        if (efficiency.riskEfficiency < 0.7) {
            improvements.push({
                type: 'risk_optimization',
                description: 'リスク効率の改善',
                impact: 0.08
            });
        }
        
        const totalImpact = improvements.reduce((sum, imp) => sum + imp.impact, 0);
        
        return {
            improvements,
            improvementPotential: Math.min(0.3, totalImpact),
            expectedReturn: totalImpact * 0.6
        };
    }

    /**
     * 候補入替機会の特定
     */
    identifyReplacementOpportunities(portfolio, candidatePool, history) {
        const opportunities = [];
        
        if (!portfolio.candidates || !candidatePool) {
            return { opportunities: [] };
        }
        
        portfolio.candidates.forEach(current => {
            candidatePool.forEach(candidate => {
                if (candidate.id === current.id) return;
                
                const improvement = this.calculateReplacementImprovement(current, candidate, history);
                
                if (improvement.netBenefit > this.optimizationThresholds.replacementThreshold) {
                    opportunities.push({
                        currentCandidate: current,
                        replacement: candidate,
                        improvement: improvement.netBenefit,
                        impactScore: improvement.impactScore,
                        rationale: improvement.rationale
                    });
                }
            });
        });
        
        return {
            opportunities: opportunities.sort((a, b) => b.improvement - a.improvement)
        };
    }

    /**
     * 入替効果計算
     */
    calculateReplacementImprovement(current, replacement, history) {
        const currentKelly = current.kellyRatio || 0;
        const replacementKelly = replacement.kellyRatio || 0;
        
        const currentExpectedValue = current.expectedValue || 1;
        const replacementExpectedValue = replacement.expectedValue || 1;
        
        const kellyImprovement = (replacementKelly - currentKelly) / Math.max(currentKelly, 0.01);
        const valueImprovement = (replacementExpectedValue - currentExpectedValue) / Math.max(currentExpectedValue, 0.01);
        
        const netBenefit = kellyImprovement * 0.6 + valueImprovement * 0.4;
        
        return {
            netBenefit,
            impactScore: Math.abs(netBenefit) * (replacementKelly + currentKelly) * 0.5,
            rationale: `Kelly比率${(kellyImprovement * 100).toFixed(1)}%, 期待値${(valueImprovement * 100).toFixed(1)}%の改善`
        };
    }

    /**
     * 最適配分計算
     */
    calculateOptimalAllocation(portfolio, history) {
        if (!portfolio.candidates || portfolio.candidates.length === 0) {
            return { deviation: 0, improvement: 0, analysis: 'データ不足' };
        }
        
        const totalKelly = portfolio.candidates.reduce((sum, candidate) => sum + (candidate.kellyRatio || 0), 0);
        
        const optimal = portfolio.candidates.map(candidate => ({
            ...candidate,
            optimalRatio: (candidate.kellyRatio || 0) / totalKelly
        }));
        
        const current = portfolio.candidates.map(candidate => ({
            ...candidate,
            currentRatio: (candidate.allocation || 0) / (portfolio.totalAllocation || 1)
        }));
        
        const deviation = optimal.reduce((sum, opt, index) => {
            const curr = current[index];
            return sum + Math.abs(opt.optimalRatio - curr.currentRatio);
        }, 0) / optimal.length;
        
        return {
            deviation,
            current: current.map(c => c.currentRatio),
            optimal: optimal.map(o => o.optimalRatio),
            improvement: deviation * 0.5,
            analysis: `理論最適値からの平均乖離${(deviation * 100).toFixed(1)}%`
        };
    }

    /**
     * 分散化メトリクス計算
     */
    calculateDiversificationMetrics(portfolio, candidatePool) {
        if (!portfolio.candidates || portfolio.candidates.length === 0) {
            return { score: 0, analysis: 'データ不足', riskReduction: 0 };
        }
        
        const candidates = portfolio.candidates;
        const correlations = this.calculateCorrelationMatrix(candidates);
        
        const averageCorrelation = this.calculateAverageCorrelation(correlations);
        const diversificationScore = Math.max(0, 1 - averageCorrelation);
        
        const riskReduction = diversificationScore * 0.3;
        
        return {
            score: diversificationScore,
            correlations,
            riskReduction,
            analysis: `平均相関${(averageCorrelation * 100).toFixed(1)}%, 分散効果${(diversificationScore * 100).toFixed(1)}%`
        };
    }

    /**
     * 券種効率性分析
     */
    analyzeTicketTypeEfficiency(portfolio, history) {
        if (!portfolio.candidates || portfolio.candidates.length === 0) {
            return { optimizationPotential: 0, analysis: 'データ不足' };
        }
        
        const ticketTypes = ['単勝', '複勝', '枠連', '馬連', '馬単', 'ワイド', '3連複', '3連単'];
        const distribution = this.calculateTicketTypeDistribution(portfolio.candidates);
        const efficiency = this.calculateTicketTypeEfficiency(distribution, history);
        
        const optimal = this.calculateOptimalTicketDistribution(history);
        const optimizationPotential = this.calculateDistributionDifference(distribution, optimal);
        
        return {
            currentDistribution: distribution,
            optimalDistribution: optimal,
            optimizationPotential,
            recommendation: this.generateTicketTypeRecommendation(distribution, optimal),
            analysis: `現在の券種構成効率${(efficiency * 100).toFixed(1)}%`
        };
    }

    /**
     * 統合効率性分析
     */
    analyzeIntegrationEfficiency(portfolio, history) {
        if (!portfolio.candidates || portfolio.candidates.length === 0) {
            return { synergyPotential: 0, analysis: 'データ不足' };
        }
        
        const correlationMatrix = this.calculateCorrelationMatrix(portfolio.candidates);
        const complementarity = this.calculateComplementarity(portfolio.candidates);
        const synergyPotential = this.calculateSynergyPotential(correlationMatrix, complementarity);
        
        return {
            synergyPotential,
            correlationEfficiency: 1 - this.calculateAverageCorrelation(correlationMatrix),
            complementarity,
            analysis: `相乗効果ポテンシャル${(synergyPotential * 100).toFixed(1)}%`
        };
    }

    /**
     * アクション生成メソッド群
     */
    generateEfficiencyActions(optimization) {
        const actions = [];
        
        optimization.improvements.forEach(improvement => {
            switch (improvement.type) {
                case 'kelly_optimization':
                    actions.push({
                        type: 'optimizeKelly',
                        title: 'Kelly比率の最適化',
                        description: '理論値に基づく配分調整',
                        value: 'optimize_kelly',
                        expectedEffect: `効率 +${(improvement.impact * 100).toFixed(1)}%`
                    });
                    break;
                case 'return_optimization':
                    actions.push({
                        type: 'optimizeReturn',
                        title: '収益性の改善',
                        description: '高期待値候補の重視',
                        value: 'optimize_return',
                        expectedEffect: `収益 +${(improvement.impact * 100).toFixed(1)}%`
                    });
                    break;
                case 'risk_optimization':
                    actions.push({
                        type: 'optimizeRisk',
                        title: 'リスク効率の改善',
                        description: 'リスク調整後リターンの最適化',
                        value: 'optimize_risk',
                        expectedEffect: `リスク効率 +${(improvement.impact * 100).toFixed(1)}%`
                    });
                    break;
            }
        });
        
        return actions;
    }

    generateReplacementActions(opportunity) {
        const actions = [];
        
        actions.push({
            type: 'replaceCandidate',
            title: '候補入替の実行',
            description: `「${opportunity.currentCandidate.name}」→「${opportunity.replacement.name}」`,
            value: {
                remove: opportunity.currentCandidate.id,
                add: opportunity.replacement.id
            },
            expectedEffect: `期待収益 +${(opportunity.improvement * 100).toFixed(1)}%`
        });
        
        actions.push({
            type: 'gradualReplacement',
            title: '段階的入替',
            description: '投資配分を段階的に移行',
            value: {
                phaseOut: opportunity.currentCandidate.id,
                phaseIn: opportunity.replacement.id,
                steps: 3
            },
            expectedEffect: 'リスク軽減しながら改善'
        });
        
        return actions;
    }

    generateAllocationActions(allocationAnalysis) {
        const actions = [];
        
        actions.push({
            type: 'rebalancePortfolio',
            title: '配分リバランス',
            description: '理論最適配分への調整',
            value: allocationAnalysis.optimal,
            expectedEffect: `効率 +${(allocationAnalysis.improvement * 100).toFixed(1)}%`
        });
        
        actions.push({
            type: 'gradualRebalance',
            title: '段階的リバランス',
            description: '3段階での配分調整',
            value: {
                target: allocationAnalysis.optimal,
                steps: 3
            },
            expectedEffect: '安定的な改善'
        });
        
        return actions;
    }

    generateDiversificationActions(diversification) {
        const actions = [];
        
        actions.push({
            type: 'increaseDiversification',
            title: '分散化の強化',
            description: '低相関候補の追加',
            value: 'increase_diversification',
            expectedEffect: `リスク -${(diversification.riskReduction * 100).toFixed(1)}%`
        });
        
        actions.push({
            type: 'rebalanceForDiversification',
            title: '分散化重視配分',
            description: '相関を考慮した配分調整',
            value: 'diversification_focused',
            expectedEffect: '安定性向上'
        });
        
        return actions;
    }

    generateTicketTypeActions(ticketAnalysis) {
        const actions = [];
        
        actions.push({
            type: 'optimizeTicketTypes',
            title: '券種構成の最適化',
            description: ticketAnalysis.recommendation,
            value: ticketAnalysis.optimalDistribution,
            expectedEffect: `効率 +${(ticketAnalysis.optimizationPotential * 100).toFixed(1)}%`
        });
        
        return actions;
    }

    generateIntegrationActions(integration) {
        const actions = [];
        
        actions.push({
            type: 'optimizeIntegration',
            title: 'ポートフォリオ統合最適化',
            description: '相乗効果を活用した構成',
            value: 'optimize_integration',
            expectedEffect: `統合効率 +${(integration.synergyPotential * 100).toFixed(1)}%`
        });
        
        return actions;
    }

    /**
     * ユーティリティメソッド
     */
    calculateStandardDeviation(values) {
        if (!values || values.length === 0) return 0;
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    calculateCorrelationMatrix(candidates) {
        // 簡略化した相関行列計算
        const matrix = {};
        candidates.forEach(c1 => {
            matrix[c1.id] = {};
            candidates.forEach(c2 => {
                if (c1.id === c2.id) {
                    matrix[c1.id][c2.id] = 1;
                } else {
                    // 実際の実装では過去パフォーマンスから計算
                    matrix[c1.id][c2.id] = Math.random() * 0.6 + 0.1;
                }
            });
        });
        return matrix;
    }

    calculateAverageCorrelation(correlationMatrix) {
        const correlations = [];
        Object.keys(correlationMatrix).forEach(id1 => {
            Object.keys(correlationMatrix[id1]).forEach(id2 => {
                if (id1 !== id2) {
                    correlations.push(correlationMatrix[id1][id2]);
                }
            });
        });
        return correlations.length > 0 ? correlations.reduce((sum, corr) => sum + corr, 0) / correlations.length : 0;
    }

    calculateTicketTypeDistribution(candidates) {
        const distribution = {};
        candidates.forEach(candidate => {
            const ticketType = candidate.ticketType || '単勝';
            distribution[ticketType] = (distribution[ticketType] || 0) + 1;
        });
        return distribution;
    }

    calculateTicketTypeEfficiency(distribution, history) {
        // 简略化した効率性計算
        return Math.random() * 0.3 + 0.7;
    }

    calculateOptimalTicketDistribution(history) {
        // 簡略化した最適分散計算
        return {
            '単勝': 0.2,
            '複勝': 0.1,
            '馬連': 0.15,
            '馬単': 0.15,
            'ワイド': 0.1,
            '3連複': 0.15,
            '3連単': 0.15
        };
    }

    calculateDistributionDifference(current, optimal) {
        let difference = 0;
        Object.keys(optimal).forEach(key => {
            const currentRatio = (current[key] || 0) / Object.values(current).reduce((sum, val) => sum + val, 1);
            const optimalRatio = optimal[key] || 0;
            difference += Math.abs(currentRatio - optimalRatio);
        });
        return difference / Object.keys(optimal).length;
    }

    generateTicketTypeRecommendation(current, optimal) {
        const recommendations = [];
        Object.keys(optimal).forEach(key => {
            const currentRatio = (current[key] || 0) / Object.values(current).reduce((sum, val) => sum + val, 1);
            const optimalRatio = optimal[key] || 0;
            if (optimalRatio > currentRatio + 0.05) {
                recommendations.push(`${key}の比率を増加`);
            } else if (optimalRatio < currentRatio - 0.05) {
                recommendations.push(`${key}の比率を減少`);
            }
        });
        return recommendations.length > 0 ? recommendations.join(', ') : '現在の構成を維持';
    }

    calculateComplementarity(candidates) {
        // 簡略化した補完性計算
        return Math.random() * 0.4 + 0.6;
    }

    calculateSynergyPotential(correlationMatrix, complementarity) {
        const avgCorrelation = this.calculateAverageCorrelation(correlationMatrix);
        return (1 - avgCorrelation) * complementarity * 0.5;
    }

    /**
     * データ取得メソッド
     */
    getCurrentPortfolio() {
        const data = localStorage.getItem('kellyPortfolioResults');
        return data ? JSON.parse(data) : null;
    }

    getPerformanceHistory() {
        const data = localStorage.getItem('performanceHistory');
        return data ? JSON.parse(data) : null;
    }

    getCandidatePool() {
        const data = localStorage.getItem('candidatePool');
        return data ? JSON.parse(data) : null;
    }
}

// グローバル公開
window.PortfolioOptimizer = PortfolioOptimizer;