## 2024-05-24 - Add aria-label and title to destructive icon buttons
**Learning:** Icon-only buttons for destructive actions (like removing a player) can be ambiguous for sighted users and inaccessible for screen reader users if they lack proper labels.
**Action:** Always add both `aria-label` for screen reader accessibility and `title` for a native tooltip when implementing icon-only buttons, especially for destructive actions.
