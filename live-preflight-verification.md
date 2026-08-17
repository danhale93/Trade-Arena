# Live Execution Preflight Verification

The direct live-execution preflight was checked without signing or broadcasting a transaction. The current runtime has `MANAGED_WALLET_ADDRESS` and `MM_CLI_TOKEN` configured, but the direct signer key, gas cap, input cap, direct confirmation flags, and `mm` binary are absent. The database was explicitly set to `execution_enabled=false` and `scanner_running=false`.

The desktop dashboard preview shows `SIMULATION_ONLY`, `SCANNER: PAUSED`, a disabled `LIVE PREFLIGHT BLOCKED` control, and an amber diagnostic panel explaining the missing direct signer, gas cap, input cap, and confirmation flags. The mobile preview keeps the header status and execution badge legible. No transaction was sent.
