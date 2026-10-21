## 2024-10-21 - Icon-only buttons accessibility
**Learning:** Found multiple instances of icon-only buttons (`<Button size="icon">`) without `aria-label` or `title` attributes. This is a common accessibility issue where screen readers cannot announce the button's purpose, and sighted users lack tooltips.
**Action:** When creating or modifying icon-only buttons, always ensure they have both `aria-label` (for screen readers) and `title` (for native tooltips) to provide a complete and accessible experience.
