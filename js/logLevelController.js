// ログレベル制御システム
class LogLevelController {
    static logLevels = {
        NONE: 0,
        ERROR: 1,
        WARN: 2,
        INFO: 3,
        DEBUG: 4
    };

    static currentLevel = this.logLevels.INFO; // デフォルト: INFO レベル
    static enabledSystems = {
        'predictionEngine': true,
        'bettingRecommender': true,
        'realtimeLearning': false,  // リアルタイム学習のログは制限
        'marketAdaptation': false,  // 市場適応のログは制限
        'featureAnalysis': false,   // 特徴量分析のログは制限
        'abTesting': false,         // A/Bテストのログは制限
        'raceAdaptation': false     // レース適応のログは制限
    };

    // ログレベル設定
    static setLogLevel(level) {
        if (typeof level === 'string') {
            level = this.logLevels[level.toUpperCase()] || this.logLevels.INFO;
        }
        this.currentLevel = level;
        console.log(`🔧 ログレベル設定: ${this.getLevelName(level)}`);
    }

    // システム別ログ有効化/無効化
    static setSystemLogging(system, enabled) {
        this.enabledSystems[system] = enabled;
        console.log(`🔧 ${system}のログ: ${enabled ? '有効' : '無効'}`);
    }

    // レベル名取得
    static getLevelName(level) {
        return Object.keys(this.logLevels).find(key => this.logLevels[key] === level) || 'UNKNOWN';
    }

    // ログ出力制御
    static log(level, system, message, ...args) {
        // レベルチェック
        if (level > this.currentLevel) {
            return;
        }

        // システム別チェック
        if (!this.enabledSystems[system]) {
            return;
        }

        // 出力
        const levelName = this.getLevelName(level);
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[${timestamp}] [${levelName}] [${system}]`;

        switch (level) {
            case this.logLevels.ERROR:
                console.error(prefix, message, ...args);
                break;
            case this.logLevels.WARN:
                console.warn(prefix, message, ...args);
                break;
            case this.logLevels.INFO:
                console.info(prefix, message, ...args);
                break;
            case this.logLevels.DEBUG:
                console.debug(prefix, message, ...args);
                break;
            default:
                console.log(prefix, message, ...args);
        }
    }

    // 便利メソッド
    static error(system, message, ...args) {
        this.log(this.logLevels.ERROR, system, message, ...args);
    }

    static warn(system, message, ...args) {
        this.log(this.logLevels.WARN, system, message, ...args);
    }

    static info(system, message, ...args) {
        this.log(this.logLevels.INFO, system, message, ...args);
    }

    static debug(system, message, ...args) {
        this.log(this.logLevels.DEBUG, system, message, ...args);
    }

    // 本番環境向け設定
    static setProductionMode() {
        this.setLogLevel(this.logLevels.WARN);
        Object.keys(this.enabledSystems).forEach(system => {
            if (system !== 'predictionEngine' && system !== 'bettingRecommender') {
                this.enabledSystems[system] = false;
            }
        });
        console.log('🏭 本番環境モード: ログ出力を最小化');
    }

    // 開発環境向け設定
    static setDevelopmentMode() {
        this.setLogLevel(this.logLevels.DEBUG);
        Object.keys(this.enabledSystems).forEach(system => {
            this.enabledSystems[system] = true;
        });
        console.log('🔧 開発環境モード: 全ログ出力を有効化');
    }

    // パフォーマンス監視モード
    static setPerformanceMode() {
        this.setLogLevel(this.logLevels.INFO);
        this.enabledSystems = {
            'predictionEngine': true,
            'bettingRecommender': true,
            'realtimeLearning': true,
            'marketAdaptation': false,
            'featureAnalysis': false,
            'abTesting': false,
            'raceAdaptation': false
        };
        console.log('📊 パフォーマンス監視モード: 重要システムのみログ出力');
    }

    // ログ統計情報
    static getLogStats() {
        return {
            currentLevel: this.getLevelName(this.currentLevel),
            enabledSystems: Object.entries(this.enabledSystems)
                .filter(([_, enabled]) => enabled)
                .map(([system, _]) => system),
            disabledSystems: Object.entries(this.enabledSystems)
                .filter(([_, enabled]) => !enabled)
                .map(([system, _]) => system)
        };
    }

    // 初期化
    static initialize() {
        console.log('🔧 ログレベル制御システム初期化');
        
        // 環境に応じた自動設定
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            this.setDevelopmentMode();
        } else {
            this.setProductionMode();
        }
        
        // グローバル関数として登録
        window.LogController = this;
        
        console.log('✅ ログレベル制御システム初期化完了');
        console.log('📊 ログ統計:', this.getLogStats());
    }
}

// 自動初期化
if (typeof window !== 'undefined') {
    LogLevelController.initialize();
}