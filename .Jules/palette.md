## 2024-03-20 - Missing ARIA Labels on Icon-only Buttons
**Learning:** A recurring accessibility pattern in this codebase is the use of Shadcn `Button` components with `size="icon"` lacking descriptive text. These visually rely on icons (like Pencil, Trash2) but are completely opaque to screen readers and lack native tooltips for sighted users.
**Action:** Always employ a dual-labeling strategy for icon-only buttons: add `aria-label` for screen reader accessibility and `title` to provide native tooltips.
