# CLI Command Deck Verification

The desktop preview shows the new LIVE CLI LINKS / COMMAND DECK inside the MetaMask Agent Wallet Sync & CLI Doctor panel. It includes six copyable commands, official authorization/setup/reference links, a local-terminal-required badge, and explicit token safety guidance.

The mobile preview shows the command cards stacking cleanly within the panel. Long commands remain horizontally scrollable inside their code blocks, while the live links wrap without creating page overflow. The panel makes clear that the web dashboard cannot execute local `mm` commands directly.

The command deck does not interpolate or display a JWT value. The fresh token flow is represented only by the placeholder command `mm login --token "<cliToken:cliRefreshToken>"`; actual token entry remains in the masked Secure Vault.
