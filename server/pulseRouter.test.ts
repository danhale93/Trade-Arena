import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TrpcContext } from "./_core/context";

const mockDbState = {
  pulseEvents: [] as any[],
  simulations: [] as any[],
};

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getAgentStateKey: vi.fn(async () => null),
    setAgentStateKey: vi.fn(async () => undefined),
    recordAgentLog: vi.fn(async () => undefined),
    getRecentTrades: vi.fn(async () => []),
    getSimulationRouteHistory: vi.fn(async () => mockDbState.simulations),
    getPulseEvents: vi.fn(async () => mockDbState.pulseEvents),
    recordSimulationRoute: vi.fn(async (sim) => {
      mockDbState.simulations.unshift({ id: mockDbState.simulations.length + 1, timestamp: new Date(), ...sim });
    }),
    recordPulseEvent: vi.fn(async (evt) => {
      mockDbState.pulseEvents.unshift({ id: mockDbState.pulseEvents.length + 1, timestamp: new Date(), ...evt });
    }),
    getSuppressedAlerts: vi.fn(async () => []),
    getAgentLogs: vi.fn(async () => []),
  };
});

vi.mock("./directDex", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./directDex")>();
  return {
    ...actual,
    quoteDirectSwap: vi.fn(async () => ({ amountOut: "100.5", netProfit: "0.0557" })),
    getDirectExecutionPreflight: vi.fn(() => ({ ready: false, reasons: [] })),
    fetchChainGasTelemetry: vi.fn(async () => ({ gasPriceGwei: "1.2", congestion: "LOW", multiplier: 1.0, adjustedThresholdMultiplier: 1.0 })),
  };
});

vi.mock("./cli", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./cli")>();
  return {
    ...actual,
    isMetaMaskCliAvailable: vi.fn(() => false),
    getMetaMaskCliPath: vi.fn(() => "/nonexistent/mm"),
    getMetaMaskAgentConnectionStatus: vi.fn(() => ({ status: "disconnected" })),
  };
});

import { appRouter } from "./routers";

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "owner",
      email: "owner@example.com",
      name: "Owner",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("pulse event router integration", () => {
  beforeEach(() => {
    mockDbState.pulseEvents = [];
    mockDbState.simulations = [];
    vi.clearAllMocks();
  });

  it("persists a pulse event when direct simulation profit clears twice the threshold", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const res = await caller.arbitrage.runArbitrageCheck({ network: "base" });
    expect(res.success).toBe(true);
    expect(mockDbState.pulseEvents.length).toBe(1);
    expect(mockDbState.pulseEvents[0]).toMatchObject({
      network: "base",
      netProfitUsd: "0.0557",
    });
  });

  it("exposes pulseEvents through the arbitrage status procedure", async () => {
    mockDbState.pulseEvents = [
      { id: 10, network: "base", route: "WETH -> USDC -> WETH", netProfitUsd: "0.0150", thresholdUsd: "0.0040", source: "cross-dex-model", timestamp: new Date() },
    ];
    const caller = appRouter.createCaller(createAdminContext());
    const status = await caller.arbitrage.status();
    expect(status.agent.pulseEvents.length).toBe(1);
    expect(status.agent.pulseEvents[0].netProfitUsd).toBe("0.0150");
  });
});
