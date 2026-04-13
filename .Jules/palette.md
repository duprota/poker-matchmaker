## 2024-05-24 - Missing ARIA Labels on Icon Buttons
**Learning:** Radix/Shadcn icon-only buttons (using `<Button variant="ghost" size="icon">`) lack ARIA labels by default in this codebase, which creates an accessibility gap for screen readers.
**Action:** Always verify that aria-label or title is added to icon-only buttons across the app.
