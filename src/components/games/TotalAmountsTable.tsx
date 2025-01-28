import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GamePlayer } from "@/types/game";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PlayerRow } from "./table/PlayerRow";
import { TotalRow } from "./table/TotalRow";

interface TotalAmountsTableProps {
  players: GamePlayer[];
}

export const TotalAmountsTable = ({ players }: TotalAmountsTableProps) => {
  const { toast } = useToast();

  // Sort players alphabetically by name
  const sortedPlayers = [...players].sort((a, b) => 
    a.player.name.localeCompare(b.player.name)
  );

  const handleUpdateRebuys = async (playerId: string, newValue: number) => {
    try {
      console.log(`Updating rebuys for player ${playerId} to ${newValue}`);
      
      const { error } = await supabase
        .from("game_players")
        .update({ total_rebuys: newValue })
        .eq("id", playerId);

      if (error) throw error;

      // Get the player and game info for history
      const player = players.find(p => p.id === playerId);
      if (!player) throw new Error("Player not found");

      // Add to game history
      const { error: historyError } = await supabase
        .from("game_history")
        .insert({
          game_id: player.game_id,
          game_player_id: player.id,
          event_type: "rebuy",
          amount: newValue
        });

      if (historyError) throw historyError;

      toast({
        title: "Success",
        description: "Rebuys updated successfully",
      });
    } catch (error) {
      console.error("Error updating rebuys:", error);
      toast({
        title: "Error",
        description: "Failed to update rebuys",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Total Amounts In Game</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player Name</TableHead>
            <TableHead className="text-right">Number of Rebuys</TableHead>
            <TableHead className="text-right">Total Amount</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPlayers.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              onUpdateRebuys={handleUpdateRebuys}
            />
          ))}
          <TotalRow players={sortedPlayers} />
        </TableBody>
      </Table>
    </div>
  );
};