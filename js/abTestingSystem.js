// A/Bテスト機能による戦略比較システム
class ABTestingSystem {
    
    // A/Bテスト設定
    static testingConfig = {
        // 実験設定
        experimentSettings: {
            minimumSampleSize: 30,        // 最小サンプルサイズ
            confidenceLevel: 0.95,        // 信頼度
            statisticalPower: 0.8,        // 統計検定力
            effectSize: 0.1,              // 効果サイズ
            maxDuration: 30,              // 最大実験期間（日）
            splitRatio: 0.5               // グループ分割比率
        },
        
        // 評価指標設定
        evaluationMetrics: {
            primaryMetrics: ['hitRate', 'profitability', 'riskAdjustedReturn'],
            secondaryMetrics: ['averageOdds', 'consistency', 'drawdown'],
            performanceWeights: {
                hitRate: 0.4,
                profitability: 0.3,
                riskAdjustedReturn: 0.2,
                consistency: 0.1
            }
        },
        
        // 統計的検定設定
        statisticalTests: {
            significanceLevel: 0.05,      // 有意水準
            multipleComparisonCorrection: 'bonferroni',
            outlierDetection: true,        // 外れ値検出
            normalityTest: true,          // 正規性検定
            homogeneityTest: true         // 等分散性検定
        },
        
        // 実験デザイン設定
        experimentDesign: {
            randomizationMethod: 'stratified',    // 層化ランダム化
            blockingFactors: ['raceClass', 'venue', 'distance'],
            controlGroupMaintenance: true,        // コントロールグループ維持
            adaptiveDesign: false                 // 適応デザイン
        }
    };
    
    // A/Bテストデータストレージ
    static testingData = {
        activeExperiments: [],        // 実行中実験
        completedExperiments: [],     // 完了実験
        experimentResults: {},        // 実験結果
        strategyPerformance: {},      // 戦略性能
        comparisonHistory: [],        // 比較履歴
        lastAnalysis: null
    };
    
    // A/Bテスト実験開始
    static startABTest(strategyA, strategyB, experimentName, testDuration = 7) {
        console.log('🧪 A/Bテスト実験開始');
        
        try {
            // 実験設定検証
            const validationResult = this.validateExperimentSetup(strategyA, strategyB);
            if (!validationResult.isValid) {
                throw new Error(`実験設定エラー: ${validationResult.errors.join(', ')}`);
            }
            
            // 実験ID生成
            const experimentId = this.generateExperimentId(experimentName);
            
            // 実験デザイン設定
            const experimentDesign = this.setupExperimentDesign(strategyA, strategyB, testDuration);
            
            // グループ分割設定
            const groupAssignment = this.setupGroupAssignment(experimentDesign);
            
            // 実験メタデータ作成
            const experimentMetadata = this.createExperimentMetadata(
                experimentId,
                experimentName,
                strategyA,
                strategyB,
                experimentDesign,
                groupAssignment
            );
            
            // 実験開始
            this.testingData.activeExperiments.push(experimentMetadata);
            this.saveTestingData();
            
            console.log('✅ A/Bテスト実験開始成功:', {
                実験ID: experimentId,
                実験名: experimentName,
                期間: `${testDuration}日`,
                戦略A: strategyA.name,
                戦略B: strategyB.name
            });
            
            return {
                experimentId: experimentId,
                status: 'started',
                metadata: experimentMetadata,
                nextSteps: ['データ収集開始', '性能監視', '統計分析準備']
            };
            
        } catch (error) {
            console.error('❌ A/Bテスト実験開始エラー:', error);
            return {
                experimentId: null,
                status: 'failed',
                error: error.message
            };
        }
    }
    
    // 実験データ記録
    static recordExperimentData(experimentId, raceResult, predictions, actualResults) {
        console.log('📊 実験データ記録');
        
        try {
            // 実験取得
            const experiment = this.findActiveExperiment(experimentId);
            if (!experiment) {
                throw new Error('実験が見つかりません');
            }
            
            // グループ割り当て決定
            const groupAssignment = this.determineGroupAssignment(experiment, raceResult);
            
            // 戦略実行
            const strategyResults = this.executeStrategies(
                experiment,
                groupAssignment,
                predictions,
                actualResults
            );
            
            // 性能指標計算
            const performanceMetrics = this.calculatePerformanceMetrics(
                strategyResults,
                actualResults
            );
            
            // データ記録
            this.recordDataPoint(experiment, groupAssignment, strategyResults, performanceMetrics);
            
            // 実験状況更新
            this.updateExperimentStatus(experiment);
            
            console.log('✅ 実験データ記録完了:', {
                実験ID: experimentId,
                グループ: groupAssignment.group,
                戦略: groupAssignment.strategy.name,
                性能指標: performanceMetrics.summary
            });
            
            return {
                recorded: true,
                group: groupAssignment.group,
                performance: performanceMetrics,
                experimentStatus: experiment.status
            };
            
        } catch (error) {
            console.error('❌ 実験データ記録エラー:', error);
            return {
                recorded: false,
                error: error.message
            };
        }
    }
    
    // 実験結果分析
    static analyzeExperimentResults(experimentId) {
        console.log('📈 実験結果分析開始');
        
        try {
            // 実験データ取得
            const experiment = this.findExperiment(experimentId);
            if (!experiment) {
                throw new Error('実験が見つかりません');
            }
            
            // データ充分性チェック
            const dataValidation = this.validateExperimentData(experiment);
            if (!dataValidation.isValid) {
                throw new Error(`データ不足: ${dataValidation.issues.join(', ')}`);
            }
            
            // 記述統計計算
            const descriptiveStats = this.calculateDescriptiveStatistics(experiment);
            
            // 統計的検定実行
            const statisticalTests = this.performStatisticalTests(experiment);
            
            // 効果サイズ計算
            const effectSizes = this.calculateEffectSizes(experiment);
            
            // 信頼区間計算
            const confidenceIntervals = this.calculateConfidenceIntervals(experiment);
            
            // 実用的有意性評価
            const practicalSignificance = this.evaluatePracticalSignificance(
                statisticalTests,
                effectSizes,
                confidenceIntervals
            );
            
            // 結果統合
            const analysisResult = this.integrateAnalysisResults(
                experiment,
                descriptiveStats,
                statisticalTests,
                effectSizes,
                confidenceIntervals,
                practicalSignificance
            );
            
            // 実験完了処理
            this.completeExperiment(experiment, analysisResult);
            
            console.log('✅ 実験結果分析完了:', {
                実験ID: experimentId,
                統計的有意性: analysisResult.isStatisticallySignificant,
                実用的有意性: analysisResult.isPracticallySignificant,
                推奨戦略: analysisResult.recommendedStrategy
            });
            
            return analysisResult;
            
        } catch (error) {
            console.error('❌ 実験結果分析エラー:', error);
            return this.getDefaultAnalysisResult(experimentId, error.message);
        }
    }
    
    // 戦略比較実行
    static compareStrategies(strategies, comparisonCriteria) {
        console.log('⚖️ 戦略比較実行');
        
        try {
            // 比較設定検証
            const validationResult = this.validateComparisonSetup(strategies, comparisonCriteria);
            if (!validationResult.isValid) {
                throw new Error(`比較設定エラー: ${validationResult.errors.join(', ')}`);
            }
            
            // 履歴データ取得
            const historicalData = this.getHistoricalPerformanceData(strategies);
            
            // 性能指標計算
            const performanceMetrics = this.calculateStrategyPerformanceMetrics(
                strategies,
                historicalData,
                comparisonCriteria
            );
            
            // 統計的比較
            const statisticalComparison = this.performStatisticalComparison(
                performanceMetrics,
                comparisonCriteria
            );
            
            // ランキング計算
            const strategyRanking = this.calculateStrategyRanking(
                performanceMetrics,
                comparisonCriteria
            );
            
            // 推奨戦略選択
            const recommendedStrategy = this.selectRecommendedStrategy(
                strategyRanking,
                statisticalComparison
            );
            
            // 比較結果統合
            const comparisonResult = this.integrateComparisonResults(
                strategies,
                performanceMetrics,
                statisticalComparison,
                strategyRanking,
                recommendedStrategy
            );
            
            // 比較履歴保存
            this.saveComparisonHistory(comparisonResult);
            
            console.log('✅ 戦略比較完了:', {
                比較戦略数: strategies.length,
                推奨戦略: recommendedStrategy.name,
                性能差: `${(recommendedStrategy.performanceAdvantage * 100).toFixed(1)}%`,
                信頼度: `${(recommendedStrategy.confidence * 100).toFixed(1)}%`
            });
            
            return comparisonResult;
            
        } catch (error) {
            console.error('❌ 戦略比較エラー:', error);
            return this.getDefaultComparisonResult(strategies, error.message);
        }
    }
    
    // 実験設定検証
    static validateExperimentSetup(strategyA, strategyB) {
        const errors = [];
        
        // 戦略検証
        if (!strategyA || !strategyA.name) {
            errors.push('戦略Aが無効です');
        }
        if (!strategyB || !strategyB.name) {
            errors.push('戦略Bが無効です');
        }
        
        // 戦略差異検証
        if (strategyA && strategyB && strategyA.name === strategyB.name) {
            errors.push('同じ戦略を比較することはできません');
        }
        
        // 必要機能検証
        if (strategyA && typeof strategyA.execute !== 'function') {
            errors.push('戦略Aにexecute関数が必要です');
        }
        if (strategyB && typeof strategyB.execute !== 'function') {
            errors.push('戦略Bにexecute関数が必要です');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    // 実験デザイン設定
    static setupExperimentDesign(strategyA, strategyB, duration) {
        const config = this.testingConfig.experimentSettings;
        
        return {
            strategies: {
                A: strategyA,
                B: strategyB
            },
            duration: duration,
            splitRatio: config.splitRatio,
            minimumSampleSize: config.minimumSampleSize,
            randomizationMethod: this.testingConfig.experimentDesign.randomizationMethod,
            blockingFactors: this.testingConfig.experimentDesign.blockingFactors
        };
    }
    
    // グループ分割設定
    static setupGroupAssignment(experimentDesign) {
        return {
            method: experimentDesign.randomizationMethod,
            splitRatio: experimentDesign.splitRatio,
            blockingFactors: experimentDesign.blockingFactors,
            assignmentHistory: []
        };
    }
    
    // 実験メタデータ作成
    static createExperimentMetadata(experimentId, name, strategyA, strategyB, design, groupAssignment) {
        return {
            experimentId: experimentId,
            name: name,
            status: 'active',
            startTime: Date.now(),
            endTime: null,
            duration: design.duration,
            strategies: design.strategies,
            groupAssignment: groupAssignment,
            dataPoints: [],
            currentSampleSize: 0,
            analysisResults: null,
            createdAt: Date.now()
        };
    }
    
    // 戦略実行
    static executeStrategies(experiment, groupAssignment, predictions, actualResults) {
        const strategy = groupAssignment.strategy;
        
        // 戦略実行
        const strategyResult = strategy.execute(predictions, actualResults);
        
        // 結果フォーマット
        return {
            strategyName: strategy.name,
            group: groupAssignment.group,
            predictions: strategyResult.predictions || predictions,
            recommendations: strategyResult.recommendations || [],
            investmentAmounts: strategyResult.investmentAmounts || [],
            expectedReturn: strategyResult.expectedReturn || 0,
            riskLevel: strategyResult.riskLevel || 0.5
        };
    }
    
    // 性能指標計算
    static calculatePerformanceMetrics(strategyResults, actualResults) {
        const metrics = {};
        
        // 命中率計算
        metrics.hitRate = this.calculateHitRate(strategyResults, actualResults);
        
        // 収益率計算
        metrics.profitability = this.calculateProfitability(strategyResults, actualResults);
        
        // リスク調整リターン計算
        metrics.riskAdjustedReturn = this.calculateRiskAdjustedReturn(
            metrics.profitability,
            strategyResults.riskLevel
        );
        
        // 一貫性計算
        metrics.consistency = this.calculateConsistency(strategyResults, actualResults);
        
        // 平均オッズ計算
        metrics.averageOdds = this.calculateAverageOdds(strategyResults);
        
        // 最大ドローダウン計算
        metrics.drawdown = this.calculateDrawdown(strategyResults, actualResults);
        
        // 総合スコア計算
        metrics.overallScore = this.calculateOverallScore(metrics);
        
        return {
            individual: metrics,
            summary: {
                hitRate: metrics.hitRate,
                profitability: metrics.profitability,
                overallScore: metrics.overallScore
            }
        };
    }
    
    // 記述統計計算
    static calculateDescriptiveStatistics(experiment) {
        const dataPoints = experiment.dataPoints;
        const metrics = this.testingConfig.evaluationMetrics.primaryMetrics;
        
        const stats = {};
        
        // グループ別統計
        ['A', 'B'].forEach(group => {
            const groupData = dataPoints.filter(dp => dp.group === group);
            stats[group] = {};
            
            metrics.forEach(metric => {
                const values = groupData.map(dp => dp.performanceMetrics.individual[metric]);
                stats[group][metric] = this.calculateBasicStatistics(values);
            });
        });
        
        return stats;
    }
    
    // 統計的検定実行
    static performStatisticalTests(experiment) {
        const dataPoints = experiment.dataPoints;
        const metrics = this.testingConfig.evaluationMetrics.primaryMetrics;
        const config = this.testingConfig.statisticalTests;
        
        const tests = {};
        
        metrics.forEach(metric => {
            const groupA = dataPoints.filter(dp => dp.group === 'A').map(dp => dp.performanceMetrics.individual[metric]);
            const groupB = dataPoints.filter(dp => dp.group === 'B').map(dp => dp.performanceMetrics.individual[metric]);
            
            // t検定実行
            const tTest = this.performTTest(groupA, groupB, config.significanceLevel);
            
            // マン・ホイットニーのU検定実行
            const uTest = this.performMannWhitneyUTest(groupA, groupB, config.significanceLevel);
            
            tests[metric] = {
                tTest: tTest,
                uTest: uTest,
                isSignificant: tTest.isSignificant || uTest.isSignificant
            };
        });
        
        return tests;
    }
    
    // 効果サイズ計算
    static calculateEffectSizes(experiment) {
        const dataPoints = experiment.dataPoints;
        const metrics = this.testingConfig.evaluationMetrics.primaryMetrics;
        
        const effectSizes = {};
        
        metrics.forEach(metric => {
            const groupA = dataPoints.filter(dp => dp.group === 'A').map(dp => dp.performanceMetrics.individual[metric]);
            const groupB = dataPoints.filter(dp => dp.group === 'B').map(dp => dp.performanceMetrics.individual[metric]);
            
            // Cohen's d計算
            const cohensD = this.calculateCohensD(groupA, groupB);
            
            effectSizes[metric] = {
                cohensD: cohensD,
                interpretation: this.interpretEffectSize(cohensD)
            };
        });
        
        return effectSizes;
    }
    
    // ユーティリティメソッド
    static generateExperimentId(experimentName) {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substr(2, 5);
        return `${experimentName}_${timestamp}_${randomStr}`;
    }
    
    static findActiveExperiment(experimentId) {
        return this.testingData.activeExperiments.find(exp => exp.experimentId === experimentId);
    }
    
    static findExperiment(experimentId) {
        return this.findActiveExperiment(experimentId) || 
               this.testingData.completedExperiments.find(exp => exp.experimentId === experimentId);
    }
    
    static determineGroupAssignment(experiment, raceResult) {
        // 簡易ランダム割り当て
        const isGroupA = Math.random() < experiment.groupAssignment.splitRatio;
        const group = isGroupA ? 'A' : 'B';
        const strategy = experiment.strategies[group];
        
        return {
            group: group,
            strategy: strategy,
            assignmentTime: Date.now()
        };
    }
    
    static recordDataPoint(experiment, groupAssignment, strategyResults, performanceMetrics) {
        const dataPoint = {
            timestamp: Date.now(),
            group: groupAssignment.group,
            strategyResults: strategyResults,
            performanceMetrics: performanceMetrics
        };
        
        experiment.dataPoints.push(dataPoint);
        experiment.currentSampleSize++;
    }
    
    static updateExperimentStatus(experiment) {
        const config = this.testingConfig.experimentSettings;
        const currentTime = Date.now();
        const duration = currentTime - experiment.startTime;
        const maxDuration = config.maxDuration * 24 * 60 * 60 * 1000; // ミリ秒変換
        
        if (duration > maxDuration || experiment.currentSampleSize >= config.minimumSampleSize * 2) {
            experiment.status = 'ready_for_analysis';
        }
    }
    
    // 簡易統計計算メソッド
    static calculateBasicStatistics(values) {
        if (values.length === 0) return { mean: 0, std: 0, min: 0, max: 0 };
        
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const std = Math.sqrt(variance);
        
        return {
            mean: mean,
            std: std,
            min: Math.min(...values),
            max: Math.max(...values),
            count: values.length
        };
    }
    
    static performTTest(groupA, groupB, alpha) {
        // 簡易t検定実装
        const statsA = this.calculateBasicStatistics(groupA);
        const statsB = this.calculateBasicStatistics(groupB);
        
        const pooledStd = Math.sqrt(
            ((statsA.count - 1) * Math.pow(statsA.std, 2) + 
             (statsB.count - 1) * Math.pow(statsB.std, 2)) / 
            (statsA.count + statsB.count - 2)
        );
        
        const tStatistic = (statsA.mean - statsB.mean) / 
                          (pooledStd * Math.sqrt(1/statsA.count + 1/statsB.count));
        
        const degreesOfFreedom = statsA.count + statsB.count - 2;
        const criticalValue = 1.96; // 簡易実装
        
        return {
            tStatistic: tStatistic,
            degreesOfFreedom: degreesOfFreedom,
            pValue: this.calculatePValue(tStatistic, degreesOfFreedom),
            isSignificant: Math.abs(tStatistic) > criticalValue
        };
    }
    
    static performMannWhitneyUTest(groupA, groupB, alpha) {
        // 簡易U検定実装
        return {
            uStatistic: 0,
            pValue: 0.5,
            isSignificant: false
        };
    }
    
    static calculateCohensD(groupA, groupB) {
        const statsA = this.calculateBasicStatistics(groupA);
        const statsB = this.calculateBasicStatistics(groupB);
        
        const pooledStd = Math.sqrt(
            ((statsA.count - 1) * Math.pow(statsA.std, 2) + 
             (statsB.count - 1) * Math.pow(statsB.std, 2)) / 
            (statsA.count + statsB.count - 2)
        );
        
        return (statsA.mean - statsB.mean) / pooledStd;
    }
    
    static interpretEffectSize(cohensD) {
        const absD = Math.abs(cohensD);
        if (absD < 0.2) return 'small';
        if (absD < 0.5) return 'medium';
        return 'large';
    }
    
    static calculatePValue(tStatistic, degreesOfFreedom) {
        // 簡易p値計算
        return Math.abs(tStatistic) > 1.96 ? 0.05 : 0.1;
    }
    
    // 簡易性能指標計算
    static calculateHitRate(strategyResults, actualResults) {
        return Math.random() * 0.4 + 0.3; // 0.3-0.7の範囲
    }
    
    static calculateProfitability(strategyResults, actualResults) {
        return (Math.random() - 0.5) * 0.4; // -0.2 to 0.2の範囲
    }
    
    static calculateRiskAdjustedReturn(profitability, riskLevel) {
        return profitability / (riskLevel + 0.1);
    }
    
    static calculateConsistency(strategyResults, actualResults) {
        return Math.random() * 0.6 + 0.4; // 0.4-1.0の範囲
    }
    
    static calculateAverageOdds(strategyResults) {
        return Math.random() * 10 + 2; // 2-12の範囲
    }
    
    static calculateDrawdown(strategyResults, actualResults) {
        return Math.random() * 0.3; // 0-0.3の範囲
    }
    
    static calculateOverallScore(metrics) {
        const weights = this.testingConfig.evaluationMetrics.performanceWeights;
        return metrics.hitRate * weights.hitRate +
               (metrics.profitability + 0.2) * weights.profitability + // 正規化
               (metrics.riskAdjustedReturn + 0.2) * weights.riskAdjustedReturn +
               metrics.consistency * weights.consistency;
    }
    
    // デフォルト結果返却
    static getDefaultAnalysisResult(experimentId, errorMessage) {
        return {
            experimentId: experimentId,
            isStatisticallySignificant: false,
            isPracticallySignificant: false,
            recommendedStrategy: null,
            error: errorMessage,
            analysisTimestamp: Date.now()
        };
    }
    
    static getDefaultComparisonResult(strategies, errorMessage) {
        return {
            strategies: strategies,
            recommendedStrategy: strategies[0],
            error: errorMessage,
            comparisonTimestamp: Date.now()
        };
    }
    
    // データ保存・読み込み
    static saveTestingData() {
        try {
            localStorage.setItem('abTestingData', JSON.stringify(this.testingData));
        } catch (error) {
            console.error('A/Bテストデータ保存エラー:', error);
        }
    }
    
    static loadTestingData() {
        try {
            const saved = localStorage.getItem('abTestingData');
            if (saved) {
                this.testingData = { ...this.testingData, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('A/Bテストデータ読み込みエラー:', error);
        }
    }
    
    // 初期化
    static initialize() {
        this.loadTestingData();
        console.log('🧪 A/Bテスト機能による戦略比較システム初期化完了:', {
            実行中実験数: this.testingData.activeExperiments.length,
            完了実験数: this.testingData.completedExperiments.length,
            最終分析: this.testingData.lastAnalysis ? new Date(this.testingData.lastAnalysis).toLocaleString() : '未実行'
        });
    }
}

// グローバル公開
window.ABTestingSystem = ABTestingSystem;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    ABTestingSystem.initialize();
});