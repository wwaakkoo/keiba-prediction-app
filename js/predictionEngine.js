// 予測エンジン機能
class PredictionEngine {
    static currentPredictions = [];

    // 着順データを安全に数値化するユーティリティ関数
    static parseRaceOrder(orderValue) {
        if (!orderValue) return null;
        
        // 文字列を正規化
        const orderStr = String(orderValue).trim();
        
        // 中止・取消・除外・失格の場合
        if (orderStr === 'DNS' || orderStr === '中' || orderStr === '取' || orderStr === '除' || orderStr === '失') {
            return 99; // 大きな数値として扱う（最下位扱い）
        }
        
        // 数値の場合
        const numericOrder = parseInt(orderStr);
        if (!isNaN(numericOrder) && numericOrder > 0) {
            return numericOrder;
        }
        
        return null;
    }

    static calculatePredictions() {
        if (!HorseManager.validateHorses()) {
            return;
        }

        const horses = HorseManager.getAllHorses();
        
        // データ抽出内容を確認（2走分対応）
        this.logRaceHistoryExtraction(horses);
        
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

            // 過去2走の総合評価（前走重視、2走前も考慮）
            const raceHistoryScore = this.calculateRaceHistoryScore(horse, adj);
            score += raceHistoryScore;

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
            } else {
                // 未対応コースの場合はデフォルト値を使用（地方競馬場など）
                const defaultPreference = horse.trackType === 'ダート' ? 1.0 : 0.9;
                courseScore = (defaultPreference - 1) * 20;
                console.log(`未対応コース (${horse.course}) でデフォルト適性値を使用:`, defaultPreference);
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

            // 勝率計算（オッズベース + スコア調整）
            let baseWinRate = 0;
            if (horse.odds <= 2) {
                baseWinRate = 35;
            } else if (horse.odds <= 5) {
                baseWinRate = 20;
            } else if (horse.odds <= 10) {
                baseWinRate = 12;
            } else if (horse.odds <= 20) {
                baseWinRate = 6;
            } else if (horse.odds <= 50) {
                baseWinRate = 2;
            } else if (horse.odds <= 100) {
                baseWinRate = 1;
            } else {
                // 超高オッズ馬：理論値に近づける
                baseWinRate = Math.max(0.2, 100 / horse.odds);
            }

            const scoreAdjustment = (score - 50) * 0.3;
            let winProbability = baseWinRate + scoreAdjustment;
            
            // 最低勝率を理論値に合わせて調整
            const theoreticalMinRate = Math.max(0.1, 100 / horse.odds * 0.8);
            winProbability = Math.max(theoreticalMinRate, Math.min(40, winProbability));

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
        // 結果を保存（ソート機能で使用）
        this.currentPredictions = predictions;
        
        const resultsDiv = document.getElementById('results');
        const sortControls = document.getElementById('sortControls');
        
        resultsDiv.classList.remove('hidden');
        sortControls.style.display = 'block';
        
        // デフォルトはスコア順で表示
        this.renderSortedResults('score');
        
        // AI推奨ボタンを有効化
        this.enableAIRecommendationButton();
    }

    static renderSortedResults(sortBy) {
        const container = document.getElementById('resultsContainer');
        
        if (!this.currentPredictions) return;
        
        let sortedPredictions;
        let sortTitle;
        
        switch(sortBy) {
            case 'place':
                sortedPredictions = [...this.currentPredictions].sort((a, b) => b.placeProbability - a.placeProbability);
                sortTitle = '🎯 複勝率順（上位3頭が複勝予測）';
                break;
            case 'win':
                sortedPredictions = [...this.currentPredictions].sort((a, b) => b.winProbability - a.winProbability);
                sortTitle = '🏆 勝率順';
                break;
            case 'odds':
                sortedPredictions = [...this.currentPredictions].sort((a, b) => a.odds - b.odds);
                sortTitle = '💰 オッズ順（人気順）';
                break;
            default:
                sortedPredictions = [...this.currentPredictions].sort((a, b) => b.score - a.score);
                sortTitle = '🏆 スコア順';
        }
        
        let html = '<div style="margin-bottom: 20px;">';
        html += `<h4>${sortTitle}</h4>`;
        
        // 複勝率順の場合は上位3頭を強調表示
        if (sortBy === 'place') {
            html += '<p style="color: #f57c00; font-weight: bold; margin-bottom: 15px;">📊 複勝予測上位3頭</p>';
        }
        
        sortedPredictions.forEach((horse, index) => {
            const confidence = horse.score >= CONFIG.SCORE_RANGES.HIGH ? 'high' : 
                             horse.score >= CONFIG.SCORE_RANGES.MEDIUM ? 'medium' : 'low';
            
            // 複勝率順で上位3頭の場合は特別な背景色
            const isTopThreePlace = sortBy === 'place' && index < 3;
            const extraStyle = isTopThreePlace ? 'background: linear-gradient(135deg, #fff3e0, #ffe0b2); border: 2px solid #ff9800;' : '';
            
            const horseNumberDisplay = horse.horseNumber ? `${horse.horseNumber}番 ` : '';
            
            html += `
                <div class="result-item confidence-${confidence}" style="${extraStyle}">
                    <div><strong>${index + 1}位: ${horseNumberDisplay}${horse.name}${isTopThreePlace ? ' ⭐' : ''}</strong></div>
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

    static changeSortOrder(sortBy) {
        this.renderSortedResults(sortBy);
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

    // AI推奨ボタンを有効化
    static enableAIRecommendationButton() {
        const aiButton = document.querySelector('button[onclick="getAIRecommendation()"]');
        if (aiButton) {
            aiButton.disabled = false;
            aiButton.style.opacity = '1';
            aiButton.style.cursor = 'pointer';
        }
    }

    // AI推奨を取得（グローバル関数からも呼び出し可能）
    static async requestAIRecommendation() {
        if (!this.currentPredictions || this.currentPredictions.length === 0) {
            if (typeof showMessage === 'function') {
                showMessage('先に「🚀 予測開始」を実行してください', 'warning');
            } else {
                alert('先に「🚀 予測開始」を実行してください');
            }
            return;
        }

        try {
            await AIRecommendationService.getAIRecommendation(this.currentPredictions);
        } catch (error) {
            console.error('AI推奨の取得でエラー:', error);
            if (typeof showMessage === 'function') {
                showMessage('AI推奨の取得に失敗しました', 'error');
            }
        }
    }

    // 過去2走のレース履歴抽出ログ
    static logRaceHistoryExtraction(horses) {
        console.log('=== 馬データ抽出完了（過去2走対応） ===');
        console.log(`抽出馬数: ${horses.length}頭`);
        
        horses.forEach((horse, index) => {
            console.log(`\n--- 馬${index + 1}: ${horse.name} ---`);
            console.log(`オッズ: ${horse.odds}倍`);
            console.log(`騎手: ${horse.jockey}`);
            console.log(`前走着順: ${horse.lastRace || '?'}着`);
            
            // 前走データの確認
            if (horse.lastRaceCourse || horse.lastRaceTime || horse.lastRaceAgari) {
                console.log(`前走: ${horse.lastRaceCourse || '?'} ${horse.lastRaceDistance || '?'}m ${horse.lastRaceTrackType || '?'} ${horse.lastRaceAgari || '?'}秒`);
                console.log(`前走詳細: ${horse.lastRaceDate || '?'} 斤量${horse.lastRaceWeight || '?'}kg 人気${horse.lastRacePopularity || '?'}番`);
            } else {
                console.log(`前走: データなし`);
            }
            
            // 2走前データの確認
            if (horse.secondLastRaceCourse || horse.secondLastRaceTime || horse.secondLastRaceAgari) {
                console.log(`2走前: ${horse.secondLastRaceCourse || '?'} ${horse.secondLastRaceDistance || '?'}m ${horse.secondLastRaceTrackType || '?'} ${horse.secondLastRaceAgari || '?'}秒`);
                console.log(`2走前詳細: ${horse.secondLastRaceDate || '?'} 斤量${horse.secondLastRaceWeight || '?'}kg 人気${horse.secondLastRacePopularity || '?'}番 ${horse.secondLastRaceOrder || '?'}着`);
            } else {
                console.log(`2走前: データなし`);
            }
            
            // パフォーマンス傾向分析
            if (horse.lastRaceOrder && horse.secondLastRaceOrder) {
                const lastOrder = this.parseRaceOrder(horse.lastRaceOrder) || this.parseRaceOrder(horse.lastRace);
                const secondLastOrder = this.parseRaceOrder(horse.secondLastRaceOrder);
                
                if (lastOrder && secondLastOrder) {
                    const improvement = secondLastOrder - lastOrder;
                    if (improvement > 0) {
                        console.log(`📈 成績向上: ${horse.secondLastRaceOrder}着→${horse.lastRaceOrder || horse.lastRace}着 (+${improvement})`);
                    } else if (improvement < 0) {
                        console.log(`📉 成績低下: ${horse.secondLastRaceOrder}着→${horse.lastRaceOrder || horse.lastRace}着 (${improvement})`);
                    } else {
                        console.log(`➡️ 成績安定: ${horse.secondLastRaceOrder}着→${horse.lastRaceOrder || horse.lastRace}着`);
                    }
                }
            }
        });
        
        console.log('\n=== 抽出完了 ===');
    }

    // 過去2走のレース履歴を総合評価する新機能
    static calculateRaceHistoryScore(horse, adj) {
        let totalScore = 0;
        
        // 前走評価（ウェイト70%）
        const lastRaceScore = this.evaluateSingleRace({
            agari: horse.lastRaceAgari,
            order: horse.lastRaceOrder || horse.lastRace,
            course: horse.lastRaceCourse,
            distance: horse.lastRaceDistance,
            trackType: horse.lastRaceTrackType,
            trackCondition: horse.lastRaceTrackCondition,
            popularity: horse.lastRacePopularity,
            weight: horse.lastRaceWeight
        }, horse, '前走');
        
        totalScore += lastRaceScore * 0.7 * adj.lastRaceWeight;
        
        // 2走前評価（ウェイト30%）
        if (horse.secondLastRaceAgari || horse.secondLastRaceOrder) {
            const secondLastRaceScore = this.evaluateSingleRace({
                agari: horse.secondLastRaceAgari,
                order: horse.secondLastRaceOrder,
                course: horse.secondLastRaceCourse,
                distance: horse.secondLastRaceDistance,
                trackType: horse.secondLastRaceTrackType,
                trackCondition: horse.secondLastRaceTrackCondition,
                popularity: horse.secondLastRacePopularity,
                weight: horse.secondLastRaceWeight
            }, horse, '2走前');
            
            totalScore += secondLastRaceScore * 0.3 * adj.lastRaceWeight;
        }
        
        // レースパフォーマンスの一貫性評価
        const consistencyBonus = this.evaluatePerformanceConsistency(horse);
        totalScore += consistencyBonus;
        
        return totalScore;
    }

    // 単一レースの評価
    static evaluateSingleRace(raceData, horse, raceLabel) {
        let raceScore = 0;
        
        // 上がり3F評価
        if (raceData.agari) {
            const agari = parseFloat(raceData.agari);
            if (!isNaN(agari)) {
                if (agari <= 33.5) {
                    raceScore += 25;
                } else if (agari <= 34.0) {
                    raceScore += 20;
                } else if (agari <= 34.5) {
                    raceScore += 10;
                } else if (agari <= 35.0) {
                    raceScore += 0;
                } else if (agari <= 36.0) {
                    raceScore -= 5;
                } else {
                    raceScore -= 10;
                }
            }
        } else {
            raceScore -= 10; // データなしペナルティ
        }
        
        // 着順評価
        if (raceData.order) {
            const order = this.parseRaceOrder(raceData.order);
            if (order) {
                if (order === 1) {
                    raceScore += 30; // 勝利ボーナス
                } else if (order === 2) {
                    raceScore += 20; // 2着ボーナス
                } else if (order === 3) {
                    raceScore += 15; // 3着ボーナス
                } else if (order <= 5) {
                    raceScore += 5; // 5着以内
                } else if (order <= 8) {
                    raceScore += 0; // 中位
                } else if (order === 99) {
                    raceScore -= 20; // 中止・取消は大幅減点
                } else {
                    raceScore -= 10; // 下位
                }
            }
        }
        
        // 人気と着順の乖離評価（穴馬・凡走の判定）
        if (raceData.popularity && raceData.order) {
            const popularity = parseInt(raceData.popularity);
            const order = this.parseRaceOrder(raceData.order);
            
            if (!isNaN(popularity) && order && order !== 99) { // 中止以外の場合のみ
                const performanceGap = popularity - order;
                if (performanceGap > 3) {
                    raceScore += 10; // 人気を上回る好走
                } else if (performanceGap < -3) {
                    raceScore -= 8; // 人気を下回る凡走
                }
            }
        }
        
        // 距離適性評価（今回レースとの比較）
        if (raceData.distance && horse.distance) {
            const lastDistance = parseInt(raceData.distance);
            const currentDistance = parseInt(horse.distance);
            
            if (!isNaN(lastDistance) && !isNaN(currentDistance)) {
                const distanceGap = Math.abs(currentDistance - lastDistance);
                if (distanceGap <= 200) {
                    raceScore += 5; // 同距離帯
                } else if (distanceGap <= 400) {
                    raceScore += 2; // 近い距離
                } else {
                    raceScore -= 3; // 距離変更
                }
            }
        }
        
        // 馬場適性評価
        if (raceData.trackType && horse.trackType) {
            if (raceData.trackType === horse.trackType) {
                raceScore += 5; // 同じ馬場種別
            } else {
                raceScore -= 5; // 馬場変更
            }
        }
        
        return raceScore;
    }

    // パフォーマンス一貫性の評価
    static evaluatePerformanceConsistency(horse) {
        let consistencyScore = 0;
        
        // 前走と2走前のデータが両方ある場合のみ評価
        if (horse.lastRaceOrder && horse.secondLastRaceOrder) {
            const lastOrder = this.parseRaceOrder(horse.lastRaceOrder) || this.parseRaceOrder(horse.lastRace);
            const secondLastOrder = this.parseRaceOrder(horse.secondLastRaceOrder);
            
            if (lastOrder && secondLastOrder) {
                // 着順の向上・悪化を評価
                const improvement = secondLastOrder - lastOrder;
                
                if (improvement > 0) {
                    consistencyScore += Math.min(improvement * 3, 15); // 向上ボーナス（最大15点）
                } else if (improvement < 0) {
                    consistencyScore += Math.max(improvement * 2, -10); // 悪化ペナルティ（最大-10点）
                }
                
                // 安定性評価（両方5着以内など）
                if (lastOrder <= 5 && secondLastOrder <= 5) {
                    consistencyScore += 8; // 安定して好走
                } else if (lastOrder <= 3 || secondLastOrder <= 3) {
                    consistencyScore += 5; // どちらかで好走
                }
            }
        }
        
        // 上がり3Fの一貫性評価
        if (horse.lastRaceAgari && horse.secondLastRaceAgari) {
            const lastAgari = parseFloat(horse.lastRaceAgari);
            const secondLastAgari = parseFloat(horse.secondLastRaceAgari);
            
            if (!isNaN(lastAgari) && !isNaN(secondLastAgari)) {
                const agariGap = Math.abs(lastAgari - secondLastAgari);
                
                if (agariGap <= 0.5) {
                    consistencyScore += 5; // 安定した脚色
                } else if (agariGap <= 1.0) {
                    consistencyScore += 2; // まずまず安定
                } else {
                    consistencyScore -= 2; // 脚色にばらつき
                }
                
                // 両方とも好タイムの場合
                if (lastAgari <= 34.0 && secondLastAgari <= 34.0) {
                    consistencyScore += 8; // 継続して好調
                }
            }
        }
        
        return consistencyScore;
    }
}

// グローバル関数として公開
window.calculatePredictions = PredictionEngine.calculatePredictions.bind(PredictionEngine);
window.getAIRecommendation = PredictionEngine.requestAIRecommendation.bind(PredictionEngine); 