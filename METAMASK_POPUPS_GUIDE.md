# 🦊 MetaMask Popup Guide - What to Click

## The Two Popups You'll See

When you click "METAMASK / WALLET" button, MetaMask will show one or two popups.

---

## 📋 Popup #1: Account Connection Approval

**When it appears:** After you click "METAMASK / WALLET" button

**What it looks like:**
```
┌─────────────────────────────────┐
│  MetaMask                       │
├─────────────────────────────────┤
│                                 │
│  Site is requesting permission  │
│  to view your accounts          │
│                                 │
│  Account:                       │
│  ☑ Account 1 (0x1234...)       │
│                                 │
│  This site will be able to:     │
│  • View account addresses       │
│  • Request transactions         │
│  • View assets                  │
│                                 │
│         [Cancel]  [Connect]     │
└─────────────────────────────────┘
```

**What to do:**
- ✅ Click **"Connect"** button (right side)

**If you click Cancel:**
- ❌ You'll see error: `Error code 4001 - User rejected the request`
- 🔄 Just try again and click "Connect" next time

---

## 🔗 Popup #2: Network Switch to Base

**When it appears:** After you approve the account connection

**What it looks like:**
```
┌─────────────────────────────────┐
│  Allow this site to switch the  │
│  network?                       │
├─────────────────────────────────┤
│                                 │
│  Current:  Ethereum Mainnet     │
│  Switch to: Base Mainnet        │
│                                 │
│  Chain ID: 8453 (0x2105)        │
│  RPC: mainnet.base.org          │
│  Currency: ETH                  │
│                                 │
│         [Cancel]  [Switch]      │
└─────────────────────────────────┘
```

**What to do:**
- ✅ Click **"Switch"** button (right side)

**If the network doesn't exist:**
- MetaMask will show "Add Network" instead
- ✅ Click **"Add"** button
- MetaMask will add Base network for you
- It will automatically switch

**If you click Cancel:**
- ❌ You'll see error about wrong network
- 🔄 Try again and click "Switch"

---

## ⚡ Quick Reference: Click These Buttons

| Action | Button to Click |
|--------|-----------------|
| Step 1: Connect wallet | **Connect** |
| Step 2: Switch network | **Switch** (or **Add** if network doesn't exist) |
| Error 4001 (rejected) | Retry and click **Connect** |
| Wrong network error | Retry and click **Switch** |

---

## 🎯 Visual Guide: Where to Look

### You'll see this MetaMask icon:
- **Location:** Top right corner of your browser
- **Icon:** Fox head icon 🦊
- **Click it:** To see network name and account

### Check these details:
```
MetaMask Top-Right Display:
┌──────────────────────┐
│ 🦊 MetaMask          │
├──────────────────────┤
│ Base Mainnet     ◄── Should say "Base"
│ 0x1234...ABCD   ◄── Your wallet address
│ ◯ 0.05 ETH      ◄── Your balance
└──────────────────────┘
```

---

## 🚨 If Popups Don't Appear

### Problem: MetaMask popup not showing
**Solution:**
1. Look for MetaMask popup that might be hidden
2. Click MetaMask extension icon (top right)
3. Click the popup window
4. Popups might open in new window - check taskbar

### Problem: Popup appeared but I can't click buttons
**Solution:**
1. Make sure you're clicking within the popup (not outside)
2. Try refreshing the page (F5)
3. Try a different browser (Firefox, Brave, Opera)

### Problem: "Network doesn't exist" after clicking Switch
**Solution:**
- MetaMask will show "Add Network" instead of "Switch"
- Click **"Add"** to let MetaMask add Base network
- It will automatically switch after adding

---

## 📱 If You're On Mobile

If using MetaMask mobile app:
1. Open the dapp browser inside MetaMask app
2. Go to `http://localhost:8000` (won't work on mobile - needs desktop)
3. Or copy link to desktop browser

**Note:** MetaMask mobile needs special dapp browser setup.

---

## ✅ Expected Sequence

```
1. Click "METAMASK / WALLET" button on website
   ↓
2. MetaMask popup appears (Account Connection)
   ↓
3. Click "Connect" button
   ↓
4. MetaMask popup #2 appears (Network Switch)
   ↓
5. Click "Switch" (or "Add" if needed)
   ↓
6. Console shows: [Step 1-8] all ✅ green
   ↓
7. Dashboard loads!
```

---

## 💡 Pro Tips

- **Don't minimize popups** - They need your immediate attention
- **Click the right button** - Connect ≠ Cancel, Switch ≠ Cancel
- **Wait for network** - Takes 1-2 seconds to switch after clicking
- **Check console** - F12 → Console shows what's happening
- **One step at a time** - Do Step 1, then Step 2, don't rush

---

## ❓ Still Having Issues?

Share in chat:
1. Did popup #1 appear? (Account connection)
2. Did you click "Connect"?
3. Did popup #2 appear? (Network switch)
4. What does the console show? (F12 → Console)

**Example good response:**
```
Popup #1: ✅ Appeared and I clicked "Connect"
Popup #2: ✅ Appeared and I clicked "Switch"
Console: [Step 1-8] all green ✅
Result: Dashboard loaded!
```

**Example problem response:**
```
Popup #1: ✅ Appeared, clicked "Connect"
Popup #2: ❌ Didn't appear
Console: Shows [Step 3] Error - getCode...
```

---

Ready to try? Close this, refresh the page (F5), and click "METAMASK / WALLET"! 🚀
