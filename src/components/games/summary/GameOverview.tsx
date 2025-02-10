
import { Clock, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";
import { format } from "date-fns";

interface GameOverviewProps {
  name?: string;
  date: string;
  place?: string;
  startedAt?: string;
  playerCount: number;
}

export const GameOverview = ({ 
  name, 
  date, 
  place, 
  startedAt,
  playerCount 
}: GameOverviewProps) => {
  const gameDuration = startedAt ? 
    format(new Date(date), 'PPp') + ' - ' + format(new Date(startedAt), 'p') 
    : format(new Date(date), 'PPp');

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10" />
      <div className="relative p-6">
        <div className="flex flex-col gap-4">
          {name && (
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                {name}
              </h1>
              <div className="h-1 w-20 mx-auto rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500" />
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{gameDuration}</span>
            </div>
            {place && (
              <>
                <span className="hidden sm:block">•</span>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{place}</span>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 justify-center">
            <div className="flex items-center gap-4 px-6 py-3 rounded-lg bg-card/50 backdrop-blur-sm">
              <Users className="w-6 h-6 text-purple-500" />
              <div className="text-left">
                <p className="text-sm text-muted-foreground">Players</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                  {playerCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
