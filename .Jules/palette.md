## 2024-05-24 - Accessibility labels for Icon Buttons
**Learning:** The application heavily utilizes `<Button size="icon">` components without `aria-label` or `title` attributes, severely impacting screen reader accessibility and hiding context from sighted users.
**Action:** Ensure all icon-only buttons include both `aria-label` (for screen readers) and `title` (for hover tooltips).
