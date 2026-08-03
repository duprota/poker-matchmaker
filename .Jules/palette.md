## 2026-08-03 - Accessible Mobile Navigation
**Learning:** The mobile navigation hamburger menu was an icon-only button without an accessible name, making it invisible to screen readers.
**Action:** Always add `aria-label` and `title` to icon-only `<Button size="icon">` components to ensure they are announced properly by screen readers and provide a visual tooltip for all users.
