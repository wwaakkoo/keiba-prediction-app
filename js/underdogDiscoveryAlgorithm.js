// 穴馬発見アルゴリズム
class UnderdogDiscoveryAlgorithm {
    
    // 穴馬発見の基本設定
    static discoveryConfig = {
        // 穴馬定義
        underdogThresholds: {
            minOdds: 7.0,              // 最低オッズ（7倍以上）
            maxPopularity: 10,         // 最大人気順（10番人気以下）
            bigUnderdogOdds: 15.0,     // 大穴オッズ（15倍以上）
            extremeUnderdogOdds: 50.0  // 超大穴オッズ（50倍以上）
        },
        
        // 発見重み設定
        discoveryWeights: {
            pedigreeFactors: 0.25,     // 血統要因（25%）
            formFactors: 0.30,         // 調教・状態要因（30%）
            raceConditions: 0.20,      // レース条件適性（20%）
            marketInefficiency: 0.15,   // 市場の非効率性（15%）
            jockeyTrainer: 0.10        // 騎手・調教師要因（10%）
        },
        
        // 信頼度基準
        confidenceThresholds: {
            high: 0.8,     // 高信頼度（80%以上）
            medium: 0.6,   // 中信頼度（60%以上）
            low: 0.4       // 低信頼度（40%以上）
        },
        
        // 除外条件
        exclusionCriteria: {
            maxAge: 8,                 // 最大年齢（8歳以下）
            minRecentRaces: 1,         // 最低レース数（直近1戦以上）
            excludeDebut: false,       // 新馬戦除外フラグ
            excludeGradeRaces: false   // 重賞除外フラグ
        }
    };
    
    // 穴馬発見データベース
    static underdogDatabase = {
        // 成功パターン記録
        successPatterns: new Map(),
        
        // 血統別穴馬適性
        pedigreeUnderdogRating: new Map(),
        
        // 騎手別穴馬成功率
        jockeyUnderdogSuccess: new Map(),
        
        // 調教師別穴馬成功率
        trainerUnderdogSuccess: new Map(),
        
        // レース条件別穴馬傾向
        raceConditionPatterns: new Map(),
        
        // 市場の歪み検出履歴
        marketInefficiencyHistory: []
    };
    
    /**
     * メイン穴馬発見処理
     * @param {Array} horses - 馬データ配列
     * @param {Object} raceConditions - レース条件
     * @returns {Array} 穴馬候補リスト（確信度順）
     */
    static discoverUnderdogs(horses, raceConditions = {}) {
        console.log('=== 穴馬発見アルゴリズム開始 ===');
        console.log('対象馬数:', horses.length);
        console.log('レース条件:', raceConditions);
        
        try {
            // 1. 基本フィルタリング（穴馬候補抽出）
            const underdogCandidates = this.filterUnderdogCandidates(horses);
            console.log('穴馬候補数:', underdogCandidates.length);
            
            if (underdogCandidates.length === 0) {
                return { underdogs: [], analysis: { message: '穴馬候補が見つかりませんでした' } };
            }
            
            // 2. 多面的分析実行
            const analysisResults = underdogCandidates.map(horse => 
                this.analyzeUnderdogPotential(horse, raceConditions, horses)
            );
            
            // 3. 確信度による順位付け
            const rankedUnderdogs = this.rankUnderdogsByConfidence(analysisResults);
            
            // 4. 投資効率との統合評価
            const finalRecommendations = this.integrateWithInvestmentEfficiency(rankedUnderdogs);
            
            // 5. 穴馬発見レポート生成
            const discoveryReport = this.generateDiscoveryReport(finalRecommendations, raceConditions);
            
            console.log('穴馬発見完了:', discoveryReport.summary);
            return discoveryReport;
            
        } catch (error) {
            console.error('穴馬発見エラー:', error);
            return { underdogs: [], analysis: { error: error.message } };
        }
    }
    
    /**
     * 穴馬候補の基本フィルタリング
     * @param {Array} horses - 全馬データ
     * @returns {Array} 穴馬候補配列
     */
    static filterUnderdogCandidates(horses) {
        const thresholds = this.discoveryConfig.underdogThresholds;
        const exclusion = this.discoveryConfig.exclusionCriteria;
        
        return horses.filter(horse => {
            // オッズ条件
            if (horse.odds < thresholds.minOdds) return false;
            
            // 人気条件
            if (horse.popularity && horse.popularity <= 3) return false; // 1-3番人気は除外
            
            // 年齢条件
            if (horse.age && horse.age > exclusion.maxAge) return false;
            
            // レース経験条件
            if (horse.raceHistory && horse.raceHistory.length < exclusion.minRecentRaces) return false;
            
            // 新馬戦除外
            if (exclusion.excludeDebut && horse.isDebut) return false;
            
            console.log(`穴馬候補: ${horse.name} (${horse.odds}倍, ${horse.popularity || '?'}番人気)`);
            return true;
        });
    }
    
    /**
     * 穴馬ポテンシャル分析
     * @param {Object} horse - 馬データ
     * @param {Object} raceConditions - レース条件
     * @param {Array} allHorses - 全馬データ（相対評価用）
     * @returns {Object} 穴馬分析結果
     */
    static analyzeUnderdogPotential(horse, raceConditions, allHorses) {
        console.log(`=== ${horse.name} 穴馬ポテンシャル分析 ===`);
        
        const analysis = {
            horse: horse,
            baseInfo: {
                odds: horse.odds,
                popularity: horse.popularity || this.estimatePopularityFromOdds(horse.odds),
                underdogCategory: this.categorizeUnderdogLevel(horse.odds)
            },
            factors: {},
            scores: {},
            confidence: 0,
            investmentRating: 'UNKNOWN'
        };
        
        // 1. 血統要因分析
        analysis.factors.pedigree = this.analyzePedigreeFactor(horse, raceConditions);
        analysis.scores.pedigree = analysis.factors.pedigree.score;
        
        // 2. 調教・状態要因分析
        analysis.factors.form = this.analyzeFormFactor(horse, raceConditions);
        analysis.scores.form = analysis.factors.form.score;
        
        // 3. レース条件適性分析
        analysis.factors.raceConditions = this.analyzeRaceConditionsFactor(horse, raceConditions);
        analysis.scores.raceConditions = analysis.factors.raceConditions.score;
        
        // 4. 市場の非効率性分析
        analysis.factors.marketInefficiency = this.analyzeMarketInefficiency(horse, allHorses, raceConditions);
        analysis.scores.marketInefficiency = analysis.factors.marketInefficiency.score;
        
        // 5. 騎手・調教師要因分析
        analysis.factors.jockeyTrainer = this.analyzeJockeyTrainerFactor(horse, raceConditions);
        analysis.scores.jockeyTrainer = analysis.factors.jockeyTrainer.score;
        
        // 6. 総合信頼度計算
        analysis.confidence = this.calculateOverallConfidence(analysis.scores);
        
        // 7. 穴馬推奨度計算
        analysis.underdogRecommendation = this.calculateUnderdogRecommendation(analysis);
        
        console.log(`${horse.name} 分析完了 - 信頼度: ${(analysis.confidence * 100).toFixed(1)}%`);
        return analysis;
    }
    
    /**
     * 血統要因分析
     * @param {Object} horse - 馬データ
     * @param {Object} raceConditions - レース条件
     * @returns {Object} 血統分析結果
     */
    static analyzePedigreeFactor(horse, raceConditions) {
        let score = 50; // ベーススコア
        const factors = [];
        
        // 血統データベースとの照合
        if (typeof PedigreeDatabase !== 'undefined' && horse.sire) {
            const pedigreeData = PedigreeDatabase.getPedigreeData(horse.sire);
            if (pedigreeData) {
                // 穴馬適性血統の評価
                if (this.isUnderdogAptPedigree(pedigreeData)) {
                    score += 15;
                    factors.push('穴馬適性血統');
                }
                
                // 距離適性
                if (this.checkDistanceAptitude(pedigreeData, raceConditions.distance)) {
                    score += 10;
                    factors.push('距離適性良好');
                }
                
                // 馬場適性
                if (this.checkSurfaceAptitude(pedigreeData, raceConditions.surface)) {
                    score += 8;
                    factors.push('馬場適性良好');
                }
            }
        }
        
        // 母系血統の評価
        if (horse.dam) {
            const damScore = this.evaluateDamLineage(horse.dam, raceConditions);
            score += damScore;
            if (damScore > 5) factors.push('母系血統優秀');
        }
        
        // 配合相性評価
        if (horse.sire && horse.dam) {
            const nickScore = this.evaluateNicking(horse.sire, horse.dam, raceConditions);
            score += nickScore;
            if (nickScore > 5) factors.push('配合相性良好');
        }
        
        return {
            score: Math.min(100, Math.max(0, score)),
            factors: factors,
            details: {
                sireEvaluation: horse.sire ? '評価済み' : '不明',
                damEvaluation: horse.dam ? '評価済み' : '不明',
                pedigreeDepth: horse.pedigreeData ? 'あり' : 'なし'
            }
        };
    }
    
    /**
     * 調教・状態要因分析
     * @param {Object} horse - 馬データ
     * @param {Object} raceConditions - レース条件
     * @returns {Object} 調教・状態分析結果
     */
    static analyzeFormFactor(horse, raceConditions) {
        let score = 50;
        const factors = [];
        
        // 直前調教評価
        if (horse.trainingData) {
            const trainingScore = this.evaluateTrainingData(horse.trainingData);
            score += trainingScore;
            if (trainingScore > 0) factors.push('調教良好');
        }
        
        // 休み明け評価
        if (horse.restDays) {
            const restScore = this.evaluateRestDays(horse.restDays);
            score += restScore;
            if (restScore > 0) factors.push('休み明け効果');
        }
        
        // 前走からの上昇要因
        if (horse.raceHistory && horse.raceHistory.length > 0) {
            const improvementScore = this.evaluateImprovementFactors(horse);
            score += improvementScore;
            if (improvementScore > 5) factors.push('上昇要因あり');
        }
        
        // 斤量変化
        if (horse.weightChange) {
            const weightScore = this.evaluateWeightChange(horse.weightChange);
            score += weightScore;
            if (weightScore > 0) factors.push('斤量プラス要因');
        }
        
        // クラス変更
        if (horse.classChange) {
            const classScore = this.evaluateClassChange(horse.classChange);
            score += classScore;
            if (classScore > 0) factors.push('クラス変更プラス');
        }
        
        return {
            score: Math.min(100, Math.max(0, score)),
            factors: factors,
            details: {
                trainingRating: horse.trainingData ? '評価済み' : '不明',
                formTrend: this.analyzeFormTrend(horse),
                fitnessLevel: this.estimateFitnessLevel(horse)
            }
        };
    }
    
    /**
     * レース条件適性分析
     * @param {Object} horse - 馬データ
     * @param {Object} raceConditions - レース条件
     * @returns {Object} レース条件分析結果
     */
    static analyzeRaceConditionsFactor(horse, raceConditions) {
        let score = 50;
        const factors = [];
        
        // 距離適性
        if (raceConditions.distance) {
            const distanceScore = this.evaluateDistanceAptitude(horse, raceConditions.distance);
            score += distanceScore;
            if (distanceScore > 5) factors.push('距離適性');
        }
        
        // 馬場状態適性
        if (raceConditions.trackCondition) {
            const trackScore = this.evaluateTrackConditionAptitude(horse, raceConditions.trackCondition);
            score += trackScore;
            if (trackScore > 5) factors.push('馬場状態適性');
        }
        
        // コース適性
        if (raceConditions.course) {
            const courseScore = this.evaluateCourseAptitude(horse, raceConditions.course);
            score += courseScore;
            if (courseScore > 5) factors.push('コース適性');
        }
        
        // レースレベル適性
        if (raceConditions.raceLevel) {
            const levelScore = this.evaluateRaceLevelAptitude(horse, raceConditions.raceLevel);
            score += levelScore;
            if (levelScore > 5) factors.push('レースレベル適性');
        }
        
        // 季節・時期適性
        const seasonScore = this.evaluateSeasonalAptitude(horse, new Date());
        score += seasonScore;
        if (seasonScore > 5) factors.push('季節適性');
        
        return {
            score: Math.min(100, Math.max(0, score)),
            factors: factors,
            details: {
                bestDistance: this.findBestDistance(horse),
                bestTrackCondition: this.findBestTrackCondition(horse),
                aptitudeRating: this.calculateAptitudeRating(horse, raceConditions)
            }
        };
    }
    
    /**
     * 市場の非効率性分析
     * @param {Object} horse - 馬データ
     * @param {Array} allHorses - 全馬データ
     * @param {Object} raceConditions - レース条件
     * @returns {Object} 市場非効率性分析結果
     */
    static analyzeMarketInefficiency(horse, allHorses, raceConditions) {
        let score = 50;
        const factors = [];
        
        // オッズと実力の乖離分析
        const expectedOdds = this.calculateExpectedOdds(horse, allHorses, raceConditions);
        const actualOdds = horse.odds;
        const oddsGap = actualOdds / expectedOdds;
        
        if (oddsGap > 1.5) {
            const gapScore = Math.min(25, (oddsGap - 1) * 10);
            score += gapScore;
            factors.push(`実力過小評価(${oddsGap.toFixed(1)}倍)`);
        }
        
        // 人気と実績の逆転現象
        if (this.detectPopularityMispricing(horse, allHorses)) {
            score += 15;
            factors.push('人気実績逆転');
        }
        
        // 前走好走馬の人気薄転落
        if (this.detectGoodRunnerUnpopular(horse)) {
            score += 12;
            factors.push('前走好走人気薄');
        }
        
        // 新騎手・新調教師効果
        if (this.detectNewConnectionUnderestimated(horse)) {
            score += 8;
            factors.push('新陣営過小評価');
        }
        
        // 市場心理的要因
        const psychologicalScore = this.analyzeMarketPsychology(horse, allHorses);
        score += psychologicalScore;
        if (psychologicalScore > 5) factors.push('市場心理的要因');
        
        return {
            score: Math.min(100, Math.max(0, score)),
            factors: factors,
            details: {
                expectedOdds: expectedOdds.toFixed(1),
                actualOdds: actualOdds.toFixed(1),
                mispricing: oddsGap.toFixed(2),
                marketSentiment: this.analyzeMarketSentiment(horse, allHorses)
            }
        };
    }
    
    /**
     * 騎手・調教師要因分析
     * @param {Object} horse - 馬データ
     * @param {Object} raceConditions - レース条件
     * @returns {Object} 騎手・調教師分析結果
     */
    static analyzeJockeyTrainerFactor(horse, raceConditions) {
        let score = 50;
        const factors = [];
        
        // 騎手穴馬実績
        if (horse.jockey) {
            const jockeyUnderdogScore = this.evaluateJockeyUnderdogAbility(horse.jockey);
            score += jockeyUnderdogScore;
            if (jockeyUnderdogScore > 5) factors.push('騎手穴馬実績');
        }
        
        // 調教師穴馬実績
        if (horse.trainer) {
            const trainerUnderdogScore = this.evaluateTrainerUnderdogAbility(horse.trainer);
            score += trainerUnderdogScore;
            if (trainerUnderdogScore > 5) factors.push('調教師穴馬実績');
        }
        
        // 騎手乗り替わり効果
        if (horse.jockeyChange) {
            const changeScore = this.evaluateJockeyChangeEffect(horse);
            score += changeScore;
            if (changeScore > 0) factors.push('騎手乗り替わりプラス');
        }
        
        // コンビ実績
        if (horse.jockey && horse.trainer) {
            const combiScore = this.evaluateJockeyTrainerCombi(horse.jockey, horse.trainer);
            score += combiScore;
            if (combiScore > 5) factors.push('コンビ実績良好');
        }
        
        // 所属厩舎の調子
        const stableFormScore = this.evaluateStableForm(horse.trainer);
        score += stableFormScore;
        if (stableFormScore > 5) factors.push('厩舎好調');
        
        return {
            score: Math.min(100, Math.max(0, score)),
            factors: factors,
            details: {
                jockeyRating: this.calculateJockeyRating(horse.jockey),
                trainerRating: this.calculateTrainerRating(horse.trainer),
                connectionStrength: this.calculateConnectionStrength(horse)
            }
        };
    }
    
    /**
     * 総合信頼度計算
     * @param {Object} scores - 各要因スコア
     * @returns {number} 総合信頼度（0-1）
     */
    static calculateOverallConfidence(scores) {
        const weights = this.discoveryConfig.discoveryWeights;
        
        const weightedScore = 
            (scores.pedigree || 0) * weights.pedigreeFactors +
            (scores.form || 0) * weights.formFactors +
            (scores.raceConditions || 0) * weights.raceConditions +
            (scores.marketInefficiency || 0) * weights.marketInefficiency +
            (scores.jockeyTrainer || 0) * weights.jockeyTrainer;
        
        // 0-100のスコアを0-1の信頼度に変換
        return Math.min(1.0, Math.max(0.0, weightedScore / 100));
    }
    
    /**
     * 穴馬推奨度計算
     * @param {Object} analysis - 分析結果
     * @returns {Object} 推奨度評価
     */
    static calculateUnderdogRecommendation(analysis) {
        const confidence = analysis.confidence;
        const odds = analysis.horse.odds;
        const thresholds = this.discoveryConfig.confidenceThresholds;
        
        let recommendationLevel, reasoning, expectedROI;
        
        if (confidence >= thresholds.high) {
            recommendationLevel = 'STRONG_BUY';
            reasoning = '高信頼度の穴馬候補。積極的投資を推奨。';
            expectedROI = (odds * confidence - 1) * 100;
        } else if (confidence >= thresholds.medium) {
            recommendationLevel = 'BUY';
            reasoning = '中信頼度の穴馬候補。適度な投資を推奨。';
            expectedROI = (odds * confidence - 1) * 80;
        } else if (confidence >= thresholds.low) {
            recommendationLevel = 'HOLD';
            reasoning = '低信頼度だが穴馬の可能性あり。少額投資を検討。';
            expectedROI = (odds * confidence - 1) * 60;
        } else {
            recommendationLevel = 'AVOID';
            reasoning = '信頼度が不足。投資を控えることを推奨。';
            expectedROI = -20;
        }
        
        return {
            level: recommendationLevel,
            reasoning: reasoning,
            expectedROI: Math.round(expectedROI),
            investmentAdvice: this.generateInvestmentAdvice(analysis),
            riskLevel: this.calculateRiskLevel(odds, confidence)
        };
    }
    
    /**
     * 確信度による穴馬順位付け
     * @param {Array} analysisResults - 分析結果配列
     * @returns {Array} 確信度順穴馬リスト
     */
    static rankUnderdogsByConfidence(analysisResults) {
        return analysisResults
            .filter(analysis => analysis.confidence >= this.discoveryConfig.confidenceThresholds.low)
            .sort((a, b) => {
                // 1. 信頼度で並び替え
                if (b.confidence !== a.confidence) {
                    return b.confidence - a.confidence;
                }
                // 2. 期待ROIで並び替え
                return b.underdogRecommendation.expectedROI - a.underdogRecommendation.expectedROI;
            });
    }
    
    /**
     * 投資効率システムとの統合評価
     * @param {Array} rankedUnderdogs - 順位付け済み穴馬
     * @returns {Array} 投資効率統合後の最終推奨
     */
    static integrateWithInvestmentEfficiency(rankedUnderdogs) {
        if (typeof InvestmentEfficiencyCalculator === 'undefined') {
            console.warn('InvestmentEfficiencyCalculator が利用できません');
            return rankedUnderdogs;
        }
        
        return rankedUnderdogs.map(analysis => {
            const horse = analysis.horse;
            const betData = {
                odds: horse.odds,
                winProbability: analysis.confidence,
                betAmount: 1000, // デフォルト賭け金
                confidence: analysis.confidence,
                popularity: analysis.baseInfo.popularity
            };
            
            // 投資効率計算
            const efficiencyResult = InvestmentEfficiencyCalculator.calculateSingleBetEfficiency(betData);
            
            // 統合評価
            analysis.investmentEfficiency = efficiencyResult;
            analysis.finalRating = this.calculateFinalRating(analysis, efficiencyResult);
            
            return analysis;
        }).sort((a, b) => b.finalRating - a.finalRating);
    }
    
    /**
     * 最終評価計算
     * @param {Object} underdogAnalysis - 穴馬分析
     * @param {Object} efficiencyResult - 投資効率結果
     * @returns {number} 最終評価スコア
     */
    static calculateFinalRating(underdogAnalysis, efficiencyResult) {
        const underdogScore = underdogAnalysis.confidence * 100;
        const efficiencyScore = efficiencyResult.efficiencyScore;
        const expectedROI = efficiencyResult.theoreticalROI;
        
        // 穴馬分析50%、投資効率30%、期待ROI20%の重み付け
        return (underdogScore * 0.5) + (efficiencyScore * 0.3) + (Math.max(0, expectedROI) * 0.2);
    }
    
    /**
     * 穴馬発見レポート生成
     * @param {Array} finalRecommendations - 最終推奨リスト
     * @param {Object} raceConditions - レース条件
     * @returns {Object} 発見レポート
     */
    static generateDiscoveryReport(finalRecommendations, raceConditions) {
        const topUnderdogs = finalRecommendations.slice(0, 3); // 上位3頭
        
        return {
            summary: {
                totalCandidates: finalRecommendations.length,
                highConfidenceCandidates: finalRecommendations.filter(u => u.confidence >= 0.7).length,
                averageOdds: this.calculateAverageOdds(finalRecommendations),
                expectedTotalROI: this.calculateExpectedTotalROI(finalRecommendations),
                recommendedInvestmentLevel: this.determineInvestmentLevel(finalRecommendations)
            },
            underdogs: topUnderdogs,
            marketAnalysis: {
                marketInefficiencyLevel: this.calculateMarketInefficiencyLevel(finalRecommendations),
                opportunityRating: this.calculateOpportunityRating(finalRecommendations),
                riskAssessment: this.assessOverallRisk(finalRecommendations)
            },
            strategy: {
                recommendedApproach: this.recommendStrategy(finalRecommendations),
                portfolioAdvice: this.generatePortfolioAdvice(finalRecommendations),
                timingAdvice: this.generateTimingAdvice(raceConditions)
            },
            metadata: {
                analysisTimestamp: new Date().toISOString(),
                algorithmVersion: '1.0',
                confidenceLevel: this.calculateOverallConfidenceLevel(finalRecommendations)
            }
        };
    }
    
    // ヘルパー関数群（スペースの関係で主要なもののみ実装）
    static estimatePopularityFromOdds(odds) {
        if (odds < 2.0) return 1;
        if (odds < 3.0) return 2;
        if (odds < 5.0) return 3;
        if (odds < 7.0) return 4;
        if (odds < 10.0) return 6;
        if (odds < 15.0) return 8;
        if (odds < 25.0) return 11;
        return 15;
    }
    
    static categorizeUnderdogLevel(odds) {
        const thresholds = this.discoveryConfig.underdogThresholds;
        if (odds >= thresholds.extremeUnderdogOdds) return 'EXTREME';
        if (odds >= thresholds.bigUnderdogOdds) return 'BIG';
        if (odds >= thresholds.minOdds) return 'MEDIUM';
        return 'MINOR';
    }
    
    static isUnderdogAptPedigree(pedigreeData) {
        // 簡易実装：実際には血統データベースとの詳細照合が必要
        return pedigreeData.underdogAptitude && pedigreeData.underdogAptitude > 0.6;
    }
    
    static evaluateTrainingData(trainingData) {
        // 簡易実装：調教データの評価
        if (!trainingData) return 0;
        
        let score = 0;
        if (trainingData.intensity === 'strong') score += 10;
        if (trainingData.time && trainingData.time < trainingData.standard) score += 8;
        if (trainingData.condition === 'good') score += 5;
        
        return score;
    }
    
    static calculateExpectedOdds(horse, allHorses, raceConditions) {
        // 簡易実装：馬の実力を基にした期待オッズ計算
        const baseRating = horse.rating || 50;
        const avgRating = allHorses.reduce((sum, h) => sum + (h.rating || 50), 0) / allHorses.length;
        
        const relativeStrength = baseRating / avgRating;
        return Math.max(1.1, Math.min(100, 1 / relativeStrength));
    }
    
    static calculateAverageOdds(recommendations) {
        if (recommendations.length === 0) return 0;
        return recommendations.reduce((sum, r) => sum + r.horse.odds, 0) / recommendations.length;
    }
    
    static calculateExpectedTotalROI(recommendations) {
        return recommendations.reduce((sum, r) => sum + (r.underdogRecommendation?.expectedROI || 0), 0);
    }
    
    // データ永続化・学習機能
    static recordUnderdogResult(underdogPrediction, actualResult) {
        // 穴馬予測結果の記録と学習
        const success = actualResult.isWin || actualResult.isPlace;
        const key = this.generateSuccessPatternKey(underdogPrediction);
        
        if (!this.underdogDatabase.successPatterns.has(key)) {
            this.underdogDatabase.successPatterns.set(key, { total: 0, success: 0 });
        }
        
        const pattern = this.underdogDatabase.successPatterns.get(key);
        pattern.total++;
        if (success) pattern.success++;
        pattern.successRate = pattern.success / pattern.total;
        
        console.log(`穴馬結果記録: ${key} - 成功率: ${(pattern.successRate * 100).toFixed(1)}%`);
    }
    
    static generateSuccessPatternKey(underdogPrediction) {
        const horse = underdogPrediction.horse;
        return `${horse.sire || 'unknown'}_${underdogPrediction.baseInfo.underdogCategory}_${underdogPrediction.underdogRecommendation.level}`;
    }
    
    // 外部アクセス用メソッド
    static getUnderdogDatabase() {
        return this.underdogDatabase;
    }
    
    static updateDiscoveryConfig(newConfig) {
        this.discoveryConfig = { ...this.discoveryConfig, ...newConfig };
        console.log('穴馬発見設定を更新:', this.discoveryConfig);
    }
}

// グローバル公開
window.UnderdogDiscoveryAlgorithm = UnderdogDiscoveryAlgorithm;