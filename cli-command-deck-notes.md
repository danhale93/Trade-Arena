# Official MetaMask Agent Wallet CLI Link Notes

Source: [Quickstart](https://docs.metamask.io/agent-wallet/quickstart/), [CLI setup](https://docs.metamask.io/agent-wallet/cli-setup/), and [commands reference](https://docs.metamask.io/agent-wallet/reference/commands/).

The official installation command is `npm install -g @metamask/agent-wallet@latest`, with pnpm, yarn, and bun alternatives. The supported browser login flow is `mm login browser`; for headless or non-interactive URL generation use `mm login browser --no-wait`, then complete authorization in the browser and pass the returned credential to `mm login --token "<cliToken:cliRefreshToken>"`. QR login is `mm login qr` and requires MetaMask Mobile approval.

Readiness checks are `mm doctor --json`, `mm auth status --json`, `mm wallet address --json`, and `mm wallet balance --chain-ids 8453 --json`. The official browser sign-in URL documented by the commands reference is `https://developer.metamask.io/agentic/login`.

The dashboard must only expose commands and official links. It must not show, persist, or interpolate a token value into a URL or copyable command. The web app cannot execute local `mm` commands directly; copy buttons should make local execution easy while links open the official docs or login page in a new tab.
