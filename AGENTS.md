## Game updates
- Keep optimistic cashout values in a shared game-level hook and pass the resulting players to cards and live probabilities, so exit displays cannot disagree.
- Confirm cashouts from the returned database row, refresh authoritative game data explicitly, and reject failed writes so callers cannot report false success.
- Keep live probability calculations server-side; local exit overlays only change membership and displayed exit balances, never the scoring algorithm.
- Keep cashout entry in a stable standalone dialog with reserved result space; mobile viewport geometry owns keyboard accommodation instead of competing drawer repositioning.