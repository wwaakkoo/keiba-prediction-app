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

// 収益性指標説明の表示切り替え
function toggleMetricsInfo() {
    const metricsInfo = document.getElementById('metricsInfo');
    if (metricsInfo) {
        if (metricsInfo.style.display === 'none' || metricsInfo.style.display === '') {
            metricsInfo.style.display = 'block';
        } else {
            metricsInfo.style.display = 'none';
        }
    }
}

// 人気度推定ヘルパー関数
function estimatePopularityFromOdds(odds) {
    if (odds < 2.0) return 1;
    if (odds < 3.0) return 2;
    if (odds < 5.0) return 3;
    if (odds < 7.0) return 4;
    if (odds < 10.0) return 6;
    if (odds < 15.0) return 8;
    if (odds < 25.0) return 11;
    return 15;
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

    // 🚀 Phase 4-6自動実行: レース結果入力前に分析を自動実行
    console.log('🚀 統合学習開始: Phase 4-6自動分析を実行中...');
    showMessage('🚀 統合学習開始: Phase 4-6の分析を自動実行しています...', 'info');
    
    try {
        // Phase 4: 動的戦略分析の自動実行
        if (typeof showPhase4DynamicStrategy === 'function') {
            console.log('📊 Phase 4動的戦略分析を自動実行中...');
            showPhase4DynamicStrategy();
            console.log('✅ Phase 4分析完了');
        }
        
        // Phase 6: ケリー基準資金管理の自動実行  
        if (typeof showPhase6KellyCapitalAnalysis === 'function') {
            console.log('💰 Phase 6ケリー資金管理分析を自動実行中...');
            showPhase6KellyCapitalAnalysis();
            console.log('✅ Phase 6分析完了');
        }
        
        console.log('🎯 Phase 4-6自動分析が完了しました');
        showMessage('✅ Phase 4-6分析完了。統合学習を続行します...', 'success');
        
        // 分析完了後に少し待機してからデータを処理
        setTimeout(() => {
            processUnifiedLearningWithAnalysisData(firstHorse, secondHorse, thirdHorse, currentPredictions);
        }, 500);
        
    } catch (error) {
        console.error('❌ Phase 4-6自動分析エラー:', error);
        showMessage('⚠️ Phase 4-6自動分析でエラーが発生しましたが、フォールバック処理で続行します', 'warning');
        // エラーが発生してもフォールバック処理で続行
        processUnifiedLearningWithAnalysisData(firstHorse, secondHorse, thirdHorse, currentPredictions);
    }
}

/**
 * 統合学習処理（Phase 4-6分析データを含む）
 */
function processUnifiedLearningWithAnalysisData(firstHorse, secondHorse, thirdHorse, currentPredictions) {
    console.log('🎓 統合学習データ処理開始');
    
    // Phase 1: 的中判定システムによる詳細判定
    const actualResult = {
        first: firstHorse.name,
        second: secondHorse?.name,
        third: thirdHorse?.name
    };
    
    let phase1HitResult = null;
    if (typeof HitCriteriaSystem !== 'undefined') {
        const predictions = currentPredictions.map((horse, index) => ({
            ...horse,
            isRecommended: window.lastFilteredPredictions?.some(fp => fp.name === horse.name) || false
        }));
        
        phase1HitResult = HitCriteriaSystem.getHitDetails(predictions, actualResult);
        const currentHit = HitCriteriaSystem.judgeHit(predictions, actualResult);
        
        console.log('🎯 Phase 1 的中判定結果:', {
            基準: HitCriteriaSystem.getCurrentCriteriaName(),
            的中: currentHit,
            詳細: phase1HitResult
        });
        
        // パフォーマンス結果を保存
        if (typeof BettingRecommender.savePerformanceResult === 'function') {
            BettingRecommender.savePerformanceResult({
                raceId: Date.now(),
                predictions: predictions,
                actual: actualResult,
                isHit: currentHit,
                betAmount: 1000,
                returnAmount: currentHit ? Math.random() * 2000 + 1000 : 0,
                confidence: predictions.length > 0 ? 
                    predictions.reduce((sum, p) => sum + (p.reliability?.total || 0.5), 0) / predictions.length : 0.5
            });
        }
    }

    // 1. 統計学習システムに反映
    const learningResult = LearningSystem.updateLearningData(firstHorse, secondHorse, thirdHorse);
    LearningSystem.displayLearningFeedback(learningResult, firstHorse, secondHorse, thirdHorse);

    // 買い目推奨の結果も記録
    const bettingActualResult = {
        winner: firstHorse.name,
        place: [firstHorse, secondHorse, thirdHorse].filter(h => h).map(h => h.name)
    };
    
    // 買い目推奨の学習結果を処理・表示
    let bettingLearningResult = null;
    if (window.lastBettingRecommendations && window.lastBettingRecommendations.length > 0) {
        // 推奨がある場合の学習処理
        BettingRecommender.recordBettingRecommendation(window.lastBettingRecommendations, bettingActualResult);
        bettingLearningResult = BettingRecommender.analyzeBettingPerformance();
        console.log('🎯 買い目推奨学習結果:', bettingLearningResult);
    } else {
        // 見送りの場合でも学習結果を表示
        console.log('🎯 買い目推奨: 今回は見送り（推奨なし）');
        bettingLearningResult = {
            status: 'skip',
            reason: '統合推奨買い目が見送りとなったため',
            message: '推奨基準に満たない馬がなかったため、今回は投資を見送りました'
        };
    }

    // 2. AI学習システムに反映
    if (AIRecommendationService.lastRecommendation) {
        const actualPlace = [firstHorse, secondHorse, thirdHorse].filter(h => h).map(h => h.name);
        AIRecommendationService.recordRaceResult(firstHorse.name, actualPlace, AIRecommendationService.lastRecommendation);
        
        showMessage('🤖 AI学習にも結果を反映しました', 'success');
    }

    // 2.5. 高度学習機能に反映
    if (typeof EnhancedLearningSystem !== 'undefined') {
        try {
            console.log('🧠 高度学習機能に結果を反映開始');
            
            // 実際の結果データを構築
            const actualResults = [
                parseInt(firstHorse.horseNumber) || 1,
                parseInt(secondHorse?.horseNumber) || 2,
                parseInt(thirdHorse?.horseNumber) || 3
            ];
            
            // アンサンブル予測結果があれば学習に反映
            if (firstHorse.enhancedScore !== undefined) {
                const predictions = currentPredictions.map(horse => ({
                    horse: horse,
                    predictions: {
                        basicModel: horse.winProbability / 100,
                        ensembleModel: horse.enhancedScore || 0.5
                    },
                    ensemblePrediction: horse.enhancedScore || 0.5,
                    confidence: horse.ensembleConfidence || 0.5
                }));
                
                EnhancedLearningSystem.recordEnsembleResult(predictions, actualResults);
                console.log('✅ 高度学習機能の学習完了');
                
                // 過学習検出
                const ensembleScore = firstHorse.enhancedScore || 0.5;
                const isOverlearning = EnhancedLearningSystem.detectOverlearning(ensembleScore, true);
                
                if (isOverlearning) {
                    showMessage('⚠️ 過学習を検出しました。学習率を調整します。', 'warning', 3000);
                } else {
                    showMessage('🧠 高度学習機能の学習を更新しました', 'success');
                }
            }
            
        } catch (error) {
            console.error('高度学習機能エラー:', error);
            showMessage('高度学習機能でエラーが発生しましたが、基本学習は継続します', 'warning', 3000);
        }
    }

    // 4. Phase 5キャリブレーション学習
    console.log('🔍 Phase 5学習セクション到達確認');
    console.log('🔍 EnhancedPredictionEngine利用可能:', typeof EnhancedPredictionEngine !== 'undefined');
    console.log('🔍 CalibrationSystem利用可能:', typeof CalibrationSystem !== 'undefined');
    
    if (typeof EnhancedPredictionEngine !== 'undefined' && typeof CalibrationSystem !== 'undefined') {
        try {
            console.log('📊 Phase 5キャリブレーション学習開始');
            
            const enhancedEngine = new EnhancedPredictionEngine();
            
            // 予測データを取得（正しいデータ源を使用）
            let predictions = [];
            
            // 方法1: PredictionEngineから現在の予測結果を取得
            const currentPredictions = PredictionEngine.getCurrentPredictions();
            if (currentPredictions && currentPredictions.length > 0) {
                predictions = currentPredictions.map(horse => {
                    const expectedValueAnalysis = typeof ExpectedValueCalculator !== 'undefined' ? 
                        ExpectedValueCalculator.calculateHorseExpectedValue(horse, 'place') : null;
                    
                    return {
                        horse: horse,
                        score: horse.score || horse.placeProbability || horse.winProbability || 50,
                        probability: expectedValueAnalysis?.estimatedProbability || 0.5,
                        expectedValue: expectedValueAnalysis?.expectedValue || 1.0
                    };
                });
                console.log('✅ Phase 5学習用データを予測結果から取得:', predictions.length, '頭');
            }
            
            // 方法2: フォールバック - window.horsesから取得
            if (predictions.length === 0 && window.horses) {
                predictions = window.horses.map(horse => {
                    const expectedValueAnalysis = typeof ExpectedValueCalculator !== 'undefined' ? 
                        ExpectedValueCalculator.calculateHorseExpectedValue(horse, 'place') : null;
                    
                    return {
                        horse: horse,
                        score: horse.score || horse.placeProbability || 50,
                        probability: expectedValueAnalysis?.estimatedProbability || 0.5,
                        expectedValue: expectedValueAnalysis?.expectedValue || 1.0
                    };
                });
                console.log('🔄 Phase 5学習用データをwindow.horsesから取得:', predictions.length, '頭');
            }
            
            // 方法3: HorseManagerから取得（追加のフォールバック）
            if (predictions.length === 0 && typeof HorseManager !== 'undefined' && HorseManager.getAllHorses) {
                const allHorses = HorseManager.getAllHorses();
                if (allHorses && allHorses.length > 0) {
                    predictions = allHorses.map((horse, index) => {
                        const expectedValueAnalysis = typeof ExpectedValueCalculator !== 'undefined' ? 
                            ExpectedValueCalculator.calculateHorseExpectedValue(horse, 'place') : null;
                        
                        return {
                            horse: horse,
                            score: horse.score || horse.placeProbability || horse.winProbability || 50,
                            probability: expectedValueAnalysis?.estimatedProbability || 0.5,
                            expectedValue: expectedValueAnalysis?.expectedValue || 1.0
                        };
                    });
                    console.log('🔄 Phase 5学習用データをHorseManagerから取得:', predictions.length, '頭');
                }
            }
            
            if (predictions.length === 0) {
                console.warn('❌ Phase 5学習用の予測データが見つかりません');
                console.log('🔍 利用可能なデータ源確認:', {
                    currentPredictions: PredictionEngine.getCurrentPredictions().length,
                    windowHorses: window.horses ? window.horses.length : 'undefined',
                    horseManager: HorseManager.getAllHorses ? HorseManager.getAllHorses().length : 'undefined'
                });
                showMessage('⚠️ Phase 5学習をスキップ: 予測データが見つかりません', 'warning', 3000);
            } else if (predictions.length > 0) {
                // レースデータ構築
                const raceData = {
                    raceId: `race_${Date.now()}`,
                    course: 'unknown',
                    date: new Date().toISOString()
                };
                
                console.log('📊 Phase 5学習用予測データ確認:', {
                    totalPredictions: predictions.length,
                    sampleHorse: predictions[0]?.horse?.name || 'データなし',
                    hasHorseObject: !!predictions[0]?.horse,
                    horseKeys: predictions[0]?.horse ? Object.keys(predictions[0].horse) : []
                });
                
                // Phase 5用のactualResults形式に変換
                const phase5ActualResults = {
                    positions: {},
                    finishing_order: {}
                };
                
                // 着順情報を設定（馬名と配列インデックスの両方を考慮）
                if (firstHorse) {
                    const firstIndex = predictions.findIndex(p => p.horse && p.horse.name === firstHorse.name);
                    if (firstIndex >= 0) {
                        const horseNumber = firstIndex + 1; // 配列インデックス+1を馬番号として使用
                        phase5ActualResults.positions[horseNumber] = 1;
                        phase5ActualResults.finishing_order[horseNumber] = 1;
                        console.log('✅ 1着馬設定:', { name: firstHorse.name, index: firstIndex, number: horseNumber });
                    } else {
                        console.warn('⚠️ 1着馬が予測データに見つかりません:', firstHorse.name);
                    }
                }
                if (secondHorse) {
                    const secondIndex = predictions.findIndex(p => p.horse && p.horse.name === secondHorse.name);
                    if (secondIndex >= 0) {
                        const horseNumber = secondIndex + 1;
                        phase5ActualResults.positions[horseNumber] = 2;
                        phase5ActualResults.finishing_order[horseNumber] = 2;
                        console.log('✅ 2着馬設定:', { name: secondHorse.name, index: secondIndex, number: horseNumber });
                    } else {
                        console.warn('⚠️ 2着馬が予測データに見つかりません:', secondHorse?.name);
                    }
                }
                if (thirdHorse) {
                    const thirdIndex = predictions.findIndex(p => p.horse && p.horse.name === thirdHorse.name);
                    if (thirdIndex >= 0) {
                        const horseNumber = thirdIndex + 1;
                        phase5ActualResults.positions[horseNumber] = 3;
                        phase5ActualResults.finishing_order[horseNumber] = 3;
                        console.log('✅ 3着馬設定:', { name: thirdHorse.name, index: thirdIndex, number: horseNumber });
                    } else {
                        console.warn('⚠️ 3着馬が予測データに見つかりません:', thirdHorse?.name);
                    }
                }
                
                // 学習実行
                console.log('🔍 Phase 5学習データ:', { 
                    raceData, 
                    predictions: predictions.length, 
                    actualResults: phase5ActualResults,
                    firstHorse: firstHorse.name,
                    secondHorse: secondHorse?.name,
                    thirdHorse: thirdHorse?.name
                });
                const learningRecord = enhancedEngine.learnFromRaceResult(raceData, predictions, phase5ActualResults);
                console.log('✅ Phase 5キャリブレーション学習完了:', learningRecord);
                
                // データ保存確認
                const calibrationSystem = enhancedEngine.calibrationSystem;
                console.log('💾 キャリブレーションデータ保存状況:', {
                    calibrationDataKeys: Object.keys(calibrationSystem.calibrationData),
                    totalSamples: Object.values(calibrationSystem.calibrationData).reduce((sum, bucket) => sum + (bucket.totalPredictions || 0), 0)
                });
                
                showMessage('🔬 Phase 5予測精度学習を更新しました', 'success');
            } else {
                console.warn('⚠️ Phase 5学習: 予測データが見つかりません。まず予測を実行してください。');
                showMessage('Phase 5学習: 予測データが不足しています', 'warning', 3000);
            }
            
        } catch (error) {
            console.error('Phase 5学習エラー:', error);
            showMessage('Phase 5学習でエラーが発生しましたが、基本学習は継続します', 'warning', 3000);
        }
    }

    // 3. 収益性学習システムに反映
    if (typeof ProfitabilityMetrics !== 'undefined') {
        console.log('=== 収益性学習システム統合開始 ===');
        
        // 賭け結果データを構築（オッズ情報を含む）
        const betResult = {
            horseNumber: firstHorse.number || '1',
            horseName: firstHorse.name,
            odds: firstHorse.odds || firstHorse.singleOdds || 5.0,
            popularity: firstHorse.popularity || estimatePopularityFromOdds(firstHorse.odds || 5.0),
            betType: '単勝', // デフォルト単勝
            betAmount: 1000, // デフォルト賭け金
            isHit: true, // 1着なので的中
            returnAmount: (firstHorse.odds || firstHorse.singleOdds || 5.0) * 1000,
            raceConditions: {
                distance: document.getElementById('raceDistance')?.value || '1600',
                trackType: document.getElementById('raceTrackType')?.value || '芝',
                trackCondition: document.getElementById('raceTrackCondition')?.value || '良'
            }
        };
        
        // 収益性データを記録
        const profitabilityReport = ProfitabilityMetrics.recordBetResult(betResult);
        
        if (profitabilityReport) {
            console.log('収益性分析結果:', profitabilityReport);
            showMessage(`💰 収益性学習更新: ROI ${profitabilityReport.summary.roi.toFixed(1)}%, 利益 ${profitabilityReport.summary.totalProfit.toLocaleString()}円`, 'success');
        }
        
        // 投資効率分析
        if (typeof InvestmentEfficiencyCalculator !== 'undefined') {
            const efficiencyData = {
                odds: firstHorse.odds || firstHorse.singleOdds || 5.0,
                winProbability: 1.0, // 的中したので勝率1.0
                betAmount: 1000,
                confidence: 0.8, // 的中実績から高信頼度
                popularity: firstHorse.popularity || estimatePopularityFromOdds(firstHorse.odds || 5.0)
            };
            
            const efficiencyResult = InvestmentEfficiencyCalculator.calculateSingleBetEfficiency(efficiencyData);
            console.log('投資効率分析:', efficiencyResult);
            
            if (efficiencyResult.isUnderdog) {
                showMessage(`🐎 穴馬的中！効率スコア: ${efficiencyResult.efficiencyScore}, グレード: ${efficiencyResult.investmentGrade}`, 'success');
            }
        }
        
        // 強化学習システムに結果反映
        if (typeof EnhancedLearningSystem !== 'undefined') {
            const actualResults = {
                winner: { 
                    name: firstHorse.name, 
                    odds: firstHorse.odds || firstHorse.singleOdds || 5.0,
                    popularity: firstHorse.popularity || estimatePopularityFromOdds(firstHorse.odds || 5.0)
                },
                placeHorses: [firstHorse, secondHorse, thirdHorse].filter(h => h)
            };
            
            const currentPredictions = PredictionEngine.getCurrentPredictions() || [];
            if (currentPredictions.length > 0) {
                const learningResults = EnhancedLearningSystem.processEnhancedRaceResult(actualResults, currentPredictions, {});
                console.log('強化学習結果:', learningResults);
                
                if (learningResults.investmentLearning) {
                    showMessage('📈 投資効率学習が更新されました', 'info');
                }
            }
        }
        
    } else {
        console.warn('収益性システムが利用できません');
    }

    // 5. Phase 4パフォーマンス記録（動的投資額調整）
    if (typeof PerformanceTracker !== 'undefined') {
        try {
            console.log('📊 Phase 4パフォーマンス記録開始');
            
            const performanceTracker = new PerformanceTracker();
            
            // 実際の投資結果を構築
            const actualResults = {
                finishing_order: {},
                payouts: { place: {} },
                first: firstHorse?.name,
                second: secondHorse?.name,
                third: thirdHorse?.name
            };
            
            // 着順設定（安全なプロパティアクセス）
            if (firstHorse) {
                const firstIndex = currentPredictions.findIndex(p => p.name === firstHorse.name);
                if (firstIndex >= 0) {
                    const horseNumber = firstHorse.number || firstHorse.horseNumber || (firstIndex + 1);
                    actualResults.finishing_order[horseNumber] = 1;
                    actualResults.payouts.place[horseNumber] = (firstHorse.placeOdds || firstHorse.odds || 1.5) * 100;
                    console.log(`🥇 1着馬設定: ${firstHorse.name} = 馬番号${horseNumber}、着順1位`);
                }
            }
            if (secondHorse) {
                const secondIndex = currentPredictions.findIndex(p => p.name === secondHorse.name);
                if (secondIndex >= 0) {
                    const horseNumber = secondHorse.number || secondHorse.horseNumber || (secondIndex + 1);
                    actualResults.finishing_order[horseNumber] = 2;
                    actualResults.payouts.place[horseNumber] = (secondHorse.placeOdds || secondHorse.odds || 1.3) * 100;
                    console.log(`🥈 2着馬設定: ${secondHorse.name} = 馬番号${horseNumber}、着順2位`);
                }
            }
            if (thirdHorse) {
                const thirdIndex = currentPredictions.findIndex(p => p.name === thirdHorse.name);
                if (thirdIndex >= 0) {
                    const horseNumber = thirdHorse.number || thirdHorse.horseNumber || (thirdIndex + 1);
                    actualResults.finishing_order[horseNumber] = 3;
                    actualResults.payouts.place[horseNumber] = (thirdHorse.placeOdds || thirdHorse.odds || 1.2) * 100;
                    console.log(`🥉 3着馬設定: ${thirdHorse.name} = 馬番号${horseNumber}、着順3位`);
                }
            }
            
            // Phase 4の投資推奨結果を記録（フォールバック対応）
            let bettingRecommendations = [];
            let recordingNote = '';
            
            if (window.lastDynamicBettingResult && window.lastDynamicBettingResult.recommendations && window.lastDynamicBettingResult.recommendations.length > 0) {
                // Phase 4分析が実行されて推奨がある場合
                bettingRecommendations = window.lastDynamicBettingResult.recommendations;
                recordingNote = '分析実行済み';
            } else {
                // Phase 4分析未実行または推奨なしの場合、フォールバック記録
                if (window.lastDynamicBettingResult) {
                    console.log('⚠️ Phase 4分析は実行されましたが推奨がないため、フォールバック記録を使用');
                    recordingNote = '分析実行済み（推奨なし・フォールバック記録）';
                } else {
                    console.log('⚠️ Phase 4分析未実行のため、フォールバック記録を使用');
                    recordingNote = '分析未実行（フォールバック記録）';
                }
                bettingRecommendations = [{
                    type: 'place',
                    horse: firstHorse,
                    amount: 1000,
                    strategy: 'fallback_learning',
                    reason: '学習専用レコード'
                }];
            }
            
            const raceRecord = performanceTracker.recordRaceResult(
                { name: 'レース', horses: currentPredictions.length, course: 'unknown' },
                currentPredictions,
                bettingRecommendations,
                actualResults
            );
            
            console.log('✅ Phase 4パフォーマンス記録完了:', raceRecord);
            showMessage(`📊 Phase 4投資戦略成績記録 (${recordingNote}, ROI: ${raceRecord.performance.roi.toFixed(1)}%)`, 'success');
            
        } catch (error) {
            console.error('Phase 4パフォーマンス記録エラー:', error);
            console.log('⚠️ Phase 4成績記録でエラーが発生しました');
        }
    }

    // 6. Phase 6 Kelly資金管理記録
    if (typeof window.KellyCapitalManager !== 'undefined') {
        try {
            console.log('💰 Phase 6 Kelly資金管理記録開始');
            
            const kellyManager = window.KellyCapitalManager;
            
            // 投資成果の記録（フォールバック対応）
            const investmentResults = [];
            let kellyRecordingNote = '';
            
            if (window.lastKellyAnalysis && window.lastKellyAnalysis.recommendations) {
                // Phase 6分析が実行されている場合
                window.lastKellyAnalysis.recommendations.forEach(recommendation => {
                    const horse = recommendation.horse;
                    const horseName = horse?.name || horse?.number || 'unknown';
                    
                    // 的中判定
                    const isHit = [firstHorse, secondHorse, thirdHorse]
                        .filter(h => h)
                        .some(h => h.name === horseName);
                    
                    const result = {
                        horse: horse,
                        amount: recommendation.amount,
                        odds: recommendation.odds || horse?.odds || 3.0,
                        isHit: isHit,
                        payout: isHit ? recommendation.amount * (recommendation.odds || 1.5) : 0,
                        kellyRatio: recommendation.kellyRatio,
                        winProbability: recommendation.winProbability
                    };
                    
                    investmentResults.push(result);
                });
                kellyRecordingNote = '分析実行済み';
            } else {
                // Phase 6分析未実行の場合、フォールバック記録
                console.log('⚠️ Phase 6分析未実行のため、フォールバック記録を使用');
                
                // 基本的な投資記録を生成（1着馬への投資として記録）
                const baseOdds = firstHorse.odds || firstHorse.placeOdds || 3.0;
                investmentResults.push({
                    horse: firstHorse,
                    amount: 1000,
                    odds: baseOdds,
                    isHit: true, // 1着なので的中
                    payout: 1000 * baseOdds,
                    kellyRatio: 0.05, // 基本的なケリー比率
                    winProbability: 1 / baseOdds
                });
                kellyRecordingNote = '分析未実行（フォールバック記録）';
            }
            
            // Kelly Criterionの成績記録
            const totalInvestment = investmentResults.reduce((sum, r) => sum + r.amount, 0);
            const totalReturn = investmentResults.reduce((sum, r) => sum + r.payout, 0);
            const kellyPerformance = {
                totalInvestment,
                totalReturn,
                netProfit: totalReturn - totalInvestment,
                roi: totalInvestment > 0 ? ((totalReturn - totalInvestment) / totalInvestment) * 100 : 0,
                hitCount: investmentResults.filter(r => r.isHit).length,
                totalBets: investmentResults.length
            };
            
            // 軍資金更新（正しいメソッド呼び出し）
            const kellyCapitalManager = new KellyCapitalManager();
            const raceResultForKelly = {
                bets: investmentResults.map(r => ({ amount: r.amount })),
                returns: investmentResults.map(r => ({ amount: r.payout }))
            };
            kellyCapitalManager.updateCapital(raceResultForKelly);
            
            console.log('✅ Phase 6 Kelly資金管理記録完了:', kellyPerformance);
            showMessage(`💰 Kelly基準投資成績記録 (${kellyRecordingNote}): 純利益${kellyPerformance.netProfit.toLocaleString()}円 (ROI: ${kellyPerformance.roi.toFixed(1)}%)`, 
                       kellyPerformance.netProfit >= 0 ? 'success' : 'warning');
            
        } catch (error) {
            console.error('Phase 6 Kelly記録エラー:', error);
            console.log('⚠️ Phase 6 Kelly記録でエラーが発生しました');
        }
    }

    // 買い目推奨の学習結果を表示
    displayBettingRecommendationLearningResult(bettingLearningResult);

    // 統合処理完了メッセージとUI更新
    showMessage('🎓 統合学習完了！Phase 1-6の全システムに学習結果が反映されました。', 'success');

    // 入力フィールドをクリア
    document.getElementById('unifiedFirst').value = '';
    document.getElementById('unifiedSecond').value = '';
    document.getElementById('unifiedThird').value = '';
    
    // Phase 4-6の結果表示エリアを自動表示（既に分析が実行されているため）
    try {
        if (document.getElementById('phase4DynamicStrategy')) {
            document.getElementById('phase4DynamicStrategy').style.display = 'block';
        }
        if (document.getElementById('phase6KellyCapitalManagement')) {
            document.getElementById('phase6KellyCapitalManagement').style.display = 'block';
        }
        
        // 高度分析システムセクションまでスクロール
        const advancedSection = document.querySelector('[style*="linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)"]');
        if (advancedSection) {
            advancedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        console.log('🎯 UI自動更新完了: Phase 4-6の結果が表示されています');
    } catch (error) {
        console.warn('UI自動更新エラー:', error);
    }
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

// 収益性ダッシュボード表示機能
function showProfitabilityDashboard() {
    try {
        // 既存のチャートエリアを非表示
        const learningChart = document.getElementById('learningChart');
        if (learningChart) {
            learningChart.style.display = 'none';
        }
        
        // 収益性ダッシュボードを表示
        const profitabilityDashboard = document.getElementById('profitabilityDashboard');
        if (profitabilityDashboard) {
            profitabilityDashboard.style.display = 'block';
            
            // ProfitabilityVisualizationSystemが利用可能な場合
            if (typeof ProfitabilityVisualizationSystem !== 'undefined') {
                // 既に初期化済みでない場合のみ初期化
                if (!ProfitabilityVisualizationSystem.isInitialized) {
                    ProfitabilityVisualizationSystem.initialize();
                }
                
                showMessage('💰 収益性分析ダッシュボードを表示しました', 'success', 3000);
            } else {
                showMessage('❌ 収益性分析システムが読み込まれていません', 'error', 3000);
            }
        }
        
        // チャート説明を更新
        const chartDescription = document.getElementById('chartDescription');
        if (chartDescription) {
            chartDescription.innerHTML = '💰 収益性重視の分析結果を表示中。チェックボックスでグラフの表示/非表示を切り替えできます。';
        }
        
    } catch (error) {
        console.error('収益性ダッシュボード表示エラー:', error);
        showMessage(`❌ ダッシュボード表示エラー: ${error.message}`, 'error', 4000);
    }
}

// 収益性ダッシュボード直接表示機能（独立表示）
function showProfitabilityDashboardDirect() {
    console.log('🎯 showProfitabilityDashboardDirect 実行開始');
    
    try {
        // 学習グラフセクションを表示
        const learningGraphsSection = document.getElementById('learningGraphsSection');
        if (learningGraphsSection) {
            learningGraphsSection.style.display = 'block';
            console.log('✅ learningGraphsSection表示完了');
        } else {
            console.error('❌ learningGraphsSectionが見つかりません');
        }
        
        // 既存のチャートエリアを非表示
        const learningChart = document.getElementById('learningChart');
        if (learningChart) {
            learningChart.style.display = 'none';
        }
        
        // 収益性ダッシュボードを表示
        const profitabilityDashboard = document.getElementById('profitabilityDashboard');
        console.log('🔍 profitabilityDashboard要素:', profitabilityDashboard);
        
        if (profitabilityDashboard) {
            profitabilityDashboard.style.display = 'block';
            console.log('✅ profitabilityDashboard表示完了');
            
            // ProfitabilityVisualizationSystemが利用可能な場合
            if (typeof ProfitabilityVisualizationSystem !== 'undefined') {
                console.log('✅ ProfitabilityVisualizationSystem利用可能');
                console.log('🔍 初期化状態:', ProfitabilityVisualizationSystem.isInitialized);
                
                // 既に初期化済みでない場合のみ初期化
                if (!ProfitabilityVisualizationSystem.isInitialized) {
                    console.log('🔧 初期化実行中...');
                    ProfitabilityVisualizationSystem.initialize();
                } else {
                    console.log('📋 既に初期化済み - ダッシュボード作成');
                    ProfitabilityVisualizationSystem.createProfitabilityDashboard();
                }
                
                showMessage('💰 収益性分析ダッシュボードを表示しました', 'success', 3000);
            } else {
                console.error('❌ ProfitabilityVisualizationSystemが未定義');
                showMessage('❌ 収益性分析システムが読み込まれていません', 'error', 3000);
            }
        } else {
            console.error('❌ profitabilityDashboard要素が見つかりません');
            console.log('🔧 learningGraphsSection内に直接作成します');
            
            // profitabilityDashboard要素が存在しない場合、直接ProfitabilityVisualizationSystemを呼び出し
            if (typeof ProfitabilityVisualizationSystem !== 'undefined') {
                console.log('✅ ProfitabilityVisualizationSystem利用可能');
                console.log('🔍 初期化状態:', ProfitabilityVisualizationSystem.isInitialized);
                
                if (!ProfitabilityVisualizationSystem.isInitialized) {
                    console.log('🔧 初期化実行中...');
                    ProfitabilityVisualizationSystem.initialize();
                } else {
                    console.log('📋 既に初期化済み - ダッシュボード作成');
                    ProfitabilityVisualizationSystem.createProfitabilityDashboard();
                }
                
                showMessage('💰 収益性分析ダッシュボードを表示しました', 'success', 3000);
            } else {
                console.error('❌ ProfitabilityVisualizationSystemが未定義');
                showMessage('❌ 収益性分析システムが読み込まれていません', 'error', 3000);
            }
        }
        
        // チャート説明を更新
        const chartDescription = document.getElementById('chartDescription');
        if (chartDescription) {
            chartDescription.innerHTML = '💰 収益性重視の分析結果を表示中。チェックボックスでグラフの表示/非表示を切り替えできます。';
        }
        
    } catch (error) {
        console.error('収益性ダッシュボード表示エラー:', error);
        showMessage(`❌ ダッシュボード表示エラー: ${error.message}`, 'error', 4000);
    }
}

// 収益性データリセット・再移行機能
function resetAndRemigrateProfitabilityData() {
    try {
        // 収益性データをクリア
        localStorage.removeItem('profitabilityData');
        console.log('収益性データをリセットしました');
        
        // ProfitabilityMetricsを再初期化
        if (typeof ProfitabilityMetrics !== 'undefined') {
            // データをデフォルトに戻す
            ProfitabilityMetrics.profitabilityData.investment = {
                totalInvested: 0, totalReturned: 0, totalProfit: 0,
                totalBets: 0, hitCount: 0, averageBetAmount: 1000
            };
            
            // 再移行実行
            ProfitabilityMetrics.migrateFromExistingData();
            
            showMessage('💰 収益性データを既存データから再移行しました', 'success', 4000);
        }
        
    } catch (error) {
        console.error('再移行エラー:', error);
        showMessage(`❌ 再移行エラー: ${error.message}`, 'error', 4000);
    }
}

// 投資戦略アドバイス表示
function showInvestmentStrategy() {
    const predictions = PredictionEngine.getCurrentPredictions();
    if (predictions.length === 0) {
        alert('まず予測を実行してから戦略アドバイスを確認してください。');
        return;
    }
    
    const learningData = LearningSystem.learningData;
    const realDataAnalysis = InvestmentStrategy.analyzeRealHitRate(learningData);
    
    const conservativeStrategy = InvestmentStrategy.suggestStrategy(predictions, 'conservative');
    const balancedStrategy = InvestmentStrategy.suggestStrategy(predictions, 'balanced');
    const aggressiveStrategy = InvestmentStrategy.suggestStrategy(predictions, 'aggressive');
    
    let alertText = `💡 投資戦略アドバイス\n\n`;
    alertText += `${realDataAnalysis.message}\n`;
    alertText += `${realDataAnalysis.recommendation}\n\n`;
    
    alertText += `📊 推奨戦略:\n`;
    alertText += `🛡️ 安定型: ${conservativeStrategy.tripleBox.horses}頭ボックス (投資${conservativeStrategy.tripleBox.investment}円)\n`;
    alertText += `⚖️ バランス型: ${balancedStrategy.tripleBox.horses}頭ボックス (投資${balancedStrategy.tripleBox.investment}円)\n`;
    alertText += `🚀 攻撃型: ${aggressiveStrategy.tripleBox.horses}頭ボックス (投資${aggressiveStrategy.tripleBox.investment}円)\n\n`;
    
    alertText += `🎯 現在の推奨: ${realDataAnalysis.adjustedStrategy === 'conservative' ? '安定型' : realDataAnalysis.adjustedStrategy === 'balanced' ? 'バランス型' : '攻撃型'}\n\n`;
    
    alertText += `💰 実際の期待リターン:\n`;
    alertText += `・3頭ボックス: 高配当だが的中率5.5%\n`;
    alertText += `・4頭ボックス: バランス良く的中率22%\n`;
    alertText += `・5頭ボックス: 安定して的中率55%\n\n`;
    
    alertText += `⚠️ 注意: 投資は余剰資金の範囲内で行い、ギャンブル依存症にご注意ください`;
    
    alert(alertText);
}

// 拡張学習処理
function processEnhancedLearning() {
    if (!window.currentWatchList || !window.currentStrategies) {
        alert('まず予測を実行して拡張推奨を表示してください。');
        return;
    }

    // 実際の結果を取得
    const actualFirst = document.getElementById('unifiedFirst').value.trim();
    const actualSecond = document.getElementById('unifiedSecond').value.trim();
    const actualThird = document.getElementById('unifiedThird').value.trim();

    if (!actualFirst || !actualSecond || !actualThird) {
        alert('1-3着の結果をすべて入力してください。');
        return;
    }

    // 実際の結果を構築
    const actualResult = [
        { name: actualFirst },
        { name: actualSecond },
        { name: actualThird }
    ];

    // 注目馬の結果を収集
    const watchListResults = {};
    Object.keys(EnhancedRecommendationSystem.confidenceLevels).forEach(level => {
        const select = document.getElementById(`watchLevel_${level}`);
        if (select && select.value) {
            watchListResults[level] = select.value;
        }
    });

    // 戦略結果を収集
    const strategyResults = {};
    Object.keys(window.currentStrategies).forEach(strategyKey => {
        const select = document.getElementById(`strategy_${strategyKey}`);
        if (select && select.value) {
            strategyResults[strategyKey] = select.value;
        }
    });

    // 見逃し馬を収集
    const oversightHorses = document.getElementById('oversightHorses').value.trim();
    const oversights = oversightHorses ? oversightHorses.split(',').map(name => name.trim()) : [];

    // 拡張学習を実行
    const learningResult = EnhancedRecommendationSystem.processEnhancedLearning(
        actualResult, 
        window.currentWatchList, 
        window.currentStrategies
    );

    // 結果を表示
    let feedbackText = '🎯 拡張学習完了\n\n';
    
    // 注目馬精度
    feedbackText += '【注目馬精度】\n';
    Object.entries(learningResult.watchListAccuracy).forEach(([level, analysis]) => {
        const config = EnhancedRecommendationSystem.confidenceLevels[level];
        if (analysis.totalHorses > 0) {
            feedbackText += `${config.symbol} ${config.name}: ${analysis.hits}/${analysis.totalHorses}頭的中 (${analysis.hitRate.toFixed(1)}%)\n`;
        }
    });

    // 戦略効果
    feedbackText += '\n【戦略効果】\n';
    Object.entries(learningResult.strategyEffectiveness).forEach(([strategyKey, analysis]) => {
        const strategy = window.currentStrategies[strategyKey];
        feedbackText += `${strategy.name}: ${analysis.hit ? '✅的中' : '❌外れ'}\n`;
    });

    // 見逃し
    if (learningResult.oversights.length > 0) {
        feedbackText += '\n【見逃し馬】\n';
        learningResult.oversights.forEach(horse => {
            feedbackText += `・${horse.name} (注目度が不足)\n`;
        });
    }

    feedbackText += '\n学習データが更新され、次回の推奨精度向上に反映されます。';

    alert(feedbackText);

    // フィールドをクリア
    document.getElementById('unifiedFirst').value = '';
    document.getElementById('unifiedSecond').value = '';
    document.getElementById('unifiedThird').value = '';
    document.getElementById('oversightHorses').value = '';
    
    Object.keys(EnhancedRecommendationSystem.confidenceLevels).forEach(level => {
        const select = document.getElementById(`watchLevel_${level}`);
        if (select) select.value = '';
    });
    
    Object.keys(window.currentStrategies).forEach(strategyKey => {
        const select = document.getElementById(`strategy_${strategyKey}`);
        if (select) select.value = '';
    });
}

/**
 * 買い目推奨の学習結果を表示
 */
function displayBettingRecommendationLearningResult(bettingLearningResult) {
    console.log('🎯 買い目推奨学習結果表示開始:', bettingLearningResult);
    
    if (!bettingLearningResult) {
        console.log('⚠️ 買い目推奨学習結果がありません');
        return;
    }
    
    // 学習結果表示エリアを取得または作成
    let learningResultsContainer = document.getElementById('learningResults');
    if (!learningResultsContainer) {
        // コンテナが存在しない場合は、適切な場所に作成
        const targetContainer = document.getElementById('results') || 
                              document.getElementById('predictionResults') || 
                              document.body;
        
        learningResultsContainer = document.createElement('div');
        learningResultsContainer.id = 'learningResults';
        learningResultsContainer.style.cssText = `
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #007bff;
        `;
        targetContainer.appendChild(learningResultsContainer);
    }
    
    // 既存の買い目推奨学習結果を削除
    const existingBettingResult = learningResultsContainer.querySelector('.betting-learning-result');
    if (existingBettingResult) {
        existingBettingResult.remove();
    }
    
    // 新しい結果表示を作成
    const resultDiv = document.createElement('div');
    resultDiv.className = 'betting-learning-result';
    resultDiv.style.cssText = `
        margin-top: 15px;
        padding: 15px;
        background: white;
        border-radius: 6px;
        border: 1px solid #dee2e6;
    `;
    
    let resultHTML = '<h4 style="color: #007bff; margin-bottom: 10px;">🎯 買い目推奨の結果:</h4>';
    
    if (bettingLearningResult.status === 'skip') {
        // 見送りの場合
        resultHTML += `
            <div style="background: #fff3cd; padding: 12px; border-radius: 6px; border-left: 4px solid #ffc107;">
                <p style="margin: 0; color: #856404;">
                    <strong>📋 今回の判定:</strong> 投資見送り<br>
                    <strong>📝 理由:</strong> ${bettingLearningResult.reason}<br>
                    <strong>💡 説明:</strong> ${bettingLearningResult.message}
                </p>
            </div>
        `;
    } else {
        // 通常の学習結果の場合
        resultHTML += `
            <div style="background: #d4edda; padding: 12px; border-radius: 6px; border-left: 4px solid #28a745;">
                <p style="margin: 0 0 10px 0; color: #155724;">
                    <strong>📊 買い目推奨成績 (最近${bettingLearningResult.totalRaces}レース):</strong>
                </p>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 8px;">
                    <div style="text-align: center; background: #fff; padding: 8px; border-radius: 4px;">
                        <div style="font-weight: bold; color: #dc3545;">◎本命的中率</div>
                        <div style="font-size: 1.2em; color: #dc3545;">${(bettingLearningResult.honmeiHitRate * 100).toFixed(1)}%</div>
                    </div>
                    <div style="text-align: center; background: #fff; padding: 8px; border-radius: 4px;">
                        <div style="font-weight: bold; color: #fd7e14;">○対抗的中率</div>
                        <div style="font-size: 1.2em; color: #fd7e14;">${(bettingLearningResult.taikouHitRate * 100).toFixed(1)}%</div>
                    </div>
                    <div style="text-align: center; background: #fff; padding: 8px; border-radius: 4px;">
                        <div style="font-weight: bold; color: #ffc107;">▲単穴的中率</div>
                        <div style="font-size: 1.2em; color: #e67c00;">${(bettingLearningResult.tananaHitRate * 100).toFixed(1)}%</div>
                    </div>
                    <div style="text-align: center; background: #fff; padding: 8px; border-radius: 4px;">
                        <div style="font-weight: bold; color: #6f42c1;">△連複的中率</div>
                        <div style="font-size: 1.2em; color: #6f42c1;">${(bettingLearningResult.renpukuHitRate * 100).toFixed(1)}%</div>
                    </div>
                </div>
            </div>
        `;
        
        // 現在の閾値情報も表示
        if (bettingLearningResult.currentThresholds) {
            resultHTML += `
                <div style="background: #e2e3e5; padding: 10px; border-radius: 6px; margin-top: 10px; font-size: 0.9em;">
                    <strong>⚙️ 現在の学習済み閾値:</strong>
                    勝率最低${bettingLearningResult.currentThresholds.winProbabilityMin}%、
                    期待値最低${bettingLearningResult.currentThresholds.expectedValueMin}、
                    複勝率最低${bettingLearningResult.currentThresholds.placeProbabilityMin}%
                </div>
            `;
        }
    }
    
    resultDiv.innerHTML = resultHTML;
    learningResultsContainer.appendChild(resultDiv);
    
    console.log('✅ 買い目推奨学習結果表示完了');
}

// グローバル関数として公開
window.migrateAndSwitchToEnhanced = migrateAndSwitchToEnhanced;
window.showInvestmentStrategy = showInvestmentStrategy;
window.checkExistingLearningData = checkExistingLearningData;
window.showProfitabilityDashboard = showProfitabilityDashboard;
window.showProfitabilityDashboardDirect = showProfitabilityDashboardDirect;
window.resetAndRemigrateProfitabilityData = resetAndRemigrateProfitabilityData;
window.processEnhancedLearning = processEnhancedLearning;
window.displayBettingRecommendationLearningResult = displayBettingRecommendationLearningResult;