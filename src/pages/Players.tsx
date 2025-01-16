import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Player = Tables<"players">;

const Players = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerEmail, setNewPlayerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch players on component mount
  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      console.log("Fetching players...");
      const { data, error } = await supabase.from("players").select("*");
      
      if (error) {
        throw error;
      }

      console.log("Players fetched:", data);
      setPlayers(data || []);
    } catch (error) {
      console.error("Error fetching players:", error);
      toast({
        title: "Error",
        description: "Failed to load players",
        variant: "destructive",
      });
    }
  };

  const addPlayer = async () => {
    if (!newPlayerName.trim() || !newPlayerEmail.trim()) {
      toast({
        title: "Error",
        description: "Please provide both name and email",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log("Adding new player:", { name: newPlayerName, email: newPlayerEmail });
      const { data, error } = await supabase
        .from("players")
        .insert([
          {
            name: newPlayerName.trim(),
            email: newPlayerEmail.trim(),
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log("Player added successfully:", data);
      setPlayers([...players, data]);
      setNewPlayerName("");
      setNewPlayerEmail("");
      toast({
        title: "Success",
        description: "Player added successfully",
      });
    } catch (error) {
      console.error("Error adding player:", error);
      toast({
        title: "Error",
        description: "Failed to add player",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-white mb-6">Players</h1>
        
        <Card className="p-6 mb-8">
          <div className="flex flex-col gap-4">
            <div>
              <Input
                placeholder="Player name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="mb-2"
              />
              <Input
                placeholder="Player email"
                type="email"
                value={newPlayerEmail}
                onChange={(e) => setNewPlayerEmail(e.target.value)}
              />
            </div>
            <Button 
              onClick={addPlayer} 
              disabled={loading}
              className="w-full md:w-auto"
            >
              {loading ? "Adding..." : "Add Player"}
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((player) => (
            <Card key={player.id} className="p-4">
              <h3 className="text-xl font-semibold mb-2">{player.name}</h3>
              <p className="text-gray-500 dark:text-gray-400">{player.email}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Players;