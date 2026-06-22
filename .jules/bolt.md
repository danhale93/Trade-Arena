## 2026-06-22 - Synchronized Telemetry Pruning
**Learning:** Pruning a primary data array (like `closedTrades`) to maintain performance is insufficient if parallel telemetry arrays (like `equityHistory` used for SVG charts) grow indefinitely. The overhead of rendering large SVG paths from unpruned history eventually becomes the primary bottleneck, negating the benefits of pruning the main data set.
**Action:** Ensure that any 'Janitor' or hygiene logic prunes all related historical arrays in synchronization. In this case, `equityHistory` was updated to be pruned alongside `closedTrades`.

## 2026-06-22 - Consolidating O(N) Traversals
**Learning:** In monolithic UI update functions like `updateQuantReport`, high-frequency updates trigger multiple redundant O(N) filter/reduce/map operations. Consolidating these into a single `for...of` loop significantly reduces scripting time during active trading sessions.
**Action:** Pass pre-aggregated data objects to sub-drawing functions rather than having each function re-traverse the raw array.
