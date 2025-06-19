// 予測エンジン機能
class PredictionEngine {
    static currentPredictions = [];

    static calculatePredictions() {
        if (!HorseManager.validateHorses()) {
            return;
        }

        const horses = HorseManager.getAllHorses();
        const predictions = this.calculateHorsePredictions(horses);
        this.currentPredictions = predictions;
        this.displayResults(predictions);
        BettingRecommender.generateBettingRecommendations(predictions);
    }

    static calculateHorsePredictions(horses) {
        const adj = LearningSystem.getLearningData().adjustments;
        
        return horses.map(horse => {
            let score = 50;

            // オッズ評価（学習調整済み）
            let oddsScore = 0;
            if (horse.odds <= CONFIG.ODDS_THRESHOLDS.VERY_LOW) {
                oddsScore = 35;
            } else if (horse.odds <= CONFIG.ODDS_THRESHOLDS.LOW) {
                oddsScore = 25;
            } else if (horse.odds <= CONFIG.ODDS_THRESHOLDS.MEDIUM) {
                oddsScore = 10;
            } else if (horse.odds <= CONFIG.ODDS_THRESHOLDS.HIGH) {
                oddsScore = -5;
            } else if (horse.odds <= CONFIG.ODDS_THRESHOLDS.VERY_HIGH) {
                oddsScore = -10;
            } else {
                oddsScore = -15;
            }
            score += oddsScore * adj.oddsWeight;

            // 前走上がり3F評価（学習調整済み）
            let lastRace3FScore = 0;
            if (horse.lastRace3F) {
                const agari = parseFloat(horse.lastRace3F);
                if (!isNaN(agari)) {
                    if (agari <= 33.5) {
                        lastRace3FScore = 25;
                    } else if (agari <= 34.0) {
                        lastRace3FScore = 20;
                    } else if (agari <= 34.5) {
                        lastRace3FScore = 10;
                    } else if (agari <= 35.0) {
                        lastRace3FScore = 0;
                    } else if (agari <= 36.0) {
                        lastRace3FScore = -5;
                    } else {
                        lastRace3FScore = -10;
                    }
                }
            } else {
                lastRace3FScore = -10;
            }
            score += lastRace3FScore * adj.lastRaceWeight;

            // 騎手評価（学習調整済み）
            let jockeyScore = 0;
            if (CONFIG.TOP_JOCKEYS.some(jockey => horse.jockey.includes(jockey.replace(/[・\.]/g, '')))) {
                jockeyScore = 8;
            } else if (CONFIG.GOOD_JOCKEYS.some(jockey => horse.jockey.includes(jockey.replace(/[・\.]/g, '')))) {
                jockeyScore = 5;
            } else if (CONFIG.REGULAR_JOCKEYS.some(jockey => horse.jockey.includes(jockey.replace(/[・\.]/g, '')))) {
                jockeyScore = 2;
            }
            score += jockeyScore * adj.jockeyWeight;

            // 新しい特徴量の評価
            // 年齢評価
            let ageScore = 0;
            if (horse.age === 3) {
                ageScore = 15; // 3歳馬は成長期
            } else if (horse.age === 4) {
                ageScore = 10; // 4歳馬もまだ成長期
            } else if (horse.age === 5) {
                ageScore = 5; // 5歳馬は成熟期
            } else if (horse.age === 6) {
                ageScore = 0; // 6歳馬は標準
            } else {
                ageScore = -5; // 7歳以上は年齢的不利
            }
            score += ageScore * (adj.ageWeight || 1.0);

            // 馬体重変化評価
            let weightChangeScore = 0;
            if (horse.weightChange === 0) {
                weightChangeScore = 0; // 変化なし
            } else if (horse.weightChange === 1) {
                weightChangeScore = 5; // 適度な増加
            } else if (horse.weightChange === -1) {
                weightChangeScore = -5; // 適度な減少
            } else if (horse.weightChange === 2) {
                weightChangeScore = -10; // 大幅増加は不利
            } else if (horse.weightChange === -2) {
                weightChangeScore = -15; // 大幅減少は不利
            }
            score += weightChangeScore * (adj.weightChangeWeight || 1.0);

            // コース適性評価
            let courseScore = 0;
            if (CONFIG.COURSE_PREFERENCES[horse.course] && CONFIG.COURSE_PREFERENCES[horse.course][horse.trackType]) {
                courseScore = (CONFIG.COURSE_PREFERENCES[horse.course][horse.trackType] - 1) * 20;
            }
            score += courseScore * (adj.courseWeight || 1.0);

            // 距離適性評価（簡易版）
            let distanceScore = 0;
            if (horse.distance <= 1400) {
                distanceScore = 5; // 短距離適性
            } else if (horse.distance <= 1800) {
                distanceScore = 0; // 中距離
            } else {
                distanceScore = 5; // 長距離適性
            }
            score += distanceScore * (adj.distanceWeight || 1.0);

            // 天候適性評価
            let weatherScore = 0;
            if (CONFIG.WEATHER_PREFERENCES[horse.weather]) {
                weatherScore = (CONFIG.WEATHER_PREFERENCES[horse.weather] - 1) * 10;
            }
            score += weatherScore * (adj.weatherWeight || 1.0);

            // 馬場状態適性評価
            let trackConditionScore = 0;
            if (CONFIG.TRACK_CONDITIONS[horse.trackCondition]) {
                trackConditionScore = (CONFIG.TRACK_CONDITIONS[horse.trackCondition] - 1) * 15;
            }
            score += trackConditionScore * (adj.trackConditionWeight || 1.0);

            // 休養日数評価
            let restDaysScore = 0;
            if (horse.restDays <= 7) {
                restDaysScore = -5; // 短期間の休養は不利
            } else if (horse.restDays <= 14) {
                restDaysScore = 5; // 適度な休養
            } else if (horse.restDays <= 30) {
                restDaysScore = 0; // 標準的な休養
            } else {
                restDaysScore = -10; // 長期の休養は不利
            }
            score += restDaysScore * (adj.restDaysWeight || 1.0);

            // 新しい前走情報の評価
            // 前走タイム評価（距離適性の指標）
            let lastRaceTimeScore = 0;
            if (horse.lastRaceTime && horse.lastRaceDistance && horse.distance) {
                const lastDistance = parseInt(horse.lastRaceDistance);
                const currentDistance = horse.distance;
                
                // 距離変化に対するタイム適性評価
                if (currentDistance > lastDistance) {
                    // 距離延長の場合
                    if (horse.lastRace <= 3) {
                        lastRaceTimeScore = 10; // 短距離で好走なら距離延長に期待
                    } else {
                        lastRaceTimeScore = -5; // 短距離でも振るわなかった場合は不利
                    }
                } else if (currentDistance < lastDistance) {
                    // 距離短縮の場合
                    if (horse.lastRace <= 3) {
                        lastRaceTimeScore = 5; // 長距離で好走なら短縮に期待
                    } else {
                        lastRaceTimeScore = 10; // 長距離で振るわなかった場合は短縮で挽回期待
                    }
                }
            }
            score += lastRaceTimeScore * (adj.lastRaceWeight || 1.0);

            // 前走馬場状態適性評価
            let lastRaceTrackConditionScore = 0;
            if (horse.lastRaceTrackCondition && horse.trackCondition) {
                if (horse.lastRaceTrackCondition === horse.trackCondition) {
                    lastRaceTrackConditionScore = 5; // 同じ馬場状態なら有利
                } else if (horse.lastRaceTrackCondition === '重' && horse.trackCondition === '良') {
                    lastRaceTimeScore = 8; // 重馬場から良馬場への改善は有利
                } else if (horse.lastRaceTrackCondition === '良' && horse.trackCondition === '重') {
                    lastRaceTimeScore = -8; // 良馬場から重馬場への悪化は不利
                }
            }
            score += lastRaceTrackConditionScore * (adj.trackConditionWeight || 1.0);

            // 前走天候適性評価
            let lastRaceWeatherScore = 0;
            if (horse.lastRaceWeather && horse.weather) {
                if (horse.lastRaceWeather === horse.weather) {
                    lastRaceWeatherScore = 3; // 同じ天候なら微有利
                } else if (horse.lastRaceWeather === '雨' && horse.weather === '晴') {
                    lastRaceWeatherScore = 5; // 雨から晴への改善は有利
                } else if (horse.lastRaceWeather === '晴' && horse.weather === '雨') {
                    lastRaceWeatherScore = -5; // 晴から雨への悪化は不利
                }
            }
            score += lastRaceWeatherScore * (adj.weatherWeight || 1.0);

            // 前走斤量変化評価
            let lastRaceWeightChangeScore = 0;
            if (horse.lastRaceWeight > 0) {
                const weightDiff = horse.lastRaceWeight - 56.0; // 標準斤量との差
                if (weightDiff > 2) {
                    lastRaceWeightChangeScore = -5; // 前走が重斤量だった場合は今回有利
                } else if (weightDiff < -2) {
                    lastRaceWeightChangeScore = 5; // 前走が軽斤量だった場合は今回不利
                }
            }
            score += lastRaceWeightChangeScore * (adj.weightChangeWeight || 1.0);

            // 前走オッズ変化評価
            let oddsChangeScore = 0;
            if (horse.lastRaceOdds > 0 && horse.odds > 0) {
                const oddsRatio = horse.odds / horse.lastRaceOdds;
                if (oddsRatio < 0.7) {
                    oddsChangeScore = 10; // オッズが大幅に下がった（人気上昇）
                } else if (oddsRatio > 1.5) {
                    oddsChangeScore = -10; // オッズが大幅に上がった（人気下降）
                }
            }
            score += oddsChangeScore * (adj.oddsWeight || 1.0);

            // 前走人気度評価
            let popularityScore = 0;
            if (horse.lastRacePopularity > 0 && horse.lastRaceHorseCount > 0) {
                const popularityRate = horse.lastRacePopularity / horse.lastRaceHorseCount;
                if (popularityRate <= 0.1) {
                    popularityScore = 8; // 前走が1-2番人気だった場合は今回も期待
                } else if (popularityRate >= 0.5) {
                    popularityScore = -5; // 前走が下位人気だった場合は今回も不安
                }
            }
            score += popularityScore * (adj.popularityBias || 1.0);

            // 前走騎手評価（騎手変更の影響）
            let jockeyChangeScore = 0;
            if (horse.lastRaceJockey && horse.jockey) {
                if (horse.lastRaceJockey === horse.jockey) {
                    jockeyChangeScore = 3; // 同じ騎手なら微有利
                } else {
                    // 騎手ランクの変化を評価
                    const getJockeyRank = (jockey) => {
                        if (CONFIG.TOP_JOCKEYS.some(j => jockey.includes(j.replace(/[・\.]/g, '')))) return 3;
                        if (CONFIG.GOOD_JOCKEYS.some(j => jockey.includes(j.replace(/[・\.]/g, '')))) return 2;
                        return 1;
                    };
                    
                    const lastJockeyRank = getJockeyRank(horse.lastRaceJockey);
                    const currentJockeyRank = getJockeyRank(horse.jockey);
                    
                    if (currentJockeyRank > lastJockeyRank) {
                        jockeyChangeScore = 5; // より良い騎手に変更
                    } else if (currentJockeyRank < lastJockeyRank) {
                        jockeyChangeScore = -5; // より悪い騎手に変更
                    }
                }
            }
            score += jockeyChangeScore * (adj.jockeyWeight || 1.0);

            // 人気度バイアス調整
            score += adj.popularityBias;

            // スコアを10-90の範囲に調整
            score = Math.max(10, Math.min(90, score));

            // 勝率計算
            let baseWinRate = 0;
            if (horse.odds <= 2) {
                baseWinRate = 35;
            } else if (horse.odds <= 5) {
                baseWinRate = 20;
            } else if (horse.odds <= 10) {
                baseWinRate = 12;
            } else if (horse.odds <= 20) {
                baseWinRate = 6;
            } else {
                baseWinRate = 3;
            }

            const scoreAdjustment = (score - 50) * 0.3;
            const winProbability = Math.max(1, Math.min(40, baseWinRate + scoreAdjustment));

            // 複勝率計算
            let basePlaceRate = 0;
            if (horse.odds <= 3) {
                basePlaceRate = 70;
            } else if (horse.odds <= 7) {
                basePlaceRate = 50;
            } else if (horse.odds <= 15) {
                basePlaceRate = 30;
            } else if (horse.odds <= 30) {
                basePlaceRate = 15;
            } else {
                basePlaceRate = 8;
            }

            const placeProbability = Math.max(winProbability, Math.min(80, basePlaceRate + scoreAdjustment));

            // 複勝オッズ計算
            let placeOdds = 0;
            if (horse.odds <= 3) {
                placeOdds = horse.odds * 0.4;
            } else if (horse.odds <= 10) {
                placeOdds = horse.odds * 0.35;
            } else {
                placeOdds = horse.odds * 0.3;
            }

            // 期待値計算
            const winExpectedValue = (winProbability / 100 * horse.odds - 1);
            const placeExpectedValue = (placeProbability / 100 * placeOdds - 1);

            return {
                ...horse,
                score: Math.round(score * 10) / 10,
                winProbability: Math.round(winProbability * 10) / 10,
                placeProbability: Math.round(placeProbability * 10) / 10,
                winExpectedValue: Math.round(winExpectedValue * 100) / 100,
                placeExpectedValue: Math.round(placeExpectedValue * 100) / 100
            };
        });
    }

    static displayResults(predictions) {
        const container = document.getElementById('resultsContainer');
        const resultsDiv = document.getElementById('results');
        
        resultsDiv.classList.remove('hidden');
        
        const sortedPredictions = [...predictions].sort((a, b) => b.score - a.score);
        
        let html = '<div style="margin-bottom: 20px;">';
        html += '<h4>🏆 順位予想（スコア順）</h4>';
        
        sortedPredictions.forEach((horse, index) => {
            const confidence = horse.score >= CONFIG.SCORE_RANGES.HIGH ? 'high' : 
                             horse.score >= CONFIG.SCORE_RANGES.MEDIUM ? 'medium' : 'low';
            
            html += `
                <div class="result-item confidence-${confidence}">
                    <div><strong>${index + 1}位: ${horse.name}</strong></div>
                    <div>スコア: ${horse.score}</div>
                    <div>勝率: ${horse.winProbability}%</div>
                    <div>複勝率: ${horse.placeProbability}%</div>
                    <div>オッズ: ${horse.odds}倍</div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    static getCurrentPredictions() {
        return this.currentPredictions;
    }

    static getAllHorses() {
        const horseCards = document.querySelectorAll('.horse-card');
        const horses = [];
        
        horseCards.forEach(card => {
            const horseName = card.querySelector('input[name="horseName"]').value || '名前未入力';
            const odds = parseFloat(card.querySelector('input[name="odds"]').value) || 10;
            const lastRace = parseInt(card.querySelector('select[name="lastRace"]').value) || 6;
            
            const jockeySelect = card.querySelector('select[name="jockey"]');
            const jockeyCustom = card.querySelector('input[name="jockeyCustom"]');
            let jockey = '';
            
            if (jockeySelect.value === 'custom') {
                jockey = jockeyCustom.value || '騎手未入力';
            } else {
                jockey = jockeySelect.value || '騎手未入力';
            }

            // 新しい特徴量を取得
            const age = parseInt(card.querySelector('select[name="age"]').value) || 5;
            const weightChange = parseInt(card.querySelector('select[name="weightChange"]').value) || 0;
            const course = card.querySelector('select[name="course"]').value || '中山';
            const distance = parseInt(card.querySelector('select[name="distance"]').value) || 1600;
            const trackType = card.querySelector('select[name="trackType"]').value || '芝';
            const weather = card.querySelector('select[name="weather"]').value || '晴';
            const trackCondition = card.querySelector('select[name="trackCondition"]').value || '良';
            const restDays = parseInt(card.querySelector('select[name="restDays"]').value) || 14;

            horses.push({
                name: horseName,
                odds: odds,
                lastRace: lastRace,
                jockey: jockey,
                // 新しい特徴量
                age: age,
                weightChange: weightChange,
                course: course,
                distance: distance,
                trackType: trackType,
                weather: weather,
                trackCondition: trackCondition,
                restDays: restDays
            });
        });

        return horses;
    }
}

// グローバル関数として公開
window.calculatePredictions = PredictionEngine.calculatePredictions.bind(PredictionEngine); 