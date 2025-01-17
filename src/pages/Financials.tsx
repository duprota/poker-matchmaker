import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
      payment_status
    `)
    .eq('games.status', 'completed');

  if (error) {
    console.error("Error fetching game players data:", error);
    throw error;
  }

  console.log("Raw game players data:", gamePlayersData);

  // Create a map to store debts between players
  const debtsMap = new Map<string, Map<string, number>>();

  // Process each game result
  gamePlayersData.forEach((entry) => {
    if (entry.final_result === null) return;

    const playerId = entry.player.id;
    const playerName = entry.player.name;
    const finalResult = entry.final_result;

    // If player lost money (negative result), they owe others
    if (finalResult < 0) {
      gamePlayersData.forEach((otherEntry) => {
        if (otherEntry.player.id !== playerId && otherEntry.final_result > 0) {
          // Calculate proportion of debt
          const proportion = Math.abs(otherEntry.final_result) / 
            gamePlayersData
              .filter(p => p.final_result > 0)
              .reduce((sum, p) => sum + p.final_result, 0);
          
          const amount = Math.abs(finalResult) * proportion;

          // Update debts map
          if (!debtsMap.has(playerId)) {
            debtsMap.set(playerId, new Map());
          }
          const playerDebts = debtsMap.get(playerId)!;
          const currentDebt = playerDebts.get(otherEntry.player.id) || 0;
          playerDebts.set(otherEntry.player.id, currentDebt + amount);
        }
      });
    }
  });

  // Convert debts map to consolidated transactions
  const transactions: TransactionSummary[] = [];
  debtsMap.forEach((debts, fromId) => {
    debts.forEach((amount, toId) => {
      // Find the reverse debt if it exists
      const reverseDebt = debtsMap.get(toId)?.get(fromId) || 0;
      
      // Only process each pair once and calculate net amount
      if (fromId < toId) {
        const netAmount = amount - reverseDebt;
        if (Math.abs(netAmount) >= 0.01) { // Only include non-zero transactions
          const fromPlayer = gamePlayersData.find(p => p.player.id === fromId)?.player;
          const toPlayer = gamePlayersData.find(p => p.player.id === toId)?.player;
          
          if (netAmount > 0) {
            transactions.push({
              from: fromPlayer.name,
              fromId: fromId,
              to: toPlayer.name,
              toId: toId,
              amount: netAmount
            });
          } else {
            transactions.push({
              from: toPlayer.name,
              fromId: toId,
              to: fromPlayer.name,
              toId: fromId,
              amount: Math.abs(netAmount)
            });
          }
        }
      }
    });
  });

  console.log("Processed transactions:", transactions);
  return transactions;
};

const Financials = () => {
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['historical-transactions'],
    queryFn: fetchHistoricalTransactions,
  });

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
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction, index) => (
                  <TableRow key={index}>
                    <TableCell>{transaction.from}</TableCell>
                    <TableCell>{transaction.to}</TableCell>
                    <TableCell className="text-right">${transaction.amount.toFixed(2)}</TableCell>
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