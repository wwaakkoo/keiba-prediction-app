// Phase 4: システム間インターフェース統合
class SystemInterfaceUnification {
    // システム登録テーブル
    static systemRegistry = new Map();
    static interfaceMap = new Map();
    static eventBus = new EventTarget();
    static messageQueue = [];
    static isInitialized = false;

    // 統一インターフェース定義
    static standardInterfaces = {
        Predictor: {
            methods: ['predict', 'updateModel', 'getConfidence'],
            events: ['prediction_complete', 'model_updated', 'confidence_changed'],
            dataFormat: {
                input: 'HorseData[]',
                output: 'PredictionResult[]'
            }
        },
        Recommender: {
            methods: ['generateRecommendations', 'filterRecommendations', 'adjustStrength'],
            events: ['recommendations_generated', 'recommendations_filtered', 'strength_adjusted'],
            dataFormat: {
                input: 'PredictionResult[]',
                output: 'RecommendationResult[]'
            }
        },
        Learner: {
            methods: ['learn', 'updateWeights', 'analyzePerformance'],
            events: ['learning_complete', 'weights_updated', 'performance_analyzed'],
            dataFormat: {
                input: 'RaceResult[]',
                output: 'LearningResult'
            }
        },
        InvestmentManager: {
            methods: ['calculateAllocation', 'assessRisk', 'optimizePortfolio'],
            events: ['allocation_calculated', 'risk_assessed', 'portfolio_optimized'],
            dataFormat: {
                input: 'RecommendationResult[]',
                output: 'InvestmentDecision[]'
            }
        },
        Analytics: {
            methods: ['analyze', 'generateReport', 'visualize'],
            events: ['analysis_complete', 'report_generated', 'visualization_ready'],
            dataFormat: {
                input: 'AnalysisData',
                output: 'AnalysisResult'
            }
        }
    };

    // 初期化
    static initialize() {
        console.log('🔗 システム間インターフェース統合初期化');
        
        // 既存システムの自動検出・登録
        this.detectExistingSystems();
        
        // 統一インターフェースの適用
        this.applyUnifiedInterfaces();
        
        // イベントバスの初期化
        this.initializeEventBus();
        
        // メッセージキューの処理開始
        this.startMessageProcessing();
        
        this.isInitialized = true;
        console.log('✅ システム間インターフェース統合初期化完了');
    }

    // 既存システムの自動検出
    static detectExistingSystems() {
        console.log('🔍 既存システム自動検出');
        
        const systemMappings = [
            // Phase 1 Systems
            { name: 'PredictionEngine', type: 'Predictor', instance: 'PredictionEngine' },
            { name: 'BettingRecommender', type: 'Recommender', instance: 'BettingRecommender' },
            { name: 'ReliabilityFilter', type: 'Recommender', instance: 'ReliabilityFilter' },
            { name: 'DynamicRecommendationAdjuster', type: 'Recommender', instance: 'DynamicRecommendationAdjuster' },
            { name: 'HitCriteriaSystem', type: 'Analytics', instance: 'HitCriteriaSystem' },
            
            // Phase 2 Systems
            { name: 'RiskManagementInvestmentSystem', type: 'InvestmentManager', instance: 'RiskManagementInvestmentSystem' },
            { name: 'KellyBettingSystem', type: 'InvestmentManager', instance: 'KellyBettingSystem' },
            { name: 'ProfitabilityPatternAnalyzer', type: 'Analytics', instance: 'ProfitabilityPatternAnalyzer' },
            { name: 'BetTypeOptimizationSystem', type: 'InvestmentManager', instance: 'BetTypeOptimizationSystem' },
            { name: 'DrawdownControlSystem', type: 'InvestmentManager', instance: 'DrawdownControlSystem' },
            
            // Phase 3 Systems
            { name: 'LearningSystem', type: 'Learner', instance: 'LearningSystem' },
            { name: 'EnhancedLearningSystem', type: 'Learner', instance: 'EnhancedLearningSystem' },
            { name: 'HybridLearningSystem', type: 'Learner', instance: 'HybridLearningSystem' },
            { name: 'AIRecommendationService', type: 'Recommender', instance: 'AIRecommendationService' },
            
            // Phase 4 Systems
            { name: 'IntegratedControlEngine', type: 'Analytics', instance: 'IntegratedControlEngine' },
            { name: 'DataFlowOptimizer', type: 'Analytics', instance: 'DataFlowOptimizer' }
        ];
        
        let detectedCount = 0;
        
        for (const mapping of systemMappings) {
            if (typeof window[mapping.instance] !== 'undefined') {
                this.registerSystem(mapping.name, {
                    type: mapping.type,
                    instance: window[mapping.instance],
                    originalName: mapping.instance,
                    phase: this.detectPhase(mapping.name),
                    status: 'active'
                });
                detectedCount++;
            }
        }
        
        console.log(`✅ ${detectedCount} 個のシステムを検出・登録完了`);
    }

    // システム登録
    static registerSystem(systemName, config) {
        console.log(`📝 システム登録: ${systemName}`);
        
        const systemConfig = {
            name: systemName,
            type: config.type,
            instance: config.instance,
            originalName: config.originalName,
            phase: config.phase,
            status: config.status || 'active',
            interfaces: new Map(),
            events: new Map(),
            lastActivity: new Date(),
            callCount: 0,
            errorCount: 0
        };
        
        // 統一インターフェースの適用
        this.applyStandardInterface(systemConfig);
        
        this.systemRegistry.set(systemName, systemConfig);
        
        console.log(`✅ システム ${systemName} 登録完了`);
    }

    // 統一インターフェースの適用
    static applyStandardInterface(systemConfig) {
        const interfaceSpec = this.standardInterfaces[systemConfig.type];
        if (!interfaceSpec) {
            console.warn(`⚠️ 未定義のシステムタイプ: ${systemConfig.type}`);
            return;
        }
        
        console.log(`🔧 統一インターフェース適用: ${systemConfig.name}`);
        
        // メソッドの統一化
        for (const method of interfaceSpec.methods) {
            if (typeof systemConfig.instance[method] === 'function') {
                // 既存メソッドをラップ
                systemConfig.interfaces.set(method, this.wrapMethod(systemConfig, method));
            } else {
                // 代替メソッドを探す
                const alternativeMethod = this.findAlternativeMethod(systemConfig.instance, method);
                if (alternativeMethod) {
                    systemConfig.interfaces.set(method, this.wrapMethod(systemConfig, alternativeMethod));
                } else {
                    // 静的メソッドの場合は警告を表示せず、スキップ
                    if (typeof systemConfig.instance[method] !== 'undefined' || 
                        this.isOptionalMethod(systemConfig.type, method)) {
                        // オプションメソッドの場合は警告なし
                    } else {
                        console.warn(`⚠️ メソッド ${method} が見つかりません: ${systemConfig.name}`);
                    }
                }
            }
        }
        
        // イベントの統一化
        for (const event of interfaceSpec.events) {
            systemConfig.events.set(event, []);
        }
    }

    // メソッドのラッピング
    static wrapMethod(systemConfig, methodName) {
        return async (...args) => {
            console.log(`📞 メソッド呼び出し: ${systemConfig.name}.${methodName}`);
            
            const startTime = performance.now();
            systemConfig.callCount++;
            systemConfig.lastActivity = new Date();
            
            try {
                // 入力データの検証
                const validatedArgs = this.validateInput(systemConfig.type, methodName, args);
                
                // 実際のメソッド実行
                const result = await systemConfig.instance[methodName](...validatedArgs);
                
                // 出力データの標準化
                const standardizedResult = this.standardizeOutput(systemConfig.type, methodName, result);
                
                // 実行時間記録
                const executionTime = performance.now() - startTime;
                this.recordMethodCall(systemConfig.name, methodName, executionTime, true);
                
                // イベント発行
                this.emitEvent(systemConfig.name, `${methodName}_complete`, standardizedResult);
                
                return standardizedResult;
                
            } catch (error) {
                console.error(`❌ メソッド実行エラー: ${systemConfig.name}.${methodName}`, error);
                systemConfig.errorCount++;
                
                // エラーイベント発行
                this.emitEvent(systemConfig.name, `${methodName}_error`, error);
                
                throw error;
            }
        };
    }

    // 代替メソッドの探索
    static findAlternativeMethod(instance, standardMethod) {
        const alternatives = {
            predict: ['predict', 'calculatePredictions', 'calculateHorsePredictions', 'execute', 'process', 'analyze'],
            updateModel: ['updateModel', 'update', 'learn', 'train'],
            getConfidence: ['getConfidence', 'confidence', 'reliability', 'getReliability'],
            generateRecommendations: ['generateRecommendations', 'generateBettingRecommendations', 'generateEnhancedRecommendations', 'recommend', 'getRecommendations'],
            filterRecommendations: ['filterRecommendations', 'filter', 'applyFilter'],
            adjustStrength: ['adjustStrength', 'adjust', 'modifyStrength', 'setStrength'],
            learn: ['learn', 'updateModel', 'processRaceResult', 'train'],
            updateWeights: ['updateWeights', 'updateModel', 'adjustWeights', 'learn'],
            analyzePerformance: ['analyzePerformance', 'analyze', 'evaluate', 'assess'],
            calculateAllocation: ['calculateAllocation', 'calculate', 'allocate', 'optimize'],
            assessRisk: ['assessRisk', 'calculateRisk', 'evaluateRisk', 'getRisk'],
            optimizePortfolio: ['optimizePortfolio', 'optimize', 'balance', 'allocate'],
            analyze: ['analyze', 'process', 'calculate', 'evaluate'],
            generateReport: ['generateReport', 'report', 'getReport', 'createReport'],
            visualize: ['visualize', 'display', 'render', 'show']
        };
        
        const possibleMethods = alternatives[standardMethod] || [standardMethod];
        
        for (const method of possibleMethods) {
            if (typeof instance[method] === 'function') {
                return method;
            }
        }
        
        return null;
    }

    // オプションメソッドかどうかの判定
    static isOptionalMethod(systemType, method) {
        const optionalMethods = {
            'Predictor': ['updateModel', 'getConfidence'],
            'Recommender': ['adjustStrength'],
            'Learner': ['updateWeights', 'analyzePerformance'],
            'InvestmentManager': ['optimizePortfolio'],
            'Analytics': ['generateReport', 'visualize']
        };
        
        return optionalMethods[systemType]?.includes(method) || false;
    }

    // 統一インターフェースの適用
    static applyUnifiedInterfaces() {
        console.log('🔄 統一インターフェース適用');
        
        for (const [systemName, systemConfig] of this.systemRegistry) {
            // 統一されたインターフェースオブジェクトの作成
            const unifiedInterface = {};
            
            for (const [methodName, wrappedMethod] of systemConfig.interfaces) {
                unifiedInterface[methodName] = wrappedMethod;
            }
            
            // グローバルアクセス用のプロキシ作成
            this.interfaceMap.set(systemName, unifiedInterface);
            
            // 統一されたインターフェースをwindowオブジェクトに公開
            window[`Unified${systemName}`] = unifiedInterface;
        }
        
        console.log('✅ 統一インターフェース適用完了');
    }

    // イベントバスの初期化
    static initializeEventBus() {
        console.log('📡 イベントバス初期化');
        
        // システム間通信のイベントリスナー設定
        this.eventBus.addEventListener('system_call', (event) => {
            this.handleSystemCall(event.detail);
        });
        
        this.eventBus.addEventListener('system_response', (event) => {
            this.handleSystemResponse(event.detail);
        });
        
        this.eventBus.addEventListener('system_error', (event) => {
            this.handleSystemError(event.detail);
        });
        
        console.log('✅ イベントバス初期化完了');
    }

    // イベント発行
    static emitEvent(systemName, eventName, data) {
        const event = new CustomEvent(eventName, {
            detail: {
                systemName,
                eventName,
                data,
                timestamp: new Date()
            }
        });
        
        this.eventBus.dispatchEvent(event);
        
        // システム固有のイベントリスナーにも通知
        const systemConfig = this.systemRegistry.get(systemName);
        if (systemConfig) {
            const listeners = systemConfig.events.get(eventName) || [];
            for (const listener of listeners) {
                try {
                    listener(data);
                } catch (error) {
                    console.error(`❌ イベントリスナーエラー: ${systemName}.${eventName}`, error);
                }
            }
        }
    }

    // システムコール
    static async callSystem(systemName, methodName, ...args) {
        console.log(`📞 システムコール: ${systemName}.${methodName}`);
        
        const unifiedInterface = this.interfaceMap.get(systemName);
        if (!unifiedInterface) {
            throw new Error(`System ${systemName} not found`);
        }
        
        const method = unifiedInterface[methodName];
        if (!method) {
            throw new Error(`Method ${methodName} not found in ${systemName}`);
        }
        
        // 非同期メッセージキューに追加
        return new Promise((resolve, reject) => {
            this.messageQueue.push({
                systemName,
                methodName,
                args,
                resolve,
                reject,
                timestamp: Date.now()
            });
        });
    }

    // メッセージキュー処理
    static startMessageProcessing() {
        console.log('📬 メッセージキュー処理開始');
        
        setInterval(async () => {
            if (this.messageQueue.length > 0) {
                const message = this.messageQueue.shift();
                
                try {
                    const unifiedInterface = this.interfaceMap.get(message.systemName);
                    const method = unifiedInterface[message.methodName];
                    
                    const result = await method(...message.args);
                    message.resolve(result);
                    
                } catch (error) {
                    message.reject(error);
                }
            }
        }, 10); // 10ms間隔で処理
    }

    // 入力データの検証
    static validateInput(systemType, methodName, args) {
        // 基本的な検証（必要に応じて拡張）
        if (!Array.isArray(args)) {
            throw new Error('Arguments must be an array');
        }
        
        // システムタイプ別の検証
        if (systemType === 'Predictor' && methodName === 'predict') {
            if (!Array.isArray(args[0])) {
                throw new Error('Prediction input must be an array');
            }
        }
        
        return args;
    }

    // 出力データの標準化
    static standardizeOutput(systemType, methodName, result) {
        // 基本的な標準化
        if (result === null || result === undefined) {
            return [];
        }
        
        // システムタイプ別の標準化
        if (systemType === 'Predictor' && methodName === 'predict') {
            if (!Array.isArray(result)) {
                return [result];
            }
        }
        
        return result;
    }

    // メソッド呼び出し記録
    static recordMethodCall(systemName, methodName, executionTime, success) {
        const systemConfig = this.systemRegistry.get(systemName);
        if (systemConfig) {
            if (!systemConfig.methodStats) {
                systemConfig.methodStats = new Map();
            }
            
            let stats = systemConfig.methodStats.get(methodName);
            if (!stats) {
                stats = {
                    callCount: 0,
                    successCount: 0,
                    errorCount: 0,
                    totalTime: 0,
                    averageTime: 0
                };
                systemConfig.methodStats.set(methodName, stats);
            }
            
            stats.callCount++;
            if (success) {
                stats.successCount++;
            } else {
                stats.errorCount++;
            }
            stats.totalTime += executionTime;
            stats.averageTime = stats.totalTime / stats.callCount;
        }
    }

    // フェーズ検出
    static detectPhase(systemName) {
        const phaseMapping = {
            'PredictionEngine': 'Phase1',
            'BettingRecommender': 'Phase1',
            'ReliabilityFilter': 'Phase1',
            'DynamicRecommendationAdjuster': 'Phase1',
            'HitCriteriaSystem': 'Phase1',
            'RiskManagementInvestmentSystem': 'Phase2',
            'KellyBettingSystem': 'Phase2',
            'ProfitabilityPatternAnalyzer': 'Phase2',
            'BetTypeOptimizationSystem': 'Phase2',
            'DrawdownControlSystem': 'Phase2',
            'LearningSystem': 'Phase3',
            'EnhancedLearningSystem': 'Phase3',
            'HybridLearningSystem': 'Phase3',
            'AIRecommendationService': 'Phase3',
            'IntegratedControlEngine': 'Phase4',
            'DataFlowOptimizer': 'Phase4'
        };
        
        return phaseMapping[systemName] || 'Unknown';
    }

    // システム状態取得
    static getSystemStatus() {
        const status = {
            totalSystems: this.systemRegistry.size,
            activeSystems: 0,
            systemsByType: {},
            systemsByPhase: {},
            totalCalls: 0,
            totalErrors: 0,
            averageResponseTime: 0
        };
        
        let totalTime = 0;
        let totalCalls = 0;
        
        for (const [systemName, systemConfig] of this.systemRegistry) {
            if (systemConfig.status === 'active') {
                status.activeSystems++;
            }
            
            // タイプ別カウント
            status.systemsByType[systemConfig.type] = (status.systemsByType[systemConfig.type] || 0) + 1;
            
            // フェーズ別カウント
            status.systemsByPhase[systemConfig.phase] = (status.systemsByPhase[systemConfig.phase] || 0) + 1;
            
            // 統計情報
            status.totalCalls += systemConfig.callCount;
            status.totalErrors += systemConfig.errorCount;
            
            if (systemConfig.methodStats) {
                for (const stats of systemConfig.methodStats.values()) {
                    totalTime += stats.totalTime;
                    totalCalls += stats.callCount;
                }
            }
        }
        
        if (totalCalls > 0) {
            status.averageResponseTime = totalTime / totalCalls;
        }
        
        return status;
    }

    // システム詳細情報取得
    static getSystemDetails(systemName) {
        const systemConfig = this.systemRegistry.get(systemName);
        if (!systemConfig) {
            return null;
        }
        
        return {
            name: systemConfig.name,
            type: systemConfig.type,
            phase: systemConfig.phase,
            status: systemConfig.status,
            lastActivity: systemConfig.lastActivity,
            callCount: systemConfig.callCount,
            errorCount: systemConfig.errorCount,
            availableMethods: Array.from(systemConfig.interfaces.keys()),
            methodStats: Object.fromEntries(systemConfig.methodStats || new Map())
        };
    }
}

// 自動初期化
if (typeof window !== 'undefined') {
    // DOM読み込み完了後に初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            SystemInterfaceUnification.initialize();
        });
    } else {
        SystemInterfaceUnification.initialize();
    }
}