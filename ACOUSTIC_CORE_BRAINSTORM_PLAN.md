# ACOUSTIC CORE Implementation Plan

## Branch: blackboxai/acoustic-core

## Summary
This document outlines the implementation plan for the ACOUSTIC CORE redesign - a complete visual and functional overhaul of the Trade Arena trading interface.

---

## Information Gathered

### From Environment
- **Project**: Trade Arena - AI Auto Trading Bot Platform (Backend)
- **Tech Stack**: Node.js, Express, WebSocket, Ethers.js
- **Current File Count**: 150+ files
- **Git Branch**: blackboxai/acoustic-core (exists but empty)

### From ACOUSTIC_CORE_TODO.md + PLAN.md
- Phase 1-4: ✅ mostly designed
- Phase 5-6: ⚠️ needs implementation

---

## Detailed Implementation Plan

### PHASE 1: Core Visual Design

#### 1.1 Theme & Typography ✅ (mostly complete)
Current index.html has dark mode but needs:
- [ ] **Space Grotesk** font - ADD to Google Fonts import
- [ ] **JetBrains Mono** font - ADD to Google Fonts import
- [ ] Verify dark mode base is #050508
- [ ] Verify accent colors: Gold #fbbf24, Cyan #00ffe7, Green #39ff14

#### 1.2 Glass Panels
- [ ] Add backdrop-blur effect where needed
- [ ] Ensure semi-transparent backgrounds

#### 1.3 Navigation
- Three screens (already planned):
  - [x] Execution (Arena)
  - [x] Auditor (Market Bridge)  
  - [x] Settings (System)

---

### PHASE 2: The Vault Display ⚠️ NEW

#### 2.1 Pot-of-Gold Visualization - HTML Structure
```html
<div class="vault-hero">
  <div class="vault-container">
    <div class="vault-fill"></div>
    <div class="vault-balance">$0.00</div>
  </div>
</div>
```

#### 2.2 Vault CSS
```css
.vault-hero {
  /* Pot-of-gold visualization */
  background: linear-gradient(180deg, #1a0d00, #050508);
  border: 2px solid var(--gold);
  border-radius: 16px;
  overflow: hidden;
}

.vault-fill {
  /* Animate based on balance / 5000 */
  background: linear-gradient(180deg, #fbbf24, #ff8c00);
  transition: height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.vault-hero.live-mode .vault-fill {
  /* Rose to red for live trading */
  background: linear-gradient(180deg, #ff2d78, #ff0044);
}
```

#### 2.3 Features
- [x] Large balance display at top
- [x] Fill animation based on $5,000 max
- [x] Shadow mode gradient (amber→gold)
- [x] Live mode gradient (rose→red)
- [x] Cubic-bezier easing

---

### PHASE 3: Agent/Machine Matrix (Pad Grid) ⚠️ NEW

#### 3.1 Dynamic Pad Grid - HTML Structure
```html
<div class="pad-grid">
  <!-- Pads render dynamically -->
  <div class="pad" id="pad-0" data-agent-id="AG-00">
    <span class="pad-agent-id">AG-00</span>
    <span class="pad-pnl">+$0.00</span>
  </div>
</div>
```

#### 3.2 Pad Grid CSS
```css
.pad-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
}

.pad {
  background: var(--chrome);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px;
  text-align: center;
  transition: all 0.3s;
}

.pad-active {
  border-color: var(--cyan);
  box-shadow: 0 0 12px rgba(0, 255, 231, 0.4);
}

.pad-hit {
  border-color: var(--green);
  box-shadow: 0 0 8px rgba(57, 255, 20, 0.3);
}

.pad-miss {
  border-color: rgba(255, 45, 120, 0.3);
  opacity: 0.6;
}
```

#### 3.3 Features
- [x] 8-column grid layout
- [x] Each pad = ONE bot/machine
- [x] Agent ID (AG-00 to AG-31)
- [x] Individual P&L display
- [x] Dynamic sequencing as bots added
- [x] Visual states: active, hit, miss

---

### PHASE 4: Audio System ⚠️ NEW

#### 4.1 Web Audio API Engine
```javascript
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.volume = 0.5;
    this.muted = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.initialized = true;
  }

  playTone(freq, duration, type = 'sine') {
    if (!this.ctx || this.muted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(this.volume * 0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }
}
```

#### 4.2 Trade Event Sounds
| Event | Sound Type | Frequency |
|-------|-----------|-----------|
| Trade Open | Synth beep | 880Hz → 1320Hz |
| Win | Success chime | Major chord |
| Big Win | Fanfare | Arpeggio |
| Loss | Alert tone | 440Hz → 220Hz |
| Stop Loss | Warning | Descending |
| Take Profit | Celebration | Rising |

#### 4.3 Global Bell Milestones
- [ ] Every $100 profit
- [ ] Every $500 profit
- [ ] New high water mark
- [ ] Doubled initial balance

#### 4.4 Per-Bot Pitch Variation
```javascript
// Each bot gets unique pitch offset
const pitchOffset = (botId % 8) * 50; // +0 to +350Hz
const baseFreq = 440 + pitchOffset;
```

---

### PHASE 5: Flashloan Arbitrage Strategies ⚠️ NEW

#### Strategy Types to Add
- [ ] Flashloan execution (detect + execute)
- [ ] Cross-DEX spreading
- [ ] Liquidations

---

### PHASE 6: Integration ⚠️ NEW

#### Connect to Existing Logic
- [ ] Bot IDs from existing trading engine
- [ ] Open positions tracking
- [ ] P&L calculation  
- [ ] Button handlers
- [ ] Balance sync
- [ ] Market price feed

---

## Files to Modify

### Modified Files
1. **index.html** - Add vault HTML, pad grid container, fonts
2. **app.js** - Add vault rendering, pad grid logic, audio engine

### New Files
1. **acoustic-core.css** (optional) - Extract styles if needed

---

## Implementation Order

1. **Fonts** → Add Space Grotesk + JetBrains Mono
2. **Vault Display** → HTML + CSS + render logic
3. **Pad Grid** → HTML + CSS + dynamic rendering
4. **Audio Engine** → Web Audio API integration
5. **Integration** → Wire to existing bot state
6. **Testing** → Verify all features work

---

## Dependent Files
- app.js - Trading logic (existing)
- index.html - UI (to modify)
- server.js - Backend (no changes needed)

---

## Followup Steps
After completing each phase:
- Test vault animation
- Test pad grid dynamic rendering
- Test audio on trade events
- Verify balance sync
- Check market price feed

---

## Notes
- Maintain existing trading logic (self-learning, ensemble AI, circuit breakers)
- Each bot's audio has slight pitch variation for uniqueness
- The "matrix" concept ties into existing AI agent ensemble
