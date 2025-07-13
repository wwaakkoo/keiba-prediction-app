/**
 * Phase 5 デバッグユーティリティ
 * レース結果を入力せずにシステム状態を確認
 */

// 包括的なシステム状態確認
window.debugPhase5System = function() {
    console.log('🔍 === Phase 5 システム包括確認 ===\n');
    
    // 1. EnhancedPredictionEngine の状態
    console.log('1️⃣ EnhancedPredictionEngine 状態:');
    try {
        const testEngine = new EnhancedPredictionEngine();
        console.log('  ✅ EnhancedPredictionEngine: 正常初期化');
        console.log('  📊 キャリブレーション有効:', testEngine.isCalibrationEnabled);
        console.log('  📈 パフォーマンス履歴数:', testEngine.performanceHistory.length);
        
        if (testEngine.calibrationSystem) {
            const existingData = Object.values(testEngine.calibrationSystem.calibrationData);
            const totalSamples = existingData.reduce((sum, bucket) => sum + (bucket.totalPredictions || 0), 0);
            console.log('  🗂️ 既存サンプル数:', totalSamples);
        }
    } catch (error) {
        console.error('  ❌ EnhancedPredictionEngine: エラー', error.message);
    }
    
    // 2. CalibrationSystem の状態
    console.log('\n2️⃣ CalibrationSystem 状態:');
    try {
        const testCalibration = new CalibrationSystem();
        console.log('  ✅ CalibrationSystem: 正常初期化');
        console.log('  🎯 バケットサイズ:', testCalibration.bucketSize);
        console.log('  📊 最小サンプル数:', testCalibration.minSampleSize);
    } catch (error) {
        console.error('  ❌ CalibrationSystem: エラー', error.message);
    }
    
    // 3. LocalStorage 確認
    console.log('\n3️⃣ データ保存状況:');
    CalibrationSystem.debugDataStatus();
    
    // 4. 関連する学習システム状態
    console.log('\n4️⃣ 関連システム状態:');
    const relatedSystems = [
        'PredictionEngine',
        'LearningSystem', 
        'EnhancedLearningSystem',
        'HorseManager'
    ];
    
    relatedSystems.forEach(systemName => {
        if (typeof window[systemName] !== 'undefined') {
            console.log(`  ✅ ${systemName}: 利用可能`);
        } else {
            console.log(`  ⚠️ ${systemName}: 未定義`);
        }
    });
    
    // 5. 予測データ形式確認
    console.log('\n5️⃣ 現在の予測データ確認:');
    try {
        const currentPredictions = PredictionEngine.getCurrentPredictions();
        if (currentPredictions && currentPredictions.length > 0) {
            console.log(`  📊 予測データ数: ${currentPredictions.length}頭`);
            console.log('  🐎 サンプル馬:', {
                name: currentPredictions[0].horse?.name || '不明',
                score: currentPredictions[0].score,
                hasHorseObject: !!currentPredictions[0].horse
            });
        } else {
            console.log('  ⚠️ 予測データなし（まず予測を実行してください）');
        }
    } catch (error) {
        console.log('  ⚠️ 予測データ取得エラー:', error.message);
    }
    
    console.log('\n🎯 === 確認完了 ===');
    
    return {
        engineAvailable: typeof EnhancedPredictionEngine !== 'undefined',
        calibrationAvailable: typeof CalibrationSystem !== 'undefined',
        hasStoredData: !!localStorage.getItem('phase5_calibration_data'),
        predictionDataAvailable: PredictionEngine.getCurrentPredictions().length > 0
    };
};

// シンプルなデータ確認
window.simplePhase5Check = function() {
    console.log('🔍 Phase 5 簡易確認:');
    
    const hasData = !!localStorage.getItem('phase5_calibration_data');
    
    if (hasData) {
        const result = CalibrationSystem.debugDataStatus();
        console.log(`✅ データあり: ${result.totalSamples}サンプル, ${result.buckets}バケット`);
        return true;
    } else {
        console.log('❌ データなし');
        console.log('💡 テストデータ作成: createPhase5TestData()');
        console.log('💡 実際のレース結果入力が必要です');
        
        // データ取得状況の診断
        console.log('\n🔍 データ取得状況診断:');
        const currentPredictions = PredictionEngine.getCurrentPredictions();
        const windowHorses = window.horses;
        
        console.log('予測データ (PredictionEngine):', currentPredictions?.length || 0, '頭');
        console.log('馬データ (window.horses):', windowHorses?.length || 0, '頭');
        
        if (currentPredictions && currentPredictions.length > 0) {
            console.log('サンプル予測馬:', {
                name: currentPredictions[0].name,
                score: currentPredictions[0].score,
                hasNumber: !!currentPredictions[0].number,
                hasHorseNumber: !!currentPredictions[0].horseNumber
            });
        }
        
        return false;
    }
};

// 学習データのバックアップ/リストア
window.backupPhase5Data = function() {
    const data = localStorage.getItem('phase5_calibration_data');
    if (data) {
        const backup = {
            timestamp: new Date().toISOString(),
            data: JSON.parse(data)
        };
        console.log('💾 Phase 5データバックアップ:', backup);
        return backup;
    } else {
        console.log('❌ バックアップするデータがありません');
        return null;
    }
};

window.restorePhase5Data = function(backup) {
    if (backup && backup.data) {
        localStorage.setItem('phase5_calibration_data', JSON.stringify(backup.data));
        console.log('✅ Phase 5データ復元完了:', backup.timestamp);
        CalibrationSystem.debugDataStatus();
    } else {
        console.log('❌ 無効なバックアップデータです');
    }
};

// 使用方法のヘルプ
window.phase5Help = function() {
    console.log(`
🔍 Phase 5 デバッグコマンド:

基本確認:
  checkPhase5Data()          - データ状況確認
  simplePhase5Check()        - 簡易確認
  debugPhase5System()        - 包括的システム確認

テスト用:
  createPhase5TestData()     - テストデータ作成
  resetPhase5Data()          - データリセット

バックアップ:
  backupPhase5Data()         - データバックアップ
  restorePhase5Data(backup)  - データ復元

使用例:
  // 現在の状況確認
  simplePhase5Check()
  
  // テストデータで動作確認
  createPhase5TestData()
  checkPhase5Data()
  
  // データリセット
  resetPhase5Data()
    `);
};

// Phase 5学習過程トレーサー
window.tracePhase5Learning = function() {
    console.log('🔍 === Phase 5学習過程トレース ===');
    
    // 1. 前提条件チェック
    console.log('\n1️⃣ 前提条件チェック:');
    console.log('  EnhancedPredictionEngine:', typeof EnhancedPredictionEngine !== 'undefined');
    console.log('  CalibrationSystem:', typeof CalibrationSystem !== 'undefined');
    
    // 2. データ可用性チェック
    console.log('\n2️⃣ データ可用性チェック:');
    const currentPredictions = PredictionEngine.getCurrentPredictions();
    const windowHorses = window.horses;
    const horseManagerData = (typeof HorseManager !== 'undefined' && HorseManager.getAllHorses) ? 
        HorseManager.getAllHorses() : [];
    
    console.log('  PredictionEngine.getCurrentPredictions():', currentPredictions.length, '頭');
    console.log('  window.horses:', windowHorses ? windowHorses.length : 0, '頭');
    console.log('  HorseManager.getAllHorses():', horseManagerData.length, '頭');
    
    // 3. 現在のキャリブレーションデータ
    console.log('\n3️⃣ 現在のキャリブレーションデータ:');
    const hasData = !!localStorage.getItem('phase5_calibration_data');
    console.log('  保存データ:', hasData ? 'あり' : 'なし');
    
    if (hasData) {
        CalibrationSystem.debugDataStatus();
    }
    
    // 4. 推奨アクション
    console.log('\n4️⃣ 推奨アクション:');
    if (currentPredictions.length === 0 && windowHorses?.length === 0 && horseManagerData.length === 0) {
        console.log('  ❌ まず馬データを入力し、予測を実行してください');
    } else {
        console.log('  ✅ 予測データが利用可能です');
        console.log('  📝 次の手順: 統合学習に反映ボタン → レース結果入力');
    }
    
    return {
        engineAvailable: typeof EnhancedPredictionEngine !== 'undefined',
        calibrationAvailable: typeof CalibrationSystem !== 'undefined',
        predictionData: currentPredictions.length,
        windowHorses: windowHorses?.length || 0,
        horseManagerData: horseManagerData.length,
        hasCalibrationData: hasData
    };
};

// Phase 5学習を手動で実行（テスト用）
window.manualPhase5Test = function(testFirstHorse = '1番馬', testSecondHorse = null, testThirdHorse = null) {
    console.log('🧪 Phase 5学習手動テスト開始');
    
    try {
        // 予測データ取得
        const currentPredictions = PredictionEngine.getCurrentPredictions();
        if (currentPredictions.length === 0) {
            console.error('❌ 予測データがありません。まず予測を実行してください。');
            return false;
        }
        
        // テスト用実際の結果を設定
        const testActualResults = {
            positions: {},
            finishing_order: {}
        };
        
        // 1着馬を設定（馬番号で指定）
        if (/^\d+$/.test(testFirstHorse)) {
            const horseNumber = parseInt(testFirstHorse);
            testActualResults.positions[horseNumber] = 1;
            testActualResults.finishing_order[horseNumber] = 1;
        } else {
            // 1番目の馬を1着に設定
            testActualResults.positions[1] = 1;
            testActualResults.finishing_order[1] = 1;
        }
        
        console.log('📊 テスト用実際の結果:', testActualResults);
        
        // Phase 5学習実行
        const enhancedEngine = new EnhancedPredictionEngine();
        const predictions = currentPredictions.map(horse => ({
            horse: horse,
            score: horse.score || horse.placeProbability || 50
        }));
        
        const raceData = {
            raceId: `test_race_${Date.now()}`,
            course: 'テスト',
            date: new Date().toISOString()
        };
        
        const learningRecord = enhancedEngine.learnFromRaceResult(raceData, predictions, testActualResults);
        console.log('✅ テスト学習完了:', learningRecord);
        
        // 結果確認
        simplePhase5Check();
        
        return true;
        
    } catch (error) {
        console.error('❌ テスト実行エラー:', error);
        return false;
    }
};

console.log('✅ Phase 5 デバッグユーティリティ読み込み完了');
console.log('💡 使用方法: phase5Help()');
console.log('🔍 学習過程トレース: tracePhase5Learning()');
console.log('🧪 手動テスト実行: manualPhase5Test()');