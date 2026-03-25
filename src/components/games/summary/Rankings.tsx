import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { GamePlayer } from "@/types/game";
import { calculateFinalResult } from "../GameCalculations";
import { SpecialHandIcon } from "@/components/shared/SpecialHandIcon";
import { PlayerAvatar } from "./PlayerAvatar";

interface RankingsProps {
  players: GamePlayer[];
  skipTop?: number;
}

export const Rankings = ({ players, skipTop = 0 }: RankingsProps) => {
  const sortedPlayers = [...players].sort((a, b) => {
    const resultA = calculateFinalResult(a);
    const resultB = calculateFinalResult(b);
    return resultB - resultA;
  });

  const displayPlayers = sortedPlayers.slice(skipTop);

  if (displayPlayers.length === 0) return null;

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">
        {skipTop > 0 ? 'Demais Jogadores' : 'Final Rankings'}
      </h3>
      <div className="space-y-2">
        {displayPlayers.map((player, index) => {
          const result = calculateFinalResult(player);
          const position = skipTop + index + 1;
          const specialHands = player.special_hands || {};

          return (
            <Card key={player.id} className="p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground w-6">
                    #{position}
                  </span>
                  <Link to={`/players/${player.player.id}`} className="rounded-full overflow-hidden flex-shrink-0">
                    <PlayerAvatar
                      name={player.player.name}
                      avatarUrl={player.player.avatar_url}
                      size={32}
                    />
                  </Link>
                  <div>
                    <Link to={`/players/${player.player.id}`} className="hover:opacity-80 transition-opacity">
                      <p className="font-medium text-sm">{player.player.name}</p>
                    </Link>
                    {Object.entries(specialHands).length > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        {Object.entries(specialHands).map(([handType, count]) => (
                          count > 0 && (
                            <div key={handType} className="flex items-center gap-0.5">
                              <SpecialHandIcon type={handType as any} size="sm" />
                              <span className="text-xs font-semibold">{count}</span>
                            </div>
                          )
                        ))}
                      </div>
                    )}
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
  );
};
