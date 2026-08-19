import { describe, expect, it } from "vitest";
import { filterContainerLogs, type AgentLogEntry } from "./containerLogViewer";

describe("container log viewer level filtering", () => {
  const sampleLogs: AgentLogEntry[] = [
    { id: 1, level: "INFO", category: "SIMULATION", message: "Simulating route on base", details: "WETH -> USDC", createdAt: new Date().toISOString() },
    { id: 2, level: "WARN", category: "EXECUTION", message: "Gas price elevated", details: "above 45 gwei", createdAt: new Date().toISOString() },
    { id: 3, level: "ERROR", category: "EXECUTION", message: "MetaMask Agent CLI binary is unavailable", details: "node_modules/.bin/mm missing", createdAt: new Date().toISOString() },
    { id: 4, level: "SUCCESS", category: "SETTLEMENT", message: "Docker container healthcheck passed", details: "port 3000 responsive", createdAt: new Date().toISOString() },
  ];

  it("filters logs by explicit log level", () => {
    const warnLogs = filterContainerLogs(sampleLogs, { activeTab: "ALL", levelFilter: "WARN", searchQuery: "", autoScroll: true });
    expect(warnLogs).toHaveLength(1);
    expect(warnLogs[0].level).toBe("WARN");

    const successLogs = filterContainerLogs(sampleLogs, { activeTab: "ALL", levelFilter: "SUCCESS", searchQuery: "", autoScroll: true });
    expect(successLogs).toHaveLength(1);
    expect(successLogs[0].level).toBe("SUCCESS");
  });

  it("combines tab category and log level filters", () => {
    const combined = filterContainerLogs(sampleLogs, { activeTab: "ERROR", levelFilter: "ERROR", searchQuery: "", autoScroll: true });
    expect(combined).toHaveLength(1);
    expect(combined[0].id).toBe(3);
  });
});
