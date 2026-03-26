
import { ScrollArea } from "@/components/ui/scroll-area";
import { LeaderboardEntry, RankingType } from "@/types/leaderboard";
import { LeaderboardCard } from "./LeaderboardCard";
import { Info } from "lucide-react";
import { Link } from "react-router-dom";

interface LeaderboardRankingsProps {
  leaderboard: LeaderboardEntry[];
  rankingType: RankingType;
}

export const LeaderboardRankings = ({ leaderboard, rankingType }: LeaderboardRankingsProps) => {
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
      <ScrollArea className="h-[calc(100vh-320px)]">
        {leaderboard?.map((entry, index) => (
          <LeaderboardCard 
            key={entry.player_name} 
            entry={entry} 
            position={index + 1}
            rankingType={rankingType}
          />
        ))}
      </ScrollArea>
    </div>
  );
};
