import { describe, expect, it } from "vitest";
import { normalizeSimulationHistoryEntry, summarizeSimulationHistory } from "./simulationHistory";

describe("simulation history helpers", () => {
  it("normalizes nested CLI JSON output into a history entry", () => {
    const entry = normalizeSimulationHistoryEntry({
      network: "base",
      payload: JSON.stringify({ result: { route: "WETH -> UNI -> USDC -> AERO -> WETH", netProfitUsd: 0.0184, spreadBps: 42, profitable: true } }),
      fallbackRoute: "WETH -> USDC -> WETH",
      source: "cli",
    });

    expect(entry).toEqual({
      network: "base",
      route: "WETH -> UNI -> USDC -> AERO -> WETH",
      netProfitUsd: "0.0184",
      profitable: true,
      spreadBps: 42,
      source: "cli",
    });
  });

  it("returns undefined when a simulation has no measurable profit", () => {
    expect(normalizeSimulationHistoryEntry({
      network: "optimism",
      payload: { amountOut: "123.45" },
      fallbackRoute: "WETH -> USDC -> WETH",
      source: "direct",
    })).toBeUndefined();
  });

  it("summarizes cumulative, average, and profitable route counts", () => {
    expect(summarizeSimulationHistory([
      { netProfitUsd: "0.0100", profitable: true },
      { netProfitUsd: "-0.0020", profitable: false },
      { netProfitUsd: "0.0040", profitable: true },
    ])).toEqual({
      totalProfitUsd: 0.012,
      averageProfitUsd: 0.004,
      profitableRoutes: 2,
      totalRoutes: 3,
    });
  });

  it("handles empty and malformed simulation records safely", () => {
    expect(summarizeSimulationHistory([])).toEqual({
      totalProfitUsd: 0,
      averageProfitUsd: 0,
      profitableRoutes: 0,
      totalRoutes: 0,
    });

    const badEntry = normalizeSimulationHistoryEntry({
      network: "arbitrum",
      payload: null,
      fallbackRoute: "WETH -> USDC",
      source: "direct",
    });
    expect(badEntry).toBeUndefined();
  });
});
