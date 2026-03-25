import { Gamepad2, TrendingUp, Target, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { PlayerStats } from "@/hooks/usePlayerStats";

interface PlayerKPICardsProps {
  stats: PlayerStats;
}

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const PlayerKPICards = ({ stats }: PlayerKPICardsProps) => {
  const kpis = [
    {
      icon: Gamepad2,
      label: "Jogos",
      value: String(stats.gamesPlayed),
      color: "text-primary",
    },
    {
      icon: TrendingUp,
      label: "Saldo",
      value: formatCurrency(stats.netEarnings),
      color: stats.netEarnings >= 0 ? "text-emerald-500" : "text-destructive",
    },
    {
      icon: Target,
      label: "ROI",
      value: `${stats.roi.toFixed(1)}%`,
      color: stats.roi >= 0 ? "text-emerald-500" : "text-destructive",
    },
    {
      icon: Trophy,
      label: "Melhor jogo",
      value: formatCurrency(stats.bestGame),
      color: stats.bestGame >= 0 ? "text-emerald-500" : "text-destructive",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {kpis.map((kpi) => (
        <Card
          key={kpi.label}
          className="p-3 bg-card/80 backdrop-blur-sm border-border/50"
        >
          <div className="flex items-center gap-2 mb-1">
            <kpi.icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{kpi.label}</span>
          </div>
          <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
        </Card>
      ))}
    </div>
  );
};
