export type PulseNetworkFilter = "ALL" | "base" | "arbitrum" | "optimism";

export function filterPulseEvents<T extends { network: string }>(events: T[], filter: PulseNetworkFilter) {
  return filter === "ALL" ? events : events.filter((event) => event.network === filter);
}

export function getPulseEventFilterLabel(filter: PulseNetworkFilter) {
  return filter === "ALL" ? "ALL NETWORKS" : `${filter.toUpperCase()} ONLY`;
}
