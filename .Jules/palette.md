## 2024-03-15 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Icon-only buttons (like the hamburger menu or back/edit buttons in headers) frequently lack `aria-label` attributes across the application, reducing screen reader accessibility.
**Action:** Always add descriptive `aria-label`s to `<Button size="icon">` components that don't have visible text content.
