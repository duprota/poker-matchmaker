## 2024-11-29 - Missing ARIA Labels on Icon Buttons
**Learning:** The application uses many icon-only buttons (`<Button size="icon">`) without `aria-label` attributes, which makes them inaccessible to screen readers as the purpose of the buttons cannot be deduced from visual context alone.
**Action:** When working on components, specifically check for and add descriptive English `aria-label` attributes to any icon-only interactive elements.
