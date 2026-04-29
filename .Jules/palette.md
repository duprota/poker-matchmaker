## 2024-05-18 - Adding Accessible Labels to Icon Buttons
**Learning:** Found several icon-only buttons using `<Button size="icon">` without `aria-label` attributes in `GameHeader.tsx`, which poses accessibility issues for screen readers since they have no textual indication of their action.
**Action:** Always add descriptive `aria-label` attributes in English to icon-only buttons to enhance overall accessibility and follow UI best practices.
