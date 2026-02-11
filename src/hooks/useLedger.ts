import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PlayerBalance } from "@/types/ledger";

/**
 * Fetches aggregated player balances from ledger_entries.
 * Balance = SUM(amount) per player.
 */
export const usePlayerBalances = () => {
  return useQuery({
    queryKey: ["player-balances"],
    queryFn: async (): Promise<PlayerBalance[]> => {
      // Get all ledger entries joined with player names
      const { data, error } = await supabase
        .from("ledger_entries" as any)
        .select("player_id, amount, players!inner(id, name)")
        .order("player_id");

      if (error) throw error;

      // Aggregate balances per player
      const balanceMap = new Map<string, { name: string; balance: number }>();

      (data as any[])?.forEach((entry: any) => {
        const pid = entry.player_id as string;
        const current = balanceMap.get(pid) || {
          name: (entry.players as any)?.name || "Unknown",
          balance: 0,
        };
        current.balance += Number(entry.amount);
        balanceMap.set(pid, current);
      });

      return Array.from(balanceMap.entries()).map(([playerId, info]) => ({
        playerId,
        playerName: info.name,
        balance: Number(info.balance.toFixed(2)),
      }));
    },
  });
};

/**
 * Fetches all ledger entries for display.
 */
export const useLedgerEntries = () => {
  return useQuery({
    queryKey: ["ledger-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ledger_entries" as any)
        .select("*, players!inner(id, name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });
};
