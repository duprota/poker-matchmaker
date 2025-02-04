import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { GameStatus } from "@/types/game";
import { Card } from "@/components/ui/card";
import { PlayerRebuysCard } from "./PlayerRebuysCard";

export interface OngoingGameFormProps {
  players: any[];
  rebuys: Record<string, number>;
  onRebuyChange: (playerId: string, value: string) => void;
  onSaveRebuys: () => void;
  savingRebuys: boolean;
  setRebuys: (rebuys: Record<string, number>) => void;
}

export const OngoingGameForm = ({
  players,
  rebuys,
  onRebuyChange,
  onSaveRebuys,
  savingRebuys,
  setRebuys,
}: OngoingGameFormProps) => {
  const { toast } = useToast();
  const [updatingPlayer, setUpdatingPlayer] = useState<string | null>(null);

  const handleRebuyChange = async (playerId: string, newRebuys: number) => {
    try {
      console.log("Starting rebuy change:", { playerId, newRebuys });
      setUpdatingPlayer(playerId);

      // Update game_players table
      const { error: updateError } = await supabase
        .from("game_players")
        .update({ total_rebuys: newRebuys })
        .eq("id", playerId);

      if (updateError) throw updateError;

      // Get the player info for the history entry
      const player = players.find(p => p.id === playerId);
      
      // Add to game history
      const { error: historyError } = await supabase
        .from("game_history")
        .insert({
          game_id: player.game_id,
          game_player_id: playerId,
          event_type: "rebuy",
          amount: newRebuys
        });

      if (historyError) throw historyError;

      // Update local state with proper typing
      const newRebuysState: Record<string, number> = {
        ...rebuys,
        [playerId]: newRebuys
      };
      setRebuys(newRebuysState);
      onRebuyChange(playerId, String(newRebuys));

      console.log("Rebuy change completed successfully");
      toast({
        title: "Success",
        description: "Rebuy registered successfully",
      });
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
        {players.map((gamePlayer) => (
          <PlayerRebuysCard
            key={gamePlayer.id}
            player={gamePlayer}
            onRebuyChange={handleRebuyChange}
            isUpdating={updatingPlayer === gamePlayer.id}
          />
        ))}
      </div>
    </div>
  );
};