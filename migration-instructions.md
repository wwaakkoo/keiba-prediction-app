# 学習データ移行機能 - 使用説明書

## 概要
既存の学習システム（LearningSystem）から新しい強化学習システム（EnhancedLearningSystem）へのデータ移行機能を実装しました。

## 移行される学習データの内容

### 1. **基本学習データ（LearningSystem）**
- **調整値**: 14個の重み係数（オッズ重み、前走重み、騎手重みなど）
- **履歴データ**: 予測と実際の結果の記録
- **精度統計**: 勝率・複勝率の統計情報
- **脚質学習**: 脚質別の成功・失敗パターン
- **レースレベル学習**: レースレベル別の成功・失敗パターン
- **AI分析学習**: AI推奨の成功・失敗パターン（aiAnalysis）
- **穴馬学習**: 穴馬候補の検出パターン（sleeperAnalysis）

### 2. **買い目推奨履歴（BettingRecommender）**
- 買い目戦略別の成功率
- 券種別的中率
- 期待値追跡データ

### 3. **AI推奨履歴（AIRecommendationService）**
- AI推奨の履歴データ
- 信頼度別成績

## 移行機能の実装内容

### 新規作成ファイル
1. **`/js/learningDataMigration.js`** - 移行メインロジック
2. **`migration-instructions.md`** - この説明書

### 既存ファイルへの追加機能
1. **`/js/enhancedLearningSystem.js`** - 移行データ受け取り機能を追加

## 移行プロセス

### 1. データ取得
- LearningSystemの現在のデータ
- localStorage内の買い目推奨履歴
- localStorage内のAI推奨履歴
- その他のユーザー設定

### 2. データ変換
- 既存の形式からEnhancedLearningSystem形式への変換
- Mapオブジェクトへの適切な変換
- データ整合性の検証

### 3. データインポート
- EnhancedLearningSystemへの統合
- 血統学習データの初期化
- メタ学習データの構築

### 4. 移行レポート
- 移行統計の表示
- データ整合性スコア
- 推奨事項の提示

## HTMLファイルでの使用方法

### ボタンの追加
以下のHTMLを適切な場所に追加してください：

```html
<!-- 学習データ移行セクション -->
<div class="section">
    <h3>🚀 強化学習システムへの移行</h3>
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; padding: 20px; color: white; margin: 15px 0;">
        <h4 style="margin: 0 0 15px 0;">学習データ移行機能</h4>
        <p style="margin: 0 0 15px 0; font-size: 0.9em; opacity: 0.9;">
            既存の学習データを新しい強化学習システムに移行します。<br>
            血統分析・動的学習・メタ学習機能が利用可能になります。
        </p>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button onclick="migrateLearningData()" 
                    style="background: linear-gradient(45deg, #28a745, #20c997); color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                📊 学習データを移行
            </button>
            <button onclick="switchToEnhancedLearningSystem()" 
                    style="background: linear-gradient(45deg, #007bff, #0056b3); color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                🔄 強化学習システム切替
            </button>
            <button onclick="testEnhancedLearningSystem()" 
                    style="background: linear-gradient(45deg, #6f42c1, #5a32a3); color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                🧪 システムテスト
            </button>
        </div>
    </div>
</div>
```

### スクリプトの追加
HTMLファイルの`<head>`セクションまたは既存のスクリプト読み込み部分に追加：

```html
<!-- 学習データ移行機能 -->
<script src="js/learningDataMigration.js"></script>
```

## 使用手順

### 1. 事前準備
- 既存の学習データが蓄積されていることを確認
- コンソールでエラーがないことを確認

### 2. 移行実行
1. **「📊 学習データを移行」ボタンをクリック**
   - 既存データの取得と変換
   - EnhancedLearningSystemへの移行
   - 移行レポートの表示

2. **「🔄 強化学習システム切替」ボタンをクリック**
   - 強化学習システムの初期化
   - 可視化システムの有効化

3. **「🧪 システムテスト」ボタンをクリック**
   - テストデータでの動作確認

### 3. 移行後の確認
- ブラウザのコンソールで移行ログを確認
- 学習統計の表示で移行データを確認
- 新機能（血統分析等）の動作確認

## 移行データの詳細分析

### 変換マッピング

#### 調整値の移行
```javascript
// 旧システム → 新システム
oddsWeight → oddsWeight
lastRaceWeight → lastRaceWeight
jockeyWeight → jockeyWeight
ageWeight → ageWeight
// + 新追加: pedigreeWeight (1.0で初期化)
```

#### 成功パターンの移行
```javascript
// 旧: runningStyleSuccess/Failure → 新: successPatterns.runningStyle
// 旧: raceLevelSuccess/Failure → 新: successPatterns.raceLevel
// 新規: pedigree, dynamicPedigree, aptitude, combinations
```

### データ整合性チェック
- 基本学習データの存在確認
- 調整値の妥当性検証
- 履歴データの存在確認
- 精度データの論理チェック

## トラブルシューティング

### よくあるエラー
1. **「学習データが見つかりません」**
   - まず既存システムで予測とレース結果入力を行う

2. **「移行に失敗しました」**
   - ブラウザのコンソールでエラー詳細を確認
   - LocalStorageの容量制限を確認

3. **「EnhancedLearningSystemが読み込まれていません」**
   - HTMLファイルでenhancedLearningSystem.jsの読み込みを確認

### デバッグ方法
```javascript
// コンソールで実行可能なデバッグコマンド
console.log('既存学習データ:', LearningSystem.getLearningData());
console.log('移行システム確認:', typeof LearningDataMigration !== 'undefined');
console.log('強化学習システム確認:', typeof EnhancedLearningSystem !== 'undefined');
```

## 安全性とバックアップ

### データ保護
- 移行前のデータは自動的に保持
- 移行は追加処理のため既存データは削除されない
- エラー時は既存システムでの動作が継続可能

### バックアップ推奨
移行前にDataManagerのエクスポート機能でバックアップを作成することを推奨：
```javascript
DataManager.exportLearningData();
```

## 新機能の活用

### 強化学習システムの特徴
1. **血統学習**: 種牡馬・繁殖牝馬別成績追跡
2. **動的学習**: レース条件に応じた適応的学習
3. **メタ学習**: 学習効果の追跡と最適化
4. **複合パターン**: 多要因組み合わせの学習
5. **可視化**: 学習進捗のグラフ表示

### 活用のポイント
- 移行後は新しい分析機能を段階的に活用
- 血統データの充実により精度向上が期待
- メタ学習により過学習の抑制と最適化

---

**実装完了**: 2025年7月4日
**対応バージョン**: LearningSystem v1.0 → EnhancedLearningSystem v2.0