# High-Profit Pulse Event Log Verification

The desktop dashboard places the new full-width event log directly below the profitability chart and above trade history. Its emerald accent, event count badge, empty state, and timestamp-oriented table match the existing cyberpunk system without competing with the chart.

The mobile preview confirms that the log header wraps cleanly and the empty state remains readable. Populated rows use a horizontally scrollable table container so timestamp, network, profit, threshold, route, and source remain available without forcing page-wide overflow.

The backend status query refreshes every five seconds, so newly persisted pulse events appear in the log on the same dashboard refresh cycle as the profitability chart.
