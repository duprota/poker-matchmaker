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

    // Get game start time from the first history entry with started_at
    const startedAtEntry = gameHistory.find(entry => entry.started_at);
    const firstEntry = gameHistory[0];
    const now = new Date();
    
    // Ensure we have a valid date by providing fallbacks
    const gameStartTime = startedAtEntry?.started_at ? 
      new Date(startedAtEntry.started_at) : 
      (firstEntry?.created_at ? new Date(firstEntry.created_at) : now);

    // Validate the date
    if (isNaN(gameStartTime.getTime())) {
      console.error("Invalid game start time, using current time as fallback");
      gameStartTime = now;
    }

    console.log("Game start time:", gameStartTime.toISOString());

    // Initialize data points array with initial buy-ins
    const dataPoints: ChartDataPoint[] = [{
      time: "0",
      amount: initialTotal,
      playerName: "Initial Buy-ins",
      timestamp: gameStartTime,
      eventType: 'initial'
    }];

    // Get only rebuy events and sort them by timestamp
    const rebuyEvents = [...gameHistory]
      .filter(entry => entry.event_type === 'rebuy')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    console.log("Sorted rebuy events:", rebuyEvents);

    // Calculate current total based on initial buy-ins and current total rebuys
    const currentTotal = players.reduce((acc, player) => {
      const totalAmount = player.initial_buyin * (1 + (player.total_rebuys || 0));
      return acc + totalAmount;
    }, 0);

    // Track running total starting from initial buy-ins
    let runningTotal = initialTotal;

    // Process each rebuy event
    rebuyEvents.forEach(event => {
      const player = players.find(p => p.id === event.game_player_id);
      if (player) {
        // Get the current total rebuys for this player from the event
        const currentRebuys = event.amount || 0;
        const previousRebuys = player.total_rebuys - currentRebuys;
        
        // Calculate the change in money for this rebuy event
        const rebuyChange = (currentRebuys - previousRebuys) * player.initial_buyin;
        runningTotal += rebuyChange;
        
        // Ensure we have a valid date for the event
        const eventTime = new Date(event.created_at);
        if (isNaN(eventTime.getTime())) {
          console.error("Invalid event time, skipping event:", event);
          return;
        }

        const minutesSinceStart = Math.floor((eventTime.getTime() - gameStartTime.getTime()) / (1000 * 60));

        console.log(`Rebuy event at ${minutesSinceStart} minutes:`, {
          player: player.player.name,
          currentRebuys,
          previousRebuys,
          rebuyChange,
          newTotal: runningTotal,
          eventTime: eventTime.toISOString()
        });

        dataPoints.push({
          time: minutesSinceStart.toString(),
          amount: runningTotal,
          playerName: player.player.name,
          timestamp: eventTime,
          eventType: 'rebuy'
        });
      }
    });

    // Add final point if total has changed
    if (currentTotal !== runningTotal) {
      dataPoints.push({
        time: "current",
        amount: currentTotal,
        playerName: "Current Total",
        timestamp: new Date(),
        eventType: 'current'
      });
    }

    // Calculate game duration using started_at if available
    if (gameHistory.length > 0) {
      const gameStart = gameHistory.find(entry => entry.started_at)?.started_at;
      if (gameStart) {
        try {
          const startDate = new Date(gameStart);
          if (!isNaN(startDate.getTime())) {
            const duration = formatDistance(now, startDate, { addSuffix: false });
            console.log("Game duration calculated:", duration, "from start time:", gameStart);
            setGameDuration(duration);
          }
        } catch (error) {
          console.error("Error calculating game duration:", error);
        }
      }
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