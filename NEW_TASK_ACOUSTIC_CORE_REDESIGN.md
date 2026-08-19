# New Task: Acoustic Core Trading Interface Redesign

## Summary
Redesign the Trade Arena trading interface with a complete visual and functional overhaul called the "Acoustic Core Orchestrator" - featuring a pot-of-gold vault visualization, dynamic agent/machine pad grid that grows with each bot, integrated audio telemetry system, and flashloan arbitrage strategies.

## Current State
- Existing trading app with bot grid, circuit breakers, self-learning AI agents
- Basic SFX/audio system already in place
- Multi-bot architecture (up to 99 bots)
- Self-learning model with ensemble AI

## Target State

### 1. Visual Design Overhaul
- **Theme**: "Acoustic Core" - dark mode (#050508) with gold (#fbbf24), cyan (#00ffe7), green (#39ff14) accents
- **Typography**: Space Grotesk for body, JetBrains Mono for data/tickers
- **Glass Panels**: Frosted glass effect with backdrop blur
- **Three Screens**:
  - Screen 01: Execution (The Arena) - main trading interface
  - Screen 02: Auditor (Market Bridge) - data integrity & pricing
  - Screen 03: Settings - system configuration

### 2. The Vault (Balance Display)
- Large pot-of-gold visualization at top of Execution screen
- Vault fill animates based on balance relative to $5,000 max
- Gradient: amber to gold in shadow mode, rose to red in live mode
- Animations: smooth transitions using cubic-bezier easing

### 3. Agent/Machine Matrix (Dynamic Pad Grid)
- **8-column grid** of trading "pads" (machines)
- Each pad represents ONE bot/trading machine
- Pad displays:
  - Agent ID (AG-00 to AG-31)
  - Individual P&L for that machine
- **Dynamic sequencing**: When + button adds bot → new pad joins the sequencer
- Visual states:
  - `pad-active`: Currently executing
  - `pad-hit`: Profitable trade (green glow)
  - `pad-miss`: Loss (red, faded)
- Grid expands as more bots are added (scales to accommodate up to 99+ bots)

### 4. Flashloan Arbitrage Strategies
- Add to the strategies panel (currently Strategies dropdown)
- Include strategy types:
  - Flashloan execution (detect + execute arbitrage)
  - Cross-DEX spreading
  - Liquidations
- Show strategy performance breakdown per regime

### 5. Trade Telemetry Audio System
Each bot gets a **unique set of audio samples** for trade events:

| Event | Audio Type |
|-------|------------|
| Trade Open | Synth beep (high pitch) |
| Win | Success chime |
| Big Win | Bonus fanfare |
| Loss | Alert tone |
| Stop Loss | Warning alarm |
| Take Profit | Celebration sound |
| Countdown tick | Metronome tick |
| Bot Deploy | Deployment sound |
| Balance milestone | Global bell |

**Global Bell**: Rings at specific balance milestones:
- Every $100 profit
- Every $500 profit  
- New high water mark
- Doubled initial balance

Audio Implementation:
- Use Web Audio API for synthesis (no external files needed)
- Each bot gets unique pitch variation
- Master volume control
- Mute toggle for global audio
- Audio context initialization on first user interaction

### 6. Integration Points
- Connect new UI to existing trading logic (bot IDs, positions, P&L)
- Wire up button handlers: "Engage Trade Matrix", "Live Toggle"
- Integrate balance display: sync with global balance state
- Connect market price feed to Auditor screen
- Link settings inputs to existing config state

## Required Changes

### Files to Modify
1. `index.html` - Complete UI redesign with new HTML structure
2. `app.js` - Add pad grid rendering logic, dynamic bot addition
3. Audio engine integration with existing crucible-entertainment.js or new audio system

### Implementation Priority
1. **Phase 1**: Core visual design + Vault display
2. **Phase 2**: Agent matrix with dynamic pads
3. **Phase 3**: Audio system + telemetry sounds
4. **Phase 4**: Flashloan arbitrage strategies
5. **Phase 5**: Integration + testing

## Example Pad HTML Structure
```html
<div class="pad-grid">
  <!-- Pads render dynamically -->
  <div class="pad" id="pad-0">
    <span class="opacity-50">AG-00</span>
    <span class="font-bold">$0.00</span>
  </div>
  <!-- More pads added via JS when bots added -->
</div>
```

## Audio Example (Web Audio API)
```javascript
const playTelemetry = (isHit, pitch = 440) => {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(pitch, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(pitch * (isHit ? 1.5 : 0.5), ctx.currentTime + 0.2);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + 0.3);
};
```

## Testing Checklist
- [ ] Vault displays and animates correctly
- [ ] Adding bots creates new pads
- [ ] Pads show individual P&L
- [ ] Active pad visually highlighted
- [ ] Win/loss pad states work
- [ ] Audio plays on trade events
- [ ] Bell rings at milestones
- [ ] Mute toggle works
- [ ] Screen navigation works
- [ ] Settings persist
- [ ] Market price displays in Auditor
- [ ] Live mode changes vault color
- [ ] Balance updates vault fill

## Notes
- Maintain existing trading logic (self-learning, ensemble AI, circuit breakers)
- Each bot's audio should have slight pitch variation for uniqueness
- The "matrix" concept ties into existing AI agent ensemble
- This is a significant redesign - may warrant new branch + PR
