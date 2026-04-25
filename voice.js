
// voice.js - Interactive Voice Agent for Trade Arena
// Web Speech API (STT/TTS) + command integration + entertainment

class VoiceAgent {
  constructor() {
    this.enabled = false;
    this.listening = false;
    this.speaking = false;
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.currentUtterance = null;
    this.commandHistory = [];
    this.audioCtx = null;
    this.initAudio();
    this.init();
  }

  initAudio() {
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) {
      console.warn('[Voice] Web Audio API not supported');
    }
  }

  // Play a futuristic UI sound
  playTone(freq, duration, type = 'sine', vol = 0.08) {
    if (!this.audioCtx || !this.enabled) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch(e) {}
  }

  playWinSound() {
    if (!this.enabled) return;
    this.playTone(523, 0.1, 'sine', 0.06);
    setTimeout(() => this.playTone(659, 0.1, 'sine', 0.06), 100);
    setTimeout(() => this.playTone(784, 0.2, 'sine', 0.08), 200);
  }

  playLossSound() {
    if (!this.enabled) return;
    this.playTone(300, 0.15, 'sawtooth', 0.04);
    setTimeout(() => this.playTone(250, 0.2, 'sawtooth', 0.04), 120);
  }

  playActivateSound() {
    this.playTone(880, 0.08, 'sine', 0.05);
    setTimeout(() => this.playTone(1100, 0.12, 'sine', 0.06), 80);
  }

  playDeactivateSound() {
    this.playTone(600, 0.1, 'sine', 0.05);
    setTimeout(() => this.playTone(400, 0.15, 'sine', 0.04), 100);
  }

  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[Voice] Browser does not support Speech Recognition');
      this.updateUI();
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false; // Changed: single utterance per activation
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.listening = true;
      this.updateUI();
    };

    this.recognition.onresult = (event) => {
      const results = Array.from(event.results);
      const final = results.filter(r => r.isFinal).pop();
      const interim = results.filter(r => !r.isFinal).pop();
      
      if (interim) {
        const txt = interim[0].transcript;
        this.updateListeningText('🎤 ' + txt);
      }
      
      if (final) {
        const transcript = final[0].transcript.toLowerCase().trim();
        this.commandHistory.push(transcript);
        if (this.commandHistory.length > 10) this.commandHistory.shift();
        this.stopListening();
        this.handleCommand(transcript);
      }
    };

    this.recognition.onerror = (event) => {
      console.warn('[Voice] Recognition error:', event.error);
      this.listening = false;
      this.updateUI();
      if (this.enabled && event.error !== 'aborted') {
        this.speak('Listening paused. Click the mic to resume.');
      }
    };

    this.recognition.onend = () => {
      this.listening = false;
      this.updateUI();
    };
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.playActivateSound();
      // Resume audio context if suspended
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      this.startListening();
    } else {
      this.playDeactivateSound();
      this.stopListening();
      if (this.currentUtterance) {
        this.synthesis.cancel();
        this.speaking = false;
      }
    }
    this.updateUI();
    return this.enabled;
  }

  startListening() {
    if (!this.recognition || !this.enabled) return;
    try {
      this.recognition.start();
    } catch(e) {
      // Already started, ignore
    }
  }

  stopListening() {
    if (this.recognition) {
      try { this.recognition.stop(); } catch(e) {}
    }
    this.listening = false;
    this.updateUI();
  }

  async speak(text, options = {}) {
    if (!this.enabled) return;
    if (this.speaking) this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    Object.assign(utterance, {
      lang: 'en-US',
      rate: options.rate || 1.15,
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
      // Auto-restart listening after speaking
      if (this.enabled && !this.listening) {
        setTimeout(() => this.startListening(), 300);
      }
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
    // Prefer a clear, energetic voice
    const preferred = voices.find(v => 
      v.name.includes('Samantha') || 
      v.name.includes('Google US English') ||
      v.name.includes('Microsoft Zira')
    );
    return preferred || voices.find(v => v.lang.startsWith('en-US')) || voices[0];
  }

  async handleCommand(transcript) {
    console.log('[Voice] Command:', transcript);
    
    const commands = [
      { 
        pattern: /add bot|new bot|create bot|deploy bot/, 
        action: () => { 
          if (typeof addBot === 'function') addBot(); 
          return 'Bot deployed and ready for action!'; 
        }
      },
      { 
        pattern: /spin|trade|go|execute/, 
        action: () => {
          if (typeof bots !== 'undefined' && bots.length > 0) {
            const readyBot = bots.find(b => !b.spinning && !b.cooling);
            if (readyBot && typeof spinBot === 'function') {
              spinBot(readyBot.id);
              return `Spinning bot number ${readyBot.id}!`;
            }
          }
          return 'No bots ready to trade right now.';
        }
      },
      { 
        pattern: /crucible|test mode|batch/, 
        action: () => {
          if (typeof toggleCrucible === 'function') toggleCrucible();
          const on = typeof crucibleMode !== 'undefined' ? crucibleMode : false;
          return on ? 'Crucible mode activated. Running test batch.' : 'Crucible mode deactivated.';
        }
      },
      { 
        pattern: /audit|review|check agents/, 
        action: () => {
          if (typeof runManualAudit === 'function') runManualAudit();
          return 'Running full agent audit now.';
        }
      },
      { 
        pattern: /reset|clear learning|start over/, 
        action: () => {
          if (typeof resetLearning === 'function') {
            resetLearning();
            return 'Learning model reset. Starting fresh!';
          }
          return 'Reset function not available.';
        }
      },
      { 
        pattern: /balance|how much|portfolio|pnl/, 
        action: () => {
          const bal = typeof balance !== 'undefined' ? balance : 0;
          const pnl = typeof totalPnl !== 'undefined' ? totalPnl : 0;
          const botsActive = typeof bots !== 'undefined' ? bots.filter(b => b.auto).length : 0;
          return `Balance is $${bal.toFixed(2)}. Total P&L is ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}. ${botsActive} bots on auto.`;
        }
      },
      { 
        pattern: /stop all|kill|emergency|halt/, 
        action: () => {
          if (typeof globalKill === 'function') {
            globalKill();
            return 'Emergency stop activated. All bots halted.';
          }
          return 'Emergency stop not available.';
        }
      },
      {
        pattern: /status|what's up|report|summary/,
        action: () => {
          const nBots = typeof bots !== 'undefined' ? bots.length : 0;
          const nOpen = typeof openPositions !== 'undefined' ? openPositions.length : 0;
          const nClosed = typeof closedTrades !== 'undefined' ? closedTrades.filter(t => t.method !== 'HOLD').length : 0;
          return `${nBots} bots active. ${nOpen} open positions. ${nClosed} trades completed. All systems operational.`;
        }
      }
    ];

    const matched = commands.find(cmd => cmd.pattern.test(transcript));
    if (matched) {
      const response = matched.action();
      this.speak(response);
      return;
    }

    // Unknown command - give a friendly response
    const friendlyResponses = [
      "I'm not sure about that, but I'm learning! Try 'add bot', 'spin', or 'balance'.",
      "Didn't catch that command. I can help with trading, audits, or status updates.",
      "Interesting! I understand commands like 'add bot', 'crucible', and 'balance'. What would you like to do?",
      "Hmm, I'm still learning that one. Try saying 'status' for a full report."
    ];
    this.speak(friendlyResponses[Math.floor(Math.random() * friendlyResponses.length)]);
  }

  getContext() {
    const bal = typeof balance !== 'undefined' ? balance : 0;
    const nBots = typeof bots !== 'undefined' ? bots.length : 0;
    const nOpen = typeof openPositions !== 'undefined' ? openPositions.length : 0;
    return `Balance: $${bal.toFixed(2)}, Bots: ${nBots}, Open: ${nOpen}`;
  }

  updateUI() {
    const voiceBtn = document.getElementById('voiceToggle');
    if (!voiceBtn) return;

    if (this.enabled) {
      if (this.listening) {
        voiceBtn.textContent = '🎤 ● LISTENING';
        voiceBtn.style.background = 'linear-gradient(90deg, var(--green), var(--cyan))';
        voiceBtn.style.boxShadow = '0 0 20px rgba(57,255,20,0.5)';
        voiceBtn.style.animation = 'ap 0.8s ease infinite alternate';
      } else if (this.speaking) {
        voiceBtn.textContent = '🗣️ SPEAKING';
        voiceBtn.style.background = 'linear-gradient(90deg, var(--purple), var(--blue))';
        voiceBtn.style.boxShadow = '0 0 20px rgba(191,95,255,0.5)';
        voiceBtn.style.animation = 'none';
      } else {
        voiceBtn.textContent = '🎤 ○ ON';
        voiceBtn.style.background = 'linear-gradient(90deg, var(--cyan), var(--blue))';
        voiceBtn.style.boxShadow = '0 0 12px rgba(0,255,231,0.3)';
        voiceBtn.style.animation = 'none';
      }
    } else {
      voiceBtn.textContent = '🎤 ○ OFF';
      voiceBtn.style.background = 'linear-gradient(90deg, var(--cyan), var(--blue))';
      voiceBtn.style.boxShadow = '0 0 12px rgba(0,255,231,0.3)';
      voiceBtn.style.animation = 'none';
    }
  }

  updateListeningText(text) {
    const voiceBtn = document.getElementById('voiceToggle');
    if (voiceBtn && this.listening) {
      voiceBtn.textContent = text.substring(0, 25);
    }
  }

  // Called from the app when a trade wins or loses
  onTradeResult(isWin, pnl) {
    if (!this.enabled) return;
    if (isWin && pnl > 1) {
      this.playWinSound();
      const phrases = [
        `Nice! Up $${pnl.toFixed(2)}!`,
        `Winner! $${pnl.toFixed(2)} profit!`,
        `Boom! $${pnl.toFixed(2)} in the bag!`,
        `Profitable trade! $${pnl.toFixed(2)}!`
      ];
      this.speak(phrases[Math.floor(Math.random() * phrases.length)]);
    } else if (!isWin) {
      this.playLossSound();
      if (Math.abs(pnl) > 2) {
        this.speak(`Tough loss of $${Math.abs(pnl).toFixed(2)}. Stay disciplined.`);
      }
    }
  }
}

// Global instance
window.voiceAgent = new VoiceAgent();
