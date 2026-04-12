## 2026-04-12 - Icon Button Accessibility
**Learning:** Icon-only buttons used for inline editing (like in EditableRebuys) often lack screen reader context, making it difficult for visually impaired users to understand actions like edit, save, or cancel.
**Action:** Always verify that icon-only buttons (`variant="ghost" size="icon"`) include an `aria-label` attribute describing the action they perform.
