import { describe, expect, it } from "vitest";
import { buildCliWarningToast } from "./cliWarning";
import { CLI_LINKS } from "./cliCommandDeck";

describe("CLI warning toast", () => {
  it("confirms secure save, provides install instruction, official docs link, and retry action", () => {
    const result = buildCliWarningToast({
      message: "Token saved securely in vault.",
      warning: "CLI binary unavailable.",
    });
    expect(result.title).toBe("Token saved securely in vault.");
    expect(result.description).toContain("CLI binary unavailable.");
    expect(result.description).toContain("Install CLI");
    expect(result.installUrl).toBe(CLI_LINKS.docs);
    expect(result.actionLabel).toBe("Retry Connection");
  });

  it("provides safe defaults when structured fields are absent", () => {
    expect(buildCliWarningToast({})).toMatchObject({
      title: expect.stringContaining("Token saved securely"),
      description: expect.stringContaining("validation is still pending"),
      installUrl: CLI_LINKS.docs,
      actionLabel: "Retry Connection",
    });
  });
});
