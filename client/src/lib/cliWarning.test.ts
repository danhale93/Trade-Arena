import { describe, expect, it } from "vitest";
import { buildCliWarningToast } from "./cliWarning";

describe("CLI warning toast", () => {
  it("confirms secure save and exposes a retry action", () => {
    expect(buildCliWarningToast({
      message: "Token saved securely in vault.",
      warning: "CLI binary unavailable.",
    })).toEqual({
      title: "Token saved securely in vault.",
      description: "CLI binary unavailable.",
      actionLabel: "Retry Connection",
    });
  });

  it("provides safe defaults when structured fields are absent", () => {
    expect(buildCliWarningToast({})).toMatchObject({
      title: expect.stringContaining("Token saved securely"),
      description: expect.stringContaining("validation is still pending"),
      actionLabel: "Retry Connection",
    });
  });
});
