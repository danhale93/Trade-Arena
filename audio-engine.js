/**
 * ACOUSTIC CORE - Web Audio Drum Sequencer & Synth Pad Engine
 * "Telemetric" Version: Rhythm evolves based on trade activity.
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.pads = [];
    this.sequencer = null;
    this.isPlaying = false;
    this.bpm = 124; // Evolving BPM
    this.stepIndex = 0;
    this.steps = 16;
    this.grid = [];
    this.initialized = false;
    this.telemetry = {
      tradesLastMinute: 0,
      winRatio: 0.5,
      openPositions: 0
    };
  }

  async init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.error('[AudioEngine] Context error:', e);
      return;
    }

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.4; // Default master volume
    this.masterGain.connect(this.ctx.destination);
    
    this.convolver = this.ctx.createConvolver();
    this.convolver.buffer = this.createReverbImpulse();
    this.convolver.connect(this.masterGain);
    
    this.dryGain = this.ctx.createGain();
    this.dryGain.gain.value = 0.5;
    this.dryGain.connect(this.masterGain);
    
    this.wetGain = this.ctx.createGain();
    this.wetGain.gain.value = 0.3;
    this.wetGain.connect(this.convolver);
    
    const padSounds = [
      { name: 'KICK', freq: 55, type: 'sine', decay: 0.25 },
      { name: 'SNARE', freq: 180, type: 'triangle', decay: 0.15 },
      { name: 'HI-HAT', freq: 9000, type: 'square', decay: 0.04 },
      { name: 'CLAP', freq: 380, type: 'sawtooth', decay: 0.12 },
      { name: 'TOM', freq: 110, type: 'sine', decay: 0.35 },
      { name: 'SYNTH', freq: 329.63, type: 'sawtooth', decay: 0.4 }, // E4
      { name: 'BASS', freq: 82.41, type: 'square', decay: 0.3 }, // E2
      { name: 'PAD', freq: 164.81, type: 'sine', decay: 1.2 } // E3
    ];
    
    for (let i = 0; i < 8; i++) {
      this.pads.push({
        ...padSounds[i],
        gain: this.ctx.createGain(),
        index: i
      });
      this.pads[i].gain.connect(this.dryGain);
      this.pads[i].gain.connect(this.wetGain);
    }
    
    for (let row = 0; row < 8; row++) {
      this.grid[row] = [];
      for (let step = 0; step < 16; step++) {
        this.grid[row][step] = { active: false, intensity: 0 };
      }
    }
    
    this.initialized = true;
  }

  createReverbImpulse() {
    const length = this.ctx.sampleRate * 2.5;
    const impulse = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    return impulse;
  }

  triggerPad(padIndex, intensity = 1, force = false) {
    if (!this.initialized || !this.ctx || this.ctx.state === 'suspended') return;
    
    const now = this.ctx.currentTime;
    const pad = this.pads[padIndex];
    if (!pad) return;
    
    const osc = this.ctx.createOscillator();
    osc.type = pad.type;
    osc.frequency.setValueAtTime(pad.freq, now);
    
    // Telemetric frequency shift based on market regime (mocked via winRatio)
    const shift = (this.telemetry.winRatio - 0.5) * 40;
    osc.frequency.exponentialRampToValueAtTime(pad.freq + shift, now + pad.decay);

    const gain = this.ctx.createGain();
    const vel = intensity * 0.25;
    gain.gain.setValueAtTime(vel, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + pad.decay);
    
    osc.connect(gain);
    gain.connect(pad.gain);
    osc.start(now);
    osc.stop(now + pad.decay + 0.1);

    if (force && this.grid[padIndex]) {
      this.grid[padIndex][this.stepIndex] = { active: true, intensity: intensity };
    }
  }

  updateTelemetry(stats) {
    this.telemetry = { ...this.telemetry, ...stats };
    // Evolve BPM: base 120 + 2bpm per open position
    const targetBpm = 120 + (this.telemetry.openPositions * 4);
    this.setBpm(targetBpm);
  }

  start() {
    if (!this.initialized || this.isPlaying) return;
    this.isPlaying = true;
    this.runSequencer();
  }

  stop() {
    this.isPlaying = false;
    clearTimeout(this.sequencer);
  }

  runSequencer() {
    if (!this.isPlaying) return;
    this.playStep();
    const stepTime = (60 / this.bpm) / 4 * 1000;
    this.sequencer = setTimeout(() => this.runSequencer(), stepTime);
  }

  playStep() {
    // Basic metronome pulse on 1 and 9
    if (this.stepIndex === 0 || this.stepIndex === 8) {
       this.triggerPad(0, 0.4); // Kick
    }
    if (this.stepIndex === 4 || this.stepIndex === 12) {
       this.triggerPad(1, 0.3); // Snare
    }

    // Play active grid cells
    for (let row = 0; row < 8; row++) {
      const cell = this.grid[row][this.stepIndex];
      if (cell.active) {
        this.triggerPad(row, cell.intensity);
        cell.intensity *= 0.85; // Natural decay
        if (cell.intensity < 0.1) cell.active = false;
      }
    }
    
    this.stepIndex = (this.stepIndex + 1) % this.steps;
    
    // UI Feedback hook
    if (window.updateAudioUI) window.updateAudioUI(this.stepIndex, this.grid);
  }

  setBpm(bpm) {
    this.bpm = Math.max(80, Math.min(180, bpm));
  }

  setVolume(vol) {
    if (this.masterGain) this.masterGain.gain.value = vol * 0.6;
  }
}

window.audioEngine = new AudioEngine();
