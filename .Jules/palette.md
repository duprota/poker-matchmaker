
## 2024-04-18 - ARIA Labels and State Overrides
**Learning:** When using `aria-label` on buttons that contain both an icon and text (like a count), the `aria-label` completely overrides the inner text content for screen readers. A naive label like "Like player" will cause the user to miss the stat count entirely.
**Action:** When adding `aria-label` to buttons with visible stats, dynamically include the stat in the label (e.g., ``aria-label={`Like player, ${stats.likes} likes`}``) to ensure no information is lost.
