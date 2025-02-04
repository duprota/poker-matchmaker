import { useEffect, useState } from "react";
import { GamePlayer } from "@/types/game";
import { Card } from "@/components/ui/card";
import { TrendingUpIcon, RefreshCwIcon } from "lucide-react";

interface GameMoneyFlowChartProps {
  players: GamePlayer[];
  gameHistory: any[]; // Using any temporarily due to the history type not being defined
}

export const GameMoneyFlowChart = ({ players, gameHistory }: GameMoneyFlowChartProps) => {
  const totalRebuys = players.reduce((acc, player) => acc + player.total_rebuys, 0);
  const currentTotal = players.reduce((acc, player) => {
    const totalAmount = player.initial_buyin * (1 + (player.total_rebuys || 0));
    return acc + totalAmount;
  }, 0);

  return (
    <div className="space-y-6 animate-fade-in relative z-0">
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Game Stats</h3>
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <TrendingUpIcon className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total in Play</p>
                <p className="text-2xl font-bold">${currentTotal}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <RefreshCwIcon className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Rebuys</p>
                <p className="text-2xl font-bold">{totalRebuys}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};