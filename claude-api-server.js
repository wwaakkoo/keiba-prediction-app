const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// CORS設定
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'file://', '*'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    credentials: true
}));

// JSON解析
app.use(express.json({ limit: '10mb' }));

// 静的ファイル配信
app.use(express.static('.'));

// ルートアクセス
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Claude API プロキシエンドポイント
app.post('/api/claude', async (req, res) => {
    console.log('=== Claude API プロキシ呼び出し開始 ===');
    console.log('Request body:', {
        hasPrompt: !!req.body.prompt,
        hasApiKey: !!req.body.apiKey,
        promptLength: req.body.prompt?.length || 0
    });
    
    try {
        const { prompt, apiKey } = req.body;
        
        // バリデーション
        if (!apiKey || apiKey.trim() === '') {
            console.log('❌ APIキーが未提供');
            return res.status(400).json({ 
                error: 'APIキーが必要です',
                success: false 
            });
        }
        
        if (!prompt || prompt.trim() === '') {
            console.log('❌ プロンプトが未提供');
            return res.status(400).json({ 
                error: 'プロンプトが必要です',
                success: false 
            });
        }

        console.log('✅ バリデーション通過');
        console.log('📤 Claude APIへリクエスト送信中...');
        
        // node-fetchを動的にインポート
        const fetch = (await import('node-fetch')).default;
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 2000,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });
        
        console.log(`📥 Claude API レスポンス: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { message: 'Failed to parse error response' };
            }
            
            console.error('❌ Claude API エラー:', {
                status: response.status,
                statusText: response.statusText,
                error: errorData
            });
            
            return res.status(response.status).json({
                error: `Claude API エラー: ${response.status}`,
                details: errorData,
                success: false
            });
        }
        
        const result = await response.json();
        console.log('✅ Claude API 呼び出し成功');
        console.log('📊 レスポンス情報:', {
            hasContent: !!result.content,
            contentLength: result.content?.[0]?.text?.length || 0,
            usage: result.usage
        });
        
        // 成功レスポンス
        res.json({
            success: true,
            content: result.content[0].text,
            usage: result.usage,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ プロキシサーバーエラー:', error);
        
        // エラーの詳細情報を提供
        let errorMessage = error.message;
        let errorCode = 'PROXY_ERROR';
        
        if (error.code === 'ENOTFOUND') {
            errorMessage = 'インターネット接続を確認してください';
            errorCode = 'NETWORK_ERROR';
        } else if (error.code === 'ECONNRESET') {
            errorMessage = 'Claude APIとの接続が中断されました';
            errorCode = 'CONNECTION_RESET';
        }
        
        res.status(500).json({
            error: 'プロキシサーバーエラー',
            details: errorMessage,
            code: errorCode,
            success: false,
            timestamp: new Date().toISOString()
        });
    }
});

// ヘルスチェックエンドポイント
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Claude API Proxy',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// エラーハンドリング
app.use((err, req, res, next) => {
    console.error('Express エラー:', err);
    res.status(500).json({
        error: 'サーバー内部エラー',
        details: err.message,
        success: false
    });
});

// 404ハンドリング
app.use((req, res) => {
    console.log(`404: ${req.method} ${req.url}`);
    res.status(404).json({
        error: 'エンドポイントが見つかりません',
        path: req.url,
        method: req.method,
        success: false
    });
});

// サーバー起動
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀========================================🚀');
    console.log(`📡 Claude API プロキシサーバー起動完了!`);
    console.log(`🌐 アクセス先: http://localhost:${PORT}`);
    console.log(`📋 Claude API エンドポイント: /api/claude`);
    console.log(`❤️  ヘルスチェック: /api/health`);
    console.log(`📁 静的ファイル配信: 有効`);
    console.log('🚀========================================🚀');
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
    console.log('💤 サーバーを正常終了中...');
    server.close(() => {
        console.log('✅ サーバーが正常終了しました');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n💤 Ctrl+Cでサーバーを終了中...');
    process.exit(0);
});