## 2025-05-14 - Replacing intrusive alerts with toasts
**Learning:** Using `window.alert()` breaks the user flow and feels "unpolished" in a modern dashboard. Integrating with a non-blocking toast system improves the "delight" factor and maintains engagement without requiring modal confirmation for routine successes.
**Action:** Always check for an existing notification or toast utility before resorting to `alert()`. Ensure success states for minor actions (like task completion) are acknowledged visually but non-intrusively.
