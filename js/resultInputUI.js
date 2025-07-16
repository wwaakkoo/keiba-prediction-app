/**
 * Phase 7: 投資結果入力UI
 * 投資結果の入力インターフェースとInvestmentResultRecorderとの連携
 */

class ResultInputUI {
    constructor() {
        this.containerId = 'result-input-container';
        this.isVisible = false;
        this.currentRaceData = null;
        this.investmentInputs = [];
        this.payoutInputs = [];
        this.isRecording = false; // 重複実行防止フラグ
        
        // 投資結果記録システムとの連携
        this.recorder = window.investmentResultRecorder;
        
        console.log('📝 結果入力UI初期化完了');
    }

    /**
     * UI初期化
     */
    initialize() {
        this.createResultInputContainer();
        this.setupEventListeners();
        this.setupAutoDisplay();
        this.initializeTutorial();
        
        console.log('✅ 結果入力UI初期化完了');
    }
    
    /**
     * チュートリアルの初期化
     */
    initializeTutorial() {
        // 初回使用かチェック
        const hasUsedBefore = localStorage.getItem('resultInputUI_hasUsed');
        
        if (!hasUsedBefore) {
            // 3秒後にチュートリアルを表示
            setTimeout(() => {
                this.showTutorial();
            }, 3000);
        }
    }
    
    /**
     * チュートリアルの表示
     */
    showTutorial() {
        const tutorial = document.createElement('div');
        tutorial.id = 'result-input-tutorial';
        tutorial.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 20000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;
        
        tutorial.innerHTML = `
            <div style="
                background: white;
                border-radius: 15px;
                padding: 30px;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                position: relative;
            ">
                <button onclick="resultInputUI.closeTutorial()" style="
                    position: absolute;
                    top: 15px;
                    right: 20px;
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #666;
                ">×</button>
                
                <h2 style="color: #333; margin-bottom: 20px; text-align: center;">
                    🎉 投資結果入力システムへようこそ！
                </h2>
                
                <div style="margin-bottom: 25px;">
                    <h3 style="color: #444; margin-bottom: 10px;">📊 使い方の流れ</h3>
                    <ol style="color: #666; line-height: 1.8; padding-left: 20px;">
                        <li><strong>Kelly推奨確認</strong>：左側にKelly基準の推奨候補と投資額が表示されます</li>
                        <li><strong>実際の投資結果入力</strong>：右側に実際の投資額と配当額を入力</li>
                        <li><strong>ワンクリック適用</strong>：「🎯 Kelly推奨を適用」で簡単コピー</li>
                        <li><strong>結果記録</strong>：「📝 結果を記録」でデータ保存・分析開始</li>
                    </ol>
                </div>
                
                <div style="margin-bottom: 25px;">
                    <h3 style="color: #444; margin-bottom: 10px;">✨ 便利機能</h3>
                    <ul style="color: #666; line-height: 1.8; padding-left: 20px;">
                        <li><strong>リアルタイムROI計算</strong>：入力中に即座にROIが表示されます</li>
                        <li><strong>入力検証</strong>：異常値やエラーを自動でチェック</li>
                        <li><strong>自動バックアップ</strong>：データは自動でバックアップされます</li>
                        <li><strong>学習機能</strong>：記録したデータが即座に分析システムに反映</li>
                    </ul>
                </div>
                
                <div style="margin-bottom: 25px; padding: 15px; background: #f0f8ff; border-radius: 8px; border-left: 4px solid #2196F3;">
                    <h4 style="color: #1976D2; margin: 0 0 8px 0;">💡 プロティップ</h4>
                    <p style="color: #333; margin: 0; font-size: 14px; line-height: 1.6;">
                        投資額は円単位で入力し、配当がなかった場合は0を入力してください。
                        Kelly推奨と実績を比較して、次回の投資精度が向上します！
                    </p>
                </div>
                
                <div style="text-align: center;">
                    <button onclick="resultInputUI.closeTutorial()" style="
                        background: linear-gradient(45deg, #4CAF50, #45a049);
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 25px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: bold;
                        margin-right: 15px;
                    ">✅ 理解しました</button>
                    
                    <button onclick="resultInputUI.closeTutorial(false)" style="
                        background: #ddd;
                        color: #666;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 25px;
                        cursor: pointer;
                        font-size: 16px;
                    ">次回も表示</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(tutorial);
    }
    
    /**
     * チュートリアルを閉じる
     */
    closeTutorial(markAsUsed = true) {
        const tutorial = document.getElementById('result-input-tutorial');
        if (tutorial) {
            tutorial.remove();
        }
        
        if (markAsUsed) {
            localStorage.setItem('resultInputUI_hasUsed', 'true');
        }
    }

    /**
     * 結果入力コンテナの作成
     */
    createResultInputContainer() {
        const existingContainer = document.getElementById(this.containerId);
        if (existingContainer) {
            existingContainer.remove();
        }

        const container = document.createElement('div');
        container.id = this.containerId;
        container.className = 'result-input-panel';
        container.style.display = 'none';
        container.innerHTML = `
            <div class="result-input-header">
                <h3>📊 投資結果入力</h3>
                <div class="race-info">
                    <span id="currentRaceDisplay">レース情報を読み込み中...</span>
                </div>
                <button class="close-btn" onclick="resultInputUI.hideResultInput()">×</button>
            </div>
            
            <div class="result-input-content">
                <div class="kelly-recommendations-section">
                    <h4>💡 Kelly推奨候補</h4>
                    <div id="kellyRecommendationsDisplay">
                        <!-- Kelly推奨候補が表示される -->
                    </div>
                </div>
                
                <div class="actual-results-section">
                    <h4>💰 実際の投資結果</h4>
                    <div id="actualResultsInputs">
                        <!-- 投資結果入力フォームが表示される -->
                    </div>
                </div>
                
                <div class="quick-actions">
                    <button class="quick-btn" onclick="resultInputUI.applyKellyRecommendations()">
                        🎯 Kelly推奨を適用
                    </button>
                    <button class="quick-btn" onclick="resultInputUI.clearAllInputs()">
                        🗑️ 入力クリア
                    </button>
                </div>
            </div>
            
            <div class="result-input-actions">
                <button class="record-btn" onclick="resultInputUI.recordResults()">
                    📝 結果を記録
                </button>
                <button class="analysis-btn" onclick="resultInputUI.triggerAnalysis()">
                    📊 分析実行
                </button>
                <button class="cancel-btn" onclick="resultInputUI.hideResultInput()">
                    キャンセル
                </button>
            </div>
            
            <div class="result-input-status">
                <div id="inputStatus" class="status-display"></div>
            </div>
        `;

        // Kelly基準資金管理セクションの後に挿入
        const kellySection = document.getElementById('kelly-capital-management');
        if (kellySection) {
            kellySection.parentNode.insertBefore(container, kellySection.nextSibling);
        } else {
            document.body.appendChild(container);
        }

        this.addResultInputStyles();
    }

    /**
     * スタイルの追加
     */
    addResultInputStyles() {
        const existingStyles = document.getElementById('result-input-styles');
        if (existingStyles) return;

        const styles = document.createElement('style');
        styles.id = 'result-input-styles';
        styles.textContent = `
            .result-input-panel {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 15px;
                padding: 20px;
                margin: 20px 0;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                color: white;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            
            .result-input-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid rgba(255,255,255,0.2);
            }
            
            .result-input-header h3 {
                margin: 0;
                font-size: 1.5em;
            }
            
            .race-info {
                background: rgba(255,255,255,0.1);
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 0.9em;
            }
            
            .close-btn {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .close-btn:hover {
                background: rgba(255,255,255,0.3);
            }
            
            .result-input-content {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .kelly-recommendations-section,
            .actual-results-section {
                background: rgba(255,255,255,0.1);
                padding: 15px;
                border-radius: 10px;
            }
            
            .kelly-recommendations-section h4,
            .actual-results-section h4 {
                margin: 0 0 15px 0;
                font-size: 1.1em;
            }
            
            .kelly-recommendation-item {
                background: rgba(255,255,255,0.1);
                padding: 10px;
                border-radius: 8px;
                margin-bottom: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .kelly-recommendation-item:last-child {
                margin-bottom: 0;
            }
            
            .recommendation-info {
                display: flex;
                flex-direction: column;
            }
            
            .recommendation-name {
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .recommendation-details {
                font-size: 0.9em;
                opacity: 0.8;
            }
            
            .recommendation-amount {
                font-size: 1.1em;
                font-weight: bold;
                color: #4CAF50;
            }
            
            .result-input-row {
                display: grid;
                grid-template-columns: 2fr 1fr 1fr 1fr;
                gap: 10px;
                align-items: center;
                background: rgba(255,255,255,0.1);
                padding: 10px;
                border-radius: 8px;
                margin-bottom: 10px;
            }
            
            .result-input-row:last-child {
                margin-bottom: 0;
            }
            
            .candidate-name {
                font-weight: bold;
            }
            
            .result-input-row input {
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                border-radius: 5px;
                padding: 8px;
                color: white;
                text-align: center;
                font-size: 0.9em;
            }
            
            .result-input-row input::placeholder {
                color: rgba(255,255,255,0.7);
            }
            
            .result-input-row input:focus {
                outline: none;
                border-color: rgba(255,255,255,0.6);
                background: rgba(255,255,255,0.3);
            }
            
            .quick-actions {
                grid-column: 1 / -1;
                display: flex;
                gap: 10px;
                margin-top: 15px;
            }
            
            .quick-btn {
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                padding: 8px 15px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 0.9em;
                transition: all 0.3s ease;
            }
            
            .quick-btn:hover {
                background: rgba(255,255,255,0.3);
                transform: translateY(-2px);
            }
            
            .result-input-actions {
                display: flex;
                gap: 15px;
                justify-content: center;
                margin-bottom: 15px;
            }
            
            .record-btn {
                background: linear-gradient(45deg, #4CAF50, #45a049);
                border: none;
                color: white;
                padding: 12px 30px;
                border-radius: 25px;
                cursor: pointer;
                font-size: 1.1em;
                font-weight: bold;
                transition: all 0.3s ease;
            }
            
            .record-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(76,175,80,0.4);
            }
            
            .analysis-btn {
                background: linear-gradient(45deg, #2196F3, #1976D2);
                border: none;
                color: white;
                padding: 12px 30px;
                border-radius: 25px;
                cursor: pointer;
                font-size: 1.1em;
                font-weight: bold;
                transition: all 0.3s ease;
            }
            
            .analysis-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(33,150,243,0.4);
            }
            
            .cancel-btn {
                background: linear-gradient(45deg, #f44336, #d32f2f);
                border: none;
                color: white;
                padding: 12px 30px;
                border-radius: 25px;
                cursor: pointer;
                font-size: 1.1em;
                font-weight: bold;
                transition: all 0.3s ease;
            }
            
            .cancel-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(244,67,54,0.4);
            }
            
            .result-input-status {
                text-align: center;
                min-height: 30px;
            }
            
            .status-display {
                padding: 10px;
                border-radius: 10px;
                margin-top: 10px;
                font-weight: bold;
                transition: all 0.3s ease;
            }
            
            .status-success {
                background: rgba(76,175,80,0.2);
                color: #4CAF50;
            }
            
            .status-error {
                background: rgba(244,67,54,0.2);
                color: #f44336;
            }
            
            .status-warning {
                background: rgba(255,152,0,0.2);
                color: #ff9800;
            }
            
            .status-info {
                background: rgba(33,150,243,0.2);
                color: #2196F3;
            }
            
            /* レスポンシブ対応 */
            @media (max-width: 768px) {
                .result-input-content {
                    grid-template-columns: 1fr;
                }
                
                .result-input-row {
                    grid-template-columns: 1fr;
                    gap: 8px;
                }
                
                .result-input-actions {
                    flex-direction: column;
                    gap: 10px;
                }
                
                .result-input-actions button {
                    width: 100%;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // Kelly計算完了時の自動表示
        document.addEventListener('kellyCalculationComplete', (event) => {
            this.showResultInputForKellyResults(event.detail);
        });
        
        // 入力値の変更監視
        document.addEventListener('input', (event) => {
            if (event.target.closest('#result-input-container')) {
                this.onInputChange(event.target);
            }
        });
    }

    /**
     * 自動表示設定
     */
    setupAutoDisplay() {
        // Kelly基準資金管理の結果表示後に自動表示
        const checkKellyResults = () => {
            const kellyResults = localStorage.getItem('kellyPortfolioResults');
            if (kellyResults && !this.isVisible) {
                setTimeout(() => {
                    this.showResultInputForKellyResults(JSON.parse(kellyResults));
                }, 2000);
            }
        };
        
        // 定期的なチェック
        setInterval(checkKellyResults, 5000);
    }

    /**
     * 結果入力UIの表示
     */
    showResultInputForKellyResults(kellyResults) {
        this.currentRaceData = this.extractRaceData(kellyResults);
        this.displayKellyRecommendations(kellyResults);
        this.createResultInputForm(kellyResults);
        this.showResultInput();
        
        this.updateStatus('Kelly推奨結果を読み込みました。投資結果を入力してください。', 'info');
    }

    /**
     * レースデータの抽出
     */
    extractRaceData(kellyResults) {
        const raceData = {
            raceId: kellyResults.raceId || this.generateRaceId(),
            raceName: this.getCurrentRaceName(),
            raceDate: this.getCurrentRaceDate(),
            raceCourse: this.getCurrentRaceCourse(),
            kellyResults: kellyResults
        };
        
        return raceData;
    }

    /**
     * Kelly推奨の表示
     */
    displayKellyRecommendations(kellyResults) {
        const container = document.getElementById('kellyRecommendationsDisplay');
        if (!container) return;

        let html = '';
        
        if (kellyResults.candidates && kellyResults.candidates.length > 0) {
            kellyResults.candidates.forEach(candidate => {
                html += `
                    <div class="kelly-recommendation-item">
                        <div class="recommendation-info">
                            <div class="recommendation-name">${candidate.name || '候補' + candidate.id}</div>
                            <div class="recommendation-details">
                                Kelly比率: ${(candidate.kellyRatio * 100).toFixed(1)}% | 
                                期待値: ${candidate.expectedValue?.toFixed(2) || 'N/A'}
                            </div>
                        </div>
                        <div class="recommendation-amount">
                            ${candidate.allocation?.toFixed(0) || 0}円
                        </div>
                    </div>
                `;
            });
        } else {
            html = '<div class="no-recommendations">Kelly推奨候補がありません</div>';
        }

        container.innerHTML = html;
    }

    /**
     * 結果入力フォームの作成
     */
    createResultInputForm(kellyResults) {
        const container = document.getElementById('actualResultsInputs');
        if (!container) return;

        let html = '';
        
        // ヘッダー行
        html += `
            <div class="result-input-row" style="background: rgba(255,255,255,0.2); font-weight: bold;">
                <div>候補名</div>
                <div>投資額</div>
                <div>配当額</div>
                <div>結果</div>
            </div>
        `;
        
        // Kelly推奨候補の入力行
        if (kellyResults.candidates && kellyResults.candidates.length > 0) {
            kellyResults.candidates.forEach((candidate, index) => {
                html += `
                    <div class="result-input-row">
                        <div class="candidate-name">${candidate.name || '候補' + candidate.id}</div>
                        <input type="number" 
                               placeholder="投資額" 
                               value="${candidate.allocation?.toFixed(0) || ''}"
                               data-candidate-id="${candidate.id || index}"
                               data-type="investment"
                               class="investment-input">
                        <input type="number" 
                               placeholder="配当額" 
                               data-candidate-id="${candidate.id || index}"
                               data-type="payout"
                               class="payout-input">
                        <select data-candidate-id="${candidate.id || index}" 
                                data-type="result"
                                class="result-select">
                            <option value="">選択</option>
                            <option value="win">的中</option>
                            <option value="loss">外れ</option>
                        </select>
                    </div>
                `;
            });
        } else {
            html += '<div class="no-inputs">入力可能な候補がありません</div>';
        }

        container.innerHTML = html;
    }

    /**
     * 結果入力UIの表示/非表示
     */
    showResultInput() {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.style.display = 'block';
            this.isVisible = true;
            
            // スクロール位置を調整
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    hideResultInput() {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.style.display = 'none';
            this.isVisible = false;
        }
    }

    /**
     * Kelly推奨の適用
     */
    applyKellyRecommendations() {
        const kellyResults = this.currentRaceData?.kellyResults;
        if (!kellyResults || !kellyResults.candidates) {
            this.updateStatus('Kelly推奨データが見つかりません', 'error');
            return;
        }

        kellyResults.candidates.forEach(candidate => {
            const investmentInput = document.querySelector(`input[data-candidate-id="${candidate.id}"][data-type="investment"]`);
            if (investmentInput) {
                investmentInput.value = candidate.allocation?.toFixed(0) || 0;
            }
        });

        this.updateStatus('Kelly推奨投資額を適用しました', 'success');
    }

    /**
     * 入力のクリア
     */
    clearAllInputs() {
        const inputs = document.querySelectorAll('#actualResultsInputs input, #actualResultsInputs select');
        inputs.forEach(input => {
            input.value = '';
        });
        
        this.updateStatus('入力をクリアしました', 'info');
    }

    /**
     * 結果の安全な記録
     */
    recordResults() {
        // 重複実行防止
        if (this.isRecording) {
            this.updateStatus('⏳ 記録処理中です。お待ちください...', 'warning');
            return;
        }
        
        this.isRecording = true;
        
        try {
            // 記録ボタンを無効化
            const recordBtn = document.querySelector('.record-btn');
            if (recordBtn) {
                recordBtn.disabled = true;
                recordBtn.textContent = '📝 記録中...';
                recordBtn.style.opacity = '0.6';
            }
            
            const resultData = this.collectResultData();
            
            // データ収集でエラーが発生した場合
            if (!resultData.isValid) {
                this.resetRecordingState();
                return;
            }
            
            // 改善されたバリデーション実行
            if (!this.validateResultData(resultData)) {
                this.resetRecordingState();
                return;
            }
            
            // 投資結果記録システムに送信
            if (!this.recorder) {
                this.updateStatus('❌ 投資結果記録システムが利用できません', 'error');
                this.resetRecordingState();
                return;
            }
            
            // 記録実行
            const response = this.recorder.recordRaceResult(resultData);
            
            if (response && response.success) {
                this.updateStatus('✅ 投資結果を記録しました！', 'success');
                this.showRecordSummary(response.analysis);
                
                // 入力フィールドのスタイルをリセット
                this.resetInputStyles();
                
                // 5秒後にUIを非表示
                setTimeout(() => {
                    this.hideResultInput();
                    this.resetRecordingState();
                }, 5000);
            } else {
                const errorMessage = response ? response.error : '不明なエラーが発生しました';
                this.updateStatus(`❌ 記録に失敗しました: ${errorMessage}`, 'error');
                this.resetRecordingState();
            }
            
        } catch (error) {
            console.error('結果記録エラー:', error);
            
            // ユーザーフレンドリーなエラーメッセージ
            let userErrorMessage = '❌ 記録中にエラーが発生しました。';
            
            if (error.name === 'QuotaExceededError') {
                userErrorMessage = '❌ データ保存容量が不足しています。古いデータを削除してください。';
            } else if (error.message.includes('JSON')) {
                userErrorMessage = '❌ データ形式エラーが発生しました。入力内容を確認してください。';
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                userErrorMessage = '❌ ネットワークエラーが発生しました。接続を確認してください。';
            }
            
            this.updateStatus(userErrorMessage, 'error');
            this.resetRecordingState();
            
            // 開発者向け詳細ログ
            console.error('詳細エラー情報:', {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString(),
                resultData: resultData
            });
        }
    }
    
    /**
     * 記録状態のリセット
     */
    resetRecordingState() {
        this.isRecording = false;
        
        const recordBtn = document.querySelector('.record-btn');
        if (recordBtn) {
            recordBtn.disabled = false;
            recordBtn.textContent = '📝 結果を記録';
            recordBtn.style.opacity = '1';
        }
    }
    
    /**
     * 入力フィールドのスタイルリセット
     */
    resetInputStyles() {
        const inputs = document.querySelectorAll('.investment-input, .payout-input');
        inputs.forEach(input => {
            input.style.borderColor = '';
            input.style.backgroundColor = '';
        });
    }

    /**
     * 結果データの安全な収集
     */
    collectResultData() {
        const actualInvestments = [];
        const actualPayouts = [];
        const validationErrors = [];
        
        const investmentInputs = document.querySelectorAll('.investment-input');
        const payoutInputs = document.querySelectorAll('.payout-input');
        const resultSelects = document.querySelectorAll('.result-select');
        
        // 投資データの安全な収集
        investmentInputs.forEach((input, index) => {
            const candidateId = input.dataset.candidateId;
            const rawAmount = input.value;
            
            // 空の入力はスキップ
            if (!rawAmount || rawAmount.trim() === '') {
                return;
            }
            
            const validationResult = this.validateInvestmentAmount(rawAmount, index);
            
            if (validationResult.isValid) {
                actualInvestments.push({
                    candidateId: candidateId,
                    candidateName: this.getCandidateName(candidateId),
                    amount: validationResult.sanitizedValue,
                    ticketType: '単勝', // デフォルト
                    odds: this.getCandidateOdds(candidateId),
                    popularity: this.getCandidatePopularity(candidateId)
                });
                
                // 入力フィールドに正規化された値を再設定
                input.value = validationResult.sanitizedValue;
                input.style.borderColor = '#4CAF50'; // 成功色
            } else {
                validationErrors.push({
                    type: 'investment',
                    candidateId: candidateId,
                    candidateName: this.getCandidateName(candidateId),
                    error: validationResult.error
                });
                
                // エラー表示
                input.style.borderColor = '#f44336'; // エラー色
                input.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
            }
        });
        
        // 配当データの安全な収集
        payoutInputs.forEach((input, index) => {
            const candidateId = input.dataset.candidateId;
            const rawAmount = input.value;
            
            const validationResult = this.validatePayoutAmount(rawAmount, index);
            
            if (validationResult.isValid) {
                // 配当額が0でも記録する（外れた場合）
                actualPayouts.push({
                    candidateId: candidateId,
                    amount: validationResult.sanitizedValue
                });
                
                // 入力フィールドに正規化された値を再設定
                input.value = validationResult.sanitizedValue || '';
                input.style.borderColor = '#4CAF50'; // 成功色
            } else {
                validationErrors.push({
                    type: 'payout',
                    candidateId: candidateId,
                    candidateName: this.getCandidateName(candidateId),
                    error: validationResult.error
                });
                
                // エラー表示
                input.style.borderColor = '#f44336'; // エラー色
                input.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
            }
        });
        
        // エラーがある場合はエラー情報を返す
        if (validationErrors.length > 0) {
            const errorMessage = '入力エラーがあります：\n' +
                validationErrors.map(err => `・${err.candidateName}: ${err.error}`).join('\n');
            
            this.updateStatus(errorMessage, 'error');
            
            return {
                isValid: false,
                errors: validationErrors,
                message: errorMessage
            };
        }
        
        const resultData = {
            ...this.currentRaceData,
            actualInvestments: actualInvestments,
            actualPayouts: actualPayouts,
            isValid: true
        };
        
        // 最終的な整合性チェック
        const consistencyCheck = this.validateInvestmentPayoutConsistency(actualInvestments, actualPayouts);
        if (!consistencyCheck.isValid) {
            this.updateStatus(consistencyCheck.error, 'warning');
            resultData.warnings = [consistencyCheck.error];
        } else if (consistencyCheck.warning) {
            this.updateStatus(consistencyCheck.warning, 'warning');
            resultData.warnings = [consistencyCheck.warning];
        }
        
        return resultData;
    }

    /**
     * 結果データの安全な検証
     */
    validateResultData(resultData) {
        // 基本的なデータ存在チェック
        if (!resultData || typeof resultData !== 'object') {
            this.updateStatus('⚠️ 無効なデータ形式です', 'error');
            return false;
        }
        
        if (!resultData.actualInvestments || !Array.isArray(resultData.actualInvestments) || resultData.actualInvestments.length === 0) {
            this.updateStatus('⚠️ 投資額を入力してください', 'warning');
            return false;
        }
        
        if (!resultData.actualPayouts || !Array.isArray(resultData.actualPayouts)) {
            this.updateStatus('⚠️ 配当データが無効です', 'warning');
            return false;
        }
        
        // 投資額の詳細検証
        const invalidInvestments = [];
        resultData.actualInvestments.forEach((investment, index) => {
            const validationResult = this.validateInvestmentAmount(investment.amount, index);
            if (!validationResult.isValid) {
                invalidInvestments.push({
                    index: index,
                    candidateName: investment.candidateName || `候補${index + 1}`,
                    error: validationResult.error
                });
            }
        });
        
        if (invalidInvestments.length > 0) {
            const errorMessage = '⚠️ 投資額にエラーがあります：\n' + 
                invalidInvestments.map(inv => `・${inv.candidateName}: ${inv.error}`).join('\n');
            this.updateStatus(errorMessage, 'error');
            return false;
        }
        
        // 配当額の詳細検証
        const invalidPayouts = [];
        resultData.actualPayouts.forEach((payout, index) => {
            const validationResult = this.validatePayoutAmount(payout.amount, index);
            if (!validationResult.isValid) {
                invalidPayouts.push({
                    index: index,
                    candidateId: payout.candidateId || `候補${index + 1}`,
                    error: validationResult.error
                });
            }
        });
        
        if (invalidPayouts.length > 0) {
            const errorMessage = '⚠️ 配当額にエラーがあります：\n' + 
                invalidPayouts.map(payout => `・${payout.candidateId}: ${payout.error}`).join('\n');
            this.updateStatus(errorMessage, 'error');
            return false;
        }
        
        // 投資と配当の整合性チェック
        const consistencyCheck = this.validateInvestmentPayoutConsistency(resultData.actualInvestments, resultData.actualPayouts);
        if (!consistencyCheck.isValid) {
            this.updateStatus(`⚠️ ${consistencyCheck.error}`, 'warning');
            // 警告だけで続行可能
        }
        
        return true;
    }
    
    /**
     * 投資額の個別検証
     */
    validateInvestmentAmount(amount, index) {
        // null/undefinedチェック
        if (amount === null || amount === undefined || amount === '') {
            return { isValid: false, error: '投資額が未入力です' };
        }
        
        // 数値変換と検証
        const numAmount = this.safeParseFloat(amount);
        
        if (isNaN(numAmount)) {
            return { isValid: false, error: '投資額が数値ではありません' };
        }
        
        if (!isFinite(numAmount)) {
            return { isValid: false, error: '投資額が無限大です' };
        }
        
        if (numAmount < 0) {
            return { isValid: false, error: '投資額はマイナスにできません' };
        }
        
        if (numAmount === 0) {
            return { isValid: false, error: '投資額が0円です' };
        }
        
        // 上下限チェック
        const maxInvestment = 1000000; // 100万円
        const minInvestment = 100;     // 100円
        
        if (numAmount > maxInvestment) {
            return { isValid: false, error: `投資額が上限(${maxInvestment.toLocaleString()}円)を超えています` };
        }
        
        if (numAmount < minInvestment) {
            return { isValid: false, error: `投資額が下限(${minInvestment}円)を下回っています` };
        }
        
        // 小数点以下チェック（円は整数のみ）
        if (numAmount % 1 !== 0) {
            return { isValid: false, error: '投資額は整数で入力してください' };
        }
        
        return { isValid: true, sanitizedValue: numAmount };
    }
    
    /**
     * 配当額の個別検証
     */
    validatePayoutAmount(amount, index) {
        // null/undefinedチェック（配当は0でもOK）
        if (amount === null || amount === undefined || amount === '') {
            return { isValid: true, sanitizedValue: 0 }; // 配当なしは有効
        }
        
        // 数値変換と検証
        const numAmount = this.safeParseFloat(amount);
        
        if (isNaN(numAmount)) {
            return { isValid: false, error: '配当額が数値ではありません' };
        }
        
        if (!isFinite(numAmount)) {
            return { isValid: false, error: '配当額が無限大です' };
        }
        
        if (numAmount < 0) {
            return { isValid: false, error: '配当額はマイナスにできません' };
        }
        
        // 上限チェック
        const maxPayout = 100000000; // 1億円
        
        if (numAmount > maxPayout) {
            return { isValid: false, error: `配当額が上限(${maxPayout.toLocaleString()}円)を超えています` };
        }
        
        // 小数点以下チェック（円は整数のみ）
        if (numAmount % 1 !== 0) {
            return { isValid: false, error: '配当額は整数で入力してください' };
        }
        
        return { isValid: true, sanitizedValue: numAmount };
    }
    
    /**
     * 投資と配当の整合性チェック
     */
    validateInvestmentPayoutConsistency(investments, payouts) {
        // 投資した候補に対する配当チェック
        const investmentCandidates = new Set(investments.map(inv => inv.candidateId));
        const payoutCandidates = new Set(payouts.map(payout => payout.candidateId));
        
        const missingPayouts = [];
        investmentCandidates.forEach(candidateId => {
            if (!payoutCandidates.has(candidateId)) {
                missingPayouts.push(candidateId);
            }
        });
        
        if (missingPayouts.length > 0) {
            return { 
                isValid: false, 
                error: `投資した候補の配当が未入力です: ${missingPayouts.join(', ')}` 
            };
        }
        
        // 異常なROIチェック（参考情報）
        const suspiciousROIs = [];
        investments.forEach(investment => {
            const payout = payouts.find(p => p.candidateId === investment.candidateId);
            if (payout && investment.amount > 0) {
                const roi = ((payout.amount - investment.amount) / investment.amount) * 100;
                if (roi > 10000) { // 100倍以上のROIは異常
                    suspiciousROIs.push({ candidateId: investment.candidateId, roi: roi });
                }
            }
        });
        
        if (suspiciousROIs.length > 0) {
            const warning = `異常に高いROIが検出されました。入力値を確認してください。`;
            return { isValid: true, warning: warning };
        }
        
        return { isValid: true };
    }
    
    /**
     * 安全な数値変換
     */
    safeParseFloat(value) {
        // 文字列の正規化
        if (typeof value === 'string') {
            // 全角数字を半角に変換
            value = value.replace(/０-９/g, function(s) {
                return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
            });
            
            // カンマを除去
            value = value.replace(/,/g, '');
            
            // 空白を除去
            value = value.trim();
            
            // 円マークを除去
            value = value.replace(/円/g, '');
        }
        
        return parseFloat(value);
    }

    /**
     * 分析の実行
     */
    triggerAnalysis() {
        // まず結果を記録
        this.recordResults();
        
        // アクショナブルインサイトの更新
        setTimeout(() => {
            if (window.actionableInsightsManager) {
                window.actionableInsightsManager.refreshInsights();
            }
        }, 1000);
        
        this.updateStatus('分析を実行しています...', 'info');
    }

    /**
     * 記録サマリーの表示
     */
    showRecordSummary(analysis) {
        if (!analysis) return;
        
        const summary = `
            記録完了 | 
            投資額: ${analysis.summary.totalInvestment}円 | 
            配当: ${analysis.summary.totalPayout}円 | 
            ROI: ${analysis.summary.roi.toFixed(1)}%
        `;
        
        this.updateStatus(summary, 'success');
    }

    /**
     * 入力変更時の処理
     */
    onInputChange(input) {
        // リアルタイムで計算結果を更新
        this.updateCalculations();
    }

    /**
     * 計算結果の更新
     */
    updateCalculations() {
        const investments = document.querySelectorAll('.investment-input');
        const payouts = document.querySelectorAll('.payout-input');
        
        let totalInvestment = 0;
        let totalPayout = 0;
        
        investments.forEach(input => {
            totalInvestment += parseFloat(input.value) || 0;
        });
        
        payouts.forEach(input => {
            totalPayout += parseFloat(input.value) || 0;
        });
        
        const roi = totalInvestment > 0 ? ((totalPayout - totalInvestment) / totalInvestment) * 100 : 0;
        
        // 計算結果を表示（オプション）
        const statusEl = document.getElementById('inputStatus');
        if (statusEl && (totalInvestment > 0 || totalPayout > 0)) {
            statusEl.textContent = `現在: 投資 ${totalInvestment}円 | 配当 ${totalPayout}円 | ROI ${roi.toFixed(1)}%`;
            statusEl.className = 'status-display status-info';
        }
    }

    /**
     * ステータス更新
     */
    updateStatus(message, type = 'info') {
        const statusEl = document.getElementById('inputStatus');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = `status-display status-${type}`;
            
            // 自動クリア
            setTimeout(() => {
                if (statusEl.textContent === message) {
                    statusEl.textContent = '';
                    statusEl.className = 'status-display';
                }
            }, 5000);
        }
    }

    /**
     * ユーティリティメソッド
     */
    getCurrentRaceName() {
        const raceNameInput = document.getElementById('raceName');
        return raceNameInput ? raceNameInput.value : '不明レース';
    }

    getCurrentRaceDate() {
        const raceDateInput = document.getElementById('raceDate');
        return raceDateInput ? raceDateInput.value : new Date().toISOString().split('T')[0];
    }

    getCurrentRaceCourse() {
        const raceCourseSelect = document.getElementById('raceCourse');
        return raceCourseSelect ? raceCourseSelect.value : '不明コース';
    }

    getCandidateName(candidateId) {
        const kellyResults = this.currentRaceData?.kellyResults;
        if (kellyResults && kellyResults.candidates) {
            const candidate = kellyResults.candidates.find(c => c.id === candidateId);
            return candidate ? candidate.name : `候補${candidateId}`;
        }
        return `候補${candidateId}`;
    }

    getCandidateOdds(candidateId) {
        const kellyResults = this.currentRaceData?.kellyResults;
        if (kellyResults && kellyResults.candidates) {
            const candidate = kellyResults.candidates.find(c => c.id === candidateId);
            return candidate ? candidate.odds : 0;
        }
        return 0;
    }

    getCandidatePopularity(candidateId) {
        const kellyResults = this.currentRaceData?.kellyResults;
        if (kellyResults && kellyResults.candidates) {
            const candidate = kellyResults.candidates.find(c => c.id === candidateId);
            return candidate ? candidate.popularity : 0;
        }
        return 0;
    }

    generateRaceId() {
        return 'race_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * チュートリアルの手動表示
     */
    showHelpTutorial() {
        this.showTutorial();
    }
}

// グローバル公開
window.ResultInputUI = ResultInputUI;

// 投資履歴表示機能
function showInvestmentHistory() {
    const recorder = window.investmentResultRecorder;
    if (!recorder) {
        alert('投資結果記録システムが利用できません');
        return;
    }
    
    const statistics = recorder.getStatistics();
    const history = recorder.resultHistory.slice(-10); // 最新10件
    
    let historyHTML = `
        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 20px;">📊 投資履歴統計</h3>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5em; font-weight: bold; color: #1976d2;">${statistics.totalRaces}</div>
                    <div style="color: #666;">総レース数</div>
                </div>
                
                <div style="background: #f3e5f5; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5em; font-weight: bold; color: #7b1fa2;">${statistics.totalInvestment.toFixed(0)}円</div>
                    <div style="color: #666;">総投資額</div>
                </div>
                
                <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5em; font-weight: bold; color: ${statistics.totalProfit >= 0 ? '#2e7d32' : '#d32f2f'};">${statistics.totalProfit >= 0 ? '+' : ''}${statistics.totalProfit.toFixed(0)}円</div>
                    <div style="color: #666;">総損益</div>
                </div>
                
                <div style="background: #fff3e0; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5em; font-weight: bold; color: ${statistics.averageROI >= 0 ? '#ff9800' : '#d32f2f'};">${statistics.averageROI.toFixed(1)}%</div>
                    <div style="color: #666;">平均ROI</div>
                </div>
                
                <div style="background: #fce4ec; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5em; font-weight: bold; color: #c2185b;">${statistics.winRate.toFixed(1)}%</div>
                    <div style="color: #666;">勝率</div>
                </div>
            </div>
            
            <h4 style="color: #333; margin-bottom: 15px;">📋 最近の投資履歴</h4>
            <div style="max-height: 300px; overflow-y: auto;">
    `;
    
    if (history.length > 0) {
        history.reverse().forEach(record => {
            const profitColor = record.netProfit >= 0 ? '#2e7d32' : '#d32f2f';
            const profitIcon = record.netProfit >= 0 ? '📈' : '📉';
            
            historyHTML += `
                <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; margin-bottom: 10px; border-left: 4px solid ${profitColor};">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${record.raceName}</strong>
                            <span style="color: #666; font-size: 0.9em;">(${record.raceDate})</span>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: bold; color: ${profitColor};">
                                ${profitIcon} ${record.netProfit >= 0 ? '+' : ''}${record.netProfit.toFixed(0)}円
                            </div>
                            <div style="font-size: 0.9em; color: #666;">
                                ROI: ${record.roi.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    } else {
        historyHTML += '<div style="text-align: center; color: #666; padding: 20px;">履歴がありません</div>';
    }
    
    historyHTML += `
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="investmentResultRecorder.showExportMenu()" style="background: #2196F3; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                    📁 エクスポート
                </button>
                <button onclick="resultInputUI.showHelpTutorial()" style="background: #ff9800; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                    📖 使い方
                </button>
                <button onclick="this.parentElement.parentElement.remove()" style="background: #f44336; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    閉じる
                </button>
            </div>
        </div>
    `;
    
    // 履歴を表示
    const container = document.createElement('div');
    container.innerHTML = historyHTML;
    document.body.appendChild(container);
    
    // スクロール位置を調整
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 自動初期化
window.addEventListener('DOMContentLoaded', () => {
    if (!window.resultInputUI) {
        window.resultInputUI = new ResultInputUI();
        window.resultInputUI.initialize();
    }
});