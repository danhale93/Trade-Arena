/**
 * ACOUSTIC CORE - Web Audio Drum Sequencer & Synth Pad Engine
 * Trade-sensitive signal blocks that pulse on trade events
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.pads = []; // 8 synth pads for 8-column grid
    this.sequencer = null;
    this.isPlaying = false;
    this.bpm = 120;
    this.stepIndex = 0;
    this.steps = 16;
    this.grid = []; // 8x16 pad grid
    this.initialized = false;
  }

async init() {
    // Return promise if already initialized
    if (this.initialized) {
      return Promise.resolve();
    }
    
    // Create audio context (requires user interaction in modern browsers)
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.error('[AudioEngine] Failed to create AudioContext:', e);
      return Promise.reject(e);
    }
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.7;
    this.masterGain.connect(this.ctx.destination);
    
    // Create reverb
    this.convolver = this.ctx.createConvolver();
    this.convolver.buffer = this.createReverbImpulse();
    this.convolver.connect(this.masterGain);
    
    // Dry/wet mix
    this.dryGain = this.ctx.createGain();
    this.dryGain.gain.value = 0.6;
    this.dryGain.connect(this.masterGain);
    
    this.wetGain = this.ctx.createGain();
    this.wetGain.gain.value = 0.4;
    this.wetGain.connect(this.convolver);
    
    // Initialize 8 synth pads with unique sounds
    const padSounds = [
      { name: 'KICK', freq: 60, type: 'sine', decay: 0.3 },
      { name: 'SNARE', freq: 200, type: 'triangle', decay: 0.2 },
      { name: 'HI-HAT', freq: 8000, type: 'square', decay: 0.05 },
      { name: 'CLAP', freq: 400, type: 'sawtooth', decay: 0.15 },
      { name: 'TOM', freq: 120, type: 'sine', decay: 0.4 },
      { name: 'SYNTH', freq: 330, type: 'sawtooth', decay: 0.5 },
      { name: 'BASS', freq: 80, type: 'square', decay: 0.25 },
      { name: 'PAD', freq: 220, type: 'sine', decay: 0.8 }
    ];
    
    for (let i = 0; i < 8; i++) {
      this.pads.push({
        ...padSounds[i],
        gain: this.ctx.createGain(),
        filter: this.ctx.createBiquadFilter(),
        index: i
      });
      this.pads[i].gain.connect(this.dryGain);
      this.pads[i].gain.connect(this.wetGain);
    }
    
    // Initialize grid: 8 rows × 16 steps
    for (let row = 0; row < 8; row++) {
      this.grid[row] = [];
      for (let step = 0; step < 16; step++) {
        this.grid[row][step] = { active: false, intensity: 0, trade: null };
      }
    }
    
    this.initialized = true;
    return Promise.resolve();
  }

  createReverbImpulse() {
    const length = this.ctx.sampleRate * 2;
    const impulse = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
      }
    }
    return impulse;
  }

  // Trigger a pad sound based on trade result
  triggerPad(padIndex, intensity = 1, trade = null) {
    if (!this.initialized || !this.ctx) return;
    
    const now = this.ctx.currentTime;
    const pad = this.pads[padIndex];
    if (!pad) return;
    
    const osc = this.ctx.createOscillator();
    osc.type = pad.type;
    osc.frequency.setValueAtTime(pad.freq * (0.9 + Math.random() * 0.2), now);
    
    const gain = this.ctx.createGain();
    const vel = intensity * 0.3;
    gain.gain.setValueAtTime(vel, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + pad.decay);
    
    osc.connect(gain);
    gain.connect(pad.gain);
    
    osc.start(now);
    osc.stop(now + pad.decay + 0.1);
    
    // If trade info, light up the grid cell
    if (trade && this.grid[padIndex]) {
      const step = this.stepIndex;
      this.grid[padIndex][step] = { 
        active: true, 
        intensity: intensity, 
        trade: trade,
        timestamp: Date.now()
      };
    }
  }

  // Trigger all pads for a trade event
  triggerTrade(trade) {
    if (!trade) return;
    
    // Map trade outcome to pad triggers
    if (trade.isWin) {
      // Wins trigger ascending pattern
      this.triggerPad(0, 1, trade); // KICK
      setTimeout(() => this.triggerPad(7, 0.8, trade), 80);  // PAD
      setTimeout(() => this.triggerPad(4, 0.6, trade), 160); // TOM
    } else {
      // Losses trigger descending pattern
      this.triggerPad(2, 1, trade); // HI-HAT
      setTimeout(() => this.triggerPad(3, 0.8, trade), 80);  // CLAP
      setTimeout(() => this.triggerPad(7, 0.4, trade), 160); // low PAD
    }
    
    // Open position triggers synth pad
    if (trade.status === 'open') {
      this.triggerPad(5, 0.7, trade); // SYNTH
    }
  }

  // Sequencer playback
  start() {
    if (!this.initialized || this.isPlaying) return;
    
    this.isPlaying = true;
    const intervalMs = (60000 / this.bpm) / 4;
    
    this.sequencer = setInterval(() => {
      this.playStep();
    }, intervalMs);
  }

  stop() {
    this.isPlaying = false;
    if (this.sequencer) {
      clearInterval(this.sequencer);
      this.sequencer = null;
    }
  }

  playStep() {
    // For each row, check if this step has activity
    for (let row = 0; row < 8; row++) {
      const cell = this.grid[row][this.stepIndex];
      if (cell.active && cell.intensity > 0) {
        // Fade the intensity each cycle
        cell.intensity *= 0.92;
        if (cell.intensity < 0.05) {
          cell.active = false;
        } else {
          this.triggerPad(row, cell.intensity, cell.trade);
        }
      }
    }
    
    this.stepIndex = (this.stepIndex + 1) % this.steps;
  }

  // Convert machine/bot to pad trigger
  triggerFromMachine(bot, result) {
    if (!bot || !result) return;
    
    // Map bot ID to pad (0-7)
    const padIndex = (bot.id - 1) % 8;
    const intensity = result.isWin ? 1 : result.isWin === false ? 0.6 : 0.3;
    
    this.triggerPad(padIndex, intensity, {
      botId: bot.id,
      method: result.method,
      pnl: result.netPnl,
      isWin: result.isWin
    });
  }

  // Get the grid state for UI rendering
  getGridState() {
    return this.grid.map((row, rowIdx) => 
      row.map((cell, stepIdx) => ({
        row: rowIdx,
        step: stepIdx,
        active: cell.active,
        intensity: cell.intensity,
        trade: cell.trade ? {
          botId: cell.trade.botId,
          method: cell.trade.method,
          pnl: cell.trade.pnl,
          isWin: cell.trade.isWin
        } : null
      }))
    );
  }

  // Set BPM
  setBpm(bpm) {
    this.bpm = Math.max(60, Math.min(200, bpm));
    if (this.isPlaying) {
      this.stop();
      this.start();
    }
  }

  // Mute/unmute
  setMuted(muted) {
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 0.7;
    }
  }

  dispose() {
    this.stop();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.initialized = false;
  }
}

// Global instance - create the AudioEngine instance
window.AudioEngine = AudioEngine;
window.audioEngine = new AudioEngine();

// Auto-init on first user interaction (needed for modern browsers)
document.addEventListener('click', function initAudioOnClick() {
  if (window.audioEngine && !window.audioEngine.initialized) {
    window.audioEngine.init().then(() => {
      console.log('[AudioEngine] Ready');
    }).catch(e => {
      console.warn('[AudioEngine] Init failed:', e);
    });
  }
  document.removeEventListener('click', initAudioOnClick);
}, { once: true });
