export type CliWarningToastData = {
  message?: string | null;
  warning?: string | null;
};

export function buildCliWarningToast(data: CliWarningToastData) {
  return {
    title: data.message || "Token saved securely in Secure Vault",
    description: data.warning || "CLI validation is still pending.",
    actionLabel: "Retry Connection",
  } as const;
}
