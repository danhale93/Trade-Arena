"use strict";

const { applyRiskControls } = require("./arb-risk-engine.js");

const DEFAULT_FLASH_ARB_CONFIG = {
  flashLoanFeeRate: 0.0009,
  minNetProfitUSD: 10,
  minROI: 0.0015,
  defaultGasUSD: 3,
  mevBufferUSD: 2,
  maxQuoteAgeMs: 3000,
  maxBorrowUSD: 250000,
  minLiquidityUSD: 50000,
};

function calculateFlashLoanArb({ borrowAmountUSD, buyQuote, sellQuote, config = {} }) {
  const cfg = { ...DEFAULT_FLASH_ARB_CONFIG, ...config };
  const amount = Number(borrowAmountUSD || 0);
  const buyOut = Number(buyQuote?.amountOut || 0);
  const finalOut = Number(sellQuote?.amountOut || 0);
  const flashLoanFeeUSD = amount * cfg.flashLoanFeeRate;
  const gasUSD = Number(cfg.gasUSD ?? cfg.defaultGasUSD);
  const slippageUSD = Number(buyQuote?.slippageUSD || 0) + Number(sellQuote?.slippageUSD || 0);
  const mevBufferUSD = Number(cfg.mevBufferUSD || 0);
  const grossProfitUSD = finalOut - amount;
  const netProfitUSD = grossProfitUSD - flashLoanFeeUSD - gasUSD - slippageUSD - mevBufferUSD;
  const roi = amount > 0 ? netProfitUSD / amount : 0;

  return {
    borrowAmountUSD: amount,
    intermediateAmount: buyOut,
    finalAmountUSD: finalOut,
    grossProfitUSD,
    flashLoanFeeUSD,
    gasUSD,
    slippageUSD,
    mevBufferUSD,
    netProfitUSD,
    roi,
    isViable: netProfitUSD >= cfg.minNetProfitUSD && roi >= cfg.minROI,
  };
}

function quoteIsFresh(quote, now, maxQuoteAgeMs) {
  if (!quote?.timestamp) return true;
  return now - quote.timestamp <= maxQuoteAgeMs;
}

function buildRoutes(tokens, dexes) {
  const routes = [];
  for (const borrowToken of tokens) {
    for (const intermediateToken of tokens) {
      if (borrowToken.symbol === intermediateToken.symbol) continue;
      for (const buyDex of dexes) {
        for (const sellDex of dexes) {
          if (buyDex === sellDex) continue;
          routes.push({ borrowToken, intermediateToken, buyDex, sellDex });
        }
      }
    }
  }
  return routes;
}

async function scanCrossDexFlashArb({
  quoteProvider,
  tokens = [],
  dexes = [],
  borrowAmountsUSD = [100],
  riskState = null,
  config = {},
  now = Date.now(),
} = {}) {
  if (typeof quoteProvider !== "function") {
    throw new Error("scanCrossDexFlashArb requires an injected quoteProvider");
  }

  const cfg = { ...DEFAULT_FLASH_ARB_CONFIG, ...config };
  const routes = buildRoutes(tokens, dexes);
  const tasks = [];

  for (const route of routes) {
    for (const borrowAmountUSD of borrowAmountsUSD) {
      if (borrowAmountUSD > cfg.maxBorrowUSD) continue;

      // ⚡ Bolt Optimization: Process each route & borrow amount combination concurrently
      tasks.push((async () => {
        try {
          const buyQuote = await quoteProvider({
            dex: route.buyDex,
            tokenIn: route.borrowToken,
            tokenOut: route.intermediateToken,
            amountIn: borrowAmountUSD,
            side: "buy",
          });
          if (!quoteIsFresh(buyQuote, now, cfg.maxQuoteAgeMs)) return null;

          const sellQuote = await quoteProvider({
            dex: route.sellDex,
            tokenIn: route.intermediateToken,
            tokenOut: route.borrowToken,
            amountIn: buyQuote.amountOut,
            side: "sell",
          });
          if (!quoteIsFresh(sellQuote, now, cfg.maxQuoteAgeMs)) return null;

          const minLiquidity = Math.min(
            Number(buyQuote.liquidityUSD || Infinity),
            Number(sellQuote.liquidityUSD || Infinity),
          );
          const economics = calculateFlashLoanArb({ borrowAmountUSD, buyQuote, sellQuote, config: cfg });
          const opportunity = {
            id: `flash-${route.borrowToken.symbol}-${route.intermediateToken.symbol}-${route.buyDex}-${route.sellDex}-${borrowAmountUSD}`,
            type: "FLASH_LOAN_DEX_ARB",
            strategy: "CROSS_DEX_FLASH_LOAN_ARB",
            chain: cfg.chain || "base",
            borrowToken: route.borrowToken.symbol,
            intermediateToken: route.intermediateToken.symbol,
            borrowAmountUSD,
            route: [
              `${route.borrowToken.symbol} -> ${route.intermediateToken.symbol} on ${route.buyDex}`,
              `${route.intermediateToken.symbol} -> ${route.borrowToken.symbol} on ${route.sellDex}`,
            ],
            buyDex: route.buyDex,
            sellDex: route.sellDex,
            liquidityUSD: Number.isFinite(minLiquidity) ? minLiquidity : 0,
            netEdge: economics.roi,
            recommendedSizeUSD: borrowAmountUSD,
            executionMode: "FLASH_LOAN",
            dryRunOnly: true,
            ...economics,
          };

          const risk = riskState
            ? applyRiskControls(
                opportunity,
                riskState,
                { minNetProfitUSD: cfg.minNetProfitUSD, minNetEdge: cfg.minROI },
                now,
              )
            : { approved: economics.isViable, reasons: [] };

          opportunity.risk = risk;
          opportunity.status = risk.approved && economics.isViable ? "CANDIDATE" : "REJECTED";
          if (opportunity.liquidityUSD && opportunity.liquidityUSD < cfg.minLiquidityUSD) {
            opportunity.status = "REJECTED";
            opportunity.risk.reasons = [...(opportunity.risk.reasons || []), "liquidity_below_minimum"];
          }

          return opportunity;
        } catch (error) {
          console.error(`Error processing path ${route.borrowToken.symbol} -> ${route.intermediateToken.symbol}:`, error);
          return null;
        }
      })());
    }
  }

  const results = await Promise.all(tasks);
  const opportunities = results.filter(Boolean);
  return opportunities.sort((a, b) => b.netProfitUSD - a.netProfitUSD);
}

module.exports = {
  DEFAULT_FLASH_ARB_CONFIG,
  calculateFlashLoanArb,
  buildRoutes,
  scanCrossDexFlashArb,
};
