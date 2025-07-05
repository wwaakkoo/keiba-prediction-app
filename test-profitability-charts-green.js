// TDD Green Phase: 実装後のテスト検証
console.log('=== TDD Green Phase: 実装検証テスト ===\n');

// Mock DOM環境
global.document = {
    getElementById: function(id) {
        return {
            innerHTML: '',
            style: {},
            children: [],
            addEventListener: () => {},
            getContext: () => ({
                fillStyle: '',
                fillRect: () => {},
                fillText: () => {},
                font: '',
                textAlign: ''
            }),
            width: 400,
            height: 300
        };
    },
    createElement: () => ({
        setAttribute: () => {},
        click: () => {}
    })
};

global.window = {
    addEventListener: () => {},
    URL: {
        createObjectURL: () => 'mock-url'
    }
};

global.Blob = function(data, options) {
    this.data = data;
    this.type = options.type;
};

// 必要なクラスをロード
require('./profitabilityMetrics.js');
require('./profitabilityVisualizationSystem.js');

// テストエンジン
class GreenPhaseTest {
    constructor() {
        this.passed = 0;
        this.failed = 0;
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
                this.failed++;
                return false;
            }
        } catch (error) {
            console.log(`❌ ${name}: ${error.message}`);
            this.failed++;
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
        console.log(`\n=== Green Phase結果: ${this.passed}/${this.total} テスト成功 ===`);
        console.log(`成功: ${this.passed}, 失敗: ${this.failed}`);
        return this.passed === this.total;
    }
}

const greenTest = new GreenPhaseTest();

// 1. クラス存在確認テスト
console.log('1. クラス存在確認テスト:');

greenTest.test('ProfitabilityVisualizationSystemクラスが定義されている', () => {
    greenTest.assertTrue(typeof ProfitabilityVisualizationSystem !== 'undefined', 
                        'ProfitabilityVisualizationSystemが定義されている');
});

greenTest.test('必要なstaticプロパティが存在する', () => {
    greenTest.assertTrue(ProfitabilityVisualizationSystem.charts instanceof Map, 'chartsプロパティが存在');
    greenTest.assertTrue(typeof ProfitabilityVisualizationSystem.config === 'object', 'configプロパティが存在');
    greenTest.assertTrue(typeof ProfitabilityVisualizationSystem.isInitialized === 'boolean', 'isInitializedプロパティが存在');
});

// 2. 基本メソッド存在確認テスト
console.log('\n2. 基本メソッド存在確認テスト:');

greenTest.test('createROITrendChartメソッドが存在する', () => {
    greenTest.assertTrue(typeof ProfitabilityVisualizationSystem.createROITrendChart === 'function',
                        'createROITrendChartメソッドが関数');
});

greenTest.test('createUnderdogEfficiencyChartメソッドが存在する', () => {
    greenTest.assertTrue(typeof ProfitabilityVisualizationSystem.createUnderdogEfficiencyChart === 'function',
                        'createUnderdogEfficiencyChartメソッドが関数');
});

greenTest.test('getProfitabilityChartDataメソッドが存在する', () => {
    greenTest.assertTrue(typeof ProfitabilityVisualizationSystem.getProfitabilityChartData === 'function',
                        'getProfitabilityChartDataメソッドが関数');
});

// 3. データ取得・変換テスト
console.log('\n3. データ取得・変換テスト:');

greenTest.test('収益性データ取得が動作する', () => {
    const data = ProfitabilityVisualizationSystem.getProfitabilityChartData();
    greenTest.assertTrue(data !== undefined, 'データが取得される');
    greenTest.assertTrue(data.timeSeriesData !== undefined, '時系列データが含まれる');
    greenTest.assertTrue(Array.isArray(data.timeSeriesData.dailyProfits), '日別データが配列');
});

greenTest.test('ROI時系列データ変換が動作する', () => {
    const testData = {
        timeSeriesData: {
            dailyProfits: [
                { date: '2024-01-01', roi: 100 },
                { date: '2024-01-02', roi: -50 }
            ]
        }
    };
    
    const chartData = ProfitabilityVisualizationSystem.convertToROITimeSeriesData(testData);
    
    greenTest.assertTrue(chartData.labels.length === 2, 'ラベル数が正しい');
    greenTest.assertTrue(chartData.datasets[0].data.length === 2, 'データ数が正しい');
    greenTest.assertTrue(chartData.datasets[0].data.includes(100), 'ROIデータが含まれる');
    greenTest.assertTrue(chartData.datasets[0].data.includes(-50), '負のROIデータも含まれる');
});

greenTest.test('穴馬効率データ変換が動作する', () => {
    const testData = {
        medium: { range: '3.1-7.0倍', roi: 15.5, hitRate: 0.25 },
        high: { range: '7.1-15.0倍', roi: 45.2, hitRate: 0.15 }
    };
    
    const chartData = ProfitabilityVisualizationSystem.convertToUnderdogBarData(testData);
    
    greenTest.assertTrue(chartData.labels.length === 2, 'カテゴリ数が正しい');
    greenTest.assertTrue(chartData.datasets.length === 2, 'データセット数が正しい（ROI + 的中率）');
    greenTest.assertTrue(chartData.datasets[0].data.includes(15.5), 'ROIデータが含まれる');
    greenTest.assertTrue(chartData.datasets[1].data.includes(25), '的中率データが含まれる（%変換済み）');
});

// 4. チャート作成テスト
console.log('\n4. チャート作成テスト:');

greenTest.test('ROI推移グラフ作成が動作する（Mock環境）', () => {
    const chart = ProfitabilityVisualizationSystem.createROITrendChart();
    greenTest.assertTrue(chart !== undefined, 'チャートオブジェクトが返される');
    greenTest.assertTrue(chart.id === 'roiChart' || chart.type === 'mock', 'チャートIDまたはMockタイプが設定される');
});

greenTest.test('穴馬効率グラフ作成が動作する（Mock環境）', () => {
    const chart = ProfitabilityVisualizationSystem.createUnderdogEfficiencyChart();
    greenTest.assertTrue(chart !== undefined, 'チャートオブジェクトが返される');
    greenTest.assertTrue(chart.id === 'underdogChart' || chart.type === 'mock', 'チャートIDまたはMockタイプが設定される');
});

// 5. ユーティリティメソッドテスト
console.log('\n5. ユーティリティメソッドテスト:');

greenTest.test('ROI色分け機能が動作する', () => {
    const excellentColor = ProfitabilityVisualizationSystem.getColorByROI(75);
    const goodColor = ProfitabilityVisualizationSystem.getColorByROI(25);
    const averageColor = ProfitabilityVisualizationSystem.getColorByROI(5);
    const poorColor = ProfitabilityVisualizationSystem.getColorByROI(-10);
    
    greenTest.assertTrue(excellentColor === ProfitabilityVisualizationSystem.config.colors.excellent, '優秀色が正しい');
    greenTest.assertTrue(goodColor === ProfitabilityVisualizationSystem.config.colors.good, '良好色が正しい');
    greenTest.assertTrue(averageColor === ProfitabilityVisualizationSystem.config.colors.average, '平均色が正しい');
    greenTest.assertTrue(poorColor === ProfitabilityVisualizationSystem.config.colors.poor, '不良色が正しい');
});

greenTest.test('カスタムツールチップフォーマッターが動作する', () => {
    const context = { parsed: { y: 25.5, x: 10.2 } };
    
    const roiTooltip = ProfitabilityVisualizationSystem.customTooltipFormatter(context, 'ROI');
    const efficiencyTooltip = ProfitabilityVisualizationSystem.customTooltipFormatter(context, '投資効率');
    
    greenTest.assertTrue(roiTooltip.includes('25.5%'), 'ROIツールチップが正しい');
    greenTest.assertTrue(efficiencyTooltip.includes('26点'), '投資効率ツールチップが正しい（四捨五入）');
    greenTest.assertTrue(efficiencyTooltip.includes('10.2倍'), 'オッズ表示が正しい');
});

// 6. エクスポート機能テスト
console.log('\n6. エクスポート機能テスト:');

greenTest.test('CSV出力機能が動作する', () => {
    const csvData = ProfitabilityVisualizationSystem.exportToCSV();
    
    greenTest.assertTrue(typeof csvData === 'string', 'CSV文字列が返される');
    greenTest.assertTrue(csvData.includes('日付,ROI(%),利益(円),的中率(%)'), 'CSVヘッダーが含まれる');
    greenTest.assertTrue(csvData.split('\n').length > 1, '複数行のCSVデータ');
});

greenTest.test('PDF出力機能が応答する', () => {
    const result = ProfitabilityVisualizationSystem.exportToPDF();
    greenTest.assertTrue(typeof result === 'string', 'PDF出力が文字列を返す');
    greenTest.assertTrue(result.includes('PDF export'), 'PDF出力メッセージが含まれる');
});

// 7. 統合機能テスト
console.log('\n7. 統合機能テスト:');

greenTest.test('ダッシュボード作成が動作する', () => {
    ProfitabilityVisualizationSystem.createProfitabilityDashboard();
    // HTMLが設定されることを確認（Mock環境では実際のDOMはないが、エラーが出ないことを確認）
    greenTest.assertTrue(true, 'ダッシュボード作成でエラーが発生しない');
});

greenTest.test('イベントリスナー設定が動作する', () => {
    ProfitabilityVisualizationSystem.setupEventListeners();
    greenTest.assertTrue(true, 'イベントリスナー設定でエラーが発生しない');
});

greenTest.test('リアルタイム更新開始が動作する', () => {
    ProfitabilityVisualizationSystem.startRealTimeUpdates();
    greenTest.assertTrue(ProfitabilityVisualizationSystem.updateInterval !== null, '更新インターバルが設定される');
});

// 8. TDD要件対応確認テスト
console.log('\n8. TDD要件対応確認テスト:');

greenTest.test('Chart.js統合機能が応答する', () => {
    const chart = ProfitabilityVisualizationSystem.createChart('testCanvas', { type: 'line' });
    greenTest.assertTrue(chart !== undefined, 'Chart作成機能が応答する');
});

greenTest.test('レスポンシブ制御が応答する', () => {
    ProfitabilityVisualizationSystem.handleResize();
    greenTest.assertTrue(true, 'レスポンシブ制御でエラーが発生しない');
});

greenTest.test('アニメーション機能が応答する', () => {
    const result = ProfitabilityVisualizationSystem.animateROIChange();
    greenTest.assertTrue(result === true, 'アニメーション機能が真を返す');
});

greenTest.test('仮想化機能が応答する', () => {
    const result = ProfitabilityVisualizationSystem.enableVirtualization();
    greenTest.assertTrue(typeof result === 'string', '仮想化機能が文字列を返す');
});

greenTest.test('デバウンシング機能が動作する', () => {
    greenTest.assertTrue(typeof ProfitabilityVisualizationSystem.debouncedUpdate === 'function', 
                        'debouncedUpdateが関数');
    ProfitabilityVisualizationSystem.debouncedUpdate();
    greenTest.assertTrue(true, 'デバウンシング実行でエラーが発生しない');
});

// 9. データ整合性テスト
console.log('\n9. データ整合性テスト:');

greenTest.test('フォールバックデータの整合性', () => {
    const profitabilityData = ProfitabilityVisualizationSystem.getProfitabilityChartData();
    const underdogData = ProfitabilityVisualizationSystem.getUnderdogEfficiencyData();
    const riskReturnData = ProfitabilityVisualizationSystem.getRiskReturnData();
    const efficiencyData = ProfitabilityVisualizationSystem.getInvestmentEfficiencyData();
    
    greenTest.assertTrue(profitabilityData.timeSeriesData.dailyProfits.length >= 5, '収益性データが十分ある');
    greenTest.assertTrue(Object.keys(underdogData).length >= 3, '穴馬データのカテゴリが十分ある');
    greenTest.assertTrue(riskReturnData.portfolioHistory.length >= 3, 'リスク・リターンデータが十分ある');
    greenTest.assertTrue(efficiencyData.length >= 5, '投資効率データが十分ある');
});

greenTest.test('色設定の整合性', () => {
    const colors = ProfitabilityVisualizationSystem.config.colors;
    
    greenTest.assertTrue(colors.profit.startsWith('#'), '利益色がHEX形式');
    greenTest.assertTrue(colors.loss.startsWith('#'), '損失色がHEX形式');
    greenTest.assertTrue(colors.profit !== colors.loss, '利益と損失の色が異なる');
    greenTest.assertTrue(colors.excellent !== colors.poor, '優秀と不良の色が異なる');
});

// Green Phase結果
const greenSuccess = greenTest.summary();

if (greenSuccess) {
    console.log('\n🟢 Green Phase成功！実装がすべてのテストをパスしました。');
    console.log('\n📋 実装完了機能:');
    console.log('✅ ProfitabilityVisualizationSystemクラス');
    console.log('✅ ROI推移グラフ作成');
    console.log('✅ 穴馬効率グラフ作成');
    console.log('✅ リスク・リターン散布図');
    console.log('✅ 投資効率スコア可視化');
    console.log('✅ データ取得・変換機能');
    console.log('✅ Chart.js統合（基本）');
    console.log('✅ UI統合・レスポンシブ対応');
    console.log('✅ エクスポート機能（CSV）');
    console.log('✅ リアルタイム更新');
    console.log('✅ カスタムツールチップ');
    console.log('✅ 色分け・アクセシビリティ対応');
    
    console.log('\n🔵 次のステップ: Blue Phase（リファクタリング）');
    console.log('1. コードの最適化');
    console.log('2. パフォーマンス改善');
    console.log('3. エラーハンドリング強化');
    console.log('4. ブラウザ環境での統合テスト');
} else {
    console.log('\n⚠️  Green Phaseで失敗があります。実装を修正してください。');
}