# ACOUSTIC CORE - Implementation Plan

## Branch: blackboxai/acoustic-core

## Summary
This document outlines the step-by-step implementation plan for the ACOUSTIC CORE redesign.

---

## Phase 1: Core Visual Design

### 1.1 Fonts & Typography ✅ ALREADY DONE
- [x] Space Grotesk font added
- [x] JetBrains Mono font added
- [x] Dark mode base #050508

### 1.2 Theme Variables
Add to existing CSS if not present:
- --gold: #fbbf24
- --cyan: #00ffe7  
- --green: #39ff14

---

## Phase 2: The Vault Display (NEW)

### 2.1 HTML Structure
Add after global-header:
```html
<div class="vault-hero" id="vaultHero">
  <div class="vault-label">THE VAULT</div>
  <div class="vault-container">
    <div class="vault-fill" id="vaultFill"></div>
    <div class="vault-balance-display">
      <span class="vault-balance" id="vaultBalance">$10,000.00</span>
      <span class="vault-label-small">BALANCE</span>
    </div>
  </div>
  <div class="vault-mode-indicator">
    <span id="vaultMode">SHADOW MODE</span>
  </div>
</div>
```

### 2.2 CSS
```css
.vault-hero {
  background: linear-gradient(180deg, #1a0d00, #050508);
  border: 2px solid var(--gold);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  position: relative;
  overflow: hidden;
}

.vault-container {
  height: 120px;
  background: rgba(0,0,0,0.4);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.vault-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 0%; /* Animated based on balance */
  background: linear-gradient(180deg, #fbbf24, #ff8c00);
  transition: height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.vault-hero.live-mode .vault-fill {
  background: linear-gradient(180deg, #ff2d78, #ff0044);
}

.vault-balance-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.vault-balance {
  font-family: 'Bungee', display;
  font-size: 28px;
  color: #fff;
}

.vault-mode-indicator {
  position: absolute;
  top: 8px;
  right: 12px;
  font-size: 8px;
  color: var(--dim);
  text-transform: uppercase;
  letter-spacing: 1px;
}
```

---

## Phase 3: Agent/Machine Matrix (Pad Grid) (NEW)

### 3.1 HTML Structure
Replace or enhance existing bot-grid:
```html
<div class="matrix-section">
  <div class="matrix-header">
    <span>AGENT/MACHINE MATRIX</span>
    <span class="matrix-count" id="matrixCount">0 ACTIVE</span>
  </div>
  <div class="pad-grid" id="padGrid">
    <!-- Pads render dynamically -->
  </div>
</div>
```

### 3.2 CSS
```css
.pad-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
  margin-top: 8px;
}

.pad {
  background: var(--chrome);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 4px;
  text-align: center;
  transition: all 0.3s ease;
  min-height: 52px;
}

.pad-agent-id {
  font-size: 8px;
  color: var(--dim);
  display: block;
}

.pad-pnl {
  font-family: 'Bungee', display;
  font-size: 10px;
  display: block;
  margin-top: 2px;
}

/* Pad States */
.pad-active {
  border-color: var(--cyan);
  box-shadow: 0 0 12px rgba(0, 255, 231, 0.4);
  animation: padPulse 1s ease infinite;
}

.pad-hit {
  border-color: var(--green);
  box-shadow: 0 0 8px rgba(57, 255, 20, 0.3);
  background: rgba(57, 255, 20, 0.08);
}

.pad-miss {
  border-color: rgba(255, 45, 120, 0.3);
  opacity: 0.6;
  background: rgba(255, 45, 120, 0.04);
}

@keyframes padPulse {
  0%, 100% { box-shadow: 0 0 12px rgba(0, 255, 231, 0.4); }
  50% { box-shadow: 0 0 20px rgba(0, 255, 231, 0.7); }
}

@media (max-width: 640px) {
  .pad-grid { grid-template-columns: repeat(4, 1fr); }
}
@media (min-width: 641px) and (max-width: 900px) {
  .pad-grid { grid-template-columns: repeat(6, 1fr); }
}
```

### 3.3 Pad Template
```html
<div class="pad pad-active" id="pad-{botId}" data-agent-id="AG-{agentId}">
  <span class="pad-agent-id">AG-{agentId}</span>
  <span class="pad-pnl">+${pnl}</span>
</div>
```

---

## Phase 4: Audio System (NEW)

### 4.1 JavaScript Class
```javascript
class AcousticCoreAudio {
  constructor() {
    this.ctx = null;
    this.volume = 0.5;
    this.muted = false;
    this.initialized = false;
    this.milestones = {
      highWaterMark: balance,
      lastBell: 0
    };
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch(e) {
      console.warn('Audio not supported:', e);
    }
  }

  playTone(freq, duration, type = 'sine', vol = null) {
    if (!this.ctx || this.muted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    const v = vol || this.volume;
    gain.gain.setValueAtTime(v * 0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // Trade events
  tradeOpen(botId) {
    const pitch = 440 + (botId * 50); // Unique pitch per bot
    this.playTone(pitch, 0.15, 'square', 0.2);
    setTimeout(() => this.playTone(pitch * 1.5, 0.1, 'square', 0.15), 80);
  }

  win(botId, pnl) {
    const pitch = 523 + (botId * 30);
    this.playTone(pitch, 0.2, 'sine');
    setTimeout(() => this.playTone(pitch * 1.25, 0.15, 'sine'), 100);
    setTimeout(() => this.playTone(pitch * 1.5, 0.25, 'sine'), 200);
    if (pnl > 20) this.bigWin(botId);
  }

  loss(botId) {
    const pitch = 330 - (botId * 20);
    this.playTone(pitch, 0.3, 'sawtooth', 0.25);
    setTimeout(() => this.playTone(pitch * 0.7, 0.2, 'sawtooth', 0.2), 150);
  }

  bigWin(botId) {
    // Fanfare
    [1, 1.25, 1.5, 2].forEach((mult, i) => {
      setTimeout(() => this.playTone(523 * mult, 0.2, 'square', 0.25), i * 150);
    });
  }

  // Global bell at milestones
  checkMilestones(balance) {
    if (this.muted) return;
    
    // Every $100 profit milestone
    const milestone100 = Math.floor(balance / 100);
    const last100 = Math.floor(this.milestones.lastBell / 100);
    
    if (milestone100 > last100 && balance > this.milestones.highWaterMark - 100) {
      this.bell();
      this.milestones.lastBell = balance;
    }
    
    // New high water mark
    if (balance > this.milestones.highWaterMark) {
      this.milestones.highWaterMark = balance;
    }
  }

  bell() {
    // Carousel bell sound
    [880, 1100, 1300, 1500].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.15, 'sine', 0.3), i * 100);
    });
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
  }
}
```

### 4.2 Usage in Trading
```javascript
// Instantiate
const audio = new AcousticCoreAudio();

// Initialize on first user interaction
document.addEventListener('click', () => audio.init(), { once: true });

// On trade open
audio.tradeOpen(bot.id);

// On trade close (win/loss)
if (pnl > 0) audio.win(bot.id, pnl);
else audio.loss(bot.id);

// On balance update
audio.checkMilestones(balance);

// Mute toggle handler
function toggleAudio() {
  const muted = audio.toggleMute();
  updateMuteButton(muted);
}
```

---

## Phase 5: Integration

### 5.1 Wire Vault to Balance
```javascript
function updateVault(balance, startBalance = 5000) {
  const fill = Math.min((balance / startBalance) * 100, 100);
  document.getElementById('vaultFill').style.height = fill + '%';
  document.getElementById('vaultBalance').textContent = 
    '$' + balance.toFixed(2);
}
```

### 5.2 Wire Pad Grid to Bots
```javascript
function renderPadGrid() {
  const grid = document.getElementById('padGrid');
  grid.innerHTML = bots.map((bot, i) => {
    const agentId = String(i).padStart(2, '0');
    const pnl = bot.pnl || 0;
    const state = getPadState(bot);
    return `<div class="pad ${state}" id="pad-${bot.id}" data-agent-id="AG-${agentId}">
      <span class="pad-agent-id">AG-${agentId}</span>
      <span class="pad-pnl ${pnl >= 0 ? 'text-green' : 'text-red'}">
        ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}
      </span>
    </div>`;
  }).join('');
  
  document.getElementById('matrixCount').textContent = 
    bots.length + ' ACTIVE';
}

function getPadState(bot) {
  // Return appropriate state class
}
```

### 5.3 Live Mode Toggle
```javascript
let isLiveMode = false;

function toggleLiveMode() {
  isLiveMode = !isLiveMode;
  const vault = document.getElementById('vaultHero');
  const mode = document.getElementById('vaultMode');
  
  vault.classList.toggle('live-mode', isLiveMode);
  mode.textContent = isLiveMode ? 'LIVE TRADING' : 'SHADOW MODE';
  mode.style.color = isLiveMode ? 'var(--hot)' : 'var(--gold)';
}
```

---

## Testing Checklist
- [ ] Vault displays and animates correctly
- [ ] Adding bots creates new pads
- [ ] Pads show individual P&L
- [ ] Active pad visually highlighted
- [ ] Win/loss pad states work
- [ ] Audio plays on trade events
- [ ] Bell rings at milestones
- [ ] Mute toggle works
- [ ] Live mode changes vault color
- [ ] Balance updates vault fill

---

## Implementation Order

1. **Task 1**: Add vault HTML + CSS to index.html
2. **Task 2**: Add pad grid HTML + CSS to index.html  
3. **Task 3**: Add AudioEngine class to new file or app.js
4. **Task 4**: Wire vault to balance in existing JS
5. **Task 5**: Wire pad grid to bots
6. **Task 6**: Wire audio to trade events
7. **Task 7**: Test complete flow

---

## Notes
- Maintain existing trading logic
- Each bot's audio has slight pitch variation
- The "matrix" concept ties into existing AI agent ensemble
