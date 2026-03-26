import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Archetype = "sniper" | "fenix" | "sangrador" | "rocha" | null;

const ARCHETYPE_CONFIG: Record<string, { icon: string; label: string; description: string; color: string }> = {
  sniper: {
    icon: "🎯",
    label: "Sniper",
    description: "Não precisa de segunda chance",
    color: "text-blue-400",
  },
  fenix: {
    icon: "🔥",
    label: "Fênix",
    description: "Rebuyar faz parte do estilo",
    color: "text-orange-400",
  },
  sangrador: {
    icon: "🩸",
    label: "Sangrador",
    description: "Quando começa a rebuyar, não volta",
    color: "text-red-400",
  },
  rocha: {
    icon: "🧊",
    label: "Rocha",
    description: "Raro rebuy, mas quando faz, recupera",
    color: "text-cyan-400",
  },
};

export function getArchetypeInfo(archetype: string | null | undefined) {
  if (!archetype || !ARCHETYPE_CONFIG[archetype]) return null;
  return ARCHETYPE_CONFIG[archetype];
}

interface BehavioralProfileCardProps {
  playerId: string;
  rebuyTendency: number | null;
  recoveryRate: number | null;
  archetype: string | null;
  gamesPlayed: number;
}

export const BehavioralProfileCard = ({
  playerId,
  rebuyTendency,
  recoveryRate,
  archetype,
  gamesPlayed,
}: BehavioralProfileCardProps) => {
  const minGames = 5;
  const isForming = gamesPlayed < minGames;
  const info = getArchetypeInfo(archetype);

  // Fetch last 10 games behavioral history
  const { data: history } = useQuery({
    queryKey: ["behavioral-history", playerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_players")
        .select("total_rebuys, final_result, initial_buyin, game_id, games!inner(date, status)")
        .eq("player_id", playerId)
        .eq("games.status", "completed")
        .not("final_result", "is", null)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      return (data || []).map((gp: any) => {
        const invested = gp.initial_buyin * (1 + gp.total_rebuys);
        const net = gp.final_result - invested;
        return {
          date: new Date(gp.games.date).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          }),
          rebuys: gp.total_rebuys,
          net,
        };
      });
    },
  });

  return (
    <Card className="p-3 mt-3 bg-card/80 backdrop-blur-sm border-border/50">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{isForming ? "📊" : (info?.icon || "📊")}</span>
        <span className="text-xs text-muted-foreground">Perfil Comportamental</span>
      </div>

      {isForming ? (
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Perfil em formação</p>
          <p className="text-xs text-muted-foreground">
            {minGames - gamesPlayed} {minGames - gamesPlayed === 1 ? "jogo restante" : "jogos restantes"} para classificação
          </p>
          <div className="w-full bg-muted rounded-full h-1.5 mt-1">
            <div
              className="bg-primary h-1.5 rounded-full transition-all"
              style={{ width: `${(gamesPlayed / minGames) * 100}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`text-xl font-bold ${info?.color || "text-foreground"}`}>
              {info?.label || "—"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground italic">
            "{info?.description}"
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground mt-1">
            <span>RT: <strong className="text-foreground">{rebuyTendency?.toFixed(2) ?? "—"}</strong></span>
            <span>RR: <strong className="text-foreground">
              {recoveryRate !== null && recoveryRate !== undefined ? `${recoveryRate.toFixed(1)}%` : "Sem dados"}
            </strong></span>
          </div>
        </div>
      )}

      {/* Behavioral history table */}
      {history && history.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground mb-1">Últimos jogos</p>
          <div className="max-h-48 overflow-auto rounded border border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-7 text-[10px] px-2">Data</TableHead>
                  <TableHead className="h-7 text-[10px] px-2 text-center">Rebuys</TableHead>
                  <TableHead className="h-7 text-[10px] px-2 text-right">Resultado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h, i) => (
                  <TableRow key={i} className="hover:bg-muted/30">
                    <TableCell className="py-1 px-2 text-xs">{h.date}</TableCell>
                    <TableCell className="py-1 px-2 text-xs text-center">{h.rebuys}</TableCell>
                    <TableCell className={`py-1 px-2 text-xs text-right font-medium ${h.net >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                      {h.net >= 0 ? "+" : ""}{h.net.toFixed(0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </Card>
  );
};
