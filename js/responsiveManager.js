/**
 * Phase 7: レスポンシブマネージャー
 * モバイル・タブレット最適化とタッチ操作対応
 */

class ResponsiveManager {
    constructor() {
        this.breakpoints = {
            mobile: 767,
            tablet: 1199,
            desktop: 1200
        };
        
        this.currentDevice = null;
        this.touchSupport = this.detectTouchSupport();
        this.isLandscape = window.innerWidth > window.innerHeight;
        
        // タッチ操作設定
        this.touchSettings = {
            swipeThreshold: 50,
            tapTimeout: 300,
            longPressTimeout: 500
        };
        
        // 現在のタッチ状態
        this.touchState = {
            startX: 0,
            startY: 0,
            startTime: 0,
            isLongPress: false,
            longPressTimer: null
        };
        
        // リサイズ処理の防止
        this.resizeTimeout = null;
        
        console.log('📱 レスポンシブマネージャー初期化', {
            touchSupport: this.touchSupport,
            currentDevice: this.getCurrentDevice(),
            isLandscape: this.isLandscape
        });
    }

    /**
     * レスポンシブシステムの初期化
     */
    initialize() {
        this.currentDevice = this.getCurrentDevice();
        this.applyDeviceOptimizations();
        this.setupEventListeners();
        this.addResponsiveStyles();
        this.optimizeForCurrentDevice();
        
        console.log('✅ レスポンシブシステム初期化完了');
    }

    /**
     * 現在のデバイスタイプを取得
     */
    getCurrentDevice() {
        const width = window.innerWidth;
        
        if (width <= this.breakpoints.mobile) {
            return 'mobile';
        } else if (width <= this.breakpoints.tablet) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    }

    /**
     * タッチサポートの検出
     */
    detectTouchSupport() {
        return 'ontouchstart' in window || 
               navigator.maxTouchPoints > 0 || 
               navigator.msMaxTouchPoints > 0;
    }

    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // リサイズイベント
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });

        // オリエンテーション変更
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });

        // タッチサポートがある場合のイベント
        if (this.touchSupport) {
            this.setupTouchEvents();
        }

        // フォーカス関連
        this.setupFocusEvents();
    }

    /**
     * リサイズ処理
     */
    handleResize() {
        const newDevice = this.getCurrentDevice();
        const newLandscape = window.innerWidth > window.innerHeight;
        
        if (newDevice !== this.currentDevice || newLandscape !== this.isLandscape) {
            console.log('📐 デバイス変更検知:', {
                previous: this.currentDevice,
                current: newDevice,
                landscapeChange: newLandscape !== this.isLandscape
            });
            
            this.currentDevice = newDevice;
            this.isLandscape = newLandscape;
            
            this.applyDeviceOptimizations();
            this.optimizeForCurrentDevice();
            this.notifyComponentsOfResize();
        }
    }

    /**
     * オリエンテーション変更処理
     */
    handleOrientationChange() {
        console.log('🔄 オリエンテーション変更');
        this.isLandscape = window.innerWidth > window.innerHeight;
        this.applyDeviceOptimizations();
        this.optimizeForCurrentDevice();
    }

    /**
     * タッチイベントの設定
     */
    setupTouchEvents() {
        document.addEventListener('touchstart', (e) => {
            this.handleTouchStart(e);
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            this.handleTouchMove(e);
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            this.handleTouchEnd(e);
        }, { passive: false });

        // スワイプ検出用
        document.addEventListener('touchcancel', (e) => {
            this.resetTouchState();
        });
    }

    /**
     * タッチ開始処理
     */
    handleTouchStart(e) {
        const touch = e.touches[0];
        this.touchState.startX = touch.clientX;
        this.touchState.startY = touch.clientY;
        this.touchState.startTime = Date.now();
        this.touchState.isLongPress = false;

        // 長押し検知
        this.touchState.longPressTimer = setTimeout(() => {
            this.touchState.isLongPress = true;
            this.handleLongPress(e);
        }, this.touchSettings.longPressTimeout);

        // 特定要素でのタッチ処理
        this.handleElementTouchStart(e);
    }

    /**
     * タッチ移動処理
     */
    handleTouchMove(e) {
        if (this.touchState.longPressTimer) {
            clearTimeout(this.touchState.longPressTimer);
            this.touchState.longPressTimer = null;
        }
        
        // スクロール処理の改善
        this.handleTouchScroll(e);
    }

    /**
     * タッチ終了処理
     */
    handleTouchEnd(e) {
        if (this.touchState.longPressTimer) {
            clearTimeout(this.touchState.longPressTimer);
            this.touchState.longPressTimer = null;
        }

        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - this.touchState.startX;
        const deltaY = touch.clientY - this.touchState.startY;
        const deltaTime = Date.now() - this.touchState.startTime;
        
        // スワイプ検出
        if (Math.abs(deltaX) > this.touchSettings.swipeThreshold || 
            Math.abs(deltaY) > this.touchSettings.swipeThreshold) {
            this.handleSwipe(deltaX, deltaY, deltaTime);
        }
        
        // タップ検出
        if (deltaTime < this.touchSettings.tapTimeout && 
            Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
            this.handleTap(e);
        }

        this.resetTouchState();
    }

    /**
     * スワイプ処理
     */
    handleSwipe(deltaX, deltaY, deltaTime) {
        const direction = Math.abs(deltaX) > Math.abs(deltaY) ? 
            (deltaX > 0 ? 'right' : 'left') : 
            (deltaY > 0 ? 'down' : 'up');
        
        console.log('👆 スワイプ検出:', direction, { deltaX, deltaY, deltaTime });
        
        // 候補カードのスワイプ処理
        this.handleCandidateCardSwipe(direction);
    }

    /**
     * タップ処理
     */
    handleTap(e) {
        const target = e.target.closest('.candidate-card, .chart-container, .metric-card');
        if (target) {
            this.handleElementTap(target, e);
        }
    }

    /**
     * 長押し処理
     */
    handleLongPress(e) {
        const target = e.target.closest('.candidate-card, .metric-card');
        if (target) {
            this.handleElementLongPress(target, e);
        }
    }

    /**
     * 要素固有のタッチ開始処理
     */
    handleElementTouchStart(e) {
        const target = e.target;
        
        // 候補カードのタッチフィードバック
        if (target.closest('.candidate-card')) {
            const card = target.closest('.candidate-card');
            card.classList.add('touch-active');
        }
        
        // ボタンのタッチフィードバック
        if (target.closest('button')) {
            const button = target.closest('button');
            button.classList.add('touch-active');
        }
    }

    /**
     * 要素タップ処理
     */
    handleElementTap(element, e) {
        // タッチフィードバック削除
        element.classList.remove('touch-active');
        
        // 候補カードのタップで詳細展開
        if (element.classList.contains('candidate-card')) {
            const horseNumber = element.dataset.horseNumber;
            if (horseNumber && window.candidateEvaluationVisualizer) {
                window.candidateEvaluationVisualizer.toggleCandidateDetails(parseInt(horseNumber));
            }
        }
    }

    /**
     * 要素長押し処理
     */
    handleElementLongPress(element, e) {
        console.log('👆 長押し検出:', element.className);
        
        // 候補カードの長押しでコンテキストメニュー
        if (element.classList.contains('candidate-card')) {
            this.showCandidateContextMenu(element, e);
        }
    }

    /**
     * 候補カードのコンテキストメニュー
     */
    showCandidateContextMenu(cardElement, e) {
        e.preventDefault();
        
        const menu = document.createElement('div');
        menu.className = 'touch-context-menu';
        menu.style.cssText = `
            position: fixed;
            top: ${e.changedTouches[0].clientY}px;
            left: ${e.changedTouches[0].clientX}px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            min-width: 150px;
        `;
        
        const horseNumber = cardElement.dataset.horseNumber;
        menu.innerHTML = `
            <div class="context-menu-item" onclick="responsiveManager.exportCandidateData(${horseNumber})">
                📤 データエクスポート
            </div>
            <div class="context-menu-item" onclick="responsiveManager.showCandidateDetails(${horseNumber})">
                🔍 詳細表示
            </div>
            <div class="context-menu-item" onclick="responsiveManager.hideCandidateContextMenu()">
                ❌ キャンセル
            </div>
        `;
        
        document.body.appendChild(menu);
        
        // 3秒後自動削除
        setTimeout(() => {
            this.hideCandidateContextMenu();
        }, 3000);
    }

    /**
     * コンテキストメニューの非表示
     */
    hideCandidateContextMenu() {
        const menu = document.querySelector('.touch-context-menu');
        if (menu) {
            menu.remove();
        }
    }

    /**
     * 候補カードのスワイプ処理
     */
    handleCandidateCardSwipe(direction) {
        const cards = document.querySelectorAll('.candidate-card');
        
        switch (direction) {
            case 'left':
                // 左スワイプで次の候補表示
                this.showNextCandidate(cards);
                break;
            case 'right':
                // 右スワイプで前の候補表示
                this.showPreviousCandidate(cards);
                break;
            case 'up':
                // 上スワイプで詳細表示
                this.expandAllCandidates();
                break;
            case 'down':
                // 下スワイプで詳細非表示
                this.collapseAllCandidates();
                break;
        }
    }

    /**
     * フォーカス関連イベント
     */
    setupFocusEvents() {
        // キーボードナビゲーション対応
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }

    /**
     * デバイス最適化の適用
     */
    applyDeviceOptimizations() {
        const body = document.body;
        
        // 既存のデバイスクラス削除
        body.classList.remove('device-mobile', 'device-tablet', 'device-desktop');
        body.classList.remove('orientation-landscape', 'orientation-portrait');
        
        // 新しいデバイスクラス追加
        body.classList.add(`device-${this.currentDevice}`);
        body.classList.add(`orientation-${this.isLandscape ? 'landscape' : 'portrait'}`);
        
        // タッチサポートクラス
        if (this.touchSupport) {
            body.classList.add('touch-supported');
        }
    }

    /**
     * 現在のデバイスに最適化
     */
    optimizeForCurrentDevice() {
        switch (this.currentDevice) {
            case 'mobile':
                this.optimizeForMobile();
                break;
            case 'tablet':
                this.optimizeForTablet();
                break;
            case 'desktop':
                this.optimizeForDesktop();
                break;
        }
    }

    /**
     * モバイル最適化
     */
    optimizeForMobile() {
        console.log('📱 モバイル最適化適用');
        
        // フォントサイズ調整
        document.documentElement.style.fontSize = '14px';
        
        // Chart.jsの設定調整
        if (window.Chart) {
            Chart.defaults.responsive = true;
            Chart.defaults.maintainAspectRatio = false;
        }
        
        // 候補カードの最適化
        this.optimizeCandidateCardsForMobile();
        
        // ダッシュボードレイアウト調整
        this.optimizeDashboardForMobile();
    }

    /**
     * タブレット最適化
     */
    optimizeForTablet() {
        console.log('📱 タブレット最適化適用');
        
        // フォントサイズ調整
        document.documentElement.style.fontSize = '15px';
        
        // 2列レイアウト適用
        this.optimizeForTwoColumn();
    }

    /**
     * デスクトップ最適化
     */
    optimizeForDesktop() {
        console.log('🖥️ デスクトップ最適化適用');
        
        // フォントサイズリセット
        document.documentElement.style.fontSize = '16px';
        
        // 3列レイアウト適用
        this.optimizeForThreeColumn();
    }

    /**
     * 候補カードのモバイル最適化
     */
    optimizeCandidateCardsForMobile() {
        const cards = document.querySelectorAll('.candidate-card');
        cards.forEach(card => {
            card.style.marginBottom = '10px';
            
            // メトリクスを2列に
            const metrics = card.querySelector('.key-metrics');
            if (metrics) {
                metrics.style.gridTemplateColumns = 'repeat(2, 1fr)';
            }
        });
    }

    /**
     * ダッシュボードのモバイル最適化
     */
    optimizeDashboardForMobile() {
        const dashboard = document.querySelector('.candidate-evaluation-dashboard');
        if (dashboard) {
            dashboard.style.margin = '10px';
            dashboard.style.padding = '15px';
        }
        
        // サマリー統計を2列に
        const summaryStats = document.querySelector('.summary-stats');
        if (summaryStats) {
            summaryStats.style.gridTemplateColumns = 'repeat(2, 1fr)';
        }
    }

    /**
     * 2列レイアウトの最適化
     */
    optimizeForTwoColumn() {
        const candidatesGrid = document.querySelector('.candidates-grid');
        if (candidatesGrid) {
            candidatesGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        }
    }

    /**
     * 3列レイアウトの最適化
     */
    optimizeForThreeColumn() {
        const candidatesGrid = document.querySelector('.candidates-grid');
        if (candidatesGrid) {
            candidatesGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        }
    }

    /**
     * コンポーネントにリサイズ通知
     */
    notifyComponentsOfResize() {
        // Chart.js のリサイズ
        if (window.Chart) {
            Chart.helpers.each(Chart.instances, (instance) => {
                instance.resize();
            });
        }
        
        // 他のコンポーネントにも通知
        if (window.portfolioDashboardInstance) {
            // ポートフォリオダッシュボードのリサイズ処理
        }
        
        console.log('📐 コンポーネントリサイズ通知完了');
    }

    /**
     * タッチ状態のリセット
     */
    resetTouchState() {
        this.touchState = {
            startX: 0,
            startY: 0,
            startTime: 0,
            isLongPress: false,
            longPressTimer: null
        };
        
        // タッチフィードバックの削除
        document.querySelectorAll('.touch-active').forEach(el => {
            el.classList.remove('touch-active');
        });
    }

    /**
     * レスポンシブスタイルの追加
     */
    addResponsiveStyles() {
        if (document.getElementById('responsive-styles')) return;

        const style = document.createElement('style');
        style.id = 'responsive-styles';
        style.textContent = `
            /* タッチフィードバック */
            .touch-active {
                background-color: rgba(0, 123, 255, 0.1) !important;
                transform: scale(0.98);
                transition: all 0.1s ease;
            }

            /* キーボードナビゲーション */
            .keyboard-navigation *:focus {
                outline: 2px solid #007bff !important;
                outline-offset: 2px !important;
            }

            /* モバイル最適化 */
            @media (max-width: 767px) {
                .device-mobile .candidate-evaluation-dashboard {
                    margin: 10px;
                    padding: 15px;
                }
                
                .device-mobile .evaluation-header {
                    flex-direction: column;
                    gap: 15px;
                }
                
                .device-mobile .evaluation-controls {
                    justify-content: center;
                }
                
                .device-mobile .summary-stats {
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                }
                
                .device-mobile .key-metrics {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .device-mobile .candidate-card {
                    margin-bottom: 10px;
                }
                
                .device-mobile .card-header {
                    padding: 12px 15px;
                }
                
                .device-mobile .horse-name {
                    font-size: 1rem;
                }
                
                .device-mobile .breakdown-item {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 5px;
                }
                
                .device-mobile .breakdown-bar {
                    width: 100%;
                    height: 6px;
                }
            }

            /* タブレット最適化 */
            @media (min-width: 768px) and (max-width: 1199px) {
                .device-tablet .candidates-grid {
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                }
                
                .device-tablet .summary-stats {
                    grid-template-columns: repeat(4, 1fr);
                }
            }

            /* デスクトップ最適化 */
            @media (min-width: 1200px) {
                .device-desktop .candidates-grid {
                    grid-template-columns: repeat(3, 1fr);
                }
            }

            /* 横画面対応 */
            @media (orientation: landscape) {
                .orientation-landscape .candidate-evaluation-dashboard {
                    max-height: 90vh;
                    overflow-y: auto;
                }
            }

            /* タッチサポート時のスタイル */
            .touch-supported .candidate-card {
                cursor: pointer;
                user-select: none;
            }
            
            .touch-supported button {
                min-height: 44px;
                min-width: 44px;
            }

            /* コンテキストメニュー */
            .touch-context-menu {
                animation: contextMenuFadeIn 0.2s ease;
            }
            
            .context-menu-item {
                padding: 8px 12px;
                cursor: pointer;
                border-radius: 4px;
                transition: background-color 0.2s;
            }
            
            .context-menu-item:hover {
                background-color: #f8f9fa;
            }
            
            @keyframes contextMenuFadeIn {
                from {
                    opacity: 0;
                    transform: scale(0.8);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * 候補データのエクスポート
     */
    exportCandidateData(horseNumber) {
        console.log('📤 候補データエクスポート:', horseNumber);
        this.hideCandidateContextMenu();
        
        if (window.candidateEvaluationVisualizer) {
            window.candidateEvaluationVisualizer.exportEvaluation();
        }
    }

    /**
     * 候補詳細の表示
     */
    showCandidateDetails(horseNumber) {
        console.log('🔍 候補詳細表示:', horseNumber);
        this.hideCandidateContextMenu();
        
        if (window.candidateEvaluationVisualizer) {
            window.candidateEvaluationVisualizer.toggleCandidateDetails(horseNumber);
        }
    }

    /**
     * 全候補の展開
     */
    expandAllCandidates() {
        console.log('📖 全候補展開');
        const cards = document.querySelectorAll('.candidate-card');
        cards.forEach(card => {
            const horseNumber = parseInt(card.dataset.horseNumber);
            if (horseNumber && window.candidateEvaluationVisualizer) {
                if (!window.candidateEvaluationVisualizer.expandedCandidates.has(horseNumber)) {
                    window.candidateEvaluationVisualizer.toggleCandidateDetails(horseNumber);
                }
            }
        });
    }

    /**
     * 全候補の折りたたみ
     */
    collapseAllCandidates() {
        console.log('📖 全候補折りたたみ');
        const cards = document.querySelectorAll('.candidate-card');
        cards.forEach(card => {
            const horseNumber = parseInt(card.dataset.horseNumber);
            if (horseNumber && window.candidateEvaluationVisualizer) {
                if (window.candidateEvaluationVisualizer.expandedCandidates.has(horseNumber)) {
                    window.candidateEvaluationVisualizer.toggleCandidateDetails(horseNumber);
                }
            }
        });
    }

    /**
     * 次の候補表示
     */
    showNextCandidate(cards) {
        // 実装: カード間のナビゲーション
        console.log('➡️ 次の候補表示');
    }

    /**
     * 前の候補表示
     */
    showPreviousCandidate(cards) {
        // 実装: カード間のナビゲーション
        console.log('⬅️ 前の候補表示');
    }

    /**
     * レスポンシブ情報の取得
     */
    getResponsiveInfo() {
        return {
            currentDevice: this.currentDevice,
            touchSupport: this.touchSupport,
            isLandscape: this.isLandscape,
            screenSize: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            breakpoints: this.breakpoints
        };
    }

    /**
     * システムの破棄
     */
    destroy() {
        console.log('🗑️ レスポンシブマネージャー破棄');
        
        // イベントリスナーの削除
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('orientationchange', this.handleOrientationChange);
        
        // タイマーのクリア
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        if (this.touchState.longPressTimer) {
            clearTimeout(this.touchState.longPressTimer);
        }
        
        // スタイルの削除
        const style = document.getElementById('responsive-styles');
        if (style) style.remove();
    }
}

// グローバル公開
window.ResponsiveManager = ResponsiveManager;

// 自動初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.responsiveManager = new ResponsiveManager();
        window.responsiveManager.initialize();
    });
} else {
    window.responsiveManager = new ResponsiveManager();
    window.responsiveManager.initialize();
}