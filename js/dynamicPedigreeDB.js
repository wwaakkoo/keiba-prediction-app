// 動的血統データベース - 未知血統の学習・更新システム
class DynamicPedigreeDB {
    
    // 未知血統の一時データベース（セッション内で蓄積）
    static unknownPedigreeCache = {
        stallions: new Map(), // 種牡馬
        mares: new Map(),     // 繁殖牝馬  
        damSires: new Map()   // 母父
    };
    
    // レース結果による学習データ
    static learningData = {
        raceResults: [],      // レース結果履歴
        pedigreePerformance: new Map() // 血統別成績
    };
    
    // デフォルト血統値（未知血統用）
    static defaultPedigreeValues = {
        stallion: {
            lineage: '未分類系',
            rating: 70,
            winRate: 0.15,
            aptitude: {
                distance: [1600, 1800, 2000],
                surface: ['芝', 'ダート'],
                runningStyle: ['差し'],
                course: ['全コース'],
                trackCondition: ['良', '稍重']
            },
            confidence: 0.3 // 信頼度（低い）
        },
        mare: {
            lineage: '未分類系',
            rating: 65,
            winRate: 0.12,
            aptitude: {
                distance: [1600, 1800, 2000],
                surface: ['芝'],
                runningStyle: ['差し'],
                course: ['全コース'],
                trackCondition: ['良']
            },
            confidence: 0.2
        }
    };
    
    // 未知血統の検出・登録
    static detectAndRegisterUnknownPedigree(horse) {
        console.log(`=== 未知血統検出・登録: ${horse.name} ===`);
        
        let needsRegistration = false;
        let registrationInfo = {
            sire: null,
            dam: null,
            damSire: null
        };
        
        // 父系チェック
        if (horse.sire && !this.isKnownStallion(horse.sire)) {
            console.log(`未知父系検出: ${horse.sire}`);
            registrationInfo.sire = this.registerUnknownStallion(horse.sire);
            needsRegistration = true;
        }
        
        // 母系チェック
        if (horse.dam && !this.isKnownMare(horse.dam)) {
            console.log(`未知母系検出: ${horse.dam}`);
            registrationInfo.dam = this.registerUnknownMare(horse.dam);
            needsRegistration = true;
        }
        
        // 母父チェック
        if (horse.damSire && !this.isKnownStallion(horse.damSire)) {
            console.log(`未知母父検出: ${horse.damSire}`);
            registrationInfo.damSire = this.registerUnknownStallion(horse.damSire);
            needsRegistration = true;
        }
        
        if (needsRegistration) {
            console.log('未知血統登録完了:', registrationInfo);
            showMessage(`新血統を検出・登録: ${[horse.sire, horse.dam, horse.damSire].filter(Boolean).join(', ')}`, 'info', 4000);
        }
        
        return registrationInfo;
    }
    
    // 既知種牡馬チェック
    static isKnownStallion(stallionName) {
        if (!stallionName) return false;
        
        // 既存データベースをチェック
        if (typeof PedigreeDatabase !== 'undefined') {
            if (PedigreeDatabase.modernStallionDatabase[stallionName] || 
                PedigreeDatabase.stallionDatabase[stallionName]) {
                return true;
            }
        }
        
        // DataConverterの種牡馬リストをチェック
        if (typeof DataConverter !== 'undefined' && DataConverter.stallionNames) {
            if (DataConverter.stallionNames.includes(stallionName)) {
                return true;
            }
        }
        
        // 動的キャッシュをチェック
        return this.unknownPedigreeCache.stallions.has(stallionName);
    }
    
    // 既知繁殖牝馬チェック
    static isKnownMare(mareName) {
        if (!mareName) return false;
        
        // DataConverterの母系リストをチェック
        if (typeof DataConverter !== 'undefined' && DataConverter.mareNames) {
            if (DataConverter.mareNames.includes(mareName)) {
                return true;
            }
        }
        
        // 動的キャッシュをチェック
        return this.unknownPedigreeCache.mares.has(mareName);
    }
    
    // 未知種牡馬の登録
    static registerUnknownStallion(stallionName) {
        if (this.unknownPedigreeCache.stallions.has(stallionName)) {
            return this.unknownPedigreeCache.stallions.get(stallionName);
        }
        
        // 血統系統を推定
        const estimatedLineage = this.estimateLineageFromName(stallionName);
        
        const stallionData = {
            ...this.defaultPedigreeValues.stallion,
            name: stallionName,
            lineage: estimatedLineage,
            registeredAt: new Date().toISOString(),
            source: 'dynamic_detection',
            raceCount: 0,
            winCount: 0,
            updateHistory: []
        };
        
        this.unknownPedigreeCache.stallions.set(stallionName, stallionData);
        console.log(`新種牡馬登録: ${stallionName} (系統推定: ${estimatedLineage})`);
        
        return stallionData;
    }
    
    // 未知繁殖牝馬の登録
    static registerUnknownMare(mareName) {
        if (this.unknownPedigreeCache.mares.has(mareName)) {
            return this.unknownPedigreeCache.mares.get(mareName);
        }
        
        const mareData = {
            ...this.defaultPedigreeValues.mare,
            name: mareName,
            registeredAt: new Date().toISOString(),
            source: 'dynamic_detection',
            raceCount: 0,
            winCount: 0,
            updateHistory: []
        };
        
        this.unknownPedigreeCache.mares.set(mareName, mareData);
        console.log(`新繁殖牝馬登録: ${mareName}`);
        
        return mareData;
    }
    
    // 血統系統の推定（名前パターンから）
    static estimateLineageFromName(stallionName) {
        const lineagePatterns = {
            'サンデーサイレンス系': [
                /ディープ/, /ハーツ/, /ステイ/, /スペシャル/, /ネオ/, /マンハッタン/
            ],
            'ミスタープロスペクター系': [
                /ロード/, /キング/, /フォーティ/, /クロフネ/, /エルコンドル/
            ],
            'ノーザンダンサー系': [
                /ノーザン/, /ニジンスキー/, /リファール/, /ダンシング/
            ],
            'ロベルト系': [
                /ロベルト/, /トニービン/, /エピファネイア/
            ]
        };
        
        for (const [lineage, patterns] of Object.entries(lineagePatterns)) {
            if (patterns.some(pattern => pattern.test(stallionName))) {
                console.log(`血統系統推定: ${stallionName} → ${lineage}`);
                return lineage;
            }
        }
        
        return '未分類系';
    }
    
    // 動的血統データの取得
    static getDynamicPedigreeData(horse) {
        const result = {
            sire: null,
            dam: null,
            damSire: null,
            hasDynamicData: false
        };
        
        // 父系データ
        if (horse.sire) {
            if (this.unknownPedigreeCache.stallions.has(horse.sire)) {
                result.sire = this.unknownPedigreeCache.stallions.get(horse.sire);
                result.hasDynamicData = true;
            }
        }
        
        // 母系データ
        if (horse.dam) {
            if (this.unknownPedigreeCache.mares.has(horse.dam)) {
                result.dam = this.unknownPedigreeCache.mares.get(horse.dam);
                result.hasDynamicData = true;
            }
        }
        
        // 母父データ
        if (horse.damSire) {
            if (this.unknownPedigreeCache.stallions.has(horse.damSire)) {
                result.damSire = this.unknownPedigreeCache.stallions.get(horse.damSire);
                result.hasDynamicData = true;
            }
        }
        
        return result;
    }
    
    // レース結果による血統データ更新
    static updatePedigreeFromRaceResult(horses, raceResults) {
        console.log('=== レース結果による血統データ更新開始 ===');
        
        if (!raceResults || raceResults.length === 0) {
            console.log('レース結果がありません');
            return;
        }
        
        raceResults.forEach((result, index) => {
            const horse = horses[index];
            if (!horse) return;
            
            const performance = {
                finish: result.finish,
                odds: horse.odds,
                raceDate: new Date().toISOString(),
                courseName: result.courseName || '',
                distance: result.distance || 0,
                surface: result.surface || ''
            };
            
            // 父系更新
            if (horse.sire && this.unknownPedigreeCache.stallions.has(horse.sire)) {
                this.updateStallionPerformance(horse.sire, performance);
            }
            
            // 母系更新
            if (horse.dam && this.unknownPedigreeCache.mares.has(horse.dam)) {
                this.updateMarePerformance(horse.dam, performance);
            }
            
            // 母父更新
            if (horse.damSire && this.unknownPedigreeCache.stallions.has(horse.damSire)) {
                this.updateStallionPerformance(horse.damSire, performance);
            }
        });
        
        console.log('血統データ更新完了');
        this.showUpdateSummary();
    }
    
    // 種牡馬成績更新
    static updateStallionPerformance(stallionName, performance) {
        const stallionData = this.unknownPedigreeCache.stallions.get(stallionName);
        if (!stallionData) return;
        
        stallionData.raceCount++;
        
        // 勝利カウント
        if (performance.finish === 1) {
            stallionData.winCount++;
        }
        
        // 勝率更新
        stallionData.winRate = stallionData.winCount / stallionData.raceCount;
        
        // レーティング更新（成績に応じて調整）
        const performanceBonus = this.calculatePerformanceBonus(performance);
        stallionData.rating = Math.max(50, Math.min(100, stallionData.rating + performanceBonus));
        
        // 信頼度向上
        stallionData.confidence = Math.min(1.0, stallionData.confidence + 0.1);
        
        // 更新履歴記録
        stallionData.updateHistory.push({
            date: new Date().toISOString(),
            performance,
            ratingChange: performanceBonus,
            newRating: stallionData.rating,
            newWinRate: stallionData.winRate
        });
        
        console.log(`種牡馬更新: ${stallionName} - 勝率:${(stallionData.winRate*100).toFixed(1)}%, レーティング:${stallionData.rating}`);
    }
    
    // 繁殖牝馬成績更新
    static updateMarePerformance(mareName, performance) {
        const mareData = this.unknownPedigreeCache.mares.get(mareName);
        if (!mareData) return;
        
        mareData.raceCount++;
        
        if (performance.finish === 1) {
            mareData.winCount++;
        }
        
        mareData.winRate = mareData.winCount / mareData.raceCount;
        
        const performanceBonus = this.calculatePerformanceBonus(performance);
        mareData.rating = Math.max(50, Math.min(100, mareData.rating + performanceBonus));
        
        mareData.confidence = Math.min(1.0, mareData.confidence + 0.1);
        
        mareData.updateHistory.push({
            date: new Date().toISOString(),
            performance,
            ratingChange: performanceBonus,
            newRating: mareData.rating,
            newWinRate: mareData.winRate
        });
        
        console.log(`繁殖牝馬更新: ${mareName} - 勝率:${(mareData.winRate*100).toFixed(1)}%, レーティング:${mareData.rating}`);
    }
    
    // 成績ボーナス計算
    static calculatePerformanceBonus(performance) {
        let bonus = 0;
        
        // 着順による基本ボーナス
        switch (performance.finish) {
            case 1: bonus += 5; break;  // 1着
            case 2: bonus += 3; break;  // 2着
            case 3: bonus += 1; break;  // 3着
            case 4: case 5: bonus += 0; break; // 4-5着
            default: bonus -= 1; break; // 6着以下
        }
        
        // オッズによる調整（低オッズで勝利は小さなボーナス、高オッズで勝利は大きなボーナス）
        if (performance.finish <= 3) {
            if (performance.odds >= 10) {
                bonus += 2; // 高オッズでの好走
            } else if (performance.odds <= 3) {
                bonus += 1; // 低オッズでの順当勝利
            }
        }
        
        return bonus;
    }
    
    // 更新サマリー表示
    static showUpdateSummary() {
        const stallionCount = this.unknownPedigreeCache.stallions.size;
        const mareCount = this.unknownPedigreeCache.mares.size;
        
        console.log(`=== 動的血統DB状況 ===`);
        console.log(`登録済み種牡馬: ${stallionCount}頭`);
        console.log(`登録済み繁殖牝馬: ${mareCount}頭`);
        
        // 上位成績血統の表示
        const topStallions = Array.from(this.unknownPedigreeCache.stallions.entries())
            .filter(([name, data]) => data.raceCount >= 3)
            .sort(([,a], [,b]) => b.winRate - a.winRate)
            .slice(0, 3);
            
        if (topStallions.length > 0) {
            console.log('=== 成績上位種牡馬 ===');
            topStallions.forEach(([name, data]) => {
                console.log(`${name}: 勝率${(data.winRate*100).toFixed(1)}% (${data.winCount}/${data.raceCount}) レーティング${data.rating}`);
            });
        }
    }
    
    // データの永続化（localStorage）
    static saveToPersistentStorage() {
        try {
            const data = {
                stallions: Array.from(this.unknownPedigreeCache.stallions.entries()),
                mares: Array.from(this.unknownPedigreeCache.mares.entries()),
                learningData: this.learningData,
                savedAt: new Date().toISOString()
            };
            
            localStorage.setItem('dynamicPedigreeDB', JSON.stringify(data));
            console.log('動的血統データベースをローカルストレージに保存しました');
        } catch (error) {
            console.error('動的血統データベース保存エラー:', error);
        }
    }
    
    // データの読み込み（localStorage）
    static loadFromPersistentStorage() {
        try {
            const saved = localStorage.getItem('dynamicPedigreeDB');
            if (saved) {
                const data = JSON.parse(saved);
                
                this.unknownPedigreeCache.stallions = new Map(data.stallions || []);
                this.unknownPedigreeCache.mares = new Map(data.mares || []);
                this.learningData = data.learningData || { raceResults: [], pedigreePerformance: new Map() };
                
                console.log(`動的血統データベースを読み込みました (保存日時: ${data.savedAt})`);
                console.log(`種牡馬: ${this.unknownPedigreeCache.stallions.size}頭, 繁殖牝馬: ${this.unknownPedigreeCache.mares.size}頭`);
            }
        } catch (error) {
            console.error('動的血統データベース読み込みエラー:', error);
        }
    }
    
    // 統計情報取得
    static getStatistics() {
        return {
            stallionCount: this.unknownPedigreeCache.stallions.size,
            mareCount: this.unknownPedigreeCache.mares.size,
            totalRaces: Array.from(this.unknownPedigreeCache.stallions.values()).reduce((sum, data) => sum + data.raceCount, 0),
            averageConfidence: this.calculateAverageConfidence(),
            topPerformers: this.getTopPerformers()
        };
    }
    
    // 平均信頼度計算
    static calculateAverageConfidence() {
        const allData = [
            ...Array.from(this.unknownPedigreeCache.stallions.values()),
            ...Array.from(this.unknownPedigreeCache.mares.values())
        ];
        
        if (allData.length === 0) return 0;
        
        const totalConfidence = allData.reduce((sum, data) => sum + data.confidence, 0);
        return totalConfidence / allData.length;
    }
    
    // トップパフォーマー取得
    static getTopPerformers() {
        const topStallions = Array.from(this.unknownPedigreeCache.stallions.entries())
            .filter(([name, data]) => data.raceCount >= 5)
            .sort(([,a], [,b]) => b.winRate - a.winRate)
            .slice(0, 5)
            .map(([name, data]) => ({ name, winRate: data.winRate, raceCount: data.raceCount }));
            
        return { stallions: topStallions };
    }
}

// 初期化時にデータを読み込み
document.addEventListener('DOMContentLoaded', () => {
    DynamicPedigreeDB.loadFromPersistentStorage();
});

// ページ終了時にデータを保存
window.addEventListener('beforeunload', () => {
    DynamicPedigreeDB.saveToPersistentStorage();
});

// モジュールとして公開
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DynamicPedigreeDB;
}

// グローバル変数として公開
window.DynamicPedigreeDB = DynamicPedigreeDB;