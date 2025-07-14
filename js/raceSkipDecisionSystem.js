// Phase 3: レース見送り判定システム
class RaceSkipDecisionSystem {
    // 見送り判定の閾値設定
    static skipThresholds = {
        // 期待値関連
        maxExpectedValue: 1.1,          // レース最高期待値がこれ以下なら見送り検討
        avgExpectedValue: 0.8,          // レース平均期待値がこれ以下なら見送り
        recommendedBetsMin: 1,          // 推奨買い目数がこれ以下なら見送り
        
        // 投資効率関連
        minInvestmentEfficiency: 60,    // 投資効率スコアがこれ以下なら見送り
        maxTotalInvestment: 2000,       // 総投資額がこれ以上なら見送り検討
        
        // リスク管理関連
        maxHighRiskBets: 2,             // 高リスク買い目数がこれ以上なら見送り
        minConfidenceLevel: 50,         // 最低信頼度レベル
        
        // レース特性関連
        minHorseCount: 6,               // 出走頭数がこれ以下なら見送り検討
        maxFavoriteOdds: 1.5,           // 本命オッズがこれ以下なら見送り検討
        
        // 学習ベース調整
        recentPerformanceWeight: 0.3    // 最近の成績による調整重み
    };
    
    // 見送り判定の実行
    static evaluateRaceSkip(predictions, expectedValueAnalysis, bettingRecommendations) {
        console.log('🔍 Phase 3: レース見送り判定開始', {
            predictionsCount: predictions.length,
            recommendationsCount: bettingRecommendations.length
        });
        
        const skipAnalysis = {
            shouldSkip: false,
            confidence: 0,
            reasons: [],
            riskFactors: [],
            investmentEfficiency: 0,
            alternativeStrategy: null,
            detailedAnalysis: {}
        };
        
        // 1. 期待値ベース判定
        const expectedValueCheck = this.analyzeExpectedValueFactors(expectedValueAnalysis);
        skipAnalysis.detailedAnalysis.expectedValue = expectedValueCheck;
        
        // 2. 投資効率判定
        const efficiencyCheck = this.analyzeInvestmentEfficiency(bettingRecommendations, predictions);
        skipAnalysis.detailedAnalysis.efficiency = efficiencyCheck;
        
        // 3. リスク評価
        const riskCheck = this.analyzeRiskFactors(predictions, bettingRecommendations);
        skipAnalysis.detailedAnalysis.risk = riskCheck;
        
        // 4. レース特性評価
        const raceCheck = this.analyzeRaceCharacteristics(predictions);
        skipAnalysis.detailedAnalysis.race = raceCheck;
        
        // 5. 学習データベース判定
        const learningCheck = this.analyzeLearningData(predictions);
        skipAnalysis.detailedAnalysis.learning = learningCheck;
        
        // 6. 総合判定
        const finalDecision = this.makeFinalSkipDecision([
            expectedValueCheck,
            efficiencyCheck, 
            riskCheck,
            raceCheck,
            learningCheck
        ]);
        
        skipAnalysis.shouldSkip = finalDecision.shouldSkip;
        skipAnalysis.confidence = finalDecision.confidence;
        skipAnalysis.reasons = finalDecision.reasons;
        skipAnalysis.riskFactors = finalDecision.riskFactors;
        skipAnalysis.investmentEfficiency = efficiencyCheck.overallEfficiency;
        skipAnalysis.alternativeStrategy = finalDecision.alternativeStrategy;
        
        console.log('📊 見送り判定結果', skipAnalysis);
        
        return skipAnalysis;
    }
    
    // 期待値要因分析
    static analyzeExpectedValueFactors(expectedValueAnalysis) {
        const analysis = {
            maxExpectedValue: 0,
            avgExpectedValue: 0,
            recommendedCount: 0,
            skipScore: 0,
            skipReasons: []
        };
        
        if (!expectedValueAnalysis || !expectedValueAnalysis.analyzedHorses) {
            analysis.skipScore = 100;
            analysis.skipReasons.push('期待値データが不足');
            return analysis;
        }
        
        const horses = expectedValueAnalysis.analyzedHorses;
        const expectedValues = horses.map(h => h.expectedValue);
        
        analysis.maxExpectedValue = Math.max(...expectedValues);
        analysis.avgExpectedValue = expectedValues.reduce((sum, val) => sum + val, 0) / expectedValues.length;
        analysis.recommendedCount = horses.filter(h => h.expectedValue >= 1.1).length;
        
        // 見送りスコア計算（0-100、高いほど見送り推奨）
        let score = 0;
        
        if (analysis.maxExpectedValue < this.skipThresholds.maxExpectedValue) {
            score += 30;
            analysis.skipReasons.push(`最高期待値${analysis.maxExpectedValue.toFixed(2)}が基準${this.skipThresholds.maxExpectedValue}未満`);
        }
        
        if (analysis.avgExpectedValue < this.skipThresholds.avgExpectedValue) {
            score += 25;
            analysis.skipReasons.push(`平均期待値${analysis.avgExpectedValue.toFixed(2)}が基準${this.skipThresholds.avgExpectedValue}未満`);
        }
        
        if (analysis.recommendedCount < this.skipThresholds.recommendedBetsMin) {
            score += 20;
            analysis.skipReasons.push(`推奨買い目数${analysis.recommendedCount}が基準${this.skipThresholds.recommendedBetsMin}未満`);
        }
        
        analysis.skipScore = Math.min(score, 100);
        return analysis;
    }
    
    // 投資効率分析
    static analyzeInvestmentEfficiency(bettingRecommendations, predictions) {
        const analysis = {
            totalInvestment: 0,
            estimatedReturn: 0,
            riskAdjustedReturn: 0,
            overallEfficiency: 0,
            skipScore: 0,
            skipReasons: []
        };
        
        if (!bettingRecommendations || bettingRecommendations.length === 0) {
            analysis.skipScore = 80;
            analysis.skipReasons.push('推奨買い目が存在しない');
            return analysis;
        }
        
        // 投資額と期待リターン計算
        bettingRecommendations.forEach(rec => {
            const amount = parseInt(rec.recommendedAmount) || 300;
            analysis.totalInvestment += amount;
            analysis.estimatedReturn += amount * rec.expectedValue;
        });
        
        // リスク調整リターン計算
        const avgConfidence = bettingRecommendations.reduce((sum, rec) => sum + rec.confidence, 0) / bettingRecommendations.length;
        analysis.riskAdjustedReturn = analysis.estimatedReturn * (avgConfidence / 100);
        
        // 投資効率スコア（0-100）
        const returnRatio = analysis.estimatedReturn / Math.max(analysis.totalInvestment, 1);
        analysis.overallEfficiency = Math.min(returnRatio * 50, 100);
        
        // 見送りスコア計算
        let score = 0;
        
        if (analysis.totalInvestment > this.skipThresholds.maxTotalInvestment) {
            score += 20;
            analysis.skipReasons.push(`総投資額${analysis.totalInvestment}円が上限${this.skipThresholds.maxTotalInvestment}円を超過`);
        }
        
        if (analysis.overallEfficiency < this.skipThresholds.minInvestmentEfficiency) {
            score += 30;
            analysis.skipReasons.push(`投資効率${analysis.overallEfficiency.toFixed(1)}が基準${this.skipThresholds.minInvestmentEfficiency}未満`);
        }
        
        if (returnRatio < 1.05) {
            score += 25;
            analysis.skipReasons.push(`期待リターン率${(returnRatio * 100).toFixed(1)}%が最低基準105%未満`);
        }
        
        analysis.skipScore = Math.min(score, 100);
        return analysis;
    }
    
    // リスク要因分析
    static analyzeRiskFactors(predictions, bettingRecommendations) {
        const analysis = {
            highRiskBetsCount: 0,
            avgConfidence: 0,
            riskDistribution: { low: 0, medium: 0, high: 0 },
            skipScore: 0,
            skipReasons: []
        };
        
        if (!bettingRecommendations || bettingRecommendations.length === 0) {
            analysis.skipScore = 0; // リスクがないのでスキップ理由にはならない
            return analysis;
        }
        
        // リスク分析
        bettingRecommendations.forEach(rec => {
            // 信頼度を0-100の範囲に正規化
            const confidence = (rec.confidence || 0) * (rec.confidence <= 1 ? 100 : 1);
            
            if (confidence < 40) {
                analysis.highRiskBetsCount++;
                analysis.riskDistribution.high++;
            } else if (confidence < 70) {
                analysis.riskDistribution.medium++;
            } else {
                analysis.riskDistribution.low++;
            }
        });
        
        analysis.avgConfidence = bettingRecommendations.reduce((sum, rec) => {
            const confidence = (rec.confidence || 0) * (rec.confidence <= 1 ? 100 : 1);
            return sum + confidence;
        }, 0) / bettingRecommendations.length;
        
        // 見送りスコア計算
        let score = 0;
        
        if (analysis.highRiskBetsCount > this.skipThresholds.maxHighRiskBets) {
            score += 25;
            analysis.skipReasons.push(`高リスク買い目数${analysis.highRiskBetsCount}が上限${this.skipThresholds.maxHighRiskBets}を超過`);
        }
        
        if (analysis.avgConfidence < this.skipThresholds.minConfidenceLevel) {
            score += 30;
            analysis.skipReasons.push(`平均信頼度${analysis.avgConfidence.toFixed(1)}%が基準${this.skipThresholds.minConfidenceLevel}%未満`);
        }
        
        if (analysis.riskDistribution.high > analysis.riskDistribution.low) {
            score += 15;
            analysis.skipReasons.push('高リスク買い目が低リスク買い目を上回る');
        }
        
        analysis.skipScore = Math.min(score, 100);
        return analysis;
    }
    
    // レース特性分析
    static analyzeRaceCharacteristics(predictions) {
        const analysis = {
            horseCount: predictions.length,
            favoriteOdds: 0,
            oddsRange: { min: 0, max: 0 },
            competitiveness: 0,
            skipScore: 0,
            skipReasons: []
        };
        
        if (predictions.length === 0) {
            analysis.skipScore = 100;
            analysis.skipReasons.push('出走馬データなし');
            return analysis;
        }
        
        // オッズ分析
        const odds = predictions.map(p => parseFloat(p.odds)).filter(o => !isNaN(o));
        analysis.favoriteOdds = Math.min(...odds);
        analysis.oddsRange.min = Math.min(...odds);
        analysis.oddsRange.max = Math.max(...odds);
        
        // 競争力分析（オッズ差による判定）
        const oddsSpread = analysis.oddsRange.max - analysis.oddsRange.min;
        analysis.competitiveness = Math.min(oddsSpread / 10, 100);
        
        // 見送りスコア計算
        let score = 0;
        
        if (analysis.horseCount < this.skipThresholds.minHorseCount) {
            score += 20;
            analysis.skipReasons.push(`出走頭数${analysis.horseCount}頭が最小基準${this.skipThresholds.minHorseCount}頭未満`);
        }
        
        if (analysis.favoriteOdds < this.skipThresholds.maxFavoriteOdds) {
            score += 25;
            analysis.skipReasons.push(`本命オッズ${analysis.favoriteOdds}倍が基準${this.skipThresholds.maxFavoriteOdds}倍未満（堅すぎ）`);
        }
        
        if (analysis.competitiveness < 20) {
            score += 15;
            analysis.skipReasons.push('レースの競争力が低い（オッズ差が小さい）');
        }
        
        analysis.skipScore = Math.min(score, 100);
        return analysis;
    }
    
    // 学習データ分析
    static analyzeLearningData(predictions) {
        const analysis = {
            recentPerformance: 0,
            similarRaceSuccess: 0,
            confidenceAdjustment: 0,
            skipScore: 0,
            skipReasons: []
        };
        
        try {
            // 学習システムから最近の成績を取得
            const learningData = LearningSystem.getLearningData();
            const recentHistory = learningData.history ? learningData.history.slice(-10) : [];
            
            if (recentHistory.length > 0) {
                const recentWinRate = recentHistory.filter(h => h.winCorrect).length / recentHistory.length;
                const recentPlaceRate = recentHistory.filter(h => h.placeCorrect).length / recentHistory.length;
                analysis.recentPerformance = (recentWinRate * 0.3 + recentPlaceRate * 0.7) * 100;
                
                // 成績が悪い場合は見送り傾向を強める
                if (analysis.recentPerformance < 30) {
                    analysis.skipScore += 20;
                    analysis.skipReasons.push(`最近の成績${analysis.recentPerformance.toFixed(1)}%が低調`);
                }
            }
            
            // 類似レース成功率（簡易版）
            const horseCount = predictions.length;
            const avgOdds = predictions.reduce((sum, p) => sum + parseFloat(p.odds), 0) / predictions.length;
            
            // 過去の類似条件での成績を推定
            analysis.similarRaceSuccess = Math.max(20, 60 - Math.abs(horseCount - 8) * 5 - Math.abs(avgOdds - 5) * 3);
            
            if (analysis.similarRaceSuccess < 40) {
                analysis.skipScore += 15;
                analysis.skipReasons.push(`類似レース成功率${analysis.similarRaceSuccess.toFixed(1)}%が低い`);
            }
            
        } catch (error) {
            console.warn('学習データ分析エラー:', error);
            analysis.skipScore += 10; // データ不足ペナルティ
            analysis.skipReasons.push('学習データが不十分');
        }
        
        analysis.skipScore = Math.min(analysis.skipScore, 100);
        return analysis;
    }
    
    // 最終見送り判定
    static makeFinalSkipDecision(analysisResults) {
        const decision = {
            shouldSkip: false,
            confidence: 0,
            reasons: [],
            riskFactors: [],
            alternativeStrategy: null
        };
        
        // 各分析のスコアを重み付きで統合
        const weights = {
            expectedValue: 0.35,    // 期待値が最重要
            efficiency: 0.25,      // 投資効率
            risk: 0.20,             // リスク要因
            race: 0.15,             // レース特性
            learning: 0.05          // 学習データ
        };
        
        const [evAnalysis, effAnalysis, riskAnalysis, raceAnalysis, learningAnalysis] = analysisResults;
        
        const weightedSkipScore = 
            (evAnalysis?.skipScore || 0) * weights.expectedValue +
            (effAnalysis?.skipScore || 0) * weights.efficiency +
            (riskAnalysis?.skipScore || 0) * weights.risk +
            (raceAnalysis?.skipScore || 0) * weights.race +
            (learningAnalysis?.skipScore || 0) * weights.learning;
        
        console.log('見送り判定スコア詳細:', {
            期待値: evAnalysis?.skipScore || 0,
            投資効率: effAnalysis?.skipScore || 0,
            リスク: riskAnalysis?.skipScore || 0,
            レース特性: raceAnalysis?.skipScore || 0,
            学習: learningAnalysis?.skipScore || 0,
            重み付き合計: weightedSkipScore
        });
        
        // 見送り判定閾値
        const skipThreshold = 60; // 60点以上で見送り推奨
        
        decision.shouldSkip = weightedSkipScore >= skipThreshold;
        decision.confidence = Math.min(weightedSkipScore, 100);
        
        // 見送り理由をまとめる
        [evAnalysis, effAnalysis, riskAnalysis, raceAnalysis, learningAnalysis].forEach(analysis => {
            if (analysis.skipReasons) {
                decision.reasons.push(...analysis.skipReasons);
            }
        });
        
        // 代替戦略の提案
        if (decision.shouldSkip) {
            if (evAnalysis.maxExpectedValue > 0.9) {
                decision.alternativeStrategy = {
                    type: '最小投資戦略',
                    description: '期待値の高い1点のみに少額投資',
                    recommendedAmount: 200
                };
            } else if (riskAnalysis.avgConfidence > 60) {
                decision.alternativeStrategy = {
                    type: '様子見戦略',
                    description: '次レースまで待機、データ収集に専念',
                    recommendedAmount: 0
                };
            } else {
                decision.alternativeStrategy = {
                    type: '完全見送り戦略',
                    description: 'このレースは投資対象として不適切',
                    recommendedAmount: 0
                };
            }
        }
        
        return decision;
    }
    
    // 見送り履歴の記録
    static recordSkipDecision(skipAnalysis, raceData) {
        try {
            const skipHistory = JSON.parse(localStorage.getItem('raceSkipHistory') || '[]');
            
            const record = {
                timestamp: new Date().toISOString(),
                decision: skipAnalysis.shouldSkip,
                confidence: skipAnalysis.confidence,
                reasons: skipAnalysis.reasons,
                raceData: {
                    horseCount: raceData.length,
                    avgOdds: raceData.reduce((sum, h) => sum + parseFloat(h.odds), 0) / raceData.length
                },
                detailedAnalysis: skipAnalysis.detailedAnalysis
            };
            
            skipHistory.push(record);
            
            // 最新100件のみ保持
            if (skipHistory.length > 100) {
                skipHistory.splice(0, skipHistory.length - 100);
            }
            
            localStorage.setItem('raceSkipHistory', JSON.stringify(skipHistory));
            console.log('見送り判定履歴を記録しました:', record);
            
        } catch (error) {
            console.error('見送り履歴記録エラー:', error);
        }
    }
    
    // 見送り統計の取得
    static getSkipStatistics() {
        try {
            const skipHistory = JSON.parse(localStorage.getItem('raceSkipHistory') || '[]');
            
            if (skipHistory.length === 0) {
                return {
                    totalDecisions: 0,
                    skipCount: 0,
                    skipRate: 0,
                    avgConfidence: 0,
                    topReasons: []
                };
            }
            
            const skipCount = skipHistory.filter(h => h.decision).length;
            const avgConfidence = skipHistory.reduce((sum, h) => sum + h.confidence, 0) / skipHistory.length;
            
            // 見送り理由の集計
            const reasonCounts = {};
            skipHistory.forEach(h => {
                if (h.decision && h.reasons) {
                    h.reasons.forEach(reason => {
                        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
                    });
                }
            });
            
            const topReasons = Object.entries(reasonCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([reason, count]) => ({ reason, count }));
            
            return {
                totalDecisions: skipHistory.length,
                skipCount,
                skipRate: (skipCount / skipHistory.length) * 100,
                avgConfidence: avgConfidence,
                topReasons
            };
            
        } catch (error) {
            console.error('見送り統計取得エラー:', error);
            return null;
        }
    }
}

// グローバル公開
window.RaceSkipDecisionSystem = RaceSkipDecisionSystem;