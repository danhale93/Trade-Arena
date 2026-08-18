import { describe, expect, it } from "vitest";
import { buildFeatureVisualizerModel, getFeatureVisualizerMotion, getTokenIdentity } from "./featureVisualizer";

describe("feature visualizer model", () => {
  it("resolves official token identities with safe fallbacks", () => {
    const weth = getTokenIdentity("WETH");
    expect(weth.symbol).toBe("WETH");
    expect(weth.logoUrl).toContain("weth.png");
  });

  it("shows truthful standby values when no simulation history exists", () => {
    const model = buildFeatureVisualizerModel({ pulseEventCount: 0 });
    expect(model.network).toBe("MULTI-CHAIN");
    expect(model.route).toBe("AWAITING ROUTE SIGNAL");
    expect(model.profit).toBeNull();
    expect(model.reels[3].values[0]).toBe("STANDBY");
  });
});
