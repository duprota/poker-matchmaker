import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { Game } from "@/types/game";

const Games = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        console.log("Fetching games...");
        const { data: gamesData, error: gamesError } = await supabase
          .from("games")
          .select("*")
          .order("date", { ascending: false });

        if (gamesError) {
          console.error("Error fetching games:", gamesError);
          throw gamesError;
        }

        // For each game, fetch its players
        const gamesWithPlayers = await Promise.all(
          gamesData.map(async (game) => {
            const { data: playersData, error: playersError } = await supabase
              .from("game_players")
              .select(`
                id,
                game_id,
                initial_buyin,
                total_rebuys,
                final_result,
                payment_status,
                payment_amount,
                player:players (
                  id,
                  name,
                  email
                )
              `)
              .eq("game_id", game.id);

            if (playersError) {
              console.error("Error fetching players for game:", playersError);
              throw playersError;
            }

            return {
              ...game,
              players: playersData,
            };
          })
        );

        console.log("Games with players:", gamesWithPlayers);
        setGames(gamesWithPlayers);
      } catch (error) {
        console.error("Error fetching games:", error);
        toast({
          title: "Error",
          description: "Failed to load games",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8">
          <p className="text-white">Loading games...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Games</h1>
          <Button asChild>
            <Link to="/games/new">New Game</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => (
            <Card key={game.id} className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    {game.name || "Game Details"}
                  </h3>
                  <p className="text-gray-600">
                    {new Date(game.date).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    game.status === "ongoing"
                      ? "bg-yellow-200 text-yellow-800"
                      : "bg-green-200 text-green-800"
                  }`}
                >
                  {game.status}
                </span>
              </div>
              <p className="text-gray-600 mb-4">
                Players: {game.players.map((p) => p.player.name).join(", ")}
              </p>
              <Button asChild variant="secondary" className="w-full">
                <Link to={`/games/${game.id}`}>View Details</Link>
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Games;