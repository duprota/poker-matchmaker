import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Game {
  id: string;
  date: string;
  status: string;
  name: string | null;
  players: {
    name: string;
    initial_buyin: number;
  }[];
}

const fetchGames = async () => {
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
          initial_buyin,
          player:players (
            name
          )
        `)
        .eq("game_id", game.id);

      if (playersError) {
        console.error("Error fetching players for game:", game.id, playersError);
        throw playersError;
      }

      return {
        ...game,
        players: playersData.map((p) => ({
          name: p.player.name,
          initial_buyin: p.initial_buyin,
        })),
      };
    })
  );

  console.log("Games with players:", gamesWithPlayers);
  return gamesWithPlayers;
};

const Games = () => {
  const { toast } = useToast();
  
  const { 
    data: games, 
    isLoading, 
    error,
    isError
  } = useQuery({
    queryKey: ['games'],
    queryFn: fetchGames,
    retry: 2,
  });

  // Handle errors outside of the query configuration
  useEffect(() => {
    if (isError && error) {
      console.error("Error in games query:", error);
      toast({
        title: "Error",
        description: "Failed to load games. Please try again.",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Loading games...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8">
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load games. Please try refreshing the page.
            </AlertDescription>
          </Alert>
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

        {!games?.length ? (
          <Card className="p-6">
            <p className="text-center text-muted-foreground">
              No games found. Create your first game!
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((game) => (
              <Card key={game.id} className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {game.name || "Game Details"}
                    </h3>
                    <p className="text-muted-foreground">
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
                <p className="text-muted-foreground mb-4">
                  Players: {game.players.map((p) => p.name).join(", ")}
                </p>
                <Button asChild variant="secondary" className="w-full">
                  <Link to={`/games/${game.id}`}>View Details</Link>
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Games;