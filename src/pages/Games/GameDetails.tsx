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

const GameDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showFinalizeForm, setShowFinalizeForm] = useState(false);
  const { game, loading, hasBalanceError, refreshGame } = useGameDetails(id);

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
            onDeleteGame={() => {
              navigate("/games");
            }}
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
              refreshGame={() => {
                console.log("Refreshing game from container...");
                refreshGame();
              }}
            />
          </>
        )}

        <GameActions 
          status={game.status}
          onStartGame={() => {
            console.log("Starting game...");
            refreshGame();
          }}
          onShowFinalizeForm={() => setShowFinalizeForm(true)}
        />
      </div>
    </div>
  );
};

export default GameDetails;