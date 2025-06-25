// 簡素化されたサーバー（Claude Code SDK統合版）
require('dotenv').config(); // .envファイルを読み込み
const express = require('express');
const cors = require('cors');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;

// Anthropic クライアントの初期化
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// ミドルウェア設定
app.use(cors());
app.use(express.json());

// 静的ファイルの配信
app.use(express.static('.'));

// ヘルスチェックエンドポイント
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        message: 'Claude Code統合版 - APIキー不要'
    });
});

// Claude AI推奨エンドポイント
app.post('/api/ai-recommendation', async (req, res) => {
    try {
        const { horses, raceInfo } = req.body;
        
        // APIキーが設定されているかチェック
        const hasApiKey = process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim() !== '';
        
        if (!hasApiKey) {
            return res.json({
                success: false,
                error: 'APIキーが設定されていません',
                fallback: true
            });
        }
        
        // Claude AIに送信するプロンプトを作成
        const prompt = createRaceAnalysisPrompt(horses, raceInfo);
        
        // Claude AIを呼び出し
        const message = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 2000,
            temperature: 0.3,
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        });
        
        // レスポンスをパース
        let recommendation;
        try {
            const content = message.content[0].text;
            // JSONの開始と終了を探す
            const jsonStart = content.indexOf('{');
            const jsonEnd = content.lastIndexOf('}') + 1;
            
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                const jsonContent = content.substring(jsonStart, jsonEnd);
                recommendation = JSON.parse(jsonContent);
            } else {
                // JSON形式でない場合はテキストとして扱う
                recommendation = {
                    analysis: content,
                    topPicks: [],
                    bettingStrategy: [],
                    summary: content.substring(0, 100) + '...',
                    confidence: 'medium'
                };
            }
        } catch (parseError) {
            console.error('Claude AI レスポンス解析エラー:', parseError);
            recommendation = {
                analysis: message.content[0].text,
                topPicks: [],
                bettingStrategy: [],
                summary: 'Claude AIからの詳細分析を取得しました',
                confidence: 'medium'
            };
        }
        
        res.json({
            success: true,
            recommendation: recommendation,
            sourceType: 'real_claude_ai',
            generatedAt: new Date().toLocaleString('ja-JP')
        });
        
    } catch (error) {
        console.error('Claude AI API エラー:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            fallback: true
        });
    }
});

// 競馬分析用プロンプト作成関数
function createRaceAnalysisPrompt(horses, raceInfo) {
    const horseList = horses.map((horse, index) => {
        let horseInfo = `${index + 1}. ${horse.name} - オッズ:${horse.odds}倍, 前走:${horse.lastRace || horse.raceHistory?.lastRace?.order || '不明'}着, 騎手:${horse.jockey}, 年齢:${horse.age}歳`;
        
        // 前走詳細データがあれば追加
        if (horse.raceHistory?.lastRace) {
            const lastRace = horse.raceHistory.lastRace;
            horseInfo += ` [前走:${lastRace.course || '?'} ${lastRace.distance || '?'}m`;
            if (lastRace.agari) horseInfo += ` 上がり${lastRace.agari}秒`;
            if (lastRace.popularity) horseInfo += ` ${lastRace.popularity}番人気`;
            horseInfo += `]`;
        }
        
        // 2走前データがあれば追加
        if (horse.raceHistory?.secondLastRace) {
            const secondRace = horse.raceHistory.secondLastRace;
            horseInfo += ` [2走前:${secondRace.order || '?'}着 ${secondRace.course || '?'} ${secondRace.distance || '?'}m`;
            if (secondRace.agari) horseInfo += ` 上がり${secondRace.agari}秒`;
            if (secondRace.popularity) horseInfo += ` ${secondRace.popularity}番人気`;
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

## 🐎 出走馬詳細データ
${horseList}

## 🎯 分析要領
以下の観点から総合的に判断してください：

**重視すべき要素（優先順）:**
1. **前走・2走前の成績推移** - 調子の上向き/下降
2. **距離・馬場適性** - 今回条件への適応度
3. **騎手・オッズの妥当性** - 人気と実力の乖離
4. **年齢・体重変化** - コンディション指標

**具体的分析ポイント:**
- 前走から今回への条件変化（距離・馬場・格）
- 上がり3Fと人気のバランス
- 休養期間とローテーション
- 騎手変更の影響

## 📊 回答フォーマット
以下のJSON形式で必ず回答してください：

{
  "analysis": "レース全体の流れと展開予想（150文字程度）",
  "keyFactors": [
    "注目ポイント1",
    "注目ポイント2", 
    "注目ポイント3"
  ],
  "topPicks": [
    {
      "horse": "馬名",
      "horseNumber": 馬番,
      "reason": "推奨理由（前走比較含む）",
      "confidence": "high/medium/low",
      "expectedFinish": "1-3着/4-6着/7着以下"
    }
  ],
  "bettingStrategy": [
    {
      "type": "単勝/複勝/ワイド/馬連",
      "combination": "具体的買い目",
      "amount": "100円-1000円",
      "expectedReturn": "予想配当",
      "risk": "high/medium/low",
      "reason": "根拠（オッズ妥当性含む）"
    }
  ],
  "riskAnalysis": "リスクと対策（80文字程度）",
  "confidence": "high/medium/low"
}

**必須事項:**
- 前走・2走前データを必ず言及
- オッズの妥当性を評価
- 具体的な買い目金額を提示
- リスク要因を明記
- 日本語で簡潔に回答`;
}

// メインページの配信
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// サーバー起動
app.listen(PORT, () => {
    console.log(`🏇 競馬AI推奨アプリ（Claude Code SDK統合版）が起動しました`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    
    // Claude AI利用可能性をチェック
    const hasApiKey = process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim() !== '';
    if (hasApiKey) {
        console.log(`🤖 Claude AI: ✅ 利用可能（実AI分析）`);
    } else {
        console.log(`🤖 Claude AI: ⚠️  APIキー未設定（フォールバック模擬AI使用）`);
        console.log(`💡 実際のClaude AI分析を使用するには: export ANTHROPIC_API_KEY=your_key`);
    }
    
    console.log(`🌍 環境: ${process.env.NODE_ENV || 'development'}`);
    console.log('');
    console.log('📖 使用方法:');
    console.log('1. ブラウザでアプリを開く');
    console.log('2. 馬のデータを入力');
    console.log('3. 「🚀 予測開始」で統計分析実行');
    console.log('4. 「🤖 AI推奨を取得」でClaude統合分析を追加取得');
    if (!hasApiKey) {
        console.log('');
        console.log('🔧 Claude AI利用設定:');
        console.log('• APIキー取得: https://console.anthropic.com/');
        console.log('• 環境変数設定: export ANTHROPIC_API_KEY=your_api_key');
        console.log('• 現在は模擬AI分析で動作中');
    }
});

module.exports = app;