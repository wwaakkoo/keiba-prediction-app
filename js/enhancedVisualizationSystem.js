// 強化学習システム対応グラフ可視化システム
class EnhancedVisualizationSystem {
    static charts = new Map(); // 複数チャートの管理
    static isInitialized = false;
    static updateInterval = null;
    
    // 初期化
    static initialize() {
        if (this.isInitialized) return;
        
        this.createChartContainers();
        this.setupEventListeners();
        this.scheduleAutoUpdate();
        this.isInitialized = true;
        
        console.log('強化学習可視化システム初期化完了');
    }
    
    // チャートコンテナの動的生成
    static createChartContainers() {
        const graphSection = document.getElementById('learningGraphsSection');
        if (!graphSection) {
            console.warn('learningGraphsSection が見つかりません');
            return;
        }
        
        // 既存の単一キャンバスを置き換え
        graphSection.innerHTML = `
            <h3>📊 学習分析ダッシュボード</h3>
            
            <!-- グラフ表示制御パネル -->
            <div class="chart-controls" style="margin-bottom: 15px;">
                <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
                    <label><input type="checkbox" id="showAccuracyChart" checked> 精度推移</label>
                    <label><input type="checkbox" id="showPedigreeChart" checked> 血統学習</label>
                    <label><input type="checkbox" id="showPatternChart" checked> パターン分析</label>
                    <label><input type="checkbox" id="showBettingChart" checked> 買い目成績</label>
                    <label><input type="checkbox" id="showMetaChart" checked> メタ学習</label>
                    <button id="refreshCharts" style="padding: 5px 10px;">更新</button>
                    <button id="exportData" style="padding: 5px 10px;">データ出力</button>
                </div>
            </div>
            
            <!-- グラフコンテナ（最適化レイアウト） -->
            <div class="charts-container" style="display: grid; gap: 15px; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); max-width: 100%;">
                
                <!-- 上段：メイングラフ（2列レイアウト） -->
                <div class="chart-wrapper" id="accuracyChartWrapper" style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #333;">🎯 予測精度推移</h4>
                    <div style="position: relative; height: 200px; width: 100%;">
                        <canvas id="accuracyChart"></canvas>
                    </div>
                    <div class="chart-info" style="font-size: 11px; color: #666; margin-top: 8px;">
                        <span id="accuracyInfo">勝率・連対率・複勝率の推移</span>
                    </div>
                </div>
                
                <div class="chart-wrapper" id="pedigreeChartWrapper" style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #333;">🐎 血統学習効果</h4>
                    <div style="position: relative; height: 200px; width: 100%;">
                        <canvas id="pedigreeChart"></canvas>
                    </div>
                    <div class="chart-info" style="font-size: 11px; color: #666; margin-top: 8px;">
                        <span id="pedigreeInfo">血統適性・系統別成功率</span>
                    </div>
                </div>
                
                <!-- 中段：分析グラフ（3列レイアウト） -->
                <div class="chart-wrapper" id="patternChartWrapper" style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #333;">📈 成功パターン</h4>
                    <div style="position: relative; height: 180px; width: 100%;">
                        <canvas id="patternChart"></canvas>
                    </div>
                    <div class="chart-info" style="font-size: 11px; color: #666; margin-top: 8px;">
                        <span id="patternInfo">脚質・距離別成功率</span>
                    </div>
                </div>
                
                <div class="chart-wrapper" id="bettingChartWrapper" style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #333;">💰 買い目成績</h4>
                    <div style="position: relative; height: 180px; width: 100%;">
                        <canvas id="bettingChart"></canvas>
                    </div>
                    <div class="chart-info" style="font-size: 11px; color: #666; margin-top: 8px;">
                        <span id="bettingInfo">券種別成功率・期待値</span>
                    </div>
                </div>
                
                <div class="chart-wrapper" id="metaChartWrapper" style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #333;">🧠 メタ学習</h4>
                    <div style="position: relative; height: 180px; width: 100%;">
                        <canvas id="metaChart"></canvas>
                    </div>
                    <div class="chart-info" style="font-size: 11px; color: #666; margin-top: 8px;">
                        <span id="metaInfo">学習効果・調整パラメータ</span>
                    </div>
                </div>
                
                <!-- 下段：統計サマリー（全幅） -->
                <div class="chart-wrapper" id="summaryWrapper" style="grid-column: 1 / -1; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h4 style="margin: 0 0 15px 0; font-size: 14px; color: #333;">📋 学習システム統計サマリー</h4>
                    <div id="summaryStats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
                        <!-- 動的に生成される統計情報 -->
                    </div>
                </div>
                
            </div>
        `;
    }
    
    // イベントリスナーの設定
    static setupEventListeners() {
        // チャート表示制御
        ['accuracyChart', 'pedigreeChart', 'patternChart', 'bettingChart', 'metaChart'].forEach(chartId => {
            const checkbox = document.getElementById(`show${chartId.charAt(0).toUpperCase() + chartId.slice(1, -5)}Chart`);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    const wrapper = document.getElementById(`${chartId}Wrapper`);
                    if (wrapper) {
                        wrapper.style.display = e.target.checked ? 'block' : 'none';
                    }
                });
            }
        });
        
        // 更新ボタン
        const refreshBtn = document.getElementById('refreshCharts');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.updateAllCharts();
                showMessage('グラフを更新しました', 'success', 2000);
            });
        }
        
        // データ出力ボタン
        const exportBtn = document.getElementById('exportData');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportLearningData();
            });
        }
    }
    
    // 全チャートの更新
    static updateAllCharts() {
        console.log('=== 全チャート更新開始 ===');
        
        try {
            // EnhancedLearningSystemからデータを取得
            const learningData = typeof EnhancedLearningSystem !== 'undefined' 
                ? EnhancedLearningSystem.generateLearningVisualizationData()
                : this.generateFallbackData();
            
            // 各チャートを更新
            this.updateAccuracyChart(learningData.accuracyTrend);
            this.updatePedigreeChart(learningData.pedigreeLearning);
            this.updatePatternChart(learningData.patternSuccess);
            this.updateBettingChart(learningData.bettingStrategy);
            this.updateMetaChart(learningData.metaLearning);
            this.updateSummaryStats();
            
            console.log('全チャート更新完了');
        } catch (error) {
            console.error('チャート更新エラー:', error);
            showMessage('チャート更新中にエラーが発生しました', 'error', 3000);
        }
    }
    
    // 1. 予測精度推移チャート
    static updateAccuracyChart(data) {
        const ctx = document.getElementById('accuracyChart');
        if (!ctx) return;
        
        // 既存チャートを破棄
        if (this.charts.has('accuracy')) {
            this.charts.get('accuracy').destroy();
        }
        
        const config = {
            type: 'line',
            data: {
                labels: data?.labels || this.generateDateLabels(15),
                datasets: [
                    {
                        label: '勝率',
                        data: data?.winRate || this.generateTrendData(15, 15, 25),
                        borderColor: '#ff6b6b',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        tension: 0.4,
                        fill: false,
                        pointRadius: 3
                    },
                    {
                        label: '連対率',
                        data: data?.placeRate || this.generateTrendData(15, 25, 35),
                        borderColor: '#4ecdc4',
                        backgroundColor: 'rgba(78, 205, 196, 0.1)',
                        tension: 0.4,
                        fill: false,
                        pointRadius: 3
                    },
                    {
                        label: '複勝率',
                        data: data?.showRate || this.generateTrendData(15, 35, 45),
                        borderColor: '#45b7d1',
                        backgroundColor: 'rgba(69, 183, 209, 0.1)',
                        tension: 0.4,
                        fill: false,
                        pointRadius: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: { size: 11 },
                            padding: 10
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            font: { size: 10 },
                            maxRotation: 45
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            font: { size: 10 },
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        };
        
        const chart = new Chart(ctx, config);
        this.charts.set('accuracy', chart);
        
        // 情報更新
        const infoEl = document.getElementById('accuracyInfo');
        if (infoEl && data) {
            const latest = data.winRate?.slice(-1)[0] || 0;
            infoEl.textContent = `最新勝率: ${latest.toFixed(1)}% (${data.totalRaces || 0}レース)`;
        }
    }
    
    // 2. 血統学習チャート
    static updatePedigreeChart(data) {
        const ctx = document.getElementById('pedigreeChart');
        if (!ctx) return;
        
        if (this.charts.has('pedigree')) {
            this.charts.get('pedigree').destroy();
        }
        
        const config = {
            type: 'radar',
            data: {
                labels: data?.categories || ['距離適性', '表面適性', 'コース適性', 'コンディション', '季節適性', '血統強度'],
                datasets: [
                    {
                        label: '血統適性スコア',
                        data: data?.aptitudeScores || [75, 80, 65, 70, 85, 90],
                        backgroundColor: 'rgba(155, 89, 182, 0.2)',
                        borderColor: 'rgba(155, 89, 182, 1)',
                        pointBackgroundColor: 'rgba(155, 89, 182, 1)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgba(155, 89, 182, 1)'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: { size: 10 },
                            padding: 8
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            font: { size: 9 },
                            stepSize: 25
                        },
                        pointLabels: {
                            font: { size: 10 }
                        }
                    }
                }
            }
        };
        
        const chart = new Chart(ctx, config);
        this.charts.set('pedigree', chart);
    }
    
    // 3. パターン分析チャート
    static updatePatternChart(data) {
        const ctx = document.getElementById('patternChart');
        if (!ctx) return;
        
        if (this.charts.has('pattern')) {
            this.charts.get('pattern').destroy();
        }
        
        const config = {
            type: 'bar',
            data: {
                labels: data?.patterns || ['先行', '差し', '追込', '短距離', '中距離', '長距離'],
                datasets: [
                    {
                        label: '成功率',
                        data: data?.successRates || [68, 72, 58, 75, 80, 65],
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.8)',
                            'rgba(54, 162, 235, 0.8)',
                            'rgba(255, 205, 86, 0.8)',
                            'rgba(75, 192, 192, 0.8)',
                            'rgba(153, 102, 255, 0.8)',
                            'rgba(255, 159, 64, 0.8)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 205, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)'
                        ],
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            font: { size: 10 },
                            maxRotation: 30
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            font: { size: 10 },
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        };
        
        const chart = new Chart(ctx, config);
        this.charts.set('pattern', chart);
    }
    
    // 4. 買い目戦略チャート
    static updateBettingChart(data) {
        const ctx = document.getElementById('bettingChart');
        if (!ctx) return;
        
        if (this.charts.has('betting')) {
            this.charts.get('betting').destroy();
        }
        
        const config = {
            type: 'doughnut',
            data: {
                labels: data?.strategyNames || ['単勝', '複勝', '馬連', '馬単', 'ワイド', '3連複'],
                datasets: [
                    {
                        label: '成功率',
                        data: data?.strategySuccess || [45, 78, 32, 28, 65, 18],
                        backgroundColor: [
                            '#ff6b6b',
                            '#4ecdc4',
                            '#45b7d1',
                            '#f9ca24',
                            '#6c5ce7',
                            '#a29bfe'
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: { size: 10 },
                            padding: 8,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed + '%';
                            }
                        }
                    }
                }
            }
        };
        
        const chart = new Chart(ctx, config);
        this.charts.set('betting', chart);
    }
    
    // 5. メタ学習チャート
    static updateMetaChart(data) {
        const ctx = document.getElementById('metaChart');
        if (!ctx) return;
        
        if (this.charts.has('meta')) {
            this.charts.get('meta').destroy();
        }
        
        const config = {
            type: 'line',
            data: {
                labels: data?.adjustmentHistory?.labels || this.generateDateLabels(15),
                datasets: [
                    {
                        label: '学習効果スコア',
                        data: data?.learningEffectiveness || this.generateTrendData(15, 60, 85),
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: '過学習検出',
                        data: data?.overlearningDetection || this.generateTrendData(15, 0, 30),
                        borderColor: '#f39c12',
                        backgroundColor: 'rgba(243, 156, 18, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: { size: 10 },
                            padding: 8
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            font: { size: 9 },
                            maxRotation: 45
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        max: 100,
                        min: 0,
                        ticks: {
                            font: { size: 9 }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        max: 100,
                        min: 0,
                        ticks: {
                            font: { size: 9 }
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        };
        
        const chart = new Chart(ctx, config);
        this.charts.set('meta', chart);
    }
    
    // 統計サマリーの更新
    static updateSummaryStats() {
        const summaryEl = document.getElementById('summaryStats');
        if (!summaryEl) return;
        
        // EnhancedLearningSystemから統計取得
        const stats = typeof EnhancedLearningSystem !== 'undefined' 
            ? EnhancedLearningSystem.getStatsSummary() 
            : this.generateFallbackStats();
        
        summaryEl.innerHTML = `
            <div class="stat-item" style="padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #007bff;">
                <h5 style="margin: 0 0 8px 0; font-size: 13px; color: #007bff;">📊 基本成績</h5>
                <p style="margin: 3px 0; font-size: 12px;">総レース数: <strong>${stats.totalRaces || 0}</strong></p>
                <p style="margin: 3px 0; font-size: 12px;">勝率: <strong>${stats.winRate || '0.0'}%</strong></p>
                <p style="margin: 3px 0; font-size: 12px;">複勝率: <strong>${stats.placeRate || '0.0'}%</strong></p>
            </div>
            
            <div class="stat-item" style="padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #28a745;">
                <h5 style="margin: 0 0 8px 0; font-size: 13px; color: #28a745;">🎯 学習進捗</h5>
                <p style="margin: 3px 0; font-size: 12px;">学習率: <strong>${stats.learningProgress || 0}%</strong></p>
                <p style="margin: 3px 0; font-size: 12px;">調整項目: <strong>${stats.topAdjustments?.length || 0}件</strong></p>
                <p style="margin: 3px 0; font-size: 12px;">血統パターン: <strong>${stats.pedigreeInsights?.length || 0}種</strong></p>
            </div>
            
            <div class="stat-item" style="padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #ffc107;">
                <h5 style="margin: 0 0 8px 0; font-size: 13px; color: #e69500;">🏆 優秀血統</h5>
                ${(stats.pedigreeInsights || []).slice(0, 3).map(p => 
                    `<p style="margin: 3px 0; font-size: 12px;">${p.sire}: <strong>${p.rate}%</strong> (${p.count}回)</p>`
                ).join('') || '<p style="margin: 3px 0; font-size: 12px;">データなし</p>'}
            </div>
            
            <div class="stat-item" style="padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #dc3545;">
                <h5 style="margin: 0 0 8px 0; font-size: 13px; color: #dc3545;">⚙️ 主要調整</h5>
                ${(stats.topAdjustments || []).slice(0, 3).map(a => 
                    `<p style="margin: 3px 0; font-size: 12px;">${a.factor}: <strong>${a.value}</strong> (${a.change})</p>`
                ).join('') || '<p style="margin: 3px 0; font-size: 12px;">データなし</p>'}
            </div>
        `;
    }
    
    // フォールバックデータ生成
    static generateFallbackData() {
        return {
            accuracyTrend: {
                labels: this.generateDateLabels(20),
                winRate: this.generateTrendData(20, 15, 25),
                placeRate: this.generateTrendData(20, 25, 35),
                totalRaces: 127
            },
            pedigreeLearning: {
                categories: ['距離適性', '表面適性', 'コース適性', 'コンディション', '季節適性', '血統強度'],
                aptitudeScores: [75, 80, 65, 70, 85, 90]
            },
            patternSuccess: {
                patterns: ['先行', '差し', '追込', '短距離', '中距離', '長距離'],
                successRates: [68, 72, 58, 75, 80, 65]
            },
            bettingStrategy: {
                strategyNames: ['単勝', '複勝', '馬連', '馬単', 'ワイド', '3連複'],
                strategySuccess: [45, 78, 32, 28, 65, 18]
            },
            metaLearning: {
                learningEffectiveness: this.generateTrendData(15, 60, 85),
                overlearningDetection: this.generateTrendData(15, 0, 30)
            }
        };
    }
    
    static generateFallbackStats() {
        return {
            totalRaces: 127,
            winRate: '18.9',
            placeRate: '42.5',
            learningProgress: 67,
            topAdjustments: [
                { factor: 'pedigreeWeight', value: '1.15', change: '強化' },
                { factor: 'oddsWeight', value: '0.87', change: '軽減' }
            ],
            pedigreeInsights: [
                { sire: 'ディープインパクト', rate: '78.3', count: 12 },
                { sire: 'ハーツクライ', rate: '71.4', count: 7 }
            ]
        };
    }
    
    // ヘルパー関数群
    static generateDateLabels(count) {
        const labels = [];
        const today = new Date();
        for (let i = count - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }));
        }
        return labels;
    }
    
    static generateTrendData(count, min, max) {
        const data = [];
        let current = (min + max) / 2;
        for (let i = 0; i < count; i++) {
            current += (Math.random() - 0.5) * 10;
            current = Math.max(min, Math.min(max, current));
            data.push(Math.round(current * 10) / 10);
        }
        return data;
    }
    
    // 自動更新のスケジュール
    static scheduleAutoUpdate() {
        // 5分間隔で自動更新（本番用）、開発時は無効化
        if (window.location.hostname !== 'localhost') {
            this.updateInterval = setInterval(() => {
                this.updateAllCharts();
                console.log('グラフ自動更新実行');
            }, 300000);
        } else {
            console.log('開発環境のため自動更新を無効化');
        }
    }
    
    // データエクスポート機能
    static exportLearningData() {
        try {
            const data = typeof EnhancedLearningSystem !== 'undefined' 
                ? EnhancedLearningSystem.getLearningData() 
                : { message: 'No learning data available' };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `learning-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showMessage('学習データをエクスポートしました', 'success', 3000);
        } catch (error) {
            console.error('データエクスポートエラー:', error);
            showMessage('データエクスポートに失敗しました', 'error', 3000);
        }
    }
    
    // クリーンアップ
    static destroy() {
        // 全チャートを破棄
        this.charts.forEach(chart => chart.destroy());
        this.charts.clear();
        
        // 自動更新を停止
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        this.isInitialized = false;
        console.log('強化学習可視化システムクリーンアップ完了');
    }
}

// グローバル変数として公開
window.EnhancedVisualizationSystem = EnhancedVisualizationSystem;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    // 少し遅延させて他のシステムの初期化完了後に実行
    setTimeout(() => {
        EnhancedVisualizationSystem.initialize();
        // 初回データ表示
        EnhancedVisualizationSystem.updateAllCharts();
    }, 1000);
});