// 収益性パターン分析・学習機能
class ProfitabilityPatternAnalyzer {
    
    // パターン分析設定
    static analysisConfig = {
        // 時系列分析設定
        timeSeriesAnalysis: {
            minDataPoints: 10,        // 最小データ数
            seasonalityPeriods: [7, 30, 90], // 週次、月次、四半期
            trendDetectionThreshold: 0.1,    // トレンド検出閾値
            cyclicalPatternMinLength: 5      // 周期パターン最小長
        },
        
        // 市場環境分析
        marketConditionFactors: {
            raceClass: ['G1', 'G2', 'G3', '重賞', '特別', '条件'],
            distance: ['短距離', '中距離', '長距離', '障害'],
            track: ['芝', 'ダート'],
            weather: ['晴', '曇', '雨'],
            seasonality: ['春', '夏', '秋', '冬'],
            dayOfWeek: ['土', '日', '平日']
        },
        
        // パフォーマンス分析指標
        performanceMetrics: {
            roi: { weight: 0.3, target: 0.1 },           // ROI: 重み30%, 目標10%
            hitRate: { weight: 0.25, target: 0.25 },     // 的中率: 重み25%, 目標25%
            averageReturn: { weight: 0.2, target: 1.5 }, // 平均回収率: 重み20%, 目標150%
            consistency: { weight: 0.15, target: 0.7 },  // 一貫性: 重み15%, 目標70%
            drawdown: { weight: 0.1, target: 0.15 }      // ドローダウン: 重み10%, 目標15%以下
        }
    };
    
    // 学習データ保存
    static learningData = {
        bettingHistory: [],      // 賭け履歴
        patterns: {},            // 発見されたパターン
        strategies: {},          // 戦略評価
        marketConditions: {},    // 市場環境データ
        lastAnalysisDate: null
    };
    
    // 過去データからの収益パターン分析
    static analyzeHistoricalProfitability(bettingHistory) {
        console.log('📈 収益性パターン分析開始');
        
        if (bettingHistory.length < this.analysisConfig.timeSeriesAnalysis.minDataPoints) {
            console.warn('分析に必要なデータが不足しています');
            return this.getDefaultPatternAnalysis();
        }
        
        const analysis = {
            temporalPatterns: this.analyzeTemporalPatterns(bettingHistory),
            marketConditionPatterns: this.analyzeMarketConditionPatterns(bettingHistory),
            strategicPatterns: this.analyzeStrategicPatterns(bettingHistory),
            riskReturnPatterns: this.analyzeRiskReturnPatterns(bettingHistory),
            seasonalityInsights: this.analyzeSeasonalityPatterns(bettingHistory),
            recommendations: []
        };
        
        // パターンベース推奨戦略生成
        analysis.recommendations = this.generatePatternBasedRecommendations(analysis);
        
        // 学習データ更新
        this.updateLearningData(analysis, bettingHistory);
        
        console.log('🎯 パターン分析完了:', {
            発見パターン数: Object.keys(analysis.temporalPatterns).length + 
                          Object.keys(analysis.marketConditionPatterns).length,
            推奨戦略数: analysis.recommendations.length,
            信頼度: this.calculateAnalysisConfidence(analysis, bettingHistory.length)
        });
        
        return analysis;
    }
    
    // 分析信頼度計算
    static calculateAnalysisConfidence(analysis, dataSize) {
        let confidence = 0.5; // ベース信頼度
        
        // データサイズによる調整
        if (dataSize >= 50) confidence += 0.3;
        else if (dataSize >= 20) confidence += 0.2;
        else if (dataSize >= 10) confidence += 0.1;
        
        // 発見パターン数による調整
        const totalPatterns = Object.keys(analysis.temporalPatterns || {}).length + 
                             Object.keys(analysis.marketConditionPatterns || {}).length;
        if (totalPatterns >= 5) confidence += 0.15;
        else if (totalPatterns >= 3) confidence += 0.1;
        
        // 推奨事項数による調整
        if (analysis.recommendations.length >= 3) confidence += 0.05;
        
        return Math.min(1.0, Math.max(0.1, confidence));
    }
    
    // 時系列パターン分析
    static analyzeTemporalPatterns(history) {
        const patterns = {};
        
        // 1. 曜日パターン分析
        patterns.dayOfWeek = this.analyzeDayOfWeekPerformance(history);
        
        // 2. 月次パターン分析
        patterns.monthly = this.analyzeMonthlyPerformance(history);
        
        // 3. トレンド分析
        patterns.trends = this.analyzeTrendPatterns(history);
        
        // 4. 周期性分析
        patterns.cyclical = this.analyzeCyclicalPatterns(history);
        
        // 5. 連続性分析（連勝・連敗パターン）
        patterns.streaks = this.analyzeStreakPatterns(history);
        
        return patterns;
    }
    
    // トレンドパターン分析
    static analyzeTrendPatterns(history) {
        if (history.length < 10) return { trend: 'insufficient_data', direction: 'unknown' };
        
        // 時系列でROIの移動平均を計算
        const windowSize = Math.min(5, Math.floor(history.length / 3));
        const movingAverages = [];
        
        for (let i = windowSize - 1; i < history.length; i++) {
            const window = history.slice(i - windowSize + 1, i + 1);
            const avgROI = this.calculateRecentROI(window);
            movingAverages.push(avgROI);
        }
        
        // トレンド方向を判定
        const firstHalf = movingAverages.slice(0, Math.floor(movingAverages.length / 2));
        const secondHalf = movingAverages.slice(Math.floor(movingAverages.length / 2));
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        const trendStrength = Math.abs(secondAvg - firstAvg);
        let direction = 'stable';
        
        if (secondAvg > firstAvg + 0.05) direction = 'improving';
        else if (secondAvg < firstAvg - 0.05) direction = 'declining';
        
        return {
            trend: direction,
            strength: trendStrength,
            firstHalfROI: firstAvg,
            secondHalfROI: secondAvg
        };
    }
    
    // 周期パターン分析
    static analyzeCyclicalPatterns(history) {
        if (history.length < 15) return { patterns: [], confidence: 'low' };
        
        const patterns = [];
        
        // 週次パターン検出
        const weeklyPattern = this.detectWeeklyPattern(history);
        if (weeklyPattern.strength > 0.3) {
            patterns.push(weeklyPattern);
        }
        
        // 月次パターン検出
        const monthlyPattern = this.detectMonthlyPattern(history);
        if (monthlyPattern.strength > 0.2) {
            patterns.push(monthlyPattern);
        }
        
        return {
            patterns: patterns,
            confidence: patterns.length > 0 ? 'medium' : 'low'
        };
    }
    
    // 週次パターン検出
    static detectWeeklyPattern(history) {
        const dayResults = {};
        
        history.forEach(bet => {
            const day = bet.dayOfWeek || '不明';
            if (!dayResults[day]) dayResults[day] = [];
            dayResults[day].push(bet.isWin ? 1 : 0);
        });
        
        let maxVariance = 0;
        let bestDay = null;
        
        Object.entries(dayResults).forEach(([day, results]) => {
            if (results.length >= 3) {
                const winRate = results.reduce((a, b) => a + b, 0) / results.length;
                const variance = results.reduce((sum, r) => sum + Math.pow(r - winRate, 2), 0) / results.length;
                
                if (variance > maxVariance) {
                    maxVariance = variance;
                    bestDay = day;
                }
            }
        });
        
        return {
            type: 'weekly',
            bestDay: bestDay,
            strength: Math.min(1, maxVariance * 2),
            pattern: dayResults
        };
    }
    
    // 月次パターン検出
    static detectMonthlyPattern(history) {
        const monthResults = {};
        
        history.forEach(bet => {
            const month = bet.date ? new Date(bet.date).getMonth() + 1 : 1;
            if (!monthResults[month]) monthResults[month] = [];
            monthResults[month].push(bet.isWin ? 1 : 0);
        });
        
        let maxVariance = 0;
        let bestMonth = null;
        
        Object.entries(monthResults).forEach(([month, results]) => {
            if (results.length >= 2) {
                const winRate = results.reduce((a, b) => a + b, 0) / results.length;
                const variance = results.reduce((sum, r) => sum + Math.pow(r - winRate, 2), 0) / results.length;
                
                if (variance > maxVariance) {
                    maxVariance = variance;
                    bestMonth = month;
                }
            }
        });
        
        return {
            type: 'monthly',
            bestMonth: bestMonth,
            strength: Math.min(1, maxVariance * 1.5),
            pattern: monthResults
        };
    }
    
    // 連続パターン分析
    static analyzeStreakPatterns(history) {
        if (history.length < 5) return { streaks: [], maxWin: 0, maxLoss: 0 };
        
        const streaks = [];
        let currentStreak = { type: null, length: 0, start: 0 };
        let maxWinStreak = 0;
        let maxLossStreak = 0;
        
        history.forEach((bet, index) => {
            const isWin = bet.isWin;
            
            if (currentStreak.type === null) {
                currentStreak = { type: isWin ? 'win' : 'loss', length: 1, start: index };
            } else if ((currentStreak.type === 'win' && isWin) || (currentStreak.type === 'loss' && !isWin)) {
                currentStreak.length++;
            } else {
                // 連続終了
                streaks.push({ ...currentStreak, end: index - 1 });
                
                if (currentStreak.type === 'win') {
                    maxWinStreak = Math.max(maxWinStreak, currentStreak.length);
                } else {
                    maxLossStreak = Math.max(maxLossStreak, currentStreak.length);
                }
                
                currentStreak = { type: isWin ? 'win' : 'loss', length: 1, start: index };
            }
        });
        
        // 最後の連続を追加
        if (currentStreak.length > 0) {
            streaks.push({ ...currentStreak, end: history.length - 1 });
            if (currentStreak.type === 'win') {
                maxWinStreak = Math.max(maxWinStreak, currentStreak.length);
            } else {
                maxLossStreak = Math.max(maxLossStreak, currentStreak.length);
            }
        }
        
        return {
            streaks: streaks,
            maxWin: maxWinStreak,
            maxLoss: maxLossStreak,
            streakTendency: maxWinStreak > maxLossStreak ? 'win_streaky' : 'loss_streaky'
        };
    }
    
    // 曜日パフォーマンス分析
    static analyzeDayOfWeekPerformance(history) {
        const dayPerformance = {};
        const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
        
        daysOfWeek.forEach(day => {
            const dayBets = history.filter(bet => bet.dayOfWeek === day);
            if (dayBets.length > 0) {
                dayPerformance[day] = this.calculatePerformanceMetrics(dayBets);
            }
        });
        
        // 最高・最低パフォーマンス日特定
        const sortedDays = Object.entries(dayPerformance)
            .sort(([,a], [,b]) => b.roi - a.roi);
        
        return {
            daily: dayPerformance,
            bestDay: sortedDays[0] ? sortedDays[0][0] : null,
            worstDay: sortedDays[sortedDays.length - 1] ? sortedDays[sortedDays.length - 1][0] : null,
            weekendVsWeekday: this.compareWeekendVsWeekday(dayPerformance)
        };
    }
    
    // 週末vs平日パフォーマンス比較
    static compareWeekendVsWeekday(dayPerformance) {
        const weekend = ['土', '日'];
        const weekday = ['月', '火', '水', '木', '金'];
        
        let weekendROI = 0, weekdayROI = 0;
        let weekendCount = 0, weekdayCount = 0;
        
        Object.entries(dayPerformance).forEach(([day, perf]) => {
            if (weekend.includes(day)) {
                weekendROI += perf.roi;
                weekendCount++;
            } else if (weekday.includes(day)) {
                weekdayROI += perf.roi;
                weekdayCount++;
            }
        });
        
        return {
            weekendAvgROI: weekendCount > 0 ? weekendROI / weekendCount : 0,
            weekdayAvgROI: weekdayCount > 0 ? weekdayROI / weekdayCount : 0,
            preference: weekendROI / weekendCount > weekdayROI / weekdayCount ? 'weekend' : 'weekday'
        };
    }
    
    // 月次パフォーマンス分析
    static analyzeMonthlyPerformance(history) {
        const monthlyPerformance = {};
        
        // 月別グループ化
        history.forEach(bet => {
            const month = bet.date ? new Date(bet.date).getMonth() + 1 : 1;
            if (!monthlyPerformance[month]) {
                monthlyPerformance[month] = [];
            }
            monthlyPerformance[month].push(bet);
        });
        
        // 各月のパフォーマンス計算
        const monthlyMetrics = {};
        Object.entries(monthlyPerformance).forEach(([month, bets]) => {
            monthlyMetrics[month] = this.calculatePerformanceMetrics(bets);
        });
        
        return {
            monthly: monthlyMetrics,
            bestMonth: this.findBestPerformancePeriod(monthlyMetrics),
            seasonalTrends: this.analyzeSeasonalTrends(monthlyMetrics)
        };
    }
    
    // 最高パフォーマンス期間特定
    static findBestPerformancePeriod(metrics) {
        if (Object.keys(metrics).length === 0) return null;
        
        let bestPeriod = null;
        let bestROI = -Infinity;
        
        Object.entries(metrics).forEach(([period, data]) => {
            if (data.roi > bestROI) {
                bestROI = data.roi;
                bestPeriod = period;
            }
        });
        
        return { period: bestPeriod, roi: bestROI };
    }
    
    // 季節トレンド分析
    static analyzeSeasonalTrends(monthlyMetrics) {
        const trends = {
            spring: 0, // 3,4,5月
            summer: 0, // 6,7,8月  
            autumn: 0, // 9,10,11月
            winter: 0  // 12,1,2月
        };
        
        const seasonCounts = { spring: 0, summer: 0, autumn: 0, winter: 0 };
        
        Object.entries(monthlyMetrics).forEach(([month, data]) => {
            const m = parseInt(month);
            if ([3,4,5].includes(m)) {
                trends.spring += data.roi;
                seasonCounts.spring++;
            } else if ([6,7,8].includes(m)) {
                trends.summer += data.roi;
                seasonCounts.summer++;
            } else if ([9,10,11].includes(m)) {
                trends.autumn += data.roi;
                seasonCounts.autumn++;
            } else if ([12,1,2].includes(m)) {
                trends.winter += data.roi;
                seasonCounts.winter++;
            }
        });
        
        // 平均計算
        Object.keys(trends).forEach(season => {
            trends[season] = seasonCounts[season] > 0 ? trends[season] / seasonCounts[season] : 0;
        });
        
        return trends;
    }
    
    // 市場環境パターン分析
    static analyzeMarketConditionPatterns(history) {
        const patterns = {};
        const factors = this.analysisConfig.marketConditionFactors;
        
        Object.entries(factors).forEach(([factor, categories]) => {
            patterns[factor] = this.analyzeFactorPerformance(history, factor, categories);
        });
        
        // 複合条件分析
        patterns.combinations = this.analyzeConditionCombinations(history);
        
        return patterns;
    }
    
    // 条件組み合わせ分析
    static analyzeConditionCombinations(history) {
        const combinations = {};
        
        // 天候×レースクラス組み合わせ分析
        const weatherClassCombos = {};
        history.forEach(bet => {
            const weather = bet.marketConditions?.weather || '不明';
            const raceClass = bet.marketConditions?.raceClass || '不明';
            const key = `${weather}_${raceClass}`;
            
            if (!weatherClassCombos[key]) weatherClassCombos[key] = [];
            weatherClassCombos[key].push(bet);
        });
        
        // 各組み合わせのパフォーマンス計算
        Object.entries(weatherClassCombos).forEach(([combo, bets]) => {
            if (bets.length >= 3) {
                combinations[combo] = {
                    ...this.calculatePerformanceMetrics(bets),
                    combination: combo,
                    sampleSize: bets.length
                };
            }
        });
        
        return {
            weatherClass: combinations,
            bestCombination: this.findBestCombination(combinations),
            totalCombinations: Object.keys(combinations).length
        };
    }
    
    // 最良組み合わせ特定
    static findBestCombination(combinations) {
        let bestCombo = null;
        let bestROI = -Infinity;
        
        Object.entries(combinations).forEach(([combo, data]) => {
            if (data.roi > bestROI && data.sampleSize >= 3) {
                bestROI = data.roi;
                bestCombo = {
                    combination: combo,
                    roi: data.roi,
                    hitRate: data.hitRate,
                    sampleSize: data.sampleSize
                };
            }
        });
        
        return bestCombo;
    }
    
    // ファクター別パフォーマンス分析
    static analyzeFactorPerformance(history, factor, categories) {
        const factorPerformance = {};
        
        categories.forEach(category => {
            const categoryBets = history.filter(bet => 
                bet.marketConditions && bet.marketConditions[factor] === category
            );
            
            if (categoryBets.length > 3) { // 最小データ数確保
                factorPerformance[category] = {
                    ...this.calculatePerformanceMetrics(categoryBets),
                    sampleSize: categoryBets.length,
                    confidence: this.calculateStatisticalConfidence(categoryBets.length)
                };
            }
        });
        
        return {
            performance: factorPerformance,
            bestCondition: this.findBestCondition(factorPerformance),
            worstCondition: this.findWorstCondition(factorPerformance)
        };
    }
    
    // 最良条件特定
    static findBestCondition(factorPerformance) {
        let bestCondition = null;
        let bestROI = -Infinity;
        
        Object.entries(factorPerformance).forEach(([condition, data]) => {
            if (data.roi > bestROI && data.sampleSize >= 3) {
                bestROI = data.roi;
                bestCondition = {
                    condition: condition,
                    roi: data.roi,
                    confidence: data.confidence,
                    improvement: Math.max(0, data.roi + 0.1) // 改善度計算
                };
            }
        });
        
        return bestCondition;
    }
    
    // 最悪条件特定
    static findWorstCondition(factorPerformance) {
        let worstCondition = null;
        let worstROI = Infinity;
        
        Object.entries(factorPerformance).forEach(([condition, data]) => {
            if (data.roi < worstROI && data.sampleSize >= 3) {
                worstROI = data.roi;
                worstCondition = {
                    condition: condition,
                    roi: data.roi,
                    confidence: data.confidence
                };
            }
        });
        
        return worstCondition;
    }
    
    // 戦略パターン分析
    static analyzeStrategicPatterns(history) {
        const patterns = {
            betSizePatterns: this.analyzeBetSizePatterns(history),
            oddsRangePatterns: this.analyzeOddsRangePatterns(history),
            confidencePatterns: this.analyzeConfidencePatterns(history),
            diversificationPatterns: this.analyzeDiversificationPatterns(history)
        };
        
        return patterns;
    }
    
    // 賭け金パターン分析
    static analyzeBetSizePatterns(history) {
        const sizeRanges = [
            { range: '小額', min: 0, max: 3000 },
            { range: '中額', min: 3000, max: 10000 },
            { range: '大額', min: 10000, max: Infinity }
        ];
        
        const sizePerformance = {};
        
        sizeRanges.forEach(({ range, min, max }) => {
            const sizeBets = history.filter(bet => 
                bet.betAmount >= min && bet.betAmount < max
            );
            
            if (sizeBets.length > 0) {
                sizePerformance[range] = this.calculatePerformanceMetrics(sizeBets);
            }
        });
        
        return sizePerformance;
    }
    
    // オッズレンジパターン分析
    static analyzeOddsRangePatterns(history) {
        const oddsRanges = [
            { range: '低オッズ', min: 1.0, max: 3.0 },
            { range: '中オッズ', min: 3.0, max: 10.0 },
            { range: '高オッズ', min: 10.0, max: 30.0 },
            { range: '超高オッズ', min: 30.0, max: Infinity }
        ];
        
        const oddsPerformance = {};
        
        oddsRanges.forEach(({ range, min, max }) => {
            const oddsBets = history.filter(bet => 
                bet.odds >= min && bet.odds < max
            );
            
            if (oddsBets.length > 0) {
                oddsPerformance[range] = this.calculatePerformanceMetrics(oddsBets);
            }
        });
        
        return oddsPerformance;
    }
    
    // 信頼度パターン分析
    static analyzeConfidencePatterns(history) {
        const confidenceRanges = [
            { range: '低信頼度', min: 0.0, max: 0.5 },
            { range: '中信頼度', min: 0.5, max: 0.75 },
            { range: '高信頼度', min: 0.75, max: 1.0 }
        ];
        
        const confidencePerformance = {};
        
        confidenceRanges.forEach(({ range, min, max }) => {
            const confidenceBets = history.filter(bet => {
                const confidence = bet.confidence || 0.5;
                return confidence >= min && confidence < max;
            });
            
            if (confidenceBets.length > 0) {
                confidencePerformance[range] = this.calculatePerformanceMetrics(confidenceBets);
            }
        });
        
        return confidencePerformance;
    }
    
    // 分散投資パターン分析
    static analyzeDiversificationPatterns(history) {
        // 同日の賭け数で分散度を判定
        const dailyBets = {};
        
        history.forEach(bet => {
            const date = bet.date ? bet.date.split('T')[0] : 'unknown';
            if (!dailyBets[date]) dailyBets[date] = [];
            dailyBets[date].push(bet);
        });
        
        const diversificationLevels = {
            '集中投資': [], // 1-2賭け/日
            '適度分散': [], // 3-5賭け/日  
            '高分散': []    // 6+賭け/日
        };
        
        Object.entries(dailyBets).forEach(([date, bets]) => {
            const betCount = bets.length;
            if (betCount <= 2) {
                diversificationLevels['集中投資'].push(...bets);
            } else if (betCount <= 5) {
                diversificationLevels['適度分散'].push(...bets);
            } else {
                diversificationLevels['高分散'].push(...bets);
            }
        });
        
        const diversificationPerformance = {};
        Object.entries(diversificationLevels).forEach(([level, bets]) => {
            if (bets.length > 0) {
                diversificationPerformance[level] = this.calculatePerformanceMetrics(bets);
            }
        });
        
        return diversificationPerformance;
    }
    
    // リスク・リターンパターン分析
    static analyzeRiskReturnPatterns(history) {
        const patterns = {
            riskAdjustedReturns: this.calculateRiskAdjustedReturns(history),
            volatilityPatterns: this.analyzeVolatilityPatterns(history),
            drawdownPatterns: this.analyzeDrawdownPatterns(history),
            sharpeRatioAnalysis: this.calculateSharpeRatioAnalysis(history)
        };
        
        return patterns;
    }
    
    // ボラティリティパターン分析
    static analyzeVolatilityPatterns(history) {
        if (history.length < 10) return { patterns: [], volatilityLevel: 'unknown' };
        
        // 期間別ボラティリティ計算
        const periods = [
            { name: '直近1週間', days: 7 },
            { name: '直近1ヶ月', days: 30 },
            { name: '全期間', days: history.length }
        ];
        
        const volatilityData = {};
        
        periods.forEach(period => {
            const periodHistory = history.slice(-period.days);
            if (periodHistory.length >= 5) {
                const returns = periodHistory.map(bet => {
                    const roi = bet.returnAmount ? (bet.returnAmount - bet.betAmount) / bet.betAmount : -1;
                    return roi;
                });
                
                const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
                const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
                const volatility = Math.sqrt(variance);
                
                volatilityData[period.name] = {
                    volatility: volatility,
                    avgReturn: avgReturn,
                    riskLevel: this.categorizeRiskLevel(volatility)
                };
            }
        });
        
        return {
            periods: volatilityData,
            overallVolatility: volatilityData['全期間']?.volatility || 0,
            trend: this.analyzeVolatilityTrend(volatilityData)
        };
    }
    
    // ボラティリティトレンド分析
    static analyzeVolatilityTrend(volatilityData) {
        const periods = Object.keys(volatilityData);
        if (periods.length < 2) return 'insufficient_data';
        
        const recent = volatilityData['直近1週間']?.volatility || 0;
        const overall = volatilityData['全期間']?.volatility || 0;
        
        if (recent > overall * 1.2) return 'increasing';
        if (recent < overall * 0.8) return 'decreasing';
        return 'stable';
    }
    
    // ドローダウンパターン分析
    static analyzeDrawdownPatterns(history) {
        if (history.length < 5) return { maxDrawdown: 0, patterns: [] };
        
        let runningBalance = 0;
        let peak = 0;
        let maxDrawdown = 0;
        const drawdowns = [];
        
        history.forEach((bet, index) => {
            runningBalance += (bet.returnAmount || 0) - bet.betAmount;
            
            if (runningBalance > peak) {
                peak = runningBalance;
            }
            
            const currentDrawdown = peak > 0 ? (peak - runningBalance) / peak : 0;
            maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
            
            if (currentDrawdown > 0.1) { // 10%以上のドローダウン
                drawdowns.push({
                    index: index,
                    drawdown: currentDrawdown,
                    date: bet.date
                });
            }
        });
        
        return {
            maxDrawdown: maxDrawdown,
            drawdownEvents: drawdowns.length,
            averageDrawdown: drawdowns.length > 0 ? 
                drawdowns.reduce((sum, dd) => sum + dd.drawdown, 0) / drawdowns.length : 0,
            recoveryPattern: this.analyzeRecoveryPattern(drawdowns, history)
        };
    }
    
    // 回復パターン分析
    static analyzeRecoveryPattern(drawdowns, history) {
        if (drawdowns.length === 0) return { averageRecoveryTime: 0, recoveryRate: 1 };
        
        let totalRecoveryTime = 0;
        let recoveredCount = 0;
        
        drawdowns.forEach(dd => {
            // 各ドローダウン後の回復時間を計算（簡易版）
            const recoveryTime = Math.min(10, history.length - dd.index);
            totalRecoveryTime += recoveryTime;
            recoveredCount++;
        });
        
        return {
            averageRecoveryTime: recoveredCount > 0 ? totalRecoveryTime / recoveredCount : 0,
            recoveryRate: recoveredCount / drawdowns.length
        };
    }
    
    // シャープレシオ分析
    static calculateSharpeRatioAnalysis(history) {
        if (history.length < 10) return { sharpeRatio: 0, recommendation: 'データ不足' };
        
        const riskAdjusted = this.calculateRiskAdjustedReturns(history);
        const sharpeRatio = riskAdjusted.sharpeRatio;
        
        let recommendation = '';
        if (sharpeRatio > 1.0) {
            recommendation = '優秀なリスク調整後リターン';
        } else if (sharpeRatio > 0.5) {
            recommendation = '良好なリスク調整後リターン';
        } else if (sharpeRatio > 0) {
            recommendation = 'リスクに見合わないリターン';
        } else {
            recommendation = 'リスク管理の改善が必要';
        }
        
        return {
            sharpeRatio: sharpeRatio,
            recommendation: recommendation,
            riskCategory: riskAdjusted.riskCategory
        };
    }
    
    // リスク調整後リターン計算
    static calculateRiskAdjustedReturns(history) {
        if (history.length < 10) return { sharpeRatio: 0, information: '不十分なデータ' };
        
        const returns = history.map(bet => {
            const roi = bet.returnAmount ? (bet.returnAmount - bet.betAmount) / bet.betAmount : -1;
            return roi;
        });
        
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const stdDev = Math.sqrt(
            returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length
        );
        
        const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;
        
        return {
            averageReturn: avgReturn,
            volatility: stdDev,
            sharpeRatio: sharpeRatio,
            riskCategory: this.categorizeRiskLevel(stdDev)
        };
    }
    
    // リスクレベル分類
    static categorizeRiskLevel(volatility) {
        if (volatility < 0.2) return 'low';
        if (volatility < 0.4) return 'medium';
        if (volatility < 0.6) return 'high';
        return 'very_high';
    }
    
    // 季節性パターン分析
    static analyzeSeasonalityPatterns(history) {
        const seasonalData = {
            春: { months: [3, 4, 5], bets: [] },
            夏: { months: [6, 7, 8], bets: [] },
            秋: { months: [9, 10, 11], bets: [] },
            冬: { months: [12, 1, 2], bets: [] }
        };
        
        // 季節別データ分類
        history.forEach(bet => {
            const month = bet.date ? new Date(bet.date).getMonth() + 1 : 1;
            Object.entries(seasonalData).forEach(([season, data]) => {
                if (data.months.includes(month)) {
                    data.bets.push(bet);
                }
            });
        });
        
        // 季節別パフォーマンス計算
        const seasonalPerformance = {};
        Object.entries(seasonalData).forEach(([season, data]) => {
            if (data.bets.length > 0) {
                seasonalPerformance[season] = this.calculatePerformanceMetrics(data.bets);
            }
        });
        
        return {
            performance: seasonalPerformance,
            bestSeason: this.findBestPerformancePeriod(seasonalPerformance),
            seasonalTrends: this.identifySeasonalTrends(seasonalPerformance)
        };
    }
    
    // 季節トレンド識別
    static identifySeasonalTrends(seasonalPerformance) {
        const seasons = Object.keys(seasonalPerformance);
        if (seasons.length === 0) return { trend: 'no_data' };
        
        const sortedSeasons = Object.entries(seasonalPerformance)
            .sort(([,a], [,b]) => b.roi - a.roi);
            
        return {
            bestSeason: sortedSeasons[0] ? sortedSeasons[0][0] : null,
            worstSeason: sortedSeasons[sortedSeasons.length - 1] ? sortedSeasons[sortedSeasons.length - 1][0] : null,
            trend: sortedSeasons.length > 2 ? 'seasonal_variation' : 'stable'
        };
    }
    
    // パフォーマンス指標計算
    static calculatePerformanceMetrics(bets) {
        if (bets.length === 0) return { roi: 0, hitRate: 0, averageReturn: 0, consistency: 0 };
        
        const totalInvested = bets.reduce((sum, bet) => sum + bet.betAmount, 0);
        const totalReturned = bets.reduce((sum, bet) => sum + (bet.returnAmount || 0), 0);
        const wins = bets.filter(bet => bet.isWin).length;
        
        const roi = totalInvested > 0 ? (totalReturned - totalInvested) / totalInvested : 0;
        const hitRate = wins / bets.length;
        const averageReturn = totalReturned / totalInvested;
        
        // 一貫性計算（勝率の安定性）
        const windowSize = Math.min(5, Math.floor(bets.length / 3));
        const consistency = this.calculateConsistency(bets, windowSize);
        
        return {
            roi: roi,
            hitRate: hitRate,
            averageReturn: averageReturn,
            consistency: consistency,
            totalBets: bets.length,
            totalInvested: totalInvested,
            totalReturned: totalReturned
        };
    }
    
    // 一貫性計算
    static calculateConsistency(bets, windowSize) {
        if (bets.length < windowSize * 2) return 0.5;
        
        const windows = [];
        for (let i = 0; i <= bets.length - windowSize; i++) {
            const window = bets.slice(i, i + windowSize);
            const windowHitRate = window.filter(bet => bet.isWin).length / windowSize;
            windows.push(windowHitRate);
        }
        
        const avgHitRate = windows.reduce((a, b) => a + b, 0) / windows.length;
        const variance = windows.reduce((sum, rate) => sum + Math.pow(rate - avgHitRate, 2), 0) / windows.length;
        
        return Math.max(0, 1 - variance * 2);
    }
    
    // 最近のROI計算（パターン分析用）
    static calculateRecentROI(recentHistory) {
        if (recentHistory.length === 0) return 0;
        
        const totalInvested = recentHistory.reduce((sum, bet) => sum + bet.betAmount, 0);
        const totalReturned = recentHistory.reduce((sum, bet) => sum + (bet.returnAmount || 0), 0);
        
        return totalInvested > 0 ? (totalReturned - totalInvested) / totalInvested : 0;
    }
    
    // パターンベース推奨戦略生成
    static generatePatternBasedRecommendations(analysis) {
        const recommendations = [];
        
        // 時系列パターンベース推奨
        if (analysis.temporalPatterns.dayOfWeek.bestDay) {
            recommendations.push({
                type: 'temporal',
                priority: 'high',
                recommendation: `${analysis.temporalPatterns.dayOfWeek.bestDay}曜日の賭けを重点化`,
                expectedImprovement: '15-25%',
                confidence: 'high'
            });
        }
        
        // 市場環境パターンベース推奨
        Object.entries(analysis.marketConditionPatterns).forEach(([factor, pattern]) => {
            if (pattern.bestCondition) {
                recommendations.push({
                    type: 'market_condition',
                    priority: 'medium',
                    recommendation: `${factor}が${pattern.bestCondition.condition}の時に投資増額`,
                    expectedImprovement: `${(pattern.bestCondition.improvement * 100).toFixed(0)}%`,
                    confidence: pattern.bestCondition.confidence
                });
            }
        });
        
        // リスク・リターンパターンベース推奨
        if (analysis.riskReturnPatterns.sharpeRatioAnalysis.recommendation) {
            recommendations.push({
                type: 'risk_management',
                priority: 'high',
                recommendation: analysis.riskReturnPatterns.sharpeRatioAnalysis.recommendation,
                expectedImprovement: '10-20%',
                confidence: 'medium'
            });
        }
        
        return recommendations.sort((a, b) => {
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }
    
    // 市場環境別戦略自動選択
    static selectOptimalStrategy(currentMarketConditions, analysis) {
        console.log('🎯 現在の市場環境に最適な戦略選択');
        
        // 現在の条件に最も近い過去パフォーマンスを検索
        const matchingPatterns = this.findMatchingPatterns(currentMarketConditions, analysis);
        
        // 戦略スコア計算
        const strategyScores = this.calculateStrategyScores(matchingPatterns);
        
        // 最適戦略選択
        const optimalStrategy = this.selectBestStrategy(strategyScores);
        
        console.log('📊 戦略選択完了:', {
            選択戦略: optimalStrategy.name,
            期待改善: optimalStrategy.expectedImprovement,
            信頼度: optimalStrategy.confidence
        });
        
        return optimalStrategy;
    }
    
    // 学習データ更新
    static updateLearningData(analysis, bettingHistory) {
        this.learningData.bettingHistory = bettingHistory;
        this.learningData.patterns = {
            ...this.learningData.patterns,
            ...analysis
        };
        this.learningData.lastAnalysisDate = new Date().toISOString();
        
        this.saveLearningData();
    }
    
    // デフォルトパターン分析
    static getDefaultPatternAnalysis() {
        return {
            temporalPatterns: {},
            marketConditionPatterns: {},
            strategicPatterns: {},
            riskReturnPatterns: {},
            seasonalityInsights: {},
            recommendations: [{
                type: 'data_collection',
                priority: 'high',
                recommendation: 'より多くの賭け履歴を蓄積してパターン分析の精度を向上',
                expectedImprovement: 'データ依存',
                confidence: 'low'
            }]
        };
    }
    
    // 統計的信頼度計算
    static calculateStatisticalConfidence(sampleSize) {
        if (sampleSize < 5) return 'very_low';
        if (sampleSize < 15) return 'low';
        if (sampleSize < 30) return 'medium';
        if (sampleSize < 100) return 'high';
        return 'very_high';
    }
    
    // 設定保存・読み込み
    static saveLearningData() {
        try {
            localStorage.setItem('profitabilityPatternData', JSON.stringify({
                ...this.learningData,
                lastSaved: new Date().toISOString()
            }));
        } catch (error) {
            console.error('パターン学習データ保存エラー:', error);
        }
    }
    
    static loadLearningData() {
        try {
            const saved = localStorage.getItem('profitabilityPatternData');
            if (saved) {
                this.learningData = { ...this.learningData, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('パターン学習データ読み込みエラー:', error);
        }
    }
    
    // 初期化
    static initialize() {
        this.loadLearningData();
        console.log('📈 収益性パターン分析・学習システム初期化完了:', {
            保存データ数: this.learningData.bettingHistory.length,
            パターン数: Object.keys(this.learningData.patterns).length,
            最終分析日: this.learningData.lastAnalysisDate
        });
    }
}

// グローバル公開
window.ProfitabilityPatternAnalyzer = ProfitabilityPatternAnalyzer;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    ProfitabilityPatternAnalyzer.initialize();
});