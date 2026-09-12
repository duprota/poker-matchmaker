## 2024-05-24 - Icon-only buttons accessibility
**Learning:** Icon-only buttons without accessible names are widespread in this application's components. Screen readers cannot interpret their function.
**Action:** Enforce a strict pattern of always adding `aria-label` and `title` attributes whenever using `<Button size="icon">`.
