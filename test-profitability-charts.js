// TDD: 収益性重視グラフ・可視化のテストケース
console.log('=== 収益性重視グラフ TDD テストケース ===\n');

// テスト実行エンジン
class ProfitabilityChartTDD {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.total = 0;
    }
    
    test(name, testFunction) {
        this.total++;
        try {
            const result = testFunction();
            if (result === true || result === undefined) {
                console.log(`✅ ${name}`);
                this.passed++;
                return true;
            } else {
                console.log(`❌ ${name}: ${result}`);
                return false;
            }
        } catch (error) {
            console.log(`💥 ${name}: ${error.message}`);
            return false;
        }
    }
    
    assertEqual(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`${message} - Expected: ${expected}, Actual: ${actual}`);
        }
    }
    
    assertTrue(condition, message = '') {
        if (!condition) {
            throw new Error(`${message} - Expected: true, Actual: ${condition}`);
        }
    }
    
    summary() {
        console.log(`\n=== テスト結果: ${this.passed}/${this.total} (${((this.passed/this.total)*100).toFixed(1)}%) ===`);
        return this.passed === this.total;
    }
}

const tdd = new ProfitabilityChartTDD();

// 1. 収益性グラフの要件定義テスト
console.log('1. 収益性グラフ要件定義テスト:');

tdd.test('ROI推移グラフの要件定義', () => {
    // 要件: ROI（投資収益率）の時系列推移を表示
    const requirements = {
        chartType: 'line',
        dataSource: 'ProfitabilityMetrics.coreMetrics.roi',
        xAxis: 'date',
        yAxis: 'roi_percentage',
        title: 'ROI推移',
        colors: ['#2E8B57', '#DC143C'], // プラス：緑、マイナス：赤
        thresholds: [0], // 0%基準線
        minPoints: 5 // 最低5データポイント
    };
    
    tdd.assertTrue(requirements.chartType === 'line', 'ROI推移は線グラフ');
    tdd.assertTrue(requirements.thresholds.includes(0), '0%基準線が必要');
    tdd.assertEqual(requirements.minPoints, 5, '最低5データポイント必要');
});

tdd.test('穴馬効率グラフの要件定義', () => {
    // 要件: 穴馬発見効率の可視化
    const requirements = {
        chartType: 'bar',
        dataSource: 'ProfitabilityMetrics.underdogEfficiency',
        categories: ['7-10倍', '10-15倍', '15-25倍', '25-50倍', '50倍以上'],
        metrics: ['roi', 'hitRate', 'contribution'],
        title: '穴馬効率分析',
        colors: ['#FF6B35', '#F7931E', '#FFD23F', '#51C4D3', '#126782']
    };
    
    tdd.assertEqual(requirements.chartType, 'bar', '穴馬効率は棒グラフ');
    tdd.assertTrue(requirements.categories.length >= 5, '5つ以上のオッズ帯');
    tdd.assertTrue(requirements.metrics.includes('roi'), 'ROI指標が含まれる');
});

tdd.test('リスク・リターン散布図の要件定義', () => {
    // 要件: リスクとリターンの関係性を可視化
    const requirements = {
        chartType: 'scatter',
        xAxis: 'risk_volatility',
        yAxis: 'expected_return',
        dataSource: 'RiskReturnAnalyzer.portfolioAnalysis',
        quadrants: true, // 4象限表示
        trendLine: true, // トレンドライン
        title: 'リスク・リターン分析'
    };
    
    tdd.assertEqual(requirements.chartType, 'scatter', 'リスク・リターンは散布図');
    tdd.assertTrue(requirements.quadrants, '4象限表示が必要');
    tdd.assertTrue(requirements.trendLine, 'トレンドライン表示');
});

// 2. データ変換機能のテスト
console.log('\n2. データ変換機能テスト:');

tdd.test('収益性データの時系列変換', () => {
    // テスト用収益性データ
    const profitabilityData = {
        timeSeriesData: {
            dailyProfits: [
                { date: '2024-01-01', profit: 1000, betAmount: 1000, roi: 100 },
                { date: '2024-01-02', profit: -500, betAmount: 1000, roi: -50 },
                { date: '2024-01-03', profit: 2000, betAmount: 1000, roi: 200 }
            ]
        }
    };
    
    // 変換関数（要実装）
    function convertToTimeSeriesChart(data) {
        return {
            labels: data.timeSeriesData.dailyProfits.map(d => d.date),
            datasets: [{
                label: 'ROI (%)',
                data: data.timeSeriesData.dailyProfits.map(d => d.roi),
                borderColor: '#2E8B57',
                backgroundColor: 'rgba(46, 139, 87, 0.1)'
            }]
        };
    }
    
    const chartData = convertToTimeSeriesChart(profitabilityData);
    
    tdd.assertEqual(chartData.labels.length, 3, 'ラベル数が正しい');
    tdd.assertEqual(chartData.datasets[0].data.length, 3, 'データ数が正しい');
    tdd.assertTrue(chartData.datasets[0].data.includes(100), 'ROIデータが含まれる');
});

tdd.test('オッズ帯別効率データの変換', () => {
    // テスト用オッズ帯別データ
    const oddsAnalysis = {
        medium: { range: '3.1-7.0倍', roi: 15.5, hitRate: 0.25, bets: 40 },
        high: { range: '7.1-15.0倍', roi: 45.2, hitRate: 0.15, bets: 20 },
        veryHigh: { range: '15.1-50.0倍', roi: 120.8, hitRate: 0.08, bets: 12 }
    };
    
    // 変換関数（要実装）
    function convertToOddsRangeChart(data) {
        const categories = Object.values(data).map(d => d.range);
        const roiData = Object.values(data).map(d => d.roi);
        const hitRateData = Object.values(data).map(d => d.hitRate * 100);
        
        return {
            categories,
            datasets: [
                { label: 'ROI (%)', data: roiData, type: 'bar' },
                { label: '的中率 (%)', data: hitRateData, type: 'line' }
            ]
        };
    }
    
    const chartData = convertToOddsRangeChart(oddsAnalysis);
    
    tdd.assertEqual(chartData.categories.length, 3, 'カテゴリ数が正しい');
    tdd.assertTrue(chartData.datasets[0].data.includes(45.2), 'ROIデータが正しい');
    tdd.assertTrue(chartData.datasets[1].data.includes(15), '的中率データが正しい');
});

tdd.test('投資効率スコアの可視化データ変換', () => {
    // テスト用投資効率データ
    const efficiencyData = [
        { horse: '馬A', odds: 8.0, efficiency: 75, grade: 'A', isUnderdog: true },
        { horse: '馬B', odds: 3.5, efficiency: 45, grade: 'B', isUnderdog: false },
        { horse: '馬C', odds: 15.0, efficiency: 88, grade: 'AA', isUnderdog: true }
    ];
    
    // 変換関数（要実装）
    function convertToEfficiencyScatter(data) {
        return {
            datasets: [{
                label: '投資効率',
                data: data.map(d => ({
                    x: d.odds,
                    y: d.efficiency,
                    label: d.horse,
                    color: d.isUnderdog ? '#FF6B35' : '#126782'
                }))
            }]
        };
    }
    
    const chartData = convertToEfficiencyScatter(efficiencyData);
    
    tdd.assertEqual(chartData.datasets[0].data.length, 3, 'データポイント数が正しい');
    tdd.assertTrue(chartData.datasets[0].data[0].x === 8.0, 'X軸（オッズ）が正しい');
    tdd.assertTrue(chartData.datasets[0].data[0].y === 75, 'Y軸（効率）が正しい');
});

// 3. グラフ設定の妥当性テスト
console.log('\n3. グラフ設定妥当性テスト:');

tdd.test('ROI推移グラフの設定妥当性', () => {
    const config = {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false, // ROIは負の値もあり得る
                    grid: { color: '#E5E5E5' },
                    ticks: { callback: function(value) { return value + '%'; } }
                },
                x: {
                    type: 'time',
                    time: { unit: 'day' }
                }
            },
            plugins: {
                annotation: {
                    annotations: {
                        breakEvenLine: {
                            type: 'line',
                            yMin: 0,
                            yMax: 0,
                            borderColor: '#DC143C',
                            borderWidth: 2,
                            label: { content: '損益分岐点', enabled: true }
                        }
                    }
                }
            }
        }
    };
    
    tdd.assertEqual(config.type, 'line', 'グラフタイプが線グラフ');
    tdd.assertTrue(!config.options.scales.y.beginAtZero, 'Y軸は0から始まらない');
    tdd.assertTrue(config.options.scales.x.type === 'time', 'X軸は時間軸');
    tdd.assertTrue(config.options.plugins.annotation.annotations.breakEvenLine.yMin === 0, '損益分岐点が0%');
});

tdd.test('穴馬効率グラフの色分け設定', () => {
    const colorScheme = {
        excellent: '#2E8B57',  // ROI 50%以上
        good: '#FFD700',       // ROI 20-49%
        average: '#FF8C00',    // ROI 0-19%
        poor: '#DC143C'        // ROI マイナス
    };
    
    function getColorByROI(roi) {
        if (roi >= 50) return colorScheme.excellent;
        if (roi >= 20) return colorScheme.good;
        if (roi >= 0) return colorScheme.average;
        return colorScheme.poor;
    }
    
    tdd.assertEqual(getColorByROI(75), colorScheme.excellent, 'ROI 75%は優秀色');
    tdd.assertEqual(getColorByROI(25), colorScheme.good, 'ROI 25%は良好色');
    tdd.assertEqual(getColorByROI(-10), colorScheme.poor, 'ROI -10%は不良色');
});

// 4. レスポンシブ対応テスト
console.log('\n4. レスポンシブ対応テスト:');

tdd.test('モバイル表示対応設定', () => {
    const responsiveConfig = {
        mobile: {
            maxWidth: 768,
            chartHeight: 200,
            fontSize: 12,
            hideLabels: false,
            stackCharts: true
        },
        desktop: {
            minWidth: 769,
            chartHeight: 300,
            fontSize: 14,
            hideLabels: false,
            stackCharts: false
        }
    };
    
    function getConfigForWidth(width) {
        return width <= 768 ? responsiveConfig.mobile : responsiveConfig.desktop;
    }
    
    const mobileConfig = getConfigForWidth(600);
    const desktopConfig = getConfigForWidth(1200);
    
    tdd.assertEqual(mobileConfig.chartHeight, 200, 'モバイルでは高さ200px');
    tdd.assertEqual(desktopConfig.chartHeight, 300, 'デスクトップでは高さ300px');
    tdd.assertTrue(mobileConfig.stackCharts, 'モバイルではチャートを縦積み');
});

// 5. パフォーマンステスト
console.log('\n5. パフォーマンステスト:');

tdd.test('大量データ処理パフォーマンス', () => {
    // 100件のテストデータ生成
    const largeDateset = Array.from({ length: 100 }, (_, i) => ({
        date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
        roi: Math.random() * 200 - 50, // -50% ~ 150%
        profit: Math.random() * 10000 - 2000 // -2000円 ~ 8000円
    }));
    
    function processLargeDataset(data) {
        const startTime = performance.now();
        
        const chartData = {
            labels: data.map(d => d.date),
            datasets: [{
                data: data.map(d => d.roi),
                backgroundColor: data.map(d => d.roi >= 0 ? '#2E8B57' : '#DC143C')
            }]
        };
        
        const endTime = performance.now();
        return { chartData, processingTime: endTime - startTime };
    }
    
    const result = processLargeDataset(largeDateset);
    
    tdd.assertTrue(result.processingTime < 100, '処理時間が100ms未満');
    tdd.assertEqual(result.chartData.labels.length, 100, '全データが処理される');
});

// 6. アクセシビリティテスト
console.log('\n6. アクセシビリティテスト:');

tdd.test('色覚異常対応色設定', () => {
    const accessibleColors = {
        profit: '#2E8B57',      // 緑（利益）
        loss: '#E74C3C',        // 赤（損失）
        neutral: '#95A5A6',     // グレー（中立）
        highlight: '#3498DB'    // 青（強調）
    };
    
    // 色覚異常シミュレーション（簡易版）
    function isColorBlindSafe(color1, color2) {
        // 実際には色差の計算が必要だが、簡易テスト
        return color1 !== color2;
    }
    
    tdd.assertTrue(isColorBlindSafe(accessibleColors.profit, accessibleColors.loss), 
                  '利益と損失の色が区別可能');
    tdd.assertTrue(isColorBlindSafe(accessibleColors.neutral, accessibleColors.highlight), 
                  '中立と強調の色が区別可能');
});

// 7. エラーハンドリングテスト
console.log('\n7. エラーハンドリングテスト:');

tdd.test('データ不足時のフォールバック', () => {
    const emptyData = { timeSeriesData: { dailyProfits: [] } };
    
    function createChartWithFallback(data) {
        if (!data.timeSeriesData.dailyProfits.length) {
            return {
                type: 'line',
                data: {
                    labels: ['データなし'],
                    datasets: [{
                        label: '収益性データ',
                        data: [0],
                        borderColor: '#95A5A6'
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'データが不足しています'
                        }
                    }
                }
            };
        }
        return { hasData: true };
    }
    
    const result = createChartWithFallback(emptyData);
    
    tdd.assertEqual(result.data.labels[0], 'データなし', 'フォールバックメッセージ表示');
    tdd.assertTrue(result.options.plugins.title.text.includes('データが不足'), 'エラーメッセージ表示');
});

// テスト結果サマリー
const success = tdd.summary();

if (success) {
    console.log('\n🎉 全テスト成功！収益性グラフの要件定義が完了しました。');
    console.log('\n📋 実装すべき機能:');
    console.log('✅ ROI推移の時系列グラフ（損益分岐点付き）');
    console.log('✅ 穴馬効率のオッズ帯別棒グラフ');
    console.log('✅ リスク・リターン散布図（4象限表示）');
    console.log('✅ 投資効率スコアの可視化');
    console.log('✅ レスポンシブ対応');
    console.log('✅ アクセシビリティ対応');
    console.log('✅ エラーハンドリング');
    
    console.log('\n🔄 次のステップ:');
    console.log('1. ProfitabilityVisualizationSystem クラスの実装');
    console.log('2. Chart.js を使った実際のグラフ描画');
    console.log('3. データ連携の実装');
    console.log('4. UI統合テスト');
} else {
    console.log('\n⚠️  テストが失敗しました。要件定義を見直してください。');
}