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
    
    // 展開・脚質分析
    static analyzeRunningStyle(horse, raceDistance, trackType) {
        const runningStyle = horse.runningStyle || '先行';
        const distance = parseInt(raceDistance) || 1600;
        
        // 距離適性による脚質評価
        const distanceOptimal = this.getDistanceOptimalStyle(distance);
        
        // 馬場適性による脚質評価
        const trackOptimal = this.getTrackOptimalStyle(trackType || '芝');
        
        // 基本的な脚質スコア
        const baseScore = this.getRunningStyleBaseScore(runningStyle);
        
        // 距離との相性
        const distanceCompatibility = this.calculateStyleDistanceCompatibility(runningStyle, distance);
        
        // 過去の脚質一貫性
        const styleConsistency = this.analyzeStyleConsistency(horse);
        
        // 総合評価
        const effectiveness = baseScore + distanceCompatibility + styleConsistency.bonus;
        
        return {
            style: runningStyle,
            effectiveness: Math.max(-15, Math.min(15, effectiveness)),
            distanceOptimal,
            trackOptimal,
            consistency: styleConsistency,
            analysis: this.generateRunningStyleAnalysis(runningStyle, distance, effectiveness),
            description: `脚質: ${runningStyle} (${distance}m適性: ${distanceCompatibility > 0 ? '良' : '普通'})`
        };
    }
    
    // 距離に最適な脚質を判定
    static getDistanceOptimalStyle(distance) {
        if (distance <= 1200) {
            return ['逃げ', '先行']; // 短距離は前で行く戦法が有利
        } else if (distance <= 1600) {
            return ['先行', '差し']; // マイルは先行・差しが有利
        } else if (distance <= 2000) {
            return ['差し', '先行']; // 中距離は差し・先行が有利
        } else {
            return ['差し', '追込']; // 長距離は差し・追込が有利
        }
    }
    
    // 馬場に最適な脚質を判定
    static getTrackOptimalStyle(trackType) {
        if (trackType === 'ダート') {
            return ['逃げ', '先行']; // ダートは前で行く戦法が有利
        } else {
            return ['先行', '差し']; // 芝は先行・差しが基本
        }
    }
    
    // 脚質の基本スコア
    static getRunningStyleBaseScore(style) {
        const scores = {
            '逃げ': 5,    // 積極的だが危険性もある
            '先行': 8,    // バランス良く最も安定
            '差し': 6,    // 展開次第だが器用
            '追込': 3,    // 展開が向かないと厳しい
            '自在': 7     // 臨機応変だが中途半端な場合も
        };
        return scores[style] || 5;
    }
    
    // 脚質と距離の相性計算
    static calculateStyleDistanceCompatibility(style, distance) {
        const compatibilityMatrix = {
            '逃げ': {
                1000: 8, 1200: 6, 1400: 3, 1600: 0, 1800: -3, 2000: -5, 2400: -8
            },
            '先行': {
                1000: 5, 1200: 8, 1400: 8, 1600: 6, 1800: 3, 2000: 0, 2400: -2
            },
            '差し': {
                1000: -3, 1200: 0, 1400: 3, 1600: 6, 1800: 8, 2000: 6, 2400: 3
            },
            '追込': {
                1000: -8, 1200: -5, 1400: -2, 1600: 0, 1800: 3, 2000: 6, 2400: 8
            },
            '自在': {
                1000: 3, 1200: 5, 1400: 5, 1600: 5, 1800: 5, 2000: 3, 2400: 0
            }
        };
        
        const styleMatrix = compatibilityMatrix[style];
        if (!styleMatrix) return 0;
        
        // 最も近い距離での相性を取得
        const distances = Object.keys(styleMatrix).map(d => parseInt(d));
        const closestDistance = distances.reduce((prev, curr) => 
            Math.abs(curr - distance) < Math.abs(prev - distance) ? curr : prev
        );
        
        return styleMatrix[closestDistance] || 0;
    }
    
    // 過去の脚質一貫性分析（過去脚質データ不要版）
    static analyzeStyleConsistency(horse) {
        // 現在は基本脚質のみ使用し、過去の脚質履歴は使用しない
        return {
            level: 'basic',
            bonus: 0,
            description: '基本脚質のみ評価（過去履歴なし）'
        };
    }
    
    // 脚質分析レポート生成
    static generateRunningStyleAnalysis(style, distance, effectiveness) {
        const distanceCategory = distance <= 1200 ? '短距離' : 
                               distance <= 1600 ? 'マイル' :
                               distance <= 2000 ? '中距離' : '長距離';
        
        const effectivenessLevel = effectiveness > 8 ? '非常に有効' :
                                 effectiveness > 3 ? '有効' :
                                 effectiveness > -3 ? '普通' : '不向き';
        
        return `${distanceCategory}(${distance}m)での${style}戦法は${effectivenessLevel}`;
    }
    
    // 展開予想分析
    static analyzePaceScenario(horses, raceDistance) {
        if (!horses || horses.length === 0) {
            return {
                scenario: 'unknown',
                favoredStyles: ['先行'],
                description: '展開予想に必要なデータが不足'
            };
        }
        
        // 各脚質の頭数をカウント
        const styleCounts = {
            '逃げ': 0,
            '先行': 0,
            '差し': 0,
            '追込': 0,
            '自在': 0
        };
        
        horses.forEach(horse => {
            const style = horse.runningStyle || '先行';
            if (styleCounts.hasOwnProperty(style)) {
                styleCounts[style]++;
            }
        });
        
        // 展開シナリオ判定
        const totalHorses = horses.length;
        const frontRunners = styleCounts['逃げ'] + styleCounts['先行'];
        const backRunners = styleCounts['差し'] + styleCounts['追込'];
        
        let scenario, favoredStyles, description;
        
        if (frontRunners / totalHorses > 0.6) {
            scenario = 'fast_pace';
            favoredStyles = ['差し', '追込'];
            description = 'ハイペースが予想され、差し・追込有利';
        } else if (backRunners / totalHorses > 0.6) {
            scenario = 'slow_pace';
            favoredStyles = ['逃げ', '先行'];
            description = 'スローペースが予想され、逃げ・先行有利';
        } else {
            scenario = 'average_pace';
            favoredStyles = ['先行', '差し'];
            description = '平均的なペースで先行・差し互角';
        }
        
        return {
            scenario,
            favoredStyles,
            styleCounts,
            frontRunners,
            backRunners,
            description
        };
    }
    
    // タイム指数計算システム（距離・馬場状態・競馬場補正済み）
    static calculateTimeIndex(raceTime, distance, trackCondition, course = '中山', trackType = '芝') {
        if (!raceTime || !distance) {
            return {
                timeIndex: 50,
                rawTime: null,
                standardTime: null,
                timeDifference: 0,
                description: 'タイムまたは距離データ不足'
            };
        }
        
        // タイムを秒に変換（1:23.4形式または83.4形式に対応）
        const timeInSeconds = this.parseRaceTime(raceTime);
        if (!timeInSeconds) {
            return {
                timeIndex: 50,
                rawTime: raceTime,
                standardTime: null,
                timeDifference: 0,
                description: 'タイム形式エラー'
            };
        }
        
        // 距離別標準タイム取得
        const standardTime = this.getStandardTime(distance, trackType);
        
        // 馬場状態補正係数
        const trackConditionFactor = this.getTrackConditionFactor(trackCondition, trackType);
        
        // 競馬場補正係数
        const courseFactor = this.getCourseFactor(course, trackType);
        
        // 補正後標準タイム計算
        const adjustedStandardTime = standardTime * trackConditionFactor * courseFactor;
        
        // タイム差計算（秒）
        const timeDifference = timeInSeconds - adjustedStandardTime;
        
        // タイム指数計算（基準値80、1秒差で±10ポイント）
        const timeIndex = Math.max(0, Math.min(120, 80 - (timeDifference * 10)));
        
        return {
            timeIndex: Math.round(timeIndex * 10) / 10, // 小数第1位まで
            rawTime: raceTime,
            timeInSeconds,
            standardTime: adjustedStandardTime,
            timeDifference: Math.round(timeDifference * 100) / 100, // 小数第2位まで
            trackConditionFactor,
            courseFactor,
            description: this.generateTimeIndexDescription(timeIndex, timeDifference, trackCondition)
        };
    }
    
    // レースタイム文字列解析（1:23.4または83.4形式）
    static parseRaceTime(timeString) {
        if (!timeString) return null;
        
        const timeStr = String(timeString).trim();
        
        // 1:23.4形式
        const minuteMatch = timeStr.match(/^(\d+):(\d+)\.(\d+)$/);
        if (minuteMatch) {
            const minutes = parseInt(minuteMatch[1]);
            const seconds = parseInt(minuteMatch[2]);
            const decimal = parseInt(minuteMatch[3]);
            return minutes * 60 + seconds + decimal / 10;
        }
        
        // 83.4形式
        const secondMatch = timeStr.match(/^(\d+)\.(\d+)$/);
        if (secondMatch) {
            const seconds = parseInt(secondMatch[1]);
            const decimal = parseInt(secondMatch[2]);
            return seconds + decimal / 10;
        }
        
        // 123.4形式（長距離）
        const longMatch = timeStr.match(/^(\d+)\.(\d+)$/);
        if (longMatch && parseInt(longMatch[1]) > 60) {
            const totalSeconds = parseInt(longMatch[1]);
            const decimal = parseInt(longMatch[2]);
            return totalSeconds + decimal / 10;
        }
        
        return null;
    }
    
    // 距離別標準タイム（芝・ダート別）
    static getStandardTime(distance, trackType) {
        const standardTimes = {
            '芝': {
                1000: 58.0,
                1200: 69.5,
                1400: 82.0,
                1600: 94.5,
                1800: 107.0,
                2000: 119.5,
                2200: 132.0,
                2400: 144.5,
                2500: 151.0,
                3000: 182.0,
                3200: 197.0
            },
            'ダート': {
                1000: 59.0,
                1200: 71.0,
                1400: 84.0,
                1600: 97.0,
                1700: 103.5,
                1800: 110.0,
                2100: 128.0,
                2400: 148.0
            }
        };
        
        const trackStandards = standardTimes[trackType] || standardTimes['芝'];
        
        // 完全一致する距離があればそれを使用
        if (trackStandards[distance]) {
            return trackStandards[distance];
        }
        
        // 線形補間で近似値を計算
        const distances = Object.keys(trackStandards).map(d => parseInt(d)).sort((a, b) => a - b);
        
        for (let i = 0; i < distances.length - 1; i++) {
            const lower = distances[i];
            const upper = distances[i + 1];
            
            if (distance >= lower && distance <= upper) {
                const ratio = (distance - lower) / (upper - lower);
                return trackStandards[lower] + (trackStandards[upper] - trackStandards[lower]) * ratio;
            }
        }
        
        // 範囲外の場合は最寄りの値を使用
        if (distance < distances[0]) {
            return trackStandards[distances[0]];
        } else {
            return trackStandards[distances[distances.length - 1]];
        }
    }
    
    // 馬場状態補正係数
    static getTrackConditionFactor(condition, trackType) {
        const factors = {
            '芝': {
                '良': 1.000,
                '稍重': 1.015,
                '重': 1.030,
                '不良': 1.050
            },
            'ダート': {
                '良': 1.000,
                '稍重': 0.995, // ダートは少し湿った方が速い場合がある
                '重': 1.010,
                '不良': 1.025
            }
        };
        
        const trackFactors = factors[trackType] || factors['芝'];
        return trackFactors[condition] || 1.000;
    }
    
    // 競馬場補正係数（高低差・カーブ・直線距離等を考慮）
    static getCourseFactor(course, trackType) {
        const factors = {
            '芝': {
                '東京': 0.995,   // 直線が長く速い
                '中山': 1.000,   // 標準
                '阪神': 0.998,   // やや速い
                '京都': 0.996,   // 速い馬場
                '新潟': 1.005,   // 直線が長いが外回りで時計がかかる
                '小倉': 1.008,   // 小回り
                '福島': 1.003,   // 標準的
                '札幌': 1.002,   // 洋芝で特殊
                '函館': 1.004,   // 小回り
                '中京': 1.001    // 標準的
            },
            'ダート': {
                '東京': 1.000,   // 標準
                '中山': 1.005,   // やや時計がかかる
                '阪神': 0.998,   // 速い
                '京都': 0.997,   // 速い
                '新潟': 1.008,   // 時計がかかる
                '小倉': 1.010,   // 小回りで時計がかかる
                '福島': 1.003,   // 標準的
                '札幌': 1.006,   // 特殊な馬場
                '函館': 1.008,   // 小回り
                '中京': 1.002    // 標準的
            }
        };
        
        const trackFactors = factors[trackType] || factors['芝'];
        return trackFactors[course] || 1.000;
    }
    
    // タイム指数説明文生成
    static generateTimeIndexDescription(timeIndex, timeDifference, trackCondition) {
        let performance;
        if (timeIndex >= 100) {
            performance = '非常に優秀';
        } else if (timeIndex >= 90) {
            performance = '優秀';
        } else if (timeIndex >= 80) {
            performance = '良好';
        } else if (timeIndex >= 70) {
            performance = '平均的';
        } else if (timeIndex >= 60) {
            performance = 'やや劣る';
        } else {
            performance = '劣る';
        }
        
        const timeDesc = timeDifference > 0 ? `標準より${timeDifference.toFixed(2)}秒遅い` :
                        timeDifference < 0 ? `標準より${Math.abs(timeDifference).toFixed(2)}秒速い` :
                        '標準タイム';
        
        return `${performance}(指数${timeIndex}) - ${timeDesc} (${trackCondition})`;
    }
    
    // 馬の過去タイム指数履歴分析
    static analyzeTimeIndexHistory(horse) {
        const timeData = [
            { time: horse.lastRaceTime, distance: horse.lastRaceDistance, condition: horse.lastRaceTrackCondition, course: horse.lastRaceCourse, trackType: horse.lastRaceTrackType },
            { time: horse.secondLastRaceTime, distance: horse.secondLastRaceDistance, condition: horse.secondLastRaceTrackCondition, course: horse.secondLastRaceCourse, trackType: horse.secondLastRaceTrackType },
            { time: horse.thirdLastRaceTime, distance: horse.thirdLastRaceDistance, condition: horse.thirdLastRaceTrackCondition, course: horse.thirdLastRaceCourse, trackType: horse.thirdLastRaceTrackType },
            { time: horse.fourthLastRaceTime, distance: horse.fourthLastRaceDistance, condition: horse.fourthLastRaceTrackCondition, course: horse.fourthLastRaceCourse, trackType: horse.fourthLastRaceTrackType },
            { time: horse.fifthLastRaceTime, distance: horse.fifthLastRaceDistance, condition: horse.fifthLastRaceTrackCondition, course: horse.fifthLastRaceCourse, trackType: horse.fifthLastRaceTrackType }
        ].filter(data => data.time && data.distance); // 有効なデータのみ
        
        if (timeData.length === 0) {
            return {
                averageTimeIndex: 80,
                timeConsistency: 'unknown',
                recentTrend: 'unknown',
                bestTimeIndex: 80,
                analysis: 'タイムデータ不足'
            };
        }
        
        // 各レースのタイム指数計算
        const timeIndices = timeData.map(data => {
            const result = this.calculateTimeIndex(data.time, data.distance, data.condition, data.course, data.trackType);
            return result.timeIndex;
        });
        
        // 統計計算
        const averageTimeIndex = timeIndices.reduce((sum, index) => sum + index, 0) / timeIndices.length;
        const bestTimeIndex = Math.max(...timeIndices);
        const variance = this.calculateVariance(timeIndices);
        
        // 一貫性評価
        let timeConsistency;
        if (variance < 25) {
            timeConsistency = 'high'; // 安定
        } else if (variance < 100) {
            timeConsistency = 'medium'; // 普通
        } else {
            timeConsistency = 'low'; // 不安定
        }
        
        // 最近のトレンド分析（直近3走）
        const recentIndices = timeIndices.slice(0, 3);
        let recentTrend = 'stable';
        if (recentIndices.length >= 2) {
            const trendSlope = (recentIndices[0] - recentIndices[recentIndices.length - 1]) / (recentIndices.length - 1);
            if (trendSlope > 3) {
                recentTrend = 'improving'; // 向上傾向
            } else if (trendSlope < -3) {
                recentTrend = 'declining'; // 悪化傾向
            }
        }
        
        const analysis = `平均指数: ${averageTimeIndex.toFixed(1)}, 最高指数: ${bestTimeIndex.toFixed(1)}, 一貫性: ${timeConsistency}, 傾向: ${recentTrend}`;
        
        return {
            averageTimeIndex: Math.round(averageTimeIndex * 10) / 10,
            timeConsistency,
            recentTrend,
            bestTimeIndex: Math.round(bestTimeIndex * 10) / 10,
            timeIndices,
            variance: Math.round(variance * 10) / 10,
            analysis
        };
    }
    
    // 統計ユーティリティ関数
    static calculateVariance(numbers) {
        if (numbers.length === 0) return 0;
        const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
        const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
        return squaredDiffs.reduce((sum, sqDiff) => sum + sqDiff, 0) / numbers.length;
    }
    
    // 包括的なレース分析レポート生成（タイム指数分析追加）
    static generateRaceAnalysisReport(horse, currentRaceLevel, raceDistance, trackType) {
        const classProgression = this.analyzeClassProgression(currentRaceLevel, horse.lastRaceLevel);
        const levelHistory = this.analyzeRaceLevelHistory(horse);
        const runningStyle = this.analyzeRunningStyle(horse, raceDistance, trackType);
        const timeIndexHistory = this.analyzeTimeIndexHistory(horse);
        
        return {
            horseName: horse.name || '不明',
            classProgression,
            levelHistory,
            runningStyle,
            timeIndexHistory,
            overallScore: this.calculateOverallAnalysisScore(classProgression, levelHistory, runningStyle, timeIndexHistory),
            recommendations: this.generateRecommendations(classProgression, levelHistory, runningStyle, timeIndexHistory)
        };
    }
    
    // 総合分析スコア計算（タイム指数分析追加）
    static calculateOverallAnalysisScore(classProgression, levelHistory, runningStyle, timeIndexHistory) {
        let score = 0;
        
        // クラス昇降級の影響
        score += classProgression.impact;
        
        // レベル履歴の影響
        if (levelHistory.levelConsistency === 'high') score += 5;
        if (levelHistory.recentTrend === 'improving') score += 8;
        if (levelHistory.recentTrend === 'declining') score -= 5;
        
        // 脚質適性の影響
        if (runningStyle && runningStyle.effectiveness) {
            score += runningStyle.effectiveness * 0.5; // 脚質効果を0.5倍で加算
        }
        
        // タイム指数の影響
        if (timeIndexHistory && timeIndexHistory.averageTimeIndex) {
            const timeBonus = (timeIndexHistory.averageTimeIndex - 80) * 0.3; // 基準値80からの差を0.3倍で加算
            score += timeBonus;
            
            // タイム指数一貫性ボーナス
            if (timeIndexHistory.timeConsistency === 'high') score += 4;
            if (timeIndexHistory.recentTrend === 'improving') score += 6;
            if (timeIndexHistory.recentTrend === 'declining') score -= 4;
            
            // 最高タイム指数ボーナス
            if (timeIndexHistory.bestTimeIndex >= 100) score += 5;
        }
        
        return Math.max(0, Math.min(100, 50 + score)); // 0-100の範囲に正規化
    }
    
    // 推奨事項生成（タイム指数分析追加）
    static generateRecommendations(classProgression, levelHistory, runningStyle, timeIndexHistory) {
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
        
        // 脚質分析の推奨事項
        if (runningStyle) {
            if (runningStyle.effectiveness > 8) {
                recommendations.push(`${runningStyle.style}戦法が今回条件に非常に適している`);
            } else if (runningStyle.effectiveness < -5) {
                recommendations.push(`${runningStyle.style}戦法は今回条件に不向き`);
            }
            
            if (runningStyle.consistency && runningStyle.consistency.level === 'very_high') {
                recommendations.push('脚質一貫性が高く戦法の信頼性あり');
            }
        }
        
        // タイム指数分析の推奨事項
        if (timeIndexHistory) {
            if (timeIndexHistory.averageTimeIndex >= 95) {
                recommendations.push('平均タイム指数が非常に高く時計の裏付けあり');
            } else if (timeIndexHistory.averageTimeIndex >= 85) {
                recommendations.push('平均タイム指数が高く好時計の実績あり');
            } else if (timeIndexHistory.averageTimeIndex <= 65) {
                recommendations.push('平均タイム指数が低く時計面で課題あり');
            }
            
            if (timeIndexHistory.bestTimeIndex >= 100) {
                recommendations.push('過去に100超の高指数を記録済み');
            }
            
            if (timeIndexHistory.timeConsistency === 'high') {
                recommendations.push('タイム指数が安定しており信頼性高い');
            }
            
            if (timeIndexHistory.recentTrend === 'improving') {
                recommendations.push('最近タイム指数向上傾向で好調');
            } else if (timeIndexHistory.recentTrend === 'declining') {
                recommendations.push('最近タイム指数悪化傾向で注意');
            }
        }
        
        return recommendations.length > 0 ? recommendations : ['標準的な評価'];
    }
}

// レース分析エンジンを予測エンジンに統合するユーティリティ
class RaceAnalysisIntegrator {
    
    // 予測エンジンにレース分析スコアを追加
    static enhancePredictionWithRaceAnalysis(horse, currentRaceLevel, raceDistance, trackType) {
        const analysis = RaceAnalysisEngine.generateRaceAnalysisReport(horse, currentRaceLevel, raceDistance, trackType);
        
        // 予測スコアに分析結果を反映
        const analysisBonus = this.convertAnalysisToScore(analysis);
        
        return {
            originalScore: horse.score || 0,
            raceAnalysisBonus: analysisBonus,
            enhancedScore: (horse.score || 0) + analysisBonus,
            raceAnalysis: analysis
        };
    }
    
    // 分析結果をスコアに変換（タイム指数分析追加）
    static convertAnalysisToScore(analysis) {
        let bonus = 0;
        
        // クラス昇降級の影響
        bonus += analysis.classProgression.impact;
        
        // レベル履歴品質ボーナス
        if (analysis.levelHistory.averageLevel > 60) bonus += 5; // 高レベル経験
        if (analysis.levelHistory.levelConsistency === 'high') bonus += 3;
        if (analysis.levelHistory.recentTrend === 'improving') bonus += 5;
        
        // 脚質適性ボーナス
        if (analysis.runningStyle && analysis.runningStyle.effectiveness) {
            bonus += analysis.runningStyle.effectiveness * 0.6; // 脚質効果を0.6倍で加算
        }
        
        // タイム指数ボーナス
        if (analysis.timeIndexHistory && analysis.timeIndexHistory.averageTimeIndex) {
            const timeBonus = (analysis.timeIndexHistory.averageTimeIndex - 80) * 0.25; // 基準値80からの差を0.25倍で加算
            bonus += timeBonus;
            
            // タイム指数一貫性・傾向ボーナス
            if (analysis.timeIndexHistory.timeConsistency === 'high') bonus += 3;
            if (analysis.timeIndexHistory.recentTrend === 'improving') bonus += 4;
            if (analysis.timeIndexHistory.recentTrend === 'declining') bonus -= 3;
            
            // 最高タイム指数ボーナス
            if (analysis.timeIndexHistory.bestTimeIndex >= 100) bonus += 4;
            if (analysis.timeIndexHistory.bestTimeIndex >= 110) bonus += 2; // 110超は追加ボーナス
        }
        
        return Math.max(-30, Math.min(30, bonus)); // ±30点の範囲で制限（タイム指数追加で範囲拡大）
    }
}