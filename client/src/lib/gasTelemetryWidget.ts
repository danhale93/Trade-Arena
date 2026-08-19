export type GasTelemetryLevel = "LOW" | "NORMAL" | "ELEVATED" | "CONGESTED" | "DEGRADED" | string;

export type GasTelemetryWidgetInput = {
  network: string;
  chainId: number;
  gasPriceGwei?: string | number | null;
  baseFeeGwei?: string | number | null;
  congestion?: GasTelemetryLevel | null;
  adjustedThresholdMultiplier?: number | null;
  fetchedAt?: string | null;
};

export function getGasCongestionModel(level: GasTelemetryLevel | null | undefined) {
  switch (level) {
    case "LOW":
      return {
        label: "LOW",
        dotClass: "bg-emerald-400",
        badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        meterClass: "bg-emerald-400",
        widthClass: "w-1/4",
      } as const;
    case "NORMAL":
      return {
        label: "NORMAL",
        dotClass: "bg-cyan-400",
        badgeClass: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
        meterClass: "bg-cyan-400",
        widthClass: "w-2/4",
      } as const;
    case "ELEVATED":
      return {
        label: "ELEVATED",
        dotClass: "bg-amber-400",
        badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-300",
        meterClass: "bg-amber-400",
        widthClass: "w-3/4",
      } as const;
    case "CONGESTED":
      return {
        label: "CONGESTED",
        dotClass: "bg-rose-400",
        badgeClass: "border-rose-500/30 bg-rose-500/10 text-rose-300",
        meterClass: "bg-rose-400",
        widthClass: "w-full",
      } as const;
    case "DEGRADED":
      return {
        label: "DEGRADED",
        dotClass: "bg-slate-400",
        badgeClass: "border-slate-500/30 bg-slate-500/10 text-slate-300",
        meterClass: "bg-slate-400",
        widthClass: "w-1/4",
      } as const;
    default:
      return {
        label: "UNKNOWN",
        dotClass: "bg-slate-500",
        badgeClass: "border-slate-500/30 bg-slate-500/10 text-slate-300",
        meterClass: "bg-slate-500",
        widthClass: "w-1/4",
      } as const;
  }
}

export function formatGasReading(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return String(value);
  return numericValue < 0.01 ? numericValue.toFixed(4) : numericValue.toFixed(2);
}

export function formatTelemetryTime(value: string | null | undefined) {
  if (!value) return "WAITING FOR REFRESH";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "TIME UNAVAILABLE" : date.toLocaleTimeString();
}
