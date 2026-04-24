
// voice.js - Interactive Voice Agent for Trade Arena
// Web Speech API (STT/TTS) + Claude LLM + command integration

class VoiceAgent {
  constructor() {
    this.enabled = false;
    this.listening = false;
    this.speaking = false;
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.currentUtterance = null;
    this.commandHistory = [];
    this.init();
  }

  init() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('[Voice] Browser not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.listening = true;
      this.updateUI();
    };

    this.recognition.onresult = (event) => {
      const final = Array.from(event.results).filter(r => r.isFinal).pop();
      if (final) {
        const transcript = final[0].transcript.toLowerCase().trim();
        this.commandHistory.push(transcript);
        if (this.commandHistory.length > 10) this.commandHistory.shift();
        this.handleCommand(transcript);
      }
    };

    this.recognition.onerror = (event) => {
      console.warn('[Voice] Recognition error:', event.error);
      this.stopListening();
    };

    this.recognition.onend = () => {
      this.listening = false;
      this.updateUI();
    };
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.updateUI();
    } else {
      this.stopListening();
      if (this.currentUtterance) {
        this.synthesis.cancel();
        this.speaking = false;
      }
    }
    return this.enabled;
  }

  startListening() {
    if (!this.recognition || !this.enabled) return;
    this.recognition.start();
  }

  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  async speak(text, options = {}) {
    if (!this.enabled) return;
    if (this.speaking) this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    Object.assign(utterance, {
      lang: 'en-US',
      rate: options.rate || 1.1,
      pitch: options.pitch || 1.0,
      volume: 0.9,
      voice: this.getVoice(),
      ...options
    });

    this.currentUtterance = utterance;
    this.speaking = true;
    this.updateUI();

    utterance.onend = () => {
      this.speaking = false;
      this.currentUtterance = null;
      this.updateUI();
    };

    utterance.onerror = () => {
      this.speaking = false;
      this.currentUtterance = null;
      this.updateUI();
    };

    this.synthesis.speak(utterance);
  }

  getVoice() {
    const voices = this.synthesis.getVoices();
    return voices.find(v => v.name.includes('Samantha') || v.lang.startsWith('en-US')) || voices[0];
  }

  async handleCommand(transcript) {
    console.log('[Voice] Command:', transcript);

    if (transcript.includes('add bot')) {
      this.speak('Adding a new trading bot');
      if (typeof addBot === 'function') addBot();
      return;
    }
    if (transcript.includes('crucible') || transcript.includes('crucible')) {
      if (typeof toggleCrucible === 'function') toggleCrucible();
      this.speak(crucibleMode ? 'Crucible mode activated' : 'Crucible mode deactivated');
      return;
    }
    if (transcript.includes('audit') || transcript.includes('review')) {
      if (typeof runManualAudit === 'function') runManualAudit();
      this.speak('Running agent audit');
      return;
    }
    if (transcript.includes('reset') || transcript.includes('clear')) {
      if (confirm('Reset learning model?')) {
        if (typeof resetLearning === 'function') resetLearning();
        this.speak('Learning model reset');
      }
      return;
    }

    await this.askClaude(transcript);
  }

  async askClaude(query) {
    const context = this.getContext();
    const prompt = `
You are Trade Arena Voice Agent. Respond conversationally, max 1 sentence.

App Context:
- Balance: $${(window.balance || 0).toFixed(2)}
- Bots: ${(window.bots || []).length} active
- Positions: ${(window.openPositions || []).length} open
- Query: ${query}

Commands: "add bot", "crucible", "audit", "reset"
`;

    try {
      const response = await fetch('/api/mcp/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await response.json();
      const text = data.content?.[0]?.text || "Command received.";
      this.speak(text);
    } catch (e) {
      this.speak('Voice processing unavailable');
    }
  }

  getContext() {
    return `Balance: $${(window.balance || 0).toFixed(2)}, Bots: ${(window.bots || []).length}`;
  }

  updateUI() {
    const voiceBtn = document.getElementById('voiceToggle');
    if (voiceBtn) {
      voiceBtn.textContent = `🎤 ${this.listening ? '●' : '○'} ${this.speaking ? '🗣️' : ''}`;
      voiceBtn.className = `voice-btn ${this.enabled ? 'active' : ''} ${this.listening ? 'listening' : ''}`;
    }
  }
}

// Global instance
window.voiceAgent = new VoiceAgent();

