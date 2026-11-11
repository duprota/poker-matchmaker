CREATE FUNCTION public.commit_game_reconciliation(p_job_id uuid,p_token uuid,p_data jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(819402);
 PERFORM 1 FROM public.game_reconciliation_jobs WHERE id=p_job_id AND status='running' AND worker_token=p_token FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Worker no longer owns this job'; END IF;
 UPDATE public.players p SET mu=x.mu,sigma=x.sigma,skill_score=x.skill_score,rating_games=x.rating_games,rebuy_tendency=x.rebuy_tendency,recovery_rate=x.recovery_rate,archetype=x.archetype
 FROM jsonb_to_recordset(p_data->'players') AS x(id uuid,mu numeric,sigma numeric,skill_score numeric,rating_games integer,rebuy_tendency numeric,recovery_rate numeric,archetype text) WHERE p.id=x.id;
 DELETE FROM public.player_rating_history WHERE id IS NOT NULL;
 INSERT INTO public.player_rating_history(player_id,game_id,mu_before,sigma_before,mu_after,sigma_after,skill_score_after,created_at)
 SELECT player_id,game_id,mu_before,sigma_before,mu_after,sigma_after,skill_score_after,created_at FROM jsonb_to_recordset(p_data->'player_rating_history') AS x(player_id uuid,game_id uuid,mu_before numeric,sigma_before numeric,mu_after numeric,sigma_after numeric,skill_score_after numeric,created_at timestamptz);
 DELETE FROM public.atp_points WHERE id IS NOT NULL;
 INSERT INTO public.atp_points(player_id,game_id,raw_points,base_points,sos_multiplier,roi_factor,position,roi,tier,created_at)
 SELECT player_id,game_id,raw_points,base_points,sos_multiplier,roi_factor,position,roi,tier,created_at FROM jsonb_to_recordset(p_data->'atp_points') AS x(player_id uuid,game_id uuid,raw_points numeric,base_points numeric,sos_multiplier numeric,roi_factor numeric,position integer,roi numeric,tier text,created_at timestamptz);
 DELETE FROM public.player_live_params WHERE player_id IS NOT NULL;
 INSERT INTO public.player_live_params(player_id,rb_bucket,delta,sample_size,updated_at)
 SELECT player_id,rb_bucket,delta,sample_size,updated_at FROM jsonb_to_recordset(p_data->'player_live_params') AS x(player_id uuid,rb_bucket text,delta numeric,sample_size integer,updated_at timestamptz);
 DELETE FROM public.player_badges b WHERE NOT EXISTS(SELECT 1 FROM jsonb_to_recordset(p_data->'player_badges') AS x(player_id uuid,badge_code text,game_id uuid,conquered_at timestamptz) WHERE b.player_id=x.player_id AND b.badge_code=x.badge_code AND b.game_id IS NOT DISTINCT FROM x.game_id AND (b.game_id IS NOT NULL OR EXISTS(SELECT 1 FROM public.games g WHERE g.status='completed' AND g.date=x.conquered_at)));
 UPDATE public.player_badges b SET is_active=x.is_active,lost_at=x.lost_at,metadata=x.metadata FROM jsonb_to_recordset(p_data->'player_badges') AS x(player_id uuid,badge_code text,game_id uuid,is_active boolean,lost_at timestamptz,metadata jsonb) WHERE b.player_id=x.player_id AND b.badge_code=x.badge_code AND b.game_id IS NOT DISTINCT FROM x.game_id;
 INSERT INTO public.player_badges(player_id,badge_code,game_id,is_active,conquered_at,lost_at,metadata)
 SELECT player_id,badge_code,game_id,is_active,conquered_at,lost_at,metadata FROM jsonb_to_recordset(p_data->'player_badges') AS x(player_id uuid,badge_code text,game_id uuid,is_active boolean,conquered_at timestamptz,lost_at timestamptz,metadata jsonb) WHERE NOT EXISTS(SELECT 1 FROM public.player_badges b WHERE b.player_id=x.player_id AND b.badge_code=x.badge_code AND b.game_id IS NOT DISTINCT FROM x.game_id);
 UPDATE public.game_reconciliation_jobs SET status='completed',stage='completed',error=NULL,worker_token=NULL WHERE id=p_job_id;
END $$;
REVOKE ALL ON FUNCTION public.commit_game_reconciliation(uuid,uuid,jsonb) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commit_game_reconciliation(uuid,uuid,jsonb) TO service_role;
CREATE FUNCTION public.guard_reconciliation_changes() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM public.game_reconciliation_jobs WHERE status IN ('queued','running','error')) THEN
  IF TG_TABLE_NAME='games' THEN
   IF OLD.status IS DISTINCT FROM NEW.status THEN RAISE EXCEPTION 'Rankings are being reconciled'; END IF;
  ELSIF EXISTS(SELECT 1 FROM public.games WHERE id=coalesce(NEW.game_id,OLD.game_id) AND status='completed') THEN RAISE EXCEPTION 'Rankings are being reconciled';
  END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER guard_games_reconciliation BEFORE UPDATE ON public.games FOR EACH ROW EXECUTE FUNCTION public.guard_reconciliation_changes();
CREATE TRIGGER guard_results_reconciliation BEFORE INSERT OR UPDATE OR DELETE ON public.game_players FOR EACH ROW EXECUTE FUNCTION public.guard_reconciliation_changes();