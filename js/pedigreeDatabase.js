// 血統データベースシステム - 父系・母系パターン分析
class PedigreeDatabase {
    
    // 主要血統データベース（実績に基づく評価値）
    static stallionDatabase = {
        // 現役トップサイアー
        'ディープインパクト': {
            type: 'サンデーサイレンス系',
            rating: 95,
            specialties: ['芝', '中距離', '瞬発力'],
            distance: { 1200: 70, 1400: 80, 1600: 95, 1800: 90, 2000: 85, 2400: 75 },
            track: { '芝': 95, 'ダート': 30 },
            class: 'S',
            description: '圧倒的な瞬発力と芝適性'
        },
        'ハーツクライ': {
            type: 'サンデーサイレンス系',
            rating: 90,
            specialties: ['芝', '長距離', 'スタミナ'],
            distance: { 1200: 60, 1400: 70, 1600: 85, 1800: 90, 2000: 95, 2400: 90 },
            track: { '芝': 90, 'ダート': 40 },
            class: 'S',
            description: 'スタミナ豊富で長距離に強い'
        },
        'ロードカナロア': {
            type: 'ストームキャット系',
            rating: 88,
            specialties: ['芝', 'ダート', '短距離', 'スピード'],
            distance: { 1000: 95, 1200: 90, 1400: 80, 1600: 70, 1800: 60, 2000: 50 },
            track: { '芝': 85, 'ダート': 88 },
            class: 'S',
            description: '万能性とスピードを併せ持つ'
        },
        'オルフェーヴル': {
            type: 'ステイゴールド系',
            rating: 87,
            specialties: ['芝', '長距離', 'パワー'],
            distance: { 1200: 55, 1400: 65, 1600: 75, 1800: 85, 2000: 90, 2400: 95 },
            track: { '芝': 87, 'ダート': 65 },
            class: 'S',
            description: 'パワーとスタミナに優れる'
        },
        'キングカメハメハ': {
            type: 'ミスタープロスペクター系',
            rating: 86,
            specialties: ['芝', 'ダート', 'パワー', '万能'],
            distance: { 1200: 75, 1400: 85, 1600: 90, 1800: 85, 2000: 80, 2400: 70 },
            track: { '芝': 85, 'ダート': 85 },
            class: 'S',
            description: '芝ダート両用の万能血統'
        },
        'ダイワメジャー': {
            type: 'サンデーサイレンス系',
            rating: 84,
            specialties: ['芝', 'マイル', '先行力'],
            distance: { 1200: 85, 1400: 90, 1600: 95, 1800: 80, 2000: 70, 2400: 60 },
            track: { '芝': 90, 'ダート': 35 },
            class: 'A',
            description: 'マイル戦に抜群の適性'
        },
        'クロフネ': {
            type: 'ヘイロー系',
            rating: 83,
            specialties: ['ダート', '短距離', 'スピード'],
            distance: { 1000: 88, 1200: 95, 1400: 90, 1600: 80, 1800: 65, 2000: 55 },
            track: { '芝': 40, 'ダート': 95 },
            class: 'A',
            description: 'ダート短距離の絶対的血統'
        },
        'ステイゴールド': {
            type: 'サンデーサイレンス系',
            rating: 82,
            specialties: ['芝', '長距離', 'スタミナ', '底力'],
            distance: { 1200: 50, 1400: 60, 1600: 70, 1800: 85, 2000: 90, 2400: 95 },
            track: { '芝': 85, 'ダート': 50 },
            class: 'A',
            description: '長距離でのねばり強さが特徴'
        }
    };
    
    // 母父血統データベース（母父効果評価）
    static broodmareSireDatabase = {
        'サンデーサイレンス': {
            effect: 88,
            specialties: ['芝', '中距離', '瞬発力'],
            compatibility: ['ディープインパクト', 'ハーツクライ', 'ダイワメジャー'],
            description: '母父としても絶大な影響力'
        },
        'ノーザンテースト': {
            effect: 85,
            specialties: ['芝', 'スピード', '早熟'],
            compatibility: ['ディープインパクト', 'ロードカナロア'],
            description: 'スピードと早熟性を伝える'
        },
        'ミスタープロスペクター': {
            effect: 83,
            specialties: ['ダート', 'スピード', 'パワー'],
            compatibility: ['クロフネ', 'キングカメハメハ'],
            description: 'ダート適性とパワーを強化'
        },
        'ストームキャット': {
            effect: 80,
            specialties: ['スピード', '瞬発力', '芝ダート'],
            compatibility: ['ロードカナロア', 'キングカメハメハ'],
            description: 'スピードと万能性を付与'
        }
    };
    
    // 血統系統評価
    static pedigreeLineRatings = {
        'サンデーサイレンス系': {
            rating: 92,
            dominance: 0.45, // 現在の勢力45%
            specialties: ['芝', '瞬発力', '中距離'],
            weaknesses: ['ダート', '早熟性'],
            description: '現代競馬の主流血統'
        },
        'ミスタープロスペクター系': {
            rating: 85,
            dominance: 0.20,
            specialties: ['パワー', 'ダート', '万能'],
            weaknesses: ['瞬発力'],
            description: 'パワーとダート適性に優れる'
        },
        'ストームキャット系': {
            rating: 80,
            dominance: 0.15,
            specialties: ['スピード', '短距離', '芝ダート'],
            weaknesses: ['スタミナ'],
            description: 'スピードと万能性が魅力'
        },
        'ヘイロー系': {
            rating: 78,
            dominance: 0.10,
            specialties: ['ダート', 'スピード'],
            weaknesses: ['芝', '長距離'],
            description: 'ダート競走での実績が豊富'
        },
        'ステイゴールド系': {
            rating: 75,
            dominance: 0.10,
            specialties: ['スタミナ', '長距離', '底力'],
            weaknesses: ['スピード', '早熟性'],
            description: '長距離での粘り強さが特徴'
        }
    };
    
    // 血統評価分析
    static analyzePedigree(sire, dam, damSire) {
        console.log(`=== 血統分析: ${sire} × ${dam} (母父: ${damSire}) ===`);
        
        // 父系分析
        const sireAnalysis = this.analyzeSire(sire);
        
        // 母父分析
        const damSireAnalysis = this.analyzeDamSire(damSire);
        
        // 血統配合分析
        const matingAnalysis = this.analyzeMating(sire, damSire);
        
        // 総合評価計算
        const overallRating = this.calculateOverallPedigreeRating(sireAnalysis, damSireAnalysis, matingAnalysis);
        
        return {
            horseName: `${sire} × ${dam}`,
            sireAnalysis,
            damSireAnalysis, 
            matingAnalysis,
            overallRating,
            recommendations: this.generatePedigreeRecommendations(sireAnalysis, damSireAnalysis, matingAnalysis),
            expectedAbilities: this.predictExpectedAbilities(sireAnalysis, damSireAnalysis, matingAnalysis)
        };
    }
    
    // 父系分析
    static analyzeSire(sireName) {
        const sire = this.stallionDatabase[sireName];
        
        if (!sire) {
            return {
                name: sireName,
                rating: 60,
                type: '不明',
                analysis: '血統データベース未登録',
                distanceAptitude: this.getDefaultDistanceAptitude(),
                trackAptitude: { '芝': 70, 'ダート': 70 }
            };
        }
        
        return {
            name: sireName,
            rating: sire.rating,
            type: sire.type,
            class: sire.class,
            specialties: sire.specialties,
            distanceAptitude: sire.distance,
            trackAptitude: sire.track,
            analysis: `${sire.type}の${sire.class}級種牡馬 - ${sire.description}`
        };
    }
    
    // 母父分析
    static analyzeDamSire(damSireName) {
        const damSire = this.broodmareSireDatabase[damSireName];
        
        if (!damSire) {
            return {
                name: damSireName,
                effect: 60,
                analysis: '母父効果データなし',
                specialties: [],
                compatibility: []
            };
        }
        
        return {
            name: damSireName,
            effect: damSire.effect,
            specialties: damSire.specialties,
            compatibility: damSire.compatibility,
            analysis: `母父効果${damSire.effect}点 - ${damSire.description}`
        };
    }
    
    // 血統配合分析
    static analyzeMating(sireName, damSireName) {
        const sire = this.stallionDatabase[sireName];
        const damSire = this.broodmareSireDatabase[damSireName];
        
        let compatibility = 70; // デフォルト値
        let analysis = '標準的な配合';
        
        // 相性分析
        if (sire && damSire) {
            // 相性リストチェック
            if (damSire.compatibility.includes(sireName)) {
                compatibility = 90;
                analysis = '優秀な配合 - 相性抜群';
            }
            
            // 血統系統の相性
            const sireType = sire.type;
            if (sireType === 'サンデーサイレンス系' && damSireName === 'ノーザンテースト') {
                compatibility = Math.max(compatibility, 85);
                analysis = '良配合 - スピードと瞬発力の融合';
            } else if (sireType === 'ミスタープロスペクター系' && damSireName === 'サンデーサイレンス') {
                compatibility = Math.max(compatibility, 83);
                analysis = '良配合 - パワーと瞬発力のバランス';
            }
            
            // インブリード検知（同系統の濃さ）
            if (sire.type === 'サンデーサイレンス系' && damSireName === 'サンデーサイレンス') {
                compatibility -= 5;
                analysis += ' (サンデー系集中)';
            }
        }
        
        return {
            compatibility,
            analysis,
            pattern: this.identifyMatingPattern(sireName, damSireName),
            expectedStrengths: this.predictMatingStrengths(sire, damSire),
            riskFactors: this.identifyRiskFactors(sire, damSire)
        };
    }
    
    // 配合パターン識別
    static identifyMatingPattern(sireName, damSireName) {
        const sire = this.stallionDatabase[sireName];
        const damSire = this.broodmareSireDatabase[damSireName];
        
        if (!sire) return 'unknown';
        
        // スピード×スタミナ配合
        if (sire.specialties.includes('スピード') && damSire?.specialties.includes('スタミナ')) {
            return 'speed_stamina';
        }
        
        // パワー×瞬発力配合
        if (sire.specialties.includes('パワー') && damSire?.specialties.includes('瞬発力')) {
            return 'power_sprint';
        }
        
        // 芝×ダート配合
        if (sire.specialties.includes('芝') && damSire?.specialties.includes('ダート')) {
            return 'turf_dirt';
        }
        
        // 同系統強化配合
        if (sire.type === 'サンデーサイレンス系' && damSireName === 'サンデーサイレンス') {
            return 'line_reinforcement';
        }
        
        return 'standard';
    }
    
    // 配合強化ポイント予測
    static predictMatingStrengths(sire, damSire) {
        const strengths = [];
        
        if (!sire) return strengths;
        
        // 父の特徴を基本とする
        strengths.push(...sire.specialties);
        
        // 母父効果を追加
        if (damSire) {
            damSire.specialties.forEach(specialty => {
                if (!strengths.includes(specialty)) {
                    strengths.push(`${specialty}(母父効果)`);
                }
            });
        }
        
        return strengths;
    }
    
    // リスクファクター識別
    static identifyRiskFactors(sire, damSire) {
        const risks = [];
        
        if (!sire) return risks;
        
        // 血統系統の偏り
        if (sire.type === 'サンデーサイレンス系') {
            risks.push('サンデー系集中による早熟性');
        }
        
        // 特殊な組み合わせリスク
        if (sire.specialties.includes('短距離') && damSire?.specialties.includes('長距離')) {
            risks.push('距離適性の不一致');
        }
        
        return risks;
    }
    
    // 総合血統評価計算
    static calculateOverallPedigreeRating(sireAnalysis, damSireAnalysis, matingAnalysis) {
        // 父系評価 (60%)
        const sireScore = sireAnalysis.rating * 0.6;
        
        // 母父効果 (25%)
        const damSireScore = damSireAnalysis.effect * 0.25;
        
        // 配合相性 (15%)
        const matingScore = matingAnalysis.compatibility * 0.15;
        
        const totalScore = sireScore + damSireScore + matingScore;
        
        return {
            totalScore: Math.round(totalScore * 10) / 10,
            sireContribution: Math.round(sireScore * 10) / 10,
            damSireContribution: Math.round(damSireScore * 10) / 10,
            matingContribution: Math.round(matingScore * 10) / 10,
            grade: this.getGradeFromScore(totalScore)
        };
    }
    
    // スコアからグレード判定
    static getGradeFromScore(score) {
        if (score >= 90) return 'S';
        if (score >= 85) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 75) return 'B+';
        if (score >= 70) return 'B';
        if (score >= 65) return 'C+';
        if (score >= 60) return 'C';
        return 'D';
    }
    
    // 期待能力予測
    static predictExpectedAbilities(sireAnalysis, damSireAnalysis, matingAnalysis) {
        const abilities = {
            speed: 70,          // スピード
            stamina: 70,        // スタミナ
            power: 70,          // パワー
            spirit: 70,         // 瞬発力
            turf: 70,           // 芝適性
            dirt: 70,           // ダート適性
            earlyMaturity: 70,  // 早熟性
            durability: 70      // 丈夫さ
        };
        
        // 父系からの影響
        if (sireAnalysis.specialties) {
            sireAnalysis.specialties.forEach(specialty => {
                switch (specialty) {
                    case 'スピード':
                        abilities.speed += 15;
                        abilities.earlyMaturity += 10;
                        break;
                    case 'スタミナ':
                        abilities.stamina += 15;
                        abilities.durability += 10;
                        break;
                    case 'パワー':
                        abilities.power += 15;
                        abilities.dirt += 10;
                        break;
                    case '瞬発力':
                        abilities.spirit += 15;
                        abilities.turf += 10;
                        break;
                    case '芝':
                        abilities.turf += 10;
                        break;
                    case 'ダート':
                        abilities.dirt += 10;
                        break;
                }
            });
        }
        
        // 母父効果
        if (damSireAnalysis.specialties) {
            damSireAnalysis.specialties.forEach(specialty => {
                switch (specialty) {
                    case 'スピード':
                        abilities.speed += 8;
                        break;
                    case 'スタミナ':
                        abilities.stamina += 8;
                        break;
                    case 'パワー':
                        abilities.power += 8;
                        break;
                    case '瞬発力':
                        abilities.spirit += 8;
                        break;
                }
            });
        }
        
        // 100点上限で正規化
        Object.keys(abilities).forEach(key => {
            abilities[key] = Math.min(100, abilities[key]);
        });
        
        return abilities;
    }
    
    // 血統推奨事項生成
    static generatePedigreeRecommendations(sireAnalysis, damSireAnalysis, matingAnalysis) {
        const recommendations = [];
        
        // グレード基準の推奨
        if (matingAnalysis.compatibility >= 90) {
            recommendations.push('優秀な血統配合で高い能力が期待される');
        } else if (matingAnalysis.compatibility >= 80) {
            recommendations.push('良好な血統配合で安定した能力が見込める');
        } else if (matingAnalysis.compatibility < 70) {
            recommendations.push('血統配合に課題があり慎重に評価');
        }
        
        // 父系に基づく推奨
        if (sireAnalysis.class === 'S') {
            recommendations.push('トップクラス種牡馬の産駒で期待値高い');
        }
        
        // 特殊パターンの推奨
        switch (matingAnalysis.pattern) {
            case 'speed_stamina':
                recommendations.push('スピードとスタミナの融合でバランス良い');
                break;
            case 'power_sprint':
                recommendations.push('パワーと瞬発力の組み合わせで爆発力あり');
                break;
            case 'turf_dirt':
                recommendations.push('芝ダート両用の万能性が期待される');
                break;
            case 'line_reinforcement':
                recommendations.push('血統集中により特色が強化される可能性');
                break;
        }
        
        // リスク要因の指摘
        if (matingAnalysis.riskFactors.length > 0) {
            recommendations.push(`注意点: ${matingAnalysis.riskFactors.join('、')}`);
        }
        
        return recommendations.length > 0 ? recommendations : ['標準的な血統評価'];
    }
    
    // デフォルト距離適性
    static getDefaultDistanceAptitude() {
        return {
            1200: 70,
            1400: 75,
            1600: 80,
            1800: 75,
            2000: 70,
            2400: 65
        };
    }
    
    // 距離適性予測（血統分析結果基準）
    static predictDistanceAptitude(pedigreeAnalysis) {
        const sireDistance = pedigreeAnalysis.sireAnalysis.distanceAptitude || this.getDefaultDistanceAptitude();
        const expectedAbilities = pedigreeAnalysis.expectedAbilities;
        
        const distanceAptitude = {};
        
        // 基本的な距離適性を父系から継承
        Object.keys(sireDistance).forEach(distance => {
            let aptitude = sireDistance[distance];
            
            // スピード・スタミナバランスで調整
            if (parseInt(distance) <= 1400) {
                // 短距離はスピード重視
                aptitude += (expectedAbilities.speed - 70) * 0.3;
            } else if (parseInt(distance) >= 2000) {
                // 長距離はスタミナ重視
                aptitude += (expectedAbilities.stamina - 70) * 0.3;
            } else {
                // 中距離は瞬発力重視
                aptitude += (expectedAbilities.spirit - 70) * 0.3;
            }
            
            distanceAptitude[distance] = Math.max(0, Math.min(100, Math.round(aptitude)));
        });
        
        return distanceAptitude;
    }
    
    // 血統データベース検索
    static searchPedigree(keyword) {
        const results = [];
        
        // 種牡馬検索
        Object.keys(this.stallionDatabase).forEach(stallion => {
            if (stallion.includes(keyword)) {
                results.push({
                    type: 'stallion',
                    name: stallion,
                    data: this.stallionDatabase[stallion]
                });
            }
        });
        
        // 母父検索
        Object.keys(this.broodmareSireDatabase).forEach(broodmareSire => {
            if (broodmareSire.includes(keyword)) {
                results.push({
                    type: 'broodmareSire',
                    name: broodmareSire,
                    data: this.broodmareSireDatabase[broodmareSire]
                });
            }
        });
        
        return results;
    }
    
    // 血統統計レポート生成
    static generatePedigreeStatsReport() {
        const stats = {
            totalStallions: Object.keys(this.stallionDatabase).length,
            totalBroodmareSires: Object.keys(this.broodmareSireDatabase).length,
            pedigreeLinesCount: Object.keys(this.pedigreeLineRatings).length,
            topRatedStallions: this.getTopRatedStallions(5),
            dominantLines: this.getDominantPedigreeLines(),
            averageRating: this.calculateAverageStallionRating()
        };
        
        return stats;
    }
    
    // 上位種牡馬取得
    static getTopRatedStallions(count = 5) {
        return Object.entries(this.stallionDatabase)
            .sort(([,a], [,b]) => b.rating - a.rating)
            .slice(0, count)
            .map(([name, data]) => ({ name, rating: data.rating, type: data.type }));
    }
    
    // 優勢血統系統取得
    static getDominantPedigreeLines() {
        return Object.entries(this.pedigreeLineRatings)
            .sort(([,a], [,b]) => b.dominance - a.dominance)
            .slice(0, 3)
            .map(([name, data]) => ({ name, dominance: data.dominance, rating: data.rating }));
    }
    
    // 平均種牡馬評価計算
    static calculateAverageStallionRating() {
        const ratings = Object.values(this.stallionDatabase).map(stallion => stallion.rating);
        return Math.round(ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length * 10) / 10;
    }
}