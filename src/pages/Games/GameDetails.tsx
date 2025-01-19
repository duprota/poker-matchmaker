import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GameHeader } from "@/components/games/GameHeader";
import { GameInformation } from "@/components/games/GameInformation";
import { CompletedGameTable } from "@/components/games/CompletedGameTable";
import { GameMoneyFlowChart } from "@/components/games/GameMoneyFlowChart";
import { GameSummary } from "@/components/games/GameSummary";
import { FinalizeGameForm } from "@/components/games/FinalizeGameForm";
import { PlayerRebuysCard } from "@/components/games/PlayerRebuysCard";
import { useGameDetails } from "@/hooks/useGameDetails";
import { calculateTotalBuyInsAndRebuys, calculateTotalResults } from "@/components/games/GameCalculations";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
import { useIsMobile } from "@/hooks/use-mobile";

const GameDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    game,
    loading,
    hasBalanceError,
    updatePlayerResult,
    updatePaymentStatus,
    refreshGame
  } = useGameDetails(id);

  const [finalizing, setFinalizing] = useState(false);
  const [showFinalizeForm, setShowFinalizeForm] = useState(false);
  const [gameHistory, setGameHistory] = useState<any[]>([]);

  const fetchGameHistory = async () => {
    try {
      console.log("Fetching game history for game:", id);
      const { data, error } = await supabase
        .from('game_history')
        .select(`
          id,
          event_type,
          amount,
          created_at,
          game_player_id,
          game_players!fk_game_history_game_player (
            players (
              name
            ),
            initial_buyin,
            total_rebuys
          )
        `)
        .eq('game_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log("Game history data:", data);
      setGameHistory(data || []);
    } catch (error) {
      console.error("Error fetching game history:", error);
      toast({
        title: "Error",
        description: "Failed to load game history",
        variant: "destructive",
      });
    }
  };

  const handleRebuyChange = async (playerId: string, newRebuys: number) => {
    try {
      const { error } = await supabase
        .from("game_players")
        .update({ total_rebuys: newRebuys })
        .eq("id", playerId);

      if (error) throw error;

      const { error: historyError } = await supabase
        .from("game_history")
        .insert({
          game_id: id,
          game_player_id: playerId,
          event_type: 'rebuy',
          amount: newRebuys
        });

      if (historyError) throw historyError;

      refreshGame();
      fetchGameHistory();
    } catch (error) {
      console.error("Error updating rebuys:", error);
      throw error;
    }
  };

  const handleFinalize = async (results: Record<string, number>) => {
    if (!game) return;
    
    setFinalizing(true);
    try {
      // Save all final results
      for (const [playerId, result] of Object.entries(results)) {
        const { error } = await supabase
          .from("game_players")
          .update({ final_result: result })
          .eq("id", playerId);

        if (error) throw error;

        const { error: historyError } = await supabase
          .from("game_history")
          .insert({
            game_id: id,
            game_player_id: playerId,
            event_type: 'result_update',
            amount: result
          });

        if (historyError) throw historyError;
      }

      // Update game status to completed
      const { error } = await supabase
        .from("games")
        .update({ status: "completed" })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Game finalized successfully",
      });
      
      refreshGame();
      setShowFinalizeForm(false);
    } catch (error) {
      console.error("Error finalizing game:", error);
      toast({
        title: "Error",
        description: "Failed to finalize game",
        variant: "destructive",
      });
    } finally {
      setFinalizing(false);
    }
  };

  const handleDeleteGame = async () => {
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

  useEffect(() => {
    fetchGameHistory();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8">
          <p className="text-white">Loading game details...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8">
          <p className="text-white">Game not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8">
        <GameHeader status={game.status} />
        
        <Card className="p-6 mb-6">
          {game.status === "completed" ? (
            <GameSummary 
              players={game.players}
              gameHistory={gameHistory}
              date={game.date}
            />
          ) : (
            <>
              <GameInformation 
                date={game.date}
                status={game.status}
                hasBalanceError={hasBalanceError}
                totalBuyInsAndRebuys={calculateTotalBuyInsAndRebuys(game.players)}
                totalResults={calculateTotalResults(game.players)}
                players={game.players}
              />

              <div className="grid gap-4 mt-8">
                {game.players.map((player) => (
                  <PlayerRebuysCard
                    key={player.id}
                    player={player}
                    onRebuyChange={handleRebuyChange}
                  />
                ))}
              </div>

              <GameMoneyFlowChart 
                players={game.players}
                gameHistory={gameHistory}
              />
            </>
          )}
        </Card>

        <FinalizeGameForm 
          isOpen={showFinalizeForm}
          onClose={() => setShowFinalizeForm(false)}
          players={game.players}
          onFinalize={handleFinalize}
        />

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <div className="container mx-auto flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
            {game.status === "ongoing" && (
              <Button 
                onClick={() => setShowFinalizeForm(true)} 
                disabled={finalizing}
                variant="destructive"
                className="w-full sm:w-auto"
              >
                {finalizing ? "Finalizing..." : "Finalize Game"}
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline"
                  className="w-full sm:w-auto text-muted-foreground hover:text-destructive transition-colors"
                >
                  Delete Game
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className={isMobile ? "w-[95vw]" : ""}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to delete this game?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the game and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className={isMobile ? "flex-col gap-2" : ""}>
                  <AlertDialogCancel className={isMobile ? "w-full" : ""}>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteGame}
                    className={isMobile ? "w-full" : ""}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetails;