/*
 * Browser-owned Base swap executor.
 *
 * This deliberately has no server wallet, no background scheduler, and no
 * automatic arming path. A user must explicitly arm one manual transaction in
 * their injected wallet before anything can be submitted.
 */
(function (root) {
  'use strict';

  const BASE_CHAIN_ID = 8453;
  const NATIVE_TOKEN = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
  const MAX_USDC_PER_MANUAL_SWAP = '25';
  const TOKENS = Object.freeze({
    USDC: { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
    WETH: { address: '0x4200000000000000000000000000000000000006', decimals: 18 },
    ETH: { address: NATIVE_TOKEN, decimals: 18 }
  });
  const ERC20_ABI = [
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)'
  ];
  const TRANSITIONS = Object.freeze({
    IDLE: ['PREPARING'], PREPARING: ['QUOTING', 'FAILED'], QUOTING: ['APPROVING', 'PREFLIGHT', 'FAILED'],
    APPROVING: ['PREFLIGHT', 'FAILED'], PREFLIGHT: ['SIGNING', 'FAILED'], SIGNING: ['SUBMITTED', 'FAILED'],
    SUBMITTED: ['CONFIRMED', 'FAILED'], CONFIRMED: [], FAILED: []
  });

  class ExecutionStateMachine {
    constructor(onTransition) { this.state = 'IDLE'; this.onTransition = onTransition || function () {}; }
    move(next, detail) {
      if (!TRANSITIONS[this.state].includes(next)) throw new Error(`Invalid execution transition: ${this.state} -> ${next}`);
      this.state = next;
      this.onTransition(next, detail || '');
    }
    fail(error) { if (this.state !== 'FAILED' && this.state !== 'CONFIRMED') this.move('FAILED', safeError(error)); }
  }

  function safeError(error) {
    const message = error && (error.reason || error.shortMessage || error.message) || 'Unknown execution error';
    return String(message).replace(/[\r\n]+/g, ' ').slice(0, 240);
  }
  function requireEthers() { if (!root.ethers) throw new Error('Wallet library is unavailable'); return root.ethers; }
  function isNative(address) { return String(address).toLowerCase() === NATIVE_TOKEN.toLowerCase(); }
  function tokenFor(symbol) {
    const token = TOKENS[String(symbol || '').toUpperCase()];
    if (!token) throw new Error('Unsupported token. Live swaps are restricted to USDC and WETH.');
    return token;
  }
  function bigintFrom(value) { return BigInt(String(value)); }
  function positiveDecimal(value, label) {
    if (typeof value !== 'string' && typeof value !== 'number') throw new Error(`${label} is required`);
    const text = String(value).trim();
    if (!/^\d+(?:\.\d+)?$/.test(text) || Number(text) <= 0) throw new Error(`${label} must be a positive decimal`);
    return text;
  }
  function requireArmed() {
    if (sessionStorage.getItem('tradeArena.liveExecutionArmed') !== 'true') {
      throw new Error('Live execution is disarmed. Call armLiveExecution() and confirm before submitting a manual swap.');
    }
  }
  async function ensureBase(provider) {
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== BASE_CHAIN_ID) throw new Error('Switch MetaMask to Base Mainnet before continuing.');
  }
  function getTransaction(quote) {
    const transaction = quote && (quote.transaction || quote);
    if (!transaction || !transaction.to || !transaction.data) throw new Error('0x v2 quote did not contain a transaction payload');
    const tx = {
      to: transaction.to, data: transaction.data, value: transaction.value || '0x0',
      gasLimit: transaction.gas || transaction.gasLimit, gasPrice: transaction.gasPrice,
      maxFeePerGas: transaction.maxFeePerGas, maxPriorityFeePerGas: transaction.maxPriorityFeePerGas
    };
    return Object.fromEntries(Object.entries(tx).filter(([, value]) => value !== undefined && value !== null));
  }
  function allowanceSpender(quote) {
    return quote && (quote.issues && quote.issues.allowance && quote.issues.allowance.spender || quote.allowanceTarget);
  }
  async function fetchQuote({ buyToken, sellToken, sellAmount, taker }) {
    const key = localStorage.getItem('ta_0x_api_key');
    if (!key) throw new Error('A 0x API key is required for live quotes.');
    const params = new URLSearchParams({ chainId: String(BASE_CHAIN_ID), buyToken, sellToken, sellAmount, taker });
    const response = await fetch(`https://api.0x.org/swap/allowance-holder/quote?${params}`, {
      headers: { '0x-api-key': key, '0x-version': 'v2' }
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`0x v2 quote failed: ${body.reason || body.validationErrors?.[0]?.reason || response.status}`);
    if (body.liquidityAvailable === false) throw new Error('0x reports no executable liquidity for this swap');
    if (body.issues && body.issues.simulationIncomplete) throw new Error('0x could not complete quote simulation');
    return body;
  }
  async function approveIfNeeded({ ethers, signer, owner, sellToken, amount, quote, machine }) {
    if (isNative(sellToken)) return;
    const spender = allowanceSpender(quote);
    if (!spender) throw new Error('0x v2 quote omitted the AllowanceHolder spender');
    const contract = new ethers.Contract(sellToken, ERC20_ABI, signer);
    const current = await contract.allowance(owner, spender);
    if (bigintFrom(current) >= bigintFrom(amount)) return;
    machine.move('APPROVING', 'Requesting exact-token approval');
    const approval = await contract.approve(spender, amount);
    const receipt = await approval.wait(1);
    if (!receipt || Number(receipt.status) !== 1) throw new Error('Token approval was not confirmed');
  }
  async function executeManualSwap(request) {
    const machine = new ExecutionStateMachine((state, detail) => updateExecutionUI(request && request.botId, state, detail));
    try {
      if (!request || request.source !== 'manual') throw new Error('Automatic execution is disabled; only an explicit manual request may execute.');
      requireArmed();
      if (!root.ethereum) throw new Error('MetaMask or another injected wallet is required');
      const ethers = requireEthers();
      const sell = tokenFor(request.sellToken || 'USDC');
      const buy = tokenFor(request.buyToken || 'WETH');
      if (sell.address === buy.address) throw new Error('Sell and buy token must differ');
      // The UI has no reliable price-to-token-unit conversion for arbitrary
      // assets. Keep the first live path intentionally narrow and explicit.
      if (sell.address !== TOKENS.USDC.address || buy.address !== TOKENS.WETH.address) {
        throw new Error('The manual live path currently supports only USDC to WETH swaps.');
      }
      const humanAmount = positiveDecimal(request.amount, 'Amount');
      if (bigintFrom(ethers.utils.parseUnits(humanAmount, sell.decimals)) > bigintFrom(ethers.utils.parseUnits(MAX_USDC_PER_MANUAL_SWAP, sell.decimals))) {
        throw new Error(`Manual USDC swaps are capped at ${MAX_USDC_PER_MANUAL_SWAP} USDC`);
      }
      machine.move('PREPARING', 'Connecting wallet');
      const provider = new ethers.providers.Web3Provider(root.ethereum, 'any');
      await root.ethereum.request({ method: 'eth_requestAccounts' });
      await ensureBase(provider);
      const signer = provider.getSigner();
      const taker = await signer.getAddress();
      const sellAmount = ethers.utils.parseUnits(humanAmount, sell.decimals).toString();
      machine.move('QUOTING', 'Requesting 0x v2 quote');
      const quote = await fetchQuote({ buyToken: buy.address, sellToken: sell.address, sellAmount, taker });
      await approveIfNeeded({ ethers, signer, owner: taker, sellToken: sell.address, amount: sellAmount, quote, machine });
      const transaction = getTransaction(quote);
      machine.move('PREFLIGHT', 'Simulating transaction');
      await provider.call({ ...transaction, from: taker });
      const estimated = await signer.estimateGas(transaction);
      transaction.gasLimit = estimated.mul(120).div(100);
      machine.move('SIGNING', 'Awaiting wallet confirmation');
      const submitted = await signer.sendTransaction(transaction);
      machine.move('SUBMITTED', submitted.hash);
      const receipt = await submitted.wait(1);
      if (!receipt || Number(receipt.status) !== 1) throw new Error('Swap transaction reverted');
      machine.move('CONFIRMED', submitted.hash);
      sessionStorage.removeItem('tradeArena.liveExecutionArmed');
      return { success: true, txHash: submitted.hash, receipt, quote: { minBuyAmount: quote.minBuyAmount || null } };
    } catch (error) {
      machine.fail(error);
      throw new Error(safeError(error));
    }
  }
  function updateExecutionUI(botId, status, detail) {
    const el = botId !== undefined && root.document && root.document.getElementById(`mtick-${botId}`);
    if (el) el.textContent = `[${status}] ${detail ? String(detail).slice(0, 64) : ''}`;
  }
  function armLiveExecution() {
    const confirmation = root.prompt('Type ARM LIVE SWAP to arm exactly one manual Base swap.');
    if (confirmation !== 'ARM LIVE SWAP') throw new Error('Live execution remains disarmed');
    sessionStorage.setItem('tradeArena.liveExecutionArmed', 'true');
    return 'Live execution armed for one manual swap.';
  }
  function disarmLiveExecution() { sessionStorage.removeItem('tradeArena.liveExecutionArmed'); }

  root.executeManualSwap = executeManualSwap;
  root.executeOnChainTrade = () => Promise.reject(new Error('Automatic on-chain execution is disabled. Use the explicit manual swap flow.'));
  root.armLiveExecution = armLiveExecution;
  root.disarmLiveExecution = disarmLiveExecution;
  if (typeof module !== 'undefined' && module.exports) module.exports = { ExecutionStateMachine, getTransaction, allowanceSpender, isNative, tokenFor, safeError, TRANSITIONS };
}(typeof window !== 'undefined' ? window : globalThis));
