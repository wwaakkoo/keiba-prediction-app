// 学習データの移行機能
class DataManager {
    
    // 学習データをエクスポート（AI学習データ統合版）
    static exportLearningData() {
        try {
            // 各種学習データを取得
            const learningData = localStorage.getItem('keibaLearningData');
            const bettingHistory = localStorage.getItem('keibaAppBettingHistory');
            const aiRecommendationHistory = localStorage.getItem('aiRecommendationHistory');
            const profitabilityData = localStorage.getItem('profitabilityData');
            const enhancedLearningData = localStorage.getItem('enhancedLearningData');
            const mobileMode = localStorage.getItem('mobileMode');
            
            // エクスポート用データを構築
            const exportData = {
                version: "3.0", // 収益性分析統合版
                exportDate: new Date().toISOString(),
                metadata: {
                    appName: "競馬予測アプリ（Claude AI・収益性分析統合版）",
                    description: "学習データ・AI推奨履歴・収益性分析・ユーザー設定のバックアップ",
                    features: ["統計的学習", "AI推奨履歴", "収益性分析", "投資効率計算", "適応的分析"]
                },
                learningData: learningData ? JSON.parse(learningData) : null,
                bettingHistory: bettingHistory ? JSON.parse(bettingHistory) : null,
                aiRecommendationHistory: aiRecommendationHistory ? JSON.parse(aiRecommendationHistory) : null,
                profitabilityData: profitabilityData ? JSON.parse(profitabilityData) : null,
                enhancedLearningData: enhancedLearningData ? JSON.parse(enhancedLearningData) : null,
                userSettings: {
                    mobileMode: mobileMode === 'true'
                }
            };
            
            // データの有効性をチェック
            if (!exportData.learningData && !exportData.bettingHistory && !exportData.aiRecommendationHistory && 
                !exportData.profitabilityData && !exportData.enhancedLearningData) {
                showMessage('エクスポートするデータが見つかりません。', 'warning');
                return;
            }
            
            // JSONファイルとしてダウンロード
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            
            // ファイル名生成（日時付き、AI統合版）
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `keiba-ai-learning-data-${dateStr}.json`;
            
            // ダウンロード実行
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // エクスポート統計を表示
            const stats = DataManager.getExportStats(exportData);
            showMessage(`学習データをエクスポートしました！\\n${stats}`, 'success');
            
        } catch (error) {
            console.error('エクスポートエラー:', error);
            showMessage('学習データのエクスポートに失敗しました。', 'error');
        }
    }
    
    // 学習データをインポート
    static importLearningData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // ファイル形式チェック
        if (!file.name.endsWith('.json')) {
            showMessage('JSONファイルを選択してください。', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importData = JSON.parse(e.target.result);
                
                // データ形式の検証
                if (!DataManager.validateImportData(importData)) {
                    showMessage('無効なデータ形式です。正しい学習データファイルを選択してください。', 'error');
                    return;
                }
                
                // インポート前の確認
                const confirmMessage = DataManager.getImportConfirmMessage(importData);
                if (!confirm(`${confirmMessage}\\n\\n現在の学習データは上書きされます。よろしいですか？`)) {
                    return;
                }
                
                // データをlocalStorageに保存
                if (importData.learningData) {
                    localStorage.setItem('keibaLearningData', JSON.stringify(importData.learningData));
                }
                
                if (importData.bettingHistory) {
                    localStorage.setItem('keibaAppBettingHistory', JSON.stringify(importData.bettingHistory));
                }
                
                if (importData.aiRecommendationHistory) {
                    localStorage.setItem('aiRecommendationHistory', JSON.stringify(importData.aiRecommendationHistory));
                }
                
                if (importData.profitabilityData) {
                    localStorage.setItem('profitabilityData', JSON.stringify(importData.profitabilityData));
                }
                
                if (importData.enhancedLearningData) {
                    localStorage.setItem('enhancedLearningData', JSON.stringify(importData.enhancedLearningData));
                }
                
                if (importData.userSettings && typeof importData.userSettings.mobileMode === 'boolean') {
                    localStorage.setItem('mobileMode', importData.userSettings.mobileMode.toString());
                }
                
                // インポート統計を表示
                const stats = DataManager.getImportStats(importData);
                showMessage(`学習データをインポートしました！\\n${stats}\\n\\nページを再読み込みして設定を反映してください。`, 'success');
                
                // ファイル選択をリセット
                event.target.value = '';
                
            } catch (error) {
                console.error('インポートエラー:', error);
                showMessage('ファイルの読み込みに失敗しました。ファイル形式を確認してください。', 'error');
            }
        };
        
        reader.readAsText(file);
    }
    
    // エクスポートデータの統計情報を取得（AI統合版）
    static getExportStats(exportData) {
        const stats = [];
        
        if (exportData.learningData) {
            const accuracy = exportData.learningData.accuracy || {};
            const historyCount = exportData.learningData.history ? exportData.learningData.history.length : 0;
            stats.push(`📊 統計的学習履歴: ${historyCount}件`);
            stats.push(`📈 総予測回数: ${accuracy.totalPredictions || 0}回`);
            stats.push(`🎯 勝利的中: ${accuracy.winPredictions || 0}回`);
            stats.push(`🏆 複勝的中: ${accuracy.placePredictions || 0}回`);
        }
        
        if (exportData.bettingHistory) {
            stats.push(`💰 買い目履歴: ${exportData.bettingHistory.length}件`);
        }
        
        if (exportData.aiRecommendationHistory) {
            const aiHistory = exportData.aiRecommendationHistory;
            const successCount = aiHistory.filter(h => h.wasCorrect).length;
            const successRate = aiHistory.length > 0 ? Math.round((successCount / aiHistory.length) * 100) : 0;
            stats.push(`🤖 AI推奨履歴: ${aiHistory.length}件`);
            stats.push(`✅ AI成功率: ${successRate}% (${successCount}/${aiHistory.length})`);
            
            if (aiHistory.length > 0) {
                const avgOdds = aiHistory.reduce((sum, h) => sum + (h.recommendedHorse?.odds || 0), 0) / aiHistory.length;
                stats.push(`📊 平均推奨オッズ: ${avgOdds.toFixed(1)}倍`);
            }
        }
        
        if (exportData.profitabilityData) {
            const profitData = exportData.profitabilityData;
            if (profitData.investment) {
                stats.push(`💰 収益性データ: ${profitData.investment.totalBets}回投資`);
                stats.push(`📈 ROI: ${(profitData.coreMetrics?.roi || 0).toFixed(1)}%`);
                stats.push(`💸 総投資額: ${(profitData.investment.totalInvested || 0).toLocaleString()}円`);
                stats.push(`💵 総利益: ${(profitData.investment.totalProfit || 0).toLocaleString()}円`);
            }
        }
        
        if (exportData.enhancedLearningData) {
            stats.push(`🧠 強化学習データ: 含む`);
        }
        
        return stats.join('\\n');
    }
    
    // インポートデータの統計情報を取得（AI統合版）
    static getImportStats(importData) {
        const stats = [];
        
        if (importData.learningData) {
            const accuracy = importData.learningData.accuracy || {};
            const historyCount = importData.learningData.history ? importData.learningData.history.length : 0;
            stats.push(`📊 統計的学習履歴: ${historyCount}件をインポート`);
            stats.push(`📈 総予測回数: ${accuracy.totalPredictions || 0}回`);
            
            if (accuracy.totalPredictions > 0) {
                const winRate = ((accuracy.winPredictions || 0) / accuracy.totalPredictions * 100).toFixed(1);
                const placeRate = ((accuracy.placePredictions || 0) / accuracy.totalPredictions * 100).toFixed(1);
                stats.push(`🎯 勝利的中率: ${winRate}%`);
                stats.push(`🏆 複勝的中率: ${placeRate}%`);
            }
        }
        
        if (importData.bettingHistory) {
            stats.push(`💰 買い目履歴: ${importData.bettingHistory.length}件をインポート`);
        }
        
        if (importData.aiRecommendationHistory) {
            const aiHistory = importData.aiRecommendationHistory;
            const successCount = aiHistory.filter(h => h.wasCorrect).length;
            const successRate = aiHistory.length > 0 ? Math.round((successCount / aiHistory.length) * 100) : 0;
            stats.push(`🤖 AI推奨履歴: ${aiHistory.length}件をインポート`);
            stats.push(`✅ AI成功率: ${successRate}% (${successCount}/${aiHistory.length})`);
        }
        
        if (importData.profitabilityData) {
            const profitData = importData.profitabilityData;
            if (profitData.investment) {
                stats.push(`💰 収益性データ: ${profitData.investment.totalBets}回投資をインポート`);
                stats.push(`📈 ROI: ${(profitData.coreMetrics?.roi || 0).toFixed(1)}%`);
                stats.push(`💸 総投資額: ${(profitData.investment.totalInvested || 0).toLocaleString()}円`);
                stats.push(`💵 総利益: ${(profitData.investment.totalProfit || 0).toLocaleString()}円`);
            }
        }
        
        if (importData.enhancedLearningData) {
            stats.push(`🧠 強化学習データ: インポートします`);
        }
        
        return stats.join('\\n');
    }
    
    // インポート確認メッセージを生成（AI統合版）
    static getImportConfirmMessage(importData) {
        const messages = ['以下のデータをインポートします：'];
        
        if (importData.learningData) {
            messages.push('✓ 統計的学習データ（予測精度・パラメータ調整）');
        }
        
        if (importData.bettingHistory) {
            messages.push('✓ 買い目推奨履歴（的中率・閾値調整）');
        }
        
        if (importData.aiRecommendationHistory) {
            const aiCount = importData.aiRecommendationHistory.length;
            const successCount = importData.aiRecommendationHistory.filter(h => h.wasCorrect).length;
            messages.push(`✓ AI推奨履歴（${aiCount}件、成功${successCount}件）`);
        }
        
        if (importData.userSettings) {
            messages.push('✓ ユーザー設定（表示モードなど）');
        }
        
        // バージョン情報
        if (importData.version) {
            messages.push(`\\nデータバージョン: ${importData.version}`);
        }
        
        if (importData.exportDate) {
            const exportDate = new Date(importData.exportDate).toLocaleString('ja-JP');
            messages.push(`エクスポート日時: ${exportDate}`);
        }
        
        return messages.join('\\n');
    }
    
    // インポートデータの検証
    static validateImportData(data) {
        try {
            // 基本構造の確認
            if (!data || typeof data !== 'object') {
                return false;
            }
            
            // バージョン確認
            if (!data.version) {
                return false;
            }
            
            // 学習データの構造確認
            if (data.learningData) {
                const learningData = data.learningData;
                if (!learningData.adjustments || !learningData.accuracy) {
                    return false;
                }
                
                // adjustmentsの必須フィールド確認
                const required = ['oddsWeight', 'lastRaceWeight', 'jockeyWeight'];
                for (const field of required) {
                    if (typeof learningData.adjustments[field] !== 'number') {
                        return false;
                    }
                }
            }
            
            // 買い目履歴の構造確認
            if (data.bettingHistory) {
                if (!Array.isArray(data.bettingHistory)) {
                    return false;
                }
                
                // 最初の要素の構造確認（存在する場合）
                if (data.bettingHistory.length > 0) {
                    const first = data.bettingHistory[0];
                    if (!first.date || !first.recommendations) {
                        return false;
                    }
                }
            }
            
            // AI推奨履歴の構造確認
            if (data.aiRecommendationHistory) {
                if (!Array.isArray(data.aiRecommendationHistory)) {
                    return false;
                }
                
                // 最初の要素の構造確認（存在する場合）
                if (data.aiRecommendationHistory.length > 0) {
                    const first = data.aiRecommendationHistory[0];
                    if (!first.date || typeof first.wasCorrect !== 'boolean') {
                        return false;
                    }
                }
            }
            
            return true;
            
        } catch (error) {
            console.error('データ検証エラー:', error);
            return false;
        }
    }

    // AI学習データのみをエクスポート
    static exportAILearningData() {
        try {
            const aiRecommendationHistory = localStorage.getItem('aiRecommendationHistory');
            
            if (!aiRecommendationHistory) {
                showMessage('エクスポートするAI学習データが見つかりません。', 'warning');
                return;
            }

            const aiHistory = JSON.parse(aiRecommendationHistory);
            const exportData = {
                version: "2.0-AI",
                exportDate: new Date().toISOString(),
                metadata: {
                    appName: "競馬予測アプリ（Claude AI統合版）",
                    description: "AI推奨履歴の専用バックアップ",
                    dataType: "AI推奨履歴のみ"
                },
                aiRecommendationHistory: aiHistory
            };

            // AI統計情報を生成
            const successCount = aiHistory.filter(h => h.wasCorrect).length;
            const successRate = aiHistory.length > 0 ? Math.round((successCount / aiHistory.length) * 100) : 0;
            const avgOdds = aiHistory.reduce((sum, h) => sum + (h.recommendedHorse?.odds || 0), 0) / aiHistory.length;

            // JSONファイルとしてダウンロード
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            
            // ファイル名生成
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `keiba-ai-only-data-${dateStr}.json`;
            
            // ダウンロード実行
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            const stats = `🤖 AI推奨履歴: ${aiHistory.length}件\\n✅ AI成功率: ${successRate}%\\n📊 平均推奨オッズ: ${avgOdds.toFixed(1)}倍`;
            showMessage(`AI学習データをエクスポートしました！\\n${stats}`, 'success');
            
        } catch (error) {
            console.error('AI学習データエクスポートエラー:', error);
            showMessage('AI学習データのエクスポートに失敗しました。', 'error');
        }
    }

    // AI学習データのみをインポート
    static importAILearningData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.name.endsWith('.json')) {
            showMessage('JSONファイルを選択してください。', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importData = JSON.parse(e.target.result);
                
                // AI専用データの検証
                if (!importData.aiRecommendationHistory || !Array.isArray(importData.aiRecommendationHistory)) {
                    showMessage('有効なAI学習データファイルではありません。', 'error');
                    return;
                }

                const aiHistory = importData.aiRecommendationHistory;
                const successCount = aiHistory.filter(h => h.wasCorrect).length;
                const successRate = aiHistory.length > 0 ? Math.round((successCount / aiHistory.length) * 100) : 0;

                const confirmMessage = `AI推奨履歴をインポートします：\\n\\n🤖 AI推奨履歴: ${aiHistory.length}件\\n✅ 成功率: ${successRate}%\\n\\n現在のAI学習データは上書きされます。よろしいですか？`;
                
                if (!confirm(confirmMessage)) {
                    return;
                }
                
                // AI学習データを保存
                localStorage.setItem('aiRecommendationHistory', JSON.stringify(aiHistory));
                
                showMessage(`AI学習データをインポートしました！\\n🤖 ${aiHistory.length}件の履歴を復元\\n✅ 成功率: ${successRate}%`, 'success');
                
                // ファイル選択をリセット
                event.target.value = '';
                
            } catch (error) {
                console.error('AI学習データインポートエラー:', error);
                showMessage('AI学習データの読み込みに失敗しました。', 'error');
            }
        };
        
        reader.readAsText(file);
    }
}

// グローバル関数として公開
window.exportLearningData = DataManager.exportLearningData.bind(DataManager);
window.importLearningData = DataManager.importLearningData.bind(DataManager);
window.exportAILearningData = DataManager.exportAILearningData.bind(DataManager);
window.importAILearningData = DataManager.importAILearningData.bind(DataManager);