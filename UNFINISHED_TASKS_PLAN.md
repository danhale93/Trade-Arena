# Unfinished Tasks Plan - Trade Arena

## Summary of Identified Unfinished Tasks

### 1. ACOUSTIC_INTEGRATION_TODO.md - PENDING
- [ ] Add ACOUSTIC control UI (mute/volume buttons in header)
- [ ] Connect ACOUSTIC to trading events (trade execution sounds)
- [ ] Connect ACOUSTIC to profit/loss events (win/lose sounds)
- [ ] Test ACOUSTIC initialization works

### 2. PRIVY_MOONPAY_IMPLEMENTATION_TODO.md - TESTING
- [ ] Test Privy login flow
- [ ] Test MoonPay deposit flow  
- [ ] Test fallback to demo mode

### 3. PLAN.md - Music Player Enhancements
- [ ] Add music toggle button to header
- [ ] Implement toggleBackgroundMusic() function  
- [ ] Test background music playback
- [ ] Enhance runCrucibleBatch() with live progress
- [ ] Add pause/cancel controls
- [ ] Create results modal with detailed breakdown

### 4. ACOUSTIC_CORE_IMPLEMENTATION_TODO.md - Phase 5 (ADVANCED)
- Requires live blockchain integration
- Multi-DEX smart contract deployment
- Note: This is marked as ADVANCED feature, not blocking

---

## Implementation Priority

### PHASE 1: ACOUSTIC Integration (High Priority)
1. Add music toggle button to header with emoji (🎵)
2. Add volume control button to header 
3. Wire trade execution sounds
4. Wire win/lose sounds on trade close

### PHASE 2: Music Player (Medium Priority)
1. Implement toggleBackgroundMusic() function
2. Ensure unified SFX/Music controls work together

### PHASE 3: Testing (High Priority)
1. Verify Privy login flow works
2. Verify MoonPay deposit flow works  
3. Verify demo mode fallback

### PHASE 4: Crucible Enhancements (Medium Priority)
1. Add live progress to crucible batch execution
2. Add pause/cancel controls
3. Enhance results modal

---

## Files to Modify

1. **index.html** - Add music toggle button, ACOUSTIC controls
2. **app.js** - Wire ACOUSTIC events to trades
3. **PLAN.md** - Update completed items

---

## Technical Notes

- ACOUSTICCore is instantiated in initAppRebuildV42()
- Available at window.ACOUSTIC
- Audio engines loaded: sfx-engine.js, fx-engine.js, voice-engine.js, audio-engine.js
- Public API: TradeArenaApp.ACOUSTIC.toggle(), .setVolume(), .playEvent(), .isEnabled()

---

Generated: Current Date
