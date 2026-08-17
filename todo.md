# Trade-Arena Settings & Token Vault TODO

- [x] Inspect current settings route and token mutation
- [x] Implement secure settings-page token form with masking and owner validation
- [x] Verify token handling, test suite, and production build check
- [x] Save checkpoint and deliver updated dashboard
# Additional Requirement: Configure Backend CLI Environment

- [x] Inspect existing project secrets and configuration
- [x] Define MM_CLI_TOKEN and MANAGED_WALLET_ADDRESS environment variables securely via backend request_secrets / env config
- [x] Verify environment variable availability in server context without exposing plaintext secrets
- [x] Deliver configuration confirmation and operational boundary notice
# Additional Requirement: Phone Notifications and Mini Live Widget

- [x] Design PWA manifest and service worker support for home-screen shortcut and push notifications
- [x] Implement mini live-ticker widget view mode on the dashboard for compact lock-screen / home-screen viewing
- [x] Connect backend notification helper (`notifyOwner` / Firebase Cloud Messaging Web Push) to alert phone on successful trade settlement
- [x] Provide clear guide on obtaining Google/Firebase Cloud Messaging (FCM) API keys and web push credentials
- [x] Verify build, run test suite, and deliver implementation status
# Additional Requirement: Minimum Profit Notification Threshold

- [x] Add `min_profit_threshold` field or config state in database / agent state
- [x] Add tRPC procedure to update minimum profit threshold (owner-only)
- [x] Add minimum profit threshold input to the dashboard Settings / Secure Vault card
- [x] Apply threshold check in backend notification dispatch before calling `notifyOwner`
- [x] Verify test suite, production build, and deliver update
# Additional Requirement: Suppressed Alerts Log

- [x] Add `suppressedAlerts` table in `drizzle/schema.ts` and generate migration
- [x] Add query and insert helpers in `server/db.ts` for suppressed alerts
- [x] Update trade execution router to record suppressed alerts when profit is below `min_profit_threshold`
- [x] Add `suppressedAlerts` query in `arbitrage.status` procedure
- [x] Add Suppressed Alerts panel in `client/src/pages/Home.tsx`
- [x] Verify test suite, production build, save checkpoint, and deliver update
