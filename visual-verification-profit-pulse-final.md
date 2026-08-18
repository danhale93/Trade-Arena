# Final High-Profit Pulse Verification

The desktop preview shows the profitability widget and its chain/time-range controls aligned correctly with the existing dashboard. The pulse-ready styling is scoped to the widget, so the idle state remains visually unchanged until a qualifying new simulation arrives.

The mobile preview confirms that the controls wrap within the widget, the summary cards remain legible, and the event banner has enough room to truncate long route paths without causing horizontal overflow.

The active pulse itself is driven by a tested new-record predicate and uses the CSS `prefers-reduced-motion` media query to retain an emerald highlight without motion for users who request reduced animation.
