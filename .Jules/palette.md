## 2026-04-17 - Button size="icon" accessibility pattern
**Learning:** The custom `Button` component with `size="icon"` variant is frequently used across the app (e.g., Navigation, PlayerGameCard) without `aria-label`s, creating a recurring accessibility gap for screen readers specific to this app's design system usage.
**Action:** When creating or reviewing new components that utilize `Button size="icon"`, always enforce the inclusion of `aria-label`. Consider adding a custom ESLint rule to enforce this pattern.
