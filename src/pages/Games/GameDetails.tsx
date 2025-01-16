import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  // Track rebuys and results for each player
  const [rebuys, setRebuys] = useState<Record<string, number>>({});
  const [results, setResults] = useState<Record<string, number>>({});

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

        // Initialize rebuys and results state with current values
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Game Details</h1>
          {game.status === "ongoing" && (
            <Button 
              onClick={finalizeGame} 
              disabled={finalizing}
              variant="destructive"
            >
              {finalizing ? "Finalizing..." : "Finalize Game"}
            </Button>
          )}
        </div>
        
        <Card className="p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Game Information</h2>
            <p>Date: {new Date(game.date).toLocaleDateString()}</p>
            <p>Status: {game.status}</p>
          </div>

          {game.status === "ongoing" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Rebuys</h2>
                <div className="grid gap-4 mb-4">
                  {game.players.map((gamePlayer) => (
                    <div key={gamePlayer.id} className="flex items-center gap-4">
                      <span className="min-w-[150px]">{gamePlayer.player.name}</span>
                      <Input
                        type="number"
                        value={rebuys[gamePlayer.id] || 0}
                        onChange={(e) => handleRebuyChange(gamePlayer.id, e.target.value)}
                        className="max-w-[120px]"
                      />
                    </div>
                  ))}
                </div>
                <Button 
                  onClick={saveRebuys} 
                  disabled={savingRebuys}
                  className="w-full md:w-auto"
                >
                  {savingRebuys ? "Saving..." : "Save Rebuys"}
                </Button>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Final Results</h2>
                <div className="grid gap-4 mb-4">
                  {game.players.map((gamePlayer) => (
                    <div key={gamePlayer.id} className="flex items-center gap-4">
                      <span className="min-w-[150px]">{gamePlayer.player.name}</span>
                      <Input
                        type="number"
                        value={results[gamePlayer.id] || 0}
                        onChange={(e) => handleResultChange(gamePlayer.id, e.target.value)}
                        className="max-w-[120px]"
                      />
                    </div>
                  ))}
                </div>
                <Button 
                  onClick={saveResults} 
                  disabled={savingResults}
                  className="w-full md:w-auto"
                >
                  {savingResults ? "Saving..." : "Save Results"}
                </Button>
              </div>
            </div>
          )}

          {game.status === "completed" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Final Results</h2>
              <div className="grid gap-4">
                {game.players.map((gamePlayer) => (
                  <div key={gamePlayer.id} className="flex justify-between items-center">
                    <span>{gamePlayer.player.name}</span>
                    <span>Final Result: ${gamePlayer.final_result || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default GameDetails;