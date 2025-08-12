// 統計関連の機能

// 統計更新
function updateStats() {
    // 総学習時間（時間）
    const totalHours = Math.floor(app.stats.totalSquares * 25 / 60);
    document.getElementById('totalHours').textContent = totalHours;
    
    // 今日の学習時間（時間）
    const todayHours = (app.stats.todaySquares * 25 / 60).toFixed(1);
    document.getElementById('todayHours').textContent = todayHours;
    
    // 連続学習日数
    updateStreakDays();
    document.getElementById('streakDays').textContent = app.stats.streakDays;
    
    // 週平均（過去7日間の平均）
    const weeklyAvg = calculateWeeklyAverage();
    document.getElementById('weeklyAvg').textContent = weeklyAvg;
    
    // グラフを更新
    updateWeeklyChart();
    updateSubjectStats();
}

// 連続学習日数の更新
function updateStreakDays() {
    const today = new Date().toDateString();
    
    if (app.stats.lastStudyDate) {
        const lastDate = new Date(app.stats.lastStudyDate);
        const todayDate = new Date(today);
        const diffTime = Math.abs(todayDate - lastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            // 連続している
            if (app.stats.todaySquares > 0) {
                app.stats.streakDays++;
            }
        } else if (diffDays > 1) {
            // 連続が途切れた
            app.stats.streakDays = app.stats.todaySquares > 0 ? 1 : 0;
        }
    } else {
        // 初回
        app.stats.streakDays = app.stats.todaySquares > 0 ? 1 : 0;
    }
    
    if (app.stats.todaySquares > 0) {
        app.stats.lastStudyDate = today;
    }
}

// 週平均の計算
function calculateWeeklyAverage() {
    // LocalStorageから過去7日間のデータを取得
    const weekData = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateKey = `kosodenDaily_${date.toISOString().split('T')[0]}`;
        const dayData = localStorage.getItem(dateKey);
        
        if (dayData) {
            const squares = JSON.parse(dayData).squares || 0;
            weekData.push(squares);
        } else {
            weekData.push(0);
        }
    }
    
    // 今日のデータも保存
    const todayKey = `kosodenDaily_${today.toISOString().split('T')[0]}`;
    localStorage.setItem(todayKey, JSON.stringify({ squares: app.stats.todaySquares }));
    
    // 平均を計算
    const totalSquares = weekData.reduce((sum, val) => sum + val, 0);
    const avgHours = (totalSquares * 25 / 60 / 7).toFixed(1);
    
    return avgHours;
}

// 週間チャートの更新
function updateWeeklyChart() {
    const canvas = document.getElementById('weeklyChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = 200;
    
    // データを取得
    const weekData = [];
    const labels = [];
    const today = new Date();
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateKey = `kosodenDaily_${date.toISOString().split('T')[0]}`;
        const dayData = localStorage.getItem(dateKey);
        
        const squares = dayData ? JSON.parse(dayData).squares || 0 : 0;
        const hours = (squares * 25 / 60).toFixed(1);
        weekData.push(parseFloat(hours));
        labels.push(days[date.getDay()]);
    }
    
    // 最大値を取得
    const maxValue = Math.max(...weekData, 1);
    
    // クリア
    ctx.clearRect(0, 0, width, height);
    
    // グラフを描画
    const barWidth = width / 7 * 0.7;
    const barGap = width / 7 * 0.3;
    const chartHeight = height - 40;
    
    weekData.forEach((value, index) => {
        const barHeight = (value / maxValue) * chartHeight;
        const x = index * (barWidth + barGap) + barGap / 2;
        const y = height - barHeight - 20;
        
        // グラデーション
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        
        // バーを描画
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // ラベル
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-secondary');
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(labels[index], x + barWidth / 2, height - 5);
        
        // 値
        if (value > 0) {
            ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-primary');
            ctx.fillText(value + 'h', x + barWidth / 2, y - 5);
        }
    });
}

// 科目別統計の更新
function updateSubjectStats() {
    const subjectData = {};
    
    // データを集計
    app.gridData.forEach(data => {
        if (data && data.subject) {
            if (!subjectData[data.subject]) {
                subjectData[data.subject] = { count: 0, color: data.color };
            }
            subjectData[data.subject].count++;
        }
    });
    
    // 表示を更新
    const container = document.getElementById('subjectBars');
    if (!container) return;
    
    container.innerHTML = '';
    
    const maxCount = Math.max(...Object.values(subjectData).map(d => d.count), 1);
    
    Object.entries(subjectData).forEach(([subject, data]) => {
        if (!subject) return;
        
        const percentage = (data.count / maxCount) * 100;
        const hours = (data.count * 25 / 60).toFixed(1);
        
        const barDiv = document.createElement('div');
        barDiv.className = 'subject-bar';
        
        barDiv.innerHTML = `
            <div class="subject-bar-label">
                <span>${subject}</span>
                <span>${hours}時間</span>
            </div>
            <div class="subject-bar-track">
                <div class="subject-bar-fill" style="width: ${percentage}%; background: ${data.color};">
                    ${Math.round(percentage)}%
                </div>
            </div>
        `;
        
        container.appendChild(barDiv);
    });
    
    if (Object.keys(subjectData).length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">まだデータがありません</p>';
    }
}