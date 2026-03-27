import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ArrowDown, Minus, TrendingUp, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LiveScore {
  player_id: string;
  name: string;
  is_active: boolean;
  personal_rebuys: number;
  score_normalizado: number | null;
  posicao_esperada: number | null;
  phase: string | null;
  saldo_saida: number | null;
}

interface LiveProbabilityPanelProps {
  gameId: string;
  gameStatus: string;
}

const PHASE_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  early: { label: "Abertura", emoji: "🟢", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  mid: { label: "Meio", emoji: "🟡", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  late: { label: "Reta Final", emoji: "🔴", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

export const LiveProbabilityPanel = ({ gameId, gameStatus }: LiveProbabilityPanelProps) => {
  const [scores, setScores] = useState<LiveScore[]>([]);
  const [initialPositions, setInitialPositions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [previousActiveIds, setPreviousActiveIds] = useState<Set<string>>(new Set());
  const initialFetched = useRef(false);
  const { toast } = useToast();

  const fetchLiveScores = async () => {
    if (gameStatus === "completed") return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("calculate-live-scores", {
        body: { game_id: gameId },
      });

      if (error) {
        console.error("Error fetching live scores:", error);
        return;
      }

      const parsed: LiveScore[] = typeof data === "string" ? JSON.parse(data) : data;
      if (Array.isArray(parsed)) {
        // Detect newly cashed-out players for exit narrative
        const currentActiveIds = new Set(parsed.filter(s => s.is_active).map(s => s.player_id));
        if (previousActiveIds.size > 0) {
          const newlyCashedOut = parsed.filter(
            s => !s.is_active && previousActiveIds.has(s.player_id)
          );
          for (const player of newlyCashedOut) {
            showExitNarrative(player);
          }
        }
        setPreviousActiveIds(currentActiveIds);

        setScores(parsed);

        // Track initial positions for active players only
        if (!initialFetched.current && parsed.length > 0) {
          const init: Record<string, number> = {};
          parsed.filter(s => s.is_active && s.posicao_esperada != null).forEach((s) => {
            init[s.player_id] = s.posicao_esperada!;
          });
          setInitialPositions(init);
          initialFetched.current = true;
        }
      }
    } catch (err) {
      console.error("Live scores error:", err);
    } finally {
      setLoading(false);
    }
  };

  const showExitNarrative = async (player: LiveScore) => {
    const saldo = player.saldo_saida ?? 0;
    const rebuys = player.personal_rebuys;

    // Try to get previous score from live_game_scores
    let prevScore = 0;
    try {
      const { data } = await supabase
        .from("live_game_scores")
        .select("score_normalizado")
        .eq("game_id", gameId)
        .eq("player_id", player.player_id)
        .eq("is_active", true)
        .order("snapshot_at", { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        prevScore = Number(data[0].score_normalizado);
      }
    } catch {}

    let message: string;
    if (saldo > 0 && prevScore > 0.20) {
      message = `${player.name} saiu com +R$${saldo} — deixou ${Math.round(prevScore * 100)}% de chance na mesa`;
    } else if (saldo > 0) {
      message = `${player.name} fez a jogada certa — sacou +R$${saldo} antes de afundar`;
    } else {
      message = `${player.name} saiu com -R$${Math.abs(saldo)} após ${rebuys} rebuy${rebuys !== 1 ? 's' : ''}`;
    }

    toast({ description: message, duration: 5000 });
  };

  // Fetch on mount
  useEffect(() => {
    if (gameStatus !== "ongoing") return;
    fetchLiveScores();
  }, [gameId, gameStatus]);

  // Subscribe to real-time changes on game_players
  useEffect(() => {
    if (gameStatus !== "ongoing") return;

    const channel = supabase
      .channel(`live-scores-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_players",
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          console.log("Game players changed, recalculating live scores...");
          fetchLiveScores();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, gameStatus]);

  if (gameStatus !== "ongoing" || scores.length === 0) return null;

  const activePlayers = scores.filter(s => s.is_active);
  const cashedOutPlayers = scores.filter(s => !s.is_active);
  const phase = activePlayers[0]?.phase || "early";
  const phaseInfo = PHASE_CONFIG[phase] || PHASE_CONFIG.early;

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-zinc-900/60 to-zinc-900/20 backdrop-blur-md">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <h3 className="font-bold text-lg">Probabilidades ao Vivo</h3>
          </div>
          <Badge variant="outline" className={`${phaseInfo.color} border`}>
            {phaseInfo.emoji} {phaseInfo.label}
          </Badge>
        </div>

        {/* Active Players */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {activePlayers.map((score) => {
              const initialPos = initialPositions[score.player_id] || score.posicao_esperada || 0;
              const posDiff = initialPos - (score.posicao_esperada || 0);
              const pct = Math.round((score.score_normalizado || 0) * 100);

              return (
                <motion.div
                  key={score.player_id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-sm font-bold text-muted-foreground w-6 text-center">
                    {score.posicao_esperada}º
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-sm font-medium truncate">{score.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          R:{score.personal_rebuys}
                        </span>
                        <span className="text-sm font-bold text-blue-400">{pct}%</span>
                        {posDiff > 0 && <ArrowUp className="h-3 w-3 text-green-400" />}
                        {posDiff < 0 && <ArrowDown className="h-3 w-3 text-red-400" />}
                        {posDiff === 0 && <Minus className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    </div>
                    <Progress value={pct} className="h-2 bg-zinc-800" />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Cashed Out Players */}
        {cashedOutPlayers.length > 0 && (
          <>
            <Separator className="my-4 bg-zinc-700/50" />
            <div className="flex items-center gap-2 mb-3">
              <LogOut className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Saíram
              </span>
            </div>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {cashedOutPlayers.map((score) => {
                  const saldo = score.saldo_saida ?? 0;
                  const isPositive = saldo >= 0;

                  return (
                    <motion.div
                      key={score.player_id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 0.6, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="flex items-center justify-between gap-3 px-1"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm truncate">{score.name}</span>
                        <span className="text-xs text-muted-foreground">
                          R:{score.personal_rebuys}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-sm font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          {isPositive ? '+' : '−'}R${Math.abs(saldo)}
                        </span>
                        <span className="text-lg">
                          {isPositive ? '✅' : '❌'}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};
