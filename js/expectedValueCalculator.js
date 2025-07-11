// 期待値ベース買い目システム - 期待値計算エンジン
class ExpectedValueCalculator {
    static CONFIG = {
        // 期待値閾値
        EXCELLENT_THRESHOLD: 1.5,     // 優良馬券（積極的購入）
        GOOD_THRESHOLD: 1.3,          // 良好馬券（推奨購入）
        ACCEPTABLE_THRESHOLD: 1.1,    // 許容馬券（条件付購入）
        BREAK_EVEN_THRESHOLD: 1.0,    // 損益分岐点
        
        // 人気層別オッズ係数（複勝想定）- より現実的な値に修正
        POPULARITY_ODDS_FACTOR: {
            favorite: 0.25,     // 1-3番人気の複勝オッズ係数（低く修正）
            midrange: 0.35,     // 4-6番人気の複勝オッズ係数（低く修正）
            outsider: 0.45      // 7番人気以下の複勝オッズ係数（低く修正）
        },
        
        // スコア→確率変換パラメータ（キャリブレーション用）
        SCORE_CALIBRATION: {
            // 複勝確率変換係数（現実的な値に修正）
            PLACE_BASE: 0.4,        // 基本係数を大幅に下げる
            PLACE_ADJUSTMENT: 0.1,  // 調整幅を縮小
            
            // 単勝確率変換係数
            WIN_BASE: 0.15,         // 基本係数を大幅に下げる
            WIN_ADJUSTMENT: 0.05,   // 調整幅を縮小
            
            // 人気補正係数（より現実的に）
            POPULARITY_CORRECTION: {
                favorite: 1.3,      // 人気馬は予想より的中率がかなり高い
                midrange: 1.0,      // 中人気は予想通り
                outsider: 0.6       // 穴馬は予想より的中率がかなり低い
            }
        }
    };
    
    /**
     * 馬の期待値を計算
     * @param {Object} horse - 馬データ
     * @param {string} betType - 馬券種別 ('place', 'win', 'wide')
     * @returns {Object} 期待値分析結果
     */
    static calculateHorseExpectedValue(horse, betType = 'place') {
        const analysis = {
            horse: horse,
            betType: betType,
            popularity: this.determinePopularity(horse.odds),
            estimatedProbability: 0,
            estimatedOdds: 0,
            expectedValue: 0,
            recommendation: 'skip',
            confidence: 0,
            realisticExpectedValue: 0  // 現実的な期待値
        };
        
        // 人気層判定
        analysis.popularity = this.determinePopularity(horse.odds);
        
        // スコア→確率変換
        analysis.estimatedProbability = this.convertScoreToProbability(
            horse.placeProbability || horse.score || 0, 
            betType, 
            analysis.popularity
        );
        
        // 推定オッズ計算
        analysis.estimatedOdds = this.estimateOdds(horse.odds, betType, analysis.popularity);
        
        // 基本期待値計算
        analysis.expectedValue = analysis.estimatedProbability * (analysis.estimatedOdds / 100);
        
        // 現実的な期待値計算（オッズと確率の逆相関を考慮）
        analysis.realisticExpectedValue = this.calculateRealisticExpectedValue(
            horse, analysis.estimatedProbability, analysis.estimatedOdds, betType
        );
        
        // 推奨判定（現実的な期待値を使用）
        analysis.recommendation = this.determineRecommendation(analysis.realisticExpectedValue);
        
        // 信頼度計算
        analysis.confidence = this.calculateConfidence(horse, analysis);
        
        return analysis;
    }
    
    /**
     * 現実的な期待値計算（オッズと確率の逆相関を考慮）
     * @param {Object} horse - 馬データ
     * @param {number} estimatedProbability - 推定的中確率
     * @param {number} estimatedOdds - 推定オッズ
     * @param {string} betType - 馬券種別
     * @returns {number} 現実的な期待値
     */
    static calculateRealisticExpectedValue(horse, estimatedProbability, estimatedOdds, betType) {
        // オッズから逆算した市場確率
        const marketProbability = 100 / (horse.odds * 100); // 単勝オッズから市場確率を計算
        
        // 複勝の場合、市場確率を調整
        let adjustedMarketProbability = marketProbability;
        if (betType === 'place') {
            adjustedMarketProbability = Math.min(0.6, marketProbability * 2.5); // 複勝は単勝の2.5倍程度の確率
        }
        
        // 予想確率と市場確率の加重平均（市場確率を重視）
        const weightedProbability = (estimatedProbability * 0.3) + (adjustedMarketProbability * 0.7);
        
        // 現実的な期待値計算
        const realisticExpectedValue = weightedProbability * (estimatedOdds / 100);
        
        // さらに保守的な調整（胴元の優位性を考慮）
        return realisticExpectedValue * 0.85; // 15%の安全マージン
    }
    
    /**
     * 人気層判定
     * @param {number} odds - 単勝オッズ
     * @returns {string} 人気層 ('favorite', 'midrange', 'outsider')
     */
    static determinePopularity(odds) {
        if (odds <= 3.0) return 'favorite';
        if (odds <= 7.0) return 'midrange';
        return 'outsider';
    }
    
    /**
     * スコア→確率変換
     * @param {number} score - 予想スコア
     * @param {string} betType - 馬券種別
     * @param {string} popularity - 人気層
     * @returns {number} 的中確率
     */
    static convertScoreToProbability(score, betType, popularity) {
        if (score <= 0) return 0;
        
        let baseProbability = 0;
        const config = this.CONFIG.SCORE_CALIBRATION;
        
        // 馬券種別による基本確率計算
        switch (betType) {
            case 'place':
                baseProbability = Math.min(0.95, (score / 100) * config.PLACE_BASE + config.PLACE_ADJUSTMENT);
                break;
            case 'win':
                baseProbability = Math.min(0.80, (score / 100) * config.WIN_BASE + config.WIN_ADJUSTMENT);
                break;
            case 'wide':
                // ワイドは複勝ベースで計算
                baseProbability = Math.min(0.85, (score / 100) * config.PLACE_BASE + config.PLACE_ADJUSTMENT * 0.8);
                break;
            default:
                baseProbability = score / 100;
        }
        
        // 人気層補正
        const popularityCorrection = config.POPULARITY_CORRECTION[popularity] || 1.0;
        
        return Math.max(0.01, Math.min(0.99, baseProbability * popularityCorrection));
    }
    
    /**
     * 推定オッズ計算（より保守的な計算）
     * @param {number} winOdds - 単勝オッズ
     * @param {string} betType - 馬券種別
     * @param {string} popularity - 人気層
     * @returns {number} 推定オッズ
     */
    static estimateOdds(winOdds, betType, popularity) {
        const factor = this.CONFIG.POPULARITY_ODDS_FACTOR[popularity] || 0.35;
        
        switch (betType) {
            case 'place':
                // 複勝オッズは単勝オッズより必ず低い + 胴元の取り分を考慮
                const baseOdds = Math.max(100, winOdds * 100 * factor);
                // 胴元の取り分(20%)を考慮してさらに低く
                return Math.max(100, baseOdds * 0.8);
            case 'win':
                // 単勝も胴元の取り分を考慮
                return Math.max(100, winOdds * 100 * 0.8);
            case 'wide':
                // ワイドは複勝よりさらに低い
                const wideBase = Math.max(110, winOdds * 100 * factor * 0.6);
                return Math.max(110, wideBase * 0.8);
            default:
                return winOdds * 100 * 0.8;
        }
    }
    
    /**
     * 推奨判定
     * @param {number} expectedValue - 期待値
     * @returns {string} 推奨レベル
     */
    static determineRecommendation(expectedValue) {
        if (expectedValue >= this.CONFIG.EXCELLENT_THRESHOLD) return 'excellent';
        if (expectedValue >= this.CONFIG.GOOD_THRESHOLD) return 'good';
        if (expectedValue >= this.CONFIG.ACCEPTABLE_THRESHOLD) return 'acceptable';
        if (expectedValue >= this.CONFIG.BREAK_EVEN_THRESHOLD) return 'break_even';
        return 'skip';
    }
    
    /**
     * 信頼度計算
     * @param {Object} horse - 馬データ
     * @param {Object} analysis - 分析結果
     * @returns {number} 信頼度 (0-1)
     */
    static calculateConfidence(horse, analysis) {
        let confidence = 0.5; // 基本信頼度
        
        // スコアの高さによる信頼度
        const score = horse.placeProbability || horse.score || 0;
        if (score >= 80) confidence += 0.3;
        else if (score >= 60) confidence += 0.2;
        else if (score >= 40) confidence += 0.1;
        
        // 期待値の高さによる信頼度
        if (analysis.expectedValue >= 1.5) confidence += 0.2;
        else if (analysis.expectedValue >= 1.3) confidence += 0.1;
        
        // 人気層による信頼度調整
        switch (analysis.popularity) {
            case 'favorite':
                confidence += 0.1; // 人気馬は安定
                break;
            case 'midrange':
                confidence += 0.2; // 中人気が最も信頼できる
                break;
            case 'outsider':
                confidence -= 0.1; // 穴馬は不安定
                break;
        }
        
        return Math.max(0.1, Math.min(1.0, confidence));
    }
    
    /**
     * レース全体の期待値分析
     * @param {Array} horses - 全馬データ
     * @param {string} betType - 馬券種別
     * @returns {Object} レース分析結果
     */
    static analyzeRaceExpectedValue(horses, betType = 'place') {
        const raceAnalysis = {
            totalHorses: horses.length,
            analyzedHorses: [],
            summary: {
                excellent: [],
                good: [],
                acceptable: [],
                breakEven: [],
                skip: []
            },
            raceRecommendation: 'skip',
            bestHorse: null,
            totalExpectedValue: 0,
            averageExpectedValue: 0,
            participationAdvised: false
        };
        
        // 各馬の期待値分析
        horses.forEach(horse => {
            const analysis = this.calculateHorseExpectedValue(horse, betType);
            raceAnalysis.analyzedHorses.push(analysis);
            
            // 推奨レベル別分類
            raceAnalysis.summary[analysis.recommendation].push(analysis);
            
            // 最良馬の特定
            if (!raceAnalysis.bestHorse || analysis.expectedValue > raceAnalysis.bestHorse.expectedValue) {
                raceAnalysis.bestHorse = analysis;
            }
        });
        
        // 全体期待値計算
        raceAnalysis.totalExpectedValue = raceAnalysis.analyzedHorses
            .reduce((sum, analysis) => sum + analysis.expectedValue, 0);
        raceAnalysis.averageExpectedValue = raceAnalysis.totalExpectedValue / raceAnalysis.totalHorses;
        
        // レース推奨判定
        raceAnalysis.raceRecommendation = this.determineRaceRecommendation(raceAnalysis);
        raceAnalysis.participationAdvised = raceAnalysis.raceRecommendation !== 'skip';
        
        return raceAnalysis;
    }
    
    /**
     * レース推奨判定
     * @param {Object} raceAnalysis - レース分析結果
     * @returns {string} レース推奨レベル
     */
    static determineRaceRecommendation(raceAnalysis) {
        const summary = raceAnalysis.summary;
        
        // 優良馬が2頭以上
        if (summary.excellent.length >= 2) return 'excellent';
        
        // 優良馬が1頭、良好馬が1頭以上
        if (summary.excellent.length >= 1 && summary.good.length >= 1) return 'good';
        
        // 良好馬が2頭以上
        if (summary.good.length >= 2) return 'good';
        
        // 優良馬が1頭のみ
        if (summary.excellent.length >= 1) return 'acceptable';
        
        // 良好馬が1頭のみ
        if (summary.good.length >= 1) return 'acceptable';
        
        // 許容馬が2頭以上
        if (summary.acceptable.length >= 2) return 'marginal';
        
        return 'skip';
    }
    
    /**
     * 推奨買い目生成
     * @param {Object} raceAnalysis - レース分析結果
     * @param {number} budget - 予算
     * @returns {Array} 買い目推奨リスト
     */
    static generateBettingRecommendations(raceAnalysis, budget = 1000) {
        const recommendations = [];
        
        if (!raceAnalysis.participationAdvised) {
            return [{
                type: 'skip',
                reason: 'レース全体の期待値が低いため見送り推奨',
                expectedValue: raceAnalysis.averageExpectedValue,
                confidence: 0,
                detail: `平均期待値${raceAnalysis.averageExpectedValue.toFixed(2)}では長期的に損失が予想されます`
            }];
        }
        
        const summary = raceAnalysis.summary;
        let remainingBudget = budget;
        
        // 現実的な期待値を使用
        const sortedByRealisticValue = raceAnalysis.analyzedHorses
            .filter(analysis => analysis.realisticExpectedValue >= 1.0)
            .sort((a, b) => b.realisticExpectedValue - a.realisticExpectedValue);
        
        // 優良馬の複勝買い（期待値1.3以上）
        const excellentHorses = sortedByRealisticValue.filter(analysis => analysis.realisticExpectedValue >= 1.3);
        excellentHorses.forEach((analysis, index) => {
            if (index < 2) { // 最大2頭まで
                const betAmount = Math.floor(remainingBudget * 0.35);
                if (betAmount >= 100) {
                    recommendations.push({
                        type: 'place',
                        horse: analysis.horse,
                        amount: betAmount,
                        expectedValue: analysis.realisticExpectedValue,
                        confidence: analysis.confidence,
                        reason: `優良期待値馬券（期待値${analysis.realisticExpectedValue.toFixed(2)}）`,
                        popularity: analysis.popularity,
                        estimatedOdds: analysis.estimatedOdds
                    });
                    remainingBudget -= betAmount;
                }
            }
        });
        
        // 良好馬の複勝買い（期待値1.1以上）
        const goodHorses = sortedByRealisticValue.filter(analysis => 
            analysis.realisticExpectedValue >= 1.1 && analysis.realisticExpectedValue < 1.3
        );
        goodHorses.forEach((analysis, index) => {
            if (index < 1) { // 最大1頭まで
                const betAmount = Math.floor(remainingBudget * 0.25);
                if (betAmount >= 100) {
                    recommendations.push({
                        type: 'place',
                        horse: analysis.horse,
                        amount: betAmount,
                        expectedValue: analysis.realisticExpectedValue,
                        confidence: analysis.confidence,
                        reason: `良好期待値馬券（期待値${analysis.realisticExpectedValue.toFixed(2)}）`,
                        popularity: analysis.popularity,
                        estimatedOdds: analysis.estimatedOdds
                    });
                    remainingBudget -= betAmount;
                }
            }
        });
        
        // ワイド組み合わせ（上位2頭）
        if (excellentHorses.length >= 2) {
            const betAmount = Math.floor(remainingBudget * 0.4);
            if (betAmount >= 100) {
                const avgExpectedValue = (excellentHorses[0].realisticExpectedValue + excellentHorses[1].realisticExpectedValue) / 2;
                recommendations.push({
                    type: 'wide',
                    horses: [excellentHorses[0].horse, excellentHorses[1].horse],
                    amount: betAmount,
                    expectedValue: avgExpectedValue,
                    confidence: Math.min(excellentHorses[0].confidence, excellentHorses[1].confidence),
                    reason: `優良馬同士のワイド（期待値${avgExpectedValue.toFixed(2)}）`,
                    popularity: `${excellentHorses[0].popularity}×${excellentHorses[1].popularity}`
                });
                remainingBudget -= betAmount;
            }
        }
        
        // 推奨が全くない場合の処理
        if (recommendations.length === 0) {
            return [{
                type: 'skip',
                reason: '期待値1.0以上の馬券が見つかりません',
                expectedValue: raceAnalysis.averageExpectedValue,
                confidence: 0,
                detail: '全馬の期待値が1.0を下回るため、投資非推奨です'
            }];
        }
        
        return recommendations;
    }
    
    /**
     * 期待値分析結果の表示
     * @param {Object} raceAnalysis - レース分析結果
     */
    static displayExpectedValueAnalysis(raceAnalysis) {
        const container = document.getElementById('expectedValueAnalysis') || this.createAnalysisContainer();
        
        let html = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 15px 0; text-align: center;">📊 期待値分析システム</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; text-align: center;">
                    <div>
                        <div style="font-size: 1.5em; font-weight: bold;">${raceAnalysis.summary.excellent.length}</div>
                        <div>優良馬券</div>
                    </div>
                    <div>
                        <div style="font-size: 1.5em; font-weight: bold;">${raceAnalysis.summary.good.length}</div>
                        <div>良好馬券</div>
                    </div>
                    <div>
                        <div style="font-size: 1.5em; font-weight: bold;">${raceAnalysis.averageExpectedValue.toFixed(2)}</div>
                        <div>平均期待値</div>
                    </div>
                    <div>
                        <div style="font-size: 1.5em; font-weight: bold;">${this.getRaceRecommendationDisplay(raceAnalysis.raceRecommendation)}</div>
                        <div>レース推奨</div>
                    </div>
                </div>
            </div>
        `;
        
        // 馬別期待値テーブル
        html += `
            <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                            <th style="padding: 12px 8px; text-align: center;">馬番</th>
                            <th style="padding: 12px 8px; text-align: center;">馬名</th>
                            <th style="padding: 12px 8px; text-align: center;">人気</th>
                            <th style="padding: 12px 8px; text-align: center;">期待値</th>
                            <th style="padding: 12px 8px; text-align: center;">推定確率</th>
                            <th style="padding: 12px 8px; text-align: center;">推定配当</th>
                            <th style="padding: 12px 8px; text-align: center;">推奨</th>
                            <th style="padding: 12px 8px; text-align: center;">信頼度</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        raceAnalysis.analyzedHorses
            .sort((a, b) => b.expectedValue - a.expectedValue)
            .forEach((analysis, index) => {
                const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
                const recommendationColor = this.getRecommendationColor(analysis.recommendation);
                
                html += `
                    <tr style="background: ${bgColor}; border-bottom: 1px solid #dee2e6;">
                        <td style="padding: 12px 8px; text-align: center; font-weight: bold;">${analysis.horse.number || '?'}</td>
                        <td style="padding: 12px 8px; font-size: 0.9em;">${analysis.horse.name || '馬' + (analysis.horse.number || '?')}</td>
                        <td style="padding: 12px 8px; text-align: center;">${analysis.popularity}</td>
                        <td style="padding: 12px 8px; text-align: center; font-weight: bold; color: ${recommendationColor};">${analysis.expectedValue.toFixed(2)}</td>
                        <td style="padding: 12px 8px; text-align: center;">${(analysis.estimatedProbability * 100).toFixed(1)}%</td>
                        <td style="padding: 12px 8px; text-align: center;">${analysis.estimatedOdds.toFixed(0)}円</td>
                        <td style="padding: 12px 8px; text-align: center; color: ${recommendationColor}; font-weight: bold;">${this.getRecommendationDisplay(analysis.recommendation)}</td>
                        <td style="padding: 12px 8px; text-align: center;">${(analysis.confidence * 100).toFixed(0)}%</td>
                    </tr>
                `;
            });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    /**
     * 分析表示用コンテナ作成
     */
    static createAnalysisContainer() {
        const container = document.createElement('div');
        container.id = 'expectedValueAnalysis';
        container.style.marginTop = '20px';
        
        // 買い目推奨セクションの前に挿入
        const bettingSection = document.getElementById('bettingRecommendations');
        if (bettingSection) {
            bettingSection.parentNode.insertBefore(container, bettingSection);
        } else {
            document.body.appendChild(container);
        }
        
        return container;
    }
    
    /**
     * 推奨レベルの色取得
     */
    static getRecommendationColor(recommendation) {
        switch (recommendation) {
            case 'excellent': return '#2e7d32'; // 濃い緑
            case 'good': return '#388e3c';      // 緑
            case 'acceptable': return '#f57c00'; // オレンジ
            case 'break_even': return '#fbc02d';  // 黄色
            case 'skip': return '#d32f2f';       // 赤
            default: return '#666';
        }
    }
    
    /**
     * 推奨レベルの表示文字取得
     */
    static getRecommendationDisplay(recommendation) {
        switch (recommendation) {
            case 'excellent': return '🚀 優良';
            case 'good': return '✅ 良好';
            case 'acceptable': return '⚠️ 許容';
            case 'break_even': return '➖ 損益分岐';
            case 'skip': return '❌ 見送り';
            default: return '❓ 不明';
        }
    }
    
    /**
     * レース推奨の表示文字取得
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
window.ExpectedValueCalculator = ExpectedValueCalculator;