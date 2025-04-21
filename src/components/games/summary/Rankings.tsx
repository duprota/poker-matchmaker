
import { Card } from "@/components/ui/card";
import { GamePlayer } from "@/types/game";
import { calculateFinalResult } from "../GameCalculations";
import { EmojiSVGDefs } from "../PlayerSpecialHandReaction";

interface RankingsProps {
  players: GamePlayer[];
}

export const Rankings = ({ players }: RankingsProps) => {
  const sortedPlayers = [...players].sort((a, b) => {
    const resultA = calculateFinalResult(a);
    const resultB = calculateFinalResult(b);
    return resultB - resultA;
  });

  const specialHandLabels = {
    "full_house": { label: "FH", class: "text-yellow-600" },
    "four_of_a_kind": { label: "4K", class: "text-pink-700" },
    "straight_flush": { label: "SF", class: "text-blue-700" },
    "royal_flush": { label: "👑", class: "text-amber-700" }
  };

  return (
    <>
      <EmojiSVGDefs />
      <div>
        <h3 className="text-xl font-semibold mb-4">Final Rankings</h3>
        <div className="space-y-2">
          {sortedPlayers.map((player, index) => {
            const result = calculateFinalResult(player);
            const roi = ((result / (player.initial_buyin + (player.total_rebuys * player.initial_buyin))) * 100).toFixed(0);
            const totalAmountInGame = player.initial_buyin + (player.total_rebuys * player.initial_buyin);
            const specialHands = player.special_hands || {};

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
                    <div className="space-y-1">
                      <p className="font-medium">{player.player.name}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <span>Total In Game: ${totalAmountInGame}</span>
                        <span>ROI: {roi}%</span>
                      </div>
                      {Object.entries(specialHands).length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          {Object.entries(specialHands).map(([handType, count]) => (
                            count > 0 && (
                              <div key={handType} className="flex items-center gap-1">
                                <svg width="20" height="20" aria-hidden="true" focusable="false">
                                  <use href={`#${handType.replace(/_/g, '-')}`}></use>
                                </svg>
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
    </>
  );
};
