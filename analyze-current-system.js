// 現在のシステム分析用スクリプト
// ブラウザのコンソールで実行してください

console.log('=== 期待値計算システム分析開始 ===');

// 1. スコア別複勝的中率分析
function analyzeScoreHitRates() {
    console.log('\n📊 1. スコア別複勝的中率分析');
    
    if (typeof LearningSystem !== 'undefined' && LearningSystem.learningData) {
        const data = LearningSystem.learningData;
        console.log(`総学習データ: ${data.accuracy?.totalPredictions || 0}レース`);
        console.log(`複勝的中: ${data.accuracy?.placePredictions || 0}回`);
        console.log(`複勝的中率: ${data.accuracy?.totalPredictions > 0 ? ((data.accuracy.placePredictions / data.accuracy.totalPredictions) * 100).toFixed(1) : 0}%`);
        
        if (data.history && data.history.length > 0) {
            const scoreRanges = [
                { min: 90, max: 100, label: '90-100点' },
                { min: 80, max: 89, label: '80-89点' },
                { min: 70, max: 79, label: '70-79点' },
                { min: 60, max: 69, label: '60-69点' },
                { min: 50, max: 59, label: '50-59点' },
                { min: 0, max: 49, label: '0-49点' }
            ];
            
            console.log('\n【スコア別的中率】');
            scoreRanges.forEach(range => {
                let hits = 0, total = 0;
                data.history.forEach(entry => {
                    if (entry.predictedWinner) {
                        const score = entry.predictedWinner.score || entry.predictedWinner.placeProbability || 0;
                        if (score >= range.min && score <= range.max) {
                            total++;
                            if (entry.placeCorrect || entry.winCorrect) hits++;
                        }
                    }
                });
                if (total > 0) {
                    console.log(`${range.label}: ${hits}/${total} = ${((hits/total)*100).toFixed(1)}%`);
                }
            });
        }
    } else {
        console.log('LearningSystemデータなし');
    }
}

// 2. 期待値上位馬の結果分析
function analyzeExpectedValueResults() {
    console.log('\n🎯 2. 期待値上位馬の結果分析');
    
    // Phase 4データ
    if (typeof PerformanceTracker !== 'undefined') {
        const tracker = new PerformanceTracker();
        const stats = tracker.getOverallStats();
        console.log('Phase 4統計:', {
            totalRaces: stats.totalRaces,
            netProfit: stats.netProfit,
            overallROI: stats.overallROI.toFixed(2) + '%',
            averageHitRate: stats.averageHitRate.toFixed(1) + '%'
        });
    }
    
    // Phase 6データ
    if (typeof KellyCapitalManager !== 'undefined') {
        const manager = new KellyCapitalManager();
        const report = manager.generateCapitalReport();
        console.log('Phase 6統計:', {
            currentCapital: report.capitalStatus.currentCapital.toLocaleString() + '円',
            totalReturn: report.capitalStatus.totalReturn.toLocaleString() + '円',
            returnRate: report.capitalStatus.totalReturnRate.toFixed(2) + '%',
            recentWinRate: (report.recentPerformance.winRate * 100).toFixed(1) + '%'
        });
    }
}

// 3. 信頼度スコア構成詳細
function analyzeConfidenceScore() {
    console.log('\n⚙️ 3. 信頼度スコア構成詳細');
    
    if (typeof ExpectedValueCalculator !== 'undefined') {
        const testCases = [
            { name: '高スコア人気馬', score: 90, odds: 2.5 },
            { name: '中スコア中人気', score: 70, odds: 5.0 },
            { name: '低スコア穴馬', score: 40, odds: 15.0 }
        ];
        
        console.log('【信頼度スコア計算テスト】');
        testCases.forEach(horse => {
            const analysis = { 
                popularity: ExpectedValueCalculator.determinePopularity(horse.odds),
                estimatedProbability: 0.3 
            };
            const confidenceScore = ExpectedValueCalculator.calculateConfidenceScore(horse, analysis);
            
            console.log(`${horse.name}:`, {
                score: horse.score,
                odds: horse.odds,
                popularity: analysis.popularity,
                confidenceScore: confidenceScore.toFixed(3)
            });
        });
        
        console.log('\n【信頼度計算の補正係数】');
        console.log('スコア補正: 90+→×1.3, 80+→×1.2, 70+→×1.1, 60+→×1.0, 50+→×0.9, 40+→×0.8, 40-→×0.7');
        console.log('人気補正: favorite→×1.15, midrange→×1.0, outsider→×0.85');
        console.log('オッズ補正: 1.5-→×0.9, ~3.0→×1.1, ~7.0→×1.0, ~15.0→×0.95, ~30.0→×0.85, 30.0+→×0.7');
    }
}

// 4. 期待値計算テスト
function testExpectedValueCalculation() {
    console.log('\n🔧 4. 期待値計算テスト');
    
    if (typeof ExpectedValueCalculator !== 'undefined') {
        const testHorses = [
            { name: 'ハイゼンスレイ', score: 85, odds: 2.0, placeProbability: 85 },
            { name: 'ケングロリア', score: 45, odds: 8.0, placeProbability: 45 },
            { name: 'ジーティーレイナ', score: 50, odds: 12.0, placeProbability: 50 }
        ];
        
        console.log('【期待値計算詳細】');
        testHorses.forEach(horse => {
            const analysis = ExpectedValueCalculator.calculateHorseExpectedValue(horse, 'place');
            
            console.log(`\n${horse.name}:`);
            console.log(`  入力: スコア${horse.score}, オッズ${horse.odds}倍`);
            console.log(`  推定確率: ${(analysis.estimatedProbability * 100).toFixed(1)}%`);
            console.log(`  推定配当: ${analysis.estimatedOdds}円`);
            console.log(`  信頼度: ${analysis.confidenceScore.toFixed(3)}`);
            console.log(`  期待値: ${analysis.expectedValue.toFixed(3)}`);
            console.log(`  ケリー係数: ${(analysis.kellyRatio * 100).toFixed(2)}%`);
            console.log(`  推奨: ${analysis.recommendation}`);
        });
        
        console.log('\n【現在の設定値】');
        const config = ExpectedValueCalculator.CONFIG;
        console.log('確率係数:', {
            PLACE_BASE: config.SCORE_CALIBRATION.PLACE_BASE,
            PLACE_ADJUSTMENT: config.SCORE_CALIBRATION.PLACE_ADJUSTMENT
        });
        console.log('オッズ係数:', config.POPULARITY_ODDS_FACTOR);
        console.log('期待値閾値:', {
            EXCELLENT: config.EXCELLENT_THRESHOLD,
            GOOD: config.GOOD_THRESHOLD,
            ACCEPTABLE: config.ACCEPTABLE_THRESHOLD
        });
    }
}

// 5. 問題点の総合分析
function analyzeProblemSummary() {
    console.log('\n🔍 5. 問題点総合分析');
    
    console.log('【特定された問題】');
    console.log('1. 確率係数が過度に保守的 (PLACE_BASE: 0.4)');
    console.log('2. オッズ係数が低すぎる (favorite: 0.25, outsider: 0.45)');
    console.log('3. 胴元手数料20%が過大');
    console.log('4. 複数補正の積み重ねで期待値大幅減少');
    console.log('5. 期待値1.0以上が出にくい設定');
    
    console.log('\n【推奨修正値】');
    console.log('確率係数: PLACE_BASE 0.4→0.7, PLACE_ADJUSTMENT 0.1→0.15');
    console.log('オッズ係数: favorite 0.25→0.6, midrange 0.35→0.7, outsider 0.45→0.8');
    console.log('胴元手数料: 20%→10%');
    console.log('信頼度補正: outsider ×0.85→×0.95');
}

// 全分析実行
function runFullAnalysis() {
    analyzeScoreHitRates();
    analyzeExpectedValueResults();
    analyzeConfidenceScore();
    testExpectedValueCalculation();
    analyzeProblemSummary();
}

// 実行
console.log('分析関数が準備されました。以下を実行してください:');
console.log('runFullAnalysis() - 全分析実行');
console.log('analyzeScoreHitRates() - スコア別的中率');
console.log('analyzeExpectedValueResults() - 期待値上位馬結果');
console.log('analyzeConfidenceScore() - 信頼度スコア詳細');
console.log('testExpectedValueCalculation() - 期待値計算テスト');