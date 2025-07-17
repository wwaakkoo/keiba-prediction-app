// 期待値ベース買い目システム - 期待値計算エンジン
class ExpectedValueCalculator {
    static CONFIG = {
        // 期待値閾値（新方式に最適化）
        EXCELLENT_THRESHOLD: 1.15,    // 優良馬券（積極的購入）
        GOOD_THRESHOLD: 1.08,         // 良好馬券（推奨購入）
        ACCEPTABLE_THRESHOLD: 1.02,   // 許容馬券（条件付購入）
        BREAK_EVEN_THRESHOLD: 1.0,    // 損益分岐点
        
        // 人気層別オッズ係数（実測データ校正済み）
        POPULARITY_ODDS_FACTOR: {
            favorite: 0.6,      // 0.25→0.6に大幅上方修正
            midrange: 0.7,      // 0.35→0.7に上方修正
            outsider: 0.8       // 0.45→0.8に上方修正
        },
        
        // スコア→確率変換パラメータ（実測データ校正済み）
        SCORE_CALIBRATION: {
            // 複勝確率変換係数（個別馬精度を考慮して調整）
            PLACE_BASE: 0.55,       // 0.4→0.55に適度上方修正（0.7から抑制）
            PLACE_ADJUSTMENT: 0.12, // 0.1→0.12に調整（0.15から抑制）
            
            // 単勝確率変換係数（複勝の約1/3として設定）
            WIN_BASE: 0.25,         // 0.15→0.25に上方修正
            WIN_ADJUSTMENT: 0.08,   // 0.05→0.08に調整
            
            // 人気補正係数（実測データ反映）
            POPULARITY_CORRECTION: {
                favorite: 1.2,      // 1.3→1.2に微調整（高スコア馬の過大評価抑制）
                midrange: 1.0,      // 据え置き
                outsider: 0.7       // 0.6→0.7に緩和（過度なペナルティ軽減）
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
        
        // ロジスティック変換による推定確率の調整
        const logisticProbability = this.applyLogisticTransform(analysis.estimatedProbability, horse);
        
        // リスク係数計算（1.0〜2.0）
        const riskFactor = this.calculateRiskFactor(horse, analysis);
        
        // 新期待値計算式（修正版）
        const rawExpectedValue = horse.odds * logisticProbability;
        
        // 超高オッズ馬の期待値制限を強化（段階的制限）
        let oddsBasedCap;
        if (horse.odds >= 100) {
            oddsBasedCap = 1.05;    // 100倍以上：ほぼ損益分岐点のみ
        } else if (horse.odds >= 50) {
            oddsBasedCap = 1.15;    // 50-99倍：極めて保守的
        } else if (horse.odds >= 30) {
            oddsBasedCap = 1.25;    // 30-49倍：かなり保守的
        } else if (horse.odds >= 20) {
            oddsBasedCap = 1.35;    // 20-29倍：保守的
        } else if (horse.odds >= 10) {
            oddsBasedCap = 1.50;    // 10-19倍：やや保守的
        } else {
            oddsBasedCap = 2.0;     // 10倍未満：通常制限
        }
        
        analysis.expectedValue = Math.min(rawExpectedValue, oddsBasedCap) / riskFactor;
        
        // ケリー係数チェック（最適賭け率）
        // Phase6で計算された正規化勝率を優先使用
        const winProbability = horse.winProbability || logisticProbability;
        analysis.kellyRatio = this.calculateKellyRatio(analysis.expectedValue, horse.odds, winProbability);
        
        // Kelly閾値の動的設定（柔軟化設定を優先）
        let kellyThreshold = 0.01;
        
        // Kelly基準柔軟化システムから現在の基準を取得
        try {
            if (typeof KellyCapitalManager !== 'undefined') {
                const kellyManager = new KellyCapitalManager();
                kellyThreshold = kellyManager.constraints.minKellyThreshold;
                console.log(`📊 現在のKelly閾値: ${(kellyThreshold * 100).toFixed(2)}% (${kellyManager.currentFlexibilityMode})`);
            } else {
                throw new Error('KellyCapitalManager未定義');
            }
        } catch (error) {
            console.warn('⚠️ Kelly柔軟化設定の取得に失敗、基本閾値を使用');
            // フォールバック：基本閾値（超厳格基準を考慮）
            kellyThreshold = 0.02;  // デフォルト2%（超厳格相当）
        }
        
        analysis.shouldDisplay = analysis.kellyRatio >= kellyThreshold;
        
        // 推奨判定（期待値ベース）
        analysis.recommendation = this.determineRecommendation(analysis.expectedValue, horse.odds);
        
        // 購買指数計算（期待値 × 信頼度）- 信頼度計算後に移動
        analysis.purchaseIndex = analysis.expectedValue * analysis.confidenceScore;
        
        // 購買推奨判定（購買指数ベース）
        analysis.purchaseRecommendation = this.determinePurchaseRecommendation(analysis.purchaseIndex, horse.odds);
        
        // 従来の信頼度計算（表示用）
        analysis.confidence = this.calculateConfidence(horse, analysis);
        
        // 統計収集（フィードバックループ用）
        this.collectPredictionStatistics(analysis);
        
        // Phase 5効果測定ログ収集
        this.collectPhase5EffectLog(analysis, horse);
        
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
        
        // 1. スコアによる信頼度補正（強化されたスケーリング）
        const score = horse.placeProbability || horse.score || 0;
        if (score >= 95) confidence *= 1.5;       // 最高スコア（大幅アップ）
        else if (score >= 90) confidence *= 1.35; // 超高スコア（強化）
        else if (score >= 85) confidence *= 1.25; // 高スコア（新設）
        else if (score >= 80) confidence *= 1.15; // 良好スコア
        else if (score >= 75) confidence *= 1.05; // やや良好（新設）
        else if (score >= 70) confidence *= 1.0;  // 標準
        else if (score >= 65) confidence *= 0.95; // やや標準以下（新設）
        else if (score >= 60) confidence *= 0.9;  // 標準以下
        else if (score >= 55) confidence *= 0.85; // やや低（新設）
        else if (score >= 50) confidence *= 0.8;  // 低スコア
        else if (score >= 45) confidence *= 0.7;  // かなり低（新設）
        else if (score >= 40) confidence *= 0.6;  // 超低スコア（強化）
        else confidence *= 0.5;                   // 最低スコア（大幅ダウン）
        
        // 2. 人気による信頼度補正（詳細化）
        const popularity = horse.popularity || analysis.popularity;
        if (typeof popularity === 'string') {
            switch (popularity) {
                case 'favorite': confidence *= 1.2; break;   // 人気馬（強化）
                case 'midrange': confidence *= 1.0; break;   // 中人気は標準
                case 'outsider': confidence *= 0.8; break;   // 人気薄（ペナルティ強化）
            }
        } else if (typeof popularity === 'number') {
            if (popularity <= 2) confidence *= 1.25;         // 1-2番人気（強化）
            else if (popularity <= 4) confidence *= 1.1;     // 3-4番人気
            else if (popularity <= 6) confidence *= 1.0;     // 5-6番人気
            else if (popularity <= 8) confidence *= 0.9;     // 7-8番人気
            else if (popularity <= 10) confidence *= 0.8;    // 9-10番人気
            else confidence *= 0.7;                          // 11番人気以下（強化）
        }
        
        // 3. オッズによる現実性補正（段階的細分化）
        const odds = horse.odds || 1.0;
        if (odds < 1.3) confidence *= 0.8;        // 極端な低オッズ（ペナルティ強化）
        else if (odds <= 2.0) confidence *= 1.15; // 大人気（強化）
        else if (odds <= 3.5) confidence *= 1.1;  // 人気馬
        else if (odds <= 5.0) confidence *= 1.05; // やや人気（新設）
        else if (odds <= 8.0) confidence *= 1.0;  // 中人気
        else if (odds <= 12.0) confidence *= 0.95; // やや人気薄
        else if (odds <= 18.0) confidence *= 0.9;  // 人気薄
        else if (odds <= 25.0) confidence *= 0.8;  // かなり人気薄（新設）
        else if (odds <= 40.0) confidence *= 0.7;  // 大穴（新設）
        else confidence *= 0.6;                    // 極端な大穴（ペナルティ強化）
        
        // 4. 確率とオッズの整合性チェック（厳格化）
        const theoreticalOdds = 1 / (analysis.estimatedProbability || 0.1);
        const oddsRatio = Math.abs(odds - theoreticalOdds) / theoreticalOdds;
        if (oddsRatio > 1.0) confidence *= 0.8;      // 大きな不整合（ペナルティ強化）
        else if (oddsRatio > 0.6) confidence *= 0.85; // 中程度の不整合（新設）
        else if (oddsRatio > 0.3) confidence *= 0.9;  // 小さな不整合
        else confidence *= 1.05;                      // 整合性良好（ボーナス新設）
        
        // 5. 最終範囲調整（0.4〜1.4のシンプルな制限）
        return Math.max(0.4, Math.min(1.4, confidence));
    }
    
    /**
     * ロジスティック変換による確率調整
     * @param {number} probability - 元の確率
     * @param {Object} horse - 馬データ
     * @returns {number} 調整後確率
     */
    static applyLogisticTransform(probability, horse) {
        // ロジスティック関数: 1 / (1 + e^(-k*(x-x0)))
        const k = 8; // 傾きパラメータ
        const x0 = 0.5; // 中心点
        
        // スコアベースの調整
        const score = horse.placeProbability || horse.score || 50;
        const scoreAdjustment = (score - 50) / 100; // -0.5 to 0.5
        
        const adjustedInput = probability + scoreAdjustment;
        const logisticResult = 1 / (1 + Math.exp(-k * (adjustedInput - x0)));
        
        // 現実的な範囲に制限（複勝想定）
        return Math.max(0.05, Math.min(0.8, logisticResult));
    }
    
    /**
     * リスク係数計算（1.0〜2.0）
     * @param {Object} horse - 馬データ
     * @param {Object} analysis - 分析データ
     * @returns {number} リスク係数
     */
    static calculateRiskFactor(horse, analysis) {
        let riskFactor = 1.0; // 基準値
        
        // 1. 人気によるリスク
        const odds = horse.odds || 1.0;
        if (odds > 100) riskFactor += 0.6;      // 極穴馬: 高リスク
        else if (odds > 50) riskFactor += 0.4;  // 大穴馬: 中高リスク
        else if (odds > 20) riskFactor += 0.3;  // 人気薄: 中リスク
        else if (odds > 10) riskFactor += 0.2;  // 中人気: 低リスク
        else if (odds > 3) riskFactor += 0.1;   // 人気馬: 最低リスク
        // 3倍未満: リスク係数据え置き
        
        // 2. スコアによるリスク
        const score = horse.placeProbability || horse.score || 50;
        if (score < 40) riskFactor += 0.3;      // 低スコア: 高リスク
        else if (score < 60) riskFactor += 0.2; // 中スコア: 中リスク
        else if (score < 80) riskFactor += 0.1; // 良スコア: 低リスク
        // 80以上: リスク係数据え置き
        
        // 3. 確率とオッズの整合性によるリスク
        const theoreticalOdds = 1 / analysis.estimatedProbability;
        const oddsDiscrepancy = Math.abs(odds - theoreticalOdds) / theoreticalOdds;
        if (oddsDiscrepancy > 0.5) riskFactor += 0.2; // 不整合: リスク増加
        
        // 4. 最終調整（1.0〜2.0の範囲に制限）
        return Math.max(1.0, Math.min(2.0, riskFactor));
    }
    
    /**
     * ケリー係数計算（最適賭け率）
     * @param {number} expectedValue - 期待値
     * @param {number} odds - オッズ
     * @param {number} probability - 勝率
     * @returns {number} ケリー係数
     */
    static calculateKellyRatio(expectedValue, odds, probability) {
        const b = odds - 1; // 純利益倍率
        const p = probability; // 勝率
        const q = 1 - p; // 負け率
        
        // ケリー基準: f = (bp - q) / b
        const kellyRatio = (b * p - q) / b;
        
        // デバッグ情報を出力
        console.log(`🔍 ケリー計算詳細: オッズ=${odds}, 勝率=${(p*100).toFixed(2)}%, b=${b.toFixed(2)}, bp-q=${(b*p-q).toFixed(4)}, ケリー=${(kellyRatio*100).toFixed(4)}%`);
        
        // ケリー係数が負の場合は投資しない
        return Math.max(0, kellyRatio);
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
        
        // Phase 5軽量補正（プロトタイプ）
        const phase5Correction = this.getPhase5LightCorrection(score, betType);
        baseProbability *= phase5Correction;
        
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
    static determineRecommendation(expectedValue, odds = 5.0) {
        // 超高オッズ馬に対する厳格な期待値基準
        let excellentThreshold = this.CONFIG.EXCELLENT_THRESHOLD;
        let goodThreshold = this.CONFIG.GOOD_THRESHOLD;
        let acceptableThreshold = this.CONFIG.ACCEPTABLE_THRESHOLD;
        
        if (odds >= 50) {
            // 50倍以上：極めて厳格
            excellentThreshold = 1.30;
            goodThreshold = 1.20;
            acceptableThreshold = 1.10;
        } else if (odds >= 20) {
            // 20-49倍：かなり厳格
            excellentThreshold = 1.25;
            goodThreshold = 1.15;
            acceptableThreshold = 1.08;
        } else if (odds >= 10) {
            // 10-19倍：やや厳格
            excellentThreshold = 1.20;
            goodThreshold = 1.12;
            acceptableThreshold = 1.05;
        }
        
        if (expectedValue >= excellentThreshold) return 'excellent';
        if (expectedValue >= goodThreshold) return 'good';
        if (expectedValue >= acceptableThreshold) return 'acceptable';
        if (expectedValue >= this.CONFIG.BREAK_EVEN_THRESHOLD) return 'break_even';
        return 'skip';
    }
    
    /**
     * 購買推奨判定（購買指数ベース）
     * @param {number} purchaseIndex - 購買指数（期待値 × 信頼度）
     * @param {number} odds - オッズ
     * @returns {string} 購買推奨レベル
     */
    static determinePurchaseRecommendation(purchaseIndex, odds = 5.0) {
        // 購買指数の基準値（的中期待×回収期待のバランス考慮）
        let strongBuyThreshold = 1.2;  // 強い購買推奨
        let buyThreshold = 1.05;       // 購買推奨
        let weakBuyThreshold = 0.95;   // 弱い購買推奨
        
        // オッズ帯別の厳格化（リスク調整）
        if (odds >= 50) {
            // 超高オッズ：的中期待が極めて低いため厳格に
            strongBuyThreshold = 1.4;
            buyThreshold = 1.25;
            weakBuyThreshold = 1.1;
        } else if (odds >= 20) {
            // 高オッズ：リスクを考慮してやや厳格に
            strongBuyThreshold = 1.3;
            buyThreshold = 1.15;
            weakBuyThreshold = 1.0;
        } else if (odds >= 10) {
            // 中オッズ：標準的な基準
            strongBuyThreshold = 1.25;
            buyThreshold = 1.1;
            weakBuyThreshold = 0.98;
        }
        // 低オッズ（10未満）はデフォルト値を使用
        
        if (purchaseIndex >= strongBuyThreshold) return 'strong_buy';
        if (purchaseIndex >= buyThreshold) return 'buy';
        if (purchaseIndex >= weakBuyThreshold) return 'weak_buy';
        return 'skip';
    }
    
    /**
     * 予測統計収集（フィードバックループ用）
     * @param {Object} analysis - 分析結果
     */
    static collectPredictionStatistics(analysis) {
        if (!this.predictionStats) {
            this.predictionStats = {
                scoreAccuracy: {}, // スコア帯別的中率
                oddsAccuracy: {},  // オッズ帯別期待値精度
                purchaseIndexPerformance: {}, // 購買指数別成績
                totalPredictions: 0
            };
        }
        
        // 予測データを蓄積（実結果との照合は別途実装）
        const scoreRange = Math.floor(analysis.horse.score / 10) * 10;
        const oddsRange = this.getOddsRange(analysis.horse.odds);
        const purchaseRange = Math.floor(analysis.purchaseIndex * 10) / 10;
        
        // 統計カウンタを初期化
        if (!this.predictionStats.scoreAccuracy[scoreRange]) {
            this.predictionStats.scoreAccuracy[scoreRange] = { predictions: 0, hits: 0 };
        }
        if (!this.predictionStats.oddsAccuracy[oddsRange]) {
            this.predictionStats.oddsAccuracy[oddsRange] = { predictions: 0, totalEV: 0, actualReturns: 0 };
        }
        if (!this.predictionStats.purchaseIndexPerformance[purchaseRange]) {
            this.predictionStats.purchaseIndexPerformance[purchaseRange] = { predictions: 0, hits: 0, returns: 0 };
        }
        
        this.predictionStats.totalPredictions++;
    }
    
    /**
     * Phase 5効果測定ログ収集
     * @param {Object} analysis - 分析結果
     * @param {Object} horse - 馬データ
     */
    static collectPhase5EffectLog(analysis, horse) {
        if (!this.phase5EffectLog) {
            this.phase5EffectLog = [];
        }
        
        // 補正前の確率を計算（Phase 5補正なし）
        const originalProbability = this.calculateOriginalProbability(horse.score || 0, 'place', analysis.popularity);
        const correctionFactor = this.getPhase5LightCorrection(horse.score || 0, 'place');
        
        const logEntry = {
            timestamp: Date.now(),
            raceId: this.generateRaceId(),
            horseId: horse.number || horse.name || 'unknown',
            score: horse.score || horse.placeProbability || 0,
            originalProbability: originalProbability,
            correctedProbability: analysis.estimatedProbability,
            correctionFactor: correctionFactor,
            correctionEnabled: this.PHASE5_LIGHT_CORRECTION_ENABLED,
            correctionMode: this.PHASE5_CORRECTION_MODE,
            expectedValue: analysis.expectedValue,
            purchaseIndex: analysis.purchaseIndex,
            actualResult: null // 後でレース結果で更新
        };
        
        this.phase5EffectLog.push(logEntry);
        
        // ログサイズ制限（最新1000件まで）
        if (this.phase5EffectLog.length > 1000) {
            this.phase5EffectLog = this.phase5EffectLog.slice(-1000);
        }
    }
    
    /**
     * 補正前の確率を計算（Phase 5補正なし）
     */
    static calculateOriginalProbability(score, betType, popularity) {
        if (score <= 0) return 0;
        
        let baseProbability = 0;
        const config = this.CONFIG.SCORE_CALIBRATION;
        
        switch (betType) {
            case 'place':
                baseProbability = Math.min(0.95, (score / 100) * config.PLACE_BASE + config.PLACE_ADJUSTMENT);
                break;
            case 'win':
                baseProbability = Math.min(0.80, (score / 100) * config.WIN_BASE + config.WIN_ADJUSTMENT);
                break;
            default:
                baseProbability = score / 100;
        }
        
        // 人気層補正のみ適用（Phase 5補正はスキップ）
        const popularityCorrection = config.POPULARITY_CORRECTION[popularity] || 1.0;
        
        return Math.max(0.01, Math.min(0.99, baseProbability * popularityCorrection));
    }
    
    /**
     * レースIDを生成
     */
    static generateRaceId() {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = date.getHours().toString().padStart(2, '0') + 
                       date.getMinutes().toString().padStart(2, '0');
        return `${dateStr}-${timeStr}`;
    }
    
    /**
     * Phase 5効果レポート生成
     */
    static generatePhase5EffectReport() {
        if (!this.phase5EffectLog || this.phase5EffectLog.length === 0) {
            return {
                status: 'no_data',
                message: 'Phase 5効果測定データがありません'
            };
        }
        
        const totalPredictions = this.phase5EffectLog.length;
        const correctedPredictions = this.phase5EffectLog.filter(log => log.correctionEnabled).length;
        const uncorrectedPredictions = totalPredictions - correctedPredictions;
        
        // 効果分析（実際の結果更新後に計算）
        const withResults = this.phase5EffectLog.filter(log => log.actualResult !== null);
        const correctedWithResults = withResults.filter(log => log.correctionEnabled);
        const uncorrectedWithResults = withResults.filter(log => !log.correctionEnabled);
        
        return {
            status: 'available',
            totalPredictions,
            correctedPredictions,
            uncorrectedPredictions,
            withResults: withResults.length,
            summary: {
                averageCorrection: this.calculateAverageCorrection(),
                probabilityShift: this.calculateProbabilityShift(),
                expectedValueImpact: this.calculateExpectedValueImpact()
            },
            accuracy: {
                corrected: this.calculateAccuracy(correctedWithResults),
                uncorrected: this.calculateAccuracy(uncorrectedWithResults)
            }
        };
    }
    
    /**
     * 平均補正率を計算
     */
    static calculateAverageCorrection() {
        const correctedLogs = this.phase5EffectLog.filter(log => log.correctionEnabled);
        if (correctedLogs.length === 0) return 1.0;
        
        const totalCorrection = correctedLogs.reduce((sum, log) => sum + log.correctionFactor, 0);
        return totalCorrection / correctedLogs.length;
    }
    
    /**
     * 確率シフトを計算
     */
    static calculateProbabilityShift() {
        const correctedLogs = this.phase5EffectLog.filter(log => log.correctionEnabled);
        if (correctedLogs.length === 0) return 0;
        
        const totalShift = correctedLogs.reduce((sum, log) => {
            return sum + (log.correctedProbability - log.originalProbability);
        }, 0);
        
        return totalShift / correctedLogs.length;
    }
    
    /**
     * 期待値への影響を計算
     */
    static calculateExpectedValueImpact() {
        // 簡易実装：期待値の平均変化
        const recentLogs = this.phase5EffectLog.slice(-100); // 最新100件
        const corrected = recentLogs.filter(log => log.correctionEnabled);
        const uncorrected = recentLogs.filter(log => !log.correctionEnabled);
        
        if (corrected.length === 0 || uncorrected.length === 0) return 0;
        
        const avgCorrected = corrected.reduce((sum, log) => sum + log.expectedValue, 0) / corrected.length;
        const avgUncorrected = uncorrected.reduce((sum, log) => sum + log.expectedValue, 0) / uncorrected.length;
        
        return avgCorrected - avgUncorrected;
    }
    
    /**
     * 精度を計算
     */
    static calculateAccuracy(logs) {
        if (logs.length === 0) return { hitRate: 0, sampleSize: 0 };
        
        const hits = logs.filter(log => log.actualResult === 'hit').length;
        return {
            hitRate: hits / logs.length,
            sampleSize: logs.length
        };
    }
    
    /**
     * オッズ範囲取得
     * @param {number} odds - オッズ
     * @returns {string} オッズ範囲
     */
    static getOddsRange(odds) {
        if (odds < 2) return '1.0-1.9';
        if (odds < 5) return '2.0-4.9';
        if (odds < 10) return '5.0-9.9';
        if (odds < 20) return '10.0-19.9';
        if (odds < 50) return '20.0-49.9';
        return '50.0+';
    }
    
    /**
     * 統計レポート生成
     * @returns {Object} 統計レポート
     */
    static generateStatisticsReport() {
        return {
            totalPredictions: this.predictionStats?.totalPredictions || 0,
            scoreAccuracy: this.predictionStats?.scoreAccuracy || {},
            oddsAccuracy: this.predictionStats?.oddsAccuracy || {},
            purchaseIndexPerformance: this.predictionStats?.purchaseIndexPerformance || {}
        };
    }
    
    /**
     * Phase 5データ監査（プロトタイプ統合準備）
     * @returns {Object} 監査結果
     */
    static auditPhase5Data() {
        console.log('🔍 === Phase 5データ監査開始 ===');
        
        const data = JSON.parse(localStorage.getItem('phase5_calibration_data') || '{}');
        const analysis = {
            timestamp: new Date().toISOString(),
            totalSamples: 0,
            bucketAnalysis: [],
            statisticalReliability: {},
            outlierDetection: {},
            recommendations: []
        };
        
        // バケット別分析
        Object.entries(data).forEach(([bucket, bucketData]) => {
            const n = bucketData.totalPredictions || 0;
            const hits = bucketData.correctPredictions || 0;
            const rate = n > 0 ? hits / n : 0;
            
            // Wilson score interval（95%信頼区間）
            const p = rate;
            const z = 1.96; // 95%信頼区間
            if (n > 0) {
                const wilson_center = (p + z*z/(2*n)) / (1 + z*z/n);
                const wilson_halfwidth = z * Math.sqrt(p*(1-p)/n + z*z/(4*n*n)) / (1 + z*z/n);
                
                analysis.bucketAnalysis.push({
                    bucket,
                    scoreRange: this.getScoreRangeFromBucket(bucket),
                    samples: n,
                    hits: hits,
                    hitRate: rate,
                    hitRatePercent: (rate * 100).toFixed(1),
                    confidenceInterval: [
                        Math.max(0, wilson_center - wilson_halfwidth),
                        Math.min(1, wilson_center + wilson_halfwidth)
                    ],
                    isReliable: n >= 15, // 最小サンプル閾値
                    isOutlier: false, // 後で計算
                    theoreticalRate: this.getTheoreticalRateForBucket(bucket)
                });
            }
            
            analysis.totalSamples += n;
        });
        
        // 外れ値検出（Zスコア）
        if (analysis.bucketAnalysis.length > 1) {
            const rates = analysis.bucketAnalysis.map(b => b.hitRate);
            const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
            const variance = rates.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / rates.length;
            const stdDev = Math.sqrt(variance);
            
            analysis.bucketAnalysis.forEach(bucket => {
                if (stdDev > 0) {
                    const zScore = Math.abs(bucket.hitRate - mean) / stdDev;
                    bucket.isOutlier = zScore > 2.5; // 2.5σ以上を外れ値
                    bucket.zScore = zScore.toFixed(2);
                }
            });
        }
        
        // 統計的信頼性評価
        const reliableBuckets = analysis.bucketAnalysis.filter(b => b.isReliable);
        analysis.statisticalReliability = {
            totalBuckets: analysis.bucketAnalysis.length,
            reliableBuckets: reliableBuckets.length,
            reliabilityRate: analysis.bucketAnalysis.length > 0 ? 
                (reliableBuckets.length / analysis.bucketAnalysis.length * 100).toFixed(1) + '%' : '0%',
            readyForIntegration: reliableBuckets.length >= 3
        };
        
        // 推奨事項生成
        analysis.recommendations = this.generatePhase5Recommendations(analysis);
        
        console.log('📊 Phase 5監査結果:', analysis);
        return analysis;
    }
    
    /**
     * バケット名からスコア範囲を取得
     */
    static getScoreRangeFromBucket(bucket) {
        const match = bucket.match(/bucket_(\d+)/);
        if (match) {
            const score = parseInt(match[1]);
            return `${score}-${score + 9}`;
        }
        return 'unknown';
    }
    
    /**
     * バケットの理論的確率を計算
     */
    static getTheoreticalRateForBucket(bucket) {
        const match = bucket.match(/bucket_(\d+)/);
        if (match) {
            const score = parseInt(match[1]) + 5; // バケット中央値
            // 簡易理論値（既存の計算ロジックベース）
            return Math.min(0.95, (score / 100) * 0.55 + 0.12);
        }
        return 0.5;
    }
    
    /**
     * Phase 5統合推奨事項を生成
     */
    static generatePhase5Recommendations(analysis) {
        const recommendations = [];
        
        if (analysis.totalSamples < 50) {
            recommendations.push({
                type: 'warning',
                message: `総サンプル数${analysis.totalSamples}は統計的に不十分です。最低100サンプルの蓄積を推奨。`
            });
        }
        
        if (analysis.statisticalReliability.readyForIntegration) {
            recommendations.push({
                type: 'success',
                message: `${analysis.statisticalReliability.reliableBuckets}個のバケットが統合可能です。軽量補正の実装を推奨。`
            });
        } else {
            recommendations.push({
                type: 'info',
                message: `統合には最低3バケットが必要です（現在: ${analysis.statisticalReliability.reliableBuckets}）。`
            });
        }
        
        const outliers = analysis.bucketAnalysis.filter(b => b.isOutlier);
        if (outliers.length > 0) {
            recommendations.push({
                type: 'warning',
                message: `${outliers.length}個のバケットが統計的外れ値です: ${outliers.map(o => o.scoreRange).join(', ')}`
            });
        }
        
        // 大幅乖離の検出
        analysis.bucketAnalysis.forEach(bucket => {
            const deviation = Math.abs(bucket.hitRate - bucket.theoreticalRate);
            if (deviation > 0.3 && bucket.isReliable) {
                recommendations.push({
                    type: 'critical',
                    message: `${bucket.scoreRange}点: 実測${bucket.hitRatePercent}% vs 理論${(bucket.theoreticalRate*100).toFixed(1)}% - 大幅乖離`
                });
            }
        });
        
        return recommendations;
    }
    
    /**
     * Phase 5軽量補正係数を取得（プロトタイプ）
     * @param {number} score - スコア値
     * @param {string} betType - 馬券種別
     * @returns {number} 補正係数
     */
    static getPhase5LightCorrection(score, betType) {
        // 複勝以外は補正なし（将来拡張可能）
        if (betType !== 'place') return 1.0;
        
        // Phase 5軽量補正フラグ（ON/OFF切り替え用）
        if (!this.PHASE5_LIGHT_CORRECTION_ENABLED) return 1.0;
        
        // 方法A: 固定補正係数テーブル（デフォルト）
        if (this.PHASE5_CORRECTION_MODE === 'fixed') {
            return this.getFixedCorrectionFactor(score);
        }
        
        // 方法B: 重み付け補正（データ十分時）
        if (this.PHASE5_CORRECTION_MODE === 'weighted') {
            return this.getWeightedCorrectionFactor(score);
        }
        
        return 1.0; // 無補正
    }
    
    /**
     * 固定補正係数を取得（案A）
     */
    static getFixedCorrectionFactor(score) {
        // 監査結果に基づく固定係数（プロトタイプ用）
        if (score >= 90) return 1.0;   // 十分な精度と仮定
        if (score >= 80) return 0.6;   // 31.6% ÷ 理論52% ≈ 0.6
        if (score >= 70) return 0.2;   // 8.7% ÷ 理論42% ≈ 0.2
        if (score >= 60) return 0.3;   // 仮の値（要監査）
        if (score >= 50) return 0.4;   // 仮の値（要監査）
        return 0.5; // デフォルト（低スコア）
    }
    
    /**
     * 重み付け補正係数を取得（案B）
     */
    static getWeightedCorrectionFactor(score) {
        const phase5Data = this.getPhase5BucketData(score);
        
        if (!phase5Data || phase5Data.samples < 10) {
            return 1.0; // データ不足時は補正なし
        }
        
        const weight = this.getContinuousWeight(phase5Data.samples);
        const theoreticalRate = this.getTheoreticalRate(score);
        const calibratedRate = phase5Data.hitRate;
        
        // 理論値との乖離が大きすぎる場合は保守的に
        if (Math.abs(calibratedRate - theoreticalRate) > 0.5) {
            return 1.0;
        }
        
        // ハイブリッド補正
        const correctionFactor = calibratedRate / Math.max(0.01, theoreticalRate);
        return 1.0 + (correctionFactor - 1.0) * weight;
    }
    
    /**
     * 連続重み関数
     */
    static getContinuousWeight(samples) {
        if (samples < 10) return 0.0;
        if (samples < 30) return (samples - 10) / 20;  // 0～1で連続増加
        return 1.0;
    }
    
    /**
     * Phase 5バケットデータを取得
     */
    static getPhase5BucketData(score) {
        if (!this.phase5Cache) {
            this.initializePhase5Cache();
        }
        
        const bucketKey = `bucket_${Math.floor(score / 10) * 10}`;
        const bucketData = this.phase5Cache[bucketKey];
        
        if (!bucketData) return null;
        
        return {
            samples: bucketData.totalPredictions || 0,
            hits: bucketData.correctPredictions || 0,
            hitRate: bucketData.totalPredictions > 0 ? 
                bucketData.correctPredictions / bucketData.totalPredictions : 0
        };
    }
    
    /**
     * Phase 5キャッシュを初期化
     */
    static initializePhase5Cache() {
        const data = localStorage.getItem('phase5_calibration_data');
        this.phase5Cache = data ? JSON.parse(data) : {};
    }
    
    /**
     * 理論的確率を計算
     */
    static getTheoreticalRate(score) {
        const config = this.CONFIG.SCORE_CALIBRATION;
        return Math.min(0.95, (score / 100) * config.PLACE_BASE + config.PLACE_ADJUSTMENT);
    }
    
    /**
     * Phase 5補正設定（制御用フラグ）
     */
    static PHASE5_LIGHT_CORRECTION_ENABLED = true;  // 初期はOFF
    static PHASE5_CORRECTION_MODE = 'fixed';         // 'fixed' or 'weighted'
    static phase5Cache = null;
    
    /**
     * Phase 5補正の有効化・無効化
     */
    static enablePhase5Correction(mode = 'fixed') {
        this.PHASE5_LIGHT_CORRECTION_ENABLED = true;
        this.PHASE5_CORRECTION_MODE = mode;
        this.initializePhase5Cache();
        console.log(`✅ Phase 5軽量補正を有効化: ${mode}モード`);
    }
    
    static disablePhase5Correction() {
        this.PHASE5_LIGHT_CORRECTION_ENABLED = false;
        console.log('❌ Phase 5軽量補正を無効化');
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
            
            // ケリー係数チェック：1%未満は非表示
            if (analysis.shouldDisplay) {
                raceAnalysis.analyzedHorses.push(analysis);
                
                // 推奨レベル別分類（undefinedチェック追加）
                if (analysis.recommendation && raceAnalysis.summary[analysis.recommendation]) {
                    raceAnalysis.summary[analysis.recommendation].push(analysis);
                } else {
                    // デフォルトでskipに分類
                    raceAnalysis.summary.skip.push(analysis);
                    console.warn('⚠️ 推奨レベル不明のため skip に分類:', horse.name, analysis.recommendation);
                }
            } else {
                // ケリー係数が低い場合はskipに分類
                console.log(`🚫 ${horse.name || horse.number}番: ケリー係数${(analysis.kellyRatio * 100).toFixed(2)}%で非表示`);
                raceAnalysis.summary.skip.push(analysis);
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
                            <th style="padding: 10px 6px; text-align: center; font-size: 0.9em;">馬番</th>
                            <th style="padding: 10px 6px; text-align: center; font-size: 0.9em;">馬名</th>
                            <th style="padding: 10px 6px; text-align: center; font-size: 0.9em;">人気</th>
                            <th style="padding: 10px 6px; text-align: center; font-size: 0.9em;">期待値</th>
                            <th style="padding: 10px 6px; text-align: center; font-size: 0.9em;">購買指数</th>
                            <th style="padding: 10px 6px; text-align: center; font-size: 0.9em;">購買推奨</th>
                            <th style="padding: 10px 6px; text-align: center; font-size: 0.9em;">推定確率</th>
                            <th style="padding: 10px 6px; text-align: center; font-size: 0.9em;">推定配当</th>
                            <th style="padding: 10px 6px; text-align: center; font-size: 0.9em;">推奨</th>
                            <th style="padding: 10px 6px; text-align: center; font-size: 0.9em;">信頼度</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        raceAnalysis.analyzedHorses
            .sort((a, b) => b.expectedValue - a.expectedValue)
            .forEach((analysis, index) => {
                const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
                const recommendationColor = this.getRecommendationColor(analysis.recommendation);
                
                const purchaseColor = this.getPurchaseRecommendationColor(analysis.purchaseRecommendation);
                
                html += `
                    <tr style="background: ${bgColor}; border-bottom: 1px solid #dee2e6;">
                        <td style="padding: 10px 6px; text-align: center; font-weight: bold; font-size: 0.9em;">${analysis.horse.number || '?'}</td>
                        <td style="padding: 10px 6px; font-size: 0.85em;">${analysis.horse.name || '馬' + (analysis.horse.number || '?')}</td>
                        <td style="padding: 10px 6px; text-align: center; font-size: 0.85em;">${analysis.popularity}</td>
                        <td style="padding: 10px 6px; text-align: center; font-weight: bold; color: ${recommendationColor}; font-size: 0.9em;">${analysis.expectedValue.toFixed(2)}</td>
                        <td style="padding: 10px 6px; text-align: center; font-weight: bold; color: ${purchaseColor}; font-size: 0.9em;">${(analysis.purchaseIndex || 0).toFixed(2)}</td>
                        <td style="padding: 10px 6px; text-align: center; color: ${purchaseColor}; font-weight: bold; font-size: 0.8em;">${this.getPurchaseRecommendationDisplay(analysis.purchaseRecommendation)}</td>
                        <td style="padding: 10px 6px; text-align: center; font-size: 0.85em;">${(analysis.estimatedProbability * 100).toFixed(1)}%</td>
                        <td style="padding: 10px 6px; text-align: center; font-size: 0.85em;">${analysis.estimatedOdds.toFixed(0)}円</td>
                        <td style="padding: 10px 6px; text-align: center; color: ${recommendationColor}; font-weight: bold; font-size: 0.8em;">${this.getRecommendationDisplay(analysis.recommendation)}</td>
                        <td style="padding: 10px 6px; text-align: center; font-size: 0.85em;">${(analysis.confidence * 100).toFixed(0)}%</td>
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
     * 購買推奨の表示文字取得
     * @param {string} purchaseRecommendation - 購買推奨レベル
     * @returns {string} 表示文字
     */
    static getPurchaseRecommendationDisplay(purchaseRecommendation) {
        switch (purchaseRecommendation) {
            case 'strong_buy': return '🔥強推奨';
            case 'buy': return '✅推奨';
            case 'weak_buy': return '⚠️弱推奨';
            case 'skip': return '❌見送り';
            default: return '❓不明';
        }
    }
    
    /**
     * 購買推奨の色を取得
     * @param {string} purchaseRecommendation - 購買推奨レベル
     * @returns {string} 色コード
     */
    static getPurchaseRecommendationColor(purchaseRecommendation) {
        switch (purchaseRecommendation) {
            case 'strong_buy': return '#d32f2f'; // 濃い赤
            case 'buy': return '#388e3c'; // 緑
            case 'weak_buy': return '#f57c00'; // オレンジ
            case 'skip': return '#757575'; // グレー
            default: return '#666666'; // デフォルトグレー
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

// Phase 5関連のグローバル関数（ブラウザコンソール用）
window.auditPhase5Data = () => ExpectedValueCalculator.auditPhase5Data();
window.enablePhase5Correction = (mode = 'fixed') => ExpectedValueCalculator.enablePhase5Correction(mode);
window.disablePhase5Correction = () => ExpectedValueCalculator.disablePhase5Correction();
window.generatePhase5EffectReport = () => ExpectedValueCalculator.generatePhase5EffectReport();

console.log('✅ Phase 5統合機能が利用可能になりました');
console.log('🔍 使用方法:');
console.log('  auditPhase5Data() - データ監査');
console.log('  enablePhase5Correction("fixed") - 固定補正有効化');
console.log('  enablePhase5Correction("weighted") - 重み付け補正有効化');
console.log('  disablePhase5Correction() - 補正無効化');
console.log('  generatePhase5EffectReport() - 効果レポート');