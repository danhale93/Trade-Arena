- [x] Inspect repo for existing trading/testing code (`server.js`, `crucible-test.js`, `contract-helpers.js`).
- [x] Implement real trading exit engine endpoint:
  - [x] Add `POST /api/exit/execute` in `server.js`

  - [x] Use `ContractHelper` to estimate minOut and build calldata via Uniswap V3 router
- [x] Sign + submit tx using `SERVER_PRIVATE_KEY`
- [x] Add request validation + structured JSON errors
- [x] Return `{ success, txHash, receipt, inputs, minOut, estimatedOut }`
- [x] Add smoke-test script / local curl instructions
- [x] Run `node` smoke test (no-op unless private key is present)

