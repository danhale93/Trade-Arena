import { describe, expect, it } from "vitest";
import { getGasAlertLabel, shouldNotifyGasAlert } from "./gasAlert";

describe("gas congestion alert transitions", () => {
  it("alerts when an ELEVATED threshold is crossed", () => {
    expect(shouldNotifyGasAlert("NORMAL", "ELEVATED", "ELEVATED")).toBe(true);
    expect(shouldNotifyGasAlert("ELEVATED", "CONGESTED", "ELEVATED")).toBe(false);
  });

  it("alerts only when a CONGESTED threshold is crossed", () => {
    expect(shouldNotifyGasAlert("ELEVATED", "CONGESTED", "CONGESTED")).toBe(true);
    expect(shouldNotifyGasAlert("NORMAL", "ELEVATED", "CONGESTED")).toBe(false);
  });

  it("does not alert while disabled or for degraded data", () => {
    expect(shouldNotifyGasAlert("NORMAL", "CONGESTED", "DISABLED")).toBe(false);
    expect(shouldNotifyGasAlert("NORMAL", "DEGRADED", "ELEVATED")).toBe(false);
  });

  it("provides clear configuration labels", () => {
    expect(getGasAlertLabel("DISABLED")).toBe("Alerts disabled");
    expect(getGasAlertLabel("ELEVATED")).toBe("Alert at ELEVATED");
    expect(getGasAlertLabel("CONGESTED")).toBe("Alert at CONGESTED");
  });
});
