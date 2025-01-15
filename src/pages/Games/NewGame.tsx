import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Player = Tables<"players">;
type GamePlayer = Tables<"game_players">;

const NewGame = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<GamePlayer[]>([]);
  const [buyIn, setBuyIn] = useState<number>(100);

  const fetchPlayers = async () => {
    const { data, error } = await supabase.from("players").select("*");
    if (error) {
      console.error("Error fetching players:", error);
      toast({
        title: "Error",
        description: "Failed to load players",
        variant: "destructive",
      });
      return;
    }
    setPlayers(data);
  };

  const handleCreateGame = async () => {
    try {
      // Create new game
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .insert([{ status: "ongoing" }])
        .select()
        .single();

      if (gameError || !gameData) {
        throw new Error(gameError?.message || "Failed to create game");
      }

      // Add selected players to the game
      const gamePlayers = selectedPlayers.map((player) => ({
        game_id: gameData.id,
        player_id: player.player_id,
        initial_buyin: buyIn,
        total_rebuys: 0,
      }));

      const { error: playersError } = await supabase
        .from("game_players")
        .insert(gamePlayers);

      if (playersError) {
        throw new Error(playersError.message);
      }

      toast({
        title: "Success",
        description: "Game created successfully",
      });

      navigate("/games");
    } catch (error) {
      console.error("Error creating game:", error);
      toast({
        title: "Error",
        description: "Failed to create game",
        variant: "destructive",
      });
    }
  };

  const togglePlayer = (player: Player) => {
    const isSelected = selectedPlayers.some(
      (p) => p.player_id === player.id
    );

    if (isSelected) {
      setSelectedPlayers(
        selectedPlayers.filter((p) => p.player_id !== player.id)
      );
    } else {
      setSelectedPlayers([
        ...selectedPlayers,
        {
          player_id: player.id,
          initial_buyin: buyIn,
          total_rebuys: 0,
        } as GamePlayer,
      ]);
    }
  };

  // Changed from useState to useEffect
  useEffect(() => {
    fetchPlayers();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-white mb-6">New Game</h1>

        <Card className="p-6 mb-6">
          <div className="mb-4">
            <Label htmlFor="buyIn">Buy-in Amount</Label>
            <Input
              id="buyIn"
              type="number"
              value={buyIn}
              onChange={(e) => setBuyIn(Number(e.target.value))}
              className="max-w-xs"
            />
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Select Players</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`p-4 rounded-lg cursor-pointer ${
                    selectedPlayers.some((p) => p.player_id === player.id)
                      ? "bg-primary text-primary-foreground"
                      : "bg-card hover:bg-accent"
                  }`}
                  onClick={() => togglePlayer(player)}
                >
                  <h3 className="font-medium">{player.name}</h3>
                  <p className="text-sm opacity-80">{player.email}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate("/games")}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateGame}
              disabled={selectedPlayers.length === 0}
            >
              Create Game
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default NewGame;