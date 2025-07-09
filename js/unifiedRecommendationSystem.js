// 統合推奨システム
class UnifiedRecommendationSystem {
    static currentDisplayMode = 'main'; // 'main', 'enhanced', 'ai'
    
    static initialize() {
        console.log('🎯 統合推奨システム初期化');
        this.createUnifiedDisplay();
    }
    
    // 統合表示エリアを作成
    static createUnifiedDisplay() {
        const bettingContainer = document.getElementById('bettingContainer');
        if (!bettingContainer) return;
        
        // タブ式表示システムを作成
        const unifiedHTML = `
            <div class="unified-recommendation-system">
                <!-- タブナビゲーション -->
                <div class="recommendation-tabs" style="display: flex; margin-bottom: 15px; background: #f8f9fa; border-radius: 8px; padding: 5px;">
                    <button id="mainRecommendationTab" class="rec-tab active" onclick="UnifiedRecommendationSystem.switchTab('main')" style="flex: 1; padding: 10px; border: none; background: #007bff; color: white; border-radius: 5px; margin-right: 5px; cursor: pointer;">
                        🎯 メイン推奨
                    </button>
                    <button id="enhancedRecommendationTab" class="rec-tab" onclick="UnifiedRecommendationSystem.switchTab('enhanced')" style="flex: 1; padding: 10px; border: none; background: transparent; color: #007bff; border-radius: 5px; margin-right: 5px; cursor: pointer;">
                        📊 詳細分析
                    </button>
                    <button id="aiRecommendationTab" class="rec-tab" onclick="UnifiedRecommendationSystem.switchTab('ai')" style="flex: 1; padding: 10px; border: none; background: transparent; color: #007bff; border-radius: 5px; cursor: pointer;">
                        🤖 AI推奨
                    </button>
                </div>
                
                <!-- コンテンツエリア -->
                <div id="mainRecommendationContent" class="rec-content active" style="display: block;">
                    <!-- メイン推奨システムの内容がここに表示 -->
                </div>
                <div id="enhancedRecommendationContent" class="rec-content" style="display: none;">
                    <!-- 拡張推奨システムの内容がここに表示 -->
                </div>
                <div id="aiRecommendationContent" class="rec-content" style="display: none;">
                    <!-- AI推奨システムの内容がここに表示 -->
                    <div style="text-align: center; padding: 20px;">
                        <button onclick="AIRecommendationService.getAIRecommendation(window.lastPredictions)" style="background: linear-gradient(45deg, #667eea, #764ba2); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer;">
                            🤖 AI推奨を取得
                        </button>
                        <p style="color: #666; margin-top: 10px; font-size: 14px;">Claude AIによる高度な分析を実行します</p>
                    </div>
                </div>
            </div>
        `;
        
        bettingContainer.innerHTML = unifiedHTML;
        
        // 拡張推奨システムの表示を統合
        this.integrateEnhancedRecommendations();
    }
    
    // タブ切り替え
    static switchTab(mode) {
        // タブのアクティブ状態を更新
        document.querySelectorAll('.rec-tab').forEach(tab => {
            tab.style.background = 'transparent';
            tab.style.color = '#007bff';
        });
        
        document.querySelectorAll('.rec-content').forEach(content => {
            content.style.display = 'none';
        });
        
        // 選択されたタブをアクティブ化
        const activeTab = document.getElementById(`${mode}RecommendationTab`);
        const activeContent = document.getElementById(`${mode}RecommendationContent`);
        
        if (activeTab) {
            activeTab.style.background = '#007bff';
            activeTab.style.color = 'white';
        }
        
        if (activeContent) {
            activeContent.style.display = 'block';
        }
        
        this.currentDisplayMode = mode;
        console.log(`🎯 推奨表示モード切り替え: ${mode}`);
    }
    
    // メイン推奨を統合表示に移動
    static integrateMainRecommendations(recommendations) {
        const mainContent = document.getElementById('mainRecommendationContent');
        if (!mainContent || !recommendations) return;
        
        // 既存のBettingRecommenderの表示をここに移動
        let html = '<h4 style="color: #007bff; margin-bottom: 15px;">🎯 買い目推奨</h4>';
        
        if (recommendations.length === 0) {
            html += '<p style="color: #666;">推奨できる買い目がありません。</p>';
        } else {
            html += this.generateRecommendationTable(recommendations);
        }
        
        mainContent.innerHTML = html;
    }
    
    // 拡張推奨を統合表示に移動
    static integrateEnhancedRecommendations() {
        const enhancedContent = document.getElementById('enhancedRecommendationContent');
        if (!enhancedContent) return;
        
        // 既存の拡張推奨システムの内容をここに移動
        const existingEnhanced = document.getElementById('enhancedRecommendations');
        if (existingEnhanced) {
            enhancedContent.innerHTML = existingEnhanced.innerHTML;
            // 元の表示を非表示にする
            existingEnhanced.style.display = 'none';
        }
    }
    
    // AI推奨を統合表示に移動
    static integrateAIRecommendations(aiRecommendation) {
        const aiContent = document.getElementById('aiRecommendationContent');
        if (!aiContent || !aiRecommendation) return;
        
        let html = '<h4 style="color: #667eea; margin-bottom: 15px;">🤖 AI分析結果</h4>';
        html += `<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            ${aiRecommendation.analysis || 'AI分析結果がここに表示されます'}
        </div>`;
        
        if (aiRecommendation.recommendations) {
            html += this.generateRecommendationTable(aiRecommendation.recommendations);
        }
        
        aiContent.innerHTML = html;
    }
    
    // 推奨テーブル生成（共通化）
    static generateRecommendationTable(recommendations) {
        let html = `
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <thead style="background: linear-gradient(45deg, #007bff, #0056b3); color: white;">
                    <tr>
                        <th style="padding: 12px; text-align: left;">印</th>
                        <th style="padding: 12px; text-align: left;">券種</th>
                        <th style="padding: 12px; text-align: left;">馬名・馬番</th>
                        <th style="padding: 12px; text-align: left;">オッズ</th>
                        <th style="padding: 12px; text-align: left;">確率</th>
                        <th style="padding: 12px; text-align: left;">推奨金額</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        recommendations.forEach((rec, index) => {
            const bgColor = index % 2 === 0 ? '#f8f9fa' : 'white';
            html += `
                <tr style="background: ${bgColor};">
                    <td style="padding: 10px; font-weight: bold; color: #007bff;">${rec.mark || '○'}</td>
                    <td style="padding: 10px;">${rec.category || rec.type || '単勝'}</td>
                    <td style="padding: 10px;">${rec.horse || rec.horses || '-'}</td>
                    <td style="padding: 10px;">${rec.odds || '-'}</td>
                    <td style="padding: 10px;">${rec.probability || '-'}</td>
                    <td style="padding: 10px; font-weight: bold; color: #28a745;">${rec.amount || rec.investment || '-'}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        return html;
    }
    
    // 設定保存
    static saveUserPreference(mode) {
        localStorage.setItem('preferredRecommendationMode', mode);
    }
    
    // 設定読み込み
    static loadUserPreference() {
        return localStorage.getItem('preferredRecommendationMode') || 'main';
    }
    
    // 統計情報
    static getUsageStats() {
        return {
            currentMode: this.currentDisplayMode,
            availableModes: ['main', 'enhanced', 'ai'],
            userPreference: this.loadUserPreference()
        };
    }
}

// 既存システムとの統合
// BettingRecommenderの表示を統合システムに転送
const originalGenerateBettingRecommendations = BettingRecommender.generateBettingRecommendations;
BettingRecommender.generateBettingRecommendations = function(predictions) {
    // 元の処理を実行
    const result = originalGenerateBettingRecommendations.call(this, predictions);
    
    // 統合システムが初期化されている場合、そちらに表示を移動
    if (document.getElementById('mainRecommendationContent')) {
        const recommendations = window.lastBettingRecommendations || [];
        UnifiedRecommendationSystem.integrateMainRecommendations(recommendations);
    }
    
    return result;
};

// 自動初期化
if (typeof window !== 'undefined') {
    // DOM読み込み完了後に初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => UnifiedRecommendationSystem.initialize(), 1000);
        });
    } else {
        setTimeout(() => UnifiedRecommendationSystem.initialize(), 1000);
    }
}