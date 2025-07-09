// リスク管理ベース投資配分システム
class RiskManagementInvestmentSystem {
    
    // 投資配分設定
    static investmentConfig = {
        // リスク許容度設定
        riskTolerance: {
            conservative: {         // 保守的
                maxRiskPerBet: 0.02,       // 1レースあたり最大2%リスク
                maxPortfolioRisk: 0.15,    // ポートフォリオ最大15%リスク
                diversificationLevel: 0.8,  // 分散投資レベル80%
                stopLossThreshold: 0.1     // 10%で損切り
            },
            moderate: {             // 中庸的
                maxRiskPerBet: 0.05,       // 1レースあたり最大5%リスク
                maxPortfolioRisk: 0.25,    // ポートフォリオ最大25%リスク
                diversificationLevel: 0.6,  // 分散投資レベル60%
                stopLossThreshold: 0.15    // 15%で損切り
            },
            aggressive: {           // 積極的
                maxRiskPerBet: 0.08,       // 1レースあたり最大8%リスク
                maxPortfolioRisk: 0.35,    // ポートフォリオ最大35%リスク
                diversificationLevel: 0.4,  // 分散投資レベル40%
                stopLossThreshold: 0.2     // 20%で損切り
            }
        },
        
        // 投資戦略タイプ
        investmentStrategy: {
            valueInvesting: {       // バリュー投資
                description: '低オッズ安定馬重視の保守的投資',
                oddsRange: [1.5, 5.0],
                reliabilityWeight: 0.6,
                expectedReturnTarget: 0.15
            },
            growthInvesting: {      // グロース投資
                description: '中オッズ成長馬重視のバランス投資',
                oddsRange: [3.0, 12.0],
                reliabilityWeight: 0.5,
                expectedReturnTarget: 0.25
            },
            speculative: {          // 投機的投資
                description: '高オッズ穴馬狙いの積極的投資',
                oddsRange: [8.0, 50.0],
                reliabilityWeight: 0.3,
                expectedReturnTarget: 0.4
            }
        }
    };
    
    // 現在の設定
    static currentRiskProfile = 'moderate';
    static currentStrategy = 'growthInvesting';
    static totalCapital = 100000; // 総資本（円）
    
    // ポートフォリオ理論ベース投資配分計算
    static calculateOptimalAllocation(predictions, availableCapital = this.totalCapital) {
        console.log('💰 ポートフォリオ理論ベース投資配分計算開始');
        
        const riskConfig = this.investmentConfig.riskTolerance[this.currentRiskProfile];
        const strategyConfig = this.investmentConfig.investmentStrategy[this.currentStrategy];
        
        // 1. 推奨馬の期待リターン・リスク計算
        const investmentCandidates = this.evaluateInvestmentCandidates(predictions, strategyConfig);
        
        // 2. 相関行列計算（馬間の相関性考慮）
        const correlationMatrix = this.calculateCorrelationMatrix(investmentCandidates);
        
        // 3. 最適ポートフォリオ計算（平均分散最適化）
        const optimalPortfolio = this.calculateMeanVarianceOptimization(
            investmentCandidates, 
            correlationMatrix, 
            riskConfig
        );
        
        // 4. 資金制約下での実際の投資配分
        const finalAllocation = this.applyCapitalConstraints(
            optimalPortfolio, 
            availableCapital, 
            riskConfig
        );
        
        console.log('📊 投資配分計算完了:', {
            候補馬数: investmentCandidates.length,
            総投資額: finalAllocation.totalInvestment,
            期待リターン: `${(finalAllocation.expectedReturn * 100).toFixed(1)}%`,
            ポートフォリオリスク: `${(finalAllocation.portfolioRisk * 100).toFixed(1)}%`
        });
        
        return finalAllocation;
    }
    
    // 投資候補馬評価
    static evaluateInvestmentCandidates(predictions, strategyConfig) {
        const candidates = [];
        
        predictions.forEach(horse => {
            const odds = parseFloat(horse.odds) || 5.0;
            
            // 戦略に適合する馬のみ評価
            if (odds >= strategyConfig.oddsRange[0] && odds <= strategyConfig.oddsRange[1]) {
                
                // 期待リターン計算
                const hitProbability = this.estimateHitProbability(horse);
                const expectedPayout = odds * 0.85; // 控除率15%考慮
                const expectedReturn = hitProbability * expectedPayout - 1;
                
                // リスク計算（ボラティリティ推定）
                const risk = this.estimateInvestmentRisk(horse, odds);
                
                // 信頼度スコア
                const reliabilityScore = horse.reliability?.total || 0.5;
                
                // 戦略適合度
                const strategyFit = this.calculateStrategyFit(horse, strategyConfig);
                
                // 総合投資スコア
                const investmentScore = (
                    expectedReturn * 0.3 +
                    reliabilityScore * strategyConfig.reliabilityWeight +
                    strategyFit * 0.2
                );
                
                if (investmentScore > 0.1) { // 最低投資閾値
                    candidates.push({
                        horse: horse,
                        expectedReturn: expectedReturn,
                        risk: risk,
                        hitProbability: hitProbability,
                        reliabilityScore: reliabilityScore,
                        strategyFit: strategyFit,
                        investmentScore: investmentScore,
                        odds: odds
                    });
                }
            }
        });
        
        // 投資スコア順でソート
        return candidates.sort((a, b) => b.investmentScore - a.investmentScore);
    }
    
    // 的中確率推定
    static estimateHitProbability(horse) {
        // 複数の要素から的中確率を推定
        let baseProbability = 0.1; // ベース確率10%
        
        // 信頼度ベース調整
        if (horse.reliability) {
            baseProbability *= (0.5 + horse.reliability.total);
        }
        
        // 勝率ベース調整
        if (horse.winProbability) {
            baseProbability = horse.winProbability / 100 * 0.3; // 複勝想定で30%
        }
        
        // オッズベース調整（市場の期待値反映）
        const odds = parseFloat(horse.odds) || 5.0;
        const marketProbability = 1 / odds;
        baseProbability = (baseProbability + marketProbability) / 2;
        
        return Math.min(0.5, Math.max(0.05, baseProbability)); // 5%-50%の範囲
    }
    
    // 投資リスク推定
    static estimateInvestmentRisk(horse, odds) {
        // ボラティリティ推定（標準偏差）
        let baseRisk = 0.3; // ベースリスク30%
        
        // オッズベースリスク（高オッズ = 高リスク）
        const oddsRisk = Math.min(0.8, Math.log(odds) / 4);
        
        // 安定性ベースリスク
        const stabilityRisk = horse.reliability?.stability ? 
            (1 - horse.reliability.stability) * 0.5 : 0.3;
        
        // フォームリスク（過去成績の一貫性）
        const formRisk = this.calculateFormRisk(horse);
        
        return Math.min(0.9, Math.max(0.1, 
            baseRisk * 0.3 + oddsRisk * 0.4 + stabilityRisk * 0.2 + formRisk * 0.1
        ));
    }
    
    // フォームリスク計算
    static calculateFormRisk(horse) {
        if (!horse.raceHistory || horse.raceHistory.length < 3) {
            return 0.5; // データ不足の場合のデフォルトリスク
        }
        
        const recentForm = horse.raceHistory.slice(-5);
        const positions = recentForm.map(race => parseInt(race.position) || 10);
        
        // 順位の分散を計算
        const meanPosition = positions.reduce((a, b) => a + b, 0) / positions.length;
        const variance = positions.reduce((acc, pos) => acc + Math.pow(pos - meanPosition, 2), 0) / positions.length;
        
        // 分散が高いほどリスクが高い
        return Math.min(0.8, variance / 25); // 正規化
    }
    
    // 戦略適合度計算
    static calculateStrategyFit(horse, strategyConfig) {
        const odds = parseFloat(horse.odds) || 5.0;
        
        // オッズ範囲適合度
        const midPoint = (strategyConfig.oddsRange[0] + strategyConfig.oddsRange[1]) / 2;
        const oddsDistance = Math.abs(odds - midPoint) / midPoint;
        const oddsFit = Math.max(0, 1 - oddsDistance);
        
        // 期待リターン適合度
        const hitProb = this.estimateHitProbability(horse);
        const expectedReturn = hitProb * odds * 0.85 - 1;
        const returnFit = expectedReturn >= strategyConfig.expectedReturnTarget ? 1.0 : 
                         expectedReturn >= strategyConfig.expectedReturnTarget * 0.7 ? 0.7 : 0.3;
        
        return (oddsFit * 0.6 + returnFit * 0.4);
    }
    
    // 相関行列計算
    static calculateCorrelationMatrix(candidates) {
        const n = candidates.length;
        const matrix = Array(n).fill().map(() => Array(n).fill(0));
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    matrix[i][j] = 1.0; // 自己相関は1
                } else {
                    // 簡易相関計算（オッズ帯・戦略適合度ベース）
                    const correlation = this.calculateHorseCorrelation(
                        candidates[i], 
                        candidates[j]
                    );
                    matrix[i][j] = correlation;
                }
            }
        }
        
        return matrix;
    }
    
    // 馬間相関計算
    static calculateHorseCorrelation(candidate1, candidate2) {
        // オッズ帯の近似性
        const oddsCorr = 1 - Math.abs(
            Math.log(candidate1.odds) - Math.log(candidate2.odds)
        ) / 2;
        
        // 戦略適合度の近似性
        const strategyCorr = 1 - Math.abs(
            candidate1.strategyFit - candidate2.strategyFit
        );
        
        // 信頼度の近似性
        const reliabilityCorr = 1 - Math.abs(
            candidate1.reliabilityScore - candidate2.reliabilityScore
        );
        
        // 重み付き平均
        return Math.max(0.1, Math.min(0.9, 
            oddsCorr * 0.4 + strategyCorr * 0.3 + reliabilityCorr * 0.3
        ));
    }
    
    // 平均分散最適化
    static calculateMeanVarianceOptimization(candidates, correlationMatrix, riskConfig) {
        const n = candidates.length;
        if (n === 0) return { weights: [], expectedReturn: 0, portfolioRisk: 0 };
        
        // 簡易最適化（等リスク寄与アプローチ）
        const weights = this.calculateEqualRiskContribution(candidates, correlationMatrix, riskConfig);
        
        // ポートフォリオ期待リターン計算
        const expectedReturn = weights.reduce((sum, weight, i) => 
            sum + weight * candidates[i].expectedReturn, 0
        );
        
        // ポートフォリオリスク計算
        const portfolioRisk = this.calculatePortfolioRisk(candidates, weights, correlationMatrix);
        
        return {
            weights: weights,
            expectedReturn: expectedReturn,
            portfolioRisk: portfolioRisk,
            candidates: candidates
        };
    }
    
    // 等リスク寄与計算
    static calculateEqualRiskContribution(candidates, correlationMatrix, riskConfig) {
        const n = candidates.length;
        const maxPositions = Math.min(n, Math.floor(1 / riskConfig.diversificationLevel * 10));
        
        // 上位候補に集中投資（等リスク原則）
        const weights = new Array(n).fill(0);
        const targetCandidates = candidates.slice(0, maxPositions);
        
        // リスク調整後の重み計算
        const riskAdjustedScores = targetCandidates.map((candidate, i) => {
            return candidate.investmentScore / candidate.risk;
        });
        
        const totalScore = riskAdjustedScores.reduce((a, b) => a + b, 0);
        
        targetCandidates.forEach((candidate, i) => {
            weights[i] = riskAdjustedScores[i] / totalScore;
        });
        
        return weights;
    }
    
    // ポートフォリオリスク計算
    static calculatePortfolioRisk(candidates, weights, correlationMatrix) {
        let portfolioVariance = 0;
        const n = candidates.length;
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                portfolioVariance += weights[i] * weights[j] * 
                    candidates[i].risk * candidates[j].risk * correlationMatrix[i][j];
            }
        }
        
        return Math.sqrt(portfolioVariance);
    }
    
    // 資本制約適用
    static applyCapitalConstraints(portfolio, availableCapital, riskConfig) {
        const allocation = {
            investments: [],
            totalInvestment: 0,
            expectedReturn: portfolio.expectedReturn,
            portfolioRisk: portfolio.portfolioRisk,
            capitalUtilization: 0
        };
        
        // 最大投資額制限
        const maxTotalInvestment = availableCapital * riskConfig.maxPortfolioRisk;
        let remainingCapital = Math.min(availableCapital, maxTotalInvestment);
        
        portfolio.candidates.forEach((candidate, i) => {
            const weight = portfolio.weights[i];
            if (weight > 0.001) { // 最小投資閾値
                
                // 個別投資額計算
                let investmentAmount = weight * remainingCapital;
                
                // 1レースあたり最大リスク制限
                const maxPerBetAmount = availableCapital * riskConfig.maxRiskPerBet / candidate.risk;
                investmentAmount = Math.min(investmentAmount, maxPerBetAmount);
                
                // 最小投資単位調整（500円単位に変更）
                investmentAmount = Math.floor(investmentAmount / 500) * 500;
                
                if (investmentAmount >= 500) { // 最小投資額500円に変更
                    allocation.investments.push({
                        horse: candidate.horse,
                        amount: investmentAmount,
                        weight: weight,
                        expectedReturn: candidate.expectedReturn,
                        risk: candidate.risk,
                        investmentReason: this.generateInvestmentReason(candidate)
                    });
                    
                    allocation.totalInvestment += investmentAmount;
                    remainingCapital -= investmentAmount;
                }
            }
        });
        
        allocation.capitalUtilization = allocation.totalInvestment / availableCapital;
        
        return allocation;
    }
    
    // 投資理由生成
    static generateInvestmentReason(candidate) {
        const reasons = [];
        
        if (candidate.expectedReturn > 0.2) {
            reasons.push('高期待リターン');
        }
        if (candidate.reliabilityScore > 0.7) {
            reasons.push('高信頼度');
        }
        if (candidate.strategyFit > 0.7) {
            reasons.push('戦略適合');
        }
        if (candidate.risk < 0.3) {
            reasons.push('低リスク');
        }
        
        return reasons.length > 0 ? reasons.join('・') : '投資候補';
    }
    
    // 最大ドローダウン制御
    static checkDrawdownControl(currentPerformance, allocationHistory) {
        const riskConfig = this.investmentConfig.riskTolerance[this.currentRiskProfile];
        
        if (allocationHistory.length < 5) return { action: 'continue', adjustment: 1.0 };
        
        // 直近の損失計算
        const recentROI = this.calculateRecentROI(allocationHistory.slice(-10));
        
        if (recentROI < -riskConfig.stopLossThreshold) {
            return {
                action: 'reduce_risk',
                adjustment: 0.5, // 投資額50%減
                reason: `最大ドローダウン${(riskConfig.stopLossThreshold*100).toFixed(0)}%到達`
            };
        }
        
        if (recentROI < -riskConfig.stopLossThreshold * 0.7) {
            return {
                action: 'caution',
                adjustment: 0.8, // 投資額20%減
                reason: '警戒ライン接近'
            };
        }
        
        return { action: 'continue', adjustment: 1.0 };
    }
    
    // 最近のROI計算
    static calculateRecentROI(recentHistory) {
        if (recentHistory.length === 0) return 0;
        
        const totalInvested = recentHistory.reduce((sum, record) => sum + record.totalInvestment, 0);
        const totalReturned = recentHistory.reduce((sum, record) => sum + (record.actualReturn || 0), 0);
        
        return totalInvested > 0 ? (totalReturned - totalInvested) / totalInvested : 0;
    }
    
    // 設定変更
    static setRiskProfile(profileName) {
        if (this.investmentConfig.riskTolerance[profileName]) {
            this.currentRiskProfile = profileName;
            this.saveConfiguration();
            return true;
        }
        return false;
    }
    
    static setInvestmentStrategy(strategyName) {
        if (this.investmentConfig.investmentStrategy[strategyName]) {
            this.currentStrategy = strategyName;
            this.saveConfiguration();
            return true;
        }
        return false;
    }
    
    static setTotalCapital(amount) {
        if (amount > 0) {
            this.totalCapital = amount;
            this.saveConfiguration();
            return true;
        }
        return false;
    }
    
    // 設定保存・読み込み
    static saveConfiguration() {
        try {
            localStorage.setItem('riskManagementConfig', JSON.stringify({
                riskProfile: this.currentRiskProfile,
                strategy: this.currentStrategy,
                totalCapital: this.totalCapital,
                lastUpdated: new Date().toISOString()
            }));
        } catch (error) {
            console.error('リスク管理設定保存エラー:', error);
        }
    }
    
    static loadConfiguration() {
        try {
            const saved = localStorage.getItem('riskManagementConfig');
            if (saved) {
                const config = JSON.parse(saved);
                this.currentRiskProfile = config.riskProfile || 'moderate';
                this.currentStrategy = config.strategy || 'growthInvesting';
                this.totalCapital = config.totalCapital || 100000;
            }
        } catch (error) {
            console.error('リスク管理設定読み込みエラー:', error);
        }
    }
    
    // 初期化
    static initialize() {
        this.loadConfiguration();
        console.log('💰 リスク管理ベース投資配分システム初期化完了:', {
            リスクプロファイル: this.currentRiskProfile,
            投資戦略: this.currentStrategy,
            総資本: this.totalCapital.toLocaleString() + '円'
        });
    }
}

// グローバル公開
window.RiskManagementInvestmentSystem = RiskManagementInvestmentSystem;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    RiskManagementInvestmentSystem.initialize();
});