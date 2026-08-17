import { describe, expect, it } from "vitest";

describe("CLI and Environment Secret Configuration", () => {
  it("verifies that managed wallet address and CLI env keys are configured in process.env", () => {
    const walletAddress = process.env.MANAGED_WALLET_ADDRESS;
    expect(walletAddress).toBeDefined();
    if (walletAddress) {
      expect(walletAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    }

    const cliToken = process.env.MM_CLI_TOKEN;
    expect(cliToken).toBeDefined();
  });

  it("validates minimum profit threshold parsing logic", () => {
    const parseThreshold = (val: string) => {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0.00 : parsed;
    };

    expect(parseThreshold("5.50")).toBe(5.50);
    expect(parseThreshold("abc")).toBe(0.00);
    expect(parseThreshold("0")).toBe(0.00);
  });
});
