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
