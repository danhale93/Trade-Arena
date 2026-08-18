import { describe, expect, it } from "vitest";
import { getProfitPulseMotion, shouldTriggerProfitPulse } from "./profitPulse";

describe("profitability pulse logic", () => {
  const highProfit = { id: 12, netProfitUsd: "0.0100", profitable: 1 };

  it("triggers for a newly recorded route that clears twice the threshold", () => {
    expect(shouldTriggerProfitPulse(11, highProfit, 0.004)).toBe(true);
  });

  it("does not trigger for the initial snapshot, the same record, or a low-profit route", () => {
    expect(shouldTriggerProfitPulse(null, highProfit, 0.004)).toBe(false);
    expect(shouldTriggerProfitPulse(12, highProfit, 0.004)).toBe(false);
    expect(shouldTriggerProfitPulse(11, { ...highProfit, netProfitUsd: "0.0060" }, 0.004)).toBe(false);
    expect(shouldTriggerProfitPulse(11, { ...highProfit, profitable: 0 }, 0.004)).toBe(false);
  });

  it("keeps the visible event duration while disabling motion for reduced-motion users", () => {
    expect(getProfitPulseMotion(false)).toEqual({
      animationName: "trade-arena-profitability-pulse",
      durationMs: 2600,
    });
    expect(getProfitPulseMotion(true)).toEqual({
      animationName: "none",
      durationMs: 2600,
    });
  });
});
