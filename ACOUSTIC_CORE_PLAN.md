# Acoustic Core Orchestrator - Implementation Plan

## Summary
Redesign the Trade Arena trading interface with a complete visual and functional overhaul called the "Acoustic Core Orchestrator" - featuring a pot-of-gold vault visualization, dynamic agent/machine pad 
grid that grows with each bot, integrated audio telemetry system, and flashloan arbitrage strategies.

## Implementation Approach
**Option C**: Create NEW standalone file AND integrate with existing trading systems

---

## PHASE 1: Core Visual Design

### 1.1 Theme & Typography
- [x] Dark mode base (#050508)
- [x] Gold accent (#fbbf24)
- [x] Cyan accent (#00ffe7)
- [x] Green accent (#39ff14)
- [x] Space Grotesk font for body
- [x] JetBrains Mono for data/tickers

### 1.2 Glass Panels
- [x] Frosted glass effect with backdrop blur
- [x] Semi-transparent backgrounds

### 1.3 Navigation
- [x] Three screens: Execution (Arena), Auditor (Market Bridge), Settings (System)

---

## PHASE 2: The Vault Display

### 2.1 Pot-of-Gold Visualization
- [x] Large balance display at top
- [x] Vault hero container with gradient fill
- [x] Vault fill animates based on balance ($5,000 max reference)
- [x] Shadow mode: amber to gold gradient
- [x] Live mode: rose to red gradient
- [x] Cubic-bezier easing for smooth transitions

---

## PHASE 3: Agent/Machine Matrix (Pad Grid)

### 3.1 Dynamic Pad Grid
- [x] 8-column grid layout
- [x] Each pad represents ONE bot/trading machine
- [x] Pad displays: Agent ID (AG-00 to AG-31) + Individual P&L
- [x] Dynamic sequencing as bots are added
- [x] Visual states:
  - [x] `pad-active`: Currently executing
  - [x] `pad-hit`: Profitable trade (green glow)
  - [x] `pad-miss`: Loss (red, faded)

---

## PHASE 4: Audio System

### 4.1 Trade Telemetry Audio
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

### 4.2 Implementation
- [x] Web Audio API for synthesis (no external files)
- [x] Each bot gets unique pitch variation
- [x] Master volume control
- [x] Mute toggle for global audio
- [x] Audio context initialization on first user interaction

### 4.3 Global Bell Milestones
- Every $100 profit
- Every $500 profit
- New high water mark
- Doubled initial balance

---

## PHASE 5: Flashloan Arbitrage Strategies

### 5.1 Strategy Types
- [x] Flashloan execution (detect + execute arbitrage)
- [x] Cross-DEX spreading
- [x] Liquidations

---

## PHASE 6: Integration Points

### 6.1 Connect to Existing Logic
- [x] Bot IDs from existing trading engine
- [x] Open positions tracking
- [x] P&L calculation
- [x] Button handlers: "Engage Trade Matrix", "Live Toggle"
- [x] Balance display sync with global state
- [x] Market price feed to Auditor screen
- [x] Settings inputs to config state

---

## Files to Create/Modify

### New Files
1. `acoustic-core.html` - Complete new UI with self-contained trading logic

### Modified Files (Integration)
1. `app.js` - Add pad grid rendering logic, dynamic bot addition
2. Create integration layer to existing trading engine

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
- [ ] Screen navigation works
- [ ] Settings persist
- [ ] Market price displays in Auditor
- [ ] Live mode changes vault color
- [ ] Balance updates vault fill

---

## Implementation Notes
- Maintain existing trading logic (self-learning, ensemble AI, circuit breakers)
- Each bot's audio should have slight pitch variation for uniqueness
- The "matrix" concept ties into existing AI agent ensemble
- This is a significant redesign - new branch + PR recommended
