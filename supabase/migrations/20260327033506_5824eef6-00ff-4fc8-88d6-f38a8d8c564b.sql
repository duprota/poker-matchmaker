ALTER TABLE public.live_game_scores DROP CONSTRAINT live_game_scores_game_id_fkey;
ALTER TABLE public.live_game_scores ADD CONSTRAINT live_game_scores_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;

ALTER TABLE public.live_game_scores DROP CONSTRAINT live_game_scores_player_id_fkey;
ALTER TABLE public.live_game_scores ADD CONSTRAINT live_game_scores_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE CASCADE;