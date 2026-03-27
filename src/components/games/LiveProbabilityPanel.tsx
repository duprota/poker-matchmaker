import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ArrowDown, Minus, TrendingUp } from "lucide-react";

interface LiveScore {
  player_id: string;
  name: string;
  personal_rebuys: number;
  score_normalizado: number;
  posicao_esperada: number;
  phase: string;
  cashed_out: boolean;
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
  const initialFetched = useRef(false);

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

      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      if (Array.isArray(parsed)) {
        setScores(parsed);
        if (!initialFetched.current && parsed.length > 0) {
          const init: Record<string, number> = {};
          parsed.forEach((s: LiveScore) => {
            init[s.player_id] = s.posicao_esperada;
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

  const phase = scores[0]?.phase || "early";
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

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {scores.map((score, index) => {
              const initialPos = initialPositions[score.player_id] || score.posicao_esperada;
              const posDiff = initialPos - score.posicao_esperada;
              const pct = Math.round(score.score_normalizado * 100);

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
                      <span className="text-sm font-medium truncate">{score.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          R:{score.personal_rebuys}
                        </span>
                        <span className="text-sm font-bold text-blue-400">{pct}%</span>
                        {posDiff > 0 && (
                          <ArrowUp className="h-3 w-3 text-green-400" />
                        )}
                        {posDiff < 0 && (
                          <ArrowDown className="h-3 w-3 text-red-400" />
                        )}
                        {posDiff === 0 && (
                          <Minus className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <Progress
                      value={pct}
                      className="h-2 bg-zinc-800"
                    />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
};
