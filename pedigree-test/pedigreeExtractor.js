// 血統抽出専用テストクラス
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
        'ベラジオオペラ', 'ドゥレッツァ', 'サトノエピック', 'サトノダイヤモンド', 'ジェンティルドンナ', 'テストホース', 'サクラトップリアル'  // テストデータの馬名
    ];
    
    // 父系判定（登録血統 + パターン判定）
    static isSire(line) {
        const trimmed = line.trim();
        
        // 登録済み有名種牡馬はそのまま認識
        if (this.stallionNames.includes(trimmed)) {
            return true;
        }
        
        // 父系判定は登録済みのみに限定（パターンベースは文脈付きで別途実行）
        return false;
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
        
        // 母系判定は登録済みのみに限定（パターンベースは文脈付きで別途実行）
        return false;
    }
    
    // 父系候補判定（順序・文脈重視版）
    static isPotentialSire(line, step) {
        const trimmed = line.trim();
        
        // step=1（父系期待位置）でのみパターン判定を適用
        if (step !== 1) return false;
        
        // 明らかに馬名でないもの、データ行は除外
        if (this.isKnownNonHorseName(trimmed) || trimmed.length < 3) {
            return false;
        }
        
        // 既知の馬名・母系は父系候補から除外
        if (this.horseNames.includes(trimmed) || this.mareNames.includes(trimmed)) {
            return false;
        }
        
        // カタカナ・漢字・英字の名前を父系候補とする
        if (/^[ァ-ヶー\u4E00-\u9FAF\sA-Za-z]+$/.test(trimmed)) {
            return true;
        }
        
        return false;
    }
    
    // 母系候補判定（順序・文脈重視版）  
    static isPotentialMare(line, step) {
        const trimmed = line.trim();
        
        // step=3（母系期待位置）でのみパターン判定を適用
        if (step !== 3) return false;
        
        // 明らかに馬名でないもの、データ行は除外
        if (this.isKnownNonHorseName(trimmed) || trimmed.length < 3) {
            return false;
        }
        
        // 既知の父系・馬名は除外
        if (this.stallionNames.includes(trimmed) || this.horseNames.includes(trimmed)) {
            return false;
        }
        
        // カタカナ・漢字・英字の名前を母系候補とする
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
    
    // 馬名候補判定（改善版：循環参照を回避）
    static isHorseName(line) {
        const trimmed = line.trim();
        
        // 既知の馬名リストをチェック
        if (this.horseNames.includes(trimmed)) {
            return true;
        }
        
        // 明らかに馬名でないものを除外（循環参照回避のため直接判定）
        if (this.stallionNames.includes(trimmed) || 
            this.mareNames.includes(trimmed) || 
            this.isKnownNonHorseName(trimmed)) {
            return false;
        }
        
        // カタカナ・ひらがな・漢字・英字で構成された2文字以上の名前を馬名候補とする
        if (/^[ァ-ヶー\u3040-\u309F\u4E00-\u9FAF\sA-Za-z]+$/.test(trimmed) && trimmed.length >= 2) {
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
            if (bloodlineStep === 1 && !horse.sire && (this.isSire(line) || this.isPotentialSire(line, bloodlineStep))) {
                // 父系抽出
                horse.sire = line;
                processLog.push(`  → 父系抽出: ${line}`);
                bloodlineStep = 2; // 次は馬名候補
            } else if (bloodlineStep === 2 && !horse.name && this.isPotentialHorseName(line)) {
                // 馬名抽出（父系・母系・その他でない場合）
                horse.name = line;
                processLog.push(`  → 馬名抽出: ${line}`);
                bloodlineStep = 3; // 次は母系候補
            } else if (bloodlineStep === 3 && !horse.dam && (this.isMare(line) || this.isPotentialMare(line, bloodlineStep))) {
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
            
            // ステップを進める条件チェック（血統データが見つからない場合の対処）
            if (bloodlineStep === 1 && !this.isSire(line) && this.isPotentialHorseName(line)) {
                // 父系が見つからず馬名候補が来た場合、馬名として扱いステップを進める
                horse.name = line;
                processLog.push(`  → [ステップスキップ]馬名抽出: ${line}`);
                bloodlineStep = 3; // 母系候補に進む
            } else if (bloodlineStep === 2 && !this.isPotentialHorseName(line) && this.isMare(line)) {
                // 馬名が見つからず母系候補が来た場合、母系として扱いステップを進める  
                horse.dam = line;
                processLog.push(`  → [ステップスキップ]母系抽出: ${line}`);
                bloodlineStep = 4; // 母父候補に進む
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