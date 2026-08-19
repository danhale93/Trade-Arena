# 🎴 QUICK REFERENCE CARD

## 3-Minute Setup

### Step 1️⃣ - Refresh
```
Press F5
```

### Step 2️⃣ - Open Console
```
Press F12 → Click "Console"
```

### Step 3️⃣ - Test
```
Click "METAMASK / WALLET" button
Watch console output
```

---

## Expected Output

### ✅ SUCCESS (All Green)
```
✅ MetaMask detected!
[Step 1-8] All show ✅
🔗 MetaMask Login Success!
→ Dashboard loads!
```

### ❌ ERROR (One Step Fails)
```
[Step 4] ❌ Failed...
Error code: 4001
→ User rejected
```

---

## Error Code Meanings

| Code | Meaning | Fix |
|------|---------|-----|
| 4001 | You rejected | Click "Connect" |
| -32602 | Bad params | Try again |
| -32603 | RPC error | Wait & retry |

---

## Common Issues

### No MetaMask Popup Appeared
→ Check: Is MetaMask installed?

### Popup Appeared But I Clicked Reject
→ Try again, click "Connect"

### Can't Find Network To Switch To
→ MetaMask will show "Add Network" - click it

### Connection Works But No Dashboard
→ Check console for errors in [Step 8]

---

## MetaMask Popup Actions

### Account Approval Popup
- ✅ Click **"Connect"** button

### Network Switch Popup
- ✅ Click **"Switch"** button
- Or click **"Add"** if network doesn't exist

### Reject Popup
- ❌ Don't click this!
- 🔄 Try again if you do

---

## Console Navigation

### How to Open
```
Windows: F12 or Ctrl+Shift+I
Mac: Cmd+Option+I
```

### Where to Look
```
Output > Search "MetaMask detected"
Down > Look for [Step X] messages
Down > Look for ❌ errors if any
```

### How to Copy
```
Mouse: Click, drag to select, Ctrl+C
Or: Select All (Ctrl+A), copy (Ctrl+C)
```

---

## 8 Connection Steps

| # | Step | What Happens |
|---|------|--------------|
| 1 | Provider | Connects to MetaMask |
| 2 | Accounts | Shows popup, you approve |
| 3 | Signer | Gets account signer |
| 4 | Network | Shows popup, switch to Base |
| 5 | Validate | Checks you're on Base |
| 6 | Balance | Gets your wallet balance |
| 7 | Ready | Checks wallet is ready |
| 8 | Init | Starts real wallet mode |
| ✅ | Success | Dashboard loads! |

---

## Status Messages in UI

| Message | Meaning |
|---------|---------|
| ⏳ Connecting wallet… | Step 1-2: Provider & accounts |
| ⏳ Switching to Base… | Step 4: Network switching |
| ⏳ Validating network… | Step 5: Network check |
| ⏳ Loading balance… | Step 6: Balance fetch |
| ⏳ Verifying wallet… | Step 7: Readiness check |
| ⏳ Initializing wallet… | Step 8: Setup |
| ✅ Connected! | Success! |
| ❌ [Error message] | Failed, shows reason |

---

## Quick Troubleshooting Tree

```
Refresh page?
  YES → Continue
  NO → Do it now! (F5)
        ↓
Open console? (F12)
  YES → Continue
  NO → Do it now!
        ↓
Click "METAMASK / WALLET"?
  YES → Continue
  NO → Do it now!
        ↓
See [Step 1] ✅?
  YES → Continue
  NO → MetaMask not injected
        → Close browser, reopen
        → Check MetaMask installed
        ↓
See [Step 2] ✅?
  YES → MetaMask popup appeared ✅
        Click "Connect"?
        YES → Continue
        NO → Click it now!
  NO → Popup didn't appear
        → Click MetaMask icon
        → Check for popup window
        ↓
See [Step 4] ✅?
  YES → Network popup appeared ✅
        Click "Switch"?
        YES → Continue
        NO → Click it now!
  NO → Network switch failed
        → Check MetaMask shows "Base"
        ↓
See all [Step 1-8] ✅?
  YES → SUCCESS! 🎉
        Dashboard loads!
  NO → Look for ❌ step
        Check error code
        Share output
```

---

## What to Share If It Fails

**Format:**
```
Error at: [Step X]
Error code: [number]
Full output: [paste console]
```

**Example:**
```
Error at: Step 4
Error code: 4001
Full output:
[Step 1] ✅ Provider created
[Step 2] ✅ Accounts received
[Step 3] ✅ Signer obtained
[Step 4] ❌ Failed to switch network
```

---

## Files Reference

| File | Use |
|------|-----|
| DO_THIS_NOW.md | Start here |
| STEP_BY_STEP_DEBUG.md | Detailed help |
| METAMASK_POPUPS_GUIDE.md | Popup questions |
| TECHNICAL_CHANGES.md | How it works |
| FINAL_SUMMARY.md | Overview |
| DOCUMENTATION_INDEX.md | All guides |

---

## Remember

✅ Read DO_THIS_NOW.md first
✅ Refresh page before testing
✅ Open console to see logs
✅ Click buttons in popup when asked
✅ Share console output if it fails

---

## Timeline

| Time | Action |
|------|--------|
| 0 min | Refresh page |
| 1 min | Open console |
| 2 min | Click login button |
| 3-5 min | Either success or error |
| 5-10 min | Share output or try fix |
| 10-15 min | Everything works! |

---

## Success Checklist

- [ ] Read DO_THIS_NOW.md
- [ ] Refreshed page (F5)
- [ ] Opened console (F12)
- [ ] Clicked login button
- [ ] Approved MetaMask popup
- [ ] Approved network switch
- [ ] Saw all [Step 1-8] ✅
- [ ] Dashboard loaded
- [ ] Can see wallet address
- [ ] Can see ETH balance

**All checked?** 🎉 You're done!

---

*Print this card or bookmark it for quick reference!*
