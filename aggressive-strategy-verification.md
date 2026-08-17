# Aggressive Strategy Verification

The dashboard now reports the persisted `AGGRESSIVE` profile with a 3-second poll target and 0.01 WETH maximum strategy input. The profile card provides an owner-only switch back to `GUARDED`.

Desktop verification shows `SIMULATION_ONLY`, `SCANNER: PAUSED`, the aggressive profile card, and the `LIVE PREFLIGHT BLOCKED` control with the missing signer/cap diagnostics. The mobile header remains legible; the profile card is below the fold and remains within the responsive dashboard flow. No live transaction was sent.
