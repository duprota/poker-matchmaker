import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface TransactionSummary {
  from: string;
  fromId: string;
  to: string;
  toId: string;
  amount: number;
}

const fetchHistoricalTransactions = async () => {
  console.log("Fetching historical transactions...");
  
  const { data: gamePlayersData, error } = await supabase
    .from('game_players')
    .select(`
      id,
      player:players(id, name),
      game:games(status),
      final_result,
      payment_status,
      initial_buyin,
      total_rebuys
    `)
    .eq('games.status', 'completed');

  if (error) {
    console.error("Error fetching game players data:", error);
    throw error;
  }

  console.log("Raw game players data:", gamePlayersData);

  // Group transactions by game
  const gameTransactions = new Map();

  // Process each game result
  gamePlayersData.forEach((entry) => {
    const gameId = entry.game.id;
    if (!gameTransactions.has(gameId)) {
      gameTransactions.set(gameId, []);
    }

    const totalBuyIn = entry.initial_buyin + (entry.total_rebuys * entry.initial_buyin);
    const finalResult = entry.final_result || 0;
    const balance = finalResult - totalBuyIn;

    if (balance !== 0) {
      gameTransactions.get(gameId).push({
        playerId: entry.player.id,
        playerName: entry.player.name,
        balance: balance,
        gamePlayerId: entry.id,
        paymentStatus: entry.payment_status
      });
    }
  });

  // Process transactions for each game and consolidate
  const consolidatedDebts = new Map();

  gameTransactions.forEach((players) => {
    // Calculate transactions for this game
    players.forEach((payer) => {
      if (payer.balance < 0) {
        players.forEach((receiver) => {
          if (receiver.balance > 0) {
            const proportion = Math.abs(receiver.balance) / 
              players.filter(p => p.balance > 0)
                .reduce((sum, p) => sum + p.balance, 0);
            
            const amount = Math.abs(payer.balance) * proportion;

            // Create a unique key for this pair of players
            const key = [payer.playerId, receiver.playerId].sort().join('-');
            const currentDebt = consolidatedDebts.get(key) || {
              from: '',
              fromId: '',
              to: '',
              toId: '',
              amount: 0,
              gamePlayerIds: [] as string[],
              paymentStatus: 'pending'
            };

            if (currentDebt.amount === 0) {
              currentDebt.from = payer.playerName;
              currentDebt.fromId = payer.playerId;
              currentDebt.to = receiver.playerName;
              currentDebt.toId = receiver.playerId;
            }

            currentDebt.amount += amount;
            currentDebt.gamePlayerIds.push(payer.gamePlayerId);
            currentDebt.paymentStatus = payer.paymentStatus;
            consolidatedDebts.set(key, currentDebt);
          }
        });
      }
    });
  });

  // Convert consolidated debts to array and handle offsetting debts
  const finalTransactions: TransactionSummary[] = [];
  const processedPairs = new Set();

  consolidatedDebts.forEach((debt, key) => {
    const [player1, player2] = key.split('-');
    const reversePair = [player2, player1].join('-');

    if (!processedPairs.has(key) && !processedPairs.has(reversePair)) {
      const reverseDebt = consolidatedDebts.get(reversePair);
      
      if (reverseDebt) {
        // Both players owe each other, calculate net amount
        const netAmount = Math.abs(debt.amount - reverseDebt.amount);
        if (netAmount > 0.01) { // Only include non-zero transactions
          if (debt.amount > reverseDebt.amount) {
            finalTransactions.push({
              ...debt,
              amount: netAmount,
            });
          } else {
            finalTransactions.push({
              ...reverseDebt,
              amount: netAmount,
            });
          }
        }
      } else {
        // Only one player owes money
        if (debt.amount > 0.01) { // Only include non-zero transactions
          finalTransactions.push(debt);
        }
      }
      
      processedPairs.add(key);
      processedPairs.add(reversePair);
    }
  });

  console.log("Final consolidated transactions:", finalTransactions);
  return finalTransactions;
};

const Financials = () => {
  const queryClient = useQueryClient();
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['historical-transactions'],
    queryFn: fetchHistoricalTransactions,
  });

  const handleMarkAsPaid = async (gamePlayerIds: string[]) => {
    try {
      const { error } = await supabase
        .from('game_players')
        .update({ payment_status: 'paid' })
        .in('id', gamePlayerIds);

      if (error) throw error;

      toast({
        title: "Payment marked as paid",
        description: "The payment has been marked as paid successfully.",
      });

      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ['historical-transactions'] });
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      toast({
        title: "Error",
        description: "Failed to mark payment as paid. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold text-white mb-6">Historical Transactions</h1>
          <Card className="p-4">
            <div className="text-center py-8">Loading transaction history...</div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold text-white mb-6">Historical Transactions</h1>
          <Card className="p-4">
            <div className="text-center py-8 text-red-500">
              Error loading transaction history. Please try again later.
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-white mb-6">Historical Transactions</h1>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Consolidated Debts</h2>
          {transactions && transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction, index) => (
                  <TableRow key={index}>
                    <TableCell>{transaction.from}</TableCell>
                    <TableCell>{transaction.to}</TableCell>
                    <TableCell className="text-right">${transaction.amount.toFixed(2)}</TableCell>
                    <TableCell>{transaction.paymentStatus}</TableCell>
                    <TableCell>
                      {transaction.paymentStatus === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsPaid(transaction.gamePlayerIds)}
                        >
                          Mark as Paid
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No consolidated debts to display.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Financials;