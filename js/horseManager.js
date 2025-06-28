// 馬データ管理機能（データ検証強化版）
class HorseManager {
    static horseCount = 0;
    
    // データ検証用の状態管理
    static validationErrors = [];
    static dataQualityThresholds = {
        minOdds: 1.0,
        maxOdds: 999.9,
        minAge: 2,
        maxAge: 12,
        maxLastRaceOrder: 20,
        minWeight: 380,
        maxWeight: 580,
        maxWeightChange: 20
    };

    // 着順データを安全に数値化するユーティリティ関数
    static parseRaceOrder(orderValue) {
        if (!orderValue) return null;
        
        const orderStr = String(orderValue).trim();
        
        // 中止・取消・除外・失格の場合
        if (orderStr === 'DNS' || orderStr === '中' || orderStr === '取' || orderStr === '除' || orderStr === '失') {
            return 99; // 大きな数値として扱う（最下位扱い）
        }
        
        // 数値の場合
        const numericOrder = parseInt(orderStr);
        if (!isNaN(numericOrder) && numericOrder > 0) {
            return numericOrder;
        }
        
        return null;
    }

    static addHorse() {
        // データ品質チェックを実行
        if (!this.checkSystemHealth()) {
            showMessage('システムのデータ品質に問題があります。データを確認してください。', 'warning', 5000);
        }
        
        this.horseCount++;
        const container = document.getElementById('horsesContainer');
        
        const horseCard = document.createElement('div');
        horseCard.className = 'horse-card';
        horseCard.innerHTML = `
            <div class="horse-header">
                <h3>馬 ${this.horseCount}</h3>
                <button class="btn-remove" onclick="HorseManager.removeHorse(this)">削除</button>
            </div>
            <div class="horse-content">
                <div class="form-group">
                    <label>馬名</label>
                    <input type="text" name="horseName" placeholder="馬名を入力">
                </div>
                <div class="form-group">
                    <label>オッズ</label>
                    <input type="number" name="odds" step="0.1" placeholder="10.0">
                </div>
                <div class="form-group">
                    <label>前走着順</label>
                    <select name="lastRace">
                        <option value="1">1着</option>
                        <option value="2">2着</option>
                        <option value="3">3着</option>
                        <option value="4">4着</option>
                        <option value="5">5着</option>
                        <option value="6" selected>6着</option>
                        <option value="7">7着</option>
                        <option value="8">8着</option>
                        <option value="9">9着</option>
                        <option value="10">10着以下</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>騎手</label>
                    <select name="jockey" onchange="HorseManager.toggleCustomJockey(this)">
                        <option value="武豊">武豊</option>
                        <option value="川田将雅">川田将雅</option>
                        <option value="C.ルメール">C.ルメール</option>
                        <option value="横山武史">横山武史</option>
                        <option value="戸崎圭太">戸崎圭太</option>
                        <option value="福永祐一">福永祐一</option>
                        <option value="M.デムーロ">M.デムーロ</option>
                        <option value="横山典弘">横山典弘</option>
                        <option value="岩田康誠">岩田康誠</option>
                        <option value="池添謙一">池添謙一</option>
                        <option value="横山和生">横山和生</option>
                        <option value="D.レーン">D.レーン</option>
                        <option value="浜中俊">浜中俊</option>
                        <option value="丹内祐次">丹内祐次</option>
                        <option value="北村宏司">北村宏司</option>
                        <option value="松山弘平">松山弘平</option>
                        <option value="岩田望来">岩田望来</option>
                        <option value="津村明秀">津村明秀</option>
                        <option value="北村友一">北村友一</option>
                        <option value="田辺裕信">田辺裕信</option>
                        <option value="佐々木大輔">佐々木大輔</option>
                        <option value="坂井瑠星">坂井瑠星</option>
                        <option value="内田博幸">内田博幸</option>
                        <option value="菅原明良">菅原明良</option>
                        <option value="シュタルケ">シュタルケ</option>
                        <option value="木幡巧也">木幡巧也</option>
                        <option value="菊沢一樹">菊沢一樹</option>
                        <option value="吉田豊">吉田豊</option>
                        <option value="custom">その他（入力）</option>
                    </select>
                    <input type="text" name="jockeyCustom" placeholder="騎手名を入力" style="display: none; margin-top: 5px;">
                </div>
                <div class="form-group">
                    <label>年齢</label>
                    <select name="age">
                        <option value="3">3歳</option>
                        <option value="4">4歳</option>
                        <option value="5" selected>5歳</option>
                        <option value="6">6歳</option>
                        <option value="7">7歳</option>
                        <option value="8">8歳以上</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>馬体重変化</label>
                    <select name="weightChange">
                        <option value="0" selected>変化なし</option>
                        <option value="1">増加</option>
                        <option value="-1">減少</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>今回レースレベル</label>
                    <select name="raceLevel">
                        <option value="G1">G1</option>
                        <option value="G2">G2</option>
                        <option value="G3">G3</option>
                        <option value="L">Listed（L）</option>
                        <option value="OP">オープン特別</option>
                        <option value="3勝">3勝クラス（1600万下）</option>
                        <option value="2勝">2勝クラス（1000万下）</option>
                        <option value="1勝" selected>1勝クラス（500万下）</option>
                        <option value="未勝利">未勝利戦</option>
                        <option value="新馬">新馬戦</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>脚質</label>
                    <select name="runningStyle">
                        <option value="" selected>未選択</option>
                        <option value="逃げ">逃げ</option>
                        <option value="先行">先行</option>
                        <option value="差し">差し</option>
                        <option value="追込">追込</option>
                        <option value="自在">自在</option>
                    </select>
                </div>
            </div>
            <div class="horse-section">
                <h4>🏁 今回のレース情報</h4>
                <div class="horse-content">
                    <div class="form-group">
                        <label>コース</label>
                        <select name="course">
                            <optgroup label="中央競馬場">
                                <option value="中山">中山</option>
                                <option value="東京">東京</option>
                                <option value="京都">京都</option>
                                <option value="阪神">阪神</option>
                                <option value="新潟">新潟</option>
                                <option value="福島">福島</option>
                                <option value="中京">中京</option>
                                <option value="小倉">小倉</option>
                                <option value="札幌">札幌</option>
                                <option value="函館">函館</option>
                            </optgroup>
                            <optgroup label="南関東地方競馬">
                                <option value="大井">大井</option>
                                <option value="船橋">船橋</option>
                                <option value="川崎">川崎</option>
                                <option value="浦和">浦和</option>
                            </optgroup>
                            <optgroup label="その他地方競馬">
                                <option value="門別">門別</option>
                                <option value="名古屋">名古屋</option>
                                <option value="笠松">笠松</option>
                                <option value="園田">園田</option>
                                <option value="姫路">姫路</option>
                                <option value="高知">高知</option>
                                <option value="佐賀">佐賀</option>
                                <option value="金沢">金沢</option>
                                <option value="盛岡">盛岡</option>
                                <option value="水沢">水沢</option>
                            </optgroup>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>距離</label>
                        <select name="distance">
                            <option value="1000">1000m</option>
                            <option value="1150">1150m</option>
                            <option value="1200">1200m</option>
                            <option value="1400">1400m</option>
                            <option value="1600" selected>1600m</option>
                            <option value="1700">1700m</option>
                            <option value="1800">1800m</option>
                            <option value="1900">1900m</option>
                            <option value="2000">2000m</option>
                            <option value="2100">2100m</option>
                            <option value="2200">2200m</option>
                            <option value="2400">2400m</option>
                            <option value="2500">2500m</option>
                            <option value="2600">2600m</option>
                            <option value="3000">3000m</option>
                            <option value="3200">3200m</option>
                            <option value="3600">3600m</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>馬場種別</label>
                        <select name="trackType">
                            <option value="芝" selected>芝</option>
                            <option value="ダート">ダート</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>天気</label>
                        <select name="weather">
                            <option value="晴" selected>晴</option>
                            <option value="曇">曇</option>
                            <option value="雨">雨</option>
                            <option value="雪">雪</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>馬場状態</label>
                        <select name="trackCondition">
                            <option value="良" selected>良</option>
                            <option value="稍重">稍重</option>
                            <option value="重">重</option>
                            <option value="不良">不良</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>休養期間</label>
                        <select name="restDays">
                            <option value="7">7日以内</option>
                            <option value="14" selected>8-14日</option>
                            <option value="21">15-21日</option>
                            <option value="28">22-28日</option>
                            <option value="35">29-35日</option>
                            <option value="42">36-42日</option>
                            <option value="49">43-49日</option>
                            <option value="56">50日以上</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="horse-section">
                <h4>📊 過去5走情報</h4>
                <div class="horse-content">
                    <!-- 前走情報 -->
                    <div style="border: 2px solid #28a745; padding: 15px; margin-bottom: 15px; border-radius: 8px; background: #f8fff8;">
                        <h5 style="color: #28a745; margin-bottom: 10px;">前走</h5>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                            <div class="form-group">
                                <label>前走コース</label>
                                <input type="text" name="lastRaceCourse" value="">
                            </div>
                            <div class="form-group">
                                <label>前走距離</label>
                                <input type="text" name="lastRaceDistance" value="">
                            </div>
                            <div class="form-group">
                                <label>前走馬場</label>
                                <input type="text" name="lastRaceTrackType" value="">
                            </div>
                            <div class="form-group">
                                <label>前走日</label>
                                <input type="text" name="lastRaceDate" value="">
                            </div>
                            <div class="form-group">
                                <label>前走タイム</label>
                                <input type="text" name="lastRaceTime" placeholder="例: 1:35.2" style="font-family: monospace;">
                            </div>
                            <div class="form-group">
                                <label>前走馬場状態</label>
                                <select name="lastRaceTrackCondition">
                                    <option value="">選択してください</option>
                                    <option value="良">良</option>
                                    <option value="稍重">稍重</option>
                                    <option value="重">重</option>
                                    <option value="不良">不良</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>前走斤量</label>
                                <input type="number" name="lastRaceWeight" step="0.5" placeholder="例: 56.0">
                            </div>
                            <div class="form-group">
                                <label>前走騎手</label>
                                <input type="text" name="lastRaceJockey" placeholder="前走騎手名">
                            </div>
                            <div class="form-group">
                                <label>前走人気</label>
                                <input type="number" name="lastRacePopularity" placeholder="例: 1">
                            </div>
                            <div class="form-group">
                                <label>前走着順</label>
                                <input type="number" name="lastRaceOrder" placeholder="例: 1">
                            </div>
                            <div class="form-group">
                                <label>前走上がり3F</label>
                                <input type="text" name="lastRaceAgari" placeholder="例: 34.1">
                            </div>
                        </div>
                    </div>
                    
                    <!-- 2走前情報 -->
                    <div style="border: 2px solid #007bff; padding: 15px; margin-bottom: 15px; border-radius: 8px; background: #f8f9ff;">
                        <h5 style="color: #007bff; margin-bottom: 10px;">2走前</h5>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                            <div class="form-group">
                                <label>2走前コース</label>
                                <input type="text" name="secondLastRaceCourse" value="">
                            </div>
                            <div class="form-group">
                                <label>2走前距離</label>
                                <input type="text" name="secondLastRaceDistance" value="">
                            </div>
                            <div class="form-group">
                                <label>2走前馬場</label>
                                <input type="text" name="secondLastRaceTrackType" value="">
                            </div>
                            <div class="form-group">
                                <label>2走前日</label>
                                <input type="text" name="secondLastRaceDate" value="">
                            </div>
                            <div class="form-group">
                                <label>2走前タイム</label>
                                <input type="text" name="secondLastRaceTime" placeholder="例: 1:35.2" style="font-family: monospace;">
                            </div>
                            <div class="form-group">
                                <label>2走前馬場状態</label>
                                <select name="secondLastRaceTrackCondition">
                                    <option value="">選択してください</option>
                                    <option value="良">良</option>
                                    <option value="稍重">稍重</option>
                                    <option value="重">重</option>
                                    <option value="不良">不良</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>2走前斤量</label>
                                <input type="number" name="secondLastRaceWeight" step="0.5" placeholder="例: 56.0">
                            </div>
                            <div class="form-group">
                                <label>2走前騎手</label>
                                <input type="text" name="secondLastRaceJockey" placeholder="2走前騎手名">
                            </div>
                            <div class="form-group">
                                <label>2走前人気</label>
                                <input type="number" name="secondLastRacePopularity" placeholder="例: 1">
                            </div>
                            <div class="form-group">
                                <label>2走前着順</label>
                                <input type="number" name="secondLastRaceOrder" placeholder="例: 1">
                            </div>
                            <div class="form-group">
                                <label>2走前上がり3F</label>
                                <input type="text" name="secondLastRaceAgari" placeholder="例: 34.1">
                            </div>
                        </div>
                    </div>
                    
                    <!-- 3〜5走前情報（折りたたみ） -->
                    <div style="margin-top: 15px;">
                        <button type="button" onclick="HorseManager.toggleExtendedRaceHistory(this)" 
                                style="background: #6c757d; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; width: 100%; text-align: left;">
                            <span style="float: right;">▼</span>
                            🗂️ 3〜5走前の詳細データを表示
                        </button>
                        <div class="extended-race-history" style="display: none; margin-top: 10px;">
                            
                            <!-- 3走前情報 -->
                            <div style="border: 2px solid #ffc107; padding: 15px; margin-bottom: 15px; border-radius: 8px; background: #fffbf0;">
                                <h5 style="color: #ffc107; margin-bottom: 10px;">3走前</h5>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                                    <div class="form-group">
                                        <label>3走前コース</label>
                                        <input type="text" name="thirdLastRaceCourse" value="">
                                    </div>
                                    <div class="form-group">
                                        <label>3走前距離</label>
                                        <input type="text" name="thirdLastRaceDistance" value="">
                                    </div>
                                    <div class="form-group">
                                        <label>3走前馬場</label>
                                        <input type="text" name="thirdLastRaceTrackType" value="">
                                    </div>
                                    <div class="form-group">
                                        <label>3走前日</label>
                                        <input type="text" name="thirdLastRaceDate" value="">
                                    </div>
                                    <div class="form-group">
                                        <label>3走前タイム</label>
                                        <input type="text" name="thirdLastRaceTime" placeholder="例: 1:35.2" style="font-family: monospace;">
                                    </div>
                                    <div class="form-group">
                                        <label>3走前馬場状態</label>
                                        <select name="thirdLastRaceTrackCondition">
                                            <option value="">選択してください</option>
                                            <option value="良">良</option>
                                            <option value="稍重">稍重</option>
                                            <option value="重">重</option>
                                            <option value="不良">不良</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>3走前斤量</label>
                                        <input type="number" name="thirdLastRaceWeight" step="0.5" placeholder="例: 56.0">
                                    </div>
                                    <div class="form-group">
                                        <label>3走前騎手</label>
                                        <input type="text" name="thirdLastRaceJockey" placeholder="3走前騎手名">
                                    </div>
                                    <div class="form-group">
                                        <label>3走前人気</label>
                                        <input type="number" name="thirdLastRacePopularity" placeholder="例: 1">
                                    </div>
                                    <div class="form-group">
                                        <label>3走前着順</label>
                                        <input type="number" name="thirdLastRaceOrder" placeholder="例: 1">
                                    </div>
                                    <div class="form-group">
                                        <label>3走前上がり3F</label>
                                        <input type="text" name="thirdLastRaceAgari" placeholder="例: 34.1">
                                    </div>
                                    <div class="form-group">
                                        <label>3走前レースレベル</label>
                                        <select name="thirdLastRaceLevel">
                                            <option value="">選択してください</option>
                                            <option value="G1">G1</option>
                                            <option value="G2">G2</option>
                                            <option value="G3">G3</option>
                                            <option value="L">Listed（L）</option>
                                            <option value="OP">オープン特別</option>
                                            <option value="3勝">3勝クラス</option>
                                            <option value="2勝">2勝クラス</option>
                                            <option value="1勝">1勝クラス</option>
                                            <option value="未勝利">未勝利戦</option>
                                            <option value="新馬">新馬戦</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 4走前情報 -->
                            <div style="border: 2px solid #dc3545; padding: 15px; margin-bottom: 15px; border-radius: 8px; background: #fff5f5;">
                                <h5 style="color: #dc3545; margin-bottom: 10px;">4走前</h5>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                                    <div class="form-group">
                                        <label>4走前コース</label>
                                        <input type="text" name="fourthLastRaceCourse" value="">
                                    </div>
                                    <div class="form-group">
                                        <label>4走前距離</label>
                                        <input type="text" name="fourthLastRaceDistance" value="">
                                    </div>
                                    <div class="form-group">
                                        <label>4走前馬場</label>
                                        <input type="text" name="fourthLastRaceTrackType" value="">
                                    </div>
                                    <div class="form-group">
                                        <label>4走前日</label>
                                        <input type="text" name="fourthLastRaceDate" value="">
                                    </div>
                                    <div class="form-group">
                                        <label>4走前タイム</label>
                                        <input type="text" name="fourthLastRaceTime" placeholder="例: 1:35.2" style="font-family: monospace;">
                                    </div>
                                    <div class="form-group">
                                        <label>4走前馬場状態</label>
                                        <select name="fourthLastRaceTrackCondition">
                                            <option value="">選択してください</option>
                                            <option value="良">良</option>
                                            <option value="稍重">稍重</option>
                                            <option value="重">重</option>
                                            <option value="不良">不良</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>4走前斤量</label>
                                        <input type="number" name="fourthLastRaceWeight" step="0.5" placeholder="例: 56.0">
                                    </div>
                                    <div class="form-group">
                                        <label>4走前騎手</label>
                                        <input type="text" name="fourthLastRaceJockey" placeholder="4走前騎手名">
                                    </div>
                                    <div class="form-group">
                                        <label>4走前人気</label>
                                        <input type="number" name="fourthLastRacePopularity" placeholder="例: 1">
                                    </div>
                                    <div class="form-group">
                                        <label>4走前着順</label>
                                        <input type="number" name="fourthLastRaceOrder" placeholder="例: 1">
                                    </div>
                                    <div class="form-group">
                                        <label>4走前上がり3F</label>
                                        <input type="text" name="fourthLastRaceAgari" placeholder="例: 34.1">
                                    </div>
                                    <div class="form-group">
                                        <label>4走前レースレベル</label>
                                        <select name="fourthLastRaceLevel">
                                            <option value="">選択してください</option>
                                            <option value="G1">G1</option>
                                            <option value="G2">G2</option>
                                            <option value="G3">G3</option>
                                            <option value="L">Listed（L）</option>
                                            <option value="OP">オープン特別</option>
                                            <option value="3勝">3勝クラス</option>
                                            <option value="2勝">2勝クラス</option>
                                            <option value="1勝">1勝クラス</option>
                                            <option value="未勝利">未勝利戦</option>
                                            <option value="新馬">新馬戦</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 5走前情報 -->
                            <div style="border: 2px solid #6f42c1; padding: 15px; margin-bottom: 15px; border-radius: 8px; background: #f8f5ff;">
                                <h5 style="color: #6f42c1; margin-bottom: 10px;">5走前</h5>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                                    <div class="form-group">
                                        <label>5走前コース</label>
                                        <input type="text" name="fifthLastRaceCourse" value="">
                                    </div>
                                    <div class="form-group">
                                        <label>5走前距離</label>
                                        <input type="text" name="fifthLastRaceDistance" value="">
                                    </div>
                                    <div class="form-group">
                                        <label>5走前馬場</label>
                                        <input type="text" name="fifthLastRaceTrackType" value="">
                                    </div>
                                    <div class="form-group">
                                        <label>5走前日</label>
                                        <input type="text" name="fifthLastRaceDate" value="">
                                    </div>
                                    <div class="form-group">
                                        <label>5走前タイム</label>
                                        <input type="text" name="fifthLastRaceTime" placeholder="例: 1:35.2" style="font-family: monospace;">
                                    </div>
                                    <div class="form-group">
                                        <label>5走前馬場状態</label>
                                        <select name="fifthLastRaceTrackCondition">
                                            <option value="">選択してください</option>
                                            <option value="良">良</option>
                                            <option value="稍重">稍重</option>
                                            <option value="重">重</option>
                                            <option value="不良">不良</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>5走前斤量</label>
                                        <input type="number" name="fifthLastRaceWeight" step="0.5" placeholder="例: 56.0">
                                    </div>
                                    <div class="form-group">
                                        <label>5走前騎手</label>
                                        <input type="text" name="fifthLastRaceJockey" placeholder="5走前騎手名">
                                    </div>
                                    <div class="form-group">
                                        <label>5走前人気</label>
                                        <input type="number" name="fifthLastRacePopularity" placeholder="例: 1">
                                    </div>
                                    <div class="form-group">
                                        <label>5走前着順</label>
                                        <input type="number" name="fifthLastRaceOrder" placeholder="例: 1">
                                    </div>
                                    <div class="form-group">
                                        <label>5走前上がり3F</label>
                                        <input type="text" name="fifthLastRaceAgari" placeholder="例: 34.1">
                                    </div>
                                    <div class="form-group">
                                        <label>5走前レースレベル</label>
                                        <select name="fifthLastRaceLevel">
                                            <option value="">選択してください</option>
                                            <option value="G1">G1</option>
                                            <option value="G2">G2</option>
                                            <option value="G3">G3</option>
                                            <option value="L">Listed（L）</option>
                                            <option value="OP">オープン特別</option>
                                            <option value="3勝">3勝クラス</option>
                                            <option value="2勝">2勝クラス</option>
                                            <option value="1勝">1勝クラス</option>
                                            <option value="未勝利">未勝利戦</option>
                                            <option value="新馬">新馬戦</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(horseCard);
    }

    static toggleCustomJockey(select) {
        const customInput = select.parentNode.querySelector('input[name="jockeyCustom"]');
        if (select.value === 'custom') {
            customInput.style.display = 'block';
        } else {
            customInput.style.display = 'none';
        }
    }

    // 3〜5走前データの折りたたみ機能
    static toggleExtendedRaceHistory(button) {
        const extendedSection = button.nextElementSibling;
        const arrow = button.querySelector('span');
        
        if (extendedSection.style.display === 'none') {
            extendedSection.style.display = 'block';
            arrow.textContent = '▲';
            button.innerHTML = button.innerHTML.replace('表示', '非表示');
        } else {
            extendedSection.style.display = 'none';
            arrow.textContent = '▼';
            button.innerHTML = button.innerHTML.replace('非表示', '表示');
        }
    }

    static removeHorse(button) {
        button.closest('.horse-card').remove();
    }

    static clearAllHorses() {
        document.getElementById('horsesContainer').innerHTML = '';
        this.horseCount = 0;
    }

    static addSampleHorses() {
        this.clearAllHorses();
        
        const sampleData = [
            {name: 'ベラジオオペラ', odds: 4.0, lastRace: 1, jockey: '横山和生'},
            {name: 'ドゥレッツァ', odds: 6.7, lastRace: 3, jockey: '横山武史'},
            {name: 'レガレイラ', odds: 4.9, lastRace: 1, jockey: '戸崎圭太'},
            {name: 'チャックネイト', odds: 104.2, lastRace: 2, jockey: 'D.レーン'}
        ];

        sampleData.forEach(data => {
            this.addHorse();
            const cards = document.querySelectorAll('.horse-card');
            const lastCard = cards[cards.length - 1];
            
            lastCard.querySelector('input[name="horseName"]').value = data.name;
            lastCard.querySelector('input[name="odds"]').value = data.odds;
            lastCard.querySelector('select[name="lastRace"]').value = data.lastRace;
            
            const jockeySelect = lastCard.querySelector('select[name="jockey"]');
            const jockeyCustom = lastCard.querySelector('input[name="jockeyCustom"]');
            
            const jockeyOptions = Array.from(jockeySelect.options).map(opt => opt.value);
            if (jockeyOptions.includes(data.jockey)) {
                jockeySelect.value = data.jockey;
            } else {
                jockeySelect.value = 'custom';
                jockeyCustom.value = data.jockey;
                jockeyCustom.style.display = 'block';
            }
        });
    }

    static getAllHorses() {
        const horseCards = document.querySelectorAll('.horse-card');
        const horses = [];
        
        horseCards.forEach(card => {
            // 基本情報の取得（簡易モードとの互換性を考慮）
            const horseNameInput = card.querySelector('input[name="horseName"], input[name="name"]');
            const horseName = horseNameInput ? horseNameInput.value : '名前未入力';
            
            const oddsInput = card.querySelector('input[name="odds"]');
            const odds = oddsInput ? parseFloat(oddsInput.value) : 10;
            
            // 馬番・枠番の取得
            const horseNumberInput = card.querySelector('input[name="horseNumber"]');
            const horseNumber = horseNumberInput ? parseInt(horseNumberInput.value) : 0;
            
            const frameNumberInput = card.querySelector('input[name="frameNumber"]');
            const frameNumber = frameNumberInput ? parseInt(frameNumberInput.value) : 0;
            
            const lastRaceSelect = card.querySelector('select[name="lastRace"]');
            const lastRaceOrderInput = card.querySelector('input[name="lastRaceOrder"]');
            const lastRaceOrder = lastRaceOrderInput ? this.parseRaceOrder(lastRaceOrderInput.value) : '';
            let lastRace;
            if (lastRaceOrderInput && lastRaceOrderInput.value) {
                lastRace = this.parseRaceOrder(lastRaceOrderInput.value) || 6;
            } else if (lastRaceSelect) {
                lastRace = parseInt(lastRaceSelect.value);
            } else {
                lastRace = 6;
            }

            // 騎手情報の取得
            const jockeySelect = card.querySelector('select[name="jockey"]');
            const jockeyCustom = card.querySelector('input[name="jockeyCustom"]');
            let jockey = '';
            if (jockeySelect && jockeySelect.value === 'custom') {
                jockey = jockeyCustom ? (jockeyCustom.value || '騎手未入力') : '騎手未入力';
            } else {
                jockey = jockeySelect ? (jockeySelect.value || '騎手未入力') : '騎手未入力';
            }

            // 基本情報
            const ageSelect = card.querySelector('select[name="age"]');
            const age = ageSelect ? parseInt(ageSelect.value) : 5;
            const weightChangeSelect = card.querySelector('select[name="weightChange"]');
            const weightChange = weightChangeSelect ? parseInt(weightChangeSelect.value) : 0;

            // 今回のレース情報
            const courseSelect = card.querySelector('select[name="course"]');
            const course = courseSelect ? courseSelect.value : '東京';
            const distanceSelect = card.querySelector('select[name="distance"]');
            const distance = distanceSelect ? parseInt(distanceSelect.value) : 1600;
            const trackTypeSelect = card.querySelector('select[name="trackType"]');
            const trackType = trackTypeSelect ? trackTypeSelect.value : '芝';
            const weatherSelect = card.querySelector('select[name="weather"]');
            const weather = weatherSelect ? weatherSelect.value : '晴';
            const trackConditionSelect = card.querySelector('select[name="trackCondition"]');
            const trackCondition = trackConditionSelect ? trackConditionSelect.value : '良';
            const restDaysSelect = card.querySelector('select[name="restDays"]');
            const restDays = restDaysSelect ? parseInt(restDaysSelect.value) : 14;
            
            // レースレベルと脚質情報
            const raceLevelSelect = card.querySelector('select[name="raceLevel"]');
            const raceLevel = raceLevelSelect ? raceLevelSelect.value : '1勝';
            const runningStyleSelect = card.querySelector('select[name="runningStyle"]');
            const runningStyle = runningStyleSelect ? runningStyleSelect.value : '';

            // 前走情報（自動抽出）
            const lastRaceCourseInput = card.querySelector('input[name="lastRaceCourse"]');
            const lastRaceCourse = lastRaceCourseInput ? lastRaceCourseInput.value : '';
            const lastRaceDistanceInput = card.querySelector('input[name="lastRaceDistance"]');
            const lastRaceDistance = lastRaceDistanceInput ? lastRaceDistanceInput.value : '';
            const lastRaceTrackTypeInput = card.querySelector('input[name="lastRaceTrackType"]');
            const lastRaceTrackType = lastRaceTrackTypeInput ? lastRaceTrackTypeInput.value : '';
            const lastRaceDateInput = card.querySelector('input[name="lastRaceDate"]');
            const lastRaceDate = lastRaceDateInput ? lastRaceDateInput.value : '';

            // 新しく追加した詳細前走情報
            const lastRaceTimeInput = card.querySelector('input[name="lastRaceTime"]');
            const lastRaceTime = lastRaceTimeInput ? lastRaceTimeInput.value : '';
            const lastRaceTrackConditionSelect = card.querySelector('select[name="lastRaceTrackCondition"]');
            const lastRaceTrackCondition = lastRaceTrackConditionSelect ? lastRaceTrackConditionSelect.value : '';
            const lastRaceWeightInput = card.querySelector('input[name="lastRaceWeight"]');
            const lastRaceWeight = lastRaceWeightInput ? parseFloat(lastRaceWeightInput.value) : 0;
            const lastRaceJockeyInput = card.querySelector('input[name="lastRaceJockey"]');
            const lastRaceJockey = lastRaceJockeyInput ? lastRaceJockeyInput.value : '';
            const lastRacePopularityInput = card.querySelector('input[name="lastRacePopularity"]');
            const lastRacePopularity = lastRacePopularityInput ? parseInt(lastRacePopularityInput.value) : 0;
            const lastRaceAgariInput = card.querySelector('input[name="lastRaceAgari"]');
            const lastRaceAgari = lastRaceAgariInput ? lastRaceAgariInput.value : '';

            // 2走前情報の抽出
            const secondLastRaceCourseInput = card.querySelector('input[name="secondLastRaceCourse"]');
            const secondLastRaceCourse = secondLastRaceCourseInput ? secondLastRaceCourseInput.value : '';
            const secondLastRaceDistanceInput = card.querySelector('input[name="secondLastRaceDistance"]');
            const secondLastRaceDistance = secondLastRaceDistanceInput ? secondLastRaceDistanceInput.value : '';
            const secondLastRaceTrackTypeInput = card.querySelector('input[name="secondLastRaceTrackType"]');
            const secondLastRaceTrackType = secondLastRaceTrackTypeInput ? secondLastRaceTrackTypeInput.value : '';
            const secondLastRaceDateInput = card.querySelector('input[name="secondLastRaceDate"]');
            const secondLastRaceDate = secondLastRaceDateInput ? secondLastRaceDateInput.value : '';
            const secondLastRaceTimeInput = card.querySelector('input[name="secondLastRaceTime"]');
            const secondLastRaceTime = secondLastRaceTimeInput ? secondLastRaceTimeInput.value : '';
            const secondLastRaceTrackConditionSelect = card.querySelector('select[name="secondLastRaceTrackCondition"]');
            const secondLastRaceTrackCondition = secondLastRaceTrackConditionSelect ? secondLastRaceTrackConditionSelect.value : '';
            const secondLastRaceWeightInput = card.querySelector('input[name="secondLastRaceWeight"]');
            const secondLastRaceWeight = secondLastRaceWeightInput ? parseFloat(secondLastRaceWeightInput.value) : 0;
            const secondLastRaceJockeyInput = card.querySelector('input[name="secondLastRaceJockey"]');
            const secondLastRaceJockey = secondLastRaceJockeyInput ? secondLastRaceJockeyInput.value : '';
            const secondLastRacePopularityInput = card.querySelector('input[name="secondLastRacePopularity"]');
            const secondLastRacePopularity = secondLastRacePopularityInput ? parseInt(secondLastRacePopularityInput.value) : 0;
            const secondLastRaceOrderInput = card.querySelector('input[name="secondLastRaceOrder"]');
            const secondLastRaceOrder = secondLastRaceOrderInput ? this.parseRaceOrder(secondLastRaceOrderInput.value) : 0;
            const secondLastRaceAgariInput = card.querySelector('input[name="secondLastRaceAgari"]');
            const secondLastRaceAgari = secondLastRaceAgariInput ? secondLastRaceAgariInput.value : '';

            // 3走前情報の抽出
            const thirdLastRaceCourseInput = card.querySelector('input[name="thirdLastRaceCourse"]');
            const thirdLastRaceCourse = thirdLastRaceCourseInput ? thirdLastRaceCourseInput.value : '';
            const thirdLastRaceDistanceInput = card.querySelector('input[name="thirdLastRaceDistance"]');
            const thirdLastRaceDistance = thirdLastRaceDistanceInput ? thirdLastRaceDistanceInput.value : '';
            const thirdLastRaceTrackTypeInput = card.querySelector('input[name="thirdLastRaceTrackType"]');
            const thirdLastRaceTrackType = thirdLastRaceTrackTypeInput ? thirdLastRaceTrackTypeInput.value : '';
            const thirdLastRaceDateInput = card.querySelector('input[name="thirdLastRaceDate"]');
            const thirdLastRaceDate = thirdLastRaceDateInput ? thirdLastRaceDateInput.value : '';
            const thirdLastRaceTimeInput = card.querySelector('input[name="thirdLastRaceTime"]');
            const thirdLastRaceTime = thirdLastRaceTimeInput ? thirdLastRaceTimeInput.value : '';
            const thirdLastRaceTrackConditionSelect = card.querySelector('select[name="thirdLastRaceTrackCondition"]');
            const thirdLastRaceTrackCondition = thirdLastRaceTrackConditionSelect ? thirdLastRaceTrackConditionSelect.value : '';
            const thirdLastRaceWeightInput = card.querySelector('input[name="thirdLastRaceWeight"]');
            const thirdLastRaceWeight = thirdLastRaceWeightInput ? parseFloat(thirdLastRaceWeightInput.value) : 0;
            const thirdLastRaceJockeyInput = card.querySelector('input[name="thirdLastRaceJockey"]');
            const thirdLastRaceJockey = thirdLastRaceJockeyInput ? thirdLastRaceJockeyInput.value : '';
            const thirdLastRacePopularityInput = card.querySelector('input[name="thirdLastRacePopularity"]');
            const thirdLastRacePopularity = thirdLastRacePopularityInput ? parseInt(thirdLastRacePopularityInput.value) : 0;
            const thirdLastRaceOrderInput = card.querySelector('input[name="thirdLastRaceOrder"]');
            const thirdLastRaceOrder = thirdLastRaceOrderInput ? this.parseRaceOrder(thirdLastRaceOrderInput.value) : 0;
            const thirdLastRaceAgariInput = card.querySelector('input[name="thirdLastRaceAgari"]');
            const thirdLastRaceAgari = thirdLastRaceAgariInput ? thirdLastRaceAgariInput.value : '';
            const thirdLastRaceLevelSelect = card.querySelector('select[name="thirdLastRaceLevel"]');
            const thirdLastRaceLevel = thirdLastRaceLevelSelect ? thirdLastRaceLevelSelect.value : '';

            // 4走前情報の抽出
            const fourthLastRaceCourseInput = card.querySelector('input[name="fourthLastRaceCourse"]');
            const fourthLastRaceCourse = fourthLastRaceCourseInput ? fourthLastRaceCourseInput.value : '';
            const fourthLastRaceDistanceInput = card.querySelector('input[name="fourthLastRaceDistance"]');
            const fourthLastRaceDistance = fourthLastRaceDistanceInput ? fourthLastRaceDistanceInput.value : '';
            const fourthLastRaceTrackTypeInput = card.querySelector('input[name="fourthLastRaceTrackType"]');
            const fourthLastRaceTrackType = fourthLastRaceTrackTypeInput ? fourthLastRaceTrackTypeInput.value : '';
            const fourthLastRaceDateInput = card.querySelector('input[name="fourthLastRaceDate"]');
            const fourthLastRaceDate = fourthLastRaceDateInput ? fourthLastRaceDateInput.value : '';
            const fourthLastRaceTimeInput = card.querySelector('input[name="fourthLastRaceTime"]');
            const fourthLastRaceTime = fourthLastRaceTimeInput ? fourthLastRaceTimeInput.value : '';
            const fourthLastRaceTrackConditionSelect = card.querySelector('select[name="fourthLastRaceTrackCondition"]');
            const fourthLastRaceTrackCondition = fourthLastRaceTrackConditionSelect ? fourthLastRaceTrackConditionSelect.value : '';
            const fourthLastRaceWeightInput = card.querySelector('input[name="fourthLastRaceWeight"]');
            const fourthLastRaceWeight = fourthLastRaceWeightInput ? parseFloat(fourthLastRaceWeightInput.value) : 0;
            const fourthLastRaceJockeyInput = card.querySelector('input[name="fourthLastRaceJockey"]');
            const fourthLastRaceJockey = fourthLastRaceJockeyInput ? fourthLastRaceJockeyInput.value : '';
            const fourthLastRacePopularityInput = card.querySelector('input[name="fourthLastRacePopularity"]');
            const fourthLastRacePopularity = fourthLastRacePopularityInput ? parseInt(fourthLastRacePopularityInput.value) : 0;
            const fourthLastRaceOrderInput = card.querySelector('input[name="fourthLastRaceOrder"]');
            const fourthLastRaceOrder = fourthLastRaceOrderInput ? this.parseRaceOrder(fourthLastRaceOrderInput.value) : 0;
            const fourthLastRaceAgariInput = card.querySelector('input[name="fourthLastRaceAgari"]');
            const fourthLastRaceAgari = fourthLastRaceAgariInput ? fourthLastRaceAgariInput.value : '';
            const fourthLastRaceLevelSelect = card.querySelector('select[name="fourthLastRaceLevel"]');
            const fourthLastRaceLevel = fourthLastRaceLevelSelect ? fourthLastRaceLevelSelect.value : '';

            // 5走前情報の抽出
            const fifthLastRaceCourseInput = card.querySelector('input[name="fifthLastRaceCourse"]');
            const fifthLastRaceCourse = fifthLastRaceCourseInput ? fifthLastRaceCourseInput.value : '';
            const fifthLastRaceDistanceInput = card.querySelector('input[name="fifthLastRaceDistance"]');
            const fifthLastRaceDistance = fifthLastRaceDistanceInput ? fifthLastRaceDistanceInput.value : '';
            const fifthLastRaceTrackTypeInput = card.querySelector('input[name="fifthLastRaceTrackType"]');
            const fifthLastRaceTrackType = fifthLastRaceTrackTypeInput ? fifthLastRaceTrackTypeInput.value : '';
            const fifthLastRaceDateInput = card.querySelector('input[name="fifthLastRaceDate"]');
            const fifthLastRaceDate = fifthLastRaceDateInput ? fifthLastRaceDateInput.value : '';
            const fifthLastRaceTimeInput = card.querySelector('input[name="fifthLastRaceTime"]');
            const fifthLastRaceTime = fifthLastRaceTimeInput ? fifthLastRaceTimeInput.value : '';
            const fifthLastRaceTrackConditionSelect = card.querySelector('select[name="fifthLastRaceTrackCondition"]');
            const fifthLastRaceTrackCondition = fifthLastRaceTrackConditionSelect ? fifthLastRaceTrackConditionSelect.value : '';
            const fifthLastRaceWeightInput = card.querySelector('input[name="fifthLastRaceWeight"]');
            const fifthLastRaceWeight = fifthLastRaceWeightInput ? parseFloat(fifthLastRaceWeightInput.value) : 0;
            const fifthLastRaceJockeyInput = card.querySelector('input[name="fifthLastRaceJockey"]');
            const fifthLastRaceJockey = fifthLastRaceJockeyInput ? fifthLastRaceJockeyInput.value : '';
            const fifthLastRacePopularityInput = card.querySelector('input[name="fifthLastRacePopularity"]');
            const fifthLastRacePopularity = fifthLastRacePopularityInput ? parseInt(fifthLastRacePopularityInput.value) : 0;
            const fifthLastRaceOrderInput = card.querySelector('input[name="fifthLastRaceOrder"]');
            const fifthLastRaceOrder = fifthLastRaceOrderInput ? this.parseRaceOrder(fifthLastRaceOrderInput.value) : 0;
            const fifthLastRaceAgariInput = card.querySelector('input[name="fifthLastRaceAgari"]');
            const fifthLastRaceAgari = fifthLastRaceAgariInput ? fifthLastRaceAgariInput.value : '';
            const fifthLastRaceLevelSelect = card.querySelector('select[name="fifthLastRaceLevel"]');
            const fifthLastRaceLevel = fifthLastRaceLevelSelect ? fifthLastRaceLevelSelect.value : '';

            horses.push({
                name: horseName,
                odds: odds,
                lastRace: lastRace,
                lastRaceOrder: lastRaceOrder,
                lastRaceAgari: lastRaceAgari,
                jockey: jockey,
                age: age,
                weightChange: weightChange,
                course: course,
                distance: distance,
                trackType: trackType,
                weather: weather,
                trackCondition: trackCondition,
                restDays: restDays,
                raceLevel: raceLevel,
                runningStyle: runningStyle,
                // 前走情報
                lastRaceCourse: lastRaceCourse,
                lastRaceDistance: lastRaceDistance,
                lastRaceTrackType: lastRaceTrackType,
                lastRaceDate: lastRaceDate,
                // 詳細前走情報
                lastRaceTime: lastRaceTime,
                lastRaceTrackCondition: lastRaceTrackCondition,
                lastRaceWeight: lastRaceWeight,
                lastRaceJockey: lastRaceJockey,
                lastRacePopularity: lastRacePopularity,
                lastRaceOrder: lastRaceOrder,
                lastRaceAgari: lastRaceAgari,
                // 2走前情報
                secondLastRaceCourse: secondLastRaceCourse,
                secondLastRaceDistance: secondLastRaceDistance,
                secondLastRaceTrackType: secondLastRaceTrackType,
                secondLastRaceDate: secondLastRaceDate,
                secondLastRaceTime: secondLastRaceTime,
                secondLastRaceTrackCondition: secondLastRaceTrackCondition,
                secondLastRaceWeight: secondLastRaceWeight,
                secondLastRaceJockey: secondLastRaceJockey,
                secondLastRacePopularity: secondLastRacePopularity,
                secondLastRaceOrder: secondLastRaceOrder,
                secondLastRaceAgari: secondLastRaceAgari,
                // 3走前情報
                thirdLastRaceCourse: thirdLastRaceCourse,
                thirdLastRaceDistance: thirdLastRaceDistance,
                thirdLastRaceTrackType: thirdLastRaceTrackType,
                thirdLastRaceDate: thirdLastRaceDate,
                thirdLastRaceTime: thirdLastRaceTime,
                thirdLastRaceTrackCondition: thirdLastRaceTrackCondition,
                thirdLastRaceWeight: thirdLastRaceWeight,
                thirdLastRaceJockey: thirdLastRaceJockey,
                thirdLastRacePopularity: thirdLastRacePopularity,
                thirdLastRaceOrder: thirdLastRaceOrder,
                thirdLastRaceAgari: thirdLastRaceAgari,
                thirdLastRaceLevel: thirdLastRaceLevel,
                // 4走前情報
                fourthLastRaceCourse: fourthLastRaceCourse,
                fourthLastRaceDistance: fourthLastRaceDistance,
                fourthLastRaceTrackType: fourthLastRaceTrackType,
                fourthLastRaceDate: fourthLastRaceDate,
                fourthLastRaceTime: fourthLastRaceTime,
                fourthLastRaceTrackCondition: fourthLastRaceTrackCondition,
                fourthLastRaceWeight: fourthLastRaceWeight,
                fourthLastRaceJockey: fourthLastRaceJockey,
                fourthLastRacePopularity: fourthLastRacePopularity,
                fourthLastRaceOrder: fourthLastRaceOrder,
                fourthLastRaceAgari: fourthLastRaceAgari,
                fourthLastRaceLevel: fourthLastRaceLevel,
                // 5走前情報
                fifthLastRaceCourse: fifthLastRaceCourse,
                fifthLastRaceDistance: fifthLastRaceDistance,
                fifthLastRaceTrackType: fifthLastRaceTrackType,
                fifthLastRaceDate: fifthLastRaceDate,
                fifthLastRaceTime: fifthLastRaceTime,
                fifthLastRaceTrackCondition: fifthLastRaceTrackCondition,
                fifthLastRaceWeight: fifthLastRaceWeight,
                fifthLastRaceJockey: fifthLastRaceJockey,
                fifthLastRacePopularity: fifthLastRacePopularity,
                fifthLastRaceOrder: fifthLastRaceOrder,
                fifthLastRaceAgari: fifthLastRaceAgari,
                fifthLastRaceLevel: fifthLastRaceLevel,
                // 馬番・枠番情報
                horseNumber: horseNumber,
                frameNumber: frameNumber
            });
        });

        return horses;
    }

    static validateHorses() {
        const horses = this.getAllHorses();
        if (horses.length === 0) {
            alert('最低1頭の馬を追加してください。');
            return false;
        }
        return true;
    }

    static addHorseFromData(horseData) {
        //console.log('=== addHorseFromData開始 ===');
        //console.log('入力データ:', horseData);
        
        // データ検証を実行
        const validationResult = this.validateHorseDataInput(horseData);
        if (!validationResult.isValid) {
            console.warn(`馬データ検証エラー（${horseData.name}）:`, validationResult.errors);
            
            // 修復を試行
            const repairedData = this.repairHorseDataInput(horseData, validationResult.errors);
            if (repairedData) {
                console.log(`馬データ修復成功（${horseData.name}）`);
                horseData = repairedData;
            } else {
                console.error(`馬データ修復失敗（${horseData.name}）`);
                throw new Error(`馬データが無効です: ${validationResult.errors.join(', ')}`);
            }
        }
        
        // 警告レベルの問題がある場合は記録
        if (validationResult.warnings && validationResult.warnings.length > 0) {
            console.warn(`馬データ警告（${horseData.name}）:`, validationResult.warnings);
            this.recordValidationWarning(horseData.name, validationResult.warnings);
        }
        
        // 騎手名のマッピング（完全版）
        const jockeyMapping = {
            '横山和': '横山和生',
            '横山武': '横山武史',
            '菱田裕': '菱田裕二',
            '武豊': '武豊',
            '川田将雅': '川田将雅',
            'C.ルメール': 'C.ルメール',
            '戸崎圭太': '戸崎圭太',
            '福永祐一': '福永祐一',
            '横山和生': '横山和生',
            // 追加の騎手マッピング
            '浜中': '浜中俊',
            'ルメー': 'C.ルメール',
            '丹内': '丹内祐次',
            '北村宏': '北村宏司',
            'レーン': 'D.レーン',
            '松山': '松山弘平',
            '岩田望': '岩田望来',
            '津村': '津村明秀',
            '池添': '池添謙一',
            '北村友': '北村友一',
            '田辺': '田辺裕信',
            'Ｍデム': 'M.デムーロ',
            'M.デム': 'M.デムーロ',
            '佐々木': '佐々木大輔',
            '坂井': '坂井瑠星',
            '川田': '川田将雅',
            '横山典': '横山典弘',
            '戸崎': '戸崎圭太',
            // 新たに発見された騎手マッピング
            '内田博': '内田博幸',
            '菅原明': '菅原明良',
            '戸崎圭': '戸崎圭太',
            'シュタ': 'シュタルケ',
            '木幡巧': '木幡巧也',
            '菊沢': '菊沢一樹',
            '吉田豊': '吉田豊',
            '幸英明': '幸英明',
            '太宰啓介': '太宰啓介',
            '長岡禎仁': '長岡禎仁',
            '古川奈穂': '古川奈穂',
            '吉田隼人': '吉田隼人',
            '三浦皇成': '三浦皇成',
            'ディー': 'W.ビュイック',
            '松岡正海': '松岡正海',
            '原優介': '原優介'
        };
        
        const mappedJockey = jockeyMapping[horseData.jockey] || horseData.jockey;
        const isKnownJockey = Object.values(jockeyMapping).includes(mappedJockey);
        
        // 体重変化の処理
        let weightChangeValue = 0;
        if (horseData.weightChange > 0) {
            weightChangeValue = 1; // 増加
        } else if (horseData.weightChange < 0) {
            weightChangeValue = -1; // 減少
        }
        
        // 休養期間の計算（レース日が設定されている場合）
        let restDaysValue = 7; // デフォルト値
        const raceDate = document.getElementById('raceDate').value;
        if (raceDate && horseData.lastRaceDate) {
            const lastDate = new Date(horseData.lastRaceDate);
            const raceDateObj = new Date(raceDate);
            if (!isNaN(lastDate.getTime()) && !isNaN(raceDateObj.getTime())) {
                const diffTime = Math.abs(raceDateObj - lastDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                // 休養期間カテゴリを決定
                if (diffDays <= 7) {
                    restDaysValue = 7;
                } else if (diffDays <= 14) {
                    restDaysValue = 14;
                } else if (diffDays <= 21) {
                    restDaysValue = 21;
                } else if (diffDays <= 28) {
                    restDaysValue = 28;
                } else if (diffDays <= 35) {
                    restDaysValue = 35;
                } else if (diffDays <= 42) {
                    restDaysValue = 42;
                } else if (diffDays <= 49) {
                    restDaysValue = 49;
                } else {
                    restDaysValue = 56;
                }
                
                //console.log(`休養日数計算: ${diffDays}日 → カテゴリ: ${restDaysValue}`);
            }
        }
        
        // 前走斤量の抽出（前走情報から）
        let lastRaceWeight = horseData.lastRaceWeight || 0;
        //console.log('前走斤量抽出:', lastRaceWeight);
        
        //console.log('=== 前走情報の詳細 ===');
        //console.log('前走馬場状態:', horseData.lastRaceTrackCondition);
        //console.log('前走斤量:', lastRaceWeight);
        //console.log('前走騎手:', horseData.lastRaceJockey);
        //console.log('前走人気:', horseData.lastRacePopularity);
        //console.log('前走馬数:', horseData.lastRaceHorseCount);
        //console.log('=======================');
        
        const horseCard = document.createElement('div');
        horseCard.className = 'horse-card';
        horseCard.innerHTML = `
            <div class="horse-header">
                <h3>🐎 ${horseData.name || '馬名未設定'}</h3>
                <button type="button" onclick="HorseManager.removeHorse(this)" class="btn-remove">削除</button>
            </div>
            <div class="horse-content">
                <!-- 馬番・枠番のhidden input -->
                <input type="hidden" name="horseNumber" value="${horseData.horseNumber || ''}">
                <input type="hidden" name="frameNumber" value="${horseData.frameNumber || ''}">
                <div class="form-group">
                    <label>馬名</label>
                    <input type="text" name="horseName" value="${horseData.name || ''}" required>
                </div>
                <div class="form-group">
                    <label>オッズ</label>
                    <input type="number" name="odds" step="0.1" placeholder="例: 3.5" value="${horseData.odds || ''}">
                </div>
                <div class="form-group">
                    <label>前走着順</label>
                    <input type="number" name="lastRaceOrder" placeholder="例: 1" value="${horseData.lastRaceOrder || ''}">
                </div>
                <!--
                <div class="form-group">
                    <label>前走上がり3F</label>
                    <input type="text" name="lastRaceAgari" placeholder="例: 34.1" value="${horseData.lastRaceAgari || ''}">
                </div>
                -->
                <div class="form-group">
                    <label>騎手</label>
                    <select name="jockey" onchange="HorseManager.toggleCustomJockey(this)">
                        <option value="武豊" ${mappedJockey === '武豊' ? 'selected' : ''}>武豊</option>
                        <option value="川田将雅" ${mappedJockey === '川田将雅' ? 'selected' : ''}>川田将雅</option>
                        <option value="C.ルメール" ${mappedJockey === 'C.ルメール' ? 'selected' : ''}>C.ルメール</option>
                        <option value="横山武史" ${mappedJockey === '横山武史' ? 'selected' : ''}>横山武史</option>
                        <option value="戸崎圭太" ${mappedJockey === '戸崎圭太' ? 'selected' : ''}>戸崎圭太</option>
                        <option value="福永祐一" ${mappedJockey === '福永祐一' ? 'selected' : ''}>福永祐一</option>
                        <option value="M.デムーロ" ${mappedJockey === 'M.デムーロ' ? 'selected' : ''}>M.デムーロ</option>
                        <option value="横山典弘" ${mappedJockey === '横山典弘' ? 'selected' : ''}>横山典弘</option>
                        <option value="岩田康誠" ${mappedJockey === '岩田康誠' ? 'selected' : ''}>岩田康誠</option>
                        <option value="池添謙一" ${mappedJockey === '池添謙一' ? 'selected' : ''}>池添謙一</option>
                        <option value="横山和生" ${mappedJockey === '横山和生' ? 'selected' : ''}>横山和生</option>
                        <option value="D.レーン" ${mappedJockey === 'D.レーン' ? 'selected' : ''}>D.レーン</option>
                        <option value="浜中俊" ${mappedJockey === '浜中俊' ? 'selected' : ''}>浜中俊</option>
                        <option value="丹内祐次" ${mappedJockey === '丹内祐次' ? 'selected' : ''}>丹内祐次</option>
                        <option value="北村宏司" ${mappedJockey === '北村宏司' ? 'selected' : ''}>北村宏司</option>
                        <option value="松山弘平" ${mappedJockey === '松山弘平' ? 'selected' : ''}>松山弘平</option>
                        <option value="岩田望来" ${mappedJockey === '岩田望来' ? 'selected' : ''}>岩田望来</option>
                        <option value="津村明秀" ${mappedJockey === '津村明秀' ? 'selected' : ''}>津村明秀</option>
                        <option value="北村友一" ${mappedJockey === '北村友一' ? 'selected' : ''}>北村友一</option>
                        <option value="田辺裕信" ${mappedJockey === '田辺裕信' ? 'selected' : ''}>田辺裕信</option>
                        <option value="佐々木大輔" ${mappedJockey === '佐々木大輔' ? 'selected' : ''}>佐々木大輔</option>
                        <option value="坂井瑠星" ${mappedJockey === '坂井瑠星' ? 'selected' : ''}>坂井瑠星</option>
                        <option value="内田博幸" ${mappedJockey === '内田博幸' ? 'selected' : ''}>内田博幸</option>
                        <option value="菅原明良" ${mappedJockey === '菅原明良' ? 'selected' : ''}>菅原明良</option>
                        <option value="シュタルケ" ${mappedJockey === 'シュタルケ' ? 'selected' : ''}>シュタルケ</option>
                        <option value="木幡巧也" ${mappedJockey === '木幡巧也' ? 'selected' : ''}>木幡巧也</option>
                        <option value="菊沢一樹" ${mappedJockey === '菊沢一樹' ? 'selected' : ''}>菊沢一樹</option>
                        <option value="吉田豊" ${mappedJockey === '吉田豊' ? 'selected' : ''}>吉田豊</option>
                        <option value="custom" ${!isKnownJockey && mappedJockey ? 'selected' : ''}>その他（入力）</option>
                    </select>
                    <input type="text" name="jockeyCustom" placeholder="騎手名を入力" value="${!isKnownJockey && mappedJockey ? mappedJockey : ''}" style="display: ${!isKnownJockey && mappedJockey ? 'block' : 'none'}; margin-top: 5px;">
                </div>
                <div class="form-group">
                    <label>年齢</label>
                    <select name="age">
                        <option value="3" ${horseData.age === 3 ? 'selected' : ''}>3歳</option>
                        <option value="4" ${horseData.age === 4 ? 'selected' : ''}>4歳</option>
                        <option value="5" ${horseData.age === 5 || !horseData.age ? 'selected' : ''}>5歳</option>
                        <option value="6" ${horseData.age === 6 ? 'selected' : ''}>6歳</option>
                        <option value="7" ${horseData.age === 7 ? 'selected' : ''}>7歳</option>
                        <option value="8" ${horseData.age === 8 ? 'selected' : ''}>8歳以上</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>馬体重変化</label>
                    <select name="weightChange">
                        <option value="0" ${weightChangeValue === 0 ? 'selected' : ''}>変化なし</option>
                        <option value="1" ${weightChangeValue === 1 ? 'selected' : ''}>増加</option>
                        <option value="-1" ${weightChangeValue === -1 ? 'selected' : ''}>減少</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>今回レースレベル</label>
                    <select name="raceLevel">
                        <option value="G1" ${horseData.raceLevel === 'G1' ? 'selected' : ''}>G1</option>
                        <option value="G2" ${horseData.raceLevel === 'G2' ? 'selected' : ''}>G2</option>
                        <option value="G3" ${horseData.raceLevel === 'G3' ? 'selected' : ''}>G3</option>
                        <option value="L" ${horseData.raceLevel === 'L' ? 'selected' : ''}>Listed（L）</option>
                        <option value="OP" ${horseData.raceLevel === 'OP' ? 'selected' : ''}>オープン特別</option>
                        <option value="3勝" ${horseData.raceLevel === '3勝' ? 'selected' : ''}>3勝クラス（1600万下）</option>
                        <option value="2勝" ${horseData.raceLevel === '2勝' ? 'selected' : ''}>2勝クラス（1000万下）</option>
                        <option value="1勝" ${horseData.raceLevel === '1勝' || !horseData.raceLevel ? 'selected' : ''}>1勝クラス（500万下）</option>
                        <option value="未勝利" ${horseData.raceLevel === '未勝利' ? 'selected' : ''}>未勝利戦</option>
                        <option value="新馬" ${horseData.raceLevel === '新馬' ? 'selected' : ''}>新馬戦</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>脚質</label>
                    <select name="runningStyle">
                        <option value="" ${!horseData.runningStyle ? 'selected' : ''}>未選択</option>
                        <option value="逃げ" ${horseData.runningStyle === '逃げ' ? 'selected' : ''}>逃げ</option>
                        <option value="先行" ${horseData.runningStyle === '先行' ? 'selected' : ''}>先行</option>
                        <option value="差し" ${horseData.runningStyle === '差し' ? 'selected' : ''}>差し</option>
                        <option value="追込" ${horseData.runningStyle === '追込' ? 'selected' : ''}>追込</option>
                        <option value="自在" ${horseData.runningStyle === '自在' ? 'selected' : ''}>自在</option>
                    </select>
                </div>
            </div>
            <div class="horse-section">
                <h4>🏁 今回のレース情報</h4>
                <div class="horse-content">
                    <div class="form-group">
                        <label>コース</label>
                        <select name="course">
                            <optgroup label="中央競馬場">
                                <option value="中山" ${horseData.course === '中山' ? 'selected' : ''}>中山</option>
                                <option value="東京" ${horseData.course === '東京' ? 'selected' : ''}>東京</option>
                                <option value="京都" ${horseData.course === '京都' ? 'selected' : ''}>京都</option>
                                <option value="阪神" ${horseData.course === '阪神' ? 'selected' : ''}>阪神</option>
                                <option value="新潟" ${horseData.course === '新潟' ? 'selected' : ''}>新潟</option>
                                <option value="福島" ${horseData.course === '福島' ? 'selected' : ''}>福島</option>
                                <option value="中京" ${horseData.course === '中京' ? 'selected' : ''}>中京</option>
                                <option value="小倉" ${horseData.course === '小倉' ? 'selected' : ''}>小倉</option>
                                <option value="札幌" ${horseData.course === '札幌' ? 'selected' : ''}>札幌</option>
                                <option value="函館" ${horseData.course === '函館' ? 'selected' : ''}>函館</option>
                            </optgroup>
                            <optgroup label="南関東地方競馬">
                                <option value="大井" ${horseData.course === '大井' ? 'selected' : ''}>大井</option>
                                <option value="船橋" ${horseData.course === '船橋' ? 'selected' : ''}>船橋</option>
                                <option value="川崎" ${horseData.course === '川崎' ? 'selected' : ''}>川崎</option>
                                <option value="浦和" ${horseData.course === '浦和' ? 'selected' : ''}>浦和</option>
                            </optgroup>
                            <optgroup label="その他地方競馬">
                                <option value="門別" ${horseData.course === '門別' ? 'selected' : ''}>門別</option>
                                <option value="名古屋" ${horseData.course === '名古屋' ? 'selected' : ''}>名古屋</option>
                                <option value="笠松" ${horseData.course === '笠松' ? 'selected' : ''}>笠松</option>
                                <option value="園田" ${horseData.course === '園田' ? 'selected' : ''}>園田</option>
                                <option value="姫路" ${horseData.course === '姫路' ? 'selected' : ''}>姫路</option>
                                <option value="高知" ${horseData.course === '高知' ? 'selected' : ''}>高知</option>
                                <option value="佐賀" ${horseData.course === '佐賀' ? 'selected' : ''}>佐賀</option>
                                <option value="金沢" ${horseData.course === '金沢' ? 'selected' : ''}>金沢</option>
                                <option value="盛岡" ${horseData.course === '盛岡' ? 'selected' : ''}>盛岡</option>
                                <option value="水沢" ${horseData.course === '水沢' ? 'selected' : ''}>水沢</option>
                            </optgroup>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>距離</label>
                        <select name="distance">
                            <option value="1000">1000m</option>
                            <option value="1150">1150m</option>
                            <option value="1200">1200m</option>
                            <option value="1400">1400m</option>
                            <option value="1600" selected>1600m</option>
                            <option value="1700">1700m</option>
                            <option value="1800">1800m</option>
                            <option value="1900">1900m</option>
                            <option value="2000">2000m</option>
                            <option value="2100">2100m</option>
                            <option value="2200">2200m</option>
                            <option value="2400">2400m</option>
                            <option value="2500">2500m</option>
                            <option value="2600">2600m</option>
                            <option value="3000">3000m</option>
                            <option value="3200">3200m</option>
                            <option value="3600">3600m</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>馬場種別</label>
                        <select name="trackType">
                            <option value="芝" ${horseData.trackType === '芝' || !horseData.trackType ? 'selected' : ''}>芝</option>
                            <option value="ダート" ${horseData.trackType === 'ダート' ? 'selected' : ''}>ダート</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>天気</label>
                        <select name="weather">
                            <option value="晴" ${horseData.weather === '晴' || !horseData.weather ? 'selected' : ''}>晴</option>
                            <option value="曇" ${horseData.weather === '曇' ? 'selected' : ''}>曇</option>
                            <option value="雨" ${horseData.weather === '雨' ? 'selected' : ''}>雨</option>
                            <option value="雪" ${horseData.weather === '雪' ? 'selected' : ''}>雪</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>馬場状態</label>
                        <select name="trackCondition">
                            <option value="良" ${horseData.trackCondition === '良' || !horseData.trackCondition ? 'selected' : ''}>良</option>
                            <option value="稍重" ${horseData.trackCondition === '稍重' ? 'selected' : ''}>稍重</option>
                            <option value="重" ${horseData.trackCondition === '重' ? 'selected' : ''}>重</option>
                            <option value="不良" ${horseData.trackCondition === '不良' ? 'selected' : ''}>不良</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>休養期間</label>
                        <select name="restDays">
                            <option value="7" ${restDaysValue === 7 ? 'selected' : ''}>7日以内</option>
                            <option value="14" ${restDaysValue === 14 ? 'selected' : ''}>8-14日</option>
                            <option value="21" ${restDaysValue === 21 ? 'selected' : ''}>15-21日</option>
                            <option value="28" ${restDaysValue === 28 ? 'selected' : ''}>22-28日</option>
                            <option value="35" ${restDaysValue === 35 ? 'selected' : ''}>29-35日</option>
                            <option value="42" ${restDaysValue === 42 ? 'selected' : ''}>36-42日</option>
                            <option value="49" ${restDaysValue === 49 ? 'selected' : ''}>43-49日</option>
                            <option value="56" ${restDaysValue === 56 ? 'selected' : ''}>50日以上</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="horse-section">
                <h4>📊 過去5走情報</h4>
                <div class="horse-content">
                    <!-- 前走情報 -->
                    <div style="border: 2px solid #28a745; padding: 15px; margin-bottom: 15px; border-radius: 8px; background: #f8fff8;">
                        <h5 style="color: #28a745; margin-bottom: 10px;">前走</h5>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                            <div class="form-group">
                                <label>前走コース</label>
                                <input type="text" name="lastRaceCourse" value="${horseData.lastRaceCourse || ''}">
                            </div>
                            <div class="form-group">
                                <label>前走距離</label>
                                <input type="text" name="lastRaceDistance" value="${horseData.lastRaceDistance || ''}">
                            </div>
                            <div class="form-group">
                                <label>前走馬場</label>
                                <input type="text" name="lastRaceTrackType" value="${horseData.lastRaceTrackType || ''}">
                            </div>
                            <div class="form-group">
                                <label>前走日</label>
                                <input type="text" name="lastRaceDate" value="${horseData.lastRaceDate || ''}">
                            </div>
                            <div class="form-group">
                                <label>前走タイム</label>
                                <input type="text" name="lastRaceTime" placeholder="例: 1:35.2" style="font-family: monospace;" value="${horseData.lastRaceTime || ''}">
                            </div>
                            <div class="form-group">
                                <label>前走馬場状態</label>
                                <select name="lastRaceTrackCondition">
                                    <option value="" ${!horseData.lastRaceTrackCondition ? 'selected' : ''}>選択してください</option>
                                    <option value="良" ${horseData.lastRaceTrackCondition === '良' ? 'selected' : ''}>良</option>
                                    <option value="稍重" ${horseData.lastRaceTrackCondition === '稍重' ? 'selected' : ''}>稍重</option>
                                    <option value="重" ${horseData.lastRaceTrackCondition === '重' ? 'selected' : ''}>重</option>
                                    <option value="不良" ${horseData.lastRaceTrackCondition === '不良' ? 'selected' : ''}>不良</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>前走斤量</label>
                                <input type="number" name="lastRaceWeight" step="0.5" placeholder="例: 56.0" value="${lastRaceWeight || ''}">
                            </div>
                            <div class="form-group">
                                <label>前走騎手</label>
                                <input type="text" name="lastRaceJockey" placeholder="前走騎手名" value="${horseData.lastRaceJockey || ''}">
                            </div>
                            <div class="form-group">
                                <label>前走人気</label>
                                <input type="number" name="lastRacePopularity" placeholder="例: 1" value="${horseData.lastRacePopularity || ''}">
                            </div>
                            <div class="form-group">
                                <label>前走着順</label>
                                <input type="number" name="lastRaceOrder" placeholder="例: 1" value="${horseData.lastRaceOrder || ''}">
                            </div>
                            <div class="form-group">
                                <label>前走上がり3F</label>
                                <input type="text" name="lastRaceAgari" placeholder="例: 34.1" value="${horseData.lastRaceAgari || ''}">
                            </div>
                            <div class="form-group">
                                <label>前走レースレベル</label>
                                <select name="lastRaceLevel">
                                    <option value="" ${!horseData.lastRaceLevel ? 'selected' : ''}>選択してください</option>
                                    <option value="G1" ${horseData.lastRaceLevel === 'G1' ? 'selected' : ''}>G1</option>
                                    <option value="G2" ${horseData.lastRaceLevel === 'G2' ? 'selected' : ''}>G2</option>
                                    <option value="G3" ${horseData.lastRaceLevel === 'G3' ? 'selected' : ''}>G3</option>
                                    <option value="L" ${horseData.lastRaceLevel === 'L' ? 'selected' : ''}>Listed（L）</option>
                                    <option value="OP" ${horseData.lastRaceLevel === 'OP' ? 'selected' : ''}>オープン特別</option>
                                    <option value="3勝" ${horseData.lastRaceLevel === '3勝' ? 'selected' : ''}>3勝クラス</option>
                                    <option value="2勝" ${horseData.lastRaceLevel === '2勝' ? 'selected' : ''}>2勝クラス</option>
                                    <option value="1勝" ${horseData.lastRaceLevel === '1勝' ? 'selected' : ''}>1勝クラス</option>
                                    <option value="未勝利" ${horseData.lastRaceLevel === '未勝利' ? 'selected' : ''}>未勝利戦</option>
                                    <option value="新馬" ${horseData.lastRaceLevel === '新馬' ? 'selected' : ''}>新馬戦</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 2走前情報 -->
                    <div style="border: 2px solid #007bff; padding: 15px; margin-bottom: 15px; border-radius: 8px; background: #f8f9ff;">
                        <h5 style="color: #007bff; margin-bottom: 10px;">2走前</h5>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                            <div class="form-group">
                                <label>2走前コース</label>
                                <input type="text" name="secondLastRaceCourse" value="${horseData.secondLastRaceCourse || ''}">
                            </div>
                            <div class="form-group">
                                <label>2走前距離</label>
                                <input type="text" name="secondLastRaceDistance" value="${horseData.secondLastRaceDistance || ''}">
                            </div>
                            <div class="form-group">
                                <label>2走前馬場</label>
                                <input type="text" name="secondLastRaceTrackType" value="${horseData.secondLastRaceTrackType || ''}">
                            </div>
                            <div class="form-group">
                                <label>2走前日</label>
                                <input type="text" name="secondLastRaceDate" value="${horseData.secondLastRaceDate || ''}">
                            </div>
                            <div class="form-group">
                                <label>2走前タイム</label>
                                <input type="text" name="secondLastRaceTime" placeholder="例: 1:35.2" style="font-family: monospace;" value="${horseData.secondLastRaceTime || ''}">
                            </div>
                            <div class="form-group">
                                <label>2走前馬場状態</label>
                                <select name="secondLastRaceTrackCondition">
                                    <option value="" ${!horseData.secondLastRaceTrackCondition ? 'selected' : ''}>選択してください</option>
                                    <option value="良" ${horseData.secondLastRaceTrackCondition === '良' ? 'selected' : ''}>良</option>
                                    <option value="稍重" ${horseData.secondLastRaceTrackCondition === '稍重' ? 'selected' : ''}>稍重</option>
                                    <option value="重" ${horseData.secondLastRaceTrackCondition === '重' ? 'selected' : ''}>重</option>
                                    <option value="不良" ${horseData.secondLastRaceTrackCondition === '不良' ? 'selected' : ''}>不良</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>2走前斤量</label>
                                <input type="number" name="secondLastRaceWeight" step="0.5" placeholder="例: 56.0" value="${horseData.secondLastRaceWeight || ''}">
                            </div>
                            <div class="form-group">
                                <label>2走前騎手</label>
                                <input type="text" name="secondLastRaceJockey" placeholder="2走前騎手名" value="${horseData.secondLastRaceJockey || ''}">
                            </div>
                            <div class="form-group">
                                <label>2走前人気</label>
                                <input type="number" name="secondLastRacePopularity" placeholder="例: 1" value="${horseData.secondLastRacePopularity || ''}">
                            </div>
                            <div class="form-group">
                                <label>2走前着順</label>
                                <input type="number" name="secondLastRaceOrder" placeholder="例: 1" value="${horseData.secondLastRaceOrder || ''}">
                            </div>
                            <div class="form-group">
                                <label>2走前上がり3F</label>
                                <input type="text" name="secondLastRaceAgari" placeholder="例: 34.1" value="${horseData.secondLastRaceAgari || ''}">
                            </div>
                            <div class="form-group">
                                <label>2走前レースレベル</label>
                                <select name="secondLastRaceLevel">
                                    <option value="" ${!horseData.secondLastRaceLevel ? 'selected' : ''}>選択してください</option>
                                    <option value="G1" ${horseData.secondLastRaceLevel === 'G1' ? 'selected' : ''}>G1</option>
                                    <option value="G2" ${horseData.secondLastRaceLevel === 'G2' ? 'selected' : ''}>G2</option>
                                    <option value="G3" ${horseData.secondLastRaceLevel === 'G3' ? 'selected' : ''}>G3</option>
                                    <option value="L" ${horseData.secondLastRaceLevel === 'L' ? 'selected' : ''}>Listed（L）</option>
                                    <option value="OP" ${horseData.secondLastRaceLevel === 'OP' ? 'selected' : ''}>オープン特別</option>
                                    <option value="3勝" ${horseData.secondLastRaceLevel === '3勝' ? 'selected' : ''}>3勝クラス</option>
                                    <option value="2勝" ${horseData.secondLastRaceLevel === '2勝' ? 'selected' : ''}>2勝クラス</option>
                                    <option value="1勝" ${horseData.secondLastRaceLevel === '1勝' ? 'selected' : ''}>1勝クラス</option>
                                    <option value="未勝利" ${horseData.secondLastRaceLevel === '未勝利' ? 'selected' : ''}>未勝利戦</option>
                                    <option value="新馬" ${horseData.secondLastRaceLevel === '新馬' ? 'selected' : ''}>新馬戦</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 3〜5走前情報（折りたたみ） -->
                    <div style="margin-top: 15px;">
                        <button type="button" onclick="HorseManager.toggleExtendedRaceHistory(this)" 
                                style="background: #6c757d; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; width: 100%; text-align: left;">
                            <span style="float: right;">▼</span>
                            🗂️ 3〜5走前の詳細データを表示
                        </button>
                        <div class="extended-race-history" style="display: none; margin-top: 10px;">
                            
                            <!-- 3走前情報 -->
                            <div style="border: 2px solid #ffc107; padding: 15px; margin-bottom: 15px; border-radius: 8px; background: #fffbf0;">
                                <h5 style="color: #ffc107; margin-bottom: 10px;">3走前</h5>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                                    <div class="form-group">
                                        <label>3走前コース</label>
                                        <input type="text" name="thirdLastRaceCourse" value="${horseData.thirdLastRaceCourse || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>3走前距離</label>
                                        <input type="text" name="thirdLastRaceDistance" value="${horseData.thirdLastRaceDistance || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>3走前馬場</label>
                                        <input type="text" name="thirdLastRaceTrackType" value="${horseData.thirdLastRaceTrackType || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>3走前日</label>
                                        <input type="text" name="thirdLastRaceDate" value="${horseData.thirdLastRaceDate || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>3走前タイム</label>
                                        <input type="text" name="thirdLastRaceTime" placeholder="例: 1:35.2" style="font-family: monospace;" value="${horseData.thirdLastRaceTime || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>3走前馬場状態</label>
                                        <select name="thirdLastRaceTrackCondition">
                                            <option value="">選択してください</option>
                                            <option value="良" ${horseData.thirdLastRaceTrackCondition === '良' ? 'selected' : ''}>良</option>
                                            <option value="稍重" ${horseData.thirdLastRaceTrackCondition === '稍重' ? 'selected' : ''}>稍重</option>
                                            <option value="重" ${horseData.thirdLastRaceTrackCondition === '重' ? 'selected' : ''}>重</option>
                                            <option value="不良" ${horseData.thirdLastRaceTrackCondition === '不良' ? 'selected' : ''}>不良</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>3走前斤量</label>
                                        <input type="number" name="thirdLastRaceWeight" step="0.5" placeholder="例: 56.0" value="${horseData.thirdLastRaceWeight || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>3走前騎手</label>
                                        <input type="text" name="thirdLastRaceJockey" placeholder="3走前騎手名" value="${horseData.thirdLastRaceJockey || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>3走前人気</label>
                                        <input type="number" name="thirdLastRacePopularity" placeholder="例: 1" value="${horseData.thirdLastRacePopularity || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>3走前着順</label>
                                        <input type="number" name="thirdLastRaceOrder" placeholder="例: 1" value="${horseData.thirdLastRaceOrder || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>3走前上がり3F</label>
                                        <input type="text" name="thirdLastRaceAgari" placeholder="例: 34.1" value="${horseData.thirdLastRaceAgari || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>3走前レースレベル</label>
                                        <select name="thirdLastRaceLevel">
                                            <option value="">選択してください</option>
                                            <option value="G1" ${horseData.thirdLastRaceLevel === 'G1' ? 'selected' : ''}>G1</option>
                                            <option value="G2" ${horseData.thirdLastRaceLevel === 'G2' ? 'selected' : ''}>G2</option>
                                            <option value="G3" ${horseData.thirdLastRaceLevel === 'G3' ? 'selected' : ''}>G3</option>
                                            <option value="L" ${horseData.thirdLastRaceLevel === 'L' ? 'selected' : ''}>Listed（L）</option>
                                            <option value="OP" ${horseData.thirdLastRaceLevel === 'OP' ? 'selected' : ''}>オープン特別</option>
                                            <option value="3勝" ${horseData.thirdLastRaceLevel === '3勝' ? 'selected' : ''}>3勝クラス</option>
                                            <option value="2勝" ${horseData.thirdLastRaceLevel === '2勝' ? 'selected' : ''}>2勝クラス</option>
                                            <option value="1勝" ${horseData.thirdLastRaceLevel === '1勝' ? 'selected' : ''}>1勝クラス</option>
                                            <option value="未勝利" ${horseData.thirdLastRaceLevel === '未勝利' ? 'selected' : ''}>未勝利戦</option>
                                            <option value="新馬" ${horseData.thirdLastRaceLevel === '新馬' ? 'selected' : ''}>新馬戦</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 4走前情報 -->
                            <div style="border: 2px solid #dc3545; padding: 15px; margin-bottom: 15px; border-radius: 8px; background: #fff5f5;">
                                <h5 style="color: #dc3545; margin-bottom: 10px;">4走前</h5>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                                    <div class="form-group">
                                        <label>4走前コース</label>
                                        <input type="text" name="fourthLastRaceCourse" value="${horseData.fourthLastRaceCourse || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>4走前距離</label>
                                        <input type="text" name="fourthLastRaceDistance" value="${horseData.fourthLastRaceDistance || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>4走前馬場</label>
                                        <input type="text" name="fourthLastRaceTrackType" value="${horseData.fourthLastRaceTrackType || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>4走前日</label>
                                        <input type="text" name="fourthLastRaceDate" value="${horseData.fourthLastRaceDate || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>4走前タイム</label>
                                        <input type="text" name="fourthLastRaceTime" placeholder="例: 1:35.2" style="font-family: monospace;" value="${horseData.fourthLastRaceTime || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>4走前馬場状態</label>
                                        <select name="fourthLastRaceTrackCondition">
                                            <option value="">選択してください</option>
                                            <option value="良" ${horseData.fourthLastRaceTrackCondition === '良' ? 'selected' : ''}>良</option>
                                            <option value="稍重" ${horseData.fourthLastRaceTrackCondition === '稍重' ? 'selected' : ''}>稍重</option>
                                            <option value="重" ${horseData.fourthLastRaceTrackCondition === '重' ? 'selected' : ''}>重</option>
                                            <option value="不良" ${horseData.fourthLastRaceTrackCondition === '不良' ? 'selected' : ''}>不良</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>4走前斤量</label>
                                        <input type="number" name="fourthLastRaceWeight" step="0.5" placeholder="例: 56.0" value="${horseData.fourthLastRaceWeight || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>4走前騎手</label>
                                        <input type="text" name="fourthLastRaceJockey" placeholder="4走前騎手名" value="${horseData.fourthLastRaceJockey || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>4走前人気</label>
                                        <input type="number" name="fourthLastRacePopularity" placeholder="例: 1" value="${horseData.fourthLastRacePopularity || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>4走前着順</label>
                                        <input type="number" name="fourthLastRaceOrder" placeholder="例: 1" value="${horseData.fourthLastRaceOrder || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>4走前上がり3F</label>
                                        <input type="text" name="fourthLastRaceAgari" placeholder="例: 34.1" value="${horseData.fourthLastRaceAgari || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>4走前レースレベル</label>
                                        <select name="fourthLastRaceLevel">
                                            <option value="">選択してください</option>
                                            <option value="G1" ${horseData.fourthLastRaceLevel === 'G1' ? 'selected' : ''}>G1</option>
                                            <option value="G2" ${horseData.fourthLastRaceLevel === 'G2' ? 'selected' : ''}>G2</option>
                                            <option value="G3" ${horseData.fourthLastRaceLevel === 'G3' ? 'selected' : ''}>G3</option>
                                            <option value="L" ${horseData.fourthLastRaceLevel === 'L' ? 'selected' : ''}>Listed（L）</option>
                                            <option value="OP" ${horseData.fourthLastRaceLevel === 'OP' ? 'selected' : ''}>オープン特別</option>
                                            <option value="3勝" ${horseData.fourthLastRaceLevel === '3勝' ? 'selected' : ''}>3勝クラス</option>
                                            <option value="2勝" ${horseData.fourthLastRaceLevel === '2勝' ? 'selected' : ''}>2勝クラス</option>
                                            <option value="1勝" ${horseData.fourthLastRaceLevel === '1勝' ? 'selected' : ''}>1勝クラス</option>
                                            <option value="未勝利" ${horseData.fourthLastRaceLevel === '未勝利' ? 'selected' : ''}>未勝利戦</option>
                                            <option value="新馬" ${horseData.fourthLastRaceLevel === '新馬' ? 'selected' : ''}>新馬戦</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 5走前情報 -->
                            <div style="border: 2px solid #6f42c1; padding: 15px; margin-bottom: 15px; border-radius: 8px; background: #f8f5ff;">
                                <h5 style="color: #6f42c1; margin-bottom: 10px;">5走前</h5>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                                    <div class="form-group">
                                        <label>5走前コース</label>
                                        <input type="text" name="fifthLastRaceCourse" value="${horseData.fifthLastRaceCourse || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>5走前距離</label>
                                        <input type="text" name="fifthLastRaceDistance" value="${horseData.fifthLastRaceDistance || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>5走前馬場</label>
                                        <input type="text" name="fifthLastRaceTrackType" value="${horseData.fifthLastRaceTrackType || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>5走前日</label>
                                        <input type="text" name="fifthLastRaceDate" value="${horseData.fifthLastRaceDate || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>5走前タイム</label>
                                        <input type="text" name="fifthLastRaceTime" placeholder="例: 1:35.2" style="font-family: monospace;" value="${horseData.fifthLastRaceTime || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>5走前馬場状態</label>
                                        <select name="fifthLastRaceTrackCondition">
                                            <option value="">選択してください</option>
                                            <option value="良" ${horseData.fifthLastRaceTrackCondition === '良' ? 'selected' : ''}>良</option>
                                            <option value="稍重" ${horseData.fifthLastRaceTrackCondition === '稍重' ? 'selected' : ''}>稍重</option>
                                            <option value="重" ${horseData.fifthLastRaceTrackCondition === '重' ? 'selected' : ''}>重</option>
                                            <option value="不良" ${horseData.fifthLastRaceTrackCondition === '不良' ? 'selected' : ''}>不良</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>5走前斤量</label>
                                        <input type="number" name="fifthLastRaceWeight" step="0.5" placeholder="例: 56.0" value="${horseData.fifthLastRaceWeight || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>5走前騎手</label>
                                        <input type="text" name="fifthLastRaceJockey" placeholder="5走前騎手名" value="${horseData.fifthLastRaceJockey || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>5走前人気</label>
                                        <input type="number" name="fifthLastRacePopularity" placeholder="例: 1" value="${horseData.fifthLastRacePopularity || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>5走前着順</label>
                                        <input type="number" name="fifthLastRaceOrder" placeholder="例: 1" value="${horseData.fifthLastRaceOrder || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>5走前上がり3F</label>
                                        <input type="text" name="fifthLastRaceAgari" placeholder="例: 34.1" value="${horseData.fifthLastRaceAgari || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label>5走前レースレベル</label>
                                        <select name="fifthLastRaceLevel">
                                            <option value="">選択してください</option>
                                            <option value="G1" ${horseData.fifthLastRaceLevel === 'G1' ? 'selected' : ''}>G1</option>
                                            <option value="G2" ${horseData.fifthLastRaceLevel === 'G2' ? 'selected' : ''}>G2</option>
                                            <option value="G3" ${horseData.fifthLastRaceLevel === 'G3' ? 'selected' : ''}>G3</option>
                                            <option value="L" ${horseData.fifthLastRaceLevel === 'L' ? 'selected' : ''}>Listed（L）</option>
                                            <option value="OP" ${horseData.fifthLastRaceLevel === 'OP' ? 'selected' : ''}>オープン特別</option>
                                            <option value="3勝" ${horseData.fifthLastRaceLevel === '3勝' ? 'selected' : ''}>3勝クラス</option>
                                            <option value="2勝" ${horseData.fifthLastRaceLevel === '2勝' ? 'selected' : ''}>2勝クラス</option>
                                            <option value="1勝" ${horseData.fifthLastRaceLevel === '1勝' ? 'selected' : ''}>1勝クラス</option>
                                            <option value="未勝利" ${horseData.fifthLastRaceLevel === '未勝利' ? 'selected' : ''}>未勝利戦</option>
                                            <option value="新馬" ${horseData.fifthLastRaceLevel === '新馬' ? 'selected' : ''}>新馬戦</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const container = document.getElementById('horsesContainer');
        container.appendChild(horseCard);
        
        // カスタム騎手入力フィールドの表示制御
        const jockeySelect = horseCard.querySelector('select[name="jockey"]');
        if (jockeySelect.value === 'custom') {
            horseCard.querySelector('input[name="jockeyCustom"]').style.display = 'block';
        }
        
        //console.log('=== addHorseFromData完了 ===');
    }
    
    // データ検証機能群
    
    // 馬データ入力の検証
    static validateHorseDataInput(horseData) {
        const errors = [];
        const warnings = [];
        
        // 型安全性の確保
        if (typeof horseData !== 'object' || horseData === null) {
            errors.push('馬データが無効なオブジェクトです');
            return { isValid: false, errors, warnings };
        }
        
        // 必須フィールドの検証
        if (!horseData.name || (typeof horseData.name === 'string' && horseData.name.trim() === '')) {
            errors.push('馬名が設定されていません');
        }
        
        // オッズの検証
        if (!horseData.odds) {
            errors.push('オッズが設定されていません');
        } else {
            const odds = parseFloat(horseData.odds);
            if (isNaN(odds)) {
                errors.push('オッズが数値ではありません');
            } else if (odds < this.dataQualityThresholds.minOdds) {
                errors.push(`オッズが最小値（${this.dataQualityThresholds.minOdds}）未満です`);
            } else if (odds > this.dataQualityThresholds.maxOdds) {
                warnings.push(`オッズが${this.dataQualityThresholds.maxOdds}倍を超えています`);
            } else if (odds === 0) {
                errors.push('オッズが0倍です');
            }
        }
        
        // 年齢の検証
        if (horseData.age) {
            const age = parseInt(horseData.age);
            if (isNaN(age)) {
                warnings.push('年齢が数値ではありません');
            } else if (age < this.dataQualityThresholds.minAge || age > this.dataQualityThresholds.maxAge) {
                warnings.push(`年齢が通常範囲外です（${age}歳）`);
            }
        }
        
        // 前走着順の検証
        if (horseData.lastRace) {
            const lastRace = this.parseRaceOrder(horseData.lastRace);
            if (lastRace === null) {
                warnings.push('前走着順の形式が不正です');
            } else if (lastRace > this.dataQualityThresholds.maxLastRaceOrder) {
                warnings.push(`前走着順が${this.dataQualityThresholds.maxLastRaceOrder}着を超えています`);
            }
        }
        
        // 体重の検証
        if (horseData.weight) {
            const weight = parseInt(horseData.weight);
            if (isNaN(weight)) {
                warnings.push('体重が数値ではありません');
            } else if (weight < this.dataQualityThresholds.minWeight || weight > this.dataQualityThresholds.maxWeight) {
                warnings.push(`体重が通常範囲外です（${weight}kg）`);
            }
        }
        
        // 体重変化の検証
        if (horseData.weightChange !== undefined && horseData.weightChange !== null) {
            let weightChange;
            if (typeof horseData.weightChange === 'number') {
                weightChange = Math.abs(horseData.weightChange);
            } else if (typeof horseData.weightChange === 'string') {
                weightChange = parseInt(horseData.weightChange.replace(/[+-]/, ''));
            } else {
                weightChange = NaN;
            }
            
            if (isNaN(weightChange)) {
                warnings.push('体重変化が数値ではありません');
            } else if (weightChange > this.dataQualityThresholds.maxWeightChange) {
                warnings.push(`体重変化が大きすぎます（${horseData.weightChange}kg）`);
            }
        }
        
        // タイムデータの検証
        this.validateTimeData(horseData, errors, warnings);
        
        // 一貫性チェック
        this.validateDataConsistency(horseData, warnings);
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            severity: errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'ok'
        };
    }
    
    // タイムデータの検証
    static validateTimeData(horseData, errors, warnings) {
        const timeFields = [
            'lastRaceTime', 'secondLastRaceTime', 'thirdLastRaceTime', 
            'fourthLastRaceTime', 'fifthLastRaceTime'
        ];
        
        timeFields.forEach(field => {
            if (horseData[field]) {
                const timeValidation = this.validateRaceTime(horseData[field]);
                if (!timeValidation.isValid) {
                    warnings.push(`${field}: ${timeValidation.error}`);
                } else if (timeValidation.isAnomalous) {
                    warnings.push(`${field}: 異常なタイムです（${horseData[field]})}`);
                }
            }
        });
    }
    
    // レースタイムの検証
    static validateRaceTime(timeString) {
        if (!timeString) {
            return { isValid: true, isAnomalous: false };
        }
        
        const timeStr = String(timeString).trim();
        
        // 時間形式の検証（1:23.4 または 83.4 形式）
        const minutePattern = /^(\d+):(\d+)\.(\d+)$/;
        const secondPattern = /^(\d+)\.(\d+)$/;
        
        let totalSeconds = 0;
        
        if (minutePattern.test(timeStr)) {
            const [, minutes, seconds, decimal] = timeStr.match(minutePattern);
            totalSeconds = parseInt(minutes) * 60 + parseInt(seconds) + parseInt(decimal) / 10;
        } else if (secondPattern.test(timeStr)) {
            const [, seconds, decimal] = timeStr.match(secondPattern);
            totalSeconds = parseInt(seconds) + parseInt(decimal) / 10;
        } else {
            return { isValid: false, error: 'タイム形式が不正です' };
        }
        
        // 異常なタイムの検出
        let isAnomalous = false;
        if (totalSeconds < 50 || totalSeconds > 300) { // 50秒〜5分の範囲外
            isAnomalous = true;
        }
        
        return { isValid: true, isAnomalous, totalSeconds };
    }
    
    // データ一貫性の検証
    static validateDataConsistency(horseData, warnings) {
        // 距離とタイムの一貫性チェック
        if (horseData.lastRaceDistance && horseData.lastRaceTime) {
            const distance = parseInt(horseData.lastRaceDistance);
            const timeValidation = this.validateRaceTime(horseData.lastRaceTime);
            
            if (timeValidation.isValid && distance && timeValidation.totalSeconds) {
                const expectedTimeRange = this.getExpectedTimeRange(distance);
                if (timeValidation.totalSeconds < expectedTimeRange.min || 
                    timeValidation.totalSeconds > expectedTimeRange.max) {
                    warnings.push(`距離${distance}mに対してタイム${horseData.lastRaceTime}が異常です`);
                }
            }
        }
        
        // レースレベルと着順の一貫性チェック
        if (horseData.lastRaceLevel && horseData.lastRace) {
            const lastRace = this.parseRaceOrder(horseData.lastRace);
            if (lastRace && this.isHighLevelRace(horseData.lastRaceLevel) && lastRace <= 3) {
                // 高レベルレースで3着以内は優秀
            } else if (lastRace && this.isHighLevelRace(horseData.lastRaceLevel) && lastRace > 10) {
                warnings.push(`${horseData.lastRaceLevel}で${lastRace}着は成績が振るいません`);
            }
        }
    }
    
    // 期待タイム範囲を取得
    static getExpectedTimeRange(distance) {
        const baseTime = {
            1000: { min: 56, max: 62 },
            1200: { min: 68, max: 75 },
            1400: { min: 80, max: 88 },
            1600: { min: 92, max: 100 },
            1800: { min: 104, max: 114 },
            2000: { min: 116, max: 128 },
            2400: { min: 140, max: 155 }
        };
        
        // 最も近い距離を見つける
        const distances = Object.keys(baseTime).map(d => parseInt(d));
        const closestDistance = distances.reduce((prev, curr) => 
            Math.abs(curr - distance) < Math.abs(prev - distance) ? curr : prev
        );
        
        return baseTime[closestDistance] || { min: 50, max: 300 };
    }
    
    // 高レベルレースかどうか判定
    static isHighLevelRace(raceLevel) {
        return ['G1', 'G2', 'G3', 'L', 'OP'].includes(raceLevel);
    }
    
    // 馬データの修復
    static repairHorseDataInput(horseData, errors) {
        const repairedData = { ...horseData };
        let repairSuccessful = true;
        
        errors.forEach(error => {
            if (error.includes('馬名が設定されていません')) {
                repairedData.name = `不明馬_${Date.now()}`;
                console.log('馬名を自動設定:', repairedData.name);
            } else if (error.includes('オッズ')) {
                repairedData.odds = 99.9;
                console.log('オッズをデフォルト値に設定:', repairedData.odds);
            } else if (error.includes('オッズが0倍')) {
                repairedData.odds = 999.9; // 0倍は999.9倍に修正
                console.log('0倍オッズを修正:', repairedData.odds);
            } else {
                console.warn('修復不可能なエラー:', error);
                repairSuccessful = false;
            }
        });
        
        return repairSuccessful ? repairedData : null;
    }
    
    // 検証警告を記録
    static recordValidationWarning(horseName, warnings) {
        const warningRecord = {
            timestamp: new Date().toISOString(),
            horse: horseName,
            warnings: warnings
        };
        
        this.validationErrors.push(warningRecord);
        
        // 警告履歴を最新100件まで保持
        if (this.validationErrors.length > 100) {
            this.validationErrors = this.validationErrors.slice(-100);
        }
    }
    
    // システムの健全性をチェック
    static checkSystemHealth() {
        const horses = this.getAllHorses();
        let healthScore = 100;
        let issues = [];
        
        // データ数チェック
        if (horses.length === 0) {
            issues.push('馬データが登録されていません');
            healthScore -= 50;
        } else if (horses.length < 8) {
            issues.push('馬データが少なすぎます（8頭未満）');
            healthScore -= 20;
        }
        
        // データ品質チェック
        const anomalyCount = this.detectSystemAnomalies(horses).length;
        if (anomalyCount > 0) {
            issues.push(`${anomalyCount}件の異常データを検出`);
            healthScore -= anomalyCount * 5;
        }
        
        // 最近の検証エラー数チェック
        const recentErrors = this.validationErrors.filter(e => 
            new Date(e.timestamp) > new Date(Date.now() - 60 * 60 * 1000) // 1時間以内
        ).length;
        
        if (recentErrors > 10) {
            issues.push('最近の検証エラーが多すぎます');
            healthScore -= 30;
        }
        
        const isHealthy = healthScore >= 70;
        
        if (!isHealthy) {
            console.warn('システム健全性チェック:', {
                score: healthScore,
                issues: issues,
                horses: horses.length,
                anomalies: anomalyCount,
                recentErrors: recentErrors
            });
        }
        
        return isHealthy;
    }
    
    // システム全体の異常を検出
    static detectSystemAnomalies(horses) {
        const anomalies = [];
        
        horses.forEach((horse, index) => {
            // 極端に低いまたは高いオッズ
            if (horse.odds && (parseFloat(horse.odds) === 0 || parseFloat(horse.odds) > 500)) {
                anomalies.push({
                    type: 'extreme_odds',
                    horse: horse.name,
                    value: horse.odds,
                    message: `異常なオッズ: ${horse.odds}倍`
                });
            }
            
            // 重複馬名
            const duplicates = horses.filter(h => h.name === horse.name);
            if (duplicates.length > 1) {
                anomalies.push({
                    type: 'duplicate_name',
                    horse: horse.name,
                    message: '馬名が重複しています'
                });
            }
            
            // 年齢異常
            if (horse.age && (parseInt(horse.age) < 2 || parseInt(horse.age) > 12)) {
                anomalies.push({
                    type: 'unusual_age',
                    horse: horse.name,
                    value: horse.age,
                    message: `異常な年齢: ${horse.age}歳`
                });
            }
        });
        
        return anomalies;
    }
    
    // データ検証統計を取得
    static getValidationStats() {
        const horses = this.getAllHorses();
        const anomalies = this.detectSystemAnomalies(horses);
        
        return {
            totalHorses: horses.length,
            anomalies: anomalies.length,
            recentWarnings: this.validationErrors.filter(e => 
                new Date(e.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
            ).length,
            healthScore: this.checkSystemHealth() ? 'Good' : 'Poor'
        };
    }
}

// グローバル関数として公開
window.addHorse = HorseManager.addHorse.bind(HorseManager);
window.removeHorse = HorseManager.removeHorse.bind(HorseManager);
window.clearAllHorses = HorseManager.clearAllHorses.bind(HorseManager);
window.addSampleHorses = HorseManager.addSampleHorses.bind(HorseManager);
window.toggleCustomJockey = HorseManager.toggleCustomJockey.bind(HorseManager);
window.addHorseFromData = HorseManager.addHorseFromData.bind(HorseManager);