// レース分析エンジン - レースレベル・展開・脚質分析
class RaceAnalysisEngine {
    
    // レースレベル分析システム
    static getRaceLevelScore(raceLevel) {
        const levelScores = {
            'G1': 100,      // 最高峰
            'G2': 85,       // 高レベル
            'G3': 70,       // 重賞
            'L': 60,        // Listed
            'OP': 50,       // オープン特別
            '3勝': 40,      // 1600万下
            '2勝': 30,      // 1000万下
            '1勝': 20,      // 500万下
            '未勝利': 10,   // 未勝利戦
            '新馬': 5       // 新馬戦
        };
        
        return levelScores[raceLevel] || 20; // デフォルトは1勝クラス相当
    }
    
    // クラス昇級・降級の影響を分析
    static analyzeClassProgression(currentLevel, lastRaceLevel) {
        if (!lastRaceLevel || !currentLevel) {
            return { 
                progression: 'unknown', 
                impact: 0, 
                description: 'レースレベル情報不足' 
            };
        }
        
        const currentScore = this.getRaceLevelScore(currentLevel);
        const lastScore = this.getRaceLevelScore(lastRaceLevel);
        const diff = currentScore - lastScore;
        
        let progression, impact, description;
        
        if (diff > 20) {
            progression = 'major_upgrade';
            impact = -15; // 大幅昇級はマイナス影響
            description = `大幅昇級（${lastRaceLevel}→${currentLevel}）`;
        } else if (diff > 0) {
            progression = 'upgrade';
            impact = -8; // 昇級はマイナス影響
            description = `昇級（${lastRaceLevel}→${currentLevel}）`;
        } else if (diff < -20) {
            progression = 'major_downgrade';
            impact = 12; // 大幅降級はプラス影響
            description = `大幅降級（${lastRaceLevel}→${currentLevel}）`;
        } else if (diff < 0) {
            progression = 'downgrade';
            impact = 6; // 降級はプラス影響
            description = `降級（${lastRaceLevel}→${currentLevel}）`;
        } else {
            progression = 'same';
            impact = 0;
            description = `同じレベル（${currentLevel}）`;
        }
        
        return { progression, impact, description };
    }
    
    // 過去5走のレースレベル履歴分析
    static analyzeRaceLevelHistory(horse) {
        const raceLevels = [
            horse.lastRaceLevel,
            horse.secondLastRaceLevel,
            horse.thirdLastRaceLevel,
            horse.fourthLastRaceLevel,
            horse.fifthLastRaceLevel
        ].filter(level => level); // 空の値を除外
        
        if (raceLevels.length === 0) {
            return {
                averageLevel: 20,
                levelConsistency: 'unknown',
                recentTrend: 'unknown',
                analysis: 'レースレベル履歴データ不足'
            };
        }
        
        // 平均レベル計算
        const levelScores = raceLevels.map(level => this.getRaceLevelScore(level));
        const averageLevel = levelScores.reduce((sum, score) => sum + score, 0) / levelScores.length;
        
        // レベル一貫性評価
        const levelVariance = this.calculateVariance(levelScores);
        let levelConsistency;
        if (levelVariance < 100) {
            levelConsistency = 'high'; // 安定
        } else if (levelVariance < 400) {
            levelConsistency = 'medium'; // 普通
        } else {
            levelConsistency = 'low'; // 不安定
        }
        
        // 最近のトレンド分析（直近3走）
        const recentLevels = levelScores.slice(0, 3);
        let recentTrend = 'stable';
        if (recentLevels.length >= 2) {
            const trendSlope = (recentLevels[0] - recentLevels[recentLevels.length - 1]) / (recentLevels.length - 1);
            if (trendSlope > 5) {
                recentTrend = 'improving'; // レベルアップ傾向
            } else if (trendSlope < -5) {
                recentTrend = 'declining'; // レベルダウン傾向
            }
        }
        
        const analysis = `平均レベル: ${averageLevel.toFixed(1)}, 一貫性: ${levelConsistency}, 傾向: ${recentTrend}`;
        
        return {
            averageLevel,
            levelConsistency,
            recentTrend,
            raceLevels,
            analysis
        };
    }
    
    // 展開・脚質分析（将来実装のプレースホルダー）
    static analyzeRunningStyle(horse) {
        // TODO: 次の実装で脚質分析を追加
        return {
            style: 'unknown',
            effectiveness: 0,
            description: '脚質分析は次回実装予定'
        };
    }
    
    // タイム指数計算（将来実装のプレースホルダー）
    static calculateTimeIndex(raceTime, distance, trackCondition) {
        // TODO: 次の実装でタイム指数計算を追加
        return {
            timeIndex: 0,
            description: 'タイム指数は次回実装予定'
        };
    }
    
    // 統計ユーティリティ関数
    static calculateVariance(numbers) {
        if (numbers.length === 0) return 0;
        const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
        const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
        return squaredDiffs.reduce((sum, sqDiff) => sum + sqDiff, 0) / numbers.length;
    }
    
    // 包括的なレース分析レポート生成
    static generateRaceAnalysisReport(horse, currentRaceLevel) {
        const classProgression = this.analyzeClassProgression(currentRaceLevel, horse.lastRaceLevel);
        const levelHistory = this.analyzeRaceLevelHistory(horse);
        const runningStyle = this.analyzeRunningStyle(horse);
        
        return {
            horseName: horse.name || '不明',
            classProgression,
            levelHistory,
            runningStyle,
            overallScore: this.calculateOverallAnalysisScore(classProgression, levelHistory),
            recommendations: this.generateRecommendations(classProgression, levelHistory)
        };
    }
    
    // 総合分析スコア計算
    static calculateOverallAnalysisScore(classProgression, levelHistory) {
        let score = 0;
        
        // クラス昇降級の影響
        score += classProgression.impact;
        
        // レベル履歴の影響
        if (levelHistory.levelConsistency === 'high') score += 5;
        if (levelHistory.recentTrend === 'improving') score += 8;
        if (levelHistory.recentTrend === 'declining') score -= 5;
        
        return Math.max(0, Math.min(100, 50 + score)); // 0-100の範囲に正規化
    }
    
    // 推奨事項生成
    static generateRecommendations(classProgression, levelHistory) {
        const recommendations = [];
        
        if (classProgression.progression === 'major_upgrade') {
            recommendations.push('大幅昇級のため慎重に評価');
        } else if (classProgression.progression === 'major_downgrade') {
            recommendations.push('大幅降級で狙い目の可能性');
        }
        
        if (levelHistory.levelConsistency === 'high') {
            recommendations.push('レベル一貫性が高く安定感あり');
        }
        
        if (levelHistory.recentTrend === 'improving') {
            recommendations.push('最近レベルアップ傾向で注目');
        }
        
        return recommendations.length > 0 ? recommendations : ['標準的な評価'];
    }
}

// レース分析エンジンを予測エンジンに統合するユーティリティ
class RaceAnalysisIntegrator {
    
    // 予測エンジンにレース分析スコアを追加
    static enhancePredictionWithRaceAnalysis(horse, currentRaceLevel) {
        const analysis = RaceAnalysisEngine.generateRaceAnalysisReport(horse, currentRaceLevel);
        
        // 予測スコアに分析結果を反映
        const analysisBonus = this.convertAnalysisToScore(analysis);
        
        return {
            originalScore: horse.score || 0,
            raceAnalysisBonus: analysisBonus,
            enhancedScore: (horse.score || 0) + analysisBonus,
            raceAnalysis: analysis
        };
    }
    
    // 分析結果をスコアに変換
    static convertAnalysisToScore(analysis) {
        let bonus = 0;
        
        // クラス昇降級の影響
        bonus += analysis.classProgression.impact;
        
        // レベル履歴品質ボーナス
        if (analysis.levelHistory.averageLevel > 60) bonus += 5; // 高レベル経験
        if (analysis.levelHistory.levelConsistency === 'high') bonus += 3;
        if (analysis.levelHistory.recentTrend === 'improving') bonus += 5;
        
        return Math.max(-20, Math.min(20, bonus)); // ±20点の範囲で制限
    }
}