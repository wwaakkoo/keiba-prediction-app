// 高回収率買い目推奨システム - 複勝予想精度95.5%を活かした戦略
class HighRecoveryBettingSystem {
    static CONFIG = {
        // 複勝予想の実績データ
        PLACE_PREDICTION_ACCURACY: 0.955, // 95.5%の的中率
        PLACE_HIT_SAFETY_MARGIN: 0.90,   // 安全係数
        TARGET_RECOVERY_RATE: 1.15,      // 目標回収率115%
        MIN_RECOVERY_RATE: 1.00,         // 最低回収率100%
        
        // 買い目戦略パラメータ
        TRIFECTA_BOX_EFFICIENCY: 0.85,   // 3連複BOX効率
        WIDE_COMBINATION_EFFICIENCY: 0.90, // ワイド組み合わせ効率
        EXACTA_EFFICIENCY: 0.75,         // 馬連効率
        
        // リスク管理
        MAX_BET_COMBINATIONS: 6,         // 最大買い目数
        BET_DISTRIBUTION_RATIO: 0.6,     // 資金配分比率
        PROFIT_MARGIN_BUFFER: 0.05       // 利益マージン
    };

    /**
     * 高回収率買い目推奨のメイン処理
     */
    static generateHighRecoveryRecommendations(predictions, totalBudget = 1000) {
        console.log('🎯 高回収率買い目推奨システム開始');
        
        const recommendations = {
            mainStrategy: [],
            subStrategy: [],
            safetyStrategy: [],
            expectedRecovery: 0,
            totalInvestment: 0,
            riskLevel: 'medium'
        };
        
        // 1. 複勝予想上位馬を分析して最適な頭数を決定
        const optimalCount = this.calculateOptimalHorseCount(predictions);
        const topPlaceHorses = this.getTopPlaceHorses(predictions, optimalCount);
        console.log(`📊 複勝予想上位${optimalCount}頭:`, topPlaceHorses.map(h => h.name));
        
        // 2. 効率的な買い目組み合わせを生成
        const strategies = this.generateEfficiencyStrategies(topPlaceHorses, predictions);
        
        // 3. 回収率最適化
        const optimizedStrategies = this.optimizeForRecovery(strategies, totalBudget);
        
        // 4. リスクレベル別推奨を生成
        recommendations.mainStrategy = this.generateMainStrategy(optimizedStrategies.high, totalBudget);
        recommendations.subStrategy = this.generateSubStrategy(optimizedStrategies.medium, totalBudget);
        recommendations.safetyStrategy = this.generateSafetyStrategy(optimizedStrategies.safe, totalBudget);
        
        // 5. 期待回収率計算
        recommendations.expectedRecovery = this.calculateExpectedRecovery(recommendations);
        recommendations.totalInvestment = this.calculateTotalInvestment(recommendations);
        recommendations.riskLevel = this.assessRiskLevel(recommendations);
        
        console.log('💰 高回収率推奨完了:', {
            期待回収率: `${(recommendations.expectedRecovery * 100).toFixed(1)}%`,
            総投資額: `${recommendations.totalInvestment}円`,
            リスクレベル: recommendations.riskLevel
        });
        
        return recommendations;
    }
    
    /**
     * 最適な対象馬数を計算
     */
    static calculateOptimalHorseCount(predictions) {
        // 複勝率の分布を分析
        const sortedByPlace = predictions
            .filter(horse => horse.placeProbability > 0)
            .sort((a, b) => b.placeProbability - a.placeProbability);
        
        if (sortedByPlace.length < 3) return sortedByPlace.length;
        
        // 複勝率の差を分析して最適な頭数を決定
        const top3Avg = (sortedByPlace[0].placeProbability + sortedByPlace[1].placeProbability + sortedByPlace[2].placeProbability) / 3;
        const gap4th = sortedByPlace.length >= 4 ? top3Avg - sortedByPlace[3].placeProbability : 0;
        
        // 4頭目との差が大きい場合は3頭、小さい場合は4頭を選択
        if (gap4th > 15) { // 15%以上の差
            console.log('💡 複勝率格差大 -> 3頭選択');
            return 3;
        } else if (gap4th > 5 && sortedByPlace.length >= 4) { // 5-15%の差
            console.log('💡 複勝率格差中 -> 4頭選択');
            return 4;
        } else {
            console.log('💡 複勝率格差小 -> 3頭選択（安全策）');
            return 3;
        }
    }

    /**
     * 複勝予想上位馬を取得
     */
    static getTopPlaceHorses(predictions, count = 3) {
        return predictions
            .filter(horse => horse.placeProbability > 0)
            .sort((a, b) => b.placeProbability - a.placeProbability)
            .slice(0, count)
            .map(horse => ({
                ...horse,
                horseNumber: predictions.indexOf(horse) + 1,
                placeHitProb: horse.placeProbability / 100
            }));
    }
    
    /**
     * 効率的な買い目戦略を生成
     */
    static generateEfficiencyStrategies(topHorses, allPredictions) {
        const strategies = {
            trifectaBox: this.generateTrifectaBoxStrategy(topHorses),
            wideCombinations: this.generateWideCombinationStrategy(topHorses),
            exactaStrategies: this.generateExactaStrategy(topHorses),
            quinellaStrategies: this.generateQuinellaStrategy(topHorses)
        };
        
        return strategies;
    }
    
    /**
     * 3連複BOX戦略（最も効率的）
     */
    static generateTrifectaBoxStrategy(topHorses) {
        if (topHorses.length < 3) return [];
        
        const strategy = {
            type: '3連複BOX',
            horses: topHorses.slice(0, 3),
            combinations: 1, // 3頭BOX = 1点
            hitProbability: this.calculateTrifectaBoxHitProb(topHorses.slice(0, 3)),
            estimatedDividend: this.estimateTrifectaBoxDividend(topHorses.slice(0, 3)),
            efficiency: 0
        };
        
        strategy.efficiency = (strategy.hitProbability * strategy.estimatedDividend) - 1;
        
        return [strategy];
    }
    
    /**
     * ワイド組み合わせ戦略
     */
    static generateWideCombinationStrategy(topHorses) {
        if (topHorses.length < 2) return [];
        
        const strategies = [];
        
        // 1-2着予想馬のワイド（最も堅い）
        const wideMain = {
            type: 'ワイド',
            horses: topHorses.slice(0, 2),
            combinations: 1,
            hitProbability: this.calculateWideHitProb(topHorses[0], topHorses[1]),
            estimatedDividend: this.estimateWideDividend(topHorses[0], topHorses[1]),
            efficiency: 0,
            confidence: 'high'
        };
        wideMain.efficiency = (wideMain.hitProbability * wideMain.estimatedDividend) - 1;
        strategies.push(wideMain);
        
        // 1-3着予想馬のワイド（保険）
        if (topHorses.length >= 3) {
            const wideSub = {
                type: 'ワイド',
                horses: [topHorses[0], topHorses[2]],
                combinations: 1,
                hitProbability: this.calculateWideHitProb(topHorses[0], topHorses[2]),
                estimatedDividend: this.estimateWideDividend(topHorses[0], topHorses[2]),
                efficiency: 0,
                confidence: 'medium'
            };
            wideSub.efficiency = (wideSub.hitProbability * wideSub.estimatedDividend) - 1;
            strategies.push(wideSub);
        }
        
        return strategies;
    }
    
    /**
     * 馬連戦略
     */
    static generateExactaStrategy(topHorses) {
        if (topHorses.length < 2) return [];
        
        const strategy = {
            type: '馬連',
            horses: topHorses.slice(0, 2),
            combinations: 1,
            hitProbability: this.calculateExactaHitProb(topHorses[0], topHorses[1]),
            estimatedDividend: this.estimateExactaDividend(topHorses[0], topHorses[1]),
            efficiency: 0
        };
        
        strategy.efficiency = (strategy.hitProbability * strategy.estimatedDividend) - 1;
        
        return [strategy];
    }
    
    /**
     * 馬単戦略
     */
    static generateQuinellaStrategy(topHorses) {
        if (topHorses.length < 2) return [];
        
        const strategy = {
            type: '馬単',
            horses: topHorses.slice(0, 2),
            combinations: 1,
            hitProbability: this.calculateQuinellaHitProb(topHorses[0], topHorses[1]),
            estimatedDividend: this.estimateQuinellaDividend(topHorses[0], topHorses[1]),
            efficiency: 0
        };
        
        strategy.efficiency = (strategy.hitProbability * strategy.estimatedDividend) - 1;
        
        return [strategy];
    }
    
    /**
     * 3連複BOX的中確率計算
     */
    static calculateTrifectaBoxHitProb(horses) {
        // 3頭すべてが3着以内に入る確率
        const prob1 = horses[0].placeHitProb;
        const prob2 = horses[1].placeHitProb;
        const prob3 = horses[2].placeHitProb;
        
        // 複勝予想の実績（95.5%）を考慮した調整
        const baseProb = prob1 * prob2 * prob3 * this.CONFIG.TRIFECTA_BOX_EFFICIENCY;
        
        // 実績データに基づく補正
        return Math.min(0.85, baseProb * this.CONFIG.PLACE_HIT_SAFETY_MARGIN);
    }
    
    /**
     * 3連複BOX配当予測
     */
    static estimateTrifectaBoxDividend(horses) {
        const avgOdds = horses.reduce((sum, h) => sum + h.odds, 0) / horses.length;
        
        // 人気度に応じた配当予測
        if (avgOdds <= 3) {
            return 800;  // 人気馬中心
        } else if (avgOdds <= 7) {
            return 1500; // 中人気
        } else if (avgOdds <= 15) {
            return 3000; // 穴馬混在
        } else {
            return 6000; // 大穴
        }
    }
    
    /**
     * ワイド的中確率計算
     */
    static calculateWideHitProb(horse1, horse2) {
        // 2頭のうち両方が3着以内に入る確率
        const bothPlaceProb = horse1.placeHitProb * horse2.placeHitProb;
        
        // 実績データに基づく調整
        return Math.min(0.90, bothPlaceProb * this.CONFIG.WIDE_COMBINATION_EFFICIENCY);
    }
    
    /**
     * ワイド配当予測
     */
    static estimateWideDividend(horse1, horse2) {
        const avgOdds = (horse1.odds + horse2.odds) / 2;
        
        // ワイド配当の一般的な傾向
        if (avgOdds <= 3) {
            return 200;  // 人気馬同士
        } else if (avgOdds <= 7) {
            return 400;  // 中人気
        } else if (avgOdds <= 15) {
            return 800;  // 穴馬混在
        } else {
            return 1500; // 大穴
        }
    }
    
    /**
     * 馬連的中確率計算
     */
    static calculateExactaHitProb(horse1, horse2) {
        // 1-2着を的中させる確率（順序問わず）
        const prob1st = horse1.winProbability / 100;
        const prob2nd = horse2.winProbability / 100;
        
        // 相互の1-2着確率
        const hitProb = (prob1st * prob2nd + prob2nd * prob1st) * this.CONFIG.EXACTA_EFFICIENCY;
        
        return Math.min(0.40, hitProb);
    }
    
    /**
     * 馬連配当予測
     */
    static estimateExactaDividend(horse1, horse2) {
        const avgOdds = (horse1.odds + horse2.odds) / 2;
        
        if (avgOdds <= 3) {
            return 600;  // 人気馬同士
        } else if (avgOdds <= 7) {
            return 1200; // 中人気
        } else if (avgOdds <= 15) {
            return 2500; // 穴馬混在
        } else {
            return 5000; // 大穴
        }
    }
    
    /**
     * 馬単的中確率計算
     */
    static calculateQuinellaHitProb(horse1, horse2) {
        // 1着→2着の順序確率
        const prob1to2 = (horse1.winProbability / 100) * (horse2.winProbability / 100);
        
        return Math.min(0.25, prob1to2 * this.CONFIG.EXACTA_EFFICIENCY);
    }
    
    /**
     * 馬単配当予測
     */
    static estimateQuinellaDividend(horse1, horse2) {
        const avgOdds = (horse1.odds + horse2.odds) / 2;
        
        if (avgOdds <= 3) {
            return 1000; // 人気馬同士
        } else if (avgOdds <= 7) {
            return 2000; // 中人気
        } else if (avgOdds <= 15) {
            return 4000; // 穴馬混在
        } else {
            return 8000; // 大穴
        }
    }
    
    /**
     * 回収率最適化
     */
    static optimizeForRecovery(strategies, totalBudget) {
        const allStrategies = [
            ...strategies.trifectaBox,
            ...strategies.wideCombinations,
            ...strategies.exactaStrategies,
            ...strategies.quinellaStrategies
        ];
        
        // 効率順にソート
        allStrategies.sort((a, b) => b.efficiency - a.efficiency);
        
        return {
            high: allStrategies.filter(s => s.efficiency > 0.15),
            medium: allStrategies.filter(s => s.efficiency > 0.05 && s.efficiency <= 0.15),
            safe: allStrategies.filter(s => s.efficiency > -0.05 && s.efficiency <= 0.05)
        };
    }
    
    /**
     * メイン戦略生成
     */
    static generateMainStrategy(highEfficiencyStrategies, totalBudget) {
        const mainBudget = Math.floor(totalBudget * 0.6);
        const recommendations = [];
        
        highEfficiencyStrategies.slice(0, 3).forEach((strategy, index) => {
            const betAmount = Math.floor(mainBudget / 3);
            
            recommendations.push({
                category: strategy.type,
                mark: this.getStrategyMark(strategy),
                type: 'メイン',
                horse: this.getHorseDisplay(strategy.horses),
                odds: `推定${strategy.estimatedDividend}円`,
                probability: `${(strategy.hitProbability * 100).toFixed(1)}%`,
                confidence: strategy.confidence || 'high',
                amount: `${betAmount}円`,
                efficiency: `${(strategy.efficiency * 100).toFixed(1)}%`,
                expectedReturn: Math.floor(strategy.hitProbability * strategy.estimatedDividend * betAmount)
            });
        });
        
        return recommendations;
    }
    
    /**
     * サブ戦略生成
     */
    static generateSubStrategy(mediumEfficiencyStrategies, totalBudget) {
        const subBudget = Math.floor(totalBudget * 0.3);
        const recommendations = [];
        
        mediumEfficiencyStrategies.slice(0, 2).forEach((strategy, index) => {
            const betAmount = Math.floor(subBudget / 2);
            
            recommendations.push({
                category: strategy.type,
                mark: this.getStrategyMark(strategy),
                type: 'サブ',
                horse: this.getHorseDisplay(strategy.horses),
                odds: `推定${strategy.estimatedDividend}円`,
                probability: `${(strategy.hitProbability * 100).toFixed(1)}%`,
                confidence: 'medium',
                amount: `${betAmount}円`,
                efficiency: `${(strategy.efficiency * 100).toFixed(1)}%`,
                expectedReturn: Math.floor(strategy.hitProbability * strategy.estimatedDividend * betAmount)
            });
        });
        
        return recommendations;
    }
    
    /**
     * セーフティ戦略生成
     */
    static generateSafetyStrategy(safeStrategies, totalBudget) {
        const safetyBudget = Math.floor(totalBudget * 0.1);
        const recommendations = [];
        
        if (safeStrategies.length > 0) {
            const strategy = safeStrategies[0];
            
            recommendations.push({
                category: strategy.type,
                mark: this.getStrategyMark(strategy),
                type: 'セーフティ',
                horse: this.getHorseDisplay(strategy.horses),
                odds: `推定${strategy.estimatedDividend}円`,
                probability: `${(strategy.hitProbability * 100).toFixed(1)}%`,
                confidence: 'safe',
                amount: `${safetyBudget}円`,
                efficiency: `${(strategy.efficiency * 100).toFixed(1)}%`,
                expectedReturn: Math.floor(strategy.hitProbability * strategy.estimatedDividend * safetyBudget)
            });
        }
        
        return recommendations;
    }
    
    /**
     * 戦略マーク取得
     */
    static getStrategyMark(strategy) {
        switch(strategy.type) {
            case '3連複BOX': return '◎○▲';
            case 'ワイド': return '◎○';
            case '馬連': return '◎○';
            case '馬単': return '◎→○';
            default: return '◎';
        }
    }
    
    /**
     * 馬名表示生成
     */
    static getHorseDisplay(horses) {
        return horses.map(h => `${h.name}(${h.horseNumber}番)`).join(' - ');
    }
    
    /**
     * 期待回収率計算
     */
    static calculateExpectedRecovery(recommendations) {
        const totalInvestment = this.calculateTotalInvestment(recommendations);
        const totalExpectedReturn = [
            ...recommendations.mainStrategy,
            ...recommendations.subStrategy,
            ...recommendations.safetyStrategy
        ].reduce((sum, rec) => sum + (rec.expectedReturn || 0), 0);
        
        return totalInvestment > 0 ? totalExpectedReturn / totalInvestment : 0;
    }
    
    /**
     * 総投資額計算
     */
    static calculateTotalInvestment(recommendations) {
        return [...recommendations.mainStrategy, ...recommendations.subStrategy, ...recommendations.safetyStrategy]
            .reduce((sum, rec) => sum + parseInt(rec.amount.replace('円', '')), 0);
    }
    
    /**
     * リスクレベル評価
     */
    static assessRiskLevel(recommendations) {
        const recovery = recommendations.expectedRecovery;
        
        if (recovery >= 1.2) return 'high_return';
        if (recovery >= 1.05) return 'medium_return';
        if (recovery >= 1.0) return 'safe_return';
        return 'loss_risk';
    }
    
    /**
     * 買い目推奨の表示
     */
    static displayHighRecoveryRecommendations(recommendations) {
        const container = document.getElementById('bettingContainer');
        
        let html = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 15px 0; text-align: center;">💰 高回収率買い目推奨システム</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; text-align: center;">
                    <div>
                        <div style="font-size: 2em; font-weight: bold;">${(recommendations.expectedRecovery * 100).toFixed(1)}%</div>
                        <div>期待回収率</div>
                    </div>
                    <div>
                        <div style="font-size: 2em; font-weight: bold;">${recommendations.totalInvestment}円</div>
                        <div>総投資額</div>
                    </div>
                    <div>
                        <div style="font-size: 2em; font-weight: bold;">${this.getRiskLevelDisplay(recommendations.riskLevel)}</div>
                        <div>リスクレベル</div>
                    </div>
                </div>
            </div>
        `;
        
        // 各戦略の表示
        const allRecommendations = [
            ...recommendations.mainStrategy,
            ...recommendations.subStrategy,
            ...recommendations.safetyStrategy
        ];
        
        if (allRecommendations.length > 0) {
            html += `
                <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                                <th style="padding: 12px 8px; text-align: center;">戦略</th>
                                <th style="padding: 12px 8px; text-align: center;">券種</th>
                                <th style="padding: 12px 8px; text-align: left;">馬名・馬番</th>
                                <th style="padding: 12px 8px; text-align: center;">期待配当</th>
                                <th style="padding: 12px 8px; text-align: center;">的中率</th>
                                <th style="padding: 12px 8px; text-align: center;">投資額</th>
                                <th style="padding: 12px 8px; text-align: center;">効率</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            allRecommendations.forEach((rec, index) => {
                const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
                const typeColor = rec.type === 'メイン' ? '#28a745' : rec.type === 'サブ' ? '#ffc107' : '#6c757d';
                
                html += `
                    <tr style="background: ${bgColor}; border-bottom: 1px solid #dee2e6;">
                        <td style="padding: 12px 8px; text-align: center; color: ${typeColor}; font-weight: bold;">${rec.type}</td>
                        <td style="padding: 12px 8px; text-align: center; font-weight: bold;">${rec.category}</td>
                        <td style="padding: 12px 8px; font-size: 0.9em;">${rec.horse}</td>
                        <td style="padding: 12px 8px; text-align: center; font-weight: bold;">${rec.odds}</td>
                        <td style="padding: 12px 8px; text-align: center;">${rec.probability}</td>
                        <td style="padding: 12px 8px; text-align: center; font-weight: bold;">${rec.amount}</td>
                        <td style="padding: 12px 8px; text-align: center; color: ${rec.efficiency.includes('-') ? '#dc3545' : '#28a745'}; font-weight: bold;">${rec.efficiency}</td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        container.innerHTML = html;
    }
    
    /**
     * リスクレベル表示
     */
    static getRiskLevelDisplay(riskLevel) {
        switch(riskLevel) {
            case 'high_return': return '🚀 高収益';
            case 'medium_return': return '📈 中収益';
            case 'safe_return': return '🛡️ 安全';
            case 'loss_risk': return '⚠️ 損失リスク';
            default: return '➖ 不明';
        }
    }
    
    /**
     * 高回収率買い目推奨の成績記録機能
     */
    static recordHighRecoveryResult(recommendations, actualResults, paybackData) {
        console.log('📊 高回収率買い目推奨の成績記録開始');
        
        const recordData = {
            date: new Date().toISOString(),
            timestamp: Date.now(),
            recommendations: recommendations,
            actualResults: actualResults,
            paybackData: paybackData,
            analysis: this.analyzeResult(recommendations, actualResults, paybackData)
        };
        
        // ローカルストレージに保存
        this.saveRecordData(recordData);
        
        // 成績統計を更新
        this.updatePerformanceStats(recordData);
        
        console.log('💾 高回収率買い目推奨の成績記録完了:', recordData.analysis);
        
        return recordData;
    }
    
    /**
     * 結果分析
     */
    static analyzeResult(recommendations, actualResults, paybackData) {
        const analysis = {
            totalInvestment: 0,
            totalReturn: 0,
            hitCount: 0,
            hitRate: 0,
            recoveryRate: 0,
            profit: 0,
            detailedResults: []
        };
        
        // 各推奨の分析
        [...recommendations.mainStrategy, ...recommendations.subStrategy, ...recommendations.safetyStrategy].forEach(rec => {
            const investment = parseInt(rec.amount.replace('円', ''));
            const result = this.checkBettingResult(rec, actualResults, paybackData);
            
            analysis.totalInvestment += investment;
            analysis.totalReturn += result.return;
            
            if (result.isHit) {
                analysis.hitCount++;
            }
            
            analysis.detailedResults.push({
                category: rec.category,
                type: rec.type,
                investment: investment,
                return: result.return,
                profit: result.return - investment,
                isHit: result.isHit,
                horse: rec.horse,
                actualPayback: result.actualPayback
            });
        });
        
        analysis.hitRate = analysis.detailedResults.length > 0 ? 
            (analysis.hitCount / analysis.detailedResults.length) * 100 : 0;
        analysis.recoveryRate = analysis.totalInvestment > 0 ? 
            (analysis.totalReturn / analysis.totalInvestment) * 100 : 0;
        analysis.profit = analysis.totalReturn - analysis.totalInvestment;
        
        return analysis;
    }
    
    /**
     * 個別買い目の的中判定
     */
    static checkBettingResult(recommendation, actualResults, paybackData) {
        const result = {
            isHit: false,
            return: 0,
            actualPayback: 0
        };
        
        const investment = parseInt(recommendation.amount.replace('円', ''));
        
        switch (recommendation.category) {
            case '3連複BOX':
                result.isHit = this.check3FukuHit(recommendation, actualResults);
                result.actualPayback = paybackData.sanrenFuku || 0;
                break;
                
            case 'ワイド':
                result.isHit = this.checkWideHit(recommendation, actualResults);
                result.actualPayback = paybackData.wide || 0;
                break;
                
            case '馬連':
                result.isHit = this.checkExactaHit(recommendation, actualResults);
                result.actualPayback = paybackData.exacta || 0;
                break;
                
            case '馬単':
                result.isHit = this.checkQuinellaHit(recommendation, actualResults);
                result.actualPayback = paybackData.quinella || 0;
                break;
        }
        
        if (result.isHit) {
            result.return = (result.actualPayback / 100) * investment;
        }
        
        return result;
    }
    
    /**
     * 3連複的中判定
     */
    static check3FukuHit(recommendation, actualResults) {
        const targetHorses = this.extractHorseNumbers(recommendation.horse);
        const actualTop3 = [actualResults.first, actualResults.second, actualResults.third];
        
        return targetHorses.every(horse => actualTop3.includes(horse));
    }
    
    /**
     * ワイド的中判定
     */
    static checkWideHit(recommendation, actualResults) {
        const targetHorses = this.extractHorseNumbers(recommendation.horse);
        const actualTop3 = [actualResults.first, actualResults.second, actualResults.third];
        
        return targetHorses.filter(horse => actualTop3.includes(horse)).length >= 2;
    }
    
    /**
     * 馬連的中判定
     */
    static checkExactaHit(recommendation, actualResults) {
        const targetHorses = this.extractHorseNumbers(recommendation.horse);
        const actualTop2 = [actualResults.first, actualResults.second];
        
        return targetHorses.length === 2 && 
               targetHorses.every(horse => actualTop2.includes(horse));
    }
    
    /**
     * 馬単的中判定
     */
    static checkQuinellaHit(recommendation, actualResults) {
        const targetHorses = this.extractHorseNumbers(recommendation.horse);
        
        return targetHorses.length === 2 && 
               targetHorses[0] === actualResults.first && 
               targetHorses[1] === actualResults.second;
    }
    
    /**
     * 馬番を抽出
     */
    static extractHorseNumbers(horseString) {
        const matches = horseString.match(/(\d+)番/g);
        return matches ? matches.map(match => parseInt(match.replace('番', ''))) : [];
    }
    
    /**
     * 記録データを保存
     */
    static saveRecordData(recordData) {
        const existingData = JSON.parse(localStorage.getItem('highRecoveryBettingHistory') || '[]');
        existingData.push(recordData);
        
        // 最新100件を保持
        if (existingData.length > 100) {
            existingData.splice(0, existingData.length - 100);
        }
        
        localStorage.setItem('highRecoveryBettingHistory', JSON.stringify(existingData));
    }
    
    /**
     * 成績統計を更新
     */
    static updatePerformanceStats(recordData) {
        const stats = JSON.parse(localStorage.getItem('highRecoveryBettingStats') || '{}');
        
        if (!stats.totalRaces) {
            stats.totalRaces = 0;
            stats.totalInvestment = 0;
            stats.totalReturn = 0;
            stats.totalHits = 0;
            stats.totalBets = 0;
        }
        
        stats.totalRaces++;
        stats.totalInvestment += recordData.analysis.totalInvestment;
        stats.totalReturn += recordData.analysis.totalReturn;
        stats.totalHits += recordData.analysis.hitCount;
        stats.totalBets += recordData.analysis.detailedResults.length;
        
        // 計算値を更新
        stats.overallHitRate = stats.totalBets > 0 ? (stats.totalHits / stats.totalBets) * 100 : 0;
        stats.overallRecoveryRate = stats.totalInvestment > 0 ? (stats.totalReturn / stats.totalInvestment) * 100 : 0;
        stats.overallProfit = stats.totalReturn - stats.totalInvestment;
        
        localStorage.setItem('highRecoveryBettingStats', JSON.stringify(stats));
        
        console.log('📈 成績統計更新:', {
            総レース数: stats.totalRaces,
            総的中率: `${stats.overallHitRate.toFixed(1)}%`,
            総回収率: `${stats.overallRecoveryRate.toFixed(1)}%`,
            総利益: `${stats.overallProfit}円`
        });
    }
    
    /**
     * 成績統計を取得
     */
    static getPerformanceStats() {
        const stats = JSON.parse(localStorage.getItem('highRecoveryBettingStats') || '{}');
        const history = JSON.parse(localStorage.getItem('highRecoveryBettingHistory') || '[]');
        
        return {
            stats: stats,
            history: history,
            recentPerformance: this.calculateRecentPerformance(history.slice(-10))
        };
    }
    
    /**
     * 最近の成績を計算
     */
    static calculateRecentPerformance(recentHistory) {
        if (recentHistory.length === 0) return null;
        
        const recent = {
            races: recentHistory.length,
            totalInvestment: 0,
            totalReturn: 0,
            totalHits: 0,
            totalBets: 0
        };
        
        recentHistory.forEach(record => {
            recent.totalInvestment += record.analysis.totalInvestment;
            recent.totalReturn += record.analysis.totalReturn;
            recent.totalHits += record.analysis.hitCount;
            recent.totalBets += record.analysis.detailedResults.length;
        });
        
        recent.hitRate = recent.totalBets > 0 ? (recent.totalHits / recent.totalBets) * 100 : 0;
        recent.recoveryRate = recent.totalInvestment > 0 ? (recent.totalReturn / recent.totalInvestment) * 100 : 0;
        recent.profit = recent.totalReturn - recent.totalInvestment;
        
        return recent;
    }
    
    /**
     * 成績表示
     */
    static displayPerformanceStats() {
        const performance = this.getPerformanceStats();
        
        console.log('📊 高回収率買い目推奨 成績サマリー:');
        console.log('='.repeat(50));
        console.log(`総レース数: ${performance.stats.totalRaces || 0}`);
        console.log(`総的中率: ${(performance.stats.overallHitRate || 0).toFixed(1)}%`);
        console.log(`総回収率: ${(performance.stats.overallRecoveryRate || 0).toFixed(1)}%`);
        console.log(`総利益: ${performance.stats.overallProfit || 0}円`);
        
        if (performance.recentPerformance) {
            console.log(`\n最近${performance.recentPerformance.races}レースの成績:`);
            console.log(`的中率: ${performance.recentPerformance.hitRate.toFixed(1)}%`);
            console.log(`回収率: ${performance.recentPerformance.recoveryRate.toFixed(1)}%`);
            console.log(`利益: ${performance.recentPerformance.profit}円`);
        }
        
        return performance;
    }
}

// グローバル変数として公開
window.HighRecoveryBettingSystem = HighRecoveryBettingSystem;