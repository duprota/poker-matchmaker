## 2024-05-24 - Accessibility: Missing ARIA Labels on Icon Buttons
**Learning:** Icon-only buttons without `aria-label` attributes are inaccessible to screen readers, leaving users without context on the button's action. A systematic pattern is missing these labels on elements like <Button size="icon">.
**Action:** Add descriptive `aria-label` and `title` attributes to all icon-only buttons to enhance accessibility and usability.
