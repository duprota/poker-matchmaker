## 2024-10-02 - Icon-Only Button Accessibility Pattern
**Learning:** Found multiple instances of icon-only `Button` components from Shadcn missing screen-reader accessible names across the application. Added a dual-labeling approach (`aria-label` and `title`) to ensure both screen reader support and sighted user tooltips.
**Action:** When creating or modifying icon-only buttons, always ensure both `aria-label` and `title` attributes are present and translated correctly according to the application's locale.
