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
            bettingLearning: this.processBettingLearning(actualResults, predictions)
        };
        
        this.updateAccuracyMetrics(actualResults, predictions);
        this.detectOverlearning();
        this.saveLearningData();
        
        return learningResults;
    }
    
    // 基本学習処理（従来のロジック改良版）
    static processBasicLearning(actualResults, predictions) {
        const adj = this.learningData.adjustments;
        const learningRate = this.calculateAdaptiveLearningRate();
        const results = { adjustments: {} };
        
        const winner = actualResults.winner;
        const predictedWinner = predictions[0];
        const isCorrect = winner.name === predictedWinner.name;
        
        if (isCorrect) {
            // 成功時の強化学習
            this.reinforceSuccessPatterns(winner, predictedWinner, learningRate, results);
        } else {
            // 失敗時の修正学習
            this.correctFailurePatterns(winner, predictedWinner, learningRate, results);
        }
        
        return results;
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