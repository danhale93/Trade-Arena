export type GasAlertThreshold = "DISABLED" | "ELEVATED" | "CONGESTED";
export type GasCongestionState = "LOW" | "NORMAL" | "ELEVATED" | "CONGESTED" | "DEGRADED" | string;

const severity: Record<string, number> = {
  LOW: 0,
  NORMAL: 1,
  ELEVATED: 2,
  CONGESTED: 3,
};

export function shouldNotifyGasAlert(
  previousState: GasCongestionState | null | undefined,
  currentState: GasCongestionState | null | undefined,
  threshold: GasAlertThreshold,
) {
  if (threshold === "DISABLED" || !currentState) return false;

  const previousSeverity = severity[previousState || ""] ?? -1;
  const currentSeverity = severity[currentState] ?? -1;
  const thresholdSeverity = severity[threshold];

  return currentSeverity >= thresholdSeverity && previousSeverity < thresholdSeverity;
}

export function getGasAlertLabel(threshold: GasAlertThreshold) {
  switch (threshold) {
    case "ELEVATED":
      return "Alert at ELEVATED";
    case "CONGESTED":
      return "Alert at CONGESTED";
    default:
      return "Alerts disabled";
  }
}
