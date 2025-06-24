// ハイブリッド学習システム - 時期別重み付け学習
class HybridLearningSystem {
    static learningData = {
        recentData: [],      // 直近3ヶ月のデータ
        seasonalData: [],    // 同時期の過去データ
        mixedData: [],       // その他の参考データ
        accuracy: {
            overall: 0,
            seasonal: 0,
            recent: 0,
            hybrid: 0
        },
        lastUpdated: null
    };

    // データの時期分類
    static classifyDataByTime(raceData) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        return raceData.map(race => {
            const raceDate = new Date(race.date);
            const raceMonth = raceDate.getMonth();
            const raceYear = raceDate.getFullYear();
            
            // 時期分類
            let category = 'mixed';
            let weight = 0.1;
            
            if (raceYear === currentYear) {
                // 今年のデータ
                const monthDiff = Math.abs(currentMonth - raceMonth);
                if (monthDiff <= 1) {
                    category = 'recent';
                    weight = 0.4; // 40%
                } else if (monthDiff <= 3) {
                    category = 'recent';
                    weight = 0.3; // 30%
                }
            } else {
                // 過去年のデータ
                const monthDiff = Math.abs(currentMonth - raceMonth);
                if (monthDiff <= 1) {
                    // 同時期のデータ
                    category = 'seasonal';
                    weight = 0.35; // 35%
                } else {
                    category = 'mixed';
                    weight = 0.25; // 25%
                }
            }
            
            return {
                ...race,
                category: category,
                weight: weight,
                relevanceScore: this.calculateRelevanceScore(race, now)
            };
        });
    }

    // 関連性スコア計算
    static calculateRelevanceScore(race, currentDate) {
        const raceDate = new Date(race.date);
        const daysDiff = Math.abs(currentDate - raceDate) / (1000 * 60 * 60 * 24);
        
        let score = 0;
        
        // 時期による重み
        if (daysDiff <= 90) {
            score += 0.4; // 3ヶ月以内は高重み
        } else if (daysDiff <= 365) {
            score += 0.3; // 1年以内は中重み
        } else {
            score += 0.1; // それ以外は低重み
        }
        
        // 季節一致による重み
        const currentMonth = currentDate.getMonth();
        const raceMonth = raceDate.getMonth();
        const monthDiff = Math.abs(currentMonth - raceMonth);
        
        if (monthDiff <= 1 || monthDiff >= 11) {
            score += 0.3; // 同季節は高重み
        } else if (monthDiff <= 3 || monthDiff >= 9) {
            score += 0.2; // 近い季節は中重み
        }
        
        // コース・距離一致による重み
        if (race.trackType && race.distance) {
            score += 0.2; // 条件一致は加点
        }
        
        return Math.min(1.0, score);
    }

    // ハイブリッド学習データの生成
    static generateHybridTrainingData(historicalRaces) {
        const classifiedData = this.classifyDataByTime(historicalRaces);
        
        // カテゴリ別にデータを分類
        const categorized = {
            recent: classifiedData.filter(d => d.category === 'recent'),
            seasonal: classifiedData.filter(d => d.category === 'seasonal'),
            mixed: classifiedData.filter(d => d.category === 'mixed')
        };
        
        // 重み付け学習データセット作成
        const hybridDataset = [];
        
        Object.keys(categorized).forEach(category => {
            categorized[category].forEach(race => {
                // 各レースから学習ポイントを抽出
                const learningPoints = this.extractLearningPoints(race);
                
                learningPoints.forEach(point => {
                    hybridDataset.push({
                        ...point,
                        category: category,
                        weight: race.weight,
                        relevanceScore: race.relevanceScore,
                        effectiveWeight: race.weight * race.relevanceScore
                    });
                });
            });
        });
        
        return hybridDataset.sort((a, b) => b.effectiveWeight - a.effectiveWeight);
    }

    // 学習ポイント抽出
    static extractLearningPoints(race) {
        const points = [];
        
        if (race.winner && race.horses) {
            const winnerHorse = race.horses.find(h => h.name === race.winner);
            if (winnerHorse) {
                points.push({
                    type: 'winner_pattern',
                    data: {
                        odds: winnerHorse.odds,
                        lastRace: winnerHorse.lastRace,
                        jockey: winnerHorse.jockey,
                        age: winnerHorse.age,
                        course: race.course,
                        distance: race.distance,
                        trackCondition: race.trackCondition
                    },
                    outcome: 'win',
                    confidence: this.calculatePatternConfidence(winnerHorse, race)
                });
            }
        }
        
        // 上位馬のパターン
        if (race.placeHorses) {
            race.placeHorses.forEach((placeName, index) => {
                const horse = race.horses.find(h => h.name === placeName);
                if (horse) {
                    points.push({
                        type: 'place_pattern',
                        data: {
                            odds: horse.odds,
                            lastRace: horse.lastRace,
                            jockey: horse.jockey,
                            position: index + 1
                        },
                        outcome: 'place',
                        confidence: 0.7 - (index * 0.1)
                    });
                }
            });
        }
        
        return points;
    }

    // パターン信頼度計算
    static calculatePatternConfidence(horse, race) {
        let confidence = 0.5;
        
        // オッズによる調整
        if (horse.odds <= 3) {
            confidence += 0.2; // 人気馬的中は高信頼
        } else if (horse.odds >= 10) {
            confidence += 0.3; // 穴馬的中は超高信頼
        }
        
        // 前走成績による調整
        if (horse.lastRace <= 3) {
            confidence += 0.1;
        }
        
        // レース条件による調整
        if (race.trackCondition === '良') {
            confidence += 0.1;
        }
        
        return Math.min(1.0, confidence);
    }

    // ハイブリッド予測の実行
    static performHybridPrediction(currentRaceData, hybridDataset) {
        const predictions = [];
        
        currentRaceData.horses.forEach(horse => {
            let totalScore = 0;
            let totalWeight = 0;
            
            // 類似パターンを検索
            const similarPatterns = this.findSimilarPatterns(horse, currentRaceData, hybridDataset);
            
            similarPatterns.forEach(pattern => {
                const patternScore = this.calculatePatternScore(pattern);
                const effectiveWeight = pattern.effectiveWeight * pattern.confidence;
                
                totalScore += patternScore * effectiveWeight;
                totalWeight += effectiveWeight;
            });
            
            const hybridScore = totalWeight > 0 ? totalScore / totalWeight : 0;
            
            predictions.push({
                horse: horse.name,
                hybridScore: hybridScore,
                similarPatternsCount: similarPatterns.length,
                confidence: this.calculatePredictionConfidence(hybridScore, similarPatterns.length),
                patternTypes: this.summarizePatternTypes(similarPatterns)
            });
        });
        
        return predictions.sort((a, b) => b.hybridScore - a.hybridScore);
    }

    // 類似パターン検索
    static findSimilarPatterns(targetHorse, targetRace, hybridDataset) {
        return hybridDataset.filter(pattern => {
            let similarity = 0;
            
            // オッズ類似度
            const oddsDiff = Math.abs(pattern.data.odds - targetHorse.odds);
            if (oddsDiff <= 2) similarity += 0.3;
            else if (oddsDiff <= 5) similarity += 0.2;
            else if (oddsDiff <= 10) similarity += 0.1;
            
            // 前走成績類似度
            if (pattern.data.lastRace && targetHorse.lastRace) {
                const lastRaceDiff = Math.abs(pattern.data.lastRace - targetHorse.lastRace);
                if (lastRaceDiff <= 1) similarity += 0.2;
                else if (lastRaceDiff <= 2) similarity += 0.1;
            }
            
            // 騎手一致
            if (pattern.data.jockey && targetHorse.jockey) {
                if (pattern.data.jockey.includes(targetHorse.jockey.slice(0, 2))) {
                    similarity += 0.2;
                }
            }
            
            // コース・距離一致
            if (pattern.data.course === targetRace.course) similarity += 0.1;
            if (pattern.data.distance === targetRace.distance) similarity += 0.1;
            
            return similarity >= 0.3; // 30%以上の類似度で採用
        });
    }

    // パターンスコア計算
    static calculatePatternScore(pattern) {
        let score = 0.5;
        
        if (pattern.outcome === 'win') {
            score = 0.9;
        } else if (pattern.outcome === 'place') {
            score = 0.7 - (pattern.data.position * 0.1);
        }
        
        return score * pattern.confidence;
    }

    // 予測信頼度計算
    static calculatePredictionConfidence(score, patternCount) {
        let confidence = score;
        
        // パターン数による調整
        if (patternCount >= 10) {
            confidence += 0.2;
        } else if (patternCount >= 5) {
            confidence += 0.1;
        } else if (patternCount < 3) {
            confidence -= 0.1;
        }
        
        return Math.max(0, Math.min(1, confidence));
    }

    // パターンタイプ要約
    static summarizePatternTypes(patterns) {
        const types = {};
        patterns.forEach(p => {
            types[p.type] = (types[p.type] || 0) + 1;
        });
        return types;
    }

    // 精度検証機能
    static validateAccuracy(testRaces, hybridDataset) {
        const results = {
            total: testRaces.length,
            winCorrect: 0,
            placeCorrect: 0,
            averageConfidence: 0,
            categoryAccuracy: {
                recent: { total: 0, correct: 0 },
                seasonal: { total: 0, correct: 0 },
                mixed: { total: 0, correct: 0 }
            }
        };
        
        testRaces.forEach(race => {
            const predictions = this.performHybridPrediction(race, hybridDataset);
            const topPrediction = predictions[0];
            
            if (topPrediction && topPrediction.horse === race.winner) {
                results.winCorrect++;
            }
            
            if (topPrediction && race.placeHorses && 
                race.placeHorses.includes(topPrediction.horse)) {
                results.placeCorrect++;
            }
            
            results.averageConfidence += topPrediction ? topPrediction.confidence : 0;
        });
        
        results.winAccuracy = results.winCorrect / results.total;
        results.placeAccuracy = results.placeCorrect / results.total;
        results.averageConfidence = results.averageConfidence / results.total;
        
        return results;
    }

    // 学習結果の保存
    static saveLearningResults(hybridDataset, accuracy) {
        this.learningData = {
            hybridDataset: hybridDataset,
            accuracy: accuracy,
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem('hybridLearningData', JSON.stringify(this.learningData));
        
        console.log('ハイブリッド学習結果を保存しました:', {
            dataPoints: hybridDataset.length,
            winAccuracy: accuracy.winAccuracy,
            placeAccuracy: accuracy.placeAccuracy
        });
    }

    // 学習結果の読み込み
    static loadLearningResults() {
        try {
            const saved = localStorage.getItem('hybridLearningData');
            if (saved) {
                this.learningData = JSON.parse(saved);
                return this.learningData;
            }
        } catch (error) {
            console.error('学習データ読み込みエラー:', error);
        }
        return null;
    }

    // テスト用過去データ生成
    static generateTestHistoricalData() {
        const testData = [];
        const currentDate = new Date();
        
        // 過去2年間のテストデータを生成
        for (let i = 0; i < 100; i++) {
            const daysBack = Math.floor(Math.random() * 730); // 2年間
            const raceDate = new Date(currentDate.getTime() - (daysBack * 24 * 60 * 60 * 1000));
            
            const horses = [];
            for (let j = 0; j < 16; j++) {
                horses.push({
                    name: `テスト馬${j + 1}_${i}`,
                    odds: Math.round((Math.random() * 20 + 1) * 10) / 10,
                    lastRace: Math.floor(Math.random() * 10) + 1,
                    jockey: ['武豊', '川田', '戸崎', '田辺', '松山'][Math.floor(Math.random() * 5)],
                    age: Math.floor(Math.random() * 5) + 3
                });
            }
            
            // 勝者をランダムに決定（人気馬寄り）
            const sortedByOdds = [...horses].sort((a, b) => a.odds - b.odds);
            const winnerIndex = Math.random() < 0.6 ? 
                Math.floor(Math.random() * 3) : // 60%の確率で上位3頭
                Math.floor(Math.random() * horses.length); // 40%の確率で全体から
            
            const winner = sortedByOdds[winnerIndex];
            const placeHorses = sortedByOdds.slice(0, 3).map(h => h.name);
            
            testData.push({
                date: raceDate.toISOString(),
                course: ['東京', '中山', '阪神', '京都'][Math.floor(Math.random() * 4)],
                distance: [1200, 1400, 1600, 2000, 2400][Math.floor(Math.random() * 5)],
                trackCondition: ['良', '稍重', '重'][Math.floor(Math.random() * 3)],
                horses: horses,
                winner: winner.name,
                placeHorses: placeHorses
            });
        }
        
        return testData;
    }

    // 初期化
    static initialize() {
        console.log('ハイブリッド学習システムを初期化しました');
        
        // 保存された学習データを読み込み
        const savedData = this.loadLearningResults();
        if (savedData) {
            console.log(`保存された学習データを読み込みました: ${savedData.hybridDataset?.length || 0}件`);
        }
    }
}

// グローバル関数として公開
window.HybridLearningSystem = HybridLearningSystem;

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', function() {
    HybridLearningSystem.initialize();
});