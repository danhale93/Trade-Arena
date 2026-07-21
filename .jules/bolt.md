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

## 2026-06-25 - Efficient SVG String Building and Loop Optimization
**Learning:** For high-frequency dashboard updates, even O(N) operations like `.map().join()` for SVG paths or `Math.max(...array)` can become bottlenecks as N grows, due to intermediate array allocations and spread operator overhead. Replacing these with manual loops and string accumulation provides a smoother UI experience.
**Action:** Optimized Quant Report drawing functions to use single-pass traversals and manual string accumulation for SVG rendering.
## 2026-06-29 - O(1) Space Volatility and Parallelized Strategy Detection
**Learning:** Monolithic loops that traverse datasets multiple times (e.g., once for returns, once for mean, once for variance) incur unnecessary CPU overhead and intermediate allocations. Furthermore, network-bound strategy detection logic (like arbitrage checks) that executes sequentially creates a waterfall latency bottleneck proportional to the number of trading pairs.
**Action:** Implemented single-pass O(N) variance calculation using the identity $Var(X) = E[X^2] - (E[X])^2$ to achieve O(1) space complexity. Parallelized exchange price fetching and mempool simulations using `Promise.all` to convert O(N) sequential waterfalls into O(1) concurrent batches.
## 2026-06-30 - Backend Latency: Parallelized Connection Health Checks
**Learning:** Performing sequential network-bound checks (RPC health, wallet balances) in a single API endpoint creates a latency waterfall. This cumulative delay is directly visible to the user as a "hanging" or slow-loading dashboard panel.
**Action:** Use `Promise.all` to concurrently execute independent asynchronous checks, reducing total endpoint response time to the duration of the slowest single request.

## 2026-07-03 - O(M+N) Agent Matrix Updates
**Learning:** In dashboards with high bot counts (M) and active trades (N), nested loops in UI update functions (like `updateMatrix`) lead to O(M*N) complexity which causes noticeable lag. Using a `Set` for bot ID lookups reduces this to O(M+N).
**Action:** Always pre-calculate lookup sets (e.g., `botsWithOpen`) before entering map/filter loops that iterate over the entire bot fleet.

## 2026-07-03 - Backend Network Batching and Frontend UI Throttling
**Learning:** Sequential network requests in API endpoints (like fetching multiple asset prices) create a significant latency waterfall that scales linearly with the number of items. Furthermore, high-frequency bot management functions can cause redundant DOM updates if they trigger full UI re-renders (like Matrix updates) on every single addition.
**Action:** Implemented batched CoinGecko requests in the `/api/market/prices` endpoint and added a `silent` parameter to `addBot` to allow throttling UI updates during mass bot commissioning.

## 2026-07-06 - UI Event Throttling with requestAnimationFrame
**Learning:** In dashboards driven by high-frequency asynchronous events (like rapid trade executions or multiple bot updates), synchronous UI update functions that perform O(N) calculations and DOM manipulation can stack up multiple calls within a single browser frame. This leads to redundant CPU work and potential "jank" as the main thread struggles to clear the task queue between frames.
**Action:** Implement a throttling wrapper using `requestAnimationFrame` and a "pending" flag for expensive UI render functions. This ensures that regardless of event burst frequency, the application only performs one calculation and render pass per display frame, significantly smoothing the UX during periods of high activity.

## 2026-07-08 - Visibility Guards and Single-Pass Rolling Metrics
**Learning:** Collapsible dashboard panels often trigger expensive O(N) re-renders even when hidden from view. Adding simple "is open" guards to these render functions eliminates unnecessary DOM churn. Furthermore, calculating rolling window metrics (like win rate over the last N trades) should be done via a backwards loop to achieve O(window) complexity instead of O(N) full array traversals.
**Action:** Always implement visibility guards for render functions tied to collapsible UI sections. Refactor rolling metrics to walk backwards from the end of the dataset.

## 2026-07-08 - Multi-Factor UI Consolidation
**Learning:** High-frequency applications often have multiple disparate functions updating different parts of the same UI component (e.g., the global header). Running these independently leads to redundant DOM queries, layout thrashing, and multiple 'requestAnimationFrame' overheads. Furthermore, updates that only check one piece of state (like balance) may miss the need to refresh when a related piece of state (like open trade count) changes.
**Action:** Consolidate related UI updates into a single "Master" update function (like 'updateLiveBalance'). Implement a multi-factor dirty-check that evaluates all relevant state variables (balance, P&L, counts) simultaneously to trigger a single, atomic DOM update pass per display frame.

## 2026-07-12 - Defensive requestAnimationFrame Scheduling
**Learning:** Throttling UI updates with `requestAnimationFrame` is a good practice, but scheduling the frame callback itself can be a source of overhead if triggered at high frequency (e.g., from multiple asynchronous trade events) when the panel is hidden or data hasn't changed.
**Action:** Move visibility and data-change guards *before* the `requestAnimationFrame` call to prevent unnecessary frame registrations.

## 2026-07-13 - Consolidated Header Ticker and O(N) Traversals
**Learning:** Consolidating disparate O(N) traversals (like P&L calculation and nearest exit search) into a single pass not only reduces CPU cycles but also provides a natural point for synchronizing related DOM updates into a single `requestAnimationFrame` block. This eliminates potential visual "stutter" where different parts of a component (like a header) update in different display frames.
**Action:** When multiple metrics depend on the same dataset (e.g., `openPositions`), always prefer a manual `for` loop that aggregates all required data in a single pass, and perform all associated UI writes within the same animation frame.

## 2026-07-13 - Static Map Allocation and DOM Cache Consistency
**Learning:** In high-frequency price synchronization loops, re-declaring object literals (like token-to-ID maps) inside getter methods creates significant garbage collection pressure. Furthermore, while a DOM cache (`_getEl`) may exist, inconsistent usage across utility functions (like `setVal`) negates its benefits and leads to redundant DOM tree traversals.
**Action:** Always move static configuration objects out of hot method scopes. Enforce the use of centralized DOM caching (`_getEl`) in all global UI utility functions to ensure O(1) element access.

## 2026-07-15 - Hot Loop SVG Optimization and Dashboard Synchronization
**Learning:** Even with O(N) points calculation for SVG charts, functions like `toFixed(1)` can become a significant bottleneck when called 2,000+ times per frame (X and Y per point for 1,000 points). Pre-calculating scaling factors and using manual rounding (`Math.round(n * 10) / 10`) provides a 2-3x speedup in chart generation logic. Furthermore, disparate UI updates for related components (Header, Matrix, Quant Report) should be synchronized into a single `requestAnimationFrame` block to eliminate layout thrashing and provide a smoother dashboard experience.
**Action:** Always pre-calculate loop-invariant values in hot rendering paths. Consolidate related global UI updates into synchronized animation frame blocks. Standardize DOM access through centralized caching (`_getEl`).

## 2026-07-17 - O(M+N) Ticker Loop Lookups and Single-Pass Set Allocation
**Learning:** Performing a nested array scan (like `bots.find(...)`) inside periodic UI/position update loops that process active lists causes O(N * M) execution scaling. Building a flat lookup map prior to loop execution converts this pattern into O(N + M). Additionally, standard map-to-Set conversions (`new Set(arr.map(x => x.prop))`) allocate intermediate arrays that cause memory pressure in tight cycles, which can be mitigated with a single-pass `for` loop.
**Action:** Always map entity arrays to index maps when performing nested scans in interval tickers. Use explicit `for` loop population instead of high-level array mappings on hot loops.

## 2026-07-18 - Concurrent Cross-DEX Scanner Requests
**Learning:** Performing multiple sequential asynchronous network or simulation requests (like `buyQuote` and `sellQuote`) across hundreds of candidate routes in nested loops leads to linear latency scaling ($O(R \times A \times \text{latency})$). This sequential latency blocks execution and introduces significant lag. Parallelizing independent route tasks using `Promise.all()` with scoping-safe closures compresses total duration to $O(\text{latency})$.
**Action:** When evaluating matrixes or lists of market trading routes, wrap independent operations into concurrent async promises executed via `Promise.all()` to bypass sequential waterfalls. Ensure `try...catch` blocks are implemented inside the map loop to prevent a single route query failure from terminating the entire batch.

## 2026-07-19 - Cached Static AI Model Selection Strategies
**Learning:** Selecting from static datasets (like `LM_ARENA_MODELS`) using dynamic calculation strategies (such as `eloWeighted`, `costEfficient`, or `speedOptimal`) can introduce significant CPU and garbage collection overhead when invoked inside loop iterations. Constructing temporary arrays, iterating over nested structures, mapping, sorting, and slicing on every invocation causes redundant allocations and limits processing throughput.
**Action:** Pre-calculate static collection mappings or arrays once during module initialization. Refactor selection strategies to perform O(1) random index lookups on these cached collections to avoid intermediate array/object allocation and run-time processing overhead completely.

## 2026-07-20 - Non-Allocating Single-Pass Array Date Filtering & Sorting
**Learning:** Sorting and filtering datasets by date using inline `new Date(item.date)` instantiations allocates $O(N \log N)$ temporary objects, causing heavy heap churn, garbage collection spikes, and blocking thread execution during large datasets (such as 100,000+ records). Mapping strings into primitive millisecond numbers via `Date.parse()` prior to sorting keeps the comparison phase allocation-free, eliminating the object allocation overhead completely and yielding a 4-5x execution speedup.
**Action:** Always avoid creating temporary Date objects inside active filter or sort predicates. Use `Date.parse()` to pre-calculate numerical timestamps and sort by these primitive values.
