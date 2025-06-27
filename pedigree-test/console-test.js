// Node.js用コンソールテスト

// PedigreeExtractorクラスを直接定義
class PedigreeExtractor {
    // 主要血統リスト
    static stallionNames = [
        'ディープインパクト', 'ハーツクライ', 'ロードカナロア', 'オルフェーヴル', 
        'キングカメハメハ', 'ダイワメジャー', 'クロフネ', 'ステイゴールド',
        'ドゥラメンテ', 'モーリス', 'エピファネイア', 'ルーラーシップ',
        'キタサンブラック', 'ゴールドシップ', 'ホッコータルマエ', 'カレンチャン'
    ];
    
    static mareNames = [
        'ベラジオオペラ', 'ドゥレッツァ', 'エアルーティーン', 'モアザンセイクリッド',
        'ランドオーバーシー', 'シンハライト', 'レディアンバサダー'
    ];
    
    static horseNames = [
        'ベラジオオペラ', 'ドゥレッツァ'  // テストデータの馬名
    ];
    
    // 父系判定
    static isSire(line) {
        return this.stallionNames.includes(line.trim());
    }
    
    // 母系判定（馬名候補でない場合のみ）
    static isMare(line) {
        const trimmed = line.trim();
        return this.mareNames.includes(trimmed) && !this.horseNames.includes(trimmed);
    }
    
    // 母父抽出（括弧内）
    static extractDamSire(line) {
        const match = line.match(/\(([^)]+)\)/);
        return match ? match[1].trim() : null;
    }
    
    // 印行判定
    static isMarkLine(line) {
        const marks = ['--', '◎', '◯', '▲', '△', '☆', '✓', '消'];
        return marks.some(mark => line === mark || line.startsWith(mark));
    }
    
    // 枠番・馬番行判定
    static isHorseStart(line) {
        const tokens = line.trim().split(/\s+/);
        return tokens.length === 2 && tokens.every(tok => /^\d+$/.test(tok));
    }
    
    // 馬名候補判定（最終的な馬名決定用）
    static isHorseName(line) {
        return this.horseNames.includes(line.trim());
    }
    
    // メイン血統抽出関数
    static extractPedigreeFromHorseData(lines, startIndex) {
        const horse = {
            name: '',
            sire: '',      // 父
            dam: '',       // 母
            damSire: ''    // 母父
        };
        
        let i = startIndex;
        const processLog = [];
        
        console.log(`\n=== 血統抽出開始 (startIndex: ${startIndex}) ===`);
        console.log('処理対象データ:');
        for (let debugIndex = startIndex; debugIndex < Math.min(startIndex + 10, lines.length); debugIndex++) {
            console.log(`  [${debugIndex}]: "${lines[debugIndex]?.trim() || ''}"`);
        }
        
        while (i < lines.length) {
            const line = lines[i]?.trim() || '';
            
            // 次の馬の開始を検出したら終了
            if (i > startIndex && this.isHorseStart(line)) {
                processLog.push(`次の馬開始検出で終了: i=${i}, line="${line}"`);
                break;
            }
            
            processLog.push(`i=${i}: "${line}"`);
            
            // 印行スキップ
            if (this.isMarkLine(line)) {
                processLog.push(`  → 印行スキップ`);
                i++;
                continue;
            }
            
            // 父系抽出
            if (!horse.sire && this.isSire(line)) {
                horse.sire = line;
                processLog.push(`  → 父系抽出: ${line}`);
            }
            
            // 母父抽出
            if (!horse.damSire) {
                const damSire = this.extractDamSire(line);
                if (damSire) {
                    horse.damSire = damSire;
                    processLog.push(`  → 母父抽出: ${damSire} (from "${line}")`);
                }
            }
            
            // 母系抽出
            if (!horse.dam && this.isMare(line)) {
                horse.dam = line;
                processLog.push(`  → 母系抽出: ${line}`);
            }
            
            // 馬名抽出（血統抽出が完了してから）
            if (!horse.name && this.isHorseName(line)) {
                horse.name = line;
                processLog.push(`  → 馬名抽出: ${line}`);
            }
            
            i++;
        }
        
        console.log('\n処理ログ:');
        processLog.forEach(log => console.log(log));
        
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
    
    // 全データを解析
    static parseAllHorses(rawData) {
        const lines = rawData.split('\n').map(line => line.trim()).filter(line => line);
        const horses = [];
        
        console.log('=== 全体データ解析開始 ===');
        console.log('入力データ行数:', lines.length);
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            console.log(`\nメインループ i=${i}: "${line}"`);
            
            if (this.isHorseStart(line)) {
                console.log(`馬開始検出: i=${i}`);
                const horseData = this.extractPedigreeFromHorseData(lines, i);
                horses.push(horseData);
                i = horseData.nextIndex - 1;  // forループでi++されるため-1
                console.log(`次のインデックスに移動: ${horseData.nextIndex}`);
            }
        }
        
        return horses;
    }
}

// テストデータ
const testData = `1\t1\t
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
58.0\t
1\t2\t
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
58.0\t`;

console.log('=== Node.js コンソール血統抽出テスト ===\n');

try {
    // 血統抽出実行
    const results = PedigreeExtractor.parseAllHorses(testData);
    
    console.log('\n=== 抽出結果サマリー ===');
    console.log(`抽出された馬の数: ${results.length}`);
    
    // 期待結果
    const expected = [
        { name: 'ベラジオオペラ', sire: 'ロードカナロア', dam: 'エアルーティーン', damSire: 'ハービンジャー' },
        { name: 'ドゥレッツァ', sire: 'ドゥラメンテ', dam: 'モアザンセイクリッド', damSire: 'More Than Ready' }
    ];
    
    // 結果検証
    let successCount = 0;
    let totalTests = 0;
    
    console.log('\n=== 詳細比較 ===');
    expected.forEach((exp, index) => {
        const actual = results[index];
        console.log(`\n--- 馬 ${index + 1}: ${exp.name} ---`);
        
        ['name', 'sire', 'dam', 'damSire'].forEach(field => {
            totalTests++;
            const actualValue = actual ? actual[field] : '未抽出';
            const success = actualValue === exp[field];
            if (success) successCount++;
            
            console.log(`${field.padEnd(8)}: 期待「${exp[field]}」→ 実際「${actualValue}」${success ? ' ✅' : ' ❌'}`);
        });
    });
    
    console.log('\n=== 最終結果 ===');
    console.log(`成功率: ${successCount}/${totalTests} (${Math.round((successCount/totalTests)*100)}%)`);
    console.log(`全体判定: ${successCount === totalTests ? '✅ 成功' : '❌ 失敗'}`);
    
    if (successCount !== totalTests) {
        console.log('\n=== 失敗原因分析 ===');
        expected.forEach((exp, index) => {
            const actual = results[index];
            if (!actual) {
                console.log(`馬${index + 1}: データが全く抽出されていません`);
                return;
            }
            
            ['name', 'sire', 'dam', 'damSire'].forEach(field => {
                if (actual[field] !== exp[field]) {
                    console.log(`馬${index + 1}.${field}: 「${exp[field]}」が抽出されませんでした (実際: 「${actual[field] || '未抽出'}」)`);
                }
            });
        });
    }
    
    console.log('\n=== 生データ出力 ===');
    console.log(JSON.stringify(results, null, 2));
    
} catch (error) {
    console.error('❌ テスト実行エラー:', error.message);
    console.error(error.stack);
}