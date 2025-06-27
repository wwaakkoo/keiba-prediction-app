// 正確なデータ構造に基づく血統抽出テスト
console.log('=== 正確な血統抽出テスト ===\n');

class CorrectPedigreeExtractor {
    static parseNetkeibaData(rawData) {
        const lines = rawData.split('\n').filter(line => line.trim());
        const horses = [];
        let currentHorse = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // 新しい馬の開始を検出（枠番・馬番で始まる行）
            if (/^\d+\s+\d+\s*$/.test(line)) {
                if (currentHorse && currentHorse.name) {
                    horses.push(currentHorse);
                }
                currentHorse = this.createNewHorse();
                console.log(`\n=== 新しい馬の解析開始 ===`);
                
                // 血統抽出を順次実行
                const result = this.extractPedigreeSequentially(lines, i);
                currentHorse = { ...currentHorse, ...result.horse };
                i = result.nextIndex - 1; // -1はforループのi++のため
                continue;
            }
        }
        
        // 最後の馬を追加
        if (currentHorse && currentHorse.name) {
            horses.push(currentHorse);
        }
        
        return horses;
    }
    
    static createNewHorse() {
        return {
            name: '',
            odds: 0,
            popularity: 0,
            jockey: '',
            age: 0,
            runningStyle: '',
            sire: '',      // 父
            dam: '',       // 母  
            damSire: '',   // 母父
            weightChange: 0
        };
    }
    
    static extractPedigreeSequentially(lines, startIndex) {
        const horse = this.createNewHorse();
        let i = startIndex;
        
        console.log(`開始インデックス: ${i}`);
        
        // 想定される構造：
        // 0: 枠番・馬番 (例: "1    1    ")
        // 1: 印 (例: "--" "◎" "消" など)
        // 2: 父系 (例: "キタサンブラック")
        // 3: 馬名 (例: "サトノエピック")
        // 4: 母系 (例: "ランドオーバーシー")
        // 5: 母父 (例: "(Bellamy Road)")
        // 6以降: その他情報
        
        let pedigreeIndex = 0;
        const marks = ['--', '◎', '◯', '▲', '△', '☆', '✓', '消'];
        
        while (i < lines.length) {
            const line = lines[i].trim();
            console.log(`行${i}: "${line}" (血統インデックス: ${pedigreeIndex})`);
            
            // 次の馬のデータの開始を検出したら終了
            if (i > startIndex && /^\d+\s+\d+\s*$/.test(line)) {
                console.log('次の馬のデータを検出、解析終了');
                break;
            }
            
            // 印の行をスキップ
            if (marks.some(mark => line === mark || line.startsWith(mark))) {
                console.log(`  → 印をスキップ: ${line}`);
                i++;
                continue;
            }
            
            // 血統情報を順次抽出
            if (pedigreeIndex === 0 && !horse.sire) {
                // 父系抽出
                if (this.isSireName(line)) {
                    horse.sire = line;
                    console.log(`  → 父系抽出: ${horse.sire}`);
                    pedigreeIndex++;
                }
            } else if (pedigreeIndex === 1 && !horse.name) {
                // 馬名抽出
                if (this.isHorseName(line)) {
                    horse.name = line;
                    console.log(`  → 馬名抽出: ${horse.name}`);
                    pedigreeIndex++;
                }
            } else if (pedigreeIndex === 2 && !horse.dam) {
                // 母系抽出
                if (this.isDamName(line)) {
                    horse.dam = line;
                    console.log(`  → 母系抽出: ${horse.dam}`);
                    pedigreeIndex++;
                }
            } else if (pedigreeIndex === 3 && !horse.damSire) {
                // 母父抽出
                if (this.isDamSireName(line)) {
                    horse.damSire = this.extractDamSireFromLine(line);
                    console.log(`  → 母父抽出: ${horse.damSire}`);
                    pedigreeIndex++;
                }
            } else {
                // その他の情報抽出
                this.extractOtherInfo(horse, line);
            }
            
            i++;
        }
        
        return { horse, nextIndex: i };
    }
    
    static isSireName(line) {
        const commonSires = [
            'ディープインパクト', 'ハーツクライ', 'ロードカナロア', 'オルフェーヴル', 
            'キングカメハメハ', 'ダイワメジャー', 'クロフネ', 'ステイゴールド',
            'ドゥラメンテ', 'モーリス', 'エピファネイア', 'ルーラーシップ',
            'キタサンブラック', 'ゴールドシップ', 'ホッコータルマエ', 'カレンチャン'
        ];
        
        return commonSires.includes(line) || 
               commonSires.some(sire => line.includes(sire));
    }
    
    static isHorseName(line) {
        // 馬名として適切かを判定
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
               !this.isSireName(line); // 種牡馬名ではない
    }
    
    static isDamName(line) {
        // 母馬名として適切かを判定
        return /^[ァ-ヶー\u3040-\u309F\u4E00-\u9FAF\sA-Za-z]+$/.test(line) && 
               line.length >= 3 && 
               line.length <= 15 &&
               !line.includes('人気') &&
               !line.includes('kg') &&
               !line.includes('週') &&
               !line.includes('競馬') &&
               !line.includes('栗東') &&
               !line.includes('美浦') &&
               !this.isSireName(line); // 種牡馬名ではない
    }
    
    static isDamSireName(line) {
        // 母父として適切かを判定（括弧内パターンも含む）
        return line.includes('(') && line.includes(')');
    }
    
    static extractDamSireFromLine(line) {
        const parenthesesMatch = line.match(/\(([^)]+)\)/);
        if (parenthesesMatch) {
            return parenthesesMatch[1].trim();
        }
        return line;
    }
    
    static extractOtherInfo(horse, line) {
        // 脚質の抽出
        if (!horse.runningStyle && line.match(/^(大|逃|先|差|追|自).*(週|日|月)/)) {
            const styleMatch = line.match(/^(大|逃|先|差|追|自)/);
            if (styleMatch) {
                const styleChar = styleMatch[1];
                switch (styleChar) {
                    case '大': horse.runningStyle = '逃げ'; break;
                    case '逃': horse.runningStyle = '逃げ'; break;
                    case '先': horse.runningStyle = '先行'; break;
                    case '差': horse.runningStyle = '差し'; break;
                    case '追': horse.runningStyle = '追込'; break;
                    case '自': horse.runningStyle = '自在'; break;
                }
                console.log(`  → 脚質抽出: ${horse.runningStyle} from "${line}"`);
            }
        }
        
        // オッズの抽出
        if (!horse.odds && line.includes('人気')) {
            const oddsMatch = line.match(/(\d+\.?\d*)\s*\((\d+)人気\)/);
            if (oddsMatch) {
                horse.odds = parseFloat(oddsMatch[1]);
                horse.popularity = parseInt(oddsMatch[2]);
                console.log(`  → オッズ抽出: ${horse.odds}倍 (${horse.popularity}人気)`);
            }
        }
        
        // 馬体重変化の抽出
        if (!horse.weightChange && line.includes('kg') && line.includes('(') && line.includes(')')) {
            const weightMatch = line.match(/(\d+)kg\(([+-]?\d+)\)/);
            if (weightMatch) {
                horse.weightChange = parseInt(weightMatch[2]);
                console.log(`  → 体重変化抽出: ${horse.weightChange}kg`);
            }
        }
    }
}

// 実際のテストデータ
const realTestData = `1    1    
--
キタサンブラック
サトノエピック
ランドオーバーシー
(Bellamy Road)
美浦・国枝  
差中13週
536kg(+8)
25.5 (7人気)
牡4鹿

ディー
57.0

2    2    
◎
ディープインパクト
リアルスティール
プリンセスオリビア
(Storm Cat)
栗東・池江  
先中8週
498kg(-2)
3.2 (1人気)
牡5黒鹿

武豊
58.0`;

// テスト実行
console.log('🧪 正確な血統抽出テスト開始\n');

const horses = CorrectPedigreeExtractor.parseNetkeibaData(realTestData);

console.log('\n📊 正確な抽出結果:');
horses.forEach((horse, index) => {
    console.log(`\n馬${index + 1}:`);
    console.log(`  馬名: ${horse.name || '未抽出'}`);
    console.log(`  父: ${horse.sire || '未抽出'}`);
    console.log(`  母: ${horse.dam || '未抽出'}`);
    console.log(`  母父: ${horse.damSire || '未抽出'}`);
    console.log(`  脚質: ${horse.runningStyle || '未抽出'}`);
    console.log(`  オッズ: ${horse.odds || '未抽出'}倍`);
    console.log(`  体重変化: ${horse.weightChange || 0}kg`);
    
    // 血統抽出成功率
    const pedigreeFields = [horse.sire, horse.dam, horse.damSire].filter(field => field).length;
    const overallFields = [horse.name, horse.sire, horse.dam, horse.damSire].filter(field => field).length;
    console.log(`  血統抽出率: ${pedigreeFields}/3 (${((pedigreeFields/3)*100).toFixed(1)}%)`);
    console.log(`  全体抽出率: ${overallFields}/4 (${((overallFields/4)*100).toFixed(1)}%)`);
});

console.log('\n✅ 正確な抽出テスト完了');
console.log('期待結果: サトノエピック（父: キタサンブラック、母: ランドオーバーシー、母父: Bellamy Road）');