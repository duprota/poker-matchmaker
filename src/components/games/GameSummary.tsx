import { GamePlayer } from "@/types/game";
import { calculateFinalResult } from "./GameCalculations";
import { GameOverview } from "./summary/GameOverview";
import { WinnerCard } from "./summary/WinnerCard";
import { PodiumSection } from "./summary/PodiumSection";
import { GameStats } from "./summary/GameStats";
import { Rankings } from "./summary/Rankings";
import { ShareButton } from "./summary/ShareButton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const { data: gameBadges } = useQuery({
    queryKey: ["game-badges", gameId],
    enabled: !!gameId,
    queryFn: async () => {
      const { data: badges } = await supabase
        .from("player_badges" as any)
        .select("*")
        .eq("game_id", gameId!);

      if (!badges || badges.length === 0) return [];

      const { data: defs } = await supabase
        .from("badge_definitions" as any)
        .select("*");
      const defMap = new Map((defs || []).map((d: any) => [d.code, d]));

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

      {gameBadges && gameBadges.length > 0 && (
        <div className="animate-fade-in" style={{ animationDelay: '700ms', animationFillMode: 'both' }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">🏅 Badges Conquistadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {gameBadges.map((badge, i) => (
                  <div
                    key={`${badge.badge_code}-${badge.player_id}-${i}`}
                    className="flex flex-col items-center p-3 rounded-lg border bg-muted/30 text-center"
                  >
                    <span className="text-3xl mb-1">{badge.emoji}</span>
                    <span className="text-sm font-semibold leading-tight">{badge.badge_name}</span>
                    <span className="text-xs text-muted-foreground mt-1">{badge.player_name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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