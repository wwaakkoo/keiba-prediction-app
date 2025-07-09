// モバイルインタラクションハンドラー - スワイプジェスチャーとタッチ最適化
class MobileInteractionHandler {
    constructor() {
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;
        this.threshold = 50; // スワイプ検出の最小距離
        this.restraint = 100; // 垂直方向の許容範囲
        this.allowedTime = 300; // スワイプの最大時間（ms）
        this.startTime = 0;
        
        this.init();
    }
    
    init() {
        console.log('🤚 モバイルインタラクションハンドラーを初期化しました');
        
        // スワイプジェスチャーの設定
        this.setupSwipeGestures();
        
        // タッチフィードバックの設定
        this.setupTouchFeedback();
        
        // 片手操作ゾーンの設定
        this.setupThumbZone();
        
        // バイブレーションフィードバックの設定
        this.setupVibrationFeedback();
        
        // 画面回転の対応
        this.setupOrientationChange();
    }
    
    // スワイプジェスチャーの設定
    setupSwipeGestures() {
        const container = document.querySelector('.container');
        if (!container) return;
        
        // 馬カードコンテナにスワイプヒントを追加
        const horseCards = document.querySelectorAll('.horse-card');
        horseCards.forEach(card => {
            card.classList.add('swipe-hint');
        });
        
        container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        container.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
        
        console.log('👆 スワイプジェスチャーを設定しました');
    }
    
    handleTouchStart(e) {
        const touch = e.touches[0];
        this.startX = touch.clientX;
        this.startY = touch.clientY;
        this.startTime = new Date().getTime();
    }
    
    handleTouchEnd(e) {
        const touch = e.changedTouches[0];
        this.endX = touch.clientX;
        this.endY = touch.clientY;
        
        const elapsedTime = new Date().getTime() - this.startTime;
        
        if (elapsedTime <= this.allowedTime) {
            this.handleSwipe();
        }
    }
    
    handleSwipe() {
        const deltaX = this.endX - this.startX;
        const deltaY = this.endY - this.startY;
        
        // 横方向のスワイプが十分で、縦方向の移動が小さい場合
        if (Math.abs(deltaX) >= this.threshold && Math.abs(deltaY) <= this.restraint) {
            if (deltaX > 0) {
                this.onSwipeRight();
            } else {
                this.onSwipeLeft();
            }
        }
        
        // 縦方向のスワイプ
        if (Math.abs(deltaY) >= this.threshold && Math.abs(deltaX) <= this.restraint) {
            if (deltaY > 0) {
                this.onSwipeDown();
            } else {
                this.onSwipeUp();
            }
        }
    }
    
    onSwipeLeft() {
        console.log('👈 左スワイプ検出');
        // 次のセクションへ移動
        this.scrollToNextSection();
        this.triggerVibration();
    }
    
    onSwipeRight() {
        console.log('👉 右スワイプ検出');
        // 前のセクションへ移動
        this.scrollToPreviousSection();
        this.triggerVibration();
    }
    
    onSwipeUp() {
        console.log('👆 上スワイプ検出');
        // ページ上部へ移動
        this.scrollToTop();
    }
    
    onSwipeDown() {
        console.log('👇 下スワイプ検出');
        // ページ下部へ移動
        this.scrollToBottom();
    }
    
    // セクション間のナビゲーション
    scrollToNextSection() {
        const sections = document.querySelectorAll('.section');
        const current = this.getCurrentSection();
        
        if (current < sections.length - 1) {
            sections[current + 1].scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
            this.showNavigationFeedback('次のセクション');
        }
    }
    
    scrollToPreviousSection() {
        const sections = document.querySelectorAll('.section');
        const current = this.getCurrentSection();
        
        if (current > 0) {
            sections[current - 1].scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
            this.showNavigationFeedback('前のセクション');
        }
    }
    
    getCurrentSection() {
        const sections = document.querySelectorAll('.section');
        let currentSection = 0;
        
        sections.forEach((section, index) => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= window.innerHeight / 2) {
                currentSection = index;
            }
        });
        
        return currentSection;
    }
    
    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.showNavigationFeedback('ページ上部');
    }
    
    scrollToBottom() {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        this.showNavigationFeedback('ページ下部');
    }
    
    // タッチフィードバックの設定
    setupTouchFeedback() {
        // 全てのボタンにタッチフィードバッククラスを追加
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            btn.classList.add('touch-feedback', 'touch-target', 'no-select');
        });
        
        // 馬カードにタッチフィードバックを追加
        const horseCards = document.querySelectorAll('.horse-card');
        horseCards.forEach(card => {
            card.classList.add('touch-feedback', 'no-select');
        });
        
        // ナビゲーションボタンにタッチフィードバックを追加
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.classList.add('touch-target', 'no-select');
        });
        
        console.log('✨ タッチフィードバックを設定しました');
    }
    
    // 片手操作ゾーンの設定
    setupThumbZone() {
        // モバイルデバイスの場合のみ実行
        if (window.innerWidth <= 768) {
            this.createThumbZone();
        }
    }
    
    createThumbZone() {
        // 既存の片手操作ゾーンがあれば削除
        const existingThumbZone = document.querySelector('.thumb-zone');
        if (existingThumbZone) {
            existingThumbZone.remove();
        }
        
        // 片手操作ゾーンを作成
        const thumbZone = document.createElement('div');
        thumbZone.className = 'thumb-zone';
        thumbZone.style.display = 'none'; // 初期状態では非表示
        
        // 重要なアクションボタンを追加
        const quickActions = [
            { text: '予測', action: () => this.quickPredict() },
            { text: '追加', action: () => this.quickAddHorse() },
            { text: '学習', action: () => this.quickLearn() },
            { text: '設定', action: () => this.toggleMobileMode() }
        ];
        
        quickActions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = 'btn touch-target';
            btn.textContent = action.text;
            btn.onclick = action.action;
            thumbZone.appendChild(btn);
        });
        
        document.body.appendChild(thumbZone);
        
        // 長押しでThumbZoneを表示/非表示
        let longPressTimer;
        document.addEventListener('touchstart', (e) => {
            longPressTimer = setTimeout(() => {
                this.toggleThumbZone();
            }, 1000);
        });
        
        document.addEventListener('touchend', () => {
            clearTimeout(longPressTimer);
        });
        
        console.log('👍 片手操作ゾーンを設定しました');
    }
    
    toggleThumbZone() {
        const thumbZone = document.querySelector('.thumb-zone');
        if (thumbZone) {
            thumbZone.style.display = thumbZone.style.display === 'none' ? 'flex' : 'none';
            this.triggerVibration();
            this.showNavigationFeedback('クイックアクション');
        }
    }
    
    // クイックアクション
    quickPredict() {
        const predictBtn = document.querySelector('button[onclick*=\"calculatePredictions\"]');
        if (predictBtn) {
            predictBtn.click();
            this.showNavigationFeedback('予測実行');
        }
    }
    
    quickAddHorse() {
        const addBtn = document.querySelector('button[onclick*=\"addHorse\"]');
        if (addBtn) {
            addBtn.click();
            this.showNavigationFeedback('馬を追加');
        }
    }
    
    quickLearn() {
        const learnBtn = document.querySelector('button[onclick*=\"processRaceResult\"]');
        if (learnBtn) {
            learnBtn.click();
            this.showNavigationFeedback('学習実行');
        }
    }
    
    toggleMobileMode() {
        const modeBtn = document.getElementById('modeToggle');
        if (modeBtn) {
            modeBtn.click();
            this.showNavigationFeedback('モード切り替え');
        }
    }
    
    // バイブレーションフィードバック
    setupVibrationFeedback() {
        // バイブレーション対応デバイスかチェック
        this.canVibrate = 'vibrate' in navigator;
        
        if (this.canVibrate) {
            console.log('📳 バイブレーションフィードバック対応');
        }
    }
    
    triggerVibration(pattern = [50]) {
        if (this.canVibrate) {
            navigator.vibrate(pattern);
        }
    }
    
    // 画面回転対応
    setupOrientationChange() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });
        
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    handleOrientationChange() {
        console.log('🔄 画面回転を検出しました');
        
        // 片手操作ゾーンの再調整
        const thumbZone = document.querySelector('.thumb-zone');
        if (thumbZone) {
            if (window.innerWidth <= 768) {
                thumbZone.style.display = 'flex';
            } else {
                thumbZone.style.display = 'none';
            }
        }
        
        // レイアウトの再計算
        this.recalculateLayout();
        this.showNavigationFeedback('画面回転対応');
    }
    
    handleResize() {
        // 片手操作ゾーンの表示切り替え
        const thumbZone = document.querySelector('.thumb-zone');
        if (thumbZone) {
            if (window.innerWidth <= 768) {
                // モバイル幅になったら片手操作ゾーンを使用可能に
                if (!thumbZone.style.display || thumbZone.style.display === 'none') {
                    thumbZone.style.display = 'none'; // 初期は非表示
                }
            } else {
                // デスクトップ幅になったら片手操作ゾーンを非表示
                thumbZone.style.display = 'none';
            }
        }
    }
    
    recalculateLayout() {
        // 強制的にレイアウトを再計算
        document.body.style.height = 'auto';
        document.body.offsetHeight; // リフロー強制実行
        
        // 必要に応じて追加の調整
        const container = document.querySelector('.container');
        if (container) {
            container.style.minHeight = `${window.innerHeight}px`;
        }
    }
    
    // ナビゲーションフィードバック表示
    showNavigationFeedback(message) {
        // 既存のフィードバック要素があれば削除
        const existing = document.querySelector('.navigation-feedback');
        if (existing) {
            existing.remove();
        }
        
        // フィードバック要素を作成
        const feedback = document.createElement('div');
        feedback.className = 'navigation-feedback';
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 14px;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        `;
        
        document.body.appendChild(feedback);
        
        // フェードイン
        setTimeout(() => {
            feedback.style.opacity = '1';
        }, 10);
        
        // 2秒後にフェードアウト
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.remove();
                }
            }, 300);
        }, 2000);
    }
    
    // ピンチズーム対応（今後の拡張用）
    setupPinchZoom() {
        // 今後の実装予定：表やグラフのピンチズーム機能
        console.log('🔍 ピンチズーム機能（今後実装予定）');
    }
    
    // 長押しメニュー対応（今後の拡張用）
    setupLongPressMenu() {
        // 今後の実装予定：コンテキストメニュー機能
        console.log('📋 長押しメニュー機能（今後実装予定）');
    }
}

// DOMContentLoaded時に初期化
document.addEventListener('DOMContentLoaded', () => {
    // モバイルデバイスの場合のみ初期化
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        window.mobileHandler = new MobileInteractionHandler();
    } else {
        console.log('🖥️ デスクトップデバイスのため、モバイルインタラクションハンドラーは無効です');
    }
});

// グローバル関数として公開（既存のコードとの互換性のため）
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}