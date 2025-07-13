/**
 * 動的投資額調整・レース戦略管理システム
 * ケリー基準、期待値、リスク管理を統合した投資額最適化
 */
class DynamicBettingManager {
    constructor() {
        this.baseBank = 50000; // 基準軍資金（現実的な額に増額）
        this.currentBank = this.baseBank;
        this.maxRiskPerRace = 0.25; // レースあたり最大リスク25%
        this.kellyFraction = 0.5; // ケリー基準の保守的係数
        this.performanceHistory = [];
    }

    /**
     * レース特性に応じた動的投資額調整
     */
    calculateDynamicBetting(raceAnalysis, bankroll = this.currentBank) {
        const strategy = this.analyzeRaceStrategy(raceAnalysis);
        const riskLevel = this.assessRaceRisk(raceAnalysis);
        const kellyAmounts = this.calculateKellyBetting(raceAnalysis, bankroll);
        
        // 戦略別投資額調整
        const adjustedAmounts = this.adjustBettingByStrategy(kellyAmounts, strategy, riskLevel, bankroll);
        
        return {
            strategy: strategy.type,
            riskLevel: riskLevel.level,
            totalAmount: adjustedAmounts.total,
            recommendations: adjustedAmounts.recommendations,
            reasoning: strategy.reasoning,
            riskAssessment: riskLevel.assessment
        };
    }

    /**
     * レース戦略分析
     */
    analyzeRaceStrategy(raceAnalysis) {
        const horses = raceAnalysis.analyzedHorses;
        const excellentHorses = horses.filter(h => h.expectedValue >= 1.3);
        const goodHorses = horses.filter(h => h.expectedValue >= 1.1 && h.expectedValue < 1.3);
        
        // 期待値分析
        const maxExpectedValue = Math.max(...horses.map(h => h.expectedValue));
        const avgExpectedValue = horses.reduce((sum, h) => sum + h.expectedValue, 0) / horses.length;
        
        // 信頼度分析
        const maxConfidence = Math.max(...horses.map(h => h.confidence));
        const avgConfidence = horses.reduce((sum, h) => sum + h.confidence, 0) / horses.length;

        // 戦略決定
        if (excellentHorses.length === 1 && maxConfidence >= 85 && maxExpectedValue >= 1.5) {
            return {
                type: 'aggressive_focus',
                reasoning: '超高期待値・高信頼度による積極集中戦略',
                allocationMultiplier: 1.5,
                maxBetRatio: 0.4
            };
        } else if (excellentHorses.length >= 2 && avgExpectedValue >= 1.2) {
            return {
                type: 'balanced_multi',
                reasoning: '複数優良馬による分散戦略',
                allocationMultiplier: 1.2,
                maxBetRatio: 0.35
            };
        } else if (goodHorses.length >= 1 && avgConfidence >= 70) {
            return {
                type: 'conservative_selective',
                reasoning: '保守的選択戦略',
                allocationMultiplier: 0.8,
                maxBetRatio: 0.25
            };
        } else {
            return {
                type: 'minimal_risk',
                reasoning: '最小リスク戦略または見送り推奨',
                allocationMultiplier: 0.5,
                maxBetRatio: 0.15
            };
        }
    }

    /**
     * レースリスク評価
     */
    assessRaceRisk(raceAnalysis) {
        const horses = raceAnalysis.analyzedHorses;
        
        // リスク要因の計算
        const factors = {
            // 期待値分散（予想の不確実性）
            expectedValueVariance: this.calculateVariance(horses.map(h => h.expectedValue)),
            
            // 信頼度の低さ
            lowConfidenceRatio: horses.filter(h => h.confidence < 70).length / horses.length,
            
            // 人気馬の偏り
            favoriteConcentration: horses.filter(h => h.popularity <= 3).length / horses.length,
            
            // 出走頭数（少ない＝リスク高）
            fieldSizeRisk: Math.max(0, (12 - horses.length) / 12),
            
            // 最高期待値の低さ
            maxExpectedValueRisk: Math.max(0, (1.5 - Math.max(...horses.map(h => h.expectedValue))) / 0.5)
        };

        // 総合リスクスコア計算
        const riskScore = (
            factors.expectedValueVariance * 0.3 +
            factors.lowConfidenceRatio * 0.25 +
            factors.favoriteConcentration * 0.2 +
            factors.fieldSizeRisk * 0.15 +
            factors.maxExpectedValueRisk * 0.1
        );

        let level, assessment;
        if (riskScore <= 0.3) {
            level = 'low';
            assessment = '低リスク（安定的な投資環境）';
        } else if (riskScore <= 0.6) {
            level = 'medium';
            assessment = '中リスク（標準的な投資判断）';
        } else {
            level = 'high';
            assessment = '高リスク（慎重な投資または見送り推奨）';
        }

        return { level, assessment, score: riskScore, factors };
    }

    /**
     * ケリー基準による投資額計算
     */
    calculateKellyBetting(raceAnalysis, bankroll) {
        const horses = raceAnalysis.analyzedHorses;
        const kellyBets = [];

        horses.forEach(horse => {
            if (horse.expectedValue > 1.0) {
                // ケリー基準: f = (bp - q) / b
                // b = オッズ-1, p = 勝率, q = 負け率
                const odds = horse.estimatedOdds;
                const winProbability = 1 / odds * horse.expectedValue;
                const loseProbability = 1 - winProbability;
                
                if (winProbability > 0 && winProbability < 1) {
                    const kellyFraction = (odds * winProbability - loseProbability) / odds;
                    const adjustedKelly = Math.max(0, kellyFraction * this.kellyFraction); // 保守的調整
                    
                    const betAmount = Math.floor(bankroll * adjustedKelly);
                    
                    if (betAmount >= 50) {
                        kellyBets.push({
                            horse: horse.horse,
                            kellyFraction: adjustedKelly,
                            amount: betAmount,
                            expectedValue: horse.expectedValue,
                            confidence: horse.confidence,
                            type: 'place'
                        });
                    }
                }
            }
        });

        return kellyBets.sort((a, b) => b.expectedValue - a.expectedValue);
    }

    /**
     * 戦略別投資額調整
     */
    adjustBettingByStrategy(kellyBets, strategy, riskLevel, bankroll) {
        const maxTotalBet = Math.floor(bankroll * strategy.maxBetRatio);
        let totalAllocated = 0;
        const recommendations = [];

        // リスクレベル別調整係数
        const riskAdjustment = {
            'low': 1.0,
            'medium': 0.8,
            'high': 0.6
        };

        const adjustment = riskAdjustment[riskLevel.level] * strategy.allocationMultiplier;

        kellyBets.forEach((bet, index) => {
            if (totalAllocated >= maxTotalBet) return;

            // 戦略別配分調整
            let adjustedAmount;
            if (strategy.type === 'aggressive_focus' && index === 0) {
                // 集中戦略：最高期待値馬に重点配分
                adjustedAmount = Math.floor(bet.amount * adjustment * 1.5);
            } else if (strategy.type === 'balanced_multi' && index < 3) {
                // 分散戦略：上位3頭に均等配分
                adjustedAmount = Math.floor(bet.amount * adjustment);
            } else if (strategy.type === 'conservative_selective' && index < 2) {
                // 保守戦略：上位2頭に慎重配分
                adjustedAmount = Math.floor(bet.amount * adjustment * 0.8);
            } else if (strategy.type === 'minimal_risk' && index === 0) {
                // 最小リスク：最高期待値馬のみ最小額
                adjustedAmount = Math.floor(bet.amount * adjustment * 0.5);
            } else {
                return; // その他はスキップ
            }

            // 最大投資額制限
            adjustedAmount = Math.min(adjustedAmount, maxTotalBet - totalAllocated);
            adjustedAmount = Math.min(adjustedAmount, bankroll * 0.2); // 単一馬券の上限20%

            if (adjustedAmount >= 50) {
                recommendations.push({
                    type: bet.type,
                    horse: bet.horse,
                    amount: adjustedAmount,
                    expectedValue: bet.expectedValue,
                    confidence: bet.confidence,
                    kellyFraction: bet.kellyFraction,
                    reason: `動的調整（${strategy.type}・${riskLevel.level}リスク）`,
                    strategy: strategy.type,
                    riskLevel: riskLevel.level
                });
                
                totalAllocated += adjustedAmount;
            }
        });

        return {
            recommendations,
            total: totalAllocated,
            utilizationRate: totalAllocated / bankroll,
            maxAllowedBet: maxTotalBet,
            adjustment: adjustment
        };
    }

    /**
     * パフォーマンス追跡
     */
    trackPerformance(raceResult, bettingRecommendations) {
        const performance = {
            date: new Date(),
            totalBet: bettingRecommendations.reduce((sum, bet) => sum + bet.amount, 0),
            totalReturn: 0,
            hitCount: 0,
            missCount: 0,
            details: []
        };

        bettingRecommendations.forEach(bet => {
            const result = this.evaluateBetResult(bet, raceResult);
            performance.details.push({
                bet,
                result,
                profit: result.hit ? (result.payout - bet.amount) : -bet.amount
            });
            
            if (result.hit) {
                performance.hitCount++;
                performance.totalReturn += result.payout;
            } else {
                performance.missCount++;
            }
        });

        performance.netProfit = performance.totalReturn - performance.totalBet;
        performance.roi = performance.totalBet > 0 ? (performance.netProfit / performance.totalBet) * 100 : 0;
        performance.hitRate = performance.hitCount / (performance.hitCount + performance.missCount) * 100;

        this.performanceHistory.push(performance);
        this.updateBankroll(performance.netProfit);

        return performance;
    }

    /**
     * 馬券結果評価
     */
    evaluateBetResult(bet, raceResult) {
        // 簡略化された結果評価（実際の実装では詳細な着順・配当データが必要）
        const hit = raceResult.winners && raceResult.winners.includes(bet.horse.number);
        const payout = hit ? bet.amount * (bet.expectedValue || 1.5) : 0;
        
        return { hit, payout };
    }

    /**
     * 軍資金更新
     */
    updateBankroll(profit) {
        this.currentBank += profit;
        
        // 軍資金管理ルール
        if (this.currentBank < this.baseBank * 0.7) {
            // 30%以上の損失で軍資金リセット
            console.warn('軍資金30%減少により基準額にリセット');
            this.currentBank = this.baseBank;
        } else if (this.currentBank > this.baseBank * 2) {
            // 2倍になったら利益確保
            const profit = this.currentBank - this.baseBank;
            this.baseBank += profit * 0.5; // 利益の50%を基準額に追加
            this.currentBank = this.baseBank;
            console.info(`利益確保: 基準額を${this.baseBank}円に更新`);
        }
    }

    /**
     * パフォーマンス統計取得
     */
    getPerformanceStats() {
        if (this.performanceHistory.length === 0) return null;

        const totalBet = this.performanceHistory.reduce((sum, p) => sum + p.totalBet, 0);
        const totalReturn = this.performanceHistory.reduce((sum, p) => sum + p.totalReturn, 0);
        const totalProfit = totalReturn - totalBet;
        
        const hitRates = this.performanceHistory.map(p => p.hitRate);
        const rois = this.performanceHistory.map(p => p.roi);

        return {
            totalRaces: this.performanceHistory.length,
            totalBet,
            totalReturn,
            totalProfit,
            overallROI: totalBet > 0 ? (totalProfit / totalBet) * 100 : 0,
            averageHitRate: hitRates.reduce((sum, hr) => sum + hr, 0) / hitRates.length,
            averageROI: rois.reduce((sum, roi) => sum + roi, 0) / rois.length,
            currentBank: this.currentBank,
            baseBank: this.baseBank,
            winningRaces: this.performanceHistory.filter(p => p.netProfit > 0).length,
            losingRaces: this.performanceHistory.filter(p => p.netProfit < 0).length
        };
    }

    /**
     * 分散計算ヘルパー
     */
    calculateVariance(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return variance;
    }

    /**
     * レース戦略レポート生成
     */
    generateStrategyReport(raceAnalysis) {
        const strategy = this.analyzeRaceStrategy(raceAnalysis);
        const risk = this.assessRaceRisk(raceAnalysis);
        const betting = this.calculateDynamicBetting(raceAnalysis);

        return {
            raceStrategy: strategy,
            riskAssessment: risk,
            bettingPlan: betting,
            recommendations: this.generateDetailedRecommendations(strategy, risk, betting)
        };
    }

    /**
     * 詳細推奨事項生成
     */
    generateDetailedRecommendations(strategy, risk, betting) {
        const recommendations = [];

        // 戦略別推奨
        recommendations.push(`【戦略】${strategy.reasoning}`);
        
        // リスク別推奨
        if (risk.level === 'high') {
            recommendations.push('【注意】高リスクレース - 投資額を抑制するか見送りを検討');
        } else if (risk.level === 'low') {
            recommendations.push('【好機】低リスクレース - 積極的な投資機会');
        }

        // 投資額推奨
        const utilizationRate = betting.totalAmount / this.currentBank;
        if (utilizationRate < 0.1) {
            recommendations.push('【資金】保守的配分 - より積極的な投資も可能');
        } else if (utilizationRate > 0.3) {
            recommendations.push('【資金】高配分率 - リスク管理を重視');
        }

        return recommendations;
    }
}

// グローバル変数として公開
window.DynamicBettingManager = DynamicBettingManager;