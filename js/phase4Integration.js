/**
 * Phase 4 動的買い方変更機能の統合制御
 * 新機能を既存システムとシームレスに統合
 */

// グローバル変数
let dynamicBettingManager = null;
let performanceTracker = null;
let raceStrategyManager = null;
let strategyEnhancement = null;

/**
 * Phase 4システム初期化
 */
function initializePhase4Systems() {
    try {
        dynamicBettingManager = new DynamicBettingManager();
        performanceTracker = new PerformanceTracker();
        raceStrategyManager = new RaceStrategyManager();
        strategyEnhancement = new StrategyEnhancement();
        
        console.log('✅ Phase 4システムが正常に初期化されました');
        return true;
    } catch (error) {
        console.error('❌ Phase 4システムの初期化に失敗:', error);
        return false;
    }
}

/**
 * Phase 4動的戦略表示
 */
function showPhase4DynamicStrategy() {
    if (!initializePhase4Systems()) {
        showMessage('Phase 4システムの初期化に失敗しました', 'error');
        return;
    }

    // 馬データの取得（複数の方法を試行）
    let horses = null;
    let dataSource = '';
    
    // 方法1: HorseManagerから取得
    if (typeof HorseManager !== 'undefined' && HorseManager.getAllHorses) {
        horses = HorseManager.getAllHorses();
        dataSource = 'HorseManager';
    }
    
    // 方法2: 予測結果から取得
    if ((!horses || horses.length === 0) && typeof PredictionEngine !== 'undefined' && PredictionEngine.getCurrentPredictions) {
        horses = PredictionEngine.getCurrentPredictions();
        dataSource = 'PredictionEngine';
    }
    
    // 方法3: window.horsesから取得（フォールバック）
    if ((!horses || horses.length === 0) && window.horses) {
        horses = window.horses;
        dataSource = 'window.horses';
    }
    
    console.log(`🏇 馬データ取得結果: ${dataSource}から${horses ? horses.length : 0}頭`);
    
    if (!horses || horses.length === 0) {
        console.error('❌ 馬データが見つかりません。利用可能な取得方法:', {
            HorseManager: typeof HorseManager !== 'undefined',
            PredictionEngine: typeof PredictionEngine !== 'undefined',
            windowHorses: !!window.horses
        });
        showMessage('馬のデータが入力されていません。先に「馬のデータ一括入力」または「予測実行」を行ってください。', 'warning');
        return;
    }

    // 予測データの取得（既存の結果を優先使用）
    let predictions = null;
    
    // 方法1: 既に計算済みの予測結果があるかチェック
    if (typeof PredictionEngine !== 'undefined' && PredictionEngine.getCurrentPredictions) {
        predictions = PredictionEngine.getCurrentPredictions();
        if (predictions && predictions.length > 0) {
            console.log('✅ 既存の予測結果を使用:', predictions.length, '頭');
        }
    }
    
    // 方法2: 既存の予測がない場合のみ新しく計算
    if (!predictions || predictions.length === 0) {
        console.log('🔄 新しく予測計算を実行中...');
        try {
            predictions = PredictionEngine.calculatePredictions(horses);
            console.log('✅ 予測計算完了:', predictions ? predictions.length : 0, '頭');
        } catch (error) {
            console.error('❌ 予測計算エラー:', error);
            showMessage('予測計算でエラーが発生しました: ' + error.message, 'error');
            return;
        }
    }
    
    if (!predictions || predictions.length === 0) {
        console.error('❌ 予測データが空です');
        showMessage('予測データが取得できませんでした。先に「予測実行」ボタンを押してください。', 'warning');
        return;
    }

    // Phase 4分析実行
    executePhase4Analysis(horses, predictions);
    
    // 表示エリアを表示
    document.getElementById('phase4DynamicStrategy').style.display = 'block';
    
    // スクロール
    document.getElementById('phase4DynamicStrategy').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

/**
 * Phase 4分析実行
 */
function executePhase4Analysis(horses, predictions) {
    try {
        console.log('🔄 Phase 4分析開始:', {
            horses: horses ? horses.length : 0,
            predictions: predictions ? predictions.length : 0
        });
        
        // 期待値分析の実行
        const expectedValueAnalysis = ExpectedValueCalculator.analyzeRaceExpectedValue(predictions);
        console.log('📊 期待値分析結果:', expectedValueAnalysis);
        
        // analyzedHorsesの期待値をチェック
        if (expectedValueAnalysis.analyzedHorses) {
            console.log('🏇 分析済み馬の期待値一覧:');
            expectedValueAnalysis.analyzedHorses.forEach((horse, index) => {
                // 馬番を複数のソースから取得
                const horseNumber = horse.horse?.number || 
                                  horse.horse?.horseNumber || 
                                  horse.number || 
                                  horse.horseNumber || 
                                  (index + 1); // フォールバック: インデックス+1
                console.log(`${index + 1}. 馬番:${horseNumber} 期待値:${horse.expectedValue || 'undefined'} オッズ:${horse.horse?.odds || horse.estimatedOdds || 'undefined'}`);
            });
        }
        
        // 期待値1.0超えの馬がない場合の状況確認（データ操作は行わない）
        const hasValidBets = expectedValueAnalysis.analyzedHorses?.some(h => (h.expectedValue || 0) > 1.0);
        if (!hasValidBets) {
            console.info('ℹ️ 期待値1.0超えの馬がありません。このレースは見送り推奨となります。');
            console.info('📊 最高期待値:', Math.max(...(expectedValueAnalysis.analyzedHorses?.map(h => h.expectedValue || 0) || [0])).toFixed(3));
        }
        
        // レース戦略分析（期待値データを渡す）
        const marketConditions = {
            ...expectedValueAnalysis,
            analyzedHorses: expectedValueAnalysis.analyzedHorses || predictions
        };
        
        const strategyResult = raceStrategyManager.determineOptimalStrategy(
            { horses: horses, course: 'unknown', distance: 1600 },
            expectedValueAnalysis,
            marketConditions
        );
        
        // 動的投資額調整
        const bettingResult = dynamicBettingManager.calculateDynamicBetting(expectedValueAnalysis);
        console.log('💰 動的投資額調整結果:', bettingResult);
        
        // 統合学習用にグローバル変数に保存
        window.lastDynamicBettingResult = bettingResult;
        
        // パフォーマンス統計取得
        const performanceStats = performanceTracker.getOverallStats();
        
        // 結果表示
        displayRaceStrategyAnalysis(strategyResult);
        displayDynamicBettingResults(bettingResult);
        displayPerformanceTrackingResults(performanceStats);
        
        showMessage('Phase 4動的戦略分析が完了しました', 'success');
        
    } catch (error) {
        console.error('Phase 4分析エラー:', error);
        showMessage('Phase 4分析でエラーが発生しました: ' + error.message, 'error');
    }
}

/**
 * レース戦略分析結果表示（強化版）
 */
function displayRaceStrategyAnalysis(strategyResult) {
    const container = document.getElementById('raceStrategyAnalysis');
    
    // 戦略UI情報の生成
    const strategyUI = strategyEnhancement ? 
        strategyEnhancement.generateStrategyUI(strategyResult.strategy, strategyResult.confidence) :
        { category: { name: '標準戦略', color: '#ff9800', icon: '⚖️' } };
    
    const html = `
        <div style="background: white; border-radius: 8px; padding: 15px; border: 1px solid #ddd;">
            <h4 style="color: #e65100; margin-bottom: 15px;">🏁 レース戦略分析</h4>
            
            <!-- 戦略カテゴリ表示 -->
            <div style="background: linear-gradient(135deg, ${strategyUI.category.color}15, ${strategyUI.category.color}05); border: 1px solid ${strategyUI.category.color}; border-radius: 8px; padding: 12px; margin-bottom: 15px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.5em;">${strategyUI.category.icon}</span>
                    <div>
                        <div style="font-weight: bold; color: ${strategyUI.category.color}; font-size: 1.1em;">
                            ${strategyUI.category.name}
                        </div>
                        <div style="color: #666; font-size: 0.9em;">
                            ${strategyUI.category.description}
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px;">
                <div style="background: #f3e5f5; padding: 10px; border-radius: 6px;">
                    <div style="font-weight: bold; color: #7b1fa2;">レースタイプ</div>
                    <div style="font-size: 1.1em;">${getRaceTypeLabel(strategyResult.raceType)}</div>
                </div>
                <div style="background: #e8f5e8; padding: 10px; border-radius: 6px;">
                    <div style="font-weight: bold; color: #2e7d32;">推奨戦略</div>
                    <div style="font-size: 1.1em;">${getStrategyLabel(strategyResult.strategy.focus)}</div>
                </div>
                <div style="background: #e3f2fd; padding: 10px; border-radius: 6px;">
                    <div style="font-weight: bold; color: #1976d2;">戦略信頼度</div>
                    <div style="font-size: 1.1em;">${strategyResult.confidence.toFixed(1)}%</div>
                </div>
                <div style="background: #fff3e0; padding: 10px; border-radius: 6px;">
                    <div style="font-weight: bold; color: #f57c00;">リスクレベル</div>
                    <div style="font-size: 1.1em;">${getRiskLevelLabel(strategyResult.strategy.riskLevel)}</div>
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <h5 style="color: #e65100; margin-bottom: 8px;">📋 戦略根拠</h5>
                <ul style="margin: 0; padding-left: 20px;">
                    ${strategyResult.reasoning.map(reason => `<li>${reason}</li>`).join('')}
                </ul>
            </div>
            
            <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; border-left: 3px solid #ff9800;">
                <strong>推奨馬券種:</strong> ${strategyResult.strategy.betTypes.join(', ')} | 
                <strong>最大買い目数:</strong> ${strategyResult.strategy.maxBets}点 |
                <strong>馬券単位上限:</strong> ${(strategyResult.strategy.maxBetPerHorse * 100).toFixed(1)}%
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * 動的投資額調整結果表示
 */
function displayDynamicBettingResults(bettingResult) {
    const container = document.getElementById('dynamicBettingResults');
    
    const html = `
        <div style="background: white; border-radius: 8px; padding: 15px; border: 1px solid #ddd;">
            <h4 style="color: #e65100; margin-bottom: 15px;">💰 動的投資額調整結果</h4>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 15px;">
                <div style="background: #e8f5e8; padding: 8px; border-radius: 6px; text-align: center;">
                    <div style="font-weight: bold; color: #2e7d32;">総投資額</div>
                    <div style="font-size: 1.2em; color: #1b5e20;">${bettingResult.totalAmount.toLocaleString()}円</div>
                </div>
                <div style="background: #e3f2fd; padding: 8px; border-radius: 6px; text-align: center;">
                    <div style="font-weight: bold; color: #1976d2;">投資戦略</div>
                    <div style="font-size: 1.1em;">${getStrategyLabel(bettingResult.strategy)}</div>
                </div>
                <div style="background: #fff3e0; padding: 8px; border-radius: 6px; text-align: center;">
                    <div style="font-weight: bold; color: #f57c00;">リスクレベル</div>
                    <div style="font-size: 1.1em;">${getRiskLevelLabel(bettingResult.riskLevel)}</div>
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <h5 style="color: #e65100; margin-bottom: 8px;">🎯 推奨買い目</h5>
                ${bettingResult.recommendations.length > 0 ? 
                    generateBettingRecommendationsTable(bettingResult.recommendations) :
                    '<div style="text-align: center; color: #666; padding: 20px;">推奨買い目がありません（見送り推奨）</div>'
                }
            </div>
            
            <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; border-left: 3px solid #4caf50;">
                <strong>判定根拠:</strong> ${bettingResult.reasoning}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * 買い目推奨テーブル生成
 */
function generateBettingRecommendationsTable(recommendations) {
    return `
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
            <thead>
                <tr style="background: #f5f5f5;">
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">馬券種</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">馬名</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">投資額</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">期待値</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">信頼度</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">理由</th>
                </tr>
            </thead>
            <tbody>
                ${recommendations.map(rec => `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;">${getBetTypeLabel(rec.type)}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${getHorseDisplayName(rec)}</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${rec.amount.toLocaleString()}円</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: ${rec.expectedValue >= 1.3 ? '#2e7d32' : rec.expectedValue >= 1.1 ? '#f57c00' : '#d32f2f'};">${rec.expectedValue.toFixed(2)}</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${rec.confidence.toFixed(1)}%</td>
                        <td style="padding: 8px; border: 1px solid #ddd; font-size: 0.8em;">${rec.reason}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

/**
 * パフォーマンス追跡結果表示
 */
function displayPerformanceTrackingResults(performanceStats) {
    const container = document.getElementById('performanceTrackingResults');
    
    if (!performanceStats || performanceStats.totalRaces === 0) {
        container.innerHTML = `
            <div style="background: white; border-radius: 8px; padding: 15px; border: 1px solid #ddd;">
                <h4 style="color: #e65100; margin-bottom: 15px;">📊 パフォーマンス追跡</h4>
                <div style="text-align: center; color: #666; padding: 20px;">
                    📝 まだレース履歴がありません<br>
                    <small>レース結果を記録すると成績分析が表示されます</small>
                </div>
            </div>
        `;
        return;
    }
    
    const html = `
        <div style="background: white; border-radius: 8px; padding: 15px; border: 1px solid #ddd;">
            <h4 style="color: #e65100; margin-bottom: 15px;">📊 パフォーマンス追跡</h4>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-bottom: 15px;">
                <div style="background: #e8f5e8; padding: 8px; border-radius: 6px; text-align: center;">
                    <div style="font-weight: bold; color: #2e7d32;">総レース数</div>
                    <div style="font-size: 1.2em;">${performanceStats.totalRaces}</div>
                </div>
                <div style="background: ${performanceStats.overallROI >= 0 ? '#e8f5e8' : '#ffebee'}; padding: 8px; border-radius: 6px; text-align: center;">
                    <div style="font-weight: bold; color: ${performanceStats.overallROI >= 0 ? '#2e7d32' : '#d32f2f'};">総合ROI</div>
                    <div style="font-size: 1.2em; color: ${performanceStats.overallROI >= 0 ? '#1b5e20' : '#c62828'};">${performanceStats.overallROI.toFixed(1)}%</div>
                </div>
                <div style="background: #e3f2fd; padding: 8px; border-radius: 6px; text-align: center;">
                    <div style="font-weight: bold; color: #1976d2;">平均的中率</div>
                    <div style="font-size: 1.2em;">${performanceStats.averageHitRate.toFixed(1)}%</div>
                </div>
                <div style="background: #f3e5f5; padding: 8px; border-radius: 6px; text-align: center;">
                    <div style="font-weight: bold; color: #7b1fa2;">収益レース率</div>
                    <div style="font-size: 1.2em;">${performanceStats.profitableRaceRate.toFixed(1)}%</div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="background: #f8f9fa; padding: 10px; border-radius: 6px;">
                    <h6 style="color: #2e7d32; margin-bottom: 8px;">💰 収支サマリー</h6>
                    <div>総投資: ${performanceStats.totalInvestment?.toLocaleString() || 0}円</div>
                    <div>総回収: ${performanceStats.totalReturn?.toLocaleString() || 0}円</div>
                    <div>純利益: <span style="color: ${performanceStats.netProfit >= 0 ? '#2e7d32' : '#d32f2f'};">${performanceStats.netProfit?.toLocaleString() || 0}円</span></div>
                </div>
                <div style="background: #f8f9fa; padding: 10px; border-radius: 6px;">
                    <h6 style="color: #1976d2; margin-bottom: 8px;">📈 成績推移</h6>
                    ${performanceStats.recentTrend ? `
                        <div>直近の傾向: <span style="color: ${getTrendColor(performanceStats.recentTrend.trend)};">${getTrendLabel(performanceStats.recentTrend.trend)}</span></div>
                        <div>直近平均ROI: ${performanceStats.recentTrend.averageROI.toFixed(1)}%</div>
                    ` : '<div>データ蓄積中...</div>'}
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * ユーティリティ関数群
 */
function getRaceTypeLabel(type) {
    const labels = {
        'power_race': '実力型',
        'competitive_race': '混戦型',
        'upset_prone': '荒れ型',
        'solid_race': '堅実型',
        'difficult_race': '難解型',
        'standard_race': '標準型'
    };
    return labels[type] || type;
}

function getStrategyLabel(strategy) {
    const labels = {
        'favorite': '本命重視',
        'multiple': '複数馬分散',
        'value': '価値重視',
        'favorite_combo': '本命組み合わせ',
        'minimal': '最小リスク',
        'balanced': 'バランス型',
        'aggressive_focus': '積極集中',
        'balanced_multi': '分散バランス',
        'conservative_selective': '保守選択',
        'minimal_risk': '最小リスク'
    };
    return labels[strategy] || strategy;
}

function getRiskLevelLabel(level) {
    const labels = {
        'very_low': '超低',
        'low': '低',
        'medium': '中',
        'high': '高',
        'very_high': '超高'
    };
    return labels[level] || level;
}

function getBetTypeLabel(type) {
    const labels = {
        'place': '複勝',
        'win': '単勝',
        'wide': 'ワイド',
        'exacta': '馬連',
        'trifecta': '3連複'
    };
    return labels[type] || type;
}

function getHorseDisplayName(rec) {
    if (rec.horses && rec.horses.length > 1) {
        // ワイドの場合：馬名と馬番を表示
        return rec.horses.map(h => {
            const number = h.number || h.horseNumber || '?';
            return `${h.name || '馬名不明'} (${number}番)`;
        }).join(' - ');
    } else if (rec.horse) {
        // 単一馬の場合：馬名と馬番を表示
        const number = rec.horse.number || rec.horse.horseNumber || '?';
        const name = rec.horse.name || '馬名不明';
        return `${name} (${number}番)`;
    }
    return '不明';
}

function getTrendColor(trend) {
    const colors = {
        'improving': '#2e7d32',
        'stable': '#f57c00',
        'declining': '#d32f2f'
    };
    return colors[trend] || '#666';
}

function getTrendLabel(trend) {
    const labels = {
        'improving': '改善中',
        'stable': '安定',
        'declining': '下降中'
    };
    return labels[trend] || trend;
}

/**
 * メッセージ表示ヘルパー
 */
function showMessage(message, type = 'info') {
    const messageElement = document.getElementById('appMessage');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.style.background = type === 'error' ? '#ffcdd2' : 
                                        type === 'warning' ? '#fff3c4' :
                                        type === 'success' ? '#c8e6c9' : '#e1f5fe';
        messageElement.style.color = type === 'error' ? '#c62828' :
                                    type === 'warning' ? '#f57c00' :
                                    type === 'success' ? '#2e7d32' : '#0277bd';
        messageElement.style.display = 'block';
        
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 5000);
    }
}

/**
 * Phase 5キャリブレーション分析レポート表示
 */
function showPhase5CalibrationReport() {
    try {
        // Phase 5システム初期化
        if (typeof EnhancedPredictionEngine === 'undefined' || typeof CalibrationSystem === 'undefined') {
            showMessage('Phase 5システムが読み込まれていません', 'error');
            return;
        }

        const enhancedEngine = new EnhancedPredictionEngine();
        const calibrationSystem = new CalibrationSystem();
        
        // デバッグ: データ確認
        console.log('📊 Phase 5データ確認開始');
        try {
            const saved = localStorage.getItem('phase5_calibration_data');
            if (saved) {
                const data = JSON.parse(saved);
                console.log('✅ 保存データ発見:', {
                    calibrationDataKeys: Object.keys(data.calibrationData || {}),
                    popularityKeys: Object.keys(data.popularityAdjustments || {}),
                    seasonalKeys: Object.keys(data.seasonalAdjustments || {}),
                    lastUpdated: data.lastUpdated
                });
                
                const totalSamples = Object.values(data.calibrationData || {})
                    .reduce((sum, bucket) => sum + (bucket.totalPredictions || 0), 0);
                console.log('📊 総サンプル数:', totalSamples);
            } else {
                console.log('❌ Phase 5保存データが見つかりません');
            }
        } catch (error) {
            console.warn('データ確認エラー:', error);
        }
        
        // 馬データの取得
        let horses = null;
        
        if (typeof HorseManager !== 'undefined' && HorseManager.getAllHorses) {
            horses = HorseManager.getAllHorses();
        }
        
        if ((!horses || horses.length === 0) && window.horses) {
            horses = window.horses;
        }
        
        // キャリブレーション分析実行
        const accuracyReport = enhancedEngine.generateAccuracyReport();
        const calibrationReport = calibrationSystem.generateCalibrationReport();
        
        // 予測品質評価（馬データがある場合）
        let qualityEvaluation = null;
        if (horses && horses.length > 0) {
            // 簡易予測データ生成
            const predictions = horses.map(horse => ({
                horse: horse,
                score: horse.score || horse.placeProbability || 50,
                finalProbability: enhancedEngine.calculateEnhancedProbability(horse).finalProbability
            }));
            
            qualityEvaluation = enhancedEngine.evaluatePredictionQuality(predictions, { course: 'current' });
        }
        
        // 結果表示
        displayPhase5CalibrationReport(accuracyReport, calibrationReport, qualityEvaluation);
        
        // 表示エリアを表示
        const reportSection = document.getElementById('phase5CalibrationReport');
        if (reportSection) {
            reportSection.style.display = 'block';
            reportSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        showMessage('Phase 5キャリブレーション分析が完了しました', 'success');
        
    } catch (error) {
        console.error('Phase 5分析エラー:', error);
        showMessage('Phase 5分析でエラーが発生しました: ' + error.message, 'error');
    }
}

/**
 * Phase 5レポート表示
 */
function displayPhase5CalibrationReport(accuracyReport, calibrationReport, qualityEvaluation) {
    const container = document.getElementById('phase5CalibrationReport');
    if (!container) {
        console.error('phase5CalibrationReport要素が見つかりません');
        return;
    }
    
    const html = `
        <div style="background: white; border-radius: 8px; padding: 15px; border: 1px solid #ddd; margin-bottom: 20px;">
            <h3 style="color: #7b1fa2; margin-bottom: 20px;">🔬 Phase 5: キャリブレーション精度分析</h3>
            
            <!-- 概要ダッシュボード -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                <div style="background: linear-gradient(135deg, #e1bee7, #f3e5f5); border: 1px solid #ba68c8; border-radius: 8px; padding: 12px; text-align: center;">
                    <div style="font-size: 1.5em; margin-bottom: 5px;">📊</div>
                    <div style="font-weight: bold; color: #7b1fa2;">総合サンプル数</div>
                    <div style="font-size: 1.3em; color: #4a148c;">${calibrationReport.overview.totalSamples || 0}</div>
                </div>
                <div style="background: linear-gradient(135deg, #c8e6c9, #e8f5e8); border: 1px solid #81c784; border-radius: 8px; padding: 12px; text-align: center;">
                    <div style="font-size: 1.5em; margin-bottom: 5px;">🎯</div>
                    <div style="font-weight: bold; color: #2e7d32;">校正バケット数</div>
                    <div style="font-size: 1.3em; color: #1b5e20;">${calibrationReport.overview.bucketsWithData || 0}</div>
                </div>
                <div style="background: linear-gradient(135deg, #fff9c4, #fffde7); border: 1px solid #ffcc02; border-radius: 8px; padding: 12px; text-align: center;">
                    <div style="font-size: 1.5em; margin-bottom: 5px;">📈</div>
                    <div style="font-weight: bold; color: #f57c00;">平均精度</div>
                    <div style="font-size: 1.3em; color: #e65100;">${accuracyReport.overview?.averageAccuracy?.toFixed(1) || 'N/A'}%</div>
                </div>
            </div>
            
            ${generateAccuracyOverview(accuracyReport)}
            ${generateCalibrationAnalysis(calibrationReport)}
            ${qualityEvaluation ? generateQualityEvaluation(qualityEvaluation) : ''}
            ${generateCalibrationRecommendations(accuracyReport, calibrationReport)}
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * 精度概要生成
 */
function generateAccuracyOverview(accuracyReport) {
    if (accuracyReport.status === 'no_data') {
        return `
            <div style="background: #fff3e0; border: 1px solid #ffb74d; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                <h4 style="color: #f57c00; margin-bottom: 10px;">📝 学習状況</h4>
                <div style="text-align: center; color: #e65100; padding: 20px;">
                    ${accuracyReport.message}<br>
                    <small>レース結果を記録することで学習データが蓄積されます</small>
                </div>
            </div>
        `;
    }
    
    const overview = accuracyReport.overview || {};
    return `
        <div style="background: #f3e5f5; border: 1px solid #ce93d8; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
            <h4 style="color: #7b1fa2; margin-bottom: 15px;">📈 精度分析概要</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                <div style="background: white; padding: 10px; border-radius: 6px; text-align: center;">
                    <div style="font-weight: bold; color: #7b1fa2;">総レース数</div>
                    <div style="font-size: 1.2em;">${overview.totalRaces || 0}</div>
                </div>
                <div style="background: white; padding: 10px; border-radius: 6px; text-align: center;">
                    <div style="font-weight: bold; color: #7b1fa2;">平均精度</div>
                    <div style="font-size: 1.2em;">${overview.averageAccuracy?.toFixed(1) || 'N/A'}%</div>
                </div>
                <div style="background: white; padding: 10px; border-radius: 6px; text-align: center;">
                    <div style="font-weight: bold; color: #7b1fa2;">直近精度</div>
                    <div style="font-size: 1.2em;">${overview.recentAccuracy?.toFixed(1) || 'N/A'}%</div>
                </div>
                <div style="background: white; padding: 10px; border-radius: 6px; text-align: center;">
                    <div style="font-weight: bold; color: #7b1fa2;">改善傾向</div>
                    <div style="font-size: 1.2em;">${getTrendLabel(overview.trend)}</div>
                </div>
            </div>
        </div>
    `;
}

/**
 * キャリブレーション分析生成
 */
function generateCalibrationAnalysis(calibrationReport) {
    const buckets = Object.keys(calibrationReport.bucketAnalysis || {});
    
    if (buckets.length === 0) {
        return `
            <div style="background: #e3f2fd; border: 1px solid #90caf9; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                <h4 style="color: #1976d2; margin-bottom: 10px;">🔧 バケット分析</h4>
                <div style="text-align: center; color: #1565c0; padding: 20px;">
                    校正データが不足しています<br>
                    <small>予測と結果を記録することで分析が可能になります</small>
                </div>
            </div>
        `;
    }
    
    return `
        <div style="background: #e3f2fd; border: 1px solid #90caf9; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
            <h4 style="color: #1976d2; margin-bottom: 15px;">🔧 バケット校正分析</h4>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                    <thead>
                        <tr style="background: #bbdefb;">
                            <th style="padding: 8px; border: 1px solid #2196f3; text-align: left;">スコア範囲</th>
                            <th style="padding: 8px; border: 1px solid #2196f3; text-align: right;">サンプル数</th>
                            <th style="padding: 8px; border: 1px solid #2196f3; text-align: right;">実際的中率</th>
                            <th style="padding: 8px; border: 1px solid #2196f3; text-align: right;">理論的中率</th>
                            <th style="padding: 8px; border: 1px solid #2196f3; text-align: right;">校正係数</th>
                            <th style="padding: 8px; border: 1px solid #2196f3; text-align: right;">精度</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${buckets.map(bucket => {
                            const data = calibrationReport.bucketAnalysis[bucket];
                            const factor = parseFloat(data.calibrationFactor);
                            const isGoodCalibration = factor >= 0.8 && factor <= 1.2;
                            
                            return `
                                <tr style="background: ${isGoodCalibration ? '#e8f5e8' : '#ffebee'};">
                                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${bucket}台</td>
                                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${data.samples}</td>
                                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${data.actualHitRate}</td>
                                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${data.theoreticalHitRate}</td>
                                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: ${isGoodCalibration ? '#2e7d32' : '#d32f2f'};">${data.calibrationFactor}</td>
                                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${data.accuracy}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/**
 * 品質評価生成
 */
function generateQualityEvaluation(qualityEvaluation) {
    return `
        <div style="background: #fff3e0; border: 1px solid #ffb74d; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
            <h4 style="color: #f57c00; margin-bottom: 15px;">⚡ リアルタイム品質評価</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 10px;">
                <div style="background: white; padding: 10px; border-radius: 6px; text-align: center;">
                    <div style="font-weight: bold; color: #f57c00;">総合品質</div>
                    <div style="font-size: 1.2em; color: ${getQualityColor(qualityEvaluation.overallQuality)}">${(qualityEvaluation.overallQuality * 100).toFixed(1)}%</div>
                </div>
                <div style="background: white; padding: 10px; border-radius: 6px; text-align: center;">
                    <div style="font-weight: bold; color: #f57c00;">信頼度</div>
                    <div style="font-size: 1.2em;">${qualityEvaluation.confidenceLevel.toFixed(1)}%</div>
                </div>
                <div style="background: white; padding: 10px; border-radius: 6px; text-align: center;">
                    <div style="font-weight: bold; color: #f57c00;">リスク評価</div>
                    <div style="font-size: 1.2em;">${getRiskLevelLabel(qualityEvaluation.riskAssessment)}</div>
                </div>
            </div>
            ${qualityEvaluation.recommendations.length > 0 ? `
                <div style="background: #fff8e1; padding: 10px; border-radius: 6px;">
                    <strong>推奨事項:</strong><br>
                    ${qualityEvaluation.recommendations.map(rec => `• ${rec}`).join('<br>')}
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * 推奨事項生成
 */
function generateCalibrationRecommendations(accuracyReport, calibrationReport) {
    const recommendations = [
        ...(accuracyReport.recommendations || []),
        ...(calibrationReport.recommendations || [])
    ];
    
    return `
        <div style="background: #e8f5e8; border: 1px solid #81c784; border-radius: 8px; padding: 15px;">
            <h4 style="color: #2e7d32; margin-bottom: 15px;">💡 改善推奨事項</h4>
            ${recommendations.length > 0 ? `
                <ul style="margin: 0; padding-left: 20px;">
                    ${recommendations.map(rec => `<li style="margin-bottom: 5px;">${rec}</li>`).join('')}
                </ul>
            ` : `
                <div style="text-align: center; color: #2e7d32; padding: 10px;">
                    ✅ 現在のキャリブレーション設定は良好です
                </div>
            `}
            
            <div style="margin-top: 15px; padding: 10px; background: #c8e6c9; border-radius: 6px;">
                <strong>📈 継続的改善のために:</strong><br>
                • 定期的にレース結果を記録して学習データを蓄積<br>
                • 月1回程度のキャリブレーション分析実行<br>
                • 季節やコース特性の変化に応じた設定見直し
            </div>
        </div>
    `;
}

/**
 * ユーティリティ関数
 */
function getQualityColor(quality) {
    if (quality > 0.8) return '#2e7d32';
    if (quality > 0.5) return '#f57c00';
    return '#d32f2f';
}

/**
 * Phase 4パフォーマンス統計表示
 */
function showPhase4PerformanceStats() {
    try {
        console.log('📊 Phase 4パフォーマンス統計表示開始');
        
        // PerformanceTrackerの初期化
        if (typeof PerformanceTracker === 'undefined') {
            showMessage('Phase 4パフォーマンストラッカーが利用できません', 'error');
            return;
        }
        
        const performanceTracker = new PerformanceTracker();
        const overallStats = performanceTracker.getOverallStats();
        
        // 表示エリアを確認・作成
        let displayArea = document.getElementById('phase4PerformanceDisplay');
        if (!displayArea) {
            displayArea = document.createElement('div');
            displayArea.id = 'phase4PerformanceDisplay';
            displayArea.style.cssText = 'margin-top: 20px; padding: 20px; background: white; border-radius: 8px; border: 1px solid #ddd;';
            document.body.appendChild(displayArea);
        }
        
        // パフォーマンス統計の表示
        if (!overallStats || overallStats.totalRaces === 0) {
            displayArea.innerHTML = `
                <div style="background: white; border-radius: 8px; padding: 20px; border: 1px solid #ddd;">
                    <h3 style="color: #e65100; margin-bottom: 15px;">📊 Phase 4パフォーマンス統計</h3>
                    <div style="text-align: center; color: #666; padding: 30px;">
                        📝 まだレース履歴がありません<br>
                        <small>統合学習でレース結果を記録すると成績分析が表示されます</small>
                    </div>
                </div>
            `;
        } else {
            displayArea.innerHTML = `
                <div style="background: white; border-radius: 8px; padding: 20px; border: 1px solid #ddd;">
                    <h3 style="color: #e65100; margin-bottom: 15px;">📊 Phase 4パフォーマンス統計</h3>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
                        <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-weight: bold; color: #2e7d32;">総レース数</div>
                            <div style="font-size: 1.4em; margin-top: 5px;">${overallStats.totalRaces}</div>
                        </div>
                        <div style="background: ${overallStats.overallROI >= 0 ? '#e8f5e8' : '#ffebee'}; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-weight: bold; color: ${overallStats.overallROI >= 0 ? '#2e7d32' : '#d32f2f'};">総合ROI</div>
                            <div style="font-size: 1.4em; margin-top: 5px; color: ${overallStats.overallROI >= 0 ? '#1b5e20' : '#c62828'};">${overallStats.overallROI.toFixed(1)}%</div>
                        </div>
                        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-weight: bold; color: #1976d2;">平均的中率</div>
                            <div style="font-size: 1.4em; margin-top: 5px;">${overallStats.averageHitRate.toFixed(1)}%</div>
                        </div>
                        <div style="background: #f3e5f5; padding: 15px; border-radius: 8px; text-align: center;">
                            <div style="font-weight: bold; color: #7b1fa2;">純利益</div>
                            <div style="font-size: 1.4em; margin-top: 5px; color: ${overallStats.netProfit >= 0 ? '#2e7d32' : '#d32f2f'};">${overallStats.netProfit?.toLocaleString() || 0}円</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        displayArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
        showMessage('Phase 4パフォーマンス統計を表示しました', 'success');
        
    } catch (error) {
        console.error('Phase 4パフォーマンス統計エラー:', error);
        showMessage('Phase 4パフォーマンス統計の表示でエラーが発生しました: ' + error.message, 'error');
    }
}

// グローバル変数として公開
window.showPhase4PerformanceStats = showPhase4PerformanceStats;

// ページ読み込み時にPhase 4システムを初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Phase 4統合システムがロードされました');
});