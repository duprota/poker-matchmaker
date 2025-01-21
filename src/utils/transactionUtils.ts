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
    // Fetch all game players that have payment amounts set
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
      .not('payment_amount', 'eq', 0)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching game players:', error);
      throw error;
    }

    console.log('Fetched game players:', gamePlayers);

    if (!gamePlayers || gamePlayers.length === 0) {
      console.log('No game players found with payment amounts');
      return [];
    }

    // Convert game players with payment amounts into transactions
    const transactions: Transaction[] = [];
    
    // Process each game player that needs to pay
    gamePlayers.forEach(payer => {
      if (payer.payment_amount > 0) {
        // Find the corresponding receiver in the same game
        const receiver = gamePlayers.find(p => 
          p.game_id === payer.game_id && 
          p.final_result > 0 &&
          p.id !== payer.id
        );

        if (receiver) {
          transactions.push({
            from: payer.players.name,
            to: receiver.players.name,
            amount: payer.payment_amount,
            date: payer.games.date,
            paymentStatus: payer.payment_status || 'pending',
            toPixKey: receiver.players.pix_key || undefined,
            gamePlayerIds: [payer.id],
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