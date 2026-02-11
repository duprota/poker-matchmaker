
-- =============================================
-- ETAPA 1: Ledger Bancário - Schema Completo
-- =============================================

-- 1. Tabela ledger_entries (livro razão)
CREATE TABLE public.ledger_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('game_credit', 'game_debit', 'expense', 'settlement')),
  game_id uuid REFERENCES public.games(id) ON DELETE SET NULL,
  settlement_item_id uuid, -- FK added after settlement_items is created
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ledger_entries_player ON public.ledger_entries(player_id);
CREATE INDEX idx_ledger_entries_game ON public.ledger_entries(game_id);
CREATE INDEX idx_ledger_entries_type ON public.ledger_entries(entry_type);

-- 2. Tabela settlements (snapshots de cálculo de ajuste)
CREATE TABLE public.settlements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'replaced')),
  created_by uuid REFERENCES auth.users(id)
);

-- 3. Tabela settlement_items (transações P2P geradas)
CREATE TABLE public.settlement_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  settlement_id uuid NOT NULL REFERENCES public.settlements(id) ON DELETE CASCADE,
  from_player_id uuid NOT NULL REFERENCES public.players(id),
  to_player_id uuid NOT NULL REFERENCES public.players(id),
  amount numeric NOT NULL CHECK (amount > 0),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_settlement_items_settlement ON public.settlement_items(settlement_id);

-- Agora adicionar a FK de ledger_entries -> settlement_items
ALTER TABLE public.ledger_entries
  ADD CONSTRAINT fk_ledger_settlement_item
  FOREIGN KEY (settlement_item_id) REFERENCES public.settlement_items(id) ON DELETE SET NULL;

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_items ENABLE ROW LEVEL SECURITY;

-- ledger_entries: leitura para autenticados, inserção via trigger/sistema
CREATE POLICY "Authenticated users can view ledger entries"
  ON public.ledger_entries FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert ledger entries"
  ON public.ledger_entries FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- settlements: leitura e criação para autenticados
CREATE POLICY "Authenticated users can view settlements"
  ON public.settlements FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert settlements"
  ON public.settlements FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update settlements"
  ON public.settlements FOR UPDATE
  USING (auth.role() = 'authenticated');

-- settlement_items: leitura, inserção e update para autenticados
CREATE POLICY "Authenticated users can view settlement items"
  ON public.settlement_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert settlement items"
  ON public.settlement_items FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update settlement items"
  ON public.settlement_items FOR UPDATE
  USING (auth.role() = 'authenticated');

-- =============================================
-- TRIGGER: Criar ledger entries ao finalizar jogo
-- =============================================

CREATE OR REPLACE FUNCTION public.create_ledger_entries_on_game_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só executa quando status muda para 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    INSERT INTO public.ledger_entries (player_id, amount, entry_type, game_id, description)
    SELECT
      gp.player_id,
      -- amount = final_result - total investido (buyin + rebuys)
      gp.final_result - (gp.initial_buyin + (gp.total_rebuys * gp.initial_buyin)),
      CASE
        WHEN gp.final_result - (gp.initial_buyin + (gp.total_rebuys * gp.initial_buyin)) >= 0
          THEN 'game_credit'
        ELSE 'game_debit'
      END,
      NEW.id,
      'Resultado do jogo ' || COALESCE(NEW.name, to_char(NEW.date, 'DD/MM/YYYY'))
    FROM public.game_players gp
    WHERE gp.game_id = NEW.id
      AND gp.final_result IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_ledger_entries_on_game_complete
  AFTER UPDATE ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION public.create_ledger_entries_on_game_complete();

-- =============================================
-- LIMPEZA: Remover dados financeiros antigos
-- =============================================

-- Limpar game_transactions (dados financeiros legados)
DELETE FROM public.game_transactions;

-- Resetar payment_status dos game_players (será gerido pelo ledger agora)
UPDATE public.game_players SET payment_status = 'pending', payment_amount = 0, payment_date = NULL;
