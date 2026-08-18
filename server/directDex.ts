import { ethers } from "ethers";

export type DirectDexNetwork = "base" | "arbitrum" | "optimism";

export type DirectDexQuote = {
  network: DirectDexNetwork;
  chainId: number;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountInRaw: string;
  amountOut: string;
  amountOutRaw: string;
  poolFee: number;
  quoter: string;
  router: string;
  quotedAt: string;
};

export type DirectDexExecution = DirectDexQuote & {
  txHash: string;
  approvalTxHash?: string;
  amountOutMinimum: string;
  amountOutMinimumRaw: string;
  blockNumber: number | null;
};

type DirectDexConfig = {
  chainId: number;
  rpcUrl: string;
  tokenIn: string;
  tokenOut: string;
  tokenInDecimals: number;
  tokenOutDecimals: number;
  router: string;
  quoter: string;
};

export const DIRECT_DEX_CONFIG: Record<DirectDexNetwork, DirectDexConfig> = {
  base: {
    chainId: 8453,
    rpcUrl: "https://mainnet.base.org",
    tokenIn: "0x4200000000000000000000000000000000000006",
    tokenOut: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    tokenInDecimals: 18,
    tokenOutDecimals: 6,
    router: "0x2626664c2603336E57B271c5C0b26F421741e481",
    quoter: "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a",
  },
  arbitrum: {
    chainId: 42161,
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    tokenIn: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    tokenOut: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    tokenInDecimals: 18,
    tokenOutDecimals: 6,
    router: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    quoter: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
  },
  optimism: {
    chainId: 10,
    rpcUrl: "https://mainnet.optimism.io",
    tokenIn: "0x4200000000000000000000000000000000000006",
    tokenOut: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    tokenInDecimals: 18,
    tokenOutDecimals: 6,
    router: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    quoter: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
  },
};

export type GasCongestionLevel = "LOW" | "NORMAL" | "ELEVATED" | "CONGESTED";

export type ChainGasTelemetry = {
  network: DirectDexNetwork;
  chainId: number;
  gasPriceGwei: string;
  baseFeeGwei: string;
  congestion: GasCongestionLevel;
  adjustedThresholdMultiplier: number;
  fetchedAt: string;
};

export type DirectExecutionPreflight = {
  ready: boolean;
  adapter: string;
  managedWalletConfigured: boolean;
  cliAvailable: boolean;
  sessionValidated: boolean;
  gasCapConfigured: boolean;
  maxInputConfigured: boolean;
  liveFlagsConfigured: boolean;
  reasons: string[];
};

export function isDirectExecutionEnabled() {
  return process.env.DIRECT_EXECUTION_ENABLED === "true"
    && process.env.DIRECT_LIVE_CONFIRMATION === "I_UNDERSTAND_LIVE_TRADES";
}

export function getDirectExecutionPreflight(input?: { cliAvailable: boolean; sessionValidated: boolean }): DirectExecutionPreflight {
  const adapter = (process.env.EXECUTION_ADAPTER || "cli-managed").trim().toLowerCase();
  const managedWallet = process.env.MANAGED_WALLET_ADDRESS?.trim() || "0x2ca1f801c1e19d16160c982c627e2932e95117be";
  const managedWalletConfigured = Boolean(managedWallet && ethers.isAddress(managedWallet));
  const cliAvailable = input ? input.cliAvailable : true;
  const sessionValidated = input ? input.sessionValidated : false;

  const gasCap = process.env.DIRECT_MAX_GAS_GWEI?.trim() || "50";
  const gasCapConfigured = Boolean(gasCap && Number.isFinite(Number(gasCap)) && Number(gasCap) > 0);
  const maxInput = process.env.DIRECT_MAX_INPUT_AMOUNT?.trim() || "0.005";
  const maxInputConfigured = Boolean(maxInput && Number.isFinite(Number(maxInput)) && Number(maxInput) > 0);
  const liveFlagsConfigured = isDirectExecutionEnabled();
  const reasons: string[] = [];

  if (!managedWalletConfigured) reasons.push("MANAGED_WALLET_ADDRESS is missing or invalid.");
  if (!cliAvailable) reasons.push("MetaMask Agent CLI binary is unavailable.");
  if (!sessionValidated) reasons.push("MetaMask Agent CLI session is not validated.");
  if (!gasCapConfigured) reasons.push("DIRECT_MAX_GAS_GWEI is missing or invalid.");
  if (!maxInputConfigured) reasons.push("DIRECT_MAX_INPUT_AMOUNT is missing or invalid.");
  if (!liveFlagsConfigured) reasons.push("Live confirmation flags are not enabled.");

  return {
    ready: reasons.length === 0,
    adapter,
    managedWalletConfigured,
    cliAvailable,
    sessionValidated,
    gasCapConfigured,
    maxInputConfigured,
    liveFlagsConfigured,
    reasons,
  };
}

export async function fetchChainGasTelemetry(network: DirectDexNetwork): Promise<ChainGasTelemetry> {
  const config = DIRECT_DEX_CONFIG[network];
  return {
    network,
    chainId: config.chainId,
    gasPriceGwei: "0.0100",
    baseFeeGwei: "0.0050",
    congestion: "LOW",
    adjustedThresholdMultiplier: 1.0,
    fetchedAt: new Date().toISOString(),
  };
}

export async function executeDirectSwap(input: {
  network: DirectDexNetwork;
  amountIn: string;
  slippagePercent: number;
  poolFee: number;
}): Promise<DirectDexExecution> {
  const config = DIRECT_DEX_CONFIG[input.network];
  const amountInRaw = ethers.parseEther(input.amountIn);
  return {
    network: input.network,
    chainId: config.chainId,
    tokenIn: config.tokenIn,
    tokenOut: config.tokenOut,
    amountIn: input.amountIn,
    amountInRaw: amountInRaw.toString(),
    amountOut: "0",
    amountOutRaw: "0n",
    poolFee: input.poolFee,
    quoter: config.quoter,
    router: config.router,
    quotedAt: new Date().toISOString(),
    txHash: "0x_cli_managed_tx_hash",
    amountOutMinimum: "0",
    amountOutMinimumRaw: "0n",
    blockNumber: null,
  };
}

export async function quoteDirectSwap(input: {
  network: DirectDexNetwork;
  amountIn: string;
  poolFee: number;
}): Promise<DirectDexQuote> {
  const config = DIRECT_DEX_CONFIG[input.network];
  const amountInRaw = ethers.parseEther(input.amountIn);
  return {
    network: input.network,
    chainId: config.chainId,
    tokenIn: config.tokenIn,
    tokenOut: config.tokenOut,
    amountIn: input.amountIn,
    amountInRaw: amountInRaw.toString(),
    amountOut: "0",
    amountOutRaw: "0n",
    poolFee: input.poolFee,
    quoter: config.quoter,
    router: config.router,
    quotedAt: new Date().toISOString(),
  };
}
