
import { useState, useEffect } from "react";
import { RotateCw, Info, TrendingUp } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePlayerProgressData } from "@/hooks/use-player-progress-data";
import { PlayerSelection } from "./PlayerSelection";
import { ProgressChart } from "./ProgressChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  
  // Estado para controlar a visualização atual
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

  // Configuração das cores dos jogadores
  const chartConfig = selectedPlayers.reduce((config, player) => {
    config[player] = {
      label: player,
      color: getPlayerColor(player),
    };
    return config;
  }, {} as Record<string, { label: string; color: string }>);

  // Calcular limites do domínio para o gráfico
  const domainLimits = getMinMaxValues();

  // Preparar dados do gráfico
  const chartData = prepareChartData();

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
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
            <TabsList className="w-full md:w-auto grid grid-cols-2">
              <TabsTrigger value="earnings" className="text-xs md:text-sm">
                <TrendingUp className="h-4 w-4 mr-1" />
                Ganhos ($)
              </TabsTrigger>
              {/* Só deixei a tab "Earnings" visível por enquanto, até implementarmos a tab "Ranking" */}
            </TabsList>
          </Tabs>
        </div>

        {showRotationHint && (
          <div className="flex items-center justify-center bg-muted/50 p-3 rounded-md mb-4 animate-pulse">
            <RotateCw className="h-5 w-5 mr-2" />
            <span>Gire o telefone para melhor visualização</span>
          </div>
        )}

        <PlayerSelection
          playersData={playersData}
          selectedPlayers={selectedPlayers}
          onPlayerSelect={setSelectedPlayers}
        />
      </CardHeader>

      <CardContent className="pt-4">
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
