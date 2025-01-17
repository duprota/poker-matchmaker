import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { GamePlayer } from "@/types/game";

interface ChartDataPoint {
  time: string;
  amount: number;
}

interface GameMoneyFlowChartProps {
  players: GamePlayer[];
  gameHistory: any[]; // Using any temporarily due to the history type not being defined
}

export const GameMoneyFlowChart = ({ players, gameHistory }: GameMoneyFlowChartProps) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    // Calculate initial buy-ins total
    const initialTotal = players.reduce((acc, player) => acc + player.initial_buyin, 0);

    // Create data point for initial buy-ins
    const dataPoints: ChartDataPoint[] = [{
      time: "0",
      amount: initialTotal
    }];

    // Sort history by timestamp
    const sortedHistory = [...gameHistory]
      .filter(entry => entry.event_type === 'rebuy')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    let runningTotal = initialTotal;

    // Add data points for each rebuy
    sortedHistory.forEach(entry => {
      const gamePlayer = players.find(p => p.id === entry.game_player_id);
      if (gamePlayer) {
        runningTotal += (gamePlayer.initial_buyin * entry.amount);
        
        // Calculate minutes since game start
        const entryTime = new Date(entry.created_at);
        const gameStartTime = new Date(sortedHistory[0]?.created_at || entry.created_at);
        const minutesSinceStart = Math.floor((entryTime.getTime() - gameStartTime.getTime()) / (1000 * 60));

        dataPoints.push({
          time: minutesSinceStart.toString(),
          amount: runningTotal
        });
      }
    });

    setChartData(dataPoints);
  }, [players, gameHistory]);

  return (
    <div className="w-full h-[400px] mt-8">
      <h2 className="text-xl font-semibold mb-4">Money Flow During Game</h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="time" 
            label={{ 
              value: 'Minutes into game', 
              position: 'insideBottom', 
              offset: -5 
            }}
          />
          <YAxis 
            label={{ 
              value: 'Amount in play ($)', 
              angle: -90, 
              position: 'insideLeft'
            }}
          />
          <Tooltip />
          <Bar 
            dataKey="amount" 
            fill="#4f46e5"
            label={{ 
              position: 'top',
              formatter: (value: number) => `$${value}`
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};