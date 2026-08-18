export type CliDoctorLive = {
  status?: "HEALTHY" | "DEGRADED" | "UNAVAILABLE";
  authenticated?: boolean | null;
  initialized?: boolean | null;
  detail?: string;
  checkedAt?: string;
};

export type CliWalletBalance = {
  balance?: string | null;
  commandOk?: boolean;
  detail?: string;
};

export function getCliStatusWidgetModel(doctor?: CliDoctorLive, wallet?: CliWalletBalance) {
  const status = doctor?.status || "UNAVAILABLE";
  return {
    status,
    statusLabel: status === "HEALTHY" ? "DOCTOR HEALTHY" : status === "DEGRADED" ? "ACTION REQUIRED" : "CLI UNAVAILABLE",
    statusClass: status === "HEALTHY" ? "healthy" : status === "DEGRADED" ? "degraded" : "unavailable",
    walletBalanceLabel: wallet?.commandOk && wallet.balance ? `${wallet.balance} ETH` : "UNAVAILABLE",
    walletBalanceKnown: Boolean(wallet?.commandOk && wallet.balance),
  } as const;
}
