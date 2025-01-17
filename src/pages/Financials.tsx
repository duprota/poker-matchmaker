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
import { calculateMinimumTransactions } from "@/utils/paymentCalculations";

interface PlayerBalance {
  playerId: string;
  playerName: string;
  balance: number;
}

const fetchFinancialsData = async () => {
  console.log("Fetching financials data...");
  
  const { data, error } = await supabase
    .from('game_players')
    .select(`
      id,
      player:players(id, name),
      game:games(status),
      final_result,
      payment_status
    `)
    .eq('games.status', 'completed')
    .not('final_result', 'is', null);

  if (error) {
    console.error("Error fetching financials data:", error);
    throw error;
  }

  console.log("Raw financials data:", data);

  // Calculate total balances per player
  const playerBalances = data.reduce((acc: { [key: string]: PlayerBalance }, entry) => {
    const playerId = entry.player.id;
    const playerName = entry.player.name;
    
    if (!acc[playerId]) {
      acc[playerId] = {
        playerId,
        playerName,
        balance: 0
      };
    }

    // Only consider unpaid amounts
    if (entry.payment_status === 'pending') {
      const finalResult = entry.final_result || 0;
      acc[playerId].balance += finalResult;
    }

    return acc;
  }, {});

  // Convert to array and filter out settled balances
  const balances = Object.values(playerBalances)
    .filter(player => Math.abs(player.balance) > 0);

  console.log("Processed player balances:", balances);
  return balances;
};

const Financials = () => {
  const { data: playerBalances, isLoading, error } = useQuery({
    queryKey: ['financials'],
    queryFn: fetchFinancialsData,
  });

  const transactions = playerBalances ? calculateMinimumTransactions(playerBalances) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold text-white mb-6">Consolidated Financials</h1>
          <Card className="p-4">
            <div className="text-center py-8">Loading financials data...</div>
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
          <h1 className="text-3xl font-bold text-white mb-6">Consolidated Financials</h1>
          <Card className="p-4">
            <div className="text-center py-8 text-red-500">
              Error loading financials data. Please try again later.
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
        <h1 className="text-3xl font-bold text-white mb-6">Consolidated Financials</h1>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Overall Balances</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playerBalances?.map((player) => (
                <TableRow key={player.playerId}>
                  <TableCell>{player.playerName}</TableCell>
                  <TableCell className={`text-right ${
                    player.balance >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    ${player.balance}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {transactions.length > 0 && (
            <>
              <h2 className="text-xl font-semibold mb-4 mt-8">Required Payments</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction, index) => {
                    const fromPlayer = playerBalances.find(p => p.playerId === transaction.from);
                    const toPlayer = playerBalances.find(p => p.playerId === transaction.to);
                    return (
                      <TableRow key={index}>
                        <TableCell>{fromPlayer?.playerName}</TableCell>
                        <TableCell>{toPlayer?.playerName}</TableCell>
                        <TableCell className="text-right">${transaction.amount}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Financials;