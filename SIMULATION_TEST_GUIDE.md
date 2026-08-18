# Running a Live Simulation Test with MetaMask Agent Console

This guide walks you through executing a live, simulation-safe arbitrage test using the **MetaMask Agent Wallet** and the **Stitch UI** integrated into **Trade-Arena**.

---

## 1. Prerequisites & Environment Setup

Before starting the server, ensure your `.env` file in the root of the repository is configured for **Simulation Mode**.

```env
# 🛡️ SAFETY FIRST: Ensure execution is DISABLED for simulation
AGENT_EXECUTION_ENABLED=false
AGENT_SCANNER_ENABLED=true

# 🔑 Required: Your MetaMask Agent CLI Token
MM_CLI_TOKEN=your_token_here

# 🌐 Multi-Chain RPCs
BASE_RPC_URL=https://mainnet.base.org
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
OPTIMISM_RPC_URL=https://mainnet.optimism.io

# 📊 Settings
ARB_PROFIT_THRESHOLD_USD=2.00
ARB_POLL_INTERVAL_MS=10000
```

---

## 2. Start the Trade-Arena Backend

Open your terminal and run the backend server. The integrated `MetaMaskAgentArbService` will automatically initialize the multi-chain scanner in simulation mode.

```bash
cd Trade-Arena
npm install  # Ensure dependencies like prom-client and async-mutex are installed
node public/server.js
```

**Expected Console Output:**
```text
🤖 Multi-Chain worker started in SIMULATION-ONLY mode across Base, Arbitrum, and Optimism.
🤖 Trade Arena Backend running on port 3001
📈 Prometheus metrics: http://localhost:3001/metrics
```

---

## 3. Access the Stitch UI Console

1.  Open your browser to `http://localhost:3001`.
2.  Click the **🤖 CONSOLE** button in the global header.
3.  Alternatively, go directly to `http://localhost:3001/agent-console.html`.

---

## 4. Verifying the Simulation

Once the console is open, you can verify the simulation is active through three channels:

### A. The Agent Console UI
*   **Scanner Status**: Should show `RUNNING (10s)`.
*   **Execution Badge**: Should show `SIMULATION ONLY` (Yellow).
*   **Network Cards**: Watch the `Last Scan` and `Best Net Spread` fields update every 10 seconds as the agent polls Base, Arbitrum, and Optimism.
*   **Event Stream**: You will see logs like: `[10:00:05] Base/Aerodrome quote simulated: +$3.42 net profit.`

### B. Backend Logs
The server terminal will print real-time simulation results:
`[MetaMaskAgentArb] [BASE] Simulated WETH/USDC arb: Net Profit = $3.42 (Threshold: $2.00)`

### C. Prometheus Metrics
Visit `http://localhost:3001/metrics` to see the raw telemetry being exported. Look for `mm_arb_trades_total` and `mm_arb_profit_usd_total`.

---

## 5. Controlling the Agent

*   **Pause/Resume**: Use the **PAUSE SCANNER** button in the top right of the console to stop polling. This is useful for rotating tokens or adjusting thresholds without stopping the server.
*   **Live Mode**: To transition from simulation to live execution, you must set `AGENT_EXECUTION_ENABLED=true` in your `.env` and restart the server. The UI will then update the badge to `EXECUTION ARMED` (Green).

---

## References

[1] Trade-Arena Repository (`/home/ubuntu/Trade-Arena/`)
[2] MetaMask Agent Trading Operations Skill Documentation (`/home/ubuntu/skills/metamask-agent-trading-ops/SKILL.md`)
