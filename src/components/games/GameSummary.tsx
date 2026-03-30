import { GamePlayer } from "@/types/game";
import { calculateFinalResult } from "./GameCalculations";
import { GameOverview } from "./summary/GameOverview";
import { WinnerCard } from "./summary/WinnerCard";
import { PodiumSection } from "./summary/PodiumSection";
import { GameStats } from "./summary/GameStats";
import { Rankings } from "./summary/Rankings";
import { ShareButton } from "./summary/ShareButton";
import { BadgeAnimation } from "@/components/badges/BadgeAnimation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useCallback } from "react";

interface GameSummaryProps {
  players: GamePlayer[];
  gameHistory: any[];
  date: string;
  name?: string;
  place?: string;
  startedAt?: string;
  gameId?: string;
}

export const GameSummary = ({ 
  players, 
  gameHistory, 
  date,
  name,
  place,
  startedAt,
  gameId,
}: GameSummaryProps) => {
  const [showBadges, setShowBadges] = useState(true);

  // Fetch newly conquered badges for this game
  const { data: gameBadges } = useQuery({
    queryKey: ["game-badges", gameId],
    enabled: !!gameId,
    queryFn: async () => {
      // Get badges conquered in this game
      const { data: badges } = await supabase
        .from("player_badges" as any)
        .select("*")
        .eq("game_id", gameId!);

      if (!badges || badges.length === 0) return [];

      // Get badge definitions
      const { data: defs } = await supabase
        .from("badge_definitions" as any)
        .select("*");
      const defMap = new Map((defs || []).map((d: any) => [d.code, d]));

      // Get player names
      const playerIds = [...new Set((badges as any[]).map((b: any) => b.player_id))];
      const { data: playersList } = await supabase
        .from("players")
        .select("id, name")
        .in("id", playerIds);

      const playerMap = new Map((playersList || []).map((p: any) => [p.id, p.name]));

      return (badges as any[]).map((b: any) => {
        const def = defMap.get(b.badge_code);
        return {
          player_id: b.player_id,
          player_name: playerMap.get(b.player_id) || "Unknown",
          badge_code: b.badge_code,
          badge_name: def?.name || b.badge_code,
          emoji: def?.emoji || "🏅",
          description: def?.description || "",
          metadata: b.metadata,
        };
      });
    },
    staleTime: 60000,
  });

  const handleBadgeAnimationComplete = useCallback(() => {
    setShowBadges(false);
  }, []);

  const sortedPlayers = [...players].sort((a, b) => {
    const resultA = calculateFinalResult(a);
    const resultB = calculateFinalResult(b);
    return resultB - resultA;
  });

  const winner = sortedPlayers[0];
  const podiumPlayers = sortedPlayers.slice(1, 3);
  const hasEnoughForPodium = sortedPlayers.length >= 3;

  // Show badge animation first if there are badges
  if (showBadges && gameBadges && gameBadges.length > 0) {
    return (
      <div className="animate-fade-in">
        <BadgeAnimation
          badges={gameBadges}
          onComplete={handleBadgeAnimationComplete}
        />
      </div>
    );
  }

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
