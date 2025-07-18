// ケリー基準統合資金管理システム
class KellyBettingSystem {
    
    // ケリー基準設定
    static kellyConfig = {
        // 基本設定
        maxKellyFraction: 0.25,     // 最大ケリー比率25%（安全のため）
        minBetAmount: 1000,         // 最小賭け金1,000円
        maxBetAmount: 50000,        // 最大賭け金50,000円
        
        // リスク調整係数
        riskAdjustment: {
            conservative: 0.5,       // 保守的：50%割引
            moderate: 0.75,          // 中庸的：25%割引
            aggressive: 1.0          // 積極的：調整なし
        },
        
        // 券種別調整係数
        betTypeAdjustment: {
            win: 1.0,               // 単勝：標準
            place: 0.8,             // 複勝：20%割引（低リスク）
            exacta: 1.2,            // 馬連：20%増（中リスク）
            trifecta: 1.5,          // 3連複：50%増（高リスク）
            superfecta: 2.0         // 3連単：100%増（超高リスク）
        },
        
        // 分散投資制約
        diversificationConstraints: {
            maxHorsesPerRace: 5,     // 1レース最大5頭
            maxConcurrentBets: 3,    // 同時賭け最大3レース
            minDiversificationRatio: 0.3  // 最低分散比率30%
        }
    };
    
    // 現在の設定
    static currentRiskLevel = 'moderate';
    static bankroll = 100000;  // 総資金
    
    // ケリー基準による最適賭け金計算
    static calculateOptimalBetSize(horse, availableBankroll = this.bankroll) {
        console.log(`💰 ${horse.name}のケリー基準最適賭け金計算`);
        
        // 1. 勝率推定
        const winProbability = this.estimateWinProbability(horse);
        
        // 2. オッズから期待配当計算
        const odds = parseFloat(horse.odds) || 5.0;
        const netOdds = odds - 1; // 純利益倍率
        
        // 3. ケリー比率計算
        const kellyFraction = this.calculateKellyFraction(winProbability, netOdds);
        
        // 4. リスク調整
        const adjustedKellyFraction = this.applyRiskAdjustment(kellyFraction, horse);
        
        // 5. 実際の賭け金計算
        const optimalBetSize = this.calculateActualBetSize(
            adjustedKellyFraction, 
            availableBankroll, 
            horse
        );
        
        const result = {
            horse: horse.name,
            winProbability: winProbability,
            odds: odds,
            kellyFraction: kellyFraction,
            adjustedKellyFraction: adjustedKellyFraction,
            optimalBetSize: optimalBetSize,
            expectedValue: (winProbability * odds - 1),
            expectedGrowthRate: this.calculateExpectedGrowthRate(
                adjustedKellyFraction, 
                winProbability, 
                netOdds
            )
        };
        
        console.log(`📊 計算結果:`, {
            勝率: `${(winProbability * 100).toFixed(1)}%`,
            ケリー比率: `${(kellyFraction * 100).toFixed(1)}%`,
            調整後比率: `${(adjustedKellyFraction * 100).toFixed(1)}%`,
            最適賭け金: optimalBetSize.toLocaleString() + '円'
        });
        
        return result;
    }
    
    // ケリー比率の基本計算
    static calculateKellyFraction(winProbability, netOdds) {
        // ケリー公式: f* = (bp - q) / b
        // f*: 最適賭け比率, b: net odds, p: 勝率, q: 負け率(1-p)
        
        const lossProbability = 1 - winProbability;
        const kellyFraction = (netOdds * winProbability - lossProbability) / netOdds;
        
        // 負の値の場合は賭けない（期待値マイナス）
        return Math.max(0, kellyFraction);
    }
    
    // 勝率推定（複数要素統合）
    static estimateWinProbability(horse) {
        let baseProbability = 0.1; // 基本勝率10%
        
        // 1. 信頼度スコアベース調整
        if (horse.reliability) {
            const reliabilityBonus = horse.reliability.total * 0.2; // 最大20%追加
            baseProbability += reliabilityBonus;
        }
        
        // 2. 予測エンジンの勝率
        if (horse.winProbability) {
            const engineProbability = horse.winProbability / 100;
            baseProbability = (baseProbability + engineProbability) / 2;
        }
        
        // 3. オッズ逆算確率（市場の評価）
        const odds = parseFloat(horse.odds) || 5.0;
        const marketProbability = 1 / odds;
        
        // 4. 複勝確率への調整（実際の賭け対象に合わせて）
        const placeProbabilityMultiplier = 3.0; // 複勝は単勝の約3倍の確率
        const adjustedMarketProb = Math.min(0.5, marketProbability * placeProbabilityMultiplier);
        
        // 5. 重み付き平均
        const finalProbability = (
            baseProbability * 0.4 +
            adjustedMarketProb * 0.6
        );
        
        // 6. 安全マージン適用（5%-45%範囲）
        return Math.min(0.45, Math.max(0.05, finalProbability));
    }
    
    // リスク調整適用
    static applyRiskAdjustment(kellyFraction, horse) {
        // 1. リスクレベル調整
        const riskMultiplier = this.kellyConfig.riskAdjustment[this.currentRiskLevel];
        let adjustedFraction = kellyFraction * riskMultiplier;
        
        // 2. 最大ケリー比率制限
        adjustedFraction = Math.min(adjustedFraction, this.kellyConfig.maxKellyFraction);
        
        // 3. 馬の安定性調整
        if (horse.reliability?.stability) {
            const stabilityBonus = horse.reliability.stability * 0.2;
            adjustedFraction *= (1 + stabilityBonus);
        }
        
        // 4. 券種別調整（複勝想定）
        const betTypeMultiplier = this.kellyConfig.betTypeAdjustment.place;
        adjustedFraction *= betTypeMultiplier;
        
        return Math.max(0, adjustedFraction);
    }
    
    // 実際の賭け金計算
    static calculateActualBetSize(adjustedKellyFraction, availableBankroll, horse) {
        // 1. 基本賭け金計算
        let betSize = adjustedKellyFraction * availableBankroll;
        
        // 2. 最小・最大制限適用
        betSize = Math.max(this.kellyConfig.minBetAmount, betSize);
        betSize = Math.min(this.kellyConfig.maxBetAmount, betSize);
        
        // 3. 利用可能資金制限
        betSize = Math.min(betSize, availableBankroll * 0.8); // 最大80%まで
        
        // 4. 1,000円単位に調整
        betSize = Math.floor(betSize / 1000) * 1000;
        
        return betSize;
    }
    
    // 期待成長率計算
    static calculateExpectedGrowthRate(fraction, winProb, netOdds) {
        // ケリー基準の対数期待効用（期待成長率）
        const lossProb = 1 - winProb;
        
        if (fraction <= 0) return 0;
        
        const expectedGrowth = 
            winProb * Math.log(1 + fraction * netOdds) +
            lossProb * Math.log(1 - fraction);
            
        return expectedGrowth;
    }
    
    // 複数馬への最適資金配分
    static calculateOptimalPortfolioBetting(horses, totalBankroll = this.bankroll) {
        console.log('🎯 複数馬への最適資金配分計算開始');
        
        // 1. 各馬の個別ケリー計算
        const individualKellyResults = horses.map(horse => 
            this.calculateOptimalBetSize(horse, totalBankroll)
        );
        
        // 2. 分散投資制約チェック
        const feasibleBets = this.applyDiversificationConstraints(individualKellyResults);
        
        // 3. 資金制約下での最適化
        const optimizedPortfolio = this.optimizePortfolioBets(feasibleBets, totalBankroll);
        
        // 4. 最終結果生成
        const portfolioResult = {
            totalBets: optimizedPortfolio.length,
            totalInvestment: optimizedPortfolio.reduce((sum, bet) => sum + bet.finalBetSize, 0),
            expectedPortfolioGrowth: this.calculatePortfolioGrowthRate(optimizedPortfolio),
            capitalUtilization: 0,
            bets: optimizedPortfolio
        };
        
        portfolioResult.capitalUtilization = portfolioResult.totalInvestment / totalBankroll;
        
        console.log('📊 ポートフォリオ最適化完了:', {
            賭け対象数: portfolioResult.totalBets,
            総投資額: portfolioResult.totalInvestment.toLocaleString() + '円',
            資金使用率: `${(portfolioResult.capitalUtilization * 100).toFixed(1)}%`,
            期待成長率: `${(portfolioResult.expectedPortfolioGrowth * 100).toFixed(2)}%`
        });
        
        return portfolioResult;
    }
    
    // 分散投資制約適用
    static applyDiversificationConstraints(kellyResults) {
        const constraints = this.kellyConfig.diversificationConstraints;
        
        // 1. 期待値でソート（高い順）
        const sortedBets = kellyResults
            .filter(result => result.expectedValue > 0) // 期待値プラスのみ
            .sort((a, b) => b.expectedValue - a.expectedValue);
        
        // 2. 最大馬数制限
        const feasibleBets = sortedBets.slice(0, constraints.maxHorsesPerRace);
        
        // 3. 最低分散比率チェック
        if (feasibleBets.length > 1) {
            const totalKelly = feasibleBets.reduce((sum, bet) => sum + bet.adjustedKellyFraction, 0);
            const maxSingleKelly = Math.max(...feasibleBets.map(bet => bet.adjustedKellyFraction));
            
            const concentrationRatio = maxSingleKelly / totalKelly;
            if (concentrationRatio > (1 - constraints.minDiversificationRatio)) {
                // 分散投資の最低基準を満たすよう調整
                this.adjustForDiversification(feasibleBets, constraints.minDiversificationRatio);
            }
        }
        
        return feasibleBets;
    }
    
    // 分散投資調整
    static adjustForDiversification(bets, minDiversificationRatio) {
        const n = bets.length;
        const targetMaxWeight = 1 - minDiversificationRatio;
        
        bets.forEach(bet => {
            const currentWeight = bet.adjustedKellyFraction;
            if (currentWeight > targetMaxWeight) {
                bet.adjustedKellyFraction = targetMaxWeight;
                bet.diversificationAdjusted = true;
            }
        });
    }
    
    // ポートフォリオ賭け最適化
    static optimizePortfolioBets(feasibleBets, totalBankroll) {
        // 1. 総ケリー比率計算
        const totalKellyFraction = feasibleBets.reduce((sum, bet) => sum + bet.adjustedKellyFraction, 0);
        
        // 2. 利用可能資金計算
        const maxUtilization = 0.8; // 最大80%使用
        const availableFunds = totalBankroll * Math.min(maxUtilization, totalKellyFraction);
        
        // 3. 比例配分で最終賭け金決定
        const optimizedBets = feasibleBets.map(bet => {
            const proportionalBetSize = (bet.adjustedKellyFraction / totalKellyFraction) * availableFunds;
            
            // 最小・最大制限適用
            let finalBetSize = Math.max(this.kellyConfig.minBetAmount, proportionalBetSize);
            finalBetSize = Math.min(this.kellyConfig.maxBetAmount, finalBetSize);
            finalBetSize = Math.floor(finalBetSize / 1000) * 1000; // 1,000円単位調整
            
            return {
                ...bet,
                proportionalBetSize: proportionalBetSize,
                finalBetSize: finalBetSize,
                portfolioWeight: bet.adjustedKellyFraction / totalKellyFraction,
                bettingReason: this.generateBettingReason(bet)
            };
        }).filter(bet => bet.finalBetSize >= this.kellyConfig.minBetAmount);
        
        return optimizedBets;
    }
    
    // ポートフォリオ成長率計算
    static calculatePortfolioGrowthRate(optimizedBets) {
        if (optimizedBets.length === 0) return 0;
        
        // 各賭けの成長率の重み付き平均
        const totalInvestment = optimizedBets.reduce((sum, bet) => sum + bet.finalBetSize, 0);
        
        return optimizedBets.reduce((sum, bet) => {
            const weight = bet.finalBetSize / totalInvestment;
            return sum + weight * bet.expectedGrowthRate;
        }, 0);
    }
    
    // 賭け理由生成
    static generateBettingReason(bet) {
        const reasons = [];
        
        if (bet.expectedValue > 0.2) {
            reasons.push('高期待値');
        }
        if (bet.winProbability > 0.25) {
            reasons.push('高勝率');
        }
        if (bet.adjustedKellyFraction > 0.1) {
            reasons.push('ケリー推奨');
        }
        if (bet.diversificationAdjusted) {
            reasons.push('分散調整');
        }
        
        return reasons.length > 0 ? reasons.join('・') : 'ケリー基準';
    }
    
    // 資金管理実績分析
    static analyzeBettingPerformance(bettingHistory) {
        if (bettingHistory.length === 0) return null;
        
        const analysis = {
            totalBets: bettingHistory.length,
            totalInvested: 0,
            totalReturned: 0,
            winRate: 0,
            actualGrowthRate: 0,
            kellyEfficiency: 0,
            recommendations: []
        };
        
        // 実績計算
        let wins = 0;
        bettingHistory.forEach(bet => {
            analysis.totalInvested += bet.betAmount;
            analysis.totalReturned += bet.returnAmount || 0;
            if (bet.isWin) wins++;
        });
        
        analysis.winRate = wins / analysis.totalBets;
        analysis.actualGrowthRate = (analysis.totalReturned - analysis.totalInvested) / analysis.totalInvested;
        
        // ケリー効率性計算（実際の成長率 / 理論最適成長率）
        const theoreticalOptimal = this.calculateTheoreticalOptimalGrowth(bettingHistory);
        analysis.kellyEfficiency = theoreticalOptimal > 0 ? analysis.actualGrowthRate / theoreticalOptimal : 0;
        
        // 改善提案生成
        analysis.recommendations = this.generatePerformanceRecommendations(analysis);
        
        return analysis;
    }
    
    // 理論最適成長率計算
    static calculateTheoreticalOptimalGrowth(bettingHistory) {
        return bettingHistory.reduce((sum, bet) => {
            const theoreticalKelly = this.calculateKellyFraction(bet.actualWinProb || 0.1, bet.netOdds || 1);
            const theoreticalGrowth = this.calculateExpectedGrowthRate(
                theoreticalKelly, 
                bet.actualWinProb || 0.1, 
                bet.netOdds || 1
            );
            return sum + theoreticalGrowth;
        }, 0) / bettingHistory.length;
    }
    
    // パフォーマンス改善提案
    static generatePerformanceRecommendations(analysis) {
        const recommendations = [];
        
        if (analysis.winRate < 0.2) {
            recommendations.push('勝率向上: より保守的な馬選択を推奨');
        }
        if (analysis.kellyEfficiency < 0.7) {
            recommendations.push('賭け金最適化: ケリー基準により忠実な投資を推奨');
        }
        if (analysis.actualGrowthRate < -0.1) {
            recommendations.push('リスク削減: より保守的なリスクレベルに変更を推奨');
        }
        
        return recommendations;
    }
    
    // 設定変更
    static setRiskLevel(level) {
        if (this.kellyConfig.riskAdjustment[level]) {
            this.currentRiskLevel = level;
            this.saveConfiguration();
            return true;
        }
        return false;
    }
    
    static setBankroll(amount) {
        if (amount > 0) {
            this.bankroll = amount;
            this.saveConfiguration();
            return true;
        }
        return false;
    }
    
    // 設定保存・読み込み
    static saveConfiguration() {
        try {
            localStorage.setItem('kellyBettingConfig', JSON.stringify({
                riskLevel: this.currentRiskLevel,
                bankroll: this.bankroll,
                lastUpdated: new Date().toISOString()
            }));
        } catch (error) {
            console.error('ケリー基準設定保存エラー:', error);
        }
    }
    
    static loadConfiguration() {
        try {
            const saved = localStorage.getItem('kellyBettingConfig');
            if (saved) {
                const config = JSON.parse(saved);
                this.currentRiskLevel = config.riskLevel || 'moderate';
                this.bankroll = config.bankroll || 100000;
            }
        } catch (error) {
            console.error('ケリー基準設定読み込みエラー:', error);
        }
    }
    
    // 初期化
    static initialize() {
        this.loadConfiguration();
        console.log('💰 ケリー基準統合資金管理システム初期化完了:', {
            リスクレベル: this.currentRiskLevel,
            総資金: this.bankroll.toLocaleString() + '円',
            最大ケリー比率: `${(this.kellyConfig.maxKellyFraction * 100).toFixed(0)}%`
        });
    }
}

// グローバル公開
window.KellyBettingSystem = KellyBettingSystem;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    KellyBettingSystem.initialize();
});