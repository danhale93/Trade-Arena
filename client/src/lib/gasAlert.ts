export type GasAlertThreshold = "DISABLED" | "ELEVATED" | "CONGESTED";
export type GasCongestionState = "LOW" | "NORMAL" | "ELEVATED" | "CONGESTED" | "DEGRADED" | string;
export const GAS_ALERT_COOLDOWN_OPTIONS = [0, 1, 5, 15, 30, 60] as const;
export type GasAlertCooldownMinutes = (typeof GAS_ALERT_COOLDOWN_OPTIONS)[number];

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
  lastNotifiedAt = 0,
  now = Date.now(),
  cooldownMinutes = 0,
) {
  if (threshold === "DISABLED" || !currentState) return false;

  const previousSeverity = severity[previousState || ""] ?? -1;
  const currentSeverity = severity[currentState] ?? -1;
  const thresholdSeverity = severity[threshold];
  const isAboveThreshold = currentSeverity >= thresholdSeverity;
  if (!isAboveThreshold) return false;

  const crossedThreshold = previousSeverity < thresholdSeverity;
  const cooldownMs = Math.max(0, cooldownMinutes) * 60 * 1000;
  const cooldownActive = cooldownMs > 0 && lastNotifiedAt > 0 && now - lastNotifiedAt < cooldownMs;
  if (cooldownActive) return false;
  if (crossedThreshold) return true;

  return cooldownMs > 0 && now - lastNotifiedAt >= cooldownMs;
}

export function getGasAlertCooldownLabel(minutes: number) {
  if (minutes <= 0) return "Cooldown disabled";
  return `${minutes} min cooldown`;
}

export function getGasAlertCooldownRemainingMs(lastNotifiedAt: number | null | undefined, cooldownMinutes: number, now = Date.now()) {
  if (!lastNotifiedAt || cooldownMinutes <= 0) return 0;
  return Math.max(0, lastNotifiedAt + cooldownMinutes * 60 * 1000 - now);
}

export function formatGasAlertCooldownRemaining(remainingMs: number) {
  if (remainingMs <= 0) return "READY";
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}M ${String(seconds).padStart(2, "0")}S` : `${seconds}S`;
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
