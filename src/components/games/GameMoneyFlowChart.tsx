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

    // Calculate final total including all rebuys
    const finalTotal = players.reduce((acc, player) => 
      acc + player.initial_buyin + (player.total_rebuys * player.initial_buyin), 0);

    // Add final data point if it's different from the last one
    if (!dataPoints.length || dataPoints[dataPoints.length - 1].amount !== finalTotal) {
      const lastTime = dataPoints.length ? 
        parseInt(dataPoints[dataPoints.length - 1].time) + 30 : // Add 30 minutes after last point
        0; // Or start at 0 if no previous points

      dataPoints.push({
        time: lastTime.toString(),
        amount: finalTotal
      });
    }

    setChartData(dataPoints);
  }, [players, gameHistory]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis 
          dataKey="time" 
          label={{ 
            value: 'Minutes into game', 
            position: 'insideBottom', 
            offset: -10,
            fill: '#888'
          }}
          tick={{ fill: '#888' }}
        />
        <YAxis 
          label={{ 
            value: 'Amount in play ($)', 
            angle: -90, 
            position: 'insideLeft',
            offset: 10,
            fill: '#888'
          }}
          tick={{ fill: '#888' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#222',
            border: '1px solid #333',
            borderRadius: '8px'
          }}
          labelStyle={{ color: '#888' }}
        />
        <Bar 
          dataKey="amount" 
          fill="#8B5CF6"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};