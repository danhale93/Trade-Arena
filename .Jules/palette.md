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
**Action:** Apply `aria-live="polite"` to all dynamic status areas and implement a 2-second "COPIED!" state for clipboard feedback.

## 2026-06-22 - [Panel Navigation Affordance]
**Learning:** In a multi-panel dashboard where top-level navigation buttons toggle collapsible sections, visual state synchronization is critical. Without an "active" class on the header button, users lose the relationship between the trigger and the content. Standardizing these triggers as semantic `<button>` elements with `aria-expanded` ensures both visual and assistive clarity.
**Action:** Always map dashboard toggle buttons to their panel state using a shared logic (like `togglePanel`) that manages both the content visibility and the trigger's visual 'open' state.

## 2026-06-26 - [ARIA State Synchronization for Mode Toggles]
**Learning:** For mutually exclusive mode toggles (like "SIMULATED" vs "LIVE"), synchronizing the `aria-pressed` attribute across both related buttons is essential. Screen readers rely on this attribute to communicate the current active state, which visual users see through CSS classes.
**Action:** Always update `aria-pressed` on all related toggle buttons within the state change handler to ensure assistive technology remains in sync with the visual UI.

## 2026-06-27 - [Dashboard Navigation via Status Matrix]
**Learning:** In dashboards with many dynamic entities (like trading bots), a top-level status matrix provides an essential scannable overview. By implementing smooth navigation from the matrix to individual entities, we bridge the gap between "birds-eye" monitoring and detailed inspection. Ensuring these matrix elements are fully accessible (semantic roles, keyboard support) transforms a purely visual widget into a powerful navigation tool.
**Action:** Always implement bidirectional synchronization between status overviews and detailed views, and use smooth scrolling with visual highlights to maintain user orientation during navigation.

## 2026-06-28 - [WAI-ARIA Tab Pattern & Animation Isolation]
**Learning:** For tabbed navigation within complex panels, the standard WAI-ARIA Tab pattern (`role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`) provides a more robust accessibility model than generic toggles by explicitly linking navigation to content panels. Additionally, when implementing global CSS animations, using specific names (e.g., `toastFadeIn`) prevents collisions with generic logic in existing scripts that may use identical names for different effects.
**Action:** Prefer the full Tab pattern for sub-navigation and always namespace custom CSS keyframes to avoid project-wide naming conflicts.

## 2026-06-29 - [Status Message Persistence & ID Isolation]
**Learning:** In dashboards with background data polling, sharing a generic status element (like `#cStatus`) across multiple disparate systems (login, task monitoring, clipboard feedback) leads to race conditions where high-frequency polling overwrites critical user feedback. Isolating critical feedback channels into dedicated, semantically-named ARIA-live regions (e.g., `#loginStatus`) ensures message persistence and improved UX during complex multi-threaded frontend operations.
**Action:** Always scope status elements to specific functional zones (onboarding vs. active monitoring) to prevent background updates from intercepting foreground user feedback.

## 2026-06-30 - [ARIA State Type Safety & Cross-Component Navigation]
**Learning:** WAI-ARIA attributes like 'aria-pressed' and 'aria-expanded' must be explicitly set as strings ("true"/"false") to ensure consistent behavior across all screen readers. Additionally, in data-heavy dashboards, bridging functional zones (e.g., linking Trade Ledger entries to active Bot Cards) via smooth-scroll navigation significantly improves situational awareness and reduces cognitive load during high-frequency operations.
**Action:** Always use .toString() when updating ARIA boolean attributes and implement directional navigation between related UI entities to maintain user orientation.

## 2026-07-31 - [Multi-Sensory Action Confirmation & Double-Action Prevention]
**Learning:** For global persistent actions (like saving settings/API keys), visual status labels can often be missed if they are small or detached from the interaction zone. Combining localized button state transitions (text change, color shift, confetti) with global system-wide toast alerts and subtle auditory ticks ensures users receive unmistakable confirmation across all sensory channels, while temporarily disabling the trigger prevents accidental double-submission and rate-limiting during async transitions.
**Action:** Use multi-sensory confirmation (button state + global toast + auditory cue) for high-stakes dashboard updates, and temporarily disable the submit button during the success animation.

## 2026-08-02 - [Form Accessibility & Sensitive Token Obfuscation]
**Learning:** Integrating semantic label associations using `<label for="id">` for auxiliary configurations like Databricks Genie makes forms screen-reader friendly and easier to target. Sensitive configuration fields (like Personal Access Tokens) should always default to the 'password' type with a dedicated, ARIA-aligned "SHOW/HIDE" visibility toggle to let users verify inputs securely.
**Action:** Use labeled container wrappers with associated semantic label elements and include password visibility toggles on all sensitive token inputs.

## 2026-08-03 - [Explicit Form Labels and Group Associations]
**Learning:** Standardizing explicit form associations via the `for`/`htmlFor` attribute on labels and wrapping multi-control button rows in a semantic `role="group"` container linked via `aria-labelledby` ensures that screen readers provide complete contextual hints to visual-impaired users. Synchronizing active toggle states (like Live vs Demo mode) with their initial `aria-pressed` values on DOM mount prevents critical mismatch anomalies between assistive tools and CSS presentation layers.
**Action:** Always link form labels to their target input/select controls explicitly and initialize standard toggle buttons with an explicit `aria-pressed` state that mirrors the application's default state.

## 2026-08-07 - [Settings Modal Focus Management & Accessibility annotations]
**Learning:** For floating settings modals or gear panels triggered via an icon-only button, screen readers require explicit "aria-label", "aria-haspopup", and "aria-expanded" attributes on the trigger. When the modal is toggled, programmatically shifting focus to the first range input, and on modal close returning focus back to the triggering element, ensures keyboard users maintain orientation without losing their document position. Explicit range inputs must be linked to semantic `<label>` elements via the `for` attribute for screen-reader compliance.
**Action:** Associate custom sliders with semantic label tags and synchronize dynamic aria-expanded states with programmatic element focus shift.

## 2026-08-08 - [Sensory Verification of Hidden Tokens]
**Learning:** In data-rich environments with background integrations (such as Databricks Genie), providing hidden token inputs is a security necessity, but leaves users blind to potential typing mistakes. Adding semantic form labels associated via the `for` attribute combined with a password visibility SHOW/HIDE toggle solves both screen-reader accessibility and input verification without compromising secret security.
**Action:** Wrap form inputs in distinct layout blocks with explicit labels and include secure SHOW/HIDE buttons for all sensitive personal/pat token fields.

## 2026-08-10 - [Dynamic ARIA Template Synchronization]
**Learning:** When adding initial static ARIA states (like `aria-pressed`) to HTML templates, it is critical to confirm that all existing dynamic client-side JS handlers are fully instrumented to synchronize these attributes on active clicks or layout updates. Mismatches between visual active states and screen-reader announced boolean states create severe accessibility regressions.
**Action:** Always verify that every interactive button with a static ARIA state is backed by an explicit `.setAttribute('aria-pressed', state.toString())` in its associated JavaScript state transition logic.
