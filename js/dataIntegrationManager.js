/**
 * Phase 7: データ統合・蓄積システム
 * Phase 6（Kelly推奨）とPhase 7（実績分析）の完全データ連携基盤
 */

class DataIntegrationManager {
    constructor() {
        this.integrationSettings = {
            // Phase 6データソース
            kellyDataKey: 'kellyPortfolioResults',
            candidatesKey: 'candidates',
            raceDataKey: 'currentRaceData',
            
            // Phase 7データソース
            performanceHistoryKey: 'performanceHistory',
            candidateHistoryKey: 'candidateHistory',
            portfolioHistoryKey: 'portfolioHistory',
            resultHistoryKey: 'resultHistory',
            
            // 統合設定
            maxHistorySize: 500,
            dataVersionKey: 'dataVersion',
            lastIntegrationKey: 'lastIntegration'
        };
        
        // データ整合性チェック設定
        this.integrityRules = {
            requiredFields: {
                performance: ['raceId', 'investment', 'return', 'roi', 'result'],
                candidate: ['candidateId', 'raceId', 'invested', 'returned', 'result'],
                portfolio: ['raceId', 'totalInvestment', 'totalPayout', 'roi']
            },
            
            validationRules: {
                roiRange: { min: -100, max: 1000 },
                investmentRange: { min: 0, max: 1000000 },
                payoutRange: { min: 0, max: 10000000 }
            }
        };
        
        // 変換マッピング
        this.conversionMappings = {
            kellyToAnalysis: {
                'allocation': 'investment',
                'expectedReturn': 'expectedValue',
                'kellyRatio': 'kellyRatio',
                'riskMultiplier': 'riskLevel'
            },
            
            resultToAnalysis: {
                'actualInvestments': 'investments',
                'actualPayouts': 'payouts',
                'netProfit': 'profit',
                'totalInvestment': 'amount'
            }
        };
        
        console.log('🔄 データ統合管理システム初期化完了');
    }

    /**
     * Phase 6-7データの完全統合
     */
    async integratePhase6And7Data() {
        console.log('🔄 Phase 6-7データ統合開始');
        
        try {
            // 1. 既存データの読み込み
            const existingData = this.loadExistingData();
            
            // 2. Phase 6データの取得と変換
            const kellyData = this.getKellyData();
            const convertedKellyData = this.convertKellyToAnalysisFormat(kellyData);
            
            // 3. Phase 7データの取得と検証
            const resultData = this.getResultData();
            const validatedResultData = this.validateResultData(resultData);
            
            // 4. データの統合
            const integratedData = this.mergeAllData(existingData, convertedKellyData, validatedResultData);
            
            // 5. 分析データ構造の構築
            const analysisDataStructures = this.buildAnalysisDataStructures(integratedData);
            
            // 6. データ整合性の検証
            const integrityResult = this.validateDataIntegrity(analysisDataStructures);
            
            if (!integrityResult.isValid) {
                console.warn('⚠️ データ整合性に問題があります:', integrityResult.issues);
                this.handleIntegrityIssues(integrityResult.issues);
            }
            
            // 7. 統合データの保存
            this.saveIntegratedData(analysisDataStructures);
            
            // 8. インサイト生成のトリガー
            this.triggerInsightGeneration();
            
            // 9. 統合メタデータの更新
            this.updateIntegrationMetadata();
            
            console.log('✅ Phase 6-7データ統合完了');
            
            return {
                success: true,
                integratedData: analysisDataStructures,
                statistics: this.generateIntegrationStatistics(analysisDataStructures)
            };
            
        } catch (error) {
            console.error('❌ データ統合エラー:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 既存データの読み込み
     */
    loadExistingData() {
        return {
            performanceHistory: this.loadData(this.integrationSettings.performanceHistoryKey),
            candidateHistory: this.loadData(this.integrationSettings.candidateHistoryKey),
            portfolioHistory: this.loadData(this.integrationSettings.portfolioHistoryKey),
            resultHistory: this.loadData(this.integrationSettings.resultHistoryKey)
        };
    }

    /**
     * Kelly データの取得
     */
    getKellyData() {
        const kellyData = this.loadData(this.integrationSettings.kellyDataKey);
        const candidatesData = this.loadData(this.integrationSettings.candidatesKey);
        
        return {
            kellyResults: kellyData,
            candidates: candidatesData,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 結果データの取得
     */
    getResultData() {
        return this.loadData(this.integrationSettings.resultHistoryKey);
    }

    /**
     * Kelly結果を分析形式に変換
     */
    convertKellyToAnalysisFormat(kellyData) {
        if (!kellyData || !kellyData.kellyResults) {
            console.warn('⚠️ Kelly データが見つかりません');
            return [];
        }
        
        const kellyResults = kellyData.kellyResults;
        const convertedData = [];
        
        // Kelly推奨データを分析形式に変換
        if (kellyResults.candidates && Array.isArray(kellyResults.candidates)) {
            kellyResults.candidates.forEach(candidate => {
                const convertedRecord = {
                    raceId: kellyResults.raceId || this.generateRaceId(),
                    raceDate: kellyResults.raceDate || new Date().toISOString().split('T')[0],
                    raceName: kellyResults.raceName || '推奨レース',
                    
                    // Kelly推奨データ
                    candidateId: candidate.id || candidate.name,
                    candidateName: candidate.name || `候補${candidate.id}`,
                    kellyRatio: candidate.kellyRatio || 0,
                    expectedValue: candidate.expectedValue || 0,
                    recommendedAmount: candidate.allocation || 0,
                    odds: candidate.odds || 0,
                    popularity: candidate.popularity || 0,
                    
                    // 分析用フィールド
                    investment: candidate.allocation || 0,
                    amount: candidate.allocation || 0,
                    expectedReturn: (candidate.allocation || 0) * (candidate.expectedValue || 0),
                    
                    // メタデータ
                    dataSource: 'kelly_recommendation',
                    dataType: 'prediction',
                    timestamp: kellyData.timestamp,
                    
                    // 変換情報
                    originalData: candidate,
                    conversionVersion: '1.0'
                };
                
                convertedData.push(convertedRecord);
            });
        }
        
        console.log(`🔄 Kelly データ変換完了: ${convertedData.length}件`);
        return convertedData;
    }

    /**
     * 結果データの検証
     */
    validateResultData(resultData) {
        if (!resultData || !Array.isArray(resultData)) {
            console.warn('⚠️ 結果データが無効です');
            return [];
        }
        
        const validatedData = [];
        
        resultData.forEach(record => {
            const validationResult = this.validateRecord(record);
            
            if (validationResult.isValid) {
                validatedData.push(record);
            } else {
                console.warn('⚠️ 無効なレコードを除外:', validationResult.issues);
            }
        });
        
        console.log(`✅ 結果データ検証完了: ${validatedData.length}/${resultData.length}件が有効`);
        return validatedData;
    }

    /**
     * レコードの検証
     */
    validateRecord(record) {
        const issues = [];
        
        // 必須フィールドのチェック
        if (!record.raceId) issues.push('raceId が必要です');
        if (!record.totalInvestment && record.totalInvestment !== 0) issues.push('totalInvestment が必要です');
        if (!record.totalPayout && record.totalPayout !== 0) issues.push('totalPayout が必要です');
        
        // 数値範囲のチェック
        if (record.roi < this.integrityRules.validationRules.roiRange.min || 
            record.roi > this.integrityRules.validationRules.roiRange.max) {
            issues.push('ROI が範囲外です');
        }
        
        if (record.totalInvestment < this.integrityRules.validationRules.investmentRange.min || 
            record.totalInvestment > this.integrityRules.validationRules.investmentRange.max) {
            issues.push('投資額が範囲外です');
        }
        
        if (record.totalPayout < this.integrityRules.validationRules.payoutRange.min || 
            record.totalPayout > this.integrityRules.validationRules.payoutRange.max) {
            issues.push('配当額が範囲外です');
        }
        
        return {
            isValid: issues.length === 0,
            issues: issues
        };
    }

    /**
     * 全データの統合
     */
    mergeAllData(existingData, convertedKellyData, validatedResultData) {
        const mergedData = {
            performanceHistory: [...(existingData.performanceHistory || [])],
            candidateHistory: [...(existingData.candidateHistory || [])],
            portfolioHistory: [...(existingData.portfolioHistory || [])],
            resultHistory: [...(existingData.resultHistory || [])]
        };
        
        // 結果データの追加
        if (validatedResultData && validatedResultData.length > 0) {
            validatedResultData.forEach(record => {
                // パフォーマンス履歴への追加
                const performanceRecord = this.convertToPerformanceRecord(record);
                mergedData.performanceHistory.push(performanceRecord);
                
                // 候補履歴への追加
                if (record.candidates && Array.isArray(record.candidates)) {
                    record.candidates.forEach(candidate => {
                        const candidateRecord = this.convertToCandidateRecord(candidate, record);
                        mergedData.candidateHistory.push(candidateRecord);
                    });
                }
                
                // ポートフォリオ履歴への追加
                const portfolioRecord = this.convertToPortfolioRecord(record);
                mergedData.portfolioHistory.push(portfolioRecord);
                
                // 結果履歴への追加
                mergedData.resultHistory.push(record);
            });
        }
        
        // Kelly推奨データの追加（参考データとして）
        if (convertedKellyData && convertedKellyData.length > 0) {
            convertedKellyData.forEach(kellyRecord => {
                const referenceRecord = this.convertToReferenceRecord(kellyRecord);
                mergedData.performanceHistory.push(referenceRecord);
            });
        }
        
        return mergedData;
    }

    /**
     * 分析データ構造の構築
     */
    buildAnalysisDataStructures(integratedData) {
        const analysisStructures = {
            performanceHistory: this.buildPerformanceHistory(integratedData.performanceHistory),
            candidateHistory: this.buildCandidateHistory(integratedData.candidateHistory),
            portfolioHistory: this.buildPortfolioHistory(integratedData.portfolioHistory),
            
            // 追加の分析構造
            summaryStatistics: this.buildSummaryStatistics(integratedData),
            trendAnalysis: this.buildTrendAnalysis(integratedData),
            correlationMatrix: this.buildCorrelationMatrix(integratedData)
        };
        
        return analysisStructures;
    }

    /**
     * パフォーマンス履歴の構築
     */
    buildPerformanceHistory(performanceData) {
        if (!performanceData || !Array.isArray(performanceData)) {
            return [];
        }
        
        // 重複除去
        const uniqueData = this.removeDuplicates(performanceData, 'raceId');
        
        // 時系列順にソート
        const sortedData = uniqueData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // サイズ制限
        const limitedData = this.limitDataSize(sortedData, this.integrationSettings.maxHistorySize);
        
        // 標準化
        const standardizedData = limitedData.map(record => this.standardizePerformanceRecord(record));
        
        return standardizedData;
    }

    /**
     * 候補履歴の構築
     */
    buildCandidateHistory(candidateData) {
        if (!candidateData || !Array.isArray(candidateData)) {
            return [];
        }
        
        // 候補IDとレースIDの組み合わせで重複除去
        const uniqueData = this.removeDuplicates(candidateData, record => `${record.candidateId}_${record.raceId}`);
        
        // 時系列順にソート
        const sortedData = uniqueData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // サイズ制限
        const limitedData = this.limitDataSize(sortedData, this.integrationSettings.maxHistorySize * 2);
        
        // 標準化
        const standardizedData = limitedData.map(record => this.standardizeCandidateRecord(record));
        
        return standardizedData;
    }

    /**
     * ポートフォリオ履歴の構築
     */
    buildPortfolioHistory(portfolioData) {
        if (!portfolioData || !Array.isArray(portfolioData)) {
            return [];
        }
        
        // 重複除去
        const uniqueData = this.removeDuplicates(portfolioData, 'raceId');
        
        // 時系列順にソート
        const sortedData = uniqueData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // サイズ制限
        const limitedData = this.limitDataSize(sortedData, this.integrationSettings.maxHistorySize);
        
        // 標準化
        const standardizedData = limitedData.map(record => this.standardizePortfolioRecord(record));
        
        return standardizedData;
    }

    /**
     * データ整合性の検証
     */
    validateDataIntegrity(analysisDataStructures) {
        const issues = [];
        
        // 1. 必須フィールドのチェック
        const performanceIssues = this.checkRequiredFields(
            analysisDataStructures.performanceHistory,
            this.integrityRules.requiredFields.performance
        );
        issues.push(...performanceIssues);
        
        const candidateIssues = this.checkRequiredFields(
            analysisDataStructures.candidateHistory,
            this.integrityRules.requiredFields.candidate
        );
        issues.push(...candidateIssues);
        
        const portfolioIssues = this.checkRequiredFields(
            analysisDataStructures.portfolioHistory,
            this.integrityRules.requiredFields.portfolio
        );
        issues.push(...portfolioIssues);
        
        // 2. データ一貫性のチェック
        const consistencyIssues = this.checkDataConsistency(analysisDataStructures);
        issues.push(...consistencyIssues);
        
        // 3. 参照整合性のチェック
        const referenceIssues = this.checkReferenceIntegrity(analysisDataStructures);
        issues.push(...referenceIssues);
        
        return {
            isValid: issues.length === 0,
            issues: issues
        };
    }

    /**
     * 統合データの保存
     */
    saveIntegratedData(analysisDataStructures) {
        try {
            // 分析データの保存
            localStorage.setItem(this.integrationSettings.performanceHistoryKey, 
                JSON.stringify(analysisDataStructures.performanceHistory));
            
            localStorage.setItem(this.integrationSettings.candidateHistoryKey, 
                JSON.stringify(analysisDataStructures.candidateHistory));
            
            localStorage.setItem(this.integrationSettings.portfolioHistoryKey, 
                JSON.stringify(analysisDataStructures.portfolioHistory));
            
            // 統計情報の保存
            localStorage.setItem('summaryStatistics', 
                JSON.stringify(analysisDataStructures.summaryStatistics));
            
            localStorage.setItem('trendAnalysis', 
                JSON.stringify(analysisDataStructures.trendAnalysis));
            
            localStorage.setItem('correlationMatrix', 
                JSON.stringify(analysisDataStructures.correlationMatrix));
            
            console.log('💾 統合データ保存完了');
            
        } catch (error) {
            console.error('❌ データ保存エラー:', error);
            throw error;
        }
    }

    /**
     * インサイト生成のトリガー
     */
    triggerInsightGeneration() {
        try {
            // アクショナブルインサイトマネージャーの更新
            if (window.actionableInsightsManager) {
                window.actionableInsightsManager.refreshInsights();
                console.log('🔄 アクショナブルインサイト更新完了');
            }
            
            // 候補評価システムの更新
            if (window.candidateEvaluationVisualizer) {
                window.candidateEvaluationVisualizer.refreshAnalysis();
                console.log('🔄 候補評価システム更新完了');
            }
            
            // パフォーマンスチャートの更新
            if (window.performanceCharts) {
                window.performanceCharts.updateAllCharts();
                console.log('🔄 パフォーマンスチャート更新完了');
            }
            
            // ポートフォリオダッシュボードの更新
            if (window.portfolioDashboard) {
                window.portfolioDashboard.refreshDashboard();
                console.log('🔄 ポートフォリオダッシュボード更新完了');
            }
            
        } catch (error) {
            console.error('❌ インサイト生成エラー:', error);
        }
    }

    /**
     * 各種変換メソッド
     */
    convertToPerformanceRecord(record) {
        return {
            raceId: record.raceId,
            raceDate: record.raceDate,
            raceName: record.raceName,
            investment: record.totalInvestment,
            amount: record.totalInvestment,
            return: record.totalPayout,
            payout: record.totalPayout,
            roi: record.roi,
            result: record.netProfit > 0 ? 'win' : 'loss',
            won: record.netProfit > 0,
            timestamp: record.timestamp
        };
    }

    convertToCandidateRecord(candidate, record) {
        return {
            candidateId: candidate.candidateId,
            candidateName: candidate.candidateName,
            raceId: record.raceId,
            raceDate: record.raceDate,
            raceName: record.raceName,
            invested: candidate.invested,
            returned: candidate.returned,
            profit: candidate.profit,
            roi: candidate.roi,
            result: candidate.result,
            won: candidate.result === 'win',
            odds: candidate.odds,
            popularity: candidate.popularity,
            timestamp: record.timestamp
        };
    }

    convertToPortfolioRecord(record) {
        return {
            raceId: record.raceId,
            raceDate: record.raceDate,
            raceName: record.raceName,
            totalInvestment: record.totalInvestment,
            totalPayout: record.totalPayout,
            netProfit: record.netProfit,
            roi: record.roi,
            candidateCount: record.candidates ? record.candidates.length : 0,
            winCount: record.candidates ? record.candidates.filter(c => c.result === 'win').length : 0,
            timestamp: record.timestamp
        };
    }

    convertToReferenceRecord(kellyRecord) {
        return {
            raceId: kellyRecord.raceId,
            raceDate: kellyRecord.raceDate,
            raceName: kellyRecord.raceName,
            candidateId: kellyRecord.candidateId,
            candidateName: kellyRecord.candidateName,
            investment: kellyRecord.recommendedAmount,
            amount: kellyRecord.recommendedAmount,
            expectedReturn: kellyRecord.expectedReturn,
            kellyRatio: kellyRecord.kellyRatio,
            expectedValue: kellyRecord.expectedValue,
            dataSource: kellyRecord.dataSource,
            dataType: kellyRecord.dataType,
            timestamp: kellyRecord.timestamp
        };
    }

    /**
     * ユーティリティメソッド
     */
    loadData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.warn(`⚠️ データ読み込みエラー (${key}):`, error);
            return null;
        }
    }

    removeDuplicates(array, keySelector) {
        const seen = new Set();
        return array.filter(item => {
            const key = typeof keySelector === 'function' ? keySelector(item) : item[keySelector];
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    limitDataSize(array, maxSize) {
        if (array.length <= maxSize) {
            return array;
        }
        return array.slice(-maxSize);
    }

    standardizePerformanceRecord(record) {
        return {
            raceId: record.raceId || '',
            raceDate: record.raceDate || '',
            raceName: record.raceName || '',
            investment: record.investment || record.amount || 0,
            amount: record.investment || record.amount || 0,
            return: record.return || record.payout || 0,
            payout: record.return || record.payout || 0,
            roi: record.roi || 0,
            result: record.result || (record.won ? 'win' : 'loss'),
            won: record.won || record.result === 'win',
            timestamp: record.timestamp || new Date().toISOString()
        };
    }

    standardizeCandidateRecord(record) {
        return {
            candidateId: record.candidateId || '',
            candidateName: record.candidateName || '',
            raceId: record.raceId || '',
            raceDate: record.raceDate || '',
            raceName: record.raceName || '',
            invested: record.invested || 0,
            returned: record.returned || 0,
            profit: record.profit || 0,
            roi: record.roi || 0,
            result: record.result || (record.won ? 'win' : 'loss'),
            won: record.won || record.result === 'win',
            odds: record.odds || 0,
            popularity: record.popularity || 0,
            timestamp: record.timestamp || new Date().toISOString()
        };
    }

    standardizePortfolioRecord(record) {
        return {
            raceId: record.raceId || '',
            raceDate: record.raceDate || '',
            raceName: record.raceName || '',
            totalInvestment: record.totalInvestment || 0,
            totalPayout: record.totalPayout || 0,
            netProfit: record.netProfit || 0,
            roi: record.roi || 0,
            candidateCount: record.candidateCount || 0,
            winCount: record.winCount || 0,
            timestamp: record.timestamp || new Date().toISOString()
        };
    }

    checkRequiredFields(data, requiredFields) {
        const issues = [];
        
        if (!data || !Array.isArray(data)) {
            issues.push('データが配列ではありません');
            return issues;
        }
        
        data.forEach((record, index) => {
            requiredFields.forEach(field => {
                if (record[field] === undefined || record[field] === null) {
                    issues.push(`レコード ${index}: ${field} が必要です`);
                }
            });
        });
        
        return issues;
    }

    checkDataConsistency(analysisDataStructures) {
        const issues = [];
        
        // パフォーマンスデータの一貫性チェック
        analysisDataStructures.performanceHistory.forEach(record => {
            if (record.investment > 0 && record.return > 0) {
                const calculatedROI = ((record.return - record.investment) / record.investment) * 100;
                if (Math.abs(calculatedROI - record.roi) > 0.1) {
                    issues.push(`ROI計算の不一致: ${record.raceId}`);
                }
            }
        });
        
        return issues;
    }

    checkReferenceIntegrity(analysisDataStructures) {
        const issues = [];
        
        // 候補データの参照整合性チェック
        const raceIds = new Set(analysisDataStructures.performanceHistory.map(r => r.raceId));
        
        analysisDataStructures.candidateHistory.forEach(candidate => {
            if (!raceIds.has(candidate.raceId)) {
                issues.push(`候補データの参照エラー: ${candidate.raceId}`);
            }
        });
        
        return issues;
    }

    handleIntegrityIssues(issues) {
        // 整合性問題の対処
        console.warn('⚠️ データ整合性問題の対処中:', issues);
        
        // 必要に応じて自動修正やアラートを実装
        if (issues.length > 10) {
            console.error('❌ 重大な整合性問題が発生しました');
            // 必要に応じて緊急停止やバックアップからの復旧を実装
        }
    }

    buildSummaryStatistics(integratedData) {
        const performance = integratedData.performanceHistory || [];
        const candidates = integratedData.candidateHistory || [];
        
        return {
            totalRaces: performance.length,
            totalInvestment: performance.reduce((sum, r) => sum + (r.investment || 0), 0),
            totalPayout: performance.reduce((sum, r) => sum + (r.return || 0), 0),
            averageROI: performance.length > 0 ? performance.reduce((sum, r) => sum + (r.roi || 0), 0) / performance.length : 0,
            winRate: performance.length > 0 ? (performance.filter(r => r.won).length / performance.length) * 100 : 0,
            
            candidateStats: {
                totalCandidates: candidates.length,
                winningCandidates: candidates.filter(c => c.won).length,
                averageOdds: candidates.length > 0 ? candidates.reduce((sum, c) => sum + (c.odds || 0), 0) / candidates.length : 0
            },
            
            lastUpdated: new Date().toISOString()
        };
    }

    buildTrendAnalysis(integratedData) {
        const performance = integratedData.performanceHistory || [];
        
        if (performance.length < 2) {
            return { trend: 'insufficient_data' };
        }
        
        const recent = performance.slice(-10);
        const previous = performance.slice(-20, -10);
        
        const recentROI = recent.reduce((sum, r) => sum + (r.roi || 0), 0) / recent.length;
        const previousROI = previous.length > 0 ? previous.reduce((sum, r) => sum + (r.roi || 0), 0) / previous.length : 0;
        
        return {
            trend: recentROI > previousROI ? 'improving' : 'declining',
            recentROI: recentROI,
            previousROI: previousROI,
            change: recentROI - previousROI,
            lastUpdated: new Date().toISOString()
        };
    }

    buildCorrelationMatrix(integratedData) {
        // 簡略化した相関分析
        const candidates = integratedData.candidateHistory || [];
        
        const correlations = {};
        const candidateIds = [...new Set(candidates.map(c => c.candidateId))];
        
        candidateIds.forEach(id => {
            correlations[id] = {
                winRate: candidates.filter(c => c.candidateId === id && c.won).length / candidates.filter(c => c.candidateId === id).length || 0,
                averageROI: candidates.filter(c => c.candidateId === id).reduce((sum, c) => sum + (c.roi || 0), 0) / candidates.filter(c => c.candidateId === id).length || 0
            };
        });
        
        return {
            correlations: correlations,
            lastUpdated: new Date().toISOString()
        };
    }

    generateIntegrationStatistics(analysisDataStructures) {
        return {
            performanceRecords: analysisDataStructures.performanceHistory.length,
            candidateRecords: analysisDataStructures.candidateHistory.length,
            portfolioRecords: analysisDataStructures.portfolioHistory.length,
            integrationTimestamp: new Date().toISOString(),
            dataVersion: '1.0'
        };
    }

    updateIntegrationMetadata() {
        const metadata = {
            lastIntegration: new Date().toISOString(),
            dataVersion: '1.0',
            integrationCount: (this.loadData('integrationCount') || 0) + 1
        };
        
        localStorage.setItem(this.integrationSettings.lastIntegrationKey, JSON.stringify(metadata));
        localStorage.setItem('integrationCount', metadata.integrationCount.toString());
    }

    generateRaceId() {
        return 'race_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 統合統計の取得
     */
    getIntegrationStatistics() {
        const summaryStats = this.loadData('summaryStatistics');
        const trendAnalysis = this.loadData('trendAnalysis');
        const metadata = this.loadData(this.integrationSettings.lastIntegrationKey);
        
        return {
            summary: summaryStats,
            trend: trendAnalysis,
            metadata: metadata,
            lastIntegration: metadata ? metadata.lastIntegration : null
        };
    }

    /**
     * データの手動統合実行
     */
    async manualIntegration() {
        console.log('🔄 手動データ統合開始');
        const result = await this.integratePhase6And7Data();
        
        if (result.success) {
            console.log('✅ 手動データ統合完了');
            return result;
        } else {
            console.error('❌ 手動データ統合失敗:', result.error);
            return result;
        }
    }
}

// グローバル公開
window.DataIntegrationManager = DataIntegrationManager;

// 自動初期化
window.addEventListener('DOMContentLoaded', () => {
    if (!window.dataIntegrationManager) {
        window.dataIntegrationManager = new DataIntegrationManager();
    }
});