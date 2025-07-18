/**
 * Phase 8α: オッズ妙味検出システム
 * 市場の歪みを捉えて期待値の高い馬券を特定する
 */
class OddsValueDetector {
    constructor() {
        this.historicalOddsKey = 'historicalOddsData';
        this.analysisResultsKey = 'oddsValueAnalysis';
        this.settings = {
            // 妙味検出パラメータ
            oddsDeviationThreshold: 1.5,        // オッズ偏差閾値
            minimumHistoricalSamples: 10,       // 最小履歴サンプル数
            marketEfficiencyThreshold: 0.8,     // 市場効率性閾値
            
            // 時系列分析パラメータ
            trendAnalysisPeriod: 5,             // トレンド分析期間
            volatilityThreshold: 0.3,           // ボラティリティ閾値
            
            // 統計分析パラメータ
            confidenceLevel: 0.95,              // 信頼水準
            outlierThreshold: 2.0,              // 外れ値検出閾値（標準偏差）
        };
        
        this.historicalData = this.loadHistoricalData();
        console.log('💰 オッズ妙味検出システム初期化完了');
    }

    /**
     * 馬のオッズ妙味を検出・分析
     * @param {Object} horse - 馬データ
     * @param {Array} allHorses - 全馬データ（相対評価用）
     * @returns {Object} 妙味分析結果
     */
    detectOddsValue(horse, allHorses = []) {
        const analysis = {
            horse: horse,
            timestamp: new Date().toISOString(),
            
            // 基本オッズ情報
            currentOdds: horse.odds || 0,
            oddsCategory: this.categorizeOdds(horse.odds),
            
            // 妙味スコア群
            deviationScore: 0,          // 統計的偏差スコア
            marketEfficiencyScore: 0,   // 市場効率性スコア
            relativeValueScore: 0,      // 相対価値スコア
            trendScore: 0,              // トレンドスコア
            
            // 総合評価
            overallValueScore: 0,       // 総合妙味スコア（0-100）
            valueCategory: 'neutral',   // undervalued/overvalued/neutral
            recommendation: 'monitor',  // strong_buy/buy/monitor/avoid
            
            // 詳細分析
            statisticalAnalysis: {},
            marketContext: {},
            riskAssessment: {}
        };

        try {
            // 1. 統計的偏差分析
            analysis.statisticalAnalysis = this.analyzeStatisticalDeviation(horse);
            analysis.deviationScore = analysis.statisticalAnalysis.deviationScore || 0;

            // 2. 市場効率性分析
            analysis.marketContext = this.analyzeMarketEfficiency(horse, allHorses);
            analysis.marketEfficiencyScore = analysis.marketContext.efficiencyScore || 0;

            // 3. 相対価値分析
            analysis.relativeValueScore = this.analyzeRelativeValue(horse, allHorses);

            // 4. トレンド分析
            analysis.trendScore = this.analyzeTrendPattern(horse);

            // 5. 総合妙味スコア計算
            analysis.overallValueScore = this.calculateOverallValueScore(analysis);

            // 6. 価値カテゴリー判定
            analysis.valueCategory = this.determineValueCategory(analysis.overallValueScore);

            // 7. 投資推奨度判定
            analysis.recommendation = this.determineRecommendation(analysis);

            // 8. リスク評価
            analysis.riskAssessment = this.assessRisk(analysis);

            // 履歴データ更新
            this.updateHistoricalData(horse);

            console.log(`💎 オッズ妙味検出完了: ${horse.name} - スコア${analysis.overallValueScore.toFixed(1)}`);

        } catch (error) {
            console.error('❌ オッズ妙味検出エラー:', error);
            analysis.error = error.message;
        }

        return analysis;
    }

    /**
     * 統計的偏差分析
     */
    analyzeStatisticalDeviation(horse) {
        const analysis = {
            historicalOdds: [],
            mean: 0,
            standardDeviation: 0,
            currentDeviation: 0,
            deviationScore: 0,
            isOutlier: false
        };

        try {
            // 過去のオッズデータ取得
            const horseHistory = this.getHorseHistoricalOdds(horse.name);
            
            if (horseHistory.length < this.settings.minimumHistoricalSamples) {
                analysis.deviationScore = 50; // 中立スコア
                analysis.note = '履歴データ不足';
                return analysis;
            }

            analysis.historicalOdds = horseHistory;
            analysis.mean = this.calculateMean(horseHistory);
            analysis.standardDeviation = this.calculateStandardDeviation(horseHistory, analysis.mean);

            // 現在オッズの偏差計算
            if (analysis.standardDeviation > 0) {
                analysis.currentDeviation = (horse.odds - analysis.mean) / analysis.standardDeviation;
                
                // 外れ値判定
                analysis.isOutlier = Math.abs(analysis.currentDeviation) > this.settings.outlierThreshold;
                
                // 偏差スコア計算（100点満点）
                // 負の偏差（オッズが低い）= 過小評価 = 高スコア
                // 正の偏差（オッズが高い）= 過大評価 = 低スコア
                analysis.deviationScore = Math.max(0, Math.min(100, 
                    50 - (analysis.currentDeviation * 20)
                ));
            }

        } catch (error) {
            console.warn('⚠️ 統計的偏差分析エラー:', error);
            analysis.deviationScore = 50;
        }

        return analysis;
    }

    /**
     * 市場効率性分析
     */
    analyzeMarketEfficiency(horse, allHorses) {
        const analysis = {
            impliedProbability: 0,
            theoreticalProbability: 0,
            efficiencyGap: 0,
            efficiencyScore: 0,
            marketPressure: 'neutral'
        };

        try {
            // インプライド確率計算（オッズから逆算）
            analysis.impliedProbability = 1 / horse.odds;

            // 理論確率計算（予測モデルから）
            analysis.theoreticalProbability = horse.winProbability || horse.placeProbability || 0;

            if (analysis.theoreticalProbability > 0) {
                // 効率性ギャップ計算
                analysis.efficiencyGap = analysis.theoreticalProbability - analysis.impliedProbability;
                
                // 効率性スコア計算（正のギャップ = 過小評価 = 高スコア）
                analysis.efficiencyScore = Math.max(0, Math.min(100,
                    50 + (analysis.efficiencyGap * 1000)
                ));

                // 市場圧力判定
                if (analysis.efficiencyGap > 0.05) {
                    analysis.marketPressure = 'undervalued';
                } else if (analysis.efficiencyGap < -0.05) {
                    analysis.marketPressure = 'overvalued';
                } else {
                    analysis.marketPressure = 'efficient';
                }
            }

        } catch (error) {
            console.warn('⚠️ 市場効率性分析エラー:', error);
            analysis.efficiencyScore = 50;
        }

        return analysis;
    }

    /**
     * 相対価値分析
     */
    analyzeRelativeValue(horse, allHorses) {
        if (!allHorses || allHorses.length === 0) return 50;

        try {
            // 同レース内での相対的な期待値順位
            const horsesWithEV = allHorses.filter(h => h.odds && h.winProbability)
                .map(h => ({
                    ...h,
                    impliedValue: h.winProbability * h.odds
                }))
                .sort((a, b) => b.impliedValue - a.impliedValue);

            const horseIndex = horsesWithEV.findIndex(h => h.name === horse.name);
            
            if (horseIndex === -1) return 50;

            // 順位をスコアに変換（上位ほど高スコア）
            const relativeScore = Math.max(0, Math.min(100,
                100 - (horseIndex / horsesWithEV.length * 100)
            ));

            return relativeScore;

        } catch (error) {
            console.warn('⚠️ 相対価値分析エラー:', error);
            return 50;
        }
    }

    /**
     * トレンド分析
     */
    analyzeTrendPattern(horse) {
        try {
            const recentOdds = this.getRecentOddsHistory(horse.name, this.settings.trendAnalysisPeriod);
            
            if (recentOdds.length < 3) return 50;

            // 単純なトレンド計算（直近のオッズ変化方向）
            const trend = recentOdds[recentOdds.length - 1] - recentOdds[0];
            const trendPercentage = trend / recentOdds[0];

            // トレンドスコア（下降トレンド = より魅力的 = 高スコア）
            const trendScore = Math.max(0, Math.min(100,
                50 - (trendPercentage * 100)
            ));

            return trendScore;

        } catch (error) {
            console.warn('⚠️ トレンド分析エラー:', error);
            return 50;
        }
    }

    /**
     * 総合妙味スコア計算
     */
    calculateOverallValueScore(analysis) {
        const weights = {
            deviation: 0.3,         // 統計的偏差
            efficiency: 0.4,        // 市場効率性
            relative: 0.2,          // 相対価値
            trend: 0.1              // トレンド
        };

        return (
            analysis.deviationScore * weights.deviation +
            analysis.marketEfficiencyScore * weights.efficiency +
            analysis.relativeValueScore * weights.relative +
            analysis.trendScore * weights.trend
        );
    }

    /**
     * 価値カテゴリー判定
     */
    determineValueCategory(overallScore) {
        if (overallScore >= 75) return 'highly_undervalued';
        if (overallScore >= 65) return 'undervalued';
        if (overallScore >= 45) return 'neutral';
        if (overallScore >= 35) return 'overvalued';
        return 'highly_overvalued';
    }

    /**
     * 投資推奨度判定
     */
    determineRecommendation(analysis) {
        const score = analysis.overallValueScore;
        const risk = analysis.riskAssessment?.riskLevel || 'medium';

        if (score >= 80 && risk !== 'high') return 'strong_buy';
        if (score >= 70 && risk !== 'high') return 'buy';
        if (score >= 60) return 'consider';
        if (score >= 40) return 'monitor';
        return 'avoid';
    }

    /**
     * リスク評価
     */
    assessRisk(analysis) {
        const riskFactors = [];
        let riskScore = 0;

        // オッズレベルリスク
        if (analysis.currentOdds > 20) {
            riskFactors.push('高オッズによる高ボラティリティ');
            riskScore += 30;
        }

        // 統計的信頼性リスク
        if (analysis.statisticalAnalysis.historicalOdds.length < 10) {
            riskFactors.push('履歴データ不足');
            riskScore += 20;
        }

        // 市場効率性リスク
        if (Math.abs(analysis.marketContext.efficiencyGap) > 0.1) {
            riskFactors.push('市場効率性の大幅な歪み');
            riskScore += 25;
        }

        let riskLevel = 'low';
        if (riskScore >= 50) riskLevel = 'high';
        else if (riskScore >= 25) riskLevel = 'medium';

        return {
            riskScore,
            riskLevel,
            riskFactors
        };
    }

    /**
     * ユーティリティメソッド群
     */
    categorizeOdds(odds) {
        if (odds < 2) return 'favorite';
        if (odds < 5) return 'second_favorite';
        if (odds < 10) return 'mid_range';
        if (odds < 20) return 'outsider';
        return 'long_shot';
    }

    calculateMean(values) {
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    calculateStandardDeviation(values, mean) {
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    getHorseHistoricalOdds(horseName) {
        const history = this.historicalData[horseName] || [];
        return history.map(record => record.odds).filter(odds => odds > 0);
    }

    getRecentOddsHistory(horseName, period) {
        const history = this.getHorseHistoricalOdds(horseName);
        return history.slice(-period);
    }

    /**
     * データ管理メソッド
     */
    loadHistoricalData() {
        try {
            const saved = localStorage.getItem(this.historicalOddsKey);
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.warn('⚠️ 履歴オッズデータ読み込みエラー:', error);
            return {};
        }
    }

    updateHistoricalData(horse) {
        try {
            if (!this.historicalData[horse.name]) {
                this.historicalData[horse.name] = [];
            }

            this.historicalData[horse.name].push({
                timestamp: new Date().toISOString(),
                odds: horse.odds,
                raceName: horse.raceName || 'unknown',
                course: horse.course || 'unknown'
            });

            // 履歴データの上限管理（最新50件まで）
            if (this.historicalData[horse.name].length > 50) {
                this.historicalData[horse.name] = this.historicalData[horse.name].slice(-50);
            }

            localStorage.setItem(this.historicalOddsKey, JSON.stringify(this.historicalData));
        } catch (error) {
            console.warn('⚠️ 履歴データ更新エラー:', error);
        }
    }

    /**
     * 全馬のオッズ妙味分析を実行
     */
    analyzeBatch(horses) {
        console.log('💰 一括オッズ妙味分析開始');
        
        const results = horses.map(horse => this.detectOddsValue(horse, horses));
        
        // 結果をローカルストレージに保存
        try {
            localStorage.setItem(this.analysisResultsKey, JSON.stringify({
                timestamp: new Date().toISOString(),
                raceInfo: {
                    totalHorses: horses.length,
                    analyzedHorses: results.length
                },
                results: results
            }));
        } catch (error) {
            console.warn('⚠️ 分析結果保存エラー:', error);
        }

        console.log(`💰 一括分析完了: ${results.length}頭分析`);
        return results;
    }

    /**
     * 市場効率性レポート生成
     */
    generateMarketEfficiencyReport(analysisResults) {
        const report = {
            timestamp: new Date().toISOString(),
            marketSummary: {
                totalHorses: analysisResults.length,
                undervaluedCount: 0,
                overvaluedCount: 0,
                neutralCount: 0,
                averageValueScore: 0
            },
            recommendations: [],
            insights: []
        };

        // 統計計算
        let totalScore = 0;
        analysisResults.forEach(result => {
            totalScore += result.overallValueScore;
            
            switch (result.valueCategory) {
                case 'highly_undervalued':
                case 'undervalued':
                    report.marketSummary.undervaluedCount++;
                    break;
                case 'highly_overvalued':
                case 'overvalued':
                    report.marketSummary.overvaluedCount++;
                    break;
                default:
                    report.marketSummary.neutralCount++;
            }

            // 強い推奨候補
            if (result.recommendation === 'strong_buy' || result.recommendation === 'buy') {
                report.recommendations.push({
                    horseName: result.horse.name,
                    valueScore: result.overallValueScore,
                    recommendation: result.recommendation,
                    reason: this.generateRecommendationReason(result)
                });
            }
        });

        report.marketSummary.averageValueScore = totalScore / analysisResults.length;

        // インサイト生成
        report.insights = this.generateMarketInsights(report.marketSummary, analysisResults);

        return report;
    }

    generateRecommendationReason(analysis) {
        const reasons = [];
        
        if (analysis.deviationScore > 70) {
            reasons.push('統計的に過小評価');
        }
        if (analysis.marketEfficiencyScore > 70) {
            reasons.push('市場効率性ギャップ');
        }
        if (analysis.relativeValueScore > 70) {
            reasons.push('相対価値が高い');
        }
        
        return reasons.join(', ') || '総合評価が高い';
    }

    generateMarketInsights(summary, results) {
        const insights = [];

        // 市場バランス分析
        if (summary.undervaluedCount > summary.overvaluedCount * 2) {
            insights.push('市場全体で過小評価傾向。投資機会が多い');
        } else if (summary.overvaluedCount > summary.undervaluedCount * 2) {
            insights.push('市場全体で過大評価傾向。慎重な選択が必要');
        }

        // 平均スコア分析
        if (summary.averageValueScore > 60) {
            insights.push('全体的に魅力的なレース構成');
        } else if (summary.averageValueScore < 40) {
            insights.push('全体的に投資妙味に欠ける');
        }

        return insights;
    }
}

// グローバル公開
window.OddsValueDetector = OddsValueDetector;

// 使用例とデモ機能
window.demoOddsValueDetection = function() {
    if (!window.horses || window.horses.length === 0) {
        console.warn('⚠️ 馬データが見つかりません');
        return;
    }

    const detector = new OddsValueDetector();
    const results = detector.analyzeBatch(window.horses);
    const report = detector.generateMarketEfficiencyReport(results);
    
    console.log('📊 オッズ妙味検出デモ結果:', report);
    
    // 結果を表示
    if (confirm('オッズ妙味検出結果を表示しますか？')) {
        const displayDiv = document.createElement('div');
        displayDiv.innerHTML = `
            <h3>💰 オッズ妙味検出結果</h3>
            <p><strong>分析対象:</strong> ${report.marketSummary.totalHorses}頭</p>
            <p><strong>過小評価:</strong> ${report.marketSummary.undervaluedCount}頭</p>
            <p><strong>過大評価:</strong> ${report.marketSummary.overvaluedCount}頭</p>
            <p><strong>平均妙味スコア:</strong> ${report.marketSummary.averageValueScore.toFixed(1)}</p>
            <h4>推奨銘柄:</h4>
            <ul>
                ${report.recommendations.map(rec => 
                    `<li><strong>${rec.horseName}</strong> (${rec.valueScore.toFixed(1)}点) - ${rec.reason}</li>`
                ).join('')}
            </ul>
        `;
        displayDiv.style.cssText = 'position:fixed;top:20px;right:20px;background:white;border:2px solid #333;padding:20px;max-width:400px;z-index:9999;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '閉じる';
        closeBtn.onclick = () => displayDiv.remove();
        closeBtn.style.cssText = 'margin-top:10px;padding:5px 10px;background:#ff6b6b;color:white;border:none;border-radius:4px;cursor:pointer;';
        
        displayDiv.appendChild(closeBtn);
        document.body.appendChild(displayDiv);
    }
    
    return {results, report};
};

console.log('💰 Phase 8α: オッズ妙味検出システム実装完了');
console.log('📝 使用方法: window.demoOddsValueDetection() でデモ実行');