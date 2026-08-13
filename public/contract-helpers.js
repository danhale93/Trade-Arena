/**
 * Smart Contract Configuration & Deployment Helpers
 * Contains contract addresses, ABIs, and interaction utilities
 */

// Base Network Configuration
var BASE_CONFIG = {
    chainId: 8453,
    name: 'Base Mainnet',
    rpcUrl: 'https://base-mainnet.g.alchemy.com/v2/3zUWwmlHTQNjmM55sV2X0', // Fallback
    blockExplorerUrl: 'https://basescan.org',
    currency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18
    }
};

// Token Addresses on Base
var TOKENS = {
    WETH: {
        address: '0x4200000000000000000000000000000000000006',
        symbol: 'WETH',
        decimals: 18,
        name: 'Wrapped Ethereum'
    },
    USDC: {
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        symbol: 'USDC',
        decimals: 6,
        name: 'USD Coin'
    },
    USDbC: {
        address: '0xd9aAEc860b8293fb2064Ef2953eF989f7f72396f',
        symbol: 'USDbC',
        decimals: 6,
        name: 'USD Base Coin'
    },
    DAI: {
        address: '0x50c5725949A6F48849662A6be79b833364E4661F',
        symbol: 'DAI',
        decimals: 18,
        name: 'Dai Stablecoin'
    },
    ARB: {
        address: '0x608D0fC37bDb7Cc6d1e3e7e4f2c0db5e9f0b0e7E',
        symbol: 'ARB',
        decimals: 18,
        name: 'Arbitrum'
    },
    OP: {
        address: '0x4200000000000000000000000000000000000042',
        symbol: 'OP',
        decimals: 18,
        name: 'Optimism'
    },
    BTC: {
        address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', // cbBTC
        symbol: 'cbBTC',
        decimals: 8,
        name: 'Coinbase Wrapped BTC'
    },
    WBTC: {
        address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', // Aliasing WBTC to cbBTC for liquidity
        symbol: 'cbBTC',
        decimals: 8,
        name: 'Coinbase Wrapped BTC'
    },
    SOL: {
        address: '0x29683838D64aB2eB75757d59048a60f9e15f3366',
        symbol: 'SOL',
        decimals: 9,
        name: 'Wormhole SOL'
    },
    PEPE: {
        address: '0x698dc45e4f10966f6d1d98e3bfd7071d8144c233',
        symbol: 'PEPE',
        decimals: 18,
        name: 'Pepe on Base'
    },
    AERO: {
        address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
        symbol: 'AERO',
        decimals: 18,
        name: 'Aerodrome'
    },
    DOGE: {
        address: '0xafb89a09d82fbde58f18ac6437b3fc81724e4df6',
        symbol: 'DOG',
        decimals: 18,
        name: 'Own The Doge'
    }
};

/**
 * Robust Token Address Resolver
 */
function getTokenAddress(symbol) {
    if (!symbol) return null;
    const s = symbol.toUpperCase();
    if (TOKENS[s]) return TOKENS[s].address;
    const aliases = {
        'ETH': TOKENS.WETH.address,
        'WETH': TOKENS.WETH.address,
        'USDC': TOKENS.USDC.address,
        'BTC': TOKENS.BTC.address,
        'WBTC': TOKENS.BTC.address,
        'CBETHER': TOKENS.WETH.address,
    };
    if (aliases[s]) return aliases[s];
    if (symbol.startsWith('0x')) return symbol;
    return null;
}

// DEX & Protocol Addresses on Base
var PROTOCOLS = {
    UNISWAP_V3: {
        name: 'Uniswap V3',
        router: '0x68b3465833fb72B5A828cCEA02FFAD6bCFB8ACBA',
        factory: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
        quoter: '0xB048bbc1Ee6b733FFfCFb9e9CeF7375518e6C026'
    },
    AAVE_V3: {
        name: 'Aave V3',
        pool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
        lendingPool: '0xe20fCBdBfFC4Dd138cE8b763582e8335c29F9015',
        flashLoanFee: 0.0009
    }
};

// Contract ABIs
var ABIS = {
    ERC20: [
        'function balanceOf(address account) public view returns (uint256)',
        'function approve(address spender, uint256 amount) public returns (bool)',
        'function transfer(address to, uint256 amount) public returns (bool)',
        'function transferFrom(address from, address to, uint256 amount) public returns (bool)',
        'function allowance(address owner, address spender) public view returns (uint256)',
        'function decimals() public view returns (uint8)',
        'function symbol() public view returns (string)',
        'function name() public view returns (string)'
    ],
    UNISWAP_V3_ROUTER: [
        'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) public returns (uint256[] memory amounts)',
        'function getAmountsOut(uint256 amountIn, address[] calldata path) public view returns (uint256[] memory amounts)'
    ],
    AAVE_POOL: [
        'function flashLoan(address receiver, address token, uint256 amount, bytes calldata params) public'
    ]
};

/**
 * Helper Class for Smart Contract Interactions
 */
class ContractHelper {
    constructor(provider, signer) {
        this.provider = provider;
        this.signer = signer;
    }

    async getTokenBalance(tokenAddress, userAddress) {
        const ethers = typeof window !== 'undefined' ? window.ethers : require('ethers');
        const contract = new ethers.Contract(tokenAddress, ABIS.ERC20, this.provider);
        return await contract.balanceOf(userAddress);
    }

    async approveToken(tokenAddress, spenderAddress, amount) {
        const ethers = typeof window !== 'undefined' ? window.ethers : require('ethers');
        const contract = new ethers.Contract(tokenAddress, ABIS.ERC20, this.signer);
        const tx = await contract.approve(spenderAddress, amount);
        return await tx.wait();
    }

    async executeSwap(tokenIn, tokenOut, amountIn, slippage = 0.5) {
        const ethers = typeof window !== 'undefined' ? window.ethers : require('ethers');
        const router = new ethers.Contract(PROTOCOLS.UNISWAP_V3.router, ABIS.UNISWAP_V3_ROUTER, this.signer);
        const deadline = Math.floor(Date.now() / 1000) + 3600;
        const tx = await router.swapExactTokensForTokens(amountIn, 0n, [tokenIn, tokenOut], await this.signer.getAddress(), deadline);
        return await tx.wait();
    }
}

/**
 * MEV & Security Utilities
 */
class SecurityHelper {
    static isStablecoin(tokenSymbol) {
        const stablecoins = ['USDC', 'USDT', 'DAI', 'USDbC', 'FRAX'];
        return stablecoins.includes(tokenSymbol);
    }

    static analyzeMEVRisk(swapDetails) {
        let riskScore = 0;
        if (swapDetails.amountIn > 10) riskScore += 30;
        if (swapDetails.volatility > 5) riskScore += 20;
        if (swapDetails.liquidity < 100000) riskScore += 40;
        return {
            riskScore: Math.min(100, riskScore),
            recommendation: riskScore > 50 ? 'WAIT' : 'PROCEED'
        };
    }

    static estimateSlippage(amountIn, liquidity, volatility) {
        const baseSlippage = (amountIn / liquidity) * 100;
        const volatilityAdjustment = Math.sqrt(volatility) * 0.1;
        return Math.min(10, Math.max(0.1, baseSlippage + volatilityAdjustment));
    }

    static validateContractInteraction(contractAddress, methodName, params) {
        return {
            valid: /^0x[a-fA-F0-9]{40}$/.test(contractAddress) && Boolean(methodName) && Array.isArray(params)
        };
    }
}

/**
 * Arbitrage Opportunity Analyzer
 */
class ArbitrageAnalyzer {
    static calculateArbitrage(buyPrice, sellPrice, amountUSD, gasPrice = 50) {
        const buyFee = amountUSD * 0.005;
        const sellFee = amountUSD * 0.005;
        const grossProfit = (sellPrice - buyPrice) * (amountUSD / buyPrice);
        const netProfit = grossProfit - (buyFee + sellFee);
        return {
            netProfit,
            profitPercent: (netProfit / amountUSD) * 100
        };
    }

    static findTriangularArbitrage(tokenA, tokenB, tokenC, amount) {
        return {
            path: [tokenA, tokenB, tokenC, tokenA],
            expectedProfit: 0.05,
            isViable: true
        };
    }
}

/**
 * Flash Loan Simulator
 */
class FlashLoanSimulator {
    static simulateFlashLoan(borrowedAmount, expectedProfitPercent) {
        const fee = borrowedAmount * 0.0009;
        const grossProfit = borrowedAmount * (expectedProfitPercent / 100);
        const netProfit = grossProfit - fee;
        return {
            borrowedAmount,
            fee,
            netProfit,
            roi: (netProfit / borrowedAmount) * 100
        };
    }

    static simulateLiquidation(collateral, debt, price) {
        return {
            liquidatable: true,
            profit: 100
        };
    }

    static simulateSandwich(frontRun, victim, backRun) {
        return {
            totalProfit: 50
        };
    }
}

// Browser Globals
if (typeof window !== 'undefined') {
    window.BASE_CONFIG = BASE_CONFIG;
    window.TOKENS = TOKENS;
    window.PROTOCOLS = PROTOCOLS;
    window.ABIS = ABIS;
    window.getTokenAddress = getTokenAddress;
    window.ContractHelper = ContractHelper;
    window.SecurityHelper = SecurityHelper;
    window.ArbitrageAnalyzer = ArbitrageAnalyzer;
    window.FlashLoanSimulator = FlashLoanSimulator;
}

// Node.js Exports
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BASE_CONFIG,
        TOKENS,
        PROTOCOLS,
        ABIS,
        getTokenAddress,
        ContractHelper,
        SecurityHelper,
        ArbitrageAnalyzer,
        FlashLoanSimulator
    };
}
