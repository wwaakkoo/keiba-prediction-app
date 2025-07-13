// 買い目フィルタリングシステム - Phase 2
class BettingFilter {
    
    /**
     * オッズから人気層を判定するヘルパー関数
     */
    static determinePopularityFromOdds(odds) {
        if (odds <= 3.0) return 'favorite';     // 1-3倍は人気馬
        if (odds <= 7.0) return 'midrange';     // 4-7倍は中人気
        return 'outsider';                      // 8倍以上は人気薄
    }
    static CONFIG = {
        // 人気層×スコアフィルター設定
        POPULARITY_SCORE_FILTER: {
            favorite: {
                minScore: 90,           // 人気馬は90%以上必要
                maxBetRatio: 0.2,       // 最大投資割合20%
                description: '人気馬は厳選'
            },
            midrange: {
                minScore: 70,           // 中人気は70%以上推奨
                maxBetRatio: 0.5,       // 最大投資割合50%
                description: '中人気がメインターゲット'
            },
            outsider: {
                minScore: 50,           // 穴馬は50%以上で補助
                maxBetRatio: 0.3,       // 最大投資割合30%
                description: '穴馬は補助的活用'
            }
        },
        
        // 期待値閾値フィルター
        EXPECTED_VALUE_FILTER: {
            EXCELLENT: 1.3,     // 積極的推奨
            GOOD: 1.1,          // 条件付推奨
            ACCEPTABLE: 1.0,    // 最低ライン
            SKIP: 0.9           // 見送り
        },
        
        // 馬券種別適性判定
        BET_TYPE_SUITABILITY: {
            place: {
                minProbability: 0.3,        // 複勝最低確率30%
                maxOdds: 300,               // 最大オッズ300円
                description: '安定的な複勝狙い'
            },
            wide: {
                minProbability: 0.2,        // ワイド最低確率20%
                maxOdds: 800,               // 最大オッズ800円
                minCombinationValue: 1.2,   // 組み合わせ最低期待値
                description: '効率的なワイド狙い'
            },
            exacta: {
                minProbability: 0.1,        // 馬連最低確率10%
                maxOdds: 2000,              // 最大オッズ2000円
                description: '高配当馬連狙い'
            }
        },
        
        // 複数条件組み合わせ重み
        COMBINATION_WEIGHTS: {
            expectedValue: 0.4,     // 期待値の重み
            scoreFilter: 0.3,       // スコアフィルターの重み
            popularityFilter: 0.2,  // 人気フィルターの重み
            confidence: 0.1         // 信頼度の重み
        }
    };
    
    /**
     * 馬の買い目適性を総合評価
     * @param {Object} horse - 馬データ
     * @param {Object} expectedValueAnalysis - 期待値分析結果
     * @returns {Object} フィルタリング結果
     */
    static evaluateHorseSuitability(horse, expectedValueAnalysis) {
        const evaluation = {
            horse: horse,
            expectedValueAnalysis: expectedValueAnalysis,
            filters: {
                popularityScoreFilter: this.applyPopularityScoreFilter(horse, expectedValueAnalysis),
                expectedValueFilter: this.applyExpectedValueFilter(expectedValueAnalysis),
                betTypeSuitability: this.evaluateBetTypeSuitability(horse, expectedValueAnalysis)
            },
            overallScore: 0,
            recommendation: 'skip',
            reason: [],
            suitableBetTypes: []
        };
        
        // 総合スコア計算
        evaluation.overallScore = this.calculateOverallScore(evaluation);
        
        // 最終推奨判定
        evaluation.recommendation = this.determineRecommendation(evaluation);
        
        // 推奨理由の生成
        evaluation.reason = this.generateReasonExplanation(evaluation);
        
        // 適性のある馬券種を特定
        evaluation.suitableBetTypes = this.identifySuitableBetTypes(evaluation);
        
        return evaluation;
    }
    
    /**
     * 人気層×スコアフィルターを適用
     * @param {Object} horse - 馬データ
     * @param {Object} expectedValueAnalysis - 期待値分析結果
     * @returns {Object} フィルター結果
     */
    static applyPopularityScoreFilter(horse, expectedValueAnalysis) {
        // 安全なpopularityアクセス
        const popularity = expectedValueAnalysis?.popularity || 
                          horse?.popularity || 
                          this.determinePopularityFromOdds(horse?.odds || 5.0);
        
        const score = horse.placeProbability || horse.score || 0;
        const config = this.CONFIG.POPULARITY_SCORE_FILTER[popularity];
        
        if (!config) {
            console.warn('人気層判定エラー:', { popularity, horse, expectedValueAnalysis });
            return { passed: false, reason: `人気層判定エラー: ${popularity}` };
        }
        
        const passed = score >= config.minScore;
        
        return {
            passed: passed,
            popularity: popularity,
            score: score,
            minScore: config.minScore,
            maxBetRatio: config.maxBetRatio,
            reason: passed ? 
                `${config.description}：スコア${score}%が基準${config.minScore}%をクリア` :
                `${config.description}：スコア${score}%が基準${config.minScore}%未満`
        };
    }
    
    /**
     * 期待値フィルターを適用
     * @param {Object} expectedValueAnalysis - 期待値分析結果
     * @returns {Object} フィルター結果
     */
    static applyExpectedValueFilter(expectedValueAnalysis) {
        const ev = expectedValueAnalysis?.expectedValue || 0;
        const config = this.CONFIG.EXPECTED_VALUE_FILTER;
        
        let level = 'skip';
        let reason = '';
        
        if (ev >= config.EXCELLENT) {
            level = 'excellent';
            reason = `期待値${ev.toFixed(2)}：積極的推奨レベル`;
        } else if (ev >= config.GOOD) {
            level = 'good';
            reason = `期待値${ev.toFixed(2)}：条件付推奨レベル`;
        } else if (ev >= config.ACCEPTABLE) {
            level = 'acceptable';
            reason = `期待値${ev.toFixed(2)}：最低ラインクリア`;
        } else {
            level = 'skip';
            reason = `期待値${ev.toFixed(2)}：推奨基準未満`;
        }
        
        return {
            passed: level !== 'skip',
            level: level,
            expectedValue: ev,
            reason: reason
        };
    }
    
    /**
     * 馬券種別適性を評価
     * @param {Object} horse - 馬データ
     * @param {Object} expectedValueAnalysis - 期待値分析結果
     * @returns {Object} 適性評価結果
     */
    static evaluateBetTypeSuitability(horse, expectedValueAnalysis) {
        const suitability = {
            place: this.evaluatePlaceSuitability(horse, expectedValueAnalysis),
            wide: this.evaluateWideSuitability(horse, expectedValueAnalysis),
            exacta: this.evaluateExactaSuitability(horse, expectedValueAnalysis)
        };
        
        return suitability;
    }
    
    /**
     * 複勝適性を評価
     * @param {Object} horse - 馬データ
     * @param {Object} expectedValueAnalysis - 期待値分析結果
     * @returns {Object} 複勝適性結果
     */
    static evaluatePlaceSuitability(horse, expectedValueAnalysis) {
        const config = this.CONFIG.BET_TYPE_SUITABILITY.place;
        const probability = expectedValueAnalysis.estimatedProbability;
        const odds = expectedValueAnalysis.estimatedOdds;
        
        const suitable = probability >= config.minProbability && odds <= config.maxOdds;
        
        return {
            suitable: suitable,
            probability: probability,
            odds: odds,
            reason: suitable ? 
                `複勝適性良好：確率${(probability * 100).toFixed(1)}%、推定配当${odds.toFixed(0)}円` :
                `複勝適性不良：確率${(probability * 100).toFixed(1)}%、推定配当${odds.toFixed(0)}円`
        };
    }
    
    /**
     * ワイド適性を評価
     * @param {Object} horse - 馬データ
     * @param {Object} expectedValueAnalysis - 期待値分析結果
     * @returns {Object} ワイド適性結果
     */
    static evaluateWideSuitability(horse, expectedValueAnalysis) {
        const config = this.CONFIG.BET_TYPE_SUITABILITY.wide;
        const probability = expectedValueAnalysis.estimatedProbability;
        const odds = expectedValueAnalysis.estimatedOdds * 0.7; // ワイドは複勝より低め
        
        const suitable = probability >= config.minProbability && odds <= config.maxOdds;
        
        return {
            suitable: suitable,
            probability: probability,
            odds: odds,
            reason: suitable ? 
                `ワイド適性良好：確率${(probability * 100).toFixed(1)}%、推定配当${odds.toFixed(0)}円` :
                `ワイド適性不良：確率${(probability * 100).toFixed(1)}%、推定配当${odds.toFixed(0)}円`
        };
    }
    
    /**
     * 馬連適性を評価
     * @param {Object} horse - 馬データ
     * @param {Object} expectedValueAnalysis - 期待値分析結果
     * @returns {Object} 馬連適性結果
     */
    static evaluateExactaSuitability(horse, expectedValueAnalysis) {
        const config = this.CONFIG.BET_TYPE_SUITABILITY.exacta;
        const probability = expectedValueAnalysis.estimatedProbability * 0.5; // 馬連は複勝より厳しく
        const odds = expectedValueAnalysis.estimatedOdds * 1.5; // 馬連は複勝より高め
        
        const suitable = probability >= config.minProbability && odds <= config.maxOdds;
        
        return {
            suitable: suitable,
            probability: probability,
            odds: odds,
            reason: suitable ? 
                `馬連適性良好：確率${(probability * 100).toFixed(1)}%、推定配当${odds.toFixed(0)}円` :
                `馬連適性不良：確率${(probability * 100).toFixed(1)}%、推定配当${odds.toFixed(0)}円`
        };
    }
    
    /**
     * 総合スコアを計算
     * @param {Object} evaluation - 評価結果
     * @returns {number} 総合スコア
     */
    static calculateOverallScore(evaluation) {
        const weights = this.CONFIG.COMBINATION_WEIGHTS;
        let score = 0;
        
        // 期待値スコア
        const evFilter = evaluation.filters.expectedValueFilter;
        let evScore = 0;
        if (evFilter.level === 'excellent') evScore = 1.0;
        else if (evFilter.level === 'good') evScore = 0.7;
        else if (evFilter.level === 'acceptable') evScore = 0.4;
        else evScore = 0.0;
        
        score += evScore * weights.expectedValue;
        
        // スコアフィルタースコア
        const scoreFilter = evaluation.filters.popularityScoreFilter;
        const scoreFilterScore = scoreFilter.passed ? 1.0 : 0.0;
        score += scoreFilterScore * weights.scoreFilter;
        
        // 人気フィルタースコア（中人気を優遇）
        let popularityScore = 0;
        if (scoreFilter.popularity === 'midrange') popularityScore = 1.0;
        else if (scoreFilter.popularity === 'outsider') popularityScore = 0.6;
        else if (scoreFilter.popularity === 'favorite') popularityScore = 0.4;
        
        score += popularityScore * weights.popularityFilter;
        
        // 信頼度スコア
        const confidence = evaluation.expectedValueAnalysis.confidence || 0;
        score += confidence * weights.confidence;
        
        return Math.max(0, Math.min(1, score));
    }
    
    /**
     * 最終推奨を判定
     * @param {Object} evaluation - 評価結果
     * @returns {string} 推奨レベル
     */
    static determineRecommendation(evaluation) {
        const overallScore = evaluation.overallScore;
        const filters = evaluation.filters;
        
        // 必須フィルターをパスしていない場合は見送り
        if (!filters.expectedValueFilter.passed || !filters.popularityScoreFilter.passed) {
            return 'skip';
        }
        
        // 総合スコアによる判定
        if (overallScore >= 0.8) return 'excellent';
        if (overallScore >= 0.6) return 'good';
        if (overallScore >= 0.4) return 'acceptable';
        return 'skip';
    }
    
    /**
     * 推奨理由を生成
     * @param {Object} evaluation - 評価結果
     * @returns {Array} 理由リスト
     */
    static generateReasonExplanation(evaluation) {
        const reasons = [];
        const filters = evaluation.filters;
        
        // 期待値フィルターの理由
        reasons.push(filters.expectedValueFilter.reason);
        
        // 人気×スコアフィルターの理由
        reasons.push(filters.popularityScoreFilter.reason);
        
        // 適性のある馬券種の理由
        Object.entries(filters.betTypeSuitability).forEach(([betType, suitability]) => {
            if (suitability.suitable) {
                reasons.push(suitability.reason);
            }
        });
        
        return reasons;
    }
    
    /**
     * 適性のある馬券種を特定
     * @param {Object} evaluation - 評価結果
     * @returns {Array} 適性馬券種リスト
     */
    static identifySuitableBetTypes(evaluation) {
        const suitableBetTypes = [];
        const suitability = evaluation.filters.betTypeSuitability;
        
        if (suitability.place.suitable) {
            suitableBetTypes.push({
                type: 'place',
                priority: 1,
                reason: suitability.place.reason
            });
        }
        
        if (suitability.wide.suitable) {
            suitableBetTypes.push({
                type: 'wide',
                priority: 2,
                reason: suitability.wide.reason
            });
        }
        
        if (suitability.exacta.suitable) {
            suitableBetTypes.push({
                type: 'exacta',
                priority: 3,
                reason: suitability.exacta.reason
            });
        }
        
        return suitableBetTypes.sort((a, b) => a.priority - b.priority);
    }
    
    /**
     * レース全体の買い目フィルタリング
     * @param {Array} horses - 全馬データ
     * @param {Array} expectedValueAnalyses - 期待値分析結果
     * @returns {Object} フィルタリング結果
     */
    static filterRaceBetting(horses, expectedValueAnalyses) {
        console.log('🎯 フィルタリング開始', { 
            horsesCount: horses.length, 
            analysesCount: expectedValueAnalyses?.length || 0,
            horsesNames: horses.map(h => h.name || 'unnamed'),
            analysesStructure: expectedValueAnalyses?.slice(0, 2) || 'undefined'
        });
        
        const filteredResults = {
            totalHorses: horses.length,
            evaluations: [],
            summary: {
                excellent: [],
                good: [],
                acceptable: [],
                skip: []
            },
            recommendedBets: [],
            raceRecommendation: 'skip'
        };
        
        // 各馬を評価
        horses.forEach((horse, index) => {
            const expectedValueAnalysis = expectedValueAnalyses?.[index] || {};
            const evaluation = this.evaluateHorseSuitability(horse, expectedValueAnalysis);
            
            filteredResults.evaluations.push(evaluation);
            filteredResults.summary[evaluation.recommendation].push(evaluation);
        });
        
        // 推奨買い目を生成
        filteredResults.recommendedBets = this.generateFilteredBettingRecommendations(filteredResults);
        
        // レース推奨を決定
        filteredResults.raceRecommendation = this.determineRaceRecommendation(filteredResults);
        
        return filteredResults;
    }
    
    /**
     * フィルタリング済み買い目推奨を生成
     * @param {Object} filteredResults - フィルタリング結果
     * @returns {Array} 買い目推奨リスト
     */
    static generateFilteredBettingRecommendations(filteredResults) {
        const recommendations = [];
        const summary = filteredResults.summary;
        
        // 優良馬の複勝推奨
        summary.excellent.forEach(evaluation => {
            const maxBetRatio = evaluation.filters.popularityScoreFilter.maxBetRatio;
            const baseAmount = 1000 * maxBetRatio;
            
            recommendations.push({
                type: 'place',
                horse: evaluation.horse,
                evaluation: evaluation,
                amount: Math.max(100, Math.floor(baseAmount)),
                priority: 1,
                reason: `フィルタリング済み優良馬券：${evaluation.reason.join(', ')}`
            });
        });
        
        // 良好馬の条件付推奨
        summary.good.forEach(evaluation => {
            const maxBetRatio = evaluation.filters.popularityScoreFilter.maxBetRatio;
            const baseAmount = 1000 * maxBetRatio * 0.7; // 優良馬より控えめ
            
            recommendations.push({
                type: 'place',
                horse: evaluation.horse,
                evaluation: evaluation,
                amount: Math.max(100, Math.floor(baseAmount)),
                priority: 2,
                reason: `フィルタリング済み良好馬券：${evaluation.reason.join(', ')}`
            });
        });
        
        // ワイド組み合わせ推奨
        if (summary.excellent.length >= 2) {
            const topTwo = summary.excellent.slice(0, 2);
            recommendations.push({
                type: 'wide',
                horses: topTwo.map(e => e.horse),
                evaluations: topTwo,
                amount: 200,
                priority: 3,
                reason: `フィルタリング済み優良馬ワイド組み合わせ`
            });
        }
        
        return recommendations.sort((a, b) => a.priority - b.priority);
    }
    
    /**
     * レース推奨を決定
     * @param {Object} filteredResults - フィルタリング結果
     * @returns {string} レース推奨レベル
     */
    static determineRaceRecommendation(filteredResults) {
        const summary = filteredResults.summary;
        
        if (summary.excellent.length >= 2) return 'excellent';
        if (summary.excellent.length >= 1) return 'good';
        if (summary.good.length >= 2) return 'acceptable';
        if (summary.good.length >= 1) return 'marginal';
        return 'skip';
    }
    
    /**
     * フィルタリング結果を表示
     * @param {Object} filteredResults - フィルタリング結果
     */
    static displayFilteredResults(filteredResults) {
        const container = document.getElementById('bettingFilterResults') || this.createFilterContainer();
        
        let html = `
            <div style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 15px 0; text-align: center;">🔍 買い目フィルタリング結果</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; text-align: center;">
                    <div>
                        <div style="font-size: 1.5em; font-weight: bold;">${filteredResults.summary.excellent.length}</div>
                        <div>優良馬券</div>
                    </div>
                    <div>
                        <div style="font-size: 1.5em; font-weight: bold;">${filteredResults.summary.good.length}</div>
                        <div>良好馬券</div>
                    </div>
                    <div>
                        <div style="font-size: 1.5em; font-weight: bold;">${filteredResults.summary.acceptable.length}</div>
                        <div>許容馬券</div>
                    </div>
                    <div>
                        <div style="font-size: 1.5em; font-weight: bold;">${this.getRaceRecommendationDisplay(filteredResults.raceRecommendation)}</div>
                        <div>レース推奨</div>
                    </div>
                </div>
            </div>
        `;
        
        // 推奨買い目の表示
        if (filteredResults.recommendedBets.length > 0) {
            html += `<div style="background: white; border-radius: 10px; padding: 15px; margin-bottom: 15px;">`;
            html += `<h4>📋 フィルタリング済み買い目推奨</h4>`;
            
            filteredResults.recommendedBets.forEach(bet => {
                html += `
                    <div style="border: 1px solid #ddd; border-radius: 8px; padding: 12px; margin: 10px 0;">
                        <div style="font-weight: bold;">${bet.type === 'place' ? '複勝' : bet.type === 'wide' ? 'ワイド' : bet.type}</div>
                        <div>${bet.horses ? bet.horses.map(h => h.name).join(' × ') : bet.horse.name}</div>
                        <div>投資額: ${bet.amount}円</div>
                        <div style="font-size: 0.9em; color: #666;">${bet.reason}</div>
                    </div>
                `;
            });
            
            html += `</div>`;
        } else {
            html += `
                <div style="background: #ffebee; color: #c62828; padding: 15px; border-radius: 8px; text-align: center;">
                    <strong>🔍 フィルタリング結果：見送り推奨</strong><br>
                    <small>条件をクリアする馬券が見つかりませんでした</small>
                </div>
            `;
        }
        
        container.innerHTML = html;
    }
    
    /**
     * フィルター表示用コンテナ作成
     */
    static createFilterContainer() {
        const container = document.createElement('div');
        container.id = 'bettingFilterResults';
        container.style.marginTop = '20px';
        
        // 期待値分析の後に挿入
        const evSection = document.getElementById('expectedValueBettingRecommendations');
        if (evSection) {
            evSection.parentNode.insertBefore(container, evSection.nextSibling);
        } else {
            document.body.appendChild(container);
        }
        
        return container;
    }
    
    /**
     * レース推奨表示文字取得
     */
    static getRaceRecommendationDisplay(raceRecommendation) {
        switch (raceRecommendation) {
            case 'excellent': return '🚀 参戦';
            case 'good': return '✅ 推奨';
            case 'acceptable': return '⚠️ 条件付';
            case 'marginal': return '🤔 微妙';
            case 'skip': return '❌ 見送り';
            default: return '❓ 不明';
        }
    }
}

// グローバル変数として公開
window.BettingFilter = BettingFilter;