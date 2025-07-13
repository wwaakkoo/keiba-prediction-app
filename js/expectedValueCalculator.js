// 期待値ベース買い目システム - 期待値計算エンジン
class ExpectedValueCalculator {
    static CONFIG = {
        // 期待値閾値（新方式に最適化）
        EXCELLENT_THRESHOLD: 1.15,    // 優良馬券（積極的購入）
        GOOD_THRESHOLD: 1.08,         // 良好馬券（推奨購入）
        ACCEPTABLE_THRESHOLD: 1.02,   // 許容馬券（条件付購入）
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
     * 馬の期待値を計算（新方式：オッズ × 確率 × 信頼度）
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
            confidenceScore: 0  // 信頼度スコア
        };
        
        // 人気層判定
        analysis.popularity = this.determinePopularity(horse.odds);
        
        // スコア→確率変換
        analysis.estimatedProbability = this.convertScoreToProbability(
            horse.placeProbability || horse.score || 0, 
            betType, 
            analysis.popularity
        );
        
        // オッズ取得
        analysis.estimatedOdds = this.estimateOdds(horse.odds, betType, analysis.popularity);
        
        // 信頼度スコア計算
        analysis.confidenceScore = this.calculateConfidenceScore(horse, analysis);
        
        // 新方式期待値計算：オッズ × 確率 × 信頼度
        analysis.expectedValue = (analysis.estimatedOdds / 100) * analysis.estimatedProbability * analysis.confidenceScore;
        
        // 推奨判定
        analysis.recommendation = this.determineRecommendation(analysis.expectedValue);
        
        // 従来の信頼度計算（表示用）
        analysis.confidence = this.calculateConfidence(horse, analysis);
        
        return analysis;
    }
    
    /**
     * 信頼度スコア計算（新方式の核心部分）
     * @param {Object} horse - 馬データ
     * @param {Object} analysis - 分析データ
     * @returns {number} 信頼度スコア（0.5〜1.5の範囲）
     */
    static calculateConfidenceScore(horse, analysis) {
        let confidence = 1.0; // 基準値
        
        // 1. スコアによる信頼度補正
        const score = horse.placeProbability || horse.score || 0;
        if (score >= 90) confidence *= 1.3;       // 超高スコア
        else if (score >= 80) confidence *= 1.2;  // 高スコア
        else if (score >= 70) confidence *= 1.1;  // 良スコア
        else if (score >= 60) confidence *= 1.0;  // 標準
        else if (score >= 50) confidence *= 0.9;  // やや低
        else if (score >= 40) confidence *= 0.8;  // 低スコア
        else confidence *= 0.7;                   // 超低スコア
        
        // 2. 人気による信頼度補正
        const popularity = horse.popularity || analysis.popularity;
        if (typeof popularity === 'string') {
            // 人気層文字列の場合
            switch (popularity) {
                case 'favorite': confidence *= 1.15; break;  // 人気馬は安定
                case 'midrange': confidence *= 1.0; break;   // 中人気は標準
                case 'outsider': confidence *= 0.85; break;  // 人気薄は不安定
            }
        } else if (typeof popularity === 'number') {
            // 人気順数値の場合
            if (popularity <= 3) confidence *= 1.15;         // 1-3番人気
            else if (popularity <= 6) confidence *= 1.0;     // 4-6番人気
            else if (popularity <= 9) confidence *= 0.9;     // 7-9番人気
            else confidence *= 0.8;                          // 10番人気以下
        }
        
        // 3. オッズによる現実性補正
        const odds = horse.odds || 1.0;
        if (odds < 1.5) confidence *= 0.9;        // 極端な低オッズは疑問
        else if (odds <= 3.0) confidence *= 1.1;  // 人気馬
        else if (odds <= 7.0) confidence *= 1.0;  // 中人気
        else if (odds <= 15.0) confidence *= 0.95; // やや人気薄
        else if (odds <= 30.0) confidence *= 0.85; // 人気薄
        else confidence *= 0.7;                    // 極端な穴馬
        
        // 4. 確率とオッズの整合性チェック
        const theoreticalOdds = 1 / analysis.estimatedProbability;
        const oddsRatio = Math.abs(odds - theoreticalOdds) / theoreticalOdds;
        if (oddsRatio > 0.5) confidence *= 0.9;   // 整合性が低い場合は減点
        
        // 5. 最終調整（0.5〜1.5の範囲に制限）
        return Math.max(0.5, Math.min(1.5, confidence));
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
                break_even: [],
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
            
            // 推奨レベル別分類（undefinedチェック追加）
            if (analysis.recommendation && raceAnalysis.summary[analysis.recommendation]) {
                raceAnalysis.summary[analysis.recommendation].push(analysis);
            } else {
                // デフォルトでskipに分類
                raceAnalysis.summary.skip.push(analysis);
                console.warn('⚠️ 推奨レベル不明のため skip に分類:', horse.name, analysis.recommendation);
            }
            
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
            .filter(analysis => analysis.expectedValue >= 1.0)
            .sort((a, b) => b.expectedValue - a.expectedValue);
        
        // 動的複勝買い戦略（1点/2点切り替え）
        const placeRecommendations = ExpectedValueCalculator.generateDynamicPlaceStrategy(sortedByRealisticValue, remainingBudget);
        placeRecommendations.forEach(rec => {
            recommendations.push(rec);
            remainingBudget -= rec.amount;
        });
        
        // 最適化ワイド組み合わせ
        const wideRecommendations = ExpectedValueCalculator.generateOptimizedWideStrategy(sortedByRealisticValue, remainingBudget);
        wideRecommendations.forEach(rec => {
            recommendations.push(rec);
            remainingBudget -= rec.amount;
        });
        
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

    /**
     * 動的複勝戦略生成
     * レース特性・期待値分布・信頼度を総合的に評価して1点/2点を自動切り替え
     */
    static generateDynamicPlaceStrategy(analyzedHorses, budget) {
        const recommendations = [];
        
        // 優良馬の抽出（期待値1.3以上）
        const excellentHorses = analyzedHorses.filter(analysis => analysis.expectedValue >= 1.3);
        
        // 良好馬の抽出（期待値1.1以上）
        const goodHorses = analyzedHorses.filter(analysis => 
            analysis.expectedValue >= 1.1 && analysis.expectedValue < 1.3
        );
        
        // レース特性分析
        const raceCharacteristics = ExpectedValueCalculator.analyzeRaceCharacteristics(analyzedHorses);
        
        // 戦略決定：1点集中 vs 2点分散
        const strategy = ExpectedValueCalculator.decidePlaceStrategy(excellentHorses, goodHorses, raceCharacteristics);
        
        if (strategy.type === 'single_focus') {
            // 1点集中戦略（高期待値馬1頭に集中投資）
            const targetHorse = strategy.target;
            const betAmount = Math.floor(budget * strategy.allocation);
            
            if (betAmount >= 100) {
                recommendations.push({
                    type: 'place',
                    horse: targetHorse.horse,
                    amount: betAmount,
                    expectedValue: targetHorse.expectedValue,
                    confidence: targetHorse.confidence,
                    reason: `集中投資戦略（期待値${targetHorse.expectedValue.toFixed(2)}・信頼度${targetHorse.confidence.toFixed(1)}%）`,
                    popularity: targetHorse.popularity,
                    estimatedOdds: targetHorse.estimatedOdds,
                    strategy: 'single_focus'
                });
            }
        } else if (strategy.type === 'dual_hedge') {
            // 2点分散戦略（リスクヘッジ重視）
            strategy.targets.forEach((target, index) => {
                const betAmount = Math.floor(budget * target.allocation);
                
                if (betAmount >= 100) {
                    recommendations.push({
                        type: 'place',
                        horse: target.horse.horse,
                        amount: betAmount,
                        expectedValue: target.horse.expectedValue,
                        confidence: target.horse.confidence,
                        reason: `分散投資戦略${index + 1}（期待値${target.horse.expectedValue.toFixed(2)}・リスクヘッジ）`,
                        popularity: target.horse.popularity,
                        estimatedOdds: target.horse.estimatedOdds,
                        strategy: 'dual_hedge'
                    });
                }
            });
        }
        
        return recommendations;
    }

    /**
     * レース特性分析
     */
    static analyzeRaceCharacteristics(analyzedHorses) {
        const totalHorses = analyzedHorses.length;
        const highValueHorses = analyzedHorses.filter(h => h.expectedValue >= 1.3).length;
        const mediumValueHorses = analyzedHorses.filter(h => h.expectedValue >= 1.1 && h.expectedValue < 1.3).length;
        
        // 期待値分散度
        const expectedValues = analyzedHorses.map(h => h.expectedValue);
        const avgExpectedValue = expectedValues.reduce((sum, val) => sum + val, 0) / expectedValues.length;
        const variance = expectedValues.reduce((sum, val) => sum + Math.pow(val - avgExpectedValue, 2), 0) / expectedValues.length;
        
        // 信頼度分析
        const confidences = analyzedHorses.map(h => h.confidence);
        const avgConfidence = confidences.reduce((sum, val) => sum + val, 0) / confidences.length;
        const maxConfidence = Math.max(...confidences);
        
        return {
            totalHorses,
            highValueHorses,
            mediumValueHorses,
            expectedValueSpread: variance,
            averageConfidence: avgConfidence,
            maxConfidence,
            competitiveness: highValueHorses / totalHorses // 競争激しさ指標
        };
    }

    /**
     * 複勝戦略決定
     */
    static decidePlaceStrategy(excellentHorses, goodHorses, characteristics) {
        // 1点集中の条件
        const singleFocusConditions = [
            excellentHorses.length === 1, // 優良馬が1頭のみ
            excellentHorses[0]?.confidence >= 85, // 高信頼度
            excellentHorses[0]?.expectedValue >= 1.5, // 超高期待値
            characteristics.competitiveness < 0.3 // 低競争度
        ];
        
        const singleFocusScore = singleFocusConditions.filter(Boolean).length;
        
        // 2点分散の条件
        const dualHedgeConditions = [
            excellentHorses.length >= 2, // 優良馬が複数
            characteristics.expectedValueSpread > 0.1, // 期待値のばらつき
            characteristics.competitiveness >= 0.3, // 高競争度
            characteristics.averageConfidence < 80 // 予想の不確実性
        ];
        
        const dualHedgeScore = dualHedgeConditions.filter(Boolean).length;
        
        if (singleFocusScore >= 2 && excellentHorses.length > 0) {
            // 1点集中戦略
            return {
                type: 'single_focus',
                target: excellentHorses[0],
                allocation: 0.6, // 60%集中投資
                reason: '高信頼度・高期待値による集中投資'
            };
        } else if (dualHedgeScore >= 2) {
            // 2点分散戦略
            const targets = [];
            
            if (excellentHorses.length >= 2) {
                targets.push(
                    { horse: excellentHorses[0], allocation: 0.35 },
                    { horse: excellentHorses[1], allocation: 0.25 }
                );
            } else if (excellentHorses.length === 1 && goodHorses.length >= 1) {
                targets.push(
                    { horse: excellentHorses[0], allocation: 0.4 },
                    { horse: goodHorses[0], allocation: 0.2 }
                );
            }
            
            return {
                type: 'dual_hedge',
                targets,
                reason: 'リスク分散による安定投資'
            };
        } else {
            // デフォルト：従来戦略
            return {
                type: 'single_focus',
                target: excellentHorses[0] || goodHorses[0],
                allocation: 0.35,
                reason: 'デフォルト戦略'
            };
        }
    }

    /**
     * 最適化ワイド戦略生成
     * 全組み合わせの期待値を計算し、最適な組み合わせを選択
     */
    static generateOptimizedWideStrategy(analyzedHorses, budget) {
        const recommendations = [];
        
        // ワイド対象馬の抽出（期待値1.1以上）
        const wideTargets = analyzedHorses.filter(analysis => analysis.expectedValue >= 1.1);
        
        if (wideTargets.length < 2) return recommendations;
        
        // 全ワイド組み合わせの期待値計算
        const wideCombinations = ExpectedValueCalculator.calculateAllWideCombinations(wideTargets);
        
        // 最適組み合わせの選択
        const optimalCombinations = ExpectedValueCalculator.selectOptimalWideCombinations(wideCombinations, budget);
        
        optimalCombinations.forEach(combination => {
            const betAmount = combination.allocation;
            
            if (betAmount >= 100) {
                // 馬データの正規化
                const horse1Data = combination.horse1.horse || combination.horse1;
                const horse2Data = combination.horse2.horse || combination.horse2;
                
                recommendations.push({
                    type: 'wide',
                    horses: [horse1Data, horse2Data],
                    amount: betAmount,
                    expectedValue: combination.expectedValue,
                    confidence: combination.confidence,
                    reason: `最適化ワイド（期待値${combination.expectedValue.toFixed(2)}・効率${combination.efficiency.toFixed(1)}%）`,
                    popularity: `${combination.horse1.popularity}×${combination.horse2.popularity}`,
                    efficiency: combination.efficiency
                });
            }
        });
        
        return recommendations;
    }

    /**
     * 全ワイド組み合わせの期待値計算
     */
    static calculateAllWideCombinations(horses) {
        const combinations = [];
        
        for (let i = 0; i < horses.length; i++) {
            for (let j = i + 1; j < horses.length; j++) {
                const horse1 = horses[i];
                const horse2 = horses[j];
                
                // ワイド期待値の計算（簡略化：両馬の期待値平均）
                const wideExpectedValue = (horse1.expectedValue + horse2.expectedValue) / 2;
                
                // 信頼度の計算（最小値採用）
                const confidence = Math.min(horse1.confidence, horse2.confidence);
                
                // 効率性の計算（期待値×信頼度）
                const efficiency = wideExpectedValue * confidence;
                
                combinations.push({
                    horse1,
                    horse2,
                    expectedValue: wideExpectedValue,
                    confidence,
                    efficiency,
                    popularitySum: horse1.popularity + horse2.popularity,
                    // デバッグ用: 馬名を記録
                    debugInfo: `${horse1.horse?.name || '不明1'} × ${horse2.horse?.name || '不明2'}`
                });
            }
        }
        
        return combinations.sort((a, b) => b.efficiency - a.efficiency);
    }

    /**
     * 最適ワイド組み合わせ選択
     */
    static selectOptimalWideCombinations(combinations, budget) {
        const selected = [];
        const usedHorses = new Set();
        
        // 効率順にソート済みの組み合わせから選択
        for (const combination of combinations) {
            // 期待値閾値チェック
            if (combination.expectedValue < 1.2) break;
            
            // 既に使用された馬はスキップ（重複回避）
            if (usedHorses.has(combination.horse1.horse.number) || 
                usedHorses.has(combination.horse2.horse.number)) {
                continue;
            }
            
            // 人気バランスチェック（両方人気薄は避ける）
            if (combination.popularitySum > 14) continue;
            
            // 投資額配分
            let allocation;
            if (combination.expectedValue >= 1.4) {
                allocation = Math.floor(budget * 0.4); // 40%配分
            } else if (combination.expectedValue >= 1.3) {
                allocation = Math.floor(budget * 0.3); // 30%配分
            } else {
                allocation = Math.floor(budget * 0.2); // 20%配分
            }
            
            combination.allocation = allocation;
            selected.push(combination);
            
            // 使用馬を記録
            usedHorses.add(combination.horse1.horse.number);
            usedHorses.add(combination.horse2.horse.number);
            
            // 予算更新
            budget -= allocation;
            
            // 最大2組み合わせまで
            if (selected.length >= 2) break;
        }
        
        return selected;
    }
}

// グローバル変数として公開
window.ExpectedValueCalculator = ExpectedValueCalculator;