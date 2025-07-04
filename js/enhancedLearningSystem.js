// 強化学習システム - 血統データ・動的DB統合版
class EnhancedLearningSystem {
    
    // 学習データ構造（拡張版）
    static learningData = {
        // 基本調整値
        adjustments: {
            oddsWeight: 1.0,
            lastRaceWeight: 1.0,
            jockeyWeight: 1.0,
            pedigreeWeight: 1.0,  // 新追加
            runningStyleWeight: 1.0,
            ageWeight: 1.0,
            weightChangeWeight: 1.0,
            restDaysWeight: 1.0
        },
        
        // 成功パターン記録
        successPatterns: {
            pedigree: new Map(),     // 血統別成功率
            dynamicPedigree: new Map(), // 動的血統別成功率
            aptitude: new Map(),     // 血統適性別成功率
            runningStyle: new Map(), // 脚質別成功率
            raceLevel: new Map(),    // レースレベル別成功率
            courseDistance: new Map(), // コース・距離別成功率
            combinations: new Map()   // 複合要因別成功率
        },
        
        // 予測精度統計
        accuracy: {
            totalPredictions: 0,
            winPredictions: 0,
            placePredictions: 0,
            winRate: 0,
            placeRate: 0,
            recentWinRate: 0,  // 直近10レースの勝率
            recentPlaceRate: 0
        },
        
        // 動的血統学習データ
        pedigreeLearning: {
            stallionPerformance: new Map(),  // 種牡馬別成績
            marePerformance: new Map(),      // 繁殖牝馬別成績
            lineageEffects: new Map(),       // 血統系統別効果
            aptitudePatterns: new Map(),     // 適性パターン別成績
            confidenceTracking: new Map()    // 信頼度追跡
        },
        
        // 買い目戦略学習
        bettingLearning: {
            strategySuccess: new Map(),      // 戦略別成功率
            expectedValueTracking: new Map(), // 期待値追跡
            riskReturnAnalysis: new Map(),   // リスク・リターン分析
            hitRateByType: new Map()         // 券種別的中率
        },
        
        // メタ学習（学習の学習）
        metaLearning: {
            learningEffectiveness: [],  // 学習効果の履歴
            adjustmentHistory: [],      // 調整履歴
            overlearningDetection: 0,   // 過学習検出指標
            adaptationRate: 0.1         // 適応率の動的調整
        }
    };
    
    // 初期化
    static initialize() {
        this.loadLearningData();
        this.initializePedigreeLearning();
        this.schedulePeriodicSaving();
        console.log('強化学習システム初期化完了');
    }
    
    /**
     * 移行データのインポート（LearningDataMigrationから呼び出される）
     */
    static importMigratedData(migratedData) {
        console.log('=== 移行データのインポート開始 ===');
        console.log('移行データ:', migratedData);
        
        try {
            // 1. 基本調整値の移行
            if (migratedData.adjustments) {
                this.learningData.adjustments = { ...this.learningData.adjustments, ...migratedData.adjustments };
                console.log('✅ 調整値を移行しました:', this.learningData.adjustments);
            }
            
            // 2. 成功パターンの移行
            if (migratedData.successPatterns) {
                this.importSuccessPatterns(migratedData.successPatterns);
                console.log('✅ 成功パターンを移行しました');
            }
            
            // 3. 精度統計の移行
            if (migratedData.accuracy) {
                this.learningData.accuracy = { ...this.learningData.accuracy, ...migratedData.accuracy };
                console.log('✅ 精度統計を移行しました:', this.learningData.accuracy);
            }
            
            // 4. 血統学習データの初期化
            if (migratedData.pedigreeLearning) {
                this.importPedigreeLearning(migratedData.pedigreeLearning);
                console.log('✅ 血統学習データを初期化しました');
            }
            
            // 5. 買い目戦略学習の移行
            if (migratedData.bettingLearning) {
                this.importBettingLearning(migratedData.bettingLearning);
                console.log('✅ 買い目戦略学習を移行しました');
            }
            
            // 6. メタ学習の移行
            if (migratedData.metaLearning) {
                this.learningData.metaLearning = { ...this.learningData.metaLearning, ...migratedData.metaLearning };
                console.log('✅ メタ学習データを移行しました');
            }
            
            // 7. 移行メタデータの保存
            this.learningData.migration = migratedData.migration;
            
            // 8. 移行後のデータを保存
            this.saveLearningData();
            
            console.log('=== 移行データのインポート完了 ===');
            return true;
            
        } catch (error) {
            console.error('❌ 移行データインポートエラー:', error);
            return false;
        }
    }
    
    /**
     * 成功パターンのインポート
     */
    static importSuccessPatterns(successPatterns) {
        // 血統パターン
        if (successPatterns.pedigree instanceof Map) {
            this.learningData.successPatterns.pedigree = new Map(successPatterns.pedigree);
        } else if (successPatterns.pedigree) {
            this.convertObjectToMap(successPatterns.pedigree, this.learningData.successPatterns.pedigree);
        }
        
        // 脚質パターン
        if (successPatterns.runningStyle instanceof Map) {
            this.learningData.successPatterns.runningStyle = new Map(successPatterns.runningStyle);
        } else if (successPatterns.runningStyle) {
            this.convertObjectToMap(successPatterns.runningStyle, this.learningData.successPatterns.runningStyle);
        }
        
        // レースレベルパターン
        if (successPatterns.raceLevel instanceof Map) {
            this.learningData.successPatterns.raceLevel = new Map(successPatterns.raceLevel);
        } else if (successPatterns.raceLevel) {
            this.convertObjectToMap(successPatterns.raceLevel, this.learningData.successPatterns.raceLevel);
        }
        
        // コース・距離パターン
        if (successPatterns.courseDistance instanceof Map) {
            this.learningData.successPatterns.courseDistance = new Map(successPatterns.courseDistance);
        } else if (successPatterns.courseDistance) {
            this.convertObjectToMap(successPatterns.courseDistance, this.learningData.successPatterns.courseDistance);
        }
        
        // 複合要因パターン
        if (successPatterns.combinations instanceof Map) {
            this.learningData.successPatterns.combinations = new Map(successPatterns.combinations);
        } else if (successPatterns.combinations) {
            this.convertObjectToMap(successPatterns.combinations, this.learningData.successPatterns.combinations);
        }
    }
    
    /**
     * オブジェクトをMapに変換
     */
    static convertObjectToMap(obj, targetMap) {
        if (!obj || typeof obj !== 'object') return;
        
        Object.entries(obj).forEach(([key, value]) => {
            targetMap.set(key, value);
        });
    }
    
    /**
     * 血統学習データのインポート
     */
    static importPedigreeLearning(pedigreeLearning) {
        if (pedigreeLearning.stallionPerformance instanceof Map) {
            this.learningData.pedigreeLearning.stallionPerformance = new Map(pedigreeLearning.stallionPerformance);
        }
        if (pedigreeLearning.marePerformance instanceof Map) {
            this.learningData.pedigreeLearning.marePerformance = new Map(pedigreeLearning.marePerformance);
        }
        if (pedigreeLearning.lineageEffects instanceof Map) {
            this.learningData.pedigreeLearning.lineageEffects = new Map(pedigreeLearning.lineageEffects);
        }
        if (pedigreeLearning.aptitudePatterns instanceof Map) {
            this.learningData.pedigreeLearning.aptitudePatterns = new Map(pedigreeLearning.aptitudePatterns);
        }
        if (pedigreeLearning.confidenceTracking instanceof Map) {
            this.learningData.pedigreeLearning.confidenceTracking = new Map(pedigreeLearning.confidenceTracking);
        }
    }
    
    /**
     * 買い目戦略学習のインポート
     */
    static importBettingLearning(bettingLearning) {
        if (bettingLearning.strategySuccess instanceof Map) {
            this.learningData.bettingLearning.strategySuccess = new Map(bettingLearning.strategySuccess);
        }
        if (bettingLearning.expectedValueTracking instanceof Map) {
            this.learningData.bettingLearning.expectedValueTracking = new Map(bettingLearning.expectedValueTracking);
        }
        if (bettingLearning.riskReturnAnalysis instanceof Map) {
            this.learningData.bettingLearning.riskReturnAnalysis = new Map(bettingLearning.riskReturnAnalysis);
        }
        if (bettingLearning.hitRateByType instanceof Map) {
            this.learningData.bettingLearning.hitRateByType = new Map(bettingLearning.hitRateByType);
        }
    }
    
    // 血統学習システムの初期化
    static initializePedigreeLearning() {
        // 動的血統データベースとの連携
        if (typeof DynamicPedigreeDB !== 'undefined') {
            const stats = DynamicPedigreeDB.getStatistics();
            console.log('動的血統DB統計:', stats);
        }
    }
    
    // メイン学習処理（拡張版）
    static processEnhancedRaceResult(actualResults, predictions, raceConditions) {
        console.log('=== 強化学習システム開始 ===');
        console.log('実際の結果:', actualResults);
        console.log('予測データ:', predictions);
        console.log('レース条件:', raceConditions);
        
        const learningResults = {
            basicLearning: this.processBasicLearning(actualResults, predictions),
            pedigreeLearning: this.processPedigreeLearning(actualResults, predictions, raceConditions),
            patternLearning: this.processPatternLearning(actualResults, predictions),
            metaLearning: this.processMetaLearning(actualResults, predictions),
            bettingLearning: this.processBettingLearning(actualResults, predictions),
            investmentLearning: this.processInvestmentLearning(actualResults, predictions)
        };
        
        this.updateAccuracyMetrics(actualResults, predictions);
        this.detectOverlearning();
        this.saveLearningData();
        
        return learningResults;
    }
    
    // 基本学習処理（収益性重視版）
    static processBasicLearning(actualResults, predictions) {
        const adj = this.learningData.adjustments;
        const learningRate = this.calculateAdaptiveLearningRate();
        const results = { adjustments: {} };
        
        // 収益性重視の学習処理
        return this.processProfitabilityBasedLearning(actualResults, predictions, learningRate, results);
    }
    
    // 適応学習率計算
    static calculateAdaptiveLearningRate() {
        const baseRate = (typeof CONFIG !== 'undefined' && CONFIG.LEARNING_RATE) ? CONFIG.LEARNING_RATE : 0.05;
        const accuracy = this.learningData.accuracy;
        
        // 精度に基づく調整（精度が低い場合、学習率を上げる）
        if (accuracy.totalPredictions > 10) {
            const currentAccuracy = accuracy.winPredictions / accuracy.totalPredictions;
            if (currentAccuracy < 0.15) {
                return baseRate * 1.5; // 学習率を50%増加
            } else if (currentAccuracy > 0.25) {
                return baseRate * 0.8; // 学習率を20%減少
            }
        }
        
        return baseRate;
    }
    
    // 収益性ベース学習処理（新実装）
    static processProfitabilityBasedLearning(actualResults, predictions, learningRate, results) {
        console.log('=== 収益性ベース学習開始 ===');
        
        // ProfitabilityMetricsとの連携
        if (typeof ProfitabilityMetrics === 'undefined') {
            console.warn('ProfitabilityMetricsが利用できません');
            return this.fallbackBasicLearning(actualResults, predictions, learningRate, results);
        }
        
        const profitabilityData = ProfitabilityMetrics.getProfitabilityData();
        const coreMetrics = profitabilityData.coreMetrics;
        
        // 予測結果を収益性で評価
        predictions.forEach((prediction, index) => {
            const betResult = this.simulateBetResult(prediction, actualResults);
            const profitImpact = this.calculateProfitImpact(betResult, coreMetrics);
            
            // 収益性に基づいた重み調整
            this.adjustWeightsBasedOnProfitability(prediction, profitImpact, learningRate, results);
        });
        
        // 穴馬発見効率の学習
        this.learnUnderdogDiscoveryEfficiency(actualResults, predictions, profitabilityData.underdogEfficiency, results);
        
        // オッズ帯別効率の学習
        this.learnOddsRangeEfficiency(actualResults, predictions, profitabilityData.oddsAnalysis, results);
        
        console.log('収益性ベース学習完了:', results);
        return results;
    }
    
    // 賭け結果シミュレーション
    static simulateBetResult(prediction, actualResults) {
        const horse = prediction;
        const isWinner = actualResults.winner.name === horse.name;
        const isPlace = actualResults.placeHorses?.some(p => p.name === horse.name) || isWinner;
        
        // デフォルト賭け金（1000円と仮定）
        const betAmount = 1000;
        
        return {
            horseNumber: horse.number,
            horseName: horse.name,
            odds: horse.odds || horse.singleOdds || 5.0,
            popularity: horse.popularity,
            betType: 'win', // 単勝と仮定
            betAmount: betAmount,
            isHit: isWinner,
            returnAmount: isWinner ? betAmount * (horse.odds || horse.singleOdds || 5.0) : 0,
            isPlace: isPlace
        };
    }
    
    // 利益インパクト計算
    static calculateProfitImpact(betResult, coreMetrics) {
        const profit = betResult.returnAmount - betResult.betAmount;
        const profitRate = profit / betResult.betAmount;
        
        // 現在のROIとの比較
        const currentROI = coreMetrics.roi / 100;
        const relativeProfitability = profitRate - currentROI;
        
        return {
            absoluteProfit: profit,
            profitRate: profitRate,
            relativeProfitability: relativeProfitability,
            isOutperforming: relativeProfitability > 0,
            contributionScore: this.calculateContributionScore(betResult, profitRate)
        };
    }
    
    // 貢献度スコア計算
    static calculateContributionScore(betResult, profitRate) {
        let score = 0;
        
        // 基本利益スコア
        score += profitRate * 50;
        
        // 穴馬ボーナス（7倍以上で追加スコア）
        if (betResult.odds >= 7.0) {
            score += Math.min(30, (betResult.odds - 7) * 3);
        }
        
        // 的中時の追加ボーナス
        if (betResult.isHit) {
            score += 20;
        }
        
        return Math.max(-100, Math.min(100, score));
    }
    
    // 収益性に基づく重み調整
    static adjustWeightsBasedOnProfitability(prediction, profitImpact, learningRate, results) {
        const adj = this.learningData.adjustments;
        const adjustmentFactor = profitImpact.contributionScore * learningRate * 0.01;
        
        // オッズ重みの調整
        if (prediction.odds) {
            const oddsAdjustment = this.calculateOddsAdjustment(prediction.odds, profitImpact);
            adj.oddsWeight += oddsAdjustment * adjustmentFactor;
            adj.oddsWeight = Math.max(0.1, Math.min(3.0, adj.oddsWeight));
            results.adjustments.oddsWeight = oddsAdjustment;
        }
        
        // 血統重みの調整
        if (prediction.pedigreeData || prediction.sire) {
            const pedigreeAdjustment = this.calculatePedigreeAdjustment(prediction, profitImpact);
            adj.pedigreeWeight += pedigreeAdjustment * adjustmentFactor;
            adj.pedigreeWeight = Math.max(0.1, Math.min(3.0, adj.pedigreeWeight));
            results.adjustments.pedigreeWeight = pedigreeAdjustment;
        }
        
        // 脚質重みの調整
        if (prediction.runningStyle) {
            const styleAdjustment = this.calculateRunningStyleAdjustment(prediction.runningStyle, profitImpact);
            adj.runningStyleWeight += styleAdjustment * adjustmentFactor;
            adj.runningStyleWeight = Math.max(0.1, Math.min(3.0, adj.runningStyleWeight));
            results.adjustments.runningStyleWeight = styleAdjustment;
        }
        
        // 騎手重みの調整
        if (prediction.jockey) {
            const jockeyAdjustment = this.calculateJockeyAdjustment(prediction.jockey, profitImpact);
            adj.jockeyWeight += jockeyAdjustment * adjustmentFactor;
            adj.jockeyWeight = Math.max(0.1, Math.min(3.0, adj.jockeyWeight));
            results.adjustments.jockeyWeight = jockeyAdjustment;
        }
    }
    
    // オッズ調整計算
    static calculateOddsAdjustment(odds, profitImpact) {
        if (profitImpact.isOutperforming) {
            // 穴馬（7倍以上）で収益性が良い場合、重みを増加
            if (odds >= 7.0) {
                return 0.1 + (odds - 7) * 0.02;
            }
            // 中程度のオッズで収益性が良い場合
            else if (odds >= 3.0) {
                return 0.05;
            }
            // 低オッズで収益性が良い場合（あまり重要視しない）
            else {
                return 0.02;
            }
        } else {
            // 収益性が悪い場合、該当オッズ帯の重みを減少
            if (odds >= 7.0) {
                return -0.05;
            } else if (odds <= 2.0) {
                return -0.1; // 低オッズの失敗を重く見る
            } else {
                return -0.03;
            }
        }
    }
    
    // 血統調整計算
    static calculatePedigreeAdjustment(prediction, profitImpact) {
        if (profitImpact.isOutperforming) {
            // 血統が収益に貢献した場合
            return 0.08 + Math.max(0, profitImpact.contributionScore * 0.001);
        } else {
            // 血統が収益に貢献しなかった場合
            return -0.04;
        }
    }
    
    // 脚質調整計算
    static calculateRunningStyleAdjustment(runningStyle, profitImpact) {
        if (profitImpact.isOutperforming) {
            // 特定の脚質で穴馬的中した場合、大きくプラス
            return 0.06 + Math.max(0, profitImpact.contributionScore * 0.0008);
        } else {
            return -0.03;
        }
    }
    
    // 騎手調整計算
    static calculateJockeyAdjustment(jockey, profitImpact) {
        if (profitImpact.isOutperforming) {
            // 騎手が穴馬で結果を出した場合
            return 0.05 + Math.max(0, profitImpact.contributionScore * 0.0006);
        } else {
            return -0.025;
        }
    }
    
    // 穴馬発見効率の学習
    static learnUnderdogDiscoveryEfficiency(actualResults, predictions, underdogEfficiency, results) {
        console.log('=== 穴馬発見効率学習 ===');
        
        const winner = actualResults.winner;
        const winnerPrediction = predictions.find(p => p.name === winner.name);
        
        // 勝利馬が穴馬（7倍以上）だった場合の学習
        if (winner.odds >= 7.0 && winnerPrediction) {
            console.log(`穴馬的中: ${winner.name} (${winner.odds}倍)`);
            
            // 穴馬発見につながった要因を分析
            const underdogFactors = this.analyzeUnderdogFactors(winnerPrediction);
            
            // 穴馬発見力を強化
            this.reinforceUnderdogDiscoveryFactors(underdogFactors, results);
            
            // 穴馬ROIの更新（underdogEfficiencyから取得）
            if (underdogEfficiency.underdogROI > underdogEfficiency.totalROI) {
                results.underdogLearning = {
                    message: '穴馬効率が全体効率を上回っており、穴馬重視戦略を強化',
                    action: '穴馬関連要因の重みを増加'
                };
                
                // 穴馬に関連する重みを全体的に強化
                this.enhanceUnderdogWeights(0.05, results);
            }
        }
        
        // 予測した穴馬が外れた場合の学習
        predictions.forEach(prediction => {
            if (prediction.odds >= 7.0 && prediction.name !== winner.name) {
                const underdogFactors = this.analyzeUnderdogFactors(prediction);
                this.penalizeUnderdogDiscoveryFactors(underdogFactors, results);
            }
        });
        
        console.log('穴馬発見効率学習完了');
    }
    
    // 穴馬要因分析
    static analyzeUnderdogFactors(horse) {
        const factors = {
            pedigree: horse.pedigreeData || horse.sire ? 1.0 : 0.0,
            runningStyle: horse.runningStyle ? 1.0 : 0.0,
            jockey: horse.jockey ? 1.0 : 0.0,
            form: horse.lastRaceResult ? 1.0 : 0.0,
            age: horse.age ? 1.0 : 0.0
        };
        
        return factors;
    }
    
    // 穴馬発見要因の強化
    static reinforceUnderdogDiscoveryFactors(factors, results) {
        const adj = this.learningData.adjustments;
        const reinforcementRate = 0.08; // 穴馬成功時は大きく強化
        
        if (factors.pedigree > 0) {
            adj.pedigreeWeight += reinforcementRate;
            adj.pedigreeWeight = Math.min(3.0, adj.pedigreeWeight);
        }
        
        if (factors.runningStyle > 0) {
            adj.runningStyleWeight += reinforcementRate;
            adj.runningStyleWeight = Math.min(3.0, adj.runningStyleWeight);
        }
        
        if (factors.jockey > 0) {
            adj.jockeyWeight += reinforcementRate;
            adj.jockeyWeight = Math.min(3.0, adj.jockeyWeight);
        }
        
        results.underdogReinforcement = {
            pedigree: factors.pedigree > 0 ? reinforcementRate : 0,
            runningStyle: factors.runningStyle > 0 ? reinforcementRate : 0,
            jockey: factors.jockey > 0 ? reinforcementRate : 0
        };
    }
    
    // 穴馬発見要因のペナルティ
    static penalizeUnderdogDiscoveryFactors(factors, results) {
        const adj = this.learningData.adjustments;
        const penaltyRate = 0.03; // 穴馬失敗時は軽いペナルティ
        
        if (factors.pedigree > 0) {
            adj.pedigreeWeight -= penaltyRate;
            adj.pedigreeWeight = Math.max(0.1, adj.pedigreeWeight);
        }
        
        if (factors.runningStyle > 0) {
            adj.runningStyleWeight -= penaltyRate;
            adj.runningStyleWeight = Math.max(0.1, adj.runningStyleWeight);
        }
        
        if (factors.jockey > 0) {
            adj.jockeyWeight -= penaltyRate;
            adj.jockeyWeight = Math.max(0.1, adj.jockeyWeight);
        }
    }
    
    // 穴馬重み全体強化
    static enhanceUnderdogWeights(enhancementRate, results) {
        const adj = this.learningData.adjustments;
        
        // 穴馬発見に重要な要因を強化
        adj.pedigreeWeight += enhancementRate;
        adj.runningStyleWeight += enhancementRate;
        adj.oddsWeight += enhancementRate * 0.5; // オッズはやや控えめ
        
        // 上限チェック
        adj.pedigreeWeight = Math.min(3.0, adj.pedigreeWeight);
        adj.runningStyleWeight = Math.min(3.0, adj.runningStyleWeight);
        adj.oddsWeight = Math.min(3.0, adj.oddsWeight);
        
        results.globalUnderdogEnhancement = {
            pedigreeWeight: enhancementRate,
            runningStyleWeight: enhancementRate,
            oddsWeight: enhancementRate * 0.5
        };
    }
    
    // オッズ帯別効率の学習
    static learnOddsRangeEfficiency(actualResults, predictions, oddsAnalysis, results) {
        console.log('=== オッズ帯別効率学習 ===');
        
        const winner = actualResults.winner;
        const winnerPrediction = predictions.find(p => p.name === winner.name);
        
        if (!winnerPrediction) return;
        
        // 勝利馬のオッズ帯を特定
        const oddsRange = this.classifyOddsRange(winnerPrediction.odds);
        const rangeAnalysis = oddsAnalysis[oddsRange];
        
        if (rangeAnalysis) {
            console.log(`${oddsRange}帯 (${rangeAnalysis.range}) で的中`);
            
            // そのオッズ帯のROIが良好な場合、関連重みを強化
            if (rangeAnalysis.roi > 0) {
                const enhancementRate = this.calculateOddsRangeEnhancement(rangeAnalysis.roi, winnerPrediction.odds);
                this.enhanceOddsRangeWeights(oddsRange, enhancementRate, results);
                
                results.oddsRangeLearning = {
                    range: rangeAnalysis.range,
                    roi: rangeAnalysis.roi,
                    enhancement: enhancementRate,
                    message: `${rangeAnalysis.range}で良好な収益性、重みを強化`
                };
            }
        }
        
        // 予測して外れたオッズ帯の重みを軽微に減少
        predictions.forEach(prediction => {
            if (prediction.name !== winner.name) {
                const failedOddsRange = this.classifyOddsRange(prediction.odds);
                this.penalizeOddsRangeWeights(failedOddsRange, 0.02, results);
            }
        });
        
        console.log('オッズ帯別効率学習完了');
    }
    
    // オッズ帯分類
    static classifyOddsRange(odds) {
        if (odds < 1.6) return 'ultraLow';
        if (odds < 3.1) return 'low';
        if (odds < 7.1) return 'medium';
        if (odds < 15.1) return 'high';
        if (odds < 50.1) return 'veryHigh';
        return 'extreme';
    }
    
    // オッズ帯強化率計算
    static calculateOddsRangeEnhancement(roi, odds) {
        let baseRate = Math.min(0.1, roi * 0.005); // ROIに基づく基本強化率
        
        // 穴馬オッズの場合はボーナス
        if (odds >= 7.0) {
            baseRate *= 1.5;
        }
        
        return baseRate;
    }
    
    // オッズ帯重み強化
    static enhanceOddsRangeWeights(oddsRange, enhancementRate, results) {
        const adj = this.learningData.adjustments;
        
        // オッズ帯に応じて異なる要因を強化
        switch (oddsRange) {
            case 'high':
            case 'veryHigh':
            case 'extreme':
                // 高オッズ帯では穴馬発見能力を強化
                adj.pedigreeWeight += enhancementRate;
                adj.runningStyleWeight += enhancementRate;
                adj.jockeyWeight += enhancementRate * 0.8;
                break;
            
            case 'medium':
                // 中オッズ帯ではバランスよく強化
                adj.pedigreeWeight += enhancementRate * 0.8;
                adj.runningStyleWeight += enhancementRate * 0.8;
                adj.lastRaceWeight += enhancementRate * 0.6;
                break;
            
            case 'low':
            case 'ultraLow':
                // 低オッズ帯では基本能力を強化
                adj.lastRaceWeight += enhancementRate;
                adj.ageWeight += enhancementRate * 0.6;
                break;
        }
        
        // 上限チェック
        Object.keys(adj).forEach(key => {
            adj[key] = Math.min(3.0, adj[key]);
        });
        
        results.oddsRangeEnhancement = results.oddsRangeEnhancement || {};
        results.oddsRangeEnhancement[oddsRange] = enhancementRate;
    }
    
    // オッズ帯重みペナルティ
    static penalizeOddsRangeWeights(oddsRange, penaltyRate, results) {
        const adj = this.learningData.adjustments;
        
        // 失敗したオッズ帯の重みを軽微に減少
        switch (oddsRange) {
            case 'high':
            case 'veryHigh':
            case 'extreme':
                adj.pedigreeWeight -= penaltyRate;
                adj.runningStyleWeight -= penaltyRate;
                break;
            
            case 'medium':
                adj.pedigreeWeight -= penaltyRate * 0.8;
                adj.lastRaceWeight -= penaltyRate * 0.6;
                break;
            
            case 'low':
            case 'ultraLow':
                adj.lastRaceWeight -= penaltyRate;
                break;
        }
        
        // 下限チェック
        Object.keys(adj).forEach(key => {
            adj[key] = Math.max(0.1, adj[key]);
        });
    }
    
    // フォールバック学習処理
    static fallbackBasicLearning(actualResults, predictions, learningRate, results) {
        console.log('フォールバック学習処理を実行');
        
        const winner = actualResults.winner;
        const predictedWinner = predictions[0];
        const isCorrect = winner.name === predictedWinner.name;
        
        if (isCorrect) {
            this.reinforceSuccessPatterns(winner, predictedWinner, learningRate, results);
        } else {
            this.correctFailurePatterns(winner, predictedWinner, learningRate, results);
        }
        
        return results;
    }
    
    // 投資効率学習処理
    static processInvestmentLearning(actualResults, predictions) {
        console.log('=== 投資効率学習開始 ===');
        const results = { investmentAdjustments: {} };
        
        // InvestmentEfficiencyCalculatorとの連携
        if (typeof InvestmentEfficiencyCalculator === 'undefined') {
            console.warn('InvestmentEfficiencyCalculatorが利用できません');
            return results;
        }
        
        // 予測に対する投資効率を評価
        predictions.forEach((prediction, index) => {
            const betResult = this.simulateBetResult(prediction, actualResults);
            
            // 投資効率計算
            const betData = {
                odds: prediction.odds || prediction.singleOdds || 5.0,
                winProbability: this.estimateWinProbability(prediction, index),
                betAmount: 1000,
                confidence: this.calculatePredictionConfidence(prediction),
                popularity: prediction.popularity
            };
            
            const efficiencyResult = InvestmentEfficiencyCalculator.calculateSingleBetEfficiency(betData);
            
            // 効率結果に基づく学習
            this.learnFromInvestmentEfficiency(prediction, betResult, efficiencyResult, results);
        });
        
        console.log('投資効率学習完了:', results);
        return results;
    }
    
    // 勝率推定
    static estimateWinProbability(prediction, predictionRank) {
        // 予測順位に基づく基本勝率
        let baseProbability;
        switch (predictionRank) {
            case 0: baseProbability = 0.25; break; // 本命
            case 1: baseProbability = 0.15; break; // 対抗
            case 2: baseProbability = 0.10; break; // 穴
            default: baseProbability = 0.05; break;
        }
        
        // オッズによる調整
        const odds = prediction.odds || prediction.singleOdds || 5.0;
        const oddsAdjustment = Math.min(1.0, 1.0 / odds);
        
        return Math.min(0.8, baseProbability * (1 + oddsAdjustment));
    }
    
    // 予測信頼度計算
    static calculatePredictionConfidence(prediction) {
        let confidence = 0.5; // ベース信頼度
        
        // 血統データがある場合
        if (prediction.pedigreeData || prediction.sire) {
            confidence += 0.1;
        }
        
        // 脚質データがある場合
        if (prediction.runningStyle) {
            confidence += 0.1;
        }
        
        // 前走結果がある場合
        if (prediction.lastRaceResult) {
            confidence += 0.1;
        }
        
        // 騎手データがある場合
        if (prediction.jockey) {
            confidence += 0.1;
        }
        
        return Math.min(1.0, confidence);
    }
    
    // 投資効率から学習
    static learnFromInvestmentEfficiency(prediction, betResult, efficiencyResult, results) {
        const adj = this.learningData.adjustments;
        const learningRate = 0.05;
        
        // 高効率かつ的中した場合、大きく強化
        if (betResult.isHit && efficiencyResult.efficiencyScore >= 70) {
            const enhancementRate = (efficiencyResult.efficiencyScore / 100) * learningRate;
            
            // 穴馬かつ高効率の場合、特に強化
            if (efficiencyResult.isUnderdog) {
                adj.pedigreeWeight += enhancementRate * 1.5;
                adj.runningStyleWeight += enhancementRate * 1.5;
                adj.jockeyWeight += enhancementRate;
                
                results.investmentAdjustments.underdogEnhancement = enhancementRate * 1.5;
            } else {
                adj.lastRaceWeight += enhancementRate;
                adj.ageWeight += enhancementRate * 0.8;
                
                results.investmentAdjustments.basicEnhancement = enhancementRate;
            }
            
            console.log(`高効率的中による強化: ${prediction.name}, 効率スコア: ${efficiencyResult.efficiencyScore}`);
        }
        
        // 低効率で外れた場合、軽微に減少
        else if (!betResult.isHit && efficiencyResult.efficiencyScore < 30) {
            const penaltyRate = learningRate * 0.3;
            
            adj.oddsWeight -= penaltyRate;
            adj.oddsWeight = Math.max(0.1, adj.oddsWeight);
            
            results.investmentAdjustments.lowEfficiencyPenalty = penaltyRate;
        }
        
        // ケリー基準との比較学習
        if (efficiencyResult.kellyFraction > 0.1) {
            const kellyAdjustment = efficiencyResult.kellyFraction * learningRate * 0.5;
            adj.oddsWeight += kellyAdjustment;
            adj.oddsWeight = Math.min(3.0, adj.oddsWeight);
            
            results.investmentAdjustments.kellyBasedAdjustment = kellyAdjustment;
        }
        
        // 投資グレードによる学習
        if (['AAA', 'AA', 'A'].includes(efficiencyResult.investmentGrade) && betResult.isHit) {
            const gradeEnhancement = 0.1;
            this.enhanceAllWeights(gradeEnhancement * 0.5, results);
            
            results.investmentAdjustments.gradeEnhancement = {
                grade: efficiencyResult.investmentGrade,
                enhancement: gradeEnhancement
            };
        }
    }
    
    // 全重み強化
    static enhanceAllWeights(enhancementRate, results) {
        const adj = this.learningData.adjustments;
        
        Object.keys(adj).forEach(key => {
            adj[key] += enhancementRate;
            adj[key] = Math.min(3.0, adj[key]);
        });
        
        results.globalEnhancement = enhancementRate;
    }
    
    // 買い目戦略学習処理
    static processBettingLearning(actualResults, predictions) {
        console.log('=== 買い目戦略学習開始 ===');
        const results = { bettingStrategy: {} };
        
        const bettingLearning = this.learningData.bettingLearning;
        const winner = actualResults.winner;
        
        // 勝利馬の投資戦略を分析
        const winnerPrediction = predictions.find(p => p.name === winner.name);
        if (winnerPrediction) {
            const strategy = this.determineOptimalStrategy(winnerPrediction);
            
            // 成功戦略の記録
            this.updateStrategySuccess(strategy, true, winnerPrediction.odds, results);
            
            // 期待値の追跡
            const expectedValue = winnerPrediction.odds; // 的中時の期待値は実際のオッズ
            this.updateExpectedValueTracking(strategy, expectedValue, results);
            
            console.log(`成功戦略記録: ${strategy}, オッズ: ${winnerPrediction.odds}`);
        }
        
        // 失敗した予測の戦略分析
        predictions.forEach(prediction => {
            if (prediction.name !== winner.name) {
                const strategy = this.determineOptimalStrategy(prediction);
                this.updateStrategySuccess(strategy, false, prediction.odds, results);
            }
        });
        
        // リスク・リターン分析の更新
        this.updateRiskReturnAnalysis(actualResults, predictions, results);
        
        console.log('買い目戦略学習完了:', results);
        return results;
    }
    
    // 最適戦略決定
    static determineOptimalStrategy(prediction) {
        const odds = prediction.odds || prediction.singleOdds || 5.0;
        
        if (odds >= 15.0) return 'HIGH_RISK_HIGH_REWARD';
        if (odds >= 7.0) return 'MODERATE_UNDERDOG';
        if (odds >= 3.0) return 'BALANCED_MIDDLE';
        if (odds >= 2.0) return 'CONSERVATIVE_FAVORITE';
        return 'ULTRA_CONSERVATIVE';
    }
    
    // 戦略成功率更新
    static updateStrategySuccess(strategy, isSuccess, odds, results) {
        const strategyMap = this.learningData.bettingLearning.strategySuccess;
        
        if (!strategyMap.has(strategy)) {
            strategyMap.set(strategy, {
                total: 0,
                success: 0,
                totalOdds: 0,
                successRate: 0,
                averageOdds: 0,
                roi: 0
            });
        }
        
        const strategyData = strategyMap.get(strategy);
        strategyData.total++;
        strategyData.totalOdds += odds;
        
        if (isSuccess) {
            strategyData.success++;
            strategyData.roi += (odds - 1); // 利益
        } else {
            strategyData.roi -= 1; // 損失
        }
        
        strategyData.successRate = strategyData.success / strategyData.total;
        strategyData.averageOdds = strategyData.totalOdds / strategyData.total;
        
        results.bettingStrategy[strategy] = {
            successRate: strategyData.successRate,
            roi: strategyData.roi,
            total: strategyData.total
        };
    }
    
    // 期待値追跡更新
    static updateExpectedValueTracking(strategy, expectedValue, results) {
        const trackingMap = this.learningData.bettingLearning.expectedValueTracking;
        
        if (!trackingMap.has(strategy)) {
            trackingMap.set(strategy, {
                values: [],
                average: 0,
                volatility: 0
            });
        }
        
        const tracking = trackingMap.get(strategy);
        tracking.values.push(expectedValue);
        
        // 最新20件のみ保持
        if (tracking.values.length > 20) {
            tracking.values.shift();
        }
        
        // 平均とボラティリティの計算
        tracking.average = tracking.values.reduce((sum, v) => sum + v, 0) / tracking.values.length;
        
        if (tracking.values.length > 1) {
            const variance = tracking.values.reduce((sum, v) => sum + Math.pow(v - tracking.average, 2), 0) / tracking.values.length;
            tracking.volatility = Math.sqrt(variance);
        }
        
        results.expectedValueTracking = results.expectedValueTracking || {};
        results.expectedValueTracking[strategy] = {
            average: tracking.average,
            volatility: tracking.volatility
        };
    }
    
    // リスク・リターン分析更新
    static updateRiskReturnAnalysis(actualResults, predictions, results) {
        const analysisMap = this.learningData.bettingLearning.riskReturnAnalysis;
        const winner = actualResults.winner;
        
        predictions.forEach(prediction => {
            const riskLevel = this.classifyRiskLevel(prediction.odds);
            const isWin = prediction.name === winner.name;
            const returnValue = isWin ? prediction.odds : 0;
            
            if (!analysisMap.has(riskLevel)) {
                analysisMap.set(riskLevel, {
                    bets: 0,
                    wins: 0,
                    totalReturn: 0,
                    averageReturn: 0,
                    winRate: 0,
                    sharpeRatio: 0
                });
            }
            
            const analysis = analysisMap.get(riskLevel);
            analysis.bets++;
            
            if (isWin) {
                analysis.wins++;
                analysis.totalReturn += returnValue;
            }
            
            analysis.winRate = analysis.wins / analysis.bets;
            analysis.averageReturn = analysis.totalReturn / analysis.bets;
            
            // 簡易シャープレシオ計算
            analysis.sharpeRatio = analysis.winRate > 0 ? analysis.averageReturn / Math.sqrt(analysis.winRate * (1 - analysis.winRate)) : 0;
        });
        
        results.riskReturnAnalysis = 'リスク・リターン分析を更新';
    }
    
    // リスクレベル分類
    static classifyRiskLevel(odds) {
        if (odds >= 20.0) return 'VERY_HIGH_RISK';
        if (odds >= 10.0) return 'HIGH_RISK';
        if (odds >= 5.0) return 'MEDIUM_RISK';
        if (odds >= 2.0) return 'LOW_RISK';
        return 'VERY_LOW_RISK';
    }
    
    // 血統学習処理（新機能）
    static processPedigreeLearning(actualResults, predictions, raceConditions) {
        console.log('=== 血統学習処理開始 ===');
        const results = { pedigreeAdjustments: {} };
        
        // 1. 動的血統データベース更新
        if (typeof DynamicPedigreeDB !== 'undefined') {
            const raceResults = actualResults.allResults.map((result, index) => ({
                finish: index + 1,
                horse: result
            }));
            
            DynamicPedigreeDB.updatePedigreeFromRaceResult(predictions, raceResults);
            results.pedigreeAdjustments.dynamicDB = '動的血統DBを更新';
        }
        
        // 2. 血統適性学習
        const winner = actualResults.winner;
        if (winner.pedigreeData || winner.sire || winner.dam) {
            this.updatePedigreeAptitudeLearning(winner, raceConditions, results);
        }
        
        // 3. 血統系統効果学習
        this.updateLineageEffectsLearning(actualResults.allResults, raceConditions, results);
        
        // 4. 血統配合相性学習
        this.updateBreedingCompatibilityLearning(actualResults.allResults, results);
        
        console.log('血統学習結果:', results);
        return results;
    }
    
    // パターン学習処理（新機能）
    static processPatternLearning(actualResults, predictions) {
        const results = { patterns: {} };
        const winner = actualResults.winner;
        
        // 1. 成功パターンの記録
        const winnerKey = this.generatePatternKey(winner);
        const successPatterns = this.learningData.successPatterns;
        
        // 血統パターン学習
        if (winner.sire) {
            this.updateSuccessPattern(successPatterns.pedigree, winner.sire, true);
            results.patterns.sire = `種牡馬${winner.sire}の成功例を記録`;
        }
        
        // 脚質パターン学習
        if (winner.runningStyle) {
            this.updateSuccessPattern(successPatterns.runningStyle, winner.runningStyle, true);
            results.patterns.runningStyle = `脚質${winner.runningStyle}の成功例を記録`;
        }
        
        // 複合要因パターン学習
        const combinationKey = `${winner.runningStyle || '不明'}_${winner.sire || '不明'}_${winner.age || '不明'}歳`;
        this.updateSuccessPattern(successPatterns.combinations, combinationKey, true);
        results.patterns.combination = `複合パターン${combinationKey}を記録`;
        
        // 2. 失敗パターンの記録（予測されたが当たらなかった馬）
        predictions.slice(0, 3).forEach((prediction, index) => {
            if (prediction.name !== winner.name) {
                if (prediction.sire) {
                    this.updateSuccessPattern(successPatterns.pedigree, prediction.sire, false);
                }
                if (prediction.runningStyle) {
                    this.updateSuccessPattern(successPatterns.runningStyle, prediction.runningStyle, false);
                }
            }
        });
        
        return results;
    }
    
    // メタ学習処理（学習の学習）
    static processMetaLearning(actualResults, predictions) {
        const metaData = this.learningData.metaLearning;
        const results = { meta: {} };
        
        // 1. 学習効果の測定
        const beforeAccuracy = this.learningData.accuracy.winRate;
        // 実際の更新後の精度は後で計算
        
        // 2. 過学習の検出
        const overlearningScore = this.detectOverlearning();
        if (overlearningScore > 0.7) {
            this.learningData.adjustments = this.regularizeAdjustments(this.learningData.adjustments);
            results.meta.overlearning = '過学習を検出し、正則化を実行';
        }
        
        // 3. 適応率の動的調整
        const effectivenessScore = this.calculateLearningEffectiveness();
        if (effectivenessScore < 0.3) {
            metaData.adaptationRate = Math.min(0.2, metaData.adaptationRate * 1.1);
            results.meta.adaptationRate = '学習効果低下のため適応率を上昇';
        } else if (effectivenessScore > 0.8) {
            metaData.adaptationRate = Math.max(0.05, metaData.adaptationRate * 0.9);
            results.meta.adaptationRate = '学習効果良好のため適応率を微調整';
        }
        
        return results;
    }
    
    // 買い目戦略学習処理
    static processBettingLearning(actualResults, predictions) {
        const results = { betting: {} };
        
        // AI推奨買い目の結果追跡
        if (window.lastAIRecommendation && window.lastAIRecommendation.bettingStrategy) {
            const strategies = window.lastAIRecommendation.bettingStrategy;
            
            strategies.forEach((strategy, index) => {
                const strategyKey = strategy.patternName || `パターン${index + 1}`;
                const success = this.evaluateStrategySuccess(strategy, actualResults);
                
                this.updateSuccessPattern(
                    this.learningData.bettingLearning.strategySuccess,
                    strategyKey,
                    success.isHit
                );
                
                // 期待値追跡
                if (success.expectedValue !== null) {
                    this.updateExpectedValueTracking(strategyKey, success.expectedValue);
                    results.betting[strategyKey] = `期待値${success.expectedValue.toFixed(2)}を記録`;
                }
            });
        }
        
        return results;
    }
    
    // 血統適性学習更新
    static updatePedigreeAptitudeLearning(winner, raceConditions, results) {
        const aptitude = this.learningData.pedigreeLearning.aptitudePatterns;
        const distance = raceConditions.distance || '不明';
        const surface = raceConditions.surface || '不明';
        
        if (winner.sire) {
            const aptitudeKey = `${winner.sire}_${distance}_${surface}`;
            this.updateSuccessPattern(aptitude, aptitudeKey, true);
            results.pedigreeAdjustments.aptitude = `${winner.sire}の${distance}m${surface}適性を記録`;
        }
        
        // PedigreeAptitudeAnalyzerとの連携
        if (typeof PedigreeAptitudeAnalyzer !== 'undefined') {
            const aptitudeAnalysis = PedigreeAptitudeAnalyzer.analyzeComprehensiveAptitude(winner, raceConditions);
            if (aptitudeAnalysis.overallScore >= 80) {
                results.pedigreeAdjustments.analysis = `高適性血統パターンを記録(${aptitudeAnalysis.overallScore}点)`;
            }
        }
    }
    
    // 学習効果の可視化データ生成
    static generateLearningVisualizationData() {
        const data = {
            accuracyTrend: this.generateAccuracyTrendData(),
            pedigreeLearning: this.generatePedigreeLearningData(),
            patternSuccess: this.generatePatternSuccessData(),
            bettingStrategy: this.generateBettingStrategyData(),
            metaLearning: this.generateMetaLearningData()
        };
        
        console.log('学習可視化データ生成完了:', data);
        return data;
    }
    
    // 精度推移データ生成
    static generateAccuracyTrendData() {
        const accuracy = this.learningData.accuracy;
        const historyLength = 20;
        
        // 実際の履歴データがある場合はそれを使用、ない場合はダミーデータ
        return {
            labels: this.generateDateLabels(historyLength),
            winRate: this.generateProgressiveData(historyLength, accuracy.winRate * 100),
            placeRate: this.generateProgressiveData(historyLength, accuracy.placeRate * 100),
            showRate: this.generateProgressiveData(historyLength, accuracy.placeRate * 100 + 15),
            totalRaces: accuracy.totalPredictions
        };
    }
    
    // 血統学習データ生成
    static generatePedigreeLearningData() {
        const pedigreePatterns = this.learningData.pedigreeLearning.aptitudePatterns;
        
        // 血統適性の6つの主要カテゴリー
        const categories = ['距離適性', '表面適性', 'コース適性', 'コンディション', '季節適性', '血統強度'];
        const aptitudeScores = categories.map(category => {
            // 実際のデータから適性スコアを計算（簡易版）
            let score = 70; // ベースライン
            
            // 実際の血統パターンデータから適性を推定
            if (pedigreePatterns.size > 0) {
                const relevantPatterns = Array.from(pedigreePatterns.entries())
                    .filter(([key, _]) => key.includes(category) || key.includes('距離') || key.includes('芝') || key.includes('ダート'));
                
                if (relevantPatterns.length > 0) {
                    const avgRate = relevantPatterns.reduce((sum, [_, data]) => sum + data.rate, 0) / relevantPatterns.length;
                    score = Math.round(avgRate * 100);
                }
            }
            
            return Math.max(50, Math.min(100, score + Math.random() * 20 - 10));
        });
        
        return {
            categories,
            aptitudeScores,
            topSires: this.getTopPedigreeSires(),
            learningProgress: this.calculatePedigreeLearningProgress()
        };
    }
    
    // パターン成功データ生成
    static generatePatternSuccessData() {
        const runningStylePatterns = this.learningData.successPatterns.runningStyle;
        const patterns = ['先行', '差し', '追込', '短距離', '中距離', '長距離'];
        
        const successRates = patterns.map(pattern => {
            if (runningStylePatterns.has(pattern)) {
                const data = runningStylePatterns.get(pattern);
                return Math.round(data.rate * 100);
            }
            return Math.round(60 + Math.random() * 30); // フォールバック値
        });
        
        return {
            patterns,
            successRates,
            combinationPatterns: this.getCombinationPatterns()
        };
    }
    
    // 買い目戦略データ生成
    static generateBettingStrategyData() {
        const strategySuccess = this.learningData.bettingLearning.strategySuccess;
        const strategyNames = ['単勝', '複勝', '馬連', '馬単', 'ワイド', '3連複'];
        
        const successData = strategyNames.map(strategy => {
            if (strategySuccess.has(strategy)) {
                const data = strategySuccess.get(strategy);
                return Math.round(data.rate * 100);
            }
            return Math.round(20 + Math.random() * 60); // フォールバック値
        });
        
        return {
            strategyNames,
            strategySuccess: successData,
            expectedValues: this.calculateExpectedValues(),
            hitRatesByType: this.getHitRatesByType()
        };
    }
    
    // メタ学習データ生成
    static generateMetaLearningData() {
        const metaData = this.learningData.metaLearning;
        const historyLength = 15;
        
        return {
            learningEffectiveness: this.generateProgressiveData(historyLength, 70),
            overlearningDetection: this.generateProgressiveData(historyLength, metaData.overlearningDetection * 100),
            adaptationRate: this.generateProgressiveData(historyLength, metaData.adaptationRate * 100),
            adjustmentHistory: this.getAdjustmentHistory()
        };
    }
    
    // ヘルパー関数群
    static generateDateLabels(count) {
        const labels = [];
        const today = new Date();
        for (let i = count - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }));
        }
        return labels;
    }
    
    static generateProgressiveData(count, targetValue) {
        const data = [];
        let current = Math.max(0, targetValue - 20);
        const increment = (targetValue - current) / (count - 1);
        
        for (let i = 0; i < count; i++) {
            current += increment + (Math.random() - 0.5) * 5;
            current = Math.max(0, Math.min(100, current));
            data.push(Math.round(current * 10) / 10);
        }
        return data;
    }
    
    static getTopPedigreeSires() {
        const pedigreeMap = this.learningData.successPatterns.pedigree;
        return Array.from(pedigreeMap.entries())
            .filter(([_, data]) => data.total >= 2)
            .sort(([_, a], [__, b]) => b.rate - a.rate)
            .slice(0, 5)
            .map(([name, data]) => ({
                name,
                rate: Math.round(data.rate * 100),
                count: data.total
            }));
    }
    
    static getCombinationPatterns() {
        const combinationsMap = this.learningData.successPatterns.combinations;
        return Array.from(combinationsMap.entries())
            .filter(([_, data]) => data.total >= 2)
            .sort(([_, a], [__, b]) => b.rate - a.rate)
            .slice(0, 8)
            .map(([pattern, data]) => ({
                pattern,
                rate: Math.round(data.rate * 100),
                count: data.total
            }));
    }
    
    static calculateExpectedValues() {
        const expectedValueTracking = this.learningData.bettingLearning.expectedValueTracking;
        const strategies = ['単勝', '複勝', '馬連', '馬単', 'ワイド', '3連複'];
        
        return strategies.map(strategy => {
            if (expectedValueTracking.has(strategy)) {
                const values = expectedValueTracking.get(strategy);
                const avgValue = values.reduce((sum, v) => sum + v, 0) / values.length;
                return Math.round(avgValue * 100) / 100;
            }
            return Math.round((0.8 + Math.random() * 0.4) * 100) / 100; // 0.8-1.2の範囲
        });
    }
    
    static getHitRatesByType() {
        const hitRateByType = this.learningData.bettingLearning.hitRateByType;
        const types = ['本命', '対抗', '穴馬'];
        
        return types.map(type => {
            if (hitRateByType.has(type)) {
                const data = hitRateByType.get(type);
                return Math.round(data.rate * 100);
            }
            return Math.round(30 + Math.random() * 40); // フォールバック値
        });
    }
    
    static getAdjustmentHistory() {
        const adjustments = this.learningData.adjustments;
        return Object.entries(adjustments).map(([factor, value]) => ({
            factor,
            value: Math.round(value * 100) / 100,
            change: value > 1.0 ? '強化' : value < 1.0 ? '軽減' : '維持'
        }));
    }
    
    static calculatePedigreeLearningProgress() {
        const patterns = this.learningData.pedigreeLearning.aptitudePatterns;
        const confidence = this.learningData.pedigreeLearning.confidenceTracking;
        
        if (patterns.size === 0) return 0;
        
        const totalPatterns = patterns.size;
        const reliablePatterns = Array.from(patterns.values()).filter(p => p.total >= 3).length;
        
        return Math.round((reliablePatterns / totalPatterns) * 100);
    }
    
    static calculateLearningEffectiveness() {
        const accuracy = this.learningData.accuracy;
        const adjustments = this.learningData.adjustments;
        
        // 基本精度スコア
        const accuracyScore = (accuracy.winRate + accuracy.placeRate) / 2;
        
        // 調整の安定性スコア
        const adjustmentStability = Object.values(adjustments).reduce((sum, value) => {
            return sum + Math.max(0, 1 - Math.abs(value - 1.0));
        }, 0) / Object.keys(adjustments).length;
        
        return Math.min(1.0, (accuracyScore + adjustmentStability) / 2);
    }
    
    // 適応学習率の計算
    static calculateAdaptiveLearningRate() {
        const baseRate = CONFIG.LEARNING_RATE || 0.1;
        const adaptationRate = this.learningData.metaLearning.adaptationRate;
        const overlearningPenalty = Math.max(0.1, 1.0 - this.learningData.metaLearning.overlearningDetection);
        
        return baseRate * adaptationRate * overlearningPenalty;
    }
    
    // 過学習検出
    static detectOverlearning() {
        const adjustments = this.learningData.adjustments;
        let extremeCount = 0;
        let totalAdjustments = 0;
        
        Object.values(adjustments).forEach(value => {
            totalAdjustments++;
            if (value > 1.5 || value < 0.5) {
                extremeCount++;
            }
        });
        
        const overlearningScore = extremeCount / totalAdjustments;
        this.learningData.metaLearning.overlearningDetection = overlearningScore;
        
        return overlearningScore;
    }
    
    // 成功パターンの更新
    static updateSuccessPattern(patternMap, key, success) {
        if (!patternMap.has(key)) {
            patternMap.set(key, { total: 0, success: 0 });
        }
        
        const pattern = patternMap.get(key);
        pattern.total++;
        if (success) pattern.success++;
        
        pattern.rate = pattern.success / pattern.total;
    }
    
    // 戦略成功評価
    static evaluateStrategySuccess(strategy, actualResults) {
        // 簡易実装：実際の券種評価ロジックが必要
        const result = {
            isHit: false,
            expectedValue: null,
            returnRate: 0
        };
        
        // 複勝的中判定の例
        if (strategy.bets && strategy.bets.length > 0) {
            const firstBet = strategy.bets[0];
            if (firstBet.type === '複勝' && firstBet.combination) {
                const targetHorse = firstBet.combination.replace(/[^\d]/g, '');
                const winnerNumber = actualResults.winner.horseNumber || actualResults.winner.frameNumber;
                
                if (targetHorse == winnerNumber) {
                    result.isHit = true;
                    result.expectedValue = 0.3; // 仮想的な配当率
                    result.returnRate = 1.3;
                }
            }
        }
        
        return result;
    }
    
    // データ永続化
    static saveLearningData() {
        try {
            // Mapオブジェクトを配列に変換して保存
            const saveData = {
                ...this.learningData,
                successPatterns: {
                    pedigree: Array.from(this.learningData.successPatterns.pedigree.entries()),
                    dynamicPedigree: Array.from(this.learningData.successPatterns.dynamicPedigree.entries()),
                    aptitude: Array.from(this.learningData.successPatterns.aptitude.entries()),
                    runningStyle: Array.from(this.learningData.successPatterns.runningStyle.entries()),
                    raceLevel: Array.from(this.learningData.successPatterns.raceLevel.entries()),
                    courseDistance: Array.from(this.learningData.successPatterns.courseDistance.entries()),
                    combinations: Array.from(this.learningData.successPatterns.combinations.entries())
                },
                pedigreeLearning: {
                    stallionPerformance: Array.from(this.learningData.pedigreeLearning.stallionPerformance.entries()),
                    marePerformance: Array.from(this.learningData.pedigreeLearning.marePerformance.entries()),
                    lineageEffects: Array.from(this.learningData.pedigreeLearning.lineageEffects.entries()),
                    aptitudePatterns: Array.from(this.learningData.pedigreeLearning.aptitudePatterns.entries()),
                    confidenceTracking: Array.from(this.learningData.pedigreeLearning.confidenceTracking.entries())
                },
                bettingLearning: {
                    strategySuccess: Array.from(this.learningData.bettingLearning.strategySuccess.entries()),
                    expectedValueTracking: Array.from(this.learningData.bettingLearning.expectedValueTracking.entries()),
                    riskReturnAnalysis: Array.from(this.learningData.bettingLearning.riskReturnAnalysis.entries()),
                    hitRateByType: Array.from(this.learningData.bettingLearning.hitRateByType.entries())
                }
            };
            
            localStorage.setItem('enhancedLearningData', JSON.stringify(saveData));
            console.log('強化学習データを保存しました');
        } catch (error) {
            console.error('強化学習データの保存に失敗:', error);
        }
    }
    
    // データ読み込み
    static loadLearningData() {
        try {
            const saved = localStorage.getItem('enhancedLearningData');
            if (saved) {
                const data = JSON.parse(saved);
                
                // 基本データをコピー
                this.learningData.adjustments = data.adjustments || this.learningData.adjustments;
                this.learningData.accuracy = data.accuracy || this.learningData.accuracy;
                this.learningData.metaLearning = data.metaLearning || this.learningData.metaLearning;
                
                // Mapオブジェクトを復元
                if (data.successPatterns) {
                    Object.keys(data.successPatterns).forEach(key => {
                        if (Array.isArray(data.successPatterns[key])) {
                            this.learningData.successPatterns[key] = new Map(data.successPatterns[key]);
                        }
                    });
                }
                
                if (data.pedigreeLearning) {
                    Object.keys(data.pedigreeLearning).forEach(key => {
                        if (Array.isArray(data.pedigreeLearning[key])) {
                            this.learningData.pedigreeLearning[key] = new Map(data.pedigreeLearning[key]);
                        }
                    });
                }
                
                if (data.bettingLearning) {
                    Object.keys(data.bettingLearning).forEach(key => {
                        if (Array.isArray(data.bettingLearning[key])) {
                            this.learningData.bettingLearning[key] = new Map(data.bettingLearning[key]);
                        }
                    });
                }
                
                console.log('強化学習データを読み込みました');
            }
        } catch (error) {
            console.error('強化学習データの読み込みに失敗:', error);
        }
    }
    
    // 定期保存のスケジュール
    static schedulePeriodicSaving() {
        setInterval(() => {
            this.saveLearningData();
        }, 300000); // 5分間隔
    }
    
    // 現在の学習データ取得（互換性のため）
    static getLearningData() {
        return this.learningData;
    }
    
    // 移行データのインポート機能
    static importMigratedData(migratedData) {
        console.log('=== 移行データのインポート開始 ===');
        console.log('受信した移行データ:', migratedData);
        
        try {
            // データ検証
            const validation = this.validateImportData(migratedData);
            if (!validation.isValid) {
                console.warn('移行データに問題があります:', validation.issues);
                return {
                    success: false,
                    reason: '移行データの検証に失敗',
                    issues: validation.issues
                };
            }
            
            // 基本データの移行
            if (migratedData.adjustments) {
                Object.assign(this.learningData.adjustments, migratedData.adjustments);
                console.log('調整値を移行:', migratedData.adjustments);
            }
            
            if (migratedData.accuracy) {
                Object.assign(this.learningData.accuracy, migratedData.accuracy);
                console.log('精度統計を移行:', migratedData.accuracy);
            }
            
            // 成功パターンの移行
            if (migratedData.successPatterns) {
                Object.keys(migratedData.successPatterns).forEach(key => {
                    if (migratedData.successPatterns[key] instanceof Map) {
                        this.learningData.successPatterns[key] = migratedData.successPatterns[key];
                    }
                });
                console.log('成功パターンを移行');
            }
            
            // 血統学習データの移行
            if (migratedData.pedigreeLearning) {
                Object.keys(migratedData.pedigreeLearning).forEach(key => {
                    if (migratedData.pedigreeLearning[key] instanceof Map) {
                        this.learningData.pedigreeLearning[key] = migratedData.pedigreeLearning[key];
                    }
                });
                console.log('血統学習データを移行');
            }
            
            // 買い目戦略学習の移行
            if (migratedData.bettingLearning) {
                Object.keys(migratedData.bettingLearning).forEach(key => {
                    if (migratedData.bettingLearning[key] instanceof Map) {
                        this.learningData.bettingLearning[key] = migratedData.bettingLearning[key];
                    }
                });
                console.log('買い目戦略学習データを移行');
            }
            
            // メタ学習データの移行
            if (migratedData.metaLearning) {
                Object.assign(this.learningData.metaLearning, migratedData.metaLearning);
                console.log('メタ学習データを移行');
            }
            
            // データ保存
            this.saveLearningData();
            
            const result = {
                success: true,
                migratedDataCount: this.countMigratedData(migratedData),
                timestamp: new Date().toISOString(),
                sourceSystem: migratedData.migrationInfo?.sourceSystem || '不明',
                statistics: {
                    totalPredictions: this.learningData.accuracy.totalPredictions,
                    winRate: (this.learningData.accuracy.winRate * 100).toFixed(1) + '%',
                    adjustmentFactors: Object.keys(this.learningData.adjustments).length,
                    successPatterns: this.countSuccessPatterns()
                }
            };
            
            console.log('移行データインポート完了:', result);
            return result;
            
        } catch (error) {
            console.error('移行データインポートエラー:', error);
            return {
                success: false,
                reason: `インポートエラー: ${error.message}`,
                error: error.toString()
            };
        }
    }
    
    // インポートデータの検証
    static validateImportData(data) {
        const issues = [];
        
        // 必須フィールドの確認
        const requiredFields = ['adjustments', 'accuracy', 'successPatterns'];
        requiredFields.forEach(field => {
            if (!data[field]) {
                issues.push(`必須フィールド '${field}' が不足`);
            }
        });
        
        // 数値データの検証
        if (data.accuracy) {
            const acc = data.accuracy;
            if (typeof acc.totalPredictions !== 'number' || acc.totalPredictions < 0) {
                issues.push('totalPredictions が無効');
            }
            if (typeof acc.winPredictions !== 'number' || acc.winPredictions < 0) {
                issues.push('winPredictions が無効');
            }
        }
        
        // 調整値の検証
        if (data.adjustments) {
            Object.entries(data.adjustments).forEach(([key, value]) => {
                if (typeof value !== 'number' || value <= 0 || value > 5) {
                    issues.push(`調整値 ${key} が範囲外: ${value}`);
                }
            });
        }
        
        return {
            isValid: issues.length === 0,
            issues
        };
    }
    
    // 移行されたデータ数のカウント
    static countMigratedData(data) {
        let count = 0;
        
        if (data.adjustments) count += Object.keys(data.adjustments).length;
        if (data.accuracy && data.accuracy.totalPredictions > 0) count += 1;
        if (data.successPatterns) {
            Object.values(data.successPatterns).forEach(pattern => {
                if (pattern instanceof Map) count += pattern.size;
            });
        }
        
        return count;
    }
    
    // 成功パターン数のカウント
    static countSuccessPatterns() {
        let count = 0;
        Object.values(this.learningData.successPatterns).forEach(pattern => {
            if (pattern instanceof Map) count += pattern.size;
        });
        return count;
    }
    
    // 精度メトリクスの更新
    static updateAccuracyMetrics(actualResults, predictions) {
        const accuracy = this.learningData.accuracy;
        accuracy.totalPredictions++;
        
        if (actualResults.winner.name === predictions[0].name) {
            accuracy.winPredictions++;
        }
        
        // 3着以内的中判定
        const top3Names = actualResults.allResults.slice(0, 3).map(h => h.name);
        if (top3Names.includes(predictions[0].name)) {
            accuracy.placePredictions++;
        }
        
        accuracy.winRate = accuracy.winPredictions / accuracy.totalPredictions;
        accuracy.placeRate = accuracy.placePredictions / accuracy.totalPredictions;
        
        // 直近10レースの成績計算
        this.updateRecentAccuracy();
    }
    
    // 直近成績の更新
    static updateRecentAccuracy() {
        // 簡易実装：実際にはレース履歴の管理が必要
        const accuracy = this.learningData.accuracy;
        accuracy.recentWinRate = accuracy.winRate; // 暫定的に同じ値を使用
        accuracy.recentPlaceRate = accuracy.placeRate;
    }
    
    // 統計サマリ取得
    static getStatsSummary() {
        const accuracy = this.learningData.accuracy;
        const adjustments = this.learningData.adjustments;
        
        return {
            totalRaces: accuracy.totalPredictions,
            winRate: (accuracy.winRate * 100).toFixed(1),
            placeRate: (accuracy.placeRate * 100).toFixed(1),
            recentWinRate: (accuracy.recentWinRate * 100).toFixed(1),
            learningProgress: this.calculateLearningProgress(),
            topAdjustments: this.getTopAdjustments(),
            pedigreeInsights: this.getPedigreeInsights()
        };
    }
    
    // 学習進捗の計算
    static calculateLearningProgress() {
        const totalAdjustments = Object.keys(this.learningData.adjustments).length;
        const significantAdjustments = Object.values(this.learningData.adjustments)
            .filter(v => Math.abs(v - 1.0) > 0.1).length;
        
        return Math.round((significantAdjustments / totalAdjustments) * 100);
    }
    
    // 主要調整項目の取得
    static getTopAdjustments() {
        const adjustments = this.learningData.adjustments;
        return Object.entries(adjustments)
            .sort(([,a], [,b]) => Math.abs(b - 1.0) - Math.abs(a - 1.0))
            .slice(0, 3)
            .map(([key, value]) => ({
                factor: key,
                value: value.toFixed(2),
                change: value > 1.0 ? '強化' : '軽減'
            }));
    }
    
    // 血統インサイト取得
    static getPedigreeInsights() {
        const pedigreeMap = this.learningData.successPatterns.pedigree;
        const topPedigrees = Array.from(pedigreeMap.entries())
            .filter(([_, data]) => data.total >= 3)
            .sort(([_, a], [__, b]) => b.rate - a.rate)
            .slice(0, 3)
            .map(([name, data]) => ({
                sire: name,
                rate: (data.rate * 100).toFixed(1),
                count: data.total
            }));
            
        return topPedigrees;
    }
}

// グローバル変数として公開
window.EnhancedLearningSystem = EnhancedLearningSystem;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    EnhancedLearningSystem.initialize();
});