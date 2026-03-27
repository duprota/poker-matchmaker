
-- Table: player_live_params
CREATE TABLE public.player_live_params (
  player_id  uuid NOT NULL REFERENCES public.players(id),
  rb_bucket  TEXT NOT NULL CHECK (rb_bucket IN ('0', '1_2', '3_4', '5plus')),
  delta      NUMERIC NOT NULL DEFAULT 0,
  sample_size INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, rb_bucket)
);

ALTER TABLE public.player_live_params ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view player_live_params" ON public.player_live_params FOR SELECT TO public USING (true);
CREATE POLICY "Everyone can insert player_live_params" ON public.player_live_params FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Everyone can update player_live_params" ON public.player_live_params FOR UPDATE TO public USING (true);

-- Table: live_game_scores
CREATE TABLE public.live_game_scores (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id             uuid NOT NULL REFERENCES public.games(id),
  player_id           uuid NOT NULL REFERENCES public.players(id),
  snapshot_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_rebuys_game   INTEGER NOT NULL,
  personal_rebuys     INTEGER NOT NULL,
  score_normalizado   NUMERIC NOT NULL,
  posicao_esperada    INTEGER NOT NULL
);

CREATE INDEX ON public.live_game_scores (game_id, snapshot_at DESC);

ALTER TABLE public.live_game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view live_game_scores" ON public.live_game_scores FOR SELECT TO public USING (true);
CREATE POLICY "Everyone can insert live_game_scores" ON public.live_game_scores FOR INSERT TO public WITH CHECK (true);
