
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
import { format } from "date-fns";
import { RotateCw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PlayerData = {
  player_name: string;
  games_data: {
    game_id: string;
    game_date: string;
    running_total: number;
  }[];
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
        .sort((a, b) => b.games_data.length - a.games_data.length)
        .slice(0, 5)
        .map(p => p.player_name);
      
      setSelectedPlayers(sortedByGamesCount);
    }
  }, [playersData, selectedPlayers.length]);

  // Prepare data for the chart
  const prepareChartData = () => {
    // Find all unique game dates
    const allDates = new Set<string>();
    playersData.forEach(player => {
      player.games_data.forEach(game => {
        allDates.add(game.game_date);
      });
    });

    // Sort dates chronologically
    const sortedDates = Array.from(allDates).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );

    // Create an object for each date with the value of each selected player
    return sortedDates.map(date => {
      const dataPoint: any = {
        date,
        formattedDate: format(new Date(date), "d MMM"),
      };

      // Add the value for each selected player on this date
      selectedPlayers.forEach(playerName => {
        const player = playersData.find(p => p.player_name === playerName);
        if (player) {
          const gameOnThisDate = player.games_data.find(g => g.game_date === date);
          dataPoint[playerName] = gameOnThisDate ? gameOnThisDate.running_total : null;
        }
      });

      return dataPoint;
    });
  };

  const chartData = prepareChartData();

  // Chart configuration with colors
  const chartConfig = selectedPlayers.reduce((config, player, index) => {
    config[player] = {
      label: player,
      color: CHART_COLORS[index % CHART_COLORS.length],
    };
    return config;
  }, {} as Record<string, { label: string; color: string }>);

  // Get color for player badge
  const getPlayerColor = (playerName: string) => {
    // Find the index of the player in the selectedPlayers array
    const playerIndex = playersData.findIndex(p => p.player_name === playerName);
    return CHART_COLORS[playerIndex % CHART_COLORS.length];
  };

  return (
    <Card className="w-full mt-8">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Players Progress</CardTitle>
        <div className="text-sm text-muted-foreground mb-2">
          Track players' financial performance over time
        </div>

        {showRotationHint && (
          <div className="flex items-center justify-center bg-muted/50 p-3 rounded-md mb-4 animate-pulse">
            <RotateCw className="h-5 w-5 mr-2" />
            <span>Rotate your phone for better chart viewing</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-2">
          {playersData.map((player) => {
            const playerColor = getPlayerColor(player.player_name);
            return (
              <Badge 
                key={player.player_name}
                variant={selectedPlayers.includes(player.player_name) ? "default" : "outline"}
                className="cursor-pointer"
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
                {player.player_name} ({player.games_data.length} games)
              </Badge>
            );
          })}
        </div>
      </CardHeader>

      <CardContent>
        <div className="w-full" style={{ height: isMobile ? '300px' : '400px' }}>
          <ChartContainer config={chartConfig} className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.1} />
                <XAxis 
                  dataKey="formattedDate" 
                  tick={{ fontSize: 12 }} 
                  tickMargin={10}
                />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  tickFormatter={(value) => `$${value}`}
                  width={isMobile ? 40 : 60} 
                />
                <Tooltip 
                  content={<ChartTooltipContent 
                    formatter={(value, name) => [`$ ${Number(value).toFixed(2)}`, name]}
                    labelFormatter={(date) => `Game: ${date}`}
                  />} 
                />
                {selectedPlayers.map((player, index) => {
                  const playerIndex = playersData.findIndex(p => p.player_name === player);
                  return (
                    <Line
                      key={player}
                      type="monotone"
                      dataKey={player}
                      name={player}
                      stroke={CHART_COLORS[playerIndex % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};
