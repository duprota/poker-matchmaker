import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateMinimizedSettlements } from "@/utils/settlementCalculator";
import type { PlayerBalance, SettlementItem } from "@/types/ledger";
import { toast } from "sonner";

/**
 * Fetches the current active settlement with its items.
 */
export const useActiveSettlement = () => {
  return useQuery({
    queryKey: ["active-settlement"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settlements" as any)
        .select("*, settlement_items(*, from_player:players!settlement_items_from_player_id_fkey(id, name), to_player:players!settlement_items_to_player_id_fkey(id, name))")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as any;
    },
  });
};

/**
 * Creates a new settlement based on current player balances.
 * Marks the previous active settlement as 'replaced'.
 */
export const useCreateSettlement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (balances: PlayerBalance[]) => {
      // 1. Calculate minimized transactions
      const transactions = calculateMinimizedSettlements(balances);

      // 2. Mark current active settlements as replaced
      await supabase
        .from("settlements" as any)
        .update({ status: "replaced" } as any)
        .eq("status", "active");

      // 3. Create new settlement
      const { data: settlement, error: settError } = await supabase
        .from("settlements" as any)
        .insert({ status: "active" } as any)
        .select()
        .single();

      if (settError) throw settError;

      // 4. Insert settlement items (if any)
      if (transactions.length > 0) {
        const items = transactions.map((t) => ({
          settlement_id: (settlement as any).id,
          from_player_id: t.fromPlayerId,
          to_player_id: t.toPlayerId,
          amount: t.amount,
        }));

        const { error: itemsError } = await supabase
          .from("settlement_items" as any)
          .insert(items as any);

        if (itemsError) throw itemsError;
      }

      return settlement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-settlement"] });
      queryClient.invalidateQueries({ queryKey: ["player-balances"] });
      toast.success("Ajuste de pagamentos gerado com sucesso!");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
};

/**
 * Marks a settlement item as paid and creates compensatory ledger entries.
 * - Credit (+) for the payer (reduces their debt)
 * - Debit (-) for the receiver (acknowledges payment received)
 */
export const useMarkSettlementPaid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: {
      id: string;
      fromPlayerId: string;
      toPlayerId: string;
      amount: number;
      fromPlayerName: string;
      toPlayerName: string;
    }) => {
      // 1. Mark item as paid
      const { error: updateError } = await supabase
        .from("settlement_items" as any)
        .update({ paid_at: new Date().toISOString() } as any)
        .eq("id", item.id);

      if (updateError) throw updateError;

      // 2. Create compensatory ledger entries
      const entries = [
        {
          player_id: item.fromPlayerId,
          amount: item.amount, // positive = reduces debt
          entry_type: "settlement",
          settlement_item_id: item.id,
          description: `Pagamento para ${item.toPlayerName}`,
        },
        {
          player_id: item.toPlayerId,
          amount: -item.amount, // negative = reduces credit
          entry_type: "settlement",
          settlement_item_id: item.id,
          description: `Recebimento de ${item.fromPlayerName}`,
        },
      ];

      const { error: ledgerError } = await supabase
        .from("ledger_entries" as any)
        .insert(entries as any);

      if (ledgerError) throw ledgerError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-settlement"] });
      queryClient.invalidateQueries({ queryKey: ["player-balances"] });
      queryClient.invalidateQueries({ queryKey: ["ledger-entries"] });
      toast.success("Pagamento registrado no ledger!");
    },
    onError: () => {
      toast.error("Erro ao registrar pagamento.");
    },
  });
};

/**
 * Unmarks a settlement item as paid and removes the compensatory ledger entries.
 */
export const useUnmarkSettlementPaid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      // 1. Remove compensatory ledger entries
      await supabase
        .from("ledger_entries" as any)
        .delete()
        .eq("settlement_item_id", itemId);

      // 2. Unmark item
      const { error } = await supabase
        .from("settlement_items" as any)
        .update({ paid_at: null } as any)
        .eq("id", itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-settlement"] });
      queryClient.invalidateQueries({ queryKey: ["player-balances"] });
      queryClient.invalidateQueries({ queryKey: ["ledger-entries"] });
      toast.success("Pagamento desmarcado.");
    },
    onError: () => {
      toast.error("Erro ao desmarcar pagamento.");
    },
  });
};
