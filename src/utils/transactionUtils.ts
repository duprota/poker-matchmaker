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

    // Group players by game to calculate transactions
    const gameGroups = gamePlayers.reduce((acc, gp) => {
      if (!acc[gp.game_id]) {
        acc[gp.game_id] = [];
      }
      acc[gp.game_id].push(gp);
      return acc;
    }, {} as Record<string, GamePlayer[]>);

    console.log('Grouped games:', Object.keys(gameGroups).length);

    // Calculate transactions for each game
    const transactions: Transaction[] = [];
    
    Object.values(gameGroups).forEach((players) => {
      console.log(`Processing game with ${players.length} players`);
      
      // Find players who need to pay (negative final_result)
      const debtors = players.filter(p => p.final_result < 0);
      // Find players who should receive money (positive final_result)
      const creditors = players.filter(p => p.final_result > 0);

      console.log(`Found ${debtors.length} debtors and ${creditors.length} creditors`);
      console.log('Debtors:', debtors.map(d => ({ name: d.players.name, amount: d.final_result })));
      console.log('Creditors:', creditors.map(c => ({ name: c.players.name, amount: c.final_result })));

      debtors.forEach(debtor => {
        const debtAmount = Math.abs(debtor.final_result);
        let remainingDebt = debtAmount;

        console.log(`Processing debtor ${debtor.players.name} with debt ${debtAmount}`);

        creditors.forEach(creditor => {
          if (remainingDebt <= 0) return;

          const creditAmount = creditor.final_result;
          const transactionAmount = Math.min(remainingDebt, creditAmount);

          if (transactionAmount > 0) {
            console.log(`Creating transaction: ${debtor.players.name} -> ${creditor.players.name}: $${transactionAmount}`);
            
            transactions.push({
              from: debtor.players.name,
              to: creditor.players.name,
              amount: transactionAmount,
              date: debtor.games.date,
              paymentStatus: debtor.payment_status || 'pending',
              toPixKey: creditor.players.pix_key || undefined,
              gamePlayerIds: [debtor.id],
            });
          }

          remainingDebt -= transactionAmount;
        });
      });
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