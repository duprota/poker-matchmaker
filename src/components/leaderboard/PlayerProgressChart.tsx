
import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { RotateCw, RotateCcw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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

// Cores para as linhas do gráfico
const CHART_COLORS = [
  "#3f51b5", // indigo
  "#f44336", // vermelho
  "#4caf50", // verde
  "#ff9800", // laranja
  "#9c27b0", // roxo
  "#009688", // teal
  "#795548", // marrom
  "#607d8b", // azul cinza
  "#e91e63", // rosa
  "#2196f3", // azul
];

export const PlayerProgressChart = ({ playersData }: PlayerProgressChartProps) => {
  const isMobile = useIsMobile();
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [showRotationHint, setShowRotationHint] = useState(false);

  useEffect(() => {
    if (isMobile) {
      // Detecta a orientação inicial e mostra a dica se estiver em modo retrato
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
    // Selecionar os 5 jogadores com mais jogos por padrão
    if (playersData.length > 0 && selectedPlayers.length === 0) {
      const sortedByGamesCount = [...playersData]
        .sort((a, b) => b.games_data.length - a.games_data.length)
        .slice(0, 5)
        .map(p => p.player_name);
      
      setSelectedPlayers(sortedByGamesCount);
    }
  }, [playersData, selectedPlayers.length]);

  // Preparar dados para o gráfico
  const prepareChartData = () => {
    // Encontrar todas as datas de jogos únicas
    const allDates = new Set<string>();
    playersData.forEach(player => {
      player.games_data.forEach(game => {
        allDates.add(game.game_date);
      });
    });

    // Ordenar as datas cronologicamente
    const sortedDates = Array.from(allDates).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );

    // Criar um objeto para cada data com o valor de cada jogador selecionado
    return sortedDates.map(date => {
      const dataPoint: any = {
        date,
        formattedDate: format(new Date(date), "d MMM", { locale: ptBR }),
      };

      // Adicionar o valor para cada jogador selecionado nesta data
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

  // Configuração para o gráfico
  const chartConfig = selectedPlayers.reduce((config, player, index) => {
    config[player] = {
      label: player,
      color: CHART_COLORS[index % CHART_COLORS.length],
    };
    return config;
  }, {} as Record<string, { label: string; color: string }>);

  return (
    <Card className="w-full mt-8">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Evolução dos Jogadores</CardTitle>
        <div className="text-sm text-muted-foreground mb-2">
          Acompanhe o desempenho financeiro dos jogadores ao longo do tempo
        </div>

        {showRotationHint && (
          <div className="flex items-center justify-center bg-muted/50 p-3 rounded-md mb-4 animate-pulse">
            <RotateCw className="h-5 w-5 mr-2" />
            <span>Gire seu celular para visualizar melhor o gráfico</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-2">
          {playersData.map((player) => (
            <Badge 
              key={player.player_name}
              variant={selectedPlayers.includes(player.player_name) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => {
                if (selectedPlayers.includes(player.player_name)) {
                  setSelectedPlayers(selectedPlayers.filter(p => p !== player.player_name));
                } else {
                  setSelectedPlayers([...selectedPlayers, player.player_name]);
                }
              }}
            >
              {player.player_name} ({player.games_data.length} jogos)
            </Badge>
          ))}
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
                  tickFormatter={(value) => `R$${value}`}
                  width={isMobile ? 40 : 60} 
                />
                <Tooltip 
                  content={<ChartTooltipContent 
                    formatter={(value, name) => [`R$ ${Number(value).toFixed(2)}`, name]}
                    labelFormatter={(date) => `Jogo: ${date}`}
                  />} 
                />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                {selectedPlayers.map((player, index) => (
                  <Line
                    key={player}
                    type="monotone"
                    dataKey={player}
                    name={player}
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls
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
