1. **Explore the Codebase for missing ARIA labels or titles on icon-only buttons**
   - We ran `grep -rn "size=\"icon\"" src/` and reviewed files like `src/components/Navigation.tsx`, `src/components/games/GameHeader.tsx`, `src/components/expenses/ExpenseCard.tsx`, `src/components/players/AvatarGallery.tsx`, `src/components/players/AvatarUploader.tsx`.
   - Identified that many `Button`s with `size="icon"` only contain a `Lucide` icon and lack `aria-label` or `title` attributes.
   - For example, `Navigation.tsx` has a hamburger menu `Button` without an `aria-label="Open menu"`.
   - `AvatarGallery.tsx` has previous/next style buttons without `aria-label`.

2. **Formulate a daily UX enhancement**
   - Goal: Add `aria-label` and `title` to the icon-only buttons in the navigation (`Navigation.tsx`), expense card (`ExpenseCard.tsx`), and avatar gallery (`AvatarGallery.tsx`) for better screen reader accessibility and native tooltips.

3. **Plan the changes**
   - Edit `src/components/Navigation.tsx`: Add `aria-label="Open menu"` and `title="Open menu"` to the hamburger menu button.
   - Edit `src/components/expenses/ExpenseCard.tsx`: Add `aria-label="Delete expense"` and `title="Delete expense"` to the trash icon button.
   - Edit `src/components/players/AvatarGallery.tsx`: Add `aria-label="Previous style"`/`title="Previous style"`, `aria-label="Next style"`/`title="Next style"`, and `aria-label="Shuffle avatars"`/`title="Shuffle avatars"` to the respective icon buttons.
   - Edit `src/components/games/GameHeader.tsx`: Add appropriate `aria-label` and `title` to the icon buttons (back, edit, save, cancel edit, delete game).

4. **Verify changes**
   - Run `pnpm lint` to ensure no errors were introduced.
   - Run `pnpm build` to verify the build completes successfully.
   - Perform Playwright frontend verification visually and interactively using `frontend_verification_instructions` and `frontend_verification_complete`.

5. **Journaling**
   - Do not journal this change since it is considered routine (adding ARIA labels). The `.Jules/palette.md` file has already been created for future use.

6. **Pre-commit Steps**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
