## 2024-07-07 - Add accessible labels to icon-only buttons
**Learning:** Icon-only buttons without text fallback are frequently missed in Shadcn/Lucide setups, resulting in poor screen reader accessibility.
**Action:** Always add aria-label and title attributes to Button components containing only an icon.
