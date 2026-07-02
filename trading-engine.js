// trading-engine.js
// Minimal placeholder for index.html.bak4 references.
// The core trading loop is embedded in index.html.bak4, so this file only provides
// backend-call helpers used for live mode.

(function () {
  const API_BASE = '';

  async function postJSON(path, body) {
    const resp = await fetch(API_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || data?.success === false) {
      const msg = data?.error?.message || data?.error || data?.message || 'Request failed';
      throw new Error(msg);
    }
    return data;
  }

  // Live swap execution used by server.js /api/execute/swap
  window.ta_executeSwap = async function ta_executeSwap({ fromToken, toToken, amount, slippage = 0.5, execute = true }) {
    return postJSON('/api/execute/swap', { fromToken, toToken, amount, slippage, execute });
  };

  // Exit/execute swap used by server.js /api/exit/execute
  window.ta_exitExecute = async function ta_exitExecute({ tokenIn, tokenOut, amountIn, amountOutMin, slippageBps, recipient, deadlineSecondsFromNow }) {
    return postJSON('/api/exit/execute', { tokenIn, tokenOut, amountIn, amountOutMin, slippageBps, recipient, deadlineSecondsFromNow });
  };
})();

