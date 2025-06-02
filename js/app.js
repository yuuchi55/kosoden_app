class KosodenApp {
    constructor() {
        this.pens = [];
        this.selectedPenId = 1;
        this.currentPage = 1;
        this.pages = {};
        this.studyData = {};
        this.gridSize = 20;
        this.cellSize = 25;
        this.isDrawing = false;
        this.isErasing = false;
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.initializePens();
        this.setupCanvas();
        this.updateDisplay();
    }

    loadData() {
        const savedPens = localStorage.getItem('kosodenPens');
        const savedPages = localStorage.getItem('kosodenPages');
        const savedStudyData = localStorage.getItem('kosodenStudyData');
        
        if (savedPens) {
            this.pens = JSON.parse(savedPens);
        } else {
            this.initializeDefaultPens();
        }
        
        if (savedPages) {
            this.pages = JSON.parse(savedPages);
        } else {
            this.pages = { 1: this.createEmptyGrid() };
        }
        
        if (savedStudyData) {
            this.studyData = JSON.parse(savedStudyData);
        }
    }

    saveData() {
        localStorage.setItem('kosodenPens', JSON.stringify(this.pens));
        localStorage.setItem('kosodenPages', JSON.stringify(this.pages));
        localStorage.setItem('kosodenStudyData', JSON.stringify(this.studyData));
        
        // Auto commit and push to git
        this.gitAutoSave();
    }
    
    async gitAutoSave() {
        try {
            const timestamp = new Date().toLocaleString('ja-JP');
            const commitMessage = `Auto save: ${timestamp}`;
            
            // Git operations via fetch to a backend endpoint
            // Note: This requires a backend server to handle git operations
            // For now, we'll just log the intention
            console.log(`Would auto-commit with message: ${commitMessage}`);
            
            // In a real implementation, you would call:
            // await fetch('/api/git-save', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ message: commitMessage })
            // });
        } catch (error) {
            console.error('Git auto-save error:', error);
        }
    }

    initializeDefaultPens() {
        const defaultColors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
            '#98D8C8', '#FECA57', '#A29BFE', '#FD79A8',
            '#81ECEC', '#FDCB6E', '#6C5CE7', '#A8E6CF'
        ];
        
        this.pens = defaultColors.map((color, index) => ({
            id: index + 1,
            color: color,
            subject: ''
        }));
    }

    initializePens() {
        const penItems = document.querySelectorAll('.pen-item');
        penItems.forEach((item, index) => {
            const input = item.querySelector('.subject-input');
            const penColor = item.querySelector('.pen-color');
            
            if (this.pens[index]) {
                input.value = this.pens[index].subject;
                item.style.setProperty('--pen-color', this.pens[index].color);
            }
            
            input.addEventListener('input', (e) => {
                this.pens[index].subject = e.target.value;
                this.saveData();
                this.updatePenSelector();
            });
            
            penColor.addEventListener('click', () => {
                this.selectedPenId = index + 1;
                this.updateSelectedPenDisplay();
                document.querySelector('[data-tab="grid"]').click();
            });
        });
        
        this.updatePenSelector();
    }

    setupEventListeners() {
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.switchTab(button.dataset.tab);
            });
        });
        
        document.getElementById('prev-page').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.updateCanvas();
            }
        });
        
        document.getElementById('next-page').addEventListener('click', () => {
            if (this.currentPage < Object.keys(this.pages).length) {
                this.currentPage++;
                this.updateCanvas();
            }
        });
        
        document.getElementById('add-page').addEventListener('click', () => {
            const newPageNum = Object.keys(this.pages).length + 1;
            this.pages[newPageNum] = this.createEmptyGrid();
            this.saveData();
            this.currentPage = newPageNum;
            this.updateCanvas();
        });
        
        document.getElementById('eraser-button').addEventListener('click', () => {
            this.isErasing = !this.isErasing;
            this.updateEraserButton();
        });
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');
        
        if (tabName === 'stats') {
            this.updateStatistics();
        }
    }

    setupCanvas() {
        const canvas = document.getElementById('study-grid');
        canvas.width = this.gridSize * this.cellSize;
        canvas.height = this.gridSize * this.cellSize;
        
        canvas.addEventListener('click', (e) => this.handleClick(e));
        
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleClick(e.touches[0]);
        });
        
        this.updateCanvas();
    }

    handleClick(e) {
        const canvas = document.getElementById('study-grid');
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.cellSize);
        const y = Math.floor((e.clientY - rect.top) / this.cellSize);
        
        if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
            const cellIndex = y * this.gridSize + x;
            const currentPen = this.pens.find(p => p.id === this.selectedPenId);
            
            if (this.isErasing) {
                if (this.pages[this.currentPage][cellIndex]) {
                    delete this.pages[this.currentPage][cellIndex];
                    this.playEraserSound();
                    this.saveData();
                    this.updateCanvas();
                }
            } else if (currentPen && currentPen.subject) {
                if (!this.pages[this.currentPage][cellIndex]) {
                    this.pages[this.currentPage][cellIndex] = {
                        color: currentPen.color,
                        subject: currentPen.subject,
                        timestamp: Date.now()
                    };
                    
                    this.playPencilSound();
                    this.updateStudyData(currentPen.subject);
                    this.saveData();
                    this.updateCanvas();
                    this.updateTodayTime();
                }
            }
        }
    }

    playPencilSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create multiple oscillators for richer pencil sound
            const oscillator1 = audioContext.createOscillator();
            const oscillator2 = audioContext.createOscillator();
            const oscillator3 = audioContext.createOscillator();
            
            const gainNode = audioContext.createGain();
            const filter = audioContext.createBiquadFilter();
            
            // Configure filter for pencil scratching sound
            filter.type = 'highpass';
            filter.frequency.value = 3000;
            filter.Q.value = 10;
            
            // Connect oscillators
            oscillator1.connect(filter);
            oscillator2.connect(filter);
            oscillator3.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Set frequencies for pencil scratch sound
            oscillator1.frequency.value = 4000 + Math.random() * 1000;
            oscillator2.frequency.value = 6000 + Math.random() * 1500;
            oscillator3.frequency.value = 8000 + Math.random() * 2000;
            
            oscillator1.type = 'sawtooth';
            oscillator2.type = 'square';
            oscillator3.type = 'triangle';
            
            // Louder volume and quick fade
            gainNode.gain.value = 0.3;
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
            
            // Start oscillators
            oscillator1.start(audioContext.currentTime);
            oscillator2.start(audioContext.currentTime);
            oscillator3.start(audioContext.currentTime);
            
            // Stop after short duration
            oscillator1.stop(audioContext.currentTime + 0.1);
            oscillator2.stop(audioContext.currentTime + 0.1);
            oscillator3.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            console.error('Pencil sound error:', e);
        }
    }

    playEraserSound() {
        const audio = new Audio();
        // Eraser rubbing sound (white noise-like)
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVYGAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';
        audio.volume = 0.3;
        audio.play().catch(() => {});
    }

    updateStudyData(subject) {
        const today = new Date().toDateString();
        
        if (!this.studyData[today]) {
            this.studyData[today] = {};
        }
        
        if (!this.studyData[today][subject]) {
            this.studyData[today][subject] = 0;
        }
        
        this.studyData[today][subject] += 15;
    }

    createEmptyGrid() {
        return {};
    }

    updateCanvas() {
        const canvas = document.getElementById('study-grid');
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        for (let i = 0; i <= this.gridSize; i++) {
            ctx.beginPath();
            ctx.moveTo(i * this.cellSize, 0);
            ctx.lineTo(i * this.cellSize, canvas.height);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, i * this.cellSize);
            ctx.lineTo(canvas.width, i * this.cellSize);
            ctx.stroke();
        }
        
        const currentGrid = this.pages[this.currentPage] || {};
        Object.keys(currentGrid).forEach(cellIndex => {
            const cell = currentGrid[cellIndex];
            const x = (cellIndex % this.gridSize) * this.cellSize;
            const y = Math.floor(cellIndex / this.gridSize) * this.cellSize;
            
            ctx.fillStyle = cell.color;
            ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
        });
        
        document.getElementById('page-display').textContent = `ページ ${this.currentPage}`;
    }

    updateSelectedPenDisplay() {
        const selectedPen = this.pens.find(p => p.id === this.selectedPenId);
        const display = document.querySelector('.selected-pen-display');
        
        if (selectedPen) {
            display.style.backgroundColor = selectedPen.color;
        }
    }
    
    updateEraserButton() {
        const eraserButton = document.getElementById('eraser-button');
        if (this.isErasing) {
            eraserButton.classList.add('active');
            eraserButton.textContent = '消しゴム（ON）';
        } else {
            eraserButton.classList.remove('active');
            eraserButton.textContent = '消しゴム';
        }
    }

    updatePenSelector() {
        const pensWithSubjects = this.pens.filter(p => p.subject);
        this.updateSelectedPenDisplay();
    }

    updateDisplay() {
        this.updateCanvas();
        this.updateSelectedPenDisplay();
        this.updateTodayTime();
    }

    updateTodayTime() {
        const today = new Date().toDateString();
        const todayData = this.studyData[today] || {};
        
        let totalMinutes = 0;
        Object.values(todayData).forEach(minutes => {
            totalMinutes += minutes;
        });
        
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        document.getElementById('today-time').textContent = `${hours}時間${minutes}分`;
    }

    updateStatistics() {
        let totalMinutes = 0;
        const subjectTotals = {};
        
        Object.values(this.studyData).forEach(dayData => {
            Object.entries(dayData).forEach(([subject, minutes]) => {
                totalMinutes += minutes;
                if (!subjectTotals[subject]) {
                    subjectTotals[subject] = 0;
                }
                subjectTotals[subject] += minutes;
            });
        });
        
        const totalHours = Math.floor(totalMinutes / 60);
        const totalMins = totalMinutes % 60;
        document.getElementById('total-study-time').textContent = `${totalHours}時間${totalMins}分`;
        
        const chartContainer = document.getElementById('subject-chart');
        chartContainer.innerHTML = '';
        
        Object.entries(subjectTotals).forEach(([subject, minutes]) => {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            const percentage = (minutes / totalMinutes * 100).toFixed(1);
            
            const pen = this.pens.find(p => p.subject === subject);
            const color = pen ? pen.color : '#999';
            
            const statItem = document.createElement('div');
            statItem.style.cssText = `
                display: flex;
                align-items: center;
                margin-bottom: 1rem;
                padding: 0.5rem;
                background: white;
                border-radius: 4px;
            `;
            
            statItem.innerHTML = `
                <div style="width: 30px; height: 30px; background-color: ${color}; border-radius: 50%; margin-right: 1rem;"></div>
                <div style="flex: 1;">
                    <div style="font-weight: bold;">${subject}</div>
                    <div style="color: #666; font-size: 0.9rem;">${hours}時間${mins}分 (${percentage}%)</div>
                </div>
                <div style="background: ${color}; height: 10px; width: ${percentage}%; max-width: 200px; border-radius: 5px;"></div>
            `;
            
            chartContainer.appendChild(statItem);
        });
        
        if (Object.keys(subjectTotals).length === 0) {
            chartContainer.innerHTML = '<p style="text-align: center; color: #999;">まだ勉強記録がありません</p>';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new KosodenApp();
});