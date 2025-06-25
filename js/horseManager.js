// 馬データ管理機能
class HorseManager {
    static horseCount = 0;

    static addHorse() {
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
                <h4>📊 過去2走情報</h4>
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
            const lastRaceOrder = lastRaceOrderInput ? parseInt(lastRaceOrderInput.value) : '';
            let lastRace;
            if (lastRaceOrderInput && lastRaceOrderInput.value) {
                lastRace = parseInt(lastRaceOrderInput.value);
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
            const secondLastRaceOrder = secondLastRaceOrderInput ? parseInt(secondLastRaceOrderInput.value) : 0;
            const secondLastRaceAgariInput = card.querySelector('input[name="secondLastRaceAgari"]');
            const secondLastRaceAgari = secondLastRaceAgariInput ? secondLastRaceAgariInput.value : '';

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
                <h4>📊 過去2走情報</h4>
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
}

// グローバル関数として公開
window.addHorse = HorseManager.addHorse.bind(HorseManager);
window.removeHorse = HorseManager.removeHorse.bind(HorseManager);
window.clearAllHorses = HorseManager.clearAllHorses.bind(HorseManager);
window.addSampleHorses = HorseManager.addSampleHorses.bind(HorseManager);
window.toggleCustomJockey = HorseManager.toggleCustomJockey.bind(HorseManager);
window.addHorseFromData = HorseManager.addHorseFromData.bind(HorseManager);