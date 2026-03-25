import { GamePlayer } from "@/types/game";
import { calculateFinalResult } from "./GameCalculations";
import { GameOverview } from "./summary/GameOverview";
import { WinnerCard } from "./summary/WinnerCard";
import { PodiumSection } from "./summary/PodiumSection";
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
  const podiumPlayers = sortedPlayers.slice(1, 3);
  const hasEnoughForPodium = sortedPlayers.length >= 3;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <GameOverview 
          name={name}
          date={date}
          place={place}
          startedAt={startedAt}
          playerCount={players.length}
        />
      </div>

      <div className="animate-fade-in" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
        <WinnerCard winner={winner} />
      </div>

      {hasEnoughForPodium && (
        <div className="animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
          <PodiumSection players={podiumPlayers} />
        </div>
      )}

      <div className="animate-fade-in" style={{ animationDelay: '450ms', animationFillMode: 'both' }}>
        <Rankings players={players} skipTop={hasEnoughForPodium ? 3 : 1} />
      </div>

      <div className="animate-fade-in" style={{ animationDelay: '600ms', animationFillMode: 'both' }}>
        <GameStats players={players} />
      </div>

      <div className="animate-fade-in" style={{ animationDelay: '750ms', animationFillMode: 'both' }}>
        <ShareButton 
          players={players}
          date={date}
          name={name}
          place={place}
        />
      </div>
    </div>
  );
};
