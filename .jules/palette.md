## 2026-06-29 - Payout Header Integration
Learning: Header real-estate is limited; used a compact 'CLAIM' button next to the balance to maintain UI balance.
Action: Integrated payout claim logic directly into the header for high visibility.

## 2026-07-05 - Synchronize Bot Bet UI and ARIA States
**Learning:** Trader bots default to a $10.00 bet value, but the frontend was hardcoding a "$1.00" display and lacked a corresponding preset button, leading to a state mismatch. Additionally, interactive toggles lacked ARIA state synchronization, making the UI less accessible to screen readers.
**Action:** Always verify UI presets against default bot configurations and ensure all interactive toggles synchronize both visual classes and ARIA attributes (using string values like ".toString()").

## 2026-07-12 - Accessible Emojis and Global State Feedback
**Learning:** High-density dashboards often use emojis as primary visual indicators for bot types and navigation. Without `role="img"` and `aria-label`, these critical indicators are silent to screen readers. Furthermore, high-stakes global toggles (Auto-trading, Emergency Stop) require immediate, non-blocking confirmation (toasts) to ensure user intent is acknowledged.
**Action:** Wrap all informative emojis in accessible spans and use the `showToast` system for all global state transitions to provide clear, accessible feedback.

## 2026-07-10 - Dynamic Accessibility for Async Workflows
**Learning:** For high-stakes or time-consuming async processes like "Spinning" a bot, a static `aria-label` is insufficient. Updating the label dynamically to reflect the internal state (e.g., "Scanning markets", "Opening position") provides a significantly better experience for screen reader users who would otherwise be left wondering what the "Spinning" state entails.
**Action:** Always map internal async state steps to user-facing ARIA labels to maintain context for assistive technologies.

## 2026-07-10 - Reinforcing Success with Delight
**Learning:** Functional success messages (toasts) are expected, but pairing them with celebratory visuals (confetti) for high-value actions like reward claims or task completions transforms a routine interaction into a moment of delight.
**Action:** Identify "pinnacle" success moments in the user journey and augment them with existing visual effects systems.

## 2026-07-11 - Safeguarding Destructive Actions and Enhancing Critical Feedback
**Learning:** Destructive actions like decommissioning a bot require a friction point (`confirm`) to prevent accidental data loss, especially in high-density dashboards. Conversely, critical system-wide events like an "Emergency Stop" benefit from amplified sensory feedback (e.g., a screen flash) to provide immediate, undeniable confirmation of the action's success.
**Action:** Always implement confirmation dialogs for destructive individual actions and use global visual effects (like `FX.flash`) to emphasize high-stakes system state transitions.

## 2026-07-13 - Multi-Modal Delight Feedback
**Learning:** For a high-density trading dashboard, visual feedback should be localized to the point of action (e.g., shaking a bot card on loss) as well as global (confetti) to provide immediate sensory confirmation without breaking the user's focus on specific agents.
**Action:** Use localized effects like `FX.shake(el)` for individual bot events and global effects like `FX.confetti` for high-stakes wins or system-level successes.

## 2026-07-17 - Keyboard-Accessible Modal Escapes
**Learning:** Overlays and modals (e.g. Settings, Withdraw, Voice Agent, Crucible results) that intercept layout interaction must provide immediate keyboard-accessible escape mechanisms (the `Escape` key) to satisfy accessibility (WCAG) standard and improve navigation speed for keyboard-only users.
**Action:** Implement a global keydown handler targeting active modal elements to safely close or remove overlays when `Escape` is pressed.

## 2026-07-17 - Standardize Modal Close and Toggle Accessibility
**Learning:** Unbalanced HTML tags (e.g. duplicated opening divs) break DOM parsing, which can nest separate modals inside each other and trigger selector collisions in integration tests. Standardizing close buttons using a shared class (`.m-close`) and consistent symbol (`✕`) along with dynamic aria states (e.g. `aria-pressed` on show/hide) makes complex dashboards incredibly robust, uniform, and compliant.
**Action:** Always validate HTML tag balance when layout anomalies occur, and align modal control patterns using unified styles and dynamic ARIA state bindings.

## 2026-07-24 - Interactive Clipboard Feedback and Audio-Visual Synchronization
**Learning:** Copying addresses to the clipboard is a common utility but often feels static and unconfirmed when users are deep in high-velocity trading workflows. Combining localized canvas-based confetti at the trigger's coordinates, standardized audio ticks (`window.SFX`), and accessible system notifications (`window.showToast`) ensures multi-modal confirmation that works across visual, keyboard, and screen-reader users alike.
**Action:** Always coordinate local sensory (confetti/sound) and global layout feedback (toast) when adding interactive shortcuts on high-utility read-only indicators.

## 2026-07-19 - Persistent Theme and Multi-Modal Calibration Feedback
**Learning:** Selecting color themes in dashboards must persist across application reloads, but static CSS properties are often not read/loaded on startup, leading to a visual discrepancy. Applying the saved theme during `DOMContentLoaded` ensures absolute consistency, sets accessible ARIA-pressed states on initialization, and provides a tactile transition. Coupling interactive theme changes with coordinate-free visual/auditory cues (such as a full-screen flash, audio ticks, and an accessibility toast) provides clear confirmation that the system-wide colors have calibrated successfully.
**Action:** Always load and apply saved styling/theme configurations during application DOM startup, and use global multi-sensenseory feedback to emphasize configuration success.

## 2026-07-20 - Batch Configuration Audio-Visual De-duplication and Multi-sensory Confirmation
**Learning:** Applying quick preset configurations to high-density bot arrays can easily cause visual/auditory spam if individual property changes trigger overlapping audio ticks and separate status messages in rapid succession. De-duplicating these events by adding a `silent` parameter to individual setters and triggering a single coordinated multi-sensory confirmation (localized canvas confetti, subtle screen tint flash, and a single audio tick) at the end of the batch operation significantly improves the aesthetic appeal, usability, and accessibility of settings orchestration.
**Action:** Always support a `silent` flag on individual state-mutating actions when they can be orchestrated inside batch presets, and emit a single cohesive multi-sensory celebration upon successful bulk state transitions.
