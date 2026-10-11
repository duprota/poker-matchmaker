## 2024-05-18 - Tooltips and Aria Labels on Icon-only Buttons
**Learning:** Icon-only buttons (like `Button` with `variant="ghost" size="icon"`) lack screen-reader and tooltip context. Without `aria-label` or `title`, they can be confusing and inaccessible.
**Action:** Always include both `aria-label` and `title` when defining icon-only buttons to enhance accessibility and usability across the app.
