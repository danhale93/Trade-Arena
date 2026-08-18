# Protocol, QR, and Balance Command Verification

The desktop preview shows the CLI command deck with Base, Arbitrum, and Optimism read-only balance commands, an optional amber `mm://` handoff panel, and a cyan/green QR code for the official MetaMask authorization URL. The QR panel explicitly states that it contains no CLI token.

The mobile preview stacks the handoff and QR panel cleanly beneath the command cards. The QR remains visible and scannable at the compact width, while long commands remain inside their existing horizontally scrollable code blocks.

The custom protocol link contains only the browser login flow metadata and a source label; it does not include a JWT, wallet address, or transaction data. The UI labels the handoff as optional and provides an official browser fallback if no local protocol handler is installed.
