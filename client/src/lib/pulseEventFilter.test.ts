import { describe, expect, it } from "vitest";
import { filterPulseEvents, getPulseEventFilterLabel } from "./pulseEventFilter";

describe("pulse event network filters", () => {
  const events = [
    { id: 1, network: "base" },
    { id: 2, network: "arbitrum" },
    { id: 3, network: "base" },
  ];

  it("returns all events for the ALL filter", () => {
    expect(filterPulseEvents(events, "ALL")).toEqual(events);
  });

  it("returns only rows for the selected network", () => {
    expect(filterPulseEvents(events, "base").map((event) => event.id)).toEqual([1, 3]);
    expect(filterPulseEvents(events, "optimism")).toEqual([]);
  });

  it("provides accessible filter labels", () => {
    expect(getPulseEventFilterLabel("ALL")).toBe("ALL NETWORKS");
    expect(getPulseEventFilterLabel("arbitrum")).toBe("ARBITRUM ONLY");
  });
});
