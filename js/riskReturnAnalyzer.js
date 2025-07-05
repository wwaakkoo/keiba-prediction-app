// リスク・リターン分析システム
class RiskReturnAnalyzer {
    
    // リスク分析設定
    static analysisConfig = {
        // リスクレベル閾値
        riskThresholds: {
            veryLow: 0.1,      // 10%未満
            low: 0.25,         // 25%未満  
            medium: 0.5,       // 50%未満
            high: 0.75,        // 75%未満
            veryHigh: 1.0      // 100%未満
        },
        
        // リターン目標
        returnTargets: {
            conservative: 0.05,    // 5%
            moderate: 0.15,        // 15%
            aggressive: 0.30,      // 30%
            speculative: 0.50      // 50%
        },
        
        // 時間軸設定
        timeHorizons: {
            shortTerm: 30,     // 30日
            mediumTerm: 90,    // 90日
            longTerm: 365      // 365日
        },
        
        // ポートフォリオ最適化設定
        portfolioOptimization: {
            maxPositions: 10,           // 最大ポジション数
            maxSingleBetRatio: 0.2,    // 単一投資の最大比率（20%）
            minDiversification: 3,      // 最小分散投資数
            rebalanceThreshold: 0.1     // リバランス閾値（10%）
        }
    };
    
    // リスク・リターンデータ記録
    static riskReturnData = {
        // ポートフォリオ履歴
        portfolioHistory: [],
        
        // リスク指標履歴
        riskMetrics: {
            volatility: [],         // ボラティリティ履歴
            sharpeRatio: [],        // シャープレシオ履歴
            maxDrawdown: [],        // 最大ドローダウン履歴
            valueAtRisk: [],        // VaR履歴
            beta: []                // ベータ値履歴
        },
        
        // リターン指標履歴
        returnMetrics: {
            totalReturn: [],        // 総リターン履歴
            annualizedReturn: [],   // 年換算リターン履歴
            excessReturn: [],       // 超過リターン履歴
            rollingReturn: []       // 移動平均リターン履歴
        },
        
        // リスク調整済みリターン
        riskAdjustedMetrics: {
            sharpeRatio: [],        // シャープレシオ
            treynorRatio: [],       // トレイナーレシオ
            informationRatio: [],   // インフォメーションレシオ
            calmarRatio: []         // カルマーレシオ
        },
        
        // 相関分析
        correlationAnalysis: {
            betCorrelations: new Map(),     // 券種間相関
            oddsCorrelations: new Map(),    // オッズ帯間相関
            timeCorrelations: new Map()     // 時期間相関
        }
    };
    
    /**
     * ポートフォリオリスク・リターン分析
     * @param {Array} investments - 投資データ配列
     * @param {Object} options - 分析オプション
     * @returns {Object} リスク・リターン分析結果
     */
    static analyzePortfolioRiskReturn(investments, options = {}) {
        console.log('=== ポートフォリオ リスク・リターン分析開始 ===');
        console.log('投資数:', investments.length);
        
        if (!investments || investments.length === 0) {
            return { error: '分析対象の投資データがありません' };
        }
        
        try {
            // 1. 基本統計計算
            const basicStats = this.calculateBasicStatistics(investments);
            
            // 2. リスク指標計算
            const riskMetrics = this.calculateRiskMetrics(investments, basicStats);
            
            // 3. リターン指標計算
            const returnMetrics = this.calculateReturnMetrics(investments, basicStats);
            
            // 4. リスク調整済みリターン計算
            const riskAdjustedMetrics = this.calculateRiskAdjustedMetrics(
                returnMetrics, riskMetrics, options
            );
            
            // 5. ポートフォリオ最適化分析
            const optimizationAnalysis = this.analyzePortfolioOptimization(investments);
            
            // 6. 相関分析
            const correlationAnalysis = this.performCorrelationAnalysis(investments);
            
            // 7. シナリオ分析
            const scenarioAnalysis = this.performScenarioAnalysis(investments, riskMetrics);
            
            // 8. 総合評価とレコメンデーション
            const recommendations = this.generateRiskReturnRecommendations(
                riskMetrics, returnMetrics, riskAdjustedMetrics, optimizationAnalysis
            );
            
            const result = {
                summary: {
                    analysisDate: new Date().toISOString(),
                    totalInvestments: investments.length,
                    totalAmount: basicStats.totalAmount,
                    timeHorizon: this.determineTimeHorizon(investments),
                    riskProfile: this.determineRiskProfile(riskMetrics)
                },
                basicStats,
                riskMetrics,
                returnMetrics,
                riskAdjustedMetrics,
                optimizationAnalysis,
                correlationAnalysis,
                scenarioAnalysis,
                recommendations
            };
            
            // 分析結果をデータベースに記録
            this.recordAnalysisResults(result);
            
            console.log('リスク・リターン分析完了');
            return result;
            
        } catch (error) {
            console.error('リスク・リターン分析エラー:', error);
            return { error: error.message };
        }
    }
    
    /**
     * 基本統計計算
     * @param {Array} investments - 投資データ
     * @returns {Object} 基本統計
     */
    static calculateBasicStatistics(investments) {
        const returns = investments.map(inv => inv.returnRate || (inv.returnAmount / inv.betAmount - 1));
        const amounts = investments.map(inv => inv.betAmount);
        
        const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
        const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
        const totalReturn = investments.reduce((sum, inv) => sum + (inv.profit || 0), 0);
        
        // 標準偏差計算
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
        const standardDeviation = Math.sqrt(variance);
        
        // その他統計
        const sortedReturns = [...returns].sort((a, b) => a - b);
        const median = this.calculateMedian(sortedReturns);
        const skewness = this.calculateSkewness(returns, avgReturn, standardDeviation);
        const kurtosis = this.calculateKurtosis(returns, avgReturn, standardDeviation);
        
        return {
            totalAmount,
            avgReturn,
            totalReturn,
            standardDeviation,
            variance,
            median,
            skewness,
            kurtosis,
            minReturn: Math.min(...returns),
            maxReturn: Math.max(...returns),
            positiveReturns: returns.filter(r => r > 0).length,
            negativeReturns: returns.filter(r => r < 0).length,
            winRate: returns.filter(r => r > 0).length / returns.length
        };
    }
    
    /**
     * リスク指標計算
     * @param {Array} investments - 投資データ
     * @param {Object} basicStats - 基本統計
     * @returns {Object} リスク指標
     */
    static calculateRiskMetrics(investments, basicStats) {
        const returns = investments.map(inv => inv.returnRate || (inv.returnAmount / inv.betAmount - 1));
        
        // ボラティリティ（年換算）
        const volatility = basicStats.standardDeviation * Math.sqrt(252); // 252営業日
        
        // 最大ドローダウン計算
        const maxDrawdown = this.calculateMaxDrawdown(investments);
        
        // VaR計算（95%信頼区間）
        const var95 = this.calculateVaR(returns, 0.95);
        const var99 = this.calculateVaR(returns, 0.99);
        
        // CVaR計算（条件付きVaR）
        const cvar95 = this.calculateCVaR(returns, 0.95);
        
        // ベータ値計算（市場との相関、簡易版）
        const beta = this.calculateBeta(returns);
        
        // 下方偏差計算
        const downwardDeviation = this.calculateDownwardDeviation(returns, basicStats.avgReturn);
        
        // セミボラティリティ
        const semiVolatility = this.calculateSemiVolatility(returns, 0);
        
        // リスクレベル判定
        const riskLevel = this.determineRiskLevel(volatility, maxDrawdown, var95);
        
        return {
            volatility,
            maxDrawdown,
            var95,
            var99,
            cvar95,
            beta,
            downwardDeviation,
            semiVolatility,
            riskLevel,
            riskScore: this.calculateRiskScore(volatility, maxDrawdown, var95)
        };
    }
    
    /**
     * リターン指標計算
     * @param {Array} investments - 投資データ
     * @param {Object} basicStats - 基本統計
     * @returns {Object} リターン指標
     */
    static calculateReturnMetrics(investments, basicStats) {
        const riskFreeRate = 0.001; // リスクフリーレート（0.1%）
        
        // 年換算リターン
        const annualizedReturn = this.calculateAnnualizedReturn(investments);
        
        // 超過リターン
        const excessReturn = basicStats.avgReturn - riskFreeRate;
        
        // 累積リターン
        const cumulativeReturn = investments.reduce((cumulative, inv, index) => {
            const returnRate = inv.returnRate || (inv.returnAmount / inv.betAmount - 1);
            return cumulative * (1 + returnRate);
        }, 1) - 1;
        
        // ジオメトリック平均リターン
        const geometricMeanReturn = Math.pow(1 + cumulativeReturn, 1/investments.length) - 1;
        
        // 移動平均リターン
        const rollingReturns = this.calculateRollingReturns(investments, 30); // 30日移動平均
        
        return {
            totalReturn: basicStats.totalReturn,
            avgReturn: basicStats.avgReturn,
            annualizedReturn,
            excessReturn,
            cumulativeReturn,
            geometricMeanReturn,
            rollingReturns,
            returnConsistency: this.calculateReturnConsistency(investments),
            returnStability: this.calculateReturnStability(investments)
        };
    }
    
    /**
     * リスク調整済みリターン計算
     * @param {Object} returnMetrics - リターン指標
     * @param {Object} riskMetrics - リスク指標
     * @param {Object} options - オプション
     * @returns {Object} リスク調整済みリターン指標
     */
    static calculateRiskAdjustedMetrics(returnMetrics, riskMetrics, options = {}) {
        const riskFreeRate = options.riskFreeRate || 0.001;
        
        // シャープレシオ
        const sharpeRatio = riskMetrics.volatility > 0 ? 
            (returnMetrics.excessReturn) / riskMetrics.volatility : 0;
        
        // トレイナーレシオ
        const treynorRatio = riskMetrics.beta > 0 ? 
            returnMetrics.excessReturn / riskMetrics.beta : 0;
        
        // インフォメーションレシオ
        const informationRatio = this.calculateInformationRatio(returnMetrics, riskMetrics);
        
        // カルマーレシオ
        const calmarRatio = Math.abs(riskMetrics.maxDrawdown) > 0 ? 
            returnMetrics.annualizedReturn / Math.abs(riskMetrics.maxDrawdown) : 0;
        
        // ソルティーノレシオ
        const sortinoRatio = riskMetrics.semiVolatility > 0 ? 
            returnMetrics.excessReturn / riskMetrics.semiVolatility : 0;
        
        // オメガレシオ
        const omegaRatio = this.calculateOmegaRatio(returnMetrics, riskMetrics);
        
        // 総合リスク調整済みスコア
        const overallScore = this.calculateOverallRiskAdjustedScore({
            sharpeRatio, treynorRatio, calmarRatio, sortinoRatio
        });
        
        return {
            sharpeRatio,
            treynorRatio,
            informationRatio,
            calmarRatio,
            sortinoRatio,
            omegaRatio,
            overallScore,
            riskAdjustedRating: this.rateRiskAdjustedPerformance(overallScore)
        };
    }
    
    /**
     * ポートフォリオ最適化分析
     * @param {Array} investments - 投資データ
     * @returns {Object} 最適化分析結果
     */
    static analyzePortfolioOptimization(investments) {
        // 分散度分析
        const diversificationAnalysis = this.analyzeDiversification(investments);
        
        // 集中リスク分析
        const concentrationRisk = this.analyzeConcentrationRisk(investments);
        
        // リバランス推奨
        const rebalanceRecommendations = this.generateRebalanceRecommendations(investments);
        
        // 効率的フロンティア分析（簡易版）
        const efficientFrontier = this.calculateEfficientFrontier(investments);
        
        // 最適ポートフォリオ提案
        const optimalPortfolio = this.suggestOptimalPortfolio(investments, diversificationAnalysis);
        
        return {
            diversificationAnalysis,
            concentrationRisk,
            rebalanceRecommendations,
            efficientFrontier,
            optimalPortfolio,
            portfolioScore: this.calculatePortfolioScore(diversificationAnalysis, concentrationRisk)
        };
    }
    
    /**
     * 相関分析実行
     * @param {Array} investments - 投資データ
     * @returns {Object} 相関分析結果
     */
    static performCorrelationAnalysis(investments) {
        // 券種間相関
        const betTypeCorrelations = this.calculateBetTypeCorrelations(investments);
        
        // オッズ帯間相関
        const oddsRangeCorrelations = this.calculateOddsRangeCorrelations(investments);
        
        // 時期間相関
        const temporalCorrelations = this.calculateTemporalCorrelations(investments);
        
        // 相関マトリックス
        const correlationMatrix = this.buildCorrelationMatrix(investments);
        
        return {
            betTypeCorrelations,
            oddsRangeCorrelations,
            temporalCorrelations,
            correlationMatrix,
            averageCorrelation: this.calculateAverageCorrelation(correlationMatrix),
            correlationStability: this.assessCorrelationStability(investments)
        };
    }
    
    /**
     * シナリオ分析実行
     * @param {Array} investments - 投資データ
     * @param {Object} riskMetrics - リスク指標
     * @returns {Object} シナリオ分析結果
     */
    static performScenarioAnalysis(investments, riskMetrics) {
        // ストレステスト
        const stressTestResults = this.performStressTesting(investments);
        
        // モンテカルロシミュレーション
        const monteCarloResults = this.performMonteCarloSimulation(investments, 1000);
        
        // 最悪ケースシナリオ
        const worstCaseScenario = this.calculateWorstCaseScenario(investments, riskMetrics);
        
        // ベストケースシナリオ
        const bestCaseScenario = this.calculateBestCaseScenario(investments);
        
        // 期待シナリオ
        const expectedScenario = this.calculateExpectedScenario(investments);
        
        return {
            stressTestResults,
            monteCarloResults,
            scenarios: {
                worstCase: worstCaseScenario,
                expected: expectedScenario,
                bestCase: bestCaseScenario
            },
            confidenceIntervals: this.calculateConfidenceIntervals(monteCarloResults)
        };
    }
    
    /**
     * 推奨事項生成
     * @param {Object} riskMetrics - リスク指標
     * @param {Object} returnMetrics - リターン指標
     * @param {Object} riskAdjustedMetrics - リスク調整済み指標
     * @param {Object} optimizationAnalysis - 最適化分析
     * @returns {Object} 推奨事項
     */
    static generateRiskReturnRecommendations(riskMetrics, returnMetrics, riskAdjustedMetrics, optimizationAnalysis) {
        const recommendations = [];
        const priorities = [];
        
        // リスクレベル評価
        if (riskMetrics.riskLevel === 'HIGH' || riskMetrics.riskLevel === 'VERY_HIGH') {
            recommendations.push({
                type: 'RISK_REDUCTION',
                priority: 'HIGH',
                message: 'リスクレベルが高すぎます。ポジションサイズの縮小を推奨します。',
                action: 'ポジションサイズを30-50%削減し、分散投資を強化してください。'
            });
        }
        
        // シャープレシオ評価
        if (riskAdjustedMetrics.sharpeRatio < 0.5) {
            recommendations.push({
                type: 'EFFICIENCY_IMPROVEMENT',
                priority: 'MEDIUM',
                message: 'リスク調整済みリターンが低いです。投資戦略の見直しを推奨します。',
                action: '低効率な投資を削減し、穴馬重視戦略を強化してください。'
            });
        }
        
        // 分散度評価
        if (optimizationAnalysis.diversificationAnalysis.diversificationScore < 60) {
            recommendations.push({
                type: 'DIVERSIFICATION',
                priority: 'MEDIUM',
                message: 'ポートフォリオの分散が不足しています。',
                action: '異なるオッズ帯・券種への投資を増やして分散を図ってください。'
            });
        }
        
        // 最大ドローダウン評価
        if (Math.abs(riskMetrics.maxDrawdown) > 0.3) {
            recommendations.push({
                type: 'DRAWDOWN_MANAGEMENT',
                priority: 'HIGH',
                message: '最大ドローダウンが過大です。損失管理の強化が必要です。',
                action: 'ストップロス設定と資金管理ルールの厳格化を推奨します。'
            });
        }
        
        // 総合戦略提案
        const strategicAdvice = this.generateStrategicAdvice(riskMetrics, returnMetrics, riskAdjustedMetrics);
        
        return {
            recommendations,
            strategicAdvice,
            actionPlan: this.createActionPlan(recommendations),
            riskBudget: this.calculateOptimalRiskBudget(riskMetrics, returnMetrics),
            targetAdjustments: this.suggestTargetAdjustments(riskAdjustedMetrics)
        };
    }
    
    // ヘルパー関数群（主要なもののみ実装）
    static calculateMedian(sortedArray) {
        const mid = Math.floor(sortedArray.length / 2);
        return sortedArray.length % 2 === 0 ? 
            (sortedArray[mid - 1] + sortedArray[mid]) / 2 : sortedArray[mid];
    }
    
    static calculateSkewness(returns, mean, stdDev) {
        const n = returns.length;
        const sum = returns.reduce((sum, ret) => sum + Math.pow((ret - mean) / stdDev, 3), 0);
        return (n / ((n - 1) * (n - 2))) * sum;
    }
    
    static calculateKurtosis(returns, mean, stdDev) {
        const n = returns.length;
        const sum = returns.reduce((sum, ret) => sum + Math.pow((ret - mean) / stdDev, 4), 0);
        return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum - (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
    }
    
    static calculateMaxDrawdown(investments) {
        let peak = 0;
        let maxDrawdown = 0;
        let cumulative = 0;
        
        investments.forEach(inv => {
            cumulative += inv.profit || 0;
            if (cumulative > peak) peak = cumulative;
            const drawdown = (peak - cumulative) / peak;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        });
        
        return -maxDrawdown; // 負の値として返す
    }
    
    static calculateVaR(returns, confidence) {
        const sortedReturns = [...returns].sort((a, b) => a - b);
        const index = Math.floor((1 - confidence) * returns.length);
        return sortedReturns[index] || 0;
    }
    
    static calculateCVaR(returns, confidence) {
        const var95 = this.calculateVaR(returns, confidence);
        const tailReturns = returns.filter(ret => ret <= var95);
        return tailReturns.length > 0 ? 
            tailReturns.reduce((sum, ret) => sum + ret, 0) / tailReturns.length : 0;
    }
    
    static determineRiskLevel(volatility, maxDrawdown, var95) {
        const riskScore = Math.abs(volatility * 0.4 + maxDrawdown * 0.4 + var95 * 0.2);
        
        if (riskScore <= this.analysisConfig.riskThresholds.veryLow) return 'VERY_LOW';
        if (riskScore <= this.analysisConfig.riskThresholds.low) return 'LOW';
        if (riskScore <= this.analysisConfig.riskThresholds.medium) return 'MEDIUM';
        if (riskScore <= this.analysisConfig.riskThresholds.high) return 'HIGH';
        return 'VERY_HIGH';
    }
    
    static calculateRiskScore(volatility, maxDrawdown, var95) {
        return Math.min(100, Math.max(0, 
            (Math.abs(volatility) * 30 + Math.abs(maxDrawdown) * 40 + Math.abs(var95) * 30)
        ));
    }
    
    // データ永続化
    static recordAnalysisResults(analysisResult) {
        this.riskReturnData.portfolioHistory.push({
            timestamp: new Date().toISOString(),
            summary: analysisResult.summary,
            riskLevel: analysisResult.riskMetrics.riskLevel,
            sharpeRatio: analysisResult.riskAdjustedMetrics.sharpeRatio,
            totalReturn: analysisResult.returnMetrics.totalReturn
        });
        
        // 最新50件のみ保持
        if (this.riskReturnData.portfolioHistory.length > 50) {
            this.riskReturnData.portfolioHistory.shift();
        }
        
        console.log('リスク・リターン分析結果を記録しました');
    }
    
    // 外部アクセス用メソッド
    static getRiskReturnData() {
        return this.riskReturnData;
    }
    
    static updateAnalysisConfig(newConfig) {
        this.analysisConfig = { ...this.analysisConfig, ...newConfig };
        console.log('リスク・リターン分析設定を更新:', this.analysisConfig);
    }
}

// グローバル公開
window.RiskReturnAnalyzer = RiskReturnAnalyzer;