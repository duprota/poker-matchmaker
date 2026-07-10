## 2024-03-20 - Missing aria-label for mobile menu button
**Learning:** Found that the Navigation component's mobile menu Button has no `aria-label`, making it inaccessible to screen readers. It's a common pattern in responsive layouts to forget accessibility attributes on UI elements that are only visible on mobile.
**Action:** Always verify accessibility attributes like `aria-label` and `title` on elements that toggle visibility based on screen size (e.g., hidden desktop/visible mobile).
