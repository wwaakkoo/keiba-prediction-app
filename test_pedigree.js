// 血統データベース機能のテストスクリプト
console.log('=== 血統データベース機能テスト ===\n');

// PedigreeDatabaseの血統分析部分を模擬実装
class TestPedigreeDatabase {
    // 簡略版種牡馬データベース
    static stallionDatabase = {
        'ディープインパクト': {
            type: 'サンデーサイレンス系',
            rating: 95,
            specialties: ['芝', '中距離', '瞬発力'],
            distance: { 1200: 70, 1600: 95, 2000: 85 },
            track: { '芝': 95, 'ダート': 30 },
            class: 'S',
            description: '圧倒的な瞬発力と芝適性'
        },
        'ロードカナロア': {
            type: 'ストームキャット系',
            rating: 88,
            specialties: ['芝', 'ダート', '短距離', 'スピード'],
            distance: { 1000: 95, 1200: 90, 1600: 70 },
            track: { '芝': 85, 'ダート': 88 },
            class: 'S',
            description: '万能性とスピードを併せ持つ'
        }
    };
    
    // 簡略版母父データベース
    static broodmareSireDatabase = {
        'サンデーサイレンス': {
            effect: 88,
            specialties: ['芝', '中距離', '瞬発力'],
            compatibility: ['ディープインパクト', 'ハーツクライ'],
            description: '母父としても絶大な影響力'
        },
        'ストームキャット': {
            effect: 80,
            specialties: ['スピード', '瞬発力', '芝ダート'],
            compatibility: ['ロードカナロア'],
            description: 'スピードと万能性を付与'
        }
    };
    
    // 血統評価分析
    static analyzePedigree(sire, dam, damSire) {
        console.log(`\n--- 血統分析: ${sire} × ${dam} (母父: ${damSire}) ---`);
        
        // 父系分析
        const sireData = this.stallionDatabase[sire];
        const sireAnalysis = {
            name: sire,
            rating: sireData ? sireData.rating : 60,
            type: sireData ? sireData.type : '不明',
            class: sireData ? sireData.class : 'B',
            analysis: sireData ? `${sireData.type}の${sireData.class}級種牡馬 - ${sireData.description}` : '血統データベース未登録'
        };
        console.log(`父系: ${sireAnalysis.analysis}`);
        
        // 母父分析
        const damSireData = this.broodmareSireDatabase[damSire];
        const damSireAnalysis = {
            name: damSire,
            effect: damSireData ? damSireData.effect : 60,
            analysis: damSireData ? `母父効果${damSireData.effect}点 - ${damSireData.description}` : '母父効果データなし'
        };
        console.log(`母父: ${damSireAnalysis.analysis}`);
        
        // 配合相性分析
        let compatibility = 70;
        let matingAnalysis = '標準的な配合';
        
        if (sireData && damSireData) {
            if (damSireData.compatibility.includes(sire)) {
                compatibility = 90;
                matingAnalysis = '優秀な配合 - 相性抜群';
            }
        }
        console.log(`配合相性: ${compatibility}点 - ${matingAnalysis}`);
        
        // 総合評価計算
        const sireScore = sireAnalysis.rating * 0.6;
        const damSireScore = damSireAnalysis.effect * 0.25;
        const matingScore = compatibility * 0.15;
        const totalScore = sireScore + damSireScore + matingScore;
        
        const grade = totalScore >= 90 ? 'S' :
                     totalScore >= 85 ? 'A+' :
                     totalScore >= 80 ? 'A' :
                     totalScore >= 75 ? 'B+' :
                     totalScore >= 70 ? 'B' : 'C';
        
        console.log(`総合評価: ${grade}級 (${totalScore.toFixed(1)}点)`);
        console.log(`内訳: 父系${sireScore.toFixed(1)} + 母父${damSireScore.toFixed(1)} + 配合${matingScore.toFixed(1)}`);
        
        // 期待能力予測
        const abilities = {
            speed: 70,
            stamina: 70,
            power: 70,
            spirit: 70,
            turf: 70,
            dirt: 70
        };
        
        if (sireData) {
            sireData.specialties.forEach(specialty => {
                switch (specialty) {
                    case 'スピード':
                        abilities.speed += 15;
                        break;
                    case 'スタミナ':
                        abilities.stamina += 15;
                        break;
                    case '瞬発力':
                        abilities.spirit += 15;
                        abilities.turf += 10;
                        break;
                    case '芝':
                        abilities.turf += 10;
                        break;
                    case 'ダート':
                        abilities.dirt += 10;
                        break;
                }
            });
        }
        
        console.log('期待能力:');
        console.log(`  スピード: ${Math.min(100, abilities.speed)}`);
        console.log(`  スタミナ: ${Math.min(100, abilities.stamina)}`);
        console.log(`  瞬発力: ${Math.min(100, abilities.spirit)}`);
        console.log(`  芝適性: ${Math.min(100, abilities.turf)}`);
        console.log(`  ダート適性: ${Math.min(100, abilities.dirt)}`);
        
        // 推奨事項
        const recommendations = [];
        if (grade === 'S') {
            recommendations.push('最高級血統で大きなポテンシャルを秘める');
        } else if (grade === 'A+' || grade === 'A') {
            recommendations.push('優良血統で安定した能力が期待される');
        }
        
        if (compatibility >= 90) {
            recommendations.push('配合相性抜群で相乗効果が期待される');
        }
        
        if (sireAnalysis.class === 'S') {
            recommendations.push('トップクラス種牡馬産駒で実績の裏付けあり');
        }
        
        console.log(`推奨事項: ${recommendations.join('、') || '標準的な評価'}`);
        
        return {
            sireAnalysis,
            damSireAnalysis,
            compatibility,
            totalScore,
            grade,
            abilities,
            recommendations
        };
    }
}

// テストケース実行
console.log('1. 基本的な血統分析テスト');

// テスト1: ディープインパクト産駒
const test1 = TestPedigreeDatabase.analyzePedigree('ディープインパクト', 'テスト牝馬1', 'サンデーサイレンス');

// テスト2: ロードカナロア産駒
const test2 = TestPedigreeDatabase.analyzePedigree('ロードカナロア', 'テスト牝馬2', 'ストームキャット');

// テスト3: 未登録血統
const test3 = TestPedigreeDatabase.analyzePedigree('未知種牡馬', 'テスト牝馬3', '未知母父');

console.log('\n2. 血統グレード分布テスト');

const testCases = [
    { sire: 'ディープインパクト', dam: '優秀牝馬', damSire: 'サンデーサイレンス', expected: 'S級' },
    { sire: 'ロードカナロア', dam: '良牝馬', damSire: 'ストームキャット', expected: 'A+級' },
    { sire: '未知種牡馬', dam: '平凡牝馬', damSire: '平凡母父', expected: 'C級以下' }
];

testCases.forEach((testCase, index) => {
    console.log(`\nケース${index + 1}: ${testCase.sire} × ${testCase.dam}`);
    const result = TestPedigreeDatabase.analyzePedigree(testCase.sire, testCase.dam, testCase.damSire);
    console.log(`期待グレード: ${testCase.expected} / 実際: ${result.grade}級`);
});

console.log('\n3. 能力予測テスト');

// 特徴的な血統の能力予測
console.log('\nディープインパクト産駒の典型的能力:');
console.log('- 瞬発力: 非常に高い (85+)');
console.log('- 芝適性: 非常に高い (80+)');
console.log('- ダート適性: 低い (30程度)');

console.log('\nロードカナロア産駒の典型的能力:');
console.log('- スピード: 高い (85+)');
console.log('- 芝・ダート: 両方対応 (85程度)');
console.log('- 万能性: 高い');

console.log('\n=== テスト完了 ===');
console.log('期待結果:');
console.log('- S級種牡馬産駒は高評価となる');
console.log('- 相性の良い配合は高いボーナスを得る');
console.log('- 父系の特徴が期待能力に反映される');
console.log('- 血統グレードが総合評価に影響する');