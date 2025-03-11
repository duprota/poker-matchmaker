
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Pencil, Trash2, Key } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AvatarUploader } from "@/components/players/AvatarUploader";

type Player = Tables<"players">;

const Players = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerEmail, setNewPlayerEmail] = useState("");
  const [newPlayerPixKey, setNewPlayerPixKey] = useState("");
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
    if (!newPlayerName.trim()) {
      toast({
        title: "Error",
        description: "Please provide a name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log("Adding new player:", { 
        name: newPlayerName, 
        email: newPlayerEmail || null,
        pix_key: newPlayerPixKey 
      });
      
      const { data, error } = await supabase
        .from("players")
        .insert([
          {
            name: newPlayerName.trim(),
            email: newPlayerEmail.trim() || null,
            pix_key: newPlayerPixKey.trim() || null,
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
      setNewPlayerPixKey("");
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

  const updatePlayer = async () => {
    if (!editingPlayer || !editingPlayer.name.trim()) {
      toast({
        title: "Error",
        description: "Please provide a name",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Updating player:", editingPlayer);
      const { error } = await supabase
        .from("players")
        .update({
          name: editingPlayer.name.trim(),
          email: editingPlayer.email?.trim() || null,
          pix_key: editingPlayer.pix_key?.trim() || null,
        })
        .eq("id", editingPlayer.id);

      if (error) {
        throw error;
      }

      setPlayers(players.map(p => 
        p.id === editingPlayer.id ? editingPlayer : p
      ));
      setEditingPlayer(null);
      toast({
        title: "Success",
        description: "Player updated successfully",
      });
    } catch (error) {
      console.error("Error updating player:", error);
      toast({
        title: "Error",
        description: "Failed to update player",
        variant: "destructive",
      });
    }
  };

  const deletePlayer = async (playerId: string) => {
    try {
      console.log("Deleting player:", playerId);
      const { error } = await supabase
        .from("players")
        .delete()
        .eq("id", playerId);

      if (error) {
        throw error;
      }

      setPlayers(players.filter(p => p.id !== playerId));
      toast({
        title: "Success",
        description: "Player deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting player:", error);
      toast({
        title: "Error",
        description: "Failed to delete player",
        variant: "destructive",
      });
    }
  };

  const updatePlayerAvatar = async (playerId: string, avatarUrl: string) => {
    try {
      console.log("Updating player avatar:", playerId, avatarUrl);
      const { error } = await supabase
        .from("players")
        .update({ avatar_url: avatarUrl })
        .eq("id", playerId);

      if (error) {
        throw error;
      }

      // Update local state
      setPlayers(players.map(p => 
        p.id === playerId ? { ...p, avatar_url: avatarUrl } : p
      ));
      
      // Update editing player if relevant
      if (editingPlayer?.id === playerId) {
        setEditingPlayer({ ...editingPlayer, avatar_url: avatarUrl });
      }

      return Promise.resolve();
    } catch (error) {
      console.error("Error updating player avatar:", error);
      return Promise.reject(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-muted">
        <Navigation />
        <div className="container mx-auto py-8">
          <p className="text-foreground font-medium">Loading players...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-muted">
      <Navigation />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-6">Players</h1>
        
        <Card className="p-6 mb-8 bg-card/80 backdrop-blur-sm border-primary/10">
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Input
                placeholder="Player name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
              />
              <Input
                placeholder="Player email (optional)"
                type="email"
                value={newPlayerEmail}
                onChange={(e) => setNewPlayerEmail(e.target.value)}
              />
              <Input
                placeholder="PIX key (optional)"
                value={newPlayerPixKey}
                onChange={(e) => setNewPlayerPixKey(e.target.value)}
                className="flex items-center"
              />
            </div>
            <Button 
              onClick={addPlayer} 
              disabled={loading}
              className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? "Adding..." : "Add Player"}
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => (
            <Card 
              key={player.id} 
              className="p-6 bg-card/80 backdrop-blur-sm border-primary/10 hover:border-primary/20 transition-all duration-200 hover:shadow-lg group"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <AvatarUploader
                      playerId={player.id}
                      currentAvatar={player.avatar_url}
                      onAvatarChange={(url) => updatePlayerAvatar(player.id, url)}
                    />
                    <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                      {player.name}
                    </h3>
                  </div>
                  {player.email && (
                    <p className="text-muted-foreground">{player.email}</p>
                  )}
                  {player.pix_key && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Key className="h-4 w-4" />
                      <span>{player.pix_key}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingPlayer(player)}
                        className="hover:bg-primary/10"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card/95 backdrop-blur-lg">
                      <DialogHeader>
                        <DialogTitle>Edit Player</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="flex justify-center mb-4">
                          <AvatarUploader
                            playerId={editingPlayer?.id || ''}
                            currentAvatar={editingPlayer?.avatar_url}
                            onAvatarChange={(url) => updatePlayerAvatar(editingPlayer?.id || '', url)}
                          />
                        </div>
                        <Input
                          placeholder="Player name"
                          value={editingPlayer?.name || ""}
                          onChange={(e) => setEditingPlayer(prev => 
                            prev ? { ...prev, name: e.target.value } : null
                          )}
                        />
                        <Input
                          placeholder="Player email (optional)"
                          type="email"
                          value={editingPlayer?.email || ""}
                          onChange={(e) => setEditingPlayer(prev => 
                            prev ? { ...prev, email: e.target.value } : null
                          )}
                        />
                        <Input
                          placeholder="PIX key (optional)"
                          value={editingPlayer?.pix_key || ""}
                          onChange={(e) => setEditingPlayer(prev => 
                            prev ? { ...prev, pix_key: e.target.value } : null
                          )}
                        />
                        <Button 
                          onClick={updatePlayer} 
                          className="w-full bg-primary hover:bg-primary/90"
                        >
                          Update Player
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deletePlayer(player.id)}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Players;
