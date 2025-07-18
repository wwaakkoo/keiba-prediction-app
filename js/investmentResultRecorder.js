/**
 * Phase 7: 投資結果記録システム
 * 実際の投資結果を記録し、Phase 7分析システムに実データを提供
 */

class InvestmentResultRecorder {
    constructor() {
        this.resultHistory = this.loadHistory();
        this.performanceHistory = this.loadPerformanceHistory();
        this.candidateHistory = this.loadCandidateHistory();
        
        // Phase 6-7連携用の設定
        this.phaseIntegration = {
            kellyDataKey: 'kellyPortfolioResults',
            candidatesKey: 'candidates',
            raceDataKey: 'currentRaceData'
        };
        
        // 分析システムとの連携
        this.analysisIntegration = {
            performanceHistoryKey: 'performanceHistory',
            candidateHistoryKey: 'candidateHistory',
            portfolioHistoryKey: 'portfolioHistory'
        };
        
        console.log('💾 投資結果記録システム初期化完了');
    }

    /**
     * データ読み込み
     */
    loadHistory() {
        const data = localStorage.getItem('resultHistory');
        return data ? JSON.parse(data) : [];
    }

    loadPerformanceHistory() {
        const data = localStorage.getItem(this.analysisIntegration.performanceHistoryKey);
        return data ? JSON.parse(data) : [];
    }

    loadCandidateHistory() {
        const data = localStorage.getItem(this.analysisIntegration.candidateHistoryKey);
        return data ? JSON.parse(data) : [];
    }

    /**
     * レース結果の記録（メイン機能）
     */
    recordRaceResult(raceData) {
        console.log('📊 レース結果記録開始', raceData);
        
        try {
            // 基本データの検証
            if (!this.validateRaceData(raceData)) {
                throw new Error('レースデータの検証に失敗しました');
            }
            
            // Kelly推奨結果の取得
            const kellyResults = this.getKellyRecommendations(raceData.raceId);
            
            // 投資結果レコードの作成
            const record = this.createResultRecord(raceData, kellyResults);
            
            // 履歴への追加
            this.addToHistory(record);
            
            // Phase 7分析システム用データの更新
            this.updateAnalysisData(record);
            
            // 候補別履歴の更新
            this.updateCandidateHistory(record);
            
            // ポートフォリオ履歴の更新
            this.updatePortfolioHistory(record);
            
            // データ保存
            this.saveAllData();
            
            // アクショナブルインサイトの自動更新
            this.triggerInsightRefresh(record);
            
            console.log('✅ レース結果記録完了', record);
            
            return {
                success: true,
                record: record,
                analysis: this.generateRecordAnalysis(record)
            };
            
        } catch (error) {
            console.error('❌ レース結果記録エラー:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 結果レコードの作成
     */
    createResultRecord(raceData, kellyResults) {
        const record = {
            // 基本情報
            raceId: raceData.raceId || this.generateRaceId(),
            raceName: raceData.raceName || '不明レース',
            raceDate: raceData.raceDate || new Date().toISOString().split('T')[0],
            raceCourse: raceData.raceCourse || '不明コース',
            
            // Kelly推奨結果
            kellyRecommendations: kellyResults ? {
                totalAllocation: kellyResults.totalAllocation || 0,
                recommendedCandidates: kellyResults.candidates || [],
                riskMultiplier: kellyResults.riskMultiplier || 1.0,
                expectedReturn: kellyResults.expectedReturn || 0
            } : null,
            
            // 実際の投資結果
            actualInvestments: raceData.actualInvestments || [],
            actualPayouts: raceData.actualPayouts || [],
            
            // 計算結果
            roi: this.calculateROI(raceData),
            totalInvestment: this.calculateTotalInvestment(raceData.actualInvestments),
            totalPayout: this.calculateTotalPayout(raceData.actualPayouts),
            netProfit: this.calculateNetProfit(raceData),
            
            // 候補別結果
            candidates: this.processCandidateResults(raceData),
            
            // パフォーマンス指標
            performance: this.calculatePerformanceMetrics(raceData, kellyResults),
            
            // タイムスタンプ
            timestamp: new Date().toISOString(),
            
            // メタデータ
            metadata: {
                recordVersion: '1.0',
                dataSource: 'manual_input',
                phase: 'phase7_integration'
            }
        };
        
        return record;
    }

    /**
     * データ検証
     */
    validateRaceData(raceData) {
        // 必須フィールドの確認
        const requiredFields = ['raceName', 'actualInvestments', 'actualPayouts'];
        for (const field of requiredFields) {
            if (!raceData[field]) {
                console.warn(`⚠️ 必須フィールド ${field} が不足しています`);
                return false;
            }
        }
        
        // 投資データの検証
        if (!Array.isArray(raceData.actualInvestments) || raceData.actualInvestments.length === 0) {
            console.warn('⚠️ 投資データが無効です');
            return false;
        }
        
        // 配当データの検証
        if (!Array.isArray(raceData.actualPayouts)) {
            console.warn('⚠️ 配当データが無効です');
            return false;
        }
        
        return true;
    }

    /**
     * Kelly推奨結果の取得
     */
    getKellyRecommendations(raceId) {
        const kellyData = localStorage.getItem(this.phaseIntegration.kellyDataKey);
        if (!kellyData) {
            console.warn('⚠️ Kelly推奨データが見つかりません');
            return null;
        }
        
        try {
            const parsedData = JSON.parse(kellyData);
            
            // 最新の結果を取得（raceId指定がある場合はそれを優先）
            if (raceId && parsedData.raceId === raceId) {
                return parsedData;
            }
            
            return parsedData;
        } catch (error) {
            console.error('❌ Kelly推奨データの解析エラー:', error);
            return null;
        }
    }

    /**
     * 各種計算メソッド
     */
    calculateROI(raceData) {
        const totalInvest = this.calculateTotalInvestment(raceData.actualInvestments);
        const totalReturn = this.calculateTotalPayout(raceData.actualPayouts);
        
        if (totalInvest === 0) return 0;
        
        return ((totalReturn - totalInvest) / totalInvest) * 100;
    }

    calculateTotalInvestment(investments) {
        if (!investments || !Array.isArray(investments)) return 0;
        return investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    }

    calculateTotalPayout(payouts) {
        if (!payouts || !Array.isArray(payouts)) return 0;
        return payouts.reduce((sum, payout) => sum + (payout.amount || 0), 0);
    }

    calculateNetProfit(raceData) {
        const totalInvest = this.calculateTotalInvestment(raceData.actualInvestments);
        const totalPayout = this.calculateTotalPayout(raceData.actualPayouts);
        return totalPayout - totalInvest;
    }

    /**
     * 候補別結果の処理
     */
    processCandidateResults(raceData) {
        const candidates = [];
        
        if (raceData.actualInvestments) {
            raceData.actualInvestments.forEach(investment => {
                const payout = raceData.actualPayouts?.find(p => p.candidateId === investment.candidateId) || { amount: 0 };
                const profit = payout.amount - investment.amount;
                
                candidates.push({
                    candidateId: investment.candidateId,
                    candidateName: investment.candidateName || `候補${investment.candidateId}`,
                    ticketType: investment.ticketType || '単勝',
                    invested: investment.amount,
                    returned: payout.amount,
                    profit: profit,
                    roi: investment.amount > 0 ? (profit / investment.amount) * 100 : 0,
                    result: profit > 0 ? 'win' : 'loss',
                    odds: investment.odds || 0,
                    popularity: investment.popularity || 0
                });
            });
        }
        
        return candidates;
    }

    /**
     * パフォーマンス指標の計算
     */
    calculatePerformanceMetrics(raceData, kellyResults) {
        const roi = this.calculateROI(raceData);
        const netProfit = this.calculateNetProfit(raceData);
        const totalInvestment = this.calculateTotalInvestment(raceData.actualInvestments);
        
        const candidates = this.processCandidateResults(raceData);
        const winCount = candidates.filter(c => c.result === 'win').length;
        const winRate = candidates.length > 0 ? (winCount / candidates.length) * 100 : 0;
        
        return {
            roi: roi,
            netProfit: netProfit,
            totalInvestment: totalInvestment,
            winRate: winRate,
            winCount: winCount,
            totalCandidates: candidates.length,
            averageOdds: candidates.length > 0 ? candidates.reduce((sum, c) => sum + c.odds, 0) / candidates.length : 0,
            
            // Kelly推奨との比較
            kellyComparison: kellyResults ? {
                expectedReturn: kellyResults.expectedReturn || 0,
                actualReturn: netProfit,
                deviation: netProfit - (kellyResults.expectedReturn || 0),
                efficiency: kellyResults.expectedReturn ? (netProfit / kellyResults.expectedReturn) * 100 : 0
            } : null
        };
    }

    /**
     * 履歴データの更新
     */
    addToHistory(record) {
        this.resultHistory.push(record);
        
        // 履歴サイズの制限（最新1000件まで）
        if (this.resultHistory.length > 1000) {
            this.resultHistory = this.resultHistory.slice(-1000);
        }
    }

    updateAnalysisData(record) {
        // Phase 7分析システムが期待する形式に変換
        const analysisRecord = this.convertToAnalysisFormat(record);
        
        this.performanceHistory.push(analysisRecord);
        
        // 分析データサイズの制限（最新500件まで）
        if (this.performanceHistory.length > 500) {
            this.performanceHistory = this.performanceHistory.slice(-500);
        }
    }

    updateCandidateHistory(record) {
        record.candidates.forEach(candidate => {
            const candidateRecord = {
                candidateId: candidate.candidateId,
                candidateName: candidate.candidateName,
                raceId: record.raceId,
                raceDate: record.raceDate,
                raceName: record.raceName,
                ticketType: candidate.ticketType,
                invested: candidate.invested,
                returned: candidate.returned,
                profit: candidate.profit,
                roi: candidate.roi,
                result: candidate.result,
                odds: candidate.odds,
                popularity: candidate.popularity,
                timestamp: record.timestamp
            };
            
            this.candidateHistory.push(candidateRecord);
        });
        
        // 候補履歴サイズの制限
        if (this.candidateHistory.length > 2000) {
            this.candidateHistory = this.candidateHistory.slice(-2000);
        }
    }

    updatePortfolioHistory(record) {
        const portfolioRecord = {
            raceId: record.raceId,
            raceDate: record.raceDate,
            raceName: record.raceName,
            kellyRecommendations: record.kellyRecommendations,
            actualResults: {
                totalInvestment: record.totalInvestment,
                totalPayout: record.totalPayout,
                netProfit: record.netProfit,
                roi: record.roi
            },
            performance: record.performance,
            timestamp: record.timestamp
        };
        
        const portfolioHistory = this.getPortfolioHistory();
        portfolioHistory.push(portfolioRecord);
        
        // サイズ制限
        if (portfolioHistory.length > 500) {
            portfolioHistory.splice(0, portfolioHistory.length - 500);
        }
        
        localStorage.setItem(this.analysisIntegration.portfolioHistoryKey, JSON.stringify(portfolioHistory));
    }

    getPortfolioHistory() {
        const data = localStorage.getItem(this.analysisIntegration.portfolioHistoryKey);
        return data ? JSON.parse(data) : [];
    }

    /**
     * 分析データ形式への変換
     */
    convertToAnalysisFormat(record) {
        return {
            raceId: record.raceId,
            raceDate: record.raceDate,
            raceName: record.raceName,
            
            // Phase 7分析システムが期待する形式
            investment: record.totalInvestment,
            amount: record.totalInvestment,
            return: record.totalPayout,
            payout: record.totalPayout,
            roi: record.roi,
            result: record.netProfit > 0 ? 'win' : 'loss',
            won: record.netProfit > 0,
            
            // 詳細情報
            candidates: record.candidates.map(c => ({
                id: c.candidateId,
                name: c.candidateName,
                invested: c.invested,
                returned: c.returned,
                profit: c.profit,
                roi: c.roi,
                result: c.result,
                won: c.result === 'win',
                odds: c.odds,
                popularity: c.popularity
            })),
            
            // パフォーマンス指標
            performance: record.performance,
            
            // Kelly比較
            kellyComparison: record.performance.kellyComparison,
            
            // タイムスタンプ
            timestamp: record.timestamp
        };
    }

    /**
     * データ保存
     */
    saveAllData() {
        try {
            // 基本履歴の保存
            localStorage.setItem('resultHistory', JSON.stringify(this.resultHistory));
            
            // 分析システム用データの保存
            localStorage.setItem(this.analysisIntegration.performanceHistoryKey, JSON.stringify(this.performanceHistory));
            localStorage.setItem(this.analysisIntegration.candidateHistoryKey, JSON.stringify(this.candidateHistory));
            
            console.log('💾 データ保存完了');
        } catch (error) {
            console.error('❌ データ保存エラー:', error);
        }
    }

    /**
     * アクショナブルインサイトの更新
     */
    triggerInsightRefresh(newRecord) {
        try {
            // アクショナブルインサイトマネージャーの更新
            if (window.actionableInsightsManager) {
                window.actionableInsightsManager.refreshInsights();
                console.log('🔄 アクショナブルインサイト更新完了');
            }
            
            // 候補評価システムの更新
            if (window.candidateEvaluationVisualizer) {
                window.candidateEvaluationVisualizer.refreshWithNewData(newRecord);
                console.log('🔄 候補評価システム更新完了');
            }
            
            // パフォーマンスチャートの更新
            if (window.performanceCharts) {
                window.performanceCharts.updateChartsWithNewData(newRecord);
                console.log('🔄 パフォーマンスチャート更新完了');
            }
            
        } catch (error) {
            console.error('❌ インサイト更新エラー:', error);
        }
    }

    /**
     * レコード分析の生成
     */
    generateRecordAnalysis(record) {
        const analysis = {
            summary: {
                totalInvestment: record.totalInvestment,
                totalPayout: record.totalPayout,
                netProfit: record.netProfit,
                roi: record.roi,
                winRate: record.performance.winRate
            },
            
            kellyComparison: record.performance.kellyComparison,
            
            recommendations: this.generateRecommendations(record),
            
            nextSteps: this.generateNextSteps(record)
        };
        
        return analysis;
    }

    /**
     * 推奨事項の生成
     */
    generateRecommendations(record) {
        const recommendations = [];
        
        if (record.roi < 0) {
            recommendations.push('損失が発生しました。リスク管理の見直しを検討してください。');
        }
        
        if (record.performance.kellyComparison && record.performance.kellyComparison.efficiency < 80) {
            recommendations.push('Kelly推奨と実績に乖離があります。投資戦略の調整を検討してください。');
        }
        
        if (record.performance.winRate < 50) {
            recommendations.push('勝率が低下しています。候補選択基準の見直しを推奨します。');
        }
        
        return recommendations;
    }

    /**
     * 次のステップの生成
     */
    generateNextSteps(record) {
        return [
            'アクショナブルインサイトで詳細分析を確認',
            'パフォーマンスチャートで成績トレンドを確認',
            '必要に応じて投資戦略を調整'
        ];
    }

    /**
     * ユーティリティメソッド
     */
    generateRaceId() {
        return 'race_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 統計情報の取得
     */
    getStatistics() {
        return {
            totalRaces: this.resultHistory.length,
            totalInvestment: this.resultHistory.reduce((sum, r) => sum + r.totalInvestment, 0),
            totalPayout: this.resultHistory.reduce((sum, r) => sum + r.totalPayout, 0),
            totalProfit: this.resultHistory.reduce((sum, r) => sum + r.netProfit, 0),
            averageROI: this.resultHistory.length > 0 ? 
                this.resultHistory.reduce((sum, r) => sum + r.roi, 0) / this.resultHistory.length : 0,
            winRate: this.resultHistory.length > 0 ? 
                (this.resultHistory.filter(r => r.netProfit > 0).length / this.resultHistory.length) * 100 : 0,
            
            // バックアップ情報も含める
            backupInfo: this.getBackupInfo()
        };
    }
    
    /**
     * バックアップ情報の取得
     */
    getBackupInfo() {
        try {
            const backups = JSON.parse(localStorage.getItem('dataBackups') || '[]');
            return {
                backupCount: backups.length,
                latestBackup: backups.length > 0 ? backups[backups.length - 1].timestamp : null,
                totalBackupSize: backups.reduce((sum, backup) => {
                    return sum + 
                        backup.deletedData.resultHistory.length +
                        backup.deletedData.performanceHistory.length +
                        backup.deletedData.candidateHistory.length;
                }, 0)
            };
        } catch (error) {
            console.error('❌ バックアップ情報取得エラー:', error);
            return {
                backupCount: 0,
                latestBackup: null,
                totalBackupSize: 0,
                error: error.message
            };
        }
    }

    /**
     * データのクリアアップ（安全な削除機能付き）
     */
    clearOldData(daysToKeep = 30, skipConfirmation = false) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        
        // 削除対象データの件数を事前計算
        const targetResultCount = this.resultHistory.filter(record => 
            new Date(record.timestamp) <= cutoffDate
        ).length;
        
        const targetPerformanceCount = this.performanceHistory.filter(record => 
            new Date(record.timestamp) <= cutoffDate
        ).length;
        
        const targetCandidateCount = this.candidateHistory.filter(record => 
            new Date(record.timestamp) <= cutoffDate
        ).length;
        
        // 削除対象がない場合は終了
        if (targetResultCount === 0 && targetPerformanceCount === 0 && targetCandidateCount === 0) {
            console.log('🗑️ 削除対象のデータはありません');
            return { deleted: false, reason: 'no_target_data' };
        }
        
        // ユーザー確認（skipConfirmationがfalseの場合）
        if (!skipConfirmation) {
            const confirmMessage = `⚠️ データ削除の確認\n\n` +
                `${daysToKeep}日より古いデータを削除します：\n` +
                `・レース履歴: ${targetResultCount}件\n` +
                `・パフォーマンス履歴: ${targetPerformanceCount}件\n` +
                `・候補履歴: ${targetCandidateCount}件\n\n` +
                `この操作は取り消せません。削除しますか？`;
            
            if (!confirm(confirmMessage)) {
                console.log('🗑️ ユーザーによりデータ削除がキャンセルされました');
                return { deleted: false, reason: 'user_cancelled' };
            }
        }
        
        // バックアップ作成
        const backup = {
            timestamp: new Date().toISOString(),
            daysToKeep: daysToKeep,
            deletedData: {
                resultHistory: this.resultHistory.filter(record => 
                    new Date(record.timestamp) <= cutoffDate
                ),
                performanceHistory: this.performanceHistory.filter(record => 
                    new Date(record.timestamp) <= cutoffDate
                ),
                candidateHistory: this.candidateHistory.filter(record => 
                    new Date(record.timestamp) <= cutoffDate
                )
            }
        };
        
        // バックアップ保存
        try {
            const existingBackups = JSON.parse(localStorage.getItem('dataBackups') || '[]');
            existingBackups.push(backup);
            // 最新5個のバックアップのみ保持
            if (existingBackups.length > 5) {
                existingBackups.splice(0, existingBackups.length - 5);
            }
            localStorage.setItem('dataBackups', JSON.stringify(existingBackups));
        } catch (error) {
            console.error('❌ バックアップ作成エラー:', error);
        }
        
        // データ削除実行
        this.resultHistory = this.resultHistory.filter(record => 
            new Date(record.timestamp) > cutoffDate
        );
        
        this.performanceHistory = this.performanceHistory.filter(record => 
            new Date(record.timestamp) > cutoffDate
        );
        
        this.candidateHistory = this.candidateHistory.filter(record => 
            new Date(record.timestamp) > cutoffDate
        );
        
        this.saveAllData();
        
        const result = {
            deleted: true,
            deletedCounts: {
                resultHistory: targetResultCount,
                performanceHistory: targetPerformanceCount,
                candidateHistory: targetCandidateCount
            },
            backupCreated: true
        };
        
        console.log(`🗑️ ${daysToKeep}日より古いデータをクリアしました:`, result.deletedCounts);
        
        // ユーザー向けの成功通知
        this.showDataDeletionNotification(result.deletedCounts);
        
        return result;
    }
    
    /**
     * データエクスポート機能
     */
    exportData(format = 'json', dataType = 'all') {
        try {
            let exportData = {};
            
            // エクスポートするデータの選択
            switch (dataType) {
                case 'results':
                    exportData = { resultHistory: this.resultHistory };
                    break;
                case 'performance':
                    exportData = { performanceHistory: this.performanceHistory };
                    break;
                case 'candidates':
                    exportData = { candidateHistory: this.candidateHistory };
                    break;
                case 'all':
                default:
                    exportData = {
                        resultHistory: this.resultHistory,
                        performanceHistory: this.performanceHistory,
                        candidateHistory: this.candidateHistory,
                        statistics: this.getStatistics(),
                        exportInfo: {
                            exportDate: new Date().toISOString(),
                            dataVersion: '1.0',
                            totalRecords: this.resultHistory.length
                        }
                    };
                    break;
            }
            
            // フォーマット別の処理
            if (format === 'csv') {
                return this.exportToCSV(exportData, dataType);
            } else {
                return this.exportToJSON(exportData, dataType);
            }
            
        } catch (error) {
            console.error('❌ データエクスポートエラー:', error);
            alert('データのエクスポートに失敗しました。');
            return false;
        }
    }
    
    /**
     * JSON形式でエクスポート
     */
    exportToJSON(data, dataType) {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
        
        const filename = `keiba_investment_${dataType}_${new Date().toISOString().split('T')[0]}.json`;
        this.downloadFile(blob, filename);
        
        return true;
    }
    
    /**
     * CSV形式でエクスポート
     */
    exportToCSV(data, dataType) {
        let csvContent = '';
        
        if (dataType === 'results' || dataType === 'all') {
            csvContent += this.convertResultsToCSV(data.resultHistory || []);
        }
        
        if (dataType === 'candidates' || dataType === 'all') {
            if (csvContent) csvContent += '\n\n';
            csvContent += this.convertCandidatesToCSV(data.candidateHistory || []);
        }
        
        if (dataType === 'performance' || dataType === 'all') {
            if (csvContent) csvContent += '\n\n';
            csvContent += this.convertPerformanceToCSV(data.performanceHistory || []);
        }
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const filename = `keiba_investment_${dataType}_${new Date().toISOString().split('T')[0]}.csv`;
        this.downloadFile(blob, filename);
        
        return true;
    }
    
    /**
     * レース結果をCSV形式に変換
     */
    convertResultsToCSV(results) {
        if (!results || results.length === 0) {
            return 'レース結果データはありません';
        }
        
        const headers = [
            'レースID', 'レース名', 'レース日', 'コース',
            '総投資額', '総配当', '純利益', 'ROI(%)',
            '勝率(%)', '候補数', '的中数', 'タイムスタンプ'
        ];
        
        let csv = headers.join(',') + '\n';
        
        results.forEach(result => {
            const row = [
                result.raceId || '',
                `"${result.raceName || ''}",
                result.raceDate || '',
                result.raceCourse || '',
                result.totalInvestment || 0,
                result.totalPayout || 0,
                result.netProfit || 0,
                (result.roi || 0).toFixed(2),
                (result.performance?.winRate || 0).toFixed(2),
                result.candidates?.length || 0,
                result.performance?.winCount || 0,
                result.timestamp || ''
            ];
            csv += row.join(',') + '\n';
        });
        
        return csv;
    }
    
    /**
     * 候補結果をCSV形式に変換
     */
    convertCandidatesToCSV(candidates) {
        if (!candidates || candidates.length === 0) {
            return '候補結果データはありません';
        }
        
        const headers = [
            '候補ID', '候補名', 'レースID', 'レース日',
            '投資額', '配当額', '利益', 'ROI(%)',
            '結果', 'オッズ', '人気', 'タイムスタンプ'
        ];
        
        let csv = '候補別結果\n' + headers.join(',') + '\n';
        
        candidates.forEach(candidate => {
            const row = [
                candidate.candidateId || '',
                `"${candidate.candidateName || ''}",
                candidate.raceId || '',
                candidate.raceDate || '',
                candidate.invested || 0,
                candidate.returned || 0,
                candidate.profit || 0,
                (candidate.roi || 0).toFixed(2),
                candidate.result || '',
                candidate.odds || 0,
                candidate.popularity || 0,
                candidate.timestamp || ''
            ];
            csv += row.join(',') + '\n';
        });
        
        return csv;
    }
    
    /**
     * パフォーマンス結果をCSV形式に変換
     */
    convertPerformanceToCSV(performance) {
        if (!performance || performance.length === 0) {
            return 'パフォーマンスデータはありません';
        }
        
        const headers = [
            'レースID', 'レース日', 'レース名',
            '投資額', 'リターン', 'ROI(%)', '結果', 'タイムスタンプ'
        ];
        
        let csv = 'パフォーマンス結果\n' + headers.join(',') + '\n';
        
        performance.forEach(perf => {
            const row = [
                perf.raceId || '',
                perf.raceDate || '',
                `"${perf.raceName || ''}",
                perf.investment || perf.amount || 0,
                perf.return || perf.payout || 0,
                (perf.roi || 0).toFixed(2),
                perf.result || '',
                perf.timestamp || ''
            ];
            csv += row.join(',') + '\n';
        });
        
        return csv;
    }
    
    /**
     * ファイルダウンロード
     */
    downloadFile(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // URLをクリーンアップ
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
        }, 100);
        
        console.log(`📁 ファイルエクスポート完了: ${filename}`);
    }
    
    /**
     * データ削除通知の表示
     */
    showDataDeletionNotification(deletedCounts) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #ff9800, #f57c00);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-weight: bold;
            animation: slideIn 0.3s ease-out;
        `;
        
        const totalDeleted = Object.values(deletedCounts).reduce((sum, count) => sum + count, 0);
        
        notification.innerHTML = `
            <div>🗑️ データ削除完了</div>
            <div style="font-size: 0.9em; margin-top: 5px;">
                ${totalDeleted}件のデータを削除しました
            </div>
            <div style="font-size: 0.8em; margin-top: 5px; opacity: 0.9;">
                バックアップを作成済み
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 7秒後に自動削除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 7000);
    }
    
    /**
     * データ復元機能
     */
    restoreFromBackup(backupIndex = 0) {
        try {
            const backups = JSON.parse(localStorage.getItem('dataBackups') || '[]');
            
            if (backups.length === 0) {
                alert('復元可能なバックアップがありません');
                return false;
            }
            
            if (backupIndex >= backups.length) {
                alert('指定されたバックアップが見つかりません');
                return false;
            }
            
            const backup = backups[backups.length - 1 - backupIndex]; // 最新から数える
            
            const confirmMessage = `データを復元しますか？\n\n` +
                `復元対象: ${backup.timestamp}\n` +
                `レース履歴: ${backup.deletedData.resultHistory.length}件\n` +
                `パフォーマンス履歴: ${backup.deletedData.performanceHistory.length}件\n` +
                `候補履歴: ${backup.deletedData.candidateHistory.length}件`;
            
            if (!confirm(confirmMessage)) {
                return false;
            }
            
            // データ復元
            this.resultHistory.push(...backup.deletedData.resultHistory);
            this.performanceHistory.push(...backup.deletedData.performanceHistory);
            this.candidateHistory.push(...backup.deletedData.candidateHistory);
            
            this.saveAllData();
            
            alert('✅ データの復元が完了しました');
            return true;
            
        } catch (error) {
            console.error('❌ データ復元エラー:', error);
            alert('❌ データ復元に失敗しました');
            return false;
        }
    }
    
    /**
     * エクスポートメニューの表示
     */
    showExportMenu() {
        const exportMenu = document.createElement('div');
        exportMenu.id = 'export-menu';
        exportMenu.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.2);
            z-index: 15000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            min-width: 400px;
        `;
        
        exportMenu.innerHTML = `
            <h3 style="color: #333; margin-bottom: 20px; text-align: center;">
                📁 データエクスポート
            </h3>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 10px; font-weight: bold; color: #555;">
                    エクスポートデータ:
                </label>
                <select id="exportDataType" style="
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    margin-bottom: 15px;
                ">
                    <option value="all">すべてのデータ</option>
                    <option value="results">レース結果のみ</option>
                    <option value="candidates">候補結果のみ</option>
                    <option value="performance">パフォーマンスデータのみ</option>
                </select>
                
                <label style="display: block; margin-bottom: 10px; font-weight: bold; color: #555;">
                    ファイル形式:
                </label>
                <select id="exportFormat" style="
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                ">
                    <option value="json">JSON (データベース用)</option>
                    <option value="csv">CSV (Excel用)</option>
                </select>
            </div>
            
            <div style="text-align: center;">
                <button onclick="investmentResultRecorder.executeExport()" style="
                    background: linear-gradient(45deg, #2196F3, #1976D2);
                    color: white;
                    border: none;
                    padding: 12px 25px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                    margin-right: 15px;
                ">📁 エクスポート</button>
                
                <button onclick="investmentResultRecorder.closeExportMenu()" style="
                    background: #ddd;
                    color: #666;
                    border: none;
                    padding: 12px 25px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 16px;
                ">キャンセル</button>
            </div>
            
            <div style="margin-top: 15px; padding: 10px; background: #f0f8ff; border-radius: 5px; font-size: 14px; color: #666;">
                <strong>💡 ヒント:</strong> CSVはExcelで開け、JSONは他のシステムへのデータ移行に便利です。
            </div>
        `;
        
        // 背景オーバーレイ
        const overlay = document.createElement('div');
        overlay.id = 'export-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 14000;
        `;
        overlay.onclick = () => this.closeExportMenu();
        
        document.body.appendChild(overlay);
        document.body.appendChild(exportMenu);
    }
    
    /**
     * エクスポート実行
     */
    executeExport() {
        const dataType = document.getElementById('exportDataType').value;
        const format = document.getElementById('exportFormat').value;
        
        const success = this.exportData(format, dataType);
        
        if (success) {
            this.closeExportMenu();
            
            // 成功通知
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(45deg, #4CAF50, #45a049);
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                z-index: 10000;
                font-weight: bold;
            `;
            notification.textContent = '📁 データエクスポート完了';
            
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        }
    }
    
    /**
     * エクスポートメニューを閉じる
     */
    closeExportMenu() {
        const menu = document.getElementById('export-menu');
        const overlay = document.getElementById('export-overlay');
        
        if (menu) menu.remove();
        if (overlay) overlay.remove();
    }
}

// グローバル公開
window.InvestmentResultRecorder = InvestmentResultRecorder;

// 自動初期化
window.addEventListener('DOMContentLoaded', () => {
    if (!window.investmentResultRecorder) {
        window.investmentResultRecorder = new InvestmentResultRecorder();
    }
});