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
# Additional Requirement: Verbose Debugging and Terminal UI

- [x] Add `agent_logs` table in `drizzle/schema.ts` and generate migration
- [x] Add `recordAgentLog` and `getAgentLogs` helpers in `server/db.ts`
- [x] Instrument backend routers and CLI execution with structured verbose logging
- [x] Expose `agentLogs` in `arbitrage.status` tRPC response
- [x] Upgrade Live Event Stream panel in `client/src/pages/Home.tsx` with live filter tags and auto-scrolling terminal logs
- [x] Verify test suite, production build, save checkpoint, and deliver update
# Bugfix: Duplicate React Key Warning

- [x] Inspect Home.tsx log filter array for duplicate 'CLI' entry
- [x] Remove duplicate 'CLI' entry from logFilter map in Home.tsx
- [x] Run test suite and production build verification
- [x] Save new WebDev checkpoint and deliver final fix
# Import Google Stitch Visuals

- [x] Inspect Google Stitch preview URL and extract styling cues
- [x] Refine CSS gradients, borders, backdrop blurs, and typography in Home.tsx and index.css to match Stitch design system
- [x] Verify test suite and production build
- [x] Save new WebDev checkpoint and deliver updated dashboard
# Trade Failure Diagnosis

- [x] Inspect server/routers.ts execution handler and server/cli.ts wrapper for error handling, timeout, and CLI output parsing
- [x] Check agent_logs and suppressed_alerts tables for recent error logs and failed executions
- [x] Identify root cause of trade failures (CLI token/auth, insufficient gas/funds, negative simulated spread, or RPC timeout)
- [x] Query suppressed_alerts table and verify error handling
- [x] Provide truthful error reporting when MetaMask CLI binary is absent in sandbox deployment
- [x] Run test suite and production build verification
# MetaMask Agent CLI Connection Verification

- [x] Inspect runtime/persisted CLI connection state (MM_CLI_TOKEN, MANAGED_WALLET_ADDRESS, and agent_state)
- [x] Verify server/cli.ts wrapper path handling and robust error logging
- [x] Run test suite verifying CLI environment configuration
- [x] Deliver clear connection status report to the user
# MetaMask Agent CLI Token Link Flow

- [x] Check if `mm` binary or npx metamask-agent exists in sandbox
- [x] Attempt `mm login` or `mm link` or npx invocation to inspect auth link output
- [x] Report outcome and guide user on generating fresh token

# Additional Requirement: MetaMask Agent Connection Indicator

- [x] Inspect the existing CLI connection status source and dashboard header structure
- [x] Expose a truthful connected/disconnected status to the dashboard if needed
- [x] Add an accessible visual status indicator to the dashboard header
- [x] Add or update Vitest coverage for connected and disconnected states
- [x] Verify responsive visual behavior, production build, and save checkpoint


# Additional Requirement: Manual MetaMask Agent Connection Controls

- [x] Inspect the existing connection state and token submission flow
- [x] Add protected reconnect and disconnect procedures with truthful state updates
- [x] Add accessible header controls with loading, success, and error feedback
- [x] Add or update Vitest coverage for reconnect and disconnect behavior
- [x] Verify desktop/mobile behavior, production build, and save checkpoint


# Additional Requirement: Last-Validated MetaMask Agent Timestamp

- [x] Inspect the current connection state and header badge implementation
- [x] Persist and expose the last validation timestamp for reconnect and token submission flows
- [x] Render the timestamp beside the MetaMask Agent status badge accessibly and responsively
- [x] Add or update Vitest coverage for timestamp state transitions
- [x] Verify desktop/mobile behavior, production build, and save checkpoint


# Additional Requirement: Direct Ethers.js DEX Router Adapter

- [x] Inspect current CLI execution adapter, chain configuration, secrets, and tests
- [x] Define explicit per-chain router/token/signer configuration and live-execution safety gates
- [x] Implement simulation-first Ethers.js quote and guarded execution adapter for Base, Arbitrum, and Optimism
- [x] Add Vitest coverage for quote construction, signer validation, slippage, and no-broadcast safety paths
- [x] Verify tests, TypeScript, and production build without broadcasting a transaction
- [x] Save checkpoint only after implementation is verified and live execution remains disabled pending confirmation

