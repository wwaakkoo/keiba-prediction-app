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
        },
        'エピファネイア': {
            type: 'ロベルト系',
            rating: 82,
            specialties: ['芝', '中距離', 'パワー'],
            distance: { 1200: 65, 1400: 75, 1600: 85, 1800: 90, 2000: 85, 2400: 80 },
            track: { '芝': 88, 'ダート': 60 },
            class: 'A',
            description: '中距離でのパワー競馬が得意'
        },
        'ルーラーシップ': {
            type: 'サンデーサイレンス系',
            rating: 81,
            specialties: ['芝', '中長距離', 'スタミナ'],
            distance: { 1200: 55, 1400: 70, 1600: 80, 1800: 90, 2000: 95, 2400: 90 },
            track: { '芝': 85, 'ダート': 55 },
            class: 'A',
            description: 'スタミナに優れた中長距離血統'
        },
        'ブラックタイド': {
            type: 'サンデーサイレンス系',
            rating: 80,
            specialties: ['芝', '中距離', 'バランス'],
            distance: { 1200: 70, 1400: 80, 1600: 85, 1800: 85, 2000: 80, 2400: 75 },
            track: { '芝': 83, 'ダート': 45 },
            class: 'A',
            description: 'バランスの取れた血統'
        },
        'ヴィクトワールピサ': {
            type: 'ヘイロー系',
            rating: 79,
            specialties: ['ダート', '中距離', 'パワー'],
            distance: { 1200: 75, 1400: 85, 1600: 90, 1800: 85, 2000: 80, 2400: 70 },
            track: { '芝': 50, 'ダート': 90 },
            class: 'B',
            description: 'ダート中距離の実力馬'
        },
        'シンボリクリスエス': {
            type: 'ロベルト系',
            rating: 78,
            specialties: ['芝', 'ダート', '万能'],
            distance: { 1200: 70, 1400: 80, 1600: 85, 1800: 80, 2000: 75, 2400: 70 },
            track: { '芝': 78, 'ダート': 78 },
            class: 'B',
            description: '芝ダート両用の安定血統'
        },
        'マンハッタンカフェ': {
            type: 'サンデーサイレンス系',
            rating: 77,
            specialties: ['芝', '長距離', 'スタミナ'],
            distance: { 1200: 50, 1400: 60, 1600: 75, 1800: 85, 2000: 90, 2400: 95 },
            track: { '芝': 85, 'ダート': 40 },
            class: 'B',
            description: '長距離専門の血統'
        },
        'ゴールドアリュール': {
            type: 'ヘイロー系',
            rating: 76,
            specialties: ['ダート', '短中距離', 'スピード'],
            distance: { 1000: 85, 1200: 90, 1400: 85, 1600: 80, 1800: 70, 2000: 60 },
            track: { '芝': 35, 'ダート': 88 },
            class: 'B',
            description: 'ダート短中距離のスピード血統'
        },
        'スペシャルウィーク': {
            type: 'サンデーサイレンス系',
            rating: 75,
            specialties: ['芝', '中長距離', 'バランス'],
            distance: { 1200: 60, 1400: 75, 1600: 85, 1800: 90, 2000: 85, 2400: 80 },
            track: { '芝': 80, 'ダート': 50 },
            class: 'B',
            description: '中長距離のバランス型'
        },
        'フジキセキ': {
            type: 'サンデーサイレンス系',
            rating: 84,
            specialties: ['芝', '短中距離', 'スピード', '瞬発力'],
            distance: { 1200: 85, 1400: 95, 1600: 90, 1800: 75, 2000: 65, 2400: 55 },
            track: { '芝': 90, 'ダート': 30 },
            class: 'A',
            description: '芝短中距離の絶対的スピード血統'
        },
        'アグネスタキオン': {
            type: 'サンデーサイレンス系',
            rating: 83,
            specialties: ['芝', '中距離', 'スピード'],
            distance: { 1200: 80, 1400: 90, 1600: 95, 1800: 85, 2000: 75, 2400: 65 },
            track: { '芝': 88, 'ダート': 40 },
            class: 'A',
            description: '中距離スピード血統の代表格'
        },
        'サクラバクシンオー': {
            type: 'プリンスリーギフト系',
            rating: 82,
            specialties: ['芝', '短距離', 'スピード', '先行'],
            distance: { 1000: 95, 1200: 90, 1400: 75, 1600: 60, 1800: 45, 2000: 35 },
            track: { '芝': 85, 'ダート': 55 },
            class: 'A',
            description: '芝短距離スピード血統の権威'
        },
        'タイキシャトル': {
            type: 'ヘイロー系',
            rating: 81,
            specialties: ['芝', 'ダート', '短距離', 'スピード'],
            distance: { 1000: 90, 1200: 95, 1400: 85, 1600: 70, 1800: 55, 2000: 45 },
            track: { '芝': 80, 'ダート': 85 },
            class: 'A',
            description: '芝ダート短距離万能血統'
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
        },
        'トニービン': {
            effect: 82,
            specialties: ['芝', '中長距離', 'スタミナ'],
            compatibility: ['ステイゴールド', 'マンハッタンカフェ'],
            grade: 'A',
            description: '欧州血統で長距離に強い'
        },
        'フォーティナイナー': {
            effect: 78,
            specialties: ['ダート', 'スピード', 'パワー'],
            compatibility: ['ゴールドアリュール', 'クロフネ'],
            grade: 'B',
            description: 'ダート血統の名母父'
        },
        'ロベルト': {
            effect: 76,
            specialties: ['芝', 'パワー', '中距離'],
            compatibility: ['シンボリクリスエス', 'エピファネイア'],
            grade: 'B',
            description: 'パワー血統の代表格'
        },
        'リアルシャダイ': {
            effect: 75,
            specialties: ['芝', 'ダート', '万能'],
            compatibility: ['多数の血統と相性良好'],
            grade: 'B',
            description: '万能母父として定評'
        },
        'アフリート': {
            effect: 74,
            specialties: ['ダート', '短中距離', 'スピード'],
            compatibility: ['ゴールドアリュール'],
            grade: 'C',
            description: 'ダート血統の中堅母父'
        },
        'Machiavellian': {
            effect: 73,
            specialties: ['芝', '短距離', 'スピード'],
            compatibility: ['サクラバクシンオー', 'フジキセキ'],
            grade: 'C',
            description: '欧州スピード血統'
        },
        'Danzig': {
            effect: 77,
            specialties: ['スピード', '短距離', '芝ダート'],
            compatibility: ['タイキシャトル', 'ロードカナロア'],
            grade: 'B',
            description: '米国スピード血統の名血'
        },
        'Sadler\'s Wells': {
            effect: 79,
            specialties: ['芝', '中長距離', 'スタミナ'],
            compatibility: ['ステイゴールド', 'オルフェーヴル'],
            grade: 'B',
            description: '欧州中長距離血統の王道'
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
    static analyzePedigree(sire, dam, damSire, raceLevel = null, raceDistance = null, raceTrackType = null) {
        console.log(`=== 血統分析: ${sire} × ${dam} (母父: ${damSire}) [${raceLevel || 'レベル不明'}] ${raceDistance}m ${raceTrackType || ''} ===`);
        
        // 父系分析
        const sireAnalysis = this.analyzeSire(sire);
        
        // 母父分析
        const damSireAnalysis = this.analyzeDamSire(damSire);
        
        // 血統配合分析（レースレベル・距離・馬場を考慮）
        const matingAnalysis = this.analyzeMating(sire, damSire, raceLevel, raceDistance, raceTrackType);
        
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
    
    // 血統配合分析（距離・馬場適性を考慮）
    static analyzeMating(sireName, damSireName, raceLevel = null, raceDistance = null, raceTrackType = null) {
        const sire = this.stallionDatabase[sireName];
        const damSire = this.broodmareSireDatabase[damSireName];
        
        // 基本配合評価を血統データの有無とグレードで決定
        let compatibility = this.calculateBaseCompatibility(sire, damSire, raceLevel);
        let analysis = this.getBaseAnalysis(sire, damSire);
        
        // 距離・馬場適性による調整
        if (sire && (raceDistance || raceTrackType)) {
            const aptitudeBonus = this.calculateAptitudeBonus(sire, raceDistance, raceTrackType);
            compatibility += aptitudeBonus.distanceBonus + aptitudeBonus.trackBonus;
            
            if (aptitudeBonus.distanceBonus !== 0 || aptitudeBonus.trackBonus !== 0) {
                analysis += ` (適性: ${aptitudeBonus.analysis})`;
            }
        }
        
        // 相性分析
        if (sire && damSire) {
            // 相性リストチェック
            if (damSire.compatibility.includes(sireName)) {
                compatibility = Math.max(compatibility, 90);
                analysis = '優秀な配合 - 相性抜群' + (analysis.includes('適性') ? analysis.substring(analysis.indexOf(' (適性')) : '');
            }
            
            // 血統系統の相性
            const sireType = sire.type;
            if (sireType === 'サンデーサイレンス系' && damSireName === 'ノーザンテースト') {
                compatibility = Math.max(compatibility, 85);
                analysis = '良配合 - スピードと瞬発力の融合' + (analysis.includes('適性') ? analysis.substring(analysis.indexOf(' (適性')) : '');
            } else if (sireType === 'ミスタープロスペクター系' && damSireName === 'サンデーサイレンス') {
                compatibility = Math.max(compatibility, 83);
                analysis = '良配合 - パワーと瞬発力のバランス' + (analysis.includes('適性') ? analysis.substring(analysis.indexOf(' (適性')) : '');
            }
            
            // インブリード検知（同系統の濃さ）
            if (sire.type === 'サンデーサイレンス系' && damSireName === 'サンデーサイレンス') {
                compatibility -= 5;
                analysis += ' (サンデー系集中)';
            }
        }
        
        // 最終的な適正範囲制限
        compatibility = Math.max(10, Math.min(95, compatibility));
        
        return {
            compatibility,
            analysis,
            pattern: this.identifyMatingPattern(sireName, damSireName),
            expectedStrengths: this.predictMatingStrengths(sire, damSire),
            riskFactors: this.identifyRiskFactors(sire, damSire)
        };
    }
    
    // 基本配合評価を計算（血統データの有無とレースレベルで変動）
    static calculateBaseCompatibility(sire, damSire, raceLevel) {
        // 血統データの有無による基本値
        if (sire && damSire) {
            // 両方の血統データがある場合
            const sireGrade = this.gradeToNumber(sire.grade);
            const damSireGrade = this.gradeToNumber(damSire.grade || 'C');
            const baseScore = Math.round((sireGrade + damSireGrade) / 2);
            
            // レースレベルによる調整
            return this.adjustByRaceLevel(baseScore, raceLevel);
        } else if (sire || damSire) {
            // 片方のみ血統データがある場合
            const knownGrade = sire ? this.gradeToNumber(sire.grade) : this.gradeToNumber(damSire.grade || 'C');
            const baseScore = Math.round((knownGrade + this.getRandomDefaultScore()) / 2); // 不明側をランダム化
            
            return this.adjustByRaceLevel(baseScore, raceLevel);
        } else {
            // 血統データが無い場合 - ランダム要素を加えて多様化
            const randomBase = this.getRandomDefaultScore();
            return this.adjustByRaceLevel(randomBase, raceLevel);
        }
    }
    
    // 血統データ不明時のランダムデフォルト値（30-70%の範囲）
    static getRandomDefaultScore() {
        // 一般的な血統分布を模擬: 平均55%, 標準偏差12%の正規分布風
        const random1 = Math.random();
        const random2 = Math.random();
        // Box-Muller変換で正規分布を生成
        const normal = Math.sqrt(-2 * Math.log(random1)) * Math.cos(2 * Math.PI * random2);
        const score = Math.round(55 + normal * 12);
        
        // 30-70%の範囲に制限
        return Math.max(30, Math.min(70, score));
    }
    
    // 馬名から血統を推測（部分的サポート）
    static inferPedigreeFromHorseName(horseName) {
        if (!horseName) return null;
        
        const name = horseName.toLowerCase();
        
        // 有名血統の馬名パターンから推測
        const patterns = {
            // ディープインパクト産駒によくある命名パターン
            'deep': { sire: 'ディープインパクト', confidence: 0.7 },
            'impact': { sire: 'ディープインパクト', confidence: 0.6 },
            // ロードカナロア産駒パターン  
            'road': { sire: 'ロードカナロア', confidence: 0.5 },
            'lord': { sire: 'ロードカナロア', confidence: 0.4 },
            // オルフェーヴル産駒パターン
            'orfevre': { sire: 'オルフェーヴル', confidence: 0.8 },
            // キングカメハメハ産駒パターン
            'king': { sire: 'キングカメハメハ', confidence: 0.3 },
            'kamehameha': { sire: 'キングカメハメハ', confidence: 0.9 }
        };
        
        for (const [pattern, info] of Object.entries(patterns)) {
            if (name.includes(pattern)) {
                return {
                    sire: info.sire,
                    confidence: info.confidence,
                    method: 'name_pattern'
                };
            }
        }
        
        return null;
    }
    
    // 距離・馬場適性ボーナス計算
    static calculateAptitudeBonus(sire, raceDistance, raceTrackType) {
        let distanceBonus = 0;
        let trackBonus = 0;
        let analysisText = [];
        
        // 距離適性ボーナス
        if (raceDistance && sire.distance) {
            const baseDistance = 1600; // 基準距離
            const aptitude = sire.distance[raceDistance] || this.interpolateDistanceAptitude(sire.distance, raceDistance);
            
            if (aptitude >= 90) {
                distanceBonus = 10;
                analysisText.push('距離◎');
            } else if (aptitude >= 80) {
                distanceBonus = 5;
                analysisText.push('距離○');
            } else if (aptitude >= 70) {
                distanceBonus = 0;
                analysisText.push('距離△');
            } else if (aptitude >= 60) {
                distanceBonus = -3;
                analysisText.push('距離▲');
            } else {
                distanceBonus = -8;
                analysisText.push('距離×');
            }
        }
        
        // 馬場適性ボーナス
        if (raceTrackType && sire.track) {
            const trackAptitude = sire.track[raceTrackType] || 50;
            
            if (trackAptitude >= 90) {
                trackBonus = 8;
                analysisText.push(`${raceTrackType}◎`);
            } else if (trackAptitude >= 80) {
                trackBonus = 4;
                analysisText.push(`${raceTrackType}○`);
            } else if (trackAptitude >= 70) {
                trackBonus = 0;
                analysisText.push(`${raceTrackType}△`);
            } else if (trackAptitude >= 50) {
                trackBonus = -3;
                analysisText.push(`${raceTrackType}▲`);
            } else {
                trackBonus = -6;
                analysisText.push(`${raceTrackType}×`);
            }
        }
        
        return {
            distanceBonus,
            trackBonus,
            analysis: analysisText.join('・')
        };
    }
    
    // 距離適性の補間計算
    static interpolateDistanceAptitude(distanceData, targetDistance) {
        const distances = Object.keys(distanceData).map(Number).sort((a, b) => a - b);
        
        // 目標距離が範囲外の場合
        if (targetDistance <= distances[0]) {
            return distanceData[distances[0]];
        }
        if (targetDistance >= distances[distances.length - 1]) {
            return distanceData[distances[distances.length - 1]];
        }
        
        // 線形補間
        for (let i = 0; i < distances.length - 1; i++) {
            const d1 = distances[i];
            const d2 = distances[i + 1];
            
            if (targetDistance >= d1 && targetDistance <= d2) {
                const ratio = (targetDistance - d1) / (d2 - d1);
                return Math.round(distanceData[d1] + (distanceData[d2] - distanceData[d1]) * ratio);
            }
        }
        
        return 50; // デフォルト値
    }
    
    // グレードを数値に変換
    static gradeToNumber(grade) {
        switch (grade) {
            case 'S': return 90;
            case 'A': return 75;
            case 'B': return 60;
            case 'C': return 45;
            case 'D': return 30;
            default: return 50;
        }
    }
    
    // レースレベルによる配合評価調整
    static adjustByRaceLevel(baseScore, raceLevel) {
        if (!raceLevel) return baseScore;
        
        switch (raceLevel) {
            case 'G1':
                // G1では高級血統が集まるため配合評価が上がりやすい
                return Math.min(95, baseScore + 15);
            case 'G2':
                return Math.min(90, baseScore + 10);
            case 'G3':
                return Math.min(85, baseScore + 5);
            case '重賞（オープン）':
                return baseScore;
            case '3勝':
                return Math.max(30, baseScore - 5);
            case '2勝':
                return Math.max(25, baseScore - 10);
            case '1勝':
                return Math.max(20, baseScore - 15);
            case '未勝利':
            case '新馬':
                return Math.max(15, baseScore - 20);
            default:
                return baseScore;
        }
    }
    
    // 基本分析テキストを取得
    static getBaseAnalysis(sire, damSire) {
        if (sire && damSire) {
            return `${sire.grade}級父×${damSire.grade || 'C'}級母父の配合`;
        } else if (sire) {
            return `${sire.grade}級父の血統`;
        } else if (damSire) {
            return `母父${damSire.grade || 'C'}級の血統`;
        } else {
            return '血統データ不明';
        }
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