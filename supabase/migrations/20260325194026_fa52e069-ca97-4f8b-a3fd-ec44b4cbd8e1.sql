
-- ATP Points table
CREATE TABLE public.atp_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  raw_points NUMERIC NOT NULL,
  base_points NUMERIC NOT NULL,
  sos_multiplier NUMERIC NOT NULL,
  roi_factor NUMERIC NOT NULL,
  position INTEGER NOT NULL,
  roi NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, game_id)
);

ALTER TABLE public.atp_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view atp_points" ON public.atp_points FOR SELECT TO public USING (true);
CREATE POLICY "Everyone can insert atp_points" ON public.atp_points FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Everyone can delete atp_points" ON public.atp_points FOR DELETE TO public USING (true);

-- ATP Config table (single row)
CREATE TABLE public.atp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  window_size INTEGER NOT NULL DEFAULT 15,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.atp_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view atp_config" ON public.atp_config FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated can update atp_config" ON public.atp_config FOR UPDATE TO authenticated USING (true);

INSERT INTO public.atp_config (window_size) VALUES (15);

-- ATP Ranking view (real-time calculation with sliding window)
CREATE OR REPLACE VIEW public.atp_ranking AS
WITH recent_games AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY date DESC) AS rn
  FROM public.games WHERE status = 'completed'
),
config AS (SELECT window_size FROM public.atp_config LIMIT 1)
SELECT 
  p.id,
  p.name,
  p.avatar_url,
  ROUND(SUM(ap.raw_points)::numeric, 1) AS score_atp,
  COUNT(ap.id)::integer AS games_scored
FROM public.players p
JOIN public.atp_points ap ON ap.player_id = p.id
JOIN recent_games rg ON rg.id = ap.game_id
CROSS JOIN config c
WHERE rg.rn <= c.window_size
GROUP BY p.id, p.name, p.avatar_url
ORDER BY score_atp DESC;
