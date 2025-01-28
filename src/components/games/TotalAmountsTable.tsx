import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GamePlayer } from "@/types/game";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Save, X } from "lucide-react";

interface TotalAmountsTableProps {
  players: GamePlayer[];
}

export const TotalAmountsTable = ({ players }: TotalAmountsTableProps) => {
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const { toast } = useToast();

  // Sort players alphabetically by name
  const sortedPlayers = [...players].sort((a, b) => 
    a.player.name.localeCompare(b.player.name)
  );

  const calculateTotalAmount = (player: GamePlayer) => {
    return player.initial_buyin + (player.total_rebuys * player.initial_buyin);
  };

  const handleEdit = (player: GamePlayer) => {
    setEditingPlayerId(player.id);
    setEditValue(player.total_rebuys);
  };

  const handleCancel = () => {
    setEditingPlayerId(null);
    setEditValue(0);
  };

  const handleSave = async (player: GamePlayer) => {
    try {
      console.log(`Updating rebuys for player ${player.id} to ${editValue}`);
      
      const { error } = await supabase
        .from("game_players")
        .update({ total_rebuys: editValue })
        .eq("id", player.id);

      if (error) throw error;

      // Add to game history
      const { error: historyError } = await supabase
        .from("game_history")
        .insert({
          game_id: player.game_id,
          game_player_id: player.id,
          event_type: "rebuy",
          amount: editValue
        });

      if (historyError) throw historyError;

      toast({
        title: "Success",
        description: "Rebuys updated successfully",
      });
      
      setEditingPlayerId(null);
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
            <TableRow key={player.id}>
              <TableCell>{player.player.name}</TableCell>
              <TableCell className="text-right">
                {editingPlayerId === player.id ? (
                  <Input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(Number(e.target.value))}
                    className="w-20 ml-auto"
                  />
                ) : (
                  player.total_rebuys
                )}
              </TableCell>
              <TableCell className="text-right">
                ${calculateTotalAmount(player)}
              </TableCell>
              <TableCell className="text-right">
                {editingPlayerId === player.id ? (
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSave(player)}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCancel}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(player)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell className="font-semibold">Total</TableCell>
            <TableCell className="text-right font-semibold">
              {players.reduce((acc, player) => acc + player.total_rebuys, 0)}
            </TableCell>
            <TableCell className="text-right font-semibold">
              ${players.reduce((acc, player) => acc + calculateTotalAmount(player), 0)}
            </TableCell>
            <TableCell />
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};