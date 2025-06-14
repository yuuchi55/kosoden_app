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
    gridData: [],
    currentSquareIndex: 0,
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
    setupEventListeners();
    initGrid();
    updateDisplay();
    updateStats();
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
    
    // グリッドクリック
    document.getElementById('gridContainer').addEventListener('click', handleGridClick);
}

// ペンリスナーの更新
function updatePenListeners() {
    document.querySelectorAll('.pen-item').forEach((item, index) => {
        const penColor = item.querySelector('.pen-color');
        const input = item.querySelector('.pen-name-input');
        
        // ペン色クリックで選択
        penColor.addEventListener('click', () => selectPen(index));
        
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
            <div class="pen-color" style="background-color: ${pen.color};"></div>
            <input type="text" class="pen-name-input" placeholder="科目名" value="${pen.subject || ''}">
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

// 表示更新
function updateDisplay() {
    document.getElementById('todayCount').textContent = app.stats.todaySquares;
    document.getElementById('totalCount').textContent = app.stats.totalSquares;
}

// データ保存
function saveData() {
    const data = {
        gridData: app.gridData,
        currentSquareIndex: app.currentSquareIndex,
        stats: app.stats,
        pens: app.pens,
        selectedPenId: app.selectedPenId,
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
    const square = e.target.closest('.grid-square.next-to-fill');
    if (square && !app.timer.isRunning) {
        // 最初のクリック時にAudioContextを初期化
        if (typeof initPencilSound === 'function') {
            initPencilSound();
        }
        fillNextSquare();
    }
}