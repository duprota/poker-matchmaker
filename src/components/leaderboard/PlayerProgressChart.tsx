
import { useState, useEffect } from "react";
import { RotateCw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePlayerProgressData } from "@/hooks/use-player-progress-data";
import { PlayerSelection } from "./PlayerSelection";
import { ProgressChart } from "./ProgressChart";

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

export const PlayerProgressChart = ({ playersData }: PlayerProgressChartProps) => {
  const isMobile = useIsMobile();
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [showRotationHint, setShowRotationHint] = useState(false);
  const { prepareChartData, getPlayerColor } = usePlayerProgressData(playersData, selectedPlayers);

  useEffect(() => {
    if (isMobile) {
      const checkOrientation = () => {
        setShowRotationHint(window.innerHeight > window.innerWidth);
      };
      
      checkOrientation();
      window.addEventListener('resize', checkOrientation);
      return () => window.removeEventListener('resize', checkOrientation);
    }
  }, [isMobile]);

  useEffect(() => {
    if (playersData.length > 0 && selectedPlayers.length === 0) {
      const sortedByGamesCount = [...playersData]
        .sort((a, b) => {
          const countA = a.games_count || a.games_data.length;
          const countB = b.games_count || b.games_data.length;
          return countB - countA;
        })
        .slice(0, 5)
        .map(p => p.player_name);
      
      setSelectedPlayers(sortedByGamesCount);
    }
  }, [playersData, selectedPlayers.length]);

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

        <PlayerSelection
          playersData={playersData}
          selectedPlayers={selectedPlayers}
          onPlayerSelect={setSelectedPlayers}
        />
      </CardHeader>

      <CardContent>
        <ProgressChart
          chartData={prepareChartData()}
          selectedPlayers={selectedPlayers}
          chartConfig={chartConfig}
        />
      </CardContent>
    </Card>
  );
};
