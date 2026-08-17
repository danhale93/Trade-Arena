export type StrategyProfileName = "guarded" | "aggressive";

export type StrategyNetworkConfig = {
  chainId: string;
  tokenIn: "WETH";
  tokenOut: "USDC";
  profitThresholdUsd: number;
  slippage: number;
  poolFee: number;
};

export type StrategyProfile = {
  name: StrategyProfileName;
  label: "GUARDED" | "AGGRESSIVE";
  description: string;
  pollIntervalMs: number;
  maxInputWeth: string;
  maxManualChecksPerMinute: number;
  networks: Record<"base" | "arbitrum" | "optimism", StrategyNetworkConfig>;
};

const GUARDED: StrategyProfile = {
  name: "guarded",
  label: "GUARDED",
  description: "Higher spread filters, lower slippage, and slower manual scanning.",
  pollIntervalMs: 10_000,
  maxInputWeth: "0.005",
  maxManualChecksPerMinute: 6,
  networks: {
    base: { chainId: "8453", tokenIn: "WETH", tokenOut: "USDC", profitThresholdUsd: 0.01, slippage: 0.15, poolFee: 3000 },
    arbitrum: { chainId: "42161", tokenIn: "WETH", tokenOut: "USDC", profitThresholdUsd: 0.02, slippage: 0.25, poolFee: 3000 },
    optimism: { chainId: "10", tokenIn: "WETH", tokenOut: "USDC", profitThresholdUsd: 0.02, slippage: 0.25, poolFee: 3000 },
  },
};

const AGGRESSIVE: StrategyProfile = {
  name: "aggressive",
  label: "AGGRESSIVE",
  description: "Lower spread filters, higher slippage tolerance, and faster manual scanning.",
  pollIntervalMs: 3_000,
  maxInputWeth: "0.01",
  maxManualChecksPerMinute: 20,
  networks: {
    base: { chainId: "8453", tokenIn: "WETH", tokenOut: "USDC", profitThresholdUsd: 0.002, slippage: 0.3, poolFee: 3000 },
    arbitrum: { chainId: "42161", tokenIn: "WETH", tokenOut: "USDC", profitThresholdUsd: 0.01, slippage: 0.5, poolFee: 3000 },
    optimism: { chainId: "10", tokenIn: "WETH", tokenOut: "USDC", profitThresholdUsd: 0.01, slippage: 0.5, poolFee: 3000 },
  },
};

export function getStrategyProfile(name?: string | null): StrategyProfile {
  return name === "aggressive" ? AGGRESSIVE : GUARDED;
}

export function getStrategyProfileNames(): StrategyProfileName[] {
  return ["guarded", "aggressive"];
}
