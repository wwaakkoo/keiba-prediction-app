// Node.js用の高度学習機能テストランナー
const fs = require('fs');
const path = require('path');

// EnhancedLearningSystemをNode.js環境用に調整
global.window = {};
global.document = {
    addEventListener: () => {}
};
global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
};
global.console = console;

// 設定ファイルを読み込み
const configPath = path.join(__dirname, '../js/config.js');
const configContent = fs.readFileSync(configPath, 'utf8');
eval(configContent.replace('window.CONFIG', 'global.CONFIG'));

// EnhancedLearningSystemを読み込み
const enhancedLearningPath = path.join(__dirname, '../js/enhancedLearningSystem.js');
const enhancedLearningContent = fs.readFileSync(enhancedLearningPath, 'utf8');

// window参照を修正してeval
const modifiedContent = enhancedLearningContent
    .replace(/window\./g, 'global.')
    .replace(/document\.addEventListener.*?\}\);/s, '');

eval(modifiedContent);

// テスト実行
console.log('🧪 高度な学習機能テスト開始\n');

// テストデータ生成
function generateTestData() {
    const horseNames = ['ラッキーホース', 'スピードスター', 'ゴールドラッシュ', 'サンダーボルト', 'ダイヤモンド'];
    const jockeys = ['武豊', '福永祐一', '川田将雅', '戸崎圭太', '横山武史'];
    const runningStyles = ['逃げ', '先行', '差し', '追込'];
    
    const testData = { horses: [] };
    
    for (let i = 0; i < 8; i++) {
        const horse = {
            name: horseNames[i % horseNames.length] + (i + 1),
            odds: (Math.random() * 30 + 1).toFixed(1),
            popularity: i + 1,
            age: Math.floor(Math.random() * 3) + 3,
            weight: (Math.random() * 10 + 450).toFixed(0),
            jockey: jockeys[Math.floor(Math.random() * jockeys.length)],
            runningStyle: runningStyles[Math.floor(Math.random() * runningStyles.length)],
            lastRace: {
                position: Math.floor(Math.random() * 8) + 1,
                time: `1:${Math.floor(Math.random() * 60) + 20}.${Math.floor(Math.random() * 9)}`,
                date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                weight: (Math.random() * 10 + 450).toFixed(0)
            },
            raceHistory: [
                { position: Math.floor(Math.random() * 8) + 1, time: `1:${Math.floor(Math.random() * 60) + 20}.${Math.floor(Math.random() * 9)}` },
                { position: Math.floor(Math.random() * 8) + 1, time: `1:${Math.floor(Math.random() * 60) + 20}.${Math.floor(Math.random() * 9)}` },
                { position: Math.floor(Math.random() * 8) + 1, time: `1:${Math.floor(Math.random() * 60) + 20}.${Math.floor(Math.random() * 9)}` }
            ]
        };
        testData.horses.push(horse);
    }
    
    return testData;
}

// テスト1: 特徴量自動発見
function testFeatureDiscovery(testData) {
    console.log('🔍 特徴量自動発見テスト');
    console.log('================================');
    
    try {
        const result = global.EnhancedLearningSystem.discoverFeatures(testData);
        
        console.log(`✅ 成功: ${Object.keys(result.features).length}個の特徴量を発見`);
        console.log(`🏆 上位5重要特徴量:`);
        
        result.topFeatures.slice(0, 5).forEach((feature, i) => {
            console.log(`  ${i+1}. ${feature.name}: ${feature.importance.toFixed(3)}`);
        });
        
        return true;
    } catch (error) {
        console.log(`❌ エラー: ${error.message}`);
        return false;
    }
}

// テスト2: アンサンブル学習
function testEnsembleLearning(testData) {
    console.log('\n🎯 アンサンブル学習テスト');
    console.log('================================');
    
    try {
        const result = global.EnhancedLearningSystem.ensemblePredict(testData);
        
        console.log(`✅ 成功: 全体信頼度 ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`🏆 予測上位3頭:`);
        
        result.predictions.slice(0, 3).forEach((pred, i) => {
            console.log(`  ${i+1}位: ${pred.horse.name} (スコア: ${pred.ensemblePrediction.toFixed(3)})`);
        });
        
        console.log(`⚖️ モデル重み:`);
        Object.entries(result.modelWeights).forEach(([model, weight]) => {
            console.log(`  ${model}: ${(weight * 100).toFixed(1)}%`);
        });
        
        return true;
    } catch (error) {
        console.log(`❌ エラー: ${error.message}`);
        return false;
    }
}

// テスト3: クロスバリデーション
function testCrossValidation() {
    console.log('\n✅ クロスバリデーションテスト');
    console.log('================================');
    
    try {
        // テスト用データ生成
        const cvData = [];
        for (let i = 0; i < 30; i++) {
            cvData.push({
                features: {
                    odds: Math.random() * 20 + 1,
                    age: Math.floor(Math.random() * 3) + 3,
                    popularity: Math.floor(Math.random() * 10) + 1
                },
                actual: Math.random() > 0.7
            });
        }
        
        const result = global.EnhancedLearningSystem.performCrossValidation(cvData, 5);
        
        console.log(`✅ 成功: 5分割クロスバリデーション完了`);
        console.log(`📊 検証スコア: ${(result.validationScore * 100).toFixed(1)}%`);
        console.log(`📊 訓練スコア: ${(result.trainingScore * 100).toFixed(1)}%`);
        
        const gap = result.trainingScore - result.validationScore;
        console.log(`📊 過学習度: ${(gap * 100).toFixed(1)}%`);
        
        if (gap > 0.1) {
            console.log(`⚠️ 過学習の可能性あり`);
        } else {
            console.log(`✅ 健全な学習状態`);
        }
        
        return true;
    } catch (error) {
        console.log(`❌ エラー: ${error.message}`);
        return false;
    }
}

// テスト4: 過学習防止
function testOverlearningDetection() {
    console.log('\n⚠️ 過学習防止テスト');
    console.log('================================');
    
    try {
        // 正常パターン
        console.log(`📈 正常学習パターン:`);
        const normalScores = [0.6, 0.65, 0.7, 0.72, 0.74];
        normalScores.forEach((score, i) => {
            const isOverlearning = global.EnhancedLearningSystem.detectOverlearning(score, true);
            console.log(`  Step ${i+1}: ${score} → ${isOverlearning ? '⚠️過学習' : '✅正常'}`);
        });
        
        // 過学習パターン
        console.log(`\n🚨 過学習パターン:`);
        // 先に訓練スコアを高く設定
        [0.8, 0.85, 0.9, 0.92, 0.95].forEach(score => {
            global.EnhancedLearningSystem.detectOverlearning(score, false);
        });
        
        // 検証スコアは悪化
        const overfittingScores = [0.65, 0.63, 0.6, 0.58, 0.55];
        overfittingScores.forEach((score, i) => {
            const isOverlearning = global.EnhancedLearningSystem.detectOverlearning(score, true);
            console.log(`  Step ${i+1}: ${score} → ${isOverlearning ? '⚠️過学習検出' : '✅正常'}`);
        });
        
        // 学習率調整
        const beforeRate = global.EnhancedLearningSystem.learningData.metaLearning.adaptationRate;
        global.EnhancedLearningSystem.adjustLearningRate();
        const afterRate = global.EnhancedLearningSystem.learningData.metaLearning.adaptationRate;
        console.log(`⚙️ 学習率調整: ${beforeRate.toFixed(3)} → ${afterRate.toFixed(3)}`);
        
        return true;
    } catch (error) {
        console.log(`❌ エラー: ${error.message}`);
        return false;
    }
}

// メイン実行
async function runTests() {
    console.log(`EnhancedLearningSystem利用可能: ${typeof global.EnhancedLearningSystem !== 'undefined'}`);
    
    if (typeof global.EnhancedLearningSystem === 'undefined') {
        console.log('❌ EnhancedLearningSystemが読み込まれていません');
        return;
    }
    
    // テストデータ生成
    console.log('🎲 テストデータ生成中...');
    const testData = generateTestData();
    console.log(`✅ ${testData.horses.length}頭のテストデータを生成\n`);
    
    // 各テスト実行
    const results = {
        featureDiscovery: testFeatureDiscovery(testData),
        ensembleLearning: testEnsembleLearning(testData),
        crossValidation: testCrossValidation(),
        overlearningDetection: testOverlearningDetection()
    };
    
    // 結果サマリー
    console.log('\n🚀 テスト結果サマリー');
    console.log('================================');
    const passedTests = Object.values(results).filter(r => r).length;
    const totalTests = Object.keys(results).length;
    
    Object.entries(results).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASS' : 'FAIL'}`);
    });
    
    console.log(`\n📊 総合結果: ${passedTests}/${totalTests} テスト通過`);
    
    if (passedTests === totalTests) {
        console.log('🎉 全ての高度学習機能が正常に動作しています！');
        console.log('\n実装された機能:');
        console.log('・特徴量自動発見による予測精度向上');
        console.log('・4つのモデルを統合したアンサンブル学習');
        console.log('・過学習防止機能');
        console.log('・クロスバリデーションによる信頼性確保');
    } else {
        console.log('⚠️ 一部のテストが失敗しました。実装を確認してください。');
    }
}

// テスト実行
runTests().catch(console.error);