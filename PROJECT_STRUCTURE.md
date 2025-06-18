# 📁 プロジェクト構造

```
keiba-prediction-app/
├── 📄 index.html              # メインHTMLファイル
├── 📁 styles/
│   └── 📄 main.css            # スタイルシート（レスポンシブ対応）
├── 📁 js/
│   ├── 📄 main.js             # メイン機能（携帯簡易モード等）
│   ├── 📄 horseManager.js     # 馬データ管理
│   ├── 📄 predictionEngine.js # 予測エンジン
│   ├── 📄 learningSystem.js   # 機械学習システム
│   ├── 📄 bettingRecommender.js # 買い目推奨
│   ├── 📄 dataConverter.js    # データ変換機能
│   └── 📄 config.js           # 設定ファイル
├── 📁 .github/
│   └── 📁 workflows/
│       └── 📄 deploy.yml      # GitHub Pages自動デプロイ
├── 📄 README.md               # プロジェクト概要
├── 📄 使い方ガイド.md          # 詳細な使い方
├── 📄 セットアップガイド.md    # セットアップ方法
├── 📄 SECURITY.md             # セキュリティポリシー
├── 📄 sample_data.txt         # サンプルデータ
├── 📄 .gitignore              # Git除外設定
└── 📄 setup-github-pages.bat  # GitHub Pagesセットアップスクリプト
```

## 📋 ファイル説明

### 🌐 Webアプリケーション
- **index.html**: メインのWebページ
- **styles/main.css**: 携帯対応のスタイルシート
- **js/**: JavaScriptモジュール群

### 📚 ドキュメント
- **README.md**: プロジェクト概要とGitHub Pages URL
- **使い方ガイド.md**: 詳細な使用方法
- **セットアップガイド.md**: 簡単なセットアップ手順
- **SECURITY.md**: セキュリティポリシー

### 🔧 開発・デプロイ
- **.github/workflows/deploy.yml**: GitHub Pages自動デプロイ
- **.gitignore**: 除外ファイル設定
- **setup-github-pages.bat**: セットアップ自動化

### 📊 サンプルデータ
- **sample_data.txt**: 軽量なサンプルデータ

## 🎯 特徴

- ✅ **携帯最適化**: レスポンシブデザイン
- ✅ **機械学習**: 継続的な精度向上
- ✅ **GitHub Pages**: 無料で公開
- ✅ **セキュリティ**: 個人情報保護
- ✅ **ドキュメント**: 充実した説明書 