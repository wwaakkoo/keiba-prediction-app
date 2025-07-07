// 買い目推奨機能
class BettingRecommender {
    static bettingHistory = [];
    static learningThresholds = {
        winProbabilityMin: 8,
        expectedValueMin: 0.1,
        mediumOddsMin: 5,
        mediumOddsMax: 20,
        placeProbabilityMin: 30
    };

    static generateBettingRecommendations(predictions) {
        const container = document.getElementById('bettingContainer');
        
        // 学習データを取得して閾値を調整
        this.adjustThresholdsFromLearning();
        
        // 各種ソート
        const sortedByWinExpected = [...predictions].sort((a, b) => b.winExpectedValue - a.winExpectedValue);
        const sortedByPlaceExpected = [...predictions].sort((a, b) => b.placeExpectedValue - a.placeExpectedValue);
        const sortedByWinProbability = [...predictions].sort((a, b) => b.winProbability - a.winProbability);

        // 馬番を取得する関数
        function getHorseNumber(horseName) {
            const index = predictions.findIndex(h => h.name === horseName);
            return index !== -1 ? index + 1 : '?';
        }

        // 印による馬の分類（学習調整済み）
        const horseMarks = this.classifyHorses(predictions, sortedByWinProbability, sortedByWinExpected);
        
        // 買い目推奨の生成
        const recommendations = this.generateRecommendationsFromMarks(horseMarks, getHorseNumber);
        
        // 3連複推奨を追加
        const tripleBoxRecommendations = this.generateTripleBoxRecommendations(horseMarks, predictions, getHorseNumber);
        recommendations.push(...tripleBoxRecommendations);
        
        // 3連単推奨を追加
        const tripleExactRecommendations = this.generateTripleExactRecommendations(horseMarks, predictions, getHorseNumber);
        recommendations.push(...tripleExactRecommendations);

        // グローバル変数に保存（学習時に使用）
        window.lastBettingRecommendations = recommendations;

        this.displayBettingRecommendations(recommendations, horseMarks);
    }

    static adjustThresholdsFromLearning() {
        const learningData = LearningSystem.getLearningData();
        const history = learningData.history || [];
        
        if (history.length < 3) return; // 学習データが少ない場合は調整しない

        // 最近の成績を分析
        const recentResults = history.slice(-10);
        const winRate = recentResults.filter(r => r.winCorrect).length / recentResults.length;
        const placeRate = recentResults.filter(r => r.placeCorrect).length / recentResults.length;

        // 成績に応じて閾値を動的調整
        if (winRate < 0.2) {
            // 勝率が低い場合：より保守的に
            this.learningThresholds.winProbabilityMin = Math.min(15, this.learningThresholds.winProbabilityMin + 1);
            this.learningThresholds.expectedValueMin = Math.min(0.15, this.learningThresholds.expectedValueMin + 0.01);
        } else if (winRate > 0.4) {
            // 勝率が高い場合：より積極的に
            this.learningThresholds.winProbabilityMin = Math.max(5, this.learningThresholds.winProbabilityMin - 1);
            this.learningThresholds.expectedValueMin = Math.max(0.05, this.learningThresholds.expectedValueMin - 0.01);
        }

        if (placeRate < 0.3) {
            // 複勝率が低い場合：より厳しく
            this.learningThresholds.placeProbabilityMin = Math.min(40, this.learningThresholds.placeProbabilityMin + 2);
        } else if (placeRate > 0.6) {
            // 複勝率が高い場合：より緩く
            this.learningThresholds.placeProbabilityMin = Math.max(20, this.learningThresholds.placeProbabilityMin - 2);
        }

        // オッズ範囲の調整
        const avgWinnerOdds = recentResults.filter(r => r.winCorrect)
            .map(r => this.getHorseOddsFromHistory(r.actual))
            .filter(odds => odds > 0)
            .reduce((sum, odds, _, arr) => sum + odds / arr.length, 0);

        if (avgWinnerOdds > 0) {
            if (avgWinnerOdds < 8) {
                // 低オッズで的中が多い：人気馬重視
                this.learningThresholds.mediumOddsMax = Math.max(15, this.learningThresholds.mediumOddsMax - 1);
            } else if (avgWinnerOdds > 15) {
                // 高オッズで的中が多い：穴馬重視
                this.learningThresholds.mediumOddsMax = Math.min(30, this.learningThresholds.mediumOddsMax + 1);
            }
        }
    }

    static getHorseOddsFromHistory(horseName) {
        // 現在の予測データから該当馬のオッズを取得（簡易実装）
        const currentPredictions = PredictionEngine.getCurrentPredictions();
        const horse = currentPredictions.find(h => h.name === horseName);
        return horse ? horse.odds : 0;
    }

    static classifyHorses(predictions, sortedByWinProbability, sortedByWinExpected) {
        const marks = {
            honmei: null,      // ◎ 本命
            taikou: null,      // ○ 対抗
            tanana: null,      // ▲ 単穴
            renpuku: null      // △ 連複
        };

        // ◎ 本命: 最も勝率が高い馬（学習調整済み閾値使用）
        const topWinProbabilityHorse = sortedByWinProbability[0];
        if (topWinProbabilityHorse && topWinProbabilityHorse.winProbability > this.learningThresholds.winProbabilityMin) {
            marks.honmei = topWinProbabilityHorse;
        }

        // ○ 対抗: 期待値重視で本命以外（学習調整済み閾値使用 + 最低勝率チェック）
        const topExpectedHorse = sortedByWinExpected[0];
        if (topExpectedHorse && 
            topExpectedHorse.winExpectedValue > this.learningThresholds.expectedValueMin &&
            topExpectedHorse.winProbability >= 2.0 && // 最低勝率2%以上
            (!marks.honmei || topExpectedHorse.name !== marks.honmei.name)) {
            marks.taikou = topExpectedHorse;
        }

        // ▲ 単穴: 中オッズで期待値が良い馬（学習調整済みオッズ範囲使用）
        const mediumOddsHorses = predictions.filter(h => 
            h.odds >= this.learningThresholds.mediumOddsMin && 
            h.odds <= this.learningThresholds.mediumOddsMax && 
            h.winExpectedValue > 0.05 &&
            (!marks.honmei || h.name !== marks.honmei.name) &&
            (!marks.taikou || h.name !== marks.taikou.name)
        );
        if (mediumOddsHorses.length > 0) {
            marks.tanana = mediumOddsHorses.sort((a, b) => b.winExpectedValue - a.winExpectedValue)[0];
        }

        // △ 連複: 複勝率が高い馬（学習調整済み閾値使用）
        const highPlaceHorses = predictions.filter(h => 
            h.placeProbability > this.learningThresholds.placeProbabilityMin &&
            (!marks.honmei || h.name !== marks.honmei.name) &&
            (!marks.taikou || h.name !== marks.taikou.name) &&
            (!marks.tanana || h.name !== marks.tanana.name)
        );
        if (highPlaceHorses.length > 0) {
            marks.renpuku = highPlaceHorses.sort((a, b) => b.placeProbability - a.placeProbability)[0];
        }

        return marks;
    }

    static generateRecommendationsFromMarks(marks, getHorseNumber) {
        const recommendations = [];

        // 単勝推奨
        if (marks.honmei) {
            recommendations.push({
                category: '単勝',
                mark: '◎',
                type: '本命',
                horse: `${marks.honmei.name}（${getHorseNumber(marks.honmei.name)}番）`,
                odds: `${marks.honmei.odds}倍`,
                probability: `${marks.honmei.winProbability}%`,
                confidence: marks.honmei.winProbability > 15 ? 'high' : 'medium',
                amount: marks.honmei.winProbability > 15 ? '500-1000円' : '300-600円'
            });
        }

        if (marks.taikou) {
            const isHighRisk = marks.taikou.winProbability < 5 && marks.taikou.odds > 50;
            recommendations.push({
                category: '単勝',
                mark: '○',
                type: '対抗',
                horse: `${marks.taikou.name}（${getHorseNumber(marks.taikou.name)}番）`,
                odds: `${marks.taikou.odds}倍`,
                probability: `${marks.taikou.winProbability}%`,
                confidence: isHighRisk ? 'low' : 'medium',
                amount: isHighRisk ? '200-400円' : '400-700円'
            });
        }

        if (marks.tanana) {
            recommendations.push({
                category: '単勝',
                mark: '▲',
                type: '単穴',
                horse: `${marks.tanana.name}（${getHorseNumber(marks.tanana.name)}番）`,
                odds: `${marks.tanana.odds}倍`,
                probability: `${marks.tanana.winProbability}%`,
                confidence: 'medium',
                amount: '200-500円'
            });
        }

        // 複勝推奨
        if (marks.renpuku) {
            recommendations.push({
                category: '複勝',
                mark: '△',
                type: '連複',
                horse: `${marks.renpuku.name}（${getHorseNumber(marks.renpuku.name)}番）`,
                odds: `複勝${(marks.renpuku.odds * 0.3).toFixed(1)}倍`,
                probability: `${marks.renpuku.placeProbability}%`,
                confidence: marks.renpuku.placeProbability > 50 ? 'high' : 'medium',
                amount: '200-400円'
            });
        }

        // ワイド推奨（上位2頭）
        const wideHorses = [marks.honmei, marks.taikou].filter(h => h);
        if (wideHorses.length === 2) {
            const combinedPlaceProb = (wideHorses[0].placeProbability + wideHorses[1].placeProbability) / 2;
            recommendations.push({
                category: 'ワイド',
                mark: '◎○',
                type: '本命-対抗',
                horse: `${wideHorses[0].name}（${getHorseNumber(wideHorses[0].name)}番）- ${wideHorses[1].name}（${getHorseNumber(wideHorses[1].name)}番）`,
                odds: this.calculateWideOdds(wideHorses[0], wideHorses[1]),
                probability: `${Math.round(combinedPlaceProb)}%`,
                confidence: combinedPlaceProb > 60 ? 'high' : 'medium',
                amount: '300-600円'
            });
        }

        return recommendations;
    }


    static displayBettingRecommendations(recommendations, horseMarks) {
        const container = document.getElementById('bettingContainer');
        
        if (recommendations.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">推奨できる買い目がありません。</p>';
            return;
        }

        // 印による馬の分類表示
        let marksHtml = `
            <div style="background: white; border-radius: 10px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h4 style="margin: 0 0 10px 0; color: #333;">🏇 今回の印</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
        `;

        if (horseMarks.honmei) {
            marksHtml += `
                <div style="padding: 8px; background: #fff3cd; border-radius: 6px; border-left: 3px solid #ffc107;">
                    <strong>◎ 本命:</strong> ${horseMarks.honmei.name}
                </div>
            `;
        }

        if (horseMarks.taikou) {
            marksHtml += `
                <div style="padding: 8px; background: #d4edda; border-radius: 6px; border-left: 3px solid #28a745;">
                    <strong>○ 対抗:</strong> ${horseMarks.taikou.name}
                </div>
            `;
        }

        if (horseMarks.tanana) {
            marksHtml += `
                <div style="padding: 8px; background: #d1ecf1; border-radius: 6px; border-left: 3px solid #17a2b8;">
                    <strong>▲ 単穴:</strong> ${horseMarks.tanana.name}
                </div>
            `;
        }

        if (horseMarks.renpuku) {
            marksHtml += `
                <div style="padding: 8px; background: #f8d7da; border-radius: 6px; border-left: 3px solid #dc3545;">
                    <strong>△ 連複:</strong> ${horseMarks.renpuku.name}
                </div>
            `;
        }

        marksHtml += `
                </div>
            </div>
        `;

        // 買い目推奨テーブル
        let html = `
            <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                            <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #495057;">印</th>
                            <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #495057;">券種</th>
                            <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #495057;">馬名・馬番</th>
                            <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #495057;">オッズ</th>
                            <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #495057;">確率</th>
                            <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #495057;">推奨金額</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        recommendations.forEach((rec, index) => {
            const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
            
            html += `
                <tr style="background: ${bgColor}; border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 12px 8px; text-align: center; vertical-align: middle; font-size: 1.2em; font-weight: bold;">
                        ${rec.mark}
                    </td>
                    <td style="padding: 12px 8px; vertical-align: middle;">
                        <div style="font-weight: 600; color: #333;">${rec.category}</div>
                        <div style="font-size: 0.85em; color: #666;">${rec.type}</div>
                    </td>
                    <td style="padding: 12px 8px; vertical-align: middle; font-weight: 500;">
                        ${rec.horse}
                    </td>
                    <td style="padding: 12px 8px; text-align: center; vertical-align: middle; font-weight: 500;">
                        ${rec.odds}
                    </td>
                    <td style="padding: 12px 8px; text-align: center; vertical-align: middle; font-weight: 500;">
                        ${rec.probability}
                    </td>
                    <td style="padding: 12px 8px; text-align: center; vertical-align: middle; color: #007bff; font-weight: 500;">
                        ${rec.amount}
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 15px; padding: 12px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">
                <p style="margin: 0; font-size: 0.9em; color: #1976d2;">
                    💡 <strong>印の意味:</strong> ◎本命（安全重視）、○対抗（期待値重視）、▲単穴（中オッズ狙い）、△連複（3着以内狙い）
                </p>
            </div>
        `;

        container.innerHTML = marksHtml + html;
    }

    // 買い目推奨の結果を学習システムに送信
    static recordBettingRecommendation(recommendations, actualResult) {
        if (!actualResult) return;

        const bettingResult = {
            date: new Date().toLocaleDateString(),
            recommendations: recommendations.map(rec => ({
                mark: rec.mark,
                category: rec.category,
                horse: rec.horse.split('（')[0], // 馬名のみ
                confidence: rec.confidence
            })),
            actualWinner: actualResult.winner,
            actualPlace: actualResult.place || [],
            thresholds: { ...this.learningThresholds }
        };

        this.bettingHistory.push(bettingResult);
        
        // 履歴制限
        if (this.bettingHistory.length > 50) {
            this.bettingHistory = this.bettingHistory.slice(-50);
        }

        // ローカルストレージに保存
        localStorage.setItem('keibaAppBettingHistory', JSON.stringify(this.bettingHistory));
    }

    // 買い目推奨の成績を分析
    static analyzeBettingPerformance() {
        if (this.bettingHistory.length === 0) return null;

        const recent = this.bettingHistory.slice(-20);
        let honmeiHits = 0;
        let taikouHits = 0;
        let tananaHits = 0;
        let renpukuHits = 0;

        recent.forEach(result => {
            const honmeiRec = result.recommendations.find(r => r.mark === '◎');
            const taikouRec = result.recommendations.find(r => r.mark === '○');
            const tananaRec = result.recommendations.find(r => r.mark === '▲');
            const renpukuRec = result.recommendations.find(r => r.mark === '△');

            if (honmeiRec && honmeiRec.horse === result.actualWinner) honmeiHits++;
            if (taikouRec && taikouRec.horse === result.actualWinner) taikouHits++;
            if (tananaRec && tananaRec.horse === result.actualWinner) tananaHits++;
            if (renpukuRec && result.actualPlace.includes(renpukuRec.horse)) renpukuHits++;
        });

        return {
            totalRaces: recent.length,
            honmeiHitRate: honmeiHits / recent.length,
            taikouHitRate: taikouHits / recent.length,
            tananaHitRate: tananaHits / recent.length,
            renpukuHitRate: renpukuHits / recent.length,
            currentThresholds: { ...this.learningThresholds }
        };
    }

    // ワイド倍率計算メソッド
    static calculateWideOdds(horse1, horse2) {
        // 各馬の複勝率を取得（パーセンテージから小数に変換）
        const place1 = Math.min(horse1.placeProbability / 100, 0.9); // 最大90%に制限
        const place2 = Math.min(horse2.placeProbability / 100, 0.9);
        
        // ワイド的中確率 = 1 - (両方とも3着以内に入らない確率)
        const wideHitProb = 1 - (1 - place1) * (1 - place2);
        
        // 控除率25%を考慮した理論倍率
        const theoreticalOdds = 1 / wideHitProb;
        const adjustedOdds = theoreticalOdds * 1.25;
        
        // 人気度による補正（単勝オッズから人気薄度を判定）
        const avgOdds = (horse1.odds + horse2.odds) / 2;
        let popularityFactor = 1.0;
        
        if (avgOdds <= 3) {
            popularityFactor = 0.7; // 人気馬同士は倍率が下がる
        } else if (avgOdds <= 10) {
            popularityFactor = 1.0; // 標準
        } else {
            popularityFactor = Math.min(2.0, avgOdds / 10); // 人気薄は倍率が上がる
        }
        
        const finalOdds = adjustedOdds * popularityFactor;
        
        // 範囲表示（最低1.1倍から）
        const min = Math.max(1.1, finalOdds * 0.8);
        const max = finalOdds * 1.2;
        
        return `推定${min.toFixed(1)}-${max.toFixed(1)}倍`;
    }

    // 3連複推奨機能
    static generateTripleBoxRecommendations(marks, predictions, getHorseNumber) {
        const tripleRecommendations = [];
        
        // 印のついた馬のリストを作成
        const markedHorses = [marks.honmei, marks.taikou, marks.tanana, marks.renpuku].filter(h => h);
        
        // 3頭以上の印がある場合のみ3連複推奨
        if (markedHorses.length >= 3) {
            console.log('🎯 3連複推奨生成開始', { markedHorses: markedHorses.map(h => h.name) });
            
            // 学習された効率閾値を取得
            const learningThresholds = LearningSystem.getComplexBettingThresholds();
            
            // メイン3連複（上位3頭）
            const topThree = markedHorses.slice(0, 3);
            const mainTripleBox = this.calculateTripleBoxExpectedValue(topThree, predictions);
            
            if (mainTripleBox.efficiency > learningThresholds.tripleBox.main) {
                tripleRecommendations.push({
                    category: '3連複',
                    mark: this.getTripleBoxMark(topThree, marks),
                    type: 'メイン',
                    horse: `${topThree[0].name}（${getHorseNumber(topThree[0].name)}番）- ${topThree[1].name}（${getHorseNumber(topThree[1].name)}番）- ${topThree[2].name}（${getHorseNumber(topThree[2].name)}番）`,
                    odds: `推定${mainTripleBox.estimatedDividend}倍`,
                    probability: `${mainTripleBox.hitProbability.toFixed(1)}%`,
                    confidence: mainTripleBox.efficiency > 1.2 ? 'high' : 'medium',
                    amount: mainTripleBox.efficiency > 1.2 ? '500-1000円' : '300-600円',
                    efficiency: mainTripleBox.efficiency
                });
            }
            
            // 4頭以上ある場合、代替3連複も生成
            if (markedHorses.length >= 4) {
                const altTriple = [markedHorses[0], markedHorses[1], markedHorses[3]]; // 1,2,4番目
                const altTripleBox = this.calculateTripleBoxExpectedValue(altTriple, predictions);
                
                if (altTripleBox.efficiency > learningThresholds.tripleBox.formation) {
                    tripleRecommendations.push({
                        category: '3連複',
                        mark: this.getTripleBoxMark(altTriple, marks),
                        type: 'サブ',
                        horse: `${altTriple[0].name}（${getHorseNumber(altTriple[0].name)}番）- ${altTriple[1].name}（${getHorseNumber(altTriple[1].name)}番）- ${altTriple[2].name}（${getHorseNumber(altTriple[2].name)}番）`,
                        odds: `推定${altTripleBox.estimatedDividend}倍`,
                        probability: `${altTripleBox.hitProbability.toFixed(1)}%`,
                        confidence: 'medium',
                        amount: '200-400円',
                        efficiency: altTripleBox.efficiency
                    });
                }
            }
        }
        
        console.log('🎯 3連複推奨結果', { count: tripleRecommendations.length });
        return tripleRecommendations;
    }
    
    // 3連複の印表示生成
    static getTripleBoxMark(horses, marks) {
        const symbols = [];
        horses.forEach(horse => {
            if (marks.honmei && horse.name === marks.honmei.name) symbols.push('◎');
            else if (marks.taikou && horse.name === marks.taikou.name) symbols.push('○');
            else if (marks.tanana && horse.name === marks.tanana.name) symbols.push('▲');
            else if (marks.renpuku && horse.name === marks.renpuku.name) symbols.push('△');
        });
        return symbols.join('');
    }
    
    // 3連複期待値計算
    static calculateTripleBoxExpectedValue(tripleHorses, allPredictions) {
        if (tripleHorses.length !== 3) {
            return { hitProbability: 0, estimatedDividend: 0, efficiency: 0 };
        }
        
        const [horse1, horse2, horse3] = tripleHorses;
        
        console.log('🧮 3連複期待値計算開始', {
            horses: tripleHorses.map(h => h.name),
            placeProbabilities: tripleHorses.map(h => h.placeProbability)
        });
        
        // 各馬の3着以内確率（より現実的な範囲に調整）
        const place1 = Math.min(horse1.placeProbability / 100, 0.85);
        const place2 = Math.min(horse2.placeProbability / 100, 0.85);
        const place3 = Math.min(horse3.placeProbability / 100, 0.85);
        
        // 3連複的中確率の改良計算
        // 単純積算ではなく、より現実的な確率計算
        const avgPlaceProb = (place1 + place2 + place3) / 3;
        
        // 基本的中確率（3頭すべてが3着以内に入る確率）
        // 改良: 上位馬への重み付けとより現実的な計算
        let baseHitProb;
        if (avgPlaceProb > 0.5) {
            // 上位馬中心の場合: より高い確率
            baseHitProb = Math.min(0.25, avgPlaceProb * 0.4);
        } else if (avgPlaceProb > 0.35) {
            // 中堅馬中心の場合: 中程度の確率
            baseHitProb = Math.min(0.15, avgPlaceProb * 0.35);
        } else {
            // 下位馬中心の場合: 低い確率
            baseHitProb = Math.min(0.08, avgPlaceProb * 0.25);
        }
        
        // 競合馬の影響を考慮した補正
        const otherHorses = allPredictions.filter(h => 
            !tripleHorses.some(th => th.name === h.name)
        );
        
        // 他馬の平均複勝率から競争の激しさを判定
        const avgOtherPlaceProb = otherHorses.length > 0 
            ? otherHorses.reduce((sum, h) => sum + h.placeProbability, 0) / otherHorses.length / 100
            : 0.25;
        
        // 競争補正係数（他馬が強いほど的中確率下がる）
        const competitionFactor = Math.max(0.6, 1.2 - avgOtherPlaceProb);
        
        // 最終的中確率
        const hitProbability = baseHitProb * competitionFactor;
        
        // 配当予想の改良（より現実的な範囲）
        const avgOdds = (horse1.odds + horse2.odds + horse3.odds) / 3;
        const minOdds = Math.min(horse1.odds, horse2.odds, horse3.odds);
        const maxOdds = Math.max(horse1.odds, horse2.odds, horse3.odds);
        
        let estimatedDividend;
        if (avgOdds <= 4) {
            // 人気馬中心: 手堅い配当
            estimatedDividend = Math.round(25 + avgOdds * 8);
        } else if (avgOdds <= 10) {
            // 中人気馬中心: 中程度配当
            estimatedDividend = Math.round(50 + avgOdds * 12);
        } else {
            // 人気薄中心: 高配当期待
            estimatedDividend = Math.round(80 + avgOdds * 15);
        }
        
        // オッズのばらつきによる配当調整
        const oddsSpread = maxOdds - minOdds;
        if (oddsSpread > 15) {
            estimatedDividend = Math.round(estimatedDividend * 1.3); // ばらつき大なら配当アップ
        }
        
        // 期待値効率（100円投資あたりの期待リターン）
        const efficiency = (hitProbability * estimatedDividend) / 100;
        
        console.log('🧮 3連複計算結果', {
            hitProbability: (hitProbability * 100).toFixed(2) + '%',
            estimatedDividend: estimatedDividend + '倍',
            efficiency: efficiency.toFixed(2),
            competitionFactor: competitionFactor.toFixed(2),
            avgPlaceProb: (avgPlaceProb * 100).toFixed(1) + '%'
        });
        
        return {
            hitProbability: hitProbability * 100, // パーセンテージ表示用
            estimatedDividend,
            efficiency
        };
    }

    // 3連単推奨機能
    static generateTripleExactRecommendations(marks, predictions, getHorseNumber) {
        const tripleExactRecommendations = [];
        
        // 印のついた馬のリストを作成
        const markedHorses = [marks.honmei, marks.taikou, marks.tanana, marks.renpuku].filter(h => h);
        
        // 3頭以上の印がある場合のみ3連単推奨
        if (markedHorses.length >= 3) {
            console.log('🏁 3連単推奨生成開始', { markedHorses: markedHorses.map(h => h.name) });
            
            // 学習された効率閾値を取得
            const learningThresholds = LearningSystem.getComplexBettingThresholds();
            
            // 本命軸メイン3連単（着順重要）
            if (marks.honmei && marks.taikou && marks.tanana) {
                const mainTripleExact = this.calculateTripleExactExpectedValue(
                    [marks.honmei, marks.taikou, marks.tanana], 
                    predictions
                );
                
                if (mainTripleExact.efficiency > learningThresholds.tripleExact.main) {
                    tripleExactRecommendations.push({
                        category: '3連単',
                        mark: '◎○▲',
                        type: '軸流し',
                        horse: `1着:◎${marks.honmei.name}（${getHorseNumber(marks.honmei.name)}番） 2-3着:○${marks.taikou.name},▲${marks.tanana.name}`,
                        odds: `推定${mainTripleExact.estimatedDividend}倍`,
                        probability: `${mainTripleExact.hitProbability.toFixed(2)}%`,
                        confidence: mainTripleExact.efficiency > 0.15 ? 'medium' : 'low',
                        amount: mainTripleExact.efficiency > 0.15 ? '200-500円' : '100-300円',
                        efficiency: mainTripleExact.efficiency,
                        strategy: '本命軸流し'
                    });
                }
            }
            
            // 対抗軸フォーメーション
            if (marks.taikou && markedHorses.length >= 4) {
                const formationTripleExact = this.calculateTripleExactExpectedValue(
                    [marks.taikou, marks.honmei, marks.tanana], 
                    predictions
                );
                
                if (formationTripleExact.efficiency > learningThresholds.tripleExact.formation) {
                    tripleExactRecommendations.push({
                        category: '3連単',
                        mark: '○◎▲',
                        type: '穴狙い',
                        horse: `1着:○${marks.taikou.name}（${getHorseNumber(marks.taikou.name)}番） 2-3着:◎${marks.honmei.name},▲${marks.tanana.name}`,
                        odds: `推定${formationTripleExact.estimatedDividend}倍`,
                        probability: `${formationTripleExact.hitProbability.toFixed(2)}%`,
                        confidence: 'low',
                        amount: '100-200円',
                        efficiency: formationTripleExact.efficiency,
                        strategy: '穴狙いフォーメーション'
                    });
                }
            }
        }
        
        console.log('🏁 3連単推奨結果', { count: tripleExactRecommendations.length });
        return tripleExactRecommendations;
    }
    
    // 3連単期待値計算（着順固定）
    static calculateTripleExactExpectedValue(orderedHorses, allPredictions) {
        if (orderedHorses.length !== 3) {
            return { hitProbability: 0, estimatedDividend: 0, efficiency: 0 };
        }
        
        const [first, second, third] = orderedHorses;
        
        console.log('🧮 3連単期待値計算開始', {
            order: orderedHorses.map(h => h.name),
            winProbs: orderedHorses.map(h => h.winProbability),
            placeProbs: orderedHorses.map(h => h.placeProbability)
        });
        
        // 各着順の確率計算（着順固定のためより厳しい）
        const firstProb = Math.min(first.winProbability / 100, 0.6); // 1着確率
        const secondGivenFirst = Math.min(second.placeProbability / 100 * 0.7, 0.5); // 1着除いた2着確率
        const thirdGivenFirstSecond = Math.min(third.placeProbability / 100 * 0.5, 0.4); // 1,2着除いた3着確率
        
        // 3連単的中確率（着順固定）
        const baseHitProb = firstProb * secondGivenFirst * thirdGivenFirstSecond;
        
        // 競合馬の影響を考慮した補正
        const otherHorses = allPredictions.filter(h => 
            !orderedHorses.some(oh => oh.name === h.name)
        );
        
        // 他馬の平均労力から競争の激しさを判定
        const avgOtherWinProb = otherHorses.length > 0 
            ? otherHorses.reduce((sum, h) => sum + h.winProbability, 0) / otherHorses.length / 100
            : 0.1;
        
        // 競争補正係数（他馬が強いほど的中確率下がる）
        const competitionFactor = Math.max(0.4, 1.3 - avgOtherWinProb * 2);
        
        // 最終的中確率
        const hitProbability = baseHitProb * competitionFactor;
        
        // 配当予想（着順固定のため高配当）
        const avgOdds = (first.odds + second.odds + third.odds) / 3;
        const maxOdds = Math.max(first.odds, second.odds, third.odds);
        
        let estimatedDividend;
        if (avgOdds <= 5) {
            estimatedDividend = Math.round(200 + avgOdds * 30); // 200-350倍
        } else if (avgOdds <= 12) {
            estimatedDividend = Math.round(400 + avgOdds * 50); // 400-1000倍
        } else {
            estimatedDividend = Math.round(800 + avgOdds * 80); // 800-2400倍以上
        }
        
        // 上位人気馬が着外する穴狙いパターンなら配当アップ
        if (maxOdds > 20) {
            estimatedDividend = Math.round(estimatedDividend * 1.5);
        }
        
        // 期待値効率（100円投資あたりの期待リターン）
        const efficiency = (hitProbability * estimatedDividend) / 100;
        
        console.log('🧮 3連単計算結果', {
            hitProbability: (hitProbability * 100).toFixed(3) + '%',
            estimatedDividend: estimatedDividend + '倍',
            efficiency: efficiency.toFixed(3),
            competitionFactor: competitionFactor.toFixed(2),
            baseHitProb: (baseHitProb * 100).toFixed(3) + '%'
        });
        
        return {
            hitProbability: hitProbability * 100, // パーセンテージ表示用
            estimatedDividend,
            efficiency
        };
    }

    // 初期化時に履歴を読み込み
    static initialize() {
        try {
            const saved = localStorage.getItem('keibaAppBettingHistory');
            if (saved) {
                this.bettingHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.error('買い目履歴の読み込みに失敗:', error);
            this.bettingHistory = [];
        }
    }
} 