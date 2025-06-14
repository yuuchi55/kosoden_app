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