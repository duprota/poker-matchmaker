## 2024-05-24 - Missing ARIA labels on icon-only buttons
**Learning:** Icon-only buttons (using `<Button size="icon">`) across the application consistently lack `aria-label` attributes, presenting a significant accessibility barrier for screen reader users who will only hear "button" without context.
**Action:** Establish a pattern of always including an `aria-label` whenever `size="icon"` is used on a Button component, starting with the primary navigation menu.
