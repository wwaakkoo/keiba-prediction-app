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
                        <option value="0">変化なし</option>
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
                            <option value="中山">中山</option>
                            <option value="東京">東京</option>
                            <option value="京都">京都</option>
                            <option value="阪神">阪神</option>
                            <option value="新潟">新潟</option>
                            <option value="福島">福島</option>
                            <option value="中京">中京</option>
                            <option value="小倉">小倉</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>距離</label>
                        <select name="distance">
                            <option value="1000">1000m</option>
                            <option value="1200">1200m</option>
                            <option value="1400">1400m</option>
                            <option value="1600" selected>1600m</option>
                            <option value="1800">1800m</option>
                            <option value="2000">2000m</option>
                            <option value="2200">2200m</option>
                            <option value="2400">2400m</option>
                            <option value="2500">2500m</option>
                            <option value="3000">3000m</option>
                            <option value="3200">3200m</option>
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
                <h4>📊 前走情報</h4>
                <div class="horse-content">
                    <div class="form-group">
                        <label>前走コース</label>
                        <input type="text" name="lastRaceCourse" readonly>
                    </div>
                    <div class="form-group">
                        <label>前走距離</label>
                        <input type="text" name="lastRaceDistance" readonly>
                    </div>
                    <div class="form-group">
                        <label>前走馬場</label>
                        <input type="text" name="lastRaceTrackType" readonly>
                    </div>
                    <div class="form-group">
                        <label>前走日</label>
                        <input type="text" name="lastRaceDate" readonly>
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
                        <label>前走天候</label>
                        <select name="lastRaceWeather">
                            <option value="">選択してください</option>
                            <option value="晴">晴</option>
                            <option value="曇">曇</option>
                            <option value="雨">雨</option>
                            <option value="小雨">小雨</option>
                            <option value="雪">雪</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>前走斤量</label>
                        <input type="number" name="lastRaceWeight" step="0.5" placeholder="例: 56.0">
                    </div>
                    <div class="form-group">
                        <label>前走騎手</label>
                        <input type="text" name="lastRaceJockey" placeholder="前走の騎手名">
                    </div>
                    <div class="form-group">
                        <label>前走オッズ</label>
                        <input type="number" name="lastRaceOdds" step="0.1" placeholder="例: 8.5">
                    </div>
                    <div class="form-group">
                        <label>前走人気</label>
                        <input type="number" name="lastRacePopularity" placeholder="例: 3">
                    </div>
                    <div class="form-group">
                        <label>前走頭数</label>
                        <input type="number" name="lastRaceHorseCount" placeholder="例: 16">
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
        button.parentNode.remove();
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
            const horseName = card.querySelector('input[name="horseName"]').value || '名前未入力';
            const odds = parseFloat(card.querySelector('input[name="odds"]').value) || 10;
            const lastRace = parseInt(card.querySelector('select[name="lastRace"]').value) || 6;
            
            const jockeySelect = card.querySelector('select[name="jockey"]');
            const jockeyCustom = card.querySelector('input[name="jockeyCustom"]');
            let jockey = '';
            
            if (jockeySelect.value === 'custom') {
                jockey = jockeyCustom.value || '騎手未入力';
            } else {
                jockey = jockeySelect.value || '騎手未入力';
            }

            // 基本情報
            const age = parseInt(card.querySelector('select[name="age"]').value) || 5;
            const weightChange = parseInt(card.querySelector('select[name="weightChange"]').value) || 0;

            // 今回のレース情報
            const course = card.querySelector('select[name="course"]').value || '東京';
            const distance = parseInt(card.querySelector('select[name="distance"]').value) || 1600;
            const trackType = card.querySelector('select[name="trackType"]').value || '芝';
            const weather = card.querySelector('select[name="weather"]').value || '晴';
            const trackCondition = card.querySelector('select[name="trackCondition"]').value || '良';
            const restDays = parseInt(card.querySelector('select[name="restDays"]').value) || 14;

            // 前走情報（自動抽出）
            const lastRaceCourse = card.querySelector('input[name="lastRaceCourse"]').value || '';
            const lastRaceDistance = card.querySelector('input[name="lastRaceDistance"]').value || '';
            const lastRaceTrackType = card.querySelector('input[name="lastRaceTrackType"]').value || '';
            const lastRaceDate = card.querySelector('input[name="lastRaceDate"]').value || '';

            // 新しく追加した詳細前走情報
            const lastRaceTime = card.querySelector('input[name="lastRaceTime"]').value || '';
            const lastRaceTrackCondition = card.querySelector('select[name="lastRaceTrackCondition"]').value || '';
            const lastRaceWeather = card.querySelector('select[name="lastRaceWeather"]').value || '';
            const lastRaceWeight = parseFloat(card.querySelector('input[name="lastRaceWeight"]').value) || 0;
            const lastRaceJockey = card.querySelector('input[name="lastRaceJockey"]').value || '';
            const lastRaceOdds = parseFloat(card.querySelector('input[name="lastRaceOdds"]').value) || 0;
            const lastRacePopularity = parseInt(card.querySelector('input[name="lastRacePopularity"]').value) || 0;
            const lastRaceHorseCount = parseInt(card.querySelector('input[name="lastRaceHorseCount"]').value) || 0;

            horses.push({
                name: horseName,
                odds: odds,
                lastRace: lastRace,
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
                lastRaceWeather: lastRaceWeather,
                lastRaceWeight: lastRaceWeight,
                lastRaceJockey: lastRaceJockey,
                lastRaceOdds: lastRaceOdds,
                lastRacePopularity: lastRacePopularity,
                lastRaceHorseCount: lastRaceHorseCount
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
                    <input type="text" name="horseName" placeholder="馬名を入力" value="${horseData.name || ''}">
                </div>
                <div class="form-group">
                    <label>オッズ</label>
                    <input type="number" name="odds" step="0.1" placeholder="10.0" value="${horseData.odds || ''}">
                </div>
                <div class="form-group">
                    <label>前走着順</label>
                    <select name="lastRace">
                        <option value="1" ${horseData.lastRace === 1 ? 'selected' : ''}>1着</option>
                        <option value="2" ${horseData.lastRace === 2 ? 'selected' : ''}>2着</option>
                        <option value="3" ${horseData.lastRace === 3 ? 'selected' : ''}>3着</option>
                        <option value="4" ${horseData.lastRace === 4 ? 'selected' : ''}>4着</option>
                        <option value="5" ${horseData.lastRace === 5 ? 'selected' : ''}>5着</option>
                        <option value="6" ${horseData.lastRace === 6 ? 'selected' : ''}>6着</option>
                        <option value="7" ${horseData.lastRace === 7 ? 'selected' : ''}>7着</option>
                        <option value="8" ${horseData.lastRace === 8 ? 'selected' : ''}>8着</option>
                        <option value="9" ${horseData.lastRace === 9 ? 'selected' : ''}>9着</option>
                        <option value="10" ${horseData.lastRace === 10 ? 'selected' : ''}>10着以下</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>騎手</label>
                    <select name="jockey" onchange="HorseManager.toggleCustomJockey(this)">
                        <option value="武豊" ${horseData.jockey === '武豊' ? 'selected' : ''}>武豊</option>
                        <option value="川田将雅" ${horseData.jockey === '川田将雅' ? 'selected' : ''}>川田将雅</option>
                        <option value="C.ルメール" ${horseData.jockey === 'C.ルメール' ? 'selected' : ''}>C.ルメール</option>
                        <option value="横山武史" ${horseData.jockey === '横山武史' ? 'selected' : ''}>横山武史</option>
                        <option value="戸崎圭太" ${horseData.jockey === '戸崎圭太' ? 'selected' : ''}>戸崎圭太</option>
                        <option value="福永祐一" ${horseData.jockey === '福永祐一' ? 'selected' : ''}>福永祐一</option>
                        <option value="M.デムーロ" ${horseData.jockey === 'M.デムーロ' ? 'selected' : ''}>M.デムーロ</option>
                        <option value="横山典弘" ${horseData.jockey === '横山典弘' ? 'selected' : ''}>横山典弘</option>
                        <option value="岩田康誠" ${horseData.jockey === '岩田康誠' ? 'selected' : ''}>岩田康誠</option>
                        <option value="池添謙一" ${horseData.jockey === '池添謙一' ? 'selected' : ''}>池添謙一</option>
                        <option value="横山和生" ${horseData.jockey === '横山和生' ? 'selected' : ''}>横山和生</option>
                        <option value="D.レーン" ${horseData.jockey === 'D.レーン' ? 'selected' : ''}>D.レーン</option>
                        <option value="custom" ${!['武豊', '川田将雅', 'C.ルメール', '横山武史', '戸崎圭太', '福永祐一', 'M.デムーロ', '横山典弘', '岩田康誠', '池添謙一', '横山和生', 'D.レーン'].includes(horseData.jockey) && horseData.jockey ? 'selected' : ''}>その他（入力）</option>
                    </select>
                    <input type="text" name="jockeyCustom" placeholder="騎手名を入力" value="${!['武豊', '川田将雅', 'C.ルメール', '横山武史', '戸崎圭太', '福永祐一', 'M.デムーロ', '横山典弘', '岩田康誠', '池添謙一', '横山和生', 'D.レーン'].includes(horseData.jockey) && horseData.jockey ? horseData.jockey : ''}" style="display: ${!['武豊', '川田将雅', 'C.ルメール', '横山武史', '戸崎圭太', '福永祐一', 'M.デムーロ', '横山典弘', '岩田康誠', '池添謙一', '横山和生', 'D.レーン'].includes(horseData.jockey) && horseData.jockey ? 'block' : 'none'}; margin-top: 5px;">
                </div>
                <div class="form-group">
                    <label>年齢</label>
                    <select name="age">
                        <option value="3" ${horseData.age === 3 ? 'selected' : ''}>3歳</option>
                        <option value="4" ${horseData.age === 4 ? 'selected' : ''}>4歳</option>
                        <option value="5" ${horseData.age === 5 ? 'selected' : ''}>5歳</option>
                        <option value="6" ${horseData.age === 6 ? 'selected' : ''}>6歳</option>
                        <option value="7" ${horseData.age === 7 ? 'selected' : ''}>7歳</option>
                        <option value="8" ${horseData.age === 8 ? 'selected' : ''}>8歳以上</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>馬体重変化</label>
                    <select name="weightChange">
                        <option value="0" ${horseData.weightChange === 0 ? 'selected' : ''}>変化なし</option>
                        <option value="1" ${horseData.weightChange === 1 ? 'selected' : ''}>増加</option>
                        <option value="-1" ${horseData.weightChange === -1 ? 'selected' : ''}>減少</option>
                    </select>
                </div>
            </div>
            <div class="horse-section">
                <h4>🏁 今回のレース情報</h4>
                <div class="horse-content">
                    <div class="form-group">
                        <label>コース</label>
                        <select name="course">
                            <option value="中山" ${horseData.course === '中山' ? 'selected' : ''}>中山</option>
                            <option value="東京" ${horseData.course === '東京' ? 'selected' : ''}>東京</option>
                            <option value="京都" ${horseData.course === '京都' ? 'selected' : ''}>京都</option>
                            <option value="阪神" ${horseData.course === '阪神' ? 'selected' : ''}>阪神</option>
                            <option value="新潟" ${horseData.course === '新潟' ? 'selected' : ''}>新潟</option>
                            <option value="福島" ${horseData.course === '福島' ? 'selected' : ''}>福島</option>
                            <option value="中京" ${horseData.course === '中京' ? 'selected' : ''}>中京</option>
                            <option value="小倉" ${horseData.course === '小倉' ? 'selected' : ''}>小倉</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>距離</label>
                        <select name="distance">
                            <option value="1000" ${horseData.distance === 1000 ? 'selected' : ''}>1000m</option>
                            <option value="1200" ${horseData.distance === 1200 ? 'selected' : ''}>1200m</option>
                            <option value="1400" ${horseData.distance === 1400 ? 'selected' : ''}>1400m</option>
                            <option value="1600" ${horseData.distance === 1600 ? 'selected' : ''}>1600m</option>
                            <option value="1800" ${horseData.distance === 1800 ? 'selected' : ''}>1800m</option>
                            <option value="2000" ${horseData.distance === 2000 ? 'selected' : ''}>2000m</option>
                            <option value="2200" ${horseData.distance === 2200 ? 'selected' : ''}>2200m</option>
                            <option value="2400" ${horseData.distance === 2400 ? 'selected' : ''}>2400m</option>
                            <option value="2500" ${horseData.distance === 2500 ? 'selected' : ''}>2500m</option>
                            <option value="3000" ${horseData.distance === 3000 ? 'selected' : ''}>3000m</option>
                            <option value="3200" ${horseData.distance === 3200 ? 'selected' : ''}>3200m</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>馬場種別</label>
                        <select name="trackType">
                            <option value="芝" ${horseData.trackType === '芝' ? 'selected' : ''}>芝</option>
                            <option value="ダート" ${horseData.trackType === 'ダート' ? 'selected' : ''}>ダート</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>天気</label>
                        <select name="weather">
                            <option value="晴" ${horseData.weather === '晴' ? 'selected' : ''}>晴</option>
                            <option value="曇" ${horseData.weather === '曇' ? 'selected' : ''}>曇</option>
                            <option value="雨" ${horseData.weather === '雨' ? 'selected' : ''}>雨</option>
                            <option value="雪" ${horseData.weather === '雪' ? 'selected' : ''}>雪</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>馬場状態</label>
                        <select name="trackCondition">
                            <option value="良" ${horseData.trackCondition === '良' ? 'selected' : ''}>良</option>
                            <option value="稍重" ${horseData.trackCondition === '稍重' ? 'selected' : ''}>稍重</option>
                            <option value="重" ${horseData.trackCondition === '重' ? 'selected' : ''}>重</option>
                            <option value="不良" ${horseData.trackCondition === '不良' ? 'selected' : ''}>不良</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>休養期間</label>
                        <select name="restDays">
                            <option value="7" ${horseData.restDays === 7 ? 'selected' : ''}>7日以内</option>
                            <option value="14" ${horseData.restDays === 14 ? 'selected' : ''}>8-14日</option>
                            <option value="21" ${horseData.restDays === 21 ? 'selected' : ''}>15-21日</option>
                            <option value="28" ${horseData.restDays === 28 ? 'selected' : ''}>22-28日</option>
                            <option value="35" ${horseData.restDays === 35 ? 'selected' : ''}>29-35日</option>
                            <option value="42" ${horseData.restDays === 42 ? 'selected' : ''}>36-42日</option>
                            <option value="49" ${horseData.restDays === 49 ? 'selected' : ''}>43-49日</option>
                            <option value="56" ${horseData.restDays === 56 ? 'selected' : ''}>50日以上</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="horse-section">
                <h4>📊 前走情報</h4>
                <div class="horse-content">
                    <div class="form-group">
                        <label>前走コース</label>
                        <input type="text" name="lastRaceCourse" readonly value="${horseData.lastRaceCourse || ''}">
                    </div>
                    <div class="form-group">
                        <label>前走距離</label>
                        <input type="text" name="lastRaceDistance" readonly value="${horseData.lastRaceDistance || ''}">
                    </div>
                    <div class="form-group">
                        <label>前走馬場</label>
                        <input type="text" name="lastRaceTrackType" readonly value="${horseData.lastRaceTrackType || ''}">
                    </div>
                    <div class="form-group">
                        <label>前走日</label>
                        <input type="text" name="lastRaceDate" readonly value="${horseData.lastRaceDate || ''}">
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
                        <label>前走天候</label>
                        <select name="lastRaceWeather">
                            <option value="" ${!horseData.lastRaceWeather ? 'selected' : ''}>選択してください</option>
                            <option value="晴" ${horseData.lastRaceWeather === '晴' ? 'selected' : ''}>晴</option>
                            <option value="曇" ${horseData.lastRaceWeather === '曇' ? 'selected' : ''}>曇</option>
                            <option value="雨" ${horseData.lastRaceWeather === '雨' ? 'selected' : ''}>雨</option>
                            <option value="小雨" ${horseData.lastRaceWeather === '小雨' ? 'selected' : ''}>小雨</option>
                            <option value="雪" ${horseData.lastRaceWeather === '雪' ? 'selected' : ''}>雪</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>前走斤量</label>
                        <input type="number" name="lastRaceWeight" step="0.5" placeholder="例: 56.0" value="${horseData.lastRaceWeight || ''}">
                    </div>
                    <div class="form-group">
                        <label>前走騎手</label>
                        <input type="text" name="lastRaceJockey" placeholder="前走騎手名" value="${horseData.lastRaceJockey || ''}">
                    </div>
                    <div class="form-group">
                        <label>前走オッズ</label>
                        <input type="number" name="lastRaceOdds" step="0.1" placeholder="例: 3.5" value="${horseData.lastRaceOdds || ''}">
                    </div>
                    <div class="form-group">
                        <label>前走人気</label>
                        <input type="number" name="lastRacePopularity" placeholder="例: 1" value="${horseData.lastRacePopularity || ''}">
                    </div>
                    <div class="form-group">
                        <label>前走頭数</label>
                        <input type="number" name="lastRaceHorseCount" placeholder="例: 15" value="${horseData.lastRaceHorseCount || ''}">
                    </div>
                    <div class="form-group">
                        <label>前走馬体重変化</label>
                        <input type="number" name="lastRaceWeightChange" step="1" placeholder="例: +2" value="${horseData.lastRaceWeightChange || ''}">
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(horseCard);
        
        // カスタム騎手入力フィールドの表示制御
        const jockeySelect = horseCard.querySelector('select[name="jockey"]');
        if (jockeySelect.value === 'custom') {
            horseCard.querySelector('input[name="jockeyCustom"]').style.display = 'block';
        }
    }
}

// グローバル関数として公開
window.addHorse = HorseManager.addHorse.bind(HorseManager);
window.removeHorse = HorseManager.removeHorse.bind(HorseManager);
window.clearAllHorses = HorseManager.clearAllHorses.bind(HorseManager);
window.addSampleHorses = HorseManager.addSampleHorses.bind(HorseManager);
window.toggleCustomJockey = HorseManager.toggleCustomJockey.bind(HorseManager);
window.addHorseFromData = HorseManager.addHorseFromData.bind(HorseManager); 