/**
 * Phase 6 ケリー基準資金管理システムの統合制御
 * 期待値計算システムと連携して科学的な投資推奨を提供
 */

// グローバル変数
let kellyCapitalManager = null;

/**
 * Phase 6システム初期化
 */
function initializePhase6Systems() {
    try {
        kellyCapitalManager = new KellyCapitalManager();
        console.log('✅ Phase 6システムが正常に初期化されました');
        return true;
    } catch (error) {
        console.error('❌ Phase 6システムの初期化に失敗:', error);
        return false;
    }
}

/**
 * Phase 6ケリー基準資金管理分析表示
 */
function showPhase6KellyCapitalAnalysis() {
    if (!initializePhase6Systems()) {
        showMessage('Phase 6システムの初期化に失敗しました', 'error');
        return;
    }

    // 馬データと予測データの取得（Phase 4と同様の方法）
    let horses = null;
    let predictions = null;
    let dataSource = '';

    // 馬データ取得
    if (typeof HorseManager !== 'undefined' && HorseManager.getAllHorses) {
        horses = HorseManager.getAllHorses();
        dataSource = 'HorseManager';
    }
    
    if ((!horses || horses.length === 0) && typeof PredictionEngine !== 'undefined' && PredictionEngine.getCurrentPredictions) {
        horses = PredictionEngine.getCurrentPredictions();
        dataSource = 'PredictionEngine';
    }
    
    if ((!horses || horses.length === 0) && window.horses) {
        horses = window.horses;
        dataSource = 'window.horses';
    }

    console.log(`🏇 馬データ取得結果: ${dataSource}から${horses ? horses.length : 0}頭`);
    
    // デバッグ: 馬データ構造を確認
    if (horses && horses.length > 0) {
        console.log('🔍 馬データ構造確認:', horses[0]);
        if (horses[0].horse) {
            console.log('🔍 馬オブジェクト構造:', Object.keys(horses[0].horse));
            console.log('🔍 馬番候補:', {
                number: horses[0].horse.number,
                horseNumber: horses[0].horse.horseNumber,
                num: horses[0].horse.num
            });
        }
    }

    if (!horses || horses.length === 0) {
        showMessage('馬のデータが入力されていません。先に「馬のデータ一括入力」または「予測実行」を行ってください。', 'warning');
        return;
    }

    // 予測データ取得
    if (typeof PredictionEngine !== 'undefined' && PredictionEngine.getCurrentPredictions) {
        predictions = PredictionEngine.getCurrentPredictions();
        if (predictions && predictions.length > 0) {
            console.log('✅ 既存の予測結果を使用:', predictions.length, '頭');
        }
    }

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
        showMessage('予測データが取得できませんでした。先に「予測実行」ボタンを押してください。', 'warning');
        return;
    }

    // Phase 6分析実行
    executePhase6Analysis(horses, predictions);
    
    // 表示エリアを表示
    document.getElementById('phase6KellyCapitalManagement').style.display = 'block';
    
    // スクロール
    document.getElementById('phase6KellyCapitalManagement').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

/**
 * Phase 6分析実行
 */
function executePhase6Analysis(horses, predictions) {
    try {
        // 期待値分析が必要（オッズベース正規化を統一使用）
        let expectedValueAnalysis = null;
        if (typeof ExpectedValueCalculator !== 'undefined') {
            // ExpectedValueCalculatorがある場合でも、正規化勝率で再計算
            const originalAnalysis = ExpectedValueCalculator.analyzeRaceExpectedValue(predictions);
            expectedValueAnalysis = enhanceWithNormalizedProbabilities(originalAnalysis, predictions);
        } else {
            // フォールバック: 簡易期待値計算（正規化済み）
            expectedValueAnalysis = generateSimpleExpectedValueAnalysis(predictions);
        }

        // 資金管理ダッシュボード表示
        displayCapitalDashboard();

        // ケリー基準投資推奨計算
        const kellyRecommendations = calculateKellyRecommendations(expectedValueAnalysis);
        displayKellyBettingRecommendations(kellyRecommendations);

        // ポートフォリオ最適化
        const portfolioAnalysis = calculateOptimalPortfolio(kellyRecommendations);
        displayPortfolioAnalysis(portfolioAnalysis);

        // パフォーマンス分析
        const performanceAnalysis = kellyCapitalManager.generateCapitalReport();
        displayCapitalPerformanceAnalysis(performanceAnalysis);

        // 統合学習用にグローバル変数に保存
        window.lastKellyAnalysis = {
            recommendations: kellyRecommendations,
            portfolio: portfolioAnalysis,
            performance: performanceAnalysis,
            capital: kellyCapitalManager.currentCapital
        };

        showMessage('Phase 6ケリー基準資金管理分析が完了しました', 'success');

    } catch (error) {
        console.error('Phase 6分析エラー:', error);
        showMessage('Phase 6分析でエラーが発生しました: ' + error.message, 'error');
    }
}

/**
 * 簡易期待値分析生成（フォールバック）
 */
function generateSimpleExpectedValueAnalysis(predictions) {
    console.log('🔍 Phase 6簡易期待値分析開始:', predictions.length, '頭');
    
    // デバッグ: 最初の馬のデータ構造を確認
    if (predictions.length > 0) {
        console.log('🔍 予測データ構造サンプル:', {
            prediction: predictions[0],
            horseKeys: predictions[0].horse ? Object.keys(predictions[0].horse) : 'horse未定義',
            hasOdds: !!(predictions[0].horse?.odds || predictions[0].horse?.placeOdds || predictions[0].odds)
        });
    }
    
    // Step 1: オッズベース理論勝率を計算
    const horsesWithRawProbability = predictions.map((pred, index) => {
        const score = pred.score || pred.finalScore || pred.placeProbability || 50;
        
        // 安全なオッズアクセス
        let odds = 3.0; // デフォルト値
        if (pred.horse && typeof pred.horse === 'object') {
            odds = pred.horse.odds || pred.horse.placeOdds || pred.horse.winOdds || 3.0;
        } else if (pred.odds) {
            odds = pred.odds;
        }
        
        console.log(`🐎 ${index + 1}: ${pred.horse?.name || 'N/A'} - オッズ:${odds}, スコア:${score}`);
        
        const rawProbability = 1 / odds; // オッズから理論勝率
        
        return {
            horse: pred.horse,
            score: score,
            odds: odds,
            rawProbability: rawProbability
        };
    });
    
    // Step 2: 全馬の理論勝率合計を計算
    const totalRawProbability = horsesWithRawProbability.reduce((sum, h) => sum + h.rawProbability, 0);
    console.log('📊 理論勝率合計:', (totalRawProbability * 100).toFixed(1) + '%');
    
    // Step 3: 正規化して100%に調整
    return {
        analyzedHorses: horsesWithRawProbability.map((h, index) => {
            // 正規化勝率 = 理論勝率 / 合計理論勝率
            const normalizedProbability = h.rawProbability / totalRawProbability;
            
            // スコアによる微調整（±20%程度）
            const scoreFactor = Math.max(0.8, Math.min(1.2, h.score / 50));
            const adjustedProbability = Math.max(0.005, Math.min(0.95, normalizedProbability * scoreFactor));
            
            const expectedValue = adjustedProbability * h.odds;
            
            const horseName = h.horse?.name || h.horse?.number || `${index + 1}番`;
            console.log('🐎', horseName, 
                '- オッズ:', h.odds, 
                '理論勝率:', (h.rawProbability * 100).toFixed(1) + '%',
                '正規化勝率:', (normalizedProbability * 100).toFixed(1) + '%',
                '調整後勝率:', (adjustedProbability * 100).toFixed(1) + '%',
                '期待値:', expectedValue.toFixed(2)
            );
            
            return {
                horse: h.horse,
                expectedValue: expectedValue,
                confidence: h.score / 100,
                winProbability: adjustedProbability,
                rawProbability: h.rawProbability,
                normalizedProbability: normalizedProbability
            };
        }),
        raceExpectedValue: 1.0,
        totalRawProbability: totalRawProbability
    };
}

/**
 * 既存分析をオッズベース正規化勝率で強化（PredictionEngineデータは変更しない）
 */
function enhanceWithNormalizedProbabilities(originalAnalysis, predictions) {
    console.log('🔧 既存分析を正規化勝率で強化中（Phase 6専用計算）...');
    
    // オッズベース正規化計算（Phase 6専用）
    const normalizedAnalysis = generateSimpleExpectedValueAnalysis(predictions);
    
    // 既存分析をコピーして正規化勝率を適用（元データは変更せず）
    const enhancedHorses = originalAnalysis.analyzedHorses.map((original, index) => {
        const normalized = normalizedAnalysis.analyzedHorses[index];
        if (normalized) {
            return {
                ...original,
                // Phase 6専用の正規化勝率（0-1範囲）
                phase6WinProbability: normalized.winProbability,
                phase6ExpectedValue: normalized.expectedValue,
                // 既存システム用の勝率は保持（0-100範囲）
                winProbability: original.winProbability,
                expectedValue: original.expectedValue,
                // Phase 6追加情報
                rawProbability: normalized.rawProbability,
                normalizedProbability: normalized.normalizedProbability
            };
        }
        return original;
    });
    
    console.log('✅ 分析強化完了 - 既存データを保護しつつPhase 6用計算完了');
    
    return {
        ...originalAnalysis,
        analyzedHorses: enhancedHorses,
        totalRawProbability: normalizedAnalysis.totalRawProbability
    };
}

/**
 * ケリー基準推奨計算
 */
function calculateKellyRecommendations(expectedValueAnalysis) {
    const recommendations = [];
    
    console.log('🧮 ケリー基準推奨計算開始:', expectedValueAnalysis.analyzedHorses.length, '頭');

    for (const horse of expectedValueAnalysis.analyzedHorses) {
        // 安全なオッズアクセス
        let odds = 3.0; // デフォルト値
        if (horse.horse && typeof horse.horse === 'object') {
            odds = horse.horse.odds || horse.horse.placeOdds || horse.horse.winOdds || 3.0;
        } else if (horse.odds) {
            odds = horse.odds;
        }
        
        // Phase 6専用の正規化勝率を優先使用（0-1範囲に統一）
        let winProb = horse.phase6WinProbability;
        if (!winProb && horse.winProbability) {
            // 既存システムの勝率（0-100範囲）を0-1範囲に変換
            winProb = horse.winProbability / 100;
        }
        if (!winProb) {
            // フォールバック：オッズベース計算
            winProb = 1 / odds;
        }
        
        const expectedValue = horse.phase6ExpectedValue || horse.expectedValue || (winProb * odds);
        const confidence = horse.confidence || 0.8;
        
        // デバッグ：データ構造とソース確認
        const dataSource = horse.phase6WinProbability ? 'Phase6正規化' : 
                          horse.winProbability ? '既存システム' : 'フォールバック';
        
        console.log('🎯 ケリー計算:', horse.horse.name, 
            '勝率:', (winProb*100).toFixed(1)+'%', 
            'オッズ:', odds, 
            '期待値:', expectedValue.toFixed(2),
            'ソース:', dataSource
        );

        const kellyResult = kellyCapitalManager.calculateOptimalBetAmount(
            expectedValue,
            winProb,
            odds,
            confidence
        );

        if (kellyResult.amount > 0) {
            recommendations.push({
                horse: horse.horse,
                kellyResult: kellyResult,
                expectedValue: expectedValue,
                winProbability: winProb,
                odds: odds,
                confidence: confidence
            });
        }
    }

    // ケリー比率でソート
    recommendations.sort((a, b) => b.kellyResult.kellyRatio - a.kellyResult.kellyRatio);

    return recommendations;
}

/**
 * ポートフォリオ最適化計算
 */
function calculateOptimalPortfolio(kellyRecommendations) {
    if (kellyRecommendations.length === 0) {
        return {
            status: 'no_candidates',
            message: 'ケリー基準を満たす投資候補がありません'
        };
    }

    // ケリー基準による候補準備
    const candidates = kellyRecommendations.map(rec => ({
        horse: rec.horse,
        betType: 'place', // 複勝を基本とする
        winProbability: rec.winProbability,
        odds: rec.odds,
        expectedValue: rec.expectedValue,
        confidence: rec.confidence
    }));

    const portfolioResult = kellyCapitalManager.calculatePortfolioAllocation(candidates);

    return {
        status: 'success',
        portfolio: portfolioResult,
        totalCandidates: candidates.length,
        validAllocations: portfolioResult.allocations.length
    };
}

/**
 * 資金管理ダッシュボード表示
 */
function displayCapitalDashboard() {
    const container = document.getElementById('capitalDashboard');
    const report = kellyCapitalManager.generateCapitalReport();
    const capitalStatus = report.capitalStatus;
    const riskManagement = report.riskManagement;

    const html = `
        <div style="background: white; border-radius: 8px; padding: 15px; border: 1px solid #ddd;">
            <h4 style="color: #2e7d32; margin-bottom: 15px;">💼 資金管理ダッシュボード</h4>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 15px;">
                <div style="background: ${capitalStatus.totalReturn >= 0 ? '#e8f5e8' : '#ffebee'}; padding: 10px; border-radius: 6px; text-align: center;">
                    <div style="font-weight: bold; color: ${capitalStatus.totalReturn >= 0 ? '#2e7d32' : '#d32f2f'};">現在資金</div>
                    <div style="font-size: 1.2em; color: ${capitalStatus.totalReturn >= 0 ? '#1b5e20' : '#c62828'};">${capitalStatus.currentCapital.toLocaleString()}円</div>
                </div>
                <div style="background: #e3f2fd; padding: 10px; border-radius: 6px; text-align: center;">
                    <div style="font-weight: bold; color: #1976d2;">総収益率</div>
                    <div style="font-size: 1.2em; color: ${capitalStatus.totalReturnRate >= 0 ? '#1b5e20' : '#c62828'};">${capitalStatus.totalReturnRate.toFixed(1)}%</div>
                </div>
                <div style="background: #fff3e0; padding: 10px; border-radius: 6px; text-align: center;">
                    <div style="font-weight: bold; color: #f57c00;">リスクレベル</div>
                    <div style="font-size: 1.1em;">${getRiskLevelJapaneseLabel(riskManagement.riskLevel)}</div>
                </div>
                <div style="background: ${capitalStatus.currentDrawdown > 0.15 ? '#ffebee' : '#f3e5f5'}; padding: 10px; border-radius: 6px; text-align: center;">
                    <div style="font-weight: bold; color: ${capitalStatus.currentDrawdown > 0.15 ? '#d32f2f' : '#7b1fa2'};">ドローダウン</div>
                    <div style="font-size: 1.1em; color: ${capitalStatus.currentDrawdown > 0.15 ? '#c62828' : '#4a148c'};">${(capitalStatus.currentDrawdown * 100).toFixed(1)}%</div>
                </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; border-left: 3px solid #4caf50;">
                <strong>投資制約:</strong> 最大投資比率 ${(riskManagement.maxBetRatio * 100).toFixed(1)}% | 
                ドローダウン制御 ${riskManagement.isDrawdownControlActive ? '発動中' : '通常'} | 
                資金ピーク ${capitalStatus.capitalPeak.toLocaleString()}円
            </div>
        </div>
    `;

    container.innerHTML = html;
}

/**
 * ケリー基準投資推奨表示
 */
function displayKellyBettingRecommendations(recommendations) {
    const container = document.getElementById('kellyBettingRecommendations');

    if (recommendations.length === 0) {
        container.innerHTML = `
            <div style="background: white; border-radius: 8px; padding: 15px; border: 1px solid #ddd;">
                <h4 style="color: #2e7d32; margin-bottom: 15px;">🎯 ケリー基準投資推奨</h4>
                <div style="text-align: center; color: #666; padding: 20px;">
                    📋 現在のレースでは、ケリー基準を満たす投資推奨がありません<br>
                    <small>期待値が負または投資リスクが高すぎるため</small>
                </div>
            </div>
        `;
        return;
    }

    const html = `
        <div style="background: white; border-radius: 8px; padding: 15px; border: 1px solid #ddd;">
            <h4 style="color: #2e7d32; margin-bottom: 15px;">🎯 ケリー基準投資推奨</h4>
            
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                    <thead>
                        <tr style="background: #c8e6c9;">
                            <th style="padding: 8px; border: 1px solid #4caf50; text-align: left;">馬名</th>
                            <th style="padding: 8px; border: 1px solid #4caf50; text-align: right;">投資額</th>
                            <th style="padding: 8px; border: 1px solid #4caf50; text-align: right;">ケリー比率</th>
                            <th style="padding: 8px; border: 1px solid #4caf50; text-align: right;">期待値</th>
                            <th style="padding: 8px; border: 1px solid #4caf50; text-align: right;">勝率</th>
                            <th style="padding: 8px; border: 1px solid #4caf50; text-align: left;">推奨度</th>
                            <th style="padding: 8px; border: 1px solid #4caf50; text-align: left;">理由</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recommendations.map(rec => `
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">
                                    ${rec.horse.name || 'N/A'} (${rec.horse.number || rec.horse.horseNumber || rec.horse.num || '?'}番)
                                </td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold; color: #2e7d32;">
                                    ${rec.kellyResult.amount.toLocaleString()}円
                                </td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: ${getKellyRatioColor(rec.kellyResult.kellyRatio)};">
                                    ${(rec.kellyResult.kellyRatio * 100).toFixed(2)}%
                                </td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: ${rec.expectedValue >= 1.3 ? '#2e7d32' : rec.expectedValue >= 1.1 ? '#f57c00' : '#d32f2f'};">
                                    ${rec.expectedValue.toFixed(2)}
                                </td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">
                                    ${(rec.winProbability * 100).toFixed(1)}%
                                </td>
                                <td style="padding: 8px; border: 1px solid #ddd;">
                                    ${getRecommendationJapaneseLabel(rec.kellyResult.recommendation)}
                                </td>
                                <td style="padding: 8px; border: 1px solid #ddd; font-size: 0.8em;">
                                    ${rec.kellyResult.reasoning}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div style="background: #e8f5e8; padding: 10px; border-radius: 6px; margin-top: 15px; border-left: 3px solid #4caf50;">
                <strong>📊 ケリー基準について:</strong> 最適投資比率 = (期待値 × 勝率 - 負け率) ÷ 配当倍率<br>
                リスクレベル「${getRiskLevelJapaneseLabel(kellyCapitalManager.riskLevel)}」により調整済み
            </div>
        </div>
    `;

    container.innerHTML = html;
}

/**
 * ポートフォリオ分析表示
 */
function displayPortfolioAnalysis(portfolioAnalysis) {
    const container = document.getElementById('portfolioAnalysis');

    if (portfolioAnalysis.status === 'no_candidates') {
        container.innerHTML = `
            <div style="background: white; border-radius: 8px; padding: 15px; border: 1px solid #ddd;">
                <h4 style="color: #2e7d32; margin-bottom: 15px;">📊 ポートフォリオ最適化</h4>
                <div style="text-align: center; color: #666; padding: 20px;">
                    ${portfolioAnalysis.message}
                </div>
            </div>
        `;
        return;
    }

    const portfolio = portfolioAnalysis.portfolio;
    
    const html = `
        <div style="background: white; border-radius: 8px; padding: 15px; border: 1px solid #ddd;">
            <h4 style="color: #2e7d32; margin-bottom: 15px;">📊 ポートフォリオ最適化</h4>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 15px;">
                <div style="background: #e8f5e8; padding: 10px; border-radius: 6px; text-align: center;">
                    <div style="font-weight: bold; color: #2e7d32;">総投資額</div>
                    <div style="font-size: 1.2em; color: #1b5e20;">${portfolio.totalAmount.toLocaleString()}円</div>
                </div>
                <div style="background: #e3f2fd; padding: 10px; border-radius: 6px; text-align: center;">
                    <div style="font-weight: bold; color: #1976d2;">投資対象数</div>
                    <div style="font-size: 1.2em;">${portfolio.allocations.length}頭</div>
                </div>
                <div style="background: #f3e5f5; padding: 10px; border-radius: 6px; text-align: center;">
                    <div style="font-weight: bold; color: #7b1fa2;">ポートフォリオ推奨</div>
                    <div style="font-size: 1.1em;">${getPortfolioRecommendationLabel(portfolio.recommendation)}</div>
                </div>
                <div style="background: #fff3e0; padding: 10px; border-radius: 6px; text-align: center;">
                    <div style="font-weight: bold; color: #f57c00;">効率性</div>
                    <div style="font-size: 1.1em;">${portfolio.efficiency === 'optimal' ? '最適' : '制約あり'}</div>
                </div>
            </div>
            
            ${portfolio.allocations.length > 0 ? `
                <h5 style="color: #2e7d32; margin-bottom: 10px;">💰 最適配分</h5>
                <div style="overflow-x: auto; margin-bottom: 15px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                        <thead>
                            <tr style="background: #c8e6c9;">
                                <th style="padding: 8px; border: 1px solid #4caf50; text-align: left;">馬名</th>
                                <th style="padding: 8px; border: 1px solid #4caf50; text-align: right;">配分額</th>
                                <th style="padding: 8px; border: 1px solid #4caf50; text-align: right;">配分比率</th>
                                <th style="padding: 8px; border: 1px solid #4caf50; text-align: right;">期待値</th>
                                <th style="padding: 8px; border: 1px solid #4caf50; text-align: left;">配分理由</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${portfolio.allocations.map(allocation => `
                                <tr>
                                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">
                                        ${allocation.horse.name || 'N/A'} (${allocation.horse.number || allocation.horse.horseNumber || allocation.horse.num || '?'}番)
                                    </td>
                                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold; color: #2e7d32;">
                                        ${allocation.amount.toLocaleString()}円
                                    </td>
                                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">
                                        ${(allocation.proportion * 100).toFixed(1)}%
                                    </td>
                                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: ${allocation.expectedValue >= 1.3 ? '#2e7d32' : '#f57c00'};">
                                        ${allocation.expectedValue.toFixed(2)}
                                    </td>
                                    <td style="padding: 8px; border: 1px solid #ddd; font-size: 0.8em;">
                                        ${allocation.reasoning}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : ''}
            
            <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; border-left: 3px solid #4caf50;">
                <strong>分析結果:</strong> ${portfolio.reasoning} | 
                ポートフォリオケリー比率: ${(portfolio.portfolioKelly * 100).toFixed(2)}%
            </div>
        </div>
    `;

    container.innerHTML = html;
}

/**
 * 資金パフォーマンス分析表示
 */
function displayCapitalPerformanceAnalysis(performanceAnalysis) {
    const container = document.getElementById('capitalPerformanceAnalysis');
    const recentPerf = performanceAnalysis.recentPerformance;

    const html = `
        <div style="background: white; border-radius: 8px; padding: 15px; border: 1px solid #ddd;">
            <h4 style="color: #2e7d32; margin-bottom: 15px;">📈 パフォーマンス分析</h4>
            
            ${recentPerf.totalRaces > 0 ? `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-bottom: 15px;">
                    <div style="background: #e8f5e8; padding: 10px; border-radius: 6px; text-align: center;">
                        <div style="font-weight: bold; color: #2e7d32;">直近レース数</div>
                        <div style="font-size: 1.2em;">${recentPerf.totalRaces}</div>
                    </div>
                    <div style="background: ${recentPerf.winRate >= 0.5 ? '#e8f5e8' : '#ffebee'}; padding: 10px; border-radius: 6px; text-align: center;">
                        <div style="font-weight: bold; color: ${recentPerf.winRate >= 0.5 ? '#2e7d32' : '#d32f2f'};">勝率</div>
                        <div style="font-size: 1.2em; color: ${recentPerf.winRate >= 0.5 ? '#1b5e20' : '#c62828'};">${(recentPerf.winRate * 100).toFixed(1)}%</div>
                    </div>
                    <div style="background: ${recentPerf.averageROI >= 0 ? '#e8f5e8' : '#ffebee'}; padding: 10px; border-radius: 6px; text-align: center;">
                        <div style="font-weight: bold; color: ${recentPerf.averageROI >= 0 ? '#2e7d32' : '#d32f2f'};">平均ROI</div>
                        <div style="font-size: 1.2em; color: ${recentPerf.averageROI >= 0 ? '#1b5e20' : '#c62828'};">${recentPerf.averageROI.toFixed(1)}%</div>
                    </div>
                    <div style="background: #fff3e0; padding: 10px; border-radius: 6px; text-align: center;">
                        <div style="font-weight: bold; color: #f57c00;">最大DD</div>
                        <div style="font-size: 1.2em;">${(recentPerf.maxDrawdown * 100).toFixed(1)}%</div>
                    </div>
                </div>
            ` : `
                <div style="text-align: center; color: #666; padding: 20px;">
                    📝 パフォーマンス履歴がまだありません<br>
                    <small>投資結果を記録すると分析が表示されます</small>
                </div>
            `}
            
            ${performanceAnalysis.recommendations.length > 0 ? `
                <div style="background: #e8f5e8; padding: 10px; border-radius: 6px; margin-top: 15px;">
                    <h5 style="color: #2e7d32; margin-bottom: 8px;">💡 推奨事項</h5>
                    <ul style="margin: 0; padding-left: 20px;">
                        ${performanceAnalysis.recommendations.map(rec => `<li style="margin-bottom: 5px;">${rec}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;

    container.innerHTML = html;
}

/**
 * ユーティリティ関数群
 */
function getRiskLevelJapaneseLabel(level) {
    const labels = {
        'conservative': '保守的',
        'moderate': '中程度',
        'aggressive': '積極的'
    };
    return labels[level] || level;
}

function getKellyRatioColor(ratio) {
    if (ratio > 0.05) return '#2e7d32'; // 高いケリー比率
    if (ratio > 0.02) return '#f57c00'; // 中程度
    return '#d32f2f'; // 低い
}

function getRecommendationJapaneseLabel(recommendation) {
    const labels = {
        'strong_buy': '強力買い',
        'buy': '買い推奨',
        'light_buy': '軽い買い',
        'watch': '様子見',
        'skip': '見送り'
    };
    return labels[recommendation] || recommendation;
}

function getPortfolioRecommendationLabel(recommendation) {
    const labels = {
        'strong_portfolio': '強力推奨',
        'good_portfolio': '良好',
        'moderate_portfolio': '中程度',
        'light_portfolio': '軽微'
    };
    return labels[recommendation] || recommendation;
}

/**
 * メッセージ表示ヘルパー（Phase 4から流用）
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

// ページ読み込み時にPhase 6システムを初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('💰 Phase 6ケリー基準資金管理システムがロードされました');
});