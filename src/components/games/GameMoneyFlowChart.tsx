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
    // Calculate initial total from all players' initial buy-ins
    const initialTotal = players.reduce((acc, player) => acc + (player.initial_buyin || 0), 0);
    console.log("Initial total from buy-ins:", initialTotal);

    // Initialize data points array with initial buy-ins
    const dataPoints: ChartDataPoint[] = [{
      time: "0",
      amount: initialTotal
    }];

    // Get only rebuy events and sort them by timestamp
    const rebuyEvents = [...gameHistory]
      .filter(entry => entry.event_type === 'rebuy')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    console.log("Sorted rebuy events:", rebuyEvents);

    // Track running total starting from initial buy-ins
    let runningTotal = initialTotal;

    // Process each rebuy event
    rebuyEvents.forEach(event => {
      const player = players.find(p => p.id === event.game_player_id);
      if (player) {
        // For each rebuy, add the player's initial buy-in amount
        const rebuyAmount = player.initial_buyin;
        runningTotal += rebuyAmount;
        
        // Calculate minutes since game start
        const eventTime = new Date(event.created_at);
        const gameStartTime = new Date(rebuyEvents[0]?.created_at || event.created_at);
        const minutesSinceStart = Math.floor((eventTime.getTime() - gameStartTime.getTime()) / (1000 * 60));

        console.log(`Rebuy at ${minutesSinceStart} minutes:`, {
          player: player.player.name,
          rebuyAmount,
          newTotal: runningTotal
        });

        dataPoints.push({
          time: minutesSinceStart.toString(),
          amount: runningTotal
        });
      }
    });

    // Calculate final total (should match total money in play)
    const finalTotal = players.reduce((acc, player) => 
      acc + player.initial_buyin + (player.total_rebuys * player.initial_buyin), 0
    );
    console.log("Final total:", finalTotal);

    // Add final data point if it's different from the last one
    if (dataPoints.length === 1 || dataPoints[dataPoints.length - 1].amount !== finalTotal) {
      const lastTime = dataPoints.length > 1 ? 
        parseInt(dataPoints[dataPoints.length - 1].time) + 30 : // Add 30 minutes after last point
        60; // Or default to 60 minutes if only initial point exists

      dataPoints.push({
        time: lastTime.toString(),
        amount: finalTotal
      });
    }

    console.log("Final chart data points:", dataPoints);
    setChartData(dataPoints);
  }, [players, gameHistory]);

  return (
    <ResponsiveContainer width="100%" height={400}>
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
          formatter={(value: number) => [`$${value}`, 'Amount']}
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