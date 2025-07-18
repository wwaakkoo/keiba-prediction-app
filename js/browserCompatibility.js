/**
 * ブラウザ互換性チェック・対策システム
 * Safari/iOS対応とLocalStorage制限対策
 */

class BrowserCompatibility {
    constructor() {
        this.browserInfo = this.detectBrowser();
        this.storageInfo = this.checkStorageCapacity();
        this.compatibilityIssues = [];
        
        console.log('🌐 ブラウザ互換性チェック開始', this.browserInfo);
    }

    /**
     * ブラウザ検出
     */
    detectBrowser() {
        const ua = navigator.userAgent;
        const vendor = navigator.vendor;
        
        let browser = {
            name: 'unknown',
            version: 'unknown',
            isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
            isIOS: /iPad|iPhone|iPod/.test(ua),
            isSafari: /^((?!chrome|android).)*safari/i.test(ua),
            isPrivateMode: false
        };
        
        // ブラウザ特定
        if (ua.includes('Chrome') && !ua.includes('Edg')) {
            browser.name = 'Chrome';
            browser.version = ua.match(/Chrome\/(\d+)/)?.[1] || 'unknown';
        } else if (ua.includes('Firefox')) {
            browser.name = 'Firefox';
            browser.version = ua.match(/Firefox\/(\d+)/)?.[1] || 'unknown';
        } else if (ua.includes('Edg')) {
            browser.name = 'Edge';
            browser.version = ua.match(/Edg\/(\d+)/)?.[1] || 'unknown';
        } else if (browser.isSafari) {
            browser.name = 'Safari';
            browser.version = ua.match(/Version\/(\d+)/)?.[1] || 'unknown';
        }
        
        // プライベートモード検出（Safari/iOS）
        if (browser.isSafari || browser.isIOS) {
            this.detectPrivateMode().then(isPrivate => {
                browser.isPrivateMode = isPrivate;
                if (isPrivate) {
                    this.handlePrivateModeWarning();
                }
            });
        }
        
        return browser;
    }

    /**
     * プライベートモード検出（Safari用）
     */
    async detectPrivateMode() {
        try {
            // Safari プライベートモードでは LocalStorage の quota が非常に小さい
            if (this.browserInfo.isSafari || this.browserInfo.isIOS) {
                const testKey = '__private_mode_test__';
                const testData = new Array(1000).join('a'); // 約1KB
                
                localStorage.setItem(testKey, testData);
                localStorage.removeItem(testKey);
                
                return false; // 成功した場合は通常モード
            }
            
            // その他のブラウザでの検出
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                const estimate = await navigator.storage.estimate();
                return estimate.quota < 120000000; // 120MB以下なら疑わしい
            }
            
            return false;
        } catch (error) {
            // エラーが発生した場合はプライベートモードの可能性が高い
            return true;
        }
    }

    /**
     * ストレージ容量チェック
     */
    checkStorageCapacity() {
        let storageInfo = {
            available: true,
            quotaExceeded: false,
            estimatedQuota: 0,
            usedBytes: 0,
            remainingBytes: 0
        };

        try {
            // LocalStorage 可用性テスト
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            
            // 使用量計算（概算）
            let usedBytes = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    usedBytes += localStorage[key].length + key.length;
                }
            }
            
            storageInfo.usedBytes = usedBytes;
            
            // ブラウザ別の推定クォータ
            if (this.browserInfo.isSafari || this.browserInfo.isIOS) {
                storageInfo.estimatedQuota = 5 * 1024 * 1024; // Safari: 約5MB
            } else {
                storageInfo.estimatedQuota = 10 * 1024 * 1024; // その他: 約10MB
            }
            
            storageInfo.remainingBytes = storageInfo.estimatedQuota - storageInfo.usedBytes;
            
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                storageInfo.quotaExceeded = true;
                storageInfo.available = false;
            } else {
                console.error('❌ ストレージチェックエラー:', error);
                storageInfo.available = false;
            }
        }
        
        return storageInfo;
    }

    /**
     * 互換性チェック実行
     */
    runCompatibilityCheck() {
        console.log('🔍 互換性チェック実行中...');
        
        this.compatibilityIssues = [];
        
        // 1. LocalStorage 互換性
        this.checkLocalStorageCompatibility();
        
        // 2. JavaScript機能互換性
        this.checkJavaScriptFeatures();
        
        // 3. CSS機能互換性
        this.checkCSSFeatures();
        
        // 4. イベント処理互換性
        this.checkEventCompatibility();
        
        // 5. Safari特有の問題
        if (this.browserInfo.isSafari || this.browserInfo.isIOS) {
            this.checkSafariSpecificIssues();
        }
        
        // 結果レポート
        this.generateCompatibilityReport();
        
        return this.compatibilityIssues;
    }

    /**
     * LocalStorage互換性チェック
     */
    checkLocalStorageCompatibility() {
        try {
            // 基本的な読み書きテスト
            const testKey = '__compatibility_test__';
            const testData = { test: 'data', timestamp: Date.now() };
            
            localStorage.setItem(testKey, JSON.stringify(testData));
            const retrieved = JSON.parse(localStorage.getItem(testKey));
            localStorage.removeItem(testKey);
            
            if (!retrieved || retrieved.test !== 'data') {
                this.compatibilityIssues.push({
                    type: 'localStorage',
                    severity: 'critical',
                    message: 'LocalStorage の基本操作が正常に動作しません'
                });
            }
            
            // 容量チェック
            if (this.storageInfo.quotaExceeded) {
                this.compatibilityIssues.push({
                    type: 'localStorage',
                    severity: 'high',
                    message: 'LocalStorage の容量が不足しています'
                });
            } else if (this.storageInfo.remainingBytes < 1024 * 1024) { // 1MB未満
                this.compatibilityIssues.push({
                    type: 'localStorage',
                    severity: 'medium',
                    message: 'LocalStorage の残容量が少なくなっています'
                });
            }
            
        } catch (error) {
            this.compatibilityIssues.push({
                type: 'localStorage',
                severity: 'critical',
                message: `LocalStorage エラー: ${error.message}`
            });
        }
    }

    /**
     * JavaScript機能互換性チェック
     */
    checkJavaScriptFeatures() {
        const features = [
            { name: 'Promise', check: () => typeof Promise !== 'undefined' },
            { name: 'async/await', check: () => {
                try {
                    new Function('async () => {}');
                    return true;
                } catch (e) {
                    return false;
                }
            }},
            { name: 'CustomEvent', check: () => typeof CustomEvent !== 'undefined' },
            { name: 'JSON', check: () => typeof JSON !== 'undefined' },
            { name: 'localStorage', check: () => typeof localStorage !== 'undefined' },
            { name: 'fetch', check: () => typeof fetch !== 'undefined' }
        ];
        
        features.forEach(feature => {
            if (!feature.check()) {
                this.compatibilityIssues.push({
                    type: 'javascript',
                    severity: 'high',
                    message: `${feature.name} がサポートされていません`
                });
            }
        });
    }

    /**
     * CSS機能互換性チェック
     */
    checkCSSFeatures() {
        const testElement = document.createElement('div');
        const features = [
            { name: 'CSS Grid', property: 'display', value: 'grid' },
            { name: 'CSS Flexbox', property: 'display', value: 'flex' },
            { name: 'CSS Transform', property: 'transform', value: 'translateX(0)' },
            { name: 'CSS Transition', property: 'transition', value: 'all 0.3s' }
        ];
        
        features.forEach(feature => {
            testElement.style[feature.property] = feature.value;
            if (testElement.style[feature.property] !== feature.value) {
                this.compatibilityIssues.push({
                    type: 'css',
                    severity: 'medium',
                    message: `${feature.name} がサポートされていません`
                });
            }
        });
    }

    /**
     * イベント処理互換性チェック
     */
    checkEventCompatibility() {
        try {
            // CustomEvent のテスト
            const testEvent = new CustomEvent('test', { detail: { test: true } });
            if (!testEvent || !testEvent.detail) {
                this.compatibilityIssues.push({
                    type: 'event',
                    severity: 'high',
                    message: 'CustomEvent の詳細データ伝達が正常に動作しません'
                });
            }
            
            // addEventListener のテスト
            const testElement = document.createElement('div');
            let eventFired = false;
            
            testElement.addEventListener('test', () => {
                eventFired = true;
            });
            
            testElement.dispatchEvent(testEvent);
            
            if (!eventFired) {
                this.compatibilityIssues.push({
                    type: 'event',
                    severity: 'high',
                    message: 'イベントリスナーが正常に動作しません'
                });
            }
            
        } catch (error) {
            this.compatibilityIssues.push({
                type: 'event',
                severity: 'high',
                message: `イベント処理エラー: ${error.message}`
            });
        }
    }

    /**
     * Safari特有の問題チェック
     */
    checkSafariSpecificIssues() {
        // LocalStorage の制限チェック
        if (this.storageInfo.estimatedQuota < 10 * 1024 * 1024) {
            this.compatibilityIssues.push({
                type: 'safari',
                severity: 'medium',
                message: 'Safari では LocalStorage の容量制限が厳しく設定されています'
            });
        }
        
        // プライベートモードチェック
        if (this.browserInfo.isPrivateMode) {
            this.compatibilityIssues.push({
                type: 'safari',
                severity: 'high',
                message: 'プライベートモードではデータの永続化ができません'
            });
        }
        
        // iOS Safari の特殊な制限
        if (this.browserInfo.isIOS) {
            this.compatibilityIssues.push({
                type: 'safari',
                severity: 'low',
                message: 'iOS Safari では一部の操作でページリロードが必要な場合があります'
            });
        }
    }

    /**
     * プライベートモード警告表示
     */
    handlePrivateModeWarning() {
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            background: linear-gradient(45deg, #ff9800, #f57c00);
            color: white;
            padding: 15px;
            text-align: center;
            z-index: 50000;
            font-weight: bold;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        
        warning.innerHTML = `
            ⚠️ プライベートモード検出：データが保存されない可能性があります。
            通常モードでのご利用を推奨します。
            <button onclick="this.parentElement.remove()" style="
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 5px 10px;
                border-radius: 3px;
                margin-left: 15px;
                cursor: pointer;
            ">閉じる</button>
        `;
        
        document.body.appendChild(warning);
        
        // 10秒後に自動で閉じる
        setTimeout(() => {
            if (warning.parentNode) {
                warning.remove();
            }
        }, 10000);
    }

    /**
     * 互換性レポート生成
     */
    generateCompatibilityReport() {
        const criticalIssues = this.compatibilityIssues.filter(issue => issue.severity === 'critical');
        const highIssues = this.compatibilityIssues.filter(issue => issue.severity === 'high');
        
        console.log('📊 互換性チェック結果:', {
            browser: this.browserInfo,
            storage: this.storageInfo,
            issues: this.compatibilityIssues,
            summary: {
                critical: criticalIssues.length,
                high: highIssues.length,
                total: this.compatibilityIssues.length
            }
        });
        
        // 重大な問題がある場合はユーザーに通知
        if (criticalIssues.length > 0) {
            this.showCriticalIssueWarning(criticalIssues);
        } else if (highIssues.length > 0) {
            this.showCompatibilityNotice(highIssues);
        }
    }

    /**
     * 重大な問題の警告表示
     */
    showCriticalIssueWarning(issues) {
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 3px solid #f44336;
            border-radius: 10px;
            padding: 25px;
            max-width: 500px;
            z-index: 60000;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;
        
        warning.innerHTML = `
            <h3 style="color: #f44336; margin-bottom: 15px;">⚠️ 互換性の問題が検出されました</h3>
            <ul style="color: #333; margin-bottom: 20px;">
                ${issues.map(issue => `<li>${issue.message}</li>`).join('')}
            </ul>
            <p style="color: #666; font-size: 14px;">
                システムが正常に動作しない可能性があります。ブラウザの更新または別のブラウザの使用を推奨します。
            </p>
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="this.parentElement.remove()" style="
                    background: #f44336;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                ">理解しました</button>
            </div>
        `;
        
        // 背景オーバーレイ
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 59000;
        `;
        
        document.body.appendChild(overlay);
        document.body.appendChild(warning);
        
        overlay.onclick = () => {
            overlay.remove();
            warning.remove();
        };
    }

    /**
     * 互換性注意の表示
     */
    showCompatibilityNotice(issues) {
        const notice = document.createElement('div');
        notice.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #ff9800, #f57c00);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            max-width: 300px;
            z-index: 40000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            font-size: 14px;
        `;
        
        notice.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px;">🔧 互換性情報</div>
            <div style="margin-bottom: 10px;">
                ${issues.length}件の注意事項が検出されました。
            </div>
            <button onclick="this.parentElement.remove()" style="
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 5px 10px;
                border-radius: 3px;
                cursor: pointer;
                float: right;
            ">OK</button>
        `;
        
        document.body.appendChild(notice);
        
        // 15秒後に自動で閉じる
        setTimeout(() => {
            if (notice.parentNode) {
                notice.remove();
            }
        }, 15000);
    }

    /**
     * ストレージ使用量監視
     */
    startStorageMonitoring() {
        setInterval(() => {
            const updatedStorageInfo = this.checkStorageCapacity();
            
            // 容量が90%を超えた場合の警告
            const usagePercentage = (updatedStorageInfo.usedBytes / updatedStorageInfo.estimatedQuota) * 100;
            
            if (usagePercentage > 90) {
                this.showStorageWarning(usagePercentage);
            }
            
            this.storageInfo = updatedStorageInfo;
        }, 60000); // 1分間隔
    }

    /**
     * ストレージ警告表示
     */
    showStorageWarning(usagePercentage) {
        if (document.getElementById('storage-warning')) return; // 既に表示中
        
        const warning = document.createElement('div');
        warning.id = 'storage-warning';
        warning.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(45deg, #f44336, #d32f2f);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            max-width: 300px;
            z-index: 45000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            font-size: 14px;
        `;
        
        warning.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px;">💾 ストレージ容量警告</div>
            <div style="margin-bottom: 10px;">
                使用量: ${usagePercentage.toFixed(1)}%<br>
                古いデータの削除を推奨します。
            </div>
            <button onclick="investmentResultRecorder.clearOldData()" style="
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 5px 10px;
                border-radius: 3px;
                cursor: pointer;
                margin-right: 5px;
            ">削除</button>
            <button onclick="this.remove()" style="
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 5px 10px;
                border-radius: 3px;
                cursor: pointer;
            ">後で</button>
        `;
        
        document.body.appendChild(warning);
    }

    /**
     * 初期化・自動実行
     */
    initialize() {
        // 互換性チェック実行
        this.runCompatibilityCheck();
        
        // ストレージ監視開始
        this.startStorageMonitoring();
        
        // Safari/iOS特有の対策
        if (this.browserInfo.isSafari || this.browserInfo.isIOS) {
            this.applySafariCompatibilityFixes();
        }
        
        console.log('✅ ブラウザ互換性システム初期化完了');
    }

    /**
     * Safari互換性修正適用
     */
    applySafariCompatibilityFixes() {
        // より頻繁なデータ保存
        const originalSaveMethod = localStorage.setItem;
        localStorage.setItem = function(key, value) {
            try {
                originalSaveMethod.call(this, key, value);
            } catch (error) {
                if (error.name === 'QuotaExceededError') {
                    console.warn('⚠️ Safari ストレージ制限に達しました');
                    // 緊急時の古いデータクリア
                    if (window.investmentResultRecorder) {
                        window.investmentResultRecorder.clearOldData(7, true);
                        // 再試行
                        originalSaveMethod.call(this, key, value);
                    }
                }
                throw error;
            }
        };
        
        console.log('🍎 Safari互換性修正を適用しました');
    }
}

// グローバル公開
window.BrowserCompatibility = BrowserCompatibility;

// 自動初期化
window.addEventListener('DOMContentLoaded', () => {
    if (!window.browserCompatibility) {
        window.browserCompatibility = new BrowserCompatibility();
        window.browserCompatibility.initialize();
    }
});