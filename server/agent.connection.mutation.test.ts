import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getAgentStateKey: vi.fn(async (key: string) => (key === "mm_cli_token" ? "test-token" : null)),
  setAgentStateKey: vi.fn(async () => undefined),
  recordAgentLog: vi.fn(async () => undefined),
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
}));

vi.mock("./cli", () => ({
  isMetaMaskCliAvailable: vi.fn(() => true),
  getMetaMaskCliPath: vi.fn(() => "/opt/metamask-agent/mm"),
  getMetaMaskAgentConnectionStatus: vi.fn(() => ({
    status: "disconnected",
    label: "DISCONNECTED",
    tokenConfigured: true,
    cliAvailable: true,
    sessionValidated: false,
    reason: "test",
  })),
  loginWithToken: vi.fn(async () => true),
  validateSession: vi.fn(async () => ({ ok: true, authenticated: true, initialized: true })),
  logoutSession: vi.fn(async () => true),
}));

import { appRouter } from "./routers";
import * as db from "./db";
import * as cli from "./cli";
import * as directDex from "./directDex";

function createContext(role: "admin" | "user" = "admin"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: role === "admin" ? "owner" : "not-owner",
      email: "owner@example.com",
      name: "Owner",
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

describe("MetaMask Agent connection mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cli.isMetaMaskCliAvailable).mockReturnValue(true);
    vi.mocked(cli.getMetaMaskCliPath).mockReturnValue("/opt/metamask-agent/mm");
    vi.mocked(db.getAgentStateKey).mockImplementation(async (key: string) => (key === "mm_cli_token" ? "test-token" : null));
    vi.mocked(cli.loginWithToken).mockResolvedValue(true);
    vi.mocked(cli.validateSession).mockResolvedValue({ ok: true, authenticated: true, initialized: true });
    vi.mocked(cli.logoutSession).mockResolvedValue(true);
  });

  it("reconnects the validated session for an owner", async () => {
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(caller.arbitrage.reconnectAgent()).resolves.toMatchObject({
      success: true,
      connected: true,
    });
    expect(cli.loginWithToken).toHaveBeenCalledWith("test-token");
    expect(db.setAgentStateKey).toHaveBeenNthCalledWith(1, "mm_cli_session_validated", "false");
    expect(db.setAgentStateKey).toHaveBeenNthCalledWith(2, "mm_cli_session_validated", "true");
    expect(db.setAgentStateKey).toHaveBeenNthCalledWith(3, "mm_cli_last_validated_at", expect.stringMatching(/^20\d{2}-\d{2}-\d{2}T/));
  });

  it("rejects a login command that does not produce an authenticated initialized session", async () => {
    vi.mocked(cli.validateSession).mockResolvedValue({
      ok: false,
      authenticated: false,
      initialized: false,
      error: "No CLI refresh token available — run mm login to sign in.",
    });
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(caller.arbitrage.reconnectAgent()).resolves.toMatchObject({
      success: true,
      validated: false,
      warning: expect.stringContaining("No CLI refresh token available"),
    });
    expect(db.setAgentStateKey).toHaveBeenCalledWith("mm_cli_session_validated", "false");
  });

  it("switches an owner to the aggressive strategy profile and persists it", async () => {
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(caller.arbitrage.setStrategyProfile({ profile: "aggressive" })).resolves.toMatchObject({
      success: true,
      strategyProfile: { name: "aggressive", label: "AGGRESSIVE", pollIntervalMs: 3000 },
    });
    expect(db.setAgentStateKey).toHaveBeenCalledWith("strategy_profile", "aggressive");
    expect(db.recordAgentLog).toHaveBeenCalledWith(expect.objectContaining({ category: "STRATEGY" }));
  });

  it("blocks scanner re-enablement while owner-only live execution is armed", async () => {
    vi.mocked(db.getAgentStateKey).mockImplementation(async (key: string) => {
      if (key === "execution_enabled") return "true";
      if (key === "scanner_running") return "false";
      return key === "mm_cli_token" ? "test-token" : null;
    });
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(caller.arbitrage.toggleScanner()).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
      message: expect.stringContaining("Disable live execution before enabling automated scanning."),
    });
    expect(db.setAgentStateKey).not.toHaveBeenCalledWith("scanner_running", "true");
  });

  it("blocks owner live arming when MetaMask Agent session is not validated", async () => {
    vi.mocked(db.getAgentStateKey).mockImplementation(async (key: string) => (key === "mm_cli_session_validated" ? "false" : "test-token"));
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(caller.arbitrage.toggleExecution()).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
      message: expect.stringContaining("MetaMask Agent CLI session is not validated"),
    });
    expect(db.setAgentStateKey).not.toHaveBeenCalledWith("execution_enabled", "true");
  });

  it("returns a success response with warning and keeps validation false when reconnect lacks the CLI binary", async () => {
    vi.mocked(cli.isMetaMaskCliAvailable).mockReturnValue(false);
    const caller = appRouter.createCaller(createContext("admin"));

    const res = await caller.arbitrage.reconnectAgent();
    expect(res).toMatchObject({
      success: true,
      validated: false,
      warning: expect.stringContaining("unavailable at /opt/metamask-agent/mm"),
    });
    expect(cli.loginWithToken).not.toHaveBeenCalled();
    expect(db.setAgentStateKey).toHaveBeenCalledWith("mm_cli_session_validated", "false");
  });

  it("marks the session disconnected after logout", async () => {
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(caller.arbitrage.disconnectAgent()).resolves.toMatchObject({
      success: true,
      connected: false,
      cliLogoutSucceeded: true,
    });
    expect(cli.logoutSession).toHaveBeenCalledOnce();
    expect(db.setAgentStateKey).toHaveBeenCalledWith("mm_cli_session_validated", "false");
  });

  it("rejects reconnect and disconnect requests from non-owners", async () => {
    const caller = appRouter.createCaller(createContext("user"));

    await expect(caller.arbitrage.reconnectAgent()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.arbitrage.disconnectAgent()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(cli.loginWithToken).not.toHaveBeenCalled();
    expect(cli.logoutSession).not.toHaveBeenCalled();
  });
});
