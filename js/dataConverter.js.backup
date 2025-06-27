// 画面上にメッセージを表示する共通関数
function showMessage(msg, type = 'info', duration = 2500) {
    const el = document.getElementById('appMessage');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    el.style.background = type === 'error' ? '#fdd' : '#ffc';
    el.style.color = type === 'error' ? '#900' : '#333';
    setTimeout(() => { el.style.display = 'none'; }, duration);
}

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

    // netkeiba形式のデータを解析（成功テストロジック統合版）
    static parseNetkeibaData(rawData) {
        console.log('=== DataConverter血統抽出（改良版）開始 ===');
        
        // レース基本情報を抽出
        const lines = rawData.split('\n').filter(line => line.trim());
        const raceInfo = DataConverter.extractNetkeibaRaceInfo(lines);
        
        // 成功している血統抽出ロジックを使用
        const horses = DataConverter.parseAllHorsesWithPedigree(rawData);
        
        console.log(`=== 血統抽出完了: ${horses.length}頭 ===`);
        return { raceInfo, horses };
    }
    
    // 成功テストのロジックを統合した馬解析メソッド
    static parseAllHorsesWithPedigree(rawData) {
        const lines = rawData.split('\n').map(line => line.trim()).filter(line => line);
        const horses = [];
        
        console.log('=== 全体データ解析開始 ===');
        console.log('入力データ行数:', lines.length);
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            console.log(`\nメインループ i=${i}: "${line}"`);
            
            if (DataConverter.isNetkeibaHorseStart(line)) {
                console.log(`馬開始検出: i=${i}`);
                const horseData = DataConverter.extractPedigreeFromHorseData(lines, i);
                horses.push(horseData);
                i = horseData.nextIndex - 1;  // forループでi++されるため-1
                console.log(`次のインデックスに移動: ${horseData.nextIndex}`);
            }
        }
        
        return horses;
    }
    
    // 血統抽出メイン関数（成功テストベース）
    static extractPedigreeFromHorseData(lines, startIndex) {
        const horse = {
            name: '',
            sire: '',      // 父
            dam: '',       // 母
            damSire: '',   // 母父
            odds: 0,
            popularity: 0,
            jockey: '',
            lastRace: 0,
            age: 0,
            weightChange: 0,
            restDays: 0,
            runningStyle: '',
            frameNumber: 0,
            horseNumber: 0
        };
        
        let i = startIndex;
        const processLog = [];
        
        console.log(`\n=== 血統抽出開始 (startIndex: ${startIndex}) ===`);
        
        // 血統順序管理（血統データは通常：印→父→馬名→母→母父の順序）
        let bloodlineStep = 0; // 0:印/開始, 1:父系候補, 2:馬名候補, 3:母系候補, 4:母父候補
        
        while (i < lines.length) {
            const line = lines[i]?.trim() || '';
            
            // 次の馬の開始を検出したら終了
            if (i > startIndex && DataConverter.isNetkeibaHorseStart(line)) {
                processLog.push(`次の馬開始検出で終了: i=${i}, line="${line}"`);
                break;
            }
            
            processLog.push(`i=${i}: "${line}" (step=${bloodlineStep})`);
            
            // 印行スキップ
            if (DataConverter.isMarkLine(line)) {
                processLog.push(`  → 印行スキップ`);
                bloodlineStep = 1; // 次は父系候補
                i++;
                continue;
            }
            
            // 血統データの順序に基づく抽出
            if (bloodlineStep === 1 && !horse.sire && (DataConverter.isSireName(line) || DataConverter.isPotentialSire(line, bloodlineStep))) {
                // 父系抽出
                horse.sire = line;
                processLog.push(`  → 父系抽出: ${line}`);
                bloodlineStep = 2; // 次は馬名候補
            } else if (bloodlineStep === 2 && !horse.name && DataConverter.isPotentialHorseName(line)) {
                // 馬名抽出（父系・母系・その他でない場合）
                horse.name = line;
                processLog.push(`  → 馬名抽出: ${line}`);
                bloodlineStep = 3; // 次は母系候補
            } else if (bloodlineStep === 3 && !horse.dam && (DataConverter.isDamName(line) || DataConverter.isPotentialMare(line, bloodlineStep))) {
                // 母系抽出
                horse.dam = line;
                processLog.push(`  → 母系抽出: ${line}`);
                bloodlineStep = 4; // 次は母父候補
            } else if (!horse.damSire) {
                // 母父抽出（括弧内）
                const damSire = DataConverter.extractDamSireFromLine(line);
                if (damSire) {
                    horse.damSire = damSire;
                    processLog.push(`  → 母父抽出: ${damSire} (from "${line}")`);
                }
            }
            
            // ステップを進める条件チェック（血統データが見つからない場合の対処）
            if (bloodlineStep === 1 && !DataConverter.isSireName(line) && DataConverter.isPotentialHorseName(line)) {
                // 父系が見つからず馬名候補が来た場合、馬名として扱いステップを進める
                horse.name = line;
                processLog.push(`  → [ステップスキップ]馬名抽出: ${line}`);
                bloodlineStep = 3; // 母系候補に進む
            } else if (bloodlineStep === 2 && !DataConverter.isPotentialHorseName(line) && DataConverter.isDamName(line)) {
                // 馬名が見つからず母系候補が来た場合、母系として扱いステップを進める  
                horse.dam = line;
                processLog.push(`  → [ステップスキップ]母系抽出: ${line}`);
                bloodlineStep = 4; // 母父候補に進む
            }
            
            // フォールバック：順序によらない抽出（血統データが不完全な場合）
            if (bloodlineStep >= 2) {
                if (!horse.sire && DataConverter.isSireName(line)) {
                    horse.sire = line;
                    processLog.push(`  → [フォールバック]父系抽出: ${line}`);
                } else if (!horse.dam && DataConverter.isDamName(line)) {
                    horse.dam = line;
                    processLog.push(`  → [フォールバック]母系抽出: ${line}`);
                }
            }
            
            // 枠番・馬番の抽出
            if (i === startIndex && DataConverter.isNetkeibaHorseStart(line)) {
                const numbers = line.trim().split(/\s+/);
                if (numbers.length >= 2) {
                    horse.frameNumber = parseInt(numbers[0]) || 0;
                    horse.horseNumber = parseInt(numbers[1]) || 0;
                }
            }
            
            i++;
        }
        
        // 馬名が抽出されていない場合、フォールバック判定
        if (!horse.name) {
            // 血統以外の候補から馬名を推定
            for (let j = startIndex + 1; j < Math.min(startIndex + 6, lines.length); j++) {
                const candidateLine = lines[j]?.trim() || '';
                if (DataConverter.isPotentialHorseName(candidateLine) && 
                    candidateLine !== horse.sire && 
                    candidateLine !== horse.dam &&
                    !DataConverter.isKnownNonHorseName(candidateLine)) {
                    horse.name = candidateLine;
                    processLog.push(`  → [フォールバック]馬名抽出: ${candidateLine}`);
                    break;
                }
            }
        }
        
        console.log('\n抽出結果:');
        console.log(`馬名: ${horse.name || '未抽出'}`);
        console.log(`父系: ${horse.sire || '未抽出'}`);
        console.log(`母系: ${horse.dam || '未抽出'}`);
        console.log(`母父: ${horse.damSire || '未抽出'}`);
        
        return {
            ...horse,
            nextIndex: i,
            processLog: processLog
        };
    }
    
    // netkeiba形式の馬データ開始を検出
    // 枠番・馬番のパターン（例: "1	1	"）
    static isNetkeibaHorseStart(line) {
        // タブやスペースで区切られた枠番・馬番形式（例: "1 1", "1\t1", " 1  1  "）
        const tokens = line.trim().split(/\s+/);
        return tokens.length === 2 && tokens.every(tok => /^\d+$/.test(tok));
    }
    
    // 印行判定（成功テストベース）
    static isMarkLine(line) {
        const marks = ['--', '◎', '◯', '▲', '△', '☆', '✓', '消'];
        return marks.some(mark => line === mark || line.startsWith(mark));
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
            runningStyle: '',  // 脚質プロパティを追加
            // 血統情報を追加
            sire: '',      // 父
            dam: '',       // 母
            damSire: '',   // 母父
            lastRaceTime: '',
            lastRaceWeight: 0,
            lastRaceOdds: 0,
            lastRacePopularity: 0,
            lastRaceHorseCount: 0,
            lastRaceTrackCondition: '',
            lastRaceWeather: '',
            lastRaceWeightChange: 0,
            lastRaceJockey: '',
            lastRaceDistance: 0,
            lastRaceDate: '',
            lastRaceOrder: 0,
            lastRaceAgari: 0,
            frameNumber: 0,
            horseNumber: 0,
        };
        
        let i = startIndex;
        let foundName = false;
        let foundJockey = false;
        let foundWeight = false;
        let foundOdds = false;
        let foundAge = false;
        let foundLastRace = false;
        let pedigreeIndex = 0;  // 血統抽出の順次インデックス
        
        console.log(`=== 馬データ解析開始: startIndex=${startIndex} ===`);
        // 🚨 デバッグ追加: 強制的に馬名候補をログ出力
        console.log('🔧 デバッグ - startIndex:', startIndex);
        console.log('🔧 デバッグ - line[startIndex+3]:', lines[startIndex + 3]);
        console.log(`📋 全体データ構造確認:`);
        for (let debugIndex = startIndex; debugIndex < Math.min(startIndex + 10, lines.length); debugIndex++) {
            console.log(`    [${debugIndex}]: "${lines[debugIndex].trim()}"`);
        }
        
        while (i < lines.length) {
            const line = lines[i].trim();
            console.log(`📍 現在処理中: i=${i}, line="${line}"`);
            
            // 次の馬のデータの開始を検出したら終了
            if (i > startIndex && DataConverter.isNetkeibaHorseStart(line)) {
                console.log('次の馬のデータを検出、現在の馬の解析を終了');
                break;
            }
            
            // 改善された血統抽出ロジック（pedigreeExtractor.jsベース）
            const marks = ['--', '◎', '◯', '▲', '△', '☆', '✓', '消'];
            
            // 血統順序管理（血統データは通常：印→父→馬名→母→母父の順序）
            if (!horse.bloodlineStep) horse.bloodlineStep = 0;
            
            // 印の行をスキップ
            const isMarkLine = marks.some(mark => line === mark || line.startsWith(mark));
            console.log(`🎯 印行判定: "${line}" → ${isMarkLine} (marks: ${marks.join(', ')})`);
            if (isMarkLine) {
                console.log(`📝 印行をスキップ: "${line}" (i=${i} → ${i+1})`);
                horse.bloodlineStep = 1; // 次は父系候補
                continue;
            }
            
            // 血統データの順序に基づく抽出
            console.log(`血統抽出チェック - line: "${line}", step: ${horse.bloodlineStep}`);
            
            if (horse.bloodlineStep === 1 && !horse.sire && (DataConverter.isSireName(line) || DataConverter.isPotentialSire(line, horse.bloodlineStep))) {
                // 父系抽出
                horse.sire = line;
                console.log(`✅ 父系抽出: ${horse.sire}`);
                horse.bloodlineStep = 2; // 次は馬名候補
            } else if (horse.bloodlineStep === 2 && !horse.name && DataConverter.isPotentialHorseName(line)) {
                // 馬名抽出（父系・母系・その他でない場合）
                horse.name = line;
                console.log(`✅ 馬名抽出: ${horse.name}`);
                horse.bloodlineStep = 3; // 次は母系候補
            } else if (horse.bloodlineStep === 3 && !horse.dam && (DataConverter.isDamName(line) || DataConverter.isPotentialMare(line, horse.bloodlineStep))) {
                // 母系抽出
                horse.dam = line;
                console.log(`✅ 母系抽出: ${horse.dam}`);
                horse.bloodlineStep = 4; // 次は母父候補
            } else if (!horse.damSire && DataConverter.isDamSireName(line)) {
                // 母父抽出（括弧内）
                horse.damSire = DataConverter.extractDamSireFromLine(line);
                console.log(`✅ 母父抽出: ${horse.damSire}`);
            }
            
            // ステップを進める条件チェック（血統データが見つからない場合の対処）
            if (horse.bloodlineStep === 1 && !DataConverter.isSireName(line) && DataConverter.isPotentialHorseName(line)) {
                // 父系が見つからず馬名候補が来た場合、馬名として扱いステップを進める
                horse.name = line;
                console.log(`✅ [ステップスキップ]馬名抽出: ${horse.name}`);
                horse.bloodlineStep = 3; // 母系候補に進む
            } else if (horse.bloodlineStep === 2 && !DataConverter.isPotentialHorseName(line) && DataConverter.isDamName(line)) {
                // 馬名が見つからず母系候補が来た場合、母系として扱いステップを進める  
                horse.dam = line;
                console.log(`✅ [ステップスキップ]母系抽出: ${horse.dam}`);
                horse.bloodlineStep = 4; // 母父候補に進む
            }
            
            // フォールバック：順序によらない抽出（血統データが不完全な場合）
            if (horse.bloodlineStep >= 2) {
                if (!horse.sire && DataConverter.isSireName(line)) {
                    horse.sire = line;
                    console.log(`✅ [フォールバック]父系抽出: ${horse.sire}`);
                } else if (!horse.dam && DataConverter.isDamName(line)) {
                    horse.dam = line;
                    console.log(`✅ [フォールバック]母系抽出: ${horse.dam}`);
                }
            }
            
            // 枠番・馬番の抽出
            if (i === startIndex && DataConverter.isNetkeibaHorseStart(line)) {
                // 枠番・馬番を抽出
                const numbers = line.trim().split(/\s+/);
                
                if (numbers.length >= 2) {
                    horse.frameNumber = parseInt(numbers[0]) || 0;
                    horse.horseNumber = parseInt(numbers[1]) || 0;
                }
            }
            
            // 古い馬名抽出ロジック（無効化）
            if (false && !foundName) {
                    
                    // 印の行をチェック
                    const nextLine = lines[i+1]?.trim() || '';
                    const isMarkLine = marks.some(mark => nextLine.startsWith(mark));
                    if (isMarkLine) {
                        // 血統行をスキップし、その次の行を馬名とする
                        const candidateName = lines[i+3]?.trim() || '';
                        if (candidateName.length > 0) {
                            // 末尾のBや半角英字（ブリンカー記号）を除去
                            const cleanedName = candidateName.replace(/[BＡ-ＺA-Z]+$/, '').trim();
                            if (/^[ァ-ヶー\u3040-\u309F\u4E00-\u9FAF\sA-Za-z]+$/.test(cleanedName) && cleanedName.length >= 2) {
                                horse.name = cleanedName;
                                foundName = true;
                                i += 3;
                                continue;
                            }
                        }
                    }
                }
                
                // 通常の馬名抽出ロジック
                const startsWithMark = marks.some(mark => line.startsWith(mark));
                const bloodlineNames = ['ロードカナロア', 'エアルーティーン', 'ハービンジャー', 'ドゥラメンテ', 'モアザンセイクリッド', 'More Than Ready', 'レネットグルーヴ', 'キングカメハメハ'];
                const isBloodline = bloodlineNames.some(bloodline => line.includes(bloodline));
                const isTrainer = line.includes('栗東') || line.includes('美浦');
                const isRestInfo = line.includes('先中') || line.includes('差中') || line.includes('週');
                const isWeightInfo = line.includes('kg');
                const isOddsInfo = line.includes('人気');
                const isAgeInfo = line.includes('牡') || line.includes('牝') || line.includes('セ');
                const isFrameNumber = /^\d+\s+\d+\s*$/.test(line);
                const isCancelMark = line.includes('消');
                const isParentheses = /^\(.*\)$/.test(line);
                const isDate = /\d{4}\.\d{2}\.\d{2}/.test(line);
                const isLastRaceInfo = line.includes('芝') && line.match(/\d+:\d+\.\d+/);
                
                if (!startsWithMark && !isBloodline && !isTrainer && !isRestInfo && !isWeightInfo && !isOddsInfo && !isAgeInfo && !isFrameNumber && !isCancelMark && !isParentheses && !isDate && !isLastRaceInfo) {
                    // 末尾のBや半角英字（ブリンカー記号）を除去
                    const cleanedLine = line.replace(/[BＡ-ＺA-Z]+$/, '').trim();
                    if (/^[ァ-ヶー\u3040-\u309F\u4E00-\u9FAF\sA-Za-z]+$/.test(cleanedLine) && cleanedLine.length >= 2) {
                        horse.name = cleanedLine;
                        foundName = true;
                    }
                }
            }
            
            // オッズと人気の抽出
            if (!foundOdds && line.includes('人気')) {
                const oddsMatch = line.match(/(\d+\.?\d*)\s*\((\d+)人気\)/);
                if (oddsMatch) {
                    horse.odds = parseFloat(oddsMatch[1]);
                    horse.popularity = parseInt(oddsMatch[2]);
                    foundOdds = true;
                    ////console.log('オッズ抽出:', horse.odds, '人気:', horse.popularity);
                }
            }
            
            // 脚質の抽出（馬体重変化行の前にある「差中9週」のような形式、「大逃げ」パターンも対応）
            if (!horse.runningStyle && line.match(/^(大|逃|先|差|追|自).*(週|日|月)/)) {
                const styleMatch = line.match(/^(大|逃|先|差|追|自)/);
                if (styleMatch) {
                    const styleChar = styleMatch[1];
                    switch (styleChar) {
                        case '大': horse.runningStyle = '逃げ'; break; // 大逃げは逃げとして分類
                        case '逃': horse.runningStyle = '逃げ'; break;
                        case '先': horse.runningStyle = '先行'; break;
                        case '差': horse.runningStyle = '差し'; break;
                        case '追': horse.runningStyle = '追込'; break;
                        case '自': horse.runningStyle = '自在'; break;
                    }
                    console.log('脚質抽出:', horse.runningStyle, 'from', line);
                }
            }
            
            // 馬体重変化の抽出
            if (!foundWeight && line.includes('kg') && line.includes('(') && line.includes(')')) {
                const weightMatch = line.match(/(\d+)kg\(([+-]?\d+)\)/);
                if (weightMatch) {
                    horse.weightChange = parseInt(weightMatch[2]);
                    foundWeight = true;
                    ////console.log('体重変化抽出:', horse.weightChange);
                }
            }
            
            // 年齢の抽出
            if (!foundAge && (line.includes('牡') || line.includes('牝') || line.includes('セ'))) {
                const ageMatch = line.match(/(牡|牝|セ)(\d+)/);
                if (ageMatch) {
                    horse.age = parseInt(ageMatch[2]);
                    foundAge = true;
                    ////console.log('年齢抽出:', horse.age);
                    // 年齢行の直後の空行＋1行目が現騎手名
                    let j = i + 1;
                    // 空行をスキップ
                    while (j < lines.length && lines[j].trim() === '') j++;
                    if (j < lines.length) {
                        const candidateJockey = lines[j].trim();
                        // 騎手名の検証を強化
                        if (DataConverter.isValidJockeyName(candidateJockey)) {
                            horse.jockey = candidateJockey;
                            foundJockey = true;
                            console.log('現騎手（年齢行直後）抽出:', candidateJockey);
                        } else {
                            console.log('現騎手（年齢行直後）抽出失敗:', candidateJockey);
                        }
                    }
                }
            }
            
            // 騎手名の抽出（補助: knownJockeysリスト）
            if (!foundJockey && line.length > 0) {
                const knownJockeys = [
                    '横山和', '横山武', '菱田裕', '武豊', '川田将雅', 'C.ルメール', '戸崎圭太', 
                    '福永祐一', '横山和生', '浜中', 'ルメー', '丹内', '北村宏', 'レーン', 
                    '松山', '岩田望', '津村', '池添', '北村友', '田辺', 'Ｍデム', 'M.デム', 
                    '佐々木', '坂井', '川田', '横山典', '戸崎', '内田博', '菅原明', 
                    'シュタ', '木幡巧', '菊沢', '吉田豊', '幸英明', '太宰啓介', 
                    '長岡禎仁', '古川奈穂', '吉田隼人', '三浦皇成', 'ディー', '松岡正海', '原優介'
                ];
                
                for (const jockey of knownJockeys) {
                    if (line === jockey || line.startsWith(jockey)) {
                        horse.jockey = jockey;
                        foundJockey = true;
                        console.log('現騎手（knownJockeys補助）抽出:', jockey);
                        break;
                    }
                }
            }
            
            // 過去5走情報の抽出
            if (!foundLastRace && line.match(/\d{4}\.\d{2}\.\d{2}/)) {
                const raceHistoryData = DataConverter.parseNetkeibaRaceHistory(lines, i, 5); // 5走分抽出
                if (raceHistoryData) {
                    Object.assign(horse, raceHistoryData);
                    // 着順をlastRaceOrderからlastRaceにもコピー（予測エンジン互換のため）
                    if (raceHistoryData.lastRaceOrder !== undefined) {
                        horse.lastRaceOrder = raceHistoryData.lastRaceOrder;
                        horse.lastRace = raceHistoryData.lastRaceOrder;
                        console.log('馬データに着順セット:', horse.name, horse.lastRaceOrder);
                    } else {
                        console.log('馬データに着順セット失敗:', horse.name, raceHistoryData);
                    }
                    foundLastRace = true;
                    // レース履歴解析後は元のi位置から継続（血統データをスキップしないように）
                    // i = raceHistoryData.nextIndex - 1; // コメントアウト：インデックス修正が血統データ抽出を阻害
                    continue;
                }
            }
            
            i++;
        }
        
        // 馬名が抽出されていない場合、フォールバック判定（pedigreeExtractor.jsベース）
        if (!foundName && !horse.name) {
            console.log('⚠️ 馬名未抽出、フォールバック判定開始');
            // 血統以外の候補から馬名を推定
            for (let j = startIndex + 1; j < Math.min(startIndex + 6, lines.length); j++) {
                const candidateLine = lines[j]?.trim() || '';
                if (DataConverter.isPotentialHorseName(candidateLine) && 
                    candidateLine !== horse.sire && 
                    candidateLine !== horse.dam &&
                    !DataConverter.isKnownNonHorseName(candidateLine)) {
                    horse.name = candidateLine;
                    console.log(`✅ [フォールバック]馬名抽出: ${candidateLine}`);
                    break;
                }
            }
        }
        
        horse.nextIndex = i;
        return horse;
    }
    
    // 騎手名の有効性をチェック
    static isValidJockeyName(name) {
        // 空文字列、数字のみ、記号のみの場合は無効
        if (!name || name.length < 2) return false;
        if (/^\d+$/.test(name)) return false;
        if (/^[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\w\.・]+$/.test(name)) return false;
        
        // 明らかに騎手名ではない文字列を除外
        const invalidPatterns = [
            /^\d+\.\d+$/, // 小数点（斤量など）
            /kg/, // 体重
            /週/, // 休養
            /^\([^)]*\)$/, // 括弧内のみ
            /^[A-Z]+$/, // 大文字のみ（血統記号など）
            /芝|ダ/, // 馬場種別
            /良|稍|重|不/, // 馬場状態
            /^\d+頭/, // 馬数
            /番/, // 枠番・馬番
            /着/, // 着順
            /GI|GII|GIII/, // グレード
            /栗東|美浦/, // 調教師
            /先中|差中/, // 休養情報
        ];
        
        for (const pattern of invalidPatterns) {
            if (pattern.test(name)) return false;
        }
        
        // 日本語（ひらがな・カタカナ・漢字）と一部の英字を含む場合は有効
        return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(name);
    }
    
    
    // netkeiba形式の前走情報を解析
    // 過去5走分のレース情報を抽出する新しいメソッド
    static parseNetkeibaRaceHistory(lines, startIndex, maxRaces = 5) {
        const raceHistory = {};
        let i = startIndex;
        let racesFound = 0;
        
        console.log(`=== 過去${maxRaces}走データ抽出開始 ===`);
        console.log('開始行:', lines[startIndex]);
        
        // 最大30行まで検索
        while (i < lines.length && i < startIndex + 30 && racesFound < maxRaces) {
            const line = lines[i].trim();
            
            // 休養情報や特殊情報をスキップ
            if (DataConverter.isRestOrSpecialInfo(line)) {
                i++;
                continue;
            }
            
            // 次の馬の開始を検出したら終了
            if (DataConverter.isNetkeibaHorseStart(line)) {
                console.log('次の馬の開始を検出、レース履歴解析終了');
                break;
            }
            
            // レース日付を検出
            if (line.match(/\d{4}\.\d{2}\.\d{2}/)) {
                const raceData = this.parseNetkeibaLastRace(lines, i);
                if (raceData) {
                    if (racesFound === 0) {
                        // 前走データ
                        Object.assign(raceHistory, raceData);
                    } else if (racesFound === 1) {
                        // 2走前データ（プレフィックスを変更）
                        Object.keys(raceData).forEach(key => {
                            if (key !== 'nextIndex') {
                                const newKey = key.replace('lastRace', 'secondLastRace');
                                raceHistory[newKey] = raceData[key];
                            }
                        });
                    } else if (racesFound === 2) {
                        // 3走前データ（プレフィックスを変更）
                        Object.keys(raceData).forEach(key => {
                            if (key !== 'nextIndex') {
                                const newKey = key.replace('lastRace', 'thirdLastRace');
                                raceHistory[newKey] = raceData[key];
                            }
                        });
                    } else if (racesFound === 3) {
                        // 4走前データ（プレフィックスを変更）
                        Object.keys(raceData).forEach(key => {
                            if (key !== 'nextIndex') {
                                const newKey = key.replace('lastRace', 'fourthLastRace');
                                raceHistory[newKey] = raceData[key];
                            }
                        });
                    } else if (racesFound === 4) {
                        // 5走前データ（プレフィックスを変更）
                        Object.keys(raceData).forEach(key => {
                            if (key !== 'nextIndex') {
                                const newKey = key.replace('lastRace', 'fifthLastRace');
                                raceHistory[newKey] = raceData[key];
                            }
                        });
                    }
                    
                    racesFound++;
                    i = raceData.nextIndex - 1;
                    console.log(`${racesFound}走目のデータを抽出完了`);
                }
            }
            
            i++;
        }
        
        raceHistory.nextIndex = i;
        console.log(`=== 過去レース抽出完了: ${racesFound}走分 ===`);
        
        return racesFound > 0 ? raceHistory : null;
    }

    static parseNetkeibaLastRace(lines, startIndex) {
        const lastRace = {
            lastRaceAgari: 0,
        };
        console.log('✅ parseNetkeibaLastRace 呼び出し確認:', startIndex);
        console.log('📌 lines.length:', lines.length);
        console.log('📌 開始行:', lines[startIndex]);

        let i = startIndex;
        let raceCompleted = false;
        let foundValidRace = false;
        console.log('✅ parseNetkeibaLastRace 呼び出し確認:', startIndex);
        console.log('📌 lines.length:', lines.length);
        console.log('📌 開始行:', lines[startIndex]);


        // 休養情報や特殊情報をスキップ
        while (i < lines.length && i < startIndex + 30) {
            const line = lines[i].trim();
            console.log('現在の行:', line);   
            // 休養情報や成績情報をスキップ
            if (DataConverter.isRestOrSpecialInfo(line)) {
                console.log('休養・特殊情報をスキップ:', line);
                i++;
                continue;
            }
            
            // 次の馬の開始を検出したら即座に終了
            if (DataConverter.isNetkeibaHorseStart(line)) {
                console.log('次の馬の開始を検出、前走解析終了');
                break;
            }
            
            // 前走日付とコースの抽出（例: "2025.04.06 阪神1"）
            if (!lastRace.lastRaceDate && line.match(/\d{4}\.\d{2}\.\d{2}/)) {
                const dateMatch = line.match(/(\d{4})\.(\d{2})\.(\d{2})/);
                if (dateMatch) {
                    lastRace.lastRaceDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
                    foundValidRace = true;
                    
                    // コース名＋着順の抽出（例: "阪神7" → 7着、"阪神中" → 中止）
                    // まず数字の着順をチェック
                    const numericPlaceMatch = line.match(/([阪神京都中山東京大井船橋川崎浦和新潟福島中京小倉札幌函館メイダン門別名古屋笠松園田姫路高知佐賀金沢盛岡水沢]+)(\d{1,2})$/);
                    // 次に中止/取消のパターンをチェック（コース名の「中」と区別）
                    const dnfPlaceMatch = line.match(/(阪神|京都|東京|大井|船橋|川崎|浦和|新潟|福島|小倉|札幌|函館|メイダン|門別|名古屋|笠松|園田|姫路|高知|佐賀|金沢|盛岡|水沢)(中|取|除|失)$/);
                    
                    if (numericPlaceMatch) {
                        lastRace.lastRaceOrder = parseInt(numericPlaceMatch[2]);
                        console.log('前走着順抽出:', line, '→', lastRace.lastRaceOrder);
                    } else if (dnfPlaceMatch) {
                        lastRace.lastRaceOrder = 'DNS'; // Did Not Start/Finish
                        console.log('前走着順抽出（中断/取消）:', line, '→', lastRace.lastRaceOrder);
                    } else {
                        console.log('前走着順抽出失敗:', line);
                    }

                    // コースの抽出（中央競馬場 + 主要地方競馬場）
                    const courses = [
                        // 中央競馬場
                        '中山', '東京', '京都', '阪神', '新潟', '福島', '中京', '小倉', '札幌', '函館', 'メイダン',
                        // 南関東地方競馬
                        '大井', '船橋', '川崎', '浦和',
                        // その他主要地方競馬場
                        '門別', '名古屋', '笠松', '園田', '姫路', '高知', '佐賀', '金沢', '盛岡', '水沢'
                    ];
                    for (const course of courses) {
                        if (line.includes(course)) {
                            lastRace.lastRaceCourse = course;
                            break;
                        }
                    }
                    
                    // 次の行でレース名とレースレベルをチェック
                    const nextLine = lines[i + 1]?.trim() || '';
                    if (nextLine && !nextLine.match(/\d{4}\.\d{2}\.\d{2}/) && !nextLine.includes('芝') && !nextLine.includes('ダ')) {
                        lastRace.lastRaceName = nextLine;
                        console.log('前走レース名抽出:', nextLine);
                        
                        // レースレベルの抽出
                        if (nextLine.includes('G1') || nextLine.includes('GI')) {
                            lastRace.lastRaceLevel = 'G1';
                        } else if (nextLine.includes('G2') || nextLine.includes('GII')) {
                            lastRace.lastRaceLevel = 'G2';
                        } else if (nextLine.includes('G3') || nextLine.includes('GIII')) {
                            lastRace.lastRaceLevel = 'G3';
                        } else if (nextLine.includes('Listed') || nextLine.includes('L')) {
                            lastRace.lastRaceLevel = 'L';
                        } else if (nextLine.includes('OP') || nextLine.includes('オープン')) {
                            lastRace.lastRaceLevel = 'OP';
                        } else if (nextLine.includes('3勝')) {
                            lastRace.lastRaceLevel = '3勝';
                        } else if (nextLine.includes('2勝')) {
                            lastRace.lastRaceLevel = '2勝';
                        } else if (nextLine.includes('1勝')) {
                            lastRace.lastRaceLevel = '1勝';
                        } else if (nextLine.includes('未勝利')) {
                            lastRace.lastRaceLevel = '未勝利';
                        } else if (nextLine.includes('新馬')) {
                            lastRace.lastRaceLevel = '新馬';
                        }
                        
                        if (lastRace.lastRaceLevel) {
                            console.log('前走レースレベル抽出:', lastRace.lastRaceLevel);
                        }
                    }
                }
            }
            
            // 前走タイム、距離、馬場種別、馬場状態の抽出（例: "芝2000 1:56.2 良"または"ダ1800 1:53.6 良"）
            if (foundValidRace && !lastRace.lastRaceTime && (line.includes('芝') || line.includes('ダ')) && line.match(/\d+:\d+\.\d+/)) {
                const timeMatch = line.match(/(\d+):(\d+\.\d+)/);
                if (timeMatch) {
                    lastRace.lastRaceTime = `${timeMatch[1]}:${timeMatch[2]}`;
                    console.log('前走タイム抽出:', lastRace.lastRaceTime);
                }
                
                // 距離と馬場種別の抽出
                const trackTypeMatch = line.match(/(芝|ダ)(\d+)/);
                if (trackTypeMatch) {
                    // "ダ" を "ダート" に変換してUI互換性を確保
                    const rawTrackType = trackTypeMatch[1];
                    lastRace.lastRaceTrackType = rawTrackType === 'ダ' ? 'ダート' : rawTrackType;
                    lastRace.lastRaceDistance = parseInt(trackTypeMatch[2]);
                    console.log('前走馬場種別抽出:', rawTrackType, '→', lastRace.lastRaceTrackType);
                    console.log('前走距離抽出:', lastRace.lastRaceDistance);
                }
                
                // 馬場状態の抽出
                if (line.includes('良')) lastRace.lastRaceTrackCondition = '良';
                else if (line.includes('稍')) lastRace.lastRaceTrackCondition = '稍重';
                else if (line.includes('重')) lastRace.lastRaceTrackCondition = '重';
                else if (line.includes('不')) lastRace.lastRaceTrackCondition = '不良';
                
                if (lastRace.lastRaceTrackCondition) {
                    console.log('前走馬場状態抽出:', lastRace.lastRaceTrackCondition);
                }
            }
            
            // 前走馬数・馬番・人気・騎手・斤量の抽出（例: "15頭 5番 2人 横山和生 58.0"）
            if (foundValidRace && !lastRace.lastRaceHorseCount && line.includes('頭') && line.includes('番') && line.includes('人')) {
                const orderMatch = line.match(/(\d+)頭\s+(\d+)番\s+(\d+)人/);
                if (orderMatch) {
                    lastRace.lastRaceHorseCount = parseInt(orderMatch[1]);
                    lastRace.lastRacePopularity = parseInt(orderMatch[3]);
                    console.log('前走馬数抽出:', lastRace.lastRaceHorseCount, '頭');
                    console.log('前走人気抽出:', lastRace.lastRacePopularity, '番人気');
                }
                
                // 前走騎手と斤量の抽出
                if (!lastRace.lastRaceJockey) {
                    const jockeyWeightMatch = line.match(/(\d+)頭\s+(\d+)番\s+(\d+)人\s+([^\s]+)\s+(\d+\.?\d*)/);
                    if (jockeyWeightMatch) {
                        lastRace.lastRaceJockey = jockeyWeightMatch[4];
                        lastRace.lastRaceWeight = parseFloat(jockeyWeightMatch[5]);
                        console.log('前走騎手抽出:', line, '→', lastRace.lastRaceJockey);
                    } else {
                        console.log('前走騎手抽出失敗:', line);
                    }
                }
            }

                            
            // 前走情報が揃ったら完了フラグを立てる
            if (foundValidRace && lastRace.lastRaceTime && lastRace.lastRaceDistance && lastRace.lastRaceTrackCondition && lastRace.lastRaceJockey) {
                raceCompleted = true;
                console.log('前走情報抽出完了');
                //break;
            }
            

            // 上がり3Fの抽出（例: "9-9-6-5 (38.9)"）
            if (foundValidRace && !lastRace.lastRaceAgari && line.match(/\(\d{2}\.\d\)/)) {
                const agariMatch = line.match(/\((\d{1,2}\.\d)\)/);
                if (agariMatch) {
                    lastRace.lastRaceAgari = parseFloat(agariMatch[1]);
                    console.log('上がり3F抽出:', lastRace.lastRaceAgari);
                }
            }
        
            // 映像を見る、で前走情報終了
            if (line.includes('映像を見る')) {
                console.log('映像を見る検出、前走解析終了');
                break;
            }


            i++;
        }
        
        lastRace.nextIndex = i;
        return lastRace;
    }
    
    // 休養情報や特殊情報かどうかを判定
    static isRestOrSpecialInfo(line) {
        const restPatterns = [
            /^\d+ヵ?月休養$/,  // "4ヵ月休養"
            /^鉄砲\s*\[[\d\.]+\]$/,  // "鉄砲 [1.0.0.3]"
            /^\d+走目\s*\[[\d\.]+\]$/,  // "2走目 [1.1.0.0]"
            /^\[[\d\.]+\]$/,  // "[1.0.0.3]"
            /^休養$/,  // "休養"
            /以下/,  // "以下"
            /転厩/,  // "転厩"
            /外厩/   // "外厩"
        ];
        
        return restPatterns.some(pattern => pattern.test(line));
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
        
        for (let i = 0; i < Math.min(100, lines.length); i++) {
            const line = lines[i].trim();
            
            // レース名の抽出（例: "大阪杯 GI"）
            if (!raceInfo.name && (line.includes('GI') || line.includes('GII') || line.includes('GIII'))) {
                // 前走情報のレース名を除外するため、日付の前にあるレース名を探す
                const nextLines = lines.slice(i, i + 5);
                const hasDate = nextLines.some(nextLine => nextLine.match(/\d{4}\.\d{2}\.\d{2}/));
                if (!hasDate) {
                    raceInfo.name = line;
                    ////console.log('レース名抽出:', raceInfo.name);
                }
            }
            
            // 開催日の抽出（例: "2025.04.06 阪神1"）
            if (!raceInfo.date && line.match(/\d{4}\.\d{2}\.\d{2}/)) {
                const dateMatch = line.match(/(\d{4})\.(\d{2})\.(\d{2})/);
                if (dateMatch) {
                    raceInfo.date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
                    ////console.log('開催日抽出:', raceInfo.date);
                }
            }
            
            // コースの抽出（例: "2025.04.06 阪神1"）
            if (!raceInfo.course && line.match(/\d{4}\.\d{2}\.\d{2}/)) {
                const courses = [
                    // 中央競馬場
                    '中山', '東京', '京都', '阪神', '新潟', '福島', '中京', '小倉', '札幌', '函館',
                    // 南関東地方競馬
                    '大井', '船橋', '川崎', '浦和',
                    // その他主要地方競馬場
                    '門別', '名古屋', '笠松', '園田', '姫路', '高知', '佐賀', '金沢', '盛岡', '水沢'
                ];
                for (const course of courses) {
                    if (line.includes(course)) {
                        raceInfo.course = course;
                        ////console.log('コース抽出:', raceInfo.course);
                        break;
                    }
                }
            }
            
            // 距離と馬場種別の抽出（例: "芝2000 1:56.2 良"）
            if (!raceInfo.distance && (line.includes('芝') || line.includes('ダ'))) {
                const distanceMatch = line.match(/(芝|ダ)(\d+)/);
                if (distanceMatch) {
                    raceInfo.distance = distanceMatch[2];
                    // "ダ" を "ダート" に変換してUI互換性を確保
                    raceInfo.trackType = distanceMatch[1] === 'ダ' ? 'ダート' : distanceMatch[1];
                    ////console.log('距離抽出:', raceInfo.distance, '馬場種別:', raceInfo.trackType);
                }
            }
            
            // 馬場状態の抽出（例: "芝2000 1:56.2 良"）
            if (!raceInfo.trackCondition && (line.includes('良') || line.includes('稍重') || line.includes('重') || line.includes('不良'))) {
                if (line.includes('良')) raceInfo.trackCondition = '良';
                else if (line.includes('稍重')) raceInfo.trackCondition = '稍重';
                else if (line.includes('重')) raceInfo.trackCondition = '重';
                else if (line.includes('不良')) raceInfo.trackCondition = '不良';
                ////console.log('馬場状態抽出:', raceInfo.trackCondition);
            }
        }
        
        return raceInfo;
    }

    // 既存のメソッドは保持（後方互換性のため）
    static convertRawData() {
        ////console.log('=== convertRawDataメソッド開始 ===');
        
        try {
            ////console.log('convertRawDataメソッドが呼び出されました');
            
            const rawData = document.getElementById('rawDataInput').value;
            ////console.log('convertRawData - 入力データ:', rawData);
            
            if (!rawData.trim()) {
                ////console.log('convertRawData - データが空です');
                showMessage('生データを入力してください', 'error');
                return;
            }

            ////console.log('convertRawData - netkeiba形式判定開始');
            // netkeiba形式かどうかを判定
            let isNetkeiba = false;
            try {
                isNetkeiba = DataConverter.isNetkeibaFormat(rawData);
                ////console.log('convertRawData - 形式判定結果:', isNetkeiba);
            } catch (formatError) {
                console.error('形式判定エラー:', formatError);
                isNetkeiba = false;
            }
            
            if (isNetkeiba) {
                ////console.log('convertRawData - netkeiba形式として処理');
                try {
                    const { raceInfo, horses } = DataConverter.parseNetkeibaData(rawData);
                    ////console.log('convertRawData - 解析結果:', { raceInfo, horses });
                    DataConverter.processConvertedData(raceInfo, horses);
                } catch (parseError) {
                    console.error('netkeiba解析エラー:', parseError);
                    showMessage('netkeibaデータの解析中にエラーが発生しました: ' + parseError.message, 'error');
                }
            } else {
                ////console.log('convertRawData - 既存形式として処理');
                // 既存の形式で処理（簡略化）
                const raceInfo = { name: '', date: '', course: '', distance: '', trackType: '', trackCondition: '' };
                const horses = [];
                DataConverter.processConvertedData(raceInfo, horses);
            }
        } catch (error) {
            console.error('convertRawDataメソッド内エラー:', error);
            console.error('エラースタック:', error.stack);
            showMessage('データ変換中にエラーが発生しました: ' + error.message, 'error');
        }
        
        ////console.log('=== convertRawDataメソッド終了 ===');
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
                console.log('=== 馬データをHorseManagerに送信 ===');
                console.log('馬名:', horse.name);
                console.log('父:', horse.sire);
                console.log('母:', horse.dam);
                console.log('母父:', horse.damSire);
                console.log('全データ:', horse);
                HorseManager.addHorseFromData(horse);
            });
            
            showMessage(`${horses.length}頭のデータを変換しました！`, 'info');
            document.getElementById('rawDataInput').value = '';
        } else {
            showMessage('データの変換に失敗しました。形式を確認してください。', 'error');
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
        const raceLevel = document.getElementById('raceLevel').value;
        
        ////console.log('=== レース基本情報を全馬に適用 ===');
        ////console.log('レース名:', raceName);
        ////console.log('レース日:', raceDate);
        ////console.log('コース:', raceCourse);
        ////console.log('距離:', raceDistance);
        ////console.log('馬場種別:', raceTrackType);
        ////console.log('馬場状態:', raceTrackCondition);
        
        // 全馬のUIを更新
        const horseCards = document.querySelectorAll('.horse-card');
        horseCards.forEach((card, index) => {
            ////console.log(`馬${index + 1}のUIを更新中...`);
            
            // コースの更新
            if (raceCourse) {
                const courseSelect = card.querySelector('select[name="course"]');
                if (courseSelect) {
                    courseSelect.value = raceCourse;
                    ////console.log(`馬${index + 1}のコースを${raceCourse}に更新`);
                }
            }
            
            // 距離の更新
            if (raceDistance) {
                const distanceSelect = card.querySelector('select[name="distance"]');
                if (distanceSelect) {
                    distanceSelect.value = raceDistance;
                    ////console.log(`馬${index + 1}の距離を${raceDistance}mに更新`);
                }
            }
            
            // 馬場種別の更新
            if (raceTrackType) {
                const trackTypeSelect = card.querySelector('select[name="trackType"]');
                if (trackTypeSelect) {
                    trackTypeSelect.value = raceTrackType;
                    ////console.log(`馬${index + 1}の馬場種別を${raceTrackType}に更新`);
                }
            }
            
            // 馬場状態の更新
            if (raceTrackCondition) {
                const trackConditionSelect = card.querySelector('select[name="trackCondition"]');
                if (trackConditionSelect) {
                    trackConditionSelect.value = raceTrackCondition;
                    ////console.log(`馬${index + 1}の馬場状態を${raceTrackCondition}に更新`);
                }
            }
            
            // 今回レースレベルの更新
            if (raceLevel) {
                const raceLevelSelect = card.querySelector('select[name="raceLevel"]');
                if (raceLevelSelect) {
                    raceLevelSelect.value = raceLevel;
                    ////console.log(`馬${index + 1}の今回レースレベルを${raceLevel}に更新`);
                }
            }
        });
        
        ////console.log('=== レース基本情報の適用完了 ===');
        showMessage('レース基本情報を全馬に適用しました', 'info');
    }
    
    static recalculateRestDays(raceDateParam) {
        const raceDate = raceDateParam || document.getElementById('raceDate').value;
        if (!raceDate) {
            ////console.log('レース日が設定されていません');
            return;
        }
        
        ////console.log('=== 休養日数の再計算開始 ===');
        ////console.log('レース日:', raceDate);
        ////console.log('レース日タイプ:', typeof raceDate);
        
        // 全馬のUIを更新
        const horseCards = document.querySelectorAll('.horse-card');
        ////console.log('検出された馬の数:', horseCards.length);
        
        horseCards.forEach((card, index) => {
            ////console.log(`\n--- 馬${index + 1}の休養日数を計算中 ---`);
            
            // 前走日を取得
            const lastRaceDateInput = card.querySelector('input[name="lastRaceDate"]');
            ////console.log('前走日入力要素:', lastRaceDateInput);
            
            if (!lastRaceDateInput) {
                ////console.log(`馬${index + 1}: 前走日入力要素が見つかりません`);
                return;
            }
            
            if (!lastRaceDateInput.value) {
                ////console.log(`馬${index + 1}: 前走日が設定されていません`);
                return;
            }
            
            const lastRaceDate = lastRaceDateInput.value;
            ////console.log(`馬${index + 1}の前走日:`, lastRaceDate);
            ////console.log('前走日タイプ:', typeof lastRaceDate);
            
            // 休養日数を計算
            const lastDate = new Date(lastRaceDate);
            const raceDateObj = new Date(raceDate);
            
            ////console.log('前走日オブジェクト:', lastDate);
            ////console.log('レース日オブジェクト:', raceDateObj);
            ////console.log('前走日が有効か:', !isNaN(lastDate.getTime()));
            ////console.log('レース日が有効か:', !isNaN(raceDateObj.getTime()));
            
            if (isNaN(lastDate.getTime()) || isNaN(raceDateObj.getTime())) {
                ////console.log(`馬${index + 1}: 日付の解析に失敗しました`);
                return;
            }
            
            const diffTime = Math.abs(raceDateObj - lastDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            ////console.log(`馬${index + 1}の休養日数:`, diffDays, '日');
            ////console.log('差分時間（ミリ秒）:', diffTime);
            
            // 休養期間カテゴリを決定
            let restDaysCategory;
            if (diffDays <= 7) {
                restDaysCategory = 7;
            } else if (diffDays <= 14) {
                restDaysCategory = 14;
            } else if (diffDays <= 21) {
                restDaysCategory = 21;
            } else if (diffDays <= 28) {
                restDaysCategory = 28;
            } else if (diffDays <= 35) {
                restDaysCategory = 35;
            } else if (diffDays <= 42) {
                restDaysCategory = 42;
            } else if (diffDays <= 49) {
                restDaysCategory = 49;
            } else {
                restDaysCategory = 56;
            }
            
            ////console.log(`馬${index + 1}の休養期間カテゴリ:`, restDaysCategory);
            
            // UIの休養期間セレクトボックスを更新
            const restDaysSelect = card.querySelector('select[name="restDays"]');
            ////console.log('休養期間セレクトボックス:', restDaysSelect);
            
            if (restDaysSelect) {
                ////console.log('更新前の値:', restDaysSelect.value);
                ////console.log('更新前の選択されたオプション:', restDaysSelect.options[restDaysSelect.selectedIndex]?.text);
                
                // 値を設定
                restDaysSelect.value = restDaysCategory;
                
                // 値が正しく設定されたか確認
                ////console.log('更新後の値:', restDaysSelect.value);
                ////console.log('更新後の選択されたオプション:', restDaysSelect.options[restDaysSelect.selectedIndex]?.text);
                
                // 利用可能なオプションを確認
                ////console.log('利用可能なオプション:');
                for (let i = 0; i < restDaysSelect.options.length; i++) {
                    const option = restDaysSelect.options[i];
                    ////console.log(`  ${option.value}: ${option.text} ${option.selected ? '(選択中)' : ''}`);
                }
                
                // 値が期待通りに設定されているか確認
                if (restDaysSelect.value == restDaysCategory) {
                    ////console.log(`✅ 馬${index + 1}の休養期間を${restDaysCategory}に更新成功 (実際の日数: ${diffDays}日)`);
                } else {
                    ////console.log(`❌ 馬${index + 1}の休養期間の更新に失敗: 期待値=${restDaysCategory}, 実際の値=${restDaysSelect.value}`);
                }
            } else {
                ////console.log(`馬${index + 1}: 休養期間セレクトボックスが見つかりません`);
            }
        });
        
        ////console.log('=== 休養日数の再計算完了 ===');
        showMessage('休養日数を再計算しました', 'info');
    }
    
    static bulkInput() {
        ////console.log('bulkInputメソッドが呼び出されました');
        
        const rawDataInput = document.getElementById('rawDataInput');
        ////console.log('rawDataInput要素:', rawDataInput);
        
        if (!rawDataInput) {
            console.error('生データ入力エリアが見つかりません');
            alert('生データ入力エリアが見つかりません');
            return;
        }
        
        const rawData = rawDataInput.value;
        ////console.log('入力されたデータ:', rawData);
        
        if (!rawData.trim()) {
            ////console.log('データが空です');
            showMessage('生データを入力してください', 'error');
            return;
        }
        
        try {
            ////console.log('データ変換機能を呼び出します');
            // データ変換機能を呼び出し
            try {
                DataConverter.convertRawData();
                ////console.log('データ変換機能の呼び出し完了');
            } catch (convertError) {
                console.error('convertRawData呼び出しエラー:', convertError);
                showMessage('データ変換中にエラーが発生しました: ' + convertError.message, 'error');
            }
        } catch (error) {
            console.error('一括入力エラー:', error);
            showMessage('一括入力中にエラーが発生しました。', 'error');
        }
    }
    
    // 血統判定関数群（改善版 - テスト版から統合）
    
    // 主要血統リスト（テスト成功版から更新）
    static stallionNames = [
        'ディープインパクト', 'ハーツクライ', 'ロードカナロア', 'オルフェーヴル', 
        'キングカメハメハ', 'ダイワメジャー', 'クロフネ', 'ステイゴールド',
        'ドゥラメンテ', 'モーリス', 'エピファネイア', 'ルーラーシップ',
        'キタサンブラック', 'ゴールドシップ', 'ホッコータルマエ', 'カレンチャン',
        'リアルスティール', 'サンデーサイレンス', 'ノーザンテースト', 'ミスタープロスペクター',
        'ストームキャット', 'More Than Ready', 'ハービンジャー'
    ];
    
    static mareNames = [
        'ベラジオオペラ', 'ドゥレッツァ', 'エアルーティーン', 'モアザンセイクリッド',
        'ランドオーバーシー', 'シンハライト', 'レディアンバサダー', 'サクラトップリアル', 'マーガレットメドウ'
    ];
    
    static horseNames = [
        'ベラジオオペラ', 'ドゥレッツァ', 'サトノエピック', 'サトノダイヤモンド', 'ジェンティルドンナ', 'サクラトップリアル'
    ];
    
    // 父系判定（登録血統 + 文脈パターン判定）
    static isSireName(line) {
        const trimmed = line.trim();
        
        // 登録済み有名種牡馬はそのまま認識
        if (this.stallionNames.includes(trimmed)) {
            return true;
        }
        
        // 父系判定は登録済みのみに限定（パターンベースは文脈付きで別途実行）
        return false;
    }
    
    // 父系候補判定（順序・文脈重視版）
    static isPotentialSire(line, step) {
        const trimmed = line.trim();
        
        // step=1（父系期待位置）でのみパターン判定を適用
        if (step !== 1) return false;
        
        // 明らかに馬名でないもの、データ行は除外
        if (DataConverter.isKnownNonHorseName(trimmed) || trimmed.length < 3) {
            return false;
        }
        
        // 既知の馬名・母系は父系候補から除外
        if (DataConverter.horseNames.includes(trimmed) || DataConverter.mareNames.includes(trimmed)) {
            return false;
        }
        
        // カタカナ・漢字・英字の名前を父系候補とする
        if (/^[ァ-ヶー\u4E00-\u9FAF\sA-Za-z]+$/.test(trimmed)) {
            return true;
        }
        
        return false;
    }
    
    // 母系候補判定（順序・文脈重視版）  
    static isPotentialMare(line, step) {
        const trimmed = line.trim();
        
        // step=3（母系期待位置）でのみパターン判定を適用
        if (step !== 3) return false;
        
        // 明らかに馬名でないもの、データ行は除外
        if (DataConverter.isKnownNonHorseName(trimmed) || trimmed.length < 3) {
            return false;
        }
        
        // 既知の父系・馬名は除外
        if (DataConverter.stallionNames.includes(trimmed) || DataConverter.horseNames.includes(trimmed)) {
            return false;
        }
        
        // カタカナ・漢字・英字の名前を母系候補とする
        if (/^[ァ-ヶー\u4E00-\u9FAF\sA-Za-z]+$/.test(trimmed)) {
            return true;
        }
        
        return false;
    }
    
    // 馬名候補判定（より包括的）
    static isPotentialHorseName(line) {
        const trimmed = line.trim();
        
        // 空文字や短すぎる場合は除外
        if (!trimmed || trimmed.length < 2) return false;
        
        // 既知の馬名は必ず馬名候補とする
        if (DataConverter.horseNames.includes(trimmed)) {
            return true;
        }
        
        // 明らかにデータ行のものは除外
        if (DataConverter.isKnownNonHorseName(trimmed)) {
            return false;
        }
        
        // 登録済み血統でも出走馬として扱う可能性がある（馬名優先）
        // ただし、明らかに有名種牡馬は除外
        const famousStallions = ['ディープインパクト', 'ハーツクライ', 'ロードカナロア', 'オルフェーヴル', 'キングカメハメハ', 'ダイワメジャー', 'クロフネ', 'ステイゴールド', 'ドゥラメンテ', 'キタサンブラック'];
        if (famousStallions.includes(trimmed)) {
            return false;
        }
        
        // カタカナ・ひらがな・漢字・英字で構成された名前を馬名候補とする
        if (/^[ァ-ヶー\u3040-\u309F\u4E00-\u9FAF\sA-Za-z]+$/.test(trimmed)) {
            return true;
        }
        
        return false;
    }
    
    static isHorseName(line) {
        // 血統名を除外
        const excludeNames = [
            'キタサンブラック', 'ディープインパクト', 'ロードカナロア', 'ランドオーバーシー',
            'エアルーティーン', 'ベラジオオペラ', 'ドゥレッツァ', 'モアザンセイクリッド'
        ];
        
        return /^[ァ-ヶー\u3040-\u309F\u4E00-\u9FAF\sA-Za-z]+$/.test(line) && 
               line.length >= 2 && 
               line.length <= 15 &&
               !line.includes('人気') &&
               !line.includes('kg') &&
               !line.includes('週') &&
               !line.includes('月') &&
               !line.includes('日') &&
               !line.includes('競馬') &&
               !line.includes('レース') &&
               !line.includes('栗東') &&
               !line.includes('美浦') &&
               !excludeNames.includes(line) &&
               !DataConverter.isSireName(line);
    }
    
    static isDamName(line) {
        const commonDams = [
            'ランドオーバーシー', 'エアルーティーン', 'ベラジオオペラ', 'ドゥレッツァ', 
            'モアザンセイクリッド', 'プリンセスオリビア', 'エアグルーヴ', 'ダンシングブレーヴ',
            'シンコウラブリイ', 'アドマイヤグルーヴ', 'ダイワスカーレット', 'ヴォードヴィル',
            'フサイチパンドラ', 'スイートジャスミン', 'レネットグルーヴ', 'サウンドトゥルー'
        ];
        
        return (commonDams.includes(line) || 
                (/^[ァ-ヶー\u3040-\u309F\u4E00-\u9FAF\sA-Za-z]+$/.test(line) && 
                 line.length >= 3 && 
                 line.length <= 15 &&
                 !line.includes('人気') &&
                 !line.includes('kg') &&
                 !line.includes('週') &&
                 !line.includes('競馬') &&
                 !line.includes('栗東') &&
                 !line.includes('美浦') &&
                 !DataConverter.isSireName(line)));
    }
    
    static isDamSireName(line) {
        return line.includes('(') && line.includes(')');
    }
    
    static extractDamSireFromLine(line) {
        const parenthesesMatch = line.match(/\(([^)]+)\)/);
        if (parenthesesMatch) {
            return parenthesesMatch[1].trim();
        }
        return line;
    }
    
    // 明らかに馬名でない項目を判定
    static isKnownNonHorseName(line) {
        const nonHorsePatterns = [
            /^\d+$/, // 数字のみ
            /^\d+\.\d+$/, // 小数点
            /^\([^)]*\)$/, // 括弧内のみ
            /週|月|日/, // 期間
            /kg|人気|着/, // レース関連用語
            /栗東|美浦/, // トレーニングセンター
            /芝|ダ/, // 馬場種別
            /良|稍|重|不/, // 馬場状態
            /GI|GII|GIII|G1|G2|G3/, // グレード
            /^\d{4}\.\d{2}\.\d{2}/, // 日付
            /映像を見る/, // UI要素
            /以下|転厩|外厩|休養/, // 特殊情報
        ];
        
        return nonHorsePatterns.some(pattern => pattern.test(line));
    }
}

// グローバル関数として公開
window.loadSampleRawData = DataConverter.loadSampleRawData;
window.DataConverter = DataConverter;