// Phase 4: パフォーマンス最適化システム
class PerformanceOptimizer {
    // パフォーマンス監視データ
    static metrics = new Map();
    static benchmarks = new Map();
    static optimizationHistory = [];
    static isMonitoring = false;
    static optimizationConfig = {
        memoryThreshold: 150 * 1024 * 1024, // 150MB (調整)
        executionTimeThreshold: 5000, // 5秒 (調整)
        cacheHitRateThreshold: 0.5, // 50% (調整)
        errorRateThreshold: 0.1, // 10% (調整)
        optimizationInterval: 120000, // 2分 (調整)
        monitoringInterval: 15000 // 15秒 (調整)
    };

    // 最適化戦略
    static optimizationStrategies = {
        memory: {
            name: 'メモリ最適化',
            actions: ['clearCache', 'garbageCollection', 'reduceDataSize'],
            priority: 'high'
        },
        computation: {
            name: '計算最適化',
            actions: ['enableCaching', 'optimizeAlgorithms', 'reduceComplexity'],
            priority: 'medium'
        },
        io: {
            name: 'I/O最適化',
            actions: ['batchOperations', 'asyncProcessing', 'reduceDataTransfer'],
            priority: 'medium'
        },
        ui: {
            name: 'UI最適化',
            actions: ['debounceEvents', 'virtualizeList', 'lazyLoading'],
            priority: 'low'
        }
    };

    // 初期化
    static initialize() {
        console.log('⚡ パフォーマンス最適化システム初期化');
        
        // ベンチマーク設定
        this.setupBenchmarks();
        
        // 監視開始
        this.startMonitoring();
        
        // 最適化スケジューラー開始
        this.startOptimizationScheduler();
        
        // メモリ監視
        this.startMemoryMonitoring();
        
        // パフォーマンス観測器設定
        this.setupPerformanceObserver();
        
        console.log('✅ パフォーマンス最適化システム初期化完了');
    }

    // ベンチマーク設定
    static setupBenchmarks() {
        console.log('📊 ベンチマーク設定');
        
        // システム別のベンチマーク定義
        const systemBenchmarks = {
            'PredictionEngine': {
                expectedExecutionTime: 500, // 500ms
                maxMemoryUsage: 10 * 1024 * 1024, // 10MB
                minAccuracy: 0.6
            },
            'BettingRecommender': {
                expectedExecutionTime: 300,
                maxMemoryUsage: 5 * 1024 * 1024,
                minRecommendationCount: 3
            },
            'LearningSystem': {
                expectedExecutionTime: 1500,
                maxMemoryUsage: 20 * 1024 * 1024,
                minLearningRate: 0.01
            },
            'DataFlowOptimizer': {
                expectedExecutionTime: 100,
                maxMemoryUsage: 15 * 1024 * 1024,
                minCacheHitRate: 0.8
            }
        };
        
        for (const [systemName, benchmark] of Object.entries(systemBenchmarks)) {
            this.benchmarks.set(systemName, {
                ...benchmark,
                lastMeasurement: null,
                performanceScore: 100,
                alerts: []
            });
        }
        
        console.log(`✅ ${this.benchmarks.size} 個のベンチマーク設定完了`);
    }

    // 監視開始
    static startMonitoring() {
        console.log('👁️ パフォーマンス監視開始');
        
        this.isMonitoring = true;
        
        // 定期的な監視
        setInterval(() => {
            this.collectMetrics();
            this.analyzePerformance();
        }, this.optimizationConfig.monitoringInterval);
        
        console.log('✅ パフォーマンス監視開始完了');
    }

    // メトリクス収集
    static collectMetrics() {
        const now = Date.now();
        
        // システム全体のメトリクス
        const systemMetrics = {
            timestamp: now,
            memory: this.getMemoryMetrics(),
            timing: this.getTimingMetrics(),
            network: this.getNetworkMetrics(),
            cache: this.getCacheMetrics(),
            errors: this.getErrorMetrics()
        };
        
        // 履歴に追加
        if (!this.metrics.has('system')) {
            this.metrics.set('system', []);
        }
        
        const systemHistory = this.metrics.get('system');
        systemHistory.push(systemMetrics);
        
        // 履歴制限（直近1000件）
        if (systemHistory.length > 1000) {
            systemHistory.shift();
        }
        
        // 個別システムのメトリクス収集
        this.collectSystemSpecificMetrics();
    }

    // メモリメトリクス取得
    static getMemoryMetrics() {
        const metrics = {
            used: 0,
            total: 0,
            percentage: 0
        };
        
        if (performance.memory) {
            metrics.used = performance.memory.usedJSHeapSize;
            metrics.total = performance.memory.totalJSHeapSize;
            metrics.percentage = (metrics.used / metrics.total) * 100;
        }
        
        return metrics;
    }

    // タイミングメトリクス取得
    static getTimingMetrics() {
        const entries = performance.getEntriesByType('measure');
        const metrics = {
            averageExecutionTime: 0,
            maxExecutionTime: 0,
            minExecutionTime: Infinity,
            totalMeasurements: entries.length
        };
        
        if (entries.length > 0) {
            const durations = entries.map(entry => entry.duration);
            metrics.averageExecutionTime = durations.reduce((a, b) => a + b, 0) / durations.length;
            metrics.maxExecutionTime = Math.max(...durations);
            metrics.minExecutionTime = Math.min(...durations);
        }
        
        return metrics;
    }

    // ネットワークメトリクス取得
    static getNetworkMetrics() {
        const entries = performance.getEntriesByType('navigation');
        const metrics = {
            domContentLoaded: 0,
            loadComplete: 0,
            responseTime: 0
        };
        
        if (entries.length > 0) {
            const navigation = entries[0];
            metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
            metrics.loadComplete = navigation.loadEventEnd - navigation.loadEventStart;
            metrics.responseTime = navigation.responseEnd - navigation.requestStart;
        }
        
        return metrics;
    }

    // キャッシュメトリクス取得
    static getCacheMetrics() {
        const metrics = {
            hitRate: 0,
            size: 0,
            hits: 0,
            misses: 0
        };
        
        // DataFlowOptimizerからキャッシュ統計取得
        if (typeof window.DataFlowOptimizer !== 'undefined') {
            const stats = window.DataFlowOptimizer.getSystemStats();
            metrics.hitRate = stats.cacheHitRate || 0;
            metrics.size = stats.cacheSize || 0;
        }
        
        return metrics;
    }

    // エラーメトリクス取得
    static getErrorMetrics() {
        const metrics = {
            errorRate: 0,
            totalErrors: 0,
            recentErrors: 0
        };
        
        // IntegratedControlEngineからエラー統計取得
        if (typeof window.IntegratedControlEngine !== 'undefined') {
            const status = window.IntegratedControlEngine.getSystemStatus();
            metrics.totalErrors = status.errorCount || 0;
        }
        
        return metrics;
    }

    // 個別システムメトリクス収集
    static collectSystemSpecificMetrics() {
        // SystemInterfaceUnificationから個別システムの統計取得
        if (typeof window.SystemInterfaceUnification !== 'undefined') {
            const systemStatus = window.SystemInterfaceUnification.getSystemStatus();
            
            // 各システムの詳細メトリクス
            for (const [systemName, benchmark] of this.benchmarks) {
                const systemDetails = window.SystemInterfaceUnification.getSystemDetails(systemName);
                
                if (systemDetails) {
                    const metrics = {
                        timestamp: Date.now(),
                        callCount: systemDetails.callCount,
                        errorCount: systemDetails.errorCount,
                        averageResponseTime: systemStatus.averageResponseTime || 0,
                        lastActivity: systemDetails.lastActivity
                    };
                    
                    if (!this.metrics.has(systemName)) {
                        this.metrics.set(systemName, []);
                    }
                    
                    this.metrics.get(systemName).push(metrics);
                }
            }
        }
    }

    // パフォーマンス分析
    static analyzePerformance() {
        const systemMetrics = this.metrics.get('system');
        if (!systemMetrics || systemMetrics.length === 0) return;
        
        const latest = systemMetrics[systemMetrics.length - 1];
        const issues = [];
        
        // メモリ使用量チェック
        if (latest.memory.used > this.optimizationConfig.memoryThreshold) {
            issues.push({
                type: 'memory',
                severity: 'high',
                message: `メモリ使用量が閾値を超過: ${(latest.memory.used / 1024 / 1024).toFixed(2)}MB`,
                recommendation: 'メモリ最適化を実行'
            });
        }
        
        // 実行時間チェック
        if (latest.timing.averageExecutionTime > this.optimizationConfig.executionTimeThreshold) {
            issues.push({
                type: 'computation',
                severity: 'medium',
                message: `平均実行時間が閾値を超過: ${latest.timing.averageExecutionTime.toFixed(2)}ms`,
                recommendation: '計算最適化を実行'
            });
        }
        
        // キャッシュヒット率チェック
        if (latest.cache.hitRate < this.optimizationConfig.cacheHitRateThreshold) {
            issues.push({
                type: 'cache',
                severity: 'low',
                message: `キャッシュヒット率が低い: ${(latest.cache.hitRate * 100).toFixed(1)}%`,
                recommendation: 'キャッシュ戦略を最適化'
            });
        }
        
        // 問題が検出された場合の対応
        if (issues.length > 0) {
            console.warn('⚠️ パフォーマンス問題を検出:', issues);
            this.triggerOptimization(issues);
        }
    }

    // 最適化実行
    static triggerOptimization(issues) {
        console.log('🔧 パフォーマンス最適化実行');
        
        const optimizationPlan = this.createOptimizationPlan(issues);
        
        for (const action of optimizationPlan) {
            try {
                this.executeOptimizationAction(action);
                
                // 最適化履歴に記録
                this.optimizationHistory.push({
                    timestamp: new Date(),
                    action: action.type,
                    reason: action.reason,
                    success: true
                });
                
            } catch (error) {
                console.error(`❌ 最適化アクション失敗: ${action.type}`, error);
                
                this.optimizationHistory.push({
                    timestamp: new Date(),
                    action: action.type,
                    reason: action.reason,
                    success: false,
                    error: error.message
                });
            }
        }
    }

    // 最適化計画作成
    static createOptimizationPlan(issues) {
        const plan = [];
        
        // 重要度順にソート
        issues.sort((a, b) => {
            const severity = { high: 3, medium: 2, low: 1 };
            return severity[b.severity] - severity[a.severity];
        });
        
        for (const issue of issues) {
            const strategy = this.optimizationStrategies[issue.type];
            if (strategy) {
                for (const action of strategy.actions) {
                    plan.push({
                        type: action,
                        reason: issue.message,
                        priority: strategy.priority
                    });
                }
            }
        }
        
        return plan;
    }

    // 最適化アクション実行
    static executeOptimizationAction(action) {
        console.log(`🔧 最適化アクション実行: ${action.type}`);
        
        switch (action.type) {
            case 'clearCache':
                this.clearSystemCache();
                break;
            case 'garbageCollection':
                this.triggerGarbageCollection();
                break;
            case 'reduceDataSize':
                this.reduceDataSize();
                break;
            case 'enableCaching':
                this.optimizeCaching();
                break;
            case 'optimizeAlgorithms':
                this.optimizeAlgorithms();
                break;
            case 'batchOperations':
                this.optimizeBatchOperations();
                break;
            case 'asyncProcessing':
                this.optimizeAsyncProcessing();
                break;
            case 'debounceEvents':
                this.optimizeEventHandling();
                break;
            default:
                console.warn(`⚠️ 未実装の最適化アクション: ${action.type}`);
        }
    }

    // システムキャッシュクリア
    static clearSystemCache() {
        console.log('🧹 システムキャッシュクリア');
        
        // DataFlowOptimizerのキャッシュクリア
        if (typeof window.DataFlowOptimizer !== 'undefined') {
            window.DataFlowOptimizer.cache.clear();
        }
        
        // ブラウザキャッシュの部分クリア
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    if (name.includes('temp') || name.includes('cache')) {
                        caches.delete(name);
                    }
                });
            });
        }
    }

    // ガベージコレクション実行
    static triggerGarbageCollection() {
        console.log('🗑️ ガベージコレクション実行');
        
        // 不要な参照を削除
        this.cleanupReferences();
        
        // 強制的なガベージコレクション（開発環境）
        if (window.gc && typeof window.gc === 'function') {
            window.gc();
        }
    }

    // データサイズ削減
    static reduceDataSize() {
        console.log('📦 データサイズ削減');
        
        // 古いメトリクスデータを削除
        for (const [key, metrics] of this.metrics) {
            if (metrics.length > 100) {
                this.metrics.set(key, metrics.slice(-100));
            }
        }
        
        // 最適化履歴制限
        if (this.optimizationHistory.length > 50) {
            this.optimizationHistory = this.optimizationHistory.slice(-50);
        }
    }

    // キャッシュ最適化
    static optimizeCaching() {
        console.log('⚡ キャッシュ最適化');
        
        // DataFlowOptimizerのキャッシュ設定最適化
        if (typeof window.DataFlowOptimizer !== 'undefined') {
            window.DataFlowOptimizer.config.enableCaching = true;
            window.DataFlowOptimizer.config.maxCacheSize = 2000;
        }
    }

    // アルゴリズム最適化
    static optimizeAlgorithms() {
        console.log('🧠 アルゴリズム最適化');
        
        // 計算量の多い処理の最適化
        // 具体的な最適化は各システムに委譲
        if (typeof window.PredictionEngine !== 'undefined') {
            // 予測精度を維持しながら計算量を削減
            const engine = new window.PredictionEngine();
            if (engine.optimizeCalculations) {
                engine.optimizeCalculations();
            }
        }
    }

    // バッチ処理最適化
    static optimizeBatchOperations() {
        console.log('📋 バッチ処理最適化');
        
        // DataFlowOptimizerのバッチ設定最適化
        if (typeof window.DataFlowOptimizer !== 'undefined') {
            window.DataFlowOptimizer.config.enableBatching = true;
            window.DataFlowOptimizer.config.batchSize = 100;
        }
    }

    // 非同期処理最適化
    static optimizeAsyncProcessing() {
        console.log('🔄 非同期処理最適化');
        
        // 非同期処理の並列度を最適化
        if (typeof window.DataFlowOptimizer !== 'undefined') {
            window.DataFlowOptimizer.config.maxConcurrentFlows = 5;
        }
    }

    // イベントハンドリング最適化
    static optimizeEventHandling() {
        console.log('⚡ イベントハンドリング最適化');
        
        // デバウンス機能の追加
        this.addDebounceToEvents();
    }

    // 不要参照クリーンアップ
    static cleanupReferences() {
        // 循環参照の解除
        for (const [key, metrics] of this.metrics) {
            if (metrics.length > 0) {
                // 古いタイムスタンプのデータを削除
                const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24時間前
                this.metrics.set(key, metrics.filter(m => m.timestamp > cutoff));
            }
        }
    }

    // デバウンス機能追加
    static addDebounceToEvents() {
        // UI操作のデバウンス
        const debounceMap = new Map();
        
        ['click', 'scroll', 'resize'].forEach(eventType => {
            const originalHandler = window[`on${eventType}`];
            
            if (originalHandler) {
                window[`on${eventType}`] = this.debounce(originalHandler, 100);
            }
        });
    }

    // デバウンスユーティリティ
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 最適化スケジューラー
    static startOptimizationScheduler() {
        console.log('⏰ 最適化スケジューラー開始');
        
        // 定期的な最適化実行
        setInterval(() => {
            this.performScheduledOptimization();
        }, this.optimizationConfig.optimizationInterval);
    }

    // 定期最適化実行
    static performScheduledOptimization() {
        console.log('🔄 定期最適化実行');
        
        // 軽量な最適化を定期実行
        try {
            this.clearSystemCache();
            this.reduceDataSize();
            this.cleanupReferences();
            
            console.log('✅ 定期最適化完了');
        } catch (error) {
            console.error('❌ 定期最適化エラー:', error);
        }
    }

    // メモリ監視
    static startMemoryMonitoring() {
        console.log('💾 メモリ監視開始');
        
        setInterval(() => {
            if (performance.memory) {
                const memoryUsage = performance.memory.usedJSHeapSize;
                const memoryLimit = performance.memory.jsHeapSizeLimit;
                const usagePercentage = (memoryUsage / memoryLimit) * 100;
                
                if (usagePercentage > 80) {
                    console.warn(`⚠️ メモリ使用率が高い: ${usagePercentage.toFixed(1)}%`);
                    this.triggerOptimization([{
                        type: 'memory',
                        severity: 'high',
                        message: `メモリ使用率: ${usagePercentage.toFixed(1)}%`,
                        recommendation: 'メモリ最適化を実行'
                    }]);
                }
            }
        }, 30000); // 30秒間隔
    }

    // パフォーマンス観測器設定
    static setupPerformanceObserver() {
        console.log('📊 パフォーマンス観測器設定');
        
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 100) { // 100ms以上の処理を記録
                        console.log(`⏱️ 長時間処理検出: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
                    }
                }
            });
            
            observer.observe({ entryTypes: ['measure', 'navigation'] });
        }
    }

    // パフォーマンス統計取得
    static getPerformanceStats() {
        const stats = {
            systemMetrics: this.metrics.get('system')?.slice(-10) || [],
            optimizationHistory: this.optimizationHistory.slice(-20),
            benchmarkStatus: {},
            currentState: {
                isMonitoring: this.isMonitoring,
                memoryUsage: 0,
                averageExecutionTime: 0,
                cacheHitRate: 0
            }
        };
        
        // ベンチマーク状態
        for (const [systemName, benchmark] of this.benchmarks) {
            stats.benchmarkStatus[systemName] = {
                performanceScore: benchmark.performanceScore,
                alerts: benchmark.alerts,
                lastMeasurement: benchmark.lastMeasurement
            };
        }
        
        // 現在の状態
        const latest = stats.systemMetrics[stats.systemMetrics.length - 1];
        if (latest) {
            stats.currentState.memoryUsage = latest.memory.used;
            stats.currentState.averageExecutionTime = latest.timing.averageExecutionTime;
            stats.currentState.cacheHitRate = latest.cache.hitRate;
        }
        
        return stats;
    }
}

// 自動初期化
if (typeof window !== 'undefined') {
    // DOM読み込み完了後に初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            PerformanceOptimizer.initialize();
        });
    } else {
        PerformanceOptimizer.initialize();
    }
}