## 2026-07-08 - Adding accessibility attributes to icon-only buttons
**Learning:** Icon-only buttons used for critical actions like 'Delete', 'Remove', or 'Menu Toggle' are common across various components (Navigation, ExpenseCard, PlayerGameCard) but often lack native tooltips and screen reader descriptions.
**Action:** Always verify icon-only `<Button size="icon">` components and explicitly add `aria-label` and `title` attributes to ensure they are accessible and intuitive for all users.
