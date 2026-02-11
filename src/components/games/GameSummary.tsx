
import { GamePlayer } from "@/types/game";
import { calculateFinalResult } from "./GameCalculations";
import { GameOverview } from "./summary/GameOverview";
import { WinnerCard } from "./summary/WinnerCard";
import { GameStats } from "./summary/GameStats";
import { Rankings } from "./summary/Rankings";
import { ShareButton } from "./summary/ShareButton";

interface GameSummaryProps {
  players: GamePlayer[];
  gameHistory: any[];
  date: string;
  name?: string;
  place?: string;
  startedAt?: string;
}

export const GameSummary = ({ 
  players, 
  gameHistory, 
  date,
  name,
  place,
  startedAt,
}: GameSummaryProps) => {
  const sortedPlayers = [...players].sort((a, b) => {
    const resultA = calculateFinalResult(a);
    const resultB = calculateFinalResult(b);
    return resultB - resultA;
  });

  const winner = sortedPlayers[0];

  return (
    <div className="space-y-8 animate-fade-in">
      <GameOverview 
        name={name}
        date={date}
        place={place}
        startedAt={startedAt}
        playerCount={players.length}
      />

      <WinnerCard winner={winner} />

      <GameStats players={players} />

      <Rankings players={players} />

      <ShareButton 
        players={players}
        date={date}
        name={name}
        place={place}
      />
    </div>
  );
};
