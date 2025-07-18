/**
 * パフォーマンス追跡・分析システム
 * 買い目の成績を詳細に追跡し、戦略の有効性を分析
 */
class PerformanceTracker {
    constructor() {
        this.raceHistory = [];
        this.strategyPerformance = {};
        this.monthlyStats = {};
        this.initializeStorage();
    }

    /**
     * ローカルストレージ初期化
     */
    initializeStorage() {
        const savedHistory = localStorage.getItem('keiba_race_history');
        const savedStrategy = localStorage.getItem('keiba_strategy_performance');
        const savedMonthly = localStorage.getItem('keiba_monthly_stats');

        if (savedHistory) {
            this.raceHistory = JSON.parse(savedHistory);
        }
        if (savedStrategy) {
            this.strategyPerformance = JSON.parse(savedStrategy);
        }
        if (savedMonthly) {
            this.monthlyStats = JSON.parse(savedMonthly);
        }
    }

    /**
     * レース結果記録
     */
    recordRaceResult(raceData, predictions, bettingRecommendations, actualResults) {
        const raceRecord = {
            id: this.generateRaceId(),
            date: new Date().toISOString(),
            raceInfo: {
                name: raceData.name || 'レース情報なし',
                horses: raceData.horses?.length || 0,
                course: raceData.course || '不明'
            },
            predictions: this.analyzePredictionAccuracy(predictions, actualResults),
            betting: this.analyzeBettingResults(bettingRecommendations, actualResults),
            performance: this.calculateRacePerformance(bettingRecommendations, actualResults)
        };

        this.raceHistory.push(raceRecord);
        this.updateStrategyPerformance(raceRecord);
        this.updateMonthlyStats(raceRecord);
        this.saveToStorage();

        return raceRecord;
    }

    /**
     * 予想精度分析
     */
    analyzePredictionAccuracy(predictions, actualResults) {
        const analysis = {
            totalPredictions: predictions.length,
            correctPredictions: 0,
            scoreAccuracy: [],
            confidenceAccuracy: [],
            expectedValueAccuracy: []
        };

        predictions.forEach(prediction => {
            const horse = prediction.horse || prediction;
            const horseNumber = horse?.number || horse?.horseNumber || horse?.num || 1;
            const actualPosition = actualResults.finishing_order?.[horseNumber] || null;
            
            // 複勝的中判定（1-3着）
            const placeHit = actualPosition && actualPosition <= 3;
            if (placeHit) analysis.correctPredictions++;

            // スコア精度評価
            const scoreAccuracy = this.evaluateScoreAccuracy(prediction, actualPosition);
            analysis.scoreAccuracy.push(scoreAccuracy);

            // 信頼度精度評価
            const confidenceAccuracy = this.evaluateConfidenceAccuracy(prediction, placeHit);
            analysis.confidenceAccuracy.push(confidenceAccuracy);

            // 期待値精度評価
            if (actualResults.payouts?.[horseNumber]) {
                const actualOdds = actualResults.payouts[horseNumber];
                const expectedValueAccuracy = this.evaluateExpectedValueAccuracy(prediction, actualOdds);
                analysis.expectedValueAccuracy.push(expectedValueAccuracy);
            }
        });

        analysis.hitRate = (analysis.correctPredictions / analysis.totalPredictions) * 100;
        analysis.averageScoreAccuracy = this.calculateAverage(analysis.scoreAccuracy);
        analysis.averageConfidenceAccuracy = this.calculateAverage(analysis.confidenceAccuracy);
        analysis.averageExpectedValueAccuracy = this.calculateAverage(analysis.expectedValueAccuracy);

        return analysis;
    }

    /**
     * 買い目結果分析
     */
    analyzeBettingResults(bettingRecommendations, actualResults) {
        const analysis = {
            totalBets: bettingRecommendations.length,
            totalInvestment: 0,
            totalReturn: 0,
            hitBets: 0,
            missedBets: 0,
            details: []
        };

        bettingRecommendations.forEach(bet => {
            const result = this.evaluateBetOutcome(bet, actualResults);
            
            analysis.totalInvestment += bet.amount;
            analysis.totalReturn += result.payout;
            
            if (result.hit) {
                analysis.hitBets++;
            } else {
                analysis.missedBets++;
            }

            analysis.details.push({
                bet,
                result,
                profit: result.payout - bet.amount,
                roi: ((result.payout - bet.amount) / bet.amount) * 100
            });
        });

        analysis.hitRate = analysis.totalBets > 0 ? (analysis.hitBets / analysis.totalBets) * 100 : 0;
        analysis.roi = analysis.totalInvestment > 0 ? ((analysis.totalReturn - analysis.totalInvestment) / analysis.totalInvestment) * 100 : 0;
        analysis.netProfit = analysis.totalReturn - analysis.totalInvestment;

        return analysis;
    }

    /**
     * 馬券結果評価
     */
    evaluateBetOutcome(bet, actualResults) {
        let hit = false;
        let payout = 0;

        console.log(`🎲 馬券結果評価開始:`, {
            betType: bet.type,
            horse: bet.horse,
            actualResults: actualResults
        });

        if (bet.type === 'place') {
            // 複勝の判定 - 馬番号の取得を強化
            const horseNumber = this.getHorseNumber(bet.horse);
            const position = actualResults.finishing_order?.[horseNumber];
            
            console.log(`🎯 複勝判定: 馬名=${bet.horse?.name || 'null'}, 馬番号=${horseNumber}, 着順=${position}`);
            console.log(`📋 実際の結果データ:`, {
                finishing_order: actualResults.finishing_order,
                first: actualResults.first,
                second: actualResults.second,
                third: actualResults.third
            });
            
            // 馬番号による的中判定
            hit = position && position <= 3;
            
            if (hit && actualResults.payouts?.place?.[horseNumber]) {
                payout = (actualResults.payouts.place[horseNumber] / 100) * bet.amount;
                console.log(`💰 馬番号による配当計算: ${payout}`);
            }
            
            // 馬番号による判定がうまくいかない場合は馬名による検索
            if (!hit && bet.horse?.name) {
                console.log(`🔄 馬名による検索開始: ${bet.horse.name}`);
                hit = this.checkPlaceByName(bet.horse.name, actualResults);
                if (hit) {
                    // 馬名での検索成功時の配当計算
                    payout = this.calculatePlacePayoutByName(bet.horse.name, bet.amount, actualResults);
                    console.log(`💰 馬名検索成功: 配当=${payout}`);
                }
            }
            
            // 最終的な結果を馬番号で再確認（デバッグ用）
            if (horseNumber) {
                console.log(`🔍 最終確認: 馬番号${horseNumber}の着順=${actualResults.finishing_order?.[horseNumber]}`);
            }
            
            console.log(`📊 複勝結果: 的中=${hit}, 配当=${payout}`);
            
        } else if (bet.type === 'wide') {
            // ワイドの判定
            const horseNumber1 = this.getHorseNumber(bet.horses[0]);
            const horseNumber2 = this.getHorseNumber(bet.horses[1]);
            const pos1 = actualResults.finishing_order?.[horseNumber1];
            const pos2 = actualResults.finishing_order?.[horseNumber2];
            
            hit = pos1 && pos2 && pos1 <= 3 && pos2 <= 3;
            
            if (hit && actualResults.payouts?.wide) {
                const wideKey = `${horseNumber1}-${horseNumber2}`;
                if (actualResults.payouts.wide[wideKey]) {
                    payout = (actualResults.payouts.wide[wideKey] / 100) * bet.amount;
                }
            }
        } else if (bet.type === 'win') {
            // 単勝の判定
            const horseNumber = this.getHorseNumber(bet.horse);
            const position = actualResults.finishing_order?.[horseNumber];
            
            hit = position && position === 1;
            
            if (hit && actualResults.payouts?.win?.[horseNumber]) {
                payout = (actualResults.payouts.win[horseNumber] / 100) * bet.amount;
            }
            
            // 馬番号が見つからない場合は馬名でも検索
            if (!hit && bet.horse.name) {
                hit = this.checkWinByName(bet.horse.name, actualResults);
                if (hit) {
                    payout = this.calculateWinPayoutByName(bet.horse.name, bet.amount, actualResults);
                }
            }
        }

        return { hit, payout };
    }

    /**
     * 馬番号取得の強化
     */
    getHorseNumber(horse) {
        if (!horse) return null;
        
        // 複数の方法で馬番号を取得
        let horseNumber = horse.number || horse.horseNumber || horse.id || horse.num || horse.horseNum;
        
        // 文字列の場合は数値に変換
        if (typeof horseNumber === 'string') {
            const parsed = parseInt(horseNumber);
            if (!isNaN(parsed) && parsed > 0) {
                horseNumber = parsed;
            }
        }
        
        console.log(`🔢 馬番号取得: ${horse.name || '名前不明'} -> ${horseNumber}`);
        return horseNumber;
    }

    /**
     * 馬名による複勝判定
     */
    checkPlaceByName(horseName, actualResults) {
        if (!horseName || !actualResults) return false;
        
        console.log(`🔍 馬名による複勝判定: ${horseName}`);
        
        // 実際の結果データから馬名を検索
        const actualTop3 = [
            actualResults.first, 
            actualResults.second, 
            actualResults.third
        ];
        
        console.log(`🏆 実際の上位3着: ${actualTop3.join(', ')}`);
        
        // 完全一致チェック
        let hit = actualTop3.includes(horseName);
        
        // 部分一致チェック（完全一致がない場合）
        if (!hit) {
            hit = actualTop3.some(placedHorse => 
                placedHorse && (
                    placedHorse.includes(horseName) || 
                    horseName.includes(placedHorse)
                )
            );
        }
        
        console.log(`✅ 馬名判定結果: ${hit ? '的中' : '不的中'}`);
        return hit;
    }

    /**
     * 馬名による単勝判定
     */
    checkWinByName(horseName, actualResults) {
        if (!horseName || !actualResults) return false;
        return actualResults.first === horseName;
    }

    /**
     * 馬名による複勝配当計算
     */
    calculatePlacePayoutByName(horseName, betAmount, actualResults) {
        if (!horseName || !actualResults) return 0;
        
        // デフォルト配当率を使用
        const defaultPlaceOdds = {
            1: 1.5,  // 1着の複勝配当
            2: 1.3,  // 2着の複勝配当
            3: 1.2   // 3着の複勝配当
        };
        
        let position = 0;
        if (actualResults.first === horseName) position = 1;
        else if (actualResults.second === horseName) position = 2;
        else if (actualResults.third === horseName) position = 3;
        
        if (position > 0) {
            const odds = defaultPlaceOdds[position];
            return betAmount * odds;
        }
        
        return 0;
    }

    /**
     * 馬名による単勝配当計算
     */
    calculateWinPayoutByName(horseName, betAmount, actualResults) {
        if (!horseName || !actualResults || actualResults.first !== horseName) return 0;
        
        // デフォルト単勝配当率（実際の配当データがない場合）
        const defaultWinOdds = 2.0;
        return betAmount * defaultWinOdds;
    }

    /**
     * レースパフォーマンス計算
     */
    calculateRacePerformance(bettingRecommendations, actualResults) {
        const totalInvestment = bettingRecommendations.reduce((sum, bet) => sum + bet.amount, 0);
        const totalReturn = bettingRecommendations.reduce((sum, bet) => {
            const result = this.evaluateBetOutcome(bet, actualResults);
            return sum + result.payout;
        }, 0);

        const netProfit = totalReturn - totalInvestment;
        const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;

        // 戦略別分析
        const strategyAnalysis = this.analyzeStrategyPerformance(bettingRecommendations, actualResults);

        return {
            totalInvestment,
            totalReturn,
            netProfit,
            roi,
            profitable: netProfit > 0,
            breakEven: Math.abs(netProfit) < 100,
            strategyAnalysis
        };
    }

    /**
     * 戦略別パフォーマンス分析
     */
    analyzeStrategyPerformance(bettingRecommendations, actualResults) {
        const strategies = {};

        bettingRecommendations.forEach(bet => {
            const strategy = bet.strategy || 'default';
            const result = this.evaluateBetOutcome(bet, actualResults);

            if (!strategies[strategy]) {
                strategies[strategy] = {
                    bets: 0,
                    investment: 0,
                    returns: 0,
                    hits: 0
                };
            }

            strategies[strategy].bets++;
            strategies[strategy].investment += bet.amount;
            strategies[strategy].returns += result.payout;
            if (result.hit) strategies[strategy].hits++;
        });

        // 各戦略のROI計算
        Object.keys(strategies).forEach(strategy => {
            const data = strategies[strategy];
            data.hitRate = (data.hits / data.bets) * 100;
            data.roi = data.investment > 0 ? ((data.returns - data.investment) / data.investment) * 100 : 0;
            data.netProfit = data.returns - data.investment;
        });

        return strategies;
    }

    /**
     * 戦略パフォーマンス更新
     */
    updateStrategyPerformance(raceRecord) {
        const strategies = raceRecord.performance.strategyAnalysis;

        Object.keys(strategies).forEach(strategyName => {
            if (!this.strategyPerformance[strategyName]) {
                this.strategyPerformance[strategyName] = {
                    totalRaces: 0,
                    totalBets: 0,
                    totalInvestment: 0,
                    totalReturns: 0,
                    totalHits: 0,
                    bestRace: null,
                    worstRace: null
                };
            }

            const strategy = this.strategyPerformance[strategyName];
            const raceStrategy = strategies[strategyName];

            strategy.totalRaces++;
            strategy.totalBets += raceStrategy.bets;
            strategy.totalInvestment += raceStrategy.investment;
            strategy.totalReturns += raceStrategy.returns;
            strategy.totalHits += raceStrategy.hits;

            // 最高・最低成績更新
            if (!strategy.bestRace || raceStrategy.roi > strategy.bestRace.roi) {
                strategy.bestRace = { date: raceRecord.date, roi: raceStrategy.roi };
            }
            if (!strategy.worstRace || raceStrategy.roi < strategy.worstRace.roi) {
                strategy.worstRace = { date: raceRecord.date, roi: raceStrategy.roi };
            }

            // 累積指標計算
            strategy.overallHitRate = (strategy.totalHits / strategy.totalBets) * 100;
            strategy.overallROI = strategy.totalInvestment > 0 ? 
                ((strategy.totalReturns - strategy.totalInvestment) / strategy.totalInvestment) * 100 : 0;
            strategy.netProfit = strategy.totalReturns - strategy.totalInvestment;
        });
    }

    /**
     * 月次統計更新
     */
    updateMonthlyStats(raceRecord) {
        const date = new Date(raceRecord.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!this.monthlyStats[monthKey]) {
            this.monthlyStats[monthKey] = {
                races: 0,
                totalInvestment: 0,
                totalReturns: 0,
                profitableRaces: 0,
                hitRate: 0,
                bestRace: null,
                worstRace: null
            };
        }

        const monthStats = this.monthlyStats[monthKey];
        monthStats.races++;
        monthStats.totalInvestment += raceRecord.performance.totalInvestment;
        monthStats.totalReturns += raceRecord.performance.totalReturn;

        if (raceRecord.performance.profitable) {
            monthStats.profitableRaces++;
        }

        // 的中率の計算（加重平均）
        const raceHitRate = raceRecord.betting.hitRate;
        monthStats.hitRate = ((monthStats.hitRate * (monthStats.races - 1)) + raceHitRate) / monthStats.races;

        // 最高・最低成績更新
        if (!monthStats.bestRace || raceRecord.performance.roi > monthStats.bestRace.roi) {
            monthStats.bestRace = { date: raceRecord.date, roi: raceRecord.performance.roi };
        }
        if (!monthStats.worstRace || raceRecord.performance.roi < monthStats.worstRace.roi) {
            monthStats.worstRace = { date: raceRecord.date, roi: raceRecord.performance.roi };
        }

        // 月次指標計算
        monthStats.roi = monthStats.totalInvestment > 0 ? 
            ((monthStats.totalReturns - monthStats.totalInvestment) / monthStats.totalInvestment) * 100 : 0;
        monthStats.netProfit = monthStats.totalReturns - monthStats.totalInvestment;
        monthStats.profitableRaceRate = (monthStats.profitableRaces / monthStats.races) * 100;
    }

    /**
     * 総合統計取得
     */
    getOverallStats() {
        if (this.raceHistory.length === 0) {
            return {
                totalRaces: 0,
                message: 'レース履歴がありません'
            };
        }

        const totalInvestment = this.raceHistory.reduce((sum, race) => sum + race.performance.totalInvestment, 0);
        const totalReturns = this.raceHistory.reduce((sum, race) => sum + race.performance.totalReturn, 0);
        const profitableRaces = this.raceHistory.filter(race => race.performance.profitable).length;
        
        const hitRates = this.raceHistory.map(race => race.betting.hitRate);
        const rois = this.raceHistory.map(race => race.performance.roi);

        return {
            totalRaces: this.raceHistory.length,
            totalInvestment,
            totalReturns,
            netProfit: totalReturns - totalInvestment,
            overallROI: totalInvestment > 0 ? ((totalReturns - totalInvestment) / totalInvestment) * 100 : 0,
            averageHitRate: this.calculateAverage(hitRates),
            averageROI: this.calculateAverage(rois),
            profitableRaces,
            profitableRaceRate: (profitableRaces / this.raceHistory.length) * 100,
            bestRace: this.findBestRace(),
            worstRace: this.findWorstRace(),
            recentTrend: this.calculateRecentTrend()
        };
    }

    /**
     * 最高成績レース特定
     */
    findBestRace() {
        if (this.raceHistory.length === 0) return null;
        return this.raceHistory.reduce((best, race) => 
            !best || race.performance.roi > best.performance.roi ? race : best
        );
    }

    /**
     * 最低成績レース特定
     */
    findWorstRace() {
        if (this.raceHistory.length === 0) return null;
        return this.raceHistory.reduce((worst, race) => 
            !worst || race.performance.roi < worst.performance.roi ? race : worst
        );
    }

    /**
     * 最近のトレンド分析
     */
    calculateRecentTrend(races = 10) {
        if (this.raceHistory.length < 2) return null;

        const recentRaces = this.raceHistory.slice(-Math.min(races, this.raceHistory.length));
        const recentROIs = recentRaces.map(race => race.performance.roi);
        
        // 線形回帰による傾向分析
        const trend = this.calculateLinearTrend(recentROIs);
        
        return {
            races: recentRaces.length,
            averageROI: this.calculateAverage(recentROIs),
            trend: trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable',
            trendValue: trend
        };
    }

    /**
     * 線形トレンド計算
     */
    calculateLinearTrend(values) {
        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((sum, val) => sum + val, 0);
        const sumXY = values.reduce((sum, val, index) => sum + val * index, 0);
        const sumX2 = values.reduce((sum, val, index) => sum + index * index, 0);

        return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    }

    /**
     * パフォーマンス詳細レポート生成
     */
    generateDetailedReport() {
        const overall = this.getOverallStats();
        const strategies = this.getStrategyComparison();
        const monthly = this.getMonthlyBreakdown();

        return {
            overall,
            strategies,
            monthly,
            recommendations: this.generateRecommendations(overall, strategies)
        };
    }

    /**
     * 戦略比較分析
     */
    getStrategyComparison() {
        const comparison = {};

        Object.keys(this.strategyPerformance).forEach(strategy => {
            const data = this.strategyPerformance[strategy];
            comparison[strategy] = {
                ...data,
                avgBetsPerRace: data.totalBets / data.totalRaces,
                avgInvestmentPerRace: data.totalInvestment / data.totalRaces,
                avgReturnPerRace: data.totalReturns / data.totalRaces
            };
        });

        return comparison;
    }

    /**
     * 月次詳細分析
     */
    getMonthlyBreakdown() {
        return this.monthlyStats;
    }

    /**
     * 改善提案生成
     */
    generateRecommendations(overall, strategies) {
        const recommendations = [];

        // ROI基準の提案
        if (overall.overallROI < 0) {
            recommendations.push('🔴 総合ROIがマイナス - より保守的な戦略への転換を検討');
        } else if (overall.overallROI > 20) {
            recommendations.push('🟢 優秀なROI - 現在の戦略を継続');
        }

        // 的中率基準の提案
        if (overall.averageHitRate < 30) {
            recommendations.push('🔵 的中率が低い - 予想精度の向上が必要');
        } else if (overall.averageHitRate > 50) {
            recommendations.push('🟢 高い的中率 - 投資額の増額を検討可能');
        }

        // 戦略別提案
        const bestStrategy = Object.keys(strategies).reduce((best, strategy) => 
            !best || strategies[strategy].overallROI > strategies[best].overallROI ? strategy : best
        , null);

        if (bestStrategy) {
            recommendations.push(`🎯 最も効果的な戦略: ${bestStrategy} (ROI: ${strategies[bestStrategy].overallROI.toFixed(1)}%)`);
        }

        return recommendations;
    }

    /**
     * データ保存
     */
    saveToStorage() {
        localStorage.setItem('keiba_race_history', JSON.stringify(this.raceHistory));
        localStorage.setItem('keiba_strategy_performance', JSON.stringify(this.strategyPerformance));
        localStorage.setItem('keiba_monthly_stats', JSON.stringify(this.monthlyStats));
    }

    /**
     * ユーティリティメソッド
     */
    generateRaceId() {
        return `race_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    calculateAverage(array) {
        return array.length > 0 ? array.reduce((sum, val) => sum + val, 0) / array.length : 0;
    }

    evaluateScoreAccuracy(prediction, actualPosition) {
        // スコアと実際の成績の相関度評価（簡略化）
        if (!actualPosition) return 0;
        const expectedPosition = prediction.score > 80 ? 1 : prediction.score > 60 ? 2 : 3;
        return Math.max(0, 100 - Math.abs(expectedPosition - actualPosition) * 25);
    }

    evaluateConfidenceAccuracy(prediction, hit) {
        // 信頼度と的中の相関評価
        const confidence = prediction.confidence;
        if (hit) {
            return confidence; // 的中時は信頼度がそのまま精度
        } else {
            return 100 - confidence; // 外れ時は信頼度の逆数が精度
        }
    }

    evaluateExpectedValueAccuracy(prediction, actualOdds) {
        // 期待値とオッズの精度評価
        const expectedOdds = prediction.estimatedOdds;
        const accuracy = 100 - Math.abs(expectedOdds - actualOdds) / actualOdds * 100;
        return Math.max(0, Math.min(100, accuracy));
    }
}

// グローバル変数として公開
window.PerformanceTracker = PerformanceTracker;