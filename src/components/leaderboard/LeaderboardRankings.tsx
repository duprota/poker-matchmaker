
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LeaderboardEntry, RankingType, ArchetypeType } from "@/types/leaderboard";
import { LeaderboardCard } from "./LeaderboardCard";
import { Info } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const ARCHETYPE_FILTERS: { value: ArchetypeType | "all"; label: string; icon: string }[] = [
  { value: "all", label: "Todos", icon: "👥" },
  { value: "sniper", label: "Sniper", icon: "🎯" },
  { value: "fenix", label: "Fênix", icon: "🔥" },
  { value: "sangrador", label: "Sangrador", icon: "🩸" },
  { value: "rocha", label: "Rocha", icon: "🧊" },
];

interface LeaderboardRankingsProps {
  leaderboard: LeaderboardEntry[];
  rankingType: RankingType;
}

export const LeaderboardRankings = ({ leaderboard, rankingType }: LeaderboardRankingsProps) => {
  const [archetypeFilter, setArchetypeFilter] = useState<ArchetypeType | "all">("all");

  const filtered = archetypeFilter === "all"
    ? leaderboard
    : leaderboard.filter((e) => e.archetype === archetypeFilter);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Rankings</h2>
        <Link
          to="/ranking-info"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          Saiba mais
        </Link>
      </div>

      {/* Archetype filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
        {ARCHETYPE_FILTERS.map((f) => (
          <button
            key={f.value ?? "all"}
            onClick={() => setArchetypeFilter(f.value)}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all",
              archetypeFilter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-card hover:bg-muted"
            )}
          >
            <span>{f.icon}</span>
            {f.label}
          </button>
        ))}
      </div>

      <ScrollArea className="h-[calc(100vh-400px)]">
        {filtered?.map((entry, index) => (
          <LeaderboardCard 
            key={entry.player_name} 
            entry={entry} 
            position={index + 1}
            rankingType={rankingType}
          />
        ))}
        {filtered?.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nenhum jogador com este arquétipo.
          </p>
        )}
      </ScrollArea>
    </div>
  );
};
