// 的中判定基準システム
class HitCriteriaSystem {
    // 的中判定基準の定義
    static hitCriteria = {
        // 単勝的中: 1位予想と実際の1位が一致
        win: {
            name: '単勝的中',
            description: '1位予想馬が実際に1着になった場合',
            judge: (predictions, actual) => {
                const topPrediction = predictions[0]; // 1位予想
                return topPrediction && topPrediction.name === actual.first;
            }
        },
        
        // 複勝的中: 上位3位予想のうち1頭が3着以内
        place: {
            name: '複勝的中',
            description: '上位3位予想のうち1頭が3着以内に入った場合',
            judge: (predictions, actual) => {
                const top3Predictions = predictions.slice(0, 3);
                const actualTop3 = [actual.first, actual.second, actual.third];
                return top3Predictions.some(pred => 
                    actualTop3.includes(pred.name)
                );
            }
        },
        
        // 推奨群的中: 推奨した全ての馬のうち1頭が3着以内
        recommended: {
            name: '推奨群的中',
            description: '推奨した馬群のうち1頭が3着以内に入った場合',
            judge: (predictions, actual) => {
                const recommendedHorses = predictions.filter(p => p.isRecommended);
                const actualTop3 = [actual.first, actual.second, actual.third];
                return recommendedHorses.some(pred => 
                    actualTop3.includes(pred.name)
                );
            }
        },
        
        // 1位的中: 1位予想が実際に1着
        first: {
            name: '1位的中',
            description: '1位予想馬が実際に1着になった場合',
            judge: (predictions, actual) => {
                return predictions[0] && predictions[0].name === actual.first;
            }
        },
        
        // 上位2位的中: 上位2位予想のうち1頭が2着以内
        top2: {
            name: '上位2位的中',
            description: '上位2位予想のうち1頭が2着以内に入った場合',
            judge: (predictions, actual) => {
                const top2Predictions = predictions.slice(0, 2);
                const actualTop2 = [actual.first, actual.second];
                return top2Predictions.some(pred => 
                    actualTop2.includes(pred.name)
                );
            }
        }
    };
    
    // 現在の的中判定基準設定
    static currentCriteria = 'place'; // デフォルトは複勝的中
    
    // 的中判定基準を設定
    static setCriteria(criteriaName) {
        if (this.hitCriteria[criteriaName]) {
            this.currentCriteria = criteriaName;
            this.saveCriteria();
            return true;
        }
        return false;
    }
    
    // 的中判定を実行
    static judgeHit(predictions, actual) {
        const criteria = this.hitCriteria[this.currentCriteria];
        if (!criteria) return false;
        
        return criteria.judge(predictions, actual);
    }
    
    // 的中判定結果の詳細取得
    static getHitDetails(predictions, actual) {
        const results = {};
        
        Object.entries(this.hitCriteria).forEach(([key, criteria]) => {
            results[key] = {
                name: criteria.name,
                description: criteria.description,
                hit: criteria.judge(predictions, actual)
            };
        });
        
        return results;
    }
    
    // 現在の基準名を取得
    static getCurrentCriteriaName() {
        return this.hitCriteria[this.currentCriteria]?.name || '未設定';
    }
    
    // 基準情報を保存
    static saveCriteria() {
        try {
            localStorage.setItem('hitCriteria', JSON.stringify({
                current: this.currentCriteria,
                lastUpdated: new Date().toISOString()
            }));
        } catch (error) {
            console.error('的中判定基準保存エラー:', error);
        }
    }
    
    // 基準情報を読み込み
    static loadCriteria() {
        try {
            const saved = localStorage.getItem('hitCriteria');
            if (saved) {
                const data = JSON.parse(saved);
                if (this.hitCriteria[data.current]) {
                    this.currentCriteria = data.current;
                }
            }
        } catch (error) {
            console.error('的中判定基準読み込みエラー:', error);
        }
    }
    
    // 基準別の期待的中率を計算
    static calculateExpectedHitRates(predictions) {
        const rates = {};
        
        // 統計的な期待値（現実的なデータに基づく）
        rates.win = 6.5; // 単勝1位的中率（現実的に調整）
        rates.place = 22.0; // 複勝上位3位的中率（現実的に調整）
        rates.recommended = 25.0; // 推奨群的中率（推奨数による）
        rates.first = 6.5; // 1位的中率
        rates.top2 = 14.0; // 上位2位的中率（現実的に調整）
        
        // 予測信頼度による調整
        const avgConfidence = predictions.reduce((sum, p) => sum + (p.confidence || 0.5), 0) / predictions.length;
        const confidenceMultiplier = 0.5 + (avgConfidence * 1.0);
        
        Object.keys(rates).forEach(key => {
            rates[key] = Math.round(rates[key] * confidenceMultiplier * 10) / 10;
        });
        
        return rates;
    }
    
    // 基準別の期待配当率を計算
    static calculateExpectedPayouts(predictions) {
        const payouts = {};
        
        // 統計的な期待配当率（実際のデータに基づく）現実的な値に修正
        const avgOdds = predictions.reduce((sum, p) => sum + (parseFloat(p.odds) || 5.0), 0) / predictions.length;
        
        // 配当率を現実的な範囲に調整（100%ベース）
        payouts.win = Math.round(avgOdds * 95); // 単勝配当（オッズ×95%）
        payouts.place = Math.round(avgOdds * 35); // 複勝配当（オッズ×35%）
        payouts.recommended = Math.round(avgOdds * 60); // 推奨群配当（オッズ×60%）
        payouts.first = Math.round(avgOdds * 95); // 1位配当（オッズ×95%）
        payouts.top2 = Math.round(avgOdds * 70); // 上位2位配当（オッズ×70%）
        
        return payouts;
    }
    
    // 基準別の期待ROI計算（修正版）
    static calculateExpectedROI(predictions) {
        const hitRates = this.calculateExpectedHitRates(predictions);
        const roi = {};
        
        // 平均オッズ計算
        const avgOdds = predictions.reduce((sum, p) => sum + (parseFloat(p.odds) || 5.0), 0) / predictions.length;
        
        Object.keys(hitRates).forEach(key => {
            const hitRate = hitRates[key] / 100; // %を小数に変換
            
            // 基準別の期待オッズ設定（現実的な複勝配当に修正）
            let expectedOdds;
            switch(key) {
                case 'win':
                case 'first':
                    expectedOdds = avgOdds * 0.85; // 単勝系は85%（控除率考慮）
                    break;
                case 'place':
                    // 複勝は実際の配当レンジ1.1-3.0倍を想定
                    expectedOdds = Math.min(3.0, Math.max(1.2, avgOdds * 0.15)); 
                    break;
                case 'recommended':
                    expectedOdds = avgOdds * 0.4; // 推奨群は40%
                    break;
                case 'top2':
                    expectedOdds = avgOdds * 0.5; // 上位2位は50%
                    break;
                default:
                    expectedOdds = avgOdds * 0.3;
            }
            
            // ROI = (的中率 × 期待オッズ - 1) × 100
            roi[key] = Math.round((hitRate * expectedOdds - 1) * 100 * 10) / 10;
        });
        
        return roi;
    }
    
    // 初期化
    static initialize() {
        this.loadCriteria();
        console.log(`的中判定基準システム初期化完了: ${this.getCurrentCriteriaName()}`);
    }
}

// グローバル公開
window.HitCriteriaSystem = HitCriteriaSystem;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    HitCriteriaSystem.initialize();
});