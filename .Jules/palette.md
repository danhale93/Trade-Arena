## 2026-06-18 - [Accessibility & Interaction Feedback]
**Learning:** Collapsible panels using non-semantic div headers require explicit role="button", tabindex="0", and aria-expanded attributes, along with a global keyboard listener for Enter/Space to meet accessibility standards. Async AI inputs benefit from immediate visual feedback (disabling inputs) to prevent duplicate actions.
**Action:** Always apply role="button" and tabindex="0" to clickable divs and use try...finally blocks for async UI state management.

## 2026-06-19 - [Form Accessibility & Sensitive Inputs]
**Learning:** Explicit label-input association using the `for` attribute is essential for ensuring interactive areas are large enough for mobile users and accessible to screen readers. Sensitive configuration fields (like API keys) should always feature a visibility toggle to allow users to verify their input without compromising security in shared environments.
**Action:** Use the `<label for="id">` pattern for all form fields and implement a "SHOW/HIDE" toggle for sensitive text inputs.

## 2026-06-20 - [Aria State Management for Custom Toggles]
**Learning:** For non-semantic toggle buttons (like "AUTO" modes) and disclosure widgets (like "Gear" menus) that don't use standard HTML elements like <details>, it's critical to synchronize 'aria-pressed' and 'aria-expanded' attributes respectively. This ensures screen readers correctly announce the state changes that are otherwise only visible through CSS classes or text updates.
**Action:** Use setAttribute('aria-pressed', state) for toggles and setAttribute('aria-expanded', state) for disclosure triggers in their respective event handlers.

## 2026-06-21 - [Dynamic Content Accessibility & Interaction Feedback]
**Learning:** Asynchronous UI updates in status containers (like login messages or AI replies) are invisible to screen readers unless marked with `aria-live="polite"`. Additionally, utility actions like "Copy to Clipboard" require immediate, high-contrast visual feedback (e.g., text change + color shift) to confirm success without requiring a separate notification component.
**Action:** Apply `aria-live="polite"` to all dynamic status areas and implement a 2-second "COPIED!" state for clipboard buttons.

## 2026-06-22 - [Panel Navigation Affordance]
**Learning:** In a multi-panel dashboard where top-level navigation buttons toggle collapsible sections, visual state synchronization is critical. Without an "active" class on the header button, users lose the relationship between the trigger and the content. Standardizing these triggers as semantic `<button>` elements with `aria-expanded` ensures both visual and assistive clarity.
**Action:** Always map dashboard toggle buttons to their panel state using a shared logic (like `togglePanel`) that manages both the content visibility and the trigger's visual 'open' state.
