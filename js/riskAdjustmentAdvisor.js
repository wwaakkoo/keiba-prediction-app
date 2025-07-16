/**
 * Phase 7: リスク調整推奨システム
 * 動的リスク管理と資金配分最適化の知的支援
 */

class RiskAdjustmentAdvisor extends AnalysisModule {
    constructor() {
        super('リスク調整推奨');
        
        // リスク分析設定
        this.riskThresholds = {
            consecutiveLossLimit: 3,          // 連敗警告閾値
            drawdownWarningLevel: 0.15,       // ドローダウン警告レベル（15%）
            drawdownCriticalLevel: 0.25,      // ドローダウン危険レベル（25%）
            volatilityHighThreshold: 0.3,     // 高ボラティリティ閾値
            winStreakOptimizationLevel: 5,    // 連勝時の最適化レベル
            recoveryDetectionPeriod: 3        // 回復検出期間
        };
        
        // リスク調整パターン
        this.adjustmentPatterns = {
            defensive: {
                description: '防御的調整',
                multiplier: 0.6,
                conditions: ['high_loss_streak', 'significant_drawdown', 'high_volatility']
            },
            conservative: {
                description: '保守的調整',
                multiplier: 0.8,
                conditions: ['moderate_loss_streak', 'minor_drawdown', 'increased_volatility']
            },
            neutral: {
                description: '中立調整',
                multiplier: 1.0,
                conditions: ['stable_performance', 'normal_volatility']
            },
            aggressive: {
                description: '積極的調整',
                multiplier: 1.2,
                conditions: ['win_streak', 'positive_trend', 'low_volatility']
            },
            opportunistic: {
                description: '機会主義的調整',
                multiplier: 1.4,
                conditions: ['strong_win_streak', 'high_confidence', 'market_opportunity']
            }
        };
        
        // Kelly基準統合設定
        this.kellyIntegration = {
            maxRiskMultiplier: 2.0,           // 最大リスク倍率
            minRiskMultiplier: 0.3,           // 最小リスク倍率
            adjustmentGranularity: 0.1,       // 調整粒度
            stabilityFactor: 0.8,             // 安定性要因
            momentumFactor: 0.2               // モメンタム要因
        };
    }

    /**
     * リスク分析の実行
     */
    async performAnalysis() {
        console.log('⚖️ リスク調整分析開始');
        
        const insights = [];
        
        // 履歴データの取得
        const performanceHistory = this.getPerformanceHistory();
        const portfolioData = this.getPortfolioData();
        
        if (!performanceHistory || performanceHistory.length < 3) {
            console.log('⚠️ リスク分析に十分なデータがありません');
            return insights;
        }
        
        // 1. 連敗リスク分析
        const consecutiveLossInsights = this.analyzeConsecutiveLosses(performanceHistory);
        insights.push(...consecutiveLossInsights);
        
        // 2. ドローダウン分析
        const drawdownInsights = this.analyzeDrawdown(performanceHistory);
        insights.push(...drawdownInsights);
        
        // 3. ボラティリティ分析
        const volatilityInsights = this.analyzeVolatility(performanceHistory);
        insights.push(...volatilityInsights);
        
        // 4. 連勝機会分析
        const winStreakInsights = this.analyzeWinStreak(performanceHistory);
        insights.push(...winStreakInsights);
        
        // 5. Kelly基準統合分析
        const kellyRiskInsights = this.analyzeKellyRiskAlignment(performanceHistory, portfolioData);
        insights.push(...kellyRiskInsights);
        
        // 6. 回復トレンド分析
        const recoveryInsights = this.analyzeRecoveryTrends(performanceHistory);
        insights.push(...recoveryInsights);
        
        console.log(`✅ リスク調整分析完了: ${insights.length}件のインサイト`);
        return insights;
    }

    /**
     * 連敗リスク分析
     */
    analyzeConsecutiveLosses(history) {
        const insights = [];
        
        const consecutiveLosses = this.calculateConsecutiveLosses(history);
        const currentRiskMultiplier = this.getCurrentRiskMultiplier();
        
        if (consecutiveLosses >= this.riskThresholds.consecutiveLossLimit) {
            const riskLevel = this.assessConsecutiveLossRisk(consecutiveLosses);
            const recommendedMultiplier = this.calculateDefensiveMultiplier(consecutiveLosses, currentRiskMultiplier);
            
            const actions = this.generateConsecutiveLossActions(consecutiveLosses, recommendedMultiplier);
            
            const insight = this.generateInsight(
                'risk',
                consecutiveLosses >= 5 ? 'critical' : 'warning',
                `${consecutiveLosses}連敗によるリスク調整推奨`,
                `連続${consecutiveLosses}敗を検出しました。資金保護のためリスク倍率の調整を推奨します。`,
                actions,
                {
                    subType: 'consecutive_loss',
                    confidence: 90,
                    prediction: `リスク倍率調整により最大損失を${((1 - recommendedMultiplier) * 100).toFixed(0)}%削減できます`,
                    rationale: `連敗パターン分析: ${riskLevel.analysis}`,
                    currentMetrics: {
                        consecutiveLosses: consecutiveLosses,
                        currentRiskMultiplier: currentRiskMultiplier,
                        recommendedMultiplier: recommendedMultiplier,
                        riskLevel: riskLevel.level
                    }
                }
            );
            
            insights.push(insight);
        }
        
        return insights;
    }

    /**
     * ドローダウン分析
     */
    analyzeDrawdown(history) {
        const insights = [];
        
        const drawdownAnalysis = this.calculateDrawdownMetrics(history);
        const currentRiskMultiplier = this.getCurrentRiskMultiplier();
        
        if (drawdownAnalysis.currentDrawdown > this.riskThresholds.drawdownWarningLevel) {
            const severity = drawdownAnalysis.currentDrawdown > this.riskThresholds.drawdownCriticalLevel ? 'critical' : 'warning';
            const recommendedMultiplier = this.calculateDrawdownMultiplier(drawdownAnalysis, currentRiskMultiplier);
            
            const actions = this.generateDrawdownActions(drawdownAnalysis, recommendedMultiplier);
            
            const insight = this.generateInsight(
                'risk',
                severity,
                `ドローダウン${(drawdownAnalysis.currentDrawdown * 100).toFixed(1)}%でリスク調整推奨`,
                `現在のドローダウンが${(drawdownAnalysis.currentDrawdown * 100).toFixed(1)}%に達しています。資金保護強化を推奨します。`,
                actions,
                {
                    subType: 'drawdown',
                    confidence: 85,
                    prediction: `リスク調整により追加損失リスクを${((1 - recommendedMultiplier) * 100).toFixed(0)}%削減できます`,
                    rationale: `ドローダウン分析: ${drawdownAnalysis.analysis}`,
                    currentMetrics: {
                        currentDrawdown: drawdownAnalysis.currentDrawdown,
                        maxDrawdown: drawdownAnalysis.maxDrawdown,
                        drawdownDuration: drawdownAnalysis.duration,
                        recommendedMultiplier: recommendedMultiplier
                    }
                }
            );
            
            insights.push(insight);
        }
        
        return insights;
    }

    /**
     * ボラティリティ分析
     */
    analyzeVolatility(history) {
        const insights = [];
        
        const volatilityAnalysis = this.calculateVolatilityMetrics(history);
        const currentRiskMultiplier = this.getCurrentRiskMultiplier();
        
        if (volatilityAnalysis.currentVolatility > this.riskThresholds.volatilityHighThreshold) {
            const recommendedMultiplier = this.calculateVolatilityMultiplier(volatilityAnalysis, currentRiskMultiplier);
            
            const actions = this.generateVolatilityActions(volatilityAnalysis, recommendedMultiplier);
            
            const insight = this.generateInsight(
                'risk',
                'warning',
                `高ボラティリティ（${(volatilityAnalysis.currentVolatility * 100).toFixed(1)}%）でリスク調整推奨`,
                `成績の変動が大きくなっています。安定性向上のためリスク調整を推奨します。`,
                actions,
                {
                    subType: 'volatility',
                    confidence: 80,
                    prediction: `リスク調整により成績安定性が${((1 - recommendedMultiplier) * 50).toFixed(0)}%向上します`,
                    rationale: `ボラティリティ分析: ${volatilityAnalysis.analysis}`,
                    currentMetrics: {
                        currentVolatility: volatilityAnalysis.currentVolatility,
                        averageVolatility: volatilityAnalysis.averageVolatility,
                        volatilityTrend: volatilityAnalysis.trend,
                        recommendedMultiplier: recommendedMultiplier
                    }
                }
            );
            
            insights.push(insight);
        }
        
        return insights;
    }

    /**
     * 連勝機会分析
     */
    analyzeWinStreak(history) {
        const insights = [];
        
        const consecutiveWins = this.calculateConsecutiveWins(history);
        const currentRiskMultiplier = this.getCurrentRiskMultiplier();
        
        if (consecutiveWins >= this.riskThresholds.winStreakOptimizationLevel) {
            const opportunityLevel = this.assessWinStreakOpportunity(consecutiveWins, history);
            const recommendedMultiplier = this.calculateAggressiveMultiplier(consecutiveWins, currentRiskMultiplier);
            
            const actions = this.generateWinStreakActions(consecutiveWins, recommendedMultiplier);
            
            const insight = this.generateInsight(
                'risk',
                'info',
                `${consecutiveWins}連勝による機会的リスク調整提案`,
                `連続${consecutiveWins}勝の好調期です。収益機会拡大のため適度なリスク増加を検討できます。`,
                actions,
                {
                    subType: 'win_streak',
                    confidence: 75,
                    prediction: `リスク増加により収益機会を${((recommendedMultiplier - 1) * 100).toFixed(0)}%拡大できます`,
                    rationale: `連勝分析: ${opportunityLevel.analysis}`,
                    currentMetrics: {
                        consecutiveWins: consecutiveWins,
                        currentRiskMultiplier: currentRiskMultiplier,
                        recommendedMultiplier: recommendedMultiplier,
                        opportunityLevel: opportunityLevel.level
                    }
                }
            );
            
            insights.push(insight);
        }
        
        return insights;
    }

    /**
     * Kelly基準統合分析
     */
    analyzeKellyRiskAlignment(history, portfolioData) {
        const insights = [];
        
        if (!portfolioData) return insights;
        
        const kellyAnalysis = this.analyzeKellyRiskAlignment_internal(history, portfolioData);
        const currentRiskMultiplier = this.getCurrentRiskMultiplier();
        
        if (Math.abs(kellyAnalysis.misalignment) > 0.2) {
            const recommendedMultiplier = this.calculateKellyAlignedMultiplier(kellyAnalysis, currentRiskMultiplier);
            
            const actions = this.generateKellyAlignmentActions(kellyAnalysis, recommendedMultiplier);
            
            const insight = this.generateInsight(
                'risk',
                'warning',
                'Kelly基準との乖離でリスク調整推奨',
                `現在のリスク設定がKelly基準から${(Math.abs(kellyAnalysis.misalignment) * 100).toFixed(1)}%乖離しています。`,
                actions,
                {
                    subType: 'kelly_alignment',
                    confidence: 85,
                    prediction: `Kelly基準調整により理論的最適性が${(Math.abs(kellyAnalysis.misalignment) * 100).toFixed(1)}%向上します`,
                    rationale: `Kelly分析: ${kellyAnalysis.analysis}`,
                    currentMetrics: {
                        theoreticalOptimal: kellyAnalysis.theoreticalOptimal,
                        currentSetting: kellyAnalysis.currentSetting,
                        misalignment: kellyAnalysis.misalignment,
                        recommendedMultiplier: recommendedMultiplier
                    }
                }
            );
            
            insights.push(insight);
        }
        
        return insights;
    }

    /**
     * 回復トレンド分析
     */
    analyzeRecoveryTrends(history) {
        const insights = [];
        
        const recoveryAnalysis = this.detectRecoveryTrends(history);
        const currentRiskMultiplier = this.getCurrentRiskMultiplier();
        
        if (recoveryAnalysis.isRecovering && currentRiskMultiplier < 1.0) {
            const recommendedMultiplier = this.calculateRecoveryMultiplier(recoveryAnalysis, currentRiskMultiplier);
            
            const actions = this.generateRecoveryActions(recoveryAnalysis, recommendedMultiplier);
            
            const insight = this.generateInsight(
                'risk',
                'info',
                '回復トレンド検出によるリスク調整提案',
                `成績回復傾向を検出しました。段階的なリスク復帰を検討できます。`,
                actions,
                {
                    subType: 'recovery_trend',
                    confidence: 70,
                    prediction: `段階的調整により収益機会を${((recommendedMultiplier - currentRiskMultiplier) * 100).toFixed(0)}%拡大できます`,
                    rationale: `回復分析: ${recoveryAnalysis.analysis}`,
                    currentMetrics: {
                        recoveryStrength: recoveryAnalysis.strength,
                        recoveryDuration: recoveryAnalysis.duration,
                        currentRiskMultiplier: currentRiskMultiplier,
                        recommendedMultiplier: recommendedMultiplier
                    }
                }
            );
            
            insights.push(insight);
        }
        
        return insights;
    }

    /**
     * 連敗リスク評価
     */
    assessConsecutiveLossRisk(consecutiveLosses) {
        if (consecutiveLosses >= 7) {
            return {
                level: 'critical',
                analysis: `極度の連敗（${consecutiveLosses}連敗）により資金保護が最優先`
            };
        } else if (consecutiveLosses >= 5) {
            return {
                level: 'high',
                analysis: `深刻な連敗（${consecutiveLosses}連敗）により防御的調整が必要`
            };
        } else if (consecutiveLosses >= 3) {
            return {
                level: 'moderate',
                analysis: `連敗（${consecutiveLosses}連敗）により予防的調整を推奨`
            };
        } else {
            return {
                level: 'low',
                analysis: `軽微な連敗（${consecutiveLosses}連敗）で経過観察`
            };
        }
    }

    /**
     * 防御的リスク倍率計算
     */
    calculateDefensiveMultiplier(consecutiveLosses, currentMultiplier) {
        const baseReduction = Math.min(0.4, consecutiveLosses * 0.08);
        const recommendedMultiplier = Math.max(
            this.kellyIntegration.minRiskMultiplier,
            currentMultiplier * (1 - baseReduction)
        );
        
        return Math.round(recommendedMultiplier * 10) / 10;
    }

    /**
     * ドローダウンメトリクス計算
     */
    calculateDrawdownMetrics(history) {
        if (!history || history.length === 0) {
            return { currentDrawdown: 0, maxDrawdown: 0, duration: 0, analysis: 'データ不足' };
        }
        
        let peak = 0;
        let currentDrawdown = 0;
        let maxDrawdown = 0;
        let drawdownDuration = 0;
        let currentDuration = 0;
        
        let cumulativeReturn = 0;
        
        history.forEach(h => {
            const return_ = (h.return || h.payout || 0) - (h.investment || h.amount || 0);
            cumulativeReturn += return_;
            
            if (cumulativeReturn > peak) {
                peak = cumulativeReturn;
                currentDuration = 0;
            } else {
                currentDuration++;
            }
            
            currentDrawdown = peak > 0 ? (peak - cumulativeReturn) / Math.abs(peak) : 0;
            maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
            drawdownDuration = Math.max(drawdownDuration, currentDuration);
        });
        
        return {
            currentDrawdown,
            maxDrawdown,
            duration: drawdownDuration,
            analysis: `最大DD${(maxDrawdown * 100).toFixed(1)}%, 継続${drawdownDuration}レース`
        };
    }

    /**
     * ドローダウン調整倍率計算
     */
    calculateDrawdownMultiplier(drawdownAnalysis, currentMultiplier) {
        const severityFactor = Math.min(1.0, drawdownAnalysis.currentDrawdown / this.riskThresholds.drawdownCriticalLevel);
        const durationFactor = Math.min(0.3, drawdownAnalysis.duration * 0.05);
        
        const totalReduction = severityFactor * 0.4 + durationFactor;
        const recommendedMultiplier = Math.max(
            this.kellyIntegration.minRiskMultiplier,
            currentMultiplier * (1 - totalReduction)
        );
        
        return Math.round(recommendedMultiplier * 10) / 10;
    }

    /**
     * ボラティリティメトリクス計算
     */
    calculateVolatilityMetrics(history) {
        if (!history || history.length < 5) {
            return { currentVolatility: 0, averageVolatility: 0, trend: 'stable', analysis: 'データ不足' };
        }
        
        const returns = history.map(h => {
            const investment = h.investment || h.amount || 0;
            const return_ = h.return || h.payout || 0;
            return investment > 0 ? (return_ - investment) / investment : 0;
        });
        
        const recentReturns = returns.slice(-5);
        const historicalReturns = returns.slice(0, -5);
        
        const currentVolatility = this.calculateStandardDeviation(recentReturns);
        const averageVolatility = historicalReturns.length > 0 ? this.calculateStandardDeviation(historicalReturns) : currentVolatility;
        
        const trend = currentVolatility > averageVolatility * 1.2 ? 'increasing' : 
                     currentVolatility < averageVolatility * 0.8 ? 'decreasing' : 'stable';
        
        return {
            currentVolatility,
            averageVolatility,
            trend,
            analysis: `現在${(currentVolatility * 100).toFixed(1)}% vs 平均${(averageVolatility * 100).toFixed(1)}%`
        };
    }

    /**
     * ボラティリティ調整倍率計算
     */
    calculateVolatilityMultiplier(volatilityAnalysis, currentMultiplier) {
        const excessVolatility = Math.max(0, volatilityAnalysis.currentVolatility - volatilityAnalysis.averageVolatility);
        const reductionFactor = Math.min(0.3, excessVolatility * 0.8);
        
        const recommendedMultiplier = Math.max(
            this.kellyIntegration.minRiskMultiplier,
            currentMultiplier * (1 - reductionFactor)
        );
        
        return Math.round(recommendedMultiplier * 10) / 10;
    }

    /**
     * 連勝機会評価
     */
    assessWinStreakOpportunity(consecutiveWins, history) {
        const recentPerformance = history.slice(-10);
        const winRate = recentPerformance.filter(h => h.result === 'win' || h.won === true).length / recentPerformance.length;
        
        if (consecutiveWins >= 8 && winRate > 0.7) {
            return {
                level: 'high',
                analysis: `強い連勝（${consecutiveWins}連勝）と高勝率${(winRate * 100).toFixed(1)}%`
            };
        } else if (consecutiveWins >= 5 && winRate > 0.6) {
            return {
                level: 'moderate',
                analysis: `連勝（${consecutiveWins}連勝）と良好な勝率${(winRate * 100).toFixed(1)}%`
            };
        } else {
            return {
                level: 'low',
                analysis: `連勝（${consecutiveWins}連勝）だが勝率${(winRate * 100).toFixed(1)}%は注意`
            };
        }
    }

    /**
     * 積極的リスク倍率計算
     */
    calculateAggressiveMultiplier(consecutiveWins, currentMultiplier) {
        const confidenceBonus = Math.min(0.3, consecutiveWins * 0.04);
        const recommendedMultiplier = Math.min(
            this.kellyIntegration.maxRiskMultiplier,
            currentMultiplier * (1 + confidenceBonus)
        );
        
        return Math.round(recommendedMultiplier * 10) / 10;
    }

    /**
     * Kelly基準統合分析（内部）
     */
    analyzeKellyRiskAlignment_internal(history, portfolioData) {
        // 簡略化したKelly最適性分析
        const recentPerformance = history.slice(-10);
        const winRate = recentPerformance.filter(h => h.result === 'win' || h.won === true).length / recentPerformance.length;
        const averageOdds = recentPerformance.reduce((sum, h) => sum + (h.odds || 0), 0) / recentPerformance.length;
        
        // 理論的最適Kelly比率
        const theoreticalOptimal = winRate > 0 && averageOdds > 1 ? 
            (winRate * averageOdds - 1) / (averageOdds - 1) : 0;
        
        const currentSetting = portfolioData.riskMultiplier || 1.0;
        const misalignment = (currentSetting - theoreticalOptimal) / Math.max(theoreticalOptimal, 0.1);
        
        return {
            theoreticalOptimal,
            currentSetting,
            misalignment,
            analysis: `理論値${theoreticalOptimal.toFixed(3)} vs 現在${currentSetting.toFixed(3)}`
        };
    }

    /**
     * Kelly調整倍率計算
     */
    calculateKellyAlignedMultiplier(kellyAnalysis, currentMultiplier) {
        const targetMultiplier = Math.max(
            this.kellyIntegration.minRiskMultiplier,
            Math.min(this.kellyIntegration.maxRiskMultiplier, kellyAnalysis.theoreticalOptimal)
        );
        
        // 段階的調整（一度に大きく変更しない）
        const adjustment = (targetMultiplier - currentMultiplier) * 0.3;
        const recommendedMultiplier = currentMultiplier + adjustment;
        
        return Math.round(recommendedMultiplier * 10) / 10;
    }

    /**
     * 回復トレンド検出
     */
    detectRecoveryTrends(history) {
        if (!history || history.length < 6) {
            return { isRecovering: false, strength: 0, duration: 0, analysis: 'データ不足' };
        }
        
        const recentPeriod = history.slice(-this.riskThresholds.recoveryDetectionPeriod);
        const wins = recentPeriod.filter(h => h.result === 'win' || h.won === true).length;
        const winRate = wins / recentPeriod.length;
        
        const previousPeriod = history.slice(
            -(this.riskThresholds.recoveryDetectionPeriod * 2),
            -this.riskThresholds.recoveryDetectionPeriod
        );
        const previousWins = previousPeriod.filter(h => h.result === 'win' || h.won === true).length;
        const previousWinRate = previousWins / previousPeriod.length;
        
        const improvement = winRate - previousWinRate;
        const isRecovering = improvement > 0.2 && winRate > 0.5;
        
        return {
            isRecovering,
            strength: improvement,
            duration: recentPeriod.length,
            analysis: `勝率 ${(previousWinRate * 100).toFixed(1)}% → ${(winRate * 100).toFixed(1)}%`
        };
    }

    /**
     * 回復調整倍率計算
     */
    calculateRecoveryMultiplier(recoveryAnalysis, currentMultiplier) {
        const recoveryFactor = Math.min(0.3, recoveryAnalysis.strength * 0.8);
        const recommendedMultiplier = Math.min(
            this.kellyIntegration.maxRiskMultiplier,
            currentMultiplier * (1 + recoveryFactor)
        );
        
        return Math.round(recommendedMultiplier * 10) / 10;
    }

    /**
     * 連敗対応アクション生成
     */
    generateConsecutiveLossActions(consecutiveLosses, recommendedMultiplier) {
        const actions = [];
        
        actions.push({
            type: 'riskMultiplier',
            title: 'リスク倍率の引き下げ',
            description: `${this.getCurrentRiskMultiplier()}x → ${recommendedMultiplier}xに調整`,
            value: recommendedMultiplier,
            expectedEffect: `最大損失 -${((1 - recommendedMultiplier) * 100).toFixed(0)}%`
        });
        
        if (consecutiveLosses >= 5) {
            actions.push({
                type: 'maxBetAmount',
                title: '最大投資額の制限',
                description: '一時的な投資上限の設定',
                value: 3000,
                expectedEffect: '資金保護強化'
            });
        }
        
        actions.push({
            type: 'conservativeMode',
            title: '保守的モードの有効化',
            description: '高確度候補のみに絞り込み',
            value: true,
            expectedEffect: '安定性向上'
        });
        
        return actions;
    }

    /**
     * ドローダウン対応アクション生成
     */
    generateDrawdownActions(drawdownAnalysis, recommendedMultiplier) {
        const actions = [];
        
        actions.push({
            type: 'riskMultiplier',
            title: 'リスク倍率の緊急調整',
            description: `ドローダウン対応で${recommendedMultiplier}xに調整`,
            value: recommendedMultiplier,
            expectedEffect: `追加損失リスク -${((1 - recommendedMultiplier) * 100).toFixed(0)}%`
        });
        
        if (drawdownAnalysis.currentDrawdown > 0.2) {
            actions.push({
                type: 'emergencyStop',
                title: '緊急投資停止',
                description: '一時的な投資活動停止',
                value: true,
                expectedEffect: '損失拡大防止'
            });
        }
        
        actions.push({
            type: 'recoveryStrategy',
            title: '回復戦略の実施',
            description: '段階的な投資復帰計画',
            value: 'gradual_recovery',
            expectedEffect: '安全な回復'
        });
        
        return actions;
    }

    /**
     * ボラティリティ対応アクション生成
     */
    generateVolatilityActions(volatilityAnalysis, recommendedMultiplier) {
        const actions = [];
        
        actions.push({
            type: 'riskMultiplier',
            title: 'ボラティリティ調整',
            description: `変動性抑制で${recommendedMultiplier}xに調整`,
            value: recommendedMultiplier,
            expectedEffect: `成績安定性 +${((1 - recommendedMultiplier) * 50).toFixed(0)}%`
        });
        
        actions.push({
            type: 'diversification',
            title: '分散投資強化',
            description: '投資対象の分散度向上',
            value: 'increase_diversification',
            expectedEffect: 'リスク分散'
        });
        
        return actions;
    }

    /**
     * 連勝対応アクション生成
     */
    generateWinStreakActions(consecutiveWins, recommendedMultiplier) {
        const actions = [];
        
        actions.push({
            type: 'riskMultiplier',
            title: '機会的リスク増加',
            description: `好調期活用で${recommendedMultiplier}xに調整`,
            value: recommendedMultiplier,
            expectedEffect: `収益機会 +${((recommendedMultiplier - 1) * 100).toFixed(0)}%`
        });
        
        actions.push({
            type: 'profitTaking',
            title: '利益確保の設定',
            description: '一定利益での部分的利確',
            value: 'enable_profit_taking',
            expectedEffect: '利益保護'
        });
        
        return actions;
    }

    /**
     * Kelly統合アクション生成
     */
    generateKellyAlignmentActions(kellyAnalysis, recommendedMultiplier) {
        const actions = [];
        
        actions.push({
            type: 'riskMultiplier',
            title: 'Kelly基準整合調整',
            description: `理論最適値に向けて${recommendedMultiplier}xに調整`,
            value: recommendedMultiplier,
            expectedEffect: `理論最適性 +${(Math.abs(kellyAnalysis.misalignment) * 100).toFixed(0)}%`
        });
        
        actions.push({
            type: 'kellyRecalibration',
            title: 'Kelly基準再校正',
            description: '現在の実績に基づく基準更新',
            value: 'recalibrate_kelly',
            expectedEffect: '精度向上'
        });
        
        return actions;
    }

    /**
     * 回復対応アクション生成
     */
    generateRecoveryActions(recoveryAnalysis, recommendedMultiplier) {
        const actions = [];
        
        actions.push({
            type: 'riskMultiplier',
            title: '段階的リスク復帰',
            description: `回復トレンドに応じて${recommendedMultiplier}xに調整`,
            value: recommendedMultiplier,
            expectedEffect: `収益機会 +${((recommendedMultiplier - this.getCurrentRiskMultiplier()) * 100).toFixed(0)}%`
        });
        
        actions.push({
            type: 'gradualIncrease',
            title: '段階的増加計画',
            description: '成績確認後の段階的リスク増加',
            value: 'gradual_increase_plan',
            expectedEffect: '安全な復帰'
        });
        
        return actions;
    }

    /**
     * 各種計算メソッド
     */
    calculateConsecutiveLosses(history) {
        if (!history || history.length === 0) return 0;
        
        let consecutive = 0;
        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].result === 'loss' || history[i].won === false) {
                consecutive++;
            } else {
                break;
            }
        }
        return consecutive;
    }

    calculateConsecutiveWins(history) {
        if (!history || history.length === 0) return 0;
        
        let consecutive = 0;
        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].result === 'win' || history[i].won === true) {
                consecutive++;
            } else {
                break;
            }
        }
        return consecutive;
    }

    calculateStandardDeviation(values) {
        if (!values || values.length === 0) return 0;
        
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    getCurrentRiskMultiplier() {
        const portfolioData = this.getPortfolioData();
        return portfolioData?.riskMultiplier || 1.0;
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
window.RiskAdjustmentAdvisor = RiskAdjustmentAdvisor;