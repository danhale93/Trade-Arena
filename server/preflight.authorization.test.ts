import { describe, it, expect, beforeEach, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getAgentStateKey: vi.fn(async (key: string) => {
    if (key === "mm_cli_token") return "test-token";
    if (key === "mm_cli_session_validated") return "true";
    if (key === "execution_enabled") return "false";
    return null;
  }),
  setAgentStateKey: vi.fn(async () => undefined),
  recordAgentLog: vi.fn(async () => undefined),
  recordBalanceSnapshot: vi.fn(async () => undefined),
  getRecentTrades: vi.fn(async () => []),
  getSimulationRouteHistory: vi.fn(async () => []),
  getPulseEvents: vi.fn(async () => []),
  getSuppressedAlerts: vi.fn(async () => []),
  getAgentLogs: vi.fn(async () => []),
}));

vi.mock("./directDex", () => ({
  getDirectExecutionPreflight: vi.fn(() => ({
    ready: false,
    adapter: "direct",
    managedWalletConfigured: true,
    signerConfigured: false,
    signerMatchesManagedWallet: false,
    gasCapConfigured: false,
    maxInputConfigured: false,
    liveFlagsConfigured: false,
    reasons: ["DIRECT_EVM_SIGNER_PRIVATE_KEY is not configured."],
  })),
  fetchChainGasTelemetry: vi.fn(async () => ({
    network: "base",
    gasPriceGwei: "0.05",
    congestion: "low",
    adjustedThresholdMultiplier: 1.0,
    timestamp: Date.now(),
  })),
}));

vi.mock("./cli", () => ({
  isMetaMaskCliAvailable: vi.fn(() => true),
  getMetaMaskCliPath: vi.fn(() => "/opt/metamask-agent/mm"),
  getMetaMaskAgentConnectionStatus: vi.fn(() => ({
    status: "connected",
    label: "CONNECTED",
    tokenConfigured: true,
    cliAvailable: true,
    sessionValidated: true,
    reason: "ok",
  })),
  getCliDoctorStatus: vi.fn(async () => ({
    ok: true,
    stdout: { data: { authenticated: true, initialized: true, cliVersion: "1.0.0", nodeVersion: "v22.18.0" } },
  })),
  getWalletBalance: vi.fn(async () => ({
    ok: true,
    stdout: { data: { totalValue: "16.50", chains: [] } },
  })),
  getCliDoctorDiagnostics: vi.fn(() => ({
    status: "HEALTHY",
    authenticated: true,
    initialized: true,
    cliVersion: "1.0.0",
    nodeVersion: "v22.18.0",
    cliPath: "/opt/metamask-agent/mm",
    walletBalanceEth: "16.50",
    tokenExpiresAt: Date.now() + 86400000,
    detail: "Healthy",
  })),
  parseJwtExpiration: vi.fn(() => Date.now() + 86400000),
}));

import { appRouter } from "./routers";
import * as db from "./db";
import * as cli from "./cli";

function createContext(role: "admin" | "user" = "admin", openId = "owner"): TrpcContext {
  return {
    user: {
      id: role === "admin" ? 1 : 2,
      openId,
      email: role === "admin" ? "owner@example.com" : "user@example.com",
      name: role === "admin" ? "Owner" : "Regular User",
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

describe("Arbitrage Status and Manual Preflight Authorization & Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows any public caller to query status without requiring admin role", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });

    const status = await caller.arbitrage.status();
    expect(status.success).toBe(true);
    expect(status.agent.walletAddress).toBeDefined();
    expect(status.agent.cliConnection.sessionValidated).toBe(true);
  });

  it("allows admin to run manual preflight test successfully", async () => {
    const caller = appRouter.createCaller(createContext("admin", "owner"));

    const res = await caller.arbitrage.runManualPreflightTest({ network: "base" });
    expect(res.success).toBe(true);
    expect(res.ready).toBe(true);
    expect(res.executionArmed).toBe(false);
    expect(res.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "CLI Binary Available", passed: true }),
        expect.objectContaining({ name: "Token Configured", passed: true }),
        expect.objectContaining({ name: "Session Validated", passed: true }),
      ])
    );
  });

  it("blocks non-admin users from running manual preflight test with FORBIDDEN error", async () => {
    const caller = appRouter.createCaller(createContext("user", "not-owner"));

    await expect(caller.arbitrage.runManualPreflightTest({ network: "base" })).rejects.toThrowError(
      /Only owner\/admin can run manual preflight tests/i
    );
  });

  it("gracefully reports unavailable binary and unvalidated session in preflight checks when CLI is missing", async () => {
    vi.mocked(cli.isMetaMaskCliAvailable).mockReturnValue(false);
    const originalToken = process.env.MM_CLI_TOKEN;
    delete process.env.MM_CLI_TOKEN;
    vi.mocked(db.getAgentStateKey).mockImplementation(async (key: string) => {
      if (key === "mm_cli_token") return null;
      if (key === "mm_cli_session_validated") return "false";
      if (key === "execution_enabled") return "false";
      return null;
    });

    const caller = appRouter.createCaller(createContext("admin", "owner"));
    const res = await caller.arbitrage.runManualPreflightTest({ network: "base" });

    expect(res.success).toBe(true);
    expect(res.ready).toBe(false);
    expect(res.checks.find(c => c.name === "CLI Binary Available")?.passed).toBe(false);
    expect(res.checks.find(c => c.name === "Token Configured")?.passed).toBe(false);
    expect(res.checks.find(c => c.name === "Session Validated")?.passed).toBe(false);
    expect(res.message).toMatch(/Preflight check failed/i);
    if (originalToken) process.env.MM_CLI_TOKEN = originalToken;
  });
});
