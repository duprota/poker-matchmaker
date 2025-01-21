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
    // Fetch all game players with their related data
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

    console.log('Raw game players data:', gamePlayers);

    if (!gamePlayers || gamePlayers.length === 0) {
      console.log('No game players found');
      return [];
    }

    // Convert game players into transactions
    const transactions: Transaction[] = [];
    
    // Process each game player that needs to pay
    gamePlayers.forEach(payer => {
      // Include all transactions where final_result indicates a payment needed
      if (payer.final_result < 0) {
        // Find the corresponding receiver in the same game
        const receiver = gamePlayers.find(p => 
          p.game_id === payer.game_id && 
          p.final_result > 0
        );

        if (receiver) {
          const transaction = {
            from: payer.players.name,
            to: receiver.players.name,
            amount: Math.abs(payer.final_result), // Use final_result instead of payment_amount
            date: payer.games.date,
            paymentStatus: payer.payment_status || 'pending',
            toPixKey: receiver.players.pix_key || undefined,
            gamePlayerIds: [payer.id],
          };
          console.log('Created transaction:', transaction);
          transactions.push(transaction);
        }
      }
    });

    console.log('Final transactions:', transactions);
    return transactions;
  } catch (error) {
    console.error('Error in fetchHistoricalTransactions:', error);
    toast({
      title: "Error loading transactions",
      description: error instanceof Error ? error.message : "Failed to load transactions",
      variant: "destructive",
    });
    throw error;
  }
};

export const updatePaymentStatus = async (gamePlayerIds: string[], status: string) => {
  try {
    console.log(`Updating payment status to ${status} for:`, gamePlayerIds);
    const { error } = await supabase
      .from('game_players')
      .update({ 
        payment_status: status,
        payment_date: status === 'paid' ? new Date().toISOString() : null
      })
      .in('id', gamePlayerIds);

    if (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }

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