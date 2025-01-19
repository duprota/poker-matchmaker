import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LeaderboardEntry {
  player_name: string;
  games_played: number;
  total_winnings: number;
  biggest_win: number;
}

interface Group {
  id: string;
  name: string;
}

export const useLeaderboardData = (selectedGroupId: string | undefined) => {
  const { toast } = useToast();

  const fetchGroups = async (): Promise<Group[]> => {
    console.log("Fetching groups...");
    const { data, error } = await supabase
      .from('groups')
      .select('id, name');

    if (error) {
      console.error("Error fetching groups:", error);
      throw new Error(`Failed to fetch groups: ${error.message}`);
    }

    if (!data) {
      console.warn("No groups data returned");
      return [];
    }

    console.log("Groups data:", data);
    return data;
  };

  const fetchLeaderboardData = async (groupId?: string): Promise<LeaderboardEntry[]> => {
    console.log("Fetching leaderboard data for group:", groupId);
    
    try {
      let query = supabase
        .from('game_players')
        .select(`
          player:players(name),
          game:games(id, group_id),
          final_result
        `)
        .not('final_result', 'is', null);

      if (groupId) {
        query = query.eq('game.group_id', groupId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching leaderboard data:", error);
        throw new Error(`Failed to fetch leaderboard data: ${error.message}`);
      }

      if (!data) {
        console.warn("No leaderboard data returned");
        return [];
      }

      console.log("Raw game data:", data);

      const playerStats = data.reduce((acc: { [key: string]: LeaderboardEntry }, entry) => {
        if (!entry.player?.name) {
          console.warn("Entry missing player name:", entry);
          return acc;
        }

        const playerName = entry.player.name;
        
        if (!acc[playerName]) {
          acc[playerName] = {
            player_name: playerName,
            games_played: 0,
            total_winnings: 0,
            biggest_win: 0
          };
        }

        acc[playerName].games_played += 1;
        acc[playerName].total_winnings += entry.final_result || 0;
        acc[playerName].biggest_win = Math.max(acc[playerName].biggest_win, entry.final_result || 0);

        return acc;
      }, {});

      const leaderboard = Object.values(playerStats)
        .sort((a, b) => b.total_winnings - a.total_winnings);

      console.log("Processed leaderboard data:", leaderboard);
      return leaderboard;
    } catch (error) {
      console.error("Error in fetchLeaderboardData:", error);
      throw error;
    }
  };

  const groupsQuery = useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
    retry: 3,
    meta: {
      onError: (error: Error) => {
        console.error("Error fetching groups:", error);
        toast({
          title: "Error",
          description: "Failed to load groups. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  const leaderboardQuery = useQuery({
    queryKey: ['leaderboard', selectedGroupId],
    queryFn: () => fetchLeaderboardData(selectedGroupId),
    retry: 3,
    meta: {
      onError: (error: Error) => {
        console.error("Error fetching leaderboard:", error);
        toast({
          title: "Error",
          description: "Failed to load leaderboard data. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  return {
    groupsQuery,
    leaderboardQuery
  };
};