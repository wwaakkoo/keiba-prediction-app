// ドローダウン制御システム
class DrawdownControlSystem {
    
    // ドローダウン制御設定
    static controlConfig = {
        // アラートレベル設定
        alertLevels: {
            warning: {
                drawdownThreshold: 0.1,      // 10%損失で警告
                actionRequired: false,
                message: '投資パフォーマンス注意レベル',
                adjustmentFactor: 0.9        // 投資額10%削減
            },
            caution: {
                drawdownThreshold: 0.15,     // 15%損失で注意
                actionRequired: true,
                message: '投資戦略見直し推奨',
                adjustmentFactor: 0.75       // 投資額25%削減
            },
            danger: {
                drawdownThreshold: 0.25,     // 25%損失で危険
                actionRequired: true,
                message: '投資停止・戦略変更必須',
                adjustmentFactor: 0.5        // 投資額50%削減
            },
            emergency: {
                drawdownThreshold: 0.35,     // 35%損失で緊急停止
                actionRequired: true,
                message: '緊急投資停止・資金保護',
                adjustmentFactor: 0.0        // 投資完全停止
            }
        },
        
        // 自動制御設定
        autoControl: {
            enabled: true,                   // 自動制御有効
            monitoringPeriod: 7,            // 7日間監視期間
            recoveryThreshold: 0.05,        // 5%回復で制限解除
            maxStopDuration: 30,            // 最大30日停止
            gradualRecoverySteps: 3         // 段階的回復ステップ数
        },
        
        // 損失回復戦略
        recoveryStrategies: {
            conservative: {
                name: '保守的回復',
                description: 'リスクを最小化した慎重な回復',
                riskReduction: 0.6,          // リスク60%削減
                positionSize: 0.5,           // ポジションサイズ50%削減
                diversification: 1.5,        // 分散投資1.5倍
                recoveryTargetROI: 0.05      // 5%回復目標
            },
            moderate: {
                name: '適度な回復',
                description: 'バランスを保った回復戦略',
                riskReduction: 0.4,          // リスク40%削減
                positionSize: 0.7,           // ポジションサイズ30%削減
                diversification: 1.3,        // 分散投資1.3倍
                recoveryTargetROI: 0.08      // 8%回復目標
            },
            aggressive: {
                name: '積極的回復',
                description: '迅速な回復を目指す戦略',
                riskReduction: 0.2,          // リスク20%削減
                positionSize: 0.9,           // ポジションサイズ10%削減
                diversification: 1.1,        // 分散投資1.1倍
                recoveryTargetROI: 0.12      // 12%回復目標
            }
        }
    };
    
    // 現在の制御状態
    static currentStatus = {
        isActive: false,                     // 制御アクティブ状態
        currentLevel: 'normal',              // 現在のアラートレベル
        maxDrawdown: 0,                      // 最大ドローダウン
        currentDrawdown: 0,                  // 現在のドローダウン
        controlStartDate: null,              // 制御開始日
        recoveryStrategy: 'moderate',        // 回復戦略
        lastMonitoringDate: null             // 最終監視日
    };
    
    // リアルタイム損失監視
    static monitorDrawdown(currentBalance, peakBalance, bettingHistory) {
        console.log('📉 ドローダウンリアルタイム監視開始');
        
        // 1. 現在のドローダウン計算
        const currentDrawdown = this.calculateCurrentDrawdown(currentBalance, peakBalance);
        
        // 2. 最大ドローダウン更新
        this.updateMaxDrawdown(currentDrawdown);
        
        // 3. アラートレベル判定
        const alertLevel = this.determineAlertLevel(currentDrawdown);
        
        // 4. 制御アクション実行
        const controlAction = this.executeControlAction(alertLevel, bettingHistory);
        
        // 5. 監視状態更新
        this.updateMonitoringStatus(currentDrawdown, alertLevel);
        
        const monitoringResult = {
            currentDrawdown: currentDrawdown,
            maxDrawdown: this.currentStatus.maxDrawdown,
            alertLevel: alertLevel,
            controlAction: controlAction,
            isControlActive: this.currentStatus.isActive,
            recommendation: this.generateDrawdownRecommendation(alertLevel, currentDrawdown)
        };
        
        console.log('📊 ドローダウン監視結果:', {
            現在DD: `${(currentDrawdown * 100).toFixed(1)}%`,
            最大DD: `${(this.currentStatus.maxDrawdown * 100).toFixed(1)}%`,
            アラートレベル: alertLevel,
            制御状態: this.currentStatus.isActive ? 'アクティブ' : '通常'
        });
        
        return monitoringResult;
    }
    
    // 現在のドローダウン計算
    static calculateCurrentDrawdown(currentBalance, peakBalance) {
        if (peakBalance <= 0) return 0;
        
        const drawdown = Math.max(0, (peakBalance - currentBalance) / peakBalance);
        return Math.min(1, drawdown); // 100%上限
    }
    
    // 最大ドローダウン更新
    static updateMaxDrawdown(currentDrawdown) {
        this.currentStatus.maxDrawdown = Math.max(this.currentStatus.maxDrawdown, currentDrawdown);
        this.currentStatus.currentDrawdown = currentDrawdown;
    }
    
    // アラートレベル判定
    static determineAlertLevel(currentDrawdown) {
        const levels = this.controlConfig.alertLevels;
        
        if (currentDrawdown >= levels.emergency.drawdownThreshold) {
            return 'emergency';
        } else if (currentDrawdown >= levels.danger.drawdownThreshold) {
            return 'danger';
        } else if (currentDrawdown >= levels.caution.drawdownThreshold) {
            return 'caution';
        } else if (currentDrawdown >= levels.warning.drawdownThreshold) {
            return 'warning';
        }
        
        return 'normal';
    }
    
    // 制御アクション実行
    static executeControlAction(alertLevel, bettingHistory) {
        const levelConfig = this.controlConfig.alertLevels[alertLevel];
        
        if (!levelConfig || !levelConfig.actionRequired) {
            return { action: 'monitor', adjustment: 1.0 };
        }
        
        // 自動制御が有効な場合のみ実行
        if (!this.controlConfig.autoControl.enabled) {
            return { 
                action: 'manual_review_required', 
                adjustment: levelConfig.adjustmentFactor,
                message: levelConfig.message 
            };
        }
        
        const controlAction = {
            action: this.determineControlAction(alertLevel),
            adjustment: levelConfig.adjustmentFactor,
            message: levelConfig.message,
            implementedAt: new Date().toISOString()
        };
        
        // 制御状態更新
        if (alertLevel !== 'normal' && !this.currentStatus.isActive) {
            this.activateDrawdownControl(alertLevel);
        }
        
        // 回復戦略適用
        if (this.currentStatus.isActive) {
            controlAction.recoveryStrategy = this.applyRecoveryStrategy(bettingHistory);
        }
        
        return controlAction;
    }
    
    // 制御アクション決定
    static determineControlAction(alertLevel) {
        switch (alertLevel) {
            case 'warning':
                return 'reduce_position_size';
            case 'caution':
                return 'review_strategy';
            case 'danger':
                return 'emergency_brake';
            case 'emergency':
                return 'full_stop';
            default:
                return 'continue';
        }
    }
    
    // ドローダウン制御アクティベート
    static activateDrawdownControl(alertLevel) {
        this.currentStatus.isActive = true;
        this.currentStatus.currentLevel = alertLevel;
        this.currentStatus.controlStartDate = new Date().toISOString();
        
        console.log(`🚨 ドローダウン制御アクティベート: ${alertLevel}レベル`);
        
        // ローカルストレージに状態保存
        this.saveControlStatus();
    }
    
    // 回復戦略適用
    static applyRecoveryStrategy(bettingHistory) {
        const strategy = this.controlConfig.recoveryStrategies[this.currentStatus.recoveryStrategy];
        
        const recoveryPlan = {
            strategyName: strategy.name,
            riskAdjustment: strategy.riskReduction,
            positionSizeAdjustment: strategy.positionSize,
            diversificationTarget: strategy.diversification,
            targetROI: strategy.recoveryTargetROI,
            estimatedRecoveryTime: this.estimateRecoveryTime(strategy, bettingHistory),
            actionPlan: this.generateRecoveryActionPlan(strategy)
        };
        
        return recoveryPlan;
    }
    
    // 回復時間推定
    static estimateRecoveryTime(strategy, bettingHistory) {
        if (bettingHistory.length < 10) return '不明（データ不足）';
        
        // 過去の平均ROIから回復時間を推定
        const recentROI = this.calculateRecentROI(bettingHistory.slice(-20));
        const targetROI = strategy.recoveryTargetROI;
        
        if (recentROI <= 0) return '回復困難（戦略見直し必要）';
        
        const estimatedDays = Math.ceil(targetROI / recentROI * 30); // 月次ベース推定
        return `約${estimatedDays}日`;
    }
    
    // 回復アクションプラン生成
    static generateRecoveryActionPlan(strategy) {
        return [
            `投資額を${((1 - strategy.positionSize) * 100).toFixed(0)}%削減`,
            `リスクレベルを${(strategy.riskReduction * 100).toFixed(0)}%削減`,
            `分散投資を${((strategy.diversification - 1) * 100).toFixed(0)}%増加`,
            `目標ROI ${(strategy.recoveryTargetROI * 100).toFixed(0)}%回復まで継続監視`
        ];
    }
    
    // 最近のROI計算
    static calculateRecentROI(recentHistory) {
        if (recentHistory.length === 0) return 0;
        
        const totalInvested = recentHistory.reduce((sum, bet) => sum + bet.betAmount, 0);
        const totalReturned = recentHistory.reduce((sum, bet) => sum + (bet.returnAmount || 0), 0);
        
        return totalInvested > 0 ? (totalReturned - totalInvested) / totalInvested : 0;
    }
    
    // 自動ベット停止・再開制御
    static checkAutoStopResume(currentPerformance, daysInControl) {
        console.log('🔄 自動停止・再開制御チェック');
        
        const autoConfig = this.controlConfig.autoControl;
        
        // 最大停止期間チェック
        if (daysInControl >= autoConfig.maxStopDuration) {
            return {
                action: 'force_resume',
                reason: '最大停止期間到達による強制再開',
                adjustment: 0.3 // 30%から段階的再開
            };
        }
        
        // 回復閾値チェック
        if (currentPerformance.recentROI >= autoConfig.recoveryThreshold) {
            return this.planGradualRecovery(currentPerformance);
        }
        
        // 継続的な悪化チェック
        if (currentPerformance.recentROI < -0.1 && daysInControl > 14) {
            return {
                action: 'extend_stop',
                reason: '継続的な悪化による停止延長',
                adjustment: 0.0
            };
        }
        
        return {
            action: 'maintain_control',
            reason: '現状維持',
            adjustment: this.getCurrentAdjustmentFactor()
        };
    }
    
    // 段階的回復計画
    static planGradualRecovery(currentPerformance) {
        const steps = this.controlConfig.autoControl.gradualRecoverySteps;
        const currentStep = this.calculateCurrentRecoveryStep();
        
        const adjustmentFactors = {
            1: 0.3,  // 第1段階：30%
            2: 0.6,  // 第2段階：60%
            3: 1.0   // 第3段階：100%（完全回復）
        };
        
        const nextStep = Math.min(currentStep + 1, steps);
        
        return {
            action: 'gradual_recovery',
            reason: `段階的回復 ステップ${nextStep}/${steps}`,
            adjustment: adjustmentFactors[nextStep] || 1.0,
            nextReviewDate: this.calculateNextReviewDate()
        };
    }
    
    // 損失回復戦略の自動実行
    static executeRecoveryStrategy(strategy, currentMarketConditions) {
        console.log(`💊 損失回復戦略実行: ${strategy}`);
        
        const recoveryConfig = this.controlConfig.recoveryStrategies[strategy];
        
        const execution = {
            strategy: strategy,
            implementedAdjustments: {
                riskReduction: recoveryConfig.riskReduction,
                positionSizeReduction: 1 - recoveryConfig.positionSize,
                diversificationIncrease: recoveryConfig.diversification - 1
            },
            monitoringPlan: {
                reviewInterval: 7, // 7日ごとレビュー
                successMetrics: {
                    targetROI: recoveryConfig.recoveryTargetROI,
                    maxAcceptableDrawdown: this.currentStatus.currentDrawdown * 0.8
                }
            },
            contingencyPlan: this.generateContingencyPlan(strategy)
        };
        
        // 実行状態を記録
        this.recordRecoveryExecution(execution);
        
        return execution;
    }
    
    // 緊急時対応計画生成
    static generateContingencyPlan(strategy) {
        return {
            triggerConditions: [
                'さらなる10%の追加損失',
                '回復戦略3週間無効果',
                '市場環境激変'
            ],
            emergencyActions: [
                '投資完全停止',
                '戦略根本見直し',
                '外部専門家相談'
            ],
            escalationProcedure: '自動アラート→手動介入→専門相談'
        };
    }
    
    // ドローダウン推奨事項生成
    static generateDrawdownRecommendation(alertLevel, currentDrawdown) {
        const recommendations = {
            normal: ['継続監視', '定期的なパフォーマンス確認'],
            warning: [
                'ポジションサイズの見直し',
                'リスク管理の強化',
                '分散投資の検討'
            ],
            caution: [
                '投資戦略の根本的見直し',
                '損失限定措置の実施',
                '市場環境分析の実施'
            ],
            danger: [
                '投資活動の一時停止',
                '緊急損失限定措置',
                '専門家への相談検討'
            ],
            emergency: [
                '投資活動の完全停止',
                '資金保護措置の実施',
                '戦略の全面的見直し'
            ]
        };
        
        return recommendations[alertLevel] || recommendations.normal;
    }
    
    // 監視状態更新
    static updateMonitoringStatus(currentDrawdown, alertLevel) {
        this.currentStatus.currentDrawdown = currentDrawdown;
        this.currentStatus.currentLevel = alertLevel;
        this.currentStatus.lastMonitoringDate = new Date().toISOString();
        
        // 正常レベルに回復した場合の制御解除チェック
        if (alertLevel === 'normal' && this.currentStatus.isActive) {
            this.checkControlDeactivation();
        }
        
        this.saveControlStatus();
    }
    
    // 制御解除チェック
    static checkControlDeactivation() {
        const daysSinceControl = this.calculateDaysSinceControlStart();
        const recoveryThreshold = this.controlConfig.autoControl.recoveryThreshold;
        
        if (this.currentStatus.currentDrawdown <= recoveryThreshold && daysSinceControl >= 7) {
            this.deactivateDrawdownControl();
        }
    }
    
    // ドローダウン制御解除
    static deactivateDrawdownControl() {
        console.log('✅ ドローダウン制御解除');
        
        this.currentStatus.isActive = false;
        this.currentStatus.currentLevel = 'normal';
        this.currentStatus.controlStartDate = null;
        
        this.saveControlStatus();
    }
    
    // 設定変更
    static setRecoveryStrategy(strategy) {
        if (this.controlConfig.recoveryStrategies[strategy]) {
            this.currentStatus.recoveryStrategy = strategy;
            this.saveControlStatus();
            return true;
        }
        return false;
    }
    
    static setAutoControlEnabled(enabled) {
        this.controlConfig.autoControl.enabled = enabled;
        this.saveConfiguration();
        return true;
    }
    
    // 状態・設定保存・読み込み
    static saveControlStatus() {
        try {
            localStorage.setItem('drawdownControlStatus', JSON.stringify({
                ...this.currentStatus,
                lastSaved: new Date().toISOString()
            }));
        } catch (error) {
            console.error('ドローダウン制御状態保存エラー:', error);
        }
    }
    
    static loadControlStatus() {
        try {
            const saved = localStorage.getItem('drawdownControlStatus');
            if (saved) {
                this.currentStatus = { ...this.currentStatus, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('ドローダウン制御状態読み込みエラー:', error);
        }
    }
    
    static saveConfiguration() {
        try {
            localStorage.setItem('drawdownControlConfig', JSON.stringify({
                autoControl: this.controlConfig.autoControl,
                lastUpdated: new Date().toISOString()
            }));
        } catch (error) {
            console.error('ドローダウン制御設定保存エラー:', error);
        }
    }
    
    static loadConfiguration() {
        try {
            const saved = localStorage.getItem('drawdownControlConfig');
            if (saved) {
                const config = JSON.parse(saved);
                this.controlConfig.autoControl = { ...this.controlConfig.autoControl, ...config.autoControl };
            }
        } catch (error) {
            console.error('ドローダウン制御設定読み込みエラー:', error);
        }
    }
    
    // 初期化
    static initialize() {
        this.loadConfiguration();
        this.loadControlStatus();
        console.log('📉 ドローダウン制御システム初期化完了:', {
            自動制御: this.controlConfig.autoControl.enabled ? '有効' : '無効',
            現在状態: this.currentStatus.isActive ? `${this.currentStatus.currentLevel}制御中` : '通常',
            回復戦略: this.currentStatus.recoveryStrategy
        });
    }
}

// グローバル公開
window.DrawdownControlSystem = DrawdownControlSystem;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    DrawdownControlSystem.initialize();
});