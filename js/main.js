// メインアプリケーション機能
class MainApp {
    static init() {
        // アプリケーションの初期化
        console.log('競馬予測アプリを初期化しました');
        
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

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('競馬予測アプリを初期化中...');
    
    // 学習システムの初期化（保存データの読み込み）
    LearningSystem.initialize();
    
    // 携帯簡易モードの初期化
    initializeMobileMode();
    
    // 初期表示（displayHorsesメソッドは存在しないため削除）
    console.log('初期化完了');
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
        `;
        
        horseContent.appendChild(simpleField);
    });
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