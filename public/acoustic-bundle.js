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
/**
 * ACOUSTIC CORE - FX Engine
 * Visual Effects for Trade Events
 * Provides screen flashes, animations, confetti, P&L fly-ups
 */

class FXEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.confettiParticles = [];
    this.enabled = true;
  }

  init() {
    if (this.canvas) return;

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'fx-canvas';
    this.canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;';
    document.body.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');
    this.resize();

    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  // Full screen flash
  flash(color, duration = 300) {
    if (!this.enabled) return;

    const flash = document.createElement('div');
    flash.style.cssText = `
      position:fixed;inset:0;pointer-events:none;z-index:9998;
      background:${color};transition:opacity ${duration}ms ease;
    `;
    document.body.appendChild(flash);

    requestAnimationFrame(() => {
      flash.style.opacity = '1';
      setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => flash.remove(), duration);
      }, 50);
    });
  }

  // Screen shake
  shake(element, duration = 400) {
    if (!element || !this.enabled) return;

    const original = element.style.transform;
    const shake = element.closest('.machine');

    let start = Date.now();
    const anim = () => {
      const elapsed = Date.now() - start;
      if (elapsed > duration) {
        element.style.transform = original || '';
        return;
      }

      const intensity = 1 - (elapsed / duration);
      const x = (Math.random() - 0.5) * 8 * intensity;
      const y = (Math.random() - 0.5) * 8 * intensity;
      element.style.transform = `translate(${x}px, ${y}px)`;

      requestAnimationFrame(anim);
    };

    anim();
  }

  // P&L value flies up from position
  pnlFlyUp(pnl, x, y) {
    if (!this.enabled || Math.abs(pnl) < 0.10) return;

    const el = document.createElement('div');
    const isWin = pnl > 0;
    el.textContent = (isWin ? '+' : '') + '$' + pnl.toFixed(2);
    el.style.cssText = `
      position:fixed;left:${x}px;top:${y}px;
      font-family:'Bungee',display;font-size:16px;font-weight:bold;
      color:${isWin ? 'var(--green)' : 'var(--hot)'};
      text-shadow:0 2px 8px rgba(0,0,0,0.5);
      pointer-events:none;z-index:9000;
      animation:pnlFly 1.5s ease forwards;
    `;
    document.body.appendChild(el);

    // Add keyframe if not exists
    if (!document.getElementById('fx-keyframes')) {
      const style = document.createElement('style');
      style.id = 'fx-keyframes';
      style.textContent = `
        @keyframes pnlFly {
          0% { transform:translateY(0) scale(1);opacity:1; }
          100% { transform:translateY(-100px) scale(1.2);opacity:0; }
        }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => el.remove(), 1500);
  }

  // Confetti burst
  confetti(x, y, count = 20) {
    if (!this.enabled) return;

    this.init();

    const colors = ['#ffd700', '#00ffe7', '#39ff14', '#ff2d78', '#bf5fff'];
    const particles = [];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 3 + Math.random() * 5;
      const color = colors[Math.floor(Math.random() * colors.length)];

      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 4 + Math.random() * 6,
        color: color,
        life: 1,
        decay: 0.015 + Math.random() * 0.01
      });
    }

    this.confettiParticles.push(...particles);
    this.animateConfetti();
  }

  animateConfetti() {
    if (!this.ctx || this.confettiParticles.length === 0) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const remaining = [];

    this.confettiParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // gravity
      p.life -= p.decay;

      if (p.life > 0) {
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = p.life;
        this.ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        remaining.push(p);
      }
    });

    this.confettiParticles = remaining;

    if (remaining.length > 0) {
      requestAnimationFrame(() => this.animateConfetti());
    } else {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  // Pulse effect on element
  pulse(element) {
    if (!element) return;
    element.style.animation = 'none';
    element.offsetHeight; // trigger reflow
    element.style.animation = 'fxPulse 0.4s ease';

    // Add keyframe if not exists
    if (!document.getElementById('fx-pulse-key')) {
      const style = document.createElement('style');
      style.id = 'fx-pulse-key';
      style.textContent = `
        @keyframes fxPulse {
          0% { transform:scale(1); }
          50% { transform:scale(1.1); }
          100% { transform:scale(1); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Disable all FX
  disable() {
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
  }
}

// Global instance
window.FX = new FXEngine();
/**
 * ACOUSTIC CORE - VOICE Engine
 * Text-to-Speech Announcements for Trade Events
 * Announces wins, losses, stop losses, take profits by bot ID
 */

class VOICEEngine {
  constructor() {
    this.ctx = null;
    this.synth = window.speechSynthesis;
    this.enabled = false;
    this.muted = true; // Default muted
    this.voice = null;
    this.volume = 0.8;
  }

  async init() {
    if (this.synth) {
      // Load voices
      const loadVoices = () => {
        const voices = this.synth.getVoices();
        // Try to find a good English voice
        this.voice = voices.find(v =>
          v.name.includes('Google UK English Female') ||
          v.name.includes('Microsoft Zira') ||
          v.name.includes('Samantha')
        ) || voices[0];
      };

      if (this.synth.getVoices().length > 0) {
        loadVoices();
      } else {
        this.synth.addEventListener('voiceschanged', loadVoices, { once: true });
      }
    }
  }

  // Speak text
  speak(text, priority = false) {
    if (this.muted || !this.synth || !text) return;

    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) {
      utterance.voice = this.voice;
    }
    utterance.volume = this.volume;
    utterance.rate = 1.1;
    utterance.pitch = 1.0;

    this.synth.speak(utterance);
  }

  // Win announcement
  win(botId, pnl) {
    const pnlStr = pnl >= 0 ? (pnl < 10 ? 'small win' : 'big win') : '';
    const msg = `Bot ${botId} wins! ${pnlStr}`;
    this.speak(msg);
  }

  // Loss announcement
  loss(botId, pnl) {
    const msg = `Bot ${botId} takes a loss`;
    this.speak(msg);
  }

  // Stop loss triggered
  stopLoss(botId) {
    const msg = `Bot ${botId} stop loss triggered`;
    this.speak(msg);
  }

  // Take profit triggered
  takeProfit(botId) {
    const msg = `Bot ${botId} take profit hit`;
    this.speak(msg);
  }

  // Trade opened
  tradeOpen(botId, token, method) {
    const msg = `Bot ${botId} opening ${method} on ${token}`;
    this.speak(msg);
  }

  // Mute/unmute
  setMuted(muted) {
    this.muted = muted;
    if (muted) {
      this.synth?.cancel();
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  // Enable voice announcements
  enable() {
    this.muted = false;
    this.enabled = true;
    this.init();
  }

  disable() {
    this.muted = true;
    this.enabled = false;
  }
}

// Global instance
window.VOICE = new VOICEEngine();
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


  toggleMusic() {
    if (!this.initialized) return false;
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      this.startSequencer();
    } else {
      this.stopSequencer();
    }
    return this.isPlaying;
  }

  startSequencer() {
    if (this.sequencerInterval) clearInterval(this.sequencerInterval);
    const stepTime = (60 / this.bpm) / 4 * 1000;
    this.sequencerInterval = setInterval(() => {
      this.playStep();
      this.stepIndex = (this.stepIndex + 1) % this.steps;
    }, stepTime);
  }

  stopSequencer() {
    if (this.sequencerInterval) clearInterval(this.sequencerInterval);
    this.sequencerInterval = null;
  }

  playStep() {
    // Basic pulse for background music
    if (this.stepIndex % 4 === 0) {
      this.triggerPad(0, 0.1, { botId: 0, pnl: 0 });
    }
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
/**
 * ACOUSTIC CORE - Main Integration
 * Bridges all audio/visual engines to trade events
 * Provides UI controls for SFX, FX, VOICE
 */

(function() {
  'use strict';

  // ══════════════════════════════════════════════════════
  // CONFIGURATION
  // ══════════════════════════════════════════════════════
  const CONFIG = {
    // SFX settings
    sfx: {
      enabled: true,
      volume: 0.5,
      winPitch: 880,
      lossPitch: 440,
      openPitch: 660
    },
    // FX settings
    fx: {
      enabled: true,
      flashWin: 'rgba(57,255,20,0.12)',
      flashLoss: 'rgba(255,45,120,0.1)',
      confettiCount: 20,
      shakeDuration: 400
    },
    // VOICE settings
    voice: {
      enabled: false, // Default off
      muted: true,
      volume: 0.8
    },
    // Audio engine settings
    audio: {
      enabled: false,
      bpm: 120,
      autoPlay: false
    }
  };

  // ══════════════════════════════════════════════════════
  // ENGINE REFERENCES
  // ══════════════════════════════════════════════════════
  let sfx = null;
  let fx = null;
  let voice = null;
  let audioEngine = null;

  // ══════════════════════════════════════════════════════
  // INITIALIZATION
  // ══════════════════════════════════════════════════════
  async function init() {
    console.log('[ACOUSTIC] Initializing...');

    // Load engines if they exist
    if (window.SFX) {
      sfx = window.SFX;
      if (sfx.setVolume) sfx.setVolume(CONFIG.sfx.volume);
      if (sfx.setMuted) sfx.setMuted(!CONFIG.sfx.enabled);
    }

    if (window.FX) {
      fx = window.FX;
      if (fx.enable) fx.enable();
    }

    if (window.VOICE) {
      voice = window.VOICE;
      if (voice.setVolume) voice.setVolume(CONFIG.voice.volume);
      if (voice.setMuted) voice.setMuted(CONFIG.voice.muted);
    }

    if (window.audioEngine) {
      audioEngine = window.audioEngine;
    }

    // Create ACOUSTIC control panel in header
    createControlPanel();

    // Global Unlock for AudioContext
    const unlock = async () => {
      console.log('[ACOUSTIC] User interaction detected, unlocking audio...');

      // Initialize engines if needed
      if (sfx && sfx.init) await sfx.init().catch(e => console.warn('SFX init failed', e));
      if (voice && voice.init) await voice.init().catch(e => console.warn('VOICE init failed', e));
      if (audioEngine && audioEngine.init) await audioEngine.init().catch(e => console.warn('AudioEngine init failed', e));

      // Resume contexts
      [sfx?.ctx, voice?.ctx, audioEngine?.ctx].forEach(ctx => {
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().then(() => console.log(`[ACOUSTIC] AudioContext resumed: ${ctx.constructor.name}`));
        }
      });

      // If audio engine was already enabled, start it
      if (CONFIG.audio.enabled && audioEngine && audioEngine.start) {
        audioEngine.start();
      }
    };
    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });

    console.log('[ACOUSTIC] Initialized');
  }

  // ══════════════════════════════════════════════════════
  // CONTROL PANEL
  // ══════════════════════════════════════════════════════
  function createControlPanel() {
    // Check if already exists
    if (document.getElementById('acoustic-ctrl')) return;

    const panel = document.createElement('div');
    panel.id = 'acoustic-ctrl';
    panel.className = 'gh-controls';
    panel.style.cssText = 'margin-left:8px;display:flex;gap:4px;';

    panel.innerHTML = `
      <button class="gh-bot-btn" id="acoustic-sfx-btn" onclick="ACOUSTIC.toggleSFX()" title="Toggle sound effects">
        🔊
      </button>
      <button class="gh-bot-btn" id="acoustic-fx-btn" onclick="ACOUSTIC.toggleFX()" title="Toggle visual effects">
        ✨
      </button>
      <button class="gh-bot-btn" id="acoustic-voice-btn" onclick="ACOUSTIC.toggleVOICE()" title="Toggle voice announcements">
        🗣️
      </button>
      <button class="gh-bot-btn" id="acoustic-audio-btn" onclick="ACOUSTIC.toggleAudio()" title="Toggle synth pad sequencer">
        🎹
      </button>
    `;

    // Insert after the last gh-controls button
    const ghControls = document.querySelector('.gh-controls');
    if (ghControls) {
      ghControls.appendChild(panel);
    }
  }

  // ══════════════════════════════════════════════════════
  // TOGGLE FUNCTIONS
  // ══════════════════════════════════════════════
  function toggleSFX() {
    if (!sfx) return;

    CONFIG.sfx.enabled = !CONFIG.sfx.enabled;
    sfx.setMuted(!CONFIG.sfx.enabled);

    const btn = document.getElementById('acoustic-sfx-btn');
    if (btn) {
      btn.textContent = CONFIG.sfx.enabled ? '🔊' : '🔇';
      btn.classList.toggle('av-on', CONFIG.sfx.enabled);
    }
  }

  function toggleFX() {
    if (!fx) return;

    CONFIG.fx.enabled = !CONFIG.fx.enabled;
    CONFIG.fx.enabled ? fx.enable() : fx.disable();

    const btn = document.getElementById('acoustic-fx-btn');
    if (btn) {
      btn.classList.toggle('av-on', CONFIG.fx.enabled);
    }
  }

  function toggleVOICE() {
    if (!voice) return;

    CONFIG.voice.muted = !CONFIG.voice.muted;
    CONFIG.voice.enabled = !CONFIG.voice.muted;
    voice.setMuted(CONFIG.voice.muted);

    const btn = document.getElementById('acoustic-voice-btn');
    if (btn) {
      btn.classList.toggle('av-on', CONFIG.voice.enabled);
      btn.textContent = CONFIG.voice.enabled ? '🗣️' : '🤐';
    }
  }

  function toggleAudio() {
    if (!audioEngine) return;

    CONFIG.audio.enabled = !CONFIG.audio.enabled;

    if (CONFIG.audio.enabled) {
      audioEngine.init();
      audioEngine.start();
    } else {
      audioEngine.stop();
    }

    const btn = document.getElementById('acoustic-audio-btn');
    if (btn) {
      btn.classList.toggle('av-on', CONFIG.audio.enabled);
    }
  }

  // ══════════════════════════════════════════════════════
  // TRADE EVENT HANDLERS
  // ══════════════════════════════════════════════════════

  // Called when a trade opens
  function onTradeOpen(botId, token, method) {
    if (sfx && CONFIG.sfx.enabled) {
      sfx.tradeOpen();
    }

    // Update synth pad if enabled
    if (audioEngine && CONFIG.audio.enabled) {
      const row = (botId - 1) % 8;
      audioEngine.triggerPad(row, 0.7, {
        botId,
        token,
        method,
        status: 'open'
      });
    }
  }

  // Called when a trade wins
  function onWin(botId, pnl, isBigWin = false) {
    // SFX
    if (sfx && CONFIG.sfx.enabled) {
      isBigWin ? sfx.bigWin() : sfx.win();
    }

    // FX - flash screen
    if (fx && CONFIG.fx.enabled) {
      fx.flash(CONFIG.fx.flashWin, isBigWin ? 500 : 300);

      // Get position for confetti and P&L fly up
      const card = document.getElementById('bot-' + botId);
      if (card) {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width/2;
        const cy = rect.top + rect.height*0.3;
        fx.confetti(cx, cy, isBigWin ? 28 : 16);
        if (fx.pnlFlyUp) fx.pnlFlyUp(pnl, cx - 30, cy);
      }
    }

    // Synth pad
    if (audioEngine && CONFIG.audio.enabled) {
      const row = (botId - 1) % 8;
      audioEngine.triggerPad(row, 1, { botId, pnl, isWin: true });
    }

    // VOICE
    if (voice && CONFIG.voice.enabled) {
      voice.win(botId, pnl);
    }
  }

  // Called when a trade loses
  function onLoss(botId, pnl, isStopLoss = false) {
    // SFX
    if (sfx && CONFIG.sfx.enabled) {
      isStopLoss ? sfx.stopLoss() : sfx.loss();
    }

    // FX - flash screen
    if (fx && CONFIG.fx.enabled) {
      fx.flash(CONFIG.fx.flashLoss, 400);

      const card = document.getElementById('bot-' + botId);
      if (card) {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width/2;
        const cy = rect.top + rect.height*0.3;
        fx.shake(card, CONFIG.fx.shakeDuration);
        if (fx.pnlFlyUp) fx.pnlFlyUp(pnl, cx - 30, cy);
      }
    }

    // Synth pad
    if (audioEngine && CONFIG.audio.enabled) {
      const row = (botId - 1) % 8;
      audioEngine.triggerPad(row, 0.6, { botId, pnl, isWin: false });
    }

    // VOICE
    if (voice && CONFIG.voice.enabled) {
      isStopLoss ? voice.stopLoss(botId) : voice.loss(botId, pnl);
    }
  }

  // Called when take profit triggers
  function onTakeProfit(botId) {
    if (voice && CONFIG.voice.enabled) {
      voice.takeProfit(botId);
    }

    if (sfx && CONFIG.sfx.enabled) {
      sfx.takeProfit();
    }
  }

  // ══════════════════════════════════════════════════════
  // EXPORTS
  // ══════════════════════════════════════════════════════
  window.ACOUSTIC = {
    init,
    toggleSFX,
    toggleFX,
    toggleVOICE,
    toggleAudio,
    onTradeOpen,
    onWin,
    onLoss,
    onTakeProfit,
    getConfig: () => CONFIG
  };

  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
/**
 * GEMINI VOICE ENGINE
 * High-fidelity AI Voice Chat using Google Gemini
 */

class GeminiVoiceEngine {
  constructor() {
    this.enabled = false;
    this.recognition = null;
    this.isListening = false;
    this.audioCtx = null;
    this.apiKey = ''; // Handled by proxy
  }

  init() {
    // Check for SpeechRecognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        console.log('[GeminiVoice] Recognized:', text);
        this.handleVoiceInput(text);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.updateUI();
      };

      this.recognition.onerror = (e) => {
        console.error('[GeminiVoice] Error:', e);
        this.isListening = false;
        this.updateUI();
      };
    }
  }

  toggleListening() {
    if (!this.recognition) {
      alert('Speech recognition not supported in this browser.');
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
    } else {
      this.recognition.start();
      this.isListening = true;
    }
    this.updateUI();
  }

  async handleVoiceInput(text) {
    if (typeof window.sendVoiceCommand === 'function') {
        // Feed into existing Floor Manager logic but flag it as voice
        const input = document.getElementById('vaInput');
        if (input) {
            input.value = text;
            window.sendVoiceCommand(true); // true = requested via voice
        }
    }
  }

  /**
   * High-quality TTS using Gemini (simulated or proxy-based)
   * If Gemini TTS is unavailable, falls back to standard VOICE engine
   */
  async speak(text) {
    console.log('[GeminiVoice] Speaking:', text);

    // For this implementation, we use the standard VOICE engine for output
    // but we can enhance it with Gemini-generated emotive text
    if (window.VOICE) {
        window.VOICE.speak(text);
    }
  }

  updateUI() {
    const btn = document.getElementById('vaListenBtn');
    if (btn) {
        btn.textContent = this.isListening ? '🛑 LISTENING...' : '🎤 PUSH TO TALK';
        btn.style.background = this.isListening ? 'var(--hot)' : 'var(--cyan)';
    }
  }
}

window.GEMINI_VOICE = new GeminiVoiceEngine();
window.GEMINI_VOICE.init();
