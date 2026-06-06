function escapeAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// アプリケーションの状態管理
const app = {
    timer: {
        minutes: 25,
        seconds: 0,
        isRunning: false,
        interval: null
    },
    useTimer: false,
    selectedColor: '#FF6B6B',
    selectedSubject: '数学',
    selectedPenId: 0,
    soundEnabled: true,
    dailyGoal: 4,
    gridData: [],
    currentSquareIndex: 0,
    eraserMode: false,
    stats: {
        totalSquares: 0,
        todaySquares: 0,
        streakDays: 0,
        lastStudyDate: null
    },
    pens: [
        { color: '#FF6B6B', subject: '数学' },
        { color: '#4ECDC4', subject: '英語' },
        { color: '#45B7D1', subject: '国語' },
        { color: '#FFA07A', subject: '理科' },
        { color: '#98D8C8', subject: '社会' },
        { color: '#FECA57', subject: '' }
    ]
};

// 初期化
function init() {
    loadData();
    loadTheme();
    setupEventListeners();
    initGrid();
    updateDisplay();
    updateStats();
    updateGoalHint();
    initMobileNav();
}

// モバイルナビゲーション
function initMobileNav() {
    document.body.dataset.mobileTab = 'record';

    document.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.mobile-nav-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            document.body.dataset.mobileTab = item.dataset.tab;
        });
    });
}

// テーマの読み込み
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').textContent = '☀️';
    }
}

// イベントリスナーの設定
function setupEventListeners() {
    // 記録ボタン
    document.getElementById('recordButton').addEventListener('click', recordStudy);
    
    // タイマーオプション
    document.getElementById('useTimer').addEventListener('change', toggleTimerOption);
    
    // ペン選択
    updatePenListeners();
    
    // 科目追加ボタン
    document.getElementById('addPenButton').addEventListener('click', addPen);
    
    // サウンドトグル
    document.getElementById('soundToggle').addEventListener('click', toggleSound);
    
    // テーマトグル
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // グリッドクリック
    document.getElementById('gridContainer').addEventListener('click', handleGridClick);

    // 目標入力
    document.getElementById('dailyGoalInput').addEventListener('input', (e) => {
        const val = Math.max(1, Math.min(24, parseInt(e.target.value) || 1));
        app.dailyGoal = val;
        updateGoalHint();
        updateGoalBar();
        saveData();
    });
    
    // 消しゴムボタン
    document.getElementById('eraserButton').addEventListener('click', toggleEraser);
    
    // 全て消すボタン
    document.getElementById('clearAllButton').addEventListener('click', clearAll);
}

// ペンリスナーの更新
function updatePenListeners() {
    document.querySelectorAll('.pen-item').forEach((item, index) => {
        const penColor = item.querySelector('.pen-color');
        const input = item.querySelector('.pen-name-input');
        
        // ペン色クリックで選択
        penColor.addEventListener('click', () => selectPen(index));

        // カラーピッカーで色を変更
        const colorPicker = item.querySelector('.color-picker');
        if (colorPicker) {
            colorPicker.addEventListener('input', (e) => {
                const newColor = e.target.value;
                if (index < app.pens.length) {
                    app.pens[index].color = newColor;
                    penColor.style.backgroundColor = newColor;
                    if (index === app.selectedPenId) {
                        app.selectedColor = newColor;
                    }
                    saveData();
                }
            });
        }

        // 入力フィールドの変更を保存
        input.addEventListener('input', (e) => {
            if (index < app.pens.length) {
                app.pens[index].subject = e.target.value;
                if (index === app.selectedPenId) {
                    app.selectedSubject = e.target.value;
                }
                saveData();
            }
        });
        
        // 入力フィールドクリックでも選択
        input.addEventListener('focus', () => selectPen(index));
    });
}

// ペン選択
function selectPen(index) {
    if (index >= app.pens.length) return;
    
    document.querySelectorAll('.pen-item').forEach(el => {
        el.classList.remove('selected');
    });
    
    const items = document.querySelectorAll('.pen-item');
    if (items[index]) {
        items[index].classList.add('selected');
        app.selectedPenId = index;
        app.selectedColor = app.pens[index].color;
        app.selectedSubject = app.pens[index].subject;
    }
}

// 科目を追加
function addPen() {
    if (app.pens.length >= 12) {
        alert('科目は最大12個までです');
        return;
    }
    
    const colors = ['#A29BFE', '#FD79A8', '#81ECEC', '#FDCB6E', '#6C5CE7', '#A8E6CF', '#FFB6C1', '#C9ADA7'];
    const newColor = colors[app.pens.length % colors.length];
    
    app.pens.push({ color: newColor, subject: '' });
    updatePenList();
    saveData();
}

// ペンリストの更新
function updatePenList() {
    const penList = document.getElementById('penList');
    penList.innerHTML = '';
    
    app.pens.forEach((pen, index) => {
        const penItem = document.createElement('div');
        penItem.className = 'pen-item';
        if (index === app.selectedPenId) {
            penItem.className += ' selected';
        }
        penItem.dataset.color = pen.color;
        penItem.dataset.penId = index;
        
        penItem.innerHTML = `
            <div class="pen-color" style="background-color: ${pen.color};" title="クリックで色を変更">
                <input type="color" class="color-picker" value="${pen.color}">
            </div>
            <input type="text" class="pen-name-input" placeholder="科目名" value="${escapeAttr(pen.subject || '')}">
            ${app.pens.length > 1 ? '<span class="pen-delete" onclick="deletePen(' + index + ')">×</span>' : ''}
        `;
        
        penList.appendChild(penItem);
    });
    
    updatePenListeners();
}

// 科目を削除
function deletePen(index) {
    if (app.pens.length <= 1) return;
    
    app.pens.splice(index, 1);
    
    if (app.selectedPenId >= app.pens.length) {
        app.selectedPenId = app.pens.length - 1;
    }
    
    if (app.selectedPenId === index) {
        selectPen(0);
    }
    
    updatePenList();
    saveData();
}

// サウンド切り替え
function toggleSound() {
    app.soundEnabled = !app.soundEnabled;
    const button = document.getElementById('soundToggle');
    button.textContent = app.soundEnabled ? '🔊' : '🔇';
    button.classList.toggle('muted', !app.soundEnabled);
}

// テーマ切り替え
function toggleTheme() {
    const body = document.body;
    const button = document.getElementById('themeToggle');
    
    if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        button.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.add('dark-mode');
        button.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    }
}

// 表示更新
function updateDisplay() {
    document.getElementById('todayCount').textContent = app.stats.todaySquares;
    document.getElementById('totalCount').textContent = app.stats.totalSquares;
    updateGoalBar();
}

// 目標バー更新
function updateGoalBar() {
    const today = app.stats.todaySquares;
    const goal = app.dailyGoal;
    const pct = Math.min(100, (today / goal) * 100);
    const fill = document.getElementById('goalBarFill');
    const label = document.getElementById('goalBarLabel');
    fill.style.width = pct + '%';
    fill.classList.toggle('completed', today >= goal);
    label.textContent = `${today} / ${goal}マス`;
}

// 目標時間ヒント更新
function updateGoalHint() {
    const hours = (app.dailyGoal * 25 / 60).toFixed(1);
    document.getElementById('goalHoursHint').textContent = `= 約 ${hours} 時間`;
    document.getElementById('dailyGoalInput').value = app.dailyGoal;
}

// データ保存
function saveData() {
    const data = {
        gridData: app.gridData,
        currentSquareIndex: app.currentSquareIndex,
        stats: app.stats,
        pens: app.pens,
        selectedPenId: app.selectedPenId,
        dailyGoal: app.dailyGoal,
        lastSaveDate: new Date().toISOString()
    };
    localStorage.setItem('kosodenData', JSON.stringify(data));
}

// データ読み込み
function loadData() {
    const saved = localStorage.getItem('kosodenData');
    if (saved) {
        const data = JSON.parse(saved);
        app.gridData = data.gridData || [];
        app.currentSquareIndex = data.currentSquareIndex || 0;
        app.stats = data.stats || app.stats;
        app.pens = data.pens || app.pens;
        app.selectedPenId = data.selectedPenId || 0;
        app.dailyGoal = data.dailyGoal || 4;
        
        // 今日の統計をリセット
        const today = new Date().toDateString();
        const lastSave = new Date(data.lastSaveDate).toDateString();
        if (today !== lastSave) {
            app.stats.todaySquares = 0;
        }
        
        // 選択中のペン情報を更新
        if (app.selectedPenId < app.pens.length) {
            app.selectedColor = app.pens[app.selectedPenId].color;
            app.selectedSubject = app.pens[app.selectedPenId].subject;
        }
    }
    
    // ペンリストを更新
    updatePenList();
}

// 通知権限をリクエスト
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// アプリを初期化
document.addEventListener('DOMContentLoaded', init);

// 記録ボタンの処理
function recordStudy() {
    // 最初の操作時にAudioContextを初期化
    if (typeof initPencilSound === 'function') {
        initPencilSound();
    }
    
    if (app.useTimer) {
        toggleTimer();
    } else {
        fillNextSquare();
    }
}

// タイマーオプションの切り替え
function toggleTimerOption() {
    app.useTimer = document.getElementById('useTimer').checked;
    const timerDisplay = document.getElementById('timerDisplay');
    const recordButton = document.getElementById('recordButton');
    
    if (app.useTimer) {
        timerDisplay.style.display = 'block';
        recordButton.textContent = 'タイマースタート';
    } else {
        timerDisplay.style.display = 'none';
        recordButton.textContent = '25分記録する';
        if (app.timer.isRunning) {
            stopTimer();
        }
    }
}

// グリッドクリックの処理
function handleGridClick(e) {
    const square = e.target.closest('.grid-square');
    if (!square) return;
    
    // 最初のクリック時にAudioContextを初期化
    if (typeof initPencilSound === 'function') {
        initPencilSound();
    }
    
    if (app.eraserMode) {
        // 消しゴムモード
        eraseSquare(square);
    } else if (square.classList.contains('next-to-fill') && !app.timer.isRunning) {
        // 通常の塗りモード
        fillNextSquare();
    }
}

// 消しゴムモードの切り替え
function toggleEraser() {
    app.eraserMode = !app.eraserMode;
    const eraserButton = document.getElementById('eraserButton');
    const gridContainer = document.getElementById('gridContainer');
    
    if (app.eraserMode) {
        eraserButton.classList.add('active');
        gridContainer.style.cursor = 'crosshair';
        // 全てのマスを消しゴムモードに
        document.querySelectorAll('.grid-square').forEach(sq => {
            sq.classList.add('eraser-mode');
        });
    } else {
        eraserButton.classList.remove('active');
        gridContainer.style.cursor = 'default';
        document.querySelectorAll('.grid-square').forEach(sq => {
            sq.classList.remove('eraser-mode');
        });
    }
}

// マスを消す
function eraseSquare(square) {
    const index = parseInt(square.dataset.index);
    if (square.classList.contains('filled')) {
        square.classList.remove('filled');
        square.style.backgroundColor = '';
        
        // データから削除
        if (app.gridData[index]) {
            const squareData = app.gridData[index];
            delete app.gridData[index];
            app.stats.totalSquares = Math.max(0, app.stats.totalSquares - 1);

            // 今日のデータならtodaySquaresも減らす
            const today = new Date().toDateString();
            if (new Date(squareData.date).toDateString() === today) {
                app.stats.todaySquares = Math.max(0, app.stats.todaySquares - 1);
            }
        }
        
        // 現在のインデックスを更新
        if (index < app.currentSquareIndex) {
            app.currentSquareIndex = index;
            highlightNextSquare();
        }
        
        // 消しゴム音を鳴らす
        if (app.soundEnabled && window.eraserSound) {
            window.eraserSound.play();
        }
        
        saveData();
        updateDisplay();
        updateStats();
    }
}

// 全て消す
function clearAll() {
    if (!confirm('本当に全ての記録を消しますか？')) {
        return;
    }
    
    // 全てのマスを消す
    document.querySelectorAll('.grid-square.filled').forEach(square => {
        square.classList.remove('filled');
        square.style.backgroundColor = '';
    });
    
    // データをリセット
    app.gridData = [];
    app.currentSquareIndex = 0;
    app.stats.totalSquares = 0;
    app.stats.todaySquares = 0;
    
    // 消しゴムモードを解除してから次のマスをハイライト
    if (app.eraserMode) {
        toggleEraser();
    }
    
    highlightNextSquare();
    saveData();
    updateDisplay();
    updateStats();
}