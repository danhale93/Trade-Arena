# Salvaged Arbitrage Intelligence & MetaMask Agent Consolidation

This document consolidates salvaged arbitrage strategies, MEV exploration algorithms, and risk engines from the **Trade-Arena** repository [1], pairing them directly with the **MetaMask Agent Wallet** as the primary managed execution environment.

---

## 1. Salvaged Arbitrage & MEV Strategies

Analysis of the repository revealed three core high-performance strategy modules that complement the MetaMask Agent CLI:
*   **Flash Loan MEV Engine (`advanced-bot-engine.js`)**: Identifies pool imbalances, liquidation loops, and sandwich execution vectors across multi-hop paths [1].
*   **Adaptive Strategy Profiler (`ai-strategies.js`)**: Dynamically scales risk multipliers, position sizes, and profit thresholds based on sliding-window win rates and sliding PnL drawdowns [1].
*   **Multi-Chain Spread Scanner (`cross-dex-arb-scanner.js`)**: Continuously monitors price variances across Uniswap V3, Aerodrome, and Velodrome on Base, Arbitrum, and Optimism.

---

## 2. MetaMask Agent Wallet Consolidation

The MetaMask Agent Wallet serves as the primary managed execution interface. To ensure robust operation across all scavenged strategies, the system enforces:
*   **Mutex-Locked CLI Spawning**: Serializing all `mm swap quote` and execution calls to prevent session collision.
*   **Direct RPC Balance Sync**: Offloading balance checks to Ethers.js providers to protect server performance.
*   **Gas-Aware Dynamic Thresholds**: Automatically scaling required profit targets during Layer 2 network congestion.

---

## References

[1] Trade-Arena Repository (`/home/ubuntu/Trade-Arena/`) & MetaMask Agent Trading Operations Skill (`/home/ubuntu/skills/metamask-agent-trading-ops/SKILL.md`).
