## 2026-04-15 - Icon-Only Button ARIA Labels
**Learning:** Found multiple icon-only buttons (using Shadcn UI's Button with variant='ghost' and size='icon') that were missing `aria-label` attributes. Without these labels, screen readers announce these buttons as 'button' without any context, making the app difficult to navigate for visually impaired users.
**Action:** Added descriptive `aria-label` attributes to these icon-only buttons across `GameHeader`, `EditableRebuys`, and `ExpenseCard` components to ensure screen readers can announce their functions correctly.
