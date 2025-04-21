
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { useGameDetails } from "@/hooks/useGameDetails";
import { GameHeader } from "@/components/games/GameHeader";
import { GameInformation } from "@/components/games/GameInformation";
import { GameContainer } from "@/components/games/GameContainer";
import { GameActions } from "@/components/games/GameActions";
import { FinalizeGameForm } from "@/components/games/FinalizeGameForm";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";

const GameDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast: toastNotification } = useToast();
  const [showFinalizeForm, setShowFinalizeForm] = useState(false);
  const { game, loading, hasBalanceError, refreshGame } = useGameDetails(id);

  const handleDeleteGame = async () => {
    if (!game?.id) return;

    try {
      console.log("Deleting game:", game.id);
      const { error } = await supabase
        .from("games")
        .delete()
        .eq("id", game.id);

      if (error) throw error;

      toast.success("Jogo excluído", {
        description: "O jogo foi excluído com sucesso",
      });
      
      navigate("/games");
    } catch (error) {
      console.error("Error deleting game:", error);
      toast.error("Erro ao excluir jogo", {
        description: "Não foi possível excluir o jogo. Tente novamente.",
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

      toast.success("Jogo iniciado", {
        description: "O jogo foi iniciado com sucesso",
      });
      
      refreshGame();
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error("Erro ao iniciar jogo", {
        description: "Não foi possível iniciar o jogo. Tente novamente.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8 px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8 px-4">
          <h1 className="text-2xl font-bold text-foreground mb-4">Game not found</h1>
          <Button onClick={() => navigate("/games")}>Back to Games</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto py-8 px-4 pb-32">
        <div className="mb-8">
          <GameHeader 
            status={game.status}
            onDeleteGame={handleDeleteGame}
          />
        </div>

        {showFinalizeForm ? (
          <FinalizeGameForm
            isOpen={showFinalizeForm}
            onClose={() => setShowFinalizeForm(false)}
            players={game.players}
            onFinalize={async () => {
              console.log("Game finalized, refreshing...");
              refreshGame();
            }}
          />
        ) : (
          <>
            <GameInformation
              date={game.date}
              status={game.status}
              name={game.name}
              hasBalanceError={hasBalanceError}
              totalBuyInsAndRebuys={0}
              totalResults={0}
              players={game.players}
            />

            <GameContainer 
              game={game}
              refreshGame={refreshGame}
            />
          </>
        )}

        <GameActions 
          status={game.status}
          onStartGame={handleStartGame}
          onShowFinalizeForm={() => setShowFinalizeForm(true)}
        />
      </div>
    </div>
  );
};

export default GameDetails;
