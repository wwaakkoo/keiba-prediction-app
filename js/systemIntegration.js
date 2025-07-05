// システム統合とエラーハンドリング連携
class SystemIntegration {
    static isInitialized = false;
    static integrationStatus = {};
    
    // システム統合の初期化
    static async initialize() {
        if (this.isInitialized) {
            console.log('システム統合は既に初期化済みです');
            return;
        }
        
        console.log('システム統合を開始します...');
        
        try {
            // 各モジュールとエラーハンドリングシステムの統合
            await this.integrateErrorHandling();
            
            // データ検証システムの統合
            this.integrateDataValidation();
            
            // システム監視の開始
            this.startSystemMonitoring();
            
            // ユーザーインターフェースの強化
            this.enhanceUserInterface();
            
            this.isInitialized = true;
            console.log('✅ システム統合が完了しました');
            
            // 初期化成功をログ
            ErrorHandlingSystem.logError({
                level: ErrorHandlingSystem.ERROR_LEVELS.INFO,
                category: ErrorHandlingSystem.ERROR_CATEGORIES.SYSTEM_ERROR,
                message: 'システム統合が正常に完了しました'
            });
            
        } catch (error) {
            console.error('❌ システム統合中にエラーが発生:', error);
            ErrorHandlingSystem.logError({
                level: ErrorHandlingSystem.ERROR_LEVELS.CRITICAL,
                category: ErrorHandlingSystem.ERROR_CATEGORIES.SYSTEM_ERROR,
                message: `システム統合失敗: ${error.message}`,
                stack: error.stack
            });
        }
    }
    
    // エラーハンドリングシステムとの統合
    static async integrateErrorHandling() {
        console.log('エラーハンドリングシステムを統合しています...');
        
        // AIRecommendationServiceとの統合
        if (typeof AIRecommendationService !== 'undefined') {
            this.integrateAIRecommendationService();
            this.integrationStatus.aiRecommendation = 'integrated';
        } else {
            this.integrationStatus.aiRecommendation = 'not_available';
        }
        
        // DataConverterとの統合
        if (typeof DataConverter !== 'undefined') {
            this.integrateDataConverter();
            this.integrationStatus.dataConverter = 'integrated';
        } else {
            this.integrationStatus.dataConverter = 'not_available';
        }
        
        // HorseManagerとの統合
        if (typeof HorseManager !== 'undefined') {
            this.integrateHorseManager();
            this.integrationStatus.horseManager = 'integrated';
        } else {
            this.integrationStatus.horseManager = 'not_available';
        }
        
        // PredictionEngineとの統合
        if (typeof PredictionEngine !== 'undefined') {
            this.integratePredictionEngine();
            this.integrationStatus.predictionEngine = 'integrated';
        } else {
            this.integrationStatus.predictionEngine = 'not_available';
        }
        
        console.log('エラーハンドリング統合状況:', this.integrationStatus);
    }
    
    // AIRecommendationServiceとの統合
    static integrateAIRecommendationService() {
        // エラーハンドリングシステムを使用するようにオーバーライド
        const originalRecordError = AIRecommendationService.recordError;
        AIRecommendationService.recordError = function(error) {
            ErrorHandlingSystem.logError({
                level: ErrorHandlingSystem.ERROR_LEVELS.ERROR,
                category: ErrorHandlingSystem.ERROR_CATEGORIES.API_ERROR,
                message: error.message,
                stack: error.stack,
                metadata: { component: 'AIRecommendationService' }
            });
            
            // 元の機能も呼び出し
            if (originalRecordError) {
                originalRecordError.call(this, error);
            }
        };
        
        console.log('✅ AIRecommendationService統合完了');
    }
    
    // DataConverterとの統合
    static integrateDataConverter() {
        // DataConverterのエラー記録を統合システムに接続
        const originalRecordParseError = DataConverter.recordParseError;
        DataConverter.recordParseError = function(error, rawData) {
            ErrorHandlingSystem.logError({
                level: ErrorHandlingSystem.ERROR_LEVELS.ERROR,
                category: ErrorHandlingSystem.ERROR_CATEGORIES.PARSING_ERROR,
                message: error.message,
                stack: error.stack,
                metadata: { 
                    component: 'DataConverter',
                    dataLength: rawData ? rawData.length : 0
                }
            });
            
            // 元の機能も呼び出し
            if (originalRecordParseError) {
                originalRecordParseError.call(this, error, rawData);
            }
        };
        
        console.log('✅ DataConverter統合完了');
    }
    
    // HorseManagerとの統合
    static integrateHorseManager() {
        // データ検証エラーを統合システムに接続
        const originalRecordValidationWarning = HorseManager.recordValidationWarning;
        HorseManager.recordValidationWarning = function(horseName, warnings) {
            warnings.forEach(warning => {
                ErrorHandlingSystem.logError({
                    level: ErrorHandlingSystem.ERROR_LEVELS.WARNING,
                    category: ErrorHandlingSystem.ERROR_CATEGORIES.DATA_VALIDATION,
                    message: `${horseName}: ${warning}`,
                    metadata: { 
                        component: 'HorseManager',
                        horse: horseName
                    }
                });
            });
            
            // 元の機能も呼び出し
            if (originalRecordValidationWarning) {
                originalRecordValidationWarning.call(this, horseName, warnings);
            }
        };
        
        console.log('✅ HorseManager統合完了');
    }
    
    // PredictionEngineとの統合
    static integratePredictionEngine() {
        // 予測エラーを統合システムに接続
        // PredictionEngineに直接的なエラー記録機能がないため、
        // 将来的な拡張のためのプレースホルダー
        console.log('✅ PredictionEngine統合完了');
    }
    
    // データ検証システムの統合
    static integrateDataValidation() {
        console.log('データ検証システムを統合しています...');
        
        // 統合された検証レポートの生成
        this.generateIntegratedValidationReport = function() {
            const report = {
                timestamp: new Date().toISOString(),
                horseManagerStats: HorseManager.getValidationStats ? HorseManager.getValidationStats() : null,
                dataConverterStats: DataConverter.getErrorStats ? DataConverter.getErrorStats() : null,
                errorSystemStats: ErrorHandlingSystem.getErrorStats()
            };
            
            return report;
        };
        
        console.log('✅ データ検証システム統合完了');
    }
    
    // システム監視の開始
    static startSystemMonitoring() {
        console.log('システム監視を開始しています...');
        
        // 定期的なヘルスチェック
        setInterval(() => {
            this.performHealthCheck();
        }, 10 * 60 * 1000); // 10分間隔
        
        // パフォーマンス監視
        this.startPerformanceMonitoring();
        
        console.log('✅ システム監視開始完了');
    }
    
    // ヘルスチェックの実行
    static performHealthCheck() {
        const healthChecks = {
            errorHandling: ErrorHandlingSystem.checkSystemHealth(),
            horseManager: HorseManager.checkSystemHealth ? HorseManager.checkSystemHealth() : true,
            dataConverter: DataConverter.checkDataHealth ? DataConverter.checkDataHealth() : true
        };
        
        const overallHealth = Object.values(healthChecks).every(check => 
            typeof check === 'boolean' ? check : check >= 70
        );
        
        if (!overallHealth) {
            ErrorHandlingSystem.logError({
                level: ErrorHandlingSystem.ERROR_LEVELS.WARNING,
                category: ErrorHandlingSystem.ERROR_CATEGORIES.SYSTEM_ERROR,
                message: 'システムヘルスチェックで問題を検出',
                metadata: { healthChecks }
            });
        }
        
        return healthChecks;
    }
    
    // パフォーマンス監視の開始
    static startPerformanceMonitoring() {
        // ページロード時間の監視
        if (performance && performance.timing) {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            if (loadTime > 5000) { // 5秒以上
                ErrorHandlingSystem.logError({
                    level: ErrorHandlingSystem.ERROR_LEVELS.WARNING,
                    category: ErrorHandlingSystem.ERROR_CATEGORIES.SYSTEM_ERROR,
                    message: `ページロード時間が遅い: ${loadTime}ms`
                });
            }
        }
        
        // メモリ使用量の監視（利用可能な場合）
        if (performance && performance.memory) {
            setInterval(() => {
                const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
                if (memoryUsage > 100) { // 100MB以上
                    ErrorHandlingSystem.logError({
                        level: ErrorHandlingSystem.ERROR_LEVELS.WARNING,
                        category: ErrorHandlingSystem.ERROR_CATEGORIES.SYSTEM_ERROR,
                        message: `メモリ使用量が高い: ${memoryUsage.toFixed(2)}MB`
                    });
                }
            }, 30 * 1000); // 30秒間隔
        }
    }
    
    // ユーザーインターフェースの強化
    static enhanceUserInterface() {
        console.log('ユーザーインターフェースを強化しています...');
        
        // エラー状況表示パネルの追加
        this.addErrorStatusPanel();
        
        // システム健全性インジケーターの追加
        this.addSystemHealthIndicator();
        
        console.log('✅ ユーザーインターフェース強化完了');
    }
    
    // エラー状況表示パネルの追加
    static addErrorStatusPanel() {
        const existingPanel = document.getElementById('errorStatusPanel');
        if (existingPanel) return;
        
        const panel = document.createElement('div');
        panel.id = 'errorStatusPanel';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 1000;
            min-width: 200px;
            display: none;
        `;
        
        document.body.appendChild(panel);
        
        // エラーリスナーを追加してパネルを更新
        ErrorHandlingSystem.addErrorListener((error) => {
            this.updateErrorStatusPanel();
        });
    }
    
    // エラー状況パネルの更新
    static updateErrorStatusPanel() {
        const panel = document.getElementById('errorStatusPanel');
        if (!panel) return;
        
        const stats = ErrorHandlingSystem.getErrorStats(60 * 60 * 1000); // 1時間
        const healthScore = ErrorHandlingSystem.calculateSystemHealth();
        
        if (stats.total > 0 || healthScore < 90) {
            panel.style.display = 'block';
            panel.innerHTML = `
                <div style="font-weight: bold;">システム状況</div>
                <div>健全性: ${healthScore}点</div>
                <div>エラー(1h): ${stats.byLevel.error || 0}件</div>
                <div>警告(1h): ${stats.byLevel.warning || 0}件</div>
                <div style="font-size: 10px; margin-top: 5px; cursor: pointer;" onclick="console.log(ErrorHandlingSystem.generateErrorReport())">詳細はコンソールで確認</div>
            `;
        } else {
            panel.style.display = 'none';
        }
    }
    
    // システム健全性インジケーターの追加
    static addSystemHealthIndicator() {
        const existingIndicator = document.getElementById('systemHealthIndicator');
        if (existingIndicator) return;
        
        const indicator = document.createElement('div');
        indicator.id = 'systemHealthIndicator';
        indicator.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #28a745;
            z-index: 1000;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        
        indicator.title = 'システム健全性インジケーター（クリックで詳細）';
        indicator.onclick = () => {
            const report = ErrorHandlingSystem.generateErrorReport();
            console.log('システムレポート:', report);
            alert(`システム健全性: ${report.healthAssessment}\n最近のエラー: ${report.summary.total}件`);
        };
        
        document.body.appendChild(indicator);
        
        // 定期的に更新
        setInterval(() => {
            this.updateSystemHealthIndicator();
        }, 30 * 1000); // 30秒間隔
    }
    
    // システム健全性インジケーターの更新
    static updateSystemHealthIndicator() {
        const indicator = document.getElementById('systemHealthIndicator');
        if (!indicator) return;
        
        const healthScore = ErrorHandlingSystem.calculateSystemHealth();
        let color = '#28a745'; // 緑（良好）
        
        if (healthScore < 50) {
            color = '#dc3545'; // 赤（危険）
        } else if (healthScore < 70) {
            color = '#ffc107'; // 黄（注意）
        } else if (healthScore < 90) {
            color = '#17a2b8'; // 青（普通）
        }
        
        indicator.style.background = color;
        indicator.title = `システム健全性: ${healthScore}点`;
    }
    
    // 統合レポートの生成
    static generateIntegratedReport() {
        return {
            timestamp: new Date().toISOString(),
            integration: this.integrationStatus,
            health: this.performHealthCheck(),
            errors: ErrorHandlingSystem.generateErrorReport(),
            validation: this.generateIntegratedValidationReport ? this.generateIntegratedValidationReport() : null
        };
    }
}

// グローバルに公開
window.SystemIntegration = SystemIntegration;

// 自動初期化（ErrorHandlingSystemの後に実行）
document.addEventListener('DOMContentLoaded', () => {
    // ErrorHandlingSystemの初期化を待つ
    setTimeout(() => {
        SystemIntegration.initialize();
    }, 1000);
});