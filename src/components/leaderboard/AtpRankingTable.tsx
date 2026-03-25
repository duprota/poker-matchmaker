import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Target, HelpCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AtpConfigPanel } from "./AtpConfigPanel";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface AtpPlayer {
  id: string;
  name: string;
  avatar_url: string | null;
  score_atp: number;
  games_scored: number;
}

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  "250": { label: "ATP 250", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  "500": { label: "ATP 500", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  "1000": { label: "ATP 1000", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  "grand_slam": { label: "Grand Slam 🏆", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
};

const fetchAtpRanking = async (): Promise<AtpPlayer[]> => {
  const { data, error } = await supabase
    .from("atp_ranking" as any)
    .select("*");

  if (error) throw error;
  return (data || []) as unknown as AtpPlayer[];
};

const fetchAtpConfig = async (): Promise<{ window_size: number }> => {
  const { data, error } = await supabase
    .from("atp_config")
    .select("window_size")
    .limit(1)
    .single();

  if (error) throw error;
  return data as any;
};

const fetchDroppingPoints = async (): Promise<Record<string, number>> => {
  const { data: config } = await supabase
    .from("atp_config")
    .select("window_size")
    .limit(1)
    .single();
  
  if (!config) return {};
  const windowSize = (config as any).window_size;

  const { data: games } = await supabase
    .from("games")
    .select("id, date")
    .eq("status", "completed")
    .order("date", { ascending: false })
    .limit(windowSize);

  if (!games || games.length < windowSize) return {};

  const oldestGameId = games[games.length - 1].id;

  const { data: points } = await supabase
    .from("atp_points")
    .select("player_id, raw_points")
    .eq("game_id", oldestGameId);

  if (!points) return {};

  const map: Record<string, number> = {};
  for (const p of points) {
    map[p.player_id] = Number(p.raw_points);
  }
  return map;
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

export const AtpRankingTable = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [recalculating, setRecalculating] = useState(false);

  const { data: players, isLoading } = useQuery({
    queryKey: ["atp-ranking"],
    queryFn: fetchAtpRanking,
  });

  const { data: config } = useQuery({
    queryKey: ["atp-config"],
    queryFn: fetchAtpConfig,
  });

  const { data: droppingPoints } = useQuery({
    queryKey: ["atp-dropping-points"],
    queryFn: fetchDroppingPoints,
  });

  const handleRecalculateAll = async () => {
    setRecalculating(true);
    try {
      const { error } = await supabase.functions.invoke("calculate-ratings", {
        body: { action: "recalculate-all-atp" },
      });
      if (error) throw error;
      toast({ title: "Sucesso", description: "Pontos ATP recalculados com o novo sistema de tiers." });
      window.location.reload();
    } catch {
      toast({ title: "Erro", description: "Falha ao recalcular.", variant: "destructive" });
    } finally {
      setRecalculating(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando ranking ATP...</div>;
  }

  if (!players || players.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Nenhum ponto ATP calculado ainda.</p>
        <p className="text-sm mt-1">Finalize jogos para gerar o ranking.</p>
      </div>
    );
  }

  const windowSize = config?.window_size ?? 15;

  return (
    <TooltipProvider delayDuration={300}>
      {/* Info banner */}
      <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-muted/50 border border-border/50">
        <HelpCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            Ranking baseado nos <strong className="text-foreground">últimos {windowSize} jogos</strong> do grupo.
            Apenas os <strong className="text-foreground">top 5</strong> de cada mesa pontuam.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {Object.entries(TIER_LABELS).map(([key, { label, color }]) => (
              <Badge key={key} variant="outline" className={cn("text-[10px] px-1.5 py-0", color)}>
                {label}
              </Badge>
            ))}
          </div>
          <p className="text-[10px] mt-1">
            Tier definido pela média de skill dos jogadores (percentis P50/P85). Grand Slam é manual.
          </p>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-[11px] text-primary mt-1"
            onClick={() => navigate("/atp-info")}
          >
            <Info className="w-3 h-3 mr-1" />
            Saiba mais sobre o ranking ATP
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {players.map((player, index) => {
          const position = index + 1;
          const dropping = droppingPoints?.[player.id];

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

                {/* Name + info */}
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-foreground truncate block">
                    {player.name}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{player.games_scored} {player.games_scored === 1 ? "jogo" : "jogos"} na janela</span>
                    {dropping !== undefined && dropping > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center gap-0.5 text-orange-500 cursor-help">
                            <AlertTriangle className="w-3 h-3" />
                            -{dropping}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[220px] text-xs">
                          Pontos que cairão quando o próximo jogo do grupo acontecer (do jogo mais antigo na janela).
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>

                {/* Score */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-right shrink-0 cursor-help">
                      <div className="text-lg font-bold text-primary">
                        {Math.round(player.score_atp)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">pts ATP</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[260px] text-xs">
                    Soma dos pontos dos últimos {windowSize} jogos. Pontos por posição: 1º até 5º dependendo do tier (ATP 250/500/1000/Grand Slam).
                  </TooltipContent>
                </Tooltip>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Config panel */}
      <AtpConfigPanel />

      {/* Recalculate button */}
      <div className="mt-3 text-center">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRecalculateAll}
          disabled={recalculating}
          className="text-xs text-muted-foreground"
        >
          {recalculating ? "Recalculando..." : "Recalcular todos os pontos ATP"}
        </Button>
      </div>
    </TooltipProvider>
  );
};