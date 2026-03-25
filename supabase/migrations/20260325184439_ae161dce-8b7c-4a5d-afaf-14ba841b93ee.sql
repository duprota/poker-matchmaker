-- Add rating columns to players
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS mu NUMERIC DEFAULT 25,
  ADD COLUMN IF NOT EXISTS sigma NUMERIC DEFAULT 8.333,
  ADD COLUMN IF NOT EXISTS skill_score NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_games INTEGER DEFAULT 0;

-- Create player_rating_history table
CREATE TABLE IF NOT EXISTS player_rating_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  mu_before NUMERIC NOT NULL,
  sigma_before NUMERIC NOT NULL,
  mu_after NUMERIC NOT NULL,
  sigma_after NUMERIC NOT NULL,
  skill_score_after NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, game_id)
);

ALTER TABLE player_rating_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view rating history"
  ON player_rating_history FOR SELECT TO public USING (true);

CREATE POLICY "Everyone can insert rating history"
  ON player_rating_history FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Everyone can delete rating history"
  ON player_rating_history FOR DELETE TO public USING (true);

CREATE POLICY "Everyone can update rating history"
  ON player_rating_history FOR UPDATE TO public USING (true);