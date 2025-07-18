/**
 * Phase 5: キャリブレーション機能システム
 * 予測精度を実績データに基づいて校正・向上させる
 */
class CalibrationSystem {
    constructor() {
        this.calibrationData = this.loadCalibrationData();
        this.bucketSize = 10; // スコア範囲の幅
        this.minSampleSize = 5; // 最小サンプル数
        this.seasonalAdjustments = {};
        this.popularityAdjustments = {};
        this.courseAdjustments = {};
    }

    /**
     * バケットキャリブレーション
     * スコア範囲別の実際の的中率を学習し、予測確率を校正
     */
    performBucketCalibration(predictedScore, actualResult, horseData = {}) {
        const bucket = this.getScoreBucket(predictedScore);
        const key = `bucket_${bucket}`;
        
        console.log('🎯 バケットキャリブレーション開始:', {
            score: predictedScore,
            bucket: bucket,
            key: key,
            actualResult: actualResult,
            horseData: horseData
        });
        
        // データ記録
        if (!this.calibrationData[key]) {
            this.calibrationData[key] = {
                totalPredictions: 0,
                actualHits: 0,
                scoreSum: 0,
                samples: []
            };
            console.log('📊 新しいバケット作成:', key);
        }
        
        this.calibrationData[key].totalPredictions++;
        this.calibrationData[key].scoreSum += predictedScore;
        
        if (actualResult.hit) {
            this.calibrationData[key].actualHits++;
        }
        
        // 詳細サンプル記録（最新100件まで）
        this.calibrationData[key].samples.push({
            score: predictedScore,
            hit: actualResult.hit,
            date: new Date().toISOString(),
            popularity: horseData.popularity,
            course: horseData.course,
            season: this.getSeason()
        });
        
        if (this.calibrationData[key].samples.length > 100) {
            this.calibrationData[key].samples = this.calibrationData[key].samples.slice(-100);
        }
        
        console.log('📈 バケットデータ更新完了:', {
            key: key,
            totalPredictions: this.calibrationData[key].totalPredictions,
            actualHits: this.calibrationData[key].actualHits,
            hitRate: (this.calibrationData[key].actualHits / this.calibrationData[key].totalPredictions * 100).toFixed(1) + '%'
        });
        
        // 即座にデータ保存
        this.saveCalibrationData();
        
        // 保存確認
        this.verifyDataSaved(key);
        
        return this.calculateCalibratedProbability(predictedScore);
    }

    /**
     * 校正済み確率の計算
     */
    calculateCalibratedProbability(predictedScore) {
        const bucket = this.getScoreBucket(predictedScore);
        const bucketData = this.calibrationData[`bucket_${bucket}`];
        
        if (!bucketData || bucketData.totalPredictions < this.minSampleSize) {
            // サンプル不足の場合は理論値を使用（保守的調整）
            return this.scoreToTheoreticalProbability(predictedScore) * 0.85;
        }
        
        // 実績的中率を計算
        const empiricalHitRate = bucketData.actualHits / bucketData.totalPredictions;
        const averageScore = bucketData.scoreSum / bucketData.totalPredictions;
        const theoreticalProb = this.scoreToTheoreticalProbability(averageScore);
        
        // 理論値と実績値のブレンド（実績重視）
        const blendRatio = Math.min(bucketData.totalPredictions / 20, 0.8); // 最大80%実績重視
        const calibratedProb = (empiricalHitRate * blendRatio) + (theoreticalProb * (1 - blendRatio));
        
        return Math.max(0.01, Math.min(0.99, calibratedProb));
    }

    /**
     * 人気層別キャリブレーション
     */
    performPopularityCalibration(predictedScore, popularity, actualResult) {
        const popularityLayer = this.getPopularityLayer(popularity);
        const key = `popularity_${popularityLayer}`;
        
        if (!this.popularityAdjustments[key]) {
            this.popularityAdjustments[key] = {
                totalPredictions: 0,
                actualHits: 0,
                scoreBuckets: {}
            };
        }
        
        const bucket = this.getScoreBucket(predictedScore);
        const bucketKey = `score_${bucket}`;
        
        if (!this.popularityAdjustments[key].scoreBuckets[bucketKey]) {
            this.popularityAdjustments[key].scoreBuckets[bucketKey] = {
                predictions: 0,
                hits: 0,
                scoreSum: 0
            };
        }
        
        this.popularityAdjustments[key].totalPredictions++;
        this.popularityAdjustments[key].scoreBuckets[bucketKey].predictions++;
        this.popularityAdjustments[key].scoreBuckets[bucketKey].scoreSum += predictedScore;
        
        if (actualResult.hit) {
            this.popularityAdjustments[key].actualHits++;
            this.popularityAdjustments[key].scoreBuckets[bucketKey].hits++;
        }
        
        this.saveCalibrationData();
    }

    /**
     * 季節・コース別調整
     */
    performSeasonalCalibration(predictedScore, course, actualResult) {
        const season = this.getSeason();
        const key = `${season}_${course}`;
        
        if (!this.seasonalAdjustments[key]) {
            this.seasonalAdjustments[key] = {
                totalPredictions: 0,
                actualHits: 0,
                averageScore: 0,
                scoreSum: 0,
                hitsByScore: {}
            };
        }
        
        const bucket = this.getScoreBucket(predictedScore);
        if (!this.seasonalAdjustments[key].hitsByScore[bucket]) {
            this.seasonalAdjustments[key].hitsByScore[bucket] = { hits: 0, total: 0 };
        }
        
        this.seasonalAdjustments[key].totalPredictions++;
        this.seasonalAdjustments[key].scoreSum += predictedScore;
        this.seasonalAdjustments[key].hitsByScore[bucket].total++;
        
        if (actualResult.hit) {
            this.seasonalAdjustments[key].actualHits++;
            this.seasonalAdjustments[key].hitsByScore[bucket].hits++;
        }
        
        this.seasonalAdjustments[key].averageScore = 
            this.seasonalAdjustments[key].scoreSum / this.seasonalAdjustments[key].totalPredictions;
        
        this.saveCalibrationData();
    }

    /**
     * 統合校正確率の計算
     */
    getIntegratedCalibratedProbability(predictedScore, popularity, course) {
        // 基本校正確率
        let calibratedProb = this.calculateCalibratedProbability(predictedScore);
        
        // 人気層調整
        const popularityAdjustment = this.getPopularityAdjustment(predictedScore, popularity);
        calibratedProb *= popularityAdjustment;
        
        // 季節・コース調整
        const seasonalAdjustment = this.getSeasonalAdjustment(predictedScore, course);
        calibratedProb *= seasonalAdjustment;
        
        return Math.max(0.01, Math.min(0.99, calibratedProb));
    }

    /**
     * ロジスティック回帰による確率推定
     */
    performLogisticRegression(features, actualResults) {
        // 簡略化されたロジスティック回帰実装
        if (actualResults.length < 20) {
            return null; // サンプル不足
        }
        
        const weights = this.trainLogisticRegression(features, actualResults);
        return weights;
    }

    /**
     * ロジスティック回帰の訓練（簡略版）
     */
    trainLogisticRegression(features, labels) {
        // 勾配降下法による重み学習（簡略実装）
        const learningRate = 0.01;
        const iterations = 100;
        let weights = new Array(features[0].length).fill(0);
        
        for (let iter = 0; iter < iterations; iter++) {
            const gradients = new Array(weights.length).fill(0);
            
            for (let i = 0; i < features.length; i++) {
                const predicted = this.sigmoid(this.dotProduct(features[i], weights));
                const error = predicted - labels[i];
                
                for (let j = 0; j < weights.length; j++) {
                    gradients[j] += error * features[i][j];
                }
            }
            
            for (let j = 0; j < weights.length; j++) {
                weights[j] -= learningRate * gradients[j] / features.length;
            }
        }
        
        return weights;
    }

    /**
     * スコア→理論確率変換の精度向上
     */
    improveScoreToProbabilityMapping() {
        const analysis = this.analyzeScoreProbabilityRelationship();
        
        if (analysis.sampleSize < 50) {
            return {
                status: 'insufficient_data',
                message: 'データ不足のため分析できません'
            };
        }
        
        // 新しい変換式の導出
        const newMapping = this.deriveImprovedMapping(analysis);
        
        return {
            status: 'success',
            oldMapping: 'score * 0.01',
            newMapping: newMapping.formula,
            improvement: `精度向上: ${newMapping.improvement.toFixed(2)}%`,
            recommendations: newMapping.recommendations
        };
    }

    /**
     * キャリブレーション統計レポート
     */
    generateCalibrationReport() {
        const report = {
            overview: {
                totalSamples: 0,
                bucketsWithData: 0,
                averageAccuracy: 0,
                lastUpdated: new Date().toISOString()
            },
            bucketAnalysis: {},
            popularityAnalysis: {},
            seasonalAnalysis: {},
            recommendations: []
        };
        
        // バケット分析
        Object.keys(this.calibrationData).forEach(key => {
            if (key.startsWith('bucket_')) {
                const data = this.calibrationData[key];
                const bucket = key.replace('bucket_', '');
                
                report.overview.totalSamples += data.totalPredictions;
                if (data.totalPredictions >= this.minSampleSize) {
                    report.overview.bucketsWithData++;
                }
                
                const actualRate = data.actualHits / data.totalPredictions;
                const theoreticalRate = this.scoreToTheoreticalProbability(
                    data.scoreSum / data.totalPredictions
                );
                
                report.bucketAnalysis[bucket] = {
                    samples: data.totalPredictions,
                    actualHitRate: (actualRate * 100).toFixed(1) + '%',
                    theoreticalHitRate: (theoreticalRate * 100).toFixed(1) + '%',
                    accuracy: data.totalPredictions >= this.minSampleSize ? 
                        (100 - Math.abs(actualRate - theoreticalRate) * 100).toFixed(1) + '%' : 'データ不足',
                    calibrationFactor: theoreticalRate > 0 ? (actualRate / theoreticalRate).toFixed(2) : 'N/A'
                };
            }
        });
        
        // 推奨事項生成
        this.generateCalibrationRecommendations(report);
        
        return report;
    }

    /**
     * ユーティリティメソッド
     */
    getScoreBucket(score) {
        return Math.floor(score / this.bucketSize) * this.bucketSize;
    }

    getPopularityLayer(popularity) {
        if (popularity <= 3) return 'favorite';
        if (popularity <= 6) return 'midrange';
        return 'outsider';
    }

    getSeason() {
        const month = new Date().getMonth() + 1;
        if (month >= 3 && month <= 5) return 'spring';
        if (month >= 6 && month <= 8) return 'summer';
        if (month >= 9 && month <= 11) return 'autumn';
        return 'winter';
    }

    scoreToTheoreticalProbability(score) {
        // 改良版理論確率計算
        return Math.max(0.01, Math.min(0.99, score * 0.01 * 0.7)); // 保守的調整
    }

    getPopularityAdjustment(score, popularity) {
        const layer = this.getPopularityLayer(popularity);
        const data = this.popularityAdjustments[`popularity_${layer}`];
        
        if (!data || data.totalPredictions < this.minSampleSize) {
            // デフォルト調整値
            const adjustments = { favorite: 0.9, midrange: 1.0, outsider: 1.1 };
            return adjustments[layer] || 1.0;
        }
        
        const actualRate = data.actualHits / data.totalPredictions;
        const expectedRate = 0.25; // 複勝基準期待値
        
        return Math.max(0.5, Math.min(2.0, actualRate / expectedRate));
    }

    getSeasonalAdjustment(score, course) {
        const season = this.getSeason();
        const key = `${season}_${course}`;
        const data = this.seasonalAdjustments[key];
        
        if (!data || data.totalPredictions < this.minSampleSize) {
            return 1.0; // 調整なし
        }
        
        const bucket = this.getScoreBucket(score);
        const bucketData = data.hitsByScore[bucket];
        
        if (!bucketData || bucketData.total < 3) {
            return 1.0;
        }
        
        const seasonalRate = bucketData.hits / bucketData.total;
        const overallRate = data.actualHits / data.totalPredictions;
        
        return Math.max(0.7, Math.min(1.5, seasonalRate / overallRate));
    }

    // 数学的ヘルパー関数
    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    dotProduct(a, b) {
        return a.reduce((sum, val, i) => sum + val * b[i], 0);
    }

    analyzeScoreProbabilityRelationship() {
        let totalSamples = 0;
        let correlationData = [];
        
        Object.keys(this.calibrationData).forEach(key => {
            if (key.startsWith('bucket_')) {
                const data = this.calibrationData[key];
                if (data.totalPredictions >= this.minSampleSize) {
                    const avgScore = data.scoreSum / data.totalPredictions;
                    const actualRate = data.actualHits / data.totalPredictions;
                    
                    correlationData.push({ score: avgScore, rate: actualRate });
                    totalSamples += data.totalPredictions;
                }
            }
        });
        
        return {
            sampleSize: totalSamples,
            dataPoints: correlationData.length,
            correlationData: correlationData
        };
    }

    deriveImprovedMapping(analysis) {
        // 線形回帰による改良式導出（簡略版）
        const data = analysis.correlationData;
        
        if (data.length < 3) {
            return {
                formula: 'score * 0.007', // 保守的デフォルト
                improvement: 0,
                recommendations: ['データ蓄積が必要']
            };
        }
        
        // 最小二乗法
        const n = data.length;
        const sumX = data.reduce((sum, point) => sum + point.score, 0);
        const sumY = data.reduce((sum, point) => sum + point.rate, 0);
        const sumXY = data.reduce((sum, point) => sum + point.score * point.rate, 0);
        const sumX2 = data.reduce((sum, point) => sum + point.score * point.score, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        return {
            formula: `score * ${slope.toFixed(4)} + ${intercept.toFixed(4)}`,
            improvement: Math.abs(slope - 0.01) * 100,
            recommendations: [
                slope > 0.01 ? '予測が保守的すぎる傾向' : '予測が楽観的すぎる傾向',
                `補正係数: ${slope.toFixed(4)}`
            ]
        };
    }

    generateCalibrationRecommendations(report) {
        const recommendations = [];
        
        // サンプル数チェック
        if (report.overview.totalSamples < 100) {
            recommendations.push('📊 データ蓄積推奨: 精度向上のため100サンプル以上の蓄積が必要');
        }
        
        // バケット別精度チェック
        Object.keys(report.bucketAnalysis).forEach(bucket => {
            const analysis = report.bucketAnalysis[bucket];
            if (analysis.calibrationFactor !== 'N/A') {
                const factor = parseFloat(analysis.calibrationFactor);
                if (factor < 0.8 || factor > 1.2) {
                    recommendations.push(
                        `⚠️ スコア${bucket}台: 校正が必要（係数${analysis.calibrationFactor}）`
                    );
                }
            }
        });
        
        report.recommendations = recommendations;
    }

    /**
     * データ永続化
     */
    saveCalibrationData() {
        try {
            const data = {
                calibrationData: this.calibrationData,
                popularityAdjustments: this.popularityAdjustments,
                seasonalAdjustments: this.seasonalAdjustments,
                lastUpdated: new Date().toISOString()
            };
            
            console.log('💾 キャリブレーションデータ保存開始:', {
                calibrationDataKeys: Object.keys(this.calibrationData),
                totalSamples: Object.values(this.calibrationData).reduce((sum, bucket) => sum + (bucket.totalPredictions || 0), 0),
                popularityKeys: Object.keys(this.popularityAdjustments),
                seasonalKeys: Object.keys(this.seasonalAdjustments)
            });
            
            localStorage.setItem('phase5_calibration_data', JSON.stringify(data));
            console.log('✅ キャリブレーションデータ保存完了');
        } catch (error) {
            console.error('❌ キャリブレーションデータの保存に失敗:', error);
        }
    }

    loadCalibrationData() {
        try {
            const saved = localStorage.getItem('phase5_calibration_data');
            if (saved) {
                const data = JSON.parse(saved);
                this.popularityAdjustments = data.popularityAdjustments || {};
                this.seasonalAdjustments = data.seasonalAdjustments || {};
                return data.calibrationData || {};
            }
        } catch (error) {
            console.warn('キャリブレーションデータの読み込みに失敗:', error);
        }
        return {};
    }

    /**
     * データ保存確認
     */
    verifyDataSaved(bucketKey) {
        try {
            const saved = localStorage.getItem('phase5_calibration_data');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.calibrationData && data.calibrationData[bucketKey]) {
                    console.log('✅ データ保存確認済み:', {
                        bucketKey: bucketKey,
                        totalPredictions: data.calibrationData[bucketKey].totalPredictions,
                        actualHits: data.calibrationData[bucketKey].actualHits
                    });
                } else {
                    console.warn('⚠️ バケットデータが保存されていません:', bucketKey);
                }
            } else {
                console.warn('⚠️ 保存データが見つかりません');
            }
        } catch (error) {
            console.error('❌ データ保存確認エラー:', error);
        }
    }

    /**
     * システムリセット
     */
    resetCalibrationData() {
        this.calibrationData = {};
        this.popularityAdjustments = {};
        this.seasonalAdjustments = {};
        localStorage.removeItem('phase5_calibration_data');
        console.log('✅ キャリブレーションデータがリセットされました');
    }

    /**
     * デバッグ用：データ状況確認
     */
    static debugDataStatus() {
        try {
            const saved = localStorage.getItem('phase5_calibration_data');
            
            if (!saved) {
                console.log('❌ Phase 5キャリブレーションデータが見つかりません');
                return {
                    hasData: false,
                    totalSamples: 0,
                    buckets: [],
                    lastUpdated: null
                };
            }
            
            const data = JSON.parse(saved);
            const calibrationData = data.calibrationData || {};
            const buckets = Object.keys(calibrationData);
            
            const totalSamples = Object.values(calibrationData)
                .reduce((sum, bucket) => sum + (bucket.totalPredictions || 0), 0);
            
            console.log('📊 === Phase 5 キャリブレーションデータ状況 ===');
            console.log(`✅ データ保存状況: 正常`);
            console.log(`📈 総サンプル数: ${totalSamples}`);
            console.log(`🗂️ バケット数: ${buckets.length}`);
            console.log(`🕒 最終更新: ${data.lastUpdated || '不明'}`);
            
            if (buckets.length > 0) {
                console.log('\n📋 バケット詳細:');
                buckets.forEach(bucketKey => {
                    const bucket = calibrationData[bucketKey];
                    const hitRate = bucket.totalPredictions > 0 ? 
                        (bucket.actualHits / bucket.totalPredictions * 100).toFixed(1) : '0.0';
                    console.log(`  ${bucketKey}: ${bucket.totalPredictions}回予測, ${bucket.actualHits}回的中 (${hitRate}%)`);
                });
            }
            
            const popularityKeys = Object.keys(data.popularityAdjustments || {});
            const seasonalKeys = Object.keys(data.seasonalAdjustments || {});
            
            if (popularityKeys.length > 0) {
                console.log(`\n👥 人気層別調整: ${popularityKeys.length}種類`);
            }
            
            if (seasonalKeys.length > 0) {
                console.log(`🌸 季節別調整: ${seasonalKeys.length}種類`);
            }
            
            return {
                hasData: true,
                totalSamples,
                buckets: buckets.length,
                lastUpdated: data.lastUpdated,
                details: calibrationData
            };
            
        } catch (error) {
            console.error('❌ データ確認エラー:', error);
            return {
                hasData: false,
                error: error.message
            };
        }
    }

    /**
     * デバッグ用：テストデータ作成
     */
    static createTestData() {
        console.log('🧪 テストデータを作成します...');
        
        const testCalibrationSystem = new CalibrationSystem();
        
        // テストサンプルを作成
        const testSamples = [
            { score: 65, hit: true, popularity: 1 },
            { score: 72, hit: true, popularity: 2 },
            { score: 45, hit: false, popularity: 8 },
            { score: 68, hit: true, popularity: 3 },
            { score: 38, hit: false, popularity: 12 },
            { score: 75, hit: true, popularity: 1 },
            { score: 52, hit: false, popularity: 6 },
            { score: 41, hit: false, popularity: 10 }
        ];
        
        testSamples.forEach((sample, index) => {
            testCalibrationSystem.performBucketCalibration(
                sample.score,
                { hit: sample.hit, position: sample.hit ? 2 : 8 },
                { popularity: sample.popularity, course: 'テスト' }
            );
        });
        
        console.log('✅ テストデータ作成完了');
        this.debugDataStatus();
        
        return testCalibrationSystem;
    }
}

// グローバルデバッグ関数
window.checkPhase5Data = () => CalibrationSystem.debugDataStatus();
window.createPhase5TestData = () => CalibrationSystem.createTestData();
window.resetPhase5Data = () => {
    localStorage.removeItem('phase5_calibration_data');
    console.log('✅ Phase 5データをリセットしました');
};

// グローバル変数として公開
window.CalibrationSystem = CalibrationSystem;