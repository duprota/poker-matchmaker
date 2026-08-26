## 2026-08-26 - Adding accessibility labels to mobile navigation menu
**Learning:** Icon-only buttons (like the hamburger menu) are frequently missing accessible names which is problematic for screen reader users and can be confusing without tooltips.
**Action:** Add aria-label and title attributes to any icon-only button like `<Button variant="ghost" size="icon">`, ensuring it has a readable text fallback.
