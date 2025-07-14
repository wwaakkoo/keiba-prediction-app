/**
 * Phase 4戦略強化システム
 * 見送り判定の自己学習とストラテジー体系化
 */
class StrategyEnhancement {
    constructor() {
        this.skipHistory = this.loadSkipHistory();
        this.strategyCategories = this.initializeStrategyCategories();
        this.falseNegativeThreshold = 0.3; // 30%以上のFalse Negativeで学習調整
    }

    /**
     * 戦略体系化（UI表示用）
     */
    initializeStrategyCategories() {
        return {
            safety: {
                name: 'セーフティ戦略',
                description: '損失回避を最優先',
                color: '#4caf50',
                icon: '🛡️',
                characteristics: ['低リスク', '堅実投資', '資金保護重視']
            },
            neutral: {
                name: 'ニュートラル戦略',
                description: 'バランス重視の標準戦略',
                color: '#ff9800',
                icon: '⚖️',
                characteristics: ['中リスク', 'バランス投資', '安定成長']
            },
            aggressive: {
                name: 'アグレッシブ戦略',
                description: '高リターンを狙う積極戦略',
                color: '#f44336',
                icon: '🚀',
                characteristics: ['高リスク', '積極投資', '大きな利益狙い']
            },
            conservative: {
                name: 'コンサバティブ戦略',
                description: '極めて保守的な投資',
                color: '#2196f3',
                icon: '🏦',
                characteristics: ['超低リスク', '確実性重視', '長期安定']
            }
        };
    }

    /**
     * 見送り履歴の自己学習分析
     */
    analyzeFalseNegatives(recentRaceResults) {
        const analysis = {
            totalSkipped: 0,
            shouldHaveBet: 0,
            correctSkips: 0,
            falseNegativeRate: 0,
            recommendations: []
        };

        if (!recentRaceResults || recentRaceResults.length === 0) {
            return analysis;
        }

        recentRaceResults.forEach(race => {
            if (race.decision === 'skip') {
                analysis.totalSkipped++;
                
                // 実際の結果を分析
                const actualROI = this.calculateActualROI(race.raceResult);
                const expectedValue = race.expectedValue || 0;
                
                if (actualROI > 110) { // 110%以上のROIが出ていた場合
                    analysis.shouldHaveBet++;
                    
                    // False Negativeの詳細分析
                    this.analyzeSkipError(race, actualROI, analysis);
                } else {
                    analysis.correctSkips++;
                }
            }
        });

        analysis.falseNegativeRate = analysis.totalSkipped > 0 ? 
            (analysis.shouldHaveBet / analysis.totalSkipped) : 0;

        // 学習推奨の生成
        if (analysis.falseNegativeRate > this.falseNegativeThreshold) {
            analysis.recommendations.push({
                type: 'threshold_adjustment',
                message: `見送り閾値が厳しすぎます（False Negative率${(analysis.falseNegativeRate * 100).toFixed(1)}%）`,
                suggestion: '期待値閾値を1.1から1.05に緩和することを推奨'
            });
        }

        return analysis;
    }

    /**
     * 見送りエラーの詳細分析
     */
    analyzeSkipError(race, actualROI, analysis) {
        const errorTypes = [];

        // 期待値の過小評価
        if (race.maxExpectedValue < 1.1 && actualROI > 150) {
            errorTypes.push('期待値過小評価');
            analysis.recommendations.push({
                type: 'expected_value_calibration',
                message: '期待値計算の精度向上が必要',
                suggestion: 'オッズ分析の重み付けを調整'
            });
        }

        // 人気薄の妙味見逃し
        if (race.winnerPopularity >= 7 && actualROI > 200) {
            errorTypes.push('人気薄妙味見逃し');
            analysis.recommendations.push({
                type: 'outsider_detection',
                message: '人気薄の価値評価が不十分',
                suggestion: '穴馬発見アルゴリズムの調整'
            });
        }

        // レース特性の誤判定
        if (race.raceType === 'difficult_race' && actualROI > 120) {
            errorTypes.push('レース特性誤判定');
            analysis.recommendations.push({
                type: 'race_classification',
                message: 'レースタイプ分類の精度向上が必要',
                suggestion: 'レース特性分析パラメータの見直し'
            });
        }

        race.errorTypes = errorTypes;
    }

    /**
     * 実際のROI計算
     */
    calculateActualROI(raceResult) {
        if (!raceResult || !raceResult.payouts) return 0;
        
        // 簡略化された計算（実際の実装ではより詳細な計算が必要）
        const placePayouts = raceResult.payouts.place || {};
        const avgPayout = Object.values(placePayouts).reduce((sum, payout) => sum + payout, 0) / 
                         Object.keys(placePayouts).length;
        
        return avgPayout || 100; // デフォルト100%
    }

    /**
     * 戦略の自動調整
     */
    adjustStrategy(currentStrategy, learningData) {
        const adjustedStrategy = { ...currentStrategy };
        
        // False Negative率に基づく調整
        if (learningData.falseNegativeRate > this.falseNegativeThreshold) {
            // より積極的な戦略に調整
            adjustedStrategy.expectedValueThreshold *= 0.95; // 5%緩和
            adjustedStrategy.confidenceThreshold *= 0.9;     // 10%緩和
            
            console.log('📈 戦略調整: より積極的に変更');
        } else if (learningData.falseNegativeRate < 0.1) {
            // より保守的な戦略に調整
            adjustedStrategy.expectedValueThreshold *= 1.05; // 5%厳格化
            adjustedStrategy.confidenceThreshold *= 1.1;     // 10%厳格化
            
            console.log('📉 戦略調整: より保守的に変更');
        }

        return adjustedStrategy;
    }

    /**
     * 見送り判定の学習履歴保存
     */
    recordSkipDecision(raceData, decision, reasoning, actualResult = null) {
        const record = {
            id: this.generateRecordId(),
            timestamp: new Date().toISOString(),
            raceData: {
                type: raceData.type,
                maxExpectedValue: raceData.maxExpectedValue,
                competitiveness: raceData.competitiveness,
                avgConfidence: raceData.avgConfidence
            },
            decision: decision,
            reasoning: reasoning,
            actualResult: actualResult,
            verified: !!actualResult
        };

        this.skipHistory.push(record);
        this.saveSkipHistory();
        
        // 履歴が1000件を超えたら古いものを削除
        if (this.skipHistory.length > 1000) {
            this.skipHistory = this.skipHistory.slice(-1000);
        }

        return record.id;
    }

    /**
     * 見送り判定の学習効果レポート
     */
    generateLearningReport() {
        if (this.skipHistory.length < 10) {
            return {
                status: 'insufficient_data',
                message: '学習データが不足しています（最低10レース必要）'
            };
        }

        const recentHistory = this.skipHistory.slice(-50); // 直近50レース
        const verifiedHistory = recentHistory.filter(record => record.verified);
        
        if (verifiedHistory.length < 5) {
            return {
                status: 'insufficient_verification',
                message: '検証済みデータが不足しています'
            };
        }

        const analysis = this.analyzeFalseNegatives(verifiedHistory);
        
        return {
            status: 'success',
            analysis: analysis,
            summary: {
                totalAnalyzed: verifiedHistory.length,
                skipAccuracy: ((analysis.correctSkips / analysis.totalSkipped) * 100).toFixed(1),
                falseNegativeRate: (analysis.falseNegativeRate * 100).toFixed(1),
                learningTrend: this.calculateLearningTrend()
            },
            recommendations: analysis.recommendations
        };
    }

    /**
     * 学習トレンド計算
     */
    calculateLearningTrend() {
        if (this.skipHistory.length < 20) return 'neutral';
        
        const recent = this.skipHistory.slice(-10);
        const previous = this.skipHistory.slice(-20, -10);
        
        const recentAccuracy = this.calculateAccuracy(recent);
        const previousAccuracy = this.calculateAccuracy(previous);
        
        const improvement = recentAccuracy - previousAccuracy;
        
        if (improvement > 0.05) return 'improving';
        if (improvement < -0.05) return 'declining';
        return 'stable';
    }

    /**
     * 精度計算
     */
    calculateAccuracy(records) {
        const verified = records.filter(r => r.verified);
        if (verified.length === 0) return 0;
        
        const correct = verified.filter(r => {
            if (r.decision === 'skip') {
                return !r.actualResult || r.actualResult.roi <= 110;
            } else {
                return r.actualResult && r.actualResult.roi > 110;
            }
        });
        
        return correct.length / verified.length;
    }

    /**
     * データ永続化
     */
    saveSkipHistory() {
        try {
            localStorage.setItem('phase4_skip_history', JSON.stringify(this.skipHistory));
        } catch (error) {
            console.warn('見送り履歴の保存に失敗:', error);
        }
    }

    loadSkipHistory() {
        try {
            const saved = localStorage.getItem('phase4_skip_history');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.warn('見送り履歴の読み込みに失敗:', error);
            return [];
        }
    }

    /**
     * ユーティリティ
     */
    generateRecordId() {
        return `skip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 戦略カテゴリの取得
     */
    getStrategyCategory(strategyName) {
        return this.strategyCategories[strategyName] || this.strategyCategories.neutral;
    }

    /**
     * UI用戦略情報の生成
     */
    generateStrategyUI(strategy, confidence) {
        const category = this.getStrategyCategory(strategy.focus || 'neutral');
        
        return {
            category: category,
            confidence: confidence,
            riskLevel: strategy.riskLevel || 'medium',
            displayName: category.name,
            description: category.description,
            styleInfo: {
                backgroundColor: category.color,
                icon: category.icon
            }
        };
    }
}

// グローバル変数として公開
window.StrategyEnhancement = StrategyEnhancement;