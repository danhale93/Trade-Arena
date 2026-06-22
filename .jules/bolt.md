## 2026-06-22 - Synchronized Telemetry Pruning
**Learning:** Pruning a primary data array (like `closedTrades`) to maintain performance is insufficient if parallel telemetry arrays (like `equityHistory` used for SVG charts) grow indefinitely. The overhead of rendering large SVG paths from unpruned history eventually becomes the primary bottleneck, negating the benefits of pruning the main data set.
**Action:** Ensure that any 'Janitor' or hygiene logic prunes all related historical arrays in synchronization. In this case, `equityHistory` was updated to be pruned alongside `closedTrades`.

## 2026-06-22 - Consolidating O(N) Traversals
**Learning:** In monolithic UI update functions like `updateQuantReport`, high-frequency updates trigger multiple redundant O(N) filter/reduce/map operations. Consolidating these into a single `for...of` loop significantly reduces scripting time during active trading sessions.
**Action:** Pass pre-aggregated data objects to sub-drawing functions rather than having each function re-traverse the raw array.

## 2026-06-23 - DOM Dirty-Checking and Render Caching
**Learning:** Even simple DOM property assignments (like `textContent` or `className`) can incur measurable overhead in high-frequency update loops if triggered redundantly. Furthermore, periodic UI updates (e.g., a 15s interval) that perform O(N) aggregations and SVG re-renders should be guarded by state-change checks.
**Action:** Implement "dirty-checking" at the helper level (`setVal`, `setMCard`) and high-level render functions (`updateQuantReport`) to skip processing when the underlying data (e.g., `closedTrades.length`) hasn't changed.
