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

        const findHorse = (inputName) => {
            if (!inputName) return null;
            return currentPredictions.find(horse => 
                horse.name.includes(inputName) || inputName.includes(horse.name)
            );
        };

        const firstHorse = findHorse(actualFirst);
        const secondHorse = findHorse(actualSecond);
        const thirdHorse = findHorse(actualThird);

        if (!firstHorse) {
            alert(`1着の馬「${actualFirst}」が見つかりません。馬名を確認してください。`);
            return;
        }

        const learningResult = this.updateLearningData(firstHorse, secondHorse, thirdHorse);
        this.displayLearningFeedback(learningResult, firstHorse, secondHorse, thirdHorse);

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
            if (predictedWinner.lastRace <= 3) {
                adj.lastRaceWeight = Math.min(1.5, adj.lastRaceWeight + learningRate * 0.5);
                result.adjustments.lastRaceWeight = '前走重視度を微強化';
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
        
        html += '<div style="margin-bottom: 15px;">';
        html += `<strong>実際の結果:</strong> `;
        html += `1着: ${firstHorse.name}`;
        if (secondHorse) html += `, 2着: ${secondHorse.name}`;
        if (thirdHorse) html += `, 3着: ${thirdHorse.name}`;
        html += '</div>';

        html += '<div style="margin-bottom: 15px;">';
        html += '<strong>予測評価:</strong><br>';
        html += `・勝利予測: ${result.winCorrect ? '✅ 的中' : '❌ 外れ'}<br>`;
        html += `・複勝予測: ${result.placeCorrect ? '✅ 的中' : '❌ 外れ'}`;
        html += '</div>';

        if (Object.keys(result.adjustments).length > 0) {
            html += '<div style="margin-bottom: 15px;">';
            html += '<strong>学習調整:</strong><br>';
            Object.entries(result.adjustments).forEach(([key, value]) => {
                html += `・${value}<br>`;
            });
            html += '</div>';
        } else {
            html += '<div style="margin-bottom: 15px; color: #666;">';
            html += '<strong>学習調整:</strong> 今回は調整なし（予測が的中または軽微な誤差）';
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
        html += '</div>';

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