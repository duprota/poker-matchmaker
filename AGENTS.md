## Game updates
- Keep optimistic cashout values in a shared game-level hook and pass the resulting players to cards and live probabilities, so exit displays cannot disagree.
- Confirm cashouts from the returned database row, refresh authoritative game data explicitly, and reject failed writes so callers cannot report false success.
- Keep live probability calculations server-side; local exit overlays only change membership and displayed exit balances, never the scoring algorithm.
- Use one standalone cashout dialog for initial exits and corrections, keep it mounted until confirmed, and reserve result/error space; mobile visual-viewport geometry is its sole keyboard-layout owner.
- Confirm buy-in corrections from the returned row and share confirmed overrides at game level; the database trigger audits changes and appends completed-game ledger deltas atomically without rewriting settlements or final chips.
- Route game completion corrections and expense edits through authenticated server operations; financial changes are transactional and paid settlements are immutable because historical corrections must not erase money already transferred.
- Rebuild derived rankings in an isolated chronological replay and publish atomically through a single-owner persisted job; failed work remains retryable without exposing partially recalculated tables.
- Keep replay engines inside game-correction/engines and mirror algorithm changes from the standalone functions; deployment packages omit sibling function directories, so cross-function source imports are not deployable.