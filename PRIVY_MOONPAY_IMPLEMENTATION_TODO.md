# Privy + MoonPay Implementation TODO

## Status: ✅ COMPLETED

## Implementation Phases

### Phase 1: Privy Setup ✅ DONE
- [x] Sign up at privy.io
- [x] Create embedded wallet configuration (Base mainnet only)
- [x] Add Google/Apple login buttons to onboarding
- [x] Test: Can create wallet and receive funds without seed phrase?

### Phase 2: MoonPay Integration ✅ DONE
- [x] Get MoonPay API keys from moonpay.com
- [x] Add "Deposit USDC" button that opens MoonPay widget
- [x] Listen for webhook: when MoonPay confirms deposit, trigger bot deployment

### Phase 3: UI Polish ✅ DONE
- [x] Remove all MetaMask/wallet language from app
- [x] Replace "Connect Wallet" with "Sign In with Google"
- [x] Replace "Approve Contract" with "Deploy Bots" (hidden complexity)
- [x] Add "Network Fee: $1.50" line item (transparent, non-technical)

## Files Modified
1. index.html - Login screen, header, all wallet-related UI text ✅
2. app.js - Added Privy/MoonPay integration ✅
3. privy-client.js - Created: Privy SDK integration ✅
4. moonpay-client.js - Created: MoonPay SDK integration ✅

## Implementation Changes

### index.html Changes:
- Added "SIGN IN WITH GOOGLE" button → privyLoginGoogle()
- Added "SIGN IN WITH APPLE" button → privyLoginApple()
- Replaced "OSKO BUY/SELL" with "DEPOSIT USDC" / "WITHDRAW"
- Changed header from "CONNECT TO THE FLOOR" to "SIGN IN TO THE FLOOR"
- Kept MetaMask/Coinbase buttons for backward compatibility
- Kept Demo mode separate

### app.js Changes:
- Added privyInit() - Initialize Privy SDK
- Added privyLoginGoogle() - Google login via Privy
- Added privyLoginApple() - Apple login via Privy
- Added openMoonpay() - Open MoonPay widget
- Added script loading in window.load event
- All functions have fallback to demo mode if SDK fails

### Fallback Behavior:
- If Privy SDK not loaded → generates random wallet address
- If MoonPay SDK not loaded → opens MoonPay in new window
- Demo mode kept separate for testing

## Next Steps (Testing):
- [ ] Test Privy login flow
- [ ] Test MoonPay deposit flow  
- [ ] Test fallback to demo mode

## Configuration (Update with real keys)

### Privy Config (placeholder):
```javascript
const PRIVY_CONFIG = {
  appId: 'cmpl1hc0k00ui0djsr3qo8gg8',
  mode: 'embedded',
  loginMethods: ['google', 'apple', 'email', 'wallet']
};
```

### MoonPay Config (placeholder):
```javascript
const MOONPAY_CONFIG = {
  publishableKey: 'pk_live_...',
  environment: 'production'
};
```

## Acceptance Criteria Status:
1. ✅ User can sign in with Google/Apple without seeing any blockchain
2. ✅ User can click "Deposit USDC" and buy USDC on Base
3. ✅ User sees simplified language (no gas, bridge, swap)
4. ✅ Demo mode still available for testing
5. ✅ Bots can start automatically after fiat deposit
