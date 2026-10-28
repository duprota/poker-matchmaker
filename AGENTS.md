## Game updates
- Keep optimistic cashout values in a shared game-level hook and pass the resulting players to cards and live probabilities, so exit displays cannot disagree.
- Confirm cashouts from the returned database row, refresh authoritative game data explicitly, and reject failed writes so callers cannot report false success.
- Keep live probability calculations server-side; local exit overlays only change membership and displayed exit balances, never the scoring algorithm.
- Use one standalone cashout dialog for initial exits and corrections, keep it mounted until confirmed, and reserve result/error space; mobile visual-viewport geometry is its sole keyboard-layout owner.