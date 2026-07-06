# Trade-Arena v5 - Beta Blockers

| Priority | Title | Description | Severity | Files Involved | Effort | Recommended Solution |
|---|---|---|---|---|---|---|
| 1 | **Missing Production Keys** | .env is missing `ANTHROPIC_API_KEY` and other critical secrets. | Critical | `.env` | Low | Provision keys and update environment. |
| 2 | **Contract Configuration** | `PAYOUT_MANAGER_ADDRESS` and `REWARD_TOKEN_ADDRESS` are not set. | High | `server.js`, `routes/payoutRoutes.js` | Low | Deploy contracts to Base and update config. |
| 3 | **0x API Integration** | Real-world trading requires a valid 0x API key for quotes. | High | `public/execution-engine.js` | Low | Register for 0x API and add key to config. |
| 4 | **Bundle Size Optimization** | `arena-react-bundle.js` is 5.3MB. Needs tree-shaking. | Medium | `public/src/*`, `esbuild` config | Medium | Analyze bundle and exclude unused Privy/Ethers parts. |
| 5 | **Secure Webhook Verification** | MoonPay webhook secret is missing, preventing verification. | Medium | `server.js` | Low | Set `MOONPAY_WEBHOOK_SECRET` in production. |
| 6 | **Audit Log Persistence** | `users.json` may have race conditions under high load. | Low | `user_persistence.js` | Medium | Migrate to SQLite or external DB for scaling. |
