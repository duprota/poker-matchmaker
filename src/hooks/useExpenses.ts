import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ExpenseWithSplits {
  id: string;
  description: string;
  total_amount: number;
  paid_by_player_id: string;
  game_id: string | null;
  created_at: string;
  paid_by_player?: { id: string; name: string };
  game?: { id: string; name: string | null; date: string } | null;
  expense_splits: {
    id: string;
    player_id: string;
    amount: number;
    player?: { id: string; name: string };
  }[];
}

interface CreateExpenseInput {
  description: string;
  total_amount: number;
  paid_by_player_id: string;
  game_id?: string | null;
  splits: { player_id: string; amount: number }[];
}

/**
 * Fetches all expenses with their splits and related data.
 */
export const useExpenses = () => {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: async (): Promise<ExpenseWithSplits[]> => {
      const { data, error } = await supabase
        .from("expenses")
        .select(`
          *,
          paid_by_player:players!expenses_paid_by_player_id_fkey(id, name),
          game:games!expenses_game_id_fkey(id, name, date),
          expense_splits(id, player_id, amount, player:players!expense_splits_player_id_fkey(id, name))
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as any[]) ?? [];
    },
  });
};

/**
 * Creates an expense with splits and corresponding ledger entries.
 */
export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      // 1. Insert expense
      const { data: expense, error: expenseError } = await supabase
        .from("expenses")
        .insert({
          description: input.description,
          total_amount: input.total_amount,
          paid_by_player_id: input.paid_by_player_id,
          game_id: input.game_id ?? null,
        })
        .select()
        .single();

      if (expenseError) throw expenseError;

      // 2. Insert splits
      const splits = input.splits.map((s) => ({
        expense_id: expense.id,
        player_id: s.player_id,
        amount: s.amount,
      }));

      const { error: splitsError } = await supabase
        .from("expense_splits")
        .insert(splits);

      if (splitsError) throw splitsError;

      // 3. Create ledger entries
      // Credit for the payer (they paid, so they are owed)
      const ledgerEntries: {
        player_id: string;
        amount: number;
        entry_type: string;
        expense_id: string;
        description: string;
      }[] = [];

      // Credit: payer gets credited the total amount
      ledgerEntries.push({
        player_id: input.paid_by_player_id,
        amount: input.total_amount,
        entry_type: "expense",
        expense_id: expense.id,
        description: `Pagou despesa: ${input.description}`,
      });

      // Debit: each participant gets debited their share
      for (const split of input.splits) {
        ledgerEntries.push({
          player_id: split.player_id,
          amount: -split.amount,
          entry_type: "expense",
          expense_id: expense.id,
          description: `Parcela despesa: ${input.description}`,
        });
      }

      const { error: ledgerError } = await supabase
        .from("ledger_entries")
        .insert(ledgerEntries);

      if (ledgerError) throw ledgerError;

      return expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["player-balances"] });
      queryClient.invalidateQueries({ queryKey: ["ledger-entries"] });
      toast.success("Despesa registrada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar despesa:", error);
      toast.error("Erro ao registrar despesa.");
    },
  });
};

/**
 * Deletes an expense and its related ledger entries.
 * Splits are cascade-deleted by the DB.
 */
export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseId: string) => {
      // 1. Delete ledger entries linked to this expense
      const { error: ledgerError } = await supabase
        .from("ledger_entries")
        .delete()
        .eq("expense_id", expenseId);

      if (ledgerError) throw ledgerError;

      // 2. Delete expense (splits cascade)
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expenseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["player-balances"] });
      queryClient.invalidateQueries({ queryKey: ["ledger-entries"] });
      toast.success("Despesa excluída com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao excluir despesa:", error);
      toast.error("Erro ao excluir despesa.");
    },
  });
};
