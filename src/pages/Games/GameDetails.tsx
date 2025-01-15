import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface GamePlayer {
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
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
        <h1 className="text-3xl font-bold text-white mb-6">Game Details</h1>
        
        <Card className="p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Game Information</h2>
            <p>Date: {new Date(game.date).toLocaleDateString()}</p>
            <p>Status: {game.status}</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Players</h2>
            <div className="grid gap-4">
              {game.players.map((gamePlayer, index) => (
                <Card key={index} className="p-4">
                  <h3 className="font-semibold">{gamePlayer.player.name}</h3>
                  <p>Initial Buy-in: ${gamePlayer.initial_buyin}</p>
                  <p>Total Rebuys: ${gamePlayer.total_rebuys}</p>
                  {gamePlayer.final_result !== null && (
                    <p>Final Result: ${gamePlayer.final_result}</p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GameDetails;