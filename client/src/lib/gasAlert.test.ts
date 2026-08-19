import { describe, expect, it } from "vitest";
import { formatGasAlertCooldownRemaining, getGasAlertCooldownLabel, getGasAlertCooldownRemainingMs, getGasAlertLabel, shouldNotifyGasAlert } from "./gasAlert";

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

  it("suppresses sustained congestion until the cooldown expires", () => {
    const lastNotifiedAt = 1_000_000;
    expect(shouldNotifyGasAlert("ELEVATED", "CONGESTED", "ELEVATED", lastNotifiedAt, lastNotifiedAt + 60_000, 5)).toBe(false);
    expect(shouldNotifyGasAlert("ELEVATED", "CONGESTED", "ELEVATED", lastNotifiedAt, lastNotifiedAt + 5 * 60_000, 5)).toBe(true);
    expect(shouldNotifyGasAlert("NORMAL", "ELEVATED", "ELEVATED", lastNotifiedAt, lastNotifiedAt + 60_000, 5)).toBe(false);
  });

  it("calculates and formats remaining cooldown time", () => {
    const lastNotifiedAt = 1_000_000;
    expect(getGasAlertCooldownRemainingMs(lastNotifiedAt, 5, lastNotifiedAt + 60_000)).toBe(240_000);
    expect(formatGasAlertCooldownRemaining(61_000)).toBe("1M 01S");
    expect(formatGasAlertCooldownRemaining(0)).toBe("READY");
    expect(getGasAlertCooldownLabel(0)).toBe("Cooldown disabled");
    expect(getGasAlertCooldownLabel(5)).toBe("5 min cooldown");
  });

  it("provides clear configuration labels", () => {
    expect(getGasAlertLabel("DISABLED")).toBe("Alerts disabled");
    expect(getGasAlertLabel("ELEVATED")).toBe("Alert at ELEVATED");
    expect(getGasAlertLabel("CONGESTED")).toBe("Alert at CONGESTED");
  });
});
