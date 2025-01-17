import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GameHeader } from "@/components/games/GameHeader";
import { GameInformation } from "@/components/games/GameInformation";
import { OngoingGameForm } from "@/components/games/OngoingGameForm";
import { CompletedGameTable } from "@/components/games/CompletedGameTable";
import { PaymentManagement } from "@/components/games/PaymentManagement";
import { GameHistory } from "@/components/games/GameHistory";
import { TotalAmountsTable } from "@/components/games/TotalAmountsTable";
import { GameMoneyFlowChart } from "@/components/games/GameMoneyFlowChart";
import { useGameDetails } from "@/hooks/useGameDetails";
import { calculateTotalBuyInsAndRebuys, calculateTotalResults, calculateFinalResult, calculateTotals } from "@/components/games/GameCalculations";
import { supabase } from "@/integrations/supabase/client";

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

  const [savingRebuys, setSavingRebuys] = useState(false);
  const [savingResults, setSavingResults] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [rebuys, setRebuys] = useState<Record<string, number>>({});
  const [results, setResults] = useState<Record<string, number>>({});
  const [gameHistory, setGameHistory] = useState<any[]>([]);

  const handleRebuyChange = (playerId: string, value: string) => {
    setRebuys(prev => ({
      ...prev,
      [playerId]: parseInt(value) || 0
    }));
  };

  const handleResultChange = (playerId: string, value: string) => {
    setResults(prev => ({
      ...prev,
      [playerId]: parseInt(value) || 0
    }));
  };

  const saveRebuys = async () => {
    setSavingRebuys(true);
    try {
      for (const [playerId, rebuyAmount] of Object.entries(rebuys)) {
        const gamePlayer = game?.players.find(p => p.id === playerId);
        if (!gamePlayer) continue;

        const { error } = await supabase
          .from("game_players")
          .update({ total_rebuys: rebuyAmount })
          .eq("id", playerId);

        if (error) throw error;

        const { error: historyError } = await supabase
          .from("game_history")
          .insert({
            game_id: id,
            game_player_id: playerId,
            event_type: 'rebuy',
            amount: rebuyAmount
          });

        if (historyError) throw historyError;
      }
      toast({
        title: "Success",
        description: "Rebuys updated successfully",
      });
    } catch (error) {
      console.error("Error saving rebuys:", error);
      toast({
        title: "Error",
        description: "Failed to save rebuys",
        variant: "destructive",
      });
    } finally {
      setSavingRebuys(false);
    }
  };

  const saveResults = async () => {
    setSavingResults(true);
    try {
      if (!game) return;
      
      const updatedPlayers = game.players.map(player => ({
        ...player,
        final_result: results[player.id] || 0
      }));
      
      const totalBuyIns = calculateTotalBuyInsAndRebuys(updatedPlayers);
      const totalResults = calculateTotalResults(updatedPlayers);
      
      if (totalBuyIns !== totalResults) {
        toast({
          title: "Error",
          description: "The sum of final results must equal the total buy-ins and rebuys",
          variant: "destructive",
        });
        return;
      }

      for (const [playerId, result] of Object.entries(results)) {
        const gamePlayer = game.players.find(p => p.id === playerId);
        if (!gamePlayer) continue;

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
      toast({
        title: "Success",
        description: "Results saved successfully",
      });
    } catch (error) {
      console.error("Error saving results:", error);
      toast({
        title: "Error",
        description: "Failed to save results",
        variant: "destructive",
      });
    } finally {
      setSavingResults(false);
    }
  };

  const finalizeGame = async () => {
    if (!game) return;
    
    setFinalizing(true);
    try {
      const totalBuyIns = calculateTotalBuyInsAndRebuys(game.players);
      const totalResults = calculateTotalResults(game.players);
      
      if (totalBuyIns !== totalResults) {
        toast({
          title: "Error",
          description: "Cannot finalize game: The sum of final results must equal the total buy-ins and rebuys",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("games")
        .update({ status: "completed" })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Game finalized successfully",
      });
      navigate("/games");
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

  const handleHistoryUpdate = () => {
    if (id) {
      console.log("Refreshing game details after history update");
      refreshGame();
    }
  };

  const fetchGameHistory = async () => {
    if (!id) return;
    
    try {
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
        .eq('game_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setGameHistory(data || []);
    } catch (error) {
      console.error('Error fetching game history:', error);
      toast({
        title: "Error",
        description: "Failed to load game history",
        variant: "destructive",
      });
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
        <GameHeader 
          status={game.status}
          onFinalize={finalizeGame}
          onDelete={handleDeleteGame}
          finalizing={finalizing}
        />
        
        <Card className="p-6 mb-6">
          <GameInformation 
            date={game.date}
            status={game.status}
            hasBalanceError={hasBalanceError}
            totalBuyInsAndRebuys={calculateTotalBuyInsAndRebuys(game.players)}
            totalResults={calculateTotalResults(game.players)}
            players={game.players}
          />

          {game.status === "ongoing" && (
            <OngoingGameForm
              players={game.players}
              rebuys={rebuys}
              results={results}
              onRebuyChange={handleRebuyChange}
              onResultChange={handleResultChange}
              onSaveRebuys={saveRebuys}
              onSaveResults={saveResults}
              savingRebuys={savingRebuys}
              savingResults={savingResults}
              setRebuys={setRebuys}
            />
          )}

          {game.status === "completed" && (
            <CompletedGameTable
              players={game.players}
              calculateFinalResult={calculateFinalResult}
              totals={calculateTotals(game.players)}
              onUpdateResults={updatePlayerResult}
            />
          )}

          <div className="mt-8">
            <TotalAmountsTable players={game.players} />
          </div>

          {game.status === "completed" && (
            <PaymentManagement
              players={game.players}
              calculateFinalResult={calculateFinalResult}
              onUpdatePaymentStatus={updatePaymentStatus}
            />
          )}

          <div className="mt-8">
            <GameHistory 
              gameId={id || ''} 
              onHistoryUpdate={handleHistoryUpdate}
            />
          </div>

          <GameMoneyFlowChart 
            players={game.players}
            gameHistory={gameHistory}
          />
        </Card>
      </div>
    </div>
  );
};

export default GameDetails;
