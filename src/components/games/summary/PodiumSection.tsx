import { Medal } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { GamePlayer } from "@/types/game";
import { calculateFinalResult } from "../GameCalculations";
import { PlayerAvatar } from "./PlayerAvatar";

interface PodiumSectionProps {
  players: GamePlayer[]; // already sorted, index 0 = 2nd place, index 1 = 3rd place
}

export const PodiumSection = ({ players }: PodiumSectionProps) => {
  if (players.length === 0) return null;

  const positions = [
    { label: "2º", color: "text-slate-400", borderColor: "ring-slate-400/60", bgGradient: "from-slate-300/15 to-slate-400/10" },
    { label: "3º", color: "text-amber-700", borderColor: "ring-amber-700/60", bgGradient: "from-amber-700/15 to-amber-800/10" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {players.slice(0, 2).map((player, index) => {
        const result = calculateFinalResult(player);
        const totalInvested = player.initial_buyin + (player.total_rebuys * player.initial_buyin);
        const roi = ((result / totalInvested) * 100).toFixed(0);
        const pos = positions[index];

        return (
          <Card
            key={player.id}
            className={`p-4 flex flex-col items-center bg-gradient-to-b ${pos.bgGradient} border-0`}
          >
            <div className="flex items-center gap-1 mb-2">
              <Medal className={`w-5 h-5 ${pos.color}`} />
              <span className={`text-sm font-bold ${pos.color}`}>{pos.label}</span>
            </div>

            <Link to={`/players/${player.player.id}`} className={`rounded-full ring-2 ${pos.borderColor} overflow-hidden mb-2`}>
              <PlayerAvatar
                name={player.player.name}
                avatarUrl={player.player.avatar_url}
                size={64}
              />
            </Link>

            <Link to={`/players/${player.player.id}`}>
              <p className="font-semibold text-sm text-center truncate w-full hover:opacity-80 transition-opacity">
                {player.player.name}
              </p>
            </Link>

            <p className={`text-lg font-bold ${result >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {result >= 0 ? '+' : ''}{result}
            </p>

            <p className="text-xs text-muted-foreground">ROI: {roi}%</p>
          </Card>
        );
      })}
    </div>
  );
};
