import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Brain, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SkillPlayer {
  id: string;
  name: string;
  avatar_url: string | null;
  mu: number;
  sigma: number;
  skill_score: number;
  rating_games: number;
}

const fetchSkillRatings = async (): Promise<SkillPlayer[]> => {
  const { data, error } = await supabase
    .from("players")
    .select("id, name, avatar_url, mu, sigma, skill_score, rating_games")
    .gt("rating_games", 0)
    .order("skill_score", { ascending: false });

  if (error) throw error;

  // Secondary sort by rating_games DESC for tiebreaking
  return (data || []).sort((a, b) => {
    if (b.skill_score !== a.skill_score) return b.skill_score - a.skill_score;
    return b.rating_games - a.rating_games;
  });
};

const RankIcon = ({ position }: { position: number }) => {
  if (position === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
  if (position === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (position === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return (
    <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">
      {position}
    </span>
  );
};

export const SkillRatingTable = () => {
  const { data: players, isLoading } = useQuery({
    queryKey: ["skill-ratings"],
    queryFn: fetchSkillRatings,
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando ratings...</div>;
  }

  if (!players || players.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Nenhum rating calculado ainda.</p>
        <p className="text-sm mt-1">Finalize jogos para gerar os ratings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {players.map((player, index) => {
        const position = index + 1;
        const isProvisional = player.rating_games < 3;
        const ratingDisplay = Math.round(player.skill_score);

        return (
          <Card
            key={player.id}
            className={cn(
              "p-4 transition-all bg-card/80 backdrop-blur-sm border-primary/10 hover:border-primary/20 animate-fade-in",
              position <= 3 && "border-primary/20"
            )}
          >
            <div className="flex items-center gap-3">
              {/* Rank */}
              <div className="flex items-center justify-center w-8">
                <RankIcon position={position} />
              </div>

              {/* Avatar */}
              <Avatar className="h-9 w-9">
                <AvatarImage src={player.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-muted">
                  {player.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Name + games */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground truncate">
                    {player.name}
                  </span>
                  {isProvisional && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 border-yellow-500/50 text-yellow-500 shrink-0"
                    >
                      Provisório
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {player.rating_games} {player.rating_games === 1 ? "jogo" : "jogos"} • μ{" "}
                  {Number(player.mu).toFixed(1)}
                </div>
              </div>

              {/* Rating */}
              <div className="text-right shrink-0">
                <div
                  className={cn(
                    "text-lg font-bold",
                    ratingDisplay >= 0 ? "text-primary" : "text-destructive"
                  )}
                >
                  {ratingDisplay}
                </div>
                <div className="text-[10px] text-muted-foreground">rating</div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
