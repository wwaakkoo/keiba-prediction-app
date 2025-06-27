// 血統抽出機能のテストスクリプト
console.log('=== 血統抽出機能テスト ===\n');

// netkeiba形式のサンプルデータ（血統情報を含む）
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
2025.04.06 阪神1
大阪杯 GI
芝2000 1:56.2 良
15頭 5番 2人 横山和生 58.0
4-4-3-3 (34.1) 508(-4)
ロードデルレイ(-0.2)

1	2	
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
2025.04.05 メイダン3
ドバイシー GI
芝2410 良
9頭 2番 5人 スミヨン 57.5
(0.0) 
(0.0)

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

// DataConverterの血統抽出部分を模擬実装
class TestPedigreeExtractor {
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
        // 馬名の抽出
        if (!horse.name && this.isHorseName(line)) {
            horse.name = line;
            console.log(`🐎 馬名抽出: ${horse.name}`);
            return;
        }
        
        // 血統情報の抽出
        this.extractPedigreeInfo(horse, line);
        
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
                console.log(`🏃 脚質抽出: ${horse.runningStyle} from "${line}"`);
            }
        }
        
        // オッズの抽出
        if (!horse.odds && line.includes('人気')) {
            const oddsMatch = line.match(/(\d+\.?\d*)\s*\((\d+)人気\)/);
            if (oddsMatch) {
                horse.odds = parseFloat(oddsMatch[1]);
                horse.popularity = parseInt(oddsMatch[2]);
                console.log(`💰 オッズ抽出: ${horse.odds}倍 (${horse.popularity}人気)`);
            }
        }
        
        // 馬体重変化の抽出
        if (!horse.weightChange && line.includes('kg') && line.includes('(') && line.includes(')')) {
            const weightMatch = line.match(/(\d+)kg\(([+-]?\d+)\)/);
            if (weightMatch) {
                horse.weightChange = parseInt(weightMatch[2]);
                console.log(`⚖️ 体重変化抽出: ${horse.weightChange}kg`);
            }
        }
    }
    
    static extractPedigreeInfo(horse, line) {
        // 父系抽出
        if (!horse.sire) {
            const commonSires = [
                'ディープインパクト', 'ハーツクライ', 'ロードカナロア', 'オルフェーヴル', 
                'キングカメハメハ', 'ダイワメジャー', 'クロフネ', 'ステイゴールド',
                'モーリス', 'エピファネイア', 'ルーラーシップ', 'ゴールドシップ'
            ];
            
            for (const sire of commonSires) {
                if (line.includes(sire) || line === sire) {
                    horse.sire = sire;
                    console.log(`👨 父系抽出: ${horse.sire} from "${line}"`);
                    return;
                }
            }
        }
        
        // 母系抽出
        if (!horse.dam) {
            const commonDams = [
                'エアグルーヴ', 'ダンシングブレーヴ', 'シンコウラブリイ', 'アドマイヤグルーヴ',
                'ダイワスカーレット', 'ヴォードヴィル', 'フサイチパンドラ', 'スイートジャスミン',
                'ベラジオオペラ', 'エアルーティーン', 'ドゥレッツァ', 'モアザンセイクリッド'
            ];
            
            for (const dam of commonDams) {
                if (line.includes(dam) || line === dam) {
                    horse.dam = dam;
                    console.log(`👩 母系抽出: ${horse.dam} from "${line}"`);
                    return;
                }
            }
            
            // カタカナの牝馬名パターン（3-10文字）
            if (/^[ァ-ヶー]{3,10}$/.test(line) && 
                !line.includes('レース') && 
                !line.includes('競馬') && 
                !commonSires.includes(line) &&
                line !== horse.name) {
                horse.dam = line;
                console.log(`👩 母系抽出（カタカナパターン）: ${horse.dam} from "${line}"`);
                return;
            }
        }
        
        // 母父抽出
        if (!horse.damSire) {
            const commonDamSires = [
                'サンデーサイレンス', 'ノーザンテースト', 'ミスタープロスペクター', 'ストームキャット',
                'ブライアンズタイム', 'トニービン', 'More Than Ready', 'ハービンジャー'
            ];
            
            for (const damSire of commonDamSires) {
                if (line.includes(damSire) || line === damSire) {
                    horse.damSire = damSire;
                    console.log(`👴 母父抽出: ${horse.damSire} from "${line}"`);
                    return;
                }
            }
            
            // 「母父○○」明示的パターン
            const damSireMatch = line.match(/母父[:\s]*([ァ-ヶーA-Za-z\s\.]+)/);
            if (damSireMatch) {
                const damSireName = damSireMatch[1].trim();
                if (damSireName.length >= 3) {
                    horse.damSire = damSireName;
                    console.log(`👴 母父抽出（明示的）: ${horse.damSire} from "${line}"`);
                    return;
                }
            }
            
            // 括弧内のパターン（外国産馬など）
            const parenthesesMatch = line.match(/\(([ァ-ヶーA-Za-z\s\.]+)\)/);
            if (parenthesesMatch) {
                const parenthesesContent = parenthesesMatch[1].trim();
                if (parenthesesContent.length >= 3 && !parenthesesContent.includes('計不')) {
                    horse.damSire = parenthesesContent;
                    console.log(`👴 母父抽出（括弧内）: ${horse.damSire} from "${line}"`);
                    return;
                }
            }
        }
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
               !line.includes('レース');
    }
}

// テスト実行
console.log('🧪 血統抽出テスト開始\n');

const horses = TestPedigreeExtractor.parseNetkeibaData(sampleDataWithPedigree);

console.log('\n📊 抽出結果サマリー:');
horses.forEach((horse, index) => {
    console.log(`\n馬${index + 1}: ${horse.name || '不明'}`);
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

console.log('\n✅ テスト完了');
console.log('💡 ブラウザでテストする場合は、開発者コンソールでこのスクリプトの内容を実行してください。');