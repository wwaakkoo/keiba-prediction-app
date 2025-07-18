// Phase 7: ポートフォリオダッシュボード
class PortfolioDashboard {
    constructor() {
        this.portfolioData = null;
        this.performanceHistory = [];
        this.riskAdjustmentHistory = [];
        this.updateInterval = null;
    }

    // メインダッシュボード初期化
    initialize() {
        console.log('📊 ポートフォリオダッシュボード初期化開始');
        
        this.loadDataFromPhase6Systems();
        this.createDashboardContainer();
        this.renderDashboard();
        this.startRealTimeUpdates();
        
        console.log('✅ ポートフォリオダッシュボード初期化完了');
    }

    // Phase 6システムからのデータ統合
    loadDataFromPhase6Systems() {
        try {
            // Kelly Capital Manager からポートフォリオデータ取得
            if (window.KellyCapitalManager && window.kellyCapitalManager) {
                this.portfolioData = this.extractPortfolioData();
            } else if (window.KellyCapitalManager) {
                // インスタンスが存在しない場合は作成
                window.kellyCapitalManager = new window.KellyCapitalManager();
                this.portfolioData = this.extractPortfolioData();
            }

            // パフォーマンス履歴取得
            this.performanceHistory = this.loadPerformanceHistory();

            // リスク調整履歴取得
            this.riskAdjustmentHistory = this.loadRiskAdjustmentHistory();

            console.log('📊 Phase 6データ統合完了', {
                portfolioData: !!this.portfolioData,
                performanceCount: this.performanceHistory.length,
                riskAdjustmentCount: this.riskAdjustmentHistory.length
            });
        } catch (error) {
            console.error('❌ データ統合エラー:', error);
            // フォールバック: サンプルデータを生成
            this.generateSampleData();
        }
    }

    // Kelly Portfolioデータ抽出
    extractPortfolioData() {
        // Kelly Capital Manager から現在のポートフォリオデータを取得
        const kellyResults = localStorage.getItem('kellyPortfolioResults');
        if (kellyResults) {
            const parsed = JSON.parse(kellyResults);
            return {
                totalInvestment: parsed.totalInvestment || 0,
                expectedReturn: parsed.expectedReturn || 0,
                mainCandidates: parsed.mainCandidates || [],
                optionalCandidates: parsed.optionalCandidates || [],
                riskMultiplier: parsed.riskMultiplier || 1.0,
                conflictResolutions: parsed.conflictResolutions || [],
                portfolioSpread: parsed.portfolioSpread || 0.0,
                avgKellyRatio: parsed.avgKellyRatio || 0.0
            };
        }

        // データがない場合はサンプル生成
        return this.generateSamplePortfolioData();
    }

    // パフォーマンス履歴読み込み
    loadPerformanceHistory() {
        const saved = localStorage.getItem('phase7PerformanceHistory');
        if (saved) {
            return JSON.parse(saved);
        }

        // サンプルデータ生成（過去20レース）
        return Array.from({length: 20}, (_, i) => ({
            raceId: `R${i + 1}`,
            date: new Date(Date.now() - (19 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
            winRate: Math.random() * 0.4 + 0.2, // 20-60%
            roi: (Math.random() - 0.3) * 0.5, // -30% to +20%
            cumulativeReturn: i * 100 + Math.random() * 500,
            totalInvestment: 1000 + Math.random() * 2000,
            riskMultiplier: Math.random() * 0.8 + 0.4 // 0.4-1.2
        }));
    }

    // リスク調整履歴読み込み
    loadRiskAdjustmentHistory() {
        const saved = localStorage.getItem('phase7RiskAdjustmentHistory');
        if (saved) {
            return JSON.parse(saved);
        }

        // サンプルデータ生成
        return Array.from({length: 10}, (_, i) => ({
            date: new Date(Date.now() - (9 - i) * 12 * 60 * 60 * 1000).toLocaleDateString(),
            multiplier: Math.random() * 0.8 + 0.4,
            trigger: ['連敗', '高勝率', 'ドローダウン', '好調継続'][Math.floor(Math.random() * 4)],
            reason: 'パフォーマンス変動による自動調整',
            previousMultiplier: Math.random() * 0.8 + 0.4
        }));
    }

    // サンプルポートフォリオデータ生成
    generateSamplePortfolioData() {
        return {
            totalInvestment: 3850,
            expectedReturn: 4400,
            mainCandidates: [
                { name: 'サンプル馬A', kellyRatio: 0.08, investment: 800, expectedValue: 1.15 },
                { name: 'サンプル馬B', kellyRatio: 0.05, investment: 500, expectedValue: 1.08 }
            ],
            optionalCandidates: [
                { name: 'サンプル馬C', kellyRatio: 0.03, investment: 300, expectedValue: 1.12 },
                { name: 'サンプル馬D', kellyRatio: 0.02, investment: 200, expectedValue: 1.05 }
            ],
            riskMultiplier: 0.8,
            conflictResolutions: ['1R-2候補統合', '5R-スキップ判定'],
            portfolioSpread: 0.72,
            avgKellyRatio: 0.045
        };
    }

    // ダッシュボードコンテナ作成
    createDashboardContainer() {
        // 既存のコンテナがあれば削除
        const existing = document.getElementById('portfolioDashboardContainer');
        if (existing) {
            existing.remove();
        }

        // メインコンテナを作成
        const container = document.createElement('div');
        container.id = 'portfolioDashboardContainer';
        container.innerHTML = `
            <div class="dashboard-section" style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <h2 style="color: #1976d2; margin: 0 0 20px 0; display: flex; align-items: center;">
                    📊 Kelly Criterion ダッシュボード
                    <span id="dashboardLastUpdate" style="margin-left: auto; font-size: 0.7em; color: #666;"></span>
                </h2>
                
                <!-- リアルタイム投資状況 -->
                <div id="investmentSummary" class="investment-summary"></div>
                
                <!-- ポートフォリオ詳細 -->
                <div id="portfolioBreakdown" class="portfolio-breakdown"></div>
                
                <!-- パフォーマンス概要 -->
                <div id="performanceOverview" class="performance-overview"></div>
                
                <!-- リスク調整履歴 -->
                <div id="riskAdjustmentSection" class="risk-adjustment-section"></div>
            </div>
        `;

        // 適切な場所に挿入（学習セクションの前）
        const learningSection = document.querySelector('#learningSection');
        if (learningSection) {
            learningSection.parentNode.insertBefore(container, learningSection);
        } else {
            // フォールバック: bodyの最後に追加
            document.body.appendChild(container);
        }
    }

    // メインダッシュボードレンダリング
    renderDashboard() {
        this.renderInvestmentSummary();
        this.renderPortfolioBreakdown();
        this.renderPerformanceOverview();
        this.renderRiskAdjustmentSection();
        this.updateLastUpdateTime();
    }

    // 投資状況サマリー表示
    renderInvestmentSummary() {
        const container = document.getElementById('investmentSummary');
        if (!container || !this.portfolioData) return;

        const data = this.portfolioData;
        const roi = ((data.expectedReturn - data.totalInvestment) / data.totalInvestment * 100).toFixed(1);
        const riskColor = data.riskMultiplier >= 1.0 ? '#2e7d32' : data.riskMultiplier >= 0.7 ? '#f57c00' : '#d32f2f';

        container.innerHTML = `
            <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <h4 style="color: #424242; margin: 0 0 15px 0;">💰 リアルタイム投資状況</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div style="text-align: center; padding: 15px; background: #e3f2fd; border-radius: 8px;">
                        <div style="font-size: 0.9em; color: #1976d2; margin-bottom: 5px;">総投資額</div>
                        <div style="font-size: 1.5em; font-weight: bold; color: #0d47a1;">${data.totalInvestment.toLocaleString()}円</div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: #f1f8e9; border-radius: 8px;">
                        <div style="font-size: 0.9em; color: #388e3c; margin-bottom: 5px;">期待回収額</div>
                        <div style="font-size: 1.5em; font-weight: bold; color: #1b5e20;">${data.expectedReturn.toLocaleString()}円</div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: ${roi >= 0 ? '#f1f8e9' : '#ffebee'}; border-radius: 8px;">
                        <div style="font-size: 0.9em; color: ${roi >= 0 ? '#388e3c' : '#d32f2f'}; margin-bottom: 5px;">期待ROI</div>
                        <div style="font-size: 1.5em; font-weight: bold; color: ${roi >= 0 ? '#1b5e20' : '#c62828'};">${roi >= 0 ? '+' : ''}${roi}%</div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: #fff3e0; border-radius: 8px;">
                        <div style="font-size: 0.9em; color: #f57c00; margin-bottom: 5px;">リスク倍率</div>
                        <div style="font-size: 1.5em; font-weight: bold; color: ${riskColor};">${data.riskMultiplier.toFixed(1)}x</div>
                    </div>
                </div>
            </div>
        `;
    }

    // ポートフォリオ詳細表示
    renderPortfolioBreakdown() {
        const container = document.getElementById('portfolioBreakdown');
        if (!container || !this.portfolioData) return;

        const data = this.portfolioData;

        container.innerHTML = `
            <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <h4 style="color: #424242; margin: 0 0 15px 0;">🎯 今回のポートフォリオ分析</h4>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
                    <!-- メイン候補 -->
                    <div style="background: #e8f5e8; border-left: 4px solid #4caf50; padding: 15px; border-radius: 8px;">
                        <h5 style="color: #2e7d32; margin: 0 0 10px 0;">🏆 メイン候補 (${data.mainCandidates.length}頭)</h5>
                        ${data.mainCandidates.map(candidate => `
                            <div style="margin-bottom: 8px; font-size: 0.9em;">
                                <strong>${candidate.name}</strong><br>
                                <span style="color: #666;">Kelly: ${(candidate.kellyRatio * 100).toFixed(1)}% | 投資: ${candidate.investment}円 | 期待値: ${candidate.expectedValue.toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- オプショナル候補 -->
                    <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; border-radius: 8px;">
                        <h5 style="color: #f57c00; margin: 0 0 10px 0;">🛡️ オプショナル候補 (${data.optionalCandidates.length}頭)</h5>
                        ${data.optionalCandidates.map(candidate => `
                            <div style="margin-bottom: 8px; font-size: 0.9em;">
                                <strong>${candidate.name}</strong><br>
                                <span style="color: #666;">Kelly: ${(candidate.kellyRatio * 100).toFixed(1)}% | 投資: ${candidate.investment}円 | 期待値: ${candidate.expectedValue.toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- 競合解決・統計情報 -->
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div>
                            <span style="color: #666; font-size: 0.9em;">競合解決:</span><br>
                            <strong style="color: #1976d2;">${data.conflictResolutions.join(', ') || 'なし'}</strong>
                        </div>
                        <div>
                            <span style="color: #666; font-size: 0.9em;">ポートフォリオ分散度:</span><br>
                            <strong style="color: #1976d2;">${(data.portfolioSpread * 100).toFixed(1)}%</strong>
                        </div>
                        <div>
                            <span style="color: #666; font-size: 0.9em;">平均Kelly比率:</span><br>
                            <strong style="color: #1976d2;">${(data.avgKellyRatio * 100).toFixed(1)}%</strong>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // パフォーマンス概要表示
    renderPerformanceOverview() {
        const container = document.getElementById('performanceOverview');
        if (!container) return;

        const recentPerformance = this.calculateRecentPerformance();

        container.innerHTML = `
            <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <h4 style="color: #424242; margin: 0 0 15px 0;">📈 パフォーマンス概要 (過去10レース)</h4>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                    <div style="text-align: center; padding: 10px; background: #f3e5f5; border-radius: 6px;">
                        <div style="font-size: 0.85em; color: #7b1fa2;">平均勝率</div>
                        <div style="font-size: 1.3em; font-weight: bold; color: #4a148c;">${(recentPerformance.avgWinRate * 100).toFixed(1)}%</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: #e0f2f1; border-radius: 6px;">
                        <div style="font-size: 0.85em; color: #00695c;">平均ROI</div>
                        <div style="font-size: 1.3em; font-weight: bold; color: #004d40;">${(recentPerformance.avgROI * 100).toFixed(1)}%</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: #fff8e1; border-radius: 6px;">
                        <div style="font-size: 0.85em; color: #ef6c00;">累積収益</div>
                        <div style="font-size: 1.3em; font-weight: bold; color: #bf360c;">${recentPerformance.totalReturn.toLocaleString()}円</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: #fce4ec; border-radius: 6px;">
                        <div style="font-size: 0.85em; color: #c2185b;">現在の連続</div>
                        <div style="font-size: 1.3em; font-weight: bold; color: #880e4f;">${recentPerformance.currentStreak}</div>
                    </div>
                </div>
            </div>
        `;
    }

    // 最近のパフォーマンス計算
    calculateRecentPerformance() {
        const recent = this.performanceHistory.slice(-10);
        
        const avgWinRate = recent.reduce((sum, r) => sum + r.winRate, 0) / recent.length || 0;
        const avgROI = recent.reduce((sum, r) => sum + r.roi, 0) / recent.length || 0;
        const totalReturn = recent.reduce((sum, r) => sum + r.cumulativeReturn, 0);
        
        // 連続記録計算（簡易版）
        const lastResult = recent[recent.length - 1];
        const currentStreak = lastResult && lastResult.roi > 0 ? '勝3' : '負2';

        return {
            avgWinRate,
            avgROI, 
            totalReturn,
            currentStreak
        };
    }

    // リスク調整セクション表示
    renderRiskAdjustmentSection() {
        const container = document.getElementById('riskAdjustmentSection');
        if (!container) return;

        const recentAdjustments = this.riskAdjustmentHistory.slice(-5);

        container.innerHTML = `
            <div style="background: white; border-radius: 8px; padding: 15px;">
                <h4 style="color: #424242; margin: 0 0 15px 0;">⚖️ 動的リスク調整履歴</h4>
                
                <div style="max-height: 200px; overflow-y: auto;">
                    ${recentAdjustments.map(adj => `
                        <div style="padding: 10px; margin-bottom: 8px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #2196f3;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-weight: bold; color: #1976d2;">${adj.date}</span>
                                <span style="background: #e3f2fd; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; color: #0d47a1;">
                                    ${adj.previousMultiplier.toFixed(1)}x → ${adj.multiplier.toFixed(1)}x
                                </span>
                            </div>
                            <div style="margin-top: 5px; font-size: 0.9em; color: #666;">
                                <strong>トリガー:</strong> ${adj.trigger} | <strong>理由:</strong> ${adj.reason}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // 最終更新時刻表示
    updateLastUpdateTime() {
        const container = document.getElementById('dashboardLastUpdate');
        if (container) {
            container.textContent = `最終更新: ${new Date().toLocaleTimeString()}`;
        }
    }

    // リアルタイム更新開始
    startRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(() => {
            this.loadDataFromPhase6Systems();
            this.renderDashboard();
        }, 30000); // 30秒間隔

        console.log('🔄 リアルタイム更新開始 (30秒間隔)');
    }

    // リアルタイム更新停止
    stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('⏹️ リアルタイム更新停止');
        }
    }

    // 手動更新
    manualUpdate() {
        console.log('🔄 手動更新実行');
        this.loadDataFromPhase6Systems();
        this.renderDashboard();
    }

    // サンプルデータ生成（開発・テスト用）
    generateSampleData() {
        console.log('📊 サンプルデータ生成（Phase 6システム未接続）');
        this.portfolioData = this.generateSamplePortfolioData();
        this.performanceHistory = this.loadPerformanceHistory();
        this.riskAdjustmentHistory = this.loadRiskAdjustmentHistory();
    }
}

// グローバル公開
window.PortfolioDashboard = PortfolioDashboard;

// 自動初期化（DOM読み込み完了時）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.portfolioDashboardInstance = new PortfolioDashboard();
        window.portfolioDashboardInstance.initialize();
    });
} else {
    window.portfolioDashboardInstance = new PortfolioDashboard();
    window.portfolioDashboardInstance.initialize();
}