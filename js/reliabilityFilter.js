// 信頼度ベース推奨フィルターシステム
class ReliabilityFilter {
    
    // 信頼度フィルター設定
    static filterConfig = {
        // 最低信頼度基準（現実的な値に調整）
        minimumConfidence: {
            ensemble: 0.4,        // アンサンブル信頼度最低40%
            prediction: 0.5,      // 予測信頼度最低50%
            stability: 0.45       // 安定性信頼度最低45%
        },
        
        // 推奨強度基準（現実的な値に調整）
        recommendationStrength: {
            high: 0.65,          // 高推奨: 65%以上
            medium: 0.5,         // 中推奨: 50%以上
            low: 0.35            // 低推奨: 35%以上
        },
        
        // フィルタリング戦略（現実的な閾値に調整）
        filteringStrategy: {
            conservative: {      // 保守的フィルタリング
                ensembleWeight: 0.4,
                predictionWeight: 0.4,
                stabilityWeight: 0.2,
                minimumScore: 0.55
            },
            balanced: {          // バランス型フィルタリング
                ensembleWeight: 0.35,
                predictionWeight: 0.35,
                stabilityWeight: 0.3,
                minimumScore: 0.45
            },
            aggressive: {        // 積極的フィルタリング
                ensembleWeight: 0.5,
                predictionWeight: 0.3,
                stabilityWeight: 0.2,
                minimumScore: 0.35
            }
        }
    };
    
    // 現在のフィルタリング戦略
    static currentStrategy = 'balanced';
    
    // 馬の信頼度スコア計算
    static calculateReliabilityScore(horse, predictions, ensembleData) {
        const strategy = this.filterConfig.filteringStrategy[this.currentStrategy];
        
        // 1. アンサンブル信頼度（高度学習システムから）
        let ensembleScore = 0.5; // デフォルト
        if (ensembleData && ensembleData.predictions) {
            const ensembleHorse = ensembleData.predictions.find(p => p.horse.name === horse.name);
            if (ensembleHorse) {
                ensembleScore = ensembleHorse.confidence || 0.5;
            }
        }
        
        // 2. 予測信頼度（従来の予測エンジンから）
        let predictionScore = 0.5; // デフォルト
        if (horse.winProbability && horse.winExpectedValue) {
            // 勝率と期待値から信頼度算出
            const probabilityScore = Math.min(horse.winProbability / 20, 1); // 20%で最大
            const expectedValueScore = Math.min(Math.max(horse.winExpectedValue - 1, 0) / 0.5, 1); // 期待値1.5で最大
            predictionScore = (probabilityScore + expectedValueScore) / 2;
        }
        
        // 3. 安定性信頼度（過去の実績から）
        let stabilityScore = 0.5; // デフォルト
        if (horse.stabilityMetrics) {
            stabilityScore = horse.stabilityMetrics.overall || 0.5;
        } else {
            // 簡易安定性計算
            const oddsStability = this.calculateOddsStability(horse.odds);
            const formStability = this.calculateFormStability(horse);
            stabilityScore = (oddsStability + formStability) / 2;
        }
        
        // 重み付き総合スコア計算
        const totalScore = (
            ensembleScore * strategy.ensembleWeight +
            predictionScore * strategy.predictionWeight +
            stabilityScore * strategy.stabilityWeight
        );
        
        return {
            total: totalScore,
            ensemble: ensembleScore,
            prediction: predictionScore,
            stability: stabilityScore,
            components: {
                ensembleScore,
                predictionScore,
                stabilityScore
            }
        };
    }
    
    // オッズ安定性計算
    static calculateOddsStability(odds) {
        const numericOdds = parseFloat(odds) || 5.0;
        
        // 適正オッズ範囲（3-15倍）で最高スコア
        if (numericOdds >= 3.0 && numericOdds <= 15.0) {
            return 0.8 + (Math.random() * 0.2); // 0.8-1.0
        } else if (numericOdds >= 2.0 && numericOdds <= 25.0) {
            return 0.6 + (Math.random() * 0.3); // 0.6-0.9
        } else {
            return 0.3 + (Math.random() * 0.4); // 0.3-0.7
        }
    }
    
    // フォーム安定性計算
    static calculateFormStability(horse) {
        if (!horse.raceHistory || horse.raceHistory.length === 0) {
            return 0.5; // デフォルト
        }
        
        const recentForm = horse.raceHistory.slice(-3); // 直近3走
        const positions = recentForm.map(race => {
            const pos = parseInt(race.position) || 10;
            return pos <= 5 ? 1 : pos <= 10 ? 0.5 : 0;
        });
        
        const avgForm = positions.reduce((sum, p) => sum + p, 0) / positions.length;
        const variance = positions.reduce((sum, p) => sum + Math.pow(p - avgForm, 2), 0) / positions.length;
        
        // 安定性 = 平均成績 - 分散ペナルティ
        return Math.max(0, avgForm - variance * 0.5);
    }
    
    // 推奨フィルタリング実行
    static filterRecommendations(predictions, ensembleData) {
        const strategy = this.filterConfig.filteringStrategy[this.currentStrategy];
        const filteredHorses = [];
        
        predictions.forEach(horse => {
            const reliability = this.calculateReliabilityScore(horse, predictions, ensembleData);
            
            // 最低スコア基準をクリアした馬のみ推奨
            if (reliability.total >= strategy.minimumScore) {
                const recommendationLevel = this.getRecommendationLevel(reliability.total);
                
                filteredHorses.push({
                    ...horse,
                    reliability: reliability,
                    recommendationLevel: recommendationLevel,
                    isRecommended: true,
                    filterReason: `信頼度スコア: ${(reliability.total * 100).toFixed(1)}%`
                });
            }
        });
        
        // 信頼度順でソート
        filteredHorses.sort((a, b) => b.reliability.total - a.reliability.total);
        
        console.log('🔍 信頼度フィルタリング結果:', {
            戦略: this.currentStrategy,
            入力: predictions.length,
            推奨: filteredHorses.length,
            フィルタリング率: `${((1 - filteredHorses.length / predictions.length) * 100).toFixed(1)}%`
        });
        
        return filteredHorses;
    }
    
    // 推奨レベル判定
    static getRecommendationLevel(score) {
        const levels = this.filterConfig.recommendationStrength;
        
        if (score >= levels.high) return 'high';
        if (score >= levels.medium) return 'medium';
        if (score >= levels.low) return 'low';
        return 'none';
    }
    
    // 推奨レベル別の投資戦略提案
    static suggestInvestmentStrategy(recommendedHorses) {
        const levelCounts = {
            high: recommendedHorses.filter(h => h.recommendationLevel === 'high').length,
            medium: recommendedHorses.filter(h => h.recommendationLevel === 'medium').length,
            low: recommendedHorses.filter(h => h.recommendationLevel === 'low').length
        };
        
        const totalRecommended = recommendedHorses.length;
        const baseInvestment = 1000; // 基本投資額
        
        const strategy = {
            totalInvestment: 0,
            distribution: {},
            expectedROI: 0,
            riskLevel: 'medium'
        };
        
        // 高信頼度馬への投資配分
        if (levelCounts.high > 0) {
            strategy.distribution.high = {
                horses: levelCounts.high,
                perHorse: Math.round(baseInvestment * 0.5 / levelCounts.high),
                total: Math.round(baseInvestment * 0.5)
            };
        }
        
        // 中信頼度馬への投資配分
        if (levelCounts.medium > 0) {
            strategy.distribution.medium = {
                horses: levelCounts.medium,
                perHorse: Math.round(baseInvestment * 0.3 / levelCounts.medium),
                total: Math.round(baseInvestment * 0.3)
            };
        }
        
        // 低信頼度馬への投資配分
        if (levelCounts.low > 0) {
            strategy.distribution.low = {
                horses: levelCounts.low,
                perHorse: Math.round(baseInvestment * 0.2 / levelCounts.low),
                total: Math.round(baseInvestment * 0.2)
            };
        }
        
        // 総投資額計算
        strategy.totalInvestment = Object.values(strategy.distribution)
            .reduce((sum, dist) => sum + dist.total, 0);
        
        // 期待ROI計算（信頼度ベース）
        const avgReliability = recommendedHorses.reduce((sum, h) => sum + h.reliability.total, 0) / totalRecommended;
        const avgOdds = recommendedHorses.reduce((sum, h) => sum + parseFloat(h.odds), 0) / totalRecommended;
        
        // 現実的な期待ROI計算
        const expectedHitRate = avgReliability * 0.25; // 信頼度から推定的中率
        const expectedPayout = avgOdds * 0.85; // オッズから推定配当（15%控除）
        strategy.expectedROI = (expectedHitRate * expectedPayout - 1) * 100;
        
        // リスクレベル判定
        if (levelCounts.high >= 2) strategy.riskLevel = 'low';
        else if (levelCounts.high >= 1) strategy.riskLevel = 'medium';
        else strategy.riskLevel = 'high';
        
        return strategy;
    }
    
    // フィルタリング戦略変更
    static setFilteringStrategy(strategyName) {
        if (this.filterConfig.filteringStrategy[strategyName]) {
            this.currentStrategy = strategyName;
            this.saveConfiguration();
            return true;
        }
        return false;
    }
    
    // 設定保存
    static saveConfiguration() {
        try {
            localStorage.setItem('reliabilityFilterConfig', JSON.stringify({
                strategy: this.currentStrategy,
                lastUpdated: new Date().toISOString()
            }));
        } catch (error) {
            console.error('信頼度フィルター設定保存エラー:', error);
        }
    }
    
    // 設定読み込み
    static loadConfiguration() {
        try {
            const saved = localStorage.getItem('reliabilityFilterConfig');
            if (saved) {
                const config = JSON.parse(saved);
                if (this.filterConfig.filteringStrategy[config.strategy]) {
                    this.currentStrategy = config.strategy;
                }
            }
        } catch (error) {
            console.error('信頼度フィルター設定読み込みエラー:', error);
        }
    }
    
    // 初期化
    static initialize() {
        this.loadConfiguration();
        console.log(`信頼度フィルターシステム初期化完了: ${this.currentStrategy}戦略`);
    }
}

// グローバル公開
window.ReliabilityFilter = ReliabilityFilter;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    ReliabilityFilter.initialize();
});