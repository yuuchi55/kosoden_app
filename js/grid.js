// グリッド関連の機能

// グリッドの初期化
function initGrid() {
    const container = document.getElementById('gridContainer');
    const cols = Math.floor(container.offsetWidth / 25);
    const rows = Math.floor(container.offsetHeight / 25);
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const square = document.createElement('div');
            square.className = 'grid-square';
            square.style.left = `${col * 25}px`;
            square.style.top = `${row * 25}px`;
            square.dataset.index = row * cols + col;
            container.appendChild(square);
        }
    }
    
    // 保存されたデータを復元
    app.gridData.forEach((data, index) => {
        if (data) {
            const square = container.querySelector(`[data-index="${index}"]`);
            if (square) {
                square.style.backgroundColor = data.color;
                square.classList.add('filled');
            }
        }
    });
    
    // 次に塗るマスをハイライト
    highlightNextSquare();
}

// 次に塗るマスをハイライト
function highlightNextSquare() {
    // 既存のハイライトを削除
    document.querySelectorAll('.next-to-fill').forEach(el => {
        el.classList.remove('next-to-fill');
    });
    
    // 次のマスをハイライト
    const nextSquare = document.querySelector(`[data-index="${app.currentSquareIndex}"]`);
    if (nextSquare && !nextSquare.classList.contains('filled')) {
        nextSquare.classList.add('next-to-fill');
    }
}

// 次のマスを塗る
function fillNextSquare() {
    const square = document.querySelector(`[data-index="${app.currentSquareIndex}"]`);
    if (square && !square.classList.contains('filled')) {
        square.style.backgroundColor = app.selectedColor;
        square.classList.add('filled');
        
        // 音を鳴らす
        if (app.soundEnabled) {
            // PencilSoundを初期化（まだの場合）
            if (typeof initPencilSound === 'function') {
                initPencilSound();
            }
            if (window.pencilSound) {
                console.log('色鉛筆音を再生:', app.selectedColor);
                window.pencilSound.play(app.selectedColor);
            }
        }
        
        // データを保存
        if (!app.gridData[app.currentSquareIndex]) {
            app.gridData[app.currentSquareIndex] = {};
        }
        app.gridData[app.currentSquareIndex] = {
            color: app.selectedColor,
            subject: app.selectedSubject,
            date: new Date().toISOString()
        };
        
        // 統計を更新
        app.stats.totalSquares++;
        app.stats.todaySquares++;
        
        // 次のマスに移動
        app.currentSquareIndex++;
        highlightNextSquare();
        
        // 保存と表示更新
        saveData();
        updateDisplay();
        updateStats();
    }
}