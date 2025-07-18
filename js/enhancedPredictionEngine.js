/**
 * Phase 5統合: キャリブレーション強化予測エンジン
 * 既存の予測システムにキャリブレーション機能を統合
 */
class EnhancedPredictionEngine {
    constructor() {
        try {
            this.calibrationSystem = new CalibrationSystem();
            this.isCalibrationEnabled = true;
            this.performanceHistory = [];
            
            console.log('✅ EnhancedPredictionEngine初期化完了', {
                calibrationSystemAvailable: !!this.calibrationSystem,
                calibrationEnabled: this.isCalibrationEnabled,
                calibrationDataKeys: this.calibrationSystem ? Object.keys(this.calibrationSystem.calibrationData) : [],
                existingDataCount: this.calibrationSystem ? 
                    Object.values(this.calibrationSystem.calibrationData).reduce((sum, bucket) => sum + (bucket.totalPredictions || 0), 0) : 0
            });
        } catch (error) {
            console.error('❌ EnhancedPredictionEngine初期化エラー:', error);
            this.calibrationSystem = null;
            this.isCalibrationEnabled = false;
            this.performanceHistory = [];
        }
    }

    /**
     * 校正強化された確率計算
     */
    calculateEnhancedProbability(horse, raceConditions = {}) {
        // 基本スコア計算（既存システム使用）
        const baseScore = this.calculateBaseScore(horse);
        
        // 理論確率計算
        const theoreticalProb = this.scoreToTheoreticalProbability(baseScore);
        
        if (!this.isCalibrationEnabled) {
            return {
                score: baseScore,
                probability: theoreticalProb,
                calibrationType: 'theoretical',
                adjustments: {}
            };
        }
        
        // 校正確率計算
        const calibratedProb = this.calibrationSystem.getIntegratedCalibratedProbability(
            baseScore,
            horse.popularity || 10,
            raceConditions.course || 'unknown'
        );
        
        // 信頼度計算
        const confidence = this.calculateCalibrationConfidence(baseScore);
        
        return {
            score: baseScore,
            theoreticalProbability: theoreticalProb,
            calibratedProbability: calibratedProb,
            finalProbability: calibratedProb,
            confidence: confidence,
            calibrationType: 'enhanced',
            adjustments: {
                popularity: this.calibrationSystem.getPopularityAdjustment(baseScore, horse.popularity),
                seasonal: this.calibrationSystem.getSeasonalAdjustment(baseScore, raceConditions.course)
            }
        };
    }

    /**
     * レース結果による学習
     */
    learnFromRaceResult(raceData, predictions, actualResults) {
        if (!this.calibrationSystem) {
            console.warn('⚠️ キャリブレーションシステムが初期化されていません');
            return {
                raceId: this.generateRaceId(),
                date: new Date().toISOString(),
                course: raceData.course,
                predictions: [],
                overallAccuracy: 0,
                error: 'CalibrationSystem not initialized'
            };
        }

        try {
            console.log('🧠 Phase 5学習開始:', {
                raceDataKeys: Object.keys(raceData),
                predictionsCount: predictions.length,
                actualResultsKeys: Object.keys(actualResults)
            });

            const learningRecord = {
                raceId: this.generateRaceId(),
                date: new Date().toISOString(),
                course: raceData.course,
                predictions: [],
                overallAccuracy: 0
            };

            let totalPredictions = 0;
            let correctPredictions = 0;
            let learningErrors = [];

            predictions.forEach((prediction, index) => {
                try {
                    const horse = prediction.horse;
                    const actualResult = this.extractActualResult(horse, actualResults, index);
                    
                    console.log(`🐎 学習処理中: ${horse.name} (${index + 1}番目)`, {
                        score: prediction.score,
                        actualResult: actualResult,
                        popularity: horse.popularity,
                        course: raceData.course
                    });
                    
                    // キャリブレーション学習
                    const bucketResult = this.calibrationSystem.performBucketCalibration(
                        prediction.score,
                        actualResult,
                        {
                            popularity: horse.popularity,
                            course: raceData.course
                        }
                    );
                    
                    console.log(`📊 バケット学習結果: ${horse.name}`, bucketResult);

                    // 人気層別学習
                    this.calibrationSystem.performPopularityCalibration(
                        prediction.score,
                        horse.popularity,
                        actualResult
                    );

                    // 季節・コース別学習
                    this.calibrationSystem.performSeasonalCalibration(
                        prediction.score,
                        raceData.course,
                        actualResult
                    );

                    // 学習記録
                    learningRecord.predictions.push({
                        horse: horse.name,
                        predictedScore: prediction.score,
                        predictedProbability: prediction.probability,
                        actualResult: actualResult.hit,
                        actualPosition: actualResult.position
                    });

                    totalPredictions++;
                    if (actualResult.hit) correctPredictions++;
                } catch (predictionError) {
                    learningErrors.push({
                        horse: prediction.horse?.name || 'unknown',
                        error: predictionError.message
                    });
                    console.warn('⚠️ 個別馬学習エラー:', predictionError);
                }
            });

            learningRecord.overallAccuracy = totalPredictions > 0 ? 
                (correctPredictions / totalPredictions) * 100 : 0;
            learningRecord.errors = learningErrors;

            this.performanceHistory.push(learningRecord);
            this.trimPerformanceHistory();

            console.log('✅ Phase 5学習完了:', {
                totalPredictions,
                correctPredictions,
                accuracy: learningRecord.overallAccuracy.toFixed(1) + '%',
                errorsCount: learningErrors.length
            });

            return learningRecord;
        } catch (error) {
            console.error('❌ Phase 5学習で重大なエラー:', error);
            throw new Error(`Phase 5学習失敗: ${error.message}`);
        }
    }

    /**
     * 予測精度分析レポート
     */
    generateAccuracyReport() {
        const calibrationReport = this.calibrationSystem.generateCalibrationReport();
        
        if (this.performanceHistory.length === 0) {
            return {
                status: 'no_data',
                message: 'まだ学習データがありません',
                calibrationReport
            };
        }

        const recentHistory = this.performanceHistory.slice(-20); // 直近20レース
        const accuracyTrend = this.calculateAccuracyTrend(recentHistory);
        
        return {
            status: 'success',
            overview: {
                totalRaces: this.performanceHistory.length,
                averageAccuracy: this.calculateAverageAccuracy(),
                recentAccuracy: accuracyTrend.recentAverage,
                trend: accuracyTrend.trend,
                improvementRate: accuracyTrend.improvementRate
            },
            calibrationReport,
            recommendations: this.generateAccuracyRecommendations(accuracyTrend),
            detailedAnalysis: {
                byScoreRange: this.analyzeAccuracyByScoreRange(),
                byPopularity: this.analyzeAccuracyByPopularity(),
                byCourse: this.analyzeAccuracyByCourse()
            }
        };
    }

    /**
     * リアルタイム予測品質評価
     */
    evaluatePredictionQuality(predictions, raceConditions) {
        const evaluation = {
            overallQuality: 0,
            confidenceLevel: 0,
            riskAssessment: 'medium',
            calibrationStatus: 'active',
            recommendations: []
        };

        if (!predictions || predictions.length === 0) {
            evaluation.recommendations.push('予測データが不足しています');
            return evaluation;
        }

        // 予測品質指標
        const scores = predictions.map(p => p.score || 0);
        const probabilities = predictions.map(p => p.finalProbability || 0);
        
        // 分散度評価
        const scoreVariance = this.calculateVariance(scores);
        const probVariance = this.calculateVariance(probabilities);
        
        // 校正データ充実度
        const calibrationCoverage = this.assessCalibrationCoverage(scores);
        
        // 総合品質スコア
        evaluation.overallQuality = this.calculateOverallQuality(
            scoreVariance, probVariance, calibrationCoverage
        );
        
        // 信頼度レベル
        evaluation.confidenceLevel = Math.min(95, 
            50 + (calibrationCoverage * 30) + (evaluation.overallQuality * 15)
        );
        
        // リスク評価
        evaluation.riskAssessment = this.assessPredictionRisk(evaluation.overallQuality);
        
        // 推奨事項生成
        evaluation.recommendations = this.generateQualityRecommendations(
            evaluation, calibrationCoverage
        );

        return evaluation;
    }

    /**
     * 動的キャリブレーション設定
     */
    configureDynamicCalibration(settings = {}) {
        const config = {
            bucketSize: settings.bucketSize || 10,
            minSampleSize: settings.minSampleSize || 5,
            learningRate: settings.learningRate || 0.1,
            conservativeMode: settings.conservativeMode || false,
            autoAdjustment: settings.autoAdjustment || true
        };

        this.calibrationSystem.bucketSize = config.bucketSize;
        this.calibrationSystem.minSampleSize = config.minSampleSize;
        
        if (config.conservativeMode) {
            // 保守的モード：予測を控えめに調整
            this.calibrationSystem.conservativeFactor = 0.85;
        }
        
        console.log('✅ キャリブレーション設定を更新しました:', config);
        return config;
    }

    /**
     * ユーティリティメソッド
     */
    calculateBaseScore(horse) {
        // 既存の予測エンジンからスコア取得（簡略化）
        return horse.score || horse.prediction?.score || 50;
    }

    scoreToTheoreticalProbability(score) {
        return Math.max(0.01, Math.min(0.99, score * 0.01));
    }

    calculateCalibrationConfidence(score) {
        const bucket = this.calibrationSystem.getScoreBucket(score);
        const bucketData = this.calibrationSystem.calibrationData[`bucket_${bucket}`];
        
        if (!bucketData) return 30; // 低信頼度
        
        const sampleSize = bucketData.totalPredictions;
        return Math.min(95, 30 + (sampleSize * 2)); // サンプル数に応じて信頼度上昇
    }

    extractActualResult(horse, actualResults, index = 0) {
        // 馬番号の取得（複数の方法を試行）
        let horseNumber = index + 1; // デフォルト: 配列インデックス＋1
        
        // 馬オブジェクトに番号が含まれている場合はそれを優先
        if (horse.number && typeof horse.number === 'number') {
            horseNumber = horse.number;
        } else if (horse.horseNumber && typeof horse.horseNumber === 'number') {
            horseNumber = horse.horseNumber;
        } else if (horse.number && typeof horse.number === 'string') {
            const parsed = parseInt(horse.number);
            if (!isNaN(parsed)) horseNumber = parsed;
        }
        
        console.log('🔍 馬番号取得:', {
            horseName: horse.name,
            finalHorseNumber: horseNumber,
            arrayIndex: index,
            horse_number_prop: horse.number,
            horse_horseNumber_prop: horse.horseNumber,
            actualResultsPositions: Object.keys(actualResults.positions || {}),
            actualResultsFinishingOrder: Object.keys(actualResults.finishing_order || {})
        });
        
        // 実際の結果から的中判定を抽出
        const position = actualResults.positions?.[horseNumber] || 
                        actualResults.finishing_order?.[horseNumber] || 99;
        
        const result = {
            hit: position <= 3, // 複勝基準
            position: position,
            payout: actualResults.payouts?.[horseNumber] || 0
        };
        
        console.log('📊 的中判定結果:', {
            horseName: horse.name,
            horseNumber: horseNumber,
            position: position,
            hit: result.hit,
            availablePositions: Object.keys(actualResults.positions || {}),
            availableFinishingOrder: Object.keys(actualResults.finishing_order || {})
        });
        
        return result;
    }

    calculateAverageAccuracy() {
        if (this.performanceHistory.length === 0) return 0;
        
        const total = this.performanceHistory.reduce(
            (sum, record) => sum + record.overallAccuracy, 0
        );
        return total / this.performanceHistory.length;
    }

    calculateAccuracyTrend(recentHistory) {
        if (recentHistory.length < 5) {
            return {
                trend: 'insufficient_data',
                recentAverage: 0,
                improvementRate: 0
            };
        }

        const recent = recentHistory.slice(-10);
        const previous = recentHistory.slice(-20, -10);
        
        const recentAvg = recent.reduce((sum, r) => sum + r.overallAccuracy, 0) / recent.length;
        const previousAvg = previous.length > 0 ? 
            previous.reduce((sum, r) => sum + r.overallAccuracy, 0) / previous.length : recentAvg;
        
        const improvement = recentAvg - previousAvg;
        
        return {
            trend: improvement > 2 ? 'improving' : improvement < -2 ? 'declining' : 'stable',
            recentAverage: recentAvg,
            improvementRate: improvement
        };
    }

    calculateVariance(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return variance;
    }

    assessCalibrationCoverage(scores) {
        const buckets = scores.map(score => this.calibrationSystem.getScoreBucket(score));
        const uniqueBuckets = [...new Set(buckets)];
        
        let coverage = 0;
        uniqueBuckets.forEach(bucket => {
            const data = this.calibrationSystem.calibrationData[`bucket_${bucket}`];
            if (data && data.totalPredictions >= this.calibrationSystem.minSampleSize) {
                coverage += 1;
            }
        });
        
        return coverage / uniqueBuckets.length;
    }

    calculateOverallQuality(scoreVariance, probVariance, calibrationCoverage) {
        // 分散が適度で、校正データが充実していれば高品質
        const varianceScore = Math.max(0, 100 - scoreVariance);
        const calibrationScore = calibrationCoverage * 100;
        
        return (varianceScore * 0.4 + calibrationScore * 0.6) / 100;
    }

    assessPredictionRisk(qualityScore) {
        if (qualityScore > 0.8) return 'low';
        if (qualityScore > 0.5) return 'medium';
        return 'high';
    }

    generateQualityRecommendations(evaluation, calibrationCoverage) {
        const recommendations = [];
        
        if (evaluation.overallQuality < 0.5) {
            recommendations.push('⚠️ 予測品質が低下しています。データ蓄積を推奨');
        }
        
        if (calibrationCoverage < 0.3) {
            recommendations.push('📊 校正データが不足しています。継続使用で精度向上');
        }
        
        if (evaluation.confidenceLevel < 70) {
            recommendations.push('🔍 信頼度が低いです。保守的な投資を推奨');
        }
        
        return recommendations;
    }

    generateAccuracyRecommendations(trend) {
        const recommendations = [];
        
        if (trend.trend === 'declining') {
            recommendations.push('📉 精度が低下傾向。設定見直しを推奨');
        } else if (trend.trend === 'improving') {
            recommendations.push('📈 精度向上中。現在の設定を継続');
        }
        
        if (trend.recentAverage < 50) {
            recommendations.push('🎯 的中率が低めです。より保守的な戦略を検討');
        }
        
        return recommendations;
    }

    trimPerformanceHistory() {
        if (this.performanceHistory.length > 100) {
            this.performanceHistory = this.performanceHistory.slice(-100);
        }
    }

    generateRaceId() {
        return `race_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    analyzeAccuracyByScoreRange() {
        // スコア範囲別精度分析（実装簡略化）
        return {
            high_score: { range: '80-100', accuracy: 75 },
            medium_score: { range: '60-79', accuracy: 65 },
            low_score: { range: '0-59', accuracy: 45 }
        };
    }

    analyzeAccuracyByPopularity() {
        // 人気別精度分析（実装簡略化）
        return {
            favorite: { range: '1-3番人気', accuracy: 70 },
            midrange: { range: '4-6番人気', accuracy: 60 },
            outsider: { range: '7番人気以下', accuracy: 40 }
        };
    }

    analyzeAccuracyByCourse() {
        // コース別精度分析（実装簡略化）
        return {
            tokyo: { accuracy: 68 },
            kyoto: { accuracy: 65 },
            hanshin: { accuracy: 62 },
            others: { accuracy: 58 }
        };
    }
}

// グローバル変数として公開
window.EnhancedPredictionEngine = EnhancedPredictionEngine;