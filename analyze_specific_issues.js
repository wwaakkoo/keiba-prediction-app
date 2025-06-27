// 具体的な問題のあるデータを分析
const fs = require('fs');
const path = require('path');

// DataConverterロジックのNode.js版（簡易）
class DataConverterAnalyzer {
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
        'ランドオーバーシー', 'シンハライト', 'レディアンバサダー', 'サクラトップリアル', 'マーガレットメドウ',
        'ムーンライトダンス', 'レキシールー'  // 問題データの母系を追加
    ];
    
    static horseNames = [
        'ベラジオオペラ', 'ドゥレッツァ', 'サトノエピック', 'サトノダイヤモンド', 'ジェンティルドンナ', 'テストホース', 'サクラトップリアル',
        'ビップジーニー', 'ダノンキラウェア'  // 問題データの馬名を追加
    ];
    
    static isMarkLine(line) {
        const marks = ['--', '◎', '◯', '▲', '△', '☆', '✓', '消'];
        return marks.some(mark => line === mark || line.startsWith(mark));
    }
    
    static isHorseStart(line) {
        const tokens = line.trim().split(/\s+/);
        return tokens.length === 2 && tokens.every(tok => /^\d+$/.test(tok));
    }
    
    static isSire(line) {
        const trimmed = line.trim();
        return this.stallionNames.includes(trimmed);
    }
    
    static isMare(line) {
        const trimmed = line.trim();
        if (this.horseNames.includes(trimmed)) {
            return false;
        }
        return this.mareNames.includes(trimmed);
    }
    
    static isPotentialSire(line, step) {
        const trimmed = line.trim();
        if (step !== 1) return false;
        if (this.isKnownNonHorseName(trimmed) || trimmed.length < 3) {
            return false;
        }
        if (this.horseNames.includes(trimmed) || this.mareNames.includes(trimmed)) {
            return false;
        }
        if (/^[ァ-ヶー\u4E00-\u9FAF\sA-Za-z]+$/.test(trimmed)) {
            return true;
        }
        return false;
    }
    
    static isPotentialMare(line, step) {
        const trimmed = line.trim();
        if (step !== 3) return false;
        if (this.isKnownNonHorseName(trimmed) || trimmed.length < 3) {
            return false;
        }
        if (this.stallionNames.includes(trimmed) || this.horseNames.includes(trimmed)) {
            return false;
        }
        if (/^[ァ-ヶー\u4E00-\u9FAF\sA-Za-z]+$/.test(trimmed)) {
            return true;
        }
        return false;
    }
    
    static isPotentialHorseName(line) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.length < 2) return false;
        if (this.horseNames.includes(trimmed)) {
            return true;
        }
        if (this.isKnownNonHorseName(trimmed)) {
            return false;
        }
        const famousStallions = ['ディープインパクト', 'ハーツクライ', 'ロードカナロア', 'オルフェーヴル', 'キングカメハメハ', 'ダイワメジャー', 'クロフネ', 'ステイゴールド', 'ドゥラメンテ', 'キタサンブラック'];
        if (famousStallions.includes(trimmed)) {
            return false;
        }
        if (/^[ァ-ヶー\u3040-\u309F\u4E00-\u9FAF\sA-Za-z]+$/.test(trimmed)) {
            return true;
        }
        return false;
    }
    
    static extractDamSire(line) {
        const parenthesesMatch = line.match(/\(([^)]+)\)/);
        if (parenthesesMatch) {
            return parenthesesMatch[1].trim();
        }
        return null;
    }
    
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
    
    static analyzeSpecificCase(rawData, expectedResult) {
        console.log('\n=== 具体的ケース分析開始 ===');
        console.log('期待結果:', expectedResult);
        
        const lines = rawData.split('\n').map(line => line.trim()).filter(line => line);
        console.log('\n入力データ:');
        lines.forEach((line, index) => {
            console.log(`  [${index}]: "${line}"`);
        });
        
        const horse = {
            name: '',
            sire: '',
            dam: '',
            damSire: ''
        };
        
        let bloodlineStep = 0;
        const processLog = [];
        
        // 馬開始行を見つける
        let startIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            if (this.isHorseStart(lines[i])) {
                startIndex = i;
                console.log(`\n馬開始検出: i=${i}, line="${lines[i]}"`);
                break;
            }
        }
        
        if (startIndex === -1) {
            console.log('エラー: 馬開始行が見つからない');
            return null;
        }
        
        let i = startIndex;
        while (i < lines.length) {
            const line = lines[i] || '';
            
            // 次の馬の開始を検出したら終了
            if (i > startIndex && this.isHorseStart(line)) {
                processLog.push(`次の馬開始検出で終了: i=${i}, line="${line}"`);
                break;
            }
            
            const stepInfo = `(step=${bloodlineStep})`;
            processLog.push(`i=${i}: "${line}" ${stepInfo}`);
            
            // 各判定関数の結果をログ出力
            console.log(`\nStep ${i}: "${line}" ${stepInfo}`);
            console.log(`  isMarkLine: ${this.isMarkLine(line)}`);
            console.log(`  isSire: ${this.isSire(line)}`);
            console.log(`  isPotentialSire(step=${bloodlineStep}): ${this.isPotentialSire(line, bloodlineStep)}`);
            console.log(`  isPotentialHorseName: ${this.isPotentialHorseName(line)}`);
            console.log(`  isMare: ${this.isMare(line)}`);
            console.log(`  isPotentialMare(step=${bloodlineStep}): ${this.isPotentialMare(line, bloodlineStep)}`);
            console.log(`  extractDamSire: ${this.extractDamSire(line)}`);
            
            // 印行スキップ
            if (this.isMarkLine(line)) {
                processLog.push(`  → 印行スキップ`);
                bloodlineStep = 1;
                i++;
                continue;
            }
            
            // 血統データの順序に基づく抽出
            if (bloodlineStep === 1 && !horse.sire && (this.isSire(line) || this.isPotentialSire(line, bloodlineStep))) {
                horse.sire = line;
                processLog.push(`  → 父系抽出: ${line}`);
                bloodlineStep = 2;
            } else if (bloodlineStep === 2 && !horse.name && this.isPotentialHorseName(line)) {
                horse.name = line;
                processLog.push(`  → 馬名抽出: ${line}`);
                bloodlineStep = 3;
            } else if (bloodlineStep === 3 && !horse.dam && (this.isMare(line) || this.isPotentialMare(line, bloodlineStep))) {
                horse.dam = line;
                processLog.push(`  → 母系抽出: ${line}`);
                bloodlineStep = 4;
            } else if (!horse.damSire) {
                const damSire = this.extractDamSire(line);
                if (damSire) {
                    horse.damSire = damSire;
                    processLog.push(`  → 母父抽出: ${damSire} (from "${line}")`);
                }
            }
            
            // ステップスキップロジック
            if (bloodlineStep === 1 && !this.isSire(line) && this.isPotentialHorseName(line)) {
                horse.name = line;
                processLog.push(`  → [ステップスキップ]馬名抽出: ${line}`);
                bloodlineStep = 3;
            } else if (bloodlineStep === 2 && !this.isPotentialHorseName(line) && this.isMare(line)) {
                horse.dam = line;
                processLog.push(`  → [ステップスキップ]母系抽出: ${line}`);
                bloodlineStep = 4;
            }
            
            // フォールバック
            if (bloodlineStep >= 2) {
                if (!horse.sire && this.isSire(line)) {
                    horse.sire = line;
                    processLog.push(`  → [フォールバック]父系抽出: ${line}`);
                } else if (!horse.dam && this.isMare(line)) {
                    horse.dam = line;
                    processLog.push(`  → [フォールバック]母系抽出: ${line}`);
                }
            }
            
            i++;
        }
        
        console.log('\n=== 処理ログ ===');
        processLog.forEach(log => console.log(log));
        
        console.log('\n=== 抽出結果 ===');
        console.log(`馬名: ${horse.name || '未抽出'}`);
        console.log(`父系: ${horse.sire || '未抽出'}`);
        console.log(`母系: ${horse.dam || '未抽出'}`);
        console.log(`母父: ${horse.damSire || '未抽出'}`);
        
        console.log('\n=== 結果比較 ===');
        console.log(`馬名: 期待="${expectedResult.name}" 実際="${horse.name}" ${horse.name === expectedResult.name ? '✅' : '❌'}`);
        console.log(`父系: 期待="${expectedResult.sire}" 実際="${horse.sire}" ${horse.sire === expectedResult.sire ? '✅' : '❌'}`);
        console.log(`母系: 期待="${expectedResult.dam}" 実際="${horse.dam}" ${horse.dam === expectedResult.dam ? '✅' : '❌'}`);
        console.log(`母父: 期待="${expectedResult.damSire}" 実際="${horse.damSire}" ${horse.damSire === expectedResult.damSire ? '✅' : '❌'}`);
        
        return horse;
    }
}

// テストケース1: サトノアラジン（母系未抽出問題）
const testData1 = `1\t1\t
--
サトノアラジン
ビップジーニー
ムーンライトダンス
(Sinndar)
栗東・松下  
差中2週
486kg(0)
25.3 (7人気)
牡5栗

騎手名
58.0\t`;

const expected1 = {
    name: 'ビップジーニー',
    sire: 'サトノアラジン',
    dam: 'ムーンライトダンス',
    damSire: 'Sinndar'
};

console.log('########## テストケース1: サトノアラジン ##########');
DataConverterAnalyzer.analyzeSpecificCase(testData1, expected1);

// テストケース2: ダノンキラウェア（馬名誤認問題）
const testData2 = `5\t8\t
--
ロードカナロア
ダノンキラウェア
レキシールー
(Sligo Bay)
栗東・中内田  
先中46週
474kg(+16)
20.1 (6人気)
牝4黒鹿

騎手名
55.0\t`;

const expected2 = {
    name: 'ダノンキラウェア',
    sire: 'ロードカナロア',
    dam: 'レキシールー',
    damSire: 'Sligo Bay'
};

console.log('\n\n########## テストケース2: ダノンキラウェア ##########');
DataConverterAnalyzer.analyzeSpecificCase(testData2, expected2);
