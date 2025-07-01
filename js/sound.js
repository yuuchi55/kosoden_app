// 色鉛筆の音をWeb Audio APIで生成
class PencilSound {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.isPlaying = false;
    }

    play(color) {
        if (!app.soundEnabled || this.isPlaying) return;
        
        this.isPlaying = true;
        
        // より色鉛筆らしいシャカシャカ音を生成
        const now = this.audioContext.currentTime;
        
        // メインのシャカシャカ音（複数のノイズレイヤー）
        for (let layer = 0; layer < 3; layer++) {
            // ホワイトノイズを生成
            const bufferSize = this.audioContext.sampleRate * 0.4; // 0.4秒
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            // ざらざらしたテクスチャを作る
            for (let i = 0; i < bufferSize; i++) {
                // 基本のホワイトノイズ
                let noise = Math.random() * 2 - 1;
                
                // 紙の凹凸を表現する変調
                const textureFreq = 50 + layer * 30;
                const texture = Math.sin(i / textureFreq) * 0.3;
                
                // 色鉛筆の圧力変化を表現
                const pressure = Math.sin(i / 200) * 0.5 + 0.5;
                
                data[i] = noise * texture * pressure * 0.3;
            }
            
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            
            // フィルターで色鉛筆特有の周波数を強調
            const filter1 = this.audioContext.createBiquadFilter();
            filter1.type = 'bandpass';
            filter1.frequency.value = 2000 + layer * 500; // レイヤーごとに周波数を変える
            filter1.Q.value = 2;
            
            const filter2 = this.audioContext.createBiquadFilter();
            filter2.type = 'highpass';
            filter2.frequency.value = 1000;
            filter2.Q.value = 1;
            
            // 音量エンベロープ
            const gain = this.audioContext.createGain();
            gain.gain.value = 0;
            
            // 色によって音の特性を少し変える
            const colorVariation = this.getColorVariation(color);
            
            // シャカシャカという感じの音量変化
            const attackTime = 0.02;
            const sustainTime = 0.15 + Math.random() * 0.1;
            const releaseTime = 0.1;
            
            gain.gain.linearRampToValueAtTime(
                0.25 * colorVariation.volume * (1 - layer * 0.2), 
                now + attackTime
            );
            gain.gain.setValueAtTime(
                0.2 * colorVariation.volume * (1 - layer * 0.2), 
                now + attackTime + sustainTime
            );
            gain.gain.exponentialRampToValueAtTime(
                0.001, 
                now + attackTime + sustainTime + releaseTime
            );
            
            // 接続
            source.connect(filter1);
            filter1.connect(filter2);
            filter2.connect(gain);
            gain.connect(this.audioContext.destination);
            
            // 再生（レイヤーごとに少しずらす）
            source.start(now + layer * 0.01);
            source.stop(now + 0.4);
        }
        
        // 低周波の摩擦音を追加
        const friction = this.audioContext.createOscillator();
        const frictionGain = this.audioContext.createGain();
        const frictionFilter = this.audioContext.createBiquadFilter();
        
        friction.type = 'triangle';
        friction.frequency.value = 80;
        
        frictionFilter.type = 'lowpass';
        frictionFilter.frequency.value = 200;
        
        frictionGain.gain.value = 0;
        frictionGain.gain.linearRampToValueAtTime(0.05, now + 0.02);
        frictionGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        friction.connect(frictionFilter);
        frictionFilter.connect(frictionGain);
        frictionGain.connect(this.audioContext.destination);
        
        friction.start(now);
        friction.stop(now + 0.3);
        
        setTimeout(() => {
            this.isPlaying = false;
        }, 400);
    }
    
    getColorVariation(color) {
        // 色によって音の特性を変える
        const colorMap = {
            '#FF6B6B': { volume: 1.0, texture: 'soft' },    // 赤 - 柔らかめ
            '#4ECDC4': { volume: 0.9, texture: 'medium' },  // 青緑 - 中間
            '#45B7D1': { volume: 0.95, texture: 'medium' }, // 青 - 中間
            '#FFA07A': { volume: 1.1, texture: 'hard' },    // オレンジ - 硬め
            '#98D8C8': { volume: 0.85, texture: 'soft' },   // 緑 - 柔らかめ
            '#FECA57': { volume: 1.05, texture: 'hard' }    // 黄 - 硬め
        };
        
        return colorMap[color] || { volume: 1.0, texture: 'medium' };
    }
}

// 消しゴム音のクラス
class EraserSound {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.isPlaying = false;
    }
    
    play() {
        if (!app.soundEnabled || this.isPlaying) return;
        
        this.isPlaying = true;
        const now = this.audioContext.currentTime;
        
        // 消しゴムの摩擦音を生成
        const bufferSize = this.audioContext.sampleRate * 0.2; // 0.2秒
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // ブラウンノイズを生成（低周波成分が多い）
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5;
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        
        // フィルターで消しゴム特有の音を作る
        const filter1 = this.audioContext.createBiquadFilter();
        filter1.type = 'lowpass';
        filter1.frequency.value = 800;
        filter1.Q.value = 2;
        
        const filter2 = this.audioContext.createBiquadFilter();
        filter2.type = 'highpass';
        filter2.frequency.value = 100;
        filter2.Q.value = 0.7;
        
        // 音量エンベロープ
        const gain = this.audioContext.createGain();
        gain.gain.value = 0;
        gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
        gain.gain.setValueAtTime(0.3, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        
        // 接続
        source.connect(filter1);
        filter1.connect(filter2);
        filter2.connect(gain);
        gain.connect(this.audioContext.destination);
        
        source.start(now);
        source.stop(now + 0.2);
        
        setTimeout(() => {
            this.isPlaying = false;
        }, 200);
    }
}

// グローバル変数として初期化
// AudioContextはユーザー操作後に初期化する必要がある
let pencilSound = null;
let eraserSound = null;

function initPencilSound() {
    if (!pencilSound) {
        pencilSound = new PencilSound();
        window.pencilSound = pencilSound;
    }
    if (!eraserSound) {
        eraserSound = new EraserSound();
        window.eraserSound = eraserSound;
    }
    // AudioContextの再開を試みる
    if (pencilSound.audioContext.state === 'suspended') {
        pencilSound.audioContext.resume();
    }
    if (eraserSound.audioContext.state === 'suspended') {
        eraserSound.audioContext.resume();
    }
}