
import { ScrollArea } from "@/components/ui/scroll-area";
import { LeaderboardEntry, RankingType } from "@/types/leaderboard";
import { LeaderboardCard } from "./LeaderboardCard";

interface LeaderboardRankingsProps {
  leaderboard: LeaderboardEntry[];
  rankingType: RankingType;
}

export const LeaderboardRankings = ({ leaderboard, rankingType }: LeaderboardRankingsProps) => {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Rankings</h2>
      <ScrollArea className="h-[calc(100vh-500px)]">
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
