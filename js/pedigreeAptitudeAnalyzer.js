// 血統適性判定システム - 条件特化血統分析
class PedigreeAptitudeAnalyzer {
    
    // 血統適性総合判定
    static analyzeComprehensiveAptitude(horse, raceConditions) {
        console.log(`=== 血統適性総合分析: ${horse.name} ===`);
        console.log(`レース条件: ${raceConditions.courseName} ${raceConditions.distance}m ${raceConditions.surface} ${raceConditions.raceLevel}`);
        
        const aptitudeResults = {
            horseName: horse.name,
            raceConditions,
            distanceAptitude: this.analyzeDistanceAptitude(horse, raceConditions),
            surfaceAptitude: this.analyzeSurfaceAptitude(horse, raceConditions),
            courseAptitude: this.analyzeCourseAptitude(horse, raceConditions),
            conditionAptitude: this.analyzeConditionAptitude(horse, raceConditions),
            seasonalAptitude: this.analyzeSeasonalAptitude(horse, raceConditions),
            bloodlineStrength: this.analyzeBloodlineStrength(horse, raceConditions),
            overallScore: 0,
            grade: 'C',
            recommendations: []
        };
        
        // 総合スコア計算
        aptitudeResults.overallScore = this.calculateOverallAptitudeScore(aptitudeResults);
        aptitudeResults.grade = this.getAptitudeGrade(aptitudeResults.overallScore);
        aptitudeResults.recommendations = this.generateAptitudeRecommendations(aptitudeResults);
        
        console.log(`血統適性総合評価: ${aptitudeResults.overallScore}点 (${aptitudeResults.grade}級)`);
        
        return aptitudeResults;
    }
    
    // 距離適性分析
    static analyzeDistanceAptitude(horse, raceConditions) {
        const distance = raceConditions.distance;
        let score = 70; // 基準点
        let analysis = [];
        let factors = [];
        
        try {
            // 血統データベースから父系の距離適性を取得
            if (horse.sire && typeof PedigreeDatabase !== 'undefined') {
                const sireData = PedigreeDatabase.modernStallionDatabase[horse.sire] || 
                               PedigreeDatabase.stallionDatabase[horse.sire];
                
                if (sireData) {
                    // 最新データの距離適性
                    if (sireData.aptitude && sireData.aptitude.distance) {
                        const isOptimalDistance = sireData.aptitude.distance.includes(distance);
                        if (isOptimalDistance) {
                            score += 20;
                            analysis.push('父系最適距離');
                            factors.push({ factor: '父系距離適性', impact: '+20', explanation: '最適距離での実績が豊富' });
                        } else {
                            // 近い距離での評価
                            const closestDistance = this.findClosestDistance(distance, sireData.aptitude.distance);
                            const difference = Math.abs(distance - closestDistance);
                            
                            if (difference <= 200) {
                                score += 10;
                                analysis.push('父系準最適距離');
                                factors.push({ factor: '父系距離適性', impact: '+10', explanation: '近い距離での実績あり' });
                            } else if (difference <= 400) {
                                score += 0;
                                analysis.push('父系標準距離');
                                factors.push({ factor: '父系距離適性', impact: '±0', explanation: '標準的な距離適性' });
                            } else {
                                score -= 10;
                                analysis.push('父系非推奨距離');
                                factors.push({ factor: '父系距離適性', impact: '-10', explanation: '適性が低い距離' });
                            }
                        }
                    }
                    
                    // 従来データの距離適性
                    if (sireData.distance) {
                        const aptitudeValue = sireData.distance[distance] || 
                                            this.interpolateDistanceAptitude(sireData.distance, distance);
                        
                        if (aptitudeValue >= 90) {
                            score += 15;
                            factors.push({ factor: '詳細距離分析', impact: '+15', explanation: '極めて高い距離適性' });
                        } else if (aptitudeValue >= 80) {
                            score += 8;
                            factors.push({ factor: '詳細距離分析', impact: '+8', explanation: '高い距離適性' });
                        } else if (aptitudeValue <= 60) {
                            score -= 8;
                            factors.push({ factor: '詳細距離分析', impact: '-8', explanation: '低い距離適性' });
                        }
                    }
                }
            }
            
            // 血統系統による距離特性
            const lineageBonus = this.getLineageDistanceBonus(horse, distance);
            score += lineageBonus.bonus;
            if (lineageBonus.bonus !== 0) {
                factors.push({ 
                    factor: '血統系統特性', 
                    impact: `${lineageBonus.bonus > 0 ? '+' : ''}${lineageBonus.bonus}`, 
                    explanation: lineageBonus.explanation 
                });
            }
            
            // 距離カテゴリ分析
            const distanceCategory = this.getDistanceCategory(distance);
            analysis.push(`${distanceCategory}戦`);
            
        } catch (error) {
            console.error('距離適性分析エラー:', error);
        }
        
        return {
            score: Math.max(20, Math.min(100, score)),
            category: this.getDistanceCategory(distance),
            analysis: analysis.join('・'),
            factors,
            recommendation: this.getDistanceRecommendation(score)
        };
    }
    
    // 馬場適性分析
    static analyzeSurfaceAptitude(horse, raceConditions) {
        const surface = raceConditions.surface;
        let score = 70;
        let analysis = [];
        let factors = [];
        
        try {
            if (horse.sire && typeof PedigreeDatabase !== 'undefined') {
                const sireData = PedigreeDatabase.modernStallionDatabase[horse.sire] || 
                               PedigreeDatabase.stallionDatabase[horse.sire];
                
                if (sireData) {
                    // 最新データの馬場適性
                    if (sireData.aptitude && sireData.aptitude.surface) {
                        const isOptimalSurface = sireData.aptitude.surface.includes(surface);
                        if (isOptimalSurface) {
                            score += 15;
                            analysis.push(`${surface}適性◎`);
                            factors.push({ factor: '父系馬場適性', impact: '+15', explanation: `${surface}での実績が豊富` });
                        } else {
                            score -= 8;
                            analysis.push(`${surface}適性▲`);
                            factors.push({ factor: '父系馬場適性', impact: '-8', explanation: `${surface}での実績が少ない` });
                        }
                    }
                    
                    // 従来データの馬場適性
                    if (sireData.track) {
                        const aptitudeValue = sireData.track[surface];
                        if (aptitudeValue >= 90) {
                            score += 12;
                            factors.push({ factor: '詳細馬場分析', impact: '+12', explanation: '極めて高い馬場適性' });
                        } else if (aptitudeValue >= 80) {
                            score += 6;
                            factors.push({ factor: '詳細馬場分析', impact: '+6', explanation: '高い馬場適性' });
                        } else if (aptitudeValue <= 50) {
                            score -= 10;
                            factors.push({ factor: '詳細馬場分析', impact: '-10', explanation: '低い馬場適性' });
                        }
                    }
                }
            }
            
            // 血統系統による馬場特性
            const lineageBonus = this.getLineageSurfaceBonus(horse, surface);
            score += lineageBonus.bonus;
            if (lineageBonus.bonus !== 0) {
                factors.push({ 
                    factor: '血統系統特性', 
                    impact: `${lineageBonus.bonus > 0 ? '+' : ''}${lineageBonus.bonus}`, 
                    explanation: lineageBonus.explanation 
                });
            }
            
        } catch (error) {
            console.error('馬場適性分析エラー:', error);
        }
        
        return {
            score: Math.max(20, Math.min(100, score)),
            surface,
            analysis: analysis.join('・'),
            factors,
            recommendation: this.getSurfaceRecommendation(score, surface)
        };
    }
    
    // コース適性分析
    static analyzeCourseAptitude(horse, raceConditions) {
        const courseName = raceConditions.courseName;
        const distance = raceConditions.distance;
        let score = 70;
        let analysis = [];
        let factors = [];
        
        try {
            if (horse.sire && typeof PedigreeDatabase !== 'undefined') {
                const courseAnalysis = PedigreeDatabase.analyzeCourseAptitude(horse.sire, courseName, distance);
                
                if (courseAnalysis && courseAnalysis.aptitudeScore) {
                    const aptitudeScore = courseAnalysis.aptitudeScore;
                    score = aptitudeScore;
                    analysis.push(courseAnalysis.analysis);
                    
                    if (aptitudeScore >= 90) {
                        factors.push({ factor: 'コース適性', impact: '+20', explanation: '最適なコースでの血統' });
                    } else if (aptitudeScore >= 80) {
                        factors.push({ factor: 'コース適性', impact: '+10', explanation: '良好なコースでの血統' });
                    } else if (aptitudeScore <= 60) {
                        factors.push({ factor: 'コース適性', impact: '-10', explanation: '適性が低いコース' });
                    }
                }
                
                // コース特性に基づく血統分析
                const courseCharacteristics = PedigreeDatabase.courseAptitude[courseName];
                if (courseCharacteristics) {
                    analysis.push(courseCharacteristics.characteristics);
                    
                    // 血統系統とコース特性のマッチング
                    const sireData = PedigreeDatabase.modernStallionDatabase[horse.sire] || 
                                   PedigreeDatabase.stallionDatabase[horse.sire];
                    if (sireData) {
                        const lineage = sireData.lineage || sireData.type;
                        const isLineageMatch = courseCharacteristics.distanceAptitude[distance]?.includes(lineage);
                        
                        if (isLineageMatch) {
                            score += 8;
                            factors.push({ factor: '系統コース適性', impact: '+8', explanation: 'コース特性に適した血統系統' });
                        }
                    }
                }
            }
            
        } catch (error) {
            console.error('コース適性分析エラー:', error);
        }
        
        return {
            score: Math.max(20, Math.min(100, score)),
            courseName,
            distance,
            analysis: analysis.join('・'),
            factors,
            recommendation: this.getCourseRecommendation(score, courseName)
        };
    }
    
    // 条件適性分析（馬場状態・天候等）
    static analyzeConditionAptitude(horse, raceConditions) {
        let score = 70;
        let analysis = [];
        let factors = [];
        
        try {
            // 馬場状態適性
            if (raceConditions.trackCondition) {
                const conditionBonus = this.getTrackConditionBonus(horse, raceConditions.trackCondition);
                score += conditionBonus.bonus;
                analysis.push(conditionBonus.analysis);
                if (conditionBonus.bonus !== 0) {
                    factors.push({ 
                        factor: '馬場状態適性', 
                        impact: `${conditionBonus.bonus > 0 ? '+' : ''}${conditionBonus.bonus}`, 
                        explanation: conditionBonus.explanation 
                    });
                }
            }
            
            // 天候適性
            if (raceConditions.weather) {
                const weatherBonus = this.getWeatherBonus(horse, raceConditions.weather);
                score += weatherBonus.bonus;
                analysis.push(weatherBonus.analysis);
                if (weatherBonus.bonus !== 0) {
                    factors.push({ 
                        factor: '天候適性', 
                        impact: `${weatherBonus.bonus > 0 ? '+' : ''}${weatherBonus.bonus}`, 
                        explanation: weatherBonus.explanation 
                    });
                }
            }
            
        } catch (error) {
            console.error('条件適性分析エラー:', error);
        }
        
        return {
            score: Math.max(20, Math.min(100, score)),
            trackCondition: raceConditions.trackCondition,
            weather: raceConditions.weather,
            analysis: analysis.join('・'),
            factors,
            recommendation: this.getConditionRecommendation(score)
        };
    }
    
    // 季節適性分析
    static analyzeSeasonalAptitude(horse, raceConditions) {
        let score = 70;
        let analysis = [];
        let factors = [];
        
        try {
            const currentMonth = new Date().getMonth() + 1; // 1-12
            const season = this.getSeason(currentMonth);
            
            // 血統による季節適性
            if (horse.sire && typeof PedigreeDatabase !== 'undefined') {
                const sireData = PedigreeDatabase.modernStallionDatabase[horse.sire];
                if (sireData && sireData.progenyTraits) {
                    // 成長型による季節適性
                    const maturity = sireData.progenyTraits.maturity;
                    if (maturity === '高い' && (currentMonth <= 6 || currentMonth >= 11)) {
                        score += 5;
                        analysis.push('早熟血統有利期');
                        factors.push({ factor: '早熟血統', impact: '+5', explanation: '早熟血統が活躍しやすい時期' });
                    } else if (maturity === '中程度' && (currentMonth >= 4 && currentMonth <= 10)) {
                        score += 3;
                        analysis.push('標準成長期');
                        factors.push({ factor: '標準成長', impact: '+3', explanation: '安定した成長型に適した時期' });
                    }
                    
                    // 全盛期による調整
                    const peakAge = sireData.progenyTraits.peakAge;
                    if (peakAge && horse.age) {
                        const ageRange = peakAge.split('〜').map(a => parseInt(a.replace('歳', '')));
                        if (horse.age >= ageRange[0] && horse.age <= (ageRange[1] || ageRange[0])) {
                            score += 8;
                            analysis.push('全盛期血統');
                            factors.push({ factor: '年齢適性', impact: '+8', explanation: '血統の全盛期年齢に合致' });
                        }
                    }
                }
            }
            
            analysis.push(`${season}期`);
            
        } catch (error) {
            console.error('季節適性分析エラー:', error);
        }
        
        return {
            score: Math.max(20, Math.min(100, score)),
            season: this.getSeason(new Date().getMonth() + 1),
            analysis: analysis.join('・'),
            factors,
            recommendation: this.getSeasonalRecommendation(score)
        };
    }
    
    // 血統強度分析
    static analyzeBloodlineStrength(horse, raceConditions) {
        let score = 70;
        let analysis = [];
        let factors = [];
        
        try {
            if (horse.sire && typeof PedigreeDatabase !== 'undefined') {
                const sireData = PedigreeDatabase.modernStallionDatabase[horse.sire];
                if (sireData) {
                    // リーディング順位による強度
                    if (sireData.leadingRank <= 5) {
                        score += 15;
                        analysis.push('トップサイアー');
                        factors.push({ factor: 'リーディング順位', impact: '+15', explanation: 'トップ5種牡馬の産駒' });
                    } else if (sireData.leadingRank <= 20) {
                        score += 8;
                        analysis.push('上位サイアー');
                        factors.push({ factor: 'リーディング順位', impact: '+8', explanation: 'トップ20種牡馬の産駒' });
                    }
                    
                    // 勝率による評価
                    if (sireData.winRate >= 0.35) {
                        score += 10;
                        analysis.push('高勝率血統');
                        factors.push({ factor: '産駒勝率', impact: '+10', explanation: '産駒の勝率が高い種牡馬' });
                    }
                    
                    // 重賞勝ち馬数
                    if (sireData.gradedWinners >= 5) {
                        score += 8;
                        analysis.push('重賞多数輩出');
                        factors.push({ factor: '重賞実績', impact: '+8', explanation: '重賞勝ち馬を多数輩出' });
                    }
                    
                    // 血統系統の勢力
                    const lineageData = PedigreeDatabase.bloodlineCategories[sireData.lineage];
                    if (lineageData) {
                        if (lineageData.dominance >= 0.3) {
                            score += 5;
                            analysis.push('主流血統');
                            factors.push({ factor: '血統勢力', impact: '+5', explanation: '現在主流の血統系統' });
                        }
                        
                        if (lineageData.rating >= 90) {
                            score += 5;
                            analysis.push('最高級系統');
                            factors.push({ factor: '系統評価', impact: '+5', explanation: '最高級の血統系統' });
                        }
                    }
                }
            }
            
        } catch (error) {
            console.error('血統強度分析エラー:', error);
        }
        
        return {
            score: Math.max(20, Math.min(100, score)),
            analysis: analysis.join('・'),
            factors,
            recommendation: this.getBloodlineStrengthRecommendation(score)
        };
    }
    
    // 総合適性スコア計算
    static calculateOverallAptitudeScore(aptitudeResults) {
        const weights = {
            distance: 0.30,
            surface: 0.25,
            course: 0.20,
            condition: 0.10,
            seasonal: 0.05,
            bloodlineStrength: 0.10
        };
        
        const weightedScore = 
            aptitudeResults.distanceAptitude.score * weights.distance +
            aptitudeResults.surfaceAptitude.score * weights.surface +
            aptitudeResults.courseAptitude.score * weights.course +
            aptitudeResults.conditionAptitude.score * weights.condition +
            aptitudeResults.seasonalAptitude.score * weights.seasonal +
            aptitudeResults.bloodlineStrength.score * weights.bloodlineStrength;
        
        return Math.round(weightedScore * 10) / 10;
    }
    
    // 適性グレード判定
    static getAptitudeGrade(score) {
        if (score >= 90) return 'S';
        if (score >= 85) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 75) return 'B+';
        if (score >= 70) return 'B';
        if (score >= 65) return 'C+';
        if (score >= 60) return 'C';
        return 'D';
    }
    
    // 推奨度生成
    static generateAptitudeRecommendations(aptitudeResults) {
        const recommendations = [];
        
        if (aptitudeResults.overallScore >= 85) {
            recommendations.push('血統適性が極めて高く、積極的に評価できる');
        } else if (aptitudeResults.overallScore >= 75) {
            recommendations.push('血統適性が良好で、有力候補として検討可能');
        } else if (aptitudeResults.overallScore <= 60) {
            recommendations.push('血統適性に課題があり、慎重に評価すべき');
        }
        
        // 個別要素の推奨
        if (aptitudeResults.distanceAptitude.score >= 85) {
            recommendations.push('距離適性が抜群で距離戦略で有利');
        }
        if (aptitudeResults.surfaceAptitude.score >= 85) {
            recommendations.push('馬場適性が優秀で条件面で有利');
        }
        if (aptitudeResults.courseAptitude.score >= 85) {
            recommendations.push('コース適性が高く会場での実績期待');
        }
        if (aptitudeResults.bloodlineStrength.score >= 85) {
            recommendations.push('血統強度が高く能力面で期待大');
        }
        
        return recommendations.length > 0 ? recommendations : ['標準的な血統適性評価'];
    }
    
    // ユーティリティメソッド群
    static findClosestDistance(targetDistance, distances) {
        return distances.reduce((closest, distance) => {
            return Math.abs(distance - targetDistance) < Math.abs(closest - targetDistance) ? distance : closest;
        });
    }
    
    static interpolateDistanceAptitude(distanceData, targetDistance) {
        const distances = Object.keys(distanceData).map(Number).sort((a, b) => a - b);
        
        if (targetDistance <= distances[0]) return distanceData[distances[0]];
        if (targetDistance >= distances[distances.length - 1]) return distanceData[distances[distances.length - 1]];
        
        for (let i = 0; i < distances.length - 1; i++) {
            const d1 = distances[i];
            const d2 = distances[i + 1];
            
            if (targetDistance >= d1 && targetDistance <= d2) {
                const ratio = (targetDistance - d1) / (d2 - d1);
                return Math.round(distanceData[d1] + (distanceData[d2] - distanceData[d1]) * ratio);
            }
        }
        
        return 70;
    }
    
    static getDistanceCategory(distance) {
        if (distance <= 1200) return '短距離';
        if (distance <= 1600) return 'マイル';
        if (distance <= 2000) return '中距離';
        if (distance <= 2400) return '中長距離';
        return '長距離';
    }
    
    static getSeason(month) {
        if (month >= 3 && month <= 5) return '春';
        if (month >= 6 && month <= 8) return '夏';
        if (month >= 9 && month <= 11) return '秋';
        return '冬';
    }
    
    static getLineageDistanceBonus(horse, distance) {
        // 血統系統による距離特性ボーナス実装
        // 実装詳細は省略
        return { bonus: 0, explanation: '標準的な距離適性' };
    }
    
    static getLineageSurfaceBonus(horse, surface) {
        // 血統系統による馬場特性ボーナス実装
        // 実装詳細は省略
        return { bonus: 0, explanation: '標準的な馬場適性' };
    }
    
    static getTrackConditionBonus(horse, condition) {
        return { bonus: 0, analysis: '標準', explanation: '標準的な馬場状態適性' };
    }
    
    static getWeatherBonus(horse, weather) {
        return { bonus: 0, analysis: '標準', explanation: '標準的な天候適性' };
    }
    
    // 推奨メッセージ生成メソッド群
    static getDistanceRecommendation(score) {
        if (score >= 85) return '距離適性が極めて高く、強く推奨';
        if (score >= 75) return '距離適性が良好で、推奨';
        if (score <= 60) return '距離適性に課題があり、注意が必要';
        return '標準的な距離適性';
    }
    
    static getSurfaceRecommendation(score, surface) {
        if (score >= 85) return `${surface}での適性が極めて高い`;
        if (score >= 75) return `${surface}での適性が良好`;
        if (score <= 60) return `${surface}での適性に課題がある`;
        return `${surface}での標準的な適性`;
    }
    
    static getCourseRecommendation(score, courseName) {
        if (score >= 85) return `${courseName}での血統適性が極めて高い`;
        if (score >= 75) return `${courseName}での血統適性が良好`;
        if (score <= 60) return `${courseName}での血統適性に課題がある`;
        return `${courseName}での標準的な血統適性`;
    }
    
    static getConditionRecommendation(score) {
        if (score >= 85) return '条件適性が極めて高い';
        if (score >= 75) return '条件適性が良好';
        if (score <= 60) return '条件適性に課題がある';
        return '標準的な条件適性';
    }
    
    static getSeasonalRecommendation(score) {
        if (score >= 85) return '季節・時期的に極めて有利';
        if (score >= 75) return '季節・時期的に有利';
        if (score <= 60) return '季節・時期的に不利';
        return '季節・時期的に標準';
    }
    
    static getBloodlineStrengthRecommendation(score) {
        if (score >= 85) return '血統強度が極めて高く期待大';
        if (score >= 75) return '血統強度が高く期待できる';
        if (score <= 60) return '血統強度に課題がある';
        return '標準的な血統強度';
    }
}

// モジュールとして公開
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PedigreeAptitudeAnalyzer;
}