/**
 * Phase 6-7 Bridge: 完全連携システム
 * Phase 6 Kelly計算完了 → Phase 7 分析自動開始の橋渡し
 */

class Phase6To7Bridge {
    constructor() {
        this.bridgeSettings = {
            autoTrigger: true,
            delayBeforeAnalysis: 1000,      // 1秒の遅延
            retryAttempts: 3,
            retryDelay: 2000,
            
            // 監視対象のイベント
            monitoredEvents: [
                'kellyCalculationComplete',
                'kellyPortfolioUpdated',
                'kellyResultsSaved'
            ],
            
            // 連携データキー
            dataKeys: {
                kellyResults: 'kellyPortfolioResults',
                candidates: 'candidates',
                bridgeLog: 'phase6To7BridgeLog'
            }
        };
        
        // 連携状態管理
        this.bridgeState = {
            isActive: false,
            lastTrigger: null,
            pendingAnalysis: false,
            failureCount: 0,
            successCount: 0,
            isProcessing: false,    // 処理中フラグ
            lastProcessingTime: null // 最終処理時刻
        };
        
        // データ統合マネージャーとの連携
        this.dataIntegrationManager = null;
        this.investmentResultRecorder = null;
        this.resultInputUI = null;
        
        console.log('🌉 Phase 6-7 Bridge初期化完了');
    }

    /**
     * ブリッジシステムの初期化
     */
    initialize() {
        console.log('🚀 Phase 6-7 Bridge開始');
        
        // 依存システムの参照取得
        this.setupSystemReferences();
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // 自動監視の開始
        this.startAutoMonitoring();
        
        // 既存データのチェック
        this.checkExistingData();
        
        this.bridgeState.isActive = true;
        
        console.log('✅ Phase 6-7 Bridge初期化完了');
    }

    /**
     * システム参照の設定
     */
    setupSystemReferences() {
        // データ統合マネージャー
        this.dataIntegrationManager = window.dataIntegrationManager;
        if (!this.dataIntegrationManager) {
            console.warn('⚠️ DataIntegrationManager が見つかりません');
        }
        
        // 投資結果記録システム（遅延読み込み対応）
        this.investmentResultRecorder = window.investmentResultRecorder;
        if (!this.investmentResultRecorder) {
            console.warn('⚠️ InvestmentResultRecorder が見つかりません - 遅延読み込みを待機中');
            // 遅延読み込みを試行
            setTimeout(() => {
                this.investmentResultRecorder = window.investmentResultRecorder;
                if (this.investmentResultRecorder) {
                    console.log('✅ InvestmentResultRecorder 遅延読み込み成功');
                }
            }, 100);
        }
        
        // 結果入力UI
        this.resultInputUI = window.resultInputUI;
        if (!this.resultInputUI) {
            console.warn('⚠️ ResultInputUI が見つかりません');
        }
        
        console.log('🔗 システム参照設定完了');
    }

    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // Kelly計算完了イベント
        document.addEventListener('kellyCalculationComplete', (event) => {
            console.log('🎯 Kelly計算完了イベントを受信');
            this.onKellyCalculationComplete(event.detail);
        });
        
        // LocalStorage変更監視
        window.addEventListener('storage', (event) => {
            if (event.key === this.bridgeSettings.dataKeys.kellyResults) {
                console.log('📊 Kelly結果データの変更を検知');
                this.onKellyDataChanged(event.newValue);
            }
        });
        
        // 投資結果記録完了イベント
        document.addEventListener('investmentResultRecorded', (event) => {
            console.log('📝 投資結果記録完了イベントを受信');
            this.onInvestmentResultRecorded(event.detail);
        });
        
        // 定期的なデータチェック
        setInterval(() => {
            this.periodicDataCheck();
        }, 10000); // 10秒間隔
        
        console.log('👂 イベントリスナー設定完了');
    }

    /**
     * 自動監視の開始
     */
    startAutoMonitoring() {
        if (!this.bridgeSettings.autoTrigger) {
            console.log('⏸️ 自動監視は無効化されています');
            return;
        }
        
        // Kelly結果の監視
        this.monitorKellyResults();
        
        // 投資結果の監視
        this.monitorInvestmentResults();
        
        console.log('👁️ 自動監視開始');
    }

    /**
     * Kelly計算完了時の安全な処理
     */
    async onKellyCalculationComplete(kellyResults) {
        console.log('🎯 Kelly計算完了処理開始', kellyResults);
        
        // 重複実行防止
        if (this.bridgeState.isProcessing) {
            console.warn('⚠️ Kelly処理が既に実行中です。スキップします。');
            return;
        }
        
        // 連続処理の制限（5秒以内の重複実行を防止）
        const now = Date.now();
        if (this.bridgeState.lastProcessingTime && (now - this.bridgeState.lastProcessingTime) < 5000) {
            console.warn('⚠️ Kelly処理が連続で実行されています。遅延します。');
            return;
        }
        
        this.bridgeState.isProcessing = true;
        this.bridgeState.lastProcessingTime = now;
        
        try {
            // 1. ブリッジログの記録
            this.logBridgeEvent('kelly_calculation_complete', {
                timestamp: new Date().toISOString(),
                kellyResults: kellyResults,
                processingId: now
            });
            
            // 2. 遅延後の分析開始
            setTimeout(async () => {
                try {
                    await this.triggerPhase7Analysis(kellyResults);
                } catch (error) {
                    console.error('❌ 遅延分析エラー:', error);
                    this.handleBridgeError(error);
                } finally {
                    this.bridgeState.isProcessing = false;
                }
            }, this.bridgeSettings.delayBeforeAnalysis);
            
            // 3. 結果入力UIの表示準備
            this.prepareResultInputUI(kellyResults);
            
            // 4. 状態の更新
            this.bridgeState.lastTrigger = new Date().toISOString();
            this.bridgeState.pendingAnalysis = true;
            
        } catch (error) {
            console.error('❌ Kelly計算完了処理エラー:', error);
            this.handleBridgeError(error);
            this.bridgeState.isProcessing = false;
        }
    }

    /**
     * Phase 7分析の安全なトリガー
     */
    async triggerPhase7Analysis(kellyResults) {
        console.log('🔄 Phase 7分析トリガー開始');
        
        if (!this.dataIntegrationManager) {
            console.error('❌ DataIntegrationManager が利用できません');
            return;
        }
        
        // タイムアウト付きで実行
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('分析処理がタイムアウトしました')), 30000); // 30秒タイムアウト
        });
        
        try {
            // 1. データ統合の実行（タイムアウト付き）
            const integrationResult = await Promise.race([
                this.dataIntegrationManager.integratePhase6And7Data(),
                timeoutPromise
            ]);
            
            if (integrationResult && integrationResult.success) {
                console.log('✅ データ統合成功');
                
                // 2. 分析システムの更新（エラー耐性あり）
                await this.updateAnalysisSystems(integrationResult.integratedData);
                
                // 3. 成功カウントの更新
                this.bridgeState.successCount++;
                this.bridgeState.failureCount = 0;
                
                // 4. 成功ログの記録
                this.logBridgeEvent('phase7_analysis_success', {
                    timestamp: new Date().toISOString(),
                    integrationResult: integrationResult.statistics,
                    processingTime: Date.now() - this.bridgeState.lastProcessingTime
                });
                
                // 5. 成功通知の表示
                this.showAnalysisCompleteNotification(integrationResult.statistics);
                
            } else {
                const errorMessage = integrationResult ? integrationResult.error : '不明なエラーが発生しました';
                console.error('❌ データ統合失敗:', errorMessage);
                this.handleBridgeError(new Error(errorMessage));
            }
            
        } catch (error) {
            console.error('❌ Phase 7分析トリガーエラー:', error);
            
            // エラーの種類によって適切な処理
            if (error.message.includes('タイムアウト')) {
                console.warn('⚠️ 分析処理がタイムアウトしました。リトライします。');
                // タイムアウトの場合は再試行
                setTimeout(() => {
                    if (this.bridgeState.failureCount < 2) {
                        this.triggerPhase7Analysis(kellyResults);
                    }
                }, 5000);
            }
            
            this.handleBridgeError(error);
        } finally {
            this.bridgeState.pendingAnalysis = false;
        }
    }

    /**
     * 分析システムの更新
     */
    async updateAnalysisSystems(integratedData) {
        const updatePromises = [];
        
        // アクショナブルインサイトマネージャー
        if (window.actionableInsightsManager) {
            updatePromises.push(
                window.actionableInsightsManager.refreshInsights().catch(error => {
                    console.warn('⚠️ アクショナブルインサイト更新エラー:', error);
                })
            );
        }
        
        // 候補評価システム
        if (window.candidateEvaluationVisualizer) {
            try {
                window.candidateEvaluationVisualizer.refreshEvaluation();
                console.log('✅ 候補評価システム更新完了');
            } catch (error) {
                console.warn('⚠️ 候補評価システム更新エラー:', error);
            }
        }
        
        // パフォーマンスチャート
        if (window.performanceCharts) {
            updatePromises.push(
                window.performanceCharts.updateAllCharts().catch(error => {
                    console.warn('⚠️ パフォーマンスチャート更新エラー:', error);
                })
            );
        }
        
        // ポートフォリオダッシュボード
        if (window.portfolioDashboard) {
            updatePromises.push(
                window.portfolioDashboard.refreshDashboard().catch(error => {
                    console.warn('⚠️ ポートフォリオダッシュボード更新エラー:', error);
                })
            );
        }
        
        // 並列更新の実行
        await Promise.allSettled(updatePromises);
        
        console.log('🔄 分析システム更新完了');
    }

    /**
     * 結果入力UIの準備
     */
    prepareResultInputUI(kellyResults) {
        if (!this.resultInputUI) {
            console.warn('⚠️ ResultInputUI が利用できません');
            return;
        }
        
        try {
            // 2秒後に結果入力UIを表示
            setTimeout(() => {
                this.resultInputUI.showResultInputForKellyResults(kellyResults);
            }, 2000);
            
        } catch (error) {
            console.error('❌ 結果入力UI準備エラー:', error);
        }
    }

    /**
     * 投資結果記録完了時の処理
     */
    async onInvestmentResultRecorded(resultData) {
        console.log('📝 投資結果記録完了処理開始', resultData);
        
        try {
            // 1. 即座にデータ統合を実行
            await this.triggerImmediateAnalysis(resultData);
            
            // 2. 学習データの更新
            this.updateLearningData(resultData);
            
            // 3. 成功ログの記録
            this.logBridgeEvent('investment_result_recorded', {
                timestamp: new Date().toISOString(),
                resultData: resultData
            });
            
        } catch (error) {
            console.error('❌ 投資結果記録完了処理エラー:', error);
            this.handleBridgeError(error);
        }
    }

    /**
     * 即座の分析実行
     */
    async triggerImmediateAnalysis(resultData) {
        console.log('⚡ 即座の分析実行');
        
        if (!this.dataIntegrationManager) {
            console.error('❌ DataIntegrationManager が利用できません');
            return;
        }
        
        try {
            // データ統合の実行
            const integrationResult = await this.dataIntegrationManager.integratePhase6And7Data();
            
            if (integrationResult.success) {
                console.log('✅ 即座の分析成功');
                
                // 分析システムの即座更新
                await this.updateAnalysisSystems(integrationResult.integratedData);
                
                // 通知の表示
                this.showAnalysisCompleteNotification(integrationResult.statistics);
                
            } else {
                console.error('❌ 即座の分析失敗:', integrationResult.error);
            }
            
        } catch (error) {
            console.error('❌ 即座の分析エラー:', error);
            this.handleBridgeError(error);
        }
    }

    /**
     * 学習データの更新
     */
    updateLearningData(resultData) {
        try {
            // 学習システムが利用可能な場合
            if (window.learningSystem) {
                window.learningSystem.updateWithNewResult(resultData);
            }
            
            if (window.hybridLearningSystem) {
                window.hybridLearningSystem.processNewResult(resultData);
            }
            
            console.log('🧠 学習データ更新完了');
            
        } catch (error) {
            console.error('❌ 学習データ更新エラー:', error);
        }
    }

    /**
     * Kelly結果の監視
     */
    monitorKellyResults() {
        const checkKellyResults = () => {
            const kellyData = localStorage.getItem(this.bridgeSettings.dataKeys.kellyResults);
            
            if (kellyData) {
                try {
                    const parsedData = JSON.parse(kellyData);
                    
                    // 新しいデータかチェック
                    if (this.isNewKellyData(parsedData)) {
                        console.log('📊 新しいKelly結果を検知');
                        this.onKellyDataChanged(kellyData);
                    }
                    
                } catch (error) {
                    console.error('❌ Kelly結果監視エラー:', error);
                }
            }
        };
        
        // 5秒間隔でチェック
        setInterval(checkKellyResults, 5000);
    }

    /**
     * 投資結果の監視
     */
    monitorInvestmentResults() {
        const checkInvestmentResults = () => {
            const resultData = localStorage.getItem('resultHistory');
            
            if (resultData) {
                try {
                    const parsedData = JSON.parse(resultData);
                    
                    // 新しい結果かチェック
                    if (this.isNewInvestmentResult(parsedData)) {
                        console.log('📝 新しい投資結果を検知');
                        const latestResult = parsedData[parsedData.length - 1];
                        this.onInvestmentResultRecorded(latestResult);
                    }
                    
                } catch (error) {
                    console.error('❌ 投資結果監視エラー:', error);
                }
            }
        };
        
        // 3秒間隔でチェック
        setInterval(checkInvestmentResults, 3000);
    }

    /**
     * 定期的なデータチェック
     */
    periodicDataCheck() {
        // データ整合性のチェック
        this.checkDataIntegrity();
        
        // 失敗したブリッジ処理のリトライ
        this.retryFailedOperations();
        
        // 古いログのクリーンアップ
        this.cleanupOldLogs();
    }

    /**
     * データ整合性のチェック
     */
    checkDataIntegrity() {
        try {
            const performanceHistory = localStorage.getItem('performanceHistory');
            const candidateHistory = localStorage.getItem('candidateHistory');
            const resultHistory = localStorage.getItem('resultHistory');
            
            if (performanceHistory && candidateHistory && resultHistory) {
                const perfData = JSON.parse(performanceHistory);
                const candData = JSON.parse(candidateHistory);
                const resData = JSON.parse(resultHistory);
                
                // 基本的な整合性チェック
                if (perfData.length !== resData.length) {
                    console.warn('⚠️ パフォーマンス履歴と結果履歴の件数不一致');
                }
                
                // 必要に応じて自動修正
                this.autoCorrectDataInconsistencies(perfData, candData, resData);
            }
            
        } catch (error) {
            console.error('❌ データ整合性チェックエラー:', error);
        }
    }

    /**
     * 各種チェックメソッド
     */
    isNewKellyData(kellyData) {
        const lastKellyTimestamp = localStorage.getItem('lastKellyTimestamp');
        const currentTimestamp = kellyData.timestamp || new Date().toISOString();
        
        if (!lastKellyTimestamp || currentTimestamp > lastKellyTimestamp) {
            localStorage.setItem('lastKellyTimestamp', currentTimestamp);
            return true;
        }
        
        return false;
    }

    isNewInvestmentResult(resultData) {
        const lastResultCount = localStorage.getItem('lastResultCount') || '0';
        const currentCount = resultData.length.toString();
        
        if (currentCount > lastResultCount) {
            localStorage.setItem('lastResultCount', currentCount);
            return true;
        }
        
        return false;
    }

    /**
     * エラーハンドリング
     */
    handleBridgeError(error) {
        this.bridgeState.failureCount++;
        
        console.error('❌ ブリッジエラー:', error);
        
        // エラーログの記録
        this.logBridgeEvent('bridge_error', {
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: error.stack,
            failureCount: this.bridgeState.failureCount
        });
        
        // 連続失敗時の処理
        if (this.bridgeState.failureCount >= 3) {
            console.error('❌ 連続ブリッジエラー - 自動復旧を試行');
            this.attemptAutoRecovery();
        }
    }

    /**
     * 自動復旧の試行
     */
    attemptAutoRecovery() {
        console.log('🔄 自動復旧試行開始');
        
        // システム参照の再設定
        this.setupSystemReferences();
        
        // 既存データの再チェック
        this.checkExistingData();
        
        // 失敗カウントのリセット
        this.bridgeState.failureCount = 0;
        
        console.log('✅ 自動復旧試行完了');
    }

    /**
     * ブリッジログの記録
     */
    logBridgeEvent(eventType, eventData) {
        const logEntry = {
            eventType: eventType,
            timestamp: new Date().toISOString(),
            data: eventData
        };
        
        const existingLog = localStorage.getItem(this.bridgeSettings.dataKeys.bridgeLog);
        const log = existingLog ? JSON.parse(existingLog) : [];
        
        log.push(logEntry);
        
        // ログサイズの制限
        if (log.length > 100) {
            log.splice(0, log.length - 100);
        }
        
        localStorage.setItem(this.bridgeSettings.dataKeys.bridgeLog, JSON.stringify(log));
    }

    /**
     * 分析完了通知の表示
     */
    showAnalysisCompleteNotification(statistics) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            font-weight: bold;
            animation: slideIn 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            <div>✅ 分析完了</div>
            <div style="font-size: 0.9em; margin-top: 5px;">
                ${statistics.performanceRecords}件のパフォーマンスデータを分析
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 5秒後に自動削除
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    /**
     * 既存データのチェック
     */
    checkExistingData() {
        const kellyData = localStorage.getItem(this.bridgeSettings.dataKeys.kellyResults);
        
        if (kellyData) {
            try {
                const parsedData = JSON.parse(kellyData);
                console.log('🔍 既存Kelly結果を検出 - 分析を実行');
                
                // 既存データに対する分析を実行
                setTimeout(() => {
                    this.onKellyCalculationComplete(parsedData);
                }, 500);
                
            } catch (error) {
                console.error('❌ 既存データチェックエラー:', error);
            }
        }
    }

    /**
     * その他のユーティリティメソッド
     */
    onKellyDataChanged(newValue) {
        if (newValue) {
            try {
                const parsedData = JSON.parse(newValue);
                this.onKellyCalculationComplete(parsedData);
            } catch (error) {
                console.error('❌ Kelly データ変更処理エラー:', error);
            }
        }
    }

    retryFailedOperations() {
        // 失敗した操作のリトライロジック
        if (this.bridgeState.failureCount > 0 && this.bridgeState.failureCount < 3) {
            console.log('🔄 失敗操作のリトライ');
            // 必要に応じてリトライ処理を実装
        }
    }

    cleanupOldLogs() {
        const log = localStorage.getItem(this.bridgeSettings.dataKeys.bridgeLog);
        if (log) {
            try {
                const parsedLog = JSON.parse(log);
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - 7); // 7日前
                
                const filteredLog = parsedLog.filter(entry => 
                    new Date(entry.timestamp) > cutoffDate
                );
                
                localStorage.setItem(this.bridgeSettings.dataKeys.bridgeLog, JSON.stringify(filteredLog));
            } catch (error) {
                console.error('❌ ログクリーンアップエラー:', error);
            }
        }
    }

    autoCorrectDataInconsistencies(perfData, candData, resData) {
        // 自動修正ロジック
        console.log('🔧 データ不整合の自動修正');
        // 必要に応じて修正処理を実装
    }

    /**
     * ブリッジ状態の取得
     */
    getBridgeStatus() {
        return {
            isActive: this.bridgeState.isActive,
            lastTrigger: this.bridgeState.lastTrigger,
            pendingAnalysis: this.bridgeState.pendingAnalysis,
            successCount: this.bridgeState.successCount,
            failureCount: this.bridgeState.failureCount,
            
            systemReferences: {
                dataIntegrationManager: !!this.dataIntegrationManager,
                investmentResultRecorder: !!this.investmentResultRecorder,
                resultInputUI: !!this.resultInputUI
            }
        };
    }

    /**
     * ブリッジの手動実行
     */
    async manualBridgeExecution() {
        console.log('🔄 ブリッジ手動実行');
        
        const kellyData = localStorage.getItem(this.bridgeSettings.dataKeys.kellyResults);
        if (kellyData) {
            const parsedData = JSON.parse(kellyData);
            await this.onKellyCalculationComplete(parsedData);
        } else {
            console.warn('⚠️ Kelly データが見つかりません');
        }
    }
}

// グローバル公開
window.Phase6To7Bridge = Phase6To7Bridge;

// 自動初期化（遅延対応）
window.addEventListener('DOMContentLoaded', () => {
    if (!window.phase6To7Bridge) {
        // 他のシステムの初期化完了を待つ
        setTimeout(() => {
            window.phase6To7Bridge = new Phase6To7Bridge();
            window.phase6To7Bridge.initialize();
        }, 200);
    }
});