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


# Additional Requirement: Fix MetaMask Agent CLI Connection

- [x] Inspect runtime CLI availability, database token state, and reconnection error handling
- [x] Determine whether the connection can be resolved via runtime binary simulation or graceful fallback
- [x] Implement robust error feedback and graceful fallback handling in cli.ts and routers.ts
- [x] Add focused reconnect coverage for missing-binary diagnostics and stale validation prevention
- [x] Verify test suite, TypeScript check, and production build without enabling live broadcast
- [x] Save checkpoint and deliver actionable repair guidance

# Additional Requirement: Aggressive Strategy Logic & Profile Switching

- [x] Inspect existing guarded strategy parameters and multi-chain execution logic in routers.ts
- [x] Define aggressive strategy configuration (lowered profit thresholds, expanded polling/scans, optimized slippage tolerance, and max trade limits)
- [x] Implement strategy profile switching procedure (Guarded vs. Aggressive) in routers.ts and database state
- [x] Update the dashboard UI in Home.tsx with a Strategy Profile card and one-click toggle
- [x] Add Vitest unit coverage for strategy profile switching and aggressive threshold application
- [x] Verify test suite, TypeScript check, and production build without enabling live broadcast
- [x] Save checkpoint and deliver aggressive strategy update report

# Additional Requirement: User-Confirmed Manual Live-Arming (Direct Ethers.js)

- [x] Inspect pre-flight environment variables (MANAGED_WALLET_ADDRESS, DIRECT_EVM_SIGNER_PRIVATE_KEY, DIRECT_MAX_GAS_GWEI, DIRECT_MAX_INPUT_AMOUNT, DIRECT_EXECUTION_ENABLED, DIRECT_LIVE_CONFIRMATION)
- [x] Implement pre-flight health check procedure in routers.ts to ensure all live-execution prerequisites are met before arming
- [x] Ensure background automated loop remains disabled (manual-only checks via dashboard button)
- [x] Disable CLI fallback so live execution relies exclusively on the direct Ethers.js adapter
- [x] Run test suite, TypeScript check, and production build verification
- [x] Deliver execution arming status report and pre-flight findings

# Safety Follow-up: Enforce Manual-Only Live Mode

- [x] Block scanner re-enablement while owner-only live execution is armed
- [x] Add Vitest coverage for the manual-only scanner restriction
- [x] Re-verify execution and scanner state remain disarmed in the current runtime
- [x] Save the final live-arming safety checkpoint and report the blocked prerequisites

# Additional Requirement: Real-Time Gas Telemetry & Dynamic Profit Thresholds

- [x] Implement read-only RPC gas fee fetcher for Base, Arbitrum, and Optimism in directDex.ts
- [x] Define congestion bands (Low, Normal, Elevated, Congested) and dynamic threshold multiplier logic
- [x] Expose live gas telemetry and adjusted profit thresholds in the tRPC status router
- [x] Render per-chain congestion badges and dynamic profit thresholds in the dashboard UI
- [x] Add Vitest coverage for gas-aware threshold calculations and congestion classification
- [x] Verify test suite, TypeScript check, and production build without enabling live execution
- [x] Save checkpoint and publish the gas-telemetry update

# Additional Requirement: Live-Trading Readiness & CLI Connection Repair

- [x] Inspect safety warning regarding live financial execution and key management
- [x] Implement an interactive CLI Doctor panel in the dashboard for real-time connection diagnostics
- [x] Add explicit preflight validation and diagnostic readout for the $16 test allocation
- [x] Verify test suite, TypeScript check, and production build without enabling live execution
- [x] Deliver a complete, clear readiness report detailing exact prerequisites for real-money execution

# Additional Requirement: Multi-DEX Execution Engine & Deploy Scaffolding

- [x] Inspect existing OnchainExecutionEngine.js and DEX registry patterns
- [x] Add support for a second DEX (e.g., Aerodrome on Base, SushiSwap on Arbitrum/Optimism) to create genuine cross-DEX spreads
- [x] Implement reusable Uniswap/Aerodrome calldata builders in a dedicated service
- [x] Create simulation-safe deployment and verification scaffolding without broadcasting live transactions
- [x] Verify test suite, TypeScript check, and production build without enabling live execution
- [x] Save checkpoint and deliver multi-DEX implementation report

# Additional Requirement: Settings Secure Vault for JWT & Execution Caps

- [x] Inspect existing token persistence and settings procedures in routers.ts
- [x] Implement owner-protected vault procedures to update encrypted JWT token, max gas gwei, and max input WETH caps
- [x] Build a dedicated Secure Vault panel in Settings with masked inputs and live validation
- [x] Add Vitest test coverage for vault mutation access control and cap validation
- [x] Verify test suite, TypeScript check, and production build without enabling live execution
- [x] Save checkpoint and deliver Secure Vault report

# Additional Requirement: CLI Auth Helper Script for Passkey / Browser Login

- [x] Create scripts/cli-auth-helper.mjs to automate local mm doctor checks and browser login URL generation
- [x] Verify test suite, TypeScript check, and production build without enabling live execution
- [x] Save checkpoint and deliver auth helper instructions

# Additional Requirement: Simulated Route Profitability History Widget

- [x] Inspect existing simulated route, trade log, schema, and dashboard data flows
- [x] Define and implement persisted/queryable profitability history for simulation results
- [x] Build responsive cyberpunk profitability history widget with time-range and chain visibility
- [x] Add focused Vitest coverage for history aggregation and empty/error states
- [x] Verify tests, TypeScript, production build, and responsive dashboard previews
- [x] Save checkpoint and deliver the profitability widget update

POSIX

# Additional Requirement: High-Profit Simulation Pulse

- [x] Inspect current profitability widget refresh, threshold, and motion styling flows
- [x] Implement new-record detection for simulations above the high-profit threshold
- [x] Add accessible visual pulse animation and concise high-profit status feedback
- [x] Add focused tests and verify desktop/mobile rendering plus reduced-motion behavior
- [x] Save checkpoint and deliver the pulse animation update

# Additional Requirement: High-Profit Pulse Event Log

- [x] Inspect the existing pulse trigger, simulation history persistence, and dashboard log sections
- [x] Add persistent pulse-event storage and expose recent events through the dashboard status API
- [x] Build a timestamped high-profit pulse event log section with empty and loading states
- [x] Add focused tests and verify refresh behavior plus desktop/mobile rendering
- [x] Save checkpoint and deliver the pulse-event log update

# Additional Requirement: Pulse Event Network Filters

- [x] Inspect the pulse-event table data flow and current dashboard controls
- [x] Implement network filter state, toggle controls, and filtered event data
- [x] Add filtered counts, empty states, and accessible interaction feedback
- [x] Add focused tests and verify desktop/mobile rendering
- [x] Save checkpoint and deliver the network-filter update
