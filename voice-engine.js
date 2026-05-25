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
