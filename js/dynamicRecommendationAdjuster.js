// 動的推奨強度調整システム
class DynamicRecommendationAdjuster {
    
    // 調整履歴データ
    static adjustmentHistory = {
        recentResults: [], // 最近の推奨結果
        performanceMetrics: {
            hitRate: 0,
            roi: 0,
            averageConfidence: 0,
            consistency: 0
        },
        adjustmentParameters: {
            confidenceThreshold: 0.45,    // 信頼度閾値（現実的に調整）
            strengthMultiplier: 1.0,      // 強度乗数
            filterStrictness: 1.0,        // フィルタ厳格度
            adaptationRate: 0.1           // 適応率
        }
    };
    
    // パフォーマンスベース調整実行
    static adjustRecommendationStrength(currentPredictions, recentPerformance) {
        console.log('📈 動的推奨強度調整開始');
        
        // 最近のパフォーマンス分析
        const performance = this.analyzeRecentPerformance(recentPerformance);
        
        // 調整パラメータ計算
        const adjustments = this.calculateAdjustments(performance);
        
        // 推奨強度を調整
        const adjustedPredictions = this.applyAdjustments(currentPredictions, adjustments);
        
        // 調整履歴更新
        this.updateAdjustmentHistory(performance, adjustments);
        
        console.log('📊 推奨強度調整完了:', {
            元の推奨数: currentPredictions.length,
            調整後推奨数: adjustedPredictions.filter(p => p.isRecommended).length,
            調整パラメータ: adjustments
        });
        
        return adjustedPredictions;
    }
    
    // 最近のパフォーマンス分析
    static analyzeRecentPerformance(recentResults) {
        if (!recentResults || recentResults.length === 0) {
            return this.getDefaultPerformance();
        }
        
        const recent = recentResults.slice(-10); // 直近10件
        
        const performance = {
            hitRate: this.calculateHitRate(recent),
            roi: this.calculateROI(recent),
            averageConfidence: this.calculateAverageConfidence(recent),
            consistency: this.calculateConsistency(recent),
            trendDirection: this.analyzeTrend(recent)
        };
        
        // パフォーマンス評価
        performance.overallScore = this.calculateOverallScore(performance);
        performance.adjustmentNeeded = this.determineAdjustmentNeed(performance);
        
        return performance;
    }
    
    // 的中率計算
    static calculateHitRate(results) {
        const hits = results.filter(r => r.isHit).length;
        return results.length > 0 ? hits / results.length : 0;
    }
    
    // ROI計算
    static calculateROI(results) {
        const totalInvested = results.reduce((sum, r) => sum + (r.betAmount || 1000), 0);
        const totalReturned = results.reduce((sum, r) => sum + (r.returnAmount || 0), 0);
        return totalInvested > 0 ? (totalReturned - totalInvested) / totalInvested : -1;
    }
    
    // 平均信頼度計算
    static calculateAverageConfidence(results) {
        const confidences = results.map(r => r.confidence || 0.5);
        return confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    }
    
    // 一貫性計算
    static calculateConsistency(results) {
        if (results.length < 3) return 0.5;
        
        const outcomes = results.map(r => r.isHit ? 1 : 0);
        const mean = outcomes.reduce((sum, o) => sum + o, 0) / outcomes.length;
        const variance = outcomes.reduce((sum, o) => sum + Math.pow(o - mean, 2), 0) / outcomes.length;
        
        // 一貫性 = 1 - 分散（低分散ほど一貫性が高い）
        return Math.max(0, 1 - variance * 2);
    }
    
    // トレンド分析
    static analyzeTrend(results) {
        if (results.length < 5) return 'stable';
        
        const recent = results.slice(-5);
        const older = results.slice(-10, -5);
        
        const recentHitRate = this.calculateHitRate(recent);
        const olderHitRate = this.calculateHitRate(older);
        
        const difference = recentHitRate - olderHitRate;
        
        if (difference > 0.1) return 'improving';
        if (difference < -0.1) return 'declining';
        return 'stable';
    }
    
    // 総合スコア計算
    static calculateOverallScore(performance) {
        return (
            performance.hitRate * 0.3 +
            Math.max(0, performance.roi + 1) * 0.3 + // ROI正規化
            performance.averageConfidence * 0.2 +
            performance.consistency * 0.2
        );
    }
    
    // 調整必要性判定
    static determineAdjustmentNeed(performance) {
        const issues = [];
        
        if (performance.hitRate < 0.15) issues.push('low_hit_rate');
        if (performance.roi < -0.3) issues.push('poor_roi');
        if (performance.averageConfidence < 0.5) issues.push('low_confidence');
        if (performance.consistency < 0.3) issues.push('inconsistent');
        if (performance.trendDirection === 'declining') issues.push('declining_trend');
        
        return {
            needed: issues.length > 0,
            severity: issues.length >= 3 ? 'high' : issues.length >= 2 ? 'medium' : 'low',
            issues: issues
        };
    }
    
    // 調整パラメータ計算
    static calculateAdjustments(performance) {
        const current = this.adjustmentHistory.adjustmentParameters;
        const adjustments = { ...current };
        
        const adaptationRate = current.adaptationRate;
        
        // 的中率に基づく信頼度閾値調整
        if (performance.hitRate < 0.2) {
            // 的中率が低い→より厳格に
            adjustments.confidenceThreshold = Math.min(0.8, current.confidenceThreshold + adaptationRate);
            adjustments.filterStrictness = Math.min(1.5, current.filterStrictness + adaptationRate);
        } else if (performance.hitRate > 0.4) {
            // 的中率が高い→より緩和
            adjustments.confidenceThreshold = Math.max(0.5, current.confidenceThreshold - adaptationRate);
            adjustments.filterStrictness = Math.max(0.5, current.filterStrictness - adaptationRate);
        }
        
        // ROIに基づく強度乗数調整
        if (performance.roi < -0.2) {
            // ROIが悪い→推奨強度を下げる
            adjustments.strengthMultiplier = Math.max(0.5, current.strengthMultiplier - adaptationRate);
        } else if (performance.roi > 0.1) {
            // ROIが良い→推奨強度を上げる
            adjustments.strengthMultiplier = Math.min(1.5, current.strengthMultiplier + adaptationRate);
        }
        
        // トレンドに基づく適応率調整
        if (performance.trendDirection === 'declining') {
            adjustments.adaptationRate = Math.min(0.2, current.adaptationRate + 0.02);
        } else if (performance.trendDirection === 'improving') {
            adjustments.adaptationRate = Math.max(0.05, current.adaptationRate - 0.01);
        }
        
        return adjustments;
    }
    
    // 調整適用
    static applyAdjustments(predictions, adjustments) {
        return predictions.map(horse => {
            const adjusted = { ...horse };
            
            // 信頼度調整
            if (horse.reliability) {
                const reliabilityScore = horse.reliability.total;
                
                // 動的閾値適用
                const meetsThreshold = reliabilityScore >= adjustments.confidenceThreshold;
                
                // 強度乗数適用
                if (meetsThreshold) {
                    adjusted.adjustedReliability = reliabilityScore * adjustments.strengthMultiplier;
                    adjusted.dynamicRecommendationLevel = this.calculateDynamicLevel(adjusted.adjustedReliability);
                    adjusted.isRecommended = adjusted.adjustedReliability >= adjustments.confidenceThreshold;
                } else {
                    adjusted.isRecommended = false;
                    adjusted.dynamicRecommendationLevel = 'filtered';
                }
                
                // 調整理由を記録
                adjusted.adjustmentReason = {
                    originalReliability: reliabilityScore,
                    adjustedReliability: adjusted.adjustedReliability,
                    threshold: adjustments.confidenceThreshold,
                    multiplier: adjustments.strengthMultiplier,
                    strictness: adjustments.filterStrictness
                };
            }
            
            return adjusted;
        });
    }
    
    // 動的レベル計算
    static calculateDynamicLevel(adjustedReliability) {
        if (adjustedReliability >= 0.85) return 'ultra_high';
        if (adjustedReliability >= 0.75) return 'high';
        if (adjustedReliability >= 0.65) return 'medium';
        if (adjustedReliability >= 0.55) return 'low';
        return 'very_low';
    }
    
    // 調整履歴更新
    static updateAdjustmentHistory(performance, adjustments) {
        this.adjustmentHistory.performanceMetrics = performance;
        this.adjustmentHistory.adjustmentParameters = adjustments;
        
        // 履歴保存
        this.saveAdjustmentHistory();
        
        console.log('📊 調整履歴更新:', {
            パフォーマンス: performance,
            調整パラメータ: adjustments
        });
    }
    
    // デフォルトパフォーマンス
    static getDefaultPerformance() {
        return {
            hitRate: 0.25,
            roi: -0.1,
            averageConfidence: 0.6,
            consistency: 0.5,
            trendDirection: 'stable',
            overallScore: 0.5,
            adjustmentNeeded: { needed: false, severity: 'low', issues: [] }
        };
    }
    
    // 調整効果分析
    static analyzeAdjustmentEffectiveness() {
        const history = this.adjustmentHistory.recentResults;
        if (history.length < 10) return null;
        
        const beforeAdjustment = history.slice(-20, -10);
        const afterAdjustment = history.slice(-10);
        
        const beforePerformance = this.analyzeRecentPerformance(beforeAdjustment);
        const afterPerformance = this.analyzeRecentPerformance(afterAdjustment);
        
        return {
            improvement: {
                hitRate: afterPerformance.hitRate - beforePerformance.hitRate,
                roi: afterPerformance.roi - beforePerformance.roi,
                confidence: afterPerformance.averageConfidence - beforePerformance.averageConfidence
            },
            effectiveness: this.calculateAdjustmentEffectiveness(beforePerformance, afterPerformance)
        };
    }
    
    // 調整効果計算
    static calculateAdjustmentEffectiveness(before, after) {
        const hitRateImprovement = after.hitRate - before.hitRate;
        const roiImprovement = after.roi - before.roi;
        
        if (hitRateImprovement > 0.05 && roiImprovement > 0.05) return 'highly_effective';
        if (hitRateImprovement > 0.02 || roiImprovement > 0.02) return 'effective';
        if (hitRateImprovement > -0.02 && roiImprovement > -0.02) return 'neutral';
        return 'ineffective';
    }
    
    // 設定保存
    static saveAdjustmentHistory() {
        try {
            localStorage.setItem('dynamicAdjustmentHistory', JSON.stringify({
                ...this.adjustmentHistory,
                lastUpdated: new Date().toISOString()
            }));
        } catch (error) {
            console.error('動的調整履歴保存エラー:', error);
        }
    }
    
    // 設定読み込み
    static loadAdjustmentHistory() {
        try {
            const saved = localStorage.getItem('dynamicAdjustmentHistory');
            if (saved) {
                const data = JSON.parse(saved);
                this.adjustmentHistory = { ...this.adjustmentHistory, ...data };
            }
        } catch (error) {
            console.error('動的調整履歴読み込みエラー:', error);
        }
    }
    
    // 初期化
    static initialize() {
        this.loadAdjustmentHistory();
        console.log('🔧 動的推奨強度調整システム初期化完了');
    }
}

// グローバル公開
window.DynamicRecommendationAdjuster = DynamicRecommendationAdjuster;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    DynamicRecommendationAdjuster.initialize();
});