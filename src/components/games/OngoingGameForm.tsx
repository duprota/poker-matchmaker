
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { GameStatus } from "@/types/game";
import { PlayerGameCard } from "./PlayerGameCard";

export interface OngoingGameFormProps {
  players: any[];
  rebuys: Record<string, number>;
  onRebuyChange: (playerId: string, value: string) => void;
  onSaveRebuys: () => void;
  savingRebuys: boolean;
  setRebuys: (rebuys: Record<string, number>) => void;
  onRemovePlayer?: (playerId: string) => void;
}

export const OngoingGameForm = ({
  players,
  onRemovePlayer,
}: OngoingGameFormProps) => {
  const { toast } = useToast();
  const [updatingPlayer, setUpdatingPlayer] = useState<string | null>(null);
  
  const sortedPlayers = [...players].sort((a, b) => 
    a.player.name.localeCompare(b.player.name)
  );

  const handleRebuyChange = async (playerId: string, newRebuys: number) => {
    try {
      console.log("Starting rebuy change:", { playerId, newRebuys });
      setUpdatingPlayer(playerId);

      const { error: updateError } = await supabase
        .from("game_players")
        .update({ total_rebuys: newRebuys })
        .eq("id", playerId);

      if (updateError) throw updateError;

      const player = players.find(p => p.id === playerId);
      if (!player) {
        throw new Error("Player not found");
      }
      
      const { error: historyError } = await supabase
        .from("game_history")
        .insert({
          game_id: player.game_id,
          game_player_id: playerId,
          event_type: "rebuy",
          amount: newRebuys
        });

      if (historyError) throw historyError;
      
      toast({
        title: "Success",
        description: "Rebuy registered successfully",
      });

      window.location.reload();
      
    } catch (error) {
      console.error("Error updating rebuys:", error);
      toast({
        title: "Error",
        description: "Failed to register rebuy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingPlayer(null);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Game Progress</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedPlayers.map((gamePlayer) => (
          <PlayerGameCard
            key={gamePlayer.id}
            player={gamePlayer}
            onRebuyChange={handleRebuyChange}
            onRemovePlayer={onRemovePlayer}
            isProcessing={updatingPlayer === gamePlayer.id}
          />
        ))}
      </div>
    </div>
  );
};
