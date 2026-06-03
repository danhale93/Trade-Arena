# Crucible Mode Implementation Plan

## Task Summary
Implement a "Slow Paper Crucible" - a rigorous 7-day validation experiment for trading strategies with tamper-proof CSV export.

## Information Gathered

### Current State:
1. **Trade Storage**: In-memory JS arrays
   - `trading-engine.js`: `this.trades = []` 
   - `crucible-test.js`: `this.trades = []`

2. **Existing CSV Export**: Already implemented in `crucible-test.js` via `exportCSV()` function

3. **Main App Files**: `index.html`, `app.js`, `trading-engine.js`

4. **UI Already Present**: Crucible bar and export buttons exist in index.html

### Key Requirements from Task:
- Hidden toggle via `?crucible=1` URL flag
- Fixed Parameters: ETH only, $50 position, 5-min hold, live CoinGecko prices
- Friction Model: 0.15% spread, $3 gas, 1.5x stress test
- Shadow Baselines: Random, Always Long, Momentum
- 50+ trades over 5-7 days
- CSV ledger with detailed fields
- Pass/Fail criteria validation

## Implementation Plan (UPDATED)

### 1. Create `crucible-mode.js` (New File)
- Hidden "Crucible Mode" detection via URL parameter
- Fixed trade parameters (ETH, $50, 5-min hold)
- Live price fetching from CoinGecko API
- Friction cost calculations (spread, slippage, gas)
- Shadow baseline tracking
- Auto-ledger generation

### 2. Modify `index.html`
- Add script tag for `crucible-mode.js`
- Add "Export Crucible CSV" button (hidden by default)
- Add Crucible Mode indicator UI (when active)
- Add CSV export functionality

### 3. Use Existing `crucible-test.js`
- Leverage existing `exportCSV()` function
- Reuse existing trade tracking

## Dependent Files to Edit
- `index.html` - Add script tag for crucible-mode.js

## New Files to Create
- `crucible-mode.js` - Core Crucible Mode implementation

## Implementation Steps
1. Create `crucible-mode.js` with full implementation
2. Add script tag to `index.html`
3. Test the implementation

## Pass/Fail Criteria (Built-in)
| Metric | Threshold |
|--------|----------|
| Win rate | ≥ 50% |
| Profit factor | ≥ 1.2 (at 1.5× costs) |
| Max drawdown | ≤ 10-15% |
| Baseline beat | Outperform 2 of 3 baselines |

---

## STATUS: IN PROGRESS

### Step 1: Create crucible-mode.js - COMPLETE
### Step 2: Add script to index.html - COMPLETE (via app-rebuild.js or inline)
### Step 3: Test - PENDING
