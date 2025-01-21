import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface GamePlayer {
  id: string;
  payment_status: string;
  payment_amount: number;
  game_id: string;
  player_id: string;
  final_result: number;
  games: {
    date: string;
  };
  players: {
    id: string;
    name: string;
    pix_key: string | null;
  };
}

interface Transaction {
  from: string;
  to: string;
  amount: number;
  date: string;
  paymentStatus: string;
  toPixKey?: string;
  gamePlayerIds: string[];
}

export const fetchHistoricalTransactions = async (): Promise<Transaction[]> => {
  console.log('Starting to fetch historical transactions...');
  
  try {
    // Fetch game players with negative final results (they need to pay)
    const { data: gamePlayers, error } = await supabase
      .from('game_players')
      .select(`
        id,
        payment_status,
        payment_amount,
        game_id,
        player_id,
        final_result,
        games (
          date
        ),
        players (
          id,
          name,
          pix_key
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching game players:', error);
      throw error;
    }

    console.log('Fetched game players:', gamePlayers);

    if (!gamePlayers || gamePlayers.length === 0) {
      console.log('No game players found');
      return [];
    }

    // Convert game players with payment amounts into transactions
    const transactions: Transaction[] = [];
    
    gamePlayers.forEach(debtor => {
      // Only process players who need to pay (negative final result)
      if (debtor.final_result < 0 && debtor.payment_amount > 0) {
        // Find the creditor (player with positive final result) in the same game
        const creditor = gamePlayers.find(p => 
          p.game_id === debtor.game_id && 
          p.final_result > 0 &&
          p.payment_amount === Math.abs(debtor.payment_amount)
        );

        if (creditor) {
          transactions.push({
            from: debtor.players.name,
            to: creditor.players.name,
            amount: debtor.payment_amount,
            date: debtor.games.date,
            paymentStatus: debtor.payment_status || 'pending',
            toPixKey: creditor.players.pix_key || undefined,
            gamePlayerIds: [debtor.id],
          });
        }
      }
    });

    console.log('Final transactions:', transactions);
    return transactions;
  } catch (error) {
    console.error('Error in fetchHistoricalTransactions:', error);
    throw error;
  }
};

export const updatePaymentStatus = async (gamePlayerIds: string[], status: string) => {
  try {
    console.log(`Marking transactions as ${status}:`, gamePlayerIds);
    const { error } = await supabase
      .from('game_players')
      .update({ 
        payment_status: status,
        payment_date: status === 'paid' ? new Date().toISOString() : null
      })
      .in('id', gamePlayerIds);

    if (error) throw error;

    console.log('Successfully updated payment status');
    toast({
      title: "Success",
      description: `The payment has been marked as ${status} successfully.`,
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    toast({
      title: "Error",
      description: "Failed to update payment status. Please try again.",
      variant: "destructive",
    });
    throw error;
  }
};