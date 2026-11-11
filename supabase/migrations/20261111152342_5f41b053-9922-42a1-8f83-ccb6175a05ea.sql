CREATE TABLE public.game_reconciliation_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
 requested_by uuid NOT NULL, operation text NOT NULL, status text NOT NULL DEFAULT 'queued', stage text NOT NULL DEFAULT 'reset', cursor integer NOT NULL DEFAULT 0,
 error text, worker_token uuid, updated_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.game_reconciliation_jobs TO authenticated;
GRANT ALL ON public.game_reconciliation_jobs TO service_role;
ALTER TABLE public.game_reconciliation_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read reconciliation progress" ON public.game_reconciliation_jobs FOR SELECT TO authenticated USING (true);
CREATE UNIQUE INDEX one_active_game_reconciliation ON public.game_reconciliation_jobs ((true)) WHERE status IN ('queued','running','error');
CREATE FUNCTION public.touch_reconciliation_job() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
CREATE TRIGGER reconciliation_job_updated BEFORE UPDATE ON public.game_reconciliation_jobs FOR EACH ROW EXECUTE FUNCTION public.touch_reconciliation_job();
CREATE FUNCTION public.refresh_pending_settlements() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE sid uuid; d record; c record; amount_due numeric; debt numeric; credit numeric; balances jsonb;
BEGIN
 PERFORM pg_advisory_xact_lock(819401);
 UPDATE public.settlements SET status='replaced' WHERE status='active';
 INSERT INTO public.settlements(status,created_by) VALUES ('active',auth.uid()) RETURNING id INTO sid;
 SELECT jsonb_object_agg(player_id, balance) INTO balances FROM (SELECT player_id,round(sum(amount),2) balance FROM public.ledger_entries GROUP BY player_id) b;
 FOR d IN SELECT key::uuid player_id,value::numeric balance FROM jsonb_each_text(coalesce(balances,'{}')) WHERE value::numeric<0 ORDER BY value::numeric,key LOOP
  debt := -d.balance;
  FOR c IN SELECT key::uuid player_id,value::numeric balance FROM jsonb_each_text(coalesce(balances,'{}')) WHERE value::numeric>0 ORDER BY value::numeric DESC,key LOOP
   credit := (balances->>c.player_id::text)::numeric;
   amount_due := least(debt,credit);
   IF amount_due>0 THEN
    INSERT INTO public.settlement_items(settlement_id,from_player_id,to_player_id,amount) VALUES(sid,d.player_id,c.player_id,amount_due);
    debt:=debt-amount_due;
    balances:=jsonb_set(balances,ARRAY[c.player_id::text],to_jsonb(credit-amount_due));
   END IF;
   EXIT WHEN debt<=0;
  END LOOP;
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.refresh_pending_settlements() FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_pending_settlements() TO service_role;
CREATE FUNCTION public.edit_expense(p_expense_id uuid,p_description text,p_total numeric,p_payer uuid,p_game_id uuid,p_splits jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s record; delta record;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
 PERFORM pg_advisory_xact_lock(819401);
 PERFORM 1 FROM public.expenses WHERE id=p_expense_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Expense not found'; END IF;
 IF trim(coalesce(p_description,''))='' OR p_total IS NULL OR p_total<=0 OR p_total::text IN ('NaN','Infinity','-Infinity') OR p_total<>round(p_total,2) OR jsonb_typeof(p_splits) IS DISTINCT FROM 'array' OR jsonb_array_length(p_splits)=0 THEN RAISE EXCEPTION 'Invalid expense'; END IF;
 IF (SELECT count(*) FROM jsonb_to_recordset(p_splits) AS x(player_id uuid,amount numeric)) <> (SELECT count(DISTINCT player_id) FROM jsonb_to_recordset(p_splits) AS x(player_id uuid,amount numeric)) THEN RAISE EXCEPTION 'Duplicate participant'; END IF;
 FOR s IN SELECT * FROM jsonb_to_recordset(p_splits) AS x(player_id uuid,amount numeric) LOOP
  IF s.player_id IS NULL OR s.amount IS NULL OR s.amount<0 OR s.amount::text IN ('NaN','Infinity','-Infinity') OR s.amount<>round(s.amount,2) THEN RAISE EXCEPTION 'Invalid split'; END IF;
 END LOOP;
 IF (SELECT sum(amount) FROM jsonb_to_recordset(p_splits) AS x(player_id uuid,amount numeric))<>p_total THEN RAISE EXCEPTION 'Split total must equal expense total'; END IF;
 FOR delta IN
  WITH desired AS (SELECT p_payer player_id,p_total amount UNION ALL SELECT player_id,-amount FROM jsonb_to_recordset(p_splits) AS x(player_id uuid,amount numeric)),
  previous AS (SELECT player_id,sum(amount) amount FROM public.ledger_entries WHERE expense_id=p_expense_id AND settlement_item_id IS NULL GROUP BY player_id),
  changes AS (SELECT player_id,amount FROM desired UNION ALL SELECT player_id,-amount FROM previous)
  SELECT player_id,sum(amount) amount FROM changes GROUP BY player_id HAVING sum(amount)<>0
 LOOP
  INSERT INTO public.ledger_entries(player_id,amount,entry_type,expense_id,description) VALUES(delta.player_id,delta.amount,'expense',p_expense_id,'Correção de despesa: '||p_description);
 END LOOP;
 UPDATE public.expenses SET description=trim(p_description),total_amount=p_total,paid_by_player_id=p_payer,game_id=p_game_id WHERE id=p_expense_id;
 DELETE FROM public.expense_splits WHERE expense_id=p_expense_id;
 INSERT INTO public.expense_splits(expense_id,player_id,amount) SELECT p_expense_id,player_id,amount FROM jsonb_to_recordset(p_splits) AS x(player_id uuid,amount numeric);
 PERFORM public.refresh_pending_settlements();
 RETURN p_expense_id;
END $$;
REVOKE ALL ON FUNCTION public.edit_expense(uuid,text,numeric,uuid,uuid,jsonb) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.edit_expense(uuid,text,numeric,uuid,uuid,jsonb) TO authenticated;
CREATE FUNCTION public.change_game_completion(p_game_id uuid,p_operation text,p_results jsonb DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE g public.games; job_id uuid; r record;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
 PERFORM pg_advisory_xact_lock(819402);
 SELECT * INTO g FROM public.games WHERE id=p_game_id FOR UPDATE;
 IF g.id IS NULL THEN RAISE EXCEPTION 'Game not found'; END IF;
 IF g.manager_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Only the game manager can change completion'; END IF;
 IF EXISTS(SELECT 1 FROM public.game_reconciliation_jobs WHERE status IN ('queued','running','error')) THEN RAISE EXCEPTION 'A reconciliation must finish or be retried first'; END IF;
 IF p_operation='reopen' THEN
  IF g.status<>'completed' THEN RAISE EXCEPTION 'Game is not completed'; END IF;
  DELETE FROM public.ledger_entries WHERE game_id=p_game_id AND expense_id IS NULL AND settlement_item_id IS NULL AND entry_type IN ('game_credit','game_debit');
  DELETE FROM public.game_transactions WHERE game_id=p_game_id AND payment_status IS DISTINCT FROM 'paid';
  UPDATE public.games SET status='ongoing' WHERE id=p_game_id;
 ELSIF p_operation='finalize' THEN
  IF g.status<>'ongoing' OR jsonb_typeof(p_results) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid finalization'; END IF;
  IF (SELECT count(*) FROM public.game_players WHERE game_id=p_game_id)<>(SELECT count(*) FROM jsonb_to_recordset(p_results) AS x(id uuid,final_result numeric)) OR (SELECT count(DISTINCT id) FROM jsonb_to_recordset(p_results) AS x(id uuid,final_result numeric))<>(SELECT count(*) FROM public.game_players WHERE game_id=p_game_id) THEN RAISE EXCEPTION 'All players must have results'; END IF;
  FOR r IN SELECT * FROM jsonb_to_recordset(p_results) AS x(id uuid,final_result numeric) LOOP
   IF r.final_result IS NULL OR r.final_result<0 OR r.final_result::text IN ('NaN','Infinity','-Infinity') OR NOT EXISTS(SELECT 1 FROM public.game_players WHERE id=r.id AND game_id=p_game_id) THEN RAISE EXCEPTION 'Invalid final chips'; END IF;
   UPDATE public.game_players SET final_result=r.final_result WHERE id=r.id;
   INSERT INTO public.game_history(game_id,game_player_id,player_id,event_type,amount) SELECT p_game_id,id,player_id,'result_update',r.final_result FROM public.game_players WHERE id=r.id;
  END LOOP;
  IF (SELECT sum(final_result-initial_buyin*(1+total_rebuys)) FROM public.game_players WHERE game_id=p_game_id)<>0 THEN RAISE EXCEPTION 'Final chips do not match the pot'; END IF;
  UPDATE public.games SET status='completed' WHERE id=p_game_id;
 ELSE RAISE EXCEPTION 'Unknown operation'; END IF;
 PERFORM public.refresh_pending_settlements();
 INSERT INTO public.game_reconciliation_jobs(game_id,requested_by,operation) VALUES(p_game_id,auth.uid(),p_operation) RETURNING id INTO job_id;
 RETURN job_id;
END $$;
REVOKE ALL ON FUNCTION public.change_game_completion(uuid,text,jsonb) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.change_game_completion(uuid,text,jsonb) TO authenticated;
CREATE FUNCTION public.claim_reconciliation(p_job_id uuid,p_token uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 UPDATE public.game_reconciliation_jobs SET status='running',worker_token=p_token WHERE id=p_job_id AND (status='queued' OR (status='running' AND updated_at<now()-interval '5 minutes'));
 RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION public.claim_reconciliation(uuid,uuid) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_reconciliation(uuid,uuid) TO service_role;
CREATE FUNCTION public.retry_reconciliation(p_job_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
 UPDATE public.game_reconciliation_jobs SET status='queued',stage='reset',cursor=0,error=NULL,worker_token=NULL WHERE id=p_job_id AND requested_by=auth.uid() AND (status='error' OR (status='running' AND updated_at<now()-interval '5 minutes') OR status='queued');
 IF NOT FOUND THEN RAISE EXCEPTION 'Cannot retry reconciliation'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.retry_reconciliation(uuid) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.retry_reconciliation(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.create_game_transactions() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE d record;c record; remaining jsonb;debt numeric;credit numeric;paid numeric;transfer numeric;
BEGIN
 IF NEW.status='completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
  DELETE FROM public.game_transactions WHERE game_id=NEW.id AND payment_status IS DISTINCT FROM 'paid';
  SELECT jsonb_object_agg(player_id,balance) INTO remaining FROM (SELECT gp.player_id,gp.final_result-gp.initial_buyin*(1+gp.total_rebuys)+coalesce((SELECT sum(t.amount) FROM public.game_transactions t WHERE t.game_id=NEW.id AND t.from_player_id=gp.player_id AND t.payment_status='paid'),0)-coalesce((SELECT sum(t.amount) FROM public.game_transactions t WHERE t.game_id=NEW.id AND t.to_player_id=gp.player_id AND t.payment_status='paid'),0) balance FROM public.game_players gp WHERE gp.game_id=NEW.id) b;
  FOR d IN SELECT key::uuid pid,value::numeric balance FROM jsonb_each_text(coalesce(remaining,'{}')) WHERE value::numeric<0 ORDER BY value::numeric,key LOOP
   debt:=-d.balance;
   FOR c IN SELECT key::uuid pid,value::numeric balance FROM jsonb_each_text(coalesce(remaining,'{}')) WHERE value::numeric>0 ORDER BY value::numeric DESC,key LOOP
    credit:=(remaining->>c.pid::text)::numeric; transfer:=least(debt,credit);
    IF transfer>0 THEN INSERT INTO public.game_transactions(game_id,from_player_id,to_player_id,amount,payment_status) VALUES(NEW.id,d.pid,c.pid,transfer,'pending'); debt:=debt-transfer; remaining:=jsonb_set(remaining,ARRAY[c.pid::text],to_jsonb(credit-transfer)); END IF;
    EXIT WHEN debt<=0;
   END LOOP;
  END LOOP;
 END IF;
 RETURN NEW;
END $$;