# Profit Pulse Visual Verification

The desktop preview shows the profitability widget with the new chain and time-range controls aligned in the header. The empty state remains clear while no simulation history is present, and the pulse-ready panel styling preserves the existing cyberpunk border and glow language.

The mobile preview shows the widget controls wrapping within the panel without horizontal overflow. The two-column summary cards remain readable, and the banner/pulse styles are scoped to the profitability panel so they will not disturb the rest of the dashboard during a high-profit event.

The animation includes a `prefers-reduced-motion: reduce` fallback that removes movement while retaining a high-contrast emerald highlight.
