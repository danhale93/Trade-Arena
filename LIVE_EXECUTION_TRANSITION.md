# Transitioning to Live Execution Mode

Once you have verified your arbitrage strategy via the **Simulation Mode** and are confident in the projected net profits, follow this guide to safely enable live on-chain execution using the **MetaMask Agent Wallet**.

---

## 1. Safety Checklist (Mandatory)

Before enabling live trades, you **must** enforce capital protection at the wallet level. This ensures that even if your bot logic has a bug, your total exposure is limited [1].

### A. Set a Daily Outflow Cap
Restrict the maximum amount the agent can spend in a 24-hour window.
```bash
# Example: Limit total daily outflow to 0.5 ETH on Base
mm wallet policy set --max-daily 0.5 --network base
```

### B. Configure a Gas Price Ceiling
Prevent the bot from executing trades during extreme gas spikes that could turn a profit into a loss.
```bash
# Example: Prevent trades if gas exceeds 0.5 Gwei on Base
mm wallet policy set --max-gas-price 0.5 --network base
```

### C. Verify Private RPC
Ensure you are using a private RPC (Alchemy, QuickNode, etc.) to maintain MEV protection and avoid the public mempool [1].

---

## 2. Enabling Live Mode

Live execution is controlled by the `AGENT_EXECUTION_ENABLED` environment variable.

1.  Open your `.env` file.
2.  Change the execution flag to `true`:
    ```env
    # 🚀 ARMED: Enable live on-chain execution
    AGENT_EXECUTION_ENABLED=true
    AGENT_SCANNER_ENABLED=true
    ```
3.  **Restart the server**:
    ```bash
    node public/server.js
    ```

---

## 3. Verifying the Transition

After restarting, verify that the system has successfully transitioned:

### A. Terminal Logs
The server will output a green-themed confirmation:
`🤖 Multi-Chain worker started in EXECUTION mode across Base, Arbitrum, and Optimism.`

### B. Agent Console UI
*   **Execution Badge**: The yellow `SIMULATION ONLY` badge will change to a green **`EXECUTION ARMED`** badge.
*   **Event Stream**: When a trade is executed, you will see: `✅ [BASE] Trade successfully settled! TxHash: 0x...`
*   **Discord Alerts**: Notifications will now include a direct link to the transaction on the block explorer (BaseScan, Arbiscan, etc.).

---

## 4. Monitoring Live Trades

*   **Real-Time P&L**: Monitor the `SESSION P&L` card in the console. It will now reflect **Realized Profit** from on-chain transactions.
*   **Prometheus**: Use the `mm_arb_trades_total{status="success"}` metric to track your execution hit rate.
*   **Emergency Stop**: If you notice anomalous behavior, use the **PAUSE SCANNER** button in the console or set `TRADING_PAUSED=true` in your `.env` to immediately halt all activity [1].

---

## References

[1] MetaMask Agent Trading Operations Skill Documentation (`/home/ubuntu/skills/metamask-agent-trading-ops/SKILL.md`).
