

# Players Page — Redesign Implementation

The approved plan has not been implemented yet. Here is the full implementation breakdown.

## Files to Create

### 1. `src/hooks/usePlayerStats.ts`
New hook that queries `game_players` joined with `games` for a given `player_id`. Computes:
- Games played (count where `final_result` is not null)
- Net earnings (sum of `final_result - initial_buyin * (1 + total_rebuys)`)
- ROI% (net / total invested * 100)
- Best/worst single game net
- Win rate (% of games with positive net)
- Progress data array (date + running_total) for the chart
- Game history list (date, buyin, rebuys, result, net)

Uses a single Supabase query: `game_players` with `select("*, games(date, status, name)")` filtered by `player_id` and `games.status = 'completed'`.

### 2. `src/pages/Players/PlayerProfile.tsx`
New page component with:
- Back button linking to `/players`
- Large centered avatar (96px, clickable via `AvatarUploader` with `size` prop)
- Player name, email, PIX key display
- Edit/Delete action buttons
- **KPI grid**: 4 cards (Games, Net, ROI%, Best Game) using data from `usePlayerStats`
- **Tabs** ("Progress" / "Games"):
  - Progress tab: Reuses `ProgressChart` pattern (Recharts `LineChart` with `running_total` over time)
  - Games tab: Table listing each game with date, buyin, rebuys, final result, net

### 3. `src/components/players/PlayerKPICards.tsx`
Grid of 4 stat cards. Each card shows an icon, label, and value with color coding (green for positive, red for negative on monetary values).

### 4. `src/components/players/PlayerGameHistory.tsx`
Table component showing the player's completed games. Columns: Date, Game Name, Buy-in, Rebuys, Final Result, Net. Each row links to `/games/:id`.

## Files to Modify

### 5. `src/pages/Players.tsx`
Rewrite to a contact-list style layout:
- Move creation form into a Dialog (triggered by "+ Add" button in header)
- Search bar to filter players by name
- Each player row: Avatar (40px) | Name + mini-KPIs (games, net) | Balance indicator
- Click navigates to `/players/:id` via `useNavigate`
- Remove the grid card layout

### 6. `src/components/players/AvatarUploader.tsx`
- Add optional `size` prop (`'sm' | 'lg'`, default `'sm'`)
- Remove the external "Alterar foto" button — clicking the avatar circle itself opens the dialog (already works this way, just remove the redundant Button)
- `sm` = 40px (list), `lg` = 96px (profile)

### 7. `src/App.tsx`
Add route: `<Route path="/players/:id" element={<PlayerProfile />} />`

## Order of Implementation

1. `usePlayerStats.ts` (data layer)
2. `AvatarUploader.tsx` (remove button, add size prop)
3. `PlayerKPICards.tsx` + `PlayerGameHistory.tsx` (profile sub-components)
4. `PlayerProfile.tsx` (profile page)
5. `Players.tsx` (list redesign)
6. `App.tsx` (routing)

