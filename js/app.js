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
        
        canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        canvas.addEventListener('mousemove', (e) => this.draw(e));
        canvas.addEventListener('mouseup', () => this.stopDrawing());
        canvas.addEventListener('mouseleave', () => this.stopDrawing());
        
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e.touches[0]);
        });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        });
        canvas.addEventListener('touchend', () => this.stopDrawing());
        
        this.updateCanvas();
    }

    startDrawing(e) {
        this.isDrawing = true;
        this.draw(e);
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        const canvas = document.getElementById('study-grid');
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.cellSize);
        const y = Math.floor((e.clientY - rect.top) / this.cellSize);
        
        if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
            const cellIndex = y * this.gridSize + x;
            const currentPen = this.pens.find(p => p.id === this.selectedPenId);
            
            if (currentPen && currentPen.subject) {
                if (!this.pages[this.currentPage][cellIndex]) {
                    this.pages[this.currentPage][cellIndex] = {
                        color: currentPen.color,
                        subject: currentPen.subject,
                        timestamp: Date.now()
                    };
                    
                    this.playColorSound();
                    this.updateStudyData(currentPen.subject);
                    this.saveData();
                    this.updateCanvas();
                    this.updateTodayTime();
                }
            }
        }
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    playColorSound() {
        const audio = new Audio();
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjTHz/LVnzEELmu5p66dPBUCGomS1/DOdR8fMJLK566VYDoLfEC';
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