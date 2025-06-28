// 機械学習システム機能
class LearningSystem {
    static learningData = { ...INITIAL_LEARNING_DATA };

    // 学習データの保存・読み込み機能を追加
    static saveLearningData() {
        try {
            localStorage.setItem('keibaLearningData', JSON.stringify(this.learningData));
            //console.log('学習データを保存しました');
        } catch (error) {
            console.error('学習データの保存に失敗しました:', error);
        }
    }

    static loadLearningData() {
        try {
            const savedData = localStorage.getItem('keibaLearningData');
            if (savedData) {
                this.learningData = JSON.parse(savedData);
                //console.log('学習データを読み込みました');
            }
        } catch (error) {
            console.error('学習データの読み込みに失敗しました:', error);
            this.learningData = { ...INITIAL_LEARNING_DATA };
        }
    }

    // 初期化時に学習データを読み込み
    static initialize() {
        this.loadLearningData();
    }

    static processRaceResult() {
        const currentPredictions = PredictionEngine.getCurrentPredictions();
        if (currentPredictions.length === 0) {
            alert('まず予測を実行してください。');
            return;
        }

        const actualFirst = document.getElementById('actualFirst').value.trim();
        const actualSecond = document.getElementById('actualSecond').value.trim();
        const actualThird = document.getElementById('actualThird').value.trim();

        if (!actualFirst) {
            alert('最低でも1着の馬名を入力してください。');
            return;
        }

        const findHorse = (input) => {
            if (!input) return null;
            
            // 馬番での検索（数字のみの場合）
            if (/^\d+$/.test(input.trim())) {
                const horseNumber = parseInt(input.trim());
                if (horseNumber >= 1 && horseNumber <= currentPredictions.length) {
                    return currentPredictions[horseNumber - 1]; // 馬番は1から始まるので-1
                }
                return null;
            }
            
            // 馬名での検索（従来通り）
            return currentPredictions.find(horse => 
                horse.name.includes(input) || input.includes(horse.name)
            );
        };

        const firstHorse = findHorse(actualFirst);
        const secondHorse = findHorse(actualSecond);
        const thirdHorse = findHorse(actualThird);

        if (!firstHorse) {
            const isNumber = /^\d+$/.test(actualFirst.trim());
            const errorMsg = isNumber 
                ? `1着の馬番「${actualFirst}」が見つかりません。馬番は1～${currentPredictions.length}の範囲で入力してください。`
                : `1着の馬「${actualFirst}」が見つかりません。馬名または馬番を確認してください。`;
            alert(errorMsg);
            return;
        }

        const learningResult = this.updateLearningData(firstHorse, secondHorse, thirdHorse);
        this.displayLearningFeedback(learningResult, firstHorse, secondHorse, thirdHorse);

        // 買い目推奨の結果も記録
        const actualResult = {
            winner: firstHorse.name,
            place: [firstHorse, secondHorse, thirdHorse].filter(h => h).map(h => h.name)
        };
        
        // 最後に生成された推奨があれば記録
        if (window.lastBettingRecommendations) {
            BettingRecommender.recordBettingRecommendation(window.lastBettingRecommendations, actualResult);
        }

        document.getElementById('actualFirst').value = '';
        document.getElementById('actualSecond').value = '';
        document.getElementById('actualThird').value = '';
    }

    static updateLearningData(firstHorse, secondHorse, thirdHorse) {
        const adj = this.learningData.adjustments;
        const learningRate = CONFIG.LEARNING_RATE;
        const result = {
            winCorrect: false,
            placeCorrect: false,
            adjustments: {}
        };

        const sortedPredictions = [...PredictionEngine.getCurrentPredictions()].sort((a, b) => b.winProbability - a.winProbability);
        const predictedWinner = sortedPredictions[0];
        const predictedTop3 = sortedPredictions.slice(0, 3);

        // 勝利予測の評価
        if (firstHorse.name === predictedWinner.name) {
            result.winCorrect = true;
            this.learningData.accuracy.winPredictions++;
            
            // 的中した場合も微調整（成功パターンを強化）
            if (predictedWinner.odds <= 5) {
                adj.oddsWeight = Math.min(1.5, adj.oddsWeight + learningRate * 0.5);
                result.adjustments.oddsWeight = 'オッズ信頼度を微強化';
            }
            if (predictedWinner.lastRaceAgari && firstHorse.lastRaceAgari) {
                const predAgari = parseFloat(predictedWinner.lastRaceAgari);
                const actualAgari = parseFloat(firstHorse.lastRaceAgari);
                if (!isNaN(predAgari) && !isNaN(actualAgari)) {
                    const agariDiff = actualAgari - predAgari;
                    if (agariDiff > 1.0) {
                        adj.lastRaceWeight = Math.max(0.3, adj.lastRaceWeight - learningRate);
                        result.adjustments.lastRaceWeight = '上がり3F過信を軽減';
                    } else if (agariDiff < -0.5) {
                        adj.lastRaceWeight = Math.min(1.7, adj.lastRaceWeight + learningRate);
                        result.adjustments.lastRaceWeight = '上がり3F重視度を向上';
                    }
                }
            }
            
            // 新しい特徴量の成功パターン強化
            if (predictedWinner.age <= 4) {
                adj.ageWeight = Math.min(1.5, (adj.ageWeight || 1.0) + learningRate * 0.3);
                result.adjustments.ageWeight = '年齢適性を微強化';
            }
            if (predictedWinner.weightChange === 1) {
                adj.weightChangeWeight = Math.min(1.5, (adj.weightChangeWeight || 1.0) + learningRate * 0.3);
                result.adjustments.weightChangeWeight = '馬体重変化適性を微強化';
            }
            if (predictedWinner.restDays <= 14) {
                adj.restDaysWeight = Math.min(1.5, (adj.restDaysWeight || 1.0) + learningRate * 0.3);
                result.adjustments.restDaysWeight = '休養日数適性を微強化';
            }
            
            // 脚質の成功パターン学習
            if (predictedWinner.runningStyle) {
                if (!this.learningData.runningStyleSuccess) {
                    this.learningData.runningStyleSuccess = {};
                }
                const style = predictedWinner.runningStyle;
                this.learningData.runningStyleSuccess[style] = (this.learningData.runningStyleSuccess[style] || 0) + 1;
                result.adjustments.runningStyle = `脚質「${style}」の成功例を記録`;
            }
            
            // レースレベルの成功パターン学習
            if (predictedWinner.currentRaceLevel || firstHorse.raceLevel) {
                if (!this.learningData.raceLevelSuccess) {
                    this.learningData.raceLevelSuccess = {};
                }
                const level = predictedWinner.currentRaceLevel || firstHorse.raceLevel;
                this.learningData.raceLevelSuccess[level] = (this.learningData.raceLevelSuccess[level] || 0) + 1;
                result.adjustments.raceLevel = `レースレベル「${level}」の成功例を記録`;
            }
        } else {
            // 外れた場合の詳細分析と調整
            
            // 1. オッズによる調整（閾値を大幅に緩和）
            const oddsRatio = firstHorse.odds / predictedWinner.odds;
            if (oddsRatio > 2.0) {
                // 実際の勝者が予測より2倍以上高オッズ
                adj.oddsWeight = Math.max(0.3, adj.oddsWeight - learningRate);
                result.adjustments.oddsWeight = 'オッズ過信を軽減';
            } else if (oddsRatio < 0.5) {
                // 実際の勝者が予測より2倍以上低オッズ
                adj.oddsWeight = Math.min(1.7, adj.oddsWeight + learningRate);
                result.adjustments.oddsWeight = 'オッズ信頼度を向上';
            }

            // 2. 前走着順による調整（より敏感に）
            const lastRaceDiff = firstHorse.lastRace - predictedWinner.lastRace;
            if (lastRaceDiff > 3) {
                // 実際の勝者が予測より3着以上悪い前走
                adj.lastRaceWeight = Math.max(0.3, adj.lastRaceWeight - learningRate);
                result.adjustments.lastRaceWeight = '前走過信を軽減';
            } else if (lastRaceDiff < -2) {
                // 実際の勝者が予測より2着以上良い前走
                adj.lastRaceWeight = Math.min(1.7, adj.lastRaceWeight + learningRate);
                result.adjustments.lastRaceWeight = '前走重視度を向上';
            }

            // 3. 騎手評価による調整（より細かく）
            const getJockeyRank = (jockey) => {
                if (CONFIG.TOP_JOCKEYS.some(j => jockey.includes(j.replace(/[・\.]/g, '')))) return 3;
                if (CONFIG.GOOD_JOCKEYS.some(j => jockey.includes(j.replace(/[・\.]/g, '')))) return 2;
                return 1;
            };
            
            const actualJockeyRank = getJockeyRank(firstHorse.jockey);
            const predictedJockeyRank = getJockeyRank(predictedWinner.jockey);
            
            if (actualJockeyRank < predictedJockeyRank) {
                // 実際の勝者の騎手ランクが予測より低い
                adj.jockeyWeight = Math.max(0.3, adj.jockeyWeight - learningRate);
                result.adjustments.jockeyWeight = '騎手過信を軽減';
            } else if (actualJockeyRank > predictedJockeyRank) {
                // 実際の勝者の騎手ランクが予測より高い
                adj.jockeyWeight = Math.min(1.7, adj.jockeyWeight + learningRate);
                result.adjustments.jockeyWeight = '騎手重視度を向上';
            }

            // 4. 新しい特徴量による調整
            // 年齢調整
            if (firstHorse.age < predictedWinner.age) {
                adj.ageWeight = Math.min(1.7, (adj.ageWeight || 1.0) + learningRate);
                result.adjustments.ageWeight = '年齢重視度を向上';
            } else if (firstHorse.age > predictedWinner.age) {
                adj.ageWeight = Math.max(0.3, (adj.ageWeight || 1.0) - learningRate);
                result.adjustments.ageWeight = '年齢過信を軽減';
            }

            // 馬体重変化調整
            if (firstHorse.weightChange > predictedWinner.weightChange) {
                adj.weightChangeWeight = Math.min(1.7, (adj.weightChangeWeight || 1.0) + learningRate);
                result.adjustments.weightChangeWeight = '馬体重変化重視度を向上';
            } else if (firstHorse.weightChange < predictedWinner.weightChange) {
                adj.weightChangeWeight = Math.max(0.3, (adj.weightChangeWeight || 1.0) - learningRate);
                result.adjustments.weightChangeWeight = '馬体重変化過信を軽減';
            }

            // 休養日数調整
            if (firstHorse.restDays < predictedWinner.restDays) {
                adj.restDaysWeight = Math.min(1.7, (adj.restDaysWeight || 1.0) + learningRate);
                result.adjustments.restDaysWeight = '休養日数重視度を向上';
            } else if (firstHorse.restDays > predictedWinner.restDays) {
                adj.restDaysWeight = Math.max(0.3, (adj.restDaysWeight || 1.0) - learningRate);
                result.adjustments.restDaysWeight = '休養日数過信を軽減';
            }
            
            // 脚質の失敗パターン学習
            if (predictedWinner.runningStyle && firstHorse.runningStyle) {
                if (!this.learningData.runningStyleFailure) {
                    this.learningData.runningStyleFailure = {};
                }
                const predictedStyle = predictedWinner.runningStyle;
                const actualStyle = firstHorse.runningStyle;
                
                this.learningData.runningStyleFailure[predictedStyle] = (this.learningData.runningStyleFailure[predictedStyle] || 0) + 1;
                if (predictedStyle !== actualStyle) {
                    result.adjustments.runningStyleMiss = `脚質「${predictedStyle}」予測失敗、実際は「${actualStyle}」`;
                } else {
                    result.adjustments.runningStyleSame = `同脚質「${predictedStyle}」での予測失敗を記録`;
                }
            }
            
            // レースレベルの失敗パターン学習
            if ((predictedWinner.currentRaceLevel || predictedWinner.raceLevel) && 
                (firstHorse.currentRaceLevel || firstHorse.raceLevel)) {
                if (!this.learningData.raceLevelFailure) {
                    this.learningData.raceLevelFailure = {};
                }
                const predictedLevel = predictedWinner.currentRaceLevel || predictedWinner.raceLevel;
                const actualLevel = firstHorse.currentRaceLevel || firstHorse.raceLevel;
                
                this.learningData.raceLevelFailure[predictedLevel] = (this.learningData.raceLevelFailure[predictedLevel] || 0) + 1;
                result.adjustments.raceLevelMiss = `レベル「${predictedLevel}」での予測失敗を記録`;
            }

            // 5. スコア差による追加調整
            const actualWinnerInPredictions = PredictionEngine.getCurrentPredictions().find(h => h.name === firstHorse.name);
            if (actualWinnerInPredictions) {
                const scoreDiff = predictedWinner.score - actualWinnerInPredictions.score;
                if (scoreDiff > 15) {
                    // スコア差が大きい場合は全体的に調整
                    adj.popularityBias = Math.max(-10, adj.popularityBias - learningRate * 10);
                    result.adjustments.popularityBias = '人気偏重を軽減';
                } else if (scoreDiff < -10) {
                    adj.popularityBias = Math.min(10, adj.popularityBias + learningRate * 10);
                    result.adjustments.popularityBias = '実力重視を強化';
                }
            }

            // 6. 連続外れペナルティ
            const recentResults = this.learningData.history.slice(-2);
            const recentMisses = recentResults.filter(r => !r.winCorrect).length;
            if (recentMisses >= 2) {
                // 2連続外れの場合は追加調整
                adj.oddsWeight *= 0.95;
                adj.lastRaceWeight *= 0.95;
                adj.jockeyWeight *= 0.95;
                // 新しい特徴量も調整
                if (adj.ageWeight) adj.ageWeight *= 0.95;
                if (adj.weightChangeWeight) adj.weightChangeWeight *= 0.95;
                if (adj.restDaysWeight) adj.restDaysWeight *= 0.95;
                result.adjustments.consecutiveMiss = '連続外れによる全体調整';
            }
        }

        // 複勝予測の評価（より柔軟に）
        const actualTop3 = [firstHorse, secondHorse, thirdHorse].filter(h => h);
        const correctPlacePredictions = predictedTop3.filter(predicted => 
            actualTop3.some(actual => actual && actual.name === predicted.name)
        ).length;

        if (correctPlacePredictions >= 1) {
            // 1頭でも的中すれば部分的成功
            result.placeCorrect = true;
            this.learningData.accuracy.placePredictions++;
            
            // 部分的成功でも微強化
            if (correctPlacePredictions >= 2) {
                adj.oddsWeight = Math.min(1.5, adj.oddsWeight + learningRate * 0.3);
                adj.lastRaceWeight = Math.min(1.5, adj.lastRaceWeight + learningRate * 0.3);
                if (adj.ageWeight) adj.ageWeight = Math.min(1.5, adj.ageWeight + learningRate * 0.2);
                if (adj.weightChangeWeight) adj.weightChangeWeight = Math.min(1.5, adj.weightChangeWeight + learningRate * 0.2);
            }
        } else {
            // 完全に外れた場合は強めの調整
            adj.oddsWeight = Math.max(0.3, adj.oddsWeight - learningRate * 1.5);
            adj.lastRaceWeight = Math.max(0.3, adj.lastRaceWeight - learningRate * 1.5);
            adj.jockeyWeight = Math.max(0.3, adj.jockeyWeight - learningRate * 1.5);
            if (adj.ageWeight) adj.ageWeight = Math.max(0.3, adj.ageWeight - learningRate * 1.5);
            if (adj.weightChangeWeight) adj.weightChangeWeight = Math.max(0.3, adj.weightChangeWeight - learningRate * 1.5);
            if (adj.restDaysWeight) adj.restDaysWeight = Math.max(0.3, adj.restDaysWeight - learningRate * 1.5);
            result.adjustments.placeComplete = '複勝完全外れによる強調整';
        }

        // 7. 適応的学習率（精度に応じて調整幅を変更）
        const currentAccuracy = this.learningData.accuracy.totalPredictions > 0 ? 
            this.learningData.accuracy.winPredictions / this.learningData.accuracy.totalPredictions : 0;
        
        if (currentAccuracy < 0.2) {
            // 精度が20%未満の場合は大胆に調整
            Object.keys(adj).forEach(key => {
                if (key !== 'popularityBias') {
                    const currentValue = adj[key];
                    const adjustment = (Math.random() - 0.5) * 0.1; // ランダム要素追加
                    adj[key] = Math.max(0.3, Math.min(1.7, currentValue + adjustment));
                }
            });
            result.adjustments.lowAccuracy = '低精度による探索的調整';
        }

        this.learningData.accuracy.totalPredictions++;

        this.learningData.history.push({
            date: new Date().toLocaleDateString(),
            predicted: predictedWinner.name,
            actual: firstHorse.name,
            winCorrect: result.winCorrect,
            placeCorrect: result.placeCorrect,
            adjustments: { ...result.adjustments },
            accuracy: currentAccuracy
        });

        // 履歴を制限
        if (this.learningData.history.length > CONFIG.MAX_HISTORY_SIZE) {
            this.learningData.history = this.learningData.history.slice(-CONFIG.MAX_HISTORY_SIZE);
        }

        // 学習データを保存
        this.saveLearningData();

        return result;
    }

    static displayLearningFeedback(result, firstHorse, secondHorse, thirdHorse) {
        const feedbackContainer = document.getElementById('learningFeedback');
        
        let html = '<div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 3px solid #4caf50;">';
        html += '<h4 style="color: #2e7d32; margin-bottom: 10px;">🧠 学習結果</h4>';
        
        // 予測結果と実際の結果を詳しく表示
        const currentPredictions = PredictionEngine.getCurrentPredictions();
        const sortedPredictions = [...currentPredictions].sort((a, b) => b.winProbability - a.winProbability);
        const predictedWinner = sortedPredictions[0];
        const predictedTop3 = sortedPredictions.slice(0, 3);
        
        html += '<div style="margin-bottom: 15px;">';
        html += `<strong>予測していた結果:</strong><br>`;
        html += `・1着予測: ${predictedWinner.name} (勝率${(predictedWinner.winProbability * 100).toFixed(1)}%, オッズ${predictedWinner.odds}倍)<br>`;
        html += `・複勝予測: `;
        predictedTop3.forEach((horse, index) => {
            html += `${index > 0 ? ', ' : ''}${horse.name}`;
        });
        html += '<br>';
        html += '</div>';

        html += '<div style="margin-bottom: 15px;">';
        html += `<strong>実際の結果:</strong><br>`;
        html += `・1着: ${firstHorse.name} (オッズ${firstHorse.odds}倍)`;
        if (secondHorse) html += `<br>・2着: ${secondHorse.name} (オッズ${secondHorse.odds}倍)`;
        if (thirdHorse) html += `<br>・3着: ${thirdHorse.name} (オッズ${thirdHorse.odds}倍)`;
        html += '</div>';

        // 具体的な学習内容を表示
        html += '<div style="margin-bottom: 15px;">';
        html += '<strong>学習した内容:</strong><br>';
        
        if (result.winCorrect) {
            html += `✅ <strong>単勝的中!</strong> 「${predictedWinner.name}」を1着と予測し的中<br>`;
            html += `・この馬の特徴（オッズ${predictedWinner.odds}倍、前走${predictedWinner.lastRace}着`;
            if (predictedWinner.runningStyle) html += `、脚質「${predictedWinner.runningStyle}」`;
            html += `）が成功パターンとして学習されました<br>`;
        } else {
            const actualWinnerPredictedPos = sortedPredictions.findIndex(h => h.name === firstHorse.name) + 1;
            html += `❌ <strong>単勝外れ</strong> 「${predictedWinner.name}」を1着予測 → 実際は「${firstHorse.name}」が1着<br>`;
            if (actualWinnerPredictedPos <= sortedPredictions.length) {
                html += `・実際の勝者「${firstHorse.name}」は${actualWinnerPredictedPos}番手予想でした<br>`;
            } else {
                html += `・実際の勝者「${firstHorse.name}」は予想圏外でした<br>`;
            }
            html += `・予測ミスの原因分析を行い、次回の予測精度向上に活用します<br>`;
        }
        
        // 複勝予測の詳細
        const actualTop3 = [firstHorse, secondHorse, thirdHorse].filter(h => h);
        const correctPlacePredictions = predictedTop3.filter(predicted => 
            actualTop3.some(actual => actual && actual.name === predicted.name)
        );
        
        if (correctPlacePredictions.length > 0) {
            html += `✅ <strong>複勝${correctPlacePredictions.length}頭的中!</strong> `;
            correctPlacePredictions.forEach((horse, index) => {
                const actualPos = actualTop3.findIndex(actual => actual.name === horse.name) + 1;
                html += `${index > 0 ? ', ' : ''}「${horse.name}」(${actualPos}着)`;
            });
            html += 'を3着内と予測し的中<br>';
        } else {
            html += `❌ <strong>複勝全外れ</strong> 予測した3頭すべてが3着圏外<br>`;
            html += `・予測: ${predictedTop3.map(h => h.name).join(', ')}<br>`;
            html += `・実際: ${actualTop3.map(h => h.name).join(', ')}<br>`;
        }
        html += '</div>';

        // 買い目推奨の結果詳細
        if (window.lastBettingRecommendations) {
            html += '<div style="margin-bottom: 15px; padding: 10px; background: #fff3cd; border-radius: 5px;">';
            html += '<strong>🎯 買い目推奨の結果:</strong><br>';
            
            const recommendations = window.lastBettingRecommendations;
            
            // 本命的中確認
            if (recommendations.honmei && recommendations.honmei.horse === firstHorse.name) {
                html += `✅ ◎本命「${recommendations.honmei.horse}」が的中! (単勝推奨)<br>`;
            } else if (recommendations.honmei) {
                html += `❌ ◎本命「${recommendations.honmei.horse}」は外れ (実際の1着: ${firstHorse.name})<br>`;
            }
            
            // 対抗的中確認
            if (recommendations.taikou && actualTop3.some(h => h.name === recommendations.taikou.horse)) {
                const pos = actualTop3.findIndex(h => h.name === recommendations.taikou.horse) + 1;
                html += `✅ ○対抗「${recommendations.taikou.horse}」が${pos}着で的中! (複勝推奨)<br>`;
            } else if (recommendations.taikou) {
                html += `❌ ○対抗「${recommendations.taikou.horse}」は3着圏外<br>`;
            }
            
            // 単穴的中確認
            if (recommendations.tanana && actualTop3.some(h => h.name === recommendations.tanana.horse)) {
                const pos = actualTop3.findIndex(h => h.name === recommendations.tanana.horse) + 1;
                html += `✅ ▲単穴「${recommendations.tanana.horse}」が${pos}着で的中! (複勝推奨)<br>`;
            } else if (recommendations.tanana) {
                html += `❌ ▲単穴「${recommendations.tanana.horse}」は3着圏外<br>`;
            }
            
            // ワイド推奨確認
            if (recommendations.wide && recommendations.wide.length > 0) {
                const wideHits = recommendations.wide.filter(w => 
                    actualTop3.some(h => h.name === w.horse1) && actualTop3.some(h => h.name === w.horse2)
                );
                if (wideHits.length > 0) {
                    html += `✅ ワイド${wideHits.length}点的中! `;
                    wideHits.forEach((w, index) => {
                        html += `${index > 0 ? ', ' : ''}「${w.horse1}-${w.horse2}」`;
                    });
                    html += '<br>';
                } else {
                    html += `❌ ワイド推奨すべて外れ<br>`;
                }
            }
            
            html += '</div>';
        }

        // AI分析結果の詳細
        if (window.lastAIRecommendation) {
            html += '<div style="margin-bottom: 15px; padding: 10px; background: #e3f2fd; border-radius: 5px;">';
            html += '<strong>🤖 AI分析の判断根拠と結果:</strong><br>';
            
            const aiRec = window.lastAIRecommendation;
            let aiMainPick = null; // スコープを拡張して変数を定義
            
            // AI推奨馬の結果確認
            if (aiRec.topPicks && aiRec.topPicks.length > 0) {
                aiMainPick = aiRec.topPicks[0];
                
                if (aiMainPick.horse === firstHorse.name) {
                    html += `✅ <strong>AI第1推奨が的中!</strong><br>`;
                    html += `・AIの推奨: 「${aiMainPick.horse}」（信頼度: ${aiMainPick.confidence}）<br>`;
                    html += `・推奨理由: ${aiMainPick.reason}<br>`;
                    html += `・AI判断が正確で、統計分析を超えた洞察が有効でした<br>`;
                } else {
                    html += `❌ <strong>AI第1推奨は外れ</strong><br>`;
                    html += `・AI推奨: 「${aiMainPick.horse}」→ 実際の勝者: 「${firstHorse.name}」<br>`;
                    html += `・推奨理由: ${aiMainPick.reason}<br>`;
                    
                    // 実際の勝者がAI推奨に含まれていたかチェック
                    const winnerInAIRecs = aiRec.topPicks.find(pick => pick.horse === firstHorse.name);
                    if (winnerInAIRecs) {
                        const winnerPos = aiRec.topPicks.findIndex(pick => pick.horse === firstHorse.name) + 1;
                        html += `・実際の勝者「${firstHorse.name}」はAI第${winnerPos}推奨でした<br>`;
                        html += `・AI分析理由: ${winnerInAIRecs.reason}<br>`;
                    } else {
                        html += `・実際の勝者「${firstHorse.name}」はAI推奨圏外でした<br>`;
                    }
                }
            }
            
            // AI分析の特徴的な洞察
            if (aiRec.analysis) {
                html += `<br><strong>AIの独自分析内容:</strong><br>`;
                const analysisPoints = aiRec.analysis.split('。').filter(s => s.trim().length > 10).slice(0, 3);
                analysisPoints.forEach(point => {
                    html += `・${point.trim()}。<br>`;
                });
            }
            
            // AI買い目戦略の結果（3パターン対応）
            if (aiRec.bettingStrategy && aiRec.bettingStrategy.length > 0) {
                html += `<br><strong>AI買い目戦略の結果（3パターン検証）:</strong><br>`;
                
                aiRec.bettingStrategy.forEach((pattern, patternIndex) => {
                    const patternName = pattern.patternName || `パターン${patternIndex + 1}`;
                    const patternIcons = ['🛡️', '⚖️', '🚀'];
                    const currentIcon = patternIcons[patternIndex] || '💡';
                    
                    html += `<br><strong>${currentIcon} ${patternName}（予算${pattern.totalBudget || '1000円'}）:</strong><br>`;
                    
                    if (pattern.bets && pattern.bets.length > 0) {
                        let patternHits = 0;
                        let totalBets = pattern.bets.length;
                        
                        pattern.bets.forEach(bet => {
                            let hitStatus = '❌';
                            let details = '';
                            
                            // 戦略タイプごとの的中判定
                            if (bet.type === '単勝' && bet.combination.includes(firstHorse.name)) {
                                hitStatus = '✅';
                                details = `予想配当${bet.expectedReturn} → 実際オッズ${firstHorse.odds}倍で的中`;
                                patternHits++;
                            } else if (bet.type === '複勝' && actualTop3.some(h => bet.combination.includes(h.name))) {
                                hitStatus = '✅';
                                const hitHorse = actualTop3.find(h => bet.combination.includes(h.name));
                                const hitPos = actualTop3.findIndex(h => h.name === hitHorse.name) + 1;
                                details = `「${hitHorse.name}」が${hitPos}着で的中`;
                                patternHits++;
                            } else if (bet.type === 'ワイド' || bet.type.includes('ワイド')) {
                                // ワイド的中判定（簡易版）
                                const wideHorses = bet.combination.split('-');
                                if (wideHorses.length >= 2) {
                                    const bothIn = wideHorses.every(horseName => 
                                        actualTop3.some(h => horseName.includes(h.name))
                                    );
                                    if (bothIn) {
                                        hitStatus = '✅';
                                        details = '組み合わせ両方が3着以内で的中';
                                        patternHits++;
                                    }
                                }
                            } else if (bet.type.includes('連複') || bet.type.includes('連単')) {
                                // 3連複・3連単等の的中判定
                                const horses = bet.combination.split('-');
                                if (horses.length >= 3) {
                                    const allIn = horses.every(horseName => 
                                        actualTop3.some(h => horseName.includes(h.name))
                                    );
                                    if (allIn) {
                                        hitStatus = '✅';
                                        details = '全ての馬が3着以内で的中';
                                        patternHits++;
                                    }
                                }
                            }
                            
                            html += `　${hitStatus} ${bet.type}: ${bet.combination} (${bet.amount}) ${details}<br>`;
                            if (bet.reason && bet.reason !== '理由未設定') {
                                html += `　　📝 選択理由: ${bet.reason}<br>`;
                            }
                        });
                        
                        // パターン全体の成績
                        const hitRate = ((patternHits / totalBets) * 100).toFixed(1);
                        html += `　📊 ${patternName}成績: ${patternHits}/${totalBets}的中 (${hitRate}%)`;
                        
                        if (pattern.expectedHitRate && pattern.expectedHitRate !== '未設定') {
                            html += ` / 予想的中率: ${pattern.expectedHitRate}`;
                        }
                        html += `<br>`;
                        
                    } else {
                        html += `　このパターンには買い目が設定されていませんでした<br>`;
                    }
                });
                
                // 全パターンの総合評価
                html += `<br><strong>🎯 3パターン戦略の総合評価:</strong><br>`;
                html += `AIが提案した${aiRec.bettingStrategy.length}つの異なるリスク戦略の有効性を検証しました<br>`;
            }
            
            // AIの信頼度評価
            if (aiRec.confidence) {
                const confidenceText = {
                    'high': '高',
                    'medium': '中',
                    'low': '低'
                }[aiRec.confidence] || aiRec.confidence;
                
                html += `<br><strong>AI判断の信頼度:</strong> ${confidenceText}<br>`;
                if (aiMainPick && aiMainPick.horse === firstHorse.name) {
                    html += `信頼度「${confidenceText}」の判断が的中し、AI分析の精度を確認できました<br>`;
                } else {
                    html += `信頼度「${confidenceText}」でしたが外れたため、AI分析手法の見直しが必要です<br>`;
                }
            }
            
            html += '</div>';
        }

        if (Object.keys(result.adjustments).length > 0) {
            html += '<div style="margin-bottom: 15px;">';
            html += '<strong>次回への改善点:</strong><br>';
            Object.entries(result.adjustments).forEach(([key, value]) => {
                html += `・${value}<br>`;
            });
            html += '</div>';
        } else {
            html += '<div style="margin-bottom: 15px; color: #666;">';
            html += '<strong>改善点:</strong> 予測が的中したため、現在の分析手法を維持します';
            html += '</div>';
        }

        const winAccuracy = this.learningData.accuracy.totalPredictions > 0 ? 
            (this.learningData.accuracy.winPredictions / this.learningData.accuracy.totalPredictions * 100).toFixed(1) : 0;
        const placeAccuracy = this.learningData.accuracy.totalPredictions > 0 ? 
            (this.learningData.accuracy.placePredictions / this.learningData.accuracy.totalPredictions * 100).toFixed(1) : 0;

        html += '<div style="margin-bottom: 10px;">';
        html += '<strong>累計精度:</strong><br>';
        html += `・勝利予測的中率: ${winAccuracy}% (${this.learningData.accuracy.winPredictions}/${this.learningData.accuracy.totalPredictions})<br>`;
        html += `・複勝予測的中率: ${placeAccuracy}% (${this.learningData.accuracy.placePredictions}/${this.learningData.accuracy.totalPredictions})`;
        html += '</div>';

        // 買い目推奨の成績も表示
        const bettingPerformance = BettingRecommender.analyzeBettingPerformance();
        if (bettingPerformance) {
            html += '<div style="margin-top: 15px; padding: 12px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">';
            html += '<strong>🎯 買い目推奨成績:</strong><br>';
            html += `・◎本命的中率: ${(bettingPerformance.honmeiHitRate * 100).toFixed(1)}%<br>`;
            html += `・○対抗的中率: ${(bettingPerformance.taikouHitRate * 100).toFixed(1)}%<br>`;
            html += `・▲単穴的中率: ${(bettingPerformance.tananaHitRate * 100).toFixed(1)}%<br>`;
            html += `・△連複的中率: ${(bettingPerformance.renpukuHitRate * 100).toFixed(1)}%<br>`;
            html += `<small>（最近${bettingPerformance.totalRaces}レース）</small>`;
            html += '</div>';
        }

        html += '</div>';
        feedbackContainer.innerHTML = html;
    }

    static showLearningStats() {
        if (this.learningData.accuracy.totalPredictions === 0) {
            alert('まだ学習データがありません。レース結果を入力してください。');
            return;
        }

        const adj = this.learningData.adjustments;
        const winAccuracy = (this.learningData.accuracy.winPredictions / this.learningData.accuracy.totalPredictions * 100).toFixed(1);
        const placeAccuracy = (this.learningData.accuracy.placePredictions / this.learningData.accuracy.totalPredictions * 100).toFixed(1);

        let html = '<div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin-top: 15px;">';
        html += '<h4 style="color: #333; margin-bottom: 15px;">📊 学習状況詳細</h4>';

        html += '<div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">';
        html += '<h5 style="color: #2196f3; margin-bottom: 10px;">🎯 予測精度</h5>';
        html += `<p>総レース数: ${this.learningData.accuracy.totalPredictions}回</p>`;
        html += `<p>勝利予測的中率: ${winAccuracy}% (${this.learningData.accuracy.winPredictions}回的中)</p>`;
        html += `<p>複勝予測的中率: ${placeAccuracy}% (${this.learningData.accuracy.placePredictions}回的中)</p>`;
        html += '</div>';

        html += '<div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">';
        html += '<h5 style="color: #ff9800; margin-bottom: 10px;">⚙️ 学習パラメータ</h5>';
        html += `<p>オッズ重み: ${adj.oddsWeight.toFixed(2)} (初期値: 1.0)</p>`;
        html += `<p>前走着順重み: ${adj.lastRaceWeight.toFixed(2)} (初期値: 1.0)</p>`;
        html += `<p>騎手評価重み: ${adj.jockeyWeight.toFixed(2)} (初期値: 1.0)</p>`;
        html += `<p>人気度バイアス: ${adj.popularityBias.toFixed(2)} (初期値: 0.0)</p>`;
        
        // 新規追加特徴量の重み表示
        if (adj.ageWeight) {
            html += `<p>年齢重み: ${adj.ageWeight.toFixed(2)} (初期値: 1.0)</p>`;
        }
        if (adj.weightChangeWeight) {
            html += `<p>馬体重変化重み: ${adj.weightChangeWeight.toFixed(2)} (初期値: 1.0)</p>`;
        }
        if (adj.restDaysWeight) {
            html += `<p>休養日数重み: ${adj.restDaysWeight.toFixed(2)} (初期値: 1.0)</p>`;
        }
        html += '</div>';

        // 脚質学習データの表示
        if (this.learningData.runningStyleSuccess || this.learningData.runningStyleFailure) {
            html += '<div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">';
            html += '<h5 style="color: #9c27b0; margin-bottom: 10px;">🏃 脚質学習データ</h5>';
            
            if (this.learningData.runningStyleSuccess) {
                html += '<p><strong>成功パターン:</strong></p>';
                Object.entries(this.learningData.runningStyleSuccess).forEach(([style, count]) => {
                    html += `<p>・${style}: ${count}回的中</p>`;
                });
            }
            
            if (this.learningData.runningStyleFailure) {
                html += '<p><strong>失敗パターン:</strong></p>';
                Object.entries(this.learningData.runningStyleFailure).forEach(([style, count]) => {
                    html += `<p>・${style}: ${count}回外れ</p>`;
                });
            }
            html += '</div>';
        }

        // レースレベル学習データの表示
        if (this.learningData.raceLevelSuccess || this.learningData.raceLevelFailure) {
            html += '<div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">';
            html += '<h5 style="color: #673ab7; margin-bottom: 10px;">🏆 レースレベル学習データ</h5>';
            
            if (this.learningData.raceLevelSuccess) {
                html += '<p><strong>成功パターン:</strong></p>';
                Object.entries(this.learningData.raceLevelSuccess).forEach(([level, count]) => {
                    html += `<p>・${level}: ${count}回的中</p>`;
                });
            }
            
            if (this.learningData.raceLevelFailure) {
                html += '<p><strong>失敗パターン:</strong></p>';
                Object.entries(this.learningData.raceLevelFailure).forEach(([level, count]) => {
                    html += `<p>・${level}: ${count}回外れ</p>`;
                });
            }
            html += '</div>';
        }

        // 買い目推奨成績を学習状況詳細にも追加
        const bettingPerformance = BettingRecommender.analyzeBettingPerformance();
        if (bettingPerformance) {
            html += '<div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">';
            html += '<h5 style="color: #4caf50; margin-bottom: 10px;">🎯 買い目推奨成績</h5>';
            html += `<p>◎本命的中率: ${(bettingPerformance.honmeiHitRate * 100).toFixed(1)}%</p>`;
            html += `<p>○対抗的中率: ${(bettingPerformance.taikouHitRate * 100).toFixed(1)}%</p>`;
            html += `<p>▲単穴的中率: ${(bettingPerformance.tananaHitRate * 100).toFixed(1)}%</p>`;
            html += `<p>△連複的中率: ${(bettingPerformance.renpukuHitRate * 100).toFixed(1)}%</p>`;
            html += `<p><small>（最近${bettingPerformance.totalRaces}レースの成績）</small></p>`;
            
            // 現在の調整済み閾値も表示
            const thresholds = bettingPerformance.currentThresholds;
            html += '<div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px;">';
            html += '<strong>現在の調整済み閾値:</strong><br>';
            html += `<small>`;
            html += `本命勝率: ${thresholds.winProbabilityMin}%以上<br>`;
            html += `対抗期待値: ${thresholds.expectedValueMin}以上<br>`;
            html += `単穴オッズ: ${thresholds.mediumOddsMin}-${thresholds.mediumOddsMax}倍<br>`;
            html += `連複率: ${thresholds.placeProbabilityMin}%以上`;
            html += `</small>`;
            html += '</div>';
            html += '</div>';
        } else {
            html += '<div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">';
            html += '<h5 style="color: #666; margin-bottom: 10px;">🎯 買い目推奨成績</h5>';
            html += '<p style="color: #666;">まだ買い目推奨の履歴がありません。<br>予測実行後にレース結果を入力すると記録されます。</p>';
            html += '</div>';
        }

        if (this.learningData.history.length > 0) {
            html += '<div style="background: white; padding: 15px; border-radius: 8px;">';
            html += '<h5 style="color: #4caf50; margin-bottom: 10px;">📝 最近の学習履歴（最新5件）</h5>';
            const recentHistory = this.learningData.history.slice(-5).reverse();
            recentHistory.forEach(record => {
                const resultIcon = record.winCorrect ? '✅' : '❌';
                html += `<div style="padding: 8px; border-bottom: 1px solid #eee;">`;
                html += `<strong>${record.date}</strong> ${resultIcon}<br>`;
                html += `予測: ${record.predicted} → 実際: ${record.actual}<br>`;
                if (Object.keys(record.adjustments).length > 0) {
                    html += `調整: ${Object.values(record.adjustments).join(', ')}`;
                } else {
                    html += '調整: なし';
                }
                html += '</div>';
            });
            html += '</div>';
        }

        html += '</div>';

        const feedbackContainer = document.getElementById('learningFeedback');
        feedbackContainer.innerHTML = html + feedbackContainer.innerHTML;
    }

    static resetLearningData() {
        if (confirm('学習データをリセットしますか？この操作は取り消せません。')) {
            this.learningData = { ...INITIAL_LEARNING_DATA };
            this.saveLearningData(); // リセット後も保存
            alert('学習データをリセットしました。');
            document.getElementById('learningFeedback').innerHTML = '';
        }
    }

    static getLearningData() {
        return this.learningData;
    }
}

// グローバル関数として公開
window.processRaceResult = LearningSystem.processRaceResult.bind(LearningSystem);
window.showLearningStats = LearningSystem.showLearningStats.bind(LearningSystem);
window.resetLearningData = LearningSystem.resetLearningData.bind(LearningSystem);
window.saveLearningData = LearningSystem.saveLearningData.bind(LearningSystem);
window.loadLearningData = LearningSystem.loadLearningData.bind(LearningSystem); 