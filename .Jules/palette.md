## 2026-04-30 - Missing aria-labels on icon-only buttons
**Learning:** Found an accessibility issue pattern specific to this app's components: many icon-only buttons (`<Button size="icon">`) across the application lack `aria-label` attributes, making their purpose invisible to screen readers.
**Action:** When adding or modifying `<Button size="icon">` components, always ensure an appropriate English `aria-label` is provided to describe the button's action.
