# 実装時の詳細ノート

## 🔧 具体的な実装箇所と修正方法

### 1. AI API統合の実装

#### 修正対象ファイル: `js/aiRecommendationService.js`

**現在の問題箇所（30-40行目付近）:**
```javascript
// 現在は模擬実装
async generateRecommendation(analysisData) {
    // Claude Code環境内でのAI分析を模擬
    // 実際の環境では、この部分がClaude Codeセッションと統合されます
    const recommendation = await this.generateRecommendation(analysisData);
}
```

**実装すべき内容:**
```javascript
async generateRecommendation(analysisData) {
    try {
        const apiKey = this.getAPIKey();
        if (!apiKey) {
            throw new Error('APIキーが設定されていません');
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
                max_tokens: 1000,
                messages: [{
                    role: 'user',
                    content: this.generatePrompt(analysisData)
                }]
            })
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        return this.parseAIResponse(data.content[0].text);
        
    } catch (error) {
        console.error('AI API呼び出しエラー:', error);
        // フォールバック: 模擬AI分析
        return this.generateFallbackRecommendation(analysisData);
    }
}
```

---

### 2. エラーハンドリング強化

#### 修正対象ファイル: `js/dataConverter.js`

**問題箇所1: データ変換エラー処理**
```javascript
// 現在の問題のあるコード
static parseNetkeibaData(rawData) {
    try {
        const lines = rawData.split('\n').filter(line => line.trim());
        // データ処理...
    } catch (error) {
        console.error('データ解析エラー:', error);
        return { raceInfo: null, horses: [] }; // 空データ返却のみ
    }
}
```

**改善版:**
```javascript
static parseNetkeibaData(rawData) {
    try {
        const lines = rawData.split('\n').filter(line => line.trim());
        const result = { raceInfo: null, horses: [] };
        
        // メイン処理
        result.raceInfo = this.extractNetkeibaRaceInfo(lines);
        result.horses = this.extractHorsesWithValidation(lines);
        
        // データ検証
        this.validateExtractedData(result);
        
        return result;
        
    } catch (error) {
        console.error('データ解析エラー:', error);
        
        // 段階的復旧処理
        try {
            return this.attemptPartialRecovery(rawData);
        } catch (recoveryError) {
            // 最終的にユーザーに分かりやすいエラー表示
            showMessage('データ形式を確認してください。netkeiba形式のデータが必要です。', 'error');
            return this.getEmptyDataStructure();
        }
    }
}

// 新規追加メソッド
static validateExtractedData(data) {
    // オッズ検証
    data.horses.forEach(horse => {
        if (horse.odds <= 0 || horse.odds > 999) {
            console.warn(`異常オッズ検出: ${horse.name} - ${horse.odds}倍`);
            horse.odds = 10; // デフォルト値設定
        }
    });
    
    // その他の検証...
}

static attemptPartialRecovery(rawData) {
    // 部分的データ復旧ロジック
    // 最低限の馬名とオッズだけでも抽出を試行
}
```

---

### 3. データ検証機能の実装

#### 追加ファイル: `js/dataValidator.js`（新規作成）

```javascript
// データ検証専用クラス
class DataValidator {
    // オッズ検証
    static validateOdds(odds, horseName) {
        const numOdds = parseFloat(odds);
        
        if (isNaN(numOdds)) {
            console.warn(`${horseName}: オッズが数値ではありません - ${odds}`);
            return { valid: false, corrected: 10.0, warning: 'オッズを10.0に修正しました' };
        }
        
        if (numOdds <= 0) {
            console.warn(`${horseName}: オッズが0以下です - ${numOdds}`);
            return { valid: false, corrected: 1.1, warning: 'オッズを1.1に修正しました' };
        }
        
        if (numOdds > 999) {
            console.warn(`${horseName}: オッズが異常に高いです - ${numOdds}`);
            return { valid: false, corrected: 999.0, warning: 'オッズを999.0に修正しました' };
        }
        
        return { valid: true, corrected: numOdds, warning: null };
    }
    
    // タイム検証
    static validateTime(timeString, distance) {
        if (!timeString || !timeString.includes(':')) {
            return { valid: false, warning: 'タイム形式が不正です' };
        }
        
        const [minutes, seconds] = timeString.split(':').map(parseFloat);
        const totalSeconds = minutes * 60 + seconds;
        
        // 物理的限界チェック（距離別）
        const limits = {
            1000: { min: 50, max: 80 },   // 1000m: 50-80秒
            1600: { min: 90, max: 120 },  // 1600m: 1:30-2:00
            2000: { min: 110, max: 140 }, // 2000m: 1:50-2:20
            2400: { min: 140, max: 180 }  // 2400m: 2:20-3:00
        };
        
        const limit = limits[distance] || { min: 60, max: 300 };
        
        if (totalSeconds < limit.min || totalSeconds > limit.max) {
            return { 
                valid: false, 
                warning: `${distance}mの記録として異常です: ${timeString}` 
            };
        }
        
        return { valid: true, warning: null };
    }
    
    // 総合データ整合性チェック
    static validateRaceData(raceData) {
        const warnings = [];
        
        // 馬数チェック
        if (raceData.horses.length < 2) {
            warnings.push('出走馬数が少なすぎます（2頭未満）');
        }
        
        if (raceData.horses.length > 18) {
            warnings.push('出走馬数が多すぎます（18頭超）');
        }
        
        // 人気と馬数の整合性
        const popularityNumbers = raceData.horses
            .map(h => parseInt(h.popularity))
            .filter(p => !isNaN(p));
            
        const maxPopularity = Math.max(...popularityNumbers);
        if (maxPopularity > raceData.horses.length) {
            warnings.push('人気番号が出走馬数を超えています');
        }
        
        return warnings;
    }
}
```

---

### 4. ペース分析機能の実装

#### 修正対象ファイル: `js/raceAnalysisEngine.js`

**追加すべきクラス:**
```javascript
// PaceAnalyzer クラスを RaceAnalysisEngine に追加
class PaceAnalyzer {
    // ラップタイム分析
    static analyzeLapTimes(raceData) {
        if (!raceData.lapTimes || raceData.lapTimes.length === 0) {
            return { analysis: 'ラップタイムデータなし', paceType: '不明' };
        }
        
        const laps = raceData.lapTimes.map(parseFloat).filter(t => !isNaN(t));
        if (laps.length < 3) {
            return { analysis: 'ラップタイムデータ不足', paceType: '不明' };
        }
        
        // ペースタイプ判定
        const frontHalf = laps.slice(0, Math.floor(laps.length / 2));
        const backHalf = laps.slice(Math.floor(laps.length / 2));
        
        const frontAvg = frontHalf.reduce((sum, t) => sum + t, 0) / frontHalf.length;
        const backAvg = backHalf.reduce((sum, t) => sum + t, 0) / backHalf.length;
        
        let paceType;
        if (frontAvg - backAvg > 1.0) {
            paceType = 'ハイペース';
        } else if (backAvg - frontAvg > 1.0) {
            paceType = 'スローペース';
        } else {
            paceType = '平均ペース';
        }
        
        return {
            analysis: `前半${frontAvg.toFixed(1)}秒 後半${backAvg.toFixed(1)}秒`,
            paceType: paceType,
            frontAverage: frontAvg,
            backAverage: backAvg,
            lapTimes: laps
        };
    }
    
    // セクション別影響度計算
    static calculateSectionImpact(horseData, paceData) {
        if (!paceData || paceData.paceType === '不明') {
            return { impact: 0, reasoning: 'ペースデータ不足' };
        }
        
        let impact = 0;
        let reasoning = '';
        
        // 脚質とペースの適性マッチング
        const runningStyle = horseData.runningStyle || '';
        
        switch (paceData.paceType) {
            case 'ハイペース':
                if (runningStyle.includes('差し') || runningStyle.includes('追込')) {
                    impact = +15;
                    reasoning = 'ハイペースで後方脚質が有利';
                } else if (runningStyle.includes('逃げ') || runningStyle.includes('先行')) {
                    impact = -10;
                    reasoning = 'ハイペースで前脚質が不利';
                }
                break;
                
            case 'スローペース':
                if (runningStyle.includes('逃げ') || runningStyle.includes('先行')) {
                    impact = +10;
                    reasoning = 'スローペースで前脚質が有利';
                } else if (runningStyle.includes('差し') || runningStyle.includes('追込')) {
                    impact = -8;
                    reasoning = 'スローペースで後方脚質が不利';
                }
                break;
                
            default:
                impact = 0;
                reasoning = '平均ペースで脚質影響軽微';
        }
        
        return { impact, reasoning };
    }
}

// RaceAnalysisEngine に統合
class RaceAnalysisEngine {
    // 既存メソッドに追加
    static enhancePredictionWithPaceAnalysis(horse, raceData) {
        const paceData = PaceAnalyzer.analyzeLapTimes(raceData);
        const sectionImpact = PaceAnalyzer.calculateSectionImpact(horse, paceData);
        
        return {
            paceAnalysis: paceData,
            paceBonus: sectionImpact.impact,
            paceReasoning: sectionImpact.reasoning
        };
    }
}
```

---

### 5. NaN処理の修正

#### 全ファイル共通の修正パターン

**問題のあるコード:**
```javascript
const odds = parseFloat(horse.odds) || 10;
const age = parseInt(horse.age) || 5;
```

**修正版:**
```javascript
// 数値バリデーション関数
function parseFloatSafe(value, defaultValue, min = null, max = null) {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return defaultValue;
    if (min !== null && parsed < min) return defaultValue;
    if (max !== null && parsed > max) return defaultValue;
    return parsed;
}

function parseIntSafe(value, defaultValue, min = null, max = null) {
    const parsed = parseInt(value);
    if (isNaN(parsed)) return defaultValue;
    if (min !== null && parsed < min) return defaultValue;
    if (max !== null && parsed > max) return defaultValue;
    return parsed;
}

// 使用例
const odds = parseFloatSafe(horse.odds, 10, 1.0, 999.0);
const age = parseIntSafe(horse.age, 5, 2, 10);
```

---

### 6. LocalStorage容量対策

#### 修正対象ファイル: `js/learningSystem.js`

**追加すべきメソッド:**
```javascript
class LearningSystem {
    // 学習データサイズ管理
    static manageLearningDataSize() {
        try {
            const currentData = JSON.stringify(this.learningData);
            const sizeKB = new Blob([currentData]).size / 1024;
            
            console.log(`学習データサイズ: ${sizeKB.toFixed(1)}KB`);
            
            // 1MB超過時の古いデータ削除
            if (sizeKB > 1024) {
                this.compressLearningData();
            }
            
        } catch (error) {
            console.error('データサイズ管理エラー:', error);
        }
    }
    
    // データ圧縮（古いデータ削除）
    static compressLearningData() {
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - 6); // 6ヶ月前以前を削除
        
        if (this.learningData.raceHistory) {
            this.learningData.raceHistory = this.learningData.raceHistory.filter(
                race => new Date(race.date) > cutoffDate
            );
        }
        
        // AI学習データも同様に圧縮
        if (this.learningData.aiLearningData && this.learningData.aiLearningData.recommendations) {
            this.learningData.aiLearningData.recommendations = 
                this.learningData.aiLearningData.recommendations.slice(-100); // 最新100件のみ保持
        }
        
        this.saveLearningData();
        console.log('学習データを圧縮しました');
    }
}
```

---

## 🔄 実装時のワークフロー

### 1. 実装前の準備
1. 該当ファイルのバックアップ作成
2. 現在の動作確認
3. テストデータの準備

### 2. 実装中
1. 小さな単位での段階的実装
2. 各段階での動作確認
3. エラーハンドリングの同時実装

### 3. 実装後
1. 全機能の動作確認
2. パフォーマンステスト
3. 既存データとの互換性確認
4. ドキュメント更新

## 📋 テスト項目チェックリスト

### 機能テスト
- [ ] 正常なデータでの動作確認
- [ ] 異常なデータでのエラーハンドリング確認
- [ ] エッジケース（空データ、極端な値）での動作確認

### パフォーマンステスト
- [ ] 大量データでの処理速度確認
- [ ] メモリ使用量の確認
- [ ] LocalStorage使用量の確認

### 互換性テスト
- [ ] 既存の学習データとの互換性
- [ ] 複数ブラウザでの動作確認
- [ ] モバイルデバイスでの動作確認

**最終更新**: 2025-06-27