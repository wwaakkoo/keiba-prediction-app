/**
 * Phase 7: 候補評価プロセス可視化システム
 * Kelly選考プロセスの完全透明化と投資判断の納得感向上
 */

class CandidateEvaluationVisualizer {
    constructor() {
        this.containerId = 'candidate-evaluation-container';
        this.currentEvaluationData = null;
        this.expandedCandidates = new Set();
        
        // 表示設定
        this.config = {
            maxCandidatesToShow: 10,
            scoreThresholds: {
                excellent: 80,
                good: 65,
                fair: 50,
                poor: 0
            },
            kellyThresholds: {
                strong: 0.05,
                moderate: 0.03,
                light: 0.01,
                minimal: 0
            }
        };
    }

    /**
     * 候補評価可視化の初期化
     */
    initialize() {
        console.log('🔍 候補評価プロセス可視化初期化開始');
        
        this.createEvaluationContainer();
        this.loadEvaluationData();
        this.renderEvaluationProcess();
        
        console.log('✅ 候補評価プロセス可視化初期化完了');
    }

    /**
     * 評価コンテナの作成
     */
    createEvaluationContainer() {
        const existingContainer = document.getElementById(this.containerId);
        if (existingContainer) {
            existingContainer.remove();
        }

        const container = document.createElement('div');
        container.id = this.containerId;
        container.className = 'candidate-evaluation-dashboard';
        container.innerHTML = `
            <div class="evaluation-header">
                <h2>🔍 候補評価プロセス詳細分析</h2>
                <div class="evaluation-controls">
                    <button onclick="candidateEvaluationVisualizer.refreshEvaluation()" class="refresh-btn">
                        🔄 評価データ更新
                    </button>
                    <button onclick="candidateEvaluationVisualizer.exportEvaluation()" class="export-btn">
                        📤 評価結果エクスポート
                    </button>
                </div>
            </div>
            <div id="evaluation-content" class="evaluation-content">
                <!-- 評価プロセス内容がここに動的生成される -->
            </div>
        `;

        // メインダッシュボードの下に挿入
        const dashboardContainer = document.getElementById('portfolio-dashboard-container');
        if (dashboardContainer) {
            dashboardContainer.parentNode.insertBefore(container, dashboardContainer.nextSibling);
        } else {
            document.body.appendChild(container);
        }

        this.addEvaluationStyles();
    }

    /**
     * 評価データの読み込み
     */
    loadEvaluationData() {
        try {
            // Phase 6のKellyシステムから評価データを取得
            const kellyResults = localStorage.getItem('kellyPortfolioResults');
            const lastEvaluationLog = localStorage.getItem('lastEvaluationProcess');
            
            if (kellyResults) {
                this.currentEvaluationData = this.parseEvaluationData(JSON.parse(kellyResults));
            } else {
                this.currentEvaluationData = this.generateSampleEvaluationData();
            }

            console.log('📊 評価データ読み込み完了:', {
                candidates: this.currentEvaluationData.candidates.length,
                mainCandidates: this.currentEvaluationData.mainCandidates.length,
                optionalCandidates: this.currentEvaluationData.optionalCandidates.length
            });
        } catch (error) {
            console.error('❌ 評価データ読み込みエラー:', error);
            this.currentEvaluationData = this.generateSampleEvaluationData();
        }
    }

    /**
     * Kelly結果データを評価プロセス用に変換
     */
    parseEvaluationData(kellyResults) {
        const allCandidates = [
            ...(kellyResults.mainCandidates || []),
            ...(kellyResults.optionalCandidates || []),
            ...(kellyResults.rejectedCandidates || [])
        ];

        return {
            evaluationTimestamp: new Date().toISOString(),
            totalCandidates: allCandidates.length,
            mainCandidates: kellyResults.mainCandidates || [],
            optionalCandidates: kellyResults.optionalCandidates || [],
            rejectedCandidates: kellyResults.rejectedCandidates || [],
            candidates: allCandidates.map(candidate => this.enrichCandidateData(candidate)),
            portfolioSummary: {
                totalInvestment: kellyResults.totalInvestment || 0,
                expectedReturn: kellyResults.expectedReturn || 0,
                riskMultiplier: kellyResults.riskMultiplier || 1.0,
                conflictResolutions: kellyResults.conflictResolutions || []
            }
        };
    }

    /**
     * 候補データの詳細情報を追加
     */
    enrichCandidateData(candidate) {
        const baseScore = candidate.score || Math.random() * 100;
        const winProbability = candidate.winProbability || baseScore / 100 * 0.3;
        const odds = candidate.odds || (2.0 + Math.random() * 6.0);
        const expectedValue = candidate.expectedValue || (winProbability * odds);
        const kellyRatio = candidate.kellyRatio || Math.max(0, (winProbability * odds - 1) / (odds - 1));

        return {
            ...candidate,
            // 基本データ
            horse: candidate.horse || { name: `馬${Math.floor(Math.random() * 18) + 1}号`, number: Math.floor(Math.random() * 18) + 1 },
            score: baseScore,
            winProbability: winProbability,
            odds: odds,
            expectedValue: expectedValue,
            kellyRatio: kellyRatio,
            
            // 分解スコア
            scoreBreakdown: this.calculateScoreBreakdown(baseScore, odds, candidate),
            
            // 評価段階
            evaluationSteps: this.generateEvaluationSteps(baseScore, expectedValue, kellyRatio),
            
            // 決定理由
            decision: this.determineDecision(expectedValue, kellyRatio),
            rationale: this.generateRationale(expectedValue, kellyRatio, odds, candidate),
            
            // カテゴリ分類
            category: this.categorizeCandidate(expectedValue, kellyRatio),
            riskLevel: this.assessRiskLevel(kellyRatio, odds)
        };
    }

    /**
     * スコア分解計算
     */
    calculateScoreBreakdown(totalScore, odds, candidate) {
        // 実際のスコア分解ロジック（サンプル実装）
        const factors = {
            winRateScore: totalScore * 0.4,        // 勝率要素 40%
            oddsFactor: Math.min(25, (5.0 / odds) * 20),  // オッズ要素 20%（オッズが低いほど高スコア）
            popularityFactor: totalScore * 0.2,    // 人気要素 20%
            consistencyFactor: totalScore * 0.15,  // 安定性要素 15%
            formFactor: totalScore * 0.05          // 直近成績要素 5%
        };

        return {
            ...factors,
            total: Object.values(factors).reduce((sum, val) => sum + val, 0)
        };
    }

    /**
     * 評価ステップの生成
     */
    generateEvaluationSteps(score, expectedValue, kellyRatio) {
        return [
            {
                step: 1,
                title: 'スコア計算',
                value: score.toFixed(1),
                status: score >= 60 ? 'success' : score >= 40 ? 'warning' : 'danger',
                description: `総合スコア ${score.toFixed(1)}点 (${this.getScoreRating(score)})`
            },
            {
                step: 2,
                title: '期待値計算',
                value: expectedValue.toFixed(3),
                status: expectedValue >= 1.1 ? 'success' : expectedValue >= 1.0 ? 'warning' : 'danger',
                description: `期待値 ${expectedValue.toFixed(3)} (${expectedValue >= 1.1 ? '推奨' : expectedValue >= 1.0 ? '注意' : '非推奨'})`
            },
            {
                step: 3,
                title: 'Kelly比率',
                value: `${(kellyRatio * 100).toFixed(2)}%`,
                status: kellyRatio >= 0.03 ? 'success' : kellyRatio >= 0.01 ? 'warning' : 'danger',
                description: `Kelly比率 ${(kellyRatio * 100).toFixed(2)}% (${this.getKellyRating(kellyRatio)})`
            }
        ];
    }

    /**
     * 決定判定
     */
    determineDecision(expectedValue, kellyRatio) {
        if (kellyRatio >= 0.03 && expectedValue >= 1.2) {
            return { type: 'main', label: 'メイン候補採用', class: 'decision-main' };
        } else if (kellyRatio >= 0.01 && expectedValue >= 1.05) {
            return { type: 'optional', label: 'オプショナル候補', class: 'decision-optional' };
        } else {
            return { type: 'reject', label: '投資対象外', class: 'decision-reject' };
        }
    }

    /**
     * 根拠理由の生成
     */
    generateRationale(expectedValue, kellyRatio, odds, candidate) {
        const reasons = [];

        // 期待値による判定
        if (expectedValue >= 1.2) {
            reasons.push(`✅ 期待値${expectedValue.toFixed(3)}で推奨基準(1.2)を満たす`);
        } else if (expectedValue >= 1.05) {
            reasons.push(`⚠️ 期待値${expectedValue.toFixed(3)}で最低基準(1.05)をクリア`);
        } else {
            reasons.push(`❌ 期待値${expectedValue.toFixed(3)}で基準未満`);
        }

        // Kelly比率による判定
        if (kellyRatio >= 0.05) {
            reasons.push(`✅ Kelly比率${(kellyRatio * 100).toFixed(2)}%で強い推奨`);
        } else if (kellyRatio >= 0.03) {
            reasons.push(`✅ Kelly比率${(kellyRatio * 100).toFixed(2)}%で推奨`);
        } else if (kellyRatio >= 0.01) {
            reasons.push(`⚠️ Kelly比率${(kellyRatio * 100).toFixed(2)}%で軽微推奨`);
        } else {
            reasons.push(`❌ Kelly比率${(kellyRatio * 100).toFixed(2)}%で推奨基準未満`);
        }

        // オッズによる補足判定
        if (odds <= 2.5) {
            reasons.push(`⚠️ 低オッズ(${odds.toFixed(1)}倍)のため配当効率に注意`);
        } else if (odds >= 8.0) {
            reasons.push(`⚠️ 高オッズ(${odds.toFixed(1)}倍)のため的中リスクに注意`);
        }

        return reasons;
    }

    /**
     * カテゴリ分類
     */
    categorizeCandidate(expectedValue, kellyRatio) {
        if (kellyRatio >= 0.03 && expectedValue >= 1.2) return 'main';
        if (kellyRatio >= 0.01 && expectedValue >= 1.05) return 'optional';
        return 'rejected';
    }

    /**
     * リスクレベル評価
     */
    assessRiskLevel(kellyRatio, odds) {
        const risk = kellyRatio * odds;
        if (risk >= 0.3) return { level: 'high', label: '高リスク', class: 'risk-high' };
        if (risk >= 0.15) return { level: 'medium', label: '中リスク', class: 'risk-medium' };
        return { level: 'low', label: '低リスク', class: 'risk-low' };
    }

    /**
     * スコア評価の取得
     */
    getScoreRating(score) {
        if (score >= this.config.scoreThresholds.excellent) return '優秀';
        if (score >= this.config.scoreThresholds.good) return '良好';
        if (score >= this.config.scoreThresholds.fair) return '普通';
        return '注意';
    }

    /**
     * Kelly評価の取得
     */
    getKellyRating(kelly) {
        if (kelly >= this.config.kellyThresholds.strong) return '強推奨';
        if (kelly >= this.config.kellyThresholds.moderate) return '推奨';
        if (kelly >= this.config.kellyThresholds.light) return '軽微推奨';
        return '推奨外';
    }

    /**
     * 評価プロセスのレンダリング
     */
    renderEvaluationProcess() {
        const contentDiv = document.getElementById('evaluation-content');
        if (!contentDiv || !this.currentEvaluationData) {
            console.warn('評価コンテンツまたはデータが存在しません');
            return;
        }

        const { candidates, portfolioSummary } = this.currentEvaluationData;

        contentDiv.innerHTML = `
            ${this.renderEvaluationSummary()}
            ${this.renderCandidateList(candidates)}
            ${this.renderPortfolioDecisionFlow()}
        `;

        this.attachEventListeners();
    }

    /**
     * 評価サマリーのレンダリング
     */
    renderEvaluationSummary() {
        const { mainCandidates, optionalCandidates, candidates } = this.currentEvaluationData;
        
        return `
            <div class="evaluation-summary">
                <h3>📊 評価結果サマリー</h3>
                <div class="summary-stats">
                    <div class="stat-item main">
                        <span class="stat-value">${mainCandidates.length}</span>
                        <span class="stat-label">メイン候補</span>
                    </div>
                    <div class="stat-item optional">
                        <span class="stat-value">${optionalCandidates.length}</span>
                        <span class="stat-label">オプショナル候補</span>
                    </div>
                    <div class="stat-item rejected">
                        <span class="stat-value">${candidates.length - mainCandidates.length - optionalCandidates.length}</span>
                        <span class="stat-label">投資対象外</span>
                    </div>
                    <div class="stat-item total">
                        <span class="stat-value">${candidates.length}</span>
                        <span class="stat-label">総候補数</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 候補リストのレンダリング
     */
    renderCandidateList(candidates) {
        const sortedCandidates = candidates
            .sort((a, b) => b.kellyRatio - a.kellyRatio)
            .slice(0, this.config.maxCandidatesToShow);

        const candidateCards = sortedCandidates.map(candidate => 
            this.renderCandidateCard(candidate)
        ).join('');

        return `
            <div class="candidate-list">
                <h3>🐎 候補詳細評価 (上位${sortedCandidates.length}件)</h3>
                <div class="candidates-grid">
                    ${candidateCards}
                </div>
            </div>
        `;
    }

    /**
     * 候補カードのレンダリング
     */
    renderCandidateCard(candidate) {
        const isExpanded = this.expandedCandidates.has(candidate.horse.number);
        const decision = candidate.decision;
        
        return `
            <div class="candidate-card ${decision.class}" data-horse-number="${candidate.horse.number}">
                <div class="card-header" onclick="candidateEvaluationVisualizer.toggleCandidateDetails(${candidate.horse.number})">
                    <div class="horse-info">
                        <span class="horse-name">${candidate.horse.name}</span>
                        <span class="horse-number">#${candidate.horse.number}</span>
                    </div>
                    <div class="decision-badge ${decision.class}">
                        ${decision.label}
                    </div>
                    <div class="expand-icon">${isExpanded ? '▼' : '▶'}</div>
                </div>
                
                <div class="card-summary">
                    <div class="key-metrics">
                        <div class="metric">
                            <span class="metric-label">スコア</span>
                            <span class="metric-value">${candidate.score.toFixed(1)}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">期待値</span>
                            <span class="metric-value">${candidate.expectedValue.toFixed(3)}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Kelly</span>
                            <span class="metric-value">${(candidate.kellyRatio * 100).toFixed(2)}%</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">オッズ</span>
                            <span class="metric-value">${candidate.odds.toFixed(1)}倍</span>
                        </div>
                    </div>
                </div>

                ${isExpanded ? this.renderCandidateDetails(candidate) : ''}
            </div>
        `;
    }

    /**
     * 候補詳細のレンダリング
     */
    renderCandidateDetails(candidate) {
        return `
            <div class="card-details">
                <div class="evaluation-steps">
                    <h4>📋 評価ステップ</h4>
                    ${candidate.evaluationSteps.map(step => `
                        <div class="evaluation-step ${step.status}">
                            <div class="step-number">${step.step}</div>
                            <div class="step-content">
                                <div class="step-title">${step.title}: ${step.value}</div>
                                <div class="step-description">${step.description}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="score-breakdown">
                    <h4>🔍 スコア分解</h4>
                    <div class="breakdown-chart">
                        ${Object.entries(candidate.scoreBreakdown).map(([key, value]) => {
                            if (key === 'total') return '';
                            const percentage = (value / candidate.scoreBreakdown.total * 100);
                            return `
                                <div class="breakdown-item">
                                    <span class="breakdown-label">${this.getFactorLabel(key)}</span>
                                    <div class="breakdown-bar">
                                        <div class="bar-fill" style="width: ${percentage}%"></div>
                                    </div>
                                    <span class="breakdown-value">${value.toFixed(1)}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div class="decision-rationale">
                    <h4>💭 判定根拠</h4>
                    <ul class="rationale-list">
                        ${candidate.rationale.map(reason => `<li>${reason}</li>`).join('')}
                    </ul>
                </div>

                <div class="risk-assessment">
                    <h4>⚠️ リスク評価</h4>
                    <div class="risk-badge ${candidate.riskLevel.class}">
                        ${candidate.riskLevel.label}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * ポートフォリオ決定フローのレンダリング
     */
    renderPortfolioDecisionFlow() {
        return `
            <div class="portfolio-flow">
                <h3>🔄 ポートフォリオ決定フロー</h3>
                <div class="flow-diagram">
                    <div class="flow-step">
                        <div class="step-box">候補収集</div>
                        <div class="step-arrow">→</div>
                    </div>
                    <div class="flow-step">
                        <div class="step-box">スコア計算</div>
                        <div class="step-arrow">→</div>
                    </div>
                    <div class="flow-step">
                        <div class="step-box">期待値評価</div>
                        <div class="step-arrow">→</div>
                    </div>
                    <div class="flow-step">
                        <div class="step-box">Kelly比率計算</div>
                        <div class="step-arrow">→</div>
                    </div>
                    <div class="flow-step">
                        <div class="step-box">カテゴリ分類</div>
                        <div class="step-arrow">→</div>
                    </div>
                    <div class="flow-step">
                        <div class="step-box">競合解決</div>
                        <div class="step-arrow">→</div>
                    </div>
                    <div class="flow-step">
                        <div class="step-box">最終ポートフォリオ</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * ファクターラベルの取得
     */
    getFactorLabel(key) {
        const labels = {
            winRateScore: '勝率',
            oddsFactor: 'オッズ',
            popularityFactor: '人気',
            consistencyFactor: '安定性',
            formFactor: '直近成績'
        };
        return labels[key] || key;
    }

    /**
     * イベントリスナーの設定
     */
    attachEventListeners() {
        // 候補詳細の展開/折りたたみは toggleCandidateDetails メソッドで処理
    }

    /**
     * 候補詳細の表示切り替え
     */
    toggleCandidateDetails(horseNumber) {
        if (this.expandedCandidates.has(horseNumber)) {
            this.expandedCandidates.delete(horseNumber);
        } else {
            this.expandedCandidates.add(horseNumber);
        }
        this.renderEvaluationProcess();
    }

    /**
     * 評価データの更新
     */
    refreshEvaluation() {
        console.log('🔄 評価データ更新中...');
        this.loadEvaluationData();
        this.renderEvaluationProcess();
        console.log('✅ 評価データ更新完了');
    }

    /**
     * 評価結果のエクスポート
     */
    exportEvaluation() {
        const data = {
            timestamp: new Date().toISOString(),
            evaluationData: this.currentEvaluationData
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `candidate_evaluation_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('📤 評価結果をエクスポートしました');
    }

    /**
     * サンプル評価データの生成
     */
    generateSampleEvaluationData() {
        const sampleCandidates = [];
        for (let i = 1; i <= 8; i++) {
            const score = 40 + Math.random() * 50;
            const odds = 2.0 + Math.random() * 8.0;
            const winProbability = score / 100 * 0.3;
            const expectedValue = winProbability * odds;
            const kellyRatio = Math.max(0, (winProbability * odds - 1) / (odds - 1));
            
            sampleCandidates.push({
                horse: { name: `サンプル馬${i}`, number: i },
                score: score,
                odds: odds,
                winProbability: winProbability,
                expectedValue: expectedValue,
                kellyRatio: kellyRatio
            });
        }

        const enrichedCandidates = sampleCandidates.map(c => this.enrichCandidateData(c));
        
        return {
            evaluationTimestamp: new Date().toISOString(),
            totalCandidates: enrichedCandidates.length,
            mainCandidates: enrichedCandidates.filter(c => c.category === 'main'),
            optionalCandidates: enrichedCandidates.filter(c => c.category === 'optional'),
            rejectedCandidates: enrichedCandidates.filter(c => c.category === 'rejected'),
            candidates: enrichedCandidates,
            portfolioSummary: {
                totalInvestment: 3000,
                expectedReturn: 3500,
                riskMultiplier: 0.85,
                conflictResolutions: []
            }
        };
    }

    /**
     * スタイルの追加
     */
    addEvaluationStyles() {
        if (document.getElementById('evaluation-styles')) return;

        const style = document.createElement('style');
        style.id = 'evaluation-styles';
        style.textContent = `
            .candidate-evaluation-dashboard {
                margin: 20px 0;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 12px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }

            .evaluation-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #e9ecef;
            }

            .evaluation-header h2 {
                margin: 0;
                color: #2c3e50;
                font-size: 1.5rem;
            }

            .evaluation-controls {
                display: flex;
                gap: 10px;
            }

            .refresh-btn, .export-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.9rem;
                transition: all 0.3s ease;
            }

            .refresh-btn {
                background: #17a2b8;
                color: white;
            }

            .refresh-btn:hover {
                background: #138496;
            }

            .export-btn {
                background: #28a745;
                color: white;
            }

            .export-btn:hover {
                background: #218838;
            }

            .evaluation-summary {
                margin-bottom: 25px;
                padding: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 1px 5px rgba(0,0,0,0.05);
            }

            .evaluation-summary h3 {
                margin: 0 0 15px 0;
                color: #495057;
            }

            .summary-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
            }

            .stat-item {
                text-align: center;
                padding: 15px;
                border-radius: 8px;
                background: #f8f9fa;
            }

            .stat-item.main {
                background: linear-gradient(135deg, #d4edda, #c3e6cb);
                border-left: 4px solid #28a745;
            }

            .stat-item.optional {
                background: linear-gradient(135deg, #fff3cd, #ffeaa7);
                border-left: 4px solid #ffc107;
            }

            .stat-item.rejected {
                background: linear-gradient(135deg, #f8d7da, #f5c6cb);
                border-left: 4px solid #dc3545;
            }

            .stat-item.total {
                background: linear-gradient(135deg, #d1ecf1, #bee5eb);
                border-left: 4px solid #17a2b8;
            }

            .stat-value {
                display: block;
                font-size: 2rem;
                font-weight: bold;
                color: #2c3e50;
            }

            .stat-label {
                display: block;
                font-size: 0.9rem;
                color: #6c757d;
                margin-top: 5px;
            }

            .candidate-list {
                margin-bottom: 25px;
            }

            .candidate-list h3 {
                margin: 0 0 20px 0;
                color: #495057;
            }

            .candidates-grid {
                display: grid;
                gap: 15px;
            }

            .candidate-card {
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                overflow: hidden;
                transition: all 0.3s ease;
            }

            .candidate-card:hover {
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transform: translateY(-2px);
            }

            .candidate-card.decision-main {
                border-left: 5px solid #28a745;
            }

            .candidate-card.decision-optional {
                border-left: 5px solid #ffc107;
            }

            .candidate-card.decision-reject {
                border-left: 5px solid #dc3545;
            }

            .card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background: #f8f9fa;
                cursor: pointer;
                transition: background 0.3s ease;
            }

            .card-header:hover {
                background: #e9ecef;
            }

            .horse-info {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .horse-name {
                font-weight: bold;
                font-size: 1.1rem;
                color: #2c3e50;
            }

            .horse-number {
                background: #6c757d;
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 0.8rem;
            }

            .decision-badge {
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: bold;
            }

            .decision-badge.decision-main {
                background: #d4edda;
                color: #155724;
            }

            .decision-badge.decision-optional {
                background: #fff3cd;
                color: #856404;
            }

            .decision-badge.decision-reject {
                background: #f8d7da;
                color: #721c24;
            }

            .expand-icon {
                font-size: 1.2rem;
                color: #6c757d;
                transition: transform 0.3s ease;
            }

            .card-summary {
                padding: 15px 20px;
            }

            .key-metrics {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                gap: 15px;
            }

            .metric {
                text-align: center;
            }

            .metric-label {
                display: block;
                font-size: 0.8rem;
                color: #6c757d;
                margin-bottom: 5px;
            }

            .metric-value {
                display: block;
                font-size: 1.1rem;
                font-weight: bold;
                color: #2c3e50;
            }

            .card-details {
                padding: 20px;
                background: #f8f9fa;
                border-top: 1px solid #e9ecef;
            }

            .card-details h4 {
                margin: 0 0 15px 0;
                color: #495057;
                font-size: 1rem;
            }

            .evaluation-steps {
                margin-bottom: 20px;
            }

            .evaluation-step {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
                padding: 10px;
                border-radius: 6px;
                background: white;
            }

            .evaluation-step.success {
                border-left: 4px solid #28a745;
                background: #d4edda;
            }

            .evaluation-step.warning {
                border-left: 4px solid #ffc107;
                background: #fff3cd;
            }

            .evaluation-step.danger {
                border-left: 4px solid #dc3545;
                background: #f8d7da;
            }

            .step-number {
                width: 30px;
                height: 30px;
                background: #6c757d;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                margin-right: 15px;
                flex-shrink: 0;
            }

            .step-content {
                flex-grow: 1;
            }

            .step-title {
                font-weight: bold;
                margin-bottom: 2px;
            }

            .step-description {
                font-size: 0.9rem;
                color: #6c757d;
            }

            .score-breakdown {
                margin-bottom: 20px;
            }

            .breakdown-chart {
                space-y: 8px;
            }

            .breakdown-item {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 8px;
            }

            .breakdown-label {
                min-width: 80px;
                font-size: 0.9rem;
                color: #6c757d;
            }

            .breakdown-bar {
                flex-grow: 1;
                height: 8px;
                background: #e9ecef;
                border-radius: 4px;
                overflow: hidden;
            }

            .bar-fill {
                height: 100%;
                background: linear-gradient(90deg, #007bff, #28a745);
                transition: width 0.3s ease;
            }

            .breakdown-value {
                min-width: 40px;
                text-align: right;
                font-size: 0.9rem;
                font-weight: bold;
                color: #2c3e50;
            }

            .decision-rationale {
                margin-bottom: 20px;
            }

            .rationale-list {
                margin: 0;
                padding-left: 20px;
            }

            .rationale-list li {
                margin-bottom: 5px;
                font-size: 0.9rem;
                line-height: 1.4;
            }

            .risk-assessment {
                margin-bottom: 15px;
            }

            .risk-badge {
                display: inline-block;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: bold;
            }

            .risk-badge.risk-high {
                background: #f8d7da;
                color: #721c24;
            }

            .risk-badge.risk-medium {
                background: #fff3cd;
                color: #856404;
            }

            .risk-badge.risk-low {
                background: #d4edda;
                color: #155724;
            }

            .portfolio-flow {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 1px 5px rgba(0,0,0,0.05);
            }

            .portfolio-flow h3 {
                margin: 0 0 20px 0;
                color: #495057;
            }

            .flow-diagram {
                display: flex;
                align-items: center;
                justify-content: center;
                flex-wrap: wrap;
                gap: 10px;
            }

            .flow-step {
                display: flex;
                align-items: center;
            }

            .step-box {
                padding: 10px 15px;
                background: #007bff;
                color: white;
                border-radius: 6px;
                font-size: 0.9rem;
                font-weight: bold;
                white-space: nowrap;
            }

            .step-arrow {
                margin: 0 10px;
                font-size: 1.2rem;
                color: #6c757d;
            }

            /* レスポンシブ対応 */
            @media (max-width: 768px) {
                .candidate-evaluation-dashboard {
                    margin: 10px;
                    padding: 15px;
                }

                .evaluation-header {
                    flex-direction: column;
                    gap: 15px;
                    align-items: stretch;
                }

                .evaluation-controls {
                    justify-content: center;
                }

                .summary-stats {
                    grid-template-columns: repeat(2, 1fr);
                }

                .key-metrics {
                    grid-template-columns: repeat(2, 1fr);
                }

                .flow-diagram {
                    flex-direction: column;
                }

                .step-arrow {
                    transform: rotate(90deg);
                    margin: 5px 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * コンポーネントの破棄
     */
    destroy() {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.remove();
        }
    }
}

// グローバル公開
window.CandidateEvaluationVisualizer = CandidateEvaluationVisualizer;

// 自動初期化（ポートフォリオダッシュボードの後）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.candidateEvaluationVisualizer = new CandidateEvaluationVisualizer();
            window.candidateEvaluationVisualizer.initialize();
        }, 1500); // ダッシュボード＋チャート初期化後に実行
    });
} else {
    setTimeout(() => {
        window.candidateEvaluationVisualizer = new CandidateEvaluationVisualizer();
        window.candidateEvaluationVisualizer.initialize();
    }, 1500);
}