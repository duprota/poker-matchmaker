import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
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

    // Process the data to calculate leaderboard statistics
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

    // Convert to array and sort by total winnings
    const leaderboard = Object.values(playerStats)
      .sort((a, b) => b.total_winnings - a.total_winnings);

    console.log("Processed leaderboard data:", leaderboard);
    return leaderboard;
  } catch (error) {
    console.error("Error in fetchLeaderboardData:", error);
    throw error;
  }
};

const Leaderboard = () => {
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
  const { toast } = useToast();

  const { data: groups, isLoading: isLoadingGroups, error: groupsError } = useQuery({
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

  const { 
    data: leaderboard, 
    isLoading, 
    error 
  } = useQuery({
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

  if (isLoading || isLoadingGroups) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold text-white mb-6">2024 Leaderboard</h1>
          <Card className="p-4">
            <div className="text-center py-8">Loading leaderboard data...</div>
          </Card>
        </div>
      </div>
    );
  }

  if (error || groupsError) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold text-white mb-6">2024 Leaderboard</h1>
          <Card className="p-4">
            <div className="text-center py-8 text-red-500">
              Error loading data. Please try again later.
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">2024 Leaderboard</h1>
          <Select
            value={selectedGroupId}
            onValueChange={(value) => setSelectedGroupId(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={undefined}>All Groups</SelectItem>
              {groups?.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Card className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Position</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Games Played</TableHead>
                <TableHead>Total Winnings</TableHead>
                <TableHead>Biggest Win</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard?.map((entry, index) => (
                <TableRow key={entry.player_name}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{entry.player_name}</TableCell>
                  <TableCell>{entry.games_played}</TableCell>
                  <TableCell className={entry.total_winnings >= 0 ? 'text-green-500' : 'text-red-500'}>
                    ${entry.total_winnings}
                  </TableCell>
                  <TableCell>${entry.biggest_win}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default Leaderboard;
