import { Navigation } from "@/components/Navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { LeaderboardEntry, RankingType } from "@/types/leaderboard";
import { LeaderboardHeader } from "@/components/leaderboard/LeaderboardHeader";
import { LeaderboardCard } from "@/components/leaderboard/LeaderboardCard";
import { LeaderboardShare } from "@/components/leaderboard/LeaderboardShare";

const calculateROI = (winnings: number, spent: number) => {
  if (spent === 0) return 0;
  return ((winnings - spent) / spent) * 100;
};

const fetchLeaderboardData = async (): Promise<LeaderboardEntry[]> => {
  console.log("Fetching leaderboard data...");
  
  const { data, error } = await supabase
    .from('game_players')
    .select(`
      player:players(name),
      game:games(id, date),
      final_result,
      initial_buyin,
      total_rebuys
    `)
    .not('final_result', 'is', null);

  if (error) {
    console.error("Error fetching leaderboard data:", error);
    throw error;
  }

  const playerStats = data.reduce((acc: { [key: string]: LeaderboardEntry }, entry) => {
    const playerName = entry.player.name;
    const spent = entry.initial_buyin * (1 + entry.total_rebuys);
    const result = entry.final_result || 0;
    const gameRoi = calculateROI(result, spent);
    const netEarnings = result - spent;
    
    if (!acc[playerName]) {
      acc[playerName] = {
        player_name: playerName,
        games_played: 0,
        total_winnings: 0,
        total_spent: 0,
        biggest_win: 0,
        roi_percentage: 0,
        average_roi: 0,
        best_game_roi: -Infinity,
        worst_game_roi: Infinity,
        average_winnings: 0,
        net_earnings: 0,
        average_net_earnings: 0
      };
    }

    acc[playerName].games_played += 1;
    acc[playerName].total_winnings += result;
    acc[playerName].total_spent += spent;
    acc[playerName].net_earnings += netEarnings;
    acc[playerName].biggest_win = Math.max(acc[playerName].biggest_win, netEarnings);
    acc[playerName].best_game_roi = Math.max(acc[playerName].best_game_roi, gameRoi);
    acc[playerName].worst_game_roi = Math.min(acc[playerName].worst_game_roi, gameRoi);

    return acc;
  }, {});

  // Calculate final ROI percentages and averages
  Object.values(playerStats).forEach(player => {
    player.roi_percentage = calculateROI(player.total_winnings, player.total_spent);
    player.average_roi = player.roi_percentage / player.games_played;
    player.average_winnings = player.total_winnings / player.games_played;
    player.average_net_earnings = player.net_earnings / player.games_played;
  });

  return Object.values(playerStats);
};

const Leaderboard = () => {
  const [timeFilter, setTimeFilter] = useState("All Time");
  const [rankingType, setRankingType] = useState<RankingType>("total");
  
  const { data: leaderboard, isLoading, error } = useQuery({
    queryKey: ['leaderboard', timeFilter],
    queryFn: fetchLeaderboardData,
  });

  const sortedLeaderboard = leaderboard?.sort((a, b) => 
    rankingType === "total" 
      ? b.net_earnings - a.net_earnings
      : b.average_net_earnings - a.average_net_earnings
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-muted">
        <Navigation />
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-6">
            2024 Leaderboard
          </h1>
          <div className="text-center py-8">Loading leaderboard data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-muted">
        <Navigation />
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-6">
            2024 Leaderboard
          </h1>
          <div className="text-center py-8 text-destructive">
            Error loading leaderboard data. Please try again later.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-muted">
      <Navigation />
      <div className="container mx-auto py-8">
        <LeaderboardHeader
          timeFilter={timeFilter}
          onTimeFilterChange={setTimeFilter}
          rankingType={rankingType}
          onRankingTypeChange={setRankingType}
        />
        
        <ScrollArea className="h-[calc(100vh-320px)]">
          {sortedLeaderboard?.map((entry, index) => (
            <LeaderboardCard 
              key={entry.player_name} 
              entry={entry} 
              position={index + 1}
              rankingType={rankingType}
            />
          ))}
        </ScrollArea>

        {sortedLeaderboard && (
          <LeaderboardShare
            leaderboard={sortedLeaderboard}
            timeFilter={timeFilter}
            rankingType={rankingType}
          />
        )}
      </div>
    </div>
  );
};

export default Leaderboard;