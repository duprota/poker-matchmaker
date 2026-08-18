## 2026-08-18 - Adding ARIA labels to GameHeader
**Learning:** Found multiple icon-only buttons in the game header that lack accessible names, making them difficult for screen reader users to understand. This pattern of missing ARIA labels on icon buttons seems common in the app.
**Action:** Add aria-label to all icon-only buttons (like back, check/save, cancel, edit) and ensure this pattern is applied consistently across components.
