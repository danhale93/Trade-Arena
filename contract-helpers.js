/**
 * contract-helpers.js
 * Minimal helper layer to support server.js endpoints.
 *
 * NOTE: This file is intentionally lightweight to unblock live wiring.
 * Expand with production-grade caching, ABI coverage, and error translation.
 */

const { ethers } = require('ethers');

// --------------------
// Supported ABIs
// --------------------

const ABIS = {
  ERC20: [
    'function balanceOf(address owner) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function decimals() view returns (uint8)'
  ],

  // Uniswap V3 router ABI fragment used in server.js
  UNISWAP_V3_ROUTER: [
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)'
  ],

  // Aave V3 pool ABI fragment
  AAVE_POOL: [
    'function getUserAccountData(address user) view returns (uint256 totalCollateralBase,uint256 totalDebtBase,uint256 availableBorrowsBase,uint256 currentLiquidationThreshold,uint256 ltv,uint256 healthFactor)'
  ]
};

// --------------------
// Token registry
// --------------------
// Add more tokens as needed. Symbols must match frontend usage.

const TOKENS = {
  WETH: { symbol: 'WETH', address: '0x4200000000000000000000000000000000000006', decimals: 18, coingeckoId: 'ethereum' },
  USDC: { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6, coingeckoId: 'usd-coin' },
  ARB:  { symbol: 'ARB',  address: '0x912CE59144191C1204E64559FE8253a0e49E654', decimals: 18, coingeckoId: 'arbitrum' },
  OP:   { symbol: 'OP',   address: '0x4200000000000000000000000000000000000042', decimals: 18, coingeckoId: 'optimism' },

  DAI:  { symbol: 'DAI',  address: '0xFf795577d9AC8bD7D90b73f1f58c5c97b73b1233', decimals: 18, coingeckoId: 'dai' },

  // Common meme tokens (examples). Verify addresses before live trading.
  PEPE: { symbol: 'PEPE', address: '0x6982508145454Ce325ddbe47a25d4ec3d2311933', decimals: 18 },
  DOGE: { symbol: 'DOGE', address: '0xF6fF1b5a4b7cD1A7f0cF9B6eD8aB4a2B9bC0f0c1', decimals: 18 },
  BTC:  { symbol: 'BTC',  address: '0x0000000000000000000000000000000000000000', decimals: 8 },
  SOL:  { symbol: 'SOL',  address: '0x0000000000000000000000000000000000000000', decimals: 8 },
  MATIC:{ symbol: 'MATIC',address:'0x0000000000000000000000000000000000000000', decimals: 18 },
  BONK: { symbol: 'BONK', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
  FLOKI: { symbol: 'FLOKI', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
  WIF:  { symbol: 'WIF',  address: '0x0000000000000000000000000000000000000000', decimals: 18 }
};

// --------------------
// Protocol constants
// --------------------

const PROTOCOLS = {
  UNISWAP_V3: {
    // Base mainnet Uniswap v3 router/quoter/factory
    router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    quoter: '0x3fC91A3afd70395Cd496C6477dC6a9dD39fCCf1F',
    factory: '0x33128a8fC17869897dcE68fB6c0f9d5cB1' // placeholder, may be overridden elsewhere
  },
  SUSHISWAP: {
    router: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'
  },
  AAVE_V3: {
    pool: '0x87870Bca3F3fD6335C3F ' // placeholder, must be verified
  },
};

// --------------------
// Utility classes
// --------------------

class SecurityHelper {
  static isAddress(addr) {
    return typeof addr === 'string' && /^0x[a-fA-F0-9]{40}$/.test(addr);
  }
}

class ArbitrageAnalyzer {
  static calculateArbitrage(minEntry, maxEntry, amount, gasPriceGwei) {
    const profitRaw = (maxEntry - minEntry) * amount;
    // This is a simplified fee model for UI purposes.
    const totalFees = (profitRaw > 0 ? profitRaw * 0.01 : Math.abs(profitRaw) * 0.01) + gasPriceGwei * 0.000000001;
    const netProfit = profitRaw - totalFees;
    const profitPercent = minEntry > 0 ? (maxEntry - minEntry) / minEntry * 100 : 0;
    const isViable = netProfit > 0;
    return { netProfit, totalFees, profitPercent, isViable };
  }
}

// ContractHelper is used heavily by server.js for token detail + swap estimation + approvals.
class ContractHelper {
  constructor(provider, signer) {
    this.provider = provider;
    this.signer = signer;
  }

  getTokenDetails(symbolOrAddress) {
    // server.js sometimes calls with token addresses directly.
    if (!symbolOrAddress) return null;
    if (typeof symbolOrAddress === 'string' && /^0x[a-fA-F0-9]{40}$/.test(symbolOrAddress)) {
      // Find by address
      const hit = Object.values(TOKENS).find(t => t.address.toLowerCase() === symbolOrAddress.toLowerCase());
      return hit ? { ...hit } : null;
    }
    const sym = symbolOrAddress.toString().toUpperCase();
    return TOKENS[sym] || null;
  }

  async approveToken(tokenAddress, spender, amount) {
    if (!this.signer) throw new Error('Signer required for approveToken');
    const erc20 = new ethers.Contract(tokenAddress, ABIS.ERC20, this.signer);
    const tx = await erc20.approve(spender, amount);
    await tx.wait();
    return tx;
  }

  async estimateSwap(tokenInDetails, tokenOutDetails, amountInWei) {
    if (!this.provider) throw new Error('Provider required for estimateSwap');
    // Server.js expects we estimate using Uniswap V3 quoter. We’ll do quoteExactInputSingle if possible.
    const quoter = new ethers.Contract(
      PROTOCOLS.UNISWAP_V3.quoter,
      ['function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn) external returns (uint256 amountOut)'],
      this.provider
    );

    // Try common fee tiers
    const fees = [500, 3000, 10000];
    for (const fee of fees) {
      try {
        const out = await quoter.quoteExactInputSingle(
          tokenInDetails.address,
          tokenOutDetails.address,
          fee,
          amountInWei
        );
        if (out && out.gt(0)) return out;
      } catch (_) {}
    }

    return ethers.BigNumber.from(0);
  }

  getSwapPath(tokenInDetails, tokenOutDetails) {
    // server.js uses swapExactTokensForTokens(path). For a simple single-hop we can use 2-token path.
    return [tokenInDetails.address, tokenOutDetails.address];
  }
}

module.exports = {
  ContractHelper,
  SecurityHelper,
  ArbitrageAnalyzer,
  TOKENS,
  PROTOCOLS,
  ABIS
};

