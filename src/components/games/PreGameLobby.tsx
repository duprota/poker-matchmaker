import { Game, GamePlayer } from "@/types/game";
import { PlayerAvatar } from "@/components/games/summary/PlayerAvatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, DollarSign, TrendingUp, Swords, Crown } from "lucide-react";
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

interface PlayerBadge {
  player_id: string;
  badge_code: string;
  emoji: string;
}

const archetypeLabels: Record<string, { label: string; emoji: string }> = {
  tubarao: { label: "Tubarão", emoji: "🦈" },
  estrategista: { label: "Estrategista", emoji: "🧠" },
  fenix: { label: "Fênix", emoji: "🔥" },
  sangrador: { label: "Sangrador", emoji: "🩸" },
  novato: { label: "Novato", emoji: "🌱" },
};

export const PreGameLobby = ({ game, onAddPlayer, onRemovePlayer }: PreGameLobbyProps) => {
  const [playerExtras, setPlayerExtras] = useState<PlayerExtra[]>([]);
  const [eliteBadges, setEliteBadges] = useState<PlayerBadge[]>([]);

  const players = game.players;
  const buyIn = players.length > 0 ? players[0].initial_buyin : 100;
  const estimatedPot = buyIn * players.length;

  useEffect(() => {
    if (players.length === 0) return;
    const ids = players.map((p) => p.player.id);

    const fetchExtras = async () => {
      const { data } = await supabase
        .from("players")
        .select("id, skill_score, archetype")
        .in("id", ids);
      if (data) setPlayerExtras(data);
    };

    const fetchBadges = async () => {
      const { data } = await supabase
        .from("player_badges")
        .select("player_id, badge_code, badge_definitions!inner(emoji)")
        .in("player_id", ids)
        .eq("is_active", true)
        .in("badge_code", ["cabeca_chave", "podio", "craque_rodada"]);
      if (data) {
        setEliteBadges(
          (data as any[]).map((b) => ({
            player_id: b.player_id,
            badge_code: b.badge_code,
            emoji: b.badge_definitions?.emoji || "",
          }))
        );
      }
    };

    fetchExtras();
    fetchBadges();
  }, [players]);

  const getExtra = (playerId: string) =>
    playerExtras.find((p) => p.id === playerId);

  const getEliteBadge = (playerId: string) =>
    eliteBadges.find((b) => b.player_id === playerId);

  // Skill share calculation
  const totalSkill = playerExtras.reduce(
    (sum, p) => sum + (p.skill_score || 0),
    0
  );

  const getSkillShare = (playerId: string) => {
    const extra = getExtra(playerId);
    if (!extra?.skill_score || totalSkill === 0) return 0;
    return (extra.skill_score / totalSkill) * 100;
  };

  // Sort by skill share descending for the confrontation panel
  const sortedBySkill = [...players].sort(
    (a, b) => getSkillShare(b.player.id) - getSkillShare(a.player.id)
  );

  const favorite = sortedBySkill[0];
  const favoriteShare = favorite ? getSkillShare(favorite.player.id) : 0;

  return (
    <div className="space-y-6">
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
            <Button
              variant="outline"
              size="sm"
              onClick={onAddPlayer}
              className="gap-1.5"
            >
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
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={onAddPlayer}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Adicionar primeiro jogador
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {players.map((gp, index) => {
                const extra = getExtra(gp.player.id);
                const elite = getEliteBadge(gp.player.id);
                const arch = extra?.archetype
                  ? archetypeLabels[extra.archetype]
                  : null;
                const skillShare = getSkillShare(gp.player.id);

                return (
                  <motion.div
                    key={gp.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06, duration: 0.3 }}
                  >
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors group">
                      {/* Avatar */}
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

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/players/${gp.player.id}`}
                            className="font-semibold text-sm text-foreground truncate hover:underline"
                          >
                            {gp.player.name}
                          </Link>
                          {arch && (
                            <span className="text-xs text-muted-foreground">
                              {arch.emoji}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          {extra?.skill_score != null && (
                            <span className="text-xs text-muted-foreground">
                              Skill {extra.skill_score.toFixed(0)}
                            </span>
                          )}
                          {players.length >= 2 && skillShare > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {skillShare.toFixed(0)}% share
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Remove button */}
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

      {/* Pot Preview & Favorite — side by side on wider screens, stacked on mobile */}
      <div className="grid grid-cols-2 gap-3">
        {/* Pot Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-border/50 bg-card/50 h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
              <DollarSign className="h-5 w-5 text-green-500 mb-1" />
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

        {/* Favorite */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50 bg-card/50 h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
              <Crown className="h-5 w-5 text-amber-500 mb-1" />
              <p className="text-xs text-muted-foreground">Favorito</p>
              {favorite && favoriteShare > 0 ? (
                <>
                  <div className="mt-1.5">
                    <PlayerAvatar
                      name={favorite.player.name}
                      avatarUrl={favorite.player.avatar_url}
                      size={36}
                    />
                  </div>
                  <p className="text-sm font-semibold text-foreground mt-1 truncate max-w-full">
                    {favorite.player.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {favoriteShare.toFixed(0)}% skill share
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">
                  {players.length < 2 ? "Adicione jogadores" : "—"}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Confrontation Panel — Skill Share Bars */}
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
                        {isFav && (
                          <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                        {share.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          isFav
                            ? "bg-amber-500"
                            : "bg-primary/60"
                        }`}
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
    </div>
  );
};
