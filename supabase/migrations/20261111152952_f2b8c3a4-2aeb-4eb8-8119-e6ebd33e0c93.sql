REVOKE EXECUTE ON FUNCTION public.change_game_completion(uuid,text,jsonb), public.edit_expense(uuid,text,numeric,uuid,uuid,jsonb), public.retry_reconciliation(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.change_game_completion(uuid,text,jsonb), public.edit_expense(uuid,text,numeric,uuid,uuid,jsonb), public.retry_reconciliation(uuid) TO service_role;
CREATE FUNCTION public.perform_game_correction(p_user_id uuid,p_action text,p_payload jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result_id uuid;
BEGIN
 PERFORM set_config('request.jwt.claim.sub',p_user_id::text,true);
 IF p_action='edit-expense' THEN
  result_id:=public.edit_expense((p_payload->>'expense_id')::uuid,p_payload->>'description',(p_payload->>'total_amount')::numeric,(p_payload->>'paid_by_player_id')::uuid,(p_payload->>'game_id')::uuid,p_payload->'splits');
 ELSIF p_action='retry' THEN
  PERFORM public.retry_reconciliation((p_payload->>'job_id')::uuid); result_id:=(p_payload->>'job_id')::uuid;
 ELSE
  result_id:=public.change_game_completion((p_payload->>'game_id')::uuid,p_action,p_payload->'results');
 END IF;
 RETURN jsonb_build_object('id',result_id);
END $$;
REVOKE ALL ON FUNCTION public.perform_game_correction(uuid,text,jsonb) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.perform_game_correction(uuid,text,jsonb) TO service_role;