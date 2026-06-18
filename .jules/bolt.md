## 2025-06-15 - Redundant UI and DOM updates
**Learning:** The Trade Arena codebase exhibited a pattern where expensive UI updates (O(N) calculations, SVG rendering, and DOM manipulation) were performed for a hidden "Quant Report" panel on every trade closure. Additionally, redundant DOM structures with duplicate IDs were present, bloating the document and causing unnecessary element processing.
**Action:** Always implement early return checks in UI update functions to verify visibility (e.g., via CSS classes like `open`) before executing heavy computations. Audit the HTML for copy-paste redundancies that lead to duplicate IDs and bloated DOM trees.

## 2026-06-18 - High-frequency UI Churn and Redundant Lookups
**Learning:** Trade P&L tickers were performing redundant `bots.find` O(N) lookups and `getElementById` calls every 2 seconds. Global balance updates were being triggered by every individual ticker, causing O(N^2) total work when multiple positions were open.
**Action:** Cache DOM elements and pass object references (e.g., `bot`) to tickers to avoid repeated lookups. Centralize global updates (like balance) in a fixed-frequency timer rather than individual async loops. Use dirty-checking/state-caching to skip DOM writes when values haven't changed.
