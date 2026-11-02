## 2024-03-24 - Accessibility improvements for icon-only buttons
**Learning:** Found several icon-only buttons across the app without `aria-label` or `title` attributes, which creates an accessibility issue for screen reader users and discoverability issues for sighted users.
**Action:** Implemented a dual-labeling approach (`aria-label` and `title`) for icon-only buttons like those in `GameHeader.tsx`, `PlayerRebuysCard.tsx`, and `PlayerGameCard.tsx`.
