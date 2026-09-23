## 2024-05-20 - [GameHeader] Add aria-label and title to icon-only buttons
**Learning:** Icon-only buttons used for primary actions in game management (e.g. edit, delete, back, save, cancel) were missing aria-labels and native tooltips, which impairs screen reader users and creates ambiguity for sighted users.
**Action:** Always employ a dual-labeling approach (`aria-label` for screen readers and `title` for native tooltips) on all icon-only Shadcn UI Buttons across the application to ensure universal accessibility.
