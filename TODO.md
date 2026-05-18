- [ ] Update `crucible-test.js` with deterministic/sàeded mode + invariant assertions for P&L/profitFactor/export consistency
- [ ] Align `exportCSV()` to export executed (quality) trades only (match `exportJSON()` + report semantics)
- [ ] Run `node slow-crucible-test.js` and confirm JSON output is generated
- [ ] Smoke-test browser usage: open `index.html`, run `runCrucibleTest(...)`, then verify console report + export functions

- [ ] Add `POST /api/exit/execute` in `server.js` that builds real exit calldata and submits on-chain tx using `SERVER_PRIVATE_KEY`
- [ ] Implement calldata builder for UniswapV3 router `swapExactTokensForTokens` (exit process)
- [ ] Add request validation + structured responses
- [ ] Smoke-test endpoint locally with sample payload

