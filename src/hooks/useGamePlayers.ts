import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GamePlayerInfo {
  playerId: string;
  playerName: string;
}

/**
 * Fetches the players participating in a specific game.
 * If no gameId is provided, returns an empty array.
 */
export const useGamePlayers = (gameId: string | null | undefined) => {
  return useQuery({
    queryKey: ["game-players", gameId],
    enabled: !!gameId,
    queryFn: async (): Promise<GamePlayerInfo[]> => {
      const { data, error } = await supabase
        .from("game_players")
        .select("player_id, players!inner(id, name)")
        .eq("game_id", gameId!);

      if (error) throw error;

      return (data as any[]).map((gp) => ({
        playerId: gp.player_id as string,
        playerName: (gp.players as any)?.name ?? "Unknown",
      }));
    },
  });
};
