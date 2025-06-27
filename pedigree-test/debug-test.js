// 馬名抽出デバッグ用テスト
const PedigreeExtractor = require('./console-interactive.js').PedigreeExtractor || eval(`
class PedigreeExtractor {
    static stallionNames = [
        'ディープインパクト', 'ハーツクライ', 'ロードカナロア', 'オルフェーヴル', 
        'キングカメハメハ', 'ダイワメジャー', 'クロフネ', 'ステイゴールド',
        'ドゥラメンテ', 'モーリス', 'エピファネイア', 'ルーラーシップ',
        'キタサンブラック', 'ゴールドシップ', 'ホッコータルマエ', 'カレンチャン',
        'リアルスティール'
    ];
    
    static mareNames = [
        'ベラジオオペラ', 'ドゥレッツァ', 'エアルーティーン', 'モアザンセイクリッド',
        'ランドオーバーシー', 'シンハライト', 'レディアンバサダー', 'サクラトップリアル', 'マーガレットメドウ'
    ];
    
    static horseNames = [
        'ベラジオオペラ', 'ドゥレッツァ', 'サトノエピック', 'サトノダイヤモンド', 'ジェンティルドンナ', 'テストホース'
    ];
    
    static isSire(line) {
        const trimmed = line.trim();
        if (this.stallionNames.includes(trimmed)) {
            return true;
        }
        return this.isPotentialSire(trimmed);
    }
    
    static isMare(line) {
        const trimmed = line.trim();
        if (this.horseNames.includes(trimmed)) {
            return false;
        }
        if (this.mareNames.includes(trimmed)) {
            return true;
        }
        return this.isPotentialMare(trimmed);
    }
    
    static isPotentialSire(line) {
        const trimmed = line.trim();
        if (this.isKnownNonHorseName(trimmed) || trimmed.length < 3) {
            return false;
        }
        if (/^[ァ-ヶー\u4E00-\u9FAF\sA-Za-z]+$/.test(trimmed)) {
            return true;
        }
        return false;
    }
    
    static isPotentialMare(line) {
        const trimmed = line.trim();
        if (this.isKnownNonHorseName(trimmed) || trimmed.length < 3) {
            return false;
        }
        if (this.stallionNames.includes(trimmed)) {
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
        if (this.stallionNames.includes(trimmed) || 
            this.mareNames.includes(trimmed) || 
            this.isKnownNonHorseName(trimmed)) {
            return false;
        }
        if (/^[ァ-ヶー\u3040-\u309F\u4E00-\u9FAF\sA-Za-z]+$/.test(trimmed)) {
            return true;
        }
        return false;
    }
    
    static isKnownNonHorseName(line) {
        const nonHorsePatterns = [
            /^\d+kg/, /^\d+\.\d+/, /^牡\d/, /^牝\d/, /美浦/, /栗東/, /^\d+人気/, /週$/,
            /^\d+-\d+-\d+-\d+/, /GI$/, /GII$/, /GIII$/, /L$/, /芝\d+/, /ダ\d+/,
            /良$/, /稍$/, /重$/, /不$/, /映像を見る/, /鉄砲/, /ヵ月休養/
        ];
        return nonHorsePatterns.some(pattern => pattern.test(line));
    }
}
PedigreeExtractor;
`);

console.log('=== 馬名抽出デバッグテスト ===\\n');

// テストケース
const testCases = [
    'サトノエピック',
    'サクラトップリアル', 
    'リアルスティール',
    'キタサンブラック',
    'ランドオーバーシー',
    'Unknown Horse',
    '美浦・田村',
    '510kg(+2)',
    'GI'
];

testCases.forEach(testCase => {
    console.log(`--- "${testCase}" の判定結果 ---`);
    console.log(`isPotentialHorseName: ${PedigreeExtractor.isPotentialHorseName(testCase)}`);
    console.log(`isSire: ${PedigreeExtractor.isSire(testCase)}`);
    console.log(`isMare: ${PedigreeExtractor.isMare(testCase)}`);
    console.log(`isKnownNonHorseName: ${PedigreeExtractor.isKnownNonHorseName(testCase)}`);
    console.log('');
});

// 実際のデータでテスト
const problemData = `1\t1\t
--
キタサンブラック
サトノエピック
ランドオーバーシー
(Bellamy Road)
美浦・国枝
差中13週
536kg(+8)
25.5 (7人気)`;

console.log('=== 実際のデータでテスト ===');
const result = PedigreeExtractor.parseAllHorses(problemData);
console.log('結果:', JSON.stringify(result, null, 2));