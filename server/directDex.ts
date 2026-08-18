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

const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function allowance(address owner,address spender) view returns (uint256)",
  "function approve(address spender,uint256 amount) returns (bool)",
];

// SwapRouter02 uses the IV3SwapRouter exactInputSingle shape (no deadline field).
const SWAP_ROUTER_ABI = [
  "function exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96) params) payable returns (uint256 amountOut)",
];

// QuoterV2 uses a single struct argument and returns quote metadata alongside amountOut.
const QUOTER_V2_ABI = [
  "function quoteExactInputSingle((address tokenIn,address tokenOut,uint256 amountIn,uint24 fee,uint160 sqrtPriceLimitX96) params) returns (uint256 amountOut,uint160 sqrtPriceX96After,uint32 initializedTicksCrossed,uint256 gasEstimate)",
];

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

function getRpcUrl(network: DirectDexNetwork, config: DirectDexConfig) {
  const envKey = `${network.toUpperCase()}_RPC_URL` as "BASE_RPC_URL" | "ARBITRUM_RPC_URL" | "OPTIMISM_RPC_URL";
  return process.env[envKey]?.trim() || config.rpcUrl;
}

export function getDirectDexConfig(network: DirectDexNetwork) {
  return DIRECT_DEX_CONFIG[network];
}

export function isDirectExecutionEnabled() {
  return process.env.DIRECT_EXECUTION_ENABLED === "true"
    && process.env.DIRECT_LIVE_CONFIRMATION === "I_UNDERSTAND_LIVE_TRADES";
}

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
  signerConfigured: boolean;
  signerMatchesManagedWallet: boolean;
  gasCapConfigured: boolean;
  maxInputConfigured: boolean;
  liveFlagsConfigured: boolean;
  reasons: string[];
};

export function getDirectExecutionPreflight(): DirectExecutionPreflight {
  const adapter = (process.env.EXECUTION_ADAPTER || "direct").trim().toLowerCase();
  const managedWallet = process.env.MANAGED_WALLET_ADDRESS?.trim() || "";
  const managedWalletConfigured = Boolean(managedWallet && ethers.isAddress(managedWallet));
  const privateKey = process.env.DIRECT_EVM_SIGNER_PRIVATE_KEY?.trim() || "";
  const signerConfigured = Boolean(privateKey);
  let signerMatchesManagedWallet = false;

  if (signerConfigured && managedWalletConfigured) {
    try {
      signerMatchesManagedWallet = ethers.getAddress(new ethers.Wallet(privateKey).address) === ethers.getAddress(managedWallet);
    } catch {
      signerMatchesManagedWallet = false;
    }
  }

  const gasCap = process.env.DIRECT_MAX_GAS_GWEI?.trim() || "";
  const gasCapConfigured = Boolean(gasCap && Number.isFinite(Number(gasCap)) && Number(gasCap) > 0);
  const maxInput = process.env.DIRECT_MAX_INPUT_AMOUNT?.trim() || "";
  const maxInputConfigured = Boolean(maxInput && Number.isFinite(Number(maxInput)) && Number(maxInput) > 0);
  const liveFlagsConfigured = isDirectExecutionEnabled();
  const reasons: string[] = [];

  if (adapter !== "direct") reasons.push("The direct Ethers.js adapter is not selected.");
  if (!managedWalletConfigured) reasons.push("MANAGED_WALLET_ADDRESS is missing or invalid.");
  if (!signerConfigured) reasons.push("DIRECT_EVM_SIGNER_PRIVATE_KEY is not configured.");
  else if (!signerMatchesManagedWallet) reasons.push("The direct signer does not match MANAGED_WALLET_ADDRESS.");
  if (!gasCapConfigured) reasons.push("DIRECT_MAX_GAS_GWEI is missing or invalid.");
  if (!maxInputConfigured) reasons.push("DIRECT_MAX_INPUT_AMOUNT is missing or invalid.");
  if (!liveFlagsConfigured) reasons.push("Live confirmation flags are not enabled.");

  return {
    ready: reasons.length === 0,
    adapter,
    managedWalletConfigured,
    signerConfigured,
    signerMatchesManagedWallet,
    gasCapConfigured,
    maxInputConfigured,
    liveFlagsConfigured,
    reasons,
  };
}

export async function fetchChainGasTelemetry(network: DirectDexNetwork): Promise<ChainGasTelemetry> {
  const config = DIRECT_DEX_CONFIG[network];
  const rpcUrl = getRpcUrl(network, config);
  const provider = new ethers.JsonRpcProvider(rpcUrl, config.chainId, { staticNetwork: true });

  try {
    const [feeData, block] = await Promise.all([
      provider.getFeeData(),
      provider.getBlock("latest"),
    ]);

    const gasPriceWei = feeData.gasPrice ?? block?.baseFeePerGas ?? BigInt(1_000_000_000);
    const baseFeeWei = block?.baseFeePerGas ?? gasPriceWei;

    const gasPriceGweiNum = Number(ethers.formatUnits(gasPriceWei, "gwei"));
    const baseFeeGweiNum = Number(ethers.formatUnits(baseFeeWei, "gwei"));

    let congestion: GasCongestionLevel = "NORMAL";
    let multiplier = 1.0;

    // L2-specific thresholds (Base, Arbitrum, Optimism typically have low base fees < 0.1 gwei in normal conditions)
    if (baseFeeGweiNum > 0.5) {
      congestion = "CONGESTED";
      multiplier = 2.2;
    } else if (baseFeeGweiNum > 0.2) {
      congestion = "ELEVATED";
      multiplier = 1.5;
    } else if (baseFeeGweiNum < 0.01) {
      congestion = "LOW";
      multiplier = 0.9;
    } else {
      congestion = "NORMAL";
      multiplier = 1.0;
    }

    return {
      network,
      chainId: config.chainId,
      gasPriceGwei: gasPriceGweiNum.toFixed(4),
      baseFeeGwei: baseFeeGweiNum.toFixed(4),
      congestion,
      adjustedThresholdMultiplier: multiplier,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      network,
      chainId: config.chainId,
      gasPriceGwei: "0.0000",
      baseFeeGwei: "0.0000",
      congestion: "DEGRADED" as GasCongestionLevel,
      adjustedThresholdMultiplier: 1.0,
      fetchedAt: new Date().toISOString(),
    };
  }
}

function normalizePoolFee(poolFee = 3000) {
  if (!Number.isInteger(poolFee) || poolFee < 1 || poolFee > 1_000_000) {
    throw new Error("Uniswap V3 pool fee must be an integer between 1 and 1,000,000.");
  }
  return poolFee;
}

export function calculateAmountOutMinimum(amountOutRaw: bigint, slippagePercent: number) {
  if (!Number.isFinite(slippagePercent) || slippagePercent < 0 || slippagePercent >= 100) {
    throw new Error("Slippage must be at least 0% and less than 100%.");
  }
  const slippageBps = BigInt(Math.round(slippagePercent * 100));
  const basisPoints = BigInt(10_000);
  return amountOutRaw * (basisPoints - slippageBps) / basisPoints;
}

export function buildExactInputSingleParams(input: {
  tokenIn: string;
  tokenOut: string;
  poolFee: number;
  recipient: string;
  amountInRaw: bigint;
  amountOutMinimumRaw: bigint;
}) {
  return {
    tokenIn: ethers.getAddress(input.tokenIn),
    tokenOut: ethers.getAddress(input.tokenOut),
    fee: normalizePoolFee(input.poolFee),
    recipient: ethers.getAddress(input.recipient),
    amountIn: input.amountInRaw,
    amountOutMinimum: input.amountOutMinimumRaw,
    sqrtPriceLimitX96: BigInt(0),
  };
}

function extractAmountOut(result: unknown) {
  const value = (result as { amountOut?: bigint; 0?: bigint } | undefined)?.amountOut
    ?? (result as { 0?: bigint } | undefined)?.[0];
  if (value === undefined) {
    throw new Error("QuoterV2 returned no amountOut value.");
  }
  return BigInt(value);
}

async function getProvider(network: DirectDexNetwork) {
  const config = getDirectDexConfig(network);
  const provider = new ethers.JsonRpcProvider(getRpcUrl(network, config), config.chainId, { staticNetwork: true });
  const actualNetwork = await provider.getNetwork();
  if (Number(actualNetwork.chainId) !== config.chainId) {
    throw new Error(`RPC chain mismatch for ${network}: expected ${config.chainId}, received ${actualNetwork.chainId}.`);
  }

  const contracts = await Promise.all([
    provider.getCode(config.tokenIn),
    provider.getCode(config.tokenOut),
    provider.getCode(config.router),
    provider.getCode(config.quoter),
  ]);
  if (contracts.some((code) => code === "0x")) {
    throw new Error(`Configured token/router/quoter address is not deployed on ${network}.`);
  }
  return { provider, config };
}

export async function quoteDirectSwap(input: {
  network: DirectDexNetwork;
  amountIn: string;
  poolFee?: number;
}): Promise<DirectDexQuote> {
  const { provider, config } = await getProvider(input.network);
  const poolFee = normalizePoolFee(input.poolFee);
  const amountInRaw = ethers.parseUnits(input.amountIn, config.tokenInDecimals);
  const quoter = new ethers.Contract(config.quoter, QUOTER_V2_ABI, provider);
  const quoteParams = {
    tokenIn: config.tokenIn,
    tokenOut: config.tokenOut,
    amountIn: amountInRaw,
    fee: poolFee,
    sqrtPriceLimitX96: BigInt(0),
  };
  const result = await quoter.getFunction("quoteExactInputSingle").staticCall(quoteParams);
  const amountOutRaw = extractAmountOut(result);

  return {
    network: input.network,
    chainId: config.chainId,
    tokenIn: config.tokenIn,
    tokenOut: config.tokenOut,
    amountIn: input.amountIn,
    amountInRaw: amountInRaw.toString(),
    amountOut: ethers.formatUnits(amountOutRaw, config.tokenOutDecimals),
    amountOutRaw: amountOutRaw.toString(),
    poolFee,
    quoter: config.quoter,
    router: config.router,
    quotedAt: new Date().toISOString(),
  };
}

function getConfiguredManagedWallet() {
  const address = process.env.MANAGED_WALLET_ADDRESS?.trim();
  if (!address || !ethers.isAddress(address)) {
    throw new Error("MANAGED_WALLET_ADDRESS is missing or invalid.");
  }
  return ethers.getAddress(address);
}

export function validateSignerAddress(signerAddress: string, managedWalletAddress = getConfiguredManagedWallet()) {
  if (!ethers.isAddress(signerAddress)) {
    throw new Error("Direct signer address is invalid.");
  }
  const normalizedSigner = ethers.getAddress(signerAddress);
  if (normalizedSigner !== managedWalletAddress) {
    throw new Error(`Signer address ${normalizedSigner} does not match MANAGED_WALLET_ADDRESS.`);
  }
  return normalizedSigner;
}

async function getSigner(network: DirectDexNetwork) {
  const privateKey = process.env.DIRECT_EVM_SIGNER_PRIVATE_KEY?.trim();
  if (!privateKey) {
    throw new Error("Direct live execution is unavailable: DIRECT_EVM_SIGNER_PRIVATE_KEY is not configured.");
  }

  const { provider, config } = await getProvider(network);
  const signer = new ethers.Wallet(privateKey, provider);
  validateSignerAddress(signer.address);
  return { signer, provider, config };
}

async function getGasOverrides(provider: ethers.JsonRpcProvider) {
  const maxGasGwei = process.env.DIRECT_MAX_GAS_GWEI?.trim();
  if (!maxGasGwei) {
    throw new Error("Direct live execution is unavailable: DIRECT_MAX_GAS_GWEI is not configured.");
  }
  const maxGasWei = ethers.parseUnits(maxGasGwei, "gwei");
  const feeData = await provider.getFeeData();
  const currentFee = feeData.maxFeePerGas ?? feeData.gasPrice;
  if (currentFee !== null && currentFee > maxGasWei) {
    throw new Error(`Current gas fee ${ethers.formatUnits(currentFee, "gwei")} gwei exceeds configured cap of ${maxGasGwei} gwei.`);
  }

  if (feeData.maxFeePerGas !== null) {
    const priority = feeData.maxPriorityFeePerGas ?? BigInt(0);
    return {
      maxFeePerGas: feeData.maxFeePerGas > maxGasWei ? maxGasWei : feeData.maxFeePerGas,
      maxPriorityFeePerGas: priority > maxGasWei ? maxGasWei : priority,
    };
  }
  return { gasPrice: feeData.gasPrice && feeData.gasPrice > maxGasWei ? maxGasWei : feeData.gasPrice ?? maxGasWei };
}

export async function executeDirectSwap(input: {
  network: DirectDexNetwork;
  amountIn: string;
  slippagePercent: number;
  poolFee?: number;
}): Promise<DirectDexExecution> {
  if (!isDirectExecutionEnabled()) {
    throw new Error("Direct live execution is disabled. Set DIRECT_EXECUTION_ENABLED=true and DIRECT_LIVE_CONFIRMATION=I_UNDERSTAND_LIVE_TRADES after review.");
  }

  const { signer, provider, config } = await getSigner(input.network);
  const maxInputAmount = process.env.DIRECT_MAX_INPUT_AMOUNT?.trim();
  if (!maxInputAmount) {
    throw new Error("Direct live execution is unavailable: DIRECT_MAX_INPUT_AMOUNT is not configured.");
  }
  const amountInRaw = ethers.parseUnits(input.amountIn, config.tokenInDecimals);
  const maxInputRaw = ethers.parseUnits(maxInputAmount, config.tokenInDecimals);
  if (amountInRaw <= BigInt(0) || amountInRaw > maxInputRaw) {
    throw new Error(`Input amount ${input.amountIn} exceeds the configured direct-execution cap of ${maxInputAmount}.`);
  }

  const quote = await quoteDirectSwap({ network: input.network, amountIn: input.amountIn, poolFee: input.poolFee });
  const amountOutRaw = BigInt(quote.amountOutRaw);
  const amountOutMinimumRaw = calculateAmountOutMinimum(amountOutRaw, input.slippagePercent);
  const gasOverrides = await getGasOverrides(provider);
  const tokenIn = new ethers.Contract(config.tokenIn, ERC20_ABI, signer);
  const allowance = BigInt(await tokenIn.getFunction("allowance").staticCall(signer.address, config.router));
  let approvalTxHash: string | undefined;

  if (allowance < amountInRaw) {
    const approvalTx = await tokenIn.getFunction("approve").send(config.router, amountInRaw, gasOverrides);
    const approvalReceipt = await approvalTx.wait();
    if (!approvalReceipt || approvalReceipt.status !== 1) {
      throw new Error("ERC-20 approval transaction did not confirm successfully.");
    }
    approvalTxHash = approvalReceipt.hash;
  }

  const router = new ethers.Contract(config.router, SWAP_ROUTER_ABI, signer);
  const params = buildExactInputSingleParams({
    tokenIn: config.tokenIn,
    tokenOut: config.tokenOut,
    poolFee: quote.poolFee,
    recipient: signer.address,
    amountInRaw,
    amountOutMinimumRaw,
  });
  const swapTx = await router.getFunction("exactInputSingle").send(params, gasOverrides);
  const receipt = await swapTx.wait();
  if (!receipt || receipt.status !== 1) {
    throw new Error("Swap transaction did not confirm successfully.");
  }

  return {
    ...quote,
    txHash: receipt.hash,
    approvalTxHash,
    amountOutMinimum: ethers.formatUnits(amountOutMinimumRaw, config.tokenOutDecimals),
    amountOutMinimumRaw: amountOutMinimumRaw.toString(),
    blockNumber: receipt.blockNumber,
  };
}
