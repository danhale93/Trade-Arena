# 🚨 MetaMask Not Found - QUICK ACTION GUIDE

## ⏱️ Do This NOW (2 Minutes)

### Step 1: Check What You Have (30 seconds)
```
Open F12 → Console tab
Paste this:
diagnoseMetaMask()
```

**This will tell us EXACTLY what's wrong.** Copy the output.

---

### Step 2: Try This First (Most Common Fix)

Open F12 Console and run:
```javascript
console.log(window.ethereum)
```

**If you see `undefined`**:
→ MetaMask NOT installed OR not accessible

**If you see an object like `{...}`**:
→ MetaMask IS installed, something else is wrong

---

### Step 3: Check MetaMask Extension

1. Look in top-right corner of browser
2. Do you see a **fox icon** 🦊?

**If YES**: Go to Step 4
**If NO**: 
   - Click puzzle piece 🧩 icon (extensions)
   - Find MetaMask
   - Click pin to make visible
   - Return here

---

### Step 4: Click MetaMask Icon

1. Click the fox icon 🦊
2. You should see your wallet

**Shows "Locked"?**
   → Type your password to unlock
   → Then return here

**Shows wallet address?**
   → Continue to Step 5

**Nothing appears?**
   → MetaMask not properly installed
   → Go to Step 6

---

### Step 5: Refresh and Test

1. Refresh this page: **F5** or **Ctrl+R**
2. Wait for page to fully load
3. Click **"METAMASK / WALLET"** button
4. Does MetaMask popup appear?

**If YES**: 🎉 Approve it! You're in!
**If NO**: Go to Troubleshooting below

---

### Step 6: Fix It (If Still Not Working)

**Option A**: Hard Refresh
```
Ctrl+Shift+R (Windows)
Cmd+Shift+R (Mac)
```
Then try again.

**Option B**: Install/Reinstall MetaMask
1. Go to **[metamask.io](https://metamask.io)**
2. Download for your browser
3. Install extension
4. Create or import wallet
5. Return here and try

**Option C**: Different Browser
- Try Chrome if using Firefox
- Try Firefox if using Chrome
- Tests if browser-specific

---

## 🔧 Diagnostic Commands (F12 Console)

**Paste ONE at a time**:

```javascript
// See EVERYTHING
diagnoseMetaMask()

// Quick check
console.log({
  hasEthereum: !!window.ethereum,
  isMetaMask: window.ethereum?.isMetaMask,
  hasRequest: !!window.ethereum?.request,
})
```

---

## ✅ What Should Work

After fixing:

1. Click **"METAMASK / WALLET"** button
2. MetaMask popup appears
3. See message "Connect your account"
4. Click "Connect" in popup
5. See "Approve network switch"
6. Click "Approve"
7. Dashboard loads 🎉

---

## 🆘 Still Stuck?

**Check These**:

- [ ] MetaMask extension installed?
- [ ] Fox icon visible in toolbar?
- [ ] Wallet unlocked (not locked)?
- [ ] Page fully loaded?
- [ ] No console errors (F12)?

**If all checked: Share output of `diagnoseMetaMask()`**

---

## 📍 Most Common Cause

**90% of the time it's**:
1. ❌ MetaMask not installed → Install from metamask.io
2. ❌ Wallet locked → Click fox icon, enter password
3. ❌ Browser cache → Hard refresh (Ctrl+Shift+R)

Try these first.

---

## 🎯 Next Steps

1. **Run diagnoseMetaMask()** - see what's happening
2. **Check MetaMask icon** - visible in toolbar?
3. **Unlock wallet if needed** - enter password
4. **Hard refresh** - Ctrl+Shift+R
5. **Try login button** - click "METAMASK / WALLET"

---

**Do these steps and it will work!** 💪
