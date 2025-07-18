// Phase 7: パフォーマンス時系列グラフ
class PerformanceCharts {
    constructor() {
        this.charts = {};
        this.chartColors = {
            winRate: '#4caf50',
            roi: '#2196f3',
            cumulativeReturn: '#ff9800',
            riskMultiplier: '#9c27b0',
            investment: '#607d8b'
        };
        this.performanceData = [];
        this.chartContainerId = 'performanceChartsContainer';
    }

    // 初期化
    initialize() {
        console.log('📈 パフォーマンスチャート初期化開始');
        
        this.loadPerformanceData();
        this.createChartsContainer();
        this.renderAllCharts();
        
        console.log('✅ パフォーマンスチャート初期化完了');
    }

    // パフォーマンスデータ読み込み
    loadPerformanceData() {
        try {
            // ローカルストレージから読み込み
            const saved = localStorage.getItem('phase7PerformanceHistory');
            if (saved) {
                this.performanceData = JSON.parse(saved);
            } else {
                // サンプルデータ生成
                this.generateSamplePerformanceData();
            }

            console.log('📊 パフォーマンスデータ読み込み完了', {
                dataPoints: this.performanceData.length
            });
        } catch (error) {
            console.error('❌ パフォーマンスデータ読み込みエラー:', error);
            this.generateSamplePerformanceData();
        }
    }

    // サンプルパフォーマンスデータ生成
    generateSamplePerformanceData() {
        console.log('📊 サンプルパフォーマンスデータ生成');
        
        this.performanceData = Array.from({length: 30}, (_, i) => {
            const baseWinRate = 0.3;
            const baseROI = -0.1;
            const trend = Math.sin(i / 5) * 0.1; // 周期的な変動
            
            return {
                raceId: `R${i + 1}`,
                date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
                dateLabel: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('ja-JP', {month: 'short', day: 'numeric'}),
                winRate: Math.max(0, Math.min(1, baseWinRate + trend + (Math.random() - 0.5) * 0.3)),
                roi: baseROI + trend * 2 + (Math.random() - 0.5) * 0.4,
                cumulativeReturn: i * 100 + Math.random() * 500 - 200,
                totalInvestment: 1000 + Math.random() * 2000,
                riskMultiplier: Math.max(0.3, Math.min(1.5, 1.0 + trend + (Math.random() - 0.5) * 0.4)),
                actualReturn: 0 // 計算される
            };
        });

        // 累積リターンの計算
        let cumulativeReturn = 0;
        this.performanceData.forEach(item => {
            const returnAmount = item.totalInvestment * (1 + item.roi) - item.totalInvestment;
            cumulativeReturn += returnAmount;
            item.cumulativeReturn = cumulativeReturn;
            item.actualReturn = returnAmount;
        });

        // ローカルストレージに保存
        localStorage.setItem('phase7PerformanceHistory', JSON.stringify(this.performanceData));
    }

    // チャートコンテナ作成
    createChartsContainer() {
        // 既存のコンテナがあれば削除
        const existing = document.getElementById(this.chartContainerId);
        if (existing) {
            existing.remove();
        }

        // 新しいコンテナを作成
        const container = document.createElement('div');
        container.id = this.chartContainerId;
        container.innerHTML = `
            <div class="charts-section" style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <h2 style="color: #1976d2; margin: 0 0 20px 0; display: flex; align-items: center;">
                    📈 パフォーマンス時系列分析
                    <button onclick="window.performanceChartsInstance?.updateCharts()" style="margin-left: auto; padding: 5px 10px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        🔄 更新
                    </button>
                </h2>
                
                <!-- チャート選択タブ -->
                <div class="chart-tabs" style="margin-bottom: 20px;">
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="chart-tab active" data-chart="overview" onclick="window.performanceChartsInstance?.switchChart('overview')" style="padding: 8px 15px; border: 1px solid #ddd; background: #2196f3; color: white; border-radius: 4px; cursor: pointer;">
                            📊 総合概要
                        </button>
                        <button class="chart-tab" data-chart="winRateROI" onclick="window.performanceChartsInstance?.switchChart('winRateROI')" style="padding: 8px 15px; border: 1px solid #ddd; background: white; color: #333; border-radius: 4px; cursor: pointer;">
                            🎯 勝率・ROI
                        </button>
                        <button class="chart-tab" data-chart="cumulativeReturn" onclick="window.performanceChartsInstance?.switchChart('cumulativeReturn')" style="padding: 8px 15px; border: 1px solid #ddd; background: white; color: #333; border-radius: 4px; cursor: pointer;">
                            💰 累積収益
                        </button>
                        <button class="chart-tab" data-chart="riskAnalysis" onclick="window.performanceChartsInstance?.switchChart('riskAnalysis')" style="padding: 8px 15px; border: 1px solid #ddd; background: white; color: #333; border-radius: 4px; cursor: pointer;">
                            ⚖️ リスク分析
                        </button>
                    </div>
                </div>
                
                <!-- チャート表示エリア -->
                <div id="chartDisplayArea" style="background: white; border-radius: 8px; padding: 20px;">
                    <canvas id="performanceChart" style="max-height: 400px;"></canvas>
                </div>
                
                <!-- チャート統計サマリー -->
                <div id="chartSummary" style="margin-top: 15px; padding: 15px; background: white; border-radius: 8px;">
                    <!-- 統計情報が動的に表示される -->
                </div>
            </div>
        `;

        // ダッシュボードコンテナの後に挿入
        const dashboardContainer = document.getElementById('portfolioDashboardContainer');
        if (dashboardContainer) {
            dashboardContainer.parentNode.insertBefore(container, dashboardContainer.nextSibling);
        } else {
            // フォールバック: bodyの最後に追加
            document.body.appendChild(container);
        }
    }

    // 全チャート描画
    renderAllCharts() {
        this.destroyExistingCharts();
        this.switchChart('overview');
    }

    // チャート切り替え
    switchChart(chartType) {
        // タブの切り替え
        document.querySelectorAll('.chart-tab').forEach(tab => {
            tab.style.background = 'white';
            tab.style.color = '#333';
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-chart="${chartType}"]`);
        if (activeTab) {
            activeTab.style.background = '#2196f3';
            activeTab.style.color = 'white';
            activeTab.classList.add('active');
        }

        // チャート描画
        this.destroyExistingCharts();
        
        switch(chartType) {
            case 'overview':
                this.renderOverviewChart();
                break;
            case 'winRateROI':
                this.renderWinRateROIChart();
                break;
            case 'cumulativeReturn':
                this.renderCumulativeReturnChart();
                break;
            case 'riskAnalysis':
                this.renderRiskAnalysisChart();
                break;
        }
        
        this.updateChartSummary(chartType);
    }

    // 総合概要チャート
    renderOverviewChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;

        const labels = this.performanceData.map(d => d.dateLabel);
        
        this.charts.overview = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '勝率 (%)',
                        data: this.performanceData.map(d => d.winRate * 100),
                        borderColor: this.chartColors.winRate,
                        backgroundColor: this.chartColors.winRate + '20',
                        yAxisID: 'y',
                        tension: 0.2
                    },
                    {
                        label: 'ROI (%)',
                        data: this.performanceData.map(d => d.roi * 100),
                        borderColor: this.chartColors.roi,
                        backgroundColor: this.chartColors.roi + '20',
                        yAxisID: 'y1',
                        tension: 0.2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '📊 勝率・ROI推移（過去30レース）'
                    },
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '期間'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: '勝率 (%)',
                            color: this.chartColors.winRate
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'ROI (%)',
                            color: this.chartColors.roi
                        },
                        grid: {
                            drawOnChartArea: true
                        }
                    }
                }
            }
        });
    }

    // 勝率・ROI詳細チャート
    renderWinRateROIChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;

        const labels = this.performanceData.map(d => d.dateLabel);
        
        this.charts.winRateROI = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '勝率 (%)',
                        data: this.performanceData.map(d => d.winRate * 100),
                        backgroundColor: this.chartColors.winRate + '80',
                        borderColor: this.chartColors.winRate,
                        borderWidth: 1
                    },
                    {
                        label: 'ROI (%)',
                        data: this.performanceData.map(d => d.roi * 100),
                        backgroundColor: this.chartColors.roi + '80',
                        borderColor: this.chartColors.roi,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '🎯 勝率・ROI詳細分析'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '期間'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'パーセンテージ (%)'
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // 累積収益チャート
    renderCumulativeReturnChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;

        const labels = this.performanceData.map(d => d.dateLabel);
        
        this.charts.cumulativeReturn = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '累積収益 (円)',
                        data: this.performanceData.map(d => d.cumulativeReturn),
                        borderColor: this.chartColors.cumulativeReturn,
                        backgroundColor: this.chartColors.cumulativeReturn + '20',
                        fill: true,
                        tension: 0.2
                    },
                    {
                        label: '投資額',
                        data: this.performanceData.map(d => d.totalInvestment),
                        borderColor: this.chartColors.investment,
                        backgroundColor: this.chartColors.investment + '20',
                        fill: false,
                        tension: 0.2,
                        borderDash: [5, 5]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '💰 累積収益推移'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '期間'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '金額 (円)'
                        }
                    }
                }
            }
        });
    }

    // リスク分析チャート
    renderRiskAnalysisChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;

        const labels = this.performanceData.map(d => d.dateLabel);
        
        this.charts.riskAnalysis = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'リスク vs リターン',
                        data: this.performanceData.map(d => ({
                            x: d.riskMultiplier,
                            y: d.roi * 100
                        })),
                        backgroundColor: this.chartColors.riskMultiplier + '80',
                        borderColor: this.chartColors.riskMultiplier,
                        pointRadius: 5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '⚖️ リスク倍率 vs ROI分析'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'リスク倍率'
                        },
                        min: 0.2,
                        max: 1.6
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'ROI (%)'
                        }
                    }
                }
            }
        });
    }

    // チャート統計サマリー更新
    updateChartSummary(chartType) {
        const summaryContainer = document.getElementById('chartSummary');
        if (!summaryContainer) return;

        const stats = this.calculateStatistics();
        
        let summaryHTML = '';
        
        switch(chartType) {
            case 'overview':
                summaryHTML = `
                    <h4 style="color: #424242; margin: 0 0 10px 0;">📊 総合統計</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div style="text-align: center; padding: 10px; background: #f1f8e9; border-radius: 6px;">
                            <div style="font-size: 0.9em; color: #388e3c;">平均勝率</div>
                            <div style="font-size: 1.2em; font-weight: bold; color: #1b5e20;">${stats.avgWinRate.toFixed(1)}%</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: #e3f2fd; border-radius: 6px;">
                            <div style="font-size: 0.9em; color: #1976d2;">平均ROI</div>
                            <div style="font-size: 1.2em; font-weight: bold; color: #0d47a1;">${stats.avgROI.toFixed(1)}%</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: #fff3e0; border-radius: 6px;">
                            <div style="font-size: 0.9em; color: #f57c00;">最終累積収益</div>
                            <div style="font-size: 1.2em; font-weight: bold; color: #ef6c00;">${stats.finalReturn.toLocaleString()}円</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: #f3e5f5; border-radius: 6px;">
                            <div style="font-size: 0.9em; color: #7b1fa2;">平均リスク倍率</div>
                            <div style="font-size: 1.2em; font-weight: bold; color: #4a148c;">${stats.avgRiskMultiplier.toFixed(2)}x</div>
                        </div>
                    </div>
                `;
                break;
            case 'winRateROI':
                summaryHTML = `
                    <h4 style="color: #424242; margin: 0 0 10px 0;">🎯 勝率・ROI統計</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                        <div><strong>最高勝率:</strong> ${stats.maxWinRate.toFixed(1)}%</div>
                        <div><strong>最低勝率:</strong> ${stats.minWinRate.toFixed(1)}%</div>
                        <div><strong>最高ROI:</strong> ${stats.maxROI.toFixed(1)}%</div>
                        <div><strong>最低ROI:</strong> ${stats.minROI.toFixed(1)}%</div>
                        <div><strong>プラス収支回数:</strong> ${stats.positiveROICount}回</div>
                        <div><strong>勝率安定度:</strong> ${stats.winRateStability.toFixed(1)}%</div>
                    </div>
                `;
                break;
            case 'cumulativeReturn':
                summaryHTML = `
                    <h4 style="color: #424242; margin: 0 0 10px 0;">💰 収益統計</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                        <div><strong>最大ドローダウン:</strong> ${stats.maxDrawdown.toLocaleString()}円</div>
                        <div><strong>最大利益:</strong> ${stats.maxProfit.toLocaleString()}円</div>
                        <div><strong>総投資額:</strong> ${stats.totalInvestment.toLocaleString()}円</div>
                        <div><strong>総回収額:</strong> ${stats.totalReturn.toLocaleString()}円</div>
                        <div><strong>回収率:</strong> ${stats.recoveryRate.toFixed(1)}%</div>
                        <div><strong>収益成長率:</strong> ${stats.growthRate.toFixed(1)}%</div>
                    </div>
                `;
                break;
            case 'riskAnalysis':
                summaryHTML = `
                    <h4 style="color: #424242; margin: 0 0 10px 0;">⚖️ リスク分析統計</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                        <div><strong>リスク範囲:</strong> ${stats.minRiskMultiplier.toFixed(2)}x - ${stats.maxRiskMultiplier.toFixed(2)}x</div>
                        <div><strong>リスク調整回数:</strong> ${stats.riskAdjustmentCount}回</div>
                        <div><strong>高リスク期間:</strong> ${stats.highRiskPeriods}回</div>
                        <div><strong>低リスク期間:</strong> ${stats.lowRiskPeriods}回</div>
                        <div><strong>リスク効率:</strong> ${stats.riskEfficiency.toFixed(2)}</div>
                        <div><strong>相関係数:</strong> ${stats.riskROICorrelation.toFixed(3)}</div>
                    </div>
                `;
                break;
        }
        
        summaryContainer.innerHTML = summaryHTML;
    }

    // 統計計算
    calculateStatistics() {
        const data = this.performanceData;
        const winRates = data.map(d => d.winRate * 100);
        const rois = data.map(d => d.roi * 100);
        const returns = data.map(d => d.cumulativeReturn);
        const risks = data.map(d => d.riskMultiplier);
        const investments = data.map(d => d.totalInvestment);

        return {
            avgWinRate: winRates.reduce((a, b) => a + b, 0) / winRates.length,
            avgROI: rois.reduce((a, b) => a + b, 0) / rois.length,
            finalReturn: returns[returns.length - 1] || 0,
            avgRiskMultiplier: risks.reduce((a, b) => a + b, 0) / risks.length,
            
            maxWinRate: Math.max(...winRates),
            minWinRate: Math.min(...winRates),
            maxROI: Math.max(...rois),
            minROI: Math.min(...rois),
            positiveROICount: rois.filter(r => r > 0).length,
            winRateStability: 100 - (Math.max(...winRates) - Math.min(...winRates)),
            
            maxDrawdown: Math.min(...returns),
            maxProfit: Math.max(...returns),
            totalInvestment: investments.reduce((a, b) => a + b, 0),
            totalReturn: investments.reduce((a, b) => a + b, 0) + returns[returns.length - 1],
            recoveryRate: ((investments.reduce((a, b) => a + b, 0) + returns[returns.length - 1]) / investments.reduce((a, b) => a + b, 0)) * 100,
            growthRate: returns.length > 1 ? ((returns[returns.length - 1] - returns[0]) / Math.abs(returns[0] || 1)) * 100 : 0,
            
            minRiskMultiplier: Math.min(...risks),
            maxRiskMultiplier: Math.max(...risks),
            riskAdjustmentCount: this.calculateRiskAdjustmentCount(),
            highRiskPeriods: risks.filter(r => r > 1.2).length,
            lowRiskPeriods: risks.filter(r => r < 0.6).length,
            riskEfficiency: rois.reduce((a, b) => a + b, 0) / risks.reduce((a, b) => a + b, 0),
            riskROICorrelation: this.calculateCorrelation(risks, rois)
        };
    }

    // リスク調整回数計算
    calculateRiskAdjustmentCount() {
        let count = 0;
        for (let i = 1; i < this.performanceData.length; i++) {
            if (Math.abs(this.performanceData[i].riskMultiplier - this.performanceData[i-1].riskMultiplier) > 0.1) {
                count++;
            }
        }
        return count;
    }

    // 相関係数計算
    calculateCorrelation(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
        const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
        const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        return denominator === 0 ? 0 : numerator / denominator;
    }

    // チャート更新
    updateCharts() {
        console.log('🔄 パフォーマンスチャート更新開始');
        this.loadPerformanceData();
        
        // 現在アクティブなタブを取得
        const activeTab = document.querySelector('.chart-tab.active');
        const activeChartType = activeTab ? activeTab.getAttribute('data-chart') : 'overview';
        
        this.switchChart(activeChartType);
        console.log('✅ パフォーマンスチャート更新完了');
    }

    // 既存チャート破棄
    destroyExistingCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }

    /**
     * チャートデータの更新（リアルタイム更新用）
     */
    updateChartData() {
        try {
            console.log('📊 パフォーマンスチャートデータ更新開始');
            
            // 最新データを取得
            this.loadPerformanceData();
            
            // 既存チャートがある場合は更新
            if (this.charts.winRateChart) {
                this.updateChart(this.charts.winRateChart, this.generateWinRateData());
            }
            if (this.charts.roiChart) {
                this.updateChart(this.charts.roiChart, this.generateROIData());
            }
            if (this.charts.cumulativeChart) {
                this.updateChart(this.charts.cumulativeChart, this.generateCumulativeData());
            }
            if (this.charts.riskChart) {
                this.updateChart(this.charts.riskChart, this.generateRiskData());
            }
            
            console.log('✅ パフォーマンスチャートデータ更新完了');
            
        } catch (error) {
            console.error('❌ チャートデータ更新エラー:', error);
        }
    }

    /**
     * 個別チャートの更新
     */
    updateChart(chart, newData) {
        if (!chart || !newData) return;
        
        // データを更新
        chart.data = newData;
        
        // アニメーションありで再描画
        chart.update('active');
    }

    // クリーンアップ
    destroy() {
        this.destroyExistingCharts();
        const container = document.getElementById(this.chartContainerId);
        if (container) {
            container.remove();
        }
    }
}

// グローバル公開
window.PerformanceCharts = PerformanceCharts;

// 自動初期化（ポートフォリオダッシュボードの後）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.performanceChartsInstance = new PerformanceCharts();
            window.performanceChartsInstance.initialize();
        }, 1000); // ダッシュボード初期化後に実行
    });
} else {
    setTimeout(() => {
        window.performanceChartsInstance = new PerformanceCharts();
        window.performanceChartsInstance.initialize();
    }, 1000);
}