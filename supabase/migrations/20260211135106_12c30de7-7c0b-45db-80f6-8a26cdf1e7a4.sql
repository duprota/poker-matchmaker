
-- Ledger entries: allow public read
DROP POLICY IF EXISTS "Authenticated users can view ledger entries" ON public.ledger_entries;
CREATE POLICY "Everyone can view ledger entries" ON public.ledger_entries FOR SELECT USING (true);

-- Ledger entries: allow public insert/delete (for settlement operations)
DROP POLICY IF EXISTS "Authenticated users can insert ledger entries" ON public.ledger_entries;
CREATE POLICY "Everyone can insert ledger entries" ON public.ledger_entries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete ledger entries" ON public.ledger_entries;
CREATE POLICY "Everyone can delete ledger entries" ON public.ledger_entries FOR DELETE USING (true);

-- Settlements: allow public access
DROP POLICY IF EXISTS "Authenticated users can view settlements" ON public.settlements;
CREATE POLICY "Everyone can view settlements" ON public.settlements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert settlements" ON public.settlements;
CREATE POLICY "Everyone can insert settlements" ON public.settlements FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update settlements" ON public.settlements;
CREATE POLICY "Everyone can update settlements" ON public.settlements FOR UPDATE USING (true);

-- Settlement items: allow public access
DROP POLICY IF EXISTS "Authenticated users can view settlement items" ON public.settlement_items;
CREATE POLICY "Everyone can view settlement items" ON public.settlement_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert settlement items" ON public.settlement_items;
CREATE POLICY "Everyone can insert settlement items" ON public.settlement_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update settlement items" ON public.settlement_items;
CREATE POLICY "Everyone can update settlement items" ON public.settlement_items FOR UPDATE USING (true);
