/**
 * 💰 シンプルオッズ妙味分析器
 * Phase 8α: 既存システムと完全独立した妙味検出システム
 * 
 * 計算方式: (期待値 - 平均期待値) / 平均期待値 > 5% = 過小評価
 * 期待値 = オッズ × 勝率
 */
class SimpleOddsAnalyzer {
    constructor() {
        this.horses = [];
        this.analysisResults = null;
        this.settings = {
            undervaluedThreshold: 0.05,     // 5%以上で過小評価
            strongBuyThreshold: 0.15,       // 15%以上で強力推奨
            minExpectedValue: 1.05          // 最低期待値要件
        };
        
        console.log('💰 シンプルオッズ妙味分析器を初期化しました');
    }

    /**
     * メインアプリからデータを読み込み
     */
    loadDataFromMain() {
        try {
            // 方法1: localStorage から馬データを取得
            const savedHorses = localStorage.getItem('horses');
            if (savedHorses) {
                this.horses = JSON.parse(savedHorses);
                console.log(`📊 localStorage から${this.horses.length}頭のデータを読み込みました`);
                
                // 予測結果データの統合を試行
                this.integratePredictionData();
                return true;
            }
            
            // 方法2: window.horses からも試行
            if (window.opener && window.opener.horses) {
                this.horses = window.opener.horses;
                console.log(`📊 メインウィンドウから${this.horses.length}頭のデータを読み込みました`);
                
                // 予測結果データの統合を試行
                this.integratePredictionDataFromOpener();
                return true;
            }
            
            console.warn('⚠️ メインアプリからデータを読み込めませんでした');
            return false;
        } catch (error) {
            console.error('❌ データ読み込みエラー:', error);
            return false;
        }
    }

    /**
     * 予測結果データの統合（localStorage版）
     */
    integratePredictionData() {
        try {
            // window.lastPredictions の保存データを取得
            const savedPredictions = localStorage.getItem('lastPredictions');
            if (savedPredictions) {
                const predictions = JSON.parse(savedPredictions);
                console.log(`🔍 予測結果データを発見: ${predictions.length}頭`);
                
                // 馬データに予測結果をマージ
                this.horses.forEach(horse => {
                    const prediction = predictions.find(p => p.name === horse.name);
                    if (prediction) {
                        horse.winProbability = prediction.winProbability / 100; // %を小数に変換
                        horse.placeProbability = prediction.placeProbability / 100;
                        horse.predictedData = true;
                        console.log(`✅ ${horse.name}: 勝率${(horse.winProbability * 100).toFixed(1)}%を統合`);
                    }
                });
            } else {
                console.warn('⚠️ 予測結果データが見つかりません');
            }
        } catch (error) {
            console.warn('⚠️ 予測データ統合エラー:', error);
        }
    }

    /**
     * 予測結果データの統合（メインウィンドウ版）
     */
    integratePredictionDataFromOpener() {
        try {
            if (window.opener && window.opener.lastPredictions) {
                const predictions = window.opener.lastPredictions;
                console.log(`🔍 メインウィンドウから予測結果を取得: ${predictions.length}頭`);
                
                // 馬データに予測結果をマージ
                this.horses.forEach(horse => {
                    const prediction = predictions.find(p => p.name === horse.name);
                    if (prediction) {
                        horse.winProbability = prediction.winProbability / 100;
                        horse.placeProbability = prediction.placeProbability / 100;
                        horse.predictedData = true;
                        console.log(`✅ ${horse.name}: 勝率${(horse.winProbability * 100).toFixed(1)}%を統合`);
                    }
                });
            }
        } catch (error) {
            console.warn('⚠️ メインウィンドウ予測データ統合エラー:', error);
        }
    }

    /**
     * サンプルデータ生成
     */
    generateSampleData() {
        this.horses = [
            {
                name: '人気馬アルファ',
                number: 1,
                odds: 2.3,
                winProbability: 0.42,
                jockey: '武豊',
                weight: 58
            },
            {
                name: 'バランス馬ベータ',
                number: 2,
                odds: 4.5,
                winProbability: 0.25,
                jockey: '戸崎圭太',
                weight: 57
            },
            {
                name: '妙味馬ガンマ',
                number: 3,
                odds: 8.2,
                winProbability: 0.18,    // 期待値 8.2 × 0.18 = 1.476 (高妙味)
                jockey: '福永祐一',
                weight: 56
            },
            {
                name: '人気薄デルタ',
                number: 4,
                odds: 15.0,
                winProbability: 0.08,
                jockey: '岩田康誠',
                weight: 55
            },
            {
                name: '中穴エプシロン',
                number: 5,
                odds: 6.8,
                winProbability: 0.20,    // 期待値 6.8 × 0.20 = 1.36 (やや妙味)
                jockey: '川田将雅',
                weight: 57.5
            },
            {
                name: '大穴ゼータ',
                number: 6,
                odds: 25.0,
                winProbability: 0.05,
                jockey: '松山弘平',
                weight: 54
            }
        ];
        
        console.log('🎲 サンプルデータを生成しました');
        return true;
    }

    /**
     * 妙味分析実行（メインロジック）
     */
    analyzeOddsValue() {
        if (!this.horses || this.horses.length === 0) {
            throw new Error('馬データがありません');
        }

        console.log('💰 妙味分析を開始します...');

        // 各馬の期待値計算
        const horseAnalyses = this.horses.map(horse => {
            const expectedValue = this.calculateExpectedValue(horse);
            return {
                horse: horse,
                expectedValue: expectedValue,
                odds: horse.odds || 0,
                winProbability: horse.winProbability || horse.placeProbability || 0
            };
        });

        // 平均期待値計算
        const averageExpectedValue = horseAnalyses.reduce((sum, analysis) => sum + analysis.expectedValue, 0) / horseAnalyses.length;
        console.log(`📊 レース平均期待値: ${averageExpectedValue.toFixed(3)}`);

        // 妙味スコア計算と判定
        const results = horseAnalyses.map(analysis => {
            const oddsValueScore = (analysis.expectedValue - averageExpectedValue) / averageExpectedValue;
            const isUndervalued = oddsValueScore > this.settings.undervaluedThreshold && analysis.expectedValue > this.settings.minExpectedValue;
            const recommendation = this.getRecommendation(oddsValueScore, analysis.expectedValue);

            const result = {
                horseName: analysis.horse.name,
                horseNumber: analysis.horse.number,
                odds: analysis.odds,
                winProbability: analysis.winProbability,
                expectedValue: analysis.expectedValue,
                averageExpectedValue: averageExpectedValue,
                oddsValueScore: oddsValueScore,
                isUndervalued: isUndervalued,
                recommendation: recommendation,
                marketEfficiencyFactor: Math.max(0.5, Math.min(2.0, 1 + Math.max(0, oddsValueScore))),
                
                // 追加情報
                jockey: analysis.horse.jockey || '',
                weight: analysis.horse.weight || 0
            };

            console.log(`💎 ${result.horseName}: 妙味${(oddsValueScore * 100).toFixed(1)}% (期待値${analysis.expectedValue.toFixed(3)} vs 平均${averageExpectedValue.toFixed(3)}) ${isUndervalued ? '✅過小評価' : ''}`);

            return result;
        });

        // サマリー統計
        const summary = {
            totalHorses: results.length,
            averageExpectedValue: averageExpectedValue,
            undervaluedCount: results.filter(r => r.isUndervalued).length,
            strongBuyCount: results.filter(r => r.recommendation === 'strong-buy').length,
            buyCount: results.filter(r => r.recommendation === 'buy').length,
            considerCount: results.filter(r => r.recommendation === 'consider').length,
            highestValueScore: Math.max(...results.map(r => r.oddsValueScore)),
            lowestValueScore: Math.min(...results.map(r => r.oddsValueScore))
        };

        this.analysisResults = {
            timestamp: new Date().toISOString(),
            summary: summary,
            results: results.sort((a, b) => b.oddsValueScore - a.oddsValueScore), // 妙味スコア順
            settings: this.settings
        };

        console.log('💰 妙味分析完了:', summary);
        return this.analysisResults;
    }

    /**
     * 期待値計算（シンプル版）
     */
    calculateExpectedValue(horse) {
        const odds = horse.odds || 1;
        
        // 勝率データの優先順位付き取得
        let probability = 0;
        
        if (horse.winProbability && horse.winProbability > 0) {
            probability = horse.winProbability;
            console.log(`📊 ${horse.name}: 勝率${(probability * 100).toFixed(1)}%を使用`);
        } else if (horse.placeProbability && horse.placeProbability > 0) {
            probability = horse.placeProbability;
            console.log(`📊 ${horse.name}: 複勝率${(probability * 100).toFixed(1)}%を使用`);
        } else {
            // フォールバック: オッズから統計的推定
            probability = (1 / odds) * 0.8; // 控除率考慮
            console.warn(`⚠️ ${horse.name}: 勝率データなし、オッズから推定${(probability * 100).toFixed(1)}%`);
        }
        
        return odds * probability;
    }

    /**
     * 推奨度判定
     */
    getRecommendation(oddsValueScore, expectedValue) {
        if (oddsValueScore > this.settings.strongBuyThreshold && expectedValue > 1.10) {
            return 'strong-buy';
        } else if (oddsValueScore > this.settings.undervaluedThreshold && expectedValue > this.settings.minExpectedValue) {
            return 'buy';
        } else if (oddsValueScore > 0.02 && expectedValue > 1.02) {
            return 'consider';
        } else if (oddsValueScore > -0.05) {
            return 'monitor';
        } else {
            return 'avoid';
        }
    }

    /**
     * 結果をローカルストレージに保存
     */
    saveResults() {
        if (!this.analysisResults) {
            console.warn('⚠️ 保存する分析結果がありません');
            return false;
        }

        try {
            localStorage.setItem('simpleOddsAnalysisResults', JSON.stringify(this.analysisResults));
            console.log('💾 分析結果を保存しました');
            return true;
        } catch (error) {
            console.error('❌ 保存エラー:', error);
            return false;
        }
    }

    /**
     * 結果をJSONでエクスポート
     */
    exportResults() {
        if (!this.analysisResults) {
            alert('分析結果がありません');
            return;
        }

        const blob = new Blob([JSON.stringify(this.analysisResults, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `odds_value_analysis_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

/**
 * UI制御クラス
 */
class SimpleOddsAnalyzerUI {
    constructor() {
        this.analyzer = new SimpleOddsAnalyzer();
        this.initializeUI();
    }

    initializeUI() {
        // 初期状態の表示
        this.checkForData();
    }

    checkForData() {
        // サンプルデータフラグをチェック
        const useSampleData = localStorage.getItem('useSimpleOddsSampleData');
        if (useSampleData === 'true') {
            localStorage.removeItem('useSimpleOddsSampleData'); // フラグをクリア
            this.analyzer.generateSampleData();
            this.runAnalysis();
            return;
        }
        
        const hasMainData = this.analyzer.loadDataFromMain();
        if (hasMainData) {
            document.getElementById('no-data').style.display = 'none';
            document.getElementById('results').style.display = 'block';
            this.runAnalysis();
        } else {
            document.getElementById('no-data').style.display = 'block';
            document.getElementById('results').style.display = 'none';
        }
    }

    runAnalysis() {
        try {
            const results = this.analyzer.analyzeOddsValue();
            this.displayResults(results);
            this.analyzer.saveResults();
        } catch (error) {
            console.error('❌ 分析エラー:', error);
            alert('分析エラー: ' + error.message);
        }
    }

    displayResults(analysisResults) {
        this.displaySummary(analysisResults.summary);
        this.displayHorses(analysisResults.results);
        
        document.getElementById('results').style.display = 'block';
        document.getElementById('no-data').style.display = 'none';
    }

    displaySummary(summary) {
        const summaryElement = document.getElementById('summary');
        summaryElement.innerHTML = `
            <div class="summary-card">
                <h3>📊 総馬数</h3>
                <div class="value">${summary.totalHorses}</div>
            </div>
            <div class="summary-card">
                <h3>📈 平均期待値</h3>
                <div class="value">${summary.averageExpectedValue.toFixed(3)}</div>
            </div>
            <div class="summary-card">
                <h3>💎 過小評価</h3>
                <div class="value" style="color: #28a745;">${summary.undervaluedCount}</div>
            </div>
            <div class="summary-card">
                <h3>🔥 強力推奨</h3>
                <div class="value" style="color: #dc3545;">${summary.strongBuyCount}</div>
            </div>
            <div class="summary-card">
                <h3>👍 推奨</h3>
                <div class="value" style="color: #28a745;">${summary.buyCount}</div>
            </div>
            <div class="summary-card">
                <h3>🤔 検討</h3>
                <div class="value" style="color: #ffc107;">${summary.considerCount}</div>
            </div>
        `;
    }

    displayHorses(results) {
        const horsesElement = document.getElementById('horses');
        horsesElement.innerHTML = results.map(result => {
            const scoreClass = result.oddsValueScore > 0.05 ? 'score-positive' : 
                              result.oddsValueScore < -0.05 ? 'score-negative' : 'score-neutral';
            
            const cardClass = result.recommendation === 'strong-buy' ? 'strong-buy' : 
                             result.isUndervalued ? 'undervalued' : '';

            return `
                <div class="horse-card ${cardClass}">
                    <div class="horse-header">
                        <div class="horse-name">${result.horseName}</div>
                        <div class="horse-number">#${result.horseNumber}</div>
                    </div>
                    <div class="horse-details">
                        <div class="detail-item">
                            <div class="detail-label">オッズ</div>
                            <div class="detail-value">${result.odds.toFixed(1)}倍</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">勝率</div>
                            <div class="detail-value">${(result.winProbability * 100).toFixed(1)}%</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">期待値</div>
                            <div class="detail-value">${result.expectedValue.toFixed(3)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">妙味スコア</div>
                            <div class="detail-value ${scoreClass}">
                                ${(result.oddsValueScore * 100).toFixed(1)}%
                            </div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">効率性係数</div>
                            <div class="detail-value">${result.marketEfficiencyFactor.toFixed(3)}x</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">推奨度</div>
                            <div class="detail-value">
                                <span class="recommendation ${result.recommendation}">${this.getRecommendationLabel(result.recommendation)}</span>
                            </div>
                        </div>
                        ${result.jockey ? `
                        <div class="detail-item">
                            <div class="detail-label">騎手</div>
                            <div class="detail-value">${result.jockey}</div>
                        </div>
                        ` : ''}
                        ${result.weight ? `
                        <div class="detail-item">
                            <div class="detail-label">斤量</div>
                            <div class="detail-value">${result.weight}kg</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    getRecommendationLabel(recommendation) {
        const labels = {
            'strong-buy': '🔥 強力推奨',
            'buy': '👍 推奨',
            'consider': '🤔 検討',
            'monitor': '👀 監視',
            'avoid': '❌ 回避'
        };
        return labels[recommendation] || recommendation;
    }
}

// グローバル関数
function loadDataAndAnalyze() {
    ui.checkForData();
}

function generateSampleData() {
    ui.analyzer.generateSampleData();
    ui.runAnalysis();
}

function exportResults() {
    ui.analyzer.exportResults();
}

function clearResults() {
    document.getElementById('results').style.display = 'none';
    document.getElementById('no-data').style.display = 'block';
    ui.analyzer.analysisResults = null;
}

// アプリケーション初期化
let ui;
document.addEventListener('DOMContentLoaded', () => {
    ui = new SimpleOddsAnalyzerUI();
    console.log('💰 シンプルオッズ妙味分析器UI初期化完了');
});

// デバッグ用グローバル変数
window.simpleOddsAnalyzer = ui;