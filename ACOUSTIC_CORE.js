/**
 * ACOUSTIC CORE - Main Integration
 * Bridges all audio/visual engines to trade events
 * Provides UI controls for SFX, FX, VOICE, and the Sequencer
 */

(function() {
  'use strict';

  const CONFIG = {
    sfx: { enabled: true, volume: 0.5 },
    fx: { enabled: true },
    voice: { enabled: false, volume: 0.8 },
    audio: { enabled: false, volume: 0.4 }
  };

  let sfx = window.SFX;
  let fx = window.FX;
  let voice = window.VOICE;
  let audioEngine = window.audioEngine;

  async function init() {
    if (window.audioEngine) audioEngine.init();
    createControlPanel();
    syncUI();
  }

  function createControlPanel() {
    if (document.getElementById('acoustic-ctrl')) return;
    
    const panel = document.createElement('div');
    panel.id = 'acoustic-ctrl';
    panel.className = 'gh-controls';
    panel.style.cssText = 'margin-left:8px;display:flex;gap:6px;align-items:center;background:rgba(0,0,0,0.2);padding:2px 8px;border-radius:20px;border:1px solid var(--border);';
    
    panel.innerHTML = `
      <div style="display:flex;gap:4px;border-right:1px solid var(--border);padding-right:6px;margin-right:2px">
        <button class="gh-bot-btn" id="acoustic-sfx-btn" onclick="ACOUSTIC.toggleSFX()" title="SFX">🔊</button>
        <button class="gh-bot-btn" id="acoustic-fx-btn" onclick="ACOUSTIC.toggleFX()" title="FX">✨</button>
        <button class="gh-bot-btn" id="acoustic-voice-btn" onclick="ACOUSTIC.toggleVOICE()" title="Voice">🗣️</button>
        <button class="gh-bot-btn" id="acoustic-audio-btn" onclick="ACOUSTIC.toggleAudio()" title="Sequencer">🎹</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:2px;width:60px">
        <input type="range" min="0" max="100" value="40" class="ac-vol-slider" oninput="ACOUSTIC.setMasterVolume(this.value/100)" title="Master Volume">
        <div style="font-size:6px;color:var(--dim);text-align:center;letter-spacing:1px">ACOUSTIC CORE</div>
      </div>
    `;
    
    const ghControls = document.querySelector('.gh-controls');
    if (ghControls) ghControls.appendChild(panel);

    const style = document.createElement('style');
    style.textContent = `
      .ac-vol-slider { -webkit-appearance:none; width:100%; height:2px; background:var(--border); outline:none; border-radius:2px; }
      .ac-vol-slider::-webkit-slider-thumb { -webkit-appearance:none; width:6px; height:6px; background:var(--cyan); border-radius:50%; cursor:pointer; }
    `;
    document.head.appendChild(style);
  }

  function syncUI() {
    const sfxBtn = document.getElementById('acoustic-sfx-btn');
    if (sfxBtn) sfxBtn.style.color = CONFIG.sfx.enabled ? 'var(--cyan)' : 'var(--dim)';
    
    const fxBtn = document.getElementById('acoustic-fx-btn');
    if (fxBtn) fxBtn.style.color = CONFIG.fx.enabled ? 'var(--cyan)' : 'var(--dim)';
    
    const vBtn = document.getElementById('acoustic-voice-btn');
    if (vBtn) vBtn.style.color = CONFIG.voice.enabled ? 'var(--cyan)' : 'var(--dim)';

    const aBtn = document.getElementById('acoustic-audio-btn');
    if (aBtn) aBtn.style.color = CONFIG.audio.enabled ? 'var(--cyan)' : 'var(--dim)';
  }

  function toggleSFX() {
    CONFIG.sfx.enabled = !CONFIG.sfx.enabled;
    if (window.SFX) window.SFX.setMuted(!CONFIG.sfx.enabled);
    syncUI();
  }

  function toggleFX() {
    CONFIG.fx.enabled = !CONFIG.fx.enabled;
    if (window.FX) CONFIG.fx.enabled ? window.FX.enable() : window.FX.disable();
    syncUI();
  }

  function toggleVOICE() {
    CONFIG.voice.enabled = !CONFIG.voice.enabled;
    if (window.VOICE) window.VOICE.setMuted(!CONFIG.voice.enabled);
    syncUI();
  }

  function toggleAudio() {
    CONFIG.audio.enabled = !CONFIG.audio.enabled;
    if (audioEngine) {
      if (CONFIG.audio.enabled) {
        audioEngine.init();
        audioEngine.start();
      } else {
        audioEngine.stop();
      }
    }
    syncUI();
  }

  function setMasterVolume(v) {
    CONFIG.audio.volume = v;
    if (audioEngine) audioEngine.setVolume(v);
    if (window.SFX) window.SFX.setVolume(v);
    if (window.VOICE) window.VOICE.setVolume(v);
  }

  // Hook into trade events
  function updateTelemetry() {
    if (!audioEngine) return;
    const openCount = (window.openPositions || []).length;
    // Mock winRatio from global P&L if available
    const winRatio = 0.5;
    audioEngine.updateTelemetry({ openPositions: openCount, winRatio });
  }

  function onTradeOpen(botId, token, method) {
    if (CONFIG.sfx.enabled && window.SFX) window.SFX.tradeOpen();
    if (CONFIG.audio.enabled && audioEngine) {
      audioEngine.triggerPad((botId-1)%8, 0.6, true);
      updateTelemetry();
    }
  }

  function onWin(botId, pnl) {
    if (CONFIG.sfx.enabled && window.SFX) window.SFX.win();
    if (CONFIG.fx.enabled && window.FX) window.FX.flash('rgba(0,255,157,0.1)', 400);
    if (CONFIG.voice.enabled && window.VOICE) window.VOICE.win(botId, pnl);
    if (CONFIG.audio.enabled && audioEngine) {
       audioEngine.triggerPad(7, 1.0, true); // Heaven pad
       updateTelemetry();
    }
  }

  function onLoss(botId, pnl) {
    if (CONFIG.sfx.enabled && window.SFX) window.SFX.loss();
    if (CONFIG.fx.enabled && window.FX) window.FX.flash('rgba(255,45,120,0.1)', 400);
    if (CONFIG.voice.enabled && window.VOICE) window.VOICE.loss(botId, pnl);
    if (CONFIG.audio.enabled && audioEngine) {
       audioEngine.triggerPad(2, 0.8, true); // Sharp hat
       updateTelemetry();
    }
  }

  window.ACOUSTIC = {
    init, toggleSFX, toggleFX, toggleVOICE, toggleAudio, setMasterVolume,
    onTradeOpen, onWin, onLoss
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
