# 競馬予想アプリMCPサーバーセットアップガイド

## 📋 概要

このガイドでは、競馬予想アプリをMCPサーバー化して、Claude Code環境から直接利用できるようにする手順を説明します。

## 🎯 MCPサーバー化の利点

- **統合性**: 複数の分析機能を統一APIで提供
- **利便性**: Claude Code環境での直接利用
- **拡張性**: 新しい機能の追加が容易
- **効率性**: 自然言語での操作が可能

## 🔧 セットアップ手順

### 1. 依存関係の確認

```bash
# 必要なパッケージがインストールされているか確認
npm list @modelcontextprotocol/sdk
```

### 2. MCPサーバーの動作確認

```bash
# テストスクリプトを実行して動作確認
npm run mcp-test
```

### 3. MCPサーバーの起動

```bash
# 開発環境での起動（自動再起動あり）
npm run mcp-dev

# 本番環境での起動
npm run mcp-server
```

### 4. Claude Code環境での設定

Claude Code環境でMCPサーバーを利用するには、以下の設定が必要です：

```json
{
  "mcpServers": {
    "keiba-app": {
      "command": "node",
      "args": ["./mcp-server.js"],
      "cwd": "/path/to/keiba-app-unzipped"
    }
  }
}
```

## 🛠️ 利用可能なツール

### 1. 競馬予想分析 (`horse_race_analysis`)

**機能**: 馬の基本データから勝率・複勝率・期待値を計算

**使用例**:
```javascript
{
  "horses": [
    {
      "name": "サンプル馬",
      "odds": 3.2,
      "jockey": "サンプル騎手",
      "weight": 54,
      "popularity": 1
    }
  ],
  "raceInfo": {
    "distance": 1600,
    "surface": "芝",
    "grade": "G2"
  },
  "analysisType": "standard"
}
```

### 2. ケリー基準資金管理 (`kelly_betting_system`)

**機能**: 最適な賭け金計算とリスク管理

**使用例**:
```javascript
{
  "horses": [
    {
      "name": "馬名",
      "odds": 3.2,
      "winProbability": 0.25
    }
  ],
  "bankroll": 100000,
  "riskLevel": "moderate"
}
```

### 3. 推奨システム (`enhanced_recommendations`)

**機能**: 信頼度別注目馬リストと買い目戦略の生成

**使用例**:
```javascript
{
  "predictions": [
    {
      "horseName": "馬名",
      "winProbability": 0.35,
      "confidence": 0.8,
      "expectedValue": 0.12
    }
  ],
  "strategy": "balanced"
}
```

### 4. パフォーマンス分析 (`performance_analyzer`)

**機能**: 投資パフォーマンスの分析と改善提案

**使用例**:
```javascript
{
  "history": [
    {
      "date": "2024-01-15",
      "betAmount": 2000,
      "payout": 3200,
      "result": "win"
    }
  ],
  "analysisType": "comprehensive"
}
```

### 5. データ管理 (`data_manager`)

**機能**: 学習データの管理とエクスポート/インポート

**使用例**:
```javascript
{
  "operation": "export",
  "format": "json"
}
```

### 6. AI統合分析 (`ai_integrated_analysis`)

**機能**: AI（Claude）を統合した高度な競馬分析

**使用例**:
```javascript
{
  "horses": [
    {
      "name": "馬名",
      "odds": 3.2,
      "jockey": "騎手名"
    }
  ],
  "raceInfo": {
    "distance": 1600,
    "surface": "芝"
  },
  "analysisDepth": "detailed"
}
```

## 📊 出力形式

全てのツールは以下の形式で結果を返します：

```json
{
  "content": [
    {
      "type": "text",
      "text": "人間が読みやすい形式の結果"
    },
    {
      "type": "text", 
      "text": "構造化されたJSONデータ"
    }
  ]
}
```

## 🔧 開発・カスタマイズ

### 新しいツールの追加

1. `mcp-server.js`の`TOOLS`オブジェクトに新しいツール定義を追加
2. 対応するハンドラー関数を実装
3. `mcp-server.config.json`にツール情報を追加

### 既存ツールの拡張

既存の機能を拡張するには、対応するハンドラー関数を修正します。

## 🐛 トラブルシューティング

### 一般的な問題と解決方法

1. **モジュールが見つからないエラー**
   ```bash
   npm install
   ```

2. **ポート競合エラー**
   - 他のプロセスが同じポートを使用していないか確認
   - 別のポートを使用するよう設定を変更

3. **権限エラー**
   ```bash
   chmod +x mcp-server.js
   ```

### ログの確認

```bash
# ログファイルの確認
tail -f mcp-server.log
```

## 🎯 実際の使用シナリオ

### シナリオ1: 基本的な競馬予想

```
Claude Code環境で：
「3頭立てのレースで、1番人気オッズ2.1倍、2番人気オッズ4.3倍、3番人気オッズ8.7倍の馬がいます。それぞれの期待値を計算してください。」
```

### シナリオ2: 資金管理

```
Claude Code環境で：
「10万円の資金で、勝率30%と予想される3.2倍の馬に、ケリー基準でいくら賭けるべきですか？」
```

### シナリオ3: パフォーマンス分析

```
Claude Code環境で：
「過去30回の投資データを分析して、改善点を教えてください。」
```

## 🔮 今後の拡張予定

- [ ] リアルタイムオッズ連携
- [ ] 機械学習モデルの統合
- [ ] 詳細な統計分析機能
- [ ] 外部APIとの連携
- [ ] WebUIダッシュボード

## 📞 サポート

問題が発生した場合は、以下の情報を含めてお問い合わせください：

- エラーメッセージ
- 実行したコマンド
- 環境情報（Node.jsバージョンなど）
- ログファイルの内容

---

**注意**: このMCPサーバーは競馬予想を支援するツールです。投資には十分な注意とリスク管理が必要です。