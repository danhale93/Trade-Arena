import { describe, expect, it } from "vitest";
import { getCliStatusWidgetModel } from "./cliStatusWidget";

describe("CLI status widget model", () => {
  it("shows healthy doctor status and active balance", () => {
    expect(getCliStatusWidgetModel(
      { status: "HEALTHY", authenticated: true, initialized: true },
      { commandOk: true, balance: "0.0050" },
    )).toMatchObject({
      statusLabel: "DOCTOR HEALTHY",
      statusClass: "healthy",
      walletBalanceLabel: "0.0050 ETH",
      walletBalanceKnown: true,
    });
  });

  it("does not fabricate a balance when CLI balance is unavailable", () => {
    expect(getCliStatusWidgetModel(
      { status: "DEGRADED" },
      { commandOk: false, balance: null },
    )).toMatchObject({
      statusLabel: "ACTION REQUIRED",
      statusClass: "degraded",
      walletBalanceLabel: "UNAVAILABLE",
      walletBalanceKnown: false,
    });
  });
});
