import { Trophy, ArrowRight, Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GamePlayer } from "@/types/game";
import { calculateFinalResult } from "./GameCalculations";
import { calculateMinimumTransactions } from "@/utils/paymentCalculations";

interface GameSummaryProps {
  players: GamePlayer[];
  gameHistory: any[];
  date: string;
  onUpdatePaymentStatus?: (playerId: string, status: string) => Promise<void>;
}

export const GameSummary = ({ 
  players, 
  gameHistory, 
  date,
  onUpdatePaymentStatus 
}: GameSummaryProps) => {
  const sortedPlayers = [...players].sort((a, b) => {
    const resultA = calculateFinalResult(a);
    const resultB = calculateFinalResult(b);
    return resultB - resultA;
  });

  const winner = sortedPlayers[0];
  const winnerProfit = calculateFinalResult(winner);
  const winnerROI = ((winnerProfit / (winner.initial_buyin + (winner.total_rebuys * winner.initial_buyin))) * 100).toFixed(2);

  const totalMoneyInPlay = players.reduce((acc, player) => {
    return acc + player.initial_buyin + (player.total_rebuys * player.initial_buyin);
  }, 0);

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
      <Card className="p-6 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 dark:from-yellow-500/10 dark:to-amber-500/10 border-yellow-500/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Trophy className="w-12 h-12 text-yellow-500 animate-[pulse_3s_ease-in-out_infinite]" />
              <div className="absolute -inset-1 bg-yellow-500/20 blur-lg rounded-full -z-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent">
                {winner.player.name}
              </h2>
              <p className="text-lg text-green-500 font-semibold">+${winnerProfit}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Return on Investment</p>
            <p className="text-xl font-semibold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
              {winnerROI}%
            </p>
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
              <Card 
                key={player.id} 
                className={`p-4 hover:bg-muted/50 transition-all duration-300 transform hover:scale-[1.02] ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10' :
                  index === 1 ? 'bg-gradient-to-r from-slate-300/10 to-slate-400/10' :
                  index === 2 ? 'bg-gradient-to-r from-amber-700/10 to-amber-800/10' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className={`text-lg font-bold ${
                      index === 0 ? 'text-yellow-500' :
                      index === 1 ? 'text-slate-400' :
                      index === 2 ? 'text-amber-700' : ''
                    }`}>
                      #{index + 1}
                    </span>
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
        <Card className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10">
          <p className="text-sm text-muted-foreground">Total Money in Play</p>
          <p className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ${totalMoneyInPlay}
          </p>
        </Card>
      </div>

      {/* Payment Instructions */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Payment Instructions</h3>
        <div className="space-y-3">
          {transactions.map((transaction, index) => {
            const fromPlayer = players.find(p => p.id === transaction.from);
            const toPlayer = players.find(p => p.id === transaction.to);
            const isPaid = fromPlayer?.payment_status === 'paid';
            
            return (
              <Card 
                key={index} 
                className={`p-4 transition-all duration-300 ${
                  isPaid 
                    ? 'bg-green-500/10 hover:bg-green-500/20' 
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium whitespace-nowrap">{fromPlayer?.player.name}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium whitespace-nowrap">{toPlayer?.player.name}</span>
                    <span className="font-semibold text-lg ml-2">${transaction.amount}</span>
                  </div>
                  {onUpdatePaymentStatus && fromPlayer && (
                    <Button
                      variant={isPaid ? "outline" : "default"}
                      size="sm"
                      onClick={() => onUpdatePaymentStatus(
                        fromPlayer.id,
                        isPaid ? 'pending' : 'paid'
                      )}
                      className={`w-full sm:w-auto transition-all duration-200 ${
                        isPaid 
                          ? 'hover:bg-red-500/10 hover:text-red-500 hover:border-red-500' 
                          : 'hover:bg-green-500/90'
                      }`}
                    >
                      {isPaid ? (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          <span>Mark as Pending</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          <span>Mark as Paid</span>
                        </>
                      )}
                    </Button>
                  )}
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
          className="w-full md:w-auto bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
          onClick={handleShareWhatsApp}
        >
          Share on WhatsApp
        </Button>
      </div>
    </div>
  );
};