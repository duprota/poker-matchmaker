## 2023-10-13 - Icon-only buttons accessibility pattern
**Learning:** Found several icon-only buttons (like delete, edit, back arrows) in GameHeader, Navigation, and others lacking screen reader `aria-label` or native tooltips (`title`). A common pattern is using the Shadcn `<Button variant="ghost" size="icon">` combined with Lucide icons.
**Action:** Establish a dual-labeling approach: add `aria-label` for screen reader accessibility and `title` to provide native tooltips for sighted users.
