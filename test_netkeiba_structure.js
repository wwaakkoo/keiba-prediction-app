// netkeiba形式データ構造の分析

const realSampleData = `1	1	
消
ベラジオオペラ
ロードカナロア
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
ロードデルレイ(-0.2)`;

console.log('=== netkeiba形式データ構造分析 ===\n');

const lines = realSampleData.split('\n').filter(line => line.trim());
lines.forEach((line, index) => {
    console.log(`${index.toString().padStart(2, '0')}: "${line.trim()}"`);
});

console.log('\n=== 構造推測 ===');
console.log('0: 枠番・馬番');
console.log('1: 消（情報）');
console.log('2: 馬名（ベラジオオペラ）');
console.log('3: 父系（ロードカナロア）');
console.log('4: 母系（エアルーティーン）');
console.log('5: 母父（ハービンジャー）');
console.log('6: 厩舎情報');
console.log('7: 脚質情報（先中9週）');
console.log('8: 馬体重（510kg(+2)）');
console.log('9: オッズ（4.0 (1人気)）');
console.log('10: 性齢毛色（牡5鹿）');

console.log('\n正しい血統情報:');
console.log('馬名: ベラジオオペラ');
console.log('父: ロードカナロア');
console.log('母: エアルーティーン'); 
console.log('母父: ハービンジャー');

console.log('\n💡 問題: 順序が間違っていました！');
console.log('修正必要: 馬名の次の行が父系、その次が母系、括弧内が母父');