// レース分析エンジン - レースレベル・展開・脚質・ペース分析
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

// ペース分析エンジン - 詳細ペース分析機能
class PaceAnalyzer {
    
    /**
     * 総合ペース分析実行
     * @param {Array} horses - 出走馬データ
     * @param {number} raceDistance - レース距離
     * @param {string} trackType - 馬場種別
     * @param {string} course - 競馬場
     * @returns {Object} 総合ペース分析結果
     */
    static analyzePaceComprehensive(horses, raceDistance, trackType, course) {
        console.log('🏃 総合ペース分析開始', { raceDistance, trackType, course });
        
        // 基本ペース予想
        const basicPaceScenario = this.predictBasicPaceScenario(horses, raceDistance);
        
        // ラップタイム分析
        const lapTimeAnalysis = this.analyzeLapTimePatterns(horses, raceDistance, trackType);
        
        // セクションタイム分析
        const sectionTimeAnalysis = this.analyzeSectionTimes(horses, raceDistance, course);
        
        // ペース変化影響分析
        const paceImpactAnalysis = this.analyzePaceChangeImpact(horses, basicPaceScenario);
        
        // 距離・馬場別ペース特性
        const trackPaceCharacteristics = this.getTrackPaceCharacteristics(raceDistance, trackType, course);
        
        // 総合ペーススコア計算
        const overallPaceScore = this.calculateOverallPaceScore({
            basicScenario: basicPaceScenario,
            lapTimeAnalysis: lapTimeAnalysis,
            sectionAnalysis: sectionTimeAnalysis,
            paceImpact: paceImpactAnalysis,
            trackCharacteristics: trackPaceCharacteristics
        });
        
        return {
            summary: {
                predictedPace: basicPaceScenario.scenario,
                favoredStyles: basicPaceScenario.favoredStyles,
                confidenceLevel: overallPaceScore.confidence,
                keyFactors: overallPaceScore.keyFactors
            },
            detailed: {
                basicScenario: basicPaceScenario,
                lapTimeAnalysis: lapTimeAnalysis,
                sectionAnalysis: sectionTimeAnalysis,
                paceImpact: paceImpactAnalysis,
                trackCharacteristics: trackPaceCharacteristics
            },
            recommendations: this.generatePaceRecommendations(overallPaceScore, basicPaceScenario),
            horseSpecificAdvice: this.generateHorseSpecificPaceAdvice(horses, overallPaceScore)
        };
    }
    
    /**
     * 基本ペースシナリオ予想（強化版）
     * @param {Array} horses - 出走馬データ
     * @param {number} raceDistance - レース距離
     * @returns {Object} ペースシナリオ予想結果
     */
    static predictBasicPaceScenario(horses, raceDistance) {
        if (!horses || horses.length === 0) {
            return {
                scenario: 'unknown',
                favoredStyles: ['先行'],
                confidence: 0,
                description: 'データ不足',
                details: {}
            };
        }
        
        // 脚質分布分析
        const styleDistribution = this.analyzeStyleDistribution(horses);
        
        // 逃げ馬・先行馬の質評価
        const frontRunnerQuality = this.evaluateFrontRunnerQuality(horses);
        
        // 距離特性考慮
        const distanceFactors = this.getDistancePaceFactors(raceDistance);
        
        // ペースシナリオ判定
        const scenario = this.determinePaceScenario(styleDistribution, frontRunnerQuality, distanceFactors);
        
        return {
            scenario: scenario.type,
            favoredStyles: scenario.favoredStyles,
            confidence: scenario.confidence,
            description: scenario.description,
            details: {
                styleDistribution,
                frontRunnerQuality,
                distanceFactors,
                reasoning: scenario.reasoning
            }
        };
    }
    
    /**
     * 脚質分布分析
     * @param {Array} horses - 出走馬データ
     * @returns {Object} 脚質分布分析結果
     */
    static analyzeStyleDistribution(horses) {
        const distribution = {
            逃げ: { count: 0, quality: 0, horses: [] },
            先行: { count: 0, quality: 0, horses: [] },
            差し: { count: 0, quality: 0, horses: [] },
            追込: { count: 0, quality: 0, horses: [] },
            自在: { count: 0, quality: 0, horses: [] }
        };
        
        horses.forEach(horse => {
            const style = horse.runningStyle || '先行';
            if (distribution[style]) {
                distribution[style].count++;
                distribution[style].quality += (horse.score || 50); // 馬の質を評価
                distribution[style].horses.push(horse.name || '不明');
            }
        });
        
        // 平均質の計算
        Object.keys(distribution).forEach(style => {
            if (distribution[style].count > 0) {
                distribution[style].quality = distribution[style].quality / distribution[style].count;
            }
        });
        
        const totalHorses = horses.length;
        const frontRunners = distribution['逃げ'].count + distribution['先行'].count;
        const backRunners = distribution['差し'].count + distribution['追込'].count;
        
        return {
            distribution,
            ratios: {
                frontRunnerRatio: frontRunners / totalHorses,
                backRunnerRatio: backRunners / totalHorses,
                flexibleRatio: distribution['自在'].count / totalHorses
            },
            dominantStyle: this.findDominantStyle(distribution),
            qualityLeader: this.findQualityLeader(distribution)
        };
    }
    
    /**
     * 逃げ・先行馬の質評価
     * @param {Array} horses - 出走馬データ
     * @returns {Object} 前方馬質評価結果
     */
    static evaluateFrontRunnerQuality(horses) {
        const frontRunners = horses.filter(horse => 
            ['逃げ', '先行'].includes(horse.runningStyle || '先行')
        );
        
        if (frontRunners.length === 0) {
            return {
                count: 0,
                averageQuality: 50,
                bestFrontRunner: null,
                competitionLevel: 'none',
                paceImpact: 'slow_pace_likely'
            };
        }
        
        const qualities = frontRunners.map(horse => horse.score || 50);
        const averageQuality = qualities.reduce((sum, q) => sum + q, 0) / qualities.length;
        const bestQuality = Math.max(...qualities);
        const bestFrontRunner = frontRunners.find(horse => (horse.score || 50) === bestQuality);
        
        // 競争レベル判定
        let competitionLevel, paceImpact;
        if (frontRunners.length >= 4 && averageQuality >= 70) {
            competitionLevel = 'very_high';
            paceImpact = 'very_fast_pace';
        } else if (frontRunners.length >= 3 && averageQuality >= 60) {
            competitionLevel = 'high';
            paceImpact = 'fast_pace';
        } else if (frontRunners.length >= 2 && averageQuality >= 50) {
            competitionLevel = 'medium';
            paceImpact = 'average_pace';
        } else {
            competitionLevel = 'low';
            paceImpact = 'slow_pace';
        }
        
        return {
            count: frontRunners.length,
            averageQuality: Math.round(averageQuality * 10) / 10,
            bestQuality,
            bestFrontRunner: bestFrontRunner ? bestFrontRunner.name : null,
            competitionLevel,
            paceImpact,
            frontRunners: frontRunners.map(h => ({ name: h.name, style: h.runningStyle, quality: h.score || 50 }))
        };
    }
    
    /**
     * 距離別ペース要因取得
     * @param {number} distance - レース距離
     * @returns {Object} 距離ペース要因
     */
    static getDistancePaceFactors(distance) {
        let category, naturalPace, paceVariability, criticalSection;
        
        if (distance <= 1200) {
            category = 'sprint';
            naturalPace = 'fast';
            paceVariability = 'low';
            criticalSection = 'start';
        } else if (distance <= 1600) {
            category = 'mile';
            naturalPace = 'moderate_fast';
            paceVariability = 'medium';
            criticalSection = 'middle';
        } else if (distance <= 2000) {
            category = 'intermediate';
            naturalPace = 'moderate';
            paceVariability = 'high';
            criticalSection = 'last_600m';
        } else {
            category = 'long';
            naturalPace = 'slow';
            paceVariability = 'very_high';
            criticalSection = 'last_800m';
        }
        
        return {
            category,
            distance,
            naturalPace,
            paceVariability,
            criticalSection,
            description: `${category}(${distance}m): 自然ペース${naturalPace}、変動性${paceVariability}`
        };
    }
    
    /**
     * ペースシナリオ決定
     * @param {Object} styleDistribution - 脚質分布
     * @param {Object} frontRunnerQuality - 前方馬質
     * @param {Object} distanceFactors - 距離要因
     * @returns {Object} ペースシナリオ
     */
    static determinePaceScenario(styleDistribution, frontRunnerQuality, distanceFactors) {
        const frontRatio = styleDistribution.ratios.frontRunnerRatio;
        const backRatio = styleDistribution.ratios.backRunnerRatio;
        const competitionLevel = frontRunnerQuality.competitionLevel;
        
        let type, favoredStyles, confidence, description, reasoning;
        
        // ハイペースシナリオ
        if ((frontRatio >= 0.5 && competitionLevel === 'very_high') || 
            (frontRatio >= 0.6 && competitionLevel === 'high')) {
            type = 'very_fast_pace';
            favoredStyles = ['差し', '追込'];
            confidence = 85;
            description = '非常にハイペースが予想される';
            reasoning = `前方馬${frontRunnerQuality.count}頭、競争激化必至`;
            
        } else if (frontRatio >= 0.4 && competitionLevel !== 'low') {
            type = 'fast_pace';
            favoredStyles = ['差し', '先行'];
            confidence = 75;
            description = 'ハイペースが予想される';
            reasoning = `前方馬の質が高く、ペースアップ必至`;
            
        // スローペースシナリオ  
        } else if (frontRatio <= 0.25 || competitionLevel === 'low') {
            type = 'slow_pace';
            favoredStyles = ['逃げ', '先行'];
            confidence = 80;
            description = 'スローペースが予想される';
            reasoning = `前方馬不足で、ペースが緩む可能性`;
            
        // 平均ペースシナリオ
        } else {
            type = 'average_pace';
            favoredStyles = ['先行', '差し'];
            confidence = 60;
            description = '平均的なペースが予想される';
            reasoning = '前方・後方バランス良く、標準的な流れ';
        }
        
        // 距離による補正
        if (distanceFactors.naturalPace === 'fast' && type !== 'very_fast_pace') {
            type = this.adjustPaceForDistance(type, 'faster');
            description += '（短距離補正）';
        } else if (distanceFactors.naturalPace === 'slow' && type !== 'slow_pace') {
            type = this.adjustPaceForDistance(type, 'slower');
            description += '（長距離補正）';
        }
        
        return {
            type,
            favoredStyles,
            confidence,
            description,
            reasoning,
            adjustedForDistance: distanceFactors.category
        };
    }
    
    /**
     * ラップタイム分析
     * @param {Array} horses - 出走馬データ
     * @param {number} raceDistance - レース距離
     * @param {string} trackType - 馬場種別
     * @returns {Object} ラップタイム分析結果
     */
    static analyzeLapTimePatterns(horses, raceDistance, trackType) {
        console.log('⏱️ ラップタイム分析開始');
        
        // 標準ラップタイム取得
        const standardLaps = this.getStandardLapTimes(raceDistance, trackType);
        
        // 出走馬の過去ラップデータ分析
        const horseAccessorData = this.analyzeHorseLapHistory(horses);
        
        // 想定ラップタイム予測
        const predictedLaps = this.predictRaceLapTimes(standardLaps, horseAccessorData, raceDistance);
        
        // ラップ変化パターン分析
        const lapVariationAnalysis = this.analyzeLapVariationPatterns(predictedLaps, raceDistance);
        
        return {
            standardLaps,
            predictedLaps,
            horseAccessorData,
            lapVariation: lapVariationAnalysis,
            keyInsights: this.generateLapTimeInsights(predictedLaps, lapVariationAnalysis),
            recommendations: this.generateLapTimeRecommendations(lapVariationAnalysis)
        };
    }
    
    /**
     * 標準ラップタイム取得
     * @param {number} distance - レース距離
     * @param {string} trackType - 馬場種別
     * @returns {Object} 標準ラップタイム
     */
    static getStandardLapTimes(distance, trackType) {
        const standardPaces = {
            '芝': {
                1200: { pace: 11.5, pattern: [11.0, 11.2, 11.5, 11.8] },
                1400: { pace: 11.7, pattern: [11.2, 11.5, 11.7, 11.8, 12.0] },
                1600: { pace: 11.8, pattern: [11.5, 11.7, 11.8, 11.9, 12.0, 12.2] },
                1800: { pace: 12.0, pattern: [11.7, 11.9, 12.0, 12.1, 12.2, 12.3, 12.5] },
                2000: { pace: 12.1, pattern: [11.8, 12.0, 12.1, 12.2, 12.3, 12.4, 12.5, 12.7] },
                2400: { pace: 12.3, pattern: [12.0, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 13.0] }
            },
            'ダート': {
                1200: { pace: 12.0, pattern: [11.5, 11.8, 12.0, 12.3] },
                1400: { pace: 12.2, pattern: [11.8, 12.0, 12.2, 12.4, 12.6] },
                1600: { pace: 12.3, pattern: [12.0, 12.2, 12.3, 12.4, 12.5, 12.7] },
                1700: { pace: 12.4, pattern: [12.1, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8] },
                1800: { pace: 12.5, pattern: [12.2, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 13.0] }
            }
        };
        
        const trackStandards = standardPaces[trackType] || standardPaces['芝'];
        const closest = this.findClosestDistance(distance, Object.keys(trackStandards));
        const standard = trackStandards[closest];
        
        if (!standard) {
            return {
                distance: distance,
                averagePace: 12.0,
                lapPattern: [12.0],
                totalSections: 1,
                description: 'データ不足により標準値使用'
            };
        }
        
        return {
            distance: distance,
            averagePace: standard.pace,
            lapPattern: standard.pattern,
            totalSections: standard.pattern.length,
            description: `${trackType}${distance}m標準ラップ`
        };
    }
    
    /**
     * セクションタイム分析
     * @param {Array} horses - 出走馬データ
     * @param {number} raceDistance - レース距離
     * @param {string} course - 競馬場
     * @returns {Object} セクションタイム分析結果
     */
    static analyzeSectionTimes(horses, raceDistance, course) {
        console.log('📏 セクションタイム分析開始');
        
        // セクション定義
        const sections = this.defineSections(raceDistance);
        
        // 各セクションの重要度分析
        const sectionImportance = this.analyzeSectionImportance(sections, course);
        
        // 馬別セクション適性分析
        const horseSectionAnalysis = this.analyzeHorseSectionFitness(horses, sections);
        
        // 重要セクション特定
        const criticalSections = this.identifyCriticalSections(sectionImportance, raceDistance);
        
        return {
            sections,
            sectionImportance,
            horseSectionAnalysis,
            criticalSections,
            insights: this.generateSectionInsights(sections, sectionImportance, criticalSections),
            recommendations: this.generateSectionRecommendations(horseSectionAnalysis, criticalSections)
        };
    }
    
    /**
     * セクション定義
     * @param {number} distance - レース距離
     * @returns {Array} セクション定義
     */
    static defineSections(distance) {
        if (distance <= 1200) {
            return [
                { name: 'スタート', from: 0, to: 200, description: '出遅れ注意' },
                { name: '前半', from: 200, to: 600, description: 'ポジション取り' },
                { name: '直線', from: 600, to: distance, description: 'ラストスパート' }
            ];
        } else if (distance <= 1600) {
            return [
                { name: 'スタート', from: 0, to: 200, description: '出遅れ注意' },
                { name: '1コーナー', from: 200, to: 400, description: 'ポジション取り' },
                { name: 'バックストレート', from: 400, to: 800, description: 'ペース維持' },
                { name: '3-4コーナー', from: 800, to: 1200, description: '仕掛け準備' },
                { name: '直線', from: 1200, to: distance, description: 'ラストスパート' }
            ];
        } else {
            return [
                { name: 'スタート', from: 0, to: 300, description: '出遅れ注意' },
                { name: '1コーナー', from: 300, to: 600, description: 'ポジション取り' },
                { name: '向正面', from: 600, to: distance * 0.5, description: 'ペース維持' },
                { name: '3コーナー', from: distance * 0.5, to: distance * 0.75, description: '我慢の時間' },
                { name: '4コーナー', from: distance * 0.75, to: distance - 400, description: '仕掛け開始' },
                { name: '直線', from: distance - 400, to: distance, description: 'ラストスパート' }
            ];
        }
    }
    
    /**
     * ペース変化影響分析
     * @param {Array} horses - 出走馬データ
     * @param {Object} paceScenario - ペースシナリオ
     * @returns {Object} ペース変化影響分析結果
     */
    static analyzePaceChangeImpact(horses, paceScenario) {
        console.log('📈 ペース変化影響分析開始');
        
        const impacts = horses.map(horse => {
            const style = horse.runningStyle || '先行';
            const baseScore = horse.score || 50;
            
            // ペースによる影響計算
            const paceImpact = this.calculatePaceImpactForHorse(style, paceScenario.scenario, baseScore);
            
            // 脚質とペースの相性
            const styleCompatibility = this.calculateStylePaceCompatibility(style, paceScenario.scenario);
            
            // 調整後スコア
            const adjustedScore = baseScore + paceImpact + styleCompatibility;
            
            return {
                horseName: horse.name || '不明',
                originalScore: baseScore,
                paceImpact,
                styleCompatibility,
                adjustedScore: Math.max(0, Math.min(100, adjustedScore)),
                expectedPerformance: this.categorizePerformance(adjustedScore),
                reasoning: this.generatePaceImpactReasoning(style, paceScenario.scenario, paceImpact)
            };
        });
        
        // 影響度順にソート
        impacts.sort((a, b) => b.adjustedScore - a.adjustedScore);
        
        return {
            horseImpacts: impacts,
            summary: this.summarizePaceImpacts(impacts),
            biggestWinners: impacts.slice(0, 3),
            biggestLosers: impacts.slice(-3).reverse(),
            overallTrend: this.analyzePaceImpactTrend(impacts)
        };
    }
    
    // ヘルパー関数群
    static findDominantStyle(distribution) {
        let maxCount = 0;
        let dominantStyle = '先行';
        
        Object.keys(distribution).forEach(style => {
            if (distribution[style].count > maxCount) {
                maxCount = distribution[style].count;
                dominantStyle = style;
            }
        });
        
        return { style: dominantStyle, count: maxCount };
    }
    
    static findQualityLeader(distribution) {
        let maxQuality = 0;
        let qualityLeader = '先行';
        
        Object.keys(distribution).forEach(style => {
            if (distribution[style].quality > maxQuality && distribution[style].count > 0) {
                maxQuality = distribution[style].quality;
                qualityLeader = style;
            }
        });
        
        return { style: qualityLeader, quality: maxQuality };
    }
    
    static adjustPaceForDistance(currentPace, direction) {
        const paceHierarchy = ['slow_pace', 'average_pace', 'fast_pace', 'very_fast_pace'];
        const currentIndex = paceHierarchy.indexOf(currentPace);
        
        if (direction === 'faster' && currentIndex < paceHierarchy.length - 1) {
            return paceHierarchy[currentIndex + 1];
        } else if (direction === 'slower' && currentIndex > 0) {
            return paceHierarchy[currentIndex - 1];
        }
        
        return currentPace;
    }
    
    static findClosestDistance(target, distances) {
        const numDistances = distances.map(d => parseInt(d));
        return numDistances.reduce((prev, curr) => 
            Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev
        ).toString();
    }
    
    static calculatePaceImpactForHorse(style, paceScenario, baseScore) {
        const impactMatrix = {
            'very_fast_pace': { '逃げ': -10, '先行': -5, '差し': +8, '追込': +12, '自在': +3 },
            'fast_pace': { '逃げ': -5, '先行': -2, '差し': +5, '追込': +8, '自在': +2 },
            'average_pace': { '逃げ': 0, '先行': +2, '差し': +1, '追込': 0, '自在': +1 },
            'slow_pace': { '逃げ': +8, '先行': +5, '差し': -3, '追込': -8, '自在': +1 }
        };
        
        return impactMatrix[paceScenario]?.[style] || 0;
    }
    
    static calculateStylePaceCompatibility(style, paceScenario) {
        // 基本的な相性に加えて、細かい補正を追加
        const compatibilityBonus = {
            'very_fast_pace': { '差し': 3, '追込': 5 },
            'fast_pace': { '差し': 2, '追込': 3 },
            'average_pace': { '先行': 2, '自在': 2 },
            'slow_pace': { '逃げ': 3, '先行': 2 }
        };
        
        return compatibilityBonus[paceScenario]?.[style] || 0;
    }
    
    static categorizePerformance(score) {
        if (score >= 85) return 'EXCELLENT';
        if (score >= 75) return 'GOOD';
        if (score >= 65) return 'AVERAGE';
        if (score >= 55) return 'BELOW_AVERAGE';
        return 'POOR';
    }
    
    static generatePaceImpactReasoning(style, paceScenario, impact) {
        if (impact > 5) {
            return `${style}戦法が${paceScenario}で大きく有利`;
        } else if (impact > 0) {
            return `${style}戦法が${paceScenario}でやや有利`;
        } else if (impact < -5) {
            return `${style}戦法が${paceScenario}で大きく不利`;
        } else if (impact < 0) {
            return `${style}戦法が${paceScenario}でやや不利`;
        } else {
            return `${style}戦法への${paceScenario}の影響は中立`;
        }
    }
    
    /**
     * 総合ペーススコア計算
     * @param {Object} analysisData - 各種分析データ
     * @returns {Object} 総合ペーススコア
     */
    static calculateOverallPaceScore(analysisData) {
        const { basicScenario, lapTimeAnalysis, sectionAnalysis, paceImpact, trackCharacteristics } = analysisData;
        
        // 信頼度計算
        let confidence = basicScenario.confidence || 60;
        
        // ラップタイム分析があれば信頼度向上
        if (lapTimeAnalysis && lapTimeAnalysis.keyInsights) {
            confidence += 10;
        }
        
        // セクション分析があれば信頼度向上
        if (sectionAnalysis && sectionAnalysis.criticalSections) {
            confidence += 5;
        }
        
        confidence = Math.min(95, confidence);
        
        // 重要要因特定
        const keyFactors = [
            basicScenario.reasoning,
            trackCharacteristics?.description || '標準的な馬場特性'
        ];
        
        return {
            confidence,
            keyFactors,
            overallRating: this.calculatePaceRating(confidence, keyFactors),
            strategicValue: this.calculateStrategicValue(paceImpact)
        };
    }
    
    /**
     * ペース推奨事項生成
     * @param {Object} overallScore - 総合スコア
     * @param {Object} basicScenario - 基本シナリオ
     * @returns {Array} 推奨事項
     */
    static generatePaceRecommendations(overallScore, basicScenario) {
        const recommendations = [];
        
        recommendations.push(`予想ペース: ${basicScenario.description}`);
        recommendations.push(`有利脚質: ${basicScenario.favoredStyles.join('・')}`);
        
        if (overallScore.confidence >= 80) {
            recommendations.push('ペース予想の信頼度が高く、脚質重視で検討');
        } else if (overallScore.confidence <= 50) {
            recommendations.push('ペース予想が不安定、他要因も重視');
        }
        
        if (basicScenario.type === 'very_fast_pace') {
            recommendations.push('超ハイペースで差し・追込の一発に期待');
        } else if (basicScenario.type === 'slow_pace') {
            recommendations.push('スローペースで逃げ・先行の粘り込みに注意');
        }
        
        return recommendations;
    }
    
    /**
     * 馬別ペースアドバイス生成
     * @param {Array} horses - 出走馬データ
     * @param {Object} overallScore - 総合スコア
     * @returns {Array} 馬別アドバイス
     */
    static generateHorseSpecificPaceAdvice(horses, overallScore) {
        return horses.slice(0, 5).map(horse => ({
            horseName: horse.name || '不明',
            style: horse.runningStyle || '先行',
            advice: this.generateIndividualPaceAdvice(horse, overallScore),
            recommendation: this.generateIndividualRecommendation(horse, overallScore)
        }));
    }
    
    // 競馬場・距離別ペース特性データ
    static getTrackPaceCharacteristics(distance, trackType, course) {
        const characteristics = {
            '東京': {
                '芝': { tendency: '標準的', description: '直線が長く差しも効く' },
                'ダート': { tendency: '標準的', description: 'バランスの良いコース' }
            },
            '中山': {
                '芝': { tendency: 'やや前有利', description: '急坂があり前粘りしやすい' },
                'ダート': { tendency: '前有利', description: '小回りで先行有利' }
            },
            '阪神': {
                '芝': { tendency: '差し有利', description: '直線が長く差しが決まりやすい' },
                'ダート': { tendency: '標準的', description: 'バランスの良いコース' }
            }
        };
        
        const courseChar = characteristics[course] || characteristics['東京'];
        const trackChar = courseChar[trackType] || courseChar['芝'];
        
        return {
            course,
            trackType,
            distance,
            tendency: trackChar.tendency,
            description: trackChar.description,
            recommended: this.getRecommendedStyleForTrack(trackChar.tendency)
        };
    }
    
    static getRecommendedStyleForTrack(tendency) {
        switch (tendency) {
            case '前有利': return ['逃げ', '先行'];
            case 'やや前有利': return ['先行', '差し'];
            case '差し有利': return ['差し', '追込'];
            default: return ['先行', '差し'];
        }
    }
    
    /**
     * 馬別過去ラップ履歴分析
     * @param {Array} horses - 出走馬データ
     * @returns {Object} 馬別ラップ履歴分析結果
     */
    static analyzeHorseLapHistory(horses) {
        console.log('🐎 馬別ラップ履歴分析開始');
        
        const horseAnalysis = horses.map(horse => {
            // 過去のラップタイムデータから傾向を分析
            const lapTendency = this.analyzeHorseLapTendency(horse);
            
            // 脚質とラップパターンの相性
            const lapStyleCompatibility = this.calculateLapStyleCompatibility(horse.runningStyle, lapTendency);
            
            // ペース対応力評価
            const paceAdaptability = this.evaluateHorsePaceAdaptability(horse, lapTendency);
            
            return {
                horseName: horse.name || '不明',
                lapTendency,
                styleCompatibility: lapStyleCompatibility,
                paceAdaptability,
                overallLapRating: this.calculateOverallLapRating(lapTendency, lapStyleCompatibility, paceAdaptability)
            };
        });
        
        return {
            horseAnalysis,
            summary: this.summarizeHorseLapAnalysis(horseAnalysis),
            topPerformers: this.identifyTopLapPerformers(horseAnalysis),
            riskFactors: this.identifyLapRiskFactors(horseAnalysis)
        };
    }
    
    /**
     * 馬のラップ傾向分析
     * @param {Object} horse - 馬データ
     * @returns {Object} ラップ傾向
     */
    static analyzeHorseLapTendency(horse) {
        // 過去のタイムデータから傾向を分析
        const pastTimes = [
            horse.lastRaceTime,
            horse.secondLastRaceTime,
            horse.thirdLastRaceTime
        ].filter(time => time);
        
        if (pastTimes.length === 0) {
            return {
                tendency: 'unknown',
                consistency: 'unknown',
                preferredPace: 'standard',
                analysis: 'ラップデータ不足'
            };
        }
        
        // 簡易ラップ分析（実際の上がり3Fがあれば使用）
        const finishTimes = [
            horse.lastRaceFinishTime,
            horse.secondLastRaceFinishTime,
            horse.thirdLastRaceFinishTime
        ].filter(time => time);
        
        let tendency, preferredPace;
        
        if (finishTimes.length > 0) {
            const avgFinishTime = this.calculateAverageFinishTime(finishTimes);
            
            if (avgFinishTime <= 33.5) {
                tendency = 'strong_finish';
                preferredPace = 'any'; // 上がりが速ければどんなペースでも対応
            } else if (avgFinishTime <= 35.0) {
                tendency = 'moderate_finish';
                preferredPace = 'moderate';
            } else {
                tendency = 'weak_finish';
                preferredPace = 'slow'; // 上がりが遅い場合はスローペース希望
            }
        } else {
            // 上がりデータがない場合は脚質から推定
            const style = horse.runningStyle || '先行';
            tendency = this.estimateTendencyFromStyle(style);
            preferredPace = this.estimatePreferredPaceFromStyle(style);
        }
        
        return {
            tendency,
            consistency: this.calculateLapConsistency(pastTimes),
            preferredPace,
            analysis: `${tendency}傾向、${preferredPace}ペース適性`,
            finishTimeAverage: finishTimes.length > 0 ? this.calculateAverageFinishTime(finishTimes) : null
        };
    }
    
    /**
     * ラップスタイル相性計算
     * @param {string} runningStyle - 脚質
     * @param {Object} lapTendency - ラップ傾向
     * @returns {Object} 相性評価
     */
    static calculateLapStyleCompatibility(runningStyle, lapTendency) {
        const style = runningStyle || '先行';
        const tendency = lapTendency.tendency;
        
        // 脚質とラップ傾向の相性マトリックス
        const compatibilityMatrix = {
            '逃げ': {
                'strong_finish': 70,    // 逃げで上がりが速いのは理想的
                'moderate_finish': 85,  // 逃げで普通の上がりは良い
                'weak_finish': 50,      // 逃げで上がりが遅いのは微妙
                'unknown': 60
            },
            '先行': {
                'strong_finish': 90,    // 先行で上がりが速いのは非常に良い
                'moderate_finish': 80,  // 先行で普通の上がりは良い
                'weak_finish': 60,      // 先行で上がりが遅いのは普通
                'unknown': 70
            },
            '差し': {
                'strong_finish': 95,    // 差しで上がりが速いのは最高
                'moderate_finish': 75,  // 差しで普通の上がりは普通
                'weak_finish': 40,      // 差しで上がりが遅いのは致命的
                'unknown': 65
            },
            '追込': {
                'strong_finish': 100,   // 追込で上がりが速いのは完璧
                'moderate_finish': 70,  // 追込で普通の上がりは普通
                'weak_finish': 30,      // 追込で上がりが遅いのは厳しい
                'unknown': 60
            },
            '自在': {
                'strong_finish': 85,    // 自在で上がりが速いのは良い
                'moderate_finish': 75,  // 自在で普通の上がりは良い
                'weak_finish': 55,      // 自在で上がりが遅いのは普通
                'unknown': 70
            }
        };
        
        const compatibility = compatibilityMatrix[style]?.[tendency] || 60;
        
        return {
            score: compatibility,
            rating: this.categorizeCompatibility(compatibility),
            description: `${style}×${tendency}の相性: ${this.categorizeCompatibility(compatibility)}`,
            recommendation: this.generateCompatibilityRecommendation(style, tendency, compatibility)
        };
    }
    
    /**
     * 馬のペース対応力評価
     * @param {Object} horse - 馬データ
     * @param {Object} lapTendency - ラップ傾向
     * @returns {Object} ペース対応力評価
     */
    static evaluateHorsePaceAdaptability(horse, lapTendency) {
        const style = horse.runningStyle || '先行';
        const tendency = lapTendency.tendency;
        const consistency = lapTendency.consistency;
        
        // 基本対応力（脚質ベース）
        let baseAdaptability = {
            '逃げ': 60,    // 逃げは自分でペースを作るので中程度
            '先行': 80,    // 先行は最も対応力が高い
            '差し': 70,    // 差しはペース次第
            '追込': 50,    // 追込はペースに依存しやすい
            '自在': 85     // 自在は最も柔軟
        }[style] || 70;
        
        // ラップ傾向による補正
        if (tendency === 'strong_finish') {
            baseAdaptability += 15; // 上がりが速いと対応力向上
        } else if (tendency === 'weak_finish') {
            baseAdaptability -= 10; // 上がりが遅いと対応力低下
        }
        
        // 一貫性による補正
        if (consistency === 'high') {
            baseAdaptability += 10; // 安定していると対応力向上
        } else if (consistency === 'low') {
            baseAdaptability -= 5;  // 不安定だと対応力低下
        }
        
        baseAdaptability = Math.max(0, Math.min(100, baseAdaptability));
        
        return {
            score: baseAdaptability,
            level: this.categorizeAdaptability(baseAdaptability),
            strengths: this.identifyPaceStrengths(style, tendency),
            weaknesses: this.identifyPaceWeaknesses(style, tendency),
            recommendation: this.generateAdaptabilityRecommendation(baseAdaptability, style)
        };
    }
    
    /**
     * 想定ラップタイム予測
     * @param {Object} standardLaps - 標準ラップ
     * @param {Object} horseData - 馬分析データ
     * @param {number} distance - レース距離
     * @returns {Object} 予測ラップタイム
     */
    static predictRaceLapTimes(standardLaps, horseData, distance) {
        console.log('⏱️ レースラップタイム予測開始');
        
        // 標準ラップをベースとして開始
        let predictedPattern = [...standardLaps.lapPattern];
        
        // 出走馬の質とペース対応力から調整
        const avgAdaptability = this.calculateAverageAdaptability(horseData);
        const topPerformers = horseData.topPerformers || [];
        
        // 全体的なペース調整
        const paceAdjustment = this.calculatePaceAdjustment(avgAdaptability, topPerformers);
        
        // 各セクションの調整
        predictedPattern = predictedPattern.map((lapTime, index) => {
            const sectionAdjustment = this.calculateSectionAdjustment(index, predictedPattern.length, paceAdjustment);
            return lapTime + sectionAdjustment;
        });
        
        // 予測の信頼度計算
        const confidence = this.calculateLapPredictionConfidence(horseData, standardLaps);
        
        return {
            predictedPattern,
            totalPredictedTime: predictedPattern.reduce((sum, lap) => sum + lap, 0),
            standardPattern: standardLaps.lapPattern,
            totalStandardTime: standardLaps.lapPattern.reduce((sum, lap) => sum + lap, 0),
            adjustment: paceAdjustment,
            confidence,
            analysis: this.generateLapPredictionAnalysis(predictedPattern, standardLaps.lapPattern, paceAdjustment)
        };
    }
    
    /**
     * ラップ変化パターン分析
     * @param {Object} predictedLaps - 予測ラップ
     * @param {number} distance - レース距離
     * @returns {Object} ラップ変化パターン分析
     */
    static analyzeLapVariationPatterns(predictedLaps, distance) {
        console.log('📊 ラップ変化パターン分析開始');
        
        const pattern = predictedLaps.predictedPattern || predictedLaps.lapPattern;
        if (!pattern || pattern.length === 0) {
            return {
                variation: 'unknown',
                pattern: 'データ不足',
                keyCharacteristics: [],
                tacticalImplications: ['パターン分析不可']
            };
        }
        
        // ラップの変化率計算
        const lapChanges = [];
        for (let i = 1; i < pattern.length; i++) {
            lapChanges.push(pattern[i] - pattern[i-1]);
        }
        
        // パターン分類
        const patternType = this.classifyLapPattern(pattern, lapChanges);
        
        // 重要区間特定
        const keySegments = this.identifyKeyLapSegments(pattern, distance);
        
        // 戦術的含意分析
        const tacticalImplications = this.analyzeLapTacticalImplications(patternType, keySegments);
        
        return {
            variation: patternType.type,
            pattern: patternType.description,
            keyCharacteristics: patternType.characteristics,
            keySegments,
            tacticalImplications,
            lapChanges,
            analysis: this.generateLapVariationAnalysis(patternType, keySegments),
            recommendations: this.generateLapPatternRecommendations(patternType, tacticalImplications)
        };
    }
    
    /**
     * ラップタイム洞察生成
     * @param {Object} predictedLaps - 予測ラップ
     * @param {Object} variation - 変化パターン
     * @returns {Array} 洞察リスト
     */
    static generateLapTimeInsights(predictedLaps, variation) {
        const insights = [];
        
        // 基本的なラップパターン洞察
        if (variation.variation === 'front_loaded') {
            insights.push('前半から積極的なペースで、後半失速の可能性');
            insights.push('前に行く馬にはプレッシャー、差し馬にはチャンス');
        } else if (variation.variation === 'back_loaded') {
            insights.push('前半抑えて後半勝負のパターン');
            insights.push('瞬発力のある馬が有利、持続力重視');
        } else if (variation.variation === 'even_pace') {
            insights.push('安定したペースで力勝負の展開');
            insights.push('基本能力の高い馬が素直に好走');
        }
        
        // 予測精度に関する洞察
        if (predictedLaps.confidence >= 80) {
            insights.push('ラップ予測の信頼度が高く、戦略立案に有効');
        } else if (predictedLaps.confidence <= 50) {
            insights.push('ラップ予測が不安定、他要因も重視が必要');
        }
        
        // 重要区間に関する洞察
        if (variation.keySegments && variation.keySegments.length > 0) {
            const criticalSegment = variation.keySegments[0];
            insights.push(`${criticalSegment.name}区間が勝負のカギ`);
        }
        
        return insights;
    }
    
    /**
     * ラップタイム推奨事項生成
     * @param {Object} variation - 変化パターン
     * @returns {Array} 推奨事項リスト
     */
    static generateLapTimeRecommendations(variation) {
        const recommendations = [];
        
        // パターン別推奨事項
        switch (variation.variation) {
            case 'front_loaded':
                recommendations.push('差し・追込馬を重視');
                recommendations.push('前に行く人気馬は割引評価');
                break;
            case 'back_loaded':
                recommendations.push('瞬発力のある馬を重視');
                recommendations.push('持続力型の馬は軽視');
                break;
            case 'even_pace':
                recommendations.push('基本能力重視の選択');
                recommendations.push('バランス型の馬を評価');
                break;
            default:
                recommendations.push('標準的な評価で臨む');
        }
        
        // 戦術的推奨事項
        if (variation.tacticalImplications) {
            recommendations.push(...variation.tacticalImplications.slice(0, 2));
        }
        
        return recommendations;
    }
    /**
     * セクション重要度分析
     * @param {Array} sections - セクション定義
     * @param {string} course - 競馬場
     * @returns {Array} 重要度付きセクション
     */
    static analyzeSectionImportance(sections, course) {
        return sections.map(section => {
            // コース特性による重要度調整
            let importance = 50; // 基本重要度
            
            // セクションタイプ別重要度
            if (section.name.includes('直線')) {
                importance = 90; // 直線は最重要
            } else if (section.name.includes('コーナー')) {
                importance = 70; // コーナーは重要
            } else if (section.name.includes('スタート')) {
                importance = 60; // スタートは中程度重要
            }
            
            // 競馬場補正
            if (course === '阪神' && section.name.includes('直線')) {
                importance += 10; // 阪神の直線は特に重要
            } else if (course === '中山' && section.name.includes('坂')) {
                importance += 15; // 中山の坂は特に重要
            }
            
            return {
                ...section,
                importance: Math.min(100, importance),
                courseAdjusted: true
            };
        });
    }
    
    /**
     * 馬別セクション適性分析
     * @param {Array} horses - 出走馬データ
     * @param {Array} sections - セクション定義
     * @returns {Array} 馬別セクション適性
     */
    static analyzeHorseSectionFitness(horses, sections) {
        return horses.map(horse => {
            const sectionFitness = sections.map(section => {
                const fitness = this.calculateSectionFitness(horse, section);
                return {
                    sectionName: section.name,
                    fitness: fitness.score,
                    rating: fitness.rating,
                    reason: fitness.reason
                };
            });
            
            return {
                horseName: horse.name || '不明',
                runningStyle: horse.runningStyle || '先行',
                sectionFitness,
                overallSectionRating: this.calculateOverallSectionRating(sectionFitness)
            };
        });
    }
    
    /**
     * 重要セクション特定
     * @param {Array} sectionImportance - 重要度付きセクション
     * @param {number} distance - レース距離
     * @returns {Array} 重要セクション
     */
    static identifyCriticalSections(sectionImportance, distance) {
        // 重要度でソートして上位3つを抽出
        const sorted = [...sectionImportance].sort((a, b) => b.importance - a.importance);
        return sorted.slice(0, 3).map(section => ({
            ...section,
            criticalReason: this.generateCriticalReason(section, distance)
        }));
    }
    
    /**
     * セクション洞察生成
     * @param {Array} sections - セクション定義
     * @param {Array} importance - 重要度分析
     * @param {Array} critical - 重要セクション
     * @returns {Array} セクション洞察
     */
    static generateSectionInsights(sections, importance, critical) {
        const insights = [];
        
        if (critical.length > 0) {
            const topCritical = critical[0];
            insights.push(`${topCritical.name}が最重要セクション（重要度${topCritical.importance}）`);
            insights.push(topCritical.criticalReason);
        }
        
        // 全セクションの平均重要度
        const avgImportance = importance.reduce((sum, s) => sum + s.importance, 0) / importance.length;
        if (avgImportance >= 70) {
            insights.push('全体的に重要度の高いセクションが多く、技術的なレース');
        } else if (avgImportance <= 50) {
            insights.push('セクション毎の重要度差が小さく、総合力勝負');
        }
        
        return insights;
    }
    
    /**
     * セクション推奨事項生成
     * @param {Array} horseAnalysis - 馬別セクション分析
     * @param {Array} critical - 重要セクション
     * @returns {Array} セクション推奨事項
     */
    static generateSectionRecommendations(horseAnalysis, critical) {
        const recommendations = [];
        
        if (critical.length > 0 && horseAnalysis.length > 0) {
            const topSection = critical[0];
            
            // 重要セクションに適性の高い馬を特定
            const topFitHorses = horseAnalysis
                .filter(h => h.sectionFitness.length > 0)
                .map(h => ({
                    name: h.horseName,
                    fitness: h.sectionFitness.find(s => s.sectionName === topSection.name)?.fitness || 0
                }))
                .filter(h => h.fitness >= 70)
                .sort((a, b) => b.fitness - a.fitness);
            
            if (topFitHorses.length > 0) {
                recommendations.push(`${topSection.name}適性: ${topFitHorses.slice(0, 3).map(h => h.name).join('・')}が有利`);
            }
        }
        
        recommendations.push('セクション適性も考慮した馬選びを推奨');
        return recommendations;
    }
    
    // ペース影響分析ヘルパー関数群
    static summarizePaceImpacts(impacts) {
        const avgAdjustment = impacts.reduce((sum, h) => sum + (h.adjustedScore - h.originalScore), 0) / impacts.length;
        const significantChanges = impacts.filter(h => Math.abs(h.adjustedScore - h.originalScore) >= 5).length;
        
        return {
            averageAdjustment: Math.round(avgAdjustment * 10) / 10,
            significantChanges,
            trend: avgAdjustment > 2 ? 'pace_favorable' : avgAdjustment < -2 ? 'pace_unfavorable' : 'neutral',
            description: `平均${avgAdjustment > 0 ? '+' : ''}${avgAdjustment}pt調整、${significantChanges}頭が大きく変動`
        };
    }
    
    static analyzePaceImpactTrend(impacts) {
        const positivChanges = impacts.filter(h => h.adjustedScore > h.originalScore).length;
        const negativeChanges = impacts.filter(h => h.adjustedScore < h.originalScore).length;
        
        if (positivChanges > negativeChanges * 1.5) return 'mostly_positive';
        if (negativeChanges > positivChanges * 1.5) return 'mostly_negative';
        return 'mixed';
    }
    
    static calculatePaceRating(confidence, factors) {
        if (confidence >= 85) return 'VERY_HIGH';
        if (confidence >= 75) return 'HIGH';
        if (confidence >= 60) return 'MEDIUM';
        return 'LOW';
    }
    
    static calculateStrategicValue(paceImpact) {
        if (!paceImpact || !paceImpact.summary) return 'standard';
        
        const avgAdjustment = Math.abs(paceImpact.summary.averageAdjustment || 0);
        const significantChanges = paceImpact.summary.significantChanges || 0;
        
        if (avgAdjustment >= 3 && significantChanges >= 3) return 'very_valuable';
        if (avgAdjustment >= 2 || significantChanges >= 2) return 'valuable';
        return 'standard';
    }
    
    static generateIndividualPaceAdvice(horse, score) {
        const style = horse.runningStyle || '先行';
        const confidence = score.confidence || 60;
        
        if (confidence >= 80) {
            return `${style}戦法でペース分析を重視して検討`;
        } else {
            return `${style}戦法でペース参考程度に検討`;
        }
    }
    
    static generateIndividualRecommendation(horse, score) {
        const confidence = score.confidence || 60;
        
        if (confidence >= 80) {
            return 'ペース分析結果を重視した評価を推奨';
        } else if (confidence <= 50) {
            return 'ペース分析は参考程度、他要因重視を推奨';
        } else {
            return 'ペース適性を適度に考慮して検討';
        }
    }
    
    // 新しいヘルパー関数群（ラップタイム分析関連）
    static calculateAverageFinishTime(finishTimes) {
        const validTimes = finishTimes.filter(time => time && !isNaN(parseFloat(time)));
        if (validTimes.length === 0) return 35.0; // デフォルト値
        
        const numericTimes = validTimes.map(time => parseFloat(time));
        return numericTimes.reduce((sum, time) => sum + time, 0) / numericTimes.length;
    }
    
    static estimateTendencyFromStyle(style) {
        const tendencyMap = {
            '逃げ': 'moderate_finish',
            '先行': 'moderate_finish', 
            '差し': 'strong_finish',
            '追込': 'strong_finish',
            '自在': 'moderate_finish'
        };
        return tendencyMap[style] || 'moderate_finish';
    }
    
    static estimatePreferredPaceFromStyle(style) {
        const paceMap = {
            '逃げ': 'slow',
            '先行': 'moderate',
            '差し': 'fast',
            '追込': 'fast',
            '自在': 'any'
        };
        return paceMap[style] || 'moderate';
    }
    
    static calculateLapConsistency(pastTimes) {
        if (pastTimes.length < 2) return 'unknown';
        // 簡易的な一貫性計算（実装を簡略化）
        return pastTimes.length >= 3 ? 'high' : 'medium';
    }
    
    static categorizeCompatibility(score) {
        if (score >= 90) return '非常に良い';
        if (score >= 80) return '良い';
        if (score >= 70) return '普通';
        if (score >= 60) return 'やや悪い';
        return '悪い';
    }
    
    static categorizeAdaptability(score) {
        if (score >= 85) return 'VERY_HIGH';
        if (score >= 70) return 'HIGH';
        if (score >= 55) return 'MEDIUM';
        if (score >= 40) return 'LOW';
        return 'VERY_LOW';
    }
    
    static calculateOverallLapRating(tendency, compatibility, adaptability) {
        const tendencyScore = tendency.tendency === 'strong_finish' ? 80 : 
                            tendency.tendency === 'moderate_finish' ? 60 : 40;
        return Math.round((tendencyScore + compatibility.score + adaptability.score) / 3);
    }
    
    static summarizeHorseLapAnalysis(analysis) {
        const avgRating = analysis.reduce((sum, h) => sum + (h.overallLapRating || 50), 0) / analysis.length;
        return {
            averageRating: Math.round(avgRating),
            totalHorses: analysis.length,
            highPerformers: analysis.filter(h => (h.overallLapRating || 0) >= 75).length
        };
    }
    
    static identifyTopLapPerformers(analysis) {
        return analysis
            .filter(h => (h.overallLapRating || 0) >= 75)
            .sort((a, b) => (b.overallLapRating || 0) - (a.overallLapRating || 0))
            .slice(0, 3);
    }
    
    static identifyLapRiskFactors(analysis) {
        return analysis
            .filter(h => (h.overallLapRating || 100) <= 40)
            .map(h => ({ name: h.horseName, risk: 'ラップ適性不安' }));
    }
    
    // その他のヘルパー関数
    static calculateSectionFitness(horse, section) {
        const style = horse.runningStyle || '先行';
        let score = 50; // 基本スコア
        
        // セクション別適性
        if (section.name.includes('直線')) {
            const finishStrength = {
                '逃げ': 60, '先行': 75, '差し': 90, '追込': 95, '自在': 80
            };
            score = finishStrength[style] || 70;
        } else if (section.name.includes('コーナー')) {
            const cornerAbility = {
                '逃げ': 80, '先行': 85, '差し': 70, '追込': 60, '自在': 85
            };
            score = cornerAbility[style] || 70;
        }
        
        return {
            score,
            rating: score >= 80 ? 'HIGH' : score >= 60 ? 'MEDIUM' : 'LOW',
            reason: `${style}の${section.name}適性`
        };
    }
    
    static calculateOverallSectionRating(sectionFitness) {
        if (sectionFitness.length === 0) return 50;
        const avgFitness = sectionFitness.reduce((sum, s) => sum + s.fitness, 0) / sectionFitness.length;
        return Math.round(avgFitness);
    }
    
    static generateCriticalReason(section, distance) {
        if (section.name.includes('直線')) {
            return `${distance}mでは直線でのスパート力が重要`;
        } else if (section.name.includes('コーナー')) {
            return 'コーナーでのポジション取りが勝負を左右';
        } else {
            return 'このセクションでの対応が重要なポイント';
        }
    }
    
    // 追加のラップタイム分析ヘルパー関数群
    static calculateAverageAdaptability(horseData) {
        if (!horseData || !horseData.horseAnalysis) return 60;
        
        const analysis = horseData.horseAnalysis;
        const avgAdaptability = analysis.reduce((sum, h) => sum + (h.paceAdaptability?.score || 60), 0) / analysis.length;
        return avgAdaptability;
    }
    
    static calculatePaceAdjustment(avgAdaptability, topPerformers) {
        let adjustment = 0;
        
        // 平均ペース対応力による調整
        if (avgAdaptability >= 80) {
            adjustment = -0.1; // 対応力が高いとややペースアップ
        } else if (avgAdaptability <= 50) {
            adjustment = 0.1;  // 対応力が低いとペースダウン
        }
        
        // トップパフォーマーの影響
        if (topPerformers.length >= 3) {
            adjustment -= 0.05; // 有力馬が多いとペースアップ傾向
        }
        
        return adjustment;
    }
    
    static calculateSectionAdjustment(index, totalSections, paceAdjustment) {
        // 前半により大きな調整を適用
        const positionRatio = index / (totalSections - 1);
        const frontWeight = 1.5 - positionRatio; // 前半1.5倍、後半0.5倍
        
        return paceAdjustment * frontWeight;
    }
    
    static calculateLapPredictionConfidence(horseData, standardLaps) {
        let confidence = 60; // 基本信頼度
        
        // 馬データの質による調整
        if (horseData && horseData.summary) {
            const summary = horseData.summary;
            if (summary.highPerformers >= 3) confidence += 15;
            if (summary.averageRating >= 70) confidence += 10;
        }
        
        // 標準ラップデータの信頼性
        if (standardLaps.totalSections >= 4) confidence += 5;
        
        return Math.min(90, confidence);
    }
    
    static generateLapPredictionAnalysis(predicted, standard, adjustment) {
        const totalDiff = predicted.reduce((sum, lap) => sum + lap, 0) - 
                         standard.reduce((sum, lap) => sum + lap, 0);
        
        let analysis = '';
        if (Math.abs(totalDiff) < 0.5) {
            analysis = '標準的なラップパターンを予想';
        } else if (totalDiff > 0) {
            analysis = `標準より${totalDiff.toFixed(1)}秒遅いペースを予想`;
        } else {
            analysis = `標準より${Math.abs(totalDiff).toFixed(1)}秒速いペースを予想`;
        }
        
        return `${analysis}（調整値: ${adjustment >= 0 ? '+' : ''}${adjustment}）`;
    }
    
    static classifyLapPattern(pattern, lapChanges) {
        if (lapChanges.length === 0) {
            return {
                type: 'unknown',
                description: 'パターン不明',
                characteristics: []
            };
        }
        
        // 前半・後半の変化を分析
        const midPoint = Math.floor(lapChanges.length / 2);
        const frontHalfChanges = lapChanges.slice(0, midPoint);
        const backHalfChanges = lapChanges.slice(midPoint);
        
        const frontAvgChange = frontHalfChanges.reduce((sum, c) => sum + c, 0) / frontHalfChanges.length;
        const backAvgChange = backHalfChanges.reduce((sum, c) => sum + c, 0) / backHalfChanges.length;
        
        let type, description, characteristics;
        
        if (frontAvgChange > 0.2 && backAvgChange > 0.1) {
            type = 'front_loaded';
            description = '前半積極的・後半失速型';
            characteristics = ['前半ハイペース', '後半ペースダウン', '差し有利'];
        } else if (frontAvgChange < -0.1 && backAvgChange < -0.2) {
            type = 'back_loaded';
            description = '前半抑制・後半加速型';
            characteristics = ['前半スロー', '後半ペースアップ', '瞬発力重視'];
        } else if (Math.abs(frontAvgChange) < 0.1 && Math.abs(backAvgChange) < 0.1) {
            type = 'even_pace';
            description = '安定ペース・力勝負型';
            characteristics = ['一定ペース', '力勝負', '基本能力重視'];
        } else {
            type = 'mixed_pace';
            description = '変則ペース・展開次第型';
            characteristics = ['変則的', '展開依存', '適応力重要'];
        }
        
        return { type, description, characteristics };
    }
    
    static identifyKeyLapSegments(pattern, distance) {
        const segments = [];
        
        // 最速・最遅ラップの特定
        const maxLapIndex = pattern.indexOf(Math.max(...pattern));
        const minLapIndex = pattern.indexOf(Math.min(...pattern));
        
        if (maxLapIndex !== -1) {
            segments.push({
                name: `セクション${maxLapIndex + 1}`,
                type: 'slowest',
                value: pattern[maxLapIndex],
                importance: 80,
                description: '最もペースが緩んだ区間'
            });
        }
        
        if (minLapIndex !== -1 && minLapIndex !== maxLapIndex) {
            segments.push({
                name: `セクション${minLapIndex + 1}`,
                type: 'fastest',
                value: pattern[minLapIndex],
                importance: 90,
                description: '最もペースが上がった区間'
            });
        }
        
        // 最終セクション（ラストスパート）
        if (pattern.length > 0) {
            segments.push({
                name: '最終セクション',
                type: 'finish',
                value: pattern[pattern.length - 1],
                importance: 95,
                description: 'ラストスパート区間'
            });
        }
        
        return segments.sort((a, b) => b.importance - a.importance);
    }
    
    static analyzeLapTacticalImplications(patternType, keySegments) {
        const implications = [];
        
        // パターン別戦術的含意
        switch (patternType.type) {
            case 'front_loaded':
                implications.push('前に行く馬は後半苦しくなる可能性');
                implications.push('差し・追込馬の一発に期待');
                implications.push('人気薄の差し馬が狙い目');
                break;
            case 'back_loaded':
                implications.push('前半我慢できる馬が有利');
                implications.push('瞬発力のある馬を重視');
                implications.push('持続力型の馬は軽視');
                break;
            case 'even_pace':
                implications.push('基本能力の高い馬が素直に好走');
                implications.push('人気馬の信頼度が高い');
                implications.push('堅実な馬券戦略が有効');
                break;
            case 'mixed_pace':
                implications.push('展開に左右されやすい');
                implications.push('位置取りの巧い騎手が重要');
                implications.push('予想が困難、穴馬にもチャンス');
                break;
        }
        
        // 重要セクション別含意
        if (keySegments.length > 0) {
            const topSegment = keySegments[0];
            if (topSegment.type === 'finish') {
                implications.push('ラストスパート力が勝負の決め手');
            } else if (topSegment.type === 'fastest') {
                implications.push(`${topSegment.name}でのペースアップが鍵`);
            }
        }
        
        return implications;
    }
    
    static generateLapVariationAnalysis(patternType, keySegments) {
        let analysis = `${patternType.description}のパターンを予想。`;
        
        if (keySegments.length > 0) {
            const criticalSegment = keySegments[0];
            analysis += `特に${criticalSegment.description}が重要。`;
        }
        
        analysis += `戦術的には${patternType.characteristics.join('・')}の要素が重要。`;
        
        return analysis;
    }
    
    static generateLapPatternRecommendations(patternType, tacticalImplications) {
        const recommendations = [];
        
        // パターン別基本推奨
        recommendations.push(`パターン: ${patternType.description}`);
        
        // 主要な戦術的含意を推奨事項として追加
        if (tacticalImplications.length > 0) {
            recommendations.push(...tacticalImplications.slice(0, 3));
        }
        
        return recommendations;
    }
    
    // 相性・適応性評価のヘルパー関数群
    static generateCompatibilityRecommendation(style, tendency, compatibility) {
        if (compatibility >= 90) {
            return `${style}×${tendency}は理想的な組み合わせ`;
        } else if (compatibility >= 70) {
            return `${style}×${tendency}は良好な相性`;
        } else if (compatibility <= 50) {
            return `${style}×${tendency}の相性に不安あり`;
        } else {
            return `${style}×${tendency}は標準的な相性`;
        }
    }
    
    static identifyPaceStrengths(style, tendency) {
        const strengths = [];
        
        if (style === '差し' && tendency === 'strong_finish') {
            strengths.push('強力な末脚');
            strengths.push('ペース対応力');
        } else if (style === '先行' && tendency === 'moderate_finish') {
            strengths.push('安定した先行力');
            strengths.push('バランス良い能力');
        } else if (style === '逃げ' && tendency === 'moderate_finish') {
            strengths.push('逃げ切り能力');
            strengths.push('自分のペース作り');
        }
        
        return strengths.length > 0 ? strengths : ['標準的な能力'];
    }
    
    static identifyPaceWeaknesses(style, tendency) {
        const weaknesses = [];
        
        if (style === '追込' && tendency === 'weak_finish') {
            weaknesses.push('末脚不足');
            weaknesses.push('ペース依存');
        } else if (style === '差し' && tendency === 'weak_finish') {
            weaknesses.push('決め手不足');
        } else if (style === '逃げ' && tendency === 'weak_finish') {
            weaknesses.push('持続力不足');
        }
        
        return weaknesses.length > 0 ? weaknesses : ['特筆すべき弱点なし'];
    }
    
    static generateAdaptabilityRecommendation(score, style) {
        if (score >= 85) {
            return `${style}戦法でペース変化に柔軟対応可能`;
        } else if (score >= 70) {
            return `${style}戦法で一定のペース対応力あり`;
        } else if (score <= 45) {
            return `${style}戦法でペース変化に注意が必要`;
        } else {
            return `${style}戦法で標準的なペース対応力`;
        }
    }
}