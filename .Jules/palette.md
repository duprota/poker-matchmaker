## 2024-10-17 - Added Accessibility and Tooltips to EditableRebuys
**Learning:** Icon-only buttons in complex tables (like player rebuys) need both screen reader labels (aria-label) and native visual tooltips (title) to ensure usability for all user segments.
**Action:** Always implement a dual-labeling approach (`aria-label` + `title`) on `size="icon"` components going forward.
