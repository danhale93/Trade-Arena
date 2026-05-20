// app.js
// Minimal bootstrap so index.html.bak4 can load without missing script errors.
// The main logic is already embedded in index.html.bak4; this file ensures live endpoints exist.

(() => {
  // Ensure required globals exist.
  window._apiKeys = window._apiKeys || {};
  window._userApiKey = window._userApiKey || '';

  // Persist MetaMask/server PK for backend calls.
  window._serverPK = window._serverPK || '';

  // Helper used by index.html.bak4 inline script (expects setVal)
  window.setVal = window.setVal || function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  // Live trading: wire up only when user explicitly switches to LIVE.
  // index.html.bak4 already contains paper/live UI; we only need placeholders so it can call backend.
  window.setTradeMode = window.setTradeMode || function setTradeMode(mode) {
    window.__ta_tradeMode = mode;

    const liveRadio = document.querySelector('input[name="tradeMode"][value="live"]');
    if (liveRadio) liveRadio.disabled = false;

    const apiModeIndicator = document.getElementById('apiModeIndicator');
    const apiModeText = document.getElementById('apiModeText');
    if (!apiModeIndicator || !apiModeText) return;

    if (mode === 'live') {
      apiModeIndicator.className = 'api-mode-indicator live';
      apiModeText.textContent = 'LIVE TRADING MODE';
    } else {
      apiModeIndicator.className = 'api-mode-indicator paper';
      apiModeText.textContent = 'PAPER TRADING MODE';
    }
  };

  // If HTML provides login routines elsewhere, do nothing.
})();

