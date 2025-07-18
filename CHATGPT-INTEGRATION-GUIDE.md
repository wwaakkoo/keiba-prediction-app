# ChatGPT統合ガイド

## 🤖 ChatGPTで競馬予想アプリを使う方法

### 🎯 概要

MCPサーバーの機能をHTTP APIとして公開し、ChatGPTから利用できるようにします。

### 🚀 セットアップ手順

#### 1. HTTP APIサーバーの起動

```bash
# HTTP APIサーバーを起動
npm run api-server

# 開発環境での起動（自動再起動）
npm run api-dev
```

#### 2. APIの動作確認

```bash
# ヘルスチェック
curl http://localhost:3001/api/health

# 利用可能API一覧
curl http://localhost:3001/api/endpoints
```

### 📊 ChatGPTでの使用例

#### 1. 競馬予想分析

**ChatGPTでの質問例:**
```
以下のAPIを使って競馬予想分析を実行してください：

エンドポイント: POST http://localhost:3001/api/horse-race-analysis

リクエストボディ:
{
  "horses": [
    {
      "name": "サンプルホース1",
      "odds": 2.1,
      "jockey": "武豊",
      "popularity": 1
    },
    {
      "name": "サンプルホース2",
      "odds": 4.3,
      "jockey": "藤田伸二",
      "popularity": 2
    }
  ],
  "raceInfo": {
    "distance": 1600,
    "surface": "芝",
    "grade": "G1"
  },
  "analysisType": "standard"
}
```

#### 2. ケリー基準資金管理

**ChatGPTでの質問例:**
```
以下のAPIを使ってケリー基準計算を実行してください：

エンドポイント: POST http://localhost:3001/api/kelly-betting

リクエストボディ:
{
  "horses": [
    {
      "name": "サンプルホース1",
      "odds": 3.2,
      "winProbability": 0.30
    }
  ],
  "bankroll": 100000,
  "riskLevel": "moderate"
}
```

#### 3. 推奨システム

**ChatGPTでの質問例:**
```
以下のAPIを使って推奨システムを実行してください：

エンドポイント: POST http://localhost:3001/api/recommendations

リクエストボディ:
{
  "predictions": [
    {
      "horseName": "サンプルホース1",
      "winProbability": 0.35,
      "confidence": 0.8,
      "expectedValue": 0.12
    }
  ],
  "strategy": "balanced"
}
```

#### 4. パフォーマンス分析

**ChatGPTでの質問例:**
```
以下のAPIを使ってパフォーマンス分析を実行してください：

エンドポイント: POST http://localhost:3001/api/performance-analysis

リクエストボディ:
{
  "history": [
    {
      "date": "2024-01-15",
      "betAmount": 2000,
      "payout": 3200,
      "result": "win"
    },
    {
      "date": "2024-01-16",
      "betAmount": 1500,
      "payout": 0,
      "result": "loss"
    }
  ],
  "analysisType": "comprehensive"
}
```

### 🔧 ChatGPTでのCode Interpreter利用

ChatGPTのCode Interpreterを使用して、APIを呼び出すPythonコードを実行できます：

```python
import requests
import json

# 競馬予想分析API呼び出し
def analyze_race(horses, race_info=None, analysis_type="standard"):
    url = "http://localhost:3001/api/horse-race-analysis"
    
    data = {
        "horses": horses,
        "raceInfo": race_info,
        "analysisType": analysis_type
    }
    
    try:
        response = requests.post(url, json=data)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"API呼び出しエラー: {e}")
        return None

# 使用例
horses = [
    {"name": "サンプルホース1", "odds": 2.1, "jockey": "武豊", "popularity": 1},
    {"name": "サンプルホース2", "odds": 4.3, "jockey": "藤田伸二", "popularity": 2}
]

race_info = {
    "distance": 1600,
    "surface": "芝",
    "grade": "G1"
}

result = analyze_race(horses, race_info)
if result:
    print(json.dumps(result, indent=2, ensure_ascii=False))
```

### 🌐 他のAIサービスとの連携

#### 1. **OpenAI API経由での利用**

```javascript
// OpenAI APIを使用してChatGPTから競馬予想APIを呼び出す
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    {
      role: "system",
      content: "あなたは競馬予想APIを使用できます。http://localhost:3001/api/* のエンドポイントを使用してください。"
    },
    {
      role: "user",
      content: "オッズ2.1倍の馬を分析してください"
    }
  ],
  functions: [
    {
      name: "analyze_horse_race",
      description: "競馬予想分析を実行",
      parameters: {
        type: "object",
        properties: {
          horses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                odds: { type: "number" }
              }
            }
          }
        }
      }
    }
  ]
});
```

#### 2. **Claude API経由での利用**

```javascript
// Claude APIを使用して競馬予想APIを呼び出す
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const response = await anthropic.messages.create({
  model: "claude-3-sonnet-20240229",
  max_tokens: 1000,
  tools: [
    {
      name: "horse_race_analysis",
      description: "競馬予想分析API",
      input_schema: {
        type: "object",
        properties: {
          horses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                odds: { type: "number" }
              }
            }
          }
        }
      }
    }
  ],
  messages: [
    {
      role: "user",
      content: "オッズ2.1倍の馬を分析してください"
    }
  ]
});
```

### 🔐 セキュリティ考慮事項

#### 1. **アクセス制御**
- APIキーによる認証
- IP制限
- レート制限

#### 2. **CORS設定**
- 必要に応じてCORS設定を調整
- 信頼できるオリジンのみ許可

#### 3. **入力検証**
- リクエストデータの検証
- SQLインジェクション対策

### 🎯 利用シーン

1. **ChatGPTでの対話的分析**
   - 自然言語で質問
   - APIを自動呼び出し
   - 結果の解釈・説明

2. **他のAIサービスとの統合**
   - OpenAI API
   - Claude API
   - Google AI

3. **Webアプリケーションとの連携**
   - React/Vue.js
   - フロントエンドから直接呼び出し

### 🚀 今後の拡張

- [ ] WebSocket対応（リアルタイム通信）
- [ ] GraphQL API
- [ ] gRPC対応
- [ ] Docker化
- [ ] クラウドデプロイ

これで、ChatGPTや他のAIサービスから競馬予想アプリの機能を利用できるようになります！