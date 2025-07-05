// エラーハンドリング統合システム
class ErrorHandlingSystem {
    static errorHistory = [];
    static errorListeners = [];
    static maxErrorHistory = 200;
    static systemHealthThreshold = 70;
    
    // エラーレベル定義
    static ERROR_LEVELS = {
        CRITICAL: 'critical',
        ERROR: 'error', 
        WARNING: 'warning',
        INFO: 'info'
    };
    
    // エラーカテゴリ定義
    static ERROR_CATEGORIES = {
        DATA_VALIDATION: 'data_validation',
        API_ERROR: 'api_error',
        NETWORK_ERROR: 'network_error',
        PARSING_ERROR: 'parsing_error',
        PREDICTION_ERROR: 'prediction_error',
        SYSTEM_ERROR: 'system_error'
    };
    
    // システム初期化
    static initialize() {
        console.log('エラーハンドリングシステムを初期化します...');
        
        // グローバルエラーハンドラーを設定
        this.setupGlobalErrorHandlers();
        
        // 定期的な健全性チェックを開始
        this.startHealthMonitoring();
        
        console.log('エラーハンドリングシステム初期化完了');
    }
    
    // グローバルエラーハンドラーの設定
    static setupGlobalErrorHandlers() {
        // JavaScriptエラーをキャッチ
        window.addEventListener('error', (event) => {
            this.logError({
                level: this.ERROR_LEVELS.ERROR,
                category: this.ERROR_CATEGORIES.SYSTEM_ERROR,
                message: event.message,
                source: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error ? event.error.stack : null,
                timestamp: new Date().toISOString()
            });
        });
        
        // Promise拒否をキャッチ
        window.addEventListener('unhandledrejection', (event) => {
            this.logError({
                level: this.ERROR_LEVELS.ERROR,
                category: this.ERROR_CATEGORIES.SYSTEM_ERROR,
                message: `Promise rejection: ${event.reason}`,
                stack: event.reason ? event.reason.stack : null,
                timestamp: new Date().toISOString()
            });
        });
        
        console.log('グローバルエラーハンドラーを設定しました');
    }
    
    // エラーをログに記録
    static logError(errorInfo) {
        // タイムスタンプを追加
        const enrichedError = {
            id: this.generateErrorId(),
            timestamp: new Date().toISOString(),
            ...errorInfo
        };
        
        // エラー履歴に追加
        this.errorHistory.push(enrichedError);
        
        // 履歴サイズを制限
        if (this.errorHistory.length > this.maxErrorHistory) {
            this.errorHistory = this.errorHistory.slice(-this.maxErrorHistory);
        }
        
        // コンソールに出力
        this.logToConsole(enrichedError);
        
        // リスナーに通知
        this.notifyErrorListeners(enrichedError);
        
        // 重大なエラーの場合は特別処理
        if (errorInfo.level === this.ERROR_LEVELS.CRITICAL) {
            this.handleCriticalError(enrichedError);
        }
        
        return enrichedError.id;
    }
    
    // コンソールにエラーを出力
    static logToConsole(errorInfo) {
        const logMethod = {
            [this.ERROR_LEVELS.CRITICAL]: console.error,
            [this.ERROR_LEVELS.ERROR]: console.error,
            [this.ERROR_LEVELS.WARNING]: console.warn,
            [this.ERROR_LEVELS.INFO]: console.info
        }[errorInfo.level] || console.log;
        
        logMethod(`[${errorInfo.level.toUpperCase()}] ${errorInfo.category}: ${errorInfo.message}`, errorInfo);
    }
    
    // エラーIDを生成
    static generateErrorId() {
        return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // エラーリスナーを追加
    static addErrorListener(callback) {
        this.errorListeners.push(callback);
    }
    
    // エラーリスナーに通知
    static notifyErrorListeners(errorInfo) {
        this.errorListeners.forEach(callback => {
            try {
                callback(errorInfo);
            } catch (listenerError) {
                console.error('エラーリスナーでエラーが発生:', listenerError);
            }
        });
    }
    
    // 重大なエラーの処理
    static handleCriticalError(errorInfo) {
        console.error('🚨 重大なエラーが発生しました:', errorInfo);
        
        // ユーザーに通知
        if (typeof showMessage === 'function') {
            showMessage('重大なエラーが発生しました。システムを確認してください。', 'error', 10000);
        }
        
        // システム健全性を強制的に低下
        this.recordSystemDegradation();
    }
    
    // システム健全性監視を開始
    static startHealthMonitoring() {
        setInterval(() => {
            this.checkSystemHealth();
        }, 5 * 60 * 1000); // 5分間隔
        
        console.log('システム健全性監視を開始しました');
    }
    
    // システム健全性をチェック
    static checkSystemHealth() {
        const healthScore = this.calculateSystemHealth();
        
        if (healthScore < this.systemHealthThreshold) {
            this.logError({
                level: this.ERROR_LEVELS.WARNING,
                category: this.ERROR_CATEGORIES.SYSTEM_ERROR,
                message: `システム健全性が低下しています (スコア: ${healthScore})`,
                metadata: {
                    healthScore,
                    recentErrors: this.getRecentErrors(60 * 60 * 1000).length // 1時間以内
                }
            });
        }
        
        return healthScore;
    }
    
    // システム健全性スコアを計算
    static calculateSystemHealth() {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        const recentErrors = this.getRecentErrors(oneHour);
        
        let healthScore = 100;
        
        // エラー数による減点
        const criticalErrors = recentErrors.filter(e => e.level === this.ERROR_LEVELS.CRITICAL).length;
        const errors = recentErrors.filter(e => e.level === this.ERROR_LEVELS.ERROR).length;
        const warnings = recentErrors.filter(e => e.level === this.ERROR_LEVELS.WARNING).length;
        
        healthScore -= criticalErrors * 30;
        healthScore -= errors * 10;
        healthScore -= warnings * 2;
        
        // エラーの連続性による減点
        const consecutiveErrors = this.getConsecutiveErrors();
        if (consecutiveErrors > 3) {
            healthScore -= (consecutiveErrors - 3) * 5;
        }
        
        // カテゴリ別エラー分布による減点
        const categoryDistribution = this.getErrorCategoryDistribution(recentErrors);
        if (Object.keys(categoryDistribution).length > 3) {
            healthScore -= 10; // 多種類のエラーが発生している場合
        }
        
        return Math.max(0, Math.min(100, healthScore));
    }
    
    // 最近のエラーを取得
    static getRecentErrors(timespan) {
        const cutoff = Date.now() - timespan;
        return this.errorHistory.filter(error => 
            new Date(error.timestamp).getTime() > cutoff
        );
    }
    
    // 連続エラー数を取得
    static getConsecutiveErrors() {
        let consecutive = 0;
        const recent = this.errorHistory.slice(-10); // 最新10件を確認
        
        for (let i = recent.length - 1; i >= 0; i--) {
            if (recent[i].level === this.ERROR_LEVELS.ERROR || 
                recent[i].level === this.ERROR_LEVELS.CRITICAL) {
                consecutive++;
            } else {
                break;
            }
        }
        
        return consecutive;
    }
    
    // エラーカテゴリ分布を取得
    static getErrorCategoryDistribution(errors) {
        const distribution = {};
        errors.forEach(error => {
            distribution[error.category] = (distribution[error.category] || 0) + 1;
        });
        return distribution;
    }
    
    // システム劣化を記録
    static recordSystemDegradation() {
        // 今後の実装で、システム復旧処理などを追加できる
        console.warn('システム劣化を記録しました');
    }
    
    // エラー統計を取得
    static getErrorStats(timespan = 24 * 60 * 60 * 1000) { // デフォルト24時間
        const recentErrors = this.getRecentErrors(timespan);
        const stats = {
            total: recentErrors.length,
            byLevel: {},
            byCategory: {},
            healthScore: this.calculateSystemHealth(),
            consecutiveErrors: this.getConsecutiveErrors()
        };
        
        // レベル別集計
        Object.values(this.ERROR_LEVELS).forEach(level => {
            stats.byLevel[level] = recentErrors.filter(e => e.level === level).length;
        });
        
        // カテゴリ別集計
        Object.values(this.ERROR_CATEGORIES).forEach(category => {
            stats.byCategory[category] = recentErrors.filter(e => e.category === category).length;
        });
        
        return stats;
    }
    
    // エラー検索
    static searchErrors(criteria) {
        return this.errorHistory.filter(error => {
            if (criteria.level && error.level !== criteria.level) return false;
            if (criteria.category && error.category !== criteria.category) return false;
            if (criteria.message && !error.message.includes(criteria.message)) return false;
            if (criteria.since && new Date(error.timestamp) < new Date(criteria.since)) return false;
            if (criteria.until && new Date(error.timestamp) > new Date(criteria.until)) return false;
            return true;
        });
    }
    
    // エラー履歴をクリア
    static clearErrorHistory() {
        const cleared = this.errorHistory.length;
        this.errorHistory = [];
        console.log(`${cleared}件のエラー履歴をクリアしました`);
        return cleared;
    }
    
    // エラーレポートを生成
    static generateErrorReport(timespan = 24 * 60 * 60 * 1000) {
        const stats = this.getErrorStats(timespan);
        const recentErrors = this.getRecentErrors(timespan);
        
        const report = {
            generatedAt: new Date().toISOString(),
            timespan: timespan,
            summary: stats,
            topErrors: this.getTopErrors(recentErrors, 5),
            healthAssessment: this.assessSystemHealth(stats.healthScore),
            recommendations: this.generateRecommendations(stats)
        };
        
        return report;
    }
    
    // 頻発エラーを取得
    static getTopErrors(errors, limit = 5) {
        const errorCounts = {};
        errors.forEach(error => {
            const key = `${error.category}:${error.message}`;
            errorCounts[key] = (errorCounts[key] || 0) + 1;
        });
        
        return Object.entries(errorCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([error, count]) => ({ error, count }));
    }
    
    // システム健全性評価
    static assessSystemHealth(healthScore) {
        if (healthScore >= 90) return 'Excellent';
        if (healthScore >= 80) return 'Good';
        if (healthScore >= 70) return 'Fair';
        if (healthScore >= 50) return 'Poor';
        return 'Critical';
    }
    
    // 改善提案を生成
    static generateRecommendations(stats) {
        const recommendations = [];
        
        if (stats.byLevel.critical > 0) {
            recommendations.push('重大なエラーが発生しています。即座に対応が必要です。');
        }
        
        if (stats.byLevel.error > 10) {
            recommendations.push('エラー発生頻度が高すぎます。根本原因を調査してください。');
        }
        
        if (stats.consecutiveErrors > 5) {
            recommendations.push('連続してエラーが発生しています。システムの安定性を確認してください。');
        }
        
        if (stats.byCategory.data_validation > stats.total * 0.5) {
            recommendations.push('データ検証エラーが多発しています。入力データの品質を改善してください。');
        }
        
        if (stats.byCategory.api_error > stats.total * 0.3) {
            recommendations.push('API接続エラーが多発しています。ネットワーク状況を確認してください。');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('システムは正常に動作しています。');
        }
        
        return recommendations;
    }
}

// グローバルに公開
window.ErrorHandlingSystem = ErrorHandlingSystem;

// 自動初期化
document.addEventListener('DOMContentLoaded', () => {
    ErrorHandlingSystem.initialize();
});