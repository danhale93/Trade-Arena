# 🔍 MetaMask Not Found - Troubleshooting Guide

## ⚠️ Problem: "MetaMask Not Found"

If you're seeing "❌ MetaMask not found" message, follow this guide.

---

## 🚀 Quick Fixes (Try These First)

### Fix #1: MetaMask Extension Not Installed
**Symptoms**: Message appears immediately
**Solution**:
1. Go to **[metamask.io](https://metamask.io)**
2. Click **Download** button
3. Select your browser (Chrome, Firefox, Safari, Edge)
4. Click **Add Extension** (or equivalent for your browser)
5. **Refresh this page** (F5 or Ctrl+R)
6. Try login again

### Fix #2: MetaMask Icon Not Showing in Toolbar
**Symptoms**: Can't find MetaMask in browser extensions
**Solution**:
1. After installing MetaMask, look for fox icon in top-right corner
2. If not visible, click extensions icon (puzzle piece)
3. Look for MetaMask in the list
4. Click the **pin icon** next to MetaMask to make it always visible
5. Refresh page (F5)
6. Try login again

### Fix #3: MetaMask Not Injecting `window.ethereum`
**Symptoms**: page loads but MetaMask not detected
**Solution**:
1. Click MetaMask fox icon in toolbar
2. Make sure you're logged IN to MetaMask
3. If wallet is locked, unlock it by entering password
4. **Refresh this page** (F5)
5. Try login again

### Fix #4: Page Cached, Extension Updated
**Symptoms**: Just updated MetaMask
**Solution**:
1. **Hard refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Or clear browser cache
3. Close this tab completely
4. Open a new tab
5. Open this page again
6. Try login

---

## 🧪 Advanced Diagnostics

### Step 1: Check in Browser Console

Open **F12 → Console tab** and run:

```javascript
diagnoseMetaMask()
```

**This will show**:
- ✅ Browser type (Chrome, Firefox, Safari, Edge)
- ✅ Is MetaMask extension detected
- ✅ Ethereum provider status
- ✅ Wallet connection state

### Step 2: Manual Checks

Run these commands in console (F12 → Console):

```javascript
// Check if window.ethereum exists
console.log('Ethereum object:', window.ethereum)

// Check if it's MetaMask
console.log('Is MetaMask:', window.ethereum?.isMetaMask)

// Check if request method exists
console.log('Can request:', !!window.ethereum?.request)

// Check connected accounts
window.ethereum?.request({method: 'eth_accounts'})
  .then(accounts => console.log('Accounts:', accounts))
  .catch(e => console.error('Error:', e.message))
```

### Step 3: Verify Installation

In console, check:
```javascript
// Should return: true
!!window.ethereum

// Should return: true  
window.ethereum?.isMetaMask

// Should return: true
!!window.ethereum?.request
```

**All should be `true`**. If any are `false` or `undefined`, MetaMask is not properly installed.

---

## 🔍 Detailed Troubleshooting by Browser

### Chrome/Edge Browser

**Step 1**: Install MetaMask
- Go to [metamask.io](https://metamask.io)
- Click "Install MetaMask for Chrome"
- Click "Add to Chrome"
- Click "Add Extension" in popup

**Step 2**: Create/Import Wallet
- Click "Create a Wallet" or "Import Wallet"
- Follow setup steps
- **Write down your seed phrase** (very important!)

**Step 3**: Verify Installation
- Look for fox icon in top-right corner
- Click it - you should see MetaMask wallet
- You should see "You are logged in"

**Step 4**: Unlock Wallet (if needed)
- If locked, enter your password
- Make sure wallet shows as "Unlocked"

**Step 5**: Refresh and Try
- Refresh this page (F5)
- Click "METAMASK / WALLET" button

---

### Firefox Browser

**Step 1**: Install MetaMask
- Go to [metamask.io](https://metamask.io)
- Click "Install MetaMask for Firefox"
- Click "Add to Firefox"
- Click "Add" in popup

**Step 2**: Create/Import Wallet
- Follow MetaMask setup steps
- Save your seed phrase

**Step 3**: Check Installation
- Look for fox icon in top-right
- Click it to see wallet
- Should say "You are logged in"

**Step 4**: Allow Site to Access MetaMask
- When clicking "METAMASK / WALLET", you may see a permission popup
- Click "Allow"

**Step 5**: Retry
- Refresh page (F5)
- Click "METAMASK / WALLET"

---

### Safari Browser

**Step 1**: Install MetaMask
- Go to [metamask.io](https://metamask.io)
- Click "Install MetaMask for Safari"
- Follow App Store instructions

**Step 2**: Create Wallet
- Open MetaMask app
- Create or import wallet
- Keep it open/logged in

**Step 3**: Grant Permissions
- First time accessing: Safari will ask for permission
- Click "Allow"

**Step 4**: In Safari
- Refresh this page (Cmd+R)
- Click "METAMASK / WALLET"

---

## ⚙️ MetaMask Settings to Check

### Ensure Wallet is Unlocked

1. Click MetaMask fox icon
2. Check status message
3. If locked, enter password to unlock
4. Should say "You are logged in"

### Ensure Correct Network Selected

1. Click MetaMask icon
2. Look at top of extension
3. Should see network selector
4. Don't need to select Base yet (app will auto-switch)

### Ensure You Have a Wallet

1. Click MetaMask icon
2. You should see an account address like: `0x1234...5678`
3. If not, create a new wallet:
   - Click "Create Wallet" or "Import Wallet"
   - Follow instructions

---

## 🐛 Specific Issues

### Issue: "I installed MetaMask but icon doesn't show"

**Solution**:
1. Click puzzle piece icon (extensions) in top-right
2. Find MetaMask in the list
3. Click pin icon to make it visible
4. Fox icon should now be in toolbar

---

### Issue: "I have MetaMask but it's locked"

**Solution**:
1. Click MetaMask fox icon
2. Enter your password
3. Wallet unlocks
4. Return to this page and try again

---

### Issue: "Console shows `Ethereum object: undefined`"

**Solution**:
1. Close and reopen browser completely
2. Make sure MetaMask is installed
3. Make sure you're logged into MetaMask
4. Hard refresh: Ctrl+Shift+R
5. Try in a different browser (to test)

---

### Issue: "Is MetaMask: false"

**Solution**:
1. Another wallet extension may be interfering
2. Check browser extensions
3. Disable other wallet extensions (Coinbase Wallet, etc.)
4. Keep only MetaMask enabled
5. Refresh page

---

## 🔄 Complete Reset Procedure

If nothing above works, try this complete reset:

### Step 1: Remove Extension
1. Go to browser settings
2. Find Extensions/Add-ons
3. Find MetaMask
4. Click "Remove" or "Uninstall"

### Step 2: Clear Browser Cache
1. Open Settings
2. Go to Privacy/History
3. Click "Clear browsing data"
4. Select "All time"
5. Check "Cookies and site data"
6. Click "Clear"

### Step 3: Close Browser
1. Close all browser windows
2. Wait 10 seconds
3. Reopen browser

### Step 4: Reinstall MetaMask
1. Go to [metamask.io](https://metamask.io)
2. Install fresh
3. Create new wallet or import seed phrase
4. Complete setup

### Step 5: Test
1. Open this page
2. Open Console (F12)
3. Run: `diagnoseMetaMask()`
4. Should show MetaMask detected
5. Try login button

---

## ✅ Verification Checklist

Before trying to login again, verify:

- [ ] MetaMask extension installed
- [ ] MetaMask icon visible in toolbar
- [ ] MetaMask wallet created
- [ ] MetaMask wallet unlocked (not password-locked)
- [ ] Browser shows no security warnings
- [ ] Page fully loaded (not still loading)
- [ ] Console shows no errors (F12)
- [ ] `diagnoseMetaMask()` shows detection

---

## 🎯 Expected vs Actual

### Expected When Working:
```
✅ MetaMask fox icon visible in toolbar
✅ Can click icon and see wallet
✅ Wallet says "Unlocked" or "You are logged in"
✅ Console shows: Ethereum object: {...}
✅ Console shows: Is MetaMask: true
✅ Click login button → Popup appears
✅ Can approve connection
```

### Actual (Not Working):
```
❌ No MetaMask icon visible
❌ Can't find extension in toolbar
❌ Console shows: Ethereum object: undefined
❌ Console shows: Is MetaMask: undefined
❌ Click login button → Error message
❌ No popup appears
```

---

## 🆘 Still Having Issues?

### 1. Check Console Output
```javascript
diagnoseMetaMask()  // Run this in F12 console
```

Copy the entire output and share it.

### 2. Check Browser Type
```javascript
console.log(navigator.userAgent)
```

Tell me which browser you're using.

### 3. Verify Installation
Open [metamask.io](https://metamask.io) and verify:
- You can see your existing wallet
- You can open the wallet
- It's unlocked

### 4. Test in Different Browser
- Try in Chrome if you use Firefox
- Try in Firefox if you use Chrome
- This isolates if it's browser-specific

---

## 📞 Quick Checklist

- [ ] MetaMask installed? → [metamask.io](https://metamask.io)
- [ ] Browser updated? → Check browser settings
- [ ] Wallet created? → Click MetaMask icon
- [ ] Wallet unlocked? → Enter password if locked
- [ ] Page refreshed? → F5 or Ctrl+R
- [ ] Console checked? → F12 → Console
- [ ] `diagnoseMetaMask()` run? → Should show details

If all checked and still not working, the issue is likely:
1. **MetaMask not installed** - Install from metamask.io
2. **Browser not supported** - Try different browser
3. **Wallet locked** - Click MetaMask and unlock
4. **Browser cache** - Hard refresh (Ctrl+Shift+R) or clear cache

---

## 🚀 Once Fixed

Once MetaMask is detected:

1. You'll see login popup when clicking "METAMASK / WALLET"
2. Approve connection in MetaMask
3. App asks to switch to Base network
4. Approve network switch
5. Dashboard loads with your wallet

**You'll be ready to trade!** 🎉

---

**Having trouble? Run `diagnoseMetaMask()` in console and share the output!**
