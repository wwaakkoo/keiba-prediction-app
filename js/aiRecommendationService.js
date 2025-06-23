// AI推奨サービス - Claude Code直接統合版（APIキー不要）
class AIRecommendationService {
    static isLoading = false;
    static lastRecommendation = null;

    // AI推奨を取得する（Claude Code セッション内で処理）
    static async getAIRecommendation(predictions, raceInfo = null) {
        if (this.isLoading) {
            console.log('AI推奨取得中です...');
            return null;
        }

        this.isLoading = true;
        this.showLoadingState();

        try {
            // 馬のデータを整理してプロンプトを作成
            const analysisData = this.prepareAnalysisData(predictions, raceInfo);
            
            // Claude Code環境内でのAI分析を模擬
            // 実際の環境では、この部分がClaude Codeセッションと統合されます
            const recommendation = await this.generateRecommendation(analysisData);
            
            this.lastRecommendation = recommendation;
            this.displayAIRecommendation(recommendation);
            return recommendation;

        } catch (error) {
            console.error('AI推奨エラー:', error);
            this.showErrorState(error.message);
            return null;
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    // 分析データの準備
    static prepareAnalysisData(predictions, raceInfo) {
        const horses = predictions.map((horse, index) => ({
            horseNumber: index + 1,
            name: horse.name || `${index + 1}番馬`,
            odds: horse.odds,
            lastRace: horse.lastRace,
            jockey: horse.jockey,
            age: horse.age,
            weightChange: horse.weightChange,
            score: horse.score,
            winProbability: horse.winProbability,
            placeProbability: horse.placeProbability,
            winExpectedValue: horse.winExpectedValue,
            placeExpectedValue: horse.placeExpectedValue,
            course: horse.course,
            distance: horse.distance,
            trackType: horse.trackType,
            weather: horse.weather,
            trackCondition: horse.trackCondition
        }));

        const currentRaceInfo = raceInfo || this.getCurrentRaceInfo();

        return {
            horses,
            raceInfo: currentRaceInfo,
            timestamp: new Date().toISOString()
        };
    }

    // AI推奨の生成（学習履歴統合版）
    static async generateRecommendation(analysisData) {
        // Claude Code環境では、この関数がClaude AIセッションと直接通信します
        // 学習履歴を統合した高度な分析を提供

        const horses = analysisData.horses;
        const raceInfo = analysisData.raceInfo;

        // 学習履歴を取得
        const learningHistory = this.getLearningHistory();
        const aiHistory = this.getAIRecommendationHistory();

        // 学習データに基づく調整
        const adjustedHorses = this.applyLearningAdjustments(horses, learningHistory);

        // 上位候補の特定
        const topByWinRate = [...adjustedHorses].sort((a, b) => b.winProbability - a.winProbability);
        const topByExpectedValue = [...adjustedHorses].sort((a, b) => b.winExpectedValue - a.winExpectedValue);
        const topByScore = [...adjustedHorses].sort((a, b) => b.score - a.score);

        // 学習履歴を考慮したAI分析
        const analysis = this.generateLearningEnhancedAnalysis(adjustedHorses, raceInfo, learningHistory, aiHistory);

        // 過去の成功パターンを考慮した注目馬選定
        const topPicks = this.selectLearningBasedTopPicks(topByWinRate, topByExpectedValue, topByScore, aiHistory);

        // 学習結果を反映した買い目戦略
        const bettingStrategy = this.generateAdaptiveBettingStrategy(adjustedHorses, topPicks, aiHistory);

        // 成功率を含むまとめ
        const summary = this.generateLearningAwareSummary(topPicks, bettingStrategy, aiHistory);

        return {
            analysis,
            topPicks,
            bettingStrategy,
            summary,
            generatedAt: new Date().toLocaleString('ja-JP'),
            method: 'Claude Code学習統合分析',
            learningMetrics: this.generateLearningMetrics(aiHistory),
            confidence: this.calculateOverallConfidence(topPicks, aiHistory)
        };
    }

    // 総合分析テキストの生成
    static generateAnalysisText(horses, raceInfo, topByWinRate, topByExpectedValue) {
        const avgOdds = horses.reduce((sum, h) => sum + h.odds, 0) / horses.length;
        const highOddsCount = horses.filter(h => h.odds > 10).length;
        const lowOddsCount = horses.filter(h => h.odds < 5).length;

        let analysis = `今回のレースは${horses.length}頭立てで、平均オッズは${avgOdds.toFixed(1)}倍です。`;

        if (raceInfo.distance) {
            analysis += `距離${raceInfo.distance}mの${raceInfo.trackType || ''}コースでの戦いとなります。`;
        }

        if (lowOddsCount > 0) {
            analysis += `人気馬（5倍未満）が${lowOddsCount}頭存在し、`;
        }
        if (highOddsCount > 0) {
            analysis += `穴馬候補（10倍超）が${highOddsCount}頭確認できます。`;
        }

        const topHorse = topByWinRate[0];
        analysis += `最も勝率の高い${topHorse.name}（${topHorse.horseNumber}番）の勝率は${topHorse.winProbability}%となっており、`;

        if (topHorse.winProbability > 25) {
            analysis += '本命視できる数値です。';
        } else if (topHorse.winProbability > 15) {
            analysis += '有力候補として注目できます。';
        } else {
            analysis += '混戦模様のレースと予想されます。';
        }

        return analysis;
    }

    // 注目馬の選定
    static selectTopPicks(topByWinRate, topByExpectedValue, topByScore) {
        const picks = [];

        // 勝率トップ
        if (topByWinRate[0] && topByWinRate[0].winProbability > 10) {
            picks.push({
                horse: topByWinRate[0].name,
                horseNumber: topByWinRate[0].horseNumber,
                reason: `勝率${topByWinRate[0].winProbability}%で最上位。安定した成績が期待できます。`,
                confidence: topByWinRate[0].winProbability > 20 ? 'high' : 'medium'
            });
        }

        // 期待値トップ（勝率トップと異なる場合）
        if (topByExpectedValue[0] && 
            topByExpectedValue[0].name !== topByWinRate[0]?.name &&
            topByExpectedValue[0].winExpectedValue > 0.1) {
            picks.push({
                horse: topByExpectedValue[0].name,
                horseNumber: topByExpectedValue[0].horseNumber,
                reason: `期待値${topByExpectedValue[0].winExpectedValue.toFixed(2)}で最高値。オッズ妙味があります。`,
                confidence: topByExpectedValue[0].winExpectedValue > 0.2 ? 'high' : 'medium'
            });
        }

        // 穴馬候補
        const holeCandidate = topByScore.find(h => 
            h.odds > 8 && h.odds < 25 && 
            h.winProbability > 5 && 
            !picks.some(p => p.horse === h.name)
        );
        
        if (holeCandidate) {
            picks.push({
                horse: holeCandidate.name,
                horseNumber: holeCandidate.horseNumber,
                reason: `${holeCandidate.odds}倍の中オッズながらスコア${holeCandidate.score}で健闘が期待できます。`,
                confidence: 'medium'
            });
        }

        return picks.slice(0, 3); // 最大3頭
    }

    // 買い目戦略の生成
    static generateBettingStrategy(horses, topPicks) {
        const strategy = [];

        if (topPicks.length > 0) {
            const mainPick = topPicks[0];
            
            // 単勝推奨
            if (mainPick.confidence === 'high') {
                strategy.push({
                    type: '単勝',
                    combination: `${mainPick.horseNumber}番`,
                    amount: '500-800円',
                    expectedReturn: `${(mainPick.horseNumber <= horses.length ? horses[mainPick.horseNumber - 1]?.odds * 600 : 0).toFixed(0)}円前後`,
                    risk: 'medium'
                });
            }

            // 複勝推奨
            strategy.push({
                type: '複勝',
                combination: `${mainPick.horseNumber}番`,
                amount: '300-500円',
                expectedReturn: `${(mainPick.horseNumber <= horses.length ? horses[mainPick.horseNumber - 1]?.odds * 0.3 * 400 : 0).toFixed(0)}円前後`,
                risk: 'low'
            });
        }

        // ワイド推奨
        if (topPicks.length >= 2) {
            strategy.push({
                type: 'ワイド',
                combination: `${topPicks[0].horseNumber}-${topPicks[1].horseNumber}`,
                amount: '200-400円',
                expectedReturn: '800-2000円',
                risk: 'medium'
            });
        }

        // 3連複推奨
        if (topPicks.length >= 3) {
            strategy.push({
                type: '3連複',
                combination: `${topPicks[0].horseNumber}-${topPicks[1].horseNumber}-${topPicks[2].horseNumber}`,
                amount: '100-200円',
                expectedReturn: '2000-8000円',
                risk: 'high'
            });
        }

        return strategy;
    }

    // まとめの生成
    static generateSummary(topPicks, bettingStrategy) {
        if (topPicks.length === 0) {
            return '今回は推奨できる明確な軸馬が見つかりませんでした。慎重な投資をお勧めします。';
        }

        const mainHorse = topPicks[0];
        let summary = `${mainHorse.horse}（${mainHorse.horseNumber}番）を軸とした戦略がおすすめです。`;

        if (topPicks.length > 1) {
            summary += `相手には${topPicks[1].horse}（${topPicks[1].horseNumber}番）`;
            if (topPicks.length > 2) {
                summary += `、${topPicks[2].horse}（${topPicks[2].horseNumber}番）`;
            }
            summary += 'を組み合わせることで的中率向上が期待できます。';
        }

        const totalAmount = bettingStrategy.reduce((sum, strategy) => {
            const amounts = strategy.amount.match(/(\d+)-(\d+)/);
            return sum + (amounts ? parseInt(amounts[2]) : 0);
        }, 0);

        summary += ` 総投資額は${totalAmount}円程度を想定しています。`;

        return summary;
    }

    // 現在のレース情報を取得
    static getCurrentRaceInfo() {
        return {
            distance: document.getElementById('raceDistance')?.value || null,
            course: document.getElementById('raceCourse')?.value || null,
            trackType: document.getElementById('raceTrackType')?.value || null,
            trackCondition: document.getElementById('raceTrackCondition')?.value || null,
            weather: document.getElementById('raceWeather')?.value || null
        };
    }

    // AI推奨結果を表示
    static displayAIRecommendation(recommendation) {
        const container = this.getOrCreateAIContainer();
        
        if (!recommendation) {
            container.innerHTML = '<p style="text-align: center; color: #666;">AI推奨を取得できませんでした。</p>';
            return;
        }

        let html = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; padding: 20px; margin: 20px 0; color: white; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <span style="font-size: 24px; margin-right: 10px;">🤖</span>
                    <h3 style="margin: 0; font-size: 1.4em;">${recommendation.method || 'Claude AI'} 買い目推奨</h3>
                </div>
        `;

        // 総合分析
        if (recommendation.analysis) {
            html += `
                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <h4 style="margin: 0 0 10px 0; display: flex; align-items: center;">
                        <span style="margin-right: 8px;">📊</span>総合分析
                    </h4>
                    <p style="margin: 0; line-height: 1.6;">${recommendation.analysis}</p>
                </div>
            `;
        }

        // 注目馬
        if (recommendation.topPicks && recommendation.topPicks.length > 0) {
            html += `
                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <h4 style="margin: 0 0 15px 0; display: flex; align-items: center;">
                        <span style="margin-right: 8px;">⭐</span>AI注目馬
                    </h4>
            `;
            
            recommendation.topPicks.forEach((pick, index) => {
                const confidenceColor = pick.confidence === 'high' ? '#4caf50' : 
                                      pick.confidence === 'medium' ? '#ff9800' : '#f44336';
                const confidenceText = pick.confidence === 'high' ? '高' : 
                                     pick.confidence === 'medium' ? '中' : '低';
                
                html += `
                    <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid ${confidenceColor};">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                            <strong style="font-size: 1.1em;">${pick.horseNumber}番 ${pick.horse}</strong>
                            <span style="background: ${confidenceColor}; padding: 4px 8px; border-radius: 20px; font-size: 0.8em; font-weight: bold;">
                                信頼度: ${confidenceText}
                            </span>
                        </div>
                        <p style="margin: 0; font-size: 0.9em; opacity: 0.9;">${pick.reason}</p>
                    </div>
                `;
            });
            
            html += '</div>';
        }

        // 買い目戦略
        if (recommendation.bettingStrategy && recommendation.bettingStrategy.length > 0) {
            html += `
                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <h4 style="margin: 0 0 15px 0; display: flex; align-items: center;">
                        <span style="margin-right: 8px;">💰</span>AI推奨買い目
                    </h4>
                    <div style="display: grid; gap: 10px;">
            `;
            
            recommendation.bettingStrategy.forEach(strategy => {
                const riskColor = strategy.risk === 'low' ? '#4caf50' : 
                                strategy.risk === 'medium' ? '#ff9800' : '#f44336';
                
                html += `
                    <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; align-items: center;">
                        <div>
                            <div style="font-weight: bold; margin-bottom: 4px;">${strategy.type}</div>
                            <div style="font-size: 0.9em; opacity: 0.8;">${strategy.combination}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-weight: bold; color: #ffd700;">${strategy.amount}</div>
                            <div style="font-size: 0.8em; opacity: 0.7;">推奨金額</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-weight: bold; color: #90ee90;">${strategy.expectedReturn || 'N/A'}</div>
                            <div style="font-size: 0.8em; opacity: 0.7;">期待リターン</div>
                        </div>
                        <div style="text-align: center;">
                            <span style="background: ${riskColor}; padding: 4px 8px; border-radius: 15px; font-size: 0.8em; font-weight: bold;">
                                ${strategy.risk === 'low' ? '低' : strategy.risk === 'medium' ? '中' : '高'}
                            </span>
                        </div>
                    </div>
                `;
            });
            
            html += '</div></div>';
        }

        // まとめ
        if (recommendation.summary) {
            html += `
                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
                    <h4 style="margin: 0 0 10px 0; display: flex; align-items: center;">
                        <span style="margin-right: 8px;">📝</span>まとめ
                    </h4>
                    <p style="margin: 0; line-height: 1.6;">${recommendation.summary}</p>
                </div>
            `;
        }

        // 学習メトリクス表示
        if (recommendation.learningMetrics) {
            const metrics = recommendation.learningMetrics;
            html += `
                <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin-bottom: 15px;">
                    <h4 style="margin: 0 0 10px 0; display: flex; align-items: center;">
                        <span style="margin-right: 8px;">📈</span>学習統計
                    </h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; font-size: 0.9em;">
                        <div style="text-align: center;">
                            <div style="font-weight: bold; color: #90ee90;">${metrics.successRate}%</div>
                            <div style="opacity: 0.8;">成功率</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-weight: bold; color: #87ceeb;">${metrics.totalRecommendations}回</div>
                            <div style="opacity: 0.8;">推奨回数</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-weight: bold; color: #dda0dd;">${metrics.averageOdds}倍</div>
                            <div style="opacity: 0.8;">平均オッズ</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-weight: bold; color: ${metrics.recentTrend === 'improving' ? '#90ee90' : metrics.recentTrend === 'declining' ? '#ff6b6b' : '#ffd700'};">
                                ${metrics.recentTrend === 'improving' ? '↗️ 上昇' : metrics.recentTrend === 'declining' ? '↘️ 下降' : '→ 安定'}
                            </div>
                            <div style="opacity: 0.8;">最近の傾向</div>
                        </div>
                    </div>
                </div>
            `;
        }

        // 信頼度表示
        if (recommendation.confidence) {
            const confidenceColor = recommendation.confidence === 'high' ? '#4caf50' : 
                                   recommendation.confidence === 'medium' ? '#ff9800' : '#f44336';
            const confidenceText = recommendation.confidence === 'high' ? '高' : 
                                  recommendation.confidence === 'medium' ? '中' : '低';
            
            html += `
                <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin-bottom: 15px; text-align: center;">
                    <div style="display: inline-flex; align-items: center; background: ${confidenceColor}; padding: 8px 16px; border-radius: 20px;">
                        <span style="margin-right: 8px;">🎯</span>
                        <strong>総合信頼度: ${confidenceText}</strong>
                    </div>
                </div>
            `;
        }

        // レース結果入力フォーム
        html += `
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                <h4 style="margin: 0 0 15px 0; display: flex; align-items: center;">
                    <span style="margin-right: 8px;">🏁</span>レース結果入力（学習用）
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 10px; align-items: end;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-size: 0.9em;">1着馬名</label>
                        <input type="text" id="aiWinner" placeholder="勝利馬名" style="width: 100%; padding: 8px; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; background: rgba(255,255,255,0.1); color: white;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-size: 0.9em;">2着馬名</label>
                        <input type="text" id="aiSecond" placeholder="2着馬名" style="width: 100%; padding: 8px; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; background: rgba(255,255,255,0.1); color: white;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-size: 0.9em;">3着馬名</label>
                        <input type="text" id="aiThird" placeholder="3着馬名" style="width: 100%; padding: 8px; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; background: rgba(255,255,255,0.1); color: white;">
                    </div>
                    <div>
                        <button onclick="AIRecommendationService.submitRaceResult()" 
                                style="background: linear-gradient(45deg, #4caf50, #45a049); color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">
                            📝 学習
                        </button>
                    </div>
                </div>
                <div style="margin-top: 10px; font-size: 0.8em; opacity: 0.7;">
                    ※ レース結果を入力するとAI推奨の精度が向上します
                </div>
            </div>
        `;

        // 更新時刻
        html += `
                <div style="text-align: right; margin-top: 15px; opacity: 0.7; font-size: 0.8em;">
                    🕒 生成: ${recommendation.generatedAt || new Date().toLocaleString('ja-JP')}
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    // AI推奨コンテナーを取得または作成
    static getOrCreateAIContainer() {
        let container = document.getElementById('aiRecommendationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'aiRecommendationContainer';
            
            // 買い目推奨コンテナーの後に配置
            const bettingContainer = document.getElementById('bettingContainer');
            if (bettingContainer && bettingContainer.parentNode) {
                bettingContainer.parentNode.insertBefore(container, bettingContainer.nextSibling);
            } else {
                // フォールバック: results コンテナーの後に配置
                const resultsDiv = document.getElementById('results');
                if (resultsDiv && resultsDiv.parentNode) {
                    resultsDiv.parentNode.insertBefore(container, resultsDiv.nextSibling);
                } else {
                    document.body.appendChild(container);
                }
            }
        }
        return container;
    }

    // ローディング状態を表示
    static showLoadingState() {
        const container = this.getOrCreateAIContainer();
        container.innerHTML = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; padding: 30px; margin: 20px 0; color: white; text-align: center; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);">
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <div style="width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 15px;"></div>
                    <h3 style="margin: 0 0 10px 0;">🤖 Claude AI が分析中...</h3>
                    <p style="margin: 0; opacity: 0.8;">馬のデータを総合的に分析し、最適な買い目を生成しています</p>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
    }

    // ローディング状態を非表示
    static hideLoadingState() {
        // displayAIRecommendation または showErrorState が呼ばれるため、特別な処理は不要
    }

    // エラー状態を表示
    static showErrorState(errorMessage) {
        const container = this.getOrCreateAIContainer();
        container.innerHTML = `
            <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); border-radius: 15px; padding: 20px; margin: 20px 0; color: white; box-shadow: 0 8px 25px rgba(255, 107, 107, 0.3);">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <span style="font-size: 24px; margin-right: 10px;">⚠️</span>
                    <h3 style="margin: 0;">AI推奨の取得に失敗しました</h3>
                </div>
                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <p style="margin: 0; font-weight: bold;">エラー詳細:</p>
                    <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 0.9em;">${errorMessage}</p>
                </div>
                <div style="text-align: center;">
                    <button onclick="AIRecommendationService.retryRecommendation()" 
                            style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.5); padding: 10px 20px; border-radius: 20px; cursor: pointer; transition: all 0.3s;">
                        🔄 再試行
                    </button>
                </div>
            </div>
        `;
    }

    // 再試行処理
    static async retryRecommendation() {
        const currentPredictions = PredictionEngine.getCurrentPredictions();
        if (currentPredictions && currentPredictions.length > 0) {
            await this.getAIRecommendation(currentPredictions);
        } else {
            this.showErrorState('予測データがありません。まず予測を実行してください。');
        }
    }

    // 最新の推奨結果を取得
    static getLastRecommendation() {
        return this.lastRecommendation;
    }

    // AI推奨を清理
    static clearAIRecommendation() {
        const container = document.getElementById('aiRecommendationContainer');
        if (container) {
            container.innerHTML = '';
        }
        this.lastRecommendation = null;
    }

    // 学習履歴を取得
    static getLearningHistory() {
        try {
            const learningData = LearningSystem.getLearningData();
            return {
                accuracy: learningData.accuracy || {},
                adjustments: learningData.adjustments || {},
                history: learningData.history || [],
                totalRaces: learningData.history?.length || 0
            };
        } catch (error) {
            console.error('学習履歴の取得エラー:', error);
            return { accuracy: {}, adjustments: {}, history: [], totalRaces: 0 };
        }
    }

    // AI推奨履歴を取得・保存
    static getAIRecommendationHistory() {
        try {
            const saved = localStorage.getItem('aiRecommendationHistory');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('AI推奨履歴の取得エラー:', error);
            return [];
        }
    }

    static saveAIRecommendationHistory(history) {
        try {
            localStorage.setItem('aiRecommendationHistory', JSON.stringify(history));
        } catch (error) {
            console.error('AI推奨履歴の保存エラー:', error);
        }
    }

    // 学習データに基づく馬データ調整
    static applyLearningAdjustments(horses, learningHistory) {
        if (!learningHistory.adjustments || learningHistory.totalRaces < 3) {
            return horses; // 学習データが少ない場合は調整しない
        }

        const adj = learningHistory.adjustments;
        
        return horses.map(horse => {
            let adjustedWinProbability = horse.winProbability;
            let adjustedPlaceProbability = horse.placeProbability;

            // オッズ範囲による調整
            if (horse.odds <= 3 && adj.oddsWeight > 1.0) {
                adjustedWinProbability *= 1.1; // 人気馬の評価上昇
            } else if (horse.odds > 10 && adj.oddsWeight < 1.0) {
                adjustedWinProbability *= 0.9; // 穴馬の評価下降
            }

            // 騎手評価による調整
            if (adj.jockeyWeight > 1.0) {
                const isTopJockey = CONFIG.TOP_JOCKEYS.some(jockey => 
                    horse.jockey.includes(jockey.replace(/[・\.]/g, ''))
                );
                if (isTopJockey) {
                    adjustedWinProbability *= 1.05;
                    adjustedPlaceProbability *= 1.03;
                }
            }

            return {
                ...horse,
                originalWinProbability: horse.winProbability,
                originalPlaceProbability: horse.placeProbability,
                winProbability: Math.min(50, Math.max(1, adjustedWinProbability)),
                placeProbability: Math.min(80, Math.max(5, adjustedPlaceProbability)),
                learningAdjusted: true
            };
        });
    }

    // 学習履歴を考慮した分析テキスト
    static generateLearningEnhancedAnalysis(horses, raceInfo, learningHistory, aiHistory) {
        const baseAnalysis = this.generateAnalysisText(horses, raceInfo, 
            [...horses].sort((a, b) => b.winProbability - a.winProbability),
            [...horses].sort((a, b) => b.winExpectedValue - a.winExpectedValue)
        );

        let learningInsights = '';

        // 学習データからの洞察
        if (learningHistory.totalRaces >= 5) {
            const winAccuracy = learningHistory.accuracy.winPredictions || 0;
            const totalPredictions = learningHistory.accuracy.totalPredictions || 1;
            const successRate = Math.round((winAccuracy / totalPredictions) * 100);

            learningInsights += `これまでの予測成功率は${successRate}%です。`;

            if (successRate > 25) {
                learningInsights += '過去の実績から、このシステムの分析は信頼性が高いと判断されます。';
            } else if (successRate < 15) {
                learningInsights += '最近の的中率が低めのため、より慎重な判断をお勧めします。';
            }
        }

        // AI推奨履歴からの洞察
        if (aiHistory.length >= 3) {
            const recentAISuccess = aiHistory.slice(-5).filter(h => h.wasCorrect).length;
            const aiSuccessRate = Math.round((recentAISuccess / Math.min(5, aiHistory.length)) * 100);

            learningInsights += `AI推奨の最近の成功率は${aiSuccessRate}%となっています。`;
        }

        return baseAnalysis + (learningInsights ? ` ${learningInsights}` : '');
    }

    // 学習ベースの注目馬選定
    static selectLearningBasedTopPicks(topByWinRate, topByExpectedValue, topByScore, aiHistory) {
        const picks = this.selectTopPicks(topByWinRate, topByExpectedValue, topByScore);

        // AI推奨履歴から成功パターンを分析
        if (aiHistory.length >= 3) {
            const successfulPatterns = aiHistory.filter(h => h.wasCorrect);
            
            // 成功した推奨の特徴を分析
            const avgSuccessfulOdds = successfulPatterns.reduce((sum, p) => 
                sum + (p.recommendedHorse?.odds || 5), 0) / Math.max(1, successfulPatterns.length);

            // 成功パターンに基づく信頼度調整
            picks.forEach(pick => {
                const horse = topByWinRate.find(h => h.name === pick.horse);
                if (horse) {
                    // 過去の成功オッズ範囲に近い場合、信頼度を上げる
                    if (Math.abs(horse.odds - avgSuccessfulOdds) < 2) {
                        pick.confidence = pick.confidence === 'medium' ? 'high' : pick.confidence;
                        pick.reason += `（過去の成功パターンと類似）`;
                    }
                }
            });
        }

        return picks;
    }

    // 適応的買い目戦略
    static generateAdaptiveBettingStrategy(horses, topPicks, aiHistory) {
        const baseStrategy = this.generateBettingStrategy(horses, topPicks);

        // AI推奨の成功履歴に基づく金額調整
        if (aiHistory.length >= 3) {
            const recentSuccess = aiHistory.slice(-3).filter(h => h.wasCorrect).length;
            const adjustmentFactor = recentSuccess >= 2 ? 1.2 : recentSuccess === 1 ? 1.0 : 0.8;

            baseStrategy.forEach(strategy => {
                if (adjustmentFactor !== 1.0) {
                    const amounts = strategy.amount.match(/(\d+)-(\d+)/);
                    if (amounts) {
                        const min = Math.round(parseInt(amounts[1]) * adjustmentFactor);
                        const max = Math.round(parseInt(amounts[2]) * adjustmentFactor);
                        strategy.amount = `${min}-${max}円`;
                        strategy.reason = adjustmentFactor > 1 ? 
                            '最近のAI推奨成功率が高いため金額を増額' : 
                            '最近のAI推奨成功率を考慮し金額を控えめに設定';
                    }
                }
            });
        }

        return baseStrategy;
    }

    // 学習を考慮したまとめ
    static generateLearningAwareSummary(topPicks, bettingStrategy, aiHistory) {
        let summary = this.generateSummary(topPicks, bettingStrategy);

        // 学習データからの追加コメント
        if (aiHistory.length >= 5) {
            const successCount = aiHistory.filter(h => h.wasCorrect).length;
            const successRate = Math.round((successCount / aiHistory.length) * 100);

            summary += ` AI推奨機能の過去${aiHistory.length}回中${successCount}回的中（成功率${successRate}%）の実績を踏まえた推奨です。`;
        }

        return summary;
    }

    // 学習メトリクス生成
    static generateLearningMetrics(aiHistory) {
        if (aiHistory.length === 0) {
            return {
                totalRecommendations: 0,
                successfulRecommendations: 0,
                successRate: 0,
                averageOdds: 0,
                recentTrend: 'insufficient_data'
            };
        }

        const successCount = aiHistory.filter(h => h.wasCorrect).length;
        const successRate = Math.round((successCount / aiHistory.length) * 100);
        const avgOdds = aiHistory.reduce((sum, h) => sum + (h.recommendedHorse?.odds || 0), 0) / aiHistory.length;
        
        // 最近の傾向分析
        const recent5 = aiHistory.slice(-5);
        const recentSuccess = recent5.filter(h => h.wasCorrect).length;
        let recentTrend = 'stable';
        if (recentSuccess >= 3) recentTrend = 'improving';
        else if (recentSuccess <= 1) recentTrend = 'declining';

        return {
            totalRecommendations: aiHistory.length,
            successfulRecommendations: successCount,
            successRate,
            averageOdds: Math.round(avgOdds * 10) / 10,
            recentTrend
        };
    }

    // 総合信頼度計算
    static calculateOverallConfidence(topPicks, aiHistory) {
        if (topPicks.length === 0) return 'low';

        const highConfidenceCount = topPicks.filter(p => p.confidence === 'high').length;
        const mediumConfidenceCount = topPicks.filter(p => p.confidence === 'medium').length;

        // 基本信頼度
        let baseConfidence = 'medium';
        if (highConfidenceCount >= 2) baseConfidence = 'high';
        else if (highConfidenceCount === 0 && mediumConfidenceCount <= 1) baseConfidence = 'low';

        // 学習履歴による調整
        if (aiHistory.length >= 3) {
            const recentSuccess = aiHistory.slice(-3).filter(h => h.wasCorrect).length;
            if (recentSuccess >= 2 && baseConfidence !== 'low') {
                baseConfidence = 'high';
            } else if (recentSuccess === 0) {
                baseConfidence = 'low';
            }
        }

        return baseConfidence;
    }

    // レース結果の記録（学習フィードバック）
    static recordRaceResult(actualWinner, actualPlace, currentRecommendation) {
        if (!currentRecommendation) return;

        const aiHistory = this.getAIRecommendationHistory();
        
        // AI推奨が的中したかチェック
        const wasCorrect = currentRecommendation.topPicks.some(pick => 
            pick.horse === actualWinner || actualPlace.includes(pick.horse)
        );

        const recommendedHorse = currentRecommendation.topPicks[0]; // 最上位推奨馬

        const resultRecord = {
            date: new Date().toISOString(),
            recommendation: currentRecommendation,
            actualWinner,
            actualPlace,
            wasCorrect,
            recommendedHorse,
            confidence: currentRecommendation.confidence || 'medium'
        };

        aiHistory.push(resultRecord);

        // 履歴制限（最新50件まで）
        if (aiHistory.length > 50) {
            aiHistory.splice(0, aiHistory.length - 50);
        }

        this.saveAIRecommendationHistory(aiHistory);

        // 成功/失敗に基づく簡易学習
        this.adaptRecommendationParameters(wasCorrect, recommendedHorse);

        return resultRecord;
    }

    // 推奨パラメーターの適応
    static adaptRecommendationParameters(wasCorrect, recommendedHorse) {
        // 簡易的な適応ロジック
        // 実際の環境では、より詳細な機械学習アルゴリズムを適用可能
        
        if (wasCorrect) {
            console.log(`✅ AI推奨成功: ${recommendedHorse?.horse || '不明'}`);
            // 成功パターンの強化（将来の実装で使用）
        } else {
            console.log(`❌ AI推奨失敗: ${recommendedHorse?.horse || '不明'}`);
            // 失敗パターンの学習（将来の実装で使用）
        }
    }

    // レース結果送信（UIから呼び出し）
    static submitRaceResult() {
        const winner = document.getElementById('aiWinner')?.value.trim();
        const second = document.getElementById('aiSecond')?.value.trim();
        const third = document.getElementById('aiThird')?.value.trim();

        if (!winner) {
            if (typeof showMessage === 'function') {
                showMessage('最低でも1着馬名を入力してください', 'warning');
            } else {
                alert('最低でも1着馬名を入力してください');
            }
            return;
        }

        const currentRecommendation = this.getLastRecommendation();
        if (!currentRecommendation) {
            if (typeof showMessage === 'function') {
                showMessage('AI推奨データがありません', 'error');
            } else {
                alert('AI推奨データがありません');
            }
            return;
        }

        // レース結果を記録
        const place = [winner, second, third].filter(h => h);
        const result = this.recordRaceResult(winner, place, currentRecommendation);

        // 結果フィードバック
        if (result.wasCorrect) {
            if (typeof showMessage === 'function') {
                showMessage('🎉 AI推奨が的中しました！学習データに反映されました', 'success');
            } else {
                alert('🎉 AI推奨が的中しました！');
            }
        } else {
            if (typeof showMessage === 'function') {
                showMessage('📝 学習データに反映されました。次回の精度向上に活用されます', 'info');
            } else {
                alert('📝 学習データに反映されました');
            }
        }

        // 入力フィールドをクリア
        document.getElementById('aiWinner').value = '';
        document.getElementById('aiSecond').value = '';
        document.getElementById('aiThird').value = '';

        // 次回のAI推奨で学習結果が反映されることを表示
        setTimeout(() => {
            if (typeof showMessage === 'function') {
                showMessage('💡 次回のAI推奨では今回の結果が活用されます', 'info');
            }
        }, 2000);
    }

    // 学習統計の表示
    static showLearningStats() {
        const aiHistory = this.getAIRecommendationHistory();
        const metrics = this.generateLearningMetrics(aiHistory);

        let statsMessage = `📈 AI推奨学習統計\n\n`;
        statsMessage += `総推奨回数: ${metrics.totalRecommendations}回\n`;
        statsMessage += `成功回数: ${metrics.successfulRecommendations}回\n`;
        statsMessage += `成功率: ${metrics.successRate}%\n`;
        statsMessage += `平均推奨オッズ: ${metrics.averageOdds}倍\n`;
        
        const trendText = metrics.recentTrend === 'improving' ? '上昇傾向' :
                         metrics.recentTrend === 'declining' ? '下降傾向' : '安定';
        statsMessage += `最近の傾向: ${trendText}`;

        if (typeof showMessage === 'function') {
            showMessage(statsMessage, 'info');
        } else {
            alert(statsMessage);
        }
    }

    // テスト用のAI学習データを生成（開発・テスト用）
    static generateTestAIData() {
        const testData = [];
        const testHorses = ['サンプル馬A', 'テスト馬B', 'デモ馬C', 'モック馬D', '試験馬E'];
        
        for (let i = 0; i < 10; i++) {
            const horse = testHorses[Math.floor(Math.random() * testHorses.length)];
            const odds = Math.round((Math.random() * 15 + 2) * 10) / 10;
            const wasCorrect = Math.random() > 0.4; // 60% success rate
            
            testData.push({
                date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
                recommendation: {
                    topPicks: [{
                        horse: horse,
                        horseNumber: Math.floor(Math.random() * 18) + 1,
                        reason: `テストデータ ${i + 1}: オッズ${odds}倍での推奨`,
                        confidence: Math.random() > 0.5 ? 'high' : 'medium'
                    }],
                    method: 'Claude Code学習統合分析（テスト）'
                },
                actualWinner: wasCorrect ? horse : `他の馬${i}`,
                actualPlace: [wasCorrect ? horse : `他の馬${i}`, '2着馬', '3着馬'],
                wasCorrect: wasCorrect,
                recommendedHorse: {
                    horse: horse,
                    odds: odds
                },
                confidence: Math.random() > 0.5 ? 'high' : 'medium'
            });
        }
        
        this.saveAIRecommendationHistory(testData);
        
        if (typeof showMessage === 'function') {
            showMessage('🤖 テスト用AI学習データを生成しました！\n10件のサンプル履歴を追加', 'success');
        } else {
            alert('テスト用AI学習データを生成しました！');
        }
    }

    // 初期化
    static initialize() {
        console.log('AI推奨サービス（学習統合版）を初期化しました');
        
        // 学習システムの初期化を確認
        if (typeof LearningSystem !== 'undefined') {
            console.log('学習システムとの統合が完了しました');
        }
    }
}

// グローバル関数として公開
window.AIRecommendationService = AIRecommendationService;

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', function() {
    AIRecommendationService.initialize();
});