
import { Card } from "@/components/ui/card";
import { GamePlayer } from "@/types/game";
import { calculateFinalResult } from "../GameCalculations";

interface GameStatsProps {
  players: GamePlayer[];
}

export const GameStats = ({ players }: GameStatsProps) => {
  const totalMoneyInPlay = players.reduce((acc, player) => {
    return acc + player.initial_buyin + (player.total_rebuys * player.initial_buyin);
  }, 0);

  const totalRebuys = players.reduce((acc, player) => acc + player.total_rebuys, 0);
  const mostRebuys = players.reduce((acc, player) => Math.max(acc, player.total_rebuys), 0);
  const playerWithMostRebuys = players.find(player => player.total_rebuys === mostRebuys);
  const highestSingleWin = Math.max(...players.map(player => calculateFinalResult(player)));

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4">Game Statistics</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Highest Single Win</p>
          <p className="text-xl font-semibold text-green-500">${highestSingleWin}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Most Rebuys</p>
          <p className="text-xl font-semibold">{playerWithMostRebuys?.player.name} ({mostRebuys})</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Money in Play</p>
          <p className="text-xl font-semibold">${totalMoneyInPlay}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Rebuys</p>
          <p className="text-xl font-semibold">{totalRebuys}</p>
        </div>
      </div>
    </Card>
  );
};
