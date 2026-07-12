## 2026-07-12 - Missing Labels on Icon-only Buttons
**Learning:** Found a recurring pattern where icon-only buttons (like Edit, Save, and Cancel in tables) lacked both `aria-label` for screen readers and `title` for visual hover tooltips, creating accessibility and usability gaps.
**Action:** Always add descriptive `aria-label` and `title` attributes to `<Button size="icon">` elements across the app to ensure actions are clear to all users.
