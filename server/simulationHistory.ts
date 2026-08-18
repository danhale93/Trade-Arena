export type SimulationHistoryEntry = {
  network: string;
  route: string;
  netProfitUsd: string;
  profitable: boolean;
  spreadBps: number;
  source: string;
};

type SimulationPayload = Record<string, unknown>;

function parseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function findPayload(value: unknown): SimulationPayload | undefined {
  const parsed = parseJson(value);
  if (!parsed || typeof parsed !== "object") return undefined;
  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      const found = findPayload(item);
      if (found) return found;
    }
    return undefined;
  }

  const payload = parsed as SimulationPayload;
  const candidates = [payload, payload.result, payload.data, payload.simulation, payload.quote];
  for (const candidate of candidates) {
    const found = findPayloadCandidate(candidate);
    if (found) return found;
  }
  return payload;
}

function findPayloadCandidate(value: unknown): SimulationPayload | undefined {
  const parsed = parseJson(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
  const payload = parsed as SimulationPayload;
  const keys = ["netProfitUsd", "estimatedProfitUsd", "netProfit", "profitUsd", "profit", "route", "path"];
  if (keys.some((key) => key in payload)) return payload;
  return undefined;
}

function numericValue(payload: SimulationPayload, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    const parsed = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function normalizeSimulationHistoryEntry(input: {
  network: string;
  payload: unknown;
  fallbackRoute: string;
  source: string;
}): SimulationHistoryEntry | undefined {
  const payload = findPayload(input.payload);
  if (!payload) return undefined;

  const profit = numericValue(payload, ["netProfitUsd", "estimatedProfitUsd", "netProfit", "profitUsd", "profit"]);
  if (profit === undefined) return undefined;

  const spreadBps = numericValue(payload, ["spreadBps", "spread_bps"]) ?? 0;
  const route = typeof payload.route === "string"
    ? payload.route
    : typeof payload.path === "string"
      ? payload.path
      : input.fallbackRoute;
  const profitable = typeof payload.profitable === "boolean" ? payload.profitable : profit > 0;

  return {
    network: input.network,
    route,
    netProfitUsd: profit.toFixed(4),
    profitable,
    spreadBps: Math.round(spreadBps),
    source: input.source,
  };
}

export function summarizeSimulationHistory(entries: Array<Pick<SimulationHistoryEntry, "netProfitUsd" | "profitable">>) {
  const profits = entries.map((entry) => Number(entry.netProfitUsd)).filter(Number.isFinite);
  const totalProfitUsd = profits.reduce((sum, profit) => sum + profit, 0);
  return {
    totalProfitUsd: Number(totalProfitUsd.toFixed(4)),
    averageProfitUsd: profits.length ? Number((totalProfitUsd / profits.length).toFixed(4)) : 0,
    profitableRoutes: entries.filter((entry) => entry.profitable).length,
    totalRoutes: entries.length,
  };
}
