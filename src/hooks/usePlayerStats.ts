import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlayerGameEntry {
  game_id: string;
  game_name: string | null;
  game_date: string;
  initial_buyin: number;
  total_rebuys: number;
  final_result: number;
  net: number;
}

export interface PlayerStats {
  gamesPlayed: number;
  netEarnings: number;
  roi: number;
  winRate: number;
  bestGame: number;
  worstGame: number;
  avgNet: number;
  totalSpecialHands: number;
  progressData: { date: string; runningTotal: number }[];
  gameHistory: PlayerGameEntry[];
}

export const usePlayerStats = (playerId: string | undefined) => {
  return useQuery({
    queryKey: ["player-stats", playerId],
    enabled: !!playerId,
    queryFn: async (): Promise<PlayerStats> => {
      const { data, error } = await supabase
        .from("game_players")
        .select("*, games!inner(id, date, status, name)")
        .eq("player_id", playerId!)
        .eq("games.status", "completed")
        .not("final_result", "is", null)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const entries: PlayerGameEntry[] = (data || []).map((gp: any) => {
        const invested = gp.initial_buyin + gp.total_rebuys * gp.initial_buyin;
        return {
          game_id: gp.games.id,
          game_name: gp.games.name,
          game_date: gp.games.date,
          initial_buyin: gp.initial_buyin,
          total_rebuys: gp.total_rebuys,
          final_result: gp.final_result,
          net: gp.final_result - invested,
        };
      });

      // Sort by date
      entries.sort((a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime());

      const gamesPlayed = entries.length;
      const netEarnings = entries.reduce((s, e) => s + e.net, 0);
      const totalInvested = entries.reduce(
        (s, e) => s + e.initial_buyin + e.total_rebuys * e.initial_buyin,
        0
      );
      const roi = totalInvested > 0 ? (netEarnings / totalInvested) * 100 : 0;
      const wins = entries.filter((e) => e.net > 0).length;
      const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;
      const nets = entries.map((e) => e.net);
      const bestGame = nets.length > 0 ? Math.max(...nets) : 0;
      const worstGame = nets.length > 0 ? Math.min(...nets) : 0;
      const avgNet = gamesPlayed > 0 ? netEarnings / gamesPlayed : 0;

      // Special hands count
      const totalSpecialHands = (data || []).reduce((sum: number, gp: any) => {
        if (gp.special_hands && typeof gp.special_hands === "object") {
          return sum + Object.values(gp.special_hands as Record<string, number>).reduce((a: number, b: number) => a + b, 0);
        }
        return sum + (gp.special_hands_count || 0);
      }, 0);

      // Progress data (running total)
      let runningTotal = 0;
      const progressData = entries.map((e) => {
        runningTotal += e.net;
        return {
          date: new Date(e.game_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
          runningTotal,
        };
      });

      return {
        gamesPlayed,
        netEarnings,
        roi,
        winRate,
        bestGame,
        worstGame,
        avgNet,
        totalSpecialHands,
        progressData,
        gameHistory: entries,
      };
    },
  });
};
