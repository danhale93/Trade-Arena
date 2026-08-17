# Direct Ethers.js Adapter Verification

The router now defaults to the guarded `direct` adapter for both direct QuoterV2 simulation and live swap execution, while the legacy CLI path remains available only with `EXECUTION_ADAPTER=cli`.

Read-only RPC verification succeeded for all three configured mainnets using 0.001 WETH and the 0.3% pool: Base returned 1.896231 native USDC, Arbitrum returned 1.896210 native USDC, and Optimism returned 1.896274 native USDC. These calls used QuoterV2 eth_call only and did not broadcast transactions.

The desktop preview shows the last-check timestamp beside `AGENT DISCONNECTED`; at that capture the prior persisted dashboard state still displayed `EXECUTION_ARMED`, although all direct-live environment gates were unset. Live execution was then explicitly disarmed in the database. The post-disarm mobile preview displays `SIMULATION_ONLY` and keeps the badge, timestamp, and reconnect power control legible across wrapped header rows. Direct live execution remains gated by an explicit confirmation string, matching signer private key, maximum input cap, and gas cap.

Verification results: 17 Vitest tests passed; TypeScript check passed; production build passed. The production build emits only the existing large-chunk advisory.
