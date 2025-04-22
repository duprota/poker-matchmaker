import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { format, parseISO } from "date-fns";
import { RotateCw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type PlayerData = {
  player_name: string;
  games_data: {
    game_id: string;
    game_date: string;
    running_total: number;
  }[];
  games_count?: number;
};

interface PlayerProgressChartProps {
  playersData: PlayerData[];
}

// Chart colors
const CHART_COLORS = [
  "#3f51b5", // indigo
  "#f44336", // red
  "#4caf50", // green
  "#ff9800", // orange
  "#9c27b0", // purple
  "#009688", // teal
  "#795548", // brown
  "#607d8b", // blue-gray
  "#e91e63", // pink
  "#2196f3", // blue
];

export const PlayerProgressChart = ({ playersData }: PlayerProgressChartProps) => {
  const isMobile = useIsMobile();
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [showRotationHint, setShowRotationHint] = useState(false);

  useEffect(() => {
    if (isMobile) {
      // Detect initial orientation and show hint if in portrait mode
      const checkOrientation = () => {
        if (window.innerHeight > window.innerWidth) {
          setShowRotationHint(true);
        } else {
          setShowRotationHint(false);
        }
      };
      
      checkOrientation();
      window.addEventListener('resize', checkOrientation);
      
      return () => {
        window.removeEventListener('resize', checkOrientation);
      };
    }
  }, [isMobile]);

  useEffect(() => {
    // Select the 5 players with the most games by default
    if (playersData.length > 0 && selectedPlayers.length === 0) {
      const sortedByGamesCount = [...playersData]
        .sort((a, b) => {
          // Use games_count if available (from leaderboard), otherwise fallback to games_data length
          const countA = a.games_count || a.games_data.length;
          const countB = b.games_count || b.games_data.length;
          return countB - countA;
        })
        .slice(0, 5)
        .map(p => p.player_name);
      
      setSelectedPlayers(sortedByGamesCount);
    }
  }, [playersData, selectedPlayers.length]);

  // Prepare data for the chart
  const prepareChartData = () => {
    console.log("Preparing chart data with players:", playersData.map(p => p.player_name));
    
    // Find all unique game dates across all players (no filtering)
    const allDates = new Set<string>();
    playersData.forEach(player => {
      player.games_data.forEach(game => {
        console.log(`Adding date for ${player.player_name}: ${game.game_date}`);
        allDates.add(game.game_date);
      });
    });

    console.log("All unique dates:", Array.from(allDates));

    // Sort dates chronologically
    const sortedDates = Array.from(allDates).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );

    // Create an object for each date with the value for each selected player
    return sortedDates.map(date => {
      const dataPoint: any = {
        date,
        // Format for display only, keep original date for data processing
        formattedDate: format(new Date(date), "d MMM"),
      };

      // For each selected player, find their running total for this date
      selectedPlayers.forEach(playerName => {
        const player = playersData.find(p => p.player_name === playerName);
        if (player) {
          const playerFirstGame = player.games_data[0]?.game_date;
          const playerLastGame = player.games_data[player.games_data.length - 1]?.game_date;
          
          // Only include data points between player's first and last game
          if (date >= playerFirstGame && date <= playerLastGame) {
            const gameOnThisDate = player.games_data.find(g => g.game_date === date);
            // If player has a game on this date, use its running total
            // If not, use the last known running total
            if (gameOnThisDate) {
              dataPoint[playerName] = gameOnThisDate.running_total;
            } else {
              // Find the last known running total before this date
              const lastKnownGame = player.games_data
                .filter(g => g.game_date <= date)
                .sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime())[0];
              
              dataPoint[playerName] = lastKnownGame ? lastKnownGame.running_total : null;
            }
          }
        }
      });

      return dataPoint;
    });
  };

  const chartData = prepareChartData();

  // Get color for player badge and line - consistently assign colors to players
  const getPlayerColor = (playerName: string) => {
    const playerIndex = playersData.findIndex(p => p.player_name === playerName);
    return CHART_COLORS[playerIndex % CHART_COLORS.length];
  };

  // Chart configuration with colors
  const chartConfig = selectedPlayers.reduce((config, player) => {
    config[player] = {
      label: player,
      color: getPlayerColor(player),
    };
    return config;
  }, {} as Record<string, { label: string; color: string }>);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg md:text-xl">Players Progress</CardTitle>
        <div className="text-sm text-muted-foreground mb-2">
          Track players' financial performance over time
        </div>

        {showRotationHint && (
          <div className="flex items-center justify-center bg-muted/50 p-3 rounded-md mb-4 animate-pulse">
            <RotateCw className="h-5 w-5 mr-2" />
            <span>Rotate your phone for better chart viewing</span>
          </div>
        )}

        {/* Players selection with ScrollArea */}
        <ScrollArea className="w-full pb-4">
          <div className="flex flex-wrap gap-2 pb-2">
            {playersData.map((player) => {
              const playerColor = getPlayerColor(player.player_name);
              const gamesCount = player.games_count || player.games_data.length;
              
              return (
                <Badge 
                  key={player.player_name}
                  variant={selectedPlayers.includes(player.player_name) ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap"
                  style={{
                    backgroundColor: selectedPlayers.includes(player.player_name) 
                      ? playerColor
                      : undefined,
                    color: selectedPlayers.includes(player.player_name) 
                      ? 'white' 
                      : undefined
                  }}
                  onClick={() => {
                    if (selectedPlayers.includes(player.player_name)) {
                      setSelectedPlayers(selectedPlayers.filter(p => p !== player.player_name));
                    } else {
                      setSelectedPlayers([...selectedPlayers, player.player_name]);
                    }
                  }}
                >
                  {player.player_name} ({gamesCount})
                </Badge>
              );
            })}
          </div>
        </ScrollArea>
      </CardHeader>

      <CardContent>
        <div className="w-full" style={{ height: isMobile ? '500px' : '700px' }}>
          <ChartContainer config={chartConfig} className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={prepareChartData()} 
                layout="vertical"
                margin={{ 
                  top: 10,
                  right: isMobile ? 40 : 60,
                  left: isMobile ? 80 : 100,
                  bottom: 10
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.1} />
                <YAxis 
                  dataKey="formattedDate"
                  type="category"
                  tick={{ 
                    fontSize: isMobile ? 10 : 12,
                    textAnchor: 'end',
                    width: isMobile ? 60 : 80,
                  }}
                  tickFormatter={(value) => value}
                  width={isMobile ? 80 : 100}
                />
                <XAxis 
                  type="number"
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                  tickFormatter={(value) => `$${value}`}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  content={<ChartTooltipContent 
                    formatter={(value, name) => [`$ ${Number(value).toFixed(2)}`, name]}
                    labelFormatter={(date) => `Game: ${date}`}
                  />}
                />
                {selectedPlayers.map((player, index) => (
                  <Line
                    key={`${player}-${index}`}
                    type="monotone"
                    dataKey={player}
                    name={player}
                    stroke={getPlayerColor(player)}
                    strokeWidth={2}
                    dot={(props) => {
                      if (!props.payload || !props.payload.date) return null;
                      
                      const hasGameOnThisDate = playersData
                        .find(p => p.player_name === player)
                        ?.games_data.some(g => g.game_date === props.payload.date);
                      
                      if (!hasGameOnThisDate) return null;
                      
                      return (
                        <circle
                          cx={props.cx}
                          cy={props.cy}
                          r={isMobile ? 2 : 3}
                          fill={getPlayerColor(player)}
                          stroke="none"
                          key={`dot-${player}-${props.payload.date}-${index}`}
                        />
                      );
                    }}
                    activeDot={(props) => (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={isMobile ? 4 : 5}
                        fill={getPlayerColor(player)}
                        stroke="none"
                        key={`activeDot-${player}-${props.index}-${index}`}
                      />
                    )}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};
