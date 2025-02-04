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
  eventType: string;
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

    // Get game start time from the game history
    const now = new Date();
    let gameStartTime: Date;

    // First try to get the started_at time from the game history
    const gameStartEntry = gameHistory.find(entry => entry.started_at);
    if (gameStartEntry?.started_at && !isNaN(new Date(gameStartEntry.started_at).getTime())) {
      gameStartTime = new Date(gameStartEntry.started_at);
      console.log("Found game start time from started_at:", gameStartTime);
      
      // Calculate and set game duration immediately if we have a valid start time
      const duration = formatDistance(now, gameStartTime, { addSuffix: false });
      console.log("Setting game duration:", duration);
      setGameDuration(duration);
    } else {
      // Fallback to created_at time if no started_at is available
      const firstEntry = gameHistory[0];
      if (firstEntry?.created_at && !isNaN(new Date(firstEntry.created_at).getTime())) {
        gameStartTime = new Date(firstEntry.created_at);
        console.log("Using created_at as fallback start time:", gameStartTime);
      } else {
        gameStartTime = now;
        console.warn("No valid start time found, using current time");
      }
    }

    // Initialize data points array with initial buy-ins
    const dataPoints: ChartDataPoint[] = [{
      time: "0",
      amount: initialTotal,
      playerName: "Initial Buy-ins",
      timestamp: gameStartTime,
      eventType: 'initial'
    }];

    let runningTotal = initialTotal;

    // Process each player's initial buy-in as a separate event
    players.forEach(player => {
      if (player.initial_buyin > 0) {
        dataPoints.push({
          time: "0",
          amount: player.initial_buyin,
          playerName: `${player.player.name} - Initial Buy-in`,
          timestamp: gameStartTime,
          eventType: 'initial_buyin'
        });
      }
    });

    // Get and process rebuy events
    const rebuyEvents = [...gameHistory]
      .filter(entry => entry.event_type === 'rebuy')
      .sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateA.getTime() - dateB.getTime();
      })
      .filter(entry => !isNaN(new Date(entry.created_at).getTime()));

    console.log("Processing rebuy events:", rebuyEvents);

    // Process each rebuy event
    rebuyEvents.forEach(event => {
      const player = players.find(p => p.id === event.game_player_id);
      if (player) {
        const rebuyAmount = event.amount * player.initial_buyin;
        runningTotal += rebuyAmount;
        
        const eventTime = new Date(event.created_at);
        const minutesSinceStart = Math.floor((eventTime.getTime() - gameStartTime.getTime()) / (1000 * 60));

        console.log(`Adding rebuy event for ${player.player.name}:`, {
          amount: rebuyAmount,
          total: runningTotal,
          time: minutesSinceStart
        });

        dataPoints.push({
          time: minutesSinceStart.toString(),
          amount: runningTotal,
          playerName: `${player.player.name} - Rebuy`,
          timestamp: eventTime,
          eventType: 'rebuy'
        });
      }
    });

    // Add current total if it's different
    const currentTotal = players.reduce((acc, player) => {
      const totalAmount = player.initial_buyin * (1 + (player.total_rebuys || 0));
      return acc + totalAmount;
    }, 0);

    if (currentTotal !== runningTotal) {
      dataPoints.push({
        time: "current",
        amount: currentTotal,
        playerName: "Current Total",
        timestamp: now,
        eventType: 'current'
      });
    }

    console.log("Final chart data points:", dataPoints);
    setChartData(dataPoints);
  }, [players, gameHistory]);

  const totalRebuys = players.reduce((acc, player) => acc + player.total_rebuys, 0);
  const currentTotal = players.reduce((acc, player) => {
    const totalAmount = player.initial_buyin * (1 + (player.total_rebuys || 0));
    return acc + totalAmount;
  }, 0);

  return (
    <div className="space-y-6 animate-fade-in relative z-0">
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Game Stats</h3>
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
                <p className="text-2xl font-bold">{gameDuration || "Not started"}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Money Flow Timeline</h3>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />
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
                      {point.amount - chartData[index - 1].amount > 0 ? '+' : ''}
                      ${point.amount - chartData[index - 1].amount} from previous
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
