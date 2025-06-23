// 簡素化されたサーバー（Claude Code SDK統合版）
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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

// メインページの配信
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// サーバー起動
app.listen(PORT, () => {
    console.log(`🏇 競馬AI推奨アプリ（Claude Code統合版）が起動しました`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🤖 Claude Code SDK: 統合済み（APIキー不要）`);
    console.log(`🌍 環境: ${process.env.NODE_ENV || 'development'}`);
    console.log('');
    console.log('📖 使用方法:');
    console.log('1. ブラウザでアプリを開く');
    console.log('2. 馬のデータを入力');
    console.log('3. 「🚀 予測開始」で統計分析実行');
    console.log('4. 「🤖 AI推奨を取得」でClaude統合分析を追加取得');
});

module.exports = app;