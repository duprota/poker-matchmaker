import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Star, TrendingUp } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { cn } from "@/lib/utils";

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

  return Object.values(playerStats).sort((a, b) => b.total_winnings - a.total_winnings);
};

const TimeFilter = ({ active, onChange }: { active: string, onChange: (period: string) => void }) => {
  const filters = ["All Time", "This Month", "This Week"];
  const isMobile = useIsMobile();
  
  return (
    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onChange(filter)}
          className={cn(
            "px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all",
            active === filter 
              ? "bg-primary text-white" 
              : "bg-card hover:bg-muted"
          )}
        >
          {filter}
        </button>
      ))}
    </div>
  );
};

const RankIcon = ({ position }: { position: number }) => {
  if (position === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
  if (position === 2) return <Medal className="w-6 h-6 text-gray-400" />;
  if (position === 3) return <Medal className="w-6 h-6 text-amber-600" />;
  return <Star className="w-6 h-6 text-muted-foreground" />;
};

const PlayerCard = ({ entry, position }: { entry: LeaderboardEntry, position: number }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();
  
  return (
    <Card 
      className={cn(
        "p-4 mb-3 transition-all cursor-pointer hover:scale-[1.02] animate-fade-in",
        isExpanded && "bg-card/50"
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-8 h-8">
          <RankIcon position={position} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{entry.player_name}</span>
            {entry.total_winnings > 1000 && (
              <TrendingUp className="w-4 h-4 text-green-500" />
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {entry.games_played} games played
          </div>
        </div>
        
        <div className={cn(
          "text-right",
          entry.total_winnings >= 0 ? "text-green-500" : "text-red-500"
        )}>
          <div className="font-bold">${entry.total_winnings}</div>
          {isExpanded && (
            <div className="text-sm animate-fade-in">
              Best: ${entry.biggest_win}
            </div>
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-4 pt-4 border-t animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Average per Game</div>
              <div className="font-semibold">
                ${Math.round(entry.total_winnings / entry.games_played)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Biggest Win</div>
              <div className="font-semibold">${entry.biggest_win}</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

const Leaderboard = () => {
  const [timeFilter, setTimeFilter] = useState("All Time");
  const { data: leaderboard, isLoading, error } = useQuery({
    queryKey: ['leaderboard', timeFilter],
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
        
        <TimeFilter active={timeFilter} onChange={setTimeFilter} />
        
        <ScrollArea className="h-[calc(100vh-220px)]">
          {leaderboard?.map((entry, index) => (
            <PlayerCard 
              key={entry.player_name} 
              entry={entry} 
              position={index + 1}
            />
          ))}
        </ScrollArea>
      </div>
    </div>
  );
};

export default Leaderboard;