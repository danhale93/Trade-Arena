import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getAgentStateKey: vi.fn(async () => null),
  setAgentStateKey: vi.fn(async () => undefined),
  recordAgentLog: vi.fn(async () => undefined),
}));

import { appRouter } from "./routers";
import * as db from "./db";

function createContext(role: "admin" | "user" = "admin"): TrpcContext {
  return {
    user: {
      id: role === "admin" ? 1 : 2,
      openId: role === "admin" ? "owner" : "not-owner",
      email: role === "admin" ? "owner@example.com" : "user@example.com",
      name: role === "admin" ? "Owner" : "User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("gas congestion alert router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("persists an owner-configured threshold", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    await expect(caller.arbitrage.updateGasAlertThreshold({ network: "base", threshold: "ELEVATED" })).resolves.toEqual({
      success: true,
      network: "base",
      threshold: "ELEVATED",
    });
    expect(db.setAgentStateKey).toHaveBeenCalledWith("gas_alert_threshold_base", "ELEVATED");
    expect(db.recordAgentLog).toHaveBeenCalledWith(expect.objectContaining({ category: "TELEMETRY" }));
  });

  it("persists an owner-configured cooldown", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    await expect(caller.arbitrage.updateGasAlertCooldown({ cooldownMinutes: 15 })).resolves.toEqual({
      success: true,
      cooldownMinutes: 15,
    });
    expect(db.setAgentStateKey).toHaveBeenCalledWith("gas_alert_cooldown_minutes", "15");
    expect(db.recordAgentLog).toHaveBeenCalledWith(expect.objectContaining({ category: "TELEMETRY" }));
  });

  it("rejects non-admin users from changing alert settings", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.arbitrage.updateGasAlertThreshold({ network: "optimism", threshold: "CONGESTED" })).rejects.toThrowError(
      /Only owner\/admin can update congestion alerts/i,
    );
    await expect(caller.arbitrage.updateGasAlertCooldown({ cooldownMinutes: 30 })).rejects.toThrowError(
      /Only owner\/admin can update congestion-alert cooldown/i,
    );
    expect(db.setAgentStateKey).not.toHaveBeenCalled();
  });
});
