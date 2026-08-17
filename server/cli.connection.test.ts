import { describe, expect, it } from "vitest";
import { getMetaMaskAgentConnectionStatus } from "./cli";

describe("MetaMask Agent connection status", () => {
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
      reason: "The MetaMask Agent CLI binary is unavailable in this runtime.",
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
