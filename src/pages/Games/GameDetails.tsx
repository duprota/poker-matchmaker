import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GameHeader } from "@/components/games/GameHeader";
import { GameInformation } from "@/components/games/GameInformation";
import { OngoingGameForm } from "@/components/games/OngoingGameForm";
import { CompletedGameTable } from "@/components/games/CompletedGameTable";

interface GamePlayer {
  id: string;
  player: {
    name: string;
    email: string;
  };
  initial_buyin: number;
  total_rebuys: number;
  final_result: number | null;
}

interface Game {
  id: string;
  date: string;
  status: string;
  players: GamePlayer[];
}

const GameDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingRebuys, setSavingRebuys] = useState(false);
  const [savingResults, setSavingResults] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const { toast } = useToast();

  const [rebuys, setRebuys] = useState<Record<string, number>>({});
  const [results, setResults] = useState<Record<string, number>>({});
  const [hasBalanceError, setHasBalanceError] = useState(false);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        console.log("Fetching game details for ID:", id);
        const { data: gameData, error: gameError } = await supabase
          .from("games")
          .select("*")
          .eq("id", id)
          .single();

        if (gameError) throw gameError;

        const { data: playersData, error: playersError } = await supabase
          .from("game_players")
          .select(`
            id,
            initial_buyin,
            total_rebuys,
            final_result,
            player:players (
              name,
              email
            )
          `)
          .eq("game_id", id);

        if (playersError) throw playersError;

        console.log("Game data:", gameData);
        console.log("Players data:", playersData);

        const initialRebuys: Record<string, number> = {};
        const initialResults: Record<string, number> = {};
        playersData.forEach((player) => {
          initialRebuys[player.id] = player.total_rebuys || 0;
          initialResults[player.id] = player.final_result || 0;
        });
        setRebuys(initialRebuys);
        setResults(initialResults);

        setGame({
          ...gameData,
          players: playersData,
        });

        if (gameData.status === 'completed') {
          checkBalance(playersData);
        }
      } catch (error) {
        console.error("Error fetching game:", error);
        toast({
          title: "Error",
          description: "Failed to load game details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchGame();
    }
  }, [id, toast]);

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

  const checkBalance = (players: GamePlayer[]) => {
    const totalBuyInsAndRebuys = players.reduce((acc, player) => {
      return acc + player.initial_buyin + (player.total_rebuys * player.initial_buyin);
    }, 0);

    const totalResults = players.reduce((acc, player) => {
      return acc + (player.final_result || 0);
    }, 0);

    const hasError = totalBuyInsAndRebuys !== totalResults;
    setHasBalanceError(hasError);
    return hasError;
  };

  const saveRebuys = async () => {
    setSavingRebuys(true);
    try {
      for (const [playerId, rebuyAmount] of Object.entries(rebuys)) {
        const { error } = await supabase
          .from("game_players")
          .update({ total_rebuys: rebuyAmount })
          .eq("id", playerId);

        if (error) throw error;
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
      const updatedPlayers = game!.players.map(player => ({
        ...player,
        final_result: results[player.id] || 0
      }));
      
      if (checkBalance(updatedPlayers)) {
        toast({
          title: "Error",
          description: "The sum of final results must equal the total buy-ins and rebuys",
          variant: "destructive",
        });
        return;
      }

      for (const [playerId, result] of Object.entries(results)) {
        const { error } = await supabase
          .from("game_players")
          .update({ final_result: result })
          .eq("id", playerId);

        if (error) throw error;
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
    setFinalizing(true);
    try {
      if (checkBalance(game!.players)) {
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

  const calculateFinalResult = (player: GamePlayer) => {
    const finalSum = player.final_result || 0;
    const buyIn = player.initial_buyin || 0;
    const rebuys = player.total_rebuys || 0;
    return finalSum - buyIn - (rebuys * buyIn);
  };

  const calculateTotals = () => {
    const totals = {
      buyIns: 0,
      rebuys: 0,
      finalSum: 0,
      finalResult: 0
    };

    game!.players.forEach(player => {
      totals.buyIns += player.initial_buyin;
      totals.rebuys += player.total_rebuys * player.initial_buyin;
      totals.finalSum += player.final_result || 0;
      totals.finalResult += calculateFinalResult(player);
    });

    return totals;
  };

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
          finalizing={finalizing}
        />
        
        <Card className="p-6 mb-6">
          <GameInformation 
            date={game.date}
            status={game.status}
            hasBalanceError={hasBalanceError}
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
            />
          )}

          {game.status === "completed" && (
            <CompletedGameTable
              players={game.players}
              calculateFinalResult={calculateFinalResult}
              totals={calculateTotals()}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default GameDetails;