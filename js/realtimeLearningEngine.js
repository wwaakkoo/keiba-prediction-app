// リアルタイム機械学習エンジン
class RealtimeLearningEngine {
    
    // 学習設定
    static learningConfig = {
        // オンライン学習パラメータ
        onlineLearning: {
            learningRate: 0.01,           // 学習率（適応的調整）
            momentum: 0.9,                // モメンタム
            decayRate: 0.95,              // 減衰率
            batchSize: 5,                 // ミニバッチサイズ
            windowSize: 100,              // 学習ウィンドウサイズ
            adaptationThreshold: 0.05      // 適応閾値
        },
        
        // モデル更新設定
        modelUpdate: {
            updateFrequency: 'immediate',  // immediate, batch, scheduled
            validationSplit: 0.2,         // 検証データ割合
            performanceThreshold: 0.75,   // 性能閾値
            rollbackEnabled: true,        // ロールバック機能
            maxHistorySize: 1000          // 履歴最大サイズ
        },
        
        // リアルタイム監視
        monitoring: {
            accuracyWindow: 20,           // 精度監視ウィンドウ
            driftDetectionEnabled: true,  // ドリフト検出
            anomalyDetectionEnabled: true, // 異常検出
            alertThreshold: 0.1           // アラート閾値
        }
    };
    
    // 学習データストレージ
    static learningData = {
        recentResults: [],        // 最近のレース結果
        modelWeights: {},         // モデル重み
        performanceHistory: [],   // 性能履歴
        featureImportance: {},    // 特徴量重要度
        adaptationHistory: [],    // 適応履歴
        lastUpdate: null
    };
    
    // リアルタイム学習実行
    static performOnlineLearning(newRaceResult, predictions) {
        console.log('🧠 リアルタイム機械学習開始');
        
        try {
            // 1. 新データの前処理
            const processedData = this.preprocessNewData(newRaceResult, predictions);
            
            // 2. モデル性能評価
            const currentPerformance = this.evaluateCurrentModel(processedData);
            
            // 3. 適応必要性判定
            const adaptationNeeded = this.shouldAdaptModel(currentPerformance);
            
            if (adaptationNeeded) {
                // 4. オンライン学習実行
                const updatedModel = this.updateModelOnline(processedData);
                
                // 5. 更新後性能検証
                const newPerformance = this.validateUpdatedModel(updatedModel);
                
                // 6. モデル更新またはロールバック
                const updateResult = this.finalizeModelUpdate(updatedModel, newPerformance, currentPerformance);
                
                console.log('✅ リアルタイム学習完了:', {
                    適応実行: true,
                    性能改善: `${(currentPerformance * 100).toFixed(1)}% → ${(newPerformance * 100).toFixed(1)}%`,
                    更新結果: updateResult.action
                });
                
                return {
                    adapted: true,
                    performanceImprovement: newPerformance - currentPerformance,
                    updateAction: updateResult.action,
                    modelVersion: updateResult.version
                };
            } else {
                // 学習データとして蓄積のみ
                this.accumulateLearningData(processedData);
                
                console.log('📊 学習データ蓄積:', {
                    適応実行: false,
                    データ蓄積: true,
                    現在性能: `${(currentPerformance * 100).toFixed(1)}%`
                });
                
                return {
                    adapted: false,
                    performanceImprovement: 0,
                    updateAction: 'accumulate',
                    modelVersion: this.getCurrentModelVersion()
                };
            }
            
        } catch (error) {
            console.error('❌ リアルタイム学習エラー:', error);
            return {
                adapted: false,
                error: error.message,
                performanceImprovement: 0
            };
        }
    }
    
    // 新データ前処理
    static preprocessNewData(raceResult, predictions) {
        // レース結果と予測の照合
        const features = this.extractFeatures(raceResult, predictions);
        
        // 正解ラベル生成
        const labels = this.generateLabels(raceResult, predictions);
        
        // 特徴量正規化
        const normalizedFeatures = this.normalizeFeatures(features);
        
        // 学習用データセット構築
        return {
            features: normalizedFeatures,
            labels: labels,
            timestamp: Date.now(),
            raceInfo: {
                raceId: raceResult.raceId || `race_${Date.now()}`,
                participants: predictions.length,
                conditions: raceResult.conditions || {}
            }
        };
    }
    
    // 特徴量正規化
    static normalizeFeatures(features) {
        const normalized = {};
        
        // 数値特徴量の正規化
        Object.keys(features).forEach(key => {
            const value = features[key];
            if (typeof value === 'number' && !isNaN(value)) {
                // Min-Max正規化（0-1スケール）
                if (key.includes('odds')) {
                    normalized[key] = Math.max(0, Math.min(1, (value - 1) / 49)); // 1-50倍想定
                } else if (key.includes('prob') || key.includes('reliability') || key.includes('conf')) {
                    normalized[key] = Math.max(0, Math.min(1, value)); // 確率系は0-1
                } else if (key.includes('age')) {
                    normalized[key] = Math.max(0, Math.min(1, (value - 2) / 8)); // 2-10歳想定
                } else if (key.includes('weight')) {
                    normalized[key] = Math.max(0, Math.min(1, (value - 300) / 300)); // 300-600kg想定
                } else if (key.includes('distance')) {
                    normalized[key] = Math.max(0, Math.min(1, (value - 1000) / 2600)); // 1000-3600m想定
                } else if (key.includes('popularity')) {
                    normalized[key] = Math.max(0, Math.min(1, (value - 1) / 17)); // 1-18番人気想定
                } else {
                    // その他の数値は標準的な正規化
                    normalized[key] = Math.max(0, Math.min(1, value));
                }
            } else {
                // 非数値はそのまま
                normalized[key] = value;
            }
        });
        
        return normalized;
    }
    
    // 特徴量抽出
    static extractFeatures(raceResult, predictions) {
        const features = {};
        
        // 基本的な数値特徴量
        predictions.forEach((prediction, index) => {
            const prefix = `horse_${index}`;
            features[`${prefix}_odds`] = parseFloat(prediction.odds) || 0;
            features[`${prefix}_win_prob`] = prediction.winProbability || 0;
            features[`${prefix}_popularity`] = prediction.popularity || index + 1;
            features[`${prefix}_age`] = parseInt(prediction.age) || 4;
            features[`${prefix}_weight`] = parseFloat(prediction.weight) || 460;
            
            // Phase 1特徴量
            if (prediction.reliability) {
                features[`${prefix}_reliability`] = prediction.reliability.total || 0.5;
                features[`${prefix}_ensemble_conf`] = prediction.reliability.ensemble || 0.5;
                features[`${prefix}_prediction_conf`] = prediction.reliability.prediction || 0.5;
                features[`${prefix}_stability`] = prediction.reliability.stability || 0.5;
            }
            
            // Phase 2特徴量
            features[`${prefix}_investment_amount`] = prediction.investmentAmount || 0;
            features[`${prefix}_kelly_bet`] = prediction.kellyOptimalBet || 0;
        });
        
        // レース環境特徴量
        if (raceResult.conditions) {
            features['race_distance'] = raceResult.conditions.distance || 2000;
            features['track_condition'] = this.encodeTrackCondition(raceResult.conditions.trackCondition);
            features['weather'] = this.encodeWeather(raceResult.conditions.weather);
            features['race_class'] = this.encodeRaceClass(raceResult.conditions.raceClass);
        }
        
        // 市場特徴量
        const avgOdds = predictions.reduce((sum, p) => sum + parseFloat(p.odds), 0) / predictions.length;
        features['market_avg_odds'] = avgOdds;
        features['market_volatility'] = this.calculateOddsVolatility(predictions);
        features['market_confidence'] = this.calculateMarketConfidence(predictions);
        
        return features;
    }
    
    // 正解ラベル生成
    static generateLabels(raceResult, predictions) {
        const labels = {};
        
        predictions.forEach((prediction, index) => {
            const horseName = prediction.name;
            
            // 着順ラベル
            labels[`horse_${index}_win`] = raceResult.first === horseName ? 1 : 0;
            labels[`horse_${index}_place`] = [raceResult.first, raceResult.second, raceResult.third].includes(horseName) ? 1 : 0;
            
            // 順位ラベル（回帰用）
            let position = 0;
            if (raceResult.first === horseName) position = 1;
            else if (raceResult.second === horseName) position = 2;
            else if (raceResult.third === horseName) position = 3;
            else position = predictions.length; // 最下位扱い
            
            labels[`horse_${index}_position`] = position;
        });
        
        // 全体的な予測精度ラベル
        const top3Predicted = predictions.slice(0, 3).map(p => p.name);
        const actualTop3 = [raceResult.first, raceResult.second, raceResult.third];
        const hitCount = top3Predicted.filter(name => actualTop3.includes(name)).length;
        
        labels['prediction_accuracy'] = hitCount / 3;
        labels['top_prediction_hit'] = raceResult.first === predictions[0]?.name ? 1 : 0;
        
        return labels;
    }
    
    // 現在モデル性能評価
    static evaluateCurrentModel(processedData) {
        const recentResults = this.learningData.recentResults.slice(-this.learningConfig.monitoring.accuracyWindow);
        
        if (recentResults.length < 5) {
            return 0.5; // デフォルト性能
        }
        
        // 最近の予測精度計算
        const accuracies = recentResults.map(result => result.labels.prediction_accuracy || 0);
        const currentAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
        
        // トレンド分析
        const recentTrend = this.calculateTrend(accuracies);
        const performanceStability = this.calculateStability(accuracies);
        
        // 総合性能スコア
        const performanceScore = currentAccuracy * 0.6 + 
                               Math.max(0, recentTrend + 0.5) * 0.2 + 
                               performanceStability * 0.2;
        
        return Math.max(0, Math.min(1, performanceScore));
    }
    
    // 適応必要性判定
    static shouldAdaptModel(currentPerformance) {
        const config = this.learningConfig.onlineLearning;
        const monitoring = this.learningConfig.monitoring;
        
        // 性能閾値チェック
        if (currentPerformance < monitoring.alertThreshold) {
            console.log('🚨 性能低下検出 - 適応実行');
            return true;
        }
        
        // ドリフト検出
        if (monitoring.driftDetectionEnabled && this.detectConceptDrift()) {
            console.log('🌊 コンセプトドリフト検出 - 適応実行');
            return true;
        }
        
        // 定期更新
        const timeSinceLastUpdate = Date.now() - (this.learningData.lastUpdate || 0);
        const updateInterval = 24 * 60 * 60 * 1000; // 24時間
        if (timeSinceLastUpdate > updateInterval) {
            console.log('⏰ 定期更新時刻 - 適応実行');
            return true;
        }
        
        // 学習データ蓄積量チェック
        const pendingDataSize = this.learningData.recentResults.length;
        if (pendingDataSize >= config.batchSize) {
            console.log('📊 学習データ蓄積完了 - 適応実行');
            return true;
        }
        
        return false;
    }
    
    // オンライン学習モデル更新
    static updateModelOnline(newData) {
        const config = this.learningConfig.onlineLearning;
        
        // 現在の重みを取得
        let weights = { ...this.learningData.modelWeights };
        
        // 初期化（初回実行時）
        if (Object.keys(weights).length === 0) {
            weights = this.initializeModelWeights(newData.features);
        }
        
        // 勾配計算
        const gradients = this.calculateGradients(newData, weights);
        
        // 重み更新（Adam optimizer風）
        Object.keys(weights).forEach(key => {
            if (gradients[key] !== undefined) {
                // モメンタム更新
                weights[key] = weights[key] * config.momentum + 
                              gradients[key] * config.learningRate * (1 - config.momentum);
                
                // 減衰適用
                weights[key] *= config.decayRate;
            }
        });
        
        // 正規化
        const normalizedWeights = this.normalizeWeights(weights);
        
        return {
            weights: normalizedWeights,
            version: Date.now(),
            updateType: 'online',
            dataSize: this.learningData.recentResults.length
        };
    }
    
    // 更新後モデル検証
    static validateUpdatedModel(updatedModel) {
        const validationData = this.learningData.recentResults.slice(-10); // 最近10件で検証
        
        if (validationData.length < 3) {
            return 0.5; // 検証データ不足
        }
        
        let totalAccuracy = 0;
        let validCount = 0;
        
        validationData.forEach(data => {
            const prediction = this.predictWithModel(data.features, updatedModel.weights);
            const accuracy = this.calculatePredictionAccuracy(prediction, data.labels);
            
            if (!isNaN(accuracy)) {
                totalAccuracy += accuracy;
                validCount++;
            }
        });
        
        return validCount > 0 ? totalAccuracy / validCount : 0.5;
    }
    
    // モデル更新最終化
    static finalizeModelUpdate(updatedModel, newPerformance, currentPerformance) {
        const improvement = newPerformance - currentPerformance;
        const minImprovement = this.learningConfig.onlineLearning.adaptationThreshold;
        
        if (improvement > minImprovement || newPerformance > 0.7) {
            // モデル更新採用
            this.learningData.modelWeights = updatedModel.weights;
            this.learningData.lastUpdate = Date.now();
            
            // 性能履歴更新
            this.learningData.performanceHistory.push({
                timestamp: Date.now(),
                performance: newPerformance,
                improvement: improvement,
                version: updatedModel.version
            });
            
            // 古い履歴削除
            const maxHistory = this.learningConfig.modelUpdate.maxHistorySize;
            if (this.learningData.performanceHistory.length > maxHistory) {
                this.learningData.performanceHistory = this.learningData.performanceHistory.slice(-maxHistory);
            }
            
            this.saveLearningData();
            
            return {
                action: 'updated',
                version: updatedModel.version,
                improvement: improvement
            };
            
        } else {
            // ロールバック
            console.log('🔄 性能改善不十分 - ロールバック実行');
            
            return {
                action: 'rollback',
                version: this.getCurrentModelVersion(),
                improvement: 0,
                reason: `改善度${(improvement * 100).toFixed(1)}%が閾値${(minImprovement * 100).toFixed(1)}%未満`
            };
        }
    }
    
    // 学習データ蓄積
    static accumulateLearningData(processedData) {
        this.learningData.recentResults.push(processedData);
        
        // ウィンドウサイズ維持
        const windowSize = this.learningConfig.onlineLearning.windowSize;
        if (this.learningData.recentResults.length > windowSize) {
            this.learningData.recentResults.shift();
        }
        
        this.saveLearningData();
    }
    
    // ユーティリティメソッド
    static encodeTrackCondition(condition) {
        const mapping = { '良': 0, '稍重': 1, '重': 2, '不良': 3 };
        return mapping[condition] || 0;
    }
    
    static encodeWeather(weather) {
        const mapping = { '晴': 0, '曇': 1, '雨': 2, '小雨': 3, '雪': 4 };
        return mapping[weather] || 0;
    }
    
    static encodeRaceClass(raceClass) {
        const mapping = { 'G1': 5, 'G2': 4, 'G3': 3, '重賞': 2, '特別': 1, '条件': 0 };
        return mapping[raceClass] || 0;
    }
    
    static calculateOddsVolatility(predictions) {
        const odds = predictions.map(p => parseFloat(p.odds));
        const avg = odds.reduce((sum, o) => sum + o, 0) / odds.length;
        const variance = odds.reduce((sum, o) => sum + Math.pow(o - avg, 2), 0) / odds.length;
        return Math.sqrt(variance) / avg; // 変動係数
    }
    
    static calculateMarketConfidence(predictions) {
        // 1番人気のオッズが低いほど市場の信頼度が高い
        const topOdds = Math.min(...predictions.map(p => parseFloat(p.odds)));
        return Math.max(0, Math.min(1, (10 - topOdds) / 10));
    }
    
    static calculateTrend(values) {
        if (values.length < 2) return 0;
        
        const n = values.length;
        const xSum = n * (n - 1) / 2;
        const ySum = values.reduce((sum, val) => sum + val, 0);
        const xySum = values.reduce((sum, val, i) => sum + val * i, 0);
        const x2Sum = n * (n - 1) * (2 * n - 1) / 6;
        
        const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
        return Math.max(-1, Math.min(1, slope));
    }
    
    static calculateStability(values) {
        if (values.length < 2) return 1;
        
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const cv = Math.sqrt(variance) / mean; // 変動係数
        
        return Math.max(0, Math.min(1, 1 - cv));
    }
    
    static detectConceptDrift() {
        const recentResults = this.learningData.recentResults.slice(-20);
        if (recentResults.length < 20) return false;
        
        const recent = recentResults.slice(-10);
        const older = recentResults.slice(0, 10);
        
        const recentAvg = recent.reduce((sum, r) => sum + (r.labels.prediction_accuracy || 0), 0) / recent.length;
        const olderAvg = older.reduce((sum, r) => sum + (r.labels.prediction_accuracy || 0), 0) / older.length;
        
        const drift = Math.abs(recentAvg - olderAvg);
        return drift > 0.15; // 15%以上の性能変化でドリフト検出
    }
    
    // モデル重み初期化
    static initializeModelWeights(features) {
        const weights = {};
        Object.keys(features).forEach(key => {
            weights[key] = (Math.random() - 0.5) * 0.1; // 小さな初期値
        });
        return weights;
    }
    
    // 勾配計算（簡易版）
    static calculateGradients(data, weights) {
        const gradients = {};
        const prediction = this.predictWithModel(data.features, weights);
        
        // 簡易勾配計算（実際はより複雑な実装が必要）
        Object.keys(data.features).forEach(key => {
            const target = data.labels.prediction_accuracy || 0;
            const error = prediction - target;
            gradients[key] = error * data.features[key];
        });
        
        return gradients;
    }
    
    // モデルによる予測
    static predictWithModel(features, weights) {
        let prediction = 0;
        Object.keys(features).forEach(key => {
            if (weights[key] !== undefined) {
                prediction += features[key] * weights[key];
            }
        });
        
        // シグモイド関数適用
        return 1 / (1 + Math.exp(-prediction));
    }
    
    // 予測精度計算
    static calculatePredictionAccuracy(prediction, labels) {
        const target = labels.prediction_accuracy || 0;
        const error = Math.abs(prediction - target);
        return Math.max(0, 1 - error);
    }
    
    // 重み正規化
    static normalizeWeights(weights) {
        const norm = Math.sqrt(Object.values(weights).reduce((sum, w) => sum + w * w, 0));
        const normalized = {};
        
        Object.keys(weights).forEach(key => {
            normalized[key] = norm > 0 ? weights[key] / norm : weights[key];
        });
        
        return normalized;
    }
    
    // 現在モデルバージョン取得
    static getCurrentModelVersion() {
        return this.learningData.lastUpdate || Date.now();
    }
    
    // 学習状況取得
    static getLearningStatus() {
        const recentPerformance = this.learningData.performanceHistory.slice(-5);
        const currentPerformance = recentPerformance.length > 0 ? 
            recentPerformance[recentPerformance.length - 1].performance : 0;
        
        return {
            currentPerformance: currentPerformance,
            totalLearningData: this.learningData.recentResults.length,
            modelVersion: this.getCurrentModelVersion(),
            lastUpdate: this.learningData.lastUpdate,
            performanceHistory: recentPerformance,
            isAdaptationReady: this.shouldAdaptModel(currentPerformance)
        };
    }
    
    // データ保存・読み込み
    static saveLearningData() {
        try {
            localStorage.setItem('realtimeLearningData', JSON.stringify(this.learningData));
        } catch (error) {
            console.error('リアルタイム学習データ保存エラー:', error);
        }
    }
    
    static loadLearningData() {
        try {
            const saved = localStorage.getItem('realtimeLearningData');
            if (saved) {
                this.learningData = { ...this.learningData, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('リアルタイム学習データ読み込みエラー:', error);
        }
    }
    
    // 初期化
    static initialize() {
        this.loadLearningData();
        console.log('🧠 リアルタイム機械学習エンジン初期化完了:', {
            学習データ数: this.learningData.recentResults.length,
            モデルバージョン: this.getCurrentModelVersion(),
            最終更新: this.learningData.lastUpdate ? new Date(this.learningData.lastUpdate).toLocaleString() : '未更新'
        });
    }
}

// グローバル公開
window.RealtimeLearningEngine = RealtimeLearningEngine;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    RealtimeLearningEngine.initialize();
});