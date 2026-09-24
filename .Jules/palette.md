## 2026-09-24 - Missing accessibility attributes on icon-only buttons
**Learning:** Found multiple instances where icon-only buttons (using `size="icon"`) lacked `aria-label` or `title` attributes, severely impacting screen reader accessibility and hiding helpful native tooltips for sighted users.
**Action:** Always add descriptive `aria-label` (for screen readers) and `title` (for native tooltips) attributes to any button that uses an icon instead of text.
