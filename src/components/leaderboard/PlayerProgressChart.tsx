import { useState, useEffect } from "react";
import { RotateCw, Info, TrendingUp } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePlayerProgressData } from "@/hooks/use-player-progress-data";
import { PlayerSelection } from "./PlayerSelection";
import { ProgressChart } from "./ProgressChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { standardizeDate } from "@/lib/utils";

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
  const { prepareChartData, getMinMaxValues, getPlayerColor } = usePlayerProgressData(playersData, selectedPlayers);
  
  const [chartView, setChartView] = useState<'earnings' | 'ranking'>('earnings');

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
        .slice(0, 3) // Limitar a 3 jogadores por padrão
        .map(p => p.player_name);
      
      setSelectedPlayers(sortedByGamesCount);
    }
  }, [playersData, selectedPlayers.length]);

  const sortedPlayersData = playersData.map(player => ({
    ...player,
    games_data: player.games_data
      .map(game => ({
        ...game,
        game_date: standardizeDate(game.game_date)
      }))
      .sort((a, b) => 
        new Date(a.game_date).getTime() - new Date(b.game_date).getTime()
      )
  }));

  const chartConfig = selectedPlayers.reduce((config, player) => {
    config[player] = {
      label: player,
      color: getPlayerColor(player),
    };
    return config;
  }, {} as Record<string, { label: string; color: string }>);

  const domainLimits = getMinMaxValues();

  const chartData = prepareChartData();

  return (
    <Card className="w-full">
      <CardHeader className="pb-1 px-2 md:px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg md:text-xl">Progresso dos Jogadores</CardTitle>
            <div className="text-sm text-muted-foreground">
              Acompanhe o desempenho financeiro dos jogadores ao longo do tempo
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 inline ml-2 cursor-help text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>Este gráfico mostra o saldo acumulado de cada jogador ao longo do tempo, com base nos resultados de cada jogo.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          <Tabs defaultValue="earnings" className="w-full md:w-auto" onValueChange={(value) => setChartView(value as 'earnings' | 'ranking')}>
            <TabsList className="w-full md:w-auto grid grid-cols-1">
              <TabsTrigger value="earnings" className="text-xs md:text-sm">
                <TrendingUp className="h-4 w-4 mr-1" />
                Ganhos ($)
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {showRotationHint && (
          <div className="flex items-center justify-center bg-muted/50 p-2 rounded-md mb-1 animate-pulse text-xs">
            <RotateCw className="h-4 w-4 mr-1" />
            <span>Gire o telefone para melhor visualização</span>
          </div>
        )}

        <PlayerSelection
          playersData={playersData}
          selectedPlayers={selectedPlayers}
          onPlayerSelect={setSelectedPlayers}
        />
      </CardHeader>

      <CardContent className="p-0 md:p-2">
        <ProgressChart
          chartData={chartData}
          selectedPlayers={selectedPlayers}
          chartConfig={chartConfig}
          domainLimits={domainLimits}
        />
      </CardContent>
    </Card>
  );
};
