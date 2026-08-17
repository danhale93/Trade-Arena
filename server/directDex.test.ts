import { afterEach, describe, expect, it } from "vitest";
import { Wallet } from "ethers";
import {
  buildExactInputSingleParams,
  calculateAmountOutMinimum,
  executeDirectSwap,
  isDirectExecutionEnabled,
  validateSignerAddress,
} from "./directDex";

describe("direct Ethers.js DEX adapter", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("calculates the minimum output from the quoted amount and slippage", () => {
    expect(calculateAmountOutMinimum(BigInt(1_000_000), 0.5)).toBe(BigInt(995_000));
    expect(calculateAmountOutMinimum(BigInt(1_000_000), 0)).toBe(BigInt(1_000_000));
  });

  it("builds checksummed exact-input-single parameters", () => {
    const params = buildExactInputSingleParams({
      tokenIn: "0x4200000000000000000000000000000000000006",
      tokenOut: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      poolFee: 3000,
      recipient: "0x2CA1f801c1E19D16160c982c627E2932E95117bE",
      amountInRaw: BigInt("10000000000000000"),
      amountOutMinimumRaw: BigInt("10000000"),
    });

    expect(params).toMatchObject({
      tokenIn: "0x4200000000000000000000000000000000000006",
      tokenOut: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      fee: 3000,
      recipient: "0x2CA1f801c1E19D16160c982c627E2932E95117bE",
      amountIn: BigInt("10000000000000000"),
      amountOutMinimum: BigInt("10000000"),
      sqrtPriceLimitX96: BigInt(0),
    });
  });

  it("rejects a signer that does not match the configured managed wallet", () => {
    const signer = new Wallet(`0x${"11".repeat(32)}`);
    const differentWallet = new Wallet(`0x${"22".repeat(32)}`);
    process.env.MANAGED_WALLET_ADDRESS = differentWallet.address;

    expect(() => validateSignerAddress(signer.address)).toThrow("does not match MANAGED_WALLET_ADDRESS");
  });

  it("accepts a signer that matches the configured managed wallet", () => {
    const signer = new Wallet(`0x${"11".repeat(32)}`);
    process.env.MANAGED_WALLET_ADDRESS = signer.address;

    expect(validateSignerAddress(signer.address)).toBe(signer.address);
  });

  it("requires an explicit live-execution confirmation string", () => {
    process.env.DIRECT_EXECUTION_ENABLED = "true";
    process.env.DIRECT_LIVE_CONFIRMATION = "";
    expect(isDirectExecutionEnabled()).toBe(false);

    process.env.DIRECT_LIVE_CONFIRMATION = "I_UNDERSTAND_LIVE_TRADES";
    expect(isDirectExecutionEnabled()).toBe(true);
  });

  it("does not reach an RPC or broadcast path while live execution is disabled", async () => {
    delete process.env.DIRECT_EXECUTION_ENABLED;
    delete process.env.DIRECT_LIVE_CONFIRMATION;
    await expect(executeDirectSwap({
      network: "base",
      amountIn: "0.01",
      slippagePercent: 0.3,
      poolFee: 3000,
    })).rejects.toThrow("Direct live execution is disabled");
  });
});
