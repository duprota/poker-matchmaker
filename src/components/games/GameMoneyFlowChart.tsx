import { useEffect, useState } from "react";
import { GamePlayer } from "@/types/game";
import { Card } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDistanceToNow, formatDistance } from "date-fns";
import { TrendingUpIcon, ClockIcon, RefreshCwIcon } from "lucide-react";

interface ChartDataPoint {
  time: string;
  amount: number;
  playerName?: string;
  timestamp: Date;
}

interface GameMoneyFlowChartProps {
  players: GamePlayer[];
  gameHistory: any[]; // Using any temporarily due to the history type not being defined
}

export const GameMoneyFlowChart = ({ players, gameHistory }: GameMoneyFlowChartProps) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [gameDuration, setGameDuration] = useState<string>("");
  const isMobile = useIsMobile();

  useEffect(() => {
    // Calculate initial total from all players' initial buy-ins
    const initialTotal = players.reduce((acc, player) => acc + (player.initial_buyin || 0), 0);
    console.log("Initial total from buy-ins:", initialTotal);

    // Initialize data points array with initial buy-ins
    const dataPoints: ChartDataPoint[] = [{
      time: "0",
      amount: initialTotal,
      playerName: "Initial Buy-ins",
      timestamp: new Date(gameHistory[0]?.created_at || new Date())
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
        const rebuyAmount = player.initial_buyin;
        runningTotal += rebuyAmount;
        
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
          amount: runningTotal,
          playerName: player.player.name,
          timestamp: eventTime
        });
      }
    });

    // Calculate game duration
    if (gameHistory.length > 0) {
      const firstEvent = new Date(gameHistory[0].created_at);
      const duration = formatDistance(new Date(), firstEvent, { addSuffix: false });
      setGameDuration(duration);
    }

    console.log("Final chart data points:", dataPoints);
    setChartData(dataPoints);
  }, [players, gameHistory]);

  const totalRebuys = players.reduce((acc, player) => acc + player.total_rebuys, 0);
  const currentTotal = chartData[chartData.length - 1]?.amount || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Card */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <TrendingUpIcon className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total in Play</p>
              <p className="text-2xl font-bold">${currentTotal}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <RefreshCwIcon className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Rebuys</p>
              <p className="text-2xl font-bold">{totalRebuys}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <ClockIcon className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Game Duration</p>
              <p className="text-2xl font-bold">{gameDuration}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Money Flow Timeline</h3>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />

        {/* Timeline events */}
        <div className="space-y-4">
          {chartData.map((point, index) => (
            <div
              key={index}
              className={`
                relative pl-12 py-4 hover-scale
                ${index === 0 ? 'animate-fade-in' : 'animate-fade-in'}
              `}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Timeline dot */}
              <div className="absolute left-2.5 top-6 w-3 h-3 rounded-full bg-primary" />
              
              <Card className="p-4 bg-card">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {point.playerName}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(point.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-lg font-semibold">
                    <TrendingUpIcon className="w-5 h-5 text-primary" />
                    <span>${point.amount}</span>
                  </div>

                  {index > 0 && (
                    <div className="text-sm text-muted-foreground">
                      +${point.amount - chartData[index - 1].amount} from previous
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};