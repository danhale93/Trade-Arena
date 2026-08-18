# Reels and Audio Telemetry Verification

The desktop preview places the new Stitch-inspired Liquidity Signal Reels visualizer as the primary feature panel directly beneath the network balance/status cards. Two adjacent audio telemetry modules show the pulse envelope and spectral readout, both using live dashboard-derived values such as pulse-event count, Base gas price, congestion, and scanner state.

The mobile preview stacks the reels panel above the audio modules and preserves readable labels without horizontal page overflow. The reels columns compress while retaining the primary chain/spread/profit hierarchy.

Animation is CSS-based and includes a `prefers-reduced-motion: reduce` fallback that freezes the reels, scanline, spectrum bars, and spectral lines. The visualizer explicitly labels simulation-only state and does not invent profitability data when route history is empty.
