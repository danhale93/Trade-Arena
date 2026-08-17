import { describe, expect, it } from "vitest";
import { getStrategyProfile } from "./strategy";

describe("strategy profiles", () => {
  it("defaults to guarded mode for unknown or missing values", () => {
    const profile = getStrategyProfile();
    expect(profile.name).toBe("guarded");
    expect(profile.pollIntervalMs).toBe(10_000);
    expect(profile.maxInputWeth).toBe("0.005");
    expect(profile.networks.base.profitThresholdUsd).toBe(0.01);
  });

  it("applies the confirmed aggressive multi-chain parameters", () => {
    const profile = getStrategyProfile("aggressive");
    expect(profile.name).toBe("aggressive");
    expect(profile.pollIntervalMs).toBe(3_000);
    expect(profile.maxInputWeth).toBe("0.01");
    expect(profile.maxManualChecksPerMinute).toBe(20);
    expect(profile.networks.base).toMatchObject({ profitThresholdUsd: 0.002, slippage: 0.3 });
    expect(profile.networks.arbitrum).toMatchObject({ profitThresholdUsd: 0.01, slippage: 0.5 });
    expect(profile.networks.optimism).toMatchObject({ profitThresholdUsd: 0.01, slippage: 0.5 });
  });
});
