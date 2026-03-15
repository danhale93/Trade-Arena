# TRADE ARENA v4 • SETUP GUIDE

**Get your AI trading bots running in under 5 minutes!**

---

## ⚡ INSTANT START (No Setup)

### 1. Open Demo Mode
```
1. Open: c:\Users\admi\New folder\index.html in your browser
2. Click: 🎮 DEMO MODE
3. You're in! $10,000 virtual balance ready
```

### 2. Create & Trade
```
Click "+ ADD BOT" to create trading bot #1
Click "🎰 SPIN" to execute a trade
Watch the reels spin and the AI decide!
```

✅ **Done!** You're now trading with AI bots.

---

## 🤖 ENABLE CLAUDE AI (2 Minutes)

To use the full AI decision-making power:

### Step 1: Get Free API Key
```
1. Go to: https://console.anthropic.com
2. Sign up with email (free account)
3. Get free $5 credit (enough for ~1,000 trades)
4. Find "API Keys" section
5. Click "Create Key"
6. Copy the key (looks like: sk_ant_XXXXXXXXXXXX)
```

### Step 2: Add Key to Configuration
```
1. Open: c:\Users\admi\New folder\.env
2. Find line: ANTHROPIC_API_KEY=sk_YOUR_KEY_HERE
3. Replace sk_YOUR_KEY_HERE with your actual key
4. Save file
```

### Step 3: Restart & Trade
```
1. Reload index.html in browser
2. Click 🎮 DEMO MODE (or your login method)
3. Spin a bot - Claude AI will analyze market data!
4. Watch AI make smarter decisions
```

✅ **AI Enabled!** Claude now analyzes markets on every trade.

---

## 🦊 CONNECT METAMASK (Real Wallet)

To trade with real funds on Base network:

### Step 1: Install MetaMask
```
1. Go to: https://metamask.io
2. Download for your browser
3. Complete the setup (save seed phrase!)
4. You now have a wallet address
```

### Step 2: Get Funds
```
1. Buy ETH from exchange (Coinbase, Kraken, etc)
2. Send 0.1+ ETH to your MetaMask address
3. Switch MetaMask to "Base" network
   (If not listed: Click "Add Network" → Mainnet Base)
4. Wait for transaction confirmation (~2 minutes)
```

### Step 3: Connect to Trade Arena
```
1. Open: index.html in browser
2. Click: 🦊 METAMASK / WALLET
3. Approve the connection in MetaMask popup
4. Approve network switch to Base (if prompted)
5. Your wallet is now connected!
```

### Step 4: Check Balance
```
- Top right shows your ETH balance
- Shows real-time price in USD
- Track all trades in global log
```

⚠️ **Important**: 
- Start with small bets ($1-10) to test
- Gas costs ~$0.001 per trade
- AI is NOT financial advice
- Only trade what you can afford to lose

---

## 🔐 OPTIONAL: GOOGLE OAUTH

For one-click sign-in:

### Step 1: Create OAuth Credential
```
1. Go to: https://console.cloud.google.com
2. Create new project (or use existing)
3. Go to: Credentials → Create Credential → OAuth 2.0 Client ID
4. Choose: Web Application
5. Add Authorized redirect URIs:
   - http://localhost:3000
   - http://localhost
   - https://yourdomain.com (for production)
6. Click Create → Copy the Client ID
```

### Step 2: Add to App
```
1. Open: index.html in text editor
2. Find line ~614: const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID...'
3. Replace YOUR_GOOGLE_CLIENT_ID with your copied ID
4. Save file
5. Reload in browser
```

### Step 3: Test
```
- Click "SIGN IN WITH GOOGLE"
- Approve Google pop-up
- You're signed in!
```

✅ **Google Sign-in Ready!**

---

## 🎯 TRADING BASICS

### Reel Meanings

**Left Reel (Token)**
- 🐸 PEPE, 🐕 DOGE, 💎 ETH, 🌕 BTC
- 🔥 WIF, 💀 BONK, 🦊 FLOKI, 🚀 ARB, ⚡ SOL, 🌊 MATIC

**Middle Reel (Method)**
- ⚡ FLASH LOAN - MEV opportunities
- 🔄 ARBITRAGE - DEX spread trading
- 📈 SPOT LONG - Buy and hold
- 💎 NFT FLIP - NFT trading
- 🌾 YIELD FARM - Liquidity mining
- 🎯 PERP LONG - Leveraged position

**Right Reel (Edge/Size)**
- 🎯 SNIPER - Precise, small trades
- 🔥 DEGEN - High risk, high reward
- ⚖️ SAFE - Conservative sizing
- 💣 YOLO - Maximum leverage
- 🛡️ HEDGE - Risk mitigation
- 🌊 SURF - Follow the market

### Bet Amounts
```
Click buttons: $1, $5, $10, $25, $50, $100
Selected bet lights up in gold
That amount is risked on the next spin
```

### Results
```
🔥 WIN! → Profit (green text)
💸 REKT → Loss (red text)

Example:
- You bet $10
- Win with 1.5x multiplier
- Result: +$15 profit

Or:
- You bet $10
- Lose with -0.5x multiplier
- Result: -$5 loss
```

---

## 🤖 BOT MANAGEMENT

### Creating Bots
```
Click "+ ADD BOT"
Can create up to 6 bots
Each bot trades independently
Each bot has its own PnL
```

### Manual Trading
```
Each bot has:
- 🎰 SPIN button - Execute one trade
- AUTO button - Enable auto-trade mode
- Bet amount buttons ($1, $5, $10, etc)
```

### Auto-Trading
```
1. Click "AUTO" on any bot
2. Button turns cyan and says "⏸ STOP"
3. Bot spins every 3-8 seconds automatically
4. Trades execute in the background
5. Results auto-close (fast trading mode)
6. Click "⏸ STOP" to pause auto-trading
```

### Monitoring
```
Each bot card shows:
- Top left: BOT #1, #2, etc
- Top right: $PnL amount (green/red)
- Middle: 3 spinning reels (token, method, edge)
- Bottom: Strategy pills (token, method, % edge)
- Bottom: Current win rate and method description
```

---

## 📊 READING THE INTERFACE

### Global Header (Top)
```
👤 USERNAME          👤 Avatar
DEMO / 🔵 GOOGLE    Session badge
$10,000.00          Your current balance
+$50.00 today       Today's total profit
+ ADD BOT           Create new bot
```

### Bot Card Layout
```
╔════════════════════════════════╗
║ BOT #1          $+50.00  🔄    ║  ← Bot ID, PnL, Status
║ Scanning DEX...            ✕   ║  ← Current action, Close
╟────────────────────────────────╢
║                                ║
║  [🐸] [🔄] [🎯]              ║  ← Spinning reels (animated)
║  PEPE  ARBIT SAFE             ║
║                                ║
╟────────────────────────────────╢
║ Token: PEPE | Method: ARB     ║  ← Strategy pills
║ Edge: 2.3%                     ║  ← Estimated profit edge
╟────────────────────────────────╢
║ $1 $5 $10 $25 $50 $100        ║  ← Bet amount selector
║ [🎰 SPIN]    [AUTO]            ║  ← Trade buttons
╚════════════════════════════════╝
```

### Global Trade Log (Bottom)
```
#1  PEPE    ARBITRAGE    +$12.50    14:23
#2  ETH     FLASH LOAN   -$3.00     14:22
#1  WIF     SPOT LONG    +$8.75     14:21
```

---

## ⚙️ ADVANCED CONFIGURATION

### Edit .env File
```
INITIAL_BALANCE=10000        ← Starting virtual $
MIN_BET=1                    ← Minimum bet size
MAX_BET=500                  ← Maximum bet size
MAX_BOTS=6                   ← Maximum bot count

AUTO_SPIN_DELAY_MIN=3000     ← Fastest auto-trade (3 sec)
AUTO_SPIN_DELAY_MAX=8000     ← Slowest auto-trade (8 sec)

WIN_PROBABILITY_BASE=0.55    ← Base win rate (55%)
EDGE_PCT_MIN=0.5             ← Minimum edge edge%
EDGE_PCT_MAX=8.5             ← Maximum edge %

ANTHROPIC_API_KEY=sk_...     ← Claude API key
GOOGLE_CLIENT_ID=...         ← Google OAuth (optional)
```

### Tuning AI Aggressiveness
```
Lower WIN_PROBABILITY_BASE (e.g., 0.40)
  → AI takes riskier trades
  → Higher PnL multiplier variance

Higher WIN_PROBABILITY_BASE (e.g., 0.70)
  → AI takes safer trades
  → More consistent wins
```

---

## 🆘 TROUBLESHOOTING

### "AI Call Error: 401"
**Problem**: API key invalid or expired
```
Solution:
1. Go to https://console.anthropic.com
2. Check if API key is still active
3. Generate new key if needed
4. Update .env file
5. Reload page
```

### "MetaMask not found"
**Problem**: MetaMask browser extension not installed
```
Solution:
1. Go to https://metamask.io
2. Install for your browser
3. Create wallet and fund it with ETH
4. Refresh page and try again
```

### "Cannot switch to Base network"
**Problem**: Base network not in MetaMask
```
Solution:
1. MetaMask will auto-prompt when you connect
2. Click "Add Network" in the popup
3. Confirm to add Base mainnet
4. Network switches automatically
```

### "Balance shows $0"
**Problem**: MetaMask not connected or no ETH
```
Solution:
1. Check MetaMask shows connected
2. Verify ETH balance in MetaMask
3. Fund wallet with more ETH if needed
4. Wait ~30 seconds for page to update
```

### "Auto-trade stops after few spins"
**Problem**: Network error or rate limit hit
```
Solution:
1. Check browser console (F12)
2. Wait 60 seconds and try again
3. Turn auto-trade back on
4. Or increase AUTO_SPIN_DELAY_MAX
```

### "Reels won't spin"
**Problem**: Page still loading or network error
```
Solution:
1. Check page fully loaded
2. Check browser network tab (F12)
3. Reload page
4. Try Demo Mode first
```

---

## 📱 MOBILE SETUP

### iOS (Safari)
```
1. Open Safari
2. Go to: file:///c:/Users/admi/New folder/index.html
   (Or paste full path in address bar)
3. Works in demo mode
4. MetaMask works via MetaMask app
```

### Android (Chrome)
```
1. Open Chrome
2. Type file path or local server URL
3. Works in demo mode
4. MetaMask works via MetaMask app
```

### Responsive Design
```
✅ Desktop (1920px+): 3-column bot grid
✅ Tablet (900px): 2-column bot grid
✅ Mobile (640px-): 1-column bot grid
All touch-friendly buttons
```

---

## 🚀 PRODUCTION DEPLOYMENT

### Option 1: Vercel (Recommended)
```
1. Push code to GitHub
2. Go to vercel.com
3. Import repository
4. Add environment variables:
   - ANTHROPIC_API_KEY
   - GOOGLE_CLIENT_ID
5. Deploy with one click
```

### Option 2: Heroku
```
1. Create Procfile with: node server.js
2. Push to Heroku
3. Set config vars in dashboard
4. App runs on heroku.com
```

### Option 3: Self-Hosted
```
1. npm install
2. npm start (runs server.js on port 3001)
3. Open http://localhost:3001 or your domain
4. Use HTTPS for production (required for MetaMask)
```

---

## ✅ CHECKLIST

- [ ] Opened index.html in browser
- [ ] Clicked "DEMO MODE" to test
- [ ] Created 1 bot and spun it
- [ ] (Optional) Added Anthropic API key
- [ ] (Optional) Connected MetaMask wallet
- [ ] (Optional) Set up Google OAuth
- [ ] Read trading disclaimers
- [ ] Tested with $1 bets first
- [ ] Enabled auto-trade on a bot
- [ ] Monitored trades in global log

---

## 🎯 NEXT STEPS

1. **Learn Trading**
   - Read README_v4.md for complete guide
   - Experiment in demo mode
   - Start small with real money

2. **Customize**
   - Edit .env for your preferences
   - Adjust bet sizes and bot count
   - Tune auto-trade timing

3. **Advanced**
   - Run backend server (optional)
   - Integrate with your own strategy
   - Deploy to production

4. **Community**
   - Share wins/losses
   - Report bugs
   - Suggest features

---

**Happy Trading! 🚀**

Remember: This is experimental software. Trade responsibly and only risk what you can afford to lose.

For questions or issues, check the troubleshooting section above or open an issue on GitHub.
