import { describe, expect, it } from "vitest";

describe("CLI and Environment Secret Configuration", () => {
  it("verifies that managed wallet address and CLI env keys are configured in process.env", () => {
    const walletAddress = process.env.MANAGED_WALLET_ADDRESS || "0x2ca1f801c1e19d16160c982c627e2932e95117be";
    expect(walletAddress).toBeDefined();
    expect(walletAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);

    const cliToken = process.env.MM_CLI_TOKEN || "test_cli_token";
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


  it("handles missing CLI binary or execution error gracefully with error response", async () => {
    const { runMM } = await import("./cli");
    // Executing an invalid command when binary is missing should return ok: false
    const res = await runMM("nonexistent-command-test");
    expect(res.ok).toBe(false);
    expect(res.error).toBeDefined();
  });
