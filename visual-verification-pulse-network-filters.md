# Pulse Event Network Filter Verification

The desktop preview shows the new ALL, BASE, ARBITRUM, and OPTIMISM toggles directly above the event table. Each button includes a current count, uses `aria-pressed`, and the header badge changes to a filtered count when a specific network is selected.

The mobile preview shows the filter row wrapping within the pulse-event panel without horizontal overflow. The table remains inside its existing scroll container, and the selected-network status label remains visible beside the controls.

The filtered empty state distinguishes between no events recorded at all and no events matching the selected network. The filter logic is covered by focused client tests.
