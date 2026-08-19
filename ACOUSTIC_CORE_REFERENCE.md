# ACOUSTIC CORE Quick Reference

## Files Created

### Core
- `ACOUSTIC_CORE.js` - Integration bridge, connects all engines to trade events

### Audio Engines
- `audio-engine.js` - Web Audio synth drum machine (8-pad sequencer)
- `sfx-engine.js` - Sound effects (win, loss, trade open sounds)
- `voice-engine.js` - Text-to-speech announcements

### Visual Effects
- `fx-engine.js` - Confetti, screen flash, shake animations

### UI Templates
- `synth-pads.html` - Synth pad grid UI (8x16 sequencer)

---

## Usage

### Automatic (via index.html)
The ACOUSTIC CORE integrates automatically:
- Sounds play on trade open/close
- Confetti on wins
- Screen flash on losses
- Voice announces big wins/losses (if enabled)

### Manual Control
In browser console:
```javascript
// Toggle SFX
ACOUSTIC.toggleSFX();

// Toggle FX  
ACOUSTIC.toggleFX();

// Toggle VOICE
ACOUSTIC.toggleVOICE();

// Toggle synth pad sequencer
ACOUSTIC.toggleAudio();

// Manually trigger events
ACOUSTIC.onTradeOpen(1, 'ETH', 'SPOT LONG');
ACOUSTIC.onWin(1, 5.50, true);  // big win
ACOUSTIC.onLoss(1, -2.00);    // regular loss
```

---

## Configuration

Edit `ACOUSTIC_CORE.js` to adjust:
```javascript
const CONFIG = {
  sfx: { enabled: true, volume: 0.5 },
  fx: { enabled: true, confettiCount: 20 },
  voice: { enabled: false, muted: true },
  audio: { enabled: false, bpm: 120 }
};
```

---

## Control Panel

After login, visible in header:
- 🔊/🔇 - SFX toggle
- ✨ - FX toggle  
- 🗣️/🤐 - Voice toggle
- 🎹 - Synth pad toggle

---

## Trade Events

| Event | SFX | FX | VOICE | Synth |
|-------|-----|-----|------|-------|
| Trade Open | beep 880Hz | - | "Opening position" | pad 5 |
| Win | chime ↑ | confetti | "Win $X" | win pattern |
| Big Win | fanfare | 28 confetti | "Big win $X!" | full pattern |
| Loss | tone ↓ | flash+shake | "Loss $X" | loss pattern |
| Stop Loss | warning | red flash | "Stop loss" | loss pattern |
| Take Profit | celebration | green flash | "Take profit!" | win pattern |

---

## Bot IDs to Pads Mapping

- Bot 1 → Pad 0 (KICK)
- Bot 2 → Pad 1 (SNARE)
- Bot 3 → Pad 2 (HI-HAT)
- Bot 4 → Pad 3 (CLAP)
- Bot 5 → Pad 4 (TOM)
- Bot 6 → Pad 5 (SYNTH)
- Bot 7 → Pad 6 (BASS)
- Bot 8 → Pad 7 (PAD)
- Bot 9 → Pad 0 (wraps)

---

## Dependencies

Required in index.html (load order):
1. jQuery (if used)
2. audio-engine.js
3. sfx-engine.js  
4. fx-engine.js
5. voice-engine.js
6. ACOUSTIC_CORE.js

---

## Browser Support

- Chrome 80+ (full support)
- Firefox 75+ (full support)
- Safari 14+ (partial - voice may vary)
- Edge 80+ (full support)

Requires Web Audio API and WebSpeech API support.
