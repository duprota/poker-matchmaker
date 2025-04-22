
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CHART_COLORS } from "@/hooks/use-player-progress-data";
import { useIsMobile } from "@/hooks/use-mobile";

type PlayerData = {
  player_name: string;
  games_data: any[];
  games_count?: number;
};

interface PlayerSelectionProps {
  playersData: PlayerData[];
  selectedPlayers: string[];
  onPlayerSelect: (players: string[]) => void;
}

export const PlayerSelection = ({ 
  playersData, 
  selectedPlayers, 
  onPlayerSelect 
}: PlayerSelectionProps) => {
  const isMobile = useIsMobile();
  
  const getPlayerColor = (playerName: string) => {
    const playerIndex = playersData.findIndex(p => p.player_name === playerName);
    return CHART_COLORS[playerIndex % CHART_COLORS.length];
  };

  return (
    <ScrollArea className="w-full pb-2">
      <div className="flex flex-wrap gap-1.5 pb-2">
        {playersData.map((player) => {
          const playerColor = getPlayerColor(player.player_name);
          const gamesCount = player.games_count || player.games_data.length;
          
          return (
            <Badge 
              key={player.player_name}
              variant={selectedPlayers.includes(player.player_name) ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: selectedPlayers.includes(player.player_name) 
                  ? playerColor
                  : undefined,
                color: selectedPlayers.includes(player.player_name) 
                  ? 'white' 
                  : undefined,
                fontSize: isMobile ? '0.65rem' : '0.75rem',
                padding: isMobile ? '0.15rem 0.5rem' : undefined
              }}
              onClick={() => {
                if (selectedPlayers.includes(player.player_name)) {
                  onPlayerSelect(selectedPlayers.filter(p => p !== player.player_name));
                } else {
                  onPlayerSelect([...selectedPlayers, player.player_name]);
                }
              }}
            >
              {player.player_name} ({gamesCount})
            </Badge>
          );
        })}
      </div>
    </ScrollArea>
  );
};
