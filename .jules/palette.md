## 2026-06-29 - Payout Header Integration
Learning: Header real-estate is limited; used a compact 'CLAIM' button next to the balance to maintain UI balance.
Action: Integrated payout claim logic directly into the header for high visibility.

## 2026-07-05 - Synchronize Bot Bet UI and ARIA States
**Learning:** Trader bots default to a $10.00 bet value, but the frontend was hardcoding a "$1.00" display and lacked a corresponding preset button, leading to a state mismatch. Additionally, interactive toggles lacked ARIA state synchronization, making the UI less accessible to screen readers.
**Action:** Always verify UI presets against default bot configurations and ensure all interactive toggles synchronize both visual classes and ARIA attributes (using string values like ".toString()").
