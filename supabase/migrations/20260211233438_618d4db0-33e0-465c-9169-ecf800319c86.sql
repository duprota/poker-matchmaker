
-- 1. Tabela de despesas
CREATE TABLE public.expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description text NOT NULL,
  total_amount numeric NOT NULL,
  paid_by_player_id uuid NOT NULL REFERENCES public.players(id),
  game_id uuid REFERENCES public.games(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Everyone can insert expenses" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Everyone can update expenses" ON public.expenses FOR UPDATE USING (true);
CREATE POLICY "Everyone can delete expenses" ON public.expenses FOR DELETE USING (true);

-- 2. Tabela de splits (quem deve quanto em cada despesa)
CREATE TABLE public.expense_splits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id uuid NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id),
  amount numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view expense splits" ON public.expense_splits FOR SELECT USING (true);
CREATE POLICY "Everyone can insert expense splits" ON public.expense_splits FOR INSERT WITH CHECK (true);
CREATE POLICY "Everyone can delete expense splits" ON public.expense_splits FOR DELETE USING (true);

-- 3. Adicionar expense_id no ledger_entries para rastreabilidade
ALTER TABLE public.ledger_entries ADD COLUMN expense_id uuid REFERENCES public.expenses(id);
