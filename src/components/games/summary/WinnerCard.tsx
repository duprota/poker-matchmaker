
import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { GamePlayer } from "@/types/game";
import { calculateFinalResult } from "../GameCalculations";

interface WinnerCardProps {
  winner: GamePlayer;
}

export const WinnerCard = ({ winner }: WinnerCardProps) => {
  const winnerProfit = calculateFinalResult(winner);
  const winnerROI = ((winnerProfit / (winner.initial_buyin + (winner.total_rebuys * winner.initial_buyin))) * 100).toFixed(2);

  return (
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
  );
};
