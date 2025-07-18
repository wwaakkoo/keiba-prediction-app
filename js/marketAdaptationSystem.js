// 市場環境適応型アルゴリズムシステム
class MarketAdaptationSystem {
    
    // 市場適応設定
    static adaptationConfig = {
        // オッズ変動分析
        oddsAnalysis: {
            trackingWindow: 24,          // 24時間の変動追跡
            volatilityThreshold: 0.15,   // ボラティリティ閾値
            trendDetectionPeriod: 12,    // トレンド検出期間（時間）
            significantChangeThreshold: 0.1, // 有意変動閾値
            adaptationSensitivity: 0.3   // 適応感度
        },
        
        // 競馬場特性学習
        venueCharacteristics: {
            trackingMetrics: ['winRate', 'averageOdds', 'favoritePerformance', 'surpriseRate'],
            seasonalFactors: ['spring', 'summer', 'autumn', 'winter'],
            weatherImpact: ['sunny', 'cloudy', 'rainy', 'heavy_rain'],
            adaptationSpeed: 0.05,       // 学習速度
            minimumSampleSize: 10        // 最小サンプル数
        },
        
        // 時期別特性対応
        temporalAdaptation: {
            timeFactors: ['hour', 'dayOfWeek', 'month', 'season'],
            cyclicalPatterns: ['daily', 'weekly', 'monthly', 'yearly'],
            adaptationWindow: 90,        // 90日間の適応ウィンドウ
            patternStrength: 0.7,       // パターン強度閾値
            updateFrequency: 'daily'     // 更新頻度
        },
        
        // 戦略調整設定
        strategyAdjustment: {
            baseStrategy: 'conservative', // 基本戦略
            adaptationRange: 0.3,        // 調整範囲
            confidenceThreshold: 0.8,    // 信頼度閾値
            rollbackCondition: 0.2       // ロールバック条件
        }
    };
    
    // 市場データストレージ
    static marketData = {
        oddsHistory: [],             // オッズ履歴
        venueStats: {},              // 競馬場統計
        temporalPatterns: {},        // 時系列パターン
        adaptationHistory: [],       // 適応履歴
        currentStrategy: null,       // 現在戦略
        lastUpdate: null
    };
    
    // 市場環境適応実行
    static adaptToMarketConditions(currentRaceData, recentMarketData) {
        console.log('🔄 市場環境適応分析開始');
        
        try {
            // 1. 市場状況分析
            const marketAnalysis = this.analyzeMarketConditions(recentMarketData);
            
            // 2. 競馬場特性分析
            const venueAnalysis = this.analyzeVenueCharacteristics(currentRaceData);
            
            // 3. 時期別パターン分析
            const temporalAnalysis = this.analyzeTemporalPatterns(currentRaceData);
            
            // 4. 統合適応戦略決定
            const adaptationStrategy = this.determineAdaptationStrategy(
                marketAnalysis, 
                venueAnalysis, 
                temporalAnalysis
            );
            
            // 5. 戦略調整実行
            const adjustmentResult = this.applyStrategyAdjustments(adaptationStrategy, currentRaceData);
            
            console.log('✅ 市場環境適応完了:', {
                市場ボラティリティ: `${(marketAnalysis.volatility * 100).toFixed(1)}%`,
                競馬場適合度: `${(venueAnalysis.suitability * 100).toFixed(1)}%`,
                時期別調整: `${(temporalAnalysis.adjustment * 100).toFixed(1)}%`,
                戦略調整: adjustmentResult.adjustmentType
            });
            
            return {
                marketAnalysis: marketAnalysis,
                venueAnalysis: venueAnalysis,
                temporalAnalysis: temporalAnalysis,
                adaptationStrategy: adaptationStrategy,
                adjustmentResult: adjustmentResult
            };
            
        } catch (error) {
            console.error('❌ 市場環境適応エラー:', error);
            return this.getDefaultAdaptation();
        }
    }
    
    // 市場状況分析
    static analyzeMarketConditions(recentMarketData) {
        if (!recentMarketData || recentMarketData.length === 0) {
            return this.getDefaultMarketAnalysis();
        }
        
        // オッズ変動分析
        const oddsVolatility = this.calculateOddsVolatility(recentMarketData);
        
        // トレンド分析
        const marketTrend = this.analyzeMarketTrend(recentMarketData);
        
        // 人気馬安定性分析
        const favoriteStability = this.analyzeFavoriteStability(recentMarketData);
        
        // 市場効率性分析
        const marketEfficiency = this.calculateMarketEfficiency(recentMarketData);
        
        // 異常検出
        const anomalies = this.detectMarketAnomalies(recentMarketData);
        
        return {
            volatility: oddsVolatility,
            trend: marketTrend,
            favoriteStability: favoriteStability,
            efficiency: marketEfficiency,
            anomalies: anomalies,
            riskLevel: this.calculateMarketRiskLevel(oddsVolatility, anomalies.count),
            adaptationRecommendation: this.generateMarketAdaptationRecommendation(oddsVolatility, marketTrend)
        };
    }
    
    // 競馬場特性分析
    static analyzeVenueCharacteristics(raceData) {
        const venue = raceData.venue || 'unknown';
        const distance = parseInt(raceData.distance) || 2000;
        const trackType = raceData.trackType || '芝';
        const trackCondition = raceData.trackCondition || '良';
        
        // 競馬場統計取得
        const venueStats = this.getVenueStatistics(venue);
        
        // 距離適性分析
        const distanceAnalysis = this.analyzeDistanceCharacteristics(venue, distance, trackType);
        
        // 馬場状態影響分析
        const trackConditionImpact = this.analyzeTrackConditionImpact(venue, trackCondition);
        
        // 季節性影響分析
        const seasonalImpact = this.analyzeSeasonalImpact(venue, new Date());
        
        // 総合適合度計算
        const suitability = this.calculateVenueSuitability(
            venueStats, 
            distanceAnalysis, 
            trackConditionImpact, 
            seasonalImpact
        );
        
        return {
            venue: venue,
            venueStats: venueStats,
            distanceCharacteristics: distanceAnalysis,
            trackConditionImpact: trackConditionImpact,
            seasonalImpact: seasonalImpact,
            suitability: suitability,
            recommendedAdjustments: this.generateVenueRecommendations(suitability, venueStats)
        };
    }
    
    // 時期別パターン分析
    static analyzeTemporalPatterns(raceData) {
        const currentTime = new Date();
        const hour = currentTime.getHours();
        const dayOfWeek = currentTime.getDay();
        const month = currentTime.getMonth();
        const season = this.getCurrentSeason(month);
        
        // 時間帯パターン分析
        const hourlyPattern = this.analyzeHourlyPatterns(hour);
        
        // 曜日パターン分析
        const weekdayPattern = this.analyzeWeekdayPatterns(dayOfWeek);
        
        // 月別パターン分析
        const monthlyPattern = this.analyzeMonthlyPatterns(month);
        
        // 季節パターン分析
        const seasonalPattern = this.analyzeSeasonalPatterns(season);
        
        // 統合時期調整計算
        const adjustment = this.calculateTemporalAdjustment(
            hourlyPattern,
            weekdayPattern,
            monthlyPattern,
            seasonalPattern
        );
        
        return {
            currentTime: currentTime,
            hourlyPattern: hourlyPattern,
            weekdayPattern: weekdayPattern,
            monthlyPattern: monthlyPattern,
            seasonalPattern: seasonalPattern,
            adjustment: adjustment,
            confidenceLevel: this.calculateTemporalConfidence(adjustment)
        };
    }
    
    // 統合適応戦略決定
    static determineAdaptationStrategy(marketAnalysis, venueAnalysis, temporalAnalysis) {
        const weights = {
            market: 0.4,
            venue: 0.35,
            temporal: 0.25
        };
        
        // リスクレベル統合計算
        const integratedRisk = 
            marketAnalysis.riskLevel * weights.market +
            (1 - venueAnalysis.suitability) * weights.venue +
            (1 - temporalAnalysis.confidenceLevel) * weights.temporal;
        
        // 戦略タイプ決定
        let strategyType;
        if (integratedRisk > 0.7) {
            strategyType = 'defensive';
        } else if (integratedRisk < 0.3) {
            strategyType = 'aggressive';
        } else {
            strategyType = 'balanced';
        }
        
        // 調整パラメータ計算
        const adjustmentParameters = this.calculateAdjustmentParameters(
            strategyType,
            marketAnalysis,
            venueAnalysis,
            temporalAnalysis
        );
        
        return {
            strategyType: strategyType,
            integratedRisk: integratedRisk,
            adjustmentParameters: adjustmentParameters,
            confidence: this.calculateStrategyConfidence(marketAnalysis, venueAnalysis, temporalAnalysis),
            expectedImprovement: this.estimateExpectedImprovement(strategyType, integratedRisk)
        };
    }
    
    // 戦略調整実行
    static applyStrategyAdjustments(adaptationStrategy, raceData) {
        const currentStrategy = this.getCurrentStrategy();
        const adjustmentType = adaptationStrategy.strategyType;
        
        // 調整パラメータ適用
        const adjustedParameters = this.adjustStrategyParameters(
            currentStrategy,
            adaptationStrategy.adjustmentParameters
        );
        
        // Phase 1システム調整
        const phase1Adjustments = this.adjustPhase1Systems(adjustedParameters);
        
        // Phase 2システム調整
        const phase2Adjustments = this.adjustPhase2Systems(adjustedParameters);
        
        // 調整結果保存
        this.saveStrategyAdjustments(adjustedParameters, adaptationStrategy);
        
        return {
            adjustmentType: adjustmentType,
            originalStrategy: currentStrategy,
            adjustedParameters: adjustedParameters,
            phase1Adjustments: phase1Adjustments,
            phase2Adjustments: phase2Adjustments,
            expectedImpact: adaptationStrategy.expectedImprovement
        };
    }
    
    // オッズ変動分析メソッド
    static calculateOddsVolatility(marketData) {
        if (marketData.length < 2) return 0.1; // デフォルト値
        
        const oddsChanges = [];
        for (let i = 1; i < marketData.length; i++) {
            const prevOdds = marketData[i - 1].averageOdds || 5.0;
            const currOdds = marketData[i].averageOdds || 5.0;
            const change = Math.abs(currOdds - prevOdds) / prevOdds;
            oddsChanges.push(change);
        }
        
        const avgChange = oddsChanges.reduce((sum, change) => sum + change, 0) / oddsChanges.length;
        return Math.min(1.0, avgChange * 5); // 正規化
    }
    
    static analyzeMarketTrend(marketData) {
        if (marketData.length < 3) return 0;
        
        const recentData = marketData.slice(-6); // 最近6データ点
        const values = recentData.map(d => d.favoriteWinRate || 0.3);
        
        // 単純線形回帰でトレンド計算
        const n = values.length;
        const xSum = n * (n - 1) / 2;
        const ySum = values.reduce((sum, val) => sum + val, 0);
        const xySum = values.reduce((sum, val, i) => sum + val * i, 0);
        const x2Sum = n * (n - 1) * (2 * n - 1) / 6;
        
        const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
        return Math.max(-1, Math.min(1, slope * 10)); // 正規化
    }
    
    static analyzeFavoriteStability(marketData) {
        const favoriteWinRates = marketData.map(d => d.favoriteWinRate || 0.3);
        if (favoriteWinRates.length < 2) return 0.5;
        
        const mean = favoriteWinRates.reduce((sum, rate) => sum + rate, 0) / favoriteWinRates.length;
        const variance = favoriteWinRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / favoriteWinRates.length;
        const stability = 1 - Math.sqrt(variance);
        
        return Math.max(0, Math.min(1, stability));
    }
    
    static calculateMarketEfficiency(marketData) {
        // 市場効率性の簡易計算（実際の配当と期待配当の差）
        const efficiencyScores = marketData.map(d => {
            const expectedPayout = 1 / (d.favoriteWinRate || 0.3);
            const actualAvgPayout = d.averagePayout || expectedPayout;
            const efficiency = 1 - Math.abs(actualAvgPayout - expectedPayout) / expectedPayout;
            return Math.max(0, Math.min(1, efficiency));
        });
        
        return efficiencyScores.reduce((sum, score) => sum + score, 0) / efficiencyScores.length;
    }
    
    static detectMarketAnomalies(marketData) {
        const anomalies = [];
        
        marketData.forEach((data, index) => {
            // 異常な人気馬勝率
            if (data.favoriteWinRate > 0.8 || data.favoriteWinRate < 0.1) {
                anomalies.push({
                    type: 'extreme_favorite_rate',
                    value: data.favoriteWinRate,
                    severity: 'medium'
                });
            }
            
            // 異常なオッズ分布
            if (data.averageOdds > 20 || data.averageOdds < 2) {
                anomalies.push({
                    type: 'extreme_odds',
                    value: data.averageOdds,
                    severity: 'high'
                });
            }
        });
        
        return {
            anomalies: anomalies,
            count: anomalies.length,
            severity: this.calculateAnomalySeverity(anomalies)
        };
    }
    
    // 競馬場特性分析メソッド
    static getVenueStatistics(venue) {
        const defaultStats = {
            totalRaces: 0,
            favoriteWinRate: 0.3,
            averageOdds: 5.0,
            surpriseRate: 0.1,
            trackBias: 'neutral'
        };
        
        return this.marketData.venueStats[venue] || defaultStats;
    }
    
    static analyzeDistanceCharacteristics(venue, distance, trackType) {
        // 距離カテゴリ分類
        let category;
        if (distance < 1400) category = 'sprint';
        else if (distance < 1800) category = 'mile';
        else if (distance < 2200) category = 'middle';
        else category = 'long';
        
        // 距離別特性（簡易版）
        const characteristics = {
            sprint: { favoriteAdvantage: 0.8, surpriseRate: 0.15, volatility: 0.2 },
            mile: { favoriteAdvantage: 0.7, surpriseRate: 0.12, volatility: 0.15 },
            middle: { favoriteAdvantage: 0.6, surpriseRate: 0.1, volatility: 0.1 },
            long: { favoriteAdvantage: 0.5, surpriseRate: 0.2, volatility: 0.25 }
        };
        
        return {
            category: category,
            distance: distance,
            trackType: trackType,
            characteristics: characteristics[category]
        };
    }
    
    static analyzeTrackConditionImpact(venue, trackCondition) {
        // 馬場状態による影響（簡易版）
        const impact = {
            '良': { stabilityFactor: 1.0, surpriseFactor: 1.0 },
            '稍重': { stabilityFactor: 0.9, surpriseFactor: 1.1 },
            '重': { stabilityFactor: 0.8, surpriseFactor: 1.2 },
            '不良': { stabilityFactor: 0.6, surpriseFactor: 1.4 }
        };
        
        return impact[trackCondition] || impact['良'];
    }
    
    static analyzeSeasonalImpact(venue, currentDate) {
        const month = currentDate.getMonth();
        const season = this.getCurrentSeason(month);
        
        // 季節影響（簡易版）
        const seasonalImpacts = {
            spring: { stabilityFactor: 1.0, performanceFactor: 1.0 },
            summer: { stabilityFactor: 0.9, performanceFactor: 0.95 },
            autumn: { stabilityFactor: 1.1, performanceFactor: 1.05 },
            winter: { stabilityFactor: 0.8, performanceFactor: 0.9 }
        };
        
        return seasonalImpacts[season];
    }
    
    // 戦略調整メソッド
    static adjustPhase1Systems(adjustedParameters) {
        const adjustments = {};
        
        // 信頼度フィルタ調整
        if (typeof ReliabilityFilter !== 'undefined') {
            adjustments.reliabilityThreshold = Math.max(0.3, 
                ReliabilityFilter.filterConfig.minimumConfidence.ensemble * 
                adjustedParameters.confidenceMultiplier
            );
        }
        
        return adjustments;
    }
    
    static adjustPhase2Systems(adjustedParameters) {
        const adjustments = {};
        
        // リスク管理調整
        if (typeof RiskManagementInvestmentSystem !== 'undefined') {
            adjustments.riskTolerance = Math.max(0.1, Math.min(0.5,
                adjustedParameters.riskMultiplier
            ));
        }
        
        // ケリー基準調整
        if (typeof KellyBettingSystem !== 'undefined') {
            adjustments.kellyFraction = Math.max(0.1, Math.min(1.0,
                adjustedParameters.aggressivenessMultiplier
            ));
        }
        
        return adjustments;
    }
    
    // ユーティリティメソッド
    static getCurrentSeason(month) {
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'autumn';
        return 'winter';
    }
    
    static calculateAnomalySeverity(anomalies) {
        if (anomalies.length === 0) return 'none';
        
        const highSeverityCount = anomalies.filter(a => a.severity === 'high').length;
        const mediumSeverityCount = anomalies.filter(a => a.severity === 'medium').length;
        
        if (highSeverityCount > 0) return 'high';
        if (mediumSeverityCount > 1) return 'medium';
        return 'low';
    }
    
    static calculateMarketRiskLevel(volatility, anomalyCount) {
        const riskScore = volatility * 0.7 + (anomalyCount / 5) * 0.3;
        return Math.max(0, Math.min(1, riskScore));
    }
    
    static generateMarketAdaptationRecommendation(volatility, trend) {
        if (volatility > 0.5) {
            return 'defensive'; // 高ボラティリティ時は守備的
        } else if (trend > 0.3) {
            return 'aggressive'; // 上昇トレンド時は積極的
        }
        return 'balanced';
    }
    
    // デフォルト値返却メソッド
    static getDefaultMarketAnalysis() {
        return {
            volatility: 0.15,
            trend: 0,
            favoriteStability: 0.7,
            efficiency: 0.8,
            anomalies: { anomalies: [], count: 0, severity: 'none' },
            riskLevel: 0.3,
            adaptationRecommendation: 'balanced'
        };
    }
    
    static getDefaultAdaptation() {
        return {
            marketAnalysis: this.getDefaultMarketAnalysis(),
            venueAnalysis: { suitability: 0.7 },
            temporalAnalysis: { adjustment: 0, confidenceLevel: 0.5 },
            adaptationStrategy: { strategyType: 'balanced', expectedImprovement: 0 },
            adjustmentResult: { adjustmentType: 'none' }
        };
    }
    
    // データ管理メソッド
    static saveMarketData() {
        try {
            localStorage.setItem('marketAdaptationData', JSON.stringify(this.marketData));
        } catch (error) {
            console.error('市場適応データ保存エラー:', error);
        }
    }
    
    static loadMarketData() {
        try {
            const saved = localStorage.getItem('marketAdaptationData');
            if (saved) {
                this.marketData = { ...this.marketData, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('市場適応データ読み込みエラー:', error);
        }
    }
    
    // 初期化
    static initialize() {
        this.loadMarketData();
        console.log('🔄 市場環境適応型アルゴリズム初期化完了:', {
            競馬場データ数: Object.keys(this.marketData.venueStats).length,
            オッズ履歴数: this.marketData.oddsHistory.length,
            最終更新: this.marketData.lastUpdate ? new Date(this.marketData.lastUpdate).toLocaleString() : '未更新'
        });
    }
    
    // 追加のメソッド実装（スペースの都合で簡略化）
    static calculateVenueSuitability(venueStats, distanceAnalysis, trackConditionImpact, seasonalImpact) {
        return 0.7; // 簡易実装
    }
    
    static generateVenueRecommendations(suitability, venueStats) {
        return ['standard']; // 簡易実装
    }
    
    static analyzeHourlyPatterns(hour) {
        return { pattern: 'normal', adjustment: 0 }; // 簡易実装
    }
    
    static analyzeWeekdayPatterns(dayOfWeek) {
        return { pattern: 'normal', adjustment: 0 }; // 簡易実装
    }
    
    static analyzeMonthlyPatterns(month) {
        return { pattern: 'normal', adjustment: 0 }; // 簡易実装
    }
    
    static analyzeSeasonalPatterns(season) {
        return { pattern: 'normal', adjustment: 0 }; // 簡易実装
    }
    
    static calculateTemporalAdjustment(hourly, weekday, monthly, seasonal) {
        return 0; // 簡易実装
    }
    
    static calculateTemporalConfidence(adjustment) {
        return 0.5; // 簡易実装
    }
    
    static calculateAdjustmentParameters(strategyType, marketAnalysis, venueAnalysis, temporalAnalysis) {
        return {
            confidenceMultiplier: strategyType === 'defensive' ? 1.2 : strategyType === 'aggressive' ? 0.8 : 1.0,
            riskMultiplier: strategyType === 'defensive' ? 0.7 : strategyType === 'aggressive' ? 1.3 : 1.0,
            aggressivenessMultiplier: strategyType === 'defensive' ? 0.6 : strategyType === 'aggressive' ? 1.4 : 1.0
        };
    }
    
    static calculateStrategyConfidence(marketAnalysis, venueAnalysis, temporalAnalysis) {
        return 0.7; // 簡易実装
    }
    
    static estimateExpectedImprovement(strategyType, integratedRisk) {
        return 0.05; // 簡易実装
    }
    
    static getCurrentStrategy() {
        return this.marketData.currentStrategy || 'balanced';
    }
    
    static adjustStrategyParameters(currentStrategy, adjustmentParameters) {
        return adjustmentParameters; // 簡易実装
    }
    
    static saveStrategyAdjustments(adjustedParameters, adaptationStrategy) {
        this.marketData.currentStrategy = adaptationStrategy.strategyType;
        this.marketData.lastUpdate = Date.now();
        this.saveMarketData();
    }
}

// グローバル公開
window.MarketAdaptationSystem = MarketAdaptationSystem;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    MarketAdaptationSystem.initialize();
});