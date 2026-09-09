## 2024-12-05 - Missing ARIA Labels on Icon-only Buttons
**Learning:** Found several components using `<Button size="icon">` with Lucide icons (like `Pencil`, `Trash2`, `X`, `Check`, `ArrowLeft`) but completely lacking `aria-label` or `title` attributes, making them inaccessible to screen readers and lacking hover context for users.
**Action:** When adding icon-only buttons, always ensure they have an `aria-label` for screen readers and a `title` for visual users to explain the action.
