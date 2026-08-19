# OSKO On/Off Ramp Integration Plan

## 1. Information Gathered

### Current Login Setup (index.html)
- `loginGoogle()` - Uses Google Sign-In (GSI) SDK at line ~1437
- `handleGoogleLoginResponse(response)` - Processes Google OAuth JWT tokens
- After Google login: stores user info (name, email, avatar) and initiates app with balance

### Current Wallet Setup
- `loginMetaMask()` - MetaMask browser extension wallet connection
- Auto-switches to Base Mainnet (chainId: 0x2105)
- Fetches ETH balance and converts to USD via CoinGecko

### User Data Stored After Login
- name: from Google profile
- email: from Google profile  
- avatar: profile picture from Google
- badge: '🔵 GOOGLE' provider indicator

---

## 2. Plan for OSKO Integration

### 2.1 Add On/Off Ramp Buttons to Connect Screen
Add "Buy Crypto" and "Sell Crypto" buttons in the login card after Google Sign-In button:

```html
<!-- Add after Google button, before divider -->
<div class="fiat-ramp-row" style="display:flex;gap:8px;margin-top:4px">
  <button class="onramp-btn" onclick="openOnRamp()">
    💳 BUY CRYPTO
  </button>
  <button class="offramp-btn" onclick="openOffRamp()">
    💵 SELL CRYPTO
  </button>
</div>
```

### 2.2 CSS Styles for Buttons
```css
.onramp-btn,.offramp-btn{width:48%;padding:10px;font-family:'Bungee',display;font-size:10px;letter-spacing:1px;border:none;border-radius:6px;cursor:pointer;transition:all .15s}
.onramp-btn{background:linear-gradient(135deg,#00d4ff,#0099ff);color:#fff}
.onramp-btn:hover{box-shadow:0 0 16px rgba(0,212,255,.5)}
.offramp-btn{background:linear-gradient(135deg,#00ff9d,#00cc7a);color:#000}
.offramp-btn:hover{box-shadow:0 0 16px rgba(0,255,157,.5)}
```

### 2.3 JavaScript Functions for On/Off Ramps
Add to index.html script section:

```javascript
// OSKO On-Ramp (Buy Crypto)
async function openOnRamp() {
  const s = document.getElementById('cStatus'); if(!s) return;
  
  // Options: Ramp, MoonPay, Transak
  // Using Ramp.network as primary (most widely supported)
  const RAMP_APP_ID = 'YOUR_RAMP_APP_ID'; // Get from ramp.network
  
  // Build checkout URL with user email if available
  let checkoutUrl = `https://buy.ramp.network/?` + 
    `appId=${RAMP_APP_ID}&` +
    `swapAsset=ETH&` +
    `swapAmount=100&` + // default $100
    `fiatCurrency=USD&` +
    ` fiatValueMultiplier=1`;
    
  // If user logged in via Google, pass email for KYC
  if (window._userEmail) {
    checkoutUrl += `&userEmail=${encodeURIComponent(window._userEmail)}`;
  }
  
  // Open in new window/tab
  window.open(checkoutUrl, '_blank');
  s.textContent='💳 Opening on-ramp... Complete purchase and return here.';
}

// OSKO Off-Ramp (Sell Crypto)
async function openOffRamp() {
  const s = document.getElementById('cStatus'); if(!s) return;
  
  // Off-ramp via Ramp (same app, different mode)
  const address = window.ethereum?.selectedAddress;
  
  if (!address && !window._walletAddress) {
    s.textContent='❌ Connect wallet first to sell crypto';
    // Prompt to connect wallet
    loginMetaMask();
    return;
  }
  
  const sellAddress = address || window._walletAddress;
  
  // Ramp sell URL
  let sellUrl = `https://sell.ramp.network/?` +
    `appId=${RAMP_APP_ID}&` +
    `cryptoAsset=ETH&` +
    `fiatCurrency=USD&` +
    `walletAddress=${sellAddress}`;
    
  window.open(sellUrl, '_blank');
  s.textContent='💵 Opening off-ramp... Complete sale and return here.';
}

// Track wallet address from MetaMask for off-ramp
let _walletAddress = null;

// Modify loginMetaMask to store address
function storeWalletAddress(addr) {
  _walletAddress = addr;
}
```

### 2.4 Store Email from Google Login
Modify `handleGoogleLoginResponse` to store email globally:

```javascript
function handleGoogleLoginResponse(response){
  // ... existing code ...
  
  window._userEmail = decodedPayload.email;
  window._googleAvatar = decodedPayload.picture;
  
  // Setup app with user data
  const userData = {
    name: decodedPayload.name || decodedPayload.email.split('@')[0],
    email: decodedPayload.email,
    avatar: decodedPayload.picture || null,
    badge: '🔵 GOOGLE',
    provider: 'google'
  };
  
  setupApp(userData);
}
```

### 2.5 Configuration Notes
OSKO Providers to Evaluate:
1. **Ramp.network** - ramp.network
   - Supports 150+ countries
   - Instant ETH delivery
   - App ID required (free registration)
   
2. **MoonPay** - moonpay.com
   - Higher limits available
   - Requires KYC for higher amounts
   - Widget SDK available

3. **Transak** - transak.com
   - Lower fees
   - Mobile-first experience

---

## 3. Dependent Files to Edit

### Primary Changes
1. **index.html** - Add ramp buttons, CSS, JS functions
   - Lines ~1450-1470 (after Google button section)
   - Add CSS in style section (~line 100)
   - Add JS functions in script section (~line 3600+)

### Configuration Required
1. **RAMP_APP_ID** - Get from ramp.network
   - Register at: https://dashboard.ramp.network/
   - Test mode available for development

---

## 4. Implementation Steps

### Step 1: Add Ramp Configuration
Add to JavaScript config section:
```javascript
// OSKO / Fiat On-Ramp Configuration
const RAMP_CONFIG = {
  appId: 'YOUR_RAMP_APP_ID', // Replace after registration
  defaultFiat: 'USD',
  defaultCrypto: 'ETH'
};
```

### Step 2: Add UI Buttons
Add to index.html login card section after Google button

### Step 3: Implement Functions
Add openOnRamp() and openOffRamp() functions

### Step 4: Test Flow Complete
1. User clicks "Sign in with Google"
2. After auth, user clicks "Buy Crypto"
3. Ramp widget opens with email pre-filled
4. User completes fiat purchase
5. ETH arrives in their wallet
6. User can then trade in Trade Arena

---

## 5. Verification Checklist

- [ ] Register for Ramp.network app ID
- [ ] Add CSS for ramp buttons
- [ ] Add buy/sell buttons to login card
- [ ] Implement openOnRamp() function  
- [ ] Implement openOffRamp() function
- [ ] Store Google email for KYC pre-fill
- [ ] Test on-ramp flow with testnet
- [ ] Test off-ramp flow
- [ ] Handle wallet connection for off-ramp

---

## 6. Next Steps After Approval

1. Register at https://dashboard.ramp.network/
2. Update RAMP_APP_ID in code
3. Test with small amounts in test mode
4. Go live with production config
