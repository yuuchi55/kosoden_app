// タイマー関連の機能

// タイマーの切り替え
function toggleTimer() {
    if (app.timer.isRunning) {
        stopTimer();
    } else {
        startTimer();
    }
}

// タイマー開始
function startTimer() {
    app.timer.isRunning = true;
    const button = document.getElementById('recordButton');
    button.textContent = 'ストップ';
    button.classList.add('active');
    
    app.timer.interval = setInterval(() => {
        if (app.timer.seconds === 0) {
            if (app.timer.minutes === 0) {
                timerComplete();
                return;
            }
            app.timer.minutes--;
            app.timer.seconds = 59;
        } else {
            app.timer.seconds--;
        }
        
        updateTimerDisplay();
    }, 1000);
}

// タイマー停止
function stopTimer() {
    app.timer.isRunning = false;
    clearInterval(app.timer.interval);
    const button = document.getElementById('recordButton');
    button.textContent = 'タイマースタート';
    button.classList.remove('active');
    
    // タイマーリセット
    app.timer.minutes = 25;
    app.timer.seconds = 0;
    updateTimerDisplay();
}

// タイマー完了
function timerComplete() {
    stopTimer();
    fillNextSquare();
    
    // 完了音を鳴らす
    if (app.soundEnabled) {
        playCompleteSound();
    }
    
    // 通知
    if (Notification.permission === 'granted') {
        new Notification('コソ勉', {
            body: '25分の学習が完了しました！',
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="70" font-size="70">✏️</text></svg>'
        });
    }
}

// タイマー表示更新
function updateTimerDisplay() {
    const display = document.getElementById('timerDisplay');
    const minutes = String(app.timer.minutes).padStart(2, '0');
    const seconds = String(app.timer.seconds).padStart(2, '0');
    display.textContent = `${minutes}:${seconds}`;
}

// 完了音を鳴らす
function playCompleteSound() {
    const audioContext = new AudioContext();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.value = 0.1;
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.start();
    osc.stop(audioContext.currentTime + 0.2);
}