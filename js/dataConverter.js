// データ変換機能
class DataConverter {
    static loadSampleRawData() {
        const sampleData = `枠1白	1	
ベラジオオペラ	
4.0
(1番人気)
510kg(+2)
林田 祥来

上村 洋行(栗東)

父：ロードカナロア
母：エアルーティーン
(母の父：ハービンジャー)
勝負服の画像

牡5/鹿

58.0kg

横山 和生

118
I,L

2025年4月6日	阪神
大阪杯	GⅠ
1着	15頭5番
2番人気
横山 和生	58.0kg
2000芝	
1:56.2

良
118	
508kg

4	4	3	3
3F 34.1
ロードデルレイ(0.2)`;
        
        document.getElementById('rawDataInput').value = sampleData;
    }

    static convertRawData() {
        const rawData = document.getElementById('rawDataInput').value;
        if (!rawData.trim()) {
            alert('生データを入力してください');
            return;
        }

        try {
            const { raceInfo, horses } = DataConverter.tRawData(rawData);
            const csvData = DataConverter.convertHorsesToCSV(horses);
            
            if (csvData && horses.length > 0) {
                document.getElementById('bulkInput').value = csvData;
                alert(`${horses.length}頭のデータをCSV形式に変換しました！`);
                document.getElementById('rawDataInput').value = '';
            } else {
                alert('データの変換に失敗しました。形式を確認してください。');
            }
        } catch (error) {
            console.error('変換エラー:', error);
            alert('データの変換中にエラーが発生しました。');
        }
    }

    static convertRawData(rawData) {
        // null/undefinedチェック
        if (!rawData || typeof rawData !== 'string') {
            throw new Error('有効なデータが入力されていません');
        }
        
        const lines = rawData.split('\n').filter(line => line.trim());
        const horses = [];
        let currentHorse = null;
        let raceInfo = null;
        
        // レース基本情報を最初に抽出
        raceInfo = DataConverter.extractRaceInfo(lines);
        
        // レース基本情報をUIに反映
        DataConverter.updateRaceInfoUI(raceInfo);
        
        // ヘッダー行をスキップ
        let startIndex = 0;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('枠') && lines[i].includes('馬番') && lines[i].includes('馬名')) {
                startIndex = i + 1;
                break;
            }
        }
        
        // 各馬のデータを解析
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // 新しい馬の開始を検出（枠番で始まる行）
            if (DataConverter.isNewHorseStart(line)) {
                if (currentHorse) {
                    horses.push(currentHorse);
                }
                currentHorse = DataConverter.parseHorseData(lines, i);
                i = currentHorse.nextIndex || i;
            }
        }
        
        if (currentHorse) {
            horses.push(currentHorse);
        }
        
        // レース基本情報を全馬に適用
        horses.forEach(horse => {
            if (raceInfo.distance) horse.distance = parseInt(raceInfo.distance);
            if (raceInfo.trackType) horse.trackType = raceInfo.trackType;
            if (raceInfo.trackCondition) horse.trackCondition = raceInfo.trackCondition;
        });
        
        return {
            raceInfo: raceInfo,
            horses: horses
        };
    }
    
    static extractRaceInfo(lines) {
        // レース名、開催日、コース、距離、馬場種別、馬場状態を抽出
        let raceName = '';
        let raceDate = '';
        let course = '';
        let distance = '';
        let trackType = '';
        let trackCondition = '';
        
        console.log('レース基本情報抽出開始');
        
        for (let i = 0; i < Math.min(100, lines.length); i++) {
            const line = lines[i].trim();
            
            // レース名の抽出（GⅠ、GⅡ、GⅢ、OP、1600m等のパターン）
            if (!raceName && (line.includes('GⅠ') || line.includes('GⅡ') || line.includes('GⅢ') || 
                             line.includes('OP') || line.includes('1600') || line.includes('2000') || 
                             line.includes('2400') || line.includes('3200'))) {
                raceName = line;
                console.log(`レース名設定: ${raceName}`);
            }
            
            // 開催日の抽出（YYYY年MM月DD日のパターン）
            if (!raceDate && /\d{4}年\d{1,2}月\d{1,2}日/.test(line)) {
                const dateMatch = line.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
                if (dateMatch) {
                    const year = dateMatch[1];
                    const month = dateMatch[2].padStart(2, '0');
                    const day = dateMatch[3].padStart(2, '0');
                    raceDate = `${year}-${month}-${day}`;
                    console.log(`開催日設定: ${raceDate}`);
                }
            }
            
            // コースの抽出
            if (!course) {
                const courses = ['中山', '東京', '京都', '阪神', '新潟', '福島', '中京', '小倉'];
                for (const courseName of courses) {
                    if (line.includes(courseName)) {
                        course = courseName;
                        console.log(`コース設定: ${course}`);
                        break;
                    }
                }
            }
            
            // 距離の抽出（より詳細なパターン）
            if (!distance) {
                // 芝の距離パターン
                const distanceMatch = line.match(/(\d{3,4})芝/);
                if (distanceMatch) {
                    distance = distanceMatch[1];
                    trackType = '芝';
                    console.log(`距離設定: ${distance}m (芝)`);
                } else {
                    // ダートの距離パターン
                    const dirtMatch = line.match(/(\d{3,4})ダート/);
                    if (dirtMatch) {
                        distance = dirtMatch[1];
                        trackType = 'ダート';
                        console.log(`距離設定: ${distance}m (ダート)`);
                    } else {
                        // 単純な距離パターン
                        const simpleMatch = line.match(/(\d{3,4})m/);
                        if (simpleMatch) {
                            distance = simpleMatch[1];
                            console.log(`距離設定: ${distance}m`);
                        }
                    }
                }
            }
            
            // 馬場種別の抽出（距離と一緒に抽出されていない場合）
            if (!trackType && (line.includes('芝') || line.includes('ダート'))) {
                if (line.includes('芝')) {
                    trackType = '芝';
                    console.log(`馬場種別設定: 芝`);
                } else if (line.includes('ダート')) {
                    trackType = 'ダート';
                    console.log(`馬場種別設定: ダート`);
                }
            }
            
            // 馬場状態の抽出
            if (!trackCondition && (line.includes('良') || line.includes('稍重') || 
                                   line.includes('重') || line.includes('不良'))) {
                if (line.includes('良')) {
                    trackCondition = '良';
                    console.log(`馬場状態設定: 良`);
                } else if (line.includes('稍重')) {
                    trackCondition = '稍重';
                    console.log(`馬場状態設定: 稍重`);
                } else if (line.includes('重')) {
                    trackCondition = '重';
                    console.log(`馬場状態設定: 重`);
                } else if (line.includes('不良')) {
                    trackCondition = '不良';
                    console.log(`馬場状態設定: 不良`);
                }
            }
        }
        
        const raceInfo = {
            raceName: raceName,
            raceDate: raceDate,
            course: course,
            distance: distance,
            trackType: trackType,
            trackCondition: trackCondition
        };
        
        console.log('レース基本情報抽出結果:', raceInfo);
        return raceInfo;
    }
    
    static isNewHorseStart(line) {
        // 枠番で始まる行を新しい馬の開始として検出
        return /^枠\d+/.test(line);
    }
    
    static parseHorseData(lines, startIndex) {
        const horse = {
            name: '',
            odds: 10,
            lastRace: 6,
            jockey: '',
            age: 5,
            weightChange: 0,
            course: '中山', // 今回のレースのコース（デフォルト）
            distance: 1600, // 今回のレースの距離（デフォルト）
            trackType: '芝', // 今回のレースの馬場種別（デフォルト）
            weather: '晴', // 今回のレースの天気（デフォルト）
            trackCondition: '良', // 今回のレースの馬場状態（デフォルト）
            restDays: 14,
            lastRaceCourse: '', // 前走のコース
            lastRaceDistance: '', // 前走の距離
            lastRaceTrackType: '', // 前走の馬場種別
            lastRaceDate: '' // 前走日
        };
        
        let currentIndex = startIndex;
        
        // デバッグ用：現在の行をログ出力
        console.log(`解析開始: ${lines[currentIndex]}`);
        
        // 枠番と馬番をスキップ
        currentIndex++;
        
        // 馬名の抽出（枠番の次の行）
        if (currentIndex < lines.length) {
            const nameLine = lines[currentIndex].trim();
            console.log(`馬名候補: "${nameLine}"`);
            
            if (nameLine && !nameLine.includes('kg') && !nameLine.includes('番人気') && 
                !nameLine.includes('父：') && !nameLine.includes('母：') && 
                !nameLine.includes('牡') && !nameLine.includes('牝') && 
                !nameLine.includes('せん') && !nameLine.includes('枠') &&
                !/^\d+\.\d+$/.test(nameLine) && !/^\d+$/.test(nameLine) &&
                nameLine.length > 1 && nameLine.length < 30 &&
                !nameLine.includes('ブリンカー着用')) {
                
                // ブリンカー着用を含む場合は除去
                let horseName = nameLine;
                if (horseName.includes('ブリンカー着用')) {
                    horseName = horseName.replace('ブリンカー着用', '').trim();
                    console.log(`ブリンカー着用を除去: "${horseName}"`);
                }
                
                if (horseName.length > 0) {
                    horse.name = horseName;
                    console.log(`馬名設定: ${horse.name}`);
                }
            }
        }
        currentIndex++;
        
        // ブリンカー着用が改行されている場合の対応
        if (currentIndex < lines.length) {
            const nextLine = lines[currentIndex].trim();
            console.log(`次の行候補: "${nextLine}"`);
            
            // ブリンカー着用の行の次の行が馬名の可能性
            if (nextLine && 
                !nextLine.includes('kg') && 
                !nextLine.includes('番人気') && 
                !nextLine.includes('父：') && 
                !nextLine.includes('母：') && 
                !nextLine.includes('牡') && 
                !nextLine.includes('牝') && 
                !nextLine.includes('せん') && 
                !nextLine.includes('枠') &&
                !/^\d+\.\d+$/.test(nextLine) && 
                !/^\d+$/.test(nextLine) &&
                nextLine.length > 1 && 
                nextLine.length < 30 &&
                !nextLine.includes('ブリンカー着用') &&
                !nextLine.includes('年') &&
                !nextLine.includes('月') &&
                !nextLine.includes('日') &&
                !nextLine.includes('GⅠ') &&
                !nextLine.includes('GⅡ') &&
                !nextLine.includes('GⅢ') &&
                !nextLine.includes('OP')) {
                
                // 前の行がブリンカー着用だった場合
                const prevLine = lines[currentIndex - 1]?.trim();
                if (prevLine && prevLine.includes('ブリンカー着用')) {
                    horse.name = nextLine;
                    console.log(`✅ 改行された馬名設定: ${horse.name} (ブリンカー着用の次の行)`);
                    currentIndex++;
                }
            }
        }
        
        // オッズの抽出
        for (let i = currentIndex; i < Math.min(currentIndex + 10, lines.length); i++) {
            const currentLine = lines[i].trim();
            console.log(`オッズ候補: "${currentLine}"`);
            
            if (/^\d+\.\d+$/.test(currentLine)) {
                horse.odds = parseFloat(currentLine);
                console.log(`オッズ設定: ${horse.odds}`);
                currentIndex = i + 1;
                break;
            }
        }
        
        // 馬体重変化の抽出
        for (let i = currentIndex; i < Math.min(currentIndex + 15, lines.length); i++) {
            const currentLine = lines[i].trim();
            console.log(`馬体重候補: "${currentLine}"`);
            
            if (currentLine.includes('kg') && (currentLine.includes('+') || currentLine.includes('-'))) {
                if (currentLine.includes('+')) {
                    horse.weightChange = 1; // 増加
                    console.log(`馬体重変化: 増加`);
                } else if (currentLine.includes('-')) {
                    horse.weightChange = -1; // 減少
                    console.log(`馬体重変化: 減少`);
                }
                currentIndex = i + 1;
                break;
            }
        }
        
        // 年齢の抽出
        for (let i = currentIndex; i < Math.min(currentIndex + 20, lines.length); i++) {
            const currentLine = lines[i].trim();
            console.log(`年齢候補: "${currentLine}"`);
            
            if (currentLine.includes('牡') || currentLine.includes('牝') || currentLine.includes('せん')) {
                const ageMatch = currentLine.match(/(\d+)/);
                if (ageMatch) {
                    const age = parseInt(ageMatch[1]);
                    if (age >= 3 && age <= 8) {
                        horse.age = age;
                        console.log(`年齢設定: ${horse.age}`);
                    }
                }
                currentIndex = i + 1;
                break;
            }
        }
        
        // 現在の騎手名の抽出（より詳細な条件）
        for (let i = currentIndex; i < Math.min(currentIndex + 25, lines.length); i++) {
            const currentLine = lines[i].trim();
            console.log(`現在の騎手候補: "${currentLine}"`);
            
            // 騎手名の条件をより厳密に
            if (currentLine && 
                !currentLine.includes('kg') && 
                !currentLine.includes('年') && 
                !currentLine.includes('着') && 
                !currentLine.includes('頭') &&
                !currentLine.includes('父：') && 
                !currentLine.includes('母：') &&
                !currentLine.includes('勝負服') &&
                !currentLine.includes('(有)') &&
                !currentLine.includes('(株)') &&
                !currentLine.includes('(栗東)') &&
                !currentLine.includes('(美浦)') &&
                currentLine.length >= 3 && 
                currentLine.length <= 15 &&
                !/^\d+$/.test(currentLine) && 
                !currentLine.includes('(') && 
                !currentLine.includes(')') &&
                !currentLine.includes('枠') &&
                !currentLine.includes('ブリンカー着用')) {
                
                // 既知の騎手名かチェック
                const knownJockeys = ['武豊', '川田将雅', 'C.ルメール', '横山武史', '戸崎圭太', '福永祐一', 
                                    'M.デムーロ', '横山典弘', '岩田康誠', '池添謙一', '横山和生', 'D.レーン',
                                    'C.スミヨン', 'W.ビュイック', 'T.マーカンド', 'C.デムーロ', 'J.モレイラ', 
                                    'R.キング', '松山弘平', '池添学', '高杉吏麒', '菱田裕二'];
                
                if (knownJockeys.some(jockey => currentLine.includes(jockey.replace(/[・\.]/g, ''))) ||
                    currentLine.match(/^[一-龯ぁ-ゖァ-ヶーA-Za-z\.\s]+$/)) {
                    horse.jockey = currentLine;
                    console.log(`✅ 現在の騎手設定: ${horse.jockey}`);
                    currentIndex = i + 1;
                    break;
                }
            }
        }
        
        // 前走着順と前走日の抽出
        let lastRaceDate = null;
        let foundJockey = false;
        let foundWeight = false;
        let jockeyIndex = -1;
        let lastRaceIndex = -1;
        
        for (let i = currentIndex; i < Math.min(currentIndex + 50, lines.length); i++) {
            const currentLine = lines[i].trim();
            console.log(`着順候補: "${currentLine}"`);
            
            // 前走日の抽出（日付の後に空白があって馬場種別が続く場合）
            if (!lastRaceDate && /\d{4}年\d{1,2}月\d{1,2}日/.test(currentLine)) {
                console.log(`前走日候補: "${currentLine}"`);
                const dateMatch = currentLine.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
                if (dateMatch) {
                    const year = dateMatch[1];
                    const month = dateMatch[2].padStart(2, '0');
                    const day = dateMatch[3].padStart(2, '0');
                    lastRaceDate = `${year}-${month}-${day}`;
                    horse.lastRaceDate = lastRaceDate;
                    console.log(`✅ 前走日設定: ${lastRaceDate}`);
                    
                    // 同じ行に馬場種別がある場合
                    const afterDate = currentLine.substring(currentLine.indexOf('日') + 1).trim();
                    console.log(`前走日後の文字列: "${afterDate}"`);
                    if (afterDate.includes('芝') || afterDate.includes('ダート')) {
                        if (afterDate.includes('芝')) {
                            horse.lastRaceTrackType = '芝';
                            console.log(`✅ 前走馬場設定: 芝 (日付行から)`);
                        } else if (afterDate.includes('ダート')) {
                            horse.lastRaceTrackType = 'ダート';
                            console.log(`✅ 前走馬場設定: ダート (日付行から)`);
                        }
                    }
                }
            }
            
            // 前走のコース抽出
            if (!horse.lastRaceCourse) {
                const courses = ['中山', '東京', '京都', '阪神', '新潟', '福島', '中京', '小倉'];
                for (const courseName of courses) {
                    if (currentLine.includes(courseName)) {
                        horse.lastRaceCourse = courseName;
                        console.log(`✅ 前走コース設定: ${courseName}`);
                        break;
                    }
                }
            }
            
            // 前走着順の抽出
            if (currentLine.includes('着') && /^\d+着/.test(currentLine)) {
                const match = currentLine.match(/^(\d+)着/);
                if (match) {
                    const finish = parseInt(match[1]);
                    if (finish <= 10) {
                        horse.lastRace = finish;
                    } else {
                        horse.lastRace = 10; // 10着以下
                    }
                    lastRaceIndex = i;
                    console.log(`✅ 前走着順設定: ${horse.lastRace} (インデックス: ${i})`);
                }
            }
        }
        
        // 前走着順が見つかった場合、その後の行から前走騎手を探す
        if (lastRaceIndex >= 0) {
            console.log(`=== 前走騎手・距離・馬場検索開始 (着順インデックス: ${lastRaceIndex}) ===`);
            
            // 着順の次の行（人気・オッズ）
            const popularityLine = lines[lastRaceIndex + 1]?.trim();
            console.log(`人気・オッズ行: "${popularityLine}"`);
            
            // 着順の次の次の行（前走騎手 + 斤量）
            const jockeyWeightLine = lines[lastRaceIndex + 2]?.trim();
            console.log(`前走騎手・斤量候補行: "${jockeyWeightLine}"`);
            
            if (jockeyWeightLine) {
                // 前走騎手の抽出（斤量の前の部分）
                const weightMatch = jockeyWeightLine.match(/(.+?)\s+(\d+\.?\d*kg)/);
                if (weightMatch) {
                    const jockeyName = weightMatch[1].trim();
                    const weight = weightMatch[2];
                    console.log(`前走騎手候補: "${jockeyName}"`);
                    console.log(`前走斤量候補: "${weight}"`);
                    
                    // 騎手名の条件チェック
                    if (jockeyName && 
                        !jockeyName.includes('kg') && 
                        !jockeyName.includes('年') && 
                        !jockeyName.includes('着') && 
                        !jockeyName.includes('頭') &&
                        !jockeyName.includes('父：') && 
                        !jockeyName.includes('母：') &&
                        !jockeyName.includes('勝負服') &&
                        !jockeyName.includes('(有)') &&
                        !jockeyName.includes('(株)') &&
                        !jockeyName.includes('(栗東)') &&
                        !jockeyName.includes('(美浦)') &&
                        jockeyName.length >= 3 && 
                        jockeyName.length <= 15 &&
                        !/^\d+$/.test(jockeyName) && 
                        !jockeyName.includes('(') && 
                        !jockeyName.includes(')') &&
                        !jockeyName.includes('枠') &&
                        !jockeyName.includes('ブリンカー着用') &&
                        !jockeyName.includes('年') &&
                        !jockeyName.includes('月') &&
                        !jockeyName.includes('日') &&
                        !jockeyName.includes('GⅠ') &&
                        !jockeyName.includes('GⅡ') &&
                        !jockeyName.includes('GⅢ') &&
                        !jockeyName.includes('OP')) {
                        
                        // 既知の騎手名かチェック
                        const knownJockeys = ['武豊', '川田将雅', 'C.ルメール', '横山武史', '戸崎圭太', '福永祐一', 
                                            'M.デムーロ', '横山典弘', '岩田康誠', '池添謙一', '横山和生', 'D.レーン',
                                            'C.スミヨン', 'W.ビュイック', 'T.マーカンド', 'C.デムーロ', 'J.モレイラ', 
                                            'R.キング', '松山弘平', '池添学', '高杉吏麒', '菱田裕二'];
                        
                        if (knownJockeys.some(jockey => jockeyName.includes(jockey.replace(/[・\.]/g, ''))) ||
                            jockeyName.match(/^[一-龯ぁ-ゖァ-ヶーA-Za-z\.\s]+$/)) {
                            foundJockey = true;
                            jockeyIndex = lastRaceIndex + 2;
                            console.log(`✅ 前走騎手検出: ${jockeyName} (インデックス: ${jockeyIndex})`);
                        } else {
                            console.log(`❌ 前走騎手候補を除外: "${jockeyName}"`);
                        }
                    }
                    
                    // 斤量の設定
                    if (weight) {
                        foundWeight = true;
                        console.log(`✅ 前走斤量検出: ${weight}`);
                    }
                } else {
                    // 斤量が見つからない場合、行全体を騎手候補として扱う
                    console.log(`前走騎手候補（斤量なし）: "${jockeyWeightLine}"`);
                    // 既知の騎手名かチェック
                    const knownJockeys = ['武豊', '川田将雅', 'C.ルメール', '横山武史', '戸崎圭太', '福永祐一', 
                                        'M.デムーロ', '横山典弘', '岩田康誠', '池添謙一', '横山和生', 'D.レーン',
                                        'C.スミヨン', 'W.ビュイック', 'T.マーカンド', 'C.デムーロ', 'J.モレイラ', 
                                        'R.キング', '松山弘平', '池添学', '高杉吏麒', '菱田裕二'];
                    
                    if (knownJockeys.some(jockey => jockeyWeightLine.includes(jockey.replace(/[・\.]/g, ''))) ||
                        jockeyWeightLine.match(/^[一-龯ぁ-ゖァ-ヶーA-Za-z\.\s]+$/)) {
                        foundJockey = true;
                        jockeyIndex = lastRaceIndex + 2;
                        console.log(`✅ 前走騎手検出: ${jockeyWeightLine} (インデックス: ${jockeyIndex})`);
                    } else {
                        console.log(`❌ 前走騎手候補を除外: "${jockeyWeightLine}"`);
                    }
                }
            }
            
            // 着順の次の次の次の行（距離＋馬場）
            const distanceLine = lines[lastRaceIndex + 3]?.trim();
            console.log(`前走距離・馬場候補行: "${distanceLine}"`);
            
            if (distanceLine) {
                console.log(`前走距離候補: "${distanceLine}"`);
                // 距離のパターンを探す（例：2000芝、1600ダート等）
                const distanceMatch = distanceLine.match(/(\d{3,4})(芝|ダート)/);
                if (distanceMatch) {
                    horse.lastRaceDistance = distanceMatch[1];
                    horse.lastRaceTrackType = distanceMatch[2];
                    console.log(`✅ 前走距離設定: ${horse.lastRaceDistance}m (${horse.lastRaceTrackType})`);
                } else {
                    // 単純な距離パターン（例：1600m）
                    const simpleDistanceMatch = distanceLine.match(/(\d{3,4})m/);
                    if (simpleDistanceMatch) {
                        horse.lastRaceDistance = simpleDistanceMatch[1];
                        console.log(`✅ 前走距離設定: ${horse.lastRaceDistance}m`);
                    }
                }
                
                // 馬場種別がまだ設定されていない場合
                if (!horse.lastRaceTrackType && (distanceLine.includes('芝') || distanceLine.includes('ダート'))) {
                    console.log(`前走馬場候補: "${distanceLine}"`);
                    if (distanceLine.includes('芝')) {
                        horse.lastRaceTrackType = '芝';
                        console.log(`✅ 前走馬場設定: 芝`);
                    } else if (distanceLine.includes('ダート')) {
                        horse.lastRaceTrackType = 'ダート';
                        console.log(`✅ 前走馬場設定: ダート`);
                    }
                }
            }
            
            console.log(`=== 前走騎手・距離・馬場検索終了 ===`);
        } else {
            console.log(`❌ 前走着順が見つからないため、騎手・距離・馬場検索をスキップ`);
        }
        
        // 休養期間の計算
        if (lastRaceDate) {
            const raceDateElement = document.getElementById('raceDate');
            if (raceDateElement && raceDateElement.value) {
                const raceDate = new Date(raceDateElement.value);
                const lastDate = new Date(lastRaceDate);
                const diffTime = Math.abs(raceDate - lastDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                horse.restDays = diffDays;
                console.log(`休養期間計算: ${diffDays}日`);
                
                // 休養期間をカテゴリに分類
                let restCategory = 14; // デフォルト
                if (diffDays <= 7) {
                    restCategory = 7;
                } else if (diffDays <= 14) {
                    restCategory = 14;
                } else if (diffDays <= 21) {
                    restCategory = 21;
                } else if (diffDays <= 28) {
                    restCategory = 28;
                } else if (diffDays <= 35) {
                    restCategory = 35;
                } else if (diffDays <= 42) {
                    restCategory = 42;
                } else if (diffDays <= 49) {
                    restCategory = 49;
                } else {
                    restCategory = 56;
                }
                horse.restDays = restCategory;
                console.log(`休養期間カテゴリ: ${restCategory}`);
            }
        }
        
        console.log(`解析結果:`, horse);
        horse.nextIndex = currentIndex;
        return horse;
    }
    
    static parseStructuredHorseData(csvData) {
        const lines = csvData.split('\n').filter(line => line.trim());
        const horses = [];
        
        for (const line of lines) {
            const parts = line.split(',').map(part => part.trim());
            if (parts.length >= 4) {
                const horse = {
                    name: parts[0] || '名前未入力',
                    odds: parseFloat(parts[1]) || 10,
                    lastRace: parseInt(parts[2]) || 6,
                    jockey: parts[3] || '騎手未入力',
                    age: parseInt(parts[4]) || 5,
                    weightChange: parseInt(parts[5]) || 0,
                    course: parts[6] || '中山',
                    distance: parseInt(parts[7]) || 1600,
                    trackType: parts[8] || '芝',
                    weather: parts[9] || '晴',
                    trackCondition: parts[10] || '良',
                    restDays: parseInt(parts[11]) || 14
                };
                horses.push(horse);
            }
        }
        
        return horses;
    }
    
    static convertToCSV(horses) {
        return horses.map(horse => 
            `${horse.name},${horse.odds},${horse.lastRace},${horse.jockey},${horse.age},${horse.weightChange},${horse.course},${horse.distance},${horse.trackType},${horse.weather},${horse.trackCondition},${horse.restDays}`
        ).join('\n');
    }

    static updateRaceInfoUI(raceInfo) {
        if (!raceInfo) return;
        
        const raceNameElement = document.getElementById('raceName');
        const raceDateElement = document.getElementById('raceDate');
        const raceCourseElement = document.getElementById('raceCourse');
        const raceDistanceElement = document.getElementById('raceDistance');
        const raceTrackTypeElement = document.getElementById('raceTrackType');
        const raceTrackConditionElement = document.getElementById('raceTrackCondition');
        
        if (raceInfo.raceName && raceNameElement) {
            raceNameElement.value = raceInfo.raceName;
        }
        if (raceInfo.raceDate && raceDateElement) {
            raceDateElement.value = raceInfo.raceDate;
        }
        if (raceInfo.course && raceCourseElement) {
            raceCourseElement.value = raceInfo.course;
        }
        if (raceInfo.distance && raceDistanceElement) {
            raceDistanceElement.value = raceInfo.distance;
        }
        if (raceInfo.trackType && raceTrackTypeElement) {
            raceTrackTypeElement.value = raceInfo.trackType;
        }
        if (raceInfo.trackCondition && raceTrackConditionElement) {
            raceTrackConditionElement.value = raceInfo.trackCondition;
        }
    }
    
    static applyRaceInfoToAllHorses() {
        const raceDateElement = document.getElementById('raceDate');
        const raceCourseElement = document.getElementById('raceCourse');
        const raceDistanceElement = document.getElementById('raceDistance');
        const raceTrackTypeElement = document.getElementById('raceTrackType');
        const raceTrackConditionElement = document.getElementById('raceTrackCondition');
        
        if (!raceDateElement || !raceCourseElement || !raceDistanceElement || !raceTrackTypeElement || !raceTrackConditionElement) {
            showMessage('レース基本情報の入力フィールドが見つかりません', 'error');
            return;
        }
        
        const raceDate = raceDateElement.value;
        const raceCourse = raceCourseElement.value;
        const raceDistance = raceDistanceElement.value;
        const raceTrackType = raceTrackTypeElement.value;
        const raceTrackCondition = raceTrackConditionElement.value;
        
        const horseCards = document.querySelectorAll('.horse-card');
        if (horseCards.length === 0) {
            showMessage('馬データが入力されていません', 'warning');
            return;
        }
        
        horseCards.forEach(card => {
            const courseSelect = card.querySelector('select[name="course"]');
            const distanceSelect = card.querySelector('select[name="distance"]');
            const trackTypeSelect = card.querySelector('select[name="trackType"]');
            const trackConditionSelect = card.querySelector('select[name="trackCondition"]');
            
            if (courseSelect) courseSelect.value = raceCourse;
            if (distanceSelect) distanceSelect.value = raceDistance;
            if (trackTypeSelect) trackTypeSelect.value = raceTrackType;
            if (trackConditionSelect) trackConditionSelect.value = raceTrackCondition;
        });
        
        // 開催日が設定されている場合、休養期間を再計算
        if (raceDate) {
            // 前走日が設定されている馬のみ休養期間を再計算
            const horseCards = document.querySelectorAll('.horse-card');
            let recalculatedCount = 0;
            
            horseCards.forEach(card => {
                const lastRaceDateInput = card.querySelector('input[name="lastRaceDate"]');
                if (lastRaceDateInput && lastRaceDateInput.value) {
                    recalculatedCount++;
                }
            });
            
            if (recalculatedCount > 0) {
                DataConverter.recalculateRestDays(raceDate);
                console.log(`${recalculatedCount}頭の馬の休養期間を再計算しました`);
            }
        }
        
        // 成功メッセージを表示
        const message = `レース基本情報を${horseCards.length}頭の馬に適用しました`;
        showMessage(message, 'success');
    }
    
    static recalculateRestDays(raceDateParam) {
        const horseCards = document.querySelectorAll('.horse-card');
        horseCards.forEach(card => {
            const lastRaceDateInput = card.querySelector('input[name="lastRaceDate"]');
            const restDaysSelect = card.querySelector('select[name="restDays"]');
            
            if (lastRaceDateInput && lastRaceDateInput.value && restDaysSelect) {
                const lastRaceDate = lastRaceDateInput.value;
                const raceDate = new Date(raceDateParam);
                const lastDate = new Date(lastRaceDate);
                const diffTime = Math.abs(raceDate - lastDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                // 休養期間をカテゴリに分類
                let restCategory = 14; // デフォルト
                if (diffDays <= 7) {
                    restCategory = 7;
                } else if (diffDays <= 14) {
                    restCategory = 14;
                } else if (diffDays <= 21) {
                    restCategory = 21;
                } else if (diffDays <= 28) {
                    restCategory = 28;
                } else if (diffDays <= 35) {
                    restCategory = 35;
                } else if (diffDays <= 42) {
                    restCategory = 42;
                } else if (diffDays <= 49) {
                    restCategory = 49;
                } else {
                    restCategory = 56;
                }
                
                restDaysSelect.value = restCategory;
                console.log(`休養期間再計算: ${diffDays}日 → カテゴリ${restCategory}`);
            }
        });
    }

    static bulkInput() {
        const rawDataInput = document.getElementById('rawDataInput');
        if (!rawDataInput) {
            showMessage('データ入力エリアが見つかりません', 'error');
            return;
        }
        
        const rawData = rawDataInput.value.trim();
        if (!rawData) {
            showMessage('データを入力してください', 'error');
            return;
        }

        try {
            // 生データかCSVデータかを判定
            const isRawData = rawData.includes('枠') || rawData.includes('番人気') || 
                             rawData.includes('kg') || rawData.includes('着');
            
            let horses = [];
            let raceInfo = null;
            
            if (isRawData) {
                // 生データの場合
                const result = DataConverter.convertRawData(rawData);
                horses = result.horses;
                raceInfo = result.raceInfo;
            } else {
                // CSVデータの場合
                horses = DataConverter.parseStructuredHorseData(rawData);
                // CSVデータの場合は現在のレース基本情報を使用
                raceInfo = {
                    raceName: document.getElementById('raceName')?.value || '',
                    distance: document.getElementById('raceDistance')?.value || '1600',
                    trackType: document.getElementById('raceTrackType')?.value || '芝',
                    trackCondition: document.getElementById('raceTrackCondition')?.value || '良'
                };
            }

            if (horses.length === 0) {
                showMessage('有効な馬データが見つかりませんでした。データ形式を確認してください。', 'error');
                return;
            }

            // 既存の馬データをクリア
            const container = document.getElementById('horsesContainer');
            if (container) {
                container.innerHTML = '';
            }

            // 新しい馬データを追加
            horses.forEach(horse => {
                HorseManager.addHorseFromData(horse);
            });

            // レース基本情報を全馬に適用
            if (raceInfo) {
                DataConverter.updateRaceInfoUI(raceInfo);
                // レース基本情報の適用は少し遅延させて、馬カードが完全に生成されてから実行
                setTimeout(() => {
                    DataConverter.applyRaceInfoToAllHorses();
                }, 100);
            }

            const message = `${horses.length}頭の馬データを追加しました`;
            showMessage(message, 'success');
            rawDataInput.value = '';

        } catch (error) {
            console.error('一括入力エラー:', error);
            showMessage(`データの解析中にエラーが発生しました: ${error.message}`, 'error');
        }
    }
}

// グローバル関数として公開
window.loadSampleRawData = DataConverter.loadSampleRawData;
window.bulkInput = DataConverter.bulkInput; 