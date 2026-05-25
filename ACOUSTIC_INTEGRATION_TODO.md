# ACOUSTIC Integration TODO

## Completed Steps
- [x] Add script tags to index.html (sfx-engine.js, fx-engine.js, voice-engine.js, audio-engine.js, ACOUSTIC_CORE.js)
- [x] Add ACOUSTIC initialization to app-rebuild.js initAppRebuildV42()
- [x] Add ACOUSTIC controls to TradeArenaApp public API

## Pending Steps
- [ ] Add ACOUSTIC control UI (mute/volume buttons in header)
- [ ] Connect ACOUSTIC to trading events (trade execution sounds)
- [ ] Connect ACOUSTIC to profit/loss events (win/lose sounds)
- [ ] Test ACOUSTIC initialization works

## Technical Details
- ACOUSTICCore is instantiated in initAppRebuildV42()
- Available at window.ACOUSTIC
- Audio engines loaded: sfx-engine.js, fx-engine.js, voice-engine.js, audio-engine.js
- Public API: TradeArenaApp.ACOUSTIC.toggle(), .setVolume(), .playEvent(), .isEnabled()
