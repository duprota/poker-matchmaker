import { Game, GamePlayer } from "@/types/game";
import { OngoingGameForm } from "./OngoingGameForm";
import { GameMoneyFlowChart } from "./GameMoneyFlowChart";
import { Button } from "@/components/ui/button";
import { Plus, UserMinus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface GameContainerProps {
  game: Game;
  refreshGame: () => void;
}

export const GameContainer = ({ game, refreshGame }: GameContainerProps) => {
  const { toast } = useToast();
  const [showAddPlayerDialog, setShowAddPlayerDialog] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerEmail, setNewPlayerEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) {
      toast({
        description: "Player name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      console.log("Adding new player to game:", { name: newPlayerName, email: newPlayerEmail });

      // First, create or get the player
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("*")
        .eq("name", newPlayerName)
        .maybeSingle();

      let playerId;

      if (!playerData) {
        // Create new player if doesn't exist
        const { data: newPlayer, error: createError } = await supabase
          .from("players")
          .insert({ name: newPlayerName, email: newPlayerEmail })
          .select()
          .single();

        if (createError) throw createError;
        playerId = newPlayer.id;
      } else {
        playerId = playerData.id;
      }

      // Add player to game
      const { error: gamePlayerError } = await supabase
        .from("game_players")
        .insert({
          game_id: game.id,
          player_id: playerId,
          initial_buyin: game.players[0]?.initial_buyin || 100, // Use same buy-in as other players
          total_rebuys: 0
        });

      if (gamePlayerError) throw gamePlayerError;

      toast({
        description: "Player added successfully",
      });

      setShowAddPlayerDialog(false);
      setNewPlayerName("");
      setNewPlayerEmail("");
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

  return (
    <div className="grid gap-8">
      {game.status === "created" && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Manage Players</h3>
          <Button 
            onClick={() => setShowAddPlayerDialog(true)}
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
              Add a new player to the game. If the player doesn't exist, they will be created.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Enter player name"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                value={newPlayerEmail}
                onChange={(e) => setNewPlayerEmail(e.target.value)}
                placeholder="Enter player email"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => setShowAddPlayerDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPlayer}
              disabled={isProcessing || !newPlayerName.trim()}
            >
              {isProcessing ? "Adding..." : "Add Player"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};