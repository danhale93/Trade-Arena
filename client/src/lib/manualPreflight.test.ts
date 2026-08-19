import { describe, expect, it } from "vitest";
import { getManualPreflightCheckLabel, getManualPreflightStatusModel } from "./manualPreflight";

describe("manual preflight display model", () => {
  it("represents a ready simulation-only result", () => {
    expect(getManualPreflightStatusModel({ ready: true, executionArmed: false })).toEqual({
      label: "READY FOR MANUAL TEST",
      tone: "ready",
      executionLabel: "NO · SIMULATION_ONLY",
    });
  });

  it("represents a blocked live-control result", () => {
    expect(getManualPreflightStatusModel({ ready: false, executionArmed: true })).toEqual({
      label: "BLOCKED · REVIEW CHECKS",
      tone: "blocked",
      executionLabel: "YES · LIVE CONTROL ACTIVE",
    });
  });

  it("uses explicit pass/fail labels for individual checks", () => {
    expect(getManualPreflightCheckLabel(true)).toBe("PASS");
    expect(getManualPreflightCheckLabel(false)).toBe("FAIL");
  });
});
