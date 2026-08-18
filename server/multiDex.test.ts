import { describe, expect, it } from "vitest";
import { MULTI_DEX_REGISTRIES, buildMultiDexSwapCalldata, getCrossDexSpreadSimulation } from "./multiDex";

describe("Multi-DEX Arbitrage & Calldata Builder", () => {
  it("contains at least two DEX sources for Base, Arbitrum, and Optimism", () => {
    for (const net of ["base", "arbitrum", "optimism"]) {
      const reg = MULTI_DEX_REGISTRIES[net];
      expect(reg).toBeDefined();
      expect(reg.dexes.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("builds valid exactInputSingle calldata for SwapRouter02", () => {
    const calldata = buildMultiDexSwapCalldata({
      tokenIn: "0x4200000000000000000000000000000000000006",
      tokenOut: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
      amountIn: "10000000000000000",
      amountOutMinimum: "9900000",
      recipient: "0x2ca1f801c1e19d16160c982c627e2932e95117be",
      feeTier: 500,
    });
    expect(typeof calldata).toBe("string");
    expect(calldata.startsWith("0x")).toBe(true);
    expect(calldata.length).toBeGreaterThan(10);
  });

  it("simulates cross-DEX spreads correctly", () => {
    const sim = getCrossDexSpreadSimulation("base", "WETH", "USDC", "1000000000000000000");
    expect(sim).toHaveProperty("profitable");
    expect(sim.spreadBps).toBe(35);
    expect(sim.primaryDex).toBe("Uniswap V3 Base");
    expect(sim.secondaryDex).toBe("Aerodrome SlipStream (CL)");
  });
});
