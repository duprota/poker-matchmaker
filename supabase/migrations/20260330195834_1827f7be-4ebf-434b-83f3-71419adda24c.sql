-- badge_definitions table
CREATE TABLE public.badge_definitions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  emoji        TEXT NOT NULL,
  category     TEXT NOT NULL CHECK (category IN ('partida_unica','sequencia','marco','comportamento','elite')),
  persistence  TEXT NOT NULL CHECK (persistence IN ('permanent','dynamic')),
  description  TEXT NOT NULL,
  criteria_note TEXT
);

ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view badge definitions"
  ON public.badge_definitions FOR SELECT
  USING (true);

-- player_badges table
CREATE TABLE public.player_badges (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id     uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  badge_code    TEXT NOT NULL REFERENCES public.badge_definitions(code),
  game_id       uuid REFERENCES public.games(id) ON DELETE SET NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  conquered_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  lost_at       TIMESTAMPTZ,
  metadata      JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_player_badges_player ON public.player_badges(player_id);
CREATE INDEX idx_player_badges_active ON public.player_badges(player_id, is_active);
CREATE INDEX idx_player_badges_game   ON public.player_badges(game_id);

ALTER TABLE public.player_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active badges are public"
  ON public.player_badges FOR SELECT
  USING (is_active = true);

CREATE POLICY "Inactive badges visible only to owner"
  ON public.player_badges FOR SELECT
  USING (is_active = false AND player_id IN (
    SELECT id FROM public.players WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage badges"
  ON public.player_badges FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Seed badge_definitions
INSERT INTO public.badge_definitions (code, name, emoji, category, persistence, description) VALUES
('sniper',       'Sniper',          '🎯', 'partida_unica', 'permanent', 'Venceu sem gastar uma bala extra'),
('fenix',        'Fênix',           '🔥', 'partida_unica', 'permanent', 'Ressuscitou quando o modelo o descartou'),
('zebra',        'Zebra',           '🦓', 'partida_unica', 'permanent', 'Maior azarão — venceu do nada'),
('agiota',       'Agiota',          '💰', 'partida_unica', 'permanent', 'Lucrou mais com menos investimento'),
('ultimo_pe',    'Último de Pé',    '🏝️', 'partida_unica', 'permanent', 'Único sem rebuy enquanto a mesa afundava'),
('regicida',     'Regicida',        '👑', 'partida_unica', 'permanent', 'Derrubou o favorito da mesa'),
('trem_bala',    'Trem-Bala',       '🚄', 'sequencia',     'dynamic',   'Três vitórias seguidas sem parar'),
('intratavel',   'Intratável',      '🛡️', 'sequencia',     'dynamic',   'Sempre no pódio — difícil de tirar'),
('metronomo',    'Metrônomo',       '🎵', 'sequencia',     'dynamic',   'Lucrando jogo após jogo sem oscilação'),
('foguete',      'Foguete',         '🚀', 'sequencia',     'dynamic',   'Score ATP em ascensão constante'),
('espiral',      'Espiral',         '🌀', 'sequencia',     'dynamic',   'Perdendo e rebuyando em queda livre'),
('ave_cinzas',   'Ave das Cinzas',  '⚡', 'sequencia',     'dynamic',   'Venceu depois da pior fase da carreira'),
('novato',       'Novato',          '🌱', 'marco',         'permanent', 'Primeiro jogo completado'),
('frequentador', 'Frequentador',    '🎖️', 'marco',         'permanent', 'Presença regular no grupo'),
('da_casa',      'Da Casa',         '🏠', 'marco',         'permanent', 'Parte da história do grupo'),
('lenda',        'Lenda',           '🏆', 'marco',         'permanent', 'Nome gravado na história'),
('batismo_fogo', 'Batismo de Fogo', '🩸', 'marco',         'permanent', 'Primeiro rebuy da carreira'),
('tombo',        'Recordista do Tombo', '📉', 'marco',     'permanent', 'Maior perda da história do grupo'),
('milionario',   'Milionário',      '💎', 'marco',         'permanent', 'Lucro acumulado muito acima da média'),
('cirurgiao',    'Cirurgião',       '🔬', 'comportamento', 'dynamic',   'Rebuy muito abaixo da média — precisão cirúrgica'),
('pistoleiro',   'Pistoleiro',      '🤠', 'comportamento', 'dynamic',   'Rebuy muito acima da média — entra em tudo'),
('renascido',    'Renascido',       '🦋', 'comportamento', 'dynamic',   'Era Sangrador, virou Fênix de verdade'),
('fiel_estilo',  'Fiel ao Estilo',  '📍', 'comportamento', 'dynamic',   'Mesmo arquétipo há muito tempo'),
('assombracao',  'Assombração',     '👻', 'comportamento', 'dynamic',   'Sumiu — não aparece há vários jogos'),
('cabeca_chave', 'Cabeça de Chave', '🥇', 'elite',         'dynamic',   'Líder do ranking ATP'),
('podio',        'Pódio',           '🥈', 'elite',         'dynamic',   'Top 3 no ranking ATP'),
('craque_rodada','Craque da Rodada','⭐', 'elite',         'dynamic',   'Melhor desempenho no último jogo'),
('eficiencia',   'Eficiência Máxima','📐','elite',         'dynamic',   'Maior ROI médio do grupo'),
('favorito',     'Favorito do Momento','🔮','elite',       'dynamic',   'Maior chance pré-jogo no último jogo')
ON CONFLICT (code) DO NOTHING;