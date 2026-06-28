## 2026-06-22 - Synchronized Telemetry Pruning
**Learning:** Pruning a primary data array (like `closedTrades`) to maintain performance is insufficient if parallel telemetry arrays (like `equityHistory` used for SVG charts) grow indefinitely. The overhead of rendering large SVG paths from unpruned history eventually becomes the primary bottleneck, negating the benefits of pruning the main data set.
**Action:** Ensure that any 'Janitor' or hygiene logic prunes all related historical arrays in synchronization. In this case, `equityHistory` was updated to be pruned alongside `closedTrades`.

## 2026-06-22 - Consolidating O(N) Traversals
**Learning:** In monolithic UI update functions like `updateQuantReport`, high-frequency updates trigger multiple redundant O(N) filter/reduce/map operations. Consolidating these into a single `for...of` loop significantly reduces scripting time during active trading sessions.
**Action:** Pass pre-aggregated data objects to sub-drawing functions rather than having each function re-traverse the raw array.

## 2026-06-23 - DOM Dirty-Checking and Render Caching
**Learning:** Even simple DOM property assignments (like `textContent` or `className`) can incur measurable overhead in high-frequency update loops if triggered redundantly. Furthermore, periodic UI updates (e.g., a 15s interval) that perform O(N) aggregations and SVG re-renders should be guarded by state-change checks.
**Action:** Implement "dirty-checking" at the helper level (`setVal`, `setMCard`) and high-level render functions (`updateQuantReport`) to skip processing when the underlying data (e.g., `closedTrades.length`) hasn't changed.

## 2026-06-23 - Production Ready: Live Mode & PayID
Learning: Real-money trading requires explicit state visibility (Live vs Sim) and high-fidelity feedback (Progress bars, Tx links) to ensure user confidence during execution.
Action: Implemented dual-mode trading system with real on-chain execution, batch progress monitoring, and AUD-optimized PayID onboarding.

## 2026-06-26 - High-Frequency UI Data Processing
**Learning:** In high-frequency drawing functions like those used for the Quant Report, patterns that allocate intermediate arrays (e.g., `Object.values().map()`) or use spread operators for mathematical reductions (`Math.max(...arr)`) create unnecessary memory pressure and garbage collection churn. Replacing these with single-pass manual loops significantly stabilizes scripting performance during active trading bursts.
**Action:** Prefer manual `for` or `for...in` loops for finding extrema or aggregating data within periodic UI update functions, especially when processing objects or large telemetry arrays.

## 2026-06-27 - Single-Pass Variance Calculation
**Learning:** Calculating volatility (standard deviation) often follows an O(3N) pattern: calculating returns (O(N) with array allocation), calculating mean (O(N)), then calculating squared differences (O(N)). This can be reduced to a single O(N) pass with O(1) space using the identity $Var(X) = E[X^2] - (E[X])^2$, which avoids both intermediate array allocation and redundant iterations.
**Action:** Replace multi-pass statistics calculations with single-pass loops that accumulate both sum and sum of squares. Use `Math.max(0, ...)` for variance to guard against precision-loss-induced negative values before square rooting.
