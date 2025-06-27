// Node.js用インタラクティブコンソールテスト
const readline = require('readline');

// PedigreeExtractorクラスを直接定義
class PedigreeExtractor {
    // 主要血統リスト
    static stallionNames = [
        'ディープインパクト', 'ハーツクライ', 'ロードカナロア', 'オルフェーヴル', 
        'キングカメハメハ', 'ダイワメジャー', 'クロフネ', 'ステイゴールド',
        'ドゥラメンテ', 'モーリス', 'エピファネイア', 'ルーラーシップ',
        'キタサンブラック', 'ゴールドシップ', 'ホッコータルマエ', 'カレンチャン',
        'リアルスティール'  // 追加
    ];
    
    static mareNames = [
        'ベラジオオペラ', 'ドゥレッツァ', 'エアルーティーン', 'モアザンセイクリッド',
        'ランドオーバーシー', 'シンハライト', 'レディアンバサダー', 'サクラトップリアル', 'マーガレットメドウ'
    ];
    
    static horseNames = [
        'ベラジオオペラ', 'ドゥレッツァ', 'サトノエピック', 'サトノダイヤモンド', 'ジェンティルドンナ', 'テストホース', 'サクラトップリアル'
    ];
    
    // 父系判定（登録血統 + パターン判定）
    static isSire(line) {
        const trimmed = line.trim();
        
        // 登録済み有名種牡馬はそのまま認識
        if (this.stallionNames.includes(trimmed)) {
            return true;
        }
        
        // 未登録でも父系らしいパターンを判定（評価はしないが抽出は行う）
        return this.isPotentialSire(trimmed);
    }
    
    // 母系判定（登録血統 + パターン判定）
    static isMare(line) {
        const trimmed = line.trim();
        
        // 馬名候補は除外
        if (this.horseNames.includes(trimmed)) {
            return false;
        }
        
        // 登録済み母系血統
        if (this.mareNames.includes(trimmed)) {
            return true;
        }
        
        // 未登録でも母系らしいパターンを判定
        return this.isPotentialMare(trimmed);
    }
    
    // 父系候補判定（パターンベース）
    static isPotentialSire(line) {
        const trimmed = line.trim();
        
        // 明らかに馬名でないもの、データ行は除外
        if (this.isKnownNonHorseName(trimmed) || trimmed.length < 3) {
            return false;
        }
        
        // カタカナ・漢字・英字の名前で、血統順序の1番目に来るもの
        if (/^[ァ-ヶー\u4E00-\u9FAF\sA-Za-z]+$/.test(trimmed)) {
            return true;
        }
        
        return false;
    }
    
    // 母系候補判定（パターンベース）  
    static isPotentialMare(line) {
        const trimmed = line.trim();
        
        // 明らかに馬名でないもの、データ行は除外
        if (this.isKnownNonHorseName(trimmed) || trimmed.length < 3) {
            return false;
        }
        
        // 既知の父系は除外
        if (this.stallionNames.includes(trimmed)) {
            return false;
        }
        
        // カタカナ・漢字・英字の名前で、血統順序の3番目に来るもの
        if (/^[ァ-ヶー\u4E00-\u9FAF\sA-Za-z]+$/.test(trimmed)) {
            return true;
        }
        
        return false;
    }
    
    // 血統評価用判定（有名馬のみポイント対象）
    static isEvaluableSire(sireName) {
        return this.stallionNames.includes(sireName?.trim());
    }
    
    static isEvaluableMare(mareName) {
        return this.mareNames.includes(mareName?.trim());
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
        
        // 血統順序管理（血統データは通常：印→父→馬名→母→母父の順序）
        let bloodlineStep = 0; // 0:印/開始, 1:父系候補, 2:馬名候補, 3:母系候補, 4:母父候補
        
        while (i < lines.length) {
            const line = lines[i]?.trim() || '';
            
            // 次の馬の開始を検出したら終了
            if (i > startIndex && this.isHorseStart(line)) {
                processLog.push(`次の馬開始検出で終了: i=${i}, line="${line}"`);
                break;
            }
            
            processLog.push(`i=${i}: "${line}" (step=${bloodlineStep})`);
            
            // 印行スキップ
            if (this.isMarkLine(line)) {
                processLog.push(`  → 印行スキップ`);
                bloodlineStep = 1; // 次は父系候補
                i++;
                continue;
            }
            
            // 血統データの順序に基づく抽出
            if (bloodlineStep === 1 && !horse.sire && this.isSire(line)) {
                // 父系抽出
                horse.sire = line;
                processLog.push(`  → 父系抽出: ${line}`);
                bloodlineStep = 2; // 次は馬名候補
            } else if (bloodlineStep === 2 && !horse.name && this.isPotentialHorseName(line)) {
                // 馬名抽出（父系・母系・その他でない場合）
                horse.name = line;
                processLog.push(`  → 馬名抽出: ${line}`);
                bloodlineStep = 3; // 次は母系候補
            } else if (bloodlineStep === 3 && !horse.dam && this.isMare(line)) {
                // 母系抽出
                horse.dam = line;
                processLog.push(`  → 母系抽出: ${line}`);
                bloodlineStep = 4; // 次は母父候補
            } else if (!horse.damSire) {
                // 母父抽出（括弧内）
                const damSire = this.extractDamSire(line);
                if (damSire) {
                    horse.damSire = damSire;
                    processLog.push(`  → 母父抽出: ${damSire} (from "${line}")`);
                }
            }
            
            // フォールバック：順序によらない抽出（血統データが不完全な場合）
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
        
        // 馬名が抽出されていない場合、フォールバック判定
        if (!horse.name) {
            // 血統以外の候補から馬名を推定
            for (let j = startIndex + 1; j < Math.min(startIndex + 6, lines.length); j++) {
                const candidateLine = lines[j]?.trim() || '';
                if (this.isPotentialHorseName(candidateLine) && 
                    candidateLine !== horse.sire && 
                    candidateLine !== horse.dam &&
                    !this.isKnownNonHorseName(candidateLine)) {
                    horse.name = candidateLine;
                    processLog.push(`  → [フォールバック]馬名抽出: ${candidateLine}`);
                    break;
                }
            }
        }
        
        return {
            ...horse,
            nextIndex: i,
            processLog: processLog
        };
    }
    
    // 馬名候補判定（より包括的）
    static isPotentialHorseName(line) {
        const trimmed = line.trim();
        
        // 空文字や短すぎる場合は除外
        if (!trimmed || trimmed.length < 2) return false;
        
        // 既知の馬名は必ず馬名候補とする
        if (this.horseNames.includes(trimmed)) {
            return true;
        }
        
        // 明らかにデータ行のものは除外
        if (this.isKnownNonHorseName(trimmed)) {
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
    
    // 非馬名候補判定（トレーナー、騎手、その他のデータ）
    static isKnownNonHorseName(line) {
        const nonHorsePatterns = [
            /^\d+kg/, // 体重
            /^\d+\.\d+/, // オッズ
            /^牡\d/, /^牝\d/, // 性別・年齢
            /美浦/, /栗東/, // 調教師
            /^\d+人気/, // 人気
            /週$/, // 休養期間
            /^\d+-\d+-\d+-\d+/, // 着順履歴
            /GI$/, /GII$/, /GIII$/, /L$/, // レースグレード
            /芝\d+/, /ダ\d+/, // 距離・馬場
            /良$/, /稍$/, /重$/, /不$/, // 馬場状態
            /映像を見る/, /鉄砲/, /ヵ月休養/ // その他のデータ
        ];
        
        return nonHorsePatterns.some(pattern => pattern.test(line));
    }
    
    // 全データを解析
    static parseAllHorses(rawData) {
        const lines = rawData.split('\n').map(line => line.trim()).filter(line => line);
        const horses = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (this.isHorseStart(line)) {
                const horseData = this.extractPedigreeFromHorseData(lines, i);
                horses.push(horseData);
                i = horseData.nextIndex - 1;  // forループでi++されるため-1
            }
        }
        
        return horses;
    }
}

// インタラクティブコンソール
class InteractiveConsole {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        this.samples = {
            '1': this.getSample1(),
            '2': this.getSample2(),
            '3': this.getSample3()
        };
        
        this.expectedResults = {
            '1': [
                { name: 'ベラジオオペラ', sire: 'ロードカナロア', dam: 'エアルーティーン', damSire: 'ハービンジャー' },
                { name: 'ドゥレッツァ', sire: 'ドゥラメンテ', dam: 'モアザンセイクリッド', damSire: 'More Than Ready' }
            ],
            '2': [
                { name: 'サトノダイヤモンド', sire: 'キタサンブラック', dam: 'レディアンバサダー', damSire: 'アンバーシャダイ' },
                { name: 'ジェンティルドンナ', sire: 'ディープインパクト', dam: 'シンハライト', damSire: 'Storm Cat' }
            ],
            '3': [
                { name: 'ロードカナロア', sire: 'ロードカナロア', dam: 'エアルーティーン', damSire: 'ハービンジャー' },
                { name: 'テストホース', sire: 'ドゥラメンテ', dam: '', damSire: 'More Than Ready' }
            ]
        };
    }
    
    getSample1() {
        return `1\t1\t
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
    }
    
    getSample2() {
        return `1\t1\t
◎
キタサンブラック
サトノダイヤモンド
レディアンバサダー
(アンバーシャダイ)
栗東・音無  
中2週
520kg(+4)
3.2 (1人気)
牡4鹿

M.デムーロ
57.0\t
2\t2\t
○
ディープインパクト
ジェンティルドンナ
シンハライト
(Storm Cat)
美浦・国枝  
中3週
468kg(-2)
5.1 (2人気)
牝4青鹿

C.ルメール
55.0\t`;
    }
    
    getSample3() {
        return `1\t1\t
消
ロードカナロア
ロードカナロア
エアルーティーン
(ハービンジャー)
栗東・上村  
1\t2\t
△
ドゥラメンテ
テストホース
(More Than Ready)
美浦・尾関`;
    }
    
    async start() {
        console.log('🐎 血統抽出インタラクティブコンソールテスト');
        console.log('='.repeat(50));
        
        while (true) {
            console.log('\n📋 メニュー:');
            console.log('1. サンプル1: 基本データ');
            console.log('2. サンプル2: 複雑データ');
            console.log('3. サンプル3: 問題データ');
            console.log('4. カスタムデータ入力');
            console.log('5. 終了');
            
            const choice = await this.question('\n選択してください (1-5): ');
            
            if (choice === '5') {
                console.log('テストを終了します。');
                this.rl.close();
                break;
            }
            
            if (choice >= '1' && choice <= '3') {
                await this.runSampleTest(choice);
            } else if (choice === '4') {
                await this.runCustomTest();
            } else {
                console.log('❌ 無効な選択です。');
            }
        }
    }
    
    async runSampleTest(sampleNum) {
        console.log(`\n🧪 サンプル${sampleNum}テスト実行中...`);
        const testData = this.samples[sampleNum];
        const expected = this.expectedResults[sampleNum];
        
        console.log('\n📝 テストデータ:');
        console.log(testData);
        
        this.runTest(testData, expected);
        
        await this.question('\nEnterキーを押して続行...');
    }
    
    async runCustomTest() {
        console.log('\n📝 カスタムデータ入力モード');
        console.log('終了するには空行を入力してください。');
        
        const lines = [];
        while (true) {
            const line = await this.question('> ');
            if (line.trim() === '') break;
            lines.push(line);
        }
        
        if (lines.length === 0) {
            console.log('❌ データが入力されませんでした。');
            return;
        }
        
        const testData = lines.join('\n');
        console.log('\n🧪 カスタムテスト実行中...');
        
        this.runTest(testData, []);
        
        await this.question('\nEnterキーを押して続行...');
    }
    
    runTest(testData, expected) {
        try {
            const results = PedigreeExtractor.parseAllHorses(testData);
            
            console.log('\n📊 抽出結果:');
            console.log(`抽出された馬の数: ${results.length}`);
            
            results.forEach((horse, index) => {
                console.log(`\n--- 馬 ${index + 1} ---`);
                console.log(`馬名: ${horse.name || '未抽出'}`);
                console.log(`父系: ${horse.sire || '未抽出'}`);
                console.log(`母系: ${horse.dam || '未抽出'}`);
                console.log(`母父: ${horse.damSire || '未抽出'}`);
            });
            
            // 期待結果との比較
            if (expected.length > 0) {
                console.log('\n🔍 期待結果との比較:');
                
                let successCount = 0;
                let totalTests = 0;
                
                expected.forEach((exp, index) => {
                    const actual = results[index];
                    console.log(`\n馬 ${index + 1} (${exp.name}):`);
                    
                    ['name', 'sire', 'dam', 'damSire'].forEach(field => {
                        if (exp[field]) {
                            totalTests++;
                            const actualValue = actual ? actual[field] : '未抽出';
                            const success = actualValue === exp[field];
                            if (success) successCount++;
                            
                            console.log(`  ${field.padEnd(8)}: ${success ? '✅' : '❌'} 期待「${exp[field]}」→ 実際「${actualValue}」`);
                        }
                    });
                });
                
                console.log(`\n📈 結果: ${successCount}/${totalTests} (${Math.round((successCount/totalTests)*100)}%)`);
                console.log(`総合判定: ${successCount === totalTests ? '✅ 成功' : '❌ 失敗'}`);
            }
            
        } catch (error) {
            console.error('❌ テスト実行エラー:', error.message);
        }
    }
    
    question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, resolve);
        });
    }
}

// メイン実行
if (require.main === module) {
    const console_app = new InteractiveConsole();
    console_app.start().catch(console.error);
}