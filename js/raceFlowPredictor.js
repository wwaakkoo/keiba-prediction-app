/**
 * Phase 8β: 展開予想システム
 * レースの隊列・展開を予測し、各馬の有利不利を分析
 * 
 * 設計思想：
 * - 既存システムと完全分離
 * - 段階的な精度向上（Step 1→2→3）
 * - 可視化との高い親和性
 */
class RaceFlowPredictor {
    constructor() {
        this.currentPrediction = null;
        this.horses = [];
        
        // 脚質定義
        this.runningStyles = {
            ESCAPE: 'escape',      // 逃げ
            LEADER: 'leader',      // 先行
            STALKER: 'stalker',    // 差し
            CLOSER: 'closer'       // 追込
        };
        
        // コース・距離別データ
        this.courseData = {
            // 距離別ペース傾向
            paceProfiles: {
                sprint: { fastStart: 0.8, sustainPace: 0.6 },     // 短距離
                mile: { fastStart: 0.6, sustainPace: 0.8 },       // マイル
                classic: { fastStart: 0.4, sustainPace: 0.9 },    // 中長距離
                stayer: { fastStart: 0.3, sustainPace: 0.95 }     // 長距離
            },
            
            // 枠順有利不利（内枠有利度）
            gateAdvantage: {
                1: 0.05, 2: 0.03, 3: 0.02, 4: 0.01, 5: 0.00,
                6: -0.01, 7: -0.02, 8: -0.03, 9: -0.04, 10: -0.05,
                11: -0.06, 12: -0.07, 13: -0.08, 14: -0.09, 15: -0.10
            }
        };
        
        console.log('🏇 展開予想システム初期化完了');
    }

    /**
     * レース展開の予測実行（メインエントリーポイント）
     * @param {Array} horses - 馬データ配列
     * @param {Object} raceConditions - レース条件
     * @returns {Object} 展開予測結果
     */
    predictRaceFlow(horses, raceConditions = {}) {
        console.log('🏇 展開予想分析開始');
        
        this.horses = horses;
        this.raceConditions = raceConditions;
        
        // Step 1: 基本的な展開スコア算出
        const basicFlowAnalysis = this.calculateBasicFlowScores();
        
        // Step 2: コーナー位置の推定
        const cornerPositions = this.predictCornerPositions(basicFlowAnalysis);
        
        // Step 3: 最終順位への影響度計算
        const finalImpacts = this.calculateFinalImpacts(cornerPositions);
        
        // 総合結果の生成
        this.currentPrediction = {
            timestamp: new Date().toISOString(),
            raceConditions: this.raceConditions,
            basicAnalysis: basicFlowAnalysis,
            cornerPositions: cornerPositions,
            finalImpacts: finalImpacts,
            summary: this.generatePredictionSummary(finalImpacts)
        };
        
        console.log('🏇 展開予想分析完了');
        return this.currentPrediction;
    }

    /**
     * Step 1: 基本展開スコア算出
     * 脚質 × 枠順の基本的な組み合わせ効果
     */
    calculateBasicFlowScores() {
        return this.horses.map((horse, index) => {
            // より詳細な馬データ構造の確認
            console.log(`🔍 馬データ構造確認 ${index + 1}:`, {
                horse: horse,
                horseKeys: Object.keys(horse),
                name: horse.name,
                number: horse.number,
                gateNumber: horse.gateNumber,
                horseNumber: horse.horseNumber,
                frameNumber: horse.frameNumber,
                odds: horse.odds
            });
            
            const style = this.detectRunningStyle(horse, index);
            
            // 枠順の取得を改善（複数の可能性を考慮）
            let gate = 1; // デフォルト値
            if (horse.gateNumber) gate = horse.gateNumber;
            else if (horse.number) gate = horse.number;
            else if (horse.horseNumber) gate = horse.horseNumber;
            else if (horse.frameNumber) gate = horse.frameNumber;
            else gate = index + 1; // 最後の手段として順番を使用
            
            // 脚質別基本スコア
            const styleScore = this.getStyleBaseScore(style);
            
            // 枠順補正
            const gateAdvantage = this.courseData.gateAdvantage[gate] || 0;
            
            // 基本展開スコア
            const basicFlowScore = styleScore + gateAdvantage;
            
            console.log(`🏇 ${horse.name || `${index + 1}番`}: 枠${gate} 脚質${style} スコア${basicFlowScore.toFixed(3)}`);
            
            return {
                horse: horse,
                runningStyle: style,
                gateNumber: gate,
                styleScore: styleScore,
                gateAdvantage: gateAdvantage,
                basicFlowScore: basicFlowScore,
                positionAdvantage: this.calculatePositionAdvantage(style, gate)
            };
        });
    }

    /**
     * 脚質の検出
     */
    detectRunningStyle(horse, index) {
        // 既存データから脚質を推定
        if (horse.runningStyle) {
            return horse.runningStyle;
        }
        
        // より詳細な脚質推定ロジック
        const odds = horse.odds || horse.placeOdds || 10;
        const score = horse.score || horse.finalScore || 50;
        const weight = horse.weight || 57;
        
        console.log(`🔍 脚質判定 ${horse.name || `${index + 1}番`}:`, {
            odds: odds,
            score: score,
            weight: weight
        });
        
        // 複合的な脚質判定
        let stylePoints = {
            escape: 0,
            leader: 0,
            stalker: 0,
            closer: 0
        };
        
        // オッズベースの判定
        if (odds < 2.5) {
            stylePoints.escape += 2;
            stylePoints.leader += 3;
        } else if (odds < 5) {
            stylePoints.leader += 2;
            stylePoints.stalker += 2;
        } else if (odds < 12) {
            stylePoints.stalker += 3;
            stylePoints.closer += 1;
        } else {
            stylePoints.closer += 3;
            stylePoints.stalker += 1;
        }
        
        // スコアベースの判定
        if (score > 75) {
            stylePoints.escape += 1;
            stylePoints.leader += 2;
        } else if (score < 40) {
            stylePoints.closer += 2;
        }
        
        // 斤量ベースの判定（軽い馬は逃げ・先行しやすい）
        if (weight < 55) {
            stylePoints.escape += 1;
            stylePoints.leader += 1;
        } else if (weight > 58) {
            stylePoints.closer += 1;
        }
        
        // 枠順ベースの判定
        const gate = index + 1; // 仮の枠順
        if (gate <= 3) {
            stylePoints.escape += 1;
            stylePoints.leader += 1;
        } else if (gate >= 10) {
            stylePoints.closer += 1;
        }
        
        // 最高ポイントの脚質を選択
        const maxPoints = Math.max(...Object.values(stylePoints));
        const selectedStyle = Object.keys(stylePoints).find(style => stylePoints[style] === maxPoints);
        
        // 脚質マッピングの修正
        const styleMapping = {
            'escape': this.runningStyles.ESCAPE,
            'leader': this.runningStyles.LEADER,
            'stalker': this.runningStyles.STALKER,
            'closer': this.runningStyles.CLOSER
        };
        
        const finalStyle = styleMapping[selectedStyle] || this.runningStyles.STALKER;
        
        console.log(`🎯 脚質判定結果 ${horse.name || `${index + 1}番`}:`, {
            points: stylePoints,
            selected: selectedStyle,
            finalStyle: finalStyle,
            runningStylesCheck: this.runningStyles
        });
        
        return finalStyle;
    }

    /**
     * 脚質別基本スコア
     */
    getStyleBaseScore(style) {
        const baseScores = {
            [this.runningStyles.ESCAPE]: 0.15,   // 逃げ：高い位置取り有利
            [this.runningStyles.LEADER]: 0.10,   // 先行：やや有利
            [this.runningStyles.STALKER]: 0.05,  // 差し：標準
            [this.runningStyles.CLOSER]: 0.00    // 追込：位置取り不利
        };
        return baseScores[style] || 0.05;
    }

    /**
     * 位置取り有利度計算
     */
    calculatePositionAdvantage(style, gate) {
        let advantage = 0;
        
        // より詳細な位置取り有利度計算
        
        // 内枠有利度（1-4枠）
        if (gate <= 4) {
            if (style === this.runningStyles.ESCAPE) {
                advantage += 0.12; // 逃げ馬の内枠は非常に有利
            } else if (style === this.runningStyles.LEADER) {
                advantage += 0.08; // 先行馬の内枠も有利
            } else if (style === this.runningStyles.STALKER) {
                advantage += 0.03; // 差し馬も内枠はやや有利
            }
            // 追込馬の内枠は不利なので加算なし
        }
        
        // 中枠バランス（5-8枠）
        else if (gate >= 5 && gate <= 8) {
            if (style === this.runningStyles.STALKER) {
                advantage += 0.06; // 差し馬の中枠は理想的
            } else if (style === this.runningStyles.LEADER) {
                advantage += 0.04; // 先行馬も中枠は良い
            }
        }
        
        // 外枠（9枠以上）
        else if (gate >= 9) {
            if (style === this.runningStyles.CLOSER) {
                advantage += 0.05; // 追込馬の外枠は有利
            } else if (style === this.runningStyles.STALKER) {
                advantage += 0.02; // 差し馬もまあまあ
            } else {
                advantage -= 0.05; // 先行・逃げ馬の外枠は不利
            }
        }
        
        // 極外枠ペナルティ（12枠以上）
        if (gate >= 12) {
            if (style !== this.runningStyles.CLOSER) {
                advantage -= 0.03; // 追込以外は追加ペナルティ
            }
        }
        
        console.log(`📍 位置取り有利度: ${style} ${gate}枠 → ${advantage.toFixed(3)}`);
        
        return advantage;
    }

    /**
     * Step 2: コーナー位置予測
     */
    predictCornerPositions(basicAnalysis) {
        return basicAnalysis.map(analysis => {
            const { horse, runningStyle, basicFlowScore } = analysis;
            
            // コーナー別想定位置（1位＝1、最下位＝頭数）
            const cornerPositions = {
                corner1: this.predictCornerPosition(1, runningStyle, basicFlowScore),
                corner2: this.predictCornerPosition(2, runningStyle, basicFlowScore),
                corner3: this.predictCornerPosition(3, runningStyle, basicFlowScore),
                corner4: this.predictCornerPosition(4, runningStyle, basicFlowScore)
            };
            
            // 位置取りロス計算
            const positionLoss = this.calculatePositionLoss(cornerPositions);
            
            return {
                ...analysis,
                cornerPositions: cornerPositions,
                positionLoss: positionLoss,
                flowAdvantage: Math.max(0, 0.1 - positionLoss) // ロスが少ないほど有利
            };
        });
    }

    /**
     * 個別コーナー位置予測
     */
    predictCornerPosition(cornerNumber, style, flowScore) {
        const totalHorses = this.horses.length;
        
        // 脚質別の基本位置（前方 = 小さい数値）
        const basePositions = {
            [this.runningStyles.ESCAPE]: 1.5,
            [this.runningStyles.LEADER]: 3.0,
            [this.runningStyles.STALKER]: Math.floor(totalHorses * 0.6),
            [this.runningStyles.CLOSER]: Math.floor(totalHorses * 0.8)
        };
        
        let position = basePositions[style] || Math.floor(totalHorses * 0.5);
        
        // 展開スコアによる補正
        position -= flowScore * 20; // 高スコアほど前に
        
        // コーナー進行による位置変化
        if (style === this.runningStyles.STALKER || style === this.runningStyles.CLOSER) {
            position -= (cornerNumber - 1) * 1.5; // 差し・追込は後半上がる
        }
        
        return Math.max(1, Math.min(totalHorses, Math.round(position)));
    }

    /**
     * 位置取りロス計算
     */
    calculatePositionLoss(cornerPositions) {
        // 各コーナーでの不利度を累積
        const positions = [
            cornerPositions.corner1,
            cornerPositions.corner2, 
            cornerPositions.corner3,
            cornerPositions.corner4
        ];
        
        // 後方位置ほどロス大
        const avgPosition = positions.reduce((sum, pos) => sum + pos, 0) / 4;
        const totalHorses = this.horses.length;
        
        return (avgPosition - 1) / (totalHorses - 1) * 0.1; // 0-0.1の範囲
    }

    /**
     * Step 3: 最終順位への影響度計算
     */
    calculateFinalImpacts(cornerAnalysis) {
        return cornerAnalysis.map(analysis => {
            const { horse, flowAdvantage, positionLoss, runningStyle, gateNumber } = analysis;
            
            // より大きな展開係数差を作るための計算
            let baseFlowImpact = 1.0;
            
            // 脚質×枠順の相性による大幅調整
            if (runningStyle === this.runningStyles.ESCAPE && gateNumber <= 2) {
                baseFlowImpact += 0.15; // 逃げ馬の内枠は大幅有利
            } else if (runningStyle === this.runningStyles.LEADER && gateNumber <= 4) {
                baseFlowImpact += 0.10; // 先行馬の内枠も有利
            } else if (runningStyle === this.runningStyles.STALKER && gateNumber >= 5 && gateNumber <= 8) {
                baseFlowImpact += 0.08; // 差し馬の中枠は有利
            } else if (runningStyle === this.runningStyles.CLOSER && gateNumber >= 10) {
                baseFlowImpact += 0.12; // 追込馬の外枠は有利
            }
            
            // 不利なパターンの追加
            else if (runningStyle === this.runningStyles.ESCAPE && gateNumber >= 10) {
                baseFlowImpact -= 0.12; // 逃げ馬の外枠は大幅不利
            } else if (runningStyle === this.runningStyles.LEADER && gateNumber >= 12) {
                baseFlowImpact -= 0.10; // 先行馬の極外枠は不利
            } else if (runningStyle === this.runningStyles.CLOSER && gateNumber <= 3) {
                baseFlowImpact -= 0.08; // 追込馬の内枠は不利
            } else if (runningStyle === this.runningStyles.STALKER && gateNumber >= 12) {
                baseFlowImpact -= 0.06; // 差し馬の極外枠はやや不利
            }
            
            // 既存の細かい調整を追加
            const flowImpactFactor = baseFlowImpact + flowAdvantage - positionLoss;
            
            // Kelly計算用の補正係数（範囲を拡大）
            const kellyAdjustmentFactor = Math.max(0.75, Math.min(1.25, flowImpactFactor));
            
            console.log(`🎯 展開係数計算 ${horse.name}:`, {
                runningStyle: runningStyle,
                gate: gateNumber,
                baseImpact: baseFlowImpact.toFixed(3),
                flowAdvantage: flowAdvantage.toFixed(3),
                positionLoss: positionLoss.toFixed(3),
                finalFactor: flowImpactFactor.toFixed(3)
            });
            
            return {
                ...analysis,
                flowImpactFactor: flowImpactFactor,
                kellyAdjustmentFactor: kellyAdjustmentFactor,
                finalRecommendation: this.getFinalRecommendation(flowImpactFactor),
                explanation: this.generateExplanation(analysis)
            };
        });
    }

    /**
     * 最終推奨度判定
     */
    getFinalRecommendation(impactFactor) {
        if (impactFactor >= 1.10) return 'highly_favored';    // 展開超有利
        if (impactFactor >= 1.05) return 'favored';           // 展開有利
        if (impactFactor >= 0.95) return 'neutral';           // 普通
        if (impactFactor >= 0.90) return 'unfavored';         // 展開不利
        return 'highly_unfavored';                            // 展開超不利
    }

    /**
     * 説明文生成
     */
    generateExplanation(analysis) {
        const { runningStyle, gateNumber, cornerPositions, flowAdvantage, positionLoss } = analysis;
        
        const styleNames = {
            [this.runningStyles.ESCAPE]: '逃げ',
            [this.runningStyles.LEADER]: '先行', 
            [this.runningStyles.STALKER]: '差し',
            [this.runningStyles.CLOSER]: '追込'
        };
        
        const styleName = styleNames[runningStyle] || '差し'; // デフォルトを差しに変更
        const avgPosition = Math.round(
            (cornerPositions.corner1 + cornerPositions.corner2 + 
             cornerPositions.corner3 + cornerPositions.corner4) / 4
        );
        
        // より詳細な説明文を生成
        let explanation = `${styleName}、${gateNumber}枠、平均${avgPosition}番手。`;
        
        // 枠順に応じたコメント
        if (gateNumber <= 3) {
            if (runningStyle === this.runningStyles.ESCAPE || runningStyle === this.runningStyles.LEADER) {
                explanation += "内枠で好スタート期待。";
            } else if (runningStyle === this.runningStyles.CLOSER) {
                explanation += "内枠で出遅れリスクあり。";
            } else {
                explanation += "内枠で立ち回りやすい。";
            }
        } else if (gateNumber >= 10) {
            if (runningStyle === this.runningStyles.CLOSER) {
                explanation += "外枠で後方追込可能。";
            } else {
                explanation += "外枠でポジション取り注意。";
            }
        } else {
            explanation += "中枠で展開選択肢多い。";
        }
        
        // 展開有利度に応じたコメント
        if (flowAdvantage > 0.06) {
            explanation += "展開的に有利。";
        } else if (positionLoss > 0.05) {
            explanation += "ロス覚悟必要。";
        }
        
        return explanation;
    }

    /**
     * 予測サマリー生成
     */
    generatePredictionSummary(finalImpacts) {
        const favored = finalImpacts.filter(f => f.finalRecommendation === 'highly_favored' || f.finalRecommendation === 'favored');
        const unfavored = finalImpacts.filter(f => f.finalRecommendation === 'highly_unfavored' || f.finalRecommendation === 'unfavored');
        
        return {
            totalHorses: finalImpacts.length,
            favoredCount: favored.length,
            unfavoredCount: unfavored.length,
            averageImpactFactor: finalImpacts.reduce((sum, f) => sum + f.flowImpactFactor, 0) / finalImpacts.length,
            topFavoredHorse: favored.length > 0 ? favored[0].horse.name : null
        };
    }

    /**
     * 現在の予測結果取得
     */
    getCurrentPrediction() {
        return this.currentPrediction;
    }

    /**
     * Kelly計算用補正係数の一括取得
     */
    getKellyAdjustmentFactors() {
        if (!this.currentPrediction) return {};
        
        const factors = {};
        this.currentPrediction.finalImpacts.forEach(impact => {
            factors[impact.horse.name] = impact.kellyAdjustmentFactor;
        });
        
        return factors;
    }

    /**
     * 可視化用データの生成
     */
    generateVisualizationData() {
        if (!this.currentPrediction) return null;
        
        return {
            raceFlow: this.currentPrediction.cornerPositions.map(cp => ({
                horseName: cp.horse.name,
                positions: [cp.cornerPositions.corner1, cp.cornerPositions.corner2, 
                           cp.cornerPositions.corner3, cp.cornerPositions.corner4],
                style: cp.runningStyle,
                advantage: cp.flowAdvantage
            })),
            summary: this.currentPrediction.summary
        };
    }
}

// グローバル公開
window.RaceFlowPredictor = RaceFlowPredictor;

// デモ・テスト用関数
window.demoRaceFlowPrediction = function() {
    const predictor = new RaceFlowPredictor();
    
    // サンプル馬データ
    const sampleHorses = [
        { name: '逃げ馬アルファ', gateNumber: 2, odds: 4.5, runningStyle: 'escape' },
        { name: '先行馬ベータ', gateNumber: 5, odds: 3.2, runningStyle: 'leader' },
        { name: '差し馬ガンマ', gateNumber: 8, odds: 6.8, runningStyle: 'stalker' },
        { name: '追込馬デルタ', gateNumber: 12, odds: 15.0, runningStyle: 'closer' },
        { name: 'バランス馬エプシロン', gateNumber: 6, odds: 5.5 }
    ];
    
    const prediction = predictor.predictRaceFlow(sampleHorses);
    
    console.log('🏇 展開予想デモ結果:');
    console.log('サマリー:', prediction.summary);
    
    prediction.finalImpacts.forEach(impact => {
        console.log(`${impact.horse.name}: 展開係数${impact.flowImpactFactor.toFixed(3)} (${impact.finalRecommendation})`);
        console.log(`  ${impact.explanation}`);
    });
    
    return prediction;
};

console.log('🏇 Phase 8β: 展開予想システム実装完了');
console.log('📝 使用方法: demoRaceFlowPrediction() でデモ実行');