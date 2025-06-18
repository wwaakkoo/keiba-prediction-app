const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// 静的ファイルの提供
app.use(express.static(__dirname));

// メインページ
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// サーバー起動
app.listen(PORT, '0.0.0.0', () => {
    console.log('🏇 競馬予測アプリが起動しました！');
    console.log('');
    console.log('📱 携帯でのアクセス方法:');
    console.log('1. 同じWiFiに接続してください');
    console.log('2. 以下のURLにアクセスしてください:');
    console.log(`   http://localhost:${PORT}`);
    console.log('');
    console.log('🌐 他のデバイスからアクセスする場合:');
    console.log('1. PCのIPアドレスを確認してください（ipconfig）');
    console.log('2. http://[PCのIPアドレス]:3000 でアクセス');
    console.log('');
    console.log('🛑 サーバーを停止するには Ctrl+C を押してください');
    console.log('');
});

// エラーハンドリング
app.use((err, req, res, next) => {
    console.error('エラーが発生しました:', err);
    res.status(500).send('サーバーエラーが発生しました');
}); 