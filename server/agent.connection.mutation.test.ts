import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getAgentStateKey: vi.fn(async (key: string) => (key === "mm_cli_token" ? "test-token" : null)),
  setAgentStateKey: vi.fn(async () => undefined),
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
  logoutSession: vi.fn(async () => true),
}));

import { appRouter } from "./routers";
import * as db from "./db";
import * as cli from "./cli";

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

  it("reports the runtime path and keeps validation false when reconnect lacks the CLI binary", async () => {
    vi.mocked(cli.isMetaMaskCliAvailable).mockReturnValue(false);
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(caller.arbitrage.reconnectAgent()).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("unavailable at /opt/metamask-agent/mm"),
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
