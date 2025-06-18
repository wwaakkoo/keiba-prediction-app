// データ変換機能
class DataConverter {
    static loadSampleRawData() {
        const sampleData = `1	1	
消
ロードカナロア
ベラジオオペラ
エアルーティーン
(ハービンジャー)
栗東・上村  
先中9週
510kg(+2)
4.0 (1人気)
牡5鹿

横山和
58.0	
2025.04.06 阪神1
大阪杯 GI
芝2000 1:56.2 良
15頭 5番 2人 横山和生 58.0
4-4-3-3 (34.1) 508(-4)
ロードデルレイ(-0.2)

1	2	
消
ドゥラメンテ
ドゥレッツァ
モアザンセイクリッド
(More Than Ready)
美浦・尾関  
先中9週
468kg(前計不)
6.7 (4人気)
牡5青鹿

横山武
58.0	
2025.04.05 メイダン3
ドバイシー GI
芝2410 良
9頭 2番 5人 スミヨン 57.5
(0.0) 
(0.0)`;
        
        document.getElementById('rawDataInput').value = sampleData;
    }

    // netkeiba形式のデータを解析
    static parseNetkeibaData(rawData) {
        const lines = rawData.split('\n').filter(line => line.trim());
        const horses = [];
        let currentHorse = null;
        let raceInfo = null;
        
        // レース基本情報を抽出
        raceInfo = DataConverter.extractNetkeibaRaceInfo(lines);
        
        // 各馬のデータを解析
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // 新しい馬の開始を検出（枠番・馬番で始まる行）
            if (DataConverter.isNetkeibaHorseStart(line)) {
                if (currentHorse) {
                    horses.push(currentHorse);
                }
                currentHorse = DataConverter.parseNetkeibaHorseData(lines, i);
                i = currentHorse.nextIndex || i;
            }
        }
        
        if (currentHorse) {
            horses.push(currentHorse);
        }
        
        return { raceInfo, horses };
    }
    
    // netkeiba形式の馬データ開始を検出
    static isNetkeibaHorseStart(line) {
        // 枠番・馬番のパターン（例: "1	1	"）
        return /^\d+\s+\d+\s*$/.test(line);
    }
    
    // netkeiba形式の馬データを解析
    static parseNetkeibaHorseData(lines, startIndex) {
        const horse = {
            name: '',
            odds: 0,
            popularity: 0,
            jockey: '',
            lastRace: 0,
            age: 0,
            weightChange: 0,
            restDays: 0,
            lastRaceTime: '',
            lastRaceWeight: 0,
            lastRaceOdds: 0,
            lastRacePopularity: 0,
            lastRaceHorseCount: 0,
            lastRaceTrackCondition: '',
            lastRaceWeather: '',
            lastRaceWeightChange: 0,
            lastRaceJockey: '',
            lastRaceDistance: 0
        };
        
        let i = startIndex;
        let section = 'basic'; // basic, odds, jockey, lastRace
        
        while (i < lines.length) {
            const line = lines[i].trim();
            
            // 次の馬の開始を検出
            if (i > startIndex && DataConverter.isNetkeibaHorseStart(line)) {
                break;
            }
            
            // 馬名の抽出
            if (section === 'basic' && horse.name === '' && line.length > 0 && !line.includes('消') && !line.includes('kg') && !line.includes('人気')) {
                // 血統情報を除外して馬名を抽出
                if (!line.includes('(') && !line.includes('・') && !line.includes('先中') && !line.includes('差中')) {
                    horse.name = line;
                }
            }
            
            // オッズと人気の抽出
            if (line.includes('人気')) {
                const oddsMatch = line.match(/(\d+\.?\d*)\s*\((\d+)人気\)/);
                if (oddsMatch) {
                    horse.odds = parseFloat(oddsMatch[1]);
                    horse.popularity = parseInt(oddsMatch[2]);
                }
            }
            
            // 馬体重変化の抽出
            if (line.includes('kg')) {
                const weightMatch = line.match(/(\d+)kg\(([+-]?\d+)\)/);
                if (weightMatch) {
                    horse.weightChange = parseInt(weightMatch[2]);
                }
            }
            
            // 年齢の抽出
            if (line.includes('牡') || line.includes('牝') || line.includes('セ')) {
                const ageMatch = line.match(/(牡|牝|セ)(\d+)/);
                if (ageMatch) {
                    horse.age = parseInt(ageMatch[2]);
                }
            }
            
            // 騎手名の抽出
            if (line.includes('kg') && !line.includes('kg(')) {
                const jockeyMatch = line.match(/([^\s]+)\s*(\d+\.?\d*)$/);
                if (jockeyMatch) {
                    horse.jockey = jockeyMatch[1];
                }
            }
            
            // 前走情報の抽出
            if (line.match(/\d{4}\.\d{2}\.\d{2}/)) {
                const lastRaceData = DataConverter.parseNetkeibaLastRace(lines, i);
                if (lastRaceData) {
                    Object.assign(horse, lastRaceData);
                    i = lastRaceData.nextIndex || i;
                }
            }
            
            i++;
        }
        
        horse.nextIndex = i - 1;
        return horse;
    }
    
    // netkeiba形式の前走情報を解析
    static parseNetkeibaLastRace(lines, startIndex) {
        const lastRace = {};
        let i = startIndex;
        
        while (i < lines.length && i < startIndex + 10) {
            const line = lines[i].trim();
            
            // 前走着順の抽出
            if (line.includes('頭') && line.includes('番') && line.includes('人')) {
                const orderMatch = line.match(/(\d+)頭\s+(\d+)番\s+(\d+)人/);
                if (orderMatch) {
                    lastRace.lastRaceHorseCount = parseInt(orderMatch[1]);
                    lastRace.lastRace = parseInt(orderMatch[2]);
                    lastRace.lastRacePopularity = parseInt(orderMatch[3]);
                }
            }
            
            // 前走タイムの抽出
            if (line.includes('芝') && line.match(/\d+:\d+\.\d+/)) {
                const timeMatch = line.match(/(\d+):(\d+\.\d+)/);
                if (timeMatch) {
                    lastRace.lastRaceTime = `${timeMatch[1]}:${timeMatch[2]}`;
                }
                
                // 距離の抽出
                const distanceMatch = line.match(/芝(\d+)/);
                if (distanceMatch) {
                    lastRace.lastRaceDistance = parseInt(distanceMatch[1]);
                }
                
                // 馬場状態の抽出
                if (line.includes('良') || line.includes('稍重') || line.includes('重') || line.includes('不良')) {
                    if (line.includes('良')) lastRace.lastRaceTrackCondition = '良';
                    else if (line.includes('稍重')) lastRace.lastRaceTrackCondition = '稍重';
                    else if (line.includes('重')) lastRace.lastRaceTrackCondition = '重';
                    else if (line.includes('不良')) lastRace.lastRaceTrackCondition = '不良';
                }
            }
            
            i++;
        }
        
        lastRace.nextIndex = i;
        return lastRace;
    }
    
    // netkeiba形式のレース基本情報を抽出
    static extractNetkeibaRaceInfo(lines) {
        const raceInfo = {
            name: '',
            date: '',
            course: '',
            distance: '',
            trackType: '',
            trackCondition: ''
        };
        
        for (let i = 0; i < Math.min(50, lines.length); i++) {
            const line = lines[i].trim();
            
            // レース名の抽出
            if (!raceInfo.name && (line.includes('GI') || line.includes('GII') || line.includes('GIII'))) {
                raceInfo.name = line;
            }
            
            // 開催日の抽出
            if (!raceInfo.date && line.match(/\d{4}\.\d{2}\.\d{2}/)) {
                const dateMatch = line.match(/(\d{4})\.(\d{2})\.(\d{2})/);
                if (dateMatch) {
                    raceInfo.date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
                }
            }
            
            // コースの抽出
            if (!raceInfo.course) {
                const courses = ['中山', '東京', '京都', '阪神', '新潟', '福島', '中京', '小倉'];
                for (const course of courses) {
                    if (line.includes(course)) {
                        raceInfo.course = course;
                        break;
                    }
                }
            }
            
            // 距離と馬場種別の抽出
            if (!raceInfo.distance && line.includes('芝')) {
                const distanceMatch = line.match(/芝(\d+)/);
                if (distanceMatch) {
                    raceInfo.distance = distanceMatch[1];
                    raceInfo.trackType = '芝';
                }
            }
            
            // 馬場状態の抽出
            if (!raceInfo.trackCondition && (line.includes('良') || line.includes('稍重') || line.includes('重') || line.includes('不良'))) {
                if (line.includes('良')) raceInfo.trackCondition = '良';
                else if (line.includes('稍重')) raceInfo.trackCondition = '稍重';
                else if (line.includes('重')) raceInfo.trackCondition = '重';
                else if (line.includes('不良')) raceInfo.trackCondition = '不良';
            }
        }
        
        return raceInfo;
    }

    // 既存のメソッドは保持（後方互換性のため）
    static convertRawData() {
        console.log('=== convertRawDataメソッド開始 ===');
        alert('convertRawDataメソッドが呼び出されました');
        
        try {
            console.log('convertRawDataメソッドが呼び出されました');
            
            const rawData = document.getElementById('rawDataInput').value;
            console.log('convertRawData - 入力データ:', rawData);
            
            if (!rawData.trim()) {
                console.log('convertRawData - データが空です');
                alert('生データを入力してください');
                return;
            }

            console.log('convertRawData - netkeiba形式判定開始');
            // netkeiba形式かどうかを判定
            let isNetkeiba = false;
            try {
                isNetkeiba = DataConverter.isNetkeibaFormat(rawData);
                console.log('convertRawData - 形式判定結果:', isNetkeiba);
            } catch (formatError) {
                console.error('形式判定エラー:', formatError);
                isNetkeiba = false;
            }
            
            if (isNetkeiba) {
                console.log('convertRawData - netkeiba形式として処理');
                try {
                    const { raceInfo, horses } = DataConverter.parseNetkeibaData(rawData);
                    console.log('convertRawData - 解析結果:', { raceInfo, horses });
                    DataConverter.processConvertedData(raceInfo, horses);
                } catch (parseError) {
                    console.error('netkeiba解析エラー:', parseError);
                    alert('netkeibaデータの解析中にエラーが発生しました: ' + parseError.message);
                }
            } else {
                console.log('convertRawData - 既存形式として処理');
                // 既存の形式で処理（簡略化）
                const raceInfo = { name: '', date: '', course: '', distance: '', trackType: '', trackCondition: '' };
                const horses = [];
                DataConverter.processConvertedData(raceInfo, horses);
            }
        } catch (error) {
            console.error('convertRawDataメソッド内エラー:', error);
            console.error('エラースタック:', error.stack);
            alert('データ変換中にエラーが発生しました: ' + error.message);
        }
        
        console.log('=== convertRawDataメソッド終了 ===');
    }
    
    // netkeiba形式かどうかを判定
    static isNetkeibaFormat(rawData) {
        const lines = rawData.split('\n');
        // netkeiba形式の特徴: 枠番・馬番で始まる行がある
        return lines.some(line => /^\d+\s+\d+\s*$/.test(line.trim()));
    }
    
    // 変換されたデータを処理
    static processConvertedData(raceInfo, horses) {
        if (horses.length > 0) {
            // レース基本情報をUIに反映
            DataConverter.updateRaceInfoUI(raceInfo);
            
            // 馬データを追加
            horses.forEach(horse => {
                HorseManager.addHorseFromData(horse);
            });
            
            alert(`${horses.length}頭のデータを変換しました！`);
            document.getElementById('rawDataInput').value = '';
        } else {
            alert('データの変換に失敗しました。形式を確認してください。');
        }
    }

    static extractRaceInfo(lines) {
        return { name: '', date: '', course: '', distance: '', trackType: '', trackCondition: '' };
    }
    
    static isNewHorseStart(line) {
        return false;
    }
    
    static parseHorseData(lines, startIndex) {
        return { nextIndex: startIndex };
    }
    
    static parseStructuredHorseData(csvData) {
        return [];
    }
    
    static convertToCSV(horses) {
        return '';
    }
    
    static updateRaceInfoUI(raceInfo) {
        if (raceInfo.name) document.getElementById('raceName').value = raceInfo.name;
        if (raceInfo.date) document.getElementById('raceDate').value = raceInfo.date;
        if (raceInfo.course) document.getElementById('raceCourse').value = raceInfo.course;
        if (raceInfo.distance) document.getElementById('raceDistance').value = raceInfo.distance;
        if (raceInfo.trackType) document.getElementById('raceTrackType').value = raceInfo.trackType;
        if (raceInfo.trackCondition) document.getElementById('raceTrackCondition').value = raceInfo.trackCondition;
    }
    
    static applyRaceInfoToAllHorses() {
        const raceName = document.getElementById('raceName').value;
        const raceDate = document.getElementById('raceDate').value;
        const raceCourse = document.getElementById('raceCourse').value;
        const raceDistance = document.getElementById('raceDistance').value;
        const raceTrackType = document.getElementById('raceTrackType').value;
        const raceTrackCondition = document.getElementById('raceTrackCondition').value;
        
        const horses = HorseManager.getAllHorses();
        horses.forEach(horse => {
            if (raceDistance) horse.distance = parseInt(raceDistance);
            if (raceTrackType) horse.trackType = raceTrackType;
            if (raceTrackCondition) horse.trackCondition = raceTrackCondition;
        });
        
        showMessage('レース基本情報を全馬に適用しました', 'success');
    }
    
    static recalculateRestDays(raceDateParam) {
        const raceDate = raceDateParam || document.getElementById('raceDate').value;
        if (!raceDate) return;
        
        const horses = HorseManager.getAllHorses();
        horses.forEach(horse => {
            if (horse.lastRaceDate) {
                const lastDate = new Date(horse.lastRaceDate);
                const raceDateObj = new Date(raceDate);
                const diffTime = Math.abs(raceDateObj - lastDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                horse.restDays = diffDays;
            }
        });
        
        showMessage('休養日数を再計算しました', 'success');
    }
    
    static bulkInput() {
        console.log('bulkInputメソッドが呼び出されました');
        
        const rawDataInput = document.getElementById('rawDataInput');
        console.log('rawDataInput要素:', rawDataInput);
        
        if (!rawDataInput) {
            console.error('生データ入力エリアが見つかりません');
            alert('生データ入力エリアが見つかりません');
            return;
        }
        
        const rawData = rawDataInput.value;
        console.log('入力されたデータ:', rawData);
        
        if (!rawData.trim()) {
            console.log('データが空です');
            alert('生データを入力してください');
            return;
        }
        
        try {
            console.log('データ変換機能を呼び出します');
            // データ変換機能を呼び出し
            try {
                DataConverter.convertRawData();
                console.log('データ変換機能の呼び出し完了');
            } catch (convertError) {
                console.error('convertRawData呼び出しエラー:', convertError);
                alert('データ変換中にエラーが発生しました: ' + convertError.message);
            }
        } catch (error) {
            console.error('一括入力エラー:', error);
            alert('一括入力中にエラーが発生しました。');
        }
    }
}

// グローバル関数として公開
window.loadSampleRawData = DataConverter.loadSampleRawData;
window.DataConverter = DataConverter; 