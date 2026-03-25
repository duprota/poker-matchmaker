import { Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { GamePlayer } from "@/types/game";
import { calculateFinalResult } from "../GameCalculations";
import { PlayerAvatar } from "./PlayerAvatar";

interface WinnerCardProps {
  winner: GamePlayer;
}

export const WinnerCard = ({ winner }: WinnerCardProps) => {
  const winnerProfit = calculateFinalResult(winner);
  const totalInvested = winner.initial_buyin + (winner.total_rebuys * winner.initial_buyin);
  const winnerROI = ((winnerProfit / totalInvested) * 100).toFixed(0);

  return (
    <div className="relative flex flex-col items-center py-8 px-4">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 via-amber-500/5 to-transparent rounded-2xl" />
      
      {/* Crown */}
      <div className="relative mb-2 animate-bounce" style={{ animationDuration: '2s' }}>
        <Crown className="w-10 h-10 text-yellow-500 fill-yellow-500/30" />
      </div>

      {/* Avatar with golden glow */}
      <Link to={`/players/${winner.player.id}`} className="relative mb-4 cursor-pointer">
        <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 opacity-60 blur-md animate-pulse" />
        <div className="relative rounded-full ring-4 ring-yellow-500/80 overflow-hidden">
          <PlayerAvatar
            name={winner.player.name}
            avatarUrl={winner.player.avatar_url}
            size={120}
          />
        </div>
      </Link>

      {/* Name */}
      <Link to={`/players/${winner.player.id}`}>
        <h2 className="relative text-2xl font-extrabold bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 bg-clip-text text-transparent mb-1 hover:opacity-80 transition-opacity">
          {winner.player.name}
        </h2>
      </Link>

      {/* Profit */}
      <p className="relative text-3xl font-bold text-green-500 mb-1">
        +${winnerProfit}
      </p>

      {/* ROI */}
      <p className="relative text-sm text-muted-foreground">
        ROI: <span className="font-semibold text-green-400">{winnerROI}%</span> • Investido: ${totalInvested}
      </p>
    </div>
  );
};
