import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, Star, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeaderboardEntry, RankingType } from "@/types/leaderboard";

const RankIcon = ({ position }: { position: number }) => {
  if (position === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
  if (position === 2) return <Medal className="w-6 h-6 text-gray-400" />;
  if (position === 3) return <Medal className="w-6 h-6 text-amber-600" />;
  return <Star className="w-6 h-6 text-muted-foreground" />;
};

const ROIIndicator = ({ value }: { value: number }) => {
  const isPositive = value >= 0;
  return (
    <div className={cn(
      "flex items-center gap-1",
      isPositive ? "text-green-500" : "text-red-500"
    )}>
      {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
      <span>{value.toFixed(1)}%</span>
    </div>
  );
};

interface PlayerCardProps {
  entry: LeaderboardEntry;
  position: number;
  rankingType: RankingType;
}

export const LeaderboardCard = ({ entry, position, rankingType }: PlayerCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayValue = rankingType === "total" 
    ? entry.net_earnings 
    : entry.average_net_earnings;
  
  return (
    <Card 
      className={cn(
        "p-4 mb-3 transition-all cursor-pointer hover:scale-[1.02] animate-fade-in bg-card/80 backdrop-blur-sm border-primary/10 hover:border-primary/20",
        isExpanded && "bg-card/50"
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-8 h-8">
          <RankIcon position={position} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{entry.player_name}</span>
            <ROIIndicator value={entry.roi_percentage} />
          </div>
          <div className="text-sm text-muted-foreground">
            {entry.games_played} games played
          </div>
        </div>
        
        <div className={cn(
          "text-right",
          displayValue >= 0 ? "text-green-500" : "text-red-500"
        )}>
          <div className="font-bold">
            {rankingType === "total" 
              ? `$${displayValue}` 
              : `$${displayValue.toFixed(2)}`}
          </div>
          <div className="text-sm text-muted-foreground">
            <DollarSign className="w-3 h-3 inline" />
            {entry.total_spent} spent
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-4 pt-4 border-t animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Average ROI per Game</div>
              <div className="font-semibold">
                <ROIIndicator value={entry.average_roi} />
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Best Game ROI</div>
              <div className="font-semibold">
                <ROIIndicator value={entry.best_game_roi} />
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Worst Game ROI</div>
              <div className="font-semibold">
                <ROIIndicator value={entry.worst_game_roi} />
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Investment</div>
              <div className="font-semibold">${entry.total_spent}</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};