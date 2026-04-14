
## 2024-04-14 - Tooltip and AlertDialog Composition
**Learning:** Wrapping a Tooltip Trigger inside an AlertDialogTrigger using a `div` wrapper breaks screen reader announcements for the dialog because the AlertDialogTrigger's accessibility attributes are forwarded to the `div`, not the button.
**Action:** Always compose Radix components by nesting the triggers directly with `asChild` without intermediate non-semantic elements (e.g., `<AlertDialogTrigger asChild><TooltipTrigger asChild><Button>...</Button></TooltipTrigger></AlertDialogTrigger>`).
