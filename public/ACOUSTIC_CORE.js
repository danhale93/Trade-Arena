/**
 * ACOUSTIC CORE - Main Integration
 * Bridges all audio/visual engines to trade events
 * Provides UI controls for SFX, FX, VOICE, and Audio Telemetry
 */

(function() {
  'use strict';

  // ══════════════════════════════════════════════════════
  // CONFIGURATION
  // ══════════════════════════════════════════════════════
  const CONFIG = {
    sfx: {
      enabled: true,
      volume: 0.5
    },
    fx: {
      enabled: true,
      flashWin: 'rgba(57,255,20,0.12)',
      flashLoss: 'rgba(255,45,120,0.1)',
      confettiCount: 20,
      shakeDuration: 400
    },
    voice: {
      enabled: false,
      muted: true,
      volume: 0.8
    },
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
    console.log('[ACOUSTIC] Initializing Core...');
    
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
    
    createControlPanel();
    
    const unlock = async () => {
      console.log('[ACOUSTIC] Audio unlocking...');
      if (sfx && sfx.init) await sfx.init().catch(e => {});
      if (voice && voice.init) await voice.init().catch(e => {});
      if (audioEngine && audioEngine.init) await audioEngine.init().catch(e => {});

      [sfx?.ctx, voice?.ctx, audioEngine?.ctx].forEach(ctx => {
        if (ctx && ctx.state === 'suspended') ctx.resume();
      });

      if (CONFIG.audio.enabled && audioEngine && audioEngine.start) {
        audioEngine.start();
      }
    };
    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });
  }

  // ══════════════════════════════════════════════════════
  // CONTROL PANEL
  // ══════════════════════════════════════════════════════
  function createControlPanel() {
    if (document.getElementById('acoustic-ctrl')) return;
    
    const panel = document.createElement('div');
    panel.id = 'acoustic-ctrl';
    panel.style.cssText = 'display:flex;gap:4px;flex-shrink:0;margin-left:8px;';

    const btnStyle = 'width:26px;height:26px;border:1px solid var(--border);border-radius:4px;background:var(--chrome);color:var(--dim);font-size:13px;cursor:pointer;transition:all .15s';

    const sfxOn = CONFIG.sfx.enabled;
    const voiceOn = CONFIG.voice.enabled;
    const audioOn = CONFIG.audio.enabled;
    
    panel.innerHTML = `
      <button id="sfxBtn" style="${btnStyle}" class="${sfxOn?'av-on':''}" title="Sound Effects" aria-label="Toggle Sound Effects" aria-pressed="${sfxOn}"
        onclick="ACOUSTIC.toggleSFX()">🔊</button>
      <button id="voiceBtn" style="${btnStyle}" class="${voiceOn?'av-on':''}" title="Voice Announcements" aria-label="Toggle Voice Announcements" aria-pressed="${voiceOn}"
        onclick="ACOUSTIC.toggleVOICE()">🎙️</button>
      <button id="audioBtn" style="${btnStyle}" class="${audioOn?'av-on':''}" title="Acoustic Core Sequencer (Telemetry)" aria-label="Toggle Acoustic Core Sequencer" aria-pressed="${audioOn}"
        onclick="ACOUSTIC.toggleAudio()">🎹</button>
      <button id="fxBtn" style="${btnStyle}" class="${CONFIG.fx.enabled?'av-on':''}" title="Visual Effects" aria-label="Toggle Visual Effects" aria-pressed="${CONFIG.fx.enabled}"
        onclick="ACOUSTIC.toggleFX()">✨</button>`;
    
    const hdr = document.querySelector('.global-header');
    const gen = document.getElementById('genBadge');
    if (hdr) {
      if (gen) hdr.insertBefore(panel, gen); else hdr.appendChild(panel);
    }

    if (!document.getElementById('acoustic-styles')) {
      const st = document.createElement('style');
      st.id = 'acoustic-styles';
      st.textContent = '#acoustic-ctrl .av-on{border-color:var(--cyan)!important;color:var(--cyan)!important;background:rgba(0,255,231,.08)!important}';
      document.head.appendChild(st);
    }
  }

  // ══════════════════════════════════════════════════════
  // TOGGLE FUNCTIONS
  // ══════════════════════════════════════════════════════
  function toggleSFX() {
    if (!sfx) return;
    CONFIG.sfx.enabled = !CONFIG.sfx.enabled;
    sfx.setMuted(!CONFIG.sfx.enabled);
    const btn = document.getElementById('sfxBtn');
    if (btn) {
      btn.classList.toggle('av-on', CONFIG.sfx.enabled);
      btn.setAttribute('aria-pressed', CONFIG.sfx.enabled.toString());
    }
    if (window.refreshSettingsUI) window.refreshSettingsUI();
  }

  function toggleFX() {
    if (!fx) return;
    CONFIG.fx.enabled = !CONFIG.fx.enabled;
    CONFIG.fx.enabled ? fx.enable() : fx.disable();
    const btn = document.getElementById('fxBtn');
    if (btn) {
      btn.classList.toggle('av-on', CONFIG.fx.enabled);
      btn.setAttribute('aria-pressed', CONFIG.fx.enabled.toString());
    }
  }

  function toggleVOICE() {
    if (!voice) return;
    CONFIG.voice.enabled = !CONFIG.voice.enabled;
    CONFIG.voice.muted = !CONFIG.voice.enabled;
    voice.setMuted(CONFIG.voice.muted);
    const btn = document.getElementById('voiceBtn');
    if (btn) {
      btn.classList.toggle('av-on', CONFIG.voice.enabled);
      btn.setAttribute('aria-pressed', CONFIG.voice.enabled.toString());
    }
    if (window.refreshSettingsUI) window.refreshSettingsUI();
  }

  function toggleAudio() {
    if (!audioEngine) return;
    CONFIG.audio.enabled = !CONFIG.audio.enabled;
    if (CONFIG.audio.enabled) {
      audioEngine.init().then(() => audioEngine.start());
    } else {
      audioEngine.stop();
    }
    const btn = document.getElementById('audioBtn');
    if (btn) {
      btn.classList.toggle('av-on', CONFIG.audio.enabled);
      btn.setAttribute('aria-pressed', CONFIG.audio.enabled.toString());
    }
    if (window.refreshSettingsUI) window.refreshSettingsUI();
  }

  // ══════════════════════════════════════════════════════
  // TRADE EVENT HANDLERS (TELEMETRY)
  // ══════════════════════════════════════════════════════
  function onTradeOpen(botId, token, method) {
    if (sfx && CONFIG.sfx.enabled) sfx.tradeOpen();
    if (audioEngine && CONFIG.audio.enabled) {
      const row = (botId - 1) % 8;
      audioEngine.triggerTrade({ botId, token, method, status: 'open' });
    }
  }

  function onWin(botId, pnl, isBigWin = false) {
    if (sfx && CONFIG.sfx.enabled) isBigWin ? sfx.bigWin() : sfx.win();
    if (fx && CONFIG.fx.enabled) {
      fx.flash(CONFIG.fx.flashWin, isBigWin ? 500 : 300);
      const card = document.getElementById('bot-' + botId);
      if (card) {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width/2;
        const cy = rect.top + rect.height*0.3;
        fx.confetti(cx, cy, isBigWin ? 28 : 16);
        if (fx.pnlFlyUp) fx.pnlFlyUp(pnl, cx - 30, cy);
      }
    }
    if (audioEngine && CONFIG.audio.enabled) {
      const row = (botId - 1) % 8;
      audioEngine.triggerTrade({ botId, pnl, isWin: true });
    }
    if (voice && CONFIG.voice.enabled) voice.win(botId, pnl);
  }

  function onLoss(botId, pnl, isStopLoss = false) {
    if (sfx && CONFIG.sfx.enabled) isStopLoss ? sfx.stopLoss() : sfx.loss();
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
    if (audioEngine && CONFIG.audio.enabled) {
      const row = (botId - 1) % 8;
      audioEngine.triggerTrade({ botId, pnl, isWin: false });
    }
    if (voice && CONFIG.voice.enabled) isStopLoss ? voice.stopLoss(botId) : voice.loss(botId, pnl);
  }

  function onTakeProfit(botId) {
    if (voice && CONFIG.voice.enabled) voice.takeProfit(botId);
    if (sfx && CONFIG.sfx.enabled) sfx.takeProfit();
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
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
