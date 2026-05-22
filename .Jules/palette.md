## 2024-05-22 - Adding ARIA labels to icon buttons
 **Learning:** In an app with many icon-only actions (like edit, delete, or save within data tables and headers), users relying on screen readers miss critical context without proper ARIA labels.
 **Action:** Proactively identify and add descriptive `aria-label` attributes to all icon-only `<Button size="icon">` components across the UI to ensure screen readers can announce their function.
