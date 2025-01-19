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

interface LeaderboardEntry {
  player_name: string;
  games_played: number;
  total_winnings: number;
  biggest_win: number;
}

const fetchLeaderboardData = async (): Promise<LeaderboardEntry[]> => {
  console.log("Fetching leaderboard data...");
  
  const { data, error } = await supabase
    .from('game_players')
    .select(`
      player:players(name),
      game:games(id),
      final_result
    `)
    .not('final_result', 'is', null);

  if (error) {
    console.error("Error fetching leaderboard data:", error);
    throw error;
  }

  console.log("Raw game data:", data);

  // Process the data to calculate leaderboard statistics
  const playerStats = data.reduce((acc: { [key: string]: LeaderboardEntry }, entry) => {
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
};

const Leaderboard = () => {
  const { data: leaderboard, isLoading, error } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboardData,
  });

  if (isLoading) {
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

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold text-white mb-6">2024 Leaderboard</h1>
          <Card className="p-4">
            <div className="text-center py-8 text-red-500">
              Error loading leaderboard data. Please try again later.
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
        <h1 className="text-3xl font-bold text-white mb-6">2024 Leaderboard</h1>
        
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