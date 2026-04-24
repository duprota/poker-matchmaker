## 2024-05-18 - Missing ARIA labels on Icon Buttons
**Learning:** Found multiple instances where `<Button size="icon">` from the design system lacked accessible names, making them invisible or confusing to screen reader users (e.g., the mobile menu button and the expense delete button). Sighted users rely on the icons, but the semantic meaning was missing.
**Action:** Always ensure that any button without visible text, especially those using `size="icon"`, includes a descriptive `aria-label` (and often a `title` for sighted user tooltips).
