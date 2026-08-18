import { describe, expect, it } from "vitest";
import { fetchChainGasTelemetry } from "./directDex";

describe("real-time gas telemetry and dynamic thresholds", () => {
  it("fetches valid gas telemetry or fallback for supported L2 chains", { timeout: 10000 }, async () => {
    const baseTelemetry = await fetchChainGasTelemetry("base");
    expect(baseTelemetry).toMatchObject({
      network: "base",
      chainId: 8453,
    });
    expect(typeof baseTelemetry.gasPriceGwei).toBe("string");
    expect(["LOW", "NORMAL", "ELEVATED", "CONGESTED", "DEGRADED"]).toContain(baseTelemetry.congestion);
    expect(baseTelemetry.adjustedThresholdMultiplier).toBeGreaterThan(0);
  });

  it("handles RPC timeout or failure gracefully with DEGRADED telemetry", async () => {
    const originalEnv = process.env.BASE_RPC_URL;
    process.env.BASE_RPC_URL = "https://invalid.rpc.local.test";
    const telemetry = await fetchChainGasTelemetry("base");
    expect(telemetry.congestion).toBe("DEGRADED");
    expect(telemetry.adjustedThresholdMultiplier).toBe(1.0);
    process.env.BASE_RPC_URL = originalEnv;
  });
});
