# Agent Wallet Signing Findings

Official MetaMask Agent Wallet documentation reviewed on 2026-08-19.

- Quickstart: the `mm` CLI is the interface for sign-in, balances, and sending transactions. The setup supports Server wallet and Bring your own wallet modes. Server-wallet keys stay secured server-side; signing/transaction operations use an asynchronous model and may require a polling ID or `--wait`.
- Architecture: the CLI is backed by the Agent Wallet service. Server-wallet keys are managed and secured server-side in a trusted execution environment, so agents cannot access the raw key. The service can simulate transactions, run threat scanning, and evaluate policies. Flagged transactions require user approval.
- Commands reference: supported transaction paths include `mm wallet send-transaction`, `mm swap quote`, `mm swap execute`, and `mm swap status`. `mm swap quote` supports `--yes`; `mm swap execute` accepts a `--wallet-timeout` and can execute by quote ID. Global `--json` and `--verbose` options are available. BYOW signing commands may use `MM_PASSWORD` to unlock an encrypted mnemonic, but that is not applicable to server-wallet mode.
- Project implication: the current direct Ethers.js adapter requiring `DIRECT_EVM_SIGNER_PRIVATE_KEY` is the wrong path for a managed/server wallet. The efficient managed-wallet integration is to restore the `mm` binary, validate the session with `mm doctor --json` / `mm auth status --json`, then route owner-approved swaps through `mm swap quote` and `mm swap execute` (or `mm swap quote --yes` only after policy/approval design is confirmed). Keep private keys out of the application.

Sources:
- https://docs.metamask.io/agent-wallet/quickstart/
- https://docs.metamask.io/agent-wallet/reference/commands/
- https://docs.metamask.io/agent-wallet/reference/architecture/

UI verification: the new `MM DOCTOR / WALLET LINK` panel renders above the Stitch reels visualizer, shows `CLI UNAVAILABLE` truthfully when the binary is absent, shows `UNAVAILABLE` for the CLI balance without fabricating a value, and states that the dashboard refreshes every 5 seconds. Desktop screenshot confirmed the three-column widget is legible and aligned.
