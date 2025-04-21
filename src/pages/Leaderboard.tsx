import { Navigation } from "@/components/Navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LeaderboardEntry, RankingType } from "@/types/leaderboard";
import { LeaderboardHeader } from "@/components/leaderboard/LeaderboardHeader";
import { LeaderboardShare } from "@/components/leaderboard/LeaderboardShare";
import { LeaderboardRankings } from "@/components/leaderboard/LeaderboardRankings";
import { LeaderboardProgress } from "@/components/leaderboard/LeaderboardProgress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const calculateROI = (winnings: number, spent: number) => {
  if (spent === 0) return 0;
  return ((winnings - spent) / spent) * 100;
};

const calculateTotalSpecialHands = (specialHands: { [key: string]: number } = {}) => {
  return Object.values(specialHands).reduce((sum, count) => sum + count, 0);
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
      total_rebuys,
      special_hands
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
        average_net_earnings: 0,
        special_hands: {}
      };
    }

    if (entry.special_hands) {
      Object.entries(entry.special_hands as { [key: string]: number }).forEach(([handType, count]) => {
        if (!acc[playerName].special_hands![handType]) {
          acc[playerName].special_hands![handType] = 0;
        }
        acc[playerName].special_hands![handType] += count as number;
      });
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

  Object.values(playerStats).forEach(player => {
    player.roi_percentage = calculateROI(player.total_winnings, player.total_spent);
    player.average_roi = player.roi_percentage / player.games_played;
    player.average_winnings = player.total_winnings / player.games_played;
    player.average_net_earnings = player.net_earnings / player.games_played;
  });

  return Object.values(playerStats);
};

const fetchPlayerProgressData = async (leaderboardData: LeaderboardEntry[]) => {
  console.log("Processing player progress data from leaderboard data...");
  
  const { data: gamesData, error: gamesError } = await supabase
    .from('games')
    .select(`
      id,
      date,
      game_players:game_players(
        final_result,
        initial_buyin,
        total_rebuys,
        player:players(id, name)
      )
    `)
    .eq('status', 'completed')
    .order('date', { ascending: true });

  if (gamesError) {
    console.error("Error fetching games data:", gamesError);
    throw gamesError;
  }

  const playerProgressMap = new Map();
  
  leaderboardData.forEach(player => {
    playerProgressMap.set(player.player_name, {
      player_name: player.player_name,
      games_data: [],
      games_count: player.games_played
    });
  });
  
  gamesData.forEach(game => {
    const gameDate = game.date;
    const formattedDate = format(new Date(gameDate), 'yyyy-MM-dd');
    
    game.game_players.forEach((gamePlayer: any) => {
      if (!gamePlayer.final_result) return;

      const playerName = gamePlayer.player.name;
      
      if (!playerProgressMap.has(playerName)) return;
      
      const spent = gamePlayer.initial_buyin * (1 + gamePlayer.total_rebuys);
      const netEarnings = gamePlayer.final_result - spent;
      
      const playerData = playerProgressMap.get(playerName);
      playerData.games_data.push({
        game_id: game.id,
        game_date: formattedDate,
        net_earnings: netEarnings
      });
    });
  });

  for (const playerData of playerProgressMap.values()) {
    let runningTotal = 0;
    playerData.games_data = playerData.games_data
      .sort((a: any, b: any) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime())
      .map((gameData: any) => {
        runningTotal += gameData.net_earnings;
        return {
          ...gameData,
          running_total: runningTotal
        };
      });
  }

  return Array.from(playerProgressMap.values());
};

const Leaderboard = () => {
  const [timeFilter, setTimeFilter] = useState("All Time");
  const [rankingType, setRankingType] = useState<RankingType>("total");
  
  const { data: leaderboard, isLoading, error } = useQuery({
    queryKey: ['leaderboard', timeFilter],
    queryFn: fetchLeaderboardData,
  });

  const { data: playerProgressData, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['player-progress', leaderboard],
    queryFn: () => leaderboard ? fetchPlayerProgressData(leaderboard) : Promise.resolve([]),
    enabled: !!leaderboard,
  });

  const sortedLeaderboard = leaderboard?.sort((a, b) => {
    if (rankingType === "total") {
      return b.net_earnings - a.net_earnings;
    }
    if (rankingType === "average") {
      return b.average_net_earnings - a.average_net_earnings;
    }
    const totalHandsA = calculateTotalSpecialHands(a.special_hands);
    const totalHandsB = calculateTotalSpecialHands(b.special_hands);
    return totalHandsB - totalHandsA;
  });

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
      <div className="container mx-auto py-4 px-2 md:py-8 md:px-4">
        <LeaderboardHeader
          timeFilter={timeFilter}
          onTimeFilterChange={setTimeFilter}
          rankingType={rankingType}
          onRankingTypeChange={setRankingType}
        />

        <Tabs defaultValue="rankings" className="mt-4 md:mt-8">
          <TabsList className="w-full grid grid-cols-2 sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <TabsTrigger value="rankings" className="text-sm md:text-base">Rankings</TabsTrigger>
            <TabsTrigger value="progress" className="text-sm md:text-base">Progress Chart</TabsTrigger>
          </TabsList>
          
          <TabsContent value="rankings" className="mt-2 md:mt-4">
            {sortedLeaderboard && (
              <LeaderboardRankings 
                leaderboard={sortedLeaderboard} 
                rankingType={rankingType} 
              />
            )}
          </TabsContent>
          
          <TabsContent value="progress" className="mt-2 md:mt-4">
            {isLoadingProgress ? (
              <div className="text-center py-6">Loading chart data...</div>
            ) : (
              <LeaderboardProgress playerProgressData={playerProgressData || []} />
            )}
          </TabsContent>
        </Tabs>

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
