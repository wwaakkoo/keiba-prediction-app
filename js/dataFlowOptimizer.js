// Phase 4: データフロー最適化システム
class DataFlowOptimizer {
    // データフロー管理
    static flows = new Map();
    static executionQueue = [];
    static isProcessing = false;
    static cache = new Map();
    static metrics = new Map();
    
    // 最適化設定
    static config = {
        maxCacheSize: 1000,
        cacheTimeout: 300000, // 5分
        maxConcurrentFlows: 3,
        batchSize: 50,
        performanceThreshold: 1000, // 1秒
        enableCaching: true,
        enableBatching: true,
        enablePipelining: true
    };

    // 初期化
    static initialize() {
        console.log('🚀 データフロー最適化システム初期化');
        
        // 標準データフローの登録
        this.registerStandardFlows();
        
        // キャッシュクリーンアップ開始
        this.startCacheCleanup();
        
        // パフォーマンス監視開始
        this.startPerformanceMonitoring();
        
        console.log('✅ データフロー最適化システム初期化完了');
    }

    // 標準データフローの登録
    static registerStandardFlows() {
        console.log('📋 標準データフロー登録');
        
        // 予測フロー
        this.registerFlow('prediction', {
            name: 'prediction_flow',
            priority: 1,
            stages: [
                {
                    name: 'data_validation',
                    processor: this.validateInputData,
                    timeout: 100,
                    retryCount: 2
                },
                {
                    name: 'prediction_execution',
                    processor: this.executePrediction,
                    timeout: 2000,
                    retryCount: 1,
                    cacheable: true
                },
                {
                    name: 'reliability_filtering',
                    processor: this.applyReliabilityFilter,
                    timeout: 500,
                    retryCount: 2
                },
                {
                    name: 'recommendation_generation',
                    processor: this.generateRecommendations,
                    timeout: 1000,
                    retryCount: 1
                }
            ],
            optimization: {
                enableCaching: true,
                enableBatching: false,
                enablePipelining: true
            }
        });
        
        // 学習フロー
        this.registerFlow('learning', {
            name: 'learning_flow',
            priority: 2,
            stages: [
                {
                    name: 'result_processing',
                    processor: this.processRaceResults,
                    timeout: 1000,
                    retryCount: 3
                },
                {
                    name: 'model_update',
                    processor: this.updateLearningModel,
                    timeout: 3000,
                    retryCount: 2,
                    batchable: true
                },
                {
                    name: 'pattern_analysis',
                    processor: this.analyzePatterns,
                    timeout: 2000,
                    retryCount: 1
                }
            ],
            optimization: {
                enableCaching: false,
                enableBatching: true,
                enablePipelining: false
            }
        });
        
        // 投資戦略フロー
        this.registerFlow('investment', {
            name: 'investment_flow',
            priority: 3,
            stages: [
                {
                    name: 'risk_assessment',
                    processor: this.assessRisk,
                    timeout: 800,
                    retryCount: 2
                },
                {
                    name: 'allocation_optimization',
                    processor: this.optimizeAllocation,
                    timeout: 1500,
                    retryCount: 1,
                    cacheable: true
                },
                {
                    name: 'kelly_calculation',
                    processor: this.calculateKellyRatio,
                    timeout: 300,
                    retryCount: 2
                }
            ],
            optimization: {
                enableCaching: true,
                enableBatching: false,
                enablePipelining: true
            }
        });
        
        console.log(`✅ ${this.flows.size} 個の標準データフロー登録完了`);
    }

    // データフロー登録
    static registerFlow(flowId, flowConfig) {
        console.log(`📝 データフロー登録: ${flowId}`);
        
        // フロー設定の検証
        if (!flowConfig.name || !flowConfig.stages || !Array.isArray(flowConfig.stages)) {
            throw new Error(`Invalid flow configuration for ${flowId}`);
        }
        
        // 最適化設定のデフォルト値設定
        flowConfig.optimization = {
            enableCaching: this.config.enableCaching,
            enableBatching: this.config.enableBatching,
            enablePipelining: this.config.enablePipelining,
            ...flowConfig.optimization
        };
        
        // メトリクス初期化
        this.metrics.set(flowId, {
            executionCount: 0,
            totalExecutionTime: 0,
            averageExecutionTime: 0,
            errorCount: 0,
            cacheHits: 0,
            cacheMisses: 0,
            lastExecution: null
        });
        
        this.flows.set(flowId, flowConfig);
        
        console.log(`✅ データフロー ${flowId} 登録完了`);
    }

    // データフロー実行
    static async executeFlow(flowId, data, options = {}) {
        console.log(`🔄 データフロー実行: ${flowId}`);
        
        const flow = this.flows.get(flowId);
        if (!flow) {
            throw new Error(`Flow ${flowId} not found`);
        }
        
        const executionId = Date.now() + Math.random();
        const startTime = performance.now();
        
        try {
            // キャッシュチェック
            const cacheKey = this.generateCacheKey(flowId, data);
            if (flow.optimization.enableCaching && this.cache.has(cacheKey)) {
                const cachedResult = this.cache.get(cacheKey);
                if (this.isCacheValid(cachedResult)) {
                    console.log(`⚡ キャッシュヒット: ${flowId}`);
                    this.updateMetrics(flowId, 0, true);
                    return cachedResult.data;
                }
            }
            
            // パイプライン実行
            let result = data;
            if (flow.optimization.enablePipelining) {
                result = await this.executePipeline(flow, result, executionId);
            } else {
                result = await this.executeSequential(flow, result, executionId);
            }
            
            // 結果をキャッシュ
            if (flow.optimization.enableCaching) {
                this.cacheResult(cacheKey, result);
            }
            
            // メトリクス更新
            const executionTime = performance.now() - startTime;
            this.updateMetrics(flowId, executionTime, false);
            
            console.log(`✅ データフロー完了: ${flowId} (${executionTime.toFixed(2)}ms)`);
            
            return result;
            
        } catch (error) {
            console.error(`❌ データフロー実行エラー: ${flowId}`, error);
            this.updateMetrics(flowId, 0, false, true);
            throw error;
        }
    }

    // パイプライン実行
    static async executePipeline(flow, data, executionId) {
        console.log(`🔗 パイプライン実行: ${flow.name}`);
        
        const stages = flow.stages;
        const results = [];
        
        // 並列実行可能なステージの特定
        const parallelStages = this.identifyParallelStages(stages);
        
        for (const stageGroup of parallelStages) {
            if (stageGroup.length === 1) {
                // 単一ステージの実行
                const stage = stageGroup[0];
                data = await this.executeStage(stage, data, executionId);
                results.push(data);
            } else {
                // 並列ステージの実行
                const promises = stageGroup.map(stage => 
                    this.executeStage(stage, data, executionId)
                );
                const parallelResults = await Promise.all(promises);
                // 結果をマージ
                data = this.mergeResults(parallelResults);
                results.push(data);
            }
        }
        
        return data;
    }

    // 順次実行
    static async executeSequential(flow, data, executionId) {
        console.log(`📋 順次実行: ${flow.name}`);
        
        for (const stage of flow.stages) {
            data = await this.executeStage(stage, data, executionId);
        }
        
        return data;
    }

    // ステージ実行
    static async executeStage(stage, data, executionId) {
        console.log(`⚙️ ステージ実行: ${stage.name}`);
        
        const startTime = performance.now();
        
        try {
            // タイムアウト設定
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`Stage timeout: ${stage.name}`)), 
                    stage.timeout || 5000);
            });
            
            // ステージ処理実行
            const stagePromise = stage.processor(data, { executionId, stage });
            
            // レース実行
            const result = await Promise.race([stagePromise, timeoutPromise]);
            
            const executionTime = performance.now() - startTime;
            console.log(`✅ ステージ完了: ${stage.name} (${executionTime.toFixed(2)}ms)`);
            
            return result;
            
        } catch (error) {
            console.error(`❌ ステージエラー: ${stage.name}`, error);
            
            // リトライ処理
            if ((stage.retryCount || 0) > 0) {
                console.log(`🔄 リトライ: ${stage.name}`);
                stage.retryCount--;
                return await this.executeStage(stage, data, executionId);
            }
            
            throw error;
        }
    }

    // 並列ステージ特定
    static identifyParallelStages(stages) {
        // 依存関係を考慮した並列実行グループの特定
        const groups = [];
        const processed = new Set();
        
        for (const stage of stages) {
            if (!processed.has(stage.name)) {
                const parallelGroup = [stage];
                processed.add(stage.name);
                
                // 依存関係のない他のステージを特定
                for (const otherStage of stages) {
                    if (!processed.has(otherStage.name) && 
                        !this.hasDependency(stage, otherStage)) {
                        parallelGroup.push(otherStage);
                        processed.add(otherStage.name);
                    }
                }
                
                groups.push(parallelGroup);
            }
        }
        
        return groups;
    }

    // 依存関係チェック
    static hasDependency(stage1, stage2) {
        // 簡単な依存関係チェック（必要に応じて拡張）
        const dependencies = {
            'prediction_execution': ['data_validation'],
            'reliability_filtering': ['prediction_execution'],
            'recommendation_generation': ['reliability_filtering'],
            'model_update': ['result_processing'],
            'allocation_optimization': ['risk_assessment'],
            'kelly_calculation': ['allocation_optimization']
        };
        
        return dependencies[stage2.name]?.includes(stage1.name) || false;
    }

    // 結果マージ
    static mergeResults(results) {
        // 結果の統合（タイプに応じて適切にマージ）
        if (results.length === 1) {
            return results[0];
        }
        
        // 配列の場合は結合
        if (Array.isArray(results[0])) {
            return results.flat();
        }
        
        // オブジェクトの場合はマージ
        if (typeof results[0] === 'object') {
            return Object.assign({}, ...results);
        }
        
        return results[0];
    }

    // キャッシュキー生成
    static generateCacheKey(flowId, data) {
        const dataString = JSON.stringify(data);
        return `${flowId}_${this.hashString(dataString)}`;
    }

    // 文字列ハッシュ
    static hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32bit整数に変換
        }
        return hash;
    }

    // キャッシュ有効性チェック
    static isCacheValid(cachedResult) {
        const now = Date.now();
        return (now - cachedResult.timestamp) < this.config.cacheTimeout;
    }

    // 結果キャッシュ
    static cacheResult(cacheKey, data) {
        // キャッシュサイズ制限チェック
        if (this.cache.size >= this.config.maxCacheSize) {
            // 古いエントリを削除
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
        
        this.cache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });
    }

    // キャッシュクリーンアップ
    static startCacheCleanup() {
        setInterval(() => {
            const now = Date.now();
            for (const [key, cached] of this.cache.entries()) {
                if ((now - cached.timestamp) > this.config.cacheTimeout) {
                    this.cache.delete(key);
                }
            }
        }, 60000); // 1分間隔でクリーンアップ
    }

    // メトリクス更新
    static updateMetrics(flowId, executionTime, isCacheHit, isError = false) {
        const metrics = this.metrics.get(flowId);
        if (!metrics) return;
        
        metrics.executionCount++;
        metrics.lastExecution = new Date();
        
        if (isCacheHit) {
            metrics.cacheHits++;
        } else {
            metrics.cacheMisses++;
            metrics.totalExecutionTime += executionTime;
            metrics.averageExecutionTime = metrics.totalExecutionTime / (metrics.executionCount - metrics.cacheHits);
        }
        
        if (isError) {
            metrics.errorCount++;
        }
    }

    // パフォーマンス監視
    static startPerformanceMonitoring() {
        setInterval(() => {
            for (const [flowId, metrics] of this.metrics.entries()) {
                if (metrics.averageExecutionTime > this.config.performanceThreshold) {
                    console.warn(`⚠️ パフォーマンス警告: ${flowId} 平均実行時間 ${metrics.averageExecutionTime.toFixed(2)}ms`);
                }
            }
        }, 30000); // 30秒間隔
    }

    // ステージプロセッサ実装
    static async validateInputData(data, context) {
        // 入力データの検証
        if (!Array.isArray(data)) {
            throw new Error('Input data must be an array');
        }
        
        return data.filter(item => 
            item && typeof item === 'object' && 
            item.name && typeof item.odds === 'number'
        );
    }

    static async executePrediction(data, context) {
        // 予測エンジンの実行
        if (typeof window.PredictionEngine === 'undefined') {
            throw new Error('PredictionEngine not available');
        }
        
        const engine = new window.PredictionEngine();
        if (engine.calculateHorsePredictions) {
            return engine.calculateHorsePredictions(data);
        } else if (engine.calculatePredictions) {
            return engine.calculatePredictions();
        } else {
            throw new Error('No prediction method available');
        }
    }

    static async applyReliabilityFilter(data, context) {
        // 信頼度フィルタリング
        if (typeof window.ReliabilityFilter === 'undefined') {
            return data;
        }
        
        return window.ReliabilityFilter.filterRecommendations(data);
    }

    static async generateRecommendations(data, context) {
        // 推奨生成
        if (typeof window.BettingRecommender === 'undefined') {
            return data;
        }
        
        const recommender = new window.BettingRecommender();
        return recommender.generateBettingRecommendations(data);
    }

    static async processRaceResults(data, context) {
        // レース結果処理
        if (typeof window.LearningSystem === 'undefined') {
            return data;
        }
        
        return window.LearningSystem.processRaceResult(data);
    }

    static async updateLearningModel(data, context) {
        // 学習モデル更新
        if (typeof window.EnhancedLearningSystem === 'undefined') {
            return data;
        }
        
        return window.EnhancedLearningSystem.updateModel(data);
    }

    static async analyzePatterns(data, context) {
        // パターン分析
        if (typeof window.ProfitabilityPatternAnalyzer === 'undefined') {
            return data;
        }
        
        return window.ProfitabilityPatternAnalyzer.analyzePattern(data);
    }

    static async assessRisk(data, context) {
        // リスク評価
        if (typeof window.RiskManagementInvestmentSystem === 'undefined') {
            return data;
        }
        
        return window.RiskManagementInvestmentSystem.assessRisk(data);
    }

    static async optimizeAllocation(data, context) {
        // 投資配分最適化
        if (typeof window.RiskManagementInvestmentSystem === 'undefined') {
            return data;
        }
        
        return window.RiskManagementInvestmentSystem.optimizeAllocation(data);
    }

    static async calculateKellyRatio(data, context) {
        // ケリー比率計算
        if (typeof window.KellyBettingSystem === 'undefined') {
            return data;
        }
        
        return window.KellyBettingSystem.calculateKellyRatio(data);
    }

    // システム統計取得
    static getSystemStats() {
        const stats = {
            totalFlows: this.flows.size,
            cacheSize: this.cache.size,
            cacheHitRate: 0,
            averageExecutionTime: 0,
            totalExecutions: 0,
            errorRate: 0
        };
        
        let totalExecutions = 0;
        let totalCacheHits = 0;
        let totalExecutionTime = 0;
        let totalErrors = 0;
        
        for (const metrics of this.metrics.values()) {
            totalExecutions += metrics.executionCount;
            totalCacheHits += metrics.cacheHits;
            totalExecutionTime += metrics.totalExecutionTime;
            totalErrors += metrics.errorCount;
        }
        
        if (totalExecutions > 0) {
            stats.cacheHitRate = (totalCacheHits / totalExecutions) * 100;
            stats.averageExecutionTime = totalExecutionTime / (totalExecutions - totalCacheHits);
            stats.errorRate = (totalErrors / totalExecutions) * 100;
        }
        
        stats.totalExecutions = totalExecutions;
        
        return stats;
    }
}

// 自動初期化
if (typeof window !== 'undefined') {
    // DOM読み込み完了後に初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            DataFlowOptimizer.initialize();
        });
    } else {
        DataFlowOptimizer.initialize();
    }
}