## 2026-06-15 - [Accessible Cyberpunk UI]
**Learning:** High-density technical interfaces often use icon-only buttons to maintain a "clean" or "cyberpunk" aesthetic, which can be inaccessible to screen readers and confusing for new users.
**Action:** Always pair icon-only buttons with `aria-label` for screen readers and `title` for visual tooltips to balance aesthetic and usability.

## 2026-06-15 - [Transparent Financial Metrics]
**Learning:** In trading apps, "Balance" is often an aggregated figure. Users benefit from seeing the breakdown between Realised (actual) and Unrealised (paper) gains without taking up extra screen real estate.
**Action:** Use tooltips on primary financial figures to provide "at-a-glance" breakdowns, improving information transparency while maintaining a minimal UI footprint.

## 2026-06-18 - [State-Aware Navigation]
**Learning:** In multi-tab applications, context-specific actions (like "Add Item") that happen on a different tab than the current view can be disorienting if they don't provide immediate visual feedback.
**Action:** Ensure that global triggers (like a header "+" button) automatically navigate the user to the relevant view where the resulting menu or form is displayed, reducing interaction friction.

## 2026-06-18 - [Accessible Tab Implementation]
**Learning:** Custom tab implementations often fail to meet accessibility standards by only changing visual styles (like an "active" class). Screen reader users need semantic roles and dynamic state updates.
**Action:** Implement the full ARIA Tab Pattern by using `role="tablist"`, `role="tab"`, and `role="tabpanel"`, and dynamically updating `aria-selected` and `tabindex` during tab transitions.
