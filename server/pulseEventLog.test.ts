import { describe, expect, it } from "vitest";
import { buildPulseEvent, sortPulseEventsByNewest } from "./pulseEventLog";

describe("pulse event log", () => {
  it("builds a persisted event when profit clears twice the threshold", () => {
    expect(buildPulseEvent({
      network: "base",
      route: "WETH -> UNI -> USDC -> AERO -> WETH",
      netProfitUsd: "0.0100",
      profitable: true,
      thresholdUsd: 0.004,
      source: "cross-dex-model",
    })).toEqual({
      network: "base",
      route: "WETH -> UNI -> USDC -> AERO -> WETH",
      netProfitUsd: "0.0100",
      thresholdUsd: "0.0040",
      source: "cross-dex-model",
    });
  });

  it("does not create an event for low-profit or non-profitable simulations", () => {
    expect(buildPulseEvent({
      network: "arbitrum",
      route: "WETH -> USDC -> WETH",
      netProfitUsd: "0.0060",
      profitable: true,
      thresholdUsd: 0.004,
      source: "cli",
    })).toBeNull();

    expect(buildPulseEvent({
      network: "optimism",
      route: "WETH -> USDC -> WETH",
      netProfitUsd: "0.0200",
      profitable: false,
      thresholdUsd: 0.004,
      source: "cli",
    })).toBeNull();
  });

  it("orders event rows newest first without mutating the input array", () => {
    const older = { id: 1, timestamp: "2026-08-19T00:00:00.000Z" };
    const newer = { id: 2, timestamp: "2026-08-19T01:00:00.000Z" };
    const events = [older, newer];
    expect(sortPulseEventsByNewest(events)).toEqual([newer, older]);
    expect(events).toEqual([older, newer]);
  });
});
