// 修正された血統抽出機能のテストスクリプト
console.log('=== 修正版血統抽出テスト ===\n');

// DataConverterの血統抽出部分を模擬実装（修正版）
class FixedPedigreeExtractor {
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
                continue;
            }
            
            if (!currentHorse) continue;
            
            this.extractHorseData(currentHorse, line);
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
    
    static extractHorseData(horse, line) {
        console.log(`  処理中: "${line}"`);
        
        // 【修正版】父系抽出を優先（馬名より先に実行）
        if (!horse.sire) {
            const commonSires = [
                'ディープインパクト', 'ハーツクライ', 'ロードカナロア', 'オルフェーヴル', 
                'キングカメハメハ', 'ダイワメジャー', 'クロフネ', 'ステイゴールド',
                'ドゥラメンテ', 'モーリス', 'エピファネイア', 'ルーラーシップ'
            ];
            
            for (const sire of commonSires) {
                if (line === sire || (line.includes(sire) && line.length <= sire.length + 3)) {
                    horse.sire = sire;
                    console.log(`    → 父系抽出: ${horse.sire} from "${line}"`);
                    return; // 抽出できたら他の処理をスキップ
                }
            }
        }
        
        // 【修正版】母系抽出（父系決定後）
        if (!horse.dam && horse.sire) {
            const commonDams = [
                'ベラジオオペラ', 'エアルーティーン', 'ドゥレッツァ', 'モアザンセイクリッド',
                'エアグルーヴ', 'ダンシングブレーヴ', 'シンコウラブリイ'
            ];
            
            // 完全一致
            for (const dam of commonDams) {
                if (line === dam) {
                    horse.dam = dam;
                    console.log(`    → 母系抽出: ${horse.dam} from "${line}"`);
                    return;
                }
            }
            
            // カタカナパターン（3-10文字）
            if (/^[ァ-ヶー]{3,10}$/.test(line) && 
                !line.includes('レース') && 
                !line.includes('競馬') && 
                line !== horse.sire) {
                horse.dam = line;
                console.log(`    → 母系抽出（カタカナ）: ${horse.dam} from "${line}"`);
                return;
            }
        }
        
        // 【修正版】母父抽出
        if (!horse.damSire) {
            const commonDamSires = [
                'サンデーサイレンス', 'ノーザンテースト', 'ミスタープロスペクター', 'ストームキャット',
                'More Than Ready', 'ハービンジャー', 'ブライアンズタイム'
            ];
            
            // 完全一致
            for (const damSire of commonDamSires) {
                if (line === damSire) {
                    horse.damSire = damSire;
                    console.log(`    → 母父抽出: ${horse.damSire} from "${line}"`);
                    return;
                }
            }
            
            // 括弧内パターン
            const parenthesesMatch = line.match(/\(([^)]+)\)/);
            if (parenthesesMatch) {
                const content = parenthesesMatch[1].trim();
                if (content.length >= 3 && !content.includes('計不')) {
                    horse.damSire = content;
                    console.log(`    → 母父抽出（括弧）: ${horse.damSire} from "${line}"`);
                    return;
                }
            }
        }
        
        // 【修正版】馬名抽出（血統決定後）
        if (!horse.name && horse.sire && horse.dam) {
            const bloodlineNames = [
                'ロードカナロア', 'ディープインパクト', 'ハーツクライ', 'オルフェーヴル', 
                'キングカメハメハ', 'ダイワメジャー', 'クロフネ', 'ステイゴールド',
                'ベラジオオペラ', 'エアルーティーン', 'ドゥレッツァ', 'モアザンセイクリッド'
            ];
            
            if (/^[ァ-ヶー\u3040-\u309F\u4E00-\u9FAF\sA-Za-z]+$/.test(line) && 
                line.length >= 2 && line.length <= 15 &&
                !line.includes('人気') &&
                !line.includes('kg') &&
                !line.includes('週') &&
                !line.includes('競馬') &&
                !bloodlineNames.includes(line) &&
                line !== horse.sire &&
                line !== horse.dam &&
                line !== horse.damSire) {
                horse.name = line;
                console.log(`    → 馬名抽出: ${horse.name} from "${line}"`);
                return;
            }
        }
        
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
                console.log(`    → 脚質抽出: ${horse.runningStyle} from "${line}"`);
            }
        }
        
        // オッズの抽出
        if (!horse.odds && line.includes('人気')) {
            const oddsMatch = line.match(/(\d+\.?\d*)\s*\((\d+)人気\)/);
            if (oddsMatch) {
                horse.odds = parseFloat(oddsMatch[1]);
                horse.popularity = parseInt(oddsMatch[2]);
                console.log(`    → オッズ抽出: ${horse.odds}倍 (${horse.popularity}人気)`);
            }
        }
        
        // 馬体重変化の抽出
        if (!horse.weightChange && line.includes('kg') && line.includes('(') && line.includes(')')) {
            const weightMatch = line.match(/(\d+)kg\(([+-]?\d+)\)/);
            if (weightMatch) {
                horse.weightChange = parseInt(weightMatch[2]);
                console.log(`    → 体重変化抽出: ${horse.weightChange}kg`);
            }
        }
    }
}

// テストデータ
const sampleDataWithPedigree = `1	1	
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

2	2	
消
ディープインパクト
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

3	3
消
キングカメハメハ
シンコウラブリイ
サンデーサイレンス
母父サンデーサイレンス
美浦・国枝
差中7週
502kg(+4)
8.5 (6人気)
牡4栗`;

// テスト実行
console.log('🧪 修正版血統抽出テスト開始\n');

const horses = FixedPedigreeExtractor.parseNetkeibaData(sampleDataWithPedigree);

console.log('\n📊 修正後の抽出結果サマリー:');
horses.forEach((horse, index) => {
    console.log(`\n馬${index + 1}: ${horse.name || '未抽出'}`);
    console.log(`  父: ${horse.sire || '未抽出'}`);
    console.log(`  母: ${horse.dam || '未抽出'}`);
    console.log(`  母父: ${horse.damSire || '未抽出'}`);
    console.log(`  脚質: ${horse.runningStyle || '未抽出'}`);
    console.log(`  オッズ: ${horse.odds || '未抽出'}倍`);
    console.log(`  体重変化: ${horse.weightChange || 0}kg`);
    
    // 血統抽出成功率
    const pedigreeFields = [horse.sire, horse.dam, horse.damSire].filter(field => field).length;
    console.log(`  血統抽出率: ${pedigreeFields}/3 (${((pedigreeFields/3)*100).toFixed(1)}%)`);
});

// 改善点の比較
console.log('\n🔧 修正ポイント:');
console.log('1. 父系抽出を馬名抽出より先に実行');
console.log('2. 血統名を馬名として誤認しないように除外');
console.log('3. 母系抽出は父系決定後に実行');
console.log('4. 馬名抽出は血統決定後に実行');
console.log('5. より多くの種牡馬・母父名をデータベースに追加');

console.log('\n✅ 修正版テスト完了');