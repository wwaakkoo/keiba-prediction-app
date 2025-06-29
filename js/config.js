// アプリケーション設定
const CONFIG = {
    // 学習パラメータ
    LEARNING_RATE: 0.05,
    MAX_HISTORY_SIZE: 100,
    
    // 騎手ランク（より詳細な分類）
    TOP_JOCKEYS: ['武豊', '川田将雅', 'C.ルメール', 'ルメール'],
    GOOD_JOCKEYS: ['横山武史', '戸崎圭太', '福永祐一', 'M.デムーロ', 'デムーロ', '横山典弘', '岩田康誠', '池添謙一'],
    REGULAR_JOCKEYS: ['横山和生', '石橋脩', '田辺裕信', '松山弘平', '藤岡佑介', '斎藤新', '西村淳也', 'D.レーン'],
    
    // オッズ設定（より細かい分類）
    ODDS_THRESHOLDS: {
        VERY_LOW: 3,
        LOW: 7,
        MEDIUM: 15,
        HIGH: 30,
        VERY_HIGH: 50
    },
    
    // スコア設定
    SCORE_RANGES: {
        HIGH: 70,
        MEDIUM: 55
    },
    
    // 期待値設定
    EXPECTED_VALUE_THRESHOLDS: {
        WIN_MIN: 0.2,
        PLACE_MIN: 0.05,
        WIDE_MIN: 0.03
    },

    // 新しい特徴量の重み
    FEATURE_WEIGHTS: {
        oddsWeight: 1.0,
        lastRaceWeight: 1.0,
        jockeyWeight: 1.0,
        popularityBias: 0,
        // 新しく追加する特徴量
        courseWeight: 1.0,        // コース適性
        distanceWeight: 1.0,      // 距離適性
        weatherWeight: 1.0,       // 天候適性
        trackConditionWeight: 1.0, // 馬場状態適性
        ageWeight: 1.0,           // 年齢適性
        weightChangeWeight: 1.0,  // 馬体重変化
        restDaysWeight: 1.0,      // 休養日数
        recentFormWeight: 1.0,    // 最近の調子
        classWeight: 1.0,         // クラス適性
        trainerWeight: 1.0        // 調教師実績
    },

    // コース適性データ
    COURSE_PREFERENCES: {
        // 中央競馬場
        '中山': { 'ダート': 0.8, '芝': 1.2 },
        '東京': { 'ダート': 0.9, '芝': 1.1 },
        '京都': { 'ダート': 0.7, '芝': 1.3 },
        '阪神': { 'ダート': 0.8, '芝': 1.2 },
        '新潟': { 'ダート': 0.9, '芝': 1.1 },
        '福島': { 'ダート': 0.8, '芝': 1.2 },
        '中京': { 'ダート': 0.7, '芝': 1.3 },
        '小倉': { 'ダート': 0.8, '芝': 1.2 },
        '札幌': { 'ダート': 0.9, '芝': 1.1 },
        '函館': { 'ダート': 0.9, '芝': 1.1 },
        
        // 南関東地方競馬（ダート主体）
        '大井': { 'ダート': 1.1, '芝': 0.8 },
        '船橋': { 'ダート': 1.0, '芝': 0.8 },
        '川崎': { 'ダート': 1.0, '芝': 0.8 },
        '浦和': { 'ダート': 1.0, '芝': 0.8 },
        
        // その他主要地方競馬場
        '門別': { 'ダート': 1.0, '芝': 0.9 },
        '名古屋': { 'ダート': 1.0, '芝': 0.8 },
        '笠松': { 'ダート': 1.0, '芝': 0.8 },
        '園田': { 'ダート': 1.0, '芝': 0.8 },
        '姫路': { 'ダート': 1.0, '芝': 0.8 },
        '高知': { 'ダート': 1.0, '芝': 0.8 },
        '佐賀': { 'ダート': 1.0, '芝': 0.8 },
        '金沢': { 'ダート': 1.0, '芝': 0.8 },
        '盛岡': { 'ダート': 1.0, '芝': 0.9 },
        '水沢': { 'ダート': 1.0, '芝': 0.9 }
    },

    // 距離適性データ
    DISTANCE_PREFERENCES: {
        '短距離': { '1000': 1.3, '1200': 1.2, '1400': 1.0, '1600': 0.8, '1800': 0.7, '2000': 0.6 },
        'マイル': { '1000': 0.8, '1200': 0.9, '1400': 1.0, '1600': 1.3, '1800': 1.2, '2000': 1.0 },
        '中距離': { '1000': 0.6, '1200': 0.7, '1400': 0.8, '1600': 1.0, '1800': 1.2, '2000': 1.3 },
        '長距離': { '1000': 0.5, '1200': 0.6, '1400': 0.7, '1600': 0.8, '1800': 1.0, '2000': 1.3 }
    },

    // 天候適性
    WEATHER_PREFERENCES: {
        '晴': 1.0,
        '曇': 1.0,
        '雨': 0.9,
        '小雨': 0.95,
        '雪': 0.8
    },

    // 馬場状態適性
    TRACK_CONDITIONS: {
        '良': 1.0,
        '稍重': 0.95,
        '重': 0.9,
        '不良': 0.8
    }
};

// 初期学習データ（新しい特徴量を含む）
const INITIAL_LEARNING_DATA = {
    adjustments: {
        oddsWeight: 1.0,
        lastRaceWeight: 1.0,
        jockeyWeight: 1.0,
        popularityBias: 0,
        // 新しい特徴量の初期値
        courseWeight: 1.0,
        distanceWeight: 1.0,
        weatherWeight: 1.0,
        trackConditionWeight: 1.0,
        ageWeight: 1.0,
        weightChangeWeight: 1.0,
        restDaysWeight: 1.0,
        recentFormWeight: 1.0,
        classWeight: 1.0,
        trainerWeight: 1.0
    },
    history: [],
    accuracy: {
        winPredictions: 0,
        totalPredictions: 0,
        placePredictions: 0
    },
    // 脚質学習データ
    runningStyleSuccess: {},  // 脚質別成功回数
    runningStyleFailure: {},  // 脚質別失敗回数
    // レースレベル学習データ  
    raceLevelSuccess: {},     // レースレベル別成功回数
    raceLevelFailure: {}      // レースレベル別失敗回数
}; 