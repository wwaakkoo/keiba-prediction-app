// 個別レース特性対応システム
class RaceSpecificAdaptationSystem {
    
    // レース特性対応設定
    static adaptationConfig = {
        // レースタイプ分類
        raceTypeClassification: {
            distanceCategories: {
                sprint: { min: 1000, max: 1400 },
                mile: { min: 1401, max: 1800 },
                middle: { min: 1801, max: 2200 },
                long: { min: 2201, max: 3600 }
            },
            trackTypes: ['芝', 'ダート', '障害'],
            gradeClasses: ['G1', 'G2', 'G3', '重賞', '特別', '条件'],
            courseCharacteristics: ['左回り', '右回り', '直線', '小回り', '大回り']
        },
        
        // 特性分析設定
        characteristicsAnalysis: {
            paceAnalysis: {
                categories: ['ハイペース', 'ミドルペース', 'スローペース'],
                speedSections: ['前半', '中盤', '後半'],
                paceVariables: ['前半800m', '中間600m', '後半400m']
            },
            fieldAnalysis: {
                horseDensity: ['少頭数', '標準', '多頭数'],
                competitionLevel: ['低', '中', '高'],
                weatherImpact: ['大', '中', '小']
            },
            timeFactors: {
                seasonality: ['春', '夏', '秋', '冬'],
                dayOfWeek: ['平日', '土曜', '日曜', '祝日'],
                timeOfDay: ['午前', '午後', '夕方']
            }
        },
        
        // 適応戦略設定
        adaptationStrategies: {
            distanceSpecific: {
                sprint: { favoriteAdvantage: 0.8, surpriseRate: 0.15 },
                mile: { favoriteAdvantage: 0.7, surpriseRate: 0.12 },
                middle: { favoriteAdvantage: 0.6, surpriseRate: 0.1 },
                long: { favoriteAdvantage: 0.5, surpriseRate: 0.2 }
            },
            trackSpecific: {
                芝: { stabilityFactor: 1.0, skillRequirement: 0.8 },
                ダート: { stabilityFactor: 0.9, skillRequirement: 0.7 },
                障害: { stabilityFactor: 0.7, skillRequirement: 0.9 }
            },
            gradeSpecific: {
                G1: { competitionLevel: 1.0, unpredictability: 0.3 },
                G2: { competitionLevel: 0.9, unpredictability: 0.25 },
                G3: { competitionLevel: 0.8, unpredictability: 0.2 },
                重賞: { competitionLevel: 0.7, unpredictability: 0.15 },
                特別: { competitionLevel: 0.6, unpredictability: 0.12 },
                条件: { competitionLevel: 0.5, unpredictability: 0.1 }
            }
        }
    };
    
    // レース特性データストレージ
    static raceData = {
        raceProfiles: {},           // レースプロファイル
        adaptationRules: {},        // 適応ルール
        performanceHistory: [],     // 性能履歴
        characteristicsDatabase: {}, // 特性データベース
        adaptationResults: {},      // 適応結果
        lastAnalysis: null
    };
    
    // 個別レース特性分析実行
    static analyzeRaceSpecificCharacteristics(raceInfo, participants, historicalData = []) {
        console.log('🏇 個別レース特性分析開始');
        
        try {
            // 1. レースプロファイル作成
            const raceProfile = this.createRaceProfile(raceInfo);
            
            // 2. 距離特性分析
            const distanceAnalysis = this.analyzeDistanceCharacteristics(raceInfo, participants);
            
            // 3. コース特性分析
            const courseAnalysis = this.analyzeCourseCharacteristics(raceInfo, historicalData);
            
            // 4. 競争レベル分析
            const competitionAnalysis = this.analyzeCompetitionLevel(raceInfo, participants);
            
            // 5. ペース・展開分析
            const paceAnalysis = this.analyzePaceAndDevelopment(raceInfo, participants);
            
            // 6. 時期・環境要因分析
            const environmentalAnalysis = this.analyzeEnvironmentalFactors(raceInfo);
            
            // 7. 参加馬適性分析
            const participantAnalysis = this.analyzeParticipantSuitability(participants, raceProfile);
            
            // 8. 統合特性評価
            const integratedAnalysis = this.integrateCharacteristicsAnalysis(
                raceProfile,
                distanceAnalysis,
                courseAnalysis,
                competitionAnalysis,
                paceAnalysis,
                environmentalAnalysis,
                participantAnalysis
            );
            
            console.log('✅ 個別レース特性分析完了:', {
                レースタイプ: raceProfile.raceType,
                距離カテゴリ: distanceAnalysis.category,
                競争レベル: competitionAnalysis.level,
                予想ペース: paceAnalysis.expectedPace,
                適応度: integratedAnalysis.adaptationScore
            });
            
            return integratedAnalysis;
            
        } catch (error) {
            console.error('❌ 個別レース特性分析エラー:', error);
            return this.getDefaultCharacteristicsAnalysis();
        }
    }
    
    // レース特性対応戦略実行
    static executeRaceSpecificAdaptation(raceCharacteristics, predictions, currentStrategy) {
        console.log('🎯 レース特性対応戦略実行');
        
        try {
            // 1. 適応ルール選択
            const adaptationRules = this.selectAdaptationRules(raceCharacteristics);
            
            // 2. 予測調整実行
            const adjustedPredictions = this.adjustPredictionsForRaceCharacteristics(
                predictions,
                raceCharacteristics,
                adaptationRules
            );
            
            // 3. 戦略パラメータ調整
            const adjustedStrategy = this.adjustStrategyParameters(
                currentStrategy,
                raceCharacteristics,
                adaptationRules
            );
            
            // 4. リスク評価更新
            const riskAssessment = this.updateRiskAssessment(
                raceCharacteristics,
                adjustedPredictions,
                adjustedStrategy
            );
            
            // 5. 投資配分最適化
            const optimizedInvestment = this.optimizeInvestmentAllocation(
                adjustedPredictions,
                adjustedStrategy,
                riskAssessment
            );
            
            // 6. 適応結果統合
            const adaptationResult = this.integrateAdaptationResults(
                raceCharacteristics,
                adjustedPredictions,
                adjustedStrategy,
                riskAssessment,
                optimizedInvestment
            );
            
            // 7. 適応効果評価
            const effectivenessScore = this.evaluateAdaptationEffectiveness(
                adaptationResult,
                raceCharacteristics
            );
            
            console.log('✅ レース特性対応戦略完了:', {
                適用ルール数: adaptationRules.length,
                予測調整: `${adaptationResult.adjustmentSummary.predictionsAdjusted}件`,
                戦略調整: adaptationResult.adjustmentSummary.strategyAdjusted,
                適応効果: `${(effectivenessScore * 100).toFixed(1)}%`
            });
            
            return {
                raceCharacteristics: raceCharacteristics,
                adaptationRules: adaptationRules,
                adjustedPredictions: adjustedPredictions,
                adjustedStrategy: adjustedStrategy,
                riskAssessment: riskAssessment,
                optimizedInvestment: optimizedInvestment,
                effectivenessScore: effectivenessScore,
                adaptationTimestamp: Date.now()
            };
            
        } catch (error) {
            console.error('❌ レース特性対応戦略エラー:', error);
            return this.getDefaultAdaptationResult();
        }
    }
    
    // レースプロファイル作成
    static createRaceProfile(raceInfo) {
        const distance = parseInt(raceInfo.distance) || 2000;
        const trackType = raceInfo.trackType || '芝';
        const raceClass = raceInfo.raceClass || '条件';
        const venue = raceInfo.venue || '東京';
        
        // 距離カテゴリ決定
        const distanceCategory = this.determineDistanceCategory(distance);
        
        // レースタイプ決定
        const raceType = this.determineRaceType(distance, trackType, raceClass);
        
        // コース特性
        const courseCharacteristics = this.getCourseCharacteristics(venue, distance, trackType);
        
        return {
            raceId: raceInfo.raceId || `race_${Date.now()}`,
            name: raceInfo.name || 'テストレース',
            distance: distance,
            distanceCategory: distanceCategory,
            trackType: trackType,
            raceClass: raceClass,
            venue: venue,
            raceType: raceType,
            courseCharacteristics: courseCharacteristics,
            trackCondition: raceInfo.trackCondition || '良',
            weather: raceInfo.weather || '晴',
            createdAt: Date.now()
        };
    }
    
    // 距離特性分析
    static analyzeDistanceCharacteristics(raceInfo, participants) {
        const distance = parseInt(raceInfo.distance) || 2000;
        const distanceCategory = this.determineDistanceCategory(distance);
        const config = this.adaptationConfig.adaptationStrategies.distanceSpecific[distanceCategory];
        
        // 参加馬の距離適性分析
        const participantSuitability = participants.map(participant => {
            const distanceSuitability = this.calculateDistanceSuitability(participant, distance);
            return {
                name: participant.name,
                suitability: distanceSuitability,
                experience: this.calculateDistanceExperience(participant, distanceCategory)
            };
        });
        
        // 距離特性による影響度計算
        const impactFactors = this.calculateDistanceImpactFactors(distance, participants);
        
        return {
            category: distanceCategory,
            distance: distance,
            favoriteAdvantage: config.favoriteAdvantage,
            surpriseRate: config.surpriseRate,
            participantSuitability: participantSuitability,
            impactFactors: impactFactors,
            adaptationRecommendations: this.generateDistanceAdaptationRecommendations(
                distanceCategory,
                participantSuitability
            )
        };
    }
    
    // コース特性分析
    static analyzeCourseCharacteristics(raceInfo, historicalData) {
        const venue = raceInfo.venue || '東京';
        const distance = parseInt(raceInfo.distance) || 2000;
        const trackType = raceInfo.trackType || '芝';
        
        // コース特性取得
        const courseCharacteristics = this.getCourseCharacteristics(venue, distance, trackType);
        
        // 馬場状態影響分析
        const trackConditionImpact = this.analyzeTrackConditionImpact(
            raceInfo.trackCondition || '良',
            venue,
            trackType
        );
        
        // 季節・天候影響分析
        const weatherImpact = this.analyzeWeatherImpact(
            raceInfo.weather || '晴',
            venue,
            trackType
        );
        
        // 履歴データからのコース特性学習
        const learnedCharacteristics = this.learnCourseCharacteristics(
            venue,
            distance,
            trackType,
            historicalData
        );
        
        return {
            venue: venue,
            courseCharacteristics: courseCharacteristics,
            trackConditionImpact: trackConditionImpact,
            weatherImpact: weatherImpact,
            learnedCharacteristics: learnedCharacteristics,
            overallSuitability: this.calculateOverallCourseSuitability(
                courseCharacteristics,
                trackConditionImpact,
                weatherImpact
            )
        };
    }
    
    // 競争レベル分析
    static analyzeCompetitionLevel(raceInfo, participants) {
        const raceClass = raceInfo.raceClass || '条件';
        const config = this.adaptationConfig.adaptationStrategies.gradeSpecific[raceClass];
        
        // 参加馬レベル分析
        const participantLevels = participants.map(participant => {
            return {
                name: participant.name,
                level: this.calculateParticipantLevel(participant),
                experience: this.calculateRaceClassExperience(participant, raceClass)
            };
        });
        
        // 競争レベル統計
        const levelStats = this.calculateCompetitionLevelStats(participantLevels);
        
        // フィールド強度計算
        const fieldStrength = this.calculateFieldStrength(participants, raceClass);
        
        return {
            raceClass: raceClass,
            competitionLevel: config.competitionLevel,
            unpredictability: config.unpredictability,
            participantLevels: participantLevels,
            levelStats: levelStats,
            fieldStrength: fieldStrength,
            competitionIntensity: this.calculateCompetitionIntensity(levelStats, fieldStrength)
        };
    }
    
    // ペース・展開分析
    static analyzePaceAndDevelopment(raceInfo, participants) {
        const distance = parseInt(raceInfo.distance) || 2000;
        const trackType = raceInfo.trackType || '芝';
        
        // 脚質分析
        const runningStyles = this.analyzeRunningStyles(participants);
        
        // 予想ペース計算
        const expectedPace = this.calculateExpectedPace(
            distance,
            trackType,
            runningStyles,
            participants
        );
        
        // 展開予想
        const raceFlow = this.predictRaceFlow(
            runningStyles,
            expectedPace,
            distance
        );
        
        // ペース適性評価
        const paceSupertie = participants.map(participant => {
            return {
                name: participant.name,
                paceSupertie: this.calculatePaceSupertie(participant, expectedPace),
                positionAdvantage: this.calculatePositionAdvantage(participant, raceFlow)
            };
        });
        
        return {
            expectedPace: expectedPace,
            raceFlow: raceFlow,
            runningStyles: runningStyles,
            paceSupertie: paceSupertie,
            developmentScenarios: this.generateDevelopmentScenarios(
                expectedPace,
                raceFlow,
                runningStyles
            )
        };
    }
    
    // 環境要因分析
    static analyzeEnvironmentalFactors(raceInfo) {
        const currentDate = new Date();
        const season = this.getCurrentSeason(currentDate.getMonth());
        const dayOfWeek = this.getDayOfWeek(currentDate.getDay());
        const timeOfDay = this.getTimeOfDay(currentDate.getHours());
        
        // 季節影響分析
        const seasonalImpact = this.analyzeSeasonalImpact(season, raceInfo.venue);
        
        // 曜日影響分析
        const dayImpact = this.analyzeDayImpact(dayOfWeek);
        
        // 時間帯影響分析
        const timeImpact = this.analyzeTimeImpact(timeOfDay);
        
        // 天候影響分析
        const weatherImpact = this.analyzeWeatherImpact(
            raceInfo.weather || '晴',
            raceInfo.venue,
            raceInfo.trackType
        );
        
        return {
            season: season,
            dayOfWeek: dayOfWeek,
            timeOfDay: timeOfDay,
            weather: raceInfo.weather || '晴',
            seasonalImpact: seasonalImpact,
            dayImpact: dayImpact,
            timeImpact: timeImpact,
            weatherImpact: weatherImpact,
            overallEnvironmentalScore: this.calculateOverallEnvironmentalScore(
                seasonalImpact,
                dayImpact,
                timeImpact,
                weatherImpact
            )
        };
    }
    
    // 参加馬適性分析
    static analyzeParticipantSuitability(participants, raceProfile) {
        return participants.map(participant => {
            // 距離適性
            const distanceSuitability = this.calculateDistanceSuitability(
                participant,
                raceProfile.distance
            );
            
            // コース適性
            const courseSuitability = this.calculateCourseSuitability(
                participant,
                raceProfile.venue,
                raceProfile.trackType
            );
            
            // クラス適性
            const classSuitability = this.calculateClassSuitability(
                participant,
                raceProfile.raceClass
            );
            
            // 馬場状態適性
            const trackConditionSuitability = this.calculateTrackConditionSuitability(
                participant,
                raceProfile.trackCondition
            );
            
            // 総合適性計算
            const overallSuitability = this.calculateOverallSuitability(
                distanceSuitability,
                courseSuitability,
                classSuitability,
                trackConditionSuitability
            );
            
            return {
                name: participant.name,
                distanceSuitability: distanceSuitability,
                courseSuitability: courseSuitability,
                classSuitability: classSuitability,
                trackConditionSuitability: trackConditionSuitability,
                overallSuitability: overallSuitability,
                adaptationRecommendations: this.generateParticipantAdaptationRecommendations(
                    participant,
                    overallSuitability
                )
            };
        });
    }
    
    // 適応ルール選択
    static selectAdaptationRules(raceCharacteristics) {
        const rules = [];
        
        // 距離別適応ルール
        rules.push(...this.getDistanceAdaptationRules(raceCharacteristics.distanceAnalysis));
        
        // コース別適応ルール
        rules.push(...this.getCourseAdaptationRules(raceCharacteristics.courseAnalysis));
        
        // 競争レベル別適応ルール
        rules.push(...this.getCompetitionLevelAdaptationRules(raceCharacteristics.competitionAnalysis));
        
        // ペース別適応ルール
        rules.push(...this.getPaceAdaptationRules(raceCharacteristics.paceAnalysis));
        
        // 環境要因別適応ルール
        rules.push(...this.getEnvironmentalAdaptationRules(raceCharacteristics.environmentalAnalysis));
        
        return rules;
    }
    
    // 予測調整実行
    static adjustPredictionsForRaceCharacteristics(predictions, raceCharacteristics, adaptationRules) {
        return predictions.map(prediction => {
            let adjustedPrediction = { ...prediction };
            
            // 各適応ルールを適用
            adaptationRules.forEach(rule => {
                adjustedPrediction = this.applyAdaptationRule(adjustedPrediction, rule, raceCharacteristics);
            });
            
            return adjustedPrediction;
        });
    }
    
    // ユーティリティメソッド
    static determineDistanceCategory(distance) {
        const categories = this.adaptationConfig.raceTypeClassification.distanceCategories;
        
        for (const [category, range] of Object.entries(categories)) {
            if (distance >= range.min && distance <= range.max) {
                return category;
            }
        }
        
        return 'middle'; // デフォルト
    }
    
    static determineRaceType(distance, trackType, raceClass) {
        const distanceCategory = this.determineDistanceCategory(distance);
        return `${distanceCategory}_${trackType}_${raceClass}`;
    }
    
    static getCourseCharacteristics(venue, distance, trackType) {
        // 簡易実装
        const characteristics = {
            東京: { straightLength: 525, cornRadius: 'large', bias: 'neutral' },
            中山: { straightLength: 310, cornRadius: 'small', bias: 'inner' },
            阪神: { straightLength: 356, cornRadius: 'medium', bias: 'neutral' },
            京都: { straightLength: 404, cornRadius: 'large', bias: 'outer' }
        };
        
        return characteristics[venue] || characteristics['東京'];
    }
    
    static calculateDistanceSuitability(participant, distance) {
        // 簡易実装
        const idealDistance = 2000; // 仮の理想距離
        const difference = Math.abs(distance - idealDistance);
        return Math.max(0, 1 - difference / 2000);
    }
    
    static calculateDistanceExperience(participant, distanceCategory) {
        // 簡易実装
        return Math.random() * 0.5 + 0.5;
    }
    
    static calculateDistanceImpactFactors(distance, participants) {
        return {
            speedRequirement: distance < 1600 ? 0.8 : 0.6,
            staminaRequirement: distance > 2000 ? 0.8 : 0.5,
            tacticalComplexity: distance > 2200 ? 0.7 : 0.4
        };
    }
    
    static generateDistanceAdaptationRecommendations(distanceCategory, participantSuitability) {
        const recommendations = [];
        
        if (distanceCategory === 'sprint') {
            recommendations.push('早めの仕掛けを重視');
            recommendations.push('スピード能力を優先評価');
        } else if (distanceCategory === 'long') {
            recommendations.push('スタミナ能力を重視');
            recommendations.push('後半の末脚を評価');
        }
        
        return recommendations;
    }
    
    static analyzeRunningStyles(participants) {
        const styles = { 逃げ: 0, 先行: 0, 差し: 0, 追込: 0 };
        
        participants.forEach(participant => {
            const style = participant.runningStyle || '差し';
            styles[style] = (styles[style] || 0) + 1;
        });
        
        return styles;
    }
    
    static calculateExpectedPace(distance, trackType, runningStyles, participants) {
        // 簡易ペース計算
        const frontRunners = runningStyles.逃げ + runningStyles.先行;
        const fieldSize = participants.length;
        
        if (frontRunners > fieldSize * 0.5) {
            return 'ハイペース';
        } else if (frontRunners < fieldSize * 0.2) {
            return 'スローペース';
        } else {
            return 'ミドルペース';
        }
    }
    
    static predictRaceFlow(runningStyles, expectedPace, distance) {
        return {
            frontRunners: runningStyles.逃げ + runningStyles.先行,
            middleGroup: runningStyles.差し,
            backRunners: runningStyles.追込,
            expectedPace: expectedPace,
            keyPoints: this.identifyKeyRacePoints(distance, expectedPace)
        };
    }
    
    static identifyKeyRacePoints(distance, expectedPace) {
        const points = [];
        
        if (distance >= 2000) {
            points.push('1000m通過');
            points.push('直線入り');
        } else {
            points.push('コーナー通過');
            points.push('直線入り');
        }
        
        return points;
    }
    
    static getCurrentSeason(month) {
        if (month >= 2 && month <= 4) return '春';
        if (month >= 5 && month <= 7) return '夏';
        if (month >= 8 && month <= 10) return '秋';
        return '冬';
    }
    
    static getDayOfWeek(dayNum) {
        const days = ['日曜', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜'];
        return days[dayNum] || '日曜';
    }
    
    static getTimeOfDay(hour) {
        if (hour < 12) return '午前';
        if (hour < 17) return '午後';
        return '夕方';
    }
    
    // 簡易実装メソッド群
    static analyzeTrackConditionImpact(trackCondition, venue, trackType) {
        const impactMap = {
            '良': { stabilityFactor: 1.0, favoriteAdvantage: 1.0 },
            '稍重': { stabilityFactor: 0.95, favoriteAdvantage: 0.95 },
            '重': { stabilityFactor: 0.85, favoriteAdvantage: 0.9 },
            '不良': { stabilityFactor: 0.7, favoriteAdvantage: 0.8 }
        };
        
        return impactMap[trackCondition] || impactMap['良'];
    }
    
    static analyzeWeatherImpact(weather, venue, trackType) {
        return {
            performanceImpact: weather === '雨' ? 0.9 : 1.0,
            stabilityImpact: weather === '雨' ? 0.8 : 1.0
        };
    }
    
    static learnCourseCharacteristics(venue, distance, trackType, historicalData) {
        return {
            averageTime: 120.0,
            winningPatterns: ['先行', '差し'],
            surfaceCondition: 'good'
        };
    }
    
    static calculateOverallCourseSuitability(courseCharacteristics, trackConditionImpact, weatherImpact) {
        return 0.8; // 簡易実装
    }
    
    static calculateParticipantLevel(participant) {
        return Math.random() * 0.5 + 0.5;
    }
    
    static calculateRaceClassExperience(participant, raceClass) {
        return Math.random() * 0.5 + 0.5;
    }
    
    static calculateCompetitionLevelStats(participantLevels) {
        const levels = participantLevels.map(p => p.level);
        return {
            average: levels.reduce((sum, level) => sum + level, 0) / levels.length,
            max: Math.max(...levels),
            min: Math.min(...levels)
        };
    }
    
    static calculateFieldStrength(participants, raceClass) {
        return Math.random() * 0.5 + 0.5;
    }
    
    static calculateCompetitionIntensity(levelStats, fieldStrength) {
        return (levelStats.average + fieldStrength) / 2;
    }
    
    // デフォルト値返却メソッド
    static getDefaultCharacteristicsAnalysis() {
        return {
            raceProfile: { raceType: 'unknown', distance: 2000 },
            distanceAnalysis: { category: 'middle' },
            courseAnalysis: { overallSuitability: 0.7 },
            competitionAnalysis: { competitionLevel: 0.6 },
            paceAnalysis: { expectedPace: 'ミドルペース' },
            environmentalAnalysis: { overallEnvironmentalScore: 0.7 },
            participantAnalysis: [],
            adaptationScore: 0.6
        };
    }
    
    static getDefaultAdaptationResult() {
        return {
            raceCharacteristics: this.getDefaultCharacteristicsAnalysis(),
            adaptationRules: [],
            adjustedPredictions: [],
            adjustedStrategy: {},
            riskAssessment: { riskLevel: 0.5 },
            optimizedInvestment: { totalInvestment: 0 },
            effectivenessScore: 0.5,
            adaptationTimestamp: Date.now()
        };
    }
    
    // データ保存・読み込み
    static saveRaceData() {
        try {
            localStorage.setItem('raceSpecificAdaptationData', JSON.stringify(this.raceData));
        } catch (error) {
            console.error('レース特性対応データ保存エラー:', error);
        }
    }
    
    static loadRaceData() {
        try {
            const saved = localStorage.getItem('raceSpecificAdaptationData');
            if (saved) {
                this.raceData = { ...this.raceData, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('レース特性対応データ読み込みエラー:', error);
        }
    }
    
    // 初期化
    static initialize() {
        this.loadRaceData();
        console.log('🏇 個別レース特性対応システム初期化完了:', {
            レースプロファイル数: Object.keys(this.raceData.raceProfiles).length,
            適応ルール数: Object.keys(this.raceData.adaptationRules).length,
            最終分析: this.raceData.lastAnalysis ? new Date(this.raceData.lastAnalysis).toLocaleString() : '未実行'
        });
    }
}

// グローバル公開
window.RaceSpecificAdaptationSystem = RaceSpecificAdaptationSystem;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    RaceSpecificAdaptationSystem.initialize();
});