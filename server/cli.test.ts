import { describe, expect, it } from "vitest";

describe("CLI and Environment Secret Configuration", () => {
  it("verifies that managed wallet address and CLI env keys are configured in process.env", () => {
    const walletAddress = process.env.MANAGED_WALLET_ADDRESS;
    expect(walletAddress).toBeDefined();
    if (walletAddress) {
      expect(walletAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    }

    // MM_CLI_TOKEN should be configured (even if masked or placeholder during tests)
    const cliToken = process.env.MM_CLI_TOKEN;
    expect(cliToken).toBeDefined();
  });
});
