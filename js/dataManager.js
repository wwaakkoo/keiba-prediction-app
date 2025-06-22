// 学習データの移行機能
class DataManager {
    
    // 学習データをエクスポート
    static exportLearningData() {
        try {
            // 各種学習データを取得
            const learningData = localStorage.getItem('keibaLearningData');
            const bettingHistory = localStorage.getItem('keibaAppBettingHistory');
            const mobileMode = localStorage.getItem('mobileMode');
            
            // エクスポート用データを構築
            const exportData = {
                version: "1.0",
                exportDate: new Date().toISOString(),
                metadata: {
                    appName: "競馬予測アプリ",
                    description: "学習データとユーザー設定のバックアップ"
                },
                learningData: learningData ? JSON.parse(learningData) : null,
                bettingHistory: bettingHistory ? JSON.parse(bettingHistory) : null,
                userSettings: {
                    mobileMode: mobileMode === 'true'
                }
            };
            
            // データの有効性をチェック
            if (!exportData.learningData && !exportData.bettingHistory) {
                showMessage('エクスポートする学習データが見つかりません。', 'warning');
                return;
            }
            
            // JSONファイルとしてダウンロード
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            
            // ファイル名生成（日時付き）
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `keiba-learning-data-${dateStr}.json`;
            
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
    
    // エクスポートデータの統計情報を取得
    static getExportStats(exportData) {
        const stats = [];
        
        if (exportData.learningData) {
            const accuracy = exportData.learningData.accuracy || {};
            const historyCount = exportData.learningData.history ? exportData.learningData.history.length : 0;
            stats.push(`学習履歴: ${historyCount}件`);
            stats.push(`総予測回数: ${accuracy.totalPredictions || 0}回`);
            stats.push(`勝利的中: ${accuracy.winPredictions || 0}回`);
            stats.push(`複勝的中: ${accuracy.placePredictions || 0}回`);
        }
        
        if (exportData.bettingHistory) {
            stats.push(`買い目履歴: ${exportData.bettingHistory.length}件`);
        }
        
        return stats.join('\\n');
    }
    
    // インポートデータの統計情報を取得
    static getImportStats(importData) {
        const stats = [];
        
        if (importData.learningData) {
            const accuracy = importData.learningData.accuracy || {};
            const historyCount = importData.learningData.history ? importData.learningData.history.length : 0;
            stats.push(`学習履歴: ${historyCount}件`);
            stats.push(`総予測回数: ${accuracy.totalPredictions || 0}回`);
            
            if (accuracy.totalPredictions > 0) {
                const winRate = ((accuracy.winPredictions || 0) / accuracy.totalPredictions * 100).toFixed(1);
                const placeRate = ((accuracy.placePredictions || 0) / accuracy.totalPredictions * 100).toFixed(1);
                stats.push(`勝利的中率: ${winRate}%`);
                stats.push(`複勝的中率: ${placeRate}%`);
            }
        }
        
        if (importData.bettingHistory) {
            stats.push(`買い目履歴: ${importData.bettingHistory.length}件`);
        }
        
        return stats.join('\\n');
    }
    
    // インポート確認メッセージを生成
    static getImportConfirmMessage(importData) {
        const messages = ['以下のデータをインポートします：'];
        
        if (importData.learningData) {
            messages.push('✓ 機械学習データ（予測精度・パラメータ調整）');
        }
        
        if (importData.bettingHistory) {
            messages.push('✓ 買い目推奨履歴（的中率・閾値調整）');
        }
        
        if (importData.userSettings) {
            messages.push('✓ ユーザー設定（表示モードなど）');
        }
        
        if (importData.exportDate) {
            const exportDate = new Date(importData.exportDate).toLocaleString('ja-JP');
            messages.push(`\\nエクスポート日時: ${exportDate}`);
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
            
            return true;
            
        } catch (error) {
            console.error('データ検証エラー:', error);
            return false;
        }
    }
}

// グローバル関数として公開
window.exportLearningData = DataManager.exportLearningData.bind(DataManager);
window.importLearningData = DataManager.importLearningData.bind(DataManager);