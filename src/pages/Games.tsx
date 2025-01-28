import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { Game, GameStatus } from "@/types/game";

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
              status: game.status as GameStatus,
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
          <p className="text-foreground font-medium">Loading games...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-muted">
      <Navigation />
      <div className="container mx-auto py-8 animate-fade-in">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Games
          </h1>
          <Button 
            asChild
            className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Link to="/games/new">New Game</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Card 
              key={game.id} 
              className="p-6 bg-card/80 backdrop-blur-sm border-primary/10 hover:border-primary/20 transition-all duration-200 hover:shadow-lg group"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    {game.name || "Game Details"}
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    {new Date(game.date).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    game.status === "ongoing"
                      ? "bg-secondary/10 text-secondary"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {game.status}
                </span>
              </div>
              <p className="text-muted-foreground mb-4 line-clamp-2">
                Players: {game.players.map((p) => p.player.name).join(", ")}
              </p>
              <Button 
                asChild 
                variant="secondary" 
                className="w-full bg-secondary/10 hover:bg-secondary/20 text-secondary hover:text-secondary font-medium"
              >
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
