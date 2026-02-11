
-- =============================================
-- 1. INSERT LEDGER ENTRIES FOR ALL 4 GAMES
-- =============================================

-- Game 1: Primeiro poker do ano 2026 (4ac6a9b8)
INSERT INTO ledger_entries (player_id, amount, entry_type, game_id, description) VALUES
('e62a32c9-9abc-4ab3-8814-05606a300e9f', -400, 'game_debit', '4ac6a9b8-8f37-49eb-b123-be5c258cce92', 'Resultado do jogo Primeiro poker do ano 2026'),
('0d80fdb7-7fcd-446c-ac07-aa866e816f24', -700, 'game_debit', '4ac6a9b8-8f37-49eb-b123-be5c258cce92', 'Resultado do jogo Primeiro poker do ano 2026'),
('6711c1cc-dfd3-4470-939b-eb08329d0aaf', -400, 'game_debit', '4ac6a9b8-8f37-49eb-b123-be5c258cce92', 'Resultado do jogo Primeiro poker do ano 2026'),
('9b8032c9-f3e4-4ade-91f0-c8955ccc4345', -194, 'game_debit', '4ac6a9b8-8f37-49eb-b123-be5c258cce92', 'Resultado do jogo Primeiro poker do ano 2026'),
('aaa73df4-5d6e-4e79-a094-9fdb0dc77e54', 890, 'game_credit', '4ac6a9b8-8f37-49eb-b123-be5c258cce92', 'Resultado do jogo Primeiro poker do ano 2026'),
('6bd13692-a538-4eb8-8a99-fc038c812608', -700, 'game_debit', '4ac6a9b8-8f37-49eb-b123-be5c258cce92', 'Resultado do jogo Primeiro poker do ano 2026'),
('c1d33ffb-65d9-4533-9da9-dc8fa9882ef6', 200, 'game_credit', '4ac6a9b8-8f37-49eb-b123-be5c258cce92', 'Resultado do jogo Primeiro poker do ano 2026'),
('ab856d74-4cc1-4f65-9644-8401f9e20ef4', 1304, 'game_credit', '4ac6a9b8-8f37-49eb-b123-be5c258cce92', 'Resultado do jogo Primeiro poker do ano 2026');

-- Game 2: Poker 27/01 (9ce9943c)
INSERT INTO ledger_entries (player_id, amount, entry_type, game_id, description) VALUES
('81a6d40a-cb9a-4138-8297-322d9df38ea3', 221, 'game_credit', '9ce9943c-d7b8-4b8d-8e5c-451336f462a9', 'Resultado do jogo Poker 27/01'),
('e62a32c9-9abc-4ab3-8814-05606a300e9f', 206, 'game_credit', '9ce9943c-d7b8-4b8d-8e5c-451336f462a9', 'Resultado do jogo Poker 27/01'),
('0d80fdb7-7fcd-446c-ac07-aa866e816f24', -100, 'game_debit', '9ce9943c-d7b8-4b8d-8e5c-451336f462a9', 'Resultado do jogo Poker 27/01'),
('2ff54877-d540-4c8b-ad1d-c499bd26bf0c', 180, 'game_credit', '9ce9943c-d7b8-4b8d-8e5c-451336f462a9', 'Resultado do jogo Poker 27/01'),
('6bd13692-a538-4eb8-8a99-fc038c812608', 232, 'game_credit', '9ce9943c-d7b8-4b8d-8e5c-451336f462a9', 'Resultado do jogo Poker 27/01'),
('c1d33ffb-65d9-4533-9da9-dc8fa9882ef6', 261, 'game_credit', '9ce9943c-d7b8-4b8d-8e5c-451336f462a9', 'Resultado do jogo Poker 27/01'),
('ab856d74-4cc1-4f65-9644-8401f9e20ef4', -1000, 'game_debit', '9ce9943c-d7b8-4b8d-8e5c-451336f462a9', 'Resultado do jogo Poker 27/01');

-- Game 3: Poker 03/02 (89295ef5)
INSERT INTO ledger_entries (player_id, amount, entry_type, game_id, description) VALUES
('81a6d40a-cb9a-4138-8297-322d9df38ea3', 96, 'game_credit', '89295ef5-e383-4381-9979-346c88e7f93f', 'Resultado do jogo Poker 03/02'),
('e62a32c9-9abc-4ab3-8814-05606a300e9f', -500, 'game_debit', '89295ef5-e383-4381-9979-346c88e7f93f', 'Resultado do jogo Poker 03/02'),
('0d80fdb7-7fcd-446c-ac07-aa866e816f24', -200, 'game_debit', '89295ef5-e383-4381-9979-346c88e7f93f', 'Resultado do jogo Poker 03/02'),
('2ff54877-d540-4c8b-ad1d-c499bd26bf0c', -246, 'game_debit', '89295ef5-e383-4381-9979-346c88e7f93f', 'Resultado do jogo Poker 03/02'),
('6bd13692-a538-4eb8-8a99-fc038c812608', -427, 'game_debit', '89295ef5-e383-4381-9979-346c88e7f93f', 'Resultado do jogo Poker 03/02'),
('c1d33ffb-65d9-4533-9da9-dc8fa9882ef6', 1377, 'game_credit', '89295ef5-e383-4381-9979-346c88e7f93f', 'Resultado do jogo Poker 03/02'),
('ab856d74-4cc1-4f65-9644-8401f9e20ef4', -100, 'game_debit', '89295ef5-e383-4381-9979-346c88e7f93f', 'Resultado do jogo Poker 03/02');

-- Game 4: App Voltou! (4798b956) - NOT PAID
INSERT INTO ledger_entries (player_id, amount, entry_type, game_id, description) VALUES
('81a6d40a-cb9a-4138-8297-322d9df38ea3', 700, 'game_credit', '4798b956-9436-4f80-a52d-4f603e81c244', 'Resultado do jogo App Voltou!'),
('e62a32c9-9abc-4ab3-8814-05606a300e9f', -700, 'game_debit', '4798b956-9436-4f80-a52d-4f603e81c244', 'Resultado do jogo App Voltou!'),
('6711c1cc-dfd3-4470-939b-eb08329d0aaf', 6, 'game_credit', '4798b956-9436-4f80-a52d-4f603e81c244', 'Resultado do jogo App Voltou!'),
('9b8032c9-f3e4-4ade-91f0-c8955ccc4345', -9, 'game_debit', '4798b956-9436-4f80-a52d-4f603e81c244', 'Resultado do jogo App Voltou!'),
('2ff54877-d540-4c8b-ad1d-c499bd26bf0c', 226, 'game_credit', '4798b956-9436-4f80-a52d-4f603e81c244', 'Resultado do jogo App Voltou!'),
('6bd13692-a538-4eb8-8a99-fc038c812608', -495, 'game_debit', '4798b956-9436-4f80-a52d-4f603e81c244', 'Resultado do jogo App Voltou!'),
('c1d33ffb-65d9-4533-9da9-dc8fa9882ef6', 422, 'game_credit', '4798b956-9436-4f80-a52d-4f603e81c244', 'Resultado do jogo App Voltou!'),
('ab856d74-4cc1-4f65-9644-8401f9e20ef4', -150, 'game_debit', '4798b956-9436-4f80-a52d-4f603e81c244', 'Resultado do jogo App Voltou!');

-- =============================================
-- 2. COMPENSATING SETTLEMENT ENTRIES FOR GAMES 1-3
-- These entries negate the game results, zeroing those balances
-- =============================================

-- Per-player net from games 1-3:
-- B9: 221+96 = 317
-- Bruno Mineiro: -400+206-500 = -694
-- Doug: -700-100-200 = -1000
-- Eduardo: -400 = -400
-- Flavio: -194 = -194
-- Humberto: 180-246 = -66
-- Rodolfo: 890 = 890
-- Rodrigo Alemão: -700+232-427 = -895
-- Vinicius: 200+261+1377 = 1838
-- Zina: 1304-1000-100 = 204

INSERT INTO ledger_entries (player_id, amount, entry_type, description) VALUES
('81a6d40a-cb9a-4138-8297-322d9df38ea3', -317, 'settlement', 'Acerto de contas - jogos anteriores ao App Voltou!'),
('e62a32c9-9abc-4ab3-8814-05606a300e9f', 694, 'settlement', 'Acerto de contas - jogos anteriores ao App Voltou!'),
('0d80fdb7-7fcd-446c-ac07-aa866e816f24', 1000, 'settlement', 'Acerto de contas - jogos anteriores ao App Voltou!'),
('6711c1cc-dfd3-4470-939b-eb08329d0aaf', 400, 'settlement', 'Acerto de contas - jogos anteriores ao App Voltou!'),
('9b8032c9-f3e4-4ade-91f0-c8955ccc4345', 194, 'settlement', 'Acerto de contas - jogos anteriores ao App Voltou!'),
('2ff54877-d540-4c8b-ad1d-c499bd26bf0c', 66, 'settlement', 'Acerto de contas - jogos anteriores ao App Voltou!'),
('aaa73df4-5d6e-4e79-a094-9fdb0dc77e54', -890, 'settlement', 'Acerto de contas - jogos anteriores ao App Voltou!'),
('6bd13692-a538-4eb8-8a99-fc038c812608', 895, 'settlement', 'Acerto de contas - jogos anteriores ao App Voltou!'),
('c1d33ffb-65d9-4533-9da9-dc8fa9882ef6', -1838, 'settlement', 'Acerto de contas - jogos anteriores ao App Voltou!'),
('ab856d74-4cc1-4f65-9644-8401f9e20ef4', -204, 'settlement', 'Acerto de contas - jogos anteriores ao App Voltou!');

-- =============================================
-- 3. REPLACE EXISTING ACTIVE SETTLEMENT AND CREATE NEW ONE
-- =============================================

-- Mark existing active settlement as replaced
UPDATE settlements SET status = 'replaced' WHERE id = '5d51ced7-3826-4d2d-8747-82b0fe62531e';

-- Create new settlement for App Voltou!
INSERT INTO settlements (id, status) VALUES ('a0000001-0000-0000-0000-000000000001', 'active');

-- Settlement items (minimized P2P transfers for App Voltou!):
-- Debtors: Bruno(-700), Rodrigo(-495), Zina(-150), Flavio(-9)
-- Creditors: B9(+700), Vinicius(+422), Humberto(+226), Eduardo(+6)
-- 1. Bruno → B9: 700
-- 2. Rodrigo → Vinicius: 422
-- 3. Rodrigo → Humberto: 73
-- 4. Zina → Humberto: 150
-- 5. Flavio → Humberto: 3
-- 6. Flavio → Eduardo: 6

INSERT INTO settlement_items (settlement_id, from_player_id, to_player_id, amount) VALUES
('a0000001-0000-0000-0000-000000000001', 'e62a32c9-9abc-4ab3-8814-05606a300e9f', '81a6d40a-cb9a-4138-8297-322d9df38ea3', 700),
('a0000001-0000-0000-0000-000000000001', '6bd13692-a538-4eb8-8a99-fc038c812608', 'c1d33ffb-65d9-4533-9da9-dc8fa9882ef6', 422),
('a0000001-0000-0000-0000-000000000001', '6bd13692-a538-4eb8-8a99-fc038c812608', '2ff54877-d540-4c8b-ad1d-c499bd26bf0c', 73),
('a0000001-0000-0000-0000-000000000001', 'ab856d74-4cc1-4f65-9644-8401f9e20ef4', '2ff54877-d540-4c8b-ad1d-c499bd26bf0c', 150),
('a0000001-0000-0000-0000-000000000001', '9b8032c9-f3e4-4ade-91f0-c8955ccc4345', '2ff54877-d540-4c8b-ad1d-c499bd26bf0c', 3),
('a0000001-0000-0000-0000-000000000001', '9b8032c9-f3e4-4ade-91f0-c8955ccc4345', '6711c1cc-dfd3-4470-939b-eb08329d0aaf', 6);
