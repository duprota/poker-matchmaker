
import { ArrowRight, Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GamePlayer } from "@/types/game";
import { calculateOptimizedPayments } from "@/utils/paymentOptimization";
import { calculateFinalResult } from "../GameCalculations";

interface PaymentInstructionsProps {
  players: GamePlayer[];
  onUpdatePaymentStatus?: (playerId: string, status: string) => Promise<void>;
}

export const PaymentInstructions = ({ players, onUpdatePaymentStatus }: PaymentInstructionsProps) => {
  // Format players data for the optimization function
  const formattedPlayers = players.map(player => ({
    id: player.id,
    game_id: player.game_id,
    player: {
      id: player.player.id,
      name: player.player.name,
      email: player.player.email
    },
    initial_buyin: player.initial_buyin,
    total_rebuys: player.total_rebuys,
    final_result: calculateFinalResult(player),
    payment_status: player.payment_status,
    payment_amount: player.payment_amount
  }));

  const transactions = calculateOptimizedPayments([{
    id: players[0]?.game_id || '',
    date: new Date().toISOString(),
    name: null,
    players: formattedPlayers
  }]);

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Payment Instructions</h3>
      <div className="space-y-3">
        {transactions.map((transaction, index) => {
          const fromPlayer = players.find(p => p.player.id === transaction.fromPlayer.id);
          const isPaid = fromPlayer?.payment_status === 'paid';
          
          return (
            <Card 
              key={`${transaction.fromPlayer.id}-${transaction.toPlayer.id}-${index}`}
              className={`p-4 transition-all duration-300 ${
                isPaid 
                  ? 'bg-green-500/10 hover:bg-green-500/20' 
                  : 'hover:bg-muted/50'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium whitespace-nowrap">{transaction.fromPlayer.name}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium whitespace-nowrap">{transaction.toPlayer.name}</span>
                  <span className="font-semibold text-lg ml-2">${transaction.totalAmount}</span>
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
  );
};
