## 2024-05-18 - Added Tooltips to Icon-Only Buttons
**Learning:** Icon-only buttons (like those with `size="icon"`) lack visual context for sighted users who don't use screen readers, and they lack accessible names for screen reader users. In this app's components, this pattern was found on various control buttons.
**Action:** Add both `aria-label` (for screen readers) and `title` (for native browser tooltips on hover) to all icon-only interactive elements.
