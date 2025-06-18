// 買い目推奨機能
class BettingRecommender {
    static generateBettingRecommendations(predictions) {
        const container = document.getElementById('bettingContainer');
        const recommendations = [];

        // 各種ソート
        const sortedByWinExpected = [...predictions].sort((a, b) => b.winExpectedValue - a.winExpectedValue);
        const sortedByPlaceExpected = [...predictions].sort((a, b) => b.placeExpectedValue - a.placeExpectedValue);
        const sortedByWinProbability = [...predictions].sort((a, b) => b.winProbability - a.winProbability);

        // 馬番を取得する関数
        function getHorseNumber(horseName) {
            const index = predictions.findIndex(h => h.name === horseName);
            return index !== -1 ? index + 1 : '?';
        }

        // 1. 単勝おすすめ（期待値重視）
        let selectedWinHorse = null;
        for (let i = 0; i < sortedByWinExpected.length; i++) {
            const horse = sortedByWinExpected[i];
            if (horse.winExpectedValue <= CONFIG.EXPECTED_VALUE_THRESHOLDS.WIN_MIN) break;
            
            const isVeryHighRisk = horse.winProbability < 3 && horse.odds > 100;
            
            if (!isVeryHighRisk) {
                selectedWinHorse = horse;
                break;
            }
        }
        
        if (selectedWinHorse) {
            const isHighRisk = selectedWinHorse.winProbability < 5 && selectedWinHorse.odds > 50;
            
            let confidence = 'medium';
            let riskLevel = '';
            
            if (isHighRisk) {
                confidence = 'medium';
                riskLevel = ' ⚠️ハイリスク';
            } else if (selectedWinHorse.winExpectedValue > 0.5 && selectedWinHorse.winProbability > 10) {
                confidence = 'high';
            } else if (selectedWinHorse.winExpectedValue > 0.3 && selectedWinHorse.winProbability > 8) {
                confidence = 'high';
            } else {
                confidence = 'medium';
            }
            
            let recommendedAmount = '';
            if (isHighRisk) {
                recommendedAmount = '200-400円（リスク考慮）';
            } else if (confidence === 'high') {
                recommendedAmount = '500-1000円';
            } else {
                recommendedAmount = '300-500円';
            }
            
            let reason = `勝率${selectedWinHorse.winProbability}%、期待値+${selectedWinHorse.winExpectedValue}`;
            if (isHighRisk) {
                reason += '。勝率5%未満のハイリスク大穴狙い';
            } else if (selectedWinHorse.winProbability > 15) {
                reason += 'の好条件';
            } else {
                reason += '。期待値は良好';
            }
            
            const rank = sortedByWinExpected.indexOf(selectedWinHorse) + 1;
            if (rank > 1) {
                reason += `（期待値${rank}位）`;
            }
            
            recommendations.push({
                type: `🏆 単勝【期待値重視】${riskLevel}`,
                confidence: confidence,
                horses: `${selectedWinHorse.name}（${getHorseNumber(selectedWinHorse.name)}番）`,
                expectedReturn: Math.round(selectedWinHorse.winExpectedValue * 100),
                probability: selectedWinHorse.winProbability,
                recommendedAmount: recommendedAmount,
                reason: reason
            });
        }

        // 2. 単勝おすすめ（的中率重視）
        const topWinProbabilityHorse = sortedByWinProbability[0];
        if (topWinProbabilityHorse && topWinProbabilityHorse.winProbability > 8) {
            // 期待値重視と同じ馬でない場合のみ追加
            if (!selectedWinHorse || selectedWinHorse.name !== topWinProbabilityHorse.name) {
                let confidence = 'medium';
                if (topWinProbabilityHorse.winProbability > 20) {
                    confidence = 'high';
                } else if (topWinProbabilityHorse.winProbability > 12) {
                    confidence = 'medium';
                } else {
                    confidence = 'low';
                }

                let recommendedAmount = '';
                if (confidence === 'high') {
                    recommendedAmount = '400-800円';
                } else if (confidence === 'medium') {
                    recommendedAmount = '300-600円';
                } else {
                    recommendedAmount = '200-400円';
                }

                const probRank = sortedByWinProbability.indexOf(topWinProbabilityHorse) + 1;
                let reason = `勝率${topWinProbabilityHorse.winProbability}%で最も的中しやすい`;
                if (topWinProbabilityHorse.winExpectedValue > 0) {
                    reason += `、期待値も+${topWinProbabilityHorse.winExpectedValue}`;
                } else {
                    reason += `、期待値は${topWinProbabilityHorse.winExpectedValue}と低め`;
                }

                recommendations.push({
                    type: '🎯 単勝【的中率重視】',
                    confidence: confidence,
                    horses: `${topWinProbabilityHorse.name}（${getHorseNumber(topWinProbabilityHorse.name)}番）`,
                    expectedReturn: Math.round(topWinProbabilityHorse.winExpectedValue * 100),
                    probability: topWinProbabilityHorse.winProbability,
                    recommendedAmount: recommendedAmount,
                    reason: reason
                });
            }
        }

        // 3. 複勝おすすめ
        const topPlaceHorse = sortedByPlaceExpected[0];
        if (topPlaceHorse && topPlaceHorse.placeExpectedValue > CONFIG.EXPECTED_VALUE_THRESHOLDS.PLACE_MIN) {
            let confidence = 'low';
            if (topPlaceHorse.placeExpectedValue > 0.2 && topPlaceHorse.placeProbability > 40) {
                confidence = 'high';
            } else if (topPlaceHorse.placeExpectedValue > 0.1 && topPlaceHorse.placeProbability > 25) {
                confidence = 'medium';
            }

            recommendations.push({
                type: '🥉 複勝',
                confidence: confidence,
                horses: `${topPlaceHorse.name}（${getHorseNumber(topPlaceHorse.name)}番）`,
                expectedReturn: Math.round(topPlaceHorse.placeExpectedValue * 100),
                probability: topPlaceHorse.placeProbability,
                recommendedAmount: confidence === 'high' ? '300-600円' : confidence === 'medium' ? '200-400円' : '100-300円',
                reason: `複勝率${topPlaceHorse.placeProbability}%、期待値+${topPlaceHorse.placeExpectedValue}`
            });
        }

        // 4. 改良版ワイド推奨（スコア緑から選択）
        const highConfidenceHorses = predictions.filter(h => h.score >= CONFIG.SCORE_RANGES.HIGH);
        
        if (highConfidenceHorses.length >= 2) {
            const wideCombinations = [];
            
            // 高信頼度馬同士の全組み合わせを生成
            for (let i = 0; i < highConfidenceHorses.length; i++) {
                for (let j = i + 1; j < highConfidenceHorses.length; j++) {
                    const horseA = highConfidenceHorses[i];
                    const horseB = highConfidenceHorses[j];
                    
                    // ワイドオッズを推定
                    const avgOdds = Math.sqrt(horseA.odds * horseB.odds);
                    const estimatedWideOdds = avgOdds * 0.25; // ワイドオッズ係数
                    
                    // 組み合わせの的中確率を推定
                    const combinedPlaceProb = Math.min(80, 
                        (horseA.placeProbability + horseB.placeProbability) / 1.8);
                    
                    // 期待値計算
                    const expectedValue = (combinedPlaceProb / 100 * estimatedWideOdds - 1);
                    
                    // オッズ条件（1.8倍以上）と期待値条件をクリア
                    if (estimatedWideOdds >= 1.8 && expectedValue > CONFIG.EXPECTED_VALUE_THRESHOLDS.WIDE_MIN) {
                        wideCombinations.push({
                            horseA: horseA,
                            horseB: horseB,
                            estimatedOdds: estimatedWideOdds,
                            probability: combinedPlaceProb,
                            expectedValue: expectedValue,
                            scoreSum: horseA.score + horseB.score
                        });
                    }
                }
            }
            
            // 期待値順でソート
            wideCombinations.sort((a, b) => b.expectedValue - a.expectedValue);
            
            // 上位3つまでを推奨
            const topWideRecommendations = wideCombinations.slice(0, 3);
            
            topWideRecommendations.forEach((combo, index) => {
                let confidence = 'medium';
                if (combo.expectedValue > 0.15 && combo.probability > 60) {
                    confidence = 'high';
                } else if (combo.expectedValue > 0.08 && combo.probability > 45) {
                    confidence = 'medium';
                } else {
                    confidence = 'low';
                }
                
                let recommendedAmount = '';
                if (confidence === 'high') {
                    recommendedAmount = '400-800円';
                } else if (confidence === 'medium') {
                    recommendedAmount = '200-500円';
                } else {
                    recommendedAmount = '100-300円';
                }
                
                const priority = index === 0 ? '【最推奨】' : index === 1 ? '【次点】' : '【参考】';
                
                recommendations.push({
                    type: `🎯 ワイド${priority}`,
                    confidence: confidence,
                    horses: `${combo.horseA.name}（${getHorseNumber(combo.horseA.name)}番）- ${combo.horseB.name}（${getHorseNumber(combo.horseB.name)}番）`,
                    expectedReturn: Math.round(combo.expectedValue * 100),
                    probability: Math.round(combo.probability),
                    recommendedAmount: recommendedAmount,
                    reason: `スコア合計${Math.round(combo.scoreSum)}、推定オッズ${combo.estimatedOdds.toFixed(1)}倍、的中率${Math.round(combo.probability)}%`
                });
            });
        }

        // 5. 従来のワイド（フォールバック用）
        if (highConfidenceHorses.length < 2) {
            const sortedByScore = [...predictions].sort((a, b) => b.score - a.score);
            if (sortedByScore.length >= 2) {
                const first = sortedByScore[0];
                const second = sortedByScore[1];
                
                if (first.score >= 55 && second.score >= 50) {
                    const combinedProb = (first.placeProbability + second.placeProbability) / 2;
                    const avgOdds = Math.sqrt(first.odds * second.odds);
                    const wideOdds = avgOdds * 0.2;
                    const wideExpected = (combinedProb / 100 * wideOdds - 1);

                    if (wideExpected > 0) {
                        recommendations.push({
                            type: '🎯 ワイド【標準】',
                            confidence: combinedProb > 70 ? 'high' : combinedProb > 50 ? 'medium' : 'low',
                            horses: `${first.name}（${getHorseNumber(first.name)}番）- ${second.name}（${getHorseNumber(second.name)}番）`,
                            expectedReturn: Math.round(wideExpected * 100),
                            probability: Math.round(combinedProb),
                            recommendedAmount: '200-500円',
                            reason: `上位2頭の標準的な組み合わせ`
                        });
                    }
                }
            }
        }

        // 6. 穴狙い単勝
        const bigOddsHorses = predictions.filter(h => h.odds > 20 && h.winExpectedValue > 0);
        if (bigOddsHorses.length > 0) {
            const bigOddsHorse = bigOddsHorses.sort((a, b) => b.winExpectedValue - a.winExpectedValue)[0];
            const isVeryHighRisk = bigOddsHorse.winProbability < 3;

            recommendations.push({
                type: isVeryHighRisk ? '💥 穴狙い単勝（超ハイリスク）' : '💥 穴狙い単勝',
                confidence: 'low',
                horses: `${bigOddsHorse.name}（${getHorseNumber(bigOddsHorse.name)}番）`,
                expectedReturn: Math.round(bigOddsHorse.winExpectedValue * 100),
                probability: bigOddsHorse.winProbability,
                recommendedAmount: isVeryHighRisk ? '50-100円（超少額）' : '100-200円（少額）',
                reason: isVeryHighRisk ? 
                    `勝率${bigOddsHorse.winProbability}%の超ハイリスク。97%負けるギャンブル性の高い馬券` :
                    `大穴狙い。勝率${bigOddsHorse.winProbability}%だが高配当の可能性`
            });
        }

        this.displayBettingRecommendations(recommendations);
    }

    static displayBettingRecommendations(recommendations) {
        const container = document.getElementById('bettingContainer');
        
        if (recommendations.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">推奨できる買い目がありません。</p>';
            return;
        }

        let html = '';
        
        recommendations.forEach(rec => {
            const confidenceColor = rec.confidence === 'high' ? '#28a745' : 
                                  rec.confidence === 'medium' ? '#ffc107' : '#dc3545';
            const confidenceText = rec.confidence === 'high' ? '高' : 
                                 rec.confidence === 'medium' ? '中' : '低';

            html += `
                <div style="background: white; padding: 15px; border-radius: 10px; margin-bottom: 15px; border-left: 5px solid ${confidenceColor};">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h4 style="color: #333; margin: 0;">${rec.type}</h4>
                        <span style="background: ${confidenceColor}; color: white; padding: 4px 8px; border-radius: 15px; font-size: 0.8em;">
                            推奨度: ${confidenceText}
                        </span>
                    </div>
                    <div style="margin-bottom: 8px;"><strong>馬番・馬名:</strong> ${rec.horses}</div>
                    <div style="margin-bottom: 8px;"><strong>的中確率:</strong> ${rec.probability}%</div>
                    <div style="margin-bottom: 8px;"><strong>期待リターン:</strong> +${rec.expectedReturn}%</div>
                    <div style="margin-bottom: 8px;"><strong>推奨金額:</strong> ${rec.recommendedAmount}</div>
                    <div style="color: #666; font-size: 0.9em;"><strong>理由:</strong> ${rec.reason}</div>
                </div>
            `;
        });

        container.innerHTML = html;
    }
} 