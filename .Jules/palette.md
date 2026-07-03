## 2024-11-20 - Icon-Only Button Accessibility in GameHeader
**Learning:** Verified that `aria-label` alone isn't always enough for sighted users who might not understand an icon. The `title` attribute provides a native tooltip that acts as a simple, zero-dependency way to explain icon-only buttons like those in `GameHeader`.
**Action:** Always pair `aria-label` with `title` for icon-only buttons unless a custom tooltip component is being explicitly used to ensure both screen reader and sighted user accessibility.
