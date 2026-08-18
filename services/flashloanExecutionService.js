/**
 * flashloanExecutionService.js
 *
 * Bridges ArbitrageEngine's off-chain opportunity detection to a single
 * on-chain flashloan arbitrage transaction, signed and submitted via the
 * MetaMask Agent Wallet CLI (`mm`).
 *
 * IMPORTANT: flashloans are atomic. Borrow -> swap -> repay must all happen
 * inside ONE transaction, executed by TradeArenaEngine.sol. This service does
 * NOT attempt multi-step arbitrage via sequential `mm` calls (quote, then
 * swap, then repay) -- that would not be a flashloan and would leave you
 * exposed between steps. Its only job is:
 *   1. Validate an opportunity is genuinely profitable after gas/fees.
 *   2. Encode ONE call to TradeArenaEngine's arbitrage entrypoint.
 *   3. Submit that single transaction via `mm wallet send-transaction`.
 *
 * Requires TradeArenaEngine.sol to already be deployed with a callable
 * arbitrage function (e.g. executeArbitrage(...)). If it isn't deployed yet,
 * this module has nothing to call -- deploy it first (same pattern as your
 * PayoutManager Foundry deploy script).
 */

const { execFile } = require('child_process');
const util = require('util');
const execFileAsync = util.promisify(execFile);

const ENABLE_LIVE_EXECUTION = process.env.ENABLE_LIVE_EXECUTION === 'true';
const TRADE_ARENA_ENGINE_ADDRESS = process.env.TRADE_ARENA_ENGINE_ADDRESS;
const MIN_PROFIT_USD = Number(process.env.ARB_MIN_PROFIT_USD || '5');
const MAX_GAS_USD = Number(process.env.ARB_MAX_GAS_USD || '2');

class FlashloanExecutionError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

async function mmCommand(args) {
  try {
    const { stdout } = await execFileAsync('mm', [...args, '--json']);
    const parsed = JSON.parse(stdout);
    if (parsed.ok === false) {
      throw new FlashloanExecutionError(
        parsed.error?.code || 'MM_CLI_ERROR',
        parsed.error?.message || 'mm CLI returned an error',
        parsed.error
      );
    }
    return parsed;
  } catch (err) {
    if (err instanceof FlashloanExecutionError) throw err;
    throw new FlashloanExecutionError('MM_EXEC_FAILED', err.message);
  }
}

/**
 * Encode the calldata for TradeArenaEngine's flashloan arb entrypoint.
 * Adjust the function signature to match your actual deployed contract ABI.
 *
 * Expected opportunity shape (from ArbitrageEngine):
 * {
 *   chainId: 8453,
 *   assetIn: '0x...',    // token to flashloan
 *   assetOut: '0x...',   // token swapped into and back
 *   flashAmount: '1000000000', // in assetIn's smallest unit
 *   dexRoute: [...],     // whatever route your contract expects
 *   expectedProfitUsd: 12.4,
 *   estimatedGasUsd: 1.1,
 * }
 */
function encodeArbCalldata(opportunity) {
  const { ethers } = require('ethers'); // encoding only, no signing here
  const iface = new ethers.Interface([
    'function executeArbitrage(address assetIn, address assetOut, uint256 flashAmount, bytes calldata routeData)',
  ]);
  const routeData = ethers.AbiCoder.defaultAbiCoder().encode(
    ['address[]'],
    [opportunity.dexRoute]
  );
  return iface.encodeFunctionData('executeArbitrage', [
    opportunity.assetIn,
    opportunity.assetOut,
    opportunity.flashAmount,
    routeData,
  ]);
}

function validateOpportunity(opportunity) {
  if (!TRADE_ARENA_ENGINE_ADDRESS) {
    throw new FlashloanExecutionError(
      'NO_CONTRACT_ADDRESS',
      'TRADE_ARENA_ENGINE_ADDRESS is not set. Deploy TradeArenaEngine.sol first.'
    );
  }
  const netProfit = opportunity.expectedProfitUsd - opportunity.estimatedGasUsd;
  if (opportunity.estimatedGasUsd > MAX_GAS_USD) {
    throw new FlashloanExecutionError(
      'GAS_TOO_HIGH',
      `Estimated gas $${opportunity.estimatedGasUsd} exceeds cap $${MAX_GAS_USD}`
    );
  }
  if (netProfit < MIN_PROFIT_USD) {
    throw new FlashloanExecutionError(
      'INSUFFICIENT_MARGIN',
      `Net profit $${netProfit.toFixed(2)} below minimum $${MIN_PROFIT_USD}`
    );
  }
}

/**
 * Entry point called by ArbitrageEngine when it finds a candidate opportunity.
 * Returns without submitting anything unless ENABLE_LIVE_EXECUTION=true.
 */
async function tryExecuteArbitrage(opportunity, { auditLog }) {
  if (!ENABLE_LIVE_EXECUTION) {
    auditLog?.('arb.skipped.flag_disabled', { opportunity });
    return { executed: false, reason: 'ENABLE_LIVE_EXECUTION is false' };
  }

  validateOpportunity(opportunity);

  const calldata = encodeArbCalldata(opportunity);

  auditLog?.('arb.attempt', { opportunity, contract: TRADE_ARENA_ENGINE_ADDRESS });

  const result = await mmCommand([
    'wallet', 'send-transaction',
    '--chain-id', String(opportunity.chainId),
    '--payload', JSON.stringify({ to: TRADE_ARENA_ENGINE_ADDRESS, data: calldata }),
    '--intent', `flashloan-arb: ${opportunity.assetIn}->${opportunity.assetOut}`,
    '--wait',
  ]);

  auditLog?.('arb.executed', { opportunity, result });
  return { executed: true, result };
}

module.exports = { tryExecuteArbitrage, FlashloanExecutionError };
