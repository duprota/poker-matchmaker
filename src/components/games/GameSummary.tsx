import { Trophy, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GamePlayer } from "@/types/game";
import { calculateFinalResult } from "./GameCalculations";
import { calculateMinimumTransactions } from "@/utils/paymentCalculations";
import { GameMoneyFlowChart } from "./GameMoneyFlowChart";

interface GameSummaryProps {
  players: GamePlayer[];
  gameHistory: any[];
  date: string;
}

export const GameSummary = ({ players, gameHistory, date }: GameSummaryProps) => {
  // Sort players by final result (descending)
  const sortedPlayers = [...players].sort((a, b) => {
    const resultA = calculateFinalResult(a);
    const resultB = calculateFinalResult(b);
    return resultB - resultA;
  });

  const winner = sortedPlayers[0];
  const winnerProfit = calculateFinalResult(winner);
  const winnerROI = ((winnerProfit / (winner.initial_buyin + (winner.total_rebuys * winner.initial_buyin))) * 100).toFixed(2);

  // Calculate total money in play
  const totalMoneyInPlay = players.reduce((acc, player) => {
    return acc + player.initial_buyin + (player.total_rebuys * player.initial_buyin);
  }, 0);

  // Calculate payment transactions
  const playerBalances = players.map(player => ({
    playerId: player.id,
    playerName: player.player.name,
    balance: calculateFinalResult(player)
  }));

  const transactions = calculateMinimumTransactions(playerBalances);

  const handleShareWhatsApp = () => {
    const summaryText = `🏆 Game Summary (${new Date(date).toLocaleDateString()})\n\n` +
      `Winner: ${winner.player.name} (+$${winnerProfit}) - ROI: ${winnerROI}%\n\n` +
      `Rankings:\n${sortedPlayers.map((p, i) => 
        `${i + 1}. ${p.player.name}: ${calculateFinalResult(p) >= 0 ? '+' : ''}$${calculateFinalResult(p)}`
      ).join('\n')}\n\n` +
      `Total Money in Play: $${totalMoneyInPlay}\n\n` +
      `Required Payments:\n${transactions.map(t => 
        `${players.find(p => p.id === t.from)?.player.name} → ${players.find(p => p.id === t.to)?.player.name}: $${t.amount}`
      ).join('\n')}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(summaryText)}`);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Winner Section */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Trophy className="w-12 h-12 text-yellow-500" />
            <div>
              <h2 className="text-2xl font-bold">{winner.player.name}</h2>
              <p className="text-lg text-green-500">+${winnerProfit}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Return on Investment</p>
            <p className="text-xl font-semibold">{winnerROI}%</p>
          </div>
        </div>
      </Card>

      {/* Rankings */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Final Rankings</h3>
        <div className="space-y-2">
          {sortedPlayers.map((player, index) => {
            const result = calculateFinalResult(player);
            const roi = ((result / (player.initial_buyin + (player.total_rebuys * player.initial_buyin))) * 100).toFixed(2);
            
            return (
              <Card key={player.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold">{index + 1}</span>
                    <div>
                      <p className="font-medium">{player.player.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ROI: {roi}%
                      </p>
                    </div>
                  </div>
                  <p className={`font-semibold ${result >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {result >= 0 ? '+' : ''}{result}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Game Statistics */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Game Statistics</h3>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Money in Play</p>
          <p className="text-2xl font-semibold">${totalMoneyInPlay}</p>
        </Card>
      </div>

      {/* Money Flow Chart */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-6">Money Flow During Game</h3>
        <div className="h-[400px]">
          <GameMoneyFlowChart players={players} gameHistory={gameHistory} />
        </div>
      </Card>

      {/* Payment Instructions */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Payment Instructions</h3>
        <div className="space-y-2">
          {transactions.map((transaction, index) => {
            const fromPlayer = players.find(p => p.id === transaction.from);
            const toPlayer = players.find(p => p.id === transaction.to);
            
            return (
              <Card key={index} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{fromPlayer?.player.name}</span>
                    <ArrowRight className="w-4 h-4" />
                    <span className="font-medium">{toPlayer?.player.name}</span>
                  </div>
                  <p className="font-semibold">${transaction.amount}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Share Button */}
      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          className="w-full md:w-auto"
          onClick={handleShareWhatsApp}
        >
          Share on WhatsApp
        </Button>
      </div>
    </div>
  );
};