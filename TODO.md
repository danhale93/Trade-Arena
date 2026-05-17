# TODO — Real funds affordability + circuit breaker correctness

- [ ] Update affordability logic in `index.html`:
  - [ ] Introduce a single affordability function that budgets `bet + estimatedCosts + feeBuffer`.
  - [ ] Use wallet/internal balance consistently.
- [x] Replace hard blocks that cause "insufficient balance":
  - [x] In `spinBot()` and `openPosition()`, replaced hard blocks with budgeted affordability + auto-scaling.
  - [x] Auto-scale bot bet downward to maximum affordable bet (down to configured minimums).

- [ ] Add UI indicators:
  - [ ] Show “Budgeted required: $X” and “Affordable: yes/no” near each bot ticker or in breaker status.
- [ ] Ensure circuit breakers match budgeting:
  - [ ] Gas hard ceiling + drawdown kill should pause autos and force no trading when budgeting fails.
- [ ] Test flow (manual):
  - [ ] Connect MetaMask with low balance (~$1–$5).
  - [ ] Set bet $1 / enable AUTO.
  - [ ] Confirm trades proceed (no stuck insufficient balance) and bets scale with available capital.
- [ ] Test flow (auto):
  - [ ] Increase to $10+ and ensure scaling respects user’s selected bet.

