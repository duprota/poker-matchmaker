import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Star, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface LeaderboardEntry {
  player_name: string;
  games_played: number;
  total_winnings: number;
  biggest_win: number;
  total_spent: number;
  roi_percentage: number;
  average_roi: number;
  best_game_roi: number;
  worst_game_roi: number;
}

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
        worst_game_roi: Infinity
      };
    }

    acc[playerName].games_played += 1;
    acc[playerName].total_winnings += result;
    acc[playerName].total_spent += spent;
    acc[playerName].biggest_win = Math.max(acc[playerName].biggest_win, result);
    acc[playerName].best_game_roi = Math.max(acc[playerName].best_game_roi, gameRoi);
    acc[playerName].worst_game_roi = Math.min(acc[playerName].worst_game_roi, gameRoi);

    return acc;
  }, {});

  // Calculate final ROI percentages
  Object.values(playerStats).forEach(player => {
    player.roi_percentage = calculateROI(player.total_winnings, player.total_spent);
    player.average_roi = player.roi_percentage / player.games_played;
  });

  return Object.values(playerStats).sort((a, b) => b.total_winnings - a.total_winnings);
};

const Leaderboard = () => {
  const [timeFilter, setTimeFilter] = useState("All Time");
  const { data: leaderboard, isLoading, error } = useQuery({
    queryKey: ['leaderboard', timeFilter],
    queryFn: fetchLeaderboardData,
  });

  const handleShareWhatsApp = () => {
    if (!leaderboard) return;

    const totalMoneyWon = leaderboard.reduce((acc, player) => acc + Math.max(0, player.total_winnings), 0);
    const totalGamesPlayed = leaderboard.reduce((acc, player) => acc + player.games_played, 0);

    const summaryText = `🏆 Poker Leaderboard ${timeFilter}\n\n` +
      `📊 Total Money Won: $${totalMoneyWon}\n` +
      `🎮 Total Games Played: ${totalGamesPlayed}\n\n` +
      `🎯 Top Players:\n${leaderboard.slice(0, 5).map((player, index) => {
        const position = index + 1;
        const emoji = position === 1 ? '👑' : position === 2 ? '🥈' : position === 3 ? '🥉' : '⭐';
        const roi = ((player.total_winnings / player.total_spent) * 100).toFixed(1);
        return `${emoji} ${player.player_name}\n` +
          `   💰 $${player.total_winnings} (${roi}% ROI)\n` +
          `   🎲 ${player.games_played} games\n` +
          `   💫 Best Game ROI: ${player.best_game_roi.toFixed(1)}%\n`;
      }).join('\n')}` +
      `\n🔥 Most Profitable Players:\n${leaderboard
        .filter(p => p.roi_percentage > 0)
        .sort((a, b) => b.roi_percentage - a.roi_percentage)
        .slice(0, 3)
        .map(player => `📈 ${player.player_name}: ${player.roi_percentage.toFixed(1)}% ROI`).join('\n')}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(summaryText)}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-muted">
        <Navigation />
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-6">
            2024 Leaderboard
          </h1>
          <Card className="p-4 bg-card/80 backdrop-blur-sm">
            <div className="text-center py-8">Loading leaderboard data...</div>
          </Card>
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
          <Card className="p-4 bg-card/80 backdrop-blur-sm">
            <div className="text-center py-8 text-destructive">
              Error loading leaderboard data. Please try again later.
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-muted">
      <Navigation />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-6">
          2024 Leaderboard
        </h1>
        
        <TimeFilter active={timeFilter} onChange={setTimeFilter} />
        
        <ScrollArea className="h-[calc(100vh-320px)]">
          {leaderboard?.map((entry, index) => (
            <PlayerCard 
              key={entry.player_name} 
              entry={entry} 
              position={index + 1}
            />
          ))}
        </ScrollArea>

        <div className="mt-6 flex justify-center">
          <Button
            size="lg"
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity animate-fade-in"
            onClick={handleShareWhatsApp}
          >
            Share on WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
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

const ROIIndicator = ({ value }: { value: number }) => {
  const isPositive = value >= 0;
  return (
    <div className={cn(
      "flex items-center gap-1",
      isPositive ? "text-green-500" : "text-red-500"
    )}>
      {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
      <span>{value.toFixed(1)}%</span>
    </div>
  );
};

const PlayerCard = ({ entry, position }: { entry: LeaderboardEntry, position: number }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();
  
  return (
    <Card 
      className={cn(
        "p-4 mb-3 transition-all cursor-pointer hover:scale-[1.02] animate-fade-in bg-card/80 backdrop-blur-sm border-primary/10 hover:border-primary/20",
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
            <ROIIndicator value={entry.roi_percentage} />
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
          <div className="text-sm text-muted-foreground">
            <DollarSign className="w-3 h-3 inline" />
            {entry.total_spent} spent
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-4 pt-4 border-t animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Average ROI per Game</div>
              <div className="font-semibold">
                <ROIIndicator value={entry.average_roi} />
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Best Game ROI</div>
              <div className="font-semibold">
                <ROIIndicator value={entry.best_game_roi} />
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Worst Game ROI</div>
              <div className="font-semibold">
                <ROIIndicator value={entry.worst_game_roi} />
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Investment</div>
              <div className="font-semibold">${entry.total_spent}</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default Leaderboard;