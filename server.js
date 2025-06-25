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
    
    return `競馬レース分析をお願いします。以下の馬について、統計的分析ではなく、あなたの競馬知識に基づいて推奨を提供してください。

レース情報:
- コース: ${raceInfo?.course || '未設定'}
- 距離: ${raceInfo?.distance || '未設定'}m
- 馬場: ${raceInfo?.trackType || '芝'} (${raceInfo?.trackCondition || '良'})

出走馬データ（前走・2走前の実績を重視して分析してください）:
${horseList}

以下のJSON形式で回答してください:
{
  "analysis": "レース全体の分析（200文字程度）",
  "topPicks": [
    {
      "horse": "馬名",
      "horseNumber": 馬番,
      "reason": "推奨理由（100文字程度）",
      "confidence": "high/medium/low"
    }
  ],
  "bettingStrategy": [
    {
      "type": "単勝/複勝/ワイド",
      "combination": "買い目（例：1番、1-2番）",
      "amount": "推奨金額（例：300-500円）",
      "expectedReturn": "期待リターン（例：1500円前後）",
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