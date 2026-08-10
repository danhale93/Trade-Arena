# 📋 Trade Arena - Mainnet Readiness Backlog & Ticket Tracker

This document represents the official issue tracker and backlog for the Trade Arena mainnet transition. All tasks are prioritized, sized, labeled, and assigned to specific response team owners.

## 👥 Response Team Configuration
*   **SRE / Infrastructure Owner:** Alex Rivers (SRE)
*   **Lead Developer / Core Engine Owner:** Sam Chen (Dev)
*   **Security Architect / Audit Owner:** Elena Vance (Sec)
*   **Legal & Compliance Officer:** Jordan Cruz (Legal)
*   **Product Owner / Stakeholder:** danhale93 (PO)

---

## 🗺️ Ticket Navigation (Quick Links)

### Epic 0: Pre-Execution Guardrails & Hard Limits (Phase 0)
*   [T-001: Implement Pre-Execution Sanity Checks](#t-001-implement-pre-execution-sanity-checks) - `[security]` `[high-priority]` `[staging]`
*   [T-002: Add Hardcoded Risk Controls (Daily Caps & Global Kill-Switch)](#t-002-add-hardcoded-risk-controls-daily-caps-and-global-kill-switch) - `[security]` `[high-priority]` `[staging]`

### Epic 1: CI/CD Pipeline & Staging Isolation (Phase 1)
*   [T-101: GitHub Actions Mainnet-Fork Integration Test](#t-101-github-actions-mainnet-fork-integration-test) - `[high-priority]` `[staging]`
*   [T-102: Setup Isolated Staging Render Service](#t-102-setup-isolated-staging-render-service) - `[high-priority]` `[staging]`
*   [T-103: 14-Day Continuous Paper-Trading Log Validation](#t-103-14-day-continuous-paper-trading-log-validation) - `[staging]`
*   [T-104: Enable Automated CodeQL & Dependabot Scan Policies](#t-104-enable-automated-codeql-and-dependabot-scan-policies) - `[security]`

### Epic 2: Secure Custody & Relayer Integration (Phase 2)
*   [T-201: Setup Gnosis Safe Multisig & Relayer Contract Architecture](#t-201-setup-gnosis-safe-multisig-and-relayer-contract-architecture) - `[security]` `[high-priority]`
*   [T-205: Integrate HSM and Secure Cloud Vault (Elena Vance (Sec))](#t-205-integrate-hsm-and-secure-cloud-vault) - `[security]` `[high-priority]`
*   [T-202: Pre-Transaction Alchemy/Tenderly Simulations](#t-202-pre-transaction-alchemytenderly-simulations) - `[security]` `[high-priority]`
*   [T-203: Implement Resilient Nonce & Retry Backoff System](#t-203-implement-resilient-nonce-and-retry-backoff-system) - `[high-priority]`
*   [T-204: Flashbots & Private RPC Bundle Integration](#t-204-flashbots-and-private-rpc-bundle-integration) - `[security]`

### Epic 3: Audits & Compliance (Phase 2)
*   [T-301: Smart Contract Code Freeze & External Audit](#t-301-smart-contract-code-freeze-and-external-audit) - `[security]` `[high-priority]`
*   [T-302: Legal Framework and Non-Custodial Compliance Check](#t-302-legal-framework-and-non-custodial-compliance-check) - `[security]` `[high-priority]`

### Epic 4: Production Rollout, Monitoring & Game Days (Phase 3)
*   [T-401: Configure Prometheus & Grafana Dashboards](#t-401-configure-prometheus-and-grafana-dashboards) - `[high-priority]`
*   [T-402: Production Deployment and Live Dry-Run (v0.1.0)](#t-402-production-deployment-and-live-dry-run-v010) - `[high-priority]`
*   [T-403: Implement Database Backups & DR Recovery Routines](#t-403-implement-database-backups-and-dr-recovery-routines) - `[high-priority]`

---

## 🎫 Detailed Ticket Definitions

### Epic 0: Pre-Execution Guardrails & Hard Limits (Phase 0)

#### <a id="t-001-implement-pre-execution-sanity-checks"></a>T-001: Implement Pre-Execution Sanity Checks
*   **Epic:** Epic 0
*   **Labels:** `[security]` `[high-priority]` `[staging]`
*   **Owner:** Sam Chen (Dev)
*   **Estimated Hours:** 8 hours
*   **Priority:** Critical
*   **Description:** Inject a robust pre-execution verification layer directly into `/api/execute/swap` and core execution pathways to block transactions that fail basic economic, gas, or price checks.
*   **Implementation Steps:**
    1. Validate that the expected net swap yield is strictly greater than fee overhead (accounting for 0.25% DEX fee and local gas estimates).
    2. Enforce a strict slippage tolerance (cap standard trades at 1% slippage, volatile pairs at 3%).
    3. Perform dry-run gas estimates and reject if estimate is zero or exceeds 150 Gwei.
    4. Implement multi-source price consensus: fetch and cross-reference token prices from Chainlink/Pyth with a fallback to the DEX aggregator's own quote prior to trigger.
*   **Acceptance Criteria:** Any transaction that results in a projected net loss is blocked at the API level with a 400 response explaining the rule violated.

#### <a id="t-002-add-hardcoded-risk-controls-daily-caps-and-global-kill-switch"></a>T-002: Add Hardcoded Risk Controls (Daily Caps and Global Kill-Switch)
*   **Epic:** Epic 0
*   **Labels:** `[security]` `[high-priority]` `[staging]`
*   **Owner:** Sam Chen (Dev)
*   **Estimated Hours:** 12 hours
*   **Priority:** Critical
*   **Description:** Create hardcoded state controls and admin commands to enforce risk rules and automated spend limit controls both globally and per-bot.
*   **Implementation Steps:**
    1. Implement a 24-hour sliding-window spend tracker capping aggregate spending to 0.5 ETH per day (automated spend limit controls).
    2. Enforce maximum individual swap sizing to 0.05 ETH per trade.
    3. Create a forced position unwind and bot pausing trigger if a bot's real/unrealized loss exceeds 10% of configured capital.
    4. Implement `/api/admin/kill-switch` to immediately clear all active execution timers and halt bots. Expose this toggle with high contrast on the UI dashboard.
*   **Acceptance Criteria:** A simulated 11% loss halts the bot immediately, and triggering the global emergency stop halts all transaction requests globally in under 1 second.

---

### Epic 1: CI/CD Pipeline & Staging Isolation (Phase 1)

#### <a id="t-101-github-actions-mainnet-fork-integration-test"></a>T-101: GitHub Actions Mainnet-Fork Integration Test
*   **Epic:** Epic 1
*   **Labels:** `[high-priority]` `[staging]`
*   **Owner:** Alex Rivers (SRE)
*   **Estimated Hours:** 6 hours
*   **Priority:** High
*   **Description:** Enhance `.github/workflows/ci.yml` to automatically execute local network fork simulations of Base Mainnet transactions on every pull request.
*   **Implementation Steps:**
    1. Integrate the `scripts/fork-test.js` script into the pipeline.
    2. Configure environment fallback: tests run automatically only when `ALCHEMY_MAINNET_URL` or `INFURA_MAINNET_URL` is populated as a repository secret.
    3. Set up mock ERC-20 contract mocks (for WETH/USDC) to isolate read and call assertions.
*   **Acceptance Criteria:** CI successfully executes and passes the Base Mainnet contract assertions on pull requests when the RPC secret is present, and gracefully skips when missing.

#### <a id="t-102-setup-isolated-staging-render-service"></a>T-102: Setup Isolated Staging Render Service
*   **Epic:** Epic 1
*   **Labels:** `[high-priority]` `[staging]`
*   **Owner:** Alex Rivers (SRE)
*   **Estimated Hours:** 4 hours
*   **Priority:** High
*   **Description:** Establish `trade-arena-staging` on Render as a dedicated staging sandbox isolated from production resources.
*   **Implementation Steps:**
    1. Spin up a separate Web Service on Render with service ID map.
    2. Inject staging-specific environment variables (`STAGING_RPC_URL`, mock API keys, test contract targets).
    3. Ensure no database or persistence layers are shared between staging and production instances.
*   **Acceptance Criteria:** Staging environment is fully operational at `trade-arena-staging.onrender.com` with isolated credentials.

#### <a id="t-103-14-day-continuous-paper-trading-log-validation"></a>T-103: 14-Day Continuous Paper-Trading Log Validation
*   **Epic:** Epic 1
*   **Labels:** `[staging]`
*   **Owner:** Elena Vance (Sec) / Sam Chen (Dev)
*   **Estimated Hours:** 14 days (elapsed) / 8 hours active
*   **Priority:** Medium
*   **Description:** Maintain continuous paper-trading bot loops in the staging environment to evaluate performance stability, memory leaks, and exception frequency under live network feeds.
*   **Implementation Steps:**
    1. Run all strategies concurrently using live CoinGecko data.
    2. Setup logging hooks to flag unhandled exceptions, WebSocket disconnects, or delayed price updates.
    3. Extract daily metrics and compile a final summary report detailing hypothetical profits/losses, slippage, and cumulative fee rates.
*   **Acceptance Criteria:** Paper-trading executes continuously on staging for 14 calendar days with 100% uptime and zero unhandled server-side exceptions.

#### <a id="t-104-enable-automated-codeql-and-dependabot-scan-policies"></a>T-104: Enable Automated CodeQL & Dependabot Scan Policies
*   **Epic:** Epic 1
*   **Labels:** `[security]`
*   **Owner:** Elena Vance (Sec)
*   **Estimated Hours:** 4 hours
*   **Priority:** High
*   **Description:** Configure automated dependency updates and code scanning in the GitHub repository.
*   **Implementation Steps:**
    1. Add a `.github/dependabot.yml` config file scheduled for monthly analysis of npm/pnpm and GitHub Action configurations.
    2. Rely on GitHub's native default CodeQL setup to perform automated security scans.
*   **Acceptance Criteria:** Dependabot is active, and security scans run on all future PRs to catch vulnerabilities (e.g., XSS, prototype pollution, reentrancy).

---

### Epic 2: Secure Custody & Relayer Integration (Phase 2)

#### <a id="t-201-setup-gnosis-safe-multisig-and-relayer-contract-architecture"></a>T-201: Setup Gnosis Safe Multisig & Relayer Contract Architecture
*   **Epic:** Epic 2
*   **Labels:** `[security]` `[high-priority]`
*   **Owner:** Elena Vance (Sec) / Sam Chen (Dev)
*   **Estimated Hours:** 20 hours
*   **Priority:** Critical
*   **Description:** Decouple key custody from the backend. Deploy a Gnosis Safe 2-of-3 multisig wallet on Base Mainnet and interface it with an automated transaction relayer.
*   **Implementation Steps:**
    1. Deploy Gnosis Safe contract with three hardware-controlled keys as owners.
    2. Register and fund an account on an enterprise relayer network (e.g., Gelato, OpenZeppelin Defender).
    3. Configure custom smart contract validators to reject calls if target functions or destination contracts deviate from pre-approved trading scopes.
*   **Acceptance Criteria:** Render server initiates transactions via secure, authenticated relayer API payloads without storing any raw private signing keys.

#### <a id="t-205-integrate-hsm-and-secure-cloud-vault"></a>T-205: Integrate HSM and Secure Cloud Vault
*   **Epic:** Epic 2
*   **Labels:** `[security]` `[high-priority]`
*   **Owner:** Elena Vance (Sec)
*   **Estimated Hours:** 16 hours
*   **Priority:** Critical
*   **Description:** Setup integration with HashiCorp Vault or AWS KMS / CloudHSM for programmatic automated trading keys, supporting spend limit controls.
*   **Implementation Steps:**
    1. Provision and initialize a Secure Cloud KMS or HSM key vault instance.
    2. Build integration middleware in the Node.js backend using the KMS SDK to sign transactions on-demand without keeping keys in process memory.
    3. Configure tight IAM/access-control policies to reject signature operations unless specific pre-execution requirements (daily spend ceiling, pre-authorized DEX targets) are verified.
*   **Acceptance Criteria:** Mainnet-fork tests can successfully invoke KMS transit sign APIs to execute trade transactions, ensuring keys are isolated inside the secure Vault.

#### <a id="t-202-pre-transaction-alchemytenderly-simulations"></a>T-202: Pre-Transaction Alchemy/Tenderly Simulations
*   **Epic:** Epic 2
*   **Labels:** `[security]` `[high-priority]`
*   **Owner:** Sam Chen (Dev)
*   **Estimated Hours:** 10 hours
*   **Priority:** Critical
*   **Description:** Interface the transaction engine with simulation APIs to run on-chain simulations before broadcasting payloads.
*   **Implementation Steps:**
    1. Integrate the Alchemy Transact API (`alchemy_simulateExecution`) or Tenderly simulation API.
    2. If a transaction simulation reverts or projects negative net yield, abort execution immediately and flag SRE.
*   **Acceptance Criteria:** Every live payout or swap transaction executes an on-chain simulation in a sandbox, and automatically halts execution if the simulation fails.

#### <a id="t-203-implement-resilient-nonce-and-retry-backoff-system"></a>T-203: Implement Resilient Nonce & Retry Backoff System
*   **Epic:** Epic 2
*   **Labels:** `[high-priority]`
*   **Owner:** Sam Chen (Dev)
*   **Estimated Hours:** 8 hours
*   **Priority:** High
*   **Description:** Establish a resilient in-memory transaction queuing and gas escalation service.
*   **Implementation Steps:**
    1. Create a sequential FIFO transaction queue per active address to avoid nonce collisions.
    2. Add automated transaction replacement: if a transaction is unconfirmed after 3 blocks, re-sign and broadcast with a 20% bump in gas fees.
    3. Wrap external RPC calls in an exponential backoff wrapper with randomized jitter.
*   **Acceptance Criteria:** Unconfirmed transactions are automatically bumped and replaced without manual intervention, resolving starvation under network congestion.

#### <a id="t-204-flashbots-and-private-rpc-bundle-integration"></a>T-204: Flashbots & Private RPC Bundle Integration
*   **Epic:** Epic 2
*   **Labels:** `[security]`
*   **Owner:** Elena Vance (Sec)
*   **Estimated Hours:** 8 hours
*   **Priority:** Medium
*   **Description:** Implement support for Flashbots / private RPC bundlers to guard high-value transactions against frontrunning.
*   **Implementation Steps:**
    1. Integrate the Flashbots Ethers Provider Bundle.
    2. Redirect swaps to private block builder endpoints.
    3. Document latency trade-offs (1-2 block delay) for security vs. speed.
*   **Acceptance Criteria:** High-value transactions are routed through private builder channels, avoiding public mempools.

---

### Epic 3: Audits & Compliance (Phase 2)

#### <a id="t-301-smart-contract-code-freeze-and-external-audit"></a>T-301: Smart Contract Code Freeze & External Audit
*   **Epic:** Epic 3
*   **Labels:** `[security]` `[high-priority]`
*   **Owner:** Elena Vance (Sec)
*   **Estimated Hours:** 40 hours
*   **Priority:** High
*   **Description:** Prepare codebase for final external smart contract and infrastructure audits.
*   **Implementation Steps:**
    1. Enforce strict code freeze on Solidity contracts and payout modules.
    2. Coordinate with selected auditing firm (e.g., Spearbit, Halborn, or Sherlock).
    3. Implement and verify code fixes for any vulnerability identified.
*   **Acceptance Criteria:** External audit report issued with zero unresolved "Critical" or "High" security findings.

#### <a id="t-302-legal-framework and-non-custodial-compliance-check"></a>T-302: Legal Framework and Non-Custodial Compliance Check
*   **Epic:** Epic 3
*   **Labels:** `[security]` `[high-priority]`
*   **Owner:** Jordan Cruz (Legal)
*   **Estimated Hours:** 15 hours
*   **Priority:** High
*   **Description:** Draft user agreements, privacy policies, and configure access restrictions to comply with local financial frameworks.
*   **Implementation Steps:**
    1. Verify non-custodial structure of the platform (users hold keys via Privy/MetaMask).
    2. Draft clear Terms of Service highlighting trading and smart contract risks.
    3. Configure geo-IP blocking middleware to restrict access from sanctioned or prohibited jurisdictions.
*   **Acceptance Criteria:** Terms of Service published on the live app, and geo-IP blocking is verified active for restricted regions.

---

### Epic 4: Production Rollout, Monitoring & Game Days (Phase 3)

#### <a id="t-401-configure-prometheus-and-grafana-dashboards"></a>T-401: Configure Prometheus & Grafana Dashboards
*   **Epic:** Epic 4
*   **Labels:** `[high-priority]`
*   **Owner:** Alex Rivers (SRE)
*   **Estimated Hours:** 12 hours
*   **Priority:** High
*   **Description:** Implement real-time SRE metrics tracking, logging pipelines, and on-call paging integration.
*   **Implementation Steps:**
    1. Expose a secure Prometheus `/metrics` endpoint on the Express server tracking: P&L per bot, failed transaction rates, pending transaction count, wallet/relayer balances, and RPC latency.
    2. Build Grafana dashboards visualize metrics.
    3. Connect PagerDuty/Slack notification webhooks to alert operators on failures (e.g., wallet balance < 0.1 ETH or consecutive tx reverts).
*   **Acceptance Criteria:** Dashboard is live, and simulated alarm triggers deliver on-call alerts to Slack and SRE within 10 seconds.

#### <a id="t-402-production-deployment-and-live-dry-run-v010"></a>T-402: Production Deployment and Live Dry-Run (v0.1.0)
*   **Epic:** Epic 4
*   **Labels:** `[high-priority]`
*   **Owner:** Alex Rivers (SRE) / Sam Chen (Dev)
*   **Estimated Hours:** 8 hours
*   **Priority:** Critical
*   **Description:** Tag official release `v0.1.0` and deploy to the production Render environment, followed by live "smoke test" execution with real capital.
*   **Implementation Steps:**
    1. Tag git repository branch as release version `v0.1.0`.
    2. Update production environment variables on Render with mainnet secrets.
    3. Deploy and execute small-volume smoke tests (e.g., 0.005 ETH swap).
    4. Execute "Game Day" drills: simulate and trigger the "Pause all bots" and "Drain funds" runbooks to verify active operational state.
*   **Acceptance Criteria:** Release `v0.1.0` is active on mainnet, smoke trades successfully execute, and emergency stop and fund drainage drills are successfully executed.

#### <a id="t-403-implement-database-backups-and-dr-recovery-routines"></a>T-403: Implement Database Backups & DR Recovery Routines
*   **Epic:** Epic 4
*   **Labels:** `[high-priority]`
*   **Owner:** Alex Rivers (SRE)
*   **Estimated Hours:** 6 hours
*   **Priority:** High
*   **Description:** Set up database backup pipelines and document disaster recovery restoration paths.
*   **Implementation Steps:**
    1. Schedule automated nightly backups of SQLite database files (`users.json`, etc.) with 30-day retention.
    2. Document disaster recovery restoration guide.
    3. Establish 90-day keys/secrets rotation schedule.
*   **Acceptance Criteria:** Nightly backups are active, and a restore simulation runs successfully on staging.
