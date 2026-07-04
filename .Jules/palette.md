## 2026-07-04 - Adding accessibility labels and tooltips to icon-only buttons
**Learning:** Icon-only buttons frequently lack context for screen readers and lack visual affordance for desktop users who rely on hover tooltips. Adding `aria-label` and `title` is a low-effort, high-impact pattern.
**Action:** Whenever introducing a button with `size="icon"` or one that only contains an SVG/icon component, explicitly include an `aria-label` (for a11y) and a `title` attribute (for standard hover tooltips).
