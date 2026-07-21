## 2026-07-21 - Accessibility for Top-Level Navigation Actions
**Learning:** Icon-only navigation buttons, especially in global elements like the top header (hamburger menu) or context headers (back buttons), require explicit labeling. Screen readers announce these as 'button' without context if aria-labels are missing, creating significant friction for primary navigation paths.
**Action:** Always add 'aria-label' and 'title' (for hover tooltips) to icon-only buttons in primary navigation flows.
