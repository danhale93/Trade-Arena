/**
 * ACOUSTIC CORE - VOICE Engine
 * "Gemini-Powered" Facade: Intelligent, personality-driven trade announcements.
 * Uses Web Speech API with enhanced descriptive logic.
 */

class VOICEEngine {
  constructor() {
    this.synth = window.speechSynthesis;
    this.enabled = false;
    this.muted = true;
    this.voice = null;
    this.volume = 0.8;
    this.personalities = {
      gemini: { rate: 1.0, pitch: 1.0, name: 'Gemini' },
      analyst: { rate: 1.1, pitch: 0.9, name: 'Analyst' }
    };
    this.currentPersonality = 'gemini';
  }

  async init() {
    if (this.synth) {
      const loadVoices = () => {
        const voices = this.synth.getVoices();
        // Prefer high-quality natural voices
        this.voice = voices.find(v => 
          v.name.includes('Google') ||
          v.name.includes('Natural') ||
          v.name.includes('Samantha') ||
          v.name.includes('Microsoft Aria')
        ) || voices[0];
      };
      if (this.synth.getVoices().length > 0) loadVoices();
      else this.synth.onvoiceschanged = loadVoices;
    }
  }

  speak(text, pName = 'gemini') {
    if (this.muted || !this.synth || !text) return;
    this.synth.cancel(); // Snappy response
    
    const utterance = new SpeechSynthesisUtterance(text);
    const p = this.personalities[pName] || this.personalities.gemini;

    utterance.voice = this.voice;
    utterance.volume = this.volume;
    utterance.rate = p.rate;
    utterance.pitch = p.pitch;
    
    this.synth.speak(utterance);
  }

  // Enhanced announcements
  win(botId, pnl) {
    const lines = [
      `Bot ${botId} secured a win. P and L is looking healthy.`,
      `Excellent move by bot ${botId}. Plus ${pnl.toFixed(2)} in the bag.`,
      `Bot ${botId} is outperforming the market. That's a win.`
    ];
    this.speak(lines[Math.floor(Math.random() * lines.length)]);
  }

  loss(botId, pnl) {
    const lines = [
      `Bot ${botId} took a hit. Re-adjusting strategy.`,
      `Market friction for bot ${botId}. A minor setback.`,
      `Bot ${botId} closed at a loss. Sentiment is shifting.`
    ];
    this.speak(lines[Math.floor(Math.random() * lines.length)]);
  }

  tradeOpen(botId, token, method) {
    this.speak(`Agent ${botId} is initiating a ${method} position on ${token}. Analyzing liquidity.`);
  }

  briefing(stats) {
    const msg = `System briefing. Current win rate is ${stats.wr}%. We have ${stats.open} active positions. Overall trend is ${stats.trend}.`;
    this.speak(msg);
  }

  setMuted(m) {
    this.muted = m;
    this.enabled = !m;
    if (m) this.synth?.cancel();
  }

  setVolume(v) { this.volume = v; }

  // Toggle for the UI
  toggle() {
    this.setMuted(!this.muted);
    return this.enabled;
  }
}

window.VOICE = new VOICEEngine();
window.VOICE.init();
