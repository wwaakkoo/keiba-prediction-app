/**
 * 血統データベース構造定義
 * 競馬予想システムで使用する血統データの標準フォーマット
 */

// 血統データベース全体の構造
const pedigreeDatabase = {
    // 更新日時
    lastUpdated: "2024-XX-XX",
    version: "1.0.0",
    
    // 種牡馬データ
    stallions: {},
    
    // 血統系統データ
    bloodlineCategories: {},
    
    // 母系データ
    maternalLines: {},
    
    // 配合理論データ
    breedingTheory: {},
    
    // コース適性データ
    courseAptitude: {},
    
    // 血統トレンドデータ
    historicalTrends: {}
};

// 種牡馬データの構造
const stallionData = {
    // 基本情報
    name: "種牡馬名",
    nameEn: "英語名",
    lineage: "血統系統",
    birthYear: 0,
    color: "毛色",
    sire: "父",
    dam: "母",
    broodmareSire: "母父",
    
    // 現役成績
    raceRecord: {
        starts: 0,
        wins: 0,
        seconds: 0,
        thirds: 0,
        earnings: 0
    },
    
    // 主要勝鞍
    majorWins: [],
    
    // 種牡馬成績
    stallionRecord: {
        leadingPosition: 0,
        gradeWins: 0,
        totalWins: 0,
        totalEarnings: 0,
        representatives: []
    },
    
    // 適性データ
    aptitude: {
        distance: {
            sprint: 0.0,      // 1000-1400m適性 (0.0-1.0)
            mile: 0.0,        // 1400-1800m適性
            middle: 0.0,      // 1800-2400m適性
            long: 0.0         // 2400m以上適性
        },
        surface: {
            turf: 0.0,        // 芝適性 (0.0-1.0)
            dirt: 0.0         // ダート適性
        },
        runningStyle: {
            front: 0.0,       // 逃げ・先行適性
            stalker: 0.0,     // 差し適性
            closer: 0.0       // 追込適性
        },
        trackCondition: {
            firm: 0.0,        // 良馬場適性
            good: 0.0,        // 稍重適性
            yielding: 0.0,    // 重馬場適性
            soft: 0.0         // 不良馬場適性
        }
    },
    
    // コース適性
    courseSpecialty: {
        "tokyo": {
            "1400": 0.0,
            "1600": 0.0,
            "1800": 0.0,
            "2000": 0.0,
            "2400": 0.0
        },
        "kyoto": {
            "1400": 0.0,
            "1600": 0.0,
            "1800": 0.0,
            "2000": 0.0,
            "2400": 0.0
        },
        "hanshin": {
            "1400": 0.0,
            "1600": 0.0,
            "1800": 0.0,
            "2000": 0.0,
            "2400": 0.0
        }
    },
    
    // 産駒特徴
    progenyCharacteristics: {
        maturity: "早熟/中間/晩成",
        peakAge: "2歳/3歳/4歳以上",
        fillyCompatibility: 0.0,    // 牝馬適性 (0.0-1.0)
        internationalSuccess: 0.0,  // 海外適性
        durability: 0.0,            // 丈夫さ
        consistency: 0.0            // 安定性
    },
    
    // 配合相性
    breeding: {
        goodMatches: [],        // 相性良好母系
        avoidCombinations: [],  // 避けるべき配合
        nicksWith: [],          // ニックス配合
        inbreedingEffects: {}   // インブリード効果
    },
    
    // 統計データ
    statistics: {
        winRate: 0.0,           // 勝率
        placeRate: 0.0,         // 連対率
        showRate: 0.0,          // 複勝率
        gradeWinRate: 0.0,      // 重賞勝率
        earningsPerStart: 0     // 1走あたり獲得賞金
    },
    
    // 特記事項
    notes: "特記事項"
};

// 血統系統データの構造
const bloodlineCategoryData = {
    name: "系統名",
    founder: "始祖",
    origin: "起源",
    
    // 系統特徴
    characteristics: {
        distance: {
            sprint: 0.0,
            mile: 0.0,
            middle: 0.0,
            long: 0.0
        },
        surface: {
            turf: 0.0,
            dirt: 0.0
        },
        runningStyle: {
            front: 0.0,
            stalker: 0.0,
            closer: 0.0
        },
        physicalTraits: {
            stamina: 0.0,       // スタミナ
            speed: 0.0,         // スピード
            power: 0.0,         // パワー
            durability: 0.0     // 丈夫さ
        }
    },
    
    // 主要種牡馬
    majorStallions: [],
    
    // 現在の勢力
    currentInfluence: 0.0,  // 0.0-1.0
    
    // 将来性
    futureProspects: 0.0,   // 0.0-1.0
    
    // 代表的配合パターン
    typicalMatings: []
};

// 母系データの構造
const maternalLineData = {
    influence: 0.0,             // 母系の影響度
    importantFamilies: [],      // 重要な繁殖牝馬系統
    broodmareSireEffect: {},    // 母父の影響
    familyNumbers: {}           // ファミリーナンバー別特徴
};

// 配合理論データの構造
const breedingTheoryData = {
    successfulPatterns: {
        outcrossing: {},        // アウトブリード成功例
        inbreeding: {},         // インブリード効果
        nicks: {},              // ニックス配合
        crossBreeding: {}       // 異系配合
    },
    cautions: {
        avoidPatterns: [],      // 避けるべき配合
        inbreedingLimits: {}    // インブリード限界
    }
};

// コース適性データの構造
const courseAptitudeData = {
    racecourse: "競馬場名",
    characteristics: "コース特徴",
    distanceAptitude: {
        "1400": {
            stallions: {},      // 種牡馬別適性値
            bloodlines: {}      // 血統系統別適性値
        },
        "1600": {
            stallions: {},
            bloodlines: {}
        },
        "1800": {
            stallions: {},
            bloodlines: {}
        },
        "2000": {
            stallions: {},
            bloodlines: {}
        },
        "2400": {
            stallions: {},
            bloodlines: {}
        }
    }
};

// 血統トレンドデータの構造
const historicalTrendsData = {
    byDecade: {
        "1990s": [],
        "2000s": [],
        "2010s": [],
        "2020s": []
    },
    futurePredictions: [],
    emergingStallions: []       // 注目の新種牡馬
};

// 血統分析関数の構造
const pedigreeAnalysisFunctions = {
    
    // 血統適性を計算
    calculateAptitude: function(sire, dam, broodmareSire, distance, surface, course) {
        // 種牡馬、母、母父の適性を総合的に計算
        const sireAptitude = this.getStallionAptitude(sire, distance, surface, course);
        const damAptitude = this.getDamAptitude(dam, distance, surface, course);
        const broodmareSireAptitude = this.getBroodmareSireAptitude(broodmareSire, distance, surface, course);
        
        // 重み付けして合計（種牡馬50%、母25%、母父25%）
        return sireAptitude * 0.5 + damAptitude * 0.25 + broodmareSireAptitude * 0.25;
    },
    
    // 配合評価
    evaluateBreeding: function(sire, dam, broodmareSire) {
        // インブリード計算
        const inbreedingCoefficient = this.calculateInbreeding(sire, dam, broodmareSire);
        
        // ニックス評価
        const nicksScore = this.evaluateNicks(sire, broodmareSire);
        
        // 配合パターン評価
        const patternScore = this.evaluatePattern(sire, dam, broodmareSire);
        
        return {
            inbreedingCoefficient,
            nicksScore,
            patternScore,
            totalScore: (nicksScore + patternScore) * (1 - inbreedingCoefficient * 0.1)
        };
    },
    
    // 血統による予想補正値計算
    calculatePedigreeBonus: function(horseData, raceConditions) {
        const { sire, dam, broodmareSire } = horseData.pedigree;
        const { distance, surface, course, trackCondition } = raceConditions;
        
        // 基本適性
        const baseAptitude = this.calculateAptitude(sire, dam, broodmareSire, distance, surface, course);
        
        // 馬場状態補正
        const trackBonus = this.getTrackConditionBonus(sire, trackCondition);
        
        // コース補正
        const courseBonus = this.getCourseBonus(sire, course, distance);
        
        return baseAptitude + trackBonus + courseBonus;
    }
};

// エクスポート
module.exports = {
    pedigreeDatabase,
    stallionData,
    bloodlineCategoryData,
    maternalLineData,
    breedingTheoryData,
    courseAptitudeData,
    historicalTrendsData,
    pedigreeAnalysisFunctions
};