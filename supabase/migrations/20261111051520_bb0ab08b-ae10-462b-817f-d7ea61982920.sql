ALTER TYPE public.game_event_type ADD VALUE IF NOT EXISTS 'buyin_update';

CREATE OR REPLACE FUNCTION public.record_buyin_correction()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  game_status text;
  balance_delta numeric;
BEGIN
  IF NEW.initial_buyin IS NOT DISTINCT FROM OLD.initial_buyin THEN RETURN NEW; END IF;
  IF NEW.initial_buyin IS NULL OR NEW.initial_buyin <= 0 OR NEW.initial_buyin::text IN ('NaN','Infinity','-Infinity') THEN
    RAISE EXCEPTION 'Buy-in must be a finite positive amount';
  END IF;
  SELECT status INTO game_status FROM public.games WHERE id = NEW.game_id FOR UPDATE;
  INSERT INTO public.game_history (game_id, game_player_id, player_id, event_type, amount)
  VALUES (NEW.game_id, NEW.id, NEW.player_id, 'buyin_update', NEW.initial_buyin - OLD.initial_buyin);
  IF game_status = 'completed' THEN
    balance_delta := (OLD.initial_buyin - NEW.initial_buyin) * (1 + NEW.total_rebuys);
    IF NEW.final_result IS NOT NULL AND balance_delta <> 0 THEN
      INSERT INTO public.ledger_entries (player_id, game_id, amount, entry_type, description)
      VALUES (NEW.player_id, NEW.game_id, balance_delta,
        CASE WHEN balance_delta >= 0 THEN 'game_credit' ELSE 'game_debit' END,
        format('Correção de buy-in: %s → %s (%s rebuys)', OLD.initial_buyin, NEW.initial_buyin, NEW.total_rebuys));
    END IF;
    UPDATE public.atp_points SET roi = ((NEW.final_result - NEW.initial_buyin * (1 + NEW.total_rebuys)) / NULLIF(NEW.initial_buyin, 0)) * 100
    WHERE game_id = NEW.game_id AND player_id = NEW.player_id AND NEW.final_result IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.record_buyin_correction() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_record_buyin_correction AFTER UPDATE OF initial_buyin ON public.game_players
FOR EACH ROW EXECUTE FUNCTION public.record_buyin_correction();