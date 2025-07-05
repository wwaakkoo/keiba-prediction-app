// 投資効率計算システム
class InvestmentEfficiencyCalculator {
    
    // 投資効率計算の基本設定
    static calculationConfig = {
        riskFreeRate: 0.001,        // リスクフリーレート（0.1%、普通預金金利）
        targetROI: 15,              // 目標ROI（15%）
        maxAcceptableLoss: 20,      // 許容最大損失率（20%）
        minimumExpectedValue: 1.05, // 最低期待値（1.05倍）
        preferredOddsRange: {       // 推奨オッズ帯
            min: 3.0,
            max: 25.0
        }
    };
    
    /**
     * 単発賭けの投資効率計算
     * @param {Object} betData - 賭けデータ
     * @param {number} betData.odds - オッズ
     * @param {number} betData.winProbability - 勝率予測（0-1）
     * @param {number} betData.betAmount - 賭け金
     * @param {number} betData.confidence - 予測信頼度（0-1）
     * @param {number} betData.popularity - 人気順（オプション）
     * @returns {Object} 投資効率分析結果
     */
    static calculateSingleBetEfficiency(betData) {
        console.log('=== 単発賭け投資効率計算 ===');
        console.log('入力データ:', betData);
        
        const { odds, winProbability, betAmount, confidence = 0.5, popularity } = betData;
        
        // 基本計算
        const expectedValue = this.calculateExpectedValue(odds, winProbability);
        const theoreticalROI = (expectedValue - 1) * 100;
        const potentialReturn = odds * betAmount;
        const potentialProfit = potentialReturn - betAmount;
        
        // リスク調整
        const riskAdjustedExpectedValue = this.calculateRiskAdjustedExpectedValue(
            expectedValue, winProbability, confidence
        );
        
        // ケリー基準による最適賭け金
        const kellyFraction = this.calculateKellyFraction(odds, winProbability);
        const recommendedBetAmount = Math.max(0, kellyFraction * betAmount * 10); // 仮想資金を10倍とする
        
        // 穴馬ボーナス計算
        const underdogBonus = this.calculateUnderdogBonus(odds, popularity);
        
        // 投資効率スコア（0-100）
        const efficiencyScore = this.calculateEfficiencyScore({
            expectedValue: riskAdjustedExpectedValue,
            odds,
            confidence,
            underdogBonus,
            winProbability
        });
        
        // 投資推奨レベル
        const recommendationLevel = this.determineRecommendationLevel(efficiencyScore, riskAdjustedExpectedValue);
        
        const result = {
            // 基本指標
            expectedValue,
            theoreticalROI,
            riskAdjustedExpectedValue,
            potentialReturn,
            potentialProfit,
            
            // リスク評価
            winProbability,
            lossProbability: 1 - winProbability,
            riskRewardRatio: potentialProfit / betAmount,
            confidence,
            
            // 最適化推奨
            kellyFraction,
            recommendedBetAmount,
            actualBetAmount: betAmount,
            betSizeRating: this.rateBetSize(betAmount, recommendedBetAmount),
            
            // 穴馬評価
            underdogBonus,
            isUnderdog: odds >= 5.0, // 穴馬判定を緩和（7.0→5.0）
            popularityScore: this.calculatePopularityScore(odds, popularity),
            
            // 総合評価
            efficiencyScore,
            recommendationLevel,
            investmentGrade: this.assignInvestmentGrade(efficiencyScore),
            
            // アラート・警告
            warnings: this.generateInvestmentWarnings(betData, {
                expectedValue: riskAdjustedExpectedValue,
                efficiencyScore
            }),
            
            // 戦略的評価
            strategicValue: this.evaluateStrategicValue(betData, efficiencyScore),
            
            // 計算メタデータ
            calculatedAt: new Date().toISOString(),
            calculationVersion: '1.0'
        };
        
        console.log('投資効率計算結果:', result);
        return result;
    }
    
    /**
     * 期待値計算
     * @param {number} odds - オッズ
     * @param {number} winProbability - 勝率
     * @returns {number} 期待値
     */
    static calculateExpectedValue(odds, winProbability) {
        return (odds * winProbability) + (0 * (1 - winProbability));
    }
    
    /**
     * リスク調整済み期待値計算
     * @param {number} expectedValue - 基本期待値
     * @param {number} winProbability - 勝率
     * @param {number} confidence - 信頼度
     * @returns {number} リスク調整済み期待値
     */
    static calculateRiskAdjustedExpectedValue(expectedValue, winProbability, confidence) {
        // 信頼度による調整
        const confidenceAdjustment = 0.5 + (confidence * 0.5);
        
        // 勝率の不確実性による調整
        const uncertaintyPenalty = Math.abs(winProbability - 0.5) * 0.1; // 極端な勝率への軽微なペナルティ
        
        // ボラティリティ調整
        const volatilityPenalty = (1 - winProbability) * winProbability * 0.2; // 分散による調整
        
        return expectedValue * confidenceAdjustment * (1 - uncertaintyPenalty) * (1 - volatilityPenalty);
    }
    
    /**
     * ケリー基準計算
     * @param {number} odds - オッズ
     * @param {number} winProbability - 勝率
     * @returns {number} ケリー基準（最適賭け割合）
     */
    static calculateKellyFraction(odds, winProbability) {
        const b = odds - 1; // ネットオッズ
        const p = winProbability;
        const q = 1 - winProbability;
        
        const kellyFraction = (b * p - q) / b;
        
        // 負の値（不利な賭け）の場合は0
        // 過度に大きい値（25%以上）は制限
        return Math.max(0, Math.min(0.25, kellyFraction));
    }
    
    /**
     * 穴馬ボーナス計算
     * @param {number} odds - オッズ
     * @param {number} popularity - 人気順
     * @returns {number} 穴馬ボーナス（0-20）
     */
    static calculateUnderdogBonus(odds, popularity) {
        let bonus = 0;
        
        // オッズによるボーナス
        if (odds >= 50) bonus += 20;
        else if (odds >= 25) bonus += 15;
        else if (odds >= 15) bonus += 10;
        else if (odds >= 10) bonus += 5;
        else if (odds >= 7) bonus += 2;
        
        // 人気による追加ボーナス
        if (popularity) {
            if (popularity >= 15) bonus += 5;
            else if (popularity >= 12) bonus += 3;
            else if (popularity >= 10) bonus += 1;
        }
        
        return Math.min(20, bonus);
    }
    
    /**
     * 人気スコア計算
     * @param {number} odds - オッズ
     * @param {number} popularity - 人気順
     * @returns {Object} 人気分析結果
     */
    static calculatePopularityScore(odds, popularity) {
        const estimatedPopularity = popularity || this.estimatePopularityFromOdds(odds);
        
        let category, multiplier, risk;
        
        if (estimatedPopularity <= 3) {
            category = '人気馬';
            multiplier = 0.7; // 効率悪い
            risk = 'Low';
        } else if (estimatedPopularity <= 6) {
            category = '中人気';
            multiplier = 0.9;
            risk = 'Medium';
        } else if (estimatedPopularity <= 10) {
            category = '穴馬';
            multiplier = 1.2; // 効率良い
            risk = 'High';
        } else {
            category = '大穴';
            multiplier = 1.5; // 最も効率良い
            risk = 'Very High';
        }
        
        return {
            estimatedPopularity,
            category,
            efficiencyMultiplier: multiplier,
            riskLevel: risk,
            recommendedForUnderdog: estimatedPopularity >= 7
        };
    }
    
    /**
     * 投資効率スコア計算（0-100）
     * @param {Object} factors - 効率要因
     * @returns {number} 効率スコア
     */
    static calculateEfficiencyScore(factors) {
        const { expectedValue, odds, confidence, underdogBonus, winProbability } = factors;
        
        // ベーススコア（期待値ベース）
        let baseScore = Math.max(0, (expectedValue - 1) * 50); // 期待値1.0で0点、2.0で50点
        
        // 信頼度調整
        const confidenceBonus = confidence * 20; // 最大20点
        
        // オッズ帯ボーナス（推奨範囲での追加点）
        let oddsBonus = 0;
        if (odds >= this.calculationConfig.preferredOddsRange.min && 
            odds <= this.calculationConfig.preferredOddsRange.max) {
            oddsBonus = 10;
        }
        
        // 勝率バランスボーナス（極端すぎない勝率への評価）
        const winRateBalance = 1 - Math.abs(winProbability - 0.15); // 理想的な穴馬勝率15%付近
        const balanceBonus = Math.max(0, winRateBalance * 10);
        
        // 穴馬ボーナス（既に計算済み）
        
        // 総合スコア計算
        const totalScore = baseScore + confidenceBonus + oddsBonus + balanceBonus + underdogBonus;
        
        return Math.min(100, Math.max(0, totalScore));
    }
    
    /**
     * 推奨レベル決定
     * @param {number} efficiencyScore - 効率スコア
     * @param {number} expectedValue - 期待値
     * @returns {string} 推奨レベル
     */
    static determineRecommendationLevel(efficiencyScore, expectedValue) {
        if (expectedValue < this.calculationConfig.minimumExpectedValue) {
            return 'AVOID'; // 避けるべき
        } else if (efficiencyScore >= 80) {
            return 'HIGHLY_RECOMMENDED'; // 強く推奨
        } else if (efficiencyScore >= 60) {
            return 'RECOMMENDED'; // 推奨
        } else if (efficiencyScore >= 40) {
            return 'CONSIDER'; // 検討
        } else if (efficiencyScore >= 20) {
            return 'WEAK'; // 弱い
        } else {
            return 'NOT_RECOMMENDED'; // 非推奨
        }
    }
    
    /**
     * 投資グレード付与
     * @param {number} efficiencyScore - 効率スコア
     * @returns {string} 投資グレード
     */
    static assignInvestmentGrade(efficiencyScore) {
        if (efficiencyScore >= 90) return 'AAA';
        if (efficiencyScore >= 80) return 'AA';
        if (efficiencyScore >= 70) return 'A';
        if (efficiencyScore >= 60) return 'BBB';
        if (efficiencyScore >= 50) return 'BB';
        if (efficiencyScore >= 40) return 'B';
        if (efficiencyScore >= 30) return 'CCC';
        if (efficiencyScore >= 20) return 'CC';
        if (efficiencyScore >= 10) return 'C';
        return 'D';
    }
    
    /**
     * 賭け金サイズ評価
     * @param {number} actualAmount - 実際の賭け金
     * @param {number} recommendedAmount - 推奨賭け金
     * @returns {string} 賭け金評価
     */
    static rateBetSize(actualAmount, recommendedAmount) {
        if (recommendedAmount === 0) return 'SHOULD_AVOID';
        
        const ratio = actualAmount / recommendedAmount;
        
        if (ratio <= 0.5) return 'TOO_SMALL';
        if (ratio <= 0.8) return 'SLIGHTLY_SMALL';
        if (ratio <= 1.2) return 'OPTIMAL';
        if (ratio <= 2.0) return 'SLIGHTLY_LARGE';
        return 'TOO_LARGE';
    }
    
    /**
     * 投資警告生成
     * @param {Object} betData - 賭けデータ
     * @param {Object} results - 計算結果
     * @returns {Array} 警告リスト
     */
    static generateInvestmentWarnings(betData, results) {
        const warnings = [];
        
        // 期待値警告
        if (results.expectedValue < 1.0) {
            warnings.push({
                type: 'NEGATIVE_EXPECTED_VALUE',
                severity: 'HIGH',
                message: '期待値が1.0を下回っています。理論的に損失が予想されます。'
            });
        } else if (results.expectedValue < this.calculationConfig.minimumExpectedValue) {
            warnings.push({
                type: 'LOW_EXPECTED_VALUE',
                severity: 'MEDIUM',
                message: `期待値が最低基準（${this.calculationConfig.minimumExpectedValue}）を下回っています。`
            });
        }
        
        // 人気馬警告
        if (betData.odds < 2.0) {
            warnings.push({
                type: 'LOW_ODDS_WARNING',
                severity: 'MEDIUM',
                message: '低オッズ馬への投資です。収益性が限定的な可能性があります。'
            });
        }
        
        // 信頼度警告
        if (betData.confidence < 0.3) {
            warnings.push({
                type: 'LOW_CONFIDENCE',
                severity: 'HIGH',
                message: '予測信頼度が低いです。投資を控えることを推奨します。'
            });
        }
        
        // 効率スコア警告
        if (results.efficiencyScore < 20) {
            warnings.push({
                type: 'LOW_EFFICIENCY',
                severity: 'HIGH',
                message: '投資効率が著しく低いです。投資を見合わせることを強く推奨します。'
            });
        }
        
        return warnings;
    }
    
    /**
     * 戦略的価値評価
     * @param {Object} betData - 賭けデータ
     * @param {number} efficiencyScore - 効率スコア
     * @returns {Object} 戦略的価値分析
     */
    static evaluateStrategicValue(betData, efficiencyScore) {
        const { odds, winProbability, confidence } = betData;
        
        // 穴馬戦略への適合度
        const underdogSuitability = odds >= 7.0 ? 
            Math.min(100, (odds - 7) * 3 + efficiencyScore * 0.3) : 0;
        
        // ポートフォリオ多様化価値
        const diversificationValue = this.calculateDiversificationValue(odds);
        
        // 長期戦略価値
        const longTermValue = confidence * winProbability * (odds - 1) * 10;
        
        return {
            underdogSuitability,
            diversificationValue,
            longTermValue,
            strategicRating: this.calculateStrategicRating({
                underdogSuitability,
                diversificationValue,
                longTermValue,
                efficiencyScore
            }),
            recommendedStrategy: this.suggestOptimalStrategy(betData, efficiencyScore)
        };
    }
    
    /**
     * 分散投資価値計算
     * @param {number} odds - オッズ
     * @returns {number} 分散価値（0-100）
     */
    static calculateDiversificationValue(odds) {
        // 中程度のオッズ（5-20倍）で最高の分散価値
        if (odds >= 5 && odds <= 20) {
            return 100;
        } else if (odds >= 3 && odds <= 30) {
            return 80;
        } else if (odds >= 2 && odds <= 50) {
            return 60;
        } else {
            return 40;
        }
    }
    
    /**
     * 戦略的評価計算
     * @param {Object} factors - 戦略要因
     * @returns {string} 戦略評価
     */
    static calculateStrategicRating(factors) {
        const { underdogSuitability, diversificationValue, longTermValue, efficiencyScore } = factors;
        
        const averageScore = (underdogSuitability + diversificationValue + longTermValue + efficiencyScore) / 4;
        
        if (averageScore >= 80) return 'STRATEGIC_EXCELLENT';
        if (averageScore >= 60) return 'STRATEGIC_GOOD';
        if (averageScore >= 40) return 'STRATEGIC_FAIR';
        return 'STRATEGIC_POOR';
    }
    
    /**
     * 最適戦略提案
     * @param {Object} betData - 賭けデータ
     * @param {number} efficiencyScore - 効率スコア
     * @returns {Object} 戦略提案
     */
    static suggestOptimalStrategy(betData, efficiencyScore) {
        const { odds, winProbability } = betData;
        
        let primaryStrategy, reasoning, tacticalAdvice;
        
        if (odds >= 15 && efficiencyScore >= 60) {
            primaryStrategy = 'HIGH_REWARD_FOCUSED';
            reasoning = '高配当期待の穴馬戦略。少額多数投資で大きなリターンを狙う。';
            tacticalAdvice = '他の高効率穴馬との組み合わせで分散投資を推奨。';
        } else if (odds >= 7 && efficiencyScore >= 50) {
            primaryStrategy = 'BALANCED_UNDERDOG';
            reasoning = '中程度穴馬でのバランス戦略。リスクと報酬のバランスが良好。';
            tacticalAdvice = '複数の中穴馬への分散投資で安定した収益を狙う。';
        } else if (odds <= 5 && efficiencyScore >= 70) {
            primaryStrategy = 'HIGH_CONFIDENCE_CONSERVATIVE';
            reasoning = '高信頼度の保守戦略。確実性重視で着実な利益を狙う。';
            tacticalAdvice = '大きな投資額で確実な小利益の積み重ねを狙う。';
        } else {
            primaryStrategy = 'AVOID_OR_MINIMAL';
            reasoning = '投資効率が低く、積極的投資は推奨しない。';
            tacticalAdvice = '投資を控えるか、最小限の金額でのテスト投資に留める。';
        }
        
        return {
            primaryStrategy,
            reasoning,
            tacticalAdvice,
            expectedOutcome: this.calculateExpectedOutcome(betData, primaryStrategy)
        };
    }
    
    /**
     * 期待結果計算
     * @param {Object} betData - 賭けデータ
     * @param {string} strategy - 戦略
     * @returns {Object} 期待結果
     */
    static calculateExpectedOutcome(betData, strategy) {
        const { odds, winProbability, betAmount } = betData;
        
        let expectedReturn = odds * winProbability * betAmount;
        let riskLevel, timeframe;
        
        switch (strategy) {
            case 'HIGH_REWARD_FOCUSED':
                riskLevel = 'HIGH';
                timeframe = 'LONG_TERM';
                break;
            case 'BALANCED_UNDERDOG':
                riskLevel = 'MEDIUM';
                timeframe = 'MEDIUM_TERM';
                break;
            case 'HIGH_CONFIDENCE_CONSERVATIVE':
                riskLevel = 'LOW';
                timeframe = 'SHORT_TERM';
                break;
            default:
                riskLevel = 'AVOID';
                timeframe = 'N/A';
                expectedReturn = 0;
        }
        
        return {
            expectedReturn: Math.round(expectedReturn),
            riskLevel,
            timeframe,
            confidenceLevel: this.mapConfidenceLevel(winProbability)
        };
    }
    
    /**
     * 複数賭けのポートフォリオ分析
     * @param {Array} betDataArray - 複数の賭けデータ
     * @returns {Object} ポートフォリオ分析結果
     */
    static analyzePortfolio(betDataArray) {
        console.log('=== ポートフォリオ分析開始 ===');
        
        if (!betDataArray || betDataArray.length === 0) {
            return { error: 'ポートフォリオデータが空です' };
        }
        
        const portfolioResults = betDataArray.map(bet => this.calculateSingleBetEfficiency(bet));
        
        // ポートフォリオ統計
        const totalInvestment = betDataArray.reduce((sum, bet) => sum + bet.betAmount, 0);
        const totalExpectedReturn = portfolioResults.reduce((sum, result) => 
            sum + (result.expectedValue * result.actualBetAmount), 0);
        
        const portfolioExpectedValue = totalExpectedReturn / totalInvestment;
        const averageEfficiencyScore = portfolioResults.reduce((sum, result) => 
            sum + result.efficiencyScore, 0) / portfolioResults.length;
        
        // リスク分散度
        const diversificationScore = this.calculatePortfolioDiversification(betDataArray);
        
        // ポートフォリオグレード
        const portfolioGrade = this.calculatePortfolioGrade({
            expectedValue: portfolioExpectedValue,
            efficiencyScore: averageEfficiencyScore,
            diversificationScore
        });
        
        return {
            summary: {
                totalBets: betDataArray.length,
                totalInvestment,
                portfolioExpectedValue,
                expectedROI: (portfolioExpectedValue - 1) * 100,
                averageEfficiencyScore,
                portfolioGrade
            },
            diversification: {
                diversificationScore,
                riskDistribution: this.analyzeRiskDistribution(portfolioResults),
                oddsDistribution: this.analyzeOddsDistribution(betDataArray)
            },
            recommendations: {
                portfolioOptimization: this.generatePortfolioOptimization(portfolioResults),
                riskManagement: this.generateRiskManagementAdvice(portfolioResults),
                rebalancingAdvice: this.generateRebalancingAdvice(betDataArray, portfolioResults)
            },
            detailedResults: portfolioResults
        };
    }
    
    // ヘルパー関数群
    static estimatePopularityFromOdds(odds) {
        if (odds < 2.0) return 1;
        if (odds < 3.0) return 2;
        if (odds < 5.0) return 3;
        if (odds < 7.0) return 4;
        if (odds < 10.0) return 6;
        if (odds < 15.0) return 8;
        if (odds < 25.0) return 11;
        return 15;
    }
    
    static mapConfidenceLevel(winProbability) {
        if (winProbability >= 0.5) return 'HIGH';
        if (winProbability >= 0.3) return 'MEDIUM';
        if (winProbability >= 0.1) return 'LOW';
        return 'VERY_LOW';
    }
    
    static calculatePortfolioDiversification(betDataArray) {
        const oddsRanges = betDataArray.map(bet => this.getOddsRange(bet.odds));
        const uniqueRanges = [...new Set(oddsRanges)];
        return Math.min(100, (uniqueRanges.length / 6) * 100); // 6つのオッズ帯での分散度
    }
    
    static getOddsRange(odds) {
        if (odds < 2) return 'ULTRA_LOW';
        if (odds < 5) return 'LOW';
        if (odds < 10) return 'MEDIUM';
        if (odds < 20) return 'HIGH';
        if (odds < 50) return 'VERY_HIGH';
        return 'EXTREME';
    }
    
    static calculatePortfolioGrade(factors) {
        const { expectedValue, efficiencyScore, diversificationScore } = factors;
        
        const compositeScore = (
            (expectedValue - 1) * 30 +
            efficiencyScore * 0.5 +
            diversificationScore * 0.2
        );
        
        if (compositeScore >= 80) return 'EXCELLENT';
        if (compositeScore >= 60) return 'GOOD';
        if (compositeScore >= 40) return 'FAIR';
        if (compositeScore >= 20) return 'POOR';
        return 'VERY_POOR';
    }
    
    // 外部アクセス用メソッド
    static getCalculationConfig() {
        return this.calculationConfig;
    }
    
    static updateCalculationConfig(newConfig) {
        this.calculationConfig = { ...this.calculationConfig, ...newConfig };
        console.log('投資効率計算設定を更新:', this.calculationConfig);
    }
}

// グローバル公開
window.InvestmentEfficiencyCalculator = InvestmentEfficiencyCalculator;