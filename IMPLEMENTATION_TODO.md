# Implementation TODO - Trade Arena

## Current Status Summary

### ACOUSTIC_CORE System ✅ 95% Complete
- Visual components: Vault, pad grid ✓ implemented in index.html
- Audio engines: sfx-engine.js, fx-engine.js, voice-engine.js, audio-engine.js, ACOUSTIC_CORE.js ✓ created
- **NOT integrated**: Script tags missing in index.html

### CRUCIBLE_MODE Implementation ⚠️ Plan Only
- Implementation plan exists: CRUCIBLE_MODE_IMPLEMENTATION_PLAN.md
- Needs: crucible-mode.js, index.html wiring

---

## Implementation Plan

### Task 1: Wire ACOUSTIC Engines (15 min)
**Goal**: Connect audio/visual engines to trading events

**Files to edit**:
- `index.html` - Add script tags in order

**Changes needed**:
```html
<!-- Before app.js -->
<script src="audio-engine.js"></script>
<script src="sfx-engine.js"></script>
<script src="fx-engine.js"></script>
<script src="voice-engine.js"></script>
<script src="ACOUSTIC_CORE.js"></script>
```

**Verification**: Audio plays on trade open/win/loss

---

### Task 2: Implement CRUCIBLE_MODE (30 min)
**Goal**: Hidden trading validation mode with CSV export

**Files to create**:
- `crucible-mode.js` - Core implementation

**Files to edit**:
- `index.html` - URL detection, export button
- `app.js` - Initialize crucible mode

**Features**:
- Hidden via ?crucible=1 URL parameter
- Fixed: ETH only, $50 position, 5-min hold
- Live CoinGecko prices
- Friction model: 0.15% spread, $3 gas, 1.5× stress test
- Shadow baselines: Random, Always Long, Momentum
- 50+ trades over 5-7 days
- CSV ledger with detailed fields
- Pass/Fail criteria validation

---

## Implementation Order

1. ✅ Wire ACOUSTIC engines → Trade events
2. ⏳ Implement CRUCIBLE_MODE
3. ⏳ Test integration

---

## Dependencies

### ACOUSTIC_CORE Integration
- `audio-engine.js` - Must load before SFX/VOICE
- `sfx-engine.js` - Uses window.SFX 
- `fx-engine.js` - Uses window.FX
- `voice-engine.js` - Uses window.VOICE
- `ACOUSTIC_CORE.js` - Bridges all engines

### CRUCIBLE_MODE Dependencies  
- `trading-engine.js` - Uses existing trade logic
- `crucible-test.js` - Can copy CSV export from
- `index.html` - UI components ready

---

## Testing Checklist

After ACOUSTIC integration:
- [ ] Trade open sound plays
- [ ] Win sounds on profit
- [ ] Loss sounds on loss
- [ ] Confetti on big wins
- [ ] Screen flash on events
- [ ] VOICE announces trade (if enabled)
- [ ] ACOUSTIC control panel works

After CRUCIBLE implementation:
- [ ] ?crucible=1 hidden mode activates
- [ ] Fixed trade parameters work
- [ ] CSV export generates
- [ ] Pass/Fail criteria display
- [ ] Shadow baselines compare
