
-- Remove old orphaned settlement ledger entries (from replaced settlements, pre-2026)
DELETE FROM ledger_entries WHERE id IN (
  'a545e5fe-77fa-492f-8095-d139d8a09f2b',
  'dae8a9c7-fcca-48c7-ac9f-7ab2422b3066',
  '056a36c7-94b5-46f3-a4a9-ec212b401926',
  'd1b2d87d-62f9-45ee-8091-79a6e8a30685',
  '44f77ef7-891d-4b04-b81c-3687f17f8b2f',
  '8c6ac55c-e35a-424e-bc16-8b96799a71fb',
  '16ef329f-4722-4655-afd6-58b3bcaea18b',
  '1c6e50ae-3c87-4903-bcda-01bff4a0b371'
);
