## 2026-08-20 - Icon-Only Button Labels
**Learning:** A recurring pattern in this app's components (like GameHeader and Navigation) involves using icon-only buttons (`<Button size="icon">`) without accessible labels.
**Action:** Always add descriptive `aria-label` (for screen readers) and `title` (for visual hover tooltips) attributes to icon-only buttons to maintain accessibility and usability standards.
