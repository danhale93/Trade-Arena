import { CLI_LINKS } from "./cliCommandDeck";

export type CliWarningToastData = {
  message?: string | null;
  warning?: string | null;
};

export function buildCliWarningToast(data: CliWarningToastData) {
  const warningText = data.warning || "CLI validation is still pending.";
  const installHint = "Install CLI: npm i -g @metamask/agent-cli or check CLI Deck below.";
  
  return {
    title: data.message || "Token saved securely in Secure Vault",
    description: `${warningText}\n${installHint}`,
    installUrl: CLI_LINKS.docs,
    actionLabel: "Retry Connection",
  } as const;
}
