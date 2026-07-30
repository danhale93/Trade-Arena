# 🛡️ Trade Arena — Mainnet Readiness & Live Operations Project Plan

This document serves as the authoritative, phased project plan and technical architecture blueprint required to transition **Trade Arena** from staging/simulation to a highly secure, audited, and resilient live on-chain trading platform on **Base Mainnet**.

---

## 📌 Executive Summary
*   **Target Network:** Base Mainnet (Chain ID: `8453`)
*   **Security Principle:** **Safety-First / Zero-Trust Automation**. No live-money automated trade execution will be enabled until multi-signature controls, transaction simulations, rigorous smart contract/infrastructure audits, and dynamic circuit breakers are fully implemented, verified, and signed off.
*   **Key Paradigm Shift:** Moving away from hot-wallet automated keys to a **hybrid relayer + secure vault/multisig paradigm**, protecting critical user and protocol assets from compromise.

---

## 1. Phased Project Plan & Milestones

The project is structured into four distinct, logical phases designed to de-risk the deployment progressively.

```
┌────────────────────────┐     ┌────────────────────────┐     ┌────────────────────────┐     ┌────────────────────────┐
│        PHASE 0         │     │        PHASE 1         │     │        PHASE 2         │     │        PHASE 3         │
│    Immediate Safety    │ ──> │ Staging, Fork Testing  │ ──> │   Secure Signing &     │ ──> │   Production Rollout   │
│       & Controls       │     │     & Paper Trading    │     │    External Audits     │     │      & Go-Live         │
└────────────────────────┘     └────────────────────────┘     └────────────────────────┘     └────────────────────────┘
```

### Phase 0: Immediate Safety, Pre-Execution Guardrails, & Risk Controls
*   **Focus:** Harden the existing Node.js/Express backend (`server.js`) and trading engine bundle (`public/trading-bundle.js`) with deterministic execution limits, simulation steps, and local validation.
*   **Milestone:** All bots running locally or in dev modes are governed by hard limits. Pre-execution checks prevent garbage transactions from being signed.
*   **Target Date:** Week 1

### Phase 1: Staging Environment, Mainnet-Fork Testing, & Paper-Trading
*   **Focus:** Establish an isolated staging environment (`trade-arena-staging.onrender.com`), configure continuous integration pipelines, and initiate a continuous dry-run period.
*   **Milestone:** CI/CD automatically runs unit and mainnet-fork simulation tests on every Pull Request. Staging environment initiates a 14-day continuous paper-trading campaign with zero unhandled exceptions.
*   **Target Date:** Weeks 2-3

### Phase 2: Production-Grade Signing, Relayer Infrastructure, & Audits
*   **Focus:** Decouple transaction signing from the application server. Setup Gnosis Safe multisig custody combined with a secure automated relayer (e.g., Gelato, OpenZeppelin Defender, or Biconomy) and initiate external reviews.
*   **Milestone:** Secure signing architecture deployed to staging. Core smart contracts (e.g., payout contracts, flash loan execution contracts) submitted to third-party auditors.
*   **Target Date:** Weeks 4-6

### Phase 3: Production Rollout, Incident Response Dry-Runs, & Go-Live
*   **Focus:** Launch the production application (`trade-arena-app.onrender.com`), execute live-money dry runs with tiny capital caps, perform "game day" disaster simulations (e.g., global kill-switch triggers), and finalize cutover.
*   **Milestone:** Stable, live mainnet trading active under a strict 0.1 ETH global loss ceiling. Automated monitoring dashboards fully integrated with on-call alerting.
*   **Target Date:** Week 7

---

## 2. Epics & Ticket Breakdown

Below is the concrete, ticket-sized task breakdown assigned to key roles: SRE (Site Reliability Engineer), Dev (Core Engineer), Sec (Security Architect), and Ops/Legal.

### Epic 0: Pre-Execution Guardrails & Hard Limits (Phase 0)

#### Ticket T-001: Implement Pre-Execution Sanity Checks
*   **Description:** Inject a pre-execution validation layer in `/api/execute/swap` and inside the trading engine's execution loops.
*   **Implementation Steps:**
    1.  Validate that `min-profit-after-fees` is positive (accounting for 0.25% pool fees and estimated Gas).
    2.  Check `slippage` is explicitly defined and capped (e.g., max 1% for standard pairs, 3% for highly volatile pools).
    3.  Verify gas estimate is non-zero and falls under a sane gas ceiling (e.g., `gasPrice < 150 Gwei` on Base).
    4.  Compare incoming DEX token prices against a multi-feed price sanity oracle (Chainlink/Pyth SDKs) before initiating swaps.
*   **Owner:** Dev (Sam Chen)
*   **Estimate:** 8 hours
*   **Priority:** High
*   **Dependencies:** None

#### Ticket T-002: Add Hardcoded Risk Controls (Daily Caps & Global Kill-Switch)
*   **Description:** Introduce global and per-bot limits in memory and persisting in database configurations.
*   **Implementation Steps:**
    1.  Create a global sliding-window daily spend cap (maximum 0.5 ETH per 24h across all active bots).
    2.  Enforce a maximum single-trade size (e.g., capped at 0.05 ETH).
    3.  Define forced unwind thresholds: if a bot's loss exceeds 10% of its initial capital, trigger immediate position closure and bot pausing.
    4.  Build a `/api/admin/kill-switch` endpoint that pauses all active loops immediately. Implement UI controls displaying these limits.
*   **Owner:** Dev (Sam Chen)
*   **Estimate:** 12 hours
*   **Priority:** High
*   **Dependencies:** None

---

### Epic 1: CI/CD Pipeline & Staging Isolation (Phase 1)

#### Ticket T-101: GitHub Actions Mainnet-Fork Integration Test
*   **Description:** Configure `.github/workflows/ci.yml` to run advanced mainnet-fork integration tests using Hardhat or Anvil when secrets are available.
*   **Implementation Steps:**
    1.  Integrate `scripts/rpc-check.js` and `scripts/fork-test.js` into the CI suite.
    2.  Configure conditional execution: only run fork tests if `ALCHEMY_MAINNET_URL` is set in the environment.
    3.  Mock external ERC-20 tokens (USDC, WETH) to isolate test coverage.
*   **Owner:** SRE (Alex Rivers)
*   **Estimate:** 6 hours
*   **Priority:** High
*   **Dependencies:** None

#### Ticket T-102: Setup Isolated Staging Render Service
*   **Description:** Spin up `trade-arena-staging` on Render, completely isolated from production.
*   **Implementation Steps:**
    1.  Create the Render web service `trade-arena-staging`.
    2.  Configure secrets via Render console (using separate RPC endpoints and mock keys).
    3.  Map the staging service ID to `RENDER_SERVICE_ID_STAGING` for automated dev deploys.
*   **Owner:** SRE (Alex Rivers)
*   **Estimate:** 4 hours
*   **Priority:** Medium
*   **Dependencies:** None

#### Ticket T-103: 14-Day Continuous Paper-Trading Log Validation
*   **Description:** Run all trading bots in dry-run/paper-trading mode on staging to verify system stability.
*   **Implementation Steps:**
    1.  Set up bots on staging utilizing real CoinGecko price tickers.
    2.  Write a script to aggregate performance logs and look for unhandled exceptions or WebSocket dropouts.
    3.  Generate a 14-day dry-run summary report tracking hypothetical P&L, slippage errors, and gas cost projections.
*   **Owner:** Ops (Elena Vance)
*   **Estimate:** 14 days (elapsed time) / 8 hours (active setup/reporting)
*   **Priority:** Medium
*   **Dependencies:** T-102

---

### Epic 2: Secure Custody & Relayer Integration (Phase 2)

#### Ticket T-201: Setup Gnosis Safe Multisig & Relayer Contract Architecture
*   **Description:** Eliminate single-point-of-failure hot keys from the server.
*   **Implementation Steps:**
    1.  Deploy a Gnosis Safe multisig (2-of-3 signature scheme) on Base Mainnet.
    2.  Integrate a relayer service (e.g., Gelato or OpenZeppelin Defender Relayer) to submit transactions.
    3.  Write the backend client to dispatch transaction payloads to the relayer. The relayer forwards transactions to the destination smart contract, charging gas fees to a pre-funded relayer balance.
*   **Owner:** Sec (Elena Vance) / Dev (Sam Chen)
*   **Estimate:** 20 hours
*   **Priority:** High
*   **Dependencies:** T-001

#### Ticket T-202: Pre-Transaction Alchemy/Tenderly Simulations
*   **Description:** Ensure every transaction is simulated in a sandbox prior to relayer submission.
*   **Implementation Steps:**
    1.  Integrate the Alchemy Transact API (`alchemy_simulateExecution`) or Tenderly Simulation API inside `payoutService.js` and execution loops.
    2.  If the simulation results in a revert or negative net value, block execution and trigger a high-severity log entry.
*   **Owner:** Dev (Sam Chen)
*   **Estimate:** 10 hours
*   **Priority:** High
*   **Dependencies:** T-201

---

### Epic 3: Audits & Compliance (Phase 2)

#### Ticket T-301: Smart Contract Code Freeze & External Audit
*   **Description:** Submit Trade Arena smart contracts (including Aave flash loan integration and payout managers) for professional audits.
*   **Implementation Steps:**
    1.  Prepare contract repository with high test coverage (>95% line coverage).
    2.  Coordinate with selected auditing firm (e.g., Trail of Bits, Halborn, or Spearbit).
    3.  Address and patch all vulnerabilities identified in the draft audit report.
*   **Owner:** Sec (Elena Vance) / SRE (Alex Rivers)
*   **Estimate:** 40 hours
*   **Priority:** High
*   **Dependencies:** None

#### Ticket T-302: Legal Framework and Non-Custodial Compliance Check
*   **Description:** Verify the platform complies with global KYC/AML laws depending on custody style.
*   **Implementation Steps:**
    1.  Verify the application architecture remains strictly non-custodial (users authenticate via Privy/MetaMask and retain ultimate key authority; backend only acts as an authorized delegator).
    2.  Draft terms of service explicitly outlining risks, lack of financial advice, and regional restrictions (IP blocking for sanctioned jurisdictions).
*   **Owner:** Legal (Jordan Cruz)
*   **Estimate:** 15 hours
*   **Priority:** High
*   **Dependencies:** None

---

### Epic 4: Production Rollout, Monitoring & Game Days (Phase 3)

#### Ticket T-401: Configure Prometheus & Grafana Dashboards
*   **Description:** Implement real-time monitoring and alerting for bot performance and system health.
*   **Implementation Steps:**
    1.  Expose an `/actuator/prometheus` or `/metrics` endpoint in `server.js`.
    2.  Track metrics: P&L per bot, gas spend, pending transactions, failed transaction rate, RPC latency, and wallet balances.
    3.  Set up Grafana dashboards and link Slack/PagerDuty hooks for alerts (e.g., alert if wallet balance < 0.05 ETH or error rate > 5%).
*   **Owner:** SRE (Alex Rivers)
*   **Estimate:** 12 hours
*   **Priority:** High
*   **Dependencies:** T-102

#### Ticket T-402: Production Deployment and Live Dry-Run (v0.1.0)
*   **Description:** Cut over to production environment with strict, conservative parameters.
*   **Implementation Steps:**
    1.  Configure production Render service with live, production-grade secrets.
    2.  Run live dry-run checks with minimal capital (e.g., 0.01 ETH).
    3.  Execute a "Game Day" test: manually trigger the "Pause all bots" and "Drain funds" runbooks to verify on-chain reaction times.
*   **Owner:** Ops (Elena Vance) / SRE (Alex Rivers)
*   **Estimate:** 8 hours
*   **Priority:** High
*   **Dependencies:** T-201, T-401

---

## 3. Acceptance Criteria

| Milestone | Deliverable | Acceptance Criteria (Definition of Done) |
|---|---|---|
| **Phase 0** | **Pre-Execution Guardrails** | 1. Any trade swap that would result in a net loss (including gas + 0.25% fee) is blocked by the backend with an explicit error.<br>2. Slippage over 1% on major pools is blocked unless overridden.<br>3. Daily global spend cap (0.5 ETH) is successfully verified by unit tests. |
| **Phase 1** | **Mainnet-Fork Tests in CI** | 1. CI runs `scripts/fork-test.js` successfully when `ALCHEMY_MAINNET_URL` is present.<br>2. PRs are blocked from merging if any tests fail.<br>3. `trade-arena-staging` is fully deployed with separate mock credentials. |
| **Phase 1** | **14-Day Paper-Trading Run** | 1. Staging bots run continuously for 14 calendar days without a single critical crash/unhandled exception.<br>2. A complete spreadsheet/report is exported detailing simulated arbitrage and grid outcomes. |
| **Phase 2** | **Gnosis Safe & Relayer Signing** | 1. Gnosis Safe 2-of-3 multisig deployed to Base Mainnet.<br>2. The application server initiates transactions via the secure relayer without holding or knowing the safe's signing private keys.<br>3. Alchemy/Tenderly simulation runs successfully before every transaction. |
| **Phase 2** | **External Security Audit** | 1. Smart contracts audited by a reputable third-party firm.<br>2. Zero Critical or High-severity issues remain unpatched. |
| **Phase 3** | **Monitoring & Alerting Setup** | 1. Live dashboards display real-time wallet balances and gas burn rate.<br>2. Slack and PagerDuty deliver test alerts within < 10 seconds of simulated failure trigger. |
| **Phase 3** | **Cutover & Go-Live (v0.1.0)** | 1. Release tagged as `v0.1.0`.<br>2. Production environment successfully executes a real trade swap with capital <= 0.01 ETH.<br>3. Emergency stop is triggered, successfully halting all execution in < 1 second. |

---

## 4. Security & Signing Design

Storing private keys on a cloud application server (like Render) is a major attack vector. Compromise of the server would mean a total drain of all capital.

### Recommended Architecture: Non-Custodial Multisig + Relayer
Instead of keeping a raw private key on Render, we use a decentralized transaction execution model:

```
┌─────────────────┐               ┌─────────────────┐               ┌──────────────────┐
│   Trade Arena   │  (Simulates)  │ OpenZeppelin /  │ (Dispatches)  │   Gnosis Safe    │
│ Backend Server  │ ------------> │ Gelato Relayer  │ ------------> │ 2-of-3 Multisig  │
│    (Render)     │               │  (Gas Sponsor)  │               │ (Execution Owner)│
└─────────────────┘               └─────────────────┘               └──────────────────┘
```

1.  **Gnosis Safe (Safe Contract):** Holds the principal trading capital. Authorized owners are separate offline keys (e.g., Ledger/Trezor devices held by the team).
2.  **Relayer Service:** We register a relayer (such as Gelato or OpenZeppelin Defender). The relayer has permission to call a specialized execution function on our smart contracts, *but only under strict conditions* (e.g., checked inside our smart contracts: verified target DEX, authorized assets, limited volume).
3.  **No Server Keys:** The Render server does not hold the master safe private key. If the server is hacked, the attacker cannot withdraw funds directly because the safe contracts only accept transactions that satisfy strict on-chain validation limits.

### Alternatives Considered

*   **Cloud HSM / HashiCorp Vault:** Keep keys inside a cloud HSM (AWS CloudHSM or Google KMS) and allow the backend to sign transactions programmatically via IAM.
    *   *Pros:* Complete automation support.
    *   *Cons:* Server compromise can still request unlimited signatures unless strict rate-limiting rules are configured inside the Vault policy.
*   **Gnosis Safe + Relayer (Recommended):** Use a multi-signature safe as the capital treasury, and authorize a dedicated Smart Contract Executor via a Relayer.
    *   *Pros:* Capital is kept completely safe inside a multi-signature wallet. Automated execution is restricted to a custom router contract containing strict safety rules.

---

### Nonce Management & Retry Backoff Strategy

To prevent transaction failures due to underpriced gas or out-of-order nonces, the backend uses a robust queue system:
1. **FIFO Queue:** All transactions are routed through an in-memory queue per hot/relayer account to maintain transaction order.
2. **Dynamic Gas Escalation:** If a transaction remains unconfirmed for more than 3 blocks, a replacement transaction is dispatched with the same nonce and a 20% increase in `maxFeePerGas` and `maxPriorityFeePerGas`.
3. **Exponential Backoff:** If the RPC fails with a 429 (rate-limit) or 503 (server error), the backend retries with an exponential backoff formula: $t_{wait} = 2^{attempt} \times 500 \text{ ms} + \text{jitter}$.

---

### Proof-of-Concept Integration Code (Ethers.js + Safe Protocol)

Below is the design pattern for queuing and submitting transactions to the Relayer rather than signing locally:

```javascript
// services/payouts/secureSigner.js
const { ethers } = require('ethers');
const axios = require('axios');

async function executeSecureTransaction(targetContractAddress, encodedData, estimatedGasLimit) {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

  // 1. Pre-execution Simulation via Tenderly/Alchemy
  const isSimulationOk = await simulateTransactionOnFork(targetContractAddress, encodedData);
  if (!isSimulationOk) {
    throw new Error("Transaction simulation failed on-chain. Aborting execution.");
  }

  // 2. Dispatch payload to Gelato Relayer instead of signing locally with a master key
  console.log("Dispatching transaction payload to secure relayer...");
  const relayerUrl = `https://api.gelato.digital/tasks/v2`;

  const response = await axios.post(relayerUrl, {
    chainId: 8453, // Base Mainnet
    target: targetContractAddress,
    data: encodedData,
    gasLimit: estimatedGasLimit.toString(),
    retries: 3
  }, {
    headers: { 'Authorization': `Bearer ${process.env.RELAYER_API_KEY}` }
  });

  if (response.status !== 200) {
    throw new Error(`Relayer failed to queue transaction: ${response.data.message}`);
  }

  console.log(`Transaction queued successfully. Relayer Task ID: ${response.data.taskId}`);
  return response.data.taskId;
}

async function simulateTransactionOnFork(target, data) {
  try {
    const response = await axios.post(
      `https://dashboard.tenderly.co/api/v1/account/me/project/project-id/simulate`,
      {
        network_id: "8453",
        from: process.env.RELAYER_EXECUTOR_ADDRESS,
        to: target,
        input: data,
        gas: 8000000
      },
      { headers: { 'X-Access-Key': process.env.TENDERLY_API_KEY } }
    );
    return response.data.transaction.status === true;
  } catch (error) {
    console.error("Simulation error:", error.message);
    return false;
  }
}

module.exports = { executeSecureTransaction };
```

---

## 5. CI/CD & Deploy Policy

We enforce strict segregation between staging and production pipelines in GitHub Actions.

### Secret Management Configuration

Add these variables *only* inside **GitHub Settings → Secrets → Actions**:

*   `ALCHEMY_MAINNET_URL` (or `INFURA_MAINNET_URL`) - Used only for fork testing inside CI.
*   `RENDER_API_KEY` - Used by Render deploy scripts to trigger service builds.
*   `RENDER_SERVICE_ID` - Production service identifier.
*   `RENDER_SERVICE_ID_STAGING` - Staging service identifier.
*   ❌ **SECURITY POLICY RULE:** **NEVER** add the Gnosis Safe owner keys or private keys representing actual funds to GitHub Secrets.

### Segmentation Flow

```
   [ Code Push to main ]
             │
             ▼
   ┌───────────────────┐
   │ CI Pipeline Runs  │  <-- Runs unit tests, linter, & Mainnet-Fork tests
   └───────────────────┘
             │
             ▼ (Success)
   ┌───────────────────┐
   │ Deploy to Staging │  <-- Automatic CD trigger to Render (trade-arena-staging)
   └───────────────────┘
             │
             ▼ (Manual Verification & Approval required)
   ┌───────────────────┐
   │ Deploy to Prod    │  <-- Manual trigger (workflow_dispatch) with strict SRE reviewer approval
   └───────────────────┘
```

---

## 6. Testing Strategy

We follow a multi-layered testing pyramid to guarantee mainnet safety.

```
┌─────────────────────────────────────────┐
│              Simulation                 │  <-- Tenderly sandbox, live transaction Dry Runs
├─────────────────────────────────────────┤
│             Mainnet Fork                │  <-- Anvil/Hardhat network fork tests
├─────────────────────────────────────────┤
│             Integration                │  <-- Express API routes & database state tests
├─────────────────────────────────────────┤
│                 Unit                    │  <-- Math formulas, Kelly Criterion, RSI/SMA indicators
└─────────────────────────────────────────┘
```

1.  **Unit Tests:** Verify indicator calculations (RSI, SMA, EWMA) in `public/crucible-real-trading.js` and `strategies/core/sma-crossover.js`. Run on every push.
2.  **Integration Tests:** Verify that database states, rate limiters, user log persistence, and API endpoints run correctly. Run on every push.
3.  **Mainnet-Fork Tests:** Spin up a local Fork of Base Mainnet (block pinning via Alchemy) to test real flash loan transactions against active Uniswap/Aave liquidity. Run automatically in CI on pull requests when `ALCHEMY_MAINNET_URL` is set.
4.  **Simulation & Paper-Trading:** Execute identical logic against a read-only staging node for 14 calendar days, recording virtual profits/losses, slippage, and latency reports.

---

## 7. Monitoring & Observability Plan

A real-time observability stack is vital to capture anomalies before they turn into losses.

### Target Metrics
*   **P&L tracking:** Continuous net asset value (NAV) calculations across active bots.
*   **Failed transaction rate:** Alarm triggers if more than 2 consecutive transactions revert on-chain.
*   **RPC Latency:** Real-time delay of block notifications.
*   **Wallet / Relayer Balance:** Monitored continuously. Alarm if relayer balance drops under `0.1 ETH`.
*   **Gas Spent:** Daily aggregate spending tracking to prevent runaway loop depletion.

### Observability Stack Design

```
   [ Application Logs ] ──> [ Papertrail / Datadog ] ──> Log Anomalies
            │
            ▼
   [ Prometheus Metrics ] ──> [ Grafana Dashboard ] ──> Slack & PagerDuty Alerting
```

*   **Centralized Logs:** Express logs and on-chain receipts are piped from Render directly to Papertrail or Datadog.
*   **Dashboard Visualizations:** Grafana displays live panels showing active bots, transaction queues, and network status.
*   **Alert Escalation:** Integration with PagerDuty for "Sev 1" alerts (e.g., Contract Execution Reverted, Loss Limit Exceeded).

---

## 8. Incident Response & Runbooks

In a crisis, clear instructions save money. These step-by-step procedures must be practiced before mainnet go-live.

### Runbook A: Pause All Bots ("Global Kill-Switch")
*   **Trigger Condition:** Sudden market crash, unexpected trade execution failures, API key leak, or suspicious exploit behavior.
*   **Procedure:**
    1.  Authenticate to the admin dashboard and click the high-visibility global Emergency Stop button.
    2.  Alternatively, call the backend directly using your terminal:
        ```bash
        curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" https://trade-arena-app.onrender.com/api/admin/kill-switch
        ```
    3.  Verify in the dashboard or logs that all polling intervals (`setInterval`) and bot state arrays are set to `paused`.

### Runbook B: Emergency Fund Drain
*   **Trigger Condition:** Exploit detected on-chain, smart contract vulnerability identified, or backend server compromise.
*   **Procedure:**
    1.  Access the Gnosis Safe interface (`app.safe.global`) using the owner hardware wallets.
    2.  Create a transaction to transfer the entire balance of ETH and ERC-20 tokens (USDC, WETH) from the Safe Address to the pre-configured Secure Cold Wallet address.
    3.  Confirm transaction on two hardware wallets.
    4.  Verify balance reduction on the staging/production trackers to confirm the assets are safe.

### Runbook C: Respond to Exploit / Node Compromise
*   **Trigger Condition:** Unexpected external transaction signatures detected, database or UI showing unauthorized actions, or anomalous gas spikes indicating a hot-wallet leak.
*   **Procedure:**
    1.  Trigger Runbook A immediately (Global Kill-Switch).
    2.  Initiate Runbook B to transfer all remaining treasury funds to the secure cold wallet.
    3.  Shut down the production Render instance completely to block further server-side api requests:
        ```bash
        curl -X POST -H "Authorization: Bearer $RENDER_API_KEY" https://api.render.com/v1/services/$RENDER_SERVICE_ID/suspend
        ```
    4.  Revoke all environment secrets and regenerate API keys (e.g., Alchemy keys, CoinGecko tokens).
    5.  Collect and archive server logs for forensic auditing.

### Escalation Contact Matrix

| Team Member | Role | Escalation Duty | Contact Info |
|---|---|---|---|
| **Alex Rivers** | Infrastructure / SRE | Cloud infrastructure, node configuration, API secrets | +1 (555) 019-2831 (PagerDuty) |
| **Sam Chen** | Lead Developer | Core trading loops, bot strategies, code fixes | +1 (555) 019-2832 |
| **Elena Vance** | Security Architect | Gnosis Safe configuration, smart contracts, audits | +1 (555) 019-2833 |
| **Jordan Cruz** | Legal / Compliance | Regulatory status, legal checkpoints | legal@tradearena.com |

---

## 9. Legal & Compliance Plan

To safely operate, the platform must navigate the regulatory landscape.

1.  **Custodial vs Non-Custodial Verification:**
    *   **Decision:** The platform must remain strictly **non-custodial**. The user's browser (Privy/MetaMask) signs transactions directly, or authorizes the backend relayer *only* for specific pre-approved trading actions. We never hold or store user private keys on the backend.
2.  **KYC/AML Requirements:**
    *   Consult legal counsel (Jordan Cruz) regarding potential requirements in different jurisdictions.
    *   Implement IP-based geo-blocking on the frontend to restrict access from restricted areas (e.g., sanctioned countries, or specific regions with strict retail derivative laws).
3.  **Auditors & Pricing:**
    *   *Recommended Auditors:* Halborn, Spearbit, or Sherlock (crowdsourced audit for cost-efficiency).
    *   *Estimated Budget:* $15,000 - $35,000.
    *   *Timeline:* 3-4 weeks.

---

## 10. Production Rollout & Release Gating

### Release Tagging Strategy
*   We will adopt **Semantic Versioning** (`vMajor.Minor.Patch`).
*   The first mainnet release is designated as **`v0.1.0`**.
*   All future releases require a GitHub Release Tag, auto-generating a changelog of merged PRs.

### Cutover Checklist (Go-Live Day)
1.  [ ] Verify all Phase 0 risk controls and pre-execution checks are active.
2.  [ ] Verify 14-day paper-trading run ended with zero unexpected crashes.
3.  [ ] Deploy final audited smart contracts to Base Mainnet.
4.  [ ] Initialize Gnosis Safe on Base Mainnet and fund with standard liquidity.
5.  [ ] Configure production secrets in Render (`trade-arena-app`).
6.  [ ] Trigger production build.
7.  [ ] Conduct real-money "live-smoke" transaction (swap 0.005 ETH for USDC).
8.  [ ] Test Emergency Stop (Runbook A) in production.
9.  [ ] Set live-money production bots to active under a strict 0.05 ETH per-bot limit.

---

## 11. Prioritized Risk Register (Top 10 Risks)

| Risk | Impact | Likelihood | Mitigation Strategy |
|---|---|---|---|
| **1. Application Server Compromise** | Critical | Medium | Decouple signing keys from Render. Use Gnosis Safe + secure relayer. |
| **2. Flash Loan Revert Loss** | High | High | Pre-simulate every transaction via Tenderly. Halt if simulation fails. |
| **3. Sandwich Attacks (MEV)** | High | High | Use private RPC relays (like Flashbots or MEV-Share) for sensitive transactions to avoid the public mempool. |
| **4. External API Rate Limits (429)** | Medium | High | Implement local in-memory caching and graceful backoffs with jitter on API calls. |
| **5. Slippage & Frontrunning** | High | Medium | Enforce strict max-slippage caps on-chain and inside execution loops. |
| **6. Runaway Bot Loop (Gas Drain)** | High | Low | Implement daily global spending caps and gas rate limiters. |
| **7. Price Oracle Manipulation** | Critical | Low | Use multi-feed aggregator prices (Chainlink + Pyth) instead of single DEX spot prices. |
| **8. Database Lock / Race Conditions** | Medium | Medium | Migrate from single-file JSON storage (`users.json`) to SQLite/PostgreSQL. |
| **9. Regulatory Crackdown** | High | Low | Explicit Non-Custodial design + Terms of Service + strict Geo-blocking. |
| **10. Third-Party Smart Contract Hack** | Critical | Low | Limit exposure per protocol. Diversify liquidity across Uniswap, Sushi, and Curve. |

---

## 12. Operational Timelines

### One-Week Timeline (Immediate Actions)

```
Day 1-2: Epic 0 Core Implementation (Pre-execution checks, daily caps, global kill-switch).
Day 3-4: CI/CD enhancements (GitHub secrets setup, staging Render creation, fork-test workflows).
Day 5:   Deploy code to Staging environment and launch 14-day paper-trading dry run.
```

*   **Deliverable:** Pre-execution safety code complete and Staging dry run successfully launched.
*   **Owner:** Dev (Sam Chen) / SRE (Alex Rivers)

### One-Month Timeline (Medium-Term Actions)

```
Week 2-3: Complete continuous paper-trading, resolve logging anomalies, and optimize RPC rates.
Week 3:   Initiate smart contract security audit with external partners.
Week 4:   Deploy Gnosis Safe multisig & secure Gelato relayer signing interface on staging.
```

*   **Deliverable:** 14-day dry-run performance report; external audit draft completed; secure multisig/relayer interface verified.
*   **Owner:** Sec (Elena Vance) / SRE (Alex Rivers) / Dev (Sam Chen)

---

## 13. Backups & Disaster Recovery (DR) Plan

To prevent data loss and ensure rapid service restoration in the event of hardware or host provider failures:
1. **DB Backups Schedule:** For SQLite or PostgreSQL databases on Render/AWS, configure automated nightly snapshots retained for 30 calendar days.
2. **Backup Integrity Verification:** Run weekly automated restore simulation scripts in the staging pipeline to verify backup viability.
3. **Secrets Rotation Policy:** Force rotate all system API keys and secrets every 90 days, or immediately following any team credential change.

---

## 14. Meeting Proposal & Kickoff

*   **Objective:** Finalize priorities, assign tasks, and establish exact budget caps for audits/gas.
*   **Duration:** 45 minutes.
*   **Earliest Available Dates:**
    *   Option A: Monday, March 23, 2026 - 10:00 AM UTC
    *   Option B: Tuesday, March 24, 2026 - 2:00 PM UTC
*   **Attendees:** Alex Rivers (SRE), Sam Chen (Lead Dev), Elena Vance (Sec), Jordan Cruz (Legal), danhale93 (Stakeholder).

---

## 15. Recommended Hires & External Services

1.  **Sherlock Smart Contract Audit:** Professional crowd-sourced audit to find edge cases.
    *   *Est. Cost:* $15,000 - $25,000 (fixed cost).
2.  **Datadog Infrastructure Monitoring Plan:** Enterprise log monitoring & metric ingestion.
    *   *Est. Cost:* $150/month.
3.  **Alchemy Growth Tier:** High-throughput Base Mainnet RPC node access with premium simulations.
    *   *Est. Cost:* $49/month.
4.  **Part-Time Solidity Security Consultant:** To review relayer access rules and on-chain permission modules.
    *   *Est. Cost:* $150 - $250 / hour.

---

*Plan formulated and verified by Jules, Principal Software Engineer.*
