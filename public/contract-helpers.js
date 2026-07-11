/**
 * Smart Contract Configuration & Deployment Helpers
 * Contains contract addresses, ABIs, and interaction utilities
 */

const BASE_SEPOLIA_CONFIG = {
  chainId: 84532,
  name: "Base Sepolia",
  rpcUrl: "https://sepolia.base.org",
  blockExplorerUrl: "https://sepolia.basescan.org",
  currency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
};

const BASE_CONFIG = {
  chainId: 8453,
  name: "Base Mainnet",
  rpcUrl: "https://mainnet.base.org",
  blockExplorerUrl: "https://basescan.org",
  currency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
};

// Token Addresses (Network Aware)
const NETWORK_TOKENS = {
  8453: { // Mainnet
    WETH: { address: "0x4200000000000000000000000000000000000006", symbol: "WETH", decimals: 18, name: "Wrapped Ethereum" },
    USDC: { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", symbol: "USDC", decimals: 6, name: "USD Coin" },
    USDbC: { address: "0xd9aAEc860b8293fb2064Ef2953eF989f7f72396f", symbol: "USDbC", decimals: 6, name: "USD Base Coin" },
  },
  84532: { // Sepolia
    WETH: { address: "0x4200000000000000000000000000000000000006", symbol: "WETH", decimals: 18, name: "Wrapped Ethereum" },
    USDC: { address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", symbol: "USDC", decimals: 6, name: "USD Coin" },
    CBETH: { address: "0x2Ae3F1Ec7F1F5012CFEab018507e126dee250199", symbol: "cbETH", decimals: 18, name: "Coinbase Wrapped Staked ETH" },
    DAI: { address: "0x1256338bE51e70e1762294158F28373979808389", symbol: "DAI", decimals: 18, name: "Dai Stablecoin" }
  }
};

var TOKENS = NETWORK_TOKENS[8453]; // Default to mainnet

const NETWORK_PROTOCOLS = {
  8453: { // Mainnet
    UNISWAP_V3: { name: "Uniswap V3", router: "0x68b3465833fb72B5A828cCEA02FFAD6bCFB8ACBA", factory: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD", quoter: "0xB048bbc1Ee6b733FFfCFb9e9CeF7375518e6C026" },
    AAVE_V3: { name: "Aave V3", pool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD", flashLoanFee: 0.0009 },
  },
  84532: { // Sepolia
    UNISWAP_V3: { name: "Uniswap V3", router: "0x3bFA4769FB09eefC5a80d6E87c3B91650a7646a5", factory: "0x0227628f9F02343C44553D5b3591740164054D3F", quoter: "0xEdF1c9da31230214881ad99935a8567160ad6b09" },
    AAVE_V3: { name: "Aave V3", pool: "0x07eA79F68B2B3df564D0A34F8e19D9B1e339814b", flashLoanFee: 0.0009 },
  }
};

var PROTOCOLS = NETWORK_PROTOCOLS[8453]; // Default to mainnet

// Contract ABIs (Simplified)
const ABIS = {
  ERC20: [
    "function balanceOf(address account) public view returns (uint256)",
    "function approve(address spender, uint256 amount) public returns (bool)",
    "function transfer(address to, uint256 amount) public returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) public returns (bool)",
    "function allowance(address owner, address spender) public view returns (uint256)",
    "function decimals() public view returns (uint8)",
    "function symbol() public view returns (string)",
    "function name() public view returns (string)",
  ],

  UNISWAP_V3_ROUTER: [
    "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) public returns (uint256[] memory amounts)",
    "function swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, address[] calldata path, address to, uint256 deadline) public returns (uint256[] memory amounts)",
    "function getAmountsOut(uint256 amountIn, address[] calldata path) public view returns (uint256[] memory amounts)",
    "function getAmountsIn(uint256 amountOut, address[] calldata path) public view returns (uint256[] memory amounts)",
  ],

  AAVE_POOL: [
    "function flashLoan(address receiver, address token, uint256 amount, bytes calldata params) public",
    "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) public",
    "function withdraw(address asset, uint256 amount, address to) public returns (uint256)",
    "function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) public",
    "function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf) public returns (uint256)",
  ],

  FLASH_LOAN_RECEIVER: [
    "function executeOperation(address asset, uint256 amount, uint256 premium, address initiator, bytes calldata params) external returns (bytes32)",
    "function ADDRESSES_PROVIDER() external view returns (address)",
  ],
};

/**
 * Helper Class for Smart Contract Interactions
 */
class ContractHelper {
  /**
   * Switch helper context to a specific network
   */
  static switchNetwork(chainId) {
    if (NETWORK_TOKENS[chainId]) {
      TOKENS = NETWORK_TOKENS[chainId];
      PROTOCOLS = NETWORK_PROTOCOLS[chainId];
      return true;
    }
    return false;
  }

  constructor(provider, signer) {
    this.provider = provider;
    this.signer = signer;
  }

  /**
   * Get token balance for an address
   */
  async getTokenBalance(tokenAddress, userAddress) {
    const contract = new ethers.Contract(
      tokenAddress,
      ABIS.ERC20,
      this.provider,
    );

    const balance = await contract.balanceOf(userAddress);
    return balance;
  }

  /**
   * Approve token spending
   */
  async approveToken(tokenAddress, spenderAddress, amount) {
    const contract = new ethers.Contract(tokenAddress, ABIS.ERC20, this.signer);

    const tx = await contract.approve(spenderAddress, amount);
    const receipt = await tx.wait();
    return receipt;
  }

  /**
   * Get optimal path for swap
   */
  async getSwapPath(tokenIn, tokenOut, intermediateToken = null) {
    const paths = {
      direct: [tokenIn.address, tokenOut.address],
      viaUsdc: intermediateToken
        ? [tokenIn.address, intermediateToken.address, tokenOut.address]
        : null,
    };
    return paths.direct;
  }

  /**
   * Estimate swap output
   */
  async estimateSwap(tokenIn, tokenOut, amountIn) {
    const router = new ethers.Contract(
      PROTOCOLS.UNISWAP_V3.router,
      ABIS.UNISWAP_V3_ROUTER,
      this.provider,
    );
    const path = await this.getSwapPath(tokenIn, tokenOut);
    try {
      const amounts = await router.getAmountsOut(amountIn, path);
      return amounts[amounts.length - 1];
    } catch (e) {
      console.error("Swap estimation failed:", e);
      return ethers.BigNumber ? ethers.BigNumber.from(0) : BigInt(0);
    }
  }

  /**
   * Execute swap on Uniswap V3
   */
  async executeSwap(tokenIn, tokenOut, amountIn, slippage = 0.5) {
    const router = new ethers.Contract(
      PROTOCOLS.UNISWAP_V3.router,
      ABIS.UNISWAP_V3_ROUTER,
      this.signer,
    );
    const path = await this.getSwapPath(tokenIn, tokenOut);
    const estimatedOut = await this.estimateSwap(tokenIn, tokenOut, amountIn);

    let minOut;
    if (typeof estimatedOut.mul === 'function') {
        minOut = estimatedOut.mul(10000 - Math.floor(slippage * 100)).div(10000);
    } else {
        minOut = (estimatedOut * BigInt(10000 - Math.floor(slippage * 100))) / BigInt(10000);
    }

    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const tx = await router.swapExactTokensForTokens(
      amountIn,
      minOut,
      path,
      await this.signer.getAddress(),
      deadline,
    );
    return await tx.wait();
  }

  /**
   * Request flash loan from Aave
   */
  async requestFlashLoan(tokenAddress, loanAmount, callbackData) {
    const aavePool = new ethers.Contract(
      PROTOCOLS.AAVE_V3.pool,
      ABIS.AAVE_POOL,
      this.signer,
    );
    const tx = await aavePool.flashLoan(
      await this.signer.getAddress(),
      tokenAddress,
      loanAmount,
      callbackData,
    );
    return await tx.wait();
  }

  isStablecoin(tokenSymbol) {
    const stablecoins = ["USDC", "USDT", "DAI", "USDbC", "FRAX"];
    return stablecoins.includes(tokenSymbol);
  }

  getTokenDetails(tokenAddress) {
    for (const [key, token] of Object.entries(TOKENS)) {
      if (token.address.toLowerCase() === tokenAddress.toLowerCase()) {
        return token;
      }
    }
    return null;
  }
}

/**
 * MEV & Security Utilities
 */
class SecurityHelper {
  static isStablecoin(tokenSymbol) {
    const stablecoins = ["USDC", "USDT", "DAI", "USDbC", "FRAX"];
    return stablecoins.includes(tokenSymbol);
  }
  static analyzeMEVRisk(swapDetails) {
    const largeSwapThreshold = 10;
    let riskScore = 0;
    let warnings = [];
    if (swapDetails.amountIn > largeSwapThreshold) {
      riskScore += 30;
      warnings.push("Large swap amount - higher MEV risk");
    }
    if (swapDetails.volatility > 5) {
      riskScore += 20;
      warnings.push("High volatility token - increased slippage risk");
    }
    if (swapDetails.liquidity < 100000) {
      riskScore += 40;
      warnings.push("Low liquidity pool - execution risk");
    }
    return {
      riskScore: Math.min(100, riskScore),
      warnings,
      recommendation: riskScore > 50 ? "WAIT" : "PROCEED",
    };
  }
  static estimateSlippage(amountIn, liquidity, volatility) {
    const baseSlippage = (amountIn / liquidity) * 100;
    const volatilityAdjustment = Math.sqrt(volatility) * 0.1;
    const totalSlippage = baseSlippage + volatilityAdjustment;
    return Math.min(10, Math.max(0.1, totalSlippage));
  }
  static validateContractInteraction(contractAddress, methodName, params) {
    const validations = {
      isValidAddress: /^0x[a-fA-F0-9]{40}$/.test(contractAddress),
      methodExists: Boolean(methodName),
      paramsValid: Array.isArray(params),
    };
    return {
      valid: Object.values(validations).every((v) => v),
      details: validations,
    };
  }
}

/**
 * Arbitrage Opportunity Analyzer
 */
class ArbitrageAnalyzer {
  static calculateArbitrage(buyPrice, sellPrice, amountUSD, gasPrice = 50) {
    const gasEstimate = 150000;
    const gasCost = (gasPrice * gasEstimate) / 1e9;
    const gasCostUSD = gasCost * buyPrice;
    const buyFee = amountUSD * 0.005;
    const sellFee = amountUSD * 0.005;
    const totalFees = buyFee + sellFee + gasCostUSD;
    const grossProfit = (sellPrice - buyPrice) * (amountUSD / buyPrice);
    const netProfit = grossProfit - totalFees;
    const profitPercent = (netProfit / amountUSD) * 100;
    return {
      grossProfit: grossProfit.toFixed(4),
      totalFees: totalFees.toFixed(4),
      netProfit: netProfit.toFixed(4),
      profitPercent: profitPercent.toFixed(2),
      isViable: netProfit > 0,
    };
  }
  static findTriangularArbitrage(prices) {
    const product = Object.values(prices).reduce((a, b) => a * b, 1);
    const profit = (product - 1) * 100;
    return {
      opportunity: product > 1,
      profitPercent: profit.toFixed(2),
      path: Object.keys(prices),
    };
  }
}

/**
 * Flash Loan Strategy Simulator
 */
class FlashLoanSimulator {
  static simulateLiquidation(borrowedAmount, targetDebtAmount, collateralPrice) {
    const flashLoanFee = borrowedAmount * 0.0009;
    const liquidationBonus = targetDebtAmount * 0.05;
    const profit = liquidationBonus - flashLoanFee;
    return {
      borrowedAmount,
      flashLoanFee: flashLoanFee.toFixed(4),
      liquidationBonus: liquidationBonus.toFixed(4),
      profit: profit.toFixed(4),
      roi: ((profit / borrowedAmount) * 100).toFixed(2),
    };
  }
  static simulateSandwich(frontRunAmount, victimAmount, backRunAmount) {
    const frontRunProfit = (victimAmount * 0.01 * frontRunAmount) / 100;
    const backRunProfit = (backRunAmount * 0.01) / 100;
    const totalProfit = frontRunProfit + backRunProfit;
    return {
      frontRunAmount,
      victimAmount,
      backRunAmount,
      totalProfit: totalProfit.toFixed(4),
      roi: ((totalProfit / (frontRunAmount + backRunAmount)) * 100).toFixed(2),
    };
  }
}

// Export for use in Node.js
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    BASE_CONFIG,
    TOKENS,
    PROTOCOLS,
    ABIS,
    ContractHelper,
    SecurityHelper,
    ArbitrageAnalyzer,
    FlashLoanSimulator,
  };
}
