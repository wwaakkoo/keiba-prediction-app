// カスタムエラークラス定義
class RateLimitError extends Error {
    constructor(message, retryAfter = 60) {
        super(message);
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}

class TimeoutError extends Error {
    constructor(message) {
        super(message);
        this.name = 'TimeoutError';
    }
}

class ClientError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ClientError';
    }
}

class ServerError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ServerError';
    }
}

// AI推奨サービス - Claude API統合版（エラーハンドリング強化）
class AIRecommendationService {
    static isLoading = false;
    static lastRecommendation = null;
    static API_KEY_STORAGE_KEY = 'claude_api_key';
    
    // エラーハンドリング強化用の状態管理
    static retryCount = 0;
    static maxRetries = 3;
    static isOfflineMode = false;
    static lastSuccessfulCall = null;
    static errorHistory = [];
    static timeoutDuration = 30000; // 30秒

    // AI推奨を取得する（API/手動モード対応）
    static async getAIRecommendation(predictions, raceInfo = null) {
        if (this.isLoading) {
            console.log('AI推奨取得中です...');
            return null;
        }

        // AI推奨モードをチェック
        const manualMode = document.getElementById('manualMode');
        if (manualMode && manualMode.checked) {
            // 手動モードの場合、プロンプトを自動生成して表示
            this.generatePromptForUser(predictions, raceInfo);
            showMessage('プロンプトを生成しました。Claude AIにコピー&ペーストして分析を依頼してください。', 'info', 4000);
            return null;
        }

        // GitHub Pages環境の検出とCORS問題の説明
        const isGitHubPages = window.location.hostname.includes('github.io');
        const isLocalhost = window.location.hostname === 'localhost';
        
        if (isGitHubPages || (!isLocalhost && !this.hasAPIKey())) {
            const message = isGitHubPages ? 
                'GitHub Pages環境では手動モードをご利用ください。プロンプトを生成してClaude AIに直接貼り付けてください。' :
                'ブラウザのCORS制限により、直接API呼び出しができません。手動モードをご利用ください。';
            showMessage(message, 'info', 6000);
            
            // 自動的に手動モードに切り替え
            const manualMode = document.getElementById('manualMode');
            if (manualMode) {
                manualMode.checked = true;
                manualMode.dispatchEvent(new Event('change'));
            }
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
            // AI推奨結果をグローバル変数に保存（学習システムで参照するため）
            window.lastAIRecommendation = recommendation;
            this.displayAIRecommendation(recommendation);
            return recommendation;

        } catch (error) {
            console.error('AI推奨エラー:', error);
            
            // エラー履歴に記録
            this.recordError(error);
            
            // エラーの種類に応じた処理
            const errorResult = await this.handleAIError(error, predictions, raceInfo);
            if (errorResult) {
                return errorResult;
            }
            
            this.showErrorState(this.getErrorMessage(error));
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
            runningStyle: horse.runningStyle, // 脚質情報を追加
            currentRaceLevel: horse.currentRaceLevel, // 今回レースレベルを追加
            // 統計計算結果は除外（AI独自判断のため）
            // score, winProbability, placeProbability, winExpectedValue, placeExpectedValue は使用しない
            course: horse.course,
            distance: horse.distance,
            trackType: horse.trackType,
            weather: horse.weather,
            trackCondition: horse.trackCondition,
            // 血統データを含める
            pedigreeData: horse.pedigreeData,
            // 投資効率データを含める（Phase 3統合）
            investmentEfficiency: horse.investmentEfficiency ? {
                efficiencyScore: horse.efficiencyScore,
                investmentGrade: horse.investmentGrade,
                isUnderdog: horse.isUnderdog,
                underdogBonus: horse.underdogBonus,
                kellyFraction: horse.kellyFraction,
                optimalBetAmount: horse.optimalBetAmount,
                riskReturnRatio: horse.investmentEfficiency.riskReturnRatio,
                expectedValue: horse.investmentEfficiency.expectedValue
            } : null,
            // 過去5走データを含める（指数関数的減衰重み対応）
            raceHistory: {
                lastRace: {
                    order: horse.lastRaceOrder || horse.lastRace,
                    course: horse.lastRaceCourse,
                    distance: horse.lastRaceDistance,
                    trackType: horse.lastRaceTrackType,
                    agari: horse.lastRaceAgari,
                    date: horse.lastRaceDate,
                    popularity: horse.lastRacePopularity,
                    raceLevel: horse.lastRaceLevel, // レースレベル追加
                    weight: 1.00 // 35%重み
                },
                secondLastRace: (horse.secondLastRaceOrder || horse.secondLastRaceCourse || horse.secondLastRaceAgari) ? {
                    order: horse.secondLastRaceOrder,
                    course: horse.secondLastRaceCourse,
                    distance: horse.secondLastRaceDistance,
                    trackType: horse.secondLastRaceTrackType,
                    agari: horse.secondLastRaceAgari,
                    date: horse.secondLastRaceDate,
                    popularity: horse.secondLastRacePopularity,
                    raceLevel: horse.secondLastRaceLevel, // レースレベル追加
                    weight: 0.82 // 29%重み
                } : null,
                thirdLastRace: (horse.thirdLastRaceOrder || horse.thirdLastRaceCourse || horse.thirdLastRaceAgari) ? {
                    order: horse.thirdLastRaceOrder,
                    course: horse.thirdLastRaceCourse,
                    distance: horse.thirdLastRaceDistance,
                    trackType: horse.thirdLastRaceTrackType,
                    agari: horse.thirdLastRaceAgari,
                    date: horse.thirdLastRaceDate,
                    popularity: horse.thirdLastRacePopularity,
                    raceLevel: horse.thirdLastRaceLevel, // レースレベル追加
                    weight: 0.67 // 24%重み
                } : null,
                fourthLastRace: (horse.fourthLastRaceOrder || horse.fourthLastRaceCourse || horse.fourthLastRaceAgari) ? {
                    order: horse.fourthLastRaceOrder,
                    course: horse.fourthLastRaceCourse,
                    distance: horse.fourthLastRaceDistance,
                    trackType: horse.fourthLastRaceTrackType,
                    agari: horse.fourthLastRaceAgari,
                    date: horse.fourthLastRaceDate,
                    popularity: horse.fourthLastRacePopularity,
                    raceLevel: horse.fourthLastRaceLevel, // レースレベル追加
                    weight: 0.55 // 19%重み
                } : null,
                fifthLastRace: (horse.fifthLastRaceOrder || horse.fifthLastRaceCourse || horse.fifthLastRaceAgari) ? {
                    order: horse.fifthLastRaceOrder,
                    course: horse.fifthLastRaceCourse,
                    distance: horse.fifthLastRaceDistance,
                    trackType: horse.fifthLastRaceTrackType,
                    agari: horse.fifthLastRaceAgari,
                    date: horse.fifthLastRaceDate,
                    popularity: horse.fifthLastRacePopularity,
                    raceLevel: horse.fifthLastRaceLevel, // レースレベル追加
                    weight: 0.45 // 16%重み
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
            
            if (apiResult && apiResult.success && apiResult.content) {
                // Claude APIからの生のJSONレスポンスを解析
                let parsedResponse;
                try {
                    parsedResponse = JSON.parse(apiResult.content);
                } catch (parseError) {
                    console.error('Claude AIレスポンス解析エラー:', parseError);
                    return { success: false, error: 'Claude AIのレスポンス形式が無効です' };
                }
                
                // 解析されたレスポンスを返却
                return {
                    success: true,
                    analysis: parsedResponse.analysis,
                    topPicks: parsedResponse.topPicks || [],
                    bettingStrategy: parsedResponse.bettingStrategy || [],
                    summary: parsedResponse.riskAnalysis || parsedResponse.summary,
                    confidence: parsedResponse.confidence || 'medium',
                    sourceType: 'real_claude_ai',
                    generatedAt: apiResult.timestamp
                };
            } else if (apiResult && apiResult.fallback) {
                // フォールバックが推奨される場合
                return { success: false, error: apiResult.error || 'APIキー未設定のためフォールバック使用' };
            }
            
            return { success: false, error: 'Claude AIからの回答が空でした' };
            
        } catch (error) {
            console.error('Claude AI API呼び出しエラー:', error);
            
            // エラータイプに応じた詳細なエラー情報を返却
            const errorInfo = this.analyzeError(error);
            return {
                success: false,
                error: error.message,
                errorType: errorInfo.type,
                retryable: errorInfo.retryable,
                fallbackRecommended: errorInfo.fallbackRecommended
            };
        }
    }
    
    // Claude AIに送信するプロンプトの作成（純粋データ版）
    static formatRaceDataForClaude(horses, raceInfo) {
        const horseList = horses.map((horse, index) => {
            let horseInfo = `${index + 1}. ${horse.name || `${index + 1}番馬`} - オッズ:${horse.odds}倍, 前走:${horse.lastRace || horse.raceHistory?.lastRace?.order || '不明'}着, 騎手:${horse.jockey || '不明'}, 年齢:${horse.age || '不明'}歳, 脚質:${horse.runningStyle || '不明'}`;
            
            // 血統情報を追加
            if (horse.pedigreeData) {
                const pedigree = horse.pedigreeData;
                horseInfo += ` [血統:${pedigree.sireAnalysis?.name || '?'}`;
                if (pedigree.damSireAnalysis?.name) {
                    horseInfo += ` (母父:${pedigree.damSireAnalysis.name})`;
                }
                if (pedigree.overallRating?.grade) {
                    horseInfo += ` 血統評価:${pedigree.overallRating.grade}級(${pedigree.overallRating.totalScore}点)`;
                }
                if (pedigree.sireAnalysis?.specialties) {
                    horseInfo += ` 特性:${pedigree.sireAnalysis.specialties.join('・')}`;
                }
                if (pedigree.matingAnalysis?.compatibility >= 85) {
                    horseInfo += ` 配合:優秀`;
                } else if (pedigree.matingAnalysis?.compatibility <= 65) {
                    horseInfo += ` 配合:課題`;
                }
                horseInfo += `]`;
            }
            
            // 前走詳細データがあれば追加
            if (horse.raceHistory?.lastRace) {
                const lastRace = horse.raceHistory.lastRace;
                horseInfo += ` [前走:${lastRace.course || '?'} ${lastRace.distance || '?'}m`;
                if (lastRace.raceLevel) horseInfo += ` ${lastRace.raceLevel}`;
                if (lastRace.agari) horseInfo += ` 上がり${lastRace.agari}秒`;
                if (lastRace.popularity) horseInfo += ` ${lastRace.popularity}番人気`;
                horseInfo += `]`;
            }
            
            // 2走前データがあれば追加
            if (horse.raceHistory?.secondLastRace) {
                const secondRace = horse.raceHistory.secondLastRace;
                horseInfo += ` [2走前:${secondRace.order || '?'}着 ${secondRace.course || '?'} ${secondRace.distance || '?'}m`;
                if (secondRace.raceLevel) horseInfo += ` ${secondRace.raceLevel}`;
                if (secondRace.agari) horseInfo += ` 上がり${secondRace.agari}秒`;
                if (secondRace.popularity) horseInfo += ` ${secondRace.popularity}番人気`;
                horseInfo += `]`;
            }
            
            // 3走前データがあれば追加
            if (horse.raceHistory?.thirdLastRace) {
                const thirdRace = horse.raceHistory.thirdLastRace;
                horseInfo += ` [3走前:${thirdRace.order || '?'}着 ${thirdRace.course || '?'} ${thirdRace.distance || '?'}m`;
                if (thirdRace.raceLevel) horseInfo += ` ${thirdRace.raceLevel}`;
                if (thirdRace.agari) horseInfo += ` 上がり${thirdRace.agari}秒`;
                if (thirdRace.popularity) horseInfo += ` ${thirdRace.popularity}番人気`;
                horseInfo += `]`;
            }
            
            // 4走前データがあれば追加
            if (horse.raceHistory?.fourthLastRace) {
                const fourthRace = horse.raceHistory.fourthLastRace;
                horseInfo += ` [4走前:${fourthRace.order || '?'}着 ${fourthRace.course || '?'} ${fourthRace.distance || '?'}m`;
                if (fourthRace.raceLevel) horseInfo += ` ${fourthRace.raceLevel}`;
                if (fourthRace.agari) horseInfo += ` 上がり${fourthRace.agari}秒`;
                if (fourthRace.popularity) horseInfo += ` ${fourthRace.popularity}番人気`;
                horseInfo += `]`;
            }
            
            // 5走前データがあれば追加
            if (horse.raceHistory?.fifthLastRace) {
                const fifthRace = horse.raceHistory.fifthLastRace;
                horseInfo += ` [5走前:${fifthRace.order || '?'}着 ${fifthRace.course || '?'} ${fifthRace.distance || '?'}m`;
                if (fifthRace.raceLevel) horseInfo += ` ${fifthRace.raceLevel}`;
                if (fifthRace.agari) horseInfo += ` 上がり${fifthRace.agari}秒`;
                if (fifthRace.popularity) horseInfo += ` ${fifthRace.popularity}番人気`;
                horseInfo += `]`;
            }
            
            // 投資効率情報を追加（Phase 3統合）
            if (horse.investmentEfficiency) {
                const ie = horse.investmentEfficiency;
                horseInfo += ` [投資効率:${ie.efficiencyScore?.toFixed(1) || '?'}点 ${ie.investmentGrade || '?'}級`;
                if (ie.isUnderdog) {
                    horseInfo += ` 🐎穴馬候補(+${ie.underdogBonus || 0})`;
                }
                if (ie.kellyFraction > 0) {
                    horseInfo += ` ケリー:${(ie.kellyFraction * 100).toFixed(1)}%`;
                    if (ie.optimalBetAmount > 0) {
                        horseInfo += ` 推奨:${Math.round(ie.optimalBetAmount).toLocaleString()}円`;
                    }
                }
                if (ie.riskReturnRatio) {
                    horseInfo += ` リスク・リターン:${ie.riskReturnRatio.toFixed(2)}`;
                }
                horseInfo += `]`;
            }
            
            return horseInfo;
        }).join('\n');
        
        return `【競馬レース予想分析】
あなたは経験豊富な競馬予想の専門家です。以下のデータを基に、実戦的な買い目を推奨してください。

## 📍 レース基本情報
- **コース**: ${raceInfo?.course || '未設定'}
- **距離**: ${raceInfo?.distance || '未設定'}m
- **馬場**: ${raceInfo?.trackType || '芝'} (${raceInfo?.trackCondition || '良'})
- **天候**: ${raceInfo?.weather || '晴'}
- **レースレベル**: ${raceInfo?.raceLevel || horses[0]?.currentRaceLevel || '未設定'}

## 🐎 出走馬詳細データ
${horseList}

## 🎯 分析要領
以下の観点から総合的に判断してください：

**重視すべき要素（統計ロジック＋AI独自分析）:**

**【統計データ分析】**
1. **前5走の成績推移（前走35%→5走前16%）** - 調子の上向き/下降トレンド
2. **脚質と距離・馬場適性** - 今回条件への戦法適応度
3. **レースレベルの昇降級** - クラス変更による影響分析
4. **騎手・オッズの妥当性** - 人気と実力の乖離
5. **血統評価と適性分析** - 父系・母父系の特性、配合相性、距離・馬場血統適性
6. **💰投資効率分析（Phase 3重視項目）** - 効率スコア・投資グレード・穴馬判定・ケリー基準・リスク・リターン分析

**【AI独自分析（統計では捉えきれない要素）】**
7. **心理的・精神的要因** - 馬の気性、集中力、プレッシャー対応、大舞台適性
8. **戦術的・展開要素** - 騎手の戦術選択、ポジション取り、レース運びの巧拙
9. **複合的相互作用** - 複数要因の組み合わせ効果、非線形な関係性
10. **質的・直感的判断** - 馬体バランス、気配、調教の質的評価
11. **レース全体の文脈** - 他馬との相性、レース全体のレベル感、特殊条件

**具体的分析ポイント:**
- **数値分析**: 前5走トレンド、脚質適性、レースレベル分析、上がり3F一貫性
- **血統分析**: 父系・母父系の系統特性、配合パターン評価、距離・馬場血統適性、種牡馬ランク
- **💰投資効率分析**: 効率スコア優秀馬、穴馬候補、ケリー基準推奨額、リスク・リターン比、投資グレード評価
- **戦術分析**: 想定ペース、ポジション争い、直線での加速タイミング
- **心理分析**: 馬の性格（闘争心・臆病さ）、騎手との相性、環境適応力
- **質的判断**: 調教内容の充実度、馬体の張り・気配、近況の変化
- **相互作用**: 脚質×展開、騎手×馬の相性、血統×条件、オッズ×実力、投資効率×人気度の総合判断
- **経験則**: ベテラン的な勘、パターン認識、例外的な好走可能性

## 📊 回答フォーマット
以下のJSON形式で必ず回答してください：

{
  "analysis": "レース全体の流れと展開予想（戦術・心理・質的要素を含む150文字程度）",
  "keyFactors": [
    "統計的注目ポイント（数値要因）",
    "AI独自の洞察（戦術・心理・質的要因）", 
    "複合的相互作用ポイント"
  ],
  "topPicks": [
    {
      "horse": "馬名",
      "horseNumber": 馬番,
      "reason": "推奨理由（統計データ＋AI独自の戦術・心理・質的判断を統合）",
      "confidence": "high/medium/low",
      "expectedFinish": "1-3着/4-6着/7着以下"
    }
  ],
  "bettingStrategy": [
    {
      "patternName": "安全重視パターン",
      "totalBudget": "1000円",
      "bets": [
        {
          "type": "AIが最適と判断する券種（単勝、複勝、ワイド、馬連、馬単、3連複、3連単から選択）",
          "combination": "具体的買い目",
          "amount": "金額",
          "expectedReturn": "予想配当幅",
          "reason": "選択理由"
        }
      ],
      "expectedHitRate": "的中率見込み",
      "riskLevel": "high/medium/low"
    },
    {
      "patternName": "バランス重視パターン", 
      "totalBudget": "1000円",
      "bets": [
        {
          "type": "AIが最適と判断する券種",
          "combination": "具体的買い目",
          "amount": "金額",
          "expectedReturn": "予想配当幅",
          "reason": "選択理由"
        }
      ],
      "expectedHitRate": "的中率見込み",
      "riskLevel": "high/medium/low"
    },
    {
      "patternName": "高配当狙いパターン",
      "totalBudget": "1000円", 
      "bets": [
        {
          "type": "AIが最適と判断する券種",
          "combination": "具体的買い目",
          "amount": "金額",
          "expectedReturn": "予想配当幅",
          "reason": "選択理由"
        }
      ],
      "expectedHitRate": "的中率見込み",
      "riskLevel": "high/medium/low"
    }
  ],
  "riskAnalysis": "リスクと対策（80文字程度）",
  "confidence": "high/medium/low"
}

**必須事項:**

**【統計分析】**
- 前5走データの指数関数的重み付け分析を必ず実施
- 各馬のトレンド（向上・安定・悪化）を必ず言及
- オッズの妥当性を数値的に評価

**【AI独自分析（統計では判断できない要素）】**
- **戦術分析**: 想定ペース・ポジション争い・直線勝負の展開読み
- **心理分析**: 馬の性格・気性・プレッシャー対応・大舞台適性
- **質的判断**: 調教の充実度・馬体の気配・近況変化の評価
- **相互作用**: 複数要因の組み合わせ効果・非線形関係の洞察
- **経験則**: 統計に表れない例外的パターン・ベテラン的勘

**【アウトプット】**
- 予算1000円で3つの異なる戦略パターンを提案
- 各パターンで最適な券種をAIが選択（単勝、複勝、ワイド、馬連、馬単、3連複、3連単）
- 的中率とリターンのバランスを考慮した提案
- **安全重視**：的中率高・配当低（複勝中心等）
- **バランス重視**：的中率中・配当中（ワイド・馬連等）
- **高配当狙い**：的中率低・配当高（3連複・3連単等）
- 各戦略の選択理由とAI独自の洞察を明記
- 日本語で簡潔に回答

## 🔥 重要：AI独自分析の価値発揮
統計的予測ロジックでは捉えきれない「戦術・心理・質的・相互作用・経験則」の要素こそが、AIの真価です。数値データを超えた洞察力で、人間の直感と経験を活かした総合判断を行ってください。`;
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
    
    // Claude APIをプロキシサーバー経由で呼び出し（エラーハンドリング強化版）
    static async callClaudeAPI(horses, raceInfo) {
        let lastError = null;
        
        // リトライ機能付きAPI呼び出し
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                console.log(`Claude AI API呼び出し開始（試行${attempt}/${this.maxRetries}）...`);
                
                // APIキーを取得
                const apiKey = this.getAPIKey();
                if (!apiKey) {
                    throw new Error('APIキーが設定されていません。設定画面からAPIキーを入力してください。');
                }
                
                // プロンプトを生成
                const prompt = this.generatePromptForAPI(horses, raceInfo);
                
                // プロキシサーバーのエンドポイントを使用
                const proxyUrl = window.location.origin.includes('localhost:3001') ? 
                    '/api/claude' : 'http://localhost:3001/api/claude';
                
                // タイムアウト付きでAPIを呼び出し
                const response = await this.fetchWithTimeout(proxyUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        prompt: prompt,
                        apiKey: apiKey
                    })
                }, this.timeoutDuration);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    
                    // HTTPステータスコードに応じた処理
                    if (response.status === 429) {
                        // レート制限エラー
                        const retryAfter = response.headers.get('Retry-After') || 60;
                        throw new RateLimitError(`レート制限に達しました。${retryAfter}秒後に再試行してください。`, retryAfter);
                    } else if (response.status >= 500) {
                        // サーバーエラー（リトライ可能）
                        throw new ServerError(`サーバーエラー: ${response.status} - ${errorData.error || 'Internal Server Error'}`);
                    } else {
                        // クライアントエラー（リトライ不可）
                        throw new ClientError(`クライアントエラー: ${response.status} - ${errorData.error || 'Bad Request'}`);
                    }
                }
                
                const result = await response.json();
                console.log('Claude AI API呼び出し完了（プロキシ経由）:', result);
                
                if (!result.success) {
                    throw new Error(`Claude APIエラー: ${result.error || 'Unknown error'}`);
                }
                
                // 成功時の処理
                this.retryCount = 0;
                this.lastSuccessfulCall = new Date();
                this.isOfflineMode = false;
                
                return {
                    success: true,
                    content: result.content,
                    usage: result.usage,
                    timestamp: new Date().toISOString()
                };
                
            } catch (error) {
                lastError = error;
                console.error(`Claude API呼び出しエラー（試行${attempt}）:`, error);
                
                // エラータイプに応じたリトライ判定
                if (error instanceof ClientError || error.name === 'AuthenticationError') {
                    // リトライしないエラー
                    break;
                } else if (error instanceof RateLimitError) {
                    // レート制限エラーの場合は待機
                    if (attempt < this.maxRetries) {
                        const waitTime = Math.min(error.retryAfter * 1000, 60000); // 最大60秒
                        console.log(`レート制限により${waitTime/1000}秒待機します...`);
                        await this.sleep(waitTime);
                    }
                    continue;
                } else if (attempt < this.maxRetries) {
                    // その他のエラーは指数バックオフで待機
                    const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // 最大10秒
                    console.log(`${waitTime/1000}秒後にリトライします...`);
                    await this.sleep(waitTime);
                }
            }
        }
        
        // すべてのリトライが失敗した場合
        this.retryCount = this.maxRetries;
        throw lastError || new Error('Claude API呼び出しが失敗しました');
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
            
            // bettingStrategyの形式を統一（3パターン対応）
            const processedBettingStrategy = (claudeData.bettingStrategy || []).map(pattern => ({
                patternName: pattern.patternName || '戦略パターン',
                totalBudget: pattern.totalBudget || '1000円',
                expectedHitRate: pattern.expectedHitRate || '未設定',
                riskLevel: pattern.riskLevel || 'medium',
                bets: (pattern.bets || []).map(bet => ({
                    type: bet.type || '不明',
                    combination: bet.combination || 'N/A',
                    amount: bet.amount || '未設定',
                    expectedReturn: bet.expectedReturn || 'N/A',
                    reason: bet.reason || '理由未設定'
                }))
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

        // 重要ファクター
        if (recommendation.keyFactors && recommendation.keyFactors.length > 0) {
            html += `
                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <h4 style="margin: 0 0 15px 0; display: flex; align-items: center;">
                        <span style="margin-right: 8px;">🔍</span>レース攻略ポイント
                    </h4>
                    <div style="display: grid; gap: 8px;">
            `;
            
            recommendation.keyFactors.forEach((factor, index) => {
                html += `
                    <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px; border-left: 3px solid #ffd700;">
                        <div style="display: flex; align-items: center;">
                            <span style="background: #ffd700; color: #333; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8em; font-weight: bold; margin-right: 10px;">
                                ${index + 1}
                            </span>
                            <span style="font-size: 0.95em; line-height: 1.4;">${factor}</span>
                        </div>
                    </div>
                `;
            });
            
            html += '</div></div>';
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
                const expectedFinish = pick.expectedFinish || '';
                
                html += `
                    <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid ${confidenceColor};">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <strong style="font-size: 1.1em;">${pickHorseNumber}番 ${pickHorse}</strong>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                ${expectedFinish ? `<span style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 15px; font-size: 0.75em; font-weight: bold;">
                                    🎯 ${expectedFinish}
                                </span>` : ''}
                                <span style="background: ${confidenceColor}; padding: 4px 8px; border-radius: 20px; font-size: 0.8em; font-weight: bold;">
                                    信頼度: ${confidenceText}
                                </span>
                            </div>
                        </div>
                        <p style="margin: 0; font-size: 0.9em; opacity: 0.9; line-height: 1.4;">${pickReason}</p>
                    </div>
                `;
            });
            
            html += '</div>';
        }

        // 買い目戦略（3パターン対応）
        if (recommendation.bettingStrategy && recommendation.bettingStrategy.length > 0) {
            html += `
                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <h4 style="margin: 0 0 15px 0; display: flex; align-items: center;">
                        <span style="margin-right: 8px;">💰</span>AI推奨買い目（予算1000円・3パターン）
                    </h4>
            `;
            
            recommendation.bettingStrategy.forEach((pattern, patternIndex) => {
                const patternColors = ['#4caf50', '#2196f3', '#ff9800']; // 安全・バランス・高配当
                const patternIcons = ['🛡️', '⚖️', '🚀'];
                const currentColor = patternColors[patternIndex] || '#666';
                const currentIcon = patternIcons[patternIndex] || '💡';
                
                // undefinedを防ぐための安全な値取得
                const patternName = pattern.patternName || `パターン${patternIndex + 1}`;
                const totalBudget = pattern.totalBudget || '1000円';
                const expectedHitRate = pattern.expectedHitRate || '未設定';
                const riskLevel = pattern.riskLevel || 'medium';
                const riskText = riskLevel === 'low' ? '低' : riskLevel === 'medium' ? '中' : '高';
                
                html += `
                    <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; margin-bottom: 12px; border-left: 4px solid ${currentColor};">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h5 style="margin: 0; display: flex; align-items: center; color: ${currentColor};">
                                <span style="margin-right: 8px; font-size: 1.2em;">${currentIcon}</span>
                                ${patternName}
                            </h5>
                            <div style="display: flex; gap: 12px; align-items: center; font-size: 0.9em;">
                                <span style="background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 12px;">
                                    💰 ${totalBudget}
                                </span>
                                <span style="background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 12px;">
                                    📊 的中率${expectedHitRate}
                                </span>
                                <span style="background: ${currentColor}; padding: 4px 8px; border-radius: 12px; font-weight: bold;">
                                    リスク${riskText}
                                </span>
                            </div>
                        </div>
                        
                        <div style="display: grid; gap: 8px;">
                `;
                
                // 各パターンの買い目リスト
                if (pattern.bets && pattern.bets.length > 0) {
                    pattern.bets.forEach(bet => {
                        const betType = bet.type || '不明';
                        const betCombination = bet.combination || 'N/A';
                        const betAmount = bet.amount || '未設定';
                        const betReturn = bet.expectedReturn || 'N/A';
                        const betReason = bet.reason || '理由未設定';
                        
                        html += `
                            <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 6px;">
                                <div style="display: grid; grid-template-columns: auto 1fr auto auto; gap: 12px; align-items: center;">
                                    <div style="font-weight: bold; color: ${currentColor};">
                                        ${betType}
                                    </div>
                                    <div style="font-size: 0.95em;">
                                        ${betCombination}
                                    </div>
                                    <div style="text-align: center; font-weight: bold; color: #ffd700;">
                                        ${betAmount}
                                    </div>
                                    <div style="text-align: center; font-weight: bold; color: #90ee90;">
                                        ${betReturn}
                                    </div>
                                </div>
                                ${betReason !== '理由未設定' ? `
                                    <div style="font-size: 0.85em; opacity: 0.8; margin-top: 6px; padding-left: 12px; border-left: 2px solid rgba(255,255,255,0.2);">
                                        💡 ${betReason}
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    });
                } else {
                    html += `
                        <div style="text-align: center; padding: 20px; opacity: 0.6;">
                            このパターンには買い目が設定されていません
                        </div>
                    `;
                }
                
                html += `
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
        }

        // リスク分析
        if (recommendation.riskAnalysis) {
            html += `
                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <h4 style="margin: 0 0 10px 0; display: flex; align-items: center;">
                        <span style="margin-right: 8px;">⚠️</span>リスク分析と対策
                    </h4>
                    <div style="background: rgba(255,193,7,0.1); border-left: 4px solid #ffc107; padding: 12px; border-radius: 6px;">
                        <p style="margin: 0; line-height: 1.6; color: rgba(255,255,255,0.95);">${recommendation.riskAnalysis}</p>
                    </div>
                </div>
            `;
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
                // AI推奨結果をグローバル変数に保存（学習システムで参照するため）
                window.lastAIRecommendation = recommendation;
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
                    summary: this.extractSummaryFromText(aiResponse),
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

            // bettingStrategyの形式を統一（3パターン対応）
            const processedBettingStrategy = (claudeData.bettingStrategy || []).map(pattern => {
                // 新形式（パターン式）の場合
                if (pattern.patternName || pattern.bets) {
                    return {
                        patternName: pattern.patternName || '戦略パターン',
                        totalBudget: pattern.totalBudget || '1000円',
                        expectedHitRate: pattern.expectedHitRate || '未設定',
                        riskLevel: pattern.riskLevel || 'medium',
                        bets: (pattern.bets || []).map(bet => ({
                            type: bet.type || '不明',
                            combination: bet.combination || 'N/A',
                            amount: bet.amount || '未設定',
                            expectedReturn: bet.expectedReturn || 'N/A',
                            reason: bet.reason || '理由未設定'
                        }))
                    };
                }
                // 旧形式（単一戦略）の場合は新形式に変換
                else {
                    return {
                        patternName: 'AI推奨戦略',
                        totalBudget: '1000円',
                        expectedHitRate: '未設定',
                        riskLevel: pattern.risk || 'medium',
                        bets: [{
                            type: pattern.type || '不明',
                            combination: pattern.combination || pattern.target || 'N/A',
                            amount: pattern.amount || '未設定',
                            expectedReturn: pattern.expectedReturn || 'N/A',
                            reason: pattern.reason || '理由未設定'
                        }]
                    };
                }
            });

            return {
                success: true,
                analysis: claudeData.analysis || '分析データがありません',
                topPicks: claudeData.topPicks || [],
                bettingStrategy: processedBettingStrategy,
                summary: claudeData.summary || this.generateSummaryFromData(claudeData),
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

    // テキストから買い目戦略を抽出（3パターン形式で返す）
    static extractBettingStrategyFromText(text) {
        const strategies = [];
        
        // 単勝、複勝、ワイドのキーワードを探す
        const betTypes = ['単勝', '複勝', 'ワイド', '馬連', '3連複'];
        const foundBets = [];
        
        betTypes.forEach(type => {
            if (text.includes(type)) {
                foundBets.push({
                    type: type,
                    combination: 'テキストから抽出',
                    amount: '未設定',
                    expectedReturn: 'N/A',
                    reason: 'AI推奨テキストから抽出'
                });
            }
        });
        
        // 3パターン形式で返す
        if (foundBets.length > 0) {
            strategies.push({
                patternName: 'テキスト抽出パターン',
                totalBudget: '1000円',
                expectedHitRate: '未設定',
                riskLevel: 'medium',
                bets: foundBets
            });
        } else {
            // 戦略が見つからない場合は空のパターンを作成
            strategies.push({
                patternName: 'デフォルトパターン',
                totalBudget: '1000円',
                expectedHitRate: '未設定',
                riskLevel: 'medium',
                bets: [{
                    type: '不明',
                    combination: 'テキストから抽出できませんでした',
                    amount: '未設定',
                    expectedReturn: 'N/A',
                    reason: 'AI推奨テキストから戦略を抽出できませんでした'
                }]
            });
        }
        
        return strategies;
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
            // bettingEvaluationとdetailsの存在確認
            if (!record.bettingEvaluation || !record.bettingEvaluation.details || !Array.isArray(record.bettingEvaluation.details)) {
                console.warn('Invalid bettingEvaluation structure:', record);
                return;
            }
            
            record.bettingEvaluation.details.forEach(bet => {
                // betオブジェクトとtypeプロパティの存在確認
                if (!bet || !bet.type) {
                    console.warn('Invalid bet object:', bet);
                    return;
                }
                
                if (!betTypes[bet.type]) {
                    betTypes[bet.type] = { total: 0, successful: 0 };
                }
                betTypes[bet.type].total++;
                if (bet.isSuccessful === true) {
                    betTypes[bet.type].successful++;
                }
            });
        });
        
        const labels = Object.keys(betTypes);
        const successRates = labels.map(type => {
            const total = betTypes[type].total;
            const successful = betTypes[type].successful;
            // 0除算対策
            if (total === 0) {
                return '0.0';
            }
            const rate = (successful / total) * 100;
            // NaN対策
            return isNaN(rate) ? '0.0' : rate.toFixed(1);
        });
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
        
        // 最高成功率券種の安全な取得
        let bestType = 'なし';
        if (labels.length > 0 && successRates.length > 0) {
            const numericRates = successRates.map(rate => parseFloat(rate)).filter(rate => !isNaN(rate));
            if (numericRates.length > 0) {
                const maxRate = Math.max(...numericRates);
                const maxIndex = successRates.findIndex(rate => parseFloat(rate) === maxRate);
                if (maxIndex >= 0 && maxIndex < labels.length) {
                    bestType = labels[maxIndex];
                }
            }
        }

        this.updateChartDescription(`💰 <strong>買い目戦略成功率</strong><br>
            • ${detailsText}<br>
            • 総評価対象: ${bettingHistory.length}レース<br>
            • 最も成功率が高い券種: ${bestType}`);
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

    // API用プロンプト生成
    static generatePromptForAPI(horses, raceInfo) {
        return this.formatRaceDataForClaude(horses, raceInfo);
    }

    // APIキー管理メソッド
    static getAPIKey() {
        return localStorage.getItem(this.API_KEY_STORAGE_KEY);
    }
    
    static setAPIKey(apiKey) {
        if (apiKey && apiKey.trim()) {
            localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey.trim());
            console.log('APIキーが保存されました');
        } else {
            this.removeAPIKey();
        }
    }
    
    static removeAPIKey() {
        localStorage.removeItem(this.API_KEY_STORAGE_KEY);
        console.log('APIキーが削除されました');
    }
    
    static hasAPIKey() {
        const apiKey = this.getAPIKey();
        return apiKey && apiKey.length > 0;
    }
    
    // APIキー設定画面を表示
    static showAPIKeySettings() {
        const currentKey = this.getAPIKey() || '';
        const maskedKey = currentKey ? '●●●●●●●●' + currentKey.slice(-4) : '未設定';
        
        const newKey = prompt(
            `Claude API キーを入力してください:\n\n現在の設定: ${maskedKey}\n\n※APIキーは安全にブラウザのローカルストレージに保存されます`,
            ''
        );
        
        if (newKey !== null) {
            if (newKey.trim() === '') {
                if (confirm('APIキーを削除しますか？')) {
                    this.removeAPIKey();
                    alert('APIキーが削除されました');
                }
            } else {
                this.setAPIKey(newKey);
                alert('APIキーが保存されました');
            }
            this.updateAPIKeyStatus();
        }
    }
    
    // APIキー状態を画面に反映
    static updateAPIKeyStatus() {
        const hasKey = this.hasAPIKey();
        const statusElement = document.getElementById('apiKeyStatus');
        if (statusElement) {
            statusElement.textContent = hasKey ? '✅ APIキー設定済み' : '❌ APIキー未設定';
            statusElement.style.color = hasKey ? '#28a745' : '#dc3545';
        }
    }

    // エラーハンドリング強化機能群
    
    // タイムアウト付きfetch
    static async fetchWithTimeout(url, options, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new TimeoutError(`API呼び出しがタイムアウトしました（${timeout/1000}秒）`);
            }
            throw error;
        }
    }
    
    // エラーの種類を分析
    static analyzeError(error) {
        if (error instanceof RateLimitError) {
            return {
                type: 'rate_limit',
                retryable: true,
                fallbackRecommended: true,
                userMessage: `レート制限に達しました。${error.retryAfter}秒後に再試行してください。`
            };
        } else if (error instanceof TimeoutError) {
            return {
                type: 'timeout',
                retryable: true,
                fallbackRecommended: true,
                userMessage: 'API呼び出しがタイムアウトしました。ネットワーク接続をご確認ください。'
            };
        } else if (error instanceof ClientError) {
            return {
                type: 'client_error',
                retryable: false,
                fallbackRecommended: true,
                userMessage: 'APIキーの設定に問題があります。設定を確認してください。'
            };
        } else if (error instanceof ServerError) {
            return {
                type: 'server_error',
                retryable: true,
                fallbackRecommended: true,
                userMessage: 'サーバーに一時的な問題が発生しています。しばらく待ってから再試行してください。'
            };
        } else if (error.message.includes('ネットワーク') || error.message.includes('fetch')) {
            return {
                type: 'network_error',
                retryable: true,
                fallbackRecommended: true,
                userMessage: 'ネットワーク接続に問題があります。接続を確認してください。'
            };
        } else {
            return {
                type: 'unknown_error',
                retryable: false,
                fallbackRecommended: true,
                userMessage: '予期しないエラーが発生しました。'
            };
        }
    }
    
    // エラーを記録
    static recordError(error) {
        const errorRecord = {
            timestamp: new Date().toISOString(),
            type: error.constructor.name,
            message: error.message,
            stack: error.stack
        };
        
        this.errorHistory.push(errorRecord);
        
        // エラー履歴を最新100件まで保持
        if (this.errorHistory.length > 100) {
            this.errorHistory = this.errorHistory.slice(-100);
        }
        
        console.log('エラーを記録しました:', errorRecord);
    }
    
    // AIエラーを総合的に処理
    static async handleAIError(error, predictions, raceInfo) {
        const errorInfo = this.analyzeError(error);
        
        if (errorInfo.fallbackRecommended) {
            showMessage(`${errorInfo.userMessage} フォールバック分析を実行します。`, 'info', 4000);
            
            try {
                // フォールバック推奨を実行
                return await this.generateFallbackRecommendation(predictions, raceInfo);
            } catch (fallbackError) {
                console.error('フォールバック推奨も失敗:', fallbackError);
                this.activateOfflineMode();
                return null;
            }
        }
        
        return null;
    }
    
    // オフラインモードを有効化
    static activateOfflineMode() {
        this.isOfflineMode = true;
        showMessage('オフラインモードが有効になりました。統計分析のみで予想を表示しています。', 'info', 5000);
        console.log('オフラインモードを有効化しました');
    }
    
    // エラーメッセージを取得
    static getErrorMessage(error) {
        const errorInfo = this.analyzeError(error);
        return errorInfo.userMessage || error.message || '不明なエラーが発生しました';
    }
    
    // スリープ関数
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // エラー履歴を取得
    static getErrorHistory() {
        return [...this.errorHistory];
    }
    
    // エラー統計を取得
    static getErrorStats() {
        const stats = {};
        this.errorHistory.forEach(error => {
            stats[error.type] = (stats[error.type] || 0) + 1;
        });
        return stats;
    }

    // 初期化
    static initialize() {
        console.log('AI推奨サービス（エラーハンドリング強化版）を初期化しました');
        
        // 学習システムの初期化を確認
        if (typeof LearningSystem !== 'undefined') {
            console.log('学習システムとの統合が完了しました');
        }
        
        // APIキー状態を更新
        this.updateAPIKeyStatus();
        
        // ネットワーク状態の監視を開始
        this.startNetworkMonitoring();
    }
    
    // ネットワーク状態の監視
    static startNetworkMonitoring() {
        window.addEventListener('online', () => {
            console.log('ネットワーク接続が復旧しました');
            this.isOfflineMode = false;
            showMessage('ネットワーク接続が復旧しました', 'info', 2000);
        });
        
        window.addEventListener('offline', () => {
            console.log('ネットワーク接続が切断されました');
            this.activateOfflineMode();
        });
    }

    // JSONデータからサマリーを生成
    static generateSummaryFromData(claudeData) {
        try {
            let summary = '';
            
            // 1. 分析内容から要点を抽出
            if (claudeData.analysis) {
                const analysisPoints = claudeData.analysis.split('。').filter(s => s.trim().length > 5);
                if (analysisPoints.length > 0) {
                    summary += analysisPoints[0].trim() + '。';
                }
            }
            
            // 2. 推奨馬から要点を抽出
            if (claudeData.topPicks && claudeData.topPicks.length > 0) {
                const topPick = claudeData.topPicks[0];
                if (topPick.horse && topPick.horseNumber) {
                    summary += `本命は${topPick.horseNumber}番${topPick.horse}`;
                    if (claudeData.topPicks.length > 1) {
                        const secondPick = claudeData.topPicks[1];
                        summary += `、対抗は${secondPick.horseNumber}番${secondPick.horse}`;
                    }
                    summary += 'を推奨。';
                }
            }
            
            // 3. 買い目戦略から要点を抽出
            if (claudeData.bettingStrategy && claudeData.bettingStrategy.length > 0) {
                const mainStrategy = claudeData.bettingStrategy[0];
                if (mainStrategy.type && mainStrategy.combination) {
                    summary += `主力は${mainStrategy.type}の${mainStrategy.combination}`;
                    if (mainStrategy.risk === 'low') {
                        summary += '（堅い投資）';
                    } else if (mainStrategy.risk === 'high') {
                        summary += '（高配当狙い）';
                    }
                    summary += '。';
                }
            }
            
            // 4. リスク分析があれば追加
            if (claudeData.riskAnalysis) {
                const riskPoints = claudeData.riskAnalysis.split('。')[0];
                if (riskPoints && riskPoints.length > 10) {
                    summary += `注意点：${riskPoints.trim()}。`;
                }
            }
            
            // 5. キーファクターがあれば追加
            if (claudeData.keyFactors && claudeData.keyFactors.length > 0) {
                summary += `ポイントは${claudeData.keyFactors[0]}。`;
            }
            
            // 6. 文字数調整
            if (summary.length > 200) {
                summary = summary.substring(0, 200) + '...';
            }
            
            return summary || 'Claude AIの詳細な分析結果をご確認ください。';
            
        } catch (error) {
            console.error('サマリー生成エラー:', error);
            return 'Claude AIからの分析結果を処理しました。';
        }
    }

    // テキストからサマリーを抽出
    static extractSummaryFromText(text) {
        try {
            // 1. 「まとめ」「総評」「結論」などのセクションを探す
            const summaryKeywords = [
                /(?:まとめ|総評|結論|要約|サマリー?)[:：]?\s*(.+?)(?:\n\n|\n$|$)/i,
                /(?:総じて|結論として|まとめると|要するに|つまり)(.+?)(?:\n\n|\n$|$)/i,
                /(?:【まとめ】|＜まとめ＞|\[まとめ\]|■まとめ|▼まとめ)(.+?)(?:\n\n|\n$|$)/is,
                /(?:最終的に|全体として|総合的に)(.+?)(?:\n\n|\n$|$)/i
            ];

            for (const pattern of summaryKeywords) {
                const match = text.match(pattern);
                if (match && match[1]) {
                    let summary = match[1].trim();
                    // 不要な文字を除去
                    summary = summary.replace(/^[：:\s]+/, '').replace(/[。．.]*$/, '');
                    if (summary.length > 10) {
                        return summary.length > 200 ? summary.substring(0, 200) + '...' : summary;
                    }
                }
            }

            // 2. 文章の最後の段落からサマリーを抽出
            const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
            if (paragraphs.length > 0) {
                const lastParagraph = paragraphs[paragraphs.length - 1].trim();
                // 最後の段落がサマリーっぽい場合
                if (lastParagraph.length > 20 && lastParagraph.length < 300) {
                    // 推奨や結論を示すキーワードが含まれている場合
                    if (/(?:推奨|おすすめ|注目|狙い目|本命|対抗|期待|有力|見込み)/.test(lastParagraph)) {
                        return lastParagraph.replace(/[。．.]*$/, '');
                    }
                }
            }

            // 3. 推奨馬や買い目に関する文を抽出
            const recommendationSentences = text.match(/[^。．.]*(?:本命|対抗|推奨|おすすめ|注目|狙い目)[^。．.]*/g);
            if (recommendationSentences && recommendationSentences.length > 0) {
                const summary = recommendationSentences.join('。').trim();
                if (summary.length > 10) {
                    return summary.length > 200 ? summary.substring(0, 200) + '...' : summary;
                }
            }

            // 4. 文章全体の要約を生成（最初の2-3文）
            const sentences = text.split(/[。．.]/).filter(s => s.trim().length > 10);
            if (sentences.length >= 2) {
                const summary = sentences.slice(0, Math.min(3, sentences.length)).join('。') + '。';
                if (summary.length > 20) {
                    return summary.length > 200 ? summary.substring(0, 200) + '...' : summary;
                }
            }

            // 5. フォールバック：先頭100文字
            if (text.length > 20) {
                const fallback = text.substring(0, 100).trim();
                return fallback + (text.length > 100 ? '...' : '');
            }

            return 'Claude AIの分析結果を確認してください';

        } catch (error) {
            console.error('サマリー抽出エラー:', error);
            return 'Claude AIからの回答を処理しました';
        }
    }
}

// グローバル関数として公開
window.AIRecommendationService = AIRecommendationService;

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', function() {
    AIRecommendationService.initialize();
});