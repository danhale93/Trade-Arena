/**
 * Smart Contract Configuration & Deployment Helpers
 * Contains contract addresses, ABIs, and interaction utilities
 */

// Base Network Configuration
const BASE_CONFIG = {
    chainId: 8453,
    name: 'Base Mainnet',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorerUrl: 'https://basescan.org',
    currency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18
    }
};

// Token Addresses on Base
const TOKENS = {
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
    }
};

// DEX & Protocol Addresses on Base
const PROTOCOLS = {
    UNISWAP_V3: {
        name: 'Uniswap V3',
        router: '0x68b3465833fb72B5A828cCEA02FFAD6bCFB8ACBA',
        factory: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
        quoter: '0xB048bbc1Ee6b733FFfCFb9e9CeF7375518e6C026'
    },
    UNISWAP_V4: {
        name: 'Uniswap V4',
        router: '0x540B5387Dab612CF3A70EC0344e1A5051b00C64e'
    },
    SUSHISWAP: {
        name: 'SushiSwap',
        router: '0x6BDED42c6DA8FBf0d2f75cA8480F3521d6D44556',
        factory: '0x71524B4f93c58fcbF659783284E38825f0622859'
    },
    CURVE: {
        name: 'Curve',
        factory: '0xd12eCF9b6f77DAF3cE09C4980f80D17b06D1f5cE'
    },
    AAVE_V3: {
        name: 'Aave V3',
        pool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
        lendingPool: '0xe20fCBdBfFC4Dd138cE8b763582e8335c29F9015',
        flashLoanFee: 0.0009 // 0.09%
    },
    LIDO: {
        name: 'Lido',
        stETH: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452'
    }
};

// Contract ABIs (Simplified)
const ABIS = {
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
        'function swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, address[] calldata path, address to, uint256 deadline) public returns (uint256[] memory amounts)',
        'function getAmountsOut(uint256 amountIn, address[] calldata path) public view returns (uint256[] memory amounts)',
        'function getAmountsIn(uint256 amountOut, address[] calldata path) public view returns (uint256[] memory amounts)'
    ],

    AAVE_POOL: [
        'function flashLoan(address receiver, address token, uint256 amount, bytes calldata params) public',
        'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) public',
        'function withdraw(address asset, uint256 amount, address to) public returns (uint256)',
        'function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) public',
        'function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf) public returns (uint256)'
    ],

    FLASH_LOAN_RECEIVER: [
        'function executeOperation(address asset, uint256 amount, uint256 premium, address initiator, bytes calldata params) external returns (bytes32)',
        'function ADDRESSES_PROVIDER() external view returns (address)'
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

    /**
     * Get token balance for an address
     */
    async getTokenBalance(tokenAddress, userAddress) {
        const contract = new ethers.Contract(
            tokenAddress,
            ABIS.ERC20,
            this.provider
        );

        const balance = await contract.balanceOf(userAddress);
        return balance;
    }

    /**
     * Approve token spending
     */
    async approveToken(tokenAddress, spenderAddress, amount) {
        const contract = new ethers.Contract(
            tokenAddress,
            ABIS.ERC20,
            this.signer
        );

        const tx = await contract.approve(spenderAddress, amount);
        const receipt = await tx.wait();
        return receipt;
    }

    /**
     * Get optimal path for swap
     */
    async getSwapPath(tokenIn, tokenOut, intermediateToken = null) {
        // Common path: WETH <-> USDC for stability
        const paths = {
            direct: [tokenIn.address, tokenOut.address],
            viaUsdc: intermediateToken ? [tokenIn.address, intermediateToken.address, tokenOut.address] : null
        };

        return paths.direct; // Simple implementation
    }

    /**
     * Estimate swap output
     */
    async estimateSwap(tokenIn, tokenOut, amountIn) {
        const router = new ethers.Contract(
            PROTOCOLS.UNISWAP_V3.router,
            ABIS.UNISWAP_V3_ROUTER,
            this.provider
        );

        const path = await this.getSwapPath(tokenIn, tokenOut);
        
        try {
            const amounts = await router.getAmountsOut(amountIn, path);
            return amounts[amounts.length - 1]; // Return output amount
        } catch (e) {
            console.error('Swap estimation failed:', e);
            return ethers.BigNumber.from(0);
        }
    }

    /**
     * Execute swap on Uniswap V3
     */
    async executeSwap(tokenIn, tokenOut, amountIn, slippage = 0.5) {
        const router = new ethers.Contract(
            PROTOCOLS.UNISWAP_V3.router,
            ABIS.UNISWAP_V3_ROUTER,
            this.signer
        );

        const path = await this.getSwapPath(tokenIn, tokenOut);
        const estimatedOut = await this.estimateSwap(tokenIn, tokenOut, amountIn);
        const minOut = estimatedOut.mul(10000 - Math.floor(slippage * 100)).div(10000);

        const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour deadline

        const tx = await router.swapExactTokensForTokens(
            amountIn,
            minOut,
            path,
            await this.signer.getAddress(),
            deadline
        );

        const receipt = await tx.wait();
        return receipt;
    }

    /**
     * Request flash loan from Aave
     */
    async requestFlashLoan(tokenAddress, loanAmount, callbackData) {
        const aavePool = new ethers.Contract(
            PROTOCOLS.AAVE_V3.pool,
            ABIS.AAVE_POOL,
            this.signer
        );

        // In real implementation, would deploy a flash loan receiver contract
        // This is a simplified version
        const tx = await aavePool.flashLoan(
            await this.signer.getAddress(), // receiver (would be contract in production)
            tokenAddress,
            loanAmount,
            callbackData
        );

        const receipt = await tx.wait();
        return receipt;
    }

    /**
     * Check if token is stablecoin
     */
    isStablecoin(tokenSymbol) {
        const stablecoins = ['USDC', 'USDT', 'DAI', 'USDbC', 'FRAX'];
        return stablecoins.includes(tokenSymbol);
    }

    /**
     * Get token details
     */
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
    /**
     * Check if a token symbol is a stablecoin
     * NOTE: Also exists as instance method on ContractHelper for backwards compatibility
     */
    static isStablecoin(tokenSymbol) {
        const stablecoins = ['USDC', 'USDT', 'DAI', 'USDbC', 'FRAX'];
        return stablecoins.includes(tokenSymbol);
    }

    // Instance method alias for convenience
    isStablecoin(tokenSymbol) {
        return SecurityHelper.isStablecoin(tokenSymbol);
    }

    /**
     * Check if transaction might face MEV
     */
    static analyzeMEVRisk(swapDetails) {
        const largeSwapThreshold = 10; // 10 ETH

        let riskScore = 0;
        let warnings = [];

        // Large swap = higher MEV risk
        if (swapDetails.amountIn > largeSwapThreshold) {
            riskScore += 30;
            warnings.push('Large swap amount - higher MEV risk');
        }

        // Volatile token = higher risk
        if (swapDetails.volatility > 5) {
            riskScore += 20;
            warnings.push('High volatility token - increased slippage risk');
        }

        // Low liquidity = higher risk
        if (swapDetails.liquidity < 100000) {
            riskScore += 40;
            warnings.push('Low liquidity pool - execution risk');
        }

        return {
            riskScore: Math.min(100, riskScore),
            warnings,
            recommendation: riskScore > 50 ? 'WAIT' : 'PROCEED'
        };
    }

    /**
     * Estimate slippage for a swap
     */
    static estimateSlippage(amountIn, liquidity, volatility) {
        const baseSlippage = (amountIn / liquidity) * 100;
        const volatilityAdjustment = Math.sqrt(volatility) * 0.1;
        const totalSlippage = baseSlippage + volatilityAdjustment;

        return Math.min(10, Math.max(0.1, totalSlippage)); // 0.1% - 10%
    }

    /**
     * Validate smart contract interaction
     */
    static validateContractInteraction(contractAddress, methodName, params) {
        const validations = {
            isValidAddress: /^0x[a-fA-F0-9]{40}$/.test(contractAddress),
            methodExists: Boolean(methodName),
            paramsValid: Array.isArray(params)
        };

        return {
            valid: Object.values(validations).every(v => v),
            details: validations
        };
    }
}

/**
 * Arbitrage Opportunity Analyzer
 */
class ArbitrageAnalyzer {
    /**
     * Calculate arbitrage profit considering all fees
     */
    static calculateArbitrage(buyPrice, sellPrice, amountUSD, gasPrice = 0.05) {
        // gasPrice in Gwei — default 0.05 Gwei for Base L2 (was 50 Gwei for Ethereum mainnet)
        // Base network gas is ~0.001–0.1 Gwei, making small arb trades viable
        const gasEstimate = 150000; // Gas units
        const gasCost = (gasPrice * gasEstimate) / 1e9; // Convert to ETH
        const gasCostUSD = gasCost * buyPrice; // Convert to USD

        const buyFee = amountUSD * 0.005; // 0.5% buy fee
        const sellFee = amountUSD * 0.005; // 0.5% sell fee
        const totalFees = buyFee + sellFee + gasCostUSD;

        const grossProfit = (sellPrice - buyPrice) * (amountUSD / buyPrice);
        const netProfit = grossProfit - totalFees;
        const profitPercent = (netProfit / amountUSD) * 100;

        return {
            grossProfit: grossProfit.toFixed(4),
            totalFees: totalFees.toFixed(4),
            netProfit: netProfit.toFixed(4),
            profitPercent: profitPercent.toFixed(2),
            isViable: netProfit > 0
        };
    }

    /**
     * Find triangular arbitrage opportunity
     */
    static findTriangularArbitrage(prices) {
        // prices = { 'ETH/USD': 2500, 'USD/USDC': 1, 'USDC/ETH': 0.0004 }
        const product = Object.values(prices).reduce((a, b) => a * b, 1);
        const profit = (product - 1) * 100;

        return {
            opportunity: product > 1,
            profitPercent: profit.toFixed(2),
            path: Object.keys(prices)
        };
    }
}

/**
 * Flash Loan Strategy Simulator
 */
class FlashLoanSimulator {
    /**
     * Simulate liquidation profit
     */
    static simulateLiquidation(borrowedAmount, targetDebtAmount, collateralPrice) {
        const flashLoanFee = borrowedAmount * PROTOCOLS.AAVE_V3.flashLoanFee;
        const liquidationBonus = targetDebtAmount * 0.05; // 5% liquidation bonus
        const profit = liquidationBonus - flashLoanFee;

        return {
            borrowedAmount,
            flashLoanFee: flashLoanFee.toFixed(4),
            liquidationBonus: liquidationBonus.toFixed(4),
            profit: profit.toFixed(4),
            roi: ((profit / borrowedAmount) * 100).toFixed(2)
        };
    }

    /**
     * MEV sandwich attack simulation
     */
    static simulateSandwich(frontRunAmount, victimAmount, backRunAmount) {
        const frontRunPrice = 1.0;
        const victimPrice = 1.01; // Victim's trade increases price
        const backRunPrice = 1.02;

        const frontRunProfit = (victimAmount * 0.01 * frontRunAmount) / 100;
        const backRunProfit = (backRunAmount * 0.01) / 100;
        const totalProfit = frontRunProfit + backRunProfit;

        return {
            frontRunAmount,
            victimAmount,
            backRunAmount,
            totalProfit: totalProfit.toFixed(4),
            roi: ((totalProfit / (frontRunAmount + backRunAmount)) * 100).toFixed(2)
        };
    }
}

// Export for use in Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BASE_CONFIG,
        TOKENS,
        PROTOCOLS,
        ABIS,
        ContractHelper,
        SecurityHelper,
        ArbitrageAnalyzer,
        FlashLoanSimulator
    };
}
