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
      sfx.setVolume(CONFIG.sfx.volume);
      sfx.setMuted(!CONFIG.sfx.enabled);
    }
    
    if (window.FX) {
      fx = window.FX;
      fx.enable();
    }
    
    if (window.VOICE) {
      voice = window.VOICE;
      voice.setVolume(CONFIG.voice.volume);
      voice.setMuted(CONFIG.voice.muted);
    }
    
    if (window.audioEngine) {
      audioEngine = window.audioEngine;
    }
    
    // Create ACOUSTIC control panel in header
    createControlPanel();
    
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
      <button class="gh-bot-btn" id="acoustic-audio-btn" onclick="toggleAudio()" title="Toggle synth pad sequencer">
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
      btn.style.color = CONFIG.sfx.enabled ? 'var(--cyan)' : 'var(--dim)';
    }
  }

  function toggleFX() {
    if (!fx) return;
    
    CONFIG.fx.enabled = !CONFIG.fx.enabled;
    CONFIG.fx.enabled ? fx.enable() : fx.disable();
    
    const btn = document.getElementById('acoustic-fx-btn');
    if (btn) {
      btn.style.color = CONFIG.fx.enabled ? 'var(--cyan)' : 'var(--dim)';
    }
  }

  function toggleVOICE() {
    if (!voice) return;
    
    CONFIG.voice.muted = !CONFIG.voice.muted;
    CONFIG.voice.enabled = !CONFIG.voice.muted;
    voice.setMuted(CONFIG.voice.muted);
    
    const btn = document.getElementById('acoustic-voice-btn');
    if (btn) {
      btn.style.color = CONFIG.voice.enabled ? 'var(--cyan)' : 'var(--dim)';
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
      btn.style.color = CONFIG.audio.enabled ? 'var(--cyan)' : 'var(--dim)';
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
      
      // Get position for confetti
      const card = document.getElementById('bot-' + botId);
      if (card) {
        const rect = card.getBoundingClientRect();
        fx.confetti(rect.left + rect.width/2, rect.top + rect.height*0.3, isBigWin ? 28 : 16);
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
        fx.shake(card, CONFIG.fx.shakeDuration);
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
