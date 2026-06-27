## 2026-06-27 - Web3 Payout & Arbitrage Infrastructure

Learning: Implementing Biconomy v3 Nexus with ERC-7579 modularity requires `@biconomy/account` (formerly `@biconomy/sdk` in some docs) and `viem`. EIP-712 signature verification in smart contracts combined with ERC-2771 meta-transactions provides a robust defense-in-depth for sponsored payout systems. Agnostic execution engines in flashloan contracts (using `abi.decode` for an array of target/calldata pairs) are superior to hardcoded routes as they allow the backend to dynamically adjust to changing market liquidity.

Action: Decoupled financial execution logic into `/services/payouts` and `/services/flashloans` to maintain a clean security boundary in the Express backend.
