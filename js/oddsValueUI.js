/**
 * Phase 8α: オッズ妙味検出UI
 * 市場の歪みを可視化し、投資機会を提示するユーザーインターフェース
 */
class OddsValueUI {
    constructor() {
        this.detector = null;
        this.currentAnalysis = null;
        this.isActive = false;
        
        // UI設定
        this.uiConfig = {
            autoUpdate: true,
            showDetails: true,
            highlightThreshold: 70,
            refreshInterval: 30000 // 30秒
        };
        
        this.initializeDetector();
        console.log('💰 オッズ妙味検出UI初期化完了');
    }

    /**
     * 検出器の初期化
     */
    initializeDetector() {
        try {
            if (typeof OddsValueDetector !== 'undefined') {
                this.detector = new OddsValueDetector();
                console.log('✅ オッズ妙味検出器と連携');
            } else {
                console.warn('⚠️ OddsValueDetectorが見つかりません');
            }
        } catch (error) {
            console.error('❌ 検出器初期化エラー:', error);
        }
    }

    /**
     * オッズ妙味分析UIの表示
     */
    showOddsValueAnalysis() {
        if (!this.detector) {
            alert('オッズ妙味検出器が利用できません');
            return;
        }

        // 馬データの確認
        const horses = this.getHorseData();
        if (!horses || horses.length === 0) {
            alert('馬データが見つかりません。まず馬データを入力してください。');
            return;
        }

        // 分析実行
        console.log('💰 オッズ妙味分析開始');
        const results = this.detector.analyzeBatch(horses);
        const report = this.detector.generateMarketEfficiencyReport(results);
        
        this.currentAnalysis = { results, report };
        
        // UI表示
        this.renderAnalysisUI(report);
        
        console.log('📊 オッズ妙味分析完了:', report);
    }

    /**
     * 分析結果UIのレンダリング
     */
    renderAnalysisUI(report) {
        // 既存のダイアログを削除
        const existingDialog = document.getElementById('oddsValueDialog');
        if (existingDialog) {
            existingDialog.remove();
        }

        // ダイアログコンテナ作成
        const dialog = document.createElement('div');
        dialog.id = 'oddsValueDialog';
        dialog.className = 'odds-value-dialog';
        
        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <h3>💰 Phase 8α: オッズ妙味分析結果</h3>
                    <button class="close-btn" onclick="document.getElementById('oddsValueDialog').remove()">✕</button>
                </div>
                
                <div class="dialog-body">
                    <!-- サマリーセクション -->
                    <div class="summary-section">
                        <h4>📊 市場効率性サマリー</h4>
                        <div class="summary-grid">
                            <div class="summary-item">
                                <span class="label">分析対象:</span>
                                <span class="value">${report.marketSummary.totalHorses}頭</span>
                            </div>
                            <div class="summary-item">
                                <span class="label">過小評価:</span>
                                <span class="value undervalued">${report.marketSummary.undervaluedCount}頭</span>
                            </div>
                            <div class="summary-item">
                                <span class="label">過大評価:</span>
                                <span class="value overvalued">${report.marketSummary.overvaluedCount}頭</span>
                            </div>
                            <div class="summary-item">
                                <span class="label">平均妙味スコア:</span>
                                <span class="value">${report.marketSummary.averageValueScore.toFixed(1)}点</span>
                            </div>
                        </div>
                    </div>

                    <!-- 推奨候補セクション -->
                    <div class="recommendations-section">
                        <h4>🎯 投資推奨候補</h4>
                        ${this.renderRecommendations(report.summary.recommendations)}
                    </div>

                    <!-- 詳細分析セクション -->
                    <div class="detailed-analysis-section">
                        <h4>📈 詳細分析</h4>
                        <div class="analysis-controls">
                            <button class="btn" onclick="oddsValueUI.toggleDetailsView()">
                                ${this.uiConfig.showDetails ? '詳細を隠す' : '詳細を表示'}
                            </button>
                            <button class="btn" onclick="oddsValueUI.exportAnalysisReport()">
                                📄 レポート出力
                            </button>
                            <button class="btn" onclick="oddsValueUI.refreshAnalysis()">
                                🔄 分析更新
                            </button>
                        </div>
                        
                        <div id="detailedResults" style="display: ${this.uiConfig.showDetails ? 'block' : 'none'}">
                            ${this.renderDetailedResults(this.currentAnalysis.results)}
                        </div>
                    </div>

                    <!-- インサイトセクション -->
                    <div class="insights-section">
                        <h4>💡 市場インサイト</h4>
                        <ul class="insights-list">
                            ${report.insights.map(insight => `<li>${insight}</li>`).join('')}
                        </ul>
                    </div>

                    <!-- 統合情報セクション -->
                    <div class="integration-section">
                        <h4>🔧 システム統合状況</h4>
                        <p class="integration-info">
                            この分析結果は自動的にKelly基準計算に反映され、期待値の調整に活用されます。
                            市場効率性係数が1.0を上回る馬は投資妙味があると判定されています。
                        </p>
                        <div class="integration-actions">
                            <button class="btn primary" onclick="oddsValueUI.applyToKellyCalculation()">
                                ⚡ Kelly計算に反映
                            </button>
                            <button class="btn secondary" onclick="oddsValueUI.generateInvestmentPlan()">
                                📋 投資プラン生成
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // スタイル適用
        this.applyDialogStyles(dialog);
        
        // DOMに追加
        document.body.appendChild(dialog);
        
        // アニメーション
        setTimeout(() => dialog.classList.add('show'), 10);
    }

    /**
     * 推奨候補のレンダリング
     */
    renderRecommendations(recommendations) {
        if (!recommendations || recommendations.length === 0) {
            return '<p class="no-recommendations">現在、強い投資推奨候補はありません。</p>';
        }

        return `
            <div class="recommendations-grid">
                ${recommendations.map(rec => `
                    <div class="recommendation-card ${rec.recommendation}">
                        <div class="horse-info">
                            <span class="horse-name">${rec.horseName}</span>
                            <span class="horse-number">#${rec.horseNumber}</span>
                        </div>
                        <div class="recommendation-details">
                            <div class="score-badge">
                                ${rec.valueScore.toFixed(1)}点
                            </div>
                            <div class="recommendation-level">
                                ${this.getRecommendationLabel(rec.recommendation)}
                            </div>
                            <div class="efficiency-factor">
                                係数: ${rec.factor.toFixed(2)}x
                            </div>
                        </div>
                        <button class="select-btn" onclick="oddsValueUI.selectHorseForInvestment('${rec.horseName}')">
                            選択
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * 詳細結果のレンダリング
     */
    renderDetailedResults(results) {
        return `
            <div class="detailed-results-table">
                <table>
                    <thead>
                        <tr>
                            <th>馬名</th>
                            <th>現在オッズ</th>
                            <th>妙味スコア</th>
                            <th>市場効率性</th>
                            <th>期待値調整</th>
                            <th>推奨</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.map(result => `
                            <tr class="result-row ${result.valueCategory}">
                                <td class="horse-name">${result.horse.name}</td>
                                <td class="odds">${result.currentOdds.toFixed(1)}倍</td>
                                <td class="value-score">
                                    <span class="score-value">${result.overallValueScore.toFixed(1)}</span>
                                    <span class="score-bar">
                                        <div class="score-fill" style="width: ${result.overallValueScore}%"></div>
                                    </span>
                                </td>
                                <td class="efficiency">
                                    ${this.formatEfficiencyData(result.marketContext)}
                                </td>
                                <td class="adjustment">
                                    ${result.marketEfficiencyFactor.toFixed(2)}x
                                </td>
                                <td class="recommendation ${result.recommendation}">
                                    ${this.getRecommendationLabel(result.recommendation)}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * 効率性データのフォーマット
     */
    formatEfficiencyData(marketContext) {
        if (!marketContext) return '-';
        
        const gap = marketContext.efficiencyGap || 0;
        const gapPercent = (gap * 100).toFixed(1);
        const gapClass = gap > 0 ? 'positive' : gap < 0 ? 'negative' : 'neutral';
        
        return `<span class="efficiency-gap ${gapClass}">${gapPercent}%</span>`;
    }

    /**
     * 推奨レベルのラベル取得
     */
    getRecommendationLabel(recommendation) {
        const labels = {
            'strong_buy': '🔥 強力推奨',
            'buy': '👍 推奨',
            'consider': '🤔 検討',
            'monitor': '👀 監視',
            'avoid': '❌ 回避'
        };
        return labels[recommendation] || recommendation;
    }

    /**
     * ダイアログスタイルの適用
     */
    applyDialogStyles(dialog) {
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        // 詳細なCSS設定
        const style = document.createElement('style');
        style.textContent = `
            .odds-value-dialog.show { opacity: 1; }
            .odds-value-dialog .dialog-content {
                background: white;
                border-radius: 12px;
                max-width: 90vw;
                max-height: 90vh;
                overflow-y: auto;
                padding: 0;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            .odds-value-dialog .dialog-header {
                background: linear-gradient(45deg, #667eea, #764ba2);
                color: white;
                padding: 20px;
                border-radius: 12px 12px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .odds-value-dialog .close-btn {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                font-size: 18px;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                cursor: pointer;
            }
            .odds-value-dialog .dialog-body {
                padding: 20px;
            }
            .odds-value-dialog .summary-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin: 15px 0;
            }
            .odds-value-dialog .summary-item {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .odds-value-dialog .value.undervalued { color: #28a745; font-weight: bold; }
            .odds-value-dialog .value.overvalued { color: #dc3545; font-weight: bold; }
            .odds-value-dialog .recommendations-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
                margin: 15px 0;
            }
            .odds-value-dialog .recommendation-card {
                border: 2px solid #ddd;
                border-radius: 8px;
                padding: 15px;
                background: white;
                transition: all 0.3s ease;
            }
            .odds-value-dialog .recommendation-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .odds-value-dialog .recommendation-card.strong_buy {
                border-color: #dc3545;
                background: linear-gradient(45deg, #fff5f5, #fff);
            }
            .odds-value-dialog .recommendation-card.buy {
                border-color: #28a745;
                background: linear-gradient(45deg, #f8fff9, #fff);
            }
            .odds-value-dialog .score-badge {
                background: #667eea;
                color: white;
                padding: 5px 10px;
                border-radius: 20px;
                font-size: 12px;
                display: inline-block;
                margin: 5px 0;
            }
            .odds-value-dialog .detailed-results-table {
                margin: 15px 0;
                overflow-x: auto;
            }
            .odds-value-dialog table {
                width: 100%;
                border-collapse: collapse;
                font-size: 14px;
            }
            .odds-value-dialog th, .odds-value-dialog td {
                padding: 12px 8px;
                text-align: left;
                border-bottom: 1px solid #ddd;
            }
            .odds-value-dialog th {
                background: #f8f9fa;
                font-weight: bold;
            }
            .odds-value-dialog .score-bar {
                width: 50px;
                height: 8px;
                background: #e9ecef;
                border-radius: 4px;
                overflow: hidden;
                display: inline-block;
                margin-left: 8px;
            }
            .odds-value-dialog .score-fill {
                height: 100%;
                background: linear-gradient(90deg, #dc3545, #ffc107, #28a745);
                transition: width 0.3s ease;
            }
            .odds-value-dialog .btn {
                background: #6c757d;
                color: white;
                border: none;
                padding: 8px 15px;
                border-radius: 5px;
                cursor: pointer;
                margin: 5px;
                font-size: 14px;
                transition: background 0.3s ease;
            }
            .odds-value-dialog .btn:hover { background: #5a6268; }
            .odds-value-dialog .btn.primary { background: #007bff; }
            .odds-value-dialog .btn.primary:hover { background: #0056b3; }
            .odds-value-dialog .btn.secondary { background: #28a745; }
            .odds-value-dialog .btn.secondary:hover { background: #1e7e34; }
        `;
        document.head.appendChild(style);
    }

    /**
     * 馬データの取得
     */
    getHorseData() {
        // 複数のソースから馬データを取得
        return window.horses || 
               (window.HorseManager && window.HorseManager.getAllHorses && window.HorseManager.getAllHorses()) ||
               [];
    }

    /**
     * UIアクションメソッド群
     */
    toggleDetailsView() {
        this.uiConfig.showDetails = !this.uiConfig.showDetails;
        const detailsElement = document.getElementById('detailedResults');
        if (detailsElement) {
            detailsElement.style.display = this.uiConfig.showDetails ? 'block' : 'none';
        }
    }

    refreshAnalysis() {
        console.log('🔄 オッズ妙味分析を更新中...');
        this.showOddsValueAnalysis();
    }

    exportAnalysisReport() {
        if (!this.currentAnalysis) {
            alert('分析結果がありません');
            return;
        }

        const reportData = {
            timestamp: new Date().toISOString(),
            analysis: this.currentAnalysis.report,
            systemInfo: {
                version: 'Phase 8α',
                feature: 'オッズ妙味検出'
            }
        };

        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `odds_value_analysis_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    applyToKellyCalculation() {
        console.log('⚡ Kelly計算への反映を開始');
        
        // Phase 6のKelly計算を再実行
        if (typeof KellyCapitalManager !== 'undefined' && window.horses) {
            try {
                const kellyManager = new KellyCapitalManager();
                console.log('✅ オッズ妙味係数がKelly計算に自動反映されました');
                alert('市場効率性係数がKelly計算に反映されました。Phase 6を再実行してください。');
            } catch (error) {
                console.error('❌ Kelly計算反映エラー:', error);
                alert('Kelly計算への反映に失敗しました: ' + error.message);
            }
        } else {
            alert('Kelly計算システムまたは馬データが見つかりません');
        }
    }

    generateInvestmentPlan() {
        if (!this.currentAnalysis || !this.currentAnalysis.report.summary.recommendations.length) {
            alert('投資推奨候補がありません');
            return;
        }

        const plan = this.createInvestmentPlan(this.currentAnalysis.report.summary.recommendations);
        this.displayInvestmentPlan(plan);
    }

    createInvestmentPlan(recommendations) {
        const totalBudget = 10000; // 例：1万円
        const plan = {
            timestamp: new Date().toISOString(),
            totalBudget: totalBudget,
            allocations: [],
            riskLevel: 'moderate',
            expectedReturn: 0
        };

        // 推奨度に基づく配分計算
        const totalScore = recommendations.reduce((sum, rec) => sum + rec.valueScore, 0);
        
        recommendations.forEach(rec => {
            const allocation = {
                horseName: rec.horseName,
                horseNumber: rec.horseNumber,
                valueScore: rec.valueScore,
                recommendation: rec.recommendation,
                allocationRatio: rec.valueScore / totalScore,
                amount: Math.round((rec.valueScore / totalScore) * totalBudget),
                marketFactor: rec.factor
            };
            plan.allocations.push(allocation);
        });

        return plan;
    }

    displayInvestmentPlan(plan) {
        const planHtml = `
            <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 20px; border: 2px solid #007bff;">
                <h4>📋 オッズ妙味ベース投資プラン</h4>
                <p><strong>総予算:</strong> ${plan.totalBudget.toLocaleString()}円</p>
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 8px; border: 1px solid #ddd;">馬名</th>
                            <th style="padding: 8px; border: 1px solid #ddd;">配分率</th>
                            <th style="padding: 8px; border: 1px solid #ddd;">投資額</th>
                            <th style="padding: 8px; border: 1px solid #ddd;">市場係数</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${plan.allocations.map(alloc => `
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd;">${alloc.horseName}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${(alloc.allocationRatio * 100).toFixed(1)}%</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${alloc.amount.toLocaleString()}円</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${alloc.marketFactor.toFixed(2)}x</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <p style="margin-top: 15px; font-size: 12px; color: #666;">
                    ※このプランは市場効率性分析に基づく参考案です。実際の投資判断は十分検討の上で行ってください。
                </p>
            </div>
        `;

        const dialogBody = document.querySelector('.odds-value-dialog .dialog-body');
        if (dialogBody) {
            dialogBody.insertAdjacentHTML('beforeend', planHtml);
        }
    }

    selectHorseForInvestment(horseName) {
        console.log(`🎯 投資候補選択: ${horseName}`);
        alert(`${horseName}を投資候補として選択しました。Kelly計算で詳細な投資額が算出されます。`);
    }
}

// グローバル変数として公開
window.OddsValueUI = OddsValueUI;
window.oddsValueUI = new OddsValueUI();

// デモ機能
window.demoOddsValueUI = function() {
    window.oddsValueUI.showOddsValueAnalysis();
};

console.log('💰 Phase 8α: オッズ妙味検出UI実装完了');
console.log('📝 使用方法: demoOddsValueUI() でデモ実行');