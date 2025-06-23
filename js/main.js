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

// メッセージ表示機能
function showMessage(message, type = 'info') {
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