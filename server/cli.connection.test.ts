import { describe, expect, it } from "vitest";
import { getMetaMaskAgentConnectionStatus, getMetaMaskCliPath } from "./cli";

describe("MetaMask Agent connection status", () => {
  it("resolves the CLI path from MM_PATH when configured", () => {
    const original = process.env.MM_PATH;
    process.env.MM_PATH = "/opt/metamask-agent/mm";
    expect(getMetaMaskCliPath()).toBe("/opt/metamask-agent/mm");
    if (original === undefined) delete process.env.MM_PATH;
    else process.env.MM_PATH = original;
  });

  it("reports disconnected when no token is configured", () => {
    expect(
      getMetaMaskAgentConnectionStatus({
        tokenConfigured: false,
        cliAvailable: true,
        sessionValidated: true,
      }),
    ).toMatchObject({
      status: "disconnected",
      label: "DISCONNECTED",
      reason: "No MetaMask Agent token is configured.",
    });
  });

  it("reports disconnected when the CLI binary is unavailable", () => {
    expect(
      getMetaMaskAgentConnectionStatus({
        tokenConfigured: true,
        cliAvailable: false,
        sessionValidated: true,
      }),
    ).toMatchObject({
      status: "disconnected",
      label: "DISCONNECTED",
        reason: expect.stringContaining("Install it or set MM_PATH to an executable path."),
    });
  });

  it("reports disconnected when a configured token has not been validated", () => {
    expect(
      getMetaMaskAgentConnectionStatus({
        tokenConfigured: true,
        cliAvailable: true,
        sessionValidated: false,
      }),
    ).toMatchObject({
      status: "disconnected",
      label: "DISCONNECTED",
      reason: "The token is configured but has not been validated by the MetaMask Agent CLI.",
    });
  });

  it("reports connected only after the token is validated by an available CLI", () => {
    expect(
      getMetaMaskAgentConnectionStatus({
        tokenConfigured: true,
        cliAvailable: true,
        sessionValidated: true,
      }),
    ).toMatchObject({
      status: "connected",
      label: "CONNECTED",
      reason: "The MetaMask Agent CLI session was successfully validated.",
    });
  });
});
