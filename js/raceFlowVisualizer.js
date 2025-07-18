/**
 * Phase 8β-2: 展開予想ビジュアライザー
 * レースの隊列・コーナー位置を視覚的に表示
 */
class RaceFlowVisualizer {
    constructor() {
        this.colors = {
            escape: '#ff6b6b',      // 逃げ - 赤
            leader: '#4ecdc4',      // 先行 - 青緑
            stalker: '#45b7d1',     // 差し - 青
            closer: '#96ceb4',      // 追込 - 緑
            highly_favored: '#27ae60',  // 超有利 - 濃い緑
            favored: '#2ecc71',         // 有利 - 緑
            neutral: '#f39c12',         // 普通 - オレンジ
            unfavored: '#e74c3c',       // 不利 - 赤
            highly_unfavored: '#c0392b' // 超不利 - 濃い赤
        };
        
        this.styleIcons = {
            escape: '🏃',
            leader: '🐎',
            stalker: '⚡',
            closer: '🚀'
        };
        
        console.log('🖼️ 展開予想ビジュアライザー初期化完了');
    }

    /**
     * 隊列ビジュアライザーの表示
     * @param {Object} prediction - 展開予想結果
     * @param {string} targetElementId - 表示先のDOM要素ID
     */
    displayRaceFlowVisualization(prediction, targetElementId = 'raceFlowVisualization') {
        const container = document.getElementById(targetElementId);
        if (!container) {
            console.error('❌ 表示先要素が見つかりません:', targetElementId);
            return;
        }

        console.log('🖼️ 隊列ビジュアライザー表示開始');

        // コンテナをクリア
        container.innerHTML = '';

        // ビジュアライザーのHTML構造を作成
        const visualizerHTML = this.generateVisualizerHTML(prediction);
        container.innerHTML = visualizerHTML;

        // インタラクティブ機能を追加
        this.addInteractivity(container);

        console.log('✅ 隊列ビジュアライザー表示完了');
    }

    /**
     * ビジュアライザーのHTML生成
     */
    generateVisualizerHTML(prediction) {
        const { finalImpacts, summary } = prediction;

        return `
            <div class="race-flow-visualizer" style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <div class="visualizer-header" style="text-align: center; margin-bottom: 25px;">
                    <h3 style="color: #2c3e50; margin-bottom: 10px;">🏇 レース展開ビジュアライザー</h3>
                    <div style="display: flex; justify-content: center; gap: 20px; font-size: 0.9em; color: #7f8c8d;">
                        <span>有利: ${summary.favoredCount}頭</span>
                        <span>不利: ${summary.unfavoredCount}頭</span>
                        <span>平均係数: ${summary.averageImpactFactor.toFixed(3)}</span>
                    </div>
                </div>

                <!-- コーナー選択タブ -->
                <div class="corner-tabs" style="display: flex; justify-content: center; margin-bottom: 20px; background: #ecf0f1; border-radius: 25px; padding: 5px;">
                    ${[1, 2, 3, 4].map(corner => `
                        <button class="corner-tab" data-corner="${corner}" 
                                style="flex: 1; padding: 8px 16px; background: ${corner === 1 ? '#3498db' : 'transparent'}; 
                                       color: ${corner === 1 ? 'white' : '#7f8c8d'}; border: none; border-radius: 20px; 
                                       cursor: pointer; transition: all 0.3s ease; font-weight: bold;">
                            ${corner}コーナー
                        </button>
                    `).join('')}
                </div>

                <!-- 隊列表示エリア -->
                <div class="formation-display" style="margin-bottom: 25px;">
                    ${this.generateFormationHTML(finalImpacts, 1)}
                </div>

                <!-- 詳細分析テーブル -->
                <div class="detailed-analysis" style="margin-top: 25px;">
                    <h4 style="color: #2c3e50; margin-bottom: 15px; text-align: center;">📊 詳細展開分析</h4>
                    ${this.generateDetailedTableHTML(finalImpacts)}
                </div>

                <!-- 展開ハイライト -->
                <div class="flow-highlights" style="margin-top: 25px;">
                    ${this.generateHighlightsHTML(finalImpacts)}
                </div>
            </div>
        `;
    }

    /**
     * 隊列表示HTML生成
     */
    generateFormationHTML(finalImpacts, corner) {
        // 指定コーナーでの位置順にソート
        const cornerKey = `corner${corner}`;
        const sortedHorses = [...finalImpacts].sort((a, b) => 
            a.cornerPositions[cornerKey] - b.cornerPositions[cornerKey]
        );

        return `
            <div class="formation-container" style="background: #f8f9fa; border-radius: 8px; padding: 20px;">
                <div class="track-representation" style="position: relative; min-height: 300px;">
                    <div class="track-header" style="text-align: center; margin-bottom: 15px; color: #2c3e50; font-weight: bold;">
                        ${corner}コーナー通過順位予想
                    </div>
                    
                    <div class="horses-formation" style="display: flex; flex-direction: column; gap: 8px;">
                        ${sortedHorses.map((horse, index) => {
                            const position = horse.cornerPositions[cornerKey];
                            const styleColor = this.colors[horse.runningStyle] || '#95a5a6';
                            const recommendationColor = this.colors[horse.finalRecommendation] || '#95a5a6';
                            const styleIcon = this.styleIcons[horse.runningStyle] || '🐎';
                            
                            return `
                                <div class="horse-position" 
                                     style="display: flex; align-items: center; background: white; 
                                            border-radius: 8px; padding: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                            border-left: 4px solid ${recommendationColor}; cursor: pointer;
                                            transition: all 0.3s ease;"
                                     data-horse="${horse.horse.name}"
                                     onmouseover="this.style.transform='translateX(5px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)'"
                                     onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'">
                                    
                                    <div class="position-number" 
                                         style="width: 30px; height: 30px; background: ${styleColor}; 
                                                color: white; border-radius: 50%; display: flex; 
                                                align-items: center; justify-content: center; 
                                                font-weight: bold; margin-right: 15px;">
                                        ${position}
                                    </div>
                                    
                                    <div class="horse-info" style="flex: 1;">
                                        <div style="display: flex; align-items: center; margin-bottom: 4px;">
                                            <span style="font-size: 1.1em; margin-right: 8px;">${styleIcon}</span>
                                            <strong style="color: #2c3e50;">${horse.horse.name}</strong>
                                            <span style="margin-left: 8px; font-size: 0.9em; color: #7f8c8d;">${horse.gateNumber}枠</span>
                                        </div>
                                        <div style="font-size: 0.85em; color: #7f8c8d;">
                                            ${horse.explanation}
                                        </div>
                                    </div>
                                    
                                    <div class="flow-factor" style="text-align: right;">
                                        <div style="font-weight: bold; color: ${recommendationColor};">
                                            ${horse.flowImpactFactor.toFixed(3)}
                                        </div>
                                        <div style="font-size: 0.8em; color: #7f8c8d;">
                                            ${this.getRecommendationLabel(horse.finalRecommendation)}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 詳細テーブルHTML生成
     */
    generateDetailedTableHTML(finalImpacts) {
        return `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                    <thead>
                        <tr style="background: #34495e; color: white;">
                            <th style="padding: 12px 8px; text-align: left;">馬名</th>
                            <th style="padding: 12px 8px; text-align: center;">脚質</th>
                            <th style="padding: 12px 8px; text-align: center;">枠順</th>
                            <th style="padding: 12px 8px; text-align: center;">1C</th>
                            <th style="padding: 12px 8px; text-align: center;">2C</th>
                            <th style="padding: 12px 8px; text-align: center;">3C</th>
                            <th style="padding: 12px 8px; text-align: center;">4C</th>
                            <th style="padding: 12px 8px; text-align: center;">展開係数</th>
                            <th style="padding: 12px 8px; text-align: center;">評価</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${finalImpacts.map((horse, index) => {
                            const recommendationColor = this.colors[horse.finalRecommendation] || '#95a5a6';
                            return `
                                <tr style="border-bottom: 1px solid #ecf0f1; ${index % 2 === 0 ? 'background: #f8f9fa;' : ''}">
                                    <td style="padding: 12px 8px; font-weight: bold;">${horse.horse.name}</td>
                                    <td style="padding: 12px 8px; text-align: center;">
                                        <span style="padding: 4px 8px; border-radius: 12px; background: ${this.colors[horse.runningStyle]}20; color: ${this.colors[horse.runningStyle]}; font-size: 0.8em;">
                                            ${this.getStyleLabel(horse.runningStyle)}
                                        </span>
                                    </td>
                                    <td style="padding: 12px 8px; text-align: center;">${horse.gateNumber}</td>
                                    <td style="padding: 12px 8px; text-align: center;">${horse.cornerPositions.corner1}</td>
                                    <td style="padding: 12px 8px; text-align: center;">${horse.cornerPositions.corner2}</td>
                                    <td style="padding: 12px 8px; text-align: center;">${horse.cornerPositions.corner3}</td>
                                    <td style="padding: 12px 8px; text-align: center;">${horse.cornerPositions.corner4}</td>
                                    <td style="padding: 12px 8px; text-align: center; font-weight: bold; color: ${recommendationColor};">
                                        ${horse.flowImpactFactor.toFixed(3)}
                                    </td>
                                    <td style="padding: 12px 8px; text-align: center;">
                                        <span style="padding: 4px 8px; border-radius: 12px; background: ${recommendationColor}20; color: ${recommendationColor}; font-size: 0.8em;">
                                            ${this.getRecommendationLabel(horse.finalRecommendation)}
                                        </span>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * ハイライト情報HTML生成
     */
    generateHighlightsHTML(finalImpacts) {
        const topFavored = finalImpacts.filter(h => h.finalRecommendation === 'highly_favored' || h.finalRecommendation === 'favored')
                                      .sort((a, b) => b.flowImpactFactor - a.flowImpactFactor)
                                      .slice(0, 3);
        
        const topUnfavored = finalImpacts.filter(h => h.finalRecommendation === 'unfavored' || h.finalRecommendation === 'highly_unfavored')
                                        .sort((a, b) => a.flowImpactFactor - b.flowImpactFactor)
                                        .slice(0, 3);

        return `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="favored-highlights" style="background: #d5f4e6; border-radius: 8px; padding: 15px;">
                    <h5 style="color: #27ae60; margin-bottom: 10px; text-align: center;">🔥 展開有利馬</h5>
                    ${topFavored.length > 0 ? topFavored.map(horse => `
                        <div style="background: white; border-radius: 6px; padding: 10px; margin-bottom: 8px; border-left: 3px solid #27ae60;">
                            <strong>${horse.horse.name}</strong> (${horse.flowImpactFactor.toFixed(3)})
                            <div style="font-size: 0.8em; color: #7f8c8d; margin-top: 4px;">${horse.explanation}</div>
                        </div>
                    `).join('') : '<div style="text-align: center; color: #7f8c8d; font-style: italic;">該当馬なし</div>'}
                </div>

                <div class="unfavored-highlights" style="background: #ffeaa7; border-radius: 8px; padding: 15px;">
                    <h5 style="color: #e17055; margin-bottom: 10px; text-align: center;">⚠️ 展開注意馬</h5>
                    ${topUnfavored.length > 0 ? topUnfavored.map(horse => `
                        <div style="background: white; border-radius: 6px; padding: 10px; margin-bottom: 8px; border-left: 3px solid #e17055;">
                            <strong>${horse.horse.name}</strong> (${horse.flowImpactFactor.toFixed(3)})
                            <div style="font-size: 0.8em; color: #7f8c8d; margin-top: 4px;">${horse.explanation}</div>
                        </div>
                    `).join('') : '<div style="text-align: center; color: #7f8c8d; font-style: italic;">該当馬なし</div>'}
                </div>
            </div>
        `;
    }

    /**
     * インタラクティブ機能の追加
     */
    addInteractivity(container) {
        // コーナータブの切り替え機能
        const tabs = container.querySelectorAll('.corner-tab');
        const formationDisplay = container.querySelector('.formation-display');

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                // タブのアクティブ状態を更新
                tabs.forEach(t => {
                    t.style.background = 'transparent';
                    t.style.color = '#7f8c8d';
                });
                e.target.style.background = '#3498db';
                e.target.style.color = 'white';

                // 隊列表示を更新
                const corner = parseInt(e.target.dataset.corner);
                // 現在の予測データを再取得して表示更新
                // (実際の実装では、グローバル変数や状態管理で予測データを保持)
                if (window.currentRaceFlowPrediction) {
                    formationDisplay.innerHTML = this.generateFormationHTML(
                        window.currentRaceFlowPrediction.finalImpacts, 
                        corner
                    );
                }
            });
        });

        console.log('✅ インタラクティブ機能を追加しました');
    }

    /**
     * ヘルパーメソッド
     */
    getStyleLabel(style) {
        const labels = {
            'escape': '逃げ',
            'leader': '先行',
            'stalker': '差し',
            'closer': '追込'
        };
        return labels[style] || style;
    }

    getRecommendationLabel(recommendation) {
        const labels = {
            'highly_favored': '超有利',
            'favored': '有利',
            'neutral': '普通',
            'unfavored': '不利',
            'highly_unfavored': '超不利'
        };
        return labels[recommendation] || recommendation;
    }

    /**
     * デモ用ビジュアライザー表示
     */
    static showDemo() {
        if (typeof window.demoRaceFlowPrediction === 'function') {
            const prediction = window.demoRaceFlowPrediction();
            const visualizer = new RaceFlowVisualizer();
            
            // デモ用コンテナを作成
            const demoContainer = document.createElement('div');
            demoContainer.id = 'raceFlowVisualizationDemo';
            demoContainer.style.cssText = `
                position: fixed;
                top: 50px;
                left: 50px;
                right: 50px;
                bottom: 50px;
                z-index: 10001;
                background: white;
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                overflow-y: auto;
            `;
            
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '✕ 閉じる';
            closeBtn.style.cssText = `
                position: absolute;
                top: 20px;
                right: 20px;
                background: #e74c3c;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
            `;
            closeBtn.onclick = () => demoContainer.remove();
            
            demoContainer.appendChild(closeBtn);
            document.body.appendChild(demoContainer);
            
            visualizer.displayRaceFlowVisualization(prediction, 'raceFlowVisualizationDemo');
            
            console.log('🎬 展開予想ビジュアライザーデモを表示しました');
        } else {
            console.warn('⚠️ デモ用の展開予想データが見つかりません');
        }
    }
}

// グローバル公開
window.RaceFlowVisualizer = RaceFlowVisualizer;

// デモ機能
window.demoRaceFlowVisualizer = function() {
    RaceFlowVisualizer.showDemo();
};

console.log('🖼️ Phase 8β-2: 展開予想ビジュアライザー実装完了');
console.log('📝 使用方法: demoRaceFlowVisualizer() でデモ実行');