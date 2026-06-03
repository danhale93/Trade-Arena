# OSKO Blockchain Connect Implementation Plan

## 1. Information Gathered

### Current Blockchain Setup
- **MetaMask** login function (`loginMetaMask()`) - already present in index.html
- Base network auto-switch (chainId: 0x2105)
- Ethers.js v5.7.2 from CDN
- Balance fetched via CoinGecko for USD conversion
- Demo mode available for no-wallet testing

### What's Already Working
✓ MetaMask connection with account request
✓ Base network switch/add
✓ ETH balance → USD display
✓ Wallet address display
✓ Demo mode fallback

### Missing Features to Complete App
- On/Off Ramp (fiat ↔ crypto) buttons - per OSKO_INTEGRATION_PLAN.md
- Additional wallet options (Coinbase Wallet)
- Network status indicator

---

## 2. Implementation Plan

### 2.1 Add On/Off Ramp Buttons (OSKO Style)

The OSKO plan already exists. Use this simplified version that works without an API key:

**Buttons Added** (after loginMetaMask button):
```html
<button class="mm-btn" onclick="loginMetaMask()">
  <svg width="20" height="20" viewBox="0 0 318 318">...</svg>
  METAMASK / WALLET
</button>
<div class="divider">— or —</div>
<button class="demo-btn" onclick="loginDemo()">🎮 ENTER DEMO MODE — NO SETUP NEEDED</button>
<!-- ADD THESE -->
<div class="fiat-ramp-row">
  <button class="onramp-btn" onclick="openOskoRamp('onramp')">💳 BUY CRYPTO</button>
  <button class="offramp-btn" onclick="openOskoRamp('offramp')">💵 SELL CRYPTO</button>
</div>
```

### 2.2 CSS for OSKO Buttons
Add to index.html style section:
```css
/* OSKO On/Off Ramp Buttons */
.onramp-btn,.offramp-btn{width:48%;padding:10px;font-family:'Bungee',display;font-size:10px;letter-spacing:1px;border:none;border-radius:6px;cursor:pointer;transition:all .15s}
.onramp-btn{background:linear-gradient(135deg,#00d4ff,#0099ff);color:#fff}
.onramp-btn:hover{box-shadow:0 0 16px rgba(0,212,255,.5)}
.offramp-btn{background:linear-gradient(135deg,#00ff9d,#00cc7a);color:#000}
.offramp-btn:hover{box-shadow:0 0 16px rgba(0,255,157,.5)}
.fiat-ramp-row{display:flex;gap:8px;margin-top:8px}
```

### 2.3 JavaScript: openOskoRamp Function
```javascript
// OSKO Fiat On/Off Ramp
function openOskoRamp(type) {
  const s = document.getElementById('cStatus');
  if(!s) return;
  
  // Use public Ramp URL (works without app ID for demo)
  // This opens Ramp's hosted widget
  let url;
  if(type === 'onramp') {
    // Buy ETH - opens Ramp's buy widget
    url = 'https://buy.ramp.network/?ref=tradearena&swapAsset=ETH&fiatCurrency=USD';
    s.innerHTML = '💳 Opening OSKO On-Ramp...<br><span style="font-size:9px;color:var(--dim)">Buy ETH with card, receive in connected wallet</span>';
  } else {
    // Check if wallet connected
    if(!window.ethereum?.selectedAddress) {
      s.innerHTML = '⚠️ Connect wallet first to sell.<br><button onclick="loginMetaMask()" style="margin-top:8px;padding:6px 12px;background:var(--hot);border:none;border-radius:4px;color:#fff;cursor:pointer">CONNECT WALLET</button>';
      return;
    }
    // Sell - opens Ramp's sell widget
    url = `https://sell.ramp.network/?ref=tradearena&cryptoAsset=ETH&walletAddress=${window.ethereum.selectedAddress}`;
    s.innerHTML = '💵 Opening OSKO Off-Ramp...<br><span style="font-size:9px;color:var(--dim)">Sell ETH, receive USD to bank</span>';
  }
  
  // Open in new tab
  window.open(url, '_blank');
}
```

### 2.4 Add Coinbase Wallet Option
```javascript
// Additional wallet: Coinbase Wallet
async function loginCoinbase() {
  const s = document.getElementById('cStatus');
  if(!s) return;
  
  // Check for Coinbase Wallet injected
  if(!window.coinbaseWalletExtension) {
    s.innerHTML = '❌ Coinbase Wallet not installed<br><a href="https://www.coinbase.com/wallet" target="_blank" style="color:var(--cyan)">Install →</a>';
    return;
  }
  
  try {
    const accounts = await window.coinbaseWalletExtension.request({ method: 'eth_requestAccounts' });
    if(accounts?.length) {
      // Use similar flow as MetaMask
      const address = accounts[0];
      window._walletAddress = address;
      const userData = {
        name: address.slice(0,6)+'···'+address.slice(-4),
        address: address,
        avatar: null,
        badge: '🔵 COINBASE',
        provider: 'coinbase'
      };
      s.textContent = '✅ Connected to Coinbase Wallet!';
      setupApp(userData);
    }
  } catch(e) {
    s.textContent = '❌ '+e.message;
  }
}
```

### 2.5 Network Status Indicator
Add to global header:
```javascript
// Update header to show network
function updateNetworkStatus() {
  // Detect current chain
  if(window.ethereum) {
    window.ethereum.request({ method: 'eth_chainId' }).then(chainId => {
      const netEl = document.getElementById('ghNetwork');
      if(netEl) {
        const networks = {
          '0x1': 'Ethereum',
          '0x2105': 'Base',
          '0x38': 'BSC',
          '0xa': 'Optimism'
        };
        const name = networks[chainId] || 'Unknown';
        netEl.textContent = name;
        netEl.style.color = chainId === '0x2105' ? 'var(--green)' : 'var(--amber)';
      }
    }).catch(()=>{});
  }
}
```

---

## 3. Files to Edit

1. **index.html**
   - Add CSS for OSKO buttons (~line 100 in style)
   - Add HTML buttons (~line 470-480)
   - Add JavaScript functions (script section end)

---

## 4. Implementation Order

1. ✓ Analyze existing wallet code (DONE)
2. Add CSS for ramp buttons
3. Add button HTML to login card
4. Implement openOskoRamp function
5. Test connection

---

## 5. Configuration Notes

Ramp.network works without app ID in demo mode:
- Reference code: tradearena
- Shows widget for wallet-less users
- KYC required for amounts > $300

For full production:
- Register at https://dashboard.ramp.network/
- Get app ID
- Enable widget customization
