import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, Star, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeaderboardEntry, RankingType } from "@/types/leaderboard";
import { SpecialHandIcon, SpecialHandType } from "@/components/shared/SpecialHandIcon";

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

const calculateTotalSpecialHands = (specialHands: { [key: string]: number } = {}) => {
  return Object.values(specialHands).reduce((sum, count) => sum + count, 0);
};

interface PlayerCardProps {
  entry: LeaderboardEntry;
  position: number;
  rankingType: RankingType;
}

export const LeaderboardCard = ({ entry, position, rankingType }: PlayerCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalSpecialHands = calculateTotalSpecialHands(entry.special_hands);
  
  const displayValue = rankingType === "total" 
    ? entry.net_earnings 
    : rankingType === "average"
    ? entry.average_net_earnings
    : totalSpecialHands;
  
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
            {rankingType !== "special" && (
              <ROIIndicator value={entry.roi_percentage} />
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {entry.games_played} games played
            {rankingType === "special" && totalSpecialHands > 0 && (
              <span className="ml-2">• {totalSpecialHands} special hands</span>
            )}
          </div>
        </div>
        
        <div className="text-right">
          {rankingType === "special" ? (
            <div className="font-bold text-primary">
              {displayValue} hands
            </div>
          ) : (
            <div className={cn(
              "font-bold",
              displayValue >= 0 ? "text-green-500" : "text-red-500"
            )}>
              ${typeof displayValue === "number" ? 
                (rankingType === "average" ? displayValue.toFixed(2) : displayValue)
                : 0}
            </div>
          )}
          {rankingType !== "special" && (
            <div className="text-sm text-muted-foreground">
              <DollarSign className="w-3 h-3 inline" />
              {entry.total_spent} spent
            </div>
          )}
        </div>
      </div>
      
      {isExpanded && entry.special_hands && (
        <div className="mt-4 pt-4 border-t animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(entry.special_hands).map(([handType, count]) => count > 0 && (
              <div key={handType} className="flex items-center gap-2">
                <SpecialHandIcon 
                  type={handType as SpecialHandType} 
                  showLabel 
                  size="sm" 
                />
                <span className="text-sm font-medium ml-1">{count}x</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
