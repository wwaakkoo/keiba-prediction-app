/**
 * Phase 7: アクショナブルインサイト機能
 * Kelly Criterion投資システムの知的判断支援システム
 */

class ActionableInsightsManager {
    constructor() {
        this.containerId = 'actionable-insights-container';
        this.insights = [];
        this.insightHistory = [];
        this.userPreferences = this.loadUserPreferences();
        
        // コア分析モジュール
        this.performanceAnalyzer = new PerformanceAnalyzer();
        this.riskAdvisor = new RiskAdjustmentAdvisor();
        this.portfolioOptimizer = new PortfolioOptimizer();
        this.scenarioAnalyzer = new ScenarioAnalyzer();
        
        // 提案設定
        this.insightSettings = {
            enablePerformanceAnalysis: true,
            enableRiskAdjustment: true,
            enablePortfolioOptimization: true,
            enableScenarioAnalysis: true,
            updateInterval: 10000, // 10秒間隔
            maxInsightsToShow: 5,
            urgencyThresholds: {
                critical: 3, // 連敗数
                warning: 2,
                info: 1
            }
        };
        
        // 実行統計
        this.stats = {
            totalInsights: 0,
            acceptedInsights: 0,
            rejectedInsights: 0,
            averageEffectiveness: 0
        };
        
        console.log('💡 アクショナブルインサイトマネージャー初期化');
    }

    /**
     * インサイトシステムの初期化
     */
    initialize() {
        console.log('🚀 アクショナブルインサイトシステム開始');
        
        this.createInsightContainer();
        this.startInsightGeneration();
        this.setupEventListeners();
        
        console.log('✅ アクショナブルインサイトシステム初期化完了');
    }

    /**
     * インサイトコンテナの作成
     */
    createInsightContainer() {
        const existingContainer = document.getElementById(this.containerId);
        if (existingContainer) {
            existingContainer.remove();
        }

        const container = document.createElement('div');
        container.id = this.containerId;
        container.className = 'actionable-insights-panel';
        container.innerHTML = `
            <div class="insights-header">
                <h3>💡 アクショナブルインサイト</h3>
                <div class="insights-controls">
                    <button onclick="actionableInsightsManager.refreshInsights()" class="refresh-btn">
                        🔄 更新
                    </button>
                    <button onclick="actionableInsightsManager.showInsightHistory()" class="history-btn">
                        📋 履歴
                    </button>
                    <button onclick="actionableInsightsManager.showSettings()" class="settings-btn">
                        ⚙️ 設定
                    </button>
                </div>
            </div>
            <div id="insights-content" class="insights-content">
                <!-- インサイトがここに動的生成される -->
            </div>
        `;

        // 候補評価コンテナの後に挿入
        const evaluationContainer = document.getElementById('candidate-evaluation-container');
        if (evaluationContainer) {
            evaluationContainer.parentNode.insertBefore(container, evaluationContainer.nextSibling);
        } else {
            document.body.appendChild(container);
        }

        this.addInsightStyles();
    }

    /**
     * インサイト生成の開始
     */
    startInsightGeneration() {
        // 初回生成
        this.generateInsights();
        
        // 定期的な更新
        setInterval(() => {
            this.generateInsights();
        }, this.insightSettings.updateInterval);
    }

    /**
     * インサイトの生成
     */
    async generateInsights() {
        try {
            const newInsights = [];
            
            // パフォーマンス分析
            if (this.insightSettings.enablePerformanceAnalysis) {
                const performanceInsights = await this.performanceAnalyzer.analyzePerformance();
                newInsights.push(...performanceInsights);
            }
            
            // リスク調整分析
            if (this.insightSettings.enableRiskAdjustment) {
                const riskInsights = await this.riskAdvisor.analyzeRisk();
                newInsights.push(...riskInsights);
            }
            
            // ポートフォリオ最適化
            if (this.insightSettings.enablePortfolioOptimization) {
                const portfolioInsights = await this.portfolioOptimizer.analyzePortfolio();
                newInsights.push(...portfolioInsights);
            }
            
            // シナリオ分析
            if (this.insightSettings.enableScenarioAnalysis) {
                const scenarioInsights = await this.scenarioAnalyzer.analyzeScenarios();
                newInsights.push(...scenarioInsights);
            }
            
            // 重複除去と優先度ソート
            this.insights = this.processInsights(newInsights);
            
            // UI更新
            this.renderInsights();
            
            this.stats.totalInsights = this.insights.length;
            
        } catch (error) {
            console.error('❌ インサイト生成エラー:', error);
        }
    }

    /**
     * インサイトの処理（重複除去・優先度ソート）
     */
    processInsights(newInsights) {
        // 重複除去
        const uniqueInsights = this.removeDuplicateInsights(newInsights);
        
        // 優先度ソート
        return uniqueInsights
            .sort((a, b) => {
                const priorityOrder = { critical: 3, warning: 2, info: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            })
            .slice(0, this.insightSettings.maxInsightsToShow);
    }

    /**
     * 重複インサイトの除去
     */
    removeDuplicateInsights(insights) {
        const seen = new Set();
        return insights.filter(insight => {
            const key = `${insight.type}-${insight.subType}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    /**
     * インサイトのレンダリング
     */
    renderInsights() {
        const contentDiv = document.getElementById('insights-content');
        if (!contentDiv) return;

        if (this.insights.length === 0) {
            contentDiv.innerHTML = `
                <div class="no-insights">
                    <p>🎯 現在、改善提案はありません</p>
                    <p>システムが最適な状態で稼働しています</p>
                </div>
            `;
            return;
        }

        const insightCards = this.insights.map(insight => 
            this.renderInsightCard(insight)
        ).join('');

        contentDiv.innerHTML = `
            <div class="insights-summary">
                <span class="insight-count">${this.insights.length}件の提案</span>
                <span class="effectiveness-rate">採用率: ${this.getAcceptanceRate()}%</span>
            </div>
            <div class="insights-list">
                ${insightCards}
            </div>
        `;
    }

    /**
     * インサイトカードのレンダリング
     */
    renderInsightCard(insight) {
        const priorityClass = `priority-${insight.priority}`;
        const iconMap = {
            critical: '🔴',
            warning: '🟡',
            info: '🟢'
        };

        return `
            <div class="insight-card ${priorityClass}" data-insight-id="${insight.id}">
                <div class="insight-header">
                    <div class="insight-priority">
                        ${iconMap[insight.priority]} ${insight.priority.toUpperCase()}
                    </div>
                    <div class="insight-timestamp">
                        ${new Date(insight.timestamp).toLocaleTimeString()}
                    </div>
                </div>
                
                <div class="insight-content">
                    <h4 class="insight-title">${insight.title}</h4>
                    <p class="insight-description">${insight.description}</p>
                    
                    ${insight.currentMetrics ? `
                        <div class="current-metrics">
                            <h5>📊 現在の状況</h5>
                            ${this.renderMetrics(insight.currentMetrics)}
                        </div>
                    ` : ''}
                    
                    <div class="recommended-actions">
                        <h5>💡 推奨アクション</h5>
                        <ul>
                            ${insight.actions.map(action => `
                                <li>
                                    <strong>${action.title}</strong>: ${action.description}
                                    ${action.expectedEffect ? `<span class="expected-effect">(期待効果: ${action.expectedEffect})</span>` : ''}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    
                    ${insight.prediction ? `
                        <div class="prediction">
                            <h5>📈 効果予測</h5>
                            <p>${insight.prediction}</p>
                        </div>
                    ` : ''}
                </div>
                
                <div class="insight-actions">
                    <button onclick="actionableInsightsManager.acceptInsight('${insight.id}')" class="accept-btn">
                        ✅ 適用
                    </button>
                    <button onclick="actionableInsightsManager.simulateInsight('${insight.id}')" class="simulate-btn">
                        🧪 試算
                    </button>
                    <button onclick="actionableInsightsManager.rejectInsight('${insight.id}')" class="reject-btn">
                        ❌ 却下
                    </button>
                    <button onclick="actionableInsightsManager.showInsightDetails('${insight.id}')" class="details-btn">
                        📋 詳細
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * メトリクスの表示
     */
    renderMetrics(metrics) {
        return Object.entries(metrics)
            .map(([key, value]) => `
                <div class="metric-item">
                    <span class="metric-label">${this.getMetricLabel(key)}</span>
                    <span class="metric-value">${this.formatMetricValue(value)}</span>
                </div>
            `)
            .join('');
    }

    /**
     * メトリクスラベルの取得
     */
    getMetricLabel(key) {
        const labels = {
            winRate: '勝率',
            roi: 'ROI',
            consecutiveLosses: '連敗数',
            drawdown: 'ドローダウン',
            riskMultiplier: 'リスク倍率',
            portfolioEfficiency: 'ポートフォリオ効率'
        };
        return labels[key] || key;
    }

    /**
     * メトリクス値のフォーマット
     */
    formatMetricValue(value) {
        if (typeof value === 'number') {
            if (value < 1) {
                return `${(value * 100).toFixed(1)}%`;
            }
            return value.toFixed(2);
        }
        return value;
    }

    /**
     * インサイトの適用
     */
    async acceptInsight(insightId) {
        try {
            const insight = this.insights.find(i => i.id === insightId);
            if (!insight) return;

            console.log('✅ インサイト適用:', insight.title);
            
            // 適用前のメトリクスを記録
            const beforeMetrics = await this.getCurrentMetrics();
            
            // 実際の適用処理
            await this.applyInsight(insight);
            
            // 適用後のメトリクスを記録（一定時間後）
            setTimeout(async () => {
                const afterMetrics = await this.getCurrentMetrics();
                this.recordInsightEffectiveness(insight, beforeMetrics, afterMetrics);
            }, 30000); // 30秒後に効果測定
            
            // 統計更新
            this.stats.acceptedInsights++;
            
            // インサイト履歴に追加
            this.insightHistory.push({
                ...insight,
                status: 'accepted',
                appliedAt: new Date().toISOString()
            });
            
            // UI更新
            this.removeInsightCard(insightId);
            this.showMessage('✅ 提案を適用しました', 'success');
            
        } catch (error) {
            console.error('❌ インサイト適用エラー:', error);
            this.showMessage('❌ 適用に失敗しました: ' + error.message, 'error');
        }
    }

    /**
     * インサイトの試算
     */
    async simulateInsight(insightId) {
        try {
            const insight = this.insights.find(i => i.id === insightId);
            if (!insight) return;

            console.log('🧪 インサイト試算:', insight.title);
            
            // 試算処理
            const simulation = await this.performSimulation(insight);
            
            // 試算結果の表示
            this.showSimulationResults(insight, simulation);
            
        } catch (error) {
            console.error('❌ インサイト試算エラー:', error);
            this.showMessage('❌ 試算に失敗しました: ' + error.message, 'error');
        }
    }

    /**
     * インサイトの却下
     */
    rejectInsight(insightId) {
        try {
            const insight = this.insights.find(i => i.id === insightId);
            if (!insight) return;

            console.log('❌ インサイト却下:', insight.title);
            
            // 統計更新
            this.stats.rejectedInsights++;
            
            // インサイト履歴に追加
            this.insightHistory.push({
                ...insight,
                status: 'rejected',
                rejectedAt: new Date().toISOString()
            });
            
            // UI更新
            this.removeInsightCard(insightId);
            this.showMessage('❌ 提案を却下しました', 'info');
            
        } catch (error) {
            console.error('❌ インサイト却下エラー:', error);
        }
    }

    /**
     * インサイトの詳細表示
     */
    showInsightDetails(insightId) {
        const insight = this.insights.find(i => i.id === insightId);
        if (!insight) return;

        // 詳細モーダルの表示
        this.showModal('インサイト詳細', this.renderInsightDetails(insight));
    }

    /**
     * インサイト詳細のレンダリング
     */
    renderInsightDetails(insight) {
        return `
            <div class="insight-details">
                <h4>${insight.title}</h4>
                <p><strong>分析タイプ:</strong> ${insight.type}</p>
                <p><strong>優先度:</strong> ${insight.priority}</p>
                <p><strong>生成時刻:</strong> ${new Date(insight.timestamp).toLocaleString()}</p>
                
                <h5>📊 分析結果</h5>
                <p>${insight.description}</p>
                
                <h5>💡 推奨アクション</h5>
                <ul>
                    ${insight.actions.map(action => `
                        <li>
                            <strong>${action.title}</strong><br>
                            ${action.description}<br>
                            ${action.expectedEffect ? `<em>期待効果: ${action.expectedEffect}</em>` : ''}
                        </li>
                    `).join('')}
                </ul>
                
                ${insight.rationale ? `
                    <h5>🧠 分析根拠</h5>
                    <p>${insight.rationale}</p>
                ` : ''}
                
                ${insight.prediction ? `
                    <h5>📈 効果予測</h5>
                    <p>${insight.prediction}</p>
                ` : ''}
                
                ${insight.confidence ? `
                    <h5>📊 信頼度</h5>
                    <p>${insight.confidence}%</p>
                ` : ''}
            </div>
        `;
    }

    /**
     * 現在のメトリクスを取得
     */
    async getCurrentMetrics() {
        const portfolioData = this.getPortfolioData();
        const performanceData = this.getPerformanceData();
        
        return {
            winRate: this.calculateWinRate(performanceData),
            roi: this.calculateROI(performanceData),
            consecutiveLosses: this.calculateConsecutiveLosses(performanceData),
            riskMultiplier: portfolioData?.riskMultiplier || 1.0,
            portfolioEfficiency: this.calculatePortfolioEfficiency(portfolioData)
        };
    }

    /**
     * インサイトの実際の適用
     */
    async applyInsight(insight) {
        switch (insight.type) {
            case 'performance':
                await this.applyPerformanceInsight(insight);
                break;
            case 'risk':
                await this.applyRiskInsight(insight);
                break;
            case 'portfolio':
                await this.applyPortfolioInsight(insight);
                break;
            default:
                console.warn('未知のインサイトタイプ:', insight.type);
        }
    }

    /**
     * パフォーマンスインサイトの適用
     */
    async applyPerformanceInsight(insight) {
        // 具体的な設定変更処理
        for (const action of insight.actions) {
            switch (action.type) {
                case 'scoreThreshold':
                    this.updateScoreThreshold(action.value);
                    break;
                case 'expectedValueThreshold':
                    this.updateExpectedValueThreshold(action.value);
                    break;
                case 'popularityWeight':
                    this.updatePopularityWeight(action.value);
                    break;
            }
        }
    }

    /**
     * リスクインサイトの適用
     */
    async applyRiskInsight(insight) {
        for (const action of insight.actions) {
            switch (action.type) {
                case 'riskMultiplier':
                    this.updateRiskMultiplier(action.value);
                    break;
                case 'maxBetAmount':
                    this.updateMaxBetAmount(action.value);
                    break;
            }
        }
    }

    /**
     * ポートフォリオインサイトの適用
     */
    async applyPortfolioInsight(insight) {
        for (const action of insight.actions) {
            switch (action.type) {
                case 'removeCandidates':
                    this.removeCandidates(action.candidateIds);
                    break;
                case 'adjustAllocation':
                    this.adjustAllocation(action.adjustments);
                    break;
            }
        }
    }

    /**
     * 試算の実行
     */
    async performSimulation(insight) {
        // 現在の設定を保存
        const currentSettings = this.saveCurrentSettings();
        
        try {
            // 試算用の設定を一時的に適用
            await this.applyInsight(insight);
            
            // 仮想的な成績予測
            const simulationResults = this.predictPerformance(insight);
            
            // 設定を元に戻す
            await this.restoreSettings(currentSettings);
            
            return simulationResults;
            
        } catch (error) {
            // エラー時も設定を元に戻す
            await this.restoreSettings(currentSettings);
            throw error;
        }
    }

    /**
     * 試算結果の表示
     */
    showSimulationResults(insight, simulation) {
        const resultsHtml = `
            <div class="simulation-results">
                <h4>🧪 試算結果: ${insight.title}</h4>
                
                <div class="simulation-comparison">
                    <div class="simulation-before">
                        <h5>現在</h5>
                        <p>勝率: ${simulation.before.winRate.toFixed(1)}%</p>
                        <p>ROI: ${simulation.before.roi.toFixed(1)}%</p>
                        <p>リスク: ${simulation.before.riskLevel}</p>
                    </div>
                    <div class="simulation-arrow">→</div>
                    <div class="simulation-after">
                        <h5>適用後予測</h5>
                        <p>勝率: ${simulation.after.winRate.toFixed(1)}%</p>
                        <p>ROI: ${simulation.after.roi.toFixed(1)}%</p>
                        <p>リスク: ${simulation.after.riskLevel}</p>
                    </div>
                </div>
                
                <div class="simulation-impact">
                    <h5>📈 予測される効果</h5>
                    <ul>
                        ${simulation.impacts.map(impact => `<li>${impact}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="simulation-confidence">
                    <h5>📊 信頼度</h5>
                    <p>${simulation.confidence}%</p>
                </div>
                
                <div class="simulation-actions">
                    <button onclick="actionableInsightsManager.acceptInsight('${insight.id}')" class="accept-btn">
                        ✅ 適用する
                    </button>
                    <button onclick="actionableInsightsManager.closeModal()" class="cancel-btn">
                        ❌ キャンセル
                    </button>
                </div>
            </div>
        `;
        
        this.showModal('試算結果', resultsHtml);
    }

    /**
     * インサイトカードの削除
     */
    removeInsightCard(insightId) {
        const card = document.querySelector(`[data-insight-id="${insightId}"]`);
        if (card) {
            card.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                card.remove();
                this.insights = this.insights.filter(i => i.id !== insightId);
                this.renderInsights();
            }, 300);
        }
    }

    /**
     * 採用率の計算
     */
    getAcceptanceRate() {
        const total = this.stats.acceptedInsights + this.stats.rejectedInsights;
        return total > 0 ? Math.round((this.stats.acceptedInsights / total) * 100) : 0;
    }

    /**
     * インサイトの手動更新
     */
    async refreshInsights() {
        console.log('🔄 インサイト手動更新');
        await this.generateInsights();
        this.showMessage('🔄 インサイトを更新しました', 'info');
    }

    /**
     * インサイト履歴の表示
     */
    showInsightHistory() {
        const historyHtml = `
            <div class="insight-history">
                <h4>📋 インサイト履歴</h4>
                ${this.insightHistory.length === 0 ? '<p>履歴がありません</p>' : ''}
                <div class="history-list">
                    ${this.insightHistory.slice(-10).reverse().map(insight => `
                        <div class="history-item ${insight.status}">
                            <div class="history-header">
                                <span class="history-title">${insight.title}</span>
                                <span class="history-status ${insight.status}">${insight.status}</span>
                            </div>
                            <div class="history-date">
                                ${new Date(insight.appliedAt || insight.rejectedAt).toLocaleString()}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.showModal('インサイト履歴', historyHtml);
    }

    /**
     * 設定の表示
     */
    showSettings() {
        const settingsHtml = `
            <div class="insight-settings">
                <h4>⚙️ インサイト設定</h4>
                
                <div class="setting-group">
                    <h5>機能有効化</h5>
                    <label>
                        <input type="checkbox" ${this.insightSettings.enablePerformanceAnalysis ? 'checked' : ''} 
                               onchange="actionableInsightsManager.updateSetting('enablePerformanceAnalysis', this.checked)">
                        パフォーマンス分析
                    </label>
                    <label>
                        <input type="checkbox" ${this.insightSettings.enableRiskAdjustment ? 'checked' : ''} 
                               onchange="actionableInsightsManager.updateSetting('enableRiskAdjustment', this.checked)">
                        リスク調整推奨
                    </label>
                    <label>
                        <input type="checkbox" ${this.insightSettings.enablePortfolioOptimization ? 'checked' : ''} 
                               onchange="actionableInsightsManager.updateSetting('enablePortfolioOptimization', this.checked)">
                        ポートフォリオ最適化
                    </label>
                    <label>
                        <input type="checkbox" ${this.insightSettings.enableScenarioAnalysis ? 'checked' : ''} 
                               onchange="actionableInsightsManager.updateSetting('enableScenarioAnalysis', this.checked)">
                        シナリオ分析
                    </label>
                </div>
                
                <div class="setting-group">
                    <h5>表示設定</h5>
                    <label>
                        最大表示数:
                        <input type="number" min="1" max="10" value="${this.insightSettings.maxInsightsToShow}" 
                               onchange="actionableInsightsManager.updateSetting('maxInsightsToShow', parseInt(this.value))">
                    </label>
                    <label>
                        更新間隔 (秒):
                        <input type="number" min="5" max="60" value="${this.insightSettings.updateInterval / 1000}" 
                               onchange="actionableInsightsManager.updateSetting('updateInterval', parseInt(this.value) * 1000)">
                    </label>
                </div>
                
                <div class="setting-group">
                    <h5>統計情報</h5>
                    <p>総提案数: ${this.stats.totalInsights}</p>
                    <p>採用数: ${this.stats.acceptedInsights}</p>
                    <p>却下数: ${this.stats.rejectedInsights}</p>
                    <p>採用率: ${this.getAcceptanceRate()}%</p>
                </div>
                
                <div class="setting-actions">
                    <button onclick="actionableInsightsManager.resetSettings()" class="reset-btn">
                        🔄 設定リセット
                    </button>
                    <button onclick="actionableInsightsManager.closeModal()" class="close-btn">
                        ✅ 閉じる
                    </button>
                </div>
            </div>
        `;
        
        this.showModal('設定', settingsHtml);
    }

    /**
     * 設定の更新
     */
    updateSetting(key, value) {
        this.insightSettings[key] = value;
        this.saveUserPreferences();
        console.log(`⚙️ 設定更新: ${key} = ${value}`);
    }

    /**
     * 設定のリセット
     */
    resetSettings() {
        this.insightSettings = {
            enablePerformanceAnalysis: true,
            enableRiskAdjustment: true,
            enablePortfolioOptimization: true,
            enableScenarioAnalysis: true,
            updateInterval: 10000,
            maxInsightsToShow: 5,
            urgencyThresholds: {
                critical: 3,
                warning: 2,
                info: 1
            }
        };
        this.saveUserPreferences();
        this.showMessage('⚙️ 設定をリセットしました', 'info');
        this.closeModal();
    }

    /**
     * ユーザー設定の保存
     */
    saveUserPreferences() {
        const preferences = {
            insightSettings: this.insightSettings,
            stats: this.stats
        };
        localStorage.setItem('actionableInsightsPreferences', JSON.stringify(preferences));
    }

    /**
     * ユーザー設定の読み込み
     */
    loadUserPreferences() {
        const saved = localStorage.getItem('actionableInsightsPreferences');
        if (saved) {
            try {
                const preferences = JSON.parse(saved);
                if (preferences.insightSettings) {
                    this.insightSettings = { ...this.insightSettings, ...preferences.insightSettings };
                }
                if (preferences.stats) {
                    this.stats = { ...this.stats, ...preferences.stats };
                }
            } catch (error) {
                console.error('設定読み込みエラー:', error);
            }
        }
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
     * 各種計算メソッド
     */
    calculateWinRate(performanceData) {
        if (!performanceData || performanceData.length === 0) return 0;
        const wins = performanceData.filter(p => p.result === 'win').length;
        return (wins / performanceData.length) * 100;
    }

    calculateROI(performanceData) {
        if (!performanceData || performanceData.length === 0) return 0;
        const totalInvestment = performanceData.reduce((sum, p) => sum + p.investment, 0);
        const totalReturn = performanceData.reduce((sum, p) => sum + p.return, 0);
        return totalInvestment > 0 ? ((totalReturn - totalInvestment) / totalInvestment) * 100 : 0;
    }

    calculateConsecutiveLosses(performanceData) {
        if (!performanceData || performanceData.length === 0) return 0;
        let consecutive = 0;
        for (let i = performanceData.length - 1; i >= 0; i--) {
            if (performanceData[i].result === 'loss') {
                consecutive++;
            } else {
                break;
            }
        }
        return consecutive;
    }

    calculatePortfolioEfficiency(portfolioData) {
        if (!portfolioData) return 0;
        // 簡略化した効率計算
        const totalExpectedValue = portfolioData.expectedReturn || 0;
        const totalInvestment = portfolioData.totalInvestment || 1;
        return totalExpectedValue / totalInvestment;
    }

    /**
     * モーダルの表示
     */
    showModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'insight-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="actionableInsightsManager.closeModal()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button onclick="actionableInsightsManager.closeModal()" class="close-btn">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    /**
     * モーダルの閉じる
     */
    closeModal() {
        const modal = document.querySelector('.insight-modal');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * メッセージの表示
     */
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `insight-message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        messageDiv.style.background = colors[type] || colors.info;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }

    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // ページ離脱時の設定保存
        window.addEventListener('beforeunload', () => {
            this.saveUserPreferences();
        });
    }

    /**
     * スタイルの追加
     */
    addInsightStyles() {
        if (document.getElementById('actionable-insights-styles')) return;

        const style = document.createElement('style');
        style.id = 'actionable-insights-styles';
        style.textContent = `
            .actionable-insights-panel {
                margin: 20px 0;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 12px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }

            .insights-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #e9ecef;
            }

            .insights-header h3 {
                margin: 0;
                color: #2c3e50;
            }

            .insights-controls {
                display: flex;
                gap: 10px;
            }

            .insights-controls button {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.9rem;
                transition: all 0.3s ease;
            }

            .refresh-btn {
                background: #17a2b8;
                color: white;
            }

            .history-btn {
                background: #6c757d;
                color: white;
            }

            .settings-btn {
                background: #28a745;
                color: white;
            }

            .insights-controls button:hover {
                opacity: 0.9;
                transform: translateY(-1px);
            }

            .insights-summary {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding: 10px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .insight-count {
                font-weight: bold;
                color: #495057;
            }

            .effectiveness-rate {
                font-size: 0.9rem;
                color: #6c757d;
            }

            .insights-list {
                display: grid;
                gap: 15px;
            }

            .insight-card {
                background: white;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                transition: all 0.3s ease;
            }

            .insight-card:hover {
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transform: translateY(-2px);
            }

            .insight-card.priority-critical {
                border-left: 5px solid #dc3545;
            }

            .insight-card.priority-warning {
                border-left: 5px solid #ffc107;
            }

            .insight-card.priority-info {
                border-left: 5px solid #17a2b8;
            }

            .insight-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .insight-priority {
                font-weight: bold;
                font-size: 0.9rem;
                padding: 4px 8px;
                border-radius: 4px;
                background: #f8f9fa;
            }

            .insight-timestamp {
                font-size: 0.8rem;
                color: #6c757d;
            }

            .insight-title {
                margin: 0 0 10px 0;
                color: #2c3e50;
            }

            .insight-description {
                margin: 0 0 15px 0;
                color: #495057;
                line-height: 1.5;
            }

            .current-metrics {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 6px;
                margin-bottom: 15px;
            }

            .current-metrics h5 {
                margin: 0 0 10px 0;
                color: #495057;
            }

            .metric-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
            }

            .metric-label {
                color: #6c757d;
            }

            .metric-value {
                font-weight: bold;
                color: #2c3e50;
            }

            .recommended-actions {
                margin-bottom: 15px;
            }

            .recommended-actions h5 {
                margin: 0 0 10px 0;
                color: #495057;
            }

            .recommended-actions ul {
                margin: 0;
                padding-left: 20px;
            }

            .recommended-actions li {
                margin-bottom: 8px;
                line-height: 1.4;
            }

            .expected-effect {
                color: #28a745;
                font-size: 0.9rem;
            }

            .prediction {
                background: #e7f3ff;
                padding: 15px;
                border-radius: 6px;
                margin-bottom: 15px;
            }

            .prediction h5 {
                margin: 0 0 10px 0;
                color: #495057;
            }

            .insight-actions {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }

            .insight-actions button {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.9rem;
                transition: all 0.3s ease;
            }

            .accept-btn {
                background: #28a745;
                color: white;
            }

            .simulate-btn {
                background: #17a2b8;
                color: white;
            }

            .reject-btn {
                background: #dc3545;
                color: white;
            }

            .details-btn {
                background: #6c757d;
                color: white;
            }

            .insight-actions button:hover {
                opacity: 0.9;
                transform: translateY(-1px);
            }

            .no-insights {
                text-align: center;
                padding: 40px;
                color: #6c757d;
            }

            .no-insights p {
                margin: 5px 0;
            }

            /* モーダル */
            .insight-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
            }

            .modal-content {
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                position: relative;
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid #e9ecef;
            }

            .modal-header h3 {
                margin: 0;
                color: #2c3e50;
            }

            .modal-header .close-btn {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #6c757d;
                padding: 0;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .modal-header .close-btn:hover {
                background: #f8f9fa;
            }

            .modal-body {
                padding: 20px;
            }

            /* 試算結果 */
            .simulation-results {
                text-align: center;
            }

            .simulation-comparison {
                display: grid;
                grid-template-columns: 1fr auto 1fr;
                gap: 20px;
                margin: 20px 0;
                align-items: center;
            }

            .simulation-before,
            .simulation-after {
                padding: 15px;
                border-radius: 8px;
                background: #f8f9fa;
            }

            .simulation-arrow {
                font-size: 1.5rem;
                color: #007bff;
            }

            .simulation-impact {
                background: #e7f3ff;
                padding: 15px;
                border-radius: 8px;
                margin: 15px 0;
            }

            .simulation-impact h5 {
                margin: 0 0 10px 0;
            }

            .simulation-impact ul {
                margin: 0;
                padding-left: 20px;
                text-align: left;
            }

            .simulation-confidence {
                margin: 15px 0;
            }

            .simulation-actions {
                display: flex;
                gap: 10px;
                justify-content: center;
                margin-top: 20px;
            }

            .simulation-actions button {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s ease;
            }

            .simulation-actions .accept-btn {
                background: #28a745;
                color: white;
            }

            .simulation-actions .cancel-btn {
                background: #6c757d;
                color: white;
            }

            /* 履歴 */
            .history-list {
                max-height: 400px;
                overflow-y: auto;
            }

            .history-item {
                padding: 15px;
                border-bottom: 1px solid #e9ecef;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .history-header {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }

            .history-title {
                font-weight: bold;
                color: #2c3e50;
            }

            .history-status {
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 0.8rem;
                font-weight: bold;
                text-transform: uppercase;
            }

            .history-status.accepted {
                background: #d4edda;
                color: #155724;
            }

            .history-status.rejected {
                background: #f8d7da;
                color: #721c24;
            }

            .history-date {
                font-size: 0.9rem;
                color: #6c757d;
            }

            /* 設定 */
            .insight-settings {
                max-width: 500px;
            }

            .setting-group {
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px solid #e9ecef;
            }

            .setting-group h5 {
                margin: 0 0 10px 0;
                color: #495057;
            }

            .setting-group label {
                display: block;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .setting-group input[type="checkbox"] {
                width: 16px;
                height: 16px;
            }

            .setting-group input[type="number"] {
                width: 60px;
                padding: 4px;
                border: 1px solid #ced4da;
                border-radius: 4px;
            }

            .setting-actions {
                display: flex;
                gap: 10px;
                justify-content: center;
            }

            .setting-actions button {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s ease;
            }

            .reset-btn {
                background: #ffc107;
                color: #212529;
            }

            .close-btn {
                background: #28a745;
                color: white;
            }

            /* アニメーション */
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes fadeOut {
                from {
                    opacity: 1;
                    transform: scale(1);
                }
                to {
                    opacity: 0;
                    transform: scale(0.9);
                }
            }

            /* レスポンシブ */
            @media (max-width: 768px) {
                .actionable-insights-panel {
                    margin: 10px;
                    padding: 15px;
                }

                .insights-header {
                    flex-direction: column;
                    gap: 15px;
                    align-items: stretch;
                }

                .insights-controls {
                    justify-content: center;
                }

                .insights-summary {
                    flex-direction: column;
                    gap: 10px;
                }

                .insight-actions {
                    flex-direction: column;
                }

                .insight-actions button {
                    width: 100%;
                }

                .simulation-comparison {
                    grid-template-columns: 1fr;
                    gap: 10px;
                }

                .simulation-arrow {
                    transform: rotate(90deg);
                }

                .modal-content {
                    width: 95%;
                    max-height: 90vh;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * システムの破棄
     */
    destroy() {
        console.log('🗑️ アクショナブルインサイトシステム破棄');
        
        // 定期更新の停止
        clearInterval(this.updateInterval);
        
        // コンテナの削除
        const container = document.getElementById(this.containerId);
        if (container) {
            container.remove();
        }
        
        // スタイルの削除
        const style = document.getElementById('actionable-insights-styles');
        if (style) {
            style.remove();
        }
        
        // 設定の保存
        this.saveUserPreferences();
    }
}

// 分析モジュールの基底クラス
class AnalysisModule {
    constructor(name) {
        this.name = name;
        this.enabled = true;
    }

    async analyze() {
        if (!this.enabled) return [];
        
        try {
            return await this.performAnalysis();
        } catch (error) {
            console.error(`❌ ${this.name} 分析エラー:`, error);
            return [];
        }
    }

    async performAnalysis() {
        // 個別モジュールで実装
        return [];
    }

    generateInsight(type, priority, title, description, actions, options = {}) {
        return {
            id: this.generateId(),
            type: type,
            subType: options.subType || 'general',
            priority: priority,
            title: title,
            description: description,
            actions: actions,
            timestamp: new Date().toISOString(),
            confidence: options.confidence || 75,
            prediction: options.prediction || null,
            rationale: options.rationale || null,
            currentMetrics: options.currentMetrics || null
        };
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// グローバル公開
window.ActionableInsightsManager = ActionableInsightsManager;
window.AnalysisModule = AnalysisModule;

// 自動初期化（全コンポーネント読み込み後）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.actionableInsightsManager = new ActionableInsightsManager();
            window.actionableInsightsManager.initialize();
        }, 3000); // 他のコンポーネント初期化後
    });
} else {
    setTimeout(() => {
        window.actionableInsightsManager = new ActionableInsightsManager();
        window.actionableInsightsManager.initialize();
    }, 3000);
}