import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Game } from "@/types/game";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { OngoingGameForm } from "./OngoingGameForm";
import { GameMoneyFlowChart } from "./GameMoneyFlowChart";

interface GameContainerProps {
  game: Game;
  refreshGame: () => void;
}

export const GameContainer = ({ game, refreshGame }: GameContainerProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDeleteGame = async () => {
    if (!game?.id) return;

    try {
      console.log("Deleting game:", game.id);
      const { error } = await supabase
        .from("games")
        .delete()
        .eq("id", game.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Game deleted successfully",
      });
      
      navigate("/games");
    } catch (error) {
      console.error("Error deleting game:", error);
      toast({
        title: "Error",
        description: "Failed to delete game",
        variant: "destructive",
      });
    }
  };

  const handleStartGame = async () => {
    if (!game?.id) return;

    try {
      console.log("Starting game:", game.id);
      const { error } = await supabase
        .from("games")
        .update({ 
          status: "ongoing",
          started_at: new Date().toISOString()
        })
        .eq("id", game.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Game started successfully",
      });
      
      refreshGame();
    } catch (error) {
      console.error("Error starting game:", error);
      toast({
        title: "Error",
        description: "Failed to start game",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid gap-8">
      <div className="grid gap-4">
        {game.status === "ongoing" && (
          <OngoingGameForm
            players={game.players}
            rebuys={{}}
            onRebuyChange={() => {}}
            onSaveRebuys={() => {}}
            savingRebuys={false}
            setRebuys={() => {}}
          />
        )}
      </div>

      <GameMoneyFlowChart
        players={game.players}
        gameHistory={[]}
      />
    </div>
  );
};