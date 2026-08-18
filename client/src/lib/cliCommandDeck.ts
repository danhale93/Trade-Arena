export const CLI_LINKS = {
  docs: "https://docs.metamask.io/agent-wallet/cli-setup/",
  login: "https://developer.metamask.io/agentic/login",
  commands: "https://docs.metamask.io/agent-wallet/reference/commands/",
} as const;

export const CLI_COMMANDS = [
  { id: "install", label: "INSTALL / UPDATE", command: "npm install -g @metamask/agent-wallet@latest", hint: "Node.js 22.18+" },
  { id: "doctor", label: "CHECK DOCTOR", command: "mm doctor --json", hint: "No wallet action" },
  { id: "login-link", label: "GENERATE TOKEN LINK", command: "mm login browser --no-wait", hint: "Authorize in browser" },
  { id: "apply-token", label: "APPLY FRESH TOKEN", command: "mm login --token \"<cliToken:cliRefreshToken>\"", hint: "Never paste token in chat" },
  { id: "address", label: "VERIFY WALLET", command: "mm wallet address --json", hint: "Confirm expected address" },
  { id: "balance", label: "CHECK BASE BALANCE", command: "mm wallet balance --chain-ids 8453 --json", hint: "Read-only RPC check" },
] as const;

export function commandDeckHasNoTokenValues() {
  return CLI_COMMANDS.every(({ command }) => command.includes("<cliToken:cliRefreshToken>") || !command.toLowerCase().includes("token"));
}
