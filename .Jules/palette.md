## 2025-01-20 - Accessible Icon Buttons
**Learning:** Icon-only buttons used for primary actions (like Edit, Save, Delete, Back) often lack screen reader support and visual hover context.
**Action:** Always add `aria-label` for screen readers and `title` for native tooltips when implementing icon-only `<Button size="icon">` components.
