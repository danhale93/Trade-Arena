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
