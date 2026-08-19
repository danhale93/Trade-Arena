# ⚙️ COOLDOWN SETTINGS SYSTEM - v5

## What's New?

**Cooldown Settings** - Customizable loss-based automatic trading cooldowns!

```
⚙️ Settings Button (bottom-right)
│
└─ Adjustable Cooldown Levels:
   ├─ Loss Trigger: When to activate (default 15 losses)
   ├─ Level 1: 30 minutes cooldown
   ├─ Level 2: 2 hours cooldown  
   └─ Level 3: 48 hours cooldown
```

---

## How It Works

### The Cooldown System

```
NORMAL TRADING
│ Bots trading normally
│ Tracking consecutive losses
│
Loss counter reaches LOSS_TRIGGER (15 losses)
│
LEVEL 1 COOLDOWN ACTIVATED ❌
│ 30-minute pause on all auto-spins
│ Users can still manual spin
│
(if loss counter keeps rising)
│
LEVEL 2 COOLDOWN ACTIVATED ⚠️
│ 2-hour pause on all auto-spins
│ Stronger brakes applied
│
(if still losing badly)
│
LEVEL 3 COOLDOWN ACTIVATED 🚫
│ 48-hour complete shutdown
│ Maximum protection
│
Reset timer / cooldown expires
│
Back to NORMAL TRADING ✅
```

---

## Using the Settings

### Step 1: Open Settings
- Click **⚙️** button (bottom-right corner)
- Settings modal opens

### Step 2: Adjust Settings
```
┌─────────────────────────────────────────┐
│ ⚙️ COOLDOWN SETTINGS                    │
├─────────────────────────────────────────┤
│                                         │
│ Losses before Level 1 cooldown         │
│ [====●=====] → 15                       │
│                                         │
│ Level 1 cooldown (minutes)             │
│ [====●=====] → 30 min                   │
│                                         │
│ Level 2 cooldown (hours)               │
│ [====●=====] → 2 hrs                    │
│                                         │
│ Level 3 cooldown (hours)               │
│ [====●=====] → 48 hrs                   │
│                                         │
│  [✅ SAVE]  [❌ CLOSE]                  │
└─────────────────────────────────────────┘
```

### Step 3: Save Settings
- Drag sliders to adjust values
- Click **✅ SAVE** to save
- Settings persist in browser storage

---

## Default Values

| Setting | Default | Range |
|---------|---------|-------|
| **Loss Trigger** | 15 losses | 3-20 |
| **Level 1** | 30 min | 5-60 min |
| **Level 2** | 2 hours | 1-6 hrs |
| **Level 3** | 48 hours | 12-72 hrs |

---

## Customization Examples

### Conservative Trader
```
Loss Trigger: 10 (quicker cooldowns)
Level 1: 20 min
Level 2: 1 hour
Level 3: 24 hours
```
→ Strict controls, quick cooldowns

### Aggressive Trader
```
Loss Trigger: 20 (more tolerance)
Level 1: 45 min
Level 2: 4 hours
Level 3: 72 hours
```
→ More freedom, long cooldowns

### Day Trader
```
Loss Trigger: 12
Level 1: 15 min
Level 2: 1.5 hours
Level 3: 6 hours
```
→ Balanced for day trading

---

## Where Settings Are Stored

```
Browser localStorage:
cooldownSettings = {
  lossTrigger: 15,
  cooldowns: [1800, 7200, 172800]  // seconds
}
```

✅ **Persistent** - Survives page refreshes
✅ **Local** - Only on your computer
❌ **Not synced** - Doesn't transfer between devices

---

## Button Location & Appearance

```
┌─────────────────────────────────────────┐
│  APP WINDOW                             │
│                                         │
│  [Bots trading...]                      │
│                                         │
│                              ┌───────┐  │
│                              │   ⚙️  │  │
│                              └───────┘  │
│                              Settings   │
│                              Button     │
└─────────────────────────────────────────┘

Position: Bottom-right corner
Style: Gold border, fixed position
Always visible, z-index 9998
```

---

## Settings UI

### Slider Controls
```
Each slider has:
├─ Min value (left end)
├─ Max value (right end)
├─ Current value (middle)
└─ Display value (right side)

Real-time update:
- Drag slider → Value updates immediately
- Easier to see impact before saving
```

### Saving
```
Click SAVE:
1. Values locked in memory
2. Saved to localStorage
3. Button shows "✅ SAVED!" for 1.5 sec
4. Modal closes
5. Settings active on next trade
```

---

## Loss Counter Mechanics

### How Losses Are Counted

```
Each bot trade result:
├─ WIN (+$) → Counter reset to 0
└─ LOSS (-$) → Counter increments +1
              │
              └─ When counter reaches LOSS_TRIGGER:
                 └─ COOLDOWN ACTIVATED
```

### Multi-Bot Behavior

```
If you have 3 bots:
┌─────────┬─────────┬─────────┐
│ Bot #1  │ Bot #2  │ Bot #3  │
│ Losses: │ Losses: │ Losses: │
│ 8       │ 5       │ 12      │
└─────────┴─────────┴─────────┘
         Global Counter: 25
         (Combined losses)
         │
         └─ If threshold is 15:
            └─ COOLDOWN for ALL BOTS
```

→ First bot to trigger cooldown pauses all bots

---

## Console Output

When you start the app:
```
📋 Cooldown Settings Loaded: {
  LOSS_TRIGGER: 15,
  COOLDOWNS: [1800, 7200, 172800]
}
```

When you save settings:
```
✅ Cooldown settings saved: {
  lossTrigger: 15,
  cooldowns: [1800, 7200, 172800]
}
```

---

## Features

✅ **Customizable** - All values adjustable
✅ **Real-time Display** - See changes immediately
✅ **Persistent** - Survives page refresh
✅ **Visual Modal** - Clear, easy-to-use interface
✅ **Console Logging** - Track what's saved
✅ **Mobile Responsive** - Works on phones/tablets
✅ **No Data Loss** - Settings preserved in localStorage
✅ **Quick Save** - Confirmation feedback

---

## Advanced Notes

### Cooldown Activation Order
```
First breach → Level 1 (30 min)
   ↓
Still losing after Level 1 → Level 2 (2 hrs)
   ↓
Still losing after Level 2 → Level 3 (48 hrs)
   ↓
Cooldown expires → Back to normal
```

### Reset Mechanics
```
When a WIN occurs:
├─ Loss counter resets to 0
├─ Cooldown immediately canceled
└─ Back to normal trading
```

### Multi-Level Cooldowns
```
Example: LOSS_TRIGGER = 15

Loss count:  0-14   → NORMAL (green)
Loss count:  15-24  → LEVEL 1 (yellow)
Loss count:  25-39  → LEVEL 2 (orange)
Loss count:  40+    → LEVEL 3 (red)
```

---

## Troubleshooting

### Settings Not Saving?
1. Check browser allows localStorage
2. Check if localStorage is full
3. Try clearing old data
4. Refresh page (F5)

### Settings Reset After Refresh?
1. Check localStorage is enabled
2. Check browser privacy settings
3. Try incognito mode (resets each session)
4. Try different browser

### Button Not Visible?
1. Scroll to bottom-right corner
2. Check if covered by other elements
3. Refresh page (F5)
4. Clear browser cache

---

## Future Enhancements

🔜 **Export/Import Settings** - Share configs
🔜 **Preset Profiles** - Conservative/Aggressive/Balanced
🔜 **Visual Cooldown Timer** - Show countdown
🔜 **Per-Bot Cooldowns** - Individual settings per bot
🔜 **Cooldown History** - Track activations
🔜 **Alerts** - Notify when cooldown triggers
🔜 **Recovery Strategy** - Auto-adjust after cooldown

---

## Quick Reference

| Action | How |
|--------|-----|
| Open Settings | Click ⚙️ button (bottom-right) |
| Adjust Loss Trigger | Drag "Losses before Level 1" slider |
| Adjust Level 1 | Drag "Level 1 cooldown" slider |
| Adjust Level 2 | Drag "Level 2 cooldown" slider |
| Adjust Level 3 | Drag "Level 3 cooldown" slider |
| Save | Click "✅ SAVE" button |
| Cancel | Click "❌ CLOSE" button |
| View Current Values | Check console output |

---

## Testing Checklist

- [ ] Open settings (⚙️ button visible)
- [ ] Adjust loss trigger slider
- [ ] Adjust Level 1 cooldown
- [ ] Adjust Level 2 cooldown
- [ ] Adjust Level 3 cooldown
- [ ] See real-time value updates
- [ ] Click SAVE (shows confirmation)
- [ ] Refresh page (settings persist)
- [ ] Check console for confirmation message
- [ ] No console errors

---

## Version Info

```
Version: v5 + Cooldown 15
Release: March 12, 2026
Features:
  ✅ Master STOP/PLAY
  ✅ Create Wallet
  ✅ Google Login
  ✅ Cooldown Settings ← NEW!
Status: Ready for testing
```

---

## Summary

**Settings System** lets you control when and how strictly cooldowns are applied to your trading bots. Perfect for managing risk and preventing over-trading during losing streaks!

Try it out! Refresh page (F5) and click ⚙️ 🚀
