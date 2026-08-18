import { describe, expect, it } from "vitest";
import { buildFeatureVisualizerModel, getFeatureVisualizerMotion } from "./featureVisualizer";

describe("feature visualizer model", () => {
  it("uses the latest real route and pulse data without inventing fallback profitability", () => {
    const model = buildFeatureVisualizerModel({
      latestPulseEvent: {
        network: "base",
        route: "WETH -> AERO -> USDC -> WETH",
        netProfitUsd: "0.0120",
        timestamp: "2026-08-19T00:00:00.000Z",
      },
      latestSimulationRoute: { spreadBps: 42 },
      pulseEventCount: 3,
    });

    expect(model.network).toBe("BASE");
    expect(model.route).toBe("WETH -> AERO -> USDC -> WETH");
    expect(model.profit).toBe("0.0120");
    expect(model.pulseLevel).toBe(60);
    expect(model.reels[2].values[0]).toBe("+$0.0120");
  });

  it("switches the visualizer to a static mode when reduced motion is preferred", () => {
    expect(getFeatureVisualizerMotion(true)).toEqual({ animationEnabled: false, mode: "STATIC" });
    expect(getFeatureVisualizerMotion(false)).toEqual({ animationEnabled: true, mode: "ANIMATED" });
  });

  it("shows explicit standby values when no simulation history exists", () => {
    const model = buildFeatureVisualizerModel({ pulseEventCount: 0 });
    expect(model.network).toBe("MULTI-CHAIN");
    expect(model.route).toBe("AWAITING ROUTE SIGNAL");
    expect(model.profit).toBeNull();
    expect(model.pulseLevel).toBe(0);
    expect(model.reels[0].values[1]).toBe("NO DATA");
    expect(model.reels[2].values[1]).toBe("STANDBY");
  });
});
