import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { useGameDetails } from "@/hooks/useGameDetails";
import { GameHeader } from "@/components/games/GameHeader";
import { GameInformation } from "@/components/games/GameInformation";
import { GameMoneyFlowChart } from "@/components/games/GameMoneyFlowChart";
import { OngoingGameForm } from "@/components/games/OngoingGameForm";
import { FinalizeGameForm } from "@/components/games/FinalizeGameForm";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { PlayIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GamePlayer } from "@/types/game";

const GameDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showFinalizeForm, setShowFinalizeForm] = useState(false);
  const { game, loading, hasBalanceError, updatePlayerResult, updatePaymentStatus, refreshGame } = useGameDetails(id);
  const [localPlayers, setLocalPlayers] = useState<GamePlayer[]>([]);

  useEffect(() => {
    if (game?.players) {
      setLocalPlayers(game.players);
    }
  }, [game?.players]);

  useEffect(() => {
    if (!id) return;

    console.log('Setting up real-time subscription for game:', id);
    
    const channel = supabase
      .channel('game-players-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_players',
          filter: `game_id=eq.${id}`
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          
          if (payload.eventType === 'UPDATE') {
            const updatedPlayer = payload.new as GamePlayer;
            setLocalPlayers(prevPlayers => 
              prevPlayers.map(player => 
                player.id === updatedPlayer.id ? { ...player, ...updatedPlayer } : player
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleDeleteGame = async () => {
    if (!id || !window.confirm("Are you sure you want to delete this game?")) return;

    try {
      console.log("Deleting game:", id);
      const { error } = await supabase
        .from("games")
        .delete()
        .eq("id", id);

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
    if (!id) return;

    try {
      console.log("Starting game:", id);
      const { error } = await supabase
        .from("games")
        .update({ 
          status: "ongoing",
          started_at: new Date().toISOString()
        })
        .eq("id", id);

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
      
      <div className="container mx-auto py-8 px-4">
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
            players={localPlayers}
            onFinalize={async (results) => {
              refreshGame();
            }}
          />
        ) : (
          <>
            <div className="grid gap-8">
              <GameInformation
                date={game.date}
                status={game.status}
                name={game.name}
                hasBalanceError={hasBalanceError}
                totalBuyInsAndRebuys={0}
                totalResults={0}
                players={localPlayers}
              />

              <GameMoneyFlowChart
                players={localPlayers}
                gameHistory={[]}
              />

              <div className="grid gap-4 mt-8">
                {game.status === "ongoing" && (
                  <OngoingGameForm
                    players={localPlayers}
                    rebuys={{}}
                    onRebuyChange={() => {}}
                    onSaveRebuys={() => {}}
                    savingRebuys={false}
                    setRebuys={() => {}}
                  />
                )}
              </div>
            </div>
          </>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t border-border">
          <div className="container mx-auto flex justify-end gap-4">
            {game.status === "created" && (
              <Button 
                onClick={handleStartGame}
                className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <PlayIcon className="w-4 h-4 mr-2" />
                Start Game
              </Button>
            )}
            {game.status === "ongoing" && (
              <Button 
                onClick={() => setShowFinalizeForm(true)} 
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Finalize Game
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetails;