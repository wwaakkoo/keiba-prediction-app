// メインアプリケーション機能
class MainApp {
    static init() {
        // アプリケーションの初期化
        //console.log('競馬予測アプリを初期化しました');
        
        // 初期状態でサンプルデータを追加
        // HorseManager.addSampleHorses();
    }
}

// ナビゲーション機能
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function scrollToBottom() {
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
    });
}

// 統合レース結果処理（統計学習とAI学習の両方に反映）
function processUnifiedRaceResult() {
    const currentPredictions = PredictionEngine.getCurrentPredictions();
    if (currentPredictions.length === 0) {
        alert('まず予測を実行してください。');
        return;
    }

    const actualFirst = document.getElementById('unifiedFirst').value.trim();
    const actualSecond = document.getElementById('unifiedSecond').value.trim();
    const actualThird = document.getElementById('unifiedThird').value.trim();

    if (!actualFirst) {
        alert('最低でも1着の馬名を入力してください。');
        return;
    }

    const findHorse = (input) => {
        if (!input) return null;
        
        // 馬番での検索（数字のみの場合）
        if (/^\d+$/.test(input.trim())) {
            const horseNumber = parseInt(input.trim());
            if (horseNumber >= 1 && horseNumber <= currentPredictions.length) {
                return currentPredictions[horseNumber - 1]; // 馬番は1から始まるので-1
            }
            return null;
        }
        
        // 馬名での検索
        return currentPredictions.find(horse => 
            horse.name.includes(input) || input.includes(horse.name)
        );
    };

    const firstHorse = findHorse(actualFirst);
    const secondHorse = findHorse(actualSecond);
    const thirdHorse = findHorse(actualThird);

    if (!firstHorse) {
        const isNumber = /^\d+$/.test(actualFirst.trim());
        const errorMsg = isNumber 
            ? `1着の馬番「${actualFirst}」が見つかりません。馬番は1～${currentPredictions.length}の範囲で入力してください。`
            : `1着の馬「${actualFirst}」が見つかりません。馬名または馬番を確認してください。`;
        alert(errorMsg);
        return;
    }

    // 1. 統計学習システムに反映
    const learningResult = LearningSystem.updateLearningData(firstHorse, secondHorse, thirdHorse);
    LearningSystem.displayLearningFeedback(learningResult, firstHorse, secondHorse, thirdHorse);

    // 買い目推奨の結果も記録
    const actualResult = {
        winner: firstHorse.name,
        place: [firstHorse, secondHorse, thirdHorse].filter(h => h).map(h => h.name)
    };
    
    if (window.lastBettingRecommendations) {
        BettingRecommender.recordBettingRecommendation(window.lastBettingRecommendations, actualResult);
    }

    // 2. AI学習システムに反映
    if (AIRecommendationService.lastRecommendation) {
        const actualPlace = [firstHorse, secondHorse, thirdHorse].filter(h => h).map(h => h.name);
        AIRecommendationService.recordRaceResult(firstHorse.name, actualPlace, AIRecommendationService.lastRecommendation);
        
        showMessage('🤖 AI学習にも結果を反映しました', 'success');
    }

    // 統合処理完了メッセージ
    showMessage('🧠 統合学習に結果を反映しました（統計・AI両方）', 'success');

    // 入力フィールドをクリア
    document.getElementById('unifiedFirst').value = '';
    document.getElementById('unifiedSecond').value = '';
    document.getElementById('unifiedThird').value = '';
}

// 全学習データリセット機能
function resetAllLearningData() {
    if (!confirm('統計学習データとAI学習データの両方をリセットしますか？\n\nこの操作は元に戻せません。')) {
        return;
    }
    
    // 統計学習データリセット
    LearningSystem.resetLearningData();
    
    // AI学習データリセット
    if (typeof AIRecommendationService !== 'undefined' && AIRecommendationService.resetLearningData) {
        AIRecommendationService.resetLearningData();
    } else {
        // AI推奨履歴を直接削除
        localStorage.removeItem('aiRecommendationHistory');
    }
    
    showMessage('🔄 全学習データをリセットしました（統計・AI両方）', 'success');
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    //console.log('競馬予測アプリを初期化中...');
    
    // 学習システムの初期化（保存データの読み込み）
    LearningSystem.initialize();
    
    // 買い目推奨システムの初期化
    BettingRecommender.initialize();
    
    // 携帯簡易モードの初期化
    initializeMobileMode();
    
    // 初期表示（displayHorsesメソッドは存在しないため削除）
    //console.log('初期化完了');
});

// 携帯簡易モード機能
function initializeMobileMode() {
    const modeToggle = document.getElementById('modeToggle');
    if (!modeToggle) return;
    
    // 現在のモードを確認
    const isMobileMode = localStorage.getItem('mobileMode') === 'true';
    updateMobileMode(isMobileMode);
    
    modeToggle.addEventListener('click', function() {
        const currentMode = localStorage.getItem('mobileMode') === 'true';
        const newMode = !currentMode;
        localStorage.setItem('mobileMode', newMode.toString());
        updateMobileMode(newMode);
    });
}

function updateMobileMode(isMobileMode) {
    const modeToggle = document.getElementById('modeToggle');
    const body = document.body;
    
    if (isMobileMode) {
        body.classList.add('mobile-mode');
        modeToggle.textContent = '🖥️ PC詳細モード';
        modeToggle.style.background = 'linear-gradient(45deg, #007bff, #0056b3)';
        
        // 詳細セクションを非表示
        const detailedSections = document.querySelectorAll('.horse-section');
        detailedSections.forEach(section => {
            section.style.display = 'none';
        });
        
        // 簡易入力フィールドを表示
        showSimpleInputFields();
    } else {
        body.classList.remove('mobile-mode');
        modeToggle.textContent = '📱 携帯簡易モード';
        modeToggle.style.background = 'linear-gradient(45deg, #28a745, #20c997)';
        
        // 詳細セクションを表示
        const detailedSections = document.querySelectorAll('.horse-section');
        detailedSections.forEach(section => {
            section.style.display = 'block';
        });
        
        // 簡易入力フィールドを非表示
        hideSimpleInputFields();
    }
}

function showSimpleInputFields() {
    // 簡易入力フィールドが既に存在するかチェック
    const existingSimpleFields = document.querySelectorAll('.simple-input-field');
    if (existingSimpleFields.length > 0) return;
    
    const horseCards = document.querySelectorAll('.horse-card');
    horseCards.forEach(card => {
        const horseContent = card.querySelector('.horse-content');
        if (!horseContent) return;
        
        // 簡易入力フィールドを追加
        const simpleField = document.createElement('div');
        simpleField.className = 'simple-input-field';
        simpleField.style.cssText = `
            background: #e8f5e8;
            padding: 10px;
            border-radius: 8px;
            margin-top: 10px;
            border: 1px solid #4caf50;
        `;
        
        simpleField.innerHTML = `
            <h4 style="color: #2e7d32; margin-bottom: 8px;">📱 簡易入力</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div>
                    <label style="font-size: 0.9em;">馬名</label>
                    <input type="text" name="simpleHorseName" placeholder="馬名" style="width: 100%; padding: 8px; font-size: 14px;">
                </div>
                <div>
                    <label style="font-size: 0.9em;">オッズ</label>
                    <input type="number" name="simpleOdds" placeholder="例: 4.5" step="0.1" style="width: 100%; padding: 8px; font-size: 14px;">
                </div>
                <div>
                    <label style="font-size: 0.9em;">前走着順</label>
                    <input type="number" name="simpleLastRaceOrder" placeholder="例: 1" min="1" max="18" style="width: 100%; padding: 8px; font-size: 14px;">
                </div>
                <div>
                    <label style="font-size: 0.9em;">騎手</label>
                    <input type="text" name="simpleJockey" placeholder="騎手名" style="width: 100%; padding: 8px; font-size: 14px;">
                </div>
                <div>
                    <label style="font-size: 0.9em;">年齢</label>
                    <select name="simpleAge" style="width: 100%; padding: 8px; font-size: 14px;">
                        <option value="3">3歳</option>
                        <option value="4">4歳</option>
                        <option value="5" selected>5歳</option>
                        <option value="6">6歳</option>
                        <option value="7">7歳</option>
                        <option value="8">8歳以上</option>
                    </select>
                </div>
                <div>
                    <label style="font-size: 0.9em;">体重変化</label>
                    <select name="simpleWeightChange" style="width: 100%; padding: 8px; font-size: 14px;">
                        <option value="0">変化なし</option>
                        <option value="1">増加</option>
                        <option value="-1">減少</option>
                    </select>
                </div>
            </div>
            <div style="margin-top: 10px; text-align: center;">
                <button onclick="syncSimpleDataToMain(this)" style="background: linear-gradient(45deg, #28a745, #20c997); color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">📝 データ反映</button>
            </div>
        `;
        
        horseContent.appendChild(simpleField);
        
        // 既存のメインデータから簡易フィールドに値を読み込む
        loadMainDataToSimple(card);
        
        // リアルタイム同期のイベントリスナーを追加
        setupRealTimeSync(simpleField, card);
    });
}

// メインデータから簡易フィールドに値を読み込む
function loadMainDataToSimple(horseCard) {
    const simpleField = horseCard.querySelector('.simple-input-field');
    if (!simpleField) return;
    
    // メインフィールドから値を取得
    const horseName = horseCard.querySelector('input[name="horseName"]')?.value || '';
    const odds = horseCard.querySelector('input[name="odds"]')?.value || '';
    const lastRaceOrder = horseCard.querySelector('input[name="lastRaceOrder"]')?.value || '';
    const jockey = horseCard.querySelector('input[name="jockey"]')?.value || '';
    const age = horseCard.querySelector('select[name="age"]')?.value || '5';
    
    // 簡易フィールドに値を設定
    const simpleHorseName = simpleField.querySelector('input[name="simpleHorseName"]');
    const simpleOdds = simpleField.querySelector('input[name="simpleOdds"]');
    const simpleLastRaceOrder = simpleField.querySelector('input[name="simpleLastRaceOrder"]');
    const simpleJockey = simpleField.querySelector('input[name="simpleJockey"]');
    const simpleAge = simpleField.querySelector('select[name="simpleAge"]');
    
    if (simpleHorseName) simpleHorseName.value = horseName;
    if (simpleOdds) simpleOdds.value = odds;
    if (simpleLastRaceOrder) simpleLastRaceOrder.value = lastRaceOrder;
    if (simpleJockey) simpleJockey.value = jockey;
    if (simpleAge) simpleAge.value = age;
}

// リアルタイム同期の設定
function setupRealTimeSync(simpleField, horseCard) {
    const inputs = simpleField.querySelectorAll('input, select');
    
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            syncSimpleDataToMainAuto(horseCard);
        });
        
        input.addEventListener('change', function() {
            syncSimpleDataToMainAuto(horseCard);
        });
    });
}

// 簡易データを自動的にメインに同期（リアルタイム）
function syncSimpleDataToMainAuto(horseCard) {
    const simpleField = horseCard.querySelector('.simple-input-field');
    if (!simpleField) return;
    
    // 簡易フィールドから値を取得
    const simpleHorseName = simpleField.querySelector('input[name="simpleHorseName"]')?.value || '';
    const simpleOdds = simpleField.querySelector('input[name="simpleOdds"]')?.value || '';
    const simpleLastRaceOrder = simpleField.querySelector('input[name="simpleLastRaceOrder"]')?.value || '';
    const simpleJockey = simpleField.querySelector('input[name="simpleJockey"]')?.value || '';
    const simpleAge = simpleField.querySelector('select[name="simpleAge"]')?.value || '5';
    const simpleWeightChange = simpleField.querySelector('select[name="simpleWeightChange"]')?.value || '0';
    
    // メインフィールドに値を設定
    const horseName = horseCard.querySelector('input[name="horseName"]');
    const odds = horseCard.querySelector('input[name="odds"]');
    const lastRaceOrder = horseCard.querySelector('input[name="lastRaceOrder"]');
    const jockey = horseCard.querySelector('input[name="jockey"]');
    const age = horseCard.querySelector('select[name="age"]');
    
    if (horseName) horseName.value = simpleHorseName;
    if (odds) odds.value = simpleOdds;
    if (lastRaceOrder) lastRaceOrder.value = simpleLastRaceOrder;
    if (jockey) jockey.value = simpleJockey;
    if (age) age.value = simpleAge;
    
    // 体重変化に基づいて体重関連フィールドを設定
    const weightChange = horseCard.querySelector('input[name="weightChange"]');
    if (weightChange) {
        if (simpleWeightChange === '1') {
            weightChange.value = '+2'; // 増加の場合
        } else if (simpleWeightChange === '-1') {
            weightChange.value = '-2'; // 減少の場合
        } else {
            weightChange.value = '0'; // 変化なし
        }
    }
    
    // デフォルト値を他のフィールドに設定（予測計算で必要）
    setDefaultValuesForPrediction(horseCard);
}

// 予測計算に必要なデフォルト値を設定
function setDefaultValuesForPrediction(horseCard) {
    // レース基本情報から値を取得
    const raceDistance = document.getElementById('raceDistance')?.value || '1600';
    const raceTrackType = document.getElementById('raceTrackType')?.value || '芝';
    const raceTrackCondition = document.getElementById('raceTrackCondition')?.value || '良';
    
    // 未入力の重要フィールドにデフォルト値を設定
    const fieldsWithDefaults = [
        { name: 'weight', defaultValue: '500' },
        { name: 'jockeyWinRate', defaultValue: '0.15' },
        { name: 'recentForm', defaultValue: '3' },
        { name: 'restDays', defaultValue: '14' },
        { name: 'distanceExperience', defaultValue: raceDistance },
        { name: 'trackTypeExperience', defaultValue: raceTrackType },
        { name: 'trackConditionExperience', defaultValue: raceTrackCondition },
        { name: 'lastRaceTime', defaultValue: '1:35.0' },
        { name: 'lastRaceWeight', defaultValue: '500' },
        { name: 'lastRaceOdds', defaultValue: '5.0' },
        { name: 'lastRacePopularity', defaultValue: '5' },
        { name: 'lastRaceHorseCount', defaultValue: '16' }
    ];
    
    fieldsWithDefaults.forEach(field => {
        const input = horseCard.querySelector(`input[name="${field.name}"], select[name="${field.name}"]`);
        if (input && (!input.value || input.value.trim() === '')) {
            input.value = field.defaultValue;
        }
    });
}

// 手動同期ボタンの処理
function syncSimpleDataToMain(button) {
    const simpleField = button.closest('.simple-input-field');
    const horseCard = button.closest('.horse-card');
    
    if (!simpleField || !horseCard) return;
    
    // 自動同期と同じ処理を実行
    syncSimpleDataToMainAuto(horseCard);
    
    // 成功メッセージを表示
    if (typeof showMessage === 'function') {
        showMessage('📝 データを反映しました', 'success');
    }
    
    // ボタンに一時的なフィードバック
    const originalText = button.textContent;
    button.textContent = '✓ 反映済み';
    button.style.background = 'linear-gradient(45deg, #28a745, #1e7e34)';
    
    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = 'linear-gradient(45deg, #28a745, #20c997)';
    }, 1500);
}

function hideSimpleInputFields() {
    const simpleFields = document.querySelectorAll('.simple-input-field');
    simpleFields.forEach(field => field.remove());
}

// グローバル関数として公開
window.scrollToTop = scrollToTop;
window.scrollToBottom = scrollToBottom;
window.initializeMobileMode = initializeMobileMode;
window.updateMobileMode = updateMobileMode;
window.syncSimpleDataToMain = syncSimpleDataToMain;

// メッセージ表示機能（グローバルアクセス可能にするため window.mainShowMessage も作成）
function showMessage(message, type = 'info') {
    // デバッグ: 関数が呼ばれたことをコンソールに出力
    console.log(`showMessage called: "${message}" (type: ${type})`);
    
    // 既存のメッセージを削除
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // 新しいメッセージ要素を作成
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="close-btn">×</button>
    `;
    
    // スタイルを設定
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: space-between;
        animation: slideIn 0.3s ease-out;
    `;
    
    // タイプに応じて背景色を設定
    switch (type) {
        case 'success':
            messageDiv.style.background = 'linear-gradient(45deg, #28a745, #20c997)';
            break;
        case 'error':
            messageDiv.style.background = 'linear-gradient(45deg, #dc3545, #c82333)';
            break;
        case 'warning':
            messageDiv.style.background = 'linear-gradient(45deg, #ffc107, #ff8c00)';
            break;
        default:
            messageDiv.style.background = 'linear-gradient(45deg, #007bff, #0056b3)';
    }
    
    // 閉じるボタンのスタイル
    const closeBtn = messageDiv.querySelector('.close-btn');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        margin-left: 10px;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
    `;
    
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.backgroundColor = 'rgba(255,255,255,0.2)';
    });
    
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.backgroundColor = 'transparent';
    });
    
    // ページに追加
    document.body.appendChild(messageDiv);
    
    // 5秒後に自動削除（エラーメッセージは除く）
    if (type !== 'error') {
        setTimeout(() => {
            if (messageDiv.parentElement) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

// アニメーション用のCSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// グローバル関数として公開
window.showMessage = showMessage;
window.mainShowMessage = showMessage;

// ===== ハイブリッド学習 精度測定・検証機能 =====

// ハイブリッド学習の精度をテスト
async function testHybridLearningAccuracy() {
    try {
        showMessage('📊 ハイブリッド学習の精度測定を開始しています...', 'info');
        
        // テスト用の過去データを生成
        const testData = HybridLearningSystem.generateTestHistoricalData();
        console.log(`生成されたテストデータ: ${testData.length}件`);
        
        // データを訓練用とテスト用に分割 (80:20)
        const splitIndex = Math.floor(testData.length * 0.8);
        const trainingData = testData.slice(0, splitIndex);
        const testingData = testData.slice(splitIndex);
        
        // ハイブリッド学習データセットを生成
        const hybridDataset = HybridLearningSystem.generateHybridTrainingData(trainingData);
        console.log(`学習データセット: ${hybridDataset.length}ポイント`);
        
        // テストデータで精度を検証
        const accuracy = HybridLearningSystem.validateAccuracy(testingData, hybridDataset);
        
        // 結果を表示
        displayAccuracyResults(accuracy, testingData.length, hybridDataset.length);
        
        // 学習結果を保存
        HybridLearningSystem.saveLearningResults(hybridDataset, accuracy);
        
        showMessage(`✅ 精度測定完了！勝率: ${(accuracy.winAccuracy * 100).toFixed(1)}%, 複勝率: ${(accuracy.placeAccuracy * 100).toFixed(1)}%`, 'success');
        
    } catch (error) {
        console.error('精度測定エラー:', error);
        showMessage(`❌ 精度測定に失敗しました: ${error.message}`, 'error');
    }
}

// 精度測定結果の表示
function displayAccuracyResults(accuracy, testDataCount, learningDataCount) {
    const resultsContainer = document.getElementById('results');
    if (!resultsContainer) return;
    
    const html = `
        <div style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); border-radius: 15px; padding: 20px; margin: 20px 0; color: white; box-shadow: 0 8px 25px rgba(76, 175, 80, 0.3);">
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <span style="font-size: 24px; margin-right: 10px;">📊</span>
                <h3 style="margin: 0; font-size: 1.4em;">ハイブリッド学習 精度測定結果</h3>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px;">
                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 2em; font-weight: bold; margin-bottom: 5px;">
                        ${(accuracy.winAccuracy * 100).toFixed(1)}%
                    </div>
                    <div style="opacity: 0.9;">勝率精度</div>
                    <div style="font-size: 0.8em; opacity: 0.7;">
                        ${accuracy.winCorrect}/${accuracy.total}的中
                    </div>
                </div>
                
                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 2em; font-weight: bold; margin-bottom: 5px;">
                        ${(accuracy.placeAccuracy * 100).toFixed(1)}%
                    </div>
                    <div style="opacity: 0.9;">複勝精度</div>
                    <div style="font-size: 0.8em; opacity: 0.7;">
                        ${accuracy.placeCorrect}/${accuracy.total}的中
                    </div>
                </div>
                
                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 2em; font-weight: bold; margin-bottom: 5px;">
                        ${(accuracy.averageConfidence * 100).toFixed(1)}%
                    </div>
                    <div style="opacity: 0.9;">平均信頼度</div>
                    <div style="font-size: 0.8em; opacity: 0.7;">
                        予測の確実性
                    </div>
                </div>
                
                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 1.5em; font-weight: bold; margin-bottom: 5px;">
                        ${learningDataCount}
                    </div>
                    <div style="opacity: 0.9;">学習データ数</div>
                    <div style="font-size: 0.8em; opacity: 0.7;">
                        パターン数
                    </div>
                </div>
            </div>
            
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px;">
                <h4 style="margin: 0 0 10px 0;">📈 詳細分析</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 0.9em;">
                    <div>
                        <strong>データ分析:</strong><br>
                        • テストレース数: ${testDataCount}レース<br>
                        • 学習パターン数: ${learningDataCount}パターン<br>
                        • 時期別重み付け適用済み
                    </div>
                    <div>
                        <strong>予測性能:</strong><br>
                        • 勝率予測: ${accuracy.winAccuracy > 0.25 ? '良好' : accuracy.winAccuracy > 0.15 ? '標準' : '要改善'}<br>
                        • 複勝予測: ${accuracy.placeAccuracy > 0.60 ? '良好' : accuracy.placeAccuracy > 0.40 ? '標準' : '要改善'}<br>
                        • 信頼度: ${accuracy.averageConfidence > 0.70 ? '高' : accuracy.averageConfidence > 0.50 ? '中' : '低'}
                    </div>
                </div>
            </div>
            
            <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; margin-top: 15px; font-size: 0.85em; opacity: 0.8;">
                💡 <strong>改善のヒント:</strong>
                ${accuracy.winAccuracy < 0.20 ? 
                    'より多くの過去データが必要です。実際のレース結果を入力して学習を強化してください。' :
                    'good performance! 継続的にレース結果を入力することで、さらに精度が向上します。'
                }
            </div>
        </div>
    `;
    
    // 既存の精度測定結果があれば削除
    const existingResults = document.querySelector('[data-accuracy-results]');
    if (existingResults) {
        existingResults.remove();
    }
    
    // 新しい結果を挿入
    const newDiv = document.createElement('div');
    newDiv.setAttribute('data-accuracy-results', 'true');
    newDiv.innerHTML = html;
    resultsContainer.appendChild(newDiv);
}

// 過去データから学習を実行
async function trainFromHistoricalData() {
    try {
        showMessage('🎓 過去データからの学習を開始しています...', 'info');
        
        // 保存されている学習システムのデータを取得
        const existingLearningData = LearningSystem.getLearningData();
        const historicalRaces = existingLearningData.history || [];
        
        if (historicalRaces.length < 5) {
            showMessage('❌ 学習に十分な過去データがありません。最低5レース分のデータが必要です。', 'warning');
            return;
        }
        
        // ハイブリッド学習データセットを生成
        const hybridDataset = HybridLearningSystem.generateHybridTrainingData(historicalRaces);
        
        // テスト用に最新のデータを使用
        const testData = historicalRaces.slice(-5); // 最新5レース
        const accuracy = HybridLearningSystem.validateAccuracy(testData, hybridDataset);
        
        // 学習結果を保存
        HybridLearningSystem.saveLearningResults(hybridDataset, accuracy);
        
        // 結果を表示
        displayAccuracyResults(accuracy, testData.length, hybridDataset.length);
        
        showMessage(`✅ 学習完了！${historicalRaces.length}レースから${hybridDataset.length}パターンを学習しました`, 'success');
        
    } catch (error) {
        console.error('学習エラー:', error);
        showMessage(`❌ 学習に失敗しました: ${error.message}`, 'error');
    }
}

// ハイブリッド学習統計の表示
function showHybridLearningStats() {
    try {
        const learningData = HybridLearningSystem.loadLearningResults();
        
        if (!learningData) {
            showMessage('ハイブリッド学習データがありません。まず精度測定を実行してください。', 'info');
            return;
        }
        
        const accuracy = learningData.accuracy;
        const dataCount = learningData.hybridDataset?.length || 0;
        const lastUpdated = learningData.lastUpdated ? 
            new Date(learningData.lastUpdated).toLocaleString('ja-JP') : '不明';
        
        let statsMessage = `📊 ハイブリッド学習統計\n\n`;
        statsMessage += `学習データ数: ${dataCount}パターン\n`;
        statsMessage += `勝率精度: ${(accuracy.winAccuracy * 100).toFixed(1)}%\n`;
        statsMessage += `複勝精度: ${(accuracy.placeAccuracy * 100).toFixed(1)}%\n`;
        statsMessage += `平均信頼度: ${(accuracy.averageConfidence * 100).toFixed(1)}%\n`;
        statsMessage += `最終更新: ${lastUpdated}\n\n`;
        
        if (accuracy.winAccuracy > 0.25) {
            statsMessage += `✨ 勝率予測性能が優秀です！`;
        } else if (accuracy.winAccuracy > 0.15) {
            statsMessage += `👍 勝率予測性能は標準的です`;
        } else {
            statsMessage += `🔧 さらなるデータ蓄積で精度向上が期待できます`;
        }
        
        showMessage(statsMessage, 'info');
        
    } catch (error) {
        console.error('統計表示エラー:', error);
        showMessage(`❌ 統計表示に失敗しました: ${error.message}`, 'error');
    }
}

// テスト用ハイブリッドデータの生成とテスト
function generateTestHybridData() {
    try {
        showMessage('🧪 テスト用ハイブリッドデータを生成中...', 'info');
        
        const testData = HybridLearningSystem.generateTestHistoricalData();
        const hybridDataset = HybridLearningSystem.generateHybridTrainingData(testData);
        
        // テスト結果の一部を表示
        console.log('生成されたテストデータ:', testData.slice(0, 3));
        console.log('ハイブリッドデータセット:', hybridDataset.slice(0, 10));
        
        showMessage(`✅ テストデータ生成完了！${testData.length}レース、${hybridDataset.length}パターン`, 'success');
        
        // 自動で精度測定も実行
        setTimeout(() => {
            testHybridLearningAccuracy();
        }, 1000);
        
    } catch (error) {
        console.error('テストデータ生成エラー:', error);
        showMessage(`❌ テストデータ生成に失敗しました: ${error.message}`, 'error');
    }
}

// ハイブリッド学習機能をグローバルに公開
window.testHybridLearningAccuracy = testHybridLearningAccuracy;
window.trainFromHistoricalData = trainFromHistoricalData;
window.showHybridLearningStats = showHybridLearningStats;
window.generateTestHybridData = generateTestHybridData;

// 強化学習システムとの統合
function switchToEnhancedLearningSystem() {
    try {
        if (typeof EnhancedLearningSystem !== 'undefined') {
            // 既存の学習データを移行
            const oldLearningData = LearningSystem.getLearningData();
            console.log('従来の学習データ:', oldLearningData);
            
            // 強化学習システム初期化
            EnhancedLearningSystem.initialize();
            
            // 可視化システム初期化
            if (typeof EnhancedVisualizationSystem !== 'undefined') {
                EnhancedVisualizationSystem.initialize();
                showMessage('🚀 強化学習システムに切り替えました！新しいダッシュボードをご確認ください。', 'success', 5000);
                
                // グラフセクションを表示
                const graphSection = document.getElementById('learningGraphsSection');
                if (graphSection) {
                    graphSection.style.display = 'block';
                }
            } else {
                console.warn('EnhancedVisualizationSystem が読み込まれていません');
            }
        } else {
            console.warn('EnhancedLearningSystem が読み込まれていません');
            showMessage('強化学習システムの読み込みに失敗しました', 'error', 3000);
        }
    } catch (error) {
        console.error('強化学習システム切り替えエラー:', error);
        showMessage(`システム切り替えエラー: ${error.message}`, 'error', 5000);
    }
}

// 強化学習システムのテスト
function testEnhancedLearningSystem() {
    try {
        if (typeof EnhancedLearningSystem === 'undefined') {
            showMessage('強化学習システムが読み込まれていません', 'error', 3000);
            return;
        }
        
        // テスト用のレース結果データ
        const testActualResults = {
            winner: {
                name: 'テスト馬A',
                sire: 'ディープインパクト',
                dam: 'テスト母',
                runningStyle: '差し',
                age: 4,
                horseNumber: 1
            },
            allResults: [
                { name: 'テスト馬A', sire: 'ディープインパクト', runningStyle: '差し' },
                { name: 'テスト馬B', sire: 'ハーツクライ', runningStyle: '先行' },
                { name: 'テスト馬C', sire: 'キングカメハメハ', runningStyle: '追込' }
            ]
        };
        
        const testPredictions = [
            { name: 'テスト馬A', sire: 'ディープインパクト', runningStyle: '差し', score: 85 },
            { name: 'テスト馬B', sire: 'ハーツクライ', runningStyle: '先行', score: 78 },
            { name: 'テスト馬C', sire: 'キングカメハメハ', runningStyle: '追込', score: 72 }
        ];
        
        const testRaceConditions = {
            distance: 2000,
            surface: '芝',
            course: '阪神',
            weather: '晴'
        };
        
        // 強化学習処理を実行
        console.log('=== 強化学習システムテスト開始 ===');
        const learningResults = EnhancedLearningSystem.processEnhancedRaceResult(
            testActualResults, 
            testPredictions, 
            testRaceConditions
        );
        
        console.log('強化学習結果:', learningResults);
        
        // 統計サマリーを取得
        const stats = EnhancedLearningSystem.getStatsSummary();
        console.log('統計サマリー:', stats);
        
        // 可視化システムがあれば更新
        if (typeof EnhancedVisualizationSystem !== 'undefined') {
            EnhancedVisualizationSystem.updateAllCharts();
        }
        
        showMessage('✅ 強化学習システムのテストが完了しました', 'success', 3000);
        
    } catch (error) {
        console.error('強化学習システムテストエラー:', error);
        showMessage(`テストエラー: ${error.message}`, 'error', 5000);
    }
}

// グローバル関数として公開
window.switchToEnhancedLearningSystem = switchToEnhancedLearningSystem;
window.testEnhancedLearningSystem = testEnhancedLearningSystem;

// 学習データ移行機能の統合
function migrateAndSwitchToEnhanced() {
    try {
        console.log('=== 既存データ移行 + 強化システム切り替え ===');
        
        // 1. データ移行実行
        const migrationResult = migrateLearningData();
        
        if (migrationResult.success) {
            console.log('移行成功:', migrationResult);
            
            // 2. 強化学習システムに切り替え
            switchToEnhancedLearningSystem();
            
            // 3. グラフ更新
            if (typeof EnhancedVisualizationSystem !== 'undefined') {
                setTimeout(() => {
                    EnhancedVisualizationSystem.updateAllCharts();
                    showMessage('📊 移行したデータがグラフに反映されました！', 'success', 4000);
                }, 1500);
            }
            
            showMessage(`✅ 移行完了！${migrationResult.migratedDataCount}件のデータを移行しました`, 'success', 5000);
            
        } else {
            console.log('移行失敗:', migrationResult);
            showMessage(`❌ 移行失敗: ${migrationResult.reason}`, 'error', 5000);
            
            // 移行に失敗しても強化システムは使用可能
            switchToEnhancedLearningSystem();
        }
        
        return migrationResult;
        
    } catch (error) {
        console.error('移行・切り替えエラー:', error);
        showMessage(`❌ 処理エラー: ${error.message}`, 'error', 5000);
    }
}

// 学習データの確認機能
function checkExistingLearningData() {
    try {
        console.log('=== 既存学習データの確認 ===');
        
        // LearningSystemの確認
        if (typeof LearningSystem !== 'undefined') {
            const learningData = LearningSystem.getLearningData();
            console.log('LearningSystem データ:', learningData);
            
            if (learningData && learningData.accuracy && learningData.accuracy.totalPredictions > 0) {
                const stats = {
                    totalRaces: learningData.accuracy.totalPredictions,
                    winRate: ((learningData.accuracy.winPredictions / learningData.accuracy.totalPredictions) * 100).toFixed(1),
                    placeRate: ((learningData.accuracy.placePredictions / learningData.accuracy.totalPredictions) * 100).toFixed(1)
                };
                
                showMessage(`📊 既存データ発見: ${stats.totalRaces}レース分 (勝率${stats.winRate}%, 複勝率${stats.placeRate}%)`, 'info', 6000);
                return stats;
            }
        }
        
        // LocalStorageの確認
        const storedData = localStorage.getItem('keibaLearningData');
        if (storedData) {
            const parsed = JSON.parse(storedData);
            console.log('LocalStorage データ:', parsed);
            showMessage('💾 LocalStorageに学習データが保存されています', 'info', 4000);
            return parsed;
        }
        
        showMessage('📝 既存の学習データが見つかりません。新規でデータを蓄積します。', 'info', 4000);
        return null;
        
    } catch (error) {
        console.error('データ確認エラー:', error);
        showMessage(`❌ データ確認エラー: ${error.message}`, 'error', 3000);
        return null;
    }
}

// グローバル関数として公開
window.migrateAndSwitchToEnhanced = migrateAndSwitchToEnhanced;
window.checkExistingLearningData = checkExistingLearningData;