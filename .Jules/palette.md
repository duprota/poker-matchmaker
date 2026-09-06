## 2024-11-20 - Ensure icon-only buttons have accessible names
**Learning:** Icon-only buttons (like `<Button size="icon">`) are completely invisible to screen readers without proper aria-labels, and users lack context without visual tooltips.
**Action:** Always add `aria-label` (for screen readers) and `title` (for visual hover tooltips) to any button that only contains an icon.
