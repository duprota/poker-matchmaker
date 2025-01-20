import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Player = Tables<"players">;

const NewGame = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [buyIn, setBuyIn] = useState<number>(100);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState<string>("");
  const [place, setPlace] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log("Auth check result:", { user, error: userError });
        
        if (userError) {
          console.error("Auth check error:", userError);
          toast({
            title: "Authentication Error",
            description: "Please sign in to create a game",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        if (!user) {
          console.log("No authenticated user found");
          toast({
            title: "Authentication Required",
            description: "Please sign in to create a game",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error checking authentication:", error);
        toast({
          title: "Error",
          description: "Failed to verify authentication status",
          variant: "destructive",
        });
        navigate("/");
      }
    };

    checkAuth();
  }, [navigate, toast]);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        console.log("Fetching players...");
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
        console.log("Players fetched successfully:", data);
        setPlayers(data);
      } catch (error) {
        console.error("Error in fetchPlayers:", error);
        toast({
          title: "Error",
          description: "Failed to load players",
          variant: "destructive",
        });
      }
    };

    if (isAuthenticated) {
      fetchPlayers();
    }
  }, [toast, isAuthenticated]);

  const handleCreateGame = async () => {
    if (selectedPlayers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one player",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log("Starting game creation process...");
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Error getting user:", userError);
        throw new Error("Failed to get user information");
      }

      if (!user) {
        console.error("No authenticated user found");
        throw new Error("No authenticated user found");
      }

      console.log("Creating game with manager_id:", user.id);

      // Create new game with manager_id
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .insert([{ 
          status: "ongoing",
          name,
          place,
          date: date.toISOString(),
          manager_id: user.id
        }])
        .select()
        .maybeSingle();

      if (gameError) {
        console.error("Error creating game:", gameError);
        throw new Error(gameError.message);
      }

      if (!gameData) {
        console.error("No game data returned after creation");
        throw new Error("Failed to create game - no data returned");
      }

      console.log("Game created successfully:", gameData);

      // Add selected players to the game
      const gamePlayers = selectedPlayers.map((playerId) => ({
        game_id: gameData.id,
        player_id: playerId,
        initial_buyin: buyIn,
        total_rebuys: 0,
      }));

      const { error: playersError } = await supabase
        .from("game_players")
        .insert(gamePlayers);

      if (playersError) {
        console.error("Error adding players to game:", playersError);
        throw new Error(playersError.message);
      }

      console.log("Players added successfully");

      toast({
        title: "Success",
        description: "Game created successfully",
      });

      navigate("/games");
    } catch (error) {
      console.error("Error in handleCreateGame:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create game",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerSelect = (playerId: string) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter((id) => id !== playerId));
    } else {
      setSelectedPlayers([...selectedPlayers, playerId]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-muted">
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-6">
          New Game
        </h1>

        <Card className="p-6 mb-6 bg-card/80 backdrop-blur-sm border-primary/10">
          <div className="space-y-6">
            <div>
              <Label htmlFor="name">Game Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter game name"
                className="max-w-xs"
              />
            </div>

            <div>
              <Label htmlFor="place">Place</Label>
              <Input
                id="place"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="Enter game location"
                className="max-w-xs"
              />
            </div>

            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[280px] justify-start text-left font-normal"
                  >
                    {format(date, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border shadow-md">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                    className="bg-background rounded-md"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="buyIn">Buy-in Amount</Label>
              <Input
                id="buyIn"
                type="number"
                value={buyIn}
                onChange={(e) => setBuyIn(Number(e.target.value))}
                className="max-w-xs"
              />
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Select Players</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`p-4 rounded-lg cursor-pointer ${
                      selectedPlayers.includes(player.id)
                        ? "bg-primary text-primary-foreground"
                        : "bg-card hover:bg-accent"
                    }`}
                    onClick={() => handlePlayerSelect(player.id)}
                  >
                    <h3 className="font-medium">{player.name}</h3>
                    {player.email && <p className="text-sm opacity-80">{player.email}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate("/games")}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateGame}
                disabled={selectedPlayers.length === 0 || loading}
                className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? "Creating..." : "Create Game"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default NewGame;