## 2024-11-20 - Missing ARIA Labels on Icon Buttons
**Learning:** Found multiple icon-only `Button` components across the codebase lacking `aria-label`s, which is bad for screen reader accessibility. Some `button`s also lacked labels.
**Action:** When adding icon-only buttons, always ensure an `aria-label` or `title` is included for accessibility and tooltip display.
