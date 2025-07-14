/**
 * Phase 6: ケリー基準による高度な資金管理システム
 * 科学的根拠に基づく最適投資比率計算と動的調整
 */
class KellyCapitalManager {
    constructor() {
        this.currentCapital = 100000; // 初期資金（10万円）
        this.maxBetRatio = 0.10; // 最大投資比率（10%）- 安全性重視
        this.minKellyThreshold = 0.01; // 最小ケリー閾値（1%）
        this.minBetAmount = 100; // 最小投資額
        this.maxBetAmount = 5000; // 最大投資額
        
        // ポートフォリオ制約設定
        this.constraints = {
            maxHorsesPerRace: 5,        // 1レース最大5頭
            minKellyThreshold: 0.01,    // 最小ケリー閾値
            minScoreThreshold: 0.015,   // 最小スコア閾値（ケリー×期待値）
            
            // オプショナルポートフォリオ設定
            optionalExpectedValueThreshold: 1.05,  // 保険候補の期待値閾値
            maxOptionalCandidates: 3,              // オプショナル候補最大数
            optionalAllocationRatio: 0.02,         // オプショナル候補への最大配分比率（2%）
            
            // 競合制御設定
            enableConflictResolution: true,         // 競合解決機能のON/OFF
            maxBetsPerRace: 1,                     // 1レースあたり最大投資数（初期値は1）
            conflictResolutionStrategy: 'highest_score'  // 'highest_score' | 'diversify' | 'kelly_priority'
        };
        this.riskLevel = 'moderate'; // conservative, moderate, aggressive
        this.performanceHistory = this.loadPerformanceHistory();
        this.drawdownLimit = 0.20; // 最大ドローダウン20%
        this.capitalPeak = this.currentCapital;
    }

    /**
     * ケリー基準による最適投資比率計算
     * f = (bp - q) / b
     * f: 最適投資比率, b: オッズ-1, p: 勝率, q: 負け率(1-p)
     */
    calculateKellyRatio(winProbability, odds, confidence = 1.0) {
        console.log('🧮 ケリー基準計算開始:', {
            winProbability: winProbability,
            odds: odds,
            confidence: confidence
        });

        // バリデーション
        if (typeof winProbability !== 'number' || isNaN(winProbability)) {
            console.warn('⚠️ 勝率が数値ではありません:', winProbability);
            return 0;
        }
        
        if (winProbability <= 0 || winProbability >= 1) {
            console.warn('⚠️ 勝率が範囲外:', winProbability);
            return 0;
        }
        
        if (typeof odds !== 'number' || isNaN(odds) || odds <= 1.05) {
            console.warn('⚠️ オッズが不正または低すぎます:', odds);
            return 0;
        }

        // ケリー基準計算
        const b = odds - 1; // 純利益倍率
        
        // 純利益倍率の安全性チェック
        if (b < 0.05) {
            console.warn('⚠️ 純利益倍率が低すぎます:', b.toFixed(3));
            return 0;
        }
        const p = winProbability; // 勝率
        const q = 1 - p; // 負け率
        
        const kellyRatio = (b * p - q) / b;
        
        console.log('📊 ケリー計算詳細:', {
            b: b.toFixed(3),
            p: p.toFixed(3),
            q: q.toFixed(3),
            rawKelly: kellyRatio.toFixed(4)
        });

        // 期待値チェック（ケリー > 0 = 正の期待値）
        if (kellyRatio <= 0) {
            console.log('❌ 負の期待値のため投資非推奨');
            return 0;
        }

        // 信頼度による調整
        const adjustedKelly = kellyRatio * confidence;
        
        // リスクレベル調整
        const riskAdjustedKelly = this.applyRiskAdjustment(adjustedKelly);
        
        console.log('✅ 最終ケリー比率:', riskAdjustedKelly.toFixed(4));
        
        return Math.max(0, Math.min(this.maxBetRatio, riskAdjustedKelly));
    }

    /**
     * リスクレベルに応じたケリー比率調整
     */
    applyRiskAdjustment(kellyRatio) {
        const adjustmentFactors = {
            'conservative': 0.25, // 25%ケリー（非常に保守的）
            'moderate': 0.5,      // 50%ケリー（中程度のリスク）
            'aggressive': 0.75    // 75%ケリー（積極的）
        };
        
        return kellyRatio * (adjustmentFactors[this.riskLevel] || 0.5);
    }

    /**
     * 動的投資額計算
     */
    calculateOptimalBetAmount(expectedValue, winProbability, odds, confidence = 1.0) {
        console.log('💰 動的投資額計算開始:', {
            expectedValue: expectedValue,
            currentCapital: this.currentCapital,
            riskLevel: this.riskLevel
        });

        // ケリー比率計算
        const kellyRatio = this.calculateKellyRatio(winProbability, odds, confidence);
        
        if (kellyRatio <= 0) {
            return {
                amount: 0,
                ratio: 0,
                reasoning: '負の期待値のため投資見送り',
                kellyRatio: kellyRatio,
                recommendation: 'skip'
            };
        }

        // 基本投資額
        let baseAmount = this.currentCapital * kellyRatio;
        
        // ドローダウン制御
        const currentDrawdown = this.getCurrentDrawdown();
        if (currentDrawdown > this.drawdownLimit * 0.8) {
            baseAmount *= 0.5; // ドローダウン接近時は投資額半減
            console.log('⚠️ ドローダウン制御発動:', currentDrawdown.toFixed(3));
        }

        // 期待値による調整
        const expectedValueMultiplier = this.calculateExpectedValueMultiplier(expectedValue);
        const adjustedAmount = baseAmount * expectedValueMultiplier;

        // 上下限制約
        const finalAmount = Math.max(
            this.minBetAmount,
            Math.min(this.maxBetAmount, Math.min(adjustedAmount, this.currentCapital * this.maxBetRatio))
        );

        const finalRatio = finalAmount / this.currentCapital;

        // 推奨レベル判定
        const recommendation = this.determineRecommendationLevel(kellyRatio, expectedValue, confidence);

        console.log('✅ 投資額計算完了:', {
            kellyRatio: kellyRatio.toFixed(4),
            baseAmount: baseAmount.toFixed(0),
            adjustedAmount: adjustedAmount.toFixed(0),
            finalAmount: finalAmount,
            ratio: (finalRatio * 100).toFixed(2) + '%'
        });

        return {
            amount: Math.round(finalAmount),
            ratio: finalRatio,
            kellyRatio: kellyRatio,
            reasoning: this.generateBetReasoning(kellyRatio, expectedValue, currentDrawdown),
            recommendation: recommendation,
            details: {
                baseAmount: Math.round(baseAmount),
                expectedValueMultiplier: expectedValueMultiplier,
                drawdownAdjustment: currentDrawdown > this.drawdownLimit * 0.8 ? 0.5 : 1.0,
                confidence: confidence
            }
        };
    }

    /**
     * 期待値による乗数計算
     */
    calculateExpectedValueMultiplier(expectedValue) {
        if (expectedValue >= 1.5) return 1.2;  // 期待値1.5以上：20%増額
        if (expectedValue >= 1.3) return 1.1;  // 期待値1.3以上：10%増額
        if (expectedValue >= 1.1) return 1.0;  // 期待値1.1以上：標準
        if (expectedValue >= 0.9) return 0.8;  // 期待値0.9以上：20%減額
        return 0.5; // 期待値0.9未満：50%減額
    }

    /**
     * 推奨レベル判定
     */
    determineRecommendationLevel(kellyRatio, expectedValue, confidence) {
        if (kellyRatio <= 0 || expectedValue < 1.0) return 'skip';
        if (kellyRatio >= 0.05 && expectedValue >= 1.3 && confidence >= 0.8) return 'strong_buy';
        if (kellyRatio >= 0.03 && expectedValue >= 1.2 && confidence >= 0.7) return 'buy';
        if (kellyRatio >= 0.01 && expectedValue >= 1.1) return 'light_buy';
        return 'watch';
    }

    /**
     * 候補分類関数（メイン/オプショナル/除外）
     */
    classifyCandidate(candidate) {
        const { kellyRatio, expectedValue } = candidate;
        
        if (kellyRatio >= this.constraints.minKellyThreshold) {
            return 'main';  // メイン候補
        } else if (expectedValue >= this.constraints.optionalExpectedValueThreshold) {
            return 'optional';  // オプショナル候補（保険枠）
        } else {
            return 'reject';  // 除外
        }
    }

    /**
     * 券種独立性判定（同レース内で共存可能か？）
     */
    static BET_TYPE_COMPATIBILITY = {
        // 複勝は他の複勝と共存可能（異なる馬なら）
        'place': {
            'place': 'compatible_different_horse',
            'win': 'conflicting',
            'exacta': 'conflicting', 
            'trifecta': 'conflicting'
        },
        // 単勝は排他的
        'win': {
            'place': 'conflicting',
            'win': 'conflicting',
            'exacta': 'conflicting',
            'trifecta': 'conflicting'
        },
        // 馬連は排他的
        'exacta': {
            'place': 'conflicting',
            'win': 'conflicting',
            'exacta': 'conflicting',
            'trifecta': 'conflicting'
        },
        // 3連複は排他的
        'trifecta': {
            'place': 'conflicting',
            'win': 'conflicting',
            'exacta': 'conflicting',
            'trifecta': 'conflicting'
        }
    };

    /**
     * 競合チェック関数
     */
    checkConflict(candidate1, candidate2) {
        // 異なるレースなら競合なし
        if (candidate1.raceId !== candidate2.raceId) {
            return { hasConflict: false, reason: 'different_race' };
        }

        const betType1 = candidate1.betType || 'place';
        const betType2 = candidate2.betType || 'place';
        
        const compatibility = this.constructor.BET_TYPE_COMPATIBILITY[betType1]?.[betType2];
        
        if (compatibility === 'compatible_different_horse') {
            // 複勝同士の場合、異なる馬なら共存可能
            const horse1 = candidate1.horse?.number || candidate1.horse?.horseNumber;
            const horse2 = candidate2.horse?.number || candidate2.horse?.horseNumber;
            
            if (horse1 !== horse2) {
                return { hasConflict: false, reason: 'different_horse_compatible' };
            } else {
                return { hasConflict: true, reason: 'same_horse_same_bet_type' };
            }
        } else if (compatibility === 'conflicting') {
            return { hasConflict: true, reason: 'bet_type_conflict' };
        }
        
        return { hasConflict: false, reason: 'no_conflict_detected' };
    }

    /**
     * 競合解決アルゴリズム
     */
    resolveConflicts(candidates) {
        if (!this.constraints.enableConflictResolution || candidates.length <= 1) {
            return candidates;
        }

        console.log('🔧 競合解決開始:', candidates.length, '候補');

        // レース別グループ化
        const raceGroups = {};
        candidates.forEach(candidate => {
            const raceId = candidate.raceId || 'default_race';
            if (!raceGroups[raceId]) {
                raceGroups[raceId] = [];
            }
            raceGroups[raceId].push(candidate);
        });

        let resolvedCandidates = [];

        // レースごとに競合解決
        for (const [raceId, raceCandidates] of Object.entries(raceGroups)) {
            if (raceCandidates.length <= this.constraints.maxBetsPerRace) {
                // 制限内なら全て採用
                resolvedCandidates.push(...raceCandidates);
                continue;
            }

            console.log(`🎯 レース${raceId}: ${raceCandidates.length}候補 → 最大${this.constraints.maxBetsPerRace}候補に削減`);

            // 戦略別競合解決
            const resolved = this.applyConflictStrategy(raceCandidates);
            resolvedCandidates.push(...resolved);
        }

        console.log('✅ 競合解決完了:', candidates.length, '→', resolvedCandidates.length, '候補');
        
        return resolvedCandidates;
    }

    /**
     * 戦略別競合解決実行
     */
    applyConflictStrategy(raceCandidates) {
        const strategy = this.constraints.conflictResolutionStrategy;
        const maxBets = this.constraints.maxBetsPerRace;

        switch (strategy) {
            case 'highest_score':
                return raceCandidates
                    .sort((a, b) => b.expectedValueScore - a.expectedValueScore)
                    .slice(0, maxBets);

            case 'kelly_priority':
                return raceCandidates
                    .sort((a, b) => b.kellyRatio - a.kellyRatio)
                    .slice(0, maxBets);

            case 'diversify':
                // 異なる券種を優先しつつ、スコア順で選択
                return this.diversifySelection(raceCandidates, maxBets);

            default:
                console.warn('❌ 不明な競合解決戦略:', strategy);
                return raceCandidates.slice(0, maxBets);
        }
    }

    /**
     * 分散選択アルゴリズム
     */
    diversifySelection(candidates, maxBets) {
        const selected = [];
        const usedBetTypes = new Set();

        // まず各券種から最高スコアを1つずつ選択
        const candidatesByBetType = {};
        candidates.forEach(candidate => {
            const betType = candidate.betType || 'place';
            if (!candidatesByBetType[betType]) {
                candidatesByBetType[betType] = [];
            }
            candidatesByBetType[betType].push(candidate);
        });

        // 券種別に最高スコアを選択
        for (const [betType, typeCandidates] of Object.entries(candidatesByBetType)) {
            if (selected.length >= maxBets) break;
            
            const best = typeCandidates.sort((a, b) => b.expectedValueScore - a.expectedValueScore)[0];
            selected.push(best);
            usedBetTypes.add(betType);
        }

        // 残り枠があれば、全体からスコア順で追加
        if (selected.length < maxBets) {
            const remaining = candidates
                .filter(c => !selected.includes(c))
                .sort((a, b) => b.expectedValueScore - a.expectedValueScore)
                .slice(0, maxBets - selected.length);
            
            selected.push(...remaining);
        }

        return selected.slice(0, maxBets);
    }

    /**
     * 複数馬券の最適配分計算（ケリー×期待値スコア選別版）
     */
    calculatePortfolioAllocation(candidates) {
        console.log('📊 ポートフォリオ最適化開始:', candidates.length, '候補');

        if (!candidates || candidates.length === 0) {
            return {
                totalAmount: 0,
                allocations: [],
                portfolioKelly: 0,
                recommendation: 'skip',
                reasoning: '投資候補がありません'
            };
        }

        const maxHorses = this.constraints.maxHorsesPerRace;
        const minKelly = this.constraints.minKellyThreshold;
        const minScore = this.constraints.minScoreThreshold;

        // Step 1: ケリー比率と期待値スコア計算 + 候補分類
        const scoredCandidates = candidates.map(c => {
            const kelly = this.calculateKellyRatio(
                c.winProbability,
                c.odds,
                c.confidence || 1.0
            );
            const score = kelly * (c.expectedValue || 1.0);
            
            const candidateWithMetrics = {
                ...c,
                kellyRatio: kelly,
                expectedValueScore: score,
                weight: kelly
            };
            
            candidateWithMetrics.category = this.classifyCandidate(candidateWithMetrics);
            return candidateWithMetrics;
        });

        // Step 2: カテゴリ別分類
        const mainCandidates = scoredCandidates
            .filter(c => c.category === 'main' && c.expectedValueScore > minScore)
            .sort((a, b) => b.expectedValueScore - a.expectedValueScore);
            
        const optionalCandidates = scoredCandidates
            .filter(c => c.category === 'optional')
            .sort((a, b) => b.expectedValue - a.expectedValue)
            .slice(0, this.constraints.maxOptionalCandidates);

        console.log('📈 候補分類結果:', {
            main: mainCandidates.map(c => ({
                name: c.horse?.name || c.name,
                kelly: c.kellyRatio.toFixed(4),
                expectedValue: (c.expectedValue || 1.0).toFixed(3),
                score: c.expectedValueScore.toFixed(4),
                category: c.category
            })),
            optional: optionalCandidates.map(c => ({
                name: c.horse?.name || c.name,
                kelly: c.kellyRatio.toFixed(4),
                expectedValue: (c.expectedValue || 1.0).toFixed(3),
                category: c.category
            }))
        });

        if (mainCandidates.length === 0 && optionalCandidates.length === 0) {
            return {
                totalAmount: 0,
                allocations: [],
                portfolioKelly: 0,
                recommendation: 'skip',
                reasoning: '全候補が閾値未満'
            };
        }

        // Step 3: 競合解決処理
        const conflictResolvedMain = this.resolveConflicts(mainCandidates);
        const conflictResolvedOptional = this.resolveConflicts(optionalCandidates);

        // Step 4: メイン候補選択（maxHorses制限）
        const finalMainCandidates = conflictResolvedMain.slice(0, maxHorses);
        const finalOptionalCandidates = conflictResolvedOptional;
        const mainKellyWeight = finalMainCandidates.reduce((sum, c) => sum + c.kellyRatio, 0);

        console.log('🎯 競合解決後の最終選択:', {
            mainCandidates: finalMainCandidates.length,
            optionalCandidates: finalOptionalCandidates.length,
            maxAllowed: maxHorses,
            mainKellyWeight: mainKellyWeight.toFixed(4),
            topMainScores: finalMainCandidates.slice(0, 3).map(c => c.expectedValueScore.toFixed(4)),
            conflictResolutionEnabled: this.constraints.enableConflictResolution
        });

        // Step 5: 動的リスク調整適用
        const recentStats = this.getRecentPerformance(20);
        const riskAdjustment = this.calculateDynamicRiskMultiplier(recentStats);
        
        // Step 6: 2段階予算配分（動的リスク調整済み）
        const baseMainPortfolioKelly = Math.min(mainKellyWeight, this.maxBetRatio * 0.9);
        const adjustedMainPortfolioKelly = baseMainPortfolioKelly * riskAdjustment.multiplier;
        const optionalBudget = this.currentCapital * this.constraints.optionalAllocationRatio * riskAdjustment.multiplier; // オプショナルにも適用
        const mainBudget = this.currentCapital * adjustedMainPortfolioKelly;

        console.log('🔧 動的リスク調整適用:', {
            基本ポートフォリオケリー: baseMainPortfolioKelly.toFixed(4),
            調整後ポートフォリオケリー: adjustedMainPortfolioKelly.toFixed(4),
            リスク倍率: riskAdjustment.multiplier.toFixed(3),
            調整理由: riskAdjustment.reasons,
            制限適用: riskAdjustment.isConstrained
        });

        let allocations = [];

        // Step 6: メイン候補配分
        if (finalMainCandidates.length > 0 && mainKellyWeight > 0) {
            const mainAllocations = finalMainCandidates.map(candidate => {
                const allocationRatio = candidate.kellyRatio / mainKellyWeight;
                const rawAmount = mainBudget * allocationRatio;
                const amount = Math.max(this.minBetAmount, Math.round(rawAmount));

                return {
                    horse: candidate.horse,
                    betType: candidate.betType,
                    amount: amount,
                    proportion: allocationRatio,
                    kellyRatio: candidate.kellyRatio,
                    expectedValue: candidate.expectedValue,
                    expectedValueScore: candidate.expectedValueScore,
                    category: 'main',
                    reasoning: `メイン: スコア${candidate.expectedValueScore.toFixed(3)}による選別`
                };
            });
            allocations.push(...mainAllocations);
        }

        // Step 7: オプショナル候補配分（固定額）
        if (finalOptionalCandidates.length > 0 && optionalBudget > 0) {
            const optionalAmountPerHorse = Math.max(
                this.minBetAmount, 
                Math.floor(optionalBudget / finalOptionalCandidates.length)
            );
            
            const optionalAllocations = finalOptionalCandidates.map(candidate => ({
                horse: candidate.horse,
                betType: candidate.betType,
                amount: optionalAmountPerHorse,
                proportion: optionalAmountPerHorse / (mainBudget + optionalBudget),
                kellyRatio: candidate.kellyRatio,
                expectedValue: candidate.expectedValue,
                expectedValueScore: candidate.expectedValueScore,
                category: 'optional',
                reasoning: `保険: 期待値${candidate.expectedValue.toFixed(3)}による選別`
            }));
            allocations.push(...optionalAllocations);
        }

        const actualTotal = allocations.reduce((sum, allocation) => sum + allocation.amount, 0);
        const totalPortfolioKelly = actualTotal / this.currentCapital;

        return {
            totalAmount: actualTotal,
            allocations: allocations,
            portfolioKelly: totalPortfolioKelly,
            recommendation: this.determinePortfolioRecommendation(totalPortfolioKelly, [...finalMainCandidates, ...finalOptionalCandidates]),
            reasoning: `競合解決済み2段階ポートフォリオ（メイン${finalMainCandidates.length}候補+保険${finalOptionalCandidates.length}候補）`,
            efficiency: actualTotal <= this.currentCapital * this.maxBetRatio ? 'optimal' : 'constrained',
            metrics: {
                candidatesEvaluated: candidates.length,
                mainCandidatesPreConflict: mainCandidates.length,
                optionalCandidatesPreConflict: optionalCandidates.length,
                mainCandidatesPostConflict: finalMainCandidates.length,
                optionalCandidatesPostConflict: finalOptionalCandidates.length,
                candidatesSelected: allocations.length,
                mainBudget: mainBudget,
                optionalBudget: optionalBudget,
                conflictResolutionApplied: this.constraints.enableConflictResolution,
                conflictResolutionStrategy: this.constraints.conflictResolutionStrategy,
                averageMainScore: finalMainCandidates.length > 0 ? 
                    finalMainCandidates.reduce((sum, c) => sum + c.expectedValueScore, 0) / finalMainCandidates.length : 0
            }
        };
    }

    /**
     * ポートフォリオ推奨判定
     */
    determinePortfolioRecommendation(portfolioKelly, candidates) {
        const avgExpectedValue = candidates.reduce((sum, c) => sum + c.expectedValue, 0) / candidates.length;
        
        if (portfolioKelly >= 0.08 && avgExpectedValue >= 1.3) return 'strong_portfolio';
        if (portfolioKelly >= 0.05 && avgExpectedValue >= 1.2) return 'good_portfolio';
        if (portfolioKelly >= 0.02 && avgExpectedValue >= 1.1) return 'moderate_portfolio';
        return 'light_portfolio';
    }

    /**
     * 資金管理状況更新
     */
    updateCapital(raceResult) {
        const previousCapital = this.currentCapital;
        
        console.log('💰 Phase 6資金更新開始:', {
            currentCapital: this.currentCapital,
            raceResult: raceResult
        });
        
        // 投資額と回収額の計算（安全な値アクセス）
        const totalInvestment = raceResult.bets ? 
            raceResult.bets.reduce((sum, bet) => sum + (bet.amount || 0), 0) : 0;
        const totalReturn = raceResult.returns ? 
            raceResult.returns.reduce((sum, ret) => sum + (ret.amount || 0), 0) : 0;
        
        const netResult = totalReturn - totalInvestment;
        
        // NaN検証とエラーハンドリング
        if (isNaN(netResult)) {
            console.error('❌ Phase 6資金計算エラー: netResultがNaN', {
                totalInvestment,
                totalReturn,
                previousCapital: this.currentCapital
            });
            return {
                previousCapital: this.currentCapital,
                currentCapital: this.currentCapital,
                netResult: 0,
                roi: 0,
                drawdown: this.getCurrentDrawdown()
            };
        }
        
        this.currentCapital += netResult;
        
        // 資金がNaNになった場合の修正
        if (isNaN(this.currentCapital)) {
            console.error('❌ Phase 6現在資金がNaNになりました。初期値に修正');
            this.currentCapital = 100000;
            this.capitalPeak = 100000;
        }
        
        // 最高資金更新
        if (this.currentCapital > this.capitalPeak) {
            this.capitalPeak = this.currentCapital;
        }

        // パフォーマンス履歴に記録
        this.performanceHistory.push({
            date: new Date().toISOString(),
            previousCapital: previousCapital,
            currentCapital: this.currentCapital,
            investment: totalInvestment,
            return: totalReturn,
            netResult: netResult,
            roi: totalInvestment > 0 ? (totalReturn / totalInvestment - 1) * 100 : 0,
            drawdown: this.getCurrentDrawdown()
        });

        // 履歴を最新100件に制限
        if (this.performanceHistory.length > 100) {
            this.performanceHistory = this.performanceHistory.slice(-100);
        }

        this.savePerformanceHistory();

        console.log('💼 資金状況更新:', {
            previousCapital: previousCapital,
            currentCapital: this.currentCapital,
            netResult: netResult,
            totalInvestment: totalInvestment,
            totalReturn: totalReturn,
            drawdown: this.getCurrentDrawdown().toFixed(3)
        });

        return {
            previousCapital: previousCapital,
            currentCapital: this.currentCapital,
            netResult: netResult,
            roi: totalInvestment > 0 ? ((totalReturn / totalInvestment - 1) * 100) : 0,
            drawdown: this.getCurrentDrawdown()
        };
    }

    /**
     * 現在のドローダウン計算
     */
    getCurrentDrawdown() {
        if (this.capitalPeak <= 0) return 0;
        return Math.max(0, (this.capitalPeak - this.currentCapital) / this.capitalPeak);
    }

    /**
     * リスクレベル動的調整
     */
    adjustRiskLevel() {
        const drawdown = this.getCurrentDrawdown();
        const recentPerformance = this.getRecentPerformance(10); // 直近10レース

        let newRiskLevel = this.riskLevel;

        // ドローダウンベースの調整
        if (drawdown > 0.15) {
            newRiskLevel = 'conservative';
        } else if (drawdown > 0.10) {
            if (this.riskLevel === 'aggressive') {
                newRiskLevel = 'moderate';
            }
        } else if (drawdown < 0.05 && recentPerformance.winRate > 0.6) {
            // 良好な成績時はリスクレベル上昇を検討
            if (this.riskLevel === 'conservative') {
                newRiskLevel = 'moderate';
            } else if (this.riskLevel === 'moderate' && recentPerformance.roi > 20) {
                newRiskLevel = 'aggressive';
            }
        }

        if (newRiskLevel !== this.riskLevel) {
            console.log('🔄 リスクレベル調整:', this.riskLevel, '->', newRiskLevel);
            this.riskLevel = newRiskLevel;
        }

        return newRiskLevel;
    }

    /**
     * 直近パフォーマンス分析（動的リスク調整対応版）
     */
    getRecentPerformance(count = 20) {
        const recentRaces = this.performanceHistory.slice(-count);
        
        if (recentRaces.length === 0) {
            return {
                totalRaces: 0,
                winRate: 0,
                averageROI: 0,
                totalReturn: 0,
                maxDrawdown: 0,
                consecutiveLosses: 0,
                consecutiveWins: 0,
                volatility: 0
            };
        }

        const wins = recentRaces.filter(race => race.netResult > 0).length;
        const totalInvestment = recentRaces.reduce((sum, race) => sum + race.investment, 0);
        const totalReturn = recentRaces.reduce((sum, race) => sum + race.return, 0);
        const maxDrawdown = Math.max(...recentRaces.map(race => race.drawdown));

        // 連勝・連敗の計算
        let consecutiveLosses = 0;
        let consecutiveWins = 0;
        let currentStreak = 0;
        let isWinning = null;

        for (let i = recentRaces.length - 1; i >= 0; i--) {
            const isWin = recentRaces[i].netResult > 0;
            
            if (isWinning === null) {
                isWinning = isWin;
                currentStreak = 1;
            } else if (isWinning === isWin) {
                currentStreak++;
            } else {
                break;
            }
        }

        if (isWinning === false) {
            consecutiveLosses = currentStreak;
        } else if (isWinning === true) {
            consecutiveWins = currentStreak;
        }

        // ボラティリティ（ROIの標準偏差）
        const rois = recentRaces.map(race => {
            return race.investment > 0 ? (race.return / race.investment - 1) * 100 : 0;
        });
        const avgROI = rois.reduce((sum, roi) => sum + roi, 0) / rois.length;
        const volatility = Math.sqrt(
            rois.reduce((sum, roi) => sum + Math.pow(roi - avgROI, 2), 0) / rois.length
        );

        return {
            totalRaces: recentRaces.length,
            winRate: wins / recentRaces.length,
            averageROI: totalInvestment > 0 ? (totalReturn / totalInvestment - 1) * 100 : 0,
            totalReturn: totalReturn,
            maxDrawdown: maxDrawdown,
            consecutiveLosses: consecutiveLosses,
            consecutiveWins: consecutiveWins,
            volatility: volatility
        };
    }

    /**
     * 動的リスクマルチプライヤー計算
     */
    calculateDynamicRiskMultiplier(recentStats) {
        let multiplier = 1.0;
        const adjustmentReasons = [];

        console.log('🔧 動的リスク調整開始:', {
            winRate: recentStats.winRate.toFixed(3),
            averageROI: recentStats.averageROI.toFixed(2) + '%',
            drawdown: (this.getCurrentDrawdown() * 100).toFixed(1) + '%',
            consecutiveLosses: recentStats.consecutiveLosses,
            consecutiveWins: recentStats.consecutiveWins
        });

        // 1. 勝率による調整
        if (recentStats.winRate < 0.2) {
            multiplier *= 0.7;
            adjustmentReasons.push('低勝率による減額(-30%)');
        } else if (recentStats.winRate > 0.4) {
            multiplier *= 1.2;
            adjustmentReasons.push('高勝率による増額(+20%)');
        } else if (recentStats.winRate > 0.35) {
            multiplier *= 1.1;
            adjustmentReasons.push('良好勝率による増額(+10%)');
        }

        // 2. ROIによる調整
        const roiMultiplier = 1 + (recentStats.averageROI / 100);
        if (roiMultiplier < 1.0) {
            multiplier *= 0.8;
            adjustmentReasons.push('負ROIによる減額(-20%)');
        } else if (roiMultiplier > 1.1) {
            multiplier *= 1.1;
            adjustmentReasons.push('高ROIによる増額(+10%)');
        }

        // 3. ドローダウンによる調整
        const currentDrawdown = this.getCurrentDrawdown();
        if (currentDrawdown > 0.2) {
            multiplier *= 0.6;
            adjustmentReasons.push('高ドローダウンによる大幅減額(-40%)');
        } else if (currentDrawdown > 0.15) {
            multiplier *= 0.8;
            adjustmentReasons.push('中ドローダウンによる減額(-20%)');
        } else if (currentDrawdown > 0.1) {
            multiplier *= 0.9;
            adjustmentReasons.push('軽度ドローダウンによる減額(-10%)');
        }

        // 4. 連敗による調整
        if (recentStats.consecutiveLosses >= 5) {
            multiplier *= 0.5;
            adjustmentReasons.push('5連敗以上による大幅減額(-50%)');
        } else if (recentStats.consecutiveLosses >= 3) {
            multiplier *= 0.7;
            adjustmentReasons.push('3連敗以上による減額(-30%)');
        }

        // 5. 連勝による調整（ただし過度なリスク増加は避ける）
        if (recentStats.consecutiveWins >= 5) {
            multiplier *= 1.1;
            adjustmentReasons.push('5連勝以上による軽度増額(+10%)');
        }

        // 6. ボラティリティによる調整
        if (recentStats.volatility > 50) {
            multiplier *= 0.9;
            adjustmentReasons.push('高ボラティリティによる減額(-10%)');
        }

        // 安全制限（0.3-1.5倍の範囲）
        const finalMultiplier = Math.max(0.3, Math.min(multiplier, 1.5));
        
        console.log('📊 リスク調整結果:', {
            基本倍率: multiplier.toFixed(3),
            最終倍率: finalMultiplier.toFixed(3),
            制限適用: multiplier !== finalMultiplier ? 'あり' : 'なし',
            調整理由: adjustmentReasons.length > 0 ? adjustmentReasons : ['標準運用']
        });

        return {
            multiplier: finalMultiplier,
            reasons: adjustmentReasons,
            rawMultiplier: multiplier,
            isConstrained: multiplier !== finalMultiplier
        };
    }

    /**
     * 投資理由生成
     */
    generateBetReasoning(kellyRatio, expectedValue, drawdown) {
        const reasons = [];

        if (kellyRatio > 0.05) {
            reasons.push('高いケリー比率');
        } else if (kellyRatio > 0.02) {
            reasons.push('適正なケリー比率');
        } else {
            reasons.push('低いケリー比率');
        }

        if (expectedValue >= 1.3) {
            reasons.push('優良な期待値');
        } else if (expectedValue >= 1.1) {
            reasons.push('良好な期待値');
        } else {
            reasons.push('限界的期待値');
        }

        if (drawdown > this.drawdownLimit * 0.8) {
            reasons.push('ドローダウン制御中');
        }

        return reasons.join('、');
    }

    /**
     * 資金管理統計レポート生成
     */
    generateCapitalReport() {
        const performance = this.getRecentPerformance(50);
        const currentDrawdown = this.getCurrentDrawdown();
        
        return {
            capitalStatus: {
                currentCapital: this.currentCapital,
                initialCapital: 100000,
                totalReturn: this.currentCapital - 100000,
                totalReturnRate: ((this.currentCapital / 100000) - 1) * 100,
                capitalPeak: this.capitalPeak,
                currentDrawdown: currentDrawdown
            },
            riskManagement: {
                riskLevel: this.riskLevel,
                maxBetRatio: this.maxBetRatio,
                drawdownLimit: this.drawdownLimit,
                isDrawdownControlActive: currentDrawdown > this.drawdownLimit * 0.8
            },
            recentPerformance: performance,
            recommendations: this.generateCapitalRecommendations(performance, currentDrawdown)
        };
    }

    /**
     * 資金管理推奨事項生成
     */
    generateCapitalRecommendations(performance, drawdown) {
        const recommendations = [];

        if (drawdown > this.drawdownLimit * 0.9) {
            recommendations.push('⚠️ 重要: ドローダウン限界接近、投資額削減推奨');
        } else if (drawdown > this.drawdownLimit * 0.7) {
            recommendations.push('⚠️ 注意: ドローダウン上昇、慎重な投資推奨');
        }

        if (performance.totalRaces >= 10) {
            if (performance.winRate < 0.3) {
                recommendations.push('📉 勝率低下中、戦略見直しを検討');
            } else if (performance.averageROI < -10) {
                recommendations.push('📉 ROI低下中、リスクレベル下げを検討');
            } else if (performance.winRate > 0.7 && performance.averageROI > 20) {
                recommendations.push('📈 好調継続中、現在の戦略を維持');
            }
        }

        if (this.currentCapital > this.capitalPeak * 1.1) {
            recommendations.push('🎯 新高値更新、利益確定を検討');
        }

        return recommendations;
    }

    /**
     * データ永続化
     */
    savePerformanceHistory() {
        try {
            const data = {
                currentCapital: this.currentCapital,
                capitalPeak: this.capitalPeak,
                riskLevel: this.riskLevel,
                performanceHistory: this.performanceHistory,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('kelly_capital_data', JSON.stringify(data));
        } catch (error) {
            console.error('資金管理データの保存に失敗:', error);
        }
    }

    loadPerformanceHistory() {
        try {
            const saved = localStorage.getItem('kelly_capital_data');
            if (saved) {
                const data = JSON.parse(saved);
                this.currentCapital = data.currentCapital || 100000;
                this.capitalPeak = data.capitalPeak || this.currentCapital;
                this.riskLevel = data.riskLevel || 'moderate';
                return data.performanceHistory || [];
            }
        } catch (error) {
            console.warn('資金管理データの読み込みに失敗:', error);
        }
        return [];
    }

    /**
     * システムリセット
     */
    resetCapitalData() {
        this.currentCapital = 100000;
        this.capitalPeak = 100000;
        this.riskLevel = 'moderate';
        this.performanceHistory = [];
        localStorage.removeItem('kelly_capital_data');
        console.log('✅ 資金管理データがリセットされました');
    }
}

// グローバル変数として公開
window.KellyCapitalManager = KellyCapitalManager;

// デバッグ用グローバル関数
window.checkKellyCapital = () => {
    const manager = new KellyCapitalManager();
    console.log('💰 資金管理状況:', manager.generateCapitalReport());
    return manager.generateCapitalReport();
};

window.simulateKellyBet = (winProb, odds, expectedValue = null) => {
    const manager = new KellyCapitalManager();
    const ev = expectedValue || (winProb * odds);
    const result = manager.calculateOptimalBetAmount(ev, winProb, odds, 0.8);
    console.log('🎯 ケリー投資シミュレーション:', result);
    return result;
};

/**
 * Phase 6パフォーマンス統計表示関数
 */
/**
 * ポートフォリオ最適化テスト関数
 */
window.testPortfolioOptimization = () => {
    console.log('🧪 ポートフォリオ最適化テスト開始');
    
    const manager = new KellyCapitalManager();
    
    // 競合解決テスト用データ（異なるレース・券種を含む）
    const testCandidates = [
        // 第1レース メイン候補
        { name: '1R-馬A', raceId: 'race_1', expectedValue: 1.4, winProbability: 0.40, odds: 3.5, horse: {name: '1R-馬A', number: 1}, betType: 'place' },
        { name: '1R-馬B', raceId: 'race_1', expectedValue: 1.2, winProbability: 0.35, odds: 3.4, horse: {name: '1R-馬B', number: 2}, betType: 'win' },
        { name: '1R-馬C', raceId: 'race_1', expectedValue: 1.6, winProbability: 0.25, odds: 6.4, horse: {name: '1R-馬C', number: 3}, betType: 'place' },
        
        // 第2レース メイン候補
        { name: '2R-馬D', raceId: 'race_2', expectedValue: 1.3, winProbability: 0.45, odds: 2.9, horse: {name: '2R-馬D', number: 1}, betType: 'place' },
        { name: '2R-馬E', raceId: 'race_2', expectedValue: 1.1, winProbability: 0.30, odds: 3.7, horse: {name: '2R-馬E', number: 2}, betType: 'place' },
        
        // 第1レース オプショナル候補（競合テスト）
        { name: '1R-馬F', raceId: 'race_1', expectedValue: 1.08, winProbability: 0.18, odds: 6.0, horse: {name: '1R-馬F', number: 4}, betType: 'exacta' },
        { name: '1R-馬G', raceId: 'race_1', expectedValue: 1.06, winProbability: 0.15, odds: 7.0, horse: {name: '1R-馬G', number: 5}, betType: 'place' },
        
        // 除外候補
        { name: '3R-馬H', raceId: 'race_3', expectedValue: 0.95, winProbability: 0.50, odds: 1.9, horse: {name: '3R-馬H', number: 1}, betType: 'place' }
    ];
    
    const result = manager.calculatePortfolioAllocation(testCandidates);
    
    console.log('📊 競合解決対応 2段階ポートフォリオ テスト結果:');
    console.log('候補評価数:', result.metrics.candidatesEvaluated);
    console.log('競合解決前 - メイン:', result.metrics.mainCandidatesPreConflict, '/ オプショナル:', result.metrics.optionalCandidatesPreConflict);
    console.log('競合解決後 - メイン:', result.metrics.mainCandidatesPostConflict, '/ オプショナル:', result.metrics.optionalCandidatesPostConflict);
    console.log('競合解決戦略:', result.metrics.conflictResolutionStrategy);
    console.log('総投資額:', result.totalAmount.toLocaleString() + '円');
    console.log('メイン予算:', result.metrics.mainBudget.toLocaleString() + '円');
    console.log('オプショナル予算:', result.metrics.optionalBudget.toLocaleString() + '円');
    
    const mainAllocations = result.allocations.filter(c => c.category === 'main');
    const optionalAllocations = result.allocations.filter(c => c.category === 'optional');
    
    if (mainAllocations.length > 0) {
        console.log('\n🎯 メイン候補（競合解決済み）:');
        console.table(mainAllocations.map(c => ({
            馬名: c.horse.name,
            レース: (c.name || '').split('-')[0] || 'N/A',
            券種: c.betType,
            ケリー比率: (c.kellyRatio * 100).toFixed(2) + '%',
            期待値: c.expectedValue?.toFixed(3),
            スコア: c.expectedValueScore.toFixed(4),
            投資額: c.amount.toLocaleString() + '円'
        })));
    }
    
    if (optionalAllocations.length > 0) {
        console.log('\n🛡️ オプショナル候補（保険枠・競合解決済み）:');
        console.table(optionalAllocations.map(c => ({
            馬名: c.horse.name,
            レース: (c.name || '').split('-')[0] || 'N/A',
            券種: c.betType,
            ケリー比率: (c.kellyRatio * 100).toFixed(2) + '%',
            期待値: c.expectedValue?.toFixed(3),
            投資額: c.amount.toLocaleString() + '円'
        })));
    }
    
    return result;
};

window.showPhase6PerformanceStats = () => {
    try {
        const manager = new KellyCapitalManager();
        const report = manager.generateCapitalReport();
        
        let display = `
=== 🏆 Phase 6: ケリー資金管理パフォーマンス ===

💰 資金状況:
  現在資金: ${report.capitalStatus.currentCapital.toLocaleString()}円
  初期資金: ${report.capitalStatus.initialCapital.toLocaleString()}円  
  総収益: ${report.capitalStatus.totalReturn >= 0 ? '+' : ''}${report.capitalStatus.totalReturn.toLocaleString()}円
  収益率: ${report.capitalStatus.totalReturnRate >= 0 ? '+' : ''}${report.capitalStatus.totalReturnRate.toFixed(2)}%
  最高資金: ${report.capitalStatus.capitalPeak.toLocaleString()}円
  現在ドローダウン: ${(report.capitalStatus.currentDrawdown * 100).toFixed(2)}%

🎯 リスク管理:
  現在リスクレベル: ${report.riskManagement.riskLevel}
  最大投資比率: ${(report.riskManagement.maxBetRatio * 100)}%
  ドローダウン限界: ${(report.riskManagement.drawdownLimit * 100)}%
  ドローダウン制御: ${report.riskManagement.isDrawdownControlActive ? '🔴 発動中' : '🟢 正常'}

📊 直近パフォーマンス(最大50レース):
  総レース数: ${report.recentPerformance.totalRaces}
  勝率: ${(report.recentPerformance.winRate * 100).toFixed(1)}%
  平均ROI: ${report.recentPerformance.averageROI >= 0 ? '+' : ''}${report.recentPerformance.averageROI.toFixed(2)}%
  最大ドローダウン: ${(report.recentPerformance.maxDrawdown * 100).toFixed(2)}%

💡 推奨事項:`;

        if (report.recommendations.length > 0) {
            report.recommendations.forEach(rec => {
                display += `\n  ${rec}`;
            });
        } else {
            display += '\n  🟢 現在の運用方針を継続';
        }

        display += `\n\n📈 ケリー基準資金管理システムは正常に動作中`;
        
        alert(display);
        
        console.log('✅ Phase 6パフォーマンス統計:', report);
        
    } catch (error) {
        console.error('❌ Phase 6パフォーマンス表示エラー:', error);
        alert('Phase 6パフォーマンス統計の表示でエラーが発生しました: ' + error.message);
    }
};