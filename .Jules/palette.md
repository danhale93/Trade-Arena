## 2026-06-18 - [Accessibility & Interaction Feedback]
**Learning:** Collapsible panels using non-semantic div headers require explicit role="button", tabindex="0", and aria-expanded attributes, along with a global keyboard listener for Enter/Space to meet accessibility standards. Async AI inputs benefit from immediate visual feedback (disabling inputs) to prevent duplicate actions.
**Action:** Always apply role="button" and tabindex="0" to clickable divs and use try...finally blocks for async UI state management.
