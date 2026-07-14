## 2026-07-14 - Shadcn Icon Button Accessibility Pattern
**Learning:** Shadcn `<Button size="icon">` components (e.g., the mobile menu, avatar gallery controls, edit toggles) in this app often lack accessible names since they only wrap icons.
**Action:** Whenever introducing or interacting with icon-only buttons, systematically verify and apply `aria-label` (for screen readers) and `title` (for visual tooltips) attributes to ensure accessibility and usability are maintained.
