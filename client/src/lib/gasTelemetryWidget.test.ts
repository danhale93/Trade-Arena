import { describe, expect, it } from "vitest";
import { formatGasReading, formatTelemetryTime, getGasCongestionModel } from "./gasTelemetryWidget";

describe("gas telemetry widget display model", () => {
  it("maps each congestion band to a distinct visual state", () => {
    expect(getGasCongestionModel("LOW")).toMatchObject({ label: "LOW", widthClass: "w-1/4" });
    expect(getGasCongestionModel("NORMAL")).toMatchObject({ label: "NORMAL", widthClass: "w-2/4" });
    expect(getGasCongestionModel("ELEVATED")).toMatchObject({ label: "ELEVATED", widthClass: "w-3/4" });
    expect(getGasCongestionModel("CONGESTED")).toMatchObject({ label: "CONGESTED", widthClass: "w-full" });
    expect(getGasCongestionModel("DEGRADED")).toMatchObject({ label: "DEGRADED", widthClass: "w-1/4" });
  });

  it("formats small and normal gas readings without fabricating missing values", () => {
    expect(formatGasReading("0.0054321")).toBe("0.0054");
    expect(formatGasReading("1.2345")).toBe("1.23");
    expect(formatGasReading(null)).toBe("—");
    expect(formatGasReading("not-a-number")).toBe("not-a-number");
  });

  it("formats valid telemetry timestamps and handles missing data", () => {
    expect(formatTelemetryTime(undefined)).toBe("WAITING FOR REFRESH");
    expect(formatTelemetryTime("invalid-date")).toBe("TIME UNAVAILABLE");
    expect(formatTelemetryTime("2026-08-19T12:34:56.000Z")).not.toBe("TIME UNAVAILABLE");
  });
});
