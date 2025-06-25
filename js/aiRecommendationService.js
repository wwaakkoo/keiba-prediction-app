// AI推奨サービス - Claude Code直接統合版（APIキー不要）
class AIRecommendationService {
    static isLoading = false;
    static lastRecommendation = null;

    // AI推奨を取得する（API/手動モード対応）
    static async getAIRecommendation(predictions, raceInfo = null) {
        if (this.isLoading) {
            console.log('AI推奨取得中です...');
            return null;
        }

        // AI推奨モードをチェック
        const manualMode = document.getElementById('manualMode');
        if (manualMode && manualMode.checked) {
            // 手動モードの場合、プロンプトを生成して表示
            showMessage('手動モードが選択されています。下のプロンプト生成ボタンを使用してください。', 'info');
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

    // 分析データの準備（生データ版）
    static prepareAnalysisData(predictions, raceInfo) {
        // 統計計算結果を排除し、生の入力データのみを使用
        const horses = predictions.map((horse, index) => ({
            horseNumber: index + 1,
            name: horse.name || `${index + 1}番馬`,
            odds: horse.odds,
            lastRace: horse.lastRace,
            jockey: horse.jockey,
            age: horse.age,
            weightChange: horse.weightChange,
            // 統計計算結果は除外（AI独自判断のため）
            // score, winProbability, placeProbability, winExpectedValue, placeExpectedValue は使用しない
            course: horse.course,
            distance: horse.distance,
            trackType: horse.trackType,
            weather: horse.weather,
            trackCondition: horse.trackCondition,
            // 過去2走データも含める
            raceHistory: {
                lastRace: {
                    order: horse.lastRaceOrder || horse.lastRace,
                    course: horse.lastRaceCourse,
                    distance: horse.lastRaceDistance,
                    trackType: horse.lastRaceTrackType,
                    agari: horse.lastRaceAgari,
                    date: horse.lastRaceDate,
                    popularity: horse.lastRacePopularity
                },
                secondLastRace: horse.secondLastRaceOrder ? {
                    order: horse.secondLastRaceOrder,
                    course: horse.secondLastRaceCourse,
                    distance: horse.secondLastRaceDistance,
                    trackType: horse.secondLastRaceTrackType,
                    agari: horse.secondLastRaceAgari,
                    date: horse.secondLastRaceDate,
                    popularity: horse.secondLastRacePopularity
                } : null
            }
        }));

        const currentRaceInfo = raceInfo || this.getCurrentRaceInfo();

        return {
            horses,
            raceInfo: currentRaceInfo,
            timestamp: new Date().toISOString()
        };
    }

    // AI推奨の生成（修正版 - ブラウザ対応）
    static async generateRecommendation(analysisData) {
        const horses = analysisData.horses;
        const raceInfo = analysisData.raceInfo;

        try {
            // 直接Claude AIを呼び出し（サーバー側でAPIキーチェック）
            const claudeRecommendation = await this.getClaudeAIRecommendation(horses, raceInfo);
            
            if (claudeRecommendation && claudeRecommendation.success) {
                // Claude AIからの推奨が成功した場合
                return {
                    analysis: claudeRecommendation.analysis,
                    topPicks: claudeRecommendation.topPicks,
                    bettingStrategy: claudeRecommendation.bettingStrategy,
                    summary: claudeRecommendation.summary,
                    generatedAt: new Date().toLocaleString('ja-JP'),
                    method: 'Claude AI SDK統合',
                    confidence: claudeRecommendation.confidence || 'medium',
                    sourceType: claudeRecommendation.sourceType || 'real_claude_ai'
                };
            } else {
                // Claude AI呼び出しが失敗した場合、フォールバック
                console.log('Claude AI呼び出し失敗、フォールバック実行');
                return await this.generateFallbackRecommendation(horses, raceInfo);
            }
        } catch (error) {
            console.error('Claude AI SDK呼び出しエラー:', error);
            // エラー時はフォールバック
            return await this.generateFallbackRecommendation(horses, raceInfo);
        }
    }
    
    // サーバーAPIを使用した実際のAI推奨取得（修正版）
    static async getClaudeAIRecommendation(horses, raceInfo) {
        try {
            // サーバーAPIを通じてClaude AIを呼び出し
            const apiResult = await this.callClaudeAPI(horses, raceInfo);
            
            if (apiResult && apiResult.success && apiResult.recommendation) {
                // サーバーから正常にレスポンスを受信
                return {
                    success: true,
                    analysis: apiResult.recommendation.analysis,
                    topPicks: apiResult.recommendation.topPicks || [],
                    bettingStrategy: apiResult.recommendation.bettingStrategy || [],
                    summary: apiResult.recommendation.summary,
                    confidence: apiResult.recommendation.confidence || 'medium',
                    sourceType: apiResult.sourceType || 'real_claude_ai',
                    generatedAt: apiResult.generatedAt
                };
            } else if (apiResult && apiResult.fallback) {
                // フォールバックが推奨される場合
                return { success: false, error: apiResult.error || 'APIキー未設定のためフォールバック使用' };
            }
            
            return { success: false, error: 'Claude AIからの回答が空でした' };
            
        } catch (error) {
            console.error('Claude AI API呼び出しエラー:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Claude AIに送信するプロンプトの作成（純粋データ版）
    static formatRaceDataForClaude(horses, raceInfo) {
        let prompt = `あなたは経験豊富な競馬予想の専門家です。以下の生データのみを参考に、統計的分析に頼らず、あなたの競馬知識と直感に基づいて買い目を推奨してください。

# レース情報
- 距離: ${raceInfo.distance || '不明'}m
- コース: ${raceInfo.course || '不明'}
- 馬場状態: ${raceInfo.trackCondition || '不明'}
- 天候: ${raceInfo.weather || '不明'}

# 出走馬データ（生データのみ）
`;

        horses.forEach((horse, index) => {
            prompt += `
${index + 1}番 ${horse.name || `${index + 1}番馬`}
- オッズ: ${horse.odds}倍
- 前走着順: ${horse.lastRace || '不明'}着
- 騎手: ${horse.jockey || '不明'}
- 年齢: ${horse.age || '不明'}歳
- 斤量変化: ${horse.weightChange || 0}kg
- コース: ${horse.course || '不明'}
- 距離: ${horse.distance || '不明'}m
- 馬場種別: ${horse.trackType || '不明'}
- 馬場状態: ${horse.trackCondition || '不明'}`;
        });

        prompt += `

# 求める回答形式
以下のJSON形式で回答してください：

{
  "analysis": "レース全体の分析（150文字以内）",
  "topPicks": [
    {
      "horse": "馬名",
      "horseNumber": 馬番,
      "reason": "推奨理由（50文字以内）",
      "confidence": "high/medium/low"
    }
  ],
  "bettingStrategy": [
    {
      "type": "券種",
      "combination": "買い目",
      "amount": "推奨金額",
      "risk": "high/medium/low",
      "reason": "理由"
    }
  ],
  "summary": "まとめ（100文字以内）",
  "confidence": "high/medium/low"
}

重要：
1. 統計計算や過去データ分析に頼らず、生データから直感的に判断してください
2. 馬の実績・条件・騎手・オッズのみを参考にしてください
3. あなた独自の競馬知識と経験で分析してください
4. 最大3頭まで推奨してください
5. 単勝・複勝・ワイドの買い目を提案してください
6. 日本語で回答してください`;

        return prompt;
    }
    
    // 純粋データでのAI推奨生成（学習データ非依存）
    static generatePureAIAnalysisData(horses, raceInfo) {
        // 統計計算結果を除外した純粋なデータを準備
        const pureHorses = horses.map((horse, index) => ({
            horseNumber: index + 1,
            name: horse.name,
            odds: horse.odds,
            lastRace: horse.lastRace,
            jockey: horse.jockey,
            age: horse.age,
            weightChange: horse.weightChange,
            course: horse.course,
            distance: horse.distance,
            trackType: horse.trackType,
            trackCondition: horse.trackCondition
        }));
        
        return {
            horses: pureHorses,
            raceInfo: raceInfo,
            note: 'AI分析は生データのみを使用（学習データ非依存）'
        };
    }
    
    // サーバーAPIを通じてClaude AIを呼び出し（修正版）
    static async callClaudeAPI(horses, raceInfo) {
        try {
            console.log('Claude AI API呼び出し開始...');
            
            const response = await fetch('/api/ai-recommendation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    horses: horses,
                    raceInfo: raceInfo 
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP エラー: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Claude AI API呼び出し完了:', result);
            
            return result;
            
        } catch (error) {
            console.error('Claude API呼び出しエラー:', error);
            throw error;
        }
    }
    
    // Claude AIの回答を解析
    static parseClaudeResponse(claudeText, horses) {
        try {
            // JSON部分を抽出（Claude AIが説明文付きで回答する場合があるため）
            const jsonMatch = claudeText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('JSON形式の回答が見つかりません');
            }
            
            const claudeData = JSON.parse(jsonMatch[0]);
            
            // 馬番が正しいかチェックして修正
            if (claudeData.topPicks) {
                claudeData.topPicks.forEach(pick => {
                    const horse = horses.find(h => h.name === pick.horse);
                    if (horse) {
                        pick.horseNumber = horses.indexOf(horse) + 1;
                    } else {
                        // 馬名が見つからない場合は、推奨された馬番をそのまま使用
                        pick.horseNumber = pick.horseNumber || 1;
                    }
                });
            }
            
            // bettingStrategyの形式を統一
            const processedBettingStrategy = (claudeData.bettingStrategy || []).map(strategy => ({
                type: strategy.type || '不明',
                combination: strategy.combination || strategy.target || 'N/A',
                amount: strategy.amount || '未設定',
                expectedReturn: strategy.expectedReturn || 'N/A',
                risk: strategy.risk || 'medium',
                reason: strategy.reason || '理由未設定'
            }));

            return {
                success: true,
                analysis: claudeData.analysis || '分析データがありません',
                topPicks: claudeData.topPicks || [],
                bettingStrategy: processedBettingStrategy,
                summary: claudeData.summary || 'まとめがありません',
                confidence: claudeData.confidence || 'medium'
            };
            
        } catch (error) {
            console.error('Claude回答解析エラー:', error);
            return {
                success: false,
                error: `回答解析失敗: ${error.message}`
            };
        }
    }
    
    // フォールバック：従来の模擬AI分析
    static async generateFallbackRecommendation(horses, raceInfo) {
        console.log('フォールバック：模擬AI分析を実行');
        
        // 従来のロジックを使用
        const aiInsights = this.performDirectAIAnalysis(horses, raceInfo);
        const aiTopPicks = this.selectAIBasedHorses(horses, raceInfo, aiInsights);
        const aiBettingStrategy = this.generateAIBettingStrategy(aiTopPicks, horses, raceInfo);
        const aiSummary = this.generateAISummary(aiTopPicks, aiBettingStrategy, aiInsights);

        return {
            analysis: aiInsights.analysis,
            topPicks: aiTopPicks,
            bettingStrategy: aiBettingStrategy,
            summary: aiSummary + '（模擬AI分析）',
            generatedAt: new Date().toLocaleString('ja-JP'),
            method: 'フォールバック模擬AI',
            aiInsights: aiInsights,
            confidence: this.calculateAIConfidence(aiTopPicks, aiInsights),
            sourceType: 'fallback_simulation'
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

    // ===== AI独自の直感的分析メソッド群 =====
    
    // 生データから直接AI分析を実行
    static performDirectAIAnalysis(horses, raceInfo) {
        const insights = {
            raceCharacter: this.analyzeRaceCharacter(horses, raceInfo),
            oddsPatterns: this.analyzeOddsPatterns(horses),
            jockeyFactors: this.analyzeJockeyFactors(horses),
            courseMatching: this.analyzeCourseMatching(horses, raceInfo),
            hiddenStrengths: this.findHiddenStrengths(horses),
            marketGaps: this.findMarketGaps(horses),
            racingFlow: this.predictRacingFlow(horses, raceInfo)
        };
        
        // AI総合分析テキスト生成
        insights.analysis = this.synthesizeAIAnalysis(insights, horses, raceInfo);
        
        return insights;
    }
    
    // レースの性格分析
    static analyzeRaceCharacter(horses, raceInfo) {
        const avgOdds = horses.reduce((sum, h) => sum + h.odds, 0) / horses.length;
        const oddsSpread = Math.max(...horses.map(h => h.odds)) - Math.min(...horses.map(h => h.odds));
        
        let character = '';
        if (avgOdds < 8 && oddsSpread < 15) {
            character = 'solidrace'; // 手堅いレース
        } else if (avgOdds > 12 || oddsSpread > 30) {
            character = 'chaotic'; // 混戦模様
        } else {
            character = 'standard'; // 標準的
        }
        
        return {
            type: character,
            avgOdds: avgOdds,
            competitiveness: oddsSpread > 20 ? 'high' : oddsSpread < 10 ? 'low' : 'medium'
        };
    }
    
    // オッズパターン分析
    static analyzeOddsPatterns(horses) {
        const patterns = {
            favoriteGap: 0,
            middleHorseValue: [],
            longShotCandidates: []
        };
        
        const sortedByOdds = [...horses].sort((a, b) => a.odds - b.odds);
        
        // 1番人気と2番人気の差
        if (sortedByOdds.length >= 2) {
            patterns.favoriteGap = sortedByOdds[1].odds - sortedByOdds[0].odds;
        }
        
        // 中間オッズ馬の妙味
        patterns.middleHorseValue = horses.filter(h => h.odds >= 6 && h.odds <= 15)
            .filter(h => h.lastRace <= 5) // 前走5着以内
            .map(h => ({ name: h.name, odds: h.odds, lastRace: h.lastRace, potential: 'medium' }));
        
        // 穴馬候補
        patterns.longShotCandidates = horses.filter(h => h.odds >= 15 && h.odds <= 50)
            .filter(h => h.lastRace <= 8) // 前走8着以内
            .map(h => ({ name: h.name, odds: h.odds, lastRace: h.lastRace, potential: 'high' }));
        
        return patterns;
    }
    
    // 騎手要因分析
    static analyzeJockeyFactors(horses) {
        const jockeyImpact = horses.map(horse => {
            const jockeyName = horse.jockey || '';
            let impact = 'neutral';
            let reason = '';
            
            // 有名騎手の判定（簡易版）
            if (jockeyName.includes('武豊') || jockeyName.includes('川田') || jockeyName.includes('戸崎')) {
                impact = 'positive';
                reason = 'トップジョッキー';
            } else if (jockeyName.includes('藤岡') || jockeyName.includes('松山') || jockeyName.includes('田辺')) {
                impact = 'positive';
                reason = '実力派騎手';
            } else if (horse.odds < 5 && jockeyName.includes('見習')) {
                impact = 'negative';
                reason = '人気馬に見習騎手';
            }
            
            return {
                horse: horse.name,
                jockey: jockeyName,
                impact: impact,
                reason: reason
            };
        });
        
        return jockeyImpact.filter(j => j.impact !== 'neutral');
    }
    
    // コース適性分析
    static analyzeCourseMatching(horses, raceInfo) {
        const distance = parseInt(raceInfo.distance) || 0;
        const trackType = raceInfo.trackType || '';
        
        return horses.map(horse => {
            let matching = 'unknown';
            let reason = '';
            
            // 距離適性の推測（簡易版）
            if (distance >= 2000) {
                // 長距離
                if (horse.lastRace <= 3 && horse.odds >= 8) {
                    matching = 'good';
                    reason = '長距離で前走好走、オッズに妙味';
                }
            } else if (distance <= 1400) {
                // 短距離
                if (horse.lastRace <= 2 && horse.odds <= 10) {
                    matching = 'good';
                    reason = '短距離で前走上位、手堅い評価';
                }
            }
            
            return {
                horse: horse.name,
                matching: matching,
                reason: reason
            };
        }).filter(c => c.matching === 'good');
    }
    
    // 隠れた強さ発見
    static findHiddenStrengths(horses) {
        const hidden = [];
        
        horses.forEach(horse => {
            const oddsLastRaceGap = horse.odds - (horse.lastRace * 2); // 簡易的な乖離計算
            
            // 前走良いのにオッズが高い
            if (horse.lastRace <= 3 && horse.odds >= 10) {
                hidden.push({
                    horse: horse.name,
                    type: 'undervalued',
                    reason: `前走${horse.lastRace}着なのに${horse.odds}倍の評価`
                });
            }
            
            // 騎手変更によるプラス要因
            if (horse.jockey && horse.odds >= 8 && horse.lastRace <= 5) {
                hidden.push({
                    horse: horse.name,
                    type: 'jockey_boost',
                    reason: `前走${horse.lastRace}着、騎手${horse.jockey}で巻き返し期待`
                });
            }
            
            // 斤量軽減
            if (horse.weightChange < -2) {
                hidden.push({
                    horse: horse.name,
                    type: 'weight_advantage',
                    reason: `斤量${Math.abs(horse.weightChange)}kg軽減でプラス材料`
                });
            }
        });
        
        return hidden;
    }
    
    // 市場との乖離発見
    static findMarketGaps(horses) {
        const gaps = [];
        const avgOdds = horses.reduce((sum, h) => sum + h.odds, 0) / horses.length;
        
        horses.forEach(horse => {
            // 前走実績と現在オッズの乖離
            const expectedOdds = horse.lastRace * 2.5; // 簡易的な期待オッズ
            const gap = horse.odds - expectedOdds;
            
            if (gap > 3) {
                gaps.push({
                    horse: horse.name,
                    type: 'overpriced',
                    gap: gap,
                    reason: `前走${horse.lastRace}着から${horse.odds}倍は過大評価か`
                });
            } else if (gap < -3) {
                gaps.push({
                    horse: horse.name,
                    type: 'underpriced',
                    gap: Math.abs(gap),
                    reason: `前走${horse.lastRace}着なら${horse.odds}倍は過小評価`
                });
            }
        });
        
        return gaps;
    }
    
    // レース展開予想
    static predictRacingFlow(horses, raceInfo) {
        const distance = parseInt(raceInfo.distance) || 1600;
        const trackCondition = raceInfo.trackCondition || '';
        
        let flow = 'standard';
        let reason = '';
        
        if (distance >= 2000) {
            flow = 'stayers_race';
            reason = '長距離でスタミナ勝負';
        } else if (distance <= 1200) {
            flow = 'speed_battle';
            reason = '短距離でスピード勝負';
        }
        
        if (trackCondition === '重' || trackCondition === '不良') {
            flow = 'power_needed';
            reason = '悪馬場でパワー・スタミナ重視';
        }
        
        return {
            type: flow,
            reason: reason,
            favoredHorses: this.identifyFlowFavoredHorses(horses, flow)
        };
    }
    
    // 展開に有利な馬の特定
    static identifyFlowFavoredHorses(horses, flowType) {
        const favored = [];
        
        horses.forEach(horse => {
            let advantages = [];
            
            if (flowType === 'stayers_race' && horse.lastRace <= 4) {
                advantages.push('長距離実績');
            }
            
            if (flowType === 'speed_battle' && horse.lastRace <= 2 && horse.odds <= 8) {
                advantages.push('スピード実績');
            }
            
            if (flowType === 'power_needed' && horse.weightChange <= 0) {
                advantages.push('パワータイプ');
            }
            
            if (advantages.length > 0) {
                favored.push({
                    horse: horse.name,
                    advantages: advantages
                });
            }
        });
        
        return favored;
    }
    
    // AI分析の統合（改善版 - 多様な分析文章）
    static synthesizeAIAnalysis(insights, horses, raceInfo) {
        let analysis = '';
        
        // レース性格の多様な表現
        const raceChar = insights.raceCharacter;
        const raceTypeVariations = {
            'solidrace': [
                '手堅いメンバー構成で、人気馬中心の組み立てが有効そうです。',
                '実力馬が揃っており、堅実な予想が求められるレースです。',
                '力関係が明確で、上位人気馬での決着が濃厚です。',
                '安定したメンバー構成で、手堅い選択が鍵となりそうです。'
            ],
            'chaotic': [
                '混戦模様で、穴馬の台頭も十分考えられるレースです。',
                '実力が拮抗しており、波乱の可能性も秘めています。',
                '予想が困難な混戦で、意外な結果もありそうです。',
                '接戦必至で、どの馬にもチャンスがありそうです。'
            ],
            'standard': [
                '標準的なレース構成となっています。',
                'バランスの取れたメンバー構成です。',
                '平均的な競争レベルのレースと判断されます。',
                '一般的な力関係での展開が予想されます。'
            ]
        };
        
        const raceTypeTexts = raceTypeVariations[raceChar.type] || raceTypeVariations['standard'];
        analysis += raceTypeTexts[Math.floor(Math.random() * raceTypeTexts.length)];
        
        // 隠れた強さの多様な表現
        if (insights.hiddenStrengths.length > 0) {
            const hidden = insights.hiddenStrengths[0];
            const hiddenVariations = [
                ` ${hidden.horse}は${hidden.reason}で注目に値します。`,
                ` ${hidden.horse}に関して${hidden.reason}という見逃せない要素があります。`,
                ` ${hidden.horse}について${hidden.reason}が光る存在です。`,
                ` ${hidden.horse}は${hidden.reason}という好材料を持っています。`
            ];
            analysis += hiddenVariations[Math.floor(Math.random() * hiddenVariations.length)];
        }
        
        // 市場乖離の多様な表現
        if (insights.marketGaps.length > 0) {
            const gap = insights.marketGaps.find(g => g.type === 'underpriced');
            if (gap) {
                const gapVariations = [
                    ` ${gap.horse}は市場評価より実力が上かもしれません。`,
                    ` ${gap.horse}のオッズには妙味を感じます。`,
                    ` ${gap.horse}は人気以上の力を秘めている可能性があります。`,
                    ` ${gap.horse}に関してはオッズと実力に乖離を感じます。`
                ];
                analysis += gapVariations[Math.floor(Math.random() * gapVariations.length)];
            }
        }
        
        // レース展開の多様な表現
        const flow = insights.racingFlow;
        if (flow.type !== 'standard') {
            const flowVariations = [
                ` ${flow.reason}になりそうで、`,
                ` ${flow.reason}が予想されるため、`,
                ` ${flow.reason}の展開となりそうで、`,
                ` ${flow.reason}の可能性が高く、`
            ];
            analysis += flowVariations[Math.floor(Math.random() * flowVariations.length)];
            
            if (flow.favoredHorses.length > 0) {
                const favoredVariations = [
                    `${flow.favoredHorses[0].horse}のような馬に有利かもしれません。`,
                    `${flow.favoredHorses[0].horse}などが恩恵を受けそうです。`,
                    `${flow.favoredHorses[0].horse}に追い風となる可能性があります。`,
                    `${flow.favoredHorses[0].horse}には絶好の条件と言えるでしょう。`
                ];
                analysis += favoredVariations[Math.floor(Math.random() * favoredVariations.length)];
            }
        }
        
        // 追加の多様性要素
        const additionalInsights = [];
        
        if (insights.jockeyFactors.length > 0) {
            const jockeyFactor = insights.jockeyFactors[0];
            additionalInsights.push(`騎手面では${jockeyFactor.reason}が注目されます。`);
        }
        
        if (insights.oddsPatterns.middleHorseValue.length > 0) {
            additionalInsights.push('中オッズ帯に面白い馬が潜んでいそうです。');
        }
        
        if (insights.oddsPatterns.longShotCandidates.length > 0) {
            additionalInsights.push('人気薄からの巻き返しにも期待が持てます。');
        }
        
        // ランダムに追加要素を1つ選択
        if (additionalInsights.length > 0) {
            analysis += ' ' + additionalInsights[Math.floor(Math.random() * additionalInsights.length)];
        }
        
        return analysis;
    }
    
    // AI独自の注目馬選定（改善版）
    static selectAIBasedHorses(horses, raceInfo, insights) {
        const candidates = [];
        const usedHorses = new Set(); // 重複防止
        
        // バックアップ：基本的な分析で候補を確保
        const sortedByOdds = [...horses].sort((a, b) => a.odds - b.odds);
        const favoriteHorse = sortedByOdds[0]; // 1番人気
        const secondChoice = sortedByOdds[1]; // 2番人気
        
        // 隠れた強さから選定
        if (insights.hiddenStrengths.length > 0) {
            insights.hiddenStrengths.forEach(strength => {
                const horse = horses.find(h => h.name === strength.horse);
                if (horse && !usedHorses.has(strength.horse)) {
                    candidates.push({
                        horse: strength.horse,
                        horseNumber: horses.indexOf(horse) + 1,
                        reason: strength.reason,
                        confidence: strength.type === 'undervalued' ? 'high' : 'medium',
                        source: 'hidden_strength'
                    });
                    usedHorses.add(strength.horse);
                }
            });
        }
        
        // 市場乖離から選定
        const underpriced = insights.marketGaps.filter(g => g.type === 'underpriced');
        underpriced.forEach(gap => {
            const horse = horses.find(h => h.name === gap.horse);
            if (horse && !usedHorses.has(gap.horse) && candidates.length < 3) {
                candidates.push({
                    horse: gap.horse,
                    horseNumber: horses.indexOf(horse) + 1,
                    reason: gap.reason,
                    confidence: 'medium',
                    source: 'market_gap'
                });
                usedHorses.add(gap.horse);
            }
        });
        
        // 中間オッズの妙味馬から選定
        insights.oddsPatterns.middleHorseValue.forEach(middle => {
            const horse = horses.find(h => h.name === middle.name);
            if (horse && !usedHorses.has(middle.name) && candidates.length < 3) {
                candidates.push({
                    horse: middle.name,
                    horseNumber: horses.indexOf(horse) + 1,
                    reason: `${middle.odds}倍の中オッズながら前走${middle.lastRace}着で健闘期待`,
                    confidence: 'medium',
                    source: 'middle_odds'
                });
                usedHorses.add(middle.name);
            }
        });
        
        // 人気薄から1頭
        if (insights.oddsPatterns.longShotCandidates.length > 0 && candidates.length < 3) {
            const longShot = insights.oddsPatterns.longShotCandidates[0];
            if (longShot && !usedHorses.has(longShot.name)) {
                const horse = horses.find(h => h.name === longShot.name);
                if (horse) {
                    candidates.push({
                        horse: longShot.name,
                        horseNumber: horses.indexOf(horse) + 1,
                        reason: `${longShot.odds}倍の人気薄ながら前走${longShot.lastRace}着で一発の可能性`,
                        confidence: 'low',
                        source: 'longshot'
                    });
                    usedHorses.add(longShot.name);
                }
            }
        }
        
        // 候補が少ない場合のフォールバック
        if (candidates.length === 0) {
            // 1番人気を追加
            candidates.push({
                horse: favoriteHorse.name,
                horseNumber: horses.indexOf(favoriteHorse) + 1,
                reason: `${favoriteHorse.odds}倍の1番人気として安定感が期待できます`,
                confidence: 'medium',
                source: 'favorite_fallback'
            });
        }
        
        if (candidates.length === 1 && secondChoice) {
            // 2番人気を追加
            candidates.push({
                horse: secondChoice.name,
                horseNumber: horses.indexOf(secondChoice) + 1,
                reason: `${secondChoice.odds}倍の2番人気として対抗馬に適しています`,
                confidence: 'medium',
                source: 'second_choice_fallback'
            });
        }
        
        // 候補がさらに不足している場合
        if (candidates.length < 2) {
            const additionalHorse = sortedByOdds.find(h => !usedHorses.has(h.name));
            if (additionalHorse) {
                candidates.push({
                    horse: additionalHorse.name,
                    horseNumber: horses.indexOf(additionalHorse) + 1,
                    reason: `${additionalHorse.odds}倍で堅実な選択として追加推奨`,
                    confidence: 'medium',
                    source: 'additional_fallback'
                });
            }
        }
        
        // 最大3頭まで、重複チェック
        return candidates.slice(0, 3).filter((candidate, index, self) => 
            index === self.findIndex(c => c.horse === candidate.horse)
        );
    }
    
    // AI独自の買い目戦略（修正版）
    static generateAIBettingStrategy(aiTopPicks, horses, raceInfo) {
        const strategy = [];
        
        if (aiTopPicks.length === 0) return strategy;
        
        console.log('AI買い目戦略生成 - 注目馬:', aiTopPicks.map(p => `${p.horseNumber}番 ${p.horse}`));
        
        const mainPick = aiTopPicks[0];
        const mainHorse = horses.find(h => h.name === mainPick.horse);
        
        if (!mainHorse) {
            console.error('メイン推奨馬が見つかりません:', mainPick);
            return strategy;
        }
        
        // 単勝戦略
        if (mainPick.confidence === 'high' && mainHorse.odds <= 15) {
            strategy.push({
                type: '単勝',
                combination: `${mainPick.horseNumber}番 ${mainPick.horse}`,
                amount: mainHorse.odds <= 8 ? '400-600円' : '300-500円',
                expectedReturn: `${Math.round(mainHorse.odds * 450)}円前後`,
                risk: mainHorse.odds <= 5 ? 'low' : 'medium',
                reason: `AI最有力候補（${mainPick.source}）`
            });
        }
        
        // 複勝戦略（安全策）
        if (mainPick.confidence !== 'low') {
            strategy.push({
                type: '複勝',
                combination: `${mainPick.horseNumber}番 ${mainPick.horse}`,
                amount: '300-400円',
                expectedReturn: `${Math.round(mainHorse.odds * 0.3 * 350)}円前後`,
                risk: 'low',
                reason: 'AI推奨馬の安全策'
            });
        }
        
        // ワイド戦略（同じ馬番の組み合わせを防止）
        if (aiTopPicks.length >= 2) {
            const secondPick = aiTopPicks[1];
            
            // 同じ馬でないことを確認
            if (mainPick.horseNumber !== secondPick.horseNumber && mainPick.horse !== secondPick.horse) {
                const secondHorse = horses.find(h => h.name === secondPick.horse);
                
                if (secondHorse) {
                    // ワイド推定倍率計算
                    const estimatedWideOdds = this.calculateEstimatedWideOdds(mainHorse, secondHorse);
                    
                    strategy.push({
                        type: 'ワイド',
                        combination: `${mainPick.horseNumber}番 ${mainPick.horse} - ${secondPick.horseNumber}番 ${secondPick.horse}`,
                        amount: '200-400円',
                        expectedReturn: `${estimatedWideOdds}倍（推定）`,
                        risk: 'medium',
                        reason: 'AI上位2頭の組み合わせ'
                    });
                }
            }
        }
        
        // 3連複戦略
        if (aiTopPicks.length >= 3) {
            const uniquePicks = aiTopPicks.filter((pick, index, self) => 
                index === self.findIndex(p => p.horseNumber === pick.horseNumber)
            ).slice(0, 3);
            
            if (uniquePicks.length === 3) {
                const combinations = uniquePicks.map(p => `${p.horseNumber}番`).join('-');
                strategy.push({
                    type: '3連複',
                    combination: combinations,
                    amount: '100-200円',
                    expectedReturn: '3000-15000円',
                    risk: 'high',
                    reason: 'AI上位3頭ボックス'
                });
            }
        }
        
        // 穴狙い戦略
        const longShotPick = aiTopPicks.find(pick => pick.source === 'longshot');
        if (longShotPick && longShotPick.horseNumber !== mainPick.horseNumber) {
            const longShotHorse = horses.find(h => h.name === longShotPick.horse);
            if (longShotHorse) {
                strategy.push({
                    type: '単勝',
                    combination: `${longShotPick.horseNumber}番 ${longShotPick.horse}（穴狙い）`,
                    amount: '100-200円',
                    expectedReturn: `${Math.round(longShotHorse.odds * 150)}円前後`,
                    risk: 'high',
                    reason: 'AI発見の穴馬候補'
                });
            }
        }
        
        // 戦略が空の場合のフォールバック
        if (strategy.length === 0) {
            strategy.push({
                type: '複勝',
                combination: `${mainPick.horseNumber}番 ${mainPick.horse}`,
                amount: '300円',
                expectedReturn: `${Math.round(mainHorse.odds * 0.3 * 300)}円前後`,
                risk: 'low',
                reason: 'AI基本推奨（フォールバック）'
            });
        }
        
        console.log('生成された買い目戦略:', strategy);
        return strategy;
    }
    
    // ワイド推定倍率計算（簡易版）
    static calculateEstimatedWideOdds(horse1, horse2) {
        const avgOdds = (horse1.odds + horse2.odds) / 2;
        let estimatedOdds;
        
        if (avgOdds <= 3) {
            estimatedOdds = '2.0-4.0';
        } else if (avgOdds <= 8) {
            estimatedOdds = '4.0-8.0';
        } else if (avgOdds <= 15) {
            estimatedOdds = '8.0-15.0';
        } else {
            estimatedOdds = '15.0-30.0';
        }
        
        return estimatedOdds;
    }
    
    // AI総合判断（改善版 - 多様な文章生成）
    static generateAISummary(aiTopPicks, aiBettingStrategy, aiInsights) {
        if (aiTopPicks.length === 0) {
            return 'AIが明確な推奨馬を見つけられませんでした。統計分析を参考にしてください。';
        }
        
        const mainPick = aiTopPicks[0];
        const confidence = mainPick.confidence || 'medium';
        
        // 開始文のバリエーション
        const openingVariations = [
            `AIの分析では${mainPick.horse}（${mainPick.horseNumber}番）が最も注目すべき存在です。`,
            `今回のレースで${mainPick.horse}（${mainPick.horseNumber}番）に最も期待が集まります。`,
            `データ分析の結果、${mainPick.horse}（${mainPick.horseNumber}番）が有力候補として浮上しました。`,
            `競馬AIの判断では${mainPick.horse}（${mainPick.horseNumber}番）を軸馬として推奨します。`
        ];
        
        let summary = openingVariations[Math.floor(Math.random() * openingVariations.length)];
        
        // 根拠説明のバリエーション
        const reasonVariations = {
            'hidden_strength': [
                'オッズと実力の間に見逃せない乖離を発見しました。',
                '市場が見落としている潜在能力を評価しています。',
                '前走実績から隠れた実力を感じ取りました。',
                'データの奥に眠る好材料を見つけ出しました。'
            ],
            'market_gap': [
                '市場評価が実力に見合っていない可能性があります。',
                'オッズに対して過小評価されていると判断しました。',
                '人気薄ながら実力は侮れないと分析しています。',
                '期待値の高さが際立つ一頭として注目です。'
            ],
            'middle_odds': [
                '中オッズながら安定した実績が光ります。',
                '手堅い選択として信頼に値する馬です。',
                '堅実な戦績から好走の可能性を感じます。',
                '中穴として的中の期待が持てます。'
            ],
            'favorite_fallback': [
                '人気の裏付けとなる実力を備えています。',
                '安定感のある実績で信頼できる選択です。',
                '手堅い本命として期待が持てます。'
            ],
            'longshot': [
                '大穴として一発の可能性を秘めています。',
                '人気薄ながら侮れない一面を持っています。',
                '高配当を狙える穴馬候補として注目です。'
            ]
        };
        
        const sourceReasons = reasonVariations[mainPick.source] || reasonVariations['middle_odds'];
        summary += sourceReasons[Math.floor(Math.random() * sourceReasons.length)];
        
        // 複数頭推奨時の追加コメント
        if (aiTopPicks.length > 1) {
            const secondPick = aiTopPicks[1];
            const multipleVariations = [
                ` 相手には${secondPick.horse}（${secondPick.horseNumber}番）との組み合わせが効果的でしょう。`,
                ` ${secondPick.horse}（${secondPick.horseNumber}番）を加えた馬連・ワイドも検討の価値があります。`,
                ` サブ候補の${secondPick.horse}（${secondPick.horseNumber}番）も押さえておきたい一頭です。`
            ];
            summary += multipleVariations[Math.floor(Math.random() * multipleVariations.length)];
        }
        
        // 戦略金額の説明
        const totalAmount = aiBettingStrategy.reduce((sum, s) => {
            const amounts = s.amount.match(/(\d+)-(\d+)/);
            return sum + (amounts ? parseInt(amounts[2]) : 0);
        }, 0);
        
        const investmentVariations = [
            ` 総投資額${totalAmount}円程度での展開を想定しています。`,
            ` 推奨投資額は${totalAmount}円前後となります。`,
            ` ${totalAmount}円規模での投資戦略を提案します。`
        ];
        summary += investmentVariations[Math.floor(Math.random() * investmentVariations.length)];
        
        // 信頼度に応じたコメント
        const confidenceVariations = {
            'high': [
                '高い信頼度での推奨となります。',
                '自信を持ってお勧めできる内容です。',
                '確度の高い分析結果と判断しています。'
            ],
            'medium': [
                '標準的な信頼度での推奨です。',
                '堅実な分析に基づく提案となります。',
                '適度なリスクバランスを考慮した内容です。'
            ],
            'low': [
                '慎重な判断をお勧めします。',
                '参考程度にご検討ください。',
                'リスクを十分考慮した投資をお勧めします。'
            ]
        };
        
        const confComments = confidenceVariations[confidence] || confidenceVariations['medium'];
        summary += confComments[Math.floor(Math.random() * confComments.length)];
        
        // リスク注意喚起
        const highRiskCount = aiBettingStrategy.filter(s => s.risk === 'high').length;
        if (highRiskCount > 0) {
            const riskWarnings = [
                '一部ハイリスク戦略も含まれますのでご注意ください。',
                '高リスク投資も含むため、慎重な判断をお願いします。',
                '穴狙い要素もあるため、リスク管理を忘れずに。'
            ];
            summary += riskWarnings[Math.floor(Math.random() * riskWarnings.length)];
        }
        
        return summary;
    }
    
    // AI信頼度計算
    static calculateAIConfidence(aiTopPicks, aiInsights) {
        if (aiTopPicks.length === 0) return 'low';
        
        let confidenceScore = 0;
        
        // 注目馬の信頼度
        aiTopPicks.forEach(pick => {
            if (pick.confidence === 'high') confidenceScore += 3;
            else if (pick.confidence === 'medium') confidenceScore += 2;
            else confidenceScore += 1;
        });
        
        // 隠れた強さの数
        confidenceScore += aiInsights.hiddenStrengths.length;
        
        // 市場乖離の数
        confidenceScore += aiInsights.marketGaps.filter(g => g.type === 'underpriced').length;
        
        if (confidenceScore >= 6) return 'high';
        if (confidenceScore >= 3) return 'medium';
        return 'low';
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

        // Claude AI/フォールバックによる表示の切り替え
        const isRealClaudeAI = recommendation.sourceType === 'real_claude_ai';
        const headerGradient = isRealClaudeAI ? 
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
            'linear-gradient(135deg, #ff9a56 0%, #ff7b7b 100%)';
        const headerIcon = isRealClaudeAI ? '🤖' : '🔧';
        const methodText = isRealClaudeAI ? 'Claude AI SDK統合' : recommendation.method || 'フォールバック AI';

        let html = `
            <div style="background: ${headerGradient}; border-radius: 15px; padding: 20px; margin: 20px 0; color: white; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <span style="font-size: 24px; margin-right: 10px;">${headerIcon}</span>
                    <h3 style="margin: 0; font-size: 1.4em;">${methodText} 買い目推奨</h3>
                    ${isRealClaudeAI ? 
                        '<span style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 12px; font-size: 0.8em; margin-left: 10px;">✨ REAL AI</span>' : 
                        '<span style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 12px; font-size: 0.8em; margin-left: 10px;">🔄 BACKUP</span>'
                    }
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
                const pickConfidence = pick.confidence || 'medium';
                const confidenceColor = pickConfidence === 'high' ? '#4caf50' : 
                                      pickConfidence === 'medium' ? '#ff9800' : '#f44336';
                const confidenceText = pickConfidence === 'high' ? '高' : 
                                     pickConfidence === 'medium' ? '中' : '低';
                
                // undefinedを防ぐための安全な値取得
                const pickHorseNumber = pick.horseNumber || (index + 1);
                const pickHorse = pick.horse || '不明';
                const pickReason = pick.reason || '推奨理由が設定されていません';
                
                html += `
                    <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid ${confidenceColor};">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                            <strong style="font-size: 1.1em;">${pickHorseNumber}番 ${pickHorse}</strong>
                            <span style="background: ${confidenceColor}; padding: 4px 8px; border-radius: 20px; font-size: 0.8em; font-weight: bold;">
                                信頼度: ${confidenceText}
                            </span>
                        </div>
                        <p style="margin: 0; font-size: 0.9em; opacity: 0.9;">${pickReason}</p>
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
                
                // undefinedを防ぐための安全な値取得
                const strategyType = strategy.type || '不明';
                const strategyCombination = strategy.combination || strategy.target || 'N/A';
                const strategyAmount = strategy.amount || '未設定';
                const strategyReturn = strategy.expectedReturn || 'N/A';
                const strategyRisk = strategy.risk || 'medium';
                const riskText = strategyRisk === 'low' ? '低' : strategyRisk === 'medium' ? '中' : '高';
                
                html += `
                    <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; align-items: center;">
                        <div>
                            <div style="font-weight: bold; margin-bottom: 4px;">${strategyType}</div>
                            <div style="font-size: 0.9em; opacity: 0.8;">${strategyCombination}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-weight: bold; color: #ffd700;">${strategyAmount}</div>
                            <div style="font-size: 0.8em; opacity: 0.7;">推奨金額</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-weight: bold; color: #90ee90;">${strategyReturn}</div>
                            <div style="font-size: 0.8em; opacity: 0.7;">期待リターン</div>
                        </div>
                        <div style="text-align: center;">
                            <span style="background: ${riskColor}; padding: 4px 8px; border-radius: 15px; font-size: 0.8em; font-weight: bold;">
                                ${riskText}
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

        // Claude AI利用状況の表示
        if (isRealClaudeAI) {
            html += `
                <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin-bottom: 15px;">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <span style="margin-right: 8px;">⚡</span>
                        <strong>Claude AI直接分析結果</strong>
                    </div>
                    <div style="font-size: 0.9em; opacity: 0.8;">
                        実際のClaude AIが競馬データを分析して生成した推奨です。統計計算とは独立した判断です。
                    </div>
                </div>
            `;
        } else {
            html += `
                <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin-bottom: 15px;">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <span style="margin-right: 8px;">🔄</span>
                        <strong>フォールバック分析結果</strong>
                    </div>
                    <div style="font-size: 0.9em; opacity: 0.8;">
                        Claude AI呼び出しが失敗したため、模擬AI分析を使用しています。
                        <br>実際のAI分析を使用するには、ANTHROPIC_API_KEYを設定してください。
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
        
        // AI推奨が的中したかチェック（従来の判定）
        const wasCorrect = currentRecommendation.topPicks.some(pick => 
            pick.horse === actualWinner || actualPlace.includes(pick.horse)
        );

        // 買い目戦略の評価（新機能）
        const bettingEvaluation = this.evaluateBettingStrategy(
            currentRecommendation.bettingStrategy || [], 
            actualWinner, 
            actualPlace
        );

        // 段階的な予想評価（新機能）
        const predictionEvaluation = this.evaluatePredictionAccuracy(
            currentRecommendation.topPicks,
            actualWinner,
            actualPlace
        );

        const recommendedHorse = currentRecommendation.topPicks[0]; // 最上位推奨馬

        const resultRecord = {
            date: new Date().toISOString(),
            recommendation: currentRecommendation,
            actualWinner,
            actualPlace,
            wasCorrect, // 従来の判定（互換性のため保持）
            recommendedHorse,
            confidence: currentRecommendation.confidence || 'medium',
            // 新しい評価指標
            bettingEvaluation: bettingEvaluation,
            predictionEvaluation: predictionEvaluation,
            overallScore: this.calculateOverallScore(predictionEvaluation, bettingEvaluation)
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

    // ===== 新しい評価機能 =====

    // 買い目戦略の評価
    static evaluateBettingStrategy(bettingStrategy, actualWinner, actualPlace) {
        if (!bettingStrategy || bettingStrategy.length === 0) {
            return {
                totalBets: 0,
                successfulBets: 0,
                successRate: 0,
                details: [],
                hasStrategy: false
            };
        }

        const evaluatedBets = bettingStrategy.map(bet => {
            let isSuccessful = false;
            let successType = '';
            
            // target または combination フィールドから実際の対象を取得
            const betTarget = bet.target || bet.combination || '';

            switch (bet.type) {
                case '単勝':
                    // 「1番 馬名」形式や馬名のみに対応
                    const winTargetHorse = this.extractHorseFromCombination(betTarget, actualWinner);
                    isSuccessful = winTargetHorse;
                    successType = isSuccessful ? '単勝的中' : '単勝外れ';
                    break;

                case '複勝':
                    // 「1番 馬名」形式や馬名のみに対応
                    const placeTargetHorse = this.extractHorseFromCombination(betTarget, actualPlace);
                    isSuccessful = placeTargetHorse;
                    successType = isSuccessful ? '複勝的中' : '複勝外れ';
                    break;

                case 'ワイド':
                    // ワイド：推奨2頭の組み合わせ
                    const targets = this.parseWideTargets(betTarget);
                    if (targets.length === 2) {
                        isSuccessful = targets.every(horse => 
                            actualPlace.some(winner => winner.includes(horse) || horse.includes(winner))
                        );
                        successType = isSuccessful ? 'ワイド的中' : 'ワイド外れ';
                    } else {
                        // 1頭のみの場合は複勝として扱う
                        const singleTargetHorse = this.extractHorseFromCombination(betTarget, actualPlace);
                        isSuccessful = singleTargetHorse;
                        successType = isSuccessful ? '複勝的中（ワイド単体）' : '複勝外れ';
                    }
                    break;

                case '馬連':
                    const renTargets = this.parseWideTargets(betTarget);
                    if (renTargets.length === 2) {
                        isSuccessful = renTargets.every(horse => 
                            actualPlace.slice(0, 2).some(winner => winner.includes(horse) || horse.includes(winner))
                        );
                        successType = isSuccessful ? '馬連的中' : '馬連外れ';
                    }
                    break;

                default:
                    // その他の券種は複勝として扱う
                    const defaultTargetHorse = this.extractHorseFromCombination(betTarget, actualPlace);
                    isSuccessful = defaultTargetHorse;
                    successType = isSuccessful ? `${bet.type}的中（複勝扱い）` : `${bet.type}外れ`;
                    break;
            }

            return {
                type: bet.type,
                target: betTarget,
                reason: bet.reason,
                isSuccessful: isSuccessful,
                successType: successType
            };
        });

        const successfulBets = evaluatedBets.filter(bet => bet.isSuccessful).length;
        const successRate = successfulBets / evaluatedBets.length;

        return {
            totalBets: evaluatedBets.length,
            successfulBets: successfulBets,
            successRate: successRate,
            details: evaluatedBets,
            hasStrategy: true
        };
    }

    // 買い目組み合わせから馬名を抽出する
    static extractHorseFromCombination(combination, actualHorses) {
        if (!combination || !actualHorses) return false;
        
        // actualHorsesが配列でない場合（単勝用）
        const horsesToCheck = Array.isArray(actualHorses) ? actualHorses : [actualHorses];
        
        // 「1番 馬名」形式から馬名を抽出、または馬名のみの場合
        const cleanTarget = combination.replace(/^\d+番\s*/, '').trim();
        
        return horsesToCheck.some(horse => 
            horse.includes(cleanTarget) || cleanTarget.includes(horse) || horse === cleanTarget
        );
    }

    // ワイド等の複数馬目標をパース
    static parseWideTargets(target) {
        if (!target) return [];
        
        // 「馬名1-馬名2」または「馬名1 馬名2」の形式に対応
        const separators = ['-', '－', ' ', '　', ',', '、'];
        for (const sep of separators) {
            if (target.includes(sep)) {
                return target.split(sep)
                    .map(horse => horse.replace(/^\d+番\s*/, '').trim())
                    .filter(horse => horse);
            }
        }
        
        // 区切り文字がない場合は単体として扱う
        return [target.replace(/^\d+番\s*/, '').trim()];
    }

    // ===== 手動AI入力機能 =====
    
    // ユーザー用のプロンプトを生成
    static generatePromptForUser() {
        const currentPredictions = PredictionEngine.getCurrentPredictions();
        if (currentPredictions.length === 0) {
            showMessage('まず予測を実行してください。', 'warning');
            return;
        }

        const analysisData = this.prepareAnalysisData(currentPredictions);
        const prompt = this.formatRaceDataForClaude(analysisData.horses, analysisData.raceInfo);
        
        // プロンプトを表示エリアに出力
        const promptOutput = document.getElementById('promptOutput');
        if (promptOutput) {
            promptOutput.innerHTML = `
                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #ffc107;">
                    <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
                        <h6 style="margin: 0; color: #856404;">📋 Claude AIに送信するプロンプト</h6>
                        <button onclick="AIRecommendationService.copyPromptToClipboard()" 
                                style="background: #17a2b8; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            📋 コピー
                        </button>
                    </div>
                    <pre id="generatedPrompt" style="background: #f8f9fa; padding: 10px; border-radius: 4px; font-size: 11px; line-height: 1.4; max-height: 300px; overflow-y: auto; white-space: pre-wrap;">${prompt}</pre>
                    <p style="margin-top: 10px; font-size: 0.9em; color: #856404;">
                        💡 <strong>使用方法:</strong><br>
                        1. 上のプロンプトをコピーしてClaude AIに送信<br>
                        2. AIからの回答を下のテキストエリアに貼り付け<br>
                        3. 「手動回答を処理」ボタンをクリック
                    </p>
                </div>
            `;
        }
        
        showMessage('プロンプトを生成しました。Claude AIに送信して回答を取得してください。', 'success');
    }

    // プロンプトをクリップボードにコピー
    static async copyPromptToClipboard() {
        const promptElement = document.getElementById('generatedPrompt');
        if (promptElement) {
            try {
                await navigator.clipboard.writeText(promptElement.textContent);
                showMessage('プロンプトをクリップボードにコピーしました！', 'success');
            } catch (err) {
                // フォールバック：テキスト選択
                const range = document.createRange();
                range.selectNode(promptElement);
                window.getSelection().removeAllRanges();
                window.getSelection().addRange(range);
                showMessage('プロンプトを選択しました。Ctrl+Cでコピーしてください。', 'info');
            }
        }
    }

    // 手動AI回答を処理
    static processManualAIResponse() {
        const manualResponse = document.getElementById('manualAIResponse');
        if (!manualResponse || !manualResponse.value.trim()) {
            showMessage('AI回答を入力してください。', 'warning');
            return;
        }

        const currentPredictions = PredictionEngine.getCurrentPredictions();
        if (currentPredictions.length === 0) {
            showMessage('まず予測を実行してください。', 'warning');
            return;
        }

        try {
            // AI回答をパースして推奨を生成
            const aiResponse = manualResponse.value.trim();
            const recommendation = this.parseManualAIResponse(aiResponse, currentPredictions);
            
            if (recommendation.success) {
                this.lastRecommendation = recommendation;
                this.displayAIRecommendation(recommendation);
                showMessage('手動AI回答を正常に処理しました！', 'success');
                
                // 入力フィールドをクリア
                manualResponse.value = '';
            } else {
                showMessage(`回答の処理に失敗しました: ${recommendation.error}`, 'error');
            }
            
        } catch (error) {
            console.error('手動AI回答処理エラー:', error);
            showMessage(`エラーが発生しました: ${error.message}`, 'error');
        }
    }

    // 手動AI回答をパース
    static parseManualAIResponse(aiResponse, horses) {
        try {
            // JSON部分を抽出
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                // JSON形式でない場合はテキストとして処理
                return {
                    success: true,
                    analysis: aiResponse.substring(0, 300) + (aiResponse.length > 300 ? '...' : ''),
                    topPicks: this.extractTopPicksFromText(aiResponse, horses),
                    bettingStrategy: this.extractBettingStrategyFromText(aiResponse),
                    summary: 'Claude AIからの手動回答を処理しました',
                    confidence: 'medium',
                    sourceType: 'manual_claude_ai',
                    generatedAt: new Date().toLocaleString('ja-JP'),
                    method: 'Claude AI 手動入力'
                };
            }
            
            const claudeData = JSON.parse(jsonMatch[0]);
            
            // 馬番設定
            if (claudeData.topPicks) {
                claudeData.topPicks.forEach(pick => {
                    const horse = horses.find(h => h.name === pick.horse);
                    if (horse) {
                        pick.horseNumber = horses.indexOf(horse) + 1;
                    } else {
                        pick.horseNumber = pick.horseNumber || 1;
                    }
                });
            }

            // bettingStrategyの形式を統一
            const processedBettingStrategy = (claudeData.bettingStrategy || []).map(strategy => ({
                type: strategy.type || '不明',
                combination: strategy.combination || strategy.target || 'N/A',
                amount: strategy.amount || '未設定',
                expectedReturn: strategy.expectedReturn || 'N/A',
                risk: strategy.risk || 'medium',
                reason: strategy.reason || '理由未設定'
            }));

            return {
                success: true,
                analysis: claudeData.analysis || '分析データがありません',
                topPicks: claudeData.topPicks || [],
                bettingStrategy: processedBettingStrategy,
                summary: claudeData.summary || 'まとめがありません',
                confidence: claudeData.confidence || 'medium',
                sourceType: 'manual_claude_ai',
                generatedAt: new Date().toLocaleString('ja-JP'),
                method: 'Claude AI 手動入力'
            };
            
        } catch (error) {
            return {
                success: false,
                error: `回答解析失敗: ${error.message}`
            };
        }
    }

    // テキストから注目馬を抽出
    static extractTopPicksFromText(text, horses) {
        const picks = [];
        
        // 馬名を含む行を探して推奨馬を抽出
        horses.forEach((horse, index) => {
            if (text.includes(horse.name)) {
                const horseNumber = index + 1;
                picks.push({
                    horse: horse.name,
                    horseNumber: horseNumber,
                    reason: `AI推奨（${horseNumber}番）`,
                    confidence: 'medium'
                });
            }
        });
        
        // 最大3頭まで
        return picks.slice(0, 3);
    }

    // テキストから買い目戦略を抽出
    static extractBettingStrategyFromText(text) {
        const strategy = [];
        
        // 単勝、複勝、ワイドのキーワードを探す
        const betTypes = ['単勝', '複勝', 'ワイド', '馬連', '3連複'];
        
        betTypes.forEach(type => {
            if (text.includes(type)) {
                strategy.push({
                    type: type,
                    combination: 'テキストから抽出',
                    amount: '未設定',
                    expectedReturn: 'N/A',
                    risk: 'medium',
                    reason: 'AI推奨テキストから抽出'
                });
            }
        });
        
        return strategy;
    }

    // 段階的な予想評価
    static evaluatePredictionAccuracy(topPicks, actualWinner, actualPlace) {
        if (!topPicks || topPicks.length === 0) {
            return {
                level: 'no_prediction',
                score: 0,
                type: '推奨なし',
                details: '推奨馬が設定されていません'
            };
        }

        const mainPick = topPicks[0]; // 最上位推奨馬
        
        if (mainPick.horse === actualWinner) {
            return {
                level: 'excellent',
                score: 100,
                type: '1着的中',
                details: `最上位推奨馬「${mainPick.horse}」が1着`,
                position: 1
            };
        } else if (actualPlace.length >= 2 && actualPlace.slice(0, 2).includes(mainPick.horse)) {
            return {
                level: 'good',
                score: 70,
                type: '2着以内',
                details: `最上位推奨馬「${mainPick.horse}」が2着以内`,
                position: actualPlace.indexOf(mainPick.horse) + 1
            };
        } else if (actualPlace.includes(mainPick.horse)) {
            return {
                level: 'fair',
                score: 40,
                type: '3着以内',
                details: `最上位推奨馬「${mainPick.horse}」が3着`,
                position: actualPlace.indexOf(mainPick.horse) + 1
            };
        } else {
            // その他の推奨馬が的中した場合もチェック
            for (let i = 1; i < topPicks.length; i++) {
                const pick = topPicks[i];
                if (actualPlace.includes(pick.horse)) {
                    return {
                        level: 'minor',
                        score: 20,
                        type: `${i + 1}番手推奨馬的中`,
                        details: `${i + 1}番手推奨馬「${pick.horse}」が${actualPlace.indexOf(pick.horse) + 1}着`,
                        position: actualPlace.indexOf(pick.horse) + 1
                    };
                }
            }
            
            return {
                level: 'miss',
                score: 0,
                type: '圏外',
                details: '推奨馬がすべて3着以内に入らず',
                position: null
            };
        }
    }

    // 総合スコアの計算
    static calculateOverallScore(predictionEvaluation, bettingEvaluation) {
        const predictionWeight = 0.6; // 予想精度の重み
        const bettingWeight = 0.4;   // 買い目精度の重み

        const predictionScore = predictionEvaluation.score || 0;
        const bettingScore = bettingEvaluation.hasStrategy ? 
            (bettingEvaluation.successRate * 100) : predictionScore;

        const overallScore = (predictionScore * predictionWeight) + (bettingScore * bettingWeight);

        return {
            overall: Math.round(overallScore * 10) / 10,
            prediction: predictionScore,
            betting: bettingScore,
            breakdown: {
                predictionWeight: predictionWeight,
                bettingWeight: bettingWeight,
                predictionContribution: predictionScore * predictionWeight,
                bettingContribution: bettingScore * bettingWeight
            }
        };
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

        let statsMessage = `📈 AI判断パターン分析統計\n\n`;
        statsMessage += `総推奨回数: ${metrics.totalRecommendations}回\n`;
        statsMessage += `的中回数: ${metrics.successfulRecommendations}回\n`;
        statsMessage += `的中率: ${metrics.successRate}%\n`;
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

    // ===== グラフ表示機能 =====
    
    static currentChart = null; // 現在表示中のチャートを保持
    
    // グラフ表示エリアを表示
    static showLearningGraphs() {
        const graphSection = document.getElementById('learningGraphsSection');
        if (graphSection) {
            graphSection.style.display = 'block';
            graphSection.scrollIntoView({ behavior: 'smooth' });
            
            // デフォルトで成功率推移を表示
            setTimeout(() => {
                this.showSuccessRateChart();
            }, 300);
        }
    }
    
    // 成功率推移グラフ
    static showSuccessRateChart() {
        const aiHistory = this.getAIRecommendationHistory();
        
        if (aiHistory.length === 0) {
            this.showNoDataMessage('成功率推移を表示するには、AI推奨の履歴が必要です。');
            return;
        }
        
        // 時系列データを準備（直近20件まで）
        const recentHistory = aiHistory.slice(-20);
        const labels = recentHistory.map((_, index) => `${index + 1}回目`);
        
        // 累積成功率を計算
        let successCount = 0;
        const cumulativeSuccessRates = recentHistory.map((record, index) => {
            if (record.wasCorrect) successCount++;
            return ((successCount / (index + 1)) * 100).toFixed(1);
        });
        
        // 移動平均成功率を計算（5回移動平均）
        const movingAverages = [];
        for (let i = 0; i < recentHistory.length; i++) {
            const start = Math.max(0, i - 4);
            const subset = recentHistory.slice(start, i + 1);
            const avg = (subset.filter(r => r.wasCorrect).length / subset.length) * 100;
            movingAverages.push(avg.toFixed(1));
        }
        
        const data = {
            labels: labels,
            datasets: [
                {
                    label: '累積成功率 (%)',
                    data: cumulativeSuccessRates,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1,
                    fill: true
                },
                {
                    label: '5回移動平均 (%)',
                    data: movingAverages,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    tension: 0.3,
                    borderDash: [5, 5]
                }
            ]
        };
        
        const config = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '📈 AI推奨成功率の推移'
                    },
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: '成功率 (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '推奨回数'
                        }
                    }
                }
            }
        };
        
        this.renderChart(config);
        this.updateChartDescription(`📈 <strong>成功率推移グラフ</strong><br>
            • 青線: 累積成功率（全体の成功率）<br>
            • 赤線: 5回移動平均（最近の傾向）<br>
            • 総推奨回数: ${aiHistory.length}回<br>
            • 最新成功率: ${cumulativeSuccessRates[cumulativeSuccessRates.length - 1]}%`);
    }
    
    // 買い目戦略成功率グラフ（新機能）
    static showBettingStrategyChart() {
        const aiHistory = this.getAIRecommendationHistory();
        
        // 買い目評価データがある履歴のみを抽出
        const bettingHistory = aiHistory.filter(record => 
            record.bettingEvaluation && record.bettingEvaluation.hasStrategy
        );
        
        if (bettingHistory.length === 0) {
            this.showNoDataMessage('買い目戦略分析を表示するには、買い目評価データが必要です。レース結果を入力して学習を蓄積してください。');
            return;
        }
        
        // 券種別の成功率を計算
        const betTypes = {};
        bettingHistory.forEach(record => {
            record.bettingEvaluation.details.forEach(bet => {
                if (!betTypes[bet.type]) {
                    betTypes[bet.type] = { total: 0, successful: 0 };
                }
                betTypes[bet.type].total++;
                if (bet.isSuccessful) {
                    betTypes[bet.type].successful++;
                }
            });
        });
        
        const labels = Object.keys(betTypes);
        const successRates = labels.map(type => 
            ((betTypes[type].successful / betTypes[type].total) * 100).toFixed(1)
        );
        const totalCounts = labels.map(type => betTypes[type].total);
        
        const data = {
            labels: labels,
            datasets: [
                {
                    label: '成功率 (%)',
                    data: successRates,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 205, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)',
                        'rgba(255, 159, 64, 0.8)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 205, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 2
                }
            ]
        };
        
        const config = {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '💰 券種別買い目戦略成功率'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: '成功率 (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '券種'
                        }
                    }
                }
            }
        };
        
        this.renderChart(config);
        
        // 詳細説明を生成
        const detailsText = labels.map((type, index) => 
            `${type}: ${successRates[index]}% (${betTypes[type].successful}/${totalCounts[index]})`
        ).join('<br>• ');
        
        this.updateChartDescription(`💰 <strong>買い目戦略成功率</strong><br>
            • ${detailsText}<br>
            • 総評価対象: ${bettingHistory.length}レース<br>
            • 最も成功率が高い券種: ${labels.length > 0 ? labels[successRates.indexOf(Math.max(...successRates))] : 'なし'}`);
    }
    
    // 信頼度分析グラフ
    static showConfidenceChart() {
        const aiHistory = this.getAIRecommendationHistory();
        
        if (aiHistory.length === 0) {
            this.showNoDataMessage('信頼度分析を表示するには、AI推奨の履歴が必要です。');
            return;
        }
        
        // 信頼度別の成功率を計算
        const confidenceLevels = ['high', 'medium', 'low'];
        const confidenceData = confidenceLevels.map(level => {
            const records = aiHistory.filter(r => r.confidence === level);
            const successCount = records.filter(r => r.wasCorrect).length;
            return {
                level: level,
                total: records.length,
                success: successCount,
                rate: records.length > 0 ? ((successCount / records.length) * 100).toFixed(1) : 0
            };
        });
        
        const data = {
            labels: ['高信頼度', '中信頼度', '低信頼度'],
            datasets: [
                {
                    label: '成功率 (%)',
                    data: confidenceData.map(d => d.rate),
                    backgroundColor: [
                        'rgba(76, 175, 80, 0.8)',
                        'rgba(255, 193, 7, 0.8)',
                        'rgba(244, 67, 54, 0.8)'
                    ],
                    borderColor: [
                        'rgb(76, 175, 80)',
                        'rgb(255, 193, 7)',
                        'rgb(244, 67, 54)'
                    ],
                    borderWidth: 2
                }
            ]
        };
        
        const config = {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '🎯 信頼度別成功率分析'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: '成功率 (%)'
                        }
                    }
                }
            }
        };
        
        this.renderChart(config);
        this.updateChartDescription(`🎯 <strong>信頼度別成功率</strong><br>
            • 高信頼度: ${confidenceData[0].rate}% (${confidenceData[0].success}/${confidenceData[0].total}回)<br>
            • 中信頼度: ${confidenceData[1].rate}% (${confidenceData[1].success}/${confidenceData[1].total}回)<br>
            • 低信頼度: ${confidenceData[2].rate}% (${confidenceData[2].success}/${confidenceData[2].total}回)`);
    }
    
    // オッズ分布グラフ
    static showOddsChart() {
        const aiHistory = this.getAIRecommendationHistory();
        
        if (aiHistory.length === 0) {
            this.showNoDataMessage('オッズ分布を表示するには、AI推奨の履歴が必要です。');
            return;
        }
        
        // オッズ帯別に分類
        const oddsRanges = [
            { label: '1.0-2.9倍', min: 1.0, max: 2.9 },
            { label: '3.0-4.9倍', min: 3.0, max: 4.9 },
            { label: '5.0-9.9倍', min: 5.0, max: 9.9 },
            { label: '10.0-19.9倍', min: 10.0, max: 19.9 },
            { label: '20.0倍以上', min: 20.0, max: 999.9 }
        ];
        
        const oddsData = oddsRanges.map(range => {
            const records = aiHistory.filter(r => {
                const recommendedOdds = r.recommendedHorse?.odds || 0;
                return recommendedOdds >= range.min && recommendedOdds <= range.max;
            });
            const successCount = records.filter(r => r.wasCorrect).length;
            return {
                range: range.label,
                total: records.length,
                success: successCount,
                rate: records.length > 0 ? ((successCount / records.length) * 100).toFixed(1) : 0
            };
        });
        
        const data = {
            labels: oddsData.map(d => d.range),
            datasets: [
                {
                    label: '推奨回数',
                    data: oddsData.map(d => d.total),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: '成功率 (%)',
                    data: oddsData.map(d => d.rate),
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 2,
                    type: 'line',
                    yAxisID: 'y1'
                }
            ]
        };
        
        const config = {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    title: {
                        display: true,
                        text: '💰 推奨オッズ帯別分析'
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: '推奨回数'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        max: 100,
                        title: {
                            display: true,
                            text: '成功率 (%)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        };
        
        this.renderChart(config);
        
        const totalRecommendations = oddsData.reduce((sum, d) => sum + d.total, 0);
        const avgSuccessRate = oddsData.reduce((sum, d) => sum + (d.total * parseFloat(d.rate)), 0) / totalRecommendations;
        
        this.updateChartDescription(`💰 <strong>オッズ帯別分析</strong><br>
            • 総推奨回数: ${totalRecommendations}回<br>
            • 平均成功率: ${avgSuccessRate.toFixed(1)}%<br>
            • 最も多い推奨帯: ${oddsData.reduce((max, d) => d.total > max.total ? d : max).range}`);
    }
    
    // チャートをレンダリング
    static renderChart(config) {
        const ctx = document.getElementById('learningChart');
        
        // 既存のチャートを破棄
        if (this.currentChart) {
            this.currentChart.destroy();
        }
        
        // 新しいチャートを作成
        this.currentChart = new Chart(ctx, config);
    }
    
    // チャート説明を更新
    static updateChartDescription(html) {
        const description = document.getElementById('chartDescription');
        if (description) {
            description.innerHTML = html;
        }
    }
    
    // データなしメッセージ表示
    static showNoDataMessage(message) {
        const ctx = document.getElementById('learningChart');
        const parent = ctx.parentNode;
        
        // 既存のチャートを破棄
        if (this.currentChart) {
            this.currentChart.destroy();
            this.currentChart = null;
        }
        
        // メッセージを表示
        parent.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #666;">
                <div style="font-size: 3em; margin-bottom: 20px;">📊</div>
                <h3 style="color: #999; margin-bottom: 10px;">データがありません</h3>
                <p style="color: #666;">${message}</p>
                <canvas id="learningChart" width="400" height="200" style="display: none;"></canvas>
            </div>
        `;
        
        this.updateChartDescription('💡 AI推奨を使用してレース結果を入力すると、学習データが蓄積されてグラフが表示されます。');
    }

    // テスト用のAI学習データを生成（開発・テスト用）
    static generateTestAIData() {
        if (!confirm('テスト用のAI学習データを生成しますか？\n\n既存のデータに20件のテストデータが追加されます。')) {
            return;
        }
        
        const existingHistory = this.getAIRecommendationHistory();
        const testData = [];
        const testHorses = ['サンプル馬A', 'テスト馬B', 'デモ馬C', 'モック馬D', '試験馬E', 'グラフ馬F', 'チャート馬G'];
        const confidenceLevels = ['high', 'medium', 'low'];
        
        for (let i = 0; i < 20; i++) {
            const horse = testHorses[Math.floor(Math.random() * testHorses.length)];
            const odds = Math.round((Math.random() * 18 + 1.5) * 10) / 10; // 1.5-19.5倍
            const confidence = confidenceLevels[Math.floor(Math.random() * confidenceLevels.length)];
            
            // 信頼度に応じて成功率を調整
            let successRate = 0.4; // base 40%
            if (confidence === 'high') successRate = 0.7; // 70%
            else if (confidence === 'medium') successRate = 0.5; // 50%
            else successRate = 0.3; // 30%
            
            const wasCorrect = Math.random() < successRate;
            const actualWinner = wasCorrect ? horse : testHorses[Math.floor(Math.random() * testHorses.length)];
            
            testData.push({
                date: new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString(), // 12時間間隔
                recommendation: {
                    topPicks: [{
                        horse: horse,
                        reason: `テストデータ ${i + 1}: オッズ${odds}倍での推奨`,
                        confidence: confidence
                    }],
                    bettingStrategy: [{
                        type: '単勝',
                        target: horse,
                        reason: `テスト推奨理由 ${i + 1}`
                    }],
                    summary: `テストケース${i + 1}の分析`,
                    confidence: confidence
                },
                actualWinner: actualWinner,
                actualPlace: [actualWinner, testHorses[Math.floor(Math.random() * testHorses.length)], testHorses[Math.floor(Math.random() * testHorses.length)]],
                wasCorrect: wasCorrect,
                recommendedHorse: {
                    name: horse,
                    odds: odds
                },
            });
        }
        
        // 既存データと結合
        const combinedHistory = [...existingHistory, ...testData];
        
        // 最新50件まで保持
        if (combinedHistory.length > 50) {
            combinedHistory.splice(0, combinedHistory.length - 50);
        }
        
        this.saveAIRecommendationHistory(combinedHistory);
        
        if (typeof showMessage === 'function') {
            showMessage('🤖 テスト用AI学習データを生成しました！\n20件のサンプル履歴を追加', 'success');
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