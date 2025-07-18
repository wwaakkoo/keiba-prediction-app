/**
 * Phase 8β-3: 展開係数ヒートマップ
 * 展開有利度を色の濃淡で視覚化し、相対的優位性を瞬時に把握
 */
class RaceFlowHeatmap {
    constructor() {
        this.heatmapColors = {
            // 展開係数に基づくグラデーション
            excellent: '#27ae60',    // 1.15以上 - 濃い緑
            verygood: '#2ecc71',     // 1.10-1.15 - 緑
            good: '#58d68d',         // 1.05-1.10 - 薄い緑
            neutral: '#f39c12',      // 0.95-1.05 - オレンジ
            poor: '#e74c3c',         // 0.90-0.95 - 赤
            verypoor: '#c0392b',     // 0.85-0.90 - 濃い赤
            terrible: '#922b21'      // 0.85未満 - 超濃い赤
        };
        
        this.temperatureScale = [
            { min: 1.15, color: this.heatmapColors.excellent, label: '超有利', intensity: 100 },
            { min: 1.10, color: this.heatmapColors.verygood, label: '非常に有利', intensity: 85 },
            { min: 1.05, color: this.heatmapColors.good, label: '有利', intensity: 70 },
            { min: 0.95, color: this.heatmapColors.neutral, label: '普通', intensity: 50 },
            { min: 0.90, color: this.heatmapColors.poor, label: '不利', intensity: 30 },
            { min: 0.85, color: this.heatmapColors.verypoor, label: '非常に不利', intensity: 15 },
            { min: 0.00, color: this.heatmapColors.terrible, label: '超不利', intensity: 5 }
        ];
        
        console.log('🔥 展開係数ヒートマップシステム初期化完了');
    }

    /**
     * ヒートマップの表示
     * @param {Object} prediction - 展開予想結果
     * @param {string} targetElementId - 表示先のDOM要素ID
     */
    displayHeatmap(prediction, targetElementId = 'raceFlowHeatmap') {
        const container = document.getElementById(targetElementId);
        if (!container) {
            console.error('❌ ヒートマップ表示先要素が見つかりません:', targetElementId);
            return;
        }

        console.log('🔥 展開係数ヒートマップ表示開始');

        // データ準備
        const heatmapData = this.prepareHeatmapData(prediction.finalImpacts);
        
        // ヒートマップHTML生成
        const heatmapHTML = this.generateHeatmapHTML(heatmapData, prediction.summary);
        container.innerHTML = heatmapHTML;

        // インタラクティブ機能追加
        this.addHeatmapInteractivity(container, heatmapData);

        console.log('✅ 展開係数ヒートマップ表示完了');
    }

    /**
     * ヒートマップデータの準備
     */
    prepareHeatmapData(finalImpacts) {
        // 展開係数でソート（降順）
        const sortedData = [...finalImpacts].sort((a, b) => b.flowImpactFactor - a.flowImpactFactor);
        
        // 各馬の展開係数に基づく色とランクを計算
        return sortedData.map((horse, index) => {
            const factor = horse.flowImpactFactor;
            const colorData = this.getColorFromFactor(factor);
            const relativeRank = index + 1;
            const percentile = ((sortedData.length - index) / sortedData.length) * 100;
            
            return {
                horse: horse.horse,
                runningStyle: horse.runningStyle,
                gateNumber: horse.gateNumber,
                flowImpactFactor: factor,
                kellyAdjustmentFactor: horse.kellyAdjustmentFactor,
                finalRecommendation: horse.finalRecommendation,
                explanation: horse.explanation,
                colorData: colorData,
                relativeRank: relativeRank,
                percentile: percentile,
                cornerPositions: horse.cornerPositions
            };
        });
    }

    /**
     * 展開係数から色情報を取得
     */
    getColorFromFactor(factor) {
        for (const scale of this.temperatureScale) {
            if (factor >= scale.min) {
                return {
                    color: scale.color,
                    label: scale.label,
                    intensity: scale.intensity,
                    backgroundOpacity: scale.intensity / 100
                };
            }
        }
        return {
            color: this.heatmapColors.terrible,
            label: '超不利',
            intensity: 5,
            backgroundOpacity: 0.05
        };
    }

    /**
     * ヒートマップHTML生成
     */
    generateHeatmapHTML(heatmapData, summary) {
        return `
            <div class="race-flow-heatmap" style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <!-- ヘッダー -->
                <div class="heatmap-header" style="text-align: center; margin-bottom: 25px;">
                    <h3 style="color: #2c3e50; margin-bottom: 10px;">🔥 展開係数ヒートマップ</h3>
                    <p style="color: #7f8c8d; font-size: 0.9em;">色の濃淡で展開有利度を視覚化</p>
                </div>

                <!-- 温度スケール凡例 -->
                <div class="temperature-legend" style="margin-bottom: 25px;">
                    <h4 style="color: #2c3e50; margin-bottom: 15px; text-align: center;">📊 展開有利度スケール</h4>
                    <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 8px;">
                        ${this.temperatureScale.map(scale => `
                            <div class="legend-item" style="display: flex; align-items: center; background: ${scale.color}20; 
                                                              border: 1px solid ${scale.color}; border-radius: 20px; 
                                                              padding: 6px 12px; font-size: 0.8em;">
                                <div style="width: 12px; height: 12px; background: ${scale.color}; 
                                           border-radius: 50%; margin-right: 6px;"></div>
                                <span style="color: ${scale.color}; font-weight: bold;">${scale.label}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- ヒートマップグリッド -->
                <div class="heatmap-grid" style="margin-bottom: 25px;">
                    <h4 style="color: #2c3e50; margin-bottom: 15px; text-align: center;">🌡️ 展開有利度マップ</h4>
                    ${this.generateHeatmapGrid(heatmapData)}
                </div>

                <!-- 詳細比較テーブル -->
                <div class="heatmap-table" style="margin-bottom: 25px;">
                    <h4 style="color: #2c3e50; margin-bottom: 15px; text-align: center;">📈 詳細比較データ</h4>
                    ${this.generateHeatmapTable(heatmapData)}
                </div>

                <!-- 統計サマリー -->
                <div class="heatmap-stats" style="margin-top: 25px;">
                    ${this.generateHeatmapStats(heatmapData, summary)}
                </div>

                <!-- インタラクティブコントロール -->
                <div class="heatmap-controls" style="margin-top: 20px; text-align: center;">
                    <button class="sort-by-factor" style="background: #3498db; color: white; border: none; 
                                                           padding: 8px 16px; border-radius: 6px; margin: 5px; 
                                                           cursor: pointer;">係数順ソート</button>
                    <button class="sort-by-gate" style="background: #e67e22; color: white; border: none; 
                                                        padding: 8px 16px; border-radius: 6px; margin: 5px; 
                                                        cursor: pointer;">枠順ソート</button>
                    <button class="sort-by-style" style="background: #9b59b6; color: white; border: none; 
                                                         padding: 8px 16px; border-radius: 6px; margin: 5px; 
                                                         cursor: pointer;">脚質別ソート</button>
                </div>
            </div>
        `;
    }

    /**
     * ヒートマップグリッド生成
     */
    generateHeatmapGrid(heatmapData) {
        // レスポンシブグリッドレイアウト
        const gridCols = Math.min(4, Math.ceil(Math.sqrt(heatmapData.length))); // 最大4列

        return `
            <div class="heatmap-grid-container" style="display: grid; 
                                                       grid-template-columns: repeat(${gridCols}, 1fr); 
                                                       gap: 12px;">
                ${heatmapData.map((data, index) => {
                    const intensityAlpha = data.colorData.backgroundOpacity;
                    const borderIntensity = Math.max(0.3, intensityAlpha);
                    
                    return `
                        <div class="heatmap-cell" data-horse="${data.horse.name}" 
                             style="background: linear-gradient(135deg, 
                                                               ${data.colorData.color}${Math.round(intensityAlpha * 255).toString(16).padStart(2, '0')}, 
                                                               white);
                                    border: 2px solid ${data.colorData.color};
                                    border-radius: 12px;
                                    padding: 15px;
                                    text-align: center;
                                    cursor: pointer;
                                    transition: all 0.3s ease;
                                    position: relative;
                                    min-height: 120px;
                                    display: flex;
                                    flex-direction: column;
                                    justify-content: center;"
                             onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 8px 20px rgba(0,0,0,0.15)'"
                             onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'">
                            
                            <!-- ランクバッジ -->
                            <div style="position: absolute; top: -8px; right: -8px; 
                                        background: ${data.colorData.color}; color: white; 
                                        width: 24px; height: 24px; border-radius: 50%; 
                                        display: flex; align-items: center; justify-content: center; 
                                        font-size: 0.8em; font-weight: bold;">
                                ${data.relativeRank}
                            </div>
                            
                            <!-- 馬名 -->
                            <div style="font-weight: bold; color: #2c3e50; margin-bottom: 8px; 
                                        font-size: 0.9em; line-height: 1.2;">
                                ${data.horse.name}
                            </div>
                            
                            <!-- 展開係数 -->
                            <div style="font-size: 1.4em; font-weight: bold; 
                                        color: ${data.colorData.color}; margin-bottom: 6px;">
                                ${data.flowImpactFactor.toFixed(3)}
                            </div>
                            
                            <!-- 脚質・枠 -->
                            <div style="font-size: 0.8em; color: #7f8c8d; margin-bottom: 4px;">
                                ${this.getStyleLabel(data.runningStyle)} / ${data.gateNumber}枠
                            </div>
                            
                            <!-- 評価ラベル -->
                            <div style="font-size: 0.75em; padding: 3px 8px; 
                                        background: ${data.colorData.color}; color: white; 
                                        border-radius: 10px; display: inline-block;">
                                ${data.colorData.label}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * ヒートマップテーブル生成
     */
    generateHeatmapTable(heatmapData) {
        return `
            <div style="overflow-x: auto;">
                <table id="heatmapTable" style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                    <thead>
                        <tr style="background: #34495e; color: white;">
                            <th style="padding: 12px 8px; text-align: center;">順位</th>
                            <th style="padding: 12px 8px; text-align: left;">馬名</th>
                            <th style="padding: 12px 8px; text-align: center;">展開係数</th>
                            <th style="padding: 12px 8px; text-align: center;">Kelly係数</th>
                            <th style="padding: 12px 8px; text-align: center;">脚質</th>
                            <th style="padding: 12px 8px; text-align: center;">枠順</th>
                            <th style="padding: 12px 8px; text-align: center;">パーセンタイル</th>
                            <th style="padding: 12px 8px; text-align: center;">総合評価</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${heatmapData.map((data, index) => `
                            <tr class="heatmap-row" data-horse="${data.horse.name}"
                                style="border-bottom: 1px solid #ecf0f1; 
                                       background: linear-gradient(90deg, ${data.colorData.color}15, transparent 50%);
                                       cursor: pointer;"
                                onmouseover="this.style.background='${data.colorData.color}25'"
                                onmouseout="this.style.background='linear-gradient(90deg, ${data.colorData.color}15, transparent 50%)'">
                                
                                <td style="padding: 12px 8px; text-align: center; font-weight: bold; color: ${data.colorData.color};">
                                    ${data.relativeRank}
                                </td>
                                <td style="padding: 12px 8px; font-weight: bold;">
                                    ${data.horse.name}
                                </td>
                                <td style="padding: 12px 8px; text-align: center; font-weight: bold; color: ${data.colorData.color};">
                                    ${data.flowImpactFactor.toFixed(3)}
                                </td>
                                <td style="padding: 12px 8px; text-align: center;">
                                    ${data.kellyAdjustmentFactor.toFixed(3)}
                                </td>
                                <td style="padding: 12px 8px; text-align: center;">
                                    <span style="padding: 4px 8px; border-radius: 12px; 
                                                 background: ${this.getStyleColor(data.runningStyle)}20; 
                                                 color: ${this.getStyleColor(data.runningStyle)}; 
                                                 font-size: 0.8em;">
                                        ${this.getStyleLabel(data.runningStyle)}
                                    </span>
                                </td>
                                <td style="padding: 12px 8px; text-align: center;">
                                    ${data.gateNumber}
                                </td>
                                <td style="padding: 12px 8px; text-align: center;">
                                    <div style="position: relative; background: #ecf0f1; height: 8px; border-radius: 4px;">
                                        <div style="position: absolute; top: 0; left: 0; height: 100%; 
                                                    background: ${data.colorData.color}; border-radius: 4px;
                                                    width: ${data.percentile}%; transition: width 1s ease;"></div>
                                    </div>
                                    <span style="font-size: 0.7em; color: #7f8c8d;">${data.percentile.toFixed(0)}%</span>
                                </td>
                                <td style="padding: 12px 8px; text-align: center;">
                                    <span style="padding: 4px 8px; border-radius: 12px; 
                                                 background: ${data.colorData.color}; color: white; 
                                                 font-size: 0.8em; font-weight: bold;">
                                        ${data.colorData.label}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * ヒートマップ統計生成
     */
    generateHeatmapStats(heatmapData, summary) {
        const factors = heatmapData.map(d => d.flowImpactFactor);
        const maxFactor = Math.max(...factors);
        const minFactor = Math.min(...factors);
        const avgFactor = factors.reduce((sum, f) => sum + f, 0) / factors.length;
        const stdDev = Math.sqrt(factors.reduce((sum, f) => sum + Math.pow(f - avgFactor, 2), 0) / factors.length);
        
        const topHorses = heatmapData.slice(0, 3);
        const bottomHorses = heatmapData.slice(-3).reverse();

        return `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <!-- 統計サマリー -->
                <div style="background: #ecf0f1; border-radius: 8px; padding: 20px;">
                    <h5 style="color: #2c3e50; margin-bottom: 15px; text-align: center;">📊 統計サマリー</h5>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9em;">
                        <div style="text-align: center; padding: 10px; background: white; border-radius: 6px;">
                            <div style="color: #e74c3c; font-weight: bold; font-size: 1.2em;">${maxFactor.toFixed(3)}</div>
                            <div style="color: #7f8c8d;">最高係数</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: white; border-radius: 6px;">
                            <div style="color: #3498db; font-weight: bold; font-size: 1.2em;">${minFactor.toFixed(3)}</div>
                            <div style="color: #7f8c8d;">最低係数</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: white; border-radius: 6px;">
                            <div style="color: #f39c12; font-weight: bold; font-size: 1.2em;">${avgFactor.toFixed(3)}</div>
                            <div style="color: #7f8c8d;">平均係数</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: white; border-radius: 6px;">
                            <div style="color: #9b59b6; font-weight: bold; font-size: 1.2em;">${stdDev.toFixed(3)}</div>
                            <div style="color: #7f8c8d;">標準偏差</div>
                        </div>
                    </div>
                </div>

                <!-- トップ3 -->
                <div style="background: #d5f4e6; border-radius: 8px; padding: 20px;">
                    <h5 style="color: #27ae60; margin-bottom: 15px; text-align: center;">🏆 展開有利TOP3</h5>
                    ${topHorses.map((horse, index) => `
                        <div style="background: white; border-radius: 6px; padding: 12px; margin-bottom: 8px; 
                                    border-left: 4px solid ${horse.colorData.color};">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-weight: bold;">${index + 1}. ${horse.horse.name}</span>
                                <span style="color: ${horse.colorData.color}; font-weight: bold;">${horse.flowImpactFactor.toFixed(3)}</span>
                            </div>
                            <div style="font-size: 0.8em; color: #7f8c8d; margin-top: 4px;">
                                ${horse.explanation}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * インタラクティブ機能追加
     */
    addHeatmapInteractivity(container, heatmapData) {
        // ソート機能
        const sortByFactor = container.querySelector('.sort-by-factor');
        const sortByGate = container.querySelector('.sort-by-gate');
        const sortByStyle = container.querySelector('.sort-by-style');

        sortByFactor?.addEventListener('click', () => {
            const sorted = [...heatmapData].sort((a, b) => b.flowImpactFactor - a.flowImpactFactor);
            this.updateTableDisplay(container, sorted);
        });

        sortByGate?.addEventListener('click', () => {
            const sorted = [...heatmapData].sort((a, b) => a.gateNumber - b.gateNumber);
            this.updateTableDisplay(container, sorted);
        });

        sortByStyle?.addEventListener('click', () => {
            const styleOrder = ['escape', 'leader', 'stalker', 'closer'];
            const sorted = [...heatmapData].sort((a, b) => {
                return styleOrder.indexOf(a.runningStyle) - styleOrder.indexOf(b.runningStyle);
            });
            this.updateTableDisplay(container, sorted);
        });

        // セルクリック機能
        const cells = container.querySelectorAll('.heatmap-cell');
        cells.forEach(cell => {
            cell.addEventListener('click', (e) => {
                const horseName = e.currentTarget.dataset.horse;
                const horseData = heatmapData.find(d => d.horse.name === horseName);
                this.showHorseDetail(horseData);
            });
        });

        console.log('✅ ヒートマップインタラクティブ機能を追加しました');
    }

    /**
     * テーブル表示更新
     */
    updateTableDisplay(container, sortedData) {
        const tbody = container.querySelector('#heatmapTable tbody');
        if (tbody) {
            tbody.innerHTML = sortedData.map((data, index) => `
                <tr class="heatmap-row" data-horse="${data.horse.name}"
                    style="border-bottom: 1px solid #ecf0f1; 
                           background: linear-gradient(90deg, ${data.colorData.color}15, transparent 50%);
                           cursor: pointer;">
                    <td style="padding: 12px 8px; text-align: center; font-weight: bold; color: ${data.colorData.color};">
                        ${index + 1}
                    </td>
                    <td style="padding: 12px 8px; font-weight: bold;">
                        ${data.horse.name}
                    </td>
                    <td style="padding: 12px 8px; text-align: center; font-weight: bold; color: ${data.colorData.color};">
                        ${data.flowImpactFactor.toFixed(3)}
                    </td>
                    <td style="padding: 12px 8px; text-align: center;">
                        ${data.kellyAdjustmentFactor.toFixed(3)}
                    </td>
                    <td style="padding: 12px 8px; text-align: center;">
                        <span style="padding: 4px 8px; border-radius: 12px; 
                                     background: ${this.getStyleColor(data.runningStyle)}20; 
                                     color: ${this.getStyleColor(data.runningStyle)}; 
                                     font-size: 0.8em;">
                            ${this.getStyleLabel(data.runningStyle)}
                        </span>
                    </td>
                    <td style="padding: 12px 8px; text-align: center;">
                        ${data.gateNumber}
                    </td>
                    <td style="padding: 12px 8px; text-align: center;">
                        <div style="position: relative; background: #ecf0f1; height: 8px; border-radius: 4px;">
                            <div style="position: absolute; top: 0; left: 0; height: 100%; 
                                        background: ${data.colorData.color}; border-radius: 4px;
                                        width: ${data.percentile}%; transition: width 1s ease;"></div>
                        </div>
                        <span style="font-size: 0.7em; color: #7f8c8d;">${data.percentile.toFixed(0)}%</span>
                    </td>
                    <td style="padding: 12px 8px; text-align: center;">
                        <span style="padding: 4px 8px; border-radius: 12px; 
                                     background: ${data.colorData.color}; color: white; 
                                     font-size: 0.8em; font-weight: bold;">
                            ${data.colorData.label}
                        </span>
                    </td>
                </tr>
            `).join('');
        }
    }

    /**
     * 馬詳細表示
     */
    showHorseDetail(horseData) {
        alert(`🏇 ${horseData.horse.name}\n\n` +
              `展開係数: ${horseData.flowImpactFactor.toFixed(3)}\n` +
              `Kelly係数: ${horseData.kellyAdjustmentFactor.toFixed(3)}\n` +
              `脚質: ${this.getStyleLabel(horseData.runningStyle)}\n` +
              `枠順: ${horseData.gateNumber}枠\n` +
              `評価: ${horseData.colorData.label}\n\n` +
              `${horseData.explanation}`);
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

    getStyleColor(style) {
        const colors = {
            'escape': '#e74c3c',
            'leader': '#3498db',
            'stalker': '#f39c12',
            'closer': '#27ae60'
        };
        return colors[style] || '#95a5a6';
    }

    /**
     * 単体デモ機能
     */
    static showDemo() {
        if (typeof window.demoRaceFlowPrediction === 'function') {
            const prediction = window.demoRaceFlowPrediction();
            const heatmap = new RaceFlowHeatmap();
            
            // デモ用コンテナを作成
            const demoContainer = document.createElement('div');
            demoContainer.id = 'raceFlowHeatmapDemo';
            demoContainer.style.cssText = `
                position: fixed;
                top: 30px;
                left: 30px;
                right: 30px;
                bottom: 30px;
                z-index: 10003;
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
                z-index: 10004;
            `;
            closeBtn.onclick = () => demoContainer.remove();
            
            demoContainer.appendChild(closeBtn);
            document.body.appendChild(demoContainer);
            
            heatmap.displayHeatmap(prediction, 'raceFlowHeatmapDemo');
            
            console.log('🔥 展開係数ヒートマップデモを表示しました');
        } else {
            console.warn('⚠️ デモ用の展開予想データが見つかりません');
        }
    }
}

// グローバル公開
window.RaceFlowHeatmap = RaceFlowHeatmap;

// デモ機能
window.demoRaceFlowHeatmap = function() {
    RaceFlowHeatmap.showDemo();
};

console.log('🔥 Phase 8β-3: 展開係数ヒートマップ実装完了');
console.log('📝 使用方法: demoRaceFlowHeatmap() でデモ実行');