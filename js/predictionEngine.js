// 予測エンジン機能
// 人気度推定ヘルパー関数（予測エンジン用）
function estimatePopularityFromOdds(odds) {
    // InvestmentEfficiencyCalculatorと同じロジックに統一
    if (odds <= 2.0) return 1;      // 1番人気
    if (odds <= 3.0) return 2;      // 2番人気
    if (odds <= 4.5) return 3;      // 3番人気
    if (odds <= 6.0) return 4;      // 4番人気
    if (odds <= 8.0) return 5;      // 5番人気
    if (odds <= 12.0) return 6;     // 6番人気
    if (odds <= 18.0) return 8;     // 8番人気
    if (odds <= 25.0) return 10;    // 10番人気
    if (odds <= 40.0) return 12;    // 12番人気
    if (odds <= 60.0) return 14;    // 14番人気
    return 16; // 16番人気以下
}

class PredictionEngine {
    static currentPredictions = [];

    // 着順データを安全に数値化するユーティリティ関数
    static parseRaceOrder(orderValue) {
        if (!orderValue) return null;
        
        // 文字列を正規化
        const orderStr = String(orderValue).trim();
        
        // 中止・取消・除外・失格の場合
        if (orderStr === 'DNS' || orderStr === '中' || orderStr === '取' || orderStr === '除' || orderStr === '失') {
            return 99; // 大きな数値として扱う（最下位扱い）
        }
        
        // 数値の場合
        const numericOrder = parseInt(orderStr);
        if (!isNaN(numericOrder) && numericOrder > 0) {
            return numericOrder;
        }
        
        return null;
    }

    static calculatePredictions() {
        if (!HorseManager.validateHorses()) {
            return;
        }

        const horses = HorseManager.getAllHorses();
        
        // 予測前のデータ品質チェック
        const qualityReport = this.validatePredictionData(horses);
        if (qualityReport.criticalIssues > 0) {
            showMessage(`予測データに${qualityReport.criticalIssues}件の重大な問題があります。詳細はコンソールを確認してください。`, 'error', 6000);
            console.error('予測データ品質レポート:', qualityReport);
        } else if (qualityReport.warnings > 0) {
            showMessage(`予測データに${qualityReport.warnings}件の警告があります。`, 'warning', 4000);
            console.warn('予測データ品質レポート:', qualityReport);
        }
        
        // データ抽出内容を確認（2走分対応）
        this.logRaceHistoryExtraction(horses);
        
        const predictions = this.calculateHorsePredictions(horses);
        
        // 正規化確認のための検証ログ
        const totalWinAfterCalc = predictions.reduce((sum, p) => sum + p.winProbability, 0);
        console.log(`calculateHorsePredictions実行後の勝率合計: ${totalWinAfterCalc.toFixed(1)}%`);
        
        // 予測結果の検証
        const predictionValidation = this.validatePredictionResults(predictions);
        if (!predictionValidation.isValid) {
            console.warn('予測結果に異常があります:', predictionValidation.issues);
            showMessage('予測結果に異常が検出されました。詳細はコンソールを確認してください。', 'warning', 5000);
        }
        
        this.currentPredictions = predictions;
        
        // 高度学習機能による予測強化
        if (typeof EnhancedLearningSystem !== 'undefined') {
            try {
                console.log('🧠 高度学習機能による予測強化開始');
                
                // 特徴量自動発見
                const raceData = {
                    horses: horses.map(horse => ({
                        name: horse.name,
                        odds: parseFloat(horse.odds) || 0,
                        popularity: horse.popularity || estimatePopularityFromOdds(parseFloat(horse.odds)),
                        age: parseInt(horse.age) || 4,
                        weight: parseFloat(horse.weight) || 460,
                        jockey: horse.jockey || '',
                        runningStyle: horse.runningStyle || '差し',
                        lastRace: horse.lastRace,
                        raceHistory: horse.raceHistory || []
                    }))
                };
                
                const featureResult = EnhancedLearningSystem.discoverFeatures(raceData);
                console.log(`🔍 特徴量発見完了: ${Object.keys(featureResult.features).length}個の特徴量`);
                console.log(`🏆 重要特徴量トップ5:`, featureResult.topFeatures.slice(0, 5));
                
                // アンサンブル予測
                const ensembleResult = EnhancedLearningSystem.ensemblePredict(raceData);
                console.log(`🎯 アンサンブル予測完了: 信頼度 ${(ensembleResult.confidence * 100).toFixed(1)}%`);
                
                // グローバル変数にアンサンブル結果を保存（拡張推奨システム用）
                window.lastEnsembleResult = ensembleResult;
                
                // 既存予測結果を強化
                predictions.forEach((prediction, index) => {
                    if (ensembleResult.predictions[index]) {
                        const ensemblePred = ensembleResult.predictions[index];
                        
                        // スケール統一: ensemblePrediction（0-1）を％スケール（0-100）に変換
                        const ensembleScore = ensemblePred.ensemblePrediction * 100;
                        
                        // 元の予測値を保存
                        prediction.originalWinProbability = prediction.winProbability;
                        
                        // アンサンブルスコアを予測に反映（重み25%に調整）
                        const enhancedWinProb = prediction.winProbability * 0.75 + ensembleScore * 0.25;
                        
                        prediction.winProbability = Math.max(0.1, Math.min(99.9, enhancedWinProb));
                        prediction.enhancedScore = ensembleScore; // 0-100スケールで統一
                        prediction.ensembleConfidence = ensemblePred.confidence;
                        prediction.ensembleWeight = 0.25; // 統合重み情報
                        
                        console.log(`📈 ${prediction.name}: 基本${prediction.originalWinProbability.toFixed(1)}% + アンサンブル${ensembleScore.toFixed(1)}% → 強化${prediction.winProbability.toFixed(1)}%`);
                    }
                });
                
                // 勝率を再正規化（総確率を100に調整）
                const totalEnhanced = predictions.reduce((sum, p) => sum + p.winProbability, 0);
                if (totalEnhanced > 0) {
                    const normalizationFactor = 100 / totalEnhanced;
                    predictions.forEach(p => {
                        p.winProbability *= normalizationFactor;
                        p.normalizationFactor = normalizationFactor; // 正規化情報保存
                    });
                    console.log(`🔄 勝率正規化完了: 総和${totalEnhanced.toFixed(1)}% → 100%`);
                }
                
                console.log('✅ 高度学習機能による予測強化完了');
                
            } catch (error) {
                console.error('❌ 高度学習機能エラー:', error);
                showMessage('高度学習機能でエラーが発生しましたが、基本予測は継続します', 'warning', 3000);
            }
        }
        
        // Phase 1: 推奨精度向上システムによる信頼度フィルタリング
        if (typeof ReliabilityFilter !== 'undefined') {
            console.log('🔍 Phase 1: 信頼度フィルタリング適用');
            const filteredPredictions = ReliabilityFilter.filterRecommendations(predictions, null);
            console.log(`フィルタリング結果: ${predictions.length}頭 → ${filteredPredictions.length}頭推奨`);
            
            // フィルタリング結果を元の予測に反映
            predictions.forEach(prediction => {
                const filtered = filteredPredictions.find(f => f.name === prediction.name);
                if (filtered) {
                    prediction.reliability = filtered.reliability;
                    prediction.recommendationLevel = filtered.recommendationLevel;
                    prediction.isRecommended = filtered.isRecommended;
                    prediction.filterReason = filtered.filterReason;
                } else {
                    prediction.isRecommended = false;
                    prediction.filterReason = '信頼度基準未達';
                }
            });
        }
        
        // Phase 2: 投資戦略最適化システム適用
        if (typeof RiskManagementInvestmentSystem !== 'undefined' && typeof KellyBettingSystem !== 'undefined') {
            console.log('💰 Phase 2: 投資戦略最適化システム適用');
            
            // リスク管理ベース投資配分
            const investmentAllocation = RiskManagementInvestmentSystem.calculateOptimalAllocation(predictions);
            
            // ケリー基準による最適賭け金
            const kellyPortfolio = KellyBettingSystem.calculateOptimalPortfolioBetting(predictions);
            
            // 券種別最適化
            if (typeof BetTypeOptimizationSystem !== 'undefined') {
                const marketConditions = {
                    raceClass: 'G1', // デフォルト値（実際のレース情報から取得すべき）
                    weather: '晴',
                    track: '芝',
                    distance: '中距離'
                };
                const betTypeMetrics = BetTypeOptimizationSystem.calculateBetTypeMetrics(predictions, marketConditions);
                const betTypeOptimization = BetTypeOptimizationSystem.determineOptimalBetTypeCombination(betTypeMetrics, 50000);
                
                // 結果を予測データに統合
                predictions.forEach(prediction => {
                    // 投資配分情報
                    const investment = investmentAllocation.investments.find(inv => inv.horse.name === prediction.name);
                    if (investment) {
                        prediction.investmentAmount = investment.amount;
                        prediction.investmentReason = investment.investmentReason;
                    }
                    
                    // ケリー基準情報
                    const kellyBet = kellyPortfolio.bets.find(bet => bet.horse === prediction.name);
                    if (kellyBet) {
                        prediction.kellyOptimalBet = kellyBet.finalBetSize;
                        prediction.kellyExpectedGrowth = kellyBet.expectedGrowthRate;
                        prediction.kellyBettingReason = kellyBet.bettingReason;
                    }
                    
                    // 券種最適化情報
                    prediction.betTypeRecommendations = betTypeOptimization.budgetAllocation;
                });
                
                console.log(`Phase 2統合完了: 投資額=${investmentAllocation.totalInvestment.toLocaleString()}円, ケリー推奨=${kellyPortfolio.totalInvestment.toLocaleString()}円`);
            }
        }
        
        // Phase 3: リアルタイム学習・市場適応システム適用
        if (typeof MarketAdaptationSystem !== 'undefined') {
            console.log('🔄 Phase 3: 市場環境適応システム適用');
            
            // 市場環境適応分析
            const raceData = {
                venue: document.getElementById('raceCourse')?.value || '東京',
                distance: document.getElementById('raceDistance')?.value || '2000',
                trackType: document.getElementById('raceTrackType')?.value || '芝',
                trackCondition: document.getElementById('raceTrackCondition')?.value || '良',
                raceClass: document.getElementById('raceLevel')?.value || '3勝'
            };
            
            // 最近の市場データ（簡易シミュレーション）
            const recentMarketData = this.generateRecentMarketData();
            
            const marketAdaptation = MarketAdaptationSystem.adaptToMarketConditions(raceData, recentMarketData);
            
            // 適応結果を予測データに統合
            predictions.forEach(prediction => {
                prediction.marketAdaptation = {
                    strategyType: marketAdaptation.adaptationStrategy?.strategyType || 'balanced',
                    riskLevel: marketAdaptation.marketAnalysis?.riskLevel || 0.3,
                    venueAdaptation: marketAdaptation.venueAnalysis?.suitability || 0.7,
                    expectedImprovement: marketAdaptation.adaptationStrategy?.expectedImprovement || 0
                };
            });
            
            console.log(`Phase 3市場適応完了: 戦略=${marketAdaptation.adaptationStrategy?.strategyType}, リスク=${((marketAdaptation.marketAnalysis?.riskLevel || 0) * 100).toFixed(1)}%`);
        }
        
        this.displayResults(predictions);
        
        // Phase 1: 信頼度フィルタリング情報を表示
        this.displayPhase1Information();
        
        BettingRecommender.generateBettingRecommendations(predictions);
        
        // 拡張推奨システムも表示
        if (typeof EnhancedRecommendationSystem !== 'undefined') {
            EnhancedRecommendationSystem.displayEnhancedRecommendations(predictions);
            this.updateLearningInputMode();
        }
        
        // Phase 4-6の自動実行
        console.log('🚀 Phase 4-6自動実行開始');
        
        // Phase 4: 詳細分析
        if (typeof generateDetailedAnalysis === 'function') {
            setTimeout(() => {
                console.log('📊 Phase 4: 詳細分析実行中...');
                generateDetailedAnalysis();
                console.log('✅ Phase 4: 詳細分析完了');
                
                // Phase 5: 拡張推奨
                setTimeout(() => {
                    if (typeof generateEnhancedRecommendations === 'function') {
                        console.log('🔍 Phase 5: 拡張推奨実行中...');
                        generateEnhancedRecommendations();
                        console.log('✅ Phase 5: 拡張推奨完了');
                        
                        // Phase 6: Kelly計算
                        setTimeout(() => {
                            if (typeof generateKellyPortfolio === 'function') {
                                console.log('💰 Phase 6: Kelly計算実行中...');
                                generateKellyPortfolio();
                                console.log('✅ Phase 6: Kelly計算完了');
                                
                                // 候補評価プロセスの更新
                                setTimeout(() => {
                                    if (typeof candidateEvaluationVisualizer !== 'undefined') {
                                        candidateEvaluationVisualizer.refreshEvaluation();
                                        console.log('✅ 候補評価プロセス更新完了');
                                    }
                                    console.log('🎉 Phase 4-6自動実行完了');
                                }, 300);
                            }
                        }, 500);
                    }
                }, 500);
            }, 500);
        }
    }

    static calculateHorsePredictions(horses) {
        const adj = LearningSystem.getLearningData().adjustments;
        
        console.log(`=== 予測計算開始 ===`);
        console.log(`対象馬数: ${horses.length}頭`);
        console.log(`入力オッズ: [${horses.map(h => h.odds).join(', ')}]`);
        
        const predictions = horses.map(horse => {
            let score = 50;

            // オッズ評価（学習調整済み）
            let oddsScore = 0;
            if (horse.odds <= CONFIG.ODDS_THRESHOLDS.VERY_LOW) {
                oddsScore = 35;
            } else if (horse.odds <= CONFIG.ODDS_THRESHOLDS.LOW) {
                oddsScore = 25;
            } else if (horse.odds <= CONFIG.ODDS_THRESHOLDS.MEDIUM) {
                oddsScore = 10;
            } else if (horse.odds <= CONFIG.ODDS_THRESHOLDS.HIGH) {
                oddsScore = -5;
            } else if (horse.odds <= CONFIG.ODDS_THRESHOLDS.VERY_HIGH) {
                oddsScore = -10;
            } else {
                oddsScore = -15;
            }
            score += oddsScore * adj.oddsWeight;

            // 過去2走の総合評価（前走重視、2走前も考慮）
            const raceHistoryScore = this.calculateRaceHistoryScore(horse, adj);
            score += raceHistoryScore;

            // 騎手評価（学習調整済み）
            let jockeyScore = 0;
            if (CONFIG.TOP_JOCKEYS.some(jockey => horse.jockey.includes(jockey.replace(/[・\.]/g, '')))) {
                jockeyScore = 8;
            } else if (CONFIG.GOOD_JOCKEYS.some(jockey => horse.jockey.includes(jockey.replace(/[・\.]/g, '')))) {
                jockeyScore = 5;
            } else if (CONFIG.REGULAR_JOCKEYS.some(jockey => horse.jockey.includes(jockey.replace(/[・\.]/g, '')))) {
                jockeyScore = 2;
            }
            score += jockeyScore * adj.jockeyWeight;

            // レースレベル分析スコア追加
            const currentRaceLevel = this.getCurrentRaceLevel();
            const raceDistance = this.getCurrentRaceDistance();
            const trackType = this.getCurrentTrackType();
            const course = this.getCurrentCourse();
            
            if (typeof RaceAnalysisEngine !== 'undefined') {
                const raceAnalysisResult = RaceAnalysisIntegrator.enhancePredictionWithRaceAnalysis(horse, currentRaceLevel, raceDistance, trackType);
                score += raceAnalysisResult.raceAnalysisBonus;
                
                // 予測システム統合検証用詳細ログ（タイム指数分析追加）
                console.log(`=== 予測システム統合検証: ${horse.name} ===`);
                console.log(`📊 基本スコア: ${score - raceAnalysisResult.raceAnalysisBonus}点`);
                console.log(`🎯 レース分析ボーナス: ${raceAnalysisResult.raceAnalysisBonus}点`);
                console.log(`📈 最終スコア: ${score}点`);
                console.log(`🏁 クラス分析: ${raceAnalysisResult.raceAnalysis.classProgression.description}`);
                if (raceAnalysisResult.raceAnalysis.runningStyle) {
                    console.log(`🏃 脚質分析: ${raceAnalysisResult.raceAnalysis.runningStyle.analysis}`);
                    console.log(`💪 脚質効果: ${raceAnalysisResult.raceAnalysis.runningStyle.effectiveness}点`);
                }
                if (raceAnalysisResult.raceAnalysis.timeIndexHistory) {
                    console.log(`⏱️ タイム指数分析: ${raceAnalysisResult.raceAnalysis.timeIndexHistory.analysis}`);
                    console.log(`🎯 平均指数: ${raceAnalysisResult.raceAnalysis.timeIndexHistory.averageTimeIndex} / 最高指数: ${raceAnalysisResult.raceAnalysis.timeIndexHistory.bestTimeIndex}`);
                }
                console.log(`🔧 現在レース条件: ${currentRaceLevel} / ${raceDistance}m / ${trackType}`);
            }
            
            // ペース分析統合
            let paceAnalysisBonus = 0;
            if (typeof PaceAnalyzer !== 'undefined' && horses.length > 0) {
                // 全出走馬データを使用してペース分析実行
                const paceAnalysis = PaceAnalyzer.analyzePaceComprehensive(horses, raceDistance, trackType, course);
                
                // 馬別ペース影響を計算
                const horsePaceImpact = this.calculateHorsePaceImpact(horse, paceAnalysis);
                paceAnalysisBonus = horsePaceImpact.adjustmentScore;
                score += paceAnalysisBonus;
                
                // ペース分析統合詳細ログ
                console.log(`=== ペース分析統合: ${horse.name} ===`);
                console.log(`🏃 予想ペース: ${paceAnalysis.summary.predictedPace}`);
                console.log(`💪 有利脚質: ${paceAnalysis.summary.favoredStyles.join('・')}`);
                console.log(`📊 信頼度: ${paceAnalysis.summary.confidenceLevel}%`);
                console.log(`🎯 馬別ペース調整: ${paceAnalysisBonus}点`);
                console.log(`📈 理由: ${horsePaceImpact.reason}`);
                
                // 馬データにペース分析結果を保存
                horse.paceAnalysis = {
                    overallAnalysis: paceAnalysis.summary,
                    horseSpecific: horsePaceImpact,
                    timestamp: new Date().toISOString()
                };
            }

            // 新しい特徴量の評価
            // 年齢評価
            let ageScore = 0;
            if (horse.age === 3) {
                ageScore = 15; // 3歳馬は成長期
            } else if (horse.age === 4) {
                ageScore = 10; // 4歳馬もまだ成長期
            } else if (horse.age === 5) {
                ageScore = 5; // 5歳馬は成熟期
            } else if (horse.age === 6) {
                ageScore = 0; // 6歳馬は標準
            } else {
                ageScore = -5; // 7歳以上は年齢的不利
            }
            score += ageScore * (adj.ageWeight || 1.0);

            // 馬体重変化評価
            let weightChangeScore = 0;
            if (horse.weightChange === 0) {
                weightChangeScore = 0; // 変化なし
            } else if (horse.weightChange === 1) {
                weightChangeScore = 5; // 適度な増加
            } else if (horse.weightChange === -1) {
                weightChangeScore = -5; // 適度な減少
            } else if (horse.weightChange === 2) {
                weightChangeScore = -10; // 大幅増加は不利
            } else if (horse.weightChange === -2) {
                weightChangeScore = -15; // 大幅減少は不利
            }
            score += weightChangeScore * (adj.weightChangeWeight || 1.0);

            // コース適性評価
            let courseScore = 0;
            if (CONFIG.COURSE_PREFERENCES[horse.course] && CONFIG.COURSE_PREFERENCES[horse.course][horse.trackType]) {
                courseScore = (CONFIG.COURSE_PREFERENCES[horse.course][horse.trackType] - 1) * 20;
            } else {
                // 未対応コースの場合はデフォルト値を使用（地方競馬場など）
                const defaultPreference = horse.trackType === 'ダート' ? 1.0 : 0.9;
                courseScore = (defaultPreference - 1) * 20;
                console.log(`未対応コース (${horse.course}) でデフォルト適性値を使用:`, defaultPreference);
            }
            score += courseScore * (adj.courseWeight || 1.0);

            // 距離適性評価（簡易版）
            let distanceScore = 0;
            if (horse.distance <= 1400) {
                distanceScore = 5; // 短距離適性
            } else if (horse.distance <= 1800) {
                distanceScore = 0; // 中距離
            } else {
                distanceScore = 5; // 長距離適性
            }
            score += distanceScore * (adj.distanceWeight || 1.0);

            // 天候適性評価
            let weatherScore = 0;
            if (CONFIG.WEATHER_PREFERENCES[horse.weather]) {
                weatherScore = (CONFIG.WEATHER_PREFERENCES[horse.weather] - 1) * 10;
            }
            score += weatherScore * (adj.weatherWeight || 1.0);

            // 馬場状態適性評価
            let trackConditionScore = 0;
            if (CONFIG.TRACK_CONDITIONS[horse.trackCondition]) {
                trackConditionScore = (CONFIG.TRACK_CONDITIONS[horse.trackCondition] - 1) * 15;
            }
            score += trackConditionScore * (adj.trackConditionWeight || 1.0);

            // 休養日数評価
            let restDaysScore = 0;
            if (horse.restDays <= 7) {
                restDaysScore = -5; // 短期間の休養は不利
            } else if (horse.restDays <= 14) {
                restDaysScore = 5; // 適度な休養
            } else if (horse.restDays <= 30) {
                restDaysScore = 0; // 標準的な休養
            } else {
                restDaysScore = -10; // 長期の休養は不利
            }
            score += restDaysScore * (adj.restDaysWeight || 1.0);

            // 新しい前走情報の評価
            // 前走タイム評価（距離適性の指標）
            let lastRaceTimeScore = 0;
            if (horse.lastRaceTime && horse.lastRaceDistance && horse.distance) {
                const lastDistance = parseInt(horse.lastRaceDistance);
                const currentDistance = horse.distance;
                
                // 距離変化に対するタイム適性評価
                if (currentDistance > lastDistance) {
                    // 距離延長の場合
                    if (horse.lastRace <= 3) {
                        lastRaceTimeScore = 10; // 短距離で好走なら距離延長に期待
                    } else {
                        lastRaceTimeScore = -5; // 短距離でも振るわなかった場合は不利
                    }
                } else if (currentDistance < lastDistance) {
                    // 距離短縮の場合
                    if (horse.lastRace <= 3) {
                        lastRaceTimeScore = 5; // 長距離で好走なら短縮に期待
                    } else {
                        lastRaceTimeScore = 10; // 長距離で振るわなかった場合は短縮で挽回期待
                    }
                }
            }
            score += lastRaceTimeScore * (adj.lastRaceWeight || 1.0);

            // 前走馬場状態適性評価
            let lastRaceTrackConditionScore = 0;
            if (horse.lastRaceTrackCondition && horse.trackCondition) {
                if (horse.lastRaceTrackCondition === horse.trackCondition) {
                    lastRaceTrackConditionScore = 5; // 同じ馬場状態なら有利
                } else if (horse.lastRaceTrackCondition === '重' && horse.trackCondition === '良') {
                    lastRaceTimeScore = 8; // 重馬場から良馬場への改善は有利
                } else if (horse.lastRaceTrackCondition === '良' && horse.trackCondition === '重') {
                    lastRaceTimeScore = -8; // 良馬場から重馬場への悪化は不利
                }
            }
            score += lastRaceTrackConditionScore * (adj.trackConditionWeight || 1.0);

            // 前走天候適性評価
            let lastRaceWeatherScore = 0;
            if (horse.lastRaceWeather && horse.weather) {
                if (horse.lastRaceWeather === horse.weather) {
                    lastRaceWeatherScore = 3; // 同じ天候なら微有利
                } else if (horse.lastRaceWeather === '雨' && horse.weather === '晴') {
                    lastRaceWeatherScore = 5; // 雨から晴への改善は有利
                } else if (horse.lastRaceWeather === '晴' && horse.weather === '雨') {
                    lastRaceWeatherScore = -5; // 晴から雨への悪化は不利
                }
            }
            score += lastRaceWeatherScore * (adj.weatherWeight || 1.0);

            // 前走斤量変化評価
            let lastRaceWeightChangeScore = 0;
            if (horse.lastRaceWeight > 0) {
                const weightDiff = horse.lastRaceWeight - 56.0; // 標準斤量との差
                if (weightDiff > 2) {
                    lastRaceWeightChangeScore = -5; // 前走が重斤量だった場合は今回有利
                } else if (weightDiff < -2) {
                    lastRaceWeightChangeScore = 5; // 前走が軽斤量だった場合は今回不利
                }
            }
            score += lastRaceWeightChangeScore * (adj.weightChangeWeight || 1.0);

            // 前走オッズ変化評価
            let oddsChangeScore = 0;
            if (horse.lastRaceOdds > 0 && horse.odds > 0) {
                const oddsRatio = horse.odds / horse.lastRaceOdds;
                if (oddsRatio < 0.7) {
                    oddsChangeScore = 10; // オッズが大幅に下がった（人気上昇）
                } else if (oddsRatio > 1.5) {
                    oddsChangeScore = -10; // オッズが大幅に上がった（人気下降）
                }
            }
            score += oddsChangeScore * (adj.oddsWeight || 1.0);

            // 前走人気度評価
            let popularityScore = 0;
            if (horse.lastRacePopularity > 0 && horse.lastRaceHorseCount > 0) {
                const popularityRate = horse.lastRacePopularity / horse.lastRaceHorseCount;
                if (popularityRate <= 0.1) {
                    popularityScore = 8; // 前走が1-2番人気だった場合は今回も期待
                } else if (popularityRate >= 0.5) {
                    popularityScore = -5; // 前走が下位人気だった場合は今回も不安
                }
            }
            score += popularityScore * (adj.popularityBias || 1.0);

            // 前走騎手評価（騎手変更の影響）
            let jockeyChangeScore = 0;
            if (horse.lastRaceJockey && horse.jockey) {
                if (horse.lastRaceJockey === horse.jockey) {
                    jockeyChangeScore = 3; // 同じ騎手なら微有利
                } else {
                    // 騎手ランクの変化を評価
                    const getJockeyRank = (jockey) => {
                        if (CONFIG.TOP_JOCKEYS.some(j => jockey.includes(j.replace(/[・\.]/g, '')))) return 3;
                        if (CONFIG.GOOD_JOCKEYS.some(j => jockey.includes(j.replace(/[・\.]/g, '')))) return 2;
                        return 1;
                    };
                    
                    const lastJockeyRank = getJockeyRank(horse.lastRaceJockey);
                    const currentJockeyRank = getJockeyRank(horse.jockey);
                    
                    if (currentJockeyRank > lastJockeyRank) {
                        jockeyChangeScore = 5; // より良い騎手に変更
                    } else if (currentJockeyRank < lastJockeyRank) {
                        jockeyChangeScore = -5; // より悪い騎手に変更
                    }
                }
            }
            score += jockeyChangeScore * (adj.jockeyWeight || 1.0);

            // 血統評価スコア統合
            const pedigreeScore = this.calculatePedigreeScore(horse);
            score += pedigreeScore;
            
            // 夏競馬補正
            const summerAdjustment = this.applySummerAdjustment(horse);
            score += summerAdjustment;

            // 人気度バイアス調整
            score += adj.popularityBias;

            // スコアを10-90の範囲に調整
            score = Math.max(10, Math.min(90, score));

            // 勝率計算（オッズベース + スコア調整）
            let baseWinRate = 0;
            if (horse.odds <= 2) {
                baseWinRate = 35;
            } else if (horse.odds <= 5) {
                baseWinRate = 20;
            } else if (horse.odds <= 10) {
                baseWinRate = 12;
            } else if (horse.odds <= 20) {
                baseWinRate = 6;
            } else if (horse.odds <= 50) {
                baseWinRate = 2;
            } else if (horse.odds <= 100) {
                baseWinRate = 1;
            } else {
                // 超高オッズ馬：理論値に近づける
                baseWinRate = Math.max(0.2, 100 / horse.odds);
            }

            const scoreAdjustment = (score - 50) * 0.3;
            let winProbability = baseWinRate + scoreAdjustment;
            
            // 最低勝率を理論値に合わせて調整
            const theoreticalMinRate = Math.max(0.1, 100 / horse.odds * 0.8);
            winProbability = Math.max(theoreticalMinRate, Math.min(40, winProbability));

            // 複勝率計算
            let basePlaceRate = 0;
            if (horse.odds <= 3) {
                basePlaceRate = 70;
            } else if (horse.odds <= 7) {
                basePlaceRate = 50;
            } else if (horse.odds <= 15) {
                basePlaceRate = 30;
            } else if (horse.odds <= 30) {
                basePlaceRate = 15;
            } else {
                basePlaceRate = 8;
            }

            const placeProbability = Math.max(winProbability, Math.min(80, basePlaceRate + scoreAdjustment));

            // 複勝オッズ計算
            let placeOdds = 0;
            if (horse.odds <= 3) {
                placeOdds = horse.odds * 0.4;
            } else if (horse.odds <= 10) {
                placeOdds = horse.odds * 0.35;
            } else {
                placeOdds = horse.odds * 0.3;
            }

            // 期待値計算
            const winExpectedValue = (winProbability / 100 * horse.odds - 1);
            const placeExpectedValue = (placeProbability / 100 * placeOdds - 1);

            // 投資効率計算の統合
            let investmentEfficiency = null;
            if (typeof InvestmentEfficiencyCalculator !== 'undefined') {
                const betData = {
                    odds: horse.odds,
                    winProbability: winProbability / 100,
                    betAmount: 1000, // 標準賭け金
                    confidence: Math.min(0.9, Math.max(0.1, score / 100)),
                    popularity: estimatePopularityFromOdds(horse.odds)
                };
                
                investmentEfficiency = InvestmentEfficiencyCalculator.calculateSingleBetEfficiency(betData);
            }

            return {
                ...horse,
                score: Math.round(score * 10) / 10,
                winProbability: Math.round(winProbability * 10) / 10,
                placeProbability: Math.round(placeProbability * 10) / 10,
                winExpectedValue: Math.round(winExpectedValue * 100) / 100,
                placeExpectedValue: Math.round(placeExpectedValue * 100) / 100,
                // 投資効率情報を追加
                investmentEfficiency: investmentEfficiency,
                efficiencyScore: investmentEfficiency ? investmentEfficiency.efficiencyScore : null,
                investmentGrade: investmentEfficiency ? investmentEfficiency.investmentGrade : null,
                isUnderdog: investmentEfficiency ? investmentEfficiency.isUnderdog : false,
                underdogBonus: investmentEfficiency ? investmentEfficiency.underdogBonus : 0,
                kellyFraction: investmentEfficiency ? investmentEfficiency.kellyFraction : 0,
                optimalBetAmount: investmentEfficiency ? investmentEfficiency.optimalBetAmount : 0
            };
        });
        
        // 勝率の正規化処理（合計を100%に調整）
        const totalWinProbability = predictions.reduce((sum, p) => sum + p.winProbability, 0);
        console.log(`正規化前の勝率合計: ${totalWinProbability.toFixed(1)}%`);
        
        if (totalWinProbability > 0) {
            const normalizationFactor = 100 / totalWinProbability;
            console.log(`正規化係数: ${normalizationFactor.toFixed(4)}`);
            
            predictions.forEach(prediction => {
                const originalWinProb = prediction.winProbability;
                prediction.winProbability = Math.round(prediction.winProbability * normalizationFactor * 10) / 10;
                
                // 期待値も再計算
                prediction.winExpectedValue = Math.round((prediction.winProbability / 100 * prediction.odds - 1) * 100) / 100;
                
                // 投資効率も再計算
                if (typeof InvestmentEfficiencyCalculator !== 'undefined' && prediction.investmentEfficiency) {
                    const updatedBetData = {
                        odds: prediction.odds,
                        winProbability: prediction.winProbability / 100,
                        betAmount: 1000,
                        confidence: Math.min(0.9, Math.max(0.1, prediction.score / 100)),
                        popularity: estimatePopularityFromOdds(prediction.odds)
                    };
                    
                    const updatedEfficiency = InvestmentEfficiencyCalculator.calculateSingleBetEfficiency(updatedBetData);
                    prediction.investmentEfficiency = updatedEfficiency;
                    prediction.efficiencyScore = updatedEfficiency.efficiencyScore;
                    prediction.investmentGrade = updatedEfficiency.investmentGrade;
                    prediction.isUnderdog = updatedEfficiency.isUnderdog;
                    prediction.underdogBonus = updatedEfficiency.underdogBonus;
                    prediction.kellyFraction = updatedEfficiency.kellyFraction;
                    prediction.optimalBetAmount = updatedEfficiency.optimalBetAmount;
                }
                
                console.log(`${prediction.name}: ${originalWinProb.toFixed(1)}% → ${prediction.winProbability}%`);
            });
            
            // 正規化後の合計を確認
            const normalizedTotal = predictions.reduce((sum, p) => sum + p.winProbability, 0);
            console.log(`正規化後の勝率合計: ${normalizedTotal.toFixed(1)}%`);
            
            // 微調整（丸め誤差の補正）
            if (Math.abs(normalizedTotal - 100) > 0.1) {
                const difference = 100 - normalizedTotal;
                const maxProbHorse = predictions.reduce((max, horse) => 
                    horse.winProbability > max.winProbability ? horse : max
                );
                maxProbHorse.winProbability = Math.round((maxProbHorse.winProbability + difference) * 10) / 10;
                maxProbHorse.winExpectedValue = Math.round((maxProbHorse.winProbability / 100 * maxProbHorse.odds - 1) * 100) / 100;
                
                const finalTotal = predictions.reduce((sum, p) => sum + p.winProbability, 0);
                console.log(`微調整後の勝率合計: ${finalTotal.toFixed(1)}%`);
            }
        } else {
            // 正規化が不可能な場合の緊急対応
            console.warn('勝率正規化が不可能: totalWinProbability = 0');
            predictions.forEach(prediction => {
                prediction.winProbability = Math.max(0.1, 100 / predictions.length); // 均等配分
                prediction.winExpectedValue = Math.round((prediction.winProbability / 100 * prediction.odds - 1) * 100) / 100;
            });
        }
        
        // 正規化後の最終検証
        const finalWinTotal = predictions.reduce((sum, p) => sum + p.winProbability, 0);
        if (Math.abs(finalWinTotal - 100) > 5) {
            console.error(`緊急対応: 正規化後も大幅な乖離 (${finalWinTotal.toFixed(1)}%)`);
            // 強制的に100%に修正
            const correctionFactor = 100 / finalWinTotal;
            predictions.forEach(prediction => {
                prediction.winProbability = Math.round(prediction.winProbability * correctionFactor * 10) / 10;
                prediction.winExpectedValue = Math.round((prediction.winProbability / 100 * prediction.odds - 1) * 100) / 100;
            });
            console.log(`強制修正後の勝率合計: ${predictions.reduce((sum, p) => sum + p.winProbability, 0).toFixed(1)}%`);
        }
        
        // 複勝率の正規化処理（合計を300%に調整 - 3着まであるため）
        const totalPlaceProbability = predictions.reduce((sum, p) => sum + p.placeProbability, 0);
        const targetPlaceTotal = Math.min(300, predictions.length * 100); // 出走頭数に応じて調整
        if (totalPlaceProbability > 0) {
            const placeNormalizationFactor = targetPlaceTotal / totalPlaceProbability;
            predictions.forEach(prediction => {
                prediction.placeProbability = Math.round(prediction.placeProbability * placeNormalizationFactor * 10) / 10;
                
                // 複勝期待値も再計算
                let placeOdds = 0;
                if (prediction.odds <= 3) {
                    placeOdds = prediction.odds * 0.4;
                } else if (prediction.odds <= 10) {
                    placeOdds = prediction.odds * 0.35;
                } else {
                    placeOdds = prediction.odds * 0.3;
                }
                
                prediction.placeExpectedValue = Math.round((prediction.placeProbability / 100 * placeOdds - 1) * 100) / 100;
            });
        }
        
        // 最終確認と緊急修正
        const finalTotal = predictions.reduce((sum, p) => sum + p.winProbability, 0);
        console.log(`=== 予測計算完了時の最終確認 ===`);
        console.log(`最終勝率合計: ${finalTotal.toFixed(1)}%`);
        console.log(`個別勝率: [${predictions.map(p => p.winProbability.toFixed(1)).join(', ')}]`);
        
        // 緊急修正: 正規化が失敗している場合の強制対応
        if (Math.abs(finalTotal - 100) > 5) {
            console.error(`🚨 緊急事態: 正規化処理が失敗、強制修正を実行`);
            const emergencyFactor = 100 / finalTotal;
            predictions.forEach(prediction => {
                prediction.winProbability = Math.round(prediction.winProbability * emergencyFactor * 10) / 10;
                prediction.winExpectedValue = Math.round((prediction.winProbability / 100 * prediction.odds - 1) * 100) / 100;
            });
            
            const correctedTotal = predictions.reduce((sum, p) => sum + p.winProbability, 0);
            console.log(`緊急修正後の勝率合計: ${correctedTotal.toFixed(1)}%`);
        }
        
        return predictions;
    }

    static displayResults(predictions) {
        // 結果を保存（ソート機能で使用）
        this.currentPredictions = predictions;
        
        const resultsDiv = document.getElementById('results');
        const sortControls = document.getElementById('sortControls');
        
        resultsDiv.classList.remove('hidden');
        
        // 統合買い目推奨システムを実行・表示
        this.displayIntegratedBettingRecommendations(predictions);
        sortControls.style.display = 'block';
        
        // デフォルトはスコア順で表示（Phase 6ではアンサンブル無効化）
        this.renderSortedResults('score');
        
        // selectボックスの初期値も設定
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.value = 'score';
        }
        
        // AI推奨ボタンを有効化
        this.enableAIRecommendationButton();
    }

    static renderSortedResults(sortBy) {
        const container = document.getElementById('resultsContainer');
        
        if (!this.currentPredictions) return;
        
        let sortedPredictions;
        let sortTitle;
        
        switch(sortBy) {
            case 'place':
                sortedPredictions = [...this.currentPredictions].sort((a, b) => b.placeProbability - a.placeProbability);
                sortTitle = '🎯 複勝率順（上位3頭が複勝予測）';
                break;
            case 'win':
                sortedPredictions = [...this.currentPredictions].sort((a, b) => b.winProbability - a.winProbability);
                sortTitle = '🏆 勝率順';
                break;
            case 'odds':
                sortedPredictions = [...this.currentPredictions].sort((a, b) => a.odds - b.odds);
                sortTitle = '💰 オッズ順（人気順）';
                break;
            case 'efficiency':
                sortedPredictions = [...this.currentPredictions].sort((a, b) => (b.efficiencyScore || 0) - (a.efficiencyScore || 0));
                sortTitle = '💎 投資効率順';
                break;
            case 'ensembleScore':
                sortedPredictions = [...this.currentPredictions].sort((a, b) => (b.enhancedScore || b.score) - (a.enhancedScore || a.score));
                sortTitle = '🎯 アンサンブルスコア順';
                break;
            case 'underdog':
                sortedPredictions = [...this.currentPredictions].sort((a, b) => {
                    // 1. 穴馬判定による優先順位
                    if (a.isUnderdog && !b.isUnderdog) return -1;
                    if (!a.isUnderdog && b.isUnderdog) return 1;
                    
                    // 2. 穴馬同士の場合は穴馬ボーナス → 効率スコア順
                    if (a.isUnderdog && b.isUnderdog) {
                        const underdogDiff = (b.underdogBonus || 0) - (a.underdogBonus || 0);
                        if (underdogDiff !== 0) return underdogDiff;
                        return (b.efficiencyScore || 0) - (a.efficiencyScore || 0);
                    }
                    
                    // 3. 非穴馬同士の場合は、穴馬になりやすさ順（オッズ高い順）
                    if (!a.isUnderdog && !b.isUnderdog) {
                        return b.odds - a.odds; // オッズ高い順（大穴順）
                    }
                    
                    return (b.efficiencyScore || 0) - (a.efficiencyScore || 0);
                });
                sortTitle = '🐎 穴馬候補順';
                break;
            case 'expectedValue':
                sortedPredictions = [...this.currentPredictions].sort((a, b) => {
                    // 現実的な期待値計算（複勝）
                    const aExpectedValue = window.ExpectedValueCalculator ? 
                        ExpectedValueCalculator.calculateHorseExpectedValue(a, 'place').expectedValue : 0;
                    const bExpectedValue = window.ExpectedValueCalculator ? 
                        ExpectedValueCalculator.calculateHorseExpectedValue(b, 'place').expectedValue : 0;
                    return bExpectedValue - aExpectedValue;
                });
                sortTitle = '🎯 期待値順';
                break;
            default:
                sortedPredictions = [...this.currentPredictions].sort((a, b) => b.score - a.score);
                sortTitle = '🏆 スコア順';
        }
        
        let html = '<div style="margin-bottom: 20px;">';
        html += `<h4>${sortTitle}</h4>`;
        
        // 複勝率順の場合は上位3頭を強調表示
        if (sortBy === 'place') {
            html += '<p style="color: #f57c00; font-weight: bold; margin-bottom: 15px;">📊 複勝予測上位3頭</p>';
        }
        
        // 穴馬候補順の場合は説明を追加（Phase 4追加）
        if (sortBy === 'underdog') {
            html += '<p style="color: #4caf50; font-weight: bold; margin-bottom: 15px;">🐎💎 穴馬候補が上位表示されています（緑色背景 = 穴馬候補）</p>';
        }
        
        // アンサンブルスコア順の場合は説明を追加
        if (sortBy === 'ensemble') {
            html += '<p style="color: #2196f3; font-weight: bold; margin-bottom: 15px;">🎯 アンサンブルスコア順表示（AI総合判定重視）</p>';
        }
        
        // 投資効率順の場合は説明を追加
        if (sortBy === 'efficiency') {
            html += '<p style="color: #2196f3; font-weight: bold; margin-bottom: 15px;">💎 投資効率スコア順表示（効率重視選択）</p>';
        }
        
        // アンサンブルスコア順の場合は説明を追加
        if (sortBy === 'ensembleScore') {
            html += '<p style="color: #9c27b0; font-weight: bold; margin-bottom: 15px;">🎯 アンサンブルスコア順表示（AIによる総合評価）</p>';
        }
        
        sortedPredictions.forEach((horse, index) => {
            const confidence = horse.score >= CONFIG.SCORE_RANGES.HIGH ? 'high' : 
                             horse.score >= CONFIG.SCORE_RANGES.MEDIUM ? 'medium' : 'low';
            
            // 複勝率順で上位3頭の場合は特別な背景色
            const isTopThreePlace = sortBy === 'place' && index < 3;
            // 穴馬候補の場合は特別な背景色とスタイル（Phase 4追加）
            const isUnderdog = horse.isUnderdog;
            let extraStyle = '';
            if (isTopThreePlace) {
                extraStyle = 'background: linear-gradient(135deg, #fff3e0, #ffe0b2); border: 2px solid #ff9800;';
            } else if (isUnderdog) {
                extraStyle = 'background: linear-gradient(135deg, #e8f5e8, #c8e6c9); border: 2px solid #4caf50; box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);';
            }
            
            const horseNumberDisplay = horse.horseNumber ? `${horse.horseNumber}番 ` : '';
            const underdogIcon = isUnderdog ? ' 🐎💎' : '';
            
            // 血統情報の表示文字列を生成（強化版・エラーハンドリング対応）
            let pedigreeInfo = '';
            try {
                if (horse.pedigreeData) {
                    const pd = horse.pedigreeData;
                    
                    // 基本血統情報
                    if (pd.sireAnalysis?.name) {
                        pedigreeInfo = `<div class="pedigree-info">🧬 ${pd.sireAnalysis.name}`;
                        if (pd.damSireAnalysis?.name) {
                            pedigreeInfo += ` (母父:${pd.damSireAnalysis.name})`;
                        }
                        
                        // 血統総合グレード
                        if (pd.overallRating?.grade) {
                            const gradeColor = this.getGradeColor(pd.overallRating.grade);
                            pedigreeInfo += ` <span class="pedigree-grade" style="color: ${gradeColor}; background: rgba(255,255,255,0.8); padding: 2px 6px; border-radius: 4px;">${pd.overallRating.grade}級</span>`;
                        }
                        
                        // 血統得点表示
                        if (pd.overallRating?.totalScore) {
                            pedigreeInfo += ` <span style="color: #6c757d;">(${pd.overallRating.totalScore}点)</span>`;
                        }
                        
                        pedigreeInfo += '</div>';
                        
                        // 血統特性・適性表示
                        const specialties = [];
                        if (pd.sireAnalysis?.specialty) specialties.push(pd.sireAnalysis.specialty);
                        if (pd.damSireAnalysis?.specialty) specialties.push(`母父:${pd.damSireAnalysis.specialty}`);
                        if (specialties.length > 0) {
                            pedigreeInfo += `<div class="pedigree-specialty">🏃 ${specialties.join(' • ')}</div>`;
                        }
                        
                        // 配合分析結果表示
                        if (pd.matingAnalysis?.compatibility) {
                            const compatibilityClass = pd.matingAnalysis.compatibility >= 80 ? 'mating-excellent' :
                                                       pd.matingAnalysis.compatibility >= 60 ? 'mating-good' : 'mating-poor';
                            const compatibilityText = pd.matingAnalysis.compatibility >= 80 ? '優秀' :
                                                     pd.matingAnalysis.compatibility >= 60 ? '良好' : '注意';
                            pedigreeInfo += `<div class="mating-analysis ${compatibilityClass}">💝 配合${compatibilityText} (${pd.matingAnalysis.compatibility}%)</div>`;
                        }
                        
                        // 血統適性による推奨度表示
                        const pedigreeRecommendation = this.calculatePedigreeRecommendation(pd);
                        if (pedigreeRecommendation) {
                            pedigreeInfo += `<div class="pedigree-recommendation" style="color: ${pedigreeRecommendation.color}; font-weight: bold; margin-top: 3px;">${pedigreeRecommendation.icon} ${pedigreeRecommendation.text}</div>`;
                        }
                        
                        // 穴馬候補判定
                        const sleeper = this.detectSleeper(horse);
                        if (sleeper.isSleeper) {
                            pedigreeInfo += `<div class="sleeper-alert" style="color: #e67e22; font-weight: bold; background: rgba(230,126,34,0.1); padding: 3px 6px; border-radius: 3px; margin-top: 3px;">💎 ${sleeper.reason}</div>`;
                        }
                    } else {
                        // 血統データが不完全な場合
                        pedigreeInfo = `<div class="pedigree-info" style="color: #ffc107; background: rgba(255,193,7,0.1);">⚠️ 血統データが不完全です</div>`;
                    }
                } else {
                    // 血統データが存在しない場合
                    pedigreeInfo = `<div class="pedigree-info" style="color: #6c757d; background: rgba(108,117,125,0.1);">📊 血統データなし</div>`;
                }
            } catch (error) {
                // 血統データ処理エラー時
                console.warn('血統データ表示エラー:', error, horse.name);
                pedigreeInfo = `<div class="pedigree-info" style="color: #dc3545; background: rgba(220,53,69,0.1);">❌ 血統データ処理エラー</div>`;
            }
            
            // 高度学習機能の情報表示
            let enhancedLearningInfo = '';
            if (horse.enhancedScore !== undefined) {
                enhancedLearningInfo += `<div class="enhanced-learning-info" style="background: rgba(33,150,243,0.1); padding: 5px; border-radius: 5px; margin-top: 5px;">`;
                enhancedLearningInfo += `🧠 <strong>高度学習機能</strong><br>`;
                enhancedLearningInfo += `🎯 アンサンブルスコア: ${(horse.enhancedScore || 0).toFixed(1)}%<br>`;
                enhancedLearningInfo += `📊 信頼度: ${(horse.ensembleConfidence * 100).toFixed(1)}%`;
                enhancedLearningInfo += `</div>`;
            }

            html += `
                <div class="result-item confidence-${confidence}" style="${extraStyle}">
                    <div><strong>${index + 1}位: ${horseNumberDisplay}${horse.name}${isTopThreePlace ? ' ⭐' : ''}${underdogIcon}</strong></div>
                    <div>スコア: ${horse.score}</div>
                    <div>勝率: ${horse.winProbability}%</div>
                    <div>複勝率: ${horse.placeProbability}%</div>
                    <div>オッズ: ${horse.odds}倍</div>
                    ${this.generateInvestmentEfficiencyDisplay(horse)}
                    ${this.generateExpectedValueDisplay(horse)}
                    ${enhancedLearningInfo}
                    ${pedigreeInfo}
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    static changeSortOrder(sortBy) {
        this.renderSortedResults(sortBy);
    }

    // 投資効率情報の表示HTML生成
    static generateInvestmentEfficiencyDisplay(horse) {
        try {
            if (!horse.investmentEfficiency) {
                return '';
            }
            
            const efficiency = horse.investmentEfficiency;
            if (!efficiency || typeof efficiency !== 'object') {
                return '';
            }
            
            const gradeColor = this.getInvestmentGradeColor(efficiency.investmentGrade || 'C');
            
            let html = '<div class="investment-efficiency" style="background: rgba(33, 150, 243, 0.1); padding: 8px; margin: 5px 0; border-radius: 5px; border-left: 4px solid #2196f3;">';
            
            // 投資効率スコアとグレード
            const score = efficiency.efficiencyScore || 0;
            const grade = efficiency.investmentGrade || 'C';
            html += `<div style="font-weight: bold; color: ${gradeColor};">💰 効率: ${score.toFixed(1)} (${grade})</div>`;
            
            // 穴馬判定
            if (efficiency.isUnderdog) {
                const bonus = efficiency.underdogBonus || 0;
                html += `<div style="color: #ff9800; font-weight: bold;">🐎 穴馬候補 (+${bonus})</div>`;
            }
            
            // オッズ帯別推奨度表示（Phase 4追加）
            const oddsRecommendation = this.getOddsRecommendation(horse.odds, efficiency.isUnderdog);
            if (oddsRecommendation) {
                html += `<div style="color: ${oddsRecommendation.color}; font-size: 0.9em;">${oddsRecommendation.icon} ${oddsRecommendation.text}</div>`;
            }
            
            // ケリー基準
            const kellyFraction = efficiency.kellyFraction || 0;
            if (kellyFraction > 0) {
                html += `<div>📊 ケリー: ${(kellyFraction * 100).toFixed(1)}%</div>`;
                const optimalAmount = efficiency.optimalBetAmount || 0;
                if (optimalAmount > 0) {
                    html += `<div>💡 推奨額: ${Math.round(optimalAmount).toLocaleString()}円</div>`;
                }
            }
            
            html += '</div>';
            return html;
        } catch (error) {
            console.error('投資効率表示エラー:', error);
            return '<div style="color: #dc3545; font-size: 0.9em;">💰 効率データ取得エラー</div>';
        }
    }
    
    // オッズ帯別推奨度を取得（Phase 4追加）
    static getOddsRecommendation(odds, isUnderdog) {
        if (odds <= 3.0) {
            return {
                icon: '🔥',
                text: '人気馬ゾーン',
                color: '#f44336'
            };
        } else if (odds <= 7.0) {
            return {
                icon: '⚡',
                text: '中堅ゾーン',
                color: '#ff9800'
            };
        } else if (odds <= 15.0) {
            if (isUnderdog) {
                return {
                    icon: '💎',
                    text: '狙い目ゾーン',
                    color: '#4caf50'
                };
            } else {
                return {
                    icon: '📈',
                    text: '中穴ゾーン',
                    color: '#2196f3'
                };
            }
        } else if (odds <= 30.0) {
            if (isUnderdog) {
                return {
                    icon: '🎯',
                    text: '大穴狙いゾーン',
                    color: '#9c27b0'
                };
            } else {
                return {
                    icon: '🎲',
                    text: '大穴ゾーン',
                    color: '#607d8b'
                };
            }
        } else {
            return {
                icon: '💥',
                text: '超大穴ゾーン',
                color: '#795548'
            };
        }
    }
    
    // 期待値表示HTML生成
    static generateExpectedValueDisplay(horse) {
        try {
            if (!window.ExpectedValueCalculator) {
                return '';
            }
            
            // 期待値計算（複勝）
            const placeAnalysis = ExpectedValueCalculator.calculateHorseExpectedValue(horse, 'place');
            
            // 期待値計算（単勝）
            const winAnalysis = ExpectedValueCalculator.calculateHorseExpectedValue(horse, 'win');
            
            let html = '<div class="expected-value" style="background: rgba(102, 126, 234, 0.1); padding: 8px; margin: 5px 0; border-radius: 5px; border-left: 4px solid #667eea;">';
            
            // 期待値と推奨度
            const placeColor = this.getExpectedValueColor(placeAnalysis.expectedValue);
            const winColor = this.getExpectedValueColor(winAnalysis.expectedValue);
            
            html += `<div style="font-weight: bold; color: ${placeColor};">🎯 期待値: 複勝${(placeAnalysis.expectedValue || 0).toFixed(2)} / 単勝${(winAnalysis.expectedValue || 0).toFixed(2)}</div>`;
            html += `<div style="font-size: 0.9em; color: ${placeColor};">推奨: ${this.getRecommendationDisplay(placeAnalysis.recommendation)} (信頼度: ${((placeAnalysis.confidence || 0) * 100).toFixed(0)}%)</div>`;
            
            // 購買指数と購買推奨を追加
            const purchaseColor = this.getPurchaseRecommendationColor(placeAnalysis.purchaseRecommendation);
            html += `<div style="font-size: 0.9em; color: ${purchaseColor};">💰 購買指数: ${(placeAnalysis.purchaseIndex || 0).toFixed(2)} → ${this.getPurchaseRecommendationDisplay(placeAnalysis.purchaseRecommendation)}</div>`;
            html += `<div style="font-size: 0.85em; color: #555;">信頼度スコア: ${(placeAnalysis.confidenceScore || 0).toFixed(2)}</div>`;
            
            // 人気層とアドバイス
            const popularityDisplay = this.getPopularityDisplay(placeAnalysis.popularity);
            html += `<div style="font-size: 0.85em; color: #666;">人気層: ${popularityDisplay}</div>`;
            
            html += '</div>';
            return html;
        } catch (error) {
            console.error('期待値表示生成エラー:', error);
            return '';
        }
    }
    
    // 期待値に応じた色を取得
    static getExpectedValueColor(expectedValue) {
        if (expectedValue >= 1.5) return '#2e7d32'; // 濃い緑
        if (expectedValue >= 1.3) return '#388e3c'; // 緑
        if (expectedValue >= 1.1) return '#f57c00'; // オレンジ
        if (expectedValue >= 1.0) return '#fbc02d'; // 黄色
        return '#d32f2f'; // 赤
    }
    
    // 推奨レベルの表示文字取得
    static getRecommendationDisplay(recommendation) {
        switch (recommendation) {
            case 'excellent': return '🚀 優良';
            case 'good': return '✅ 良好';
            case 'acceptable': return '⚠️ 許容';
            case 'break_even': return '➖ 損益分岐';
            case 'skip': return '❌ 見送り';
            default: return '❓ 不明';
        }
    }
    
    // 購買推奨の表示文字取得
    static getPurchaseRecommendationDisplay(purchaseRecommendation) {
        switch (purchaseRecommendation) {
            case 'strong_buy': return '🔥 強く購入推奨';
            case 'buy': return '✅ 購入推奨';
            case 'weak_buy': return '⚠️ 弱い購入推奨';
            case 'skip': return '❌ 購入見送り';
            default: return '❓ 判定不能';
        }
    }
    
    // 購買推奨の色を取得
    static getPurchaseRecommendationColor(purchaseRecommendation) {
        switch (purchaseRecommendation) {
            case 'strong_buy': return '#d32f2f'; // 濃い赤
            case 'buy': return '#388e3c'; // 緑
            case 'weak_buy': return '#f57c00'; // オレンジ
            case 'skip': return '#757575'; // グレー
            default: return '#666666'; // デフォルトグレー
        }
    }
    
    // 人気層の表示文字取得
    static getPopularityDisplay(popularity) {
        switch (popularity) {
            case 'favorite': return '👑 人気馬';
            case 'midrange': return '🎯 中人気';
            case 'outsider': return '💎 穴馬';
            default: return '❓ 不明';
        }
    }
    
    // 投資グレードに応じた色を取得
    static getInvestmentGradeColor(grade) {
        switch(grade) {
            case 'AAA': return '#d4af37'; // ゴールド
            case 'AA': return '#e74c3c'; // 赤
            case 'A': return '#ff9800'; // オレンジ
            case 'BBB': return '#2196f3'; // 青
            case 'BB': return '#4caf50'; // 緑
            case 'B': return '#9c27b0'; // 紫
            case 'CCC': case 'CC': case 'C': return '#6c757d'; // グレー
            default: return '#6c757d'; // デフォルトグレー
        }
    }
    
    // レース全体の期待値分析表示
    static displayRaceExpectedValueAnalysis(predictions) {
        try {
            if (!window.ExpectedValueCalculator) {
                return;
            }
            
            // レース全体の期待値分析
            const raceAnalysis = ExpectedValueCalculator.analyzeRaceExpectedValue(predictions, 'place');
            
            // 分析結果を表示
            ExpectedValueCalculator.displayExpectedValueAnalysis(raceAnalysis);
            
            // 買い目推奨も生成・表示
            const bettingRecommendations = ExpectedValueCalculator.generateBettingRecommendations(raceAnalysis, 1000);
            this.displayBettingRecommendations(bettingRecommendations);
            
            // 買い目フィルタリングも実行
            this.displayBettingFilterAnalysis(predictions, raceAnalysis.analyzedHorses);
            
        } catch (error) {
            console.error('レース期待値分析エラー:', error);
        }
    }
    
    // 買い目フィルタリング分析表示
    static displayBettingFilterAnalysis(predictions, expectedValueAnalyses) {
        try {
            if (!window.BettingFilter) {
                return;
            }
            
            // 買い目フィルタリング実行
            const filteredResults = BettingFilter.filterRaceBetting(predictions, expectedValueAnalyses);
            
            // フィルタリング結果を表示
            BettingFilter.displayFilteredResults(filteredResults);
            
        } catch (error) {
            console.error('買い目フィルタリングエラー:', error);
        }
    }
    
    // 統合買い目推奨システムの表示
    static displayIntegratedBettingRecommendations(predictions) {
        const container = document.getElementById('integratedBettingContainer');
        if (!container) return;
        
        let html = '';
        
        try {
            // 1. 期待値分析を実行
            const raceAnalysis = ExpectedValueCalculator.analyzeRaceExpectedValue(predictions, 'place');
            const bettingRecommendations = ExpectedValueCalculator.generateBettingRecommendations(raceAnalysis, 1000);
            
            // 2. フィルタリング結果を取得
            let filteredResults = null;
            if (window.BettingFilter) {
                filteredResults = BettingFilter.filterRaceBetting(predictions, raceAnalysis.analyzedHorses);
            }
            
            // 3. Phase 3: 見送り判定を実行
            let skipAnalysis = null;
            if (window.RaceSkipDecisionSystem) {
                skipAnalysis = RaceSkipDecisionSystem.evaluateRaceSkip(predictions, raceAnalysis, bettingRecommendations);
                RaceSkipDecisionSystem.recordSkipDecision(skipAnalysis, predictions);
            }
            
            // 4. 見送り判定結果の表示
            if (skipAnalysis) {
                html += this.generateSkipAnalysisDisplay(skipAnalysis);
            }
            
            // 5. 統合表示の生成（見送りでない場合のみ詳細表示）
            if (!skipAnalysis || !skipAnalysis.shouldSkip) {
                html += '<div style="background: white; border-radius: 10px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">';
                html += '<h4 style="color: #2e7d32; margin-bottom: 15px;">🎯 統合推奨買い目</h4>';
            } else {
                html += '<div style="background: white; border-radius: 10px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); opacity: 0.6;">';
                html += '<h4 style="color: #757575; margin-bottom: 15px;">📋 参考情報（見送り推奨のため）</h4>';
            }
            
            // 期待値推奨の表示
            if (bettingRecommendations && bettingRecommendations.length > 0) {
                html += '<div style="margin-bottom: 20px;">';
                html += '<h5 style="color: #388e3c; margin-bottom: 10px;">📊 期待値ベース推奨</h5>';
                
                bettingRecommendations.forEach(rec => {
                    // データ構造の正規化
                    const betType = this.getBetTypeDisplayName(rec.type) || '複勝';
                    
                    // 馬名情報を正しく取得（複数馬の場合も対応）
                    let horseDisplayInfo = '';
                    if (rec.horses && rec.horses.length > 0) {
                        // ワイドなど複数馬の場合
                        horseDisplayInfo = rec.horses.map(h => 
                            `${h.name || '不明'}(${h.horseNumber || h.number || '?'}番)`
                        ).join(' × ');
                    } else if (rec.horse) {
                        // 単一馬の場合
                        const horseName = rec.horse.name || rec.horseName || '不明';
                        const horseNumber = rec.horse.horseNumber || rec.horseNumber || '?';
                        horseDisplayInfo = `${horseName} <span style="color: #666;">(${horseNumber}番)</span>`;
                    } else {
                        horseDisplayInfo = '不明';
                    }
                    
                    const expectedValue = rec.expectedValue || rec.expectedValue || 0;
                    const amount = rec.amount || rec.recommendedAmount || 300;
                    const confidence = Math.round((rec.confidence || 0) * 100);
                    const estimatedPayout = Math.round(amount * expectedValue);
                    
                    html += `
                        <div style="padding: 12px; margin-bottom: 8px; background: #f1f8e9; border-radius: 8px; border-left: 4px solid #4caf50;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong>${betType}</strong>: ${horseDisplayInfo}
                                </div>
                                <div style="text-align: right;">
                                    <span style="color: #2e7d32; font-weight: bold;">期待値 ${expectedValue.toFixed(2)}</span>
                                </div>
                            </div>
                            <div style="margin-top: 8px; font-size: 0.9em; color: #666;">
                                投資額: ${amount}円 | 
                                推定配当: ${estimatedPayout}円 | 
                                信頼度: ${confidence}%
                            </div>
                            ${rec.reason ? `<div style="margin-top: 5px; font-size: 0.85em; color: #888;">理由: ${rec.reason}</div>` : ''}
                        </div>
                    `;
                });
                
                html += '</div>';
            }
            
            // フィルタリング結果の表示
            if (filteredResults && filteredResults.recommendedBets.length > 0) {
                html += '<div style="margin-bottom: 20px;">';
                html += '<h5 style="color: #388e3c; margin-bottom: 10px;">🔍 フィルタリング済み推奨</h5>';
                
                filteredResults.recommendedBets.forEach(bet => {
                    // 馬名情報を正しく取得
                    const horseNames = bet.horses ? 
                        bet.horses.map(h => h.name).join(' × ') : 
                        (bet.horse?.name || bet.horseName || '不明');
                    
                    html += `
                        <div style="padding: 12px; margin-bottom: 8px; background: #e8f5e8; border-radius: 8px; border-left: 4px solid #66bb6a;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong>${this.getBetTypeDisplayName(bet.betType || bet.type) || '複勝'}</strong>: ${horseNames}
                                </div>
                                <div style="text-align: right;">
                                    <span style="color: #2e7d32;">${bet.recommendation}</span>
                                </div>
                            </div>
                            <div style="margin-top: 8px; font-size: 0.9em; color: #666;">
                                ${bet.reason}
                            </div>
                        </div>
                    `;
                });
                
                html += '</div>';
            }
            
            // 推奨がない場合
            if ((!bettingRecommendations || bettingRecommendations.length === 0) && 
                (!filteredResults || filteredResults.recommendedBets.length === 0)) {
                html += '<div style="text-align: center; color: #666; padding: 20px;">';
                html += '⚠️ 推奨基準を満たす買い目がありません。レース見送りを推奨します。';
                html += '</div>';
            }
            
            html += '</div>';
            
            // 分析データの表示
            if (raceAnalysis && raceAnalysis.analyzedHorses.length > 0) {
                html += '<div style="background: white; border-radius: 10px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">';
                html += '<h4 style="color: #2e7d32; margin-bottom: 15px;">📊 期待値分析データ</h4>';
                html += '<div style="overflow-x: auto;">';
                html += '<table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">';
                html += '<tr style="background: #f1f8e9; color: #2e7d32;">';
                html += '<th style="padding: 10px; border: 1px solid #ddd;">馬名</th>';
                html += '<th style="padding: 10px; border: 1px solid #ddd;">人気層</th>';
                html += '<th style="padding: 10px; border: 1px solid #ddd;">期待値</th>';
                html += '<th style="padding: 10px; border: 1px solid #ddd;">推定確率</th>';
                html += '<th style="padding: 10px; border: 1px solid #ddd;">推定配当</th>';
                html += '<th style="padding: 10px; border: 1px solid #ddd;">推奨</th>';
                html += '</tr>';
                
                raceAnalysis.analyzedHorses.forEach(analysis => {
                    // データ構造の正規化
                    const horseName = analysis.horse?.name || analysis.horseName || '不明';
                    const horseNumber = analysis.horse?.horseNumber || analysis.horseNumber || '?';
                    const popularityTier = analysis.popularity || analysis.popularityTier || 'unknown';
                    const expectedValue = analysis.expectedValue || analysis.expectedValue || 0;
                    const estimatedProbability = (analysis.estimatedProbability || 0) * 100;
                    const estimatedPayout = analysis.estimatedOdds || analysis.estimatedPayout || 0;
                    
                    const recommendationIcon = expectedValue >= 1.3 ? '🚀 優良' : 
                                              expectedValue >= 1.1 ? '⚖️ 良好' : 
                                              expectedValue >= 0.9 ? '🤔 許容' : '❌ 見送り';
                    
                    html += '<tr>';
                    html += `<td style="padding: 8px; border: 1px solid #ddd;">${horseName} (${horseNumber}番)</td>`;
                    html += `<td style="padding: 8px; border: 1px solid #ddd;">${popularityTier}</td>`;
                    html += `<td style="padding: 8px; border: 1px solid #ddd;">${expectedValue.toFixed(2)}</td>`;
                    html += `<td style="padding: 8px; border: 1px solid #ddd;">${estimatedProbability.toFixed(1)}%</td>`;
                    html += `<td style="padding: 8px; border: 1px solid #ddd;">${estimatedPayout}円</td>`;
                    html += `<td style="padding: 8px; border: 1px solid #ddd;">${recommendationIcon}</td>`;
                    html += '</tr>';
                });
                
                html += '</table>';
                html += '</div>';
                html += '</div>';
            }
            
        } catch (error) {
            console.error('統合買い目推奨システムエラー:', error);
            console.error('エラースタック:', error.stack);
            console.error('予測データ:', predictions);
            
            // 詳細なエラー情報を表示
            html = `
                <div style="background: #ffebee; border: 2px solid #f44336; border-radius: 8px; padding: 20px; margin: 10px 0;">
                    <h3 style="color: #c62828; margin-top: 0;">🚨 統合推奨システムエラー</h3>
                    <p><strong>エラー:</strong> ${error.message}</p>
                    <p><strong>予測データ数:</strong> ${predictions ? predictions.length : 'undefined'}</p>
                    <p><strong>デバッグ情報:</strong></p>
                    <ul>
                        <li>ExpectedValueCalculator: ${typeof ExpectedValueCalculator !== 'undefined' ? '✅利用可能' : '❌未定義'}</li>
                        <li>BettingFilter: ${typeof window.BettingFilter !== 'undefined' ? '✅利用可能' : '❌未定義'}</li>
                        <li>RaceSkipDecisionSystem: ${typeof window.RaceSkipDecisionSystem !== 'undefined' ? '✅利用可能' : '❌未定義'}</li>
                    </ul>
                    <p style="font-size: 0.9em; color: #666;">コンソールでより詳細なエラー情報を確認してください。</p>
                </div>
            `;
        }
        
        container.innerHTML = html;
    }
    
    // 券種の英語名を日本語表示名に変換
    static getBetTypeDisplayName(betType) {
        const betTypeMap = {
            'place': '複勝',
            'wide': 'ワイド', 
            'win': '単勝',
            'quinella': '馬連',
            'exacta': '馬単',
            'trio': '3連複',
            'trifecta': '3連単',
            'skip': '見送り'
        };
        
        return betTypeMap[betType] || betType;
    }
    
    // 見送り判定結果の表示生成
    static generateSkipAnalysisDisplay(skipAnalysis) {
        let html = '';
        
        if (skipAnalysis.shouldSkip) {
            html += `
                <div style="background: linear-gradient(135deg, #ffebee 0%, #fce4ec 100%); border: 2px solid #f44336; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                        <span style="font-size: 2em; margin-right: 15px;">⚠️</span>
                        <div>
                            <h3 style="margin: 0; color: #c62828;">レース見送り推奨</h3>
                            <p style="margin: 5px 0 0 0; color: #d32f2f;">信頼度: ${skipAnalysis.confidence.toFixed(1)}%</p>
                        </div>
                    </div>
            `;
        } else {
            html += `
                <div style="background: linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%); border: 2px solid #4caf50; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                        <span style="font-size: 2em; margin-right: 15px;">✅</span>
                        <div>
                            <h3 style="margin: 0; color: #2e7d32;">投資推奨レース</h3>
                            <p style="margin: 5px 0 0 0; color: #388e3c;">投資効率: ${skipAnalysis.investmentEfficiency.toFixed(1)}%</p>
                        </div>
                    </div>
            `;
        }
        
        // 見送り理由または推奨理由
        if (skipAnalysis.reasons && skipAnalysis.reasons.length > 0) {
            html += '<div style="margin-bottom: 15px;">';
            html += `<h4 style="color: ${skipAnalysis.shouldSkip ? '#c62828' : '#2e7d32'}; margin-bottom: 10px;">判定理由:</h4>`;
            html += '<ul style="margin: 0; padding-left: 20px;">';
            skipAnalysis.reasons.slice(0, 5).forEach(reason => {
                html += `<li style="margin-bottom: 5px; color: #666;">${reason}</li>`;
            });
            html += '</ul>';
            html += '</div>';
        } else if (!skipAnalysis.shouldSkip) {
            // 投資推奨の場合の理由表示
            html += '<div style="margin-bottom: 15px;">';
            html += '<h4 style="color: #2e7d32; margin-bottom: 10px;">投資推奨理由:</h4>';
            html += '<ul style="margin: 0; padding-left: 20px;">';
            html += `<li style="margin-bottom: 5px; color: #666;">投資効率${skipAnalysis.investmentEfficiency.toFixed(1)}%が良好</li>`;
            html += '<li style="margin-bottom: 5px; color: #666;">期待値・リスク分析で投資適格と判定</li>';
            html += '</ul>';
            html += '</div>';
        }
        
        // 代替戦略の表示
        if (skipAnalysis.alternativeStrategy) {
            const strategy = skipAnalysis.alternativeStrategy;
            html += `
                <div style="background: rgba(255,193,7,0.1); border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 15px; border-radius: 4px;">
                    <h4 style="color: #f57c00; margin: 0 0 8px 0;">💡 代替戦略: ${strategy.type}</h4>
                    <p style="margin: 0; color: #666;">${strategy.description}</p>
                    ${strategy.recommendedAmount > 0 ? 
                        `<p style="margin: 8px 0 0 0; color: #f57c00; font-weight: bold;">推奨投資額: ${strategy.recommendedAmount}円</p>` : 
                        '<p style="margin: 8px 0 0 0; color: #f57c00; font-weight: bold;">投資見送り</p>'}
                </div>
            `;
        }
        
        // 詳細分析データ（折りたたみ形式）
        html += `
            <details style="margin-top: 15px;">
                <summary style="cursor: pointer; color: #666; font-weight: bold;">📊 詳細分析データを表示</summary>
                <div style="margin-top: 10px; padding: 15px; background: #f9f9f9; border-radius: 8px;">
        `;
        
        const analyses = skipAnalysis.detailedAnalysis;
        
        // 期待値分析
        if (analyses.expectedValue) {
            const ev = analyses.expectedValue;
            html += `
                <div style="margin-bottom: 15px;">
                    <h5 style="color: #1976d2; margin-bottom: 8px;">📈 期待値分析</h5>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 0.9em;">
                        <div>最高期待値: ${ev.maxExpectedValue.toFixed(2)}</div>
                        <div>平均期待値: ${ev.avgExpectedValue.toFixed(2)}</div>
                        <div>推奨買い目数: ${ev.recommendedCount}点</div>
                        <div>見送りスコア: ${ev.skipScore.toFixed(1)}/100</div>
                    </div>
                </div>
            `;
        }
        
        // 投資効率分析
        if (analyses.efficiency) {
            const eff = analyses.efficiency;
            html += `
                <div style="margin-bottom: 15px;">
                    <h5 style="color: #388e3c; margin-bottom: 8px;">💰 投資効率分析</h5>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 0.9em;">
                        <div>総投資額: ${eff.totalInvestment}円</div>
                        <div>期待リターン: ${eff.estimatedReturn.toFixed(0)}円</div>
                        <div>投資効率: ${eff.overallEfficiency.toFixed(1)}%</div>
                        <div>見送りスコア: ${eff.skipScore.toFixed(1)}/100</div>
                    </div>
                </div>
            `;
        }
        
        // リスク分析
        if (analyses.risk) {
            const risk = analyses.risk;
            html += `
                <div style="margin-bottom: 15px;">
                    <h5 style="color: #f44336; margin-bottom: 8px;">⚠️ リスク分析</h5>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 0.9em;">
                        <div>高リスク買い目: ${risk.highRiskBetsCount}点</div>
                        <div>平均信頼度: ${risk.avgConfidence.toFixed(1)}%</div>
                        <div>リスク分布: 高${risk.riskDistribution.high}/中${risk.riskDistribution.medium}/低${risk.riskDistribution.low}</div>
                        <div>見送りスコア: ${risk.skipScore.toFixed(1)}/100</div>
                    </div>
                </div>
            `;
        }
        
        html += `
                </div>
            </details>
        </div>
        `;
        
        return html;
    }
    
    // 期待値ベース買い目推奨の表示
    static displayBettingRecommendations(recommendations) {
        const container = document.getElementById('expectedValueBettingContainer');
        if (!container) return;
        
        let html = `
            <div style="background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 15px 0; text-align: center;">🎯 期待値ベース買い目推奨</h3>
                <div style="font-size: 0.9em; text-align: center; opacity: 0.9;">
                    科学的根拠に基づく投資判断（トリガミ対策済み）
                </div>
                <div style="font-size: 0.85em; text-align: center; opacity: 0.8; margin-top: 10px;">
                    期待値1.3以上を推奨 | 市場効率性・胴元優位性考慮済み
                </div>
            </div>
        `;
        
        if (recommendations.length === 0) {
            html += `
                <div style="background: #ffebee; color: #c62828; padding: 15px; border-radius: 8px; text-align: center;">
                    <strong>📊 本日は見送りをお勧めします</strong><br>
                    <small>期待値の高い馬券が見つかりませんでした</small>
                </div>
            `;
        } else {
            recommendations.forEach(rec => {
                if (rec.type === 'skip') {
                    html += `
                        <div style="background: #ffebee; color: #c62828; padding: 15px; border-radius: 8px; margin: 10px 0;">
                            <strong>❌ 見送り推奨</strong><br>
                            <small>${rec.reason}</small><br>
                            <small>${rec.detail || `平均期待値: ${rec.expectedValue.toFixed(2)}`}</small>
                        </div>
                    `;
                } else {
                    const confidenceColor = rec.confidence >= 0.7 ? '#2e7d32' : rec.confidence >= 0.5 ? '#f57c00' : '#d32f2f';
                    const popularityDisplay = this.getPopularityDisplay(rec.popularity);
                    
                    html += `
                        <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin: 10px 0; border-left: 4px solid ${this.getExpectedValueColor(rec.expectedValue)};">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <strong style="font-size: 1.1em;">${rec.type === 'place' ? '複勝' : rec.type === 'wide' ? 'ワイド' : rec.type}</strong>
                                <span style="background: ${confidenceColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8em;">
                                    信頼度: ${(rec.confidence * 100).toFixed(0)}%
                                </span>
                            </div>
                            <div style="color: #333; font-size: 1em; font-weight: bold; margin-bottom: 8px;">
                                ${rec.horses ? 
                                    `${rec.horses.map(h => `${h.name || '馬' + h.number}(${h.number}番)`).join(' × ')}` : 
                                    `${rec.horse.name || '馬' + rec.horse.number}(${rec.horse.number}番)`
                                }
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
                                <div>
                                    <span style="font-size: 0.9em; color: #666;">投資額</span><br>
                                    <strong style="color: #2e7d32;">${rec.amount}円</strong>
                                </div>
                                <div>
                                    <span style="font-size: 0.9em; color: #666;">期待値</span><br>
                                    <strong style="color: ${this.getExpectedValueColor(rec.expectedValue)};">${rec.expectedValue.toFixed(2)}</strong>
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px;">
                                <div>
                                    <span style="font-size: 0.9em; color: #666;">人気層</span><br>
                                    <span style="font-size: 0.9em;">${popularityDisplay}</span>
                                </div>
                                <div>
                                    <span style="font-size: 0.9em; color: #666;">推定配当</span><br>
                                    <span style="font-size: 0.9em;">${rec.estimatedOdds ? Math.round(rec.estimatedOdds) + '円' : '未計算'}</span>
                                </div>
                            </div>
                            <div style="font-size: 0.85em; color: #666; margin-top: 10px; padding-top: 8px; border-top: 1px solid #eee;">
                                💡 ${rec.reason}
                            </div>
                        </div>
                    `;
                }
            });
        }
        
        container.innerHTML = html;
    }

    // 血統グレードに応じた色を取得
    static getGradeColor(grade) {
        switch(grade) {
            case 'S': return '#d4af37'; // ゴールド
            case 'A': return '#e74c3c'; // 赤
            case 'B': return '#3498db'; // 青
            case 'C': return '#2ecc71'; // 緑
            case 'D': return '#95a5a6'; // グレー
            default: return '#6c757d'; // デフォルトグレー
        }
    }

    // 血統適性による推奨度を計算
    static calculatePedigreeRecommendation(pedigreeData) {
        if (!pedigreeData) return null;
        
        let score = 0;
        let factors = [];
        
        // 総合評価グレードによる基本スコア
        if (pedigreeData.overallRating?.grade) {
            switch(pedigreeData.overallRating.grade) {
                case 'S': score += 20; factors.push('S級血統'); break;
                case 'A': score += 15; factors.push('A級血統'); break;
                case 'B': score += 10; factors.push('B級血統'); break;
                case 'C': score += 5; factors.push('C級血統'); break;
                case 'D': score += 0; factors.push('D級血統'); break;
            }
        }
        
        // 配合評価による加算
        if (pedigreeData.matingAnalysis?.compatibility) {
            const compatibility = pedigreeData.matingAnalysis.compatibility;
            if (compatibility >= 90) {
                score += 15; factors.push('配合絶好');
            } else if (compatibility >= 80) {
                score += 10; factors.push('配合優秀');
            } else if (compatibility >= 60) {
                score += 5; factors.push('配合良好');
            } else {
                score -= 5; factors.push('配合注意');
            }
        }
        
        // 父系・母父系の特殊評価
        if (pedigreeData.sireAnalysis?.name) {
            const sireName = pedigreeData.sireAnalysis.name;
            // 超一流種牡馬の特別評価
            if (['ディープインパクト', 'オルフェーヴル', 'ロードカナロア', 'キズナ'].includes(sireName)) {
                score += 8; factors.push('超一流父');
            }
        }
        
        // 推奨レベルを決定
        if (score >= 30) {
            return {
                text: '血統的に強く推奨',
                icon: '🌟',
                color: '#d4af37',
                level: 'excellent'
            };
        } else if (score >= 20) {
            return {
                text: '血統的に推奨',
                icon: '⭐',
                color: '#e74c3c',
                level: 'good'
            };
        } else if (score >= 10) {
            return {
                text: '血統的に注目',
                icon: '✨',
                color: '#3498db',
                level: 'fair'
            };
        } else if (score >= 5) {
            return {
                text: '血統的に普通',
                icon: '📊',
                color: '#2ecc71',
                level: 'average'
            };
        } else {
            return {
                text: '血統的に厳しい',
                icon: '⚠️',
                color: '#e67e22',
                level: 'poor'
            };
        }
    }

    // 穴馬候補を検出
    static detectSleeper(horse) {
        const reasons = [];
        let sleeperScore = 0;
        
        // 現在の季節を取得
        const month = new Date().getMonth() + 1;
        const isSummer = month >= 6 && month <= 9;
        
        // 夏競馬特有の穴馬パターン
        if (isSummer) {
            // 夏場の高オッズ馬（6倍以上）で条件が良い馬
            if (horse.odds >= 6) {
                sleeperScore += 10;
                
                // 休み明けでフレッシュ
                if (horse.restDays >= 42) {
                    sleeperScore += 15;
                    reasons.push('休み明けで夏場に好調');
                }
                
                // 若い馬の夏デビュー
                if (horse.age <= 4) {
                    sleeperScore += 10;
                    reasons.push('若駒で成長期待');
                }
                
                // ダート血統が芝に挑戦（意外性）
                if (horse.pedigreeData?.sireAnalysis?.specialties?.includes('ダート') && 
                    this.getCurrentTrackType() === '芝') {
                    sleeperScore += 8;
                    reasons.push('ダート血統の芝挑戦');
                }
                
                // 地方馬の中央挑戦
                if (horse.jockey && (horse.jockey.includes('地方') || horse.trainer?.includes('地方'))) {
                    sleeperScore += 12;
                    reasons.push('地方馬の中央挑戦');
                }
            }
        }
        
        // オールシーズン穴馬パターン
        if (horse.odds >= 8) {
            // 前走で好走（3着以内）していた馬
            if (horse.lastRace <= 3) {
                sleeperScore += 20;
                reasons.push('前走好走で巻き返し期待');
            }
            
            // 距離適性が抜群の血統
            if (horse.pedigreeData) {
                const distance = this.getCurrentRaceDistance();
                const sire = horse.pedigreeData.sireAnalysis;
                if (sire?.distance && sire.distance[distance] >= 90) {
                    sleeperScore += 15;
                    reasons.push('距離適性抜群の血統');
                }
            }
            
            // 騎手変更で騎乗技術向上期待
            if (CONFIG.TOP_JOCKEYS.some(jockey => horse.jockey.includes(jockey.replace(/[・\.]/g, '')))) {
                sleeperScore += 10;
                reasons.push('トップ騎手に乗り替わり');
            }
            
            // 馬体重の大幅な変化（調整効果）
            if (Math.abs(horse.weightChange) >= 10) {
                if (horse.weightChange > 0) {
                    sleeperScore += 5;
                    reasons.push('馬体重増加で充実');
                } else {
                    sleeperScore += 8;
                    reasons.push('減量で身軽さアップ');
                }
            }
        }
        
        // 夏場の特殊条件
        if (isSummer) {
            // 北海道開催での地元有利
            const course = this.getCurrentCourse();
            if ((course === '札幌' || course === '函館') && horse.trainer?.includes('北海道')) {
                sleeperScore += 8;
                reasons.push('北海道開催で地元有利');
            }
            
            // 夏負けしにくい血統
            const strongSummerSires = ['ステイゴールド', 'ヴィクトワールピサ', 'ゴールドアリュール'];
            if (horse.pedigreeData?.sireAnalysis?.name && 
                strongSummerSires.includes(horse.pedigreeData.sireAnalysis.name)) {
                sleeperScore += 6;
                reasons.push('夏に強い血統');
            }
        }
        
        // スコアが20以上で穴馬候補と判定
        return {
            isSleeper: sleeperScore >= 20,
            score: sleeperScore,
            reason: reasons.length > 0 ? `穴馬候補: ${reasons.join('・')}` : '穴馬要因なし'
        };
    }
    
    // 現在のレース条件取得メソッド
    static getCurrentRaceDistance() {
        const distanceElement = document.getElementById('raceDistance');
        return distanceElement ? parseInt(distanceElement.value) : 1600;
    }
    
    static getCurrentTrackType() {
        const trackElement = document.getElementById('raceTrackType');
        return trackElement ? trackElement.value : '芝';
    }
    
    static getCurrentCourse() {
        const courseElement = document.getElementById('raceCourse');
        return courseElement ? courseElement.value : '東京';
    }
    
    static getCurrentRaceLevel() {
        const levelElement = document.getElementById('raceLevel');
        return levelElement ? levelElement.value : '1勝';
    }
    
    // 夏競馬補正を適用
    static applySummerAdjustment(horse) {
        const month = new Date().getMonth() + 1;
        const isSummer = month >= 6 && month <= 9;
        
        if (!isSummer) return 0;
        
        let adjustment = 0;
        
        // 夏場の荒れ要因を考慮した補正
        
        // 1. 人気馬の信頼度低下（夏は荒れやすい）
        if (horse.odds <= 3) {
            adjustment -= 3; // 人気馬のスコアを下げる
        } else if (horse.odds >= 8) {
            adjustment += 2; // 高オッズ馬のスコアを少し上げる
        }
        
        // 2. 夏負けしやすい血統
        const summerWeakSires = ['ディープインパクト', 'キングカメハメハ'];
        if (horse.pedigreeData?.sireAnalysis?.name && 
            summerWeakSires.includes(horse.pedigreeData.sireAnalysis.name)) {
            adjustment -= 2;
        }
        
        // 3. 夏に強い血統
        const summerStrongSires = ['ステイゴールド', 'ゴールドアリュール', 'クロフネ'];
        if (horse.pedigreeData?.sireAnalysis?.name && 
            summerStrongSires.includes(horse.pedigreeData.sireAnalysis.name)) {
            adjustment += 3;
        }
        
        // 4. 北海道開催の特別補正
        const course = this.getCurrentCourse();
        if (course === '札幌' || course === '函館') {
            // 涼しい気候での開催
            if (horse.pedigreeData?.sireAnalysis?.specialties?.includes('芝')) {
                adjustment += 2; // 芝血統にプラス
            }
            
            // 距離適性重視（広いコース）
            const distance = this.getCurrentRaceDistance();
            if (distance >= 2000 && horse.pedigreeData?.sireAnalysis?.specialties?.includes('長距離')) {
                adjustment += 2;
            }
        }
        
        // 5. 小倉開催の特別補正
        if (course === '小倉') {
            // 小回りコースでスピード重視
            if (horse.pedigreeData?.sireAnalysis?.specialties?.includes('短距離') ||
                horse.pedigreeData?.sireAnalysis?.specialties?.includes('スピード')) {
                adjustment += 2;
            }
        }
        
        // 6. 夏場の馬体重管理
        if (horse.weightChange <= -8) {
            adjustment += 1; // 夏バテ対策の減量
        } else if (horse.weightChange >= 10) {
            adjustment -= 1; // 夏場の増量は不利
        }
        
        // 7. 若馬の夏場成長
        if (horse.age <= 4) {
            adjustment += 1; // 若馬は夏場に成長
        }
        
        return adjustment;
    }

    static getCurrentPredictions() {
        return this.currentPredictions;
    }

    // 学習入力モードの更新
    static updateLearningInputMode() {
        const enhancedInput = document.getElementById('enhancedLearningInput');
        const simpleInput = document.getElementById('simpleLearningInput');
        
        if (enhancedInput && simpleInput) {
            // 拡張推奨が表示されている場合は拡張学習入力を表示
            if (window.currentWatchList && window.currentStrategies) {
                enhancedInput.style.display = 'block';
                simpleInput.style.display = 'none';
                this.updateEnhancedLearningFields();
            } else {
                enhancedInput.style.display = 'none';
                simpleInput.style.display = 'block';
            }
        }
    }

    // 拡張学習フィールドの動的生成
    static updateEnhancedLearningFields() {
        const watchListResults = document.getElementById('watchListResults');
        const strategyResults = document.getElementById('strategyResults');
        
        if (!watchListResults || !strategyResults || !window.currentWatchList || !window.currentStrategies) {
            return;
        }

        // 注目馬結果フィールド
        let watchHtml = '';
        Object.entries(EnhancedRecommendationSystem.confidenceLevels).forEach(([level, config]) => {
            const horses = window.currentWatchList.byLevel[level] || [];
            if (horses.length > 0) {
                watchHtml += `
                    <div style="margin: 8px 0;">
                        <label style="font-size: 0.9em; color: #2e7d32;">${config.symbol} ${config.name} (${horses.length}頭):</label>
                        <select id="watchLevel_${level}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; margin-top: 3px;">
                            <option value="">選択してください</option>
                            <option value="hit_1st">1着的中</option>
                            <option value="hit_2nd">2着的中</option>
                            <option value="hit_3rd">3着的中</option>
                            <option value="miss">3着圏外</option>
                        </select>
                    </div>
                `;
            }
        });
        watchListResults.innerHTML = watchHtml;

        // 戦略結果フィールド
        let strategyHtml = '';
        Object.entries(window.currentStrategies).forEach(([strategyKey, strategy]) => {
            strategyHtml += `
                <div style="margin: 8px 0;">
                    <label style="font-size: 0.9em; color: #2e7d32;">${strategy.name} (${strategy.horses.length}頭):</label>
                    <select id="strategy_${strategyKey}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; margin-top: 3px;">
                        <option value="">選択してください</option>
                        <option value="hit">✅ 的中</option>
                        <option value="miss">❌ 外れ</option>
                        <option value="not-used">➖ 使用せず</option>
                    </select>
                </div>
            `;
        });
        strategyResults.innerHTML = strategyHtml;
    }

    static getAllHorses() {
        const horseCards = document.querySelectorAll('.horse-card');
        const horses = [];
        
        horseCards.forEach(card => {
            const horseName = card.querySelector('input[name="horseName"]').value || '名前未入力';
            const odds = parseFloat(card.querySelector('input[name="odds"]').value) || 10;
            const lastRace = parseInt(card.querySelector('select[name="lastRace"]').value) || 6;
            
            const jockeySelect = card.querySelector('select[name="jockey"]');
            const jockeyCustom = card.querySelector('input[name="jockeyCustom"]');
            let jockey = '';
            
            if (jockeySelect.value === 'custom') {
                jockey = jockeyCustom.value || '騎手未入力';
            } else {
                jockey = jockeySelect.value || '騎手未入力';
            }

            // 新しい特徴量を取得
            const age = parseInt(card.querySelector('select[name="age"]').value) || 5;
            const weightChange = parseInt(card.querySelector('select[name="weightChange"]').value) || 0;
            const course = card.querySelector('select[name="course"]').value || '中山';
            const distance = parseInt(card.querySelector('select[name="distance"]').value) || 1600;
            const trackType = card.querySelector('select[name="trackType"]').value || '芝';
            const weather = card.querySelector('select[name="weather"]').value || '晴';
            const trackCondition = card.querySelector('select[name="trackCondition"]').value || '良';
            const restDays = parseInt(card.querySelector('select[name="restDays"]').value) || 14;

            horses.push({
                name: horseName,
                odds: odds,
                lastRace: lastRace,
                jockey: jockey,
                // 新しい特徴量
                age: age,
                weightChange: weightChange,
                course: course,
                distance: distance,
                trackType: trackType,
                weather: weather,
                trackCondition: trackCondition,
                restDays: restDays
            });
        });

        return horses;
    }
    
    /**
     * 馬別ペース影響計算
     * @param {Object} horse - 馬データ
     * @param {Object} paceAnalysis - ペース分析結果
     * @returns {Object} 馬別ペース影響
     */
    static calculateHorsePaceImpact(horse, paceAnalysis) {
        const style = horse.runningStyle || '先行';
        const baseScore = horse.score || 50;
        
        // ペース分析からの基本影響
        const paceScenario = paceAnalysis.summary.predictedPace;
        const favoredStyles = paceAnalysis.summary.favoredStyles;
        const confidenceLevel = paceAnalysis.summary.confidenceLevel;
        
        // 脚質がペース有利リストに含まれているかチェック
        const isStyleFavored = favoredStyles.includes(style);
        
        // 基本調整スコア計算
        let adjustmentScore = 0;
        
        if (isStyleFavored) {
            // 有利脚質の場合
            if (confidenceLevel >= 80) {
                adjustmentScore = 8; // 高信頼度で有利
            } else if (confidenceLevel >= 60) {
                adjustmentScore = 5; // 中信頼度で有利
            } else {
                adjustmentScore = 3; // 低信頼度で有利
            }
        } else {
            // 不利脚質の場合
            if (confidenceLevel >= 80) {
                adjustmentScore = -5; // 高信頼度で不利
            } else if (confidenceLevel >= 60) {
                adjustmentScore = -3; // 中信頼度で不利
            } else {
                adjustmentScore = -1; // 低信頼度で不利
            }
        }
        
        // ペース詳細分析からの追加調整
        if (paceAnalysis.detailed && paceAnalysis.detailed.paceImpact) {
            const horseImpacts = paceAnalysis.detailed.paceImpact.horseImpacts;
            const horseImpact = horseImpacts.find(h => h.horseName === horse.name);
            
            if (horseImpact) {
                const paceAdjustment = horseImpact.adjustedScore - horseImpact.originalScore;
                adjustmentScore += Math.round(paceAdjustment * 0.5); // 50%の重みで反映
            }
        }
        
        // 調整スコアの範囲制限
        adjustmentScore = Math.max(-10, Math.min(10, adjustmentScore));
        
        // 理由の生成
        let reason = '';
        if (adjustmentScore > 3) {
            reason = `${style}戦法が${paceScenario}で大きく有利（信頼度${confidenceLevel}%）`;
        } else if (adjustmentScore > 0) {
            reason = `${style}戦法が${paceScenario}でやや有利（信頼度${confidenceLevel}%）`;
        } else if (adjustmentScore < -3) {
            reason = `${style}戦法が${paceScenario}で大きく不利（信頼度${confidenceLevel}%）`;
        } else if (adjustmentScore < 0) {
            reason = `${style}戦法が${paceScenario}でやや不利（信頼度${confidenceLevel}%）`;
        } else {
            reason = `${style}戦法への${paceScenario}の影響は中立（信頼度${confidenceLevel}%）`;
        }
        
        return {
            adjustmentScore,
            reason,
            paceScenario,
            isStyleFavored,
            confidenceLevel,
            originalScore: baseScore,
            adjustedScore: baseScore + adjustmentScore
        };
    }

    // AI推奨ボタンを有効化
    static enableAIRecommendationButton() {
        const aiButton = document.querySelector('button[onclick="getAIRecommendation()"]');
        if (aiButton) {
            aiButton.disabled = false;
            aiButton.style.opacity = '1';
            aiButton.style.cursor = 'pointer';
        }
    }

    // AI推奨を取得（グローバル関数からも呼び出し可能）
    static async requestAIRecommendation() {
        if (!this.currentPredictions || this.currentPredictions.length === 0) {
            if (typeof showMessage === 'function') {
                showMessage('先に「🚀 予測開始」を実行してください', 'warning');
            } else {
                alert('先に「🚀 予測開始」を実行してください');
            }
            return;
        }

        try {
            await AIRecommendationService.getAIRecommendation(this.currentPredictions);
        } catch (error) {
            console.error('AI推奨の取得でエラー:', error);
            if (typeof showMessage === 'function') {
                showMessage('AI推奨の取得に失敗しました', 'error');
            }
        }
    }

    // 過去2走のレース履歴抽出ログ
    static logRaceHistoryExtraction(horses) {
        console.log('=== 馬データ抽出完了（過去2走対応） ===');
        console.log(`抽出馬数: ${horses.length}頭`);
        
        horses.forEach((horse, index) => {
            console.log(`\n--- 馬${index + 1}: ${horse.name} ---`);
            console.log(`オッズ: ${horse.odds}倍`);
            console.log(`騎手: ${horse.jockey}`);
            console.log(`前走着順: ${horse.lastRace || '?'}着`);
            
            // 前走データの確認
            if (horse.lastRaceCourse || horse.lastRaceTime || horse.lastRaceAgari) {
                console.log(`前走: ${horse.lastRaceCourse || '?'} ${horse.lastRaceDistance || '?'}m ${horse.lastRaceTrackType || '?'} ${horse.lastRaceAgari || '?'}秒`);
                console.log(`前走詳細: ${horse.lastRaceDate || '?'} 斤量${horse.lastRaceWeight || '?'}kg 人気${horse.lastRacePopularity || '?'}番`);
            } else {
                console.log(`前走: データなし`);
            }
            
            // 2走前データの確認
            if (horse.secondLastRaceCourse || horse.secondLastRaceTime || horse.secondLastRaceAgari) {
                console.log(`2走前: ${horse.secondLastRaceCourse || '?'} ${horse.secondLastRaceDistance || '?'}m ${horse.secondLastRaceTrackType || '?'} ${horse.secondLastRaceAgari || '?'}秒`);
                console.log(`2走前詳細: ${horse.secondLastRaceDate || '?'} 斤量${horse.secondLastRaceWeight || '?'}kg 人気${horse.secondLastRacePopularity || '?'}番 ${horse.secondLastRaceOrder || '?'}着`);
            } else {
                console.log(`2走前: データなし`);
            }
            
            // 3走前データの確認
            if (horse.thirdLastRaceCourse || horse.thirdLastRaceTime || horse.thirdLastRaceAgari) {
                console.log(`3走前: ${horse.thirdLastRaceCourse || '?'} ${horse.thirdLastRaceDistance || '?'}m ${horse.thirdLastRaceTrackType || '?'} ${horse.thirdLastRaceAgari || '?'}秒`);
                console.log(`3走前詳細: ${horse.thirdLastRaceDate || '?'} 斤量${horse.thirdLastRaceWeight || '?'}kg 人気${horse.thirdLastRacePopularity || '?'}番 ${horse.thirdLastRaceOrder || '?'}着`);
            } else {
                console.log(`3走前: データなし`);
            }
            
            // 4走前データの確認
            if (horse.fourthLastRaceCourse || horse.fourthLastRaceTime || horse.fourthLastRaceAgari) {
                console.log(`4走前: ${horse.fourthLastRaceCourse || '?'} ${horse.fourthLastRaceDistance || '?'}m ${horse.fourthLastRaceTrackType || '?'} ${horse.fourthLastRaceAgari || '?'}秒`);
                console.log(`4走前詳細: ${horse.fourthLastRaceDate || '?'} 斤量${horse.fourthLastRaceWeight || '?'}kg 人気${horse.fourthLastRacePopularity || '?'}番 ${horse.fourthLastRaceOrder || '?'}着`);
            } else {
                console.log(`4走前: データなし`);
            }
            
            // 5走前データの確認
            if (horse.fifthLastRaceCourse || horse.fifthLastRaceTime || horse.fifthLastRaceAgari) {
                console.log(`5走前: ${horse.fifthLastRaceCourse || '?'} ${horse.fifthLastRaceDistance || '?'}m ${horse.fifthLastRaceTrackType || '?'} ${horse.fifthLastRaceAgari || '?'}秒`);
                console.log(`5走前詳細: ${horse.fifthLastRaceDate || '?'} 斤量${horse.fifthLastRaceWeight || '?'}kg 人気${horse.fifthLastRacePopularity || '?'}番 ${horse.fifthLastRaceOrder || '?'}着`);
            } else {
                console.log(`5走前: データなし`);
            }
            
            // パフォーマンス傾向分析（5走分のトレンド）
            const raceOrders = [
                this.parseRaceOrder(horse.lastRaceOrder) || this.parseRaceOrder(horse.lastRace),
                this.parseRaceOrder(horse.secondLastRaceOrder),
                this.parseRaceOrder(horse.thirdLastRaceOrder),
                this.parseRaceOrder(horse.fourthLastRaceOrder),
                this.parseRaceOrder(horse.fifthLastRaceOrder)
            ].filter(order => order && order !== 99); // 中止を除外
            
            if (raceOrders.length >= 2) {
                // 直近3走のトレンド分析（指数関数的重み付け）
                const weights = [1.0, 0.82, 0.67]; // 前走、2走前、3走前の重み
                let weightedSum = 0;
                let weightSum = 0;
                
                for (let i = 0; i < Math.min(raceOrders.length, 3); i++) {
                    weightedSum += raceOrders[i] * weights[i];
                    weightSum += weights[i];
                }
                
                const recentAverage = weightedSum / weightSum;
                
                // 直近2走の変化
                if (raceOrders.length >= 2) {
                    const recentChange = raceOrders[1] - raceOrders[0]; // 2走前→前走
                    if (recentChange > 1) {
                        console.log(`📈 直近向上: ${raceOrders[1]}着→${raceOrders[0]}着 (+${recentChange}) 重み付き平均: ${recentAverage.toFixed(1)}着`);
                    } else if (recentChange < -1) {
                        console.log(`📉 直近悪化: ${raceOrders[1]}着→${raceOrders[0]}着 (${recentChange}) 重み付き平均: ${recentAverage.toFixed(1)}着`);
                    } else {
                        console.log(`➡️ 直近安定: ${raceOrders[1]}着→${raceOrders[0]}着 重み付き平均: ${recentAverage.toFixed(1)}着`);
                    }
                }
                
                // 5走の全体トレンド
                if (raceOrders.length >= 4) {
                    const earlyAverage = (raceOrders[2] + raceOrders[3] + (raceOrders[4] || raceOrders[3])) / 3;
                    const overallTrend = earlyAverage - recentAverage;
                    
                    if (overallTrend > 1) {
                        console.log(`🚀 長期向上トレンド: 過去平均${earlyAverage.toFixed(1)}着→直近平均${recentAverage.toFixed(1)}着`);
                    } else if (overallTrend < -1) {
                        console.log(`⚠️ 長期悪化トレンド: 過去平均${earlyAverage.toFixed(1)}着→直近平均${recentAverage.toFixed(1)}着`);
                    }
                }
            }
        });
        
        console.log('\n=== 抽出完了 ===');
    }

    // 過去5走のレース履歴を総合評価する新機能（指数関数的減衰モデル）
    static calculateRaceHistoryScore(horse, adj) {
        let totalScore = 0;
        
        // 指数関数的減衰重み（λ=0.25）
        const weights = [
            { weight: 1.00, percentage: 35 }, // 前走: 35%
            { weight: 0.82, percentage: 29 }, // 2走前: 29%
            { weight: 0.67, percentage: 24 }, // 3走前: 24%
            { weight: 0.55, percentage: 19 }, // 4走前: 19%
            { weight: 0.45, percentage: 16 }  // 5走前: 16%
        ];
        
        // 各走のデータ配列
        const raceData = [
            {
                agari: horse.lastRaceAgari,
                order: horse.lastRaceOrder || horse.lastRace,
                course: horse.lastRaceCourse,
                distance: horse.lastRaceDistance,
                trackType: horse.lastRaceTrackType,
                trackCondition: horse.lastRaceTrackCondition,
                popularity: horse.lastRacePopularity,
                weight: horse.lastRaceWeight,
                label: '前走'
            },
            {
                agari: horse.secondLastRaceAgari,
                order: horse.secondLastRaceOrder,
                course: horse.secondLastRaceCourse,
                distance: horse.secondLastRaceDistance,
                trackType: horse.secondLastRaceTrackType,
                trackCondition: horse.secondLastRaceTrackCondition,
                popularity: horse.secondLastRacePopularity,
                weight: horse.secondLastRaceWeight,
                label: '2走前'
            },
            {
                agari: horse.thirdLastRaceAgari,
                order: horse.thirdLastRaceOrder,
                course: horse.thirdLastRaceCourse,
                distance: horse.thirdLastRaceDistance,
                trackType: horse.thirdLastRaceTrackType,
                trackCondition: horse.thirdLastRaceTrackCondition,
                popularity: horse.thirdLastRacePopularity,
                weight: horse.thirdLastRaceWeight,
                label: '3走前'
            },
            {
                agari: horse.fourthLastRaceAgari,
                order: horse.fourthLastRaceOrder,
                course: horse.fourthLastRaceCourse,
                distance: horse.fourthLastRaceDistance,
                trackType: horse.fourthLastRaceTrackType,
                trackCondition: horse.fourthLastRaceTrackCondition,
                popularity: horse.fourthLastRacePopularity,
                weight: horse.fourthLastRaceWeight,
                label: '4走前'
            },
            {
                agari: horse.fifthLastRaceAgari,
                order: horse.fifthLastRaceOrder,
                course: horse.fifthLastRaceCourse,
                distance: horse.fifthLastRaceDistance,
                trackType: horse.fifthLastRaceTrackType,
                trackCondition: horse.fifthLastRaceTrackCondition,
                popularity: horse.fifthLastRacePopularity,
                weight: horse.fifthLastRaceWeight,
                label: '5走前'
            }
        ];
        
        let totalWeight = 0;
        
        // 各走の評価と重み付け
        for (let i = 0; i < raceData.length; i++) {
            const race = raceData[i];
            const weightInfo = weights[i];
            
            // データが存在する場合のみ評価
            if (race.agari || race.order) {
                const raceScore = this.evaluateSingleRace(race, horse, race.label);
                const weightedScore = raceScore * weightInfo.weight * adj.lastRaceWeight;
                
                totalScore += weightedScore;
                totalWeight += weightInfo.weight;
            }
        }
        
        // 重み正規化（実際に評価した走数に応じて調整）
        if (totalWeight > 0) {
            totalScore = totalScore / totalWeight * weights[0].weight; // 前走重みで正規化
        }
        
        // 5走分の一貫性評価（より高度なアルゴリズム）
        const consistencyBonus = this.evaluateAdvancedPerformanceConsistency(horse);
        totalScore += consistencyBonus;
        
        return totalScore;
    }

    // 単一レースの評価
    static evaluateSingleRace(raceData, horse, raceLabel) {
        let raceScore = 0;
        
        // 上がり3F評価
        if (raceData.agari) {
            const agari = parseFloat(raceData.agari);
            if (!isNaN(agari)) {
                if (agari <= 33.5) {
                    raceScore += 25;
                } else if (agari <= 34.0) {
                    raceScore += 20;
                } else if (agari <= 34.5) {
                    raceScore += 10;
                } else if (agari <= 35.0) {
                    raceScore += 0;
                } else if (agari <= 36.0) {
                    raceScore -= 5;
                } else {
                    raceScore -= 10;
                }
            }
        } else {
            raceScore -= 10; // データなしペナルティ
        }
        
        // 着順評価
        if (raceData.order) {
            const order = this.parseRaceOrder(raceData.order);
            if (order) {
                if (order === 1) {
                    raceScore += 30; // 勝利ボーナス
                } else if (order === 2) {
                    raceScore += 20; // 2着ボーナス
                } else if (order === 3) {
                    raceScore += 15; // 3着ボーナス
                } else if (order <= 5) {
                    raceScore += 5; // 5着以内
                } else if (order <= 8) {
                    raceScore += 0; // 中位
                } else if (order === 99) {
                    raceScore -= 20; // 中止・取消は大幅減点
                } else {
                    raceScore -= 10; // 下位
                }
            }
        }
        
        // 人気と着順の乖離評価（穴馬・凡走の判定）
        if (raceData.popularity && raceData.order) {
            const popularity = parseInt(raceData.popularity);
            const order = this.parseRaceOrder(raceData.order);
            
            if (!isNaN(popularity) && order && order !== 99) { // 中止以外の場合のみ
                const performanceGap = popularity - order;
                if (performanceGap > 3) {
                    raceScore += 10; // 人気を上回る好走
                } else if (performanceGap < -3) {
                    raceScore -= 8; // 人気を下回る凡走
                }
            }
        }
        
        // 距離適性評価（今回レースとの比較）
        if (raceData.distance && horse.distance) {
            const lastDistance = parseInt(raceData.distance);
            const currentDistance = parseInt(horse.distance);
            
            if (!isNaN(lastDistance) && !isNaN(currentDistance)) {
                const distanceGap = Math.abs(currentDistance - lastDistance);
                if (distanceGap <= 200) {
                    raceScore += 5; // 同距離帯
                } else if (distanceGap <= 400) {
                    raceScore += 2; // 近い距離
                } else {
                    raceScore -= 3; // 距離変更
                }
            }
        }
        
        // 馬場適性評価
        if (raceData.trackType && horse.trackType) {
            if (raceData.trackType === horse.trackType) {
                raceScore += 5; // 同じ馬場種別
            } else {
                raceScore -= 5; // 馬場変更
            }
        }
        
        return raceScore;
    }

    // パフォーマンス一貫性の評価
    static evaluatePerformanceConsistency(horse) {
        let consistencyScore = 0;
        
        // 前走と2走前のデータが両方ある場合のみ評価
        if (horse.lastRaceOrder && horse.secondLastRaceOrder) {
            const lastOrder = this.parseRaceOrder(horse.lastRaceOrder) || this.parseRaceOrder(horse.lastRace);
            const secondLastOrder = this.parseRaceOrder(horse.secondLastRaceOrder);
            
            if (lastOrder && secondLastOrder) {
                // 着順の向上・悪化を評価
                const improvement = secondLastOrder - lastOrder;
                
                if (improvement > 0) {
                    consistencyScore += Math.min(improvement * 3, 15); // 向上ボーナス（最大15点）
                } else if (improvement < 0) {
                    consistencyScore += Math.max(improvement * 2, -10); // 悪化ペナルティ（最大-10点）
                }
                
                // 安定性評価（両方5着以内など）
                if (lastOrder <= 5 && secondLastOrder <= 5) {
                    consistencyScore += 8; // 安定して好走
                } else if (lastOrder <= 3 || secondLastOrder <= 3) {
                    consistencyScore += 5; // どちらかで好走
                }
            }
        }
        
        // 上がり3Fの一貫性評価
        if (horse.lastRaceAgari && horse.secondLastRaceAgari) {
            const lastAgari = parseFloat(horse.lastRaceAgari);
            const secondLastAgari = parseFloat(horse.secondLastRaceAgari);
            
            if (!isNaN(lastAgari) && !isNaN(secondLastAgari)) {
                const agariGap = Math.abs(lastAgari - secondLastAgari);
                
                if (agariGap <= 0.5) {
                    consistencyScore += 5; // 安定した脚色
                } else if (agariGap <= 1.0) {
                    consistencyScore += 2; // まずまず安定
                } else {
                    consistencyScore -= 2; // 脚色にばらつき
                }
                
                // 両方とも好タイムの場合
                if (lastAgari <= 34.0 && secondLastAgari <= 34.0) {
                    consistencyScore += 8; // 継続して好調
                }
            }
        }
        
        return consistencyScore;
    }

    // 5走分の高度なパフォーマンス一貫性評価
    static evaluateAdvancedPerformanceConsistency(horse) {
        let consistencyScore = 0;
        
        // 5走分の着順データを収集
        const orders = [
            this.parseRaceOrder(horse.lastRaceOrder) || this.parseRaceOrder(horse.lastRace),
            this.parseRaceOrder(horse.secondLastRaceOrder),
            this.parseRaceOrder(horse.thirdLastRaceOrder),
            this.parseRaceOrder(horse.fourthLastRaceOrder),
            this.parseRaceOrder(horse.fifthLastRaceOrder)
        ].filter(order => order && order !== 99); // 中止を除外
        
        if (orders.length < 2) return 0;
        
        // 1. トレンド分析（重み付き回帰）
        const weights = [1.0, 0.82, 0.67, 0.55, 0.45];
        let weightedSum = 0;
        let positionSum = 0;
        
        for (let i = 0; i < orders.length; i++) {
            weightedSum += orders[i] * weights[i];
            positionSum += (i + 1) * weights[i]; // 1=最新, 2=2走前...
        }
        
        // 2. 向上トレンドボーナス
        if (orders.length >= 3) {
            const recent = (orders[0] + orders[1]) / 2; // 直近2走平均
            const past = orders.slice(2).reduce((sum, order) => sum + order, 0) / Math.max(1, orders.length - 2);
            
            const improvement = past - recent; // 着順は小さいほど良い
            if (improvement > 1.5) {
                consistencyScore += 15; // 大幅向上
            } else if (improvement > 0.5) {
                consistencyScore += 8; // 緩やかな向上
            } else if (improvement < -1.5) {
                consistencyScore -= 10; // 大幅悪化
            }
        }
        
        // 3. 安定性評価（標準偏差ベース）
        if (orders.length >= 3) {
            const mean = orders.reduce((sum, order) => sum + order, 0) / orders.length;
            const variance = orders.reduce((sum, order) => sum + Math.pow(order - mean, 2), 0) / orders.length;
            const standardDeviation = Math.sqrt(variance);
            
            if (standardDeviation <= 1.0) {
                consistencyScore += 12; // 非常に安定
            } else if (standardDeviation <= 2.0) {
                consistencyScore += 6; // まずまず安定
            } else if (standardDeviation >= 4.0) {
                consistencyScore -= 8; // 不安定
            }
        }
        
        // 4. 好走頻度評価
        const goodRuns = orders.filter(order => order <= 3).length;
        const goodRunRate = goodRuns / orders.length;
        
        if (goodRunRate >= 0.6) {
            consistencyScore += 10; // 高頻度で好走
        } else if (goodRunRate >= 0.4) {
            consistencyScore += 5; // 適度に好走
        } else if (goodRunRate <= 0.2) {
            consistencyScore -= 5; // 好走が少ない
        }
        
        // 5. 5走分の上がり3F一貫性
        const agariTimes = [
            parseFloat(horse.lastRaceAgari),
            parseFloat(horse.secondLastRaceAgari),
            parseFloat(horse.thirdLastRaceAgari),
            parseFloat(horse.fourthLastRaceAgari),
            parseFloat(horse.fifthLastRaceAgari)
        ].filter(agari => !isNaN(agari));
        
        if (agariTimes.length >= 3) {
            const agariMean = agariTimes.reduce((sum, agari) => sum + agari, 0) / agariTimes.length;
            const agariStd = Math.sqrt(agariTimes.reduce((sum, agari) => sum + Math.pow(agari - agariMean, 2), 0) / agariTimes.length);
            
            if (agariStd <= 0.5) {
                consistencyScore += 8; // 上がり安定
            } else if (agariStd >= 1.5) {
                consistencyScore -= 5; // 上がり不安定
            }
            
            // 継続的に好タイム
            const goodAgariCount = agariTimes.filter(agari => agari <= 34.5).length;
            if (goodAgariCount >= Math.ceil(agariTimes.length * 0.6)) {
                consistencyScore += 10; // 継続して好タイム
            }
        }
        
        return Math.min(25, Math.max(-15, consistencyScore)); // -15〜25の範囲に制限
    }

    // 現在のレースレベルを取得
    static getCurrentRaceLevel() {
        // レース基本情報から今回レースレベルを取得
        const raceLevelSelect = document.getElementById('raceLevel');
        if (raceLevelSelect && raceLevelSelect.value) {
            return raceLevelSelect.value;
        }
        
        // フォールバック：馬データ入力エリアから最初の馬のレースレベルを取得
        const firstHorse = document.querySelector('.horse-card');
        if (firstHorse) {
            const horseRaceLevelSelect = firstHorse.querySelector('select[name="raceLevel"]');
            if (horseRaceLevelSelect) {
                return horseRaceLevelSelect.value || '1勝';
            }
        }
        
        // フォールバック：レース名から推測
        const raceNameInput = document.getElementById('raceName');
        if (raceNameInput && raceNameInput.value) {
            const raceName = raceNameInput.value.toLowerCase();
            if (raceName.includes('g1') || raceName.includes('天皇賞') || raceName.includes('ダービー') || raceName.includes('有馬記念')) {
                return 'G1';
            } else if (raceName.includes('g2') || raceName.includes('g3')) {
                return raceName.includes('g2') ? 'G2' : 'G3';
            }
        }
        
        return '1勝'; // デフォルト値
    }

    // 現在のレース距離を取得
    static getCurrentRaceDistance() {
        // レース基本情報から距離を取得
        const raceDistanceSelect = document.getElementById('raceDistance');
        if (raceDistanceSelect && raceDistanceSelect.value) {
            return raceDistanceSelect.value;
        }
        
        // 馬データから距離を取得を試行
        const firstHorse = document.querySelector('.horse-card');
        if (firstHorse) {
            const distanceInput = firstHorse.querySelector('input[name="distance"]');
            if (distanceInput && distanceInput.value) {
                return distanceInput.value;
            }
        }
        
        return '1600'; // デフォルト値
    }

    // 現在の馬場種別を取得
    static getCurrentTrackType() {
        // レース基本情報から馬場種別を取得
        const trackTypeSelect = document.getElementById('raceTrackType');
        if (trackTypeSelect && trackTypeSelect.value) {
            return trackTypeSelect.value;
        }
        
        // 馬データから馬場種別を取得を試行
        const firstHorse = document.querySelector('.horse-card');
        if (firstHorse) {
            const trackTypeInput = firstHorse.querySelector('select[name="trackType"]');
            if (trackTypeInput && trackTypeInput.value) {
                return trackTypeInput.value;
            }
        }
        
        return '芝'; // デフォルト値
    }
    
    // データ検証機能群
    
    // 予測データの品質を検証
    static validatePredictionData(horses) {
        let criticalIssues = 0;
        let warnings = 0;
        const issues = [];
        
        // 基本データ検証
        if (horses.length === 0) {
            criticalIssues++;
            issues.push('馬データが存在しません');
        } else if (horses.length < 8) {
            warnings++;
            issues.push(`馬データが少なすぎます（${horses.length}頭）`);
        }
        
        // 各馬のデータ品質チェック
        horses.forEach((horse, index) => {
            const horseIssues = this.validateSingleHorseData(horse, index + 1);
            criticalIssues += horseIssues.critical;
            warnings += horseIssues.warnings;
            issues.push(...horseIssues.details);
        });
        
        // オッズの分布チェック
        const oddsDistribution = this.analyzeOddsDistribution(horses);
        if (oddsDistribution.hasAnomalies) {
            warnings++;
            issues.push('オッズ分布に異常があります');
        }
        
        return {
            criticalIssues,
            warnings,
            issues,
            totalHorses: horses.length,
            qualityScore: Math.max(0, 100 - (criticalIssues * 20) - (warnings * 5))
        };
    }
    
    // 個別馬データの検証
    static validateSingleHorseData(horse, horseNumber) {
        let critical = 0;
        let warnings = 0;
        const details = [];
        
        // 必須データの存在チェック
        if (!horse.name) {
            critical++;
            details.push(`${horseNumber}番: 馬名が未設定`);
        }
        
        if (!horse.odds || isNaN(parseFloat(horse.odds))) {
            critical++;
            details.push(`${horseNumber}番: オッズが無効`);
        } else {
            const odds = parseFloat(horse.odds);
            if (odds <= 0) {
                critical++;
                details.push(`${horseNumber}番: オッズが0以下（${odds}）`);
            } else if (odds > 999) {
                warnings++;
                details.push(`${horseNumber}番: オッズが999倍超（${odds}）`);
            }
        }
        
        // 騎手データチェック
        if (!horse.jockey) {
            warnings++;
            details.push(`${horseNumber}番: 騎手が未設定`);
        }
        
        // 年齢データチェック
        if (horse.age) {
            const age = parseInt(horse.age);
            if (isNaN(age) || age < 2 || age > 12) {
                warnings++;
                details.push(`${horseNumber}番: 年齢が異常（${horse.age}歳）`);
            }
        }
        
        // 前走データの一貫性チェック
        if (horse.lastRace && horse.lastRaceOrder) {
            const displayOrder = this.parseRaceOrder(horse.lastRace);
            const detailOrder = this.parseRaceOrder(horse.lastRaceOrder);
            if (displayOrder !== null && detailOrder !== null && displayOrder !== detailOrder) {
                warnings++;
                details.push(`${horseNumber}番: 前走着順データに不一致（${horse.lastRace} vs ${horse.lastRaceOrder}）`);
            }
        }
        
        return { critical, warnings, details };
    }
    
    // オッズ分布の分析
    static analyzeOddsDistribution(horses) {
        const oddsList = horses.map(h => parseFloat(h.odds)).filter(o => !isNaN(o));
        
        if (oddsList.length === 0) {
            return { hasAnomalies: true, reason: 'オッズデータが存在しません' };
        }
        
        const min = Math.min(...oddsList);
        const max = Math.max(...oddsList);
        const avg = oddsList.reduce((sum, odds) => sum + odds, 0) / oddsList.length;
        
        let hasAnomalies = false;
        const anomalies = [];
        
        // 極端なオッズ分布をチェック
        if (min === max) {
            hasAnomalies = true;
            anomalies.push('全馬同じオッズ');
        }
        
        if (min <= 0.5) {
            hasAnomalies = true;
            anomalies.push('異常に低いオッズ（0.5倍以下）');
        }
        
        if (max > 999) {
            hasAnomalies = true;
            anomalies.push('異常に高いオッズ（999倍超）');
        }
        
        // 1番人気と最下位人気の差が極端すぎる場合
        const ratio = max / min;
        if (ratio > 1000) {
            hasAnomalies = true;
            anomalies.push(`オッズ格差が極端（${ratio.toFixed(1)}倍）`);
        }
        
        return {
            hasAnomalies,
            anomalies,
            statistics: { min, max, avg, ratio },
            distribution: {
                favorites: oddsList.filter(o => o <= 3).length,
                middleOdds: oddsList.filter(o => o > 3 && o <= 10).length,
                longshots: oddsList.filter(o => o > 10).length
            }
        };
    }
    
    // 予測結果の検証
    static validatePredictionResults(predictions) {
        const issues = [];
        let isValid = true;
        
        if (!predictions || predictions.length === 0) {
            issues.push('予測結果が生成されませんでした');
            return { isValid: false, issues };
        }
        
        // スコア分布の検証
        const scores = predictions.map(p => p.score).filter(s => !isNaN(s));
        if (scores.length === 0) {
            issues.push('有効なスコアが計算されませんでした');
            isValid = false;
        } else {
            const minScore = Math.min(...scores);
            const maxScore = Math.max(...scores);
            const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
            
            // 異常なスコア分布をチェック
            if (minScore === maxScore) {
                issues.push('全馬同じスコア');
                isValid = false;
            }
            
            if (maxScore - minScore < 5) {
                issues.push('スコア差が小さすぎます（差別化不足）');
            }
            
            if (Math.abs(avgScore - 50) > 30) {
                issues.push(`平均スコアが基準値から大きく乖離（${avgScore.toFixed(1)}）`);
            }
        }
        
        // 勝率分布の検証
        const winProbabilities = predictions.map(p => p.winProbability).filter(p => !isNaN(p));
        if (winProbabilities.length > 0) {
            const totalProb = winProbabilities.reduce((sum, p) => sum + p, 0);
            console.log(`勝率検証: 合計=${totalProb.toFixed(1)}%, 個別勝率=[${winProbabilities.map(p => p.toFixed(1)).join(', ')}]`);
            
            // 正規化処理後は許容範囲を調整（正規化が失敗した場合に対応）
            const tolerance = totalProb > 120 ? 10 : 2; // 大幅な乖離の場合は許容範囲を拡大
            if (Math.abs(totalProb - 100) > tolerance) {
                if (totalProb > 120) {
                    issues.push(`勝率合計が100%から大幅に乖離（${totalProb.toFixed(1)}%）- 正規化処理に問題の可能性`);
                    console.error('予測値正規化の問題を検出:', {
                        totalProbability: totalProb,
                        individualProbabilities: winProbabilities,
                        horsesCount: predictions.length
                    });
                } else {
                    issues.push(`勝率合計が100%から乖離（${totalProb.toFixed(1)}%）`);
                }
                isValid = false;
            } else {
                console.log(`勝率検証OK: 合計=${totalProb.toFixed(1)}% (許容範囲±${tolerance}%)`);
            }
        }
        
        // 異常値の検出
        predictions.forEach((prediction, index) => {
            if (prediction.score < 0 || prediction.score > 100) {
                issues.push(`${index + 1}番: スコアが範囲外（${prediction.score}）`);
            }
            
            if (prediction.winProbability < 0 || prediction.winProbability > 100) {
                issues.push(`${index + 1}番: 勝率が範囲外（${prediction.winProbability}%）`);
            }
        });
        
        return {
            isValid: isValid && issues.length === 0,
            issues,
            statistics: {
                totalPredictions: predictions.length,
                averageScore: scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0,
                scoreRange: scores.length > 0 ? Math.max(...scores) - Math.min(...scores) : 0
            }
        };
    }
    
    // 血統評価スコア計算
    static calculatePedigreeScore(horse) {
        let pedigreeScore = 0;
        
        try {
            // 血統データが存在する場合のみ処理
            if (horse.pedigreeData) {
                const pedigreeData = horse.pedigreeData;
                
                // 血統総合評価スコア（-15〜+15の範囲）
                if (pedigreeData.overallRating && pedigreeData.overallRating.totalScore) {
                    const rating = pedigreeData.overallRating.totalScore;
                    // 80点以上なら+15、70点以上なら+10、60点以上なら+5、50点以下なら-5
                    if (rating >= 80) {
                        pedigreeScore += 15;
                    } else if (rating >= 70) {
                        pedigreeScore += 10;
                    } else if (rating >= 60) {
                        pedigreeScore += 5;
                    } else if (rating >= 50) {
                        pedigreeScore += 0;
                    } else {
                        pedigreeScore -= 5;
                    }
                }
                
                // 血統適性による距離・馬場補正
                const distanceBonus = this.calculatePedigreeDistanceBonus(horse, pedigreeData);
                const trackBonus = this.calculatePedigreeTrackBonus(horse, pedigreeData);
                
                pedigreeScore += distanceBonus + trackBonus;
                
                // 血統配合相性ボーナス
                if (pedigreeData.matingAnalysis && pedigreeData.matingAnalysis.compatibility >= 85) {
                    pedigreeScore += 5; // 優秀な配合
                } else if (pedigreeData.matingAnalysis && pedigreeData.matingAnalysis.compatibility <= 65) {
                    pedigreeScore -= 3; // 相性不良
                }
                
                console.log(`血統評価: ${horse.name} - 総合スコア: ${pedigreeScore}点`);
            } else {
                // 血統データなしの場合はデフォルト処理
                pedigreeScore = 0;
                console.log(`血統評価: ${horse.name} - 血統データなし（デフォルト0点）`);
            }
        } catch (error) {
            console.error(`血統評価エラー: ${horse.name}`, error);
            pedigreeScore = 0; // エラー時はニュートラル
        }
        
        // スコアを-15〜+15の範囲に制限
        return Math.max(-15, Math.min(15, pedigreeScore));
    }
    
    // 血統距離適性ボーナス計算
    static calculatePedigreeDistanceBonus(horse, pedigreeData) {
        if (!pedigreeData.sireAnalysis || !pedigreeData.sireAnalysis.distanceAptitude || !horse.distance) {
            return 0;
        }
        
        const currentDistance = parseInt(horse.distance);
        const distanceAptitude = pedigreeData.sireAnalysis.distanceAptitude;
        
        // 最も近い距離の適性値を取得
        const distances = Object.keys(distanceAptitude).map(d => parseInt(d)).sort((a, b) => a - b);
        let closestDistance = distances[0];
        let minDiff = Math.abs(currentDistance - closestDistance);
        
        for (const distance of distances) {
            const diff = Math.abs(currentDistance - distance);
            if (diff < minDiff) {
                minDiff = diff;
                closestDistance = distance;
            }
        }
        
        const aptitude = distanceAptitude[closestDistance];
        
        // 適性値に基づいてボーナス計算（-5〜+5の範囲）
        if (aptitude >= 90) {
            return 5;
        } else if (aptitude >= 80) {
            return 3;
        } else if (aptitude >= 70) {
            return 0;
        } else if (aptitude >= 60) {
            return -2;
        } else {
            return -5;
        }
    }
    
    // 血統馬場適性ボーナス計算
    static calculatePedigreeTrackBonus(horse, pedigreeData) {
        if (!pedigreeData.sireAnalysis || !pedigreeData.sireAnalysis.trackAptitude || !horse.trackType) {
            return 0;
        }
        
        const trackAptitude = pedigreeData.sireAnalysis.trackAptitude;
        const currentTrackType = horse.trackType;
        
        const aptitude = trackAptitude[currentTrackType];
        if (!aptitude) return 0;
        
        // 馬場適性値に基づいてボーナス計算（-5〜+5の範囲）
        if (aptitude >= 90) {
            return 5;
        } else if (aptitude >= 80) {
            return 3;
        } else if (aptitude >= 70) {
            return 0;
        } else if (aptitude >= 60) {
            return -2;
        } else {
            return -5;
        }
    }

    // 予測の一貫性チェック
    static validatePredictionConsistency(predictions) {
        const inconsistencies = [];
        
        // オッズと勝率の一貫性チェック
        predictions.forEach((prediction, index) => {
            const impliedProb = 100 / parseFloat(prediction.odds || 1);
            const predictedProb = prediction.winProbability;
            
            if (Math.abs(impliedProb - predictedProb) > 20) {
                inconsistencies.push({
                    horse: index + 1,
                    issue: `オッズ${prediction.odds}倍の暗示確率${impliedProb.toFixed(1)}%と予測勝率${predictedProb.toFixed(1)}%に大きな乖離`
                });
            }
        });
        
        // 前走成績と予測スコアの一貫性チェック
        predictions.forEach((prediction, index) => {
            const lastRace = this.parseRaceOrder(prediction.lastRace);
            if (lastRace !== null) {
                const isGoodLastRace = lastRace <= 3;
                const isHighScore = prediction.score > 60;
                
                if (isGoodLastRace && !isHighScore) {
                    inconsistencies.push({
                        horse: index + 1,
                        issue: `前走${lastRace}着好走も予測スコア${prediction.score.toFixed(1)}が低い`
                    });
                } else if (!isGoodLastRace && lastRace <= 10 && isHighScore) {
                    inconsistencies.push({
                        horse: index + 1,
                        issue: `前走${lastRace}着不振も予測スコア${prediction.score.toFixed(1)}が高い`
                    });
                }
            }
        });
        
        return inconsistencies;
    }

    // 血統グレードの色分け
    static getGradeColor(grade) {
        switch (grade) {
            case 'S': return '#ff6b35'; // オレンジレッド
            case 'A+': return '#ff8c42'; // オレンジ
            case 'A': return '#ffa726'; // 明るいオレンジ
            case 'B+': return '#66bb6a'; // 緑
            case 'B': return '#42a5f5'; // 青
            case 'C+': return '#ab47bc'; // 紫
            case 'C': return '#78909c'; // グレー
            case 'D': return '#90a4ae'; // ライトグレー
            default: return '#616161'; // デフォルトグレー
        }
    }
    
    // Phase 1情報表示（改善版）
    static displayPhase1Information() {
        // 設定で非表示が選択されている場合はスキップ
        const showSystemInfo = localStorage.getItem('showPhase1Info') !== 'false';
        if (!showSystemInfo) {
            return;
        }
        
        // Phase 1情報表示エリアを作成または取得
        let phase1Container = document.getElementById('phase1InfoContainer');
        if (!phase1Container) {
            phase1Container = document.createElement('div');
            phase1Container.id = 'phase1InfoContainer';
            phase1Container.style.cssText = `
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px;
                margin: 10px 0;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                font-size: 14px;
            `;
            
            // 予測結果の後に挿入
            const resultsContainer = document.getElementById('results');
            if (resultsContainer && resultsContainer.nextSibling) {
                resultsContainer.parentNode.insertBefore(phase1Container, resultsContainer.nextSibling);
            } else if (resultsContainer) {
                resultsContainer.parentNode.appendChild(phase1Container);
            }
        }
        
        // コンパクトなヘッダーと制御ボタン
        let infoHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4 style="margin: 0; color: #fff;">🎯 Phase 1 システム状況</h4>
                <div>
                    <button id="togglePhase1Details" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-right: 5px; font-size: 12px;">
                        🔍 詳細表示
                    </button>
                    <button id="hidePhase1Info" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 12px;">
                        ❌ 非表示
                    </button>
                </div>
            </div>
            <div id="phase1Summary" style="background: rgba(255,255,255,0.15); padding: 8px; border-radius: 5px; margin-bottom: 10px;">
                <strong>✅ 推奨精度向上システム稼働中</strong>
            </div>
            <div id="phase1Details" style="display: none;">
        `;
        
        // 的中判定基準表示
        if (typeof HitCriteriaSystem !== 'undefined') {
            const currentCriteria = HitCriteriaSystem.getCurrentCriteriaName();
            infoHTML += `<div style="background:rgba(255,255,255,0.1); padding:8px; border-radius:5px; margin:8px 0; font-size:13px;">
                <strong>📊 的中判定基準:</strong> ${currentCriteria}
            </div>`;
        }
        
        // 信頼度フィルタリング結果表示（簡略版）
        if (window.lastFilteredPredictions && window.lastEnsembleResult) {
            const filtered = window.lastFilteredPredictions;
            const ensemble = window.lastEnsembleResult;
            
            const highConf = filtered.filter(p => p.recommendationLevel === 'high').length;
            const mediumConf = filtered.filter(p => p.recommendationLevel === 'medium').length;
            const lowConf = filtered.filter(p => p.recommendationLevel === 'low').length;
            
            infoHTML += `<div style="background:rgba(255,255,255,0.1); padding:8px; border-radius:5px; margin:8px 0; font-size:13px;">
                <strong>🔍 フィルタリング結果:</strong> 
                ${this.currentPredictions.length}頭 → ${filtered.length}頭 | 
                <span style="color:#4CAF50;">高:${highConf}</span> 
                <span style="color:#FF9800;">中:${mediumConf}</span> 
                <span style="color:#F44336;">低:${lowConf}</span><br>
                アンサンブル信頼度: ${(ensemble.confidence * 100).toFixed(1)}%
            </div>`;
        }
        
        // 動的調整情報表示（簡略版）
        if (typeof DynamicRecommendationAdjuster !== 'undefined') {
            try {
                const adjustmentParams = DynamicRecommendationAdjuster.adjustmentHistory.adjustmentParameters;
                if (adjustmentParams) {
                    infoHTML += `<div style="background:rgba(255,255,255,0.1); padding:8px; border-radius:5px; margin:8px 0; font-size:13px;">
                        <strong>📈 動的調整:</strong> 
                        信頼度閾値 ${(adjustmentParams.confidenceThreshold * 100).toFixed(0)}% | 
                        強度乗数 ${adjustmentParams.strengthMultiplier.toFixed(2)}
                    </div>`;
                }
            } catch (error) {
                console.error('動的調整情報表示エラー:', error);
            }
        }
        
        // 期待ROI情報表示（コンパクト版）
        if (typeof HitCriteriaSystem !== 'undefined' && this.currentPredictions.length > 0) {
            try {
                const expectedROI = HitCriteriaSystem.calculateExpectedROI(this.currentPredictions);
                const currentROI = expectedROI[HitCriteriaSystem.currentCriteria];
                
                if (currentROI !== undefined) {
                    const roiColor = currentROI >= 0 ? '#4CAF50' : '#F44336';
                    
                    infoHTML += `<div style="background:rgba(255,255,255,0.1); padding:8px; border-radius:5px; margin:8px 0; font-size:13px;">
                        <strong>💰 期待ROI:</strong> 
                        <span style="color:${roiColor}; font-weight:bold;">${currentROI.toFixed(1)}%</span>
                    </div>`;
                }
            } catch (error) {
                console.error('期待ROI計算エラー:', error);
            }
        }
        
        // Phase 1の効果説明（簡略版）
        infoHTML += `<div style="background:rgba(255,255,255,0.15); padding:8px; border-radius:5px; margin:8px 0; font-size:12px;">
            <strong>✨ 改善効果:</strong><br>
            • 配当設定最適化 • 的中判定基準 • アンサンブル統合 • 動的調整
        </div>`;
        
        // 詳細情報セクション終了
        infoHTML += `</div>`; // phase1Details の終了タグ
        
        // 簡略サマリーを更新
        if (window.lastFilteredPredictions && window.lastEnsembleResult) {
            const filtered = window.lastFilteredPredictions;
            const ensemble = window.lastEnsembleResult;
            const confidence = (ensemble.confidence * 100).toFixed(0);
            const summaryDiv = document.getElementById('phase1Summary');
            if (summaryDiv) {
                summaryDiv.innerHTML = `
                    <strong>✅ 推奨精度向上システム稼働中</strong> | 
                    信頼度: ${confidence}% | 
                    推奨数: ${filtered.length}頭
                `;
            }
        }
        
        phase1Container.innerHTML = infoHTML;
        
        // イベントリスナー追加
        setTimeout(() => {
            const toggleButton = document.getElementById('togglePhase1Details');
            const hideButton = document.getElementById('hidePhase1Info');
            const detailsDiv = document.getElementById('phase1Details');
            
            if (toggleButton && detailsDiv) {
                toggleButton.onclick = function() {
                    const isVisible = detailsDiv.style.display !== 'none';
                    detailsDiv.style.display = isVisible ? 'none' : 'block';
                    this.textContent = isVisible ? '🔍 詳細表示' : '🔍 詳細非表示';
                };
            }
            
            if (hideButton && phase1Container) {
                hideButton.onclick = function() {
                    localStorage.setItem('showPhase1Info', 'false');
                    phase1Container.style.display = 'none';
                    console.log('🔍 Phase 1情報を非表示に設定しました。再表示するにはコンソールで localStorage.setItem("showPhase1Info", "true") を実行してください。');
                };
            }
        }, 100);
    }
    
    // Phase 3: 市場データ生成（簡易シミュレーション）
    static generateRecentMarketData() {
        const marketData = [];
        const baseDate = new Date();
        
        // 過去7日分の市場データを生成
        for (let i = 0; i < 7; i++) {
            const date = new Date(baseDate);
            date.setDate(date.getDate() - i);
            
            // 市場データシミュレーション
            const favoriteWinRate = 0.25 + (Math.random() - 0.5) * 0.1; // 20-30%
            const averageOdds = 4.5 + (Math.random() - 0.5) * 2; // 3.5-5.5倍
            const surpriseRate = 0.08 + (Math.random() - 0.5) * 0.04; // 6-10%
            
            marketData.push({
                date: date.toISOString().split('T')[0],
                favoriteWinRate: favoriteWinRate,
                averageOdds: averageOdds,
                averagePayout: averageOdds * 0.85, // 控除率15%
                surpriseRate: surpriseRate,
                volatility: Math.random() * 0.3 + 0.1 // 10-40%
            });
        }
        
        return marketData.reverse(); // 古い順に並び替え
    }
}

// グローバル公開
window.PredictionEngine = PredictionEngine;
window.calculatePredictions = PredictionEngine.calculatePredictions.bind(PredictionEngine);
window.getAIRecommendation = PredictionEngine.requestAIRecommendation.bind(PredictionEngine); 
console.log('勝率正規化機能が追加されました。勝率合計が100%になるように自動調整されます。');
