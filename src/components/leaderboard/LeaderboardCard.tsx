import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, Star, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeaderboardEntry, RankingType } from "@/types/leaderboard";
import { getArchetypeInfo } from "@/components/players/BehavioralProfileCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const archetypeInfo = getArchetypeInfo(entry.archetype);
  const displayValue = rankingType === "total" 
    ? entry.net_earnings 
    : entry.average_net_earnings;

  // Fetch elite badges for this player
  const { data: eliteBadges } = useQuery({
    queryKey: ["elite-badges", entry.player_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("player_badges" as any)
        .select("badge_code")
        .eq("player_id", entry.player_id)
        .eq("is_active", true)
        .in("badge_code", ["cabeca_chave", "podio", "craque_rodada"]);
      return data || [];
    },
    staleTime: 30000,
  });

  const eliteEmojis = (eliteBadges || []).map((b: any) => {
    if (b.badge_code === "cabeca_chave") return "🥇";
    if (b.badge_code === "podio") return "🥈";
    if (b.badge_code === "craque_rodada") return "⭐";
    return "";
  }).filter(Boolean);
  
  return (
    <Card 
      className={cn(
        "p-4 mb-3 transition-all hover:scale-[1.02] animate-fade-in bg-card/80 backdrop-blur-sm border-primary/10 hover:border-primary/20",
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-8 h-8">
          <RankIcon position={position} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {archetypeInfo && <span title={archetypeInfo.label}>{archetypeInfo.icon}</span>}
            <span className="font-semibold">{entry.player_name}</span>
            {eliteEmojis.map((e, i) => <span key={i} className="text-sm">{e}</span>)}
            <ROIIndicator value={entry.roi_percentage} />
          </div>
          <div className="text-sm text-muted-foreground">
            {entry.games_played} games played
          </div>
        </div>
        
        <div className="text-right">
          <div className={cn(
            "font-bold",
            displayValue >= 0 ? "text-green-500" : "text-red-500"
          )}>
            ${typeof displayValue === "number" ? 
              (rankingType === "average" ? displayValue.toFixed(2) : displayValue)
              : 0}
          </div>
          <div className="text-sm text-muted-foreground">
            <DollarSign className="w-3 h-3 inline" />
            {entry.total_spent} spent
          </div>
        </div>
      </div>
    </Card>
  );
};
