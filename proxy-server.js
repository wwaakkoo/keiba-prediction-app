const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = 3000;

// CORS対応
app.use(cors());
app.use(express.json());

// 静的ファイル配信
app.use(express.static('.'));

// Claude APIプロキシ
app.post('/api/claude', async (req, res) => {
    try {
        console.log('Claude API プロキシ呼び出し開始');
        
        const { prompt, apiKey } = req.body;
        
        if (!apiKey) {
            return res.status(400).json({ error: 'APIキーが必要です' });
        }
        
        if (!prompt) {
            return res.status(400).json({ error: 'プロンプトが必要です' });
        }
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 2000,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Claude API エラー:', response.status, errorData);
            return res.status(response.status).json({
                error: `Claude API エラー: ${response.status}`,
                details: errorData
            });
        }
        
        const result = await response.json();
        console.log('Claude API 呼び出し成功');
        
        res.json({
            success: true,
            content: result.content[0].text,
            usage: result.usage
        });
        
    } catch (error) {
        console.error('プロキシエラー:', error);
        res.status(500).json({
            error: 'プロキシサーバーエラー',
            details: error.message
        });
    }
});

// サーバー起動
app.listen(PORT, () => {
    console.log(`🚀 プロキシサーバーが起動しました: http://localhost:${PORT}`);
    console.log('📋 競馬予測アプリにアクセスしてください');
});