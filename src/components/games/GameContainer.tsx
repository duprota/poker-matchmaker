import { Game, GamePlayer } from "@/types/game";
import { OngoingGameForm } from "./OngoingGameForm";
import { GameMoneyFlowChart } from "./GameMoneyFlowChart";
import { GameSummary } from "./GameSummary";
import { Button } from "@/components/ui/button";
import { Plus, UserMinus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface GameContainerProps {
  game: Game;
  refreshGame: () => void;
}

export const GameContainer = ({ game, refreshGame }: GameContainerProps) => {
  const { toast } = useToast();
  const [showAddPlayerDialog, setShowAddPlayerDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  const fetchPlayers = async () => {
    try {
      console.log("Fetching available players...");
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("name");

      if (error) throw error;

      // Filter out players already in the game
      const availablePlayers = data?.filter(
        (player) => !game.players.some((gp) => gp.player.id === player.id)
      );

      console.log("Available players:", availablePlayers);
      setPlayers(availablePlayers || []);
    } catch (error) {
      console.error("Error fetching players:", error);
      toast({
        description: "Failed to load players",
        variant: "destructive",
      });
    }
  };

  const handleAddPlayer = async () => {
    if (!selectedPlayer) {
      toast({
        description: "Please select a player",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      console.log("Adding player to game:", selectedPlayer);

      // Add player to game
      const { error: gamePlayerError } = await supabase
        .from("game_players")
        .insert({
          game_id: game.id,
          player_id: selectedPlayer.id,
          initial_buyin: game.players[0]?.initial_buyin || 100, // Use same buy-in as other players
          total_rebuys: 0
        });

      if (gamePlayerError) throw gamePlayerError;

      toast({
        description: "Player added successfully",
      });

      setShowAddPlayerDialog(false);
      setSelectedPlayer(null);
      refreshGame();

    } catch (error) {
      console.error("Error adding player:", error);
      toast({
        description: "Failed to add player",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    try {
      console.log("Removing player from game:", playerId);
      
      const { error } = await supabase
        .from("game_players")
        .delete()
        .eq("id", playerId);

      if (error) throw error;

      toast({
        description: "Player removed successfully",
      });

      refreshGame();
    } catch (error) {
      console.error("Error removing player:", error);
      toast({
        description: "Failed to remove player",
        variant: "destructive",
      });
    }
  };

  if (game.status === "completed") {
    return (
      <GameSummary 
        players={game.players}
        gameHistory={[]}
        date={game.date}
        name={game.name}
        place={game.place}
        startedAt={game.started_at}
        onUpdatePaymentStatus={async (playerId: string, status: string) => {
          try {
            console.log(`Updating payment status for player ${playerId} to ${status}`);
            const { error } = await supabase
              .from("game_players")
              .update({ payment_status: status })
              .eq("id", playerId);

            if (error) throw error;

            toast({
              description: "Payment status updated successfully",
            });

            refreshGame();
          } catch (error) {
            console.error("Error updating payment status:", error);
            toast({
              description: "Failed to update payment status",
              variant: "destructive",
            });
          }
        }}
      />
    );
  }

  return (
    <div className="grid gap-8">
      {game.status === "created" && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Manage Players</h3>
          <Button 
            onClick={() => {
              setShowAddPlayerDialog(true);
              fetchPlayers();
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Player
          </Button>
        </div>
      )}

      <div className="grid gap-4">
        {game.status === "ongoing" && (
          <OngoingGameForm
            players={game.players}
            rebuys={{}}
            onRebuyChange={() => {
              console.log("Rebuy change detected");
              refreshGame();
            }}
            onSaveRebuys={() => {
              console.log("Rebuys saved");
              refreshGame();
            }}
            savingRebuys={false}
            setRebuys={() => {
              console.log("Rebuys updated");
              refreshGame();
            }}
          />
        )}

        {game.status === "created" && (
          <div className="grid gap-4">
            {game.players.map((player) => (
              <div 
                key={player.id} 
                className="flex justify-between items-center p-4 bg-card rounded-lg border"
              >
                <div>
                  <p className="font-medium">{player.player.name}</p>
                  {player.player.email && (
                    <p className="text-sm text-muted-foreground">{player.player.email}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemovePlayer(player.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <UserMinus className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <GameMoneyFlowChart
        players={game.players}
        gameHistory={[]}
      />

      <Dialog open={showAddPlayerDialog} onOpenChange={setShowAddPlayerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Player</DialogTitle>
            <DialogDescription>
              Select an existing player to add to the game.
            </DialogDescription>
          </DialogHeader>

          <Command className="rounded-lg border shadow-md">
            <CommandInput placeholder="Search players..." />
            <CommandList>
              <CommandEmpty>No players found.</CommandEmpty>
              <CommandGroup>
                {players?.map((player) => (
                  <CommandItem
                    key={player.id}
                    onSelect={() => setSelectedPlayer(player)}
                    className="cursor-pointer"
                  >
                    <div className={`flex flex-col ${selectedPlayer?.id === player.id ? 'text-primary' : ''}`}>
                      <span className="font-medium">{player.name}</span>
                      {player.email && (
                        <span className="text-sm text-muted-foreground">{player.email}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddPlayerDialog(false);
                setSelectedPlayer(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPlayer}
              disabled={isProcessing || !selectedPlayer}
            >
              {isProcessing ? "Adding..." : "Add Player"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
