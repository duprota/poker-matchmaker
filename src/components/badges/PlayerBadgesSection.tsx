import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { Link } from "react-router-dom";

interface BadgeWithDef {
  id: string;
  badge_code: string;
  game_id: string | null;
  is_active: boolean;
  conquered_at: string;
  lost_at: string | null;
  metadata: any;
  name: string;
  emoji: string;
  category: string;
  persistence: string;
  description: string;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  partida_unica: { label: "Partida Única", icon: "🎯" },
  sequencia: { label: "Sequências", icon: "📈" },
  marco: { label: "Marcos de Carreira", icon: "🏆" },
  comportamento: { label: "Comportamento", icon: "🧠" },
  elite: { label: "Elite / Ranking", icon: "👑" },
};

export const PlayerBadgesSection = ({ playerId, isOwner = false }: { playerId: string; isOwner?: boolean }) => {
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithDef | null>(null);

  const { data: badges, isLoading } = useQuery({
    queryKey: ["player-badges", playerId],
    queryFn: async () => {
      const { data: playerBadges, error } = await supabase
        .from("player_badges" as any)
        .select("*")
        .eq("player_id", playerId);

      if (error) throw error;

      const { data: definitions } = await supabase
        .from("badge_definitions" as any)
        .select("*");

      const defMap = new Map((definitions || []).map((d: any) => [d.code, d]));

      return (playerBadges || []).map((pb: any) => {
        const def = defMap.get(pb.badge_code) || {};
        return {
          ...pb,
          name: (def as any).name || pb.badge_code,
          emoji: (def as any).emoji || "🏅",
          category: (def as any).category || "unknown",
          persistence: (def as any).persistence || "permanent",
          description: (def as any).description || "",
        } as BadgeWithDef;
      });
    },
  });

  if (isLoading) return null;
  if (!badges || badges.length === 0) return null;

  const activeBadges = badges.filter((b) => b.is_active);
  const inactiveBadges = badges.filter((b) => !b.is_active);

  // Group active badges by category
  const grouped = new Map<string, BadgeWithDef[]>();
  for (const b of activeBadges) {
    const list = grouped.get(b.category) || [];
    list.push(b);
    grouped.set(b.category, list);
  }

  // Count unique badge codes (for permanent with multiple occurrences)
  const badgeCounts = new Map<string, number>();
  for (const b of activeBadges) {
    badgeCounts.set(b.badge_code, (badgeCounts.get(b.badge_code) || 0) + 1);
  }

  const uniqueActive = new Set(activeBadges.map((b) => b.badge_code)).size;
  const uniqueAll = new Set(badges.map((b) => b.badge_code)).size;

  // Deduplicate for display (show each badge_code once with count)
  const displayBadges = new Map<string, BadgeWithDef & { count: number }>();
  for (const b of activeBadges) {
    if (!displayBadges.has(b.badge_code)) {
      displayBadges.set(b.badge_code, { ...b, count: badgeCounts.get(b.badge_code) || 1 });
    }
  }

  const categoryOrder = ["partida_unica", "sequencia", "marco", "comportamento", "elite"];

  return (
    <Card className="p-3 mt-3 bg-card/80 backdrop-blur-sm border-border/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">🏅 Badges</span>
        <span className="text-[10px] text-muted-foreground">
          {uniqueActive} ativas · {uniqueAll} conquistadas
        </span>
      </div>

      {categoryOrder.map((cat) => {
        const catBadges = Array.from(displayBadges.values()).filter((b) => b.category === cat);
        if (catBadges.length === 0) return null;
        const catInfo = CATEGORY_LABELS[cat];

        return (
          <div key={cat} className="mb-2">
            <p className="text-[10px] text-muted-foreground mb-1">
              {catInfo?.icon} {catInfo?.label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {catBadges.map((b) => (
                <button
                  key={b.badge_code}
                  onClick={() => setSelectedBadge(b)}
                  className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors text-xs"
                  title={b.name}
                >
                  <span>{b.emoji}</span>
                  <span className="font-medium text-foreground">{b.name}</span>
                  {b.count > 1 && (
                    <span className="text-[10px] text-primary font-bold">×{b.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* Inactive badges (owner only) */}
      {isOwner && inactiveBadges.length > 0 && (
        <div className="mt-3 pt-2 border-t border-border/30">
          <p className="text-[10px] text-muted-foreground mb-1">Badges perdidas</p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(new Set(inactiveBadges.map((b) => b.badge_code))).map((code) => {
              const b = inactiveBadges.find((x) => x.badge_code === code)!;
              return (
                <button
                  key={code}
                  onClick={() => setSelectedBadge(b)}
                  className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-muted/50 text-muted-foreground text-xs opacity-50"
                  title={b.name}
                >
                  <span className="grayscale">{b.emoji}</span>
                  <span>{b.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Badge detail modal */}
      <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedBadge?.emoji}</span>
              {selectedBadge?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{selectedBadge?.description}</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                Conquistada em:{" "}
                {selectedBadge?.conquered_at
                  ? new Date(selectedBadge.conquered_at).toLocaleDateString("pt-BR")
                  : "—"}
              </p>
              {selectedBadge?.lost_at && (
                <p>
                  Perdida em:{" "}
                  {new Date(selectedBadge.lost_at).toLocaleDateString("pt-BR")}
                </p>
              )}
              {selectedBadge?.game_id && (
                <Link
                  to={`/games/${selectedBadge.game_id}`}
                  className="text-primary hover:underline inline-block mt-1"
                >
                  Ver jogo →
                </Link>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
