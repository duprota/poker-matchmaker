## 2026-04-28 - Adding aria-labels to icon-only buttons
**Learning:** Found several icon-only buttons (like Edit, Save, Delete, Menu) across the app components (e.g., `GameHeader`, `Navigation`) missing accessible names, which are critical for screen reader users to understand the button's action.
**Action:** Always add descriptive `aria-label` attributes to icon-only buttons (e.g., `<Button size="icon">`) to maintain accessibility standards and ensure screen reader compatibility.
