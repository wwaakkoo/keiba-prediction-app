/**
 * Phase 6: ケリー基準による高度な資金管理システム
 * 科学的根拠に基づく最適投資比率計算と動的調整
 */
class KellyCapitalManager {
    constructor() {
        this.currentCapital = 100000; // 初期資金（10万円）
        this.maxBetRatio = 0.10; // 最大投資比率（10%）
        this.minBetAmount = 100; // 最小投資額
        this.maxBetAmount = 5000; // 最大投資額
        this.riskLevel = 'moderate'; // conservative, moderate, aggressive
        this.performanceHistory = this.loadPerformanceHistory();
        this.drawdownLimit = 0.20; // 最大ドローダウン20%
        this.capitalPeak = this.currentCapital;
    }

    /**
     * ケリー基準による最適投資比率計算
     * f = (bp - q) / b
     * f: 最適投資比率, b: オッズ-1, p: 勝率, q: 負け率(1-p)
     */
    calculateKellyRatio(winProbability, odds, confidence = 1.0) {
        console.log('🧮 ケリー基準計算開始:', {
            winProbability: winProbability,
            odds: odds,
            confidence: confidence
        });

        // バリデーション
        if (typeof winProbability !== 'number' || isNaN(winProbability)) {
            console.warn('⚠️ 勝率が数値ではありません:', winProbability);
            return 0;
        }
        
        if (winProbability <= 0 || winProbability >= 1) {
            console.warn('⚠️ 勝率が範囲外:', winProbability);
            return 0;
        }
        
        if (typeof odds !== 'number' || isNaN(odds) || odds <= 1) {
            console.warn('⚠️ オッズが不正:', odds);
            return 0;
        }

        // ケリー基準計算
        const b = odds - 1; // 純利益倍率
        const p = winProbability; // 勝率
        const q = 1 - p; // 負け率
        
        const kellyRatio = (b * p - q) / b;
        
        console.log('📊 ケリー計算詳細:', {
            b: b.toFixed(3),
            p: p.toFixed(3),
            q: q.toFixed(3),
            rawKelly: kellyRatio.toFixed(4)
        });

        // 期待値チェック（ケリー > 0 = 正の期待値）
        if (kellyRatio <= 0) {
            console.log('❌ 負の期待値のため投資非推奨');
            return 0;
        }

        // 信頼度による調整
        const adjustedKelly = kellyRatio * confidence;
        
        // リスクレベル調整
        const riskAdjustedKelly = this.applyRiskAdjustment(adjustedKelly);
        
        console.log('✅ 最終ケリー比率:', riskAdjustedKelly.toFixed(4));
        
        return Math.max(0, Math.min(this.maxBetRatio, riskAdjustedKelly));
    }

    /**
     * リスクレベルに応じたケリー比率調整
     */
    applyRiskAdjustment(kellyRatio) {
        const adjustmentFactors = {
            'conservative': 0.25, // 25%ケリー（非常に保守的）
            'moderate': 0.5,      // 50%ケリー（中程度のリスク）
            'aggressive': 0.75    // 75%ケリー（積極的）
        };
        
        return kellyRatio * (adjustmentFactors[this.riskLevel] || 0.5);
    }

    /**
     * 動的投資額計算
     */
    calculateOptimalBetAmount(expectedValue, winProbability, odds, confidence = 1.0) {
        console.log('💰 動的投資額計算開始:', {
            expectedValue: expectedValue,
            currentCapital: this.currentCapital,
            riskLevel: this.riskLevel
        });

        // ケリー比率計算
        const kellyRatio = this.calculateKellyRatio(winProbability, odds, confidence);
        
        if (kellyRatio <= 0) {
            return {
                amount: 0,
                ratio: 0,
                reasoning: '負の期待値のため投資見送り',
                kellyRatio: kellyRatio,
                recommendation: 'skip'
            };
        }

        // 基本投資額
        let baseAmount = this.currentCapital * kellyRatio;
        
        // ドローダウン制御
        const currentDrawdown = this.getCurrentDrawdown();
        if (currentDrawdown > this.drawdownLimit * 0.8) {
            baseAmount *= 0.5; // ドローダウン接近時は投資額半減
            console.log('⚠️ ドローダウン制御発動:', currentDrawdown.toFixed(3));
        }

        // 期待値による調整
        const expectedValueMultiplier = this.calculateExpectedValueMultiplier(expectedValue);
        const adjustedAmount = baseAmount * expectedValueMultiplier;

        // 上下限制約
        const finalAmount = Math.max(
            this.minBetAmount,
            Math.min(this.maxBetAmount, Math.min(adjustedAmount, this.currentCapital * this.maxBetRatio))
        );

        const finalRatio = finalAmount / this.currentCapital;

        // 推奨レベル判定
        const recommendation = this.determineRecommendationLevel(kellyRatio, expectedValue, confidence);

        console.log('✅ 投資額計算完了:', {
            kellyRatio: kellyRatio.toFixed(4),
            baseAmount: baseAmount.toFixed(0),
            adjustedAmount: adjustedAmount.toFixed(0),
            finalAmount: finalAmount,
            ratio: (finalRatio * 100).toFixed(2) + '%'
        });

        return {
            amount: Math.round(finalAmount),
            ratio: finalRatio,
            kellyRatio: kellyRatio,
            reasoning: this.generateBetReasoning(kellyRatio, expectedValue, currentDrawdown),
            recommendation: recommendation,
            details: {
                baseAmount: Math.round(baseAmount),
                expectedValueMultiplier: expectedValueMultiplier,
                drawdownAdjustment: currentDrawdown > this.drawdownLimit * 0.8 ? 0.5 : 1.0,
                confidence: confidence
            }
        };
    }

    /**
     * 期待値による乗数計算
     */
    calculateExpectedValueMultiplier(expectedValue) {
        if (expectedValue >= 1.5) return 1.2;  // 期待値1.5以上：20%増額
        if (expectedValue >= 1.3) return 1.1;  // 期待値1.3以上：10%増額
        if (expectedValue >= 1.1) return 1.0;  // 期待値1.1以上：標準
        if (expectedValue >= 0.9) return 0.8;  // 期待値0.9以上：20%減額
        return 0.5; // 期待値0.9未満：50%減額
    }

    /**
     * 推奨レベル判定
     */
    determineRecommendationLevel(kellyRatio, expectedValue, confidence) {
        if (kellyRatio <= 0 || expectedValue < 1.0) return 'skip';
        if (kellyRatio >= 0.05 && expectedValue >= 1.3 && confidence >= 0.8) return 'strong_buy';
        if (kellyRatio >= 0.03 && expectedValue >= 1.2 && confidence >= 0.7) return 'buy';
        if (kellyRatio >= 0.01 && expectedValue >= 1.1) return 'light_buy';
        return 'watch';
    }

    /**
     * 複数馬券の最適配分計算
     */
    calculatePortfolioAllocation(candidates) {
        console.log('📊 ポートフォリオ最適化開始:', candidates.length, '候補');

        if (!candidates || candidates.length === 0) {
            return {
                totalAmount: 0,
                allocations: [],
                portfolioKelly: 0,
                recommendation: 'skip',
                reasoning: '投資候補がありません'
            };
        }

        let validCandidates = [];
        let totalKellyWeight = 0;

        // 各候補のケリー比率計算
        for (const candidate of candidates) {
            const kelly = this.calculateKellyRatio(
                candidate.winProbability,
                candidate.odds,
                candidate.confidence || 1.0
            );

            if (kelly > 0) {
                validCandidates.push({
                    ...candidate,
                    kellyRatio: kelly,
                    weight: kelly
                });
                totalKellyWeight += kelly;
            }
        }

        if (validCandidates.length === 0) {
            return {
                totalAmount: 0,
                allocations: [],
                portfolioKelly: 0,
                recommendation: 'skip',
                reasoning: '全候補が負の期待値'
            };
        }

        // 総投資額制限
        const maxTotalInvestment = this.currentCapital * this.maxBetRatio;
        const portfolioKelly = Math.min(totalKellyWeight, this.maxBetRatio);
        const totalBudget = this.currentCapital * portfolioKelly;

        console.log('📈 ポートフォリオ概要:', {
            validCandidates: validCandidates.length,
            totalKellyWeight: totalKellyWeight.toFixed(4),
            portfolioKelly: portfolioKelly.toFixed(4),
            totalBudget: totalBudget.toFixed(0)
        });

        // 比例配分計算
        const allocations = validCandidates.map(candidate => {
            const proportion = candidate.weight / totalKellyWeight;
            const rawAmount = totalBudget * proportion;
            const amount = Math.max(this.minBetAmount, Math.round(rawAmount));

            return {
                horse: candidate.horse,
                betType: candidate.betType,
                amount: amount,
                proportion: proportion,
                kellyRatio: candidate.kellyRatio,
                expectedValue: candidate.expectedValue,
                reasoning: `ケリー比率${(candidate.kellyRatio * 100).toFixed(2)}%による配分`
            };
        });

        const actualTotal = allocations.reduce((sum, allocation) => sum + allocation.amount, 0);

        return {
            totalAmount: actualTotal,
            allocations: allocations,
            portfolioKelly: portfolioKelly,
            recommendation: this.determinePortfolioRecommendation(portfolioKelly, validCandidates),
            reasoning: `${validCandidates.length}候補のポートフォリオ最適化`,
            efficiency: actualTotal <= maxTotalInvestment ? 'optimal' : 'constrained'
        };
    }

    /**
     * ポートフォリオ推奨判定
     */
    determinePortfolioRecommendation(portfolioKelly, candidates) {
        const avgExpectedValue = candidates.reduce((sum, c) => sum + c.expectedValue, 0) / candidates.length;
        
        if (portfolioKelly >= 0.08 && avgExpectedValue >= 1.3) return 'strong_portfolio';
        if (portfolioKelly >= 0.05 && avgExpectedValue >= 1.2) return 'good_portfolio';
        if (portfolioKelly >= 0.02 && avgExpectedValue >= 1.1) return 'moderate_portfolio';
        return 'light_portfolio';
    }

    /**
     * 資金管理状況更新
     */
    updateCapital(raceResult) {
        const previousCapital = this.currentCapital;
        
        console.log('💰 Phase 6資金更新開始:', {
            currentCapital: this.currentCapital,
            raceResult: raceResult
        });
        
        // 投資額と回収額の計算（安全な値アクセス）
        const totalInvestment = raceResult.bets ? 
            raceResult.bets.reduce((sum, bet) => sum + (bet.amount || 0), 0) : 0;
        const totalReturn = raceResult.returns ? 
            raceResult.returns.reduce((sum, ret) => sum + (ret.amount || 0), 0) : 0;
        
        const netResult = totalReturn - totalInvestment;
        
        // NaN検証とエラーハンドリング
        if (isNaN(netResult)) {
            console.error('❌ Phase 6資金計算エラー: netResultがNaN', {
                totalInvestment,
                totalReturn,
                previousCapital: this.currentCapital
            });
            return {
                previousCapital: this.currentCapital,
                currentCapital: this.currentCapital,
                netResult: 0,
                roi: 0,
                drawdown: this.getCurrentDrawdown()
            };
        }
        
        this.currentCapital += netResult;
        
        // 資金がNaNになった場合の修正
        if (isNaN(this.currentCapital)) {
            console.error('❌ Phase 6現在資金がNaNになりました。初期値に修正');
            this.currentCapital = 100000;
            this.capitalPeak = 100000;
        }
        
        // 最高資金更新
        if (this.currentCapital > this.capitalPeak) {
            this.capitalPeak = this.currentCapital;
        }

        // パフォーマンス履歴に記録
        this.performanceHistory.push({
            date: new Date().toISOString(),
            previousCapital: previousCapital,
            currentCapital: this.currentCapital,
            investment: totalInvestment,
            return: totalReturn,
            netResult: netResult,
            roi: totalInvestment > 0 ? (totalReturn / totalInvestment - 1) * 100 : 0,
            drawdown: this.getCurrentDrawdown()
        });

        // 履歴を最新100件に制限
        if (this.performanceHistory.length > 100) {
            this.performanceHistory = this.performanceHistory.slice(-100);
        }

        this.savePerformanceHistory();

        console.log('💼 資金状況更新:', {
            previousCapital: previousCapital,
            currentCapital: this.currentCapital,
            netResult: netResult,
            totalInvestment: totalInvestment,
            totalReturn: totalReturn,
            drawdown: this.getCurrentDrawdown().toFixed(3)
        });

        return {
            previousCapital: previousCapital,
            currentCapital: this.currentCapital,
            netResult: netResult,
            roi: totalInvestment > 0 ? ((totalReturn / totalInvestment - 1) * 100) : 0,
            drawdown: this.getCurrentDrawdown()
        };
    }

    /**
     * 現在のドローダウン計算
     */
    getCurrentDrawdown() {
        if (this.capitalPeak <= 0) return 0;
        return Math.max(0, (this.capitalPeak - this.currentCapital) / this.capitalPeak);
    }

    /**
     * リスクレベル動的調整
     */
    adjustRiskLevel() {
        const drawdown = this.getCurrentDrawdown();
        const recentPerformance = this.getRecentPerformance(10); // 直近10レース

        let newRiskLevel = this.riskLevel;

        // ドローダウンベースの調整
        if (drawdown > 0.15) {
            newRiskLevel = 'conservative';
        } else if (drawdown > 0.10) {
            if (this.riskLevel === 'aggressive') {
                newRiskLevel = 'moderate';
            }
        } else if (drawdown < 0.05 && recentPerformance.winRate > 0.6) {
            // 良好な成績時はリスクレベル上昇を検討
            if (this.riskLevel === 'conservative') {
                newRiskLevel = 'moderate';
            } else if (this.riskLevel === 'moderate' && recentPerformance.roi > 20) {
                newRiskLevel = 'aggressive';
            }
        }

        if (newRiskLevel !== this.riskLevel) {
            console.log('🔄 リスクレベル調整:', this.riskLevel, '->', newRiskLevel);
            this.riskLevel = newRiskLevel;
        }

        return newRiskLevel;
    }

    /**
     * 直近パフォーマンス分析
     */
    getRecentPerformance(count = 20) {
        const recentRaces = this.performanceHistory.slice(-count);
        
        if (recentRaces.length === 0) {
            return {
                totalRaces: 0,
                winRate: 0,
                averageROI: 0,
                totalReturn: 0,
                maxDrawdown: 0
            };
        }

        const wins = recentRaces.filter(race => race.netResult > 0).length;
        const totalInvestment = recentRaces.reduce((sum, race) => sum + race.investment, 0);
        const totalReturn = recentRaces.reduce((sum, race) => sum + race.return, 0);
        const maxDrawdown = Math.max(...recentRaces.map(race => race.drawdown));

        return {
            totalRaces: recentRaces.length,
            winRate: wins / recentRaces.length,
            averageROI: totalInvestment > 0 ? (totalReturn / totalInvestment - 1) * 100 : 0,
            totalReturn: totalReturn,
            maxDrawdown: maxDrawdown
        };
    }

    /**
     * 投資理由生成
     */
    generateBetReasoning(kellyRatio, expectedValue, drawdown) {
        const reasons = [];

        if (kellyRatio > 0.05) {
            reasons.push('高いケリー比率');
        } else if (kellyRatio > 0.02) {
            reasons.push('適正なケリー比率');
        } else {
            reasons.push('低いケリー比率');
        }

        if (expectedValue >= 1.3) {
            reasons.push('優良な期待値');
        } else if (expectedValue >= 1.1) {
            reasons.push('良好な期待値');
        } else {
            reasons.push('限界的期待値');
        }

        if (drawdown > this.drawdownLimit * 0.8) {
            reasons.push('ドローダウン制御中');
        }

        return reasons.join('、');
    }

    /**
     * 資金管理統計レポート生成
     */
    generateCapitalReport() {
        const performance = this.getRecentPerformance(50);
        const currentDrawdown = this.getCurrentDrawdown();
        
        return {
            capitalStatus: {
                currentCapital: this.currentCapital,
                initialCapital: 100000,
                totalReturn: this.currentCapital - 100000,
                totalReturnRate: ((this.currentCapital / 100000) - 1) * 100,
                capitalPeak: this.capitalPeak,
                currentDrawdown: currentDrawdown
            },
            riskManagement: {
                riskLevel: this.riskLevel,
                maxBetRatio: this.maxBetRatio,
                drawdownLimit: this.drawdownLimit,
                isDrawdownControlActive: currentDrawdown > this.drawdownLimit * 0.8
            },
            recentPerformance: performance,
            recommendations: this.generateCapitalRecommendations(performance, currentDrawdown)
        };
    }

    /**
     * 資金管理推奨事項生成
     */
    generateCapitalRecommendations(performance, drawdown) {
        const recommendations = [];

        if (drawdown > this.drawdownLimit * 0.9) {
            recommendations.push('⚠️ 重要: ドローダウン限界接近、投資額削減推奨');
        } else if (drawdown > this.drawdownLimit * 0.7) {
            recommendations.push('⚠️ 注意: ドローダウン上昇、慎重な投資推奨');
        }

        if (performance.totalRaces >= 10) {
            if (performance.winRate < 0.3) {
                recommendations.push('📉 勝率低下中、戦略見直しを検討');
            } else if (performance.averageROI < -10) {
                recommendations.push('📉 ROI低下中、リスクレベル下げを検討');
            } else if (performance.winRate > 0.7 && performance.averageROI > 20) {
                recommendations.push('📈 好調継続中、現在の戦略を維持');
            }
        }

        if (this.currentCapital > this.capitalPeak * 1.1) {
            recommendations.push('🎯 新高値更新、利益確定を検討');
        }

        return recommendations;
    }

    /**
     * データ永続化
     */
    savePerformanceHistory() {
        try {
            const data = {
                currentCapital: this.currentCapital,
                capitalPeak: this.capitalPeak,
                riskLevel: this.riskLevel,
                performanceHistory: this.performanceHistory,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('kelly_capital_data', JSON.stringify(data));
        } catch (error) {
            console.error('資金管理データの保存に失敗:', error);
        }
    }

    loadPerformanceHistory() {
        try {
            const saved = localStorage.getItem('kelly_capital_data');
            if (saved) {
                const data = JSON.parse(saved);
                this.currentCapital = data.currentCapital || 100000;
                this.capitalPeak = data.capitalPeak || this.currentCapital;
                this.riskLevel = data.riskLevel || 'moderate';
                return data.performanceHistory || [];
            }
        } catch (error) {
            console.warn('資金管理データの読み込みに失敗:', error);
        }
        return [];
    }

    /**
     * システムリセット
     */
    resetCapitalData() {
        this.currentCapital = 100000;
        this.capitalPeak = 100000;
        this.riskLevel = 'moderate';
        this.performanceHistory = [];
        localStorage.removeItem('kelly_capital_data');
        console.log('✅ 資金管理データがリセットされました');
    }
}

// グローバル変数として公開
window.KellyCapitalManager = KellyCapitalManager;

// デバッグ用グローバル関数
window.checkKellyCapital = () => {
    const manager = new KellyCapitalManager();
    console.log('💰 資金管理状況:', manager.generateCapitalReport());
    return manager.generateCapitalReport();
};

window.simulateKellyBet = (winProb, odds, expectedValue = null) => {
    const manager = new KellyCapitalManager();
    const ev = expectedValue || (winProb * odds);
    const result = manager.calculateOptimalBetAmount(ev, winProb, odds, 0.8);
    console.log('🎯 ケリー投資シミュレーション:', result);
    return result;
};

/**
 * Phase 6パフォーマンス統計表示関数
 */
window.showPhase6PerformanceStats = () => {
    try {
        const manager = new KellyCapitalManager();
        const report = manager.generateCapitalReport();
        
        let display = `
=== 🏆 Phase 6: ケリー資金管理パフォーマンス ===

💰 資金状況:
  現在資金: ${report.capitalStatus.currentCapital.toLocaleString()}円
  初期資金: ${report.capitalStatus.initialCapital.toLocaleString()}円  
  総収益: ${report.capitalStatus.totalReturn >= 0 ? '+' : ''}${report.capitalStatus.totalReturn.toLocaleString()}円
  収益率: ${report.capitalStatus.totalReturnRate >= 0 ? '+' : ''}${report.capitalStatus.totalReturnRate.toFixed(2)}%
  最高資金: ${report.capitalStatus.capitalPeak.toLocaleString()}円
  現在ドローダウン: ${(report.capitalStatus.currentDrawdown * 100).toFixed(2)}%

🎯 リスク管理:
  現在リスクレベル: ${report.riskManagement.riskLevel}
  最大投資比率: ${(report.riskManagement.maxBetRatio * 100)}%
  ドローダウン限界: ${(report.riskManagement.drawdownLimit * 100)}%
  ドローダウン制御: ${report.riskManagement.isDrawdownControlActive ? '🔴 発動中' : '🟢 正常'}

📊 直近パフォーマンス(最大50レース):
  総レース数: ${report.recentPerformance.totalRaces}
  勝率: ${(report.recentPerformance.winRate * 100).toFixed(1)}%
  平均ROI: ${report.recentPerformance.averageROI >= 0 ? '+' : ''}${report.recentPerformance.averageROI.toFixed(2)}%
  最大ドローダウン: ${(report.recentPerformance.maxDrawdown * 100).toFixed(2)}%

💡 推奨事項:`;

        if (report.recommendations.length > 0) {
            report.recommendations.forEach(rec => {
                display += `\n  ${rec}`;
            });
        } else {
            display += '\n  🟢 現在の運用方針を継続';
        }

        display += `\n\n📈 ケリー基準資金管理システムは正常に動作中`;
        
        alert(display);
        
        console.log('✅ Phase 6パフォーマンス統計:', report);
        
    } catch (error) {
        console.error('❌ Phase 6パフォーマンス表示エラー:', error);
        alert('Phase 6パフォーマンス統計の表示でエラーが発生しました: ' + error.message);
    }
};