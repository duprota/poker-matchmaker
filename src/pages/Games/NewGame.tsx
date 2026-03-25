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
import { Switch } from "@/components/ui/switch";
import { Trophy } from "lucide-react";
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
  const [isGrandSlam, setIsGrandSlam] = useState(false);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const { data, error } = await supabase.from("players").select("*");
        if (error) {
          toast({ title: "Error", description: "Failed to load players", variant: "destructive" });
          return;
        }
        setPlayers(data);
      } catch {
        toast({ title: "Error", description: "Failed to load players", variant: "destructive" });
      }
    };
    fetchPlayers();
  }, [toast]);

  const handleCreateGame = async () => {
    if (selectedPlayers.length === 0) {
      toast({ title: "Error", description: "Please select at least one player", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .insert([{ 
          status: "created",
          name,
          place,
          date: date.toISOString(),
          is_grand_slam: isGrandSlam,
        }])
        .select()
        .single();

      if (gameError) throw new Error(gameError.message);
      if (!gameData) throw new Error("Failed to create game - no data returned");

      const gamePlayers = selectedPlayers.map((playerId) => ({
        game_id: gameData.id,
        player_id: playerId,
        initial_buyin: buyIn,
        total_rebuys: 0,
      }));

      const { error: playersError } = await supabase
        .from("game_players")
        .insert(gamePlayers);

      if (playersError) throw new Error(playersError.message);

      toast({ title: "Success", description: "Game created successfully" });
      navigate("/games");
    } catch (error) {
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

            {/* Grand Slam toggle */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <div className="flex-1">
                <Label htmlFor="grand-slam" className="text-sm font-medium cursor-pointer">
                  Grand Slam 🏆
                </Label>
                <p className="text-xs text-muted-foreground">
                  Marca este jogo como evento especial (2000 pts para o 1º)
                </p>
              </div>
              <Switch
                id="grand-slam"
                checked={isGrandSlam}
                onCheckedChange={setIsGrandSlam}
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