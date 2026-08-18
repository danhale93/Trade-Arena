export const CLI_LINKS = {
  docs: "https://docs.metamask.io/agent-wallet/cli-setup/",
  login: "https://developer.metamask.io/agentic/login",
  commands: "https://docs.metamask.io/agent-wallet/reference/commands/",
} as const;

/**
 * Experimental local protocol handoff. It carries no token or wallet secret.
 * A machine must register an mm:// protocol handler for the browser to launch it.
 */
export const CLI_HANDOFF_URL = "mm://login?flow=browser&command=login%20browser&source=trade-arena";

export const CLI_COMMANDS = [
  { id: "install", label: "INSTALL / UPDATE", command: "npm install -g @metamask/agent-wallet@latest", hint: "Node.js 22.18+" },
  { id: "doctor", label: "CHECK DOCTOR", command: "mm doctor --json", hint: "No wallet action" },
  { id: "login-link", label: "GENERATE TOKEN LINK", command: "mm login browser --no-wait", hint: "Authorize in browser" },
  { id: "apply-token", label: "APPLY FRESH TOKEN", command: "mm login --token \"<cliToken:cliRefreshToken>\"", hint: "Never paste token in chat" },
  { id: "address", label: "VERIFY WALLET", command: "mm wallet address --json", hint: "Confirm expected address" },
  { id: "balance-base", label: "CHECK BASE BALANCE", command: "mm wallet balance --chain-ids 8453 --json", hint: "Base · read-only RPC" },
  { id: "balance-arbitrum", label: "CHECK ARBITRUM BALANCE", command: "mm wallet balance --chain-ids 42161 --json", hint: "Arbitrum · read-only RPC" },
  { id: "balance-optimism", label: "CHECK OPTIMISM BALANCE", command: "mm wallet balance --chain-ids 10 --json", hint: "Optimism · read-only RPC" },
] as const;

export function commandDeckHasNoTokenValues() {
  return CLI_COMMANDS.every(({ command }) => command.includes("<cliToken:cliRefreshToken>") || !command.toLowerCase().includes("token"));
}
