## 2024-08-16 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Icon-only buttons (like those with `size="icon"` from shadcn) lack accessible names by default, which harms screen reader accessibility and omits native hover tooltips.
**Action:** Always add `aria-label` for screen readers and `title` for visual hover tooltips when using icon-only buttons.
