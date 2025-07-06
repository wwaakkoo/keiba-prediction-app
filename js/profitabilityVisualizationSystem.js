// 収益性重視可視化システム - TDD Green Phase実装
class ProfitabilityVisualizationSystem {
    
    // 静的プロパティ
    static charts = new Map();
    static isInitialized = false;
    static updateInterval = null;
    static config = {
        colors: {
            profit: '#2E8B57',      // 利益：緑
            loss: '#E74C3C',        // 損失：赤
            neutral: '#95A5A6',     // 中立：グレー
            highlight: '#3498DB',   // 強調：青
            excellent: '#2E8B57',   // ROI 50%以上
            good: '#FFD700',        // ROI 20-49%
            average: '#FF8C00',     // ROI 0-19%
            poor: '#DC143C'         // ROI マイナス
        },
        responsive: {
            mobile: { maxWidth: 768, chartHeight: 200, fontSize: 12 },
            desktop: { minWidth: 769, chartHeight: 300, fontSize: 14 }
        }
    };
    
    // 初期化
    static initialize() {
        console.log('ProfitabilityVisualizationSystem 初期化開始');
        
        if (this.isInitialized) {
            console.log('既に初期化済み');
            return;
        }
        
        try {
            this.createProfitabilityDashboard();
            this.setupEventListeners();
            this.startRealTimeUpdates();
            this.isInitialized = true;
            
            console.log('ProfitabilityVisualizationSystem 初期化完了');
        } catch (error) {
            console.error('初期化エラー:', error);
        }
    }
    
    // 収益性ダッシュボード作成
    static createProfitabilityDashboard() {
        console.log('🚀 createProfitabilityDashboard 開始');
        
        // 既存のprofitabilityDashboard要素を探す
        let profitabilityContainer = document.getElementById('profitabilityDashboard');
        
        // 存在しない場合は、learningGraphsSection内に作成
        if (!profitabilityContainer) {
            const learningSection = document.getElementById('learningGraphsSection');
            if (learningSection) {
                profitabilityContainer = document.createElement('div');
                profitabilityContainer.id = 'profitabilityDashboard';
                profitabilityContainer.style.cssText = 'display: block; margin-top: 20px;';
                learningSection.appendChild(profitabilityContainer);
                console.log('📍 profitabilityDashboard要素を作成しました');
            } else {
                console.warn('learningGraphsSectionが見つかりません');
                return;
            }
        }
        
        console.log('📍 コンテナ発見:', profitabilityContainer.id);
        
        // profitabilityDashboard要素の内容を設定
        profitabilityContainer.innerHTML = `
            <h3>📊 収益性分析ダッシュボード</h3>
            
            <!-- 制御パネル -->
            <div class="profitability-controls" style="margin-bottom: 15px;">
                <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
                    <label><input type="checkbox" id="showROIChart" checked> ROI推移</label>
                    <label><input type="checkbox" id="showUnderdogChart" checked> 穴馬効率</label>
                    <label><input type="checkbox" id="showRiskReturnChart" checked> リスク・リターン</label>
                    <label><input type="checkbox" id="showEfficiencyChart" checked> 投資効率</label>
                    <button id="refreshProfitabilityCharts" style="padding: 5px 10px;">更新</button>
                    <button id="exportProfitabilityData" style="padding: 5px 10px;">データ出力</button>
                </div>
            </div>
            
            <!-- グラフコンテナ -->
            <div class="profitability-charts-container" style="display: grid; gap: 15px; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));">
                
                <!-- ROI推移グラフ -->
                <div class="chart-wrapper" id="roiChartWrapper" style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #333;">📈 ROI推移</h4>
                    <div style="position: relative; height: 250px; width: 100%;">
                        <canvas id="roiChart"></canvas>
                    </div>
                    <div class="chart-info" style="font-size: 11px; color: #666; margin-top: 8px;">
                        <span id="roiInfo">投資収益率の時系列推移（損益分岐点付き）</span>
                    </div>
                </div>
                
                <!-- 穴馬効率グラフ -->
                <div class="chart-wrapper" id="underdogChartWrapper" style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #333;">🐎 穴馬効率</h4>
                    <div style="position: relative; height: 250px; width: 100%;">
                        <canvas id="underdogChart"></canvas>
                    </div>
                    <div class="chart-info" style="font-size: 11px; color: #666; margin-top: 8px;">
                        <span id="underdogInfo">オッズ帯別の穴馬発見効率</span>
                    </div>
                </div>
                
                <!-- リスク・リターン散布図 -->
                <div class="chart-wrapper" id="riskReturnChartWrapper" style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #333;">⚖️ リスク・リターン</h4>
                    <div style="position: relative; height: 250px; width: 100%;">
                        <canvas id="riskReturnChart"></canvas>
                    </div>
                    <div class="chart-info" style="font-size: 11px; color: #666; margin-top: 8px;">
                        <span id="riskReturnInfo">リスクとリターンの関係性（4象限表示）</span>
                    </div>
                </div>
                
                <!-- 投資効率スコア -->
                <div class="chart-wrapper" id="efficiencyChartWrapper" style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #333;">💎 投資効率</h4>
                    <div style="position: relative; height: 250px; width: 100%;">
                        <canvas id="efficiencyChart"></canvas>
                    </div>
                    <div class="chart-info" style="font-size: 11px; color: #666; margin-top: 8px;">
                        <span id="efficiencyInfo">オッズ vs 投資効率スコア<br>
                        <strong>データ更新タイミング:</strong> レース結果入力時（🧠統合学習ボタン押下後）<br>
                        <strong>効率スコア計算式:</strong> ROI(-50%～+50%→0～100点) + 的中率×50<br>
                        <strong>表示内容:</strong> オッズ帯別の投資効率(最大100点)</span>
                    </div>
                </div>
                
            </div>
            
            <!-- 統計サマリー -->
            <div class="profitability-summary" style="margin-top: 20px; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h4 style="margin: 0 0 10px 0;">📊 収益性統計サマリー</h4>
                <div id="profitabilitySummary" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <!-- 動的生成される統計情報 -->
                </div>
            </div>
        `;
        
        console.log('収益性ダッシュボードHTML生成完了');
    }
    
    // ROI推移グラフ作成
    static createROITrendChart() {
        console.log('ROI推移グラフ作成開始');
        
        const canvas = document.getElementById('roiChart');
        if (!canvas) {
            throw new Error('ROI chart canvas not found');
        }
        
        // 既存のチャートを破棄
        const existingChart = this.charts.get('roiChart');
        if (existingChart && existingChart.destroy) {
            existingChart.destroy();
            this.charts.delete('roiChart');
            console.log('🗑️ 既存ROIチャート破棄完了');
        }
        
        const profitabilityData = this.getProfitabilityChartData();
        const chartData = this.convertToROITimeSeriesData(profitabilityData);
        
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js が利用できません。モックチャートを作成します。');
            return this.createMockChart('roiChart', 'ROI推移');
        }
        
        const config = {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: { color: '#E5E5E5' },
                        ticks: { 
                            callback: function(value) { 
                                return value + '%'; 
                            }
                        }
                    },
                    x: {
                        type: 'category',
                        grid: { color: '#E5E5E5' }
                    }
                },
                plugins: {
                    legend: { display: true },
                    tooltip: {
                        callbacks: {
                            label: (context) => this.customTooltipFormatter(context, 'ROI')
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        };
        
        // 損益分岐点の注釈を追加（Chart.js annotation plugin使用時）
        if (Chart.plugins && Chart.plugins.getAll().some(p => p.id === 'annotation')) {
            config.options.plugins.annotation = {
                annotations: {
                    breakEvenLine: {
                        type: 'line',
                        yMin: 0,
                        yMax: 0,
                        borderColor: this.config.colors.loss,
                        borderWidth: 2,
                        label: {
                            content: '損益分岐点',
                            enabled: true,
                            position: 'start'
                        }
                    }
                }
            };
        }
        
        const chart = new Chart(canvas, config);
        this.charts.set('roiChart', chart);
        
        console.log('ROI推移グラフ作成完了');
        return chart;
    }
    
    // 穴馬効率グラフ作成
    static createUnderdogEfficiencyChart() {
        console.log('穴馬効率グラフ作成開始');
        
        const canvas = document.getElementById('underdogChart');
        if (!canvas) {
            throw new Error('Underdog chart canvas not found');
        }
        
        // 既存のチャートを破棄
        const existingChart = this.charts.get('underdogChart');
        if (existingChart && existingChart.destroy) {
            existingChart.destroy();
            this.charts.delete('underdogChart');
            console.log('🗑️ 既存穴馬チャート破棄完了');
        }
        
        const efficiencyData = this.getUnderdogEfficiencyData();
        const chartData = this.convertToUnderdogBarData(efficiencyData);
        
        if (typeof Chart === 'undefined') {
            return this.createMockChart('underdogChart', '穴馬効率');
        }
        
        const config = {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        grid: { color: '#E5E5E5' },
                        title: { display: true, text: 'ROI (%)' },
                        ticks: { 
                            callback: function(value) { 
                                return value + '%'; 
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        grid: { drawOnChartArea: false },
                        title: { display: true, text: '的中率 (%)' },
                        ticks: { 
                            callback: function(value) { 
                                return value + '%'; 
                            }
                        }
                    },
                    x: {
                        grid: { color: '#E5E5E5' }
                    }
                },
                plugins: {
                    legend: { display: true },
                    tooltip: {
                        callbacks: {
                            label: (context) => this.customTooltipFormatter(context, '穴馬効率')
                        }
                    }
                }
            }
        };
        
        const chart = new Chart(canvas, config);
        this.charts.set('underdogChart', chart);
        
        console.log('穴馬効率グラフ作成完了');
        return chart;
    }
    
    // リスク・リターン散布図作成
    static createRiskReturnScatterChart() {
        console.log('リスク・リターン散布図作成開始');
        
        const canvas = document.getElementById('riskReturnChart');
        if (!canvas) {
            throw new Error('Risk-return chart canvas not found');
        }
        
        // 既存のチャートを破棄
        const existingChart = this.charts.get('riskReturnChart');
        if (existingChart && existingChart.destroy) {
            existingChart.destroy();
            this.charts.delete('riskReturnChart');
            console.log('🗑️ 既存リスク・リターンチャート破棄完了');
        }
        
        const riskReturnData = this.getRiskReturnData();
        const chartData = this.convertToScatterData(riskReturnData);
        
        if (typeof Chart === 'undefined') {
            return this.createMockChart('riskReturnChart', 'リスク・リターン');
        }
        
        const config = {
            type: 'scatter',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: 0,
                        max: 100,
                        grid: { 
                            color: '#E5E5E5',
                            drawBorder: true,
                            lineWidth: (context) => context.tick.value === 0 ? 2 : 1
                        },
                        title: {
                            display: true,
                            text: 'リスク (%)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    y: {
                        type: 'linear',
                        min: -20,
                        max: 20,
                        grid: { 
                            color: '#E5E5E5',
                            drawBorder: true,
                            lineWidth: (context) => context.tick.value === 0 ? 2 : 1
                        },
                        title: {
                            display: true,
                            text: 'リターン（ROI %）'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: { display: true },
                    tooltip: {
                        callbacks: {
                            label: (context) => this.customTooltipFormatter(context, 'リスク・リターン')
                        }
                    }
                }
            }
        };
        
        const chart = new Chart(canvas, config);
        this.charts.set('riskReturnChart', chart);
        
        console.log('リスク・リターン散布図作成完了');
        return chart;
    }
    
    // 投資効率スコア散布図作成
    static createEfficiencyScatterChart() {
        console.log('投資効率スコア散布図作成開始');
        
        const canvas = document.getElementById('efficiencyChart');
        if (!canvas) {
            throw new Error('Efficiency chart canvas not found');
        }
        
        // 既存のチャートを破棄
        const existingChart = this.charts.get('efficiencyChart');
        if (existingChart && existingChart.destroy) {
            existingChart.destroy();
            this.charts.delete('efficiencyChart');
            console.log('🗑️ 既存投資効率チャート破棄完了');
        }
        
        const efficiencyData = this.getInvestmentEfficiencyData();
        const chartData = this.convertToEfficiencyScatterData(efficiencyData);
        
        if (typeof Chart === 'undefined') {
            return this.createMockChart('efficiencyChart', '投資効率');
        }
        
        const config = {
            type: 'scatter',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'オッズ'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '投資効率スコア'
                        },
                        min: 0,
                        max: 100
                    }
                },
                plugins: {
                    legend: { display: true },
                    tooltip: {
                        callbacks: {
                            label: (context) => this.customTooltipFormatter(context, '投資効率')
                        }
                    }
                }
            }
        };
        
        const chart = new Chart(canvas, config);
        this.charts.set('efficiencyChart', chart);
        
        console.log('投資効率スコア散布図作成完了');
        return chart;
    }
    
    // データ取得・変換メソッド群
    static getProfitabilityChartData() {
        console.log('🔍 getProfitabilityChartData 呼び出し');
        console.log('🔍 ProfitabilityMetrics定義確認:', typeof ProfitabilityMetrics);
        
        if (typeof ProfitabilityMetrics !== 'undefined') {
            console.log('✅ ProfitabilityMetrics使用');
            const data = ProfitabilityMetrics.getProfitabilityData();
            console.log('📊 取得データ:', data);
            return data;
        }
        
        console.log('⚠️ フォールバックデータ使用');
        // 現実的なフォールバックデータ
        return {
            timeSeriesData: {
                dailyProfits: [
                    { date: '2024-01-01', profit: 100, roi: 10.0 },
                    { date: '2024-01-02', profit: -500, roi: -5.0 },
                    { date: '2024-01-03', profit: 200, roi: 2.0 },
                    { date: '2024-01-04', profit: 50, roi: 5.0 },
                    { date: '2024-01-05', profit: -300, roi: -3.0 }
                ]
            },
            coreMetrics: {
                roi: 1.8,
                hitRate: 25.0,
                expectedValue: 1.018,
                totalProfit: -450
            },
            investment: {
                totalProfit: -450,
                totalInvested: 25000,
                totalReturned: 24550,
                totalBets: 20,
                hitCount: 5
            }
        };
    }
    
    static getUnderdogEfficiencyData() {
        if (typeof ProfitabilityMetrics !== 'undefined') {
            const data = ProfitabilityMetrics.getProfitabilityData();
            const oddsAnalysis = data.oddsAnalysis || {};
            
            // 実データがあるかチェック
            const hasRealData = Object.values(oddsAnalysis).some(oddsData => (oddsData.bets || 0) > 0);
            console.log(`🔍 穴馬効率データ判定: 実データ=${hasRealData ? 'あり' : 'なし'}`);
            
            if (hasRealData) {
                console.log('✅ 実データから穴馬効率データ使用');
                return oddsAnalysis;
            } else {
                console.log('❌ 実データなし → フォールバックデータ使用');
            }
        }
        
        // 現実的なフォールバックデータ
        return {
            medium: { range: '3.1-7.0倍', roi: 5.5, hitRate: 0.25, bets: 40 },
            high: { range: '7.1-15.0倍', roi: -2.8, hitRate: 0.15, bets: 20 },
            veryHigh: { range: '15.1-50.0倍', roi: 12.8, hitRate: 0.08, bets: 12 },
            extreme: { range: '50.1倍以上', roi: -15.5, hitRate: 0.03, bets: 5 }
        };
    }
    
    static getRiskReturnData() {
        if (typeof RiskReturnAnalyzer !== 'undefined') {
            const data = RiskReturnAnalyzer.getRiskReturnData();
            
            // portfolioHistoryが空の場合、実データから生成
            if (!data.portfolioHistory || data.portfolioHistory.length === 0) {
                console.log('🔧 portfolioHistory空のため、実データから生成');
                
                // ProfitabilityMetricsから実データを取得
                if (typeof ProfitabilityMetrics !== 'undefined') {
                    const profitData = ProfitabilityMetrics.getProfitabilityData();
                    const roi = profitData.coreMetrics?.roi || 0;
                    
                    // 実ROIを基に戦略データを生成
                    data.portfolioHistory = [
                        { risk: 0.3, return: roi * 0.5, label: '保守戦略' },
                        { risk: 0.5, return: roi * 0.7, label: '標準戦略' },
                        { risk: 0.7, return: roi, label: '現在戦略' },
                        { risk: 0.9, return: roi * 0.8, label: '高リスク戦略' }
                    ];
                    console.log('✅ 実データから生成:', data.portfolioHistory);
                }
            }
            
            return data;
        }
        
        // 現実的なフォールバックデータ（4象限表示用）
        return {
            portfolioHistory: [
                { risk: 10, return: 5.5, label: '低リスク戦略' },
                { risk: 30, return: -2.2, label: '中リスク戦略' },
                { risk: 50, return: 8.8, label: '高リスク戦略' },
                { risk: 70, return: -5.1, label: '超高リスク戦略' }
            ]
        };
    }
    
    static getInvestmentEfficiencyData() {
        // 実データから投資効率データを生成
        if (typeof ProfitabilityMetrics !== 'undefined') {
            const profitData = ProfitabilityMetrics.getProfitabilityData();
            const oddsAnalysis = profitData.oddsAnalysis || {};
            
            const efficiencyData = [];
            let totalBets = 0;
            Object.entries(oddsAnalysis).forEach(([key, data]) => {
                totalBets += data.bets || 0;
                if (data.bets > 0) {
                    const avgOdds = data.range ? this.parseOddsRange(data.range) : 5.0;
                    const efficiency = this.calculateEfficiencyScore(data.roi, data.hitRate);
                    const grade = this.getEfficiencyGrade(efficiency);
                    const isUnderdog = avgOdds >= 7.0;
                    
                    efficiencyData.push({
                        odds: avgOdds,
                        efficiency: efficiency,
                        grade: grade,
                        isUnderdog: isUnderdog,
                        horse: `${data.range}オッズ帯`,
                        bets: data.bets,
                        roi: data.roi
                    });
                }
            });
            
            console.log(`🔍 投資効率データ判定: 総賭け数=${totalBets}, 生成データ数=${efficiencyData.length}`);
            
            if (efficiencyData.length > 0) {
                console.log('✅ 実データから投資効率データ生成:');
                efficiencyData.forEach((item, index) => {
                    console.log(`  ${index + 1}. ${item.horse}: オッズ${item.odds}倍, 効率${item.efficiency.toFixed(1)}点 (${item.grade}), ROI=${item.roi}%`);
                });
                return efficiencyData;
            } else {
                console.log('❌ 実データなし（全オッズ帯でbets=0）→ フォールバックデータ使用');
            }
        }
        
        // フォールバックデータ（サンプル）
        const fallbackData = [
            { odds: 3.5, efficiency: 45, grade: 'B', isUnderdog: false, horse: '人気馬サンプル', roi: 5, hitRate: 0.3 },
            { odds: 8.0, efficiency: 75, grade: 'A', isUnderdog: true, horse: '穴馬サンプル', roi: 15, hitRate: 0.2 },
            { odds: 15.0, efficiency: 88, grade: 'AA', isUnderdog: true, horse: '大穴サンプル', roi: 25, hitRate: 0.15 },
            { odds: 2.1, efficiency: 35, grade: 'C', isUnderdog: false, horse: '本命サンプル', roi: -5, hitRate: 0.4 },
            { odds: 25.0, efficiency: 92, grade: 'AAA', isUnderdog: true, horse: '超穴サンプル', roi: 30, hitRate: 0.12 }
        ];
        
        console.log('⚠️ フォールバックデータ使用（投資効率）:');
        fallbackData.forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.horse}: オッズ${item.odds}倍, 効率${item.efficiency}点 (${item.grade}), ROI=${item.roi}%`);
        });
        
        return fallbackData;
    }
    
    // オッズ範囲から平均オッズを計算
    static parseOddsRange(range) {
        const matches = range.match(/(\d+\.?\d*)-(\d+\.?\d*)/);
        if (matches) {
            return (parseFloat(matches[1]) + parseFloat(matches[2])) / 2;
        }
        if (range.includes('以上')) {
            const match = range.match(/(\d+\.?\d*)/);
            return match ? parseFloat(match[1]) * 1.5 : 50.0;
        }
        return 5.0;
    }
    
    // 効率スコア計算（ROIと的中率から）
    static calculateEfficiencyScore(roi, hitRate) {
        const baseScore = Math.max(0, roi + 50); // ROI基準（-50%～+50%を0～100点に変換）
        const hitRateBonus = hitRate * 50; // 的中率ボーナス
        const finalScore = Math.min(100, Math.max(0, baseScore + hitRateBonus));
        
        console.log(`💎 効率スコア計算: ROI=${roi}% → ベース${baseScore.toFixed(1)}点 + 的中率${(hitRate*100).toFixed(1)}% × 50 = ${finalScore.toFixed(1)}点`);
        
        return finalScore;
    }
    
    // 効率グレード判定
    static getEfficiencyGrade(efficiency) {
        if (efficiency >= 90) return 'AAA';
        if (efficiency >= 80) return 'AA';
        if (efficiency >= 70) return 'A';
        if (efficiency >= 60) return 'B';
        if (efficiency >= 50) return 'C';
        return 'D';
    }
    
    // データ変換メソッド群
    static convertToROITimeSeriesData(profitabilityData) {
        const dailyData = profitabilityData.timeSeriesData?.dailyProfits || [];
        
        return {
            labels: dailyData.map(d => d.date),
            datasets: [{
                label: 'ROI (%)',
                data: dailyData.map(d => d.roi),
                borderColor: this.config.colors.profit,
                backgroundColor: 'rgba(46, 139, 87, 0.1)',
                pointBackgroundColor: dailyData.map(d => 
                    d.roi >= 0 ? this.config.colors.profit : this.config.colors.loss
                ),
                tension: 0.1
            }]
        };
    }
    
    static convertToUnderdogBarData(efficiencyData) {
        const categories = Object.values(efficiencyData).map(d => d.range || 'N/A');
        const roiData = Object.values(efficiencyData).map(d => d.roi || 0);
        const hitRateData = Object.values(efficiencyData).map(d => (d.hitRate || 0) * 100);
        
        return {
            labels: categories,
            datasets: [
                {
                    label: 'ROI (%)',
                    data: roiData,
                    backgroundColor: roiData.map(roi => this.getColorByROI(roi)),
                    borderColor: roiData.map(roi => this.getColorByROI(roi)),
                    borderWidth: 1,
                    type: 'bar',
                    yAxisID: 'y'
                },
                {
                    label: '的中率 (%)',
                    data: hitRateData,
                    borderColor: this.config.colors.highlight,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: this.config.colors.highlight,
                    type: 'line',
                    yAxisID: 'y1'
                }
            ]
        };
    }
    
    static convertToScatterData(riskReturnData) {
        const portfolioData = riskReturnData.portfolioHistory || [];
        
        return {
            datasets: [{
                label: '投資戦略',
                data: portfolioData.map(item => ({
                    x: item.risk,
                    y: item.return,
                    label: item.label
                })),
                backgroundColor: portfolioData.map(item => 
                    item.return >= 0 ? this.config.colors.profit : this.config.colors.loss
                ),
                borderColor: this.config.colors.highlight,
                pointRadius: 8,
                pointHoverRadius: 12
            }]
        };
    }
    
    static convertToEfficiencyScatterData(efficiencyData) {
        return {
            datasets: [{
                label: '投資効率',
                data: efficiencyData.map(item => ({
                    x: item.odds,
                    y: item.efficiency,
                    label: item.horse,
                    backgroundColor: item.isUnderdog ? this.config.colors.highlight : this.config.colors.neutral
                })),
                backgroundColor: efficiencyData.map(item => 
                    item.isUnderdog ? this.config.colors.highlight : this.config.colors.neutral
                ),
                pointRadius: 8,
                pointHoverRadius: 12
            }]
        };
    }
    
    // ユーティリティメソッド群
    static getColorByROI(roi) {
        if (roi >= 50) return this.config.colors.excellent;
        if (roi >= 20) return this.config.colors.good;
        if (roi >= 0) return this.config.colors.average;
        return this.config.colors.poor;
    }
    
    static customTooltipFormatter(context, chartType) {
        const value = context.parsed.y;
        switch (chartType) {
            case 'ROI':
                return `ROI: ${value.toFixed(1)}%`;
            case '穴馬効率':
                return `${context.dataset.label}: ${value.toFixed(1)}%`;
            case 'リスク・リターン':
                return `リスク: ${context.parsed.x.toFixed(1)}%, リターン: ${value.toFixed(1)}%`;
            case '投資効率':
                return `効率スコア: ${value.toFixed(0)}点, オッズ: ${context.parsed.x.toFixed(1)}倍`;
            default:
                return `値: ${value}`;
        }
    }
    
    static createMockChart(canvasId, title) {
        const canvas = document.getElementById(canvasId);
        if (canvas && canvas.getContext) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#333';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${title} (モック)`, canvas.width / 2, canvas.height / 2);
            ctx.fillText('Chart.js読み込み後に実際のグラフ表示', canvas.width / 2, canvas.height / 2 + 25);
        }
        return { id: canvasId, type: 'mock' };
    }
    
    // イベント・更新関連
    static setupEventListeners() {
        // リフレッシュボタン
        const refreshBtn = document.getElementById('refreshProfitabilityCharts');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshAllCharts());
        }
        
        // エクスポートボタン
        const exportBtn = document.getElementById('exportProfitabilityData');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportToCSV());
        }
        
        // チェックボックス（実際のHTML IDに合わせて修正）
        const checkboxMappings = [
            { id: 'showROIChart', chartType: 'roi' },
            { id: 'showUnderdogChart', chartType: 'underdog' },
            { id: 'showRiskReturnChart', chartType: 'riskReturn' },
            { id: 'showEfficiencyChart', chartType: 'efficiency' }
        ];
        
        checkboxMappings.forEach(mapping => {
            const checkbox = document.getElementById(mapping.id);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    console.log(`チェックボックス変更: ${mapping.chartType} -> ${e.target.checked}`);
                    this.toggleChartVisibility(mapping.chartType, e.target.checked);
                });
                console.log(`チェックボックスイベント設定完了: ${mapping.id}`);
            } else {
                console.warn(`チェックボックス要素が見つかりません: ${mapping.id}`);
            }
        });
        
        // レスポンシブ対応
        window.addEventListener('resize', () => this.debouncedUpdate());
    }
    
    static startRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // 自動更新を無効化（テスト用）
        // this.updateInterval = setInterval(() => {
        //     this.refreshAllCharts();
        // }, 30000); // 30秒間隔
        
        console.log('リアルタイム更新は無効化されています（テスト用）');
    }
    
    static refreshAllCharts() {
        console.log('全チャート更新開始');
        
        try {
            this.createROITrendChart();
            this.createUnderdogEfficiencyChart();
            this.createRiskReturnScatterChart();
            this.createEfficiencyScatterChart();
            this.updateProfitabilitySummary();
            
            console.log('全チャート更新完了');
        } catch (error) {
            console.error('チャート更新エラー:', error);
        }
    }
    
    static updateProfitabilitySummary() {
        const summaryContainer = document.getElementById('profitabilitySummary');
        if (!summaryContainer) return;
        
        const profitabilityData = this.getProfitabilityChartData();
        const coreMetrics = profitabilityData.coreMetrics || {};
        
        // データの存在確認
        const hasRealData = profitabilityData.investment?.totalBets > 0 && !profitabilityData.investment?.isEstimated;
        const hasEstimatedData = profitabilityData.investment?.isEstimated === true;
        const investmentData = profitabilityData.investment || {};
        
        summaryContainer.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 20px; font-weight: bold; color: ${this.getColorByROI(coreMetrics.roi || 0)};">
                    ${(coreMetrics.roi || 0).toFixed(1)}%
                </div>
                <div style="font-size: 12px; color: #666;">ROI</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 20px; font-weight: bold; color: #333;">
                    ${(coreMetrics.hitRate || 0).toFixed(1)}%
                </div>
                <div style="font-size: 12px; color: #666;">
                    ${hasEstimatedData ? '複勝的中率' : '的中率'}
                    ${hasEstimatedData && investmentData.winHitRate ? `<br>単勝:${investmentData.winHitRate}%` : ''}
                </div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 20px; font-weight: bold; color: #333;">
                    ${(investmentData.totalBets || 0).toLocaleString()}回
                </div>
                <div style="font-size: 12px; color: #666;">総賭け数</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 20px; font-weight: bold; color: ${investmentData.totalProfit >= 0 ? this.config.colors.profit : this.config.colors.loss};">
                    ${(investmentData.totalProfit || 0).toLocaleString()}円
                </div>
                <div style="font-size: 12px; color: #666;">総損益</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 20px; font-weight: bold; color: #333;">
                    ${(coreMetrics.recoveryRate || 0).toFixed(1)}%
                </div>
                <div style="font-size: 12px; color: #666;">回収率</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 20px; font-weight: bold; color: #333;">
                    ${(investmentData.totalInvested || 0).toLocaleString()}円
                </div>
                <div style="font-size: 12px; color: #666;">総投資額</div>
            </div>
            ${hasEstimatedData ? '<div style="grid-column: 1/-1; text-align: center; padding: 10px; background: #fff3cd; border-radius: 4px; color: #856404; font-size: 12px; border: 1px solid #ffeaa7;">⚠️ 推定データ表示中（既存学習データから自動計算）<br><strong>的中基準:</strong> 複勝=予測上位3頭のうち1頭でも3着以内<br><strong>実データ切り替え:</strong> レース結果入力1回目から段階的に更新</div>' : !hasRealData ? '<div style="grid-column: 1/-1; text-align: center; padding: 10px; background: #f8f9fa; border-radius: 4px; color: #666; font-size: 12px;">※ フォールバックデータ表示中<br><strong>実データ切り替え:</strong> 🧠統合学習ボタンでレース結果入力1回目から更新開始</div>' : ''}
        `;
    }
    
    // 機能メソッド群（TDDテストをパスするための最小実装）
    static createChart(canvasId, config) {
        if (typeof Chart !== 'undefined') {
            const canvas = document.getElementById(canvasId);
            if (canvas) {
                return new Chart(canvas, config);
            }
        }
        return this.createMockChart(canvasId, config.type || 'chart');
    }
    
    static handleResize() {
        this.charts.forEach((chart, id) => {
            if (chart && chart.resize) {
                chart.resize();
            }
        });
    }
    
    static toggleChartVisibility(chartType, visible) {
        const wrapper = document.getElementById(`${chartType}ChartWrapper`);
        if (wrapper) {
            wrapper.style.display = visible ? 'block' : 'none';
            console.log(`${chartType}チャート表示切り替え: ${visible ? '表示' : '非表示'}`);
        } else {
            console.warn(`チャートWrapper要素が見つかりません: ${chartType}ChartWrapper`);
        }
    }
    
    static animateROIChange() {
        // ROI変更時のアニメーション（基本実装）
        const roiChart = this.charts.get('roiChart');
        if (roiChart && roiChart.update) {
            roiChart.update('show');
        }
        return true;
    }
    
    static exportToPDF() {
        console.log('PDF出力機能（未実装）');
        return 'PDF export not fully implemented';
    }
    
    static exportToCSV(autoDownload = true) {
        console.log('CSV出力開始');
        
        const profitabilityData = this.getProfitabilityChartData();
        const csvData = this.convertToCSV(profitabilityData);
        
        // autoDownloadがfalseの場合はダウンロードしない（テスト用）
        if (autoDownload && typeof document !== 'undefined') {
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `profitability_data_${new Date().toISOString().split('T')[0]}.csv`);
            link.click();
        }
        
        return csvData;
    }
    
    static convertToCSV(data) {
        const rows = ['日付,ROI(%),利益(円),的中率(%)'];
        
        const dailyData = data.timeSeriesData?.dailyProfits || [];
        dailyData.forEach(day => {
            rows.push(`${day.date},${day.roi || 0},${day.profit || 0},${day.hitRate || 0}`);
        });
        
        return rows.join('\n');
    }
    
    static enableVirtualization() {
        console.log('仮想化レンダリング有効化（未実装）');
        return 'Virtualization not fully implemented';
    }
    
    static debouncedUpdate = this.debounce(() => {
        this.handleResize();
        this.refreshAllCharts();
    }, 250);
    
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
    
    // 外部API
    static getAllCharts() {
        return this.charts;
    }
    
    static getChartById(id) {
        return this.charts.get(id);
    }
    
    static destroy() {
        this.charts.forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        this.charts.clear();
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        this.isInitialized = false;
        console.log('ProfitabilityVisualizationSystem破棄完了');
    }
}

// グローバル公開
window.ProfitabilityVisualizationSystem = ProfitabilityVisualizationSystem;

// Chart.js プラグインの拡張（利用可能な場合）
if (typeof Chart !== 'undefined') {
    // 収益性注釈プラグイン
    const profitabilityAnnotationsPlugin = {
        id: 'profitabilityAnnotations',
        beforeDraw: (chart) => {
            // カスタム注釈描画（基本実装）
            const ctx = chart.ctx;
            ctx.save();
            // 損益分岐点などの描画処理
            ctx.restore();
        }
    };
    
    Chart.register(profitabilityAnnotationsPlugin);
    console.log('収益性Chart.jsプラグイン登録完了');
}

console.log('ProfitabilityVisualizationSystem読み込み完了');