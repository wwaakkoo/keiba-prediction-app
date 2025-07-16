/**
 * Phase 7: リアルタイム更新マネージャー
 * 5秒間隔でのデータ同期と自動再描画システム
 */

class RealTimeUpdateManager {
    constructor() {
        this.updateInterval = 5000; // 5秒間隔
        this.isActive = false;
        this.intervalId = null;
        this.lastUpdateTimestamp = null;
        this.updateQueue = [];
        this.subscribers = new Map(); // コンポーネント登録
        
        // 更新対象コンポーネント
        this.components = {
            portfolioDashboard: null,
            performanceCharts: null,
            candidateEvaluationVisualizer: null
        };
        
        // データ変更検知用
        this.dataHashes = {
            portfolioData: null,
            performanceData: null,
            evaluationData: null
        };
        
        // 更新統計
        this.updateStats = {
            totalUpdates: 0,
            successfulUpdates: 0,
            failedUpdates: 0,
            avgUpdateTime: 0
        };
        
        // デバッグモード
        this.debugMode = localStorage.getItem('realTimeDebugMode') === 'true';
        
        this.log('🔄 リアルタイム更新マネージャー初期化');
    }

    /**
     * リアルタイム更新システムの開始
     */
    startRealTimeUpdates() {
        if (this.isActive) {
            this.log('⚠️ リアルタイム更新は既に開始されています');
            return;
        }

        this.log('🚀 リアルタイム更新開始');
        this.isActive = true;
        this.lastUpdateTimestamp = Date.now();
        
        // 初回更新
        this.performUpdate();
        
        // 定期更新開始
        this.intervalId = setInterval(() => {
            this.performUpdate();
        }, this.updateInterval);
        
        // ページ非表示時の更新停止
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseUpdates();
            } else {
                this.resumeUpdates();
            }
        });
        
        // ウィンドウフォーカス時の即座更新
        window.addEventListener('focus', () => {
            if (this.isActive) {
                this.log('👁️ ウィンドウフォーカス - 即座更新実行');
                this.performUpdate();
            }
        });
        
        this.log('✅ リアルタイム更新システム開始完了');
    }

    /**
     * リアルタイム更新の停止
     */
    stopRealTimeUpdates() {
        if (!this.isActive) return;

        this.log('🛑 リアルタイム更新停止');
        this.isActive = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.log('✅ リアルタイム更新システム停止完了');
    }

    /**
     * 更新の一時停止
     */
    pauseUpdates() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.log('⏸️ 更新一時停止（ページ非表示）');
        }
    }

    /**
     * 更新の再開
     */
    resumeUpdates() {
        if (this.isActive && !this.intervalId) {
            this.intervalId = setInterval(() => {
                this.performUpdate();
            }, this.updateInterval);
            this.log('▶️ 更新再開（ページ表示）');
            
            // 再開時即座更新
            this.performUpdate();
        }
    }

    /**
     * コンポーネントの登録
     */
    registerComponent(componentName, componentInstance) {
        this.components[componentName] = componentInstance;
        this.log(`📝 コンポーネント登録: ${componentName}`);
    }

    /**
     * 更新サブスクライバーの登録
     */
    subscribe(componentName, callback) {
        if (!this.subscribers.has(componentName)) {
            this.subscribers.set(componentName, []);
        }
        this.subscribers.get(componentName).push(callback);
        this.log(`🔔 サブスクライバー登録: ${componentName}`);
    }

    /**
     * メイン更新処理
     */
    async performUpdate() {
        const updateStartTime = Date.now();
        
        try {
            this.log('🔄 定期更新開始');
            
            // データ変更検知
            const changes = await this.detectDataChanges();
            
            if (changes.length === 0) {
                this.log('📊 データに変更なし - 更新スキップ');
                return;
            }
            
            this.log(`📈 データ変更検知: ${changes.join(', ')}`);
            
            // 変更されたデータに応じてコンポーネント更新
            await this.updateComponents(changes);
            
            // 更新統計の更新
            this.updateStats.successfulUpdates++;
            this.updateStats.totalUpdates++;
            
            const updateTime = Date.now() - updateStartTime;
            this.updateStats.avgUpdateTime = (
                (this.updateStats.avgUpdateTime * (this.updateStats.totalUpdates - 1) + updateTime) /
                this.updateStats.totalUpdates
            );
            
            this.log(`✅ 更新完了 (${updateTime}ms)`);
            
        } catch (error) {
            this.updateStats.failedUpdates++;
            this.updateStats.totalUpdates++;
            this.log(`❌ 更新エラー: ${error.message}`, 'error');
        }
        
        this.lastUpdateTimestamp = Date.now();
    }

    /**
     * データ変更検知
     */
    async detectDataChanges() {
        const changes = [];
        
        try {
            // ポートフォリオデータ変更検知
            const portfolioData = this.getPortfolioData();
            const portfolioHash = this.generateDataHash(portfolioData);
            if (portfolioHash !== this.dataHashes.portfolioData) {
                changes.push('portfolio');
                this.dataHashes.portfolioData = portfolioHash;
            }
            
            // パフォーマンスデータ変更検知
            const performanceData = this.getPerformanceData();
            const performanceHash = this.generateDataHash(performanceData);
            if (performanceHash !== this.dataHashes.performanceData) {
                changes.push('performance');
                this.dataHashes.performanceData = performanceHash;
            }
            
            // 評価データ変更検知
            const evaluationData = this.getEvaluationData();
            const evaluationHash = this.generateDataHash(evaluationData);
            if (evaluationHash !== this.dataHashes.evaluationData) {
                changes.push('evaluation');
                this.dataHashes.evaluationData = evaluationHash;
            }
            
        } catch (error) {
            this.log(`❌ データ変更検知エラー: ${error.message}`, 'error');
        }
        
        return changes;
    }

    /**
     * コンポーネント更新
     */
    async updateComponents(changes) {
        const updatePromises = [];
        
        for (const change of changes) {
            switch (change) {
                case 'portfolio':
                    if (this.components.portfolioDashboard) {
                        updatePromises.push(
                            this.updateComponentSafely(
                                'portfolioDashboard',
                                () => this.components.portfolioDashboard.loadDataFromPhase6Systems()
                            )
                        );
                    }
                    break;
                    
                case 'performance':
                    if (this.components.performanceCharts) {
                        updatePromises.push(
                            this.updateComponentSafely(
                                'performanceCharts',
                                () => this.components.performanceCharts.updateChartData()
                            )
                        );
                    }
                    break;
                    
                case 'evaluation':
                    if (this.components.candidateEvaluationVisualizer) {
                        updatePromises.push(
                            this.updateComponentSafely(
                                'candidateEvaluationVisualizer',
                                () => this.components.candidateEvaluationVisualizer.refreshEvaluation()
                            )
                        );
                    }
                    break;
            }
        }
        
        // 全コンポーネントの更新を並列実行
        await Promise.all(updatePromises);
        
        // サブスクライバーに通知
        this.notifySubscribers(changes);
    }

    /**
     * 安全なコンポーネント更新
     */
    async updateComponentSafely(componentName, updateFunction) {
        try {
            await updateFunction();
            this.log(`✅ ${componentName} 更新完了`);
        } catch (error) {
            this.log(`❌ ${componentName} 更新エラー: ${error.message}`, 'error');
        }
    }

    /**
     * サブスクライバーへの通知
     */
    notifySubscribers(changes) {
        changes.forEach(change => {
            if (this.subscribers.has(change)) {
                this.subscribers.get(change).forEach(callback => {
                    try {
                        callback(change);
                    } catch (error) {
                        this.log(`❌ サブスクライバー通知エラー: ${error.message}`, 'error');
                    }
                });
            }
        });
    }

    /**
     * ポートフォリオデータの取得
     */
    getPortfolioData() {
        const data = localStorage.getItem('kellyPortfolioResults');
        return data ? JSON.parse(data) : null;
    }

    /**
     * パフォーマンスデータの取得
     */
    getPerformanceData() {
        const data = localStorage.getItem('performanceHistory');
        return data ? JSON.parse(data) : null;
    }

    /**
     * 評価データの取得
     */
    getEvaluationData() {
        const portfolio = this.getPortfolioData();
        const performance = this.getPerformanceData();
        return { portfolio, performance };
    }

    /**
     * データハッシュの生成
     */
    generateDataHash(data) {
        if (!data) return null;
        
        // 簡単なハッシュ生成（実際の実装では適切なハッシュライブラリを使用）
        const str = JSON.stringify(data);
        let hash = 0;
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32bitに変換
        }
        
        return hash.toString();
    }

    /**
     * 更新間隔の動的調整
     */
    adjustUpdateInterval(newInterval) {
        if (newInterval < 1000) newInterval = 1000; // 最小1秒
        if (newInterval > 60000) newInterval = 60000; // 最大60秒
        
        this.updateInterval = newInterval;
        this.log(`⚙️ 更新間隔調整: ${newInterval}ms`);
        
        // 現在の更新を停止して新しい間隔で再開
        if (this.isActive) {
            this.stopRealTimeUpdates();
            setTimeout(() => {
                this.startRealTimeUpdates();
            }, 100);
        }
    }

    /**
     * 更新統計の取得
     */
    getUpdateStats() {
        return {
            ...this.updateStats,
            isActive: this.isActive,
            updateInterval: this.updateInterval,
            lastUpdate: this.lastUpdateTimestamp ? new Date(this.lastUpdateTimestamp).toLocaleString() : null,
            successRate: this.updateStats.totalUpdates > 0 ? 
                (this.updateStats.successfulUpdates / this.updateStats.totalUpdates * 100).toFixed(1) + '%' : '0%'
        };
    }

    /**
     * 手動更新の実行
     */
    async forceUpdate() {
        this.log('🔄 手動更新実行');
        await this.performUpdate();
    }

    /**
     * デバッグモードの切り替え
     */
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        localStorage.setItem('realTimeDebugMode', this.debugMode.toString());
        this.log(`🐛 デバッグモード: ${this.debugMode ? 'ON' : 'OFF'}`);
    }

    /**
     * 更新状態の可視化
     */
    showUpdateStatus() {
        const stats = this.getUpdateStats();
        const statusDiv = document.createElement('div');
        statusDiv.id = 'realtime-status';
        statusDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 10000;
            min-width: 200px;
        `;
        
        statusDiv.innerHTML = `
            <div><strong>🔄 リアルタイム更新状態</strong></div>
            <div>状態: ${stats.isActive ? '🟢 稼働中' : '🔴 停止中'}</div>
            <div>間隔: ${stats.updateInterval}ms</div>
            <div>総更新: ${stats.totalUpdates}回</div>
            <div>成功率: ${stats.successRate}</div>
            <div>平均時間: ${stats.avgUpdateTime.toFixed(1)}ms</div>
            <div>最終更新: ${stats.lastUpdate || 'なし'}</div>
            <button onclick="realTimeUpdateManager.toggleDebugMode()" style="margin-top: 5px; padding: 2px 5px; font-size: 10px;">
                デバッグ${this.debugMode ? 'OFF' : 'ON'}
            </button>
        `;
        
        // 既存のステータス表示を削除
        const existing = document.getElementById('realtime-status');
        if (existing) existing.remove();
        
        document.body.appendChild(statusDiv);
        
        // 10秒後に自動削除
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.remove();
            }
        }, 10000);
    }

    /**
     * ログ出力
     */
    log(message, level = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] RealTimeUpdate: ${message}`;
        
        switch (level) {
            case 'error':
                console.error(logMessage);
                break;
            case 'warn':
                console.warn(logMessage);
                break;
            case 'debug':
                if (this.debugMode) console.debug(logMessage);
                break;
            default:
                if (this.debugMode) console.log(logMessage);
        }
    }

    /**
     * システムの破棄
     */
    destroy() {
        this.log('🗑️ リアルタイム更新システム破棄');
        this.stopRealTimeUpdates();
        this.components = {};
        this.subscribers.clear();
        this.dataHashes = {};
        
        // ステータス表示を削除
        const statusDiv = document.getElementById('realtime-status');
        if (statusDiv) statusDiv.remove();
    }
}

// グローバル公開
window.RealTimeUpdateManager = RealTimeUpdateManager;

// 自動初期化（全コンポーネント読み込み後）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (!window.realTimeUpdateManager) {
                window.realTimeUpdateManager = new RealTimeUpdateManager();
                
                // 既存コンポーネントの自動登録
                if (window.portfolioDashboardInstance) {
                    window.realTimeUpdateManager.registerComponent('portfolioDashboard', window.portfolioDashboardInstance);
                }
                if (window.performanceChartsInstance) {
                    window.realTimeUpdateManager.registerComponent('performanceCharts', window.performanceChartsInstance);
                }
                if (window.candidateEvaluationVisualizer) {
                    window.realTimeUpdateManager.registerComponent('candidateEvaluationVisualizer', window.candidateEvaluationVisualizer);
                }
                
                // リアルタイム更新開始
                window.realTimeUpdateManager.startRealTimeUpdates();
            }
        }, 2000); // 全コンポーネント初期化後
    });
} else {
    setTimeout(() => {
        if (!window.realTimeUpdateManager) {
            window.realTimeUpdateManager = new RealTimeUpdateManager();
            
            // 既存コンポーネントの自動登録
            if (window.portfolioDashboardInstance) {
                window.realTimeUpdateManager.registerComponent('portfolioDashboard', window.portfolioDashboardInstance);
            }
            if (window.performanceChartsInstance) {
                window.realTimeUpdateManager.registerComponent('performanceCharts', window.performanceChartsInstance);
            }
            if (window.candidateEvaluationVisualizer) {
                window.realTimeUpdateManager.registerComponent('candidateEvaluationVisualizer', window.candidateEvaluationVisualizer);
            }
            
            // リアルタイム更新開始
            window.realTimeUpdateManager.startRealTimeUpdates();
        }
    }, 2000);
}