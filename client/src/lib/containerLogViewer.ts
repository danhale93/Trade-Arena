export type AgentLogEntry = {
  id: number;
  level: "INFO" | "SUCCESS" | "WARN" | "ERROR";
  category: string;
  message: string;
  details?: string | null;
  createdAt: string;
};

export type LogLevelFilter = "ALL" | "INFO" | "SUCCESS" | "WARN" | "ERROR";

export type ContainerLogViewerState = {
  activeTab: "ALL" | "EXECUTION" | "SIMULATION" | "ERROR" | "DOCKER";
  levelFilter: LogLevelFilter;
  searchQuery: string;
  autoScroll: boolean;
};

export function filterContainerLogs(logs: AgentLogEntry[], state: ContainerLogViewerState) {
  const query = state.searchQuery.trim().toLowerCase();
  return logs.filter((log) => {
    // Tab category filtering
    if (state.activeTab === "EXECUTION" && log.category !== "EXECUTION" && log.category !== "SETTLEMENT") return false;
    if (state.activeTab === "SIMULATION" && log.category !== "SIMULATION") return false;
    if (state.activeTab === "ERROR" && log.level !== "ERROR" && log.level !== "WARN") return false;
    if (state.activeTab === "DOCKER" && !log.message.toLowerCase().includes("docker") && !log.message.toLowerCase().includes("cli")) return false;

    // Log level explicit filtering
    if (state.levelFilter !== "ALL" && log.level !== state.levelFilter) {
      return false;
    }

    // Search query filtering
    if (!query) return true;
    const matchesMsg = log.message.toLowerCase().includes(query);
    const matchesCat = log.category.toLowerCase().includes(query);
    const matchesDetails = log.details ? log.details.toLowerCase().includes(query) : false;
    return matchesMsg || matchesCat || matchesDetails;
  });
}
