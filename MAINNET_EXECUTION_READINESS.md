# Mainnet Execution Readiness Guide

This guide outlines the final configuration steps required to transition your synchronized Master Dashboard and MetaMask Agent Wallet from simulation mode to **real on-chain mainnet execution** across Base, Arbitrum, and Optimism.

---

## 1. Safety Guardrails & Outflow Caps

Before enabling live execution, you must set up your daily outflow caps and gas limits using the MetaMask Agent CLI to prevent unmitigated losses:

```bash
# Set daily outflow limit (e.g., 0.5 ETH max per day)
mm wallet policy set --max-daily 0.5 --network base
mm wallet policy set --max-daily 0.5 --network arbitrum
mm wallet policy set --max-daily 0.5 --network optimism

# Restrict interactions to verified DEX routers (Uniswap V3, Aerodrome, Velodrome)
mm wallet policy set --allowlist 0x262664982633ffc1bda207575304b407b46d03d0,0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45
```

---

## 2. Environment Configuration for Live Trading

Update your `.env` file in the root of your repository to enable live execution and configure your private RPC endpoints:

```env
# Enable Live On-Chain Execution
AGENT_EXECUTION_ENABLED=true
AGENT_SCANNER_ENABLED=true

# Private RPC Endpoints (Required for MEV Protection)
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
OPTIMISM_RPC_URL=https://opt-mainnet.g.alchemy.com/v2/YOUR_KEY

# Wallet & CLI Token
MM_CLI_TOKEN=your_metamask_agent_token
MANAGED_WALLET_ADDRESS=0x2ca1f801c1e19d16160c982c627e2932e95117be

# Profit Thresholds ($ USD)
BASE_PROFIT_TARGET_USD=2.50
```

---

## 3. Verifying Balance Synchronization in the Master Dashboard

1. Start your server with the optimized production profile:
   ```bash
   npm run start:hft
   ```
2. Open your Master Dashboard:
   👉 **[Master Dashboard](https://3001-ic8lk1f2rlaa839gelz61-1c4f73a2.sg1.manus.computer/master-dashboard.html)**
3. **Verify the Balances Bar**: The top cards will now pull real-time balances directly from your MetaMask Agent Wallet across Base, Arbitrum, and Optimism via direct JSON-RPC calls.
4. **Execution Status**: Once `AGENT_EXECUTION_ENABLED=true`, the badge in the header will automatically transition from yellow (`SIMULATION_ONLY`) to green (`EXECUTION_ARMED`).

---

## 4. Monitoring Realized Profit & Prometheus Metrics

* **Prometheus Metrics**: Monitor live trade counters and V8 health at `http://localhost:3001/metrics`.
* **Discord/Telegram Alerts**: Successful on-chain settlements will immediately trigger rich embeds with direct links to **BaseScan**, **Arbiscan**, and **Optimistic Etherscan**.
