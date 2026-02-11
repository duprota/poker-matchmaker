
-- Allow authenticated users to delete ledger entries (needed for unmark settlement)
CREATE POLICY "Authenticated users can delete ledger entries"
  ON public.ledger_entries FOR DELETE
  USING (auth.role() = 'authenticated');
