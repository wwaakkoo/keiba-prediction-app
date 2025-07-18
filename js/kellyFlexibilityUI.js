/**
 * Kelly基準柔軟化UI
 * Kelly基準の設定変更とその影響を可視化するインターフェース
 */

class KellyFlexibilityUI {
    constructor() {
        this.containerId = 'kelly-flexibility-container';
        this.kellyManager = null;
        this.isInitialized = false;
        this.isRecalculating = false; // 再計算中フラグ
        
        console.log('🔧 Kelly基準柔軟化UI初期化');
    }

    /**
     * 初期化
     */
    initialize() {
        if (this.isInitialized) return;
        
        this.kellyManager = new KellyCapitalManager();
        this.createFlexibilityContainer();
        this.renderFlexibilitySettings();
        this.setupEventListeners();
        this.isInitialized = true;
        
        console.log('✅ Kelly基準柔軟化UI初期化完了');
    }

    /**
     * 柔軟化コンテナの作成
     */
    createFlexibilityContainer() {
        const existingContainer = document.getElementById(this.containerId);
        if (existingContainer) {
            existingContainer.remove();
        }

        const container = document.createElement('div');
        container.id = this.containerId;
        container.className = 'kelly-flexibility-dashboard';
        container.innerHTML = `
            <div class="flexibility-header">
                <h3>🔧 Kelly基準柔軟化設定</h3>
                <div class="flexibility-controls">
                    <button onclick="kellyFlexibilityUI.refreshSettings()" class="refresh-btn">
                        🔄 設定更新
                    </button>
                    <button onclick="kellyFlexibilityUI.manualRecalculation()" class="recalc-btn">
                        ⚡ 即座に再計算
                    </button>
                    <button onclick="kellyFlexibilityUI.exportSettings()" class="export-btn">
                        📤 設定エクスポート
                    </button>
                </div>
            </div>
            <div id="flexibility-content" class="flexibility-content">
                <!-- 柔軟化設定内容がここに動的生成される -->
            </div>
        `;

        // Kelly資金管理システムの後に挿入
        const kellyContainer = document.getElementById('kelly-capital-container');
        if (kellyContainer) {
            kellyContainer.parentNode.insertBefore(container, kellyContainer.nextSibling);
        } else {
            document.body.appendChild(container);
        }

        this.addFlexibilityStyles();
    }

    /**
     * 柔軟化設定の表示
     */
    renderFlexibilitySettings() {
        const contentDiv = document.getElementById('flexibility-content');
        if (!contentDiv) return;

        const settings = this.kellyManager.getFlexibilitySettings();
        
        contentDiv.innerHTML = `
            ${this.renderCurrentMode(settings)}
            ${this.renderModeSelection(settings)}
            ${this.renderCustomSettings(settings)}
            ${this.renderDynamicAdjustment(settings)}
            ${this.renderImpactPrediction(settings)}
        `;
    }

    /**
     * 現在のモード表示
     */
    renderCurrentMode(settings) {
        const currentMode = settings.availableModes.find(m => m.key === settings.currentMode);
        
        return `
            <div class="current-mode-section">
                <h4>📊 現在の基準</h4>
                <div class="current-mode-card">
                    <div class="mode-info">
                        <div class="mode-name">${currentMode.description}</div>
                        <div class="mode-details">
                            <span class="threshold-item">
                                <span class="threshold-label">Kelly閾値:</span>
                                <span class="threshold-value">${(settings.currentThresholds.minKellyThreshold * 100).toFixed(1)}%</span>
                            </span>
                            <span class="threshold-item">
                                <span class="threshold-label">期待値閾値:</span>
                                <span class="threshold-value">${settings.currentThresholds.optionalExpectedValueThreshold.toFixed(3)}</span>
                            </span>
                        </div>
                    </div>
                    <div class="mode-actions">
                        <button onclick="kellyFlexibilityUI.performDynamicCheck()" class="dynamic-check-btn">
                            🔄 動的調整チェック
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * モード選択の表示
     */
    renderModeSelection(settings) {
        return `
            <div class="mode-selection-section">
                <h4>⚙️ 基準モード選択</h4>
                <div class="mode-grid">
                    ${settings.availableModes.map(mode => `
                        <div class="mode-card ${mode.key === settings.currentMode ? 'active' : ''}" 
                             onclick="kellyFlexibilityUI.selectMode('${mode.key}')">
                            <div class="mode-header">
                                <div class="mode-title">${mode.description}</div>
                                ${mode.key === settings.currentMode ? '<div class="active-badge">現在</div>' : ''}
                            </div>
                            <div class="mode-thresholds">
                                <div class="threshold-row">
                                    <span class="threshold-label">Kelly:</span>
                                    <span class="threshold-value">${(mode.minKellyThreshold * 100).toFixed(1)}%</span>
                                </div>
                                <div class="threshold-row">
                                    <span class="threshold-label">期待値:</span>
                                    <span class="threshold-value">${mode.optionalExpectedValueThreshold.toFixed(3)}</span>
                                </div>
                            </div>
                            <div class="mode-impact" id="impact-${mode.key}">
                                <span class="impact-placeholder">クリックして影響を確認</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * カスタム設定の表示
     */
    renderCustomSettings(settings) {
        const customMode = settings.availableModes.find(m => m.key === 'customMode');
        
        return `
            <div class="custom-settings-section">
                <h4>🎛️ カスタム基準設定</h4>
                <div class="custom-settings-panel">
                    <div class="setting-group">
                        <label for="custom-kelly-threshold">Kelly閾値 (%)</label>
                        <input type="range" 
                               id="custom-kelly-threshold" 
                               min="0.1" 
                               max="2.0" 
                               step="0.1" 
                               value="${customMode.minKellyThreshold * 100}"
                               oninput="kellyFlexibilityUI.updateCustomSettings()">
                        <span class="range-value" id="kelly-threshold-value">${(customMode.minKellyThreshold * 100).toFixed(1)}%</span>
                    </div>
                    <div class="setting-group">
                        <label for="custom-expected-value">期待値閾値</label>
                        <input type="range" 
                               id="custom-expected-value" 
                               min="1.01" 
                               max="1.10" 
                               step="0.01" 
                               value="${customMode.optionalExpectedValueThreshold}"
                               oninput="kellyFlexibilityUI.updateCustomSettings()">
                        <span class="range-value" id="expected-value-value">${customMode.optionalExpectedValueThreshold.toFixed(3)}</span>
                    </div>
                    <div class="custom-actions">
                        <button onclick="kellyFlexibilityUI.applyCustomSettings()" class="apply-btn">
                            ✅ カスタム設定を適用
                        </button>
                        <button onclick="kellyFlexibilityUI.resetCustomSettings()" class="reset-btn">
                            🔄 リセット
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 動的調整設定の表示
     */
    renderDynamicAdjustment(settings) {
        return `
            <div class="dynamic-adjustment-section">
                <h4>🤖 動的調整設定</h4>
                <div class="dynamic-settings-panel">
                    <div class="setting-toggle">
                        <label>
                            <input type="checkbox" 
                                   id="enable-dynamic-adjustment"
                                   ${settings.dynamicAdjustment.enablePerformanceBasedAdjustment ? 'checked' : ''}
                                   onchange="kellyFlexibilityUI.toggleDynamicAdjustment()">
                            <span class="toggle-label">成績に基づく自動調整を有効化</span>
                        </label>
                    </div>
                    <div class="adjustment-sensitivity">
                        <label for="adjustment-sensitivity">調整感度</label>
                        <input type="range" 
                               id="adjustment-sensitivity" 
                               min="0.1" 
                               max="1.0" 
                               step="0.1" 
                               value="${settings.dynamicAdjustment.adjustmentSensitivity}"
                               oninput="kellyFlexibilityUI.updateDynamicSensitivity()">
                        <span class="range-value" id="sensitivity-value">${(settings.dynamicAdjustment.adjustmentSensitivity * 100).toFixed(0)}%</span>
                    </div>
                    <div class="dynamic-status" id="dynamic-status">
                        <span class="status-placeholder">動的調整状況をチェック中...</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 影響予測の表示
     */
    renderImpactPrediction(settings) {
        return `
            <div class="impact-prediction-section">
                <h4>📈 設定変更の影響予測</h4>
                <div class="impact-prediction-panel">
                    <div class="prediction-controls">
                        <select id="prediction-mode-select" onchange="kellyFlexibilityUI.updatePrediction()">
                            <option value="">モードを選択して影響を確認</option>
                            ${settings.availableModes.filter(m => m.key !== settings.currentMode).map(mode => `
                                <option value="${mode.key}">${mode.description}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="prediction-results" id="prediction-results">
                        <div class="prediction-placeholder">
                            モードを選択すると、投資機会の変化を予測します
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * モード選択処理
     */
    selectMode(mode) {
        console.log(`🔧 Kelly基準モード選択: ${mode}`);
        
        // 影響予測を表示
        this.showModeImpact(mode);
        
        // 確認ダイアログ
        const modeInfo = this.kellyManager.flexibilitySettings[mode];
        const hasActiveData = this.checkActiveData();
        const confirmMessage = `${modeInfo.description}に変更しますか？\n\nKelly閾値: ${(modeInfo.minKellyThreshold * 100).toFixed(1)}%\n期待値閾値: ${modeInfo.optionalExpectedValueThreshold.toFixed(3)}${hasActiveData ? '\n\n✅ 変更後、Kelly計算を自動実行します' : ''}`;
        
        if (confirm(confirmMessage)) {
            this.kellyManager.applyFlexibilityMode(mode);
            this.renderFlexibilitySettings();
            this.showMessage(`✅ ${modeInfo.description}を適用しました`, 'success');
            
            // 自動再計算の実行
            if (hasActiveData) {
                this.triggerAutoRecalculation();
            }
        }
    }

    /**
     * モード影響の表示
     */
    showModeImpact(mode) {
        const impact = this.kellyManager.predictFlexibilityImpact(mode);
        const impactElement = document.getElementById(`impact-${mode}`);
        
        if (impactElement && !impact.error) {
            impactElement.innerHTML = `
                <div class="impact-summary">
                    <div class="impact-change">
                        候補変化: ${impact.estimatedCandidateChange >= 0 ? '+' : ''}${impact.estimatedCandidateChange}件
                    </div>
                    <div class="impact-message">${impact.recommendation.message}</div>
                </div>
            `;
        }
    }

    /**
     * カスタム設定の更新
     */
    updateCustomSettings() {
        const kellyThreshold = parseFloat(document.getElementById('custom-kelly-threshold').value) / 100;
        const expectedValue = parseFloat(document.getElementById('custom-expected-value').value);
        
        document.getElementById('kelly-threshold-value').textContent = (kellyThreshold * 100).toFixed(1) + '%';
        document.getElementById('expected-value-value').textContent = expectedValue.toFixed(3);
        
        // リアルタイム影響予測
        this.kellyManager.setCustomFlexibilitySettings(kellyThreshold, expectedValue);
        const impact = this.kellyManager.predictFlexibilityImpact('customMode');
        
        // 影響表示の更新
        this.showModeImpact('customMode');
    }

    /**
     * カスタム設定の適用
     */
    applyCustomSettings() {
        this.kellyManager.applyFlexibilityMode('customMode');
        this.renderFlexibilitySettings();
        this.showMessage('✅ カスタム設定を適用しました', 'success');
        
        // 自動再計算の実行
        if (this.checkActiveData()) {
            this.triggerAutoRecalculation();
        }
    }

    /**
     * 動的調整チェック
     */
    performDynamicCheck() {
        try {
            const adjustment = this.kellyManager.performDynamicAdjustment();
            const statusElement = document.getElementById('dynamic-status');
            
            if (!statusElement) {
                return; // UI要素が存在しない場合は終了
            }
            
            if (adjustment) {
                statusElement.innerHTML = `
                    <div class="dynamic-recommendation">
                        <div class="recommendation-header">🔄 動的調整推奨</div>
                        <div class="recommendation-change">${adjustment.currentMode} → ${adjustment.suggestedMode}</div>
                        <div class="recommendation-reason">${adjustment.reason}</div>
                        <button onclick="kellyFlexibilityUI.applyDynamicRecommendation('${adjustment.suggestedMode}')" class="apply-recommendation-btn">
                            ✅ 推奨を適用
                        </button>
                    </div>
                `;
            } else {
                statusElement.innerHTML = `
                    <div class="dynamic-status-ok">
                        ✅ 現在の基準が適切です
                    </div>
                `;
            }
        } catch (error) {
            console.warn('⚠️ 動的調整チェックエラー:', error.message);
            const statusElement = document.getElementById('dynamic-status');
            if (statusElement) {
                statusElement.innerHTML = `
                    <div class="dynamic-status-error">
                        ⚠️ 動的調整チェックでエラーが発生しました
                    </div>
                `;
            }
        }
    }

    /**
     * 動的推奨の適用
     */
    applyDynamicRecommendation(suggestedMode) {
        this.kellyManager.applyFlexibilityMode(suggestedMode);
        this.renderFlexibilitySettings();
        this.showMessage(`🤖 動的調整により${this.kellyManager.flexibilitySettings[suggestedMode].description}を適用しました`, 'success');
        
        // 自動再計算の実行
        if (this.checkActiveData()) {
            this.triggerAutoRecalculation();
        }
    }

    /**
     * アクティブデータの存在チェック
     */
    checkActiveData() {
        // 予測データが存在するかチェック
        const hasPredictions = (typeof PredictionEngine !== 'undefined' && 
                               PredictionEngine.getCurrentPredictions && 
                               PredictionEngine.getCurrentPredictions().length > 0) ||
                              (typeof window !== 'undefined' && 
                               window.lastPredictions && 
                               window.lastPredictions.length > 0);
        
        return hasPredictions;
    }

    /**
     * 自動再計算の実行
     */
    triggerAutoRecalculation() {
        // 重複実行を防止
        if (this.isRecalculating) {
            console.log('⚠️ 既に再計算中のため、スキップします');
            return;
        }
        
        this.isRecalculating = true;
        console.log('🔄 Kelly基準変更による自動再計算開始');
        
        try {
            // Phase 4-6の順次実行
            this.showMessage('🔄 Kelly基準変更を反映中...', 'info');
            
            // 少し遅延を入れてUI更新を待つ
            setTimeout(() => {
                // Phase 4: 詳細分析
                if (typeof generateDetailedAnalysis === 'function') {
                    generateDetailedAnalysis();
                    console.log('✅ Phase 4: 詳細分析完了');
                }
                
                // Phase 5: 拡張推奨
                setTimeout(() => {
                    if (typeof generateEnhancedRecommendations === 'function') {
                        generateEnhancedRecommendations();
                        console.log('✅ Phase 5: 拡張推奨完了');
                    }
                    
                    // Phase 6: Kelly計算
                    setTimeout(() => {
                        if (typeof generateKellyPortfolio === 'function') {
                            generateKellyPortfolio();
                            console.log('✅ Phase 6: Kelly計算完了');
                            
                            // 候補評価プロセスの更新
                            setTimeout(() => {
                                if (typeof candidateEvaluationVisualizer !== 'undefined') {
                                    candidateEvaluationVisualizer.refreshEvaluation();
                                    console.log('✅ 候補評価プロセス更新完了');
                                }
                                
                                this.showMessage('✅ Kelly基準変更を反映しました', 'success');
                                this.isRecalculating = false; // フラグをリセット
                            }, 300);
                        }
                    }, 300);
                }, 300);
            }, 300);
            
        } catch (error) {
            console.error('❌ 自動再計算エラー:', error);
            this.showMessage('❌ 自動再計算に失敗しました', 'error');
            this.isRecalculating = false; // エラー時もフラグをリセット
        }
    }

    /**
     * 手動再計算実行
     */
    manualRecalculation() {
        if (!this.checkActiveData()) {
            this.showMessage('⚠️ 予測データがありません。まず予測を実行してください', 'warning');
            return;
        }
        
        this.triggerAutoRecalculation();
    }

    /**
     * 影響予測の更新
     */
    updatePrediction() {
        const selectElement = document.getElementById('prediction-mode-select');
        const resultsElement = document.getElementById('prediction-results');
        
        if (!selectElement || !resultsElement) {
            console.warn('⚠️ 予測UI要素が見つかりません');
            return;
        }
        
        const selectedMode = selectElement.value;
        
        if (!selectedMode) {
            resultsElement.innerHTML = `
                <div class="prediction-placeholder">
                    モードを選択すると、投資機会の変化を予測します
                </div>
            `;
            return;
        }
        
        try {
            // 影響予測を計算
            const impact = this.kellyManager.predictFlexibilityImpact(selectedMode);
            const modeInfo = this.kellyManager.flexibilitySettings[selectedMode];
            
            if (impact.error) {
                resultsElement.innerHTML = `
                    <div class="prediction-error">
                        ⚠️ 予測計算でエラーが発生しました: ${impact.error}
                    </div>
                `;
                return;
            }
            
            resultsElement.innerHTML = `
                <div class="prediction-result">
                    <div class="prediction-header">
                        <h5>📊 ${modeInfo.description}への変更影響</h5>
                    </div>
                    <div class="prediction-metrics">
                        <div class="metric-row">
                            <span class="metric-label">Kelly閾値変化:</span>
                            <span class="metric-value">${(this.kellyManager.constraints.minKellyThreshold * 100).toFixed(1)}% → ${(modeInfo.minKellyThreshold * 100).toFixed(1)}%</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">期待値閾値変化:</span>
                            <span class="metric-value">${this.kellyManager.constraints.optionalExpectedValueThreshold.toFixed(3)} → ${modeInfo.optionalExpectedValueThreshold.toFixed(3)}</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">候補数変化予測:</span>
                            <span class="metric-value ${impact.estimatedCandidateChange >= 0 ? 'positive' : 'negative'}">
                                ${impact.estimatedCandidateChange >= 0 ? '+' : ''}${impact.estimatedCandidateChange}件
                            </span>
                        </div>
                    </div>
                    <div class="prediction-recommendation">
                        <div class="recommendation-title">💡 推奨事項</div>
                        <div class="recommendation-text">${impact.recommendation.message}</div>
                        <div class="recommendation-reason">${impact.recommendation.reasoning || ''}</div>
                    </div>
                    <div class="prediction-actions">
                        <button onclick="kellyFlexibilityUI.selectMode('${selectedMode}')" class="apply-prediction-btn">
                            ✅ この設定を適用
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('❌ 影響予測計算エラー:', error);
            resultsElement.innerHTML = `
                <div class="prediction-error">
                    ❌ 影響予測の計算に失敗しました
                </div>
            `;
        }
    }

    /**
     * 設定の更新
     */
    refreshSettings() {
        this.renderFlexibilitySettings();
        this.showMessage('🔄 設定を更新しました', 'info');
    }

    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // 動的調整チェックを定期実行（エラーハンドリング付き）
        setInterval(() => {
            try {
                if (this.kellyManager && 
                    this.kellyManager.dynamicAdjustment && 
                    this.kellyManager.dynamicAdjustment.enablePerformanceBasedAdjustment) {
                    this.performDynamicCheck();
                }
            } catch (error) {
                console.warn('⚠️ 動的調整チェックエラー:', error.message);
            }
        }, 30000); // 30秒間隔
    }

    /**
     * メッセージ表示
     */
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `flexibility-message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        messageDiv.style.background = colors[type] || colors.info;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }

    /**
     * スタイルの追加
     */
    addFlexibilityStyles() {
        if (document.getElementById('flexibility-styles')) return;

        const style = document.createElement('style');
        style.id = 'flexibility-styles';
        style.textContent = `
            .kelly-flexibility-dashboard {
                margin: 20px 0;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 12px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }

            .flexibility-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #e9ecef;
            }

            .flexibility-header h3 {
                margin: 0;
                color: #495057;
            }

            .flexibility-controls {
                display: flex;
                gap: 10px;
            }

            .flexibility-controls button {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                background: #007bff;
                color: white;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .flexibility-controls button:hover {
                background: #0056b3;
                transform: translateY(-1px);
            }

            .mode-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }

            .mode-card {
                background: white;
                padding: 15px;
                border-radius: 8px;
                border: 2px solid #e9ecef;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
            }

            .mode-card:hover {
                border-color: #007bff;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }

            .mode-card.active {
                border-color: #28a745;
                background: #f8fff9;
            }

            .mode-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }

            .mode-title {
                font-weight: bold;
                color: #2c3e50;
            }

            .active-badge {
                background: #28a745;
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 0.8rem;
            }

            .mode-thresholds {
                margin-bottom: 10px;
            }

            .threshold-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
            }

            .threshold-label {
                color: #6c757d;
                font-size: 0.9rem;
            }

            .threshold-value {
                font-weight: bold;
                color: #007bff;
            }

            .current-mode-card {
                background: white;
                padding: 20px;
                border-radius: 8px;
                border: 2px solid #28a745;
                margin-bottom: 20px;
            }

            .mode-info {
                margin-bottom: 15px;
            }

            .mode-name {
                font-size: 1.2rem;
                font-weight: bold;
                color: #28a745;
                margin-bottom: 10px;
            }

            .mode-details {
                display: flex;
                gap: 20px;
            }

            .threshold-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
            }

            .custom-settings-panel {
                background: white;
                padding: 20px;
                border-radius: 8px;
                border: 2px solid #e9ecef;
            }

            .setting-group {
                margin-bottom: 20px;
            }

            .setting-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: bold;
                color: #495057;
            }

            .setting-group input[type="range"] {
                width: 100%;
                margin-bottom: 10px;
            }

            .range-value {
                font-weight: bold;
                color: #007bff;
                font-size: 1.1rem;
            }

            .custom-actions {
                display: flex;
                gap: 10px;
            }

            .apply-btn {
                background: #28a745;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
            }

            .reset-btn {
                background: #6c757d;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
            }

            .dynamic-settings-panel {
                background: white;
                padding: 20px;
                border-radius: 8px;
                border: 2px solid #e9ecef;
            }

            .setting-toggle {
                margin-bottom: 20px;
            }

            .toggle-label {
                margin-left: 10px;
                font-weight: bold;
                color: #495057;
            }

            .dynamic-recommendation {
                background: #fff3cd;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #ffeaa7;
            }

            .recommendation-header {
                font-weight: bold;
                color: #856404;
                margin-bottom: 10px;
            }

            .recommendation-change {
                font-size: 1.1rem;
                font-weight: bold;
                color: #007bff;
                margin-bottom: 5px;
            }

            .recommendation-reason {
                color: #6c757d;
                margin-bottom: 15px;
            }

            .apply-recommendation-btn {
                background: #ffc107;
                color: #212529;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
            }

            .impact-prediction-panel {
                background: white;
                padding: 20px;
                border-radius: 8px;
                border: 2px solid #e9ecef;
            }

            .prediction-controls {
                margin-bottom: 20px;
            }

            .prediction-controls select {
                width: 100%;
                padding: 10px;
                border: 1px solid #ced4da;
                border-radius: 6px;
                font-size: 1rem;
            }

            .impact-summary {
                background: #e7f3ff;
                padding: 10px;
                border-radius: 6px;
                border: 1px solid #bee5eb;
            }

            .impact-change {
                font-weight: bold;
                color: #007bff;
                margin-bottom: 5px;
            }

            .impact-message {
                color: #6c757d;
                font-size: 0.9rem;
            }

            .prediction-result {
                background: #f8fff9;
                padding: 20px;
                border-radius: 8px;
                border: 1px solid #d4edda;
            }

            .prediction-header h5 {
                margin: 0 0 15px 0;
                color: #155724;
            }

            .prediction-metrics {
                margin-bottom: 20px;
            }

            .metric-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                padding: 5px 0;
                border-bottom: 1px solid #e9ecef;
            }

            .metric-label {
                color: #6c757d;
                font-weight: normal;
            }

            .metric-value {
                font-weight: bold;
                color: #007bff;
            }

            .metric-value.positive {
                color: #28a745;
            }

            .metric-value.negative {
                color: #dc3545;
            }

            .prediction-recommendation {
                background: #fff3cd;
                padding: 15px;
                border-radius: 6px;
                margin-bottom: 15px;
            }

            .recommendation-title {
                font-weight: bold;
                color: #856404;
                margin-bottom: 8px;
            }

            .recommendation-text {
                color: #856404;
                margin-bottom: 5px;
            }

            .recommendation-reason {
                color: #6c757d;
                font-size: 0.9rem;
                font-style: italic;
            }

            .prediction-actions {
                text-align: center;
            }

            .apply-prediction-btn {
                background: #28a745;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                transition: background 0.3s ease;
            }

            .apply-prediction-btn:hover {
                background: #218838;
            }

            .prediction-error {
                background: #f8d7da;
                color: #721c24;
                padding: 15px;
                border-radius: 6px;
                border: 1px solid #f5c6cb;
                text-align: center;
            }

            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

// グローバル公開
window.KellyFlexibilityUI = KellyFlexibilityUI;

// 自動初期化
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (!window.kellyFlexibilityUI) {
            window.kellyFlexibilityUI = new KellyFlexibilityUI();
            window.kellyFlexibilityUI.initialize();
        }
    }, 1000);
});