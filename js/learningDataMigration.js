// 学習データ移行システム - 既存データから強化学習システムへの移行
class LearningDataMigration {
    
    // 既存学習データを強化学習システムに移行
    static migrateToEnhancedSystem() {
        console.log('=== 学習データ移行開始 ===');
        
        try {
            // 1. 既存データの取得
            const oldData = this.extractExistingLearningData();
            if (!oldData) {
                return this.createEmptyMigrationResult('既存の学習データが見つかりません');
            }
            
            // 2. データの変換
            const convertedData = this.convertToEnhancedFormat(oldData);
            
            // 3. EnhancedLearningSystemに移行
            if (typeof EnhancedLearningSystem !== 'undefined') {
                const migrationResult = EnhancedLearningSystem.importMigratedData(convertedData);
                console.log('移行完了:', migrationResult);
                return migrationResult;
            } else {
                console.warn('EnhancedLearningSystem が読み込まれていません');
                return this.createEmptyMigrationResult('強化学習システムが利用できません');
            }
            
        } catch (error) {
            console.error('学習データ移行エラー:', error);
            return this.createEmptyMigrationResult(`移行エラー: ${error.message}`);
        }
    }
    
    // 既存学習データの抽出
    static extractExistingLearningData() {
        console.log('既存学習データを抽出中...');
        
        const sources = [];
        
        // 1. LearningSystemからのデータ取得
        if (typeof LearningSystem !== 'undefined') {
            try {
                const learningData = LearningSystem.getLearningData();
                if (learningData) {
                    sources.push({
                        name: 'LearningSystem',
                        data: learningData
                    });
                    console.log('LearningSystemからデータを取得:', learningData);
                }
            } catch (error) {
                console.warn('LearningSystem データ取得エラー:', error);
            }
        }
        
        // 2. LocalStorageからの直接取得
        try {
            const storedData = localStorage.getItem('keibaLearningData');
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                sources.push({
                    name: 'localStorage',
                    data: parsedData
                });
                console.log('LocalStorageからデータを取得:', parsedData);
            }
        } catch (error) {
            console.warn('LocalStorage データ取得エラー:', error);
        }
        
        // 3. ハイブリッド学習システムからのデータ取得
        if (typeof HybridLearningSystem !== 'undefined') {
            try {
                const hybridStats = HybridLearningSystem.getDetailedStats();
                if (hybridStats) {
                    sources.push({
                        name: 'HybridLearningSystem',
                        data: hybridStats
                    });
                    console.log('HybridLearningSystemからデータを取得:', hybridStats);
                }
            } catch (error) {
                console.warn('HybridLearningSystem データ取得エラー:', error);
            }
        }
        
        if (sources.length === 0) {
            console.log('既存の学習データが見つかりませんでした');
            return null;
        }
        
        // 最も完全なデータソースを選択（LearningSystemを優先）
        const primarySource = sources.find(s => s.name === 'LearningSystem') || sources[0];
        console.log(`主要データソース: ${primarySource.name}`);
        
        return {
            primary: primarySource,
            all: sources
        };
    }
    
    // データを強化学習システム形式に変換
    static convertToEnhancedFormat(oldDataSources) {
        console.log('データ形式変換を開始...');
        
        const primaryData = oldDataSources.primary.data;
        
        // 変換されたデータ構造
        const converted = {
            // 基本調整値の移行
            adjustments: this.convertAdjustments(primaryData.adjustments),
            
            // 精度統計の移行
            accuracy: this.convertAccuracy(primaryData.accuracy),
            
            // 成功パターンの移行
            successPatterns: this.convertSuccessPatterns(primaryData),
            
            // 血統学習データの移行
            pedigreeLearning: this.convertPedigreeLearning(primaryData),
            
            // 買い目戦略学習の移行
            bettingLearning: this.convertBettingLearning(primaryData),
            
            // メタ学習データの初期化（既存データから推定）
            metaLearning: this.initializeMetaLearning(primaryData),
            
            // 移行情報
            migrationInfo: {
                sourceSystem: oldDataSources.primary.name,
                migrationDate: new Date().toISOString(),
                sourceDataCount: oldDataSources.all.length,
                version: '1.0'
            }
        };
        
        console.log('変換完了:', converted);
        return converted;
    }
    
    // 調整値の変換
    static convertAdjustments(oldAdjustments) {
        if (!oldAdjustments) {
            console.log('調整値データなし - デフォルト値を使用');
            return {
                oddsWeight: 1.0,
                lastRaceWeight: 1.0,
                jockeyWeight: 1.0,
                pedigreeWeight: 1.0,
                runningStyleWeight: 1.0,
                ageWeight: 1.0,
                weightChangeWeight: 1.0,
                restDaysWeight: 1.0
            };
        }
        
        console.log('調整値を変換:', oldAdjustments);
        
        // 既存の調整値をマッピング
        return {
            oddsWeight: oldAdjustments.oddsWeight || 1.0,
            lastRaceWeight: oldAdjustments.lastRaceWeight || 1.0,
            jockeyWeight: oldAdjustments.jockeyWeight || 1.0,
            pedigreeWeight: oldAdjustments.pedigreeWeight || 1.0,
            runningStyleWeight: oldAdjustments.runningStyleWeight || 1.0,
            ageWeight: oldAdjustments.ageWeight || 1.0,
            weightChangeWeight: oldAdjustments.weightChangeWeight || 1.0,
            restDaysWeight: oldAdjustments.restDaysWeight || 1.0,
            // 既存の他の調整値も含める
            raceLevelWeight: oldAdjustments.raceLevelWeight || 1.0,
            courseWeight: oldAdjustments.courseWeight || 1.0,
            distanceWeight: oldAdjustments.distanceWeight || 1.0,
            trackWeight: oldAdjustments.trackWeight || 1.0,
            weatherWeight: oldAdjustments.weatherWeight || 1.0,
            populationWeight: oldAdjustments.populationWeight || 1.0
        };
    }
    
    // 精度統計の変換
    static convertAccuracy(oldAccuracy) {
        if (!oldAccuracy) {
            console.log('精度データなし - 初期値を使用');
            return {
                totalPredictions: 0,
                winPredictions: 0,
                placePredictions: 0,
                winRate: 0,
                placeRate: 0,
                recentWinRate: 0,
                recentPlaceRate: 0
            };
        }
        
        console.log('精度統計を変換:', oldAccuracy);
        
        const totalPredictions = oldAccuracy.totalPredictions || 0;
        const winPredictions = oldAccuracy.winPredictions || 0;
        const placePredictions = oldAccuracy.placePredictions || 0;
        
        return {
            totalPredictions,
            winPredictions,
            placePredictions,
            winRate: totalPredictions > 0 ? winPredictions / totalPredictions : 0,
            placeRate: totalPredictions > 0 ? placePredictions / totalPredictions : 0,
            recentWinRate: totalPredictions > 0 ? winPredictions / totalPredictions : 0,
            recentPlaceRate: totalPredictions > 0 ? placePredictions / totalPredictions : 0
        };
    }
    
    // 成功パターンの変換
    static convertSuccessPatterns(oldData) {
        console.log('成功パターンを変換...');
        
        const patterns = {
            pedigree: new Map(),
            dynamicPedigree: new Map(),
            aptitude: new Map(),
            runningStyle: new Map(),
            raceLevel: new Map(),
            courseDistance: new Map(),
            combinations: new Map()
        };
        
        // 脚質学習データの変換
        if (oldData.runningStyleSuccess && oldData.runningStyleFailure) {
            ['先行', '差し', '追込', '逃げ'].forEach(style => {
                const success = oldData.runningStyleSuccess[style] || 0;
                const failure = oldData.runningStyleFailure[style] || 0;
                const total = success + failure;
                
                if (total > 0) {
                    patterns.runningStyle.set(style, {
                        total,
                        success,
                        rate: success / total
                    });
                }
            });
        }
        
        // レースレベル学習データの変換
        if (oldData.raceLevelSuccess && oldData.raceLevelFailure) {
            ['G1', 'G2', 'G3', 'OP', '条件'].forEach(level => {
                const success = oldData.raceLevelSuccess[level] || 0;
                const failure = oldData.raceLevelFailure[level] || 0;
                const total = success + failure;
                
                if (total > 0) {
                    patterns.raceLevel.set(level, {
                        total,
                        success,
                        rate: success / total
                    });
                }
            });
        }
        
        // AI分析データの変換
        if (oldData.aiAnalysis) {
            Object.entries(oldData.aiAnalysis).forEach(([pattern, data]) => {
                if (data.total && data.total > 0) {
                    patterns.combinations.set(`AI_${pattern}`, {
                        total: data.total,
                        success: data.success || 0,
                        rate: (data.success || 0) / data.total
                    });
                }
            });
        }
        
        console.log('成功パターン変換完了:', patterns);
        return patterns;
    }
    
    // 血統学習データの変換
    static convertPedigreeLearning(oldData) {
        console.log('血統学習データを変換...');
        
        return {
            stallionPerformance: new Map(),
            marePerformance: new Map(),
            lineageEffects: new Map(),
            aptitudePatterns: new Map(),
            confidenceTracking: new Map()
        };
    }
    
    // 買い目戦略学習の変換
    static convertBettingLearning(oldData) {
        console.log('買い目戦略学習データを変換...');
        
        const bettingLearning = {
            strategySuccess: new Map(),
            expectedValueTracking: new Map(),
            riskReturnAnalysis: new Map(),
            hitRateByType: new Map()
        };
        
        // 買い目推奨履歴の変換
        if (oldData.bettingRecommendationHistory) {
            const history = oldData.bettingRecommendationHistory;
            
            // 券種別成功率の集計
            const typeStats = {};
            history.forEach(record => {
                if (record.recommendations) {
                    record.recommendations.forEach(rec => {
                        const type = rec.type || '不明';
                        if (!typeStats[type]) {
                            typeStats[type] = { total: 0, success: 0 };
                        }
                        typeStats[type].total++;
                        if (rec.isHit) {
                            typeStats[type].success++;
                        }
                    });
                }
            });
            
            // MapデータとしてStorageに保存
            Object.entries(typeStats).forEach(([type, stats]) => {
                bettingLearning.strategySuccess.set(type, {
                    total: stats.total,
                    success: stats.success,
                    rate: stats.success / stats.total
                });
            });
        }
        
        console.log('買い目戦略学習変換完了:', bettingLearning);
        return bettingLearning;
    }
    
    // メタ学習データの初期化
    static initializeMetaLearning(oldData) {
        console.log('メタ学習データを初期化...');
        
        // 既存データから学習効果を推定
        const totalPredictions = oldData.accuracy?.totalPredictions || 0;
        const winRate = oldData.accuracy?.winPredictions / Math.max(1, totalPredictions);
        
        return {
            learningEffectiveness: [],
            adjustmentHistory: [],
            overlearningDetection: 0,
            adaptationRate: Math.min(0.2, Math.max(0.05, winRate * 0.5)) // 勝率に基づく適応率
        };
    }
    
    // 空の移行結果を作成
    static createEmptyMigrationResult(reason) {
        return {
            success: false,
            reason,
            migratedDataCount: 0,
            timestamp: new Date().toISOString(),
            recommendations: [
                '新しい学習システムを使用して新規にデータを蓄積してください',
                'レース結果の入力により学習データが生成されます'
            ]
        };
    }
    
    // 移行データの検証
    static validateMigrationData(convertedData) {
        console.log('移行データを検証中...');
        
        const issues = [];
        
        // 基本的な構造チェック
        const requiredFields = ['adjustments', 'accuracy', 'successPatterns', 'pedigreeLearning', 'bettingLearning', 'metaLearning'];
        requiredFields.forEach(field => {
            if (!convertedData[field]) {
                issues.push(`必須フィールド '${field}' が不足しています`);
            }
        });
        
        // 数値データの妥当性チェック
        if (convertedData.accuracy) {
            const acc = convertedData.accuracy;
            if (acc.totalPredictions < 0 || acc.winPredictions < 0 || acc.placePredictions < 0) {
                issues.push('精度データに負の値が含まれています');
            }
            if (acc.winPredictions > acc.totalPredictions || acc.placePredictions > acc.totalPredictions) {
                issues.push('精度データに矛盾があります');
            }
        }
        
        // 調整値の妥当性チェック
        if (convertedData.adjustments) {
            Object.entries(convertedData.adjustments).forEach(([key, value]) => {
                if (typeof value !== 'number' || value <= 0 || value > 3) {
                    issues.push(`調整値 '${key}' の値が異常です: ${value}`);
                }
            });
        }
        
        console.log(`検証完了: ${issues.length}件の問題を検出`);
        return {
            isValid: issues.length === 0,
            issues
        };
    }
    
    // 移行レポートの生成
    static generateMigrationReport(migrationResult, convertedData) {
        const report = {
            migrationStatus: migrationResult.success ? '成功' : '失敗',
            timestamp: new Date().toLocaleString('ja-JP'),
            dataSource: convertedData.migrationInfo?.sourceSystem || '不明',
            statistics: {}
        };
        
        if (migrationResult.success && convertedData) {
            report.statistics = {
                totalRaces: convertedData.accuracy?.totalPredictions || 0,
                winRate: ((convertedData.accuracy?.winRate || 0) * 100).toFixed(1) + '%',
                successPatterns: Object.keys(convertedData.successPatterns || {}).length,
                adjustmentFactors: Object.keys(convertedData.adjustments || {}).length
            };
        }
        
        return report;
    }
}

// グローバル関数として移行機能を公開
function migrateLearningData() {
    try {
        console.log('=== 学習データ移行を開始します ===');
        
        const result = LearningDataMigration.migrateToEnhancedSystem();
        
        if (result.success) {
            showMessage('✅ 学習データの移行が完了しました！強化学習システムで既存データを活用できます。', 'success', 5000);
            
            // 可視化システムの更新
            if (typeof EnhancedVisualizationSystem !== 'undefined') {
                setTimeout(() => {
                    EnhancedVisualizationSystem.updateAllCharts();
                }, 1000);
            }
        } else {
            showMessage(`⚠️ 移行に問題がありました: ${result.reason}`, 'warning', 5000);
        }
        
        return result;
        
    } catch (error) {
        console.error('移行処理エラー:', error);
        showMessage(`❌ 移行エラー: ${error.message}`, 'error', 5000);
        return LearningDataMigration.createEmptyMigrationResult(error.message);
    }
}

// モジュールとして公開
window.LearningDataMigration = LearningDataMigration;
window.migrateLearningData = migrateLearningData;