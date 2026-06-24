/**
 * ACOUSTIC CORE - SFX Engine
 * Sound Effects for Trade Events
 * Provides audio feedback for wins, losses, stop losses, take profits
 */

class SFXEngine {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.muted = false;
    this.volume = 0.5;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch(e) {
      console.warn('SFX: AudioContext not available', e);
    }
  }

  // Ensure context is ready
  async ensure() {
    if (!this.initialized) {
      await this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  // Play a simple tone
  playTone(freq, duration, type = 'sine', volume = 0.3) {
    if (!this.ctx || this.muted) return;
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    
    gain.gain.setValueAtTime(volume * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + duration);
  }

  // Win sound - ascending major chord
  async win() {
    await this.ensure();
    if (!this.ctx || this.muted) return;
    
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.4, 'sine', 0.25);
      }, i * 80);
    });
  }

  // Big win - fanfare arpeggio
  async bigWin() {
    await this.ensure();
    if (!this.ctx || this.muted) return;
    
    const now = this.ctx.currentTime;
    const fanfare = [
      { freq: 523.25, delay: 0 },    // C5
      { freq: 659.25, delay: 80 },   // E5
      { freq: 783.99, delay: 160 },  // G5
      { freq: 1046.50, delay: 240 }, // C6
      { freq: 1318.51, delay: 320 }, // E6
    ];
    
    fanfare.forEach(note => {
      setTimeout(() => {
        this.playTone(note.freq, 0.5, 'sine', 0.3);
      }, note.delay);
    });
  }

  // Loss sound - descending
  async loss() {
    await this.ensure();
    if (!this.ctx || this.muted) return;
    
    const now = this.ctx.currentTime;
    this.playTone(440, 0.3, 'sawtooth', 0.15);
    setTimeout(() => this.playTone(330, 0.4, 'sawtooth', 0.1), 100);
  }

  // Stop loss - warning descending
  async stopLoss() {
    await this.ensure();
    if (!this.ctx || this.muted) return;
    
    const now = this.ctx.currentTime;
    // Two alert tones
    this.playTone(880, 0.15, 'square', 0.2);
    setTimeout(() => this.playTone(440, 0.3, 'square', 0.15), 150);
  }

  // Take profit - celebration rising
  async takeProfit() {
    await this.ensure();
    if (!this.ctx || this.muted) return;
    
    const now = this.ctx.currentTime;
    const rise = [440, 554, 659, 880];
    
    rise.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.25, 'sine', 0.2);
      }, i * 60);
    });
  }

  // Trade open - synth beep
  async tradeOpen() {
    await this.ensure();
    if (!this.ctx || this.muted) return;
    
    this.playTone(880, 0.1, 'sine', 0.15);
    setTimeout(() => this.playTone(1320, 0.15, 'sine', 0.1), 100);
  }

  // Spin button click
  spin() {
    if (!this.ctx || this.muted) return;
    this.playTone(660, 0.08, 'square', 0.1);
  }

  // Mute/unmute
  setMuted(muted) {
    this.muted = muted;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }
}

// Global instance
window.SFX = new SFXEngine();
