// 実際のDataConverterでの血統抽出テスト
console.log('=== 実際のDataConverter血統抽出テスト ===\n');

// DOM関数のモック
global.document = {
    getElementById: () => ({ value: '' })
};
global.window = {};
global.showMessage = () => {};
global.HorseManager = { addHorseFromData: () => {} };

// DataConverterクラスを読み込み
let jsContent = require('fs').readFileSync('./js/dataConverter.js', 'utf8');
// window関連の行を除去
jsContent = jsContent.replace(/window\..*/g, '');
eval(jsContent);

// テストデータ
const testData = `1    1    
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

console.log('🧪 実際のDataConverterでテスト開始\n');

try {
    const result = DataConverter.parseNetkeibaData(testData);
    
    console.log('📊 実機抽出結果:');
    result.horses.forEach((horse, index) => {
        console.log(`\n馬${index + 1}:`);
        console.log(`  馬名: ${horse.name || '未抽出'}`);
        console.log(`  父: ${horse.sire || '未抽出'}`);
        console.log(`  母: ${horse.dam || '未抽出'}`);
        console.log(`  母父: ${horse.damSire || '未抽出'}`);
        console.log(`  脚質: ${horse.runningStyle || '未抽出'}`);
        console.log(`  オッズ: ${horse.odds || '未抽出'}倍`);
        console.log(`  体重変化: ${horse.weightChange || 0}kg`);
        
        const pedigreeCount = [horse.sire, horse.dam, horse.damSire].filter(x => x).length;
        const rate = ((pedigreeCount / 3) * 100).toFixed(1);
        console.log(`  血統抽出率: ${pedigreeCount}/3 (${rate}%)`);
        
        if (rate >= 80) {
            console.log(`  判定: ✅ 抽出良好`);
        } else if (rate >= 50) {
            console.log(`  判定: ⚠️ 抽出不完全`);  
        } else {
            console.log(`  判定: ❌ 抽出失敗`);
        }
    });
    
    // 期待結果との比較
    const horse1 = result.horses[0];
    console.log(`\n🔍 期待結果との比較:`);
    console.log(`馬名: ${horse1?.name === 'サトノエピック' ? '✅' : '❌'} (期待: サトノエピック, 実際: ${horse1?.name})`);
    console.log(`父: ${horse1?.sire === 'キタサンブラック' ? '✅' : '❌'} (期待: キタサンブラック, 実際: ${horse1?.sire})`);
    console.log(`母: ${horse1?.dam === 'ランドオーバーシー' ? '✅' : '❌'} (期待: ランドオーバーシー, 実際: ${horse1?.dam})`);
    console.log(`母父: ${horse1?.damSire === 'Bellamy Road' ? '✅' : '❌'} (期待: Bellamy Road, 実際: ${horse1?.damSire})`);
    
    // 全体統計
    const totalPedigree = result.horses.reduce((sum, horse) => {
        return sum + [horse.sire, horse.dam, horse.damSire].filter(x => x).length;
    }, 0);
    const maxPedigree = result.horses.length * 3;
    const overallRate = ((totalPedigree / maxPedigree) * 100).toFixed(1);
    
    console.log(`\n📈 全体統計:`);
    console.log(`総合血統抽出率: ${totalPedigree}/${maxPedigree} (${overallRate}%)`);
    console.log(`抽出された馬数: ${result.horses.length}頭`);
    
    if (overallRate >= 80) {
        console.log('✅ 修正版血統抽出成功！');
    } else {
        console.log('⚠️ まだ改善が必要');
    }
    
} catch (error) {
    console.error('❌ テストエラー:', error);
}

console.log('\n✅ 実機テスト完了');