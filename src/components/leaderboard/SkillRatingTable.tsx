import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Brain, HelpCircle, Info } from "lucide-react";
import { Link } from "react-router-dom";
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
    <TooltipProvider delayDuration={300}>
      {/* Info header */}
      <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-muted/50 border border-border/50">
        <HelpCircle className="w-4 h-4 text-muted-foreground shrink-0" />
        <p className="text-xs text-muted-foreground">
          O <strong className="text-foreground">Rating</strong> mede a habilidade conservadora do jogador usando o algoritmo Weng-Lin.{" "}
          <strong className="text-foreground">μ (mu)</strong> é a habilidade estimada — quanto maior, melhor.{" "}
          Jogadores com menos de 3 partidas têm rating <strong className="text-foreground">Provisório</strong> (alta incerteza).
        </p>
      </div>

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
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 border-yellow-500/50 text-yellow-500 shrink-0 cursor-help"
                          >
                            Provisório
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px] text-xs">
                          Menos de 3 jogos — o rating ainda tem alta incerteza e pode mudar bastante.
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-xs text-muted-foreground cursor-help w-fit">
                        {player.rating_games} {player.rating_games === 1 ? "jogo" : "jogos"} • μ{" "}
                        {Number(player.mu).toFixed(1)}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[220px] text-xs">
                      μ (mu) = habilidade estimada. Quanto mais jogos, mais preciso o valor.
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Rating */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-right shrink-0 cursor-help">
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
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[240px] text-xs">
                    Rating = (μ − 3σ) × 40. Combina habilidade e confiança — penaliza quem tem poucos jogos.
                  </TooltipContent>
                </Tooltip>
              </div>
            </Card>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
