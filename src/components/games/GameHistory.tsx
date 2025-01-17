import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Save, Trash, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface GameHistoryEntry {
  id: string;
  event_type: 'rebuy' | 'result_update';
  amount: number;
  created_at: string;
  game_player_id: string;
  game_players: {
    player: {
      name: string;
    };
    total_rebuys: number;
  };
}

interface GameHistoryProps {
  gameId: string;
  onHistoryUpdate?: () => void;
}

export const GameHistory = ({ gameId, onHistoryUpdate }: GameHistoryProps) => {
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const { toast } = useToast();

  const fetchHistory = async () => {
    try {
      console.log("Fetching game history for game:", gameId);
      const { data, error } = await supabase
        .from('game_history')
        .select(`
          id,
          event_type,
          amount,
          created_at,
          game_player_id,
          game_players!fk_game_history_game_player (
            player:players (
              name
            ),
            total_rebuys
          )
        `)
        .eq('game_id', gameId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log("Game history data:", data);
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching game history:', error);
      toast({
        title: "Error",
        description: "Failed to load game history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [gameId]);

  const handleEdit = (entry: GameHistoryEntry) => {
    setEditingId(entry.id);
    setEditAmount(entry.amount);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditAmount(0);
  };

  const handleSave = async (entry: GameHistoryEntry) => {
    try {
      console.log(`Updating history entry ${entry.id} to amount ${editAmount}`);
      
      // Update the history entry
      const { error: historyError } = await supabase
        .from("game_history")
        .update({ amount: editAmount })
        .eq("id", entry.id);

      if (historyError) throw historyError;

      // If it's a rebuy, update the game_players total_rebuys
      if (entry.event_type === 'rebuy') {
        const { data: gamePlayerData, error: gamePlayerError } = await supabase
          .from("game_players")
          .select('total_rebuys')
          .eq("id", entry.game_player_id)
          .single();

        if (gamePlayerError) throw gamePlayerError;

        const currentRebuys = gamePlayerData.total_rebuys;
        const difference = editAmount - entry.amount;
        const newTotalRebuys = currentRebuys + difference;

        const { error: updateError } = await supabase
          .from("game_players")
          .update({ total_rebuys: newTotalRebuys })
          .eq("id", entry.game_player_id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Success",
        description: "History entry updated successfully",
      });
      
      setEditingId(null);
      fetchHistory();
      if (onHistoryUpdate) onHistoryUpdate();
    } catch (error) {
      console.error("Error updating history entry:", error);
      toast({
        title: "Error",
        description: "Failed to update history entry",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (entry: GameHistoryEntry) => {
    try {
      console.log(`Deleting history entry ${entry.id}`);
      
      // Delete the history entry
      const { error: deleteError } = await supabase
        .from("game_history")
        .delete()
        .eq("id", entry.id);

      if (deleteError) throw deleteError;

      // If it's a rebuy, update the game_players total_rebuys
      if (entry.event_type === 'rebuy') {
        const { data: gamePlayerData, error: gamePlayerError } = await supabase
          .from("game_players")
          .select('total_rebuys')
          .eq("id", entry.game_player_id)
          .single();

        if (gamePlayerError) throw gamePlayerError;

        const currentRebuys = gamePlayerData.total_rebuys;
        const newTotalRebuys = currentRebuys - entry.amount;

        const { error: updateError } = await supabase
          .from("game_players")
          .update({ total_rebuys: newTotalRebuys })
          .eq("id", entry.game_player_id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Success",
        description: "History entry deleted successfully",
      });
      
      fetchHistory();
      if (onHistoryUpdate) onHistoryUpdate();
    } catch (error) {
      console.error("Error deleting history entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete history entry",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading history...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Game History</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Player</TableHead>
            <TableHead>Event</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>
                {new Date(entry.created_at).toLocaleString()}
              </TableCell>
              <TableCell>
                {entry.game_players?.player?.name || 'Unknown Player'}
              </TableCell>
              <TableCell>
                {entry.event_type === 'rebuy' ? 'Rebuy' : 'Result Update'}
              </TableCell>
              <TableCell className="text-right">
                {editingId === entry.id ? (
                  <Input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(Number(e.target.value))}
                    className="w-20 ml-auto"
                  />
                ) : (
                  `$${entry.amount || 0}`
                )}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  {editingId === entry.id ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSave(entry)}
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
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(entry)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete History Entry</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this history entry? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(entry)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};