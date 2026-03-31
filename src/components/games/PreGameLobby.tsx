import { Game } from "@/types/game";
import { PlayerAvatar } from "@/components/games/summary/PlayerAvatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, DollarSign, Crown, Swords, Sparkles, BookOpen, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PreGameLobbyProps {
  game: Game;
  onAddPlayer: () => void;
  onRemovePlayer: (playerId: string) => void;
}

interface PlayerExtra {
  id: string;
  skill_score: number | null;
  archetype: string | null;
}

interface AtpEntry {
  id: string | null;
  score_atp: number | null;
  name: string | null;
}

interface PlayerBadgeInfo {
  player_id: string;
  badge_code: string;
  emoji: string;
}

const DEFAULT_SKILL = 800;

const archetypeLabels: Record<string, { label: string; emoji: string }> = {
  tubarao: { label: "Tubarão", emoji: "🦈" },
  estrategista: { label: "Estrategista", emoji: "🧠" },
  fenix: { label: "Fênix", emoji: "🔥" },
  sangrador: { label: "Sangrador", emoji: "🩸" },
  novato: { label: "Novato", emoji: "🌱" },
};

export const PreGameLobby = ({ game, onAddPlayer, onRemovePlayer }: PreGameLobbyProps) => {
  const [playerExtras, setPlayerExtras] = useState<PlayerExtra[]>([]);
  const [eliteBadges, setEliteBadges] = useState<PlayerBadgeInfo[]>([]);
  const [atpRanking, setAtpRanking] = useState<AtpEntry[]>([]);
  const [activeBadges, setActiveBadges] = useState<{ player_id: string; badge_code: string }[]>([]);
  const [narratives, setNarratives] = useState<string[]>([]);
  const [achievableBadges, setAchievableBadges] = useState<string[]>([]);
  const [gameTier, setGameTier] = useState<string>("250");

  const players = game.players;
  const buyIn = players.length > 0 ? players[0].initial_buyin : 100;
  const estimatedPot = buyIn * players.length;
  const ids = players.map((p) => p.player.id);

  useEffect(() => {
    if (players.length === 0) return;

    const fetchAll = async () => {
      // Parallel fetches
      const [extrasRes, badgesRes, atpRes, allBadgesRes] = await Promise.all([
        supabase.from("players").select("id, skill_score, archetype").in("id", ids),
        supabase
          .from("player_badges")
          .select("player_id, badge_code, badge_definitions!inner(emoji)")
          .in("player_id", ids)
          .eq("is_active", true)
          .in("badge_code", ["cabeca_chave", "podio", "craque_rodada"]),
        supabase.from("atp_ranking").select("id, score_atp, name").order("score_atp", { ascending: false }),
        supabase
          .from("player_badges")
          .select("player_id, badge_code")
          .in("player_id", ids)
          .eq("is_active", true),
      ]);

      if (extrasRes.data) setPlayerExtras(extrasRes.data);
      if (atpRes.data) setAtpRanking(atpRes.data as AtpEntry[]);
      if (badgesRes.data) {
        setEliteBadges(
          (badgesRes.data as any[]).map((b) => ({
            player_id: b.player_id,
            badge_code: b.badge_code,
            emoji: b.badge_definitions?.emoji || "",
          }))
        );
      }
      if (allBadgesRes.data) {
        setActiveBadges(allBadgesRes.data as { player_id: string; badge_code: string }[]);
      }

      // Build narratives and achievable badges after data is available
      const extras = extrasRes.data || [];
      const allBadges = (allBadgesRes.data || []) as { player_id: string; badge_code: string }[];
      const atp = (atpRes.data || []) as AtpEntry[];

      // Calculate tier based on mesa skill vs historical percentiles
      await calculateGameTier(extras);

      await buildNarratives(extras, allBadges, atp);
      await buildAchievableBadges(extras, allBadges);
    };

    fetchAll();
  }, [players.length, ids.join(",")]);

  const calculateGameTier = async (extras: PlayerExtra[]) => {
    // If game is Grand Slam, set it directly
    if (game.is_grand_slam) {
      setGameTier("grand_slam");
      return;
    }

    const mesaSkills = extras
      .filter((e) => ids.includes(e.id))
      .map((e) => e.skill_score || DEFAULT_SKILL);
    const sosMesa = mesaSkills.reduce((a, b) => a + b, 0) / (mesaSkills.length || 1);

    // Fetch historical avg skill per completed game
    const { data: completedGames } = await supabase
      .from("games")
      .select("id")
      .eq("status", "completed")
      .limit(200);

    if (!completedGames || completedGames.length === 0) {
      setGameTier("250");
      return;
    }

    const gameIds = completedGames.map((g) => g.id);
    const { data: gpData } = await supabase
      .from("game_players")
      .select("game_id, player_id")
      .in("game_id", gameIds);

    const { data: allPlayers } = await supabase
      .from("players")
      .select("id, skill_score");

    if (!gpData || !allPlayers) {
      setGameTier("250");
      return;
    }

    const skillMap = new Map(allPlayers.map((p) => [p.id, p.skill_score || DEFAULT_SKILL]));
    const gameAvgs: number[] = [];
    const byGame = new Map<string, string[]>();
    gpData.forEach((gp) => {
      if (!byGame.has(gp.game_id!)) byGame.set(gp.game_id!, []);
      byGame.get(gp.game_id!)!.push(gp.player_id!);
    });
    byGame.forEach((pids) => {
      const avg = pids.reduce((s, pid) => s + (skillMap.get(pid) || DEFAULT_SKILL), 0) / pids.length;
      gameAvgs.push(avg);
    });

    // Sort to find percentiles
    gameAvgs.sort((a, b) => a - b);
    const p50 = gameAvgs[Math.floor(gameAvgs.length * 0.50)] || 0;
    const p85 = gameAvgs[Math.floor(gameAvgs.length * 0.85)] || 0;

    if (sosMesa > p85) {
      setGameTier("1000");
    } else if (sosMesa > p50) {
      setGameTier("500");
    } else {
      setGameTier("250");
    }
  };

  const buildNarratives = async (
    extras: PlayerExtra[],
    allBadges: { player_id: string; badge_code: string }[],
    atp: AtpEntry[]
  ) => {
    const result: string[] = [];

    // Priority 1: trem_bala active (3+ win streak)
    for (const p of players) {
      const hasBadge = allBadges.some(
        (b) => b.player_id === p.player.id && b.badge_code === "trem_bala"
      );
      if (hasBadge) {
        result.push(`🚄 ${p.player.name} vem em sequência de vitórias`);
        if (result.length >= 2) break;
      }
    }

    // Priority 2: espiral active (3+ loss streak)
    if (result.length < 2) {
      for (const p of players) {
        const hasBadge = allBadges.some(
          (b) => b.player_id === p.player.id && b.badge_code === "espiral"
        );
        if (hasBadge) {
          result.push(`🌀 ${p.player.name} busca quebrar sequência de derrotas`);
          if (result.length >= 2) break;
        }
      }
    }

    // Priority 3: 2+ fenix archetypes
    if (result.length < 2) {
      const fenixCount = extras.filter((e) =>
        ids.includes(e.id) && e.archetype === "fenix"
      ).length;
      if (fenixCount >= 2) {
        result.push(`🔥 ${fenixCount} Fênix na mesa — noite promete ser longa`);
      }
    }

    // Priority 4: foguete active
    if (result.length < 2) {
      for (const p of players) {
        const hasBadge = allBadges.some(
          (b) => b.player_id === p.player.id && b.badge_code === "foguete"
        );
        if (hasBadge) {
          result.push(`🚀 ${p.player.name} em ascensão no ranking`);
          if (result.length >= 2) break;
        }
      }
    }

    // Priority 5: Mesa forte (avg skill above historical avg * 1.10)
    if (result.length < 2) {
      const mesaSkills = extras
        .filter((e) => ids.includes(e.id))
        .map((e) => e.skill_score || DEFAULT_SKILL);
      const sosMesa = mesaSkills.reduce((a, b) => a + b, 0) / (mesaSkills.length || 1);

      // Fetch historical average
      const { data: completedGames } = await supabase
        .from("games")
        .select("id")
        .eq("status", "completed")
        .limit(100);

      if (completedGames && completedGames.length > 0) {
        const gameIds = completedGames.map((g) => g.id);
        const { data: gpData } = await supabase
          .from("game_players")
          .select("game_id, player_id")
          .in("game_id", gameIds);

        if (gpData && gpData.length > 0) {
          const { data: allPlayers } = await supabase
            .from("players")
            .select("id, skill_score");

          if (allPlayers) {
            const skillMap = new Map(allPlayers.map((p) => [p.id, p.skill_score || DEFAULT_SKILL]));
            const gameAvgs: number[] = [];
            const byGame = new Map<string, string[]>();
            gpData.forEach((gp) => {
              if (!byGame.has(gp.game_id!)) byGame.set(gp.game_id!, []);
              byGame.get(gp.game_id!)!.push(gp.player_id!);
            });
            byGame.forEach((pids) => {
              const avg = pids.reduce((s, pid) => s + (skillMap.get(pid) || DEFAULT_SKILL), 0) / pids.length;
              gameAvgs.push(avg);
            });
            const sosHistorico = gameAvgs.reduce((a, b) => a + b, 0) / (gameAvgs.length || 1);
            if (sosMesa > sosHistorico * 1.1) {
              result.push("💪 Mesa forte — pontos ATP valerão mais hoje");
            }
          }
        }
      }
    }

    // Priority 6: Win rate = 0% against composition
    if (result.length < 2) {
      for (const p of players) {
        const otherIds = ids.filter((id) => id !== p.player.id);
        if (otherIds.length === 0) continue;

        // Games where this player participated
        const { data: playerGames } = await supabase
          .from("game_players")
          .select("game_id")
          .eq("player_id", p.player.id);

        if (playerGames && playerGames.length >= 3) {
          const playerGameIds = playerGames.map((g) => g.game_id!);

          // Games where at least one other player also participated
          const { data: sharedGames } = await supabase
            .from("game_players")
            .select("game_id")
            .in("game_id", playerGameIds)
            .in("player_id", otherIds);

          if (sharedGames) {
            const sharedGameIds = [...new Set(sharedGames.map((g) => g.game_id!))];
            if (sharedGameIds.length >= 3) {
              // Check wins (position 1 = lowest final_result rank or highest final_result)
              const { data: results } = await supabase
                .from("game_players")
                .select("game_id, player_id, final_result")
                .in("game_id", sharedGameIds)
                .not("final_result", "is", null);

              if (results) {
                const gameResults = new Map<string, { player_id: string; final_result: number }[]>();
                results.forEach((r) => {
                  if (!gameResults.has(r.game_id!)) gameResults.set(r.game_id!, []);
                  gameResults.get(r.game_id!)!.push({
                    player_id: r.player_id!,
                    final_result: r.final_result!,
                  });
                });

                let wins = 0;
                let total = 0;
                gameResults.forEach((grs) => {
                  const sorted = [...grs].sort((a, b) => b.final_result - a.final_result);
                  if (sorted[0]?.player_id === p.player.id) wins++;
                  total++;
                });

                if (wins === 0 && total >= 3) {
                  result.push(`👀 ${p.player.name} ainda não venceu com essa composição`);
                  if (result.length >= 2) break;
                }
              }
            }
          }
        }
      }
    }

    // Priority 7: 50%+ sangradores
    if (result.length < 2) {
      const sangradorCount = extras.filter(
        (e) => ids.includes(e.id) && e.archetype === "sangrador"
      ).length;
      if (sangradorCount > players.length / 2) {
        result.push(
          `⚠️ ${sangradorCount} Sangradores na mesa — expectativa de rebuys acima da média`
        );
      }
    }

    setNarratives(result.slice(0, 2));
  };

  const buildAchievableBadges = async (
    extras: PlayerExtra[],
    allBadges: { player_id: string; badge_code: string }[]
  ) => {
    const result: string[] = [];

    // Priority 1: Sniper — anyone hasn't won without rebuy in last 10 games
    // Simplified: badge "sniper" not active for any player = opportunity
    const anySniper = allBadges.some(
      (b) => ids.includes(b.player_id) && b.badge_code === "sniper"
    );
    if (!anySniper) {
      result.push("🎯 Sniper disponível — vença sem rebuyar");
    }

    // Priority 2: Career milestone (frequentador / da_casa / lenda)
    if (result.length < 3) {
      const { data: completedGames } = await supabase
        .from("games")
        .select("id")
        .eq("status", "completed");

      const totalGrupo = completedGames?.length || 0;
      if (totalGrupo > 0) {
        const milestones = [
          { pct: 0.2, label: "Frequentador" },
          { pct: 0.4, label: "Da Casa" },
          { pct: 0.8, label: "Lenda" },
        ];

        for (const p of players) {
          const { count } = await supabase
            .from("game_players")
            .select("id", { count: "exact", head: true })
            .eq("player_id", p.player.id);

          const nJogos = count || 0;
          for (const m of milestones) {
            const marco = Math.ceil(totalGrupo * m.pct);
            if (marco > nJogos && marco - nJogos === 1) {
              result.push(
                `🎖️ ${p.player.name} joga seu ${nJogos + 1}º jogo — a um passo de ${m.label}`
              );
              break;
            }
          }
          if (result.length >= 3) break;
        }
      }
    }

    // Priority 3: espiral active → Ave das Cinzas opportunity
    if (result.length < 3) {
      for (const p of players) {
        const hasEspiral = allBadges.some(
          (b) => b.player_id === p.player.id && b.badge_code === "espiral"
        );
        if (hasEspiral) {
          result.push(`⚡ Ave das Cinzas disponível para ${p.player.name}`);
          if (result.length >= 3) break;
        }
      }
    }

    // Priority 4: Zebra — underdog with positive delta
    if (result.length < 3) {
      const skillScores = extras
        .filter((e) => ids.includes(e.id))
        .map((e) => ({ id: e.id, skill: e.skill_score || DEFAULT_SKILL }));

      if (skillScores.length > 0) {
        const avgSkill = skillScores.reduce((s, p) => s + p.skill, 0) / skillScores.length;
        const underdog = skillScores.find((p) => p.skill < avgSkill * 0.8);
        if (underdog) {
          const playerName = players.find((p) => p.player.id === underdog.id)?.player.name;
          if (playerName) {
            result.push(`🦓 Zebra pode aparecer — ${playerName} é o azarão da noite`);
          }
        }
      }
    }

    // Priority 5: Regicida fallback
    if (result.length < 3) {
      result.push("👑 Regicida disponível — derrube o favorito");
    }

    setAchievableBadges(result.slice(0, 3));
  };

  // Helpers
  const getExtra = (playerId: string) => playerExtras.find((p) => p.id === playerId);
  const getEliteBadge = (playerId: string) => eliteBadges.find((b) => b.player_id === playerId);

  const getAtpPosition = (playerId: string) => {
    const idx = atpRanking.findIndex((r) => r.id === playerId);
    return idx >= 0 ? idx + 1 : null;
  };

  const getSkill = (playerId: string) => {
    const extra = getExtra(playerId);
    return extra?.skill_score || DEFAULT_SKILL;
  };

  const totalSkill = ids.reduce((sum, id) => sum + getSkill(id), 0);

  const getSkillShare = (playerId: string) => {
    if (totalSkill === 0) return 0;
    return (getSkill(playerId) / totalSkill) * 100;
  };

  const sortedBySkill = [...players].sort(
    (a, b) => getSkillShare(b.player.id) - getSkillShare(a.player.id)
  );
  const favorite = sortedBySkill[0];
  const favoriteShare = favorite ? getSkillShare(favorite.player.id) : 0;

  const enoughPlayers = players.length >= 3;

  return (
    <div className="space-y-4">
      {/* Player Arena */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Jogadores Confirmados
              <Badge variant="secondary" className="text-xs">
                {players.length}
              </Badge>
            </CardTitle>
            <Button variant="outline" size="sm" onClick={onAddPlayer} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {players.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhum jogador adicionado ainda</p>
              <Button variant="ghost" size="sm" className="mt-2" onClick={onAddPlayer}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Adicionar primeiro jogador
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedBySkill.map((gp, index) => {
                const extra = getExtra(gp.player.id);
                const elite = getEliteBadge(gp.player.id);
                const arch = extra?.archetype ? archetypeLabels[extra.archetype] : null;
                const skillShare = getSkillShare(gp.player.id);
                const atpPos = getAtpPosition(gp.player.id);

                return (
                  <motion.div
                    key={gp.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06, duration: 0.3 }}
                  >
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors group">
                      <Link to={`/players/${gp.player.id}`} className="shrink-0">
                        <div className="relative">
                          <PlayerAvatar
                            name={gp.player.name}
                            avatarUrl={gp.player.avatar_url}
                            size={48}
                          />
                          {elite && (
                            <span className="absolute -top-1 -right-1 text-sm">
                              {elite.emoji}
                            </span>
                          )}
                        </div>
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/players/${gp.player.id}`}
                            className="font-semibold text-sm text-foreground truncate hover:underline"
                          >
                            {gp.player.name}
                          </Link>
                          {arch && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {arch.emoji} {arch.label}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs font-medium text-primary tabular-nums">
                            {skillShare.toFixed(1)}%
                          </span>
                          {atpPos && (
                            <span className="text-xs text-muted-foreground">
                              #{atpPos} ATP
                            </span>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => onRemovePlayer(gp.id)}
                      >
                        <span className="text-lg">×</span>
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pot Preview & ATP Tier */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-border/50 bg-card/50 h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
              <DollarSign className="h-5 w-5 text-primary mb-1" />
              <p className="text-xs text-muted-foreground">Pot Estimado</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                R$ {estimatedPot}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {players.length} × R$ {buyIn}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className={`border-border/50 h-full ${
            gameTier === "grand_slam" ? "bg-amber-500/10 border-amber-500/30" :
            gameTier === "1000" ? "bg-purple-500/10 border-purple-500/30" :
            gameTier === "500" ? "bg-blue-500/10 border-blue-500/30" :
            "bg-emerald-500/10 border-emerald-500/30"
          }`}>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
              <Trophy className={`h-5 w-5 mb-1 ${
                gameTier === "grand_slam" ? "text-amber-500" :
                gameTier === "1000" ? "text-purple-500" :
                gameTier === "500" ? "text-blue-500" :
                "text-emerald-500"
              }`} />
              <p className="text-xs text-muted-foreground">Nível ATP</p>
              <p className={`text-lg font-bold mt-1 ${
                gameTier === "grand_slam" ? "text-amber-500" :
                gameTier === "1000" ? "text-purple-500" :
                gameTier === "500" ? "text-blue-500" :
                "text-emerald-500"
              }`}>
                {gameTier === "grand_slam" ? "🏆 Grand Slam" : `ATP ${gameTier}`}
              </p>
              <div className="text-xs text-muted-foreground mt-1.5 space-y-0.5">
                {(() => {
                  const tierKey = gameTier === "grand_slam" ? "grand_slam" : gameTier;
                  const pts: Record<string, number[]> = {
                    "250": [250, 150, 100, 60, 30],
                    "500": [500, 300, 200, 120, 60],
                    "1000": [1000, 600, 400, 240, 120],
                    "grand_slam": [2000, 1200, 800, 480, 240],
                  };
                  const p = pts[tierKey] || pts["250"];
                  const maxToShow = Math.min(players.length, 5);
                  return (
                    <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5">
                      {p.slice(0, maxToShow).map((v, i) => (
                        <span key={i} className="tabular-nums">
                          {i + 1}º:{v}
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Confrontation Panel */}
      {players.length >= 2 && totalSkill > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Swords className="h-4 w-4 text-primary" />
                Probabilidades Pré-Jogo
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2.5">
              {sortedBySkill.map((gp) => {
                const share = getSkillShare(gp.player.id);
                const isFav = gp.id === favorite?.id;
                return (
                  <div key={gp.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <PlayerAvatar
                          name={gp.player.name}
                          avatarUrl={gp.player.avatar_url}
                          size={24}
                        />
                        <span className="truncate font-medium text-foreground">
                          {gp.player.name}
                        </span>
                        {isFav && <Crown className="h-3 w-3 text-amber-500 shrink-0" />}
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                        {share.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${isFav ? "bg-amber-500" : "bg-primary/60"}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${share}%` }}
                        transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Narratives — only with 3+ players */}
      {enoughPlayers && narratives.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Pré-Jogo
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {narratives.map((text, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="text-sm text-muted-foreground bg-secondary/40 rounded-lg px-3 py-2.5"
                >
                  {text}
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Achievable Badges — only with 3+ players */}
      {enoughPlayers && achievableBadges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Em Jogo Hoje
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {achievableBadges.map((text, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="text-sm text-muted-foreground bg-secondary/40 rounded-lg px-3 py-2.5"
                >
                  {text}
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};
