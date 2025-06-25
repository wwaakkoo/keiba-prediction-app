// タイム指数計算機能のテストスクリプト
console.log('=== タイム指数計算機能テスト ===\n');

// RaceAnalysisEngineのタイム指数計算部分を模擬実装
class TestRaceAnalysisEngine {
    // タイム文字列解析
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
        
        return null;
    }
    
    // 距離別標準タイム
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
                2400: 144.5
            },
            'ダート': {
                1000: 59.0,
                1200: 71.0,
                1400: 84.0,
                1600: 97.0,
                1800: 110.0,
                2100: 128.0,
                2400: 148.0
            }
        };
        
        const trackStandards = standardTimes[trackType] || standardTimes['芝'];
        return trackStandards[distance] || 94.5; // デフォルト1600m標準
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
                '稍重': 0.995,
                '重': 1.010,
                '不良': 1.025
            }
        };
        
        const trackFactors = factors[trackType] || factors['芝'];
        return trackFactors[condition] || 1.000;
    }
    
    // 競馬場補正係数
    static getCourseFactor(course, trackType) {
        const factors = {
            '芝': {
                '東京': 0.995,
                '中山': 1.000,
                '阪神': 0.998,
                '京都': 0.996
            },
            'ダート': {
                '東京': 1.000,
                '中山': 1.005,
                '阪神': 0.998,
                '京都': 0.997
            }
        };
        
        const trackFactors = factors[trackType] || factors['芝'];
        return trackFactors[course] || 1.000;
    }
    
    // タイム指数計算
    static calculateTimeIndex(raceTime, distance, trackCondition, course = '中山', trackType = '芝') {
        console.log(`\n--- タイム指数計算: ${raceTime} ---`);
        
        const timeInSeconds = this.parseRaceTime(raceTime);
        if (!timeInSeconds) {
            return { timeIndex: 50, error: 'タイム形式エラー' };
        }
        console.log(`解析タイム: ${timeInSeconds}秒`);
        
        const standardTime = this.getStandardTime(distance, trackType);
        console.log(`標準タイム: ${standardTime}秒 (${distance}m ${trackType})`);
        
        const trackConditionFactor = this.getTrackConditionFactor(trackCondition, trackType);
        console.log(`馬場状態補正: ${trackConditionFactor} (${trackCondition})`);
        
        const courseFactor = this.getCourseFactor(course, trackType);
        console.log(`競馬場補正: ${courseFactor} (${course})`);
        
        const adjustedStandardTime = standardTime * trackConditionFactor * courseFactor;
        console.log(`補正後標準タイム: ${adjustedStandardTime.toFixed(2)}秒`);
        
        const timeDifference = timeInSeconds - adjustedStandardTime;
        console.log(`タイム差: ${timeDifference.toFixed(2)}秒`);
        
        const timeIndex = Math.max(0, Math.min(120, 80 - (timeDifference * 10)));
        console.log(`タイム指数: ${timeIndex.toFixed(1)}`);
        
        return {
            timeIndex: Math.round(timeIndex * 10) / 10,
            timeInSeconds,
            standardTime: adjustedStandardTime,
            timeDifference: Math.round(timeDifference * 100) / 100,
            trackConditionFactor,
            courseFactor
        };
    }
}

// テストケース実行
console.log('1. 基本的なタイム指数計算テスト');

// テスト1: 1600m芝良馬場 1:36.5 (96.5秒)
const test1 = TestRaceAnalysisEngine.calculateTimeIndex('1:36.5', 1600, '良', '中山', '芝');
console.log(`結果1: 指数${test1.timeIndex} (${test1.timeDifference}秒差)`);

// テスト2: 1400mダート稍重 83.2秒
const test2 = TestRaceAnalysisEngine.calculateTimeIndex('83.2', 1400, '稍重', '東京', 'ダート');
console.log(`結果2: 指数${test2.timeIndex} (${test2.timeDifference}秒差)`);

// テスト3: 高指数を狙える好タイム 1:34.0 (94.0秒)
const test3 = TestRaceAnalysisEngine.calculateTimeIndex('1:34.0', 1600, '良', '東京', '芝');
console.log(`結果3: 指数${test3.timeIndex} (${test3.timeDifference}秒差)`);

// テスト4: 悪い時計 1:38.0 (98.0秒)
const test4 = TestRaceAnalysisEngine.calculateTimeIndex('1:38.0', 1600, '重', '中山', '芝');
console.log(`結果4: 指数${test4.timeIndex} (${test4.timeDifference}秒差)`);

console.log('\n2. タイム解析テスト');

// 各種タイム形式のテスト
const timeFormats = ['1:36.5', '96.5', '2:03.2', '123.2'];
timeFormats.forEach((time, index) => {
    const parsed = TestRaceAnalysisEngine.parseRaceTime(time);
    console.log(`形式${index + 1}: "${time}" → ${parsed}秒`);
});

console.log('\n3. 補正係数テスト');

// 馬場状態補正テスト
const conditions = ['良', '稍重', '重', '不良'];
conditions.forEach(condition => {
    const turfFactor = TestRaceAnalysisEngine.getTrackConditionFactor(condition, '芝');
    const dirtFactor = TestRaceAnalysisEngine.getTrackConditionFactor(condition, 'ダート');
    console.log(`${condition}: 芝${turfFactor} / ダート${dirtFactor}`);
});

// 競馬場補正テスト
const courses = ['東京', '中山', '阪神', '京都'];
courses.forEach(course => {
    const turfFactor = TestRaceAnalysisEngine.getCourseFactor(course, '芝');
    const dirtFactor = TestRaceAnalysisEngine.getCourseFactor(course, 'ダート');
    console.log(`${course}: 芝${turfFactor} / ダート${dirtFactor}`);
});

console.log('\n=== テスト完了 ===');
console.log('期待結果:');
console.log('- 指数80付近が標準的なタイム');
console.log('- 良いタイムほど指数が高くなる');
console.log('- 馬場状態が悪いほど補正係数が大きくなる');
console.log('- 東京競馬場は芝で速い馬場（補正係数0.995）');