## 2026-08-14 - Accessible Mobile Menu Button
**Learning:** The mobile navigation menu toggle button in `src/components/Navigation.tsx` lacked accessible labels, violating WCAG guidelines for icon-only interactive elements.
**Action:** Add `aria-label` and `title` attributes to all icon-only buttons (like `<Button size="icon">`) to ensure screen readers announce them correctly and native tooltips are provided on hover.
