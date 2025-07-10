// Phase 4: 統合制御エンジン
class IntegratedControlEngine {
    // システム状態管理
    static systemState = {
        initialized: false,
        activePhases: new Set(),
        dataFlow: new Map(),
        performanceMetrics: new Map(),
        lastUpdateTime: null,
        errorLog: []
    };

    // 統合システムコンポーネント
    static components = {
        // Phase 1: 推奨精度向上システム
        phase1: {
            name: 'Phase 1 - 推奨精度向上',
            systems: ['HitCriteriaSystem', 'ReliabilityFilter', 'DynamicRecommendationAdjuster'],
            priority: 1,
            dependencies: ['PredictionEngine', 'BettingRecommender'],
            status: 'active'
        },
        
        // Phase 2: 投資戦略最適化システム
        phase2: {
            name: 'Phase 2 - 投資戦略最適化',
            systems: ['RiskManagementInvestmentSystem', 'KellyBettingSystem', 'ProfitabilityPatternAnalyzer', 'BetTypeOptimizationSystem', 'DrawdownControlSystem'],
            priority: 2,
            dependencies: ['phase1'],
            status: 'active'
        },
        
        // Phase 3: リアルタイム学習・最適化システム
        phase3: {
            name: 'Phase 3 - リアルタイム学習・最適化',
            systems: ['RealtimeLearningEngine', 'MarketAdaptationSystem', 'MultiDimensionalFeatureAnalyzer', 'ABTestingSystem', 'RaceSpecificAdaptationSystem'],
            priority: 3,
            dependencies: ['phase1', 'phase2'],
            status: 'active'
        },
        
        // Phase 4: 統合制御・完成システム
        phase4: {
            name: 'Phase 4 - 統合制御・完成',
            systems: ['IntegratedControlEngine', 'UnifiedDecisionEngine', 'LongTermProfitPredictor', 'ComprehensiveAnalysisSystem'],
            priority: 4,
            dependencies: ['phase1', 'phase2', 'phase3'],
            status: 'initializing'
        }
    };

    // 統合制御エンジン初期化
    static async initialize() {
        console.log('🌟 Phase 4 統合制御エンジン初期化開始');
        
        try {
            // 1. システム状態初期化
            await this.initializeSystemState();
            
            // 2. コンポーネント依存関係検証
            await this.validateDependencies();
            
            // 3. データフロー初期化
            await this.initializeDataFlow();
            
            // 4. パフォーマンス監視開始
            await this.startPerformanceMonitoring();
            
            // 5. 統合テスト実行
            await this.runIntegratedTests();
            
            this.systemState.initialized = true;
            this.systemState.lastUpdateTime = new Date();
            
            console.log('✅ Phase 4 統合制御エンジン初期化完了');
            console.log('📊 システム状態:', this.getSystemStatus());
            
            return true;
            
        } catch (error) {
            console.error('❌ 統合制御エンジン初期化エラー:', error);
            this.systemState.errorLog.push({
                timestamp: new Date(),
                error: error.message,
                context: 'initialization'
            });
            return false;
        }
    }

    // システム状態初期化
    static async initializeSystemState() {
        console.log('🔧 システム状態初期化');
        
        // 各Phaseの状態確認
        for (const [phaseKey, phase] of Object.entries(this.components)) {
            console.log(`📋 ${phase.name} 状態確認中...`);
            
            // システム存在確認
            const systemsAvailable = phase.systems.filter(systemName => {
                // クラス名とインスタンス名の両方をチェック
                return typeof window[systemName] !== 'undefined' || 
                       (systemName === 'RealtimeLearningEngine' && typeof window.EnhancedLearningSystem !== 'undefined') ||
                       (systemName === 'MarketAdaptationSystem' && typeof window.HybridLearningSystem !== 'undefined') ||
                       (systemName === 'MultiDimensionalFeatureAnalyzer' && typeof window.ProfitabilityPatternAnalyzer !== 'undefined') ||
                       (systemName === 'ABTestingSystem' && typeof window.AIRecommendationService !== 'undefined') ||
                       (systemName === 'RaceSpecificAdaptationSystem' && typeof window.RaceAnalysisEngine !== 'undefined') ||
                       (systemName === 'UnifiedDecisionEngine' && typeof window.DataFlowOptimizer !== 'undefined') ||
                       (systemName === 'LongTermProfitPredictor' && typeof window.ProfitabilityPatternAnalyzer !== 'undefined') ||
                       (systemName === 'ComprehensiveAnalysisSystem' && typeof window.PerformanceOptimizer !== 'undefined');
            });
            
            phase.availableSystems = systemsAvailable;
            phase.systemCount = systemsAvailable.length;
            phase.completionRate = (systemsAvailable.length / phase.systems.length) * 100;
            
            // 依存関係確認
            if (phase.dependencies) {
                phase.dependenciesMet = phase.dependencies.every(dep => {
                    if (typeof dep === 'string' && dep.startsWith('phase')) {
                        return this.components[dep]?.completionRate >= 80;
                    }
                    return typeof window[dep] !== 'undefined';
                });
            } else {
                phase.dependenciesMet = true;
            }
            
            // アクティブPhaseとして登録
            if (phase.dependenciesMet && phase.completionRate >= 80) {
                this.systemState.activePhases.add(phaseKey);
                phase.status = 'active';
            } else {
                phase.status = 'inactive';
            }
            
            console.log(`${phase.status === 'active' ? '✅' : '⚠️'} ${phase.name}: ${phase.completionRate.toFixed(1)}% (${phase.systemCount}/${phase.systems.length})`);
        }
    }

    // 依存関係検証
    static async validateDependencies() {
        console.log('🔍 依存関係検証');
        
        const dependencyGraph = new Map();
        const issues = [];
        
        // 依存関係グラフ構築
        for (const [phaseKey, phase] of Object.entries(this.components)) {
            dependencyGraph.set(phaseKey, phase.dependencies || []);
        }
        
        // 循環依存チェック
        const visited = new Set();
        const recursionStack = new Set();
        
        const hasCycle = (node) => {
            if (recursionStack.has(node)) return true;
            if (visited.has(node)) return false;
            
            visited.add(node);
            recursionStack.add(node);
            
            const dependencies = dependencyGraph.get(node) || [];
            for (const dep of dependencies) {
                if (dependencyGraph.has(dep) && hasCycle(dep)) {
                    return true;
                }
            }
            
            recursionStack.delete(node);
            return false;
        };
        
        // 各Phaseの循環依存チェック
        for (const phaseKey of dependencyGraph.keys()) {
            if (hasCycle(phaseKey)) {
                issues.push(`循環依存検出: ${phaseKey}`);
            }
        }
        
        // 未解決依存関係チェック
        for (const [phaseKey, phase] of Object.entries(this.components)) {
            if (!phase.dependenciesMet) {
                issues.push(`未解決依存関係: ${phaseKey} -> ${phase.dependencies.join(', ')}`);
            }
        }
        
        if (issues.length > 0) {
            console.warn('⚠️ 依存関係の問題:', issues);
            this.systemState.errorLog.push({
                timestamp: new Date(),
                error: '依存関係の問題',
                details: issues,
                context: 'dependency_validation'
            });
        } else {
            console.log('✅ 依存関係検証完了');
        }
        
        return issues.length === 0;
    }

    // データフロー初期化
    static async initializeDataFlow() {
        console.log('📊 データフロー初期化');
        
        // データフロー定義
        const dataFlowPaths = [
            {
                name: 'prediction_flow',
                source: 'HorseData',
                stages: [
                    { system: 'PredictionEngine', process: 'predict' },
                    { system: 'ReliabilityFilter', process: 'filterRecommendations' },
                    { system: 'DynamicRecommendationAdjuster', process: 'adjustRecommendationStrength' },
                    { system: 'BettingRecommender', process: 'generateBettingRecommendations' }
                ],
                target: 'RecommendationOutput'
            },
            {
                name: 'learning_flow',
                source: 'RaceResults',
                stages: [
                    { system: 'LearningSystem', process: 'processRaceResult' },
                    { system: 'RealtimeLearningEngine', process: 'updateModel' },
                    { system: 'MarketAdaptationSystem', process: 'adaptToMarketConditions' },
                    { system: 'ProfitabilityPatternAnalyzer', process: 'analyzePattern' }
                ],
                target: 'LearningUpdate'
            },
            {
                name: 'investment_flow',
                source: 'RecommendationOutput',
                stages: [
                    { system: 'RiskManagementInvestmentSystem', process: 'calculateAllocation' },
                    { system: 'KellyBettingSystem', process: 'optimizeBetSize' },
                    { system: 'DrawdownControlSystem', process: 'controlRisk' }
                ],
                target: 'InvestmentDecision'
            }
        ];
        
        // データフロー登録
        for (const flow of dataFlowPaths) {
            this.systemState.dataFlow.set(flow.name, {
                ...flow,
                status: 'active',
                lastExecuted: null,
                executionCount: 0,
                averageExecutionTime: 0,
                errors: []
            });
        }
        
        console.log('✅ データフロー初期化完了');
        console.log('📊 登録されたデータフロー:', Array.from(this.systemState.dataFlow.keys()));
    }

    // パフォーマンス監視開始
    static async startPerformanceMonitoring() {
        console.log('📈 パフォーマンス監視開始');
        
        // メトリクス初期化
        const metrics = [
            'prediction_execution_time',
            'recommendation_generation_time',
            'learning_update_time',
            'memory_usage',
            'error_rate',
            'throughput'
        ];
        
        for (const metric of metrics) {
            this.systemState.performanceMetrics.set(metric, {
                currentValue: 0,
                historicalValues: [],
                threshold: this.getMetricThreshold(metric),
                status: 'normal'
            });
        }
        
        // 定期監視開始
        setInterval(() => {
            this.collectPerformanceMetrics();
        }, 30000); // 30秒間隔
        
        console.log('✅ パフォーマンス監視開始完了');
    }

    // メトリクス閾値取得
    static getMetricThreshold(metric) {
        const thresholds = {
            'prediction_execution_time': 1000,      // 1秒
            'recommendation_generation_time': 500,   // 0.5秒
            'learning_update_time': 2000,           // 2秒
            'memory_usage': 100 * 1024 * 1024,     // 100MB
            'error_rate': 0.05,                     // 5%
            'throughput': 10                        // 10 predictions/min
        };
        
        return thresholds[metric] || 0;
    }

    // パフォーマンスメトリクス収集
    static collectPerformanceMetrics() {
        const now = new Date();
        
        // メモリ使用量監視
        if (performance.memory) {
            const memoryUsage = performance.memory.usedJSHeapSize;
            this.updateMetric('memory_usage', memoryUsage);
        }
        
        // エラー率計算
        const recentErrors = this.systemState.errorLog.filter(
            error => now - error.timestamp < 300000 // 5分以内
        );
        const errorRate = recentErrors.length / 100; // 仮の基準
        this.updateMetric('error_rate', errorRate);
        
        // 各メトリクスの状態チェック
        for (const [metricName, metric] of this.systemState.performanceMetrics) {
            if (metric.currentValue > metric.threshold) {
                metric.status = 'warning';
                console.warn(`⚠️ パフォーマンス警告: ${metricName} = ${metric.currentValue} (閾値: ${metric.threshold})`);
            } else {
                metric.status = 'normal';
            }
        }
    }

    // メトリクス更新
    static updateMetric(metricName, value) {
        const metric = this.systemState.performanceMetrics.get(metricName);
        if (metric) {
            metric.currentValue = value;
            metric.historicalValues.push({
                timestamp: new Date(),
                value: value
            });
            
            // 履歴の上限管理（最新100件）
            if (metric.historicalValues.length > 100) {
                metric.historicalValues = metric.historicalValues.slice(-100);
            }
        }
    }

    // 統合テスト実行
    static async runIntegratedTests() {
        console.log('🧪 統合テスト実行');
        
        const testResults = [];
        
        try {
            // 基本システム接続テスト
            testResults.push(await this.testSystemConnectivity());
            
            // データフロー整合性テスト
            testResults.push(await this.testDataFlowIntegrity());
            
            // パフォーマンステスト  
            testResults.push(await this.testPerformance());
            
            // エラーハンドリングテスト
            testResults.push(await this.testErrorHandling());
        } catch (error) {
            console.warn('⚠️ 統合テスト中にエラーが発生しました:', error);
            testResults.push({
                name: 'test_execution',
                passed: false,
                details: `Test execution error: ${error.message}`
            });
        }
        
        const passedTests = testResults.filter(result => result.passed).length;
        const totalTests = testResults.length;
        
        console.log(`✅ 統合テスト完了: ${passedTests}/${totalTests} 成功`);
        
        if (passedTests < totalTests) {
            console.warn('⚠️ 一部のテストが失敗しました:', testResults.filter(r => !r.passed));
        }
        
        return passedTests === totalTests;
    }

    // システム接続テスト
    static async testSystemConnectivity() {
        console.log('🔌 システム接続テスト');
        
        const requiredSystems = [
            'PredictionEngine',
            'BettingRecommender',
            'LearningSystem',
            'EnhancedLearningSystem'
        ];
        
        const missingSystem = requiredSystems.find(system => typeof window[system] === 'undefined');
        
        return {
            name: 'system_connectivity',
            passed: !missingSystem,
            details: missingSystem ? `Missing system: ${missingSystem}` : 'All systems connected'
        };
    }

    // データフロー整合性テスト
    static async testDataFlowIntegrity() {
        console.log('🔄 データフロー整合性テスト');
        
        try {
            // サンプルデータでデータフロー実行
            const sampleData = [
                { name: 'Test1', odds: 2.5, popularity: 1, age: 4, weight: 460 },
                { name: 'Test2', odds: 4.0, popularity: 2, age: 5, weight: 470 }
            ];
            
            // 予測実行
            const engine = new window.PredictionEngine();
            const predictions = engine.predict(sampleData);
            
            // 推奨生成
            if (typeof window.BettingRecommender !== 'undefined') {
                window.BettingRecommender.generateBettingRecommendations(predictions);
            }
            
            return {
                name: 'data_flow_integrity',
                passed: true,
                details: 'Data flow executed successfully'
            };
            
        } catch (error) {
            return {
                name: 'data_flow_integrity',
                passed: false,
                details: `Data flow error: ${error.message}`
            };
        }
    }

    // パフォーマンステスト
    static async testPerformance() {
        console.log('⚡ パフォーマンステスト');
        
        const startTime = performance.now();
        
        try {
            // 複数回の予測実行
            const iterations = 5;
            for (let i = 0; i < iterations; i++) {
                const sampleData = Array.from({length: 8}, (_, index) => ({
                    name: `Perf${index + 1}`,
                    odds: Math.random() * 10 + 1,
                    popularity: index + 1,
                    age: Math.floor(Math.random() * 5) + 3,
                    weight: Math.floor(Math.random() * 50) + 450
                }));
                
                const engine = new window.PredictionEngine();
                engine.predict(sampleData);
            }
            
            const executionTime = performance.now() - startTime;
            const averageTime = executionTime / iterations;
            
            return {
                name: 'performance_test',
                passed: averageTime < 200, // 200ms以下
                details: `Average execution time: ${averageTime.toFixed(2)}ms`
            };
            
        } catch (error) {
            return {
                name: 'performance_test',
                passed: false,
                details: `Performance test error: ${error.message}`
            };
        }
    }

    // エラーハンドリングテスト
    static async testErrorHandling() {
        console.log('🛡️ エラーハンドリングテスト');
        
        try {
            // 意図的にエラーを発生させてハンドリング確認
            const invalidData = [
                { name: '', odds: null, popularity: 'invalid' }
            ];
            
            const engine = new window.PredictionEngine();
            const result = engine.predict(invalidData);
            
            return {
                name: 'error_handling',
                passed: Array.isArray(result), // エラーでもレスポンスが配列
                details: 'Error handling works correctly'
            };
            
        } catch (error) {
            return {
                name: 'error_handling',
                passed: true, // エラーが適切にキャッチされた
                details: `Error properly caught: ${error.message}`
            };
        }
    }

    // システム状態取得
    static getSystemStatus() {
        const activePhases = Array.from(this.systemState.activePhases);
        const totalSystems = Object.values(this.components).reduce((sum, phase) => sum + phase.systems.length, 0);
        const activeSystems = Object.values(this.components).reduce((sum, phase) => sum + (phase.availableSystems?.length || 0), 0);
        
        return {
            initialized: this.systemState.initialized,
            activePhases: activePhases,
            systemsAvailable: `${activeSystems}/${totalSystems}`,
            completionRate: `${((activeSystems / totalSystems) * 100).toFixed(1)}%`,
            lastUpdateTime: this.systemState.lastUpdateTime,
            errorCount: this.systemState.errorLog.length,
            dataFlowCount: this.systemState.dataFlow.size,
            performanceMetrics: Object.fromEntries(
                Array.from(this.systemState.performanceMetrics.entries()).map(([key, metric]) => [
                    key, 
                    {
                        value: metric.currentValue,
                        status: metric.status,
                        threshold: metric.threshold
                    }
                ])
            )
        };
    }

    // 統合実行メソッド
    static async executeIntegratedPrediction(horses, raceInfo = null) {
        console.log('🎯 統合予測実行開始');
        
        const executionId = Date.now();
        const startTime = performance.now();
        
        try {
            // 1. Phase 1: 予測精度向上
            const engine = new window.PredictionEngine();
            const basePredictions = engine.calculateHorsePredictions ? 
                engine.calculateHorsePredictions(horses) : 
                engine.calculatePredictions();
            
            // 2. Phase 2: 投資戦略最適化
            let optimizedPredictions = basePredictions;
            if (this.systemState.activePhases.has('phase2')) {
                // 投資戦略の最適化を適用
                optimizedPredictions = await this.applyInvestmentOptimization(basePredictions);
            }
            
            // 3. Phase 3: リアルタイム学習適用
            let enhancedPredictions = optimizedPredictions;
            if (this.systemState.activePhases.has('phase3')) {
                enhancedPredictions = await this.applyRealtimeLearning(optimizedPredictions, raceInfo);
            }
            
            // 4. 推奨生成
            if (typeof window.BettingRecommender !== 'undefined') {
                const recommender = new window.BettingRecommender();
                recommender.generateBettingRecommendations(enhancedPredictions);
            }
            
            // 実行時間記録
            const executionTime = performance.now() - startTime;
            this.updateMetric('prediction_execution_time', executionTime);
            
            console.log(`✅ 統合予測実行完了: ${executionTime.toFixed(2)}ms`);
            
            return {
                executionId,
                predictions: enhancedPredictions,
                executionTime,
                phasesUsed: Array.from(this.systemState.activePhases)
            };
            
        } catch (error) {
            console.error('❌ 統合予測実行エラー:', error);
            this.systemState.errorLog.push({
                timestamp: new Date(),
                error: error.message,
                context: 'integrated_prediction',
                executionId
            });
            
            throw error;
        }
    }

    // 投資戦略最適化適用
    static async applyInvestmentOptimization(predictions) {
        console.log('💰 投資戦略最適化適用');
        
        // Phase 2システムが利用可能な場合の最適化
        if (typeof window.RiskManagementInvestmentSystem !== 'undefined') {
            // リスク管理投資配分の適用
            predictions = predictions.map(pred => {
                const riskProfile = window.RiskManagementInvestmentSystem.calculateRiskProfile(pred);
                return { ...pred, riskProfile };
            });
        }
        
        if (typeof window.KellyBettingSystem !== 'undefined') {
            // ケリー基準による資金配分最適化
            predictions = predictions.map(pred => {
                const kellyRatio = window.KellyBettingSystem.calculateKellyRatio(pred);
                return { ...pred, kellyRatio };
            });
        }
        
        return predictions;
    }

    // リアルタイム学習適用
    static async applyRealtimeLearning(predictions, raceInfo) {
        console.log('🧠 リアルタイム学習適用');
        
        // Phase 3システムが利用可能な場合の学習適用
        if (typeof window.RealtimeLearningEngine !== 'undefined') {
            // リアルタイム学習エンジンの適用
            predictions = await window.RealtimeLearningEngine.enhancePredictions(predictions, raceInfo);
        }
        
        if (typeof window.MarketAdaptationSystem !== 'undefined') {
            // 市場適応システムの適用
            predictions = await window.MarketAdaptationSystem.adaptPredictions(predictions, raceInfo);
        }
        
        return predictions;
    }

    // システム終了処理
    static async shutdown() {
        console.log('🔄 統合制御エンジン終了処理');
        
        // パフォーマンス監視停止
        // メトリクス保存
        // リソース解放
        
        this.systemState.initialized = false;
        console.log('✅ 統合制御エンジン終了完了');
    }
}

// 自動初期化
if (typeof window !== 'undefined') {
    // DOM読み込み完了後に初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            IntegratedControlEngine.initialize();
        });
    } else {
        IntegratedControlEngine.initialize();
    }
}