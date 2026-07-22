## 2026-07-22 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Discovered a pattern where icon-only `<Button size="icon">` components (e.g., using Lucide icons) were implemented without descriptive text alternatives. This renders them completely inaccessible to screen reader users and missing helpful tooltips for visual users.
**Action:** Always add descriptive `aria-label` and `title` attributes to icon-only buttons to ensure they convey their purpose to assistive technologies and provide visual hover tooltips.
