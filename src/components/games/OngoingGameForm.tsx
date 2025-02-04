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

  const handleRebuyChange = async (playerId: string, newRebuys: number) => {
    console.log("Handling rebuy change:", { playerId, newRebuys });
    setRebuys({ ...rebuys, [playerId]: newRebuys });
    onRebuyChange(playerId, String(newRebuys));
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
          />
        ))}
      </div>
    </div>
  );
};